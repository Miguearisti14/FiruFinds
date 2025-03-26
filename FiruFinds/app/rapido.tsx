import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location'; // Importamos expo-location
import { supabase } from '../lib/supabase';

export default function Rapido() {
    const [location, setLocation] = useState('');
    const [reference, setReference] = useState('');
    const [phone, setPhone] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [initialRegion, setInitialRegion] = useState({
        latitude: 6.2442,  // Medellín, Colombia
        longitude: -75.5812,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    // Solicitar permisos de ubicación y obtener la ubicación actual
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permiso de ubicación denegado. Usando ubicación predeterminada.');
                return;
            }

            const userLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = userLocation.coords;

            setCoordinates({ lat: latitude, lng: longitude });
            setInitialRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });

        })();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Se requieren permisos para acceder a la galería.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const uploadImage = async () => {
        if (!imageUri) return null;
        try {
            setUploading(true);
            const imageName = `image-${Date.now()}.jpg`;

            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            if (!fileInfo.exists) {
                console.error('El archivo no existe');
                return null;
            }

            const file = {
                uri: imageUri,
                name: imageName,
                type: 'image/jpeg',
            };

            const { data, error } = await supabase.storage
                .from('images')
                .upload(imageName, file, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (error) {
                console.error('Error al subir imagen:', error.message);
                return null;
            }

            const publicUrl = supabase.storage.from('images').getPublicUrl(imageName).data.publicUrl;
            return publicUrl;
        } catch (err) {
            console.error('Error en uploadImage:', err);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleReport = async () => {
        const imageUrl = await uploadImage();
        if (!imageUrl) {
            alert('Error al subir la imagen. Inténtalo nuevamente.');
            return;
        }
        if (!coordinates) {
            alert('Por favor selecciona una ubicación en el mapa.');
            return;
        }

        const { error } = await supabase
            .from('reportes_encontrados_anonimos')
            .insert([
                {
                    punto_referencia: reference,
                    telefono: phone,
                    image_url: imageUrl,
                    ubicacion: { lat: coordinates.lat, lng: coordinates.lng },
                },
            ]);

        if (error) {
            console.error('Error al guardar el reporte:', error.message);
            alert('Hubo un problema al guardar el reporte.');
        } else {
            alert('Reporte guardado exitosamente.');
            setLocation('');
            setReference('');
            setPhone('');
            setImageUri(null);
            setCoordinates(null);
        }
    };

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setCoordinates({ lat: latitude, lng: longitude });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

            <View style={styles.container}>
                <Text style={styles.title}>
                    Tómale una foto a la mascota que encontraste y súbela
                </Text>
                <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    ) : (
                        <>
                            <Ionicons name="image-outline" size={40} color="#777" />
                            <Text style={styles.imageText}>Subir una imagen</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>¿Dónde la encontraste?</Text>
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={initialRegion} // Usamos la región inicial dinámica
                        onPress={handleMapPress}
                    >
                        {coordinates && (
                            <Marker
                                coordinate={{ latitude: coordinates.lat, longitude: coordinates.lng }}
                                title="Ubicación seleccionada"
                            />
                        )}
                    </MapView>
                    {!coordinates && (
                        <Text style={styles.mapPlaceholderText}>Selecciona una ubicación...</Text>
                    )}
                </View>

                <Text style={styles.label}>Añade un punto de referencia</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Al lado de..."
                    value={reference}
                    onChangeText={setReference}
                />

                <Text style={styles.label}>Comparte un número para contactarte</Text>
                <TextInput
                    style={styles.input}
                    placeholder="301..."
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleReport}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Reportar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    imageContainer: {
        width: '100%',
        height: 120,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    imageText: { marginTop: 5, fontSize: 14, color: '#777' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        height: 40,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 5,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    mapContainer: {
        width: '100%',
        height: 200,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapPlaceholderText: {
        position: 'absolute',
        fontSize: 14,
        color: '#777',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF', // Fondo blanco para que coincida con el diseño
    },
});
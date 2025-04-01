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
    SafeAreaView,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

// Interfaces para las entidades de Supabase
interface Especie { id: number; nombre: string; }
interface Raza { id: number; nombre: string; especie_id: number; }
interface Color { id: number; nombre: string; }
interface Tamano { id: number; nombre: string; }
interface Coordenadas { lat: number; lng: number; }

interface SearchableDropdownProps {
    data: Especie[] | Raza[] | Color[] | Tamano[];
    value: number | null;
    onSelect: (id: number) => void;
    placeholder: string;
    disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    data,
    value,
    onSelect,
    placeholder,
    disabled = false
}) => {
    const [query, setQuery] = useState<string>('');
    const [filteredData, setFilteredData] = useState<(Especie | Raza | Color | Tamano)[]>([]);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);

    // Si se selecciona un elemento, mostrar su nombre en el input
    useEffect(() => {
        const selectedItem = data.find(item => item.id === value);
        if (selectedItem) {
            setQuery(selectedItem.nombre);
        }
    }, [value, data]);

    // Actualizar el filtrado cuando cambia el query
    useEffect(() => {
        if (query.length > 0) {
            const filtered = data.filter(item =>
                item.nombre.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredData(filtered);
            setShowDropdown(true);
        } else {
            setFilteredData([]);
            setShowDropdown(false);
        }
    }, [query, data]);

    return (
        <View style={[styles.dropdownContainer, { overflow: 'visible' }]}>
            <TextInput
                style={[
                    pickerSelectStyles.inputIOS,
                    disabled ? { backgroundColor: '#eee' } : {}
                ]}
                placeholder={placeholder}
                value={query}
                onChangeText={(text) => {
                    setQuery(text);
                }}
                editable={!disabled}
            />
            {showDropdown && filteredData.length > 0 && !disabled && (
                <View style={styles.dropdownList}>
                    {filteredData.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => {
                                onSelect(item.id);
                                setQuery(item.nombre);
                                setShowDropdown(false);
                            }}
                        >
                            <Text style={styles.dropdownItem}>{item.nombre}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

export default function Rapido() {
    const [reference, setReference] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [uploading, setUploading] = useState<boolean>(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<Coordenadas | null>(null);
    const [initialRegion, setInitialRegion] = useState({
        latitude: 6.2442,
        longitude: -75.5812,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    const [especieId, setEspecieId] = useState<number | null>(null);
    const [razaId, setRazaId] = useState<number | null>(null);
    const [colorId, setColorId] = useState<number | null>(null);
    const [tamanoId, setTamanoId] = useState<number | null>(null);
    const [especies, setEspecies] = useState<Especie[]>([]);
    const [razas, setRazas] = useState<Raza[]>([]);
    const [colores, setColores] = useState<Color[]>([]);
    const [tamanos, setTamanos] = useState<Tamano[]>([]);
    const [selectedEspecieId, setSelectedEspecieId] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: especiesData, error: especiesError } = await supabase
                    .from('especies')
                    .select('*');
                if (especiesError) throw especiesError;
                setEspecies(especiesData || []);

                const { data: coloresData, error: coloresError } = await supabase
                    .from('colores')
                    .select('*');
                if (coloresError) throw coloresError;
                setColores(coloresData || []);

                const { data: tamanosData, error: tamanosError } = await supabase
                    .from('tamanos')
                    .select('*');
                if (tamanosError) throw tamanosError;
                setTamanos(tamanosData || []);
            } catch (err) {
                console.error('Error al cargar datos:', err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchRazas = async () => {
            try {
                if (!selectedEspecieId) {
                    setRazas([]);
                    setRazaId(null);
                    return;
                }
                const { data: razasData, error: razasError } = await supabase
                    .from('razas')
                    .select('*')
                    .eq('especie_id', selectedEspecieId);
                if (razasError) throw razasError;
                setRazas(razasData || []);
            } catch (err) {
                console.error('Error al cargar razas:', err);
            }
        };
        fetchRazas();
    }, [selectedEspecieId]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permiso de ubicación denegado.');
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
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const uploadImage = async (): Promise<string | null> => {
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
                type: 'image/jpeg' as const,
            };
            const { error } = await supabase.storage
                .from('images')
                .upload(imageName, file, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });
            if (error) {
                console.error('Error al subir imagen:', error.message);
                return null;
            }
            const { data } = supabase.storage.from('images').getPublicUrl(imageName);
            return data.publicUrl;
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
            alert('Error al subir la imagen.');
            return;
        }
        if (!coordinates) {
            alert('Por favor selecciona una ubicación en el mapa.');
            return;
        }
        if (!especieId || !razaId || !colorId || !tamanoId) {
            alert('Por favor completa todos los campos de selección.');
            return;
        }
        const { error } = await supabase
            .from('reportes_encontrados')
            .insert({
                punto_referencia: reference,
                telefono: phone,
                image_url: imageUrl,
                ubicacion: coordinates,
                especie_id: especieId,
                raza_id: razaId,
                color_id: colorId,
                tamano_id: tamanoId,
            });
        if (error) {
            console.error('Error al guardar el reporte:', error.message);
            alert('Hubo un problema al guardar el reporte.');
        } else {
            alert('Reporte guardado exitosamente.');
            setReference('');
            setPhone('');
            setImageUri(null);
            setCoordinates(null);
            setEspecieId(null);
            setRazaId(null);
            setColorId(null);
            setTamanoId(null);
            setSelectedEspecieId(null);
        }
    };

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setCoordinates({ lat: latitude, lng: longitude });
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
                <View style={styles.container}>
                    <View style={styles.imageSection}>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>
                                Tómale una foto a la mascota que encontraste y súbela
                            </Text>
                        </View>
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
                    </View>
                    <Text style={styles.label}>¿Dónde la encontraste?</Text>
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={initialRegion}
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
                    <Text style={styles.label}>Especie de la mascota que encontraste</Text>
                    <SearchableDropdown
                        data={especies}
                        value={especieId}
                        placeholder="Selecciona una especie..."
                        onSelect={(id) => {
                            setEspecieId(id);
                            setSelectedEspecieId(id);
                            setRazaId(null);
                        }}
                    />
                    <Text style={styles.label}>Raza de la mascota que encontraste</Text>
                    <SearchableDropdown
                        data={razas}
                        value={razaId}
                        placeholder="Selecciona una raza..."
                        onSelect={(id) => setRazaId(id)}
                        disabled={!selectedEspecieId}
                    />
                    <Text style={styles.label}>Color de la mascota que encontraste</Text>
                    <SearchableDropdown
                        data={colores}
                        value={colorId}
                        placeholder="Selecciona un color..."
                        onSelect={(id) => setColorId(id)}
                    />
                    <Text style={styles.label}>Tamaño de la mascota que encontraste</Text>
                    <SearchableDropdown
                        data={tamanos}
                        value={tamanoId}
                        placeholder="Selecciona un tamaño..."
                        onSelect={(id) => setTamanoId(id)}
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    imageSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    textContainer: {
        flex: 1,
        paddingRight: 10,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderWidth: 1,
        borderColor: '#ccc',
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
        marginBottom: 50,
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
        overflow: 'visible',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapPlaceholderText: {
        position: 'absolute',
        fontSize: 14,
        color: '#777',
    },
    dropdownContainer: {
        marginBottom: 15,
        position: 'relative',
        zIndex: 1000,
    },
    dropdownList: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#ccc',
        maxHeight: 150,
        zIndex: 1000,
        elevation: 1000,
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        height: 40,
        marginBottom: 15,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#FFF',
    },
    inputAndroid: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        height: 40,
        marginBottom: 15,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#FFF',
    },
});

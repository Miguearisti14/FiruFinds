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
    ScrollView,
    ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

// Componente de autocompletado para dropdowns
const SearchableDropdown = ({ data, value, onSelect, placeholder, disabled }) => {
    const [query, setQuery] = useState(value || '');
    const [filteredData, setFilteredData] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (typeof value === 'string') {
            setQuery(value);
        }
    }, [value]);

    useEffect(() => {
        if (query.length > 0) {
            setFilteredData(
                data.filter(item =>
                    item.nombre.toLowerCase().includes(query.toLowerCase())
                )
            );
        } else {
            setFilteredData(data);
        }
    }, [query, data]);

    return (

        <View style={styles.dropdownContainer}>
            <TextInput
                style={[
                    pickerSelectStyles.inputIOS,
                    disabled ? { backgroundColor: '#eee' } : {}
                ]}
                placeholder={placeholder}
                value={query}
                onChangeText={text => {
                    setQuery(text);
                    setShowDropdown(true);
                }}
                editable={!disabled}
            />
            {showDropdown && filteredData.length > 0 && !disabled && (
                <View style={styles.dropdown}>
                    <ScrollView
                        nestedScrollEnabled={true}
                        style={{ maxHeight: 150 }} // Puedes ajustar el alto según necesites
                    >
                        {filteredData.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                    onSelect(item);
                                    setQuery(item.nombre);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text style={styles.dropdownItem}>{item.nombre}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export default function Rapido() {
    const [location, setLocation] = useState('');
    const [reference, setReference] = useState('');
    const [phone, setPhone] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [coordinates, setCoordinates] = useState(null);
    const [initialRegion, setInitialRegion] = useState({
        latitude: 6.2442,  // Medellín, Colombia
        longitude: -75.5812,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    // Estados para los nuevos campos de selección
    const [especie, setEspecie] = useState(null);
    const [raza, setRaza] = useState(null);
    const [color, setColor] = useState(null);
    const [tamano, setTamano] = useState(null);
    // Estados para los datos de los dropdowns
    const [especies, setEspecies] = useState([]);
    const [razas, setRazas] = useState([]);
    const [colores, setColores] = useState([]);
    const [tamanos, setTamanos] = useState([]);
    const [selectedEspecieId, setSelectedEspecieId] = useState(null);
    const router = useRouter();

    // Cargar datos de las tablas de Supabase para los dropdowns
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar especies
                const { data: especiesData, error: especiesError } = await supabase
                    .from('especies')
                    .select('*');
                if (especiesError) throw especiesError;
                setEspecies(especiesData || []);

                // Cargar colores
                const { data: coloresData, error: coloresError } = await supabase
                    .from('colores')
                    .select('*');
                if (coloresError) throw coloresError;
                setColores(coloresData || []);

                // Cargar tamaños
                const { data: tamanosData, error: tamanosError } = await supabase
                    .from('tamanos')
                    .select('*');
                if (tamanosError) throw tamanosError;
                setTamanos(tamanosData || []);
            } catch (err) {
                console.error('Error al cargar datos de los dropdowns:', err);
            }
        };

        fetchData();
    }, []);

    // Cargar razas cuando cambie la especie seleccionada
    useEffect(() => {
        const fetchRazas = async () => {
            try {
                if (!selectedEspecieId) {
                    setRazas([]);
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

    // Seleccionar imagen de galería
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

    // Subir imagen a Supabase Storage
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

    // Función para enviar el reporte
    const handleReport = async () => {
        const imageUrl = await uploadImage();

        if (!phone.trim()) {
            alert('Por favor ingresa un número de teléfono.');
            return;
        }

        if (!imageUrl) {
            alert('Error al subir la imagen. Inténtalo nuevamente.');
            return;
        }
        if (!coordinates) {
            alert('Por favor selecciona una ubicación en el mapa.');
            return;
        }
        if (!especie || !raza || !color || !tamano) {
            alert('Por favor completa todos los campos de selección.');
            return;
        }

        const { error } = await supabase
            .from('reportes_encontrados')
            .insert([
                {
                    punto_referencia: reference,
                    telefono: phone,
                    image_url: imageUrl,
                    ubicacion: { lat: coordinates.lat, lng: coordinates.lng },
                    especie_id: especie,  // Puedes ajustar para enviar el ID en vez del nombre si es necesario
                    raza_id: raza,
                    color_id: color,
                    tamano_id: tamano,
                },
            ]);

        if (error) {
            console.error('Error al guardar el reporte:', error.message);
            alert('Hubo un problema al guardar el reporte.');
        } else {
            setLocation('');
            setReference('');
            setPhone('');
            setImageUri(null);
            setCoordinates(null);
            setEspecie(null);
            setRaza(null);
            setColor(null);
            setTamano(null);
            setSelectedEspecieId(null);

            router.push('/agradecimiento');
        }
    };

    // Evento al presionar el mapa
    const handleMapPress = (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setCoordinates({ lat: latitude, lng: longitude });
    };

    return (
        <ScrollView style={{ flex: 1 }}>
            <ImageBackground
                source={require('../assets/images/fondo.png')}
                style={styles.background}
                resizeMode="cover" // 'cover', 'contain', 'stretch', etc.
            >
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
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

                        {/* Campo: Especie */}
                        <Text style={styles.label}>Especie de la mascota que encontraste</Text>
                        <SearchableDropdown
                            data={especies}
                            value={especie}
                            placeholder="Selecciona una especie..."
                            onSelect={(item) => {
                                setEspecie(item);
                                setEspecie(item.id);
                                setSelectedEspecieId(item);
                                setSelectedEspecieId(item.id);
                                setRaza(null); // Reseteamos la raza al cambiar la especie
                            }}
                        />

                        {/* Campo: Raza */}
                        <Text style={styles.label}>Raza de la mascota que encontraste</Text>
                        <SearchableDropdown
                            data={razas}
                            value={raza}
                            placeholder="Selecciona una raza..."
                            onSelect={(item) => {
                                setRaza(item);
                                setRaza(item.id);

                            }}
                            disabled={!selectedEspecieId}
                        />

                        {/* Campo: Color */}
                        <Text style={styles.label}>Color de la mascota que encontraste</Text>
                        <SearchableDropdown
                            data={colores}
                            value={color}
                            placeholder="Selecciona un color..."
                            onSelect={(item) => {
                                setColor(item);
                                setColor(item.id);

                            }}
                        />

                        {/* Campo: Tamaño */}
                        <Text style={styles.label}>Tamaño de la mascota que encontraste</Text>
                        <SearchableDropdown
                            data={tamanos}
                            value={tamano}
                            placeholder="Selecciona un tamaño..."
                            onSelect={(item) => {
                                setTamano(item);
                                setTamano(item.id);

                            }}
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
            </ImageBackground>
        </ScrollView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,

        paddingHorizontal: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',

    },
    imageText: {
        marginTop: 5,
        fontSize: 14,
        color: '#777',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        height: 40,
        marginBottom: 15,
        backgroundColor: '#FFF'
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 5,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 50,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    mapContainer: {
        width: '100%',
        height: 200,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
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
    // Estilos para el dropdown
    dropdownContainer: {
        marginBottom: 15,
    },
    dropdown: {

        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#FFF',
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    background: {
        flex: 1,
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
    placeholder: {
        color: '#777',
    },

});

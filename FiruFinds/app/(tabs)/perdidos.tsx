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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';


// Componente de autocompletado para dropdowns
const SearchableDropdown = ({ data, value, onSelect, placeholder, disabled }) => {
    const [query, setQuery] = useState(typeof value === 'string' ? value : '');
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
                    disabled ? { backgroundColor: '#eee' } : {},
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
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
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

export default function Perdido() {
    // Estados para campos generales
    const [reference, setReference] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [initialRegion, setInitialRegion] = useState({
        latitude: 6.2442,  // Medellín, Colombia
        longitude: -75.5812,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    // Estados para campos de selección (dropdowns)
    const [especie, setEspecie] = useState<number | null>(null);
    const [raza, setRaza] = useState<number | null>(null);
    const [color, setColor] = useState<number | null>(null);
    const [tamano, setTamano] = useState<number | null>(null);
    const [especies, setEspecies] = useState<any[]>([]);
    const [razas, setRazas] = useState<any[]>([]);
    const [colores, setColores] = useState<any[]>([]);
    const [tamanos, setTamanos] = useState<any[]>([]);
    const [selectedEspecieId, setSelectedEspecieId] = useState<number | null>(null);

    // Estados para los campos nuevos en reportes perdidos
    const [petName, setPetName] = useState(''); // nombre de la mascota
    const [healthStatus, setHealthStatus] = useState(''); // estado de salud
    const [reward, setReward] = useState('0'); // valor de recompensa
    const router = useRouter();


    // Cargar datos de los dropdowns desde Supabase
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
                console.error('Error al cargar datos de los dropdowns:', err);
            }
        };

        fetchData();
    }, []);

    // Cargar razas al cambiar la especie seleccionada
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

    // Obtener ubicación actual
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

    const handleReport = async (tipoReporte) => {
        // Verificar que se hayan completado los campos obligatorios
        if (!petName || !healthStatus) {
            alert('Por favor completa los campos: Nombre de la mascota, Estado de salud y Valor de recompensa.');
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

        const imageUrl = await uploadImage();
        if (!imageUrl) {
            alert('Error al subir la imagen. Inténtalo nuevamente.');
            return;
        }

        // Obtener usuario actual (usuario_id)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Usuario no autenticado');
            return;
        }

        const { error } = await supabase
            .from('reportes_perdidos')
            .insert([
                {
                    nombre: petName,
                    estado_de_salud: healthStatus,
                    valor_recompensa: reward,
                    usuario_id: user.id,
                    punto_referencia: reference,
                    image_url: imageUrl,
                    ubicacion: { lat: coordinates.lat, lng: coordinates.lng },
                    especie_id: especie,
                    raza_id: raza,
                    color_id: color,
                    tamano_id: tamano,
                },
            ]);

        if (error) {
            console.error('Error al guardar el reporte:', error.message);
            alert('Hubo un problema al guardar el reporte.');
        } else {
            // Resetear campos
            setReference('');
            setImageUri(null);
            setCoordinates(null);
            setEspecie(null);
            setRaza(null);
            setColor(null);
            setTamano(null);
            setSelectedEspecieId(null);
            setPetName('');
            setHealthStatus('');
            setReward('');

            router.push(`/agradecimiento_log?tipoReporte=${tipoReporte}`);
        }
    };

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setCoordinates({ lat: latitude, lng: longitude });
    };

    return (
        <ScrollView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
                <View style={styles.container}>
                    {/* Sección para subir imagen */}
                    <View style={styles.imageSection}>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>
                                Tómale una foto a la mascota que perdiste y súbela
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

                    {/* Mapa para seleccionar ubicación */}
                    <Text style={styles.label}>¿Dónde se perdió?</Text>
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

                    {/* Punto de referencia */}
                    <Text style={styles.label}>Añade un punto de referencia (opcional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Al lado de..."
                        value={reference}
                        onChangeText={setReference}
                    />

                    {/* Campo: Nombre de la mascota */}
                    <Text style={styles.label}>Nombre de la mascota</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingresa el nombre"
                        value={petName}
                        onChangeText={setPetName}
                    />

                    {/* Campo: Estado de salud */}
                    <Text style={styles.label}>Estado de salud</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Herida, sana, etc."
                        value={healthStatus}
                        onChangeText={setHealthStatus}
                    />

                    {/* Campo: Valor de recompensa */}
                    <Text style={styles.label}>Valor de recompensa (opcional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingresa el monto"
                        keyboardType="numeric"
                        value={reward}
                        onChangeText={setReward}
                    />

                    {/* Dropdown: Especie */}
                    <Text style={styles.label}>Especie de la mascota</Text>
                    <SearchableDropdown
                        data={especies}
                        value={''}
                        placeholder="Selecciona una especie..."
                        onSelect={(item) => {
                            setEspecie(item.id);
                            setSelectedEspecieId(item.id);
                            setRaza(null); // Reinicia raza al cambiar especie
                        }}
                    />

                    {/* Dropdown: Raza */}
                    <Text style={styles.label}>Raza de la mascota</Text>
                    <SearchableDropdown
                        data={razas}
                        value={''}
                        placeholder="Selecciona una raza..."
                        onSelect={(item) => {
                            setRaza(item.id);
                        }}
                        disabled={!selectedEspecieId}
                    />

                    {/* Dropdown: Color */}
                    <Text style={styles.label}>Color de la mascota</Text>
                    <SearchableDropdown
                        data={colores}
                        value={''}
                        placeholder="Selecciona un color..."
                        onSelect={(item) => {
                            setColor(item.id);
                        }}
                    />

                    {/* Dropdown: Tamaño */}
                    <Text style={styles.label}>Tamaño de la mascota</Text>
                    <SearchableDropdown
                        data={tamanos}
                        value={''}
                        placeholder="Selecciona un tamaño..."
                        onSelect={(item) => {
                            setTamano(item.id);
                        }}
                    />

                    <TouchableOpacity style={styles.button} onPress={() => handleReport('perdidos')} disabled={uploading}>
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
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
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
    imageContainer: {
        width: 120,
        height: 120,
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
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
        backgroundColor: '#FFF',
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

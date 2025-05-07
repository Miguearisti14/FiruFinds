// app/detalles.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Alert,
    Modal,
    ImageBackground,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import MapView, { Marker } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ReportDetail() {
    // Parámetros de navegación
    const { type, id, from, query, selectedCategory, selectedReportType } =
        useLocalSearchParams<{
            type: 'lost' | 'found';
            id: string;
            from?: string;
            query?: string;
            selectedCategory?: string;
            selectedReportType?: string;
        }>();
    const router = useRouter();

    // Estado para reporte, sesión de usuario y modal de imagen
    const [pet, setPet] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // 1) Obtener userId de la sesión
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user.id || null);
        });
    }, []);

    // 2) Cargar detalles del reporte (incluye usuario_id)
    useEffect(() => {
        const table = type === 'lost' ? 'reportes_perdidos' : 'reportes_encontrados';
        supabase
            .from(table)
            .select(`
        *,
        razas(nombre),
        tamanos(nombre),
        especies(nombre),
        colores(nombre),
        usuarios(phone),
        usuario_id
      `)
            .eq('id', id)
            .single()
            .then(({ data, error }) => {
                if (error) console.error(error);
                else setPet(data);
            });
    }, [type, id]);

    if (!pet) {
        return (
            <View style={styles.loading}>
                <Text>Cargando...</Text>
            </View>
        );
    }

    // Manejo de WhatsApp
    const phoneToShow = pet.telefono ?? pet.usuarios?.phone;
    const formatForWhatsApp = (raw?: string | number) => {
        let str = raw ? String(raw) : '';
        let digits = str.replace(/\D/g, '');
        if (!digits.startsWith('57')) digits = '57' + digits;
        return digits;
    };
    const handleWhatsApp = () => {
        if (!phoneToShow) return Alert.alert('Error', 'No hay número disponible.');
        const url = `https://wa.me/${formatForWhatsApp(phoneToShow)}`;
        Linking.canOpenURL(url)
            .then(supported => supported ? Linking.openURL(url) : Alert.alert('Error', '¿WhatsApp instalado?'))
            .catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp.'));
    };

    // Confirmar y eliminar reporte
    const handleDelete = () => {
        Alert.alert(
            'Confirmar eliminación',
            '¿Seguro que quieres eliminar este reporte?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const table = type === 'lost'
                            ? 'reportes_perdidos'
                            : 'reportes_encontrados';
                        const { error } = await supabase
                            .from(table)
                            .delete()
                            .eq('id', id);
                        if (error) {
                            Alert.alert('Error', 'No se pudo eliminar el reporte.');
                        } else {
                            Alert.alert('Eliminado', 'El reporte ha sido eliminado.');
                            // Regresar a Mis Reportes
                            router.push('/mis_reportes');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <ImageBackground
                source={require('../assets/images/fondo.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>{pet.nombre}</Text>

                    {/* Imagen clicable */}
                    <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                        <Image source={{ uri: pet.image_url }} style={styles.image} />
                    </TouchableOpacity>

                    {/* Detalles */}
                    <Text style={styles.field}><Text style={styles.bold}>Especie: </Text>{pet.especies?.nombre}</Text>
                    <Text style={styles.field}><Text style={styles.bold}>Raza: </Text>{pet.razas?.nombre}</Text>
                    <Text style={styles.field}><Text style={styles.bold}>Tamaño: </Text>{pet.tamanos?.nombre}</Text>
                    <Text style={styles.field}><Text style={styles.bold}>Color: </Text>{pet.colores?.nombre}</Text>
                    {pet.estado_de_salud && (
                        <Text style={styles.field}><Text style={styles.bold}>Salud: </Text>{pet.estado_de_salud}</Text>
                    )}
                    {type === 'lost' && (
                        <Text style={styles.field}><Text style={styles.bold}>Recompensa: </Text>{pet.valor_recompensa}</Text>
                    )}

                    {/* WhatsApp */}
                    {phoneToShow && (
                        <TouchableOpacity onPress={handleWhatsApp}>
                            <Text style={styles.field}>
                                <Text style={styles.bold}>Teléfono: </Text>
                                <Text style={styles.link}>{phoneToShow}</Text>
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Mapa */}
                    {pet.ubicacion && (
                        <View style={styles.mapContainer}>
                            <Text style={styles.field}>
                                <Text style={styles.bold}>Ubicación: </Text>{pet.punto_referencia}
                            </Text>
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: pet.ubicacion.lat,
                                    longitude: pet.ubicacion.lng,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: pet.ubicacion.lat,
                                        longitude: pet.ubicacion.lng,
                                    }}
                                    title={pet.nombre}
                                    description="Última ubicación"
                                />
                            </MapView>
                        </View>
                    )}

                    {/* Botón Eliminar sólo si es tu reporte */}
                    {userId === pet.usuario_id && (
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Text style={styles.deleteText}>Eliminar reporte</Text>
                        </TouchableOpacity>
                    )}

                    {/* Volver */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            if (from === 'mapas') router.push('/mapas');
                            else if (from === 'buscar') router.push({
                                pathname: '/buscar',
                                params: { query, selectedCategory, selectedReportType }
                            });
                            else router.back();
                        }}
                    >
                        <Text style={styles.buttonText}>Volver</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Modal imagen grande */}
                <Modal
                    animationType="fade"
                    transparent
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                        <Image source={{ uri: pet.image_url }} style={styles.modalImage} resizeMode="contain" />
                    </View>
                </Modal>
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    container: {
        padding: 20,

    },
    image: {
        width: '80%',
        height: 200,
        borderRadius: 16,
        marginBottom: 20,
        resizeMode: 'cover',
        alignSelf: 'center',
    },
    title: {
        fontSize: 40,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
        marginTop: 20,
    },
    field: {
        fontSize: 17,
        color: '#444',
        marginBottom: 6,
        marginLeft: '10%'
    },
    mapContainer: {
        marginVertical: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    map: {
        width: '80%',
        height: 200,
        alignSelf: 'center',
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 40,
        width: '100%',
        maxWidth: 300,
        alignSelf: 'center',
        marginTop: 20,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    closeModalButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    modalContent: {
        width: '90%',
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalImage: {
        width: '100%',
        height: '100%'
    },
    background: {
        flex: 1,
    },
    bold: {
        fontWeight: 'bold'
    },
    link: {
        color: '#F4A83D',
        textDecorationLine: 'underline'
    },
    deleteButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
        maxWidth: 300,
        alignSelf: 'center',
        height: 58
    },
    deleteText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

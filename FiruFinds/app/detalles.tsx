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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import MapView, { Marker } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function ReportDetail() {
    // Parámetros de navegación
    const { type, id, from, query, selectedCategory, selectedReportType } =
        useLocalSearchParams<any>();
    const router = useRouter();
    const [pet, setPet] = useState<any>(null);

    // Nuevo estado para controlar el modal de imagen
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    // Carga el reporte
    useEffect(() => {
        const table = type === 'lost' ? 'reportes_perdidos' : 'reportes_encontrados';
        supabase
            .from(table)
            .select(`*, razas(nombre), tamanos(nombre), especies(nombre), colores(nombre), usuarios(phone) `)
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

    // Teléfono para WhatsApp
    const phoneToShow = pet.telefono ?? pet.usuarios?.phone;
    const formatForWhatsApp = (raw: string | number | undefined) => {
        const str = raw != null ? String(raw) : '';
        let digits = str.replace(/\D/g, '');
        if (!digits.startsWith('57')) digits = '57' + digits;
        return digits;
    };
    const handleWhatsApp = () => {
        if (!phoneToShow) return Alert.alert('Error', 'No hay número de teléfono disponible.');
        const url = `https://wa.me/${formatForWhatsApp(phoneToShow)}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                supported ? Linking.openURL(url) : Alert.alert('Error', '¿WhatsApp instalado?');
            })
            .catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp.'));
    };

    // Abre el modal de imagen
    const handleViewImage = () => {
        setModalVisible(true);
    };

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{pet.nombre}</Text>

                {/* Imagen clicable para ver en grande */}
                <TouchableOpacity onPress={handleViewImage} activeOpacity={0.8}>
                    <Image source={{ uri: pet.image_url }} style={styles.image} />
                </TouchableOpacity>

                {/* Detalles del reporte */}
                <Text style={styles.field}>
                    <Text style={{ fontWeight: 'bold' }}>Especie: </Text>
                    {pet.especies?.nombre}
                </Text>
                <Text style={styles.field}>
                    <Text style={{ fontWeight: 'bold' }}>Raza: </Text>
                    {pet.razas?.nombre}
                </Text>
                <Text style={styles.field}>
                    <Text style={{ fontWeight: 'bold' }}>Tamaño: </Text>
                    {pet.tamanos?.nombre}
                </Text>
                <Text style={styles.field}>
                    <Text style={{ fontWeight: 'bold' }}>Color: </Text>
                    {pet.colores?.nombre}
                </Text>

                {pet.estado_de_salud && (
                    <Text style={styles.field}>
                        <Text style={{ fontWeight: 'bold' }}>Salud: </Text>
                        {pet.estado_de_salud}
                    </Text>
                )}
                {type === 'lost' && (
                    <Text style={styles.field}>
                        <Text style={{ fontWeight: 'bold' }}>Recompensa: </Text>
                        {pet.valor_recompensa}
                    </Text>
                )}

                {/* Número clicable para WhatsApp */}
                {phoneToShow && (
                    <TouchableOpacity onPress={handleWhatsApp}>
                        <Text style={styles.field}>
                            <Text style={{ fontWeight: 'bold' }}>Teléfono: </Text>
                            <Text style={{ color: '#F4A83D', textDecorationLine: 'underline' }}>
                                {String(phoneToShow)}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                )}

                {pet.ubicacion && (
                    <View style={styles.mapContainer}>
                        <Text style={styles.field}>
                            <Text style={{ fontWeight: 'bold' }}>Ubicación: </Text>
                            {pet.punto_referencia}
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
                                description="Última ubicación reportada"
                            />
                        </MapView>
                    </View>
                )}

                {/* Botón volver */}
                <TouchableOpacity style={styles.button} onPress={() => {
                    if (from === 'mapas') router.push('/mapas');
                    else if (from === 'buscar') router.push({ pathname: '/buscar', params: { query, selectedCategory, selectedReportType } });
                    else router.back();
                }}>
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modal para mostrar la imagen en grande */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                        <Image source={{ uri: pet.image_url }} style={styles.modalImage} resizeMode="contain" />
                    </View>
                </View>
            </Modal>
        </>
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
        backgroundColor: '#FFF',
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
        fontSize: 30,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
        marginTop: 20,
    },
    field: {
        fontSize: 16,
        color: '#444',
        marginBottom: 6,
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
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Modal, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../lib/supabase'; // Ajusta la ruta según tu estructura
import { Ionicons } from '@expo/vector-icons'; // Icono de información
import { useRouter } from 'expo-router';



export default function Mapas() {
    // Estados para guardar reportes
    const [foundPets, setFoundPets] = useState([]); // reportes_encontrados
    const [lostPets, setLostPets] = useState([]);   // reportes_perdidos
    const [showLegend, setShowLegend] = useState(false); // Estado para mostrar/ocultar la leyenda


    // Estado para el reporte seleccionado
    const [selectedReport, setSelectedReport] = useState(null);

    // Región inicial del mapa
    const [region, setRegion] = useState({
        latitude: 6.2442,  // Medellín, Colombia
        longitude: -75.5812,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const router = useRouter();

    // Cargar datos de reportes perdidos y encontrados
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener reportes encontrados con la información de la raza
                const { data: foundData, error: foundError } = await supabase
                    .from('reportes_encontrados')
                    .select('*, raza:razas(nombre)');
                if (foundError) throw foundError;

                // Obtener reportes perdidos
                const { data: lostData, error: lostError } = await supabase
                    .from('reportes_perdidos')
                    .select('*');
                if (lostError) throw lostError;

                setFoundPets(foundData || []);
                setLostPets(lostData || []);
            } catch (err) {
                console.error('Error al cargar reportes:', err);
            }
        };

        fetchData();
    }, []);

    // Función para cerrar el modal
    const closeModal = () => setSelectedReport(null);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FiruFinds</Text>
            <Text style={styles.subtitle}>
                Estos son los reportes de mascotas halladas y perdidas en la zona
            </Text>
            {/* Botón flotante "i" para mostrar la leyenda */}
            <TouchableOpacity style={styles.infoButton} onPress={() => setShowLegend(!showLegend)}>
                <Ionicons name="information-circle" size={24} color="white" />
            </TouchableOpacity>

            {/* Leyenda (se muestra solo si showLegend es true) */}
            {showLegend && (
                <View style={styles.legendContainer}>
                    <Text style={styles.legendTitle}>Leyenda</Text>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#F4A83D' }]} />
                        <Text style={styles.legendText}>Mascota encontrada</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#30404d' }]} />
                        <Text style={styles.legendText}>Mascota perdida</Text>
                    </View>
                </View>
            )}

            <MapView style={styles.map} initialRegion={region}>
                {/* Marcadores para reportes ENCONTRADOS */}
                {foundPets.map((report) => {
                    if (!report.ubicacion) return null;
                    const { lat, lng } = report.ubicacion;
                    return (
                        <Marker
                            key={`found-${report.id}`}
                            coordinate={{ latitude: lat, longitude: lng }}
                            pinColor="#F4A83D"
                            onPress={() => setSelectedReport({ ...report, tipo: 'found' })}
                        />
                    );
                })}

                {/* Marcadores para reportes PERDIDOS  */}
                {lostPets.map((report) => {
                    if (!report.ubicacion) return null;
                    const { lat, lng } = report.ubicacion;
                    return (
                        <Marker
                            key={`lost-${report.id}`}
                            coordinate={{ latitude: lat, longitude: lng }}
                            pinColor="#30404d"
                            onPress={() => setSelectedReport({ ...report, tipo: 'lost' })}
                        />
                    );
                })}
            </MapView>

            {/* Modal para mostrar la información del reporte seleccionado */}
            {selectedReport && (
                <Modal
                    visible={true}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={closeModal}
                >
                    <TouchableOpacity style={styles.modalOverlay} onPress={closeModal}>
                        <View style={styles.modalContainer}>
                            {/* Mostrar la raza en vez del nombre en reportes encontrados */}
                            <Text style={styles.modalTitle}>
                                {selectedReport.tipo === 'found'
                                    ? selectedReport.raza?.nombre || 'Sin raza'
                                    : selectedReport.nombre || 'Sin nombre'}
                            </Text>
                            <Text style={styles.modalDescription}>
                                {selectedReport.tipo === 'found'
                                    ? 'Mascota encontrada'
                                    : 'Mascota perdida'}
                            </Text>
                            {/* Suponiendo que existe un campo image con la URL de la imagen */}
                            {selectedReport.image_url && (
                                <Image
                                    source={{ uri: selectedReport.image_url }}
                                    style={styles.modalImage}
                                    resizeMode="cover"
                                />
                            )}
                            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.closeButton]}
                                onPress={() => {
                                    router.push({
                                        pathname: '/detalles',
                                        params: {
                                            id: selectedReport.id,
                                            type: selectedReport.tipo,
                                            from: 'mapas'
                                        }
                                    });
                                    setSelectedReport(null); // Cierra el modal
                                }}
                            >
                                <Text style={styles.closeButtonText}>Ver más</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    title: {
        marginTop: 11,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    map: {
        width: '90%',
        height: Dimensions.get('window').height * 0.75,
        display: 'flex',
        marginLeft: 20,
        marginRight: 20,

    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        padding: 20,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalDescription: {
        fontSize: 14,
        marginVertical: 10,
    },
    modalImage: {
        width: 100,
        height: 100,
        marginVertical: 10,
    },
    closeButton: {
        marginTop: 10,
        backgroundColor: '#F4A83D',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    infoButton: {
        position: 'absolute',
        top: 12,  // Más arriba
        right: 10, // Más pegado a la esquina derecha
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 6, // Área táctil más pequeña
        borderRadius: 100,
        zIndex: 1000,
    },
    legendContainer: {
        position: 'absolute',
        top: 140, // Ajusta la posición vertical de la leyenda
        right: 10, // Ajusta la posición horizontal de la leyenda
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        zIndex: 999, // Asegura que se muestre sobre el mapa
    },
    legendTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    legendColor: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 10,
    },
    legendText: {
        fontSize: 14,
    },
}
);

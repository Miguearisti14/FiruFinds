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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import MapView, { Marker } from 'react-native-maps';

export default function ReportDetail() {
    const { type, id, from, query, selectedCategory, selectedReportType } =
        useLocalSearchParams<{
            type: string;
            id: string;
            from?: string;
            query?: string;
            selectedCategory?: 'raza' | 'especie' | 'tamano' | 'color' | 'nombre';
            selectedReportType?: 'Perdidos' | 'Encontrados';
        }>();
    const router = useRouter();
    const [pet, setPet] = useState<any>(null);

    useEffect(() => {
        const table =
            type === 'lost' ? 'reportes_perdidos' : 'reportes_encontrados';
        supabase
            .from(table)
            .select(`
        *,
        razas(nombre),
        tamanos(nombre),
        especies(nombre),
        colores(nombre),
        usuarios(phone)
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

    const phoneToShow = pet.telefono ?? pet.usuarios?.phone;

    // Convierte el valor raw a string y extrae solo dígitos
    const formatForWhatsApp = (raw: string | number | undefined) => {
        const str = raw != null ? String(raw) : '';
        let digits = str.replace(/\D/g, '');
        if (!digits.startsWith('57')) {
            digits = '57' + digits; // Agregar código de país si falta
        }
        return digits;
    };

    const handleWhatsApp = () => {
        if (!phoneToShow) {
            Alert.alert('Error', 'No hay número de teléfono disponible.');
            return;
        }
        const phone = formatForWhatsApp(phoneToShow);
        const url = `https://wa.me/${phone}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    Alert.alert(
                        'Error',
                        'No se puede abrir WhatsApp. ¿Está instalado en este dispositivo?'
                    );
                }
            })
            .catch((err) => {
                console.error('An error occurred', err);
                Alert.alert('Error', 'Ocurrió un problema al intentar abrir WhatsApp.');
            });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{pet.nombre}</Text>
            <Image source={{ uri: pet.image_url }} style={styles.image} />

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

            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    if (from === 'mapas') {
                        router.push('/mapas');
                    } else if (from === 'buscar') {
                        router.push({
                            pathname: '/buscar',
                            params: { query, selectedCategory, selectedReportType },
                        });
                    } else {
                        router.back();
                    }
                }}
            >
                <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
        </ScrollView>
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
});

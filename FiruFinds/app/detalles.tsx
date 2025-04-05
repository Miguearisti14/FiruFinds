// app/report-detail.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    Button,
    TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import MapView, { Marker } from 'react-native-maps';


export default function ReportDetail() {
    const { type, id, from } = useLocalSearchParams<{ type: string; id: string, from?: string }>();
    const router = useRouter();
    const [pet, setPet] = useState<any>(null);

    useEffect(() => {
        const table =
            type === 'lost'
                ? 'reportes_perdidos'
                : 'reportes_encontrados';
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

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{pet.nombre}</Text>
            <Image
                source={{ uri: pet.image_url }}
                style={styles.image}
            />
            {pet.ubicacion && (
                <View style={styles.mapContainer}>
                    <Text style={styles.field}>Ubicación:</Text>
                    <MapView
                        style={{ width: '100%', height: 200, marginVertical: 20 }}
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

            {pet.punto_referencia && (
                <Text>Punto referencia: {pet.punto_referencia}</Text>
            )}

            {type === 'lost' && (
                <Text>Recompensa: {pet.valor_recompensa}</Text>
            )}

            {pet.estado_de_salud && (
                <Text>Salud: {pet.estado_de_salud}</Text>
            )}
            {phoneToShow && (
                <Text>Teléfono: {phoneToShow}</Text>
            )}

            <Text>Tamaño: {pet.tamaños?.nombre}</Text>
            <Text>Especie: {pet.especies?.nombre}</Text>
            <Text>Color: {pet.colores?.nombre}</Text>
            <Text>Raza: {pet.razas?.nombre}</Text>

            <View >

                <TouchableOpacity style={styles.button} onPress={() => {
                    if (from === 'mapas') {
                        router.push('/mapas');
                    } else {
                        router.back();
                    }
                }}>
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 20,
        backgroundColor: '#FFF',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    field: {
        marginVertical: 4,
        fontSize: 16
    },
    mapContainer: {
        width: '100%',
        height: 250,
        marginVertical: 20
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 8,
        paddingVertical: 12,
        width: '100%',
        marginTop: 20,
        maxWidth: '95%'
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
});

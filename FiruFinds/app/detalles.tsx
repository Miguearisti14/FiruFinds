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

            <Text style={styles.field}><Text style={{ fontWeight: 'bold' }}>Especie: </Text>{pet.especies?.nombre}</Text>
            <Text style={styles.field}><Text style={{ fontWeight: 'bold' }}>Raza: </Text>{pet.razas?.nombre}</Text>
            <Text style={styles.field}><Text style={{ fontWeight: 'bold' }}>Tamaño: </Text>{pet.tamanos?.nombre}</Text>
            <Text style={styles.field}><Text style={{ fontWeight: 'bold' }}>Color: </Text>{pet.colores?.nombre}</Text>

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
            {phoneToShow && (
                <Text style={styles.field}>
                    <Text style={{ fontWeight: 'bold' }}>Teléfono: </Text>
                    {phoneToShow}
                </Text>
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
        backgroundColor: '#fff'
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
        alignSelf: 'center'
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
        marginTop: 20
    },
    field: {
        fontSize: 16,
        color: '#444',
        marginBottom: 6,
        position: 'fixed',
        left: 45,
        textAlign: 'justify'
    },
    mapContainer: {
        marginVertical: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    map: {
        width: '80%',
        height: 200,
        alignSelf: 'center'
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 40,
        width: '100%',
        maxWidth: 300,
        alignSelf: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
    },
});

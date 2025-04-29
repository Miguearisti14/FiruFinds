// app/(tabs)/notificaciones.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ImageBackground
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Notificacion = {
    coincidencia_id: string;
    porcentaje_coincidencia: number;
    nombre_mascota_encontrada: string;
    fecha_reporte_encuentro: string;
    especie: string;
    // Estos dos campos vienen de la vista
    reporte_encontrado_id: string;
};

export default function Notificaciones() {
    const [notifs, setNotifs] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            // 1) Obtener sesión y userId
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const userId = session?.user.id;
            if (!userId) {
                router.push('/');
                return;
            }

            // 2) Traer notificaciones de la vista incluyendo el ID del reporte encontrado
            const { data, error } = await supabase
                .from('vista_coincidencias_potenciales')
                .select(
                    `coincidencia_id,
           porcentaje_coincidencia,
           nombre_mascota_encontrada,
           fecha_reporte_encuentro,
           reporte_encontrado_id, 
           especie`
                )
                .eq('usuario_perdida_id', userId)
                .gte('porcentaje_coincidencia', 60)
                .order('fecha_reporte_encuentro', { ascending: false });

            if (error) {
                console.error('Error cargando notificaciones:', error);
            } else {
                setNotifs((data ?? []) as Notificacion[]);
            }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return <ActivityIndicator style={styles.loading} size="large" />;
    }

    if (notifs.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.empty}>No hay coincidencias</Text>
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../assets/images/fondo.png')}
            style={styles.background}
            resizeMode="cover" // 'cover', 'contain', 'stretch', etc.
        >
            <View>
                <Text style={styles.title}>FiruFinds</Text>
                <Text style={styles.subtitle}>
                    Estas son las posibles coincidencias con tu mascota
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <FlatList
                    data={notifs}
                    keyExtractor={(item) => item.coincidencia_id}
                    contentContainerStyle={styles.container}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() =>
                                router.push(
                                    `/detalles?type=found&id=${item.reporte_encontrado_id}&from=notificaciones`
                                )
                            }
                        >
                            <Text style={styles.titleN}>
                                {item.porcentaje_coincidencia}% de coincidencia con un {item.especie}
                            </Text>
                            <Text style={styles.date}>
                                Reportado el{' '}
                                {new Date(item.fecha_reporte_encuentro).toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        padding: 20,

    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#777'
    },
    item: {
        marginBottom: 15,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
    titleN: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5
    },
    date: {
        fontSize: 12,
        color: '#666'
    },
    title: {
        marginTop: 31,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 10
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 32,
    },
    background: {
        flex: 1,
    },
});

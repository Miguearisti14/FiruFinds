// app/(tabs)/notificaciones.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ImageBackground,
    StatusBar,
    SafeAreaView
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
    reporte_encontrado_id: string;
};

export default function Notificaciones() {
    const [notifs, setNotifs] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const userId = session?.user.id;
            if (!userId) {
                router.push('/');
                return;
            }

            const { data, error } = await supabase
                .from('vista_coincidencias_potenciales')
                .select(`
                    coincidencia_id,
                    porcentaje_coincidencia,
                    nombre_mascota_encontrada,
                    fecha_reporte_encuentro,
                    reporte_encontrado_id, 
                    especie
                `)
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
            <SafeAreaView style={styles.safeArea}>
                <ImageBackground
                    source={require('../assets/images/fondo.png')}
                    style={styles.background}
                    resizeMode="cover"
                >
                    <Text style={styles.empty}>No hay coincidencias</Text>
                </ImageBackground>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <ImageBackground
                source={require('../assets/images/fondo.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.inner}>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    background: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 20,
        top: 15
    },
    container: {
        paddingBottom: 20,
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
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 8,
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
        top: 15,
    },
});

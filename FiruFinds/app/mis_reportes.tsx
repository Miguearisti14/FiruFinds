import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

// Componente reutilizable para mostrar una tarjeta de reporte
const PetCard = ({ title, image }: { title: string; image: string }) => (
    <View style={styles.card}>
        <Image source={{ uri: image }} style={styles.cardImage} />
        <Text style={styles.cardTitle}>{title}</Text>
    </View>
);

// Pantalla de reportes de mascotas perdidas del usuario
function LostReportsScreen({ userId }: { userId: string }) {
    const [lostReports, setLostReports] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    // Carga los reportes de mascotas perdidas asociadas al usuario
    useEffect(() => {
        const fetchLostReports = async () => {
            const { data, error } = await supabase
                .from('reportes_perdidos')
                .select(`id, nombre, image_url, razas(nombre)`)
                .eq('usuario_id', userId)
                .limit(20);
            if (error) {
                console.error(error);
            } else {
                setLostReports(data || []);
            }
            setLoading(false);
        };
        fetchLostReports();
    }, [userId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />;
    }

    return (

        <FlatList
            data={lostReports}
            numColumns={2}
            contentContainerStyle={styles.list}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={{ flex: 1, margin: 5 }}
                    onPress={() => router.push(`/detalles?type=lost&id=${item.id}`)}
                >
                    <PetCard
                        title={item.razas?.nombre || 'Raza desconocida'}
                        image={item.image_url}
                    />
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>
                        No se encontraron reportes perdidos.
                    </Text>
                </View>
            }
        />
    );
}

// Pantalla de reportes de mascotas encontradas del usuario
function FoundReportsScreen({ userId }: { userId: string }) {
    const [foundReports, setFoundReports] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    // Carga los reportes de mascotas encontradas asociadas al usuario
    useEffect(() => {
        const fetchFoundReports = async () => {
            const { data, error } = await supabase
                .from('reportes_encontrados')
                .select(`id, nombre, image_url, razas(nombre)`)
                .eq('usuario_id', userId)
                .limit(20);
            if (error) {
                console.error(error);
            } else {
                setFoundReports(data || []);
            }
            setLoading(false);
        };
        fetchFoundReports();
    }, [userId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />;
    }

    return (
        <FlatList
            data={foundReports}
            numColumns={2}
            contentContainerStyle={styles.list}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={{ flex: 1, margin: 5 }}
                    onPress={() => router.push(`/detalles?type=found&id=${item.id}`)}
                >
                    <PetCard
                        title={item.razas?.nombre || 'Raza desconocida'}
                        image={item.image_url}
                    />
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>
                        No se encontraron reportes encontrados.
                    </Text>
                </View>
            }
        />
    );
}

// Pantalla principal con pestañas "Perdidos" y "Encontrados"
export default function MisReportes() {
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    // Obtén el usuario logueado
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                // Si no hay sesión activa, redirige a la pantalla inicial
                router.push('/');
            }
        };
        getUser();
    }, []);

    if (!userId) {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />;
    }

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Mis Reportes</Text>

            <TouchableOpacity
                onPress={() => router.push('/perfil')}
                style={styles.closeButtonContainer}
            >
                <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>


            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#F4A83D',
                    tabBarInactiveTintColor: 'gray',
                    tabBarIndicatorStyle: { backgroundColor: '#F4A83D' },
                    tabBarStyle: { backgroundColor: '#FFF' },
                }}
            >
                <Tab.Screen name="Perdidos">
                    {() => <LostReportsScreen userId={userId} />}
                </Tab.Screen>
                <Tab.Screen name="Encontrados">
                    {() => <FoundReportsScreen userId={userId} />}
                </Tab.Screen>
            </Tab.Navigator>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    title: {
        marginTop: 25,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    closeButtonContainer: {
        position: 'absolute',
        top: 25,
        right: 10,
        zIndex: 1,
    },
    closeButton: {
        fontSize: 24,
        color: '#333',
    },
    loading: {
        marginTop: 20,
    },
    list: {
        padding: 10,
    },
    card: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    cardTitle: {
        padding: 10,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
    },
});

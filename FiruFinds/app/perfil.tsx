import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Perfil() {
    const [userId, setUserId] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>('Usuario'); // Estado para el nombre del usuario
    const router = useRouter();

    // Paso 1: Obtener el ID del usuario logueado
    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                router.push('/'); // Redirigir si no hay sesión
            }
        };
        getSession();
    }, []);

    // Paso 2: Consultar el display_name en la tabla usuarios
    useEffect(() => {
        if (!userId) return; // No hacer nada si no hay userId
        const fetchUserDisplayName = async () => {
            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('display_name')
                    .eq('id', userId)
                    .single(); // Usamos .single() porque esperamos un solo registro

                if (error) throw error;
                if (data) {
                    setDisplayName(data.display_name); // Actualizamos el estado con el nombre
                }
            } catch (error) {
                console.error('Error al obtener el display_name:', error);
            }
        };
        fetchUserDisplayName();
    }, [userId]);

    // Paso 3: Cerrar sesión (sin cambios)
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <View style={styles.container}>
            {/* Encabezado con "FiruFinds" y botón "X" */}
            <View style={styles.header}>
                <Text style={styles.appName}>FiruFinds</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Imagen de perfil */}
            <View style={styles.profileImageContainer}>
                <Image
                    source={{ uri: 'https://via.placeholder.com/100' }} // Cambia por la URL real si la tienes
                    style={styles.profileImage}
                />
            </View>

            {/* Título "Usuario" */}
            <Text style={styles.title}>{displayName}</Text>

            {/* Elementos de navegación con íconos */}
            <TouchableOpacity style={styles.navItem}>
                <Ionicons name="person-outline" size={20} color="#333" />
                <Text style={styles.navItemText}>Mi perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
                <Ionicons name="notifications-outline" size={20} color="#333" />
                <Text style={styles.navItemText}>Notificaciones</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/mis_reportes')}>
                <Ionicons name="clipboard-outline" size={20} color="#333" />
                <Text style={styles.navItemText}>Mis reportes</Text>
            </TouchableOpacity>

            {/* Botón de "Cerrar Sesión" */}
            <TouchableOpacity
                style={styles.linkButton}
                onPress={async () => {
                    await supabase.auth.signOut(); // Cierra la sesión real en Supabase
                    router.replace('/Auth'); // Redirige a la pantalla de login o inicio
                }}
            >
                <Text style={styles.linkText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    appName: {
        fontSize: 24,
        color: '#8B7355', // Color marrón claro ajustado según la imagen
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50, // Hace la imagen circular
        backgroundColor: '#ccc', // Placeholder gris
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    navItemText: {
        fontSize: 16,
        marginLeft: 10,
    },
    logoutButton: {
        backgroundColor: '#F4A83D', // Fondo naranja
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 30,
    },
    logoutButtonText: {
        color: '#fff', // Texto blanco
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkButton: {
        marginTop: 250,
        alignItems: 'center',
    },
    linkText: {
        color: '#f9a826',
        fontSize: 16,
        textDecorationLine: 'underline',
        fontWeight: '500',
        alignItems: 'center',
    },
});
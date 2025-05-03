import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Perfil() {
    const [userId, setUserId] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>('Usuario');
    const [profileImage, setProfileImage] = useState<string>('https://via.placeholder.com/100');
    const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
    const router = useRouter();

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                router.push('/');
            }
        };
        getSession();
    }, []);

    useEffect(() => {
        if (!userId) return;
        const fetchUserProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('display_name, avatar_url')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                if (data) {
                    setDisplayName(data.display_name || 'Usuario');
                    const newProfileImage = data.avatar_url || 'https://via.placeholder.com/100';
                    setProfileImage(newProfileImage);
                }
            } catch (error) {
                console.error('Error al obtener el perfil:', error);
            }
        };
        fetchUserProfile();
    }, [userId]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
            <ImageBackground
                source={require('../assets/images/fondo.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.appName}>FiruFinds</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.profileImageContainer}>
                        <Image
                            source={{ uri: `${profileImage}?cb=${cacheBuster}` }}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>

                    <Text style={styles.title}>{displayName}</Text>

                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/editar_perfil')}>
                        <Ionicons name="person-outline" size={20} color="#333" />
                        <Text style={styles.navItemText}>Mi perfil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/mis_reportes')}>
                        <Ionicons name="clipboard-outline" size={20} color="#333" />
                        <Text style={styles.navItemText}>Mis reportes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('../notificaciones')} style={styles.navItem}>
                        <MaterialCommunityIcons name="paw" size={20} color="#333" />
                        <Text style={styles.navItemText}>Coincidencias</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.linkText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </ImageBackground>
        </>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        color: '#8B7355',
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
        borderRadius: 50,
        backgroundColor: '#ccc',
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
        backgroundColor: '#FFF',
    },
    navItemText: {
        fontSize: 16,
        marginLeft: 10,
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
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContent: {
        width: '90%',
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    largeImage: {
        width: '100%',
        height: '100%',
    },
    closeModalButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    background: {
        flex: 1,
    },
});

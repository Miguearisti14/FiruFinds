import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

export default function Perfil() {
    const [userId, setUserId] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>('Usuario');
    const [profileImage, setProfileImage] = useState<string>('https://via.placeholder.com/100');
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [cacheBuster, setCacheBuster] = useState<number>(Date.now()); // For cache busting
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
                    console.log('Fetched profile image URL:', newProfileImage);
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

    const showImageOptions = () => {
        Alert.alert(
            'Opciones de imagen',
            '',
            [
                {
                    text: 'Eliminar imagen',
                    onPress: handleDeleteImage,
                    style: 'destructive',
                },
                {
                    text: 'Ver imagen',
                    onPress: handleViewImage,
                },
                {
                    text: 'Cambiar imagen',
                    onPress: handleChangeImage,
                },
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    };

    const handleDeleteImage = async () => {
        if (!userId) return;

        const { error: storageError } = await supabase.storage
            .from('avatars')
            .remove([`${userId}/profile.jpg`]);

        if (storageError) {
            console.error('Error al eliminar imagen del storage:', storageError);
            Alert.alert('Error', 'No se pudo eliminar la imagen del almacenamiento.');
            return;
        }

        const { error: dbError } = await supabase
            .from('usuarios')
            .update({ avatar_url: null })
            .eq('id', userId);

        if (dbError) {
            console.error('Error al eliminar imagen de la base de datos:', dbError);
            Alert.alert('Error', 'No se pudo actualizar el perfil.');
        } else {
            setProfileImage('https://via.placeholder.com/100');
            setCacheBuster(Date.now()); // Update cache buster
            Alert.alert('Éxito', 'Imagen eliminada correctamente.');
        }
    };

    const handleViewImage = () => {
        setModalVisible(true);
    };

    const handleChangeImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesitan permisos para acceder a la galería.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            const fileName = `${userId}/profile.jpg`;

            const { error } = await supabase.storage
                .from('avatars')
                .upload(fileName, {
                    uri,
                    type: 'image/jpeg',
                }, {
                    upsert: true
                });

            if (error) {
                console.error('Error al subir imagen:', error);
                Alert.alert('Error', 'No se pudo subir la imagen.');
            } else {
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);
                const { error: updateError } = await supabase
                    .from('usuarios')
                    .update({ avatar_url: data.publicUrl })
                    .eq('id', userId);
                if (updateError) {
                    console.error('Error al actualizar la URL de la imagen:', updateError);
                    Alert.alert('Error', 'No se pudo actualizar el perfil.');
                } else {
                    setProfileImage(data.publicUrl);
                    setCacheBuster(Date.now()); // Update cache buster to force image reload
                    console.log('Updated profile image URL:', data.publicUrl);
                    Alert.alert('Éxito', 'Imagen actualizada correctamente.');
                }
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.appName}>FiruFinds</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={showImageOptions} style={styles.profileImageContainer}>
                <Image
                    source={{ uri: `${profileImage}?cb=${cacheBuster}` }}
                    style={styles.profileImage}
                />
            </TouchableOpacity>

            <Text style={styles.title}>{displayName}</Text>

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

            <TouchableOpacity
                style={styles.linkButton}
                onPress={handleLogout}
            >
                <Text style={styles.linkText}>Cerrar Sesión</Text>
            </TouchableOpacity>

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
                        <Image
                            source={{ uri: `${profileImage}?cb=${cacheBuster}` }}
                            style={styles.largeImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>
            </Modal>
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
});
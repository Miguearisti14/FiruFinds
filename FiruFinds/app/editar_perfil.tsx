import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    ImageBackground,
    Modal,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function EditarPerfil() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const router = useRouter();

    const [profileImage, setProfileImage] = useState<string>('https://via.placeholder.com/100');
    const [userId, setUserId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [cacheBuster, setCacheBuster] = useState<number>(Date.now());

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/');
                return;
            }
            const userId = session.user.id;
            setUserId(userId);
            const { data, error } = await supabase
                .from('usuarios')
                .select('display_name, email, phone, avatar_url')
                .eq('id', userId)
                .single();
            if (error) {
                console.error(error);
                Alert.alert('Error', 'No se pudo cargar perfil.');
            } else if (data) {
                setDisplayName(data.display_name || '');
                setEmail(data.email || session.user.email || '');
                setPhone(data.phone || '');
                setProfileImage(data.avatar_url || 'https://via.placeholder.com/100');
            }
            setLoading(false);
        })();
    }, []);

    const showImageOptions = () => {
        Alert.alert(
            'Opciones de imagen',
            '',
            [
                { text: 'Eliminar imagen', onPress: handleDeleteImage, style: 'destructive' },
                { text: 'Ver imagen', onPress: handleViewImage },
                { text: 'Cambiar imagen', onPress: handleChangeImage },
                { text: 'Cancelar', style: 'cancel' },
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
            console.error(storageError);
            Alert.alert('Error', 'No se pudo eliminar la imagen.');
            return;
        }
        const { error: dbError } = await supabase
            .from('usuarios')
            .update({ avatar_url: null })
            .eq('id', userId);
        if (dbError) {
            console.error(dbError);
            Alert.alert('Error', 'No se pudo actualizar el perfil.');
        } else {
            setProfileImage('https://via.placeholder.com/100');
            setCacheBuster(Date.now());
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
                .upload(fileName, { uri, type: 'image/jpeg' }, { upsert: true });
            if (error) {
                console.error(error);
                Alert.alert('Error', 'No se pudo subir la imagen.');
            } else {
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                const { error: updateError } = await supabase
                    .from('usuarios')
                    .update({ avatar_url: data.publicUrl })
                    .eq('id', userId);
                if (updateError) {
                    console.error(updateError);
                    Alert.alert('Error', 'No se pudo actualizar el perfil.');
                } else {
                    setProfileImage(data.publicUrl);
                    setCacheBuster(Date.now());
                    Alert.alert('Éxito', 'Imagen actualizada correctamente.');
                }
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            Alert.alert('Error', 'Sesión no válida.');
            setSaving(false);
            return;
        }

        const userId = session.user.id;
        let finalAvatarUrl = avatarUrl;

        if (avatarUrl && avatarUrl.startsWith('file://')) {
            const fileName = `${userId}/avatar.jpg`;
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, { uri: avatarUrl, type: 'image/jpeg', name: fileName }, { upsert: true });
            if (error) console.error('Error upload avatar', error);
            finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
        }

        const { error } = await supabase
            .from('usuarios')
            .update({ display_name: displayName, phone, avatar_url: finalAvatarUrl })
            .eq('id', userId);
        if (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar perfil.');
        } else {
            Alert.alert('Éxito', 'Perfil actualizado.');
            router.back();
        }
        setSaving(false);
    };

    if (loading) return <ActivityIndicator style={styles.center} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="dark-content" />
            <ImageBackground
                source={require('../assets/images/fondo.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.appName}>FiruFinds</Text>
                        <TouchableOpacity onPress={() => router.push('/perfil')} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <TouchableOpacity onPress={showImageOptions} style={styles.profileImageContainer}>
                            {profileImage === 'https://via.placeholder.com/100' ? (
                                <View style={styles.placeholderCircle} />
                            ) : (
                                <Image
                                    source={{ uri: `${profileImage}?cb=${cacheBuster}` }}
                                    style={styles.profileImage}
                                />
                            )}
                        </TouchableOpacity>

                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Nombre de usuario"
                        />

                        <Text style={styles.label}>Correo</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#eee' }]}
                            value={email}
                            editable={false}
                        />

                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="07x..."
                        />

                        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Guardar</Text>}
                        </TouchableOpacity>
                    </ScrollView>

                    <Modal animationType="fade" transparent={true} visible={modalVisible}>
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
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        marginTop: 40,
        marginBottom: -5,
    },
    appName: {
        fontSize: 24,
        color: '#8B7355',
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 16
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 20
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
        marginLeft: 35
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: '#fff',
        width: '80%',
        alignSelf: 'center'
    },
    button: {
        backgroundColor: '#F4A83D',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        width: '80%',
        alignSelf: 'center'
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold'
    },
    background: {
        flex: 1
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center',
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
    placeholderCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ccc',
    },
});

import React, { useState } from 'react';
import { Alert, StyleSheet, View, AppState, TouchableOpacity, Text, ImageBackground } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Link, useRouter } from 'expo-router';
import { registerForPushNotificationsAsync } from '../utils/notifications';

AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Iniciar sesión
    async function signInWithEmail() {
        setLoading(true);

        try {
            console.log('Attempting to sign in with email:', email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login error:', error);
                Alert.alert(error.message);
                return false; // Indica que falló el inicio de sesión
            }

            if (data.user) {
                console.log('Successfully logged in, user ID:', data.user.id);
                // Register push notifications after successful login
                try {
                    await registerForPushNotificationsAsync(data.user.id);
                } catch (notificationError) {
                    console.error('Error registering push notifications:', notificationError);
                    // Don't fail the login if notification registration fails
                    Alert.alert('Advertencia', 'No se pudo registrar las notificaciones push. Puedes intentarlo de nuevo desde tu perfil.');
                }
                return true; // Indica que fue exitoso
            }

            console.log('No user data returned after login');
            return false;
        } catch (error) {
            console.error('Unexpected error during login:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado. Por favor, intenta de nuevo.');
            return false;
        } finally {
            setLoading(false);
        }
    }

    return (
        <ImageBackground
            source={require('../assets/images/fondo.png')}
            style={styles.background}
            resizeMode="cover" // 'cover', 'contain', 'stretch', etc.
        >
            <View style={styles.container}>
                <Text style={styles.title}>Iniciar Sesión</Text>

                <View style={styles.inputContainer}>
                    <Input
                        label="Correo"
                        labelStyle={styles.label}
                        onChangeText={(text) => setEmail(text)}
                        value={email}
                        placeholder="ejemplo@gmail.com"
                        autoCapitalize="none"
                        inputContainerStyle={styles.inputBox}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Input
                        label="contraseña"
                        labelStyle={styles.label}
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        secureTextEntry={true}
                        placeholder="tu contraseña"
                        autoCapitalize="none"
                        inputContainerStyle={styles.inputBox}
                    />
                </View>

                <Button
                    title="Iniciar Sesión"
                    disabled={loading}
                    onPress={async () => {
                        const success = await signInWithEmail(); // Espera el resultado
                        if (success) {
                            router.push('/(tabs)/home'); // Redirige solo si fue exitoso
                        }
                    }}
                    buttonStyle={styles.button}
                    titleStyle={styles.buttonText}
                />

                <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Registrarse</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        textAlign: 'left',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A3F35',
        marginBottom: 80,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: '#4A3F35',
        fontWeight: 'bold',
        textTransform: 'lowercase',
    },
    inputBox: {
        borderBottomWidth: 1,
        borderBottomColor: '#4A3F35',
        backgroundColor: '#FFF'
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 8,
        paddingVertical: 12,
        width: '100%',
        marginTop: 20,
        maxWidth: '95%',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    linkContainer: {
        marginTop: 10,
    },
    linkText: {
        fontSize: 16,
        color: '#F4A83D',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    background: {
        flex: 1,
    },
});
import React, { useState } from 'react';
import { Alert, StyleSheet, View, ImageBackground, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Input } from '@rneui/themed';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Por favor ingresa tu correo electrónico.');
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                // Apunta aquí a la URL pública donde está tu index.html
                redirectTo: 'https://miguearisti14.github.io/FiruFinds/'
            });

            if (error) {
                console.error('Reset password error:', error);
                Alert.alert('Error', error.message);
            } else {
                Alert.alert(
                    'Correo enviado',
                    'Revisa tu correo electrónico para restablecer tu contraseña.'
                );
                router.push('/Auth');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ImageBackground
                source={require('../assets/images/fondo.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.container}>
                    <Input
                        label="Correo electrónico"
                        labelStyle={styles.label}
                        placeholder="ejemplo@gmail.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        inputContainerStyle={styles.inputBox}
                    />

                    <Button
                        title="Restablecer contraseña"
                        onPress={handleResetPassword}
                        loading={loading}
                        buttonStyle={styles.button}
                        titleStyle={styles.buttonText}
                        containerStyle={styles.buttonContainer}
                    />

                    <View style={styles.linkContainer}>
                        <Button
                            type="clear"
                            title="Volver a Iniciar Sesión"
                            titleStyle={styles.linkText}
                            onPress={() => router.push('/Auth')}
                        />
                    </View>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 14,
        color: '#4A3F35',
        fontWeight: 'bold',
        textTransform: 'none',
    },
    inputBox: {
        borderBottomWidth: 1,
        borderBottomColor: '#4A3F35',
        backgroundColor: '#FFF',
        width: '100%',
    },
    buttonContainer: {
        width: '80%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 8,
        paddingVertical: 12,
        width: '100%',
        marginTop: 20,
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
});
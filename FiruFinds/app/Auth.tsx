import React, { useState } from 'react'
import {
    Alert,
    StyleSheet,
    View,
    AppState,
    TouchableOpacity,
    Text,
    ImageBackground,
    StatusBar,
    SafeAreaView,
} from 'react-native'; import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'
import { Link, useRouter } from 'expo-router';


AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})

export default function Auth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter();


    async function signInWithEmail() {
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setLoading(false);

        if (error) {
            Alert.alert(error.message);
            return false; // Indica que falló el inicio de sesión
        }

        return true; // Indica que fue exitoso
    }


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <ImageBackground
                source={require('../assets/images/fondo.png')}
                style={styles.background}
                resizeMode="cover"
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

                    <TouchableOpacity onPress={() => router.push('/recuperar')} style={styles.linkContainer}>
                        <Text style={styles.linkText}>Recuperar contraseña</Text>
                    </TouchableOpacity>

                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        textAlign: 'left'
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
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 8,
        paddingVertical: 12,
        width: '100%',
        marginTop: 20,
        maxWidth: '95%'
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
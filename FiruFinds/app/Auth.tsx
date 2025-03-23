import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState, TouchableOpacity, Text } from 'react-native'
import { supabase } from '../lib/supabase'
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
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error) Alert.alert(error.message)
        setLoading(false)
    }


    return (
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
                onPress={signInWithEmail}
                buttonStyle={styles.button}
                titleStyle={styles.buttonText}
            />

            <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkContainer}>
                <Text style={styles.linkText}>Registrarse</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        textAlign: 'left'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A3F35',
        marginBottom: 80,
        //alignSelf: 'flex-start'

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
});
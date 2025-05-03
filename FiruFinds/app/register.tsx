import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Alert,
    ImageBackground,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Input, Button } from '@rneui/themed';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            Alert.alert('Error', error.message);
            setLoading(false);
            return;
        }

        const user = data.user;

        if (user) {
            const { error: profileError } = await supabase
                .from('usuarios')
                .insert([
                    {
                        id: user.id,
                        display_name: name,
                        phone,
                        email
                    }
                ]);

            if (profileError) {
                Alert.alert('Error', `Registro exitoso, pero hubo un problema guardando tu perfil: ${profileError.message}`);
            } else {
                Alert.alert('Registro exitoso', 'Ya puedes iniciar sesión');
                router.push('/');
            }
        }

        setLoading(false);
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
                    <Text style={styles.title}>Registrarse</Text>

                    <Input label="Nombre" inputContainerStyle={styles.inputBox} value={name} onChangeText={setName} placeholder="Tu nombre" />
                    <Input label="Email" inputContainerStyle={styles.inputBox} value={email} onChangeText={setEmail} placeholder="superhero@email.com" autoCapitalize="none" />
                    <Input label="Teléfono" inputContainerStyle={styles.inputBox} value={phone} onChangeText={setPhone} placeholder="23234389" keyboardType="phone-pad" />
                    <Input label="Contraseña" inputContainerStyle={styles.inputBox} value={password} onChangeText={setPassword} secureTextEntry placeholder="Tu contraseña" />

                    <Button title="Registrarse" onPress={signUpWithEmail} loading={loading} buttonStyle={styles.button} />
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
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A3F35',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 8,
        paddingVertical: 12,
        width: '100%',
        marginTop: 20,
        maxWidth: '95%',
    },
    background: {
        flex: 1,
    },
    inputBox: {
        borderBottomWidth: 1,
        borderBottomColor: '#4A3F35',
        backgroundColor: '#FFF',
    },
});

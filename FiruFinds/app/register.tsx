import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Input, Button } from '@rneui/themed';
import { supabase } from '../lib/supabase'; // Asegúrate de tener Supabase configurado en `lib/supabase.js`

export default function RegisterScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);

        // Crear usuario en Supabase Authentication
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
            // Insertar datos en la tabla profiles
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id, // El ID del usuario en auth.users
                        display_name: name,
                        phone,
                        email
                    }
                ]);

            if (profileError) {
                Alert.alert('Error', `Registro exitoso, pero hubo un problema guardando tu perfil: ${profileError.message}`);
            } else {
                Alert.alert('Registro exitoso', 'Ya puedes iniciar sesión');
                router.push('/'); // Redirige a la pantalla principal después del registro
            }
        }

        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registrarse</Text>

            <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="superhero@email.com" autoCapitalize="none" />
            <Input label="Teléfono" value={phone} onChangeText={setPhone} placeholder="23234389" keyboardType="phone-pad" />
            <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="Tu contraseña" />

            <Button title="Registrarse" onPress={signUpWithEmail} loading={loading} buttonStyle={styles.button} />
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
        maxWidth: '95%'
    },
});

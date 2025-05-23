import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// Pantalla de agradecimiento en los reportes sin autenticación
export default function Agradecimiento() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Image source={require('@/assets/images/agradecimiento.png')} style={styles.image} />
            <Text style={styles.message}>
                Gracias por tu reporte, con tu ayuda{'\n'}
                podremos reunir una familia
            </Text>
            <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={styles.volver}>Volver</Text>
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
    },
    image: {
        width: 200,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
        marginBottom: 20,
    },
    volver: {
        fontSize: 16,
        color: '#F4A83D', // Color naranja como en la imagen
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});

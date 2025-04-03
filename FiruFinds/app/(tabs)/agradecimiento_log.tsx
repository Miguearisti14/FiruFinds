import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Agradecimiento() {
    const router = useRouter();
    const { tipoReporte } = useLocalSearchParams();

    const mensaje = tipoReporte === 'perdidos'
        ? "Gracias por tu reporte, ya estamos un paso más cerca de hallar a tu mascota"
        : "Gracias por tu reporte, con tu ayuda podremos reunir una familia";


    return (
        <View style={styles.container}>
            <Image source={require('@/assets/images/agradecimiento.png')} style={styles.image} />
            <Text style={styles.message}>{mensaje}</Text>
            <TouchableOpacity onPress={() => router.push("/home")}>
                <Text style={styles.volver}>Volver al inicio</Text>
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

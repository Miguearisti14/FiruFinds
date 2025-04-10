import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Reportes() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>FiruFinds</Text>

            <View style={styles.section}>
                <Text style={styles.description}>
                    Perdí a mi mascota y quiero buscarla
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => router.push('../perdidos')}>
                    <Text style={styles.buttonText}>Perdido</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.description}>
                    Encontré a una mascota y quiero ayudarla a volver a casa
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => router.push('../encontrados')}>
                    <Text style={styles.buttonText}>Encontrado</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerTitle: {
        marginTop: -10,
        marginBottom: 200,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    section: {
        width: '100%',
        marginBottom: 50,
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',

    },
    button: {
        backgroundColor: '#F4A83D',
        borderRadius: 5,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        width: 220,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

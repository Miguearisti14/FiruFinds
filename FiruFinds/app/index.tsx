import { View, Text, TouchableOpacity, Image, StyleSheet, ImageBackground } from 'react-native';
import { Link, useRouter } from 'expo-router';

export default function LandingScreen() {
    const router = useRouter();

    return (
        <ImageBackground
            source={require('../assets/images/fondo.png')}
            style={styles.background}
            resizeMode="cover" // 'cover', 'contain', 'stretch', etc.
        >
            <View style={styles.container}>
                <Text style={styles.title}>FiruFinds</Text>
                <Image source={require('../assets/images/logo.jpg')} style={styles.logo} />

                <TouchableOpacity style={styles.button} onPress={() => router.push("/rapido")}>
                    <Text style={styles.buttonText}>Reporte Rápido</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/Auth")}>
                    <Text style={styles.linkText}>Iniciar Sesión</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: '20%',
        borderRadius: 100
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#4a3b2f',
        marginBottom: 40,
        marginTop: '50%'
    },
    button: {
        backgroundColor: '#f9a826',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        elevation: 3,
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 10,
    },
    linkText: {
        color: '#f9a826',
        fontSize: 16,
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    background: {
        flex: 1,
    },
});

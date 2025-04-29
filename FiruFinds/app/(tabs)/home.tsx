import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StatusBar,
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    BackHandler,
    Alert,
    ImageBackground
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../../utils/notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';


const Tab = createMaterialTopTabNavigator();

const PetCard = ({
    title,
    image,
}: {
    title: string;
    image: string;
}) => (
    <View style={styles.card}>
        <Image source={{ uri: image }} style={styles.cardImage} />
        <Text style={styles.cardTitle}>{title}</Text>
    </View>
);
// Pantalla de animales perdidos
function LostPetsScreen() {
    const [lostPets, setLostPets] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchLostPets = async () => {
            const { data, error } = await supabase
                .from('reportes_perdidos')
                .select(`
          id,
          nombre,
          image_url,
          razas(nombre)
        `)
                .limit(20);

            if (error) {
                console.error(error);
            } else {
                setLostPets(data || []);
            }
        };
        fetchLostPets();
    }, []);

    return (
        <ImageBackground
            source={require('../../assets/images/fondo.png')}
            style={styles.background}
            resizeMode="cover" // 'cover', 'contain', 'stretch', etc.
        >
            <FlatList
                data={lostPets}
                numColumns={2}
                contentContainerStyle={[styles.list, { backgroundColor: '#FFF' }]}
                style={{ backgroundColor: '#FFF' }}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{ flex: 1, margin: 5 }}
                        onPress={() =>
                            router.push(
                                `/detalles?type=lost&id=${item.id}`
                            )
                        }
                    >
                        <PetCard
                            title={item.razas?.nombre || 'Raza desconocida'}
                            image={item.image_url}
                        />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>
                            No se encontraron reportes.
                        </Text>
                    </View>
                }
            />
        </ImageBackground>
    );
}
// Pantalla de animales encontrados
function FoundPetsScreen() {
    const [foundPets, setFoundPets] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchFoundPets = async () => {
            const { data, error } = await supabase
                .from('reportes_encontrados')
                .select(`
          id,
          nombre,
          image_url,
          razas(nombre)
        `)
                .limit(20);

            if (error) {
                console.error(error);
            } else {
                setFoundPets(data || []);
            }
        };
        fetchFoundPets();
    }, []);

    return (
        <FlatList
            data={foundPets}
            numColumns={2}
            contentContainerStyle={[styles.list, { backgroundColor: '#FFF' }]}
            style={{ backgroundColor: '#FFF' }}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={{ flex: 1, margin: 5 }}
                    onPress={() =>
                        router.push(
                            `/detalles?type=found&id=${item.id}`
                        )
                    }
                >
                    <PetCard
                        title={item.razas?.nombre || 'Raza desconocida'}
                        image={item.image_url}
                    />
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>
                        No se encontraron reportes.
                    </Text>
                </View>
            }
        />
    );
}

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const cleanup = setupNotificationListeners();
        return cleanup;
    }, []);

    // Salir de la app con el botón atrás del celular
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {

                Alert.alert(
                    '¿Salir de la app?',
                    '¿Estás seguro de que deseas salir?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Salir', onPress: () => BackHandler.exitApp() },
                    ],
                    { cancelable: true }
                )
                return true
            }

            BackHandler.addEventListener('hardwareBackPress', onBackPress)

            return () =>
                BackHandler.removeEventListener('hardwareBackPress', onBackPress)
        }, [])
    )

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFF"
                translucent={false}
            />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('../perfil')}>
                    <Ionicons
                        name="person-circle-outline"
                        size={30}
                        color="#000"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FiruFinds</Text>
                <TouchableOpacity onPress={() => router.push('../notificaciones')}>
                    <MaterialCommunityIcons
                        name="paw"
                        size={30}
                        color="#000"
                    />
                </TouchableOpacity>
            </View>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#F4A83D',
                    tabBarInactiveTintColor: 'gray',
                    tabBarIndicatorStyle: { backgroundColor: '#F4A83D' },
                    tabBarStyle: { backgroundColor: '#FFF' },
                }}
            >
                <Tab.Screen name="Perdidos" component={LostPetsScreen} />
                <Tab.Screen name="Encontrados" component={FoundPetsScreen} />
            </Tab.Navigator>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    list: {
        padding: 10,
    },
    card: {
        flex: 1,
        backgroundColor: '#e5d6b6',
        borderRadius: 8,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    cardTitle: {
        padding: 10,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
    },
    background: {
        flex: 1,
    },

});
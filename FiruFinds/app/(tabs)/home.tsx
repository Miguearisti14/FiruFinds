import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase'

const Tab = createMaterialTopTabNavigator();

// Componente para renderizar cada elemento de la cuadrícula
const PetCard = ({ title, image }: { title: string; image: string }) => (
    <View style={styles.card}>
        <Image source={{ uri: image }} style={styles.cardImage} />
        <Text style={styles.cardTitle}>{title}</Text>
    </View>

);

// Componente para la pestaña "Perdidos" 
const LostPetsScreen = () => {
    const [lostPets, setLostPets] = useState<any[]>([]);

    // Cargar datos desde Supabase cuando el componente se monte
    useEffect(() => {
        const fetchLostPets = async () => {
            try {
                const { data, error } = await supabase

                    .from('reportes_perdidos')

                    .select('id, image_url, razas(nombre)')
                    .limit(20);

                if (error) {
                    console.error('Error al cargar reportes:', error.message);
                    return;
                }
                setLostPets(data || []);

            } catch (err) {
                console.error('Error en fetchFoundPets:', err);
            }
        };

        fetchLostPets();

    }, []);
    return (
        <FlatList
            data={lostPets}
            renderItem={({ item }) => (
                <PetCard
                    title={item.razas?.nombre || 'Raza desconocida'} // Usamos punto_referencia como título
                    image={item.image_url || 'https://via.placeholder.com/150'} // Usamos image_url para la imagen
                />

            )}

            keyExtractor={(item) => item.id.toString()} // Asegúrate de que cada reporte tenga un id único

            numColumns={2} // Mostrar 2 columnas

            contentContainerStyle={styles.list}

            ListEmptyComponent={
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>No se encontraron reportes.</Text>
                </View>

            }
        />
    );
};

// Componente para la pestaña "Encontrados"
const FoundPetsScreen = () => {

    const [foundPets, setFoundPets] = useState<any[]>([]);

    // Cargar datos desde Supabase cuando el componente se monte
    useEffect(() => {
        const fetchFoundPets = async () => {
            try {
                const { data, error } = await supabase

                    .from('reportes_encontrados')

                    .select('id, image_url, razas(nombre)')
                    .limit(20);

                if (error) {
                    console.error('Error al cargar reportes:', error.message);
                    return;
                }
                setFoundPets(data || []);

            } catch (err) {
                console.error('Error en fetchFoundPets:', err);
            }
        };

        fetchFoundPets();

    }, []);

    return (
        <FlatList
            data={foundPets}
            renderItem={({ item }) => (
                <PetCard
                    title={item.razas?.nombre || 'Raza desconocida'} // Usamos punto_referencia como título
                    image={item.image_url || 'https://via.placeholder.com/150'} // Usamos image_url para la imagen
                />

            )}

            keyExtractor={(item) => item.id.toString()} // Asegúrate de que cada reporte tenga un id único

            numColumns={2} // Mostrar 2 columnas

            contentContainerStyle={styles.list}

            ListEmptyComponent={
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>No se encontraron reportes.</Text>
                </View>

            }
        />
    );
};

export default function Home() {

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons name="person-circle-outline" size={30} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FiruFinds</Text>
                <TouchableOpacity>
                    <Ionicons name="notifications-outline" size={30} color="#000" />
                </TouchableOpacity>
            </View>
            <Tab.Navigator

                screenOptions={{

                    tabBarActiveTintColor: '#F4A83D',

                    tabBarInactiveTintColor: 'gray',

                    tabBarIndicatorStyle: {

                        backgroundColor: '#F4A83D',

                    },

                    tabBarStyle: {

                        backgroundColor: '#FFF',

                    },

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

        backgroundColor: '#FFF',

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
        margin: 5,
        backgroundColor: '#F5F5F5',
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

});

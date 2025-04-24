import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

type Category = 'raza' | 'especie' | 'tamano' | 'color' | 'nombre';
type ReportType = 'Perdidos' | 'Encontrados';

const Buscar = () => {
    //Constantes
    const params = useLocalSearchParams<{
        query?: string;
        selectedCategory?: Category;
        selectedReportType?: ReportType;
    }>();

    const [selectedReportType, setSelectedReportType] = useState<ReportType>(
        (params.selectedReportType as ReportType) || 'Perdidos'
    );
    const [selectedCategory, setSelectedCategory] = useState<Category>(
        (params.selectedCategory as Category) || 'raza'
    );
    const [query, setQuery] = useState<string>(params.query || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loadingResults, setLoadingResults] = useState<boolean>(false);

    const router = useRouter();

    //Categorias sugeridas para filtrar
    const fetchSuggestions = async (category: Category, text: string) => {
        if (!text) return [];
        let table = '';
        switch (category) {
            case 'raza':
                table = 'razas';
                break;
            case 'especie':
                table = 'especies';
                break;
            case 'tamano':
                table = 'tamanos';
                break;
            case 'color':
                table = 'colores';
                break;
            case 'nombre':
                return [];
        }
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .ilike('nombre', `%${text}%`)
            .limit(10);
        if (error) {
            console.error("Error al obtener sugerencias: ", error);
            return [];
        }
        return data;
    };

    const handleTextChange = async (text: string) => {
        setQuery(text);
        setLoadingSuggestions(true);
        const suggestionsData = await fetchSuggestions(selectedCategory, text);
        setSuggestions(suggestionsData);
        setLoadingSuggestions(false);
    };

    const selectSuggestion = (item: any) => {
        setQuery(item.nombre);
        setSuggestions([]);
    };

    // Selección de la tabla
    const getIdByNombre = async (category: Category, nombre: string) => {
        let table = '';
        switch (category) {
            case 'raza':
                table = 'razas';
                break;
            case 'especie':
                table = 'especies';
                break;
            case 'tamano':
                table = 'tamanos';
                break;
            case 'color':
                table = 'colores';
                break;
            default:
                return null;
        }
        const { data, error } = await supabase
            .from(table)
            .select('id')
            .ilike('nombre', nombre)
            .limit(1);
        if (error || !data || data.length === 0) {
            return null;
        }
        return data[0].id;
    };

    // Mostrar los reportes filtrados
    const fetchReportes = async () => {
        setLoadingResults(true);
        let dataReportes: any[] = [];
        const reportTable = selectedReportType === 'Perdidos' ? 'reportes_perdidos' : 'reportes_encontrados';

        if (selectedCategory !== 'nombre') {
            const idValue = await getIdByNombre(selectedCategory, query);
            if (!idValue) {
                setSearchResults([]);
                setLoadingResults(false);
                return;
            }
            const column = selectedCategory + '_id';
            const { data, error } = await supabase
                .from(reportTable)
                .select('*')
                .eq(column, idValue);
            if (error) {
                console.error(`Error al consultar ${reportTable}: `, error);
            } else if (data) {
                dataReportes = data;
            }
        } else {
            const { data, error } = await supabase
                .from(reportTable)
                .select('*')
                .ilike('nombre', `%${query}%`);
            if (error) {
                console.error(`Error al consultar ${reportTable} por nombre: `, error);
            } else if (data) {
                dataReportes = data;
            }
        }

        const resultsConFuente = dataReportes.map((item) => ({
            ...item,
            source: selectedReportType.toLowerCase(),
        }));
        setSearchResults(resultsConFuente);
        setLoadingResults(false);
    };

    // Ejecuta automáticamente fetchReportes cuando el componente se monta
    useEffect(() => {
        if (query) {
            fetchReportes();
        }
    }, []); // Se ejecuta solo una vez al montar

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FiruFinds</Text>
            <Text style={styles.subtitle}>Buscar Reportes</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedReportType}
                    onValueChange={(itemValue) => {
                        setSelectedReportType(itemValue as ReportType);
                        setQuery('');
                        setSuggestions([]);
                    }}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    mode="dropdown"
                >
                    <Picker.Item label="Perdidos" value="Perdidos" />
                    <Picker.Item label="Encontrados" value="Encontrados" />
                </Picker>
            </View>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue) => {
                        setSelectedCategory(itemValue as Category);
                        setQuery('');
                        setSuggestions([]);
                    }}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    mode="dropdown"
                >
                    <Picker.Item label="Raza" value="raza" />
                    <Picker.Item label="Especie" value="especie" />
                    <Picker.Item label="Tamaño" value="tamano" />
                    <Picker.Item label="Color" value="color" />
                    <Picker.Item label="Nombre" value="nombre" />
                </Picker>
            </View>
            <TextInput
                style={styles.input}
                value={query}
                onChangeText={handleTextChange}
                placeholder="Escribe para filtrar..."
            />
            {loadingSuggestions && <ActivityIndicator size="small" color="#0000ff" />}
            {!loadingSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => selectSuggestion(item)}
                            style={styles.suggestionItem}
                        >
                            <Text>{item.nombre}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <TouchableOpacity style={styles.button} onPress={fetchReportes}>
                <Text style={styles.buttonText}>Buscar</Text>
            </TouchableOpacity>
            {loadingResults ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => `${item.source}_${item.id}`}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{ flex: 1, margin: 5 }}
                            onPress={() => {
                                const reportType = selectedReportType === 'Perdidos' ? 'lost' : 'found';
                                router.push({
                                    pathname: '/detalles',
                                    params: {
                                        id: item.id,
                                        type: reportType,
                                        from: 'buscar',
                                        query,
                                        selectedCategory,
                                        selectedReportType,
                                    }
                                });
                                setSelectedReportType('Perdidos');
                            }}
                        >
                            <View style={styles.resultItem}>
                                <Text style={styles.resultText}>
                                    <Text style={{ fontWeight: 'bold' }}>Nombre: </Text>
                                    {item.nombre}
                                </Text>
                                <Image source={{ uri: item.image_url }} style={styles.image} />
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.noResults}>No se encontraron resultados.</Text>
                    }
                />
            )}
        </View>
    );
};

export default Buscar;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff'
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginBottom: 16,
        backgroundColor: '#fff',
        paddingHorizontal: 4,
        height: 45,
        justifyContent: 'center',
    },
    picker: {
        width: '100%',
    },
    pickerItem: {
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
        height: 45,
    },
    suggestionsContainer: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8
    },
    suggestionItem: {
        paddingVertical: 4
    },
    button: {
        backgroundColor: '#F4A83D',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 16
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    resultItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    resultText: {
        fontSize: 16
    },
    noResults: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16
    },
    title: {
        marginTop: -5,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    image: {
        width: '60%',
        height: 170,
        borderRadius: 16,
        marginBottom: 20,
        resizeMode: 'cover',
        marginTop: 10
    },
});

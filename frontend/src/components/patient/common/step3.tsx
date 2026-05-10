import { FoodItem, Step3Data } from '@/src/types/PatientRegisterTypes';
import { FAVORITE_PLACES, FAVORITE_SPORTS, LANGUAGES } from '@/src/constants/PatientFormConstants';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface Step3Props {
    data: Step3Data;
    onChange: (data: Partial<Step3Data>) => void;
}

export default function Step3Preferences({ data, onChange }: Step3Props) {
    const [placesOpen, setPlacesOpen] = useState(false);
    const [sportsOpen, setSportsOpen] = useState(false);
    const [languagesOpen, setLanguagesOpen] = useState(false);
    const [placesItems, setPlacesItems] = useState(FAVORITE_PLACES);
    const [sportsItems, setSportsItems] = useState(FAVORITE_SPORTS);
    const [languageItems, setLanguageItems] = useState(LANGUAGES);

    const handlePickFavoritePhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow photo library access.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            onChange({ favoritePhotos: [...data.favoritePhotos, result.assets[0].uri] });
        }
    };

    const handleRemoveFavoritePhoto = (index: number) => {
        onChange({
            favoritePhotos: data.favoritePhotos.filter((_, i) => i !== index),
        });
    };

    const handleAddFood = () => {
        const updated: FoodItem[] = [...data.foodsPreferred, { id: uuidv4(), name: '' }];
        onChange({ foodsPreferred: updated });
    };

    const handleRemoveFood = (id: string) => {
        onChange({
            foodsPreferred: data.foodsPreferred.filter((food) => food.id !== id),
        });
    };

    const handleUpdateFood = (id: string, name: string) => {
        onChange({
            foodsPreferred: data.foodsPreferred.map((food) =>
                food.id === id ? { ...food, name } : food
            ),
        });
    };

    return (
        <View className="gap-4">
            <View>
                <Text className="text-lg font-bold text-gray-800 mb-2">Your Preferences</Text>
                <Text className="text-sm text-gray-600 mb-4">Tell us what you love</Text>
            </View>

            {/* Favorite Pictures */}
            <View>
                <Text className="text-sm font-semibold text-gray-800 mb-2">Favorite Pictures</Text>
                <TouchableOpacity
                    onPress={handlePickFavoritePhoto}
                    className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300 items-center"
                >
                    <Ionicons name="image" size={32} color="#3b82f6" />
                    <Text className="text-sm text-blue-600 font-semibold mt-2">Upload Pictures</Text>
                </TouchableOpacity>

                {data.favoritePhotos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                        {data.favoritePhotos.map((uri, index) => (
                            <View key={`${uri}-${index}`} className="mr-3 relative">
                                <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                                <TouchableOpacity
                                    onPress={() => handleRemoveFavoritePhoto(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                >
                                    <Ionicons name="close" size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Favorite Places */}
            <View className="z-[3000]">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Favorite Places</Text>
                <View className="gap-2">
                    <DropDownPicker
                        open={placesOpen}
                        value={data.favoritePlaces || null}
                        items={placesItems}
                        setOpen={(open) => {
                            setPlacesOpen(open);
                            if (open) {
                                setSportsOpen(false);
                                setLanguagesOpen(false);
                            }
                        }}
                        setItems={setPlacesItems}
                        setValue={(callback) => {
                            const next = callback(data.favoritePlaces || null);
                            onChange({ favoritePlaces: (next as string) || '' });
                        }}
                        placeholder="Select place"
                        listMode="MODAL"
                    />
                    <View className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                        <TextInput
                            className="text-gray-800"
                            placeholder="Specify..."
                            placeholderTextColor="#d1d5db"
                            value={data.favoritePlacesText}
                            onChangeText={(text) => onChange({ favoritePlacesText: text })}
                        />
                    </View>
                </View>
            </View>

            {/* Festivals Celebrated */}
            <View>
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                    Festivals Celebrated
                </Text>
                <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-800"
                        placeholder="Search festivals (e.g., Sinhala New Year)"
                        placeholderTextColor="#d1d5db"
                        value={data.festivalsCelebrated}
                        onChangeText={(text) => onChange({ festivalsCelebrated: text })}
                    />
                </View>
            </View>

            {/* Foods Preferred */}
            <View>
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-semibold text-gray-800">Foods Preferred</Text>
                    <TouchableOpacity
                        onPress={handleAddFood}
                        className="bg-blue-100 rounded-full p-1"
                    >
                        <Ionicons name="add" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                {data.foodsPreferred.map((food) => (
                    <View key={food.id} className="flex-row gap-2 mb-2 items-center">
                        <TextInput
                            className="flex-1 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200 text-gray-800"
                            placeholder="e.g., Kiribath, Hoppers"
                            placeholderTextColor="#d1d5db"
                            value={food.name}
                            onChangeText={(text) => handleUpdateFood(food.id, text)}
                        />
                        <TouchableOpacity
                            onPress={() => handleRemoveFood(food.id)}
                            className="bg-red-100 rounded-lg p-2"
                        >
                            <Ionicons name="close" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}

                {data.foodsPreferred.length === 0 && (
                    <View className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-2">
                        <Text className="text-sm text-blue-700 text-center">
                            Add your favorite foods
                        </Text>
                    </View>
                )}
            </View>

            {/* Preferred Sports */}
            <View className="z-[2000]">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Preferred Sports</Text>
                <View className="gap-2">
                    <DropDownPicker
                        open={sportsOpen}
                        value={data.preferredSports || null}
                        items={sportsItems}
                        setOpen={(open) => {
                            setSportsOpen(open);
                            if (open) {
                                setPlacesOpen(false);
                                setLanguagesOpen(false);
                            }
                        }}
                        setItems={setSportsItems}
                        setValue={(callback) => {
                            const next = callback(data.preferredSports || null);
                            onChange({ preferredSports: (next as string) || '' });
                        }}
                        placeholder="Select sport"
                        listMode="MODAL"
                    />
                    <View className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                        <TextInput
                            className="text-gray-800"
                            placeholder="Specify..."
                            placeholderTextColor="#d1d5db"
                            value={data.preferredSportsText}
                            onChangeText={(text) => onChange({ preferredSportsText: text })}
                        />
                    </View>
                </View>
            </View>

            {/* Languages Preferred */}
            <View className="z-[1000]">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                    Languages Preferred
                </Text>
                <DropDownPicker
                    open={languagesOpen}
                    value={data.languagesPreferred || null}
                    items={languageItems}
                    setOpen={(open) => {
                        setLanguagesOpen(open);
                        if (open) {
                            setPlacesOpen(false);
                            setSportsOpen(false);
                        }
                    }}
                    setItems={setLanguageItems}
                    setValue={(callback) => {
                        const next = callback(data.languagesPreferred || null);
                        onChange({ languagesPreferred: (next as string) || '' });
                    }}
                    placeholder="Select language"
                    listMode="MODAL"
                />
            </View>
        </View>
    );
}

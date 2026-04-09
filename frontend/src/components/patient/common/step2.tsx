import { FamilyMember, LifeEvent, Step2Data } from '@/src/types/PatientRegisterTypes';
import { COUNTRY_OPTIONS, RELATION_OPTIONS } from '@/src/constants/PatientFormConstants';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface Step2Props {
    data: Step2Data;
    onChange: (data: Partial<Step2Data>) => void;
}

export default function Step2PersonalMemories({ data, onChange }: Step2Props) {
    const [openRelationId, setOpenRelationId] = useState<string | null>(null);
    const [relationItems, setRelationItems] = useState(RELATION_OPTIONS);
    const [countriesOpen, setCountriesOpen] = useState(false);
    const [countriesItems, setCountriesItems] = useState(COUNTRY_OPTIONS);

    const handleAddFamilyMember = () => {
        const updated: FamilyMember[] = [
            ...data.familyMembers,
            { 
                id: uuidv4(), 
                name: '', 
                photo: null, 
                relation: '' 
            },
        ];
        onChange({ familyMembers: updated });
    };

    const handleRemoveFamilyMember = (id: string) => {
        onChange({
            familyMembers: data.familyMembers.filter((member) => member.id !== id),
        });
        if (openRelationId === id) setOpenRelationId(null);
    };

    const handleUpdateFamilyMember = (
        id: string,
        field: keyof FamilyMember,
        value: string | null
    ) => {
        onChange({
            familyMembers: data.familyMembers.map((member) =>
                member.id === id ? { ...member, [field]: value } : member
            ),
        });
    };

    const handlePickFamilyPhoto = async (id: string) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow photo library access.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            handleUpdateFamilyMember(
                id, 'photo', 
                result.assets[0].uri
            );
        }
    };

    const handleAddLifeEvent = () => {
        const updated: LifeEvent[] = [...data.lifeEvents, { 
            id: uuidv4(), 
            title: '' 
        }];
        onChange({ lifeEvents: updated });
    };

    const handleRemoveLifeEvent = (id: string) => {
        onChange({ 
            lifeEvents: data.lifeEvents.filter((event) => event.id !== id) 
        });
    };

    const handleUpdateLifeEvent = (id: string, title: string) => {
        onChange({
            lifeEvents: data.lifeEvents.map((event) =>
                event.id === id ? { ...event, title } : event
            ),
        });
    };

    return (
        <View className="gap-4">
            <View>
                <Text className="text-lg font-bold text-gray-800 mb-2">Personal Memories</Text>
                <Text className="text-sm text-gray-600 mb-4">Share your cherished moments</Text>
            </View>

            {/* Family Members */}
            <View>
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-semibold text-gray-800">
                        Family Members &amp; Friends
                    </Text>
                    <TouchableOpacity
                        onPress={handleAddFamilyMember}
                        className="bg-blue-100 rounded-full p-1"
                    >
                        <Ionicons name="add" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-600 mb-3">
                    Add family members with photo and relation
                </Text>

                {data.familyMembers.map((member) => (
                    <View
                        key={member.id}
                        className="bg-white rounded-lg p-3 mb-2 border border-gray-200"
                    >
                        <View className="flex-row gap-3 items-start">
                            <TouchableOpacity
                                onPress={() => handlePickFamilyPhoto(member.id)}
                                className="w-16 h-16 rounded-lg bg-gray-200 justify-center items-center"
                            >
                                {member.photo ? (
                                    <Image source={{ uri: member.photo }} className="w-16 h-16 rounded-lg" />
                                ) : (
                                    <Ionicons name="camera" size={24} color="#9ca3af" />
                                )}
                            </TouchableOpacity>

                            <View className="flex-1">
                                <TextInput
                                    className="bg-gray-100 rounded px-3 py-2 text-gray-800 mb-2"
                                    placeholder="Member name"
                                    placeholderTextColor="#d1d5db"
                                    value={member.name}
                                    onChangeText={(text) =>
                                        handleUpdateFamilyMember(member.id, 'name', text)
                                    }
                                />

                                <View className="mb-2">
                                    <DropDownPicker
                                        open={openRelationId === member.id}
                                        value={member.relation || null}
                                        items={relationItems}
                                        setItems={setRelationItems}
                                        setOpen={(isOpen) =>
                                            setOpenRelationId(isOpen ? member.id : null)
                                        }
                                        setValue={(callback) => {
                                            const next = callback(member.relation || null);
                                            handleUpdateFamilyMember(
                                                member.id,
                                                'relation',
                                                (next as string) || ''
                                            );
                                        }}
                                        placeholder="Select relation"
                                        listMode="MODAL"
                                        style={{
                                            borderColor: '#e5e7eb',
                                            minHeight: 42,
                                        }}
                                        dropDownContainerStyle={{ borderColor: '#e5e7eb' }}
                                    />
                                </View>

                                <TouchableOpacity onPress={() => handleRemoveFamilyMember(member.id)}>
                                    <Text className="text-red-500 text-xs font-semibold">Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                {data.familyMembers.length === 0 && (
                    <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <Text className="text-sm text-blue-700 text-center">
                            Add family members to get started
                        </Text>
                    </View>
                )}
            </View>

            {/* Life Events - Dynamic */}
            <View>
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-semibold text-gray-800">Important Life Events</Text>
                    <TouchableOpacity
                        onPress={handleAddLifeEvent}
                        className="bg-blue-100 rounded-full p-1"
                    >
                        <Ionicons name="add" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                {data.lifeEvents.map((event) => (
                    <View key={event.id} className="flex-row items-center gap-2 mb-2">
                        <View className="flex-1 flex-row items-start bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                            <Ionicons name="calendar" size={20} color="#9ca3af" />
                            <TextInput
                                className="flex-1 ml-2 text-gray-800"
                                placeholder="e.g., Wedding, Job, Migration"
                                placeholderTextColor="#d1d5db"
                                value={event.title}
                                onChangeText={(text) => handleUpdateLifeEvent(event.id, text)}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={() => handleRemoveLifeEvent(event.id)}
                            className="bg-red-100 rounded-lg p-2"
                        >
                            <Ionicons name="close" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}

                {data.lifeEvents.length === 0 && (
                    <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <Text className="text-sm text-blue-700 text-center">
                            Add life events to get started
                        </Text>
                    </View>
                )}
            </View>

            {/* Countries Lived */}
            <View className="z-30">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Countries Lived</Text>
                <DropDownPicker
                    open={countriesOpen}
                    value={data.countriesLived || null}
                    items={countriesItems}
                    setOpen={setCountriesOpen}
                    setItems={setCountriesItems}
                    setValue={(callback) => {
                        const next = callback(data.countriesLived || null);
                        onChange({ countriesLived: (next as string) || '' });
                    }}
                    placeholder="Select country"
                    listMode="MODAL"
                    style={{ borderColor: '#e5e7eb', minHeight: 46 }}
                    dropDownContainerStyle={{ borderColor: '#e5e7eb' }}
                />
            </View>

            {/* Occupations */}
            <View>
                <Text className="text-sm font-semibold text-gray-800 mb-2">Occupation(s)</Text>
                <View className="flex-row items-start bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <Ionicons name="briefcase" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-800"
                        placeholder="e.g., Teacher, Farmer, Engineer"
                        placeholderTextColor="#d1d5db"
                        value={data.occupations}
                        onChangeText={(text) => onChange({ occupations: text })}
                    />
                </View>
            </View>
        </View>
    );
}
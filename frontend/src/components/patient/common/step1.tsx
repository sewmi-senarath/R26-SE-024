import { Step1Data } from '@/src/types/PatientRegisterTypes';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

interface Step1Props {
    data:     Step1Data;
    onChange: (data: Partial<Step1Data>) => void;
}

export default function Step1BasicInfo({ data, onChange }: Step1Props) {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [items, setItems] = useState([
        { label: 'Male',              value: 'male'   },
        { label: 'Female',            value: 'female' },
        { label: 'Prefer Not to Say', value: 'none'   },
    ]);

    return (
        <View className="gap-6">
            <View>
                <Text className="text-lg font-bold text-gray-800 mb-2">
                    Basic Information
                </Text>
                <Text className="text-sm text-gray-600 mb-4">
                    Tell us about yourself
                </Text>
            </View>

            {/* Full Name */}
            <View className="w-full">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                    Full Name <Text className="text-red-500">*</Text>
                </Text>
                <View className="w-full flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <Ionicons name="person" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-800"
                        placeholder="Enter your name"
                        placeholderTextColor="#d1d5db"
                        value={data.fullName}
                        onChangeText={(text) => onChange({ fullName: text })}
                    />
                </View>
            </View>

            {/* ✅ Email */}
            <View className="w-full">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                    Email <Text className="text-red-500">*</Text>
                </Text>
                <View className="w-full flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <Ionicons name="mail" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-800"
                        placeholder="Enter your email"
                        placeholderTextColor="#d1d5db"
                        value={data.email}
                        onChangeText={(text) => onChange({ email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {/* ✅ Password */}
            <View className="w-full">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                    Password <Text className="text-red-500">*</Text>
                </Text>
                <View className="w-full flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-800"
                        placeholder="Min 6 characters"
                        placeholderTextColor="#d1d5db"
                        value={data.password}
                        onChangeText={(text) => onChange({ password: text })}
                        secureTextEntry={!showPassword}
                    />
                    <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9ca3af"
                        onPress={() => setShowPassword(!showPassword)}
                    />
                </View>
            </View>

            {/* Age */}
            <View className="w-full">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                    Age <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <TextInput
                        className="flex-1 text-gray-800"
                        placeholder="Age"
                        placeholderTextColor="#d1d5db"
                        keyboardType="numeric"
                        value={data.age}
                        onChangeText={(text) => onChange({ age: text })}
                    />
                </View>
            </View>

            {/* Gender */}
            <View className="flex-1 z-40 mb-7">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                    Gender <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <DropDownPicker
                        open={open}
                        value={data.gender || null}
                        items={items}
                        setOpen={setOpen}
                        setItems={setItems}
                        setValue={(callback) => {
                            const next = callback(data.gender || null);
                            onChange({ gender: (next as Step1Data['gender']) || '' });
                        }}
                        listMode="SCROLLVIEW"
                        placeholder="Select"
                        style={{
                            borderWidth:     0,
                            backgroundColor: 'transparent',
                            minHeight:       3,
                        }}
                        textStyle={{ fontSize: 14, color: '#1f2937' }}
                        placeholderStyle={{ color: '#d1d5db' }}
                        dropDownContainerStyle={{
                            borderWidth:     1,
                            borderColor:     '#e5e7eb',
                            backgroundColor: '#ffffff',
                            marginTop:       4,
                        }}
                        listItemLabelStyle={{ fontSize: 14, color: '#1f2937' }}
                        selectedItemLabelStyle={{ fontWeight: '600', color: '#1f2937' }}
                    />
                </View>
            </View>
        </View>
    );
}
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CaregiverRegistration() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleLoginPress = () => {
        router.push('/auth/login');
    };

    const handleBackPress = () => {
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <ScrollView
                className="flex-1 bg-gray-50"
                scrollEnabled={true}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-6 py-6">
                    {/* Back Button */}
                    <TouchableOpacity onPress={handleBackPress} className="mb-6">
                        <View className="w-10 h-10 rounded-full bg-white justify-center items-center shadow-sm">
                            <Ionicons name="chevron-back" size={24} color="#1e40af" />
                        </View>
                    </TouchableOpacity>

                    {/* Icon */}
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 rounded-full bg-blue-500 justify-center items-center mb-4">
                            <Ionicons name="person" size={40} color="white" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-800">
                            Caregiver Registration
                        </Text>
                        <Text className="text-center text-gray-600 text-sm mt-2">
                            Create your account to get started
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View className="gap-4 mt-6">
                        {/* Full Name */}
                        <View>
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                                Full Name
                            </Text>
                            <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                                <Ionicons name="person" size={20} color="#9ca3af" className="mr-2" />
                                <TextInput
                                    className="flex-1 ml-2 text-gray-800"
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#d1d5db"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        {/* Email Address */}
                        <View>
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                                Email Address
                            </Text>
                            <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                                <Ionicons name="mail" size={20} color="#9ca3af" />
                                <TextInput
                                    className="flex-1 ml-2 text-gray-800"
                                    placeholder="your.email@example.com"
                                    placeholderTextColor="#d1d5db"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View>
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                                Password
                            </Text>
                            <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                                <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                                <TextInput
                                    className="flex-1 ml-2 text-gray-800"
                                    placeholder="Create a password"
                                    placeholderTextColor="#d1d5db"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye' : 'eye-off'}
                                        size={20}
                                        color="#9ca3af"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View>
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                                Confirm Password
                            </Text>
                            <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                                <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                                <TextInput
                                    className="flex-1 ml-2 text-gray-800"
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#d1d5db"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye' : 'eye-off'}
                                        size={20}
                                        color="#9ca3af"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                        className="bg-blue-600 rounded-lg py-4 px-6 items-center justify-center mt-8 shadow-md"
                    >
                        <Text className="text-white font-semibold text-base">Register</Text>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View className="flex-row justify-center items-center gap-1 mt-6 mb-6">
                        <Text className="text-gray-600 text-sm">Already have an account?</Text>
                        <TouchableOpacity onPress={handleLoginPress}>
                            <Text className="text-blue-600 font-semibold text-sm">Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
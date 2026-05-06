import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { FamilyMember, FoodItem, Step1Data, Step2Data, Step3Data } from '@/src/types/PatientRegisterTypes';
import Step1BasicInfo from './step1';
import Step2PersonalMemories from './step2';
import Step3Preferences from './step3';

export default function PatientRegistration() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<number>(1);

    const [step1Data, setStep1Data] = useState<Step1Data>({
        fullName: '',
        age: '',
        gender: '',
    });

    const [step2Data, setStep2Data] = useState<Step2Data>({
        familyMembers: [] as FamilyMember[],
        lifeEvents: [],
        countriesLived: '',
        occupations: '',
    });

    const [step3Data, setStep3Data] = useState<Step3Data>({
        favoritePhotos: [] as string[],
        favoritePlaces: '',
        favoritePlacesText: '',
        festivalsCelebrated: '',
        foodsPreferred: [] as FoodItem[],
        preferredSports: '',
        preferredSportsText: '',
        languagesPreferred: '',
    });

    const handleBackPress = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    const handleNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        const payload = { ...step1Data, ...step2Data, ...step3Data };
        console.log('Submit patient registration', payload);
        // Add submission logic here
        router.push('/patient');
    };

    const renderProgressBar = () => (
        <View className="px-6 py-4">
            <View className="flex-row gap-2 mb-2">
                {[1, 2, 3].map((step) => (
                    <View key={step} className="flex-1">
                        <View
                            className={`h-1 rounded-full ${
                                currentStep >= step ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        />
                    </View>
                ))}
            </View>
            <Text className="text-sm text-gray-600 text-center">Step {currentStep} of 3</Text>
        </View>
    );

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
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={handleBackPress}
                        className="w-10 h-10 rounded-full bg-white justify-center items-center shadow-sm"
                    >
                        <Ionicons name="chevron-back" size={24} color="#1e40af" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800">Patient Profile</Text>
                </View>

                {/* Progress Bar */}
                {renderProgressBar()}

                {/* Form Content */}
                <View className="px-6 pb-6">
                    {currentStep === 1 && (
                        <Step1BasicInfo
                            data={step1Data}
                            onChange={(partial) =>
                                setStep1Data((prev) => ({ ...prev, ...partial }))
                            }
                        />
                    )}
                    {currentStep === 2 && (
                        <Step2PersonalMemories
                            data={step2Data}
                            onChange={(partial) =>
                                setStep2Data((prev) => ({ ...prev, ...partial }))
                            }
                        />
                    )}
                    {currentStep === 3 && (
                        <Step3Preferences
                            data={step3Data}
                            onChange={(partial) =>
                                setStep3Data((prev) => ({ ...prev, ...partial }))
                            }
                        />
                    )}
                </View>

                {/* Navigation Buttons */}
                <View className="px-6 pb-6 gap-3 flex-row">
                    {currentStep > 1 && (
                        <TouchableOpacity
                            onPress={() => setCurrentStep(currentStep - 1)}
                            className="flex-1 bg-gray-300 rounded-lg py-4 items-center"
                        >
                            <Text className="text-gray-700 font-semibold">Previous</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={handleNextStep}
                        className="flex-1 bg-blue-600 rounded-lg py-4 items-center"
                    >
                        <Text className="text-white font-semibold">
                            {currentStep === 3 ? 'Complete' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
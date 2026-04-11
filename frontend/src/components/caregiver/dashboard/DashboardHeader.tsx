import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';


interface DashboardHeaderProps {
    caregiverName: string;
    avatarUrl?: string;
    alertCount?: number;
    onNotificationPress?: () => void;
    onProfilePress?: () => void;
}

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const getGreetingEmoji = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return '👋';
    if (hour < 18) return '☀️';
    return '🌙';
};

const getDayString = (): string => {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    caregiverName,
    alertCount = 0,
    onNotificationPress,
    onProfilePress,
}) => {
    return (
        <View className="px-5 pt-4 pb-2">
            {/* Top Bar */}
            <View className="flex-row items-center justify-between mb-4">
                {/* Logo */}
                <View className="flex-row items-center gap-2">
                    <Image
                        source={require('../../../../assets/images/favicon.png')}
                        style={{ width: 32, height: 32, resizeMode: 'contain' }}
                    />
                    <Text
                        className="text-lg font-bold"
                        style={{ color: Colors.textPrimary }}
                    >
                        MemoCare
                    </Text>
                </View>

                {/* Right Icons */}
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={onNotificationPress}
                        className="relative w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: Colors.border }}
                    >
                        <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
                        {alertCount > 0 && (
                            <View
                                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full items-center justify-center"
                                style={{ backgroundColor: Colors.danger }}
                            >
                                <Text className="text-white text-xs font-bold">{alertCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onProfilePress}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: Colors.primary }}
                    >
                        <Text className="text-white font-bold text-sm">
                            {caregiverName.slice(0, 2).toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Greeting */}
            <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: Colors.primaryLight }}
            >
                <Text className="text-sm" style={{ color: Colors.primary }}>
                    {getDayString()}
                </Text>
                <View className="flex-row items-center gap-2 mt-1">
                    <Text
                        className="text-2xl font-bold"
                        style={{ color: Colors.textPrimary }}
                    >
                        {getGreeting()},{' '}
                        <Text style={{ color: Colors.primary }}>{caregiverName}</Text>
                    </Text>
                    <Text className="text-2xl">{getGreetingEmoji()}</Text>
                </View>
                <Text className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
                    Here's your care overview for today
                </Text>
            </View>
        </View>
    );
};
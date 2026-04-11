import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Colors } from '../../../constants/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  required,
  ...props
}) => {
  return (
    <View className="mb-4">
      {/* Label */}
      <View className="flex-row mb-1.5">
        <Text
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: Colors.textSecondary }}
        >
          {label}
        </Text>
        {required && (
          <Text style={{ color: Colors.danger, marginLeft: 3 }}>*</Text>
        )}
      </View>

      {/* Input */}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        style={{
          backgroundColor: Colors.background,
          borderWidth: 1.5,
          borderColor: error ? Colors.danger : Colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 14,
          color: Colors.textPrimary,
        }}
        {...props}
      />

      {/* Error */}
      {error && (
        <Text
          className="text-xs mt-1"
          style={{ color: Colors.danger }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
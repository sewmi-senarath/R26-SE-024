import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

interface PatientSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export const PatientSearchBar: React.FC<PatientSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,   // ← matches patient cards exactly
        marginBottom: 16,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 16,
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: value ? Colors.primary : Colors.border,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={value ? Colors.primary : Colors.textMuted}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by name, condition or stage..."
        placeholderTextColor={Colors.textMuted}
        style={{
          flex: 1,
          marginLeft: 8,
          fontSize: 13,
          color: Colors.textPrimary,
          minWidth: 0,
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};
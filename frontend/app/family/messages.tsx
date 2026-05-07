import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { getMessages } from '../../src/services/family/familyService';
import { FamilyMessage } from '../../src/types/family.types';

export default function MessagesScreen() {
  const [messages, setMessages] = useState<FamilyMessage[]>(getMessages());
  const [text, setText] = useState('');

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg: FamilyMessage = {
      id: `m-${Date.now()}`,
      senderId: 'family',
      senderName: 'You',
      text: text.trim(),
      timestamp: 'Just now',
      isRead: true,
    };
    setMessages((prev) => [...prev, msg]);
    setText('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ backgroundColor: Colors.white, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>Messages</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success }} />
          <Text style={{ fontSize: 13, color: Colors.textMuted }}>Nurse Sarah is online</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === 'family';
            return (
              <View key={msg.id} style={{ flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 }}>
                {/* Avatar */}
                {!isMe && (
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary }}>NS</Text>
                  </View>
                )}
                <View style={{ maxWidth: '75%' }}>
                  {!isMe && <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 4, marginLeft: 4 }}>{msg.senderName}</Text>}
                  <View style={{ backgroundColor: isMe ? Colors.primary : Colors.white, borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                    <Text style={{ fontSize: 14, color: isMe ? '#fff' : Colors.textPrimary, lineHeight: 20 }}>{msg.text}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: isMe ? 'right' : 'left', marginHorizontal: 4 }}>{msg.timestamp}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Composer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: Colors.white, gap: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, maxHeight: 100 }}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', opacity: text.trim() ? 1 : 0.5 }}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

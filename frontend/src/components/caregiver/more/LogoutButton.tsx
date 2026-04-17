import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  Modal, TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

interface LogoutButtonProps {
  onLogout: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirmLogout = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setShowConfirm(false);
    onLogout();
  };

  return (
    <>
      {/* Logout row */}
      <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
        <View
          style={{
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: Colors.dangerSoft,
            shadowColor: Colors.danger,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowConfirm(true)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: Colors.white,
              borderRadius: 18,
            }}
          >
            <View
              style={{
                width: 38, height: 38,
                borderRadius: 12,
                backgroundColor: Colors.dangerSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            </View>
            <Text
              style={{
                flex: 1, fontSize: 14,
                fontWeight: '600', color: Colors.danger,
              }}
            >
              Log Out
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.danger + '80'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => !loading && setShowConfirm(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15,23,42,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 30,
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 28,
                  padding: 28,
                  width: '100%',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 30,
                  elevation: 10,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 64, height: 64,
                    borderRadius: 22,
                    backgroundColor: Colors.dangerSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="log-out-outline" size={30} color={Colors.danger} />
                </View>

                <Text
                  style={{
                    fontSize: 18, fontWeight: '800',
                    color: Colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Log Out?
                </Text>
                <Text
                  style={{
                    fontSize: 13, color: Colors.textMuted,
                    textAlign: 'center', lineHeight: 19,
                    marginBottom: 24,
                  }}
                >
                  You will be signed out of your MemoCare account.
                  Your data will remain safe.
                </Text>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                  <TouchableOpacity
                    onPress={() => setShowConfirm(false)}
                    disabled={loading}
                    style={{
                      flex: 1, height: 48,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: Colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.white,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14, fontWeight: '700',
                        color: Colors.textSecondary,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmLogout}
                    disabled={loading}
                    style={{
                      flex: 1, height: 48,
                      borderRadius: 14,
                      backgroundColor: Colors.danger,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6,
                      shadowColor: Colors.danger,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Ionicons name="log-out-outline" size={16} color={Colors.white} />
                        <Text
                          style={{
                            fontSize: 14, fontWeight: '700',
                            color: Colors.white,
                          }}
                        >
                          Log Out
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
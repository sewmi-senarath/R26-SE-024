import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet, SafeAreaView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../src/constants/colors";

export default function CustomerSelect() {
  const router = useRouter();
  const [customerCode, setCustomerCode] = useState("");

  const handleContinue = () => {
    if (customerCode.trim()) {
      // In a real app, we would validate the code and set the active patient context
      router.push("/caregiver");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
             <Ionicons name="people" size={40} color={Colors.sageGreen} />
          </View>
          <Text style={styles.title}>Patient Selection</Text>
          <Text style={styles.subtitle}>Enter the registered customer code to view patient dashboard</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Code</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="barcode-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E.g. PAT-2026-001"
                placeholderTextColor="#94A3B8"
                value={customerCode}
                onChangeText={setCustomerCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.continueBtn, !customerCode.trim() && styles.disabledBtn]} 
            onPress={handleContinue}
            disabled={!customerCode.trim()}
          >
            <Text style={styles.continueBtnText}>Access Dashboard</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/role/select")} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Admin Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: Colors.sageGreen + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Open Sans',
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    fontFamily: 'Roboto',
    flex: 1,
    paddingVertical: 16,
    fontSize: 17,
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 1,
  },
  continueBtn: {
    backgroundColor: Colors.sageGreen,
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.sageGreen,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  disabledBtn: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  logoutBtn: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontFamily: 'Inter',
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  }
});

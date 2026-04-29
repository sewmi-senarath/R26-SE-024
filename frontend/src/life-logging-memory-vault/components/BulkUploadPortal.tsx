import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

const BulkUploadPortal = () => {
  return (
    <View style={styles.container}>
      <View style={styles.uploadBox}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-upload-outline" size={48} color="#475569" />
        </View>
        <Text style={styles.title}>Bulk Data Ingestion Portal</Text>
        <Text style={styles.subtitle}>
          Drag and drop your smart glass export files (.xlsx, .csv) here or click to browse your local directory.
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Select Spreadsheet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>View Template</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  uploadBox: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 450,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  primaryBtn: {
    backgroundColor: Colors.sageGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: '#475569',
    fontWeight: '700',
  }
});

export default BulkUploadPortal;

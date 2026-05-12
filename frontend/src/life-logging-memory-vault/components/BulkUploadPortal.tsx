import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
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
    padding: Platform.OS === 'web' ? 50 : 25,
    alignItems: 'center',
    marginVertical: 25,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  title: {
    fontFamily: 'Open Sans',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 500,
    marginBottom: 35,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.sageGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.sageGreen,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    minWidth: 180,
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontWeight: '800',
    marginLeft: 10,
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Inter',
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  }
});

export default BulkUploadPortal;

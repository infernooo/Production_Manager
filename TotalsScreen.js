import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function TotalsScreen({ navigation }) {
  const [totals, setTotals] = useState({ ftd: 0, ftm: 0, fty: 0, cum: 0 });
  const [pastedData, setPastedData] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadTotals = async () => {
        try {
          const totalsDocRef = doc(db, "totals", "productionTotals");
          const docSnap = await getDoc(totalsDocRef);
          if (docSnap.exists()) {
            setTotals(docSnap.data());
          } else {
            await setDoc(doc(db, "totals", "productionTotals"), { ftd: 0, ftm: 0, fty: 0, cum: 0 });
          }
        } catch (e) {
          console.error("Failed to load totals", e);
        } finally {
          setIsLoading(false);
        }
      };
      loadTotals();
    }, [])
  );

  const handlePasteAndUpdate = async () => {
    if (!pastedData) {
      Alert.alert('Missing Data', 'Please paste the totals into the text box first.');
      return;
    }
    
    try {
      const parts = pastedData.split('/');

      if (parts.length < 4) {
        Alert.alert('Invalid Format', 'Please ensure the pasted text has four values separated by slashes.');
        return;
      }
      
      const newFtm = parseFloat(parts[1].replace(/m³/g, '').trim()) || 0;
      const newFty = parseFloat(parts[2].replace(/m³/g, '').trim()) || 0;
      const newCum = parseFloat(parts[3].replace(/m³/g, '').trim()) || 0;

      const totalsDocRef = doc(db, 'totals', 'productionTotals');
      await updateDoc(totalsDocRef, {
        ftm: newFtm,
        fty: newFty,
        cum: newCum
      });

      setTotals(prev => ({ ...prev, ftm: newFtm, fty: newFty, cum: newCum }));
      Alert.alert('Success', 'Totals have been updated from clipboard!');
    } catch (error) {
      console.error('Error handling paste and save:', error);
      Alert.alert('Error', 'An error occurred while updating totals.');
    }
  };

  if (isLoading) {
    return <View style={styles.container}><Text>Loading...</Text></View>
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.form}>
        <Text style={styles.title}>Edit Production Totals (m³)</Text>

        <View style={styles.card}>
          <Text style={styles.totalText}>Current FTD: {totals.ftd.toFixed(1)} m³</Text>
          <Text style={styles.totalText}>Current FTM: {totals.ftm.toFixed(1)} m³</Text>
          <Text style={styles.totalText}>Current FTY: {totals.fty.toFixed(1)} m³</Text>
          <Text style={styles.totalText}>Current CUM: {totals.cum.toFixed(1)} m³</Text>
        </View>
        
        <Text style={styles.label}>Paste Totals from Report:</Text>
        <TextInput
          style={styles.input}
          placeholder="FTD/FTM/FTY/CUM"
          placeholderTextColor="#6c757d"
          onChangeText={setPastedData}
          value={pastedData}
        />

        <View style={styles.buttonContainer}>
          <Button title="Update Totals" onPress={handlePasteAndUpdate} />
        </View>
        
        <Text style={styles.infoText}>
          Example: 286.2m³ / 1990.6m³ / 62399.6m³ / 64166.2m³
        </Text>
        <Text style={styles.infoText}>
          Note: The FTD value will not be updated.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { 
    backgroundColor: '#fff', 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 5, 
    padding: 10, 
    marginBottom: 20, 
    fontSize: 18,
    color: '#000',
    placeholderTextColor: '#6c757d',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalText: {
    fontSize: 18,
    marginBottom: 5,
  },
  buttonContainer: {
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 5,
  }
});

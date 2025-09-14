import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
// NEW: Import Firebase tools
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function TotalsScreen({ navigation }) {
  // We will store numbers, but convert to string for the input
  const [totals, setTotals] = useState({ ftm: 0, fty: 0, cum: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // UPDATED: Loads data from Firestore
  useFocusEffect(
    useCallback(() => {
      const loadTotals = async () => {
        try {
          const totalsDocRef = doc(db, "totals", "productionTotals");
          const docSnap = await getDoc(totalsDocRef);
          if (docSnap.exists()) {
            setTotals(docSnap.data());
          } else {
            // If the document doesn't exist, we can create it here with default values
            await setDoc(doc(db, "totals", "productionTotals"), { ftm: 0, fty: 0, cum: 0 });
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

  // UPDATED: Saves data to Firestore
  const handleSave = async () => {
    try {
      // Convert state values to numbers before saving
      const totalsToSave = {
        ftm: parseFloat(totals.ftm) || 0,
        fty: parseFloat(totals.fty) || 0,
        cum: parseFloat(totals.cum) || 0,
      };
      
      const totalsDocRef = doc(db, "totals", "productionTotals");
      await setDoc(totalsDocRef, totalsToSave);

      Alert.alert("Success", "Totals have been updated in the cloud.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to save totals.");
      console.error("Failed to save totals", e);
    }
  };

  if (isLoading) {
    return <View style={styles.container}><Text>Loading...</Text></View>
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Edit Production Totals (m³)</Text>
        
        <Text style={styles.label}>For The Month (FTM)</Text>
        <TextInput
          style={styles.input}
          value={String(totals.ftm)}
          onChangeText={(text) => setTotals(prev => ({ ...prev, ftm: text }))}
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>For The Year (FTY)</Text>
        <TextInput
          style={styles.input}
          value={String(totals.fty)}
          onChangeText={(text) => setTotals(prev => ({ ...prev, fty: text }))}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Cumulative (CUM)</Text>
        <TextInput
          style={styles.input}
          value={String(totals.cum)}
          onChangeText={(text) => setTotals(prev => ({ ...prev, cum: text }))}
          keyboardType="numeric"
        />

        <Button title="Save Totals" onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 20, fontSize: 18 },
});
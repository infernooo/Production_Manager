import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function AddRequirementScreen({ navigation }) {
  const [structureID, setStructureID] = useState('');
  const [structureType, setStructureType] = useState('');
  const [grade, setGrade] = useState('');
  const [trialMixNum, setTrialMixNum] = useState('');
  const [requiredQty, setRequiredQty] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const handleCreateRequirement = async () => {
    if (!structureID || !grade || !requiredQty) {
      Alert.alert('Missing Info', 'Please fill in at least Structure ID, Grade, and Quantity.');
      return;
    }
    
    setIsLoading(true); // Start loading
    
    try {
      await addDoc(collection(db, 'requirements'), {
        structureID: structureID,
        structureType: structureType,
        grade: grade,
        trialMixNum: trialMixNum,
        requiredQty: parseFloat(requiredQty),
        status: 'Active',
      });
      
      Alert.alert("Success", "New requirement saved to the online database.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (e) {
      console.error("Error adding document: ", e);
      Alert.alert("Error", "Could not save the new requirement.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Show loading screen overlay when saving
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Saving requirement...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <View style={styles.form}>
            <Text style={styles.label}>Structure ID</Text>
            <TextInput 
              style={styles.input} 
              value={structureID} 
              onChangeText={setStructureID}
              editable={!isLoading} // Disable inputs while loading
            />
            <Text style={styles.label}>Structure Type</Text>
            <TextInput 
              style={styles.input} 
              value={structureType} 
              onChangeText={setStructureType}
              editable={!isLoading}
            />
            <Text style={styles.label}>Grade</Text>
            <TextInput 
              style={styles.input} 
              value={grade} 
              onChangeText={setGrade}
              editable={!isLoading}
            />
            <Text style={styles.label}>Trial Mix Number</Text>
            <TextInput 
              style={styles.input} 
              value={trialMixNum} 
              onChangeText={setTrialMixNum}
              editable={!isLoading}
            />
            <Text style={styles.label}>Required Quantity (m³)</Text>
            <TextInput 
              style={styles.input} 
              value={requiredQty} 
              onChangeText={setRequiredQty} 
              keyboardType="numeric"
              editable={!isLoading}
            />
            <View style={styles.buttonContainer}>
              <Button 
                title={isLoading ? "Saving..." : "Create Requirement"} 
                onPress={handleCreateRequirement}
                disabled={isLoading} // Disable button while loading
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 20 },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 15 },
  buttonContainer: { marginTop: 10 },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});
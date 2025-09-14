import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// NEW: Import Firebase tools for reading and updating a single document
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function EditRequirementScreen({ route, navigation }) {
  const { requirementId } = route.params;

  const [structureID, setStructureID] = useState('');
  const [structureType, setStructureType] = useState('');
  const [grade, setGrade] = useState('');
  const [trialMixNum, setTrialMixNum] = useState('');
  const [requiredQty, setRequiredQty] = useState('');

  // THIS IS THE UPDATED LOADING LOGIC
  useEffect(() => {
    const loadRequirementData = async () => {
      try {
        // Create a reference to the specific document in Firestore
        const docRef = doc(db, 'requirements', requirementId);
        // Fetch the document
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const requirementToEdit = docSnap.data();
          setStructureID(requirementToEdit.structureID);
          setStructureType(requirementToEdit.structureType);
          setGrade(requirementToEdit.grade);
          setTrialMixNum(requirementToEdit.trialMixNum);
          setRequiredQty(String(requirementToEdit.requiredQty));
        } else {
          console.log("No such document!");
        }
      } catch (e) {
        console.error("Failed to load requirement for editing.", e);
      }
    };
    loadRequirementData();
  }, [requirementId]);

  // THIS IS THE UPDATED SAVING LOGIC
  const handleUpdateRequirement = async () => {
    if (!structureID || !grade || !requiredQty) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    try {
      // Create a reference to the specific document
      const docRef = doc(db, 'requirements', requirementId);

      // Update the document with the new data from the form
      await updateDoc(docRef, {
        structureID,
        structureType,
        grade,
        trialMixNum,
        requiredQty: parseFloat(requiredQty),
      });

      Alert.alert("Success", "Requirement updated successfully.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (e) {
      console.error("Failed to update requirement", e);
      Alert.alert("Error", "Could not update the requirement.");
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>Structure ID</Text>
          <TextInput style={styles.input} value={structureID} onChangeText={setStructureID} />
          <Text style={styles.label}>Structure Type</Text>
          <TextInput style={styles.input} value={structureType} onChangeText={setStructureType} />
          <Text style={styles.label}>Grade</Text>
          <TextInput style={styles.input} value={grade} onChangeText={setGrade} />
          <Text style={styles.label}>Trial Mix Number</Text>
          <TextInput style={styles.input} value={trialMixNum} onChangeText={setTrialMixNum} />
          <Text style={styles.label}>Required Quantity (m³)</Text>
          <TextInput style={styles.input} value={requiredQty} onChangeText={setRequiredQty} keyboardType="numeric" />
          <Button title="Save Changes" onPress={handleUpdateRequirement} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 20 },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 15 },
});
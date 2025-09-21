import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, collection, addDoc, updateDoc, where, query, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function DispatchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { requirementId } = route.params;

  const [requirement, setRequirement] = useState(null);
  const [plant, setPlant] = useState('');
  const [millerNum, setMillerNum] = useState('');
  const [dispatchedQty, setDispatchedQty] = useState('');
  const [cumulativeQty, setCumulativeQty] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const reqDocRef = doc(db, 'requirements', requirementId);
        const reqDocSnap = await getDoc(reqDocRef);
        if (reqDocSnap.exists()) {
          setRequirement({ ...reqDocSnap.data(), id: reqDocSnap.id });
        }

        const dispsQuery = query(collection(db, "dispatches"), where("requirementId", "==", requirementId));
        const querySnapshot = await getDocs(dispsQuery);
        const total = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().dispatchedQty, 0);
        setCumulativeQty(total);
      } catch (e) {
        console.error('Failed to load data from Firebase', e);
      }
    };
    loadData();
  }, [requirementId]);

  const handleLogDispatch = async () => {
    if (!millerNum || !dispatchedQty || !plant) {
      alert('Please fill in all dispatch details.');
      return;
    }

    try {
      await addDoc(collection(db, 'dispatches'), {
        requirementId,
        plant,
        millerNum,
        dispatchedQty: parseFloat(dispatchedQty),
        timestamp: new Date().toISOString(),
      });

      const total = cumulativeQty + parseFloat(dispatchedQty);

      const message =
        `*${plant} - Sualkuchi*\n` +
        `STR- ${requirement.structureType}\n` +
        `ID- ${requirement.structureID}\n` +
        `Grade - ${requirement.grade}\n` +
        `Dispatched qty - ${dispatchedQty}m³\n` +
        `Cumm qty - ${total}m³\n` +
        `TM - ${millerNum}`;
      
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`)
        .catch(() => alert('Make sure WhatsApp is installed on your device'));

      // ✅ Always check if requirement is fulfilled (even if exceeded)
      if (total >= requirement.requiredQty) {
        Alert.alert(
          "Target Reached",
          `Required quantity of ${requirement.requiredQty}m³ achieved.`,
          [
            { text: "Continue Dispatching", onPress: () => navigation.goBack(), style: "cancel" },
            { text: "Mark as Complete", onPress: () => handleComplete(true) }
          ]
        );
      } else {
        navigation.goBack();
      }
    } catch (e) {
      console.error('Failed to log dispatch to Firebase', e);
    }
  };

  const handleComplete = async (skipAlert = false) => {
    const completeAction = async () => {
      try {
        const reqDocRef = doc(db, 'requirements', requirementId);
        await updateDoc(reqDocRef, { status: 'Completed' });
        navigation.goBack();
      } catch (e) {
        console.error('Failed to complete requirement in Firebase', e);
      }
    };

    if (skipAlert) {
      completeAction();
    } else {
      Alert.alert('Complete Requirement', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Complete', onPress: completeAction, style: 'destructive' },
      ]);
    }
  };

  if (!requirement) {
    return <View style={styles.container}><Text>Loading requirement...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>Dispatch for:</Text>
        <Text style={styles.detailText}>
          {requirement.structureID} ({requirement.grade})
        </Text>
        <Text style={styles.cumulativeText}>
          Progress: {cumulativeQty.toFixed(1)} / {requirement.requiredQty} m³
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Miller / TM Number</Text>
        <TextInput style={styles.input} value={millerNum} onChangeText={setMillerNum} keyboardType="numeric" />
        <Text style={styles.label}>Dispatched Quantity (m³)</Text>
        <TextInput style={styles.input} value={dispatchedQty} onChangeText={setDispatchedQty} keyboardType="numeric" />
        <Text style={styles.label}>Plant</Text>
        <View style={styles.plantSelector}>
          <TouchableOpacity
            style={[styles.plantButton, plant === 'CP120' && styles.plantButtonSelected]}
            onPress={() => setPlant('CP120')}>
            <Text style={[styles.plantButtonText, plant === 'CP120' && styles.plantButtonTextSelected]}>CP120</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.plantButton, plant === 'CP30' && styles.plantButtonSelected]}
            onPress={() => setPlant('CP30')}>
            <Text style={[styles.plantButtonText, plant === 'CP30' && styles.plantButtonTextSelected]}>CP30</Text>
          </TouchableOpacity>
        </View>
        <Button title="Log Dispatch & Create Message" onPress={handleLogDispatch} />
      </View>

      <View style={styles.completeContainer}>
        <Button title="Complete Requirement" color="#c9372c" onPress={() => handleComplete(false)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  detailsContainer: { padding: 15, backgroundColor: '#eef', borderRadius: 5, marginBottom: 20 },
  title: { fontSize: 16, color: '#555' },
  detailText: { fontSize: 20, fontWeight: 'bold' },
  cumulativeText: { fontSize: 16, color: '#007BFF', marginTop: 8 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 5, elevation: 2 },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: {
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  plantSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  plantButton: { borderWidth: 1, borderColor: '#007BFF', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 30 },
  plantButtonSelected: { backgroundColor: '#007BFF' },
  plantButtonText: { color: '#007BFF', fontSize: 16, fontWeight: 'bold' },
  plantButtonTextSelected: { color: '#fff' },
  completeContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
    paddingBottom: 40,
  },
});

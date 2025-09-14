import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, orderBy, query, updateDoc } from 'firebase/firestore';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';

export default function TmWeightmentScreen() {
  const [entries, setEntries] = useState([]);
  const [tmNumber, setTmNumber] = useState('');
  const [millerNumber, setMillerNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [grossWt, setGrossWt] = useState('');
  const [newTareWt, setNewTareWt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tmRecipes, setTmRecipes] = useState({});
  const [tareWeights, setTareWeights] = useState({});
  const [collapsedEntries, setCollapsedEntries] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEntries(),
        fetchTmRecipes(),
        fetchTareWeights()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Could not fetch initial data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const q = query(collection(db, 'tm_weightment'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedEntries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      Alert.alert('Error', 'Could not fetch weightment entries.');
    }
  };

  const fetchTmRecipes = async () => {
    try {
      const recipesRef = collection(db, 'tm_recipes');
      const querySnapshot = await getDocs(recipesRef);
      const recipes = {};
      querySnapshot.forEach(doc => {
        recipes[doc.id] = doc.data();
      });
      setTmRecipes(recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const fetchTareWeights = async () => {
    try {
      const tareWeightsRef = collection(db, 'tare_weights');
      const querySnapshot = await getDocs(tareWeightsRef);
      const weights = {};
      querySnapshot.forEach(doc => {
        weights[doc.id] = doc.data().tareWeight;
      });
      setTareWeights(weights);
    } catch (error) {
      console.error('Error fetching tare weights:', error);
    }
  };

  const calculateTheoreticalQty = (tmNum) => {
    const recipe = tmRecipes[tmNum];
    if (!recipe) return 0;

    let total = 0;
    for (const component in recipe.components) {
        total += recipe.components[component];
    }
    return total;
  };

  const handleAddEntry = async () => {
    if (!tmNumber || !quantity || !millerNumber || !grossWt) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    
    if (!tmRecipes[tmNumber] || !tareWeights[millerNumber]) {
      Alert.alert('Invalid Data', 'Please enter a valid TM Number or Miller Number with a defined tare weight.');
      return;
    }

    setLoading(true);
    try {
      const netWt = parseFloat(grossWt) - tareWeights[millerNumber];
      const theoraticalQty = calculateTheoreticalQty(tmNumber) * parseFloat(quantity);
      const error = theoraticalQty - netWt;
      const errorPercent = (error / theoraticalQty) * 100;

      const newEntry = {
        tmNumber,
        quantity: parseFloat(quantity),
        millerNumber,
        grossWt: parseFloat(grossWt),
        tareWt: tareWeights[millerNumber],
        netWt,
        theoraticalQty,
        error,
        errorPercent,
        grade: tmRecipes[tmNumber].grade,
        timestamp: new Date().toISOString(),
      };
      
      await addDoc(collection(db, 'tm_weightment'), newEntry);
      
      setTmNumber('');
      setQuantity('');
      setMillerNumber('');
      setGrossWt('');
      
      fetchEntries();
      Alert.alert('Success', 'Entry saved successfully!');
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Error', 'Could not save entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTareWeight = async () => {
    if (!millerNumber || !newTareWt) {
      Alert.alert('Missing Info', 'Please enter a Miller Number and a new tare weight.');
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'tare_weights', millerNumber);
      await updateDoc(docRef, { tareWeight: parseFloat(newTareWt) }, { merge: true });
      fetchTareWeights();
      setMillerNumber('');
      setNewTareWt('');
      Alert.alert('Success', 'Tare weight updated successfully!');
    } catch (error) {
      console.error('Error updating tare weight:', error);
      Alert.alert('Error', 'Could not update tare weight.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await deleteDoc(doc(db, 'tm_weightment', id));
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Could not delete entry.');
    }
  };

  const toggleCollapse = (id) => {
    setCollapsedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderEntry = (entry) => (
    <View key={entry.id} style={styles.entryContainer}>
      <TouchableOpacity onPress={() => toggleCollapse(entry.id)}>
        <View style={styles.entryHeader}>
          <Text style={styles.headerText}>TM No: {entry.tmNumber} | Miller No: {entry.millerNumber}</Text>
          <Ionicons name={collapsedEntries[entry.id] ? 'chevron-down' : 'chevron-up'} size={24} color="#007BFF" />
        </View>
      </TouchableOpacity>
      <Collapsible collapsed={collapsedEntries[entry.id]}>
        <View style={styles.entryDetails}>
          <Text>Grade: {entry.grade}</Text>
          <Text>Quantity: {(entry.quantity || 0).toFixed(2)} cum</Text>
          <Text>Gross Wt: {(entry.grossWt || 0).toFixed(2)} kg</Text>
          <Text>Tare Wt: {(entry.tareWt || 0).toFixed(2)} kg</Text>
          <Text>Net Wt: {(entry.netWt || 0).toFixed(2)} kg</Text>
          <Text>Theoretical Qty: {(entry.theoraticalQty || 0).toFixed(2)} kg</Text>
          <Text>Error: {(entry.error || 0).toFixed(2)} kg</Text>
          <Text>Error %: {(entry.errorPercent || 0).toFixed(2)}%</Text>
          <Text>Time: {new Date(entry.timestamp).toLocaleTimeString()}</Text>
          <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Collapsible>
    </View>
  );

  if (loading && entries.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading entries...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>TM Weightment</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.subtitle}>Update Tare Weight</Text>
        <TextInput
          style={styles.input}
          placeholder="Miller No."
          keyboardType="numeric"
          onChangeText={setMillerNumber}
          value={millerNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="New Tare Wt (kg)"
          keyboardType="numeric"
          onChangeText={setNewTareWt}
          value={newTareWt}
        />
        <Button 
          title={loading ? "Saving..." : "Update Tare Weight"} 
          onPress={handleUpdateTareWeight} 
          disabled={loading}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.subtitle}>Add New Entry</Text>
        <TextInput
          style={styles.input}
          placeholder="Trial Mix No"
          keyboardType="numeric"
          onChangeText={setTmNumber}
          value={tmNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity (cum)"
          keyboardType="numeric"
          onChangeText={setQuantity}
          value={quantity}
        />
        <TextInput
          style={styles.input}
          placeholder="Miller Number"
          keyboardType="numeric"
          onChangeText={setMillerNumber}
          value={millerNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Gross Wt (kg)"
          keyboardType="numeric"
          onChangeText={setGrossWt}
          value={grossWt}
        />
        <Button 
          title={loading ? "Saving..." : "Save Entry"} 
          onPress={handleAddEntry} 
          disabled={loading}
        />
      </View>

      <Text style={styles.subtitle}>Saved Entries</Text>
      {entries.length === 0 ? (
        <Text style={styles.infoText}>No entries saved yet.</Text>
      ) : (
        entries.map(renderEntry)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputSection: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  entryContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e9ecef',
  },
  headerText: {
    fontWeight: 'bold',
  },
  entryDetails: {
    padding: 15,
    backgroundColor: '#fff',
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoText: {
    textAlign: 'center',
    color: '#6c757d',
  }
});
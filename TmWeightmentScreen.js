import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
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
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [tareWeightsCollapsed, setTareWeightsCollapsed] = useState(true);

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
      await setDoc(docRef, { tareWeight: parseFloat(newTareWt) }, { merge: true });
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
  
  const handleDeleteSelected = async () => {
    if (selectedEntries.length === 0) {
      Alert.alert("No entries selected", "Please long-press on entries to select them for deletion.");
      return;
    }

    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${selectedEntries.length} entries?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              selectedEntries.forEach(id => {
                const docRef = doc(db, 'tm_weightment', id);
                batch.delete(docRef);
              });
              await batch.commit();
              setSelectedEntries([]);
              fetchEntries();
              Alert.alert("Success", "Selected entries have been deleted.");
            } catch (error) {
              console.error("Error deleting selected entries:", error);
              Alert.alert("Error", "Could not delete selected entries.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const toggleCollapse = (id) => {
    setCollapsedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelect = (id) => {
    setSelectedEntries(prev => {
      if (prev.includes(id)) {
        return prev.filter(entryId => entryId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const renderEntry = (entry) => {
    const isSelected = selectedEntries.includes(entry.id);
    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.entryContainer, isSelected && styles.selectedEntry]}
        onPress={() => toggleCollapse(entry.id)}
        onLongPress={() => toggleSelect(entry.id)}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.headerText}>TM No: {entry.tmNumber} | Miller No: {entry.millerNumber}</Text>
          <Ionicons name={collapsedEntries[entry.id] ? 'chevron-down' : 'chevron-up'} size={24} color="#007BFF" />
        </View>
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
      </TouchableOpacity>
    );
  };

  if (loading && entries.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading entries...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>TM Weightment</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.subtitle}>Update Tare Weight</Text>
        <TextInput
          style={styles.input}
          placeholder="Miller No."
          placeholderTextColor="#495057"
          keyboardType="numeric"
          onChangeText={setMillerNumber}
          value={millerNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="New Tare Wt (kg)"
          placeholderTextColor="#495057"
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
        <Text style={styles.subtitle}>View Saved Tare Weights</Text>
        <TouchableOpacity style={styles.viewTareWeightsButton} onPress={() => setTareWeightsCollapsed(!tareWeightsCollapsed)}>
          <Text style={styles.viewTareWeightsText}>
            {tareWeightsCollapsed ? 'Show Weights' : 'Hide Weights'}
          </Text>
          <Ionicons name={tareWeightsCollapsed ? 'chevron-down' : 'chevron-up'} size={20} color="#007BFF" />
        </TouchableOpacity>
        <Collapsible collapsed={tareWeightsCollapsed}>
          <View style={styles.tareWeightsList}>
            {Object.keys(tareWeights).length > 0 ? (
              Object.entries(tareWeights).map(([miller, weight]) => (
                <View key={miller} style={styles.tareWeightItem}>
                  <Text style={styles.tareWeightText}>Miller {miller}: {weight} kg</Text>
                </View>
              ))
            ) : (
              <Text style={styles.infoText}>No tare weights saved yet.</Text>
            )}
          </View>
        </Collapsible>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.subtitle}>Add New Entry</Text>
        <TextInput
          style={styles.input}
          placeholder="Trial Mix No"
          placeholderTextColor="#495057"
          keyboardType="numeric"
          onChangeText={setTmNumber}
          value={tmNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity (cum)"
          placeholderTextColor="#495057"
          keyboardType="numeric"
          onChangeText={setQuantity}
          value={quantity}
        />
        <TextInput
          style={styles.input}
          placeholder="Miller Number"
          placeholderTextColor="#495057"
          keyboardType="numeric"
          onChangeText={setMillerNumber}
          value={millerNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Gross Wt (kg)"
          placeholderTextColor="#495057"
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
      {selectedEntries.length > 0 && (
        <View style={styles.deleteSelectedButton}>
          <Button
            title={`Delete ${selectedEntries.length} selected entries`}
            onPress={handleDeleteSelected}
            color="red"
          />
        </View>
      )}
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
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    paddingBottom: 50,
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
    color: '#000',
  },
  entryContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  selectedEntry: {
    backgroundColor: '#d1e7dd',
    borderColor: '#0f5132',
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
  deleteSelectedButton: {
    marginBottom: 10,
  },
  viewTareWeightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  viewTareWeightsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tareWeightsList: {
    marginTop: 10,
  },
  tareWeightItem: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tareWeightText: {
    fontSize: 14,
  },
  infoText: {
    textAlign: 'center',
    color: '#6c757d',
  }
});
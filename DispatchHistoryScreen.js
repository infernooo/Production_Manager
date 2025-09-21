import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Modal, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { db } from './firebase';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function DispatchHistoryScreen() {
  const [dispatches, setDispatches] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editedDispatch, setEditedDispatch] = useState({});
  const [availableRequirements, setAvailableRequirements] = useState([]);
  const [deletedEntries, setDeletedEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);

      const reqsQuery = query(
        collection(db, "requirements"),
        where("status", "==", "Active")
      );
      const reqsSnapshot = await getDocs(reqsQuery);
      const reqsData = reqsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequirements(reqsData);

      const q = query(collection(db, "dispatches"), orderBy("timestamp", "desc"));
      const unsubscribeDispatches = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDispatches(data);
        setIsLoading(false);
      });
      
      const qDeleted = query(collection(db, "deleted_dispatches"), orderBy("timestamp", "desc"));
      const unsubscribeDeleted = onSnapshot(qDeleted, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeletedEntries(data);
      });
      
      return () => {
        unsubscribeDispatches();
        unsubscribeDeleted();
      };
    };

    fetchAllData();
  }, []);

  const handleEditPress = (item) => {
    setSelectedDispatch(item);
    setEditedDispatch({ ...item });
    
    let activeReqs = requirements;
    if (!requirements.find(r => r.id === item.requirementId)) {
      activeReqs = [...requirements, { id: item.requirementId, placeholder: true }];
    }
    setAvailableRequirements(activeReqs);
    
    setIsModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedDispatch) return;

    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this dispatch?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const docRef = doc(db, "dispatches", selectedDispatch.id);
              await deleteDoc(docRef);

              const deletedDocRef = doc(db, "deleted_dispatches", selectedDispatch.id);
              await setDoc(deletedDocRef, { ...selectedDispatch, timestamp: new Date().toISOString() });

              Alert.alert("Success", "Dispatch deleted successfully! You can undo this action.");
              setIsModalVisible(false);
            } catch (error) {
              console.error("Error deleting dispatch:", error);
              Alert.alert("Error", "Could not delete the dispatch. Please try again.");
            }
          },
          style: 'destructive'
        },
      ]
    );
  };

  const handleUndo = async () => {
    if (deletedEntries.length === 0) {
      Alert.alert("No Recent Deletes", "There are no entries to undo.");
      return;
    }

    const lastDeleted = deletedEntries[0];
    try {
      const docRef = doc(db, "dispatches", lastDeleted.id);
      await setDoc(docRef, lastDeleted);

      const deletedDocRef = doc(db, "deleted_dispatches", lastDeleted.id);
      await deleteDoc(deletedDocRef);

      Alert.alert("Success", "Last deletion has been undone.");
    } catch (error) {
      console.error("Error undoing deletion:", error);
      Alert.alert("Error", "Could not undo the deletion. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!selectedDispatch) return;

    const req = requirements.find(r => r.id === selectedDispatch.requirementId);
    if (!req) {
      Alert.alert("Error", "Could not find related requirement data.");
      return;
    }

    const cumulativeQty = dispatches
      .filter(d => d.requirementId === req.id)
      .reduce((sum, d) => sum + (d.dispatchedQty || 0), 0);

    const message =
      `*${selectedDispatch.plant || 'Plant'} - Sualkuchi*\n` +
      `STR- ${req.structureType}\n` +
      `ID- ${req.structureID}\n` +
      `Grade - ${req.grade}\n` +
      `Dispatched qty - ${selectedDispatch.dispatchedQty}m³\n` +
      `Cumm qty - ${cumulativeQty}m³\n` +
      `TM - ${selectedDispatch.millerNum}`;

    try {
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
    } catch (e) {
      console.error("Failed to open WhatsApp:", e);
      Alert.alert("Error", "WhatsApp is not installed on this device or an error occurred.");
    }
  };

  const handleSave = async () => {
    if (!selectedDispatch) return;

    try {
      const docRef = doc(db, "dispatches", selectedDispatch.id);
      await updateDoc(docRef, editedDispatch);
      setIsModalVisible(false);
      Alert.alert("Success", "Dispatch updated successfully!");
    } catch (error) {
      console.error("Error updating dispatch:", error);
      Alert.alert("Error", "Could not update the dispatch. Please try again.");
    }
  };

  const renderItem = ({ item }) => {
    let dispatchTime = 'N/A';
    if (item.timestamp) {
      if (typeof item.timestamp.toDate === 'function') {
        dispatchTime = item.timestamp.toDate().toLocaleString();
      } else {
        dispatchTime = new Date(item.timestamp).toLocaleString();
      }
    }

    return (
      <TouchableOpacity style={styles.listItem} onPress={() => handleEditPress(item)}>
        <View>
          <Text style={styles.listItemText}>TM: {item.millerNum}</Text>
          <Text style={styles.listItemText}>Qty: {item.dispatchedQty} m³</Text>
          <Text style={styles.listItemText}>Time: {dispatchTime}</Text>
        </View>
        <Text style={styles.editIcon}>✏️</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading dispatches...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dispatch History</Text>
        <TouchableOpacity
          onPress={handleUndo}
          disabled={deletedEntries.length === 0}
          style={[
            styles.undoButton,
            deletedEntries.length === 0 && styles.undoButtonDisabled
          ]}
        >
          <Text style={styles.undoButtonText}>Undo ({deletedEntries.length})</Text>
        </TouchableOpacity>
      </View>

      {dispatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No dispatches found.</Text>
        </View>
      ) : (
        <FlatList
          data={dispatches}
          keyExtractor={item => item.id}
          renderItem={renderItem}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteIconContainer}>
              <Ionicons name="trash-outline" size={30} color="#dc3545" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Edit Dispatch</Text>

            <Text style={styles.label}>TM Number:</Text>
            <TextInput
              style={styles.input}
              value={editedDispatch.millerNum}
              onChangeText={text => setEditedDispatch(prev => ({ ...prev, millerNum: text }))}
            />

            <Text style={styles.label}>Dispatched Qty:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(editedDispatch.dispatchedQty)}
              onChangeText={text => setEditedDispatch(prev => ({ ...prev, dispatchedQty: parseFloat(text) || 0 }))}
            />

            <Text style={styles.label}>Re-assign Requirement:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={editedDispatch.requirementId}
                onValueChange={(itemValue) => setEditedDispatch(prev => ({ ...prev, requirementId: itemValue }))}
              >
                {availableRequirements.map(req => (
                  <Picker.Item
                    key={req.id}
                    label={
                      req.placeholder
                        ? `Original Requirement (${req.id})`
                        : `${req.structureType} - ${req.structureID}`
                    }
                    value={req.id}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.iconButton}>
                <Ionicons name="arrow-back-circle-outline" size={40} color="#6c757d" />
                <Text style={styles.iconButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#28a745" />
                <Text style={styles.iconButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResend} style={styles.iconButton}>
                <Ionicons name="logo-whatsapp" size={40} color="#25D366" />
                <Text style={styles.iconButtonText}>Resend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  undoButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  undoButtonDisabled: { backgroundColor: '#e9ecef' },
  undoButtonText: { color: '#343a40', fontWeight: 'bold' },
  listItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 5,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemText: { fontSize: 16, color: '#333' },
  editIcon: { fontSize: 20 },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    paddingTop: 60,
    alignItems: "center",
    elevation: 5,
  },
  deleteIconContainer: { position: 'absolute', top: 15, right: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { alignSelf: 'flex-start', marginTop: 10, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: 250,
    padding: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: 250,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  iconButton: { alignItems: 'center', marginHorizontal: 10 },
  iconButtonText: { fontSize: 12, marginTop: 5, color: '#333' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function CompletedRequirementsScreen() {
  const [completedRequirements, setCompletedRequirements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "requirements"), where("status", "==", "Completed"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requirementsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCompletedRequirements(requirementsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReactivate = async (item) => {
    Alert.alert(
      "Confirm Reactivation",
      `Are you sure you want to reactivate requirement: ${item.structureID}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reactivate",
          onPress: async () => {
            try {
              const reqRef = doc(db, "requirements", item.id);
              await updateDoc(reqRef, { status: "Active" });
              Alert.alert("Success", "Requirement reactivated successfully!");
            } catch (error) {
              console.error("Error reactivating requirement: ", error);
              Alert.alert("Error", "Could not reactivate requirement. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (item) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete requirement: ${item.structureID}? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const reqRef = doc(db, "requirements", item.id);
              await deleteDoc(reqRef);
              Alert.alert("Success", "Requirement deleted successfully!");
            } catch (error) {
              console.error("Error deleting requirement: ", error);
              Alert.alert("Error", "Could not delete requirement. Please try again.");
            }
          },
          style: 'destructive'
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    let completionDate = 'N/A';
    if (item.completedAt) {
        if (typeof item.completedAt.toDate === 'function') {
            completionDate = item.completedAt.toDate().toLocaleDateString();
        } else {
            completionDate = new Date(item.completedAt).toLocaleDateString();
        }
    }

    return (
      <View style={styles.listItem}>
        <View style={styles.listItemTextContainer}>
          <Text style={styles.listItemTextID}>{item.structureID} ({item.grade})</Text>
          <Text style={styles.listItemTextDetail}>Required Qty: {item.requiredQty} m³</Text>
          <Text style={styles.listItemTextDetail}>Completed on: {completionDate}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.reactivateButton]}
            onPress={() => handleReactivate(item)}
          >
            <Text style={styles.buttonText}>Reactivate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading Completed Requirements...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {completedRequirements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Completed Requirements found.</Text>
        </View>
      ) : (
        <FlatList
          data={completedRequirements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
  listItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 5,
    elevation: 2,
  },
  listItemTextContainer: {
    marginBottom: 10,
  },
  listItemTextID: { fontSize: 16, fontWeight: '500' },
  listItemTextDetail: { fontSize: 14, color: '#666' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  reactivateButton: {
    backgroundColor: '#28a745',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

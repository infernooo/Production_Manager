import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// NEW: Import Firebase tools instead of AsyncStorage
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase'; // Your database connection

export default function HomeScreen({ navigation }) {
  const [requirements, setRequirements] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // This is the new real-time listener for ALL your data
  useEffect(() => {
    setIsLoading(true);

    // 1. Listen for changes to 'requirements'
    const reqsQuery = query(collection(db, "requirements"), where("status", "==", "Active"));
    const unsubscribeReqs = onSnapshot(reqsQuery, (querySnapshot) => {
      const requirementsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setRequirements(requirementsData);
      setIsLoading(false);
    });

    // 2. Listen for changes to 'dispatches'
    const dispsCol = collection(db, 'dispatches');
    const unsubscribeDisps = onSnapshot(dispsCol, (snapshot) => {
      const dispatchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDispatches(dispatchesData);
    });

    // This cleans up the listeners when you leave the screen
    return () => {
      unsubscribeReqs();
      unsubscribeDisps();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading Active Requirements...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requirements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Active Requirements.</Text>
          <Text style={styles.emptyText}>Tap the '+' icon to create one.</Text>
        </View>
      ) : (
        <FlatList
          data={requirements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // This logic now works with the live data from Firebase
            const currentCummQty = dispatches
              .filter(d => d.requirementId === item.id)
              .reduce((sum, d) => sum + d.dispatchedQty, 0);

            return (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => navigation.navigate('Dispatch', { requirementId: item.id })}
                onLongPress={() => navigation.navigate('EditRequirement', { requirementId: item.id })}
              >
                <View>
                  <Text style={styles.listItemTextID}>{item.structureID} ({item.grade})</Text>
                  <Text style={styles.listItemTextProgress}>
                    {currentCummQty.toFixed(1)} / {item.requiredQty} m³
                  </Text>
                </View>
                <Text style={styles.listItemTextQty}>➡️</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
  listItem: { backgroundColor: '#fff', padding: 15, marginHorizontal: 10, marginTop: 10, borderRadius: 5, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemTextID: { fontSize: 16, fontWeight: '500' },
  listItemTextProgress: { fontSize: 14, color: '#666', paddingTop: 4 },
  listItemTextQty: { fontSize: 24, color: '#007BFF' },
});
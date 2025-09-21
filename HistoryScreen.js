import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.optionButton}
        onPress={() => navigation.navigate('CompletedRequirements')}
      >
        <Ionicons name="checkmark-circle-outline" size={24} color="#007BFF" />
        <Text style={styles.optionText}>View Completed Requirements</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.optionButton}
        onPress={() => navigation.navigate('DispatchHistory')}
      >
        <Ionicons name="document-text-outline" size={24} color="#007BFF" />
        <Text style={styles.optionText}>View Individual Dispatch Messages</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  optionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  optionText: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
});

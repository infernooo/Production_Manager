import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from './firebase'; // Import your Firebase setup
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function PasswordScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [correctPassword, setCorrectPassword] = useState(null);

  // Fetch the current password from Firestore on component mount
  useEffect(() => {
    const fetchPassword = async () => {
      try {
        // Use the consistent 'admin_password' path
        const passwordDocRef = doc(db, 'settings', 'admin_password');
        const passwordDoc = await getDoc(passwordDocRef);
        
        if (passwordDoc.exists()) {
          setCorrectPassword(passwordDoc.data().password);
        } else {
          // If no password exists, create a default one for first-time use
          console.log('No global password found, setting a default one.');
          const defaultPassword = 'default123';
          await setDoc(passwordDocRef, { password: defaultPassword });
          setCorrectPassword(defaultPassword);
        }
      } catch (error) {
        console.error('Error fetching password:', error);
        Alert.alert('Error', 'Could not connect to the server. Please check your network connection.');
      }
      setLoading(false);
    };

    fetchPassword();
  }, []);

  const handleLogin = () => {
    // Check if the user's entered password matches the one from Firestore
    if (password === correctPassword) {
      // Navigate to the main app if password is correct
      navigation.replace('MainDrawer');
    } else {
      Alert.alert('Incorrect Password', 'Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Global Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    maxWidth: 300,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});

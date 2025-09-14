import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from './firebase'; // Your Firebase setup
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminScreen() {
  const [adminPassword, setAdminPassword] = useState('');
  const [newGlobalPassword, setNewGlobalPassword] = useState('');
  const [hasAdminPassword, setHasAdminPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the admin password document exists on load
    const checkAdminPassword = async () => {
      try {
        const adminDocRef = doc(db, 'settings', 'admin_access');
        const adminDoc = await getDoc(adminDocRef);
        setHasAdminPassword(adminDoc.exists());
      } catch (error) {
        console.error('Error checking admin password existence:', error);
        Alert.alert('Error', 'Could not check admin settings. Please try again.');
      }
      setLoading(false);
    };
    checkAdminPassword();
  }, []);

  const handleSetInitialAdminPassword = async () => {
    if (!adminPassword || !newGlobalPassword) {
      Alert.alert('Error', 'Both admin password and new global password are required.');
      return;
    }
    setLoading(true);
    try {
      const adminDocRef = doc(db, 'settings', 'admin_access');
      await setDoc(adminDocRef, { password: adminPassword });
      
      const globalPasswordDocRef = doc(db, 'settings', 'admin_password');
      await setDoc(globalPasswordDocRef, { password: newGlobalPassword }, { merge: true });

      Alert.alert('Success', 'Admin and global passwords have been set!');
      setHasAdminPassword(true); // Switch to the regular update view
      setAdminPassword('');
      setNewGlobalPassword('');
    } catch (error) {
      console.error('Error setting initial passwords:', error);
      Alert.alert('Error', 'Could not set passwords. Please try again.');
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!adminPassword || !newGlobalPassword) {
      Alert.alert('Error', 'Both admin password and new global password are required.');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Verify the admin's password
      const adminDocRef = doc(db, 'settings', 'admin_access');
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists() || adminDoc.data().password !== adminPassword) {
        Alert.alert('Incorrect Password', 'The admin password you entered is incorrect.');
        setLoading(false);
        return;
      }
      
      // Step 2: If admin is verified, update the global password
      const globalPasswordDocRef = doc(db, 'settings', 'admin_password');
      await setDoc(globalPasswordDocRef, { password: newGlobalPassword }, { merge: true });

      Alert.alert('Success', 'Global password has been updated!');
      setAdminPassword('');
      setNewGlobalPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Could not update password. Please try again.');
    }
    setLoading(false);
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Render the initial setup screen if no admin password exists
  if (!hasAdminPassword) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>First-Time Admin Setup</Text>
        <Text style={styles.infoText}>This is a one-time setup. Please create an admin password to secure the app.</Text>
        <TextInput
          style={styles.input}
          placeholder="Create New Admin Password"
          secureTextEntry={true}
          value={adminPassword}
          onChangeText={setAdminPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Create New Global Password"
          secureTextEntry={true}
          value={newGlobalPassword}
          onChangeText={setNewGlobalPassword}
        />
        <Button 
          title="Set Passwords"
          onPress={handleSetInitialAdminPassword}
        />
      </View>
    );
  }

  // Render the regular password change screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Global Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Admin Password"
        secureTextEntry={true}
        value={adminPassword}
        onChangeText={setAdminPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter New Global Password"
        secureTextEntry={true}
        value={newGlobalPassword}
        onChangeText={setNewGlobalPassword}
      />
      <Button 
        title={loading ? "Saving..." : "Update Password"} 
        onPress={handleChangePassword} 
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#444',
    textAlign: 'center',
  },
  infoText: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
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

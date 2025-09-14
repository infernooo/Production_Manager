import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { db } from './firebase'; 
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function DispatchSummaryScreen() {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [fromTime, setFromTime] = useState(null);
  const [toTime, setToTime] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [showToTimePicker, setShowToTimePicker] = useState(false);
  const [plants, setPlants] = useState([]);

  // Fetch unique plants from Firestore on component load
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const dispatchesRef = collection(db, 'dispatches');
        const querySnapshot = await getDocs(dispatchesRef);
        const plantSet = new Set();
        querySnapshot.forEach(doc => {
          if (doc.data().plant) {
            plantSet.add(doc.data().plant);
          }
        });
        setPlants(Array.from(plantSet).sort());
      } catch (error) {
        console.error("Error fetching plants:", error);
        Alert.alert('Error', 'Could not fetch plant list.');
      }
    };
    fetchPlants();
  }, []);

  const handleFromDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || fromDate;
    setShowFromDatePicker(false);
    setFromDate(currentDate);
  };

  const handleToDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || toDate;
    setShowToDatePicker(false);
    setToDate(currentDate);
  };
  
  const handleFromTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || fromTime;
    setShowFromTimePicker(false);
    setFromTime(currentTime);
  };

  const handleToTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || toTime;
    setShowToTimePicker(false);
    setToTime(currentTime);
  };

  const fetchAndExportData = async () => {
    if (!fromDate || !toDate || !fromTime || !toTime || !selectedPlant) {
      Alert.alert('Missing Information', 'Please fill in all the filters.');
      return;
    }

    setLoading(true);
    try {
      const fromDateTime = new Date(fromDate);
      fromDateTime.setHours(fromTime.getHours(), fromTime.getMinutes(), 0, 0);

      const toDateTime = new Date(toDate);
      toDateTime.setHours(toTime.getHours(), toTime.getMinutes(), 59, 999);
      
      const dispatchesRef = collection(db, 'dispatches');
      const q = query(
        dispatchesRef,
        where('plant', '==', selectedPlant),
        where('timestamp', '>=', fromDateTime.toISOString()),
        where('timestamp', '<=', toDateTime.toISOString()),
        orderBy('timestamp')
      );
      
      const querySnapshot = await getDocs(q);
      const dispatches = [];

      for (const docSnapshot of querySnapshot.docs) {
        const dispatchData = docSnapshot.data();
        let requirementData = {};
        
        // Fetch related requirement data
        if (dispatchData.requirementId) {
          const requirementDocRef = doc(db, 'requirements', dispatchData.requirementId);
          const requirementDoc = await getDoc(requirementDocRef);
          if (requirementDoc.exists()) {
            requirementData = requirementDoc.data();
          }
        }
        dispatches.push({ id: docSnapshot.id, ...dispatchData, ...requirementData });
      }

      // Calculate cumulative quantity
      let cumulativeQty = 0;
      const dataWithCumQty = dispatches.map((d, index) => {
        cumulativeQty += d.dispatchedQty || 0;
        return {
          ...d,
          cumulativeQty: cumulativeQty,
          slNo: index + 1
        };
      });

      generateCSV(dataWithCumQty);

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert('Export Failed', 'An error occurred while fetching data. Check your filters and network connection.');
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = async (data) => {
    const header = [
      'SL No', 
      'Date', 
      'Miller No', 
      'structureID', 
      'structureType',
      'Grade',
      'dispatchedQty', 
      'CummQty', 
      'Dispatch Time', 
      'Trial Mix Number'
    ];
    
    // Create CSV rows
    const csvRows = data.map(row => {
      const date = new Date(row.timestamp);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();

      return [
        row.slNo,
        formattedDate,
        row.millerNum || '',
        row.structureID || '',
        row.structureType || '',
        row.grade || '',
        row.dispatchedQty || 0,
        row.cumulativeQty || 0,
        formattedTime,
        row.trialMixNum || ''
      ];
    });

    const csvString = [
      header.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const fromDateString = fromDate ? fromDate.toLocaleDateString().replace(/\//g, '-') : 'all';
    const toDateString = toDate ? toDate.toLocaleDateString().replace(/\//g, '-') : 'all';
    const fileName = `DispatchReport_${selectedPlant}_${fromDateString}_to_${toDateString}.csv`;
    const path = FileSystem.cacheDirectory + fileName;

    try {
      if (await Sharing.isAvailableAsync()) {
        await FileSystem.writeAsStringAsync(path, csvString, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(path);
      } else {
        Alert.alert('Not Supported', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error("Error writing/sharing CSV:", error);
      Alert.alert('Export Failed', 'An error occurred while exporting the data.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dispatch Summary</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date Filter</Text>
        <View style={styles.dateInputs}>
          <TouchableOpacity onPress={() => setShowFromDatePicker(true)} style={styles.dateInput}>
            <Text>{fromDate ? fromDate.toLocaleDateString() : 'From Date'}</Text>
          </TouchableOpacity>
          {showFromDatePicker && (
            <DateTimePicker
              testID="fromDatePicker"
              value={fromDate || new Date()}
              mode="date"
              display="default"
              onChange={handleFromDateChange}
            />
          )}

          <TouchableOpacity onPress={() => setShowToDatePicker(true)} style={styles.dateInput}>
            <Text>{toDate ? toDate.toLocaleDateString() : 'To Date'}</Text>
          </TouchableOpacity>
          {showToDatePicker && (
            <DateTimePicker
              testID="toDatePicker"
              value={toDate || new Date()}
              mode="date"
              display="default"
              onChange={handleToDateChange}
            />
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Time Filter</Text>
        <View style={styles.dateInputs}>
          <TouchableOpacity onPress={() => setShowFromTimePicker(true)} style={styles.dateInput}>
            <Text>{fromTime ? fromTime.toLocaleTimeString() : 'From Time'}</Text>
          </TouchableOpacity>
          {showFromTimePicker && (
            <DateTimePicker
              testID="fromTimePicker"
              value={fromTime || new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleFromTimeChange}
            />
          )}

          <TouchableOpacity onPress={() => setShowToTimePicker(true)} style={styles.dateInput}>
            <Text>{toTime ? toTime.toLocaleTimeString() : 'To Time'}</Text>
          </TouchableOpacity>
          {showToTimePicker && (
            <DateTimePicker
              testID="toTimePicker"
              value={toTime || new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleToTimeChange}
            />
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Plant Name</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPlant}
            onValueChange={(itemValue) => setSelectedPlant(itemValue)}
          >
            <Picker.Item label="-- Select a Plant --" value="" />
            {plants.map((plant, index) => (
              <Picker.Item key={index} label={plant} value={plant} />
            ))}
          </Picker>
        </View>
      </View>
      
      <Button 
        title={loading ? "Generating..." : "Export to Excel"} 
        onPress={fetchAndExportData} 
        disabled={loading}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007BFF" />
          <Text style={styles.loadingText}>Fetching data...</Text>
        </View>
      )}

      <Text style={styles.infoText}>
        Select a date range and a plant name to generate a report.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  dateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#007BFF',
  },
  infoText: {
    marginTop: 20,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  }
});

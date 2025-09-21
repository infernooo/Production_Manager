import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
// NEW: Import Firebase tools
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function MillerReportScreen() {
  const [dispatches, setDispatches] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [pickerTarget, setPickerTarget] = useState('start');
  const [reportText, setReportText] = useState('');

  // THIS IS THE ONLY PART THAT CHANGES
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // Get all documents from the 'dispatches' collection in Firestore
          const querySnapshot = await getDocs(collection(db, "dispatches"));
          const dispatchesData = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          }));
          setDispatches(dispatchesData);
        } catch (e) {
            console.error("Failed to fetch dispatches from Firebase", e);
        }
      };
      loadData();
    }, [])
  );

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      if (pickerTarget === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const showDatePicker = (target) => {
    setPickerTarget(target);
    setPickerMode('date');
    setShowPicker(true);
  };

  const showTimePicker = (target) => {
    setPickerTarget(target);
    setPickerMode('time');
    setShowPicker(true);
  };

  const handleGenerateReport = () => {
    const relevantDispatches = dispatches.filter(d => {
      const dispatchTime = new Date(d.timestamp);
      return dispatchTime >= startDate && dispatchTime <= endDate;
    });

    const groupedByMiller = relevantDispatches.reduce((acc, dispatch) => {
      const miller = dispatch.millerNum;
      if (!acc[miller]) {
        acc[miller] = { tripCount: 0, lastTripTime: null };
      }
      acc[miller].tripCount += 1;
      const dispatchTime = new Date(dispatch.timestamp);
      if (!acc[miller].lastTripTime || dispatchTime > acc[miller].lastTripTime) {
        acc[miller].lastTripTime = dispatchTime;
      }
      return acc;
    }, {});

    let finalReport = `*Miller Trip Summary*\n`;
    finalReport += `*From:* ${startDate.toLocaleString('en-GB')}\n`;
    finalReport += `*To:* ${endDate.toLocaleString('en-GB')}\n\n`;

    if (Object.keys(groupedByMiller).length === 0) {
      finalReport += "No trips found in this period.";
    } else {
      for (const miller in groupedByMiller) {
        const data = groupedByMiller[miller];
        finalReport += `*TM - ${miller}*\n`;
        finalReport += `  - Total Loads: ${data.tripCount}\n`;
        finalReport += `  - Last Load at: ${data.lastTripTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n\n`;
      }
    }
    setReportText(finalReport);
  };

  const handleCopyReport = async () => {
    await Clipboard.setStringAsync(reportText);
    alert('Report copied to clipboard!');
  };

  return (
    <SafeAreaView style={styles.container}>
      {showPicker && (
        <DateTimePicker
          value={pickerTarget === 'start' ? startDate : endDate}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={onDateChange}
        />
      )}

      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Select Date & Time Range</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Start:</Text>
          <TouchableOpacity onPress={() => showDatePicker('start')}><Text style={styles.dateValue}>{startDate.toLocaleDateString('en-GB')}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => showTimePicker('start')}><Text style={styles.dateValue}>{startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>End:  </Text>
          <TouchableOpacity onPress={() => showDatePicker('end')}><Text style={styles.dateValue}>{endDate.toLocaleDateString('en-GB')}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => showTimePicker('end')}><Text style={styles.dateValue}>{endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.generateButton}>
        <Button title="Generate Miller Report" onPress={handleGenerateReport} />
      </View>
      
      <ScrollView style={styles.reportContainer}>
        <Text style={styles.reportContent} selectable={true}>{reportText}</Text>
      </ScrollView>

      {reportText ? (
        <View style={styles.copyButton}>
          <Button title="Copy Report to Clipboard" onPress={handleCopyReport} />
        </View>
      ) : null}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterContainer: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  filterTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 8 },
  dateLabel: { fontSize: 16, fontWeight: '500' },
  dateValue: { fontSize: 16, color: '#007BFF' },
  generateButton: { marginHorizontal: 20, marginTop: 20 },
  reportContainer: { flex: 1, padding: 15, backgroundColor: '#f5f5f5', marginTop: 10 },
  reportContent: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, color: '#000' },
  copyButton: { margin: 20 },
});
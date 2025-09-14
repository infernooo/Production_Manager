import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
// NEW: Import Firebase tools
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function DprScreen() {
  const [requirements, setRequirements] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [totals, setTotals] = useState({ ftm: 0, fty: 0, cum: 0 });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reportText, setReportText] = useState('');

  // THIS IS THE UPDATED DATA LOADING LOGIC
  useFocusEffect(
    useCallback(() => {
      const loadAllData = async () => {
        try {
          // 1. Fetch all requirements from Firestore
          const reqsSnapshot = await getDocs(collection(db, "requirements"));
          const reqsData = reqsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setRequirements(reqsData);

          // 2. Fetch all dispatches from Firestore
          const dispsSnapshot = await getDocs(collection(db, "dispatches"));
          const dispsData = dispsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setDispatches(dispsData);

          // 3. Fetch the production totals document from Firestore
          const totalsDocRef = doc(db, "totals", "productionTotals");
          const totalsDocSnap = await getDoc(totalsDocRef);
          if (totalsDocSnap.exists()) {
            const parsedTotals = totalsDocSnap.data();
            setTotals({
              ftm: parseFloat(parsedTotals.ftm) || 0,
              fty: parseFloat(parsedTotals.fty) || 0,
              cum: parseFloat(parsedTotals.cum) || 0,
            });
          } else {
            console.log("Totals document does not exist! Please create it in Firebase.");
            setTotals({ ftm: 0, fty: 0, cum: 0 });
          }
        } catch (e) {
          console.error("Failed to load report data from Firebase", e);
        }
      };
      loadAllData();
    }, [])
  );

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleGenerateReport = async () => {
    // This logic is mostly the same...
    const startTime = new Date(date);
    startTime.setHours(8, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setDate(startTime.getDate() + 1);

    const relevantDispatches = dispatches.filter(d => {
      const dispatchTime = new Date(d.timestamp);
      return dispatchTime >= startTime && dispatchTime < endTime;
    });
    
    const groupedByPlant = relevantDispatches.reduce((acc, dispatch) => {
      const plant = dispatch.plant;
      const req = requirements.find(r => r.id === dispatch.requirementId);
      if (!req) return acc;
      const key = `${req.grade} | ${req.structureID}`;
      if (!acc[plant]) acc[plant] = {};
      if (!acc[plant][key]) {
        acc[plant][key] = {
          grade: req.grade,
          structureID: req.structureID,
          trialMixNum: req.trialMixNum,
          totalQty: 0,
        };
      }
      acc[plant][key].totalQty += dispatch.dispatchedQty;
      return acc;
    }, {});
    
    let finalReport = `*Date : ${startTime.toLocaleDateString('en-GB')}*\n\n`;
    let grandTotal = 0;

    for (const plant in groupedByPlant) {
      const plantData = groupedByPlant[plant];
      const plantTotal = Object.values(plantData).reduce((sum, req) => sum + req.totalQty, 0);
      grandTotal += plantTotal;
      finalReport += `*Concrete Production at ${plant}(Sualkuchi) - ${plantTotal.toFixed(1)}m³*\n\n`;
      Object.values(plantData).forEach((req, index) => {
        const tmString = req.trialMixNum ? ` (TM ${req.trialMixNum})` : '';
        finalReport += `${index + 1}. ${req.grade}${tmString} - ${req.structureID} - ${req.totalQty.toFixed(1)}m³\n`;
      });
      finalReport += '\n';
    }

    const ftd = grandTotal;
    const newTotals = { 
        ftm: (totals.ftm + ftd), 
        fty: (totals.fty + ftd), 
        cum: (totals.cum + ftd) 
    };

    finalReport += `FTD     /   FTM    /   FTY / CUM\n`;
    finalReport += `${ftd.toFixed(1)}m³ / ${newTotals.ftm.toFixed(1)}m³ / ${newTotals.fty.toFixed(1)}m³ / ${newTotals.cum.toFixed(1)}m³\n`;
    setReportText(finalReport);

    // ...BUT THE SAVING LOGIC IS UPDATED FOR FIREBASE
    try {
        const totalsDocRef = doc(db, "totals", "productionTotals");
        await setDoc(totalsDocRef, newTotals);
        console.log("Totals updated successfully in Firebase!");
    } catch (e) {
        console.error("Failed to update totals in Firebase", e);
    }
  };

  const handleCopyReport = async () => {
    await Clipboard.setStringAsync(reportText);
    alert('Report copied to clipboard!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.dateText}>Report for shift starting:</Text>
        <Button onPress={() => setShowDatePicker(true)} title={date.toLocaleDateString('en-GB')} />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode={'date'}
          display="default"
          onChange={onChangeDate}
        />
      )}

      <View style={styles.generateButton}>
        <Button title="Generate DPR" onPress={handleGenerateReport} />
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
  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  dateText: { fontSize: 16 },
  generateButton: { margin: 20 },
  reportContainer: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  reportContent: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, color: '#000' },
  copyButton: { margin: 20 },
});
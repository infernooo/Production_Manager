import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function DprScreen() {
  const [requirements, setRequirements] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [totals, setTotals] = useState({ ftm: 0, fty: 0, cum: 0 });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Initial data loading
  useFocusEffect(
    useCallback(() => {
      const loadAllData = async () => {
        setIsInitialLoading(true);
        try {
          const reqsSnapshot = await getDocs(collection(db, "requirements"));
          const reqsData = reqsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setRequirements(reqsData);

          const dispsSnapshot = await getDocs(collection(db, "dispatches"));
          const dispsData = dispsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setDispatches(dispsData);

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
            console.log("Totals document does not exist!");
            setTotals({ ftm: 0, fty: 0, cum: 0 });
          }
        } catch (e) {
          console.error("Failed to load report data from Firebase", e);
          Alert.alert("Error", "Failed to load data. Please check your connection.");
        } finally {
          setIsInitialLoading(false);
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
    setIsGeneratingReport(true);

    const startTime = new Date(date);
    startTime.setHours(8, 0, 0, 0); 
    const endTime = new Date(startTime);
    endTime.setDate(startTime.getDate() + 1);

    const relevantDispatches = dispatches.filter(d => {
        const dispatchTime = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
        return dispatchTime >= startTime && dispatchTime < endTime;
    });
    
    // Group dispatches by plant and requirement
    const groupedByPlant = relevantDispatches.reduce((acc, dispatch) => {
      const plant = dispatch.plant || 'Unknown';
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

    // Corrected Logic: Loop through the correct plants
    const allPlants = ['CP120', 'CP30'];
    allPlants.forEach(plant => {
        const plantData = groupedByPlant[plant] || {};
        const plantTotal = Object.values(plantData).reduce((sum, req) => sum + req.totalQty, 0);
        grandTotal += plantTotal;
        finalReport += `*Concrete Production at ${plant}(Sualkuchi) - ${plantTotal.toFixed(1)}m³*\n\n`;

        if (Object.keys(plantData).length > 0) {
            Object.values(plantData).forEach((req, index) => {
                const tmString = req.trialMixNum ? ` (TM ${req.trialMixNum})` : '';
                finalReport += `${index + 1}. ${req.grade}${tmString} - ${req.structureID} - ${req.totalQty.toFixed(1)}m³\n`;
            });
        }
        finalReport += '\n';
    });

    const ftd = grandTotal;

    finalReport += `FTD     /   FTM    /   FTY / CUM\n`;
    finalReport += `${ftd.toFixed(1)}m³ / ${totals.ftm.toFixed(1)}m³ / ${totals.fty.toFixed(1)}m³ / ${totals.cum.toFixed(1)}m³\n`;
    setReportText(finalReport);
    setIsGeneratingReport(false);
  };

  const handleCopyReport = async () => {
    await Clipboard.setStringAsync(reportText);
    Alert.alert('Success', 'Report copied to clipboard!');
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
        <Button
          title={isInitialLoading ? "Loading Data..." : (isGeneratingReport ? "Generating..." : "Generate DPR")}
          onPress={handleGenerateReport}
          disabled={isInitialLoading || isGeneratingReport || requirements.length === 0}
        />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  dateText: { fontSize: 16 },
  generateButton: { margin: 20 },
  reportContainer: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  reportContent: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, color: '#000' },
  copyButton: { margin: 20 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function MoistureCorrectionScreen() {
  const [tmRecipes, setTmRecipes] = useState({});
  const [selectedTMs, setSelectedTMs] = useState([]);
  const [moistureContent, setMoistureContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipesRef = collection(db, 'tm_recipes');
        const querySnapshot = await getDocs(recipesRef);
        const recipes = {};
        querySnapshot.forEach(doc => {
          recipes[doc.id] = doc.data();
        });
        setTmRecipes(recipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        Alert.alert('Error', 'Could not fetch trial mix recipes.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  const handleSelectTM = (tmNumber) => {
    if (selectedTMs.includes(tmNumber)) {
      setSelectedTMs(selectedTMs.filter(tm => tm !== tmNumber));
    } else {
      setSelectedTMs([...selectedTMs, tmNumber]);
    }
  };

  const calculateMoistureCorrection = (recipe) => {
    const { components, SSD_moisture } = recipe;

    const waterCorrectionSand = (parseFloat(moistureContent.Sand || 0) - SSD_moisture.Sand) * components.Sand / 100;
    const waterCorrection10mm = (parseFloat(moistureContent['10mm'] || 0) - SSD_moisture['10mm']) * components['10mm'] / 100;
    const waterCorrection20mm = (parseFloat(moistureContent['20mm'] || 0) - SSD_moisture['20mm']) * components['20mm'] / 100;

    const totalWaterCorrection = waterCorrectionSand + waterCorrection10mm + waterCorrection20mm;

    const correctedRecipe = {
      ...components,
      Water: (components.Water - totalWaterCorrection) || 0,
      Sand: (components.Sand + waterCorrectionSand) || 0,
      '10mm': (components['10mm'] + waterCorrection10mm) || 0,
      '20mm': (components['20mm'] + waterCorrection20mm) || 0,
    };

    return correctedRecipe;
  };

  const renderCorrectedRecipes = () => {
    const componentOrder = [
      'Cement(Ultratech)',
      'GGBS(Tata)',
      'GGBS(JSW)',
      'GGBS(JSPL)',
      'Flyash',
      'UGGBS',
      '20mm',
      '10mm',
      'Sand',
      'Water',
      'ADMIXTURE(Asian)',
      'ADMIXTURE(Fosroc)',
      'ADMIXTURE',
      'CI(Sika)',
      'CI',
      'CRYSTALLINE(Penetron)',
      'CRYSTALLINE(Shalimar)',
      'CRYSTALLINE',
    ];

    return selectedTMs.map(tmNumber => {
      const recipe = tmRecipes[tmNumber];
      if (!recipe) return null;

      const corrected = calculateMoistureCorrection(recipe);

      return (
        <View key={tmNumber} style={styles.recipeContainer}>
          <Text style={styles.recipeTitle}>TM: {tmNumber} (Grade: {recipe.grade})</Text>
          <View style={styles.recipeTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Component</Text>
              <Text style={styles.tableHeader}>Original Wt (SSD)</Text>
              <Text style={styles.tableHeader}>Corrected Wt</Text>
            </View>
            {componentOrder.map(component => {
              const originalWeight = recipe.components[component];
              if (originalWeight && originalWeight > 0) {
                const correctedWeight = corrected[component] || 0;
                
                let name = component;
                let brand = '';

                const brandMatch = component.match(/\(([^)]+)\)/);
                if (brandMatch) {
                  name = component.split('(')[0];
                  brand = `(${brandMatch[1]})`;
                }

                return (
                  <View key={component} style={styles.tableRow}>
                    <View style={[styles.tableCell, { flexDirection: 'column' }]}>
                      <Text>{name}</Text>
                      {brand ? <Text style={styles.brandText}>{brand}</Text> : null}
                    </View>
                    <Text style={styles.tableCell}>{originalWeight.toFixed(2)}</Text>
                    <Text style={styles.tableCell}>{correctedWeight.toFixed(2)}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Fetching recipes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Moisture Correction & Consumption</Text>

      <View style={styles.inputSection}>
        <Text style={styles.subtitle}>Enter Aggregate Moisture Content (%)</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Sand:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(text) => setMoistureContent({ ...moistureContent, Sand: text })}
            value={moistureContent.Sand}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>10mm:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(text) => setMoistureContent({ ...moistureContent, '10mm': text })}
            value={moistureContent['10mm']}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>20mm:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(text) => setMoistureContent({ ...moistureContent, '20mm': text })}
            value={moistureContent['20mm']}
          />
        </View>
      </View>

      <View style={styles.recipeSelection}>
        <Text style={styles.subtitle}>Select Trial Mix Numbers</Text>
        <View style={styles.tmList}>
          {Object.keys(tmRecipes).map(tmNumber => (
            <TouchableOpacity
              key={tmNumber}
              onPress={() => handleSelectTM(tmNumber)}
              style={[styles.tmChip, selectedTMs.includes(tmNumber) && styles.selectedChip]}
            >
              <Text style={styles.tmChipText}>{tmNumber}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {selectedTMs.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.subtitle}>Moisture Corrected Recipes</Text>
          {renderCorrectedRecipes()}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
  },
  input: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  recipeSelection: {
    marginBottom: 20,
  },
  tmList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tmChip: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 5,
  },
  selectedChip: {
    backgroundColor: '#007BFF',
  },
  tmChipText: {
    color: '#000',
    fontWeight: 'bold',
  },
  resultsSection: {
    marginBottom: 20,
  },
  recipeContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recipeTable: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHeader: {
    flex: 1,
    fontWeight: 'bold',
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    padding: 8,
  },
  brandText: {
    fontSize: 12,
    color: '#6c757d',
  },
});

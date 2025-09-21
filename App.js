import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TouchableOpacity, View } from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';

// Import all of your screens
import HomeScreen from './HomeScreen';
import AddRequirementScreen from './AddRequirementScreen';
import DispatchScreen from './DispatchScreen';
import EditRequirementScreen from './EditRequirementScreen';
import DprScreen from './DprScreen';
import MillerReportScreen from './MillerReportScreen';
import TotalsScreen from './TotalsScreen';
import PasswordScreen from './PasswordScreen'; 
import AdminScreen from './AdminScreen';
import DispatchSummaryScreen from './DispatchSummaryScreen';
import MoistureCorrectionScreen from './MoistureCorrectionScreen';
import TmWeightmentScreen from './TmWeightmentScreen';
import HistoryScreen from './HistoryScreen';
import DispatchHistoryScreen from './DispatchHistoryScreen';
// NOTE: You still need to create CompletedRequirementsScreen
import CompletedRequirementsScreen from './CompletedRequirementsScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={({ navigation }) => ({ 
          title: 'Active Requirements',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 15 }}>
              <Ionicons name="menu" size={28} color="#007BFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 15 }}>
              {/* NEW: History Icon */}
              <TouchableOpacity onPress={() => navigation.navigate('History')} style={{ marginRight: 15 }}>
                <Ionicons name="time-outline" size={28} color="#007BFF" />
              </TouchableOpacity>
              {/* Add Requirement Icon */}
              <TouchableOpacity onPress={() => navigation.navigate('AddRequirement')}>
                <Ionicons name="add-circle-outline" size={28} color="#007BFF" />
              </TouchableOpacity>
            </View>
          ),
        })} 
      />
      <Stack.Screen 
        name="Dispatch" 
        component={DispatchScreen} 
        options={{ title: 'Log Dispatch' }} 
      />
      <Stack.Screen 
        name="AddRequirement" 
        component={AddRequirementScreen} 
        options={{ title: 'New Requirement' }} 
      />
      <Stack.Screen 
        name="EditRequirement" 
        component={EditRequirementScreen} 
        options={{ title: 'Edit Requirement' }} 
      />
      {/* NEW: Add the new history-related screens to the stack navigator */}
      <Stack.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: 'History' }} 
      />
      <Stack.Screen 
        name="DispatchHistory" 
        component={DispatchHistoryScreen} 
        options={{ title: 'Dispatch History' }} 
      />
      <Stack.Screen
        name="CompletedRequirements"
        component={CompletedRequirementsScreen}
        options={{ title: 'Completed Requirements' }}
      />
    </Stack.Navigator>
  );
}

function MainDrawerNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Main" component={MainStackNavigator} options={{ title: 'Dashboard', headerShown: false }} />
      <Drawer.Screen name="Dpr" component={DprScreen} options={{ title: 'Generate DPR' }} />
      <Drawer.Screen name="MillerReport" component={MillerReportScreen} options={{ title: 'Miller Trip Summary' }} />
      <Drawer.Screen name="EditTotals" component={TotalsScreen} options={{ title: 'Edit Totals' }} />
      <Drawer.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin Settings' }} />
      <Drawer.Screen name="DispatchSummary" component={DispatchSummaryScreen} options={{ title: 'Dispatch Summary' }} />
      <Drawer.Screen name="MoistureCorrection" component={MoistureCorrectionScreen} options={{ title: 'Moisture Correction' }} />
      <Drawer.Screen name="TmWeightment" component={TmWeightmentScreen} options={{ title: 'TM Weightment' }} />
    </Drawer.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Password" 
        component={PasswordScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="MainDrawer" 
        component={MainDrawerNavigator} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}

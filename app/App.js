// App.js
import 'react-native-gesture-handler';               // ← Doit être impérativement la première ligne
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, Text, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
enableScreens(); // améliore les performances de la navigation

// Import des écrans
import MapScreen from './screens/Mapscreen';
import ProfileScreen from './screens/ProfileScreen';
import Loginscreen from './screens/Loginscreen';
import AssistantScreen from './screens/Assisstantscreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Navigation principale (Drawer)
function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Connexion">
      <Drawer.Screen name="Carte" component={MapScreen} />
      <Drawer.Screen name="Profil" component={ProfileScreen} />
      <Drawer.Screen name="Connexion" component={Loginscreen} />
      <Drawer.Screen name="Assistant" component={AssistantScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

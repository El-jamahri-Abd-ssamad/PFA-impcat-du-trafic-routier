// App.js
import 'react-native-gesture-handler';               // ← Doit être impérativement la première ligne
import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enableScreens } from 'react-native-screens';
enableScreens(); // améliore les performances de la navigation

// Import des écrans existants
import MapScreen from './screens/Mapscreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/Loginscreen';
import AssistantScreen from './screens/Assisstantscreen';

// Import des nouveaux écrans
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen1 from './screens/OnboardingScreen1';
import OnboardingScreen2 from './screens/OnboardingScreen2';
import OnboardingScreen3 from './screens/OnboardingScreen3';
import OnboardingScreen4 from './screens/OnboardingScreen4';
import OnboardingScreen5 from './screens/OnboardingScreen5';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Navigation principale (Drawer)
function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Carte">
      <Drawer.Screen name="Carte" component={MapScreen} />
      <Drawer.Screen name="Profil" component={ProfileScreen} />
      <Drawer.Screen name="Connexion" component={LoginScreen} />
      <Drawer.Screen name="Assistant" component={AssistantScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  
  useEffect(() => {
    // Vérifier si c'est la première ouverture de l'application
    AsyncStorage.getItem('alreadyLaunched').then(value => {
      if (value === null) {
        // Première ouverture
        AsyncStorage.setItem('alreadyLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        // Ce n'est pas la première ouverture
        setIsFirstLaunch(false);
      }
    });
  }, []);

  // Attendre que la vérification soit effectuée
  if (isFirstLaunch === null) {
    return null; // Ou un écran de chargement
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Le Splash est toujours le premier écran affiché */}
          <Stack.Screen name="Splash" component={SplashScreen} />
          
          {isFirstLaunch ? (
            // Si c'est la première utilisation, après le Splash, on affiche les écrans d'onboarding
            <>
              <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
              <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
              <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
              <Stack.Screen name="Onboarding4" component={OnboardingScreen4} />
              <Stack.Screen name="Onboarding5" component={OnboardingScreen5} />
              <Stack.Screen 
                name="MainApp" 
                component={DrawerNavigator} 
                options={{ headerShown: false }}
              />
            </>
          ) : (
            // Si ce n'est pas la première utilisation, après le Splash, on va directement à l'application principale
            <Stack.Screen 
              name="MainApp" 
              component={DrawerNavigator} 
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
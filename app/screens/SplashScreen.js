import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Animation du zoom pour le logo
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: true,
    }).start();

    // Vérifier si c'est la première ouverture et naviguer en conséquence
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        
        // Navigation automatique après 6 secondes
        const timer = setTimeout(() => {
          if (value === null) {
            // Première ouverture - aller à l'onboarding
            navigation.replace('Onboarding1');
          } else {
            // Pas la première ouverture - aller directement à l'application principale
            navigation.replace('MainApp');
          }
        }, 6000);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Erreur lors de la vérification de première ouverture:', error);
        // En cas d'erreur, aller à l'application principale par défaut
        setTimeout(() => {
          navigation.replace('MainApp');
        }, 6000);
      }
    };

    checkFirstLaunch();
  }, [navigation, scaleAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text
          style={[
            styles.title,
            { opacity: scaleAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          Tarrikii
          <Animated.Text
            style={[
              styles.title2,
              { opacity: scaleAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            Safe
          </Animated.Text>
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 190,
    height: 190,
  },
  title: {
    marginTop: 10,
    color: '#8166A3',
    fontSize: 30,
    fontWeight: 'bold',
  },
  title2: {
    marginTop: 10,
    color: '#B0E9FE',
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
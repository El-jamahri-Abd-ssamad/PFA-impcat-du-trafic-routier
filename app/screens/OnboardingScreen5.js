import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OnboardingScreen5 = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        <Text style={styles.title}>
          Mobile{'\n'}App{'\n'}
          <Text style={styles.titleBrand}>Tarriki</Text>
        </Text>
        
        <Text style={styles.arabicText}>طريقي</Text>

        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('MainApp')}
        >
          <Text style={styles.getStartedText}>Get Started!</Text>
        </TouchableOpacity>
      </View>
      
      {/* Decorative curved bars */}
      <View style={styles.decorativeBarsContainer}>
        <View style={styles.decorativeBar1} />
        <View style={styles.decorativeBar2} />
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
          <View style={[styles.paginationDot, styles.activeDot]} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusIcons: {
    flexDirection: 'row',
    width: 50,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 65,
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: -60,
    fontFamily: 'bree serif',
    color: '#333',
    marginBottom: 10,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  titleBrand: {
    color: '#8166A3',
    fontStyle: 'italic',
  },
  arabicText: {
    fontSize: 55,
    marginLeft: 100,
    color: '#8166A3',
    fontWeight: '500',
    boxShadow: '0px ',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  getStartedButton: {
    width: '90%',
    height: 70,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 100,
    marginBottom: -140,
    backgroundColor: '#8166A3', // Couleur moyenne du dégradé
    // Effet d'ombre pour donner un aspect légèrement 3D
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Pour Android
  },
  getStartedText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
  },
  decorativeBarsContainer: {
    position: 'absolute',
    top: 350,
    left: -300,
    right: 0,
    height: 500, 
    width: 900,
  },
  decorativeBar1: {
    position: 'absolute',
    width: 1000,
    height: 75,
    left: -510,
    top: 360,
    backgroundColor: '#8166A3',
    borderRadius: 71,
    transform: [{ rotate: '-32deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  decorativeBar2: {
    position: 'absolute',
    width: 1000,
    height: 75,
    left: -540,
    top: 490,
    backgroundColor: '#99A8D0',
    borderRadius: 71,
    transform: [{ rotate: '-32deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#653B96',
    width: 20,
  },
});

export default OnboardingScreen5;
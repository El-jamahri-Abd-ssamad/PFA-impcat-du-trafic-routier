import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const OnboardingScreen1 = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Decorative curved bars */}
      <View style={styles.decorativeBarsContainer}>
        <View style={styles.decorativeBar1} />
        <View style={styles.decorativeBar2} />
      </View>
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Hello You Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Hello</Text>
          <Text style={styles.titleText2}>You</Text>
          <View style={styles.purpleUnderline} />
        </View>
        
        {/* Icons Row */}
        <View style={styles.iconsContainer}>
          <Image 
            source={require('../assets/images/tracking.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
          <Image 
            source={require('../assets/images/path.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
          <Image 
            source={require('../assets/images/location.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        
        {/* Description Text */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            "Drive smart, avoid traffic! 💨{'\n'}
            Your intelligent road companion{'\n'}
            starts here."
          </Text>
        </View>
      </View>
      
      {/* Next Button (Circle) */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate('Onboarding2')}
        >
          <Text style={styles.nextButtonText}>→</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 5,
    fontSize: 14,
  },
  decorativeBarsContainer: {
    position: 'absolute',
    top: 0,
    left: -300,
    right: 0,
    height: 500, 
    width: 900,
    overflow: 'hidden',
  },
  decorativeBar1: {
    position: 'absolute',
    width: 1000,
    height: 82,
    left: -450,
    top: -120,
    backgroundColor: '#AAD9F3',
    borderRadius: 71,
    transform: [{ rotate: '42deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  decorativeBar2: {
    position: 'absolute',
    width: 1000,
    height: 82,
    left: -450,
    top: 40,
    backgroundColor: '#C3F2FF',
    borderRadius: 71,
    transform: [{ rotate: '42deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  titleText: {
    marginLeft: -20,
    fontSize: 70,
    marginTop: 40,
    fontWeight: 'bold',
    fontFamily: 'Bree Serif',
    textAlign: 'center',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  titleText2: {
    marginLeft: 100,
    marginTop: -25,
    fontSize: 85,
    fontWeight: 'bold',
    fontFamily: 'Sergeo UI',
    textAlign: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  purpleUnderline: {
    width: 145,
    height: 7,
    backgroundColor: '#8166A3',
    borderRadius: 5,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  icon: {
    width: 90,
    height: 90,
    tintColor: '#653B96',
  },
  descriptionContainer: {
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 17,
    marginTop: 30,
    textAlign: 'center',
    marginBottom: -100,
    color: '#535353',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -40,
  },
  nextButton: {
    backgroundColor: '#9C75FF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen1;
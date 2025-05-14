import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OnboardingScreen3 = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.skipContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Onboarding5')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Image
          source={require('../assets/images/onboarding3.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          Get real-time traffic{'\n'}information and avoid{'\n'}congested roads
        </Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
          <View style={[styles.paginationDot, styles.activeDot]} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Onboarding4')}
          style={styles.nextButton}
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
        width: 50,
        justifyContent: 'space-between',
      },
      skipContainer: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginTop: 10,
      },
      skipButton: {
        padding: 5,
      },
      skipText: {
        color: '#653B96',
        fontWeight: '500',
        fontSize: 22,
      },
      content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      },
      image: {
        width: 400,
        height: 300,
        marginBottom: 0,
      },
      title: {
        fontSize: 25,
        marginTop: -20,
        fontFamily: 'bree serif',
        marginLeft: -60,
        fontWeight: '600',
        textAlign: 'left',
        color: '#263238',
      },
      footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
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
      nextButton: {
        backgroundColor: '#653B96',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
      nextButtonText: {
        color: '#fff',
        fontSize: 23,
      },
});

export default OnboardingScreen3;
// screens/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://i.pravatar.cc/150?img=12' }} // avatar random
        style={styles.avatar}
      />
      <Text style={styles.name}>Jean L'utilisateur</Text>
      <Text style={styles.info}>Niveau : Explorateur</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  info: { fontSize: 18, color: 'gray' },
});

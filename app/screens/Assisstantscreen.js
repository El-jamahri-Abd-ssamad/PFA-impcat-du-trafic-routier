import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Speech from 'expo-speech';

export default function AssistantScreen() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleAssistant = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('http://10.10.1.252:5000/api/assistant', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        setResponse(data.response);
        // Faire parler l'assistant uniquement sur le téléphone
        Speech.speak(data.response, {
          language: 'fr-FR', // 🇫🇷 Langue française
          rate: 1.0,         // 🐢 Vitesse normale
          pitch: 1.0         // ⚖️ Ton neutre
        });
      } else {
        Alert.alert("Erreur", data.message);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de contacter l'assistant");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assistant Vocal</Text>
      <Button title="Parler" onPress={handleAssistant} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {response && <Text style={styles.response}>{response}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 100,
    padding: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 30,
  },
  response: {
    marginTop: 30,
    fontSize: 16,
    color: 'blue',
  },
});

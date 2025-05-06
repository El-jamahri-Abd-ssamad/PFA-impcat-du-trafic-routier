import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Keyboard,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, Polyline, Polygon } from 'react-native-maps';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recent, setRecent] = useState([
    'Tour Eiffel',
    'Bd Richard-Lenoir',
    'Rue du Faubourg'
  ]);
  const [suggestions, setSuggestions] = useState([]);

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['20%', '60%'], []);

  const TOMTOM_API_KEY = process.env.API_KEY;
  const co2Zone = [
    { latitude: 48.8584, longitude: 2.2945 },
    { latitude: 48.8584, longitude: 2.3045 },
    { latitude: 48.8484, longitude: 2.3045 },
    { latitude: 48.8484, longitude: 2.2945 },
  ];

  // Get current position
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation refusée !');
        return;
      }
      let pos = await Location.getCurrentPositionAsync({});
      setLocation(pos.coords);
    })();
  }, []);

  // Fetch suggestions on typing
  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }
    const fetchSug = async () => {
      try {
        const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(searchQuery)}.json?key=${TOMTOM_API_KEY}&limit=5`;
        const res = await fetch(url);
        const json = await res.json();
        setSuggestions(json.results || []);
      } catch (e) {
        console.error('Fetch suggestions error:', e);
      }
    };
    fetchSug();
  }, [searchQuery]);

  const searchLocation = async () => {
    if (!searchQuery) return;
    try {
      const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(searchQuery)}.json?key=${TOMTOM_API_KEY}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const loc = data.results[0].position;
        setDestination({ latitude: loc.lat, longitude: loc.lon });
        fetchRoute(loc.lat, loc.lon);
        addRecent(data.results[0].address.freeformAddress);
      } else {
        Alert.alert('Aucun résultat', 'Lieu introuvable !');
      }
    } catch (error) {
      console.error('Recherche error:', error);
      Alert.alert('Erreur', 'Impossible de rechercher le lieu.');
    }
  };

  const fetchRoute = async (lat, lon) => {
    if (!location) return;
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${location.latitude},${location.longitude}:${lat},${lon}/json?key=${TOMTOM_API_KEY}&routeType=fastest&traffic=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.length) {
        const pts = data.routes[0].legs[0].points.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
        setRoute(pts);
      }
    } catch (e) {
      console.error('Route fetch error:', e);
    }
  };

  const addRecent = address => {
    setRecent(prev => [address, ...prev.filter(r => r !== address)]);
  };

  const onSelect = item => {
    setSearchQuery(item.address.freeformAddress);
    addRecent(item.address.freeformAddress);
    fetchRoute(item.position.lat, item.position.lon);
    setDestination({ latitude: item.position.lat, longitude: item.position.lon });
    Keyboard.dismiss();
    bottomSheetRef.current.snapToIndex(0);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.suggItem} onPress={() => onSelect(item)}>
      <FontAwesome name="history" size={20} color="#333" />
      <Text style={styles.suggText}>{item.address.freeformAddress}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Marker coordinate={location} title="Ma position" pinColor="blue" />
          {destination && <Marker coordinate={destination} title="Destination" />}
          {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="red" />}
          <Polygon coordinates={co2Zone} fillColor="rgba(255,0,0,0.4)" strokeColor="orange" strokeWidth={2} />
        </MapView>
      ) : (
        <ActivityIndicator style={styles.loader} size="large" color="blue" />
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBg}
      >
        <View style={styles.sheetContent}>
          <View style={styles.searchRow}>
            <FontAwesome name="search" size={20} color="#555" />
            <TextInput
              style={styles.input}
              placeholder="Rechercher un lieu"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchLocation}
            />
          </View>

          <View style={styles.quickBtns}>
            {['Home', 'Work', 'New'].map(label => (
              <TouchableOpacity key={label} style={styles.btnQuick}>
                <FontAwesome
                  name={label === 'Home' ? 'home' : label === 'Work' ? 'briefcase' : 'plus'}
                  size={24}
                  color="#7f5af0"
                />
                <Text style={styles.btnText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Recent</Text>
          <FlatList
            data={searchQuery ? suggestions : recent.map(r => ({ address: { freeformAddress: r }, position: { lat: 0, lon: 0 } }))}
            keyExtractor={(item, i) => item.address.freeformAddress + i}
            renderItem={renderItem}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  sheetBg: { backgroundColor: '#fff' },
  sheetContent: { flex: 1, padding: 16 },
  searchRow: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  input: { flex: 1, height: 40, marginLeft: 8 },
  quickBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  btnQuick: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    width: 80,
  },
  btnText: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  suggItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  suggText: { marginLeft: 8, fontSize: 14, color: '#333' },
});

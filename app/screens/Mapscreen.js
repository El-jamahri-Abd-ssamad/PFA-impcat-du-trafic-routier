import React, { useState, useEffect } from "react";
import { StyleSheet, View, TextInput, ActivityIndicator, Alert, Text } from "react-native";
import MapView, { Marker, Polyline, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import { FontAwesome } from "@expo/vector-icons";

export default function App() {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState([]);

  const co2Zone = [
    { latitude: 48.8584, longitude: 2.2945 },
    { latitude: 48.8584, longitude: 2.3045 },
    { latitude: 48.8484, longitude: 2.3045 },
    { latitude: 48.8484, longitude: 2.2945 },
  ];

  const TOMTOM_API_KEY = process.env.API_KEY; 

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erreur", "Permission de localisation refusée !");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();

    // Récupère les coordonnées du backend Flask
    /*fetch("http://10.10.1.252:5000/coordinates") 
      .then(res => res.json())
      .then(data => setCoords(data))
      .catch(err => console.error("Erreur coord Flask :", err));
  */}, []);

  const searchLocation = async () => {
    if (!searchQuery) return;

    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(searchQuery)}.json?key=${TOMTOM_API_KEY}&limit=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const foundLocation = data.results[0].position;
        setDestination({ latitude: foundLocation.lat, longitude: foundLocation.lon });
        fetchRoute(foundLocation.lat, foundLocation.lon);
      } else {
        Alert.alert("Aucun résultat", "Lieu introuvable !");
      }
    } catch (error) {
      console.error("Erreur de recherche :", error);
      Alert.alert("Erreur", "Impossible de rechercher le lieu.");//toast
    }
  };

  const fetchRoute = async (destLat, destLon) => {
    if (!location) {
      Alert.alert("Erreur", "Impossible d'obtenir votre position.");
      return;
    }

    const url = `https://api.tomtom.com/routing/1/calculateRoute/${location.latitude},${location.longitude}:${destLat},${destLon}/json?key=${TOMTOM_API_KEY}&routeType=fastest&traffic=false`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const points = data.routes[0].legs[0].points.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
        }));
        setRoute(points);
      } else {
        Alert.alert("Erreur", "Impossible de calculer l'itinéraire.");
      }
    } catch (error) {
      console.error("Erreur route :", error);
      Alert.alert("Erreur", "Impossible de calculer l'itinéraire.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un lieu"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={searchLocation}
      />

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
          {coords.map((coord, index) => (
            <Marker
              key={`flask-point-${index}`}
              coordinate={{ latitude: coord.latitude, longitude: coord.longitude }}
              title={`Point ${index + 1}`}
              pinColor="green"
            />
          ))}
        </MapView>
      ) : (
        <ActivityIndicator size="large" color="blue" />
      )}

      <View style={styles.dashboard}>
        <View style={styles.dashboardItem}>
          <FontAwesome name="location-arrow" size={30} color="#fff" />
          <Text style={styles.dashboardText}>Position actuelle</Text>
          <Text style={styles.dashboardText}>
            {location ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : "Chargement..."}
          </Text>
        </View>
        <View style={styles.dashboardItem}>
          <FontAwesome name="map-marker" size={30} color="#fff" />
          <Text style={styles.dashboardText}>Destination</Text>
          <Text style={styles.dashboardText}>
            {destination ? `${destination.latitude.toFixed(2)}, ${destination.longitude.toFixed(2)}` : "Aucune"}
          </Text>
        </View>
        <View style={styles.dashboardItem}>
          <FontAwesome name="road" size={30} color="#fff" />
          <Text style={styles.dashboardText}>Itinéraire</Text>
          <Text style={styles.dashboardText}>
            {route ? `${route.length} points` : "Non calculé"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInput: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    height: 50,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    elevation: 5,
    zIndex: 10,
  },
  dashboard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 3,
    borderTopColor: "#f45e42",
    borderBottomWidth: 3,
    borderBottomColor: "#f45e42",
    borderRadius: 15,
    paddingHorizontal: 10,
  },
  dashboardItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardText: {
    fontSize: 16,
    color: "white",
    marginTop: 5,
  },
});

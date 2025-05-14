import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { StyleSheet, View, TextInput, ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import { FontAwesome } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState([]);
  const [barrierCoords, setBarrierCoords] = useState({ latitude: 35.7595, longitude: -5.8940 });
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []); // Points de "snap" pour le BottomSheet
  const recentSearches = ["la tour eiffel", "bd richard-Lecir", "Rue du Grand Prieuré", "Palace de la Fontaine Timbaud"]; // Exemple de recherches récentes

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
  }, []);

  const handleSheetChange = useCallback((index) => {
    console.log("BottomSheet index:", index);
  }, []);

  const handleSearch = () => {
    searchLocation();
    bottomSheetRef.current?.snapToIndex(0); // Replie le BottomSheet après la recherche (facultatif)
  };

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
      Alert.alert("Erreur", "Impossible de rechercher le lieu.");
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            {coords.map((coord, index) => (
              <Marker
                key={`flask-point-${index}`}
                coordinate={{ latitude: coord.latitude, longitude: coord.longitude }}
                title={`Point ${index + 1}`}
                pinColor="green"
              />
            ))}
            <Marker
              coordinate={barrierCoords}
              title="Barrière Montante"
            />
          </MapView>
        ) : (
          <ActivityIndicator size="large" color="blue" />
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={1} // Position ouverte par défaut (ajuste selon tes besoins)
          snapPoints={snapPoints}
          onChange={handleSheetChange}
          style={styles.bottomSheet}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetHandle}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Où allez-vous ?"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
            </View>

            <View style={styles.shortcuts}>
              <TouchableOpacity style={styles.shortcutButton}>
                <FontAwesome name="home" size={24} color="#666" />
                <Text style={styles.shortcutText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutButton}>
                <FontAwesome name="briefcase" size={24} color="#666" />
                <Text style={styles.shortcutText}>Work</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutButton}>
                <FontAwesome name="plus-circle" size={24} color="#666" />
                <Text style={styles.shortcutText}>New</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentSearchesContainer}>
              <Text style={styles.recentSearchesTitle}>Recent</Text>
              <BottomSheetScrollView>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.recentItem}>
                    <FontAwesome name="history" size={20} color="#888" style={styles.recentIcon} />
                    <Text style={styles.recentText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </BottomSheetScrollView>
            </View>
          </View>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSheet: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetBackground: {
    backgroundColor: "#9ea6f0", // Violet soutenu pour le fond du BottomSheet
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandle: {
    backgroundColor: "#ccc",
    borderRadius: 5,
    height: 5,
    width: 40,
  },
  bottomSheetContainer: {
    padding: 20, // Augmenter un peu le padding général
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0", // Blanc cassé pour le fond du champ de recherche
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20, // Augmenter la marge en bas
  },
  searchIcon: {
    marginRight: 15,
    color: "#777", // Gris pour l'icône de recherche
  },
  searchInput: {
    flex: 1,
    height: 45, // Augmenter un peu la hauteur
    fontSize: 16,
    color: "#333", // Texte de la recherche en violet foncé
  },
  shortcuts: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25, // Augmenter la marge en bas
  },
  shortcutButton: {
    backgroundColor: "#7b68ee", // Violet pour les boutons de raccourcis
    borderRadius: 15, // Bords arrondis
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    flex: 1, // Permet de répartir l'espace
    marginHorizontal: 5, // Ajouter un peu d'espace entre les boutons
  },
  shortcutText: {
    marginTop: 5,
    color: "white", // Texte blanc pour les boutons
    fontWeight: "bold",
  },
  recentSearchesContainer: {
    flex: 1,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333", // Violet foncé pour le titre
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d3d3d3", // Gris clair pour le séparateur
  },
  recentIcon: {
    marginRight: 15,
    color: "#8e44ad", // Violet pour l'icône d'historique
  },
  recentText: {
    fontSize: 16,
    color: "#333", // Violet foncé pour le texte de la recherche récente
  },
});
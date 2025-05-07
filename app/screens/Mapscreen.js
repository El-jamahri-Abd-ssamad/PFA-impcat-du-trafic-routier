import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { StyleSheet, View, TextInput, ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import { FontAwesome } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null); // État pour la route Fès-Meknès (données de l'API Flask)
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState([]);
  const [barrierCoords, setBarrierCoords] = useState({ latitude: 35.7595, longitude: -5.8940 });
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const recentSearches = ["la tour eiffel", "bd richard-Lecir", "Rue du Grand Prieuré", "Palace de la Fontaine Timbaud"];

  const fesCoords = { latitude: 34.0372, longitude: -5.0063 }; // Coordonnées de Fès
  const meknesCoords = { latitude: 33.8949, longitude: -5.5577 }; // Coordonnées de Meknès

  const co2Zone = [
    { latitude: 48.8584, longitude: 2.2945 },
    { latitude: 48.8584, longitude: 2.3045 },
    { latitude: 48.8484, longitude: 2.3045 },
    { latitude: 48.8484, longitude: 2.2945 },
  ];

  // const TOMTOM_API_KEY = process.env.API_KEY; // Vous n'utilisez plus directement TomTom pour la route Fès-Meknès

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erreur", "Permission de localisation refusée !");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      // Récupérer les routes depuis votre API Flask
      fetch('http://10.10.1.252:5000/api/routes') // Remplacez par l'URL de votre serveur Flask
        .then(response => response.json())
        .then(data => {
          // Formatter les données pour le composant Polyline
          const formattedRoute = data.map(coord => ({ latitude: coord[0], longitude: coord[1] }));
          setRoute(formattedRoute);

          // Ajuster la vue de la carte pour afficher la route (optionnel)
          if (mapRef.current && formattedRoute.length > 0) {
            mapRef.current.fitToCoordinates(formattedRoute, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        })
        .catch(error => {
          console.error("Erreur lors de la récupération des routes :", error);
          Alert.alert("Erreur", "Impossible de récupérer les routes depuis le serveur.");
        });
    })();
  }, []);

  const handleSheetChange = useCallback((index) => {
    console.log("BottomSheet index:", index);
  }, []);

  const handleSearch = () => {
    searchLocation();
    bottomSheetRef.current?.snapToIndex(0);
  };

  const searchLocation = async () => {
    if (!searchQuery) return;

    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(searchQuery)}.json?key=${process.env.API_KEY}&limit=1`; // Assurez-vous que votre clé API TomTom est toujours configurée

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const foundLocation = data.results[0].position;
        setDestination({ latitude: foundLocation.lat, longitude: foundLocation.lon });
        // Vous pouvez choisir de tracer une route vers la destination recherchée ici si vous le souhaitez
        // fetchRoute(location, { latitude: foundLocation.lat, longitude: foundLocation.lon }, setSomeOtherRouteState);
      } else {
        Alert.alert("Aucun résultat", "Lieu introuvable !");
      }
    } catch (error) {
      console.error("Erreur de recherche :", error);
      Alert.alert("Erreur", "Impossible de rechercher le lieu.");
    }
  };

  // La fonction fetchRoute n'est plus utilisée pour la route Fès-Meknès
  // const fetchRoute = async (startCoords, endCoords, setRouteState) => {
  //   // ... votre ancienne logique fetchRoute ...
  // };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {location ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: (fesCoords.latitude + meknesCoords.latitude) / 2,
              longitude: (fesCoords.longitude + meknesCoords.longitude) / 2,
              latitudeDelta: Math.abs(fesCoords.latitude - meknesCoords.latitude) * 1.5,
              longitudeDelta: Math.abs(fesCoords.longitude - meknesCoords.longitude) * 1.5,
            }}
          >
            <Marker coordinate={location} title="Ma position" pinColor="blue" />
            {destination && <Marker coordinate={destination} title="Destination" />}
            {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="purple" />}
            <Polygon coordinates={co2Zone} fillColor="rgba(255,0,0,0.4)" strokeColor="orange" strokeWidth={2} />
            {coords.map((coord, index) => (
              <Marker
                key={`flask-point-${index}`}
                coordinate={{ latitude: coord[0], longitude: coord[1] }} // Ajustement ici
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
          index={1}
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
    backgroundColor: "#9ea6f0",
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
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 15,
    color: "#777",
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: "#333",
  },
  shortcuts: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
  },
  shortcutButton: {
    backgroundColor: "#7b68ee",
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  shortcutText: {
    marginTop: 5,
    color: "white",
    fontWeight: "bold",
  },
  recentSearchesContainer: {
    flex: 1,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d3d3d3",
  },
  recentIcon: {
    marginRight: 15,
    color: "#8e44ad",
  },
  recentText: {
    fontSize: 16,
    color: "#333",
  },
});
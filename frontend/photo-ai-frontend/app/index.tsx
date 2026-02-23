import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface HistoryItem {
  id: string;
  imageUri: string;
  description: string;
  timestamp: number;
}

export default function IndexScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("imageHistory");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const saveToHistory = async (imageUri: string, desc: string) => {
    try {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        imageUri,
        description: desc,
        timestamp: Date.now(),
      };
      const updatedHistory = [newItem, ...history].slice(0, 20); // Keep last 20
      setHistory(updatedHistory);
      await AsyncStorage.setItem("imageHistory", JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("imageHistory");
              setHistory([]);
            } catch (error) {
              console.error("Error clearing history:", error);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Permission to access photos is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      quality: 0.5,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDescription("");
      setShowHistory(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDescription("");
      setShowHistory(false);
    }
  };

  const uploadImage = async () => {
    if (!image) return;
    setLoading(true);

    const data = new FormData();
    data.append("image", {
      uri: image,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/describe`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          Alert.alert("Error", errorJson.error || "Failed to analyze image");
        } catch {
          Alert.alert("Error", "Failed to analyze image. Please try again.");
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const resJson = await response.json();
      const desc = resJson.description || "No description generated.";
      setDescription(desc);
      
      if (image) {
        await saveToHistory(image, desc);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setDescription("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setImage(item.imageUri);
    setDescription(item.description);
    setShowHistory(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📸 AI Image Describer</Text>
        <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.buttonIcon}>📜</Text>
            <Text style={styles.buttonTextSecondary}>History</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        {showHistory && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Analyses</Text>
              {history.length > 0 && (
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearButton}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {history.length === 0 ? (
              <Text style={styles.emptyHistory}>No history yet</Text>
            ) : (
              history.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() => loadFromHistory(item)}
                >
                  <Image source={{ uri: item.imageUri }} style={styles.historyImage} />
                  <View style={styles.historyTextContainer}>
                    <Text style={styles.historyDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Image Display */}
        {image && !showHistory && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            
            {!loading && !description && (
              <TouchableOpacity style={styles.analyzeButton} onPress={uploadImage}>
                <Text style={styles.analyzeButtonText}>✨ Analyze Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}

        {/* Description */}
        {description && !showHistory && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        )}

        {!image && !showHistory && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎨</Text>
            <Text style={styles.emptyStateText}>
              Select an image to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e0e7ff",
    textAlign: "center",
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "#6366f1",
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 350,
    borderRadius: 20,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 15,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "500",
  },
  descriptionCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },
  historySection: {
    marginTop: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  clearButton: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  historyItem: {
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 12,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  historyTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  historyDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  historyTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 5,
  },
  emptyHistory: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#94a3b8",
  },
});

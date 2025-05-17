import React, { useState, useRef, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Use Ionicons for the back arrow

// Tutorial Steps
const tutorialSteps = [
  { id: 1, text: "Start by saying 'Hi' or 'Hello' to the bot." },
  { id: 2, text: "Answer the questions given by the bot." },
  { id: 3, text: "If you have any questions, feel free to ask the bot." },
  { id: 4, text: "You can reset the chat at any time." },
  { id: 5, text: "Share your chat if needed using the provided options." },
];

// Generate random session ID
const generateSessionId = () => {
  return "user_" + Math.random().toString(36).substr(2, 9);
};

const ChatScreen = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [sessionId] = useState(generateSessionId());
  const hasShownTutorial = useRef(false); // Track if the modal was already shown
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      if (!hasShownTutorial.current) {
        setShowTutorial(true);
        hasShownTutorial.current = true;
      }
      return () => {};
    }, []),
  );

  const closeTutorial = () => setShowTutorial(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: " EYES Bot", // Title at the top of the screen
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          {/* Use Ionicons back arrow */}
          <Ionicons name="arrow-back" size={30} color="#007bff" />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: "#fff", // Set the header background color
        elevation: 0, // Remove shadow from header
      },
      headerTitleStyle: {
        color: "#006A71", // Text color for the title
        fontWeight: "bold",
        fontSize: 20,
      },
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* WebView for the chatbot */}
        <WebView
          source={{
            uri: `https://cdn.botpress.cloud/webchat/v2.4/shareable.html?configUrl=https://files.bpcontent.cloud/2025/01/06/08/20250106081719-HOVC2RN2.json&sessionId=${sessionId}`,
          }}
          style={styles.webview}
        />
      </View>

      {/* Tutorial Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showTutorial}
        onRequestClose={closeTutorial}
      >
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialContent}>
            <Text style={styles.tutorialTitle}>Welcome to EYES Bot!</Text>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {tutorialSteps.map((step) => (
                <Text key={step.id} style={styles.tutorialStep}>
                  {step.id}. {step.text}
                </Text>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeTutorial}
            >
              <Text style={styles.closeButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  tutorialOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tutorialContent: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#006A71",
    marginBottom: 20,
    textAlign: "center",
  },
  scrollView: {
    maxHeight: 280,
    width: "100%",
    marginBottom: 20,
  },
  tutorialStep: {
    fontSize: 16,
    color: "#444",
    textAlign: "left",
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: "#48A6A7",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatScreen;

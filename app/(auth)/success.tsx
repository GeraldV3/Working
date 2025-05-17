import { useRouter, Href } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Text, StyleSheet, Animated, Easing, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@components/CustomButton";

const SuccessScreen: React.FC = () => {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      router.replace("/(tabs)/home" as Href);
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, fadeAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.emoji} accessibilityLabel="Celebration emoji">
          🎉
        </Text>
        <Text
          style={styles.congratulationsText}
          accessibilityRole="header"
          accessibilityLabel="Congratulations"
        >
          Congratulations!
        </Text>
        <Text style={styles.subText}>
          You are now signed in. Redirecting you to the home screen.
        </Text>

        <CustomButton
          title="Continue to Home"
          onPress={() => router.replace("/(tabs)/home" as Href)}
          style={styles.button}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2EFE7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  congratulationsText: {
    fontSize: 28,
    fontWeight: Platform.OS === "ios" ? "600" : "bold",
    color: "#006A71",
    marginBottom: 12,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#006A71",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 2,
  },
});

export default SuccessScreen;

import { useRouter, Href } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  View,
  Text,
  Easing,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import CustomButton from "@components/CustomButton";
import { images } from "@/constants";

const COLORS = {
  background: "#F2EFE7",
  title: "#006A71",
  subtitle: "#9ACBD0",
  buttonPrimary: "#48A6A7",
  modalOverlay: "rgba(0,0,0,0.5)",
  modalBackground: "#FFFFFF",
};

async function checkPermissions(): Promise<boolean> {
  const { status: notifStatus } = await Notifications.getPermissionsAsync();
  if (notifStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow notifications to receive alerts.",
      );
      return false;
    }
  }

  return true;
}

const Start: React.FC = () => {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [floatAnim]);

  const handleNavigation = async (href: Href) => {
    const allowed = await checkPermissions();
    if (allowed) router.replace(href);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: COLORS.background }]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: COLORS.title }]}>
          Welcome to Project EYES!
        </Text>
        <Text style={[styles.headerSubtitle, { color: COLORS.subtitle }]}>
          Click a button below to get started.
        </Text>
      </View>

      <Animated.View
        style={[
          styles.animatedContainer,
          { transform: [{ translateY: floatAnim }] },
        ]}
      >
        <Image
          source={images.startBg}
          style={styles.animatedImage}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.buttonRow}>
        <CustomButton
          title="Sign In"
          onPress={() => handleNavigation("/(auth)/sign-in" as Href)}
          style={[
            styles.buttonFixedWidth,
            { backgroundColor: COLORS.buttonPrimary },
          ]}
        />
        <CustomButton
          title="Sign Up"
          onPress={() => setIsModalVisible(true)}
          style={[
            styles.buttonFixedWidth,
            { backgroundColor: COLORS.subtitle },
          ]}
        />
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalOverlay]}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: COLORS.modalBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: COLORS.title }]}>
              Select Your Role
            </Text>

            <CustomButton
              title="Teacher"
              onPress={() => {
                setIsModalVisible(false);
                handleNavigation("/(auth)/sign-up-teacher" as Href);
              }}
              style={[
                styles.modalButton,
                { backgroundColor: COLORS.buttonPrimary },
              ]}
            />

            <CustomButton
              title="Parent"
              onPress={() => {
                setIsModalVisible(false);
                handleNavigation("/(auth)/sign-up" as Href);
              }}
              style={[
                styles.modalButton,
                { backgroundColor: COLORS.buttonPrimary },
              ]}
            />

            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text
                style={{
                  textAlign: "center",
                  textDecorationLine: "underline",
                  marginTop: 0,
                  color: COLORS.title,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  animatedContainer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  animatedImage: {
    width: windowWidth * 1.5,
    height: windowWidth * 1.1,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 24,
    gap: 16,
  },
  buttonFixedWidth: {
    width: 140,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 12,
  },
  modalCancelText: {
    textAlign: "center",
    textDecorationLine: "underline",
    marginTop: 16,
  },
});

export default Start;

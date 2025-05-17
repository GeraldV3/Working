import * as FaceDetector from "expo-face-detector";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeModal } from "react-native-modal";
import CustomButton from "@components/CustomButton";
import { images } from "@/constants";

const FaceDetection = () => {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [facesDetected, setFacesDetected] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showErrorModal = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleCapture = async () => {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        showErrorModal("Permission Required", "Camera access is required.");
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 500); // Short delay for tip
      });

      setImageUri(null);
      setFacesDetected(false);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        if (!uri) throw new Error("No image URI found.");

        setImageUri(uri);
        await detectFace(uri);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      showErrorModal(
        "Capture Error",
        "An error occurred while capturing the image.",
      );
    }
  };

  const detectFace = async (uri: string) => {
    try {
      const options = {
        mode: FaceDetector.FaceDetectorMode.accurate,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
      };

      const result = await FaceDetector.detectFacesAsync(uri, options);

      if (result.faces && result.faces.length > 0) {
        if (result.faces.length > 1) {
          showErrorModal(
            "Multiple Faces Detected",
            "Please ensure only one face is in the frame.",
          );
          return;
        }

        const face = result.faces[0];
        const { bounds } = face;
        const faceArea = bounds.size.width * bounds.size.height;
        const imageArea = result.image.width * result.image.height;

        if (faceArea < 0.2 * imageArea) {
          showErrorModal("Face Too Small", "Move closer to the camera.");
          return;
        }

        if (
          bounds.origin.x < 0 ||
          bounds.origin.y < 0 ||
          bounds.origin.x + bounds.size.width > result.image.width ||
          bounds.origin.y + bounds.size.height > result.image.height
        ) {
          showErrorModal(
            "Face Misaligned",
            "Center your face properly within the frame.",
          );
          return;
        }

        const requiredLandmarks = [
          "LEFT_EYE",
          "RIGHT_EYE",
          "NOSE_BASE",
          "LEFT_MOUTH",
          "RIGHT_MOUTH",
        ];
        const missingLandmarks: string[] = [];

        requiredLandmarks.forEach((key) => {
          const landmark = face[key as keyof typeof face];
          if (!landmark) {
            missingLandmarks.push(key);
          }
        });

        if (missingLandmarks.length > 0) {
          showErrorModal(
            "Face Validation Failed",
            `Missing landmarks: ${missingLandmarks.join(", ")}.`,
          );
          return;
        }

        setFacesDetected(true);
      } else {
        showErrorModal(
          "No Face Detected",
          "Please ensure your face is clearly visible.",
        );
      }
    } catch (error) {
      console.error("Face detection error:", error);
      showErrorModal(
        "Detection Error",
        "Face detection failed. Please try again.",
      );
    }
  };

  const handleDone = async () => {
    if (!imageUri || !facesDetected) {
      showErrorModal(
        "Missing Face Scan",
        "Capture and validate your face first.",
      );
      return;
    }

    setLoading(true);

    try {
      const filename = "face.jpg";

      // Read the original image file as base64 without resizing
      const base64String = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Pass the original image URI and base64 string
      router.push({
        pathname: "/sign-up",
        params: {
          imageUri,
          filename,
          faceImageBase64: base64String,
        },
      });
    } catch (error) {
      console.error("Error processing image:", error);
      showErrorModal(
        "Save Error",
        "Failed to process image. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F2EFE7",
        paddingHorizontal: 24,
      }}
    >
      {loading ? (
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#006A71",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Processing Image...
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#9ACBD0",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            This may take up to a minute. Please do not close the app.
          </Text>
          <ActivityIndicator size="large" color="#006A71" />
        </View>
      ) : (
        <>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: "#006A71",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Set up Face ID
          </Text>
          <Text style={{ color: "#9ACBD0", textAlign: "center" }}>
            Scan your face to verify identity
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontStyle: "italic",
              color: "gray",
              textAlign: "center",
            }}
          >
            Tip: Ensure good lighting and proper face alignment.
          </Text>

          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: 280,
                  height: 280,
                  marginTop: 25,
                  borderRadius: 8,
                  borderWidth: 3,
                  borderColor: facesDetected ? "#48A6A7" : "#F44336",
                }}
              />
              <Text
                style={{
                  marginTop: 10,
                  fontWeight: "bold",
                  color: facesDetected ? "#48A6A7" : "#F44336",
                }}
              >
                {facesDetected ? "Face Detected" : "Face Not Valid"}
              </Text>
              <CustomButton
                title="Try Again"
                onPress={handleCapture}
                style={{
                  marginTop: 20,
                  width: 250,
                  backgroundColor: "#FF9800",
                }}
              />
              {facesDetected && (
                <CustomButton
                  title="Done"
                  onPress={handleDone}
                  style={{
                    marginTop: 15,
                    width: 250,
                    backgroundColor: "#48A6A7",
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Image
                source={images.face}
                style={{ width: 200, height: 200, marginTop: 30 }}
                resizeMode="contain"
              />
              <CustomButton
                title="Capture Face"
                onPress={handleCapture}
                style={{
                  marginTop: 30,
                  width: 250,
                  backgroundColor: "#006A71",
                }}
              />
            </>
          )}
        </>
      )}

      {/* Error Modal */}
      <ReactNativeModal
        isVisible={errorModalVisible}
        onBackdropPress={() => setErrorModalVisible(false)}
        backdropOpacity={0.5}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 24,
            paddingVertical: 32,
            borderRadius: 16,
            width: "85%",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 16,
              color: "#006A71",
            }}
          >
            {errorTitle}
          </Text>
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              color: "#4A5568",
              marginBottom: 24,
            }}
          >
            {errorMessage}
          </Text>
          <CustomButton
            title="Close"
            onPress={() => setErrorModalVisible(false)}
            style={{ backgroundColor: "#9ACBD0" }}
          />
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default FaceDetection;

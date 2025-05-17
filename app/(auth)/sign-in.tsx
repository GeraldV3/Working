import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Modal,
  TouchableOpacity,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@components/CustomButton";
import InputField from "@components/InputField";
import { icons } from "@/constants";

const SignIn = () => {
  const signInInstance = useSignIn();
  const { signIn, setActive, isLoaded } = signInInstance || {};
  const router = useRouter();

  const COLORS = {
    background: "#F2EFE7",
    title: "#006A71",
    subtitle: "#9ACBD0",
    buttonPrimary: "#48A6A7",
    modalOverlay: "rgba(0,0,0,0.5)",
    modalBackground: "#FFFFFF",
  };

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStage, setResetStage] = useState<"sendEmail" | "resetPassword">(
    "sendEmail",
  );
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showErrorModal = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const onSignInPress = useCallback(async () => {
    if (!form.email && !form.password) {
      return showErrorModal(
        "Missing Information",
        "Please enter your email and password.",
      );
    }

    if (!form.email) {
      return showErrorModal(
        "Missing Email",
        "Please enter your email address.",
      );
    }

    if (!form.password) {
      return showErrorModal("Missing Password", "Please enter your password.");
    }

    if (!isLoaded || !signIn) {
      return showErrorModal("Error", "Sign-in functionality is not available.");
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive?.({ session: signInAttempt.createdSessionId });
        router.replace("/(auth)/success");
      } else {
        showErrorModal("Sign In Failed", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);

      const errorMessage = err.errors?.[0]?.longMessage || "";

      if (errorMessage.includes("identifier is invalid")) {
        showErrorModal("Invalid Email", "Please enter a valid email address.");
      } else {
        showErrorModal(
          "Sign In Error",
          errorMessage || "Invalid credentials. Please try again.",
        );
      }
    }
  }, [isLoaded, form, setActive, signIn, router]);

  const onForgotPasswordPress = useCallback(async () => {
    if (!resetEmail) {
      return showErrorModal(
        "Missing Email",
        "Please enter your email to reset your password.",
      );
    }

    if (!signIn) {
      return showErrorModal(
        "Error",
        "Password reset functionality is not available.",
      );
    }

    try {
      await signIn.create({
        identifier: resetEmail,
        strategy: "reset_password_email_code",
      });

      setResetStage("resetPassword"); // Move to the reset password stage
      showErrorModal(
        "Reset Email Sent",
        "A password reset code has been sent to your email.",
      );
    } catch (err: any) {
      console.error("Error sending reset email:", err);

      const errorMessage = err.errors?.[0]?.longMessage || "";

      if (errorMessage.includes("identifier is invalid")) {
        showErrorModal("Invalid Email", "Please enter a valid email address.");
      } else {
        showErrorModal(
          "Reset Error",
          errorMessage || "Unable to send reset link. Please try again.",
        );
      }
    }
  }, [resetEmail, signIn]);

  const onResetPasswordPress = useCallback(async () => {
    if (!resetCode || !newPassword) {
      return showErrorModal(
        "Missing Information",
        "Please enter the reset code and your new password.",
      );
    }

    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });

      if (result?.status === "complete") {
        setResetModalVisible(false); // Close modal on success
        showErrorModal(
          "Success",
          "Your password has been reset successfully. Please login again.",
        );
      } else {
        showErrorModal(
          "Reset Failed",
          "Password reset failed. Please check the code and try again.",
        );
      }
    } catch (err: any) {
      console.error("Error resetting password:", err);

      showErrorModal(
        "Reset Error",
        err.errors?.[0]?.longMessage ||
          "Something went wrong. Please try again.",
      );
    }
  }, [resetCode, newPassword, signIn]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F2EFE7" }}>
      <View style={{ flex: 1, backgroundColor: "#F2EFE7" }}>
        <Text
          style={{
            fontSize: 24, // text-3xl ~ 24px
            color: "#006A71",
            fontFamily: "Jakarta-Bold",
            marginTop: 60,
            textAlign: "center",
          }}
        >
          Welcome Back
        </Text>

        <Text
          style={{
            fontSize: 16, // text-lg ~16px
            color: "#9ACBD0",
            marginTop: 4,
            textAlign: "center",
          }}
        >
          Login to your account
        </Text>

        <View style={{ padding: 20, marginTop: 80 }}>
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value: string) => setForm({ ...form, email: value })}
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            rightIcon={passwordVisible ? icons.visible : icons.eyecross}
            secureTextEntry={!passwordVisible}
            textContentType="password"
            value={form.password}
            onChangeText={(value: string) =>
              setForm({ ...form, password: value })
            }
            onRightIconPress={() => setPasswordVisible(!passwordVisible)}
            rightIconStyle={{ opacity: 0.3 }}
          />

          <Text
            onPress={() => {
              setResetModalVisible(true);
              setResetStage("sendEmail");
            }}
            style={{
              color: "#9ACBD0",
              textAlign: "right",
              marginRight: 8,
              marginTop: 8,
            }}
          >
            Forgot Password?
          </Text>

          <CustomButton
            title="Sign In"
            onPress={onSignInPress}
            style={{ marginTop: 100, backgroundColor: "#48A6A7" }}
          />

          <TouchableOpacity
            onPress={() => setRoleModalVisible(true)}
            style={{ marginTop: 35 }}
          >
            <Text
              style={{
                fontSize: 16,
                textAlign: "center",
                color: "#48A6A7",
              }}
            >
              Don't have an account?{" "}
              <Text style={{ color: "#006A71" }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <ReactNativeModal
        isVisible={resetModalVisible}
        onBackdropPress={() => setResetModalVisible(false)}
        backdropOpacity={0.5}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 24,
            paddingVertical: 32,
            borderRadius: 12,
            width: "100%",
            maxWidth: "90%",
          }}
        >
          {resetStage === "sendEmail" ? (
            <>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Forgot Password
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#006A71",
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Enter your email address, and we'll send you a reset code.
              </Text>

              <TextInput
                placeholder="Enter your email"
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                style={{
                  borderWidth: 1,
                  borderColor: "#9ACBD0",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                  color: "#006A71",
                }}
              />

              <CustomButton
                title="Send Reset Code"
                onPress={onForgotPasswordPress}
                style={{ marginTop: 16, backgroundColor: "#006A71" }}
              />
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Reset Password
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#006A71",
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Enter the reset code sent to your email and your new password.
              </Text>

              <TextInput
                placeholder="Enter the reset code"
                value={resetCode}
                onChangeText={setResetCode}
                placeholderTextColor="#A0A0A0"
                style={{
                  borderWidth: 1,
                  borderColor: "#9ACBD0",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                  color: "#006A71",
                }}
              />

              <TextInput
                placeholder="Enter your new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholderTextColor="#A0A0A0"
                style={{
                  borderWidth: 1,
                  borderColor: "#9ACBD0",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                  color: "#006A71",
                }}
              />

              <CustomButton
                title="Reset Password"
                onPress={onResetPasswordPress}
                style={{ marginTop: 16, backgroundColor: "#006A71" }}
              />
            </>
          )}

          <CustomButton
            title="Cancel"
            onPress={() => setResetModalVisible(false)}
            style={{ marginTop: 16, backgroundColor: "#9ACBD0" }}
          />
        </View>
      </ReactNativeModal>

      {/* Role Selection Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: COLORS.modalOverlay,
          }}
        >
          <View
            style={{
              width: "80%",
              borderRadius: 12,
              padding: 24,
              backgroundColor: COLORS.modalBackground,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 16,
                color: COLORS.title,
              }}
              accessibilityRole="header"
            >
              Select Your Role
            </Text>

            <CustomButton
              title="Teacher"
              onPress={() => {
                setRoleModalVisible(false);
                router.replace("/(auth)/sign-up-teacher");
              }}
              style={{
                width: "100%",
                paddingVertical: 12,
                marginBottom: 16,
                borderRadius: 12,
                backgroundColor: COLORS.buttonPrimary,
              }}
              accessibilityLabel="Register as a teacher"
            />

            <CustomButton
              title="Parent"
              onPress={() => {
                setRoleModalVisible(false);
                router.replace("/(auth)/sign-up");
              }}
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: COLORS.buttonPrimary,
              }}
              accessibilityLabel="Register as a parent"
            />

            <TouchableOpacity
              onPress={() => setRoleModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel role selection"
            >
              <Text
                style={{
                  textAlign: "center",
                  textDecorationLine: "underline",
                  marginTop: 16,
                  color: COLORS.title,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            borderRadius: 12,
            width: "100%",
            maxWidth: "90%",
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
    </ScrollView>
  );
};

export default SignIn;

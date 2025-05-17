import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { getDatabase, ref, set } from "firebase/database";
import { useState } from "react";
import { ScrollView, Text, View, Image, TouchableOpacity } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import { useTeacherForm } from "@lib/TeacherFormContext";
import CustomButton from "@components/CustomButton";
import InputField from "@components/InputField";
import { icons, images } from "@/constants";

interface FormState {
  email: string;
  password: string;
}

interface VerificationState {
  state: "default" | "pending" | "failed";
  error: string;
  code: string;
}

const SignUp_Teacher = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { form, setForm } = useTeacherForm() as {
    form: FormState;
    setForm: React.Dispatch<React.SetStateAction<FormState>>;
  };

  const [passwordVisible, setPasswordVisible] = useState(false);

  const [verification, setVerification] = useState<VerificationState>({
    state: "default",
    error: "",
    code: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showErrorModal = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) {
      return showErrorModal(
        "Error",
        "Clerk is not ready. Please try again later.",
      );
    }

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

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification((prev) => ({
        ...prev,
        state: "pending",
      }));
    } catch (error: any) {
      console.error("Sign-up error:", error);

      const errorMessage = error.errors?.[0]?.longMessage || "";

      if (errorMessage.includes("identifier is invalid")) {
        showErrorModal("Invalid Email", "Please enter a valid email address.");
      } else {
        showErrorModal(
          "Sign Up Error",
          errorMessage || "An unknown error occurred.",
        );
      }
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || !signUp) {
      return showErrorModal(
        "Error",
        "Clerk is not ready. Please try again later.",
      );
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        const db = getDatabase();
        const teacherId = completeSignUp.createdUserId;

        const payload = {
          email: form.email,
          clerkId: teacherId,
        };

        console.log("Saving Teacher to Firebase with payload:", payload);

        await set(ref(db, `Users/Teachers/TeacherId/${teacherId}`), payload);

        await setActive({ session: completeSignUp.createdSessionId });

        setShowSuccessModal(true);
      } else {
        setVerification((prev) => ({
          ...prev,
          error: "Verification failed. Please try again.",
          state: "failed",
        }));
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setVerification((prev) => ({
        ...prev,
        error: "Verification failed. Please try again.",
        state: "failed",
      }));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F2EFE7" }}>
      <View style={{ flex: 1, backgroundColor: "#F2EFE7" }}>
        <Text
          style={{
            fontSize: 30,
            color: "#006A71",
            fontWeight: "bold",
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Let's get started!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#9ACBD0",
            textAlign: "center",
          }}
        >
          Create an account to get started.
        </Text>

        <View style={{ padding: 20, marginTop: 80 }}>
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value: string) =>
              setForm((prev) => ({ ...prev, email: value }))
            }
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
              setForm((prev) => ({ ...prev, password: value }))
            }
            onRightIconPress={() => setPasswordVisible(!passwordVisible)}
          />

          <CustomButton
            title="Sign Up"
            onPress={handleSignUp}
            style={{
              marginTop: 150,
              backgroundColor: "#48A6A7",
            }}
          />

          <TouchableOpacity onPress={() => router.push("/sign-in")}>
            <Text
              style={{
                fontSize: 18,
                textAlign: "center",
                color: "#9ACBD0",
                marginTop: 40,
              }}
            >
              Already have an account?{" "}
              <Text style={{ color: "#006A71", fontWeight: "bold" }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Verification Modal */}
      <ReactNativeModal isVisible={verification.state === "pending"}>
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 20,
            minHeight: 300,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 24,
              marginBottom: 8,
              color: "#006A71",
            }}
          >
            Verification
          </Text>
          <Text style={{ marginBottom: 20, color: "#9ACBD0" }}>
            We've sent a verification code to {form.email}.
          </Text>
          <InputField
            label="Verification Code"
            placeholder="Enter code"
            icon={icons.lock}
            keyboardType="numeric"
            value={verification.code}
            onChangeText={(value: string) =>
              setVerification((prev) => ({ ...prev, code: value }))
            }
          />
          {verification.error && (
            <Text style={{ color: "#ef4444", fontSize: 14, marginTop: 4 }}>
              {verification.error}
            </Text>
          )}
          <CustomButton
            title="Verify Email"
            onPress={onPressVerify}
            style={{ marginTop: 20, backgroundColor: "#48A6A7" }}
          />
        </View>
      </ReactNativeModal>

      {/* Success Modal */}
      <ReactNativeModal isVisible={showSuccessModal}>
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 20,
            minHeight: 300,
          }}
        >
          <Image
            source={images.check}
            style={{ width: 110, height: 110, alignSelf: "center" }}
          />
          <Text
            style={{
              fontSize: 30,
              fontWeight: "bold",
              textAlign: "center",
              marginTop: 16,
              color: "#006A71",
            }}
          >
            Verified
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#9ACBD0",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            You have successfully verified your account.
          </Text>
          <CustomButton
            title="Continue"
            style={{ marginTop: 20, backgroundColor: "#48A6A7" }}
            onPress={() => {
              setShowSuccessModal(false);
              router.push({
                pathname: "/home",
                params: { role: "teacher", userId: form.email },
              });
            }}
          />
        </View>
      </ReactNativeModal>

      {/* Error Modal */}
      <ReactNativeModal
        isVisible={errorModalVisible}
        onBackdropPress={() => setErrorModalVisible(false)}
        backdropOpacity={0.5}
      >
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 24,
            paddingVertical: 32,
            borderRadius: 12,
            width: "90%",
            alignSelf: "center",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
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
              color: "#374151",
              textAlign: "center",
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

export default SignUp_Teacher;

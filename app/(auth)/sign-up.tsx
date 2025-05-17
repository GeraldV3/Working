import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getDatabase, ref, set } from "firebase/database";
import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { ActivityIndicator } from "react-native";

import { useForm } from "@lib/FormContext";
import CustomButton from "@components/CustomButton";
import InputField from "@components/InputField";
import { icons, images } from "@/constants";

interface FormState {
  childName: string;
  email: string;
  password: string;
  profilePicture: string;
  faceImageBase64?: string;
}

interface VerificationState {
  state: "default" | "pending" | "failed";
  error: string;
  code: string;
}

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { form, setForm } = useForm() as {
    form: FormState;
    setForm: React.Dispatch<React.SetStateAction<FormState>>;
  };

  const [verification, setVerification] = useState<VerificationState>({
    state: "default",
    error: "",
    code: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rescanModalVisible, setRescanModalVisible] = useState(false); // 👈 added
  const [verifying, setVerifying] = useState(false);

  const showErrorModal = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  useEffect(() => {
    const imageUri = searchParams?.imageUri as string | undefined;
    const faceImageBase64 = searchParams?.faceImageBase64 as string | undefined;

    if (imageUri) {
      setForm((prev) => ({
        ...prev,
        profilePicture: imageUri,
        faceImageBase64: faceImageBase64 || prev.faceImageBase64,
      }));
    }
  }, [searchParams?.imageUri, searchParams?.faceImageBase64, setForm]);

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) {
      return showErrorModal(
        "Error",
        "Clerk is not ready. Please try again later.",
      );
    }

    if (!form.childName && !form.email && !form.password) {
      return showErrorModal(
        "Missing Information",
        "Please complete all fields and scan your child's face.",
      );
    }
    if (!form.childName) {
      return showErrorModal(
        "Missing Child Name",
        "Please enter your child's name.",
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
    if (!form.profilePicture) {
      router.push("/(auth)/face-recognition");
      return;
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

    setVerifying(true); // Start loading

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        const db = getDatabase();
        const parentId = completeSignUp.createdUserId;
        const teacherId = "Class-A";

        const payload = {
          childName: form.childName,
          email: form.email,
          clerkId: parentId,
          profilePictureFilename: form.profilePicture,
          faceRecognition: {
            filename: form.profilePicture,
            imageData: form.faceImageBase64,
          },
        };

        await set(
          ref(db, `Users/Teachers/${teacherId}/Parents/${parentId}`),
          payload,
        );
        await setActive({ session: completeSignUp.createdSessionId });
        setShowSuccessModal(true);
      } else {
        setVerification((prev) => ({
          ...prev,
          error: "Verification failed. Please try again.",
          state: "failed",
        }));
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerification((prev) => ({
        ...prev,
        error: "Verification failed. Please try again.",
        state: "failed",
      }));
    } finally {
      setVerifying(false); // Stop loading
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
        <Text style={{ fontSize: 16, color: "#9ACBD0", textAlign: "center" }}>
          Create an account to get started.
        </Text>

        <View style={{ padding: 20, marginTop: 20 }}>
          {/* Inputs unchanged */}
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
            rightIconStyle={{ opacity: 0.3 }}
          />
          <InputField
            label="Child Name"
            placeholder="Enter child name"
            icon={icons.person}
            value={form.childName}
            onChangeText={(value: string) =>
              setForm((prev) => ({ ...prev, childName: value }))
            }
          />

          <CustomButton
            title={
              form.profilePicture ? "Face Scan Completed" : "Scan Child's Face"
            }
            onPress={() => {
              if (form.profilePicture) {
                setRescanModalVisible(true);
              } else {
                router.push("/(auth)/face-recognition");
              }
            }}
            style={{
              marginTop: 24,
              backgroundColor: form.profilePicture ? "#006A71" : "#48A6A7",
            }}
          />

          <CustomButton
            title="Sign Up"
            onPress={handleSignUp}
            style={{ marginTop: 24, backgroundColor: "#48A6A7" }}
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

        {/* Verification Modal */}
        <ReactNativeModal isVisible={verification.state === "pending"}>
          <View
            style={{
              backgroundColor: "white",
              paddingHorizontal: 28,
              paddingVertical: 36,
              borderRadius: 20,
              minHeight: 300,
              position: "relative",
            }}
          >
            <TouchableOpacity
              onPress={() =>
                setVerification({ state: "default", error: "", code: "" })
              }
              style={{ position: "absolute", top: 15, right: 15 }}
            >
              <Text
                style={{ fontSize: 20, color: "#006A71", fontWeight: "bold" }}
              >
                X
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
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
              <Text style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}>
                {verification.error}
              </Text>
            )}

            {verifying ? (
              <ActivityIndicator
                size="large"
                color="#006A71"
                style={{ marginTop: 20 }}
              />
            ) : (
              <CustomButton
                title="Verify Email"
                onPress={onPressVerify}
                style={{ marginTop: 20, backgroundColor: "#48A6A7" }}
              />
            )}
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
              onPress={() => router.push("/(auth)/success")}
              style={{ marginTop: 20, backgroundColor: "#48A6A7" }}
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
              width: "85%",
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

        {/* Rescan Modal */}
        <ReactNativeModal
          isVisible={rescanModalVisible}
          onBackdropPress={() => setRescanModalVisible(false)}
          backdropOpacity={0.5}
        >
          <View
            style={{
              backgroundColor: "white",
              paddingHorizontal: 24,
              paddingVertical: 32,
              borderRadius: 20,
              width: "85%",
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
              Face Scan Found
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#4b5563",
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              You've already scanned. What do you want to do?
            </Text>

            <CustomButton
              title="Continue with Existing"
              onPress={() => setRescanModalVisible(false)}
              style={{ backgroundColor: "#48A6A7", marginBottom: 16 }}
            />

            <CustomButton
              title="Scan Again"
              onPress={() => {
                setForm((prev) => ({
                  ...prev,
                  profilePicture: "",
                  faceImageBase64: undefined,
                }));
                setRescanModalVisible(false);
                router.push("/(auth)/face-recognition");
              }}
              style={{ backgroundColor: "#006A71" }}
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;

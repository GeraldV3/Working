import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-expo";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import Modal, { ReactNativeModal } from "react-native-modal"; // Correctly importing react-native-modal

import { paragraphs } from "@/constants"; // Importing paragraphs
import { getDatabase, ref, get, update } from "firebase/database";
import CustomButton from "@components/CustomButton";

const Settings = () => {
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] =
    useState(false);
  const [aboutUsModalVisible, setAboutUsModalVisible] = useState(false);
  const [privacyPolicyModalVisible, setPrivacyPolicyModalVisible] =
    useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [role, setRole] = useState<"parent" | "teacher" | null>(null);

  const [scanIntervalModalVisible, setScanIntervalModalVisible] =
    useState(false);
  const [scanInterval, setScanInterval] = useState("");

  const { user } = useUser();
  const { signOut } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleAvatarChange = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "We need permission to access your photos",
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      try {
        const base64Image = await FileSystem.readAsStringAsync(
          pickerResult.assets[0].uri,
          {
            encoding: FileSystem.EncodingType.Base64,
          },
        );

        const base64WithMimeType = `data:image/jpeg;base64,${base64Image}`;

        await user?.setProfileImage({ file: base64WithMimeType });
        Alert.alert("Success", "Your avatar has been updated!");
      } catch (error) {
        console.error("Error updating avatar:", error);
        Alert.alert("Error", "An error occurred while updating your avatar.");
      }
    }
  };

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  useEffect(() => {
    if (!user?.id) return;

    const db = getDatabase();
    const userId = user.id;

    const fetchRole = async () => {
      try {
        const teacherSnap = await get(
          ref(db, `Users/Teachers/TeacherId/${userId}`),
        );
        if (teacherSnap.exists()) {
          setRole("teacher");

          // 🕒 Fetch scan interval for teacher
          const intervalRef = ref(
            db,
            `Users/Teachers/TeacherId/${userId}/scanInterval`,
          );
          const intervalSnap = await get(intervalRef);
          const val = intervalSnap.val();
          if (typeof val === "number") {
            setScanInterval(String(val));
          }

          return;
        }

        const parentSnap = await get(
          ref(db, `Users/Teachers/Class-A/Parents/${userId}`),
        );
        if (parentSnap.exists()) {
          setRole("parent");
          return;
        }

        console.warn("❗ No role found for user:", userId);
      } catch (error) {
        console.error("Error detecting role in Settings:", error);
      }
    };

    fetchRole();
  }, [user]);

  const handleSaveProfile = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      showModal("Missing Name", "First and last name are required.");
      return;
    }

    try {
      // Update Clerk
      await user?.update({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      await user?.reload();

      const db = getDatabase();
      const userId = user?.id;

      const firebasePath =
        role === "teacher"
          ? `Users/Teachers/TeacherId/${userId}`
          : `Users/Teachers/Class-A/Parents/${userId}`;

      await update(ref(db, firebasePath), {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });

      showModal("Success", "Your profile has been updated!");
      setEditProfileModalVisible(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showModal("Error", "An error occurred while updating your profile.");
    }
  };

  const handleNewPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      showModal("Incomplete Information", "All fields must be completed.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showModal("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      await user?.updatePassword({ currentPassword, newPassword });
      showModal("Success", "Your password has been updated!");
      setChangePasswordModalVisible(false);
    } catch (error) {
      console.error("Error updating password:", error);
      showModal("Error", "An error occurred while updating your password.");
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#F2EFE7", flex: 1 }}>
      {/* Wrapper for Black Background */}
      <View
        // from: className="absolute w-full h-[185px]"
        style={{
          position: "absolute",
          width: "100%",
          height: 185,
          backgroundColor: "#006A71",
        }}
      />

      {/* Content */}
      <ScrollView style={{ flex: 1, backgroundColor: "#F2EFE7" }}>
        {/* Header */}
        <View
          // from: className="py-8 px-5"
          style={{ paddingVertical: 32, paddingHorizontal: 20 }}
        >
          <Text
            // from: className="text-white text-3xl font-bold"
            style={{
              color: "#006A71", // Dark Teal
              fontSize: 30,
              fontWeight: "bold",
            }}
          >
            Settings
          </Text>
        </View>

        {/* Profile Section */}
        <View
          // from: className="bg-white mx-4 mt-[10px] rounded-3xl shadow-lg"
          style={{
            backgroundColor: "white",
            marginHorizontal: 16,
            marginTop: 10,
            borderRadius: 24,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View
            // from: className="flex-row justify-between items-center p-5 border-b border-gray-200"
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb", // gray-200
            }}
          >
            <TouchableOpacity onPress={handleAvatarChange}>
              <Image
                source={{
                  uri: user?.imageUrl,
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 16,
                }}
              />
            </TouchableOpacity>
            <Text
              // from: className="text-lg font-semibold flex-1"
              style={{
                fontSize: 18,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {user?.firstName} {user?.lastName}
            </Text>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: "#9ACBD0",
              }}
            >
              <Text
                // from: className="text-gray-800 font-semibold"
                style={{
                  color: "#1f2937", // gray-800
                  fontWeight: "600",
                }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Settings Section */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb", // Tailwind's gray-200
              paddingBottom: 25,
            }}
          >
            <Text
              // from: className="text-gray-400 font-semibold px-5 pt-5 pb-5"
              style={{
                color: "#9ca3af", // gray-400
                fontWeight: "600",
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              Account Settings
            </Text>
            <TouchableOpacity
              onPress={() => setEditProfileModalVisible(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <Text
                // from: className="text-base text-gray-800"
                style={{
                  fontSize: 16,
                  color: "#1f2937", // gray-800
                }}
              >
                Edit profile
              </Text>
              <Text
                // from: className="text-gray-400"
                style={{
                  color: "#9ca3af", // gray-400
                }}
              >
                {">"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChangePasswordModalVisible(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#1f2937", // Tailwind gray-800
                }}
              >
                Change password
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#9ca3af", // Tailwind gray-400
                }}
              >
                {">"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* More Section */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb", // Tailwind gray-200
              paddingBottom: 45,
            }}
          >
            <Text
              style={{
                color: "#9ca3af", // Tailwind gray-400
                fontWeight: "600",
                paddingHorizontal: 20, // px-5 = 20
                paddingTop: 20, // pt-5 = 20
                paddingBottom: 20, // pb-5 = 20
              }}
            >
              More
            </Text>
            {/* Main Settings View */}
            {role === "teacher" && (
              <View style={{ marginHorizontal: 20, marginTop: 10 }}>
                {/* Configure Scan Interval Button */}
                <TouchableOpacity
                  onPress={() => setScanIntervalModalVisible(true)}
                  style={{
                    backgroundColor: "#48A6A7",
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 15,
                  }}
                >
                  <Text
                    // from: className="text-white font-semibold text-base"
                    style={{
                      color: "white",
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Configure Scan Interval
                  </Text>
                </TouchableOpacity>

                {/* Display the current scan interval */}
                <View
                  style={{
                    width: "80%", // Smaller container width
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: "#9ACBD0",
                    borderRadius: 10,
                    backgroundColor: "#FFFFFF",
                    marginBottom: 15,
                    alignItems: "center", // Centering the text
                    alignSelf: "center", // Center the container itself
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14, // Smaller font size
                      color: "#333",
                      fontWeight: "bold",
                    }}
                  >
                    Current Scan Interval:
                  </Text>
                  <Text
                    style={{
                      fontSize: 16, // Smaller font size
                      color: "#48A6A7",
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    {scanInterval} seconds
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setAboutUsModalVisible(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <Text style={{ fontSize: 16, color: "#1F2937" /* gray-800 */ }}>
                About Us
              </Text>
              <Text style={{ color: "#9CA3AF" /* gray-400 */ }}>{">"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPrivacyPolicyModalVisible(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <Text style={{ fontSize: 16, color: "#1F2937" /* gray-800 */ }}>
                Privacy Policy
              </Text>
              <Text style={{ color: "#9CA3AF" /* gray-400 */ }}>{">"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Us Modal */}
        <Modal
          isVisible={aboutUsModalVisible}
          onBackdropPress={() => setAboutUsModalVisible(false)}
          onBackButtonPress={() => setAboutUsModalVisible(false)}
          style={{
            margin: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SafeAreaView
            style={{
              backgroundColor: "#F2EFE7",
              borderRadius: 16,
              width: "90%",
            }}
          >
            <View
              style={{
                backgroundColor: "#006A71",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <Text
                // from: className="text-white text-2xl font-bold"
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                About Us
              </Text>
            </View>
            <ScrollView style={{ padding: 15, maxHeight: 400 }}>
              <Text style={{ fontSize: 16, color: "#1F2937" /* gray-800 */ }}>
                {paragraphs.aboutUs}
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setAboutUsModalVisible(false)}
              style={{
                backgroundColor: "#48A6A7",
                paddingVertical: 15,
                borderRadius: 8,
                margin: 15,
              }}
            >
              <Text
                // from: className="text-white text-center text-lg font-semibold"
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          isVisible={privacyPolicyModalVisible}
          onBackdropPress={() => setPrivacyPolicyModalVisible(false)}
          onBackButtonPress={() => setPrivacyPolicyModalVisible(false)}
          style={{
            margin: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SafeAreaView
            style={{
              backgroundColor: "#F2EFE7",
              borderRadius: 16,
              width: "90%",
            }}
          >
            <View
              style={{
                backgroundColor: "#006A71",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <Text
                // from: className="text-white text-2xl font-bold"
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                Privacy Policy
              </Text>
            </View>
            <ScrollView style={{ padding: 15, maxHeight: 400 }}>
              <Text style={{ fontSize: 16, color: "#1F2937" /* gray-800 */ }}>
                {paragraphs.privacyPolicy}
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setPrivacyPolicyModalVisible(false)}
              style={{
                backgroundColor: "#48A6A7",
                paddingVertical: 15,
                borderRadius: 8,
                margin: 15,
              }}
            >
              <Text
                style={{
                  color: "#fff", // white
                  textAlign: "center",
                  fontSize: 18, // text-lg = 18px approx
                  fontWeight: "600", // font-semibold
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
      </ScrollView>

      {/* Edit Profile Button */}
      <TouchableOpacity
        onPress={() => {
          setFirstName(user?.firstName || "");
          setLastName(user?.lastName || "");
          setEditProfileModalVisible(true);
        }}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Text style={{ fontSize: 16, color: "#1F2937" /* gray-800 */ }}>
          Edit profile
        </Text>
        <Text style={{ color: "#9CA3AF" /* gray-400 */ }}>{">"}</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        isVisible={editProfileModalVisible}
        onBackdropPress={() => setEditProfileModalVisible(false)}
        onBackButtonPress={() => setEditProfileModalVisible(false)}
        style={{ margin: 0, justifyContent: "center", alignItems: "center" }}
      >
        <SafeAreaView
          style={{
            backgroundColor: "#F2EFE7",
            borderRadius: 16,
            width: "90%",
          }}
        >
          <View
            style={{
              backgroundColor: "#006A71",
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Text
              // from: className="text-white text-2xl font-bold"
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              Edit Profile
            </Text>
          </View>
          <View style={{ padding: 15 }}>
            <TextInput
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={{
                backgroundColor: "#F2EFE7",
                borderWidth: 1,
                borderColor: "#9ACBD0",
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              }}
            />
            <TextInput
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={{
                backgroundColor: "#F2EFE7",
                borderWidth: 1,
                borderColor: "#9ACBD0",
                padding: 10,
                borderRadius: 8,
                marginBottom: 25,
              }}
            />
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={{
                backgroundColor: "#48A6A7",
                paddingVertical: 15,
                borderRadius: 8,
                marginBottom: 15,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 18, // text-lg
                  fontWeight: "600", // font-semibold
                }}
              >
                Save Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditProfileModalVisible(false)}
              style={{
                backgroundColor: "#9ACBD0",
                paddingVertical: 15,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 18, // text-lg
                  fontWeight: "600", // font-semibold
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <ReactNativeModal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        backdropOpacity={0.5}
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 24, // px-6 = 6 * 4
            paddingVertical: 32, // py-8 = 8 * 4
            borderRadius: 12, // rounded-lg (approx 12)
            width: "100%",
            maxWidth: "90%",
          }}
        >
          <Text
            style={{
              fontSize: 24, // text-2xl (24px)
              fontWeight: "700", // font-bold
              textAlign: "center",
              marginBottom: 16, // mb-4
              color: "#006A71",
            }}
          >
            {modalTitle}
          </Text>
          <Text
            style={{
              fontSize: 16, // text-base
              textAlign: "center",
              color: "#4B5563", // gray-700
              marginBottom: 24, // mb-6
            }}
          >
            {modalMessage}
          </Text>
          <CustomButton
            title="Close"
            onPress={() => setModalVisible(false)}
            style={{ backgroundColor: "#9ACBD0" }}
          />
        </View>
      </ReactNativeModal>

      {/* Scan Interval Modal */}
      <Modal
        isVisible={scanIntervalModalVisible}
        onBackdropPress={() => setScanIntervalModalVisible(false)}
        onBackButtonPress={() => setScanIntervalModalVisible(false)}
        style={{ margin: 0, justifyContent: "center", alignItems: "center" }}
      >
        <SafeAreaView
          style={{ backgroundColor: "#F2EFE7", borderRadius: 16, width: "90%" }}
        >
          <View
            style={{
              backgroundColor: "#006A71",
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Text
              // from: className="text-white text-2xl font-bold"
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              Configure Scan Interval
            </Text>
          </View>
          <View style={{ padding: 15 }}>
            <TextInput
              placeholder="Enter interval in seconds"
              keyboardType="numeric"
              value={scanInterval}
              onChangeText={setScanInterval}
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "#9ACBD0",
                borderWidth: 1,
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />
            <TouchableOpacity
              onPress={async () => {
                const intervalValue = parseInt(scanInterval, 10);

                if (isNaN(intervalValue) || intervalValue <= 0) {
                  showModal(
                    "Invalid Input",
                    "Please enter a valid positive number.",
                  );
                  return;
                }

                const db = getDatabase();
                const userId = user?.id;

                if (!userId || role !== "teacher") {
                  showModal("Error", "Only teachers can set scan interval.");
                  return;
                }

                try {
                  await update(ref(db, `Users/Teachers/TeacherId/${userId}`), {
                    scanInterval: intervalValue,
                  });
                  setScanIntervalModalVisible(false);
                  showModal("Success", "Scan interval updated successfully.");
                } catch (error) {
                  console.error("Error saving scan interval:", error);
                  showModal("Error", "Failed to update scan interval.");
                }
              }}
              style={{
                backgroundColor: "#48A6A7",
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                Save Interval
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScanIntervalModalVisible(false)}
              style={{
                backgroundColor: "#9ACBD0",
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 18, // text-lg
                  fontWeight: "600", // font-semibold
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isVisible={changePasswordModalVisible}
        onBackdropPress={() => setChangePasswordModalVisible(false)}
        onBackButtonPress={() => setChangePasswordModalVisible(false)}
        style={{ margin: 0, justifyContent: "center", alignItems: "center" }} // Adjusting modal's style
      >
        <SafeAreaView
          style={{
            backgroundColor: "#F2EFE7",
            borderRadius: 16,
            width: "90%",
          }}
        >
          <View
            style={{
              backgroundColor: "#006A71",
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Text
              // from: className="text-white text-2xl font-bold"
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              Change Password
            </Text>
          </View>
          <View style={{ padding: 15 }}>
            <TextInput
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={{
                backgroundColor: "#F2EFE7",
                borderWidth: 1,
                borderColor: "#9ACBD0",
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              }}
            />
            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={{
                backgroundColor: "#F2EFE7",
                borderWidth: 1,
                borderColor: "#9ACBD0",
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              }}
            />
            <TextInput
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              style={{
                backgroundColor: "#F2EFE7",
                borderWidth: 1,
                borderColor: "#9ACBD0",
                padding: 10,
                borderRadius: 8,
                marginBottom: 25,
              }}
            />
            <TouchableOpacity
              onPress={handleNewPassword}
              style={{
                backgroundColor: "#48A6A7",
                paddingVertical: 15,
                borderRadius: 8,
                marginBottom: 15,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 18, // text-lg
                  fontWeight: "600", // font-semibold
                }}
              >
                Save Changes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChangePasswordModalVisible(false)}
              style={{
                backgroundColor: "#9ACBD0",
                paddingVertical: 15,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 18, // text-lg
                  fontWeight: "600", // font-semibold
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Settings;

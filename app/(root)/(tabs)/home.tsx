import { useUser } from "@clerk/clerk-expo";
import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  TextInput,
  Animated,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { Emotion, emotionsMap, emotionStyles } from "@lib/emotionConfig";
import { images } from "@/constants";
import { getDatabase, ref, get, onValue, set, update } from "firebase/database";
import { app } from "@lib/firebaseConfig"; // Import the initialized Firebase app
import { useCallback } from "react";

const Home = () => {
  const { user } = useUser(); // Get user data from Clerk
  const [emotion, setEmotion] = useState<Emotion | null>(null); // Current detected emotion
  const [history, setHistory] = useState<
    { emotion: Emotion; timestamp: Date }[]
  >([]); // Updated history type
  const [isModalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [isNameModalVisible, setNameModalVisible] = useState(false); // Name input modal
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [loading] = useState(false); // Track loading state
  const [teacherId, setTeacherId] = useState<string | null>(null); // Store teacher ID dynamically
  const [parentId, setParentId] = useState<string | null>(null); // Store parent ID dynamically
  const [childName, setChildName] = useState<string | null>(null);

  const animation = useRef(new Animated.Value(0)).current; // Animation value for cycling images
  const [frameIndex, setFrameIndex] = useState(0); // Index for animating frames
  const [emotionConfidence, setEmotionConfidence] = useState<number | null>(
    null,
  );

  const [role, setRole] = useState<string | null>(null); // Dynamically fetched role
  const userId = user?.id; // Clerk user ID

  const [isStudentPickerVisible, setStudentPickerVisible] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  const [filteredStudents, setFilteredStudents] = useState<typeof students>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTitle, setFeedbackTitle] = useState("");

  const COLORS = {
    background: "#F2EFE7",
    title: "#006A71",
    subtitle: "#9ACBD0",
    buttonPrimary: "#48A6A7",
    modalOverlay: "rgba(0,0,0,0.5)",
    modalBackground: "#FFFFFF",
  };

  interface Student {
    parentId: string;
    childName: string;
    latestEmotion: Emotion;
    time: number;
  }

  const [students, setStudents] = useState<Student[]>([]); // Using the Student type for the array

  const fetchRole = useCallback(async () => {
    if (!user?.id) return;

    const db = getDatabase(app);
    const teacherRef = ref(db, `Users/Teachers/TeacherId/${user.id}`);
    const teacherSnap = await get(teacherRef);

    if (teacherSnap.exists()) {
      console.log("Teacher role found.");
      setRole("teacher");
      return;
    }

    const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${user.id}`);
    const parentSnap = await get(parentRef);

    if (parentSnap.exists()) {
      console.log("Parent role found.");
      setRole("parent");
      return;
    }

    console.warn("No role found.");
    setRole("unknown");
  }, [user?.id]);

  useEffect(() => {
    if (!user || !user.id || role !== "teacher") return; // ✅ safer check

    const db = getDatabase(app); // Use app instance here
    const parentsRef = ref(db, "Users/Teachers/Class-A/Parents");

    const unsubscribe = onValue(parentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const studentList: {
        parentId: string;
        childName: string;
        latestEmotion: Emotion;
        time: number;
      }[] = [];

      Object.entries(data).forEach(([parentId, parentData]: any) => {
        const childName = parentData.childName || "Unknown";
        const emotions = parentData.emotions || {};

        const emotionArray = Object.entries(emotions)
          .map(([key, val]: any) => ({
            ...val,
            time: new Date(val.time).getTime(),
          }))
          .sort((a, b) => b.time - a.time);

        const latest = emotionArray[0];

        studentList.push({
          parentId,
          childName,
          latestEmotion: latest?.type || "Unknown",
          time: latest?.time || 0,
        });
      });

      setStudents(studentList);
      setFilteredStudents(studentList);
    });

    return () => unsubscribe();
  }, [user, role]);

  const handleSaveName = async () => {
    if (firstName.trim() && lastName.trim()) {
      try {
        if (user) {
          // ✅ 1. Update in Clerk
          await user.update({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });

          // ✅ 2. Update in Firebase under Teachers or Parents
          const db = getDatabase(app);
          const userId = user.id;

          const teacherRef = ref(db, `Users/Teachers/TeacherId/${userId}`);
          const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${userId}`);

          if (role === "teacher") {
            await set(teacherRef, {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              clerkId: userId,
            });
          } else if (role === "parent") {
            await update(parentRef, {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              clerkId: userId,
            });
          }
          setNameModalVisible(false);
          setFeedbackTitle("Success");
          setFeedbackMessage("Your name has been updated.");
          setFeedbackModalVisible(true);
        } else {
          setFeedbackTitle("Error");
          setFeedbackMessage("User is not available.");
          setFeedbackModalVisible(true);
        }
      } catch (error) {
        setFeedbackTitle("Error");
        setFeedbackMessage("Failed to update your name. Please try again.");
        setFeedbackModalVisible(true);
        console.error("Update Error:", error);
      }
    } else {
      setFeedbackTitle("Error");
      setFeedbackMessage("Please enter both first and last names.");
      setFeedbackModalVisible(true);
    }
  };

  useEffect(() => {
    if (user) {
      const hasName = user.firstName?.trim() && user.lastName?.trim();
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");

      if (!hasName) {
        setNameModalVisible(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user || !user.id) return; // ✅ added
    const db = getDatabase(app); // Use app instance here
    const emotionRef = ref(
      db,
      `Users/Teachers/Class-A/Parents/${
        role === "teacher" ? selectedStudentId : user.id
      }/emotions`,
    );

    const unsubscribe = onValue(emotionRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const emotionEntries = Object.entries(data)
        .map(([key, val]: any) => ({
          key,
          ...val,
          time: new Date(val.time).getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      const latestEntry = emotionEntries[0];

      if (latestEntry && latestEntry.type && latestEntry.type !== "Unknown") {
        setEmotion(latestEntry.type);
        if (latestEntry.child_name) {
          setChildName(latestEntry.child_name);
        }
        setEmotionConfidence(latestEntry.confidence || null); // <-- add this line

        setHistory((prev) => [
          { emotion: latestEntry.type, timestamp: new Date(latestEntry.time) },
          ...prev.filter(
            (entry) => entry.timestamp.getTime() !== latestEntry.time,
          ),
        ]);
      }
    });

    return () => unsubscribe();
  }, [user, role, selectedStudentId]);

  useEffect(() => {
    if (user && !role) {
      console.log("Triggering fetchRole for user:", user.id);
      fetchRole();
    }
  }, [userId, user, role, fetchRole]);

  useEffect(() => {
    if (!user) return;

    const db = getDatabase(app); // Use app instance here
    const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${user.id}`);

    const unsubscribe = onValue(parentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const childNameFromDB = data.childName || null;
        setChildName(childNameFromDB);
        console.log("Fetched Child Name:", childNameFromDB);
      } else {
        console.warn("No child name found in Firebase.");
      }
    });

    return () => unsubscribe();
  }, [user]);

  const fetchIds = useCallback(async () => {
    if (!user || !role) return;
    try {
      const db = getDatabase(app); // Use app instance here
      const classARef = ref(db, `Users/Teachers/Class-A`);
      const snapshot = await get(classARef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        if (role === "teacher") {
          setTeacherId("Class-A");
          setParentId(null);
        } else if (role === "parent") {
          const parents = data.Parents || {};
          const parentEntry = Object.entries(parents).find(
            ([, parentInfo]: any) => parentInfo.clerkId === user.id,
          );

          if (parentEntry) {
            setParentId(parentEntry[0]);
            setTeacherId("Class-A");
          } else {
            console.warn("No matching parent ID found.");
            setParentId(null);
          }
        } else {
          console.warn("Invalid role or role not defined.");
          setTeacherId(null);
          setParentId(null);
        }
      } else {
        console.warn("No data found in Class-A.");
      }
    } catch (error) {
      console.error("Error fetching IDs:", error);
    }
  }, [role, user]);

  useEffect(() => {
    console.log(`Role passed to Home component: ${role}`);
  }, [role]);

  useEffect(() => {
    fetchIds();
  }, [fetchIds, user, role]);

  useEffect(() => {
    console.log(
      `Role: ${role}, User ID: ${user?.id}, Teacher ID: ${teacherId}, Parent ID: ${parentId}`,
    );
  }, [role, user, teacherId, parentId]);

  useEffect(() => {
    if (emotion) {
      const interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 3);
      }, 300);

      return () => clearInterval(interval);
    }
  }, [emotion]);

  interface EmotionData {
    type: Emotion; // Emotion type (e.g., "Happy", "Sad", etc.)
    time: number; // Timestamp (e.g., the time the emotion was recorded)
  }

  const fetchEmotionHistory = useCallback(async () => {
    if (!user || !role) {
      console.warn("Role or User ID is not defined.");
      return;
    }
    const targetId = role === "teacher" ? selectedStudentId : user.id;

    if (!targetId) {
      console.warn("No target ID found to fetch emotion history.");
      return;
    }

    try {
      const db = getDatabase(app);
      const emotionRef = ref(
        db,
        `Users/Teachers/Class-A/Parents/${targetId}/emotions`,
      );
      const snapshot = await get(emotionRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        // Define EmotionData type here
        const emotionHistory = Object.entries(data).map(([key, value]) => {
          // Cast value to EmotionData type
          const typedValue = value as EmotionData;

          return {
            emotion: typedValue.type || "Unknown", // Set emotion type
            timestamp: typedValue.time ? new Date(typedValue.time) : new Date(), // Convert timestamp to Date
          };
        });

        emotionHistory.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );

        setHistory(emotionHistory);
      } else {
        console.warn("No emotion history found for target.");
        setHistory([]);
      }
    } catch (error) {
      console.error("Error fetching emotion history:", error);
      Alert.alert("Error", "Failed to fetch emotion history.");
    }
  }, [role, selectedStudentId, user]);

  useEffect(() => {
    if (isModalVisible) {
      fetchEmotionHistory();
    }
  }, [fetchEmotionHistory, isModalVisible, selectedStudentId]);

  return (
    <SafeAreaView
      style={[
        {
          backgroundColor: emotion
            ? emotionStyles[emotion].backgroundColor
            : "white",
          paddingHorizontal: 20,
        },
        { flex: 1 }, // equivalent to flex-1
      ]}
    >
      {/* Name Modal */}
      <ReactNativeModal
        isVisible={isNameModalVisible}
        onBackdropPress={() => {
          if (firstName.trim() && lastName.trim()) setNameModalVisible(false);
        }}
        onBackButtonPress={() => {
          if (firstName.trim() && lastName.trim()) setNameModalVisible(false);
        }}
        backdropOpacity={1}
        backdropColor={COLORS.modalOverlay}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: COLORS.modalBackground,
            borderRadius: 16,
            padding: 24,
            width: "90%",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              marginBottom: 20,
              textAlign: "center",
              color: COLORS.title,
            }}
          >
            Tell us your name
          </Text>

          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#999"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: COLORS.buttonPrimary,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 14,
              fontSize: 16,
              backgroundColor: COLORS.background,
              color: "#333",
            }}
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#999"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: COLORS.buttonPrimary,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 20,
              fontSize: 16,
              backgroundColor: COLORS.background,
              color: "#333",
            }}
          />

          <TouchableOpacity
            onPress={handleSaveName}
            style={{
              backgroundColor: COLORS.title,
              paddingVertical: 12,
              paddingHorizontal: 28,
              borderRadius: 10,
              alignItems: "center",
              width: "60%",
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                color: "#fff",
                textTransform: "uppercase",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 10,
            paddingHorizontal: 20,
          }}
        >
          {/* Skeleton Emotion Box */}
          <View
            style={{
              width: 300,
              height: 350,
              backgroundColor: "#e0e0e0",
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: "80%",
                height: 25,
                backgroundColor: "#d0d0d0",
                borderRadius: 6,
                marginBottom: 16,
              }}
            />
            <View
              style={{
                width: "60%",
                height: 20,
                backgroundColor: "#d0d0d0",
                borderRadius: 6,
                marginBottom: 24,
              }}
            />
            <View
              style={{
                width: 250,
                height: 120,
                backgroundColor: "#ccc",
                borderRadius: 10,
              }}
            />
          </View>

          {/* Spinner and Text */}
          <ActivityIndicator size="small" color="#000" />
          <Text style={{ color: "#333", marginTop: 10, fontWeight: "600" }}>
            Processing...
          </Text>
        </View>
      )}
      {/* Header Section */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: "#006A71", // Dark Teal
            textAlign: "center", // Keeps the text centered within its container
            textTransform: "capitalize", // Ensures first letter is always uppercase
            flex: 1, // Takes up available space in the row to allow centering
          }}
        >
          Welcome, {firstName || "Project EYES"}{" "}
          {/* Fallback to "Project EYES" if firstName is not available */}
        </Text>
      </View>

      <ReactNativeModal
        isVisible={feedbackModalVisible}
        onBackdropPress={() => setFeedbackModalVisible(false)}
        backdropOpacity={0.7}
        backdropColor="rgba(0,0,0,0.5)"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "#F2EFE7",
            padding: 24,
            borderRadius: 16,
            width: "85%",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 12,
              color: feedbackTitle === "Error" ? "#B00020" : "#006A71",
            }}
          >
            {feedbackTitle}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#333",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {feedbackMessage}
          </Text>
          <TouchableOpacity
            onPress={() => setFeedbackModalVisible(false)}
            style={{
              backgroundColor: "#48A6A7",
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>

      {/* Scanner Section */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginVertical: 48,
        }}
      >
        {role === "parent" ? (
          <View
            style={{
              alignItems: "center",
              marginTop: -60,
            }}
          >
            {emotion ? (
              <>
                <View
                  style={{
                    marginBottom: 100,
                    height: 420,
                    width: 300,
                    backgroundColor: emotionStyles[emotion].rectangleColor,
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    marginTop: 20,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{
                      backgroundColor:
                        emotionStyles[emotion || "Neutral"].rectangleColor,
                      paddingHorizontal: 20,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: "#fff",
                      marginBottom: 5,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      Emotion History
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      fontSize: 30,
                      fontWeight: "900",
                      color: emotionStyles[emotion].textColor,
                      textAlign: "center",
                      marginBottom: 5,
                      paddingHorizontal: 12,
                    }}
                  >
                    How is your child feeling today?
                  </Text>
                  <Text
                    style={{
                      fontSize: 30,
                      marginTop: 8,
                      marginBottom: 8,
                      fontWeight: "400",
                      color: emotionStyles[emotion].textColor,
                    }}
                  >
                    {emotion}
                  </Text>

                  <Animated.Image
                    source={emotionsMap[emotion][frameIndex]}
                    style={{
                      resizeMode: "contain",
                      width: 420,
                      height: 240,
                      opacity: animation.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [0.8, 1, 0.8],
                      }),
                      transform: [
                        {
                          scale: animation.interpolate({
                            inputRange: [0, 1, 2],
                            outputRange: [1, 1.05, 1],
                          }),
                        },
                      ],
                    }}
                  />
                </View>

                {(childName || emotionConfidence) && (
                  <View
                    style={{
                      marginTop: -70,
                      backgroundColor: "#fff",
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 50,
                      borderWidth: 2,
                      borderColor:
                        emotionStyles[emotion]?.rectangleColor || "#ccc",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                      alignItems: "center",
                    }}
                  >
                    {childName && (
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: emotionStyles[emotion]?.textColor || "#333",
                        }}
                      >
                        Child’s Name: {childName}
                      </Text>
                    )}
                    {emotionConfidence !== null && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#555",
                          marginTop: 4,
                        }}
                      >
                        Confidence: {emotionConfidence}%
                      </Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              <>
                <View
                  style={{
                    marginBottom: 100,
                    height: 350,
                    width: 300,
                    backgroundColor: "#f3f4f6",
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#444",
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                  >
                    No Emotion Detected Yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#777",
                      textAlign: "center",
                      marginBottom: 20,
                      paddingHorizontal: 12,
                    }}
                  >
                    Let’s try scanning to see how your child feels today.
                  </Text>

                  <Image
                    source={images.face}
                    style={{
                      width: 180,
                      height: 180,
                      resizeMode: "contain",
                      opacity: 0.5,
                    }}
                  />
                </View>

                {childName && (
                  <View
                    style={{
                      marginTop: -70,
                      backgroundColor: "#fff",
                      paddingVertical: 10,
                      paddingHorizontal: 24,
                      borderRadius: 50,
                      borderWidth: 2,
                      borderColor: "#ccc",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#333",
                      }}
                    >
                      Child’s Name: {childName}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        ) : role === "teacher" ? (
          <View style={{ width: "100%", flex: 1 }}>
            {/* 🔍 Search Bar - Fixed position */}
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.trim() === "") {
                  setFilteredStudents(students);
                } else {
                  const filtered = students.filter((student) =>
                    student.childName
                      .toLowerCase()
                      .includes(text.toLowerCase()),
                  );
                  setFilteredStudents(filtered);
                }
              }}
              placeholder="Search student by name..."
              className="mb-4 p-3 bg-gray-100 rounded-xl text-base"
              placeholderTextColor="#666"
              style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                fontSize: 16,
                position: "absolute", // Fix the position of the search bar
                top: -20, // Distance from the top
                left: 0,
                right: 0,
                zIndex: 10, // Ensure the search bar stays on top of other elements
                marginHorizontal: 20, // Optional: Adjust the left and right margins
              }}
            />

            {/* 📊 Emotion Summary */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 16,
                marginTop: 40,
                // Note: 'gap' needs manual spacing on children
              }}
            >
              {["Happy", "Neutral", "Sad", "Angry", "Surprised"].map((emo) => {
                const count = students.filter(
                  (s) => s.latestEmotion === emo,
                ).length;
                if (count === 0) return null;

                return (
                  <View
                    key={emo}
                    style={{
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor:
                        emotionStyles[emo as Emotion]?.rectangleColor || "#ccc",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {emo}: {count}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 👨‍🏫 Student Cards - Make it scrollable */}
            <ScrollView style={{ marginTop: 20, paddingBottom: 100 }}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => {
                  const knownEmotions: Emotion[] = [
                    "Happy",
                    "Sad",
                    "Neutral",
                    "Angry",
                    "Surprised",
                  ];
                  const hasEmotion = knownEmotions.includes(
                    student.latestEmotion,
                  );
                  const emotion = hasEmotion
                    ? (student.latestEmotion as Emotion)
                    : null;

                  const rectangleColor = emotion
                    ? emotionStyles[emotion]?.rectangleColor || "#888"
                    : "#000"; // Default color for no emotion

                  const textColor = emotion
                    ? emotionStyles[emotion]?.textColor || "#333"
                    : "#333"; // Default text color for no emotion

                  const profileImage = emotion
                    ? emotionsMap[emotion][0]
                    : images.face; // Fallback image when no emotion

                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: "#fff",
                        borderLeftWidth: 6,
                        borderLeftColor: rectangleColor,
                        padding: 16,
                        marginBottom: 16,
                        borderRadius: 12,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={profileImage}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          marginRight: 16,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: textColor,
                          }}
                        >
                          {student.childName}
                        </Text>
                        <Text style={{ fontSize: 14, color: textColor }}>
                          {emotion || "No emotion yet"}
                        </Text>
                        {student.time ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#999",
                              marginTop: 4,
                            }}
                          >
                            Last updated:{" "}
                            {new Date(student.time).toLocaleString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        ) : (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#aaa",
                              marginTop: 4,
                              fontStyle: "italic",
                            }}
                          >
                            No history yet
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedStudentId(student.parentId);
                          setModalVisible(true); // Show the modal with the student's emotion history
                        }}
                        style={{
                          backgroundColor: rectangleColor,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: 12,
                          }}
                        >
                          View History
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <Text style={{ textAlign: "center", color: "#6b7280" }}>
                  No student data available.
                </Text>
              )}
            </ScrollView>
          </View>
        ) : (
          <Image
            source={images.face}
            style={{
              width: 144,
              height: 144,
              marginBottom: 80,
            }}
          />
        )}
      </View>

      <ReactNativeModal
        isVisible={isNameModalVisible}
        onBackdropPress={() => {
          if (firstName.trim() && lastName.trim()) setNameModalVisible(false);
        }}
        onBackButtonPress={() => {
          if (firstName.trim() && lastName.trim()) setNameModalVisible(false);
        }}
        backdropOpacity={1}
        backdropColor="rgba(0,0,0,0.5)" // modalOverlay
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "#F2EFE7", // modalBackground / background
            borderRadius: 16,
            padding: 24,
            width: "90%",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              marginBottom: 20,
              textAlign: "center",
              color: "#006A71", // title
            }}
          >
            Tell us your name
          </Text>

          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#858585" // subtitle
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#48A6A7", // button
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 14,
              fontSize: 16,
              backgroundColor: "#FFFFFF",
              color: "#006A71", // title text
            }}
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#858585"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#48A6A7",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 20,
              fontSize: 16,
              backgroundColor: "#FFFFFF",
              color: "#006A71",
            }}
          />

          <TouchableOpacity
            onPress={handleSaveName}
            style={{
              backgroundColor: "#006A71",
              paddingVertical: 12,
              paddingHorizontal: 28,
              borderRadius: 10,
              alignItems: "center",
              width: "60%",
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                color: "#FFFFFF",
                textTransform: "uppercase",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>

      {/* History Modal */}
      <ReactNativeModal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            width: "90%",
            maxHeight: "80%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 10,
              backgroundColor: "#f0f0f0",
              borderRadius: 20,
              padding: 5,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#666" }}>
              ✕
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 16,
              textAlign: "center",
              color: "#333",
            }}
          >
            Emotion History
          </Text>
          {history.length > 0 ? (
            <FlatList
              data={history}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor:
                      emotionStyles[item.emotion]?.backgroundColor || "#f0f0f0",
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <Image
                    source={emotionsMap[item.emotion][0]} // Use the first image for the emotion
                    style={{ width: 40, height: 40, marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: emotionStyles[item.emotion]?.textColor || "#000",
                      }}
                    >
                      {item.emotion}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: emotionStyles[item.emotion]?.textColor || "#666",
                        opacity: 0.8,
                        marginTop: 2,
                      }}
                    >
                      {new Date(item.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={{ fontSize: 16, textAlign: "center", color: "#888" }}>
              No history available
            </Text>
          )}
        </View>
      </ReactNativeModal>

      <ReactNativeModal
        isVisible={isStudentPickerVisible}
        onBackdropPress={() => setStudentPickerVisible(false)}
      >
        <View
          style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20 }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Select a student
          </Text>
          {students.map((student, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSelectedStudentId(student.parentId); // Store parentId
                setModalVisible(true);
                setStudentPickerVisible(false);
              }}
              style={{
                padding: 12,
                backgroundColor: "#f0f0f0",
                marginBottom: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 16 }}>{student.childName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Home;

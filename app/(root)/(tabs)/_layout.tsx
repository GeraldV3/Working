import React, { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  Platform,
} from "react-native";
import { icons } from "@/constants";
import { getDatabase, ref, onValue, set, get } from "firebase/database";
import { useUser } from "@clerk/clerk-expo";
import { Emotion, emotionStyles, emotionsMap } from "@lib/emotionConfig";
import axios from "axios";
import * as Notifications from "expo-notifications";

const COLORS = {
  active: "#006A71",
  inactive: "#9CA3AF",
  background: "#FFFFFF",
  ripple: "rgba(72, 166, 167, 0.15)",
  floating: "#48A6A7",
  alertBackground: "#FFFFFF",
  alertOverlay: "rgba(0,0,0,0.3)",
  alertText: "#1F2937",
};

type AlertEntry = {
  alert: string;
  type: Emotion;
  suggestion?: string;
  seen?: boolean;
  childName?: string;
  [key: string]: any;
};

type TabIconProps = {
  source: any;
  focused: boolean;
  showDot?: boolean;
  unreadCount?: number; // NEW
};

const TabIcon = ({
  source,
  focused,
  showDot = false,
  unreadCount = 0,
}: TabIconProps) => (
  <View style={styles.tabItem}>
    <View
      style={[
        styles.iconWrapper,
        { backgroundColor: focused ? COLORS.ripple : "transparent" },
      ]}
    >
      <Image
        source={source}
        style={[
          styles.icon,
          { tintColor: focused ? COLORS.active : COLORS.inactive },
        ]}
        resizeMode="contain"
      />
      {/* 🔴 Show either dot or count */}
      {showDot && unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  </View>
);

export default function Layout() {
  const router = useRouter();
  const { user } = useUser();
  const [hasNewChat, setHasNewChat] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [latestAlert, setLatestAlert] = useState<string>("");
  const [latestSuggestion, setLatestSuggestion] = useState<string>("");
  const [latestEmotion, setLatestEmotion] = useState<Emotion | "">("");
  const [unreadCount, setUnreadCount] = useState(0); // NEW

  useEffect(() => {
    if (!user?.id) return;

    const db = getDatabase();
    const chatRef = ref(db, "Chats");

    const chatUnsub = onValue(chatRef, (snap) => {
      let count = 0;

      if (snap.exists()) {
        const chatRooms = snap.val();

        for (const roomId in chatRooms) {
          const messages = Object.values(chatRooms[roomId]);

          if (messages.length === 0) continue;

          messages.forEach((message: any) => {
            if (message.seen === false && message.senderId !== user.id) {
              count += 1;
            }
          });
        }
      }

      setHasNewChat(count > 0);
      setUnreadCount(count); // NEW
    });

    return () => chatUnsub();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const db = getDatabase();
    const unsubscribes: (() => void)[] = [];

    // 🔍 Determine if user is teacher or parent based on path existence
    get(ref(db, `Users/Teachers/TeacherId/${user.id}`)).then((snap) => {
      const isTeacher = snap.exists();

      const handleNewAlert = async (
        parentId: string,
        alertKey: string,
        alertData: AlertEntry,
      ) => {
        const seenField = isTeacher ? "seenTeacher" : "seenParent";
        if (!alertData.alert || !alertData.type || alertData[seenField]) return;

        console.log("📥 New alert detected:", alertData.alert);

        setLatestAlert(alertData.alert);
        setLatestSuggestion(alertData.suggestion || "");
        setLatestEmotion(alertData.type);
        setShowAlertModal(true);

        // ✅ Mark as seen
        await set(
          ref(
            db,
            `Users/Teachers/Class-A/Alerts/${parentId}/${alertKey}/${seenField}`,
          ),
          true,
        );

        const tokenPath = isTeacher
          ? `Users/Teachers/TeacherId/${user.id}/fcmToken`
          : `Users/Teachers/Class-A/Parents/${user.id}/fcmToken`;

        try {
          const tokenSnap = await get(ref(db, tokenPath));
          const expoPushToken = tokenSnap.exists() ? tokenSnap.val() : null;

          if (expoPushToken) {
            await axios.post("https://exp.host/--/api/v2/push/send", {
              to: expoPushToken,
              sound: "default",
              title: isTeacher
                ? "New Emotion Alert 🧠"
                : "Your Child's Emotion Alert",
              body: `${alertData.childName || "Student"}: ${alertData.alert}`,
              priority: "high",
              badge: 1,
              data: {
                emotion: alertData.type,
                suggestion: alertData.suggestion || "",
                parentId,
                alertId: alertKey,
              },
            });

            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Emotion Alert!",
                body: alertData.alert,
                sound: "default",
                androidChannelId: "emotion-alerts",
                color: "#48A6A7",
              } as any,
              trigger: null,
            });

            console.log("✅ Push sent to", isTeacher ? "teacher" : "parent");
          } else {
            console.warn("⚠️ No Expo token found");
          }
        } catch (error) {
          console.error("❌ Push notification error:", error);
        }
      };

      if (isTeacher) {
        const teacherAlertsRef = ref(db, `Users/Teachers/Class-A/Alerts`);
        const teacherUnsub = onValue(teacherAlertsRef, (snap) => {
          if (!snap.exists()) return;
          const allAlerts = snap.val();

          for (const [parentId, alerts] of Object.entries(allAlerts)) {
            if (alerts && typeof alerts === "object") {
              const entries = Object.entries(alerts);
              const lastEntry = entries[entries.length - 1];
              if (!lastEntry) continue;

              const [alertKey, alertValue] = lastEntry;
              handleNewAlert(parentId, alertKey, alertValue as AlertEntry);
            }
          }
        });
        unsubscribes.push(teacherUnsub);
      } else {
        const parentAlertsRef = ref(
          db,
          `Users/Teachers/Class-A/Alerts/${user.id}`,
        );
        const parentUnsub = onValue(parentAlertsRef, (snap) => {
          if (!snap.exists()) return;
          const entries = Object.entries(snap.val());
          const lastEntry = entries[entries.length - 1];
          if (!lastEntry) return;

          const [alertKey, alertValue] = lastEntry;
          handleNewAlert(user.id, alertKey, alertValue as AlertEntry);
        });
        unsubscribes.push(parentUnsub);
      }
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.id, latestAlert]);

  useEffect(() => {
    if (!user?.id) return;

    async function registerForPushNotificationsAsync() {
      let token;

      if (Platform.OS === "ios") {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.warn("Failed to get push token permissions!");
          return;
        }
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Expo Push Token:", token);
      } catch (e) {
        console.error("Error getting push token:", e);
        return;
      }

      const db = getDatabase();
      const teacherSnap = await get(
        ref(db, `Users/Teachers/TeacherId/${user?.id}`),
      );
      const isTeacher = teacherSnap.exists();

      const tokenPath = isTeacher
        ? `Users/Teachers/TeacherId/${user?.id}/fcmToken`
        : `Users/Teachers/Class-A/Parents/${user?.id}/fcmToken`;

      await set(ref(db, tokenPath), token);
      console.log("Saved push token to", tokenPath);
    }

    registerForPushNotificationsAsync().catch(console.error);
  }, [user?.id]);

  return (
    <>
      <Tabs
        initialRouteName="home"
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBarStyle,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon focused={focused} source={icons.home} />
            ),
          }}
        />
        <Tabs.Screen
          name="graph"
          options={{
            title: "Graph",
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon focused={focused} source={icons.graph} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon
                focused={focused}
                source={icons.chat}
                showDot={hasNewChat}
                unreadCount={unreadCount} // ✅ pass it here
              />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon focused={focused} source={icons.profile} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Insights Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/(chat)/insights")}
      >
        <Image source={icons.bot} style={styles.floatingIcon} />
      </TouchableOpacity>

      {/* 🔔 Modal for emotion alerts */}
      <Modal
        visible={showAlertModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  latestEmotion &&
                  emotionStyles[latestEmotion]?.backgroundColor,
                borderLeftWidth: 6,
                borderLeftColor:
                  latestEmotion && emotionStyles[latestEmotion]?.rectangleColor,
              },
            ]}
          >
            {/* 🚨 Icon */}
            <Image
              source={icons.alert}
              style={{
                width: 42,
                height: 42,
                marginBottom: 10,
              }}
            />

            {/* 🔔 Title */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                marginBottom: 6,
                color: latestEmotion && emotionStyles[latestEmotion]?.textColor,
              }}
            >
              Emotion Alert
            </Text>

            {/* 😢 Emotion Image */}
            {latestEmotion && (
              <Image
                source={emotionsMap[latestEmotion][0]}
                style={{ width: 60, height: 60, marginBottom: 10 }}
              />
            )}

            {/* 🔤 Alert Message */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 10,
                color: latestEmotion && emotionStyles[latestEmotion]?.textColor,
              }}
            >
              {latestAlert}
            </Text>

            {/* 💡 Suggestion */}
            {latestSuggestion !== "" && (
              <Text
                style={{
                  fontSize: 14,
                  marginTop: 6,
                  color: latestEmotion
                    ? emotionStyles[latestEmotion]?.textColor
                    : COLORS.alertText,
                  backgroundColor: latestEmotion
                    ? `${emotionStyles[latestEmotion]?.rectangleColor}20`
                    : COLORS.alertBackground,
                  padding: 10,
                  borderRadius: 8,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                💡 Suggestion: {latestSuggestion}
              </Text>
            )}

            {/* 🔘 Dismiss */}
            <TouchableOpacity
              style={[
                styles.dismissButton,
                {
                  backgroundColor:
                    latestEmotion &&
                    emotionStyles[latestEmotion]?.rectangleColor,
                  marginTop: 20,
                  width: "100%",
                },
              ]}
              onPress={() => setShowAlertModal(false)}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: COLORS.background,
    height: 60,
    borderTopWidth: 0.6,
    borderTopColor: "#D1D5DB",
    position: "absolute",
    bottom: 0,
    width: "100%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginBottom: -20,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 26,
    height: 26,
  },
  redDot: {
    width: 10,
    height: 10,
    backgroundColor: "#EF4444",
    borderRadius: 5,
    position: "absolute",
    top: 4,
    right: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  floatingButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 58,
    height: 58,
    backgroundColor: COLORS.floating,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  floatingIcon: {
    width: 28,
    height: 28,
    tintColor: "#FFFFFF",
  },

  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    zIndex: 10,
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.alertOverlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.alertText,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.alertText,
  },
  dismissButton: {
    backgroundColor: COLORS.floating,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
});

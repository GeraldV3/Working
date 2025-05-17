import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";
import { useRouter } from "expo-router";
import {
  getDatabase,
  ref,
  onValue,
  get,
  remove,
  update,
} from "firebase/database";
import { useUser } from "@clerk/clerk-expo";

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
  lastTimestamp: number;
};

const ChatList = () => {
  const { user } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<"teacher" | "parent" | null>(null);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const db = getDatabase();
    const fetchRole = async () => {
      try {
        const teacherSnap = await get(
          ref(db, `Users/Teachers/TeacherId/${user.id}`),
        );
        if (teacherSnap.exists()) {
          setRole("teacher");
        } else {
          const parentSnap = await get(
            ref(db, `Users/Teachers/Class-A/Parents/${user.id}`),
          );
          if (parentSnap.exists()) {
            setRole("parent");
          } else {
            setRole(null); // Default null if no role found
          }
        }
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole(null);
      }
    };

    fetchRole();
  }, [user]);

  useEffect(() => {
    if (!user?.id || role !== "parent") return;

    const fetchChats = async () => {
      const db = getDatabase();
      setLoading(true);

      try {
        const teacherSnap = await get(ref(db, `Users/Teachers/TeacherId`));
        const teachers = teacherSnap.val();

        if (!teachers || typeof teachers !== "object") {
          setChatList([]);
          setLoading(false);
          return;
        }

        const chatListData: ChatItem[] = await Promise.all(
          Object.entries(teachers).map(
            async ([teacherId, teacherData]: any) => {
              const chatId = `${teacherId}_${user.id}`;
              const msgSnap = await get(ref(db, `Chats/${chatId}`));
              const messages = msgSnap.val() as Record<
                string,
                {
                  message: string;
                  timestamp: number;
                  senderId: string;
                  seen: boolean;
                }
              > | null;

              let lastMessage = "";
              let lastTimestamp = 0;
              let unreadCount = 0;

              if (messages) {
                const sorted = Object.values(messages).sort(
                  (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0),
                );

                lastMessage = sorted[0]?.message ?? "";
                lastTimestamp = sorted[0]?.timestamp ?? 0;
                unreadCount = sorted.filter(
                  (msg) => msg.senderId !== user.id && msg.seen === false,
                ).length;
              }

              return {
                id: teacherId,
                name: teacherData?.firstName
                  ? `${teacherData.firstName} ${teacherData.lastName}`
                  : "Teacher",
                lastMessage,
                unreadCount,
                lastTimestamp,
              };
            },
          ),
        );

        setChatList(
          chatListData.sort((a, b) => b.lastTimestamp - a.lastTimestamp),
        );
      } catch (err) {
        console.error("Error loading teachers for parent chat list:", err);
        setChatList([]);
      } finally {
        setLoading(false);
      }
    };

    // 🔑 Call the async function inside useEffect
    fetchChats();
  }, [role, user]);

  useEffect(() => {
    if (!user?.id || !role) return;
    const db = getDatabase();

    setLoading(true); // Start loading

    if (role === "teacher") {
      const parentRef = ref(db, `Users/Teachers/Class-A/Parents`);
      onValue(parentRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setChatList([]);
          setLoading(false);
          return;
        }

        const list: ChatItem[] = await Promise.all(
          Object.entries(data).map(async ([parentId, val]: any) => {
            const chatId = `${user.id}_${parentId}`;
            const messagesRef = ref(db, `Chats/${chatId}`);
            const msgSnap = await get(messagesRef);
            const messages = msgSnap.val();

            let lastMessageText = "";
            let lastTimestamp = 0;
            let unreadCount = 0;

            if (messages) {
              const sorted = Object.values(
                messages as Record<string, any>,
              ).sort((a, b) => b.timestamp - a.timestamp) as {
                message: string;
                timestamp: number;
              }[];

              lastMessageText = sorted[0]?.message || "";
              lastTimestamp = sorted[0]?.timestamp || 0;

              unreadCount = sorted.filter(
                (msg: any) => msg.senderId !== user.id && msg.seen === false,
              ).length;
            }

            return {
              id: parentId,
              name: val?.childName || "Unnamed",
              lastMessage: lastMessageText,
              unreadCount,
              lastTimestamp,
            };
          }),
        );

        const sortedByTime = list.sort(
          (a, b) => b.lastTimestamp - a.lastTimestamp,
        );
        setChatList(sortedByTime);
        setLoading(false);
      });
    }

    if (role === "parent") {
      const fetchChats = async () => {
        const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${user.id}`);
        const parentSnap = await get(parentRef);
        const parentData = parentSnap.val();

        const assignedTeachers: string[] = parentData?.assignedTeachers || [];

        if (!Array.isArray(assignedTeachers) || assignedTeachers.length === 0) {
          setChatList([]);
          setLoading(false);
          return;
        }

        const chatPromises = assignedTeachers.map(async (teacherId) => {
          const teacherSnap = await get(
            ref(db, `Users/Teachers/TeacherId/${teacherId}`),
          );
          const teacher = teacherSnap.val();

          const chatId = `${teacherId}_${user.id}`;
          const msgSnap = await get(ref(db, `Chats/${chatId}`));
          const messages = msgSnap.val() as Record<
            string,
            { message: string; timestamp: number }
          > | null;

          let lastMessage = "";
          let lastTimestamp = 0;

          if (messages) {
            const sorted = Object.values(messages).sort(
              (a, b) => b.timestamp - a.timestamp,
            );
            lastMessage = sorted[0]?.message || "";
            lastTimestamp = sorted[0]?.timestamp || 0;
          }

          return {
            id: teacherId,
            name: teacher?.firstName
              ? `${teacher.firstName} ${teacher.lastName}`
              : "Teacher",
            lastMessage,
            unreadCount: 0,
            lastTimestamp,
          };
        });

        const results = await Promise.all(chatPromises);
        setChatList(results.sort((a, b) => b.lastTimestamp - a.lastTimestamp));
        setLoading(false);
      };

      fetchChats();
    }
  }, [role, user]);

  const handleOpenChat = async (otherId: string) => {
    if (!user?.id || !role) return;

    const chatId =
      role === "teacher" ? `${user.id}_${otherId}` : `${otherId}_${user.id}`;

    const db = getDatabase();
    const messagesRef = ref(db, `Chats/${chatId}`);

    // Mark messages as seen
    onValue(
      messagesRef,
      async (snapshot) => {
        const messages = snapshot.val();
        if (messages) {
          const updates: Record<string, boolean> = {};

          Object.entries(messages).forEach(([key, msg]: any) => {
            if (msg.senderId !== user.id && msg.seen === false) {
              updates[`Chats/${chatId}/${key}/seen`] = true;
            }
          });

          if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
          }

          // ✅ Re-fetch updated chat list based on role
          if (role === "parent") {
            const teacherListSnap = await get(
              ref(db, `Users/Teachers/TeacherId`),
            );
            const teacherList = teacherListSnap.val();

            const list: ChatItem[] = await Promise.all(
              Object.entries(teacherList).map(
                async ([teacherId, teacherData]: any) => {
                  const chatId = `${teacherId}_${user.id}`;
                  const messagesRef = ref(db, `Chats/${chatId}`);
                  const msgSnap = await get(messagesRef);
                  const messages = msgSnap.val();

                  let lastMessageText = "";
                  let lastTimestamp = 0;

                  if (messages) {
                    const sorted = Object.values(
                      messages as Record<string, any>,
                    ).sort((a, b) => b.timestamp - a.timestamp) as {
                      message: string;
                      timestamp: number;
                    }[];

                    lastMessageText = sorted[0]?.message || "";
                    lastTimestamp = sorted[0]?.timestamp || 0;
                  }

                  return {
                    id: teacherId,
                    name: teacherData?.firstName
                      ? `${teacherData.firstName} ${teacherData.lastName}`
                      : "Teacher",
                    lastMessage: lastMessageText,
                    unreadCount: Object.values(messages).filter(
                      (msg: any) =>
                        msg.senderId !== user.id && msg.seen === false,
                    ).length,
                    lastTimestamp,
                  };
                },
              ),
            );

            const sortedByTime = list.sort(
              (a, b) => b.lastTimestamp - a.lastTimestamp,
            );
            setChatList(sortedByTime);
          } else if (role === "teacher") {
            const parentSnap = await get(
              ref(db, `Users/Teachers/Class-A/Parents`),
            );
            const parentList = parentSnap.val();

            const list: ChatItem[] = await Promise.all(
              Object.entries(parentList).map(async ([parentId, val]: any) => {
                const chatId = `${user.id}_${parentId}`;
                const messagesRef = ref(db, `Chats/${chatId}`);
                const msgSnap = await get(messagesRef);
                const messages = msgSnap.val();

                let lastMessageText = "";
                let lastTimestamp = 0;

                if (messages) {
                  const sorted = Object.values(
                    messages as Record<string, any>,
                  ).sort((a, b) => b.timestamp - a.timestamp) as {
                    message: string;
                    timestamp: number;
                  }[];

                  lastMessageText = sorted[0]?.message || "";
                  lastTimestamp = sorted[0]?.timestamp || 0;
                }

                return {
                  id: parentId,
                  name: val?.childName || "Unnamed",
                  lastMessage: lastMessageText,
                  unreadCount: Object.values(messages).filter(
                    (msg: any) =>
                      msg.senderId !== user.id && msg.seen === false,
                  ).length,
                  lastTimestamp,
                };
              }),
            );

            const sortedByTime = list.sort(
              (a, b) => b.lastTimestamp - a.lastTimestamp,
            );
            setChatList(sortedByTime);
          }
        }
      },
      { onlyOnce: true },
    );

    // ✅ Navigate to chat screen
    router.push({
      pathname: "/(chat)/[chatId]" as any,
      params: { chatId },
    });
  };

  const handleArchive = async (chatId: string) => {
    Alert.alert("Delete Chat", "Are you sure you want to delete this chat?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const db = getDatabase();
          await remove(ref(db, `Chats/${chatId}`));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenChat(item.id)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        {item.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        ) : null}
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHiddenItem = (data: { item: ChatItem }) => {
    const chatId =
      role === "teacher"
        ? `${user?.id}_${data.item.id}`
        : `${data.item.id}_${user?.id}`;
    return (
      <TouchableOpacity
        style={styles.rowBack}
        onPress={() => handleArchive(chatId)}
      >
        <Text style={styles.archiveText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {role === "teacher" ? "Chat with Parents" : "Chat with Teacher"}
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#006A71" />
      ) : (
        <SwipeListView
          data={chatList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-80}
          disableRightSwipe
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 25,
    paddingHorizontal: 15,
    paddingBottom: 60,
    backgroundColor: "#F2EFE7", // Light Beige
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#006A71", // Dark Teal
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12, // Rounded corners for the card
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1, // Lighter shadow for a cleaner look
    shadowRadius: 10,
    elevation: 3, // Slight elevation for subtle 3D effect
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#9ACBD0", // Soft Blue
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2, // Adding a border around the avatar
    borderColor: "#006A71", // Dark teal color for the border
  },
  avatarText: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#FFFFFF", // White text for contrast
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827", // Dark color
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280", // Light gray
  },
  unreadBadge: {
    backgroundColor: "#EF4444", // Red
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#F87171", // Red for the archive action
    flex: 1,
    justifyContent: "center",
    paddingRight: 24,
    borderRadius: 12, // Rounded corners for the archive action button
    marginBottom: 16,
  },
  archiveText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ChatList;

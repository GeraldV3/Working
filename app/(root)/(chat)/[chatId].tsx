import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { getDatabase, ref, onValue, push, update } from "firebase/database";
import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as Notifications from "expo-notifications";

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${hour12}:${paddedMinutes} ${ampm}`;
};

const emojiOptions = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const MessageScreen = () => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useUser();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeReactionPicker, setActiveReactionPicker] = useState<
    string | null
  >(null);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Chat",
      headerStyle: { backgroundColor: "#0f172a" },
      headerTitleStyle: { color: "#fff", fontWeight: "600" },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  useEffect(() => {
    if (!chatId) return;
    const db = getDatabase();
    const chatRef = ref(db, `Chats/${chatId}`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const messageList = Object.entries(data)
        .map(([id, value]: any) => ({ id, ...value }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setMessages(messageList);
      setLoading(false);

      messageList.forEach((msg) => {
        if (msg.senderId !== user?.id && msg.seen === false) {
          const msgRef = ref(db, `Chats/${chatId}/${msg.id}`);
          update(msgRef, { seen: true });

          Notifications.scheduleNotificationAsync({
            content: {
              title: "New Message",
              body: msg.text,
              sound: "default",
            },
            trigger: null,
          });
        }
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    inputRef.current?.focus();

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const db = getDatabase();
    const chatRef = ref(db, `Chats/${chatId}`);

    const newMessage = {
      text: text.trim(),
      senderId: user?.id,
      timestamp: Date.now(),
      seen: false,
      reaction: null,
    };

    await push(chatRef, newMessage);
    setText("");
  };

  const handleReact = (
    messageId: string,
    selectedEmoji: string,
    currentEmoji: string | null,
  ) => {
    const db = getDatabase();
    const msgRef = ref(db, `Chats/${chatId}/${messageId}`);
    const newReaction = selectedEmoji === currentEmoji ? null : selectedEmoji;
    update(msgRef, { reaction: newReaction });
    setActiveReactionPicker(null);
  };

  const renderMessage = ({ item }: any) => {
    const isCurrentUser = item.senderId === user?.id;
    const showReactionPicker = activeReactionPicker === item.id;

    return (
      <View
        style={[
          styles.messageWrapper,
          { alignItems: isCurrentUser ? "flex-end" : "flex-start" },
        ]}
      >
        <TouchableOpacity
          onLongPress={() =>
            setActiveReactionPicker((prev) =>
              prev === item.id ? null : item.id,
            )
          }
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.bubbleWrapper,
              isCurrentUser && { alignSelf: "flex-end" },
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isCurrentUser ? styles.sentBubble : styles.receivedBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: isCurrentUser ? "#fff" : "#111827" },
                ]}
              >
                {item.text}
              </Text>
            </View>

            {item.reaction && <AnimatedReaction emoji={item.reaction} />}
          </View>
        </TouchableOpacity>

        {showReactionPicker && (
          <View style={styles.emojiPicker}>
            {emojiOptions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReact(item.id, emoji, item.reaction)}
              >
                <Text style={styles.emojiOption}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.timeText}>
          {formatTime(item.timestamp)}
          {isCurrentUser && item.seen && " · Seen"}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#006A71"
          style={{ marginTop: 20 }}
        />
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.startText}>Start the conversation ✨</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          placeholder="Type a message..."
          value={text}
          onChangeText={setText}
          style={styles.input}
          placeholderTextColor="#94a3b8"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          multiline
          numberOfLines={1}
          maxLength={500}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const AnimatedReaction = ({ emoji }: { emoji: string }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]); // ✅ included dependencies

  return (
    <Animated.View
      style={[
        styles.reactionAbsolute,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.reactionText}>{emoji}</Text>
    </Animated.View>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2EFE7",
  },
  chatContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  messageWrapper: {
    marginVertical: 6,
  },
  bubbleWrapper: {
    position: "relative",
    marginBottom: 8,
    maxWidth: "80%",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: "#006A71",
  },
  receivedBubble: {
    backgroundColor: "#9ACBD0",
  },
  messageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  reactionAbsolute: {
    position: "absolute",
    right: -10,
    bottom: -10,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 3,
  },
  reactionText: {
    fontSize: 14,
  },
  emojiPicker: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  emojiOption: {
    fontSize: 20,
    marginHorizontal: 6,
  },
  timeText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#111827",
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: "#006A71",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100, // keeps space above input
  },
  startText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 16,
  },
});

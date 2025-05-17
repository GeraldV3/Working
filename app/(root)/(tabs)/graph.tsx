import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getDatabase, ref, onValue, get } from "firebase/database";
import { useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { Emotion, emotionStyles } from "@lib/emotionConfig";

const screenWidth = Dimensions.get("window").width;

const brightEmotionColors: Record<Emotion, string> = {
  Angry: emotionStyles.Angry.rectangleColor,
  Happy: emotionStyles.Happy.rectangleColor,
  Neutral: emotionStyles.Neutral.rectangleColor,
  Sad: emotionStyles.Sad.rectangleColor,
  Surprised: emotionStyles.Surprised.rectangleColor,
};

interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor: string;
  };
}

const GraphScreen = () => {
  const { user } = useUser();
  const userId = user?.id;
  const [role, setRole] = useState<"parent" | "teacher" | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<{
    [parentId: string]: {
      childName: string;
      records: { emotion: Emotion; timestamp: Date }[];
    };
  }>({});
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmotionHistory, setFilteredEmotionHistory] =
    useState(emotionHistory);

  useEffect(() => {
    if (!userId) return;

    const fetchRole = async () => {
      const db = getDatabase();
      const teacherRef = ref(db, `Users/Teachers/TeacherId/${userId}`);
      const teacherSnap = await get(teacherRef);
      if (teacherSnap.exists()) {
        setRole("teacher");
        return;
      }

      const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${userId}`);
      const parentSnap = await get(parentRef);
      if (parentSnap.exists()) {
        setRole("parent");
        return;
      }

      setRole(null);
    };

    fetchRole();
  }, [userId]);

  useEffect(() => {
    if (!role || !userId) return;
    const db = getDatabase();

    if (role === "parent") {
      const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${userId}`);
      onValue(parentRef, (snap) => {
        const data = snap.val();
        const childName = data?.childName || "Your Child";
        const emotions = data?.emotions || {};

        const records = Object.values(emotions)
          .filter((entry: any) =>
            ["Angry", "Happy", "Neutral", "Sad", "Surprised"].includes(
              entry.type,
            ),
          )
          .map((entry: any) => ({
            emotion: entry.type,
            timestamp: new Date(entry.time),
          }));

        const newHistory = {
          [userId]: {
            childName,
            records,
          },
        };

        setEmotionHistory(newHistory);
        setFilteredEmotionHistory(newHistory);

        const marked = records.reduce((acc, { timestamp }) => {
          const formattedDate = dayjs(timestamp).format("YYYY-MM-DD");
          acc[formattedDate] = {
            marked: true,
            dotColor: "#FF7043",
          };
          return acc;
        }, {} as MarkedDates);

        setMarkedDates(marked);
      });
    }

    if (role === "teacher") {
      const classRef = ref(db, `Users/Teachers/Class-A/Parents`);
      onValue(classRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        const studentData: typeof emotionHistory = {};

        Object.entries(data).forEach(([parentId, val]: any) => {
          const childName = val.childName || "Unknown";
          const emotions = val.emotions || {};

          const records = Object.values(emotions).map((entry: any) => ({
            emotion: entry.type,
            timestamp: new Date(entry.time),
          }));

          studentData[parentId] = {
            childName,
            records,
          };
        });

        setEmotionHistory(studentData);

        const allMarkedDates: MarkedDates = {};
        Object.entries(studentData).forEach(([_, { records }]) => {
          records.forEach(({ timestamp }) => {
            const formattedDate = dayjs(timestamp).format("YYYY-MM-DD");
            allMarkedDates[formattedDate] = {
              marked: true,
              dotColor: "#FF7043",
            };
          });
        });

        setMarkedDates(allMarkedDates);
      });
    }
  }, [role, userId]);

  const applyFilter = (records: { emotion: Emotion; timestamp: Date }[]) => {
    return records.filter((entry) =>
      dayjs(entry.timestamp).isSame(selectedDate, "day"),
    );
  };

  const getEmotionStats = (
    records: { emotion: Emotion; timestamp: Date }[],
  ) => {
    const counts: Record<Emotion, number> = {
      Angry: 0,
      Happy: 0,
      Neutral: 0,
      Sad: 0,
      Surprised: 0,
    };

    records.forEach((r) => {
      counts[r.emotion]++;
    });

    const total = records.length || 1;

    const data = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([emotion, count]) => ({
        emotion: emotion as Emotion,
        percentage: ((count / total) * 100).toFixed(1),
        count,
      }));

    return { data, total, counts };
  };

  useEffect(() => {
    if (role === "teacher") {
      if (searchQuery.trim() === "") {
        setFilteredEmotionHistory(emotionHistory);
      } else {
        const filtered = Object.entries(emotionHistory).filter(
          ([_, { childName }]) =>
            childName.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        const newFilteredHistory = Object.fromEntries(filtered);
        setFilteredEmotionHistory(newFilteredHistory);
      }
    }
  }, [searchQuery, emotionHistory, role]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>
          {role === "teacher" ? "Class Emotion Overview" : "Emotion Breakdown"}
        </Text>

        {role === "teacher" && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search student by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        <View style={styles.datePickerBox}>
          <Text style={styles.dateLabel}>
            Selected Date: {selectedDate.format("MMMM D, YYYY")}
          </Text>
          <TouchableOpacity
            style={styles.openCalendarButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.openCalendarText}>Select Date</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* ❌ X Close Button */}
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={{
                  position: "absolute",
                  top: 20,
                  right: 10,
                  zIndex: 10,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#FF7043", // match your theme color
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 4,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
                >
                  ✕
                </Text>
              </TouchableOpacity>

              {/* 📅 Calendar */}
              <Calendar
                markedDates={markedDates}
                onDayPress={(day: { dateString: string }) => {
                  setSelectedDate(dayjs(day.dateString));
                  setIsModalVisible(false);
                }}
                monthFormat={"MMMM yyyy"}
                style={{ width: "100%", marginTop: 40 }}
              />
            </View>
          </View>
        </Modal>

        {Object.entries(filteredEmotionHistory).map(
          ([parentId, { childName, records }]) => {
            const filtered = applyFilter(records);
            const { data: stats } = getEmotionStats(filtered);
            const pieData = stats.map((item) => ({
              name: item.emotion,
              population: item.count,
              color: brightEmotionColors[item.emotion],
              legendFontColor: "#333",
              legendFontSize: 12,
            }));
            const latest = filtered[filtered.length - 1];

            return (
              <View key={parentId} style={styles.chartBox}>
                <Text style={styles.childName}>{childName}</Text>

                {pieData.length > 0 ? (
                  <>
                    <PieChart
                      data={pieData}
                      width={screenWidth - 32}
                      height={220}
                      chartConfig={{ color: () => "#333" }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      center={[0, 0]}
                      absolute
                    />

                    <View style={styles.percentageBox}>
                      {stats.map((item) => (
                        <View
                          key={item.emotion}
                          style={[
                            styles.percentItem,
                            {
                              backgroundColor:
                                brightEmotionColors[item.emotion] + "20",
                              borderColor: brightEmotionColors[item.emotion],
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: brightEmotionColors[item.emotion],
                              fontWeight: "bold",
                            }}
                          >
                            {item.emotion}: {item.percentage}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={styles.empty}>No data available.</Text> // ✅ only this remains
                )}

                {latest && (
                  <Text style={styles.latest}>
                    Last Emotion:{" "}
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: brightEmotionColors[latest.emotion],
                      }}
                    >
                      {latest.emotion}
                    </Text>
                  </Text>
                )}
              </View>
            );
          },
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2EFE7",
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#006A71", // Dark Teal
  },
  datePickerBox: {
    marginBottom: 16,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  openCalendarButton: {
    backgroundColor: "#FF7043",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  openCalendarText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    width: "80%",
    maxHeight: "80%",
  },
  chartBox: {
    marginBottom: 30,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  percentageBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  percentItem: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    margin: 4,
  },
  latest: {
    marginTop: 10,
    fontSize: 14,
    color: "#444",
    textAlign: "center",
  },
  empty: {
    marginTop: 16,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  searchInput: {
    padding: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    fontSize: 16,
  },
});

export default GraphScreen;

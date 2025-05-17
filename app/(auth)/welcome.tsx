import { useRouter, Href } from "expo-router";
import { useRef, useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

import CustomButton from "@components/CustomButton";
import { onboarding } from "@/constants";

// 🔹 Centralized Color Theme
const COLORS = {
  background: "#F2EFE7",
  title: "#006A71",
  subtitle: "#858585",
  button: "#48A6A7",
  dotInactive: "#9ACBD0",
  dotActive: "#006A71",
};

const { width } = Dimensions.get("window");

const Home = () => {
  const router = useRouter();
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === onboarding.length - 1;

  const renderSlides = () =>
    onboarding.map((item) => (
      <View
        key={item.id}
        accessible
        accessibilityRole="summary"
        style={styles.slideContainer}
      >
        <Image
          source={item.image}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={item.title}
        />
        <View style={{ width: "100%", marginTop: 40 }}>
          <Text
            style={[styles.titleText, { color: COLORS.title }]}
            accessibilityRole="header"
          >
            {item.title}
          </Text>
        </View>
        <Text
          style={[styles.descriptionText, { color: COLORS.subtitle }]}
          accessibilityRole="text"
        >
          {item.description}
        </Text>
      </View>
    ));

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: COLORS.background }]}
    >
      {/* Skip Button */}
      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        onPress={() => router.replace("/(auth)/start" as Href)}
        style={styles.skipButton}
      >
        <Text style={[styles.skipButtonText, { color: COLORS.title }]}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* Swiper Slides */}
      <Swiper
        ref={swiperRef}
        loop={false}
        dot={
          <View style={[styles.dot, { backgroundColor: COLORS.dotInactive }]} />
        }
        activeDot={
          <View style={[styles.dot, { backgroundColor: COLORS.dotActive }]} />
        }
        onIndexChanged={(index) => setActiveIndex(index)}
        containerStyle={{ flex: 1 }}
      >
        {renderSlides()}
      </Swiper>

      {/* CTA Button */}
      <CustomButton
        title={isLastSlide ? "Get Started" : "Next"}
        onPress={() =>
          isLastSlide
            ? router.replace("/(auth)/start" as Href)
            : swiperRef.current?.scrollBy?.(1)
        }
        style={[styles.ctaButton, { backgroundColor: COLORS.button }]}
        accessibilityLabel={isLastSlide ? "Start the app" : "Next slide"}
        accessibilityRole="button"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipButton: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "700", // bold
    fontFamily: "Jakarta-Bold", // if custom font is loaded
  },
  slideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  image: {
    width: width - 48, // full width minus padding
    height: 300,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Jakarta-Bold",
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    fontFamily: "Jakarta-SemiBold",
  },
  dot: {
    width: 32,
    height: 4,
    marginHorizontal: 4,
    borderRadius: 9999,
  },
  ctaButton: {
    width: "91.6%", // same as w-11/12
    marginTop: 40,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 8,
  },
});

export default Home;

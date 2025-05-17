import React from "react";
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  style?: ViewStyle | ViewStyle[]; // Replace className with style
  textStyle?: TextStyle | TextStyle[]; // Replace textColorClass with textStyle
}

const bgVariantStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: "#000000" },
  secondary: { backgroundColor: "#6B7280" }, // gray-500
  danger: { backgroundColor: "#EF4444" }, // red-500
  success: { backgroundColor: "#22C55E" }, // green-500
  outline: {
    backgroundColor: "transparent",
    borderColor: "#D1D5DB",
    borderWidth: 0.5,
  }, // neutral-300
};

const textVariantStyles: Record<string, TextStyle> = {
  default: { color: "#FFFFFF" },
  primary: { color: "#000000" },
  secondary: { color: "#F3F4F6" }, // gray-100
  danger: { color: "#FCA5A5" }, // red-100
  success: { color: "#A7F3D0" }, // green-100
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  style,
  textStyle,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.buttonBase, bgVariantStyles[bgVariant], style]}
      {...props}
    >
      {IconLeft && <IconLeft style={styles.icon} />}
      <Text
        style={[styles.textBase, textVariantStyles[textVariant], textStyle]}
      >
        {title}
      </Text>
      {IconRight && <IconRight style={styles.icon} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    width: "100%",
    borderRadius: 9999, // rounded-full
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#9CA3AF", // neutral-400
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 3, // for android shadow
  },
  textBase: {
    fontSize: 18,
    fontWeight: "700",
  },
  icon: {
    marginHorizontal: 8,
  },
});

export default CustomButton;

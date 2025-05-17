import {
  TextInput,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ImageStyle,
  StyleSheet,
} from "react-native";

interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: object | undefined;
  containerStyle?: object | undefined;
  inputStyle?: object | undefined;
  iconStyle?: object | undefined;
  className?: string; // You can remove this if unused now
  rightIcon?: any;
  onRightIconPress?: () => void;
  rightIconStyle?: StyleProp<ImageStyle>;
}

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  rightIcon,
  onRightIconPress,
  rightIconStyle,
  ...props
}: InputFieldProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.wrapper, labelStyle]}>
          <Text style={[styles.label, labelStyle]}>{label}</Text>
          <View style={[styles.inputContainer, containerStyle]}>
            {icon && <Image source={icon} style={[styles.icon, iconStyle]} />}
            <TextInput
              secureTextEntry={secureTextEntry}
              style={[styles.textInput, inputStyle]}
              {...props}
            />
            {rightIcon && (
              <TouchableOpacity onPress={onRightIconPress}>
                <Image
                  source={rightIcon}
                  style={[styles.rightIcon, rightIconStyle]}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8, // my-2
    width: "100%",
  },
  label: {
    fontSize: 18, // text-lg approx 18
    fontWeight: "600", // semi-bold approximation
    marginBottom: 12, // mb-3 (12px)
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#f3f4f6", // neutral-100 approx (light gray)
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    borderColor: "#f3f4f6", // neutral-100 border
    paddingHorizontal: 12, // reduced horizontal padding
    paddingVertical: 8, // reduced vertical padding
  },
  icon: {
    width: 20, // slightly smaller icon
    height: 20,
    marginLeft: 12,
  },
  textInput: {
    borderRadius: 9999, // rounded-full
    paddingVertical: 8, // reduced vertical padding
    paddingHorizontal: 12, // reduced horizontal padding
    fontWeight: "600",
    fontSize: 14, // slightly smaller font size
    flex: 1,
    textAlign: "left",
  },
  rightIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
});

export default InputField;

import { Stack } from "expo-router";

import { FormProvider } from "@lib/FormContext";
import { TeacherFormProvider } from "@lib/TeacherFormContext";

const AuthLayout = () => {
  return (
    <FormProvider>
      {/* Parent form context */}
      <TeacherFormProvider>
        {/* Teacher form context */}
        <Stack>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen
            name="sign-up-teacher"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="start" options={{ headerShown: false }} />
          <Stack.Screen
            name="face-recognition"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="success" options={{ headerShown: false }} />
        </Stack>
      </TeacherFormProvider>
    </FormProvider>
  );
};

export default AuthLayout;

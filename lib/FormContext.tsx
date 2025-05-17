import React, { createContext, useContext, useState, ReactNode } from "react";

interface FormData {
  childName: string;
  email: string;
  password: string;
  profilePicture: string; // Full profile picture URL or path
  profilePictureFilename?: string; // Optional: Extracted filename
}

interface FormContextType {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}

interface FormProviderProps {
  children: ReactNode;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [form, setForm] = useState<FormData>({
    childName: "",
    email: "",
    password: "",
    profilePicture: "",
    profilePictureFilename: "", // Initialize with an empty string or undefined
  });

  return (
    <FormContext.Provider value={{ form, setForm }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForm = (): FormContextType => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useForm must be used within a FormProvider");
  }
  return context;
};

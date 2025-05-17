import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of your form data
interface FormData {
  name: string;
  email: string;
  password: string;
  faceVerified: boolean;
}

// Define the shape of your context
interface AuthContextProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

// Initial form data
const initialFormData: FormData = {
  name: "",
  email: "",
  password: "",
  faceVerified: false,
};

// Create the context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Define the props for the provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  return (
    <AuthContext.Provider value={{ formData, setFormData }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the context
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

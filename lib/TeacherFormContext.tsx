import React, { createContext, useContext, useState, ReactNode } from "react";

interface TeacherFormData {
  email: string;
  password: string;
}

interface TeacherFormContextType {
  form: TeacherFormData;
  setForm: React.Dispatch<React.SetStateAction<TeacherFormData>>;
}

interface TeacherFormProviderProps {
  children: ReactNode;
}

const TeacherFormContext = createContext<TeacherFormContextType | undefined>(
  undefined,
);

export const TeacherFormProvider: React.FC<TeacherFormProviderProps> = ({
  children,
}) => {
  const [form, setForm] = useState<TeacherFormData>({
    email: "",
    password: "",
  });

  return (
    <TeacherFormContext.Provider value={{ form, setForm }}>
      {children}
    </TeacherFormContext.Provider>
  );
};

export const useTeacherForm = (): TeacherFormContextType => {
  const context = useContext(TeacherFormContext);
  if (!context) {
    throw new Error("useTeacherForm must be used within a TeacherFormProvider");
  }
  return context;
};

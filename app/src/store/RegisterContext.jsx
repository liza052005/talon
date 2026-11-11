import React, { createContext, useState } from 'react';

export const RegisterContext = createContext(null);

export const RegisterProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    group: '',
    isBudget: false,
    email: '',
    password: '',
    categoryIds: [], // Сюда будем складывать ID категорий (1, 2, 3)
  });

  const updateData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <RegisterContext.Provider value={{ formData, updateData }}>
      {children}
    </RegisterContext.Provider>
  );
};
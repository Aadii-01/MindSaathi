import React, { createContext, useContext, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const STORAGE_KEY = "app_language";
const DEFAULT_LANG = "en";

function readInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "hi" ? "hi" : DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLanguage);

  const setLanguage = (nextLanguage) => {
    const normalized = nextLanguage === "hi" ? "hi" : DEFAULT_LANG;
    setLanguageState(normalized);
    localStorage.setItem(STORAGE_KEY, normalized);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "hi" : "en"),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

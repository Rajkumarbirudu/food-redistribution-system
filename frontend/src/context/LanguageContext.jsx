import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { translations, SUPPORTED_LANGUAGES } from "../locales/index.js";

const LanguageContext = createContext();

const STORAGE_KEY = "aura_food_language";

// Build O(1) lowercase lookup tables for all languages
const lowerMapCache = {};
function buildLowerCache() {
  Object.keys(translations).forEach((langKey) => {
    lowerMapCache[langKey] = new Map();
    const phraseMap = translations[langKey]?.phraseMap || {};
    Object.keys(phraseMap).forEach((pKey) => {
      lowerMapCache[langKey].set(pKey.toLowerCase().trim(), phraseMap[pKey]);
    });
  });
}
buildLowerCache();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && translations[saved] ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    if (langObj?.rtl) {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [language]);

  const changeLanguage = useCallback((code) => {
    if (translations[code]) {
      setLanguage(code);
    }
  }, []);

  /**
   * Ultra-robust O(1) phrase & food item translation lookup
   */
  const t = useCallback(
    (keyOrText, fallback = "") => {
      if (!keyOrText) return "";
      const cleanText = String(keyOrText).trim();
      if (!cleanText) return "";

      const currentDict = translations[language] || translations["en"];
      const phraseMap = currentDict?.phraseMap || {};

      // 1. Direct exact phrase map lookup
      if (phraseMap[cleanText]) {
        return phraseMap[cleanText];
      }

      // 2. Case-insensitive & trimmed lookup
      const lowerText = cleanText.toLowerCase();
      const langLowerMap = lowerMapCache[language];
      if (langLowerMap && langLowerMap.has(lowerText)) {
        return langLowerMap.get(lowerText);
      }

      // 2b. Smart colon/punctuation handling (e.g., "Courier:" -> "कुरिअर:")
      if (cleanText.endsWith(":")) {
        const base = cleanText.slice(0, -1).trim();
        const baseLower = base.toLowerCase();
        if (phraseMap[base]) {
          return phraseMap[base] + ":";
        }
        if (langLowerMap && langLowerMap.has(baseLower)) {
          return langLowerMap.get(baseLower) + ":";
        }
      }

      // 3. Check for dictionary object keys (e.g. "nav.logout")
      if (!cleanText.includes(" ") && cleanText.includes(".")) {
        const keys = cleanText.split(".");
        let val = currentDict;
        for (const k of keys) {
          if (val && typeof val === "object" && k in val) {
            val = val[k];
          } else {
            val = null;
            break;
          }
        }
        if (val && typeof val === "string") return val;

        // Fallback to English dictionary for nested keys
        let fVal = translations["en"];
        for (const k of keys) {
          if (fVal && typeof fVal === "object" && k in fVal) {
            fVal = fVal[k];
          } else {
            fVal = null;
            break;
          }
        }
        if (fVal && typeof fVal === "string") return fVal;
      }

      // 4. Fallback lookup in English phraseMap
      const englishPhraseMap = translations["en"]?.phraseMap || {};
      if (englishPhraseMap[cleanText]) {
        return englishPhraseMap[cleanText];
      }
      const englishLowerMap = lowerMapCache["en"];
      if (englishLowerMap && englishLowerMap.has(lowerText)) {
        return englishLowerMap.get(lowerText);
      }

      if (fallback) return fallback;
      return cleanText;
    },
    [language]
  );

  const currentLangObj = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0],
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      changeLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLangObj,
    }),
    [language, changeLanguage, t, currentLangObj]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    console.warn("useTranslation used outside LanguageProvider, returning fallback.");
    return {
      language: "en",
      changeLanguage: () => {},
      t: (keyOrText) => keyOrText || "",
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLangObj: SUPPORTED_LANGUAGES[0],
    };
  }
  return context;
}

export function useLanguage() {
  return useTranslation();
}

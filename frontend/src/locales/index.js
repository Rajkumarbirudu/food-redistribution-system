import en from "./en.js";
import hi from "./hi.js";
import te from "./te.js";
import mr from "./mr.js";
import kn from "./kn.js";
import ur from "./ur.js";

export const translations = {
  en,
  hi,
  te,
  mr,
  kn,
  ur,
};

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇮🇳", rtl: true },
];

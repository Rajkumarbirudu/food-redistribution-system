import { translations, SUPPORTED_LANGUAGES } from "./locales/index.js";

export const getSupportedLanguages = () => SUPPORTED_LANGUAGES;
export const getTranslations = () => translations;

export default {
  supportedLanguages: SUPPORTED_LANGUAGES,
  translations,
};

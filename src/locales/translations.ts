import { Language } from '../types';
import en from './en.json';
import sw from './sw.json';

export const translations: Record<Language, Record<string, string>> = {
  en: en as Record<string, string>,
  sw: sw as Record<string, string>,
};

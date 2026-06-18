import i18next from 'i18next';
import pl from './lang/pl.json';
import en from './lang/en.json';

export const i18nReady: Promise<void> = i18next
  .init({
    lng: 'en',
    debug: true,
    resources: {
      en: { translation: en },
      pl: { translation: pl },
    },
  })
  .then(() => undefined);

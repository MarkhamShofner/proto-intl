import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Route.extend({

  intl: Ember.inject.service(),
  ajax: Ember.inject.service(),

  init () {
    this._super(...arguments);
  },

  beforeModel: function () {
    const intl = this.get('intl');
    let defaultLocale = 'en-us';
    let translationKey = this._calculateTranslationKey(defaultLocale);

    intl.setLocale(defaultLocale);

    // overwrite function in -intl adapter to add flag for pending translations
    intl.get('adapter').reopen({
      findTranslationByKey: function (locales, translationKey) {
        const len = locales.length;
        let i = 0;
        const chosenLocale = locales[0];

        for (; i < len; i++) {
          const locale = locales[i];
          const translations = this.translationsFor(locale);
          if (translations && translations.has(translationKey)) {
            if (locale !== chosenLocale && ENV.environment === 'production') {
              return '^*' + translations.getValue(translationKey) + '*^';
            } else {
              return translations.getValue(translationKey);
            }
          }
        }
      }
    });

    // if we got null, we want to use the default locale
    // which we should already have in the browser...
    if (translationKey !== defaultLocale) {

      // sideload the translation
      // return is important so the transition pauses until the promise resolves
      return this._fetchTranslation(translationKey).then((resp) => {
        return intl.addTranslations(translationKey, resp).then(() => {
          intl.setLocale([translationKey, defaultLocale]);
          return this._initSession();
        });
      }, () => {
        return this._initSession();
      });
    }

    return this._initSession();
  },

  _initSession () {
  },

  _loadPolyfill (locale) {
    // the polyfill service will return nothing if the browser supports Intl natively
    // so keep our code simple and just make the request
    locale = locale.split('-')[0];
    let url = `//cdn.polyfill.io/v2/polyfill.min.js?features=Intl.~locale.${locale}`;
    return this.get('ajax').request(url, {
      dataType: 'script'
    });
  },

  _fetchTranslation (locale) {
    // const url = ENV.APP.staticAssetBase + '/locales/' + locale + '.json';
    const url = '/locales/' + locale + '.json';
    return this.get('ajax').request(url);
  },

  _calculateTranslationKey (defaultLocale) {
    // get the locale the browser wants
    var browserLocale = this._calculateBrowserLocale();

    // list of the translations we support.
    let langKeys = ['cs', 'da', 'de', 'en-us', 'es', 'et', 'el', 'fi', 'fr', 'it', 'ja',
                    'ko', 'lt', 'lv', 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru',
                    'sv', 'th', 'tr', 'vi', 'zh-cn', 'zh-tw', 'zh-hk'];

    // ensure locase of the locale from the browser
    browserLocale = browserLocale.toLowerCase();
    // default to the browserLocale
    let translationKey = browserLocale;
    // but if that's not in our translatoins...
    if (langKeys.indexOf(browserLocale) === -1) {
      // check the root
      var parts = browserLocale.split('-');

      // did we get a root and is that in our list of supported translations?
      if (parts.length > 1 && langKeys.indexOf(parts[0]) > -1) {
        // ok, use the root
        translationKey = parts[0];
      } else {
        // ok - we don't have a translation, use the default (en)
        translationKey = defaultLocale;
      }
    }

    return translationKey;
  },

  /**
   * Pull the locale from the browser.
   * Somewhat convoluted because "browsers"
   */
  _calculateBrowserLocale () {
    var nav = window.navigator;
    var browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'];
    var i;
    var language;

    // get it from the querystring, locale=
    if (location.search || location.hash) {
      let search = location.search;
      if (!search && location.hash) {
        // ie9 uses hash so search will be empty because it comes after the hash
        search = location.hash.replace(/^#\//, '');
      }

      search = search.replace(/^\?/, '').split('&');
      let localeParam = search.find((x) => x.indexOf('locale=') === 0);
      if (localeParam) {
        return localeParam.replace('locale=', '');
      }
    }

    // support for HTML 5.1 "navigator.languages"
    if (Array.isArray(nav.languages) && nav.languages.length > 0) {
      language = nav.languages[0];
      if (language && language.length) {
        return language;
      }
    }

    // support for other well known properties in browsers
    for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
      language = nav[browserLanguagePropertyKeys[i]];
      if (language && language.length) {
        return language;
      }
    }

    return null;
  }
});

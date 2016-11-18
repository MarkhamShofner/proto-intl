// app/routes/application.js
import Ember from 'ember';

export default Ember.Route.extend({
  intl: Ember.inject.service(),
  beforeModel() {
    // define the app's runtime locale
    // For example, here you would maybe do an API lookup to resolver
    // which locale the user should be targeted and perhaps lazily
    // load translations using XHR and calling intl's `addTranslation`/`addTranslations`
    // method with the results of the XHR request
    // return this.get('intl').setLocale('en-us');

    // OR for those that sideload, an array is accepted to handle fallback lookups

    // en-ca is the primary locale, en-us is the fallback.
    // this is optional, and likely unnecessary if you define baseLocale (see below)
    // The primary usecase is if you side load all translations
    //
    return this.get('intl').setLocale(['fr', 'en-us']);


    // const intl = this.get('intl');
    //
    // let defaultLocale = 'en-us';
    // let translationKey = this._calculateTranslationKey(defaultLocale);
    //
    // intl.setLocale(defaultLocale);



  }
});

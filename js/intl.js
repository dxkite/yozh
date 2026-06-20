if (!globalThis.Intl) {
  globalThis.Intl = {
    DateTimeFormat: function(locale, opts) {
      return {
        format: function(d) { return (d instanceof Date ? d : new Date(d)).toISOString(); },
        formatToParts: function(d) { return []; },
        resolvedOptions: function() { return { locale: locale || 'en', timeZone: 'UTC' }; },
      };
    },
    NumberFormat: function(locale, opts) {
      return {
        format: function(n) { return String(n); },
        formatToParts: function(n) { return []; },
        resolvedOptions: function() { return { locale: locale || 'en' }; },
      };
    },
    Collator: function(locale, opts) {
      return {
        compare: function(a, b) { return a < b ? -1 : a > b ? 1 : 0; },
        resolvedOptions: function() { return { locale: locale || 'en' }; },
      };
    },
    getCanonicalLocales: function(l) { return Array.isArray(l) ? l : [l]; },
    supportedValuesOf: function(k) { return []; },
  };
}

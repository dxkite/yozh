// Timezone-aware Intl polyfill.
// date-fns-tz uses Intl.DateTimeFormat.formatToParts to compute IANA timezone offsets.
// goja (sobek) has no native Intl at all; this always overrides DateTimeFormat with a
// fixed-offset implementation.
(function () {
  // Fixed UTC offset (minutes) for common IANA timezone names.
  // DST is intentionally ignored: Asia/Shanghai (the primary timezone here) has no DST.
  var tzDb = {
    'UTC': 0, 'GMT': 0, 'Etc/UTC': 0, 'Etc/GMT': 0,
    'Asia/Shanghai': 480, 'Asia/Beijing': 480, 'Asia/Chongqing': 480, 'Asia/Harbin': 480,
    'Asia/Hong_Kong': 480, 'Asia/Macao': 480, 'Asia/Taipei': 480, 'Asia/Singapore': 480,
    'Asia/Tokyo': 540, 'Asia/Seoul': 540, 'Asia/Osaka': 540, 'Asia/Sapporo': 540,
    'Asia/Kolkata': 330, 'Asia/Calcutta': 330,
    'Asia/Bangkok': 420, 'Asia/Jakarta': 420, 'Asia/Ho_Chi_Minh': 420, 'Asia/Saigon': 420,
    'Asia/Dubai': 240, 'Asia/Muscat': 240,
    'Asia/Karachi': 300, 'Asia/Dhaka': 360, 'Asia/Almaty': 360, 'Asia/Urumqi': 360,
    'Asia/Yangon': 390, 'Asia/Rangoon': 390,
    'Asia/Kabul': 270, 'Asia/Tehran': 210,
    'Asia/Riyadh': 180, 'Asia/Baghdad': 180, 'Asia/Kuwait': 180,
    'Africa/Cairo': 120, 'Africa/Johannesburg': 120, 'Africa/Nairobi': 180, 'Africa/Addis_Ababa': 180,
    'Europe/Moscow': 180, 'Europe/Istanbul': 180,
    'Europe/Paris': 60, 'Europe/Berlin': 60, 'Europe/Rome': 60,
    'Europe/Amsterdam': 60, 'Europe/Madrid': 60, 'Europe/Warsaw': 60,
    'Europe/London': 0, 'Europe/Lisbon': 0, 'Atlantic/Reykjavik': 0,
    'Atlantic/Azores': -60,
    'America/Sao_Paulo': -180, 'America/Buenos_Aires': -180, 'America/Argentina/Buenos_Aires': -180,
    'America/Halifax': -240,
    'America/New_York': -240, 'America/Toronto': -240, 'America/Detroit': -240,
    'America/Chicago': -300, 'America/Winnipeg': -300,
    'America/Denver': -360, 'America/Phoenix': -420,
    'America/Los_Angeles': -480, 'America/Vancouver': -480,
    'America/Anchorage': -540,
    'Pacific/Honolulu': -600,
    'Pacific/Auckland': 720, 'Pacific/Fiji': 720,
    'Australia/Sydney': 600, 'Australia/Melbourne': 600, 'Australia/Brisbane': 600,
    'Australia/Adelaide': 570, 'Australia/Perth': 480,
  };

  function tzOffsetMin(tzName) {
    if (!tzName) return 0;
    var m;
    // ±HH:MM
    m = /^([+-])(\d{2}):(\d{2})$/.exec(tzName);
    if (m) return (m[1] === '+' ? 1 : -1) * (parseInt(m[2]) * 60 + parseInt(m[3]));
    // ±HHMM
    m = /^([+-])(\d{2})(\d{2})$/.exec(tzName);
    if (m) return (m[1] === '+' ? 1 : -1) * (parseInt(m[2]) * 60 + parseInt(m[3]));
    // ±HH
    m = /^([+-])(\d{2})$/.exec(tzName);
    if (m) return (m[1] === '+' ? 1 : -1) * parseInt(m[2]) * 60;
    // Etc/GMT±N (sign is reversed vs UTC offset per POSIX convention)
    m = /^Etc\/GMT([+-]\d+)$/.exec(tzName);
    if (m) return -parseInt(m[1]) * 60;
    return tzName in tzDb ? tzDb[tzName] : 0;
  }

  function makeDTF(locale, opts) {
    var tz = opts && opts.timeZone;
    var offMs = tzOffsetMin(tz) * 60000;

    function adjust(d) {
      return new Date((d instanceof Date ? d : new Date(d)).getTime() + offMs);
    }

    function p2(n) { return ('0' + n).slice(-2); }

    return {
      format: function (d) {
        var a = adjust(d);
        return p2(a.getUTCMonth() + 1) + '/' + p2(a.getUTCDate()) + '/' + a.getUTCFullYear() +
          ', ' + p2(a.getUTCHours()) + ':' + p2(a.getUTCMinutes()) + ':' + p2(a.getUTCSeconds());
      },
      formatToParts: function (d) {
        var a = adjust(d);
        return [
          { type: 'month',   value: p2(a.getUTCMonth() + 1) },
          { type: 'literal', value: '/' },
          { type: 'day',     value: p2(a.getUTCDate()) },
          { type: 'literal', value: '/' },
          { type: 'year',    value: String(a.getUTCFullYear()) },
          { type: 'literal', value: ', ' },
          { type: 'hour',    value: p2(a.getUTCHours()) },
          { type: 'literal', value: ':' },
          { type: 'minute',  value: p2(a.getUTCMinutes()) },
          { type: 'literal', value: ':' },
          { type: 'second',  value: p2(a.getUTCSeconds()) },
        ];
      },
      resolvedOptions: function () {
        return { locale: locale || 'en-US', timeZone: tz || 'UTC' };
      },
    };
  }

  if (!globalThis.Intl) {
    globalThis.Intl = {
      NumberFormat: function (locale, opts) {
        return {
          format: function (n) { return String(n); },
          formatToParts: function (n) { return []; },
          resolvedOptions: function () { return { locale: locale || 'en' }; },
        };
      },
      Collator: function (locale, opts) {
        return {
          compare: function (a, b) { return a < b ? -1 : a > b ? 1 : 0; },
          resolvedOptions: function () { return { locale: locale || 'en' }; },
        };
      },
      getCanonicalLocales: function (l) { return Array.isArray(l) ? l : [l]; },
      supportedValuesOf: function () { return []; },
    };
  }

  // Always override DateTimeFormat: without this, date-fns-tz's tzParseTimezone
  // has no IANA timezone data to work from and would return NaN and throw RangeError.
  globalThis.Intl.DateTimeFormat = makeDTF;
  globalThis.Intl.DateTimeFormat.supportedLocalesOf = function () { return []; };
})();

function readingTime(text, options) {
  options = options || {};
  var wpm = options.wordsPerMinute || 200;
  var words = (text || '').trim().split(/\s+/g).filter(Boolean).length;
  var minutes = words / wpm;
  var time = Math.round(minutes * 60 * 1000);
  var displayed = Math.max(1, Math.ceil(minutes));
  return { text: displayed + ' min read', minutes: minutes, time: time, words: words };
}
export default readingTime;

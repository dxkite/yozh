function cssesc(str, opts) {
  opts = opts || {};
  return str.replace(/[^\x20-\x7E]|[!"#$%&'()*+,./:;<=>?@\[\\\]^{|}~]/g, function(c) {
    var code = c.codePointAt(0);
    return '\\' + code.toString(16) + ' ';
  });
}
cssesc.default = cssesc;
export default cssesc;

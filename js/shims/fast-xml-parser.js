export class XMLBuilder {
  constructor(opts) { this.opts = opts || {}; }
  build(obj) {
    function escXml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function toXML(key, val, indent) {
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) return val.map(v => toXML(key, v, indent)).join('\n');
      if (typeof val === 'object') {
        const attrs = val['@_'] ? ' ' + Object.entries(val['@_']).map(([k, v]) => k + '="' + v + '"').join(' ') : '';
        const text = val['#text'] !== undefined ? escXml(val['#text']) : '';
        const children = Object.entries(val)
          .filter(([k]) => k !== '@_' && k !== '#text')
          .map(([k, v]) => toXML(k, v, indent + '  ')).join('\n');
        const inner = text + (children ? '\n' + children + '\n' + indent : '');
        return indent + '<' + key + attrs + '>' + inner + '</' + key + '>';
      }
      return indent + '<' + key + '>' + escXml(String(val)) + '</' + key + '>';
    }
    const root = Object.entries(obj)[0];
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + toXML(root[0], root[1], '');
  }
}
export class XMLParser {
  constructor(opts) {}
  parse(xml) { return {}; }
}
export default { XMLBuilder, XMLParser };

(function() {
  // ── Binary transfer helpers ───────────────────────────────────────────────
  // _toB64: convert Uint8Array / ArrayBuffer -> base64 string (via Go __bufToB64)
  function _toB64(buf) {
    if (!buf) return '';
    var bytes;
    if (buf instanceof Uint8Array) {
      bytes = buf;
    } else if (buf instanceof ArrayBuffer) {
      bytes = new Uint8Array(buf);
    } else if (buf && buf.buffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(buf.buffer, buf.byteOffset || 0, buf.byteLength);
    } else {
      try { bytes = new Uint8Array(buf); } catch(e) { return ''; }
    }
    return __bufToB64(JSON.stringify(Array.prototype.slice.call(bytes)));
  }
  // _fromB64: decode base64 string -> ArrayBuffer (via Go __b64ToBuf)
  function _fromB64(b64) { return __b64ToBuf(b64); }

  // _makeKey: create a JS CryptoKey-like object backed by a Go key registry ID
  function _makeKey(id, type, algorithm, extractable, usages) {
    return { __id: id, type: type, algorithm: algorithm, extractable: extractable, usages: usages };
  }

  // _algoToJSON: serialize algorithm to JSON, converting any binary iv fields to base64
  function _algoToJSON(algorithm) {
    if (typeof algorithm === 'string') return JSON.stringify({name: algorithm});
    var a = {name: algorithm.name};
    if (algorithm.hash !== undefined) {
      a.hash = typeof algorithm.hash === 'string' ? algorithm.hash : algorithm.hash.name;
    }
    if (algorithm.length !== undefined) a.length = algorithm.length;
    if (algorithm.iv !== undefined) a.iv = _toB64(algorithm.iv);
    if (algorithm.tagLength !== undefined) a.tagLength = algorithm.tagLength;
    if (algorithm.namedCurve !== undefined) a.namedCurve = algorithm.namedCurve;
    if (algorithm.label !== undefined) a.label = _toB64(algorithm.label);
    return JSON.stringify(a);
  }

  // ── crypto.subtle ─────────────────────────────────────────────────────────
  var subtle = {
    digest: async function(algorithm, data) {
      var algo = typeof algorithm === 'string' ? algorithm : algorithm.name;
      var res = __cryptoSubtleDigest(algo, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    importKey: async function(format, keyData, algorithm, extractable, usages) {
      var algoJ = _algoToJSON(algorithm);
      var data = (format === 'jwk') ? JSON.stringify(keyData) : _toB64(keyData);
      var id = __cryptoSubtleImportKey(format, data, algoJ, String(extractable), JSON.stringify(usages));
      if (id.slice(0,6) === 'ERROR:') throw new DOMException(id.slice(6), 'DataError');
      var algoObj = typeof algorithm === 'string' ? {name: algorithm} : algorithm;
      return _makeKey(id, 'secret', algoObj, extractable, usages);
    },
    generateKey: async function(algorithm, extractable, usages) {
      var algoJ = _algoToJSON(algorithm);
      var res = __cryptoSubtleGenerateKey(algoJ, String(extractable), JSON.stringify(usages));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      var algoObj = typeof algorithm === 'string' ? {name: algorithm} : algorithm;
      // Asymmetric key pairs return JSON {priv:"id",pub:"id"}; symmetric returns a plain key ID
      try {
        var kp = JSON.parse(res);
        if (kp.priv && kp.pub) {
          return {
            privateKey: _makeKey(kp.priv, 'private', algoObj, extractable, usages),
            publicKey:  _makeKey(kp.pub,  'public',  algoObj, extractable, usages),
          };
        }
      } catch(e) {}
      return _makeKey(res, 'secret', algoObj, extractable, usages);
    },
    exportKey: async function(format, key) {
      var res = __cryptoSubtleExportKey(format, key.__id);
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'InvalidAccessError');
      if (format === 'jwk') return JSON.parse(res);
      return _fromB64(res);
    },
    sign: async function(algorithm, key, data) {
      var res = __cryptoSubtleSign(_algoToJSON(algorithm), key.__id, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    verify: async function(algorithm, key, signature, data) {
      var res = __cryptoSubtleVerify(_algoToJSON(algorithm), key.__id, _toB64(signature), _toB64(data));
      return res === 'true';
    },
    encrypt: async function(algorithm, key, data) {
      var res = __cryptoSubtleEncrypt(_algoToJSON(algorithm), key.__id, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    decrypt: async function(algorithm, key, data) {
      var res = __cryptoSubtleDecrypt(_algoToJSON(algorithm), key.__id, _toB64(data));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    deriveBits: async function(algorithm, key, length) {
      var res = __cryptoSubtleDeriveBits(_algoToJSON(algorithm), key.__id, String(length));
      if (res.slice(0,6) === 'ERROR:') throw new DOMException(res.slice(6), 'OperationError');
      return _fromB64(res);
    },
    deriveKey: async function(algorithm, baseKey, derivedAlgo, extractable, usages) {
      var bitLen = derivedAlgo.length || (derivedAlgo.name === 'AES-GCM' || derivedAlgo.name === 'AES-CBC' ? 256 : 128);
      var bits = await this.deriveBits(algorithm, baseKey, bitLen);
      return this.importKey('raw', bits, derivedAlgo, extractable, usages);
    },
    wrapKey:   async function() { throw new DOMException('Not implemented', 'NotSupportedError'); },
    unwrapKey: async function() { throw new DOMException('Not implemented', 'NotSupportedError'); },
  };

  globalThis.crypto = {
    randomUUID: function() {
      var bytes = new Uint8Array(__cryptoRandomBytes(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      var hex = Array.prototype.map.call(bytes, function(x) { return x.toString(16).padStart(2, '0'); });
      return hex.slice(0,4).join('') + '-' +
             hex.slice(4,6).join('') + '-' +
             hex.slice(6,8).join('') + '-' +
             hex.slice(8,10).join('') + '-' +
             hex.slice(10,16).join('');
    },
    getRandomValues: function(arr) {
      var bytes = new Uint8Array(__cryptoRandomBytes(arr.byteLength));
      var view = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      for (var i = 0; i < bytes.length; i++) view[i] = bytes[i];
      return arr;
    },
    subtle: subtle,
  };
})();

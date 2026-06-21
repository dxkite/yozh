var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod2) => function __require() {
  return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// examples/testapp-ssr/.netlify/build/renderers.mjs
var renderers;
var init_renderers = __esm({
  "examples/testapp-ssr/.netlify/build/renderers.mjs"() {
    renderers = [];
  }
});

// node-shim:node:fs
var noop, promises, statSync, createReadStream;
var init_node_fs = __esm({
  "node-shim:node:fs"() {
    noop = () => Promise.resolve(null);
    promises = {
      readFile: noop,
      writeFile: noop,
      readdir: noop,
      stat: noop,
      mkdir: noop,
      rm: noop,
      access: noop,
      readlink: noop
    };
    statSync = () => {
      throw new Error("statSync not supported in SSR");
    };
    createReadStream = () => {
      throw new Error("createReadStream not supported in SSR");
    };
  }
});

// examples/testapp-ssr/node_modules/@oslojs/encoding/dist/hex.js
function encodeHexUpperCase(data) {
  let result = "";
  for (let i2 = 0; i2 < data.length; i2++) {
    result += alphabetUpperCase[data[i2] >> 4];
    result += alphabetUpperCase[data[i2] & 15];
  }
  return result;
}
function decodeHex(data) {
  if (data.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const result = new Uint8Array(data.length / 2);
  for (let i2 = 0; i2 < data.length; i2 += 2) {
    if (!(data[i2] in decodeMap)) {
      throw new Error("Invalid character");
    }
    if (!(data[i2 + 1] in decodeMap)) {
      throw new Error("Invalid character");
    }
    result[i2 / 2] |= decodeMap[data[i2]] << 4;
    result[i2 / 2] |= decodeMap[data[i2 + 1]];
  }
  return result;
}
var alphabetUpperCase, decodeMap;
var init_hex = __esm({
  "examples/testapp-ssr/node_modules/@oslojs/encoding/dist/hex.js"() {
    alphabetUpperCase = "0123456789ABCDEF";
    decodeMap = {
      "0": 0,
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
      "9": 9,
      a: 10,
      A: 10,
      b: 11,
      B: 11,
      c: 12,
      C: 12,
      d: 13,
      D: 13,
      e: 14,
      E: 14,
      f: 15,
      F: 15
    };
  }
});

// examples/testapp-ssr/node_modules/@oslojs/encoding/dist/base32.js
var EncodingPadding, DecodingPadding;
var init_base32 = __esm({
  "examples/testapp-ssr/node_modules/@oslojs/encoding/dist/base32.js"() {
    (function(EncodingPadding3) {
      EncodingPadding3[EncodingPadding3["Include"] = 0] = "Include";
      EncodingPadding3[EncodingPadding3["None"] = 1] = "None";
    })(EncodingPadding || (EncodingPadding = {}));
    (function(DecodingPadding3) {
      DecodingPadding3[DecodingPadding3["Required"] = 0] = "Required";
      DecodingPadding3[DecodingPadding3["Ignore"] = 1] = "Ignore";
    })(DecodingPadding || (DecodingPadding = {}));
  }
});

// examples/testapp-ssr/node_modules/@oslojs/encoding/dist/base64.js
function encodeBase64(bytes) {
  return encodeBase64_internal(bytes, base64Alphabet, EncodingPadding2.Include);
}
function encodeBase64_internal(bytes, alphabet, padding) {
  let result = "";
  for (let i2 = 0; i2 < bytes.byteLength; i2 += 3) {
    let buffer2 = 0;
    let bufferBitSize = 0;
    for (let j = 0; j < 3 && i2 + j < bytes.byteLength; j++) {
      buffer2 = buffer2 << 8 | bytes[i2 + j];
      bufferBitSize += 8;
    }
    for (let j = 0; j < 4; j++) {
      if (bufferBitSize >= 6) {
        result += alphabet[buffer2 >> bufferBitSize - 6 & 63];
        bufferBitSize -= 6;
      } else if (bufferBitSize > 0) {
        result += alphabet[buffer2 << 6 - bufferBitSize & 63];
        bufferBitSize = 0;
      } else if (padding === EncodingPadding2.Include) {
        result += "=";
      }
    }
  }
  return result;
}
function decodeBase64(encoded) {
  return decodeBase64_internal(encoded, base64DecodeMap, DecodingPadding2.Required);
}
function decodeBase64_internal(encoded, decodeMap2, padding) {
  const result = new Uint8Array(Math.ceil(encoded.length / 4) * 3);
  let totalBytes = 0;
  for (let i2 = 0; i2 < encoded.length; i2 += 4) {
    let chunk = 0;
    let bitsRead = 0;
    for (let j = 0; j < 4; j++) {
      if (padding === DecodingPadding2.Required && encoded[i2 + j] === "=") {
        continue;
      }
      if (padding === DecodingPadding2.Ignore && (i2 + j >= encoded.length || encoded[i2 + j] === "=")) {
        continue;
      }
      if (j > 0 && encoded[i2 + j - 1] === "=") {
        throw new Error("Invalid padding");
      }
      if (!(encoded[i2 + j] in decodeMap2)) {
        throw new Error("Invalid character");
      }
      chunk |= decodeMap2[encoded[i2 + j]] << (3 - j) * 6;
      bitsRead += 6;
    }
    if (bitsRead < 24) {
      let unused;
      if (bitsRead === 12) {
        unused = chunk & 65535;
      } else if (bitsRead === 18) {
        unused = chunk & 255;
      } else {
        throw new Error("Invalid padding");
      }
      if (unused !== 0) {
        throw new Error("Invalid padding");
      }
    }
    const byteLength = Math.floor(bitsRead / 8);
    for (let i3 = 0; i3 < byteLength; i3++) {
      result[totalBytes] = chunk >> 16 - i3 * 8 & 255;
      totalBytes++;
    }
  }
  return result.slice(0, totalBytes);
}
var base64Alphabet, EncodingPadding2, DecodingPadding2, base64DecodeMap;
var init_base64 = __esm({
  "examples/testapp-ssr/node_modules/@oslojs/encoding/dist/base64.js"() {
    base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    (function(EncodingPadding3) {
      EncodingPadding3[EncodingPadding3["Include"] = 0] = "Include";
      EncodingPadding3[EncodingPadding3["None"] = 1] = "None";
    })(EncodingPadding2 || (EncodingPadding2 = {}));
    (function(DecodingPadding3) {
      DecodingPadding3[DecodingPadding3["Required"] = 0] = "Required";
      DecodingPadding3[DecodingPadding3["Ignore"] = 1] = "Ignore";
    })(DecodingPadding2 || (DecodingPadding2 = {}));
    base64DecodeMap = {
      "0": 52,
      "1": 53,
      "2": 54,
      "3": 55,
      "4": 56,
      "5": 57,
      "6": 58,
      "7": 59,
      "8": 60,
      "9": 61,
      A: 0,
      B: 1,
      C: 2,
      D: 3,
      E: 4,
      F: 5,
      G: 6,
      H: 7,
      I: 8,
      J: 9,
      K: 10,
      L: 11,
      M: 12,
      N: 13,
      O: 14,
      P: 15,
      Q: 16,
      R: 17,
      S: 18,
      T: 19,
      U: 20,
      V: 21,
      W: 22,
      X: 23,
      Y: 24,
      Z: 25,
      a: 26,
      b: 27,
      c: 28,
      d: 29,
      e: 30,
      f: 31,
      g: 32,
      h: 33,
      i: 34,
      j: 35,
      k: 36,
      l: 37,
      m: 38,
      n: 39,
      o: 40,
      p: 41,
      q: 42,
      r: 43,
      s: 44,
      t: 45,
      u: 46,
      v: 47,
      w: 48,
      x: 49,
      y: 50,
      z: 51,
      "+": 62,
      "/": 63
    };
  }
});

// examples/testapp-ssr/node_modules/@oslojs/encoding/dist/index.js
var init_dist = __esm({
  "examples/testapp-ssr/node_modules/@oslojs/encoding/dist/index.js"() {
    init_hex();
    init_base32();
    init_base64();
  }
});

// examples/testapp-ssr/node_modules/zod/v3/helpers/util.js
var util, objectUtil, ZodParsedType, getParsedType;
var init_util = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/helpers/util.js"() {
    (function(util2) {
      util2.assertEqual = (_) => {
      };
      function assertIs(_arg) {
      }
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k2) => typeof obj[obj[k2]] !== "number");
        const filtered = {};
        for (const k2 of validKeys) {
          filtered[k2] = obj[k2];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e2) {
          return obj[e2];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (util = {}));
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (objectUtil = {}));
    ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    getParsedType = (data) => {
      const t4 = typeof data;
      switch (t4) {
        case "undefined":
          return ZodParsedType.undefined;
        case "string":
          return ZodParsedType.string;
        case "number":
          return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
          return ZodParsedType.boolean;
        case "function":
          return ZodParsedType.function;
        case "bigint":
          return ZodParsedType.bigint;
        case "symbol":
          return ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return ZodParsedType.array;
          }
          if (data === null) {
            return ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return ZodParsedType.date;
          }
          return ZodParsedType.object;
        default:
          return ZodParsedType.unknown;
      }
    };
  }
});

// examples/testapp-ssr/node_modules/zod/v3/ZodError.js
var ZodIssueCode, quotelessJson, ZodError;
var init_ZodError = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/ZodError.js"() {
    init_util();
    ZodIssueCode = util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    quotelessJson = (obj) => {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"([^"]+)":/g, "$1:");
    };
    ZodError = class _ZodError extends Error {
      get errors() {
        return this.issues;
      }
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = (error2) => {
          for (const issue of error2.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i2 = 0;
              while (i2 < issue.path.length) {
                const el2 = issue.path[i2];
                const terminal = i2 === issue.path.length - 1;
                if (!terminal) {
                  curr[el2] = curr[el2] || { _errors: [] };
                } else {
                  curr[el2] = curr[el2] || { _errors: [] };
                  curr[el2]._errors.push(mapper(issue));
                }
                curr = curr[el2];
                i2++;
              }
            }
          }
        };
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof _ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            const firstEl = sub.path[0];
            fieldErrors[firstEl] = fieldErrors[firstEl] || [];
            fieldErrors[firstEl].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    ZodError.create = (issues) => {
      const error2 = new ZodError(issues);
      return error2;
    };
  }
});

// examples/testapp-ssr/node_modules/zod/v3/locales/en.js
var errorMap, en_default;
var init_en = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/locales/en.js"() {
    init_ZodError();
    init_util();
    errorMap = (issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodIssueCode.invalid_type:
          if (issue.received === ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
          break;
        case ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
          break;
        case ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "bigint")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util.assertNever(issue);
      }
      return { message };
    };
    en_default = errorMap;
  }
});

// examples/testapp-ssr/node_modules/zod/v3/errors.js
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
var overrideErrorMap;
var init_errors = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/errors.js"() {
    init_en();
    overrideErrorMap = en_default;
  }
});

// examples/testapp-ssr/node_modules/zod/v3/helpers/parseUtil.js
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x2) => !!x2)
  });
  ctx.common.issues.push(issue);
}
var makeIssue, EMPTY_PATH, ParseStatus, INVALID, DIRTY, OK, isAborted, isDirty, isValid, isAsync;
var init_parseUtil = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/helpers/parseUtil.js"() {
    init_errors();
    init_en();
    makeIssue = (params) => {
      const { data, path, errorMaps, issueData } = params;
      const fullPath = [...path, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m2) => !!m2).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    };
    EMPTY_PATH = [];
    ParseStatus = class _ParseStatus {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s2 of results) {
          if (s2.status === "aborted")
            return INVALID;
          if (s2.status === "dirty")
            status.dirty();
          arrayValue.push(s2.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return _ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return INVALID;
          if (value.status === "aborted")
            return INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    INVALID = Object.freeze({
      status: "aborted"
    });
    DIRTY = (value) => ({ status: "dirty", value });
    OK = (value) => ({ status: "valid", value });
    isAborted = (x2) => x2.status === "aborted";
    isDirty = (x2) => x2.status === "dirty";
    isValid = (x2) => x2.status === "valid";
    isAsync = (x2) => typeof Promise !== "undefined" && x2 instanceof Promise;
  }
});

// examples/testapp-ssr/node_modules/zod/v3/helpers/typeAliases.js
var init_typeAliases = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/helpers/typeAliases.js"() {
  }
});

// examples/testapp-ssr/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
var init_errorUtil = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/helpers/errorUtil.js"() {
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
    })(errorUtil || (errorUtil = {}));
  }
});

// examples/testapp-ssr/node_modules/zod/v3/types.js
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap3, invalid_type_error, required_error, description } = params;
  if (errorMap3 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap3)
    return { errorMap: errorMap3, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version3) {
  if ((version3 === "v4" || !version3) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version3 === "v6" || !version3) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version3) {
  if ((version3 === "v4" || !version3) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version3 === "v6" || !version3) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
function mergeValues(a2, b) {
  const aType = getParsedType(a2);
  const bType = getParsedType(b);
  if (a2 === b) {
    return { valid: true, data: a2 };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a2).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a2, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a2[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a2.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a2.length; index++) {
      const itemA = a2[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a2 === +b) {
    return { valid: true, data: a2 };
  } else {
    return { valid: false };
  }
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
function cleanParams(params, data) {
  const p2 = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p22 = typeof p2 === "string" ? { message: p2 } : p2;
  return p22;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r5 = check(data);
      if (r5 instanceof Promise) {
        return r5.then((r6) => {
          if (!r6) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r5) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var ParseInputLazyPath, handleResult, ZodType, cuidRegex, cuid2Regex, ulidRegex, uuidRegex, nanoidRegex, jwtRegex, durationRegex, emailRegex, _emojiRegex, emojiRegex, ipv4Regex, ipv4CidrRegex, ipv6Regex, ipv6CidrRegex, base64Regex, base64urlRegex, dateRegexSource, dateRegex, ZodString, ZodNumber, ZodBigInt, ZodBoolean, ZodDate, ZodSymbol, ZodUndefined, ZodNull, ZodAny, ZodUnknown, ZodNever, ZodVoid, ZodArray, ZodObject, ZodUnion, getDiscriminator, ZodDiscriminatedUnion, ZodIntersection, ZodTuple, ZodRecord, ZodMap, ZodSet, ZodFunction, ZodLazy, ZodLiteral, ZodEnum, ZodNativeEnum, ZodPromise, ZodEffects, ZodOptional, ZodNullable, ZodDefault, ZodCatch, ZodNaN, BRAND, ZodBranded, ZodPipeline, ZodReadonly, late, ZodFirstPartyTypeKind, instanceOfType, stringType, numberType, nanType, bigIntType, booleanType, dateType, symbolType, undefinedType, nullType, anyType, unknownType, neverType, voidType, arrayType, objectType, strictObjectType, unionType, discriminatedUnionType, intersectionType, tupleType, recordType, mapType, setType, functionType, lazyType, literalType, enumType, nativeEnumType, promiseType, effectsType, optionalType, nullableType, preprocessType, pipelineType, ostring, onumber, oboolean, coerce, NEVER;
var init_types = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/types.js"() {
    init_ZodError();
    init_errors();
    init_errorUtil();
    init_parseUtil();
    init_util();
    ParseInputLazyPath = class {
      constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (Array.isArray(this._key)) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    handleResult = (ctx, result) => {
      if (isValid(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error2 = new ZodError(ctx.common.issues);
            this._error = error2;
            return this._error;
          }
        };
      }
    };
    ZodType = class {
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return getParsedType(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        const ctx = {
          common: {
            issues: [],
            async: params?.async ?? false,
            contextualErrorMap: params?.errorMap
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      "~validate"(data) {
        const ctx = {
          common: {
            issues: [],
            async: !!this["~standard"].async
          },
          path: [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        if (!this["~standard"].async) {
          try {
            const result = this._parseSync({ data, path: [], parent: ctx });
            return isValid(result) ? {
              value: result.value
            } : {
              issues: ctx.common.issues
            };
          } catch (err) {
            if (err?.message?.toLowerCase()?.includes("encountered")) {
              this["~standard"].async = true;
            }
            ctx.common = {
              issues: [],
              async: true
            };
          }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        });
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params?.errorMap,
            async: true
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = (val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        };
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = () => ctx.addIssue({
            code: ZodIssueCode.custom,
            ...getIssueProperties(val)
          });
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: (data) => this["~validate"](data)
        };
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    cuidRegex = /^c[^\s-]{8,}$/i;
    cuid2Regex = /^[0-9a-z]+$/;
    ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    nanoidRegex = /^[a-z0-9_-]{21}$/i;
    jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
    ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
    dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    dateRegex = new RegExp(`^${dateRegexSource}$`);
    ZodString = class _ZodString extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "email",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "emoji",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "uuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "nanoid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid2",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ulid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "regex",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "duration",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ip",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "jwt") {
            if (!isValidJWT(input.data, check.alg)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "jwt",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cidr") {
            if (!isValidCidr(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cidr",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64url") {
            if (!base64urlRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodIssueCode.invalid_string,
          ...errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
      }
      base64url(message) {
        return this._addCheck({
          kind: "base64url",
          ...errorUtil.errToObj(message)
        });
      }
      jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
      }
      cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
      }
      datetime(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          offset: options?.offset ?? false,
          local: options?.local ?? false,
          ...errorUtil.errToObj(options?.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          ...errorUtil.errToObj(options?.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options?.position,
          ...errorUtil.errToObj(options?.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil.errToObj(message)
        });
      }
      /**
       * Equivalent to `.min(1)`
       */
      nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
      }
      trim() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get isBase64url() {
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodString.create = (params) => {
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    ZodNumber = class _ZodNumber extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodBigInt = class _ZodBigInt extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          try {
            input.data = BigInt(input.data);
          } catch {
            return this._getInvalidInput(input);
          }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
          return this._getInvalidInput(input);
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.bigint,
          received: ctx.parsedType
        });
        return INVALID;
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodBigInt.create = (params) => {
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    ZodBoolean = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodDate = class _ZodDate extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_date
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new _ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    ZodSymbol = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    ZodUndefined = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    ZodNull = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    ZodAny = class extends ZodType {
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    ZodUnknown = class extends ZodType {
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    ZodNever = class extends ZodType {
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.never,
          received: ctx.parsedType
        });
        return INVALID;
      }
    };
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    ZodVoid = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    ZodArray = class _ZodArray extends ZodType {
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            addIssueToContext(ctx, {
              code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i2) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i2));
          })).then((result2) => {
            return ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i2) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i2));
        });
        return ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new _ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new _ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new _ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodArray.create = (schema, params) => {
      return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    ZodObject = class _ZodObject extends ZodType {
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip") {
          } else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil.errToObj;
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: (issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: errorUtil.errToObj(message).message ?? defaultError
                };
              return {
                message: defaultError
              };
            }
          } : {}
        });
      }
      strip() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new _ZodObject({
          ...this._def,
          shape: () => ({
            ...this._def.shape(),
            ...augmentation
          })
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new _ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema) {
        return this.augment({ [key]: schema });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index) {
        return new _ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        for (const key of util.objectKeys(mask)) {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      omit(mask) {
        const shape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      required(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      keyof() {
        return createZodEnum(util.objectKeys(this.shape));
      }
    };
    ZodObject.create = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.strictCreate = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.lazycreate = (shape, params) => {
      return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodUnion = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError(issues2));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    ZodUnion.create = (types4, params) => {
      return new ZodUnion({
        options: types4,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    getDiscriminator = (type) => {
      if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
      } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
      } else if (type instanceof ZodLiteral) {
        return [type.value];
      } else if (type instanceof ZodEnum) {
        return type.options;
      } else if (type instanceof ZodNativeEnum) {
        return util.objectValues(type.enum);
      } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
      } else if (type instanceof ZodUndefined) {
        return [void 0];
      } else if (type instanceof ZodNull) {
        return [null];
      } else if (type instanceof ZodOptional) {
        return [void 0, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
      } else {
        return [];
      }
    };
    ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator]
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        } else {
          return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      /**
       * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
       * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
       * have a different value for each object in the union.
       * @param discriminator the name of the discriminator property
       * @param types an array of object schemas
       * @param params
       */
      static create(discriminator, options, params) {
        const optionsMap = /* @__PURE__ */ new Map();
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          }
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
              throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
          }
        }
        return new _ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    };
    ZodIntersection = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
          if (isAborted(parsedLeft) || isAborted(parsedRight)) {
            return INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_intersection_types
            });
            return INVALID;
          }
          if (isDirty(parsedLeft) || isDirty(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    ZodTuple = class _ZodTuple extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          if (!schema)
            return null;
          return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x2) => !!x2);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return ParseStatus.mergeArray(status, results);
          });
        } else {
          return ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new _ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    ZodRecord = class _ZodRecord extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
          pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (ctx.common.async) {
          return ParseStatus.mergeObjectAsync(status, pairs);
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        if (second instanceof ZodType) {
          return new _ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third)
          });
        }
        return new _ZodRecord({
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    };
    ZodMap = class extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.map,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    ZodSet = class _ZodSet extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.set,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i2) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i2)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new _ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new _ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    ZodFunction = class _ZodFunction extends ZodType {
      constructor() {
        super(...arguments);
        this.validate = this.implement;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.function,
            received: ctx.parsedType
          });
          return INVALID;
        }
        function makeArgsIssue(args, error2) {
          return makeIssue({
            data: args,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x2) => !!x2),
            issueData: {
              code: ZodIssueCode.invalid_arguments,
              argumentsError: error2
            }
          });
        }
        function makeReturnsIssue(returns, error2) {
          return makeIssue({
            data: returns,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x2) => !!x2),
            issueData: {
              code: ZodIssueCode.invalid_return_type,
              returnTypeError: error2
            }
          });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return OK(async function(...args) {
            const error2 = new ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch((e2) => {
              error2.addIssue(makeArgsIssue(args, e2));
              throw error2;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e2) => {
              error2.addIssue(makeReturnsIssue(result, e2));
              throw error2;
            });
            return parsedReturns;
          });
        } else {
          const me = this;
          return OK(function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
              throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
              throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
          });
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new _ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new _ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      static create(args, returns, params) {
        return new _ZodFunction({
          args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    };
    ZodLazy = class extends ZodType {
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    ZodLiteral = class extends ZodType {
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    ZodEnum = class _ZodEnum extends ZodType {
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return _ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    ZodEnum.create = createZodEnum;
    ZodNativeEnum = class extends ZodType {
      _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(util.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    ZodPromise = class extends ZodType {
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.promise,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    ZodPromise.create = (schema, params) => {
      return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    ZodEffects = class extends ZodType {
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: (arg) => {
            addIssueToContext(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          },
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return INVALID;
              if (result.status === "dirty")
                return DIRTY(result.value);
              if (status.value === "dirty")
                return DIRTY(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = (acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          };
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!isValid(base))
              return INVALID;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!isValid(base))
                return INVALID;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                status: status.value,
                value: result
              }));
            });
          }
        }
        util.assertNever(effect);
      }
    };
    ZodEffects.create = (schema, effect, params) => {
      return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
      return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    ZodOptional = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
          return OK(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    ZodNullable = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
          return OK(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    ZodDefault = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    ZodCatch = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if (isAsync(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    ZodNaN = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    BRAND = Symbol("zod_brand");
    ZodBranded = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    ZodPipeline = class _ZodPipeline extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return DIRTY(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          };
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a2, b) {
        return new _ZodPipeline({
          in: a2,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    ZodReadonly = class extends ZodType {
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
          if (isValid(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        };
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    late = {
      object: ZodObject.lazycreate
    };
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    instanceOfType = (cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data) => data instanceof cls, params);
    stringType = ZodString.create;
    numberType = ZodNumber.create;
    nanType = ZodNaN.create;
    bigIntType = ZodBigInt.create;
    booleanType = ZodBoolean.create;
    dateType = ZodDate.create;
    symbolType = ZodSymbol.create;
    undefinedType = ZodUndefined.create;
    nullType = ZodNull.create;
    anyType = ZodAny.create;
    unknownType = ZodUnknown.create;
    neverType = ZodNever.create;
    voidType = ZodVoid.create;
    arrayType = ZodArray.create;
    objectType = ZodObject.create;
    strictObjectType = ZodObject.strictCreate;
    unionType = ZodUnion.create;
    discriminatedUnionType = ZodDiscriminatedUnion.create;
    intersectionType = ZodIntersection.create;
    tupleType = ZodTuple.create;
    recordType = ZodRecord.create;
    mapType = ZodMap.create;
    setType = ZodSet.create;
    functionType = ZodFunction.create;
    lazyType = ZodLazy.create;
    literalType = ZodLiteral.create;
    enumType = ZodEnum.create;
    nativeEnumType = ZodNativeEnum.create;
    promiseType = ZodPromise.create;
    effectsType = ZodEffects.create;
    optionalType = ZodOptional.create;
    nullableType = ZodNullable.create;
    preprocessType = ZodEffects.createWithPreprocess;
    pipelineType = ZodPipeline.create;
    ostring = () => stringType().optional();
    onumber = () => numberType().optional();
    oboolean = () => booleanType().optional();
    coerce = {
      string: (arg) => ZodString.create({ ...arg, coerce: true }),
      number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
      boolean: (arg) => ZodBoolean.create({
        ...arg,
        coerce: true
      }),
      bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
      date: (arg) => ZodDate.create({ ...arg, coerce: true })
    };
    NEVER = INVALID;
  }
});

// examples/testapp-ssr/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});
var init_external = __esm({
  "examples/testapp-ssr/node_modules/zod/v3/external.js"() {
    init_errors();
    init_parseUtil();
    init_typeAliases();
    init_util();
    init_types();
    init_ZodError();
  }
});

// examples/testapp-ssr/node_modules/zod/index.js
var init_zod = __esm({
  "examples/testapp-ssr/node_modules/zod/index.js"() {
    init_external();
    init_external();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/csp/config.js
var ALGORITHMS, ALGORITHM_VALUES, cspAlgorithmSchema, cspHashSchema, ALLOWED_DIRECTIVES, allowedDirectivesSchema;
var init_config = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/csp/config.js"() {
    init_zod();
    ALGORITHMS = {
      "SHA-256": "sha256-",
      "SHA-384": "sha384-",
      "SHA-512": "sha512-"
    };
    ALGORITHM_VALUES = Object.values(ALGORITHMS);
    cspAlgorithmSchema = external_exports.enum(Object.keys(ALGORITHMS)).optional().default("SHA-256");
    cspHashSchema = external_exports.custom((value) => {
      if (typeof value !== "string") {
        return false;
      }
      return ALGORITHM_VALUES.some((allowedValue) => {
        return value.startsWith(allowedValue);
      });
    });
    ALLOWED_DIRECTIVES = [
      "base-uri",
      "child-src",
      "connect-src",
      "default-src",
      "fenced-frame-src",
      "font-src",
      "form-action",
      "frame-ancestors",
      "frame-src",
      "img-src",
      "manifest-src",
      "media-src",
      "object-src",
      "referrer",
      "report-to",
      "report-uri",
      "require-trusted-types-for",
      "sandbox",
      "trusted-types",
      "upgrade-insecure-requests",
      "worker-src"
    ];
    allowedDirectivesSchema = external_exports.custom((value) => {
      if (typeof value !== "string") {
        return false;
      }
      return ALLOWED_DIRECTIVES.some((allowedValue) => {
        return value.startsWith(allowedValue);
      });
    });
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/encryption.js
async function encryptString(key, raw) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
  const data = encoder.encode(raw);
  const buffer2 = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    data
  );
  return encodeHexUpperCase(iv) + encodeBase64(new Uint8Array(buffer2));
}
async function decryptString(key, encoded) {
  const iv = decodeHex(encoded.slice(0, IV_LENGTH));
  const dataArray = decodeBase64(encoded.slice(IV_LENGTH));
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    dataArray
  );
  const decryptedString = decoder.decode(decryptedBuffer);
  return decryptedString;
}
async function generateCspDigest(data, algorithm) {
  const hashBuffer = await crypto.subtle.digest(algorithm, encoder.encode(data));
  const hash = encodeBase64(new Uint8Array(hashBuffer));
  return `${ALGORITHMS[algorithm]}${hash}`;
}
var ALGORITHM, encoder, decoder, IV_LENGTH;
var init_encryption = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/encryption.js"() {
    init_dist();
    init_config();
    ALGORITHM = "AES-GCM";
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    IV_LENGTH = 24;
  }
});

// examples/testapp-ssr/node_modules/@astrojs/internal-helpers/dist/path.js
function appendForwardSlash(path) {
  return path.endsWith("/") ? path : path + "/";
}
function prependForwardSlash(path) {
  return path[0] === "/" ? path : "/" + path;
}
function collapseDuplicateTrailingSlashes(path, trailingSlash) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_TRAILING_SLASHES, trailingSlash ? "/" : "") || "/";
}
function removeTrailingForwardSlash(path) {
  return path.endsWith("/") ? path.slice(0, path.length - 1) : path;
}
function removeLeadingForwardSlash(path) {
  return path.startsWith("/") ? path.substring(1) : path;
}
function trimSlashes(path) {
  return path.replace(/^\/|\/$/g, "");
}
function isString(path) {
  return typeof path === "string" || path instanceof String;
}
function isInternalPath(path) {
  return INTERNAL_PREFIXES.has(path.slice(0, 2)) && !JUST_SLASHES.test(path);
}
function joinPaths(...paths) {
  return paths.filter(isString).map((path, i2) => {
    if (i2 === 0) {
      return removeTrailingForwardSlash(path);
    } else if (i2 === paths.length - 1) {
      return removeLeadingForwardSlash(path);
    } else {
      return trimSlashes(path);
    }
  }).join("/");
}
function isRemotePath(src) {
  if (!src) return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  let decoded = trimmed;
  let previousDecoded = "";
  let maxIterations = 10;
  while (decoded !== previousDecoded && maxIterations > 0) {
    previousDecoded = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
    maxIterations--;
  }
  if (/^[a-zA-Z]:/.test(decoded)) {
    return false;
  }
  if (decoded[0] === "/" && decoded[1] !== "/" && decoded[1] !== "\\") {
    return false;
  }
  if (decoded[0] === "\\") {
    return true;
  }
  if (decoded.startsWith("//")) {
    return true;
  }
  try {
    const url = new URL(decoded, "http://n");
    if (url.username || url.password) {
      return true;
    }
    if (decoded.includes("@") && !url.pathname.includes("@") && !url.search.includes("@")) {
      return true;
    }
    if (url.origin !== "http://n") {
      const protocol = url.protocol.toLowerCase();
      if (protocol === "file:") {
        return false;
      }
      return true;
    }
    if (URL.canParse(decoded)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}
function slash(path) {
  return path.replace(/\\/g, "/");
}
function fileExtension(path) {
  const ext = path.split(".").pop();
  return ext !== path ? `.${ext}` : "";
}
function hasFileExtension(path) {
  return WITH_FILE_EXT.test(path);
}
var MANY_TRAILING_SLASHES, INTERNAL_PREFIXES, JUST_SLASHES, WITH_FILE_EXT;
var init_path = __esm({
  "examples/testapp-ssr/node_modules/@astrojs/internal-helpers/dist/path.js"() {
    MANY_TRAILING_SLASHES = /\/{2,}$/g;
    INTERNAL_PREFIXES = /* @__PURE__ */ new Set(["/_", "/@", "/.", "//"]);
    JUST_SLASHES = /^\/{2,}$/;
    WITH_FILE_EXT = /\/[^/]+\.\w+$/;
  }
});

// examples/testapp-ssr/node_modules/@astrojs/internal-helpers/dist/remote.js
function matchPattern(url, remotePattern) {
  return matchProtocol(url, remotePattern.protocol) && matchHostname(url, remotePattern.hostname, true) && matchPort(url, remotePattern.port) && matchPathname(url, remotePattern.pathname, true);
}
function matchPort(url, port) {
  return !port || port === url.port;
}
function matchProtocol(url, protocol) {
  return !protocol || protocol === url.protocol.slice(0, -1);
}
function matchHostname(url, hostname, allowWildcard = false) {
  if (!hostname) {
    return true;
  } else if (!allowWildcard || !hostname.startsWith("*")) {
    return hostname === url.hostname;
  } else if (hostname.startsWith("**.")) {
    const slicedHostname = hostname.slice(2);
    return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
  } else if (hostname.startsWith("*.")) {
    const slicedHostname = hostname.slice(1);
    if (!url.hostname.endsWith(slicedHostname)) {
      return false;
    }
    const subdomainWithDot = url.hostname.slice(0, -(slicedHostname.length - 1));
    return subdomainWithDot.endsWith(".") && !subdomainWithDot.slice(0, -1).includes(".");
  }
  return false;
}
function matchPathname(url, pathname, allowWildcard = false) {
  if (!pathname) {
    return true;
  } else if (!allowWildcard || !pathname.endsWith("*")) {
    return pathname === url.pathname;
  } else if (pathname.endsWith("/**")) {
    const slicedPathname = pathname.slice(0, -2);
    return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
  } else if (pathname.endsWith("/*")) {
    const slicedPathname = pathname.slice(0, -1);
    if (!url.pathname.startsWith(slicedPathname)) {
      return false;
    }
    const additionalPathChunks = url.pathname.slice(slicedPathname.length).split("/").filter(Boolean);
    return additionalPathChunks.length === 1;
  }
  return false;
}
function isRemoteAllowed(src, {
  domains,
  remotePatterns
}) {
  if (!URL.canParse(src)) {
    return false;
  }
  const url = new URL(src);
  if (!["http:", "https:", "data:"].includes(url.protocol)) {
    return false;
  }
  return domains.some((domain) => matchHostname(url, domain)) || remotePatterns.some((remotePattern) => matchPattern(url, remotePattern));
}
var init_remote = __esm({
  "examples/testapp-ssr/node_modules/@astrojs/internal-helpers/dist/remote.js"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/errors/errors-data.js
var errors_data_exports = {};
__export(errors_data_exports, {
  ActionCalledFromServerError: () => ActionCalledFromServerError,
  ActionNotFoundError: () => ActionNotFoundError,
  ActionsCantBeLoaded: () => ActionsCantBeLoaded,
  ActionsReturnedInvalidDataError: () => ActionsReturnedInvalidDataError,
  ActionsWithoutServerOutputError: () => ActionsWithoutServerOutputError,
  AdapterSupportOutputMismatch: () => AdapterSupportOutputMismatch,
  AstroGlobNoMatch: () => AstroGlobNoMatch,
  AstroGlobUsedOutside: () => AstroGlobUsedOutside,
  AstroResponseHeadersReassigned: () => AstroResponseHeadersReassigned,
  CSSSyntaxError: () => CSSSyntaxError,
  CannotDetermineWeightAndStyleFromFontFile: () => CannotDetermineWeightAndStyleFromFontFile,
  CannotExtractFontType: () => CannotExtractFontType,
  CannotFetchFontFile: () => CannotFetchFontFile,
  CannotLoadFontProvider: () => CannotLoadFontProvider,
  CannotOptimizeSvg: () => CannotOptimizeSvg,
  CantRenderPage: () => CantRenderPage,
  ClientAddressNotAvailable: () => ClientAddressNotAvailable,
  ConfigLegacyKey: () => ConfigLegacyKey,
  ConfigNotFound: () => ConfigNotFound,
  ContentCollectionTypeMismatchError: () => ContentCollectionTypeMismatchError,
  ContentEntryDataError: () => ContentEntryDataError,
  ContentLoaderInvalidDataError: () => ContentLoaderInvalidDataError,
  ContentLoaderReturnsInvalidId: () => ContentLoaderReturnsInvalidId,
  ContentSchemaContainsSlugError: () => ContentSchemaContainsSlugError,
  CouldNotTransformImage: () => CouldNotTransformImage,
  CspNotEnabled: () => CspNotEnabled,
  DataCollectionEntryParseError: () => DataCollectionEntryParseError,
  DuplicateContentEntrySlugError: () => DuplicateContentEntrySlugError,
  EndpointDidNotReturnAResponse: () => EndpointDidNotReturnAResponse,
  EnvInvalidVariables: () => EnvInvalidVariables,
  ExpectedImage: () => ExpectedImage,
  ExpectedImageOptions: () => ExpectedImageOptions,
  ExpectedNotESMImage: () => ExpectedNotESMImage,
  ExperimentalFontsNotEnabled: () => ExperimentalFontsNotEnabled,
  FailedToFetchRemoteImageDimensions: () => FailedToFetchRemoteImageDimensions,
  FailedToFindPageMapSSR: () => FailedToFindPageMapSSR,
  FailedToLoadModuleSSR: () => FailedToLoadModuleSSR,
  FileGlobNotSupported: () => FileGlobNotSupported,
  FileParserNotFound: () => FileParserNotFound,
  FontFamilyNotFound: () => FontFamilyNotFound,
  ForbiddenRewrite: () => ForbiddenRewrite,
  GenerateContentTypesError: () => GenerateContentTypesError,
  GetEntryDeprecationError: () => GetEntryDeprecationError,
  GetStaticPathsExpectedParams: () => GetStaticPathsExpectedParams,
  GetStaticPathsInvalidRouteParam: () => GetStaticPathsInvalidRouteParam,
  GetStaticPathsRequired: () => GetStaticPathsRequired,
  ImageMissingAlt: () => ImageMissingAlt,
  ImageNotFound: () => ImageNotFound,
  IncompatibleDescriptorOptions: () => IncompatibleDescriptorOptions,
  IncorrectStrategyForI18n: () => IncorrectStrategyForI18n,
  InvalidComponentArgs: () => InvalidComponentArgs,
  InvalidContentEntryDataError: () => InvalidContentEntryDataError,
  InvalidContentEntryFrontmatterError: () => InvalidContentEntryFrontmatterError,
  InvalidContentEntrySlugError: () => InvalidContentEntrySlugError,
  InvalidDynamicRoute: () => InvalidDynamicRoute,
  InvalidFrontmatterInjectionError: () => InvalidFrontmatterInjectionError,
  InvalidGetStaticPathParam: () => InvalidGetStaticPathParam,
  InvalidGetStaticPathsEntry: () => InvalidGetStaticPathsEntry,
  InvalidGetStaticPathsReturn: () => InvalidGetStaticPathsReturn,
  InvalidGlob: () => InvalidGlob,
  InvalidImageService: () => InvalidImageService,
  InvalidPrerenderExport: () => InvalidPrerenderExport,
  LiveContentConfigError: () => LiveContentConfigError,
  LocalImageUsedWrongly: () => LocalImageUsedWrongly,
  LocalsNotAnObject: () => LocalsNotAnObject,
  LocalsReassigned: () => LocalsReassigned,
  MarkdownFrontmatterParseError: () => MarkdownFrontmatterParseError,
  MdxIntegrationMissingError: () => MdxIntegrationMissingError,
  MiddlewareCantBeLoaded: () => MiddlewareCantBeLoaded,
  MiddlewareNoDataOrNextCalled: () => MiddlewareNoDataOrNextCalled,
  MiddlewareNotAResponse: () => MiddlewareNotAResponse,
  MissingImageDimension: () => MissingImageDimension,
  MissingIndexForInternationalization: () => MissingIndexForInternationalization,
  MissingLocale: () => MissingLocale,
  MissingMediaQueryDirective: () => MissingMediaQueryDirective,
  MissingMiddlewareForInternationalization: () => MissingMiddlewareForInternationalization,
  MissingSharp: () => MissingSharp,
  MixedContentDataCollectionError: () => MixedContentDataCollectionError,
  NoAdapterInstalled: () => NoAdapterInstalled,
  NoAdapterInstalledServerIslands: () => NoAdapterInstalledServerIslands,
  NoClientEntrypoint: () => NoClientEntrypoint,
  NoClientOnlyHint: () => NoClientOnlyHint,
  NoImageMetadata: () => NoImageMetadata,
  NoMatchingImport: () => NoMatchingImport,
  NoMatchingRenderer: () => NoMatchingRenderer,
  NoMatchingStaticPathFound: () => NoMatchingStaticPathFound,
  NoPrerenderedRoutesWithDomains: () => NoPrerenderedRoutesWithDomains,
  OnlyResponseCanBeReturned: () => OnlyResponseCanBeReturned,
  PageNumberParamNotFound: () => PageNumberParamNotFound,
  PrerenderClientAddressNotAvailable: () => PrerenderClientAddressNotAvailable,
  PrerenderDynamicEndpointPathCollide: () => PrerenderDynamicEndpointPathCollide,
  PrerenderRouteConflict: () => PrerenderRouteConflict,
  RedirectWithNoLocation: () => RedirectWithNoLocation,
  RemoteImageNotAllowed: () => RemoteImageNotAllowed,
  RenderUndefinedEntryError: () => RenderUndefinedEntryError,
  ReservedSlotName: () => ReservedSlotName,
  ResponseSentError: () => ResponseSentError,
  RewriteWithBodyUsed: () => RewriteWithBodyUsed,
  RouteNotFound: () => RouteNotFound,
  ServerOnlyModule: () => ServerOnlyModule,
  SessionConfigMissingError: () => SessionConfigMissingError,
  SessionConfigWithoutFlagError: () => SessionConfigWithoutFlagError,
  SessionStorageInitError: () => SessionStorageInitError,
  SessionStorageSaveError: () => SessionStorageSaveError,
  SessionWithoutSupportedAdapterOutputError: () => SessionWithoutSupportedAdapterOutputError,
  StaticClientAddressNotAvailable: () => StaticClientAddressNotAvailable,
  UnhandledRejection: () => UnhandledRejection,
  UnknownCLIError: () => UnknownCLIError,
  UnknownCSSError: () => UnknownCSSError,
  UnknownCompilerError: () => UnknownCompilerError,
  UnknownConfigError: () => UnknownConfigError,
  UnknownContentCollectionError: () => UnknownContentCollectionError,
  UnknownError: () => UnknownError,
  UnknownFilesystemError: () => UnknownFilesystemError,
  UnknownMarkdownError: () => UnknownMarkdownError,
  UnknownViteError: () => UnknownViteError,
  UnsupportedConfigTransformError: () => UnsupportedConfigTransformError,
  UnsupportedExternalRedirect: () => UnsupportedExternalRedirect,
  UnsupportedImageConversion: () => UnsupportedImageConversion,
  UnsupportedImageFormat: () => UnsupportedImageFormat,
  i18nNoLocaleFoundInPath: () => i18nNoLocaleFoundInPath,
  i18nNotEnabled: () => i18nNotEnabled
});
var UnknownCompilerError, ClientAddressNotAvailable, PrerenderClientAddressNotAvailable, StaticClientAddressNotAvailable, NoMatchingStaticPathFound, OnlyResponseCanBeReturned, MissingMediaQueryDirective, NoMatchingRenderer, NoClientEntrypoint, NoClientOnlyHint, InvalidGetStaticPathParam, InvalidGetStaticPathsEntry, InvalidGetStaticPathsReturn, GetStaticPathsExpectedParams, GetStaticPathsInvalidRouteParam, GetStaticPathsRequired, ReservedSlotName, NoAdapterInstalled, AdapterSupportOutputMismatch, NoAdapterInstalledServerIslands, NoMatchingImport, InvalidPrerenderExport, InvalidComponentArgs, PageNumberParamNotFound, ImageMissingAlt, InvalidImageService, MissingImageDimension, FailedToFetchRemoteImageDimensions, RemoteImageNotAllowed, UnsupportedImageFormat, UnsupportedImageConversion, PrerenderDynamicEndpointPathCollide, PrerenderRouteConflict, ExpectedImage, ExpectedImageOptions, ExpectedNotESMImage, IncompatibleDescriptorOptions, ImageNotFound, NoImageMetadata, CouldNotTransformImage, ResponseSentError, MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse, EndpointDidNotReturnAResponse, LocalsNotAnObject, LocalsReassigned, AstroResponseHeadersReassigned, MiddlewareCantBeLoaded, LocalImageUsedWrongly, AstroGlobUsedOutside, AstroGlobNoMatch, RedirectWithNoLocation, UnsupportedExternalRedirect, InvalidDynamicRoute, MissingSharp, UnknownViteError, FailedToLoadModuleSSR, InvalidGlob, FailedToFindPageMapSSR, MissingLocale, MissingIndexForInternationalization, IncorrectStrategyForI18n, NoPrerenderedRoutesWithDomains, MissingMiddlewareForInternationalization, CantRenderPage, UnhandledRejection, i18nNotEnabled, i18nNoLocaleFoundInPath, RouteNotFound, EnvInvalidVariables, ServerOnlyModule, RewriteWithBodyUsed, ForbiddenRewrite, UnknownFilesystemError, CannotExtractFontType, CannotDetermineWeightAndStyleFromFontFile, CannotFetchFontFile, CannotLoadFontProvider, ExperimentalFontsNotEnabled, FontFamilyNotFound, CspNotEnabled, UnknownCSSError, CSSSyntaxError, UnknownMarkdownError, MarkdownFrontmatterParseError, InvalidFrontmatterInjectionError, MdxIntegrationMissingError, UnknownConfigError, ConfigNotFound, ConfigLegacyKey, UnknownCLIError, GenerateContentTypesError, UnknownContentCollectionError, RenderUndefinedEntryError, GetEntryDeprecationError, InvalidContentEntryFrontmatterError, InvalidContentEntryDataError, ContentLoaderReturnsInvalidId, ContentEntryDataError, LiveContentConfigError, ContentLoaderInvalidDataError, InvalidContentEntrySlugError, ContentSchemaContainsSlugError, MixedContentDataCollectionError, ContentCollectionTypeMismatchError, DataCollectionEntryParseError, DuplicateContentEntrySlugError, UnsupportedConfigTransformError, FileParserNotFound, FileGlobNotSupported, ActionsWithoutServerOutputError, ActionsReturnedInvalidDataError, ActionNotFoundError, ActionCalledFromServerError, UnknownError, ActionsCantBeLoaded, SessionStorageInitError, SessionStorageSaveError, SessionWithoutSupportedAdapterOutputError, SessionConfigMissingError, SessionConfigWithoutFlagError, CannotOptimizeSvg;
var init_errors_data = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/errors/errors-data.js"() {
    UnknownCompilerError = {
      name: "UnknownCompilerError",
      title: "Unknown compiler error.",
      hint: "This is almost always a problem with the Astro compiler, not your code. Please open an issue at https://astro.build/issues/compiler."
    };
    ClientAddressNotAvailable = {
      name: "ClientAddressNotAvailable",
      title: "`Astro.clientAddress` is not available in current adapter.",
      message: (adapterName) => `\`Astro.clientAddress\` is not available in the \`${adapterName}\` adapter. File an issue with the adapter to add support.`
    };
    PrerenderClientAddressNotAvailable = {
      name: "PrerenderClientAddressNotAvailable",
      title: "`Astro.clientAddress` cannot be used inside prerendered routes.",
      message: (name) => `\`Astro.clientAddress\` cannot be used inside prerendered route ${name}`
    };
    StaticClientAddressNotAvailable = {
      name: "StaticClientAddressNotAvailable",
      title: "`Astro.clientAddress` is not available in prerendered pages.",
      message: "`Astro.clientAddress` is only available on pages that are server-rendered.",
      hint: "See https://docs.astro.build/en/guides/on-demand-rendering/ for more information on how to enable SSR."
    };
    NoMatchingStaticPathFound = {
      name: "NoMatchingStaticPathFound",
      title: "No static path found for requested path.",
      message: (pathName) => `A \`getStaticPaths()\` route pattern was matched, but no matching static path was found for requested path \`${pathName}\`.`,
      hint: (possibleRoutes) => `Possible dynamic routes being matched: ${possibleRoutes.join(", ")}.`
    };
    OnlyResponseCanBeReturned = {
      name: "OnlyResponseCanBeReturned",
      title: "Invalid type returned by Astro page.",
      message: (route, returnedValue) => `Route \`${route ? route : ""}\` returned a \`${returnedValue}\`. Only a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) can be returned from Astro files.`,
      hint: "See https://docs.astro.build/en/guides/on-demand-rendering/#response for more information."
    };
    MissingMediaQueryDirective = {
      name: "MissingMediaQueryDirective",
      title: "Missing value for `client:media` directive.",
      message: 'Media query not provided for `client:media` directive. A media query similar to `client:media="(max-width: 600px)"` must be provided'
    };
    NoMatchingRenderer = {
      name: "NoMatchingRenderer",
      title: "No matching renderer found.",
      message: (componentName, componentExtension, plural, validRenderersCount) => `Unable to render \`${componentName}\`.

${validRenderersCount > 0 ? `There ${plural ? "are" : "is"} ${validRenderersCount} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render \`${componentName}\`.` : `No valid renderer was found ${componentExtension ? `for the \`.${componentExtension}\` file extension.` : `for this file extension.`}`}`,
      hint: (probableRenderers) => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/guides/framework-components/ for more information on how to install and configure integrations.`
    };
    NoClientEntrypoint = {
      name: "NoClientEntrypoint",
      title: "No client entrypoint specified in renderer.",
      message: (componentName, clientDirective, rendererName) => `\`${componentName}\` component has a \`client:${clientDirective}\` directive, but no client entrypoint was provided by \`${rendererName}\`.`,
      hint: "See https://docs.astro.build/en/reference/integrations-reference/#addrenderer-option for more information on how to configure your renderer."
    };
    NoClientOnlyHint = {
      name: "NoClientOnlyHint",
      title: "Missing hint on client:only directive.",
      message: (componentName) => `Unable to render \`${componentName}\`. When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
      hint: (probableRenderers) => `Did you mean to pass \`client:only="${probableRenderers}"\`? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`
    };
    InvalidGetStaticPathParam = {
      name: "InvalidGetStaticPathParam",
      title: "Invalid value returned by a `getStaticPaths` path.",
      message: (paramType) => `Invalid params given to \`getStaticPaths\` path. Expected an \`object\`, got \`${paramType}\``,
      hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    InvalidGetStaticPathsEntry = {
      name: "InvalidGetStaticPathsEntry",
      title: "Invalid entry inside getStaticPath's return value",
      message: (entryType) => `Invalid entry returned by getStaticPaths. Expected an object, got \`${entryType}\``,
      hint: "If you're using a `.map` call, you might be looking for `.flatMap()` instead. See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    InvalidGetStaticPathsReturn = {
      name: "InvalidGetStaticPathsReturn",
      title: "Invalid value returned by getStaticPaths.",
      message: (returnType) => `Invalid type returned by \`getStaticPaths\`. Expected an \`array\`, got \`${returnType}\``,
      hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    GetStaticPathsExpectedParams = {
      name: "GetStaticPathsExpectedParams",
      title: "Missing params property on `getStaticPaths` route.",
      message: "Missing or empty required `params` property on `getStaticPaths` route.",
      hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    GetStaticPathsInvalidRouteParam = {
      name: "GetStaticPathsInvalidRouteParam",
      title: "Invalid value for `getStaticPaths` route parameter.",
      message: (key, value, valueType) => `Invalid getStaticPaths route parameter for \`${key}\`. Expected undefined, a string or a number, received \`${valueType}\` (\`${value}\`)`,
      hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    GetStaticPathsRequired = {
      name: "GetStaticPathsRequired",
      title: "`getStaticPaths()` function required for dynamic routes.",
      message: "`getStaticPaths()` function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.",
      hint: `See https://docs.astro.build/en/guides/routing/#dynamic-routes for more information on dynamic routes.

	If you meant for this route to be server-rendered, set \`export const prerender = false;\` in the page.`
    };
    ReservedSlotName = {
      name: "ReservedSlotName",
      title: "Invalid slot name.",
      message: (slotName) => `Unable to create a slot named \`${slotName}\`. \`${slotName}\` is a reserved slot name. Please update the name of this slot.`
    };
    NoAdapterInstalled = {
      name: "NoAdapterInstalled",
      title: "Cannot use Server-side Rendering without an adapter.",
      message: `Cannot use server-rendered pages without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
      hint: "See https://docs.astro.build/en/guides/on-demand-rendering/ for more information."
    };
    AdapterSupportOutputMismatch = {
      name: "AdapterSupportOutputMismatch",
      title: "Adapter does not support server output.",
      message: (adapterName) => `The \`${adapterName}\` adapter is configured to output a static website, but the project contains server-rendered pages. Please install and configure the appropriate server adapter for your final deployment.`
    };
    NoAdapterInstalledServerIslands = {
      name: "NoAdapterInstalledServerIslands",
      title: "Cannot use Server Islands without an adapter.",
      message: `Cannot use server islands without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
      hint: "See https://docs.astro.build/en/guides/on-demand-rendering/ for more information."
    };
    NoMatchingImport = {
      name: "NoMatchingImport",
      title: "No import found for component.",
      message: (componentName) => `Could not render \`${componentName}\`. No matching import has been found for \`${componentName}\`.`,
      hint: "Please make sure the component is properly imported."
    };
    InvalidPrerenderExport = {
      name: "InvalidPrerenderExport",
      title: "Invalid prerender export.",
      message(prefix, suffix, isHydridOutput) {
        const defaultExpectedValue = isHydridOutput ? "false" : "true";
        let msg = `A \`prerender\` export has been detected, but its value cannot be statically analyzed.`;
        if (prefix !== "const") msg += `
Expected \`const\` declaration but got \`${prefix}\`.`;
        if (suffix !== "true")
          msg += `
Expected \`${defaultExpectedValue}\` value but got \`${suffix}\`.`;
        return msg;
      },
      hint: "Mutable values declared at runtime are not supported. Please make sure to use exactly `export const prerender = true`."
    };
    InvalidComponentArgs = {
      name: "InvalidComponentArgs",
      title: "Invalid component arguments.",
      message: (name) => `Invalid arguments passed to${name ? ` <${name}>` : ""} component.`,
      hint: "Astro components cannot be rendered directly via function call, such as `Component()` or `{items.map(Component)}`."
    };
    PageNumberParamNotFound = {
      name: "PageNumberParamNotFound",
      title: "Page number param not found.",
      message: (paramName) => `[paginate()] page number param \`${paramName}\` not found in your filepath.`,
      hint: "Rename your file to `[page].astro` or `[...page].astro`."
    };
    ImageMissingAlt = {
      name: "ImageMissingAlt",
      title: 'Image missing required "alt" property.',
      message: 'Image missing "alt" property. "alt" text is required to describe important images on the page.',
      hint: 'Use an empty string ("") for decorative images.'
    };
    InvalidImageService = {
      name: "InvalidImageService",
      title: "Error while loading image service.",
      message: "There was an error loading the configured image service. Please see the stack trace for more information."
    };
    MissingImageDimension = {
      name: "MissingImageDimension",
      title: "Missing image dimensions",
      message: (missingDimension, imageURL) => `Missing ${missingDimension === "both" ? "width and height attributes" : `${missingDimension} attribute`} for ${imageURL}. When using remote images, both dimensions are required in order to avoid CLS.`,
      hint: "If your image is inside your `src` folder, you probably meant to import it instead. See [the Imports guide for more information](https://docs.astro.build/en/guides/imports/#other-assets). You can also use `inferSize={true}` for remote images to get the original dimensions."
    };
    FailedToFetchRemoteImageDimensions = {
      name: "FailedToFetchRemoteImageDimensions",
      title: "Failed to retrieve remote image dimensions",
      message: (imageURL) => `Failed to get the dimensions for ${imageURL}.`,
      hint: "Verify your remote image URL is accurate, and that you are not using `inferSize` with a file located in your `public/` folder."
    };
    RemoteImageNotAllowed = {
      name: "RemoteImageNotAllowed",
      title: "Remote image is not allowed",
      message: (imageURL) => `Remote image ${imageURL} is not allowed by your image configuration.`,
      hint: "Update `image.domains` or `image.remotePatterns`, or remove `inferSize` for this image."
    };
    UnsupportedImageFormat = {
      name: "UnsupportedImageFormat",
      title: "Unsupported image format",
      message: (format2, imagePath, supportedFormats) => `Received unsupported format \`${format2}\` from \`${imagePath}\`. Currently only ${supportedFormats.join(
        ", "
      )} are supported by our image services.`,
      hint: "Using an `img` tag directly instead of the `Image` component might be what you're looking for."
    };
    UnsupportedImageConversion = {
      name: "UnsupportedImageConversion",
      title: "Unsupported image conversion",
      message: "Converting between vector (such as SVGs) and raster (such as PNGs and JPEGs) images is not currently supported."
    };
    PrerenderDynamicEndpointPathCollide = {
      name: "PrerenderDynamicEndpointPathCollide",
      title: "Prerendered dynamic endpoint has path collision.",
      message: (pathname) => `Could not render \`${pathname}\` with an \`undefined\` param as the generated path will collide during prerendering. Prevent passing \`undefined\` as \`params\` for the endpoint's \`getStaticPaths()\` function, or add an additional extension to the endpoint's filename.`,
      hint: (filename) => `Rename \`${filename}\` to \`${filename.replace(/\.(?:js|ts)/, (m2) => `.json` + m2)}\``
    };
    PrerenderRouteConflict = {
      name: "PrerenderRouteConflict",
      title: "Prerendered route generates the same path as another route.",
      message: (winningRoute, thisRoute, pathname) => `Could not render \`${pathname}\` from route \`${thisRoute}\` as it conflicts with higher priority route \`${winningRoute}\`.`,
      hint: (winningRoute, thisRoute) => `Ensure \`${thisRoute}\` and \`${winningRoute}\` don't generate the same static paths.`
    };
    ExpectedImage = {
      name: "ExpectedImage",
      title: "Expected src to be an image.",
      message: (src, typeofOptions, fullOptions) => `Expected \`src\` property for \`getImage\` or \`<Image />\` to be either an ESM imported image or a string with the path of a remote image. Received \`${src}\` (type: \`${typeofOptions}\`).

Full serialized options received: \`${fullOptions}\`.`,
      hint: "This error can often happen because of a wrong path. Make sure the path to your image is correct. If you're passing an async function, make sure to call and await it."
    };
    ExpectedImageOptions = {
      name: "ExpectedImageOptions",
      title: "Expected image options.",
      message: (options) => `Expected getImage() parameter to be an object. Received \`${options}\`.`
    };
    ExpectedNotESMImage = {
      name: "ExpectedNotESMImage",
      title: "Expected image options, not an ESM-imported image.",
      message: "An ESM-imported image cannot be passed directly to `getImage()`. Instead, pass an object with the image in the `src` property.",
      hint: "Try changing `getImage(myImage)` to `getImage({ src: myImage })`"
    };
    IncompatibleDescriptorOptions = {
      name: "IncompatibleDescriptorOptions",
      title: "Cannot set both `densities` and `widths`",
      message: "Only one of `densities` or `widths` can be specified. In most cases, you'll probably want to use only `widths` if you require specific widths.",
      hint: "Those attributes are used to construct a `srcset` attribute, which cannot have both `x` and `w` descriptors."
    };
    ImageNotFound = {
      name: "ImageNotFound",
      title: "Image not found.",
      message: (imagePath) => `Could not find requested image \`${imagePath}\`. Does it exist?`,
      hint: "This is often caused by a typo in the image path. Please make sure the file exists, and is spelled correctly."
    };
    NoImageMetadata = {
      name: "NoImageMetadata",
      title: "Could not process image metadata.",
      message: (imagePath) => `Could not process image metadata${imagePath ? ` for \`${imagePath}\`` : ""}.`,
      hint: "This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue."
    };
    CouldNotTransformImage = {
      name: "CouldNotTransformImage",
      title: "Could not transform image.",
      message: (imagePath) => `Could not transform image \`${imagePath}\`. See the stack trace for more information.`,
      hint: "This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue."
    };
    ResponseSentError = {
      name: "ResponseSentError",
      title: "Unable to set response.",
      message: "The response has already been sent to the browser and cannot be altered."
    };
    MiddlewareNoDataOrNextCalled = {
      name: "MiddlewareNoDataOrNextCalled",
      title: "The middleware didn't return a `Response`.",
      message: "Make sure your middleware returns a `Response` object, either directly or by returning the `Response` from calling the `next` function."
    };
    MiddlewareNotAResponse = {
      name: "MiddlewareNotAResponse",
      title: "The middleware returned something that is not a `Response` object.",
      message: "Any data returned from middleware must be a valid `Response` object."
    };
    EndpointDidNotReturnAResponse = {
      name: "EndpointDidNotReturnAResponse",
      title: "The endpoint did not return a `Response`.",
      message: "An endpoint must return either a `Response`, or a `Promise` that resolves with a `Response`."
    };
    LocalsNotAnObject = {
      name: "LocalsNotAnObject",
      title: "Value assigned to `locals` is not accepted.",
      message: "`locals` can only be assigned to an object. Other values like numbers, strings, etc. are not accepted.",
      hint: "If you tried to remove some information from the `locals` object, try to use `delete` or set the property to `undefined`."
    };
    LocalsReassigned = {
      name: "LocalsReassigned",
      title: "`locals` must not be reassigned.",
      message: "`locals` can not be assigned directly.",
      hint: "Set a `locals` property instead."
    };
    AstroResponseHeadersReassigned = {
      name: "AstroResponseHeadersReassigned",
      title: "`Astro.response.headers` must not be reassigned.",
      message: "Individual headers can be added to and removed from `Astro.response.headers`, but it must not be replaced with another instance of `Headers` altogether.",
      hint: "Consider using `Astro.response.headers.add()`, and `Astro.response.headers.delete()`."
    };
    MiddlewareCantBeLoaded = {
      name: "MiddlewareCantBeLoaded",
      title: "Can't load the middleware.",
      message: "An unknown error was thrown while loading your middleware."
    };
    LocalImageUsedWrongly = {
      name: "LocalImageUsedWrongly",
      title: "Local images must be imported.",
      message: (imageFilePath) => `\`Image\`'s and \`getImage\`'s \`src\` parameter must be an imported image or an URL, it cannot be a string filepath. Received \`${imageFilePath}\`.`,
      hint: "If you want to use an image from your `src` folder, you need to either import it or if the image is coming from a content collection, use the [image() schema helper](https://docs.astro.build/en/guides/images/#images-in-content-collections). See https://docs.astro.build/en/guides/images/#src-required for more information on the `src` property."
    };
    AstroGlobUsedOutside = {
      name: "AstroGlobUsedOutside",
      title: "Astro.glob() used outside of an Astro file.",
      message: (globStr) => `\`Astro.glob(${globStr})\` can only be used in \`.astro\` files. \`import.meta.glob(${globStr})\` can be used instead to achieve a similar result.`,
      hint: "See Vite's documentation on `import.meta.glob` for more information: https://vite.dev/guide/features.html#glob-import"
    };
    AstroGlobNoMatch = {
      name: "AstroGlobNoMatch",
      title: "Astro.glob() did not match any files.",
      message: (globStr) => `\`Astro.glob(${globStr})\` did not return any matching files.`,
      hint: "Check the pattern for typos."
    };
    RedirectWithNoLocation = {
      name: "RedirectWithNoLocation",
      title: "A redirect must be given a location with the `Location` header."
    };
    UnsupportedExternalRedirect = {
      name: "UnsupportedExternalRedirect",
      title: "Unsupported or malformed URL.",
      message: (from, to) => `The destination URL in the external redirect from "${from}" to "${to}" is unsupported.`,
      hint: "An external redirect must start with http or https, and must be a valid URL."
    };
    InvalidDynamicRoute = {
      name: "InvalidDynamicRoute",
      title: "Invalid dynamic route.",
      message: (route, invalidParam, received) => `The ${invalidParam} param for route ${route} is invalid. Received **${received}**.`
    };
    MissingSharp = {
      name: "MissingSharp",
      title: "Could not find Sharp.",
      message: "Could not find Sharp. Please install Sharp (`sharp`) manually into your project or migrate to another image service.",
      hint: "See Sharp's installation instructions for more information: https://sharp.pixelplumbing.com/install. If you are not relying on `astro:assets` to optimize, transform, or process any images, you can configure a passthrough image service instead of installing Sharp. See https://docs.astro.build/en/reference/errors/missing-sharp for more information.\n\nSee https://docs.astro.build/en/guides/images/#default-image-service for more information on how to migrate to another image service."
    };
    UnknownViteError = {
      name: "UnknownViteError",
      title: "Unknown Vite Error."
    };
    FailedToLoadModuleSSR = {
      name: "FailedToLoadModuleSSR",
      title: "Could not import file.",
      message: (importName) => `Could not import \`${importName}\`.`,
      hint: "This is often caused by a typo in the import path. Please make sure the file exists."
    };
    InvalidGlob = {
      name: "InvalidGlob",
      title: "Invalid glob pattern.",
      message: (globPattern) => `Invalid glob pattern: \`${globPattern}\`. Glob patterns must start with './', '../' or '/'.`,
      hint: "See https://docs.astro.build/en/guides/imports/#glob-patterns for more information on supported glob patterns."
    };
    FailedToFindPageMapSSR = {
      name: "FailedToFindPageMapSSR",
      title: "Astro couldn't find the correct page to render",
      message: "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error. Please file an issue."
    };
    MissingLocale = {
      name: "MissingLocaleError",
      title: "The provided locale does not exist.",
      message: (locale) => `The locale/path \`${locale}\` does not exist in the configured \`i18n.locales\`.`
    };
    MissingIndexForInternationalization = {
      name: "MissingIndexForInternationalizationError",
      title: "Index page not found.",
      message: (defaultLocale) => `Could not find index page. A root index page is required in order to create a redirect to the index URL of the default locale. (\`/${defaultLocale}\`)`,
      hint: (src) => `Create an index page (\`index.astro, index.md, etc.\`) in \`${src}\`.`
    };
    IncorrectStrategyForI18n = {
      name: "IncorrectStrategyForI18n",
      title: "You can't use the current function with the current strategy",
      message: (functionName) => `The function \`${functionName}\` can only be used when the \`i18n.routing.strategy\` is set to \`"manual"\`.`
    };
    NoPrerenderedRoutesWithDomains = {
      name: "NoPrerenderedRoutesWithDomains",
      title: "Prerendered routes aren't supported when internationalization domains are enabled.",
      message: (component) => `Static pages aren't yet supported with multiple domains. To enable this feature, you must disable prerendering for the page ${component}`
    };
    MissingMiddlewareForInternationalization = {
      name: "MissingMiddlewareForInternationalization",
      title: "Enabled manual internationalization routing without having a middleware.",
      message: "Your configuration setting `i18n.routing: 'manual'` requires you to provide your own i18n `middleware` file."
    };
    CantRenderPage = {
      name: "CantRenderPage",
      title: "Astro can't render the route.",
      message: "Astro cannot find any content to render for this route. There is no file or redirect associated with this route.",
      hint: "If you expect to find a route here, this may be an Astro bug. Please file an issue/restart the dev server"
    };
    UnhandledRejection = {
      name: "UnhandledRejection",
      title: "Unhandled rejection",
      message: (stack) => `Astro detected an unhandled rejection. Here's the stack trace:
${stack}`,
      hint: "Make sure your promises all have an `await` or a `.catch()` handler."
    };
    i18nNotEnabled = {
      name: "i18nNotEnabled",
      title: "i18n Not Enabled",
      message: "The `astro:i18n` module can not be used without enabling i18n in your Astro config.",
      hint: "See https://docs.astro.build/en/guides/internationalization for a guide on setting up i18n."
    };
    i18nNoLocaleFoundInPath = {
      name: "i18nNoLocaleFoundInPath",
      title: "The path doesn't contain any locale",
      message: "You tried to use an i18n utility on a path that doesn't contain any locale. You can use `pathHasLocale` first to determine if the path has a locale."
    };
    RouteNotFound = {
      name: "RouteNotFound",
      title: "Route not found.",
      message: `Astro could not find a route that matches the one you requested.`
    };
    EnvInvalidVariables = {
      name: "EnvInvalidVariables",
      title: "Invalid Environment Variables",
      message: (errors) => `The following environment variables defined in \`env.schema\` are invalid:

${errors.map((err) => `- ${err}`).join("\n")}
`
    };
    ServerOnlyModule = {
      name: "ServerOnlyModule",
      title: "Module is only available server-side",
      message: (name) => `The "${name}" module is only available server-side.`
    };
    RewriteWithBodyUsed = {
      name: "RewriteWithBodyUsed",
      title: "Cannot use Astro.rewrite after the request body has been read",
      message: "Astro.rewrite() cannot be used if the request body has already been read. If you need to read the body, first clone the request."
    };
    ForbiddenRewrite = {
      name: "ForbiddenRewrite",
      title: "Forbidden rewrite to a static route.",
      message: (from, to, component) => `You tried to rewrite the on-demand route '${from}' with the static route '${to}', when using the 'server' output. 

The static route '${to}' is rendered by the component
'${component}', which is marked as prerendered. This is a forbidden operation because during the build the component '${component}' is compiled to an
HTML file, which can't be retrieved at runtime by Astro.`,
      hint: (component) => `Add \`export const prerender = false\` to the component '${component}', or use a Astro.redirect().`
    };
    UnknownFilesystemError = {
      name: "UnknownFilesystemError",
      title: "An unknown error occurred while reading or writing files to disk.",
      hint: "It can be caused by many things, eg. missing permissions or a file not existing we attempt to read. Check the error cause for more details."
    };
    CannotExtractFontType = {
      name: "CannotExtractFontType",
      title: "Cannot extract the font type from the given URL.",
      message: (url) => `An error occurred while trying to extract the font type from ${url}`,
      hint: "Open an issue at https://github.com/withastro/astro/issues."
    };
    CannotDetermineWeightAndStyleFromFontFile = {
      name: "CannotDetermineWeightAndStyleFromFontFile",
      title: "Cannot determine weight and style from font file.",
      message: (family, url) => `An error occurred while determining the \`weight\` and \`style\` from local family "${family}" font file: ${url}`,
      hint: "Update your family config and set `weight` and `style` manually instead."
    };
    CannotFetchFontFile = {
      name: "CannotFetchFontFile",
      title: "Cannot fetch the given font file.",
      message: (url) => `An error occurred while fetching the font file from ${url}`,
      hint: "This is often caused by connectivity issues. If the error persists, open an issue at https://github.com/withastro/astro/issues."
    };
    CannotLoadFontProvider = {
      name: "CannotLoadFontProvider",
      title: "Cannot load font provider",
      message: (entrypoint) => `An error occurred while loading the "${entrypoint}" provider.`,
      hint: "This is an issue with the font provider. Please open an issue on their repository."
    };
    ExperimentalFontsNotEnabled = {
      name: "ExperimentalFontsNotEnabled",
      title: "Experimental fonts are not enabled",
      message: "The Font component is used but experimental fonts have not been registered in the config.",
      hint: "Check that you have enabled experimental fonts and also configured your preferred fonts."
    };
    FontFamilyNotFound = {
      name: "FontFamilyNotFound",
      title: "Font family not found",
      message: (family) => `No data was found for the \`"${family}"\` family passed to the \`<Font>\` component.`,
      hint: "This is often caused by a typo. Check that the `<Font />` component is using a `cssVariable` specified in your config."
    };
    CspNotEnabled = {
      name: "CspNotEnabled",
      title: "CSP feature isn't enabled",
      message: "The `experimental.csp` configuration isn't enabled."
    };
    UnknownCSSError = {
      name: "UnknownCSSError",
      title: "Unknown CSS Error."
    };
    CSSSyntaxError = {
      name: "CSSSyntaxError",
      title: "CSS Syntax Error."
    };
    UnknownMarkdownError = {
      name: "UnknownMarkdownError",
      title: "Unknown Markdown Error."
    };
    MarkdownFrontmatterParseError = {
      name: "MarkdownFrontmatterParseError",
      title: "Failed to parse Markdown frontmatter."
    };
    InvalidFrontmatterInjectionError = {
      name: "InvalidFrontmatterInjectionError",
      title: "Invalid frontmatter injection.",
      message: 'A remark or rehype plugin attempted to inject invalid frontmatter. Ensure "astro.frontmatter" is set to a valid JSON object that is not `null` or `undefined`.',
      hint: "See the frontmatter injection docs https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically for more information."
    };
    MdxIntegrationMissingError = {
      name: "MdxIntegrationMissingError",
      title: "MDX integration missing.",
      message: (file) => `Unable to render ${file}. Ensure that the \`@astrojs/mdx\` integration is installed.`,
      hint: "See the MDX integration docs for installation and usage instructions: https://docs.astro.build/en/guides/integrations-guide/mdx/"
    };
    UnknownConfigError = {
      name: "UnknownConfigError",
      title: "Unknown configuration error."
    };
    ConfigNotFound = {
      name: "ConfigNotFound",
      title: "Specified configuration file not found.",
      message: (configFile) => `Unable to resolve \`--config "${configFile}"\`. Does the file exist?`
    };
    ConfigLegacyKey = {
      name: "ConfigLegacyKey",
      title: "Legacy configuration detected.",
      message: (legacyConfigKey) => `Legacy configuration detected: \`${legacyConfigKey}\`.`,
      hint: "Please update your configuration to the new format.\nSee https://astro.build/config for more information."
    };
    UnknownCLIError = {
      name: "UnknownCLIError",
      title: "Unknown CLI Error."
    };
    GenerateContentTypesError = {
      name: "GenerateContentTypesError",
      title: "Failed to generate content types.",
      message: (errorMessage) => `\`astro sync\` command failed to generate content collection types: ${errorMessage}`,
      hint: (fileName) => `This error is often caused by a syntax error inside your content, or your content configuration file. Check your ${fileName ?? "content config"} file for typos.`
    };
    UnknownContentCollectionError = {
      name: "UnknownContentCollectionError",
      title: "Unknown Content Collection Error."
    };
    RenderUndefinedEntryError = {
      name: "RenderUndefinedEntryError",
      title: "Attempted to render an undefined content collection entry.",
      hint: "Check if the entry is undefined before passing it to `render()`"
    };
    GetEntryDeprecationError = {
      name: "GetEntryDeprecationError",
      title: "Invalid use of `getDataEntryById` or `getEntryBySlug` function.",
      message: (collection, method) => `The \`${method}\` function is deprecated and cannot be used to query the "${collection}" collection. Use \`getEntry\` instead.`,
      hint: "Use the `getEntry` or `getCollection` functions to query content layer collections."
    };
    InvalidContentEntryFrontmatterError = {
      name: "InvalidContentEntryFrontmatterError",
      title: "Content entry frontmatter does not match schema.",
      message(collection, entryId, error2) {
        return [
          `**${String(collection)} \u2192 ${String(
            entryId
          )}** frontmatter does not match collection schema.`,
          ...error2.errors.map((zodError) => zodError.message)
        ].join("\n");
      },
      hint: "See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas."
    };
    InvalidContentEntryDataError = {
      name: "InvalidContentEntryDataError",
      title: "Content entry data does not match schema.",
      message(collection, entryId, error2) {
        return [
          `**${String(collection)} \u2192 ${String(entryId)}** data does not match collection schema.
`,
          ...error2.errors.map((zodError) => `  **${zodError.path.join(".")}**: ${zodError.message}`),
          ""
        ].join("\n");
      },
      hint: "See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas."
    };
    ContentLoaderReturnsInvalidId = {
      name: "ContentLoaderReturnsInvalidId",
      title: "Content loader returned an entry with an invalid `id`.",
      message(collection, entry) {
        return [
          `The content loader for the collection **${String(collection)}** returned an entry with an invalid \`id\`:`,
          JSON.stringify(entry, null, 2)
        ].join("\n");
      },
      hint: "Make sure that the `id` of the entry is a string. See https://docs.astro.build/en/guides/content-collections/ for more information on content loaders."
    };
    ContentEntryDataError = {
      name: "ContentEntryDataError",
      title: "Content entry data does not match schema.",
      message(collection, entryId, error2) {
        return [
          `**${String(collection)} \u2192 ${String(entryId)}** data does not match collection schema.
`,
          ...error2.errors.map((zodError) => `  **${zodError.path.join(".")}**: ${zodError.message}`),
          ""
        ].join("\n");
      },
      hint: "See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas."
    };
    LiveContentConfigError = {
      name: "LiveContentConfigError",
      title: "Error in live content config.",
      message: (error2, filename) => `${error2} Check your collection definitions in ${filename ?? "your live content config file"}.`,
      hint: "See https://docs.astro.build/en/reference/experimental-flags/live-content-collections/ for more information on live content collections."
    };
    ContentLoaderInvalidDataError = {
      name: "ContentLoaderInvalidDataError",
      title: "Content entry is missing an ID",
      message(collection, extra) {
        return `**${String(collection)}** entry is missing an ID.
${extra}`;
      },
      hint: "See https://docs.astro.build/en/guides/content-collections/ for more information on content loaders."
    };
    InvalidContentEntrySlugError = {
      name: "InvalidContentEntrySlugError",
      title: "Invalid content entry slug.",
      message(collection, entryId) {
        return `${String(collection)} \u2192 ${String(
          entryId
        )} has an invalid slug. \`slug\` must be a string.`;
      },
      hint: "See https://docs.astro.build/en/guides/content-collections/ for more on the `slug` field."
    };
    ContentSchemaContainsSlugError = {
      name: "ContentSchemaContainsSlugError",
      title: "Content Schema should not contain `slug`.",
      message: (collectionName) => `A content collection schema should not contain \`slug\` since it is reserved for slug generation. Remove this from your ${collectionName} collection schema.`,
      hint: "See https://docs.astro.build/en/guides/content-collections/ for more on the `slug` field."
    };
    MixedContentDataCollectionError = {
      name: "MixedContentDataCollectionError",
      title: "Content and data cannot be in same collection.",
      message: (collectionName) => `**${collectionName}** contains a mix of content and data entries. All entries must be of the same type.`,
      hint: "Store data entries in a new collection separate from your content collection."
    };
    ContentCollectionTypeMismatchError = {
      name: "ContentCollectionTypeMismatchError",
      title: "Collection contains entries of a different type.",
      message: (collection, expectedType, actualType) => `${collection} contains ${expectedType} entries, but is configured as a ${actualType} collection.`
    };
    DataCollectionEntryParseError = {
      name: "DataCollectionEntryParseError",
      title: "Data collection entry failed to parse.",
      message(entryId, errorMessage) {
        return `**${entryId}** failed to parse: ${errorMessage}`;
      },
      hint: "Ensure your data entry is an object with valid JSON (for `.json` entries), YAML (for `.yaml` entries) or TOML (for `.toml` entries)."
    };
    DuplicateContentEntrySlugError = {
      name: "DuplicateContentEntrySlugError",
      title: "Duplicate content entry slug.",
      message(collection, slug, preExisting, alsoFound) {
        return `**${collection}** contains multiple entries with the same slug: \`${slug}\`. Slugs must be unique.

Entries: 
- ${preExisting}
- ${alsoFound}`;
      }
    };
    UnsupportedConfigTransformError = {
      name: "UnsupportedConfigTransformError",
      title: "Unsupported transform in content config.",
      message: (parseError) => `\`transform()\` functions in your content config must return valid JSON, or data types compatible with the devalue library (including Dates, Maps, and Sets).
Full error: ${parseError}`,
      hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
    };
    FileParserNotFound = {
      name: "FileParserNotFound",
      title: "File parser not found",
      message: (fileName) => `No parser was found for '${fileName}'. Pass a parser function (e.g. \`parser: csv\`) to the \`file\` loader.`
    };
    FileGlobNotSupported = {
      name: "FileGlobNotSupported",
      title: "Glob patterns are not supported in the file loader",
      message: "Glob patterns are not supported in the `file` loader. Use the `glob` loader instead.",
      hint: `See Astro's built-in file and glob loaders https://docs.astro.build/en/guides/content-collections/#built-in-loaders for supported usage.`
    };
    ActionsWithoutServerOutputError = {
      name: "ActionsWithoutServerOutputError",
      title: "Actions must be used with server output.",
      message: "A server is required to create callable backend functions. To deploy routes to a server, add an adapter to your Astro config and configure your route for on-demand rendering",
      hint: "Add an adapter and enable on-demand rendering: https://docs.astro.build/en/guides/on-demand-rendering/"
    };
    ActionsReturnedInvalidDataError = {
      name: "ActionsReturnedInvalidDataError",
      title: "Action handler returned invalid data.",
      message: (error2) => `Action handler returned invalid data. Handlers should return serializable data types like objects, arrays, strings, and numbers. Parse error: ${error2}`,
      hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
    };
    ActionNotFoundError = {
      name: "ActionNotFoundError",
      title: "Action not found.",
      message: (actionName) => `The server received a request for an action named \`${actionName}\` but could not find a match. If you renamed an action, check that you've updated your \`actions/index\` file and your calling code to match.`,
      hint: "You can run `astro check` to detect type errors caused by mismatched action names."
    };
    ActionCalledFromServerError = {
      name: "ActionCalledFromServerError",
      title: "Action unexpected called from the server.",
      message: "Action called from a server page or endpoint without using `Astro.callAction()`. This wrapper must be used to call actions from server code.",
      hint: "See the `Astro.callAction()` reference for usage examples: https://docs.astro.build/en/reference/api-reference/#callaction"
    };
    UnknownError = { name: "UnknownError", title: "Unknown Error." };
    ActionsCantBeLoaded = {
      name: "ActionsCantBeLoaded",
      title: "Can't load the Astro actions.",
      message: "An unknown error was thrown while loading the Astro actions file."
    };
    SessionStorageInitError = {
      name: "SessionStorageInitError",
      title: "Session storage could not be initialized.",
      message: (error2, driver) => `Error when initializing session storage${driver ? ` with driver \`${driver}\`` : ""}. \`${error2 ?? ""}\``,
      hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
    };
    SessionStorageSaveError = {
      name: "SessionStorageSaveError",
      title: "Session data could not be saved.",
      message: (error2, driver) => `Error when saving session data${driver ? ` with driver \`${driver}\`` : ""}. \`${error2 ?? ""}\``,
      hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
    };
    SessionWithoutSupportedAdapterOutputError = {
      name: "SessionWithoutSupportedAdapterOutputError",
      title: "Sessions cannot be used with an adapter that doesn't support server output.",
      message: 'Sessions require an adapter that supports server output. The adapter must set `"server"` in the `buildOutput` adapter feature.',
      hint: 'Ensure your adapter supports `buildOutput: "server"`: https://docs.astro.build/en/reference/adapter-reference/#building-an-adapter'
    };
    SessionConfigMissingError = {
      name: "SessionConfigMissingError",
      title: "Session storage was enabled but not configured.",
      message: "The `experimental.session` flag was set to `true`, but no storage was configured. Either configure the storage manually or use an adapter that provides session storage",
      hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
    };
    SessionConfigWithoutFlagError = {
      name: "SessionConfigWithoutFlagError",
      title: "Session flag not set",
      message: "Session config was provided without enabling the `experimental.session` flag",
      hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
    };
    CannotOptimizeSvg = {
      name: "CannotOptimizeSvg",
      title: "Cannot optimize SVG",
      message: (path) => `An error occurred while optimizing SVG file "${path}" with SVGO.`,
      hint: "Review the included SVGO error message provided for guidance."
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/errors/utils.js
function normalizeLF(code) {
  return code.replace(/\r\n|\r(?!\n)|\n/g, "\n");
}
var init_utils = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/errors/utils.js"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/errors/printer.js
function codeFrame(src, loc) {
  if (!loc || loc.line === void 0 || loc.column === void 0) {
    return "";
  }
  const lines = normalizeLF(src).split("\n").map((ln) => ln.replace(/\t/g, "  "));
  const visibleLines = [];
  for (let n5 = -2; n5 <= 2; n5++) {
    if (lines[loc.line + n5]) visibleLines.push(loc.line + n5);
  }
  let gutterWidth = 0;
  for (const lineNo of visibleLines) {
    let w2 = `> ${lineNo}`;
    if (w2.length > gutterWidth) gutterWidth = w2.length;
  }
  let output = "";
  for (const lineNo of visibleLines) {
    const isFocusedLine = lineNo === loc.line - 1;
    output += isFocusedLine ? "> " : "  ";
    output += `${lineNo + 1} | ${lines[lineNo]}
`;
    if (isFocusedLine)
      output += `${Array.from({ length: gutterWidth }).join(" ")}  | ${Array.from({
        length: loc.column
      }).join(" ")}^
`;
  }
  return output;
}
var init_printer = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/errors/printer.js"() {
    init_utils();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/errors/errors.js
var AstroError, AstroUserError;
var init_errors2 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/errors/errors.js"() {
    init_printer();
    AstroError = class extends Error {
      loc;
      title;
      hint;
      frame;
      type = "AstroError";
      constructor(props, options) {
        const { name, title, message, stack, location, hint, frame } = props;
        super(message, options);
        this.title = title;
        this.name = name;
        if (message) this.message = message;
        this.stack = stack ? stack : this.stack;
        this.loc = location;
        this.hint = hint;
        this.frame = frame;
      }
      setLocation(location) {
        this.loc = location;
      }
      setName(name) {
        this.name = name;
      }
      setMessage(message) {
        this.message = message;
      }
      setHint(hint) {
        this.hint = hint;
      }
      setFrame(source, location) {
        this.frame = codeFrame(source, location);
      }
      static is(err) {
        return err?.type === "AstroError";
      }
    };
    AstroUserError = class extends Error {
      type = "AstroUserError";
      /**
       * A message that explains to the user how they can fix the error.
       */
      hint;
      name = "AstroUserError";
      constructor(message, hint) {
        super();
        this.message = message;
        this.hint = hint;
      }
      static is(err) {
        return err?.type === "AstroUserError";
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/errors/zod-error-map.js
var init_zod_error_map = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/errors/zod-error-map.js"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/errors/index.js
var init_errors3 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/errors/index.js"() {
    init_errors2();
    init_errors_data();
    init_utils();
    init_zod_error_map();
  }
});

// examples/testapp-ssr/node_modules/piccolore/dist/index.js
var e, t, n, r, i, a, o, s;
var init_dist2 = __esm({
  "examples/testapp-ssr/node_modules/piccolore/dist/index.js"() {
    e = globalThis.process || {};
    t = e.argv || [];
    n = e.env || {};
    r = !(n.NO_COLOR || t.includes(`--no-color`)) && (!!n.FORCE_COLOR || t.includes(`--color`) || e.platform === `win32` || (e.stdout || {}).isTTY && n.TERM !== `dumb` || !!n.CI);
    i = (e2, t4, n5 = e2) => (r5) => {
      let i2 = `` + r5, o4 = i2.indexOf(t4, e2.length);
      return ~o4 ? e2 + a(i2, t4, n5, o4) + t4 : e2 + i2 + t4;
    };
    a = (e2, t4, n5, r5) => {
      let i2 = ``, a2 = 0;
      do
        i2 += e2.substring(a2, r5) + n5, a2 = r5 + t4.length, r5 = e2.indexOf(t4, a2);
      while (~r5);
      return i2 + e2.substring(a2);
    };
    o = (e2 = r) => {
      let t4 = e2 ? i : () => String;
      return { isColorSupported: e2, reset: t4(`\x1B[0m`, `\x1B[0m`), bold: t4(`\x1B[1m`, `\x1B[22m`, `\x1B[22m\x1B[1m`), dim: t4(`\x1B[2m`, `\x1B[22m`, `\x1B[22m\x1B[2m`), italic: t4(`\x1B[3m`, `\x1B[23m`), underline: t4(`\x1B[4m`, `\x1B[24m`), inverse: t4(`\x1B[7m`, `\x1B[27m`), hidden: t4(`\x1B[8m`, `\x1B[28m`), strikethrough: t4(`\x1B[9m`, `\x1B[29m`), black: t4(`\x1B[30m`, `\x1B[39m`), red: t4(`\x1B[31m`, `\x1B[39m`), green: t4(`\x1B[32m`, `\x1B[39m`), yellow: t4(`\x1B[33m`, `\x1B[39m`), blue: t4(`\x1B[34m`, `\x1B[39m`), magenta: t4(`\x1B[35m`, `\x1B[39m`), cyan: t4(`\x1B[36m`, `\x1B[39m`), white: t4(`\x1B[37m`, `\x1B[39m`), gray: t4(`\x1B[90m`, `\x1B[39m`), bgBlack: t4(`\x1B[40m`, `\x1B[49m`), bgRed: t4(`\x1B[41m`, `\x1B[49m`), bgGreen: t4(`\x1B[42m`, `\x1B[49m`), bgYellow: t4(`\x1B[43m`, `\x1B[49m`), bgBlue: t4(`\x1B[44m`, `\x1B[49m`), bgMagenta: t4(`\x1B[45m`, `\x1B[49m`), bgCyan: t4(`\x1B[46m`, `\x1B[49m`), bgWhite: t4(`\x1B[47m`, `\x1B[49m`), blackBright: t4(`\x1B[90m`, `\x1B[39m`), redBright: t4(`\x1B[91m`, `\x1B[39m`), greenBright: t4(`\x1B[92m`, `\x1B[39m`), yellowBright: t4(`\x1B[93m`, `\x1B[39m`), blueBright: t4(`\x1B[94m`, `\x1B[39m`), magentaBright: t4(`\x1B[95m`, `\x1B[39m`), cyanBright: t4(`\x1B[96m`, `\x1B[39m`), whiteBright: t4(`\x1B[97m`, `\x1B[39m`), bgBlackBright: t4(`\x1B[100m`, `\x1B[49m`), bgRedBright: t4(`\x1B[101m`, `\x1B[49m`), bgGreenBright: t4(`\x1B[102m`, `\x1B[49m`), bgYellowBright: t4(`\x1B[103m`, `\x1B[49m`), bgBlueBright: t4(`\x1B[104m`, `\x1B[49m`), bgMagentaBright: t4(`\x1B[105m`, `\x1B[49m`), bgCyanBright: t4(`\x1B[106m`, `\x1B[49m`), bgWhiteBright: t4(`\x1B[107m`, `\x1B[49m`) };
    };
    s = o();
  }
});

// examples/testapp-ssr/node_modules/html-escaper/esm/index.js
var replace, ca, esca, pe, escape;
var init_esm = __esm({
  "examples/testapp-ssr/node_modules/html-escaper/esm/index.js"() {
    ({ replace } = "");
    ca = /[&<>'"]/g;
    esca = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    };
    pe = (m2) => esca[m2];
    escape = (es) => replace.call(es, ca, pe);
  }
});

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/util.js
function isPromise(value) {
  return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
async function* streamAsyncIterator(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
var init_util2 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/runtime/server/util.js"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/escape.js
function isHTMLString(value) {
  return Object.prototype.toString.call(value) === "[object HTMLString]";
}
function markHTMLBytes(bytes) {
  return new HTMLBytes(bytes);
}
function hasGetReader(obj) {
  return typeof obj.getReader === "function";
}
async function* unescapeChunksAsync(iterable) {
  if (hasGetReader(iterable)) {
    for await (const chunk of streamAsyncIterator(iterable)) {
      yield unescapeHTML(chunk);
    }
  } else {
    for await (const chunk of iterable) {
      yield unescapeHTML(chunk);
    }
  }
}
function* unescapeChunks(iterable) {
  for (const chunk of iterable) {
    yield unescapeHTML(chunk);
  }
}
function unescapeHTML(str) {
  if (!!str && typeof str === "object") {
    if (str instanceof Uint8Array) {
      return markHTMLBytes(str);
    } else if (str instanceof Response && str.body) {
      const body = str.body;
      return unescapeChunksAsync(body);
    } else if (typeof str.then === "function") {
      return Promise.resolve(str).then((value) => {
        return unescapeHTML(value);
      });
    } else if (str[Symbol.for("astro:slot-string")]) {
      return str;
    } else if (Symbol.iterator in str) {
      return unescapeChunks(str);
    } else if (Symbol.asyncIterator in str || hasGetReader(str)) {
      return unescapeChunksAsync(str);
    }
  }
  return markHTMLString(str);
}
var escapeHTML, HTMLBytes, HTMLString, markHTMLString;
var init_escape = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/runtime/server/escape.js"() {
    init_esm();
    init_util2();
    escapeHTML = escape;
    HTMLBytes = class extends Uint8Array {
    };
    Object.defineProperty(HTMLBytes.prototype, Symbol.toStringTag, {
      get() {
        return "HTMLBytes";
      }
    });
    HTMLString = class extends String {
      get [Symbol.toStringTag]() {
        return "HTMLString";
      }
    };
    markHTMLString = (value) => {
      if (value instanceof HTMLString) {
        return value;
      }
      if (typeof value === "string") {
        return new HTMLString(value);
      }
      return value;
    };
  }
});

// examples/testapp-ssr/node_modules/clsx/dist/clsx.mjs
function r2(e2) {
  var t4, f2, n5 = "";
  if ("string" == typeof e2 || "number" == typeof e2) n5 += e2;
  else if ("object" == typeof e2) if (Array.isArray(e2)) {
    var o4 = e2.length;
    for (t4 = 0; t4 < o4; t4++) e2[t4] && (f2 = r2(e2[t4])) && (n5 && (n5 += " "), n5 += f2);
  } else for (f2 in e2) e2[f2] && (n5 && (n5 += " "), n5 += f2);
  return n5;
}
function clsx() {
  for (var e2, t4, f2 = 0, n5 = "", o4 = arguments.length; f2 < o4; f2++) (e2 = arguments[f2]) && (t4 = r2(e2)) && (n5 && (n5 += " "), n5 += t4);
  return n5;
}
var init_clsx = __esm({
  "examples/testapp-ssr/node_modules/clsx/dist/clsx.mjs"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/shorthash.js
function bitwise(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i2 = 0; i2 < str.length; i2++) {
    const ch = str.charCodeAt(i2);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}
var dictionary, binary;
var init_shorthash = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/runtime/server/shorthash.js"() {
    dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
    binary = dictionary.length;
  }
});

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/util.js
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `const ${toIdent(key)} = ${JSON.stringify(value)?.replace(
      /<\/script>/g,
      "\\x3C/script>"
    )};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function isCustomElement(tagName) {
  return tagName.includes("-");
}
function handleBooleanAttribute(key, value, shouldEscape, tagName) {
  if (tagName && isCustomElement(tagName)) {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
  return markHTMLString(value ? ` ${key}` : "");
}
function addAttribute(value, key, shouldEscape = true, tagName = "") {
  if (value == null) {
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(clsx(value), shouldEscape);
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString)) {
    if (Array.isArray(value) && value.length === 2) {
      return markHTMLString(
        ` ${key}="${toAttributeString(`${toStyleString(value[0])};${value[1]}`, shouldEscape)}"`
      );
    }
    if (typeof value === "object") {
      return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
    }
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (typeof value === "string" && value.includes("&") && isHttpUrl(value)) {
    return markHTMLString(` ${key}="${toAttributeString(value, false)}"`);
  }
  if (htmlBooleanAttributes.test(key)) {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (value === "") {
    return markHTMLString(` ${key}`);
  }
  if (key === "popover" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (key === "download" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
}
function internalSpreadAttributes(values, shouldEscape = true, tagName) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape, tagName);
  }
  return markHTMLString(output);
}
function renderElement(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children == "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>${children}</${name}>`;
}
function createBufferedRenderer(destination, renderFunction) {
  return new BufferedRenderer(destination, renderFunction);
}
function promiseWithResolvers() {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
}
function isHttpUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return VALID_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
var voidElementNames, htmlBooleanAttributes, AMPERSAND_REGEX, DOUBLE_QUOTE_REGEX, STATIC_DIRECTIVES, toIdent, toAttributeString, kebab, toStyleString, noop2, BufferedRenderer, isNode, isDeno, VALID_PROTOCOLS;
var init_util3 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/util.js"() {
    init_clsx();
    init_escape();
    init_util2();
    voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
    htmlBooleanAttributes = /^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|inert|loop|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected|itemscope)$/i;
    AMPERSAND_REGEX = /&/g;
    DOUBLE_QUOTE_REGEX = /"/g;
    STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
    toIdent = (k2) => k2.trim().replace(/(?!^)\b\w|\s+|\W+/g, (match, index) => {
      if (/\W/.test(match)) return "";
      return index === 0 ? match : match.toUpperCase();
    });
    toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(AMPERSAND_REGEX, "&#38;").replace(DOUBLE_QUOTE_REGEX, "&#34;") : value;
    kebab = (k2) => k2.toLowerCase() === k2 ? k2 : k2.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    toStyleString = (obj) => Object.entries(obj).filter(([_, v2]) => typeof v2 === "string" && v2.trim() || typeof v2 === "number").map(([k2, v2]) => {
      if (k2[0] !== "-" && k2[1] !== "-") return `${kebab(k2)}:${v2}`;
      return `${k2}:${v2}`;
    }).join(";");
    noop2 = () => {
    };
    BufferedRenderer = class {
      chunks = [];
      renderPromise;
      destination;
      /**
       * Determines whether buffer has been flushed
       * to the final destination.
       */
      flushed = false;
      constructor(destination, renderFunction) {
        this.destination = destination;
        this.renderPromise = renderFunction(this);
        if (isPromise(this.renderPromise)) {
          Promise.resolve(this.renderPromise).catch(noop2);
        }
      }
      write(chunk) {
        if (this.flushed) {
          this.destination.write(chunk);
        } else {
          this.chunks.push(chunk);
        }
      }
      flush() {
        if (this.flushed) {
          throw new Error("The render buffer has already been flushed.");
        }
        this.flushed = true;
        for (const chunk of this.chunks) {
          this.destination.write(chunk);
        }
        return this.renderPromise;
      }
    };
    isNode = typeof process !== "undefined" && Object.prototype.toString.call(process) === "[object process]";
    isDeno = typeof Deno !== "undefined";
    VALID_PROTOCOLS = ["http:", "https:"];
  }
});

// examples/testapp-ssr/node_modules/cssesc/cssesc.js
var require_cssesc = __commonJS({
  "examples/testapp-ssr/node_modules/cssesc/cssesc.js"(exports, module) {
    "use strict";
    var object = {};
    var hasOwnProperty = object.hasOwnProperty;
    var merge = function merge2(options, defaults) {
      if (!options) {
        return defaults;
      }
      var result = {};
      for (var key in defaults) {
        result[key] = hasOwnProperty.call(options, key) ? options[key] : defaults[key];
      }
      return result;
    };
    var regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
    var regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
    var regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
    var cssesc2 = function cssesc3(string, options) {
      options = merge(options, cssesc3.options);
      if (options.quotes != "single" && options.quotes != "double") {
        options.quotes = "single";
      }
      var quote = options.quotes == "double" ? '"' : "'";
      var isIdentifier = options.isIdentifier;
      var firstChar = string.charAt(0);
      var output = "";
      var counter = 0;
      var length = string.length;
      while (counter < length) {
        var character = string.charAt(counter++);
        var codePoint = character.charCodeAt();
        var value = void 0;
        if (codePoint < 32 || codePoint > 126) {
          if (codePoint >= 55296 && codePoint <= 56319 && counter < length) {
            var extra = string.charCodeAt(counter++);
            if ((extra & 64512) == 56320) {
              codePoint = ((codePoint & 1023) << 10) + (extra & 1023) + 65536;
            } else {
              counter--;
            }
          }
          value = "\\" + codePoint.toString(16).toUpperCase() + " ";
        } else {
          if (options.escapeEverything) {
            if (regexAnySingleEscape.test(character)) {
              value = "\\" + character;
            } else {
              value = "\\" + codePoint.toString(16).toUpperCase() + " ";
            }
          } else if (/[\t\n\f\r\x0B]/.test(character)) {
            value = "\\" + codePoint.toString(16).toUpperCase() + " ";
          } else if (character == "\\" || !isIdentifier && (character == '"' && quote == character || character == "'" && quote == character) || isIdentifier && regexSingleEscape.test(character)) {
            value = "\\" + character;
          } else {
            value = character;
          }
        }
        output += value;
      }
      if (isIdentifier) {
        if (/^-[-\d]/.test(output)) {
          output = "\\-" + output.slice(1);
        } else if (/\d/.test(firstChar)) {
          output = "\\3" + firstChar + " " + output.slice(1);
        }
      }
      output = output.replace(regexExcessiveSpaces, function($0, $1, $22) {
        if ($1 && $1.length % 2) {
          return $0;
        }
        return ($1 || "") + $22;
      });
      if (!isIdentifier && options.wrap) {
        return quote + output + quote;
      }
      return output;
    };
    cssesc2.options = {
      "escapeEverything": false,
      "isIdentifier": false,
      "quotes": "single",
      "wrap": false
    };
    cssesc2.version = "3.0.0";
    module.exports = cssesc2;
  }
});

// examples/testapp-ssr/node_modules/cookie/dist/index.js
var require_dist = __commonJS({
  "examples/testapp-ssr/node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C3 = function() {
      };
      C3.prototype = /* @__PURE__ */ Object.create(null);
      return C3;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode2;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode2;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode2(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e2) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/path.js
var init_path2 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/path.js"() {
    init_path();
  }
});

// examples/testapp-ssr/node_modules/destr/dist/index.mjs
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error2) {
    if (options.strict) {
      throw error2;
    }
    return value;
  }
}
var suspectProtoRx, suspectConstructorRx, JsonSigRx;
var init_dist3 = __esm({
  "examples/testapp-ssr/node_modules/destr/dist/index.mjs"() {
    suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
    suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
    JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
  }
});

// node-shim:node:buffer
function Buffer2() {
}
var File, Blob2, node_buffer_default;
var init_node_buffer = __esm({
  "node-shim:node:buffer"() {
    File = globalThis.File;
    Blob2 = globalThis.Blob;
    Buffer2.from = (data, enc) => {
      if (typeof data === "string") return new TextEncoder().encode(data);
      return new Uint8Array(data);
    };
    Buffer2.alloc = (n5) => new Uint8Array(n5);
    Buffer2.isBuffer = () => false;
    node_buffer_default = { File, Blob: Blob2, Buffer: Buffer2 };
  }
});

// node-shim:node:crypto
var node_crypto_exports = {};
__export(node_crypto_exports, {
  default: () => node_crypto_default,
  randomBytes: () => randomBytes,
  webcrypto: () => webcrypto
});
var webcrypto, randomBytes, node_crypto_default;
var init_node_crypto = __esm({
  "node-shim:node:crypto"() {
    webcrypto = globalThis.crypto;
    randomBytes = (n5) => globalThis.crypto.getRandomValues(new Uint8Array(n5));
    node_crypto_default = { webcrypto, randomBytes };
  }
});

// examples/testapp-ssr/.netlify/build/chunks/astro/server_B-EsUmxH.mjs
function normalizeLF2(code) {
  return code.replace(/\r\n|\r(?!\n)|\n/g, "\n");
}
function codeFrame2(src, loc) {
  if (!loc || loc.line === void 0 || loc.column === void 0) {
    return "";
  }
  const lines = normalizeLF2(src).split("\n").map((ln) => ln.replace(/\t/g, "  "));
  const visibleLines = [];
  for (let n5 = -2; n5 <= 2; n5++) {
    if (lines[loc.line + n5]) visibleLines.push(loc.line + n5);
  }
  let gutterWidth = 0;
  for (const lineNo of visibleLines) {
    let w2 = `> ${lineNo}`;
    if (w2.length > gutterWidth) gutterWidth = w2.length;
  }
  let output = "";
  for (const lineNo of visibleLines) {
    const isFocusedLine = lineNo === loc.line - 1;
    output += isFocusedLine ? "> " : "  ";
    output += `${lineNo + 1} | ${lines[lineNo]}
`;
    if (isFocusedLine)
      output += `${Array.from({ length: gutterWidth }).join(" ")}  | ${Array.from({
        length: loc.column
      }).join(" ")}^
`;
  }
  return output;
}
function isPromise2(value) {
  return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
async function* streamAsyncIterator2(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
function isHTMLString2(value) {
  return Object.prototype.toString.call(value) === "[object HTMLString]";
}
function markHTMLBytes2(bytes) {
  return new HTMLBytes2(bytes);
}
function hasGetReader2(obj) {
  return typeof obj.getReader === "function";
}
async function* unescapeChunksAsync2(iterable) {
  if (hasGetReader2(iterable)) {
    for await (const chunk of streamAsyncIterator2(iterable)) {
      yield unescapeHTML2(chunk);
    }
  } else {
    for await (const chunk of iterable) {
      yield unescapeHTML2(chunk);
    }
  }
}
function* unescapeChunks2(iterable) {
  for (const chunk of iterable) {
    yield unescapeHTML2(chunk);
  }
}
function unescapeHTML2(str) {
  if (!!str && typeof str === "object") {
    if (str instanceof Uint8Array) {
      return markHTMLBytes2(str);
    } else if (str instanceof Response && str.body) {
      const body = str.body;
      return unescapeChunksAsync2(body);
    } else if (typeof str.then === "function") {
      return Promise.resolve(str).then((value) => {
        return unescapeHTML2(value);
      });
    } else if (str[Symbol.for("astro:slot-string")]) {
      return str;
    } else if (Symbol.iterator in str) {
      return unescapeChunks2(str);
    } else if (Symbol.asyncIterator in str || hasGetReader2(str)) {
      return unescapeChunksAsync2(str);
    }
  }
  return markHTMLString2(str);
}
function isCustomElement2(tagName) {
  return tagName.includes("-");
}
function handleBooleanAttribute2(key, value, shouldEscape, tagName) {
  if (tagName && isCustomElement2(tagName)) {
    return markHTMLString2(` ${key}="${toAttributeString2(value, shouldEscape)}"`);
  }
  return markHTMLString2(value ? ` ${key}` : "");
}
function addAttribute2(value, key, shouldEscape = true, tagName = "") {
  if (value == null) {
    return "";
  }
  if (STATIC_DIRECTIVES2.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString2(clsx(value), shouldEscape);
    if (listValue === "") {
      return "";
    }
    return markHTMLString2(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString2)) {
    if (Array.isArray(value) && value.length === 2) {
      return markHTMLString2(
        ` ${key}="${toAttributeString2(`${toStyleString2(value[0])};${value[1]}`, shouldEscape)}"`
      );
    }
    if (typeof value === "object") {
      return markHTMLString2(` ${key}="${toAttributeString2(toStyleString2(value), shouldEscape)}"`);
    }
  }
  if (key === "className") {
    return markHTMLString2(` class="${toAttributeString2(value, shouldEscape)}"`);
  }
  if (typeof value === "string" && value.includes("&") && isHttpUrl2(value)) {
    return markHTMLString2(` ${key}="${toAttributeString2(value, false)}"`);
  }
  if (htmlBooleanAttributes2.test(key)) {
    return handleBooleanAttribute2(key, value, shouldEscape, tagName);
  }
  if (value === "") {
    return markHTMLString2(` ${key}`);
  }
  if (key === "popover" && typeof value === "boolean") {
    return handleBooleanAttribute2(key, value, shouldEscape, tagName);
  }
  if (key === "download" && typeof value === "boolean") {
    return handleBooleanAttribute2(key, value, shouldEscape, tagName);
  }
  return markHTMLString2(` ${key}="${toAttributeString2(value, shouldEscape)}"`);
}
function createBufferedRenderer2(destination, renderFunction) {
  return new BufferedRenderer2(destination, renderFunction);
}
function isHttpUrl2(url) {
  try {
    const parsedUrl = new URL(url);
    return VALID_PROTOCOLS2.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
function validateArgs(args) {
  if (args.length !== 3) return false;
  if (!args[0] || typeof args[0] !== "object") return false;
  return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
  const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
  const fn = (...args) => {
    if (!validateArgs(args)) {
      throw new AstroError2({
        ...InvalidComponentArgs2,
        message: InvalidComponentArgs2.message(name)
      });
    }
    return cb(...args);
  };
  Object.defineProperty(fn, "name", { value: name, writable: false });
  fn.isAstroComponentFactory = true;
  fn.moduleId = moduleId;
  fn.propagation = propagation;
  return fn;
}
function createComponentWithOptions(opts) {
  const cb = baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
  return cb;
}
function createComponent2(arg1, moduleId, propagation) {
  if (typeof arg1 === "function") {
    return baseCreateComponent(arg1, moduleId, propagation);
  } else {
    return createComponentWithOptions(arg1);
  }
}
function createAstroGlobFn() {
  const globHandler = (importMetaGlobResult) => {
    console.warn(`Astro.glob is deprecated and will be removed in a future major version of Astro.
Use import.meta.glob instead: https://vitejs.dev/guide/features.html#glob-import`);
    if (typeof importMetaGlobResult === "string") {
      throw new AstroError2({
        ...AstroGlobUsedOutside2,
        message: AstroGlobUsedOutside2.message(JSON.stringify(importMetaGlobResult))
      });
    }
    let allEntries = [...Object.values(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new AstroError2({
        ...AstroGlobNoMatch2,
        message: AstroGlobNoMatch2.message(JSON.stringify(importMetaGlobResult))
      });
    }
    return Promise.all(allEntries.map((fn) => fn()));
  };
  return globHandler;
}
function createAstro2(site) {
  return {
    site: void 0,
    generator: `Astro v${ASTRO_VERSION2}`,
    glob: createAstroGlobFn()
  };
}
function createRenderInstruction2(instruction) {
  return Object.defineProperty(instruction, RenderInstructionSymbol2, {
    value: true
  });
}
function renderHead2() {
  return createRenderInstruction2({ type: "head" });
}
function maybeRenderHead2() {
  return createRenderInstruction2({ type: "maybe-head" });
}
async function decodeKey2(encoded) {
  const bytes = decodeBase64(encoded);
  return crypto.subtle.importKey("raw", bytes.buffer, ALGORITHM2, true, [
    "encrypt",
    "decrypt"
  ]);
}
function isRenderTemplateResult2(obj) {
  return typeof obj === "object" && obj !== null && !!obj[renderTemplateResultSym2];
}
function renderTemplate2(htmlParts, ...expressions) {
  return new RenderTemplateResult2(htmlParts, expressions);
}
function isRenderInstance2(obj) {
  return !!obj && typeof obj === "object" && "render" in obj && typeof obj.render === "function";
}
function renderChild2(destination, child) {
  if (isPromise2(child)) {
    return child.then((x2) => renderChild2(destination, x2));
  }
  if (child instanceof SlotString2) {
    destination.write(child);
    return;
  }
  if (isHTMLString2(child)) {
    destination.write(child);
    return;
  }
  if (Array.isArray(child)) {
    return renderArray2(destination, child);
  }
  if (typeof child === "function") {
    return renderChild2(destination, child());
  }
  if (!child && child !== 0) {
    return;
  }
  if (typeof child === "string") {
    destination.write(markHTMLString2(escapeHTML2(child)));
    return;
  }
  if (isRenderInstance2(child)) {
    return child.render(destination);
  }
  if (isRenderTemplateResult2(child)) {
    return child.render(destination);
  }
  if (isAstroComponentInstance2(child)) {
    return child.render(destination);
  }
  if (ArrayBuffer.isView(child)) {
    destination.write(child);
    return;
  }
  if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    if (Symbol.asyncIterator in child) {
      return renderAsyncIterable2(destination, child);
    }
    return renderIterable2(destination, child);
  }
  destination.write(child);
}
function renderArray2(destination, children) {
  const flushers = children.map((c2) => {
    return createBufferedRenderer2(destination, (bufferDestination) => {
      return renderChild2(bufferDestination, c2);
    });
  });
  const iterator = flushers[Symbol.iterator]();
  const iterate = () => {
    for (; ; ) {
      const { value: flusher, done } = iterator.next();
      if (done) {
        break;
      }
      const result = flusher.flush();
      if (isPromise2(result)) {
        return result.then(iterate);
      }
    }
  };
  return iterate();
}
function renderIterable2(destination, children) {
  const iterator = children[Symbol.iterator]();
  const iterate = () => {
    for (; ; ) {
      const { value, done } = iterator.next();
      if (done) {
        break;
      }
      const result = renderChild2(destination, value);
      if (isPromise2(result)) {
        return result.then(iterate);
      }
    }
  };
  return iterate();
}
async function renderAsyncIterable2(destination, children) {
  for await (const value of children) {
    await renderChild2(destination, value);
  }
}
function isAstroComponentInstance2(obj) {
  return typeof obj === "object" && obj !== null && !!obj[astroComponentInstanceSym2];
}
function spreadAttributes2(values = {}, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute2(value, key, true, _name);
  }
  return markHTMLString2(output);
}
var import_cssesc2, AstroError2, InvalidComponentArgs2, ImageMissingAlt2, InvalidImageService2, FailedToFetchRemoteImageDimensions2, RemoteImageNotAllowed2, ExpectedImage2, ExpectedImageOptions2, ExpectedNotESMImage2, NoImageMetadata2, AstroGlobUsedOutside2, AstroGlobNoMatch2, ExperimentalFontsNotEnabled2, FontFamilyNotFound2, escapeHTML2, HTMLBytes2, HTMLString2, markHTMLString2, htmlBooleanAttributes2, AMPERSAND_REGEX2, DOUBLE_QUOTE_REGEX2, STATIC_DIRECTIVES2, toAttributeString2, kebab2, toStyleString2, noop3, BufferedRenderer2, VALID_PROTOCOLS2, ASTRO_VERSION2, NOOP_MIDDLEWARE_HEADER2, RenderInstructionSymbol2, ALGORITHMS2, ALGORITHM_VALUES2, ALLOWED_DIRECTIVES2, ALGORITHM2, renderTemplateResultSym2, RenderTemplateResult2, slotString2, SlotString2, astroComponentInstanceSym2;
var init_server_B_EsUmxH = __esm({
  "examples/testapp-ssr/.netlify/build/chunks/astro/server_B-EsUmxH.mjs"() {
    init_dist2();
    init_clsx();
    init_esm();
    init_dist();
    init_zod();
    import_cssesc2 = __toESM(require_cssesc(), 1);
    AstroError2 = class extends Error {
      loc;
      title;
      hint;
      frame;
      type = "AstroError";
      constructor(props, options) {
        const { name, title, message, stack, location, hint, frame } = props;
        super(message, options);
        this.title = title;
        this.name = name;
        if (message) this.message = message;
        this.stack = stack ? stack : this.stack;
        this.loc = location;
        this.hint = hint;
        this.frame = frame;
      }
      setLocation(location) {
        this.loc = location;
      }
      setName(name) {
        this.name = name;
      }
      setMessage(message) {
        this.message = message;
      }
      setHint(hint) {
        this.hint = hint;
      }
      setFrame(source, location) {
        this.frame = codeFrame2(source, location);
      }
      static is(err) {
        return err?.type === "AstroError";
      }
    };
    InvalidComponentArgs2 = {
      name: "InvalidComponentArgs",
      title: "Invalid component arguments.",
      message: (name) => `Invalid arguments passed to${name ? ` <${name}>` : ""} component.`,
      hint: "Astro components cannot be rendered directly via function call, such as `Component()` or `{items.map(Component)}`."
    };
    ImageMissingAlt2 = {
      name: "ImageMissingAlt",
      title: 'Image missing required "alt" property.',
      message: 'Image missing "alt" property. "alt" text is required to describe important images on the page.',
      hint: 'Use an empty string ("") for decorative images.'
    };
    InvalidImageService2 = {
      name: "InvalidImageService",
      title: "Error while loading image service.",
      message: "There was an error loading the configured image service. Please see the stack trace for more information."
    };
    FailedToFetchRemoteImageDimensions2 = {
      name: "FailedToFetchRemoteImageDimensions",
      title: "Failed to retrieve remote image dimensions",
      message: (imageURL) => `Failed to get the dimensions for ${imageURL}.`,
      hint: "Verify your remote image URL is accurate, and that you are not using `inferSize` with a file located in your `public/` folder."
    };
    RemoteImageNotAllowed2 = {
      name: "RemoteImageNotAllowed",
      title: "Remote image is not allowed",
      message: (imageURL) => `Remote image ${imageURL} is not allowed by your image configuration.`,
      hint: "Update `image.domains` or `image.remotePatterns`, or remove `inferSize` for this image."
    };
    ExpectedImage2 = {
      name: "ExpectedImage",
      title: "Expected src to be an image.",
      message: (src, typeofOptions, fullOptions) => `Expected \`src\` property for \`getImage\` or \`<Image />\` to be either an ESM imported image or a string with the path of a remote image. Received \`${src}\` (type: \`${typeofOptions}\`).

Full serialized options received: \`${fullOptions}\`.`,
      hint: "This error can often happen because of a wrong path. Make sure the path to your image is correct. If you're passing an async function, make sure to call and await it."
    };
    ExpectedImageOptions2 = {
      name: "ExpectedImageOptions",
      title: "Expected image options.",
      message: (options) => `Expected getImage() parameter to be an object. Received \`${options}\`.`
    };
    ExpectedNotESMImage2 = {
      name: "ExpectedNotESMImage",
      title: "Expected image options, not an ESM-imported image.",
      message: "An ESM-imported image cannot be passed directly to `getImage()`. Instead, pass an object with the image in the `src` property.",
      hint: "Try changing `getImage(myImage)` to `getImage({ src: myImage })`"
    };
    NoImageMetadata2 = {
      name: "NoImageMetadata",
      title: "Could not process image metadata.",
      message: (imagePath) => `Could not process image metadata${imagePath ? ` for \`${imagePath}\`` : ""}.`,
      hint: "This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue."
    };
    AstroGlobUsedOutside2 = {
      name: "AstroGlobUsedOutside",
      title: "Astro.glob() used outside of an Astro file.",
      message: (globStr) => `\`Astro.glob(${globStr})\` can only be used in \`.astro\` files. \`import.meta.glob(${globStr})\` can be used instead to achieve a similar result.`,
      hint: "See Vite's documentation on `import.meta.glob` for more information: https://vite.dev/guide/features.html#glob-import"
    };
    AstroGlobNoMatch2 = {
      name: "AstroGlobNoMatch",
      title: "Astro.glob() did not match any files.",
      message: (globStr) => `\`Astro.glob(${globStr})\` did not return any matching files.`,
      hint: "Check the pattern for typos."
    };
    ExperimentalFontsNotEnabled2 = {
      name: "ExperimentalFontsNotEnabled",
      title: "Experimental fonts are not enabled",
      message: "The Font component is used but experimental fonts have not been registered in the config.",
      hint: "Check that you have enabled experimental fonts and also configured your preferred fonts."
    };
    FontFamilyNotFound2 = {
      name: "FontFamilyNotFound",
      title: "Font family not found",
      message: (family) => `No data was found for the \`"${family}"\` family passed to the \`<Font>\` component.`,
      hint: "This is often caused by a typo. Check that the `<Font />` component is using a `cssVariable` specified in your config."
    };
    escapeHTML2 = escape;
    HTMLBytes2 = class extends Uint8Array {
    };
    Object.defineProperty(HTMLBytes2.prototype, Symbol.toStringTag, {
      get() {
        return "HTMLBytes";
      }
    });
    HTMLString2 = class extends String {
      get [Symbol.toStringTag]() {
        return "HTMLString";
      }
    };
    markHTMLString2 = (value) => {
      if (value instanceof HTMLString2) {
        return value;
      }
      if (typeof value === "string") {
        return new HTMLString2(value);
      }
      return value;
    };
    htmlBooleanAttributes2 = /^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|inert|loop|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected|itemscope)$/i;
    AMPERSAND_REGEX2 = /&/g;
    DOUBLE_QUOTE_REGEX2 = /"/g;
    STATIC_DIRECTIVES2 = /* @__PURE__ */ new Set(["set:html", "set:text"]);
    toAttributeString2 = (value, shouldEscape = true) => shouldEscape ? String(value).replace(AMPERSAND_REGEX2, "&#38;").replace(DOUBLE_QUOTE_REGEX2, "&#34;") : value;
    kebab2 = (k2) => k2.toLowerCase() === k2 ? k2 : k2.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    toStyleString2 = (obj) => Object.entries(obj).filter(([_, v2]) => typeof v2 === "string" && v2.trim() || typeof v2 === "number").map(([k2, v2]) => {
      if (k2[0] !== "-" && k2[1] !== "-") return `${kebab2(k2)}:${v2}`;
      return `${k2}:${v2}`;
    }).join(";");
    noop3 = () => {
    };
    BufferedRenderer2 = class {
      chunks = [];
      renderPromise;
      destination;
      /**
       * Determines whether buffer has been flushed
       * to the final destination.
       */
      flushed = false;
      constructor(destination, renderFunction) {
        this.destination = destination;
        this.renderPromise = renderFunction(this);
        if (isPromise2(this.renderPromise)) {
          Promise.resolve(this.renderPromise).catch(noop3);
        }
      }
      write(chunk) {
        if (this.flushed) {
          this.destination.write(chunk);
        } else {
          this.chunks.push(chunk);
        }
      }
      flush() {
        if (this.flushed) {
          throw new Error("The render buffer has already been flushed.");
        }
        this.flushed = true;
        for (const chunk of this.chunks) {
          this.destination.write(chunk);
        }
        return this.renderPromise;
      }
    };
    typeof process !== "undefined" && Object.prototype.toString.call(process) === "[object process]";
    VALID_PROTOCOLS2 = ["http:", "https:"];
    ASTRO_VERSION2 = "5.18.2";
    NOOP_MIDDLEWARE_HEADER2 = "X-Astro-Noop";
    RenderInstructionSymbol2 = Symbol.for("astro:render");
    ALGORITHMS2 = {
      "SHA-256": "sha256-",
      "SHA-384": "sha384-",
      "SHA-512": "sha512-"
    };
    ALGORITHM_VALUES2 = Object.values(ALGORITHMS2);
    external_exports.enum(Object.keys(ALGORITHMS2)).optional().default("SHA-256");
    external_exports.custom((value) => {
      if (typeof value !== "string") {
        return false;
      }
      return ALGORITHM_VALUES2.some((allowedValue) => {
        return value.startsWith(allowedValue);
      });
    });
    ALLOWED_DIRECTIVES2 = [
      "base-uri",
      "child-src",
      "connect-src",
      "default-src",
      "fenced-frame-src",
      "font-src",
      "form-action",
      "frame-ancestors",
      "frame-src",
      "img-src",
      "manifest-src",
      "media-src",
      "object-src",
      "referrer",
      "report-to",
      "report-uri",
      "require-trusted-types-for",
      "sandbox",
      "trusted-types",
      "upgrade-insecure-requests",
      "worker-src"
    ];
    external_exports.custom((value) => {
      if (typeof value !== "string") {
        return false;
      }
      return ALLOWED_DIRECTIVES2.some((allowedValue) => {
        return value.startsWith(allowedValue);
      });
    });
    ALGORITHM2 = "AES-GCM";
    new TextEncoder();
    new TextDecoder();
    renderTemplateResultSym2 = Symbol.for("astro.renderTemplateResult");
    RenderTemplateResult2 = class {
      [renderTemplateResultSym2] = true;
      htmlParts;
      expressions;
      error;
      constructor(htmlParts, expressions) {
        this.htmlParts = htmlParts;
        this.error = void 0;
        this.expressions = expressions.map((expression) => {
          if (isPromise2(expression)) {
            return Promise.resolve(expression).catch((err) => {
              if (!this.error) {
                this.error = err;
                throw err;
              }
            });
          }
          return expression;
        });
      }
      render(destination) {
        const flushers = this.expressions.map((exp) => {
          return createBufferedRenderer2(destination, (bufferDestination) => {
            if (exp || exp === 0) {
              return renderChild2(bufferDestination, exp);
            }
          });
        });
        let i2 = 0;
        const iterate = () => {
          while (i2 < this.htmlParts.length) {
            const html = this.htmlParts[i2];
            const flusher = flushers[i2];
            i2++;
            if (html) {
              destination.write(markHTMLString2(html));
            }
            if (flusher) {
              const result = flusher.flush();
              if (isPromise2(result)) {
                return result.then(iterate);
              }
            }
          }
        };
        return iterate();
      }
    };
    slotString2 = Symbol.for("astro:slot-string");
    SlotString2 = class extends HTMLString2 {
      instructions;
      [slotString2];
      constructor(content, instructions) {
        super(content);
        this.instructions = instructions;
        this[slotString2] = true;
      }
    };
    markHTMLString2(
      `async function replaceServerIsland(id, r) {
	let s = document.querySelector(\`script[data-island-id="\${id}"]\`);
	// If there's no matching script, or the request fails then return
	if (!s || r.status !== 200 || r.headers.get('content-type')?.split(';')[0].trim() !== 'text/html') return;
	// Load the HTML before modifying the DOM in case of errors
	let html = await r.text();
	// Remove any placeholder content before the island script
	while (s.previousSibling && s.previousSibling.nodeType !== 8 && s.previousSibling.data !== '[if astro]>server-island-start<![endif]')
		s.previousSibling.remove();
	s.previousSibling?.remove();
	// Insert the new HTML
	s.before(document.createRange().createContextualFragment(html));
	// Remove the script. Prior to v5.4.2, this was the trick to force rerun of scripts.  Keeping it to minimize change to the existing behavior.
	s.remove();
}`.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("//")).join(" ")
    );
    new TextEncoder();
    new TextDecoder();
    astroComponentInstanceSym2 = Symbol.for("astro.componentInstance");
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_".split("").reduce((v2, c2) => (v2[c2.charCodeAt(0)] = c2, v2), []);
    "-0123456789_".split("").reduce((v2, c2) => (v2[c2.charCodeAt(0)] = c2, v2), []);
  }
});

// examples/testapp-ssr/node_modules/@netlify/runtime-utils/dist/main.cjs
var require_main = __commonJS({
  "examples/testapp-ssr/node_modules/@netlify/runtime-utils/dist/main.cjs"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod2) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod2);
    var main_exports = {};
    __export2(main_exports, {
      base64Decode: () => base64Decode2,
      base64Encode: () => base64Encode2,
      getEnvironment: () => getEnvironment
    });
    module.exports = __toCommonJS2(main_exports);
    var getString = (input) => typeof input === "string" ? input : JSON.stringify(input);
    var base64Decode2 = globalThis.Buffer ? (input) => Buffer.from(input, "base64").toString() : (input) => atob(input);
    var base64Encode2 = globalThis.Buffer ? (input) => Buffer.from(getString(input)).toString("base64") : (input) => btoa(getString(input));
    var getEnvironment = () => {
      const { Deno: Deno2, Netlify, process: process2 } = globalThis;
      return Netlify?.env ?? Deno2?.env ?? {
        delete: (key) => delete process2?.env[key],
        get: (key) => process2?.env[key],
        has: (key) => Boolean(process2?.env[key]),
        set: (key, value) => {
          if (process2?.env) {
            process2.env[key] = value;
          }
        },
        toObject: () => process2?.env ?? {}
      };
    };
  }
});

// node-shim:process
var process_exports = {};
__export(process_exports, {
  default: () => process_default,
  env: () => env,
  platform: () => platform,
  stderr: () => stderr,
  stdout: () => stdout,
  version: () => version,
  versions: () => versions
});
var env, version, versions, platform, stdout, stderr, process_default;
var init_process = __esm({
  "node-shim:process"() {
    env = globalThis.__processEnv || {};
    version = "v20.0.0";
    versions = {};
    platform = "linux";
    stdout = { write: () => {
    } };
    stderr = { write: () => {
    } };
    process_default = globalThis.process || { env, version, versions, platform };
  }
});

// examples/testapp-ssr/node_modules/@netlify/otel/dist/main.cjs
var require_main2 = __commonJS({
  "examples/testapp-ssr/node_modules/@netlify/otel/dist/main.cjs"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod2) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod2);
    var main_exports = {};
    __export2(main_exports, {
      getTracer: () => getTracer,
      shutdownTracers: () => shutdownTracers,
      withActiveSpan: () => withActiveSpan
    });
    module.exports = __toCommonJS2(main_exports);
    var GET_TRACER = "__netlify__getTracer";
    var SHUTDOWN_TRACERS = "__netlify__shutdownTracers";
    var getTracer = (name, version3) => {
      return globalThis[GET_TRACER]?.(name, version3);
    };
    var shutdownTracers = async () => {
      return globalThis[SHUTDOWN_TRACERS]?.();
    };
    function withActiveSpan(tracer, name, optionsOrFn, contextOrFn, fn) {
      const func = typeof contextOrFn === "function" ? contextOrFn : typeof optionsOrFn === "function" ? optionsOrFn : fn;
      if (!func) {
        throw new Error("function to execute with active span is missing");
      }
      if (!tracer) {
        return func();
      }
      return tracer.withActiveSpan(name, optionsOrFn, contextOrFn, func);
    }
  }
});

// examples/testapp-ssr/node_modules/@netlify/blobs/dist/main.cjs
var require_main3 = __commonJS({
  "examples/testapp-ssr/node_modules/@netlify/blobs/dist/main.cjs"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod2, isNodeMode, target) => (target = mod2 != null ? __create2(__getProtoOf2(mod2)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod2 || !mod2.__esModule ? __defProp2(target, "default", { value: mod2, enumerable: true }) : target,
      mod2
    ));
    var __toCommonJS2 = (mod2) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod2);
    var main_exports = {};
    __export2(main_exports, {
      connectLambda: () => connectLambda,
      getDeployStore: () => getDeployStore2,
      getStore: () => getStore2,
      listStores: () => listStores,
      setEnvironmentContext: () => setEnvironmentContext
    });
    module.exports = __toCommonJS2(main_exports);
    var import_runtime_utils = require_main();
    var getEnvironmentContext = () => {
      const context = globalThis.netlifyBlobsContext || (0, import_runtime_utils.getEnvironment)().get("NETLIFY_BLOBS_CONTEXT");
      if (typeof context !== "string" || !context) {
        return {};
      }
      const data = (0, import_runtime_utils.base64Decode)(context);
      try {
        return JSON.parse(data);
      } catch {
      }
      return {};
    };
    var setEnvironmentContext = (context) => {
      const encodedContext = (0, import_runtime_utils.base64Encode)(JSON.stringify(context));
      (0, import_runtime_utils.getEnvironment)().set("NETLIFY_BLOBS_CONTEXT", encodedContext);
    };
    var MissingBlobsEnvironmentError = class extends Error {
      constructor(requiredProperties) {
        super(
          `The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(
            ", "
          )}`
        );
        this.name = "MissingBlobsEnvironmentError";
      }
    };
    var import_runtime_utils2 = require_main();
    var connectLambda = (event) => {
      const rawData = (0, import_runtime_utils2.base64Decode)(event.blobs);
      const data = JSON.parse(rawData);
      const environmentContext = {
        deployID: event.headers["x-nf-deploy-id"],
        edgeURL: data.url,
        siteID: event.headers["x-nf-site-id"],
        token: data.token
      };
      setEnvironmentContext(environmentContext);
    };
    var BlobsConsistencyError = class extends Error {
      constructor() {
        super(
          `Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`
        );
        this.name = "BlobsConsistencyError";
      }
    };
    var import_runtime_utils3 = require_main();
    var BASE64_PREFIX2 = "b64;";
    var METADATA_HEADER_INTERNAL = "x-amz-meta-user";
    var METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
    var METADATA_MAX_SIZE = 2 * 1024;
    var encodeMetadata = (metadata) => {
      if (!metadata) {
        return null;
      }
      const encodedObject = (0, import_runtime_utils3.base64Encode)(JSON.stringify(metadata));
      const payload = `b64;${encodedObject}`;
      if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
        throw new Error("Metadata object exceeds the maximum size");
      }
      return payload;
    };
    var decodeMetadata = (header) => {
      if (!header?.startsWith(BASE64_PREFIX2)) {
        return {};
      }
      const encodedData = header.slice(BASE64_PREFIX2.length);
      const decodedData = (0, import_runtime_utils3.base64Decode)(encodedData);
      const metadata = JSON.parse(decodedData);
      return metadata;
    };
    var getMetadataFromResponse = (response) => {
      if (!response.headers) {
        return {};
      }
      const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
      try {
        return decodeMetadata(value);
      } catch {
        throw new Error(
          "An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client."
        );
      }
    };
    var REGION_AUTO = "auto";
    var regions = {
      "us-east-1": true,
      "us-east-2": true,
      "eu-central-1": true,
      "ap-southeast-1": true,
      "ap-southeast-2": true
    };
    var isValidRegion = (input) => Object.keys(regions).includes(input);
    var InvalidBlobsRegionError = class extends Error {
      constructor(region) {
        super(
          `${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`
        );
        this.name = "InvalidBlobsRegionError";
      }
    };
    var import_runtime_utils4 = require_main();
    var DEFAULT_RETRY_DELAY = (0, import_runtime_utils4.getEnvironment)().get("NODE_ENV") === "test" ? 1 : 5e3;
    var MIN_RETRY_DELAY = 1e3;
    var MAX_RETRY = 5;
    var RATE_LIMIT_HEADER = "X-RateLimit-Reset";
    var fetchAndRetry = async (fetch3, url, options, attemptsLeft = MAX_RETRY) => {
      try {
        const res = await fetch3(url, options);
        if (attemptsLeft > 0 && (res.status === 429 || res.status >= 500)) {
          const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
          await sleep(delay);
          return fetchAndRetry(fetch3, url, options, attemptsLeft - 1);
        }
        return res;
      } catch (error2) {
        if (attemptsLeft === 0) {
          throw error2;
        }
        const delay = getDelay();
        await sleep(delay);
        return fetchAndRetry(fetch3, url, options, attemptsLeft - 1);
      }
    };
    var getDelay = (rateLimitReset) => {
      if (!rateLimitReset) {
        return DEFAULT_RETRY_DELAY;
      }
      return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
    };
    var sleep = (ms) => new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
    var import_node_process = __toESM2((init_process(), __toCommonJS(process_exports)), 1);
    var import_otel = require_main2();
    var NF_ERROR = "x-nf-error";
    var NF_REQUEST_ID = "x-nf-request-id";
    var BlobsInternalError = class extends Error {
      constructor(res) {
        let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
        if (res.headers.has(NF_REQUEST_ID)) {
          details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
        }
        super(`Netlify Blobs has generated an internal error (${details})`);
        this.name = "BlobsInternalError";
      }
    };
    var collectIterator = async (iterator) => {
      const result = [];
      for await (const item of iterator) {
        result.push(item);
      }
      return result;
    };
    function withSpan(span, name, fn) {
      if (span) return fn(span);
      return (0, import_otel.withActiveSpan)((0, import_otel.getTracer)(), name, (span2) => {
        return fn(span2);
      });
    }
    var SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
    var Client = class {
      constructor({ apiURL, consistency, edgeURL, fetch: fetch3, region, siteID, token, uncachedEdgeURL }) {
        this.apiURL = apiURL;
        this.consistency = consistency ?? "eventual";
        this.edgeURL = edgeURL;
        this.fetch = fetch3 ?? globalThis.fetch;
        this.region = region;
        this.siteID = siteID;
        this.token = token;
        this.uncachedEdgeURL = uncachedEdgeURL;
        if (!this.fetch) {
          throw new Error(
            "Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property."
          );
        }
      }
      async getFinalRequest({
        consistency: opConsistency,
        key,
        metadata,
        method,
        parameters = {},
        storeName
      }) {
        const encodedMetadata = encodeMetadata(metadata);
        const consistency = opConsistency ?? this.consistency;
        let urlPath = `/${this.siteID}`;
        if (storeName) {
          urlPath += `/${storeName}`;
        }
        if (key) {
          urlPath += `/${key}`;
        }
        if (this.edgeURL) {
          if (consistency === "strong" && !this.uncachedEdgeURL) {
            throw new BlobsConsistencyError();
          }
          const headers = {
            authorization: `Bearer ${this.token}`
          };
          if (encodedMetadata) {
            headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
          }
          if (this.region) {
            urlPath = `/region:${this.region}${urlPath}`;
          }
          const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
          for (const key2 in parameters) {
            url2.searchParams.set(key2, parameters[key2]);
          }
          return {
            headers,
            url: url2.toString()
          };
        }
        const apiHeaders = { authorization: `Bearer ${this.token}` };
        const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
        for (const key2 in parameters) {
          url.searchParams.set(key2, parameters[key2]);
        }
        if (this.region) {
          url.searchParams.set("region", this.region);
        }
        if (storeName === void 0 || key === void 0) {
          return {
            headers: apiHeaders,
            url: url.toString()
          };
        }
        if (encodedMetadata) {
          apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
        }
        if (method === "head" || method === "delete") {
          return {
            headers: apiHeaders,
            url: url.toString()
          };
        }
        const res = await this.fetch(url.toString(), {
          headers: { ...apiHeaders, accept: SIGNED_URL_ACCEPT_HEADER },
          method
        });
        if (res.status !== 200) {
          throw new BlobsInternalError(res);
        }
        const { url: signedURL } = await res.json();
        const userHeaders = encodedMetadata ? { [METADATA_HEADER_INTERNAL]: encodedMetadata } : void 0;
        return {
          headers: userHeaders,
          url: signedURL
        };
      }
      async makeRequest({
        body,
        conditions = {},
        consistency,
        headers: extraHeaders,
        key,
        metadata,
        method,
        parameters,
        storeName
      }) {
        const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
          consistency,
          key,
          metadata,
          method,
          parameters,
          storeName
        });
        const headers = {
          ...baseHeaders,
          ...extraHeaders
        };
        if (method === "put") {
          headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
        }
        if ("onlyIfMatch" in conditions && conditions.onlyIfMatch) {
          headers["if-match"] = conditions.onlyIfMatch;
        } else if ("onlyIfNew" in conditions && conditions.onlyIfNew) {
          headers["if-none-match"] = "*";
        }
        const options = {
          body,
          headers,
          method
        };
        if (body instanceof ReadableStream) {
          options.duplex = "half";
        }
        return fetchAndRetry(this.fetch, url, options);
      }
    };
    var getClientOptions = (options, contextOverride) => {
      const context = contextOverride ?? getEnvironmentContext();
      const siteID = context.siteID ?? options.siteID;
      const token = context.token ?? options.token;
      if (!siteID || !token) {
        throw new MissingBlobsEnvironmentError(["siteID", "token"]);
      }
      if (options.region !== void 0 && !isValidRegion(options.region)) {
        throw new InvalidBlobsRegionError(options.region);
      }
      const clientOptions = {
        apiURL: context.apiURL ?? options.apiURL,
        consistency: options.consistency,
        edgeURL: context.edgeURL ?? options.edgeURL,
        fetch: options.fetch,
        region: options.region,
        siteID,
        token,
        uncachedEdgeURL: context.uncachedEdgeURL ?? options.uncachedEdgeURL
      };
      return clientOptions;
    };
    var DEPLOY_STORE_PREFIX = "deploy:";
    var LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
    var SITE_STORE_PREFIX = "site:";
    var STATUS_OK = 200;
    var STATUS_PRE_CONDITION_FAILED = 412;
    var Store = class _Store {
      constructor(options) {
        this.client = options.client;
        if ("deployID" in options) {
          _Store.validateDeployID(options.deployID);
          let name = DEPLOY_STORE_PREFIX + options.deployID;
          if (options.name) {
            name += `:${options.name}`;
          }
          this.name = name;
        } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
          const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
          _Store.validateStoreName(storeName);
          this.name = storeName;
        } else {
          _Store.validateStoreName(options.name);
          this.name = SITE_STORE_PREFIX + options.name;
        }
      }
      async delete(key) {
        const res = await this.client.makeRequest({ key, method: "delete", storeName: this.name });
        if (![200, 204, 404].includes(res.status)) {
          throw new BlobsInternalError(res);
        }
      }
      async deleteAll() {
        let totalDeletedBlobs = 0;
        let hasMore = true;
        while (hasMore) {
          const res = await this.client.makeRequest({ method: "delete", storeName: this.name });
          if (res.status !== 200) {
            throw new BlobsInternalError(res);
          }
          const data = await res.json();
          if (typeof data.blobs_deleted !== "number") {
            throw new BlobsInternalError(res);
          }
          totalDeletedBlobs += data.blobs_deleted;
          hasMore = typeof data.has_more === "boolean" && data.has_more;
        }
        return {
          deletedBlobs: totalDeletedBlobs
        };
      }
      async get(key, options) {
        return withSpan(options?.span, "blobs.get", async (span) => {
          const { consistency, type } = options ?? {};
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.type": type,
            "blobs.method": "GET",
            "blobs.consistency": consistency
          });
          const res = await this.client.makeRequest({
            consistency,
            key,
            method: "get",
            storeName: this.name
          });
          span?.setAttributes({
            "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
            "blobs.response.status": res.status
          });
          if (res.status === 404) {
            return null;
          }
          if (res.status !== 200) {
            throw new BlobsInternalError(res);
          }
          if (type === void 0 || type === "text") {
            return res.text();
          }
          if (type === "arrayBuffer") {
            return res.arrayBuffer();
          }
          if (type === "blob") {
            return res.blob();
          }
          if (type === "json") {
            return res.json();
          }
          if (type === "stream") {
            return res.body;
          }
          throw new BlobsInternalError(res);
        });
      }
      async getMetadata(key, options = {}) {
        return withSpan(options?.span, "blobs.getMetadata", async (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "HEAD",
            "blobs.consistency": options.consistency
          });
          const res = await this.client.makeRequest({
            consistency: options.consistency,
            key,
            method: "head",
            storeName: this.name
          });
          span?.setAttributes({
            "blobs.response.status": res.status
          });
          if (res.status === 404) {
            return null;
          }
          if (res.status !== 200 && res.status !== 304) {
            throw new BlobsInternalError(res);
          }
          const etag2 = res?.headers.get("etag") ?? void 0;
          const metadata = getMetadataFromResponse(res);
          const result = {
            etag: etag2,
            metadata
          };
          return result;
        });
      }
      async getWithMetadata(key, options) {
        return withSpan(options?.span, "blobs.getWithMetadata", async (span) => {
          const { consistency, etag: requestETag, type } = options ?? {};
          const headers = requestETag ? { "if-none-match": requestETag } : void 0;
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "GET",
            "blobs.consistency": options?.consistency,
            "blobs.type": type,
            "blobs.request.etag": requestETag
          });
          const res = await this.client.makeRequest({
            consistency,
            headers,
            key,
            method: "get",
            storeName: this.name
          });
          const responseETag = res?.headers.get("etag") ?? void 0;
          span?.setAttributes({
            "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
            "blobs.response.etag": responseETag,
            "blobs.response.status": res.status
          });
          if (res.status === 404) {
            return null;
          }
          if (res.status !== 200 && res.status !== 304) {
            throw new BlobsInternalError(res);
          }
          const metadata = getMetadataFromResponse(res);
          const result = {
            etag: responseETag,
            metadata
          };
          if (res.status === 304 && requestETag) {
            return { data: null, ...result };
          }
          if (type === void 0 || type === "text") {
            return { data: await res.text(), ...result };
          }
          if (type === "arrayBuffer") {
            return { data: await res.arrayBuffer(), ...result };
          }
          if (type === "blob") {
            return { data: await res.blob(), ...result };
          }
          if (type === "json") {
            return { data: await res.json(), ...result };
          }
          if (type === "stream") {
            return { data: res.body, ...result };
          }
          throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
        });
      }
      list(options = {}) {
        return withSpan(options.span, "blobs.list", (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.method": "GET",
            "blobs.list.paginate": options.paginate ?? false
          });
          const iterator = this.getListIterator(options);
          if (options.paginate) {
            return iterator;
          }
          return collectIterator(iterator).then(
            (items) => items.reduce(
              (acc, item) => ({
                blobs: [...acc.blobs, ...item.blobs],
                directories: [...acc.directories, ...item.directories]
              }),
              { blobs: [], directories: [] }
            )
          );
        });
      }
      async set(key, data, options = {}) {
        return withSpan(options.span, "blobs.set", async (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "PUT",
            "blobs.data.size": typeof data == "string" ? data.length : data instanceof Blob ? data.size : data.byteLength,
            "blobs.data.type": typeof data == "string" ? "string" : data instanceof Blob ? "blob" : "arrayBuffer",
            "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
          });
          _Store.validateKey(key);
          const conditions = _Store.getConditions(options);
          const res = await this.client.makeRequest({
            conditions,
            body: data,
            key,
            metadata: options.metadata,
            method: "put",
            storeName: this.name
          });
          const etag2 = res.headers.get("etag") ?? "";
          span?.setAttributes({
            "blobs.response.etag": etag2,
            "blobs.response.status": res.status
          });
          if (conditions) {
            return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag: etag2, modified: true };
          }
          if (res.status === STATUS_OK) {
            return {
              etag: etag2,
              modified: true
            };
          }
          throw new BlobsInternalError(res);
        });
      }
      async setJSON(key, data, options = {}) {
        return withSpan(options.span, "blobs.setJSON", async (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "PUT",
            "blobs.data.type": "json"
          });
          _Store.validateKey(key);
          const conditions = _Store.getConditions(options);
          const payload = JSON.stringify(data);
          const headers = {
            "content-type": "application/json"
          };
          const res = await this.client.makeRequest({
            ...conditions,
            body: payload,
            headers,
            key,
            metadata: options.metadata,
            method: "put",
            storeName: this.name
          });
          const etag2 = res.headers.get("etag") ?? "";
          span?.setAttributes({
            "blobs.response.etag": etag2,
            "blobs.response.status": res.status
          });
          if (conditions) {
            return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag: etag2, modified: true };
          }
          if (res.status === STATUS_OK) {
            return {
              etag: etag2,
              modified: true
            };
          }
          throw new BlobsInternalError(res);
        });
      }
      static formatListResultBlob(result) {
        if (!result.key) {
          return null;
        }
        return {
          etag: result.etag,
          key: result.key
        };
      }
      static getConditions(options) {
        if ("onlyIfMatch" in options && "onlyIfNew" in options) {
          throw new Error(
            `The 'onlyIfMatch' and 'onlyIfNew' options are mutually exclusive. Using 'onlyIfMatch' will make the write succeed only if there is an entry for the key with the given content, while 'onlyIfNew' will make the write succeed only if there is no entry for the key.`
          );
        }
        if ("onlyIfMatch" in options && options.onlyIfMatch) {
          if (typeof options.onlyIfMatch !== "string") {
            throw new Error(`The 'onlyIfMatch' property expects a string representing an ETag.`);
          }
          return {
            onlyIfMatch: options.onlyIfMatch
          };
        }
        if ("onlyIfNew" in options && options.onlyIfNew) {
          if (typeof options.onlyIfNew !== "boolean") {
            throw new Error(
              `The 'onlyIfNew' property expects a boolean indicating whether the write should fail if an entry for the key already exists.`
            );
          }
          return {
            onlyIfNew: true
          };
        }
      }
      static validateKey(key) {
        if (key === "") {
          throw new Error("Blob key must not be empty.");
        }
        if (key.startsWith("/") || key.startsWith("%2F")) {
          throw new Error("Blob key must not start with forward slash (/).");
        }
        if (new TextEncoder().encode(key).length > 600) {
          throw new Error(
            "Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long."
          );
        }
      }
      static validateDeployID(deployID) {
        if (!/^\w{1,24}$/.test(deployID)) {
          throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
        }
      }
      static validateStoreName(name) {
        if (name.includes("/") || name.includes("%2F")) {
          throw new Error("Store name must not contain forward slashes (/).");
        }
        if (new TextEncoder().encode(name).length > 64) {
          throw new Error(
            "Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long."
          );
        }
      }
      getListIterator(options) {
        const { client, name: storeName } = this;
        const parameters = {};
        if (options?.prefix) {
          parameters.prefix = options.prefix;
        }
        if (options?.directories) {
          parameters.directories = "true";
        }
        return {
          [Symbol.asyncIterator]() {
            let currentCursor = null;
            let done = false;
            return {
              async next() {
                return withSpan(options?.span, "blobs.list.next", async (span) => {
                  span?.setAttributes({
                    "blobs.store": storeName,
                    "blobs.method": "GET",
                    "blobs.list.paginate": options?.paginate ?? false,
                    "blobs.list.done": done,
                    "blobs.list.cursor": currentCursor ?? void 0
                  });
                  if (done) {
                    return { done: true, value: void 0 };
                  }
                  const nextParameters = { ...parameters };
                  if (currentCursor !== null) {
                    nextParameters.cursor = currentCursor;
                  }
                  const res = await client.makeRequest({
                    method: "get",
                    parameters: nextParameters,
                    storeName
                  });
                  span?.setAttributes({
                    "blobs.response.status": res.status
                  });
                  let blobs = [];
                  let directories = [];
                  if (![200, 204, 404].includes(res.status)) {
                    throw new BlobsInternalError(res);
                  }
                  if (res.status === 404) {
                    done = true;
                  } else {
                    const page8 = await res.json();
                    if (page8.next_cursor) {
                      currentCursor = page8.next_cursor;
                    } else {
                      done = true;
                    }
                    blobs = (page8.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
                    directories = page8.directories ?? [];
                  }
                  return {
                    done: false,
                    value: {
                      blobs,
                      directories
                    }
                  };
                });
              }
            };
          }
        };
      }
    };
    var getDeployStore2 = (input = {}, options) => {
      const context = getEnvironmentContext();
      const mergedOptions = typeof input === "string" ? { ...options, name: input } : input;
      const deployID = mergedOptions.deployID ?? context.deployID;
      if (!deployID) {
        throw new MissingBlobsEnvironmentError(["deployID"]);
      }
      const clientOptions = getClientOptions(mergedOptions, context);
      if (!clientOptions.region) {
        if (clientOptions.edgeURL || clientOptions.uncachedEdgeURL) {
          if (!context.primaryRegion) {
            throw new Error(
              "When accessing a deploy store, the Netlify Blobs client needs to be configured with a region, and one was not found in the environment. To manually set the region, set the `region` property in the `getDeployStore` options. If you are using the Netlify CLI, you may have an outdated version; run `npm install -g netlify-cli@latest` to update and try again."
            );
          }
          clientOptions.region = context.primaryRegion;
        } else {
          clientOptions.region = REGION_AUTO;
        }
      }
      const client = new Client(clientOptions);
      return new Store({ client, deployID, name: mergedOptions.name });
    };
    var getStore2 = (input, options) => {
      if (typeof input === "string") {
        const contextOverride = options?.siteID && options?.token ? { siteID: options?.siteID, token: options?.token } : void 0;
        const clientOptions = getClientOptions(options ?? {}, contextOverride);
        const client = new Client(clientOptions);
        return new Store({ client, name: input });
      }
      if (typeof input?.name === "string") {
        const { name } = input;
        const contextOverride = input?.siteID && input?.token ? { siteID: input?.siteID, token: input?.token } : void 0;
        const clientOptions = getClientOptions(input, contextOverride);
        if (!name) {
          throw new MissingBlobsEnvironmentError(["name"]);
        }
        const client = new Client(clientOptions);
        return new Store({ client, name });
      }
      if (typeof input?.deployID === "string") {
        const clientOptions = getClientOptions(input);
        const { deployID } = input;
        if (!deployID) {
          throw new MissingBlobsEnvironmentError(["deployID"]);
        }
        const client = new Client(clientOptions);
        return new Store({ client, deployID });
      }
      throw new Error(
        "The `getStore` method requires the name of the store as a string or as the `name` property of an options object"
      );
    };
    function listStores(options = {}) {
      const context = getEnvironmentContext();
      const clientOptions = getClientOptions(options, context);
      const client = new Client(clientOptions);
      const iterator = getListIterator(client, SITE_STORE_PREFIX);
      if (options.paginate) {
        return iterator;
      }
      return collectIterator(iterator).then((results) => ({ stores: results.flatMap((page8) => page8.stores) }));
    }
    var formatListStoreResponse = (stores) => stores.filter((store) => !store.startsWith(DEPLOY_STORE_PREFIX)).map((store) => store.startsWith(SITE_STORE_PREFIX) ? store.slice(SITE_STORE_PREFIX.length) : store);
    var getListIterator = (client, prefix) => {
      const parameters = {
        prefix
      };
      return {
        [Symbol.asyncIterator]() {
          let currentCursor = null;
          let done = false;
          return {
            async next() {
              if (done) {
                return { done: true, value: void 0 };
              }
              const nextParameters = { ...parameters };
              if (currentCursor !== null) {
                nextParameters.cursor = currentCursor;
              }
              const res = await client.makeRequest({
                method: "get",
                parameters: nextParameters
              });
              if (res.status === 404) {
                return { done: true, value: void 0 };
              }
              const page8 = await res.json();
              if (page8.next_cursor) {
                currentCursor = page8.next_cursor;
              } else {
                done = true;
              }
              return {
                done: false,
                value: {
                  ...page8,
                  stores: formatListStoreResponse(page8.stores)
                }
              };
            }
          };
        }
      };
    };
  }
});

// node-shim:node:http
var node_http_default;
var init_node_http = __esm({
  "node-shim:node:http"() {
    node_http_default = {};
  }
});

// node-shim:node:https
var node_https_default;
var init_node_https = __esm({
  "node-shim:node:https"() {
    node_https_default = {};
  }
});

// node-shim:node:zlib
var node_zlib_default;
var init_node_zlib = __esm({
  "node-shim:node:zlib"() {
    node_zlib_default = {};
  }
});

// node-shim:node:stream
function PassThrough() {
  this._chunks = [];
  this._listeners = {};
}
var pipeline, Readable, Writable, Transform, Stream, node_stream_default;
var init_node_stream = __esm({
  "node-shim:node:stream"() {
    PassThrough.prototype.write = function(c2) {
      this._chunks.push(c2);
      return true;
    };
    PassThrough.prototype.end = function(c2) {
      if (c2) this.write(c2);
      (this._listeners["end"] || []).forEach((fn) => fn());
    };
    PassThrough.prototype.on = function(e2, fn) {
      (this._listeners[e2] = this._listeners[e2] || []).push(fn);
      return this;
    };
    PassThrough.prototype.pipe = function(dest) {
      this._listeners["end"] = this._listeners["end"] || [];
      this._listeners["end"].push(() => {
        this._chunks.forEach((c2) => dest.write(c2));
        dest.end();
      });
      return dest;
    };
    pipeline = (...args) => {
      const cb = args[args.length - 1];
      Promise.resolve().then(() => cb && cb(null));
    };
    Readable = PassThrough;
    Writable = PassThrough;
    Transform = PassThrough;
    Stream = PassThrough;
    node_stream_default = { PassThrough, Readable, Writable, Transform, Stream, pipeline };
  }
});

// node-shim:node:util
var promisify, deprecate, types, TextEncoder2, TextDecoder2;
var init_node_util = __esm({
  "node-shim:node:util"() {
    promisify = (fn) => (...args) => new Promise((res, rej) => fn(...args, (e2, v2) => e2 ? rej(e2) : res(v2)));
    deprecate = (fn, msg) => fn;
    types = {
      isNativeError: (v2) => v2 instanceof Error,
      isPromise: (v2) => v2 && typeof v2.then === "function",
      isRegExp: (v2) => v2 instanceof RegExp
    };
    TextEncoder2 = globalThis.TextEncoder;
    TextDecoder2 = globalThis.TextDecoder;
  }
});

// examples/testapp-ssr/node_modules/node-fetch-native/dist/shared/node-fetch-native.DfbY2q-x.mjs
function f(e2) {
  return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
}
var t2, o2, n2;
var init_node_fetch_native_DfbY2q_x = __esm({
  "examples/testapp-ssr/node_modules/node-fetch-native/dist/shared/node-fetch-native.DfbY2q-x.mjs"() {
    t2 = Object.defineProperty;
    o2 = (e2, l) => t2(e2, "name", { value: l, configurable: true });
    n2 = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
    o2(f, "getDefaultExportFromCjs");
  }
});

// node-shim:node:url
var URL2, URLSearchParams2, format;
var init_node_url = __esm({
  "node-shim:node:url"() {
    URL2 = globalThis.URL;
    URLSearchParams2 = globalThis.URLSearchParams;
    format = (u) => typeof u === "string" ? u : u && u.href || String(u);
  }
});

// node-shim:node:net
var isIP;
var init_node_net = __esm({
  "node-shim:node:net"() {
    isIP = (s2) => {
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s2)) return 4;
      if (s2.includes(":")) return 6;
      return 0;
    };
  }
});

// node-shim:node:path
var basename;
var init_node_path = __esm({
  "node-shim:node:path"() {
    basename = (p2, ext) => {
      const b = p2.split("/").pop() || "";
      return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b;
    };
  }
});

// node-shim:node:process
var node_process_exports = {};
__export(node_process_exports, {
  default: () => node_process_default,
  env: () => env2,
  platform: () => platform2,
  stderr: () => stderr2,
  stdout: () => stdout2,
  version: () => version2,
  versions: () => versions2
});
var env2, version2, versions2, platform2, stdout2, stderr2, node_process_default;
var init_node_process = __esm({
  "node-shim:node:process"() {
    env2 = globalThis.__processEnv || {};
    version2 = "v20.0.0";
    versions2 = {};
    platform2 = "linux";
    stdout2 = { write: () => {
    } };
    stderr2 = { write: () => {
    } };
    node_process_default = globalThis.process || { env: env2, version: version2, versions: versions2, platform: platform2 };
  }
});

// node-shim:node:stream/web
var web_exports = {};
__export(web_exports, {
  default: () => web_default
});
var web_default;
var init_web = __esm({
  "node-shim:node:stream/web"() {
    web_default = {};
  }
});

// node-shim:buffer
var buffer_exports = {};
__export(buffer_exports, {
  Blob: () => Blob3,
  Buffer: () => Buffer3,
  File: () => File2,
  default: () => buffer_default
});
function Buffer3() {
}
var File2, Blob3, buffer_default;
var init_buffer = __esm({
  "node-shim:buffer"() {
    File2 = globalThis.File;
    Blob3 = globalThis.Blob;
    Buffer3.from = (data, enc) => {
      if (typeof data === "string") return new TextEncoder().encode(data);
      return new Uint8Array(data);
    };
    Buffer3.alloc = (n5) => new Uint8Array(n5);
    Buffer3.isBuffer = () => false;
    buffer_default = { File: File2, Blob: Blob3, Buffer: Buffer3 };
  }
});

// examples/testapp-ssr/node_modules/node-fetch-native/dist/chunks/multipart-parser.mjs
var multipart_parser_exports = {};
__export(multipart_parser_exports, {
  toFormData: () => Z
});
function v(u) {
  const a2 = u.match(/\bfilename=("(.*?)"|([^()<>@,;:\\"/[\]?={}\s\t]+))($|;\s)/i);
  if (!a2) return;
  const n5 = a2[2] || a2[3] || "";
  let r5 = n5.slice(n5.lastIndexOf("\\") + 1);
  return r5 = r5.replace(/%22/g, '"'), r5 = r5.replace(/&#(\d{4});/g, (d, l) => String.fromCharCode(l)), r5;
}
async function Z(u, a2) {
  if (!/multipart/i.test(a2)) throw new TypeError("Failed to fetch");
  const n5 = a2.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!n5) throw new TypeError("no or bad content-type header, no multipart boundary");
  const r5 = new k(n5[1] || n5[2]);
  let d, l, c2, p2, e2, i2;
  const A2 = [], H2 = new br(), O2 = E2((s2) => {
    c2 += f2.decode(s2, { stream: true });
  }, "onPartData"), y = E2((s2) => {
    A2.push(s2);
  }, "appendToFile"), o4 = E2(() => {
    const s2 = new qn(A2, i2, { type: e2 });
    H2.append(p2, s2);
  }, "appendFileToFormData"), L = E2(() => {
    H2.append(p2, c2);
  }, "appendEntryToFormData"), f2 = new TextDecoder("utf-8");
  f2.decode(), r5.onPartBegin = function() {
    r5.onPartData = O2, r5.onPartEnd = L, d = "", l = "", c2 = "", p2 = "", e2 = "", i2 = null, A2.length = 0;
  }, r5.onHeaderField = function(s2) {
    d += f2.decode(s2, { stream: true });
  }, r5.onHeaderValue = function(s2) {
    l += f2.decode(s2, { stream: true });
  }, r5.onHeaderEnd = function() {
    if (l += f2.decode(), d = d.toLowerCase(), d === "content-disposition") {
      const s2 = l.match(/\bname=("([^"]*)"|([^()<>@,;:\\"/[\]?={}\s\t]+))/i);
      s2 && (p2 = s2[2] || s2[3] || ""), i2 = v(l), i2 && (r5.onPartData = y, r5.onPartEnd = o4);
    } else d === "content-type" && (e2 = l);
    l = "", d = "";
  };
  for await (const s2 of u) r5.write(s2);
  return r5.end(), H2;
}
var B, E2, D, t3, w, R, g, N, x, P, C2, I, M, $, m, F, k;
var init_multipart_parser = __esm({
  "examples/testapp-ssr/node_modules/node-fetch-native/dist/chunks/multipart-parser.mjs"() {
    init_node();
    init_node_http();
    init_node_https();
    init_node_zlib();
    init_node_stream();
    init_node_buffer();
    init_node_util();
    init_node_fetch_native_DfbY2q_x();
    init_node_url();
    init_node_net();
    init_node_fs();
    init_node_path();
    B = Object.defineProperty;
    E2 = (u, a2) => B(u, "name", { value: a2, configurable: true });
    D = 0;
    t3 = { START_BOUNDARY: D++, HEADER_FIELD_START: D++, HEADER_FIELD: D++, HEADER_VALUE_START: D++, HEADER_VALUE: D++, HEADER_VALUE_ALMOST_DONE: D++, HEADERS_ALMOST_DONE: D++, PART_DATA_START: D++, PART_DATA: D++, END: D++ };
    w = 1;
    R = { PART_BOUNDARY: w, LAST_BOUNDARY: w *= 2 };
    g = 10;
    N = 13;
    x = 32;
    P = 45;
    C2 = 58;
    I = 97;
    M = 122;
    $ = E2((u) => u | 32, "lower");
    m = E2(() => {
    }, "noop");
    F = class F2 {
      constructor(a2) {
        this.index = 0, this.flags = 0, this.onHeaderEnd = m, this.onHeaderField = m, this.onHeadersEnd = m, this.onHeaderValue = m, this.onPartBegin = m, this.onPartData = m, this.onPartEnd = m, this.boundaryChars = {}, a2 = `\r
--` + a2;
        const n5 = new Uint8Array(a2.length);
        for (let r5 = 0; r5 < a2.length; r5++) n5[r5] = a2.charCodeAt(r5), this.boundaryChars[n5[r5]] = true;
        this.boundary = n5, this.lookbehind = new Uint8Array(this.boundary.length + 8), this.state = t3.START_BOUNDARY;
      }
      write(a2) {
        let n5 = 0;
        const r5 = a2.length;
        let d = this.index, { lookbehind: l, boundary: c2, boundaryChars: p2, index: e2, state: i2, flags: A2 } = this;
        const H2 = this.boundary.length, O2 = H2 - 1, y = a2.length;
        let o4, L;
        const f2 = E2((h2) => {
          this[h2 + "Mark"] = n5;
        }, "mark"), s2 = E2((h2) => {
          delete this[h2 + "Mark"];
        }, "clear"), T2 = E2((h2, S, _, U) => {
          (S === void 0 || S !== _) && this[h2](U && U.subarray(S, _));
        }, "callback"), b = E2((h2, S) => {
          const _ = h2 + "Mark";
          _ in this && (S ? (T2(h2, this[_], n5, a2), delete this[_]) : (T2(h2, this[_], a2.length, a2), this[_] = 0));
        }, "dataCallback");
        for (n5 = 0; n5 < r5; n5++) switch (o4 = a2[n5], i2) {
          case t3.START_BOUNDARY:
            if (e2 === c2.length - 2) {
              if (o4 === P) A2 |= R.LAST_BOUNDARY;
              else if (o4 !== N) return;
              e2++;
              break;
            } else if (e2 - 1 === c2.length - 2) {
              if (A2 & R.LAST_BOUNDARY && o4 === P) i2 = t3.END, A2 = 0;
              else if (!(A2 & R.LAST_BOUNDARY) && o4 === g) e2 = 0, T2("onPartBegin"), i2 = t3.HEADER_FIELD_START;
              else return;
              break;
            }
            o4 !== c2[e2 + 2] && (e2 = -2), o4 === c2[e2 + 2] && e2++;
            break;
          case t3.HEADER_FIELD_START:
            i2 = t3.HEADER_FIELD, f2("onHeaderField"), e2 = 0;
          case t3.HEADER_FIELD:
            if (o4 === N) {
              s2("onHeaderField"), i2 = t3.HEADERS_ALMOST_DONE;
              break;
            }
            if (e2++, o4 === P) break;
            if (o4 === C2) {
              if (e2 === 1) return;
              b("onHeaderField", true), i2 = t3.HEADER_VALUE_START;
              break;
            }
            if (L = $(o4), L < I || L > M) return;
            break;
          case t3.HEADER_VALUE_START:
            if (o4 === x) break;
            f2("onHeaderValue"), i2 = t3.HEADER_VALUE;
          case t3.HEADER_VALUE:
            o4 === N && (b("onHeaderValue", true), T2("onHeaderEnd"), i2 = t3.HEADER_VALUE_ALMOST_DONE);
            break;
          case t3.HEADER_VALUE_ALMOST_DONE:
            if (o4 !== g) return;
            i2 = t3.HEADER_FIELD_START;
            break;
          case t3.HEADERS_ALMOST_DONE:
            if (o4 !== g) return;
            T2("onHeadersEnd"), i2 = t3.PART_DATA_START;
            break;
          case t3.PART_DATA_START:
            i2 = t3.PART_DATA, f2("onPartData");
          case t3.PART_DATA:
            if (d = e2, e2 === 0) {
              for (n5 += O2; n5 < y && !(a2[n5] in p2); ) n5 += H2;
              n5 -= O2, o4 = a2[n5];
            }
            if (e2 < c2.length) c2[e2] === o4 ? (e2 === 0 && b("onPartData", true), e2++) : e2 = 0;
            else if (e2 === c2.length) e2++, o4 === N ? A2 |= R.PART_BOUNDARY : o4 === P ? A2 |= R.LAST_BOUNDARY : e2 = 0;
            else if (e2 - 1 === c2.length) if (A2 & R.PART_BOUNDARY) {
              if (e2 = 0, o4 === g) {
                A2 &= ~R.PART_BOUNDARY, T2("onPartEnd"), T2("onPartBegin"), i2 = t3.HEADER_FIELD_START;
                break;
              }
            } else A2 & R.LAST_BOUNDARY && o4 === P ? (T2("onPartEnd"), i2 = t3.END, A2 = 0) : e2 = 0;
            if (e2 > 0) l[e2 - 1] = o4;
            else if (d > 0) {
              const h2 = new Uint8Array(l.buffer, l.byteOffset, l.byteLength);
              T2("onPartData", 0, d, h2), d = 0, f2("onPartData"), n5--;
            }
            break;
          case t3.END:
            break;
          default:
            throw new Error(`Unexpected state entered: ${i2}`);
        }
        b("onHeaderField"), b("onHeaderValue"), b("onPartData"), this.index = e2, this.state = i2, this.flags = A2;
      }
      end() {
        if (this.state === t3.HEADER_FIELD_START && this.index === 0 || this.state === t3.PART_DATA && this.index === this.boundary.length) this.onPartEnd();
        else if (this.state !== t3.END) throw new Error("MultipartParser.end(): stream ended unexpectedly");
      }
    };
    E2(F, "MultipartParser");
    k = F;
    E2(v, "_fileName");
    E2(Z, "toFormData");
  }
});

// node-shim:worker_threads
var worker_threads_exports = {};
__export(worker_threads_exports, {
  default: () => worker_threads_default
});
var worker_threads_default;
var init_worker_threads = __esm({
  "node-shim:worker_threads"() {
    worker_threads_default = {};
  }
});

// examples/testapp-ssr/node_modules/node-fetch-native/dist/node.mjs
function Us(i2) {
  if (!/^data:/i.test(i2)) throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  i2 = i2.replace(/\r?\n/g, "");
  const o4 = i2.indexOf(",");
  if (o4 === -1 || o4 <= 4) throw new TypeError("malformed data: URI");
  const a2 = i2.substring(5, o4).split(";");
  let f2 = "", l = false;
  const p2 = a2[0] || "text/plain";
  let h2 = p2;
  for (let A2 = 1; A2 < a2.length; A2++) a2[A2] === "base64" ? l = true : a2[A2] && (h2 += `;${a2[A2]}`, a2[A2].indexOf("charset=") === 0 && (f2 = a2[A2].substring(8)));
  !a2[0] && !f2.length && (h2 += ";charset=US-ASCII", f2 = "US-ASCII");
  const S = l ? "base64" : "ascii", v2 = unescape(i2.substring(o4 + 1)), w2 = Buffer.from(v2, S);
  return w2.type = p2, w2.typeFull = h2, w2.charset = f2, w2;
}
function Ns() {
  return bi || (bi = 1, function(i2, o4) {
    (function(a2, f2) {
      f2(o4);
    })(xs, function(a2) {
      function f2() {
      }
      n3(f2, "noop");
      function l(e2) {
        return typeof e2 == "object" && e2 !== null || typeof e2 == "function";
      }
      n3(l, "typeIsObject");
      const p2 = f2;
      function h2(e2, t4) {
        try {
          Object.defineProperty(e2, "name", { value: t4, configurable: true });
        } catch {
        }
      }
      n3(h2, "setFunctionName");
      const S = Promise, v2 = Promise.prototype.then, w2 = Promise.reject.bind(S);
      function A2(e2) {
        return new S(e2);
      }
      n3(A2, "newPromise");
      function T2(e2) {
        return A2((t4) => t4(e2));
      }
      n3(T2, "promiseResolvedWith");
      function b(e2) {
        return w2(e2);
      }
      n3(b, "promiseRejectedWith");
      function q(e2, t4, r5) {
        return v2.call(e2, t4, r5);
      }
      n3(q, "PerformPromiseThen");
      function g2(e2, t4, r5) {
        q(q(e2, t4, r5), void 0, p2);
      }
      n3(g2, "uponPromise");
      function V(e2, t4) {
        g2(e2, t4);
      }
      n3(V, "uponFulfillment");
      function I2(e2, t4) {
        g2(e2, void 0, t4);
      }
      n3(I2, "uponRejection");
      function F4(e2, t4, r5) {
        return q(e2, t4, r5);
      }
      n3(F4, "transformPromiseWith");
      function Q(e2) {
        q(e2, void 0, p2);
      }
      n3(Q, "setPromiseIsHandledToTrue");
      let ge = n3((e2) => {
        if (typeof queueMicrotask == "function") ge = queueMicrotask;
        else {
          const t4 = T2(void 0);
          ge = n3((r5) => q(t4, r5), "_queueMicrotask");
        }
        return ge(e2);
      }, "_queueMicrotask");
      function z(e2, t4, r5) {
        if (typeof e2 != "function") throw new TypeError("Argument is not a function");
        return Function.prototype.apply.call(e2, t4, r5);
      }
      n3(z, "reflectCall");
      function j(e2, t4, r5) {
        try {
          return T2(z(e2, t4, r5));
        } catch (s2) {
          return b(s2);
        }
      }
      n3(j, "promiseCall");
      const U = 16384, bn = class bn {
        constructor() {
          this._cursor = 0, this._size = 0, this._front = { _elements: [], _next: void 0 }, this._back = this._front, this._cursor = 0, this._size = 0;
        }
        get length() {
          return this._size;
        }
        push(t4) {
          const r5 = this._back;
          let s2 = r5;
          r5._elements.length === U - 1 && (s2 = { _elements: [], _next: void 0 }), r5._elements.push(t4), s2 !== r5 && (this._back = s2, r5._next = s2), ++this._size;
        }
        shift() {
          const t4 = this._front;
          let r5 = t4;
          const s2 = this._cursor;
          let u = s2 + 1;
          const c2 = t4._elements, d = c2[s2];
          return u === U && (r5 = t4._next, u = 0), --this._size, this._cursor = u, t4 !== r5 && (this._front = r5), c2[s2] = void 0, d;
        }
        forEach(t4) {
          let r5 = this._cursor, s2 = this._front, u = s2._elements;
          for (; (r5 !== u.length || s2._next !== void 0) && !(r5 === u.length && (s2 = s2._next, u = s2._elements, r5 = 0, u.length === 0)); ) t4(u[r5]), ++r5;
        }
        peek() {
          const t4 = this._front, r5 = this._cursor;
          return t4._elements[r5];
        }
      };
      n3(bn, "SimpleQueue");
      let D2 = bn;
      const jt = Symbol("[[AbortSteps]]"), Qn = Symbol("[[ErrorSteps]]"), Ar = Symbol("[[CancelSteps]]"), Br = Symbol("[[PullSteps]]"), kr = Symbol("[[ReleaseSteps]]");
      function Yn(e2, t4) {
        e2._ownerReadableStream = t4, t4._reader = e2, t4._state === "readable" ? qr(e2) : t4._state === "closed" ? xi(e2) : Gn(e2, t4._storedError);
      }
      n3(Yn, "ReadableStreamReaderGenericInitialize");
      function Wr(e2, t4) {
        const r5 = e2._ownerReadableStream;
        return ie(r5, t4);
      }
      n3(Wr, "ReadableStreamReaderGenericCancel");
      function _e(e2) {
        const t4 = e2._ownerReadableStream;
        t4._state === "readable" ? Or(e2, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : Ni(e2, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), t4._readableStreamController[kr](), t4._reader = void 0, e2._ownerReadableStream = void 0;
      }
      n3(_e, "ReadableStreamReaderGenericRelease");
      function Lt(e2) {
        return new TypeError("Cannot " + e2 + " a stream using a released reader");
      }
      n3(Lt, "readerLockException");
      function qr(e2) {
        e2._closedPromise = A2((t4, r5) => {
          e2._closedPromise_resolve = t4, e2._closedPromise_reject = r5;
        });
      }
      n3(qr, "defaultReaderClosedPromiseInitialize");
      function Gn(e2, t4) {
        qr(e2), Or(e2, t4);
      }
      n3(Gn, "defaultReaderClosedPromiseInitializeAsRejected");
      function xi(e2) {
        qr(e2), Zn(e2);
      }
      n3(xi, "defaultReaderClosedPromiseInitializeAsResolved");
      function Or(e2, t4) {
        e2._closedPromise_reject !== void 0 && (Q(e2._closedPromise), e2._closedPromise_reject(t4), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0);
      }
      n3(Or, "defaultReaderClosedPromiseReject");
      function Ni(e2, t4) {
        Gn(e2, t4);
      }
      n3(Ni, "defaultReaderClosedPromiseResetToRejected");
      function Zn(e2) {
        e2._closedPromise_resolve !== void 0 && (e2._closedPromise_resolve(void 0), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0);
      }
      n3(Zn, "defaultReaderClosedPromiseResolve");
      const Kn = Number.isFinite || function(e2) {
        return typeof e2 == "number" && isFinite(e2);
      }, Hi = Math.trunc || function(e2) {
        return e2 < 0 ? Math.ceil(e2) : Math.floor(e2);
      };
      function Vi(e2) {
        return typeof e2 == "object" || typeof e2 == "function";
      }
      n3(Vi, "isDictionary");
      function ue(e2, t4) {
        if (e2 !== void 0 && !Vi(e2)) throw new TypeError(`${t4} is not an object.`);
      }
      n3(ue, "assertDictionary");
      function Z2(e2, t4) {
        if (typeof e2 != "function") throw new TypeError(`${t4} is not a function.`);
      }
      n3(Z2, "assertFunction");
      function Qi(e2) {
        return typeof e2 == "object" && e2 !== null || typeof e2 == "function";
      }
      n3(Qi, "isObject");
      function Jn(e2, t4) {
        if (!Qi(e2)) throw new TypeError(`${t4} is not an object.`);
      }
      n3(Jn, "assertObject");
      function Se(e2, t4, r5) {
        if (e2 === void 0) throw new TypeError(`Parameter ${t4} is required in '${r5}'.`);
      }
      n3(Se, "assertRequiredArgument");
      function zr(e2, t4, r5) {
        if (e2 === void 0) throw new TypeError(`${t4} is required in '${r5}'.`);
      }
      n3(zr, "assertRequiredField");
      function Ir(e2) {
        return Number(e2);
      }
      n3(Ir, "convertUnrestrictedDouble");
      function Xn(e2) {
        return e2 === 0 ? 0 : e2;
      }
      n3(Xn, "censorNegativeZero");
      function Yi(e2) {
        return Xn(Hi(e2));
      }
      n3(Yi, "integerPart");
      function Fr(e2, t4) {
        const s2 = Number.MAX_SAFE_INTEGER;
        let u = Number(e2);
        if (u = Xn(u), !Kn(u)) throw new TypeError(`${t4} is not a finite number`);
        if (u = Yi(u), u < 0 || u > s2) throw new TypeError(`${t4} is outside the accepted range of 0 to ${s2}, inclusive`);
        return !Kn(u) || u === 0 ? 0 : u;
      }
      n3(Fr, "convertUnsignedLongLongWithEnforceRange");
      function jr(e2, t4) {
        if (!We(e2)) throw new TypeError(`${t4} is not a ReadableStream.`);
      }
      n3(jr, "assertReadableStream");
      function Qe(e2) {
        return new fe(e2);
      }
      n3(Qe, "AcquireReadableStreamDefaultReader");
      function eo(e2, t4) {
        e2._reader._readRequests.push(t4);
      }
      n3(eo, "ReadableStreamAddReadRequest");
      function Lr(e2, t4, r5) {
        const u = e2._reader._readRequests.shift();
        r5 ? u._closeSteps() : u._chunkSteps(t4);
      }
      n3(Lr, "ReadableStreamFulfillReadRequest");
      function $t(e2) {
        return e2._reader._readRequests.length;
      }
      n3($t, "ReadableStreamGetNumReadRequests");
      function to(e2) {
        const t4 = e2._reader;
        return !(t4 === void 0 || !Ee(t4));
      }
      n3(to, "ReadableStreamHasDefaultReader");
      const mn = class mn {
        constructor(t4) {
          if (Se(t4, 1, "ReadableStreamDefaultReader"), jr(t4, "First parameter"), qe(t4)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          Yn(this, t4), this._readRequests = new D2();
        }
        get closed() {
          return Ee(this) ? this._closedPromise : b(Dt("closed"));
        }
        cancel(t4 = void 0) {
          return Ee(this) ? this._ownerReadableStream === void 0 ? b(Lt("cancel")) : Wr(this, t4) : b(Dt("cancel"));
        }
        read() {
          if (!Ee(this)) return b(Dt("read"));
          if (this._ownerReadableStream === void 0) return b(Lt("read from"));
          let t4, r5;
          const s2 = A2((c2, d) => {
            t4 = c2, r5 = d;
          });
          return _t(this, { _chunkSteps: n3((c2) => t4({ value: c2, done: false }), "_chunkSteps"), _closeSteps: n3(() => t4({ value: void 0, done: true }), "_closeSteps"), _errorSteps: n3((c2) => r5(c2), "_errorSteps") }), s2;
        }
        releaseLock() {
          if (!Ee(this)) throw Dt("releaseLock");
          this._ownerReadableStream !== void 0 && Gi(this);
        }
      };
      n3(mn, "ReadableStreamDefaultReader");
      let fe = mn;
      Object.defineProperties(fe.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), h2(fe.prototype.cancel, "cancel"), h2(fe.prototype.read, "read"), h2(fe.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(fe.prototype, Symbol.toStringTag, { value: "ReadableStreamDefaultReader", configurable: true });
      function Ee(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_readRequests") ? false : e2 instanceof fe;
      }
      n3(Ee, "IsReadableStreamDefaultReader");
      function _t(e2, t4) {
        const r5 = e2._ownerReadableStream;
        r5._disturbed = true, r5._state === "closed" ? t4._closeSteps() : r5._state === "errored" ? t4._errorSteps(r5._storedError) : r5._readableStreamController[Br](t4);
      }
      n3(_t, "ReadableStreamDefaultReaderRead");
      function Gi(e2) {
        _e(e2);
        const t4 = new TypeError("Reader was released");
        ro(e2, t4);
      }
      n3(Gi, "ReadableStreamDefaultReaderRelease");
      function ro(e2, t4) {
        const r5 = e2._readRequests;
        e2._readRequests = new D2(), r5.forEach((s2) => {
          s2._errorSteps(t4);
        });
      }
      n3(ro, "ReadableStreamDefaultReaderErrorReadRequests");
      function Dt(e2) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${e2} can only be used on a ReadableStreamDefaultReader`);
      }
      n3(Dt, "defaultReaderBrandCheckException");
      const Zi = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
      }).prototype), yn = class yn {
        constructor(t4, r5) {
          this._ongoingPromise = void 0, this._isFinished = false, this._reader = t4, this._preventCancel = r5;
        }
        next() {
          const t4 = n3(() => this._nextSteps(), "nextSteps");
          return this._ongoingPromise = this._ongoingPromise ? F4(this._ongoingPromise, t4, t4) : t4(), this._ongoingPromise;
        }
        return(t4) {
          const r5 = n3(() => this._returnSteps(t4), "returnSteps");
          return this._ongoingPromise ? F4(this._ongoingPromise, r5, r5) : r5();
        }
        _nextSteps() {
          if (this._isFinished) return Promise.resolve({ value: void 0, done: true });
          const t4 = this._reader;
          let r5, s2;
          const u = A2((d, m2) => {
            r5 = d, s2 = m2;
          });
          return _t(t4, { _chunkSteps: n3((d) => {
            this._ongoingPromise = void 0, ge(() => r5({ value: d, done: false }));
          }, "_chunkSteps"), _closeSteps: n3(() => {
            this._ongoingPromise = void 0, this._isFinished = true, _e(t4), r5({ value: void 0, done: true });
          }, "_closeSteps"), _errorSteps: n3((d) => {
            this._ongoingPromise = void 0, this._isFinished = true, _e(t4), s2(d);
          }, "_errorSteps") }), u;
        }
        _returnSteps(t4) {
          if (this._isFinished) return Promise.resolve({ value: t4, done: true });
          this._isFinished = true;
          const r5 = this._reader;
          if (!this._preventCancel) {
            const s2 = Wr(r5, t4);
            return _e(r5), F4(s2, () => ({ value: t4, done: true }));
          }
          return _e(r5), T2({ value: t4, done: true });
        }
      };
      n3(yn, "ReadableStreamAsyncIteratorImpl");
      let Mt = yn;
      const no = { next() {
        return oo(this) ? this._asyncIteratorImpl.next() : b(io("next"));
      }, return(e2) {
        return oo(this) ? this._asyncIteratorImpl.return(e2) : b(io("return"));
      } };
      Object.setPrototypeOf(no, Zi);
      function Ki(e2, t4) {
        const r5 = Qe(e2), s2 = new Mt(r5, t4), u = Object.create(no);
        return u._asyncIteratorImpl = s2, u;
      }
      n3(Ki, "AcquireReadableStreamAsyncIterator");
      function oo(e2) {
        if (!l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_asyncIteratorImpl")) return false;
        try {
          return e2._asyncIteratorImpl instanceof Mt;
        } catch {
          return false;
        }
      }
      n3(oo, "IsReadableStreamAsyncIterator");
      function io(e2) {
        return new TypeError(`ReadableStreamAsyncIterator.${e2} can only be used on a ReadableSteamAsyncIterator`);
      }
      n3(io, "streamAsyncIteratorBrandCheckException");
      const ao = Number.isNaN || function(e2) {
        return e2 !== e2;
      };
      var $r, Dr, Mr;
      function St(e2) {
        return e2.slice();
      }
      n3(St, "CreateArrayFromList");
      function so(e2, t4, r5, s2, u) {
        new Uint8Array(e2).set(new Uint8Array(r5, s2, u), t4);
      }
      n3(so, "CopyDataBlockBytes");
      let we = n3((e2) => (typeof e2.transfer == "function" ? we = n3((t4) => t4.transfer(), "TransferArrayBuffer") : typeof structuredClone == "function" ? we = n3((t4) => structuredClone(t4, { transfer: [t4] }), "TransferArrayBuffer") : we = n3((t4) => t4, "TransferArrayBuffer"), we(e2)), "TransferArrayBuffer"), Ae = n3((e2) => (typeof e2.detached == "boolean" ? Ae = n3((t4) => t4.detached, "IsDetachedBuffer") : Ae = n3((t4) => t4.byteLength === 0, "IsDetachedBuffer"), Ae(e2)), "IsDetachedBuffer");
      function lo(e2, t4, r5) {
        if (e2.slice) return e2.slice(t4, r5);
        const s2 = r5 - t4, u = new ArrayBuffer(s2);
        return so(u, 0, e2, t4, s2), u;
      }
      n3(lo, "ArrayBufferSlice");
      function Ut(e2, t4) {
        const r5 = e2[t4];
        if (r5 != null) {
          if (typeof r5 != "function") throw new TypeError(`${String(t4)} is not a function`);
          return r5;
        }
      }
      n3(Ut, "GetMethod");
      function Ji(e2) {
        const t4 = { [Symbol.iterator]: () => e2.iterator }, r5 = async function* () {
          return yield* t4;
        }(), s2 = r5.next;
        return { iterator: r5, nextMethod: s2, done: false };
      }
      n3(Ji, "CreateAsyncFromSyncIterator");
      const Ur = (Mr = ($r = Symbol.asyncIterator) !== null && $r !== void 0 ? $r : (Dr = Symbol.for) === null || Dr === void 0 ? void 0 : Dr.call(Symbol, "Symbol.asyncIterator")) !== null && Mr !== void 0 ? Mr : "@@asyncIterator";
      function uo(e2, t4 = "sync", r5) {
        if (r5 === void 0) if (t4 === "async") {
          if (r5 = Ut(e2, Ur), r5 === void 0) {
            const c2 = Ut(e2, Symbol.iterator), d = uo(e2, "sync", c2);
            return Ji(d);
          }
        } else r5 = Ut(e2, Symbol.iterator);
        if (r5 === void 0) throw new TypeError("The object is not iterable");
        const s2 = z(r5, e2, []);
        if (!l(s2)) throw new TypeError("The iterator method must return an object");
        const u = s2.next;
        return { iterator: s2, nextMethod: u, done: false };
      }
      n3(uo, "GetIterator");
      function Xi(e2) {
        const t4 = z(e2.nextMethod, e2.iterator, []);
        if (!l(t4)) throw new TypeError("The iterator.next() method must return an object");
        return t4;
      }
      n3(Xi, "IteratorNext");
      function ea(e2) {
        return !!e2.done;
      }
      n3(ea, "IteratorComplete");
      function ta(e2) {
        return e2.value;
      }
      n3(ta, "IteratorValue");
      function ra(e2) {
        return !(typeof e2 != "number" || ao(e2) || e2 < 0);
      }
      n3(ra, "IsNonNegativeNumber");
      function fo(e2) {
        const t4 = lo(e2.buffer, e2.byteOffset, e2.byteOffset + e2.byteLength);
        return new Uint8Array(t4);
      }
      n3(fo, "CloneAsUint8Array");
      function xr(e2) {
        const t4 = e2._queue.shift();
        return e2._queueTotalSize -= t4.size, e2._queueTotalSize < 0 && (e2._queueTotalSize = 0), t4.value;
      }
      n3(xr, "DequeueValue");
      function Nr(e2, t4, r5) {
        if (!ra(r5) || r5 === 1 / 0) throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        e2._queue.push({ value: t4, size: r5 }), e2._queueTotalSize += r5;
      }
      n3(Nr, "EnqueueValueWithSize");
      function na(e2) {
        return e2._queue.peek().value;
      }
      n3(na, "PeekQueueValue");
      function Be(e2) {
        e2._queue = new D2(), e2._queueTotalSize = 0;
      }
      n3(Be, "ResetQueue");
      function co(e2) {
        return e2 === DataView;
      }
      n3(co, "isDataViewConstructor");
      function oa(e2) {
        return co(e2.constructor);
      }
      n3(oa, "isDataView");
      function ia(e2) {
        return co(e2) ? 1 : e2.BYTES_PER_ELEMENT;
      }
      n3(ia, "arrayBufferViewElementSize");
      const gn = class gn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get view() {
          if (!Hr(this)) throw Zr("view");
          return this._view;
        }
        respond(t4) {
          if (!Hr(this)) throw Zr("respond");
          if (Se(t4, 1, "respond"), t4 = Fr(t4, "First parameter"), this._associatedReadableByteStreamController === void 0) throw new TypeError("This BYOB request has been invalidated");
          if (Ae(this._view.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be used as a response");
          Vt(this._associatedReadableByteStreamController, t4);
        }
        respondWithNewView(t4) {
          if (!Hr(this)) throw Zr("respondWithNewView");
          if (Se(t4, 1, "respondWithNewView"), !ArrayBuffer.isView(t4)) throw new TypeError("You can only respond with array buffer views");
          if (this._associatedReadableByteStreamController === void 0) throw new TypeError("This BYOB request has been invalidated");
          if (Ae(t4.buffer)) throw new TypeError("The given view's buffer has been detached and so cannot be used as a response");
          Qt(this._associatedReadableByteStreamController, t4);
        }
      };
      n3(gn, "ReadableStreamBYOBRequest");
      let Re = gn;
      Object.defineProperties(Re.prototype, { respond: { enumerable: true }, respondWithNewView: { enumerable: true }, view: { enumerable: true } }), h2(Re.prototype.respond, "respond"), h2(Re.prototype.respondWithNewView, "respondWithNewView"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Re.prototype, Symbol.toStringTag, { value: "ReadableStreamBYOBRequest", configurable: true });
      const _n = class _n {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get byobRequest() {
          if (!Ie(this)) throw Rt("byobRequest");
          return Gr(this);
        }
        get desiredSize() {
          if (!Ie(this)) throw Rt("desiredSize");
          return Ro(this);
        }
        close() {
          if (!Ie(this)) throw Rt("close");
          if (this._closeRequested) throw new TypeError("The stream has already been closed; do not close it again!");
          const t4 = this._controlledReadableByteStream._state;
          if (t4 !== "readable") throw new TypeError(`The stream (in ${t4} state) is not in the readable state and cannot be closed`);
          wt(this);
        }
        enqueue(t4) {
          if (!Ie(this)) throw Rt("enqueue");
          if (Se(t4, 1, "enqueue"), !ArrayBuffer.isView(t4)) throw new TypeError("chunk must be an array buffer view");
          if (t4.byteLength === 0) throw new TypeError("chunk must have non-zero byteLength");
          if (t4.buffer.byteLength === 0) throw new TypeError("chunk's buffer must have non-zero byteLength");
          if (this._closeRequested) throw new TypeError("stream is closed or draining");
          const r5 = this._controlledReadableByteStream._state;
          if (r5 !== "readable") throw new TypeError(`The stream (in ${r5} state) is not in the readable state and cannot be enqueued to`);
          Ht(this, t4);
        }
        error(t4 = void 0) {
          if (!Ie(this)) throw Rt("error");
          K(this, t4);
        }
        [Ar](t4) {
          ho(this), Be(this);
          const r5 = this._cancelAlgorithm(t4);
          return Nt(this), r5;
        }
        [Br](t4) {
          const r5 = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            wo(this, t4);
            return;
          }
          const s2 = this._autoAllocateChunkSize;
          if (s2 !== void 0) {
            let u;
            try {
              u = new ArrayBuffer(s2);
            } catch (d) {
              t4._errorSteps(d);
              return;
            }
            const c2 = { buffer: u, bufferByteLength: s2, byteOffset: 0, byteLength: s2, bytesFilled: 0, minimumFill: 1, elementSize: 1, viewConstructor: Uint8Array, readerType: "default" };
            this._pendingPullIntos.push(c2);
          }
          eo(r5, t4), Fe(this);
        }
        [kr]() {
          if (this._pendingPullIntos.length > 0) {
            const t4 = this._pendingPullIntos.peek();
            t4.readerType = "none", this._pendingPullIntos = new D2(), this._pendingPullIntos.push(t4);
          }
        }
      };
      n3(_n, "ReadableByteStreamController");
      let te = _n;
      Object.defineProperties(te.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, byobRequest: { enumerable: true }, desiredSize: { enumerable: true } }), h2(te.prototype.close, "close"), h2(te.prototype.enqueue, "enqueue"), h2(te.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(te.prototype, Symbol.toStringTag, { value: "ReadableByteStreamController", configurable: true });
      function Ie(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_controlledReadableByteStream") ? false : e2 instanceof te;
      }
      n3(Ie, "IsReadableByteStreamController");
      function Hr(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_associatedReadableByteStreamController") ? false : e2 instanceof Re;
      }
      n3(Hr, "IsReadableStreamBYOBRequest");
      function Fe(e2) {
        if (!fa(e2)) return;
        if (e2._pulling) {
          e2._pullAgain = true;
          return;
        }
        e2._pulling = true;
        const r5 = e2._pullAlgorithm();
        g2(r5, () => (e2._pulling = false, e2._pullAgain && (e2._pullAgain = false, Fe(e2)), null), (s2) => (K(e2, s2), null));
      }
      n3(Fe, "ReadableByteStreamControllerCallPullIfNeeded");
      function ho(e2) {
        Qr(e2), e2._pendingPullIntos = new D2();
      }
      n3(ho, "ReadableByteStreamControllerClearPendingPullIntos");
      function Vr(e2, t4) {
        let r5 = false;
        e2._state === "closed" && (r5 = true);
        const s2 = po(t4);
        t4.readerType === "default" ? Lr(e2, s2, r5) : ma(e2, s2, r5);
      }
      n3(Vr, "ReadableByteStreamControllerCommitPullIntoDescriptor");
      function po(e2) {
        const t4 = e2.bytesFilled, r5 = e2.elementSize;
        return new e2.viewConstructor(e2.buffer, e2.byteOffset, t4 / r5);
      }
      n3(po, "ReadableByteStreamControllerConvertPullIntoDescriptor");
      function xt(e2, t4, r5, s2) {
        e2._queue.push({ buffer: t4, byteOffset: r5, byteLength: s2 }), e2._queueTotalSize += s2;
      }
      n3(xt, "ReadableByteStreamControllerEnqueueChunkToQueue");
      function bo(e2, t4, r5, s2) {
        let u;
        try {
          u = lo(t4, r5, r5 + s2);
        } catch (c2) {
          throw K(e2, c2), c2;
        }
        xt(e2, u, 0, s2);
      }
      n3(bo, "ReadableByteStreamControllerEnqueueClonedChunkToQueue");
      function mo(e2, t4) {
        t4.bytesFilled > 0 && bo(e2, t4.buffer, t4.byteOffset, t4.bytesFilled), Ye(e2);
      }
      n3(mo, "ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue");
      function yo(e2, t4) {
        const r5 = Math.min(e2._queueTotalSize, t4.byteLength - t4.bytesFilled), s2 = t4.bytesFilled + r5;
        let u = r5, c2 = false;
        const d = s2 % t4.elementSize, m2 = s2 - d;
        m2 >= t4.minimumFill && (u = m2 - t4.bytesFilled, c2 = true);
        const R3 = e2._queue;
        for (; u > 0; ) {
          const y = R3.peek(), C3 = Math.min(u, y.byteLength), P2 = t4.byteOffset + t4.bytesFilled;
          so(t4.buffer, P2, y.buffer, y.byteOffset, C3), y.byteLength === C3 ? R3.shift() : (y.byteOffset += C3, y.byteLength -= C3), e2._queueTotalSize -= C3, go(e2, C3, t4), u -= C3;
        }
        return c2;
      }
      n3(yo, "ReadableByteStreamControllerFillPullIntoDescriptorFromQueue");
      function go(e2, t4, r5) {
        r5.bytesFilled += t4;
      }
      n3(go, "ReadableByteStreamControllerFillHeadPullIntoDescriptor");
      function _o(e2) {
        e2._queueTotalSize === 0 && e2._closeRequested ? (Nt(e2), At(e2._controlledReadableByteStream)) : Fe(e2);
      }
      n3(_o, "ReadableByteStreamControllerHandleQueueDrain");
      function Qr(e2) {
        e2._byobRequest !== null && (e2._byobRequest._associatedReadableByteStreamController = void 0, e2._byobRequest._view = null, e2._byobRequest = null);
      }
      n3(Qr, "ReadableByteStreamControllerInvalidateBYOBRequest");
      function Yr(e2) {
        for (; e2._pendingPullIntos.length > 0; ) {
          if (e2._queueTotalSize === 0) return;
          const t4 = e2._pendingPullIntos.peek();
          yo(e2, t4) && (Ye(e2), Vr(e2._controlledReadableByteStream, t4));
        }
      }
      n3(Yr, "ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue");
      function aa(e2) {
        const t4 = e2._controlledReadableByteStream._reader;
        for (; t4._readRequests.length > 0; ) {
          if (e2._queueTotalSize === 0) return;
          const r5 = t4._readRequests.shift();
          wo(e2, r5);
        }
      }
      n3(aa, "ReadableByteStreamControllerProcessReadRequestsUsingQueue");
      function sa(e2, t4, r5, s2) {
        const u = e2._controlledReadableByteStream, c2 = t4.constructor, d = ia(c2), { byteOffset: m2, byteLength: R3 } = t4, y = r5 * d;
        let C3;
        try {
          C3 = we(t4.buffer);
        } catch (B2) {
          s2._errorSteps(B2);
          return;
        }
        const P2 = { buffer: C3, bufferByteLength: C3.byteLength, byteOffset: m2, byteLength: R3, bytesFilled: 0, minimumFill: y, elementSize: d, viewConstructor: c2, readerType: "byob" };
        if (e2._pendingPullIntos.length > 0) {
          e2._pendingPullIntos.push(P2), Po(u, s2);
          return;
        }
        if (u._state === "closed") {
          const B2 = new c2(P2.buffer, P2.byteOffset, 0);
          s2._closeSteps(B2);
          return;
        }
        if (e2._queueTotalSize > 0) {
          if (yo(e2, P2)) {
            const B2 = po(P2);
            _o(e2), s2._chunkSteps(B2);
            return;
          }
          if (e2._closeRequested) {
            const B2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            K(e2, B2), s2._errorSteps(B2);
            return;
          }
        }
        e2._pendingPullIntos.push(P2), Po(u, s2), Fe(e2);
      }
      n3(sa, "ReadableByteStreamControllerPullInto");
      function la(e2, t4) {
        t4.readerType === "none" && Ye(e2);
        const r5 = e2._controlledReadableByteStream;
        if (Kr(r5)) for (; vo(r5) > 0; ) {
          const s2 = Ye(e2);
          Vr(r5, s2);
        }
      }
      n3(la, "ReadableByteStreamControllerRespondInClosedState");
      function ua(e2, t4, r5) {
        if (go(e2, t4, r5), r5.readerType === "none") {
          mo(e2, r5), Yr(e2);
          return;
        }
        if (r5.bytesFilled < r5.minimumFill) return;
        Ye(e2);
        const s2 = r5.bytesFilled % r5.elementSize;
        if (s2 > 0) {
          const u = r5.byteOffset + r5.bytesFilled;
          bo(e2, r5.buffer, u - s2, s2);
        }
        r5.bytesFilled -= s2, Vr(e2._controlledReadableByteStream, r5), Yr(e2);
      }
      n3(ua, "ReadableByteStreamControllerRespondInReadableState");
      function So(e2, t4) {
        const r5 = e2._pendingPullIntos.peek();
        Qr(e2), e2._controlledReadableByteStream._state === "closed" ? la(e2, r5) : ua(e2, t4, r5), Fe(e2);
      }
      n3(So, "ReadableByteStreamControllerRespondInternal");
      function Ye(e2) {
        return e2._pendingPullIntos.shift();
      }
      n3(Ye, "ReadableByteStreamControllerShiftPendingPullInto");
      function fa(e2) {
        const t4 = e2._controlledReadableByteStream;
        return t4._state !== "readable" || e2._closeRequested || !e2._started ? false : !!(to(t4) && $t(t4) > 0 || Kr(t4) && vo(t4) > 0 || Ro(e2) > 0);
      }
      n3(fa, "ReadableByteStreamControllerShouldCallPull");
      function Nt(e2) {
        e2._pullAlgorithm = void 0, e2._cancelAlgorithm = void 0;
      }
      n3(Nt, "ReadableByteStreamControllerClearAlgorithms");
      function wt(e2) {
        const t4 = e2._controlledReadableByteStream;
        if (!(e2._closeRequested || t4._state !== "readable")) {
          if (e2._queueTotalSize > 0) {
            e2._closeRequested = true;
            return;
          }
          if (e2._pendingPullIntos.length > 0) {
            const r5 = e2._pendingPullIntos.peek();
            if (r5.bytesFilled % r5.elementSize !== 0) {
              const s2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
              throw K(e2, s2), s2;
            }
          }
          Nt(e2), At(t4);
        }
      }
      n3(wt, "ReadableByteStreamControllerClose");
      function Ht(e2, t4) {
        const r5 = e2._controlledReadableByteStream;
        if (e2._closeRequested || r5._state !== "readable") return;
        const { buffer: s2, byteOffset: u, byteLength: c2 } = t4;
        if (Ae(s2)) throw new TypeError("chunk's buffer is detached and so cannot be enqueued");
        const d = we(s2);
        if (e2._pendingPullIntos.length > 0) {
          const m2 = e2._pendingPullIntos.peek();
          if (Ae(m2.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk");
          Qr(e2), m2.buffer = we(m2.buffer), m2.readerType === "none" && mo(e2, m2);
        }
        if (to(r5)) if (aa(e2), $t(r5) === 0) xt(e2, d, u, c2);
        else {
          e2._pendingPullIntos.length > 0 && Ye(e2);
          const m2 = new Uint8Array(d, u, c2);
          Lr(r5, m2, false);
        }
        else Kr(r5) ? (xt(e2, d, u, c2), Yr(e2)) : xt(e2, d, u, c2);
        Fe(e2);
      }
      n3(Ht, "ReadableByteStreamControllerEnqueue");
      function K(e2, t4) {
        const r5 = e2._controlledReadableByteStream;
        r5._state === "readable" && (ho(e2), Be(e2), Nt(e2), Zo(r5, t4));
      }
      n3(K, "ReadableByteStreamControllerError");
      function wo(e2, t4) {
        const r5 = e2._queue.shift();
        e2._queueTotalSize -= r5.byteLength, _o(e2);
        const s2 = new Uint8Array(r5.buffer, r5.byteOffset, r5.byteLength);
        t4._chunkSteps(s2);
      }
      n3(wo, "ReadableByteStreamControllerFillReadRequestFromQueue");
      function Gr(e2) {
        if (e2._byobRequest === null && e2._pendingPullIntos.length > 0) {
          const t4 = e2._pendingPullIntos.peek(), r5 = new Uint8Array(t4.buffer, t4.byteOffset + t4.bytesFilled, t4.byteLength - t4.bytesFilled), s2 = Object.create(Re.prototype);
          da(s2, e2, r5), e2._byobRequest = s2;
        }
        return e2._byobRequest;
      }
      n3(Gr, "ReadableByteStreamControllerGetBYOBRequest");
      function Ro(e2) {
        const t4 = e2._controlledReadableByteStream._state;
        return t4 === "errored" ? null : t4 === "closed" ? 0 : e2._strategyHWM - e2._queueTotalSize;
      }
      n3(Ro, "ReadableByteStreamControllerGetDesiredSize");
      function Vt(e2, t4) {
        const r5 = e2._pendingPullIntos.peek();
        if (e2._controlledReadableByteStream._state === "closed") {
          if (t4 !== 0) throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
        } else {
          if (t4 === 0) throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          if (r5.bytesFilled + t4 > r5.byteLength) throw new RangeError("bytesWritten out of range");
        }
        r5.buffer = we(r5.buffer), So(e2, t4);
      }
      n3(Vt, "ReadableByteStreamControllerRespond");
      function Qt(e2, t4) {
        const r5 = e2._pendingPullIntos.peek();
        if (e2._controlledReadableByteStream._state === "closed") {
          if (t4.byteLength !== 0) throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
        } else if (t4.byteLength === 0) throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
        if (r5.byteOffset + r5.bytesFilled !== t4.byteOffset) throw new RangeError("The region specified by view does not match byobRequest");
        if (r5.bufferByteLength !== t4.buffer.byteLength) throw new RangeError("The buffer of view has different capacity than byobRequest");
        if (r5.bytesFilled + t4.byteLength > r5.byteLength) throw new RangeError("The region specified by view is larger than byobRequest");
        const u = t4.byteLength;
        r5.buffer = we(t4.buffer), So(e2, u);
      }
      n3(Qt, "ReadableByteStreamControllerRespondWithNewView");
      function To(e2, t4, r5, s2, u, c2, d) {
        t4._controlledReadableByteStream = e2, t4._pullAgain = false, t4._pulling = false, t4._byobRequest = null, t4._queue = t4._queueTotalSize = void 0, Be(t4), t4._closeRequested = false, t4._started = false, t4._strategyHWM = c2, t4._pullAlgorithm = s2, t4._cancelAlgorithm = u, t4._autoAllocateChunkSize = d, t4._pendingPullIntos = new D2(), e2._readableStreamController = t4;
        const m2 = r5();
        g2(T2(m2), () => (t4._started = true, Fe(t4), null), (R3) => (K(t4, R3), null));
      }
      n3(To, "SetUpReadableByteStreamController");
      function ca2(e2, t4, r5) {
        const s2 = Object.create(te.prototype);
        let u, c2, d;
        t4.start !== void 0 ? u = n3(() => t4.start(s2), "startAlgorithm") : u = n3(() => {
        }, "startAlgorithm"), t4.pull !== void 0 ? c2 = n3(() => t4.pull(s2), "pullAlgorithm") : c2 = n3(() => T2(void 0), "pullAlgorithm"), t4.cancel !== void 0 ? d = n3((R3) => t4.cancel(R3), "cancelAlgorithm") : d = n3(() => T2(void 0), "cancelAlgorithm");
        const m2 = t4.autoAllocateChunkSize;
        if (m2 === 0) throw new TypeError("autoAllocateChunkSize must be greater than 0");
        To(e2, s2, u, c2, d, r5, m2);
      }
      n3(ca2, "SetUpReadableByteStreamControllerFromUnderlyingSource");
      function da(e2, t4, r5) {
        e2._associatedReadableByteStreamController = t4, e2._view = r5;
      }
      n3(da, "SetUpReadableStreamBYOBRequest");
      function Zr(e2) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${e2} can only be used on a ReadableStreamBYOBRequest`);
      }
      n3(Zr, "byobRequestBrandCheckException");
      function Rt(e2) {
        return new TypeError(`ReadableByteStreamController.prototype.${e2} can only be used on a ReadableByteStreamController`);
      }
      n3(Rt, "byteStreamControllerBrandCheckException");
      function ha(e2, t4) {
        ue(e2, t4);
        const r5 = e2?.mode;
        return { mode: r5 === void 0 ? void 0 : pa(r5, `${t4} has member 'mode' that`) };
      }
      n3(ha, "convertReaderOptions");
      function pa(e2, t4) {
        if (e2 = `${e2}`, e2 !== "byob") throw new TypeError(`${t4} '${e2}' is not a valid enumeration value for ReadableStreamReaderMode`);
        return e2;
      }
      n3(pa, "convertReadableStreamReaderMode");
      function ba(e2, t4) {
        var r5;
        ue(e2, t4);
        const s2 = (r5 = e2?.min) !== null && r5 !== void 0 ? r5 : 1;
        return { min: Fr(s2, `${t4} has member 'min' that`) };
      }
      n3(ba, "convertByobReadOptions");
      function Co(e2) {
        return new ce(e2);
      }
      n3(Co, "AcquireReadableStreamBYOBReader");
      function Po(e2, t4) {
        e2._reader._readIntoRequests.push(t4);
      }
      n3(Po, "ReadableStreamAddReadIntoRequest");
      function ma(e2, t4, r5) {
        const u = e2._reader._readIntoRequests.shift();
        r5 ? u._closeSteps(t4) : u._chunkSteps(t4);
      }
      n3(ma, "ReadableStreamFulfillReadIntoRequest");
      function vo(e2) {
        return e2._reader._readIntoRequests.length;
      }
      n3(vo, "ReadableStreamGetNumReadIntoRequests");
      function Kr(e2) {
        const t4 = e2._reader;
        return !(t4 === void 0 || !je(t4));
      }
      n3(Kr, "ReadableStreamHasBYOBReader");
      const Sn = class Sn {
        constructor(t4) {
          if (Se(t4, 1, "ReadableStreamBYOBReader"), jr(t4, "First parameter"), qe(t4)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          if (!Ie(t4._readableStreamController)) throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          Yn(this, t4), this._readIntoRequests = new D2();
        }
        get closed() {
          return je(this) ? this._closedPromise : b(Yt("closed"));
        }
        cancel(t4 = void 0) {
          return je(this) ? this._ownerReadableStream === void 0 ? b(Lt("cancel")) : Wr(this, t4) : b(Yt("cancel"));
        }
        read(t4, r5 = {}) {
          if (!je(this)) return b(Yt("read"));
          if (!ArrayBuffer.isView(t4)) return b(new TypeError("view must be an array buffer view"));
          if (t4.byteLength === 0) return b(new TypeError("view must have non-zero byteLength"));
          if (t4.buffer.byteLength === 0) return b(new TypeError("view's buffer must have non-zero byteLength"));
          if (Ae(t4.buffer)) return b(new TypeError("view's buffer has been detached"));
          let s2;
          try {
            s2 = ba(r5, "options");
          } catch (y) {
            return b(y);
          }
          const u = s2.min;
          if (u === 0) return b(new TypeError("options.min must be greater than 0"));
          if (oa(t4)) {
            if (u > t4.byteLength) return b(new RangeError("options.min must be less than or equal to view's byteLength"));
          } else if (u > t4.length) return b(new RangeError("options.min must be less than or equal to view's length"));
          if (this._ownerReadableStream === void 0) return b(Lt("read from"));
          let c2, d;
          const m2 = A2((y, C3) => {
            c2 = y, d = C3;
          });
          return Eo(this, t4, u, { _chunkSteps: n3((y) => c2({ value: y, done: false }), "_chunkSteps"), _closeSteps: n3((y) => c2({ value: y, done: true }), "_closeSteps"), _errorSteps: n3((y) => d(y), "_errorSteps") }), m2;
        }
        releaseLock() {
          if (!je(this)) throw Yt("releaseLock");
          this._ownerReadableStream !== void 0 && ya(this);
        }
      };
      n3(Sn, "ReadableStreamBYOBReader");
      let ce = Sn;
      Object.defineProperties(ce.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), h2(ce.prototype.cancel, "cancel"), h2(ce.prototype.read, "read"), h2(ce.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ce.prototype, Symbol.toStringTag, { value: "ReadableStreamBYOBReader", configurable: true });
      function je(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_readIntoRequests") ? false : e2 instanceof ce;
      }
      n3(je, "IsReadableStreamBYOBReader");
      function Eo(e2, t4, r5, s2) {
        const u = e2._ownerReadableStream;
        u._disturbed = true, u._state === "errored" ? s2._errorSteps(u._storedError) : sa(u._readableStreamController, t4, r5, s2);
      }
      n3(Eo, "ReadableStreamBYOBReaderRead");
      function ya(e2) {
        _e(e2);
        const t4 = new TypeError("Reader was released");
        Ao(e2, t4);
      }
      n3(ya, "ReadableStreamBYOBReaderRelease");
      function Ao(e2, t4) {
        const r5 = e2._readIntoRequests;
        e2._readIntoRequests = new D2(), r5.forEach((s2) => {
          s2._errorSteps(t4);
        });
      }
      n3(Ao, "ReadableStreamBYOBReaderErrorReadIntoRequests");
      function Yt(e2) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${e2} can only be used on a ReadableStreamBYOBReader`);
      }
      n3(Yt, "byobReaderBrandCheckException");
      function Tt(e2, t4) {
        const { highWaterMark: r5 } = e2;
        if (r5 === void 0) return t4;
        if (ao(r5) || r5 < 0) throw new RangeError("Invalid highWaterMark");
        return r5;
      }
      n3(Tt, "ExtractHighWaterMark");
      function Gt(e2) {
        const { size: t4 } = e2;
        return t4 || (() => 1);
      }
      n3(Gt, "ExtractSizeAlgorithm");
      function Zt(e2, t4) {
        ue(e2, t4);
        const r5 = e2?.highWaterMark, s2 = e2?.size;
        return { highWaterMark: r5 === void 0 ? void 0 : Ir(r5), size: s2 === void 0 ? void 0 : ga(s2, `${t4} has member 'size' that`) };
      }
      n3(Zt, "convertQueuingStrategy");
      function ga(e2, t4) {
        return Z2(e2, t4), (r5) => Ir(e2(r5));
      }
      n3(ga, "convertQueuingStrategySize");
      function _a(e2, t4) {
        ue(e2, t4);
        const r5 = e2?.abort, s2 = e2?.close, u = e2?.start, c2 = e2?.type, d = e2?.write;
        return { abort: r5 === void 0 ? void 0 : Sa(r5, e2, `${t4} has member 'abort' that`), close: s2 === void 0 ? void 0 : wa(s2, e2, `${t4} has member 'close' that`), start: u === void 0 ? void 0 : Ra(u, e2, `${t4} has member 'start' that`), write: d === void 0 ? void 0 : Ta(d, e2, `${t4} has member 'write' that`), type: c2 };
      }
      n3(_a, "convertUnderlyingSink");
      function Sa(e2, t4, r5) {
        return Z2(e2, r5), (s2) => j(e2, t4, [s2]);
      }
      n3(Sa, "convertUnderlyingSinkAbortCallback");
      function wa(e2, t4, r5) {
        return Z2(e2, r5), () => j(e2, t4, []);
      }
      n3(wa, "convertUnderlyingSinkCloseCallback");
      function Ra(e2, t4, r5) {
        return Z2(e2, r5), (s2) => z(e2, t4, [s2]);
      }
      n3(Ra, "convertUnderlyingSinkStartCallback");
      function Ta(e2, t4, r5) {
        return Z2(e2, r5), (s2, u) => j(e2, t4, [s2, u]);
      }
      n3(Ta, "convertUnderlyingSinkWriteCallback");
      function Bo(e2, t4) {
        if (!Ge(e2)) throw new TypeError(`${t4} is not a WritableStream.`);
      }
      n3(Bo, "assertWritableStream");
      function Ca(e2) {
        if (typeof e2 != "object" || e2 === null) return false;
        try {
          return typeof e2.aborted == "boolean";
        } catch {
          return false;
        }
      }
      n3(Ca, "isAbortSignal");
      const Pa = typeof AbortController == "function";
      function va() {
        if (Pa) return new AbortController();
      }
      n3(va, "createAbortController");
      const wn = class wn {
        constructor(t4 = {}, r5 = {}) {
          t4 === void 0 ? t4 = null : Jn(t4, "First parameter");
          const s2 = Zt(r5, "Second parameter"), u = _a(t4, "First parameter");
          if (Wo(this), u.type !== void 0) throw new RangeError("Invalid type is specified");
          const d = Gt(s2), m2 = Tt(s2, 1);
          Da(this, u, m2, d);
        }
        get locked() {
          if (!Ge(this)) throw tr("locked");
          return Ze(this);
        }
        abort(t4 = void 0) {
          return Ge(this) ? Ze(this) ? b(new TypeError("Cannot abort a stream that already has a writer")) : Kt(this, t4) : b(tr("abort"));
        }
        close() {
          return Ge(this) ? Ze(this) ? b(new TypeError("Cannot close a stream that already has a writer")) : he(this) ? b(new TypeError("Cannot close an already-closing stream")) : qo(this) : b(tr("close"));
        }
        getWriter() {
          if (!Ge(this)) throw tr("getWriter");
          return ko(this);
        }
      };
      n3(wn, "WritableStream");
      let de = wn;
      Object.defineProperties(de.prototype, { abort: { enumerable: true }, close: { enumerable: true }, getWriter: { enumerable: true }, locked: { enumerable: true } }), h2(de.prototype.abort, "abort"), h2(de.prototype.close, "close"), h2(de.prototype.getWriter, "getWriter"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(de.prototype, Symbol.toStringTag, { value: "WritableStream", configurable: true });
      function ko(e2) {
        return new re(e2);
      }
      n3(ko, "AcquireWritableStreamDefaultWriter");
      function Ea(e2, t4, r5, s2, u = 1, c2 = () => 1) {
        const d = Object.create(de.prototype);
        Wo(d);
        const m2 = Object.create(ke.prototype);
        return Lo(d, m2, e2, t4, r5, s2, u, c2), d;
      }
      n3(Ea, "CreateWritableStream");
      function Wo(e2) {
        e2._state = "writable", e2._storedError = void 0, e2._writer = void 0, e2._writableStreamController = void 0, e2._writeRequests = new D2(), e2._inFlightWriteRequest = void 0, e2._closeRequest = void 0, e2._inFlightCloseRequest = void 0, e2._pendingAbortRequest = void 0, e2._backpressure = false;
      }
      n3(Wo, "InitializeWritableStream");
      function Ge(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_writableStreamController") ? false : e2 instanceof de;
      }
      n3(Ge, "IsWritableStream");
      function Ze(e2) {
        return e2._writer !== void 0;
      }
      n3(Ze, "IsWritableStreamLocked");
      function Kt(e2, t4) {
        var r5;
        if (e2._state === "closed" || e2._state === "errored") return T2(void 0);
        e2._writableStreamController._abortReason = t4, (r5 = e2._writableStreamController._abortController) === null || r5 === void 0 || r5.abort(t4);
        const s2 = e2._state;
        if (s2 === "closed" || s2 === "errored") return T2(void 0);
        if (e2._pendingAbortRequest !== void 0) return e2._pendingAbortRequest._promise;
        let u = false;
        s2 === "erroring" && (u = true, t4 = void 0);
        const c2 = A2((d, m2) => {
          e2._pendingAbortRequest = { _promise: void 0, _resolve: d, _reject: m2, _reason: t4, _wasAlreadyErroring: u };
        });
        return e2._pendingAbortRequest._promise = c2, u || Xr(e2, t4), c2;
      }
      n3(Kt, "WritableStreamAbort");
      function qo(e2) {
        const t4 = e2._state;
        if (t4 === "closed" || t4 === "errored") return b(new TypeError(`The stream (in ${t4} state) is not in the writable state and cannot be closed`));
        const r5 = A2((u, c2) => {
          const d = { _resolve: u, _reject: c2 };
          e2._closeRequest = d;
        }), s2 = e2._writer;
        return s2 !== void 0 && e2._backpressure && t4 === "writable" && ln(s2), Ma(e2._writableStreamController), r5;
      }
      n3(qo, "WritableStreamClose");
      function Aa(e2) {
        return A2((r5, s2) => {
          const u = { _resolve: r5, _reject: s2 };
          e2._writeRequests.push(u);
        });
      }
      n3(Aa, "WritableStreamAddWriteRequest");
      function Jr(e2, t4) {
        if (e2._state === "writable") {
          Xr(e2, t4);
          return;
        }
        en(e2);
      }
      n3(Jr, "WritableStreamDealWithRejection");
      function Xr(e2, t4) {
        const r5 = e2._writableStreamController;
        e2._state = "erroring", e2._storedError = t4;
        const s2 = e2._writer;
        s2 !== void 0 && zo(s2, t4), !Oa(e2) && r5._started && en(e2);
      }
      n3(Xr, "WritableStreamStartErroring");
      function en(e2) {
        e2._state = "errored", e2._writableStreamController[Qn]();
        const t4 = e2._storedError;
        if (e2._writeRequests.forEach((u) => {
          u._reject(t4);
        }), e2._writeRequests = new D2(), e2._pendingAbortRequest === void 0) {
          Jt(e2);
          return;
        }
        const r5 = e2._pendingAbortRequest;
        if (e2._pendingAbortRequest = void 0, r5._wasAlreadyErroring) {
          r5._reject(t4), Jt(e2);
          return;
        }
        const s2 = e2._writableStreamController[jt](r5._reason);
        g2(s2, () => (r5._resolve(), Jt(e2), null), (u) => (r5._reject(u), Jt(e2), null));
      }
      n3(en, "WritableStreamFinishErroring");
      function Ba(e2) {
        e2._inFlightWriteRequest._resolve(void 0), e2._inFlightWriteRequest = void 0;
      }
      n3(Ba, "WritableStreamFinishInFlightWrite");
      function ka(e2, t4) {
        e2._inFlightWriteRequest._reject(t4), e2._inFlightWriteRequest = void 0, Jr(e2, t4);
      }
      n3(ka, "WritableStreamFinishInFlightWriteWithError");
      function Wa(e2) {
        e2._inFlightCloseRequest._resolve(void 0), e2._inFlightCloseRequest = void 0, e2._state === "erroring" && (e2._storedError = void 0, e2._pendingAbortRequest !== void 0 && (e2._pendingAbortRequest._resolve(), e2._pendingAbortRequest = void 0)), e2._state = "closed";
        const r5 = e2._writer;
        r5 !== void 0 && Uo(r5);
      }
      n3(Wa, "WritableStreamFinishInFlightClose");
      function qa(e2, t4) {
        e2._inFlightCloseRequest._reject(t4), e2._inFlightCloseRequest = void 0, e2._pendingAbortRequest !== void 0 && (e2._pendingAbortRequest._reject(t4), e2._pendingAbortRequest = void 0), Jr(e2, t4);
      }
      n3(qa, "WritableStreamFinishInFlightCloseWithError");
      function he(e2) {
        return !(e2._closeRequest === void 0 && e2._inFlightCloseRequest === void 0);
      }
      n3(he, "WritableStreamCloseQueuedOrInFlight");
      function Oa(e2) {
        return !(e2._inFlightWriteRequest === void 0 && e2._inFlightCloseRequest === void 0);
      }
      n3(Oa, "WritableStreamHasOperationMarkedInFlight");
      function za(e2) {
        e2._inFlightCloseRequest = e2._closeRequest, e2._closeRequest = void 0;
      }
      n3(za, "WritableStreamMarkCloseRequestInFlight");
      function Ia(e2) {
        e2._inFlightWriteRequest = e2._writeRequests.shift();
      }
      n3(Ia, "WritableStreamMarkFirstWriteRequestInFlight");
      function Jt(e2) {
        e2._closeRequest !== void 0 && (e2._closeRequest._reject(e2._storedError), e2._closeRequest = void 0);
        const t4 = e2._writer;
        t4 !== void 0 && an(t4, e2._storedError);
      }
      n3(Jt, "WritableStreamRejectCloseAndClosedPromiseIfNeeded");
      function tn(e2, t4) {
        const r5 = e2._writer;
        r5 !== void 0 && t4 !== e2._backpressure && (t4 ? Ya(r5) : ln(r5)), e2._backpressure = t4;
      }
      n3(tn, "WritableStreamUpdateBackpressure");
      const Rn = class Rn {
        constructor(t4) {
          if (Se(t4, 1, "WritableStreamDefaultWriter"), Bo(t4, "First parameter"), Ze(t4)) throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          this._ownerWritableStream = t4, t4._writer = this;
          const r5 = t4._state;
          if (r5 === "writable") !he(t4) && t4._backpressure ? nr(this) : xo(this), rr(this);
          else if (r5 === "erroring") sn(this, t4._storedError), rr(this);
          else if (r5 === "closed") xo(this), Va(this);
          else {
            const s2 = t4._storedError;
            sn(this, s2), Mo(this, s2);
          }
        }
        get closed() {
          return Le(this) ? this._closedPromise : b($e("closed"));
        }
        get desiredSize() {
          if (!Le(this)) throw $e("desiredSize");
          if (this._ownerWritableStream === void 0) throw Pt("desiredSize");
          return $a(this);
        }
        get ready() {
          return Le(this) ? this._readyPromise : b($e("ready"));
        }
        abort(t4 = void 0) {
          return Le(this) ? this._ownerWritableStream === void 0 ? b(Pt("abort")) : Fa(this, t4) : b($e("abort"));
        }
        close() {
          if (!Le(this)) return b($e("close"));
          const t4 = this._ownerWritableStream;
          return t4 === void 0 ? b(Pt("close")) : he(t4) ? b(new TypeError("Cannot close an already-closing stream")) : Oo(this);
        }
        releaseLock() {
          if (!Le(this)) throw $e("releaseLock");
          this._ownerWritableStream !== void 0 && Io(this);
        }
        write(t4 = void 0) {
          return Le(this) ? this._ownerWritableStream === void 0 ? b(Pt("write to")) : Fo(this, t4) : b($e("write"));
        }
      };
      n3(Rn, "WritableStreamDefaultWriter");
      let re = Rn;
      Object.defineProperties(re.prototype, { abort: { enumerable: true }, close: { enumerable: true }, releaseLock: { enumerable: true }, write: { enumerable: true }, closed: { enumerable: true }, desiredSize: { enumerable: true }, ready: { enumerable: true } }), h2(re.prototype.abort, "abort"), h2(re.prototype.close, "close"), h2(re.prototype.releaseLock, "releaseLock"), h2(re.prototype.write, "write"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(re.prototype, Symbol.toStringTag, { value: "WritableStreamDefaultWriter", configurable: true });
      function Le(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_ownerWritableStream") ? false : e2 instanceof re;
      }
      n3(Le, "IsWritableStreamDefaultWriter");
      function Fa(e2, t4) {
        const r5 = e2._ownerWritableStream;
        return Kt(r5, t4);
      }
      n3(Fa, "WritableStreamDefaultWriterAbort");
      function Oo(e2) {
        const t4 = e2._ownerWritableStream;
        return qo(t4);
      }
      n3(Oo, "WritableStreamDefaultWriterClose");
      function ja(e2) {
        const t4 = e2._ownerWritableStream, r5 = t4._state;
        return he(t4) || r5 === "closed" ? T2(void 0) : r5 === "errored" ? b(t4._storedError) : Oo(e2);
      }
      n3(ja, "WritableStreamDefaultWriterCloseWithErrorPropagation");
      function La(e2, t4) {
        e2._closedPromiseState === "pending" ? an(e2, t4) : Qa(e2, t4);
      }
      n3(La, "WritableStreamDefaultWriterEnsureClosedPromiseRejected");
      function zo(e2, t4) {
        e2._readyPromiseState === "pending" ? No(e2, t4) : Ga(e2, t4);
      }
      n3(zo, "WritableStreamDefaultWriterEnsureReadyPromiseRejected");
      function $a(e2) {
        const t4 = e2._ownerWritableStream, r5 = t4._state;
        return r5 === "errored" || r5 === "erroring" ? null : r5 === "closed" ? 0 : $o(t4._writableStreamController);
      }
      n3($a, "WritableStreamDefaultWriterGetDesiredSize");
      function Io(e2) {
        const t4 = e2._ownerWritableStream, r5 = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
        zo(e2, r5), La(e2, r5), t4._writer = void 0, e2._ownerWritableStream = void 0;
      }
      n3(Io, "WritableStreamDefaultWriterRelease");
      function Fo(e2, t4) {
        const r5 = e2._ownerWritableStream, s2 = r5._writableStreamController, u = Ua(s2, t4);
        if (r5 !== e2._ownerWritableStream) return b(Pt("write to"));
        const c2 = r5._state;
        if (c2 === "errored") return b(r5._storedError);
        if (he(r5) || c2 === "closed") return b(new TypeError("The stream is closing or closed and cannot be written to"));
        if (c2 === "erroring") return b(r5._storedError);
        const d = Aa(r5);
        return xa(s2, t4, u), d;
      }
      n3(Fo, "WritableStreamDefaultWriterWrite");
      const jo = {}, Tn = class Tn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get abortReason() {
          if (!rn(this)) throw on("abortReason");
          return this._abortReason;
        }
        get signal() {
          if (!rn(this)) throw on("signal");
          if (this._abortController === void 0) throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          return this._abortController.signal;
        }
        error(t4 = void 0) {
          if (!rn(this)) throw on("error");
          this._controlledWritableStream._state === "writable" && Do(this, t4);
        }
        [jt](t4) {
          const r5 = this._abortAlgorithm(t4);
          return Xt(this), r5;
        }
        [Qn]() {
          Be(this);
        }
      };
      n3(Tn, "WritableStreamDefaultController");
      let ke = Tn;
      Object.defineProperties(ke.prototype, { abortReason: { enumerable: true }, signal: { enumerable: true }, error: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ke.prototype, Symbol.toStringTag, { value: "WritableStreamDefaultController", configurable: true });
      function rn(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_controlledWritableStream") ? false : e2 instanceof ke;
      }
      n3(rn, "IsWritableStreamDefaultController");
      function Lo(e2, t4, r5, s2, u, c2, d, m2) {
        t4._controlledWritableStream = e2, e2._writableStreamController = t4, t4._queue = void 0, t4._queueTotalSize = void 0, Be(t4), t4._abortReason = void 0, t4._abortController = va(), t4._started = false, t4._strategySizeAlgorithm = m2, t4._strategyHWM = d, t4._writeAlgorithm = s2, t4._closeAlgorithm = u, t4._abortAlgorithm = c2;
        const R3 = nn(t4);
        tn(e2, R3);
        const y = r5(), C3 = T2(y);
        g2(C3, () => (t4._started = true, er(t4), null), (P2) => (t4._started = true, Jr(e2, P2), null));
      }
      n3(Lo, "SetUpWritableStreamDefaultController");
      function Da(e2, t4, r5, s2) {
        const u = Object.create(ke.prototype);
        let c2, d, m2, R3;
        t4.start !== void 0 ? c2 = n3(() => t4.start(u), "startAlgorithm") : c2 = n3(() => {
        }, "startAlgorithm"), t4.write !== void 0 ? d = n3((y) => t4.write(y, u), "writeAlgorithm") : d = n3(() => T2(void 0), "writeAlgorithm"), t4.close !== void 0 ? m2 = n3(() => t4.close(), "closeAlgorithm") : m2 = n3(() => T2(void 0), "closeAlgorithm"), t4.abort !== void 0 ? R3 = n3((y) => t4.abort(y), "abortAlgorithm") : R3 = n3(() => T2(void 0), "abortAlgorithm"), Lo(e2, u, c2, d, m2, R3, r5, s2);
      }
      n3(Da, "SetUpWritableStreamDefaultControllerFromUnderlyingSink");
      function Xt(e2) {
        e2._writeAlgorithm = void 0, e2._closeAlgorithm = void 0, e2._abortAlgorithm = void 0, e2._strategySizeAlgorithm = void 0;
      }
      n3(Xt, "WritableStreamDefaultControllerClearAlgorithms");
      function Ma(e2) {
        Nr(e2, jo, 0), er(e2);
      }
      n3(Ma, "WritableStreamDefaultControllerClose");
      function Ua(e2, t4) {
        try {
          return e2._strategySizeAlgorithm(t4);
        } catch (r5) {
          return Ct(e2, r5), 1;
        }
      }
      n3(Ua, "WritableStreamDefaultControllerGetChunkSize");
      function $o(e2) {
        return e2._strategyHWM - e2._queueTotalSize;
      }
      n3($o, "WritableStreamDefaultControllerGetDesiredSize");
      function xa(e2, t4, r5) {
        try {
          Nr(e2, t4, r5);
        } catch (u) {
          Ct(e2, u);
          return;
        }
        const s2 = e2._controlledWritableStream;
        if (!he(s2) && s2._state === "writable") {
          const u = nn(e2);
          tn(s2, u);
        }
        er(e2);
      }
      n3(xa, "WritableStreamDefaultControllerWrite");
      function er(e2) {
        const t4 = e2._controlledWritableStream;
        if (!e2._started || t4._inFlightWriteRequest !== void 0) return;
        if (t4._state === "erroring") {
          en(t4);
          return;
        }
        if (e2._queue.length === 0) return;
        const s2 = na(e2);
        s2 === jo ? Na(e2) : Ha(e2, s2);
      }
      n3(er, "WritableStreamDefaultControllerAdvanceQueueIfNeeded");
      function Ct(e2, t4) {
        e2._controlledWritableStream._state === "writable" && Do(e2, t4);
      }
      n3(Ct, "WritableStreamDefaultControllerErrorIfNeeded");
      function Na(e2) {
        const t4 = e2._controlledWritableStream;
        za(t4), xr(e2);
        const r5 = e2._closeAlgorithm();
        Xt(e2), g2(r5, () => (Wa(t4), null), (s2) => (qa(t4, s2), null));
      }
      n3(Na, "WritableStreamDefaultControllerProcessClose");
      function Ha(e2, t4) {
        const r5 = e2._controlledWritableStream;
        Ia(r5);
        const s2 = e2._writeAlgorithm(t4);
        g2(s2, () => {
          Ba(r5);
          const u = r5._state;
          if (xr(e2), !he(r5) && u === "writable") {
            const c2 = nn(e2);
            tn(r5, c2);
          }
          return er(e2), null;
        }, (u) => (r5._state === "writable" && Xt(e2), ka(r5, u), null));
      }
      n3(Ha, "WritableStreamDefaultControllerProcessWrite");
      function nn(e2) {
        return $o(e2) <= 0;
      }
      n3(nn, "WritableStreamDefaultControllerGetBackpressure");
      function Do(e2, t4) {
        const r5 = e2._controlledWritableStream;
        Xt(e2), Xr(r5, t4);
      }
      n3(Do, "WritableStreamDefaultControllerError");
      function tr(e2) {
        return new TypeError(`WritableStream.prototype.${e2} can only be used on a WritableStream`);
      }
      n3(tr, "streamBrandCheckException$2");
      function on(e2) {
        return new TypeError(`WritableStreamDefaultController.prototype.${e2} can only be used on a WritableStreamDefaultController`);
      }
      n3(on, "defaultControllerBrandCheckException$2");
      function $e(e2) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${e2} can only be used on a WritableStreamDefaultWriter`);
      }
      n3($e, "defaultWriterBrandCheckException");
      function Pt(e2) {
        return new TypeError("Cannot " + e2 + " a stream using a released writer");
      }
      n3(Pt, "defaultWriterLockException");
      function rr(e2) {
        e2._closedPromise = A2((t4, r5) => {
          e2._closedPromise_resolve = t4, e2._closedPromise_reject = r5, e2._closedPromiseState = "pending";
        });
      }
      n3(rr, "defaultWriterClosedPromiseInitialize");
      function Mo(e2, t4) {
        rr(e2), an(e2, t4);
      }
      n3(Mo, "defaultWriterClosedPromiseInitializeAsRejected");
      function Va(e2) {
        rr(e2), Uo(e2);
      }
      n3(Va, "defaultWriterClosedPromiseInitializeAsResolved");
      function an(e2, t4) {
        e2._closedPromise_reject !== void 0 && (Q(e2._closedPromise), e2._closedPromise_reject(t4), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0, e2._closedPromiseState = "rejected");
      }
      n3(an, "defaultWriterClosedPromiseReject");
      function Qa(e2, t4) {
        Mo(e2, t4);
      }
      n3(Qa, "defaultWriterClosedPromiseResetToRejected");
      function Uo(e2) {
        e2._closedPromise_resolve !== void 0 && (e2._closedPromise_resolve(void 0), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0, e2._closedPromiseState = "resolved");
      }
      n3(Uo, "defaultWriterClosedPromiseResolve");
      function nr(e2) {
        e2._readyPromise = A2((t4, r5) => {
          e2._readyPromise_resolve = t4, e2._readyPromise_reject = r5;
        }), e2._readyPromiseState = "pending";
      }
      n3(nr, "defaultWriterReadyPromiseInitialize");
      function sn(e2, t4) {
        nr(e2), No(e2, t4);
      }
      n3(sn, "defaultWriterReadyPromiseInitializeAsRejected");
      function xo(e2) {
        nr(e2), ln(e2);
      }
      n3(xo, "defaultWriterReadyPromiseInitializeAsResolved");
      function No(e2, t4) {
        e2._readyPromise_reject !== void 0 && (Q(e2._readyPromise), e2._readyPromise_reject(t4), e2._readyPromise_resolve = void 0, e2._readyPromise_reject = void 0, e2._readyPromiseState = "rejected");
      }
      n3(No, "defaultWriterReadyPromiseReject");
      function Ya(e2) {
        nr(e2);
      }
      n3(Ya, "defaultWriterReadyPromiseReset");
      function Ga(e2, t4) {
        sn(e2, t4);
      }
      n3(Ga, "defaultWriterReadyPromiseResetToRejected");
      function ln(e2) {
        e2._readyPromise_resolve !== void 0 && (e2._readyPromise_resolve(void 0), e2._readyPromise_resolve = void 0, e2._readyPromise_reject = void 0, e2._readyPromiseState = "fulfilled");
      }
      n3(ln, "defaultWriterReadyPromiseResolve");
      function Za() {
        if (typeof globalThis < "u") return globalThis;
        if (typeof self < "u") return self;
        if (typeof n2 < "u") return n2;
      }
      n3(Za, "getGlobals");
      const un = Za();
      function Ka(e2) {
        if (!(typeof e2 == "function" || typeof e2 == "object") || e2.name !== "DOMException") return false;
        try {
          return new e2(), true;
        } catch {
          return false;
        }
      }
      n3(Ka, "isDOMExceptionConstructor");
      function Ja() {
        const e2 = un?.DOMException;
        return Ka(e2) ? e2 : void 0;
      }
      n3(Ja, "getFromGlobal");
      function Xa() {
        const e2 = n3(function(r5, s2) {
          this.message = r5 || "", this.name = s2 || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
        }, "DOMException");
        return h2(e2, "DOMException"), e2.prototype = Object.create(Error.prototype), Object.defineProperty(e2.prototype, "constructor", { value: e2, writable: true, configurable: true }), e2;
      }
      n3(Xa, "createPolyfill");
      const es = Ja() || Xa();
      function Ho(e2, t4, r5, s2, u, c2) {
        const d = Qe(e2), m2 = ko(t4);
        e2._disturbed = true;
        let R3 = false, y = T2(void 0);
        return A2((C3, P2) => {
          let B2;
          if (c2 !== void 0) {
            if (B2 = n3(() => {
              const _ = c2.reason !== void 0 ? c2.reason : new es("Aborted", "AbortError"), E3 = [];
              s2 || E3.push(() => t4._state === "writable" ? Kt(t4, _) : T2(void 0)), u || E3.push(() => e2._state === "readable" ? ie(e2, _) : T2(void 0)), N2(() => Promise.all(E3.map((k2) => k2())), true, _);
            }, "abortAlgorithm"), c2.aborted) {
              B2();
              return;
            }
            c2.addEventListener("abort", B2);
          }
          function ae() {
            return A2((_, E3) => {
              function k2(Y) {
                Y ? _() : q(nt(), k2, E3);
              }
              n3(k2, "next"), k2(false);
            });
          }
          n3(ae, "pipeLoop");
          function nt() {
            return R3 ? T2(true) : q(m2._readyPromise, () => A2((_, E3) => {
              _t(d, { _chunkSteps: n3((k2) => {
                y = q(Fo(m2, k2), void 0, f2), _(false);
              }, "_chunkSteps"), _closeSteps: n3(() => _(true), "_closeSteps"), _errorSteps: E3 });
            }));
          }
          if (n3(nt, "pipeStep"), Te(e2, d._closedPromise, (_) => (s2 ? J(true, _) : N2(() => Kt(t4, _), true, _), null)), Te(t4, m2._closedPromise, (_) => (u ? J(true, _) : N2(() => ie(e2, _), true, _), null)), x2(e2, d._closedPromise, () => (r5 ? J() : N2(() => ja(m2)), null)), he(t4) || t4._state === "closed") {
            const _ = new TypeError("the destination writable stream closed before all data could be piped to it");
            u ? J(true, _) : N2(() => ie(e2, _), true, _);
          }
          Q(ae());
          function Oe() {
            const _ = y;
            return q(y, () => _ !== y ? Oe() : void 0);
          }
          n3(Oe, "waitForWritesToFinish");
          function Te(_, E3, k2) {
            _._state === "errored" ? k2(_._storedError) : I2(E3, k2);
          }
          n3(Te, "isOrBecomesErrored");
          function x2(_, E3, k2) {
            _._state === "closed" ? k2() : V(E3, k2);
          }
          n3(x2, "isOrBecomesClosed");
          function N2(_, E3, k2) {
            if (R3) return;
            R3 = true, t4._state === "writable" && !he(t4) ? V(Oe(), Y) : Y();
            function Y() {
              return g2(_(), () => Ce(E3, k2), (ot) => Ce(true, ot)), null;
            }
            n3(Y, "doTheRest");
          }
          n3(N2, "shutdownWithAction");
          function J(_, E3) {
            R3 || (R3 = true, t4._state === "writable" && !he(t4) ? V(Oe(), () => Ce(_, E3)) : Ce(_, E3));
          }
          n3(J, "shutdown");
          function Ce(_, E3) {
            return Io(m2), _e(d), c2 !== void 0 && c2.removeEventListener("abort", B2), _ ? P2(E3) : C3(void 0), null;
          }
          n3(Ce, "finalize");
        });
      }
      n3(Ho, "ReadableStreamPipeTo");
      const Cn = class Cn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get desiredSize() {
          if (!or(this)) throw ar("desiredSize");
          return fn(this);
        }
        close() {
          if (!or(this)) throw ar("close");
          if (!Je(this)) throw new TypeError("The stream is not in a state that permits close");
          De(this);
        }
        enqueue(t4 = void 0) {
          if (!or(this)) throw ar("enqueue");
          if (!Je(this)) throw new TypeError("The stream is not in a state that permits enqueue");
          return Ke(this, t4);
        }
        error(t4 = void 0) {
          if (!or(this)) throw ar("error");
          oe(this, t4);
        }
        [Ar](t4) {
          Be(this);
          const r5 = this._cancelAlgorithm(t4);
          return ir(this), r5;
        }
        [Br](t4) {
          const r5 = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const s2 = xr(this);
            this._closeRequested && this._queue.length === 0 ? (ir(this), At(r5)) : vt(this), t4._chunkSteps(s2);
          } else eo(r5, t4), vt(this);
        }
        [kr]() {
        }
      };
      n3(Cn, "ReadableStreamDefaultController");
      let ne = Cn;
      Object.defineProperties(ne.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, desiredSize: { enumerable: true } }), h2(ne.prototype.close, "close"), h2(ne.prototype.enqueue, "enqueue"), h2(ne.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ne.prototype, Symbol.toStringTag, { value: "ReadableStreamDefaultController", configurable: true });
      function or(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_controlledReadableStream") ? false : e2 instanceof ne;
      }
      n3(or, "IsReadableStreamDefaultController");
      function vt(e2) {
        if (!Vo(e2)) return;
        if (e2._pulling) {
          e2._pullAgain = true;
          return;
        }
        e2._pulling = true;
        const r5 = e2._pullAlgorithm();
        g2(r5, () => (e2._pulling = false, e2._pullAgain && (e2._pullAgain = false, vt(e2)), null), (s2) => (oe(e2, s2), null));
      }
      n3(vt, "ReadableStreamDefaultControllerCallPullIfNeeded");
      function Vo(e2) {
        const t4 = e2._controlledReadableStream;
        return !Je(e2) || !e2._started ? false : !!(qe(t4) && $t(t4) > 0 || fn(e2) > 0);
      }
      n3(Vo, "ReadableStreamDefaultControllerShouldCallPull");
      function ir(e2) {
        e2._pullAlgorithm = void 0, e2._cancelAlgorithm = void 0, e2._strategySizeAlgorithm = void 0;
      }
      n3(ir, "ReadableStreamDefaultControllerClearAlgorithms");
      function De(e2) {
        if (!Je(e2)) return;
        const t4 = e2._controlledReadableStream;
        e2._closeRequested = true, e2._queue.length === 0 && (ir(e2), At(t4));
      }
      n3(De, "ReadableStreamDefaultControllerClose");
      function Ke(e2, t4) {
        if (!Je(e2)) return;
        const r5 = e2._controlledReadableStream;
        if (qe(r5) && $t(r5) > 0) Lr(r5, t4, false);
        else {
          let s2;
          try {
            s2 = e2._strategySizeAlgorithm(t4);
          } catch (u) {
            throw oe(e2, u), u;
          }
          try {
            Nr(e2, t4, s2);
          } catch (u) {
            throw oe(e2, u), u;
          }
        }
        vt(e2);
      }
      n3(Ke, "ReadableStreamDefaultControllerEnqueue");
      function oe(e2, t4) {
        const r5 = e2._controlledReadableStream;
        r5._state === "readable" && (Be(e2), ir(e2), Zo(r5, t4));
      }
      n3(oe, "ReadableStreamDefaultControllerError");
      function fn(e2) {
        const t4 = e2._controlledReadableStream._state;
        return t4 === "errored" ? null : t4 === "closed" ? 0 : e2._strategyHWM - e2._queueTotalSize;
      }
      n3(fn, "ReadableStreamDefaultControllerGetDesiredSize");
      function ts(e2) {
        return !Vo(e2);
      }
      n3(ts, "ReadableStreamDefaultControllerHasBackpressure");
      function Je(e2) {
        const t4 = e2._controlledReadableStream._state;
        return !e2._closeRequested && t4 === "readable";
      }
      n3(Je, "ReadableStreamDefaultControllerCanCloseOrEnqueue");
      function Qo(e2, t4, r5, s2, u, c2, d) {
        t4._controlledReadableStream = e2, t4._queue = void 0, t4._queueTotalSize = void 0, Be(t4), t4._started = false, t4._closeRequested = false, t4._pullAgain = false, t4._pulling = false, t4._strategySizeAlgorithm = d, t4._strategyHWM = c2, t4._pullAlgorithm = s2, t4._cancelAlgorithm = u, e2._readableStreamController = t4;
        const m2 = r5();
        g2(T2(m2), () => (t4._started = true, vt(t4), null), (R3) => (oe(t4, R3), null));
      }
      n3(Qo, "SetUpReadableStreamDefaultController");
      function rs(e2, t4, r5, s2) {
        const u = Object.create(ne.prototype);
        let c2, d, m2;
        t4.start !== void 0 ? c2 = n3(() => t4.start(u), "startAlgorithm") : c2 = n3(() => {
        }, "startAlgorithm"), t4.pull !== void 0 ? d = n3(() => t4.pull(u), "pullAlgorithm") : d = n3(() => T2(void 0), "pullAlgorithm"), t4.cancel !== void 0 ? m2 = n3((R3) => t4.cancel(R3), "cancelAlgorithm") : m2 = n3(() => T2(void 0), "cancelAlgorithm"), Qo(e2, u, c2, d, m2, r5, s2);
      }
      n3(rs, "SetUpReadableStreamDefaultControllerFromUnderlyingSource");
      function ar(e2) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${e2} can only be used on a ReadableStreamDefaultController`);
      }
      n3(ar, "defaultControllerBrandCheckException$1");
      function ns(e2, t4) {
        return Ie(e2._readableStreamController) ? is(e2) : os(e2);
      }
      n3(ns, "ReadableStreamTee");
      function os(e2, t4) {
        const r5 = Qe(e2);
        let s2 = false, u = false, c2 = false, d = false, m2, R3, y, C3, P2;
        const B2 = A2((x2) => {
          P2 = x2;
        });
        function ae() {
          return s2 ? (u = true, T2(void 0)) : (s2 = true, _t(r5, { _chunkSteps: n3((N2) => {
            ge(() => {
              u = false;
              const J = N2, Ce = N2;
              c2 || Ke(y._readableStreamController, J), d || Ke(C3._readableStreamController, Ce), s2 = false, u && ae();
            });
          }, "_chunkSteps"), _closeSteps: n3(() => {
            s2 = false, c2 || De(y._readableStreamController), d || De(C3._readableStreamController), (!c2 || !d) && P2(void 0);
          }, "_closeSteps"), _errorSteps: n3(() => {
            s2 = false;
          }, "_errorSteps") }), T2(void 0));
        }
        n3(ae, "pullAlgorithm");
        function nt(x2) {
          if (c2 = true, m2 = x2, d) {
            const N2 = St([m2, R3]), J = ie(e2, N2);
            P2(J);
          }
          return B2;
        }
        n3(nt, "cancel1Algorithm");
        function Oe(x2) {
          if (d = true, R3 = x2, c2) {
            const N2 = St([m2, R3]), J = ie(e2, N2);
            P2(J);
          }
          return B2;
        }
        n3(Oe, "cancel2Algorithm");
        function Te() {
        }
        return n3(Te, "startAlgorithm"), y = Et(Te, ae, nt), C3 = Et(Te, ae, Oe), I2(r5._closedPromise, (x2) => (oe(y._readableStreamController, x2), oe(C3._readableStreamController, x2), (!c2 || !d) && P2(void 0), null)), [y, C3];
      }
      n3(os, "ReadableStreamDefaultTee");
      function is(e2) {
        let t4 = Qe(e2), r5 = false, s2 = false, u = false, c2 = false, d = false, m2, R3, y, C3, P2;
        const B2 = A2((_) => {
          P2 = _;
        });
        function ae(_) {
          I2(_._closedPromise, (E3) => (_ !== t4 || (K(y._readableStreamController, E3), K(C3._readableStreamController, E3), (!c2 || !d) && P2(void 0)), null));
        }
        n3(ae, "forwardReaderError");
        function nt() {
          je(t4) && (_e(t4), t4 = Qe(e2), ae(t4)), _t(t4, { _chunkSteps: n3((E3) => {
            ge(() => {
              s2 = false, u = false;
              const k2 = E3;
              let Y = E3;
              if (!c2 && !d) try {
                Y = fo(E3);
              } catch (ot) {
                K(y._readableStreamController, ot), K(C3._readableStreamController, ot), P2(ie(e2, ot));
                return;
              }
              c2 || Ht(y._readableStreamController, k2), d || Ht(C3._readableStreamController, Y), r5 = false, s2 ? Te() : u && x2();
            });
          }, "_chunkSteps"), _closeSteps: n3(() => {
            r5 = false, c2 || wt(y._readableStreamController), d || wt(C3._readableStreamController), y._readableStreamController._pendingPullIntos.length > 0 && Vt(y._readableStreamController, 0), C3._readableStreamController._pendingPullIntos.length > 0 && Vt(C3._readableStreamController, 0), (!c2 || !d) && P2(void 0);
          }, "_closeSteps"), _errorSteps: n3(() => {
            r5 = false;
          }, "_errorSteps") });
        }
        n3(nt, "pullWithDefaultReader");
        function Oe(_, E3) {
          Ee(t4) && (_e(t4), t4 = Co(e2), ae(t4));
          const k2 = E3 ? C3 : y, Y = E3 ? y : C3;
          Eo(t4, _, 1, { _chunkSteps: n3((it) => {
            ge(() => {
              s2 = false, u = false;
              const at = E3 ? d : c2;
              if (E3 ? c2 : d) at || Qt(k2._readableStreamController, it);
              else {
                let ui;
                try {
                  ui = fo(it);
                } catch (kn) {
                  K(k2._readableStreamController, kn), K(Y._readableStreamController, kn), P2(ie(e2, kn));
                  return;
                }
                at || Qt(k2._readableStreamController, it), Ht(Y._readableStreamController, ui);
              }
              r5 = false, s2 ? Te() : u && x2();
            });
          }, "_chunkSteps"), _closeSteps: n3((it) => {
            r5 = false;
            const at = E3 ? d : c2, cr = E3 ? c2 : d;
            at || wt(k2._readableStreamController), cr || wt(Y._readableStreamController), it !== void 0 && (at || Qt(k2._readableStreamController, it), !cr && Y._readableStreamController._pendingPullIntos.length > 0 && Vt(Y._readableStreamController, 0)), (!at || !cr) && P2(void 0);
          }, "_closeSteps"), _errorSteps: n3(() => {
            r5 = false;
          }, "_errorSteps") });
        }
        n3(Oe, "pullWithBYOBReader");
        function Te() {
          if (r5) return s2 = true, T2(void 0);
          r5 = true;
          const _ = Gr(y._readableStreamController);
          return _ === null ? nt() : Oe(_._view, false), T2(void 0);
        }
        n3(Te, "pull1Algorithm");
        function x2() {
          if (r5) return u = true, T2(void 0);
          r5 = true;
          const _ = Gr(C3._readableStreamController);
          return _ === null ? nt() : Oe(_._view, true), T2(void 0);
        }
        n3(x2, "pull2Algorithm");
        function N2(_) {
          if (c2 = true, m2 = _, d) {
            const E3 = St([m2, R3]), k2 = ie(e2, E3);
            P2(k2);
          }
          return B2;
        }
        n3(N2, "cancel1Algorithm");
        function J(_) {
          if (d = true, R3 = _, c2) {
            const E3 = St([m2, R3]), k2 = ie(e2, E3);
            P2(k2);
          }
          return B2;
        }
        n3(J, "cancel2Algorithm");
        function Ce() {
        }
        return n3(Ce, "startAlgorithm"), y = Go(Ce, Te, N2), C3 = Go(Ce, x2, J), ae(t4), [y, C3];
      }
      n3(is, "ReadableByteStreamTee");
      function as(e2) {
        return l(e2) && typeof e2.getReader < "u";
      }
      n3(as, "isReadableStreamLike");
      function ss(e2) {
        return as(e2) ? us(e2.getReader()) : ls(e2);
      }
      n3(ss, "ReadableStreamFrom");
      function ls(e2) {
        let t4;
        const r5 = uo(e2, "async"), s2 = f2;
        function u() {
          let d;
          try {
            d = Xi(r5);
          } catch (R3) {
            return b(R3);
          }
          const m2 = T2(d);
          return F4(m2, (R3) => {
            if (!l(R3)) throw new TypeError("The promise returned by the iterator.next() method must fulfill with an object");
            if (ea(R3)) De(t4._readableStreamController);
            else {
              const C3 = ta(R3);
              Ke(t4._readableStreamController, C3);
            }
          });
        }
        n3(u, "pullAlgorithm");
        function c2(d) {
          const m2 = r5.iterator;
          let R3;
          try {
            R3 = Ut(m2, "return");
          } catch (P2) {
            return b(P2);
          }
          if (R3 === void 0) return T2(void 0);
          let y;
          try {
            y = z(R3, m2, [d]);
          } catch (P2) {
            return b(P2);
          }
          const C3 = T2(y);
          return F4(C3, (P2) => {
            if (!l(P2)) throw new TypeError("The promise returned by the iterator.return() method must fulfill with an object");
          });
        }
        return n3(c2, "cancelAlgorithm"), t4 = Et(s2, u, c2, 0), t4;
      }
      n3(ls, "ReadableStreamFromIterable");
      function us(e2) {
        let t4;
        const r5 = f2;
        function s2() {
          let c2;
          try {
            c2 = e2.read();
          } catch (d) {
            return b(d);
          }
          return F4(c2, (d) => {
            if (!l(d)) throw new TypeError("The promise returned by the reader.read() method must fulfill with an object");
            if (d.done) De(t4._readableStreamController);
            else {
              const m2 = d.value;
              Ke(t4._readableStreamController, m2);
            }
          });
        }
        n3(s2, "pullAlgorithm");
        function u(c2) {
          try {
            return T2(e2.cancel(c2));
          } catch (d) {
            return b(d);
          }
        }
        return n3(u, "cancelAlgorithm"), t4 = Et(r5, s2, u, 0), t4;
      }
      n3(us, "ReadableStreamFromDefaultReader");
      function fs(e2, t4) {
        ue(e2, t4);
        const r5 = e2, s2 = r5?.autoAllocateChunkSize, u = r5?.cancel, c2 = r5?.pull, d = r5?.start, m2 = r5?.type;
        return { autoAllocateChunkSize: s2 === void 0 ? void 0 : Fr(s2, `${t4} has member 'autoAllocateChunkSize' that`), cancel: u === void 0 ? void 0 : cs(u, r5, `${t4} has member 'cancel' that`), pull: c2 === void 0 ? void 0 : ds(c2, r5, `${t4} has member 'pull' that`), start: d === void 0 ? void 0 : hs(d, r5, `${t4} has member 'start' that`), type: m2 === void 0 ? void 0 : ps(m2, `${t4} has member 'type' that`) };
      }
      n3(fs, "convertUnderlyingDefaultOrByteSource");
      function cs(e2, t4, r5) {
        return Z2(e2, r5), (s2) => j(e2, t4, [s2]);
      }
      n3(cs, "convertUnderlyingSourceCancelCallback");
      function ds(e2, t4, r5) {
        return Z2(e2, r5), (s2) => j(e2, t4, [s2]);
      }
      n3(ds, "convertUnderlyingSourcePullCallback");
      function hs(e2, t4, r5) {
        return Z2(e2, r5), (s2) => z(e2, t4, [s2]);
      }
      n3(hs, "convertUnderlyingSourceStartCallback");
      function ps(e2, t4) {
        if (e2 = `${e2}`, e2 !== "bytes") throw new TypeError(`${t4} '${e2}' is not a valid enumeration value for ReadableStreamType`);
        return e2;
      }
      n3(ps, "convertReadableStreamType");
      function bs(e2, t4) {
        return ue(e2, t4), { preventCancel: !!e2?.preventCancel };
      }
      n3(bs, "convertIteratorOptions");
      function Yo(e2, t4) {
        ue(e2, t4);
        const r5 = e2?.preventAbort, s2 = e2?.preventCancel, u = e2?.preventClose, c2 = e2?.signal;
        return c2 !== void 0 && ms(c2, `${t4} has member 'signal' that`), { preventAbort: !!r5, preventCancel: !!s2, preventClose: !!u, signal: c2 };
      }
      n3(Yo, "convertPipeOptions");
      function ms(e2, t4) {
        if (!Ca(e2)) throw new TypeError(`${t4} is not an AbortSignal.`);
      }
      n3(ms, "assertAbortSignal");
      function ys(e2, t4) {
        ue(e2, t4);
        const r5 = e2?.readable;
        zr(r5, "readable", "ReadableWritablePair"), jr(r5, `${t4} has member 'readable' that`);
        const s2 = e2?.writable;
        return zr(s2, "writable", "ReadableWritablePair"), Bo(s2, `${t4} has member 'writable' that`), { readable: r5, writable: s2 };
      }
      n3(ys, "convertReadableWritablePair");
      const Pn = class Pn {
        constructor(t4 = {}, r5 = {}) {
          t4 === void 0 ? t4 = null : Jn(t4, "First parameter");
          const s2 = Zt(r5, "Second parameter"), u = fs(t4, "First parameter");
          if (cn(this), u.type === "bytes") {
            if (s2.size !== void 0) throw new RangeError("The strategy for a byte stream cannot have a size function");
            const c2 = Tt(s2, 0);
            ca2(this, u, c2);
          } else {
            const c2 = Gt(s2), d = Tt(s2, 1);
            rs(this, u, d, c2);
          }
        }
        get locked() {
          if (!We(this)) throw Me("locked");
          return qe(this);
        }
        cancel(t4 = void 0) {
          return We(this) ? qe(this) ? b(new TypeError("Cannot cancel a stream that already has a reader")) : ie(this, t4) : b(Me("cancel"));
        }
        getReader(t4 = void 0) {
          if (!We(this)) throw Me("getReader");
          return ha(t4, "First parameter").mode === void 0 ? Qe(this) : Co(this);
        }
        pipeThrough(t4, r5 = {}) {
          if (!We(this)) throw Me("pipeThrough");
          Se(t4, 1, "pipeThrough");
          const s2 = ys(t4, "First parameter"), u = Yo(r5, "Second parameter");
          if (qe(this)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          if (Ze(s2.writable)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          const c2 = Ho(this, s2.writable, u.preventClose, u.preventAbort, u.preventCancel, u.signal);
          return Q(c2), s2.readable;
        }
        pipeTo(t4, r5 = {}) {
          if (!We(this)) return b(Me("pipeTo"));
          if (t4 === void 0) return b("Parameter 1 is required in 'pipeTo'.");
          if (!Ge(t4)) return b(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
          let s2;
          try {
            s2 = Yo(r5, "Second parameter");
          } catch (u) {
            return b(u);
          }
          return qe(this) ? b(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : Ze(t4) ? b(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : Ho(this, t4, s2.preventClose, s2.preventAbort, s2.preventCancel, s2.signal);
        }
        tee() {
          if (!We(this)) throw Me("tee");
          const t4 = ns(this);
          return St(t4);
        }
        values(t4 = void 0) {
          if (!We(this)) throw Me("values");
          const r5 = bs(t4, "First parameter");
          return Ki(this, r5.preventCancel);
        }
        [Ur](t4) {
          return this.values(t4);
        }
        static from(t4) {
          return ss(t4);
        }
      };
      n3(Pn, "ReadableStream");
      let L = Pn;
      Object.defineProperties(L, { from: { enumerable: true } }), Object.defineProperties(L.prototype, { cancel: { enumerable: true }, getReader: { enumerable: true }, pipeThrough: { enumerable: true }, pipeTo: { enumerable: true }, tee: { enumerable: true }, values: { enumerable: true }, locked: { enumerable: true } }), h2(L.from, "from"), h2(L.prototype.cancel, "cancel"), h2(L.prototype.getReader, "getReader"), h2(L.prototype.pipeThrough, "pipeThrough"), h2(L.prototype.pipeTo, "pipeTo"), h2(L.prototype.tee, "tee"), h2(L.prototype.values, "values"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(L.prototype, Symbol.toStringTag, { value: "ReadableStream", configurable: true }), Object.defineProperty(L.prototype, Ur, { value: L.prototype.values, writable: true, configurable: true });
      function Et(e2, t4, r5, s2 = 1, u = () => 1) {
        const c2 = Object.create(L.prototype);
        cn(c2);
        const d = Object.create(ne.prototype);
        return Qo(c2, d, e2, t4, r5, s2, u), c2;
      }
      n3(Et, "CreateReadableStream");
      function Go(e2, t4, r5) {
        const s2 = Object.create(L.prototype);
        cn(s2);
        const u = Object.create(te.prototype);
        return To(s2, u, e2, t4, r5, 0, void 0), s2;
      }
      n3(Go, "CreateReadableByteStream");
      function cn(e2) {
        e2._state = "readable", e2._reader = void 0, e2._storedError = void 0, e2._disturbed = false;
      }
      n3(cn, "InitializeReadableStream");
      function We(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_readableStreamController") ? false : e2 instanceof L;
      }
      n3(We, "IsReadableStream");
      function qe(e2) {
        return e2._reader !== void 0;
      }
      n3(qe, "IsReadableStreamLocked");
      function ie(e2, t4) {
        if (e2._disturbed = true, e2._state === "closed") return T2(void 0);
        if (e2._state === "errored") return b(e2._storedError);
        At(e2);
        const r5 = e2._reader;
        if (r5 !== void 0 && je(r5)) {
          const u = r5._readIntoRequests;
          r5._readIntoRequests = new D2(), u.forEach((c2) => {
            c2._closeSteps(void 0);
          });
        }
        const s2 = e2._readableStreamController[Ar](t4);
        return F4(s2, f2);
      }
      n3(ie, "ReadableStreamCancel");
      function At(e2) {
        e2._state = "closed";
        const t4 = e2._reader;
        if (t4 !== void 0 && (Zn(t4), Ee(t4))) {
          const r5 = t4._readRequests;
          t4._readRequests = new D2(), r5.forEach((s2) => {
            s2._closeSteps();
          });
        }
      }
      n3(At, "ReadableStreamClose");
      function Zo(e2, t4) {
        e2._state = "errored", e2._storedError = t4;
        const r5 = e2._reader;
        r5 !== void 0 && (Or(r5, t4), Ee(r5) ? ro(r5, t4) : Ao(r5, t4));
      }
      n3(Zo, "ReadableStreamError");
      function Me(e2) {
        return new TypeError(`ReadableStream.prototype.${e2} can only be used on a ReadableStream`);
      }
      n3(Me, "streamBrandCheckException$1");
      function Ko(e2, t4) {
        ue(e2, t4);
        const r5 = e2?.highWaterMark;
        return zr(r5, "highWaterMark", "QueuingStrategyInit"), { highWaterMark: Ir(r5) };
      }
      n3(Ko, "convertQueuingStrategyInit");
      const Jo = n3((e2) => e2.byteLength, "byteLengthSizeFunction");
      h2(Jo, "size");
      const vn = class vn {
        constructor(t4) {
          Se(t4, 1, "ByteLengthQueuingStrategy"), t4 = Ko(t4, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = t4.highWaterMark;
        }
        get highWaterMark() {
          if (!ei(this)) throw Xo("highWaterMark");
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        get size() {
          if (!ei(this)) throw Xo("size");
          return Jo;
        }
      };
      n3(vn, "ByteLengthQueuingStrategy");
      let Xe = vn;
      Object.defineProperties(Xe.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Xe.prototype, Symbol.toStringTag, { value: "ByteLengthQueuingStrategy", configurable: true });
      function Xo(e2) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${e2} can only be used on a ByteLengthQueuingStrategy`);
      }
      n3(Xo, "byteLengthBrandCheckException");
      function ei(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_byteLengthQueuingStrategyHighWaterMark") ? false : e2 instanceof Xe;
      }
      n3(ei, "IsByteLengthQueuingStrategy");
      const ti = n3(() => 1, "countSizeFunction");
      h2(ti, "size");
      const En = class En {
        constructor(t4) {
          Se(t4, 1, "CountQueuingStrategy"), t4 = Ko(t4, "First parameter"), this._countQueuingStrategyHighWaterMark = t4.highWaterMark;
        }
        get highWaterMark() {
          if (!ni(this)) throw ri("highWaterMark");
          return this._countQueuingStrategyHighWaterMark;
        }
        get size() {
          if (!ni(this)) throw ri("size");
          return ti;
        }
      };
      n3(En, "CountQueuingStrategy");
      let et = En;
      Object.defineProperties(et.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(et.prototype, Symbol.toStringTag, { value: "CountQueuingStrategy", configurable: true });
      function ri(e2) {
        return new TypeError(`CountQueuingStrategy.prototype.${e2} can only be used on a CountQueuingStrategy`);
      }
      n3(ri, "countBrandCheckException");
      function ni(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_countQueuingStrategyHighWaterMark") ? false : e2 instanceof et;
      }
      n3(ni, "IsCountQueuingStrategy");
      function gs(e2, t4) {
        ue(e2, t4);
        const r5 = e2?.cancel, s2 = e2?.flush, u = e2?.readableType, c2 = e2?.start, d = e2?.transform, m2 = e2?.writableType;
        return { cancel: r5 === void 0 ? void 0 : Rs(r5, e2, `${t4} has member 'cancel' that`), flush: s2 === void 0 ? void 0 : _s(s2, e2, `${t4} has member 'flush' that`), readableType: u, start: c2 === void 0 ? void 0 : Ss(c2, e2, `${t4} has member 'start' that`), transform: d === void 0 ? void 0 : ws(d, e2, `${t4} has member 'transform' that`), writableType: m2 };
      }
      n3(gs, "convertTransformer");
      function _s(e2, t4, r5) {
        return Z2(e2, r5), (s2) => j(e2, t4, [s2]);
      }
      n3(_s, "convertTransformerFlushCallback");
      function Ss(e2, t4, r5) {
        return Z2(e2, r5), (s2) => z(e2, t4, [s2]);
      }
      n3(Ss, "convertTransformerStartCallback");
      function ws(e2, t4, r5) {
        return Z2(e2, r5), (s2, u) => j(e2, t4, [s2, u]);
      }
      n3(ws, "convertTransformerTransformCallback");
      function Rs(e2, t4, r5) {
        return Z2(e2, r5), (s2) => j(e2, t4, [s2]);
      }
      n3(Rs, "convertTransformerCancelCallback");
      const An = class An {
        constructor(t4 = {}, r5 = {}, s2 = {}) {
          t4 === void 0 && (t4 = null);
          const u = Zt(r5, "Second parameter"), c2 = Zt(s2, "Third parameter"), d = gs(t4, "First parameter");
          if (d.readableType !== void 0) throw new RangeError("Invalid readableType specified");
          if (d.writableType !== void 0) throw new RangeError("Invalid writableType specified");
          const m2 = Tt(c2, 0), R3 = Gt(c2), y = Tt(u, 1), C3 = Gt(u);
          let P2;
          const B2 = A2((ae) => {
            P2 = ae;
          });
          Ts(this, B2, y, C3, m2, R3), Ps(this, d), d.start !== void 0 ? P2(d.start(this._transformStreamController)) : P2(void 0);
        }
        get readable() {
          if (!oi(this)) throw li("readable");
          return this._readable;
        }
        get writable() {
          if (!oi(this)) throw li("writable");
          return this._writable;
        }
      };
      n3(An, "TransformStream");
      let tt = An;
      Object.defineProperties(tt.prototype, { readable: { enumerable: true }, writable: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(tt.prototype, Symbol.toStringTag, { value: "TransformStream", configurable: true });
      function Ts(e2, t4, r5, s2, u, c2) {
        function d() {
          return t4;
        }
        n3(d, "startAlgorithm");
        function m2(B2) {
          return As(e2, B2);
        }
        n3(m2, "writeAlgorithm");
        function R3(B2) {
          return Bs(e2, B2);
        }
        n3(R3, "abortAlgorithm");
        function y() {
          return ks(e2);
        }
        n3(y, "closeAlgorithm"), e2._writable = Ea(d, m2, y, R3, r5, s2);
        function C3() {
          return Ws(e2);
        }
        n3(C3, "pullAlgorithm");
        function P2(B2) {
          return qs(e2, B2);
        }
        n3(P2, "cancelAlgorithm"), e2._readable = Et(d, C3, P2, u, c2), e2._backpressure = void 0, e2._backpressureChangePromise = void 0, e2._backpressureChangePromise_resolve = void 0, sr(e2, true), e2._transformStreamController = void 0;
      }
      n3(Ts, "InitializeTransformStream");
      function oi(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_transformStreamController") ? false : e2 instanceof tt;
      }
      n3(oi, "IsTransformStream");
      function ii(e2, t4) {
        oe(e2._readable._readableStreamController, t4), dn(e2, t4);
      }
      n3(ii, "TransformStreamError");
      function dn(e2, t4) {
        ur(e2._transformStreamController), Ct(e2._writable._writableStreamController, t4), hn(e2);
      }
      n3(dn, "TransformStreamErrorWritableAndUnblockWrite");
      function hn(e2) {
        e2._backpressure && sr(e2, false);
      }
      n3(hn, "TransformStreamUnblockWrite");
      function sr(e2, t4) {
        e2._backpressureChangePromise !== void 0 && e2._backpressureChangePromise_resolve(), e2._backpressureChangePromise = A2((r5) => {
          e2._backpressureChangePromise_resolve = r5;
        }), e2._backpressure = t4;
      }
      n3(sr, "TransformStreamSetBackpressure");
      const Bn = class Bn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get desiredSize() {
          if (!lr(this)) throw fr("desiredSize");
          const t4 = this._controlledTransformStream._readable._readableStreamController;
          return fn(t4);
        }
        enqueue(t4 = void 0) {
          if (!lr(this)) throw fr("enqueue");
          ai(this, t4);
        }
        error(t4 = void 0) {
          if (!lr(this)) throw fr("error");
          vs(this, t4);
        }
        terminate() {
          if (!lr(this)) throw fr("terminate");
          Es(this);
        }
      };
      n3(Bn, "TransformStreamDefaultController");
      let pe2 = Bn;
      Object.defineProperties(pe2.prototype, { enqueue: { enumerable: true }, error: { enumerable: true }, terminate: { enumerable: true }, desiredSize: { enumerable: true } }), h2(pe2.prototype.enqueue, "enqueue"), h2(pe2.prototype.error, "error"), h2(pe2.prototype.terminate, "terminate"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(pe2.prototype, Symbol.toStringTag, { value: "TransformStreamDefaultController", configurable: true });
      function lr(e2) {
        return !l(e2) || !Object.prototype.hasOwnProperty.call(e2, "_controlledTransformStream") ? false : e2 instanceof pe2;
      }
      n3(lr, "IsTransformStreamDefaultController");
      function Cs(e2, t4, r5, s2, u) {
        t4._controlledTransformStream = e2, e2._transformStreamController = t4, t4._transformAlgorithm = r5, t4._flushAlgorithm = s2, t4._cancelAlgorithm = u, t4._finishPromise = void 0, t4._finishPromise_resolve = void 0, t4._finishPromise_reject = void 0;
      }
      n3(Cs, "SetUpTransformStreamDefaultController");
      function Ps(e2, t4) {
        const r5 = Object.create(pe2.prototype);
        let s2, u, c2;
        t4.transform !== void 0 ? s2 = n3((d) => t4.transform(d, r5), "transformAlgorithm") : s2 = n3((d) => {
          try {
            return ai(r5, d), T2(void 0);
          } catch (m2) {
            return b(m2);
          }
        }, "transformAlgorithm"), t4.flush !== void 0 ? u = n3(() => t4.flush(r5), "flushAlgorithm") : u = n3(() => T2(void 0), "flushAlgorithm"), t4.cancel !== void 0 ? c2 = n3((d) => t4.cancel(d), "cancelAlgorithm") : c2 = n3(() => T2(void 0), "cancelAlgorithm"), Cs(e2, r5, s2, u, c2);
      }
      n3(Ps, "SetUpTransformStreamDefaultControllerFromTransformer");
      function ur(e2) {
        e2._transformAlgorithm = void 0, e2._flushAlgorithm = void 0, e2._cancelAlgorithm = void 0;
      }
      n3(ur, "TransformStreamDefaultControllerClearAlgorithms");
      function ai(e2, t4) {
        const r5 = e2._controlledTransformStream, s2 = r5._readable._readableStreamController;
        if (!Je(s2)) throw new TypeError("Readable side is not in a state that permits enqueue");
        try {
          Ke(s2, t4);
        } catch (c2) {
          throw dn(r5, c2), r5._readable._storedError;
        }
        ts(s2) !== r5._backpressure && sr(r5, true);
      }
      n3(ai, "TransformStreamDefaultControllerEnqueue");
      function vs(e2, t4) {
        ii(e2._controlledTransformStream, t4);
      }
      n3(vs, "TransformStreamDefaultControllerError");
      function si(e2, t4) {
        const r5 = e2._transformAlgorithm(t4);
        return F4(r5, void 0, (s2) => {
          throw ii(e2._controlledTransformStream, s2), s2;
        });
      }
      n3(si, "TransformStreamDefaultControllerPerformTransform");
      function Es(e2) {
        const t4 = e2._controlledTransformStream, r5 = t4._readable._readableStreamController;
        De(r5);
        const s2 = new TypeError("TransformStream terminated");
        dn(t4, s2);
      }
      n3(Es, "TransformStreamDefaultControllerTerminate");
      function As(e2, t4) {
        const r5 = e2._transformStreamController;
        if (e2._backpressure) {
          const s2 = e2._backpressureChangePromise;
          return F4(s2, () => {
            const u = e2._writable;
            if (u._state === "erroring") throw u._storedError;
            return si(r5, t4);
          });
        }
        return si(r5, t4);
      }
      n3(As, "TransformStreamDefaultSinkWriteAlgorithm");
      function Bs(e2, t4) {
        const r5 = e2._transformStreamController;
        if (r5._finishPromise !== void 0) return r5._finishPromise;
        const s2 = e2._readable;
        r5._finishPromise = A2((c2, d) => {
          r5._finishPromise_resolve = c2, r5._finishPromise_reject = d;
        });
        const u = r5._cancelAlgorithm(t4);
        return ur(r5), g2(u, () => (s2._state === "errored" ? rt(r5, s2._storedError) : (oe(s2._readableStreamController, t4), pn(r5)), null), (c2) => (oe(s2._readableStreamController, c2), rt(r5, c2), null)), r5._finishPromise;
      }
      n3(Bs, "TransformStreamDefaultSinkAbortAlgorithm");
      function ks(e2) {
        const t4 = e2._transformStreamController;
        if (t4._finishPromise !== void 0) return t4._finishPromise;
        const r5 = e2._readable;
        t4._finishPromise = A2((u, c2) => {
          t4._finishPromise_resolve = u, t4._finishPromise_reject = c2;
        });
        const s2 = t4._flushAlgorithm();
        return ur(t4), g2(s2, () => (r5._state === "errored" ? rt(t4, r5._storedError) : (De(r5._readableStreamController), pn(t4)), null), (u) => (oe(r5._readableStreamController, u), rt(t4, u), null)), t4._finishPromise;
      }
      n3(ks, "TransformStreamDefaultSinkCloseAlgorithm");
      function Ws(e2) {
        return sr(e2, false), e2._backpressureChangePromise;
      }
      n3(Ws, "TransformStreamDefaultSourcePullAlgorithm");
      function qs(e2, t4) {
        const r5 = e2._transformStreamController;
        if (r5._finishPromise !== void 0) return r5._finishPromise;
        const s2 = e2._writable;
        r5._finishPromise = A2((c2, d) => {
          r5._finishPromise_resolve = c2, r5._finishPromise_reject = d;
        });
        const u = r5._cancelAlgorithm(t4);
        return ur(r5), g2(u, () => (s2._state === "errored" ? rt(r5, s2._storedError) : (Ct(s2._writableStreamController, t4), hn(e2), pn(r5)), null), (c2) => (Ct(s2._writableStreamController, c2), hn(e2), rt(r5, c2), null)), r5._finishPromise;
      }
      n3(qs, "TransformStreamDefaultSourceCancelAlgorithm");
      function fr(e2) {
        return new TypeError(`TransformStreamDefaultController.prototype.${e2} can only be used on a TransformStreamDefaultController`);
      }
      n3(fr, "defaultControllerBrandCheckException");
      function pn(e2) {
        e2._finishPromise_resolve !== void 0 && (e2._finishPromise_resolve(), e2._finishPromise_resolve = void 0, e2._finishPromise_reject = void 0);
      }
      n3(pn, "defaultControllerFinishPromiseResolve");
      function rt(e2, t4) {
        e2._finishPromise_reject !== void 0 && (Q(e2._finishPromise), e2._finishPromise_reject(t4), e2._finishPromise_resolve = void 0, e2._finishPromise_reject = void 0);
      }
      n3(rt, "defaultControllerFinishPromiseReject");
      function li(e2) {
        return new TypeError(`TransformStream.prototype.${e2} can only be used on a TransformStream`);
      }
      n3(li, "streamBrandCheckException"), a2.ByteLengthQueuingStrategy = Xe, a2.CountQueuingStrategy = et, a2.ReadableByteStreamController = te, a2.ReadableStream = L, a2.ReadableStreamBYOBReader = ce, a2.ReadableStreamBYOBRequest = Re, a2.ReadableStreamDefaultController = ne, a2.ReadableStreamDefaultReader = fe, a2.TransformStream = tt, a2.TransformStreamDefaultController = pe2, a2.WritableStream = de, a2.WritableStreamDefaultController = ke, a2.WritableStreamDefaultWriter = re;
    });
  }(kt, kt.exports)), kt.exports;
}
function Hs() {
  if (mi) return pi;
  mi = 1;
  const i2 = 65536;
  if (!globalThis.ReadableStream) try {
    const o4 = (init_node_process(), __toCommonJS(node_process_exports)), { emitWarning: a2 } = o4;
    try {
      o4.emitWarning = () => {
      }, Object.assign(globalThis, (init_web(), __toCommonJS(web_exports))), o4.emitWarning = a2;
    } catch (f2) {
      throw o4.emitWarning = a2, f2;
    }
  } catch {
    Object.assign(globalThis, Ns());
  }
  try {
    const { Blob: o4 } = (init_buffer(), __toCommonJS(buffer_exports));
    o4 && !o4.prototype.stream && (o4.prototype.stream = n3(function(f2) {
      let l = 0;
      const p2 = this;
      return new ReadableStream({ type: "bytes", async pull(h2) {
        const v2 = await p2.slice(l, Math.min(p2.size, l + i2)).arrayBuffer();
        l += v2.byteLength, h2.enqueue(new Uint8Array(v2)), l === p2.size && h2.close();
      } });
    }, "name"));
  } catch {
  }
  return pi;
}
async function* Wn(i2, o4 = true) {
  for (const a2 of i2) if ("stream" in a2) yield* a2.stream();
  else if (ArrayBuffer.isView(a2)) if (o4) {
    let f2 = a2.byteOffset;
    const l = a2.byteOffset + a2.byteLength;
    for (; f2 !== l; ) {
      const p2 = Math.min(l - f2, yi), h2 = a2.buffer.slice(f2, f2 + p2);
      f2 += h2.byteLength, yield new Uint8Array(h2);
    }
  } else yield a2;
  else {
    let f2 = 0, l = a2;
    for (; f2 !== l.size; ) {
      const h2 = await l.slice(f2, Math.min(l.size, f2 + yi)).arrayBuffer();
      f2 += h2.byteLength, yield new Uint8Array(h2);
    }
  }
}
function Zs(i2, o4 = ut) {
  var a2 = `${_i()}${_i()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), f2 = [], l = `--${a2}\r
Content-Disposition: form-data; name="`;
  return i2.forEach((p2, h2) => typeof p2 == "string" ? f2.push(l + On(h2) + `"\r
\r
${p2.replace(/\r(?!\n)|(?<!\r)\n/g, `\r
`)}\r
`) : f2.push(l + On(h2) + `"; filename="${On(p2.name, 1)}"\r
Content-Type: ${p2.type || "application/octet-stream"}\r
\r
`, p2, `\r
`)), f2.push(`--${a2}--`), new o4(f2, { type: "multipart/form-data; boundary=" + a2 });
}
async function zn(i2) {
  if (i2[H].disturbed) throw new TypeError(`body used already for: ${i2.url}`);
  if (i2[H].disturbed = true, i2[H].error) throw i2[H].error;
  const { body: o4 } = i2;
  if (o4 === null) return Buffer2.alloc(0);
  if (!(o4 instanceof node_stream_default)) return Buffer2.alloc(0);
  const a2 = [];
  let f2 = 0;
  try {
    for await (const l of o4) {
      if (i2.size > 0 && f2 + l.length > i2.size) {
        const p2 = new G(`content size at ${i2.url} over limit: ${i2.size}`, "max-size");
        throw o4.destroy(p2), p2;
      }
      f2 += l.length, a2.push(l);
    }
  } catch (l) {
    throw l instanceof ft ? l : new G(`Invalid response body while trying to fetch ${i2.url}: ${l.message}`, "system", l);
  }
  if (o4.readableEnded === true || o4._readableState.ended === true) try {
    return a2.every((l) => typeof l == "string") ? Buffer2.from(a2.join("")) : Buffer2.concat(a2, f2);
  } catch (l) {
    throw new G(`Could not create Buffer from response body for ${i2.url}: ${l.message}`, "system", l);
  }
  else throw new G(`Premature close of server response while trying to fetch ${i2.url}`);
}
function ol(i2 = []) {
  return new ye(i2.reduce((o4, a2, f2, l) => (f2 % 2 === 0 && o4.push(l.slice(f2, f2 + 2)), o4), []).filter(([o4, a2]) => {
    try {
      return gr(o4), Fn(o4, String(a2)), true;
    } catch {
      return false;
    }
  }));
}
function Ti(i2, o4 = false) {
  return i2 == null || (i2 = new URL(i2), /^(about|blob|data):$/.test(i2.protocol)) ? "no-referrer" : (i2.username = "", i2.password = "", i2.hash = "", o4 && (i2.pathname = "", i2.search = ""), i2);
}
function ll(i2) {
  if (!Ci.has(i2)) throw new TypeError(`Invalid referrerPolicy: ${i2}`);
  return i2;
}
function ul(i2) {
  if (/^(http|ws)s:$/.test(i2.protocol)) return true;
  const o4 = i2.host.replace(/(^\[)|(]$)/g, ""), a2 = isIP(o4);
  return a2 === 4 && /^127\./.test(o4) || a2 === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(o4) ? true : i2.host === "localhost" || i2.host.endsWith(".localhost") ? false : i2.protocol === "file:";
}
function ct(i2) {
  return /^about:(blank|srcdoc)$/.test(i2) || i2.protocol === "data:" || /^(blob|filesystem):$/.test(i2.protocol) ? true : ul(i2);
}
function fl(i2, { referrerURLCallback: o4, referrerOriginCallback: a2 } = {}) {
  if (i2.referrer === "no-referrer" || i2.referrerPolicy === "") return null;
  const f2 = i2.referrerPolicy;
  if (i2.referrer === "about:client") return "no-referrer";
  const l = i2.referrer;
  let p2 = Ti(l), h2 = Ti(l, true);
  p2.toString().length > 4096 && (p2 = h2), o4 && (p2 = o4(p2)), a2 && (h2 = a2(h2));
  const S = new URL(i2.url);
  switch (f2) {
    case "no-referrer":
      return "no-referrer";
    case "origin":
      return h2;
    case "unsafe-url":
      return p2;
    case "strict-origin":
      return ct(p2) && !ct(S) ? "no-referrer" : h2.toString();
    case "strict-origin-when-cross-origin":
      return p2.origin === S.origin ? p2 : ct(p2) && !ct(S) ? "no-referrer" : h2;
    case "same-origin":
      return p2.origin === S.origin ? p2 : "no-referrer";
    case "origin-when-cross-origin":
      return p2.origin === S.origin ? p2 : h2;
    case "no-referrer-when-downgrade":
      return ct(p2) && !ct(S) ? "no-referrer" : p2;
    default:
      throw new TypeError(`Invalid referrerPolicy: ${f2}`);
  }
}
function cl(i2) {
  const o4 = (i2.get("referrer-policy") || "").split(/[,\s]+/);
  let a2 = "";
  for (const f2 of o4) f2 && Ci.has(f2) && (a2 = f2);
  return a2;
}
function pl() {
  if (Pi) return Ln;
  if (Pi = 1, !globalThis.DOMException) try {
    const { MessageChannel: i2 } = (init_worker_threads(), __toCommonJS(worker_threads_exports)), o4 = new i2().port1, a2 = new ArrayBuffer();
    o4.postMessage(a2, [a2, a2]);
  } catch (i2) {
    i2.constructor.name === "DOMException" && (globalThis.DOMException = i2.constructor);
  }
  return Ln = globalThis.DOMException, Ln;
}
async function Ai(i2, o4) {
  return new Promise((a2, f2) => {
    const l = new dt(i2, o4), { parsedURL: p2, options: h2 } = hl(l);
    if (!wl.has(p2.protocol)) throw new TypeError(`node-fetch cannot load ${i2}. URL scheme "${p2.protocol.replace(/:$/, "")}" is not supported.`);
    if (p2.protocol === "data:") {
      const g2 = Us(l.url), V = new le(g2, { headers: { "Content-Type": g2.typeFull } });
      a2(V);
      return;
    }
    const S = (p2.protocol === "https:" ? node_https_default : node_http_default).request, { signal: v2 } = l;
    let w2 = null;
    const A2 = n3(() => {
      const g2 = new _r("The operation was aborted.");
      f2(g2), l.body && l.body instanceof node_stream_default.Readable && l.body.destroy(g2), !(!w2 || !w2.body) && w2.body.emit("error", g2);
    }, "abort");
    if (v2 && v2.aborted) {
      A2();
      return;
    }
    const T2 = n3(() => {
      A2(), q();
    }, "abortAndFinalize"), b = S(p2.toString(), h2);
    v2 && v2.addEventListener("abort", T2);
    const q = n3(() => {
      b.abort(), v2 && v2.removeEventListener("abort", T2);
    }, "finalize");
    b.on("error", (g2) => {
      f2(new G(`request to ${l.url} failed, reason: ${g2.message}`, "system", g2)), q();
    }), Rl(b, (g2) => {
      w2 && w2.body && w2.body.destroy(g2);
    }), process.version < "v14" && b.on("socket", (g2) => {
      let V;
      g2.prependListener("end", () => {
        V = g2._eventsCount;
      }), g2.prependListener("close", (I2) => {
        if (w2 && V < g2._eventsCount && !I2) {
          const F4 = new Error("Premature close");
          F4.code = "ERR_STREAM_PREMATURE_CLOSE", w2.body.emit("error", F4);
        }
      });
    }), b.on("response", (g2) => {
      b.setTimeout(0);
      const V = ol(g2.rawHeaders);
      if (jn(g2.statusCode)) {
        const z = V.get("Location");
        let j = null;
        try {
          j = z === null ? null : new URL(z, l.url);
        } catch {
          if (l.redirect !== "manual") {
            f2(new G(`uri requested responds with an invalid redirect URL: ${z}`, "invalid-redirect")), q();
            return;
          }
        }
        switch (l.redirect) {
          case "error":
            f2(new G(`uri requested responds with a redirect, redirect mode is set to error: ${l.url}`, "no-redirect")), q();
            return;
          case "manual":
            break;
          case "follow": {
            if (j === null) break;
            if (l.counter >= l.follow) {
              f2(new G(`maximum redirect reached at: ${l.url}`, "max-redirect")), q();
              return;
            }
            const U = { headers: new ye(l.headers), follow: l.follow, counter: l.counter + 1, agent: l.agent, compress: l.compress, method: l.method, body: In(l), signal: l.signal, size: l.size, referrer: l.referrer, referrerPolicy: l.referrerPolicy };
            if (!Js(l.url, j) || !Xs(l.url, j)) for (const jt of ["authorization", "www-authenticate", "cookie", "cookie2"]) U.headers.delete(jt);
            if (g2.statusCode !== 303 && l.body && o4.body instanceof node_stream_default.Readable) {
              f2(new G("Cannot follow redirect with body being a readable stream", "unsupported-redirect")), q();
              return;
            }
            (g2.statusCode === 303 || (g2.statusCode === 301 || g2.statusCode === 302) && l.method === "POST") && (U.method = "GET", U.body = void 0, U.headers.delete("content-length"));
            const D2 = cl(V);
            D2 && (U.referrerPolicy = D2), a2(Ai(new dt(j, U))), q();
            return;
          }
          default:
            return f2(new TypeError(`Redirect option '${l.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      v2 && g2.once("end", () => {
        v2.removeEventListener("abort", T2);
      });
      let I2 = pipeline(g2, new PassThrough(), (z) => {
        z && f2(z);
      });
      process.version < "v12.10" && g2.on("aborted", T2);
      const F4 = { url: l.url, status: g2.statusCode, statusText: g2.statusMessage, headers: V, size: l.size, counter: l.counter, highWaterMark: l.highWaterMark }, Q = V.get("Content-Encoding");
      if (!l.compress || l.method === "HEAD" || Q === null || g2.statusCode === 204 || g2.statusCode === 304) {
        w2 = new le(I2, F4), a2(w2);
        return;
      }
      const ge = { flush: node_zlib_default.Z_SYNC_FLUSH, finishFlush: node_zlib_default.Z_SYNC_FLUSH };
      if (Q === "gzip" || Q === "x-gzip") {
        I2 = pipeline(I2, node_zlib_default.createGunzip(ge), (z) => {
          z && f2(z);
        }), w2 = new le(I2, F4), a2(w2);
        return;
      }
      if (Q === "deflate" || Q === "x-deflate") {
        const z = pipeline(g2, new PassThrough(), (j) => {
          j && f2(j);
        });
        z.once("data", (j) => {
          (j[0] & 15) === 8 ? I2 = pipeline(I2, node_zlib_default.createInflate(), (U) => {
            U && f2(U);
          }) : I2 = pipeline(I2, node_zlib_default.createInflateRaw(), (U) => {
            U && f2(U);
          }), w2 = new le(I2, F4), a2(w2);
        }), z.once("end", () => {
          w2 || (w2 = new le(I2, F4), a2(w2));
        });
        return;
      }
      if (Q === "br") {
        I2 = pipeline(I2, node_zlib_default.createBrotliDecompress(), (z) => {
          z && f2(z);
        }), w2 = new le(I2, F4), a2(w2);
        return;
      }
      w2 = new le(I2, F4), a2(w2);
    }), nl(b, l).catch(f2);
  });
}
function Rl(i2, o4) {
  const a2 = Buffer2.from(`0\r
\r
`);
  let f2 = false, l = false, p2;
  i2.on("response", (h2) => {
    const { headers: S } = h2;
    f2 = S["transfer-encoding"] === "chunked" && !S["content-length"];
  }), i2.on("socket", (h2) => {
    const S = n3(() => {
      if (f2 && !l) {
        const w2 = new Error("Premature close");
        w2.code = "ERR_STREAM_PREMATURE_CLOSE", o4(w2);
      }
    }, "onSocketClose"), v2 = n3((w2) => {
      l = Buffer2.compare(w2.slice(-5), a2) === 0, !l && p2 && (l = Buffer2.compare(p2.slice(-3), a2.slice(0, 3)) === 0 && Buffer2.compare(w2.slice(-2), a2.slice(3)) === 0), p2 = w2;
    }, "onData");
    h2.prependListener("close", S), h2.on("data", v2), i2.on("close", () => {
      h2.removeListener("close", S), h2.removeListener("data", v2);
    });
  });
}
function W(i2) {
  const o4 = Bi.get(i2);
  return console.assert(o4 != null, "'this' is expected an Event object, but got", i2), o4;
}
function ki(i2) {
  if (i2.passiveListener != null) {
    typeof console < "u" && typeof console.error == "function" && console.error("Unable to preventDefault inside passive event listener invocation.", i2.passiveListener);
    return;
  }
  i2.event.cancelable && (i2.canceled = true, typeof i2.event.preventDefault == "function" && i2.event.preventDefault());
}
function ht(i2, o4) {
  Bi.set(this, { eventTarget: i2, event: o4, eventPhase: 2, currentTarget: i2, canceled: false, stopped: false, immediateStopped: false, passiveListener: null, timeStamp: o4.timeStamp || Date.now() }), Object.defineProperty(this, "isTrusted", { value: false, enumerable: true });
  const a2 = Object.keys(o4);
  for (let f2 = 0; f2 < a2.length; ++f2) {
    const l = a2[f2];
    l in this || Object.defineProperty(this, l, Wi(l));
  }
}
function Wi(i2) {
  return { get() {
    return W(this).event[i2];
  }, set(o4) {
    W(this).event[i2] = o4;
  }, configurable: true, enumerable: true };
}
function Tl(i2) {
  return { value() {
    const o4 = W(this).event;
    return o4[i2].apply(o4, arguments);
  }, configurable: true, enumerable: true };
}
function Cl(i2, o4) {
  const a2 = Object.keys(o4);
  if (a2.length === 0) return i2;
  function f2(l, p2) {
    i2.call(this, l, p2);
  }
  n3(f2, "CustomEvent"), f2.prototype = Object.create(i2.prototype, { constructor: { value: f2, configurable: true, writable: true } });
  for (let l = 0; l < a2.length; ++l) {
    const p2 = a2[l];
    if (!(p2 in i2.prototype)) {
      const S = typeof Object.getOwnPropertyDescriptor(o4, p2).value == "function";
      Object.defineProperty(f2.prototype, p2, S ? Tl(p2) : Wi(p2));
    }
  }
  return f2;
}
function qi(i2) {
  if (i2 == null || i2 === Object.prototype) return ht;
  let o4 = Dn.get(i2);
  return o4 == null && (o4 = Cl(qi(Object.getPrototypeOf(i2)), i2), Dn.set(i2, o4)), o4;
}
function Pl(i2, o4) {
  const a2 = qi(Object.getPrototypeOf(o4));
  return new a2(i2, o4);
}
function vl(i2) {
  return W(i2).immediateStopped;
}
function El(i2, o4) {
  W(i2).eventPhase = o4;
}
function Al(i2, o4) {
  W(i2).currentTarget = o4;
}
function Oi(i2, o4) {
  W(i2).passiveListener = o4;
}
function Rr(i2) {
  return i2 !== null && typeof i2 == "object";
}
function Ot(i2) {
  const o4 = zi.get(i2);
  if (o4 == null) throw new TypeError("'this' is expected an EventTarget object, but got another value.");
  return o4;
}
function Bl(i2) {
  return { get() {
    let a2 = Ot(this).get(i2);
    for (; a2 != null; ) {
      if (a2.listenerType === wr) return a2.listener;
      a2 = a2.next;
    }
    return null;
  }, set(o4) {
    typeof o4 != "function" && !Rr(o4) && (o4 = null);
    const a2 = Ot(this);
    let f2 = null, l = a2.get(i2);
    for (; l != null; ) l.listenerType === wr ? f2 !== null ? f2.next = l.next : l.next !== null ? a2.set(i2, l.next) : a2.delete(i2) : f2 = l, l = l.next;
    if (o4 !== null) {
      const p2 = { listener: o4, listenerType: wr, passive: false, once: false, next: null };
      f2 === null ? a2.set(i2, p2) : f2.next = p2;
    }
  }, configurable: true, enumerable: true };
}
function ji(i2, o4) {
  Object.defineProperty(i2, `on${o4}`, Bl(o4));
}
function Li(i2) {
  function o4() {
    Pe.call(this);
  }
  n3(o4, "CustomEventTarget"), o4.prototype = Object.create(Pe.prototype, { constructor: { value: o4, configurable: true, writable: true } });
  for (let a2 = 0; a2 < i2.length; ++a2) ji(o4.prototype, i2[a2]);
  return o4;
}
function Pe() {
  if (this instanceof Pe) {
    zi.set(this, /* @__PURE__ */ new Map());
    return;
  }
  if (arguments.length === 1 && Array.isArray(arguments[0])) return Li(arguments[0]);
  if (arguments.length > 0) {
    const i2 = new Array(arguments.length);
    for (let o4 = 0; o4 < arguments.length; ++o4) i2[o4] = arguments[o4];
    return Li(i2);
  }
  throw new TypeError("Cannot call a class as a function");
}
function kl() {
  const i2 = Object.create(pt.prototype);
  return Pe.call(i2), Tr.set(i2, false), i2;
}
function Wl(i2) {
  Tr.get(i2) === false && (Tr.set(i2, true), i2.dispatchEvent({ type: "abort" }));
}
function Di(i2) {
  const o4 = $i.get(i2);
  if (o4 == null) throw new TypeError(`Expected 'this' to be an 'AbortController' object, but got ${i2 === null ? "null" : typeof i2}`);
  return o4;
}
function Ui() {
  !globalThis.process?.versions?.node && !globalThis.process?.env?.DISABLE_NODE_FETCH_NATIVE_WARN && console.warn("[node-fetch-native] Node.js compatible build of `node-fetch-native` is being used in a non-Node.js environment. Please make sure you are using proper export conditions or report this issue to https://github.com/unjs/node-fetch-native. You can set `process.env.DISABLE_NODE_FETCH_NATIVE_WARN` to disable this warning.");
}
var Os, fi, n3, ci, O, be, X, ve, zt, bt, Cr, ze, It, Ft, mt, ee, yt, He, Ve, gt, pi, kt, xs, bi, mi, yi, gi, ut, Vs, qn, Wt, Qs, Ys, _i, Gs, Si, On, Ue, br, Un, ft, xn, G, mr, wi, yr, Ks, Js, Xs, el, H, Nn, xe, In, tl, Ri, rl, nl, gr, Fn, Pr, ye, il, jn, se, Ne, le, al, Ci, sl, $2, qt, dl, vr, dt, hl, Hn, _r, Ln, Pi, bl, ml, $n, yl, gl, _l, Sl, vi, Ei, Er, Sr, wl, Bi, Dn, zi, Ii, Fi, wr, Vn, pt, Tr, Mn, $i, ql, Ol, Mi;
var init_node = __esm({
  "examples/testapp-ssr/node_modules/node-fetch-native/dist/node.mjs"() {
    init_node_http();
    init_node_https();
    init_node_zlib();
    init_node_stream();
    init_node_buffer();
    init_node_util();
    init_node_fetch_native_DfbY2q_x();
    init_node_url();
    init_node_net();
    init_node_fs();
    init_node_path();
    Os = Object.defineProperty;
    fi = (i2) => {
      throw TypeError(i2);
    };
    n3 = (i2, o4) => Os(i2, "name", { value: o4, configurable: true });
    ci = (i2, o4, a2) => o4.has(i2) || fi("Cannot " + a2);
    O = (i2, o4, a2) => (ci(i2, o4, "read from private field"), a2 ? a2.call(i2) : o4.get(i2));
    be = (i2, o4, a2) => o4.has(i2) ? fi("Cannot add the same private member more than once") : o4 instanceof WeakSet ? o4.add(i2) : o4.set(i2, a2);
    X = (i2, o4, a2, f2) => (ci(i2, o4, "write to private field"), f2 ? f2.call(i2, a2) : o4.set(i2, a2), a2);
    n3(Us, "dataUriToBuffer");
    pi = {};
    kt = { exports: {} };
    xs = kt.exports;
    n3(Ns, "requirePonyfill_es2018");
    n3(Hs, "requireStreams"), Hs();
    yi = 65536;
    n3(Wn, "toIterator");
    gi = (ze = class {
      constructor(o4 = [], a2 = {}) {
        be(this, ve, []);
        be(this, zt, "");
        be(this, bt, 0);
        be(this, Cr, "transparent");
        if (typeof o4 != "object" || o4 === null) throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        if (typeof o4[Symbol.iterator] != "function") throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        if (typeof a2 != "object" && typeof a2 != "function") throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        a2 === null && (a2 = {});
        const f2 = new TextEncoder();
        for (const p2 of o4) {
          let h2;
          ArrayBuffer.isView(p2) ? h2 = new Uint8Array(p2.buffer.slice(p2.byteOffset, p2.byteOffset + p2.byteLength)) : p2 instanceof ArrayBuffer ? h2 = new Uint8Array(p2.slice(0)) : p2 instanceof ze ? h2 = p2 : h2 = f2.encode(`${p2}`), X(this, bt, O(this, bt) + (ArrayBuffer.isView(h2) ? h2.byteLength : h2.size)), O(this, ve).push(h2);
        }
        X(this, Cr, `${a2.endings === void 0 ? "transparent" : a2.endings}`);
        const l = a2.type === void 0 ? "" : String(a2.type);
        X(this, zt, /^[\x20-\x7E]*$/.test(l) ? l : "");
      }
      get size() {
        return O(this, bt);
      }
      get type() {
        return O(this, zt);
      }
      async text() {
        const o4 = new TextDecoder();
        let a2 = "";
        for await (const f2 of Wn(O(this, ve), false)) a2 += o4.decode(f2, { stream: true });
        return a2 += o4.decode(), a2;
      }
      async arrayBuffer() {
        const o4 = new Uint8Array(this.size);
        let a2 = 0;
        for await (const f2 of Wn(O(this, ve), false)) o4.set(f2, a2), a2 += f2.length;
        return o4.buffer;
      }
      stream() {
        const o4 = Wn(O(this, ve), true);
        return new globalThis.ReadableStream({ type: "bytes", async pull(a2) {
          const f2 = await o4.next();
          f2.done ? a2.close() : a2.enqueue(f2.value);
        }, async cancel() {
          await o4.return();
        } });
      }
      slice(o4 = 0, a2 = this.size, f2 = "") {
        const { size: l } = this;
        let p2 = o4 < 0 ? Math.max(l + o4, 0) : Math.min(o4, l), h2 = a2 < 0 ? Math.max(l + a2, 0) : Math.min(a2, l);
        const S = Math.max(h2 - p2, 0), v2 = O(this, ve), w2 = [];
        let A2 = 0;
        for (const b of v2) {
          if (A2 >= S) break;
          const q = ArrayBuffer.isView(b) ? b.byteLength : b.size;
          if (p2 && q <= p2) p2 -= q, h2 -= q;
          else {
            let g2;
            ArrayBuffer.isView(b) ? (g2 = b.subarray(p2, Math.min(q, h2)), A2 += g2.byteLength) : (g2 = b.slice(p2, Math.min(q, h2)), A2 += g2.size), h2 -= q, w2.push(g2), p2 = 0;
          }
        }
        const T2 = new ze([], { type: String(f2).toLowerCase() });
        return X(T2, bt, S), X(T2, ve, w2), T2;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](o4) {
        return o4 && typeof o4 == "object" && typeof o4.constructor == "function" && (typeof o4.stream == "function" || typeof o4.arrayBuffer == "function") && /^(Blob|File)$/.test(o4[Symbol.toStringTag]);
      }
    }, ve = /* @__PURE__ */ new WeakMap(), zt = /* @__PURE__ */ new WeakMap(), bt = /* @__PURE__ */ new WeakMap(), Cr = /* @__PURE__ */ new WeakMap(), n3(ze, "Blob"), ze);
    Object.defineProperties(gi.prototype, { size: { enumerable: true }, type: { enumerable: true }, slice: { enumerable: true } });
    ut = gi;
    Vs = (mt = class extends ut {
      constructor(a2, f2, l = {}) {
        if (arguments.length < 2) throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
        super(a2, l);
        be(this, It, 0);
        be(this, Ft, "");
        l === null && (l = {});
        const p2 = l.lastModified === void 0 ? Date.now() : Number(l.lastModified);
        Number.isNaN(p2) || X(this, It, p2), X(this, Ft, String(f2));
      }
      get name() {
        return O(this, Ft);
      }
      get lastModified() {
        return O(this, It);
      }
      get [Symbol.toStringTag]() {
        return "File";
      }
      static [Symbol.hasInstance](a2) {
        return !!a2 && a2 instanceof ut && /^(File)$/.test(a2[Symbol.toStringTag]);
      }
    }, It = /* @__PURE__ */ new WeakMap(), Ft = /* @__PURE__ */ new WeakMap(), n3(mt, "File"), mt);
    qn = Vs;
    ({ toStringTag: Wt, iterator: Qs, hasInstance: Ys } = Symbol);
    _i = Math.random;
    Gs = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(",");
    Si = n3((i2, o4, a2) => (i2 += "", /^(Blob|File)$/.test(o4 && o4[Wt]) ? [(a2 = a2 !== void 0 ? a2 + "" : o4[Wt] == "File" ? o4.name : "blob", i2), o4.name !== a2 || o4[Wt] == "blob" ? new qn([o4], a2, o4) : o4] : [i2, o4 + ""]), "f");
    On = n3((i2, o4) => (o4 ? i2 : i2.replace(/\r?\n|\r/g, `\r
`)).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22"), "e$1");
    Ue = n3((i2, o4, a2) => {
      if (o4.length < a2) throw new TypeError(`Failed to execute '${i2}' on 'FormData': ${a2} arguments required, but only ${o4.length} present.`);
    }, "x");
    br = (yt = class {
      constructor(...o4) {
        be(this, ee, []);
        if (o4.length) throw new TypeError("Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.");
      }
      get [Wt]() {
        return "FormData";
      }
      [Qs]() {
        return this.entries();
      }
      static [Ys](o4) {
        return o4 && typeof o4 == "object" && o4[Wt] === "FormData" && !Gs.some((a2) => typeof o4[a2] != "function");
      }
      append(...o4) {
        Ue("append", arguments, 2), O(this, ee).push(Si(...o4));
      }
      delete(o4) {
        Ue("delete", arguments, 1), o4 += "", X(this, ee, O(this, ee).filter(([a2]) => a2 !== o4));
      }
      get(o4) {
        Ue("get", arguments, 1), o4 += "";
        for (var a2 = O(this, ee), f2 = a2.length, l = 0; l < f2; l++) if (a2[l][0] === o4) return a2[l][1];
        return null;
      }
      getAll(o4, a2) {
        return Ue("getAll", arguments, 1), a2 = [], o4 += "", O(this, ee).forEach((f2) => f2[0] === o4 && a2.push(f2[1])), a2;
      }
      has(o4) {
        return Ue("has", arguments, 1), o4 += "", O(this, ee).some((a2) => a2[0] === o4);
      }
      forEach(o4, a2) {
        Ue("forEach", arguments, 1);
        for (var [f2, l] of this) o4.call(a2, l, f2, this);
      }
      set(...o4) {
        Ue("set", arguments, 2);
        var a2 = [], f2 = true;
        o4 = Si(...o4), O(this, ee).forEach((l) => {
          l[0] === o4[0] ? f2 && (f2 = !a2.push(o4)) : a2.push(l);
        }), f2 && a2.push(o4), X(this, ee, a2);
      }
      *entries() {
        yield* O(this, ee);
      }
      *keys() {
        for (var [o4] of this) yield o4;
      }
      *values() {
        for (var [, o4] of this) yield o4;
      }
    }, ee = /* @__PURE__ */ new WeakMap(), n3(yt, "FormData"), yt);
    n3(Zs, "formDataToBlob");
    Un = class Un2 extends Error {
      constructor(o4, a2) {
        super(o4), Error.captureStackTrace(this, this.constructor), this.type = a2;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    n3(Un, "FetchBaseError");
    ft = Un;
    xn = class xn2 extends ft {
      constructor(o4, a2, f2) {
        super(o4, a2), f2 && (this.code = this.errno = f2.code, this.erroredSysCall = f2.syscall);
      }
    };
    n3(xn, "FetchError");
    G = xn;
    mr = Symbol.toStringTag;
    wi = n3((i2) => typeof i2 == "object" && typeof i2.append == "function" && typeof i2.delete == "function" && typeof i2.get == "function" && typeof i2.getAll == "function" && typeof i2.has == "function" && typeof i2.set == "function" && typeof i2.sort == "function" && i2[mr] === "URLSearchParams", "isURLSearchParameters");
    yr = n3((i2) => i2 && typeof i2 == "object" && typeof i2.arrayBuffer == "function" && typeof i2.type == "string" && typeof i2.stream == "function" && typeof i2.constructor == "function" && /^(Blob|File)$/.test(i2[mr]), "isBlob");
    Ks = n3((i2) => typeof i2 == "object" && (i2[mr] === "AbortSignal" || i2[mr] === "EventTarget"), "isAbortSignal");
    Js = n3((i2, o4) => {
      const a2 = new URL(o4).hostname, f2 = new URL(i2).hostname;
      return a2 === f2 || a2.endsWith(`.${f2}`);
    }, "isDomainOrSubdomain");
    Xs = n3((i2, o4) => {
      const a2 = new URL(o4).protocol, f2 = new URL(i2).protocol;
      return a2 === f2;
    }, "isSameProtocol");
    el = promisify(node_stream_default.pipeline);
    H = Symbol("Body internals");
    Nn = class Nn2 {
      constructor(o4, { size: a2 = 0 } = {}) {
        let f2 = null;
        o4 === null ? o4 = null : wi(o4) ? o4 = Buffer2.from(o4.toString()) : yr(o4) || Buffer2.isBuffer(o4) || (types.isAnyArrayBuffer(o4) ? o4 = Buffer2.from(o4) : ArrayBuffer.isView(o4) ? o4 = Buffer2.from(o4.buffer, o4.byteOffset, o4.byteLength) : o4 instanceof node_stream_default || (o4 instanceof br ? (o4 = Zs(o4), f2 = o4.type.split("=")[1]) : o4 = Buffer2.from(String(o4))));
        let l = o4;
        Buffer2.isBuffer(o4) ? l = node_stream_default.Readable.from(o4) : yr(o4) && (l = node_stream_default.Readable.from(o4.stream())), this[H] = { body: o4, stream: l, boundary: f2, disturbed: false, error: null }, this.size = a2, o4 instanceof node_stream_default && o4.on("error", (p2) => {
          const h2 = p2 instanceof ft ? p2 : new G(`Invalid response body while trying to fetch ${this.url}: ${p2.message}`, "system", p2);
          this[H].error = h2;
        });
      }
      get body() {
        return this[H].stream;
      }
      get bodyUsed() {
        return this[H].disturbed;
      }
      async arrayBuffer() {
        const { buffer: o4, byteOffset: a2, byteLength: f2 } = await zn(this);
        return o4.slice(a2, a2 + f2);
      }
      async formData() {
        const o4 = this.headers.get("content-type");
        if (o4.startsWith("application/x-www-form-urlencoded")) {
          const f2 = new br(), l = new URLSearchParams(await this.text());
          for (const [p2, h2] of l) f2.append(p2, h2);
          return f2;
        }
        const { toFormData: a2 } = await Promise.resolve().then(() => (init_multipart_parser(), multipart_parser_exports));
        return a2(this.body, o4);
      }
      async blob() {
        const o4 = this.headers && this.headers.get("content-type") || this[H].body && this[H].body.type || "", a2 = await this.arrayBuffer();
        return new ut([a2], { type: o4 });
      }
      async json() {
        const o4 = await this.text();
        return JSON.parse(o4);
      }
      async text() {
        const o4 = await zn(this);
        return new TextDecoder().decode(o4);
      }
      buffer() {
        return zn(this);
      }
    };
    n3(Nn, "Body");
    xe = Nn;
    xe.prototype.buffer = deprecate(xe.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer"), Object.defineProperties(xe.prototype, { body: { enumerable: true }, bodyUsed: { enumerable: true }, arrayBuffer: { enumerable: true }, blob: { enumerable: true }, json: { enumerable: true }, text: { enumerable: true }, data: { get: deprecate(() => {
    }, "data doesn't exist, use json(), text(), arrayBuffer(), or body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (response)") } });
    n3(zn, "consumeBody");
    In = n3((i2, o4) => {
      let a2, f2, { body: l } = i2[H];
      if (i2.bodyUsed) throw new Error("cannot clone body after it is used");
      return l instanceof node_stream_default && typeof l.getBoundary != "function" && (a2 = new PassThrough({ highWaterMark: o4 }), f2 = new PassThrough({ highWaterMark: o4 }), l.pipe(a2), l.pipe(f2), i2[H].stream = a2, l = f2), l;
    }, "clone");
    tl = deprecate((i2) => i2.getBoundary(), "form-data doesn't follow the spec and requires special treatment. Use alternative package", "https://github.com/node-fetch/node-fetch/issues/1167");
    Ri = n3((i2, o4) => i2 === null ? null : typeof i2 == "string" ? "text/plain;charset=UTF-8" : wi(i2) ? "application/x-www-form-urlencoded;charset=UTF-8" : yr(i2) ? i2.type || null : Buffer2.isBuffer(i2) || types.isAnyArrayBuffer(i2) || ArrayBuffer.isView(i2) ? null : i2 instanceof br ? `multipart/form-data; boundary=${o4[H].boundary}` : i2 && typeof i2.getBoundary == "function" ? `multipart/form-data;boundary=${tl(i2)}` : i2 instanceof node_stream_default ? null : "text/plain;charset=UTF-8", "extractContentType");
    rl = n3((i2) => {
      const { body: o4 } = i2[H];
      return o4 === null ? 0 : yr(o4) ? o4.size : Buffer2.isBuffer(o4) ? o4.length : o4 && typeof o4.getLengthSync == "function" && o4.hasKnownLength && o4.hasKnownLength() ? o4.getLengthSync() : null;
    }, "getTotalBytes");
    nl = n3(async (i2, { body: o4 }) => {
      o4 === null ? i2.end() : await el(o4, i2);
    }, "writeToStream");
    gr = typeof node_http_default.validateHeaderName == "function" ? node_http_default.validateHeaderName : (i2) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(i2)) {
        const o4 = new TypeError(`Header name must be a valid HTTP token [${i2}]`);
        throw Object.defineProperty(o4, "code", { value: "ERR_INVALID_HTTP_TOKEN" }), o4;
      }
    };
    Fn = typeof node_http_default.validateHeaderValue == "function" ? node_http_default.validateHeaderValue : (i2, o4) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(o4)) {
        const a2 = new TypeError(`Invalid character in header content ["${i2}"]`);
        throw Object.defineProperty(a2, "code", { value: "ERR_INVALID_CHAR" }), a2;
      }
    };
    Pr = class Pr2 extends URLSearchParams {
      constructor(o4) {
        let a2 = [];
        if (o4 instanceof Pr2) {
          const f2 = o4.raw();
          for (const [l, p2] of Object.entries(f2)) a2.push(...p2.map((h2) => [l, h2]));
        } else if (o4 != null) if (typeof o4 == "object" && !types.isBoxedPrimitive(o4)) {
          const f2 = o4[Symbol.iterator];
          if (f2 == null) a2.push(...Object.entries(o4));
          else {
            if (typeof f2 != "function") throw new TypeError("Header pairs must be iterable");
            a2 = [...o4].map((l) => {
              if (typeof l != "object" || types.isBoxedPrimitive(l)) throw new TypeError("Each header pair must be an iterable object");
              return [...l];
            }).map((l) => {
              if (l.length !== 2) throw new TypeError("Each header pair must be a name/value tuple");
              return [...l];
            });
          }
        } else throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        return a2 = a2.length > 0 ? a2.map(([f2, l]) => (gr(f2), Fn(f2, String(l)), [String(f2).toLowerCase(), String(l)])) : void 0, super(a2), new Proxy(this, { get(f2, l, p2) {
          switch (l) {
            case "append":
            case "set":
              return (h2, S) => (gr(h2), Fn(h2, String(S)), URLSearchParams.prototype[l].call(f2, String(h2).toLowerCase(), String(S)));
            case "delete":
            case "has":
            case "getAll":
              return (h2) => (gr(h2), URLSearchParams.prototype[l].call(f2, String(h2).toLowerCase()));
            case "keys":
              return () => (f2.sort(), new Set(URLSearchParams.prototype.keys.call(f2)).keys());
            default:
              return Reflect.get(f2, l, p2);
          }
        } });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(o4) {
        const a2 = this.getAll(o4);
        if (a2.length === 0) return null;
        let f2 = a2.join(", ");
        return /^content-encoding$/i.test(o4) && (f2 = f2.toLowerCase()), f2;
      }
      forEach(o4, a2 = void 0) {
        for (const f2 of this.keys()) Reflect.apply(o4, a2, [this.get(f2), f2, this]);
      }
      *values() {
        for (const o4 of this.keys()) yield this.get(o4);
      }
      *entries() {
        for (const o4 of this.keys()) yield [o4, this.get(o4)];
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((o4, a2) => (o4[a2] = this.getAll(a2), o4), {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((o4, a2) => {
          const f2 = this.getAll(a2);
          return a2 === "host" ? o4[a2] = f2[0] : o4[a2] = f2.length > 1 ? f2 : f2[0], o4;
        }, {});
      }
    };
    n3(Pr, "Headers");
    ye = Pr;
    Object.defineProperties(ye.prototype, ["get", "entries", "forEach", "values"].reduce((i2, o4) => (i2[o4] = { enumerable: true }, i2), {}));
    n3(ol, "fromRawHeaders");
    il = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
    jn = n3((i2) => il.has(i2), "isRedirect");
    se = Symbol("Response internals");
    Ne = class Ne2 extends xe {
      constructor(o4 = null, a2 = {}) {
        super(o4, a2);
        const f2 = a2.status != null ? a2.status : 200, l = new ye(a2.headers);
        if (o4 !== null && !l.has("Content-Type")) {
          const p2 = Ri(o4, this);
          p2 && l.append("Content-Type", p2);
        }
        this[se] = { type: "default", url: a2.url, status: f2, statusText: a2.statusText || "", headers: l, counter: a2.counter, highWaterMark: a2.highWaterMark };
      }
      get type() {
        return this[se].type;
      }
      get url() {
        return this[se].url || "";
      }
      get status() {
        return this[se].status;
      }
      get ok() {
        return this[se].status >= 200 && this[se].status < 300;
      }
      get redirected() {
        return this[se].counter > 0;
      }
      get statusText() {
        return this[se].statusText;
      }
      get headers() {
        return this[se].headers;
      }
      get highWaterMark() {
        return this[se].highWaterMark;
      }
      clone() {
        return new Ne2(In(this, this.highWaterMark), { type: this.type, url: this.url, status: this.status, statusText: this.statusText, headers: this.headers, ok: this.ok, redirected: this.redirected, size: this.size, highWaterMark: this.highWaterMark });
      }
      static redirect(o4, a2 = 302) {
        if (!jn(a2)) throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        return new Ne2(null, { headers: { location: new URL(o4).toString() }, status: a2 });
      }
      static error() {
        const o4 = new Ne2(null, { status: 0, statusText: "" });
        return o4[se].type = "error", o4;
      }
      static json(o4 = void 0, a2 = {}) {
        const f2 = JSON.stringify(o4);
        if (f2 === void 0) throw new TypeError("data is not JSON serializable");
        const l = new ye(a2 && a2.headers);
        return l.has("content-type") || l.set("content-type", "application/json"), new Ne2(f2, { ...a2, headers: l });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    n3(Ne, "Response");
    le = Ne;
    Object.defineProperties(le.prototype, { type: { enumerable: true }, url: { enumerable: true }, status: { enumerable: true }, ok: { enumerable: true }, redirected: { enumerable: true }, statusText: { enumerable: true }, headers: { enumerable: true }, clone: { enumerable: true } });
    al = n3((i2) => {
      if (i2.search) return i2.search;
      const o4 = i2.href.length - 1, a2 = i2.hash || (i2.href[o4] === "#" ? "#" : "");
      return i2.href[o4 - a2.length] === "?" ? "?" : "";
    }, "getSearch");
    n3(Ti, "stripURLForUseAsAReferrer");
    Ci = /* @__PURE__ */ new Set(["", "no-referrer", "no-referrer-when-downgrade", "same-origin", "origin", "strict-origin", "origin-when-cross-origin", "strict-origin-when-cross-origin", "unsafe-url"]);
    sl = "strict-origin-when-cross-origin";
    n3(ll, "validateReferrerPolicy");
    n3(ul, "isOriginPotentiallyTrustworthy");
    n3(ct, "isUrlPotentiallyTrustworthy");
    n3(fl, "determineRequestsReferrer");
    n3(cl, "parseReferrerPolicyFromHeader");
    $2 = Symbol("Request internals");
    qt = n3((i2) => typeof i2 == "object" && typeof i2[$2] == "object", "isRequest");
    dl = deprecate(() => {
    }, ".data is not a valid RequestInit property, use .body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (request)");
    vr = class vr2 extends xe {
      constructor(o4, a2 = {}) {
        let f2;
        if (qt(o4) ? f2 = new URL(o4.url) : (f2 = new URL(o4), o4 = {}), f2.username !== "" || f2.password !== "") throw new TypeError(`${f2} is an url with embedded credentials.`);
        let l = a2.method || o4.method || "GET";
        if (/^(delete|get|head|options|post|put)$/i.test(l) && (l = l.toUpperCase()), !qt(a2) && "data" in a2 && dl(), (a2.body != null || qt(o4) && o4.body !== null) && (l === "GET" || l === "HEAD")) throw new TypeError("Request with GET/HEAD method cannot have body");
        const p2 = a2.body ? a2.body : qt(o4) && o4.body !== null ? In(o4) : null;
        super(p2, { size: a2.size || o4.size || 0 });
        const h2 = new ye(a2.headers || o4.headers || {});
        if (p2 !== null && !h2.has("Content-Type")) {
          const w2 = Ri(p2, this);
          w2 && h2.set("Content-Type", w2);
        }
        let S = qt(o4) ? o4.signal : null;
        if ("signal" in a2 && (S = a2.signal), S != null && !Ks(S)) throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        let v2 = a2.referrer == null ? o4.referrer : a2.referrer;
        if (v2 === "") v2 = "no-referrer";
        else if (v2) {
          const w2 = new URL(v2);
          v2 = /^about:(\/\/)?client$/.test(w2) ? "client" : w2;
        } else v2 = void 0;
        this[$2] = { method: l, redirect: a2.redirect || o4.redirect || "follow", headers: h2, parsedURL: f2, signal: S, referrer: v2 }, this.follow = a2.follow === void 0 ? o4.follow === void 0 ? 20 : o4.follow : a2.follow, this.compress = a2.compress === void 0 ? o4.compress === void 0 ? true : o4.compress : a2.compress, this.counter = a2.counter || o4.counter || 0, this.agent = a2.agent || o4.agent, this.highWaterMark = a2.highWaterMark || o4.highWaterMark || 16384, this.insecureHTTPParser = a2.insecureHTTPParser || o4.insecureHTTPParser || false, this.referrerPolicy = a2.referrerPolicy || o4.referrerPolicy || "";
      }
      get method() {
        return this[$2].method;
      }
      get url() {
        return format(this[$2].parsedURL);
      }
      get headers() {
        return this[$2].headers;
      }
      get redirect() {
        return this[$2].redirect;
      }
      get signal() {
        return this[$2].signal;
      }
      get referrer() {
        if (this[$2].referrer === "no-referrer") return "";
        if (this[$2].referrer === "client") return "about:client";
        if (this[$2].referrer) return this[$2].referrer.toString();
      }
      get referrerPolicy() {
        return this[$2].referrerPolicy;
      }
      set referrerPolicy(o4) {
        this[$2].referrerPolicy = ll(o4);
      }
      clone() {
        return new vr2(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    n3(vr, "Request");
    dt = vr;
    Object.defineProperties(dt.prototype, { method: { enumerable: true }, url: { enumerable: true }, headers: { enumerable: true }, redirect: { enumerable: true }, clone: { enumerable: true }, signal: { enumerable: true }, referrer: { enumerable: true }, referrerPolicy: { enumerable: true } });
    hl = n3((i2) => {
      const { parsedURL: o4 } = i2[$2], a2 = new ye(i2[$2].headers);
      a2.has("Accept") || a2.set("Accept", "*/*");
      let f2 = null;
      if (i2.body === null && /^(post|put)$/i.test(i2.method) && (f2 = "0"), i2.body !== null) {
        const S = rl(i2);
        typeof S == "number" && !Number.isNaN(S) && (f2 = String(S));
      }
      f2 && a2.set("Content-Length", f2), i2.referrerPolicy === "" && (i2.referrerPolicy = sl), i2.referrer && i2.referrer !== "no-referrer" ? i2[$2].referrer = fl(i2) : i2[$2].referrer = "no-referrer", i2[$2].referrer instanceof URL && a2.set("Referer", i2.referrer), a2.has("User-Agent") || a2.set("User-Agent", "node-fetch"), i2.compress && !a2.has("Accept-Encoding") && a2.set("Accept-Encoding", "gzip, deflate, br");
      let { agent: l } = i2;
      typeof l == "function" && (l = l(o4));
      const p2 = al(o4), h2 = { path: o4.pathname + p2, method: i2.method, headers: a2[Symbol.for("nodejs.util.inspect.custom")](), insecureHTTPParser: i2.insecureHTTPParser, agent: l };
      return { parsedURL: o4, options: h2 };
    }, "getNodeRequestOptions");
    Hn = class Hn2 extends ft {
      constructor(o4, a2 = "aborted") {
        super(o4, a2);
      }
    };
    n3(Hn, "AbortError");
    _r = Hn;
    n3(pl, "requireNodeDomexception");
    bl = pl();
    ml = f(bl);
    ({ stat: $n } = promises);
    yl = n3((i2, o4) => vi(statSync(i2), i2, o4), "blobFromSync");
    gl = n3((i2, o4) => $n(i2).then((a2) => vi(a2, i2, o4)), "blobFrom");
    _l = n3((i2, o4) => $n(i2).then((a2) => Ei(a2, i2, o4)), "fileFrom");
    Sl = n3((i2, o4) => Ei(statSync(i2), i2, o4), "fileFromSync");
    vi = n3((i2, o4, a2 = "") => new ut([new Sr({ path: o4, size: i2.size, lastModified: i2.mtimeMs, start: 0 })], { type: a2 }), "fromBlob");
    Ei = n3((i2, o4, a2 = "") => new qn([new Sr({ path: o4, size: i2.size, lastModified: i2.mtimeMs, start: 0 })], basename(o4), { type: a2, lastModified: i2.mtimeMs }), "fromFile");
    Er = class Er2 {
      constructor(o4) {
        be(this, He);
        be(this, Ve);
        X(this, He, o4.path), X(this, Ve, o4.start), this.size = o4.size, this.lastModified = o4.lastModified;
      }
      slice(o4, a2) {
        return new Er2({ path: O(this, He), lastModified: this.lastModified, size: a2 - o4, start: O(this, Ve) + o4 });
      }
      async *stream() {
        const { mtimeMs: o4 } = await $n(O(this, He));
        if (o4 > this.lastModified) throw new ml("The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.", "NotReadableError");
        yield* createReadStream(O(this, He), { start: O(this, Ve), end: O(this, Ve) + this.size - 1 });
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
    };
    He = /* @__PURE__ */ new WeakMap(), Ve = /* @__PURE__ */ new WeakMap(), n3(Er, "BlobDataItem");
    Sr = Er;
    wl = /* @__PURE__ */ new Set(["data:", "http:", "https:"]);
    n3(Ai, "fetch$1");
    n3(Rl, "fixResponseChunkedTransferBadEnding");
    Bi = /* @__PURE__ */ new WeakMap();
    Dn = /* @__PURE__ */ new WeakMap();
    n3(W, "pd");
    n3(ki, "setCancelFlag");
    n3(ht, "Event"), ht.prototype = { get type() {
      return W(this).event.type;
    }, get target() {
      return W(this).eventTarget;
    }, get currentTarget() {
      return W(this).currentTarget;
    }, composedPath() {
      const i2 = W(this).currentTarget;
      return i2 == null ? [] : [i2];
    }, get NONE() {
      return 0;
    }, get CAPTURING_PHASE() {
      return 1;
    }, get AT_TARGET() {
      return 2;
    }, get BUBBLING_PHASE() {
      return 3;
    }, get eventPhase() {
      return W(this).eventPhase;
    }, stopPropagation() {
      const i2 = W(this);
      i2.stopped = true, typeof i2.event.stopPropagation == "function" && i2.event.stopPropagation();
    }, stopImmediatePropagation() {
      const i2 = W(this);
      i2.stopped = true, i2.immediateStopped = true, typeof i2.event.stopImmediatePropagation == "function" && i2.event.stopImmediatePropagation();
    }, get bubbles() {
      return !!W(this).event.bubbles;
    }, get cancelable() {
      return !!W(this).event.cancelable;
    }, preventDefault() {
      ki(W(this));
    }, get defaultPrevented() {
      return W(this).canceled;
    }, get composed() {
      return !!W(this).event.composed;
    }, get timeStamp() {
      return W(this).timeStamp;
    }, get srcElement() {
      return W(this).eventTarget;
    }, get cancelBubble() {
      return W(this).stopped;
    }, set cancelBubble(i2) {
      if (!i2) return;
      const o4 = W(this);
      o4.stopped = true, typeof o4.event.cancelBubble == "boolean" && (o4.event.cancelBubble = true);
    }, get returnValue() {
      return !W(this).canceled;
    }, set returnValue(i2) {
      i2 || ki(W(this));
    }, initEvent() {
    } }, Object.defineProperty(ht.prototype, "constructor", { value: ht, configurable: true, writable: true }), typeof window < "u" && typeof window.Event < "u" && (Object.setPrototypeOf(ht.prototype, window.Event.prototype), Dn.set(window.Event.prototype, ht));
    n3(Wi, "defineRedirectDescriptor");
    n3(Tl, "defineCallDescriptor");
    n3(Cl, "defineWrapper");
    n3(qi, "getWrapper");
    n3(Pl, "wrapEvent");
    n3(vl, "isStopped");
    n3(El, "setEventPhase");
    n3(Al, "setCurrentTarget");
    n3(Oi, "setPassiveListener");
    zi = /* @__PURE__ */ new WeakMap();
    Ii = 1;
    Fi = 2;
    wr = 3;
    n3(Rr, "isObject");
    n3(Ot, "getListeners");
    n3(Bl, "defineEventAttributeDescriptor");
    n3(ji, "defineEventAttribute");
    n3(Li, "defineCustomEventTarget");
    n3(Pe, "EventTarget"), Pe.prototype = { addEventListener(i2, o4, a2) {
      if (o4 == null) return;
      if (typeof o4 != "function" && !Rr(o4)) throw new TypeError("'listener' should be a function or an object.");
      const f2 = Ot(this), l = Rr(a2), h2 = (l ? !!a2.capture : !!a2) ? Ii : Fi, S = { listener: o4, listenerType: h2, passive: l && !!a2.passive, once: l && !!a2.once, next: null };
      let v2 = f2.get(i2);
      if (v2 === void 0) {
        f2.set(i2, S);
        return;
      }
      let w2 = null;
      for (; v2 != null; ) {
        if (v2.listener === o4 && v2.listenerType === h2) return;
        w2 = v2, v2 = v2.next;
      }
      w2.next = S;
    }, removeEventListener(i2, o4, a2) {
      if (o4 == null) return;
      const f2 = Ot(this), p2 = (Rr(a2) ? !!a2.capture : !!a2) ? Ii : Fi;
      let h2 = null, S = f2.get(i2);
      for (; S != null; ) {
        if (S.listener === o4 && S.listenerType === p2) {
          h2 !== null ? h2.next = S.next : S.next !== null ? f2.set(i2, S.next) : f2.delete(i2);
          return;
        }
        h2 = S, S = S.next;
      }
    }, dispatchEvent(i2) {
      if (i2 == null || typeof i2.type != "string") throw new TypeError('"event.type" should be a string.');
      const o4 = Ot(this), a2 = i2.type;
      let f2 = o4.get(a2);
      if (f2 == null) return true;
      const l = Pl(this, i2);
      let p2 = null;
      for (; f2 != null; ) {
        if (f2.once ? p2 !== null ? p2.next = f2.next : f2.next !== null ? o4.set(a2, f2.next) : o4.delete(a2) : p2 = f2, Oi(l, f2.passive ? f2.listener : null), typeof f2.listener == "function") try {
          f2.listener.call(this, l);
        } catch (h2) {
          typeof console < "u" && typeof console.error == "function" && console.error(h2);
        }
        else f2.listenerType !== wr && typeof f2.listener.handleEvent == "function" && f2.listener.handleEvent(l);
        if (vl(l)) break;
        f2 = f2.next;
      }
      return Oi(l, null), El(l, 0), Al(l, null), !l.defaultPrevented;
    } }, Object.defineProperty(Pe.prototype, "constructor", { value: Pe, configurable: true, writable: true }), typeof window < "u" && typeof window.EventTarget < "u" && Object.setPrototypeOf(Pe.prototype, window.EventTarget.prototype);
    Vn = class Vn2 extends Pe {
      constructor() {
        throw super(), new TypeError("AbortSignal cannot be constructed directly");
      }
      get aborted() {
        const o4 = Tr.get(this);
        if (typeof o4 != "boolean") throw new TypeError(`Expected 'this' to be an 'AbortSignal' object, but got ${this === null ? "null" : typeof this}`);
        return o4;
      }
    };
    n3(Vn, "AbortSignal");
    pt = Vn;
    ji(pt.prototype, "abort");
    n3(kl, "createAbortSignal");
    n3(Wl, "abortSignal");
    Tr = /* @__PURE__ */ new WeakMap();
    Object.defineProperties(pt.prototype, { aborted: { enumerable: true } }), typeof Symbol == "function" && typeof Symbol.toStringTag == "symbol" && Object.defineProperty(pt.prototype, Symbol.toStringTag, { configurable: true, value: "AbortSignal" });
    Mn = (gt = class {
      constructor() {
        $i.set(this, kl());
      }
      get signal() {
        return Di(this);
      }
      abort() {
        Wl(Di(this));
      }
    }, n3(gt, "AbortController"), gt);
    $i = /* @__PURE__ */ new WeakMap();
    n3(Di, "getSignal"), Object.defineProperties(Mn.prototype, { signal: { enumerable: true }, abort: { enumerable: true } }), typeof Symbol == "function" && typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Mn.prototype, Symbol.toStringTag, { configurable: true, value: "AbortController" });
    ql = Object.defineProperty;
    Ol = n3((i2, o4) => ql(i2, "name", { value: o4, configurable: true }), "e");
    Mi = Ai;
    Ui();
    n3(Ui, "s"), Ol(Ui, "checkNodeEnvironment");
  }
});

// examples/testapp-ssr/node_modules/node-fetch-native/dist/index.mjs
var o3, r3, p, F3, h, n4, c, R2, T;
var init_dist4 = __esm({
  "examples/testapp-ssr/node_modules/node-fetch-native/dist/index.mjs"() {
    init_node();
    init_node();
    init_node_http();
    init_node_https();
    init_node_zlib();
    init_node_stream();
    init_node_buffer();
    init_node_util();
    init_node_fetch_native_DfbY2q_x();
    init_node_url();
    init_node_net();
    init_node_fs();
    init_node_path();
    o3 = !!globalThis.process?.env?.FORCE_NODE_FETCH;
    r3 = !o3 && globalThis.fetch || Mi;
    p = !o3 && globalThis.Blob || ut;
    F3 = !o3 && globalThis.File || qn;
    h = !o3 && globalThis.FormData || br;
    n4 = !o3 && globalThis.Headers || ye;
    c = !o3 && globalThis.Request || dt;
    R2 = !o3 && globalThis.Response || le;
    T = !o3 && globalThis.AbortController || Mn;
  }
});

// examples/testapp-ssr/node_modules/ufo/dist/index.mjs
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s2 = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s2.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s2[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s2[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k2) => query[k2] !== void 0).map((k2) => encodeQueryItem(k2, query[k2])).filter(Boolean).join("&");
}
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s2] = path.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s2.length > 0 ? `?${s2.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s2] = path.split("?");
  return s0 + "/" + (s2.length > 0 ? `?${s2.join("?")}` : "") + fragment;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    const nextChar = input[_base.length];
    if (!nextChar || nextChar === "/" || nextChar === "?") {
      return input;
    }
  }
  return joinURL(_base, input);
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return defaultProto ? parseURL(defaultProto + input) : parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}
var r4, HASH_RE, AMPERSAND_RE, SLASH_RE, EQUAL_RE, PLUS_RE, ENC_CARET_RE, ENC_BACKTICK_RE, ENC_PIPE_RE, ENC_SPACE_RE, PROTOCOL_STRICT_REGEX, PROTOCOL_REGEX, PROTOCOL_RELATIVE_REGEX, TRAILING_SLASH_RE, JOIN_LEADING_SLASH_RE, protocolRelative;
var init_dist5 = __esm({
  "examples/testapp-ssr/node_modules/ufo/dist/index.mjs"() {
    r4 = String.fromCharCode;
    HASH_RE = /#/g;
    AMPERSAND_RE = /&/g;
    SLASH_RE = /\//g;
    EQUAL_RE = /=/g;
    PLUS_RE = /\+/g;
    ENC_CARET_RE = /%5e/gi;
    ENC_BACKTICK_RE = /%60/gi;
    ENC_PIPE_RE = /%7c/gi;
    ENC_SPACE_RE = /%20/gi;
    PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
    PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
    PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
    TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
    JOIN_LEADING_SLASH_RE = /^\.?\//;
    protocolRelative = Symbol.for("ufo:protocolRelative");
  }
});

// examples/testapp-ssr/node_modules/ofetch/dist/shared/ofetch.CWycOUEr.mjs
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t4 = typeof value;
  if (t4 === "string" || t4 === "number" || t4 === "boolean" || t4 === null) {
    return true;
  }
  if (t4 !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers3) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers3
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers3) {
  if (!defaults) {
    return new Headers3(input);
  }
  const headers = new Headers3(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers3(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}
function createFetch(globalOptions = {}) {
  const {
    fetch: fetch3 = globalThis.fetch,
    Headers: Headers3 = globalThis.Headers,
    AbortController: AbortController3 = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error2 = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error2, $fetchRaw);
    }
    throw error2;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers3
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers3)) {
        context.options.headers = new Headers3(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController3();
      abortTimeout = setTimeout(() => {
        const error2 = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error2.name = "TimeoutError";
        error2.code = 23;
        controller.abort(error2);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch3(
        context.request,
        context.options
      );
    } catch (error2) {
      context.error = error2;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r5 = await $fetchRaw(request, options);
    return r5._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch3(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}
var FetchError, payloadMethods, textTypes, JSON_RE, retryStatusCodes, nullBodyResponses;
var init_ofetch_CWycOUEr = __esm({
  "examples/testapp-ssr/node_modules/ofetch/dist/shared/ofetch.CWycOUEr.mjs"() {
    init_dist3();
    init_dist5();
    FetchError = class extends Error {
      constructor(message, opts) {
        super(message, opts);
        this.name = "FetchError";
        if (opts?.cause && !this.cause) {
          this.cause = opts.cause;
        }
      }
    };
    payloadMethods = new Set(
      Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
    );
    textTypes = /* @__PURE__ */ new Set([
      "image/svg",
      "application/xml",
      "application/xhtml",
      "application/html"
    ]);
    JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
    retryStatusCodes = /* @__PURE__ */ new Set([
      408,
      // Request Timeout
      409,
      // Conflict
      425,
      // Too Early (Experimental)
      429,
      // Too Many Requests
      500,
      // Internal Server Error
      502,
      // Bad Gateway
      503,
      // Service Unavailable
      504
      // Gateway Timeout
    ]);
    nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
  }
});

// examples/testapp-ssr/node_modules/ofetch/dist/node.mjs
function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return r3;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new node_http_default.Agent(agentOptions);
  const httpsAgent = new node_https_default.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init2) {
    return r3(input, { ...nodeFetchOptions, ...init2 });
  };
}
var fetch2, Headers2, AbortController2, ofetch;
var init_node2 = __esm({
  "examples/testapp-ssr/node_modules/ofetch/dist/node.mjs"() {
    init_node_http();
    init_node_https();
    init_dist4();
    init_ofetch_CWycOUEr();
    fetch2 = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
    Headers2 = globalThis.Headers || n4;
    AbortController2 = globalThis.AbortController || T;
    ofetch = createFetch({ fetch: fetch2, Headers: Headers2, AbortController: AbortController2 });
  }
});

// examples/testapp-ssr/.netlify/build/chunks/netlify-blobs_DM36vZAS.mjs
var netlify_blobs_DM36vZAS_exports = {};
__export(netlify_blobs_DM36vZAS_exports, {
  default: () => netlifyBlobs
});
function defineDriver2(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n5) => "`" + n5 + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}
var import_blobs, DRIVER_NAME2, netlifyBlobs;
var init_netlify_blobs_DM36vZAS = __esm({
  "examples/testapp-ssr/.netlify/build/chunks/netlify-blobs_DM36vZAS.mjs"() {
    import_blobs = __toESM(require_main3(), 1);
    init_node2();
    DRIVER_NAME2 = "netlify-blobs";
    netlifyBlobs = defineDriver2((options) => {
      const { deployScoped, name, ...opts } = options;
      let store;
      const getClient = () => {
        if (!store) {
          if (deployScoped) {
            if (name) {
              throw createError(
                DRIVER_NAME2,
                "deploy-scoped stores cannot have a name"
              );
            }
            store = (0, import_blobs.getDeployStore)({ fetch: fetch2, ...options });
          } else {
            if (!name) {
              throw createRequiredError(DRIVER_NAME2, "name");
            }
            store = (0, import_blobs.getStore)({ name: encodeURIComponent(name), fetch: fetch2, ...opts });
          }
        }
        return store;
      };
      return {
        name: DRIVER_NAME2,
        options,
        getInstance: getClient,
        async hasItem(key) {
          return getClient().getMetadata(key).then(Boolean);
        },
        getItem: (key, tops) => {
          return getClient().get(key, tops);
        },
        getMeta(key) {
          return getClient().getMetadata(key);
        },
        getItemRaw(key, topts) {
          return getClient().get(key, { type: topts?.type ?? "arrayBuffer" });
        },
        async setItem(key, value, topts) {
          await getClient().set(key, value, topts);
        },
        async setItemRaw(key, value, topts) {
          await getClient().set(key, value, topts);
        },
        removeItem(key) {
          return getClient().delete(key);
        },
        async getKeys(base, tops) {
          return (await getClient().list({ ...tops, prefix: base })).blobs.map(
            (item) => item.key
          );
        },
        async clear(base) {
          const client = getClient();
          return Promise.allSettled(
            (await client.list({ prefix: base })).blobs.map(
              (item) => client.delete(item.key)
            )
          ).then(() => {
          });
        }
      };
    });
  }
});

// examples/testapp-ssr/node_modules/mrmime/index.mjs
function lookup(extn) {
  let tmp = ("" + extn).trim().toLowerCase();
  let idx = tmp.lastIndexOf(".");
  return mimes[!~idx ? tmp : tmp.substring(++idx)];
}
var mimes;
var init_mrmime = __esm({
  "examples/testapp-ssr/node_modules/mrmime/index.mjs"() {
    mimes = {
      "3g2": "video/3gpp2",
      "3gp": "video/3gpp",
      "3gpp": "video/3gpp",
      "3mf": "model/3mf",
      "aac": "audio/aac",
      "ac": "application/pkix-attr-cert",
      "adp": "audio/adpcm",
      "adts": "audio/aac",
      "ai": "application/postscript",
      "aml": "application/automationml-aml+xml",
      "amlx": "application/automationml-amlx+zip",
      "amr": "audio/amr",
      "apng": "image/apng",
      "appcache": "text/cache-manifest",
      "appinstaller": "application/appinstaller",
      "appx": "application/appx",
      "appxbundle": "application/appxbundle",
      "asc": "application/pgp-keys",
      "atom": "application/atom+xml",
      "atomcat": "application/atomcat+xml",
      "atomdeleted": "application/atomdeleted+xml",
      "atomsvc": "application/atomsvc+xml",
      "au": "audio/basic",
      "avci": "image/avci",
      "avcs": "image/avcs",
      "avif": "image/avif",
      "aw": "application/applixware",
      "bdoc": "application/bdoc",
      "bin": "application/octet-stream",
      "bmp": "image/bmp",
      "bpk": "application/octet-stream",
      "btf": "image/prs.btif",
      "btif": "image/prs.btif",
      "buffer": "application/octet-stream",
      "ccxml": "application/ccxml+xml",
      "cdfx": "application/cdfx+xml",
      "cdmia": "application/cdmi-capability",
      "cdmic": "application/cdmi-container",
      "cdmid": "application/cdmi-domain",
      "cdmio": "application/cdmi-object",
      "cdmiq": "application/cdmi-queue",
      "cer": "application/pkix-cert",
      "cgm": "image/cgm",
      "cjs": "application/node",
      "class": "application/java-vm",
      "coffee": "text/coffeescript",
      "conf": "text/plain",
      "cpl": "application/cpl+xml",
      "cpt": "application/mac-compactpro",
      "crl": "application/pkix-crl",
      "css": "text/css",
      "csv": "text/csv",
      "cu": "application/cu-seeme",
      "cwl": "application/cwl",
      "cww": "application/prs.cww",
      "davmount": "application/davmount+xml",
      "dbk": "application/docbook+xml",
      "deb": "application/octet-stream",
      "def": "text/plain",
      "deploy": "application/octet-stream",
      "dib": "image/bmp",
      "disposition-notification": "message/disposition-notification",
      "dist": "application/octet-stream",
      "distz": "application/octet-stream",
      "dll": "application/octet-stream",
      "dmg": "application/octet-stream",
      "dms": "application/octet-stream",
      "doc": "application/msword",
      "dot": "application/msword",
      "dpx": "image/dpx",
      "drle": "image/dicom-rle",
      "dsc": "text/prs.lines.tag",
      "dssc": "application/dssc+der",
      "dtd": "application/xml-dtd",
      "dump": "application/octet-stream",
      "dwd": "application/atsc-dwd+xml",
      "ear": "application/java-archive",
      "ecma": "application/ecmascript",
      "elc": "application/octet-stream",
      "emf": "image/emf",
      "eml": "message/rfc822",
      "emma": "application/emma+xml",
      "emotionml": "application/emotionml+xml",
      "eps": "application/postscript",
      "epub": "application/epub+zip",
      "exe": "application/octet-stream",
      "exi": "application/exi",
      "exp": "application/express",
      "exr": "image/aces",
      "ez": "application/andrew-inset",
      "fdf": "application/fdf",
      "fdt": "application/fdt+xml",
      "fits": "image/fits",
      "g3": "image/g3fax",
      "gbr": "application/rpki-ghostbusters",
      "geojson": "application/geo+json",
      "gif": "image/gif",
      "glb": "model/gltf-binary",
      "gltf": "model/gltf+json",
      "gml": "application/gml+xml",
      "gpx": "application/gpx+xml",
      "gram": "application/srgs",
      "grxml": "application/srgs+xml",
      "gxf": "application/gxf",
      "gz": "application/gzip",
      "h261": "video/h261",
      "h263": "video/h263",
      "h264": "video/h264",
      "heic": "image/heic",
      "heics": "image/heic-sequence",
      "heif": "image/heif",
      "heifs": "image/heif-sequence",
      "hej2": "image/hej2k",
      "held": "application/atsc-held+xml",
      "hjson": "application/hjson",
      "hlp": "application/winhlp",
      "hqx": "application/mac-binhex40",
      "hsj2": "image/hsj2",
      "htm": "text/html",
      "html": "text/html",
      "ics": "text/calendar",
      "ief": "image/ief",
      "ifb": "text/calendar",
      "iges": "model/iges",
      "igs": "model/iges",
      "img": "application/octet-stream",
      "in": "text/plain",
      "ini": "text/plain",
      "ink": "application/inkml+xml",
      "inkml": "application/inkml+xml",
      "ipfix": "application/ipfix",
      "iso": "application/octet-stream",
      "its": "application/its+xml",
      "jade": "text/jade",
      "jar": "application/java-archive",
      "jhc": "image/jphc",
      "jls": "image/jls",
      "jp2": "image/jp2",
      "jpe": "image/jpeg",
      "jpeg": "image/jpeg",
      "jpf": "image/jpx",
      "jpg": "image/jpeg",
      "jpg2": "image/jp2",
      "jpgm": "image/jpm",
      "jpgv": "video/jpeg",
      "jph": "image/jph",
      "jpm": "image/jpm",
      "jpx": "image/jpx",
      "js": "text/javascript",
      "json": "application/json",
      "json5": "application/json5",
      "jsonld": "application/ld+json",
      "jsonml": "application/jsonml+json",
      "jsx": "text/jsx",
      "jt": "model/jt",
      "jxl": "image/jxl",
      "jxr": "image/jxr",
      "jxra": "image/jxra",
      "jxrs": "image/jxrs",
      "jxs": "image/jxs",
      "jxsc": "image/jxsc",
      "jxsi": "image/jxsi",
      "jxss": "image/jxss",
      "kar": "audio/midi",
      "ktx": "image/ktx",
      "ktx2": "image/ktx2",
      "less": "text/less",
      "lgr": "application/lgr+xml",
      "list": "text/plain",
      "litcoffee": "text/coffeescript",
      "log": "text/plain",
      "lostxml": "application/lost+xml",
      "lrf": "application/octet-stream",
      "m1v": "video/mpeg",
      "m21": "application/mp21",
      "m2a": "audio/mpeg",
      "m2t": "video/mp2t",
      "m2ts": "video/mp2t",
      "m2v": "video/mpeg",
      "m3a": "audio/mpeg",
      "m4a": "audio/mp4",
      "m4p": "application/mp4",
      "m4s": "video/iso.segment",
      "ma": "application/mathematica",
      "mads": "application/mads+xml",
      "maei": "application/mmt-aei+xml",
      "man": "text/troff",
      "manifest": "text/cache-manifest",
      "map": "application/json",
      "mar": "application/octet-stream",
      "markdown": "text/markdown",
      "mathml": "application/mathml+xml",
      "mb": "application/mathematica",
      "mbox": "application/mbox",
      "md": "text/markdown",
      "mdx": "text/mdx",
      "me": "text/troff",
      "mesh": "model/mesh",
      "meta4": "application/metalink4+xml",
      "metalink": "application/metalink+xml",
      "mets": "application/mets+xml",
      "mft": "application/rpki-manifest",
      "mid": "audio/midi",
      "midi": "audio/midi",
      "mime": "message/rfc822",
      "mj2": "video/mj2",
      "mjp2": "video/mj2",
      "mjs": "text/javascript",
      "mml": "text/mathml",
      "mods": "application/mods+xml",
      "mov": "video/quicktime",
      "mp2": "audio/mpeg",
      "mp21": "application/mp21",
      "mp2a": "audio/mpeg",
      "mp3": "audio/mpeg",
      "mp4": "video/mp4",
      "mp4a": "audio/mp4",
      "mp4s": "application/mp4",
      "mp4v": "video/mp4",
      "mpd": "application/dash+xml",
      "mpe": "video/mpeg",
      "mpeg": "video/mpeg",
      "mpf": "application/media-policy-dataset+xml",
      "mpg": "video/mpeg",
      "mpg4": "video/mp4",
      "mpga": "audio/mpeg",
      "mpp": "application/dash-patch+xml",
      "mrc": "application/marc",
      "mrcx": "application/marcxml+xml",
      "ms": "text/troff",
      "mscml": "application/mediaservercontrol+xml",
      "msh": "model/mesh",
      "msi": "application/octet-stream",
      "msix": "application/msix",
      "msixbundle": "application/msixbundle",
      "msm": "application/octet-stream",
      "msp": "application/octet-stream",
      "mtl": "model/mtl",
      "mts": "video/mp2t",
      "musd": "application/mmt-usd+xml",
      "mxf": "application/mxf",
      "mxmf": "audio/mobile-xmf",
      "mxml": "application/xv+xml",
      "n3": "text/n3",
      "nb": "application/mathematica",
      "nq": "application/n-quads",
      "nt": "application/n-triples",
      "obj": "model/obj",
      "oda": "application/oda",
      "oga": "audio/ogg",
      "ogg": "audio/ogg",
      "ogv": "video/ogg",
      "ogx": "application/ogg",
      "omdoc": "application/omdoc+xml",
      "onepkg": "application/onenote",
      "onetmp": "application/onenote",
      "onetoc": "application/onenote",
      "onetoc2": "application/onenote",
      "opf": "application/oebps-package+xml",
      "opus": "audio/ogg",
      "otf": "font/otf",
      "owl": "application/rdf+xml",
      "oxps": "application/oxps",
      "p10": "application/pkcs10",
      "p7c": "application/pkcs7-mime",
      "p7m": "application/pkcs7-mime",
      "p7s": "application/pkcs7-signature",
      "p8": "application/pkcs8",
      "pdf": "application/pdf",
      "pfr": "application/font-tdpfr",
      "pgp": "application/pgp-encrypted",
      "pkg": "application/octet-stream",
      "pki": "application/pkixcmp",
      "pkipath": "application/pkix-pkipath",
      "pls": "application/pls+xml",
      "png": "image/png",
      "prc": "model/prc",
      "prf": "application/pics-rules",
      "provx": "application/provenance+xml",
      "ps": "application/postscript",
      "pskcxml": "application/pskc+xml",
      "pti": "image/prs.pti",
      "qt": "video/quicktime",
      "raml": "application/raml+yaml",
      "rapd": "application/route-apd+xml",
      "rdf": "application/rdf+xml",
      "relo": "application/p2p-overlay+xml",
      "rif": "application/reginfo+xml",
      "rl": "application/resource-lists+xml",
      "rld": "application/resource-lists-diff+xml",
      "rmi": "audio/midi",
      "rnc": "application/relax-ng-compact-syntax",
      "rng": "application/xml",
      "roa": "application/rpki-roa",
      "roff": "text/troff",
      "rq": "application/sparql-query",
      "rs": "application/rls-services+xml",
      "rsat": "application/atsc-rsat+xml",
      "rsd": "application/rsd+xml",
      "rsheet": "application/urc-ressheet+xml",
      "rss": "application/rss+xml",
      "rtf": "text/rtf",
      "rtx": "text/richtext",
      "rusd": "application/route-usd+xml",
      "s3m": "audio/s3m",
      "sbml": "application/sbml+xml",
      "scq": "application/scvp-cv-request",
      "scs": "application/scvp-cv-response",
      "sdp": "application/sdp",
      "senmlx": "application/senml+xml",
      "sensmlx": "application/sensml+xml",
      "ser": "application/java-serialized-object",
      "setpay": "application/set-payment-initiation",
      "setreg": "application/set-registration-initiation",
      "sgi": "image/sgi",
      "sgm": "text/sgml",
      "sgml": "text/sgml",
      "shex": "text/shex",
      "shf": "application/shf+xml",
      "shtml": "text/html",
      "sieve": "application/sieve",
      "sig": "application/pgp-signature",
      "sil": "audio/silk",
      "silo": "model/mesh",
      "siv": "application/sieve",
      "slim": "text/slim",
      "slm": "text/slim",
      "sls": "application/route-s-tsid+xml",
      "smi": "application/smil+xml",
      "smil": "application/smil+xml",
      "snd": "audio/basic",
      "so": "application/octet-stream",
      "spdx": "text/spdx",
      "spp": "application/scvp-vp-response",
      "spq": "application/scvp-vp-request",
      "spx": "audio/ogg",
      "sql": "application/sql",
      "sru": "application/sru+xml",
      "srx": "application/sparql-results+xml",
      "ssdl": "application/ssdl+xml",
      "ssml": "application/ssml+xml",
      "stk": "application/hyperstudio",
      "stl": "model/stl",
      "stpx": "model/step+xml",
      "stpxz": "model/step-xml+zip",
      "stpz": "model/step+zip",
      "styl": "text/stylus",
      "stylus": "text/stylus",
      "svg": "image/svg+xml",
      "svgz": "image/svg+xml",
      "swidtag": "application/swid+xml",
      "t": "text/troff",
      "t38": "image/t38",
      "td": "application/urc-targetdesc+xml",
      "tei": "application/tei+xml",
      "teicorpus": "application/tei+xml",
      "text": "text/plain",
      "tfi": "application/thraud+xml",
      "tfx": "image/tiff-fx",
      "tif": "image/tiff",
      "tiff": "image/tiff",
      "toml": "application/toml",
      "tr": "text/troff",
      "trig": "application/trig",
      "ts": "video/mp2t",
      "tsd": "application/timestamped-data",
      "tsv": "text/tab-separated-values",
      "ttc": "font/collection",
      "ttf": "font/ttf",
      "ttl": "text/turtle",
      "ttml": "application/ttml+xml",
      "txt": "text/plain",
      "u3d": "model/u3d",
      "u8dsn": "message/global-delivery-status",
      "u8hdr": "message/global-headers",
      "u8mdn": "message/global-disposition-notification",
      "u8msg": "message/global",
      "ubj": "application/ubjson",
      "uri": "text/uri-list",
      "uris": "text/uri-list",
      "urls": "text/uri-list",
      "vcard": "text/vcard",
      "vrml": "model/vrml",
      "vtt": "text/vtt",
      "vxml": "application/voicexml+xml",
      "war": "application/java-archive",
      "wasm": "application/wasm",
      "wav": "audio/wav",
      "weba": "audio/webm",
      "webm": "video/webm",
      "webmanifest": "application/manifest+json",
      "webp": "image/webp",
      "wgsl": "text/wgsl",
      "wgt": "application/widget",
      "wif": "application/watcherinfo+xml",
      "wmf": "image/wmf",
      "woff": "font/woff",
      "woff2": "font/woff2",
      "wrl": "model/vrml",
      "wsdl": "application/wsdl+xml",
      "wspolicy": "application/wspolicy+xml",
      "x3d": "model/x3d+xml",
      "x3db": "model/x3d+fastinfoset",
      "x3dbz": "model/x3d+binary",
      "x3dv": "model/x3d-vrml",
      "x3dvz": "model/x3d+vrml",
      "x3dz": "model/x3d+xml",
      "xaml": "application/xaml+xml",
      "xav": "application/xcap-att+xml",
      "xca": "application/xcap-caps+xml",
      "xcs": "application/calendar+xml",
      "xdf": "application/xcap-diff+xml",
      "xdssc": "application/dssc+xml",
      "xel": "application/xcap-el+xml",
      "xenc": "application/xenc+xml",
      "xer": "application/patch-ops-error+xml",
      "xfdf": "application/xfdf",
      "xht": "application/xhtml+xml",
      "xhtml": "application/xhtml+xml",
      "xhvml": "application/xv+xml",
      "xlf": "application/xliff+xml",
      "xm": "audio/xm",
      "xml": "text/xml",
      "xns": "application/xcap-ns+xml",
      "xop": "application/xop+xml",
      "xpl": "application/xproc+xml",
      "xsd": "application/xml",
      "xsf": "application/prs.xsf+xml",
      "xsl": "application/xml",
      "xslt": "application/xml",
      "xspf": "application/xspf+xml",
      "xvm": "application/xv+xml",
      "xvml": "application/xv+xml",
      "yaml": "text/yaml",
      "yang": "application/yang",
      "yin": "application/yin+xml",
      "yml": "text/yaml",
      "zip": "application/zip"
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/consts.js
var VALID_SUPPORTED_FORMATS, DEFAULT_OUTPUT_FORMAT, DEFAULT_HASH_PROPS;
var init_consts = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/consts.js"() {
    VALID_SUPPORTED_FORMATS = [
      "jpeg",
      "jpg",
      "png",
      "tiff",
      "webp",
      "gif",
      "svg",
      "avif"
    ];
    DEFAULT_OUTPUT_FORMAT = "webp";
    DEFAULT_HASH_PROPS = [
      "src",
      "width",
      "height",
      "format",
      "quality",
      "fit",
      "position",
      "background"
    ];
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/layout.js
var init_layout = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/layout.js"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/imageKind.js
function isESMImportedImage(src) {
  return typeof src === "object" || typeof src === "function" && "src" in src;
}
function isRemoteImage(src) {
  return typeof src === "string";
}
var init_imageKind = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/imageKind.js"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/services/service.js
function verifyOptions(options) {
  if (!options.src || !isRemoteImage(options.src) && !isESMImportedImage(options.src)) {
    throw new AstroError({
      ...errors_data_exports.ExpectedImage,
      message: errors_data_exports.ExpectedImage.message(
        JSON.stringify(options.src),
        typeof options.src,
        JSON.stringify(options, (_, v2) => v2 === void 0 ? null : v2)
      )
    });
  }
  if (!isESMImportedImage(options.src)) {
    if (options.src.startsWith("/@fs/") || !isRemotePath(options.src) && !options.src.startsWith("/")) {
      throw new AstroError({
        ...errors_data_exports.LocalImageUsedWrongly,
        message: errors_data_exports.LocalImageUsedWrongly.message(options.src)
      });
    }
    let missingDimension;
    if (!options.width && !options.height) {
      missingDimension = "both";
    } else if (!options.width && options.height) {
      missingDimension = "width";
    } else if (options.width && !options.height) {
      missingDimension = "height";
    }
    if (missingDimension) {
      throw new AstroError({
        ...errors_data_exports.MissingImageDimension,
        message: errors_data_exports.MissingImageDimension.message(missingDimension, options.src)
      });
    }
  } else {
    if (!VALID_SUPPORTED_FORMATS.includes(options.src.format)) {
      throw new AstroError({
        ...errors_data_exports.UnsupportedImageFormat,
        message: errors_data_exports.UnsupportedImageFormat.message(
          options.src.format,
          options.src.src,
          VALID_SUPPORTED_FORMATS
        )
      });
    }
    if (options.widths && options.densities) {
      throw new AstroError(errors_data_exports.IncompatibleDescriptorOptions);
    }
    if (options.src.format === "svg" && options.format !== "svg" || options.src.format !== "svg" && options.format === "svg") {
      throw new AstroError(errors_data_exports.UnsupportedImageConversion);
    }
  }
}
function getTargetDimensions(options) {
  let targetWidth = options.width;
  let targetHeight = options.height;
  if (isESMImportedImage(options.src)) {
    const aspectRatio = options.src.width / options.src.height;
    if (targetHeight && !targetWidth) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else if (targetWidth && !targetHeight) {
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else if (!targetWidth && !targetHeight) {
      targetWidth = options.src.width;
      targetHeight = options.src.height;
    }
  }
  return {
    targetWidth,
    targetHeight
  };
}
var sortNumeric, baseService;
var init_service = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/services/service.js"() {
    init_remote();
    init_errors3();
    init_path2();
    init_consts();
    init_imageKind();
    sortNumeric = (a2, b) => a2 - b;
    baseService = {
      propertiesToHash: DEFAULT_HASH_PROPS,
      validateOptions(options) {
        if (isESMImportedImage(options.src) && options.src.format === "svg") {
          options.format = "svg";
        }
        verifyOptions(options);
        if (!options.format) {
          options.format = DEFAULT_OUTPUT_FORMAT;
        }
        if (options.width) options.width = Math.round(options.width);
        if (options.height) options.height = Math.round(options.height);
        if (options.layout && options.width && options.height) {
          options.fit ??= "cover";
          delete options.layout;
        }
        if (options.fit === "none") {
          delete options.fit;
        }
        return options;
      },
      getHTMLAttributes(options) {
        const { targetWidth, targetHeight } = getTargetDimensions(options);
        const {
          src,
          width,
          height,
          format: format2,
          quality,
          densities,
          widths,
          formats,
          layout,
          priority,
          fit,
          position,
          background,
          ...attributes
        } = options;
        return {
          ...attributes,
          width: targetWidth,
          height: targetHeight,
          loading: attributes.loading ?? "lazy",
          decoding: attributes.decoding ?? "async"
        };
      },
      getSrcSet(options) {
        const { targetWidth, targetHeight } = getTargetDimensions(options);
        const aspectRatio = targetWidth / targetHeight;
        const { widths, densities } = options;
        const targetFormat = options.format ?? DEFAULT_OUTPUT_FORMAT;
        let transformedWidths = (widths ?? []).sort(sortNumeric);
        let imageWidth = options.width;
        let maxWidth = Infinity;
        if (isESMImportedImage(options.src)) {
          imageWidth = options.src.width;
          maxWidth = imageWidth;
          if (transformedWidths.length > 0 && transformedWidths.at(-1) > maxWidth) {
            transformedWidths = transformedWidths.filter((width) => width <= maxWidth);
            transformedWidths.push(maxWidth);
          }
        }
        transformedWidths = Array.from(new Set(transformedWidths));
        const {
          width: transformWidth,
          height: transformHeight,
          ...transformWithoutDimensions
        } = options;
        let allWidths = [];
        if (densities) {
          const densityValues = densities.map((density) => {
            if (typeof density === "number") {
              return density;
            } else {
              return parseFloat(density);
            }
          });
          const densityWidths = densityValues.sort(sortNumeric).map((density) => Math.round(targetWidth * density));
          allWidths = densityWidths.map((width, index) => ({
            width,
            descriptor: `${densityValues[index]}x`
          }));
        } else if (transformedWidths.length > 0) {
          allWidths = transformedWidths.map((width) => ({
            width,
            descriptor: `${width}w`
          }));
        }
        return allWidths.map(({ width, descriptor }) => {
          const height = Math.round(width / aspectRatio);
          const transform = { ...transformWithoutDimensions, width, height };
          return {
            transform,
            descriptor,
            attributes: {
              type: `image/${targetFormat}`
            }
          };
        });
      },
      getURL(options, imageConfig2) {
        const searchParams = new URLSearchParams();
        if (isESMImportedImage(options.src)) {
          searchParams.append("href", options.src.src);
        } else if (isRemoteAllowed(options.src, imageConfig2)) {
          searchParams.append("href", options.src);
        } else {
          return options.src;
        }
        const params = {
          w: "width",
          h: "height",
          q: "quality",
          f: "format",
          fit: "fit",
          position: "position",
          background: "background"
        };
        Object.entries(params).forEach(([param, key]) => {
          options[key] && searchParams.append(param, options[key].toString());
        });
        const imageEndpoint = joinPaths(import.meta.env.BASE_URL, imageConfig2.endpoint.route);
        let url = `${imageEndpoint}?${searchParams}`;
        if (imageConfig2.assetQueryParams) {
          const assetQueryString = imageConfig2.assetQueryParams.toString();
          if (assetQueryString) {
            url += "&" + assetQueryString;
          }
        }
        return url;
      },
      parseURL(url) {
        const params = url.searchParams;
        if (!params.has("href")) {
          return void 0;
        }
        const transform = {
          src: params.get("href"),
          width: params.has("w") ? parseInt(params.get("w")) : void 0,
          height: params.has("h") ? parseInt(params.get("h")) : void 0,
          format: params.get("f"),
          quality: params.get("q"),
          fit: params.get("fit"),
          position: params.get("position") ?? void 0,
          background: params.get("background") ?? void 0
        };
        return transform;
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/types.js
var isESMImport;
var init_types2 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/types.js"() {
    isESMImport = Symbol("#isESM");
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/imageAttributes.js
var init_imageAttributes = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/imageAttributes.js"() {
    init_util3();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/utils.js
function readUInt(input, bits, offset = 0, isBigEndian = false) {
  const endian = isBigEndian ? "BE" : "LE";
  const methodName = `readUInt${bits}${endian}`;
  return methods[methodName](input, offset);
}
function readBox(input, offset) {
  if (input.length - offset < 4) return;
  const boxSize = readUInt32BE(input, offset);
  if (input.length - offset < boxSize) return;
  return {
    name: toUTF8String(input, 4 + offset, 8 + offset),
    offset,
    size: boxSize
  };
}
function findBox(input, boxName, currentOffset) {
  while (currentOffset < input.length) {
    const box = readBox(input, currentOffset);
    if (!box) break;
    if (box.name === boxName) return box;
    currentOffset += box.size > 0 ? box.size : 8;
  }
}
var decoder3, toUTF8String, toHexString, getView, readInt16LE, readUInt16BE, readUInt16LE, readUInt24LE, readInt32LE, readUInt32BE, readUInt32LE, readUInt64, methods;
var init_utils2 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/utils.js"() {
    decoder3 = new TextDecoder();
    toUTF8String = (input, start = 0, end = input.length) => decoder3.decode(input.slice(start, end));
    toHexString = (input, start = 0, end = input.length) => input.slice(start, end).reduce((memo, i2) => memo + `0${i2.toString(16)}`.slice(-2), "");
    getView = (input, offset) => new DataView(input.buffer, input.byteOffset + offset);
    readInt16LE = (input, offset = 0) => getView(input, offset).getInt16(0, true);
    readUInt16BE = (input, offset = 0) => getView(input, offset).getUint16(0, false);
    readUInt16LE = (input, offset = 0) => getView(input, offset).getUint16(0, true);
    readUInt24LE = (input, offset = 0) => {
      const view = getView(input, offset);
      return view.getUint16(0, true) + (view.getUint8(2) << 16);
    };
    readInt32LE = (input, offset = 0) => getView(input, offset).getInt32(0, true);
    readUInt32BE = (input, offset = 0) => getView(input, offset).getUint32(0, false);
    readUInt32LE = (input, offset = 0) => getView(input, offset).getUint32(0, true);
    readUInt64 = (input, offset, isBigEndian) => getView(input, offset).getBigUint64(0, !isBigEndian);
    methods = {
      readUInt16BE,
      readUInt16LE,
      readUInt32BE,
      readUInt32LE
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/bmp.js
var BMP;
var init_bmp = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/bmp.js"() {
    init_utils2();
    BMP = {
      validate: (input) => toUTF8String(input, 0, 2) === "BM",
      calculate: (input) => ({
        height: Math.abs(readInt32LE(input, 22)),
        width: readUInt32LE(input, 18)
      })
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/ico.js
function getSizeFromOffset(input, offset) {
  const value = input[offset];
  return value === 0 ? 256 : value;
}
function getImageSize(input, imageIndex) {
  const offset = SIZE_HEADER + imageIndex * SIZE_IMAGE_ENTRY;
  return {
    height: getSizeFromOffset(input, offset + 1),
    width: getSizeFromOffset(input, offset)
  };
}
var TYPE_ICON, SIZE_HEADER, SIZE_IMAGE_ENTRY, ICO;
var init_ico = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/ico.js"() {
    init_utils2();
    TYPE_ICON = 1;
    SIZE_HEADER = 2 + 2 + 2;
    SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4;
    ICO = {
      validate(input) {
        const reserved = readUInt16LE(input, 0);
        const imageCount = readUInt16LE(input, 4);
        if (reserved !== 0 || imageCount === 0) return false;
        const imageType = readUInt16LE(input, 2);
        return imageType === TYPE_ICON;
      },
      calculate(input) {
        const nbImages = readUInt16LE(input, 4);
        const imageSize = getImageSize(input, 0);
        if (nbImages === 1) return imageSize;
        const images = [];
        for (let imageIndex = 0; imageIndex < nbImages; imageIndex += 1) {
          images.push(getImageSize(input, imageIndex));
        }
        return {
          width: imageSize.width,
          height: imageSize.height,
          images
        };
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/cur.js
var TYPE_CURSOR, CUR;
var init_cur = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/cur.js"() {
    init_ico();
    init_utils2();
    TYPE_CURSOR = 2;
    CUR = {
      validate(input) {
        const reserved = readUInt16LE(input, 0);
        const imageCount = readUInt16LE(input, 4);
        if (reserved !== 0 || imageCount === 0) return false;
        const imageType = readUInt16LE(input, 2);
        return imageType === TYPE_CURSOR;
      },
      calculate: (input) => ICO.calculate(input)
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/dds.js
var DDS;
var init_dds = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/dds.js"() {
    init_utils2();
    DDS = {
      validate: (input) => readUInt32LE(input, 0) === 542327876,
      calculate: (input) => ({
        height: readUInt32LE(input, 12),
        width: readUInt32LE(input, 16)
      })
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/gif.js
var gifRegexp, GIF;
var init_gif = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/gif.js"() {
    init_utils2();
    gifRegexp = /^GIF8[79]a/;
    GIF = {
      validate: (input) => gifRegexp.test(toUTF8String(input, 0, 6)),
      calculate: (input) => ({
        height: readUInt16LE(input, 8),
        width: readUInt16LE(input, 6)
      })
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/heif.js
function detectType(input, start, end) {
  let hasAvif = false;
  let hasHeic = false;
  let hasHeif = false;
  for (let i2 = start; i2 <= end; i2 += 4) {
    const brand = toUTF8String(input, i2, i2 + 4);
    if (brand === "avif" || brand === "avis") hasAvif = true;
    else if (brand === "heic" || brand === "heix" || brand === "hevc" || brand === "hevx") hasHeic = true;
    else if (brand === "mif1" || brand === "msf1") hasHeif = true;
  }
  if (hasAvif) return "avif";
  if (hasHeic) return "heic";
  if (hasHeif) return "heif";
}
var brandMap, HEIF;
var init_heif = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/heif.js"() {
    init_utils2();
    brandMap = {
      avif: "avif",
      avis: "avif",
      // avif-sequence
      mif1: "heif",
      msf1: "heif",
      // heif-sequence
      heic: "heic",
      heix: "heic",
      hevc: "heic",
      // heic-sequence
      hevx: "heic"
      // heic-sequence
    };
    HEIF = {
      validate(input) {
        const boxType = toUTF8String(input, 4, 8);
        if (boxType !== "ftyp") return false;
        const ftypBox = findBox(input, "ftyp", 0);
        if (!ftypBox) return false;
        const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
        return brand in brandMap;
      },
      calculate(input) {
        const metaBox = findBox(input, "meta", 0);
        const iprpBox = metaBox && findBox(input, "iprp", metaBox.offset + 12);
        const ipcoBox = iprpBox && findBox(input, "ipco", iprpBox.offset + 8);
        if (!ipcoBox) {
          throw new TypeError("Invalid HEIF, no ipco box found");
        }
        const type = detectType(input, 8, metaBox.offset);
        const images = [];
        let currentOffset = ipcoBox.offset + 8;
        while (currentOffset < ipcoBox.offset + ipcoBox.size) {
          const ispeBox = findBox(input, "ispe", currentOffset);
          if (!ispeBox) break;
          const rawWidth = readUInt32BE(input, ispeBox.offset + 12);
          const rawHeight = readUInt32BE(input, ispeBox.offset + 16);
          const clapBox = findBox(input, "clap", currentOffset);
          let width = rawWidth;
          let height = rawHeight;
          if (clapBox && clapBox.offset < ipcoBox.offset + ipcoBox.size) {
            const cropRight = readUInt32BE(input, clapBox.offset + 12);
            width = rawWidth - cropRight;
          }
          images.push({ height, width });
          currentOffset = ispeBox.offset + ispeBox.size;
        }
        if (images.length === 0) {
          throw new TypeError("Invalid HEIF, no sizes found");
        }
        return {
          width: images[0].width,
          height: images[0].height,
          type,
          ...images.length > 1 ? { images } : {}
        };
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/icns.js
function readImageHeader(input, imageOffset) {
  const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET;
  return [
    toUTF8String(input, imageOffset, imageLengthOffset),
    readUInt32BE(input, imageLengthOffset)
  ];
}
function getImageSize2(type) {
  const size = ICON_TYPE_SIZE[type];
  return { width: size, height: size, type };
}
var SIZE_HEADER2, FILE_LENGTH_OFFSET, ENTRY_LENGTH_OFFSET, ICON_TYPE_SIZE, ICNS;
var init_icns = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/icns.js"() {
    init_utils2();
    SIZE_HEADER2 = 4 + 4;
    FILE_LENGTH_OFFSET = 4;
    ENTRY_LENGTH_OFFSET = 4;
    ICON_TYPE_SIZE = {
      ICON: 32,
      "ICN#": 32,
      // m => 16 x 16
      "icm#": 16,
      icm4: 16,
      icm8: 16,
      // s => 16 x 16
      "ics#": 16,
      ics4: 16,
      ics8: 16,
      is32: 16,
      s8mk: 16,
      icp4: 16,
      // l => 32 x 32
      icl4: 32,
      icl8: 32,
      il32: 32,
      l8mk: 32,
      icp5: 32,
      ic11: 32,
      // h => 48 x 48
      ich4: 48,
      ich8: 48,
      ih32: 48,
      h8mk: 48,
      // . => 64 x 64
      icp6: 64,
      ic12: 32,
      // t => 128 x 128
      it32: 128,
      t8mk: 128,
      ic07: 128,
      // . => 256 x 256
      ic08: 256,
      ic13: 256,
      // . => 512 x 512
      ic09: 512,
      ic14: 512,
      // . => 1024 x 1024
      ic10: 1024
    };
    ICNS = {
      validate: (input) => toUTF8String(input, 0, 4) === "icns",
      calculate(input) {
        const inputLength = input.length;
        const fileLength = readUInt32BE(input, FILE_LENGTH_OFFSET);
        let imageOffset = SIZE_HEADER2;
        const images = [];
        while (imageOffset < fileLength && imageOffset < inputLength) {
          const imageHeader = readImageHeader(input, imageOffset);
          const imageSize = getImageSize2(imageHeader[0]);
          images.push(imageSize);
          imageOffset += imageHeader[1];
        }
        if (images.length === 0) {
          throw new TypeError("Invalid ICNS, no sizes found");
        }
        return {
          width: images[0].width,
          height: images[0].height,
          ...images.length > 1 ? { images } : {}
        };
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/j2c.js
var J2C;
var init_j2c = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/j2c.js"() {
    init_utils2();
    J2C = {
      // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
      validate: (input) => readUInt32BE(input, 0) === 4283432785,
      calculate: (input) => ({
        height: readUInt32BE(input, 12),
        width: readUInt32BE(input, 8)
      })
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jp2.js
var JP2;
var init_jp2 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jp2.js"() {
    init_utils2();
    JP2 = {
      validate(input) {
        const boxType = toUTF8String(input, 4, 8);
        if (boxType !== "jP  ") return false;
        const ftypBox = findBox(input, "ftyp", 0);
        if (!ftypBox) return false;
        const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
        return brand === "jp2 ";
      },
      calculate(input) {
        const jp2hBox = findBox(input, "jp2h", 0);
        const ihdrBox = jp2hBox && findBox(input, "ihdr", jp2hBox.offset + 8);
        if (ihdrBox) {
          return {
            height: readUInt32BE(input, ihdrBox.offset + 8),
            width: readUInt32BE(input, ihdrBox.offset + 12)
          };
        }
        throw new TypeError("Unsupported JPEG 2000 format");
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jpg.js
function isEXIF(input) {
  return toHexString(input, 2, 6) === EXIF_MARKER;
}
function extractSize(input, index) {
  return {
    height: readUInt16BE(input, index),
    width: readUInt16BE(input, index + 2)
  };
}
function extractOrientation(exifBlock, isBigEndian) {
  const idfOffset = 8;
  const offset = EXIF_HEADER_BYTES + idfOffset;
  const idfDirectoryEntries = readUInt(exifBlock, 16, offset, isBigEndian);
  for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
    const start = offset + NUM_DIRECTORY_ENTRIES_BYTES + directoryEntryNumber * IDF_ENTRY_BYTES;
    const end = start + IDF_ENTRY_BYTES;
    if (start > exifBlock.length) {
      return;
    }
    const block = exifBlock.slice(start, end);
    const tagNumber = readUInt(block, 16, 0, isBigEndian);
    if (tagNumber === 274) {
      const dataFormat = readUInt(block, 16, 2, isBigEndian);
      if (dataFormat !== 3) {
        return;
      }
      const numberOfComponents = readUInt(block, 32, 4, isBigEndian);
      if (numberOfComponents !== 1) {
        return;
      }
      return readUInt(block, 16, 8, isBigEndian);
    }
  }
}
function validateExifBlock(input, index) {
  const exifBlock = input.slice(APP1_DATA_SIZE_BYTES, index);
  const byteAlign = toHexString(
    exifBlock,
    EXIF_HEADER_BYTES,
    EXIF_HEADER_BYTES + TIFF_BYTE_ALIGN_BYTES
  );
  const isBigEndian = byteAlign === BIG_ENDIAN_BYTE_ALIGN;
  const isLittleEndian = byteAlign === LITTLE_ENDIAN_BYTE_ALIGN;
  if (isBigEndian || isLittleEndian) {
    return extractOrientation(exifBlock, isBigEndian);
  }
}
function validateInput(input, index) {
  if (index > input.length) {
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  }
}
var EXIF_MARKER, APP1_DATA_SIZE_BYTES, EXIF_HEADER_BYTES, TIFF_BYTE_ALIGN_BYTES, BIG_ENDIAN_BYTE_ALIGN, LITTLE_ENDIAN_BYTE_ALIGN, IDF_ENTRY_BYTES, NUM_DIRECTORY_ENTRIES_BYTES, JPG;
var init_jpg = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jpg.js"() {
    init_utils2();
    EXIF_MARKER = "45786966";
    APP1_DATA_SIZE_BYTES = 2;
    EXIF_HEADER_BYTES = 6;
    TIFF_BYTE_ALIGN_BYTES = 2;
    BIG_ENDIAN_BYTE_ALIGN = "4d4d";
    LITTLE_ENDIAN_BYTE_ALIGN = "4949";
    IDF_ENTRY_BYTES = 12;
    NUM_DIRECTORY_ENTRIES_BYTES = 2;
    JPG = {
      validate: (input) => toHexString(input, 0, 2) === "ffd8",
      calculate(_input) {
        let input = _input.slice(4);
        let orientation;
        let next;
        while (input.length) {
          const i2 = readUInt16BE(input, 0);
          validateInput(input, i2);
          if (input[i2] !== 255) {
            input = input.slice(1);
            continue;
          }
          if (isEXIF(input)) {
            orientation = validateExifBlock(input, i2);
          }
          next = input[i2 + 1];
          if (next === 192 || next === 193 || next === 194) {
            const size = extractSize(input, i2 + 5);
            if (!orientation) {
              return size;
            }
            return {
              height: size.height,
              orientation,
              width: size.width
            };
          }
          input = input.slice(i2 + 2);
        }
        throw new TypeError("Invalid JPG, no size found");
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/utils/bit-reader.js
var BitReader;
var init_bit_reader = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/utils/bit-reader.js"() {
    BitReader = class {
      constructor(input, endianness) {
        this.input = input;
        this.endianness = endianness;
      }
      // Skip the first 16 bits (2 bytes) of signature
      byteOffset = 2;
      bitOffset = 0;
      /** Reads a specified number of bits, and move the offset */
      getBits(length = 1) {
        let result = 0;
        let bitsRead = 0;
        while (bitsRead < length) {
          if (this.byteOffset >= this.input.length) {
            throw new Error("Reached end of input");
          }
          const currentByte = this.input[this.byteOffset];
          const bitsLeft = 8 - this.bitOffset;
          const bitsToRead = Math.min(length - bitsRead, bitsLeft);
          if (this.endianness === "little-endian") {
            const mask = (1 << bitsToRead) - 1;
            const bits = currentByte >> this.bitOffset & mask;
            result |= bits << bitsRead;
          } else {
            const mask = (1 << bitsToRead) - 1 << 8 - this.bitOffset - bitsToRead;
            const bits = (currentByte & mask) >> 8 - this.bitOffset - bitsToRead;
            result = result << bitsToRead | bits;
          }
          bitsRead += bitsToRead;
          this.bitOffset += bitsToRead;
          if (this.bitOffset === 8) {
            this.byteOffset++;
            this.bitOffset = 0;
          }
        }
        return result;
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jxl-stream.js
function calculateImageDimension(reader, isSmallImage) {
  if (isSmallImage) {
    return 8 * (1 + reader.getBits(5));
  }
  const sizeClass = reader.getBits(2);
  const extraBits = [9, 13, 18, 30][sizeClass];
  return 1 + reader.getBits(extraBits);
}
function calculateImageWidth(reader, isSmallImage, widthMode, height) {
  if (isSmallImage && widthMode === 0) {
    return 8 * (1 + reader.getBits(5));
  }
  if (widthMode === 0) {
    return calculateImageDimension(reader, false);
  }
  const aspectRatios = [1, 1.2, 4 / 3, 1.5, 16 / 9, 5 / 4, 2];
  return Math.floor(height * aspectRatios[widthMode - 1]);
}
var JXLStream;
var init_jxl_stream = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jxl-stream.js"() {
    init_bit_reader();
    init_utils2();
    JXLStream = {
      validate: (input) => {
        return toHexString(input, 0, 2) === "ff0a";
      },
      calculate(input) {
        const reader = new BitReader(input, "little-endian");
        const isSmallImage = reader.getBits(1) === 1;
        const height = calculateImageDimension(reader, isSmallImage);
        const widthMode = reader.getBits(3);
        const width = calculateImageWidth(reader, isSmallImage, widthMode, height);
        return { width, height };
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jxl.js
function extractCodestream(input) {
  const jxlcBox = findBox(input, "jxlc", 0);
  if (jxlcBox) {
    return input.slice(jxlcBox.offset + 8, jxlcBox.offset + jxlcBox.size);
  }
  const partialStreams = extractPartialStreams(input);
  if (partialStreams.length > 0) {
    return concatenateCodestreams(partialStreams);
  }
  return void 0;
}
function extractPartialStreams(input) {
  const partialStreams = [];
  let offset = 0;
  while (offset < input.length) {
    const jxlpBox = findBox(input, "jxlp", offset);
    if (!jxlpBox) break;
    partialStreams.push(
      input.slice(jxlpBox.offset + 12, jxlpBox.offset + jxlpBox.size)
    );
    offset = jxlpBox.offset + jxlpBox.size;
  }
  return partialStreams;
}
function concatenateCodestreams(partialCodestreams) {
  const totalLength = partialCodestreams.reduce(
    (acc, curr) => acc + curr.length,
    0
  );
  const codestream = new Uint8Array(totalLength);
  let position = 0;
  for (const partial of partialCodestreams) {
    codestream.set(partial, position);
    position += partial.length;
  }
  return codestream;
}
var JXL;
var init_jxl = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/jxl.js"() {
    init_jxl_stream();
    init_utils2();
    JXL = {
      validate: (input) => {
        const boxType = toUTF8String(input, 4, 8);
        if (boxType !== "JXL ") return false;
        const ftypBox = findBox(input, "ftyp", 0);
        if (!ftypBox) return false;
        const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
        return brand === "jxl ";
      },
      calculate(input) {
        const codestream = extractCodestream(input);
        if (codestream) return JXLStream.calculate(codestream);
        throw new Error("No codestream found in JXL container");
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/ktx.js
var KTX;
var init_ktx = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/ktx.js"() {
    init_utils2();
    KTX = {
      validate: (input) => {
        const signature = toUTF8String(input, 1, 7);
        return ["KTX 11", "KTX 20"].includes(signature);
      },
      calculate: (input) => {
        const type = input[5] === 49 ? "ktx" : "ktx2";
        const offset = type === "ktx" ? 36 : 20;
        return {
          height: readUInt32LE(input, offset + 4),
          width: readUInt32LE(input, offset),
          type
        };
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/png.js
var pngSignature, pngImageHeaderChunkName, pngFriedChunkName, PNG;
var init_png = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/png.js"() {
    init_utils2();
    pngSignature = "PNG\r\n\n";
    pngImageHeaderChunkName = "IHDR";
    pngFriedChunkName = "CgBI";
    PNG = {
      validate(input) {
        if (pngSignature === toUTF8String(input, 1, 8)) {
          let chunkName = toUTF8String(input, 12, 16);
          if (chunkName === pngFriedChunkName) {
            chunkName = toUTF8String(input, 28, 32);
          }
          if (chunkName !== pngImageHeaderChunkName) {
            throw new TypeError("Invalid PNG");
          }
          return true;
        }
        return false;
      },
      calculate(input) {
        if (toUTF8String(input, 12, 16) === pngFriedChunkName) {
          return {
            height: readUInt32BE(input, 36),
            width: readUInt32BE(input, 32)
          };
        }
        return {
          height: readUInt32BE(input, 20),
          width: readUInt32BE(input, 16)
        };
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/pnm.js
var PNMTypes, handlers, PNM;
var init_pnm = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/pnm.js"() {
    init_utils2();
    PNMTypes = {
      P1: "pbm/ascii",
      P2: "pgm/ascii",
      P3: "ppm/ascii",
      P4: "pbm",
      P5: "pgm",
      P6: "ppm",
      P7: "pam",
      PF: "pfm"
    };
    handlers = {
      default: (lines) => {
        let dimensions = [];
        while (lines.length > 0) {
          const line = lines.shift();
          if (line[0] === "#") {
            continue;
          }
          dimensions = line.split(" ");
          break;
        }
        if (dimensions.length === 2) {
          return {
            height: Number.parseInt(dimensions[1], 10),
            width: Number.parseInt(dimensions[0], 10)
          };
        }
        throw new TypeError("Invalid PNM");
      },
      pam: (lines) => {
        const size = {};
        while (lines.length > 0) {
          const line = lines.shift();
          if (line.length > 16 || line.charCodeAt(0) > 128) {
            continue;
          }
          const [key, value] = line.split(" ");
          if (key && value) {
            size[key.toLowerCase()] = Number.parseInt(value, 10);
          }
          if (size.height && size.width) {
            break;
          }
        }
        if (size.height && size.width) {
          return {
            height: size.height,
            width: size.width
          };
        }
        throw new TypeError("Invalid PAM");
      }
    };
    PNM = {
      validate: (input) => toUTF8String(input, 0, 2) in PNMTypes,
      calculate(input) {
        const signature = toUTF8String(input, 0, 2);
        const type = PNMTypes[signature];
        const lines = toUTF8String(input, 3).split(/[\r\n]+/);
        const handler = handlers[type] || handlers.default;
        return handler(lines);
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/psd.js
var PSD;
var init_psd = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/psd.js"() {
    init_utils2();
    PSD = {
      validate: (input) => toUTF8String(input, 0, 4) === "8BPS",
      calculate: (input) => ({
        height: readUInt32BE(input, 14),
        width: readUInt32BE(input, 18)
      })
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/svg.js
function parseLength(len) {
  const m2 = unitsReg.exec(len);
  if (!m2) {
    return void 0;
  }
  return Math.round(Number(m2[1]) * (units[m2[2]] || 1));
}
function parseViewbox(viewbox) {
  const bounds = viewbox.split(" ");
  return {
    height: parseLength(bounds[3]),
    width: parseLength(bounds[2])
  };
}
function parseAttributes(root) {
  const width = extractorRegExps.width.exec(root);
  const height = extractorRegExps.height.exec(root);
  const viewbox = extractorRegExps.viewbox.exec(root);
  return {
    height: height && parseLength(height[2]),
    viewbox: viewbox && parseViewbox(viewbox[2]),
    width: width && parseLength(width[2])
  };
}
function calculateByDimensions(attrs) {
  return {
    height: attrs.height,
    width: attrs.width
  };
}
function calculateByViewbox(attrs, viewbox) {
  const ratio = viewbox.width / viewbox.height;
  if (attrs.width) {
    return {
      height: Math.floor(attrs.width / ratio),
      width: attrs.width
    };
  }
  if (attrs.height) {
    return {
      height: attrs.height,
      width: Math.floor(attrs.height * ratio)
    };
  }
  return {
    height: viewbox.height,
    width: viewbox.width
  };
}
var svgReg, extractorRegExps, INCH_CM, units, unitsReg, SVG;
var init_svg = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/svg.js"() {
    init_utils2();
    svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/;
    extractorRegExps = {
      height: /\sheight=(['"])([^%]+?)\1/,
      root: svgReg,
      viewbox: /\sviewBox=(['"])(.+?)\1/i,
      width: /\swidth=(['"])([^%]+?)\1/
    };
    INCH_CM = 2.54;
    units = {
      in: 96,
      cm: 96 / INCH_CM,
      em: 16,
      ex: 8,
      m: 96 / INCH_CM * 100,
      mm: 96 / INCH_CM / 10,
      pc: 96 / 72 / 12,
      pt: 96 / 72,
      px: 1
    };
    unitsReg = new RegExp(
      `^([0-9.]+(?:e\\d+)?)(${Object.keys(units).join("|")})?$`
    );
    SVG = {
      // Scan only the first kilo-byte to speed up the check on larger files
      validate: (input) => svgReg.test(toUTF8String(input, 0, 1e3)),
      calculate(input) {
        const root = extractorRegExps.root.exec(toUTF8String(input));
        if (root) {
          const attrs = parseAttributes(root[0]);
          if (attrs.width && attrs.height) {
            return calculateByDimensions(attrs);
          }
          if (attrs.viewbox) {
            return calculateByViewbox(attrs, attrs.viewbox);
          }
        }
        throw new TypeError("Invalid SVG");
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/tga.js
var TGA;
var init_tga = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/tga.js"() {
    init_utils2();
    TGA = {
      validate(input) {
        return readUInt16LE(input, 0) === 0 && readUInt16LE(input, 4) === 0;
      },
      calculate(input) {
        return {
          height: readUInt16LE(input, 14),
          width: readUInt16LE(input, 12)
        };
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/tiff.js
function readIFD(input, { isBigEndian, isBigTiff }) {
  const ifdOffset = isBigTiff ? Number(readUInt64(input, 8, isBigEndian)) : readUInt(input, 32, 4, isBigEndian);
  const entryCountSize = isBigTiff ? CONSTANTS.COUNT_SIZE.BIG : CONSTANTS.COUNT_SIZE.STANDARD;
  return input.slice(ifdOffset + entryCountSize);
}
function readTagValue(input, type, offset, isBigEndian) {
  switch (type) {
    case CONSTANTS.TYPE.SHORT:
      return readUInt(input, 16, offset, isBigEndian);
    case CONSTANTS.TYPE.LONG:
      return readUInt(input, 32, offset, isBigEndian);
    case CONSTANTS.TYPE.LONG8: {
      const value = Number(readUInt64(input, offset, isBigEndian));
      if (value > Number.MAX_SAFE_INTEGER) {
        throw new TypeError("Value too large");
      }
      return value;
    }
    default:
      return 0;
  }
}
function nextTag(input, isBigTiff) {
  const entrySize = isBigTiff ? CONSTANTS.ENTRY_SIZE.BIG : CONSTANTS.ENTRY_SIZE.STANDARD;
  if (input.length > entrySize) {
    return input.slice(entrySize);
  }
}
function extractTags(input, { isBigEndian, isBigTiff }) {
  const tags = {};
  let temp = input;
  while (temp?.length) {
    const code = readUInt(temp, 16, 0, isBigEndian);
    const type = readUInt(temp, 16, 2, isBigEndian);
    const length = isBigTiff ? Number(readUInt64(temp, 4, isBigEndian)) : readUInt(temp, 32, 4, isBigEndian);
    if (code === 0) break;
    if (length === 1 && (type === CONSTANTS.TYPE.SHORT || type === CONSTANTS.TYPE.LONG || isBigTiff && type === CONSTANTS.TYPE.LONG8)) {
      const valueOffset = isBigTiff ? 12 : 8;
      tags[code] = readTagValue(temp, type, valueOffset, isBigEndian);
    }
    temp = nextTag(temp, isBigTiff);
  }
  return tags;
}
function determineFormat(input) {
  const signature = toUTF8String(input, 0, 2);
  const version3 = readUInt(input, 16, 2, signature === "MM");
  return {
    isBigEndian: signature === "MM",
    isBigTiff: version3 === 43
  };
}
function validateBigTIFFHeader(input, isBigEndian) {
  const byteSize = readUInt(input, 16, 4, isBigEndian);
  const reserved = readUInt(input, 16, 6, isBigEndian);
  if (byteSize !== 8 || reserved !== 0) {
    throw new TypeError("Invalid BigTIFF header");
  }
}
var CONSTANTS, signatures, TIFF;
var init_tiff = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/tiff.js"() {
    init_utils2();
    CONSTANTS = {
      TAG: {
        WIDTH: 256,
        HEIGHT: 257,
        COMPRESSION: 259
      },
      TYPE: {
        SHORT: 3,
        LONG: 4,
        LONG8: 16
      },
      ENTRY_SIZE: {
        STANDARD: 12,
        BIG: 20
      },
      COUNT_SIZE: {
        STANDARD: 2,
        BIG: 8
      }
    };
    signatures = /* @__PURE__ */ new Set([
      "49492a00",
      // Little Endian
      "4d4d002a",
      // Big Endian
      "49492b00",
      // BigTIFF Little Endian
      "4d4d002b"
      // BigTIFF Big Endian
    ]);
    TIFF = {
      validate: (input) => {
        const signature = toHexString(input, 0, 4);
        return signatures.has(signature);
      },
      calculate(input) {
        const format2 = determineFormat(input);
        if (format2.isBigTiff) {
          validateBigTIFFHeader(input, format2.isBigEndian);
        }
        const ifdBuffer = readIFD(input, format2);
        const tags = extractTags(ifdBuffer, format2);
        const info2 = {
          height: tags[CONSTANTS.TAG.HEIGHT],
          width: tags[CONSTANTS.TAG.WIDTH],
          type: format2.isBigTiff ? "bigtiff" : "tiff"
        };
        if (tags[CONSTANTS.TAG.COMPRESSION]) {
          info2.compression = tags[CONSTANTS.TAG.COMPRESSION];
        }
        if (!info2.width || !info2.height) {
          throw new TypeError("Invalid Tiff. Missing tags");
        }
        return info2;
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/webp.js
function calculateExtended(input) {
  return {
    height: 1 + readUInt24LE(input, 7),
    width: 1 + readUInt24LE(input, 4)
  };
}
function calculateLossless(input) {
  return {
    height: 1 + ((input[4] & 15) << 10 | input[3] << 2 | (input[2] & 192) >> 6),
    width: 1 + ((input[2] & 63) << 8 | input[1])
  };
}
function calculateLossy(input) {
  return {
    height: readInt16LE(input, 8) & 16383,
    width: readInt16LE(input, 6) & 16383
  };
}
var WEBP;
var init_webp = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/webp.js"() {
    init_utils2();
    WEBP = {
      validate(input) {
        const riffHeader = "RIFF" === toUTF8String(input, 0, 4);
        const webpHeader = "WEBP" === toUTF8String(input, 8, 12);
        const vp8Header = "VP8" === toUTF8String(input, 12, 15);
        return riffHeader && webpHeader && vp8Header;
      },
      calculate(_input) {
        const chunkHeader = toUTF8String(_input, 12, 16);
        const input = _input.slice(20, 30);
        if (chunkHeader === "VP8X") {
          const extendedHeader = input[0];
          const validStart = (extendedHeader & 192) === 0;
          const validEnd = (extendedHeader & 1) === 0;
          if (validStart && validEnd) {
            return calculateExtended(input);
          }
          throw new TypeError("Invalid WebP");
        }
        if (chunkHeader === "VP8 " && input[0] !== 47) {
          return calculateLossy(input);
        }
        const signature = toHexString(input, 3, 6);
        if (chunkHeader === "VP8L" && signature !== "9d012a") {
          return calculateLossless(input);
        }
        throw new TypeError("Invalid WebP");
      }
    };
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/index.js
var typeHandlers, types2;
var init_types3 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/types/index.js"() {
    init_bmp();
    init_cur();
    init_dds();
    init_gif();
    init_heif();
    init_icns();
    init_ico();
    init_j2c();
    init_jp2();
    init_jpg();
    init_jxl();
    init_jxl_stream();
    init_ktx();
    init_png();
    init_pnm();
    init_psd();
    init_svg();
    init_tga();
    init_tiff();
    init_webp();
    typeHandlers = /* @__PURE__ */ new Map([
      ["bmp", BMP],
      ["cur", CUR],
      ["dds", DDS],
      ["gif", GIF],
      ["heif", HEIF],
      ["icns", ICNS],
      ["ico", ICO],
      ["j2c", J2C],
      ["jp2", JP2],
      ["jpg", JPG],
      ["jxl", JXL],
      ["jxl-stream", JXLStream],
      ["ktx", KTX],
      ["png", PNG],
      ["pnm", PNM],
      ["psd", PSD],
      ["svg", SVG],
      ["tga", TGA],
      ["tiff", TIFF],
      ["webp", WEBP]
    ]);
    types2 = Array.from(typeHandlers.keys());
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/detector.js
var init_detector = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/detector.js"() {
    init_types3();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/lookup.js
var init_lookup = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/vendor/image-size/lookup.js"() {
    init_types3();
    init_detector();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/metadata.js
var init_metadata = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/metadata.js"() {
    init_errors3();
    init_lookup();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/remoteProbe.js
var init_remoteProbe = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/remoteProbe.js"() {
    init_remote();
    init_errors3();
    init_metadata();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/url.js
var init_url = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/url.js"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/internal.js
var init_internal = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/internal.js"() {
    init_path();
    init_remote();
    init_errors3();
    init_consts();
    init_layout();
    init_service();
    init_types2();
    init_imageAttributes();
    init_imageKind();
    init_remoteProbe();
    init_url();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/index.js
var init_assets = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/index.js"() {
    init_internal();
    init_service();
    init_types2();
  }
});

// node-shim:node:fs/promises
var init_promises = __esm({
  "node-shim:node:fs/promises"() {
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/node/emitAsset.js
var init_emitAsset = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/node/emitAsset.js"() {
    init_promises();
    init_node_path();
    init_node_url();
    init_encryption();
    init_path2();
    init_metadata();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/queryParams.js
var init_queryParams = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/queryParams.js"() {
  }
});

// examples/testapp-ssr/node_modules/deterministic-object-hash/dist/isPlainObject.js
var require_isPlainObject = __commonJS({
  "examples/testapp-ssr/node_modules/deterministic-object-hash/dist/isPlainObject.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var objConstructorString = Function.prototype.toString.call(Object);
    function isPlainObject(value) {
      if (typeof value !== "object" || value === null || Object.prototype.toString.call(value) !== "[object Object]") {
        return false;
      }
      const proto = Object.getPrototypeOf(value);
      if (proto === null) {
        return true;
      }
      if (!Object.prototype.hasOwnProperty.call(proto, "constructor")) {
        return false;
      }
      return typeof proto.constructor === "function" && proto.constructor instanceof proto.constructor && Function.prototype.toString.call(proto.constructor) === objConstructorString;
    }
    exports.default = isPlainObject;
  }
});

// examples/testapp-ssr/node_modules/base-64/base64.js
var require_base64 = __commonJS({
  "examples/testapp-ssr/node_modules/base-64/base64.js"(exports, module) {
    (function(root) {
      var freeExports = typeof exports == "object" && exports;
      var freeModule = typeof module == "object" && module && module.exports == freeExports && module;
      var freeGlobal = typeof global == "object" && global;
      if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
        root = freeGlobal;
      }
      var InvalidCharacterError = function(message) {
        this.message = message;
      };
      InvalidCharacterError.prototype = new Error();
      InvalidCharacterError.prototype.name = "InvalidCharacterError";
      var error2 = function(message) {
        throw new InvalidCharacterError(message);
      };
      var TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;
      var decode2 = function(input) {
        input = String(input).replace(REGEX_SPACE_CHARACTERS, "");
        var length = input.length;
        if (length % 4 == 0) {
          input = input.replace(/==?$/, "");
          length = input.length;
        }
        if (length % 4 == 1 || // http://whatwg.org/C#alphanumeric-ascii-characters
        /[^+a-zA-Z0-9/]/.test(input)) {
          error2(
            "Invalid character: the string to be decoded is not correctly encoded."
          );
        }
        var bitCounter = 0;
        var bitStorage;
        var buffer2;
        var output = "";
        var position = -1;
        while (++position < length) {
          buffer2 = TABLE.indexOf(input.charAt(position));
          bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer2 : buffer2;
          if (bitCounter++ % 4) {
            output += String.fromCharCode(
              255 & bitStorage >> (-2 * bitCounter & 6)
            );
          }
        }
        return output;
      };
      var encode2 = function(input) {
        input = String(input);
        if (/[^\0-\xFF]/.test(input)) {
          error2(
            "The string to be encoded contains characters outside of the Latin1 range."
          );
        }
        var padding = input.length % 3;
        var output = "";
        var position = -1;
        var a2;
        var b;
        var c2;
        var buffer2;
        var length = input.length - padding;
        while (++position < length) {
          a2 = input.charCodeAt(position) << 16;
          b = input.charCodeAt(++position) << 8;
          c2 = input.charCodeAt(++position);
          buffer2 = a2 + b + c2;
          output += TABLE.charAt(buffer2 >> 18 & 63) + TABLE.charAt(buffer2 >> 12 & 63) + TABLE.charAt(buffer2 >> 6 & 63) + TABLE.charAt(buffer2 & 63);
        }
        if (padding == 2) {
          a2 = input.charCodeAt(position) << 8;
          b = input.charCodeAt(++position);
          buffer2 = a2 + b;
          output += TABLE.charAt(buffer2 >> 10) + TABLE.charAt(buffer2 >> 4 & 63) + TABLE.charAt(buffer2 << 2 & 63) + "=";
        } else if (padding == 1) {
          buffer2 = input.charCodeAt(position);
          output += TABLE.charAt(buffer2 >> 2) + TABLE.charAt(buffer2 << 4 & 63) + "==";
        }
        return output;
      };
      var base64 = {
        "encode": encode2,
        "decode": decode2,
        "version": "1.0.0"
      };
      if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
        define(function() {
          return base64;
        });
      } else if (freeExports && !freeExports.nodeType) {
        if (freeModule) {
          freeModule.exports = base64;
        } else {
          for (var key in base64) {
            base64.hasOwnProperty(key) && (freeExports[key] = base64[key]);
          }
        }
      } else {
        root.base64 = base64;
      }
    })(exports);
  }
});

// examples/testapp-ssr/node_modules/deterministic-object-hash/dist/encoders.js
var require_encoders = __commonJS({
  "examples/testapp-ssr/node_modules/deterministic-object-hash/dist/encoders.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.encoders = void 0;
    var base_64_1 = require_base64();
    var binary2 = (input) => {
      let binary3 = "";
      const bytes = new Uint8Array(input);
      const len = bytes.byteLength;
      for (let i2 = 0; i2 < len; i2++) {
        const buffer2 = bytes[i2];
        if (buffer2)
          binary3 += String.fromCharCode(buffer2);
      }
      return binary3;
    };
    var hex = (input) => [...new Uint8Array(input)].map((b) => b.toString(16).padStart(2, "0")).join("");
    var base64 = (input) => (0, base_64_1.encode)(binary2(input));
    var base64url = (input) => base64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    exports.encoders = {
      base64,
      base64url,
      hex,
      binary: binary2
    };
  }
});

// examples/testapp-ssr/node_modules/deterministic-object-hash/dist/index.js
var require_dist2 = __commonJS({
  "examples/testapp-ssr/node_modules/deterministic-object-hash/dist/index.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod2) {
      return mod2 && mod2.__esModule ? mod2 : { "default": mod2 };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deterministicString = void 0;
    var node_crypto_1 = (init_node_crypto(), __toCommonJS(node_crypto_exports));
    var isPlainObject_1 = __importDefault(require_isPlainObject());
    var encoders_1 = require_encoders();
    async function deterministicHash(input, algorithm = "SHA-1", output = "hex") {
      const encoder3 = new TextEncoder();
      const data = encoder3.encode(deterministicString2(input));
      const hash = await node_crypto_1.webcrypto.subtle.digest(algorithm, data);
      return encoders_1.encoders[output](hash);
    }
    exports.default = deterministicHash;
    function deterministicString2(input) {
      if (typeof input === "string") {
        return JSON.stringify(input);
      } else if (typeof input === "symbol" || typeof input === "function") {
        return input.toString();
      } else if (typeof input === "bigint") {
        return `${input}n`;
      } else if (input === globalThis || input === void 0 || input === null || typeof input === "boolean" || typeof input === "number" || typeof input !== "object") {
        return `${input}`;
      } else if (input instanceof Date) {
        return `(${input.constructor.name}:${input.getTime()})`;
      } else if (input instanceof RegExp || input instanceof Error || input instanceof WeakMap || input instanceof WeakSet) {
        return `(${input.constructor.name}:${input.toString()})`;
      } else if (input instanceof Set) {
        let ret2 = `(${input.constructor.name}:[`;
        for (const val of input.values()) {
          ret2 += `${deterministicString2(val)},`;
        }
        ret2 += "])";
        return ret2;
      } else if (Array.isArray(input) || input instanceof Int8Array || input instanceof Uint8Array || input instanceof Uint8ClampedArray || input instanceof Int16Array || input instanceof Uint16Array || input instanceof Int32Array || input instanceof Uint32Array || input instanceof Float32Array || input instanceof Float64Array || input instanceof BigInt64Array || input instanceof BigUint64Array) {
        let ret2 = `(${input.constructor.name}:[`;
        for (const [k2, v2] of input.entries()) {
          ret2 += `(${k2}:${deterministicString2(v2)}),`;
        }
        ret2 += "])";
        return ret2;
      } else if (input instanceof ArrayBuffer || input instanceof SharedArrayBuffer) {
        if (input.byteLength % 8 === 0) {
          return deterministicString2(new BigUint64Array(input));
        } else if (input.byteLength % 4 === 0) {
          return deterministicString2(new Uint32Array(input));
        } else if (input.byteLength % 2 === 0) {
          return deterministicString2(new Uint16Array(input));
        } else {
          let ret2 = "(";
          for (let i2 = 0; i2 < input.byteLength; i2++) {
            ret2 += `${deterministicString2(new Uint8Array(input.slice(i2, i2 + 1)))},`;
          }
          ret2 += ")";
          return ret2;
        }
      } else if (input instanceof Map || (0, isPlainObject_1.default)(input)) {
        const sortable = [];
        const entries = input instanceof Map ? input.entries() : Object.entries(input);
        for (const [k2, v2] of entries) {
          sortable.push([deterministicString2(k2), deterministicString2(v2)]);
        }
        if (!(input instanceof Map)) {
          const symbolKeys2 = Object.getOwnPropertySymbols(input);
          for (let i2 = 0; i2 < symbolKeys2.length; i2++) {
            sortable.push([
              deterministicString2(symbolKeys2[i2]),
              deterministicString2(
                //have to ignore because `noImplicitAny` is `true` but this is implicitly `any`
                //@ts-ignore
                input[symbolKeys2[i2]]
              )
            ]);
          }
        }
        sortable.sort(([a2], [b]) => a2.localeCompare(b));
        let ret2 = `(${input.constructor.name}:[`;
        for (const [k2, v2] of sortable) {
          ret2 += `(${k2}:${v2}),`;
        }
        ret2 += "])";
        return ret2;
      }
      const allEntries = [];
      for (const k2 in input) {
        allEntries.push([
          deterministicString2(k2),
          deterministicString2(
            //have to ignore because `noImplicitAny` is `true` but this is implicitly `any`
            //@ts-ignore
            input[k2]
          )
        ]);
      }
      const symbolKeys = Object.getOwnPropertySymbols(input);
      for (let i2 = 0; i2 < symbolKeys.length; i2++) {
        allEntries.push([
          deterministicString2(symbolKeys[i2]),
          deterministicString2(
            //have to ignore because `noImplicitAny` is `true` but this is implicitly `any`
            //@ts-ignore
            input[symbolKeys[i2]]
          )
        ]);
      }
      allEntries.sort(([a2], [b]) => a2.localeCompare(b));
      let ret = `(${input.constructor.name}:[`;
      for (const [k2, v2] of allEntries) {
        ret += `(${k2}:${v2}),`;
      }
      ret += "])";
      return ret;
    }
    exports.deterministicString = deterministicString2;
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/transformToPath.js
var import_deterministic_object_hash;
var init_transformToPath = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/transformToPath.js"() {
    init_node_path();
    import_deterministic_object_hash = __toESM(require_dist2(), 1);
    init_path2();
    init_shorthash();
    init_imageKind();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/index.js
var init_utils3 = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/assets/utils/index.js"() {
    init_remote();
    init_imageKind();
    init_metadata();
    init_emitAsset();
    init_queryParams();
    init_remoteProbe();
    init_transformToPath();
  }
});

// examples/testapp-ssr/node_modules/astro/dist/core/errors/userError.js
var init_userError = __esm({
  "examples/testapp-ssr/node_modules/astro/dist/core/errors/userError.js"() {
    init_errors2();
  }
});

// examples/testapp-ssr/node_modules/@astrojs/netlify/dist/image-service.js
var image_service_exports = {};
__export(image_service_exports, {
  default: () => image_service_default
});
function removeLeadingForwardSlash2(path) {
  return path.startsWith("/") ? path.substring(1) : path;
}
var SUPPORTED_FORMATS, QUALITY_NAMES, service, image_service_default;
var init_image_service = __esm({
  "examples/testapp-ssr/node_modules/@astrojs/netlify/dist/image-service.js"() {
    init_assets();
    init_utils3();
    init_userError();
    SUPPORTED_FORMATS = ["avif", "jpg", "png", "webp"];
    QUALITY_NAMES = { low: 25, mid: 50, high: 90, max: 100 };
    service = {
      getURL(options) {
        if (isESMImportedImage(options.src) && options.src.format === "svg") {
          return options.src.src;
        }
        const query = new URLSearchParams();
        const fileSrc = isESMImportedImage(options.src) ? removeLeadingForwardSlash2(options.src.src) : options.src;
        query.set("url", fileSrc);
        if (options.format) query.set("fm", options.format);
        if (options.width) query.set("w", `${options.width}`);
        if (options.height) query.set("h", `${options.height}`);
        if (options.quality) query.set("q", `${options.quality}`);
        return `/.netlify/images?${query}`;
      },
      getHTMLAttributes: baseService.getHTMLAttributes,
      getSrcSet: baseService.getSrcSet,
      validateOptions(options) {
        if (options.format && !SUPPORTED_FORMATS.includes(options.format)) {
          throw new AstroUserError(
            `Unsupported image format "${options.format}"`,
            `Use one of ${SUPPORTED_FORMATS.join(", ")} instead.`
          );
        }
        if (options.quality) {
          options.quality = typeof options.quality === "string" ? QUALITY_NAMES[options.quality] : options.quality;
          if (options.quality < 1 || options.quality > 100) {
            throw new AstroUserError(
              `Invalid quality for picture "${options.src}"`,
              "Quality needs to be between 1 and 100."
            );
          }
        }
        return options;
      }
    };
    image_service_default = service;
  }
});

// examples/testapp-ssr/.netlify/build/pages/_image.astro.mjs
var image_astro_exports = {};
__export(image_astro_exports, {
  page: () => page,
  renderers: () => renderers
});
function isESMImportedImage2(src) {
  return typeof src === "object" || typeof src === "function" && "src" in src;
}
function isRemoteImage2(src) {
  return typeof src === "string";
}
async function resolveSrc2(src) {
  if (typeof src === "object" && "then" in src) {
    const resource = await src;
    return resource.default ?? resource;
  }
  return src;
}
function isLocalService2(service2) {
  if (!service2) {
    return false;
  }
  return "transform" in service2;
}
function isImageMetadata2(src) {
  return src.fsPath && !("fsPath" in src);
}
function addCSSVarsToStyle2(vars, styles) {
  const cssVars = Object.entries(vars).filter(([_, value]) => value !== void 0 && value !== false).map(([key, value]) => `--${key}: ${value};`).join(" ");
  if (!styles) {
    return cssVars;
  }
  const style = typeof styles === "string" ? styles : toStyleString2(styles);
  return `${cssVars} ${style}`;
}
function readUInt2(input, bits, offset = 0, isBigEndian = false) {
  const endian = isBigEndian ? "BE" : "LE";
  const methodName = `readUInt${bits}${endian}`;
  return methods2[methodName](input, offset);
}
function readBox2(input, offset) {
  if (input.length - offset < 4) return;
  const boxSize = readUInt32BE2(input, offset);
  if (input.length - offset < boxSize) return;
  return {
    name: toUTF8String2(input, 4 + offset, 8 + offset),
    offset,
    size: boxSize
  };
}
function findBox2(input, boxName, currentOffset) {
  while (currentOffset < input.length) {
    const box = readBox2(input, currentOffset);
    if (!box) break;
    if (box.name === boxName) return box;
    currentOffset += box.size > 0 ? box.size : 8;
  }
}
function getSizeFromOffset2(input, offset) {
  const value = input[offset];
  return value === 0 ? 256 : value;
}
function getImageSize$1(input, imageIndex) {
  const offset = SIZE_HEADER$1 + imageIndex * SIZE_IMAGE_ENTRY2;
  return {
    height: getSizeFromOffset2(input, offset + 1),
    width: getSizeFromOffset2(input, offset)
  };
}
function detectType2(input, start, end) {
  let hasAvif = false;
  let hasHeic = false;
  let hasHeif = false;
  for (let i2 = start; i2 <= end; i2 += 4) {
    const brand = toUTF8String2(input, i2, i2 + 4);
    if (brand === "avif" || brand === "avis") hasAvif = true;
    else if (brand === "heic" || brand === "heix" || brand === "hevc" || brand === "hevx") hasHeic = true;
    else if (brand === "mif1" || brand === "msf1") hasHeif = true;
  }
  if (hasAvif) return "avif";
  if (hasHeic) return "heic";
  if (hasHeif) return "heif";
}
function readImageHeader2(input, imageOffset) {
  const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET2;
  return [
    toUTF8String2(input, imageOffset, imageLengthOffset),
    readUInt32BE2(input, imageLengthOffset)
  ];
}
function getImageSize3(type) {
  const size = ICON_TYPE_SIZE2[type];
  return { width: size, height: size, type };
}
function isEXIF2(input) {
  return toHexString2(input, 2, 6) === EXIF_MARKER2;
}
function extractSize2(input, index) {
  return {
    height: readUInt16BE2(input, index),
    width: readUInt16BE2(input, index + 2)
  };
}
function extractOrientation2(exifBlock, isBigEndian) {
  const idfOffset = 8;
  const offset = EXIF_HEADER_BYTES2 + idfOffset;
  const idfDirectoryEntries = readUInt2(exifBlock, 16, offset, isBigEndian);
  for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
    const start = offset + NUM_DIRECTORY_ENTRIES_BYTES2 + directoryEntryNumber * IDF_ENTRY_BYTES2;
    const end = start + IDF_ENTRY_BYTES2;
    if (start > exifBlock.length) {
      return;
    }
    const block = exifBlock.slice(start, end);
    const tagNumber = readUInt2(block, 16, 0, isBigEndian);
    if (tagNumber === 274) {
      const dataFormat = readUInt2(block, 16, 2, isBigEndian);
      if (dataFormat !== 3) {
        return;
      }
      const numberOfComponents = readUInt2(block, 32, 4, isBigEndian);
      if (numberOfComponents !== 1) {
        return;
      }
      return readUInt2(block, 16, 8, isBigEndian);
    }
  }
}
function validateExifBlock2(input, index) {
  const exifBlock = input.slice(APP1_DATA_SIZE_BYTES2, index);
  const byteAlign = toHexString2(
    exifBlock,
    EXIF_HEADER_BYTES2,
    EXIF_HEADER_BYTES2 + TIFF_BYTE_ALIGN_BYTES2
  );
  const isBigEndian = byteAlign === BIG_ENDIAN_BYTE_ALIGN2;
  const isLittleEndian = byteAlign === LITTLE_ENDIAN_BYTE_ALIGN2;
  if (isBigEndian || isLittleEndian) {
    return extractOrientation2(exifBlock, isBigEndian);
  }
}
function validateInput2(input, index) {
  if (index > input.length) {
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  }
}
function calculateImageDimension2(reader, isSmallImage) {
  if (isSmallImage) {
    return 8 * (1 + reader.getBits(5));
  }
  const sizeClass = reader.getBits(2);
  const extraBits = [9, 13, 18, 30][sizeClass];
  return 1 + reader.getBits(extraBits);
}
function calculateImageWidth2(reader, isSmallImage, widthMode, height) {
  if (isSmallImage && widthMode === 0) {
    return 8 * (1 + reader.getBits(5));
  }
  if (widthMode === 0) {
    return calculateImageDimension2(reader, false);
  }
  const aspectRatios = [1, 1.2, 4 / 3, 1.5, 16 / 9, 5 / 4, 2];
  return Math.floor(height * aspectRatios[widthMode - 1]);
}
function extractCodestream2(input) {
  const jxlcBox = findBox2(input, "jxlc", 0);
  if (jxlcBox) {
    return input.slice(jxlcBox.offset + 8, jxlcBox.offset + jxlcBox.size);
  }
  const partialStreams = extractPartialStreams2(input);
  if (partialStreams.length > 0) {
    return concatenateCodestreams2(partialStreams);
  }
  return void 0;
}
function extractPartialStreams2(input) {
  const partialStreams = [];
  let offset = 0;
  while (offset < input.length) {
    const jxlpBox = findBox2(input, "jxlp", offset);
    if (!jxlpBox) break;
    partialStreams.push(
      input.slice(jxlpBox.offset + 12, jxlpBox.offset + jxlpBox.size)
    );
    offset = jxlpBox.offset + jxlpBox.size;
  }
  return partialStreams;
}
function concatenateCodestreams2(partialCodestreams) {
  const totalLength = partialCodestreams.reduce(
    (acc, curr) => acc + curr.length,
    0
  );
  const codestream = new Uint8Array(totalLength);
  let position = 0;
  for (const partial of partialCodestreams) {
    codestream.set(partial, position);
    position += partial.length;
  }
  return codestream;
}
function parseLength2(len) {
  const m2 = unitsReg2.exec(len);
  if (!m2) {
    return void 0;
  }
  return Math.round(Number(m2[1]) * (units2[m2[2]] || 1));
}
function parseViewbox2(viewbox) {
  const bounds = viewbox.split(" ");
  return {
    height: parseLength2(bounds[3]),
    width: parseLength2(bounds[2])
  };
}
function parseAttributes2(root) {
  const width = extractorRegExps2.width.exec(root);
  const height = extractorRegExps2.height.exec(root);
  const viewbox = extractorRegExps2.viewbox.exec(root);
  return {
    height: height && parseLength2(height[2]),
    viewbox: viewbox && parseViewbox2(viewbox[2]),
    width: width && parseLength2(width[2])
  };
}
function calculateByDimensions2(attrs) {
  return {
    height: attrs.height,
    width: attrs.width
  };
}
function calculateByViewbox2(attrs, viewbox) {
  const ratio = viewbox.width / viewbox.height;
  if (attrs.width) {
    return {
      height: Math.floor(attrs.width / ratio),
      width: attrs.width
    };
  }
  if (attrs.height) {
    return {
      height: attrs.height,
      width: Math.floor(attrs.height * ratio)
    };
  }
  return {
    height: viewbox.height,
    width: viewbox.width
  };
}
function readIFD2(input, { isBigEndian, isBigTiff }) {
  const ifdOffset = isBigTiff ? Number(readUInt642(input, 8, isBigEndian)) : readUInt2(input, 32, 4, isBigEndian);
  const entryCountSize = isBigTiff ? CONSTANTS2.COUNT_SIZE.BIG : CONSTANTS2.COUNT_SIZE.STANDARD;
  return input.slice(ifdOffset + entryCountSize);
}
function readTagValue2(input, type, offset, isBigEndian) {
  switch (type) {
    case CONSTANTS2.TYPE.SHORT:
      return readUInt2(input, 16, offset, isBigEndian);
    case CONSTANTS2.TYPE.LONG:
      return readUInt2(input, 32, offset, isBigEndian);
    case CONSTANTS2.TYPE.LONG8: {
      const value = Number(readUInt642(input, offset, isBigEndian));
      if (value > Number.MAX_SAFE_INTEGER) {
        throw new TypeError("Value too large");
      }
      return value;
    }
    default:
      return 0;
  }
}
function nextTag2(input, isBigTiff) {
  const entrySize = isBigTiff ? CONSTANTS2.ENTRY_SIZE.BIG : CONSTANTS2.ENTRY_SIZE.STANDARD;
  if (input.length > entrySize) {
    return input.slice(entrySize);
  }
}
function extractTags2(input, { isBigEndian, isBigTiff }) {
  const tags = {};
  let temp = input;
  while (temp?.length) {
    const code = readUInt2(temp, 16, 0, isBigEndian);
    const type = readUInt2(temp, 16, 2, isBigEndian);
    const length = isBigTiff ? Number(readUInt642(temp, 4, isBigEndian)) : readUInt2(temp, 32, 4, isBigEndian);
    if (code === 0) break;
    if (length === 1 && (type === CONSTANTS2.TYPE.SHORT || type === CONSTANTS2.TYPE.LONG || isBigTiff && type === CONSTANTS2.TYPE.LONG8)) {
      const valueOffset = isBigTiff ? 12 : 8;
      tags[code] = readTagValue2(temp, type, valueOffset, isBigEndian);
    }
    temp = nextTag2(temp, isBigTiff);
  }
  return tags;
}
function determineFormat2(input) {
  const signature = toUTF8String2(input, 0, 2);
  const version3 = readUInt2(input, 16, 2, signature === "MM");
  return {
    isBigEndian: signature === "MM",
    isBigTiff: version3 === 43
  };
}
function validateBigTIFFHeader2(input, isBigEndian) {
  const byteSize = readUInt2(input, 16, 4, isBigEndian);
  const reserved = readUInt2(input, 16, 6, isBigEndian);
  if (byteSize !== 8 || reserved !== 0) {
    throw new TypeError("Invalid BigTIFF header");
  }
}
function calculateExtended2(input) {
  return {
    height: 1 + readUInt24LE2(input, 7),
    width: 1 + readUInt24LE2(input, 4)
  };
}
function calculateLossless2(input) {
  return {
    height: 1 + ((input[4] & 15) << 10 | input[3] << 2 | (input[2] & 192) >> 6),
    width: 1 + ((input[2] & 63) << 8 | input[1])
  };
}
function calculateLossy2(input) {
  return {
    height: readInt16LE2(input, 8) & 16383,
    width: readInt16LE2(input, 6) & 16383
  };
}
function detector2(input) {
  const byte = input[0];
  const type = firstBytes.get(byte);
  if (type && typeHandlers2.get(type).validate(input)) {
    return type;
  }
  return types3.find((imageType) => typeHandlers2.get(imageType).validate(input));
}
function lookup3(input) {
  const type = detector2(input);
  if (typeof type !== "undefined") {
    const size = typeHandlers2.get(type).calculate(input);
    if (size !== void 0) {
      size.type = size.type ?? type;
      return size;
    }
  }
  throw new TypeError("unsupported file type: " + type);
}
async function imageMetadata2(data, src) {
  let result;
  try {
    result = lookup3(data);
  } catch {
    throw new AstroError2({
      ...NoImageMetadata2,
      message: NoImageMetadata2.message(src)
    });
  }
  if (!result.height || !result.width || !result.type) {
    throw new AstroError2({
      ...NoImageMetadata2,
      message: NoImageMetadata2.message(src)
    });
  }
  const { width, height, type, orientation } = result;
  const isPortrait = (orientation || 0) >= 5;
  return {
    width: isPortrait ? height : width,
    height: isPortrait ? width : height,
    format: type,
    orientation
  };
}
async function inferRemoteSize2(url, imageConfig2) {
  if (!URL.canParse(url)) {
    throw new AstroError2({
      ...FailedToFetchRemoteImageDimensions2,
      message: FailedToFetchRemoteImageDimensions2.message(url)
    });
  }
  const allowlistConfig = imageConfig2 ? {
    domains: imageConfig2.domains ?? [],
    remotePatterns: imageConfig2.remotePatterns ?? []
  } : void 0;
  if (!allowlistConfig) {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new AstroError2({
        ...FailedToFetchRemoteImageDimensions2,
        message: FailedToFetchRemoteImageDimensions2.message(url)
      });
    }
  }
  if (allowlistConfig && !isRemoteAllowed(url, allowlistConfig)) {
    throw new AstroError2({
      ...RemoteImageNotAllowed2,
      message: RemoteImageNotAllowed2.message(url)
    });
  }
  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    throw new AstroError2({
      ...FailedToFetchRemoteImageDimensions2,
      message: FailedToFetchRemoteImageDimensions2.message(url)
    });
  }
  if (!response.body || !response.ok) {
    throw new AstroError2({
      ...FailedToFetchRemoteImageDimensions2,
      message: FailedToFetchRemoteImageDimensions2.message(url)
    });
  }
  const reader = response.body.getReader();
  let done, value;
  let accumulatedChunks = new Uint8Array();
  while (!done) {
    const readResult = await reader.read();
    done = readResult.done;
    if (done) break;
    if (readResult.value) {
      value = readResult.value;
      let tmp = new Uint8Array(accumulatedChunks.length + value.length);
      tmp.set(accumulatedChunks, 0);
      tmp.set(value, accumulatedChunks.length);
      accumulatedChunks = tmp;
      try {
        const dimensions = await imageMetadata2(accumulatedChunks, url);
        if (dimensions) {
          await reader.cancel();
          return dimensions;
        }
      } catch {
      }
    }
  }
  throw new AstroError2({
    ...NoImageMetadata2,
    message: NoImageMetadata2.message(url)
  });
}
function createPlaceholderURL2(pathOrUrl) {
  return new URL(pathOrUrl, PLACEHOLDER_BASE);
}
function stringifyPlaceholderURL2(url) {
  return url.href.replace(PLACEHOLDER_BASE, "");
}
async function getConfiguredImageService2() {
  if (!globalThis?.astroAsset?.imageService) {
    const { default: service2 } = await Promise.resolve().then(() => (init_image_service(), image_service_exports)).catch((e2) => {
      const error2 = new AstroError2(InvalidImageService2);
      error2.cause = e2;
      throw error2;
    });
    if (!globalThis.astroAsset) globalThis.astroAsset = {};
    globalThis.astroAsset.imageService = service2;
    return service2;
  }
  return globalThis.astroAsset.imageService;
}
async function getImage$1(options, imageConfig2) {
  if (!options || typeof options !== "object") {
    throw new AstroError2({
      ...ExpectedImageOptions2,
      message: ExpectedImageOptions2.message(JSON.stringify(options))
    });
  }
  if (typeof options.src === "undefined") {
    throw new AstroError2({
      ...ExpectedImage2,
      message: ExpectedImage2.message(
        options.src,
        "undefined",
        JSON.stringify(options)
      )
    });
  }
  if (isImageMetadata2(options)) {
    throw new AstroError2(ExpectedNotESMImage2);
  }
  const service2 = await getConfiguredImageService2();
  const resolvedOptions = {
    ...options,
    src: await resolveSrc2(options.src)
  };
  let originalWidth;
  let originalHeight;
  if (options.inferSize) {
    delete resolvedOptions.inferSize;
    if (isRemoteImage2(resolvedOptions.src) && isRemotePath(resolvedOptions.src)) {
      if (!isRemoteAllowed(resolvedOptions.src, imageConfig2)) {
        throw new AstroError2({
          ...RemoteImageNotAllowed2,
          message: RemoteImageNotAllowed2.message(resolvedOptions.src)
        });
      }
      const result = await inferRemoteSize2(resolvedOptions.src, imageConfig2);
      resolvedOptions.width ??= result.width;
      resolvedOptions.height ??= result.height;
      originalWidth = result.width;
      originalHeight = result.height;
    }
  }
  const originalFilePath = isESMImportedImage2(resolvedOptions.src) ? resolvedOptions.src.fsPath : void 0;
  const clonedSrc = isESMImportedImage2(resolvedOptions.src) ? (
    // @ts-expect-error - clone is a private, hidden prop
    resolvedOptions.src.clone ?? resolvedOptions.src
  ) : resolvedOptions.src;
  if (isESMImportedImage2(clonedSrc)) {
    originalWidth = clonedSrc.width;
    originalHeight = clonedSrc.height;
  }
  if (originalWidth && originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    if (resolvedOptions.height && !resolvedOptions.width) {
      resolvedOptions.width = Math.round(resolvedOptions.height * aspectRatio);
    } else if (resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.height = Math.round(resolvedOptions.width / aspectRatio);
    } else if (!resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.width = originalWidth;
      resolvedOptions.height = originalHeight;
    }
  }
  resolvedOptions.src = clonedSrc;
  const layout = options.layout ?? imageConfig2.layout ?? "none";
  if (resolvedOptions.priority) {
    resolvedOptions.loading ??= "eager";
    resolvedOptions.decoding ??= "sync";
    resolvedOptions.fetchpriority ??= "high";
    delete resolvedOptions.priority;
  } else {
    resolvedOptions.loading ??= "lazy";
    resolvedOptions.decoding ??= "async";
    resolvedOptions.fetchpriority ??= "auto";
  }
  if (layout !== "none") {
    resolvedOptions.widths ||= getWidths2({
      width: resolvedOptions.width,
      layout,
      originalWidth,
      breakpoints: imageConfig2.breakpoints?.length ? imageConfig2.breakpoints : isLocalService2(service2) ? LIMITED_RESOLUTIONS2 : DEFAULT_RESOLUTIONS2
    });
    resolvedOptions.sizes ||= getSizesAttribute2({ width: resolvedOptions.width, layout });
    delete resolvedOptions.densities;
    resolvedOptions.style = addCSSVarsToStyle2(
      {
        fit: cssFitValues2.includes(resolvedOptions.fit ?? "") && resolvedOptions.fit,
        pos: resolvedOptions.position
      },
      resolvedOptions.style
    );
    resolvedOptions["data-astro-image"] = layout;
  }
  const validatedOptions = service2.validateOptions ? await service2.validateOptions(resolvedOptions, imageConfig2) : resolvedOptions;
  const srcSetTransforms = service2.getSrcSet ? await service2.getSrcSet(validatedOptions, imageConfig2) : [];
  let imageURL = await service2.getURL(validatedOptions, imageConfig2);
  const matchesValidatedTransform = (transform) => transform.width === validatedOptions.width && transform.height === validatedOptions.height && transform.format === validatedOptions.format;
  let srcSets = await Promise.all(
    srcSetTransforms.map(async (srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesValidatedTransform(srcSet.transform) ? imageURL : await service2.getURL(srcSet.transform, imageConfig2),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    })
  );
  if (isLocalService2(service2) && globalThis.astroAsset.addStaticImage && !(isRemoteImage2(validatedOptions.src) && imageURL === validatedOptions.src)) {
    const propsToHash = service2.propertiesToHash ?? DEFAULT_HASH_PROPS2;
    imageURL = globalThis.astroAsset.addStaticImage(
      validatedOptions,
      propsToHash,
      originalFilePath
    );
    srcSets = srcSetTransforms.map((srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesValidatedTransform(srcSet.transform) ? imageURL : globalThis.astroAsset.addStaticImage(srcSet.transform, propsToHash, originalFilePath),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    });
  } else if (imageConfig2.assetQueryParams) {
    const imageURLObj = createPlaceholderURL2(imageURL);
    imageConfig2.assetQueryParams.forEach((value, key) => {
      imageURLObj.searchParams.set(key, value);
    });
    imageURL = stringifyPlaceholderURL2(imageURLObj);
    srcSets = srcSets.map((srcSet) => {
      const urlObj = createPlaceholderURL2(srcSet.url);
      imageConfig2.assetQueryParams.forEach((value, key) => {
        urlObj.searchParams.set(key, value);
      });
      return {
        ...srcSet,
        url: stringifyPlaceholderURL2(urlObj)
      };
    });
  }
  return {
    rawOptions: resolvedOptions,
    options: validatedOptions,
    src: imageURL,
    srcSet: {
      values: srcSets,
      attribute: srcSets.map((srcSet) => `${srcSet.url} ${srcSet.descriptor}`).join(", ")
    },
    attributes: service2.getHTMLAttributes !== void 0 ? await service2.getHTMLAttributes(validatedOptions, imageConfig2) : {}
  };
}
function filterPreloads(data, preload) {
  if (!preload) {
    return null;
  }
  if (preload === true) {
    return data;
  }
  return data.filter(
    ({ weight, style, subset }) => preload.some((p2) => {
      if (p2.weight !== void 0 && weight !== void 0 && !checkWeight(p2.weight.toString(), weight)) {
        return false;
      }
      if (p2.style !== void 0 && p2.style !== style) {
        return false;
      }
      if (p2.subset !== void 0 && p2.subset !== subset) {
        return false;
      }
      return true;
    })
  );
}
function checkWeight(input, target) {
  const trimmedInput = input.trim();
  if (trimmedInput.includes(" ")) {
    return trimmedInput === target;
  }
  if (target.includes(" ")) {
    const [a2, b] = target.split(" ");
    const parsedInput = Number.parseInt(input);
    return parsedInput >= Number.parseInt(a2) && parsedInput <= Number.parseInt(b);
  }
  return input === target;
}
async function loadRemoteImage(src, headers) {
  try {
    const res = await fetch(src, {
      // Forward all headers from the original request
      headers,
      redirect: "manual"
    });
    if (res.status >= 300 && res.status < 400) {
      return void 0;
    }
    if (!res.ok) {
      return void 0;
    }
    return await res.arrayBuffer();
  } catch {
    return void 0;
  }
}
var DEFAULT_HASH_PROPS2, DEFAULT_RESOLUTIONS2, LIMITED_RESOLUTIONS2, getWidths2, getSizesAttribute2, cssFitValues2, decoder4, toUTF8String2, toHexString2, getView2, readInt16LE2, readUInt16BE2, readUInt16LE2, readUInt24LE2, readInt32LE2, readUInt32BE2, readUInt32LE2, readUInt642, methods2, BMP2, TYPE_ICON2, SIZE_HEADER$1, SIZE_IMAGE_ENTRY2, ICO2, TYPE_CURSOR2, CUR2, DDS2, gifRegexp2, GIF2, brandMap2, HEIF2, SIZE_HEADER3, FILE_LENGTH_OFFSET2, ENTRY_LENGTH_OFFSET2, ICON_TYPE_SIZE2, ICNS2, J2C2, JP22, EXIF_MARKER2, APP1_DATA_SIZE_BYTES2, EXIF_HEADER_BYTES2, TIFF_BYTE_ALIGN_BYTES2, BIG_ENDIAN_BYTE_ALIGN2, LITTLE_ENDIAN_BYTE_ALIGN2, IDF_ENTRY_BYTES2, NUM_DIRECTORY_ENTRIES_BYTES2, JPG2, BitReader2, JXLStream2, JXL2, KTX2, pngSignature2, pngImageHeaderChunkName2, pngFriedChunkName2, PNG2, PNMTypes2, handlers2, PNM2, PSD2, svgReg2, extractorRegExps2, INCH_CM2, units2, unitsReg2, SVG2, TGA2, CONSTANTS2, signatures2, TIFF2, WEBP2, typeHandlers2, types3, firstBytes, PLACEHOLDER_BASE, $$Astro$2, $$Image, $$Astro$1, $$Picture, mod, $$Astro, $$Font, assetQueryParams, imageConfig, getImage2, fnv1a52, etag, GET, _page, page;
var init_image_astro = __esm({
  "examples/testapp-ssr/.netlify/build/pages/_image.astro.mjs"() {
    init_path();
    init_remote();
    init_server_B_EsUmxH();
    init_clsx();
    init_mrmime();
    init_dist2();
    init_renderers();
    DEFAULT_HASH_PROPS2 = [
      "src",
      "width",
      "height",
      "format",
      "quality",
      "fit",
      "position",
      "background"
    ];
    DEFAULT_RESOLUTIONS2 = [
      640,
      // older and lower-end phones
      750,
      // iPhone 6-8
      828,
      // iPhone XR/11
      960,
      // older horizontal phones
      1080,
      // iPhone 6-8 Plus
      1280,
      // 720p
      1668,
      // Various iPads
      1920,
      // 1080p
      2048,
      // QXGA
      2560,
      // WQXGA
      3200,
      // QHD+
      3840,
      // 4K
      4480,
      // 4.5K
      5120,
      // 5K
      6016
      // 6K
    ];
    LIMITED_RESOLUTIONS2 = [
      640,
      // older and lower-end phones
      750,
      // iPhone 6-8
      828,
      // iPhone XR/11
      1080,
      // iPhone 6-8 Plus
      1280,
      // 720p
      1668,
      // Various iPads
      2048,
      // QXGA
      2560
      // WQXGA
    ];
    getWidths2 = ({
      width,
      layout,
      breakpoints = DEFAULT_RESOLUTIONS2,
      originalWidth
    }) => {
      const smallerThanOriginal = (w2) => !originalWidth || w2 <= originalWidth;
      if (layout === "full-width") {
        return breakpoints.filter(smallerThanOriginal);
      }
      if (!width) {
        return [];
      }
      const doubleWidth = width * 2;
      const maxSize = originalWidth ? Math.min(doubleWidth, originalWidth) : doubleWidth;
      if (layout === "fixed") {
        return originalWidth && width > originalWidth ? [originalWidth] : [width, maxSize];
      }
      if (layout === "constrained") {
        return [
          // Always include the image at 1x and 2x the specified width
          width,
          doubleWidth,
          ...breakpoints
        ].filter((w2) => w2 <= maxSize).sort((a2, b) => a2 - b);
      }
      return [];
    };
    getSizesAttribute2 = ({
      width,
      layout
    }) => {
      if (!width || !layout) {
        return void 0;
      }
      switch (layout) {
        // If screen is wider than the max size then image width is the max size,
        // otherwise it's the width of the screen
        case "constrained":
          return `(min-width: ${width}px) ${width}px, 100vw`;
        // Image is always the same width, whatever the size of the screen
        case "fixed":
          return `${width}px`;
        // Image is always the width of the screen
        case "full-width":
          return `100vw`;
        case "none":
        default:
          return void 0;
      }
    };
    cssFitValues2 = ["fill", "contain", "cover", "scale-down"];
    decoder4 = new TextDecoder();
    toUTF8String2 = (input, start = 0, end = input.length) => decoder4.decode(input.slice(start, end));
    toHexString2 = (input, start = 0, end = input.length) => input.slice(start, end).reduce((memo, i2) => memo + `0${i2.toString(16)}`.slice(-2), "");
    getView2 = (input, offset) => new DataView(input.buffer, input.byteOffset + offset);
    readInt16LE2 = (input, offset = 0) => getView2(input, offset).getInt16(0, true);
    readUInt16BE2 = (input, offset = 0) => getView2(input, offset).getUint16(0, false);
    readUInt16LE2 = (input, offset = 0) => getView2(input, offset).getUint16(0, true);
    readUInt24LE2 = (input, offset = 0) => {
      const view = getView2(input, offset);
      return view.getUint16(0, true) + (view.getUint8(2) << 16);
    };
    readInt32LE2 = (input, offset = 0) => getView2(input, offset).getInt32(0, true);
    readUInt32BE2 = (input, offset = 0) => getView2(input, offset).getUint32(0, false);
    readUInt32LE2 = (input, offset = 0) => getView2(input, offset).getUint32(0, true);
    readUInt642 = (input, offset, isBigEndian) => getView2(input, offset).getBigUint64(0, !isBigEndian);
    methods2 = {
      readUInt16BE: readUInt16BE2,
      readUInt16LE: readUInt16LE2,
      readUInt32BE: readUInt32BE2,
      readUInt32LE: readUInt32LE2
    };
    BMP2 = {
      validate: (input) => toUTF8String2(input, 0, 2) === "BM",
      calculate: (input) => ({
        height: Math.abs(readInt32LE2(input, 22)),
        width: readUInt32LE2(input, 18)
      })
    };
    TYPE_ICON2 = 1;
    SIZE_HEADER$1 = 2 + 2 + 2;
    SIZE_IMAGE_ENTRY2 = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4;
    ICO2 = {
      validate(input) {
        const reserved = readUInt16LE2(input, 0);
        const imageCount = readUInt16LE2(input, 4);
        if (reserved !== 0 || imageCount === 0) return false;
        const imageType = readUInt16LE2(input, 2);
        return imageType === TYPE_ICON2;
      },
      calculate(input) {
        const nbImages = readUInt16LE2(input, 4);
        const imageSize = getImageSize$1(input, 0);
        if (nbImages === 1) return imageSize;
        const images = [];
        for (let imageIndex = 0; imageIndex < nbImages; imageIndex += 1) {
          images.push(getImageSize$1(input, imageIndex));
        }
        return {
          width: imageSize.width,
          height: imageSize.height,
          images
        };
      }
    };
    TYPE_CURSOR2 = 2;
    CUR2 = {
      validate(input) {
        const reserved = readUInt16LE2(input, 0);
        const imageCount = readUInt16LE2(input, 4);
        if (reserved !== 0 || imageCount === 0) return false;
        const imageType = readUInt16LE2(input, 2);
        return imageType === TYPE_CURSOR2;
      },
      calculate: (input) => ICO2.calculate(input)
    };
    DDS2 = {
      validate: (input) => readUInt32LE2(input, 0) === 542327876,
      calculate: (input) => ({
        height: readUInt32LE2(input, 12),
        width: readUInt32LE2(input, 16)
      })
    };
    gifRegexp2 = /^GIF8[79]a/;
    GIF2 = {
      validate: (input) => gifRegexp2.test(toUTF8String2(input, 0, 6)),
      calculate: (input) => ({
        height: readUInt16LE2(input, 8),
        width: readUInt16LE2(input, 6)
      })
    };
    brandMap2 = {
      avif: "avif",
      avis: "avif",
      // avif-sequence
      mif1: "heif",
      msf1: "heif",
      // heif-sequence
      heic: "heic",
      heix: "heic",
      hevc: "heic",
      // heic-sequence
      hevx: "heic"
      // heic-sequence
    };
    HEIF2 = {
      validate(input) {
        const boxType = toUTF8String2(input, 4, 8);
        if (boxType !== "ftyp") return false;
        const ftypBox = findBox2(input, "ftyp", 0);
        if (!ftypBox) return false;
        const brand = toUTF8String2(input, ftypBox.offset + 8, ftypBox.offset + 12);
        return brand in brandMap2;
      },
      calculate(input) {
        const metaBox = findBox2(input, "meta", 0);
        const iprpBox = metaBox && findBox2(input, "iprp", metaBox.offset + 12);
        const ipcoBox = iprpBox && findBox2(input, "ipco", iprpBox.offset + 8);
        if (!ipcoBox) {
          throw new TypeError("Invalid HEIF, no ipco box found");
        }
        const type = detectType2(input, 8, metaBox.offset);
        const images = [];
        let currentOffset = ipcoBox.offset + 8;
        while (currentOffset < ipcoBox.offset + ipcoBox.size) {
          const ispeBox = findBox2(input, "ispe", currentOffset);
          if (!ispeBox) break;
          const rawWidth = readUInt32BE2(input, ispeBox.offset + 12);
          const rawHeight = readUInt32BE2(input, ispeBox.offset + 16);
          const clapBox = findBox2(input, "clap", currentOffset);
          let width = rawWidth;
          let height = rawHeight;
          if (clapBox && clapBox.offset < ipcoBox.offset + ipcoBox.size) {
            const cropRight = readUInt32BE2(input, clapBox.offset + 12);
            width = rawWidth - cropRight;
          }
          images.push({ height, width });
          currentOffset = ispeBox.offset + ispeBox.size;
        }
        if (images.length === 0) {
          throw new TypeError("Invalid HEIF, no sizes found");
        }
        return {
          width: images[0].width,
          height: images[0].height,
          type,
          ...images.length > 1 ? { images } : {}
        };
      }
    };
    SIZE_HEADER3 = 4 + 4;
    FILE_LENGTH_OFFSET2 = 4;
    ENTRY_LENGTH_OFFSET2 = 4;
    ICON_TYPE_SIZE2 = {
      ICON: 32,
      "ICN#": 32,
      // m => 16 x 16
      "icm#": 16,
      icm4: 16,
      icm8: 16,
      // s => 16 x 16
      "ics#": 16,
      ics4: 16,
      ics8: 16,
      is32: 16,
      s8mk: 16,
      icp4: 16,
      // l => 32 x 32
      icl4: 32,
      icl8: 32,
      il32: 32,
      l8mk: 32,
      icp5: 32,
      ic11: 32,
      // h => 48 x 48
      ich4: 48,
      ich8: 48,
      ih32: 48,
      h8mk: 48,
      // . => 64 x 64
      icp6: 64,
      ic12: 32,
      // t => 128 x 128
      it32: 128,
      t8mk: 128,
      ic07: 128,
      // . => 256 x 256
      ic08: 256,
      ic13: 256,
      // . => 512 x 512
      ic09: 512,
      ic14: 512,
      // . => 1024 x 1024
      ic10: 1024
    };
    ICNS2 = {
      validate: (input) => toUTF8String2(input, 0, 4) === "icns",
      calculate(input) {
        const inputLength = input.length;
        const fileLength = readUInt32BE2(input, FILE_LENGTH_OFFSET2);
        let imageOffset = SIZE_HEADER3;
        const images = [];
        while (imageOffset < fileLength && imageOffset < inputLength) {
          const imageHeader = readImageHeader2(input, imageOffset);
          const imageSize = getImageSize3(imageHeader[0]);
          images.push(imageSize);
          imageOffset += imageHeader[1];
        }
        if (images.length === 0) {
          throw new TypeError("Invalid ICNS, no sizes found");
        }
        return {
          width: images[0].width,
          height: images[0].height,
          ...images.length > 1 ? { images } : {}
        };
      }
    };
    J2C2 = {
      // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
      validate: (input) => readUInt32BE2(input, 0) === 4283432785,
      calculate: (input) => ({
        height: readUInt32BE2(input, 12),
        width: readUInt32BE2(input, 8)
      })
    };
    JP22 = {
      validate(input) {
        const boxType = toUTF8String2(input, 4, 8);
        if (boxType !== "jP  ") return false;
        const ftypBox = findBox2(input, "ftyp", 0);
        if (!ftypBox) return false;
        const brand = toUTF8String2(input, ftypBox.offset + 8, ftypBox.offset + 12);
        return brand === "jp2 ";
      },
      calculate(input) {
        const jp2hBox = findBox2(input, "jp2h", 0);
        const ihdrBox = jp2hBox && findBox2(input, "ihdr", jp2hBox.offset + 8);
        if (ihdrBox) {
          return {
            height: readUInt32BE2(input, ihdrBox.offset + 8),
            width: readUInt32BE2(input, ihdrBox.offset + 12)
          };
        }
        throw new TypeError("Unsupported JPEG 2000 format");
      }
    };
    EXIF_MARKER2 = "45786966";
    APP1_DATA_SIZE_BYTES2 = 2;
    EXIF_HEADER_BYTES2 = 6;
    TIFF_BYTE_ALIGN_BYTES2 = 2;
    BIG_ENDIAN_BYTE_ALIGN2 = "4d4d";
    LITTLE_ENDIAN_BYTE_ALIGN2 = "4949";
    IDF_ENTRY_BYTES2 = 12;
    NUM_DIRECTORY_ENTRIES_BYTES2 = 2;
    JPG2 = {
      validate: (input) => toHexString2(input, 0, 2) === "ffd8",
      calculate(_input) {
        let input = _input.slice(4);
        let orientation;
        let next;
        while (input.length) {
          const i2 = readUInt16BE2(input, 0);
          validateInput2(input, i2);
          if (input[i2] !== 255) {
            input = input.slice(1);
            continue;
          }
          if (isEXIF2(input)) {
            orientation = validateExifBlock2(input, i2);
          }
          next = input[i2 + 1];
          if (next === 192 || next === 193 || next === 194) {
            const size = extractSize2(input, i2 + 5);
            if (!orientation) {
              return size;
            }
            return {
              height: size.height,
              orientation,
              width: size.width
            };
          }
          input = input.slice(i2 + 2);
        }
        throw new TypeError("Invalid JPG, no size found");
      }
    };
    BitReader2 = class {
      constructor(input, endianness) {
        this.input = input;
        this.endianness = endianness;
      }
      // Skip the first 16 bits (2 bytes) of signature
      byteOffset = 2;
      bitOffset = 0;
      /** Reads a specified number of bits, and move the offset */
      getBits(length = 1) {
        let result = 0;
        let bitsRead = 0;
        while (bitsRead < length) {
          if (this.byteOffset >= this.input.length) {
            throw new Error("Reached end of input");
          }
          const currentByte = this.input[this.byteOffset];
          const bitsLeft = 8 - this.bitOffset;
          const bitsToRead = Math.min(length - bitsRead, bitsLeft);
          if (this.endianness === "little-endian") {
            const mask = (1 << bitsToRead) - 1;
            const bits = currentByte >> this.bitOffset & mask;
            result |= bits << bitsRead;
          } else {
            const mask = (1 << bitsToRead) - 1 << 8 - this.bitOffset - bitsToRead;
            const bits = (currentByte & mask) >> 8 - this.bitOffset - bitsToRead;
            result = result << bitsToRead | bits;
          }
          bitsRead += bitsToRead;
          this.bitOffset += bitsToRead;
          if (this.bitOffset === 8) {
            this.byteOffset++;
            this.bitOffset = 0;
          }
        }
        return result;
      }
    };
    JXLStream2 = {
      validate: (input) => {
        return toHexString2(input, 0, 2) === "ff0a";
      },
      calculate(input) {
        const reader = new BitReader2(input, "little-endian");
        const isSmallImage = reader.getBits(1) === 1;
        const height = calculateImageDimension2(reader, isSmallImage);
        const widthMode = reader.getBits(3);
        const width = calculateImageWidth2(reader, isSmallImage, widthMode, height);
        return { width, height };
      }
    };
    JXL2 = {
      validate: (input) => {
        const boxType = toUTF8String2(input, 4, 8);
        if (boxType !== "JXL ") return false;
        const ftypBox = findBox2(input, "ftyp", 0);
        if (!ftypBox) return false;
        const brand = toUTF8String2(input, ftypBox.offset + 8, ftypBox.offset + 12);
        return brand === "jxl ";
      },
      calculate(input) {
        const codestream = extractCodestream2(input);
        if (codestream) return JXLStream2.calculate(codestream);
        throw new Error("No codestream found in JXL container");
      }
    };
    KTX2 = {
      validate: (input) => {
        const signature = toUTF8String2(input, 1, 7);
        return ["KTX 11", "KTX 20"].includes(signature);
      },
      calculate: (input) => {
        const type = input[5] === 49 ? "ktx" : "ktx2";
        const offset = type === "ktx" ? 36 : 20;
        return {
          height: readUInt32LE2(input, offset + 4),
          width: readUInt32LE2(input, offset),
          type
        };
      }
    };
    pngSignature2 = "PNG\r\n\n";
    pngImageHeaderChunkName2 = "IHDR";
    pngFriedChunkName2 = "CgBI";
    PNG2 = {
      validate(input) {
        if (pngSignature2 === toUTF8String2(input, 1, 8)) {
          let chunkName = toUTF8String2(input, 12, 16);
          if (chunkName === pngFriedChunkName2) {
            chunkName = toUTF8String2(input, 28, 32);
          }
          if (chunkName !== pngImageHeaderChunkName2) {
            throw new TypeError("Invalid PNG");
          }
          return true;
        }
        return false;
      },
      calculate(input) {
        if (toUTF8String2(input, 12, 16) === pngFriedChunkName2) {
          return {
            height: readUInt32BE2(input, 36),
            width: readUInt32BE2(input, 32)
          };
        }
        return {
          height: readUInt32BE2(input, 20),
          width: readUInt32BE2(input, 16)
        };
      }
    };
    PNMTypes2 = {
      P1: "pbm/ascii",
      P2: "pgm/ascii",
      P3: "ppm/ascii",
      P4: "pbm",
      P5: "pgm",
      P6: "ppm",
      P7: "pam",
      PF: "pfm"
    };
    handlers2 = {
      default: (lines) => {
        let dimensions = [];
        while (lines.length > 0) {
          const line = lines.shift();
          if (line[0] === "#") {
            continue;
          }
          dimensions = line.split(" ");
          break;
        }
        if (dimensions.length === 2) {
          return {
            height: Number.parseInt(dimensions[1], 10),
            width: Number.parseInt(dimensions[0], 10)
          };
        }
        throw new TypeError("Invalid PNM");
      },
      pam: (lines) => {
        const size = {};
        while (lines.length > 0) {
          const line = lines.shift();
          if (line.length > 16 || line.charCodeAt(0) > 128) {
            continue;
          }
          const [key, value] = line.split(" ");
          if (key && value) {
            size[key.toLowerCase()] = Number.parseInt(value, 10);
          }
          if (size.height && size.width) {
            break;
          }
        }
        if (size.height && size.width) {
          return {
            height: size.height,
            width: size.width
          };
        }
        throw new TypeError("Invalid PAM");
      }
    };
    PNM2 = {
      validate: (input) => toUTF8String2(input, 0, 2) in PNMTypes2,
      calculate(input) {
        const signature = toUTF8String2(input, 0, 2);
        const type = PNMTypes2[signature];
        const lines = toUTF8String2(input, 3).split(/[\r\n]+/);
        const handler = handlers2[type] || handlers2.default;
        return handler(lines);
      }
    };
    PSD2 = {
      validate: (input) => toUTF8String2(input, 0, 4) === "8BPS",
      calculate: (input) => ({
        height: readUInt32BE2(input, 14),
        width: readUInt32BE2(input, 18)
      })
    };
    svgReg2 = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/;
    extractorRegExps2 = {
      height: /\sheight=(['"])([^%]+?)\1/,
      root: svgReg2,
      viewbox: /\sviewBox=(['"])(.+?)\1/i,
      width: /\swidth=(['"])([^%]+?)\1/
    };
    INCH_CM2 = 2.54;
    units2 = {
      in: 96,
      cm: 96 / INCH_CM2,
      em: 16,
      ex: 8,
      m: 96 / INCH_CM2 * 100,
      mm: 96 / INCH_CM2 / 10,
      pc: 96 / 72 / 12,
      pt: 96 / 72,
      px: 1
    };
    unitsReg2 = new RegExp(
      `^([0-9.]+(?:e\\d+)?)(${Object.keys(units2).join("|")})?$`
    );
    SVG2 = {
      // Scan only the first kilo-byte to speed up the check on larger files
      validate: (input) => svgReg2.test(toUTF8String2(input, 0, 1e3)),
      calculate(input) {
        const root = extractorRegExps2.root.exec(toUTF8String2(input));
        if (root) {
          const attrs = parseAttributes2(root[0]);
          if (attrs.width && attrs.height) {
            return calculateByDimensions2(attrs);
          }
          if (attrs.viewbox) {
            return calculateByViewbox2(attrs, attrs.viewbox);
          }
        }
        throw new TypeError("Invalid SVG");
      }
    };
    TGA2 = {
      validate(input) {
        return readUInt16LE2(input, 0) === 0 && readUInt16LE2(input, 4) === 0;
      },
      calculate(input) {
        return {
          height: readUInt16LE2(input, 14),
          width: readUInt16LE2(input, 12)
        };
      }
    };
    CONSTANTS2 = {
      TAG: {
        WIDTH: 256,
        HEIGHT: 257,
        COMPRESSION: 259
      },
      TYPE: {
        SHORT: 3,
        LONG: 4,
        LONG8: 16
      },
      ENTRY_SIZE: {
        STANDARD: 12,
        BIG: 20
      },
      COUNT_SIZE: {
        STANDARD: 2,
        BIG: 8
      }
    };
    signatures2 = /* @__PURE__ */ new Set([
      "49492a00",
      // Little Endian
      "4d4d002a",
      // Big Endian
      "49492b00",
      // BigTIFF Little Endian
      "4d4d002b"
      // BigTIFF Big Endian
    ]);
    TIFF2 = {
      validate: (input) => {
        const signature = toHexString2(input, 0, 4);
        return signatures2.has(signature);
      },
      calculate(input) {
        const format2 = determineFormat2(input);
        if (format2.isBigTiff) {
          validateBigTIFFHeader2(input, format2.isBigEndian);
        }
        const ifdBuffer = readIFD2(input, format2);
        const tags = extractTags2(ifdBuffer, format2);
        const info2 = {
          height: tags[CONSTANTS2.TAG.HEIGHT],
          width: tags[CONSTANTS2.TAG.WIDTH],
          type: format2.isBigTiff ? "bigtiff" : "tiff"
        };
        if (tags[CONSTANTS2.TAG.COMPRESSION]) {
          info2.compression = tags[CONSTANTS2.TAG.COMPRESSION];
        }
        if (!info2.width || !info2.height) {
          throw new TypeError("Invalid Tiff. Missing tags");
        }
        return info2;
      }
    };
    WEBP2 = {
      validate(input) {
        const riffHeader = "RIFF" === toUTF8String2(input, 0, 4);
        const webpHeader = "WEBP" === toUTF8String2(input, 8, 12);
        const vp8Header = "VP8" === toUTF8String2(input, 12, 15);
        return riffHeader && webpHeader && vp8Header;
      },
      calculate(_input) {
        const chunkHeader = toUTF8String2(_input, 12, 16);
        const input = _input.slice(20, 30);
        if (chunkHeader === "VP8X") {
          const extendedHeader = input[0];
          const validStart = (extendedHeader & 192) === 0;
          const validEnd = (extendedHeader & 1) === 0;
          if (validStart && validEnd) {
            return calculateExtended2(input);
          }
          throw new TypeError("Invalid WebP");
        }
        if (chunkHeader === "VP8 " && input[0] !== 47) {
          return calculateLossy2(input);
        }
        const signature = toHexString2(input, 3, 6);
        if (chunkHeader === "VP8L" && signature !== "9d012a") {
          return calculateLossless2(input);
        }
        throw new TypeError("Invalid WebP");
      }
    };
    typeHandlers2 = /* @__PURE__ */ new Map([
      ["bmp", BMP2],
      ["cur", CUR2],
      ["dds", DDS2],
      ["gif", GIF2],
      ["heif", HEIF2],
      ["icns", ICNS2],
      ["ico", ICO2],
      ["j2c", J2C2],
      ["jp2", JP22],
      ["jpg", JPG2],
      ["jxl", JXL2],
      ["jxl-stream", JXLStream2],
      ["ktx", KTX2],
      ["png", PNG2],
      ["pnm", PNM2],
      ["psd", PSD2],
      ["svg", SVG2],
      ["tga", TGA2],
      ["tiff", TIFF2],
      ["webp", WEBP2]
    ]);
    types3 = Array.from(typeHandlers2.keys());
    firstBytes = /* @__PURE__ */ new Map([
      [0, "heif"],
      [56, "psd"],
      [66, "bmp"],
      [68, "dds"],
      [71, "gif"],
      [73, "tiff"],
      [77, "tiff"],
      [82, "webp"],
      [105, "icns"],
      [137, "png"],
      [255, "jpg"]
    ]);
    PLACEHOLDER_BASE = "astro://placeholder";
    $$Astro$2 = createAstro2();
    $$Image = createComponent2(async ($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
      Astro2.self = $$Image;
      const props = Astro2.props;
      if (props.alt === void 0 || props.alt === null) {
        throw new AstroError2(ImageMissingAlt2);
      }
      if (typeof props.width === "string") {
        props.width = parseInt(props.width);
      }
      if (typeof props.height === "string") {
        props.height = parseInt(props.height);
      }
      const layout = props.layout ?? imageConfig.layout ?? "none";
      if (layout !== "none") {
        props.layout ??= imageConfig.layout;
        props.fit ??= imageConfig.objectFit ?? "cover";
        props.position ??= imageConfig.objectPosition ?? "center";
      }
      const image = await getImage2(props);
      const additionalAttributes = {};
      if (image.srcSet.values.length > 0) {
        additionalAttributes.srcset = image.srcSet.attribute;
      }
      const { class: className, ...attributes } = { ...additionalAttributes, ...image.attributes };
      return renderTemplate2`${maybeRenderHead2()}<img${addAttribute2(image.src, "src")}${spreadAttributes2(attributes)}${addAttribute2(className, "class")}>`;
    }, "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/node_modules/astro/components/Image.astro", void 0);
    $$Astro$1 = createAstro2();
    $$Picture = createComponent2(async ($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
      Astro2.self = $$Picture;
      const defaultFormats = ["webp"];
      const defaultFallbackFormat = "png";
      const specialFormatsFallback = ["gif", "svg", "jpg", "jpeg"];
      const { formats = defaultFormats, pictureAttributes = {}, fallbackFormat, ...props } = Astro2.props;
      if (props.alt === void 0 || props.alt === null) {
        throw new AstroError2(ImageMissingAlt2);
      }
      const scopedStyleClass = props.class?.match(/\bastro-\w{8}\b/)?.[0];
      if (scopedStyleClass) {
        if (pictureAttributes.class) {
          pictureAttributes.class = `${pictureAttributes.class} ${scopedStyleClass}`;
        } else {
          pictureAttributes.class = scopedStyleClass;
        }
      }
      const layout = props.layout ?? imageConfig.layout ?? "none";
      const useResponsive = layout !== "none";
      if (useResponsive) {
        props.layout ??= imageConfig.layout;
        props.fit ??= imageConfig.objectFit ?? "cover";
        props.position ??= imageConfig.objectPosition ?? "center";
      }
      for (const key in props) {
        if (key.startsWith("data-astro-cid")) {
          pictureAttributes[key] = props[key];
        }
      }
      const originalSrc = await resolveSrc2(props.src);
      const optimizedImages = await Promise.all(
        formats.map(
          async (format2) => await getImage2({
            ...props,
            src: originalSrc,
            format: format2,
            widths: props.widths,
            densities: props.densities
          })
        )
      );
      let resultFallbackFormat = fallbackFormat ?? defaultFallbackFormat;
      if (!fallbackFormat && isESMImportedImage2(originalSrc) && specialFormatsFallback.includes(originalSrc.format)) {
        resultFallbackFormat = originalSrc.format;
      }
      const fallbackImage = await getImage2({
        ...props,
        format: resultFallbackFormat,
        widths: props.widths,
        densities: props.densities
      });
      const imgAdditionalAttributes = {};
      const sourceAdditionalAttributes = {};
      if (props.sizes) {
        sourceAdditionalAttributes.sizes = props.sizes;
      }
      if (fallbackImage.srcSet.values.length > 0) {
        imgAdditionalAttributes.srcset = fallbackImage.srcSet.attribute;
      }
      const { class: className, ...attributes } = {
        ...imgAdditionalAttributes,
        ...fallbackImage.attributes
      };
      return renderTemplate2`${maybeRenderHead2()}<picture${spreadAttributes2(pictureAttributes)}> ${Object.entries(optimizedImages).map(([_, image]) => {
        const srcsetAttribute = props.densities || !props.densities && !props.widths && !useResponsive ? `${image.src}${image.srcSet.values.length > 0 ? ", " + image.srcSet.attribute : ""}` : image.srcSet.attribute;
        return renderTemplate2`<source${addAttribute2(srcsetAttribute, "srcset")}${addAttribute2(lookup(image.options.format ?? image.src) ?? `image/${image.options.format}`, "type")}${spreadAttributes2(sourceAdditionalAttributes)}>`;
      })}  <img${addAttribute2(fallbackImage.src, "src")}${spreadAttributes2(attributes)}${addAttribute2(className, "class")}> </picture>`;
    }, "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/node_modules/astro/components/Picture.astro", void 0);
    mod = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null
    }, Symbol.toStringTag, { value: "Module" }));
    $$Astro = createAstro2();
    $$Font = createComponent2(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
      Astro2.self = $$Font;
      const { componentDataByCssVariable } = mod;
      if (!componentDataByCssVariable) {
        throw new AstroError2(ExperimentalFontsNotEnabled2);
      }
      const { cssVariable, preload = false } = Astro2.props;
      const data = componentDataByCssVariable.get(cssVariable);
      if (!data) {
        throw new AstroError2({
          ...FontFamilyNotFound2,
          message: FontFamilyNotFound2.message(cssVariable)
        });
      }
      const filteredPreloadData = filterPreloads(data.preloads, preload);
      return renderTemplate2`<style>${unescapeHTML2(data.css)}</style>${filteredPreloadData?.map(({ url, type }) => renderTemplate2`<link rel="preload"${addAttribute2(url, "href")} as="font"${addAttribute2(`font/${type}`, "type")} crossorigin>`)}`;
    }, "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/node_modules/astro/components/Font.astro", void 0);
    assetQueryParams = void 0;
    imageConfig = { "endpoint": { "route": "/_image" }, "service": { "entrypoint": "@astrojs/netlify/image-service.js", "config": {} }, "domains": [], "remotePatterns": [], "responsiveStyles": false };
    Object.defineProperty(imageConfig, "assetQueryParams", {
      value: assetQueryParams,
      enumerable: false,
      configurable: true
    });
    getImage2 = async (options) => await getImage$1(options, imageConfig);
    fnv1a52 = (str) => {
      const len = str.length;
      let i2 = 0, t0 = 0, v0 = 8997, t1 = 0, v1 = 33826, t22 = 0, v2 = 40164, t32 = 0, v3 = 52210;
      while (i2 < len) {
        v0 ^= str.charCodeAt(i2++);
        t0 = v0 * 435;
        t1 = v1 * 435;
        t22 = v2 * 435;
        t32 = v3 * 435;
        t22 += v0 << 8;
        t32 += v1 << 8;
        t1 += t0 >>> 16;
        v0 = t0 & 65535;
        t22 += t1 >>> 16;
        v1 = t1 & 65535;
        v3 = t32 + (t22 >>> 16) & 65535;
        v2 = t22 & 65535;
      }
      return (v3 & 15) * 281474976710656 + v2 * 4294967296 + v1 * 65536 + (v0 ^ v3 >> 4);
    };
    etag = (payload, weak = false) => {
      const prefix = weak ? 'W/"' : '"';
      return prefix + fnv1a52(payload).toString(36) + payload.length.toString(36) + '"';
    };
    GET = async ({ request }) => {
      try {
        const imageService = await getConfiguredImageService2();
        if (!("transform" in imageService)) {
          throw new Error("Configured image service is not a local service");
        }
        const url = new URL(request.url);
        const transform = await imageService.parseURL(url, imageConfig);
        if (!transform?.src) {
          throw new Error("Incorrect transform returned by `parseURL`");
        }
        let inputBuffer = void 0;
        const isRemoteImage3 = isRemotePath(transform.src);
        if (isRemoteImage3 && isRemoteAllowed(transform.src, imageConfig) === false) {
          return new Response("Forbidden", { status: 403 });
        }
        const sourceUrl = new URL(transform.src, url.origin);
        if (!isRemoteImage3 && sourceUrl.origin !== url.origin) {
          return new Response("Forbidden", { status: 403 });
        }
        inputBuffer = await loadRemoteImage(sourceUrl, isRemoteImage3 ? new Headers() : request.headers);
        if (!inputBuffer) {
          return new Response("Not Found", { status: 404 });
        }
        const { data, format: format2 } = await imageService.transform(
          new Uint8Array(inputBuffer),
          transform,
          imageConfig
        );
        return new Response(data, {
          status: 200,
          headers: {
            "Content-Type": lookup(format2) ?? `image/${format2}`,
            "Cache-Control": "public, max-age=31536000",
            ETag: etag(data.toString()),
            Date: (/* @__PURE__ */ new Date()).toUTCString()
          }
        });
      } catch (err) {
        console.error("Could not process image request:", err);
        return new Response(`Server Error: ${err}`, { status: 500 });
      }
    };
    _page = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET
    }, Symbol.toStringTag, { value: "Module" }));
    page = () => _page;
  }
});

// examples/testapp-ssr/.netlify/build/chunks/session_DujMC6FN.mjs
var userCartItems;
var init_session_DujMC6FN = __esm({
  "examples/testapp-ssr/.netlify/build/chunks/session_DujMC6FN.mjs"() {
    userCartItems = /* @__PURE__ */ new Map();
  }
});

// examples/testapp-ssr/.netlify/build/pages/api/cart.astro.mjs
var cart_astro_exports = {};
__export(cart_astro_exports, {
  page: () => page2,
  renderers: () => renderers
});
function GET2({ cookies }) {
  let userId = cookies.get("user-id")?.value;
  if (!userId || !userCartItems.has(userId)) {
    return Response.json({ items: [] });
  }
  let items = userCartItems.get(userId);
  let array = Array.from(items.values());
  return Response.json({ items: array });
}
async function POST({ cookies, request }) {
  const item = await request.json();
  let userId = cookies.get("user-id")?.value;
  if (!userCartItems.has(userId)) {
    userCartItems.set(userId, /* @__PURE__ */ new Map());
  }
  let cart = userCartItems.get(userId);
  if (cart.has(item.id)) {
    cart.get(item.id).count++;
  } else {
    cart.set(item.id, { id: item.id, name: item.name, count: 1 });
  }
  return Response.json({ ok: true });
}
var _page2, page2;
var init_cart_astro = __esm({
  "examples/testapp-ssr/.netlify/build/pages/api/cart.astro.mjs"() {
    init_session_DujMC6FN();
    init_renderers();
    _page2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET2,
      POST
    }, Symbol.toStringTag, { value: "Module" }));
    page2 = () => _page2;
  }
});

// examples/testapp-ssr/.netlify/build/chunks/db_DCuZ6DnU.mjs
var products$1, db, products, productMap;
var init_db_DCuZ6DnU = __esm({
  "examples/testapp-ssr/.netlify/build/chunks/db_DCuZ6DnU.mjs"() {
    products$1 = [{ "id": 1, "name": "Cereal", "price": 3.99, "image": "/images/products/cereal.jpg" }, { "id": 2, "name": "Yogurt", "price": 3.97, "image": "/images/products/yogurt.jpg" }, { "id": 3, "name": "Rolled Oats", "price": 2.89, "image": "/images/products/oats.jpg" }, { "id": 4, "name": "Muffins", "price": 4.39, "image": "/images/products/muffins.jpg" }];
    db = {
      products: products$1
    };
    products = db.products;
    productMap = new Map(products.map((product) => [product.id, product]));
  }
});

// examples/testapp-ssr/.netlify/build/pages/api/products/_id_.astro.mjs
var id_astro_exports = {};
__export(id_astro_exports, {
  page: () => page3,
  renderers: () => renderers
});
function GET3({ params }) {
  const id = Number(params.id);
  if (productMap.has(id)) {
    const product = productMap.get(id);
    return new Response(JSON.stringify(product));
  } else {
    return new Response(null, {
      status: 400,
      statusText: "Not found"
    });
  }
}
var _page3, page3;
var init_id_astro = __esm({
  "examples/testapp-ssr/.netlify/build/pages/api/products/_id_.astro.mjs"() {
    init_db_DCuZ6DnU();
    init_renderers();
    _page3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET3
    }, Symbol.toStringTag, { value: "Module" }));
    page3 = () => _page3;
  }
});

// examples/testapp-ssr/.netlify/build/pages/api/products.astro.mjs
var products_astro_exports = {};
__export(products_astro_exports, {
  page: () => page4,
  renderers: () => renderers
});
function GET4() {
  return new Response(JSON.stringify(products));
}
var _page4, page4;
var init_products_astro = __esm({
  "examples/testapp-ssr/.netlify/build/pages/api/products.astro.mjs"() {
    init_db_DCuZ6DnU();
    init_renderers();
    _page4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET4
    }, Symbol.toStringTag, { value: "Module" }));
    page4 = () => _page4;
  }
});

// examples/testapp-ssr/.netlify/build/pages/cart.astro.mjs
var cart_astro_exports2 = {};
__export(cart_astro_exports2, {
  page: () => page5,
  renderers: () => renderers
});
var $$Astro2, $$Cart, $$file, $$url, _page5, page5;
var init_cart_astro2 = __esm({
  "examples/testapp-ssr/.netlify/build/pages/cart.astro.mjs"() {
    init_server_B_EsUmxH();
    init_dist2();
    init_clsx();
    init_session_DujMC6FN();
    init_renderers();
    $$Astro2 = createAstro2();
    $$Cart = createComponent2(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro2, $$props, $$slots);
      Astro2.self = $$Cart;
      const userId = Astro2.cookies.get("user-id")?.value;
      const items = userId && userCartItems.has(userId) ? Array.from(userCartItems.get(userId).values()) : [];
      return renderTemplate2`<html lang="en"> <head><meta charset="UTF-8"><title>Cart | Online Store</title>${renderHead2()}</head> <body> <h1>Your Cart</h1> ${items.length === 0 ? renderTemplate2`<p>Your cart is empty.</p>` : renderTemplate2`<ul>${items.map((item) => renderTemplate2`<li>${item.name} x${item.count}</li>`)}</ul>`} <p><a href="/">Continue shopping</a></p> </body></html>`;
    }, "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/cart.astro", void 0);
    $$file = "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/cart.astro";
    $$url = "/cart";
    _page5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      default: $$Cart,
      file: $$file,
      url: $$url
    }, Symbol.toStringTag, { value: "Module" }));
    page5 = () => _page5;
  }
});

// examples/testapp-ssr/.netlify/build/pages/products/_id_.astro.mjs
var id_astro_exports2 = {};
__export(id_astro_exports2, {
  page: () => page6,
  renderers: () => renderers
});
var $$Astro3, $$id, $$file2, $$url2, _page6, page6;
var init_id_astro2 = __esm({
  "examples/testapp-ssr/.netlify/build/pages/products/_id_.astro.mjs"() {
    init_server_B_EsUmxH();
    init_dist2();
    init_clsx();
    init_db_DCuZ6DnU();
    init_renderers();
    $$Astro3 = createAstro2();
    $$id = createComponent2(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro3, $$props, $$slots);
      Astro2.self = $$id;
      const { id } = Astro2.params;
      const product = productMap.get(Number(id));
      if (!product) return Astro2.redirect("/");
      return renderTemplate2`<html lang="en"> <head><meta charset="UTF-8"><title>${product.name} | Online Store</title>${renderHead2()}</head> <body> <h1>${product.name}</h1> <p>Price: $${product.price}</p> <form method="POST" action="/cart"> <input type="hidden" name="id"${addAttribute2(product.id, "value")}> <input type="hidden" name="name"${addAttribute2(product.name, "value")}> <button type="submit">Add to Cart</button> </form> <p><a href="/">Back to store</a></p> </body></html>`;
    }, "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/products/[id].astro", void 0);
    $$file2 = "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/products/[id].astro";
    $$url2 = "/products/[id]";
    _page6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      default: $$id,
      file: $$file2,
      url: $$url2
    }, Symbol.toStringTag, { value: "Module" }));
    page6 = () => _page6;
  }
});

// examples/testapp-ssr/.netlify/build/pages/index.astro.mjs
var index_astro_exports = {};
__export(index_astro_exports, {
  page: () => page7,
  renderers: () => renderers
});
var $$Index, $$file3, $$url3, _page7, page7;
var init_index_astro = __esm({
  "examples/testapp-ssr/.netlify/build/pages/index.astro.mjs"() {
    init_server_B_EsUmxH();
    init_dist2();
    init_clsx();
    init_db_DCuZ6DnU();
    init_renderers();
    $$Index = createComponent2(($$result, $$props, $$slots) => {
      return renderTemplate2`<html lang="en"> <head><meta charset="UTF-8"><title>Online Store</title>${renderHead2()}</head> <body> <h1>Online Store</h1> <ul> ${products.map((p2) => renderTemplate2`<li> <a${addAttribute2(`/products/${p2.id}`, "href")}>${p2.name}</a> — $${p2.price} </li>`)} </ul> <p><a href="/cart">View Cart</a></p> </body></html>`;
    }, "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/index.astro", void 0);
    $$file3 = "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/index.astro";
    $$url3 = "";
    _page7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      default: $$Index,
      file: $$file3,
      url: $$url3
    }, Symbol.toStringTag, { value: "Module" }));
    page7 = () => _page7;
  }
});

// examples/testapp-ssr/.netlify/build/noop-entrypoint.mjs
var noop_entrypoint_exports = {};
__export(noop_entrypoint_exports, {
  server: () => server
});
var server;
var init_noop_entrypoint = __esm({
  "examples/testapp-ssr/.netlify/build/noop-entrypoint.mjs"() {
    server = {};
  }
});

// examples/testapp-ssr/.netlify/build/_noop-middleware.mjs
var noop_middleware_exports = {};
__export(noop_middleware_exports, {
  onRequest: () => onRequest
});
var onRequest;
var init_noop_middleware = __esm({
  "examples/testapp-ssr/.netlify/build/_noop-middleware.mjs"() {
    onRequest = (_, next) => next();
  }
});

// examples/testapp-ssr/.netlify/build/entry.mjs
init_renderers();

// examples/testapp-ssr/node_modules/@astrojs/netlify/dist/ssr-function.js
var ssr_function_exports = {};
__export(ssr_function_exports, {
  createExports: () => createExports
});

// examples/testapp-ssr/node_modules/astro/dist/core/app/node.js
init_node_fs();

// examples/testapp-ssr/node_modules/astro/dist/core/constants.js
var ASTRO_VERSION = "5.18.2";
var REROUTE_DIRECTIVE_HEADER = "X-Astro-Reroute";
var REWRITE_DIRECTIVE_HEADER_KEY = "X-Astro-Rewrite";
var REWRITE_DIRECTIVE_HEADER_VALUE = "yes";
var NOOP_MIDDLEWARE_HEADER = "X-Astro-Noop";
var ROUTE_TYPE_HEADER = "X-Astro-Route-Type";
var DEFAULT_404_COMPONENT = "astro-default-404.astro";
var REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308, 300, 304];
var REROUTABLE_STATUS_CODES = [404, 500];
var clientAddressSymbol = Symbol.for("astro.clientAddress");
var clientLocalsSymbol = Symbol.for("astro.locals");
var originPathnameSymbol = Symbol.for("astro.originPathname");
var nodeRequestAbortControllerCleanupSymbol = Symbol.for(
  "astro.nodeRequestAbortControllerCleanup"
);
var responseSentSymbol = Symbol.for("astro.responseSent");

// examples/testapp-ssr/node_modules/astro/dist/core/app/common.js
init_encryption();

// examples/testapp-ssr/node_modules/astro/dist/core/middleware/noop-middleware.js
var NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

// examples/testapp-ssr/node_modules/astro/dist/core/app/index.js
init_path();
init_remote();

// examples/testapp-ssr/node_modules/astro/dist/i18n/index.js
init_path();

// examples/testapp-ssr/node_modules/astro/dist/core/build/util.js
function shouldAppendForwardSlash(trailingSlash, buildFormat) {
  switch (trailingSlash) {
    case "always":
      return true;
    case "never":
      return false;
    case "ignore": {
      switch (buildFormat) {
        case "directory":
          return true;
        case "preserve":
        case "file":
          return false;
      }
    }
  }
}

// examples/testapp-ssr/node_modules/astro/dist/i18n/index.js
init_errors_data();
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/core/redirects/render.js
function redirectIsExternal(redirect) {
  if (typeof redirect === "string") {
    return redirect.startsWith("http://") || redirect.startsWith("https://");
  } else {
    return redirect.destination.startsWith("http://") || redirect.destination.startsWith("https://");
  }
}
async function renderRedirect(renderContext) {
  const {
    request: { method },
    routeData
  } = renderContext;
  const { redirect, redirectRoute } = routeData;
  const status = redirectRoute && typeof redirect === "object" ? redirect.status : method === "GET" ? 301 : 308;
  const headers = { location: encodeURI(redirectRouteGenerate(renderContext)) };
  if (redirect && redirectIsExternal(redirect)) {
    if (typeof redirect === "string") {
      return Response.redirect(redirect, status);
    } else {
      return Response.redirect(redirect.destination, status);
    }
  }
  return new Response(null, { status, headers });
}
function redirectRouteGenerate(renderContext) {
  const {
    params,
    routeData: { redirect, redirectRoute }
  } = renderContext;
  if (typeof redirectRoute !== "undefined") {
    return redirectRoute?.generate(params) || redirectRoute?.pathname || "/";
  } else if (typeof redirect === "string") {
    if (redirectIsExternal(redirect)) {
      return redirect;
    } else {
      let target = redirect;
      for (const param of Object.keys(params)) {
        const paramValue = params[param];
        target = target.replace(`[${param}]`, paramValue).replace(`[...${param}]`, paramValue);
      }
      return target;
    }
  } else if (typeof redirect === "undefined") {
    return "/";
  }
  return redirect.destination;
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/astro-component.js
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/astro-global.js
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/endpoint.js
init_dist2();
init_errors2();
init_errors_data();
async function renderEndpoint(mod2, context, isPrerendered, logger) {
  const { request, url } = context;
  const method = request.method.toUpperCase();
  let handler = mod2[method] ?? mod2["ALL"];
  if (!handler && method === "HEAD" && mod2["GET"]) {
    handler = mod2["GET"];
  }
  if (isPrerendered && !["GET", "HEAD"].includes(method)) {
    logger.warn(
      "router",
      `${url.pathname} ${s.bold(
        method
      )} requests are not available in static endpoints. Mark this page as server-rendered (\`export const prerender = false;\`) or update your config to \`output: 'server'\` to make all your pages server-rendered by default.`
    );
  }
  if (handler === void 0) {
    logger.warn(
      "router",
      `No API Route handler exists for the method "${method}" for the route "${url.pathname}".
Found handlers: ${Object.keys(mod2).map((exp) => JSON.stringify(exp)).join(", ")}
` + ("all" in mod2 ? `One of the exported handlers is "all" (lowercase), did you mean to export 'ALL'?
` : "")
    );
    return new Response(null, { status: 404 });
  }
  if (typeof handler !== "function") {
    logger.error(
      "router",
      `The route "${url.pathname}" exports a value for the method "${method}", but it is of the type ${typeof handler} instead of a function.`
    );
    return new Response(null, { status: 500 });
  }
  let response = await handler.call(mod2, context);
  if (!response || response instanceof Response === false) {
    throw new AstroError(EndpointDidNotReturnAResponse);
  }
  if (REROUTABLE_STATUS_CODES.includes(response.status)) {
    try {
      response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
    } catch (err) {
      if (err.message?.includes("immutable")) {
        response = new Response(response.body, response);
        response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
      } else {
        throw err;
      }
    }
  }
  if (method === "HEAD") {
    return new Response(null, response);
  }
  return response;
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/index.js
init_escape();

// examples/testapp-ssr/node_modules/astro/dist/jsx-runtime/index.js
var AstroJSX = "astro:jsx";
var Empty = Symbol("empty");
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/astro/factory.js
function isAstroComponentFactory(obj) {
  return obj == null ? false : obj.isAstroComponentFactory === true;
}
function isAPropagatingComponent(result, factory) {
  const hint = getPropagationHint(result, factory);
  return hint === "in-tree" || hint === "self";
}
function getPropagationHint(result, factory) {
  let hint = factory.propagation || "none";
  if (factory.moduleId && result.componentMetadata.has(factory.moduleId) && hint === "none") {
    hint = result.componentMetadata.get(factory.moduleId).propagation;
  }
  return hint;
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/component.js
init_clsx();
init_errors3();
init_escape();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/hydration.js
init_errors3();
init_escape();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/serialize.js
var PROP_TYPE = {
  Value: 0,
  JSON: 1,
  // Actually means Array
  RegExp: 2,
  Date: 3,
  Map: 4,
  Set: 5,
  BigInt: 6,
  URL: 7,
  Uint8Array: 8,
  Uint16Array: 9,
  Uint32Array: 10,
  Infinity: 11
};
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = value.map((v2) => {
    return convertToSerializedForm(v2, metadata, parents);
  });
  parents.delete(value);
  return serialized;
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = Object.fromEntries(
    Object.entries(value).map(([k2, v2]) => {
      return [k2, convertToSerializedForm(v2, metadata, parents)];
    })
  );
  parents.delete(value);
  return serialized;
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [PROP_TYPE.Map, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object Set]": {
      return [PROP_TYPE.Set, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, serializeArray(value, metadata, parents)];
    }
    case "[object Uint8Array]": {
      return [PROP_TYPE.Uint8Array, Array.from(value)];
    }
    case "[object Uint16Array]": {
      return [PROP_TYPE.Uint16Array, Array.from(value)];
    }
    case "[object Uint32Array]": {
      return [PROP_TYPE.Uint32Array, Array.from(value)];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value, metadata, parents)];
      }
      if (value === Infinity) {
        return [PROP_TYPE.Infinity, 1];
      }
      if (value === -Infinity) {
        return [PROP_TYPE.Infinity, -1];
      }
      if (value === void 0) {
        return [PROP_TYPE.Value];
      }
      return [PROP_TYPE.Value, value];
    }
  }
}
function serializeProps(props, metadata) {
  const serialized = JSON.stringify(serializeObject(props, metadata));
  return serialized;
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/hydration.js
var transitionDirectivesToCopyOnIsland = Object.freeze([
  "data-astro-transition-scope",
  "data-astro-transition-persist",
  "data-astro-transition-persist-props"
]);
function extractDirectives(inputProps, clientDirectives) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {},
    propsWithoutTransitionAttributes: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        // This is a special prop added to prove that the client hydration method
        // was added statically.
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!clientDirectives.has(extracted.hydration.directive)) {
            const hydrationMethods = Array.from(clientDirectives.keys()).map((d) => `client:${d}`).join(", ");
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${hydrationMethods}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new AstroError(errors_data_exports.MissingMediaQueryDirective);
          }
          break;
        }
      }
    } else {
      extracted.props[key] = value;
      if (!transitionDirectivesToCopyOnIsland.includes(key)) {
        extracted.propsWithoutTransitionAttributes[key] = value;
      }
    }
  }
  for (const sym of Object.getOwnPropertySymbols(inputProps)) {
    extracted.props[sym] = inputProps[sym];
    extracted.propsWithoutTransitionAttributes[sym] = inputProps[sym];
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new AstroError({
      ...errors_data_exports.NoMatchingImport,
      message: errors_data_exports.NoMatchingImport.message(metadata.displayName)
    });
  }
  const island = {
    children: "",
    props: {
      // This is for HMR, probably can avoid it in prod
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = escapeHTML(value);
    }
  }
  island.props["component-url"] = await result.resolve(decodeURI(componentUrl));
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(
      decodeURI(renderer.clientEntrypoint.toString())
    );
    island.props["props"] = escapeHTML(serializeProps(props, metadata));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  let beforeHydrationUrl = await result.resolve("astro:scripts/before-hydration.js");
  if (beforeHydrationUrl.length) {
    island.props["before-hydration-url"] = beforeHydrationUrl;
  }
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  transitionDirectivesToCopyOnIsland.forEach((name) => {
    if (typeof props[name] !== "undefined") {
      island.props[name] = props[name];
    }
  });
  return island;
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/component.js
init_shorthash();
init_util2();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/astro/head-and-content.js
var headAndContentSym = Symbol.for("astro.headAndContent");
function isHeadAndContent(obj) {
  return typeof obj === "object" && obj !== null && !!obj[headAndContentSym];
}
function createThinHead() {
  return {
    [headAndContentSym]: true
  };
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/astro/instance.js
init_util2();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/any.js
init_escape();
init_util2();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/common.js
init_escape();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/astro-island.prebuilt.js
var astro_island_prebuilt_default = `(()=>{var A=Object.defineProperty;var g=(i,o,a)=>o in i?A(i,o,{enumerable:!0,configurable:!0,writable:!0,value:a}):i[o]=a;var d=(i,o,a)=>g(i,typeof o!="symbol"?o+"":o,a);{let i={0:t=>m(t),1:t=>a(t),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(a(t)),5:t=>new Set(a(t)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(t),9:t=>new Uint16Array(t),10:t=>new Uint32Array(t),11:t=>1/0*t},o=t=>{let[l,e]=t;return l in i?i[l](e):void 0},a=t=>t.map(o),m=t=>typeof t!="object"||t===null?t:Object.fromEntries(Object.entries(t).map(([l,e])=>[l,o(e)]));class y extends HTMLElement{constructor(){super(...arguments);d(this,"Component");d(this,"hydrator");d(this,"hydrate",async()=>{var b;if(!this.hydrator||!this.isConnected)return;let e=(b=this.parentElement)==null?void 0:b.closest("astro-island[ssr]");if(e){e.addEventListener("astro:hydrate",this.hydrate,{once:!0});return}let c=this.querySelectorAll("astro-slot"),n={},h=this.querySelectorAll("template[data-astro-template]");for(let r of h){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(let r of c){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("name")||"default"]=r.innerHTML)}let p;try{p=this.hasAttribute("props")?m(JSON.parse(this.getAttribute("props"))):{}}catch(r){let s=this.getAttribute("component-url")||"<unknown>",v=this.getAttribute("component-export");throw v&&(s+=\` (export \${v})\`),console.error(\`[hydrate] Error parsing props for component \${s}\`,this.getAttribute("props"),r),r}let u;await this.hydrator(this)(this.Component,p,n,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),this.dispatchEvent(new CustomEvent("astro:hydrate"))});d(this,"unmount",()=>{this.isConnected||this.dispatchEvent(new CustomEvent("astro:unmount"))})}disconnectedCallback(){document.removeEventListener("astro:after-swap",this.unmount),document.addEventListener("astro:after-swap",this.unmount,{once:!0})}connectedCallback(){if(!this.hasAttribute("await-children")||document.readyState==="interactive"||document.readyState==="complete")this.childrenConnectedCallback();else{let e=()=>{document.removeEventListener("DOMContentLoaded",e),c.disconnect(),this.childrenConnectedCallback()},c=new MutationObserver(()=>{var n;((n=this.lastChild)==null?void 0:n.nodeType)===Node.COMMENT_NODE&&this.lastChild.nodeValue==="astro:end"&&(this.lastChild.remove(),e())});c.observe(this,{childList:!0}),document.addEventListener("DOMContentLoaded",e)}}async childrenConnectedCallback(){let e=this.getAttribute("before-hydration-url");e&&await import(e),this.start()}async start(){let e=JSON.parse(this.getAttribute("opts")),c=this.getAttribute("client");if(Astro[c]===void 0){window.addEventListener(\`astro:\${c}\`,()=>this.start(),{once:!0});return}try{await Astro[c](async()=>{let n=this.getAttribute("renderer-url"),[h,{default:p}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),u=this.getAttribute("component-export")||"default";if(!u.includes("."))this.Component=h[u];else{this.Component=h;for(let f of u.split("."))this.Component=this.Component[f]}return this.hydrator=p,this.hydrate},e,this)}catch(n){console.error(\`[astro-island] Error hydrating \${this.getAttribute("component-url")}\`,n)}}attributeChangedCallback(){this.hydrate()}}d(y,"observedAttributes",["props"]),customElements.get("astro-island")||customElements.define("astro-island",y)}})();`;

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/astro-island-styles.js
var ISLAND_STYLES = "astro-island,astro-slot,astro-static-slot{display:contents}";

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/scripts.js
function determineIfNeedsHydrationScript(result) {
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(result, directive) {
  const clientDirectives = result.clientDirectives;
  const clientDirective = clientDirectives.get(directive);
  if (!clientDirective) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  return clientDirective;
}
function getPrescripts(result, type, directive) {
  switch (type) {
    case "both":
      return `<style>${ISLAND_STYLES}</style><script>${getDirectiveScriptText(result, directive)}</script><script>${false ? astro_island_prebuilt_dev_default : astro_island_prebuilt_default}</script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(result, directive)}</script>`;
  }
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/head.js
init_escape();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/csp.js
function renderCspContent(result) {
  const finalScriptHashes = /* @__PURE__ */ new Set();
  const finalStyleHashes = /* @__PURE__ */ new Set();
  for (const scriptHash of result.scriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  for (const styleHash of result.styleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const styleHash of result._metadata.extraStyleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const scriptHash of result._metadata.extraScriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  let directives;
  if (result.directives.length > 0) {
    directives = result.directives.join(";") + ";";
  }
  let scriptResources = "'self'";
  if (result.scriptResources.length > 0) {
    scriptResources = result.scriptResources.map((r5) => `${r5}`).join(" ");
  }
  let styleResources = "'self'";
  if (result.styleResources.length > 0) {
    styleResources = result.styleResources.map((r5) => `${r5}`).join(" ");
  }
  const strictDynamic = result.isStrictDynamic ? ` 'strict-dynamic'` : "";
  const scriptSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(" ")}${strictDynamic};`;
  const styleSrc = `style-src ${styleResources} ${Array.from(finalStyleHashes).join(" ")};`;
  return [directives, scriptSrc, styleSrc].filter(Boolean).join(" ");
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/instruction.js
var RenderInstructionSymbol = Symbol.for("astro:render");
function createRenderInstruction(instruction) {
  return Object.defineProperty(instruction, RenderInstructionSymbol, {
    value: true
  });
}
function isRenderInstruction(chunk) {
  return chunk && typeof chunk === "object" && chunk[RenderInstructionSymbol];
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/head.js
init_util3();
var uniqueElements = (item, index, all) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i2) => JSON.stringify(i2.props) === props && i2.children == children);
};
function renderAllHeadContent(result) {
  result._metadata.hasRenderedHead = true;
  let content = "";
  if (result.shouldInjectCspMetaTags && result.cspDestination === "meta") {
    content += renderElement(
      "meta",
      {
        props: {
          "http-equiv": "content-security-policy",
          content: renderCspContent(result)
        },
        children: ""
      },
      false
    );
  }
  const styles = Array.from(result.styles).filter(uniqueElements).map(
    (style) => style.props.rel === "stylesheet" ? renderElement("link", style) : renderElement("style", style)
  );
  result.styles.clear();
  const scripts = Array.from(result.scripts).filter(uniqueElements).map((script) => {
    if (result.userAssetsBase) {
      script.props.src = (result.base === "/" ? "" : result.base) + result.userAssetsBase + script.props.src;
    }
    return renderElement("script", script, false);
  });
  const links = Array.from(result.links).filter(uniqueElements).map((link) => renderElement("link", link, false));
  content += styles.join("\n") + links.join("\n") + scripts.join("\n");
  if (result._metadata.extraHead.length > 0) {
    for (const part of result._metadata.extraHead) {
      content += part;
    }
  }
  return markHTMLString(content);
}
function maybeRenderHead() {
  return createRenderInstruction({ type: "maybe-head" });
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/server-islands.js
init_encryption();
init_escape();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/slot.js
init_escape();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/astro/render-template.js
init_escape();
init_util2();
init_util3();
var renderTemplateResultSym = Symbol.for("astro.renderTemplateResult");
var RenderTemplateResult = class {
  [renderTemplateResultSym] = true;
  htmlParts;
  expressions;
  error;
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.error = void 0;
    this.expressions = expressions.map((expression) => {
      if (isPromise(expression)) {
        return Promise.resolve(expression).catch((err) => {
          if (!this.error) {
            this.error = err;
            throw err;
          }
        });
      }
      return expression;
    });
  }
  render(destination) {
    const flushers = this.expressions.map((exp) => {
      return createBufferedRenderer(destination, (bufferDestination) => {
        if (exp || exp === 0) {
          return renderChild(bufferDestination, exp);
        }
      });
    });
    let i2 = 0;
    const iterate = () => {
      while (i2 < this.htmlParts.length) {
        const html = this.htmlParts[i2];
        const flusher = flushers[i2];
        i2++;
        if (html) {
          destination.write(markHTMLString(html));
        }
        if (flusher) {
          const result = flusher.flush();
          if (isPromise(result)) {
            return result.then(iterate);
          }
        }
      }
    };
    return iterate();
  }
};
function isRenderTemplateResult(obj) {
  return typeof obj === "object" && obj !== null && !!obj[renderTemplateResultSym];
}
function renderTemplate(htmlParts, ...expressions) {
  return new RenderTemplateResult(htmlParts, expressions);
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/slot.js
var slotString = Symbol.for("astro:slot-string");
var SlotString = class extends HTMLString {
  instructions;
  [slotString];
  constructor(content, instructions) {
    super(content);
    this.instructions = instructions;
    this[slotString] = true;
  }
};
function isSlotString(str) {
  return !!str[slotString];
}
function mergeSlotInstructions(target, source) {
  if (source.instructions?.length) {
    target ??= [];
    target.push(...source.instructions);
  }
  return target;
}
function renderSlot(result, slotted, fallback) {
  if (!slotted && fallback) {
    return renderSlot(result, fallback);
  }
  return {
    async render(destination) {
      await renderChild(destination, typeof slotted === "function" ? slotted(result) : slotted);
    }
  };
}
async function renderSlotToString(result, slotted, fallback) {
  let content = "";
  let instructions = null;
  const temporaryDestination = {
    write(chunk) {
      if (chunk instanceof SlotString) {
        content += chunk;
        instructions = mergeSlotInstructions(instructions, chunk);
      } else if (chunk instanceof Response) return;
      else if (typeof chunk === "object" && "type" in chunk && typeof chunk.type === "string") {
        if (instructions === null) {
          instructions = [];
        }
        instructions.push(chunk);
      } else {
        content += chunkToString(result, chunk);
      }
    }
  };
  const renderInstance = renderSlot(result, slotted, fallback);
  await renderInstance.render(temporaryDestination);
  return markHTMLString(new SlotString(content, instructions));
}
async function renderSlots(result, slots = {}) {
  let slotInstructions = null;
  let children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlotToString(result, value).then((output) => {
          if (output.instructions) {
            if (slotInstructions === null) {
              slotInstructions = [];
            }
            slotInstructions.push(...output.instructions);
          }
          children[key] = output;
        })
      )
    );
  }
  return { slotInstructions, children };
}
function createSlotValueFromString(content) {
  return function() {
    return renderTemplate`${unescapeHTML(content)}`;
  };
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/server-islands.js
var internalProps = /* @__PURE__ */ new Set([
  "server:component-path",
  "server:component-export",
  "server:component-directive",
  "server:defer"
]);
function containsServerDirective(props) {
  return "server:component-directive" in props;
}
var SCRIPT_RE = /<\/script/giu;
var COMMENT_RE = /<!--/gu;
var SCRIPT_REPLACER = "<\\/script";
var COMMENT_REPLACER = "\\u003C!--";
function safeJsonStringify(obj) {
  return JSON.stringify(obj).replace(SCRIPT_RE, SCRIPT_REPLACER).replace(COMMENT_RE, COMMENT_REPLACER);
}
function createSearchParams(encryptedComponentExport, encryptedProps, slots) {
  const params = new URLSearchParams();
  params.set("e", encryptedComponentExport);
  params.set("p", encryptedProps);
  params.set("s", slots);
  return params;
}
function isWithinURLLimit(pathname, params) {
  const url = pathname + "?" + params.toString();
  const chars = url.length;
  return chars < 2048;
}
var ServerIslandComponent = class {
  result;
  props;
  slots;
  displayName;
  hostId;
  islandContent;
  componentPath;
  componentExport;
  componentId;
  constructor(result, props, slots, displayName) {
    this.result = result;
    this.props = props;
    this.slots = slots;
    this.displayName = displayName;
  }
  async init() {
    const content = await this.getIslandContent();
    if (this.result.cspDestination) {
      this.result._metadata.extraScriptHashes.push(
        await generateCspDigest(SERVER_ISLAND_REPLACER, this.result.cspAlgorithm)
      );
      const contentDigest = await generateCspDigest(content, this.result.cspAlgorithm);
      this.result._metadata.extraScriptHashes.push(contentDigest);
    }
    return createThinHead();
  }
  async render(destination) {
    const hostId = await this.getHostId();
    const islandContent = await this.getIslandContent();
    destination.write(createRenderInstruction({ type: "server-island-runtime" }));
    destination.write("<!--[if astro]>server-island-start<![endif]-->");
    for (const name in this.slots) {
      if (name === "fallback") {
        await renderChild(destination, this.slots.fallback(this.result));
      }
    }
    destination.write(
      `<script type="module" data-astro-rerun data-island-id="${hostId}">${islandContent}</script>`
    );
  }
  getComponentPath() {
    if (this.componentPath) {
      return this.componentPath;
    }
    const componentPath = this.props["server:component-path"];
    if (!componentPath) {
      throw new Error(`Could not find server component path`);
    }
    this.componentPath = componentPath;
    return componentPath;
  }
  getComponentExport() {
    if (this.componentExport) {
      return this.componentExport;
    }
    const componentExport = this.props["server:component-export"];
    if (!componentExport) {
      throw new Error(`Could not find server component export`);
    }
    this.componentExport = componentExport;
    return componentExport;
  }
  async getHostId() {
    if (!this.hostId) {
      this.hostId = await crypto.randomUUID();
    }
    return this.hostId;
  }
  async getIslandContent() {
    if (this.islandContent) {
      return this.islandContent;
    }
    const componentPath = this.getComponentPath();
    const componentExport = this.getComponentExport();
    const componentId = this.result.serverIslandNameMap.get(componentPath);
    if (!componentId) {
      throw new Error(`Could not find server component name`);
    }
    for (const key2 of Object.keys(this.props)) {
      if (internalProps.has(key2)) {
        delete this.props[key2];
      }
    }
    const renderedSlots = {};
    for (const name in this.slots) {
      if (name !== "fallback") {
        const content = await renderSlotToString(this.result, this.slots[name]);
        renderedSlots[name] = content.toString();
      }
    }
    const key = await this.result.key;
    const componentExportEncrypted = await encryptString(key, componentExport);
    const propsEncrypted = Object.keys(this.props).length === 0 ? "" : await encryptString(key, JSON.stringify(this.props));
    const slotsEncrypted = Object.keys(renderedSlots).length === 0 ? "" : await encryptString(key, JSON.stringify(renderedSlots));
    const hostId = await this.getHostId();
    const slash2 = this.result.base.endsWith("/") ? "" : "/";
    let serverIslandUrl = `${this.result.base}${slash2}_server-islands/${componentId}${this.result.trailingSlash === "always" ? "/" : ""}`;
    const potentialSearchParams = createSearchParams(
      componentExportEncrypted,
      propsEncrypted,
      slotsEncrypted
    );
    const useGETRequest = isWithinURLLimit(serverIslandUrl, potentialSearchParams);
    if (useGETRequest) {
      serverIslandUrl += "?" + potentialSearchParams.toString();
      this.result._metadata.extraHead.push(
        markHTMLString(
          `<link rel="preload" as="fetch" href="${serverIslandUrl}" crossorigin="anonymous">`
        )
      );
    }
    const adapterHeaders = this.result.internalFetchHeaders || {};
    const headersJson = safeJsonStringify(adapterHeaders);
    const method = useGETRequest ? (
      // GET request
      `const headers = new Headers(${headersJson});
let response = await fetch('${serverIslandUrl}', { headers });`
    ) : (
      // POST request
      `let data = {
	encryptedComponentExport: ${safeJsonStringify(componentExportEncrypted)},
	encryptedProps: ${safeJsonStringify(propsEncrypted)},
	encryptedSlots: ${safeJsonStringify(slotsEncrypted)},
};
const headers = new Headers({ 'Content-Type': 'application/json', ...${headersJson} });
let response = await fetch('${serverIslandUrl}', {
	method: 'POST',
	body: JSON.stringify(data),
	headers,
});`
    );
    this.islandContent = `${method}replaceServerIsland('${hostId}', response);`;
    return this.islandContent;
  }
};
var renderServerIslandRuntime = () => {
  return `<script>${SERVER_ISLAND_REPLACER}</script>`;
};
var SERVER_ISLAND_REPLACER = markHTMLString(
  `async function replaceServerIsland(id, r) {
	let s = document.querySelector(\`script[data-island-id="\${id}"]\`);
	// If there's no matching script, or the request fails then return
	if (!s || r.status !== 200 || r.headers.get('content-type')?.split(';')[0].trim() !== 'text/html') return;
	// Load the HTML before modifying the DOM in case of errors
	let html = await r.text();
	// Remove any placeholder content before the island script
	while (s.previousSibling && s.previousSibling.nodeType !== 8 && s.previousSibling.data !== '[if astro]>server-island-start<![endif]')
		s.previousSibling.remove();
	s.previousSibling?.remove();
	// Insert the new HTML
	s.before(document.createRange().createContextualFragment(html));
	// Remove the script. Prior to v5.4.2, this was the trick to force rerun of scripts.  Keeping it to minimize change to the existing behavior.
	s.remove();
}`.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("//")).join(" ")
);

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/common.js
var Fragment = Symbol.for("astro:fragment");
var Renderer = Symbol.for("astro:renderer");
var encoder2 = new TextEncoder();
var decoder2 = new TextDecoder();
function stringifyChunk(result, chunk) {
  if (isRenderInstruction(chunk)) {
    const instruction = chunk;
    switch (instruction.type) {
      case "directive": {
        const { hydration } = instruction;
        let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
        let needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
        if (needsHydrationScript) {
          let prescripts = getPrescripts(result, "both", hydration.directive);
          return markHTMLString(prescripts);
        } else if (needsDirectiveScript) {
          let prescripts = getPrescripts(result, "directive", hydration.directive);
          return markHTMLString(prescripts);
        } else {
          return "";
        }
      }
      case "head": {
        if (result._metadata.hasRenderedHead || result.partial) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "maybe-head": {
        if (result._metadata.hasRenderedHead || result._metadata.headInTree || result.partial) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "renderer-hydration-script": {
        const { rendererSpecificHydrationScripts } = result._metadata;
        const { rendererName } = instruction;
        if (!rendererSpecificHydrationScripts.has(rendererName)) {
          rendererSpecificHydrationScripts.add(rendererName);
          return instruction.render();
        }
        return "";
      }
      case "server-island-runtime": {
        if (result._metadata.hasRenderedServerIslandRuntime) {
          return "";
        }
        result._metadata.hasRenderedServerIslandRuntime = true;
        return renderServerIslandRuntime();
      }
      case "script": {
        const { id, content } = instruction;
        if (result._metadata.renderedScripts.has(id)) {
          return "";
        }
        result._metadata.renderedScripts.add(id);
        return content;
      }
      default: {
        throw new Error(`Unknown chunk type: ${chunk.type}`);
      }
    }
  } else if (chunk instanceof Response) {
    return "";
  } else if (isSlotString(chunk)) {
    let out = "";
    const c2 = chunk;
    if (c2.instructions) {
      for (const instr of c2.instructions) {
        out += stringifyChunk(result, instr);
      }
    }
    out += chunk.toString();
    return out;
  }
  return chunk.toString();
}
function chunkToString(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return decoder2.decode(chunk);
  } else {
    return stringifyChunk(result, chunk);
  }
}
function chunkToByteArray(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return chunk;
  } else {
    const stringified = stringifyChunk(result, chunk);
    return encoder2.encode(stringified.toString());
  }
}
function chunkToByteArrayOrString(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return chunk;
  } else {
    return stringifyChunk(result, chunk).toString();
  }
}
function isRenderInstance(obj) {
  return !!obj && typeof obj === "object" && "render" in obj && typeof obj.render === "function";
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/any.js
init_util3();
function renderChild(destination, child) {
  if (isPromise(child)) {
    return child.then((x2) => renderChild(destination, x2));
  }
  if (child instanceof SlotString) {
    destination.write(child);
    return;
  }
  if (isHTMLString(child)) {
    destination.write(child);
    return;
  }
  if (Array.isArray(child)) {
    return renderArray(destination, child);
  }
  if (typeof child === "function") {
    return renderChild(destination, child());
  }
  if (!child && child !== 0) {
    return;
  }
  if (typeof child === "string") {
    destination.write(markHTMLString(escapeHTML(child)));
    return;
  }
  if (isRenderInstance(child)) {
    return child.render(destination);
  }
  if (isRenderTemplateResult(child)) {
    return child.render(destination);
  }
  if (isAstroComponentInstance(child)) {
    return child.render(destination);
  }
  if (ArrayBuffer.isView(child)) {
    destination.write(child);
    return;
  }
  if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    if (Symbol.asyncIterator in child) {
      return renderAsyncIterable(destination, child);
    }
    return renderIterable(destination, child);
  }
  destination.write(child);
}
function renderArray(destination, children) {
  const flushers = children.map((c2) => {
    return createBufferedRenderer(destination, (bufferDestination) => {
      return renderChild(bufferDestination, c2);
    });
  });
  const iterator = flushers[Symbol.iterator]();
  const iterate = () => {
    for (; ; ) {
      const { value: flusher, done } = iterator.next();
      if (done) {
        break;
      }
      const result = flusher.flush();
      if (isPromise(result)) {
        return result.then(iterate);
      }
    }
  };
  return iterate();
}
function renderIterable(destination, children) {
  const iterator = children[Symbol.iterator]();
  const iterate = () => {
    for (; ; ) {
      const { value, done } = iterator.next();
      if (done) {
        break;
      }
      const result = renderChild(destination, value);
      if (isPromise(result)) {
        return result.then(iterate);
      }
    }
  };
  return iterate();
}
async function renderAsyncIterable(destination, children) {
  for await (const value of children) {
    await renderChild(destination, value);
  }
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/astro/instance.js
var astroComponentInstanceSym = Symbol.for("astro.componentInstance");
var AstroComponentInstance = class {
  [astroComponentInstanceSym] = true;
  result;
  props;
  slotValues;
  factory;
  returnValue;
  constructor(result, props, slots, factory) {
    this.result = result;
    this.props = props;
    this.factory = factory;
    this.slotValues = {};
    for (const name in slots) {
      let didRender = false;
      let value = slots[name](result);
      this.slotValues[name] = () => {
        if (!didRender) {
          didRender = true;
          return value;
        }
        return slots[name](result);
      };
    }
  }
  init(result) {
    if (this.returnValue !== void 0) {
      return this.returnValue;
    }
    this.returnValue = this.factory(result, this.props, this.slotValues);
    if (isPromise(this.returnValue)) {
      this.returnValue.then((resolved) => {
        this.returnValue = resolved;
      }).catch(() => {
      });
    }
    return this.returnValue;
  }
  render(destination) {
    const returnValue = this.init(this.result);
    if (isPromise(returnValue)) {
      return returnValue.then((x2) => this.renderImpl(destination, x2));
    }
    return this.renderImpl(destination, returnValue);
  }
  renderImpl(destination, returnValue) {
    if (isHeadAndContent(returnValue)) {
      return returnValue.content.render(destination);
    } else {
      return renderChild(destination, returnValue);
    }
  }
};
function validateComponentProps(props, clientDirectives, displayName) {
  if (props != null) {
    const directives = [...clientDirectives.keys()].map((directive) => `client:${directive}`);
    for (const prop of Object.keys(props)) {
      if (directives.includes(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
function createAstroComponentInstance(result, displayName, factory, props, slots = {}) {
  validateComponentProps(props, result.clientDirectives, displayName);
  const instance = new AstroComponentInstance(result, props, slots, factory);
  if (isAPropagatingComponent(result, factory)) {
    result._metadata.propagators.add(instance);
  }
  return instance;
}
function isAstroComponentInstance(obj) {
  return typeof obj === "object" && obj !== null && !!obj[astroComponentInstanceSym];
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/astro/render.js
init_errors3();
init_util2();
init_util3();
var DOCTYPE_EXP = /<!doctype html/i;
async function renderToString(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let str = "";
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          str += doctype;
        }
      }
      if (chunk instanceof Response) return;
      str += chunkToString(result, chunk);
    }
  };
  await templateResult.render(destination);
  return str;
}
async function renderToReadableStream(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  return new ReadableStream({
    start(controller) {
      const destination = {
        write(chunk) {
          if (isPage && !renderedFirstPageChunk) {
            renderedFirstPageChunk = true;
            if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
              const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
              controller.enqueue(encoder2.encode(doctype));
            }
          }
          if (chunk instanceof Response) {
            throw new AstroError({
              ...errors_data_exports.ResponseSentError
            });
          }
          const bytes = chunkToByteArray(result, chunk);
          controller.enqueue(bytes);
        }
      };
      (async () => {
        try {
          await templateResult.render(destination);
          controller.close();
        } catch (e2) {
          if (AstroError.is(e2) && !e2.loc) {
            e2.setLocation({
              file: route?.component
            });
          }
          setTimeout(() => controller.error(e2), 0);
        }
      })();
    },
    cancel() {
      result.cancelled = true;
    }
  });
}
async function callComponentAsTemplateResultOrResponse(result, componentFactory, props, children, route) {
  const factoryResult = await componentFactory(result, props, children);
  if (factoryResult instanceof Response) {
    return factoryResult;
  } else if (isHeadAndContent(factoryResult)) {
    if (!isRenderTemplateResult(factoryResult.content)) {
      throw new AstroError({
        ...errors_data_exports.OnlyResponseCanBeReturned,
        message: errors_data_exports.OnlyResponseCanBeReturned.message(
          route?.route,
          typeof factoryResult
        ),
        location: {
          file: route?.component
        }
      });
    }
    return factoryResult.content;
  } else if (!isRenderTemplateResult(factoryResult)) {
    throw new AstroError({
      ...errors_data_exports.OnlyResponseCanBeReturned,
      message: errors_data_exports.OnlyResponseCanBeReturned.message(route?.route, typeof factoryResult),
      location: {
        file: route?.component
      }
    });
  }
  return factoryResult;
}
async function bufferHeadContent(result) {
  const iterator = result._metadata.propagators.values();
  while (true) {
    const { value, done } = iterator.next();
    if (done) {
      break;
    }
    const returnValue = await value.init(result);
    if (isHeadAndContent(returnValue) && returnValue.head) {
      result._metadata.extraHead.push(returnValue.head);
    }
  }
}
async function renderToAsyncIterable(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  let error2 = null;
  let next = null;
  const buffer2 = [];
  let renderingComplete = false;
  const iterator = {
    async next() {
      if (result.cancelled) return { done: true, value: void 0 };
      if (next !== null) {
        await next.promise;
      } else if (!renderingComplete && !buffer2.length) {
        next = promiseWithResolvers();
        await next.promise;
      }
      if (!renderingComplete) {
        next = promiseWithResolvers();
      }
      if (error2) {
        throw error2;
      }
      let length = 0;
      let stringToEncode = "";
      for (let i2 = 0, len = buffer2.length; i2 < len; i2++) {
        const bufferEntry = buffer2[i2];
        if (typeof bufferEntry === "string") {
          const nextIsString = i2 + 1 < len && typeof buffer2[i2 + 1] === "string";
          stringToEncode += bufferEntry;
          if (!nextIsString) {
            const encoded = encoder2.encode(stringToEncode);
            length += encoded.length;
            stringToEncode = "";
            buffer2[i2] = encoded;
          } else {
            buffer2[i2] = "";
          }
        } else {
          length += bufferEntry.length;
        }
      }
      let mergedArray = new Uint8Array(length);
      let offset = 0;
      for (let i2 = 0, len = buffer2.length; i2 < len; i2++) {
        const item = buffer2[i2];
        if (item === "") {
          continue;
        }
        mergedArray.set(item, offset);
        offset += item.length;
      }
      buffer2.length = 0;
      const returnValue = {
        // The iterator is done when rendering has finished
        // and there are no more chunks to return.
        done: length === 0 && renderingComplete,
        value: mergedArray
      };
      return returnValue;
    },
    async return() {
      result.cancelled = true;
      return { done: true, value: void 0 };
    }
  };
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          buffer2.push(encoder2.encode(doctype));
        }
      }
      if (chunk instanceof Response) {
        throw new AstroError(errors_data_exports.ResponseSentError);
      }
      const bytes = chunkToByteArrayOrString(result, chunk);
      if (bytes.length > 0) {
        buffer2.push(bytes);
        next?.resolve();
      } else if (buffer2.length > 0) {
        next?.resolve();
      }
    }
  };
  const renderResult = toPromise(() => templateResult.render(destination));
  renderResult.catch((err) => {
    error2 = err;
  }).finally(() => {
    renderingComplete = true;
    next?.resolve();
  });
  return {
    [Symbol.asyncIterator]() {
      return iterator;
    }
  };
}
function toPromise(fn) {
  try {
    const result = fn();
    return isPromise(result) ? result : Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/dom.js
init_escape();
init_util3();
function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlotToString(result, slots?.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName) return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/component.js
init_util3();
var needsHeadRenderingSymbol = Symbol.for("astro.needsHeadRendering");
var rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
var clientOnlyValues = /* @__PURE__ */ new Set(["solid-js", "react", "preact", "vue", "svelte"]);
function guessRenderers(componentUrl) {
  const extname2 = componentUrl?.split(".").pop();
  switch (extname2) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/solid-js", "@astrojs/vue (jsx)"];
    case void 0:
    default:
      return [
        "@astrojs/react",
        "@astrojs/preact",
        "@astrojs/solid-js",
        "@astrojs/vue",
        "@astrojs/svelte"
      ];
  }
}
function isFragmentComponent(Component) {
  return Component === Fragment;
}
function isHTMLComponent(Component) {
  return Component && Component["astro:html"] === true;
}
var ASTRO_SLOT_EXP = /<\/?astro-slot\b[^>]*>/g;
var ASTRO_STATIC_SLOT_EXP = /<\/?astro-static-slot\b[^>]*>/g;
function removeStaticAstroSlot(html, supportsAstroStaticSlot = true) {
  const exp = supportsAstroStaticSlot ? ASTRO_STATIC_SLOT_EXP : ASTRO_SLOT_EXP;
  return html.replace(exp, "");
}
async function renderFrameworkComponent(result, displayName, Component, _props, slots = {}) {
  if (!Component && "client:only" in _props === false) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers: renderers2, clientDirectives } = result;
  const metadata = {
    astroStaticSlot: true,
    displayName
  };
  const { hydration, isPage, props, propsWithoutTransitionAttributes } = extractDirectives(
    _props,
    clientDirectives
  );
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  const validRenderers = renderers2.filter((r5) => r5.name !== "astro:jsx");
  const { children, slotInstructions } = await renderSlots(result, slots);
  let renderer;
  if (metadata.hydrate !== "only") {
    let isTagged = false;
    try {
      isTagged = Component && Component[Renderer];
    } catch {
    }
    if (isTagged) {
      const rendererName = Component[Renderer];
      renderer = renderers2.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error2;
      for (const r5 of renderers2) {
        try {
          if (await r5.ssr.check.call({ result }, Component, props, children)) {
            renderer = r5;
            break;
          }
        } catch (e2) {
          error2 ??= e2;
        }
      }
      if (!renderer && error2) {
        throw error2;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = await renderHTMLElement(
        result,
        Component,
        _props,
        slots
      );
      return {
        render(destination) {
          destination.write(output);
        }
      };
    }
  } else {
    if (metadata.hydrateArgs) {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        renderer = renderers2.find(
          ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
        );
      }
    }
    if (!renderer && validRenderers.length === 1) {
      renderer = validRenderers[0];
    }
    if (!renderer) {
      const extname2 = metadata.componentUrl?.split(".").pop();
      renderer = renderers2.find(({ name }) => name === `@astrojs/${extname2}` || name === extname2);
    }
  }
  let componentServerRenderEndTime;
  if (!renderer) {
    if (metadata.hydrate === "only") {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        const plural = validRenderers.length > 1;
        throw new AstroError({
          ...errors_data_exports.NoMatchingRenderer,
          message: errors_data_exports.NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: errors_data_exports.NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r5) => "`" + r5 + "`"))
          )
        });
      } else {
        throw new AstroError({
          ...errors_data_exports.NoClientOnlyHint,
          message: errors_data_exports.NoClientOnlyHint.message(metadata.displayName),
          hint: errors_data_exports.NoClientOnlyHint.hint(
            probableRendererNames.map((r5) => r5.replace("@astrojs/", "")).join("|")
          )
        });
      }
    } else if (typeof Component !== "string") {
      const matchingRenderers = validRenderers.filter(
        (r5) => probableRendererNames.includes(r5.name)
      );
      const plural = validRenderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new AstroError({
          ...errors_data_exports.NoMatchingRenderer,
          message: errors_data_exports.NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: errors_data_exports.NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r5) => "`" + r5 + "`"))
          )
        });
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          propsWithoutTransitionAttributes,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlotToString(result, slots?.fallback);
    } else {
      const componentRenderStartTime = performance.now();
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        propsWithoutTransitionAttributes,
        children,
        metadata
      ));
      if (false)
        componentServerRenderEndTime = performance.now() - componentRenderStartTime;
    }
  }
  if (!html && typeof Component === "string") {
    const Tag = sanitizeElementName(Component);
    const childSlots = Object.values(children).join("");
    const renderTemplateResult = renderTemplate`<${Tag}${internalSpreadAttributes(
      props,
      true,
      Tag
    )}${markHTMLString(
      childSlots === "" && voidElementNames.test(Tag) ? `/>` : `>${childSlots}</${Tag}>`
    )}`;
    html = "";
    const destination = {
      write(chunk) {
        if (chunk instanceof Response) return;
        html += chunkToString(result, chunk);
      }
    };
    await renderTemplateResult.render(destination);
  }
  if (!hydration) {
    return {
      render(destination) {
        if (slotInstructions) {
          for (const instruction of slotInstructions) {
            destination.write(instruction);
          }
        }
        if (isPage || renderer?.name === "astro:jsx") {
          destination.write(html);
        } else if (html && html.length > 0) {
          destination.write(
            markHTMLString(removeStaticAstroSlot(html, renderer?.ssr?.supportsAstroStaticSlot))
          );
        }
      }
    };
  }
  const astroId = shorthash(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props,
      metadata
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  if (componentServerRenderEndTime && false)
    island.props["server-render-time"] = componentServerRenderEndTime;
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        let tagName = renderer?.ssr?.supportsAstroStaticSlot ? !!metadata.hydrate ? "astro-slot" : "astro-static-slot" : "astro-slot";
        let expectedHTML = key === "default" ? `<${tagName}>` : `<${tagName} name="${key}">`;
        if (!html.includes(expectedHTML)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template2 = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${key}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template2}`;
  if (island.children) {
    island.props["await-children"] = "";
    island.children += `<!--astro:end-->`;
  }
  return {
    render(destination) {
      if (slotInstructions) {
        for (const instruction of slotInstructions) {
          destination.write(instruction);
        }
      }
      destination.write(createRenderInstruction({ type: "directive", hydration }));
      if (hydration.directive !== "only" && renderer?.ssr.renderHydrationScript) {
        destination.write(
          createRenderInstruction({
            type: "renderer-hydration-script",
            rendererName: renderer.name,
            render: renderer.ssr.renderHydrationScript
          })
        );
      }
      const renderedElement = renderElement("astro-island", island, false);
      destination.write(markHTMLString(renderedElement));
    }
  };
}
function sanitizeElementName(tag) {
  const unsafe = /[&<>'"\s]+/;
  if (!unsafe.test(tag)) return tag;
  return tag.trim().split(unsafe)[0].trim();
}
async function renderFragmentComponent(result, slots = {}) {
  const children = await renderSlotToString(result, slots?.default);
  return {
    render(destination) {
      if (children == null) return;
      destination.write(children);
    }
  };
}
async function renderHTMLComponent(result, Component, _props, slots = {}) {
  const { slotInstructions, children } = await renderSlots(result, slots);
  const html = Component({ slots: children });
  const hydrationHtml = slotInstructions ? slotInstructions.map((instr) => chunkToString(result, instr)).join("") : "";
  return {
    render(destination) {
      destination.write(markHTMLString(hydrationHtml + html));
    }
  };
}
function renderAstroComponent(result, displayName, Component, props, slots = {}) {
  if (containsServerDirective(props)) {
    const serverIslandComponent = new ServerIslandComponent(result, props, slots, displayName);
    result._metadata.propagators.add(serverIslandComponent);
    return serverIslandComponent;
  }
  const instance = createAstroComponentInstance(result, displayName, Component, props, slots);
  return {
    render(destination) {
      return instance.render(destination);
    }
  };
}
function renderComponent(result, displayName, Component, props, slots = {}) {
  if (isPromise(Component)) {
    return Component.catch(handleCancellation).then((x2) => {
      return renderComponent(result, displayName, x2, props, slots);
    });
  }
  if (isFragmentComponent(Component)) {
    return renderFragmentComponent(result, slots).catch(handleCancellation);
  }
  props = normalizeProps(props);
  if (isHTMLComponent(Component)) {
    return renderHTMLComponent(result, Component, props, slots).catch(handleCancellation);
  }
  if (isAstroComponentFactory(Component)) {
    return renderAstroComponent(result, displayName, Component, props, slots);
  }
  return renderFrameworkComponent(result, displayName, Component, props, slots).catch(
    handleCancellation
  );
  function handleCancellation(e2) {
    if (result.cancelled)
      return {
        render() {
        }
      };
    throw e2;
  }
}
function normalizeProps(props) {
  if (props["class:list"] !== void 0) {
    const value = props["class:list"];
    delete props["class:list"];
    props["class"] = clsx(props["class"], value);
    if (props["class"] === "") {
      delete props["class"];
    }
  }
  return props;
}
async function renderComponentToString(result, displayName, Component, props, slots = {}, isPage = false, route) {
  let str = "";
  let renderedFirstPageChunk = false;
  let head = "";
  if (isPage && !result.partial && nonAstroPageNeedsHeadInjection(Component)) {
    head += chunkToString(result, maybeRenderHead());
  }
  try {
    const destination = {
      write(chunk) {
        if (isPage && !result.partial && !renderedFirstPageChunk) {
          renderedFirstPageChunk = true;
          if (!/<!doctype html/i.test(String(chunk))) {
            const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
            str += doctype + head;
          }
        }
        if (chunk instanceof Response) return;
        str += chunkToString(result, chunk);
      }
    };
    const renderInstance = await renderComponent(result, displayName, Component, props, slots);
    if (containsServerDirective(props)) {
      await bufferHeadContent(result);
    }
    await renderInstance.render(destination);
  } catch (e2) {
    if (AstroError.is(e2) && !e2.loc) {
      e2.setLocation({
        file: route?.component
      });
    }
    throw e2;
  }
  return str;
}
function nonAstroPageNeedsHeadInjection(pageComponent) {
  return !!pageComponent?.[needsHeadRenderingSymbol];
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/jsx.js
var ClientOnlyPlaceholder = "astro-client-only";
var hasTriedRenderComponentSymbol = Symbol("hasTriedRenderComponent");
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case typeof vnode === "function":
      return vnode;
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode): {
      const renderedItems = await Promise.all(vnode.map((v2) => renderJSX(result, v2)));
      let instructions = null;
      let content = "";
      for (const item of renderedItems) {
        if (item instanceof SlotString) {
          content += item;
          instructions = mergeSlotInstructions(instructions, item);
        } else {
          content += item;
        }
      }
      if (instructions) {
        return markHTMLString(new SlotString(content, instructions));
      }
      return markHTMLString(content);
    }
  }
  return renderJSXVNode(result, vnode);
}
async function renderJSXVNode(result, vnode) {
  if (isVNode(vnode)) {
    switch (true) {
      case !vnode.type: {
        throw new Error(`Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
      }
      case vnode.type === Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case isAstroComponentFactory(vnode.type): {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        const str = await renderComponentToString(
          result,
          vnode.type.name,
          vnode.type,
          props,
          slots
        );
        const html = markHTMLString(str);
        return html;
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder):
        return markHTMLString(await renderElement2(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = function(child) {
        if (Array.isArray(child)) {
          return child.map((c2) => extractSlots2(c2));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      };
      var extractSlots = extractSlots2;
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function") {
        if (vnode.props[hasTriedRenderComponentSymbol]) {
          delete vnode.props[hasTriedRenderComponentSymbol];
          const output2 = await vnode.type(vnode.props ?? {});
          if (output2?.[AstroJSX] || !output2) {
            return await renderJSXVNode(result, output2);
          } else {
            return;
          }
        } else {
          vnode.props[hasTriedRenderComponentSymbol] = true;
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value?.["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0) return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      let output;
      if (vnode.type === ClientOnlyPlaceholder && vnode.props["client:only"]) {
        output = await renderComponentToString(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponentToString(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      return markHTMLString(output);
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement2(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children == "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, prerenderElementChildren(tag, children))}</${tag}>`
    )}`
  );
}
function prerenderElementChildren(tag, children) {
  if (typeof children === "string" && (tag === "style" || tag === "script")) {
    return markHTMLString(children);
  } else {
    return children;
  }
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/page.js
init_util3();
async function renderPage(result, componentFactory, props, children, streaming, route) {
  if (!isAstroComponentFactory(componentFactory)) {
    result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
    const pageProps = { ...props ?? {}, "server:root": true };
    const str = await renderComponentToString(
      result,
      componentFactory.name,
      componentFactory,
      pageProps,
      {},
      true,
      route
    );
    const bytes = encoder2.encode(str);
    const headers2 = new Headers([
      ["Content-Type", "text/html"],
      ["Content-Length", bytes.byteLength.toString()]
    ]);
    if (result.shouldInjectCspMetaTags && (result.cspDestination === "header" || result.cspDestination === "adapter")) {
      headers2.set("content-security-policy", renderCspContent(result));
    }
    return new Response(bytes, {
      headers: headers2
    });
  }
  result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
  let body;
  if (streaming) {
    if (isNode && !isDeno) {
      const nodeBody = await renderToAsyncIterable(
        result,
        componentFactory,
        props,
        children,
        true,
        route
      );
      body = nodeBody;
    } else {
      body = await renderToReadableStream(result, componentFactory, props, children, true, route);
    }
  } else {
    body = await renderToString(result, componentFactory, props, children, true, route);
  }
  if (body instanceof Response) return body;
  const init2 = result.response;
  const headers = new Headers(init2.headers);
  if (result.shouldInjectCspMetaTags && result.cspDestination === "header" || result.cspDestination === "adapter") {
    headers.set("content-security-policy", renderCspContent(result));
  }
  if (!streaming && typeof body === "string") {
    body = encoder2.encode(body);
    headers.set("Content-Length", body.byteLength.toString());
  }
  let status = init2.status;
  let statusText = init2.statusText;
  if (route?.route === "/404") {
    status = 404;
    if (statusText === "OK") {
      statusText = "Not Found";
    }
  } else if (route?.route === "/500") {
    status = 500;
    if (statusText === "OK") {
      statusText = "Internal Server Error";
    }
  }
  if (status) {
    return new Response(body, { ...init2, headers, status, statusText });
  } else {
    return new Response(body, { ...init2, headers });
  }
}

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/tags.js
init_util3();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/render/index.js
init_util3();

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/transition.js
var import_cssesc = __toESM(require_cssesc(), 1);
init_escape();
var reEncodeValidChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_".split("").reduce((v2, c2) => (v2[c2.charCodeAt(0)] = c2, v2), []);
var reEncodeInValidStart = "-0123456789_".split("").reduce((v2, c2) => (v2[c2.charCodeAt(0)] = c2, v2), []);

// examples/testapp-ssr/node_modules/astro/dist/runtime/server/index.js
init_escape();
function spreadAttributes(values = {}, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true, _name);
  }
  return markHTMLString(output);
}

// examples/testapp-ssr/node_modules/astro/dist/core/server-islands/endpoint.js
init_encryption();
var SERVER_ISLAND_ROUTE = "/_server-islands/[name]";
var SERVER_ISLAND_COMPONENT = "_server-islands.astro";
var SERVER_ISLAND_BASE_PREFIX = "_server-islands";
function badRequest(reason) {
  return new Response(null, {
    status: 400,
    statusText: "Bad request: " + reason
  });
}
async function getRequestData(request) {
  switch (request.method) {
    case "GET": {
      const url = new URL(request.url);
      const params = url.searchParams;
      if (!params.has("s") || !params.has("e") || !params.has("p")) {
        return badRequest("Missing required query parameters.");
      }
      const encryptedSlots = params.get("s");
      return {
        encryptedComponentExport: params.get("e"),
        encryptedProps: params.get("p"),
        encryptedSlots
      };
    }
    case "POST": {
      try {
        const raw = await request.text();
        const data = JSON.parse(raw);
        if ("slots" in data && typeof data.slots === "object") {
          return badRequest("Plaintext slots are not allowed. Slots must be encrypted.");
        }
        if ("componentExport" in data && typeof data.componentExport === "string") {
          return badRequest(
            "Plaintext componentExport is not allowed. componentExport must be encrypted."
          );
        }
        return data;
      } catch (e2) {
        if (e2 instanceof SyntaxError) {
          return badRequest("Request format is invalid.");
        }
        throw e2;
      }
    }
    default: {
      return new Response(null, { status: 405 });
    }
  }
}
function createEndpoint(manifest2) {
  const page8 = async (result) => {
    const params = result.params;
    if (!params.name) {
      return new Response(null, {
        status: 400,
        statusText: "Bad request"
      });
    }
    const componentId = params.name;
    const data = await getRequestData(result.request);
    if (data instanceof Response) {
      return data;
    }
    const imp = manifest2.serverIslandMap?.get(componentId);
    if (!imp) {
      return new Response(null, {
        status: 404,
        statusText: "Not found"
      });
    }
    const key = await manifest2.key;
    let componentExport;
    try {
      componentExport = await decryptString(key, data.encryptedComponentExport);
    } catch (_e) {
      return badRequest("Encrypted componentExport value is invalid.");
    }
    const encryptedProps = data.encryptedProps;
    let props = {};
    if (encryptedProps !== "") {
      try {
        const propString = await decryptString(key, encryptedProps);
        props = JSON.parse(propString);
      } catch (_e) {
        return badRequest("Encrypted props value is invalid.");
      }
    }
    let decryptedSlots = {};
    const encryptedSlots = data.encryptedSlots;
    if (encryptedSlots !== "") {
      try {
        const slotsString = await decryptString(key, encryptedSlots);
        decryptedSlots = JSON.parse(slotsString);
      } catch (_e) {
        return badRequest("Encrypted slots value is invalid.");
      }
    }
    const componentModule = await imp();
    let Component = componentModule[componentExport];
    const slots = {};
    for (const prop in decryptedSlots) {
      slots[prop] = createSlotValueFromString(decryptedSlots[prop]);
    }
    result.response.headers.set("X-Robots-Tag", "noindex");
    if (isAstroComponentFactory(Component)) {
      const ServerIsland = Component;
      Component = function(...args) {
        return ServerIsland.apply(this, args);
      };
      Object.assign(Component, ServerIsland);
      Component.propagation = "self";
    }
    return renderTemplate`${renderComponent(result, "Component", Component, props, slots)}`;
  };
  page8.isAstroComponentFactory = true;
  const instance = {
    default: page8,
    partial: true
  };
  return instance;
}

// examples/testapp-ssr/node_modules/astro/dist/core/routing/match.js
function matchRoute(pathname, manifest2) {
  return manifest2.routes.find((route) => {
    return route.pattern.test(pathname) || route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
  });
}
var ROUTE404_RE = /^\/404\/?$/;
var ROUTE500_RE = /^\/500\/?$/;
function isRoute404(route) {
  return ROUTE404_RE.test(route);
}
function isRoute500(route) {
  return ROUTE500_RE.test(route);
}
function isRoute404or500(route) {
  return isRoute404(route.route) || isRoute500(route.route);
}
function isRouteServerIsland(route) {
  return route.component === SERVER_ISLAND_COMPONENT;
}
function isRequestServerIsland(request, base = "") {
  const url = new URL(request.url);
  const pathname = base === "/" ? url.pathname.slice(base.length) : url.pathname.slice(base.length + 1);
  return pathname.startsWith(SERVER_ISLAND_BASE_PREFIX);
}
function requestIs404Or500(request, base = "") {
  const url = new URL(request.url);
  const pathname = url.pathname.slice(base.length);
  return isRoute404(pathname) || isRoute500(pathname);
}
function isRouteExternalRedirect(route) {
  return !!(route.type === "redirect" && route.redirect && redirectIsExternal(route.redirect));
}

// examples/testapp-ssr/node_modules/astro/dist/i18n/middleware.js
function createI18nMiddleware(i18n, base, trailingSlash, format2) {
  if (!i18n) return (_, next) => next();
  const payload = {
    ...i18n,
    trailingSlash,
    base,
    format: format2,
    domains: {}
  };
  const _redirectToDefaultLocale = redirectToDefaultLocale(payload);
  const _noFoundForNonLocaleRoute = notFound(payload);
  const _requestHasLocale = requestHasLocale(payload.locales);
  const _redirectToFallback = redirectToFallback(payload);
  const prefixAlways = (context, response) => {
    const url = context.url;
    if (url.pathname === base + "/" || url.pathname === base) {
      return _redirectToDefaultLocale(context);
    } else if (!_requestHasLocale(context)) {
      return _noFoundForNonLocaleRoute(context, response);
    }
    return void 0;
  };
  const prefixOtherLocales = (context, response) => {
    let pathnameContainsDefaultLocale = false;
    const url = context.url;
    for (const segment of url.pathname.split("/")) {
      if (normalizeTheLocale(segment) === normalizeTheLocale(i18n.defaultLocale)) {
        pathnameContainsDefaultLocale = true;
        break;
      }
    }
    if (pathnameContainsDefaultLocale) {
      const newLocation = url.pathname.replace(`/${i18n.defaultLocale}`, "");
      response.headers.set("Location", newLocation);
      return _noFoundForNonLocaleRoute(context);
    }
    return void 0;
  };
  return async (context, next) => {
    const response = await next();
    const type = response.headers.get(ROUTE_TYPE_HEADER);
    const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
    if (isReroute === "no" && typeof i18n.fallback === "undefined") {
      return response;
    }
    if (type !== "page" && type !== "fallback") {
      return response;
    }
    if (requestIs404Or500(context.request, base)) {
      return response;
    }
    if (isRequestServerIsland(context.request, base)) {
      return response;
    }
    const { currentLocale } = context;
    switch (i18n.strategy) {
      // NOTE: theoretically, we should never hit this code path
      case "manual": {
        return response;
      }
      case "domains-prefix-other-locales": {
        if (localeHasntDomain(i18n, currentLocale)) {
          const result = prefixOtherLocales(context, response);
          if (result) {
            return result;
          }
        }
        break;
      }
      case "pathname-prefix-other-locales": {
        const result = prefixOtherLocales(context, response);
        if (result) {
          return result;
        }
        break;
      }
      case "domains-prefix-always-no-redirect": {
        if (localeHasntDomain(i18n, currentLocale)) {
          const result = _noFoundForNonLocaleRoute(context, response);
          if (result) {
            return result;
          }
        }
        break;
      }
      case "pathname-prefix-always-no-redirect": {
        const result = _noFoundForNonLocaleRoute(context, response);
        if (result) {
          return result;
        }
        break;
      }
      case "pathname-prefix-always": {
        const result = prefixAlways(context, response);
        if (result) {
          return result;
        }
        break;
      }
      case "domains-prefix-always": {
        if (localeHasntDomain(i18n, currentLocale)) {
          const result = prefixAlways(context, response);
          if (result) {
            return result;
          }
        }
        break;
      }
    }
    return _redirectToFallback(context, response);
  };
}
function localeHasntDomain(i18n, currentLocale) {
  for (const domainLocale of Object.values(i18n.domainLookupTable)) {
    if (domainLocale === currentLocale) {
      return false;
    }
  }
  return true;
}

// examples/testapp-ssr/node_modules/astro/dist/i18n/index.js
function requestHasLocale(locales) {
  return function(context) {
    return pathHasLocale(context.url.pathname, locales);
  };
}
function pathHasLocale(path, locales) {
  const segments = path.split("/").map(normalizeThePath);
  for (const segment of segments) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (normalizeTheLocale(segment) === normalizeTheLocale(locale)) {
          return true;
        }
      } else if (segment === locale.path) {
        return true;
      }
    }
  }
  return false;
}
function getPathByLocale(locale, locales) {
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      if (loopLocale === locale) {
        return loopLocale;
      }
    } else {
      for (const code of loopLocale.codes) {
        if (code === locale) {
          return loopLocale.path;
        }
      }
    }
  }
  throw new AstroError(i18nNoLocaleFoundInPath);
}
function normalizeTheLocale(locale) {
  return locale.replaceAll("_", "-").toLowerCase();
}
function normalizeThePath(path) {
  return path.endsWith(".html") ? path.slice(0, -5) : path;
}
function getAllCodes(locales) {
  const result = [];
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      result.push(loopLocale);
    } else {
      result.push(...loopLocale.codes);
    }
  }
  return result;
}
function redirectToDefaultLocale({
  trailingSlash,
  format: format2,
  base,
  defaultLocale
}) {
  return function(context, statusCode) {
    if (shouldAppendForwardSlash(trailingSlash, format2)) {
      return context.redirect(`${appendForwardSlash(joinPaths(base, defaultLocale))}`, statusCode);
    } else {
      return context.redirect(`${joinPaths(base, defaultLocale)}`, statusCode);
    }
  };
}
function notFound({ base, locales, fallback }) {
  return function(context, response) {
    if (response?.headers.get(REROUTE_DIRECTIVE_HEADER) === "no" && typeof fallback === "undefined") {
      return response;
    }
    const url = context.url;
    const isRoot = url.pathname === base + "/" || url.pathname === base;
    if (!(isRoot || pathHasLocale(url.pathname, locales))) {
      if (response) {
        response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
        return new Response(response.body, {
          status: 404,
          headers: response.headers
        });
      } else {
        return new Response(null, {
          status: 404,
          headers: {
            [REROUTE_DIRECTIVE_HEADER]: "no"
          }
        });
      }
    }
    return void 0;
  };
}
function redirectToFallback({
  fallback,
  locales,
  defaultLocale,
  strategy,
  base,
  fallbackType
}) {
  return async function(context, response) {
    if (response.status >= 300 && fallback) {
      const fallbackKeys = fallback ? Object.keys(fallback) : [];
      const segments = context.url.pathname.split("/");
      const urlLocale = segments.find((segment) => {
        for (const locale of locales) {
          if (typeof locale === "string") {
            if (locale === segment) {
              return true;
            }
          } else if (locale.path === segment) {
            return true;
          }
        }
        return false;
      });
      if (urlLocale && fallbackKeys.includes(urlLocale)) {
        const fallbackLocale = fallback[urlLocale];
        const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);
        let newPathname;
        if (pathFallbackLocale === defaultLocale && strategy === "pathname-prefix-other-locales") {
          if (context.url.pathname.includes(`${base}`)) {
            newPathname = context.url.pathname.replace(`/${urlLocale}`, ``);
            if (newPathname === "") {
              newPathname = "/";
            }
          } else {
            newPathname = context.url.pathname.replace(`/${urlLocale}`, `/`);
          }
        } else {
          newPathname = context.url.pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
        }
        if (fallbackType === "rewrite") {
          return await context.rewrite(newPathname + context.url.search);
        } else {
          return context.redirect(newPathname + context.url.search);
        }
      }
    }
    return response;
  };
}

// examples/testapp-ssr/node_modules/astro/dist/core/cookies/cookies.js
var import_cookie = __toESM(require_dist(), 1);
init_errors3();
var DELETED_EXPIRATION = /* @__PURE__ */ new Date(0);
var DELETED_VALUE = "deleted";
var responseSentSymbol2 = Symbol.for("astro.responseSent");
var identity = (value) => value;
var AstroCookie = class {
  constructor(value) {
    this.value = value;
  }
  json() {
    if (this.value === void 0) {
      throw new Error(`Cannot convert undefined to an object.`);
    }
    return JSON.parse(this.value);
  }
  number() {
    return Number(this.value);
  }
  boolean() {
    if (this.value === "false") return false;
    if (this.value === "0") return false;
    return Boolean(this.value);
  }
};
var AstroCookies = class {
  #request;
  #requestValues;
  #outgoing;
  #consumed;
  constructor(request) {
    this.#request = request;
    this.#requestValues = null;
    this.#outgoing = null;
    this.#consumed = false;
  }
  /**
   * Astro.cookies.delete(key) is used to delete a cookie. Using this method will result
   * in a Set-Cookie header added to the response.
   * @param key The cookie to delete
   * @param options Options related to this deletion, such as the path of the cookie.
   */
  delete(key, options) {
    const {
      // @ts-expect-error
      maxAge: _ignoredMaxAge,
      // @ts-expect-error
      expires: _ignoredExpires,
      ...sanitizedOptions
    } = options || {};
    const serializeOptions = {
      expires: DELETED_EXPIRATION,
      ...sanitizedOptions
    };
    this.#ensureOutgoingMap().set(key, [
      DELETED_VALUE,
      (0, import_cookie.serialize)(key, DELETED_VALUE, serializeOptions),
      false
    ]);
  }
  /**
   * Astro.cookies.get(key) is used to get a cookie value. The cookie value is read from the
   * request. If you have set a cookie via Astro.cookies.set(key, value), the value will be taken
   * from that set call, overriding any values already part of the request.
   * @param key The cookie to get.
   * @returns An object containing the cookie value as well as convenience methods for converting its value.
   */
  get(key, options = void 0) {
    if (this.#outgoing?.has(key)) {
      let [serializedValue, , isSetValue] = this.#outgoing.get(key);
      if (isSetValue) {
        return new AstroCookie(serializedValue);
      } else {
        return void 0;
      }
    }
    const decode2 = options?.decode ?? decodeURIComponent;
    const values = this.#ensureParsed();
    if (key in values) {
      const value = values[key];
      if (value) {
        let decodedValue;
        try {
          decodedValue = decode2(value);
        } catch (_error) {
          decodedValue = value;
        }
        return new AstroCookie(decodedValue);
      }
    }
  }
  /**
   * Astro.cookies.has(key) returns a boolean indicating whether this cookie is either
   * part of the initial request or set via Astro.cookies.set(key)
   * @param key The cookie to check for.
   * @param _options This parameter is no longer used.
   * @returns
   */
  has(key, _options) {
    if (this.#outgoing?.has(key)) {
      let [, , isSetValue] = this.#outgoing.get(key);
      return isSetValue;
    }
    const values = this.#ensureParsed();
    return values[key] !== void 0;
  }
  /**
   * Astro.cookies.set(key, value) is used to set a cookie's value. If provided
   * an object it will be stringified via JSON.stringify(value). Additionally you
   * can provide options customizing how this cookie will be set, such as setting httpOnly
   * in order to prevent the cookie from being read in client-side JavaScript.
   * @param key The name of the cookie to set.
   * @param value A value, either a string or other primitive or an object.
   * @param options Options for the cookie, such as the path and security settings.
   */
  set(key, value, options) {
    if (this.#consumed) {
      const warning = new Error(
        "Astro.cookies.set() was called after the cookies had already been sent to the browser.\nThis may have happened if this method was called in an imported component.\nPlease make sure that Astro.cookies.set() is only called in the frontmatter of the main page."
      );
      warning.name = "Warning";
      console.warn(warning);
    }
    let serializedValue;
    if (typeof value === "string") {
      serializedValue = value;
    } else {
      let toStringValue = value.toString();
      if (toStringValue === Object.prototype.toString.call(value)) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = toStringValue;
      }
    }
    const serializeOptions = {};
    if (options) {
      Object.assign(serializeOptions, options);
    }
    this.#ensureOutgoingMap().set(key, [
      serializedValue,
      (0, import_cookie.serialize)(key, serializedValue, serializeOptions),
      true
    ]);
    if (this.#request[responseSentSymbol2]) {
      throw new AstroError({
        ...errors_data_exports.ResponseSentError
      });
    }
  }
  /**
   * Merges a new AstroCookies instance into the current instance. Any new cookies
   * will be added to the current instance, overwriting any existing cookies with the same name.
   */
  merge(cookies) {
    const outgoing = cookies.#outgoing;
    if (outgoing) {
      for (const [key, value] of outgoing) {
        this.#ensureOutgoingMap().set(key, value);
      }
    }
  }
  /**
   * Astro.cookies.header() returns an iterator for the cookies that have previously
   * been set by either Astro.cookies.set() or Astro.cookies.delete().
   * This method is primarily used by adapters to set the header on outgoing responses.
   * @returns
   */
  *headers() {
    if (this.#outgoing == null) return;
    for (const [, value] of this.#outgoing) {
      yield value[1];
    }
  }
  /**
   * Behaves the same as AstroCookies.prototype.headers(),
   * but allows a warning when cookies are set after the instance is consumed.
   */
  static consume(cookies) {
    cookies.#consumed = true;
    return cookies.headers();
  }
  #ensureParsed() {
    if (!this.#requestValues) {
      this.#parse();
    }
    if (!this.#requestValues) {
      this.#requestValues = {};
    }
    return this.#requestValues;
  }
  #ensureOutgoingMap() {
    if (!this.#outgoing) {
      this.#outgoing = /* @__PURE__ */ new Map();
    }
    return this.#outgoing;
  }
  #parse() {
    const raw = this.#request.headers.get("cookie");
    if (!raw) {
      return;
    }
    this.#requestValues = (0, import_cookie.parse)(raw, { decode: identity });
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/cookies/response.js
var astroCookiesSymbol = Symbol.for("astro.cookies");
function attachCookiesToResponse(response, cookies) {
  Reflect.set(response, astroCookiesSymbol, cookies);
}
function getCookiesFromResponse(response) {
  let cookies = Reflect.get(response, astroCookiesSymbol);
  if (cookies != null) {
    return cookies;
  } else {
    return void 0;
  }
}
function* getSetCookiesFromResponse(response) {
  const cookies = getCookiesFromResponse(response);
  if (!cookies) {
    return [];
  }
  for (const headerValue of AstroCookies.consume(cookies)) {
    yield headerValue;
  }
  return [];
}

// examples/testapp-ssr/node_modules/astro/dist/core/app/index.js
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/core/logger/core.js
init_dist2();
var dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
var levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.dest;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
  return log(opts, "info", label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
  return log(opts, "warn", label, message, newLine);
}
function error(opts, label, message, newLine = true) {
  return log(opts, "error", label, message, newLine);
}
function debug(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(s.bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return s.red(prefix.join(" "));
  }
  if (level === "warn") {
    return s.yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return s.dim(prefix[0]);
  }
  return s.dim(prefix[0]) + " " + s.blue(prefix.splice(1).join(" "));
}
var Logger = class {
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
};
var AstroIntegrationLogger = class _AstroIntegrationLogger {
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new _AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info(this.options, this.label, message);
  }
  warn(message) {
    warn(this.options, this.label, message);
  }
  error(message) {
    error(this.options, this.label, message);
  }
  debug(message) {
    debug(this.label, message);
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/logger/console.js
var consoleLogDestination = {
  write(event) {
    let dest = console.error;
    if (levels[event.level] < levels["error"]) {
      dest = console.info;
    }
    if (event.label === "SKIP_FORMAT") {
      dest(event.message);
    } else {
      dest(getEventPrefix(event) + " " + event.message);
    }
    return true;
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/app/index.js
init_path2();

// examples/testapp-ssr/node_modules/astro/dist/assets/utils/getAssetsPrefix.js
function getAssetsPrefix(fileExtension2, assetsPrefix) {
  let prefix = "";
  if (!assetsPrefix) {
    prefix = "";
  } else if (typeof assetsPrefix === "string") {
    prefix = assetsPrefix;
  } else {
    const dotLessFileExtension = fileExtension2.slice(1);
    prefix = assetsPrefix[dotLessFileExtension] || assetsPrefix.fallback;
  }
  return prefix;
}

// examples/testapp-ssr/node_modules/astro/dist/core/render/ssr-element.js
init_path2();
function createAssetLink(href, base, assetsPrefix, queryParams) {
  let url = "";
  if (assetsPrefix) {
    const pf = getAssetsPrefix(fileExtension(href), assetsPrefix);
    url = joinPaths(pf, slash(href));
  } else if (base) {
    url = prependForwardSlash(joinPaths(base, slash(href)));
  } else {
    url = href;
  }
  if (queryParams) {
    url += "?" + queryParams.toString();
  }
  return url;
}
function createStylesheetElement(stylesheet, base, assetsPrefix, queryParams) {
  if (stylesheet.type === "inline") {
    return {
      props: {},
      children: stylesheet.content
    };
  } else {
    return {
      props: {
        rel: "stylesheet",
        href: createAssetLink(stylesheet.src, base, assetsPrefix, queryParams)
      },
      children: ""
    };
  }
}
function createStylesheetElementSet(stylesheets, base, assetsPrefix, queryParams) {
  return new Set(
    stylesheets.map((s2) => createStylesheetElement(s2, base, assetsPrefix, queryParams))
  );
}
function createModuleScriptElement(script, base, assetsPrefix, queryParams) {
  if (script.type === "external") {
    return createModuleScriptElementWithSrc(script.value, base, assetsPrefix, queryParams);
  } else {
    return {
      props: {
        type: "module"
      },
      children: script.value
    };
  }
}
function createModuleScriptElementWithSrc(src, base, assetsPrefix, queryParams) {
  return {
    props: {
      type: "module",
      src: createAssetLink(src, base, assetsPrefix, queryParams)
    },
    children: ""
  };
}

// examples/testapp-ssr/node_modules/astro/dist/core/render-context.js
init_dist2();

// examples/testapp-ssr/node_modules/astro/dist/actions/runtime/server.js
init_errors2();
init_errors_data();
init_path2();

// examples/testapp-ssr/node_modules/astro/dist/actions/consts.js
var VIRTUAL_MODULE_ID = "astro:actions";
var RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;
var RUNTIME_VIRTUAL_MODULE_ID = "virtual:astro:actions/runtime";
var RESOLVED_RUNTIME_VIRTUAL_MODULE_ID = "\0" + RUNTIME_VIRTUAL_MODULE_ID;
var ENTRYPOINT_VIRTUAL_MODULE_ID = "virtual:astro:actions/entrypoint";
var RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID = "\0" + ENTRYPOINT_VIRTUAL_MODULE_ID;
var OPTIONS_VIRTUAL_MODULE_ID = "virtual:astro:actions/options";
var RESOLVED_OPTIONS_VIRTUAL_MODULE_ID = "\0" + OPTIONS_VIRTUAL_MODULE_ID;
var ACTION_QUERY_PARAMS = {
  actionName: "_action",
  actionPayload: "_astroActionPayload"
};
var ACTION_RPC_ROUTE_PATTERN = "/_actions/[...path]";

// examples/testapp-ssr/node_modules/devalue/src/constants.js
var UNDEFINED = -1;
var HOLE = -2;
var NAN = -3;
var POSITIVE_INFINITY = -4;
var NEGATIVE_INFINITY = -5;
var NEGATIVE_ZERO = -6;
var SPARSE = -7;
var MAX_ARRAY_LEN = 2 ** 32 - 1;
var MAX_ARRAY_INDEX = MAX_ARRAY_LEN - 1;

// examples/testapp-ssr/node_modules/devalue/src/utils.js
var DevalueError = class extends Error {
  /**
   * @param {string} message
   * @param {string[]} keys
   * @param {any} [value] - The value that failed to be serialized
   * @param {any} [root] - The root value being serialized
   */
  constructor(message, keys, value, root) {
    super(message);
    this.name = "DevalueError";
    this.path = keys.join("");
    this.value = value;
    this.root = root;
  }
};
function is_primitive(thing) {
  return thing === null || typeof thing !== "object" && typeof thing !== "function";
}
var object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function is_plain_object(thing) {
  const proto = Object.getPrototypeOf(thing);
  return proto === Object.prototype || proto === null || Object.getPrototypeOf(proto) === null || Object.getOwnPropertyNames(proto).sort().join("\0") === object_proto_names;
}
function get_type(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function get_escaped_char(char) {
  switch (char) {
    case '"':
      return '\\"';
    case "<":
      return "\\u003C";
    case "\\":
      return "\\\\";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "	":
      return "\\t";
    case "\b":
      return "\\b";
    case "\f":
      return "\\f";
    case "\u2028":
      return "\\u2028";
    case "\u2029":
      return "\\u2029";
    default:
      return char < " " ? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}` : "";
  }
}
function stringify_string(str) {
  let result = "";
  let last_pos = 0;
  const len = str.length;
  for (let i2 = 0; i2 < len; i2 += 1) {
    const char = str[i2];
    const replacement = get_escaped_char(char);
    if (replacement) {
      result += str.slice(last_pos, i2) + replacement;
      last_pos = i2 + 1;
    }
  }
  return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}
function enumerable_symbols(object) {
  return Object.getOwnPropertySymbols(object).filter(
    (symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable
  );
}
var is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function stringify_key(key) {
  return is_identifier.test(key) ? "." + key : "[" + JSON.stringify(key) + "]";
}
function is_valid_array_index(n5) {
  if (!Number.isInteger(n5)) return false;
  if (n5 < 0) return false;
  if (n5 > MAX_ARRAY_INDEX) return false;
  return true;
}
function is_valid_array_len(n5) {
  if (!Number.isInteger(n5)) return false;
  if (n5 < 0) return false;
  if (n5 > MAX_ARRAY_LEN) return false;
  return true;
}
function is_valid_array_index_string(s2) {
  if (s2.length === 0) return false;
  if (s2.length > 1 && s2.charCodeAt(0) === 48) return false;
  for (let i2 = 0; i2 < s2.length; i2++) {
    const c2 = s2.charCodeAt(i2);
    if (c2 < 48 || c2 > 57) return false;
  }
  return is_valid_array_index(+s2);
}
function valid_array_indices(array) {
  const keys = Object.keys(array);
  for (var i2 = keys.length - 1; i2 >= 0; i2--) {
    if (is_valid_array_index_string(keys[i2])) {
      break;
    }
  }
  keys.length = i2 + 1;
  return keys;
}

// examples/testapp-ssr/node_modules/devalue/src/base64.js
function encode_native(array_buffer) {
  return new Uint8Array(array_buffer).toBase64();
}
function decode_native(base64) {
  return Uint8Array.fromBase64(base64).buffer;
}
function encode_buffer(array_buffer) {
  return Buffer.from(array_buffer).toString("base64");
}
function decode_buffer(base64) {
  return Uint8Array.from(Buffer.from(base64, "base64")).buffer;
}
function encode_legacy(array_buffer) {
  const array = new Uint8Array(array_buffer);
  let binary2 = "";
  const chunk_size = 32768;
  for (let i2 = 0; i2 < array.length; i2 += chunk_size) {
    const chunk = array.subarray(i2, i2 + chunk_size);
    binary2 += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary2);
}
function decode_legacy(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const array = new Uint8Array(len);
  for (let i2 = 0; i2 < len; i2++) {
    array[i2] = binary_string.charCodeAt(i2);
  }
  return array.buffer;
}
var native = typeof Uint8Array.fromBase64 === "function";
var buffer = typeof process === "object" && process.versions?.node !== void 0;
var encode64 = native ? encode_native : buffer ? encode_buffer : encode_legacy;
var decode64 = native ? decode_native : buffer ? decode_buffer : decode_legacy;

// examples/testapp-ssr/node_modules/devalue/src/parse.js
function parse2(serialized, revivers) {
  return unflatten(JSON.parse(serialized), revivers);
}
function unflatten(parsed, revivers) {
  if (typeof parsed === "number") return hydrate(parsed, true);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid input");
  }
  const values = (
    /** @type {any[]} */
    parsed
  );
  const hydrated = Array(values.length);
  let hydrating = null;
  function hydrate(index, standalone = false) {
    if (index === UNDEFINED) return void 0;
    if (index === NAN) return NaN;
    if (index === POSITIVE_INFINITY) return Infinity;
    if (index === NEGATIVE_INFINITY) return -Infinity;
    if (index === NEGATIVE_ZERO) return -0;
    if (standalone || typeof index !== "number") {
      throw new Error(`Invalid input`);
    }
    if (index in hydrated) return hydrated[index];
    const value = values[index];
    if (!value || typeof value !== "object") {
      hydrated[index] = value;
    } else if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        const type = value[0];
        const reviver = revivers && Object.hasOwn(revivers, type) ? revivers[type] : void 0;
        if (reviver) {
          let i2 = value[1];
          if (typeof i2 !== "number") {
            i2 = values.push(value[1]) - 1;
          }
          hydrating ??= /* @__PURE__ */ new Set();
          if (hydrating.has(i2)) {
            throw new Error("Invalid circular reference");
          }
          hydrating.add(i2);
          hydrated[index] = reviver(hydrate(i2));
          hydrating.delete(i2);
          return hydrated[index];
        }
        switch (type) {
          case "Date":
            hydrated[index] = new Date(value[1]);
            break;
          case "Set":
            const set = /* @__PURE__ */ new Set();
            hydrated[index] = set;
            for (let i2 = 1; i2 < value.length; i2 += 1) {
              set.add(hydrate(value[i2]));
            }
            break;
          case "Map":
            const map = /* @__PURE__ */ new Map();
            hydrated[index] = map;
            for (let i2 = 1; i2 < value.length; i2 += 2) {
              map.set(hydrate(value[i2]), hydrate(value[i2 + 1]));
            }
            break;
          case "RegExp":
            hydrated[index] = new RegExp(value[1], value[2]);
            break;
          case "Object": {
            const wrapped_index = value[1];
            if (typeof values[wrapped_index] === "object" && values[wrapped_index][0] !== "BigInt") {
              throw new Error("Invalid input");
            }
            hydrated[index] = Object(hydrate(wrapped_index));
            break;
          }
          case "BigInt":
            hydrated[index] = BigInt(value[1]);
            break;
          case "null":
            const obj = /* @__PURE__ */ Object.create(null);
            hydrated[index] = obj;
            for (let i2 = 1; i2 < value.length; i2 += 2) {
              if (value[i2] === "__proto__") {
                throw new Error("Cannot parse an object with a `__proto__` property");
              }
              obj[value[i2]] = hydrate(value[i2 + 1]);
            }
            break;
          case "Int8Array":
          case "Uint8Array":
          case "Uint8ClampedArray":
          case "Int16Array":
          case "Uint16Array":
          case "Float16Array":
          case "Int32Array":
          case "Uint32Array":
          case "Float32Array":
          case "Float64Array":
          case "BigInt64Array":
          case "BigUint64Array":
          case "DataView": {
            if (values[value[1]][0] !== "ArrayBuffer") {
              throw new Error("Invalid data");
            }
            const TypedArrayConstructor = globalThis[type];
            const buffer2 = hydrate(value[1]);
            hydrated[index] = value[2] !== void 0 ? new TypedArrayConstructor(buffer2, value[2], value[3]) : new TypedArrayConstructor(buffer2);
            break;
          }
          case "ArrayBuffer": {
            const base64 = value[1];
            if (typeof base64 !== "string") {
              throw new Error("Invalid ArrayBuffer encoding");
            }
            const arraybuffer = decode64(base64);
            hydrated[index] = arraybuffer;
            break;
          }
          case "Temporal.Duration":
          case "Temporal.Instant":
          case "Temporal.PlainDate":
          case "Temporal.PlainTime":
          case "Temporal.PlainDateTime":
          case "Temporal.PlainMonthDay":
          case "Temporal.PlainYearMonth":
          case "Temporal.ZonedDateTime": {
            const temporalName = type.slice(9);
            hydrated[index] = Temporal[temporalName].from(value[1]);
            break;
          }
          case "URL": {
            const url = new URL(value[1]);
            hydrated[index] = url;
            break;
          }
          case "URLSearchParams": {
            const url = new URLSearchParams(value[1]);
            hydrated[index] = url;
            break;
          }
          default:
            throw new Error(`Unknown type ${type}`);
        }
      } else if (value[0] === SPARSE) {
        const len = value[1];
        if (!is_valid_array_len(len)) {
          throw new Error("Invalid input");
        }
        const array = [];
        hydrated[index] = array;
        array[MAX_ARRAY_INDEX] = void 0;
        delete array[MAX_ARRAY_INDEX];
        for (let i2 = 2; i2 < value.length; i2 += 2) {
          const idx = value[i2];
          if (!is_valid_array_index(idx) || idx >= len) {
            throw new Error("Invalid input");
          }
          array[idx] = hydrate(value[i2 + 1]);
        }
        array.length = len;
      } else {
        const array = new Array(value.length);
        hydrated[index] = array;
        for (let i2 = 0; i2 < value.length; i2 += 1) {
          const n5 = value[i2];
          if (n5 === HOLE) continue;
          array[i2] = hydrate(n5);
        }
      }
    } else {
      const object = {};
      hydrated[index] = object;
      for (const key of Object.keys(value)) {
        if (key === "__proto__") {
          throw new Error("Cannot parse an object with a `__proto__` property");
        }
        const n5 = value[key];
        object[key] = hydrate(n5);
      }
    }
    return hydrated[index];
  }
  return hydrate(0);
}

// examples/testapp-ssr/node_modules/devalue/src/stringify.js
function stringify(value, reducers) {
  const stringified = run(false, value, reducers);
  return typeof stringified === "string" ? stringified : `[${stringified.join(",")}]`;
}
function run(async, value, reducers) {
  const stringified = [];
  const indexes = /* @__PURE__ */ new Map();
  const custom2 = [];
  if (reducers) {
    for (const key of Object.getOwnPropertyNames(reducers)) {
      custom2.push({ key, fn: reducers[key] });
    }
  }
  const keys = [];
  let p2 = 0;
  function flatten(thing, index2) {
    if (thing === void 0) return UNDEFINED;
    if (Number.isNaN(thing)) return NAN;
    if (thing === Infinity) return POSITIVE_INFINITY;
    if (thing === -Infinity) return NEGATIVE_INFINITY;
    if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO;
    if (indexes.has(thing)) return (
      /** @type {number} */
      indexes.get(thing)
    );
    index2 ??= p2++;
    indexes.set(thing, index2);
    for (const { key, fn } of custom2) {
      const value2 = fn(thing);
      if (value2) {
        stringified[index2] = `["${key}",${flatten(value2)}]`;
        return index2;
      }
    }
    if (typeof thing === "function") {
      throw new DevalueError(`Cannot stringify a function`, keys, thing, value);
    } else if (typeof thing === "symbol") {
      throw new DevalueError(`Cannot stringify a Symbol primitive`, keys, thing, value);
    }
    let str = "";
    if (is_primitive(thing)) {
      str = stringify_primitive(thing);
    } else if (typeof thing.then === "function") {
      if (!async) {
        throw new DevalueError(
          `Cannot stringify a Promise or thenable \u2014 use stringifyAsync instead`,
          keys,
          thing,
          value
        );
      }
      str = Promise.resolve(thing).then((value2) => {
        const i2 = flatten(value2, index2);
        if (i2 < 0) stringified[index2] = i2;
      });
    } else {
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "BigInt":
          str = `["Object",${flatten(thing.valueOf())}]`;
          break;
        case "Date":
          const valid = !isNaN(thing.getDate());
          str = `["Date","${valid ? thing.toISOString() : ""}"]`;
          break;
        case "URL":
          str = `["URL",${stringify_string(thing.toString())}]`;
          break;
        case "URLSearchParams":
          str = `["URLSearchParams",${stringify_string(thing.toString())}]`;
          break;
        case "RegExp":
          const { source, flags } = thing;
          str = flags ? `["RegExp",${stringify_string(source)},"${flags}"]` : `["RegExp",${stringify_string(source)}]`;
          break;
        case "Array": {
          let mostly_dense = false;
          str = "[";
          for (let i2 = 0; i2 < thing.length; i2 += 1) {
            if (i2 > 0) str += ",";
            if (Object.hasOwn(thing, i2)) {
              keys.push(`[${i2}]`);
              str += flatten(thing[i2]);
              keys.pop();
            } else if (mostly_dense) {
              str += HOLE;
            } else {
              const populated_keys = valid_array_indices(
                /** @type {any[]} */
                thing
              );
              const population = populated_keys.length;
              const d = String(thing.length).length;
              const hole_cost = (thing.length - population) * 3;
              const sparse_cost = 4 + d + population * (d + 1);
              if (hole_cost > sparse_cost) {
                str = "[" + SPARSE + "," + thing.length;
                for (let j = 0; j < populated_keys.length; j++) {
                  const key = populated_keys[j];
                  keys.push(`[${key}]`);
                  str += "," + key + "," + flatten(thing[key]);
                  keys.pop();
                }
                break;
              } else {
                mostly_dense = true;
                str += HOLE;
              }
            }
          }
          str += "]";
          break;
        }
        case "Set":
          str = '["Set"';
          for (const value2 of thing) {
            str += `,${flatten(value2)}`;
          }
          str += "]";
          break;
        case "Map":
          str = '["Map"';
          for (const [key, value2] of thing) {
            keys.push(`.get(${is_primitive(key) ? stringify_primitive(key) : "..."})`);
            str += `,${flatten(key)},${flatten(value2)}`;
            keys.pop();
          }
          str += "]";
          break;
        case "Int8Array":
        case "Uint8Array":
        case "Uint8ClampedArray":
        case "Int16Array":
        case "Uint16Array":
        case "Float16Array":
        case "Int32Array":
        case "Uint32Array":
        case "Float32Array":
        case "Float64Array":
        case "BigInt64Array":
        case "BigUint64Array":
        case "DataView": {
          const typedArray = thing;
          str = '["' + type + '",' + flatten(typedArray.buffer);
          if (typedArray.byteLength !== typedArray.buffer.byteLength) {
            str += `,${typedArray.byteOffset},${typedArray.length}`;
          }
          str += "]";
          break;
        }
        case "ArrayBuffer": {
          const arraybuffer = thing;
          const base64 = encode64(arraybuffer);
          str = `["ArrayBuffer","${base64}"]`;
          break;
        }
        case "Temporal.Duration":
        case "Temporal.Instant":
        case "Temporal.PlainDate":
        case "Temporal.PlainTime":
        case "Temporal.PlainDateTime":
        case "Temporal.PlainMonthDay":
        case "Temporal.PlainYearMonth":
        case "Temporal.ZonedDateTime":
          str = `["${type}",${stringify_string(thing.toString())}]`;
          break;
        default:
          if (!is_plain_object(thing)) {
            throw new DevalueError(`Cannot stringify arbitrary non-POJOs`, keys, thing, value);
          }
          if (enumerable_symbols(thing).length > 0) {
            throw new DevalueError(`Cannot stringify POJOs with symbolic keys`, keys, thing, value);
          }
          if (Object.getPrototypeOf(thing) === null) {
            str = '["null"';
            for (const key of Object.keys(thing)) {
              if (key === "__proto__") {
                throw new DevalueError(
                  `Cannot stringify objects with __proto__ keys`,
                  keys,
                  thing,
                  value
                );
              }
              keys.push(stringify_key(key));
              str += `,${stringify_string(key)},${flatten(thing[key])}`;
              keys.pop();
            }
            str += "]";
          } else {
            str = "{";
            let started = false;
            for (const key of Object.keys(thing)) {
              if (key === "__proto__") {
                throw new DevalueError(
                  `Cannot stringify objects with __proto__ keys`,
                  keys,
                  thing,
                  value
                );
              }
              if (started) str += ",";
              started = true;
              keys.push(stringify_key(key));
              str += `${stringify_string(key)}:${flatten(thing[key])}`;
              keys.pop();
            }
            str += "}";
          }
      }
    }
    stringified[index2] = str;
    return index2;
  }
  const index = flatten(value);
  if (index < 0) return `${index}`;
  return stringified;
}
function stringify_primitive(thing) {
  const type = typeof thing;
  if (type === "string") return stringify_string(thing);
  if (thing === void 0) return UNDEFINED.toString();
  if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO.toString();
  if (type === "bigint") return `["BigInt","${thing}"]`;
  return String(thing);
}

// examples/testapp-ssr/node_modules/astro/dist/actions/runtime/shared.js
init_errors2();
init_errors_data();
init_path2();
var ACTION_QUERY_PARAMS2 = ACTION_QUERY_PARAMS;
var codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
var statusToCodeMap = Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);
var ActionError = class _ActionError extends Error {
  type = "AstroActionError";
  code = "INTERNAL_SERVER_ERROR";
  status = 500;
  constructor(params) {
    super(params.message);
    this.code = params.code;
    this.status = _ActionError.codeToStatus(params.code);
    if (params.stack) {
      this.stack = params.stack;
    }
  }
  static codeToStatus(code) {
    return codeToStatusMap[code];
  }
  static statusToCode(status) {
    return statusToCodeMap[status] ?? "INTERNAL_SERVER_ERROR";
  }
  static fromJson(body) {
    if (isInputError(body)) {
      return new ActionInputError(body.issues);
    }
    if (isActionError(body)) {
      return new _ActionError(body);
    }
    return new _ActionError({
      code: "INTERNAL_SERVER_ERROR"
    });
  }
};
function isActionError(error2) {
  return typeof error2 === "object" && error2 != null && "type" in error2 && error2.type === "AstroActionError";
}
function isInputError(error2) {
  return typeof error2 === "object" && error2 != null && "type" in error2 && error2.type === "AstroActionInputError" && "issues" in error2 && Array.isArray(error2.issues);
}
var ActionInputError = class extends ActionError {
  type = "AstroActionInputError";
  // We don't expose all ZodError properties.
  // Not all properties will serialize from server to client,
  // and we don't want to import the full ZodError object into the client.
  issues;
  fields;
  constructor(issues) {
    super({
      message: `Failed to validate: ${JSON.stringify(issues, null, 2)}`,
      code: "BAD_REQUEST"
    });
    this.issues = issues;
    this.fields = {};
    for (const issue of issues) {
      if (issue.path.length > 0) {
        const key = issue.path[0].toString();
        this.fields[key] ??= [];
        this.fields[key]?.push(issue.message);
      }
    }
  }
};
function getActionQueryString(name) {
  const searchParams = new URLSearchParams({ [ACTION_QUERY_PARAMS.actionName]: name });
  return `?${searchParams.toString()}`;
}
function serializeActionResult(res) {
  if (res.error) {
    if (import.meta.env?.DEV) {
      actionResultErrorStack.set(res.error.stack);
    }
    let body2;
    if (res.error instanceof ActionInputError) {
      body2 = {
        type: res.error.type,
        issues: res.error.issues,
        fields: res.error.fields
      };
    } else {
      body2 = {
        ...res.error,
        message: res.error.message
      };
    }
    return {
      type: "error",
      status: res.error.status,
      contentType: "application/json",
      body: JSON.stringify(body2)
    };
  }
  if (res.data === void 0) {
    return {
      type: "empty",
      status: 204
    };
  }
  let body;
  try {
    body = stringify(res.data, {
      // Add support for URL objects
      URL: (value) => value instanceof URL && value.href
    });
  } catch (e2) {
    let hint = ActionsReturnedInvalidDataError.hint;
    if (res.data instanceof Response) {
      hint = REDIRECT_STATUS_CODES.includes(res.data.status) ? "If you need to redirect when the action succeeds, trigger a redirect where the action is called. See the Actions guide for server and client redirect examples: https://docs.astro.build/en/guides/actions." : "If you need to return a Response object, try using a server endpoint instead. See https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes";
    }
    throw new AstroError({
      ...ActionsReturnedInvalidDataError,
      message: ActionsReturnedInvalidDataError.message(String(e2)),
      hint
    });
  }
  return {
    type: "data",
    status: 200,
    contentType: "application/json+devalue",
    body
  };
}
function deserializeActionResult(res) {
  if (res.type === "error") {
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      return {
        data: void 0,
        error: new ActionError({
          message: res.body,
          code: "INTERNAL_SERVER_ERROR"
        })
      };
    }
    if (import.meta.env?.PROD) {
      return { error: ActionError.fromJson(json), data: void 0 };
    } else {
      const error2 = ActionError.fromJson(json);
      error2.stack = actionResultErrorStack.get();
      return {
        error: error2,
        data: void 0
      };
    }
  }
  if (res.type === "empty") {
    return { data: void 0, error: void 0 };
  }
  return {
    data: parse2(res.body, {
      URL: (href) => new URL(href)
    }),
    error: void 0
  };
}
var actionResultErrorStack = /* @__PURE__ */ function actionResultErrorStackFn() {
  let errorStack;
  return {
    set(stack) {
      errorStack = stack;
    },
    get() {
      return errorStack;
    }
  };
}();

// examples/testapp-ssr/node_modules/astro/dist/actions/runtime/utils.js
var ACTION_API_CONTEXT_SYMBOL = Symbol.for("astro.actionAPIContext");
var formContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];
function hasContentType(contentType, expected) {
  const type = contentType.split(";")[0].toLowerCase();
  return expected.some((t4) => type === t4);
}

// examples/testapp-ssr/node_modules/astro/dist/actions/runtime/server.js
function getActionContext(context) {
  const callerInfo = getCallerInfo(context);
  const actionResultAlreadySet = Boolean(context.locals._actionPayload);
  let action = void 0;
  if (callerInfo && context.request.method === "POST" && !actionResultAlreadySet) {
    action = {
      calledFrom: callerInfo.from,
      name: callerInfo.name,
      handler: async () => {
        const pipeline2 = Reflect.get(context, apiContextRoutesSymbol);
        const callerInfoName = shouldAppendForwardSlash(
          pipeline2.manifest.trailingSlash,
          pipeline2.manifest.buildFormat
        ) ? removeTrailingForwardSlash(callerInfo.name) : callerInfo.name;
        let baseAction;
        try {
          baseAction = await pipeline2.getAction(callerInfoName);
        } catch (error2) {
          if (error2 instanceof Error && "name" in error2 && typeof error2.name === "string" && error2.name === ActionNotFoundError.name) {
            return { data: void 0, error: new ActionError({ code: "NOT_FOUND" }) };
          }
          throw error2;
        }
        const bodySizeLimit = pipeline2.manifest.actionBodySizeLimit;
        let input;
        try {
          input = await parseRequestBody(context.request, bodySizeLimit);
        } catch (e2) {
          if (e2 instanceof ActionError) {
            return { data: void 0, error: e2 };
          }
          if (e2 instanceof TypeError) {
            return { data: void 0, error: new ActionError({ code: "UNSUPPORTED_MEDIA_TYPE" }) };
          }
          throw e2;
        }
        const omitKeys = ["props", "getActionResult", "callAction", "redirect"];
        const actionAPIContext = Object.create(
          Object.getPrototypeOf(context),
          Object.fromEntries(
            Object.entries(Object.getOwnPropertyDescriptors(context)).filter(
              ([key]) => !omitKeys.includes(key)
            )
          )
        );
        Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
        const handler = baseAction.bind(actionAPIContext);
        return handler(input);
      }
    };
  }
  function setActionResult(actionName, actionResult) {
    context.locals._actionPayload = {
      actionResult,
      actionName
    };
  }
  return {
    action,
    setActionResult,
    serializeActionResult,
    deserializeActionResult
  };
}
function getCallerInfo(ctx) {
  if (ctx.routePattern === ACTION_RPC_ROUTE_PATTERN) {
    return { from: "rpc", name: ctx.url.pathname.replace(/^.*\/_actions\//, "") };
  }
  const queryParam = ctx.url.searchParams.get(ACTION_QUERY_PARAMS2.actionName);
  if (queryParam) {
    return { from: "form", name: queryParam };
  }
  return void 0;
}
async function parseRequestBody(request, bodySizeLimit) {
  const contentType = request.headers.get("content-type");
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : void 0;
  const hasContentLength = typeof contentLength === "number" && Number.isFinite(contentLength);
  if (!contentType) return void 0;
  if (hasContentLength && contentLength > bodySizeLimit) {
    throw new ActionError({
      code: "CONTENT_TOO_LARGE",
      message: `Request body exceeds ${bodySizeLimit} bytes`
    });
  }
  if (hasContentType(contentType, formContentTypes)) {
    if (!hasContentLength) {
      const body = await readRequestBodyWithLimit(request.clone(), bodySizeLimit);
      const formRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: toArrayBuffer(body)
      });
      return await formRequest.formData();
    }
    return await request.clone().formData();
  }
  if (hasContentType(contentType, ["application/json"])) {
    if (contentLength === 0) return void 0;
    if (!hasContentLength) {
      const body = await readRequestBodyWithLimit(request.clone(), bodySizeLimit);
      if (body.byteLength === 0) return void 0;
      return JSON.parse(new TextDecoder().decode(body));
    }
    return await request.clone().json();
  }
  throw new TypeError("Unsupported content type");
}
async function readRequestBodyWithLimit(request, limit) {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      if (received > limit) {
        throw new ActionError({
          code: "CONTENT_TOO_LARGE",
          message: `Request body exceeds ${limit} bytes`
        });
      }
      chunks.push(value);
    }
  }
  const buffer2 = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer2.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer2;
}
function toArrayBuffer(buffer2) {
  const copy = new Uint8Array(buffer2.byteLength);
  copy.set(buffer2);
  return copy.buffer;
}

// examples/testapp-ssr/node_modules/es-module-lexer/dist/lexer.js
var ImportType;
!function(A2) {
  A2[A2.Static = 1] = "Static", A2[A2.Dynamic = 2] = "Dynamic", A2[A2.ImportMeta = 3] = "ImportMeta", A2[A2.StaticSourcePhase = 4] = "StaticSourcePhase", A2[A2.DynamicSourcePhase = 5] = "DynamicSourcePhase", A2[A2.StaticDeferPhase = 6] = "StaticDeferPhase", A2[A2.DynamicDeferPhase = 7] = "DynamicDeferPhase";
}(ImportType || (ImportType = {}));
var A = 1 === new Uint8Array(new Uint16Array([1]).buffer)[0];
var C;
var E = () => {
  return A2 = "AGFzbQEAAAABKwhgAX8Bf2AEf39/fwBgAAF/YAAAYAF/AGADf39/AX9gAn9/AX9gA39/fwADMTAAAQECAgICAgICAgICAgICAgICAgIAAwMDBAQAAAUAAAAAAAMDAwAGAAAABwAGAgUEBQFwAQEBBQMBAAEGDwJ/AUHA8gALfwBBwPIACwd6FQZtZW1vcnkCAAJzYQAAAWUAAwJpcwAEAmllAAUCc3MABgJzZQAHAml0AAgCYWkACQJpZAAKAmlwAAsCZXMADAJlZQANA2VscwAOA2VsZQAPAnJpABACcmUAEQFmABICbXMAEwVwYXJzZQAUC19faGVhcF9iYXNlAwEKzkQwaAEBf0EAIAA2AoAKQQAoAtwJIgEgAEEBdGoiAEEAOwEAQQAgAEECaiIANgKECkEAIAA2AogKQQBBADYC4AlBAEEANgLwCUEAQQA2AugJQQBBADYC5AlBAEEANgL4CUEAQQA2AuwJIAEL0wEBA39BACgC8AkhBEEAQQAoAogKIgU2AvAJQQAgBDYC9AlBACAFQSRqNgKICiAEQSBqQeAJIAQbIAU2AgBBACgC1AkhBEEAKALQCSEGIAUgATYCACAFIAA2AgggBSACIAJBAmpBACAGIANGIgAbIAQgA0YiBBs2AgwgBSADNgIUIAVBADYCECAFIAI2AgQgBUEANgIgIAVBA0EBQQIgABsgBBs2AhwgBUEAKALQCSADRiICOgAYAkACQCACDQBBACgC1AkgA0cNAQtBAEEBOgCMCgsLXgEBf0EAKAL4CSIEQRBqQeQJIAQbQQAoAogKIgQ2AgBBACAENgL4CUEAIARBFGo2AogKQQBBAToAjAogBEEANgIQIAQgAzYCDCAEIAI2AgggBCABNgIEIAQgADYCAAsIAEEAKAKQCgsVAEEAKALoCSgCAEEAKALcCWtBAXULHgEBf0EAKALoCSgCBCIAQQAoAtwJa0EBdUF/IAAbCxUAQQAoAugJKAIIQQAoAtwJa0EBdQseAQF/QQAoAugJKAIMIgBBACgC3AlrQQF1QX8gABsLCwBBACgC6AkoAhwLHgEBf0EAKALoCSgCECIAQQAoAtwJa0EBdUF/IAAbCzsBAX8CQEEAKALoCSgCFCIAQQAoAtAJRw0AQX8PCwJAIABBACgC1AlHDQBBfg8LIABBACgC3AlrQQF1CwsAQQAoAugJLQAYCxUAQQAoAuwJKAIAQQAoAtwJa0EBdQsVAEEAKALsCSgCBEEAKALcCWtBAXULHgEBf0EAKALsCSgCCCIAQQAoAtwJa0EBdUF/IAAbCx4BAX9BACgC7AkoAgwiAEEAKALcCWtBAXVBfyAAGwslAQF/QQBBACgC6AkiAEEgakHgCSAAGygCACIANgLoCSAAQQBHCyUBAX9BAEEAKALsCSIAQRBqQeQJIAAbKAIAIgA2AuwJIABBAEcLCABBAC0AlAoLCABBAC0AjAoL3Q0BBX8jAEGA0ABrIgAkAEEAQQE6AJQKQQBBACgC2Ak2ApwKQQBBACgC3AlBfmoiATYCsApBACABQQAoAoAKQQF0aiICNgK0CkEAQQA6AIwKQQBBADsBlgpBAEEAOwGYCkEAQQA6AKAKQQBBADYCkApBAEEAOgD8CUEAIABBgBBqNgKkCkEAIAA2AqgKQQBBADoArAoCQAJAAkACQANAQQAgAUECaiIDNgKwCiABIAJPDQECQCADLwEAIgJBd2pBBUkNAAJAAkACQAJAAkAgAkGbf2oOBQEICAgCAAsgAkEgRg0EIAJBL0YNAyACQTtGDQIMBwtBAC8BmAoNASADEBVFDQEgAUEEakGCCEEKEC8NARAWQQAtAJQKDQFBAEEAKAKwCiIBNgKcCgwHCyADEBVFDQAgAUEEakGMCEEKEC8NABAXC0EAQQAoArAKNgKcCgwBCwJAIAEvAQQiA0EqRg0AIANBL0cNBBAYDAELQQEQGQtBACgCtAohAkEAKAKwCiEBDAALC0EAIQIgAyEBQQAtAPwJDQIMAQtBACABNgKwCkEAQQA6AJQKCwNAQQAgAUECaiIDNgKwCgJAAkACQAJAAkACQAJAIAFBACgCtApPDQAgAy8BACICQXdqQQVJDQYCQAJAAkACQAJAAkACQAJAAkACQCACQWBqDgoQDwYPDw8PBQECAAsCQAJAAkACQCACQaB/ag4KCxISAxIBEhISAgALIAJBhX9qDgMFEQYJC0EALwGYCg0QIAMQFUUNECABQQRqQYIIQQoQLw0QEBYMEAsgAxAVRQ0PIAFBBGpBjAhBChAvDQ8QFwwPCyADEBVFDQ4gASkABELsgISDsI7AOVINDiABLwEMIgNBd2oiAUEXSw0MQQEgAXRBn4CABHFFDQwMDQtBAEEALwGYCiIBQQFqOwGYCkEAKAKkCiABQQN0aiIBQQE2AgAgAUEAKAKcCjYCBAwNC0EALwGYCiIDRQ0JQQAgA0F/aiIDOwGYCkEALwGWCiICRQ0MQQAoAqQKIANB//8DcUEDdGooAgBBBUcNDAJAIAJBAnRBACgCqApqQXxqKAIAIgMoAgQNACADQQAoApwKQQJqNgIEC0EAIAJBf2o7AZYKIAMgAUEEajYCDAwMCwJAQQAoApwKIgEvAQBBKUcNAEEAKALwCSIDRQ0AIAMoAgQgAUcNAEEAQQAoAvQJIgM2AvAJAkAgA0UNACADQQA2AiAMAQtBAEEANgLgCQtBAEEALwGYCiIDQQFqOwGYCkEAKAKkCiADQQN0aiIDQQZBAkEALQCsChs2AgAgAyABNgIEQQBBADoArAoMCwtBAC8BmAoiAUUNB0EAIAFBf2oiATsBmApBACgCpAogAUH//wNxQQN0aigCAEEERg0EDAoLQScQGgwJC0EiEBoMCAsgAkEvRw0HAkACQCABLwEEIgFBKkYNACABQS9HDQEQGAwKC0EBEBkMCQsCQAJAAkACQEEAKAKcCiIBLwEAIgMQG0UNAAJAAkAgA0FVag4EAAkBAwkLIAFBfmovAQBBK0YNAwwICyABQX5qLwEAQS1GDQIMBwsgA0EpRw0BQQAoAqQKQQAvAZgKIgJBA3RqKAIEEBxFDQIMBgsgAUF+ai8BAEFQakH//wNxQQpPDQULQQAvAZgKIQILAkACQCACQf//A3EiAkUNACADQeYARw0AQQAoAqQKIAJBf2pBA3RqIgQoAgBBAUcNACABQX5qLwEAQe8ARw0BIAQoAgRBlghBAxAdRQ0BDAULIANB/QBHDQBBACgCpAogAkEDdGoiAigCBBAeDQQgAigCAEEGRg0ECyABEB8NAyADRQ0DIANBL0ZBAC0AoApBAEdxDQMCQEEAKAL4CSICRQ0AIAEgAigCAEkNACABIAIoAgRNDQQLIAFBfmohAUEAKALcCSECAkADQCABQQJqIgQgAk0NAUEAIAE2ApwKIAEvAQAhAyABQX5qIgQhASADECBFDQALIARBAmohBAsCQCADQf//A3EQIUUNACAEQX5qIQECQANAIAFBAmoiAyACTQ0BQQAgATYCnAogAS8BACEDIAFBfmoiBCEBIAMQIQ0ACyAEQQJqIQMLIAMQIg0EC0EAQQE6AKAKDAcLQQAoAqQKQQAvAZgKIgFBA3QiA2pBACgCnAo2AgRBACABQQFqOwGYCkEAKAKkCiADakEDNgIACxAjDAULQQAtAPwJQQAvAZYKQQAvAZgKcnJFIQIMBwsQJEEAQQA6AKAKDAMLECVBACECDAULIANBoAFHDQELQQBBAToArAoLQQBBACgCsAo2ApwKC0EAKAKwCiEBDAALCyAAQYDQAGokACACCxoAAkBBACgC3AkgAEcNAEEBDwsgAEF+ahAmC/4KAQZ/QQBBACgCsAoiAEEMaiIBNgKwCkEAKAL4CSECQQEQKSEDAkACQAJAAkACQAJAAkACQAJAQQAoArAKIgQgAUcNACADEChFDQELAkACQAJAAkACQAJAAkAgA0EqRg0AIANB+wBHDQFBACAEQQJqNgKwCkEBECkhA0EAKAKwCiEEA0ACQAJAIANB//8DcSIDQSJGDQAgA0EnRg0AIAMQLBpBACgCsAohAwwBCyADEBpBAEEAKAKwCkECaiIDNgKwCgtBARApGgJAIAQgAxAtIgNBLEcNAEEAQQAoArAKQQJqNgKwCkEBECkhAwsgA0H9AEYNA0EAKAKwCiIFIARGDQ8gBSEEIAVBACgCtApNDQAMDwsLQQAgBEECajYCsApBARApGkEAKAKwCiIDIAMQLRoMAgtBAEEAOgCUCgJAAkACQAJAAkACQCADQZ9/ag4MAgsEAQsDCwsLCwsFAAsgA0H2AEYNBAwKC0EAIARBDmoiAzYCsAoCQAJAAkBBARApQZ9/ag4GABICEhIBEgtBACgCsAoiBSkAAkLzgOSD4I3AMVINESAFLwEKECFFDRFBACAFQQpqNgKwCkEAECkaC0EAKAKwCiIFQQJqQbIIQQ4QLw0QIAUvARAiAkF3aiIBQRdLDQ1BASABdEGfgIAEcUUNDQwOC0EAKAKwCiIFKQACQuyAhIOwjsA5Ug0PIAUvAQoiAkF3aiIBQRdNDQYMCgtBACAEQQpqNgKwCkEAECkaQQAoArAKIQQLQQAgBEEQajYCsAoCQEEBECkiBEEqRw0AQQBBACgCsApBAmo2ArAKQQEQKSEEC0EAKAKwCiEDIAQQLBogA0EAKAKwCiIEIAMgBBACQQBBACgCsApBfmo2ArAKDwsCQCAEKQACQuyAhIOwjsA5Ug0AIAQvAQoQIEUNAEEAIARBCmo2ArAKQQEQKSEEQQAoArAKIQMgBBAsGiADQQAoArAKIgQgAyAEEAJBAEEAKAKwCkF+ajYCsAoPC0EAIARBBGoiBDYCsAoLQQAgBEEGajYCsApBAEEAOgCUCkEBECkhBEEAKAKwCiEDIAQQLCEEQQAoArAKIQIgBEHf/wNxIgFB2wBHDQNBACACQQJqNgKwCkEBECkhBUEAKAKwCiEDQQAhBAwEC0EAQQE6AIwKQQBBACgCsApBAmo2ArAKC0EBECkhBEEAKAKwCiEDAkAgBEHmAEcNACADQQJqQawIQQYQLw0AQQAgA0EIajYCsAogAEEBEClBABArIAJBEGpB5AkgAhshAwNAIAMoAgAiA0UNBSADQgA3AgggA0EQaiEDDAALC0EAIANBfmo2ArAKDAMLQQEgAXRBn4CABHFFDQMMBAtBASEECwNAAkACQCAEDgIAAQELIAVB//8DcRAsGkEBIQQMAQsCQAJAQQAoArAKIgQgA0YNACADIAQgAyAEEAJBARApIQQCQCABQdsARw0AIARBIHJB/QBGDQQLQQAoArAKIQMCQCAEQSxHDQBBACADQQJqNgKwCkEBECkhBUEAKAKwCiEDIAVBIHJB+wBHDQILQQAgA0F+ajYCsAoLIAFB2wBHDQJBACACQX5qNgKwCg8LQQAhBAwACwsPCyACQaABRg0AIAJB+wBHDQQLQQAgBUEKajYCsApBARApIgVB+wBGDQMMAgsCQCACQVhqDgMBAwEACyACQaABRw0CC0EAIAVBEGo2ArAKAkBBARApIgVBKkcNAEEAQQAoArAKQQJqNgKwCkEBECkhBQsgBUEoRg0BC0EAKAKwCiEBIAUQLBpBACgCsAoiBSABTQ0AIAQgAyABIAUQAkEAQQAoArAKQX5qNgKwCg8LIAQgA0EAQQAQAkEAIARBDGo2ArAKDwsQJQuFDAEKf0EAQQAoArAKIgBBDGoiATYCsApBARApIQJBACgCsAohAwJAAkACQAJAAkACQAJAAkAgAkEuRw0AQQAgA0ECajYCsAoCQEEBECkiAkHkAEYNAAJAIAJB8wBGDQAgAkHtAEcNB0EAKAKwCiICQQJqQZwIQQYQLw0HAkBBACgCnAoiAxAqDQAgAy8BAEEuRg0ICyAAIAAgAkEIakEAKALUCRABDwtBACgCsAoiAkECakGiCEEKEC8NBgJAQQAoApwKIgMQKg0AIAMvAQBBLkYNBwtBACEEQQAgAkEMajYCsApBASEFQQUhBkEBECkhAkEAIQdBASEIDAILQQAoArAKIgIpAAJC5YCYg9CMgDlSDQUCQEEAKAKcCiIDECoNACADLwEAQS5GDQYLQQAhBEEAIAJBCmo2ArAKQQIhCEEHIQZBASEHQQEQKSECQQEhBQwBCwJAAkACQAJAIAJB8wBHDQAgAyABTQ0AIANBAmpBoghBChAvDQACQCADLwEMIgRBd2oiB0EXSw0AQQEgB3RBn4CABHENAgsgBEGgAUYNAQtBACEHQQchBkEBIQQgAkHkAEYNAQwCC0EAIQRBACADQQxqIgI2ArAKQQEhBUEBECkhCQJAQQAoArAKIgYgAkYNAEHmACECAkAgCUHmAEYNAEEFIQZBACEHQQEhCCAJIQIMBAtBACEHQQEhCCAGQQJqQawIQQYQLw0EIAYvAQgQIEUNBAtBACEHQQAgAzYCsApBByEGQQEhBEEAIQVBACEIIAkhAgwCCyADIABBCmpNDQBBACEIQeQAIQICQCADKQACQuWAmIPQjIA5Ug0AAkACQCADLwEKIgRBd2oiB0EXSw0AQQEgB3RBn4CABHENAQtBACEIIARBoAFHDQELQQAhBUEAIANBCmo2ArAKQSohAkEBIQdBAiEIQQEQKSIJQSpGDQRBACADNgKwCkEBIQRBACEHQQAhCCAJIQIMAgsgAyEGQQAhBwwCC0EAIQVBACEICwJAIAJBKEcNAEEAKAKkCkEALwGYCiICQQN0aiIDQQAoArAKNgIEQQAgAkEBajsBmAogA0EFNgIAQQAoApwKLwEAQS5GDQRBAEEAKAKwCiIDQQJqNgKwCkEBECkhAiAAQQAoArAKQQAgAxABAkACQCAFDQBBACgC8AkhAQwBC0EAKALwCSIBIAY2AhwLQQBBAC8BlgoiA0EBajsBlgpBACgCqAogA0ECdGogATYCAAJAIAJBIkYNACACQSdGDQBBAEEAKAKwCkF+ajYCsAoPCyACEBpBAEEAKAKwCkECaiICNgKwCgJAAkACQEEBEClBV2oOBAECAgACC0EAQQAoArAKQQJqNgKwCkEBECkaQQAoAvAJIgMgAjYCBCADQQE6ABggA0EAKAKwCiICNgIQQQAgAkF+ajYCsAoPC0EAKALwCSIDIAI2AgQgA0EBOgAYQQBBAC8BmApBf2o7AZgKIANBACgCsApBAmo2AgxBAEEALwGWCkF/ajsBlgoPC0EAQQAoArAKQX5qNgKwCg8LAkAgBEEBcyACQfsAR3INAEEAKAKwCiECQQAvAZgKDQUDQAJAAkACQCACQQAoArQKTw0AQQEQKSICQSJGDQEgAkEnRg0BIAJB/QBHDQJBAEEAKAKwCkECajYCsAoLQQEQKSEDQQAoArAKIQICQCADQeYARw0AIAJBAmpBrAhBBhAvDQcLQQAgAkEIajYCsAoCQEEBECkiAkEiRg0AIAJBJ0cNBwsgACACQQAQKw8LIAIQGgtBAEEAKAKwCkECaiICNgKwCgwACwsCQAJAIAJBWWoOBAMBAQMACyACQSJGDQILQQAoArAKIQYLIAYgAUcNAEEAIABBCmo2ArAKDwsgAkEqRyAHcQ0DQQAvAZgKQf//A3ENA0EAKAKwCiECQQAoArQKIQEDQCACIAFPDQECQAJAIAIvAQAiA0EnRg0AIANBIkcNAQsgACADIAgQKw8LQQAgAkECaiICNgKwCgwACwsQJQsPC0EAIAJBfmo2ArAKDwtBAEEAKAKwCkF+ajYCsAoLRwEDf0EAKAKwCkECaiEAQQAoArQKIQECQANAIAAiAkF+aiABTw0BIAJBAmohACACLwEAQXZqDgQBAAABAAsLQQAgAjYCsAoLmAEBA39BAEEAKAKwCiIBQQJqNgKwCiABQQZqIQFBACgCtAohAgNAAkACQAJAIAFBfGogAk8NACABQX5qLwEAIQMCQAJAIAANACADQSpGDQEgA0F2ag4EAgQEAgQLIANBKkcNAwsgAS8BAEEvRw0CQQAgAUF+ajYCsAoMAQsgAUF+aiEBC0EAIAE2ArAKDwsgAUECaiEBDAALC4gBAQR/QQAoArAKIQFBACgCtAohAgJAAkADQCABIgNBAmohASADIAJPDQEgAS8BACIEIABGDQICQCAEQdwARg0AIARBdmoOBAIBAQIBCyADQQRqIQEgAy8BBEENRw0AIANBBmogASADLwEGQQpGGyEBDAALC0EAIAE2ArAKECUPC0EAIAE2ArAKC2wBAX8CQAJAIABBX2oiAUEFSw0AQQEgAXRBMXENAQsgAEFGakH//wNxQQZJDQAgAEEpRyAAQVhqQf//A3FBB0lxDQACQCAAQaV/ag4EAQAAAQALIABB/QBHIABBhX9qQf//A3FBBElxDwtBAQsuAQF/QQEhAQJAIABBpglBBRAdDQAgAEGWCEEDEB0NACAAQbAJQQIQHSEBCyABC0YBA39BACEDAkAgACACQQF0IgJrIgRBAmoiAEEAKALcCSIFSQ0AIAAgASACEC8NAAJAIAAgBUcNAEEBDwsgBBAmIQMLIAMLgwEBAn9BASEBAkACQAJAAkACQAJAIAAvAQAiAkFFag4EBQQEAQALAkAgAkGbf2oOBAMEBAIACyACQSlGDQQgAkH5AEcNAyAAQX5qQbwJQQYQHQ8LIABBfmovAQBBPUYPCyAAQX5qQbQJQQQQHQ8LIABBfmpByAlBAxAdDwtBACEBCyABC7QDAQJ/QQAhAQJAAkACQAJAAkACQAJAAkACQAJAIAAvAQBBnH9qDhQAAQIJCQkJAwkJBAUJCQYJBwkJCAkLAkACQCAAQX5qLwEAQZd/ag4EAAoKAQoLIABBfGpByghBAhAdDwsgAEF8akHOCEEDEB0PCwJAAkACQCAAQX5qLwEAQY1/ag4DAAECCgsCQCAAQXxqLwEAIgJB4QBGDQAgAkHsAEcNCiAAQXpqQeUAECcPCyAAQXpqQeMAECcPCyAAQXxqQdQIQQQQHQ8LIABBfGpB3AhBBhAdDwsgAEF+ai8BAEHvAEcNBiAAQXxqLwEAQeUARw0GAkAgAEF6ai8BACICQfAARg0AIAJB4wBHDQcgAEF4akHoCEEGEB0PCyAAQXhqQfQIQQIQHQ8LIABBfmpB+AhBBBAdDwtBASEBIABBfmoiAEHpABAnDQQgAEGACUEFEB0PCyAAQX5qQeQAECcPCyAAQX5qQYoJQQcQHQ8LIABBfmpBmAlBBBAdDwsCQCAAQX5qLwEAIgJB7wBGDQAgAkHlAEcNASAAQXxqQe4AECcPCyAAQXxqQaAJQQMQHSEBCyABCzQBAX9BASEBAkAgAEF3akH//wNxQQVJDQAgAEGAAXJBoAFGDQAgAEEuRyAAEChxIQELIAELMAEBfwJAAkAgAEF3aiIBQRdLDQBBASABdEGNgIAEcQ0BCyAAQaABRg0AQQAPC0EBC04BAn9BACEBAkACQCAALwEAIgJB5QBGDQAgAkHrAEcNASAAQX5qQfgIQQQQHQ8LIABBfmovAQBB9QBHDQAgAEF8akHcCEEGEB0hAQsgAQveAQEEf0EAKAKwCiEAQQAoArQKIQECQAJAAkADQCAAIgJBAmohACACIAFPDQECQAJAAkAgAC8BACIDQaR/ag4FAgMDAwEACyADQSRHDQIgAi8BBEH7AEcNAkEAIAJBBGoiADYCsApBAEEALwGYCiICQQFqOwGYCkEAKAKkCiACQQN0aiICQQQ2AgAgAiAANgIEDwtBACAANgKwCkEAQQAvAZgKQX9qIgA7AZgKQQAoAqQKIABB//8DcUEDdGooAgBBA0cNAwwECyACQQRqIQAMAAsLQQAgADYCsAoLECULC3ABAn8CQAJAA0BBAEEAKAKwCiIAQQJqIgE2ArAKIABBACgCtApPDQECQAJAAkAgAS8BACIBQaV/ag4CAQIACwJAIAFBdmoOBAQDAwQACyABQS9HDQIMBAsQLhoMAQtBACAAQQRqNgKwCgwACwsQJQsLNQEBf0EAQQE6APwJQQAoArAKIQBBAEEAKAK0CkECajYCsApBACAAQQAoAtwJa0EBdTYCkAoLQwECf0EBIQECQCAALwEAIgJBd2pB//8DcUEFSQ0AIAJBgAFyQaABRg0AQQAhASACEChFDQAgAkEuRyAAECpyDwsgAQs9AQJ/QQAhAgJAQQAoAtwJIgMgAEsNACAALwEAIAFHDQACQCADIABHDQBBAQ8LIABBfmovAQAQICECCyACC2gBAn9BASEBAkACQCAAQV9qIgJBBUsNAEEBIAJ0QTFxDQELIABB+P8DcUEoRg0AIABBRmpB//8DcUEGSQ0AAkAgAEGlf2oiAkEDSw0AIAJBAUcNAQsgAEGFf2pB//8DcUEESSEBCyABC5wBAQN/QQAoArAKIQECQANAAkACQCABLwEAIgJBL0cNAAJAIAEvAQIiAUEqRg0AIAFBL0cNBBAYDAILIAAQGQwBCwJAAkAgAEUNACACQXdqIgFBF0sNAUEBIAF0QZ+AgARxRQ0BDAILIAIQIUUNAwwBCyACQaABRw0CC0EAQQAoArAKIgNBAmoiATYCsAogA0EAKAK0CkkNAAsLIAILMQEBf0EAIQECQCAALwEAQS5HDQAgAEF+ai8BAEEuRw0AIABBfGovAQBBLkYhAQsgAQumBAEBfwJAIAFBIkYNACABQSdGDQAQJQ8LQQAoArAKIQMgARAaIAAgA0ECakEAKAKwCkEAKALQCRABAkAgAkEBSA0AQQAoAvAJQQRBBiACQQFGGzYCHAtBAEEAKAKwCkECajYCsAoCQAJAAkACQEEAECkiAUHhAEYNACABQfcARg0BQQAoArAKIQEMAgtBACgCsAoiAUECakHACEEKEC8NAUEGIQIMAgtBACgCsAoiAS8BAkHpAEcNACABLwEEQfQARw0AQQQhAiABLwEGQegARg0BC0EAIAFBfmo2ArAKDwtBACABIAJBAXRqNgKwCgJAQQEQKUH7AEYNAEEAIAE2ArAKDwtBACgCsAoiACECA0BBACACQQJqNgKwCgJAAkACQEEBECkiAkEiRg0AIAJBJ0cNAUEnEBpBAEEAKAKwCkECajYCsApBARApIQIMAgtBIhAaQQBBACgCsApBAmo2ArAKQQEQKSECDAELIAIQLCECCwJAIAJBOkYNAEEAIAE2ArAKDwtBAEEAKAKwCkECajYCsAoCQEEBECkiAkEiRg0AIAJBJ0YNAEEAIAE2ArAKDwsgAhAaQQBBACgCsApBAmo2ArAKAkACQEEBECkiAkEsRg0AIAJB/QBGDQFBACABNgKwCg8LQQBBACgCsApBAmo2ArAKQQEQKUH9AEYNAEEAKAKwCiECDAELC0EAKALwCSIBIAA2AhAgAUEAKAKwCkECajYCDAttAQJ/AkACQANAAkAgAEH//wNxIgFBd2oiAkEXSw0AQQEgAnRBn4CABHENAgsgAUGgAUYNASAAIQIgARAoDQJBACECQQBBACgCsAoiAEECajYCsAogAC8BAiIADQAMAgsLIAAhAgsgAkH//wNxC6sBAQR/AkACQEEAKAKwCiICLwEAIgNB4QBGDQAgASEEIAAhBQwBC0EAIAJBBGo2ArAKQQEQKSECQQAoArAKIQUCQAJAIAJBIkYNACACQSdGDQAgAhAsGkEAKAKwCiEEDAELIAIQGkEAQQAoArAKQQJqIgQ2ArAKC0EBECkhA0EAKAKwCiECCwJAIAIgBUYNACAFIARBACAAIAAgAUYiAhtBACABIAIbEAILIAMLcgEEf0EAKAKwCiEAQQAoArQKIQECQAJAA0AgAEECaiECIAAgAU8NAQJAAkAgAi8BACIDQaR/ag4CAQQACyACIQAgA0F2ag4EAgEBAgELIABBBGohAAwACwtBACACNgKwChAlQQAPC0EAIAI2ArAKQd0AC0kBA39BACEDAkAgAkUNAAJAA0AgAC0AACIEIAEtAAAiBUcNASABQQFqIQEgAEEBaiEAIAJBf2oiAg0ADAILCyAEIAVrIQMLIAMLC+wBAgBBgAgLzgEAAHgAcABvAHIAdABtAHAAbwByAHQAZgBvAHIAZQB0AGEAbwB1AHIAYwBlAHIAbwBtAHUAbgBjAHQAaQBvAG4AcwBzAGUAcgB0AHYAbwB5AGkAZQBkAGUAbABlAGMAbwBuAHQAaQBuAGkAbgBzAHQAYQBuAHQAeQBiAHIAZQBhAHIAZQB0AHUAcgBkAGUAYgB1AGcAZwBlAGEAdwBhAGkAdABoAHIAdwBoAGkAbABlAGkAZgBjAGEAdABjAGYAaQBuAGEAbABsAGUAbABzAABB0AkLEAEAAAACAAAAAAQAAEA5AAA=", "undefined" != typeof Buffer ? Buffer.from(A2, "base64") : Uint8Array.from(atob(A2), (A3) => A3.charCodeAt(0));
  var A2;
};
var init = WebAssembly.compile(E()).then(WebAssembly.instantiate).then(({ exports: A2 }) => {
  C = A2;
});

// examples/testapp-ssr/node_modules/astro/dist/actions/utils.js
function hasActionPayload(locals) {
  return "_actionPayload" in locals;
}
function createGetActionResult(locals) {
  return (actionFn) => {
    if (!hasActionPayload(locals) || actionFn.toString() !== getActionQueryString(locals._actionPayload.actionName)) {
      return void 0;
    }
    return deserializeActionResult(locals._actionPayload.actionResult);
  };
}
function createCallAction(context) {
  return (baseAction, input) => {
    Reflect.set(context, ACTION_API_CONTEXT_SYMBOL, true);
    const action = baseAction.bind(context);
    return action(input);
  };
}

// examples/testapp-ssr/node_modules/astro/dist/i18n/utils.js
function parseLocale(header) {
  if (header === "*") {
    return [{ locale: header, qualityValue: void 0 }];
  }
  const result = [];
  const localeValues = header.split(",").map((str) => str.trim());
  for (const localeValue of localeValues) {
    const split = localeValue.split(";").map((str) => str.trim());
    const localeName = split[0];
    const qualityValue = split[1];
    if (!split) {
      continue;
    }
    if (qualityValue && qualityValue.startsWith("q=")) {
      const qualityValueAsFloat = Number.parseFloat(qualityValue.slice("q=".length));
      if (Number.isNaN(qualityValueAsFloat) || qualityValueAsFloat > 1) {
        result.push({
          locale: localeName,
          qualityValue: void 0
        });
      } else {
        result.push({
          locale: localeName,
          qualityValue: qualityValueAsFloat
        });
      }
    } else {
      result.push({
        locale: localeName,
        qualityValue: void 0
      });
    }
  }
  return result;
}
function sortAndFilterLocales(browserLocaleList, locales) {
  const normalizedLocales = getAllCodes(locales).map(normalizeTheLocale);
  return browserLocaleList.filter((browserLocale) => {
    if (browserLocale.locale !== "*") {
      return normalizedLocales.includes(normalizeTheLocale(browserLocale.locale));
    }
    return true;
  }).sort((a2, b) => {
    if (a2.qualityValue && b.qualityValue) {
      return Math.sign(b.qualityValue - a2.qualityValue);
    }
    return 0;
  });
}
function computePreferredLocale(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = void 0;
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    const firstResult = browserLocaleList.at(0);
    if (firstResult && firstResult.locale !== "*") {
      for (const currentLocale of locales) {
        if (typeof currentLocale === "string") {
          if (normalizeTheLocale(currentLocale) === normalizeTheLocale(firstResult.locale)) {
            result = currentLocale;
            break;
          }
        } else {
          for (const currentCode of currentLocale.codes) {
            if (normalizeTheLocale(currentCode) === normalizeTheLocale(firstResult.locale)) {
              result = currentCode;
              break;
            }
          }
        }
      }
    }
  }
  return result;
}
function computePreferredLocaleList(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = [];
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    if (browserLocaleList.length === 1 && browserLocaleList.at(0).locale === "*") {
      return getAllCodes(locales);
    } else if (browserLocaleList.length > 0) {
      for (const browserLocale of browserLocaleList) {
        for (const loopLocale of locales) {
          if (typeof loopLocale === "string") {
            if (normalizeTheLocale(loopLocale) === normalizeTheLocale(browserLocale.locale)) {
              result.push(loopLocale);
            }
          } else {
            for (const code of loopLocale.codes) {
              if (code === browserLocale.locale) {
                result.push(code);
              }
            }
          }
        }
      }
    }
  }
  return result;
}
function computeCurrentLocale(pathname, locales, defaultLocale) {
  for (const segment of pathname.split("/").map(normalizeThePath)) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (!segment.includes(locale)) continue;
        if (normalizeTheLocale(locale) === normalizeTheLocale(segment)) {
          return locale;
        }
      } else {
        if (locale.path === segment) {
          return locale.codes.at(0);
        } else {
          for (const code of locale.codes) {
            if (normalizeTheLocale(code) === normalizeTheLocale(segment)) {
              return code;
            }
          }
        }
      }
    }
  }
  for (const locale of locales) {
    if (typeof locale === "string") {
      if (locale === defaultLocale) {
        return locale;
      }
    } else {
      if (locale.path === defaultLocale) {
        return locale.codes.at(0);
      }
    }
  }
}

// examples/testapp-ssr/node_modules/astro/dist/core/csp/runtime.js
function deduplicateDirectiveValues(existingDirective, newDirective) {
  const [directiveName, ...existingValues] = existingDirective.split(/\s+/).filter(Boolean);
  const [newDirectiveName, ...newValues] = newDirective.split(/\s+/).filter(Boolean);
  if (directiveName !== newDirectiveName) {
    return void 0;
  }
  const finalDirectives = Array.from(/* @__PURE__ */ new Set([...existingValues, ...newValues]));
  return `${directiveName} ${finalDirectives.join(" ")}`;
}
function pushDirective(directives, newDirective) {
  let deduplicated = false;
  if (directives.length === 0) {
    return [newDirective];
  }
  const finalDirectives = [];
  for (const directive of directives) {
    if (deduplicated) {
      finalDirectives.push(directive);
      continue;
    }
    const result = deduplicateDirectiveValues(directive, newDirective);
    if (result) {
      finalDirectives.push(result);
      deduplicated = true;
    } else {
      finalDirectives.push(directive);
      finalDirectives.push(newDirective);
    }
  }
  return finalDirectives;
}

// examples/testapp-ssr/node_modules/astro/dist/core/render-context.js
init_encryption();
init_errors_data();
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/core/middleware/callMiddleware.js
init_errors3();
async function callMiddleware(onRequest2, apiContext, responseFunction) {
  let nextCalled = false;
  let responseFunctionPromise = void 0;
  const next = async (payload) => {
    nextCalled = true;
    responseFunctionPromise = responseFunction(apiContext, payload);
    return responseFunctionPromise;
  };
  let middlewarePromise = onRequest2(apiContext, next);
  return await Promise.resolve(middlewarePromise).then(async (value) => {
    if (nextCalled) {
      if (typeof value !== "undefined") {
        if (value instanceof Response === false) {
          throw new AstroError(errors_data_exports.MiddlewareNotAResponse);
        }
        return value;
      } else {
        if (responseFunctionPromise) {
          return responseFunctionPromise;
        } else {
          throw new AstroError(errors_data_exports.MiddlewareNotAResponse);
        }
      }
    } else if (typeof value === "undefined") {
      throw new AstroError(errors_data_exports.MiddlewareNoDataOrNextCalled);
    } else if (value instanceof Response === false) {
      throw new AstroError(errors_data_exports.MiddlewareNotAResponse);
    } else {
      return value;
    }
  });
}

// examples/testapp-ssr/node_modules/astro/dist/core/middleware/index.js
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/core/routing/rewrite.js
init_errors3();
init_path2();

// examples/testapp-ssr/node_modules/astro/dist/core/request.js
function createRequest({
  url,
  headers,
  method = "GET",
  body = void 0,
  logger,
  isPrerendered = false,
  routePattern,
  init: init2
}) {
  const headersObj = isPrerendered ? void 0 : headers instanceof Headers ? headers : new Headers(
    // Filter out HTTP/2 pseudo-headers. These are internally-generated headers added to all HTTP/2 requests with trusted metadata about the request.
    // Examples include `:method`, `:scheme`, `:authority`, and `:path`.
    // They are always prefixed with a colon to distinguish them from other headers, and it is an error to add the to a Headers object manually.
    // See https://httpwg.org/specs/rfc7540.html#HttpRequest
    Object.entries(headers).filter(([name]) => !name.startsWith(":"))
  );
  if (typeof url === "string") url = new URL(url);
  if (isPrerendered) {
    url.search = "";
  }
  const request = new Request(url, {
    method,
    headers: headersObj,
    // body is made available only if the request is for a page that will be on-demand rendered
    body: isPrerendered ? null : body,
    ...init2
  });
  if (isPrerendered) {
    let _headers = request.headers;
    const { value, writable, ...headersDesc } = Object.getOwnPropertyDescriptor(request, "headers") || {};
    Object.defineProperty(request, "headers", {
      ...headersDesc,
      get() {
        logger.warn(
          null,
          `\`Astro.request.headers\` was used when rendering the route \`${routePattern}'\`. \`Astro.request.headers\` is not available on prerendered pages. If you need access to request headers, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default.`
        );
        return _headers;
      },
      set(newHeaders) {
        _headers = newHeaders;
      }
    });
  }
  return request;
}

// examples/testapp-ssr/node_modules/astro/dist/template/4xx.js
init_path();
init_esm();
function template({
  title,
  pathname,
  statusCode = 404,
  tabTitle,
  body
}) {
  return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>${tabTitle}</title>
		<style>
			:root {
				--gray-10: hsl(258, 7%, 10%);
				--gray-20: hsl(258, 7%, 20%);
				--gray-30: hsl(258, 7%, 30%);
				--gray-40: hsl(258, 7%, 40%);
				--gray-50: hsl(258, 7%, 50%);
				--gray-60: hsl(258, 7%, 60%);
				--gray-70: hsl(258, 7%, 70%);
				--gray-80: hsl(258, 7%, 80%);
				--gray-90: hsl(258, 7%, 90%);
				--black: #13151A;
				--accent-light: #E0CCFA;
			}

			* {
				box-sizing: border-box;
			}

			html {
				background: var(--black);
				color-scheme: dark;
				accent-color: var(--accent-light);
			}

			body {
				background-color: var(--gray-10);
				color: var(--gray-80);
				font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
				line-height: 1.5;
				margin: 0;
			}

			a {
				color: var(--accent-light);
			}

			.center {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100vh;
				width: 100vw;
			}

			h1 {
				margin-bottom: 8px;
				color: white;
				font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
				font-weight: 700;
				margin-top: 1rem;
				margin-bottom: 0;
			}

			.statusCode {
				color: var(--accent-light);
			}

			.astro-icon {
				height: 124px;
				width: 124px;
			}

			pre, code {
				padding: 2px 8px;
				background: rgba(0,0,0, 0.25);
				border: 1px solid rgba(255,255,255, 0.25);
				border-radius: 4px;
				font-size: 1.2em;
				margin-top: 0;
				max-width: 60em;
			}
		</style>
	</head>
	<body>
		<main class="center">
			<svg class="astro-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 64 80" fill="none"> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="white"/> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="url(#paint0_linear_738_686)"/> <path d="M0 51.6401C0 51.6401 10.6488 46.4654 21.3274 46.4654L29.3786 21.6102C29.6801 20.4082 30.5602 19.5913 31.5538 19.5913C32.5474 19.5913 33.4275 20.4082 33.7289 21.6102L41.7802 46.4654C54.4274 46.4654 63.1076 51.6401 63.1076 51.6401C63.1076 51.6401 45.0197 2.48776 44.9843 2.38914C44.4652 0.935933 43.5888 0 42.4073 0H20.7022C19.5206 0 18.6796 0.935933 18.1251 2.38914C18.086 2.4859 0 51.6401 0 51.6401Z" fill="white"/> <defs> <linearGradient id="paint0_linear_738_686" x1="31.554" y1="75.4423" x2="39.7462" y2="48.376" gradientUnits="userSpaceOnUse"> <stop stop-color="#D83333"/> <stop offset="1" stop-color="#F041FF"/> </linearGradient> </defs> </svg>
			<h1>${statusCode ? `<span class="statusCode">${statusCode}: </span> ` : ""}<span class="statusMessage">${title}</span></h1>
			${body || `
				<pre>Path: ${escape(pathname)}</pre>
			`}
			</main>
	</body>
</html>`;
}

// examples/testapp-ssr/node_modules/astro/dist/core/routing/astro-designed-error-pages.js
var DEFAULT_404_ROUTE = {
  component: DEFAULT_404_COMPONENT,
  generate: () => "",
  params: [],
  pattern: /^\/404\/?$/,
  prerender: false,
  pathname: "/404",
  segments: [[{ content: "404", dynamic: false, spread: false }]],
  type: "page",
  route: "/404",
  fallbackRoutes: [],
  isIndex: false,
  origin: "internal"
};
function ensure404Route(manifest2) {
  if (!manifest2.routes.some((route) => route.route === "/404")) {
    manifest2.routes.push(DEFAULT_404_ROUTE);
  }
  return manifest2;
}
async function default404Page({ pathname }) {
  return new Response(
    template({
      statusCode: 404,
      title: "Not found",
      tabTitle: "404: Not Found",
      pathname
    }),
    { status: 404, headers: { "Content-Type": "text/html" } }
  );
}
default404Page.isAstroComponentFactory = true;
var default404Instance = {
  default: default404Page
};

// examples/testapp-ssr/node_modules/astro/dist/core/routing/rewrite.js
function findRouteToRewrite({
  payload,
  routes,
  request,
  trailingSlash,
  buildFormat,
  base,
  outDir
}) {
  let newUrl = void 0;
  if (payload instanceof URL) {
    newUrl = payload;
  } else if (payload instanceof Request) {
    newUrl = new URL(payload.url);
  } else {
    newUrl = new URL(payload, new URL(request.url).origin);
  }
  let pathname = newUrl.pathname;
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  if (base !== "/") {
    const isBasePathRequest = newUrl.pathname === base || newUrl.pathname === removeTrailingForwardSlash(base);
    if (isBasePathRequest) {
      pathname = shouldAppendSlash ? "/" : "";
    } else if (newUrl.pathname.startsWith(base)) {
      pathname = shouldAppendSlash ? appendForwardSlash(newUrl.pathname) : removeTrailingForwardSlash(newUrl.pathname);
      pathname = pathname.slice(base.length);
    }
  }
  if (!pathname.startsWith("/") && shouldAppendSlash && newUrl.pathname.endsWith("/")) {
    pathname = prependForwardSlash(pathname);
  }
  if (pathname === "/" && base !== "/" && !shouldAppendSlash) {
    pathname = "";
  }
  if (buildFormat === "file") {
    pathname = pathname.replace(/\.html$/, "");
  }
  if (base !== "/" && (pathname === "" || pathname === "/") && !shouldAppendSlash) {
    newUrl.pathname = removeTrailingForwardSlash(base);
  } else {
    newUrl.pathname = joinPaths(...[base, pathname].filter(Boolean));
  }
  const decodedPathname = decodeURI(pathname);
  let foundRoute;
  for (const route of routes) {
    if (route.pattern.test(decodedPathname)) {
      if (route.params && route.params.length !== 0 && route.distURL && route.distURL.length !== 0) {
        if (!route.distURL.find(
          (url) => url.href.replace(outDir.toString(), "").replace(/(?:\/index\.html|\.html)$/, "") == trimSlashes(decodedPathname)
        )) {
          continue;
        }
      }
      foundRoute = route;
      break;
    }
  }
  if (foundRoute) {
    return {
      routeData: foundRoute,
      newUrl,
      pathname: decodedPathname
    };
  } else {
    const custom404 = routes.find((route) => route.route === "/404");
    if (custom404) {
      return { routeData: custom404, newUrl, pathname };
    } else {
      return { routeData: DEFAULT_404_ROUTE, newUrl, pathname };
    }
  }
}
function copyRequest(newUrl, oldRequest, isPrerendered, logger, routePattern) {
  if (oldRequest.bodyUsed) {
    throw new AstroError(errors_data_exports.RewriteWithBodyUsed);
  }
  return createRequest({
    url: newUrl,
    method: oldRequest.method,
    body: oldRequest.body,
    isPrerendered,
    logger,
    headers: isPrerendered ? {} : oldRequest.headers,
    routePattern,
    init: {
      referrer: oldRequest.referrer,
      referrerPolicy: oldRequest.referrerPolicy,
      mode: oldRequest.mode,
      credentials: oldRequest.credentials,
      cache: oldRequest.cache,
      redirect: oldRequest.redirect,
      integrity: oldRequest.integrity,
      signal: oldRequest.signal,
      keepalive: oldRequest.keepalive,
      // https://fetch.spec.whatwg.org/#dom-request-duplex
      // @ts-expect-error It isn't part of the types, but undici accepts it and it allows to carry over the body to a new request
      duplex: "half"
    }
  });
}
function setOriginPathname(request, pathname, trailingSlash, buildFormat) {
  if (!pathname) {
    pathname = "/";
  }
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  let finalPathname;
  if (pathname === "/") {
    finalPathname = "/";
  } else if (shouldAppendSlash) {
    finalPathname = appendForwardSlash(pathname);
  } else {
    finalPathname = removeTrailingForwardSlash(pathname);
  }
  Reflect.set(request, originPathnameSymbol, encodeURIComponent(finalPathname));
}
function getOriginPathname(request) {
  const origin = Reflect.get(request, originPathnameSymbol);
  if (origin) {
    return decodeURIComponent(origin);
  }
  return new URL(request.url).pathname;
}

// examples/testapp-ssr/node_modules/astro/dist/core/middleware/sequence.js
init_errors_data();
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/actions/noop-actions.js
var NOOP_ACTIONS_MOD = {
  server: {}
};

// examples/testapp-ssr/node_modules/astro/dist/core/app/middlewares.js
var FORM_CONTENT_TYPES = [
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
];
var SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
function createOriginCheckMiddleware() {
  return defineMiddleware((context, next) => {
    const { request, url, isPrerendered } = context;
    if (isPrerendered) {
      return next();
    }
    if (SAFE_METHODS.includes(request.method)) {
      return next();
    }
    const isSameOrigin = request.headers.get("origin") === url.origin;
    const hasContentType2 = request.headers.has("content-type");
    if (hasContentType2) {
      const formLikeHeader = hasFormLikeHeader(request.headers.get("content-type"));
      if (formLikeHeader && !isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    } else {
      if (!isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    }
    return next();
  });
}
function hasFormLikeHeader(contentType) {
  if (contentType) {
    for (const FORM_CONTENT_TYPE of FORM_CONTENT_TYPES) {
      if (contentType.toLowerCase().includes(FORM_CONTENT_TYPE)) {
        return true;
      }
    }
  }
  return false;
}

// examples/testapp-ssr/node_modules/astro/dist/core/base-pipeline.js
init_errors_data();
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/core/routing/params.js
init_path2();

// examples/testapp-ssr/node_modules/astro/dist/core/routing/validation.js
init_errors3();
var VALID_PARAM_TYPES = ["string", "number", "undefined"];
function validateGetStaticPathsParameter([key, value], route) {
  if (!VALID_PARAM_TYPES.includes(typeof value)) {
    throw new AstroError({
      ...errors_data_exports.GetStaticPathsInvalidRouteParam,
      message: errors_data_exports.GetStaticPathsInvalidRouteParam.message(key, value, typeof value),
      location: {
        file: route
      }
    });
  }
}
function validateDynamicRouteModule(mod2, {
  ssr,
  route
}) {
  if ((!ssr || route.prerender) && !mod2.getStaticPaths) {
    throw new AstroError({
      ...errors_data_exports.GetStaticPathsRequired,
      location: { file: route.component }
    });
  }
}
function validateGetStaticPathsResult(result, logger, route) {
  if (!Array.isArray(result)) {
    throw new AstroError({
      ...errors_data_exports.InvalidGetStaticPathsReturn,
      message: errors_data_exports.InvalidGetStaticPathsReturn.message(typeof result),
      location: {
        file: route.component
      }
    });
  }
  result.forEach((pathObject) => {
    if (typeof pathObject === "object" && Array.isArray(pathObject) || pathObject === null) {
      throw new AstroError({
        ...errors_data_exports.InvalidGetStaticPathsEntry,
        message: errors_data_exports.InvalidGetStaticPathsEntry.message(
          Array.isArray(pathObject) ? "array" : typeof pathObject
        )
      });
    }
    if (pathObject.params === void 0 || pathObject.params === null || pathObject.params && Object.keys(pathObject.params).length === 0) {
      throw new AstroError({
        ...errors_data_exports.GetStaticPathsExpectedParams,
        location: {
          file: route.component
        }
      });
    }
    for (const [key, val] of Object.entries(pathObject.params)) {
      if (!(typeof val === "undefined" || typeof val === "string" || typeof val === "number")) {
        logger.warn(
          "router",
          `getStaticPaths() returned an invalid path param: "${key}". A string, number or undefined value was expected, but got \`${JSON.stringify(
            val
          )}\`.`
        );
      }
      if (typeof val === "string" && val === "") {
        logger.warn(
          "router",
          `getStaticPaths() returned an invalid path param: "${key}". \`undefined\` expected for an optional param, but got empty string.`
        );
      }
    }
  });
}

// examples/testapp-ssr/node_modules/astro/dist/core/routing/params.js
function stringifyParams(params, route) {
  const validatedParams = Object.entries(params).reduce((acc, next) => {
    validateGetStaticPathsParameter(next, route.component);
    const [key, value] = next;
    if (value !== void 0) {
      acc[key] = typeof value === "string" ? trimSlashes(value) : value.toString();
    }
    return acc;
  }, {});
  return route.generate(validatedParams);
}

// examples/testapp-ssr/node_modules/astro/dist/core/render/paginate.js
init_errors3();
init_path2();
function generatePaginateFunction(routeMatch, base) {
  return function paginateUtility(data, args = {}) {
    let { pageSize: _pageSize, params: _params, props: _props } = args;
    const pageSize = _pageSize || 10;
    const paramName = "page";
    const additionalParams = _params || {};
    const additionalProps = _props || {};
    let includesFirstPageNumber;
    if (routeMatch.params.includes(`...${paramName}`)) {
      includesFirstPageNumber = false;
    } else if (routeMatch.params.includes(`${paramName}`)) {
      includesFirstPageNumber = true;
    } else {
      throw new AstroError({
        ...errors_data_exports.PageNumberParamNotFound,
        message: errors_data_exports.PageNumberParamNotFound.message(paramName)
      });
    }
    const lastPage = Math.max(1, Math.ceil(data.length / pageSize));
    const result = [...Array(lastPage).keys()].map((num) => {
      const pageNum = num + 1;
      const start = pageSize === Infinity ? 0 : (pageNum - 1) * pageSize;
      const end = Math.min(start + pageSize, data.length);
      const params = {
        ...additionalParams,
        [paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : void 0
      };
      const current = addRouteBase(routeMatch.generate({ ...params }), base);
      const next = pageNum === lastPage ? void 0 : addRouteBase(routeMatch.generate({ ...params, page: String(pageNum + 1) }), base);
      const prev = pageNum === 1 ? void 0 : addRouteBase(
        routeMatch.generate({
          ...params,
          page: !includesFirstPageNumber && pageNum - 1 === 1 ? void 0 : String(pageNum - 1)
        }),
        base
      );
      const first = pageNum === 1 ? void 0 : addRouteBase(
        routeMatch.generate({
          ...params,
          page: includesFirstPageNumber ? "1" : void 0
        }),
        base
      );
      const last = pageNum === lastPage ? void 0 : addRouteBase(routeMatch.generate({ ...params, page: String(lastPage) }), base);
      return {
        params,
        props: {
          ...additionalProps,
          page: {
            data: data.slice(start, end),
            start,
            end: end - 1,
            size: pageSize,
            total: data.length,
            currentPage: pageNum,
            lastPage,
            url: { current, next, prev, first, last }
          }
        }
      };
    });
    return result;
  };
}
function addRouteBase(route, base) {
  let routeWithBase = joinPaths(base, route);
  if (routeWithBase === "") routeWithBase = "/";
  return routeWithBase;
}

// examples/testapp-ssr/node_modules/astro/dist/core/render/route-cache.js
async function callGetStaticPaths({
  mod: mod2,
  route,
  routeCache,
  logger,
  ssr,
  base
}) {
  const cached = routeCache.get(route);
  if (!mod2) {
    throw new Error("This is an error caused by Astro and not your code. Please file an issue.");
  }
  if (cached?.staticPaths) {
    return cached.staticPaths;
  }
  validateDynamicRouteModule(mod2, { ssr, route });
  if (ssr && !route.prerender) {
    const entry = Object.assign([], { keyed: /* @__PURE__ */ new Map() });
    routeCache.set(route, { ...cached, staticPaths: entry });
    return entry;
  }
  let staticPaths = [];
  if (!mod2.getStaticPaths) {
    throw new Error("Unexpected Error.");
  }
  staticPaths = await mod2.getStaticPaths({
    // Q: Why the cast?
    // A: So users downstream can have nicer typings, we have to make some sacrifice in our internal typings, which necessitate a cast here
    paginate: generatePaginateFunction(route, base),
    routePattern: route.route
  });
  validateGetStaticPathsResult(staticPaths, logger, route);
  const keyedStaticPaths = staticPaths;
  keyedStaticPaths.keyed = /* @__PURE__ */ new Map();
  for (const sp of keyedStaticPaths) {
    const paramsKey = stringifyParams(sp.params, route);
    keyedStaticPaths.keyed.set(paramsKey, sp);
  }
  routeCache.set(route, { ...cached, staticPaths: keyedStaticPaths });
  return keyedStaticPaths;
}
var RouteCache = class {
  logger;
  cache = {};
  runtimeMode;
  constructor(logger, runtimeMode = "production") {
    this.logger = logger;
    this.runtimeMode = runtimeMode;
  }
  /** Clear the cache. */
  clearAll() {
    this.cache = {};
  }
  set(route, entry) {
    const key = this.key(route);
    if (this.runtimeMode === "production" && this.cache[key]?.staticPaths) {
      this.logger.warn(null, `Internal Warning: route cache overwritten. (${key})`);
    }
    this.cache[key] = entry;
  }
  get(route) {
    return this.cache[this.key(route)];
  }
  key(route) {
    return `${route.route}_${route.component}`;
  }
};
function findPathItemByKey(staticPaths, params, route, logger) {
  const paramsKey = stringifyParams(params, route);
  const matchedStaticPath = staticPaths.keyed.get(paramsKey);
  if (matchedStaticPath) {
    return matchedStaticPath;
  }
  logger.debug("router", `findPathItemByKey() - Unexpected cache miss looking for ${paramsKey}`);
}

// examples/testapp-ssr/node_modules/astro/dist/core/routing/default.js
function createDefaultRoutes(manifest2) {
  const root = new URL(manifest2.hrefRoot);
  return [
    {
      instance: default404Instance,
      matchesComponent: (filePath) => filePath.href === new URL(DEFAULT_404_COMPONENT, root).href,
      route: DEFAULT_404_ROUTE.route,
      component: DEFAULT_404_COMPONENT
    },
    {
      instance: createEndpoint(manifest2),
      matchesComponent: (filePath) => filePath.href === new URL(SERVER_ISLAND_COMPONENT, root).href,
      route: SERVER_ISLAND_ROUTE,
      component: SERVER_ISLAND_COMPONENT
    }
  ];
}

// examples/testapp-ssr/node_modules/astro/dist/core/base-pipeline.js
var Pipeline = class {
  constructor(logger, manifest2, runtimeMode, renderers2, resolve, serverLike, streaming, adapterName = manifest2.adapterName, clientDirectives = manifest2.clientDirectives, inlinedScripts = manifest2.inlinedScripts, compressHTML = manifest2.compressHTML, i18n = manifest2.i18n, middleware = manifest2.middleware, routeCache = new RouteCache(logger, runtimeMode), site = manifest2.site ? new URL(manifest2.site) : void 0, defaultRoutes = createDefaultRoutes(manifest2), actions = manifest2.actions) {
    this.logger = logger;
    this.manifest = manifest2;
    this.runtimeMode = runtimeMode;
    this.renderers = renderers2;
    this.resolve = resolve;
    this.serverLike = serverLike;
    this.streaming = streaming;
    this.adapterName = adapterName;
    this.clientDirectives = clientDirectives;
    this.inlinedScripts = inlinedScripts;
    this.compressHTML = compressHTML;
    this.i18n = i18n;
    this.middleware = middleware;
    this.routeCache = routeCache;
    this.site = site;
    this.defaultRoutes = defaultRoutes;
    this.actions = actions;
    this.internalMiddleware = [];
    if (i18n?.strategy !== "manual") {
      this.internalMiddleware.push(
        createI18nMiddleware(i18n, manifest2.base, manifest2.trailingSlash, manifest2.buildFormat)
      );
    }
  }
  internalMiddleware;
  resolvedMiddleware = void 0;
  resolvedActions = void 0;
  /**
   * Resolves the middleware from the manifest, and returns the `onRequest` function. If `onRequest` isn't there,
   * it returns a no-op function
   */
  async getMiddleware() {
    if (this.resolvedMiddleware) {
      return this.resolvedMiddleware;
    } else if (this.middleware) {
      const middlewareInstance = await this.middleware();
      const onRequest2 = middlewareInstance.onRequest ?? NOOP_MIDDLEWARE_FN;
      const internalMiddlewares = [onRequest2];
      if (this.manifest.checkOrigin) {
        internalMiddlewares.unshift(createOriginCheckMiddleware());
      }
      this.resolvedMiddleware = sequence(...internalMiddlewares);
      return this.resolvedMiddleware;
    } else {
      this.resolvedMiddleware = NOOP_MIDDLEWARE_FN;
      return this.resolvedMiddleware;
    }
  }
  setActions(actions) {
    this.resolvedActions = actions;
  }
  async getActions() {
    if (this.resolvedActions) {
      return this.resolvedActions;
    } else if (this.actions) {
      return await this.actions();
    }
    return NOOP_ACTIONS_MOD;
  }
  async getAction(path) {
    const pathKeys = path.split(".").map((key) => decodeURIComponent(key));
    let { server: server2 } = await this.getActions();
    if (!server2 || !(typeof server2 === "object")) {
      throw new TypeError(
        `Expected \`server\` export in actions file to be an object. Received ${typeof server2}.`
      );
    }
    for (const key of pathKeys) {
      if (!(key in server2)) {
        throw new AstroError({
          ...ActionNotFoundError,
          message: ActionNotFoundError.message(pathKeys.join("."))
        });
      }
      server2 = server2[key];
    }
    if (typeof server2 !== "function") {
      throw new TypeError(
        `Expected handler for action ${pathKeys.join(".")} to be a function. Received ${typeof server2}.`
      );
    }
    return server2;
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/render/params-and-props.js
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/core/redirects/helpers.js
function routeIsRedirect(route) {
  return route?.type === "redirect";
}
function routeIsFallback(route) {
  return route?.type === "fallback";
}

// examples/testapp-ssr/node_modules/astro/dist/core/redirects/component.js
var RedirectComponentInstance = {
  default() {
    return new Response(null, {
      status: 301
    });
  }
};
var RedirectSinglePageBuiltModule = {
  page: () => Promise.resolve(RedirectComponentInstance),
  onRequest: (_, next) => next(),
  renderers: []
};

// examples/testapp-ssr/node_modules/astro/dist/core/redirects/validate.js
init_errors3();

// examples/testapp-ssr/node_modules/astro/dist/core/render/params-and-props.js
async function getProps(opts) {
  const { logger, mod: mod2, routeData: route, routeCache, pathname, serverLike, base } = opts;
  if (!route || route.pathname) {
    return {};
  }
  if (routeIsRedirect(route) || routeIsFallback(route) || route.component === DEFAULT_404_COMPONENT) {
    return {};
  }
  const staticPaths = await callGetStaticPaths({
    mod: mod2,
    route,
    routeCache,
    logger,
    ssr: serverLike,
    base
  });
  const params = getParams(route, pathname);
  const matchedStaticPath = findPathItemByKey(staticPaths, params, route, logger);
  if (!matchedStaticPath && (serverLike ? route.prerender : true)) {
    throw new AstroError({
      ...errors_data_exports.NoMatchingStaticPathFound,
      message: errors_data_exports.NoMatchingStaticPathFound.message(pathname),
      hint: errors_data_exports.NoMatchingStaticPathFound.hint([route.component])
    });
  }
  if (mod2) {
    validatePrerenderEndpointCollision(route, mod2, params);
  }
  const props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
  return props;
}
function getParams(route, pathname) {
  if (!route.params.length) return {};
  const paramsMatch = route.pattern.exec(pathname) || route.fallbackRoutes.map((fallbackRoute) => fallbackRoute.pattern.exec(pathname)).find((x2) => x2);
  if (!paramsMatch) return {};
  const params = {};
  route.params.forEach((key, i2) => {
    if (key.startsWith("...")) {
      params[key.slice(3)] = paramsMatch[i2 + 1] ? paramsMatch[i2 + 1] : void 0;
    } else {
      params[key] = paramsMatch[i2 + 1];
    }
  });
  return params;
}
function validatePrerenderEndpointCollision(route, mod2, params) {
  if (route.type === "endpoint" && mod2.getStaticPaths) {
    const lastSegment = route.segments[route.segments.length - 1];
    const paramValues = Object.values(params);
    const lastParam = paramValues[paramValues.length - 1];
    if (lastSegment.length === 1 && lastSegment[0].dynamic && lastParam === void 0) {
      throw new AstroError({
        ...errors_data_exports.PrerenderDynamicEndpointPathCollide,
        message: errors_data_exports.PrerenderDynamicEndpointPathCollide.message(route.route),
        hint: errors_data_exports.PrerenderDynamicEndpointPathCollide.hint(route.component),
        location: {
          file: route.component
        }
      });
    }
  }
}

// examples/testapp-ssr/node_modules/astro/dist/core/render/slots.js
init_errors3();
function getFunctionExpression(slot) {
  if (!slot) return;
  const expressions = slot?.expressions?.filter((e2) => isRenderInstruction(e2) === false);
  if (expressions?.length !== 1) return;
  return expressions[0];
}
var Slots = class {
  #result;
  #slots;
  #logger;
  constructor(result, slots, logger) {
    this.#result = result;
    this.#slots = slots;
    this.#logger = logger;
    if (slots) {
      for (const key of Object.keys(slots)) {
        if (this[key] !== void 0) {
          throw new AstroError({
            ...errors_data_exports.ReservedSlotName,
            message: errors_data_exports.ReservedSlotName.message(key)
          });
        }
        Object.defineProperty(this, key, {
          get() {
            return true;
          },
          enumerable: true
        });
      }
    }
  }
  has(name) {
    if (!this.#slots) return false;
    return Boolean(this.#slots[name]);
  }
  async render(name, args = []) {
    if (!this.#slots || !this.has(name)) return;
    const result = this.#result;
    if (!Array.isArray(args)) {
      this.#logger.warn(
        null,
        `Expected second parameter to be an array, received a ${typeof args}. If you're trying to pass an array as a single argument and getting unexpected results, make sure you're passing your array as a item of an array. Ex: Astro.slots.render('default', [["Hello", "World"]])`
      );
    } else if (args.length > 0) {
      const slotValue = this.#slots[name];
      const component = typeof slotValue === "function" ? await slotValue(result) : await slotValue;
      const expression = getFunctionExpression(component);
      if (expression) {
        const slot = async () => typeof expression === "function" ? expression(...args) : expression;
        return await renderSlotToString(result, slot).then((res) => {
          return res;
        });
      }
      if (typeof component === "function") {
        return await renderJSX(result, component(...args)).then(
          (res) => res != null ? String(res) : res
        );
      }
    }
    const content = await renderSlotToString(result, this.#slots[name]);
    const outHTML = chunkToString(result, content);
    return outHTML;
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/middleware/sequence.js
function sequence(...handlers3) {
  const filtered = handlers3.filter((h2) => !!h2);
  const length = filtered.length;
  if (!length) {
    return defineMiddleware((_context, next) => {
      return next();
    });
  }
  return defineMiddleware((context, next) => {
    let carriedPayload = void 0;
    return applyHandle(0, context);
    function applyHandle(i2, handleContext) {
      const handle = filtered[i2];
      const result = handle(handleContext, async (payload) => {
        if (i2 < length - 1) {
          if (payload) {
            let newRequest;
            if (payload instanceof Request) {
              newRequest = payload;
            } else if (payload instanceof URL) {
              newRequest = new Request(payload, handleContext.request.clone());
            } else {
              newRequest = new Request(
                new URL(payload, handleContext.url.origin),
                handleContext.request.clone()
              );
            }
            const oldPathname = handleContext.url.pathname;
            const pipeline2 = Reflect.get(handleContext, apiContextRoutesSymbol);
            const { routeData, pathname } = await pipeline2.tryRewrite(
              payload,
              handleContext.request
            );
            if (pipeline2.serverLike === true && handleContext.isPrerendered === false && routeData.prerender === true) {
              throw new AstroError({
                ...ForbiddenRewrite,
                message: ForbiddenRewrite.message(
                  handleContext.url.pathname,
                  pathname,
                  routeData.component
                ),
                hint: ForbiddenRewrite.hint(routeData.component)
              });
            }
            carriedPayload = payload;
            handleContext.request = newRequest;
            handleContext.url = new URL(newRequest.url);
            handleContext.params = getParams(routeData, pathname);
            handleContext.routePattern = routeData.route;
            setOriginPathname(
              handleContext.request,
              oldPathname,
              pipeline2.manifest.trailingSlash,
              pipeline2.manifest.buildFormat
            );
          }
          return applyHandle(i2 + 1, handleContext);
        } else {
          return next(payload ?? carriedPayload);
        }
      });
      return result;
    }
  });
}

// examples/testapp-ssr/node_modules/astro/dist/core/middleware/index.js
function defineMiddleware(fn) {
  return fn;
}

// examples/testapp-ssr/node_modules/unstorage/dist/index.mjs
init_dist3();

// examples/testapp-ssr/node_modules/unstorage/dist/shared/unstorage.zVDD2mZo.mjs
function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error2) {
    return Promise.reject(error2);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify2(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify2(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
var BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c2) => c2.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}
function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

// examples/testapp-ssr/node_modules/unstorage/dist/index.mjs
function defineDriver(factory) {
  return factory;
}
var DRIVER_NAME = "memory";
var memory = defineDriver(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});
function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r5) => r5.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r5) => r5.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify2(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify2(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify2(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey(key);
          if (!maskedMounts.some((p2) => fullKey.startsWith(p2))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p2) => !p2.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m2) => {
          if (m2.driver.clear) {
            return asyncCall(m2.driver.clear, m2.relativeBase, opts);
          }
          if (m2.driver.removeItem) {
            const keys = await m2.driver.getKeys(m2.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m2.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a2, b) => b.length - a2.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey(key) + ":";
      const m2 = getMount(key);
      return {
        driver: m2.driver,
        base: m2.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m2) => ({
        driver: m2.driver,
        base: m2.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}
var builtinDrivers = {
  "azure-app-configuration": "unstorage/drivers/azure-app-configuration",
  "azureAppConfiguration": "unstorage/drivers/azure-app-configuration",
  "azure-cosmos": "unstorage/drivers/azure-cosmos",
  "azureCosmos": "unstorage/drivers/azure-cosmos",
  "azure-key-vault": "unstorage/drivers/azure-key-vault",
  "azureKeyVault": "unstorage/drivers/azure-key-vault",
  "azure-storage-blob": "unstorage/drivers/azure-storage-blob",
  "azureStorageBlob": "unstorage/drivers/azure-storage-blob",
  "azure-storage-table": "unstorage/drivers/azure-storage-table",
  "azureStorageTable": "unstorage/drivers/azure-storage-table",
  "capacitor-preferences": "unstorage/drivers/capacitor-preferences",
  "capacitorPreferences": "unstorage/drivers/capacitor-preferences",
  "cloudflare-kv-binding": "unstorage/drivers/cloudflare-kv-binding",
  "cloudflareKVBinding": "unstorage/drivers/cloudflare-kv-binding",
  "cloudflare-kv-http": "unstorage/drivers/cloudflare-kv-http",
  "cloudflareKVHttp": "unstorage/drivers/cloudflare-kv-http",
  "cloudflare-r2-binding": "unstorage/drivers/cloudflare-r2-binding",
  "cloudflareR2Binding": "unstorage/drivers/cloudflare-r2-binding",
  "db0": "unstorage/drivers/db0",
  "deno-kv-node": "unstorage/drivers/deno-kv-node",
  "denoKVNode": "unstorage/drivers/deno-kv-node",
  "deno-kv": "unstorage/drivers/deno-kv",
  "denoKV": "unstorage/drivers/deno-kv",
  "fs-lite": "unstorage/drivers/fs-lite",
  "fsLite": "unstorage/drivers/fs-lite",
  "fs": "unstorage/drivers/fs",
  "github": "unstorage/drivers/github",
  "http": "unstorage/drivers/http",
  "indexedb": "unstorage/drivers/indexedb",
  "localstorage": "unstorage/drivers/localstorage",
  "lru-cache": "unstorage/drivers/lru-cache",
  "lruCache": "unstorage/drivers/lru-cache",
  "memory": "unstorage/drivers/memory",
  "mongodb": "unstorage/drivers/mongodb",
  "netlify-blobs": "unstorage/drivers/netlify-blobs",
  "netlifyBlobs": "unstorage/drivers/netlify-blobs",
  "null": "unstorage/drivers/null",
  "overlay": "unstorage/drivers/overlay",
  "planetscale": "unstorage/drivers/planetscale",
  "redis": "unstorage/drivers/redis",
  "s3": "unstorage/drivers/s3",
  "session-storage": "unstorage/drivers/session-storage",
  "sessionStorage": "unstorage/drivers/session-storage",
  "uploadthing": "unstorage/drivers/uploadthing",
  "upstash": "unstorage/drivers/upstash",
  "vercel-blob": "unstorage/drivers/vercel-blob",
  "vercelBlob": "unstorage/drivers/vercel-blob",
  "vercel-kv": "unstorage/drivers/vercel-kv",
  "vercelKV": "unstorage/drivers/vercel-kv",
  "vercel-runtime-cache": "unstorage/drivers/vercel-runtime-cache",
  "vercelRuntimeCache": "unstorage/drivers/vercel-runtime-cache"
};

// examples/testapp-ssr/node_modules/astro/dist/core/session.js
init_errors_data();
init_errors3();
var PERSIST_SYMBOL = Symbol();
var DEFAULT_COOKIE_NAME = "astro-session";
var VALID_COOKIE_REGEX = /^[\w-]+$/;
var unflatten2 = (parsed, _) => {
  return unflatten(parsed, {
    URL: (href) => new URL(href)
  });
};
var stringify3 = (data, _) => {
  return stringify(data, {
    // Support URL objects
    URL: (val) => val instanceof URL && val.href
  });
};
var AstroSession = class _AstroSession {
  // The cookies object.
  #cookies;
  // The session configuration.
  #config;
  // The cookie config
  #cookieConfig;
  // The cookie name
  #cookieName;
  // The unstorage object for the session driver.
  #storage;
  #data;
  // The session ID. A v4 UUID.
  #sessionID;
  // Sessions to destroy. Needed because we won't have the old session ID after it's destroyed locally.
  #toDestroy = /* @__PURE__ */ new Set();
  // Session keys to delete. Used for partial data sets to avoid overwriting the deleted value.
  #toDelete = /* @__PURE__ */ new Set();
  // Whether the session is dirty and needs to be saved.
  #dirty = false;
  // Whether the session cookie has been set.
  #cookieSet = false;
  // The local data is "partial" if it has not been loaded from storage yet and only
  // contains values that have been set or deleted in-memory locally.
  // We do this to avoid the need to block on loading data when it is only being set.
  // When we load the data from storage, we need to merge it with the local partial data,
  // preserving in-memory changes and deletions.
  #partial = true;
  static #sharedStorage = /* @__PURE__ */ new Map();
  constructor(cookies, {
    cookie: cookieConfig = DEFAULT_COOKIE_NAME,
    ...config
  }, runtimeMode) {
    const { driver } = config;
    if (!driver) {
      throw new AstroError({
        ...SessionStorageInitError,
        message: SessionStorageInitError.message(
          "No driver was defined in the session configuration and the adapter did not provide a default driver."
        )
      });
    }
    this.#cookies = cookies;
    let cookieConfigObject;
    if (typeof cookieConfig === "object") {
      const { name = DEFAULT_COOKIE_NAME, ...rest } = cookieConfig;
      this.#cookieName = name;
      cookieConfigObject = rest;
    } else {
      this.#cookieName = cookieConfig || DEFAULT_COOKIE_NAME;
    }
    this.#cookieConfig = {
      sameSite: "lax",
      secure: runtimeMode === "production",
      path: "/",
      ...cookieConfigObject,
      httpOnly: true
    };
    this.#config = { ...config, driver };
  }
  /**
   * Gets a session value. Returns `undefined` if the session or value does not exist.
   */
  async get(key) {
    return (await this.#ensureData()).get(key)?.data;
  }
  /**
   * Checks if a session value exists.
   */
  async has(key) {
    return (await this.#ensureData()).has(key);
  }
  /**
   * Gets all session values.
   */
  async keys() {
    return (await this.#ensureData()).keys();
  }
  /**
   * Gets all session values.
   */
  async values() {
    return [...(await this.#ensureData()).values()].map((entry) => entry.data);
  }
  /**
   * Gets all session entries.
   */
  async entries() {
    return [...(await this.#ensureData()).entries()].map(([key, entry]) => [key, entry.data]);
  }
  /**
   * Deletes a session value.
   */
  delete(key) {
    this.#data?.delete(key);
    if (this.#partial) {
      this.#toDelete.add(key);
    }
    this.#dirty = true;
  }
  /**
   * Sets a session value. The session is created if it does not exist.
   */
  set(key, value, { ttl } = {}) {
    if (!key) {
      throw new AstroError({
        ...SessionStorageSaveError,
        message: "The session key was not provided."
      });
    }
    let cloned;
    try {
      cloned = unflatten2(JSON.parse(stringify3(value)));
    } catch (err) {
      throw new AstroError(
        {
          ...SessionStorageSaveError,
          message: `The session data for ${key} could not be serialized.`,
          hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
        },
        { cause: err }
      );
    }
    if (!this.#cookieSet) {
      this.#setCookie();
      this.#cookieSet = true;
    }
    this.#data ??= /* @__PURE__ */ new Map();
    const lifetime = ttl ?? this.#config.ttl;
    const expires = typeof lifetime === "number" ? Date.now() + lifetime * 1e3 : lifetime;
    this.#data.set(key, {
      data: cloned,
      expires
    });
    this.#dirty = true;
  }
  /**
   * Destroys the session, clearing the cookie and storage if it exists.
   */
  destroy() {
    const sessionId = this.#sessionID ?? this.#cookies.get(this.#cookieName)?.value;
    if (sessionId) {
      this.#toDestroy.add(sessionId);
    }
    this.#cookies.delete(this.#cookieName, this.#cookieConfig);
    this.#sessionID = void 0;
    this.#data = void 0;
    this.#dirty = true;
  }
  /**
   * Regenerates the session, creating a new session ID. The existing session data is preserved.
   */
  async regenerate() {
    let data = /* @__PURE__ */ new Map();
    try {
      data = await this.#ensureData();
    } catch (err) {
      console.error("Failed to load session data during regeneration:", err);
    }
    const oldSessionId = this.#sessionID;
    this.#sessionID = crypto.randomUUID();
    this.#data = data;
    await this.#setCookie();
    if (oldSessionId && this.#storage) {
      this.#storage.removeItem(oldSessionId).catch((err) => {
        console.error("Failed to remove old session data:", err);
      });
    }
  }
  // Persists the session data to storage.
  // This is called automatically at the end of the request.
  // Uses a symbol to prevent users from calling it directly.
  async [PERSIST_SYMBOL]() {
    if (!this.#dirty && !this.#toDestroy.size) {
      return;
    }
    const storage = await this.#ensureStorage();
    if (this.#dirty && this.#data) {
      const data = await this.#ensureData();
      this.#toDelete.forEach((key2) => data.delete(key2));
      const key = this.#ensureSessionID();
      let serialized;
      try {
        serialized = stringify3(data);
      } catch (err) {
        throw new AstroError(
          {
            ...SessionStorageSaveError,
            message: SessionStorageSaveError.message(
              "The session data could not be serialized.",
              this.#config.driver
            )
          },
          { cause: err }
        );
      }
      await storage.setItem(key, serialized);
      this.#dirty = false;
    }
    if (this.#toDestroy.size > 0) {
      const cleanupPromises = [...this.#toDestroy].map(
        (sessionId) => storage.removeItem(sessionId).catch((err) => {
          console.error(`Failed to clean up session ${sessionId}:`, err);
        })
      );
      await Promise.all(cleanupPromises);
      this.#toDestroy.clear();
    }
  }
  get sessionID() {
    return this.#sessionID;
  }
  /**
   * Loads a session from storage with the given ID, and replaces the current session.
   * Any changes made to the current session will be lost.
   * This is not normally needed, as the session is automatically loaded using the cookie.
   * However it can be used to restore a session where the ID has been recorded somewhere
   * else (e.g. in a database).
   */
  async load(sessionID) {
    this.#sessionID = sessionID;
    this.#data = void 0;
    await this.#setCookie();
    await this.#ensureData();
  }
  /**
   * Sets the session cookie.
   */
  async #setCookie() {
    if (!VALID_COOKIE_REGEX.test(this.#cookieName)) {
      throw new AstroError({
        ...SessionStorageSaveError,
        message: "Invalid cookie name. Cookie names can only contain letters, numbers, and dashes."
      });
    }
    const value = this.#ensureSessionID();
    this.#cookies.set(this.#cookieName, value, this.#cookieConfig);
  }
  /**
   * Attempts to load the session data from storage, or creates a new data object if none exists.
   * If there is existing partial data, it will be merged into the new data object.
   */
  async #ensureData() {
    const storage = await this.#ensureStorage();
    if (this.#data && !this.#partial) {
      return this.#data;
    }
    this.#data ??= /* @__PURE__ */ new Map();
    const raw = await storage.get(this.#ensureSessionID());
    if (!raw) {
      return this.#data;
    }
    try {
      const storedMap = unflatten2(raw);
      if (!(storedMap instanceof Map)) {
        await this.destroy();
        throw new AstroError({
          ...SessionStorageInitError,
          message: SessionStorageInitError.message(
            "The session data was an invalid type.",
            this.#config.driver
          )
        });
      }
      const now = Date.now();
      for (const [key, value] of storedMap) {
        const expired = typeof value.expires === "number" && value.expires < now;
        if (!this.#data.has(key) && !this.#toDelete.has(key) && !expired) {
          this.#data.set(key, value);
        }
      }
      this.#partial = false;
      return this.#data;
    } catch (err) {
      await this.destroy();
      if (err instanceof AstroError) {
        throw err;
      }
      throw new AstroError(
        {
          ...SessionStorageInitError,
          message: SessionStorageInitError.message(
            "The session data could not be parsed.",
            this.#config.driver
          )
        },
        { cause: err }
      );
    }
  }
  /**
   * Returns the session ID, generating a new one if it does not exist.
   */
  #ensureSessionID() {
    this.#sessionID ??= this.#cookies.get(this.#cookieName)?.value ?? crypto.randomUUID();
    return this.#sessionID;
  }
  /**
   * Ensures the storage is initialized.
   * This is called automatically when a storage operation is needed.
   */
  async #ensureStorage() {
    if (this.#storage) {
      return this.#storage;
    }
    if (_AstroSession.#sharedStorage.has(this.#config.driver)) {
      this.#storage = _AstroSession.#sharedStorage.get(this.#config.driver);
      return this.#storage;
    }
    if (this.#config.driver === "test") {
      this.#storage = this.#config.options.mockStorage;
      return this.#storage;
    }
    if (this.#config.driver === "fs" || this.#config.driver === "fsLite" || this.#config.driver === "fs-lite") {
      this.#config.options ??= {};
      this.#config.driver = "fs-lite";
      this.#config.options.base ??= ".astro/session";
    }
    let driver = null;
    try {
      if (this.#config.driverModule) {
        driver = (await this.#config.driverModule()).default;
      } else if (this.#config.driver) {
        const driverName = resolveSessionDriverName(this.#config.driver);
        if (driverName) {
          driver = (await import(driverName)).default;
        }
      }
    } catch (err) {
      if (err.code === "ERR_MODULE_NOT_FOUND") {
        throw new AstroError(
          {
            ...SessionStorageInitError,
            message: SessionStorageInitError.message(
              err.message.includes(`Cannot find package`) ? "The driver module could not be found." : err.message,
              this.#config.driver
            )
          },
          { cause: err }
        );
      }
      throw err;
    }
    if (!driver) {
      throw new AstroError({
        ...SessionStorageInitError,
        message: SessionStorageInitError.message(
          "The module did not export a driver.",
          this.#config.driver
        )
      });
    }
    try {
      this.#storage = createStorage({
        driver: driver(this.#config.options)
      });
      _AstroSession.#sharedStorage.set(this.#config.driver, this.#storage);
      return this.#storage;
    } catch (err) {
      throw new AstroError(
        {
          ...SessionStorageInitError,
          message: SessionStorageInitError.message("Unknown error", this.#config.driver)
        },
        { cause: err }
      );
    }
  }
};
function resolveSessionDriverName(driver) {
  if (!driver) {
    return null;
  }
  try {
    if (driver === "fs") {
      return builtinDrivers.fsLite;
    }
    if (driver in builtinDrivers) {
      return builtinDrivers[driver];
    }
  } catch {
    return null;
  }
  return driver;
}

// examples/testapp-ssr/node_modules/astro/dist/core/util/pathname.js
function validateAndDecodePathname(pathname) {
  let decoded;
  try {
    decoded = decodeURI(pathname);
  } catch (_e) {
    throw new Error("Invalid URL encoding");
  }
  const hasDecoding = decoded !== pathname;
  const decodedStillHasEncoding = /%[0-9a-fA-F]{2}/.test(decoded);
  if (hasDecoding && decodedStillHasEncoding) {
    throw new Error("Multi-level URL encoding is not allowed");
  }
  return decoded;
}

// examples/testapp-ssr/node_modules/astro/dist/core/render-context.js
var apiContextRoutesSymbol = Symbol.for("context.routes");
var RenderContext = class _RenderContext {
  constructor(pipeline2, locals, middleware, actions, pathname, request, routeData, status, clientAddress, cookies = new AstroCookies(request), params = getParams(routeData, pathname), url = _RenderContext.#createNormalizedUrl(request.url), props = {}, partial = void 0, shouldInjectCspMetaTags = !!pipeline2.manifest.csp, session = pipeline2.manifest.sessionConfig ? new AstroSession(cookies, pipeline2.manifest.sessionConfig, pipeline2.runtimeMode) : void 0) {
    this.pipeline = pipeline2;
    this.locals = locals;
    this.middleware = middleware;
    this.actions = actions;
    this.pathname = pathname;
    this.request = request;
    this.routeData = routeData;
    this.status = status;
    this.clientAddress = clientAddress;
    this.cookies = cookies;
    this.params = params;
    this.url = url;
    this.props = props;
    this.partial = partial;
    this.shouldInjectCspMetaTags = shouldInjectCspMetaTags;
    this.session = session;
  }
  static #createNormalizedUrl(requestUrl) {
    const url = new URL(requestUrl);
    try {
      url.pathname = validateAndDecodePathname(url.pathname);
    } catch {
      try {
        url.pathname = decodeURI(url.pathname);
      } catch {
      }
    }
    return url;
  }
  /**
   * A flag that tells the render content if the rewriting was triggered
   */
  isRewriting = false;
  /**
   * A safety net in case of loops
   */
  counter = 0;
  result = void 0;
  static async create({
    locals = {},
    middleware,
    pathname,
    pipeline: pipeline2,
    request,
    routeData,
    clientAddress,
    status = 200,
    props,
    partial = void 0,
    actions,
    shouldInjectCspMetaTags
  }) {
    const pipelineMiddleware = await pipeline2.getMiddleware();
    const pipelineActions = actions ?? await pipeline2.getActions();
    setOriginPathname(
      request,
      pathname,
      pipeline2.manifest.trailingSlash,
      pipeline2.manifest.buildFormat
    );
    return new _RenderContext(
      pipeline2,
      locals,
      sequence(...pipeline2.internalMiddleware, middleware ?? pipelineMiddleware),
      pipelineActions,
      pathname,
      request,
      routeData,
      status,
      clientAddress,
      void 0,
      void 0,
      void 0,
      props,
      partial,
      shouldInjectCspMetaTags ?? !!pipeline2.manifest.csp
    );
  }
  /**
   * The main function of the RenderContext.
   *
   * Use this function to render any route known to Astro.
   * It attempts to render a route. A route can be a:
   *
   * - page
   * - redirect
   * - endpoint
   * - fallback
   */
  async render(componentInstance, slots = {}) {
    const { middleware, pipeline: pipeline2 } = this;
    const { logger, serverLike, streaming, manifest: manifest2 } = pipeline2;
    const props = Object.keys(this.props).length > 0 ? this.props : await getProps({
      mod: componentInstance,
      routeData: this.routeData,
      routeCache: this.pipeline.routeCache,
      pathname: this.pathname,
      logger,
      serverLike,
      base: manifest2.base
    });
    const actionApiContext = this.createActionAPIContext();
    const apiContext = this.createAPIContext(props, actionApiContext);
    this.counter++;
    if (this.counter === 4) {
      return new Response("Loop Detected", {
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
        status: 508,
        statusText: "Astro detected a loop where you tried to call the rewriting logic more than four times."
      });
    }
    const lastNext = async (ctx, payload) => {
      if (payload) {
        const oldPathname = this.pathname;
        pipeline2.logger.debug("router", "Called rewriting to:", payload);
        const {
          routeData,
          componentInstance: newComponent,
          pathname,
          newUrl
        } = await pipeline2.tryRewrite(payload, this.request);
        if (this.pipeline.serverLike === true && this.routeData.prerender === false && routeData.prerender === true) {
          throw new AstroError({
            ...ForbiddenRewrite,
            message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
            hint: ForbiddenRewrite.hint(routeData.component)
          });
        }
        this.routeData = routeData;
        componentInstance = newComponent;
        if (payload instanceof Request) {
          this.request = payload;
        } else {
          this.request = copyRequest(
            newUrl,
            this.request,
            // need to send the flag of the previous routeData
            routeData.prerender,
            this.pipeline.logger,
            this.routeData.route
          );
        }
        this.isRewriting = true;
        this.url = _RenderContext.#createNormalizedUrl(this.request.url);
        this.params = getParams(routeData, pathname);
        this.pathname = pathname;
        this.status = 200;
        setOriginPathname(
          this.request,
          oldPathname,
          this.pipeline.manifest.trailingSlash,
          this.pipeline.manifest.buildFormat
        );
      }
      let response2;
      if (!ctx.isPrerendered) {
        const { action, setActionResult, serializeActionResult: serializeActionResult2 } = getActionContext(ctx);
        if (action?.calledFrom === "form") {
          const actionResult = await action.handler();
          setActionResult(action.name, serializeActionResult2(actionResult));
        }
      }
      switch (this.routeData.type) {
        case "endpoint": {
          response2 = await renderEndpoint(
            componentInstance,
            ctx,
            this.routeData.prerender,
            logger
          );
          break;
        }
        case "redirect":
          return renderRedirect(this);
        case "page": {
          this.result = await this.createResult(componentInstance, actionApiContext);
          try {
            response2 = await renderPage(
              this.result,
              componentInstance?.default,
              props,
              slots,
              streaming,
              this.routeData
            );
          } catch (e2) {
            this.result.cancelled = true;
            throw e2;
          }
          response2.headers.set(ROUTE_TYPE_HEADER, "page");
          if (this.routeData.route === "/404" || this.routeData.route === "/500") {
            response2.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
          }
          if (this.isRewriting) {
            response2.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
          }
          break;
        }
        case "fallback": {
          return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: "fallback" } });
        }
      }
      const responseCookies = getCookiesFromResponse(response2);
      if (responseCookies) {
        this.cookies.merge(responseCookies);
      }
      return response2;
    };
    if (isRouteExternalRedirect(this.routeData)) {
      return renderRedirect(this);
    }
    const response = await callMiddleware(middleware, apiContext, lastNext);
    if (response.headers.get(ROUTE_TYPE_HEADER)) {
      response.headers.delete(ROUTE_TYPE_HEADER);
    }
    attachCookiesToResponse(response, this.cookies);
    return response;
  }
  createAPIContext(props, context) {
    const redirect = (path, status = 302) => new Response(null, { status, headers: { Location: path } });
    Reflect.set(context, apiContextRoutesSymbol, this.pipeline);
    return Object.assign(context, {
      props,
      redirect,
      getActionResult: createGetActionResult(context.locals),
      callAction: createCallAction(context)
    });
  }
  async #executeRewrite(reroutePayload) {
    this.pipeline.logger.debug("router", "Calling rewrite: ", reroutePayload);
    const oldPathname = this.pathname;
    const { routeData, componentInstance, newUrl, pathname } = await this.pipeline.tryRewrite(
      reroutePayload,
      this.request
    );
    const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
    if (this.pipeline.serverLike && !this.routeData.prerender && routeData.prerender && !isI18nFallback) {
      throw new AstroError({
        ...ForbiddenRewrite,
        message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
        hint: ForbiddenRewrite.hint(routeData.component)
      });
    }
    this.routeData = routeData;
    if (reroutePayload instanceof Request) {
      this.request = reroutePayload;
    } else {
      this.request = copyRequest(
        newUrl,
        this.request,
        // need to send the flag of the previous routeData
        routeData.prerender,
        this.pipeline.logger,
        this.routeData.route
      );
    }
    this.url = _RenderContext.#createNormalizedUrl(this.request.url);
    const newCookies = new AstroCookies(this.request);
    if (this.cookies) {
      newCookies.merge(this.cookies);
    }
    this.cookies = newCookies;
    this.params = getParams(routeData, pathname);
    this.pathname = pathname;
    this.isRewriting = true;
    this.status = 200;
    setOriginPathname(
      this.request,
      oldPathname,
      this.pipeline.manifest.trailingSlash,
      this.pipeline.manifest.buildFormat
    );
    return await this.render(componentInstance);
  }
  createActionAPIContext() {
    const renderContext = this;
    const { params, pipeline: pipeline2, url } = this;
    const generator = `Astro v${ASTRO_VERSION}`;
    const rewrite = async (reroutePayload) => {
      return await this.#executeRewrite(reroutePayload);
    };
    return {
      // Don't allow reassignment of cookies because it doesn't work
      get cookies() {
        return renderContext.cookies;
      },
      routePattern: this.routeData.route,
      isPrerendered: this.routeData.prerender,
      get clientAddress() {
        return renderContext.getClientAddress();
      },
      get currentLocale() {
        return renderContext.computeCurrentLocale();
      },
      generator,
      get locals() {
        return renderContext.locals;
      },
      set locals(_) {
        throw new AstroError(errors_data_exports.LocalsReassigned);
      },
      params,
      get preferredLocale() {
        return renderContext.computePreferredLocale();
      },
      get preferredLocaleList() {
        return renderContext.computePreferredLocaleList();
      },
      rewrite,
      request: this.request,
      site: pipeline2.site,
      url,
      get originPathname() {
        return getOriginPathname(renderContext.request);
      },
      get session() {
        if (this.isPrerendered) {
          pipeline2.logger.warn(
            "session",
            `context.session was used when rendering the route ${s.green(this.routePattern)}, but it is not available on prerendered routes. If you need access to sessions, make sure that the route is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your routes server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        if (!renderContext.session) {
          pipeline2.logger.warn(
            "session",
            `context.session was used when rendering the route ${s.green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        return renderContext.session;
      },
      get csp() {
        return {
          insertDirective(payload) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            if (renderContext?.result?.directives) {
              renderContext.result.directives = pushDirective(
                renderContext.result.directives,
                payload
              );
            } else {
              renderContext?.result?.directives.push(payload);
            }
          },
          insertScriptResource(resource) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptResources.push(resource);
          },
          insertStyleResource(resource) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleResources.push(resource);
          },
          insertStyleHash(hash) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleHashes.push(hash);
          },
          insertScriptHash(hash) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptHashes.push(hash);
          }
        };
      }
    };
  }
  async createResult(mod2, ctx) {
    const { cookies, pathname, pipeline: pipeline2, routeData, status } = this;
    const { clientDirectives, inlinedScripts, compressHTML, manifest: manifest2, renderers: renderers2, resolve } = pipeline2;
    const { links, scripts, styles } = await pipeline2.headElements(routeData);
    const extraStyleHashes = [];
    const extraScriptHashes = [];
    const shouldInjectCspMetaTags = this.shouldInjectCspMetaTags;
    const cspAlgorithm = manifest2.csp?.algorithm ?? "SHA-256";
    if (shouldInjectCspMetaTags) {
      for (const style of styles) {
        extraStyleHashes.push(await generateCspDigest(style.children, cspAlgorithm));
      }
      for (const script of scripts) {
        extraScriptHashes.push(await generateCspDigest(script.children, cspAlgorithm));
      }
    }
    const componentMetadata = await pipeline2.componentMetadata(routeData) ?? manifest2.componentMetadata;
    const headers = new Headers({ "Content-Type": "text/html" });
    const partial = typeof this.partial === "boolean" ? this.partial : Boolean(mod2.partial);
    const actionResult = hasActionPayload(this.locals) ? deserializeActionResult(this.locals._actionPayload.actionResult) : void 0;
    const response = {
      status: actionResult?.error ? actionResult?.error.status : status,
      statusText: actionResult?.error ? actionResult?.error.type : "OK",
      get headers() {
        return headers;
      },
      // Disallow `Astro.response.headers = new Headers`
      set headers(_) {
        throw new AstroError(errors_data_exports.AstroResponseHeadersReassigned);
      }
    };
    const result = {
      base: manifest2.base,
      userAssetsBase: manifest2.userAssetsBase,
      cancelled: false,
      clientDirectives,
      inlinedScripts,
      componentMetadata,
      compressHTML,
      cookies,
      /** This function returns the `Astro` faux-global */
      createAstro: (astroGlobal, props, slots) => this.createAstro(result, astroGlobal, props, slots, ctx),
      links,
      params: this.params,
      partial,
      pathname,
      renderers: renderers2,
      resolve,
      response,
      request: this.request,
      scripts,
      styles,
      actionResult,
      serverIslandNameMap: manifest2.serverIslandNameMap ?? /* @__PURE__ */ new Map(),
      key: manifest2.key,
      trailingSlash: manifest2.trailingSlash,
      _metadata: {
        hasHydrationScript: false,
        rendererSpecificHydrationScripts: /* @__PURE__ */ new Set(),
        hasRenderedHead: false,
        renderedScripts: /* @__PURE__ */ new Set(),
        hasDirectives: /* @__PURE__ */ new Set(),
        hasRenderedServerIslandRuntime: false,
        headInTree: false,
        extraHead: [],
        extraStyleHashes,
        extraScriptHashes,
        propagators: /* @__PURE__ */ new Set()
      },
      cspDestination: manifest2.csp?.cspDestination ?? (routeData.prerender ? "meta" : "header"),
      shouldInjectCspMetaTags,
      cspAlgorithm,
      // The following arrays must be cloned, otherwise they become mutable across routes.
      scriptHashes: manifest2.csp?.scriptHashes ? [...manifest2.csp.scriptHashes] : [],
      scriptResources: manifest2.csp?.scriptResources ? [...manifest2.csp.scriptResources] : [],
      styleHashes: manifest2.csp?.styleHashes ? [...manifest2.csp.styleHashes] : [],
      styleResources: manifest2.csp?.styleResources ? [...manifest2.csp.styleResources] : [],
      directives: manifest2.csp?.directives ? [...manifest2.csp.directives] : [],
      isStrictDynamic: manifest2.csp?.isStrictDynamic ?? false,
      internalFetchHeaders: manifest2.internalFetchHeaders
    };
    return result;
  }
  #astroPagePartial;
  /**
   * The Astro global is sourced in 3 different phases:
   * - **Static**: `.generator` and `.glob` is printed by the compiler, instantiated once per process per astro file
   * - **Page-level**: `.request`, `.cookies`, `.locals` etc. These remain the same for the duration of the request.
   * - **Component-level**: `.props`, `.slots`, and `.self` are unique to each _use_ of each component.
   *
   * The page level partial is used as the prototype of the user-visible `Astro` global object, which is instantiated once per use of a component.
   */
  createAstro(result, astroStaticPartial, props, slotValues, apiContext) {
    let astroPagePartial;
    if (this.isRewriting) {
      astroPagePartial = this.#astroPagePartial = this.createAstroPagePartial(
        result,
        astroStaticPartial,
        apiContext
      );
    } else {
      astroPagePartial = this.#astroPagePartial ??= this.createAstroPagePartial(
        result,
        astroStaticPartial,
        apiContext
      );
    }
    const astroComponentPartial = { props, self: null };
    const Astro = Object.assign(
      Object.create(astroPagePartial),
      astroComponentPartial
    );
    let _slots;
    Object.defineProperty(Astro, "slots", {
      get: () => {
        if (!_slots) {
          _slots = new Slots(
            result,
            slotValues,
            this.pipeline.logger
          );
        }
        return _slots;
      }
    });
    return Astro;
  }
  createAstroPagePartial(result, astroStaticPartial, apiContext) {
    const renderContext = this;
    const { cookies, locals, params, pipeline: pipeline2, url } = this;
    const { response } = result;
    const redirect = (path, status = 302) => {
      if (this.request[responseSentSymbol]) {
        throw new AstroError({
          ...errors_data_exports.ResponseSentError
        });
      }
      return new Response(null, { status, headers: { Location: path } });
    };
    const rewrite = async (reroutePayload) => {
      return await this.#executeRewrite(reroutePayload);
    };
    const callAction = createCallAction(apiContext);
    return {
      generator: astroStaticPartial.generator,
      glob: astroStaticPartial.glob,
      routePattern: this.routeData.route,
      isPrerendered: this.routeData.prerender,
      cookies,
      get session() {
        if (this.isPrerendered) {
          pipeline2.logger.warn(
            "session",
            `Astro.session was used when rendering the route ${s.green(this.routePattern)}, but it is not available on prerendered pages. If you need access to sessions, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        if (!renderContext.session) {
          pipeline2.logger.warn(
            "session",
            `Astro.session was used when rendering the route ${s.green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        return renderContext.session;
      },
      get clientAddress() {
        return renderContext.getClientAddress();
      },
      get currentLocale() {
        return renderContext.computeCurrentLocale();
      },
      params,
      get preferredLocale() {
        return renderContext.computePreferredLocale();
      },
      get preferredLocaleList() {
        return renderContext.computePreferredLocaleList();
      },
      locals,
      redirect,
      rewrite,
      request: this.request,
      response,
      site: pipeline2.site,
      getActionResult: createGetActionResult(locals),
      get callAction() {
        return callAction;
      },
      url,
      get originPathname() {
        return getOriginPathname(renderContext.request);
      },
      get csp() {
        return {
          insertDirective(payload) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            if (renderContext?.result?.directives) {
              renderContext.result.directives = pushDirective(
                renderContext.result.directives,
                payload
              );
            } else {
              renderContext?.result?.directives.push(payload);
            }
          },
          insertScriptResource(resource) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptResources.push(resource);
          },
          insertStyleResource(resource) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleResources.push(resource);
          },
          insertStyleHash(hash) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleHashes.push(hash);
          },
          insertScriptHash(hash) {
            if (!pipeline2.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptHashes.push(hash);
          }
        };
      }
    };
  }
  getClientAddress() {
    const { pipeline: pipeline2, request, routeData, clientAddress } = this;
    if (routeData.prerender) {
      throw new AstroError({
        ...errors_data_exports.PrerenderClientAddressNotAvailable,
        message: errors_data_exports.PrerenderClientAddressNotAvailable.message(routeData.component)
      });
    }
    if (clientAddress) {
      return clientAddress;
    }
    if (clientAddressSymbol in request) {
      return Reflect.get(request, clientAddressSymbol);
    }
    if (pipeline2.adapterName) {
      throw new AstroError({
        ...errors_data_exports.ClientAddressNotAvailable,
        message: errors_data_exports.ClientAddressNotAvailable.message(pipeline2.adapterName)
      });
    }
    throw new AstroError(errors_data_exports.StaticClientAddressNotAvailable);
  }
  /**
   * API Context may be created multiple times per request, i18n data needs to be computed only once.
   * So, it is computed and saved here on creation of the first APIContext and reused for later ones.
   */
  #currentLocale;
  computeCurrentLocale() {
    const {
      url,
      pipeline: { i18n },
      routeData
    } = this;
    if (!i18n) return;
    const { defaultLocale, locales, strategy } = i18n;
    const fallbackTo = strategy === "pathname-prefix-other-locales" || strategy === "domains-prefix-other-locales" ? defaultLocale : void 0;
    if (this.#currentLocale) {
      return this.#currentLocale;
    }
    let computedLocale;
    if (isRouteServerIsland(routeData)) {
      let referer = this.request.headers.get("referer");
      if (referer) {
        if (URL.canParse(referer)) {
          referer = new URL(referer).pathname;
        }
        computedLocale = computeCurrentLocale(referer, locales, defaultLocale);
      }
    } else {
      let pathname = routeData.pathname;
      if (!routeData.pattern.test(url.pathname)) {
        for (const fallbackRoute of routeData.fallbackRoutes) {
          if (fallbackRoute.pattern.test(url.pathname)) {
            pathname = fallbackRoute.pathname;
            break;
          }
        }
      }
      pathname = pathname && !isRoute404or500(routeData) ? pathname : url.pathname;
      computedLocale = computeCurrentLocale(pathname, locales, defaultLocale);
    }
    this.#currentLocale = computedLocale ?? fallbackTo;
    return this.#currentLocale;
  }
  #preferredLocale;
  computePreferredLocale() {
    const {
      pipeline: { i18n },
      request
    } = this;
    if (!i18n) return;
    return this.#preferredLocale ??= computePreferredLocale(request, i18n.locales);
  }
  #preferredLocaleList;
  computePreferredLocaleList() {
    const {
      pipeline: { i18n },
      request
    } = this;
    if (!i18n) return;
    return this.#preferredLocaleList ??= computePreferredLocaleList(request, i18n.locales);
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/routing/3xx.js
function redirectTemplate({
  status,
  absoluteLocation,
  relativeLocation,
  from
}) {
  const delay = status === 302 ? 2 : 0;
  return `<!doctype html>
<title>Redirecting to: ${relativeLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${relativeLocation}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${absoluteLocation}">
<body>
	<a href="${relativeLocation}">Redirecting ${from ? `from <code>${from}</code> ` : ""}to <code>${relativeLocation}</code></a>
</body>`;
}

// examples/testapp-ssr/node_modules/astro/dist/core/app/pipeline.js
var AppPipeline = class _AppPipeline extends Pipeline {
  static create({
    logger,
    manifest: manifest2,
    runtimeMode,
    renderers: renderers2,
    resolve,
    serverLike,
    streaming,
    defaultRoutes
  }) {
    const pipeline2 = new _AppPipeline(
      logger,
      manifest2,
      runtimeMode,
      renderers2,
      resolve,
      serverLike,
      streaming,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      defaultRoutes
    );
    return pipeline2;
  }
  headElements(routeData) {
    const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
    const links = /* @__PURE__ */ new Set();
    const scripts = /* @__PURE__ */ new Set();
    const styles = createStylesheetElementSet(routeInfo?.styles ?? []);
    for (const script of routeInfo?.scripts ?? []) {
      if ("stage" in script) {
        if (script.stage === "head-inline") {
          scripts.add({
            props: {},
            children: script.children
          });
        }
      } else {
        scripts.add(createModuleScriptElement(script));
      }
    }
    return { links, styles, scripts };
  }
  componentMetadata() {
  }
  async getComponentByRoute(routeData) {
    const module = await this.getModuleForRoute(routeData);
    return module.page();
  }
  async tryRewrite(payload, request) {
    const { newUrl, pathname, routeData } = findRouteToRewrite({
      payload,
      request,
      routes: this.manifest?.routes.map((r5) => r5.routeData),
      trailingSlash: this.manifest.trailingSlash,
      buildFormat: this.manifest.buildFormat,
      base: this.manifest.base,
      outDir: this.serverLike ? this.manifest.buildClientDir : this.manifest.outDir
    });
    const componentInstance = await this.getComponentByRoute(routeData);
    return { newUrl, pathname, componentInstance, routeData };
  }
  async getModuleForRoute(route) {
    for (const defaultRoute of this.defaultRoutes) {
      if (route.component === defaultRoute.component) {
        return {
          page: () => Promise.resolve(defaultRoute.instance),
          renderers: []
        };
      }
    }
    if (route.type === "redirect") {
      return RedirectSinglePageBuiltModule;
    } else {
      if (this.manifest.pageMap) {
        const importComponentInstance = this.manifest.pageMap.get(route.component);
        if (!importComponentInstance) {
          throw new Error(
            `Unexpectedly unable to find a component instance for route ${route.route}`
          );
        }
        return await importComponentInstance();
      } else if (this.manifest.pageModule) {
        return this.manifest.pageModule;
      }
      throw new Error(
        "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
      );
    }
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/app/index.js
var App = class _App {
  #manifest;
  #manifestData;
  #logger = new Logger({
    dest: consoleLogDestination,
    level: "info"
  });
  #baseWithoutTrailingSlash;
  #pipeline;
  #adapterLogger;
  constructor(manifest2, streaming = true) {
    this.#manifest = manifest2;
    this.#manifestData = {
      routes: manifest2.routes.map((route) => route.routeData)
    };
    ensure404Route(this.#manifestData);
    this.#baseWithoutTrailingSlash = removeTrailingForwardSlash(this.#manifest.base);
    this.#pipeline = this.#createPipeline(streaming);
    this.#adapterLogger = new AstroIntegrationLogger(
      this.#logger.options,
      this.#manifest.adapterName
    );
  }
  getAdapterLogger() {
    return this.#adapterLogger;
  }
  getAllowedDomains() {
    return this.#manifest.allowedDomains;
  }
  get manifest() {
    return this.#manifest;
  }
  set manifest(value) {
    this.#manifest = value;
  }
  matchesAllowedDomains(forwardedHost, protocol) {
    return _App.validateForwardedHost(forwardedHost, this.#manifest.allowedDomains, protocol);
  }
  static validateForwardedHost(forwardedHost, allowedDomains, protocol) {
    if (!allowedDomains || allowedDomains.length === 0) {
      return false;
    }
    try {
      const testUrl = new URL(`${protocol || "https"}://${forwardedHost}`);
      return allowedDomains.some((pattern) => {
        return matchPattern(testUrl, pattern);
      });
    } catch {
      return false;
    }
  }
  /**
   * Validate a hostname by rejecting any with path separators.
   * Prevents path injection attacks. Invalid hostnames return undefined.
   */
  static sanitizeHost(hostname) {
    if (!hostname) return void 0;
    if (/[/\\]/.test(hostname)) return void 0;
    return hostname;
  }
  /**
   * Validate forwarded headers (proto, host, port) against allowedDomains.
   * Returns validated values or undefined for rejected headers.
   * Uses strict defaults: http/https only for proto, rejects port if not in allowedDomains.
   */
  static validateForwardedHeaders(forwardedProtocol, forwardedHost, forwardedPort, allowedDomains) {
    const result = {};
    if (forwardedProtocol) {
      if (allowedDomains && allowedDomains.length > 0) {
        const hasProtocolPatterns = allowedDomains.some(
          (pattern) => pattern.protocol !== void 0
        );
        if (hasProtocolPatterns) {
          try {
            const testUrl = new URL(`${forwardedProtocol}://example.com`);
            const isAllowed = allowedDomains.some((pattern) => matchPattern(testUrl, pattern));
            if (isAllowed) {
              result.protocol = forwardedProtocol;
            }
          } catch {
          }
        } else if (/^https?$/.test(forwardedProtocol)) {
          result.protocol = forwardedProtocol;
        }
      } else if (/^https?$/.test(forwardedProtocol)) {
        result.protocol = forwardedProtocol;
      }
    }
    if (forwardedPort && allowedDomains && allowedDomains.length > 0) {
      const hasPortPatterns = allowedDomains.some((pattern) => pattern.port !== void 0);
      if (hasPortPatterns) {
        const isAllowed = allowedDomains.some((pattern) => pattern.port === forwardedPort);
        if (isAllowed) {
          result.port = forwardedPort;
        }
      }
    }
    if (forwardedHost && forwardedHost.length > 0 && allowedDomains && allowedDomains.length > 0) {
      const protoForValidation = result.protocol || "https";
      const sanitized = _App.sanitizeHost(forwardedHost);
      if (sanitized) {
        try {
          const hostnameOnly = sanitized.split(":")[0];
          const portFromHost = sanitized.includes(":") ? sanitized.split(":")[1] : void 0;
          const portForValidation = result.port || portFromHost;
          const hostWithPort = portForValidation ? `${hostnameOnly}:${portForValidation}` : hostnameOnly;
          const testUrl = new URL(`${protoForValidation}://${hostWithPort}`);
          const isAllowed = allowedDomains.some((pattern) => matchPattern(testUrl, pattern));
          if (isAllowed) {
            result.host = sanitized;
          }
        } catch {
        }
      }
    }
    return result;
  }
  /**
   * Creates a pipeline by reading the stored manifest
   *
   * @param streaming
   * @private
   */
  #createPipeline(streaming = false) {
    return AppPipeline.create({
      logger: this.#logger,
      manifest: this.#manifest,
      runtimeMode: "production",
      renderers: this.#manifest.renderers,
      defaultRoutes: createDefaultRoutes(this.#manifest),
      resolve: async (specifier) => {
        if (!(specifier in this.#manifest.entryModules)) {
          throw new Error(`Unable to resolve [${specifier}]`);
        }
        const bundlePath = this.#manifest.entryModules[specifier];
        if (bundlePath.startsWith("data:") || bundlePath.length === 0) {
          return bundlePath;
        } else {
          return createAssetLink(bundlePath, this.#manifest.base, this.#manifest.assetsPrefix);
        }
      },
      serverLike: true,
      streaming
    });
  }
  set setManifestData(newManifestData) {
    this.#manifestData = newManifestData;
  }
  removeBase(pathname) {
    if (pathname.startsWith(this.#manifest.base)) {
      return pathname.slice(this.#baseWithoutTrailingSlash.length + 1);
    }
    return pathname;
  }
  /**
   * It removes the base from the request URL, prepends it with a forward slash and attempts to decoded it.
   *
   * If the decoding fails, it logs the error and return the pathname as is.
   * @param request
   * @private
   */
  #getPathnameFromRequest(request) {
    const url = new URL(request.url);
    const pathname = prependForwardSlash(this.removeBase(url.pathname));
    try {
      return validateAndDecodePathname(pathname);
    } catch (e2) {
      this.getAdapterLogger().error(e2.toString());
      return pathname;
    }
  }
  /**
   * Given a `Request`, it returns the `RouteData` that matches its `pathname`. By default, prerendered
   * routes aren't returned, even if they are matched.
   *
   * When `allowPrerenderedRoutes` is `true`, the function returns matched prerendered routes too.
   * @param request
   * @param allowPrerenderedRoutes
   */
  match(request, allowPrerenderedRoutes = false) {
    const url = new URL(request.url);
    if (this.#manifest.assets.has(url.pathname)) return void 0;
    let pathname = this.#computePathnameFromDomain(request);
    if (!pathname) {
      pathname = prependForwardSlash(this.removeBase(url.pathname));
    }
    try {
      pathname = validateAndDecodePathname(pathname);
    } catch {
      return void 0;
    }
    let routeData = matchRoute(pathname, this.#manifestData);
    if (!routeData) return void 0;
    if (allowPrerenderedRoutes) {
      return routeData;
    } else if (routeData.prerender) {
      return void 0;
    }
    return routeData;
  }
  #computePathnameFromDomain(request) {
    let pathname = void 0;
    const url = new URL(request.url);
    if (this.#manifest.i18n && (this.#manifest.i18n.strategy === "domains-prefix-always" || this.#manifest.i18n.strategy === "domains-prefix-other-locales" || this.#manifest.i18n.strategy === "domains-prefix-always-no-redirect")) {
      const validated = _App.validateForwardedHeaders(
        request.headers.get("X-Forwarded-Proto") ?? void 0,
        request.headers.get("X-Forwarded-Host") ?? void 0,
        request.headers.get("X-Forwarded-Port") ?? void 0,
        this.#manifest.allowedDomains
      );
      let protocol = validated.protocol ? validated.protocol + ":" : url.protocol;
      let host = validated.host ?? request.headers.get("Host");
      if (host && protocol) {
        host = host.split(":")[0];
        try {
          let locale;
          const hostAsUrl = new URL(`${protocol}//${host}`);
          for (const [domainKey, localeValue] of Object.entries(
            this.#manifest.i18n.domainLookupTable
          )) {
            const domainKeyAsUrl = new URL(domainKey);
            if (hostAsUrl.host === domainKeyAsUrl.host && hostAsUrl.protocol === domainKeyAsUrl.protocol) {
              locale = localeValue;
              break;
            }
          }
          if (locale) {
            pathname = prependForwardSlash(
              joinPaths(normalizeTheLocale(locale), this.removeBase(url.pathname))
            );
            if (url.pathname.endsWith("/")) {
              pathname = appendForwardSlash(pathname);
            }
          }
        } catch (e2) {
          this.#logger.error(
            "router",
            `Astro tried to parse ${protocol}//${host} as an URL, but it threw a parsing error. Check the X-Forwarded-Host and X-Forwarded-Proto headers.`
          );
          this.#logger.error("router", `Error: ${e2}`);
        }
      }
    }
    return pathname;
  }
  #redirectTrailingSlash(pathname) {
    const { trailingSlash } = this.#manifest;
    if (pathname === "/" || isInternalPath(pathname)) {
      return pathname;
    }
    const path = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== "never");
    if (path !== pathname) {
      return path;
    }
    if (trailingSlash === "ignore") {
      return pathname;
    }
    if (trailingSlash === "always" && !hasFileExtension(pathname)) {
      return appendForwardSlash(pathname);
    }
    if (trailingSlash === "never") {
      return removeTrailingForwardSlash(pathname);
    }
    return pathname;
  }
  async render(request, renderOptions) {
    let routeData;
    let locals;
    let clientAddress;
    let addCookieHeader;
    const url = new URL(request.url);
    const redirect = this.#redirectTrailingSlash(url.pathname);
    const prerenderedErrorPageFetch = renderOptions?.prerenderedErrorPageFetch ?? fetch;
    if (redirect !== url.pathname) {
      const status = request.method === "GET" ? 301 : 308;
      return new Response(
        redirectTemplate({
          status,
          relativeLocation: url.pathname,
          absoluteLocation: redirect,
          from: request.url
        }),
        {
          status,
          headers: {
            location: redirect + url.search
          }
        }
      );
    }
    addCookieHeader = renderOptions?.addCookieHeader;
    clientAddress = renderOptions?.clientAddress ?? Reflect.get(request, clientAddressSymbol);
    routeData = renderOptions?.routeData;
    locals = renderOptions?.locals;
    if (routeData) {
      this.#logger.debug(
        "router",
        "The adapter " + this.#manifest.adapterName + " provided a custom RouteData for ",
        request.url
      );
      this.#logger.debug("router", "RouteData:\n" + routeData);
    }
    if (locals) {
      if (typeof locals !== "object") {
        const error2 = new AstroError(errors_data_exports.LocalsNotAnObject);
        this.#logger.error(null, error2.stack);
        return this.#renderError(request, {
          status: 500,
          error: error2,
          clientAddress,
          prerenderedErrorPageFetch
        });
      }
    }
    if (!routeData) {
      routeData = this.match(request);
      this.#logger.debug("router", "Astro matched the following route for " + request.url);
      this.#logger.debug("router", "RouteData:\n" + routeData);
    }
    if (!routeData) {
      routeData = this.#manifestData.routes.find(
        (route) => route.component === "404.astro" || route.component === DEFAULT_404_COMPONENT
      );
    }
    if (!routeData) {
      this.#logger.debug("router", "Astro hasn't found routes that match " + request.url);
      this.#logger.debug("router", "Here's the available routes:\n", this.#manifestData);
      return this.#renderError(request, {
        locals,
        status: 404,
        clientAddress,
        prerenderedErrorPageFetch
      });
    }
    const pathname = this.#getPathnameFromRequest(request);
    const defaultStatus = this.#getDefaultStatusCode(routeData, pathname);
    let response;
    let session;
    try {
      const mod2 = await this.#pipeline.getModuleForRoute(routeData);
      if (!mod2 || typeof mod2.page !== "function") {
        throw new AstroError({
          ...errors_data_exports.FailedToFindPageMapSSR,
          message: `The module for route "${routeData.route}" does not have a valid page function. This may occur when using static output mode with an SSR adapter.`
        });
      }
      const renderContext = await RenderContext.create({
        pipeline: this.#pipeline,
        locals,
        pathname,
        request,
        routeData,
        status: defaultStatus,
        clientAddress
      });
      session = renderContext.session;
      response = await renderContext.render(await mod2.page());
    } catch (err) {
      this.#logger.error("router", "Error while trying to render the route " + routeData.route);
      this.#logger.error(null, err.stack || err.message || String(err));
      return this.#renderError(request, {
        locals,
        status: 500,
        error: err,
        clientAddress,
        prerenderedErrorPageFetch
      });
    } finally {
      await session?.[PERSIST_SYMBOL]();
    }
    if (REROUTABLE_STATUS_CODES.includes(response.status) && // If the body isn't null, that means the user sets the 404 status
    // but uses the current route to handle the 404
    response.body === null && response.headers.get(REROUTE_DIRECTIVE_HEADER) !== "no") {
      return this.#renderError(request, {
        locals,
        response,
        status: response.status,
        // We don't have an error to report here. Passing null means we pass nothing intentionally
        // while undefined means there's no error
        error: response.status === 500 ? null : void 0,
        clientAddress,
        prerenderedErrorPageFetch
      });
    }
    if (response.headers.has(REROUTE_DIRECTIVE_HEADER)) {
      response.headers.delete(REROUTE_DIRECTIVE_HEADER);
    }
    if (addCookieHeader) {
      for (const setCookieHeaderValue of _App.getSetCookieFromResponse(response)) {
        response.headers.append("set-cookie", setCookieHeaderValue);
      }
    }
    Reflect.set(response, responseSentSymbol, true);
    return response;
  }
  setCookieHeaders(response) {
    return getSetCookiesFromResponse(response);
  }
  /**
   * Reads all the cookies written by `Astro.cookie.set()` onto the passed response.
   * For example,
   * ```ts
   * for (const cookie_ of App.getSetCookieFromResponse(response)) {
   *     const cookie: string = cookie_
   * }
   * ```
   * @param response The response to read cookies from.
   * @returns An iterator that yields key-value pairs as equal-sign-separated strings.
   */
  static getSetCookieFromResponse = getSetCookiesFromResponse;
  /**
   * If it is a known error code, try sending the according page (e.g. 404.astro / 500.astro).
   * This also handles pre-rendered /404 or /500 routes
   */
  async #renderError(request, {
    locals,
    status,
    response: originalResponse,
    skipMiddleware = false,
    error: error2,
    clientAddress,
    prerenderedErrorPageFetch
  }) {
    const errorRoutePath = `/${status}${this.#manifest.trailingSlash === "always" ? "/" : ""}`;
    const errorRouteData = matchRoute(errorRoutePath, this.#manifestData);
    const url = new URL(request.url);
    if (errorRouteData) {
      if (errorRouteData.prerender) {
        const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? ".html" : "";
        const statusURL = new URL(
          `${this.#baseWithoutTrailingSlash}/${status}${maybeDotHtml}`,
          url
        );
        if (statusURL.toString() !== request.url) {
          const response2 = await prerenderedErrorPageFetch(statusURL.toString());
          const override = { status, removeContentEncodingHeaders: true };
          return this.#mergeResponses(response2, originalResponse, override);
        }
      }
      const mod2 = await this.#pipeline.getModuleForRoute(errorRouteData);
      if (!mod2 || typeof mod2.page !== "function") {
        const response2 = this.#mergeResponses(new Response(null, { status }), originalResponse);
        Reflect.set(response2, responseSentSymbol, true);
        return response2;
      }
      let session;
      try {
        const renderContext = await RenderContext.create({
          locals,
          pipeline: this.#pipeline,
          middleware: skipMiddleware ? NOOP_MIDDLEWARE_FN : void 0,
          pathname: this.#getPathnameFromRequest(request),
          request,
          routeData: errorRouteData,
          status,
          props: { error: error2 },
          clientAddress
        });
        session = renderContext.session;
        const response2 = await renderContext.render(await mod2.page());
        return this.#mergeResponses(response2, originalResponse);
      } catch {
        if (skipMiddleware === false) {
          return this.#renderError(request, {
            locals,
            status,
            response: originalResponse,
            skipMiddleware: true,
            clientAddress,
            prerenderedErrorPageFetch
          });
        }
      } finally {
        await session?.[PERSIST_SYMBOL]();
      }
    }
    const response = this.#mergeResponses(new Response(null, { status }), originalResponse);
    Reflect.set(response, responseSentSymbol, true);
    return response;
  }
  #mergeResponses(newResponse, originalResponse, override) {
    let newResponseHeaders = newResponse.headers;
    if (override?.removeContentEncodingHeaders) {
      newResponseHeaders = new Headers(newResponseHeaders);
      newResponseHeaders.delete("Content-Encoding");
      newResponseHeaders.delete("Content-Length");
    }
    if (!originalResponse) {
      if (override !== void 0) {
        return new Response(newResponse.body, {
          status: override.status,
          statusText: newResponse.statusText,
          headers: newResponseHeaders
        });
      }
      return newResponse;
    }
    const status = override?.status ? override.status : originalResponse.status === 200 ? newResponse.status : originalResponse.status;
    try {
      originalResponse.headers.delete("Content-type");
    } catch {
    }
    const mergedHeaders = new Map([
      ...Array.from(newResponseHeaders),
      ...Array.from(originalResponse.headers)
    ]);
    const newHeaders = new Headers();
    for (const [name, value] of mergedHeaders) {
      newHeaders.set(name, value);
    }
    return new Response(newResponse.body, {
      status,
      statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
      // If you're looking at here for possible bugs, it means that it's not a bug.
      // With the middleware, users can meddle with headers, and we should pass to the 404/500.
      // If users see something weird, it's because they are setting some headers they should not.
      //
      // Although, we don't want it to replace the content-type, because the error page must return `text/html`
      headers: newHeaders
    });
  }
  #getDefaultStatusCode(routeData, pathname) {
    if (!routeData.pattern.test(pathname)) {
      for (const fallbackRoute of routeData.fallbackRoutes) {
        if (fallbackRoute.pattern.test(pathname)) {
          return 302;
        }
      }
    }
    const route = removeTrailingForwardSlash(routeData.route);
    if (route.endsWith("/404")) return 404;
    if (route.endsWith("/500")) return 500;
    return 200;
  }
};

// examples/testapp-ssr/node_modules/astro/dist/core/app/validate-headers.js
init_remote();

// examples/testapp-ssr/node_modules/astro/dist/core/polyfill.js
init_node_buffer();
init_node_crypto();
function apply() {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, "crypto", {
      value: node_crypto_default.webcrypto
    });
  }
  if (!globalThis.File) {
    Object.defineProperty(globalThis, "File", {
      value: node_buffer_default.File
    });
  }
}

// examples/testapp-ssr/node_modules/@astrojs/netlify/dist/polyfill.js
apply();

// examples/testapp-ssr/node_modules/astro/dist/env/runtime.js
init_errors3();
var _getEnv = (key) => process.env[key];
function setGetEnv(fn) {
  _getEnv = fn;
  _onSetGetEnv();
}
var _onSetGetEnv = () => {
};

// examples/testapp-ssr/node_modules/@astrojs/netlify/dist/ssr-function.js
setGetEnv((key) => process.env[key]);
var clientAddressSymbol2 = Symbol.for("astro.clientAddress");
var createExports = (manifest2, { middlewareSecret }) => {
  const app = new App(manifest2);
  function createHandler(integrationConfig) {
    return async function handler(request, context) {
      const routeData = app.match(request);
      if (!routeData && typeof integrationConfig.notFoundContent !== "undefined") {
        return new Response(integrationConfig.notFoundContent, {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
      Reflect.set(request, clientAddressSymbol2, context.ip);
      let locals = {};
      const astroLocalsHeader = request.headers.get("x-astro-locals");
      const middlewareSecretHeader = request.headers.get("x-astro-middleware-secret");
      if (astroLocalsHeader) {
        if (middlewareSecretHeader !== middlewareSecret) {
          return new Response("Forbidden", { status: 403 });
        }
        request.headers.delete("x-astro-middleware-secret");
        locals = JSON.parse(astroLocalsHeader);
      }
      locals.netlify = { context };
      const response = await app.render(request, { routeData, locals });
      if (app.setCookieHeaders) {
        for (const setCookieHeader of app.setCookieHeaders(response)) {
          response.headers.append("Set-Cookie", setCookieHeader);
        }
      }
      if (integrationConfig.cacheOnDemandPages) {
        const isCacheableMethod = ["GET", "HEAD"].includes(request.method);
        const hasCacheControl = [
          "Cache-Control",
          "CDN-Cache-Control",
          "Netlify-CDN-Cache-Control"
        ].some((header) => response.headers.has(header));
        if (isCacheableMethod && !hasCacheControl) {
          response.headers.append("CDN-Cache-Control", "public, max-age=31536000, must-revalidate");
        }
      }
      return response;
    };
  }
  return { default: createHandler };
};

// examples/testapp-ssr/.netlify/build/chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs
function _mergeNamespaces(n5, m2) {
  for (var i2 = 0; i2 < m2.length; i2++) {
    const e2 = m2[i2];
    if (typeof e2 !== "string" && !Array.isArray(e2)) {
      for (const k2 in e2) {
        if (k2 !== "default" && !(k2 in n5)) {
          const d = Object.getOwnPropertyDescriptor(e2, k2);
          if (d) {
            Object.defineProperty(n5, k2, d.get ? d : {
              enumerable: true,
              get: () => e2[k2]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n5, Symbol.toStringTag, { value: "Module" }));
}
var serverEntrypointModule = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null
}, [ssr_function_exports]);

// examples/testapp-ssr/.netlify/build/manifest_4wafXxO0.mjs
init_path();
init_remote();
init_dist2();
init_server_B_EsUmxH();
init_clsx();
init_esm();
var NOOP_MIDDLEWARE_FN2 = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER2, "true");
  return response;
};
var codeToStatusMap2 = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap2).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);
function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator2(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}
function deserializeRouteData2(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator2(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData2(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData2(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}
function deserializeManifest2(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData2(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData2(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey2(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN2 };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}
var manifest = deserializeManifest2({ "hrefRoot": "file:///D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/", "cacheDir": "file:///D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/node_modules/.astro/", "outDir": "file:///D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/dist/", "srcDir": "file:///D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/", "publicDir": "file:///D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/public/", "buildClientDir": "file:///D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/dist/", "buildServerDir": "file:///D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/.netlify/build/", "adapterName": "@astrojs/netlify", "routes": [{ "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "type": "page", "component": "_server-islands.astro", "params": ["name"], "segments": [[{ "content": "_server-islands", "dynamic": false, "spread": false }], [{ "content": "name", "dynamic": true, "spread": false }]], "pattern": "^\\/_server-islands\\/([^/]+?)\\/?$", "prerender": false, "isIndex": false, "fallbackRoutes": [], "route": "/_server-islands/[name]", "origin": "internal", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "type": "endpoint", "isIndex": false, "route": "/_image", "pattern": "^\\/_image\\/?$", "segments": [[{ "content": "_image", "dynamic": false, "spread": false }]], "params": [], "component": "node_modules/astro/dist/assets/endpoint/generic.js", "pathname": "/_image", "prerender": false, "fallbackRoutes": [], "origin": "internal", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/cart", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/cart\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "cart", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/api/cart.ts", "pathname": "/api/cart", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/products/[id]", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/products\\/([^/]+?)\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "products", "dynamic": false, "spread": false }], [{ "content": "id", "dynamic": true, "spread": false }]], "params": ["id"], "component": "src/pages/api/products/[id].ts", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/products", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/products\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "products", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/api/products.ts", "pathname": "/api/products", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/cart", "isIndex": false, "type": "page", "pattern": "^\\/cart\\/?$", "segments": [[{ "content": "cart", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/cart.astro", "pathname": "/cart", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/products/[id]", "isIndex": false, "type": "page", "pattern": "^\\/products\\/([^/]+?)\\/?$", "segments": [[{ "content": "products", "dynamic": false, "spread": false }], [{ "content": "id", "dynamic": true, "spread": false }]], "params": ["id"], "component": "src/pages/products/[id].astro", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/", "isIndex": true, "type": "page", "pattern": "^\\/$", "segments": [], "params": [], "component": "src/pages/index.astro", "pathname": "/", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }], "base": "/", "trailingSlash": "ignore", "compressHTML": true, "componentMetadata": [["D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/cart.astro", { "propagation": "none", "containsHead": true }], ["D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/index.astro", { "propagation": "none", "containsHead": true }], ["D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/src/pages/products/[id].astro", { "propagation": "none", "containsHead": true }]], "renderers": [], "clientDirectives": [["idle", '(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value=="object"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};"requestIdleCallback"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event("astro:idle"));})();'], ["load", '(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event("astro:load"));})();'], ["media", '(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener("change",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event("astro:media"));})();'], ["only", '(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event("astro:only"));})();'], ["visible", '(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value=="object"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event("astro:visible"));})();']], "entryModules": { "\0@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js": "pages/_image.astro.mjs", "\0@astro-page:src/pages/api/cart@_@ts": "pages/api/cart.astro.mjs", "\0@astro-page:src/pages/api/products/[id]@_@ts": "pages/api/products/_id_.astro.mjs", "\0@astro-page:src/pages/api/products@_@ts": "pages/api/products.astro.mjs", "\0@astro-page:src/pages/cart@_@astro": "pages/cart.astro.mjs", "\0@astro-page:src/pages/index@_@astro": "pages/index.astro.mjs", "\0@astro-page:src/pages/products/[id]@_@astro": "pages/products/_id_.astro.mjs", "\0@astrojs-ssr-virtual-entry": "entry.mjs", "\0@astro-renderers": "renderers.mjs", "\0noop-middleware": "_noop-middleware.mjs", "\0virtual:astro:actions/noop-entrypoint": "noop-entrypoint.mjs", "\0@astrojs-ssr-adapter": "_@astrojs-ssr-adapter.mjs", "\0@astrojs-manifest": "manifest_4wafXxO0.mjs", "D:/projects/myproject/astro-runtime/astro-runtime/examples/testapp-ssr/node_modules/unstorage/drivers/netlify-blobs.mjs": "chunks/netlify-blobs_DM36vZAS.mjs", "astro:scripts/before-hydration.js": "" }, "inlinedScripts": [], "assets": [], "buildFormat": "directory", "checkOrigin": true, "allowedDomains": [], "actionBodySizeLimit": 1048576, "serverIslandNameMap": [], "key": "luRJoMrIzM4HpNsVCRPrXlLaMQpbdpi8dm9nMAoG/68=", "sessionConfig": { "driver": "netlify-blobs", "options": { "name": "astro-sessions", "consistency": "strong" } } });
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => Promise.resolve().then(() => (init_netlify_blobs_DM36vZAS(), netlify_blobs_DM36vZAS_exports));

// examples/testapp-ssr/.netlify/build/entry.mjs
var serverIslandMap = /* @__PURE__ */ new Map();
var _page0 = () => Promise.resolve().then(() => (init_image_astro(), image_astro_exports));
var _page1 = () => Promise.resolve().then(() => (init_cart_astro(), cart_astro_exports));
var _page22 = () => Promise.resolve().then(() => (init_id_astro(), id_astro_exports));
var _page32 = () => Promise.resolve().then(() => (init_products_astro(), products_astro_exports));
var _page42 = () => Promise.resolve().then(() => (init_cart_astro2(), cart_astro_exports2));
var _page52 = () => Promise.resolve().then(() => (init_id_astro2(), id_astro_exports2));
var _page62 = () => Promise.resolve().then(() => (init_index_astro(), index_astro_exports));
var pageMap = /* @__PURE__ */ new Map([
  ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
  ["src/pages/api/cart.ts", _page1],
  ["src/pages/api/products/[id].ts", _page22],
  ["src/pages/api/products.ts", _page32],
  ["src/pages/cart.astro", _page42],
  ["src/pages/products/[id].astro", _page52],
  ["src/pages/index.astro", _page62]
]);
var _manifest = Object.assign(manifest, {
  pageMap,
  serverIslandMap,
  renderers,
  actions: () => Promise.resolve().then(() => (init_noop_entrypoint(), noop_entrypoint_exports)),
  middleware: () => Promise.resolve().then(() => (init_noop_middleware(), noop_middleware_exports))
});
var _args = {
  "middlewareSecret": "b794a6d4-1545-405b-95b7-709bdf4c0706"
};
var _exports = createExports(_manifest, _args);
var __astrojsSsrVirtualEntry = _exports.default;
var _start = "start";
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
  serverEntrypointModule[_start](_manifest, _args);
}
export {
  __astrojsSsrVirtualEntry as default,
  pageMap
};
/*! Bundled license information:

astro/dist/runtime/server/shorthash.js:
  (**
   * shortdash - https://github.com/bibig/node-shorthash
   *
   * @license
   *
   * (The MIT License)
   *
   * Copyright (c) 2013 Bibig <bibig@me.com>
   *
   * Permission is hereby granted, free of charge, to any person
   * obtaining a copy of this software and associated documentation
   * files (the "Software"), to deal in the Software without
   * restriction, including without limitation the rights to use,
   * copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the
   * Software is furnished to do so, subject to the following
   * conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
   * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
   * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
   * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
   * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   * OTHER DEALINGS IN THE SOFTWARE.
   *)

cssesc/cssesc.js:
  (*! https://mths.be/cssesc v3.0.0 by @mathias *)

node-fetch-native/dist/node.mjs:
  (**
  * @license
  * web-streams-polyfill v3.3.3
  * Copyright 2024 Mattias Buelens, Diwank Singh Tomer and other contributors.
  * This code is released under the MIT license.
  * SPDX-License-Identifier: MIT
  *)
  (*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)
  (*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)
  (*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

base-64/base64.js:
  (*! https://mths.be/base64 v1.0.0 by @mathias | MIT license *)
*/

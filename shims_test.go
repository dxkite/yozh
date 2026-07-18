package astroruntime

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/grafana/sobek"
)

// shimRun creates a fresh goja (sobek) runtime, applies optional setup code, registers
// the named shim file as an ES module, then evals testCode (also a module) that imports
// from the shim and writes boolean assertions to globalThis.__T.
// Returns the assertion map; any false entry fails the test via checkT.
func shimRun(t *testing.T, shimFile, setup, testCode string) map[string]bool {
	t.Helper()
	data, err := shimsFS.ReadFile("js/shims/" + shimFile)
	if err != nil {
		t.Fatalf("read shim %s: %v", shimFile, err)
	}
	rt := sobek.New()

	// Global assertion collector used by all test modules.
	if _, err := rt.RunScript("_init.js", "globalThis.__T = {};"); err != nil {
		t.Fatalf("init eval: %v", err)
	}

	if setup != "" {
		if _, err := rt.RunScript("_setup.js", setup); err != nil {
			t.Fatalf("setup eval: %v", err)
		}
	}

	// Module cache: resolve() serves the pre-parsed shim module by its file name;
	// no other specifiers are supported.
	modules := map[string]sobek.ModuleRecord{}
	resolve := func(_ any, specifier string) (sobek.ModuleRecord, error) {
		if m, ok := modules[specifier]; ok {
			return m, nil
		}
		return nil, fmt.Errorf("module not found: %s", specifier)
	}

	shimMod, err := sobek.ParseModule(shimFile, string(data), resolve)
	if err != nil {
		t.Fatalf("parse shim %s: %v", shimFile, err)
	}
	modules[shimFile] = shimMod

	// Test module imports the shim and populates globalThis.__T.
	testMod, err := sobek.ParseModule("_test.mjs", testCode, resolve)
	if err != nil {
		t.Fatalf("parse test module: %v", err)
	}
	if err := testMod.Link(); err != nil {
		t.Fatalf("link test module: %v", err)
	}
	promise := testMod.Evaluate(rt)
	switch promise.State() {
	case sobek.PromiseStateFulfilled:
		// ok
	case sobek.PromiseStateRejected:
		t.Fatalf("eval test module: %v", promise.Result())
	default:
		t.Fatalf("eval test module: evaluation left pending Promise")
	}

	// Serialise results.
	v, err := rt.RunScript("_read.js", "JSON.stringify(globalThis.__T)")
	if err != nil {
		t.Fatalf("read results: %v", err)
	}

	var results map[string]bool
	if err := json.Unmarshal([]byte(v.String()), &results); err != nil {
		t.Fatalf("parse results %q: %v", v.String(), err)
	}
	return results
}

func checkT(t *testing.T, results map[string]bool) {
	t.Helper()
	for name, ok := range results {
		if !ok {
			t.Errorf("FAIL: %s", name)
		}
	}
}

// ── node-path.js ─────────────────────────────────────────────────────────────

func TestShimPath(t *testing.T) {
	checkT(t, shimRun(t, "node-path.js", "", `
import * as path from 'node-path.js';
const T = globalThis.__T;

// normalize: leading dots must be preserved (bug that was fixed)
T.normalize_leading2     = path.normalize('../../a/b')           === '../../a/b';
T.normalize_leading1     = path.normalize('../foo')               === '../foo';
T.normalize_rel_up_in   = path.normalize('../foo/../bar')         === '../bar';
T.normalize_abs          = path.normalize('/a/../b')              === '/b';
T.normalize_abs_deep     = path.normalize('/a/b/../../c')         === '/c';
T.normalize_dot          = path.normalize('./a/./b')              === 'a/b';
T.normalize_multi_slash  = path.normalize('a//b///c')             === 'a/b/c';
T.normalize_trail        = path.normalize('a/b/')                 === 'a/b';
T.normalize_collapse_mid = path.normalize('a/b/../c')             === 'a/c';
T.normalize_empty        = path.normalize('')                     === '.';
T.normalize_dot_only     = path.normalize('.')                    === '.';

// join
T.join_basic            = path.join('a', 'b', 'c')                    === 'a/b/c';
T.join_leading_dots     = path.join('../../', 'assets/images/f.png')  === '../../assets/images/f.png';
T.join_abs              = path.join('/a', 'b')                         === '/a/b';
T.join_skip_empty       = path.join('a', '', 'b')                      === 'a/b';
T.join_dot              = path.join('./a', './b')                       === 'a/b';

// resolve
T.resolve_abs           = path.resolve('/a', 'b')     === '/a/b';
T.resolve_later_abs     = path.resolve('/a', '/b')    === '/b';
T.resolve_rel           = path.resolve('/base', '../sibling') === '/sibling';

// dirname
T.dirname_root          = path.dirname('/a')        === '/';
T.dirname_deep          = path.dirname('/a/b/c')    === '/a/b';
T.dirname_rel           = path.dirname('a/b')       === 'a';
T.dirname_single        = path.dirname('a')         === '.';
T.dirname_slash_only    = path.dirname('/')         === '/';

// basename
T.basename_full         = path.basename('/a/b.js')           === 'b.js';
T.basename_strip_ext    = path.basename('/a/b.js', '.js')    === 'b';
T.basename_no_dir       = path.basename('a/b')               === 'b';
T.basename_no_ext_arg   = path.basename('a/b', '.ts')        === 'b';

// extname
T.extname_js            = path.extname('file.js')      === '.js';
T.extname_none          = path.extname('file')          === '';
T.extname_dotfile       = path.extname('.hidden')       === '';
T.extname_multi_dot     = path.extname('a.b.c')         === '.c';
T.extname_nested        = path.extname('/a/b.mjs')      === '.mjs';

// isAbsolute
T.isAbsolute_abs        = path.isAbsolute('/a')      === true;
T.isAbsolute_rel        = path.isAbsolute('../a')    === false;
T.isAbsolute_empty      = path.isAbsolute('')        === false;

// relative
T.relative_same         = path.relative('a/b', 'a/b')   === '.';
T.relative_child        = path.relative('a', 'a/b')      === 'b';
T.relative_parent       = path.relative('a/b', 'a')      === '..';
T.relative_sibling      = path.relative('a/b', 'a/c')    === '../c';

// sep
T.sep                   = path.sep === '/';

// posix alias
T.posix_normalize       = path.posix.normalize('../../a') === '../../a';
T.posix_join            = path.posix.join('a', 'b')       === 'a/b';

// parse / format round-trip
const parsed = path.parse('/home/user/file.txt');
T.parse_root            = parsed.root === '/';
T.parse_dir             = parsed.dir  === '/home/user';
T.parse_base            = parsed.base === 'file.txt';
T.parse_ext             = parsed.ext  === '.txt';
T.parse_name            = parsed.name === 'file';
`))
}

// ── node-net.js ──────────────────────────────────────────────────────────────

func TestShimNet(t *testing.T) {
	checkT(t, shimRun(t, "node-net.js", "", `
import * as net from 'node-net.js';
const T = globalThis.__T;
T.isIP_v4          = net.isIP('1.2.3.4')         === 4;
T.isIP_v4_broad    = net.isIP('255.255.255.255')  === 4;
T.isIP_v6          = net.isIP('::1')              === 6;
T.isIP_v6_full     = net.isIP('2001:db8::1')      === 6;
T.isIP_none        = net.isIP('not-ip')           === 0;
T.isIP_empty       = net.isIP('')                 === 0;
T.isIPv4_true      = net.isIPv4('192.168.1.1')   === true;
T.isIPv4_false_v6  = net.isIPv4('::1')            === false;
T.isIPv4_false_str = net.isIPv4('example.com')   === false;
T.isIPv6_true      = net.isIPv6('2001:db8::1')   === true;
T.isIPv6_false_v4  = net.isIPv6('1.2.3.4')       === false;
`))
}

// ── node-events.js ───────────────────────────────────────────────────────────

func TestShimEvents(t *testing.T) {
	checkT(t, shimRun(t, "node-events.js", "", `
import { EventEmitter } from 'node-events.js';
const T = globalThis.__T;
const ee = new EventEmitter();

// on / emit
let val = 0;
ee.on('inc', (n) => { val += n; });
ee.emit('inc', 3);
ee.emit('inc', 7);
T.on_emit        = val === 10;

// off stops handler
let calls = 0;
const fn = () => calls++;
ee.on('tick', fn);
ee.emit('tick');
ee.off('tick', fn);
ee.emit('tick');
T.off            = calls === 1;

// once fires exactly once
let once_count = 0;
ee.once('ping', () => once_count++);
ee.emit('ping');
ee.emit('ping');
T.once           = once_count === 1;

// removeAllListeners for event
let c = 0;
ee.on('boom', () => c++);
ee.on('boom', () => c++);
ee.removeAllListeners('boom');
ee.emit('boom');
T.removeAll_event = c === 0;

// removeAllListeners all
const ee2 = new EventEmitter();
let d = 0;
ee2.on('a', () => d++);
ee2.on('b', () => d++);
ee2.removeAllListeners();
ee2.emit('a'); ee2.emit('b');
T.removeAll_all   = d === 0;

// emit returns true
T.emit_returns    = ee.emit('nonexistent') === true;
`))
}

// ── node-async-hooks.js ──────────────────────────────────────────────────────

func TestShimAsyncHooks(t *testing.T) {
	checkT(t, shimRun(t, "node-async-hooks.js", "", `
import { AsyncLocalStorage, AsyncResource, createHook, executionAsyncId, triggerAsyncId } from 'node-async-hooks.js';
const T = globalThis.__T;

// AsyncLocalStorage
const als = new AsyncLocalStorage();
T.als_initial    = als.getStore() === undefined;

let captured;
als.run('value', () => { captured = als.getStore(); });
T.als_run        = captured === 'value';
T.als_restored   = als.getStore() === undefined;

als.enterWith('entered');
T.als_enterWith  = als.getStore() === 'entered';

// Nested run restores outer
let inner;
als.run('inner', () => { inner = als.getStore(); });
T.als_nested_run    = inner === 'inner';
T.als_after_nested  = als.getStore() === 'entered';

// AsyncLocalStorage.bind is a static no-op passthrough
const fn = (x) => x * 2;
T.als_bind       = AsyncLocalStorage.bind(fn)(5) === 10;

// AsyncResource
const ar = new AsyncResource('MyType');
let scope_result;
ar.runInAsyncScope((x) => { scope_result = x; }, null, 42);
T.ar_run_scope   = scope_result === 42;
T.ar_asyncId     = ar.asyncId()        === 0;
T.ar_triggerId   = ar.triggerAsyncId() === 0;
ar.emitDestroy(); // should not throw
T.ar_emitDestroy = true;

// bind returns a function
const bound = ar.bind(() => 99);
T.ar_bind        = typeof bound === 'function';

// Module-level helpers
T.createHook     = typeof createHook()   === 'object';
T.execId         = executionAsyncId()    === 0;
T.triggerId_mod  = triggerAsyncId()      === 0;
`))
}

// ── node-stream.js ───────────────────────────────────────────────────────────

func TestShimStream(t *testing.T) {
	checkT(t, shimRun(t, "node-stream.js", "", `
import { PassThrough, pipeline, Readable, Writable, Transform, Stream } from 'node-stream.js';
const T = globalThis.__T;

// write / end / pipe
const src  = new PassThrough();
const recv = [];
const dst  = new PassThrough();
const origWrite = dst.write.bind(dst);
dst.write = (c) => { recv.push(c); return origWrite(c); };
src.pipe(dst);
src.write('hello');
src.write(' world');
src.end();
T.pipe_first     = recv[0] === 'hello';
T.pipe_second    = recv[1] === ' world';
T.pipe_count     = recv.length === 2;

// end with data
const src2 = new PassThrough();
const recv2 = [];
const dst2 = new PassThrough();
dst2.write = (c) => { recv2.push(c); return true; };
dst2.end   = () => {};
src2.pipe(dst2);
src2.end('final');
T.end_with_data  = recv2[0] === 'final';

// on 'end' listener fires
let ended = false;
const pt3 = new PassThrough();
pt3.on('end', () => { ended = true; });
pt3.end();
T.on_end         = ended === true;

// pipeline is a function (callback fires async via Promise, not testable synchronously)
T.pipeline_fn    = typeof pipeline === 'function';

// pipe returns dest
const a = new PassThrough();
const b = new PassThrough();
T.pipe_returns   = a.pipe(b) === b;

// aliased exports are functions
T.Readable_fn    = typeof Readable  === 'function';
T.Writable_fn    = typeof Writable  === 'function';
T.Transform_fn   = typeof Transform === 'function';
T.Stream_fn      = typeof Stream    === 'function';
`))
}

// ── node-util.js ─────────────────────────────────────────────────────────────

func TestShimUtil(t *testing.T) {
	checkT(t, shimRun(t, "node-util.js", "", `
import * as util from 'node-util.js';
const T = globalThis.__T;

// inspect returns a string
T.inspect_obj    = typeof util.inspect({a:1}) === 'string';
T.inspect_num    = typeof util.inspect(42)    === 'string';

// inherits wires up prototype chain
function Parent() {}
function Child()  {}
util.inherits(Child, Parent);
T.inherits_proto = Object.getPrototypeOf(Child.prototype) === Parent.prototype;
T.inherits_super = Child.super_ === Parent;
const c = new Child();
T.inherits_instanceof = c instanceof Parent;

// deprecate is a transparent passthrough
const orig = (x) => x + 1;
const dep  = util.deprecate(orig, 'old');
T.deprecate_fn   = typeof dep === 'function';
T.deprecate_call = dep(41) === 42;

// types
T.types_isError   = util.types.isNativeError(new Error('e')) === true;
T.types_not_error = util.types.isNativeError('nope')         === false;
T.types_isPromise = util.types.isPromise(Promise.resolve())  === true;
T.types_not_prom  = util.types.isPromise({then: null})       === false;
T.types_isRegExp  = util.types.isRegExp(/x/)                 === true;
T.types_not_re    = util.types.isRegExp('x')                 === false;

// format
T.fmt_s           = util.format('%s %s', 'hello', 'world') === 'hello world';
T.fmt_d           = util.format('%d', 42)                  === '42';
T.fmt_pct         = util.format('100%%')                   === '100%';
T.fmt_no_verb     = util.format('plain')                   === 'plain';
`))
}

// ── node-fs.js ───────────────────────────────────────────────────────────────

func TestShimFS(t *testing.T) {
	checkT(t, shimRun(t, "node-fs.js", "", `
import * as fs from 'node-fs.js';
const T = globalThis.__T;

// Sync stubs throw or return false
T.existsSync_false       = fs.existsSync('/any/path') === false;
T.statSync_throws        = (() => { try { fs.statSync('/');        return false; } catch { return true; } })();
T.readFileSync_throws    = (() => { try { fs.readFileSync('/');    return false; } catch { return true; } })();
T.createReadStream_throws= (() => { try { fs.createReadStream('/'); return false; } catch { return true; } })();

// promises API exists and is function-valued
T.promises_readFile  = typeof fs.promises.readFile  === 'function';
T.promises_writeFile = typeof fs.promises.writeFile === 'function';
T.promises_readdir   = typeof fs.promises.readdir   === 'function';
T.promises_stat      = typeof fs.promises.stat      === 'function';
T.promises_mkdir     = typeof fs.promises.mkdir     === 'function';
T.promises_rm        = typeof fs.promises.rm        === 'function';
`))
}

// ── node-module.js ───────────────────────────────────────────────────────────

func TestShimModule(t *testing.T) {
	checkT(t, shimRun(t, "node-module.js", "", `
import * as mod from 'node-module.js';
const T = globalThis.__T;
T.createRequire_fn = typeof mod.createRequire === 'function';
const req = mod.createRequire('/foo/bar.js');
T.req_fn           = typeof req === 'function';
T.req_throws       = (() => { try { req('fs'); return false; } catch { return true; } })();
T.req_throws_msg   = (() => { try { req('os'); return false; } catch(e) { return e.message.includes('require'); } })();
`))
}

// ── node-tty.js ──────────────────────────────────────────────────────────────

func TestShimTTY(t *testing.T) {
	checkT(t, shimRun(t, "node-tty.js", "", `
import * as tty from 'node-tty.js';
const T = globalThis.__T;
T.isatty_1       = tty.isatty(1) === false;
T.isatty_2       = tty.isatty(2) === false;
T.isatty_0       = tty.isatty(0) === false;
T.ReadStream_fn  = typeof tty.ReadStream  === 'function';
T.WriteStream_fn = typeof tty.WriteStream === 'function';
`))
}

// ── node-http2.js ────────────────────────────────────────────────────────────

func TestShimHTTP2(t *testing.T) {
	checkT(t, shimRun(t, "node-http2.js", "", `
import * as h2 from 'node-http2.js';
const T = globalThis.__T;
const srv = h2.createServer();
T.createServer_listen   = typeof srv.listen === 'function';
T.createServer_close    = typeof srv.close  === 'function';
const ssrv = h2.createSecureServer();
T.secureServer_listen   = typeof ssrv.listen === 'function';
T.secureServer_close    = typeof ssrv.close  === 'function';
T.Request_exported      = typeof h2.Http2ServerRequest  === 'function';
T.Response_exported     = typeof h2.Http2ServerResponse === 'function';
`))
}

// ── node-url.js ──────────────────────────────────────────────────────────────

func TestShimURL(t *testing.T) {
	// goja/sobek ships a native URL/URLSearchParams; the shim test still exercises
	// the fallback-mock path so the assertions stay identical across engines.
	setup := `
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = function URL(u, base) {
    var s = base ? String(base).replace(/\/$/, '') + '/' + String(u) : String(u);
    this.href = s;
    this.protocol = s.split(':')[0] + ':';
    var withoutProto = s.slice(this.protocol.length).replace(/^\/\//, '');
    var slash = withoutProto.indexOf('/');
    this.host     = slash >= 0 ? withoutProto.slice(0, slash) : withoutProto;
    this.pathname = slash >= 0 ? withoutProto.slice(slash) : '/';
    this.search   = '';
    this.hash     = '';
  };
}
if (typeof globalThis.URLSearchParams === 'undefined') {
  globalThis.URLSearchParams = function URLSearchParams() {};
}
`
	checkT(t, shimRun(t, "node-url.js", setup, `
import * as url from 'node-url.js';
const T = globalThis.__T;

// fileURLToPath strips the file:// prefix
T.fileURLToPath_unix    = url.fileURLToPath('file:///a/b.js')     === '/a/b.js';
// file://host/path: shim strips only "file://" prefix, leaving "host/path"
T.fileURLToPath_host    = url.fileURLToPath('file://localhost/c')  === 'localhost/c';
T.fileURLToPath_str     = url.fileURLToPath('file:///tmp/x.mjs')  === '/tmp/x.mjs';

// pathToFileURL returns an object with href
const u = url.pathToFileURL('/a/b');
T.pathToFileURL_obj     = typeof u          === 'object';
T.pathToFileURL_href    = typeof u.href     === 'string';
T.pathToFileURL_scheme  = u.href.startsWith('file://');

// format
T.format_string         = url.format('http://example.com') === 'http://example.com';
T.format_obj_href       = url.format({ href: 'https://x.io' }) === 'https://x.io';

// exports exist
T.URL_exported          = typeof url.URL          === 'function';
T.URLSParams_exported   = typeof url.URLSearchParams === 'function';
`))
}

// ── node-crypto.js ───────────────────────────────────────────────────────────

func TestShimCrypto(t *testing.T) {
	setup := `
globalThis.crypto = {
  getRandomValues: function(arr) {
    for (var i = 0; i < arr.length; i++) arr[i] = (i * 37 + 11) % 256;
    return arr;
  }
};
`
	checkT(t, shimRun(t, "node-crypto.js", setup, `
import * as c from 'node-crypto.js';
const T = globalThis.__T;

// webcrypto is the same reference as globalThis.crypto
T.webcrypto_ref        = c.webcrypto === globalThis.crypto;

// randomBytes returns a Uint8Array of the requested length
const b = c.randomBytes(16);
T.randomBytes_len      = b.length === 16;
T.randomBytes_typed    = b instanceof Uint8Array;
T.randomBytes_nonzero  = b[0] !== 0 || b[1] !== 0; // mock fills non-zero

// Unsupported functions throw
T.pbkdf2Sync_throws    = (() => { try { c.pbkdf2Sync();      return false; } catch { return true; } })();
T.cipheriv_throws      = (() => { try { c.createCipheriv();  return false; } catch { return true; } })();
T.decipheriv_throws    = (() => { try { c.createDecipheriv(); return false; } catch { return true; } })();
T.hmac_throws          = (() => { try { c.createHmac();      return false; } catch { return true; } })();
T.hash_throws          = (() => { try { c.createHash();      return false; } catch { return true; } })();
`))
}

// ── node-buffer.js ───────────────────────────────────────────────────────────

func TestShimBuffer(t *testing.T) {
	setup := `
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = function TextEncoder() {
    this.encode = function(s) {
      var arr = new Uint8Array(s.length);
      for (var i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i) & 0xff;
      return arr;
    };
  };
}
globalThis.File = undefined;
globalThis.Blob = undefined;
`
	checkT(t, shimRun(t, "node-buffer.js", setup, `
import { Buffer } from 'node-buffer.js';
const T = globalThis.__T;

// from string
const a = Buffer.from('hi');
T.from_str_len    = a.length === 2;
T.from_str_typed  = a instanceof Uint8Array;

// from array-like
const b = Buffer.from([1, 2, 3]);
T.from_arr_len    = b.length === 3;
T.from_arr_typed  = b instanceof Uint8Array;

// alloc
const c = Buffer.alloc(8);
T.alloc_len       = c.length === 8;
T.alloc_typed     = c instanceof Uint8Array;
T.alloc_zeros     = c[0] === 0 && c[7] === 0;

// isBuffer always false (no true Buffer in this runtime)
T.isBuffer_plain  = Buffer.isBuffer({})          === false;
T.isBuffer_uint8  = Buffer.isBuffer(new Uint8Array()) === false;
`))
}

// ── node-process.js ──────────────────────────────────────────────────────────

func TestShimProcess(t *testing.T) {
	// Ensure globalThis.process is absent so the shim returns its fallback object.
	setup := `
delete globalThis.process;
globalThis.__processEnv = { NODE_ENV: 'test', HOME: '/home/user' };
`
	checkT(t, shimRun(t, "node-process.js", setup, `
import procDefault, { env, version, platform, versions, stdout, stderr } from 'node-process.js';
const T = globalThis.__T;

// Default export is the fallback process-like object.
T.default_obj      = typeof procDefault    === 'object';
T.version_str      = typeof procDefault.version  === 'string';
T.platform_linux   = procDefault.platform === 'linux';
T.stdout_obj       = typeof procDefault.stdout   === 'object';
T.stderr_obj       = typeof procDefault.stderr   === 'object';

// Named exports mirror the fallback properties.
T.named_version    = version  === 'v20.0.0';
T.named_platform   = platform === 'linux';
T.named_versions   = typeof versions === 'object';
T.named_stdout     = typeof stdout   === 'object';
T.named_stderr     = typeof stderr   === 'object';

// env reflects the __processEnv we set above.
T.env_obj          = typeof env === 'object';
T.env_node_env     = env.NODE_ENV === 'test';
T.env_home         = env.HOME === '/home/user';
`))
}

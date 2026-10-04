/**
 * A TRUSTED PRESS — the one thing every probe here could not do.
 *
 * ⭐⭐⭐ WHY THIS EXISTS. `src/lib/scrub.js` has said since it was written that
 * *"synthetic clicks do not drive a native range (an untrusted event never
 * starts the internal drag)"*, and `docs/looking-at-pixels.md` records it as a
 * standing blind spot. Every probe in this directory therefore drives the
 * scrubber by dispatching `input` — which is HALF OF A GESTURE NO HAND CAN MAKE.
 *
 * ⛔⛔ AND THAT HALF IS WHERE A DEFECT LIVED FOR AS LONG AS THE CONTROL HAS
 * EXISTED. A native range reports one tap TWICE, as `input` and then `change`
 * with the same value, and the page drew the frame once for each. Kevin found it
 * from the live site on 2026-10-04 ("the replay appears to go through two loops
 * for each event"); no test and no probe here could have, because none of them
 * ever sent the pair. `Input.dispatchMouseEvent` over the DevTools protocol is
 * indistinguishable from a hand: it starts the internal drag, the thumb moves,
 * and the control fires its real events in its real order.
 *
 * NOT A DEPENDENCY. The WebSocket handshake and the two frame shapes this needs
 * are about sixty lines over `node:net` and `node:crypto`; a client library
 * would be the first runtime dependency this repo has ever taken, for a protocol
 * that is this small.
 *
 * ⚠️ WHAT IT CANNOT TELL YOU. It presses with a MOUSE. A touch tap on a phone is
 * a different pointer type, and while both deliver `pointerdown` before the
 * value changes, this file has not measured a finger — only Kevin's hands can,
 * which is the division `docs/looking-at-pixels.md` §5 already draws.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { connect } from 'node:net';
import { randomBytes, createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/** Open a WebSocket to a DevTools target and return `{send, close}`. */
export async function socket(url) {
  const u = new URL(url);
  const sock = connect(+u.port, u.hostname);
  await new Promise((res, rej) => { sock.once('connect', res); sock.once('error', rej); });
  const key = randomBytes(16).toString('base64');
  sock.write(`GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\n`
    + 'Upgrade: websocket\r\nConnection: Upgrade\r\n'
    + `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);

  let buf = Buffer.alloc(0);
  await new Promise((res, rej) => {
    const on = d => {
      buf = Buffer.concat([buf, d]);
      const end = buf.indexOf('\r\n\r\n');
      if (end < 0) return;
      const head = buf.subarray(0, end).toString();
      sock.off('data', on);
      buf = buf.subarray(end + 4);
      /* ⛔ THE ACCEPT KEY IS CHECKED. Without it a 400 or a proxy's error page
         reads as a connected socket, and every later call times out with no
         statement of why — the "a probe that silently reads a 404 proves
         nothing" rule, one layer down. */
      const want = createHash('sha1').update(key + GUID).digest('base64');
      return head.includes(want) ? res() : rej(new Error(`handshake refused: ${head.split('\r\n')[0]}`));
    };
    sock.on('data', on);
    sock.once('error', rej);
  });

  const waiting = new Map();
  let seq = 0;
  const drain = () => {
    for (;;) {
      if (buf.length < 2) return;
      const op = buf[0] & 0x0f, flag = buf[1] & 0x7f;
      let off = 2, len = flag;
      if (flag === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (flag === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (buf.length < off + len) return;
      const body = buf.subarray(off, off + len);
      buf = buf.subarray(off + len);
      // Text frames only: every CDP reply is one, and events we did not ask for
      // are dropped rather than queued.
      if (op !== 1) continue;
      const m = JSON.parse(body.toString());
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    }
  };
  sock.on('data', d => { buf = Buffer.concat([buf, d]); drain(); });

  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    waiting.set(id, m => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    const body = Buffer.from(JSON.stringify({ id, method, params }));
    // A client frame MUST be masked; the server's never is, which is why `drain`
    // above does not unmask.
    const mask = randomBytes(4);
    const masked = Buffer.from(body.map((b, k) => b ^ mask[k % 4]));
    let head;
    if (body.length < 126) head = Buffer.from([0x81, 0x80 | body.length]);
    else if (body.length < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 0xfe; head.writeUInt16BE(body.length, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 0xff; head.writeBigUInt64BE(BigInt(body.length), 2); }
    sock.write(Buffer.concat([head, mask, masked]));
  });
  return { send, close: () => sock.destroy() };
}

const wait = ms => new Promise(r => setTimeout(r, ms));

/**
 * Launch a headless Chrome on a URL and attach to its page.
 *
 * ⛔ THE PORT IS CHOSEN BY CHROME, NOT BY US, and read back from
 * `DevToolsActivePort` in its own profile directory — the same argument
 * `lib.mjs::serve` makes for binding port 0: there is no port to collide over,
 * so two probes running at once cannot measure each other's browser.
 */
export async function page(url, { chrome, width = 1280, height = 1000, timeout = 20000 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rtg-cdp-'));
  const proc = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=0', `--user-data-dir=${dir}`,
    `--window-size=${width},${height}`, '--force-device-scale-factor=1', url],
    { env: { ...process.env, LD_LIBRARY_PATH: `/tmp/rtg-pixels/libs/root/usr/lib/x86_64-linux-gnu:${process.env.LD_LIBRARY_PATH || ''}` } });
  let err = '';
  proc.stderr.on('data', d => { err += d; });
  const stop = () => { proc.kill('SIGKILL'); try { rmSync(dir, { recursive: true, force: true }); } catch { /* gone already */ } };

  const portFile = join(dir, 'DevToolsActivePort');
  const deadline = Date.now() + timeout;
  let port = null;
  while (port === null && Date.now() < deadline) {
    await wait(50);
    // The file is written in two lines and the first can be read mid-write.
    if (existsSync(portFile)) { const t = readFileSync(portFile, 'utf8').split('\n'); if (t.length > 1 && t[0]) port = +t[0]; }
  }
  if (!port) { stop(); throw new Error(`Chrome never opened a debugging port${err ? ` — ${err.split('\n')[0]}` : ''}`); }

  let target = null;
  while (!target && Date.now() < deadline) {
    await wait(50);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch { /* not listening yet */ }
  }
  if (!target) { stop(); throw new Error('Chrome opened a port and never offered a page target'); }

  const cdp = await socket(target.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  return { cdp, stop: () => { cdp.close(); stop(); } };
}

/** Evaluate in the page and return the value, THROWING what the page threw. */
export async function evaluate(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    const e = r.exceptionDetails;
    throw new Error(`the page threw: ${(e.exception && e.exception.description) || e.text}`);
  }
  return r.result.value;
}

/**
 * Press and release at a point, with the pointer DOWN for `hold` ms.
 *
 * ⚠️ THE HOLD IS NOT COSMETIC. The defect this file was written for turns on the
 * gap between `input` (at press) and `change` (at release): measured at 108ms on
 * a real tap, which is long enough for the first draw to paint before the second
 * one lands. A press and release in the same millisecond would deliver both
 * events in one task and hide exactly the thing being measured.
 */
export async function tap(cdp, x, y, hold = 90) {
  const at = { x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 };
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...at, buttons: 1 });
  await wait(hold);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...at, buttons: 0 });
}

/** Where an element is on screen, or null when it is not laid out at all. */
export async function boxOf(cdp, selector) {
  return evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width && r.height ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
  })()`);
}

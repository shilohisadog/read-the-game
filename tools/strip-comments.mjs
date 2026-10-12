/**
 * Remove comments from a built page: script (via the project's lexer, so a `/`
 * in a string, template or regex is never mistaken for one), stylesheet and
 * HTML. The source keeps its comments; only what a reader downloads loses them.
 *
 *   node tools/strip-comments.mjs < page.html > page.min.html
 */
import { readFileSync } from 'node:fs';
import { walk } from './jslex.mjs';

/** Remove [start, end) ranges; a range that fills its line takes the line. */
function cut(src, ranges, joiner) {
  let out = '', at = 0;
  for (let [s, e] of ranges) {
    while (s > at && (src[s - 1] === ' ' || src[s - 1] === '\t')) s--;
    const wholeLine = (s === 0 || src[s - 1] === '\n') && (e >= src.length || src[e] === '\n');
    out += src.slice(at, s);
    if (wholeLine) { if (e < src.length) e++; }
    else out += joiner(src.slice(s, e));
    at = e;
  }
  return out + src.slice(at);
}

export function stripJs(src) {
  const ranges = [];
  walk(src, t => { if (t.t === 'comment') ranges.push([t.start, t.end]); }, { comments: true });
  // A block comment spanning lines acts as a line break for semicolon
  // insertion; any other comment separates tokens.
  return cut(src, ranges, c => (c.startsWith('/*') && c.includes('\n') ? '\n' : (c.startsWith('//') ? '' : ' ')));
}

export function stripCss(src) {
  const ranges = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (src.startsWith('url(', i)) {
      while (i < src.length && src[i] !== ')') i++;
    } else if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      const end = e === -1 ? src.length : e + 2;
      ranges.push([i, end]);
      i = end - 1;
    }
  }
  return cut(src, ranges, () => '');
}

/** Cloudflare's email protection reads these; they are markup, not commentary. */
const KEEP = /^<!--\/?email_off-->$/;

export function stripHtml(html) {
  const parts = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/);
  return parts.map(p => {
    let m = /^(<script\b[^>]*>)([\s\S]*?)(<\/script>)$/.exec(p);
    if (m) return m[1] + stripJs(m[2]) + m[3];
    m = /^(<style\b[^>]*>)([\s\S]*?)(<\/style>)$/.exec(p);
    if (m) return m[1] + stripCss(m[2]) + m[3];
    return p.replace(/<!--[\s\S]*?-->/g, c => (KEEP.test(c) ? c : ''));
  }).join('');
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.stdout.write(stripHtml(readFileSync(0, 'utf8')));

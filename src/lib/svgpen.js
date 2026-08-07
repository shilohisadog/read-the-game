/**
 * SvgPen — draws canvas-style, emits SVG.
 *
 * Implements the subset of CanvasRenderingContext2D that src/lib/figures.js
 * uses, so one figure definition serves both surfaces: the goalie's-eye view
 * passes a real canvas context, the 2D rink passes one of these.
 *
 * The 2D rink cannot simply overlay a canvas. Its events are SVG elements on
 * purpose — a viewer can inspect them, which is "check our work" made physical,
 * and the why-popup hangs off click handlers on those nodes. Rasterising the
 * figures would cost both.
 *
 * DELIBERATE OMISSIONS, so nobody hunts for them:
 *
 *   shadowColor / shadowBlur are IGNORED. The canvas figures use them for the
 *   outcome glow; in SVG that needs a filter per colour, and the rink already
 *   applies its glow in CSS where it belongs. Accepting the property and doing
 *   nothing is the honest behaviour here — the alternative is a filter stack
 *   that duplicates styling the stylesheet already owns.
 *
 *   Transforms are tracked as a string and applied to runs of elements, since
 *   canvas save/restore does not map onto SVG group nesting one-to-one.
 *
 * Everything else — paths, arcs, ellipses, clipping, alpha, line joins — is
 * real, and figures.test.js asserts both pens accept the same calls.
 */

const f = n => Number.isFinite(n) ? +n.toFixed(2) : 0;
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export class SvgPen {
  constructor(idPrefix = 'f') {
    this.parts = [];
    this.defs = [];
    this._id = 0;
    this._prefix = idPrefix;
    this._d = '';
    this._tf = '';
    this._clip = null;
    this._stack = [];
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.lineWidth = 1;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.globalAlpha = 1;
    this.shadowColor = null;   // accepted, ignored — see header
    this.shadowBlur = 0;
  }

  // ---- state -------------------------------------------------------------
  save() {
    this._stack.push({
      tf: this._tf, clip: this._clip,
      fillStyle: this.fillStyle, strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth, lineCap: this.lineCap, lineJoin: this.lineJoin,
      globalAlpha: this.globalAlpha,
    });
  }
  restore() {
    const s = this._stack.pop();
    if (s) Object.assign(this, s, { _tf: s.tf, _clip: s.clip });
    if (s) { this._tf = s.tf; this._clip = s.clip; }
  }
  translate(x, y) { this._tf += ` translate(${f(x)},${f(y)})`; }
  rotate(r) { this._tf += ` rotate(${f(r * 180 / Math.PI)})`; }

  // ---- path building -----------------------------------------------------
  beginPath() { this._d = ''; }
  moveTo(x, y) { this._d += `M${f(x)},${f(y)}`; }
  lineTo(x, y) { this._d += `L${f(x)},${f(y)}`; }
  quadraticCurveTo(cx, cy, x, y) { this._d += `Q${f(cx)},${f(cy)} ${f(x)},${f(y)}`; }
  closePath() { this._d += 'Z'; }

  arc(cx, cy, r, a0, a1) { this._sweep(cx, cy, r, r, a0, a1); }
  ellipse(cx, cy, rx, ry, _rot, a0, a1) { this._sweep(cx, cy, rx, ry, a0, a1); }

  /** Arc/ellipse as SVG A-commands. A full turn needs two halves — one A cannot
   *  express 360°, since start and end would coincide. */
  _sweep(cx, cy, rx, ry, a0, a1) {
    const span = Math.abs(a1 - a0);
    const p = (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    if (span >= Math.PI * 2 - 1e-6) {
      const [x0, y0] = p(0), [x1, y1] = p(Math.PI);
      this._d += `M${f(x0)},${f(y0)}A${f(rx)},${f(ry)} 0 1 1 ${f(x1)},${f(y1)}`
               + `A${f(rx)},${f(ry)} 0 1 1 ${f(x0)},${f(y0)}Z`;
      return;
    }
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const large = span > Math.PI ? 1 : 0;
    const sweep = a1 > a0 ? 1 : 0;
    this._d += `${this._d ? 'L' : 'M'}${f(x0)},${f(y0)}`
             + `A${f(rx)},${f(ry)} 0 ${large} ${sweep} ${f(x1)},${f(y1)}`;
  }

  // ---- painting ----------------------------------------------------------
  fill() { this._emit({ fill: this.fillStyle, stroke: 'none' }); }
  stroke() {
    this._emit({
      fill: 'none', stroke: this.strokeStyle, 'stroke-width': f(this.lineWidth),
      'stroke-linecap': this.lineCap, 'stroke-linejoin': this.lineJoin,
    });
  }
  fillRect(x, y, w, h) {
    this._el('rect', {
      x: f(x), y: f(y), width: f(w), height: f(h), fill: this.fillStyle,
    });
  }
  clip() {
    const id = `${this._prefix}c${this._id++}`;
    this.defs.push(`<clipPath id="${id}"><path d="${this._d}"/></clipPath>`);
    this._clip = id;
  }

  _emit(attrs) {
    if (!this._d) return;
    this._el('path', { d: this._d, ...attrs });
  }
  _el(tag, attrs) {
    const a = { ...attrs };
    if (this._clip) a['clip-path'] = `url(#${this._clip})`;
    if (this.globalAlpha !== 1) a.opacity = f(this.globalAlpha);
    // Drop attributes that match the SVG default -- on ~2,300 nodes redrawn
    // every tick, the bytes are the frame budget.
    if (a['stroke-linecap'] === 'butt') delete a['stroke-linecap'];
    if (a['stroke-linejoin'] === 'miter') delete a['stroke-linejoin'];
    const body = Object.entries(a)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
    this.parts.push({ tf: this._tf.trim(), xml: `<${tag} ${body}/>` });
  }

  /**
   * Everything drawn so far, as one group.
   *
   * Consecutive elements sharing a transform are wrapped in a `<g transform>`
   * rather than each carrying its own copy. A figure applies one translate and
   * one rotate up front, so nearly all of its shapes share a transform, and
   * repeating that string per element cost about a third of the markup.
   */
  toSvg(groupAttrs = '') {
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
    let out = '', run = null, buf = [];
    const flush = () => {
      if (!buf.length) return;
      out += run ? `<g transform="${run}">${buf.join('')}</g>` : buf.join('');
      buf = [];
    };
    for (const part of this.parts) {
      if (part.tf !== run) { flush(); run = part.tf; }
      buf.push(part.xml);
    }
    flush();
    return `<g ${groupAttrs}>${defs}${out}</g>`;
  }
}

// RLR · Organigrama de Gobierno 2.0 · la aplicación — Ricardo López Reyero
// Árbol con zoom (d3), lista en orden de importancia, tablero por estatus, ficha con persona y currículum.
// Todo sale de puestos.js; lo que cambia (estatus, persona, foto, CV, porqué) vive en D1 y R2 a través de /api.
import { PUESTOS, SECTORES, NIVELES, GRUPOS_NIVEL, OLAS, ESTATUS, porId, hijos, total, ruta, importancia, raiz } from "/puestos.js?v=1";
const _RLR = "Ricardo López Reyero", _k = "EYE", _rev = 181218;
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n) => n.toLocaleString("es-MX");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sinAcentos = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const TOTAL = total("pres");

// ---------------------------------------------------------------------------------------------
// RLR · estado remoto y sesión
let estado = {};            // id -> { estatus, nombre, foto, cv, porque, actualizado, por }
let yo = null;              // { email, name, picture, editor }
const estatusDe = (x) => estado[x.id]?.estatus || x.est || "pausado";
const pase = () => (window.LoginCT && LoginCT.pase()) || "";
const cab = (extra = {}) => ({ ...(pase() ? { authorization: "Bearer " + pase() } : {}), ...extra });
async function cargarEstado() {
  try { const r = await fetch("/api/estado"); if (r.ok) estado = await r.json(); } catch {}
}
async function quienSoy() {
  yo = null;
  if (!pase()) return;
  try { const r = await fetch("/api/quien", { headers: cab() }); if (r.ok) yo = await r.json(); } catch {}
}

// ---------------------------------------------------------------------------------------------
// RLR · filtros
const F = { q: "", nivel: "todos", estatus: "todos", sectores: new Set(), ola: 0 };
const filtroActivo = () => F.q || F.nivel !== "todos" || F.estatus !== "todos" || F.sectores.size || F.ola;
function pasa(x) {
  if (F.nivel !== "todos" && !GRUPOS_NIVEL[F.nivel].includes(x.n)) return false;
  const e = estatusDe(x);
  if (F.estatus === "faltan" ? e === "contratado" : F.estatus !== "todos" && e !== F.estatus) return false;
  if (F.sectores.size && !F.sectores.has(x.s)) return false;
  if (F.ola && x.ola !== F.ola) return false;
  if (F.q) {
    const q = sinAcentos(F.q), p = estado[x.id];
    if (!sinAcentos(x.t).includes(q) && !sinAcentos(x.kpi).includes(q) && !sinAcentos(p?.nombre).includes(q) && x.id !== F.q) return false;
  }
  return true;
}
// Los puestos que cuentan para lista, tablero y resumen: los nombrados más los de plantilla que alguien ya tocó
function universo() {
  const extra = Object.keys(estado).filter((id) => id.includes("~")).map(porId).filter(Boolean);
  return PUESTOS.concat(extra);
}
const visibles = () => universo().filter(pasa).sort((a, b) => importancia(a) - importancia(b));

function pintarResumen() {
  const u = universo(), c = { contratado: 0, contratacion: 0, pausado: 0 };
  for (const x of PUESTOS) c[estatusDe(x)]++;
  const vis = filtroActivo() ? visibles().length : null;
  $("#resumen").innerHTML =
    `<span><b>${fmt(PUESTOS.length)}</b> puestos nombrados · <b>${fmt(TOTAL)}</b> plazas</span>` +
    `<span><i class="pt e-contratado"></i><b>${c.contratado}</b> contratados</span>` +
    `<span><i class="pt e-contratacion"></i><b>${c.contratacion}</b> en contratación</span>` +
    `<span><i class="pt e-pausado"></i><b>${c.pausado}</b> pausados</span>` +
    `<span><b>${Math.round((c.contratado / PUESTOS.length) * 100)} %</b> cubierto</span>` +
    (vis !== null ? `<span>· <b>${fmt(vis)}</b> coinciden</span>` : "");
  $("#limpiar").hidden = !filtroActivo();
}
function montarFiltros() {
  $("#buscar").addEventListener("input", (e) => { F.q = e.target.value.trim(); refrescar(true); });
  for (const seg of $$(".filtros .seg[data-f]")) seg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", x === b));
    F[seg.dataset.f] = b.dataset.val; refrescar(true);
  });
  const chips = $("#sectores");
  chips.innerHTML = Object.entries(SECTORES).map(([k, s]) => `<button type="button" data-s="${k}" aria-pressed="false" style="--c:${s.c}"><i></i>${s.n}</button>`).join("");
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const k = b.dataset.s; F.sectores.has(k) ? F.sectores.delete(k) : F.sectores.add(k);
    b.setAttribute("aria-pressed", F.sectores.has(k)); refrescar(true);
  });
  const ola = $("#ola");
  ola.innerHTML = `<option value="0">Todas las olas</option>` + OLAS.map((o, i) => i ? `<option value="${i}">${o}</option>` : "").join("");
  ola.addEventListener("change", () => { F.ola = +ola.value; refrescar(true); });
  $("#limpiar").addEventListener("click", () => {
    F.q = ""; F.nivel = "todos"; F.estatus = "todos"; F.sectores.clear(); F.ola = 0;
    $("#buscar").value = ""; $("#ola").value = "0";
    for (const seg of $$(".filtros .seg[data-f]")) $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", x.dataset.val === "todos"));
    $$("#sectores button").forEach((x) => x.setAttribute("aria-pressed", "false"));
    refrescar(true);
  });
}

// ---------------------------------------------------------------------------------------------
// RLR · el árbol en canvas: los 47,735 puestos sin que la computadora sufra.
// Se dibuja solo lo que cabe en la pantalla y con tres niveles de detalle: puntos de lejos, tarjetas a media distancia,
// tarjetas con texto de cerca. Los hijos colapsados se apilan en columnas; lo generado por plantilla va en lista anidada.
const W = 236, H = 104, SEP_X = 22, SEP_Y = 76, IND = 28, GAP_COL = 16, GAP_FILA = 20, R = 12, CELDA = 1000;
const abiertos = new Set();
function abrirHasta(nivel) { abiertos.clear(); for (const x of PUESTOS) if (x.n < nivel) abiertos.add(x.id); }
function abrirTodo() {
  abiertos.clear(); const pila = [raiz.id];
  while (pila.length) { const id = pila.pop(); const hs = hijos(id); if (!hs.length) continue; abiertos.add(id); for (const h of hs) pila.push(h.id); }
}
abrirHasta(2);
let lienzo, ctx, dpr = 1, zoom, T = d3.zoomIdentity, nodos = [], ligas = [], rejilla = new Map(), ultimaRaiz = null, idAbierto = null, idHover = null, pedido = 0;
const FUENTE_T = "700 13px Inter, system-ui, sans-serif", FUENTE_K = "400 11.5px Inter, system-ui, sans-serif", FUENTE_P = "600 10.5px Inter, system-ui, sans-serif", FUENTE_N = "700 11px Inter, system-ui, sans-serif";

function montarArbol() {
  lienzo = $("#lienzo"); ctx = lienzo.getContext("2d");
  const medidas = () => { dpr = Math.min(2, window.devicePixelRatio || 1); lienzo.width = Math.round(lienzo.clientWidth * dpr); lienzo.height = Math.round(lienzo.clientHeight * dpr); dibujar(); };
  new ResizeObserver(() => { if ($("#v-arbol").classList.contains("activa")) { medidas(); ajustar(false); } }).observe($("#v-arbol"));
  medidas();
  zoom = d3.zoom().scaleExtent([0.0004, 3]).on("zoom", (e) => { T = e.transform; dibujar(); });
  d3.select(lienzo).call(zoom).on("dblclick.zoom", null);
  lienzo.addEventListener("click", (e) => {
    const h = enPunto(e); if (!h) return;
    if (h.toggle) { abiertos.has(h.n.p.id) ? cerrarRama(h.n.p.id) : abiertos.add(h.n.p.id); pintarArbol(h.n.p.id); }
    else abrir(h.n.p.id);
  });
  lienzo.addEventListener("mousemove", (e) => {
    const h = enPunto(e), id = h ? h.n.p.id : null;
    lienzo.style.cursor = h ? "pointer" : "";
    if (id !== idHover) { idHover = id; dibujar(); }
  });
  lienzo.addEventListener("mouseleave", () => { if (idHover) { idHover = null; dibujar(); } });
  $("#ajustar").addEventListener("click", () => ajustar(true));
  const hasta = $("#hasta");
  hasta.innerHTML = [1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === 2 ? "selected" : ""}>${n} · ${NIVELES[n]}</option>`).join("") + `<option value="9">Todos los puestos</option>`;
  hasta.addEventListener("change", () => { if (hasta.value === "9") return desplegarTodo(); abrirHasta(+hasta.value); pintarArbol(); ajustar(true); });
  $("#todos").addEventListener("click", desplegarTodo);
  $("#colapsar").addEventListener("click", () => { abrirHasta(1); hasta.value = "1"; pintarArbol(); ajustar(true); });
  $("#gigante").addEventListener("click", () => {
    document.body.classList.toggle("gigante");
    if (document.body.classList.contains("gigante")) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.();
    setTimeout(() => { medidas(); ajustar(true); }, 150);
  });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) document.body.classList.remove("gigante"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (document.body.classList.contains("gigante")) document.body.classList.remove("gigante"); cerrarFicha(); } });
  $("#leyenda").innerHTML = Object.entries(ESTATUS).map(([k, e]) => `<div><i style="background:${e.c}"></i>${e.n}</div>`).join("") + `<div class="sep"></div>` +
    Object.values(SECTORES).map((s) => `<div><i class="sq" style="background:${s.c}"></i>${s.n} · ${esc(s.lado)}</div>`).join("") +
    `<div class="sep"></div><div><i style="background:transparent;border:1px dashed #9aa1ad;border-radius:0;width:14px;height:0"></i>Línea punteada: vigila o confirma, no manda</div>`;
  if (document.fonts?.ready) document.fonts.ready.then(() => { cacheLineas.clear(); dibujar(); });
}
async function desplegarTodo() {
  const capa = $("#capa"); capa.hidden = false; capa.querySelector("b").textContent = fmt(TOTAL);
  await new Promise((r) => setTimeout(r, 60));
  abrirTodo(); $("#hasta").value = "9"; pintarArbol();
  capa.hidden = true; ajustar(true, 1600);
}
function cerrarRama(id) { abiertos.delete(id); for (const h of hijos(id)) if (abiertos.has(h.id)) cerrarRama(h.id); }
function jerarquia() {
  const mk = (x) => { const hs = hijos(x.id); return { p: x, nh: hs.length, children: abiertos.has(x.id) && hs.length ? hs.map(mk) : null }; };
  return mk(raiz);
}
// Acomodo: hoja · lista (hijos colapsados en columnas) · anidada (plantilla, en vertical con sangría) · horizontal (desplegados lado a lado)
const columnas = (k) => (k <= 8 ? 1 : Math.min(10, Math.ceil(Math.sqrt(k / 2))));
function medir(n) {
  const hs = n.children;
  if (!hs || !hs.length) { n.w = W; n.h = H; n.modo = "hoja"; return n; }
  if (!hs.some((c) => c.children && c.children.length)) {
    const k = hs.length, cols = columnas(k);
    n.modo = "lista"; n.cols = cols; n.filas = Math.ceil(k / cols);
    n.w = Math.max(W, IND + cols * W + (cols - 1) * GAP_COL); n.h = H + SEP_Y / 2 + n.filas * (H + GAP_FILA);
    return n;
  }
  if (hs.some((c) => c.p.generado)) {
    // Lista anidada: en vertical con sangría; si son muchos, en columnas para que no salga una aguja de kilómetros
    n.modo = "anidada"; const cols = columnas(hs.length), filas = Math.ceil(hs.length / cols); let colW = W;
    for (const c of hs) { medir(c); colW = Math.max(colW, c.w); }
    n.cols = cols; n.filas = filas; n.colW = colW; n.altos = [];
    for (let f = 0; f < filas; f++) { let m = 0; for (let c = 0; c < cols; c++) { const h = hs[f * cols + c]; if (h) m = Math.max(m, h.h); } n.altos.push(m); }
    n.w = Math.max(W, IND + cols * colW + (cols - 1) * GAP_COL); n.h = H + SEP_Y / 2 + n.altos.reduce((a, b) => a + b + GAP_FILA, 0) - GAP_FILA; return n;
  }
  n.modo = "horizontal"; let w = 0, hmax = 0;
  for (const c of hs) { medir(c); w += c.w; hmax = Math.max(hmax, c.h); }
  w += (hs.length - 1) * SEP_X; n.w = Math.max(W, w); n.h = H + SEP_Y + hmax; return n;
}
function colocar(n, x0, y) {
  n.y = y; n.x0 = x0;
  if (n.modo === "anidada") {
    n.x = x0 + W / 2; let cy = y + H + SEP_Y / 2;
    n.children.forEach((c, i) => { const col = i % n.cols, fila = Math.floor(i / n.cols); c.col = col; if (col === 0 && fila > 0) cy += n.altos[fila - 1] + GAP_FILA; colocar(c, x0 + IND + col * (n.colW + GAP_COL), cy); });
    return;
  }
  if (n.modo === "lista") {
    const bloque = IND + n.cols * W + (n.cols - 1) * GAP_COL, left = n.p.generado ? x0 : x0 + (n.w - bloque) / 2;
    n.x = n.p.generado ? x0 + W / 2 : x0 + n.w / 2; n.left = left;
    n.children.forEach((c, i) => { const col = Math.floor(i / n.filas), fila = i % n.filas; c.col = col; c.x = left + IND + col * (W + GAP_COL) + W / 2; c.y = y + H + SEP_Y / 2 + fila * (H + GAP_FILA); c.w = W; c.h = H; c.modo = "hoja"; c.x0 = c.x - W / 2; });
    return;
  }
  if (n.modo === "hoja") { n.x = x0 + W / 2; return; }
  n.x = x0 + n.w / 2;
  let cx = x0 + (n.w - (n.children.reduce((s, c) => s + c.w, 0) + (n.children.length - 1) * SEP_X)) / 2;
  for (const c of n.children) { colocar(c, cx, y + H + SEP_Y); cx += c.w + SEP_X; }
}
function aplanar(n, out = []) { out.push(n); if (n.children) for (const c of n.children) aplanar(c, out); return out; }
// Ligas: curvas entre niveles horizontales; troncos con codos para listas y anidadas
function ligasDe(n, out = []) {
  if (!n.children) return out;
  if (n.modo === "lista") {
    const yb = n.y + H + SEP_Y / 4, tx = (col) => n.left + col * (W + GAP_COL) + IND / 2;
    out.push({ pts: [[n.x, n.y + H], [n.x, yb]], a: n.p, b: n.p });
    out.push({ pts: [[Math.min(n.x, tx(0)), yb], [Math.max(n.x, tx(n.cols - 1)), yb]], a: n.p, b: n.p });
    for (let col = 0; col < n.cols; col++) { const ult = n.children.filter((c) => c.col === col).pop(); if (ult) out.push({ pts: [[tx(col), yb], [tx(col), ult.y + H / 2]], a: n.p, b: n.p }); }
    for (const c of n.children) out.push({ pts: [[tx(c.col), c.y + H / 2], [c.x - W / 2, c.y + H / 2]], pt: c.p.punteada, a: n.p, b: c.p });
  } else if (n.modo === "anidada") {
    const tx = (col) => n.x0 + IND / 2 + col * (n.colW + GAP_COL), yb = n.y + H + SEP_Y / 4;
    if (n.cols > 1) { out.push({ pts: [[tx(0), n.y + H], [tx(0), yb], [tx(n.cols - 1), yb]], a: n.p, b: n.p }); }
    for (let col = 0; col < n.cols; col++) { const ult = n.children.filter((c) => c.col === col).pop(); if (ult) out.push({ pts: [[tx(col), col === 0 && n.cols === 1 ? n.y + H : yb], [tx(col), ult.y + H / 2]], a: n.p, b: n.p }); }
    for (const c of n.children) { out.push({ pts: [[tx(c.col), c.y + H / 2], [c.x - W / 2, c.y + H / 2]], a: n.p, b: c.p }); ligasDe(c, out); }
  } else {
    for (const c of n.children) { out.push({ curva: [n.x, n.y + H, c.x, c.y], pt: c.p.punteada, a: n.p, b: c.p }); ligasDe(c, out); }
  }
  return out;
}
function pintarArbol(centrarEn) {
  if (!ctx) return;
  const root = medir(jerarquia()); colocar(root, 0, 0); ultimaRaiz = root;
  nodos = aplanar(root); ligas = ligasDe(root);
  rejilla = new Map();
  for (const n of nodos) {
    const cx0 = Math.floor((n.x - W / 2) / CELDA), cx1 = Math.floor((n.x + W / 2) / CELDA), cy0 = Math.floor(n.y / CELDA), cy1 = Math.floor((n.y + H + R) / CELDA);
    for (let i = cx0; i <= cx1; i++) for (let j = cy0; j <= cy1; j++) { const k = i + "," + j; let c = rejilla.get(k); if (!c) rejilla.set(k, (c = [])); c.push(n); }
  }
  $("#cuenta").textContent = `${fmt(nodos.length)} a la vista`;
  dibujar();
  if (centrarEn) { const n = nodos.find((d) => d.p.id === centrarEn); if (n) ajustarA(n); }
}
function enPunto(e) {
  const [mx, my] = d3.pointer(e, lienzo), wx = (mx - T.x) / T.k, wy = (my - T.y) / T.k;
  const celda = rejilla.get(Math.floor(wx / CELDA) + "," + Math.floor(wy / CELDA)); if (!celda) return null;
  const r = Math.max(R, 6 / T.k);
  for (const n of celda) {
    if (n.nh && (wx - n.x) ** 2 + (wy - (n.y + H)) ** 2 <= r * r) return { n, toggle: true };
    if (wx >= n.x - W / 2 && wx <= n.x + W / 2 && wy >= n.y && wy <= n.y + H) return { n };
  }
  return null;
}
function dibujar() { if (pedido || !ctx) return; pedido = requestAnimationFrame(() => { pedido = 0; render(); }); }
const cacheLineas = new Map();
function lineas(txt, fuente, maxW, maxL) {
  const llave = fuente + "|" + maxW + "|" + txt; const hecho = cacheLineas.get(llave); if (hecho) return hecho;
  ctx.font = fuente; const out = []; let actual = "";
  for (const w of String(txt).split(" ")) { const prueba = actual ? actual + " " + w : w; if (ctx.measureText(prueba).width <= maxW || !actual) actual = prueba; else { out.push(actual); actual = w; } }
  if (actual) out.push(actual);
  if (out.length > maxL) { out.length = maxL; let u = out[maxL - 1]; while (u.length > 1 && ctx.measureText(u + "…").width > maxW) u = u.slice(0, -1); out[maxL - 1] = u + "…"; }
  cacheLineas.set(llave, out); return out;
}
const imgs = new Map();
function imagen(url) { let i = imgs.get(url); if (!i) { i = new Image(); i.src = url; i.onload = () => dibujar(); imgs.set(url, i); } return i.complete && i.naturalWidth ? i : null; }
function caja(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function render() {
  const k = T.k, ancho = lienzo.clientWidth, alto = lienzo.clientHeight, filtro = filtroActivo();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, ancho, alto);
  ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * T.x, dpr * T.y);
  const vx0 = -T.x / k - W, vy0 = -T.y / k - H - R, vx1 = vx0 + ancho / k + 2 * W, vy1 = vy0 + alto / k + 2 * H;
  const dentro = (x, y) => x >= vx0 && x <= vx1 && y >= vy0 && y <= vy1;
  if (k > 0.02) {
    ctx.lineWidth = Math.max(1.6, 1.1 / k); ctx.lineCap = "round";
    for (const l of ligas) {
      const p = l.pts || [[l.curva[0], l.curva[1]], [l.curva[2], l.curva[3]]];
      if (!dentro(p[0][0], p[0][1]) && !dentro(p[p.length - 1][0], p[p.length - 1][1])) continue;
      const ap = filtro && !pasa(l.a) && !pasa(l.b);
      ctx.globalAlpha = ap ? 0.2 : 1; ctx.strokeStyle = l.pt ? "#6a6e78" : "#3a3f4a"; ctx.setLineDash(l.pt ? [6, 6] : []);
      ctx.beginPath();
      if (l.curva) { const [x1, y1, x2, y2] = l.curva, ym = (y1 + y2) / 2; ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1, ym, x2, ym, x2, y2); }
      else { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); }
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  for (const n of nodos) { if (n.x + W / 2 < vx0 || n.x - W / 2 > vx1 || n.y > vy1 || n.y + H + R < vy0) continue; dibujarNodo(n, k, filtro); }
  ctx.globalAlpha = 1;
}
function dibujarNodo(n, k, filtro) {
  const p = n.p, x = n.x - W / 2, y = n.y, s = SECTORES[p.s], e = estatusDe(p), apag = filtro && !pasa(p), abierta = idAbierto === p.id, hover = idHover === p.id;
  ctx.globalAlpha = apag ? 0.18 : 1;
  if (k < 0.08) {
    // De lejos: un punto por puesto, del color de su sector; más vivo si ya se está contratando o está contratado
    const mw = Math.max(W, 1.4 / k), mh = Math.max(H, 1.4 / k);
    ctx.fillStyle = e === "pausado" ? s.c : ESTATUS[e].c; if (e === "pausado" && !apag) ctx.globalAlpha = 0.55;
    ctx.fillRect(x, y, mw, mh);
    if (abierta || hover) { ctx.globalAlpha = 1; ctx.strokeStyle = "#e6e8ec"; ctx.lineWidth = 2 / k; ctx.strokeRect(x - 2 / k, y - 2 / k, mw + 4 / k, mh + 4 / k); }
    ctx.globalAlpha = 1; return;
  }
  caja(x, y, W, H, 12); ctx.fillStyle = s.c; ctx.fill();
  caja(x + 4, y, W - 4, H, 12); ctx.fillStyle = hover ? "#161920" : "#111318"; ctx.fill();
  caja(x, y, W, H, 12); ctx.lineWidth = abierta || hover || (filtro && !apag) ? 2.5 : 1; ctx.strokeStyle = abierta ? "#e6e8ec" : hover || (filtro && !apag) ? s.c : "#23262e"; ctx.stroke();
  ctx.beginPath(); ctx.arc(x + W - 16, y + 15, 6.5, 0, Math.PI * 2); ctx.fillStyle = ESTATUS[e].c; ctx.fill();
  ctx.beginPath(); ctx.arc(x + W - 16, y + 15, 9.5, 0, Math.PI * 2); ctx.strokeStyle = ESTATUS[e].c; ctx.lineWidth = 1; ctx.globalAlpha *= 0.35; ctx.stroke(); ctx.globalAlpha = apag ? 0.18 : 1;
  if (k >= 0.22) {
    ctx.textBaseline = "top"; ctx.textAlign = "left"; ctx.fillStyle = "#e6e8ec"; ctx.font = FUENTE_T;
    const lt = lineas(p.t, FUENTE_T, W - 40, 2); lt.forEach((l, i) => ctx.fillText(l, x + 12, y + 8 + i * 16));
    let yk = y + 8 + lt.length * 16 + 3; const per = estado[p.id];
    if (e === "contratado" && per?.nombre) {
      const img = per.foto ? imagen(per.foto) : null;
      if (img) { ctx.save(); ctx.beginPath(); ctx.arc(x + 24, yk + 12, 12, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(img, x + 12, yk, 24, 24); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(x + 24, yk + 12, 12, 0, Math.PI * 2); ctx.fillStyle = "#161920"; ctx.fill(); ctx.fillStyle = s.c; ctx.font = FUENTE_N; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(iniciales(per.nombre), x + 24, yk + 12); ctx.textAlign = "left"; ctx.textBaseline = "top"; }
      ctx.fillStyle = "#e6e8ec"; ctx.font = "600 12px Inter, system-ui, sans-serif"; ctx.fillText(lineas(per.nombre, "600 12px Inter, system-ui, sans-serif", W - 60, 1)[0], x + 42, yk + 5);
    } else {
      ctx.fillStyle = "#a9b0bb"; ctx.font = FUENTE_K;
      lineas(p.kpi, FUENTE_K, W - 26, 2).forEach((l, i) => ctx.fillText(l, x + 12, yk + i * 14.5));
    }
    ctx.font = FUENTE_P; ctx.textBaseline = "alphabetic"; ctx.fillStyle = s.c; ctx.fillText(String(p.n), x + 12, y + H - 8);
    ctx.fillStyle = "#8a919c"; ctx.fillText(lineas("· " + NIVELES[p.n], FUENTE_P, W - 120, 1)[0], x + 12 + ctx.measureText(String(p.n)).width + 2, y + H - 8);
    ctx.textAlign = "right"; const t = total(p.id); ctx.fillText(t > 1 ? fmt(t) + " plazas" : "Ola " + p.ola, x + W - 10, y + H - 8); ctx.textAlign = "left";
  }
  if (n.nh) {
    const ab = abiertos.has(p.id);
    ctx.beginPath(); ctx.arc(n.x, y + H, R, 0, Math.PI * 2); ctx.fillStyle = "#161920"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = hover ? "#b08d57" : "#23262e"; ctx.stroke();
    if (k >= 0.2) { ctx.fillStyle = ab ? "#a9b0bb" : "#e6e8ec"; ctx.font = FUENTE_N; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ab ? "−" : String(n.nh), n.x, y + H); ctx.textAlign = "left"; }
  }
  ctx.globalAlpha = 1;
}
function limites(ns) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const n of ns) { if (n.x - W / 2 < x0) x0 = n.x - W / 2; if (n.x + W / 2 > x1) x1 = n.x + W / 2; if (n.y < y0) y0 = n.y; if (n.y + H > y1) y1 = n.y + H; }
  return { x0, x1, y0, y1 };
}
function ajustar(animar, ms = 500) {
  if (!ultimaRaiz || !lienzo) return;
  const ancho = lienzo.clientWidth, alto = lienzo.clientHeight; if (!ancho || !alto) return;
  const b = limites(nodos), bw = b.x1 - b.x0 + 60, bh = b.y1 - b.y0 + 60;
  const k = Math.max(0.0004, Math.min(ancho / bw, alto / bh, 1.1));
  const t = d3.zoomIdentity.translate(ancho / 2 - k * (b.x0 + b.x1) / 2, alto / 2 - k * (b.y0 + b.y1) / 2).scale(k);
  (animar ? d3.select(lienzo).transition().duration(ms).ease(d3.easeCubicInOut) : d3.select(lienzo)).call(zoom.transform, t);
}
function ajustarA(n) {
  const ancho = lienzo.clientWidth, alto = lienzo.clientHeight;
  const k = Math.max(0.6, Math.min(1, T.k));
  const t = d3.zoomIdentity.translate(ancho / 2 - k * n.x, alto * 0.35 - k * (n.y + H / 2)).scale(k);
  d3.select(lienzo).transition().duration(600).ease(d3.easeCubicInOut).call(zoom.transform, t);
}
function verEnArbol(id) {
  for (const a of ruta(id)) if (a.id !== id) abiertos.add(a.id);
  verVista("arbol"); pintarArbol(id);
}
// Con un filtro o una búsqueda, el árbol despliega el camino hasta cada coincidencia (hasta 400)
function desplegarCoincidencias() {
  if (!filtroActivo()) return;
  let n = 0;
  for (const x of universo()) { if (!pasa(x)) continue; if (++n > 400) break; for (const a of ruta(x.id)) if (a.id !== x.id) abiertos.add(a.id); }
}

// ---------------------------------------------------------------------------------------------
// RLR · la lista
function pintarLista() {
  const filas = visibles(), tb = $("#tabla tbody");
  if (!filas.length) { tb.innerHTML = `<tr><td colspan="8" class="vacio">Ningún puesto coincide con los filtros.</td></tr>`; return; }
  tb.innerHTML = filas.slice(0, 1200).map((x, i) => {
    const e = estatusDe(x), p = estado[x.id], s = SECTORES[x.s], padre = x.padre ? porId(x.padre) : null;
    return `<tr data-id="${esc(x.id)}" style="--c:${s.c}">
      <td class="num">${i + 1}</td>
      <td><i class="pt e-${e}" title="${esc(ESTATUS[e].n)}"></i></td>
      <td><div class="t">${esc(x.t)}</div><span class="chip">${esc(s.n)}</span></td>
      <td class="mut">${padre ? esc(padre.t) : "—"}</td>
      <td class="num">${x.n} · ${esc(NIVELES[x.n])}</td>
      <td class="num">${x.ola}</td>
      <td class="kpi">${esc(x.kpi)}</td>
      <td>${p?.nombre ? `<div class="per">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : ""}<span>${esc(p.nombre)}</span></div>` : `<span class="mut">—</span>`}</td></tr>`;
  }).join("") + (filas.length > 1200 ? `<tr><td colspan="8" class="vacio">Se muestran 1,200 de ${fmt(filas.length)}. Afina los filtros.</td></tr>` : "");
}
function descargarCSV() {
  const filas = visibles();
  const campos = ["Importancia", "Id", "Puesto", "Reporta a", "Nivel", "Rango", "Sector", "Lado", "Ola", "KPI principal", "Estatus", "Persona", "Plazas en su línea"];
  const q = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const lineas = [campos.map(q).join(",")].concat(filas.map((x, i) => {
    const padre = x.padre ? porId(x.padre) : null, p = estado[x.id];
    return [i + 1, x.id, x.t, padre ? padre.t : "", x.n, NIVELES[x.n], SECTORES[x.s].n, SECTORES[x.s].lado, x.ola, x.kpi, ESTATUS[estatusDe(x)].n, p?.nombre || "", total(x.id)].map(q).join(",");
  }));
  const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
  const nombre = `Organigrama de Gobierno 2.0 · puestos · ${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}h${p2(d.getMinutes())}.csv`;
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lineas.join("\n")], { type: "text/csv;charset=utf-8" })); a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------------------------------------------------------------------------------------------
// RLR · el tablero
function pintarTablero() {
  const filas = visibles(), cols = $("#columnas"), TOPE = 150;
  cols.innerHTML = Object.entries(ESTATUS).map(([k, e]) => {
    const lista = filas.filter((x) => estatusDe(x) === k);
    return `<div class="col" data-estatus="${k}"><h3><i class="pt e-${k}"></i>${e.n}<small>${fmt(lista.length)}</small></h3>` +
      lista.slice(0, TOPE).map((x) => {
        const p = estado[x.id], s = SECTORES[x.s];
        return `<div class="tarj" data-id="${esc(x.id)}" style="--c:${s.c}" draggable="${yo?.editor ? "true" : "false"}">
          <div class="t">${esc(x.t)}</div>
          ${k === "contratado" && p?.nombre ? `<div class="per">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : ""}<span>${esc(p.nombre)}</span></div>` : `<div class="k">${esc(x.kpi)}</div>`}
          <div class="m"><span>${esc(s.n)} · nivel ${x.n}</span><span>Ola ${x.ola}</span></div></div>`;
      }).join("") + (lista.length > TOPE ? `<div class="mas">y ${fmt(lista.length - TOPE)} más · afina los filtros</div>` : "") + `</div>`;
  }).join("");
}
function montarTablero() {
  const cols = $("#columnas");
  cols.addEventListener("click", (e) => { const t = e.target.closest(".tarj"); if (t) abrir(t.dataset.id); });
  cols.addEventListener("dragstart", (e) => { const t = e.target.closest(".tarj"); if (!t || !yo?.editor) return e.preventDefault(); e.dataTransfer.setData("text/plain", t.dataset.id); e.dataTransfer.effectAllowed = "move"; });
  cols.addEventListener("dragover", (e) => { const c = e.target.closest(".col"); if (c && yo?.editor) { e.preventDefault(); c.classList.add("sobre"); } });
  cols.addEventListener("dragleave", (e) => { const c = e.target.closest(".col"); if (c) c.classList.remove("sobre"); });
  cols.addEventListener("drop", async (e) => {
    const c = e.target.closest(".col"); if (!c) return; e.preventDefault(); c.classList.remove("sobre");
    const id = e.dataTransfer.getData("text/plain"); if (id) await guardar(id, { estatus: c.dataset.estatus });
  });
  $("#tabla tbody").addEventListener("click", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) abrir(tr.dataset.id); });
  $("#csv").addEventListener("click", descargarCSV);
}

// El siguiente puesto que falta, en orden de importancia (respeta sector y ola del filtro)
function faltantes() { return universo().filter((x) => estatusDe(x) !== "contratado" && (!F.sectores.size || F.sectores.has(x.s)) && (!F.ola || x.ola === F.ola)).sort((a, b) => importancia(a) - importancia(b)); }
function siguiente(id) { const f = faltantes(); return f.find((x) => x.id !== id) || null; }
function irSiguiente(id) { const x = siguiente(id); if (!x) return aviso("No falta nadie con estos filtros.", true); if (vistaActiva() === "arbol") verEnArbol(x.id); abrir(x.id); }

// ---------------------------------------------------------------------------------------------
// RLR · la pestaña Reclutar: qué hacer, en qué orden, y los siguientes puestos
function pintarReclutar() {
  const f = faltantes(), abiertas = f.filter((x) => estatusDe(x) === "contratacion"), porAbrir = f.filter((x) => estatusDe(x) === "pausado").slice(0, 11);
  const olas = OLAS.slice(1).map((o, i) => {
    if (i === 5) { const gen = Object.entries(estado).filter(([id]) => id.includes("~")); return { o, t: TOTAL - PUESTOS.length, c: gen.filter(([, v]) => v.estatus === "contratado").length, e: gen.filter(([, v]) => v.estatus === "contratacion").length }; }
    const lista = PUESTOS.filter((x) => x.ola === i + 1); return { o, t: lista.length, c: lista.filter((x) => estatusDe(x) === "contratado").length, e: lista.filter((x) => estatusDe(x) === "contratacion").length };
  });
  const tarj = (x, accion) => { const s = SECTORES[x.s], e = estatusDe(x); return `<div class="tarj" data-id="${esc(x.id)}" style="--c:${s.c}"><div class="t"><i class="pt e-${e}"></i> ${esc(x.t)}</div><div class="k">${esc(x.kpi)}</div><div class="m"><span>${esc(s.n)} · nivel ${x.n} · ${esc(OLAS[x.ola] || "Ola " + x.ola)}</span></div><div class="acc">${accion}</div></div>`; };
  $("#reclutar").innerHTML = `
    <div class="pasos">
      <div class="paso"><span class="num">1</span><b>🔎 Encuentra tu siguiente puesto</b><p>La lista de abajo va en orden de importancia: primero la ola, luego el rango, luego el orden del organigrama. Nadie elige por simpatía qué puesto llenar.</p></div>
      <div class="paso"><span class="num">2</span><b>📣 Abre la vacante</b><p>Entra a la ficha y márcala «En contratación». Esa es la señal para publicarla en la Bolsa Nacional de Puestos con su KPI, su sueldo y su prueba.</p></div>
      <div class="paso"><span class="num">3</span><b>🧪 Corre el proceso</b><p>Prueba de trabajo real y ciega, lectura de personas, verificación de cada línea del currículum, declaración de conflictos. Cero por amigos: entra el mejor del proceso.</p></div>
      <div class="paso"><span class="num">4</span><b>✅ Cierra con expediente</b><p>Nombre, foto, currículum y por qué esta persona. Márcalo «Contratado». Cualquiera podrá ver por qué se contrató.</p></div>
    </div>
    <div class="olas">${olas.map((o, i) => `<div class="ola-fila"><span class="ola-n">${esc(o.o)}</span><div class="barra"><i style="width:${o.t ? (o.c / o.t) * 100 : 0}%"></i><i class="ec" style="width:${o.t ? (o.e / o.t) * 100 : 0}%"></i></div><span class="ola-c">${o.c} de ${fmt(o.t)} contratados${o.e ? ` · ${o.e} en contratación` : ""}</span></div>`).join("")}</div>
    <div class="dos">
      <section><h2>📣 Vacantes abiertas <small>${fmt(abiertas.length)}</small></h2><p class="sub">Ya están en contratación: toca una para cerrar el proceso con nombre, foto, currículum y porqué.</p>${abiertas.length ? abiertas.slice(0, 33).map((x) => tarj(x, `<button type="button" class="boton sec" data-ir="${esc(x.id)}">🗂 Abrir ficha</button>`)).join("") : `<p class="vacio">Ninguna vacante abierta con estos filtros.</p>`}</section>
      <section><h2>⏳ Siguientes por abrir <small>${fmt(f.filter((x) => estatusDe(x) === "pausado").length)}</small></h2><p class="sub">Los once que siguen, en orden. Abre la vacante desde aquí o entra a la ficha.</p>${porAbrir.length ? porAbrir.map((x) => tarj(x, `<button type="button" class="boton" data-vacante="${esc(x.id)}" ${yo ? "" : 'disabled title="Entra con tu cuenta para abrir vacantes"'}>📣 Abrir vacante</button><button type="button" class="boton sec" data-ir="${esc(x.id)}">🗂 Abrir ficha</button>`)).join("") : `<p class="vacio">No queda nadie por abrir con estos filtros.</p>`}</section>
    </div>`;
}
function montarReclutar() {
  $("#reclutar").addEventListener("click", async (e) => {
    const v = e.target.closest("[data-vacante]"); if (v) { if (!yo) return; await guardar(v.dataset.vacante, { estatus: "contratacion" }); return pintarReclutar(); }
    const ir = e.target.closest("[data-ir]"); if (ir) return abrir(ir.dataset.ir);
    const t = e.target.closest(".tarj"); if (t) abrir(t.dataset.id);
  });
}

// ---------------------------------------------------------------------------------------------
// RLR · la ficha del puesto
async function guardar(id, cambios) {
  if (!yo?.editor) return aviso("Entra con tu cuenta para editar.", true);
  try {
    const r = await fetch("/api/puesto/" + encodeURIComponent(id), { method: "PUT", headers: cab({ "content-type": "application/json" }), body: JSON.stringify(cambios) });
    if (!r.ok) throw new Error(await r.text());
    estado[id] = await r.json();
    refrescar(false); if (idAbierto === id) pintarFicha();
    aviso(cambios.estatus === "contratacion" ? "Vacante abierta." : cambios.estatus === "contratado" ? "Contratado. Sigue con el que falta." : "Guardado.");
  } catch (e) { aviso("No se pudo guardar: " + e.message, true); }
}
async function subir(id, tipo, archivo) {
  if (!archivo) return;
  if (!yo?.editor) return aviso("Entra con tu cuenta para subir archivos.", true);
  const tope = tipo === "foto" ? 4 : 12;
  if (archivo.size > tope * 1024 * 1024) return aviso(`El archivo pasa de ${tope} MB.`, true);
  aviso("Subiendo…");
  try {
    const r = await fetch(`/api/puesto/${encodeURIComponent(id)}/archivo?tipo=${tipo}&nombre=${encodeURIComponent(archivo.name)}`, { method: "POST", headers: cab({ "content-type": archivo.type || "application/octet-stream" }), body: archivo });
    if (!r.ok) throw new Error(await r.text());
    estado[id] = await r.json();
    refrescar(false); if (idAbierto === id) pintarFicha();
    aviso(tipo === "foto" ? "Foto guardada." : "Currículum guardado.");
  } catch (e) { aviso("No se pudo subir: " + e.message, true); }
}
let avisoT = null;
function aviso(texto, error) {
  const el = $("#ficha-aviso") || $("#aviso-global"); if (!el) return;
  el.textContent = texto; el.className = error ? "err" : "ok"; clearTimeout(avisoT); avisoT = setTimeout(() => { el.textContent = ""; }, 4000);
}
function abrir(id) {
  const x = porId(id); if (!x) return;
  idAbierto = id; $("#ficha").hidden = false; pintarFicha();
  history.replaceState(null, "", "#p=" + encodeURIComponent(id));
  if ($("#v-arbol").classList.contains("activa")) pintarArbol();
}
function cerrarFicha() { if (!idAbierto) return; idAbierto = null; $("#ficha").hidden = true; history.replaceState(null, "", location.pathname); if ($("#v-arbol").classList.contains("activa")) pintarArbol(); }
async function pintarFicha() {
  const x = porId(idAbierto); if (!x) return;
  const e = estatusDe(x), p = estado[x.id] || {}, s = SECTORES[x.s], hs = hijos(x.id), editor = !!yo?.editor;
  const padre = x.padre ? porId(x.padre) : null;
  $("#ficha").style.setProperty("--c", s.c);
  $("#ficha-c").innerHTML = `
    <div class="ruta">${ruta(x.id).slice(0, -1).map((a) => `<button type="button" data-ir="${esc(a.id)}">${esc(corto(a.t))}</button><span>›</span>`).join("")}</div>
    <h2>${esc(x.t)}</h2>
    <div class="etiquetas"><span class="sec">${esc(s.n)} · ${esc(s.lado)}</span><span>Nivel ${x.n} · ${esc(NIVELES[x.n])}</span><span>${esc(OLAS[x.ola] || "Ola " + x.ola)}</span>${total(x.id) > 1 ? `<span>${fmt(total(x.id))} plazas en su línea</span>` : ""}${x.punteada ? `<span>Línea punteada: ${esc(x.punteada)}</span>` : ""}</div>
    <div class="bloque paso-sig e-${e}"><span class="eti">Siguiente paso</span>${
      e === "pausado" ? `<p>El proceso no se ha abierto. Al abrir la vacante se publica en la Bolsa Nacional de Puestos con su KPI.</p><div class="acciones"><button type="button" class="boton" data-estatus="contratacion" ${editor ? "" : "disabled"}>📣 Abrir vacante</button></div>`
      : e === "contratacion" ? `<p>La vacante está abierta. Corre el proceso (prueba ciega, lectura, verificación) y, con la persona elegida, captura nombre, foto, currículum y el porqué; luego márcala contratada.</p><div class="acciones"><button type="button" class="boton" data-estatus="contratado" ${editor ? "" : "disabled"}>✅ Marcar contratado</button><button type="button" class="boton sec" data-estatus="pausado" ${editor ? "" : "disabled"}>⏸ Pausar</button></div>`
      : `<p>Puesto cubierto${p.nombre ? ` por <b>${esc(p.nombre)}</b>` : ""}. Sigue con el que falta.</p><div class="acciones"><button type="button" class="boton" id="f-sig">➡ Siguiente puesto por reclutar</button></div>`}</div>
    <div class="bloque"><span class="eti">KPI principal</span><div class="kpi-grande">${esc(x.kpi)}</div></div>
    ${x.nota ? `<div class="bloque"><span class="eti">Por qué existe este puesto</span><div class="nota">${esc(x.nota)}</div></div>` : ""}
    <div class="bloque"><span class="eti">Estatus</span>
      <div class="estatus">${Object.entries(ESTATUS).map(([k, v]) => `<button type="button" data-estatus="${k}" aria-pressed="${k === e}" style="--e:${v.c}" ${editor ? "" : "disabled"} title="${esc(v.d)}"><i class="pt e-${k}"></i>${v.n}</button>`).join("")}</div>
      ${editor ? "" : `<p class="aviso" style="margin:10px 0 0">${yo ? "Tu cuenta no tiene acceso de edición: puedes ver todo, no editar." : "Para editar el estatus o la persona, entra con tu cuenta (arriba a la derecha). Cualquiera que entre puede editar; cada cambio queda en la bitácora con su correo."}</p>`}
    </div>
    <div class="bloque"><span class="eti">Quién ocupa el puesto</span>
      <div class="persona-cab">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : `<span class="ini">${p.nombre ? esc(iniciales(p.nombre)) : "?"}</span>`}<div>${p.nombre ? `<div class="nom">${esc(p.nombre)}</div>` : `<div class="sin">Nadie todavía.</div>`}${p.actualizado ? `<div class="sin">Actualizado ${new Date(p.actualizado).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}${p.por ? " · " + esc(p.por) : ""}</div>` : ""}</div></div>
      <label class="campo">Nombre completo<input type="text" id="f-nombre" value="${esc(p.nombre || "")}" ${editor ? "" : "disabled"} placeholder="Como aparece en su expediente"></label>
      <label class="campo">Por qué se contrató a esta persona (el expediente, en una o dos frases)<textarea id="f-porque" ${editor ? "" : "disabled"} placeholder="Puntaje en la prueba de trabajo, lectura de personas, trayectoria verificada…">${esc(p.porque || "")}</textarea></label>
      <div class="archivos">
        ${editor ? `<label>📷 Subir foto<input type="file" id="f-foto" accept="image/jpeg,image/png,image/webp"></label><label>📄 Subir currículum (PDF)<input type="file" id="f-cv" accept="application/pdf"></label>` : ""}
        ${p.cv ? `<button type="button" id="f-vercv">👁 Ver currículum aquí</button><a href="${esc(p.cv)}${pase() ? "?pase=" + encodeURIComponent(pase()) : ""}" download>⬇ Descargar currículum (PDF)</a>` : `<span class="mut" style="font-size:12.5px;align-self:center">Sin currículum${yo ? "" : " · se ve con sesión"}</span>`}
      </div>
      <div id="f-cvmarco"></div>
      <div class="acciones">${editor ? `<button type="button" class="boton" id="f-guardar">💾 Guardar persona</button>` : ""}<span id="ficha-aviso"></span></div>
    </div>
    ${hs.length ? `<div class="bloque"><span class="eti">Dirige a ${hs.length}</span><div class="dirige">${hs.map((h) => `<button type="button" data-ir="${esc(h.id)}"><i class="pt e-${estatusDe(h)}"></i><span style="flex:1">${esc(h.t)}</span><small>${total(h.id) > 1 ? fmt(total(h.id)) : ""}</small></button>`).join("")}</div></div>` : ""}
    ${padre ? `<div class="bloque"><span class="eti">Reporta a</span><div class="dirige"><button type="button" data-ir="${esc(padre.id)}"><i class="pt e-${estatusDe(padre)}"></i><span style="flex:1">${esc(padre.t)}</span></button></div></div>` : ""}
    <div class="bloque"><span class="eti">Bitácora</span><div class="bitacora" id="f-bitacora">Cargando…</div></div>
    <div class="acciones"><button type="button" class="boton sec" id="f-arbol">🌳 Ver en el árbol</button><button type="button" class="boton sec" id="f-liga">🔗 Copiar liga</button><button type="button" class="boton sec" id="f-sig2">➡ Siguiente puesto</button></div>`;
  const c = $("#ficha-c");
  c.addEventListener("click", (ev) => {
    const ir = ev.target.closest("[data-ir]"); if (ir) return abrir(ir.dataset.ir);
    const be = ev.target.closest("[data-estatus]");
    if (be && editor) {
      const cambios = { estatus: be.dataset.estatus }, nombre = $("#f-nombre").value.trim(), porque = $("#f-porque").value.trim();
      if (nombre !== (p.nombre || "")) cambios.nombre = nombre; if (porque !== (p.porque || "")) cambios.porque = porque;
      if (be.dataset.estatus === "contratado" && !nombre) { aviso("Pon primero el nombre de la persona contratada.", true); $("#f-nombre").focus(); return; }
      return guardar(x.id, cambios);
    }
    if (ev.target.closest("#f-sig, #f-sig2")) return irSiguiente(x.id);
  });
  $("#f-arbol", c).addEventListener("click", () => verEnArbol(x.id));
  $("#f-liga", c).addEventListener("click", async () => { try { await navigator.clipboard.writeText(location.origin + "/#p=" + encodeURIComponent(x.id)); aviso("Liga copiada."); } catch { aviso("No se pudo copiar.", true); } });
  $("#f-guardar", c)?.addEventListener("click", () => guardar(x.id, { nombre: $("#f-nombre").value.trim(), porque: $("#f-porque").value.trim() }));
  $("#f-foto", c)?.addEventListener("change", (ev) => subir(x.id, "foto", ev.target.files[0]));
  $("#f-cv", c)?.addEventListener("change", (ev) => subir(x.id, "cv", ev.target.files[0]));
  $("#f-vercv", c)?.addEventListener("click", () => { const m = $("#f-cvmarco"); m.innerHTML = m.innerHTML ? "" : `<iframe class="cv" src="${esc(p.cv)}${pase() ? "?pase=" + encodeURIComponent(pase()) : ""}" title="Currículum"></iframe>`; });
  try {
    const r = await fetch("/api/bitacora/" + encodeURIComponent(x.id)); const b = r.ok ? await r.json() : [];
    $("#f-bitacora").innerHTML = b.length ? b.map((m) => `<div>${new Date(m.cuando).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })} · <b>${esc(m.campo)}</b>: ${esc(m.antes || "—")} → ${esc(m.despues || "—")}${m.por ? ` · ${esc(m.por)}` : ""}</div>`).join("") : "Sin cambios registrados.";
  } catch { $("#f-bitacora").textContent = "Sin cambios registrados."; }
}
const corto = (t) => t.replace(/ · .*$/, "").replace(/ \(.*$/, "");

// ---------------------------------------------------------------------------------------------
// RLR · documentos
async function pintarDoc(nombre) {
  const art = $("#articulo"), ind = $("#indice");
  art.innerHTML = `<p class="mut">Cargando…</p>`;
  try {
    const md = await (await fetch("/" + nombre)).text();
    if (!window.marked) await new Promise((r) => setTimeout(r, 300));
    art.innerHTML = marked.parse(md);
    const hs = $$("h2", art); hs.forEach((h, i) => (h.id = "s" + i));
    ind.innerHTML = hs.map((h) => `<a href="#${h.id}">${esc(h.textContent)}</a>`).join("");
  } catch { art.innerHTML = `<p class="mut">No se pudo cargar el documento.</p>`; }
}

// ---------------------------------------------------------------------------------------------
// RLR · vistas, texto, arranque
function verVista(v) {
  $$(".pestanas button").forEach((b) => b.setAttribute("aria-selected", b.dataset.v === v));
  $$(".vista").forEach((s) => s.classList.toggle("activa", s.id === "v-" + v));
  $("#filtros").hidden = v === "logica";
  if (v === "arbol") { pintarArbol(); setTimeout(() => ajustar(false), 30); }
  if (v === "lista") pintarLista();
  if (v === "tablero") pintarTablero();
  if (v === "reclutar") pintarReclutar();
  if (v === "logica" && !$("#articulo").dataset.listo) { $("#articulo").dataset.listo = "1"; pintarDoc("LOGICA.md"); }
}
function vistaActiva() { return $(".vista.activa")?.id.slice(2) || "arbol"; }
function refrescar(porFiltro) {
  pintarResumen();
  if (porFiltro) desplegarCoincidencias();
  const v = vistaActiva();
  if (v === "arbol") {
    const primero = porFiltro && filtroActivo() ? visibles()[0] : null;
    pintarArbol(primero ? primero.id : undefined); if (porFiltro && !primero) ajustar(true);
  }
  if (v === "lista") pintarLista();
  if (v === "tablero") pintarTablero();
  if (v === "reclutar") pintarReclutar();
}
function montarTexto() {
  const pasos = [90, 100, 112, 125, 145];
  let i = Math.max(0, pasos.indexOf(+localStorage.getItem("org_texto") || 100));
  const aplicar = () => { document.documentElement.style.setProperty("--texto", pasos[i] + "%"); try { localStorage.setItem("org_texto", pasos[i]); } catch {} };
  $("#a-menos").addEventListener("click", () => { i = Math.max(0, i - 1); aplicar(); });
  $("#a-mas").addEventListener("click", () => { i = Math.min(pasos.length - 1, i + 1); aplicar(); });
  aplicar();
}
async function arrancar() {
  montarFiltros(); montarArbol(); montarTablero(); montarReclutar(); montarTexto();
  $$(".pestanas button").forEach((b) => b.addEventListener("click", () => verVista(b.dataset.v)));
  $("#docs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", e.currentTarget).forEach((x) => x.setAttribute("aria-pressed", x === b)); pintarDoc(b.dataset.d); });
  $("#ficha-cerrar").addEventListener("click", cerrarFicha);
  await cargarEstado();
  pintarResumen(); pintarArbol(); ajustar(false);
  const sesion = async () => { await quienSoy(); if (idAbierto) pintarFicha(); if (vistaActiva() === "tablero") pintarTablero(); if (vistaActiva() === "reclutar") pintarReclutar(); };
  const engancharLogin = () => { if (window.LoginCT) { LoginCT.al(sesion); return true; } return false; };
  if (!engancharLogin()) { let n = 0; const t = setInterval(() => { if (engancharLogin() || ++n > 40) clearInterval(t); }, 250); }
  const porLiga = () => { const m = location.hash.match(/p=([^&]+)/); if (!m) return; const id = decodeURIComponent(m[1]); if (porId(id) && id !== idAbierto) { verEnArbol(id); abrir(id); } };
  window.addEventListener("hashchange", porLiga); porLiga();
}
arrancar();
// RLR · Ricardo López Reyero · EYE · 181218

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
// RLR · el árbol
const W = 236, H = 104, SEP_X = 22, SEP_Y = 76;
const abiertos = new Set();
function abrirHasta(nivel) { abiertos.clear(); for (const x of PUESTOS) if (x.n < nivel) abiertos.add(x.id); }
abrirHasta(2);
let svg, g, gL, gN, zoom, ultimaRaiz = null, idAbierto = null;
function montarArbol() {
  svg = d3.select("#lienzo"); g = svg.append("g"); gL = g.append("g"); gN = g.append("g");
  zoom = d3.zoom().scaleExtent([0.03, 3]).on("zoom", (e) => g.attr("transform", e.transform));
  svg.call(zoom).on("dblclick.zoom", null);
  svg.node().addEventListener("click", (e) => {
    const t = e.target.closest("[data-accion]"); if (!t) return;
    const id = t.closest("[data-id]")?.dataset.id || t.dataset.id; if (!id) return;
    if (t.dataset.accion === "abrir") abrir(id);
    if (t.dataset.accion === "toggle") { abiertos.has(id) ? cerrarRama(id) : abiertos.add(id); pintarArbol(id); }
  });
  $("#ajustar").addEventListener("click", () => ajustar(true));
  const hasta = $("#hasta");
  hasta.innerHTML = [1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === 2 ? "selected" : ""}>${n} · ${NIVELES[n]}</option>`).join("");
  hasta.addEventListener("change", () => { abrirHasta(+hasta.value); pintarArbol(); ajustar(true); });
  $("#colapsar").addEventListener("click", () => { abrirHasta(1); hasta.value = "1"; pintarArbol(); ajustar(true); });
  $("#gigante").addEventListener("click", () => {
    document.body.classList.toggle("gigante");
    if (document.body.classList.contains("gigante")) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.();
    setTimeout(() => ajustar(true), 120);
  });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) document.body.classList.remove("gigante"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (document.body.classList.contains("gigante")) document.body.classList.remove("gigante"); cerrarFicha(); } });
  $("#leyenda").innerHTML = Object.entries(ESTATUS).map(([k, e]) => `<div><i style="background:${e.c}"></i>${e.n}</div>`).join("") + `<div class="sep"></div>` +
    Object.values(SECTORES).map((s) => `<div><i class="sq" style="background:${s.c}"></i>${s.n} · ${esc(s.lado)}</div>`).join("") +
    `<div class="sep"></div><div><i style="background:transparent;border:1px dashed #9aa1ad;border-radius:0;width:14px;height:0"></i>Línea punteada: vigila o confirma, no manda</div>`;
  new ResizeObserver(() => { if ($("#v-arbol").classList.contains("activa")) ajustar(false); }).observe($("#v-arbol"));
}
function cerrarRama(id) { abiertos.delete(id); for (const h of hijos(id)) if (abiertos.has(h.id)) cerrarRama(h.id); }
function jerarquia() {
  const mk = (x) => ({ p: x, children: abiertos.has(x.id) ? hijos(x.id).map(mk) : null });
  return mk(raiz);
}
// RLR · acomodo compacto: los hijos que no están desplegados se listan en columnas bajo su jefe;
// los desplegados van uno al lado del otro. Así el lienzo crece hacia abajo y no solo a lo ancho.
const IND = 28, GAP_COL = 16, GAP_FILA = 20;
function medir(n) {
  if (!n.children || !n.children.length) { n.w = W; n.h = H; n.modo = "hoja"; return n; }
  if (!n.children.some((c) => c.children && c.children.length)) {
    const k = n.children.length, cols = k <= 8 ? 1 : k <= 16 ? 2 : k <= 24 ? 3 : 4;
    n.modo = "lista"; n.cols = cols; n.filas = Math.ceil(k / cols);
    n.w = Math.max(W, IND + cols * W + (cols - 1) * GAP_COL);
    n.h = H + SEP_Y / 2 + n.filas * (H + GAP_FILA);
    return n;
  }
  n.modo = "horizontal";
  let w = 0; for (const c of n.children) { medir(c); w += c.w; } w += (n.children.length - 1) * SEP_X;
  n.w = Math.max(W, w); n.h = H + SEP_Y + Math.max(...n.children.map((c) => c.h));
  return n;
}
function colocar(n, x0, y) {
  n.x = x0 + n.w / 2; n.y = y;
  if (n.modo === "hoja") return;
  if (n.modo === "lista") {
    const bloque = IND + n.cols * W + (n.cols - 1) * GAP_COL, left = x0 + (n.w - bloque) / 2;
    n.left = left;
    n.children.forEach((c, i) => { const col = Math.floor(i / n.filas), fila = i % n.filas; c.col = col; c.x = left + IND + col * (W + GAP_COL) + W / 2; c.y = y + H + SEP_Y / 2 + fila * (H + GAP_FILA); c.w = W; c.h = H; c.modo = "hoja"; });
    return;
  }
  let cx = x0 + (n.w - (n.children.reduce((s, c) => s + c.w, 0) + (n.children.length - 1) * SEP_X)) / 2;
  for (const c of n.children) { colocar(c, cx, y + H + SEP_Y); cx += c.w + SEP_X; }
}
function aplanar(n, out = []) { out.push(n); if (n.children) for (const c of n.children) aplanar(c, out); return out; }
function ligasDe(n, out = []) {
  if (!n.children) return out;
  const ap = (x) => filtroActivo() && !pasa(x);
  if (n.modo === "lista") {
    const yb = n.y + H + SEP_Y / 4, tx = (col) => n.left + col * (W + GAP_COL) + IND / 2;
    out.push({ k: n.p.id + ":cab", d: `M${n.x},${n.y + H}V${yb}` + (n.cols > 1 ? `M${Math.min(n.x, tx(0))},${yb}H${Math.max(n.x, tx(n.cols - 1))}` : `M${n.x},${yb}H${tx(0)}`), ap: ap(n.p) });
    for (let col = 0; col < n.cols; col++) {
      const ult = n.children.filter((c) => c.col === col).pop(); if (!ult) continue;
      out.push({ k: n.p.id + ":tronco" + col, d: `M${tx(col)},${yb}V${ult.y + H / 2}`, ap: ap(n.p) });
    }
    for (const c of n.children) out.push({ k: c.p.id, d: `M${tx(c.col)},${c.y + H / 2}H${c.x - W / 2}`, pt: c.p.punteada, ap: ap(c.p) && ap(n.p) });
  } else {
    for (const c of n.children) {
      const y0 = n.y + H, ym = (y0 + c.y) / 2;
      out.push({ k: c.p.id, d: `M${n.x},${y0}C${n.x},${ym} ${c.x},${ym} ${c.x},${c.y}`, pt: c.p.punteada, ap: ap(c.p) && ap(n.p) });
      ligasDe(c, out);
    }
  }
  return out;
}
function tarjetaHTML(x) {
  const e = estatusDe(x), p = estado[x.id], s = SECTORES[x.s], t = total(x.id);
  const clases = ["tarjeta", "e-" + e, filtroActivo() ? (pasa(x) ? "coincide" : "apagada") : "", idAbierto === x.id ? "abierta" : ""].filter(Boolean).join(" ");
  const medio = e === "contratado" && p?.nombre
    ? `<div class="persona">${p.foto ? `<img src="${esc(p.foto)}" alt=""/>` : `<span class="ini">${esc(iniciales(p.nombre))}</span>`}<span>${esc(p.nombre)}</span></div>`
    : `<div class="kpi">${esc(x.kpi)}</div>`;
  return `<div xmlns="http://www.w3.org/1999/xhtml" class="${clases}" data-id="${esc(x.id)}" style="--c:${s.c}">` +
    `<span class="punto" data-accion="abrir" title="${esc(ESTATUS[e].n)}"></span>` +
    `<div class="cuerpo" data-accion="abrir" style="display:flex;flex-direction:column;gap:3px;height:100%"><div class="titulo">${esc(x.t)}</div>${medio}` +
    `<div class="pie"><span><b>${x.n}</b> · ${esc(NIVELES[x.n])}</span><span>${t > 1 ? fmt(t) + " plazas" : "Ola " + x.ola}</span></div></div></div>`;
}
const iniciales = (n) => String(n).split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
function pintarArbol(centrarEn) {
  if (!svg) return;
  const root = medir(jerarquia()); colocar(root, 0, 0);
  ultimaRaiz = root;
  const nodos = aplanar(root), ligas = ligasDe(root);
  gL.selectAll("path").data(ligas, (d) => d.k).join("path")
    .attr("class", (d) => "liga" + (d.pt ? " punteada" : "") + (d.ap ? " apagada" : ""))
    .attr("d", (d) => d.d);
  const sel = gN.selectAll("g.nodo").data(nodos, (d) => d.p.id).join((enter) => {
    const gg = enter.append("g").attr("class", "nodo");
    gg.append("foreignObject").attr("width", W).attr("height", H).attr("x", -W / 2).attr("y", 0);
    const tg = gg.append("g").attr("class", "toggle").attr("data-accion", "toggle").attr("transform", `translate(0,${H})`);
    tg.append("circle").attr("r", 12);
    tg.append("text");
    return gg;
  });
  sel.attr("transform", (d) => `translate(${d.x},${d.y})`);
  sel.select("foreignObject").html((d) => tarjetaHTML(d.p));
  sel.select("g.toggle").attr("data-id", (d) => d.p.id).each(function (d) {
    const n = hijos(d.p.id).length, ab = abiertos.has(d.p.id);
    d3.select(this).style("display", n ? null : "none").classed("abierto", ab).select("text").text(ab ? "−" : n);
  });
  if (centrarEn) { const n = nodos.find((d) => d.p.id === centrarEn); if (n) ajustarA(n); }
}
function limites(nodos) {
  const xs = nodos.map((d) => d.x), ys = nodos.map((d) => d.y);
  return { x0: Math.min(...xs) - W / 2, x1: Math.max(...xs) + W / 2, y0: Math.min(...ys), y1: Math.max(...ys) + H };
}
function ajustar(animar) {
  if (!ultimaRaiz) return;
  const el = svg.node(), ancho = el.clientWidth, alto = el.clientHeight; if (!ancho || !alto) return;
  const b = limites(aplanar(ultimaRaiz)), bw = b.x1 - b.x0 + 60, bh = b.y1 - b.y0 + 60;
  const k = Math.min(ancho / bw, alto / bh, 1.1);
  const t = d3.zoomIdentity.translate(ancho / 2 - k * (b.x0 + b.x1) / 2, alto / 2 - k * (b.y0 + b.y1) / 2).scale(k);
  (animar ? svg.transition().duration(500) : svg).call(zoom.transform, t);
}
function ajustarA(n) {
  const el = svg.node(), ancho = el.clientWidth, alto = el.clientHeight;
  const k = Math.max(0.6, Math.min(1, d3.zoomTransform(el).k));
  const t = d3.zoomIdentity.translate(ancho / 2 - k * n.x, alto * 0.35 - k * (n.y + H / 2)).scale(k);
  svg.transition().duration(500).call(zoom.transform, t);
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

// ---------------------------------------------------------------------------------------------
// RLR · la ficha del puesto
async function guardar(id, cambios) {
  if (!yo?.editor) return aviso("Solo quien tiene acceso de reclutador puede editar.", true);
  try {
    const r = await fetch("/api/puesto/" + encodeURIComponent(id), { method: "PUT", headers: cab({ "content-type": "application/json" }), body: JSON.stringify(cambios) });
    if (!r.ok) throw new Error(await r.text());
    estado[id] = await r.json();
    refrescar(false); if (idAbierto === id) pintarFicha();
    aviso("Guardado.");
  } catch (e) { aviso("No se pudo guardar: " + e.message, true); }
}
async function subir(id, tipo, archivo) {
  if (!archivo) return;
  if (!yo?.editor) return aviso("Solo quien tiene acceso de reclutador puede subir archivos.", true);
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
  const el = $("#ficha-aviso"); if (!el) return;
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
    <div class="bloque"><span class="eti">KPI principal</span><div class="kpi-grande">${esc(x.kpi)}</div></div>
    ${x.nota ? `<div class="bloque"><span class="eti">Por qué existe este puesto</span><div class="nota">${esc(x.nota)}</div></div>` : ""}
    <div class="bloque"><span class="eti">Estatus</span>
      <div class="estatus">${Object.entries(ESTATUS).map(([k, v]) => `<button type="button" data-estatus="${k}" aria-pressed="${k === e}" style="--e:${v.c}" ${editor ? "" : "disabled"} title="${esc(v.d)}"><i class="pt e-${k}"></i>${v.n}</button>`).join("")}</div>
      ${editor ? "" : `<p class="aviso" style="margin:10px 0 0">${yo ? "Tu cuenta no tiene acceso de reclutador: puedes ver todo, no editar." : "Para editar el estatus o la persona, entra con tu cuenta (arriba a la derecha)."}</p>`}
    </div>
    <div class="bloque"><span class="eti">Quién ocupa el puesto</span>
      <div class="persona-cab">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : `<span class="ini">${p.nombre ? esc(iniciales(p.nombre)) : "?"}</span>`}<div>${p.nombre ? `<div class="nom">${esc(p.nombre)}</div>` : `<div class="sin">Nadie todavía.</div>`}${p.actualizado ? `<div class="sin">Actualizado ${new Date(p.actualizado).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}${p.por ? " · " + esc(p.por) : ""}</div>` : ""}</div></div>
      <label class="campo">Nombre completo<input type="text" id="f-nombre" value="${esc(p.nombre || "")}" ${editor ? "" : "disabled"} placeholder="Como aparece en su expediente"></label>
      <label class="campo">Por qué se contrató a esta persona (el expediente, en una o dos frases)<textarea id="f-porque" ${editor ? "" : "disabled"} placeholder="Puntaje en la prueba de trabajo, lectura de personas, trayectoria verificada…">${esc(p.porque || "")}</textarea></label>
      <div class="archivos">
        ${editor ? `<label>Subir foto<input type="file" id="f-foto" accept="image/jpeg,image/png,image/webp"></label><label>Subir currículum (PDF)<input type="file" id="f-cv" accept="application/pdf"></label>` : ""}
        ${p.cv ? `<button type="button" id="f-vercv">Ver currículum aquí</button><a href="${esc(p.cv)}${pase() ? "?pase=" + encodeURIComponent(pase()) : ""}" download>Descargar currículum (PDF)</a>` : `<span class="mut" style="font-size:12.5px;align-self:center">Sin currículum${yo ? "" : " · se ve con sesión"}</span>`}
      </div>
      <div id="f-cvmarco"></div>
      <div class="acciones">${editor ? `<button type="button" class="boton" id="f-guardar">Guardar persona</button>` : ""}<span id="ficha-aviso"></span></div>
    </div>
    ${hs.length ? `<div class="bloque"><span class="eti">Dirige a ${hs.length}</span><div class="dirige">${hs.map((h) => `<button type="button" data-ir="${esc(h.id)}"><i class="pt e-${estatusDe(h)}"></i><span style="flex:1">${esc(h.t)}</span><small>${total(h.id) > 1 ? fmt(total(h.id)) : ""}</small></button>`).join("")}</div></div>` : ""}
    ${padre ? `<div class="bloque"><span class="eti">Reporta a</span><div class="dirige"><button type="button" data-ir="${esc(padre.id)}"><i class="pt e-${estatusDe(padre)}"></i><span style="flex:1">${esc(padre.t)}</span></button></div></div>` : ""}
    <div class="bloque"><span class="eti">Bitácora</span><div class="bitacora" id="f-bitacora">Cargando…</div></div>
    <div class="acciones"><button type="button" class="boton sec" id="f-arbol">Ver en el árbol</button><button type="button" class="boton sec" id="f-liga">Copiar liga</button></div>`;
  const c = $("#ficha-c");
  c.addEventListener("click", (ev) => {
    const ir = ev.target.closest("[data-ir]"); if (ir) return abrir(ir.dataset.ir);
    const be = ev.target.closest("[data-estatus]"); if (be && editor) return guardar(x.id, { estatus: be.dataset.estatus });
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
  montarFiltros(); montarArbol(); montarTablero(); montarTexto();
  $$(".pestanas button").forEach((b) => b.addEventListener("click", () => verVista(b.dataset.v)));
  $("#docs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", e.currentTarget).forEach((x) => x.setAttribute("aria-pressed", x === b)); pintarDoc(b.dataset.d); });
  $("#ficha-cerrar").addEventListener("click", cerrarFicha);
  await cargarEstado();
  pintarResumen(); pintarArbol(); ajustar(false);
  const sesion = async () => { await quienSoy(); if (idAbierto) pintarFicha(); if (vistaActiva() === "tablero") pintarTablero(); };
  const engancharLogin = () => { if (window.LoginCT) { LoginCT.al(sesion); return true; } return false; };
  if (!engancharLogin()) { let n = 0; const t = setInterval(() => { if (engancharLogin() || ++n > 40) clearInterval(t); }, 250); }
  const porLiga = () => { const m = location.hash.match(/p=([^&]+)/); if (!m) return; const id = decodeURIComponent(m[1]); if (porId(id) && id !== idAbierto) { verEnArbol(id); abrir(id); } };
  window.addEventListener("hashchange", porLiga); porLiga();
}
arrancar();
// RLR · Ricardo López Reyero · EYE · 181218

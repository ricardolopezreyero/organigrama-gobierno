// RLR · Valida el organigrama antes de publicar: ids únicos, padres que existen, KPI en todos, tramos de control, conteos.
import { PUESTOS, SECTORES, NIVELES, OLAS, porId, hijos, total, raiz } from "./puestos.js";
let errores = 0;
const falla = (m) => { errores++; console.error("✗ " + m); };
const ids = new Set();
for (const x of PUESTOS) {
  if (ids.has(x.id)) falla("id repetido: " + x.id); ids.add(x.id);
  if (!/^[a-z0-9-]+$/.test(x.id)) falla("id con caracteres raros: " + x.id);
  if (x.padre && !porId(x.padre)) falla(`padre inexistente ${x.padre} en ${x.id}`);
  if (!x.t || !x.kpi) falla("sin título o sin KPI: " + x.id);
  if (!SECTORES[x.s]) falla("sector desconocido en " + x.id);
  if (x.n < 0 || x.n > 8) falla("nivel fuera de rango en " + x.id);
}
// Tramos de control: el Presidente dirige a 11; los demás, a 8 o menos (los jefes de manzana a 4 jefes de barrio)
for (const x of PUESTOS) {
  const h = hijos(x.id).filter((y) => !y.punteada).length, tope = x.id === "pres" ? 11 : 8;
  if (h > tope && !x.gen) falla(`${x.id} dirige a ${h} (tope ${tope})`);
}
const mesa = hijos("pres").filter((y) => !y.punteada).length; if (mesa !== 11) falla("La Mesa de 11 no tiene 11: " + mesa);
// Conteos
const porNivel = NIVELES.map(() => 0), porSector = {}, porOla = OLAS.map(() => 0);
for (const x of PUESTOS) { porNivel[x.n]++; porSector[x.s] = (porSector[x.s] || 0) + 1; porOla[x.ola]++; }
console.log(`Puestos nombrados: ${PUESTOS.length} · plazas en total (con plantillas): ${total("pres").toLocaleString("es-MX")}`);
console.log("Por nivel:", NIVELES.map((n, i) => `${i} ${n}: ${porNivel[i]}`).join(" · "));
console.log("Por sector:", Object.entries(porSector).map(([k, v]) => `${SECTORES[k].n} ${v}`).join(" · "));
console.log("Por ola:", porOla.map((v, i) => i ? `${i}: ${v}` : null).filter(Boolean).join(" · "));
console.log("Secretarías (nivel 2 bajo coordinadores):", PUESTOS.filter((x) => x.n === 2 && x.id.startsWith("s-")).length);
console.log("Plazas bajo Talento:", total("tal").toLocaleString("es-MX"), "· bajo la Secretaría Ejecutiva:", total("se").toLocaleString("es-MX"), "· bajo la Cámara:", total("cam").toLocaleString("es-MX"));
if (errores) { console.error(`${errores} error(es)`); process.exit(1); }
console.log("✅ organigrama válido · raíz: " + raiz.t);

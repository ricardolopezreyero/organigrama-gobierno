// RLR · Organigrama de Gobierno 2.0 · el Worker — Ricardo López Reyero
// Sirve la página (assets) y guarda lo que cambia: estatus, persona, porqué (D1) y foto y currículum (R2).
// Todo se puede leer sin entrar; para editar hay que entrar por login.capitaltorreon.com (con EDITORES vacío, cualquiera que entre edita).
import { verificarPase } from "./verificar.js";
const _RLR = "Ricardo López Reyero", _k = "EYE", _rev = 181218;
const ESTATUS = new Set(["pausado", "contratacion", "contratado"]);
const ID_OK = /^[a-z0-9-]+(~[a-z0-9]+)*$/;
const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });
const texto = (t, status = 400) => new Response(t, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

// Quién pide: el pase viene en Authorization: Bearer … o en ?pase=
async function quien(req, env) {
  const url = new URL(req.url);
  const h = req.headers.get("authorization") || "";
  const pase = h.startsWith("Bearer ") ? h.slice(7) : url.searchParams.get("pase") || "";
  if (!pase) return null;
  const q = await verificarPase(pase, url.hostname).catch(() => null) || await verificarPase(pase).catch(() => null);
  if (!q || !q.email) return null;
  const lista = String(env.EDITORES || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const editor = lista.length ? lista.includes(q.email.toLowerCase()) : true;
  return { email: q.email, name: q.name || "", picture: q.picture || "", sub: q.sub, editor };
}
const fila = (r) => r ? { estatus: r.estatus, nombre: r.nombre || "", foto: r.foto || "", cv: r.cv || "", porque: r.porque || "", actualizado: r.actualizado, por: r.por || "" } : null;
async function leer(env, id) { return fila(await env.DB.prepare("SELECT * FROM puestos WHERE id = ?").bind(id).first()); }
async function anotar(env, puesto, campo, antes, despues, por) {
  if ((antes || "") === (despues || "")) return;
  await env.DB.prepare("INSERT INTO bitacora (puesto, campo, antes, despues, por, cuando) VALUES (?, ?, ?, ?, ?, ?)").bind(puesto, campo, antes || null, despues || null, por, Date.now()).run();
}
async function escribir(env, id, cambios, por) {
  const antes = (await leer(env, id)) || { estatus: "pausado", nombre: "", foto: "", cv: "", porque: "" };
  const ahora = { ...antes, ...cambios, actualizado: Date.now(), por };
  await env.DB.prepare(`INSERT INTO puestos (id, estatus, nombre, foto, cv, porque, actualizado, por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET estatus = excluded.estatus, nombre = excluded.nombre, foto = excluded.foto, cv = excluded.cv, porque = excluded.porque, actualizado = excluded.actualizado, por = excluded.por`)
    .bind(id, ahora.estatus, ahora.nombre || null, ahora.foto || null, ahora.cv || null, ahora.porque || null, ahora.actualizado, por).run();
  for (const k of Object.keys(cambios)) await anotar(env, id, k, antes[k], cambios[k], por);
  return fila(await env.DB.prepare("SELECT * FROM puestos WHERE id = ?").bind(id).first());
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    try {
      // RLR · lectura pública
      if (p === "/api/estado" && req.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM puestos").all();
        const out = {}; for (const r of results) out[r.id] = fila(r);
        return json(out, 200, { "cache-control": "no-store" });
      }
      if (p === "/api/quien") { const q = await quien(req, env); return q ? json(q) : json(null, 401); }
      let m = p.match(/^\/api\/bitacora\/([^/]+)$/);
      if (m && req.method === "GET") {
        const id = decodeURIComponent(m[1]); if (!ID_OK.test(id)) return texto("id inválido");
        const { results } = await env.DB.prepare("SELECT campo, antes, despues, por, cuando FROM bitacora WHERE puesto = ? ORDER BY n DESC LIMIT 20").bind(id).all();
        return json(results);
      }
      // RLR · archivos: las fotos son públicas; el currículum solo con sesión de la casa
      if (p.startsWith("/archivo/")) {
        const llave = decodeURIComponent(p.slice(9));
        if (llave.includes("/cv-") && !(await quien(req, env))) return texto("Entra con tu cuenta para ver el currículum.", 401);
        const obj = await env.ARCHIVOS.get(llave); if (!obj) return texto("No existe.", 404);
        const h = new Headers(); obj.writeHttpMetadata(h); h.set("etag", obj.httpEtag); h.set("cache-control", llave.includes("/cv-") ? "private, max-age=0" : "public, max-age=31536000, immutable");
        if (llave.includes("/cv-")) h.set("content-disposition", `inline; filename="${llave.split("/").pop()}"`);
        return new Response(obj.body, { headers: h });
      }
      // RLR · escritura: solo editores
      m = p.match(/^\/api\/puesto\/([^/]+)(\/archivo)?$/);
      if (m && (req.method === "PUT" || req.method === "POST")) {
        const id = decodeURIComponent(m[1]); if (!ID_OK.test(id) || id.length > 200) return texto("id inválido");
        const q = await quien(req, env); if (!q) return texto("Entra con tu cuenta.", 401); if (!q.editor) return texto("Tu cuenta no tiene acceso de reclutador.", 403);
        if (!m[2]) {
          const b = await req.json().catch(() => null); if (!b || typeof b !== "object") return texto("cuerpo inválido");
          const cambios = {};
          if ("estatus" in b) { if (!ESTATUS.has(b.estatus)) return texto("estatus inválido"); cambios.estatus = b.estatus; }
          if ("nombre" in b) cambios.nombre = String(b.nombre || "").slice(0, 160).trim();
          if ("porque" in b) cambios.porque = String(b.porque || "").slice(0, 2000).trim();
          if (!Object.keys(cambios).length) return texto("nada que cambiar");
          return json(await escribir(env, id, cambios, q.email));
        }
        // archivo: foto (jpeg/png/webp, 4 MB) o cv (pdf, 12 MB)
        const tipo = url.searchParams.get("tipo"), ct = (req.headers.get("content-type") || "").split(";")[0].trim();
        const permitidos = tipo === "foto" ? { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } : tipo === "cv" ? { "application/pdf": "pdf" } : null;
        if (!permitidos) return texto("tipo inválido"); if (!permitidos[ct]) return texto("formato no permitido: " + ct);
        const cuerpo = await req.arrayBuffer(); const tope = (tipo === "foto" ? 4 : 12) * 1024 * 1024;
        if (!cuerpo.byteLength) return texto("archivo vacío"); if (cuerpo.byteLength > tope) return texto("archivo demasiado grande", 413);
        const llave = `puestos/${id}/${tipo}-${Date.now()}.${permitidos[ct]}`;
        await env.ARCHIVOS.put(llave, cuerpo, { httpMetadata: { contentType: ct }, customMetadata: { por: q.email, nombre: (url.searchParams.get("nombre") || "").slice(0, 120) } });
        return json(await escribir(env, id, { [tipo]: "/archivo/" + llave }, q.email));
      }
      if (p.startsWith("/api/")) return texto("No existe.", 404);
      return env.ASSETS.fetch(req);
    } catch (e) {
      return texto("Error del servidor: " + (e && e.message ? e.message : String(e)), 500);
    }
  },
};
// RLR · Ricardo López Reyero · EYE · 181218

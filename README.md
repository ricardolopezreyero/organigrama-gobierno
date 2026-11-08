# Organigrama de Gobierno 2.0

**Ver en vivo: [organigrama.capitaltorreon.com](https://organigrama.capitaltorreon.com)** · el árbol completo con zoom, la lista en orden de importancia, el tablero de contratación y la lógica.

<!-- RLR · Ricardo López Reyero · EYE · 181218 -->

El organigrama del Gobierno 2.0 de México: **566 puestos nombrados con un KPI cada uno**, del **Director de México (Presidente)** al último analista, en un lienzo gigante. Quién dirige a quién, qué número mueve cada puesto, en qué estatus está (pausado, en contratación, contratado) y quién lo ocupa, con su foto, su currículum y el porqué. Es la tercera versión: cruza el *Organigrama Gobierno 2.0 v3* (555 puestos con KPI) con la *Arquitectura de puestos del Edificio de Gobierno* (la geometría es el organigrama).

Proyecto de **Ricardo López Reyero**. El edificio donde vive este organigrama: [edificio.capitaltorreon.com](https://edificio.capitaltorreon.com).

## Documentos

| Archivo | Qué es |
|---|---|
| [LOGICA.md](LOGICA.md) · pestaña Lógica | **La lógica**: qué toma de cada fuente, los diez principios, el Presidente y la Mesa de 11, la cascada de KPIs, los cuatro lados y las cuatro esquinas, la estructura de una secretaría, Talento como obra de ingeniería, lo que desaparece, las olas y los números |
| [PROMPT.md](PROMPT.md) · pestaña Lógica | El brief destilado del dictado del 8 de noviembre de 2026 y lo que se interpretó |
| [datos/puestos.js](datos/puestos.js) | **La única fuente de verdad**: los 566 puestos (id, a quién reporta, título, KPI, nivel, sector, ola, nota) y las plantillas que generan los niveles 5 a 8. El árbol, la lista, el tablero y el validador se construyen leyendo este archivo |
| [datos/validar.mjs](datos/validar.mjs) | El validador que corre antes de publicar: ids únicos, padres que existen, KPI en todos, tramos de control (11 para el Presidente, 8 para los demás), conteos |
| [schema.sql](schema.sql) | Las dos tablas de D1: `puestos` (lo que cambia de cada puesto) y `bitacora` (quién cambió qué y cuándo) |
| [src/index.js](src/index.js) · [src/verificar.js](src/verificar.js) | El Worker: `/api/estado`, `/api/puesto/:id` (PUT), `/api/puesto/:id/archivo` (foto o CV a R2), `/archivo/*`, `/api/bitacora/:id`, `/api/quien`; y la verificación del pase del Login de CapitalTorreon |
| [sitio/](sitio/) | La página: `index.html`, `app.js` (árbol con d3, lista, tablero, ficha), `estilo.css` |

## El organigrama en diez líneas

| | |
|---|---|
| Arriba | Director/a de México · Presidente/a. KPI: PIB per cápita real +5 % anual (hoy la economía crece ~0.8 %) |
| La Mesa de 11 | Vicepresidencia (felicidad), Secretaría Ejecutiva (el Tablero), Talento (quién entra), 4 coordinadores de lado, 4 superdirectores de esquina |
| Los lados | Norte Personas (capital humano) · Oriente Orden (homicidios) · Sur Economía (empleo formal) · Poniente Territorio (kWh per cápita) |
| Secretarías | 21, cada una con 3 subsecretarios, una Unidad de Ejecución, 32 enlaces territoriales y de 9 a 16 direcciones generales |
| Estados | Una mesa por estado: 32 delegados nacionales en 5 regiones, con oficina en campo |
| Contrapesos | La Cámara de Bases y Revisión (80 ciudadanos) vigila al Presidente y confirma a 9 titulares autónomos; unidos al árbol con línea punteada |
| Talento | 35 puestos, 1,949 plazas, 33 lectores maestros, 480 reclutadores: la primera ola. Proceso ciego, prueba de trabajo real, verificación, expediente público, cero amiguismo |
| Tramos | 11 para el Presidente, 8 para los demás, 4 → 8 → 33 hacia abajo |
| Plazas | 566 nombradas; 47,735 con la célula estándar completa |
| Estatus | Pausado · En contratación · Contratado, con persona, foto, currículum y porqué; filtros de «los que faltan» y orden de importancia para los reclutadores |

## Cómo se usa

- **Árbol**: arrastra, acerca con la rueda, toca el puntito o la tarjeta para abrir el puesto, toca el número bajo una tarjeta para desplegar a quién dirige. «Desplegar hasta» abre todo un nivel; «Pantalla gigante» quita todo lo demás (para la pantalla del edificio).
- **Filtros**: búsqueda, nivel (directivos, mandos medios, operativos), estatus (los que faltan, en contratación, pausados, contratados), sector y ola. El árbol despliega solo el camino a cada coincidencia.
- **Lista**: en orden de importancia (ola, rango, orden del organigrama), con descarga a CSV.
- **Tablero**: tres columnas por estatus; con tu cuenta arrastras las tarjetas.
- **Ficha**: KPI, por qué existe el puesto, estatus, persona (nombre, foto, currículum en PDF, por qué se contrató), a quién dirige, a quién reporta, bitácora, liga para compartir.
- **Entrar**: con la cuenta de Google (arriba a la derecha, a través de [login.capitaltorreon.com](https://login.capitaltorreon.com)). Todo se ve sin entrar; **cualquiera que entre puede editar** y cada cambio queda en la bitácora con su correo. Si algún día hace falta cerrar la edición, basta poner correos en `EDITORES` (wrangler.jsonc). El currículum se ve solo con sesión.

## Desarrollo y publicación

```bash
npm run validar
```

```bash
npm run dev
```

```bash
./publicar.sh
```

`publicar.sh` valida los datos, revisa la sintaxis, copia `datos/puestos.js`, `LOGICA.md` y `PROMPT.md` a `sitio/` y despliega con Wrangler. Recursos: D1 `organigrama-db` (schema.sql), R2 `organigrama-archivos`, dominio `organigrama.capitaltorreon.com`.

## Qué sigue

- Tabla de sueldos por nivel, para publicar cada vacante con su sueldo.
- Ajustar el tamaño de la célula estándar por secretaría según el padrón.
- Conectar la Bolsa Nacional de Puestos: que «en contratación» publique la vacante.

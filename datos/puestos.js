// RLR · Organigrama de Gobierno 2.0 · los puestos y su KPI — Ricardo López Reyero
// Tercera versión: cruza «Organigrama Gobierno 2.0 v3» (555 puestos con KPI, Presidente / Co-Presidente / Autónomos)
// con «Edificio de Gobierno · Arquitectura de puestos v1» (la geometría es el organigrama: lados, esquinas, centro, altura).
// Una sola fuente de verdad: el árbol, la lista, el tablero y el validador se construyen leyendo este archivo.
// Reglas: un KPI principal por puesto; una sola línea de mando; nadie dirige a más de 8 (salvo el Presidente, con 11,
// y los jefes de manzana, con 4 jefes de barrio); cada rama separada se une al árbol en algún punto.
const _RLR = "Ricardo López Reyero", _k = "EYE", _rev = 181218; // firma de autoría: ROT13 y posiciones de R·L·R

export const SECTORES = {
  presidencia: { n: "Presidencia", lado: "El centro · la Casa de Decisiones", c: "#b08d57" },
  talento:     { n: "Talento", lado: "Reclutamiento y selección · reporta al Presidente", c: "#e0479e" },
  personas:    { n: "Personas", lado: "Lado Norte", c: "#3fb27f" },
  orden:       { n: "Orden", lado: "Lado Oriente", c: "#c9573f" },
  economia:    { n: "Economía", lado: "Lado Sur", c: "#d9a441" },
  territorio:  { n: "Territorio", lado: "Lado Poniente", c: "#4f93c9" },
  esquinas:    { n: "Esquinas", lado: "Las cuatro torres donde se tocan dos sectores", c: "#9b6fd6" },
  autonomos:   { n: "Autónomos", lado: "Contrapesos · no reportan al Presidente", c: "#8d8a82" },
};
export const NIVELES = [
  "Presidente", "Mesa de 11", "Secretarios y equivalentes", "Subsecretarios y equivalentes",
  "Directores generales y de frontera", "Directores de área", "Jefes de manzana", "Jefes de barrio", "Analistas, especialistas y operadores",
];
export const GRUPOS_NIVEL = { directivos: [0, 1, 2, 3, 4], mandos: [5, 6, 7], operativos: [8] };
export const OLAS = [
  "", "Ola 1 · quien recluta y quien decide", "Ola 2 · la Mesa de 11 y la Casa de Decisiones", "Ola 3 · secretarios, estados y contrapesos",
  "Ola 4 · subsecretarios y unidades de ejecución", "Ola 5 · directores generales y de frontera", "Ola 6 · áreas, manzanas, barrios y operación",
];
export const ESTATUS = {
  pausado:      { n: "Pausado", c: "#7c8490", d: "El proceso no se ha abierto o se detuvo" },
  contratacion: { n: "En contratación", c: "#d9a441", d: "Vacante abierta en la Bolsa Nacional de Puestos" },
  contratado:   { n: "Contratado", c: "#3fb27f", d: "La persona mejor calificada del proceso ya ocupa el puesto" },
};
// KPI estándar de los niveles que se generan por plantilla (la célula de una dirección general: 4 → 1 → 4 → 8)
export const KPI_PLANTILLA = {
  area:    "Su cuarta parte del KPI de la dirección general, fijada por escrito al contratar; tareas del Tablero de su área cumplidas en plazo: 100 %",
  manzana: "Su manzana de 33 entrega en plazo y con calidad: 100 % de las tareas del Tablero; rotación de su gente: menos de 5 % al año",
  barrio:  "Las tareas de sus 8 cerradas en plazo y con calidad 9 de 10: 100 %",
  analista:"Tareas cerradas en plazo: 100 %; calidad evaluada por su jefe de barrio: 9 de 10 o más",
  jefeRol: "Su barrio de 8 cumple su KPI: 100 %; nadie de su barrio sin evaluación mensual",
};

// ---------------------------------------------------------------------------------------------
// RLR · constructor
const P = [];
const pon = (id, padre, t, kpi, o = {}) => { P.push({ id, padre, t, kpi, ...o }); return id; };
// Atajos por tipo de puesto (el nivel es el rango, no la profundidad en el árbol)
const gab = (id, t, kpi, o = {}) => pon(id, "pres", t, kpi, { n: 1, ola: 2, ...o });
const sec = (id, padre, t, kpi, o = {}) => pon(id, padre, t, kpi, { n: 2, ola: 3, ...o });
const sub = (id, padre, t, kpi, o = {}) => pon(id, padre, t, kpi, { n: 3, ola: 4, ...o });
const dg  = (id, padre, t, kpi, o = {}) => pon(id, padre, t, kpi, { n: 4, ola: 5, cel: "dg", ...o });
const dir = (id, padre, t, kpi, o = {}) => pon(id, padre, t, kpi, { n: 4, ola: 5, ...o });
const rol = (r, n, kpi, por = 8, jefe) => ({ rol: r, n, kpi, por, jefe }); // plantilla plana: jefes de barrio + personas
// La unidad de ejecución de una secretaría: dueña de los plazos, con sus 32 enlaces territoriales y el enlace con la Casa del Ciudadano
const ue = (padre, nombre) => {
  sub(padre + "-ue", padre, "Jefe/a de la Unidad de Ejecución · " + nombre,
    "Decisiones del Tablero asignadas a " + nombre + " cumplidas en plazo (11 minutos, 1 hora, 11 días): 100 %",
    { nota: "Dueño de los plazos de la secretaría en el Tablero. Sus 32 enlaces se sientan en la mesa de su estado (lado Poniente).",
      gen: rol("Enlace territorial · " + nombre + " (uno por estado, en la mesa de su estado)", 32, "Decisiones que tocan a su estado bajadas a la mesa del estado en 11 minutos o menos: 100 %", 8, "Jefe/a de enlaces territoriales") });
  dir(padre + "-ue-cc", padre + "-ue", "Enlace con la Casa del Ciudadano · " + nombre,
    "Casos de la Casa del Ciudadano que tocan a " + nombre + " resueltos en 11 días o menos: 95 %",
    { gen: rol("Anfitrión/a de enlace", 8, "Caso canalizado al dueño correcto en 1 hora o menos: 100 %") });
};

// =============================================================================================
// 0 · EL PRESIDENTE
pon("pres", null, "Director/a de México · Presidente/a",
  "PIB per cápita real: crecimiento de 5 % anual sostenido (hoy la economía crece ~0.8 %)",
  { n: 0, s: "presidencia", ola: 2,
    nota: "Decide: 33 decisiones registradas por jornada, en turnos de 11 minutos. Dirige a 11: la Mesa de 11. Su número resume los otros cuatro: sin orden no hay inversión, sin energía no hay industria, sin gente sana y educada no hay productividad, sin economía formal no hay recaudación." });

// =============================================================================================
// 1 · LA MESA DE 11 (los directos del Presidente)
gab("vp", "Vicepresidente/a de México",
  "Índice de Felicidad Ciudadana (0 a 10, encuesta mensual del INEGI): de ~7.0 a 8.0 sostenido",
  { s: "presidencia", nota: "Sustituye al Presidente y es la voz del ciudadano dentro de la Casa: dirige las cuatro Casas del Ciudadano y Valor y Estudios, y lleva al Tablero cada semana los 33 temas que más repite la gente. El Presidente responde por el valor (PIB); la Vicepresidencia, por cómo lo vive la gente (felicidad). Es el Co-Presidente de la versión 3, con una sola línea de mando." });
gab("se", "Secretario/a Ejecutivo/a · Jefe/a de Gabinete",
  "Decisiones del Tablero cumplidas en plazo por su dueño: 100 % (33 por jornada; plazos de 11 minutos, 1 hora y 11 días)",
  { s: "presidencia", ola: 1, nota: "La agenda, el carrusel y el Tablero: decide quién entra a qué sala y en qué orden. De aquí cuelgan la Casa de Decisiones, La Fábrica y el Edificio: el sistema que hace posible decidir." });
gab("tal", "Director/a Nacional de Talento · Reclutamiento y Selección",
  "Puestos cubiertos por la persona mejor calificada del proceso: 100 %; contrataciones por recomendación o amistad: 0",
  { s: "talento", ola: 1, est: "contratacion",
    nota: "El primer departamento que se construye: de él depende quién entra. Nadie entra por quién conoce, entra por lo que demuestra: proceso ciego hasta la final, prueba de trabajo real, lectura de personas, verificación de cada afirmación del currículum, expediente público de por qué se contrató. Contratar a un amigo que no fue el mejor del proceso es causa de remoción." });
gab("c-per", "Coordinador/a de Personas · lado Norte",
  "Índice de Capital Humano (Banco Mundial, 0 a 1): de 0.61 a 0.75",
  { s: "personas", nota: "Hace que Salud, Educación, Ciencia, Bienestar, Trabajo y Cultura se muevan como una. Preside la sala de situación del Norte y responde por los tiempos del Tablero de su lado." });
gab("c-ord", "Coordinador/a del Orden · lado Oriente",
  "Homicidios dolosos por cada 100,000 habitantes: de ~24 a 5 (meta final: 0 muertes violentas)",
  { s: "orden", nota: "Seguridad, Gobernación, Exteriores, Defensa y Marina, Integridad y el Cuartel en una sola mesa." });
gab("c-eco", "Coordinador/a de Economía · lado Sur",
  "Empleos formales netos creados por año: 1.5 millones o más (hoy menos de 0.5 millones)",
  { s: "economia", nota: "Transacción y Presupuesto, Economía e Industria, Recursos Estratégicos, Agricultura y Turismo. Su número alimenta directo el del Presidente." });
gab("c-ter", "Coordinador/a del Territorio · lado Poniente",
  "kWh per cápita: crecimiento de 5 % anual sostenido (hoy ~2,500 kWh por persona al año)",
  { s: "territorio", nota: "Energía, Infraestructura, Agua y Ambiente, Ciudad y Vivienda, y la mesa de los 32 estados. El indicador más honesto de actividad real." });
gab("sd-ne", "Superdirector/a de Paz y Comunidad · esquina Nororiente (Personas + Orden)",
  "Jóvenes de 15 a 29 años que ni estudian ni trabajan: de ~20 % a 8 %",
  { s: "esquinas", nota: "Dueño de lo que ni Personas ni Orden resuelven solos: prevención, violencia, migración, derechos, justicia cívica. Cerrar la fábrica del crimen es la prevención real." });
gab("sd-se", "Superdirector/a de Legalidad Económica · esquina Suroriente (Orden + Economía)",
  "Costo de la extorsión y la corrupción para las empresas (encuesta ENVE): −70 %",
  { s: "esquinas", nota: "Aduanas, lavado, competencia, combate a la corrupción, Estado de derecho para invertir." });
gab("sd-so", "Superdirector/a de Desarrollo Regional · esquina Surponiente (Economía + Territorio)",
  "Brecha de PIB per cápita entre el Norte y el Sur-Sureste: de ~3 veces a 1.5 veces",
  { s: "esquinas", nota: "Infraestructura productiva, energía para la industria, campo, logística, polos de desarrollo." });
gab("sd-no", "Superdirector/a de Ciudad y Vida · esquina Norponiente (Territorio + Personas)",
  "Hogares con agua, luz, drenaje e internet continuos los 7 días de la semana: 100 %",
  { s: "esquinas", nota: "Vivienda, agua, transporte, escuelas y hospitales en el territorio, ciudades." });

// ---------------------------------------------------------------------------------------------
// 1.1 · VICEPRESIDENCIA: la escucha
for (const [k, lado, sector] of [["n", "Norte", "Personas"], ["e", "Oriente", "Orden"], ["s", "Sur", "Economía"], ["o", "Poniente", "Territorio"]]) {
  const id = "cc-" + k;
  sub(id, "vp", `Director/a de la Casa del Ciudadano ${lado} (${sector})`,
    "Casos resueltos en 11 días o menos: 95 %; primera respuesta en 1 hora o menos: 100 %",
    { s: "presidencia", nota: "Escuchar es un puesto. 99 mesas redondas con dos sillas iguales; cada caso se registra con tres destinos." });
  dir(id + "-mesas", id, `Coordinador/a de Anfitriones de Mesa · Casa ${lado}`,
    "Las 99 mesas con sus dos turnos cubiertos: 100 %; casos registrados con sus tres destinos: 100 %",
    { gen: rol("Anfitrión/a de mesa", 198, "Casos registrados completos y bien canalizados: 100 %; la persona atendida califica 9 de 10 o más") });
  dir(id + "-aud", id, `Coordinador/a de Salas de Audiencia e Intérpretes · Casa ${lado}`,
    "Grupos (cámaras, ejidos, sindicatos, delegaciones) atendidos en la fecha prometida: 100 %; audiencias con intérprete cuando hace falta: 100 %",
    { gen: rol("Jefe/a de sala de audiencia o intérprete (lenguas indígenas, señas, inglés)", 20, "Audiencias realizadas en fecha y con acta en 24 horas: 100 %") });
  dir(id + "-puerta", id, `Coordinador/a de Anfitriones de Puerta · Casa ${lado}`,
    "Nadie espera solo ante una puerta cerrada: persona acompañada en 1 minuto o menos: 100 %",
    { gen: rol("Anfitrión/a de puerta (uno cada 20 metros, dos turnos)", 80, "Personas acompañadas en 1 minuto o menos: 100 %; quejas por trato: 0") });
}
sub("vys", "vp", "Director/a de Valor y Estudios",
  "Los 33 temas más repetidos por la ciudadanía publicados cada semana: 100 % de las semanas; temas con decisión en el Tablero en 33 días o menos: 80 %",
  { s: "presidencia", ola: 2, nota: "Agrega lo que entra por las cuatro Casas, estudia qué necesita la gente y cómo se sostiene cada servicio." });
dir("vys-casos", "vys", "Director/a de Agregación de Casos", "Casos de las cuatro Casas clasificados y agregados en 24 horas o menos: 100 %", { gen: rol("Analista de casos", 36, "Casos clasificados sin error de destino: 99 %") });
dir("vys-estudios", "vys", "Director/a de Estudios de Necesidad", "Programas nuevos con estudio de necesidad previo: 100 %", { gen: rol("Investigador/a social", 36, "Estudios entregados antes de la decisión: 100 %") });
dir("vys-sost", "vys", "Director/a de Sostenibilidad de Servicios", "Servicios públicos con modelo de costo y sostenibilidad publicado: 100 %", { gen: rol("Analista de servicios", 36, "Modelos de costo actualizados cada trimestre: 100 %") });
sub("vp-fel", "vp", "Director/a de Seguimiento de Felicidad por Estado",
  "32 estados con medición mensual de felicidad y plan sobre sus tres factores más bajos: 100 %",
  { s: "presidencia", gen: rol("Analista de bienestar por estado", 32, "Su estado con plan vigente y avance mensual publicado: 100 %") });
sub("vp-emp", "vp", "Director/a de la Ventanilla del Empleado",
  "Casos de los 30,000 del edificio resueltos en 11 días o menos: 95 %",
  { s: "presidencia", nota: "El gobierno atiende a su gente.", gen: rol("Anfitrión/a de la ventanilla del empleado", 40, "Casos resueltos en plazo: 95 %") });

// ---------------------------------------------------------------------------------------------
// 1.2 · SECRETARÍA EJECUTIVA: la Casa de Decisiones, La Fábrica y el Edificio
sub("tab", "se", "Director/a del Tablero",
  "Decisiones sin dueño o sin fecha en el Tablero: 0; decisión entregada a su dueño en 11 minutos o menos: 100 %",
  { s: "presidencia", ola: 1, nota: "El puesto que hoy no existe y que más falta hace: el dueño del sistema de decisiones. El Tablero no admite decisiones sin dueño." });
dir("tab-carrusel", "tab", "Jefe/a del Carrusel", "Tiempos muertos entre las seis salas: 0 minutos; equipos que esperan o se cruzan: 0", { ola: 2, gen: rol("Coordinador/a de antesala y cuarto de resultado", 8, "Equipos listos a la hora exacta: 100 %") });
dir("tab-registro", "tab", "Jefe/a de Registro de Decisiones", "Decisiones registradas con dueño, fecha y resultado en 1 hora o menos: 100 %", { ola: 2, gen: rol("Registrador/a de decisiones", 8, "Registros completos y sin error: 100 %") });
dir("tab-plazos", "tab", "Jefe/a de Seguimiento de Plazos", "Alertas emitidas antes de que venza un plazo: 100 %; plazos vencidos sin explicación registrada: 0", { ola: 2, gen: rol("Analista de plazos", 8, "Plazos de su cartera con alerta a tiempo: 100 %") });
sub("sit", "se", "Director/a de la Sala de Situación",
  "Crisis con célula activa en 11 minutos o menos, las 24 horas del año: 100 %",
  { s: "presidencia", ola: 2, gen: rol("Oficial de la Sala de Situación (tres turnos)", 33, "Alertas atendidas en 11 minutos o menos: 100 %") });
sub("dat", "se", "Director/a de la Sala de Datos",
  "Cifra pedida por el Presidente entregada en la misma junta: 95 % o más; tablero de KPIs con latencia menor a 1 hora",
  { s: "presidencia", ola: 2, nota: "Aquí viven los guardianes de los cinco números del país." });
for (const [id, t] of [["dat-pib", "PIB per cápita"], ["dat-hom", "Homicidios"], ["dat-kwh", "kWh per cápita"], ["dat-cap", "Capital Humano"], ["dat-fel", "Felicidad"]]) {
  dir(id, "dat", "Guardián/a del KPI de " + t, "Avance del indicador publicado el día 3 de cada mes con la causa raíz de cada desviación: 100 %",
    { ola: 2, nota: "Es el enlace vivo entre el sector y el Presidente: si el número no sube, aquí se detecta primero." });
}
dir("dat-analistas", "dat", "Jefe/a de Analistas de Datos", "Cifras entregadas en junta con fuente y fecha: 100 %", { ola: 2, gen: rol("Analista de datos", 24, "Consultas resueltas en la misma junta: 95 %") });
sub("jur", "se", "Consejero/a Jurídico/a de la Presidencia",
  "Decisiones registradas con dictamen de legalidad previo: 100 %; decisiones revertidas por tribunales: 0",
  { s: "presidencia", ola: 2, gen: rol("Abogado/a consejero/a", 24, "Dictámenes entregados antes de la junta: 100 %") });
sub("ofi", "se", "Jefe/a de la Oficina de la Presidencia",
  "Juntas del Presidente con ficha, nota de asesor y enlaces listos antes de empezar: 100 %; incidentes de agenda o protocolo: 0",
  { s: "presidencia", ola: 2, nota: "Agrupa lo que rodea al Presidente sin ser el Tablero: enlace de Estado, protocolo, enlace legislativo, la Casa Presidencial, los 33 asesores y el secretariado." });
dir("enl", "ofi", "Director/a de Enlace de Estado",
  "Llamadas con jefes de Estado y mandos concretadas en 24 horas o menos: 100 %",
  { s: "presidencia", ola: 2, gen: rol("Oficial de enlace de Estado", 8, "Llamadas preparadas con ficha en 1 hora o menos: 100 %") });
sub("voc", "se", "Vocero/a y Director/a de la Sala de Prensa",
  "Confianza ciudadana en la información del gobierno (encuesta): 70 % o más; preguntas de prensa respondidas en 24 horas o menos: 100 %",
  { s: "presidencia", ola: 2, gen: rol("Comunicador/a (estudio, Teatro 333, redes)", 40, "Piezas publicadas sin error de dato: 100 %") });
dir("prot", "ofi", "Jefe/a de Protocolo y Banderas",
  "Visitas de Estado sin incidente de protocolo: 100 %",
  { s: "presidencia", gen: rol("Oficial de protocolo", 20, "Visitas con guion cumplido al minuto: 100 %") });
dir("leg", "ofi", "Jefe/a de Enlace Legislativo y Judicial",
  "Presupuesto y nombramientos entregados a la Cámara de Bases con 15 días o más de anticipación: 100 %",
  { s: "presidencia", ola: 3, gen: rol("Enlace legislativo y judicial", 12, "Documentos entregados en plazo: 100 %") });
dir("casa", "ofi", "Jefe/a de la Casa Presidencial",
  "Agenda del Presidente sin pérdidas por logística (cocina, casa privada, consultorio, traslados): 98 % o más",
  { s: "presidencia", gen: rol("Personal de la Casa Presidencial", 30, "Servicio sin incidente: 100 %") });
dir("ase", "ofi", "Coordinador/a de los 33 Asesores del Presidente",
  "Cada decisión llega al Presidente con una nota de una página de su asesor: 100 %",
  { s: "presidencia", ola: 2, nota: "Un asesor por cada uno de los 33 temas que más se repiten en el Tablero.",
    gen: rol("Asesor/a del Presidente (uno de los 33 temas)", 33, "Notas de una página entregadas antes de la junta: 100 %; recomendaciones adoptadas que cumplieron su resultado: 80 %", 11, "Decano/a de asesores") });
dir("secr", "ofi", "Jefe/a del Secretariado de la Suite",
  "Las seis salas con tres personas de apoyo por turno: 100 %",
  { s: "presidencia", gen: rol("Secretario/a de sala", 24, "Actas y seguimientos entregados en 1 hora o menos: 100 %") });

// La Fábrica
sub("fab", "se", "Director/a de La Fábrica · ingeniería central",
  "Fallas del Tablero o de la identidad digital con impacto en una decisión: 0; lo que ve un pod se arregla en 11 días o menos: 95 %",
  { s: "presidencia", ola: 1, nota: "Rango de subsecretario. Dueño del sistema: Tablero, identidad, salas, puertas y La Bóveda. 1,320 ingenieros sentados entre la gente que usa el sistema." });
dir("fab-nucleo", "fab", "Arquitecto/a en Jefe · Núcleo (Tablero, identidad, salas, puertas, datos, IA)", "Los seis sistemas del núcleo sin falla con impacto en una decisión: 0 al año", { ola: 1 });
dir("fab-dominios", "fab", "Arquitecto/a en Jefe · Dominios (Casa del Ciudadano, territorio, finanzas, salud y educación, infraestructura)", "Los cinco dominios con su sistema en producción y usado por su secretaría: 100 %", { ola: 2 });
const NUCLEO = new Set(["tablero", "identidad", "salas", "puertas", "datos", "ia"]);
for (const [id, t, kpi] of [
  ["tablero", "Tablero", "Disponibilidad del Tablero: 99.99 %; decisión visible para su dueño en menos de 1 segundo"],
  ["identidad", "Identidad digital", "Mexicanos con identidad digital única activa y usada como llave de todo trámite: 100 %; suplantaciones exitosas: 0"],
  ["salas", "Salas y video", "Salas y enlaces de video sin falla durante una junta: 99.9 %"],
  ["puertas", "Puertas y seguridad", "Puertas y esclusas con registro y sin falla: 99.99 %; accesos indebidos: 0"],
  ["datos", "Datos", "Indicadores de los 21 sectores con una sola definición y una sola fuente: 100 %"],
  ["ciudadano", "Casa del Ciudadano", "Caso registrado en una mesa visible en su destino en menos de 1 minuto: 100 %"],
  ["territorio", "Territorio", "Los 2,478 municipios con tablero vivo: 100 %"],
  ["finanzas", "Finanzas públicas", "Gasto federal visible en el portal público con latencia menor a 12 horas: 100 %"],
  ["salud-edu", "Salud y educación", "Expediente clínico único y expediente escolar único operando para toda la población: 100 %"],
  ["infra", "Infraestructura", "Obras públicas con avance físico y financiero en tiempo real: 100 %"],
  ["ia", "Inteligencia artificial del Estado", "Decisiones del Tablero con análisis de IA previo y trazable: 100 %; modelos auditados cada trimestre"],
]) pon("fab-" + id, NUCLEO.has(id) ? "fab-nucleo" : "fab-dominios", "Arquitecto/a de Sistema · " + t, kpi, { n: 4, ola: 2, gen: rol("Jefe/a de producto · " + t, 4, "Entregas del trimestre cumplidas: 100 %; incidentes graves de su producto: 0", 4, "Líder de producto") });
dir("fab-pods", "fab", "Director/a de Pods de Ingenieros de Piso",
  "Pisos con pod completo de 11: 100 %; tickets de piso cerrados en 11 días o menos: 95 %",
  { nota: "El sistema se arregla donde se usa.", gen: rol("Ingeniero/a de piso", 1320, "Tickets de su piso cerrados en 11 días o menos: 95 %; lo estructural subido a su arquitecto: 100 %", 11, "Jefe/a de pod") });
dir("fab-plataforma", "fab", "Director/a de Plataforma y Datos", "Disponibilidad de la plataforma: 99.99 %; dato replicado en La Bóveda en menos de 1 segundo", { gen: rol("Ingeniero/a de plataforma y datos", 300, "Servicios bajo su cuidado con disponibilidad 99.99 %") });
dir("fab-boveda", "fab", "Director/a de Seguridad Informática y La Bóveda", "Incidentes con pérdida o fuga de datos: 0; nunca una persona sola en Z6: 100 %", { gen: rol("Especialista de seguridad informática (tres turnos)", 150, "Alertas atendidas en 11 minutos o menos: 100 %") });
dir("fab-diseno", "fab", "Director/a de Diseño de Servicio y Ergonomía Digital", "El Tablero se usa sin manual: de la llegada al edificio a la primera decisión registrada en 1 día o menos", { gen: rol("Diseñador/a de servicio", 60, "Pantallas probadas con usuarios reales antes de publicarse: 100 %") });

// El Edificio
sub("edi", "se", "Director/a General del Edificio",
  "Disponibilidad diaria del edificio para los 30,000 (elevadores, energía, agua, red, comida): 99.5 % o más",
  { s: "presidencia", ola: 3, nota: "Rango de subsecretaría. El edificio es un puesto de gobierno, no un contrato. El modelo digital es el registro vivo." });
dir("edi-tecnica", "edi", "Subdirector/a de Operación Técnica del Edificio", "Estructura, elevadores, energía, agua, paisaje, movilidad y seguridad civil disponibles cada día: 99.5 % o más", { ola: 3 });
dir("edi-personas", "edi", "Subdirector/a de Servicios a las Personas del Edificio", "Comida, limpieza, salud, guarderías, eventos y visitas sin queja grave: 100 % de los días", { ola: 3 });
const TECNICA = new Set(["oper", "paisaje", "movilidad", "seguridad"]);
for (const [id, t, kpi, r, n] of [
  ["oper", "Operación y Mantenimiento", "176 elevadores y sistemas con disponibilidad de 99.5 % o más; plan de 200 años al día", "Técnico/a de operación y mantenimiento", 420],
  ["cocina", "Hospitalidad y Cocinas", "40,000 comidas al día servidas; espera en comedor de 11 minutos o menos; satisfacción 9 de 10", "Cocinero/a o anfitrión/a de comedor (incluye los 32 cocineros de los estados)", 1150],
  ["limpieza", "Limpieza y Baños", "600 bloques revisados cada 2 horas con registro: 100 %; el semáforo de cabinas siempre verdadero", "Personal de limpieza", 480],
  ["paisaje", "Paisaje y Agua", "Árboles vivos y sanos: 98 % o más de los 15,000 a 20,000; agua del paisaje 100 % reciclada", "Jardinero/a y operador/a de agua", 160],
  ["movilidad", "Movilidad del Complejo", "Del coche al escritorio en 12 minutos, del andén en 10, del helicóptero en 9 (percentil 90)", "Operador/a de movilidad", 220],
  ["eventos", "Eventos y Recintos", "Eventos montados a tiempo: 100 %; ocupación de los teatros: 60 % o más", "Técnico/a de eventos", 140],
  ["salud", "Salud, Guarderías y Bienestar", "Clínica 24 horas con atención en 11 minutos o menos; 1,332 lugares de guardería con lista de espera cero", "Personal de salud, guardería y gimnasios", 260],
  ["hospedaje", "Hospedaje y Protocolo del Edificio", "Visitas sin espera mayor a 11 minutos: 100 %", "Anfitrión/a de visitas", 60],
  ["seguridad", "Seguridad Civil del Edificio", "Evacuación completa en simulacro en 33 minutos o menos; incidentes de protección civil: 0", "Oficial de protección civil y puertas", 90],
]) pon("edi-" + id, TECNICA.has(id) ? "edi-tecnica" : "edi-personas", "Director/a de " + t, kpi, { n: 5, ola: 4, gen: rol(r, n, "Su bloque de trabajo cumplido y registrado cada día: 100 %") });

// ---------------------------------------------------------------------------------------------
// 1.3 · TALENTO: la obra de ingeniería que decide quién entra (Ola 1 completa)
sub("tal-atr", "tal", "Subdirector/a Nacional de Atracción · la Bolsa Nacional de Puestos",
  "Candidatos calificados por vacante: 12 o más en puestos directivos, 30 o más en operativos",
  { ola: 1, nota: "Cada puesto de este organigrama se publica con su KPI, su sueldo y su prueba. La gente más trabajadora de México tiene que saber que existe." });
dir("tal-atr-bolsa", "tal-atr", "Director/a de la Bolsa Nacional de Puestos", "Vacante publicada con KPI, sueldo y prueba en 24 horas o menos desde que se abre: 100 %", { ola: 1, gen: rol("Publicador/a de vacantes", 24, "Vacantes publicadas completas en 24 horas: 100 %") });
dir("tal-atr-marca", "tal-atr", "Director/a de Marca del Servicio Público", "Solicitudes por puesto publicado: +20 % anual; de los 100 mejores egresados del país, los que postulan: 50 % o más", { ola: 1, gen: rol("Comunicador/a de talento", 24, "Campañas con costo por candidato calificado a la baja: trimestre a trimestre") });
dir("tal-atr-busqueda", "tal-atr", "Director/a de Búsqueda Directa de Directivos", "Puestos de nivel 0 a 4 con 5 finalistas o más de talla probada: 100 %", { ola: 1, gen: rol("Buscador/a de directivos", 40, "Finalistas de talla por búsqueda: 5 o más; finalistas que aceptan la oferta: 80 %") });
dir("tal-atr-alianzas", "tal-atr", "Director/a de Alianzas · universidades, empresas y diáspora", "Candidatos que llegan por alianza: 30 % o más del total; mexicanos en el exterior que regresan a un puesto: 500 al año", { ola: 1, gen: rol("Gestor/a de alianzas", 24, "Alianzas activas con candidatos en el último trimestre: 100 %") });

sub("tal-eva", "tal", "Subdirector/a Nacional de Evaluación · pruebas de trabajo real",
  "Correlación entre la calificación de la prueba y el desempeño a 12 meses: 0.6 o más",
  { ola: 1, nota: "No se evalúa lo que la persona dice que sabe: se le pone a hacer el trabajo. Sin nombre, sin foto, sin escuela, hasta la final." });
dir("tal-eva-pruebas", "tal-eva", "Director/a de Diseño de Pruebas de Trabajo", "Familias de puesto con prueba de trabajo real propia: 100 %; pruebas renovadas cada 12 meses: 100 %", { ola: 1, gen: rol("Diseñador/a de pruebas", 40, "Pruebas con validez probada (predicen desempeño): 100 %") });
dir("tal-eva-ciega", "tal-eva", "Director/a de Evaluación Ciega", "Procesos ciegos (sin nombre, foto ni escuela) hasta la final: 100 %", { ola: 1, gen: rol("Evaluador/a ciego/a", 120, "Evaluaciones entregadas en 72 horas o menos con rúbrica: 100 %") });
dir("tal-eva-actitud", "tal-eva", "Director/a de Psicometría y Actitud", "Predictividad de las pruebas de actitud sobre la evaluación de pares al año: 0.5 o más", { ola: 1, gen: rol("Psicómetra", 40, "Pruebas calibradas y sin sesgo detectado: 100 %") });
dir("tal-eva-calibracion", "tal-eva", "Director/a de Calibración de Evaluadores", "Desviación entre evaluadores del mismo candidato: menos de 10 %", { ola: 1, gen: rol("Calibrador/a", 24, "Evaluadores recalibrados cada mes: 100 %") });

sub("tal-lec", "tal", "Subdirector/a Nacional de Lectura de Personas · los entrevistadores maestros",
  "Contratados evaluados 9 de 10 o más por su jefe y por sus pares al año: 90 % o más",
  { ola: 1, nota: "Las 33 personas que mejor leen a las personas en México: ningún contratado sin su sí. Entran solo quienes tienen buena actitud y buen pensar; la capacidad se prueba antes, aquí se lee a la persona." });
dir("tal-lec-maestros", "tal-lec", "Decano/a de los 33 Lectores Maestros", "Los 33 con evaluación anual de predictividad: 100 %; su sí o su no sobre el finalista en 48 horas o menos", { ola: 1, gen: rol("Lector/a maestro/a de personas", 33, "Sus contratados evaluados 9 de 10 o más al año: 90 %", 11, "Lector/a decano/a de grupo") });
dir("tal-lec-entrevista", "tal-lec", "Director/a de Entrevista Estructurada", "Entrevistas con guion estructurado y rúbrica: 100 %; decisiones registradas como «me cayó bien»: 0", { ola: 1, gen: rol("Lector/a de personas certificado/a", 330, "Entrevistas con rúbrica completa y grabadas: 100 %; predictividad anual revisada") });
dir("tal-lec-formacion", "tal-lec", "Director/a de Formación de Lectores", "Lectores certificados por maestro al año: 10; recertificación anual: 100 %", { ola: 1, gen: rol("Formador/a de lectores", 24, "Lectores formados que pasan la certificación: 90 %") });
dir("tal-lec-verificacion", "tal-lec", "Director/a de Referencias y Verificación", "Afirmaciones del currículum verificadas antes de la oferta: 100 %; fraude detectado antes de contratar: 100 %", { ola: 1, gen: rol("Verificador/a de trayectoria", 150, "Expedientes verificados en 5 días o menos: 100 %") });

sub("tal-int", "tal", "Subdirector/a Nacional de Integridad del Proceso · cero amiguismo",
  "Contrataciones revocadas por conflicto de interés no declarado: 0; conflictos declarados y recusados: 100 %",
  { ola: 1, nota: "Quien evalúa a alguien que conoce se recusa. Quien contrata a un amigo que no fue el mejor del proceso, sale. Un tercio de las contrataciones se audita al azar." });
dir("tal-int-conflictos", "tal-int", "Director/a de Conflictos de Interés", "Evaluadores con declaración de conflicto por proceso: 100 %; recusaciones automáticas por parentesco, amistad o negocio", { ola: 1, gen: rol("Analista de conflictos de interés", 24, "Cruces de parentesco y negocio hechos antes de cada evaluación: 100 %") });
dir("tal-int-auditoria", "tal-int", "Director/a de Auditoría Aleatoria de Contrataciones", "Contrataciones auditadas al azar: 33 %; hallazgos graves: 0", { ola: 1, gen: rol("Auditor/a de contrataciones", 40, "Auditorías cerradas en 11 días o menos: 100 %") });
dir("tal-int-expediente", "tal-int", "Director/a del Expediente Público de Contratación", "Contrataciones con expediente público (puntajes, prueba, por qué esta persona) en 72 horas o menos: 100 %", { ola: 1, nota: "Cualquiera puede ver por qué se contrató a quien ocupa un puesto.", gen: rol("Editor/a de expedientes", 24, "Expedientes publicados completos en 72 horas: 100 %") });
dir("tal-int-denuncias", "tal-int", "Director/a de Denuncias de Reclutamiento", "Denuncias de favoritismo investigadas en 11 días o menos: 100 %; denunciantes protegidos: 100 %", { ola: 1, gen: rol("Investigador/a de denuncias", 24, "Denuncias cerradas con resolución fundada en plazo: 100 %") });

sub("tal-inc", "tal", "Subdirector/a Nacional de Incorporación y Desempeño",
  "Rotación involuntaria en el primer año: menos de 5 %; nuevos con KPI medido desde el mes 1: 100 %",
  { ola: 1, nota: "Nadie llega a buscar lugar: silla, barrio, manzana, jefe y pod asignados el día 1. Quien falla su KPI dos periodos, sale en 30 días." });
dir("tal-inc-incorporacion", "tal-inc", "Director/a de Incorporación · 33 días", "Nuevos con plan de 90 días firmado el día 1 y con silla, jefe y pod asignados: 100 %", { ola: 1, gen: rol("Anfitrión/a de incorporación", 60, "Nuevos productivos (primera tarea cerrada) en 11 días o menos: 90 %") });
dir("tal-inc-desempeno", "tal-inc", "Director/a de Evaluación de Desempeño frente al KPI", "Puestos con KPI medido cada mes y visible para su jefe: 100 %", { ola: 1, gen: rol("Analista de desempeño", 60, "Tableros de KPI por puesto actualizados el día 3 de cada mes: 100 %") });
dir("tal-inc-sucesion", "tal-inc", "Director/a de Sucesión y Banca", "Puestos de nivel 0 a 4 con dos sucesores listos: 100 %", { ola: 1, gen: rol("Gestor/a de sucesión", 24, "Planes de sucesión revisados cada trimestre: 100 %") });
dir("tal-inc-salida", "tal-inc", "Director/a de Salida Rápida", "De KPI fallido dos periodos a decisión de remoción: 30 días o menos; remociones impugnadas con éxito: 0", { ola: 1, nota: "Nadie puede salirse de la línea de mando: quien lo hace, es removido de inmediato, con expediente.", gen: rol("Analista jurídico de salida", 24, "Expedientes de remoción completos y defendibles: 100 %") });

sub("tal-dat", "tal", "Subdirector/a Nacional de Datos y Plataforma de Talento",
  "Ciclo de vacante a oferta: 33 días o menos en directivos, 11 días o menos en operativos",
  { ola: 1, nota: "Con La Fábrica. El candidato ve su estatus en tiempo real; el reclutador ve el organigrama entero, como esta página." });
dir("tal-dat-plataforma", "tal-dat", "Director/a de la Plataforma de Talento", "Disponibilidad: 99.9 %; candidato que ve su estatus en tiempo real: 100 %", { ola: 1, gen: rol("Ingeniero/a de la plataforma de talento", 40, "Incidentes resueltos en 11 días o menos: 95 %") });
dir("tal-dat-analitica", "tal-dat", "Director/a de Analítica de Contratación", "Modelo de predicción de desempeño revalidado cada trimestre; sesgo por género, edad u origen detectado: 0", { ola: 1, gen: rol("Científico/a de datos de talento", 24, "Modelos auditados y publicados cada trimestre: 100 %") });

sub("tal-ue", "tal", "Jefe/a de la Unidad de Ejecución de Talento",
  "Vacantes del organigrama cubiertas dentro del plazo de su ola: 100 %",
  { ola: 1, nota: "Dueño de que este organigrama se llene en orden: primero la Ola 1, luego la 2, hasta la 6." });
for (const [k, nombre] of [["per", "Personas"], ["ord", "Orden"], ["eco", "Economía"], ["ter", "Territorio"]]) {
  dir("tal-ue-" + k, "tal-ue", "Delegado/a de Talento · sector " + nombre, "Vacantes del sector " + nombre + " cubiertas en plazo con la persona mejor calificada: 100 %",
    { ola: 1, gen: rol("Reclutador/a · " + nombre, 105, "Vacantes de su cartera cubiertas en plazo (33 días directivos, 11 operativos): 100 %; contrataciones observadas en auditoría: 0") });
}
dir("tal-ue-centro", "tal-ue", "Delegado/a de Talento · Presidencia, Esquinas y Autónomos", "Vacantes de la Casa de Decisiones, La Fábrica, el Edificio y las esquinas cubiertas en plazo: 100 %",
  { ola: 1, gen: rol("Reclutador/a · centro", 60, "Vacantes de su cartera cubiertas en plazo: 100 %") });

// =============================================================================================
// 2 · LOS CUATRO LADOS: 21 secretarías
// ---------------------------------------------------------------------------------------------
// NORTE · PERSONAS
sec("s-sal", "c-per", "Secretario/a de Salud", "Esperanza de vida saludable: de ~65 a 70 años");
sub("s-sal-1", "s-sal", "Subsecretario/a de Prevención y Salud Pública", "Prevalencia de diabetes y obesidad en adultos: −3 puntos porcentuales cada 3 años");
dg("s-sal-1-1", "s-sal-1", "Director/a General de Vacunación y Enfermedades Transmisibles", "Niños con esquema de vacunación completo: 95 % o más");
dg("s-sal-1-2", "s-sal-1", "Director/a General de Nutrición y Enfermedades Crónicas", "Obesidad infantil: de 37 % a 25 %");
dg("s-sal-1-3", "s-sal-1", "Director/a General de Salud Mental y Adicciones", "Suicidios por cada 100,000: −30 %; cita de salud mental en 7 días o menos: 100 %");
dg("s-sal-1-4", "s-sal-1", "Director/a General de Vigilancia Epidemiológica", "Brotes detectados y contenidos en 72 horas o menos: 100 %");
sub("s-sal-2", "s-sal", "Subsecretario/a de Atención Médica · hospitales y clínicas", "Consulta de primer nivel en 3 días o menos; cirugía programada en 30 días o menos: 90 %");
dg("s-sal-2-1", "s-sal-2", "Director/a General de Hospitales Nacionales", "Ocupación entre 75 % y 85 %; mortalidad hospitalaria ajustada: −10 %");
dg("s-sal-2-2", "s-sal-2", "Director/a General de Clínicas de Primer Contacto", "Consulta otorgada en 3 días o menos: 90 %");
dg("s-sal-2-3", "s-sal-2", "Director/a General de Urgencias y Emergencias", "Ambulancia en 11 minutos o menos en ciudades: 90 %");
dg("s-sal-2-4", "s-sal-2", "Director/a General de Medicamentos e Insumos", "Desabasto de medicamentos esenciales: 0 %; recetas surtidas completas: 98 % o más");
sub("s-sal-3", "s-sal", "Subsecretario/a del Sistema Único de Salud y Datos", "Personas con expediente clínico digital único usado en su última consulta: 100 %");
dg("s-sal-3-1", "s-sal-3", "Director/a General del Expediente Clínico Único", "Consultas registradas en el expediente único (con La Fábrica): 100 %");
dg("s-sal-3-2", "s-sal-3", "Director/a General de Integración IMSS, ISSSTE y Bienestar", "Un solo padrón de derechohabientes; afiliaciones duplicadas: 0");
dg("s-sal-3-3", "s-sal-3", "Director/a General de Profesionales de la Salud", "Médicos por cada 1,000 habitantes: de 2.4 a 3.5; plazas rurales vacantes: 0");
dg("s-sal-3-4", "s-sal-3", "Director/a General de Calidad y Resultados Clínicos", "Hospitales con indicadores públicos de resultados: 100 %");
ue("s-sal", "Salud");

sec("s-edu", "c-per", "Secretario/a de Educación", "Jóvenes de 15 años con nivel 2 o más en PISA (lectura, matemáticas y ciencias): de ~45 % a 75 %");
sub("s-edu-1", "s-edu", "Subsecretario/a de Educación Básica", "Niños de tercero de primaria que leen con comprensión: 90 % o más");
dg("s-edu-1-1", "s-edu-1", "Director/a General de Primera Infancia · 0 a 5 años", "Cobertura de educación inicial y preescolar: 100 %");
dg("s-edu-1-2", "s-edu-1", "Director/a General de Primaria y Lectura", "Lectura con comprensión a los 8 años: 90 %");
dg("s-edu-1-3", "s-edu-1", "Director/a General de Secundaria y Matemáticas", "Nivel 2 o más en matemáticas a los 15 años: 75 %");
dg("s-edu-1-4", "s-edu-1", "Director/a General de Maestros · formación y evaluación", "Maestros con evaluación anual y plan de mejora: 100 %; el 10 % mejor con bono");
sub("s-edu-2", "s-edu", "Subsecretario/a de Educación Media Superior y Técnica", "Jóvenes que terminan la preparatoria o una carrera técnica: de 60 % a 90 %");
dg("s-edu-2-1", "s-edu-2", "Director/a General de Bachillerato", "Abandono escolar en bachillerato: −50 %");
dg("s-edu-2-2", "s-edu-2", "Director/a General de Educación Técnica Dual con Empresas", "Egresados técnicos con empleo formal en 6 meses o menos: 80 % o más");
dg("s-edu-2-3", "s-edu-2", "Director/a General de Orientación Vocacional y Primer Empleo", "Jóvenes con plan de carrera al terminar: 100 %");
sub("s-edu-3", "s-edu", "Subsecretario/a de Educación Superior", "Egresados universitarios con empleo formal en su área a 12 meses: 75 % o más");
dg("s-edu-3-1", "s-edu-3", "Director/a General de Universidades Públicas", "Matrícula en ciencias, tecnología e ingeniería: +50 %");
dg("s-edu-3-2", "s-edu-3", "Director/a General de Becas y Movilidad", "Admitidos que dejan de estudiar por dinero: 0");
dg("s-edu-3-3", "s-edu-3", "Director/a General de la Universidad Digital Nacional", "Estudiantes activos en línea con título válido: 1 millón");
dg("s-edu-3-4", "s-edu-3", "Director/a General de Infraestructura Escolar", "Escuelas con agua, luz, internet y baños dignos: 100 %");
ue("s-edu", "Educación");

sec("s-cyt", "c-per", "Secretario/a de Ciencia, Tecnología e Innovación", "Inversión en investigación y desarrollo como % del PIB: de 0.3 % a 1.5 %");
sub("s-cyt-1", "s-cyt", "Subsecretario/a de Ciencia", "Investigadores por millón de habitantes: de ~350 a 1,000");
dg("s-cyt-1-1", "s-cyt-1", "Director/a General de Centros Públicos de Investigación", "Publicaciones de alto impacto por investigador: +30 %");
dg("s-cyt-1-2", "s-cyt-1", "Director/a General de Becas de Posgrado y Repatriación", "Doctores que regresan a México a un puesto: 1,000 al año");
dg("s-cyt-1-3", "s-cyt-1", "Director/a General de Grandes Proyectos Científicos", "Proyectos de clase mundial activos: 3 o más");
sub("s-cyt-2", "s-cyt", "Subsecretario/a de Tecnología e Industria 4.0", "Empresas que adoptan inteligencia artificial o automatización con apoyo público: 10,000 al año");
dg("s-cyt-2-1", "s-cyt-2", "Director/a General de Inteligencia Artificial Nacional", "Capacidad de cómputo soberana instalada; empresas que usan IA: de 10 % a 50 %");
dg("s-cyt-2-2", "s-cyt-2", "Director/a General de Semiconductores y Electrónica", "Plantas de diseño, empaque o prueba de chips en México: 3 o más");
dg("s-cyt-2-3", "s-cyt-2", "Director/a General de Transferencia Tecnológica", "Patentes licenciadas a empresas: +30 % anual");
sub("s-cyt-3", "s-cyt", "Subsecretario/a de Innovación y Emprendimiento", "Empresas emergentes mexicanas que levantan capital institucional: 3 veces más; unicornios: 10");
dg("s-cyt-3-1", "s-cyt-3", "Director/a General de Capital Emprendedor", "Fondos coinvertidos con privados: USD 1,000 millones al año");
dg("s-cyt-3-2", "s-cyt-3", "Director/a General de Talento Digital", "Programadores formados y empleados: 100,000 al año");
dg("s-cyt-3-3", "s-cyt-3", "Director/a General de Espacio y Aeronáutica", "Satélites y lanzamientos propios: programa activo con 1 misión al año");
ue("s-cyt", "Ciencia y Tecnología");

sec("s-bie", "c-per", "Secretario/a de Bienestar y Pensiones", "Población en pobreza (CONEVAL): de 36 % a 15 %; en pobreza extrema: 0");
sub("s-bie-1", "s-bie", "Subsecretario/a de Transferencias y Padrón Único", "Hogares en pobreza extrema con apoyo mensual puntual: 100 %; duplicados y fantasmas: 0");
dg("s-bie-1-1", "s-bie-1", "Director/a General del Padrón Único de Beneficiarios", "Un solo padrón (con La Fábrica); duplicados: 0");
dg("s-bie-1-2", "s-bie-1", "Director/a General de Apoyo a Adultos Mayores", "Adultos mayores sin ingreso: 0");
dg("s-bie-1-3", "s-bie-1", "Director/a General de Apoyo a Personas con Discapacidad", "Cobertura con evaluación funcional: 100 %");
dg("s-bie-1-4", "s-bie-1", "Director/a General de Salida de la Pobreza", "Hogares que salen de la pobreza por ingreso propio: 500,000 al año");
sub("s-bie-2", "s-bie", "Subsecretario/a de Pensiones y Seguridad Social Financiera", "Tasa de reemplazo de la pensión: 70 % o más del último salario; sistema sostenible a 50 años");
dg("s-bie-2-1", "s-bie-2", "Director/a General de Pensiones Universales", "Adultos mayores con pensión: 100 %");
dg("s-bie-2-2", "s-bie-2", "Director/a General de Ahorro para el Retiro", "Rendimiento neto real anual: 4 % o más; comisión: 0.5 % o menos");
dg("s-bie-2-3", "s-bie-2", "Director/a General de Sostenibilidad Actuarial", "Déficit actuarial del sistema: tendencia a 0");
sub("s-bie-3", "s-bie", "Subsecretario/a de Mujeres, Familia e Igualdad", "Participación laboral femenina: de 46 % a 65 %; brecha salarial: 0");
dg("s-bie-3-1", "s-bie-3", "Director/a General de Cuidados · guarderías y cuidado de mayores", "Lugares públicos de cuidado nuevos: 1 millón");
dg("s-bie-3-2", "s-bie-3", "Director/a General de Igualdad y Contra la Violencia de Género", "Feminicidios: −50 % cada 3 años (con Seguridad)");
dg("s-bie-3-3", "s-bie-3", "Director/a General de Juventud y Familias", "Jóvenes con mentoría activa: 1 millón");
ue("s-bie", "Bienestar");

sec("s-tra", "c-per", "Secretario/a del Trabajo", "Informalidad laboral: de 55 % a 30 % de la población ocupada");
sub("s-tra-1", "s-tra", "Subsecretario/a de Formalización", "Trabajadores que pasan de informales a formales: 1 millón al año");
dg("s-tra-1-1", "s-tra-1", "Director/a General de Registro Laboral Simple", "Alta de un trabajador en 11 minutos o menos: 100 %");
dg("s-tra-1-2", "s-tra-1", "Director/a General de Incentivos a la Formalidad", "Costo de formalizar para una PYME: −50 %");
dg("s-tra-1-3", "s-tra-1", "Director/a General de Trabajo Digital y Plataformas", "Repartidores y conductores con seguridad social: 100 %");
sub("s-tra-2", "s-tra", "Subsecretario/a de Capacitación y Productividad", "Productividad laboral (PIB por hora trabajada): +3 % anual");
dg("s-tra-2-1", "s-tra-2", "Director/a General de Capacitación Nacional", "Trabajadores capacitados con certificado válido: 2 millones al año");
dg("s-tra-2-2", "s-tra-2", "Director/a General de Certificación de Competencias", "Las 100 ocupaciones principales con estándar y certificación: 100 %");
dg("s-tra-2-3", "s-tra-2", "Director/a General de Intermediación Laboral Digital", "Vacante llenada en 15 días o menos: 80 %");
sub("s-tra-3", "s-tra", "Subsecretario/a de Justicia Laboral y Condiciones de Trabajo", "Juicio laboral resuelto en 6 meses o menos: 90 %; accidentes de trabajo: −30 %");
dg("s-tra-3-1", "s-tra-3", "Director/a General de Inspección y Seguridad en el Trabajo", "Accidentes mortales de trabajo: −50 %");
dg("s-tra-3-2", "s-tra-3", "Director/a General de Conciliación y Tribunales Laborales", "Conciliaciones exitosas en 45 días o menos: 75 %");
dg("s-tra-3-3", "s-tra-3", "Director/a General de Salario e Ingreso Digno", "Trabajadores formales por debajo de la línea de bienestar: 0");
ue("s-tra", "Trabajo");

sec("s-cul", "c-per", "Secretario/a de Cultura y Deporte", "Población que practica deporte o una actividad cultural cada semana: de 40 % a 70 %");
sub("s-cul-1", "s-cul", "Subsecretario/a de Deporte y Vida Activa", "Niños y jóvenes con 3 horas o más de deporte a la semana en la escuela: 100 %");
dg("s-cul-1-1", "s-cul-1", "Director/a General de Deporte Escolar y Comunitario", "Ligas activas en los 2,478 municipios: 100 %");
dg("s-cul-1-2", "s-cul-1", "Director/a General de Alto Rendimiento", "Medallero olímpico y mundial: top 15");
dg("s-cul-1-3", "s-cul-1", "Director/a General de Infraestructura Deportiva", "Unidades deportivas abiertas 12 horas al día o más: 100 %");
sub("s-cul-2", "s-cul", "Subsecretario/a de Cultura y Patrimonio", "Visitantes a museos, zonas arqueológicas y recintos: 2 veces más");
dg("s-cul-2-1", "s-cul-2", "Director/a General de Patrimonio", "Zonas y monumentos con plan de conservación financiado: 100 %");
dg("s-cul-2-2", "s-cul-2", "Director/a General de Cultura Comunitaria", "Casas de cultura con actividad diaria en cada municipio: 100 %");
dg("s-cul-2-3", "s-cul-2", "Director/a General de Industrias Creativas · cine, música, videojuegos", "Exportación cultural en USD: 2 veces más");
sub("s-cul-3", "s-cul", "Subsecretario/a de Lenguas, Pueblos y Memoria", "Lenguas indígenas con hablantes jóvenes en crecimiento: 68 de 68");
dg("s-cul-3-1", "s-cul-3", "Director/a General de Lenguas Indígenas", "Escuelas bilingües con maestros certificados en la lengua: 100 %");
dg("s-cul-3-2", "s-cul-3", "Director/a General de Archivos y Memoria Nacional", "Archivo nacional digitalizado y público: 100 %");
ue("s-cul", "Cultura y Deporte");

// ---------------------------------------------------------------------------------------------
// ORIENTE · ORDEN
sec("s-seg", "c-ord", "Secretario/a de Seguridad Ciudadana", "Homicidios dolosos por cada 100,000: −15 % cada año hasta llegar a 5; delitos de alto impacto: −15 % al año");
sub("s-seg-1", "s-seg", "Subsecretario/a de Policía Nacional y Estatal", "Policías certificados y de confianza por cada 100,000 habitantes: de 180 a 300; estados con policía certificada: 32 de 32");
dg("s-seg-1-1", "s-seg-1", "Director/a General de Guardia Nacional y Operaciones", "Presencia efectiva en los 50 municipios más violentos: 100 %");
dg("s-seg-1-2", "s-seg-1", "Director/a General de Policías Estatales y Municipales · modelo único", "Policías con control de confianza vigente: 100 %");
dg("s-seg-1-3", "s-seg-1", "Director/a General de la Academia Nacional de Policía", "Egresados certificados: 30,000 al año");
dg("s-seg-1-4", "s-seg-1", "Director/a General de Carrera y Bienestar Policial", "Salario policial: 2 veces la mediana nacional o más; rotación: menos de 8 %");
sub("s-seg-2", "s-seg", "Subsecretario/a de Inteligencia e Investigación", "Homicidios con investigación que llega a un imputado: de ~10 % a 60 %");
dg("s-seg-2-1", "s-seg-2", "Director/a General del C5 Nacional y Datos Criminales", "Incidentes con respuesta despachada en 11 minutos o menos: 100 %");
dg("s-seg-2-2", "s-seg-2", "Director/a General de Inteligencia Financiera Criminal", "Activos del crimen decomisados: USD 2,000 millones al año");
dg("s-seg-2-3", "s-seg-2", "Director/a General de Investigación Criminal Científica", "Resultados forenses en 15 días o menos: 100 %");
dg("s-seg-2-4", "s-seg-2", "Director/a General de Ciberseguridad y Delitos Digitales", "Fraudes digitales resueltos: 50 % o más");
sub("s-seg-3", "s-seg", "Subsecretario/a de Prevención y Reinserción", "Reincidencia delictiva: de 30 % a 10 %");
dg("s-seg-3-1", "s-seg-3", "Director/a General de Prevención Social (con Paz y Comunidad)", "Jóvenes en riesgo atendidos: 1 millón");
dg("s-seg-3-2", "s-seg-3", "Director/a General del Sistema Penitenciario", "Internos con trabajo o estudio: 100 %; centros con autogobierno: 0");
dg("s-seg-3-3", "s-seg-3", "Director/a General de Atención a Víctimas", "Víctimas con atención integral en 72 horas o menos: 100 %");
ue("s-seg", "Seguridad");

sec("s-gob", "c-ord", "Secretario/a de Gobernación · relaciones interiores", "Conflictos sociales resueltos por diálogo, sin violencia ni bloqueos de más de 24 horas: 95 % o más");
sub("s-gob-1", "s-gob", "Subsecretario/a de Gobierno y Estados", "Acuerdos políticos con los 32 gobernadores ejecutados en plazo: 100 %");
dg("s-gob-1-1", "s-gob-1", "Director/a General de la Mesa de Gobernadores", "Un oficial por estado; acuerdos del día cerrados el mismo día: 100 %");
dg("s-gob-1-2", "s-gob-1", "Director/a General de Enlace con Municipios y Congresos Locales", "Reformas locales alineadas a la estrategia nacional aprobadas en plazo: 90 %");
dg("s-gob-1-3", "s-gob-1", "Director/a General de Asuntos Religiosos y Asociaciones", "Registros resueltos en 11 días o menos: 100 %");
sub("s-gob-2", "s-gob", "Subsecretario/a de Derechos y Población", "Mexicanos con identidad digital única activa: 100 %");
dg("s-gob-2-1", "s-gob-2", "Director/a General de Población y Registro · identidad digital", "CURP digital usada como llave de todo trámite (con La Fábrica): 100 %");
dg("s-gob-2-2", "s-gob-2", "Director/a General de Derechos Humanos", "Recomendaciones de la CNDH cumplidas: 100 %");
dg("s-gob-2-3", "s-gob-2", "Director/a General de Migración Ordenada", "Personas migrantes con registro y trato digno en 24 horas o menos: 100 %");
sub("s-gob-3", "s-gob", "Subsecretario/a de Diálogo y Conflictos", "Mesa de diálogo instalada en 11 días o menos desde que surge un conflicto: 100 %");
dg("s-gob-3-1", "s-gob-3", "Director/a General de la Mesa de Diálogo · sindicatos, pueblos, iglesias, medios", "Conflictos con acuerdo firmado en 33 días o menos: 80 %");
dg("s-gob-3-2", "s-gob-3", "Director/a General de Pueblos Indígenas y Consulta", "Consultas previas realizadas en plazo: 100 %");
dg("s-gob-3-3", "s-gob-3", "Director/a General de Alerta Temprana de Conflictos", "Conflictos detectados antes de estallar: 80 % o más");
ue("s-gob", "Gobernación");

sec("s-ext", "c-ord", "Secretario/a de Relaciones Exteriores", "Acuerdos internacionales activos con beneficio medible para México (comercio, energía, seguridad, talento): 12 o más");
sub("s-ext-1", "s-ext", "Subsecretario/a para América del Norte", "Tratado comercial renovado sin disputas abiertas de más de 12 meses; exportaciones a EE. UU. y Canadá: +8 % anual");
dg("s-ext-1-1", "s-ext-1", "Director/a General de Comercio y Tratado de América del Norte", "Disputas comerciales resueltas en 12 meses o menos: 100 %");
dg("s-ext-1-2", "s-ext-1", "Director/a General de Frontera Norte y Cooperación en Seguridad", "Acuerdos de seguridad con resultados medibles compartidos: 100 %");
dg("s-ext-1-3", "s-ext-1", "Director/a General de Mexicanos en Estados Unidos · 50 consulados", "Trámite consular en 48 horas o menos: 100 %");
sub("s-ext-2", "s-ext", "Subsecretario/a para América Latina y el Caribe", "Comercio con la región: 2 veces más en 6 años; integración energética con Centroamérica");
dg("s-ext-2-1", "s-ext-2", "Director/a General de Centroamérica y el Caribe", "Acuerdos de energía y migración vigentes con los 7 países: 100 %");
dg("s-ext-2-2", "s-ext-2", "Director/a General de Sudamérica", "Comercio con Sudamérica: +10 % anual");
dg("s-ext-2-3", "s-ext-2", "Director/a General de Cooperación para el Desarrollo", "Proyectos de cooperación con resultado medido: 100 %");
sub("s-ext-3", "s-ext", "Subsecretario/a para Europa, Asia, África y Organismos", "Inversión extranjera de Europa y Asia: USD 20,000 millones al año");
dg("s-ext-3-1", "s-ext-3", "Director/a General de Europa", "Acuerdo con la Unión Europea modernizado y en uso: 100 % de preferencias aprovechadas");
dg("s-ext-3-2", "s-ext-3", "Director/a General de Asia-Pacífico", "Inversión asiática aterrizada: USD 10,000 millones al año");
dg("s-ext-3-3", "s-ext-3", "Director/a General de Organismos Internacionales", "Candidaturas y posiciones de México ganadas: 80 %");
dg("s-ext-3-4", "s-ext-3", "Director/a General de la Mesa de Embajadas · 24 horas", "Cada embajada y consulado con enlace en turno; respuesta a una embajada en 1 hora o menos: 100 %");
dg("s-ext-3-5", "s-ext-3", "Director/a General de Exportación del Sistema de Gobierno", "Países con acuerdo activo de cooperación en gobierno eficiente: 5 o más; México en el top 20 mundial de eficiencia gubernamental en 8 años");
ue("s-ext", "Relaciones Exteriores");

sec("s-def", "c-ord", "Secretario/a de Defensa y Marina · enlace civil", "Territorio nacional (municipios y mar patrimonial) bajo control efectivo del Estado: 100 %");
sub("s-def-1", "s-def", "Subsecretario/a de Defensa Nacional", "Despliegue ante una amenaza en cualquier punto del país en 24 horas o menos: 100 %");
dg("s-def-1-1", "s-def-1", "Director/a General de Planeación de la Defensa", "Planes de contingencia actualizados y ensayados: 100 %");
dg("s-def-1-2", "s-def-1", "Director/a General de Industria Militar y Tecnología", "Equipo fabricado en México: 50 % o más");
dg("s-def-1-3", "s-def-1", "Director/a General de Protección Civil Militar · Plan DN-III", "Población afectada por un desastre atendida en 24 horas o menos: 100 %");
sub("s-def-2", "s-def", "Subsecretario/a de Marina y Mar Patrimonial", "Zona económica exclusiva vigilada: 100 %; pesca ilegal extranjera: 0");
dg("s-def-2-1", "s-def-2", "Director/a General de Vigilancia Marítima", "Embarcaciones ilegales detectadas e interceptadas: 90 % o más");
dg("s-def-2-2", "s-def-2", "Director/a General de Seguridad de Puertos y Capitanías", "Puertos sin incidente de seguridad: 100 %");
dg("s-def-2-3", "s-def-2", "Director/a General de Investigación Oceanográfica", "Zona económica exclusiva cartografiada: 100 %");
sub("s-def-3", "s-def", "Subsecretario/a de Fronteras y Espacio Aéreo", "Cruces irregulares de armas y drogas detectados: 80 % o más; espacio aéreo cubierto por radar: 100 %");
dg("s-def-3-1", "s-def-3", "Director/a General de Frontera Norte", "Armas detectadas en cruces: +50 % anual");
dg("s-def-3-2", "s-def-3", "Director/a General de Frontera Sur", "Puntos de cruce con registro y control: 100 %");
dg("s-def-3-3", "s-def-3", "Director/a General de Control del Espacio Aéreo", "Vuelos irregulares detectados e interceptados: 95 % o más");
ue("s-def", "Defensa y Marina");

sec("s-int", "c-ord", "Secretario/a de Integridad Pública · antes Función Pública", "Índice de Percepción de la Corrupción (Transparencia Internacional, 0 a 100): de 26 a 60");
sub("s-int-1", "s-int", "Subsecretario/a de Contrataciones Públicas Abiertas", "Compras públicas por licitación abierta con datos abiertos: 90 % o más (adjudicación directa: 10 % o menos)");
dg("s-int-1-1", "s-int-1", "Director/a General de la Plataforma Única de Compras", "Compras del gobierno en una sola plataforma pública: 100 %");
dg("s-int-1-2", "s-int-1", "Director/a General de Precios de Referencia", "Sobreprecio detectado frente al mercado: 0 %");
dg("s-int-1-3", "s-int-1", "Director/a General de Obra Pública Vigilada", "Obras con avance físico y financiero público en tiempo real: 100 %");
sub("s-int-2", "s-int", "Subsecretario/a de Vigilancia y Sanción", "Casos probados de corrupción con sanción firme en 12 meses o menos: 100 %");
dg("s-int-2-1", "s-int-2", "Director/a General de Declaraciones Patrimoniales y Conflictos de Interés", "Declaraciones verificadas con cruces de datos: 100 %");
dg("s-int-2-2", "s-int-2", "Director/a General de Investigación de Faltas Graves", "Casos investigados en 6 meses o menos: 100 %");
dg("s-int-2-3", "s-int-2", "Director/a General de Denuncia Ciudadana Protegida", "Denunciantes protegidos: 100 %; denuncias atendidas en 11 días o menos");
sub("s-int-3", "s-int", "Subsecretario/a de Simplificación de Trámites", "Trámites federales: de ~7,000 a menos de 1,000; digitales y de 11 minutos o menos: 100 %");
dg("s-int-3-1", "s-int-3", "Director/a General de Eliminación de Trámites", "Trámites eliminados o fusionados: −85 %");
dg("s-int-3-2", "s-int-3", "Director/a General de la Ventanilla Digital Única", "Trámites que se hacen con la identidad digital sin presentarse: 100 % (con La Fábrica)");
dg("s-int-3-3", "s-int-3", "Director/a General de Medición de Satisfacción Ciudadana", "Satisfacción con trámites: 9 de 10 o más");
ue("s-int", "Integridad Pública");

// El Cuartel: mando unificado, reporta al Presidente por el Coordinador del Orden
sec("cuartel", "c-ord", "Comandante del Cuartel · mando unificado",
  "Incidentes de seguridad en el complejo: 0; una sola mesa para las cuatro fuerzas: respuesta coordinada en 11 minutos o menos: 100 %",
  { nota: "Puerta Oriente. Guardia Nacional, Defensa y Marina, policía federal y las 32 policías estatales en una sola mesa." });
sub("cuartel-c5", "cuartel", "Jefe/a del C5", "Incidentes con respuesta despachada en 11 minutos o menos: 100 %, en tres turnos", { gen: rol("Operador/a del C5 (tres turnos)", 66, "Alertas atendidas en 11 minutos o menos: 100 %", 11, "Jefe/a de turno del C5") });
sub("cuartel-guerra", "cuartel", "Jefe/a del Cuarto de Guerra", "Escenarios de crisis con plan ensayado: 100 %; simulacros al año: 12", { gen: rol("Oficial del Cuarto de Guerra", 33, "Planes actualizados tras cada simulacro: 100 %", 11, "Jefe/a de turno") });
sub("cuartel-em", "cuartel", "Jefe/a de Estado Mayor del Cuartel · las cuatro fuerzas", "Una sola mesa: Guardia Nacional, Defensa y Marina, policía federal y las 32 policías estatales con información compartida en 1 hora o menos: 100 %");
dir("cuartel-gn", "cuartel-em", "Mando de Enlace de la Guardia Nacional", "Órdenes del Tablero ejecutadas por la Guardia en plazo: 100 %", { gen: rol("Oficial de enlace, C4 y planeación · Guardia Nacional", 450, "Órdenes ejecutadas y reportadas en plazo: 100 %") });
dir("cuartel-ffaa", "cuartel-em", "Mando de Enlace de Defensa y Marina", "Inteligencia compartida en una sola mesa: 100 % de los casos", { gen: rol("Oficial de enlace, C4 e inteligencia · Fuerzas Armadas", 350, "Reportes compartidos en 1 hora o menos: 100 %") });
dir("cuartel-pf", "cuartel-em", "Mando de Enlace de la Policía Federal", "Investigaciones federales coordinadas con los estados: 100 %", { gen: rol("Oficial de enlace, C4 e investigación · Policía Federal", 300, "Casos con carpeta coordinada: 100 %") });
dir("cuartel-pe", "cuartel-em", "Mando de Coordinación con las 32 Policías Estatales", "Estados con enlace permanente y C4 conectado: 32 de 32", { gen: rol("Oficial de enlace estatal", 300, "Su estado con C4 conectado y reportes diarios: 100 %") });
sub("cuartel-complejo", "cuartel", "Jefe/a de Seguridad del Complejo", "Perímetro, plazas y esclusas Z4 a Z6 sin incidente: 100 %; polvorín y arsenal auditados cada mes", { gen: rol("Elemento de seguridad del complejo", 240, "Rondas y esclusas registradas sin falta: 100 %") });
sub("cuartel-heli", "cuartel", "Jefe/a del Helipuerto del Cuartel y Operaciones Aéreas", "Despegue de emergencia en 9 minutos o menos: 100 %", { gen: rol("Piloto o técnico/a aéreo/a", 40, "Aeronaves disponibles: 95 % o más") });
sub("cuartel-admin", "cuartel", "Jefe/a de Administración, Jurídico, Derechos Humanos y Asuntos Internos", "Quejas por abuso investigadas en 11 días o menos: 100 %; sanción firme en casos probados: 100 %", { gen: rol("Analista de asuntos internos y derechos humanos", 50, "Expedientes cerrados en plazo: 100 %") });
sub("segp", "cuartel", "Jefe/a de Seguridad Presidencial", "Incidentes de seguridad presidencial: 0; esclusas y túnel de Estado auditados cada mes: 100 %", { s: "presidencia", ola: 2, nota: "Trabaja en la Casa de Decisiones; su mando es el Cuartel.", gen: rol("Escolta y oficial de esclusa", 60, "Protocolos cumplidos sin excepción: 100 %") });

// ---------------------------------------------------------------------------------------------
// SUR · ECONOMÍA
sec("s-ant", "c-eco", "Director/a General de la ANTPP · Transacción y Presupuesto (antes Hacienda y SAT)",
  "Recaudación como % del PIB: de 17 % a 23 % en 4 años, con menos de 10 horas al año de cumplimiento fiscal para una PYME",
  { nota: "Tres fuentes de ingreso y nada más: Impuesto a la Transacción, regalías de recursos naturales e impuesto plano a utilidades de empresas grandes. Desaparecen el ISR personal, el IVA, el IEPS y 50 contribuciones menores." });
sub("s-ant-1", "s-ant", "Director/a de la Agencia Nacional de Transacción · el nuevo SAT", "Transacciones financieras capturadas por el Impuesto a la Transacción: 99.8 %", { nota: "3,000 personas en lugar de 26,000: la tecnología hace el trabajo." });
dg("s-ant-1-1", "s-ant-1", "Director/a General de Tecnología de Recaudación Automática", "Latencia entre la transacción y el depósito al gobierno: menos de 24 horas, todo automatizado");
dg("s-ant-1-2", "s-ant-1", "Director/a General de Inclusión Financiera", "Transacciones de la economía dentro del sistema formal: de 55 % a 80 %");
dg("s-ant-1-3", "s-ant-1", "Director/a General de Calibración de la Tasa del Impuesto a la Transacción", "Tasa ajustada para cumplir la meta de recaudación sin frenar la economía: revisión trimestral publicada");
dg("s-ant-1-4", "s-ant-1", "Director/a General del Impuesto Plano a Utilidades · empresas de más de USD 10 millones", "Empresas grandes con declaración verificada: 100 %");
dg("s-ant-1-5", "s-ant-1", "Director/a General de Aduanas Nacional", "Despacho en la frontera norte para carga certificada: menos de 2 horas");
sub("s-ant-2", "s-ant", "Director/a de la Oficina Nacional de Presupuesto", "Presupuesto asignado con base en KPIs y resultados previos: 100 %; déficit fiscal: 2 % del PIB o menos");
dg("s-ant-2-1", "s-ant-2", "Director/a General de Presupuesto Nacional", "Déficit fiscal como % del PIB: 2 % o menos; gasto con impacto positivo demostrado: 100 %");
dg("s-ant-2-2", "s-ant-2", "Director/a General de Transparencia del Gasto en Tiempo Real", "Gasto federal visible en el portal público con latencia menor a 12 horas: 100 %");
dg("s-ant-2-3", "s-ant-2", "Director/a General de Evaluación del Retorno del Gasto Público", "Programas con retorno social positivo medible: 100 % (si no genera valor, se corta)");
dg("s-ant-2-4", "s-ant-2", "Director/a General de Cobro de Regalías de Recursos Naturales", "Concesiones de recursos con regalías al corriente: 100 %");
sub("s-ant-3", "s-ant", "Director/a de Finanzas Nacionales", "Calificación crediticia soberana: BBB+ o mejor, con diferencial menor a 150 puntos base");
dg("s-ant-3-1", "s-ant-3", "Director/a General de la Banca Nacional de Desarrollo", "Crédito nuevo a infraestructura y PYMES: +40 % en 3 años (BANOBRAS, NAFIN y BANJERCITO integrados)");
dg("s-ant-3-2", "s-ant-3", "Director/a General de Deuda y Finanzas Internacionales", "Costo promedio de la deuda: −100 puntos base");
dg("s-ant-3-3", "s-ant-3", "Director/a General de Fondeo de Pensiones", "Pasivo pensionario fondeado a 30 años: 100 % (con Bienestar)");
dg("s-ant-3-4", "s-ant-3", "Director/a General de Estabilidad Financiera", "Bancos con capital y liquidez por encima del mínimo: 100 % (con el Banco de México)");
ue("s-ant", "Transacción y Presupuesto");

sec("s-eco", "c-eco", "Secretario/a de Economía e Industria", "Inversión extranjera directa: de USD 36,000 millones a 80,000 millones al año");
sub("s-eco-1", "s-eco", "Subsecretario/a de Nearshoring e Inversión", "Proyectos de inversión de más de USD 100 millones aterrizados al año: 100 o más; de anuncio a operación en 18 meses o menos");
dg("s-eco-1-1", "s-eco-1", "Director/a General de Atracción de Inversión", "Proyectos acompañados que llegan a operar: 90 %");
dg("s-eco-1-2", "s-eco-1", "Director/a General de Parques y Polos Industriales", "Parques con energía, agua y conectividad garantizadas: 100 % de la demanda");
dg("s-eco-1-3", "s-eco-1", "Director/a General de la Ventanilla Única de Inversión", "Permisos para una planta nueva en 90 días o menos: 100 %");
dg("s-eco-1-4", "s-eco-1", "Director/a General de Proveeduría Nacional", "Contenido nacional en las exportaciones manufactureras: de 30 % a 45 %");
sub("s-eco-2", "s-eco", "Subsecretario/a de PYMES y Emprendimiento", "PYMES que crecen a medianas o grandes al año: 2 veces más; empresas que mueren antes de 2 años: −30 %");
dg("s-eco-2-1", "s-eco-2", "Director/a General de Crédito y Garantías PYME", "PYMES con crédito formal: de 30 % a 60 %");
dg("s-eco-2-2", "s-eco-2", "Director/a General de Digitalización PYME", "PYMES que venden en línea: 50 %");
dg("s-eco-2-3", "s-eco-2", "Director/a General de Apertura de Empresa en 11 Minutos", "Tiempo para abrir una empresa: 11 minutos o menos, en línea");
sub("s-eco-3", "s-eco", "Subsecretario/a de Comercio y Competitividad", "Exportaciones totales: +8 % anual; competitividad global (IMD): top 30");
dg("s-eco-3-1", "s-eco-3", "Director/a General de Comercio Exterior y Tratados", "Preferencias de los tratados aprovechadas: 100 %");
dg("s-eco-3-2", "s-eco-3", "Director/a General de Normas y Calidad", "Normas armonizadas con EE. UU. y la Unión Europea: 90 %");
dg("s-eco-3-3", "s-eco-3", "Director/a General de Protección al Consumidor", "Quejas resueltas en 11 días o menos: 90 %");
ue("s-eco", "Economía e Industria");

sec("s-rec", "c-eco", "Secretario/a de Recursos Estratégicos · minería, mares y riqueza natural",
  "Ingresos por recursos naturales con valor agregado: de USD 18,000 millones a 50,000 millones en 8 años; procesado en México: más de 50 %",
  { nota: "Agua y Ambiente protege el recurso; Recursos Estratégicos lo aprovecha. Destruir el recurso es matar la fuente de ingreso: por eso cada concesión paga su restauración." });
sub("s-rec-1", "s-rec", "Subsecretario/a de Minería Estratégica", "Valor de la producción minera con transformación nacional: de USD 4,000 millones a 15,000 millones");
dg("s-rec-1-1", "s-rec-1", "Director/a General de Litio y Minerales Críticos", "Valor del litio transformado en México: de USD 0 a 5,000 millones en 6 años");
dg("s-rec-1-2", "s-rec-1", "Director/a General de Plata, Oro y Metales Preciosos", "Plata exportada como producto procesado: 60 %");
dg("s-rec-1-3", "s-rec-1", "Director/a General de Cobre · de la mina al cable", "Cobre que sale como cable, bobina o motor: más de 40 %");
dg("s-rec-1-4", "s-rec-1", "Director/a General de Concesiones, Regalías y Restauración Minera", "Concesiones al corriente y con plan de restauración financiado: 100 %");
sub("s-rec-2", "s-rec", "Subsecretario/a de Recursos Marítimos y Pesca", "Exportaciones pesqueras y acuícolas: de USD 1,800 millones a 8,000 millones en 8 años");
dg("s-rec-2-1", "s-rec-2", "Director/a General de Pesca Industrial · Pacífico, Golfo y Caribe", "Captura con trazabilidad y certificación de origen: 80 %");
dg("s-rec-2-2", "s-rec-2", "Director/a General de Acuacultura", "Producción acuícola: de 250,000 a 800,000 toneladas al año en 6 años");
dg("s-rec-2-3", "s-rec-2", "Director/a General de Desalinización · el agua como recurso", "Capacidad de desalinización instalada en Baja California, Sonora y Quintana Roo: 1 millón de m³ al día");
dg("s-rec-2-4", "s-rec-2", "Director/a General de Recursos del Fondo Marino", "Inventario de minerales de la zona económica exclusiva: 100 %");
sub("s-rec-3", "s-rec", "Subsecretario/a de Valor Agregado e Industrialización", "Recursos procesados en México antes de exportarse: de menos de 20 % a más de 50 %");
dg("s-rec-3-1", "s-rec-3", "Director/a General de Cadenas de Valor · litio a batería, plata a panel, pesca a conserva", "Cadenas completas activas: 10 en 3 años");
dg("s-rec-3-2", "s-rec-3", "Director/a General de Puertos Especializados de Recursos", "Demoras por falta de capacidad portuaria: 0");
dg("s-rec-3-3", "s-rec-3", "Director/a General de Tecnología Avanzada en Minería", "Producción minera con robótica, sensores e inteligencia artificial: 50 %");
dg("s-rec-3-4", "s-rec-3", "Director/a General de Formación Técnica en Recursos", "Técnicos e ingenieros de minas formados: 5,000 al año");
ue("s-rec", "Recursos Estratégicos");

sec("s-agr", "c-eco", "Secretario/a de Agricultura y Alimentos", "Valor de la producción agroalimentaria por hectárea: +5 % anual; autosuficiencia en maíz, frijol, arroz y leche: 100 %");
sub("s-agr-1", "s-agr", "Subsecretario/a de Productividad del Campo", "Rendimiento promedio de maíz: de 3.9 a 6 toneladas por hectárea");
dg("s-agr-1-1", "s-agr-1", "Director/a General de Tecnificación y Riego", "Hectáreas con riego tecnificado: +1 millón");
dg("s-agr-1-2", "s-agr-1", "Director/a General de Semillas, Suelos y Agricultura de Precisión", "Productores con análisis de suelo y semilla certificada: 80 %");
dg("s-agr-1-3", "s-agr-1", "Director/a General de Pequeños Productores · del autoconsumo al mercado", "Productores que venden excedente al mercado: 2 veces más");
sub("s-agr-2", "s-agr", "Subsecretario/a de Agroexportación y Sanidad", "Exportaciones agroalimentarias: de USD 50,000 millones a 90,000 millones");
dg("s-agr-2-1", "s-agr-2", "Director/a General de Sanidad e Inocuidad", "Cierres de mercado por sanidad: 0");
dg("s-agr-2-2", "s-agr-2", "Director/a General de Agroexportación y Marca México", "Mercados nuevos abiertos al año: 5 o más");
dg("s-agr-2-3", "s-agr-2", "Director/a General de Agroindustria y Valor Agregado", "Exportación agroalimentaria procesada: de 40 % a 60 %");
sub("s-agr-3", "s-agr", "Subsecretario/a de Abasto y Precios", "Costo de la canasta básica como % del salario mínimo: −20 %");
dg("s-agr-3-1", "s-agr-3", "Director/a General de Abasto Rural y Precios de Garantía", "Localidades rurales con abasto a precio justo: 100 %");
dg("s-agr-3-2", "s-agr-3", "Director/a General de Reservas Estratégicas de Alimentos", "Días de reserva de granos básicos: 90 o más");
dg("s-agr-3-3", "s-agr-3", "Director/a General de Mercados y Logística Alimentaria", "Merma de alimentos del campo a la mesa: de 30 % a 15 %");
ue("s-agr", "Agricultura y Alimentos");

sec("s-tur", "c-eco", "Secretario/a de Turismo", "Gasto de visitantes internacionales: de USD 30,000 millones a 60,000 millones al año");
sub("s-tur-1", "s-tur", "Subsecretario/a de Promoción y Mercados", "Llegadas internacionales: de 45 millones a 70 millones; gasto por visitante: +30 %");
dg("s-tur-1-1", "s-tur-1", "Director/a General de Promoción Internacional", "Costo de promoción por visitante nuevo: a la baja cada año");
dg("s-tur-1-2", "s-tur-1", "Director/a General de Conectividad Aérea", "Asientos internacionales disponibles: +50 %");
dg("s-tur-1-3", "s-tur-1", "Director/a General de Turismo Digital y Datos", "Destinos con datos de visitantes en tiempo real: 100 %");
sub("s-tur-2", "s-tur", "Subsecretario/a de Destinos y Calidad", "Los 50 destinos principales con seguridad, agua y basura resueltas (certificación): 100 %");
dg("s-tur-2-1", "s-tur-2", "Director/a General de Destinos y Pueblos Mágicos", "Destinos certificados: 50 de 50");
dg("s-tur-2-2", "s-tur-2", "Director/a General de Calidad y Certificación de Servicios", "Prestadores certificados: 80 %");
dg("s-tur-2-3", "s-tur-2", "Director/a General de Turismo de Naturaleza y Cultura", "Visitantes a destinos de naturaleza y cultura: 2 veces más");
sub("s-tur-3", "s-tur", "Subsecretario/a de Inversión Turística", "Inversión privada en turismo: USD 10,000 millones al año");
dg("s-tur-3-1", "s-tur-3", "Director/a General de Fomento a la Inversión Turística", "Proyectos acompañados que abren: 90 %");
dg("s-tur-3-2", "s-tur-3", "Director/a General de Grandes Proyectos Turísticos", "Grandes proyectos en punto de equilibrio o rentables: 100 %");
ue("s-tur", "Turismo");

// ---------------------------------------------------------------------------------------------
// PONIENTE · TERRITORIO
sec("s-ene", "c-ter", "Secretario/a de Energía Nacional · PEMEX y CFE como divisiones",
  "Capacidad instalada: de 98 GW a 160 GW en 6 años, con precio al usuario −20 % y 50 % renovable en 2030",
  { nota: "No es un ministerio más: es uno de los tres ejes sobre los que se mide si el gobierno sirve. PEMEX y CFE son sus dos divisiones operativas; el Secretario es su director general." });
sub("s-ene-1", "s-ene", "Subsecretario/a de Generación Nacional", "GW de capacidad instalada total: de 98 a 160");
dg("s-ene-1-1", "s-ene-1", "Director/a General de Energía Solar Nacional", "GW solares instalados: de 8 a 40 en 6 años");
dg("s-ene-1-2", "s-ene-1", "Director/a General de Energía Eólica", "GW eólicos instalados: de 7 a 25");
dg("s-ene-1-3", "s-ene-1", "Director/a General de Geotérmica e Hidráulica", "GW geotérmicos e hidráulicos operando con mantenimiento óptimo: 100 % de lo instalado");
dg("s-ene-1-4", "s-ene-1", "Director/a General de Gas Natural, GNL y Almacenamiento", "Días de reserva estratégica de gas: 90 o más");
dg("s-ene-1-5", "s-ene-1", "Director/a General de Almacenamiento y Baterías", "GWh de almacenamiento instalados: 10 en 3 años");
dg("s-ene-1-6", "s-ene-1", "Director/a General de Hidrógeno Verde", "Plantas de hidrógeno verde en operación o construcción: 3 o más en 4 años");
dg("s-ene-1-7", "s-ene-1", "Director/a General de Transición Justa", "Trabajadores del sector fósil reconvertidos a renovables: 8,000 al año");
sub("s-ene-2", "s-ene", "Subsecretario/a de Distribución y Red Nacional", "Pérdidas en la red eléctrica: de 15 % a menos de 6 %; interrupción por usuario al año: de 22 horas a menos de 4");
dg("s-ene-2-1", "s-ene-2", "Director/a General de Electrificación Rural y Universal", "Hogares con electricidad confiable las 24 horas: 100 %");
dg("s-ene-2-2", "s-ene-2", "Director/a General de Medidores Inteligentes y Eficiencia", "Medidores inteligentes instalados: 100 % en 4 años; intensidad energética: +3 % de eficiencia al año");
dg("s-ene-2-3", "s-ene-2", "Director/a General de Seguridad Energética", "Apagones masivos por falta de planeación: 0");
dg("s-ene-2-4", "s-ene-2", "Director/a General de Precio de Energía para la Industria", "Electricidad industrial 25 % más barata que los competidores globales");
sub("s-ene-3", "s-ene", "Subsecretario/a de Exportación y Mercados Energéticos", "Exportación de energía a EE. UU. y Centroamérica: de USD 0 a 8,000 millones al año");
dg("s-ene-3-1", "s-ene-3", "Director/a General de Interconexiones con Estados Unidos", "Capacidad de interconexión: de 1 GW a 10 GW");
dg("s-ene-3-2", "s-ene-3", "Director/a General de Interconexiones con Centroamérica", "Capacidad de interconexión y contratos firmados con los 7 países");
dg("s-ene-3-3", "s-ene-3", "Director/a General de Contratos y Mercados de Energía", "Precio promedio de los contratos de exportación: margen máximo sobre el costo de producción");
dg("s-ene-3-4", "s-ene-3", "Director/a General de Inversión Privada y Regulación Competitiva", "Inversión extranjera en energía: USD 15,000 millones al año; mercado eléctrico con competencia real: 60 %");
sub("s-ene-px", "s-ene", "Director/a General de PEMEX · hidrocarburos y petroquímica", "Resultado operativo positivo sin subsidio en 3 años; costo por barril: menos de USD 12 (hoy ~22)", { nota: "120,000 personas. Exportar polietileno y químicos especiales vale 5 a 10 veces más que exportar el barril." });
dg("s-ene-px-1", "s-ene-px", "Director/a de Extracción y Producción de Hidrocarburos", "Producción sostenida: 1.8 millones de barriles al día con costo menor a USD 12");
dg("s-ene-px-2", "s-ene-px", "Director/a de Petroquímica y Derivados de Alto Valor", "Hidrocarburo convertido en petroquímico: de 18 % a 45 %");
dg("s-ene-px-3", "s-ene-px", "Director/a de Refinación y Procesamiento", "Utilización de refinerías: de 55 % a 85 %");
dg("s-ene-px-4", "s-ene-px", "Director/a de Exploración y Reservas", "Reemplazo de reservas: 100 % o más");
dg("s-ene-px-5", "s-ene-px", "Director/a de Eficiencia Operacional y Transformación", "Costo operativo total: −USD 3,000 millones en 4 años sin reducir producción");
dg("s-ene-px-6", "s-ene-px", "Director/a de Transición Energética PEMEX", "Inversión de PEMEX en no fósiles y petroquímica: de 5 % a 30 %");
dg("s-ene-px-7", "s-ene-px", "Director/a de Seguridad Industrial y Ambiental", "Incidentes industriales mayores: 0; metano ventilado: −80 %");
sub("s-ene-cfe", "s-ene", "Director/a General de CFE · red eléctrica nacional", "Precio de la electricidad al usuario final: −20 % en 4 años; disponibilidad de la red: 99.7 %", { nota: "80,000 personas." });
dg("s-ene-cfe-1", "s-ene-cfe", "Director/a de Generación Eléctrica CFE", "Costo de generación: menos de USD 0.04 por kWh en fuentes propias");
dg("s-ene-cfe-2", "s-ene-cfe", "Director/a de la Red Nacional de Transmisión", "Restricciones de transmisión que limiten energía renovable: 0");
dg("s-ene-cfe-3", "s-ene-cfe", "Director/a de Distribución y Atención a Clientes", "Interrupción por usuario al año: de 22 horas a menos de 4");
dg("s-ene-cfe-4", "s-ene-cfe", "Director/a de Generación Renovable CFE", "GW renovables propios: de 22 a 50 en 6 años");
dg("s-ene-cfe-5", "s-ene-cfe", "Director/a de Proyectos de Gran Escala", "Proyectos de más de 500 MW en construcción: 5 o más siempre");
dg("s-ene-cfe-6", "s-ene-cfe", "Director/a de Mantenimiento y Confiabilidad", "Disponibilidad de plantas de generación: más de 93 %");
ue("s-ene", "Energía");

sec("s-inf", "c-ter", "Secretario/a de Infraestructura, Comunicaciones y Transportes", "Costo logístico como % del PIB: de 14 % a 9 %");
sub("s-inf-1", "s-inf", "Subsecretario/a de Carreteras y Ferrocarriles", "Carga que viaja por ferrocarril: de 26 % a 40 %; red federal en buen estado: 100 %");
dg("s-inf-1-1", "s-inf-1", "Director/a General de Carreteras Federales", "Red en buen estado: 100 %; muertes en carretera: −50 %");
dg("s-inf-1-2", "s-inf-1", "Director/a General de Ferrocarriles de Carga y Pasajeros", "Kilómetros de vía nueva: 3,000");
dg("s-inf-1-3", "s-inf-1", "Director/a General de Puentes y Cruces Fronterizos", "Espera de carga en cruce fronterizo: menos de 2 horas");
sub("s-inf-2", "s-inf", "Subsecretario/a de Puertos y Aeropuertos", "Contenedores movidos al año: 2 veces más; puertos mexicanos en el top 50 mundial: 2");
dg("s-inf-2-1", "s-inf-2", "Director/a General de Puertos", "Estadía de un contenedor en puerto: menos de 3 días");
dg("s-inf-2-2", "s-inf-2", "Director/a General de Aeropuertos y Aviación Civil", "Puntualidad: 85 % o más; categoría 1 de seguridad aérea: siempre");
dg("s-inf-2-3", "s-inf-2", "Director/a General de Logística Multimodal", "Corredores con tiempo de tránsito garantizado: 100 % de la carga");
sub("s-inf-3", "s-inf", "Subsecretario/a de Comunicaciones y Conectividad Digital", "Hogares con internet de 100 Mbps o más: de 60 % a 100 %");
dg("s-inf-3-1", "s-inf-3", "Director/a General de Conectividad Universal · fibra y 5G", "Localidades sin cobertura: 0");
dg("s-inf-3-2", "s-inf-3", "Director/a General de Espectro y Satélites", "Espectro asignado y en uso: 100 %");
dg("s-inf-3-3", "s-inf-3", "Director/a General de Correos y Logística Pública", "Entrega en 3 días o menos en todo el país: 95 %");
ue("s-inf", "Infraestructura y Transportes");

sec("s-agu", "c-ter", "Secretario/a de Agua Viva y Medio Ambiente", "Población con agua potable continua las 24 horas: de 60 % a 100 %; acuíferos sobreexplotados: de 157 a 0");
sub("s-agu-1", "s-agu", "Subsecretario/a de Agua", "Hogares con agua las 24 horas: 100 %; agua residual tratada: de 60 % a 95 %");
dg("s-agu-1-1", "s-agu-1", "Director/a General de Agua Potable y Saneamiento Urbano", "Ciudades con tandeo: 0");
dg("s-agu-1-2", "s-agu-1", "Director/a General de Acuíferos y Cuencas", "Acuíferos en equilibrio: 100 %");
dg("s-agu-1-3", "s-agu-1", "Director/a General de Presas e Infraestructura Hídrica", "Presas con seguridad certificada: 100 %");
dg("s-agu-1-4", "s-agu-1", "Director/a General de Agua para el Campo", "Eficiencia del riego: de 45 % a 70 %");
sub("s-agu-2", "s-agu", "Subsecretario/a de Medio Ambiente y Biodiversidad", "Hectáreas restauradas o conservadas: +5 millones; especies en peligro con plan activo: 100 %");
dg("s-agu-2-1", "s-agu-2", "Director/a General de Áreas Naturales Protegidas y Bosques", "Deforestación neta: 0");
dg("s-agu-2-2", "s-agu-2", "Director/a General de Calidad del Aire", "Días con aire limpio en las 10 zonas metropolitanas: 90 % o más");
dg("s-agu-2-3", "s-agu-2", "Director/a General de Residuos y Economía Circular", "Residuos reciclados: de 10 % a 50 %");
dg("s-agu-2-4", "s-agu-2", "Director/a General de Impacto Ambiental en 33 Días", "Dictamen de impacto ambiental en 33 días o menos sin bajar el estándar: 100 %");
sub("s-agu-3", "s-agu", "Subsecretario/a de Clima y Resiliencia", "Emisiones netas: −35 % en 2030; municipios con atlas de riesgo y protección civil activa: 100 %");
dg("s-agu-3-1", "s-agu-3", "Director/a General de Cambio Climático y Carbono", "Mercado de carbono operando con precio público");
dg("s-agu-3-2", "s-agu-3", "Director/a General de Protección Civil y Riesgos", "Muertes por desastres: −50 %");
dg("s-agu-3-3", "s-agu-3", "Director/a General de Litorales y Manglares", "Manglares y arrecifes con protección efectiva: 100 %");
ue("s-agu", "Agua y Ambiente");

sec("s-ciu", "c-ter", "Secretario/a de Ciudad y Vivienda · desarrollo urbano", "Déficit de vivienda digna: de 8.5 millones a 0 en 10 años; traslado casa-trabajo en metrópolis: 35 minutos o menos");
sub("s-ciu-1", "s-ciu", "Subsecretario/a de Vivienda", "Viviendas nuevas asequibles y bien ubicadas al año: 1 millón");
dg("s-ciu-1-1", "s-ciu-1", "Director/a General de INFONAVIT y FOVISSSTE Integrados", "Crédito con tasa de 8 % o menos para quien gana 2 salarios mínimos o menos: 100 % de solicitantes");
dg("s-ciu-1-2", "s-ciu-1", "Director/a General de Suelo y Vivienda Bien Ubicada", "Vivienda nueva a 30 minutos o menos de empleo: 90 %");
dg("s-ciu-1-3", "s-ciu-1", "Director/a General de Mejoramiento y Regularización", "Viviendas con hacinamiento o sin servicios: 0");
sub("s-ciu-2", "s-ciu", "Subsecretario/a de Movilidad Urbana", "Viajes en transporte público o bicicleta en las 10 metrópolis: de 45 % a 65 %");
dg("s-ciu-2-1", "s-ciu-2", "Director/a General de Transporte Masivo · metro, BRT y trenes suburbanos", "Kilómetros nuevos de transporte masivo: 500");
dg("s-ciu-2-2", "s-ciu-2", "Director/a General de Calles Seguras y Movilidad Activa", "Muertes viales: −50 %");
dg("s-ciu-2-3", "s-ciu-2", "Director/a General de Integración Tarifaria y Digital", "Un solo pago para todo el transporte de cada metrópoli: 10 de 10");
sub("s-ciu-3", "s-ciu", "Subsecretario/a de Ordenamiento y Ciudades", "Ciudades de más de 100,000 habitantes con plan de desarrollo vigente y cumplido: 100 %");
dg("s-ciu-3-1", "s-ciu-3", "Director/a General de Planeación Metropolitana", "Metrópolis con autoridad metropolitana y plan único: 100 %");
dg("s-ciu-3-2", "s-ciu-3", "Director/a General de Catastro y Registro Nacional de Suelo", "Predios con catastro digital (con La Fábrica): 100 %");
dg("s-ciu-3-3", "s-ciu-3", "Director/a General de Espacio Público y Parques", "Hogares urbanos con un parque a 11 minutos caminando o menos: 100 %");
ue("s-ciu", "Ciudad y Vivienda");

// La mesa de los 32 estados (rango de secretaría, lado Poniente)
sec("s-est", "c-ter", "Coordinador/a Nacional de Estados y Municipios",
  "Convergencia: brecha entre el estado más rezagado y la media nacional en los 4 KPIs de sector: −10 % anual",
  { nota: "Rango de secretario. Todos los estados y municipios se dirigen desde aquí, con una mesa por estado: una sola cara del gobierno frente a cada gobernador. Una vez al mes, los 32 delegados y el Presidente en la Sala del Gabinete." });
const REGIONES = [
  ["norte", "Norte", ["Baja California", "Sonora", "Chihuahua", "Coahuila", "Nuevo León", "Tamaulipas", "Durango"]],
  ["pacifico", "Pacífico", ["Baja California Sur", "Sinaloa", "Nayarit", "Jalisco", "Colima", "Michoacán"]],
  ["centro", "Centro", ["Zacatecas", "San Luis Potosí", "Aguascalientes", "Guanajuato", "Querétaro", "Hidalgo", "Estado de México"]],
  ["centro-sur", "Centro-Sur", ["Ciudad de México", "Morelos", "Tlaxcala", "Puebla", "Guerrero", "Oaxaca"]],
  ["golfo", "Golfo y Sureste", ["Veracruz", "Tabasco", "Campeche", "Yucatán", "Quintana Roo", "Chiapas"]],
];
for (const [k, nombre, estados] of REGIONES) {
  sub("est-" + k, "s-est", "Coordinador/a Regional · " + nombre, `Los ${estados.length} estados de la región con su tablero mensual cumplido: 100 %`, { ola: 3 });
  for (const estado of estados) {
    const id = "est-" + k + "-" + estado.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-");
    dir(id, "est-" + k, "Delegado/a Nacional de Estado · " + estado,
      `${estado} converge a la media nacional en los 4 KPIs de sector; decisiones del Tablero bajadas al gobernador y a los alcaldes en 11 minutos o menos: 100 %`,
      { ola: 3, nota: "Una sola cara del gobierno por estado. Su mesa de 11: los 4 enlaces sectoriales, 3 analistas de municipios, 2 de datos, 1 jurídico y 1 secretario. Su tablero es el del estado.",
        gen: rol("Integrante de la mesa de " + estado + " (analista de municipios, datos, jurídico o secretaría)", 7, "Su parte del tablero del estado al día: 100 %", 7, "Jefe/a de la mesa del estado") });
    pon(id + "-campo", id, "Jefe/a de la Oficina en Campo · " + estado, `Oficina en la capital de ${estado} con enlace permanente al Tablero: decisiones ejecutadas en el estado en plazo: 100 %`,
      { n: 5, ola: 4, gen: rol("Delegado/a en campo · " + estado, 40, "Municipios de su cartera con decisiones ejecutadas y reportadas en plazo: 100 %") });
  }
}
sub("est-mesas", "s-est", "Coordinador/a de Mesas Transversales · municipios, datos y replicación", "Los 2,478 municipios con reglas comunes, mapa vivo y programas replicados: 100 %", { ola: 3 });
dir("est-mun", "est-mesas", "Director/a de la Mesa de Municipios", "Los 2,478 municipios con las reglas comunes aplicadas (agua, residuos, seguridad, catastro, obra): 100 %; municipios con cuentas públicas al día: 100 %",
  { nota: "Escucha a las asociaciones de alcaldes. Reparto por tamaño: capitales y metrópolis, ciudades medias, municipios rurales.", gen: rol("Analista de municipios", 33, "Municipios de su cartera con reglas comunes verificadas: 100 %", 11, "Jefe/a de mesa por tamaño de municipio") });
dir("est-datos", "est-mesas", "Director/a de la Mesa de Datos Territoriales", "Mapa vivo del país con cada obra, programa y queja por municipio, con latencia menor a 24 horas: 100 %",
  { gen: rol("Analista de datos territoriales", 22, "Capas del mapa de su región al día: 100 %", 11, "Jefe/a de datos regionales") });
dir("est-replica", "est-mesas", "Director/a de Replicación a Estados Rezagados", "Velocidad de convergencia de los 8 estados más rezagados a la media nacional: brecha −15 % anual",
  { gen: rol("Asesor/a de replicación en estados rezagados", 24, "Programas replicados en su estado con resultado medido: 100 %") });
ue("s-est", "Estados y Municipios");

// =============================================================================================
// 3 · LOS CONTRAPESOS AUTÓNOMOS (no reportan al Presidente; la Cámara lo vigila y puede destituirlo)
pon("cam", "pres", "Cámara de Bases y Revisión · 80 ciudadanos",
  "Presupuesto y enmiendas votados en plazo con voto nominal público en 24 horas o menos: 100 %; días de sesión al año: 60 o menos",
  { n: 1, s: "autonomos", ola: 3, punteada: "vigila y puede destituir",
    nota: "Reemplaza a la Cámara de Diputados y al Senado: de 629 personas a 80 ciudadanos. No reporta al Presidente: lo vigila y puede destituirlo (80 % de los votos y KPIs fallidos dos periodos). 32 por sorteo cívico con examen, 24 de los Consejos Nacionales, 24 de los estados. Tres años, sin reelección, sin staff, sin discursos, sin lobbying. Vota sí o no al presupuesto y a las enmiendas; confirma o rechaza a los titulares autónomos." });
sub("cam-sec", "cam", "Secretario/a Técnico/a de la Cámara", "Sesiones con voto formal documentado en plazo: 100 %", { ola: 3, nota: "El único cargo permanente de la Cámara: garantiza que los 80 tengan la información que necesitan." });
dir("cam-presupuesto", "cam-sec", "Director/a de Análisis Independiente de Presupuesto", "Análisis entregado a los 80 con 15 días o más de anticipación: 100 %", { ola: 3, gen: rol("Analista independiente de presupuesto", 30, "Análisis sin error de cifra: 100 %") });
dir("cam-constitucion", "cam-sec", "Director/a de Validación Constitucional", "Enmiendas con análisis de impacto constitucional completo antes de votarse: 100 %", { ola: 3, gen: rol("Analista constitucional", 20, "Análisis entregados en plazo: 100 %") });
dir("cam-kpis", "cam-sec", "Director/a de Evaluación Independiente de los KPIs Presidenciales", "Reporte semestral independiente de los KPIs presidenciales publicado: 100 %; activa la revisión si fallan dos periodos", { ola: 3, nota: "No es el reporte del gobierno: es uno externo.", gen: rol("Evaluador/a independiente de KPIs", 25, "Indicadores verificados contra fuente primaria: 100 %") });
dir("cam-transparencia", "cam-sec", "Director/a de Procesos, Transparencia y Comunicación", "Votos de los 80 publicados con nombre y justificación en 24 horas o menos: 100 %", { ola: 3, gen: rol("Oficial de transparencia", 15, "Publicaciones en plazo: 100 %") });
dir("cam-sorteo", "cam-sec", "Director/a de Sorteo Cívico y Padrón · lo que queda del INE", "Los 32 sorteados verificados contra el padrón del INEGI: 100 %; impugnaciones fundadas: 0",
  { ola: 3, nota: "El INE desaparece como aparato: el sorteo cívico y el examen de calificación los administra esta dirección con el padrón del INEGI.", gen: rol("Oficial de sorteo y padrón", 30, "Sorteos auditados y públicos: 100 %") });
for (const [id, t, kpi, nota] of [
  ["aut-fgr", "Fiscal General de la República", "Denuncias judicializadas: 60 % o más; sentencias firmes en casos de corrupción al año: 20 o más", "6,000 personas."],
  ["aut-scjn", "Presidente/a de la Suprema Corte de Justicia", "Amparos resueltos en 6 meses o menos: 100 %", "4,000 personas."],
  ["aut-banxico", "Gobernador/a del Banco de México", "Inflación: 3 % ±1; tipo de cambio estable", "3,500 personas."],
  ["aut-inegi", "Presidente/a del INEGI", "Índice de Calidad Estadística de la OCDE: top 20; Índice de Felicidad medido y publicado cada mes", "5,000 personas. Mide los números por los que se juzga al gobierno; por eso no depende de él."],
  ["aut-asf", "Auditor/a Superior de la Federación", "Irregularidades recuperadas: más de MXN 30,000 millones al año", "1,500 personas."],
  ["aut-cofece", "Presidente/a de la Comisión de Competencia (COFECE)", "Casos de colusión concluidos con sanción: 5 relevantes al año o más", "400 personas."],
  ["aut-ift", "Presidente/a del Instituto de Telecomunicaciones (IFT)", "Precio de los datos móviles frente a la OCDE: en el cuartil más accesible", "400 personas."],
  ["aut-cndh", "Presidente/a de la Comisión de Derechos Humanos (CNDH)", "Recomendaciones implementadas por las autoridades: 70 % o más", "500 personas."],
  ["aut-tfja", "Presidente/a del Tribunal Federal de Justicia Administrativa", "Juicios contenciosos resueltos en 12 meses o menos: 100 %", "800 personas."],
]) sec(id, "cam", t, kpi, { s: "autonomos", ola: 3, punteada: "nombramiento confirmado por la Cámara", nota: nota + " Su presupuesto lo aprueba la Cámara de Bases; su nombramiento lo confirma la Cámara." });
sub("aut-fgr-antic", "aut-fgr", "Fiscal Anticorrupción", "Casos de corrupción de alto nivel con sentencia firme al año: 20 o más", { ola: 3 });
sub("aut-fgr-alto", "aut-fgr", "Fiscal de Delitos de Alto Impacto", "Homicidios con imputado: 60 %", { ola: 3 });
sub("aut-inegi-fel", "aut-inegi", "Director/a de la Encuesta Nacional de Felicidad y Bienestar", "Encuesta mensual publicada el día 1 con desagregación por estado: 100 %", { ola: 3 });
sub("aut-inegi-padron", "aut-inegi", "Director/a del Censo y Padrón Nacional", "Padrón nacional con identidad digital conciliado: 100 %; es la base del sorteo cívico", { ola: 3 });

// =============================================================================================
// RLR · resolución: sector heredado, nivel por tipo, ola por nivel, índice y generación perezosa
const indice = new Map(P.map((x) => [x.id, x]));
for (const x of P) {
  if (!x.s) { let a = indice.get(x.padre); while (a && !a.s) a = indice.get(a.padre); x.s = a ? a.s : "presidencia"; }
  if (x.n == null) x.n = (indice.get(x.padre)?.n ?? 0) + 1;
  if (x.ola == null) x.ola = [2, 2, 3, 4, 5, 6, 6, 6, 6][x.n] || 6;
  x.hijos = [];
}
for (const x of P) if (x.padre) indice.get(x.padre).hijos.push(x.id);
export const PUESTOS = P;
export const porId = (id) => indice.get(id) || generado(id);
export const raiz = indice.get("pres");

// Un puesto generado por plantilla se reconoce por la virgulilla en su id: <padre>~da1~jm~jb2~a5 o <padre>~g3~r7
const memo = new Map();
export function generado(id) {
  if (memo.has(id)) return memo.get(id);
  const i = id.indexOf("~"); if (i < 0) return null;
  const base = indice.get(id.slice(0, i)); if (!base) return null;
  const partes = id.slice(i + 1).split("~");
  const corto = base.t.replace(/^(Director\/a General de |Director\/a de |Subsecretario\/a de |Subsecretario\/a Nacional de |Subdirector\/a Nacional de |Secretario\/a de |Jefe\/a de |Coordinador\/a de |Arquitecto\/a de Sistema · |Delegado\/a Nacional de Estado · |Delegado\/a de Talento · |Decano\/a de )/, "");
  let nodo = null, padre = id.slice(0, id.lastIndexOf("~"));
  if (base.cel === "dg") {
    const [da, jm, jb, a] = partes;
    if (partes.length === 1) nodo = { t: `Director/a de área ${da.slice(2)} · ${corto}`, kpi: KPI_PLANTILLA.area, n: 5 };
    else if (partes.length === 2) nodo = { t: `Jefe/a de manzana · ${corto} · área ${da.slice(2)}`, kpi: KPI_PLANTILLA.manzana, n: 6 };
    else if (partes.length === 3) nodo = { t: `Jefe/a de barrio ${jb.slice(2)} · ${corto} · área ${da.slice(2)}`, kpi: KPI_PLANTILLA.barrio, n: 7 };
    else if (partes.length === 4) nodo = { t: `Analista ${a.slice(1)} · ${corto} · área ${da.slice(2)} · barrio ${jb.slice(2)}`, kpi: KPI_PLANTILLA.analista, n: 8 };
  } else if (base.gen) {
    const g = base.gen, por = g.por || 8, grupos = Math.ceil(g.n / por);
    const gi = +partes[0].slice(1);
    if (partes.length === 1) nodo = { t: `${g.jefe || "Jefe/a de barrio"} ${grupos > 1 ? gi + " de " + grupos + " " : ""}· ${g.rol.replace(/ \(.*$/, "")}`, kpi: KPI_PLANTILLA.jefeRol, n: 7 };
    else if (partes.length === 2) nodo = { t: `${g.rol} · ${(gi - 1) * por + +partes[1].slice(1)}`, kpi: g.kpi || KPI_PLANTILLA.analista, n: 8 };
  }
  if (!nodo) return null;
  const r = { id, padre, s: base.s, ola: 6, generado: true, ...nodo };
  memo.set(id, r); return r;
}
// Los hijos de cualquier puesto, nombrados y generados
export function hijos(id) {
  const x = porId(id); if (!x) return [];
  const out = (x.hijos || []).map((h) => indice.get(h));
  if (x.generado) {
    const i = id.indexOf("~"), base = indice.get(id.slice(0, i)), partes = id.slice(i + 1).split("~");
    if (base.cel === "dg") {
      if (partes.length === 1) out.push(generado(id + "~jm"));
      else if (partes.length === 2) for (let j = 1; j <= 4; j++) out.push(generado(id + "~jb" + j));
      else if (partes.length === 3) for (let k = 1; k <= 8; k++) out.push(generado(id + "~a" + k));
    } else if (base.gen && partes.length === 1) {
      const por = base.gen.por || 8, gi = +partes[0].slice(1), desde = (gi - 1) * por, hasta = Math.min(base.gen.n, gi * por);
      for (let k = 1; k <= hasta - desde; k++) out.push(generado(id + "~r" + k));
    }
  } else {
    if (x.cel === "dg") for (let i = 1; i <= 4; i++) out.push(generado(id + "~da" + i));
    if (x.gen) { const grupos = Math.ceil(x.gen.n / (x.gen.por || 8)); for (let g = 1; g <= grupos; g++) out.push(generado(id + "~g" + g)); }
  }
  return out.filter(Boolean);
}
// Cuántas plazas hay bajo un puesto, incluyéndolo (forma cerrada para lo generado)
const memoTotal = new Map();
export function total(id) {
  if (memoTotal.has(id)) return memoTotal.get(id);
  const x = porId(id); if (!x) return 0;
  let t = 1;
  if (x.generado) { for (const h of hijos(id)) t += total(h.id); }
  else {
    for (const h of x.hijos) t += total(h);
    if (x.cel === "dg") t += 4 * (1 + 1 + 4 * (1 + 8));
    if (x.gen) t += Math.ceil(x.gen.n / (x.gen.por || 8)) + x.gen.n;
  }
  memoTotal.set(id, t); return t;
}
export const ruta = (id) => { const r = []; let x = porId(id); while (x) { r.unshift(x); x = x.padre ? porId(x.padre) : null; } return r; };
// Importancia para reclutar: primero la ola, luego el rango, luego el orden en que aparece aquí
export const importancia = (x) => x.ola * 1000 + x.n * 100 + (x.generado ? 99 : Math.min(99, P.indexOf(indice.get(x.id)) / 10));
// RLR · Ricardo López Reyero · EYE · 181218

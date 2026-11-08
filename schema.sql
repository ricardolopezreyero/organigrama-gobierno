-- RLR · Organigrama de Gobierno 2.0 · lo que cambia de cada puesto — Ricardo López Reyero
CREATE TABLE IF NOT EXISTS puestos (
  id TEXT PRIMARY KEY,
  estatus TEXT NOT NULL DEFAULT 'pausado',
  nombre TEXT, foto TEXT, cv TEXT, porque TEXT,
  actualizado INTEGER NOT NULL, por TEXT
);
CREATE TABLE IF NOT EXISTS bitacora (
  n INTEGER PRIMARY KEY AUTOINCREMENT,
  puesto TEXT NOT NULL, campo TEXT NOT NULL, antes TEXT, despues TEXT, por TEXT, cuando INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bitacora_puesto ON bitacora(puesto, n);

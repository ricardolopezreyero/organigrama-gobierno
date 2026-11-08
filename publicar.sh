#!/bin/bash
# RLR · Valida el organigrama, copia datos y documentos a sitio/ y publica en organigrama.capitaltorreon.com
set -e
cd "$(dirname "$0")"
node datos/validar.mjs
node --check src/index.js && node --check sitio/app.js
cp datos/puestos.js sitio/puestos.js
cp LOGICA.md PROMPT.md sitio/
env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID npx wrangler deploy

#!/bin/bash
# ZIP de entrega v4 — mismas exclusiones que v2/v3, .env portable
set -e
cd /home/z/my-project

OUT="download/al-otro-lado-playa-2026-09-27-v5.zip"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

# Copiar árbol del proyecto excluyendo pesos y carpetas internas
rsync -a \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'audit' \
  --exclude 'skills' \
  --exclude 'examples' \
  --exclude 'tests' \
  --exclude 'mini-services' \
  --exclude 'download' \
  --exclude 'upload' \
  --exclude 'scripts/*/tmp' \
  --exclude 'tool-results' \
  ./ "$STAGE/al-otro-lado-de-la-playa/"

# .env portable (ruta relativa de Prisma)
cat > "$STAGE/al-otro-lado-de-la-playa/.env" << 'ENVEOF'
DATABASE_URL=file:../db/custom.db
ENVEOF

rm -f "$OUT"
cd "$STAGE/al-otro-lado-de-la-playa"
zip -rq "$OLDPWD/$OUT" . -x '*.DS_Store'
cd "$OLDPWD"

echo "== $OUT =="
unzip -l "$OUT" | tail -2
unzip -l "$OUT" | rg "\.env|README" | head -5

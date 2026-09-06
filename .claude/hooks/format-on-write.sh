#!/bin/bash
set -e

# Lee el evento JSON desde stdin y extrae file_path
event=$(cat)
file_path=$(echo "$event" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

# Si no se pudo extraer, intenta con node como fallback
if [ -z "$file_path" ]; then
  file_path=$(echo "$event" | node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log(d?.tool_input?.file_path || '')" 2>/dev/null || echo "")
fi

# Si aún no hay ruta, termina sin error
if [ -z "$file_path" ]; then
  exit 0
fi

# Si el archivo no existe, termina sin error
if [ ! -f "$file_path" ]; then
  exit 0
fi

# Obtén la extensión
ext="${file_path##*.}"

# Si la extensión no es soportada, termina sin error
case "$ext" in
  ts|tsx|js|jsx|json|css|md|mjs|cjs)
    ;;
  *)
    exit 0
    ;;
esac

# Corre prettier
npx prettier --write "$file_path" 2>/dev/null || true

# Si es JS/TS, también corre eslint --fix
case "$ext" in
  ts|tsx|js|jsx|mjs|cjs)
    npx eslint --fix "$file_path" 2>/dev/null || true
    ;;
esac

exit 0

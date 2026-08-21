#!/usr/bin/env bash
# Fetch one Material Symbol and normalise it into src/icons/.
#
# Material Symbols ship as filled glyphs on a `0 -960 960 960` viewBox with no
# fill attribute at all, so they default to black and vanish on this site's dark
# theme. This script fixes that and strips the fixed width/height so CSS controls
# size, matching the icons already in src/icons/.
#
#   ./add-icon.sh memory            -> src/icons/memory.svg
#   ./add-icon.sh memory chip       -> src/icons/chip.svg  (rename on the way in)
#   STYLE=rounded ./add-icon.sh bolt
#   WEIGHT=400 ./add-icon.sh bolt   (default is 300 — see the note below)
set -euo pipefail

SYMBOL="${1:?usage: add-icon.sh <material-symbol-name> [local-name]}"
LOCAL="${2:-$SYMBOL}"
STYLE="${STYLE:-outlined}"   # outlined | rounded | sharp
# 300 by default, not Material's own 400: compared side by side against the
# existing stroke icons at 24px, 400 reads visibly heavier and 200 too thin.
WEIGHT="${WEIGHT:-300}"      # 100..700, or empty for Material's default 400
OPSZ="${OPSZ:-24}"           # 20 | 24 | 40 | 48

case "$STYLE" in outlined|rounded|sharp) ;; *) echo "STYLE must be outlined|rounded|sharp" >&2; exit 2;; esac

REPO_ROOT="$(git rev-parse --show-toplevel)"
DEST="$REPO_ROOT/src/icons/${LOCAL}.svg"
[ -e "$DEST" ] && { echo "refusing to overwrite $DEST" >&2; exit 3; }

suffix=""
[ -n "$WEIGHT" ] && suffix="_wght${WEIGHT}"
FILE="${SYMBOL}${suffix}_${OPSZ}px.svg"
URL="https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/${SYMBOL}/materialsymbols${STYLE}/${FILE}"

TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
curl -fsSL "$URL" -o "$TMP" || { echo "not found: $URL" >&2; echo "check the name at fonts.google.com/icons" >&2; exit 4; }
grep -q '<svg' "$TMP" || { echo "not an SVG: $URL" >&2; exit 5; }

python3 - "$TMP" "$DEST" <<'PY'
import re, sys
src, dest = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read().strip()
# Size comes from the class (h-4 w-4 ...), never from the file.
s = re.sub(r'\s(?:width|height)="[^"]*"', '', s, count=2)
# No fill attribute means black, which is invisible on the dark theme.
if 'fill=' not in s.split('>', 1)[0]:
    s = s.replace('<svg', '<svg fill="currentColor"', 1)
s = re.sub(r'fill="(#000000|#000|black)"', 'fill="currentColor"', s)
open(dest, "w", encoding="utf-8").write(s + "\n")
print(f"wrote {dest}")
PY

echo "import it as:  import Icon$(python3 -c "print(''.join(w.capitalize() for w in '$LOCAL'.replace('-','_').split('_')))") from \"@/icons/${LOCAL}.svg\""

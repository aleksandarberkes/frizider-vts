#!/usr/bin/env bash
# Run this ON THE SERVER after `git pull` (or let the post-merge hook run it).
# It builds the React frontend and publishes the built files next to the API,
# in place at the web root. The PHP API is served straight from ./backend.
#
#   cd ~/public_html && git pull && bin/publish.sh
#
set -euo pipefail

# Move to the repo root (= web root), regardless of where this is called from.
cd "$(dirname "$0")/.."

# Load nvm so `npm` is available in non-interactive shells.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "==> Installing frontend deps + building..."
npm --prefix frontend ci
npm --prefix frontend run build

echo "==> Publishing built site to the web root..."
# Copy the build output (index.html, static/, appicons/, images/, .htaccess)
# alongside backend/. Dotfiles included.
cp -a frontend/build/. .

echo "==> Done. Site is live."

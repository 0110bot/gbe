#!/bin/bash
cd "$(dirname "$0")/sim"

echo "🔨 Building Vite project..."
npm run build || { echo "❌ Build failed"; exit 1; }

echo "📂 Copying to live sim/ folder..."
cp -r dist/* ../sim/

cd ..
git add sim/
git commit -m "Update sim deployment"
git push origin main

echo "✅ sim/ page is now live at: https://0110bot.github.io/gbe/sim/"

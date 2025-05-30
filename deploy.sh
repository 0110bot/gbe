#!/bin/bash
cd "$(dirname "$0")/sim"

echo "🔨 Building Vite site..."
npm run build

echo "🚀 Moving build output to ../sim_live/"
rm -rf ../sim_live/
mkdir -p ../sim_live/
cp -r dist/* ../sim_live/

cd ..
git add sim_live/
git commit -m "Deploy latest sim build"
git push origin main

echo "✅ Live site updated at: https://0110bot.github.io/gbe/sim_live/"

#!/bin/bash

# Set paths
DEV_DIR="sim_dev"
DEPLOY_DIR="sim"
BUILD_DIR="$DEV_DIR/dist"

# Step 1: Build the project
echo "🔨 Building Vite app from $DEV_DIR..."
cd "$DEV_DIR"
npm run build || { echo "❌ Build failed"; exit 1; }

# Step 2: Replace deploy folder with build output
echo "🚚 Updating $DEPLOY_DIR with build output..."
cd ..
rm -rf "$DEPLOY_DIR"
mkdir "$DEPLOY_DIR"
cp -r "$BUILD_DIR/"* "$DEPLOY_DIR/"

# Step 3: Commit and push changes
echo "📦 Staging deployment folder for commit..."
git add "$DEPLOY_DIR"
git commit -m "Deploy latest build to /sim"
git push origin main

echo "✅ Deployment complete: https://0110bot.github.io/gbe/sim/"
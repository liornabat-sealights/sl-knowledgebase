#!/bin/bash

# Script to rebuild the web assets
# 1. Delete the content of src/web
# 2. Build the React project in src/web-src
# 3. Copy the build output to src/web
# 4. Add src/web to git

# Print each command before executing it
set -x

echo "Starting the web rebuild process..."

# 1. Delete the content of src/web (ensure the directory exists but is empty)
if [ -d "src/web" ]; then
  rm -rf src/web/*
else
  mkdir -p src/web
fi

# 2. Navigate to src/web-src and run the build script
cd src/web-src || exit 1
echo "Building the React project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed! Exiting..."
  exit 1
fi

# 3. Copy the build output from dist to src/web
echo "Copying build output to src/web..."
cp -R dist/* ../web/

# 4. Add src/web to git
echo "Adding src/web folder to git..."
cd ../ || exit 1  # Go back to the root directory
git add src/web
echo "src/web folder has been staged in git"

echo "Web rebuild completed successfully!"
echo "Note: If you've modified quick questions configuration, you may need to restart the backend API service for changes to take effect." 
#!/bin/bash

REQUIRED_FILES=("index.html" "style.css" "js/logic.js")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
  echo "❌ Missing required files: ${MISSING_FILES[*]}"
  exit 1
else
  echo "✅ All required files found."
  exit 0
fi

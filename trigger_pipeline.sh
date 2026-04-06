#!/bin/bash
# Trigger Montridge pipeline on Render
# Usage: ./trigger_pipeline.sh

API_URL="https://montridge.onrender.com/api/pipeline/trigger"

echo "Triggering pipeline..."
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v

echo -e "\n✓ Pipeline triggered. Check Render logs for progress."

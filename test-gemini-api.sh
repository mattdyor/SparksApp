#!/bin/bash

# Test Gemini API with curl
# Replace YOUR_API_KEY with your actual API key

YOUR_API_KEY="AIzaSyBydw6w7uXp8q2350gxdXGG95neF3czr98"

# Simple test prompt
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=$YOUR_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts": [{
          "text": "Hello Gemini 3! What are your standout features?"
        }]
      }]
    }'
echo ""



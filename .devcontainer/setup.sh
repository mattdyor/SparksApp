#!/bin/bash
set -e

echo "🚀 Setting up SparksApp development environment..."

# Install dependencies
echo "📦 Installing npm packages..."
npm install

# Setup environment variables if .env doesn't exist
if [ ! -f .env ]; then
    echo "🔑 Creating .env file from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "⚠️  IMPORTANT: Edit .env file with your Firebase credentials!"
        echo "   You can find these in Firebase Console > Project Settings > General"
    else
        echo "❌ Warning: .env.example not found"
    fi
else
    echo "✅ .env file already exists"
fi

# Display helpful information
echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 To start developing with Expo Go:"
echo "   1. Run: npx expo start --tunnel"
echo "   2. Open Expo Go app on your phone"
echo "   3. Scan the QR code that appears"
echo ""
echo "🔑 Don't forget to configure your .env file with Firebase credentials!"
echo ""

#!/bin/bash

echo "🌟 Golden Glow - Netlify Webhook Setup"
echo "======================================="
echo ""
echo "This script will help you set up the Final Clean Webhook on Netlify"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Please install it first:"
    echo "npm install -g netlify-cli"
    exit 1
fi

echo "✅ Netlify CLI found"
echo ""

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Visit your Netlify site"
echo "2. Navigate to /webhook-setup.html"
echo "3. Click 'Set Final Clean Webhook'"
echo "4. Test your bot by sending /start to @TheGoldenGlow_bot"
echo ""
echo "🎮 Your bot should now work without backup channel messages!"
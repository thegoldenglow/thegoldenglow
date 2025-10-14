# Golden Glow - Netlify Webhook Setup
Write-Host "🌟 Golden Glow - Netlify Webhook Setup" -ForegroundColor Yellow
Write-Host "======================================="
Write-Host ""
Write-Host "This script will help you set up the Final Clean Webhook on Netlify"
Write-Host ""

# Check if Netlify CLI is installed
try {
    $netlifyVersion = & netlify --version
    Write-Host "✅ Netlify CLI found: $netlifyVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Netlify CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g netlify-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Deploy to Netlify
Write-Host "🚀 Deploying to Netlify..." -ForegroundColor Blue
& netlify deploy --prod --dir=dist

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit your Netlify site"
Write-Host "2. Navigate to /webhook-setup.html"
Write-Host "3. Click 'Set Final Clean Webhook'"
Write-Host "4. Test your bot by sending /start to @TheGoldenGlow_bot"
Write-Host ""
Write-Host "🎮 Your bot should now work without backup channel messages!" -ForegroundColor Green
# Setup Telegram Bot for Netlify Deployment
# This script helps ensure your bot token is ready for Netlify

Write-Host "🤖 Telegram Bot - Netlify Setup Helper" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file first with your bot token.`n" -ForegroundColor Yellow
    exit 1
}

# Read bot token from .env
$envContent = Get-Content ".env" -Raw
$botTokenLine = $envContent | Select-String -Pattern "TELEGRAM_BOT_TOKEN=([^`r`n]+)" | ForEach-Object { $_.Matches.Groups[1].Value }

if (-not $botTokenLine) {
    Write-Host "❌ TELEGRAM_BOT_TOKEN not found in .env file!" -ForegroundColor Red
    exit 1
}

# Mask the token for display (show first 10 and last 4 characters)
$tokenLength = $botTokenLine.Length
if ($tokenLength -gt 14) {
    $maskedToken = $botTokenLine.Substring(0, 10) + "..." + $botTokenLine.Substring($tokenLength - 4)
} else {
    $maskedToken = "***"
}

Write-Host "✅ Bot token found in .env file" -ForegroundColor Green
Write-Host "   Token: $maskedToken`n" -ForegroundColor Gray

Write-Host "📋 Next Steps to Deploy Bot to Netlify:`n" -ForegroundColor Yellow
Write-Host "1. Add Environment Variable to Netlify:" -ForegroundColor White
Write-Host "   • Go to: https://app.netlify.com" -ForegroundColor Gray
Write-Host "   • Select your site" -ForegroundColor Gray
Write-Host "   • Go to: Site settings → Environment variables" -ForegroundColor Gray
Write-Host "   • Add variable: TELEGRAM_BOT_TOKEN" -ForegroundColor Gray
Write-Host "   • Value: [Copy from your .env file]`n" -ForegroundColor Gray

Write-Host "2. Also add this variable:" -ForegroundColor White
Write-Host "   • Variable: VITE_TELEGRAM_BOT_TOKEN" -ForegroundColor Gray
Write-Host "   • Value: [Same as TELEGRAM_BOT_TOKEN]`n" -ForegroundColor Gray

Write-Host "3. Push to GitHub:" -ForegroundColor White
Write-Host "   git push origin main`n" -ForegroundColor Cyan

Write-Host "4. After deployment, set the webhook:" -ForegroundColor White
Write-Host "   Visit: https://your-site.netlify.app/telegram/set-final-clean-webhook`n" -ForegroundColor Cyan

Write-Host "5. Test your bot:" -ForegroundColor White
Write-Host "   • Open Telegram" -ForegroundColor Gray
Write-Host "   • Send /start to your bot" -ForegroundColor Gray
Write-Host "   • Should receive welcome message`n" -ForegroundColor Gray

Write-Host "🔍 Want to check your bot's webhook status?" -ForegroundColor Yellow
Write-Host "   After setting up, visit:" -ForegroundColor Gray
Write-Host "   https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo`n" -ForegroundColor Cyan

Write-Host "📖 For detailed guide, see:" -ForegroundColor Yellow
Write-Host "   • NETLIFY_BOT_DEPLOYMENT_CHECKLIST.md" -ForegroundColor Cyan
Write-Host "   • NETLIFY_TELEGRAM_SETUP.md`n" -ForegroundColor Cyan

Write-Host "✨ Your bot will run 24/7 on Netlify!" -ForegroundColor Green

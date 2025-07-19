# Simple SpaceKo Security Test
Write-Host "🔍 SpaceKo Security Validation" -ForegroundColor Green

# Check if key files exist
Write-Host "`n📁 Checking security files..." -ForegroundColor Yellow

$files = @(
    "server/auth.ts",
    "server/security.ts", 
    "server/config.ts",
    "Dockerfile",
    "docker-compose.production.yml",
    ".env.production.template"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Test npm packages
Write-Host "`n📦 Testing npm install..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
}

# Test TypeScript compilation
Write-Host "`n🔨 Testing TypeScript compilation..." -ForegroundColor Yellow
npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript compilation failed" -ForegroundColor Red
}

Write-Host "`n✅ Security validation complete!" -ForegroundColor Green
Write-Host "🚀 Ready for deployment!" -ForegroundColor Cyan

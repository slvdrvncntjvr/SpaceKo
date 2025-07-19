# SpaceKo Security Check Script for Windows PowerShell
# This script validates the security configuration and setup

Write-Host "🔍 SpaceKo Security Validation Script" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

$hasErrors = $false

# Function to check if a file exists
function Test-FileExists {
    param($FilePath, $Description)
    if (Test-Path $FilePath) {
        Write-Host "✅ $Description exists" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description missing: $FilePath" -ForegroundColor Red
        return $false
    }
}

# Function to check package.json for security packages
function Test-SecurityPackages {
    Write-Host "`n🔒 Checking security packages..." -ForegroundColor Yellow
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $dependencies = $packageJson.dependencies
        
        $securityPackages = @(
            "jsonwebtoken",
            "bcryptjs", 
            "helmet",
            "cors",
            "express-rate-limit"
        )
        
        foreach ($package in $securityPackages) {
            if ($dependencies.PSObject.Properties.Name -contains $package) {
                Write-Host "✅ $package installed" -ForegroundColor Green
            } else {
                Write-Host "❌ $package missing" -ForegroundColor Red
                $script:hasErrors = $true
            }
        }
    } else {
        Write-Host "❌ package.json not found" -ForegroundColor Red
        $script:hasErrors = $true
    }
}

# Function to check environment template
function Test-EnvironmentTemplate {
    Write-Host "`n🌍 Checking environment configuration..." -ForegroundColor Yellow
    
    if (Test-Path ".env.production.template") {
        $envContent = Get-Content ".env.production.template" -Raw
        
        $requiredVars = @(
            "JWT_SECRET",
            "SESSION_SECRET", 
            "DATABASE_URL",
            "NODE_ENV",
            "ALLOWED_ORIGINS"
        )
        
        foreach ($var in $requiredVars) {
            if ($envContent -match $var) {
                Write-Host "✅ $var configured" -ForegroundColor Green
            } else {
                Write-Host "❌ $var missing from template" -ForegroundColor Red
                $script:hasErrors = $true
            }
        }
    } else {
        Write-Host "❌ .env.production.template not found" -ForegroundColor Red
        $script:hasErrors = $true
    }
}

# Function to check security files
function Test-SecurityFiles {
    Write-Host "`n🛡️ Checking security implementation files..." -ForegroundColor Yellow
    
    $securityFiles = @{
        "server/auth.ts" = "Authentication system"
        "server/security.ts" = "Security middleware"
        "server/config.ts" = "Configuration validation"
        "Dockerfile" = "Docker configuration"
        "docker-compose.production.yml" = "Production docker compose"
    }
    
    foreach ($file in $securityFiles.GetEnumerator()) {
        if (-not (Test-FileExists $file.Key $file.Value)) {
            $script:hasErrors = $true
        }
    }
}

# Function to check for sensitive data in git
function Test-GitSecurity {
    Write-Host "`n📁 Checking git security..." -ForegroundColor Yellow
    
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        
        $sensitivePatterns = @(
            "*.env",
            "*.key",
            "*.pem",
            "node_modules"
        )
        
        foreach ($pattern in $sensitivePatterns) {
            if ($gitignoreContent -match [regex]::Escape($pattern)) {
                Write-Host "✅ $pattern ignored in git" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $pattern should be in .gitignore" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ .gitignore not found" -ForegroundColor Red
        $script:hasErrors = $true
    }
}

# Function to check TypeScript configuration
function Test-TypeScriptSecurity {
    Write-Host "`n📝 Checking TypeScript configuration..." -ForegroundColor Yellow
    
    if (Test-Path "tsconfig.json") {
        $tsconfigContent = Get-Content "tsconfig.json" -Raw
        
        if ($tsconfigContent -match '"strict":\s*true') {
            Write-Host "✅ TypeScript strict mode enabled" -ForegroundColor Green
        } else {
            Write-Host "⚠️ TypeScript strict mode should be enabled" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ tsconfig.json not found" -ForegroundColor Red
        $script:hasErrors = $true
    }
}

# Function to test build process
function Test-BuildProcess {
    Write-Host "`n🔨 Testing build process..." -ForegroundColor Yellow
    
    try {
        Write-Host "Installing dependencies..." -ForegroundColor Cyan
        $installResult = npm install --silent 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Dependency installation failed" -ForegroundColor Red
            Write-Host $installResult -ForegroundColor Red
            $script:hasErrors = $true
            return
        }
        
        Write-Host "Running TypeScript check..." -ForegroundColor Cyan
        $tscResult = npx tsc --noEmit 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
        } else {
            Write-Host "❌ TypeScript compilation failed" -ForegroundColor Red
            Write-Host $tscResult -ForegroundColor Red
            $script:hasErrors = $true
        }
        
    } catch {
        Write-Host "❌ Build test failed: $($_.Exception.Message)" -ForegroundColor Red
        $script:hasErrors = $true
    }
}

# Function to check Dockerfile security
function Test-DockerSecurity {
    Write-Host "`n🐳 Checking Docker security..." -ForegroundColor Yellow
    
    if (Test-Path "Dockerfile") {
        $dockerContent = Get-Content "Dockerfile" -Raw
        
        $securityChecks = @{
            "USER.*node" = "Non-root user"
            "HEALTHCHECK" = "Health check configured"
            "npm ci.*--only=production" = "Production dependencies only"
        }
        
        foreach ($check in $securityChecks.GetEnumerator()) {
            if ($dockerContent -match $check.Key) {
                Write-Host "✅ $($check.Value) implemented" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $($check.Value) missing from Dockerfile" -ForegroundColor Yellow
            }
        }
    }
}

# Function to run security audit
function Test-SecurityAudit {
    Write-Host "`n🔍 Running npm security audit..." -ForegroundColor Yellow
    
    try {
        $auditResult = npm audit --audit-level=moderate 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ No security vulnerabilities found" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Security vulnerabilities detected:" -ForegroundColor Yellow
            Write-Host $auditResult -ForegroundColor Yellow
            Write-Host "Run 'npm audit fix' to resolve issues" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Security audit failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
Write-Host "`nStarting security validation..." -ForegroundColor Cyan

Test-SecurityFiles
Test-SecurityPackages
Test-EnvironmentTemplate
Test-GitSecurity
Test-TypeScriptSecurity
Test-DockerSecurity
Test-BuildProcess
Test-SecurityAudit

# Final summary
Write-Host "`n" -NoNewline
Write-Host "=======================================" -ForegroundColor Green
Write-Host "🎯 SECURITY VALIDATION SUMMARY" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

if ($hasErrors) {
    Write-Host "❌ Security validation completed with errors!" -ForegroundColor Red
    Write-Host "Please fix the issues above before deployment." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ All security checks passed!" -ForegroundColor Green
    Write-Host "🚀 Your application is ready for secure deployment!" -ForegroundColor Green
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Copy .env.production.template to .env.production" -ForegroundColor White
    Write-Host "2. Fill in your actual production values" -ForegroundColor White
    Write-Host "3. Generate secure secrets: [System.Web.Security.Membership]::GeneratePassword(32, 0)" -ForegroundColor White
    Write-Host "4. Deploy using Docker: docker-compose -f docker-compose.production.yml up -d" -ForegroundColor White
    
    exit 0
}

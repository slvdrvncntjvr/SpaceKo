#!/bin/bash

# Security Hardening Script for SpaceKo Deployment
# Run this script before deploying to production

echo "🔒 SpaceKo Security Hardening Script"
echo "====================================="

# Check if running as root (should not be)
if [ "$EUID" -eq 0 ]; then
  echo "❌ ERROR: Do not run this script as root for security reasons"
  exit 1
fi

echo "✅ Running as non-root user"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
  echo "✅ Node.js version $NODE_VERSION is supported"
else
  echo "❌ ERROR: Node.js version $NODE_VERSION is not supported. Minimum required: $REQUIRED_VERSION"
  exit 1
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "SESSION_SECRET"
  "NODE_ENV"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ ERROR: Required environment variable $var is not set"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

# Check JWT_SECRET strength
if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "❌ ERROR: JWT_SECRET must be at least 32 characters long"
  exit 1
fi

if [ ${#SESSION_SECRET} -lt 32 ]; then
  echo "❌ ERROR: SESSION_SECRET must be at least 32 characters long"
  exit 1
fi

if [[ "$JWT_SECRET" == *"your-"* ]] || [[ "$JWT_SECRET" == *"change"* ]]; then
  echo "❌ ERROR: JWT_SECRET appears to be a default value. Change it for security!"
  exit 1
fi

if [[ "$SESSION_SECRET" == *"your-"* ]] || [[ "$SESSION_SECRET" == *"change"* ]]; then
  echo "❌ ERROR: SESSION_SECRET appears to be a default value. Change it for security!"
  exit 1
fi

echo "✅ Security secrets are properly configured"

# Check if SSL certificates exist (for production)
if [ "$NODE_ENV" = "production" ]; then
  if [ "$FORCE_HTTPS" = "true" ]; then
    if [ -n "$SSL_CERT_PATH" ] && [ -n "$SSL_KEY_PATH" ]; then
      if [ ! -f "$SSL_CERT_PATH" ]; then
        echo "❌ ERROR: SSL certificate not found at $SSL_CERT_PATH"
        exit 1
      fi
      if [ ! -f "$SSL_KEY_PATH" ]; then
        echo "❌ ERROR: SSL private key not found at $SSL_KEY_PATH"
        exit 1
      fi
      echo "✅ SSL certificates found"
    else
      echo "⚠️  WARNING: HTTPS is enabled but SSL paths not configured"
    fi
  fi
fi

# Run security audit
echo "🔍 Running security audit..."
npm audit --audit-level moderate
if [ $? -ne 0 ]; then
  echo "❌ ERROR: Security vulnerabilities found. Run 'npm audit fix' to resolve them."
  exit 1
fi
echo "✅ No security vulnerabilities found"

# Check for sensitive files
echo "🔍 Checking for sensitive files..."
SENSITIVE_FILES=(
  ".env.production"
  "*.key"
  "*.pem"
  "*.p12"
  "*.pfx"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
  if ls $pattern 1> /dev/null 2>&1; then
    echo "⚠️  WARNING: Sensitive file pattern '$pattern' found. Ensure these are not committed to version control."
  fi
done

# Check .gitignore
if [ -f ".gitignore" ]; then
  if ! grep -q "\.env" .gitignore; then
    echo "❌ ERROR: .env files are not ignored in .gitignore"
    exit 1
  fi
  echo "✅ .gitignore properly configured"
else
  echo "❌ ERROR: .gitignore file not found"
  exit 1
fi

# Check file permissions
echo "🔍 Checking file permissions..."
find . -name "*.js" -o -name "*.ts" -o -name "*.json" | while read file; do
  if [ -x "$file" ]; then
    echo "⚠️  WARNING: $file has execute permissions (should be 644)"
  fi
done

# Database connection test
echo "🔍 Testing database connection..."
if npm run db:push --silent > /dev/null 2>&1; then
  echo "✅ Database connection successful"
else
  echo "❌ ERROR: Database connection failed"
  exit 1
fi

# Build test
echo "🔍 Testing build process..."
if npm run build --silent > /dev/null 2>&1; then
  echo "✅ Build successful"
else
  echo "❌ ERROR: Build failed"
  exit 1
fi

# TypeScript check
echo "🔍 Running TypeScript check..."
if npm run check --silent > /dev/null 2>&1; then
  echo "✅ TypeScript check passed"
else
  echo "❌ ERROR: TypeScript errors found"
  exit 1
fi

echo ""
echo "🎉 Security hardening complete!"
echo "✅ Your SpaceKo application is ready for secure deployment"
echo ""
echo "🚀 Next steps:"
echo "1. Deploy using: docker build -t spaceko ."
echo "2. Run with: docker run -p 5000:5000 --env-file .env.production spaceko"
echo "3. Monitor logs and health endpoint"
echo ""
echo "🔒 Security reminders:"
echo "- Regularly update dependencies: npm audit && npm update"
echo "- Monitor application logs for suspicious activity"
echo "- Keep SSL certificates up to date"
echo "- Use a reverse proxy (nginx) for additional security"
echo "- Enable monitoring and alerting"

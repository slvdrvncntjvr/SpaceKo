# 🚀 SpaceKo Production Deployment Guide

## ✅ SECURITY FIXES IMPLEMENTED

### **Authentication & Authorization**
- ✅ JWT-based authentication system
- ✅ Role-based access control (RBAC)
- ✅ Session management with expiration
- ✅ Rate limiting for authentication endpoints
- ✅ Input validation and sanitization

### **Security Headers & Configuration**
- ✅ Helmet.js for security headers
- ✅ CORS properly configured
- ✅ Content Security Policy (CSP)
- ✅ HTTPS enforcement in production
- ✅ XSS protection
- ✅ CSRF protection

### **Database Security**
- ✅ SSL/TLS encryption for database connections
- ✅ Connection pooling with limits
- ✅ SQL injection prevention
- ✅ Database health monitoring
- ✅ Graceful connection handling

### **Logging & Monitoring**
- ✅ Structured logging system
- ✅ Removed console.log statements
- ✅ Error tracking and monitoring
- ✅ Security audit logging
- ✅ Performance monitoring

### **Cloud Deployment Ready**
- ✅ Docker containerization with security
- ✅ Non-root user execution
- ✅ Health checks implemented
- ✅ Environment variable validation
- ✅ Secrets management

### **Code Quality & Type Safety**
- ✅ TypeScript strict mode
- ✅ Input validation with Zod
- ✅ Error boundaries
- ✅ Memory leak prevention
- ✅ Dependency vulnerability checks

---

## 🛠 Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Copy and configure production environment
cp .env.production.template .env.production

# Generate secure secrets (minimum 32 characters)
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for SESSION_SECRET
```

### 2. Security Validation
```bash
# Run security hardening script
chmod +x security-check.sh
./security-check.sh

# Fix any security vulnerabilities
npm audit fix

# Verify no secrets in code
git log --grep="password\|secret\|key" --oneline
```

### 3. Build Verification
```bash
# Test build process
npm run build

# Run TypeScript checks
npm run check

# Test database connection
npm run db:push
```

---

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Single Container
```bash
# Build the image
docker build -t spaceko:latest .

# Run with environment file
docker run -d \
  --name spaceko-app \
  --env-file .env.production \
  -p 5000:5000 \
  --restart unless-stopped \
  spaceko:latest
```

#### Docker Compose (Full Stack)
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check health
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs spaceko-app
```

### Option 2: Cloud Deployment

#### AWS (using provided migration)
```bash
cd aws-migration
npm install
cdk deploy
```

#### Heroku
```bash
# Login and create app
heroku login
heroku create spaceko-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set DATABASE_URL="your-postgres-url"

# Deploy
git push heroku main
```

#### Vercel/Netlify
```bash
# Build for static hosting
npm run build

# Deploy dist folder
# Note: Backend needs separate deployment (Railway, Render, etc.)
```

---

## 🔧 Configuration Guide

### Required Environment Variables

#### Security (CRITICAL)
```env
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters-long
```

#### Database
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
DB_SSL_MODE=require
DB_CONNECTION_TIMEOUT=10000
DB_MAX_CONNECTIONS=20
```

#### Server
```env
NODE_ENV=production
PORT=5000
FORCE_HTTPS=true
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

#### CORS & Security
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSP_POLICY=default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

### Optional Environment Variables

#### SSL Configuration
```env
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem
```

#### Monitoring
```env
SENTRY_DSN=your-sentry-dsn-here
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true
```

---

## 🔒 Security Best Practices

### 1. SSL/TLS Configuration
```bash
# Generate SSL certificates (if not using cloud provider)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private-key.pem \
  -out certificate.pem
```

### 2. Nginx Reverse Proxy (Recommended)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Database Security
```sql
-- Create dedicated database user
CREATE USER spaceko_user WITH PASSWORD 'strong-password';
CREATE DATABASE spaceko_prod OWNER spaceko_user;

-- Grant minimal permissions
GRANT CONNECT ON DATABASE spaceko_prod TO spaceko_user;
GRANT USAGE ON SCHEMA public TO spaceko_user;
GRANT CREATE ON SCHEMA public TO spaceko_user;
```

---

## 📊 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Application health status
- `GET /api/status` - API operational status

### Monitoring Setup
```bash
# Check application health
curl https://yourdomain.com/health

# Monitor logs
docker logs spaceko-app --follow

# Check resource usage
docker stats spaceko-app
```

### Performance Monitoring
```javascript
// Setup application monitoring
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## 🚨 Incident Response

### Common Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats
pm2 show spaceko-app

# Restart if necessary
docker restart spaceko-app
```

#### Database Connection Issues
```bash
# Check database connectivity
docker exec spaceko-db pg_isready

# Restart database
docker restart spaceko-db
```

#### SSL Certificate Expiry
```bash
# Check certificate expiry
openssl x509 -in certificate.pem -text -noout | grep "Not After"

# Renew certificate (Let's Encrypt)
certbot renew
```

### Security Incident Response
1. **Immediately**: Scale down to maintenance mode
2. **Investigate**: Check logs for suspicious activity
3. **Contain**: Block malicious IPs at firewall level
4. **Rotate**: Change all secrets (JWT, database passwords)
5. **Update**: Apply security patches
6. **Monitor**: Increase logging and monitoring

---

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
docker exec spaceko-db pg_dump -U spaceko_user spaceko_prod > backup.sql

# Automated backup script
0 2 * * * docker exec spaceko-db pg_dump -U spaceko_user spaceko_prod | gzip > /backups/spaceko-$(date +\%Y\%m\%d).sql.gz
```

### Application Backup
```bash
# Backup configuration
tar -czf spaceko-config-$(date +%Y%m%d).tar.gz .env.production docker-compose.production.yml

# Backup logs
tar -czf spaceko-logs-$(date +%Y%m%d).tar.gz logs/
```

---

## 📈 Performance Optimization

### Application Level
- ✅ Database connection pooling
- ✅ Request rate limiting
- ✅ Response compression
- ✅ Static file caching
- ✅ Database query optimization

### Infrastructure Level
- Use CDN for static assets
- Enable database read replicas
- Implement Redis for session storage
- Set up horizontal scaling
- Use load balancers

---

## ✅ Post-Deployment Verification

### 1. Functionality Tests
```bash
# Health check
curl https://yourdomain.com/health

# API status
curl https://yourdomain.com/api/status

# Authentication test
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"test", "userType":"student"}'
```

### 2. Security Tests
```bash
# SSL test
curl -I https://yourdomain.com

# Security headers test
curl -I https://yourdomain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"

# Rate limiting test
for i in {1..10}; do curl https://yourdomain.com/api/auth/login; done
```

### 3. Performance Tests
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/api/status

# Memory usage monitoring
watch docker stats spaceko-app
```

---

## 🎉 Deployment Complete!

Your SpaceKo application is now securely deployed with:

✅ **Enterprise-grade security**  
✅ **Production-ready monitoring**  
✅ **Cloud deployment compatibility**  
✅ **Comprehensive error handling**  
✅ **Performance optimization**  

### Next Steps:
1. Set up monitoring dashboards
2. Configure automated backups
3. Implement CI/CD pipeline
4. Set up alerting for critical issues
5. Plan regular security updates

**Your application is ready for production use! 🚀**

# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Install security updates and dumb-init
RUN apk add --no-cache dumb-init && \
    apk upgrade --available

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with security audit
RUN npm ci --audit && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates and dumb-init
RUN apk add --no-cache dumb-init && \
    apk upgrade --available && \
    apk add --no-cache tini

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S spaceko -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=spaceko:nodejs /app/dist ./dist
COPY --from=builder --chown=spaceko:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=spaceko:nodejs /app/package.json ./package.json

# Create necessary directories with proper permissions
RUN mkdir -p logs tmp && \
    chown -R spaceko:nodejs logs tmp && \
    chmod 755 logs tmp

# Security: Remove unnecessary packages and files
RUN apk del --purge wget curl && \
    rm -rf /var/cache/apk/* && \
    rm -rf /tmp/* && \
    rm -rf /root/.npm

# Switch to non-root user
USER spaceko

# Expose port
EXPOSE 5000

# Health check with timeout and proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', {timeout: 5000}, (res) => { \
    let data = ''; \
    res.on('data', chunk => data += chunk); \
    res.on('end', () => { \
      try { \
        const health = JSON.parse(data); \
        process.exit(health.status === 'healthy' ? 0 : 1); \
      } catch (e) { \
        process.exit(1); \
      } \
    }); \
  }).on('error', () => process.exit(1)).setTimeout(5000, () => process.exit(1))"

# Security labels
LABEL security.non-root="true" \
      security.healthcheck="enabled" \
      security.updates="alpine-latest"

# Use tini for proper signal handling and zombie reaping
ENTRYPOINT ["tini", "--"]

# Start the application with proper signal handling
CMD ["node", "dist/index.js"]

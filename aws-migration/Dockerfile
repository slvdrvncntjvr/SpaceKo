# Multi-stage Dockerfile for SpaceKo Lambda Functions
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY shared/ ./shared/
COPY aws-migration/dynamodb-schema.ts ./
COPY aws-migration/lambda-handlers/ ./lambda-handlers/

# Build TypeScript
RUN npm run build

# Production stage
FROM public.ecr.aws/lambda/nodejs:18

# Copy built application
COPY --from=builder /app/dist/ ${LAMBDA_TASK_ROOT}/
COPY --from=builder /app/node_modules/ ${LAMBDA_TASK_ROOT}/node_modules/

# Copy AWS SDK v3 dependencies
COPY --from=builder /app/node_modules/@aws-sdk/ ${LAMBDA_TASK_ROOT}/node_modules/@aws-sdk/

# Set the CMD to your handler
CMD ["index.handler"]
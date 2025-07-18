# AWS Serverless Migration Plan for SpaceKo

## Architecture Overview

This migration transforms SpaceKo from a traditional Express.js application to a fully serverless AWS architecture:

### Target Architecture:
- **Frontend**: React SPA → AWS S3 + CloudFront
- **Backend**: Express.js → AWS Lambda + API Gateway
- **Database**: PostgreSQL → AWS DynamoDB
- **Images**: Static assets → S3 with CloudFront CDN
- **Container Registry**: ECR for Lambda container images
- **Infrastructure**: AWS CDK/CloudFormation

## Migration Strategy

### Phase 1: Database Migration (PostgreSQL → DynamoDB)
- Convert relational schema to NoSQL document model
- Single-table design with composite keys
- Use DynamoDB Streams for real-time updates

### Phase 2: Backend Migration (Express → Lambda)
- Convert Express routes to Lambda handlers
- API Gateway for HTTP routing
- Lambda layers for shared dependencies

### Phase 3: Frontend Migration (Same React app)
- Build static assets
- Deploy to S3 with CloudFront
- Update API endpoints to API Gateway URLs

### Phase 4: Infrastructure as Code
- AWS CDK for infrastructure provisioning
- Environment-specific deployments
- CI/CD pipeline with GitHub Actions

## Key Benefits:
- **Cost**: Pay only for actual usage (no idle server costs)
- **Scalability**: Auto-scaling from 0 to millions of requests
- **Reliability**: Built-in redundancy and failover
- **Performance**: Global CDN distribution
- **Security**: AWS IAM and VPC integration
- **Maintenance**: No server management required

## Implementation Files:
1. `dynamodb-schema.ts` - DynamoDB table definitions
2. `lambda-handlers/` - API route handlers
3. `infrastructure/` - AWS CDK stack
4. `dockerfile` - Container image for Lambda
5. `buildspec.yml` - CI/CD pipeline
6. `migration-scripts/` - Data migration utilities

## Estimated Timeline:
- **Week 1**: Database schema migration and testing
- **Week 2**: Lambda handlers implementation
- **Week 3**: Infrastructure setup and deployment
- **Week 4**: Testing, optimization, and go-live

## Cost Estimate (Monthly):
- **Lambda**: $5-20 (1M requests)
- **DynamoDB**: $10-50 (depending on read/write units)
- **S3 + CloudFront**: $5-15 (static assets)
- **API Gateway**: $3-10 (1M requests)
- **Total**: $25-100/month for moderate usage

This is significantly cheaper than running dedicated servers 24/7.
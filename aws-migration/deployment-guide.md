# SpaceKo AWS Serverless Deployment Guide

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with credentials
3. **Node.js**: Version 18+ installed
4. **Docker**: For building Lambda container images
5. **AWS CDK**: Installed globally (`npm install -g aws-cdk`)

## Step-by-Step Deployment

### 1. Environment Setup

```bash
# Configure AWS credentials
aws configure

# Set environment variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_DEFAULT_REGION=us-east-1

# Bootstrap CDK (first time only)
cdk bootstrap
```

### 2. Install Dependencies

```bash
# Install migration dependencies
cd aws-migration
npm install

# Install CDK dependencies
cd infrastructure
npm install
```

### 3. Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository --repository-name spaceko-lambda --region $AWS_DEFAULT_REGION

# Get login token
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
```

### 4. Build and Deploy Infrastructure

```bash
# Build Lambda container
cd aws-migration
docker build -t spaceko-lambda .
docker tag spaceko-lambda:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/spaceko-lambda:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/spaceko-lambda:latest

# Deploy CDK stack
cd infrastructure
cdk deploy --require-approval never
```

### 5. Build and Deploy Frontend

```bash
# Build React app
cd client
npm install
npm run build

# Deploy to S3 (automatically done by CDK)
# The CDK stack will handle S3 deployment and CloudFront invalidation
```

### 6. Migrate Data (Optional)

```bash
# Run data migration from PostgreSQL to DynamoDB
cd aws-migration
npm run migrate:full
```

### 7. Test Deployment

```bash
# Get API Gateway URL from CDK outputs
API_URL=$(aws cloudformation describe-stacks --stack-name SpaceKoServerlessStack --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text)

# Test API endpoints
curl "$API_URL/api/resources"
curl "$API_URL/api/users"
```

## Environment Variables

### Required Environment Variables:

```bash
# AWS Configuration
AWS_ACCOUNT_ID=123456789012
AWS_DEFAULT_REGION=us-east-1

# Application Configuration
DYNAMODB_TABLE=spaceko-main
FRONTEND_BUCKET_NAME=spaceko-frontend-123456789012-us-east-1
CLOUDFRONT_DISTRIBUTION_ID=E1234567890123

# Migration (if needed)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Cost Optimization

### 1. DynamoDB
- Use On-Demand billing for unpredictable workloads
- Consider Provisioned billing for consistent traffic
- Enable auto-scaling for provisioned capacity

### 2. Lambda
- Right-size memory allocation (128MB - 1GB)
- Use provisioned concurrency for consistent performance
- Enable X-Ray tracing for debugging

### 3. S3 & CloudFront
- Use CloudFront for global edge caching
- Enable S3 Intelligent Tiering for cost optimization
- Configure appropriate cache headers

## Monitoring and Logging

### CloudWatch Dashboards
```bash
# Create custom dashboard
aws cloudwatch put-dashboard --dashboard-name SpaceKo --dashboard-body file://monitoring/dashboard.json
```

### Alarms
```bash
# Set up error rate alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "SpaceKo-Lambda-Errors" \
  --alarm-description "Monitor Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Security Best Practices

1. **IAM Roles**: Use least privilege principle
2. **API Gateway**: Enable API throttling and request validation
3. **Lambda**: Use environment variables for secrets
4. **DynamoDB**: Enable encryption at rest
5. **S3**: Enable versioning and encryption

## Troubleshooting

### Common Issues:

1. **Lambda Timeout**: Increase timeout in CDK stack
2. **DynamoDB Throttling**: Increase read/write capacity
3. **CORS Issues**: Check API Gateway CORS configuration
4. **Cold Start**: Use provisioned concurrency for critical functions

### Logs:
```bash
# View Lambda logs
aws logs tail /aws/lambda/SpaceKoResourcesFunction --follow

# View API Gateway logs
aws logs tail /aws/apigateway/SpaceKoApi --follow
```

## Rollback Strategy

1. **Database**: Keep PostgreSQL as backup during migration
2. **Lambda**: Use aliases for blue-green deployments
3. **Frontend**: Use CloudFront origins for quick rollback
4. **Infrastructure**: Use CDK for infrastructure versioning

## Performance Optimization

1. **Lambda**: Use Lambda Layers for shared dependencies
2. **DynamoDB**: Design efficient access patterns
3. **API Gateway**: Enable caching for read-heavy endpoints
4. **CloudFront**: Configure appropriate TTLs

## Next Steps

1. Set up CI/CD pipeline with CodePipeline
2. Implement comprehensive monitoring
3. Add automated testing
4. Configure custom domain name
5. Set up development/staging environments
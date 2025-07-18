// AWS CDK Stack for SpaceKo Serverless Infrastructure
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SpaceKoServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'SpaceKoTable', {
      tableName: 'spaceko-main',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
      pointInTimeRecovery: true,
      
      // Global Secondary Index for queries
      globalSecondaryIndexes: [
        {
          indexName: 'GSI1',
          partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // ECR Repository for Lambda container images
    const repository = new ecr.Repository(this, 'SpaceKoRepository', {
      repositoryName: 'spaceko-lambda',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions to Lambda
    table.grantReadWriteData(lambdaRole);

    // Lambda Functions
    const resourcesFunction = new lambda.Function(this, 'ResourcesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'resources.handler',
      code: lambda.Code.fromAsset('lambda-handlers'),
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE: table.tableName,
        AWS_REGION: this.region,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const usersFunction = new lambda.Function(this, 'UsersFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'users.handler',
      code: lambda.Code.fromAsset('lambda-handlers'),
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE: table.tableName,
        AWS_REGION: this.region,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'SpaceKoApi', {
      restApiName: 'SpaceKo API',
      description: 'API for SpaceKo Campus Resource Locator',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // API Gateway Resources and Methods
    const apiResource = api.root.addResource('api');
    
    // Resources endpoints
    const resourcesResource = apiResource.addResource('resources');
    resourcesResource.addMethod('GET', new apigateway.LambdaIntegration(resourcesFunction));
    resourcesResource.addMethod('POST', new apigateway.LambdaIntegration(resourcesFunction));
    
    const resourceIdResource = resourcesResource.addResource('{id}');
    resourceIdResource.addMethod('GET', new apigateway.LambdaIntegration(resourcesFunction));
    resourceIdResource.addMethod('PUT', new apigateway.LambdaIntegration(resourcesFunction));

    // Users endpoints
    const usersResource = apiResource.addResource('users');
    usersResource.addMethod('GET', new apigateway.LambdaIntegration(usersFunction));
    usersResource.addMethod('POST', new apigateway.LambdaIntegration(usersFunction));
    
    const userIdResource = usersResource.addResource('{userCode}');
    userIdResource.addMethod('GET', new apigateway.LambdaIntegration(usersFunction));

    // Auth endpoints
    const authResource = apiResource.addResource('auth');
    const loginResource = authResource.addResource('login');
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(usersFunction));
    
    const logoutResource = authResource.addResource('logout');
    logoutResource.addMethod('POST', new apigateway.LambdaIntegration(usersFunction));

    // Contributors endpoints
    const contributorsResource = apiResource.addResource('contributors');
    contributorsResource.addMethod('GET', new apigateway.LambdaIntegration(usersFunction));
    
    const updateContributorResource = contributorsResource.addResource('update');
    updateContributorResource.addMethod('POST', new apigateway.LambdaIntegration(usersFunction));

    // S3 Bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `spaceko-frontend-${this.account}-${this.region}`,
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy website to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../client/dist')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Website URL',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });
  }
}

// CDK App
const app = new cdk.App();
new SpaceKoServerlessStack(app, 'SpaceKoServerlessStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
// Frontend Configuration for AWS Serverless Deployment
// This file contains the necessary changes to adapt your React frontend for AWS

// 1. Environment Configuration
export const awsConfig = {
  // API Gateway endpoint (will be set after deployment)
  apiEndpoint: process.env.VITE_API_ENDPOINT || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod',
  
  // AWS Region
  region: process.env.VITE_AWS_REGION || 'us-east-1',
  
  // CloudFront distribution domain
  cdnDomain: process.env.VITE_CDN_DOMAIN || 'https://your-cloudfront-domain.cloudfront.net',
  
  // S3 bucket for assets
  assetsBucket: process.env.VITE_ASSETS_BUCKET || 'spaceko-frontend-assets',
};

// 2. API Client Configuration
export const apiClient = {
  baseURL: awsConfig.apiEndpoint,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 3. Frontend Environment Variables (add to .env)
/*
VITE_API_ENDPOINT=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_CDN_DOMAIN=https://your-cloudfront-domain.cloudfront.net
VITE_ASSETS_BUCKET=spaceko-frontend-assets
*/

// 4. Required Frontend Changes Summary:
/*
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Changes Needed                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Update API Endpoints:                                        │
│    - Change from '/api/*' to full API Gateway URLs             │
│    - Example: '/api/resources' → '${API_GATEWAY_URL}/resources' │
│                                                                 │
│ 2. Asset References:                                            │
│    - Static assets will be served from S3 via CloudFront       │
│    - No changes needed - handled by build process              │
│                                                                 │
│ 3. Environment Variables:                                       │
│    - Add VITE_API_ENDPOINT for API Gateway URL                 │
│    - Add VITE_AWS_REGION for AWS region                        │
│                                                                 │
│ 4. Build Configuration:                                         │
│    - Update vite.config.ts base URL if deploying to subfolder  │
│    - Configure proper asset handling for S3                    │
│                                                                 │
│ 5. Routing:                                                     │
│    - Configure for SPA routing with CloudFront                 │
│    - Handle 404s redirecting to index.html                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
*/

// 5. Updated Vite Configuration for AWS
export const viteConfigAWS = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/', // Use '/' for CloudFront root domain
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_ENDPOINT || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
`;

// 6. Updated Query Client Configuration
export const queryClientConfigAWS = `
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Update the default fetcher to use API Gateway
const defaultFetcher = async (url: string, options?: RequestInit) => {
  const fullUrl = url.startsWith('http') ? url : \`\${import.meta.env.VITE_API_ENDPOINT}\${url}\`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  return response.json();
};

export { queryClient, defaultFetcher };
`;

// 7. CloudFront Configuration for SPA Routing
export const cloudFrontSPAConfig = {
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: 300,
    },
    {
      httpStatus: 403,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: 300,
    },
  ],
  defaultRootObject: 'index.html',
  compress: true,
  viewerProtocolPolicy: 'redirect-to-https',
};
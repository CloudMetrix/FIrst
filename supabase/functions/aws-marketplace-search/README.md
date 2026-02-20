# AWS Marketplace Search Edge Function

## Overview
Real-time AWS Marketplace product search and verification Edge Function that provides intelligent product matching for contract optimization.

## Features
- **Real-time Search**: Search AWS Marketplace products in real-time (not just synced data)
- **Intelligent Matching**: Advanced matching algorithm with scoring system
- **Multi-source Search**: Searches both Marketplace Catalog and Active Agreements
- **Pricing Enrichment**: Automatically fetches pricing data from AWS Pricing API
- **Product Verification**: Verifies actual product availability and status

## API Endpoint
```
POST /functions/v1/aws-marketplace-search
```

## Request Body
```json
{
  "integrationId": "uuid",
  "searchQuery": "product name or keywords",
  "productType": "SaaS" | "AMI" | "Container" | "All",
  "maxResults": 10
}
```

## Response
```json
{
  "success": true,
  "results": [
    {
      "productId": "string",
      "productName": "string",
      "vendor": "string",
      "productType": "string",
      "description": "string",
      "pricing": {
        "monthlyCost": 1000,
        "currency": "USD",
        "pricingModel": "Monthly"
      },
      "availability": "available",
      "matchScore": 0.95,
      "marketplaceUrl": "https://aws.amazon.com/marketplace/pp/...",
      "metadata": {}
    }
  ],
  "query": "search query",
  "totalResults": 5
}
```

## Match Score Algorithm
The function calculates a match score (0-1) based on:
- **Exact match**: 1.0
- **Contains full query**: +0.8
- **Word-by-word matching**: +0.6 (proportional to matched words)
- **Metadata matches**: +0.2

Only products with match score > 0.3 are returned.

## AWS APIs Used
1. **Marketplace Catalog API**: Search product listings
2. **Marketplace Agreement API**: Search active subscriptions
3. **Pricing API**: Fetch pricing information

## Authentication
Requires valid Supabase JWT token in Authorization header.

## Permissions
Requires AWS integration with `permissions_marketplace` enabled.

## Error Handling
Returns 200 with error JSON to prevent client crashes:
```json
{
  "success": false,
  "error": "error message"
}
```
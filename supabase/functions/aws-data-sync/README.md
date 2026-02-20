# AWS Data Sync Edge Function

This Supabase Edge Function provides real-time AWS data synchronization capabilities using the AWS SDK.

## Features

- **Real AWS API Integration**: Fetches actual data from AWS Cost Explorer and Marketplace APIs
- **Secure Credential Management**: Supports both IAM role assumption and manual access keys
- **Automatic Sync Logging**: Tracks all sync operations in the database
- **Error Handling**: Comprehensive error tracking and reporting

## Supported Data Types

### 1. Service Usage (Billing Data)
- Fetches cost and usage data from AWS Cost Explorer
- Retrieves last 30 days of billing information
- Groups data by AWS service
- Stores daily cost breakdowns

### 2. Marketplace Products
- Retrieves AWS Marketplace subscriptions
- Fetches agreement details and status
- Tracks subscription start/end dates

### 3. Contracts & Invoices
- Placeholder for custom implementation
- Requires specific AWS API endpoints or S3 bucket parsing

## Authentication Methods

### CloudFormation (IAM Role)
- Uses STS AssumeRole with external ID
- More secure than access keys
- Temporary credentials with 1-hour expiration

### Manual (Access Keys)
- Uses provided Access Key ID and Secret Access Key
- Direct API access
- Stored encrypted in database

## API Request Format

```json
{
  "integrationId": "uuid-of-aws-integration",
  "dataType": "service_usage" | "marketplace_products" | "contracts" | "invoices"
}
```

## Response Format

### Success
```json
{
  "success": true,
  "recordsSynced": 45,
  "recordsFailed": 2,
  "syncLogId": "uuid-of-sync-log"
}
```

### Error
```json
{
  "success": false,
  "error": "Error message"
}
```

## Database Tables Used

- `aws_integrations`: Stores AWS connection credentials
- `aws_sync_logs`: Tracks all sync operations
- `aws_service_usage`: Stores billing/cost data
- `aws_marketplace_products`: Stores marketplace subscriptions

## Environment Variables

No additional environment variables required. Uses Supabase built-in:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Deployment

Deploy using Supabase CLI:
```bash
supabase functions deploy aws-data-sync
```

## Error Handling

- All errors are logged to `aws_sync_logs` table
- Failed syncs update the log with error details
- Individual record failures don't stop the entire sync

## Security

- User authentication required (JWT verification)
- RLS policies ensure users only access their own data
- Credentials never exposed in responses
- External ID validation for IAM role assumption

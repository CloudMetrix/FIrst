# AWS IAM Setup Edge Function

## Overview
This edge function handles AWS IAM role creation and verification for secure cross-account access.

## Environment Variables

### Required Configuration
Set the following secret in your Supabase project:

```bash
supabase secrets set AWS_TRUSTED_ACCOUNT_ID=564339401748
```

**AWS_TRUSTED_ACCOUNT_ID**: Your organization's AWS account ID that will assume roles in customer accounts.

## Setup Instructions

1. **Set Environment Variable**:
   ```bash
   cd supabase
   supabase secrets set AWS_TRUSTED_ACCOUNT_ID=564339401748
   ```

2. **Deploy Edge Function**:
   ```bash
   supabase functions deploy aws-iam-setup
   ```

3. **Verify Deployment**:
   ```bash
   supabase functions list
   ```

## API Endpoints

### Generate CloudFormation Template
**Action**: `generate-cloudformation`

**Request Body**:
```json
{
  "action": "generate-cloudformation",
  "accountName": "Production AWS Account",
  "awsRegion": "us-east-1",
  "permissions": {
    "contracts": true,
    "invoices": true,
    "marketplace": true,
    "usage": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "integrationId": "uuid",
  "externalId": "uuid",
  "cloudFormationTemplate": {...},
  "stackUrl": "https://console.aws.amazon.com/cloudformation/...",
  "instructions": ["..."]
}
```

### Verify IAM Role
**Action**: `verify-role`

**Request Body**:
```json
{
  "action": "verify-role",
  "integrationId": "uuid",
  "roleArn": "arn:aws:iam::123456789012:role/ContractManagerIntegrationRole"
}
```

**Response**:
```json
{
  "success": true,
  "integration": {...},
  "message": "AWS IAM role verified and connected successfully"
}
```

## Security Features

- **External ID**: Unique UUID generated for each integration to prevent confused deputy attacks
- **Role ARN Validation**: Strict pattern matching for role ARN format
- **User Authentication**: Supabase auth token required for all requests
- **Cross-Account Trust**: Trust policy restricts access to your organization's AWS account only

## Troubleshooting

### Error: "Missing AWS_TRUSTED_ACCOUNT_ID"
- Ensure environment variable is set: `supabase secrets set AWS_TRUSTED_ACCOUNT_ID=564339401748`
- Redeploy function after setting secrets

### Error: "Invalid role ARN format"
- Role ARN must match pattern: `arn:aws:iam::{account-id}:role/ContractManagerIntegrationRole`
- Ensure CloudFormation stack created the role with exact name

### Error: "Unauthorized"
- Check Authorization header is included in request
- Verify Supabase auth token is valid

## CloudFormation Template Details

The generated template creates:
- **IAM Role**: `ContractManagerIntegrationRole`
- **Trust Policy**: Allows your AWS account (564339401748) to assume the role
- **Permissions**: Read-only access to AWS Marketplace, Billing, Cost Explorer
- **External ID**: Required condition for role assumption (prevents confused deputy)

## Testing

```bash
# Test generate-cloudformation
curl -X POST https://your-project.supabase.co/functions/v1/aws-iam-setup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate-cloudformation",
    "accountName": "Test Account",
    "awsRegion": "us-east-1",
    "permissions": {"contracts": true, "invoices": true}
  }'

# Test verify-role
curl -X POST https://your-project.supabase.co/functions/v1/aws-iam-setup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verify-role",
    "integrationId": "uuid-from-previous-step",
    "roleArn": "arn:aws:iam::123456789012:role/ContractManagerIntegrationRole"
  }'
```
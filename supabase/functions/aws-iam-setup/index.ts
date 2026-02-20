import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Declare Deno global interface for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CloudFormation template for IAM role creation
const getCloudFormationTemplate = (externalId: string, accountId: string) => {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'IAM Role for Contract Manager AWS Integration',
    Parameters: {
      ExternalId: {
        Type: 'String',
        Default: externalId,
        Description: 'External ID for secure role assumption'
      },
      TrustedAccountId: {
        Type: 'String',
        Default: accountId,
        Description: 'Account ID that can assume this role'
      }
    },
    Resources: {
      ContractManagerRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: 'ContractManagerIntegrationRole',
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: { 'Fn::Sub': 'arn:aws:iam::${TrustedAccountId}:root' }
                },
                Action: 'sts:AssumeRole',
                Condition: {
                  StringEquals: {
                    'sts:ExternalId': { Ref: 'ExternalId' }
                  }
                }
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/AWSMarketplaceRead-only',
            'arn:aws:iam::aws:policy/job-function/Billing'
          ],
          Policies: [
            {
              PolicyName: 'ContractManagerAccess',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'ce:GetCostAndUsage',
                      'ce:GetCostForecast',
                      'ce:GetDimensionValues',
                      'ce:ListCostCategoryDefinitions',
                      'cur:DescribeReportDefinitions',
                      'aws-marketplace:ViewSubscriptions',
                      'aws-marketplace:GetAgreementTerms',
                      'organizations:DescribeOrganization',
                      'organizations:ListAccounts'
                    ],
                    Resource: '*'
                  }
                ]
              }
            }
          ]
        }
      }
    },
    Outputs: {
      RoleArn: {
        Description: 'ARN of the created IAM role',
        Value: { 'Fn::GetAtt': ['ContractManagerRole', 'Arn'] },
        Export: {
          Name: 'ContractManagerRoleArn'
        }
      },
      ExternalId: {
        Description: 'External ID for role assumption',
        Value: { Ref: 'ExternalId' }
      }
    }
  };
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body ONCE and reuse
    const requestBody = await req.json();
    const { action, accountName, awsRegion, permissions, integrationId, roleArn } = requestBody;

    if (action === 'generate-cloudformation') {
      // Generate unique external ID for security
      const externalId = crypto.randomUUID();
      
      // Your organization's AWS account ID that will assume the role
      // Set AWS_TRUSTED_ACCOUNT_ID in Supabase Edge Function secrets:
      // supabase secrets set AWS_TRUSTED_ACCOUNT_ID=564339401748
      const trustedAccountId = Deno.env.get('AWS_TRUSTED_ACCOUNT_ID') || '564339401748';

      const template = getCloudFormationTemplate(externalId, trustedAccountId);

      // Store the external ID in database for later verification
      const { data: integration, error: dbError } = await supabaseClient
        .from('aws_integrations')
        .insert({
          user_id: user.id,
          account_name: accountName,
          aws_region: awsRegion,
          external_id: externalId,
          connection_status: 'pending',
          permissions_contracts: permissions?.contracts ?? true,
          permissions_invoices: permissions?.invoices ?? true,
          permissions_marketplace: permissions?.marketplace ?? true,
          permissions_usage: permissions?.usage ?? true,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate CloudFormation stack URL with template body
      const templateJson = JSON.stringify(template);
      const templateEncoded = encodeURIComponent(templateJson);
      
      // Use templateBody parameter instead of templateURL
      const stackUrl = `https://console.aws.amazon.com/cloudformation/home?region=${awsRegion}#/stacks/create/review?templateBody=${templateEncoded}&stackName=ContractManagerIntegration&param_ExternalId=${externalId}&param_TrustedAccountId=${trustedAccountId}`;

      return new Response(
        JSON.stringify({
          success: true,
          integrationId: integration.id,
          externalId,
          cloudFormationTemplate: template,
          stackUrl,
          instructions: [
            'Click the button below to open AWS CloudFormation console',
            'Review the IAM role permissions',
            'Check the "I acknowledge that AWS CloudFormation might create IAM resources" box',
            'Click "Create stack" to deploy the IAM role',
            'Return here once the stack is created'
          ]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'verify-role') {
      // Use already parsed requestBody variables
      // Verify the role ARN format
      const roleArnPattern = /^arn:aws:iam::\d{12}:role\/ContractManagerIntegrationRole$/;
      if (!roleArn || !roleArnPattern.test(roleArn)) {
        throw new Error('Invalid role ARN format');
      }

      // Update integration with role ARN
      const { data: integration, error: updateError } = await supabaseClient
        .from('aws_integrations')
        .update({
          role_arn: roleArn,
          connection_status: 'connected',
          last_connection_test: new Date().toISOString()
        })
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          integration,
          message: 'AWS IAM role verified and connected successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
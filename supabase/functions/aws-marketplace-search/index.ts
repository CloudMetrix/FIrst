// Real-time AWS Marketplace Product Search and Verification Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { STSClient, AssumeRoleCommand } from 'npm:@aws-sdk/client-sts@latest';
import { MarketplaceCatalogClient, SearchEntitiesCommand, DescribeEntityCommand } from 'npm:@aws-sdk/client-marketplace-catalog@latest';
import { MarketplaceAgreementClient, SearchAgreementsCommand } from 'npm:@aws-sdk/client-marketplace-agreement@latest';
import { PricingClient, GetProductsCommand } from 'npm:@aws-sdk/client-pricing@latest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  integrationId: string;
  searchQuery: string;
  productType?: 'SaaS' | 'AMI' | 'Container' | 'All';
  maxResults?: number;
}

interface ProductMatch {
  productId: string;
  productName: string;
  vendor: string;
  productType: string;
  description?: string;
  pricing?: {
    monthlyCost?: number;
    currency?: string;
    pricingModel?: string;
  };
  availability: 'available' | 'unavailable' | 'unknown';
  matchScore: number;
  marketplaceUrl?: string;
  metadata?: any;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get('MY_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('MY_SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('MY_SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Server Error: Missing Secrets');
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid JWT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    
    const { integrationId, searchQuery, productType = 'All', maxResults = 10 }: SearchRequest = await req.json();

    if (!integrationId || !searchQuery) {
      throw new Error('Missing required parameters: integrationId and searchQuery');
    }

    const { data: integration, error: intError } = await adminClient
      .from('aws_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single();

    if (intError || !integration) {
      throw new Error('Integration not found or access denied');
    }

    if (!integration.permissions_marketplace) {
      throw new Error('Marketplace permissions not enabled for this integration');
    }

    const credentials = await getAWSCredentials(integration);

    const searchResults = await searchMarketplaceProducts(
      credentials,
      searchQuery,
      productType,
      maxResults
    );

    return new Response(
      JSON.stringify({
        success: true,
        results: searchResults,
        query: searchQuery,
        totalResults: searchResults.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error('Marketplace search error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});

// --- HELPER FUNCTIONS ---

async function getAWSCredentials(integration: any) {
  if (integration.connection_type === 'manual') {
    return {
      accessKeyId: integration.access_key_id,
      secretAccessKey: integration.secret_access_key_encrypted,
      region: integration.aws_region,
    };
  } else {
    const stsClient = new STSClient({
      region: integration.aws_region,
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: integration.role_arn,
      RoleSessionName: `marketplace-search-${Date.now()}`,
      ExternalId: integration.external_id,
      DurationSeconds: 3600,
    });

    const response = await stsClient.send(assumeRoleCommand);
    if (!response.Credentials) throw new Error('Failed to assume AWS role');

    return {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken!,
      region: integration.aws_region,
    };
  }
}

async function searchMarketplaceProducts(
  credentials: any,
  searchQuery: string,
  productType: string,
  maxResults: number
): Promise<ProductMatch[]> {
  const results: ProductMatch[] = [];

  try {
    const catalogResults = await searchMarketplaceCatalog(credentials, searchQuery, productType, maxResults);
    results.push(...catalogResults);

    const agreementResults = await searchActiveAgreements(credentials, searchQuery, maxResults);
    results.push(...agreementResults);

    await enrichWithPricingData(results, credentials);

    results.sort((a, b) => b.matchScore - a.matchScore);

    return results.slice(0, maxResults);
  } catch (error: any) {
    console.error('Product search error:', error);
    return results;
  }
}

async function searchMarketplaceCatalog(
  credentials: any,
  searchQuery: string,
  productType: string,
  maxResults: number
): Promise<ProductMatch[]> {
  const results: ProductMatch[] = [];

  try {
    const catalogClient = new MarketplaceCatalogClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    const filters: any[] = [];
    
    if (productType !== 'All') {
      filters.push({
        Name: 'ProductType',
        ValueList: [productType],
      });
    }

    const searchCommand = new SearchEntitiesCommand({
      Catalog: 'AWSMarketplace',
      EntityType: 'SaaSProduct',
      MaxResults: maxResults,
      FilterList: filters.length > 0 ? filters : undefined,
    });

    const response = await catalogClient.send(searchCommand);

    if (response.EntitySummaryList) {
      for (const entity of response.EntitySummaryList) {
        try {
          const detailsCommand = new DescribeEntityCommand({
            Catalog: 'AWSMarketplace',
            EntityId: entity.EntityId!,
          });

          const details = await catalogClient.send(detailsCommand);
          const detailsJson = details.Details ? JSON.parse(details.Details) : {};

          const matchScore = calculateMatchScore(searchQuery, entity.Name || '', detailsJson);

          if (matchScore > 0.3) {
            results.push({
              productId: entity.EntityId || `catalog-${Date.now()}`,
              productName: entity.Name || 'Unknown Product',
              vendor: detailsJson.Vendor?.Name || 'Unknown Vendor',
              productType: entity.EntityType || 'SaaS',
              description: detailsJson.Description || '',
              availability: 'available',
              matchScore,
              marketplaceUrl: `https://aws.amazon.com/marketplace/pp/${entity.EntityId}`,
              metadata: {
                entityArn: entity.EntityArn,
                visibility: entity.Visibility,
                lastModifiedDate: entity.LastModifiedDate,
                details: detailsJson,
              },
            });
          }
        } catch (err) {
          console.warn('Failed to get product details:', err);
        }
      }
    }
  } catch (error: any) {
    console.error('Catalog search error:', error);
  }

  return results;
}

async function searchActiveAgreements(
  credentials: any,
  searchQuery: string,
  maxResults: number
): Promise<ProductMatch[]> {
  const results: ProductMatch[] = [];

  try {
    const agreementClient = new MarketplaceAgreementClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    const searchCommand = new SearchAgreementsCommand({
      Catalog: 'AWSMarketplace',
      Filters: [
        { Name: 'Status', Values: ['ACTIVE'] },
      ],
      MaxResults: maxResults,
    });

    const response = await agreementClient.send(searchCommand);

    if (response.AgreementViewSummaries) {
      for (const agreement of response.AgreementViewSummaries) {
        const productName = agreement.ProposalSummary?.OfferName || '';
        const matchScore = calculateMatchScore(searchQuery, productName, agreement);

        if (matchScore > 0.3) {
          results.push({
            productId: agreement.AgreementId || `agreement-${Date.now()}`,
            productName,
            vendor: agreement.Proposer?.AccountId || 'Unknown',
            productType: agreement.AgreementType || 'Subscription',
            availability: 'available',
            matchScore,
            marketplaceUrl: `https://console.aws.amazon.com/marketplace/home#/agreements/${agreement.AgreementId}`,
            metadata: {
              agreementId: agreement.AgreementId,
              status: agreement.Status,
              acceptanceTime: agreement.AcceptanceTime,
              endTime: agreement.EndTime,
            },
          });
        }
      }
    }
  } catch (error: any) {
    console.error('Agreement search error:', error);
  }

  return results;
}

async function enrichWithPricingData(results: ProductMatch[], credentials: any) {
  try {
    const pricingClient = new PricingClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    for (const result of results) {
      try {
        const pricingCommand = new GetProductsCommand({
          ServiceCode: 'AWSMarketplace',
          Filters: [
            {
              Type: 'TERM_MATCH',
              Field: 'productFamily',
              Value: 'Software',
            },
          ],
          MaxResults: 1,
        });

        const pricingResponse = await pricingClient.send(pricingCommand);

        if (pricingResponse.PriceList && pricingResponse.PriceList.length > 0) {
          const priceData = JSON.parse(pricingResponse.PriceList[0]);
          
          const terms = priceData.terms?.OnDemand || {};
          const termKeys = Object.keys(terms);
          
          if (termKeys.length > 0) {
            const priceDimensions = terms[termKeys[0]].priceDimensions || {};
            const dimensionKeys = Object.keys(priceDimensions);
            
            if (dimensionKeys.length > 0) {
              const priceInfo = priceDimensions[dimensionKeys[0]];
              result.pricing = {
                monthlyCost: parseFloat(priceInfo.pricePerUnit?.USD || '0'),
                currency: 'USD',
                pricingModel: priceInfo.unit || 'Monthly',
              };
            }
          }
        }
      } catch (err) {
        console.warn('Failed to get pricing for product:', result.productName);
      }
    }
  } catch (error: any) {
    console.error('Pricing enrichment error:', error);
  }
}

function calculateMatchScore(searchQuery: string, productName: string, metadata?: any): number {
  const query = searchQuery.toLowerCase().trim();
  const name = productName.toLowerCase().trim();
  
  let score = 0;

  if (name === query) {
    return 1.0;
  }

  if (name.includes(query)) {
    score += 0.8;
  }

  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  const nameWords = name.split(/\s+/);
  
  let matchedWords = 0;
  for (const queryWord of queryWords) {
    if (nameWords.some(nameWord => nameWord.includes(queryWord) || queryWord.includes(nameWord))) {
      matchedWords++;
    }
  }

  if (queryWords.length > 0) {
    score += (matchedWords / queryWords.length) * 0.6;
  }

  if (metadata) {
    const metadataStr = JSON.stringify(metadata).toLowerCase();
    if (metadataStr.includes(query)) {
      score += 0.2;
    }
  }

  return Math.min(score, 1.0);
}
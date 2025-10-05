import { corsHeaders } from '../_shared/cors.ts';

const ZOHO_CLIENT_ID = Deno.env.get('ZOHO_CLIENT_ID');
const ZOHO_REDIRECT_URI = Deno.env.get('ZOHO_REDIRECT_URI');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZOHO_CLIENT_ID || !ZOHO_REDIRECT_URI) {
      console.error('Missing environment variables:', {
        hasClientId: !!ZOHO_CLIENT_ID,
        hasRedirectUri: !!ZOHO_REDIRECT_URI
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Zoho OAuth URL
    const authUrl = new URL('https://accounts.zoho.com/oauth/v2/auth');
    authUrl.searchParams.append('scope', 'ZohoWriter.documentEditor.ALL,ZohoWriter.documents.ALL');
    authUrl.searchParams.append('client_id', ZOHO_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', ZOHO_REDIRECT_URI);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', userId);

    console.log('Generated auth URL for user:', userId);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating auth URL:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
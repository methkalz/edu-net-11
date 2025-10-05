import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

const ZOHO_CLIENT_ID = Deno.env.get('ZOHO_CLIENT_ID');
const ZOHO_CLIENT_SECRET = Deno.env.get('ZOHO_CLIENT_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's Zoho integration
    const { data: integration, error: integrationError } = await supabase
      .from('zoho_writer_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Zoho Writer not connected', code: 'NOT_CONNECTED' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.access_token;
    const expiresAt = new Date(integration.expires_at);
    
    if (expiresAt <= new Date()) {
      console.log('Token expired, refreshing...');
      
      const refreshResponse = await fetch(`${integration.api_domain}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: ZOHO_CLIENT_ID!,
          client_secret: ZOHO_CLIENT_SECRET!,
          refresh_token: integration.refresh_token,
        }),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error('Token refresh failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Token refresh failed', code: 'TOKEN_EXPIRED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

      // Update tokens in database
      await supabase
        .from('zoho_writer_integrations')
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Parse request
    const { action, documentId, documentName, content } = await req.json();

    const writerApiUrl = integration.api_domain.replace('accounts', 'writer');

    // Handle different actions
    switch (action) {
      case 'list':
        // List all documents
        const listResponse = await fetch(`${writerApiUrl}/api/v1/documents`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        });

        if (!listResponse.ok) {
          const errorText = await listResponse.text();
          console.error('List documents failed:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to list documents', details: errorText }),
            { status: listResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const listData = await listResponse.json();
        return new Response(
          JSON.stringify(listData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'create':
        // Create new document
        const createResponse = await fetch(`${writerApiUrl}/api/v1/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_name: documentName || 'New Document',
            ...(content && { document_content: content }),
          }),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Create document failed:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to create document', details: errorText }),
            { status: createResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const createData = await createResponse.json();
        return new Response(
          JSON.stringify(createData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get':
        // Get document content
        const getResponse = await fetch(`${writerApiUrl}/api/v1/documents/${documentId}`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        });

        if (!getResponse.ok) {
          const errorText = await getResponse.text();
          console.error('Get document failed:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to get document', details: errorText }),
            { status: getResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const getData = await getResponse.json();
        return new Response(
          JSON.stringify(getData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'delete':
        // Delete document
        const deleteResponse = await fetch(`${writerApiUrl}/api/v1/documents/${documentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('Delete document failed:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to delete document', details: errorText }),
            { status: deleteResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Document deleted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'update':
        // Update document
        const updateResponse = await fetch(`${writerApiUrl}/api/v1/documents/${documentId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(documentName && { document_name: documentName }),
            ...(content && { document_content: content }),
          }),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('Update document failed:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to update document', details: errorText }),
            { status: updateResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData = await updateResponse.json();
        return new Response(
          JSON.stringify(updateData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
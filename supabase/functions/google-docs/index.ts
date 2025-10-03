import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Helper to create base64url encoding
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create JWT for Google API authentication
async function createJWT(
  privateKey: string,
  clientEmail: string,
  scopes: string[]
): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const payload = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: expiry,
    iat: now,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Clean and decode the private key
  let keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "") // Remove escaped newlines
    .replace(/\n/g, "")  // Remove actual newlines
    .replace(/\r/g, "")  // Remove carriage returns
    .replace(/\s+/g, ""); // Remove all whitespace

  // Validate base64 before decoding
  if (!keyData || keyData.length === 0) {
    throw new Error("Private key is empty after cleaning");
  }

  let binaryKey: Uint8Array;
  try {
    binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  } catch (error) {
    console.error("Failed to decode private key:", error);
    throw new Error("Invalid private key format. Please ensure the key is properly formatted base64.");
  }

  // Import the private key for signing
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the token
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const encodedSignature = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${unsignedToken}.${encodedSignature}`;
}

// Get OAuth2 access token from Google
async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get access token:", error);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, documentId, title, content, requests } = await req.json();
    
    console.log("Google Docs request:", { action, documentId, title });

    // Get credentials from environment with detailed validation
    const privateKey = Deno.env.get("Google_Api");
    const clientEmail = "doc-writer@edu-net-doc-writer.iam.gserviceaccount.com";

    // Detailed secret validation
    console.log("=== Secret Validation ===");
    console.log("Private key exists:", privateKey !== undefined);
    console.log("Private key type:", typeof privateKey);
    console.log("Private key length:", privateKey?.length || 0);
    console.log("Private key starts with:", privateKey?.substring(0, 30) || "N/A");
    console.log("========================");

    if (!privateKey) {
      console.error("ERROR: Google_Api secret is undefined or empty!");
      throw new Error("Google API private key not configured in secrets. Please add Google_Api secret in Supabase.");
    }

    if (privateKey.length < 100) {
      console.error("ERROR: Google_Api secret seems too short!");
      throw new Error("Google API private key appears to be invalid (too short).");
    }

    // Create JWT and get access token
    const jwt = await createJWT(privateKey, clientEmail, [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive",
    ]);

    const accessToken = await getAccessToken(jwt);
    console.log("Successfully obtained access token");

    let result;

    switch (action) {
      case "create": {
        // Create new Google Doc
        const createResponse = await fetch(
          "https://docs.googleapis.com/v1/documents",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: title || "مستند جديد",
            }),
          }
        );

        if (!createResponse.ok) {
          const error = await createResponse.text();
          console.error("Create document error:", error);
          throw new Error(`Failed to create document: ${createResponse.status}`);
        }

        const doc = await createResponse.json();
        console.log("Document created:", doc.documentId);

        // If content provided, add it to the document
        if (content) {
          const updateResponse = await fetch(
            `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                requests: [
                  {
                    insertText: {
                      location: { index: 1 },
                      text: content,
                    },
                  },
                ],
              }),
            }
          );

          if (!updateResponse.ok) {
            console.error("Failed to add content to document");
          }
        }

        result = doc;
        break;
      }

      case "update": {
        if (!documentId) {
          throw new Error("Document ID is required for update action");
        }

        const updateRequests = requests || [];

        if (content && updateRequests.length === 0) {
          // If only content provided, insert it
          updateRequests.push({
            insertText: {
              location: { index: 1 },
              text: content,
            },
          });
        }

        const updateResponse = await fetch(
          `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ requests: updateRequests }),
          }
        );

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          console.error("Update document error:", error);
          throw new Error(`Failed to update document: ${updateResponse.status}`);
        }

        result = await updateResponse.json();
        console.log("Document updated successfully");
        break;
      }

      case "read": {
        if (!documentId) {
          throw new Error("Document ID is required for read action");
        }

        const readResponse = await fetch(
          `https://docs.googleapis.com/v1/documents/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!readResponse.ok) {
          const error = await readResponse.text();
          console.error("Read document error:", error);
          throw new Error(`Failed to read document: ${readResponse.status}`);
        }

        result = await readResponse.json();
        console.log("Document read successfully");
        break;
      }

      case "copy": {
        if (!documentId) {
          throw new Error("Document ID is required for copy action");
        }

        const copyResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${documentId}/copy`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: title || "نسخة من المستند",
            }),
          }
        );

        if (!copyResponse.ok) {
          const error = await copyResponse.text();
          console.error("Copy document error:", error);
          throw new Error(`Failed to copy document: ${copyResponse.status}`);
        }

        result = await copyResponse.json();
        console.log("Document copied successfully:", result.id);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in google-docs function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

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
  console.log("🔐 [JWT] Starting JWT creation process...");
  console.log("🔐 [JWT] Client email:", clientEmail);
  console.log("🔐 [JWT] Scopes:", scopes);
  
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

  console.log("🔐 [JWT] Creating header and payload...");
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  console.log("🔐 [JWT] Unsigned token created, length:", unsignedToken.length);

  // Clean and decode the private key
  console.log("🔐 [JWT] Cleaning private key...");
  console.log("🔐 [JWT] Private key original length:", privateKey.length);
  
  let keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "") // Remove escaped newlines
    .replace(/\n/g, "")  // Remove actual newlines
    .replace(/\r/g, "")  // Remove carriage returns
    .replace(/\s+/g, ""); // Remove all whitespace

  console.log("🔐 [JWT] Cleaned key data length:", keyData.length);

  // Validate base64 before decoding
  if (!keyData || keyData.length === 0) {
    console.error("❌ [JWT] Private key is empty after cleaning!");
    throw new Error("Private key is empty after cleaning");
  }

  console.log("🔐 [JWT] Decoding base64 key...");
  let binaryKey: Uint8Array;
  try {
    binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    console.log("✅ [JWT] Successfully decoded base64, binary key length:", binaryKey.length);
  } catch (error) {
    console.error("❌ [JWT] Failed to decode private key:", error);
    throw new Error("Invalid private key format. Please ensure the key is properly formatted base64.");
  }

  // Import the private key for signing
  console.log("🔐 [JWT] Importing crypto key...");
  try {
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
    console.log("✅ [JWT] Crypto key imported successfully");

    // Sign the token
    console.log("🔐 [JWT] Signing token...");
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(unsignedToken)
    );
    console.log("✅ [JWT] Token signed successfully");

    const encodedSignature = base64urlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    const finalJWT = `${unsignedToken}.${encodedSignature}`;
    console.log("✅ [JWT] JWT creation completed, total length:", finalJWT.length);
    return finalJWT;
  } catch (error) {
    console.error("❌ [JWT] Error during key import or signing:", error);
    throw error;
  }
}

// Get OAuth2 access token from Google
async function getAccessToken(jwt: string): Promise<string> {
  console.log("🔑 [TOKEN] Requesting access token from Google OAuth2...");
  console.log("🔑 [TOKEN] JWT length:", jwt.length);
  
  try {
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

    console.log("🔑 [TOKEN] Response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ [TOKEN] Failed to get access token:", error);
      console.error("❌ [TOKEN] Response status:", response.status);
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [TOKEN] Access token received successfully");
    console.log("✅ [TOKEN] Token type:", data.token_type);
    console.log("✅ [TOKEN] Expires in:", data.expires_in, "seconds");
    return data.access_token;
  } catch (error) {
    console.error("❌ [TOKEN] Exception during token request:", error);
    throw error;
  }
}

serve(async (req) => {
  console.log("📥 ============================================");
  console.log("📥 NEW REQUEST RECEIVED");
  console.log("📥 ============================================");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("📥 CORS preflight request, returning headers");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📥 [STEP 1] Parsing request body...");
    const { action, documentId, title, content, requests } = await req.json();
    
    console.log("📥 [STEP 1] Request details:");
    console.log("  - Action:", action);
    console.log("  - Document ID:", documentId || "N/A");
    console.log("  - Title:", title || "N/A");
    console.log("  - Has content:", !!content);
    console.log("  - Has requests:", !!requests);

    console.log("\n🔐 [STEP 2] Reading secrets from environment...");
    const privateKey = Deno.env.get("Google_Api");
    const clientEmail = "doc-writer@edu-net-doc-writer.iam.gserviceaccount.com";

    console.log("🔐 [STEP 2] Secret validation:");
    console.log("  - Private key exists:", privateKey !== undefined);
    console.log("  - Private key is null:", privateKey === null);
    console.log("  - Private key type:", typeof privateKey);
    console.log("  - Private key length:", privateKey?.length || 0);
    console.log("  - Private key starts with:", privateKey?.substring(0, 50) || "N/A");
    console.log("  - Client email:", clientEmail);

    if (!privateKey) {
      console.error("❌ [STEP 2] ERROR: Google_Api secret is undefined or empty!");
      throw new Error("Google API private key not configured in secrets. Please add Google_Api secret in Supabase.");
    }

    if (privateKey.length < 100) {
      console.error("❌ [STEP 2] ERROR: Google_Api secret seems too short! Length:", privateKey.length);
      throw new Error("Google API private key appears to be invalid (too short).");
    }

    console.log("✅ [STEP 2] Secrets validated successfully\n");

    console.log("🔐 [STEP 3] Creating JWT token...");
    const jwt = await createJWT(privateKey, clientEmail, [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive",
    ]);
    console.log("✅ [STEP 3] JWT created successfully\n");

    console.log("🔑 [STEP 4] Getting access token...");
    const accessToken = await getAccessToken(jwt);
    console.log("✅ [STEP 4] Access token obtained successfully\n");

    console.log("📝 [STEP 5] Executing action:", action);
    let result;

    switch (action) {
      case "create": {
        console.log("📝 [CREATE] Creating new Google Doc...");
        console.log("📝 [CREATE] Title:", title || "مستند جديد");
        
        try {
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

          console.log("📝 [CREATE] Response status:", createResponse.status);

          if (!createResponse.ok) {
            const error = await createResponse.text();
            console.error("❌ [CREATE] Failed to create document!");
            console.error("❌ [CREATE] Status:", createResponse.status);
            console.error("❌ [CREATE] Error details:", error);
            throw new Error(`Failed to create document: ${createResponse.status}`);
          }

          const doc = await createResponse.json();
          console.log("✅ [CREATE] Document created successfully!");
          console.log("✅ [CREATE] Document ID:", doc.documentId);
          console.log("✅ [CREATE] Document title:", doc.title);

          // Share the document publicly so anyone with the link can edit
          console.log("📝 [CREATE] Sharing document publicly...");
          try {
            const shareResponse = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.documentId}/permissions`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  role: "writer", // Editor permission
                  type: "anyone", // Anyone with the link
                }),
              }
            );

            if (!shareResponse.ok) {
              const shareError = await shareResponse.text();
              console.error("⚠️ [CREATE] Failed to share document:", shareError);
            } else {
              console.log("✅ [CREATE] Document shared successfully!");
            }
          } catch (shareError) {
            console.error("❌ [CREATE] Error sharing document:", shareError);
          }

          // If content provided, add it to the document
          if (content) {
            console.log("📝 [CREATE] Adding content to document...");
            try {
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
                console.error("⚠️ [CREATE] Failed to add content to document");
              } else {
                console.log("✅ [CREATE] Content added successfully");
              }
            } catch (contentError) {
              console.error("❌ [CREATE] Error adding content:", contentError);
            }
          }

          result = doc;
        } catch (createError) {
          console.error("❌ [CREATE] Exception during create:", createError);
          throw createError;
        }
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
    console.log("✅ ============================================");
    console.log("✅ REQUEST COMPLETED SUCCESSFULLY");
    console.log("✅ ============================================\n");

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ ============================================");
    console.error("❌ ERROR IN GOOGLE-DOCS FUNCTION");
    console.error("❌ ============================================");
    console.error("❌ Error type:", error.constructor.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ ============================================\n");
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        errorType: error.constructor.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

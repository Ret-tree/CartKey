// GET /api/kroger/me/profile
// Returns the user's Kroger profile data via Identity API.
// Includes loyalty card barcode, profile ID, and basic info.

import { getUserAccessToken } from '../../_user-token';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const result = await getUserAccessToken(context.request, context.env);
  if (!result) return jsonError('Not connected to Kroger', 401);

  try {
    // Primary: /identity/profile returns id and possibly loyaltyId
    const response = await fetch('https://api.kroger.com/v1/identity/profile', {
      headers: { Authorization: `Bearer ${result.accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) return jsonError('Session expired — reconnect', 401);
      return jsonError(`Kroger API error: ${response.status}`, 502);
    }

    const data = await response.json() as {
      data: { id: string; loyaltyId?: string; loyaltyID?: string };
    };

    // Kroger inconsistently capitalizes the field — check both
    let loyaltyId = data.data.loyaltyId || data.data.loyaltyID || null;

    // If still missing, try the dedicated loyalty endpoint (requires loyalty scope)
    if (!loyaltyId) {
      try {
        const loyaltyResponse = await fetch('https://api.kroger.com/v1/identity/profile/loyalty', {
          headers: { Authorization: `Bearer ${result.accessToken}` },
        });
        if (loyaltyResponse.ok) {
          const loyaltyData = await loyaltyResponse.json() as {
            data?: { loyaltyId?: string; loyaltyID?: string; cardNumber?: string };
          };
          loyaltyId = loyaltyData.data?.loyaltyId || loyaltyData.data?.loyaltyID || loyaltyData.data?.cardNumber || null;
        }
      } catch {
        // Loyalty endpoint not accessible — fall through
      }
    }

    return jsonResponse({
      profileId: data.data.id,
      loyaltyId,
    });
  } catch (err) {
    return jsonError(`Profile fetch failed: ${(err as Error).message}`, 502);
  }
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

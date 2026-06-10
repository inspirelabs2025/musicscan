import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEASUREMENT_ID = 'G-B1TBDCNMR4';

let cachedToken: { token: string; exp: number } | null = null;
let cachedPropertyId: string | null = null;

interface Credentials {
  client_email: string;
  private_key: string;
}

async function getAccessToken(creds: Credentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp > now + 60) return cachedToken.token;

  const privateKey = await importPKCS8(creds.private_key, 'RS256');
  const jwt = await new SignJWT({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + 3500 };
  return data.access_token;
}

async function discoverPropertyId(token: string): Promise<string> {
  if (cachedPropertyId) return cachedPropertyId;
  const envProp = Deno.env.get('GA4_PROPERTY_ID');
  if (envProp) {
    cachedPropertyId = envProp;
    return envProp;
  }

  // List accounts the service account has access to
  const accRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!accRes.ok) throw new Error(`Admin API failed: ${await accRes.text()}`);
  const accData = await accRes.json();

  for (const acc of accData.accountSummaries || []) {
    for (const prop of acc.propertySummaries || []) {
      const propId = prop.property?.replace('properties/', '');
      if (!propId) continue;
      // Find data streams for this property and match measurement ID
      const dsRes = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/properties/${propId}/dataStreams`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!dsRes.ok) continue;
      const dsData = await dsRes.json();
      for (const stream of dsData.dataStreams || []) {
        if (stream.webStreamData?.measurementId === MEASUREMENT_ID) {
          cachedPropertyId = propId;
          return propId;
        }
      }
    }
  }
  throw new Error(`Property not found for measurement ID ${MEASUREMENT_ID}. Voeg het service account toe als Viewer in GA4.`);
}

async function runReport(token: string, propertyId: string, body: unknown) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`runReport failed: ${await res.text()}`);
  return res.json();
}

async function runRealtimeReport(token: string, propertyId: string, body: unknown) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`runRealtimeReport failed: ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const credsJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!credsJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY niet geconfigureerd');
    const creds: Credentials = JSON.parse(credsJson);

    const { range = '28daysAgo' } = await req.json().catch(() => ({}));

    const token = await getAccessToken(creds);
    const propertyId = await discoverPropertyId(token);

    // Run multiple reports in parallel
    const [overview, timeseries, topPages, sources, devices, countries, realtime, events] = await Promise.all([
      // Overview KPIs
      runReport(token, propertyId, {
        dateRanges: [{ startDate: range, endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'engagementRate' },
        ],
      }),
      // Daily timeseries
      runReport(token, propertyId, {
        dateRanges: [{ startDate: range, endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      // Top pages
      runReport(token, propertyId, {
        dateRanges: [{ startDate: range, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 25,
      }),
      // Traffic sources
      runReport(token, propertyId, {
        dateRanges: [{ startDate: range, endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),
      // Devices
      runReport(token, propertyId, {
        dateRanges: [{ startDate: range, endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      }),
      // Countries
      runReport(token, propertyId, {
        dateRanges: [{ startDate: range, endDate: 'today' }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 15,
      }),
      // Realtime (last 30 min)
      runRealtimeReport(token, propertyId, {
        metrics: [{ name: 'activeUsers' }],
      }),
      // Top events
      runReport(token, propertyId, {
        dateRanges: [{ startDate: range, endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 20,
      }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        propertyId,
        range,
        overview,
        timeseries,
        topPages,
        sources,
        devices,
        countries,
        realtime,
        events,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('GA4 analytics error:', e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

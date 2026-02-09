/**
 * Jira API Proxy for Cloudflare Workers
 * 
 * Denne workeren vidaresender API-kall til Jira Cloud og legg til CORS-headerar
 * slik at nettlesaren din kan kalla Jira frå localhost eller GitHub Pages.
 * 
 * Oppdatert for nytt Jira Cloud API (2025) som krev POST til /rest/api/3/search/jql
 * 
 * Deploy:
 * 1. Gå til https://dash.cloudflare.com/ og logg inn (gratis)
 * 2. Vel "Workers & Pages" → "Create" → "Create Worker"
 * 3. Gje workeren eit namn og klikk "Deploy"
 * 4. Klikk "Edit code" og lim inn denne koden
 * 5. Klikk "Deploy"
 * 6. Noter URL-en (t.d. https://jira-proxy.ditt-namn.workers.dev)
 */

export default {
  async fetch(request, env, ctx) {
    // Handter preflight CORS-førespurnader
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    // Berre tillat POST for ekstra sikkerheit
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Bruk POST med JSON body' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
      );
    }

    try {
      const body = await request.json();
      const { jiraHost, email, token, requestBody, path, method: reqMethod } = body;

      // Valider input
      if (!jiraHost || !email || !token || (!requestBody && !path)) {
        return new Response(
          JSON.stringify({ error: 'Manglar påkravde felt: jiraHost, email, token, og requestBody eller path' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
        );
      }

      // Sikkerheitssjekk: berre tillat Atlassian-domene
      if (!jiraHost.endsWith('.atlassian.net')) {
        return new Response(
          JSON.stringify({ error: 'Ugyldig Jira host - må vera *.atlassian.net' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
        );
      }

      // Lag Basic Auth header
      const auth = btoa(`${email}:${token}`);

      // Bestem URL og metode: generisk path eller standard søke-endepunkt
      let jiraUrl, fetchMethod, fetchBody;
      if (path) {
        jiraUrl = `https://${jiraHost}${path}`;
        fetchMethod = reqMethod || 'GET';
        fetchBody = requestBody ? JSON.stringify(requestBody) : undefined;
      } else {
        jiraUrl = `https://${jiraHost}/rest/api/3/search/jql`;
        fetchMethod = 'POST';
        fetchBody = JSON.stringify(requestBody);
      }

      // Kall Jira API
      const fetchOptions = {
        method: fetchMethod,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      };
      if (fetchBody) {
        fetchOptions.body = fetchBody;
      }

      const jiraResponse = await fetch(jiraUrl, fetchOptions);

      // Hent respons-body
      const responseData = await jiraResponse.text();

      // Returner med CORS-headerar
      if (!jiraResponse.ok) {
        return new Response(
          JSON.stringify({ 
            error: `Jira svarte med ${jiraResponse.status}`, 
            status: jiraResponse.status,
            jiraResponse: responseData 
          }), 
          { status: jiraResponse.status, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
        );
      }

      return new Response(responseData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
        },
      });

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Proxy-feil', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
      );
    }
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  
  // I produksjon kan du avgrensa til spesifikke domene:
  // const allowedOrigins = ['https://ditt-team.github.io', 'http://localhost:5173'];
  // const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

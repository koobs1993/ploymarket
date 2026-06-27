const ALLOWED_ORIGINS = {
  gamma: "https://gamma-api.polymarket.com",
  clob: "https://clob.polymarket.com",
} as const;

type Service = keyof typeof ALLOWED_ORIGINS;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function handler(event: {
  httpMethod: string;
  queryStringParameters?: Record<string, string | undefined>;
}) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const service = event.queryStringParameters?.service as Service | undefined;
  const path = event.queryStringParameters?.path;

  if (!service || !path || !(service in ALLOWED_ORIGINS)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid proxy request" }),
    };
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
    if (key === "service" || key === "path" || value === undefined) continue;
    params.set(key, value);
  }

  const query = params.toString();
  const url = `${ALLOWED_ORIGINS[service]}/${path}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "public, max-age=10",
      },
      body,
    };
  } catch {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Upstream request failed" }),
    };
  }
}

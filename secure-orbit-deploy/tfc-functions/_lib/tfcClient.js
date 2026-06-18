const TFC_BASE_URL = "https://app.terraform.io/api/v2";

function tfcToken() {
  const token = Deno.env.get("TFC_API_TOKEN");
  if (!token) throw new Error("TFC_API_TOKEN is not configured");
  return token;
}

export function tfcOrg() {
  const org = Deno.env.get("TFC_ORG");
  if (!org) throw new Error("TFC_ORG is not configured");
  return org;
}

export async function tfcRequest(path, { method = "GET", body, accept } = {}) {
  const res = await fetch(`${TFC_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${tfcToken()}`,
      "Content-Type": "application/vnd.api+json",
      ...(accept ? { Accept: accept } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Terraform Cloud API ${method} ${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Plan/apply log-read-urls and configuration-version upload-urls are plain HTTP(S)
// URLs, not under /api/v2 — call them directly with the same bearer token.
export async function tfcRawGet(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tfcToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return res.text();
}

export async function tfcRawPut(url, bytes) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Failed to upload configuration version to ${url} (${res.status})`);
}

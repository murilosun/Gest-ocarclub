/** Thin wrapper around fetch for /api calls. Cookies are sent automatically (same-origin). */

const BASE = "/api";

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res;
}

export const apiGet    = (path: string)                      => req("GET",    path);
export const apiPost   = (path: string, body: unknown)       => req("POST",   path, body);
export const apiPut    = (path: string, body: unknown)       => req("PUT",    path, body);
export const apiDelete = (path: string)                      => req("DELETE", path);

/** Convenience: fetch JSON or throw */
export async function apiJson<T = unknown>(path: string): Promise<T> {
  const res = await apiGet(path);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

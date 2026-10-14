"use client";

// Anonymous identity: a random id kept in localStorage, sent with every request.
// Swap for real auth (e.g. Clerk / Supabase Auth) when accounts are needed.
export function ownerId() {
  let id = localStorage.getItem("fp-owner");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("fp-owner", id);
  }
  return id;
}

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", "x-owner": ownerId(), ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

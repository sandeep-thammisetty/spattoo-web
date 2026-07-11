// ── "My Decorations" apiClient methods ───────────────────────────────────────
//
// Shared by BOTH clients — the baker's (bakerApi.ts) and the customer's (api.ts) — because the upload
// studio is the same screen for both. The API decides who ends up owning the result (a baker's
// decoration is shared with their bakery; a customer's is private to them), so the client is identical
// and there is nothing here to branch on. One builder, not two copies that drift.

type AuthFetch = (path: string, opts?: RequestInit) => Promise<any>;
type SignUpload = (folder: string, filename: string, contentType: string) => Promise<{ url: string; key: string }>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export function makeMyElementMethods(
  authFetch: AuthFetch,
  getSignedUploadUrl: SignUpload,
  getToken: () => Promise<string | undefined>,
) {
  return {
    // Cut the background out of an upload. Sends raw bytes and gets a PNG back — NOT JSON, so it can't
    // go through authFetch. The provider behind this (a paid vendor today, our own model later) is a
    // server-side config choice; the client never knows which.
    removeElementBg: async (file: Blob): Promise<Blob> => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/elements/remove-bg`, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? `Background removal failed (${res.status})`);
      }
      return res.blob();
    },

    // Put the finished artwork in R2 and return its key. Reuses the SAME signed-upload flow every other
    // asset uses — the studio does not get a private upload path.
    uploadElementImage: async (blob: Blob, filename: string): Promise<string> => {
      const contentType = blob.type || "image/png";
      const { url, key } = await getSignedUploadUrl("elements/files/2D", filename, contentType);
      const put = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
      if (!put.ok) throw new Error("Upload failed");
      return key;
    },

    // Create the element. Ownership (baker_id / customer_id) is stamped SERVER-side from the token —
    // deliberately not sendable from here.
    createMyElement: (payload: Record<string, unknown>) =>
      authFetch("/api/elements", { method: "POST", body: JSON.stringify(payload) }),

    deleteMyElement: (id: string) =>
      authFetch(`/api/elements/${id}`, { method: "DELETE" }),

    // Lets the studio say "you've used N of M" before a file is even picked, rather than failing the
    // user after they've done the work.
    fetchElementQuota: () => authFetch("/api/elements/quota"),
  };
}

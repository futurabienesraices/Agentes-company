/**
 * Meta Graph API Integration — Futura OS
 * Connects directly to Facebook Pages & Instagram Business accounts.
 * Enables automatic fetching of recent posts and direct 1-click publishing.
 */

const META_API_VERSION = "v20.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export type MetaAccount = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  };
};

export type MetaPost = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
};

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta META_ACCESS_TOKEN en las variables de entorno (.env.local).");
  }
  return token;
}

// ─── 1. Get Accounts (FB Pages & IG Business Accounts) ───────────────

export async function getMetaAccounts(): Promise<MetaAccount[]> {
  const token = getAccessToken();
  const url = `${META_BASE_URL}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error en Meta API (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  return (json.data || []) as MetaAccount[];
}

// ─── 2. Fetch Recent Instagram Posts ──────────────────────────────────

export async function getInstagramRecentPosts(
  igAccountId?: string,
  limit: number = 10
): Promise<{ igAccountId: string; posts: MetaPost[] }> {
  let targetId = igAccountId;

  if (!targetId) {
    const accounts = await getMetaAccounts();
    const igAcc = accounts.find((a) => a.instagram_business_account?.id);
    if (!igAcc?.instagram_business_account?.id) {
      throw new Error("No se encontró ninguna cuenta de Instagram Business vinculada a la página de Facebook.");
    }
    targetId = igAcc.instagram_business_account.id;
  }

  const token = getAccessToken();
  const fields = "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count";
  const url = `${META_BASE_URL}/${targetId}/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al obtener publicaciones de Instagram (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  return {
    igAccountId: targetId,
    posts: (json.data || []) as MetaPost[],
  };
}

// ─── 3. Publish Image directly to Instagram ───────────────────────────

export async function publishToInstagram(
  igAccountId: string,
  imageUrl: string,
  caption: string
): Promise<{ publishedPostId: string; permalink?: string }> {
  const token = getAccessToken();

  // Paso A: Crear el contenedor multimedia
  const createContainerUrl = `${META_BASE_URL}/${igAccountId}/media`;
  const containerRes = await fetch(createContainerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: caption,
      access_token: token,
    }),
  });

  if (!containerRes.ok) {
    const errText = await containerRes.text();
    throw new Error(`Error al crear contenedor en Instagram: ${errText}`);
  }

  const containerJson = await containerRes.json();
  const creationId = containerJson.id;

  // Paso B: Publicar el contenedor creado
  const publishUrl = `${META_BASE_URL}/${igAccountId}/media_publish`;
  const publishRes = await fetch(publishUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: token,
    }),
  });

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    throw new Error(`Error al publicar el post en Instagram: ${errText}`);
  }

  const publishJson = await publishRes.json();

  return {
    publishedPostId: publishJson.id,
  };
}

// ─── 4. Publish Post directly to Facebook Page ────────────────────────

export async function publishToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
  link?: string
): Promise<{ postId: string }> {
  const url = `${META_BASE_URL}/${pageId}/feed`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      link,
      access_token: pageAccessToken,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al publicar en la Página de Facebook: ${errText}`);
  }

  const json = await res.json();
  return { postId: json.id };
}

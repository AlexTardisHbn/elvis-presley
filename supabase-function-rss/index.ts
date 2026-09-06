// Fonction Supabase Edge : génère le flux RSS des publications publiées.
// À déployer avec le nom "rss" (voir INSTALLATION-ADMIN.md, section RSS).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://alexhibon-ah.github.io"; // <-- remplace par l'URL de ton site GitHub Pages
const SITE_TITLE = "Elvis Presley — Avis & Articles";
const SITE_DESCRIPTION = "Mes avis, critiques et articles personnels sur Elvis Presley.";

function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  const client = createClient(supabaseUrl, supabaseKey);

  const { data: posts, error } = await client
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return new Response("Erreur lors de la génération du flux RSS", { status: 500 });
  }

  const items = (posts || []).map((post) => {
    const link = `${SITE_URL}/article.html?id=${post.id}`;
    const pubDate = new Date(post.created_at).toUTCString();
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(post.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.type)}</category>
      <description>${escapeXml(post.content)}</description>
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>fr</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
});

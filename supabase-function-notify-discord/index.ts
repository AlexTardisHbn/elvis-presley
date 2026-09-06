// Fonction Supabase Edge : envoie un message Discord quand une nouvelle
// publication est créée depuis admin.html.
// À déployer avec le nom "notify-discord" (voir INSTALLATION-ADMIN.md).
//
// Contrairement à une fonction publique, celle-ci garde la vérification
// JWT active (ne PAS déployer avec --no-verify-jwt) : seul un utilisateur
// connecté (toi) peut donc l'appeler.

const SITE_URL = "https://alexhibon-ah.github.io"; // <-- remplace par l'URL de ton site GitHub Pages

const typeLabels: Record<string, string> = {
  avis: "Avis",
  critique: "Critique",
  article: "Article",
};

Deno.serve(async (req) => {
  try {
    const { title, type, id } = await req.json();
    const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "Webhook non configuré" }), { status: 500 });
    }

    const link = `${SITE_URL}/article.html?id=${id}`;
    const label = typeLabels[type] || type;

    const discordPayload = {
      content: `📰 Nouveau **${label}** publié : **${title}**\n${link}`,
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

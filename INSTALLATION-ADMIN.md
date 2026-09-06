# Mise en place de l'espace admin (Supabase)

Si tu as déjà suivi une version précédente de ce guide (table `posts`
de base déjà créée), passe directement à la **section « Mise à
jour »** plus bas : tu n'as qu'à exécuter le nouveau SQL en plus, pas
besoin de tout recommencer.

## Installation complète (nouveau projet)

### 1. Créer un compte et un projet Supabase
1. Va sur https://supabase.com et crée un compte gratuit.
2. Crée un nouveau projet.
3. Attends la fin du provisionnement (1-2 minutes).

### 2. Créer la table des publications
**SQL Editor** > **New query**, colle et exécute :

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('avis','critique','article')),
  title text not null,
  content text not null,
  cover_url text,
  published boolean not null default true,
  views integer not null default 0,
  created_at timestamptz default now()
);

alter table posts enable row level security;

-- Le public ne voit que les publications marquées "publiées"
create policy "Lecture publique des publications publiees"
  on posts for select
  using ( published = true );

-- Toi (connecté) vois tout, y compris les brouillons
create policy "Lecture complete pour les connectes"
  on posts for select
  using ( auth.role() = 'authenticated' );

create policy "Creation reservee aux connectes"
  on posts for insert
  with check (auth.role() = 'authenticated');

create policy "Modification reservee aux connectes"
  on posts for update
  using (auth.role() = 'authenticated');

create policy "Suppression reservee aux connectes"
  on posts for delete
  using (auth.role() = 'authenticated');
```

### 3. Créer le stockage pour les images de couverture
Toujours dans **SQL Editor**, nouvelle requête :

```sql
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true);

create policy "Lecture publique des images"
on storage.objects for select
using ( bucket_id = 'post-images' );

create policy "Upload reserve aux connectes"
on storage.objects for insert
with check ( bucket_id = 'post-images' and auth.role() = 'authenticated' );

create policy "Modification image reservee aux connectes"
on storage.objects for update
using ( bucket_id = 'post-images' and auth.role() = 'authenticated' );

create policy "Suppression image reservee aux connectes"
on storage.objects for delete
using ( bucket_id = 'post-images' and auth.role() = 'authenticated' );
```

### 4. Créer la fonction de comptage des vues
Nouvelle requête SQL :

```sql
create or replace function increment_view_count(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update posts set views = views + 1 where id = post_id;
end;
$$;

grant execute on function increment_view_count(uuid) to anon, authenticated;
```

### 5. Créer ton compte admin
1. **Authentication** > **Providers** : désactive « Allow new users to
   sign up ».
2. **Authentication** > **Users** > **Add user** > **Create new
   user** : renseigne ton e-mail et un mot de passe.

### 6. Autoriser la page de réinitialisation de mot de passe
**Authentication** > **URL Configuration** > **Redirect URLs** :
ajoute l'URL de ta page `reset.html`, par exemple :
```
https://tonpseudo.github.io/ton-repo/reset.html
```

### 7. Récupérer tes clés d'API
**Project Settings** > **API** : copie l'**URL** du projet et la clé
**anon public**, et colle-les dans `supabase-config.js` :
```js
const SUPABASE_URL = "https://TON-PROJET.supabase.co";
const SUPABASE_ANON_KEY = "TA_CLE_ANON_PUBLIC";
```

### 8. Mettre en ligne
Pousse tous ces fichiers sur ton dépôt GitHub Pages :
`index.html`, `admin.html`, `article.html`, `reset.html`,
`supabase-config.js`.

---

## Mise à jour (si la table `posts` existe déjà)

Exécute uniquement ce SQL dans **SQL Editor** :

```sql
alter table posts add column if not exists cover_url text;
alter table posts add column if not exists published boolean not null default true;
alter table posts add column if not exists views integer not null default 0;

drop policy if exists "Lecture publique" on posts;

create policy "Lecture publique des publications publiees"
  on posts for select
  using ( published = true );

create policy "Lecture complete pour les connectes"
  on posts for select
  using ( auth.role() = 'authenticated' );
```

Puis exécute aussi les blocs SQL des **étapes 3 et 4** ci-dessus
(stockage des images + fonction de comptage), et l'**étape 6**
(URL de redirection pour `reset.html`).

Enfin, pousse les fichiers mis à jour sur GitHub : `index.html`,
`admin.html` (modifiés), `article.html`, `reset.html` (nouveaux).

---

## Notification Discord (optionnel)

À chaque nouvelle publication publiée, un message peut être envoyé
automatiquement dans un salon Discord. Comme pour le RSS, ça
nécessite de déployer une petite fonction via la ligne de commande
Supabase CLI (le webhook Discord ne doit jamais être visible dans le
code du site, sinon n'importe qui pourrait spammer ton salon).

### 1. Créer le webhook côté Discord
1. Dans Discord, va dans les paramètres du salon où tu veux recevoir
   les notifications (icône ⚙️ à côté du nom du salon).
2. **Intégrations** > **Webhooks** > **Nouveau webhook**.
3. Donne-lui un nom (ex : "Nouveautés site"), puis clique sur
   **Copier l'URL du webhook**. Garde cette adresse de côté, elle
   est secrète.

### 2. Installer Supabase CLI (si ce n'est pas déjà fait)
```
npm install -g supabase
```

### 3. Se connecter et relier le projet (si ce n'est pas déjà fait)
```
supabase login
supabase link --project-ref xmdicoanogsfwtsaijny
```

### 4. Enregistrer le webhook comme secret
```
supabase secrets set DISCORD_WEBHOOK_URL="colle-ici-l-url-copiee-a-l-etape-1"
```

### 5. Créer la fonction
```
supabase functions new notify-discord
```
Remplace le contenu du fichier `index.ts` généré par celui fourni
dans `supabase-function-notify-discord/index.ts` (dans ce zip).
Modifie la ligne `SITE_URL` en haut du fichier avec l'adresse réelle
de ton site GitHub Pages.

### 6. Déployer
```
supabase functions deploy notify-discord
```
Contrairement au RSS, on NE met PAS `--no-verify-jwt` ici : seul un
utilisateur connecté (toi, depuis `admin.html`) doit pouvoir
déclencher une notification.

### 7. Tester
Connecte-toi sur `admin.html`, crée une nouvelle publication (case
« Publié » cochée), enregistre : un message doit apparaître dans le
salon Discord choisi en quelques secondes.

### Pour mettre à jour la fonction plus tard
Si tu modifies `index.ts` (ex: changer `SITE_URL`), redéploie avec
la même commande qu'à l'étape 6.

---

## Utilisation

- **Visiteurs** : dans la section « Avis & Articles », ils peuvent
  filtrer par type (Avis / Critiques / Articles) et trier par
  « Plus récents » ou « Plus lus ». Cliquer sur un titre ouvre la
  page complète de l'article, avec son compteur de vues.
- **Toi** : bouton « 🔒 Connexion » en haut du site, ou
  `admin.html` directement.
  - **Nouvelle publication** : type, titre, contenu, image de
    couverture (optionnelle), case « Publié » (décoche-la pour
    enregistrer un brouillon invisible du public). Si publiée et que
    tu as configuré la notification Discord ci-dessus, un message
    est envoyé automatiquement dans ton salon.
  - **Modifier / Supprimer** depuis la liste.
  - **Mot de passe oublié ?** sur l'écran de connexion : un e-mail
    de réinitialisation t'est envoyé, avec un lien vers `reset.html`
    pour choisir un nouveau mot de passe.
  - **← Retour au site** : lien présent sur l'écran de connexion et
    dans le tableau de bord.

## Sécurité
- La clé "anon public" est faite pour être publique : ce sont les
  règles RLS qui protègent réellement les données.
- Ne mets jamais la "service_role key" dans ces fichiers.
- Choisis un mot de passe robuste pour ton compte admin.

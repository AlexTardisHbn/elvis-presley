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

## Flux RSS (optionnel)

Contrairement au reste (SQL, config), cette partie ne se fait pas
depuis le dashboard Supabase seul : il faut déployer une petite
« fonction serveur » (Edge Function) avec l'outil en ligne de
commande Supabase CLI, car GitHub Pages ne peut pas générer de XML
à la demande lui-même.

### 1. Installer Supabase CLI
Sur ton ordinateur (nécessite Node.js) :
```
npm install -g supabase
```

### 2. Te connecter et relier ton projet
```
supabase login
supabase link --project-ref xmdicoanogsfwtsaijny
```
(remplace `xmdicoanogsfwtsaijny` par l'identifiant de ton projet,
visible dans l'URL de ton dashboard Supabase ou dans
`SUPABASE_URL`).

### 3. Créer la fonction
```
supabase functions new rss
```
Cela crée un dossier `supabase/functions/rss/`. Remplace le contenu
de son fichier `index.ts` par celui fourni dans
`supabase-function-rss/index.ts` (dans ce zip). Pense à modifier la
ligne `SITE_URL` en haut du fichier avec l'adresse réelle de ton
site GitHub Pages.

### 4. Déployer
```
supabase functions deploy rss --no-verify-jwt
```
Le `--no-verify-jwt` est nécessaire car le flux doit être lisible
par tout le monde (lecteurs RSS), sans connexion.

### 5. Vérifier
Le flux est désormais disponible à :
```
https://xmdicoanogsfwtsaijny.supabase.co/functions/v1/rss
```
Ouvre cette adresse dans ton navigateur : tu dois voir du XML avec
tes publications. C'est cette même adresse qui est déjà reliée dans
`index.html` (balise `<link rel="alternate">` + bouton « RSS » dans
le pied de page).

### Pour mettre à jour la fonction plus tard
Si tu modifies `index.ts`, redéploie avec la même commande qu'à
l'étape 4.

---



- **Visiteurs** : dans la section « Avis & Articles », ils peuvent
  filtrer par type (Avis / Critiques / Articles) et trier par
  « Plus récents » ou « Plus lus ». Cliquer sur un titre ouvre la
  page complète de l'article, avec son compteur de vues. Un bouton
  « RSS » dans le pied de page permet de s'abonner aux nouvelles
  publications (si tu as déployé la fonction RSS ci-dessus).
- **Toi** : bouton « 🔒 Connexion » en haut du site, ou
  `admin.html` directement.
  - **Nouvelle publication** : type, titre, contenu, image de
    couverture (optionnelle), case « Publié » (décoche-la pour
    enregistrer un brouillon invisible du public).
  - **Modifier / Supprimer** depuis la liste.
  - **Mot de passe oublié ?** sur l'écran de connexion : un e-mail
    de réinitialisation t'est envoyé, avec un lien vers `reset.html`
    pour choisir un nouveau mot de passe.

## Sécurité
- La clé "anon public" est faite pour être publique : ce sont les
  règles RLS qui protègent réellement les données.
- Ne mets jamais la "service_role key" dans ces fichiers.
- Choisis un mot de passe robuste pour ton compte admin.

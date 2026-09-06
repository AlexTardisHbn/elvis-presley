# Mise en place de l'espace admin (Supabase)

## 1. Créer un compte et un projet Supabase
1. Va sur https://supabase.com et crée un compte gratuit.
2. Crée un nouveau projet (choisis un nom et un mot de passe de base de données, garde-le de côté).
3. Attends la fin du provisionnement (1-2 minutes).

## 2. Créer la table des publications
Dans le tableau de bord Supabase : **SQL Editor** > **New query**, colle et exécute :

```sql
-- Si tu avais déjà créé une table "site_content" lors d'une étape précédente,
-- tu peux la supprimer, elle n'est plus utilisée :
-- drop table if exists site_content;

create table posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('avis','critique','article')),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table posts enable row level security;

-- Tout le monde peut LIRE les publications
create policy "Lecture publique"
  on posts for select
  using (true);

-- Seul un utilisateur connecté (toi) peut créer / modifier / supprimer
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

## 3. Créer ton compte admin (le seul autorisé)
1. Dans le dashboard : **Authentication** > **Providers**, désactive
   « Allow new users to sign up » (important : sinon n'importe qui
   pourrait créer un compte et publier/modifier du contenu).
2. Toujours dans **Authentication** > **Users**, clique sur
   « Add user » > « Create new user », renseigne ton e-mail et un
   mot de passe. C'est ce compte que tu utiliseras pour te connecter
   sur `admin.html`.

## 4. Récupérer tes clés d'API
Dans **Project Settings** > **API** :
- copie l'**URL** du projet
- copie la clé **anon public**

Ouvre le fichier `supabase-config.js` et remplace :
```js
const SUPABASE_URL = "https://TON-PROJET.supabase.co";
const SUPABASE_ANON_KEY = "TA_CLE_ANON_PUBLIC";
```
par tes propres valeurs.

## 5. Mettre en ligne
Envoie (`git push`) les fichiers sur ton dépôt GitHub Pages :
- `index.html` (modifié)
- `admin.html` (nouveau / modifié)
- `supabase-config.js` (nouveau, avec tes vraies clés)

## 6. Utilisation
- **Visiteurs** : voient toutes les publications dans la section
  « Avis & Articles » de la page principale, en lecture seule.
- **Toi** : clique sur « 🔒 Connexion » en haut du site (ou va
  directement sur `tonsite.github.io/admin.html`), connecte-toi avec
  ton e-mail/mot de passe, puis :
  - « + Nouvelle publication » pour rédiger un avis, une critique ou
    un article (avec un type, un titre et un contenu) ;
  - « Modifier » ou « Supprimer » sur une publication existante
    depuis la liste.
  Chaque publication apparaît instantanément sur le site public dès
  qu'elle est enregistrée.

## Sécurité
- La clé "anon public" est faite pour être visible publiquement dans
  le code : ce sont les règles RLS (étape 2) qui protègent réellement
  les données, pas le secret de cette clé.
- Ne mets jamais la "service_role key" dans ces fichiers : elle donne
  un accès total à la base sans restriction.
- Choisis un mot de passe robuste pour ton compte admin.

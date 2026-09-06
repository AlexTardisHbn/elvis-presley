# Mise en place de l'espace admin (Supabase)

## 1. Créer un compte et un projet Supabase
1. Va sur https://supabase.com et crée un compte gratuit.
2. Crée un nouveau projet (choisis un nom et un mot de passe de base de données, garde-le de côté).
3. Attends la fin du provisionnement (1-2 minutes).

## 2. Créer la table qui stocke le texte
Dans le tableau de bord Supabase : **SQL Editor** > **New query**, colle et exécute :

```sql
create table site_content (
  id text primary key,
  content text not null,
  updated_at timestamptz default now()
);

insert into site_content (id, content) values (
  'avis_personnel',
  'Ceci est un texte d''exemple. Remplace-le par ton propre avis personnel sur Elvis.'
);

alter table site_content enable row level security;

-- Tout le monde peut LIRE
create policy "Lecture publique"
  on site_content for select
  using (true);

-- Seul un utilisateur connecté (toi) peut MODIFIER
create policy "Modification reservee aux connectes"
  on site_content for update
  using (auth.role() = 'authenticated');
```

## 3. Créer ton compte admin (le seul autorisé)
1. Dans le dashboard : **Authentication** > **Providers**, désactive
   « Allow new users to sign up » (important : sinon n'importe qui
   pourrait créer un compte et modifier le texte).
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
Envoie (`git push`) les fichiers modifiés/ajoutés sur ton dépôt GitHub Pages :
- `index.html` (modifié)
- `admin.html` (nouveau)
- `supabase-config.js` (nouveau, avec tes vraies clés)

## 6. Utilisation
- Le grand public voit le texte sur la page principale, section
  « Mon avis personnel » — en lecture seule.
- Toi seul te connectes sur `tonsite.github.io/admin.html` avec ton
  e-mail/mot de passe pour modifier le texte et l'enregistrer.

## Sécurité
- La clé "anon public" est faite pour être visible publiquement dans
  le code : ce sont les règles RLS (étape 2) qui protègent réellement
  les données, pas le secret de cette clé.
- Ne mets jamais la "service_role key" dans ces fichiers : elle donne
  un accès total à la base sans restriction.
- Choisis un mot de passe robuste pour ton compte admin.

# USA Plates 🇺🇸

Application de roadtrip : chaque participant photographie les 50 plaques d'immatriculation des états américains et répond à un mini-quiz (capitale + population) pour chaque état.

- **50 points** par plaque validée par un admin
- **25 points** par bonne réponse au quiz (2 questions/état, 50 pts max)
- **100 points max par état**, 5000 au total

## 1. Configurer la base Supabase (à faire une seule fois)

1. Ouvre ton projet Supabase → **SQL Editor**.
2. Colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) et exécute-le. Cela crée :
   - les tables `profiles`, `states` (avec les 50 états pré-remplis), `plates`, `quiz_answers`
   - toutes les policies RLS nécessaires
   - le bucket de stockage public `plates` pour les photos
3. Va dans **Authentication → Providers** et vérifie que l'inscription email/mot de passe est activée. Si tu veux éviter que les gens confirment leur email (plus simple pour un groupe privé), désactive "Confirm email" dans **Authentication → Sign In / Providers → Email**.
4. Inscris-toi une première fois depuis l'app, puis passe-toi admin pour valider les photos :
   ```sql
   update public.profiles set is_admin = true where username = 'ton-pseudo';
   ```

## 2. Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Les variables Supabase sont déjà dans `.env.local` (non versionné).

> Note : `npm run dev` force `--webpack` car Turbopack a un bug connu (Next 16.2.11) qui casse le proxy d'auth en mode dev. Le build de production (`npm run build`, utilisé par Vercel) utilise Turbopack normalement et fonctionne très bien.

## 3. Déployer sur Vercel

```bash
npx vercel login
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx vercel --prod
```

Renseigne les mêmes valeurs que dans `.env.local` quand la CLI te les demande (Production + Preview + Development).

## Fonctionnement

- **Inscription libre** : email + mot de passe + pseudo.
- `/dashboard` : ta collection — grille des 50 états avec statut de la plaque et du quiz.
- `/states/[code]` : envoie la photo de la plaque (upload direct depuis le téléphone, `capture="environment"` ouvre l'appareil photo), puis réponds au quiz une fois la photo envoyée.
- `/leaderboard` : classement de tout le monde, visible par tous les inscrits.
- `/admin` : réservé aux comptes `is_admin` — valide ou refuse chaque photo envoyée. Une photo refusée peut être reprise par son auteur.

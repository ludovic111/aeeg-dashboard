# AEEG Dashboard

Dashboard interne pour l'association AEEG, construit avec Next.js + Supabase.

## Fonctionnalités principales

- Authentification et gestion des rôles (`superadmin`, `admin`, `committee_member`, `pending`)
- Tableau de bord opérationnel (tâches, ventes, réunions, sondages, soirées, activité)
- Réunions avec upload ODJ en `.docx` + génération de résumé IA (Grok)
- Tâches (kanban)
- Commandes clients avec articles structurés + export CSV
- Soirées: création, manager, membres, tâches assignées, liste de courses
- Sondages multi-choix avec détail des votes (qui a voté quoi et quand)
- Espace fichiers partagé (dossiers + fichiers)
- Gestion des membres et modération admin

## Stack technique

- Next.js 16 (App Router), React 19, TypeScript
- Supabase (Postgres, Auth, Storage, RLS)
- Tailwind CSS, Radix UI, Sonner

## Démarrage local

1. Installer les dépendances:

```bash
npm install
```

2. Créer le fichier d'environnement:

```bash
cp .env.example .env.local
```

3. Renseigner les variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `XAI_API_KEY`
- `XAI_MODEL` (par défaut `grok-4-1-fast-reasoning`)

4. Lancer l'application:

```bash
npm run dev
```

5. Ouvrir `http://localhost:3000`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Base de données

Les migrations SQL sont dans:

- `/Users/ludovicmarie/Desktop/FOLDERS/EG/DASHBOARD/aeeg-dashboard/supabase/migrations`

Incluent notamment:

- `011_order_items_system.sql`
- `013_meeting_agenda_docx_upload.sql`
- `014_polls_drive_and_permission_hardening.sql`
- `016_parties_module.sql`
- `017_polls_multiple_choice_support.sql`

## Déploiement

Prévu pour Vercel.  
Assurez-vous de configurer les variables d'environnement Supabase + xAI sur l'environnement de déploiement.

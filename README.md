# GG Customer Journey Repository — Next.js + Supabase

Migrazione della CloudPage SFMC (`ggdb_cj_library`) verso un'app web
standard: **Next.js** su **Vercel**, dati su **Supabase** (Postgres + Auth).

Questo repo è il **primo giro**: contiene le fondamenta complete e uno
**slice verticale funzionante** (lettura template end-to-end + una scrittura:
il salvataggio della config MMS/SMS). Le altre viste (Map/Flow editor,
asset editing, dashboard, timeline) si innestano sullo stesso schema con lo
stesso pattern — vedi "Cosa manca".

---

## Com'era vs com'è

| Prima (SFMC) | Ora |
|---|---|
| Backend SSJS (`REPO_SSJS_BACKEND`) che legge 3 Data Extension | Postgres su Supabase, 3 tabelle |
| Dati iniettati via `%%=v(@jsonString)=%%` | Query tipizzata in Server Component |
| Azioni POST (`saveTemplate...`) in SSJS | API routes Next.js (`/api/...`) |
| Auth SSJS: SHA256+salt a mano, lockout, Turnstile | Supabase Auth (hashing + rate limit gestiti) |
| Permessi ruolo **solo nel frontend** (aggirabili) | **RLS su Postgres** + check server nelle API |
| `sessionStorage('repoAuth')` | Cookie di sessione Supabase + middleware |

---

## Struttura

```
supabase/migrations/
  0001_schema.sql     tabelle, tipi, trigger
  0002_rls.sql        Row Level Security per i 3 ruoli
scripts/
  migrate-data.mjs    importa l'export delle DE in Supabase
src/
  middleware.ts       rinfresca sessione + protegge pagine
  lib/
    supabase/{server,client,admin}.ts   i 3 client
    auth.ts           getSessionUser / requireRole
    mms-config.ts     validazione MMS/SMS (ex SSJS, condivisa)
    mappers.ts        riga DB -> view-model UI
    types.ts
  app/
    login/page.tsx    login (Supabase Auth)
    page.tsx          home: lista template (SSR, slice di lettura)
    api/templates/mms-config/route.ts   slice di scrittura
  components/
    Header.tsx, TemplateList.tsx
```

---

## Setup passo-passo

### 1. Progetto Supabase
1. Crea un progetto su [supabase.com](https://supabase.com).
2. SQL Editor → incolla ed esegui, in ordine:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
3. Settings → API: copia `Project URL`, `anon public key`, `service_role key`.




### 2. Variabili d'ambiente
Copia `.env.example` in `.env.local` e compila i valori. Gli stessi vanno
messi su Vercel (Project → Settings → Environment Variables).

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` è segreta: mai prefissarla con `NEXT_PUBLIC`.

### 3. Primo utente admin
Supabase → Authentication → Users → *Add user* (email + password).
Il trigger crea il profilo con ruolo `user`. Promuovilo ad admin dal SQL Editor:

```sql
update public.profiles set role = 'admin'
where username = 'tua-email-prima-della-@';
```

### 4. Migrazione dati dalle DE
Esporta i dati dalla vecchia pagina (loggato, in console):

```js
copy(JSON.stringify(DATA));      // → data/templates.json
copy(JSON.stringify(JOURNEYS));  // → data/journeys.json
```

Poi importa:

```bash
npm install
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/migrate-data.mjs ./data/templates.json ./data/journeys.json
```

### 5. Avvio locale
```bash
npm run dev      # http://localhost:3000
```

### 6. Deploy su Vercel
1. Push del repo su GitHub.
2. Vercel → *New Project* → importa il repo (rileva Next.js da solo).
3. Aggiungi le env vars → Deploy.

---

## Il pattern delle scritture (da replicare)

Ogni azione che modifica dati segue lo schema di
`src/app/api/templates/mms-config/route.ts`:

1. `await requireRole([...])` — autorizzazione reale sul server.
2. Valida l'input con la funzione condivisa (`src/lib/mms-config.ts`).
3. Scrivi con `createAdminClient()` (service key).
4. Rispondi `{ success, message, ... }`.

La RLS (`0002_rls.sql`) resta come seconda linea: anche se qualcuno chiama
Supabase col token utente, Postgres rifiuta le scritture non autorizzate.

---

## Cosa manca (prossimi giri)

Stesso schema, stesso pattern — da portare:
- **Map/Flow editor** (`04-jsflow.js`) → tabella `journeys.flow_view_json` già pronta; serve l'editor React + `POST /api/journeys/flow` (ruolo `mapeditor`/`admin`).
- **Asset editing** (`05-jsassets.js`) → `templates.assets_json` già pronto; `POST /api/templates/assets` (ruolo `admin`).
- **Dashboard + MMS detail modal** (`03-jsviews.js`, `patch_js_features.js`) → componenti React, zero nuove tabelle.
- **Timeline** (`ggdb_cj_design`) → componente statico, riusabile quasi as-is.
- **Gestione utenti/ruoli** → pagina admin su `profiles`.
- Animazioni GSAP/Three/Lenis e cursore custom: opzionali, da reintrodurre a piacere.

# Jira Label Visualisering

Visualiser fordeling av Jira-oppgåver basert på prefiks-baserte etikettar (labels). Perfekt for team som brukar strukturerte labels som `type-ny-funksjonalitet`, `domene-backend`, `tema-integrasjon` osv.

## Funksjonar

- 📊 **Sektordiagram og stolpediagram** - vel visningstype
- 🏷️ **Automatisk prefiks-gjenkjenning** - finn kategoriar automatisk frå labels
- 🔍 **Filtrer på kategori** - sjå berre éin kategori om gongen
- 📱 **Responsivt design** - fungerer på mobil og desktop
- 🔗 **Confluence-vennleg** - kan embeddast som iframe

## Kom i gang

### Steg 1: Deploy Cloudflare Worker (5 min)

Jira Cloud blokkerer direkte API-kall frå nettlesaren. Du treng ein enkel proxy:

1. **Gå til [workers.cloudflare.com](https://workers.cloudflare.com/)** og logg inn (gratis)
2. **Klikk "Create a Worker"**
3. **Slett all eksisterande kode og lim inn innhaldet frå `cloudflare-worker/worker.js`**
4. **Klikk "Save and Deploy"**
5. **Noter URL-en** (t.d. `https://jira-proxy.ditt-namn.workers.dev`)

### Steg 2: Køyr appen lokalt

```bash
# Klon repoet
git clone https://github.com/DITT-BRUKARNAMN/jira-label-visualisering.git
cd jira-label-visualisering

# Installer avhengigheiter
npm install

# Start utviklingsserver
npm run dev
```

Opne http://localhost:5173 og lim inn:
- Proxy URL frå steg 1
- Jira Cloud URL (t.d. `ditt-team.atlassian.net`)
- E-post og API token
- Prosjektnøkkel

### Steg 3 (valfritt): Deploy til GitHub Pages

1. **Push til GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/DITT-BRUKARNAMN/jira-label-visualisering.git
   git push -u origin main
   ```

2. **Aktiver GitHub Pages**
   - Gå til repo → Settings → Pages
   - Under "Build and deployment", vel "GitHub Actions"

3. **Ferdig!**
   URL: `https://DITT-BRUKARNAMN.github.io/jira-label-visualisering/`

## Jira-oppsett

### Lag API Token

1. Gå til https://id.atlassian.com/manage-profile/security/api-tokens
2. Klikk "Create API token"
3. Gje token eit namn (t.d. "Label visualisering")
4. Kopier token - du ser han berre éin gong!

### Strukturer labels

Bruk prefiks med bindestrek for å gruppera labels:

```
type-ny-funksjonalitet
type-vedlikehald
type-utforsking
type-feilretting

domene-ordre
domene-brukar
domene-betaling

tema-backend
tema-frontend
tema-integrasjon
tema-database
```

Appen finn automatisk alle unike prefiks og grupperer suffiks under kvar.

## Embed i Confluence

### Med iframe

Bruk ein **HTML-makro** eller **iframe-makro** i Confluence:

```html
<iframe 
  src="https://DITT-BRUKARNAMN.github.io/jira-label-visualisering/" 
  width="100%" 
  height="600" 
  frameborder="0"
></iframe>
```

### Demo-modus

For å visa appen utan Jira-tilkopling:

```html
<iframe 
  src="https://DITT-BRUKARNAMN.github.io/jira-label-visualisering/?demo=true" 
  width="100%" 
  height="600" 
  frameborder="0"
></iframe>
```

## Sikkerheit

- API-token vert **aldri lagra** - berre sendt til proxyen per førespurnad
- Cloudflare Worker validerer at host er `*.atlassian.net`
- Berre lesing av issues er tillate (ikkje skriving)
- Du kan avgrensa CORS til spesifikke domene i worker.js

## Tilpassing

### Legg til fleire kategoriar

Rediger `DEFAULT_CATEGORIES` i `App.jsx`:

```javascript
const DEFAULT_CATEGORIES = {
  type: { name: 'Type', description: 'Oppgåvetype' },
  domene: { name: 'Domene', description: 'Fagområde' },
  tema: { name: 'Tema', description: 'Teknisk' },
  prioritet: { name: 'Prioritet', description: 'Kor viktig' },  // ny!
};
```

### Endra fargar

Rediger `CATEGORY_COLORS`:

```javascript
const CATEGORY_COLORS = {
  type: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
  // legg til fleire...
};
```

## Teknologi

- **React 18** - UI-bibliotek
- **Recharts** - Diagram
- **Vite** - Bygg og utvikling
- **Cloudflare Workers** - Gratis API-proxy
- **IBM Plex Sans** - Typografi

## Feilsøking

| Problem | Løysing |
|---------|---------|
| "NetworkError" | Sjekk at Cloudflare Worker URL er korrekt |
| "Feil e-post eller API token" | Lag ny API token på Atlassian |
| "Fann ikkje prosjektet" | Sjekk at prosjektnøkkelen er rett (store bokstavar) |
| Ingen data | Sjekk at issues i prosjektet har labels |

## Lisens

MIT - bruk fritt!

---

Laga for team som vil ha betre oversikt over arbeidet sitt 📈

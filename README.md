# Hallobot

Sitio estático de **Hallobot** (parte de ML Digital): instalación y mantenimiento de un chatbot con IA en la web de pequeñas empresas en Noruega. Responde en noruego, español e inglés.

URL temporal prevista: `https://hallobot.pages.dev` (aún **no publicada** — el proyecto Pages no existe).  
Dominio `hallobot.no`: aún no comprado.

Cuenta Cloudflare ya usada en otros sitios (NORDIC / ML-TRADE):  
`c1b75fdaf97a19aebccca79bd81beb70`

## Estado

`main` ya está **aprobado**. No hace falta otro PR de contenido.

Pendiente solo de operación (bloqueado sin secretos; **no inventar claves**; **no** configurar `KONTAKT_WEBHOOK_URL` desde el agente hasta que Willy pegue la URL):

1. **Cloudflare Pages** — conectar repo `willynoslo17/hallobot`, proyecto `hallobot`, rama `main`, build vacío, output `/`.
2. **Secret `KONTAKT_WEBHOOK_URL`** (después del deploy) — webhook (p. ej. Make) que entregue el lead a `kontakt@mlinternasjonal.no`. Sin él, `POST /api/kontakt` responde `503` y la web muestra el mailto de respaldo.
3. Cambiar la URL temporal `*.pages.dev` cuando exista el dominio propio (con `scripts/set-base-url.mjs`).

### Para que un agente termine el deploy por CLI

Pegar en el chat (o en el entorno) un **API token** de Cloudflare con permiso *Account → Cloudflare Pages → Edit* (y idealmente *Account Settings → Read* para `whoami`):

```bash
export CLOUDFLARE_API_TOKEN='…pegar aquí…'
export CLOUDFLARE_ACCOUNT_ID='c1b75fdaf97a19aebccca79bd81beb70'
npx wrangler pages project create hallobot --production-branch=main
npx wrangler pages deploy . --project-name hallobot --branch main
```

Luego, con la URL real del webhook hacia `kontakt@mlinternasjonal.no` (Make u otro; **no pegar la URL en el repo**):

```bash
printf '%s' 'https://hook.….make.com/…' | npx wrangler pages secret put KONTAKT_WEBHOOK_URL --project-name hallobot
```

Comprobar: `POST https://hallobot.pages.dev/api/kontakt` con JSON válido debe devolver `{"ok":true}` (no `not_configured`).

## Stack

- HTML + CSS a mano (sin framework, sin build)
- JS mínimo: `form.js` (formulario de contacto)
- Cloudflare Pages (output `/`, build command vacío)
- Pages Function: `functions/api/kontakt.js`

## Estructura

| NO | ES |
|---|---|
| `/` | `/es/` |
| `/slik-fungerer-det/` | `/es/como-funciona/` |
| `/priser/` | `/es/precios/` |
| `/bransjer/` | `/es/sectores/` |
| `/sikkerhet-og-personvern/` | `/es/seguridad-y-privacidad/` |
| `/kontakt/` | `/es/contacto/` |
| `/personvern/` | `/es/privacidad/` |

## URL base

Constante en `site.config.json` (`BASE_URL`). Para cambiar el dominio:

```bash
node scripts/set-base-url.mjs https://hallobot.no
```

Actualiza canonical, og:url, hreflang, sitemap, robots y JSON-LD. Los enlaces internos usan rutas relativas a la raíz (`/priser/`).

## Formulario / webhook

El frontend hace `POST /api/kontakt`. La Pages Function (`functions/api/kontakt.js`) reenvía el JSON a `KONTAKT_WEBHOOK_URL`.

**Destino esperado del lead:** `kontakt@mlinternasjonal.no` (vía Make u otro webhook — la function **no** envía correo sola; hace `fetch` al webhook).

Si `KONTAKT_WEBHOOK_URL` no está configurada:

- la function responde `503` `{ "ok": false, "error": "not_configured" }`
- la web muestra mailto de respaldo a `kontakt@mlinternasjonal.no`

Paso exacto (después de crear el proyecto Pages `hallobot`; **no** commits con la URL):

```bash
npx wrangler pages secret put KONTAKT_WEBHOOK_URL --project-name hallobot
# pegar la URL del webhook cuando wrangler lo pida
```

O en el dashboard: Workers & Pages → `hallobot` → Settings → Variables and Secrets → Add → Encrypt → nombre `KONTAKT_WEBHOOK_URL`.

## Despliegue (Cloudflare Pages)

Dashboard (Connect to Git — preferido para deploys automáticos desde `main`):

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Repo: `willynoslo17/hallobot`
3. Project name: `hallobot`
4. Build command: *(vacío)*
5. Output directory: `/`
6. Production branch: `main`

CLI (direct upload; requiere `CLOUDFLARE_API_TOKEN`):

```bash
export CLOUDFLARE_ACCOUNT_ID='c1b75fdaf97a19aebccca79bd81beb70'
npx wrangler pages deploy . --project-name hallobot --branch main
```

Si `hallobot.pages.dev` está ocupado, elige otro nombre de proyecto y ejecuta `node scripts/set-base-url.mjs https://<nuevo>.pages.dev`.

## Textos noruegos

Todos los textos en bokmål son borrador. Ver `TEXTOS_NO_PARA_REVISAR.md` antes de publicar.

## Legal

MARTINEZ LOZANO INTERNASJONAL HANDEL (ENK) · Org.nr. 935 407 095 MVA · Norbygata 19, 0187 Oslo

## Cloudflare Pages (Git)

Proyecto conectado a GitHub: cada push a `main` publica automáticamente.
- Build command: `sh scripts/build-dist.sh`
- Build output directory: `dist` (excluye README, TEXTOS_NO_PARA_REVISAR.md, scripts/ y site.config.json)
- Formulario: si `KONTAKT_WEBHOOK_URL` no está configurado, `form.js` abre el correo del visitante con el mensaje listo para kontakt@mlinternasjonal.no (mailto, sin secretos).

# Hallobot

Sitio estático de **Hallobot** (parte de ML Digital): instalación y mantenimiento de un chatbot con IA en la web de pequeñas empresas en Noruega. Responde en noruego, español e inglés.

URL temporal prevista: `https://hallobot.pages.dev`  
Dominio `hallobot.no`: aún no comprado.

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

El frontend hace `POST /api/kontakt`. La function reenvía a `KONTAKT_WEBHOOK_URL` (Make u otro destino que elijas). Si la variable no existe, responde `503` y la web muestra el mailto de respaldo.

Configurar el secreto (sin poner URL real en el repo):

```bash
npx wrangler pages secret put KONTAKT_WEBHOOK_URL --project-name hallobot
```

## Despliegue (Cloudflare Pages)

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Repo: `willynoslo17/hallobot`
3. Project name: `hallobot`
4. Build command: *(vacío)*
5. Output directory: `/`
6. Production branch: `main` (se publica al hacer merge del PR)

Alternativa CLI:

```bash
npx wrangler pages deploy . --project-name hallobot
```

Si `hallobot.pages.dev` está ocupado, elige otro nombre de proyecto y ejecuta `node scripts/set-base-url.mjs https://<nuevo>.pages.dev`.

## Textos noruegos

Todos los textos en bokmål son borrador. Ver `TEXTOS_NO_PARA_REVISAR.md` antes de publicar.

## Legal

MARTINEZ LOZANO INTERNASJONAL HANDEL (ENK) · Org.nr. 935 407 095 MVA · Norbygata 19, 0187 Oslo

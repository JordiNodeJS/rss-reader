# Upstash (Redis) — Crear cuenta y configurar variables de entorno

Si quieres que el servicio de resúmenes use un almacenamiento persistente para el rate limiting (recomendado en producción), puedes usar Upstash (Redis). A continuación los pasos rápidos y recomendaciones.

## 1) Crear cuenta en Upstash

- Ve a https://upstash.com y regístrate con tu correo.
- (En este proyecto se ha utilizado la cuenta: `frontend.flipoeyewear@gmail.com`)

## 2) Crear una base de datos Redis

- En el dashboard pulsa **Create Database** → elige la región y el plan (el plan gratuito funciona bien para pruebas).
- Crea la base de datos y guarda las credenciales.

## 3) Obtener las credenciales REST

- En la página de tu database copia **REST URL** y **REST Token**.
- Las variables que usarás son:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

## 4) Configurar localmente (.env.local)

- Crea/edita un archivo `.env.local` en la raíz del proyecto y añade:

```dotenv
UPSTASH_REDIS_REST_URL="https://<tu-db>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<tu-token-secreto>"
```

- En este repo de ejemplo se ha añadido un `.env.local` de desarrollo con los valores de prueba (no lo subas al repo).

## 5) Configurar en Vercel (producción)

- En el panel del proyecto en Vercel ve a **Settings → Environment Variables**.
- Crea dos variables con los mismos nombres `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` y pégalas ahí (no subas `.env.local` al repo).

## 6) Notas de seguridad y operación

- No subas `.env.local` al repositorio. Asegúrate de que `.gitignore` contiene la entrada `.env.local`.
- Si el token se ha expuesto, rota el token desde el dashboard de Upstash y actualiza las variables en Vercel.
- Upstash tiene límites y cuotas en el plan gratuito; revisa tu dashboard si necesitas ampliar.

## 7) Probando localmente

- Con las variables en `.env.local` reinicia el servidor de desarrollo y prueba la ruta `/api/summarize`.

## 8) ¿Quieres que lo añada al README?

- He creado este documento en `docs/upstash-setup.md` con todos los pasos.
- Si quieres que incluya esta sección directamente en el `README.md`, puedo insertarla allí también (te avisaré antes de modificar el `README`).

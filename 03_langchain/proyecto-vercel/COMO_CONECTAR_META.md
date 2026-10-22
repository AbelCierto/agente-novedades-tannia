# Conectar Facebook e Instagram (Meta Graph API)

Guía para obtener las credenciales que usa el MVP para publicar en **Facebook** e **Instagram**:

```
META_PAGE_ID
META_PAGE_ACCESS_TOKEN
META_IG_USER_ID        (solo si publicarás en Instagram)
```

> Para publicar en **tus propias** cuentas basta el **modo desarrollo** de la app: no necesitas la App Review de Meta.
> La App Review solo hace falta si vas a publicar en cuentas de terceros.

---

## 0. Requisitos previos

- Una **cuenta de Facebook** y una **Página de Facebook** de la que seas **administrador**.
- Para Instagram: una cuenta de **Instagram Business o Creator** **vinculada** a esa Página.
  - Vincular: en la Página → *Configuración → Cuentas vinculadas → Instagram*, o desde la app de Instagram (*Configuración → Cuenta → Cambiar a cuenta profesional*).

---

## 1. Crear tu cuenta de desarrollador y la app

1. Entra a **https://developers.facebook.com/** e inicia sesión con tu Facebook.
2. Acepta registrarte como desarrollador (*Get Started*) si es la primera vez.
3. Ve a **My Apps → Create App**.
4. Tipo de app: elige **Business**.
5. Ponle un nombre (p. ej. `Mega Ofertas Tannia MVP`) y crea la app.

Al terminar llegas al **Dashboard** de la app.

---

## 2. Agregar los productos necesarios

En el Dashboard de la app, en **Add products / Add product**, agrega:

- **Facebook Login** (para autorizar y generar tokens).
- **Instagram Graph API** (solo si usarás Instagram).

No necesitas configurar pantallas de login: usaremos el **Graph API Explorer** para generar el token.

---

## 3. Generar un User Access Token con permisos

1. Abre el **Graph API Explorer**: **https://developers.facebook.com/tools/explorer**
2. Arriba a la derecha, en **Meta App**, selecciona tu app.
3. En **User or Page**, deja **User Token**.
4. Clic en **Add a Permission** / **Permissions** y marca estos **7 permisos** (con todos juntos funciona; faltar `business_management` hace que no aparezcan las Páginas):

   | Permiso | Para qué |
   |---|---|
   | `pages_show_list` | listar tus Páginas |
   | `pages_read_engagement` | leer datos de la Página |
   | `pages_manage_posts` | **publicar** en la Página |
   | `business_management` | que tus Páginas aparezcan en `me/accounts` (imprescindible) |
   | `instagram_basic` | leer la cuenta de IG (solo IG) |
   | `instagram_content_publish` | **publicar** en Instagram (solo IG) |
   | `instagram_manage_comments` | gestionar comentarios de IG (solo IG) |

5. Clic en **Generate Access Token** y **autoriza** en la ventana emergente. **Importante:** en el paso “¿Qué Páginas quieres usar?” elige **“Participar en todas las páginas actuales y futuras”** (*Opt in to all*) o marca tu Página; si no, `me/accounts` vendrá vacío.
6. Copia el **User Access Token** que aparece. Es **temporal** (~1–2 h), suficiente para configurar.

> Este token es un secreto: no lo pegues en chats ni lo subas a git.

---

## 4. Obtener Page ID, Page Token e IG ID

Tienes dos caminos: el **script ayudante** (recomendado) o **a mano**.

### Opción A — Script ayudante (recomendado)

Desde la carpeta del proyecto, pasa tu token por variable de entorno (más fiable que pegarlo en el prompt):

```powershell
cd 03_langchain/proyecto-vercel
$env:FB_USER_TOKEN="EAAG...tu_token_largo_completo"
python _meta_setup.py
```

- Si tienes varias Páginas, elige el número.
- Al final imprime un bloque listo para tu `.env`:

  ```
  META_PAGE_ID=...
  META_PAGE_ACCESS_TOKEN=...
  META_IG_USER_ID=...
  ```

**Token de larga duración (opcional):** si antes de correr el script defines `META_APP_ID` y `META_APP_SECRET`
(los ves en *App → Settings → Basic*), el Page Token saldrá **sin expiración**:

```powershell
$env:META_APP_ID="tu_app_id"; $env:META_APP_SECRET="tu_app_secret"; python _meta_setup.py
```

### Opción B — A mano en el Graph API Explorer

1. **Page ID y Page Token:** en el Explorer, ejecuta:
   ```
   GET /me/accounts?fields=id,name,access_token
   ```
   En la respuesta, cada Página trae su `id` (= `META_PAGE_ID`) y su `access_token` (= `META_PAGE_ACCESS_TOKEN`).

2. **IG Business ID:** con ese Page Token, ejecuta:
   ```
   GET /{META_PAGE_ID}?fields=instagram_business_account
   ```
   Devuelve `instagram_business_account.id` (= `META_IG_USER_ID`).
   Si viene vacío, tu Página aún no tiene IG Business vinculada (ver paso 0).

---

## 5. Poner las credenciales en el `.env`

Edita `03_langchain/proyecto-vercel/.env` y completa (sin comillas ni espacios):

```
META_PAGE_ID=123456789012345
META_PAGE_ACCESS_TOKEN=EAAG...tu_token
META_IG_USER_ID=1784xxxxxxxxxxx
META_PUBLICAR=              # vacío = borrador/sin publicar (revisión); "ahora" = publica en vivo
META_GRAPH_VERSION=v21.0
```

Guarda y **reinicia el servidor**:

```powershell
python -m uvicorn app:app --env-file .env --port 8000
```

> El `.env` nunca se sube a git (ya está en `.gitignore`). En Vercel, estas variables van en
> *Project → Settings → Environment Variables*.

---

## 6. Probar

1. Abre http://localhost:8000 y recarga con **Ctrl + F5**.
2. Genera la campaña de la casaca.
3. En el panel **Aprobar y publicar**, elige **Facebook**, revisa el texto y pulsa el botón.
4. Con `META_PUBLICAR` vacío, la publicación queda **sin publicar**: revísala en **Meta Business Suite**
   (*Contenido → Publicaciones*). Con `META_PUBLICAR=ahora`, sale en vivo en la Página.

---

## Solución de problemas

| Mensaje / código | Causa probable | Qué hacer |
|---|---|---|
| `me/accounts` devuelve `{"data": []}` | El token no incluyó las Páginas (falta `business_management` o no elegiste la Página al autorizar) | Regenera el token con los **7 permisos** y elige **"Opt in to all Pages"** |
| `backend_acceso` · "Meta rechazó el token" | Token expirado o sin permisos | Regenera el token (paso 3) con los permisos correctos; usa token de larga duración |
| `sin_configurar` · falta META_PAGE_ID | No pusiste las variables o no reiniciaste | Completa el `.env` y reinicia el servidor |
| IG: "no tiene IG Business vinculada" | La Página no tiene Instagram Business | Vincula IG Business a la Página (paso 0) |
| IG falla al subir la imagen | Falta `ZERNIO_API_KEY` válida (hospeda la imagen) o `OPENAI_API_KEY` | Define ambas, o envía tú una `imagen_url` |
| El token caduca cada par de horas | Es un token de usuario corto | Usa `META_APP_ID` + `META_APP_SECRET` al correr `_meta_setup.py` para un Page Token sin expiración |

---

## Notas de seguridad

- El **Page Access Token** y el **App Secret** son secretos: solo en el `.env` local o en variables de entorno de Vercel.
- Nunca los pegues en un chat, captura de pantalla o commit.
- Si expones una clave, **revócala** y genera otra.

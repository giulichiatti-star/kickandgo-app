# 📣 Roadmap de comunicaciones — Kick and Go

Documento vivo. Lista **todas** las notificaciones que el sistema envía (email y push),
**cuándo** se disparan, **qué** dicen, **a quién** y **dónde** se editan.
Última auditoría: 2026-07-17.

> **Cómo cambiar algo:**
> - **Emails automáticos por fecha** → función `send-payment-emails` y `reactivar-inactivos`.
> - **Push automáticos** → función `daily-notifications`.
> - **Horarios** → se definen en los `cron.schedule(...)` (SQL). Ver sección "Cron".
> - Tras editar una función: `supabase functions deploy <nombre>`.
> - Para quitar un aviso: borra su bloque en la función (o `cron.unschedule('<nombre>')` si es un cron entero).

---

## 1. Automáticas por calendario (se envían solas cada día)

### 🟢 A) Ciclo de vida / pago — `send-payment-emails` · cron diario ~10:00 (España)
Email al **cliente** según su estado y fechas. `+N` = N días **antes** de vencer · `-N` = N días **después**.

| Cuándo | Estado | Asunto | Qué comunica |
|---|---|---|---|
| 12 días antes de fin de prueba | Prueba | *3 funciones que quizá no has probado* | Nurture: descubrir funciones |
| 5 días antes | Prueba | *¿Qué tal va todo con Kick and Go?* | Check-in, ofrecer ayuda |
| 3 días antes | Prueba | *Quedan 3 días de tu prueba gratuita* | Urgencia suave |
| El día que vence | Prueba | *Tu prueba gratuita termina hoy* | Cierre de prueba |
| 2 días después | Prueba | *Tu cuenta ha sido suspendida temporalmente* | Aviso de suspensión por impago |
| 1 día antes de renovar | Pagado | *Tu suscripción vence mañana* | Recordatorio de renovación |
| 2 días después de vencer | Mora | *Tu cuenta ha sido suspendida temporalmente* | Suspensión por impago |

### 🔵 B) Recordatorios deportivos (PUSH) — `daily-notifications` · cron diario ~9:30 (España)
Notificación push al **entrenador** (si tiene push activado).

| Cuándo | Título push | Qué comunica |
|---|---|---|
| Hay convocatoria con fecha = mañana | ⚽ **Partido mañana** | vs [rival] · prepara al equipo |
| Alta médica de un lesionado en 0–3 días | 🩺 **Alta médica próxima** | [jugador] puede volver el [fecha] |
| Hay entreno hoy y faltan ~2h | 🏋️ **Entrenamiento en 2h** | hora · lugar |

### 🟣 C) Reactivación por inactividad — `reactivar-inactivos` · cron diario ~11:20 (España)
Email **comercial** al cliente que deja de entrar. 1 email por nivel; se reinicia si vuelve. Lleva enlace de baja.

| Cuándo | Asunto | Qué comunica |
|---|---|---|
| 5 días sin entrar | *¿Seguimos preparando al equipo? 🟢* | "Te echamos de menos", volver |
| 15 días sin entrar | *Tu equipo avanza más rápido contigo dentro ⚽* | Ofrecer ayuda para retomar |
| 30 días sin entrar | *Antes de que te vayas… 👋* | Último intento / feedback |

### ⚙️ D) Suspensión automática (SIN email) — `revisar-vencimientos` · cron diario ~9:50 (España)
No comunica nada al usuario; solo **cambia el estado** en la base de datos:
- Prueba vencida + 2 días de gracia → `vencido` + cuenta suspendida.
- Pago vencido + 2 días de gracia → `mora` + cuenta suspendida.
(El email de suspensión lo manda `send-payment-emails`, no esta función.)

---

## 2. Transaccionales (se disparan por un evento o acción)

| Disparador | Función | Canal → destinatario | Asunto / contenido |
|---|---|---|---|
| Alguien rellena el formulario de la Landing | `nuevo-lead` | Email → **cliente**: *¡Bienvenido! Tus accesos* · Email → **admin (tú)**: *🆕 Nuevo cliente: [nombre]* | Alta self-service + aviso a ti |
| Admin pulsa "Contactar por email" (Leads) | `contactar-lead` | Email → **lead** | *Tu prueba gratuita de KickAndGo* |
| Admin pulsa "Dar de alta" (Leads) | `crear-cuenta-lead` | Email → **cliente** | *¡Bienvenido! Tus accesos* (credenciales) |
| Admin confirma un pago (Avisos de pago) | `enviar-confirmacion-pago` | Email → **cliente** | *Pago recibido — todo en marcha* |
| Cliente pulsa "Ya pagué" (transferencia/Bizum) | `ya-pague` | **In-app** → admin (pestaña Avisos de pago) | Crea aviso pendiente. **No manda email**, aparece en tu panel |
| Admin pulsa "Nueva contraseña" | `resetear-password` | **Pantalla** → admin | Genera y te muestra la contraseña. **No emailea al cliente** — se la envías tú |
| Cliente pulsa "Darme de baja" en un email | `email-baja` | **Página web** de confirmación | Marca `email_baja=true`; deja de recibir reactivación |
| Admin "Ver como cliente" | `ver-como-cliente` | — | Genera enlace de acceso. Sin notificación |
| Admin "Eliminar cuenta" | `eliminar-cuenta` | — | Borra la cuenta. Sin notificación |

---

## 3. En la app (no son emails/push)
- **Botón flotante de WhatsApp** — contacto manual del cliente contigo. Siempre visible.
- **Toasts** — confirmaciones visuales al guardar (partido, entreno, etc.). Solo UI.

---

## 4. Cron (horarios) — dónde se programan
Definidos con `pg_cron`. Horas en **UTC** (España = +2 en verano, +1 en invierno).

| Job | Hora UTC | Función | Archivo SQL |
|---|---|---|---|
| `revisar-vencimientos-daily` | 07:50 | revisar-vencimientos | `payment_system.sql` |
| `revisar-vencimientos-diario` | 08:00 | revisar-vencimientos | `migracion_crm.sql` ⚠️ ver nota |
| `daily-notifications-push` | 07:30 | daily-notifications | `payment_system.sql` |
| `send-payment-emails-daily` | 08:00 | send-payment-emails | `payment_system.sql` |
| `reactivar-inactivos-daily` | 09:20 | reactivar-inactivos | `migracion_reactivacion.sql` |

Ver los activos: `select jobname, schedule, active from cron.job;`
Quitar uno: `select cron.unschedule('<nombre>');`

> ⚠️ **Nota:** `revisar-vencimientos` aparece programado dos veces (07:50 y 08:00) con nombres distintos.
> Probablemente sobra uno. Revisa `select * from cron.job;` y elimina el duplicado si no lo quieres.

---

## 5. Proveedores / infraestructura
- **Email:** Resend (`RESEND_API_KEY`). Remitentes: `hola@kickandgo.app` / `noreply@kickandgo.app`.
- **Push:** Web Push + VAPID (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`).
- **Programación:** `pg_cron` + `pg_net` en Supabase.
- **Baja / GDPR:** solo los emails de **reactivación** llevan enlace de baja (`email_baja`). Los avisos
  transaccionales de pago/cuenta se siguen enviando (son necesarios para el servicio).

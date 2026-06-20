# KICK AND GO — App (producción)

Fase producción: **React + Vite + Tailwind + Supabase**. MVP: login + plantilla.
Datos en la nube, multiusuario, responsive (móvil/tablet).

## Puesta en marcha (una sola vez)

### 1. Crear proyecto Supabase (gratis)
1. Entra en https://supabase.com → **New project** (anota la contraseña de la BD).
2. Cuando esté listo: **SQL Editor → New query** → pega TODO `supabase/schema.sql` → **Run**.
3. **Project Settings → API**: copia `Project URL` y la clave `anon public`.

> Opcional para pruebas rápidas: **Authentication → Providers → Email** → desactiva
> "Confirm email" para poder entrar sin confirmar el correo.

### 2. Conectar la app
```bash
cp .env.example .env
# edita .env y pega tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

### 3. Instalar y arrancar
```bash
npm install
npm run dev
```
Abre http://localhost:5173 — crea una cuenta y empieza a cargar jugadores.

## Desplegar gratis (cuando quieras que otros lo prueben)
- Sube el repo a GitHub → https://vercel.com → **Import** → añade las 2 variables
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el proyecto → Deploy.
- Te da una URL pública tipo `kickandgo.vercel.app` para tus 20 usuarios.

## Estructura
```
src/
  lib/supabase.js     · cliente Supabase
  lib/jugadores.js    · capa de datos (CRUD jugadores)
  pages/Login.jsx     · alta / inicio de sesión
  pages/Plantilla.jsx · plantilla (lista + alta/edición/baja)
  App.jsx             · sesión + navegación
supabase/schema.sql   · tablas + seguridad (RLS) + perfil automático
```

## Próximas fases (ya planificadas)
Convocatoria → En Vivo → Informe. La lógica viene probada de la demo.

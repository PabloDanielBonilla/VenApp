# Configuración de Supabase

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
# Obtén estos valores desde tu proyecto en https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Opcional: Service Role Key (solo para operaciones administrativas)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# URL de tu aplicación (para callbacks de OAuth)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Configuración de la Base de Datos

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Ejecuta el contenido del archivo `supabase-schema.sql` para crear todas las tablas, políticas RLS y funciones necesarias

### Migración: Agregar columna photos_taken

Si ya ejecutaste el schema anteriormente y necesitas agregar la columna `photos_taken`:

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido de `migration-add-photos-taken.sql`
3. Ejecuta el script

Este script verificará si la columna existe antes de agregarla, así que es seguro ejecutarlo múltiples veces.

## Configuración de Google OAuth

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Authentication** > **Providers**
3. Habilita **Google** como proveedor
4. Configura las credenciales de Google OAuth (Client ID y Client Secret)
5. Agrega la URL de redirección autorizada:
   - Desarrollo: `http://localhost:3000/api/auth/callback`
   - Producción: `https://tu-dominio.com/api/auth/callback`

## Características Implementadas

- ✅ Autenticación con email/password (mínimo 6 caracteres)
- ✅ Autenticación con Google OAuth
- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Cerrar sesión
- ✅ Perfil de usuario
- ✅ Actualización de nombre y preferencias de notificaciones
- ✅ Row Level Security (RLS) configurado
- ✅ Middleware para refresh automático de sesión


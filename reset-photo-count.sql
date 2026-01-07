-- Script para reiniciar el contador de fotos
-- Ejecuta este script en el SQL Editor de Supabase para resetear todos los contadores

-- Opción 1: Resetear el contador de TODOS los usuarios
UPDATE public.users 
SET photos_taken = 0
WHERE photos_taken > 0;

-- Opción 2: Resetear el contador de un usuario específico (reemplaza 'USER_EMAIL' con el email del usuario)
-- UPDATE public.users 
-- SET photos_taken = 0
-- WHERE email = 'USER_EMAIL';

-- Verificar que se reseteó correctamente
SELECT id, email, photos_taken, plan 
FROM public.users 
ORDER BY photos_taken DESC;


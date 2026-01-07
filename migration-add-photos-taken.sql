-- Migración: Agregar columna photos_taken a la tabla users
-- Ejecuta este script en el SQL Editor de Supabase si la columna no existe

-- Verificar si la columna existe antes de agregarla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'photos_taken'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN photos_taken INTEGER NOT NULL DEFAULT 0;
    
    RAISE NOTICE 'Columna photos_taken agregada exitosamente';
  ELSE
    RAISE NOTICE 'La columna photos_taken ya existe';
  END IF;
END $$;


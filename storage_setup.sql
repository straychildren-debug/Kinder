-- Настройка Storage для обложек
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Политики доступа к объектам Storage
-- 1. Разрешить всем чтение объектов (так как bucket публичный)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'covers');

-- 2. Разрешить авторизованным пользователям загружать файлы
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'covers' AND 
  auth.role() = 'authenticated'
);

-- 3. Разрешить пользователям удалять свои файлы (пока упрощенно, если нужно)
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'covers' AND 
  auth.uid() = owner
);

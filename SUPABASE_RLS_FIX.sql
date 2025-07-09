-- Posts tablosu için güvenlik düzeltmesi
-- Sadece admin kullanıcılar yazı silebilir

-- Mevcut DELETE politikasını sil
DROP POLICY IF EXISTS "Posts are deletable by authenticated users" ON posts;

-- Yeni güvenli DELETE politikası ekle
CREATE POLICY "Posts are deletable by admin users only" ON posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

-- Kontrol için mevcut politikaları listele
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'posts'; 
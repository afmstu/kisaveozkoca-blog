-- RLS'yi etkinleştir
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Posts tablosu için politikalar
-- Herkes okuyabilir
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);

-- Sadece giriş yapmış kullanıcılar yazabilir
CREATE POLICY "Posts are insertable by authenticated users" ON public.posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sadece admin kullanıcılar güncelleyebilir
CREATE POLICY "Posts are updatable by admin users only" ON public.posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

-- Sadece admin kullanıcılar silebilir
CREATE POLICY "Posts are deletable by admin users only" ON public.posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

-- Contact messages tablosu için politikalar
-- Herkes mesaj gönderebilir
CREATE POLICY "Contact messages are insertable by everyone" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- Sadece admin kullanıcılar okuyabilir
CREATE POLICY "Contact messages are viewable by admin users only" ON public.contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

-- Playlists tablosu için politikalar
-- Herkes okuyabilir
CREATE POLICY "Playlists are viewable by everyone" ON public.playlists
  FOR SELECT USING (true);

-- Sadece admin kullanıcılar ekleyebilir/güncelleyebilir/silebilir
CREATE POLICY "Playlists are manageable by admin users only" ON public.playlists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

-- About tablosu için politikalar
-- Herkes okuyabilir
CREATE POLICY "About content is viewable by everyone" ON public.about
  FOR SELECT USING (true);

-- Sadece admin kullanıcılar güncelleyebilir
CREATE POLICY "About content is updatable by admin users only" ON public.about
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

-- Admin users tablosu için politikalar
-- Sadece kendi kayıtlarını okuyabilir
CREATE POLICY "Users can view own admin status" ON public.admin_users
  FOR SELECT USING (auth.uid() = id);

-- Sadece admin kullanıcılar ekleyebilir/güncelleyebilir
CREATE POLICY "Admin users are manageable by admin users only" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  ); 
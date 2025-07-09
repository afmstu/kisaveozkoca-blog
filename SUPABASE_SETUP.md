# Supabase Kurulum Rehberi

Bu rehber, blog projenizi Supabase ile entegre etmek için gerekli adımları içerir.

## 1. Supabase Hesabı Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın
4. Yeni bir proje oluşturun

## 2. Veritabanı Tablolarını Oluşturma

### Posts Tablosu
```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  comments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Contact Messages Tablosu
```sql
CREATE TABLE contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. Supabase Ayarlarını Güncelleme

1. Supabase Dashboard'da projenize gidin
2. Settings > API bölümüne gidin
3. Project URL ve anon public key'i kopyalayın
4. `frontend/supabase.js` dosyasını açın
5. Aşağıdaki satırları güncelleyin:

```javascript
const supabaseUrl = 'YOUR_PROJECT_URL'
const supabaseKey = 'YOUR_ANON_KEY'
```

## 4. Row Level Security (RLS) Ayarları

### Posts Tablosu için RLS
```sql
-- RLS'yi etkinleştir
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Sadece giriş yapmış kullanıcılar yazabilir
CREATE POLICY "Posts are insertable by authenticated users" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Herkes güncelleyebilir (yorumlar için)
CREATE POLICY "Posts are updatable by everyone" ON posts
  FOR UPDATE USING (true);

-- Sadece giriş yapmış kullanıcılar silebilir
CREATE POLICY "Posts are deletable by authenticated users" ON posts
  FOR DELETE USING (auth.role() = 'authenticated');
```

### Contact Messages Tablosu için RLS
```sql
-- RLS'yi etkinleştir
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Herkes mesaj ekleyebilir
CREATE POLICY "Contact messages are insertable by everyone" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Sadece admin okuyabilir (opsiyonel)
CREATE POLICY "Contact messages are viewable by admin" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');
```

## 5. Admin Hesabı Oluşturma

### Supabase Dashboard'da Admin Kullanıcısı Oluşturma
1. Supabase Dashboard'da projenize gidin
2. Authentication > Users bölümüne gidin
3. "Add user" butonuna tıklayın
4. Admin bilgilerini girin:
   - Email: admin@example.com
   - Password: güçlü bir şifre
5. "Create user" butonuna tıklayın

### Admin Bilgileri
- **Email**: admin@example.com (veya istediğiniz email)
- **Password**: Güçlü bir şifre seçin
- Bu bilgileri güvenli bir yerde saklayın

## 6. Test Etme

1. Admin girişi yapın (e-posta ve şifre ile)
2. Blog yazısı ekleyin
3. Yazıyı silmeyi deneyin (sadece admin yapabilir)
4. Çıkış yapın ve normal kullanıcı olarak test edin
5. Yorum ekleyin
6. İletişim formu gönderin
7. Supabase Dashboard'da verilerin görünüp görünmediğini kontrol edin

## 6. Güvenlik Önerileri

### Admin Paneli için Authentication
```sql
-- Sadece giriş yapmış kullanıcılar yazı ekleyebilir
CREATE POLICY "Posts are insertable by authenticated users only" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Rate Limiting
- Supabase Edge Functions kullanarak rate limiting ekleyebilirsiniz
- Spam koruması için reCAPTCHA entegrasyonu yapabilirsiniz

## 7. Deployment

### Vercel ile Deploy
1. Projenizi GitHub'a yükleyin
2. [vercel.com](https://vercel.com) adresine gidin
3. GitHub projenizi import edin
4. Environment variables ekleyin:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### Netlify ile Deploy
1. Projenizi GitHub'a yükleyin
2. [netlify.com](https://netlify.com) adresine gidin
3. GitHub projenizi import edin
4. Environment variables ekleyin

## 8. Monitoring

- Supabase Dashboard'da Analytics bölümünü kullanın
- Logs bölümünde hataları takip edin
- Database bölümünde performansı izleyin

## Sorun Giderme

### CORS Hatası
Supabase Dashboard > Settings > API > CORS ayarlarına sitenizin domain'ini ekleyin.

### Authentication Hatası
API key'in doğru olduğundan emin olun ve RLS politikalarını kontrol edin.

### Network Hatası
Supabase projenizin aktif olduğundan emin olun. 
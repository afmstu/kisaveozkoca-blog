// Supabase'deki tüm postların comments alanındaki yorumlara ve yanıtlara id ekler
// ÇALIŞTIRMADAN ÖNCE: 'YOUR_SERVICE_ROLE_KEY' kısmını kendi Supabase Service Role Key'in ile değiştir!

console.log('Script başladı...');

const { createClient } = require('@supabase/supabase-js');
// Eğer Node.js 14+ kullanıyorsanız, benzersiz id için crypto.randomUUID kullanabilirsiniz
// const { randomUUID } = require('crypto');

console.log('Supabase client oluşturuluyor...');

const supabase = createClient(
  'https://xdjyeicdaemdjqntdwsy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanllaWNkYWVtZGpxbnRkd3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTczMDI0OSwiZXhwIjoyMDY3MzA2MjQ5fQ.IphmemBenHmFzTcxun0_H7b3kLQ7rF51fJTgcOf1aEQ' // Service Role Key kullan! (asla client/public anahtarını kullanma)
);

console.log('Supabase client oluşturuldu.');

function generateId() {
  // Eğer Node.js 14+ ise: return randomUUID();
  return Date.now() + Math.floor(Math.random() * 1000000);
}

async function fixCommentIds() {
  console.log('fixCommentIds fonksiyonu başladı...');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, comments');

  if (error) {
    console.error('Postlar çekilemedi:', error);
    return;
  }

  console.log(`${posts.length} post bulundu.`);

  for (const post of posts) {
    let changed = false;
    if (Array.isArray(post.comments)) {
      for (const comment of post.comments) {
        if (!comment.id) {
          comment.id = generateId();
          changed = true;
        }
        if (Array.isArray(comment.replies)) {
          for (const reply of comment.replies) {
            if (!reply.id) {
              reply.id = generateId();
              changed = true;
            }
          }
        }
      }
      if (changed) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({ comments: post.comments })
          .eq('id', post.id);
        if (updateError) {
          console.error(`Post ${post.id} güncellenirken hata oluştu:`, updateError);
        } else {
          console.log(`Post ${post.id} güncellendi.`);
        }
      }
    }
  }
  console.log('Tüm yorumlara ve yanıtlara id eklendi!');
}

console.log('fixCommentIds fonksiyonu çağrılıyor...');
fixCommentIds().catch(error => {
  console.error('Hata oluştu:', error);
});
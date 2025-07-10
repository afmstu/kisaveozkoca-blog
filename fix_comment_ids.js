// Supabase'deki tüm postların comments alanındaki yorumlara ve yanıtlara id ekler
// ÇALIŞTIRMADAN ÖNCE: Service Role Key'inizi kimseyle paylaşmayın!

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xdjyeicdaemdjqntdwsy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanllaWNkYWVtZGpxbnRkd3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTczMDI0OSwiZXhwIjoyMDY3MzA2MjQ5fQ.IphmemBenHmFzTcxun0_H7b3kLQ7rF51fJTgcOf1aEQ' // Service Role Key (gizli tutun!)
);

async function fixCommentIds() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, comments');

  if (error) {
    console.error('Postlar çekilemedi:', error);
    return;
  }

  for (const post of posts) {
    let changed = false;
    if (Array.isArray(post.comments)) {
      post.comments.forEach(comment => {
        if (!comment.id) {
          comment.id = Date.now() + Math.floor(Math.random() * 1000000);
          changed = true;
        }
        // Yanıtlar için de id kontrolü ekle
        if (Array.isArray(comment.replies)) {
          comment.replies.forEach(reply => {
            if (!reply.id) {
              reply.id = Date.now() + Math.floor(Math.random() * 1000000);
              changed = true;
            }
          });
        }
      });
      if (changed) {
        await supabase
          .from('posts')
          .update({ comments: post.comments })
          .eq('id', post.id);
        console.log(`Post ${post.id} güncellendi.`);
      }
    }
  }
  console.log('Tüm yorumlara ve yanıtlara id eklendi!');
}

fixCommentIds(); 
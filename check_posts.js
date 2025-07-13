// Supabase'den yazıları kontrol etmek için script
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xdjyeicdaemdjqntdwsy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanllaWNkYWVtZGpxbnRkd3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzAyNDksImV4cCI6MjA2NzMwNjI0OX0.uoUGaNtWtfj_sYLKZdZuwFQX4I79BfYGYLxJ463Hb5Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPosts() {
  try {
    console.log('Supabase\'den yazılar kontrol ediliyor...')
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Hata:', error)
      return
    }
    
    console.log('Toplam yazı sayısı:', data.length)
    console.log('\n=== YAZILAR ===')
    
    if (data.length === 0) {
      console.log('Henüz hiç yazı yok.')
    } else {
      data.forEach((post, index) => {
        console.log(`\n${index + 1}. Yazı:`)
        console.log(`   ID: ${post.id}`)
        console.log(`   Başlık: ${post.title}`)
        console.log(`   İçerik: ${post.content.substring(0, 100)}...`)
        console.log(`   Oluşturulma: ${new Date(post.created_at).toLocaleString('tr-TR')}`)
        console.log(`   Yorum sayısı: ${post.comments ? post.comments.length : 0}`)
      })
    }
    
  } catch (error) {
    console.error('Script hatası:', error)
  }
}

// Scripti çalıştır
checkPosts() 
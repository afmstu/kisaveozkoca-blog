// Supabase Configuration
const supabaseUrl = 'https://xdjyeicdaemdjqntdwsy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanllaWNkYWVtZGpxbnRkd3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzAyNDksImV4cCI6MjA2NzMwNjI0OX0.uoUGaNtWtfj_sYLKZdZuwFQX4I79BfYGYLxJ463Hb5Y'

// Create global Supabase client
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)

// Admin authentication
const authService = {
  // Admin girişi
  async signIn(email, password) {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) {
      console.error('Giriş hatası:', error)
      throw error
    }
    
    return data
  },

  // Admin çıkışı
  async signOut() {
    const { error } = await window.supabaseClient.auth.signOut()
    
    if (error) {
      console.error('Çıkış hatası:', error)
      throw error
    }
  },

  // Mevcut kullanıcıyı al
  async getCurrentUser() {
    const { data: { user } } = await window.supabaseClient.auth.getUser()
    return user
  },

  // Session değişikliklerini dinle
  onAuthStateChange(callback) {
    return window.supabaseClient.auth.onAuthStateChange(callback)
  }
}

// Blog yazıları için fonksiyonlar
window.blogService = {
  // Tüm yazıları getir
  async getPosts() {
    const { data, error } = await window.supabaseClient
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Yazılar getirilirken hata:', error)
      return []
    }
    return data || []
  },

  // Yeni yazı ekle
  async createPost(post) {
    const { data, error } = await window.supabaseClient
      .from('posts')
      .insert([{
        title: post.title,
        content: post.content,
        comments: post.comments || []
      }])
      .select()
    
    if (error) {
      console.error('Yazı eklenirken hata:', error)
      throw error
    }
    return data[0]
  },

  // Yeni yazı ekle (alternatif isim)
  async addPost(post) {
    return await this.createPost(post)
  },

  // Yazı güncelle
  async updatePost(id, updates) {
    const { data, error } = await window.supabaseClient
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Yazı güncellenirken hata:', error)
      throw error
    }
    return data[0]
  },

  // Yazı sil
  async deletePost(id) {
    const { error } = await window.supabaseClient
      .from('posts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Yazı silinirken hata:', error)
      throw error
    }
  },

  // Yorum ekle
  async addComment(postId, commentData) {
    const post = await this.getPost(postId)
    const comments = post.comments || []
    comments.push({
      id: Date.now(),
      postId: postId, // Post ID'sini ekle
      name: commentData.name,
      text: commentData.text,
      replies: [],
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })
    
    return await this.updatePost(postId, { comments })
  },

  // Yanıt ekle
  async addReply(postId, commentId, replyData) {
    const post = await this.getPost(postId);
    if (!post) {
      throw new Error('Post bulunamadı!');
    }
    let comments = post.comments || [];
    let updated = false;
    // Eski yorumlarda id yoksa otomatik ata
    comments.forEach(comment => {
      if (!comment.id) {
        comment.id = Date.now() + Math.floor(Math.random() * 1000000); // Benzersiz id
        updated = true;
      }
    });
    if (updated) {
      // Yorumlara id eklediysek, postu güncelle
      await this.updatePost(postId, { comments });
      alert('Yorumlara id eklendi. Lütfen sayfayı yenileyip tekrar deneyin.');
      return;
    }
    // Yorumu bul ve yanıt ekle
    const commentIndex = comments.findIndex(comment => String(comment.id) === String(commentId))
    if (commentIndex !== -1) {
      if (!comments[commentIndex].replies) {
        comments[commentIndex].replies = []
      }
      comments[commentIndex].replies.push({
        id: Date.now(),
        postId: postId, // Post ID'sini ekle
        name: replyData.name,
        text: replyData.text,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      })
    } else {
      console.error('Yanıt eklenecek yorum bulunamadı! postId:', postId, 'commentId:', commentId, 'comments:', comments)
      throw new Error('Yanıt eklenecek yorum bulunamadı!')
    }
    return await this.updatePost(postId, { comments })
  },

  // Yorum sil (admin için)
  async deleteComment(postId, commentId) {
    const post = await this.getPost(postId)
    const comments = post.comments || []
    
    // Yorumu bul ve sil
    const filteredComments = comments.filter(comment => String(comment.id) !== String(commentId))
    
    return await this.updatePost(postId, { comments: filteredComments })
  },

  // Yanıt sil (admin için)
  async deleteReply(postId, commentId, replyId) {
    const post = await this.getPost(postId)
    const comments = post.comments || []
    
    // Yorumu bul
    const commentIndex = comments.findIndex(comment => comment.id === commentId)
    if (commentIndex !== -1) {
      // Yanıtı sil
      const filteredReplies = comments[commentIndex].replies.filter(reply => reply.id !== replyId)
      comments[commentIndex].replies = filteredReplies
    }
    
    return await this.updatePost(postId, { comments })
  },

  // Tek yazı getir
  async getPost(id) {
    const { data, error } = await window.supabaseClient
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Yazı getirilirken hata:', error)
      return null
    }
    return data
  }
}

// İletişim mesajları için fonksiyonlar
const contactService = {
  // Tüm mesajları getir
  async getMessages() {
    const { data, error } = await window.supabaseClient
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Mesajlar getirilirken hata:', error)
      return []
    }
    return data || []
  },

  // Yeni mesaj ekle
  async createMessage(message) {
    const { data, error } = await window.supabaseClient
      .from('contact_messages')
      .insert([{
        name: message.name,
        email: message.email,
        message: message.message
      }])
      .select()
    
    if (error) {
      console.error('Mesaj eklenirken hata:', error)
      throw error
    }
    return data[0]
  }
}

// Playlist servisi
const playlistService = {
  // Tüm playlistleri getir
  async getPlaylists() {
    const { data, error } = await window.supabaseClient
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Playlistler getirilirken hata:', error)
      return []
    }
    return data || []
  },

  // Yeni playlist ekle
  async createPlaylist(playlist) {
    const { data, error } = await window.supabaseClient
      .from('playlists')
      .insert([{
        title: playlist.title,
        description: playlist.description,
        spotify_url: playlist.spotifyUrl
      }])
      .select()
    
    if (error) {
      console.error('Playlist eklenirken hata:', error)
      throw error
    }
    return data[0]
  },

  // Playlist güncelle
  async updatePlaylist(id, updates) {
    const { data, error } = await window.supabaseClient
      .from('playlists')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Playlist güncellenirken hata:', error)
      throw error
    }
    return data[0]
  },

  // Playlist sil
  async deletePlaylist(id) {
    const { error } = await window.supabaseClient
      .from('playlists')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Playlist silinirken hata:', error)
      throw error
    }
  }
}

// Make services globally available
window.authService = authService
window.blogService = blogService
window.contactService = contactService
window.playlistService = playlistService 

window.blogService = blogService; 
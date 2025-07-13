// Theme management system
window.themeManager = {
  // Initialize theme
  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
    this.updateThemeIcon();
    
    // Listen for theme changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        this.setTheme(e.newValue || 'light');
        this.updateThemeIcon();
      }
    });
    
    // Listen for theme change events
    window.addEventListener('themeChanged', (e) => {
      this.updateAboutBoxes(e.detail.theme);
    });
  },
  
  // Set theme
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update CSS variables for about boxes
    this.updateAboutBoxes(theme);
    
    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  },
  
  // Update about boxes based on theme
  updateAboutBoxes(theme) {
    const aboutBoxes = document.querySelectorAll('.about-box');
    aboutBoxes.forEach(box => {
      if (theme === 'dark') {
        box.style.background = 'var(--about-box-bg)';
        box.style.borderColor = 'var(--about-box-border)';
      } else {
        box.style.background = '#fff';
        box.style.borderColor = '#ececec';
      }
    });
    
    // Update about box titles
    const aboutTitles = document.querySelectorAll('.about-box-title');
    aboutTitles.forEach(title => {
      title.style.color = theme === 'dark' ? '#667eea' : '#5a4fcf';
    });
    
    // Update contact text
    const contactText = document.querySelector('.contact-about-box p');
    if (contactText) {
      contactText.style.color = theme === 'dark' ? 'var(--text-secondary)' : '#444';
    }
  },
  
  // Toggle theme
  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    this.updateThemeIcon();
  },
  
  // Update theme icon
  updateThemeIcon() {
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      themeToggle.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }
};

// Global theme toggle function
window.toggleTheme = function() {
  window.themeManager.toggle();
};

// Debug: Check if script is loading
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize theme manager
  window.themeManager.init();
  
  // Get DOM elements
  const adminToggle = document.getElementById('adminToggle');
  const adminLoginModal = document.getElementById('adminLoginModal');
  
  // Check if Supabase is loaded
  if (typeof supabase === 'undefined') {
    console.error('Supabase is not loaded!');
    alert('Supabase yüklenemedi!');
    return;
  }
  
  // Create Supabase client (cached)
  const supabaseClient = supabase.createClient(
    'https://xdjyeicdaemdjqntdwsy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanllaWNkYWVtZGpxbnRkd3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzAyNDksImV4cCI6MjA2NzMwNjI0OX0.uoUGaNtWtfj_sYLKZdZuwFQX4I79BfYGYLxJ463Hb5Y'
  );
  
  // Admin state
  let isAdmin = false;
  window.isAdmin = false; // Global erişim için
  
  // Cache for admin check
  let adminCheckCache = null;
  let adminCheckTime = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Simple test - add click handler to admin button
  if (adminToggle) {
    adminToggle.addEventListener('click', function() {
      
      if (isAdmin) {
        // Logout
        signOut();
      } else {
        // Show login modal
        
        // Try to show modal
        if (adminLoginModal) {
          
          // Show modal manually (more reliable)
          adminLoginModal.style.display = 'block';
          adminLoginModal.classList.add('show');
          adminLoginModal.setAttribute('aria-hidden', 'false');
          document.body.classList.add('modal-open');
          
          // Add backdrop
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.style.position = 'fixed';
          backdrop.style.top = '0';
          backdrop.style.left = '0';
          backdrop.style.width = '100vw';
          backdrop.style.height = '100vh';
          backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          backdrop.style.zIndex = '1040';
          document.body.appendChild(backdrop);
          
          // Add close functionality
          backdrop.addEventListener('click', function() {
            hideModal();
          });
          
          // Add close button functionality
          const closeBtn = adminLoginModal.querySelector('.btn-close');
          if (closeBtn) {
            closeBtn.addEventListener('click', function() {
              hideModal();
            });
          }
          
        }
      }
      
      function hideModal() {
        adminLoginModal.style.display = 'none';
        adminLoginModal.classList.remove('show');
        adminLoginModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      }
    });
    
  } else {
    console.error('Admin toggle button not found!');
  }
  
  // Add admin login form handler
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;
      
      try {
        // Sign in with Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) {
          console.error('Login error:', error);
          alert('Giriş hatası: ' + error.message);
          return;
        }
        
        if (data.user) {
          
          // Check if user is admin (with caching)
          const adminResult = await checkAdminStatus(data.user.id);
          
          if (adminResult) {
            isAdmin = true;
            window.isAdmin = true; // Global erişim için
            updateAdminUI();
            hideModal();
            adminLoginForm.reset();
            alert('Admin girişi başarılı!');
          } else {
            alert('Bu kullanıcının admin yetkisi yok!');
            await supabaseClient.auth.signOut();
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Giriş yapılırken hata oluştu: ' + error.message);
      }
    });
    
  }
  
  // Cached admin check function
  async function checkAdminStatus(userId) {
    const now = Date.now();
    
    // Check cache first
    if (adminCheckCache && (now - adminCheckTime) < CACHE_DURATION) {
      return adminCheckCache;
    }
    
    try {
      const { data: adminData, error: adminError } = await supabaseClient
        .from('admin_users')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (adminError) {
        console.error('Admin check error:', adminError);
        return false;
      }
      
      // Update cache
      adminCheckCache = adminData && adminData.is_admin;
      adminCheckTime = now;
      
      return adminCheckCache;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }
  
  // Check authentication status
  async function checkAuthStatus() {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        const adminResult = await checkAdminStatus(user.id);
        if (adminResult) {
          isAdmin = true;
          window.isAdmin = true; // Global erişim için
          updateAdminUI();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }
  
  // Sign out function
  async function signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        alert('Çıkış yapılırken hata oluştu');
        return;
      }
      
      isAdmin = false;
      window.isAdmin = false; // Global erişim için
      adminCheckCache = null; // Clear cache
      updateAdminUI();
      alert('Admin çıkışı yapıldı!');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Çıkış yapılırken hata oluştu');
    }
  }
  
  // Update admin UI
  function updateAdminUI() {
    const adminPostForm = document.getElementById('adminPostForm');
    
    if (isAdmin) {
      // Show admin post form
      if (adminPostForm) {
        adminPostForm.style.display = 'block';
      }
      
      // Update admin button
      adminToggle.innerHTML = '<i class="fas fa-user-shield"></i>';
      adminToggle.classList.add('admin-active');
      adminToggle.title = 'Admin (Çıkış için tıklayın)';
      
      // Update global admin state
      window.isAdmin = true;
    } else {
      // Hide admin post form
      if (adminPostForm) {
        adminPostForm.style.display = 'none';
      }
      
      // Update admin button
      adminToggle.innerHTML = '<i class="fas fa-crown"></i>';
      adminToggle.classList.remove('admin-active');
      adminToggle.title = 'Admin Girişi';
      
      // Update global admin state
      window.isAdmin = false;
    }
    
    // Reload posts to show/hide admin controls
    if (typeof loadPostsWithComments === 'function') {
      loadPostsWithComments();
    }
  }
  
  // Hide modal function
  function hideModal() {
    const adminLoginModal = document.getElementById('adminLoginModal');
    if (adminLoginModal) {
      adminLoginModal.style.display = 'none';
      adminLoginModal.classList.remove('show');
      adminLoginModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      
      // Remove backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  }
  
  // Check auth status on load
  checkAuthStatus();

  // Her sayfa yüklemesinde admin state'i localStorage'a da yaz
  if (isAdmin) {
    localStorage.setItem('isAdmin', 'true');
  } else {
    localStorage.removeItem('isAdmin');
  }

  // Eğer Supabase oturumu varsa ve admin ise, diğer sayfalarda da otomatik admin UI göster
  window.addEventListener('storage', function(e) {
    if (e.key === 'isAdmin') {
      if (e.newValue === 'true') {
        isAdmin = true;
        window.isAdmin = true;
        updateAdminUI();
      } else {
        isAdmin = false;
        window.isAdmin = false;
        updateAdminUI();
      }
    }
  });
  
  // Load posts with comments after auth check
  if (typeof loadPostsWithComments === 'function') {
    loadPostsWithComments();
  }
});

// Add some basic styling for modal fallback
const style = document.createElement('style');
style.textContent = `
  .modal.show {
    display: block !important;
  }
  
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
  }
  
  .modal-open {
    overflow: hidden;
  }
`;
document.head.appendChild(style); 

// Gece modunda inline style temizleyici ve otomatik CSS ekleyici
function ensureDarkModeStyles() {
  // CSS override'ı ekle (tekrar eklenmesin diye kontrol)
  if (!document.getElementById('auto-darkmode-override')) {
    const style = document.createElement('style');
    style.id = 'auto-darkmode-override';
    style.innerHTML = `
[data-theme="dark"] .about-box,
[data-theme="dark"] .playlist-about-box,
[data-theme="dark"] .contact-about-box {
  background: #18192b !important;
  border-color: #23243a !important;
  box-shadow: 0 4px 24px rgba(20, 20, 40, 0.25) !important;
}
[data-theme="dark"] .about-box-title,
[data-theme="dark"] .playlist-title-accent,
[data-theme="dark"] .contact-title-accent {
  color: #8faaff !important;
  border-bottom: 3px solid #8faaff !important;
  background: transparent !important;
}
[data-theme="dark"] .about-box-title i,
[data-theme="dark"] .playlist-title-accent i,
[data-theme="dark"] .contact-title-accent i,
[data-theme="dark"] .about-box-title svg,
[data-theme="dark"] .playlist-title-accent svg,
[data-theme="dark"] .contact-title-accent svg {
  color: #8faaff !important;
  fill: #8faaff !important;
}
[data-theme="dark"] .about-box[style],
[data-theme="dark"] .playlist-about-box[style],
[data-theme="dark"] .contact-about-box[style] {
  background: #18192b !important;
  border-color: #23243a !important;
  box-shadow: 0 4px 24px rgba(20, 20, 40, 0.25) !important;
}
[data-theme="dark"] .about-box-title[style],
[data-theme="dark"] .playlist-title-accent[style],
[data-theme="dark"] .contact-title-accent[style] {
  color: #8faaff !important;
  border-bottom: 3px solid #8faaff !important;
  background: transparent !important;
}
`;
    document.head.appendChild(style);
  }
  // Inline style temizle
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    document.querySelectorAll('.about-box, .playlist-about-box, .contact-about-box, .about-box-title, .playlist-title-accent, .contact-title-accent').forEach(el => {
      el.removeAttribute('style');
    });
  }
}
window.addEventListener('themeChanged', ensureDarkModeStyles);
document.addEventListener('DOMContentLoaded', ensureDarkModeStyles); 

// Render comments
function renderComments(comments, postId) {
    if (!comments || comments.length === 0) {
        return '<div class="text-muted">Henüz yorum yok. İlk yorumu siz yapın!</div>';
    }
    return comments.map(comment => `
        <div class="comment-item" data-comment-id="${comment.id}" data-post-id="${postId}">
            <div class="comment-header">
                <strong>${comment.name}</strong>
                <small class="text-muted">${comment.date}</small>
                ${window.isAdmin ? `<a href="#" class="delete-btn" onclick="deleteComment(${postId}, ${comment.id})"><i class="fas fa-trash"></i></a>` : ''}
            </div>
            <div class="comment-text">${comment.text}</div>
            <!-- Reply Button -->
            <div class="comment-actions">
                <a href="#" class="reply-btn" onclick="showReplyForm(event, ${comment.id}, ${postId})">
                    <i class="fas fa-reply"></i> Yanıtla
                </a>
            </div>
            <!-- Reply Form (Hidden by default) -->
            <div class="reply-form" id="reply-form-${comment.id}" data-post-id="${postId}" style="display: none;">
                <div class="input-group">
                    <input id="reply-name-${comment.id}" placeholder="Adınız ve soyadınız" required>
                    <textarea id="reply-text-${comment.id}" placeholder="Yanıtınızı yazın..." required></textarea>
                    <button class="btn btn-outline-secondary" onclick="addReply(${postId}, ${comment.id})">
                        <i class="fas fa-paper-plane"></i> Yanıtla
                    </button>
                </div>
            </div>
            <!-- Replies Section -->
            ${renderReplies(comment.replies || [], comment.id, postId)}
        </div>
    `).join('');
}

// Render replies
function renderReplies(replies, commentId, postId) {
    if (!replies || replies.length === 0) {
        return '';
    }
    return `
        <div class="replies-section">
            ${replies.map(reply => `
                <div class="reply-item" data-reply-id="${reply.id}">
                    <div class="reply-header">
                        <strong>${reply.name}</strong>
                        <small class="text-muted">${reply.date}</small>
                        ${window.isAdmin ? `<a href="#" class="delete-btn" onclick="deleteReply(${reply.postId}, ${commentId}, ${reply.id})"><i class="fas fa-trash"></i></a>` : ''}
                    </div>
                    <div class="reply-text">${reply.text}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// addReply fonksiyonunun başına kontrol ekle
window.addReply = function(postId, commentId) {
    if (!postId || !commentId) {
        alert('Yanıt eklenemiyor: postId veya commentId eksik!');
        return;
    }
    // ... mevcut addReply fonksiyonunun devamı ...
} 
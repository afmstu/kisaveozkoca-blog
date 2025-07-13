// Debug: Check if script is loading
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  // Get DOM elements
  const adminToggle = document.getElementById('adminToggle');
  const adminLoginModal = document.getElementById('adminLoginModal');
  
  // Check if Supabase is loaded
  if (typeof supabase === 'undefined') {
    console.error('Supabase is not loaded!');
    alert('Supabase yüklenemedi!');
    return;
  }
  
  // Create Supabase client
  const supabaseClient = supabase.createClient(
    'https://xdjyeicdaemdjqntdwsy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanllaWNkYWVtZGpxbnRkd3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzAyNDksImV4cCI6MjA2NzMwNjI0OX0.uoUGaNtWtfj_sYLKZdZuwFQX4I79BfYGYLxJ463Hb5Y'
  );
  
  // Admin state
  let isAdmin = false;
  window.isAdmin = false; // Global erişim için
  
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
          
          // Check if user is admin
          const { data: adminData, error: adminError } = await supabaseClient
            .from('admin_users')
            .select('is_admin')
            .eq('id', data.user.id)
            .single();
          
          if (adminError) {
            console.error('Admin check error:', adminError);
            alert('Admin yetkisi kontrol edilemedi');
            return;
          }
          
          if (adminData && adminData.is_admin) {
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
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.status,
          stack: error.stack
        });
        alert('Giriş yapılırken hata oluştu: ' + error.message);
      }
    });
    
  }
  
  // Check authentication status
  async function checkAuthStatus() {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        
        // Check if user is admin
        const { data: adminData, error: adminError } = await supabaseClient
          .from('admin_users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (!adminError && adminData && adminData.is_admin) {
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
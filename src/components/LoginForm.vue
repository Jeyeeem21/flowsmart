<template>
  <div class="login-container">
    <div class="login-card">
    
      <div class="login-header">
        <h1>FlowSmart</h1>
        <p>Water Management System</p>
      </div>
        <button class="btn-back-home" @click="goToHome">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Home
      </button>
      
      <div class="login-form">
        <h2>Sign In</h2>
        <p class="login-description">Access your water usage dashboard</p>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button @click="signInWithGoogle" class="google-signin-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>
        
        <div class="login-divider">
          <span>or</span>
        </div>
        
        <form @submit.prevent="signInWithEmail">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" class="signin-btn" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        
        <p class="register-link">
          Don't have an account? 
          <router-link to="/resident/register2">Register</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@/firebase/config';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default {
  name: 'LoginView',
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref(null);
    const loading = ref(false);
    const router = useRouter();
    
    const goToHome = () => {
      router.push('/');
    };
    
    const redirectBasedOnRole = async (user) => {
      try {
        // Check user role in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.role === 'admin') {
            router.push('/dashboard');
          } else if (userData.role === 'resident') {
            router.push('/residentdashboard');
          } else {
            // Default redirect if role isn't specified
            router.push('/login');
          }
        } else {
          // If user document doesn't exist, redirect to profile setup
          router.push('/complete-profile');
        }
      } catch (err) {
        console.error("Error checking user role:", err);
        error.value = "Error during login. Please try again.";
      }
    };
    
    const signInWithEmail = async () => {
      error.value = null;
      loading.value = true;
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
        await redirectBasedOnRole(userCredential.user);
      } catch (err) {
        switch(err.code) {
          case 'auth/user-not-found':
            error.value = 'No user found with this email address';
            break;
          case 'auth/wrong-password':
            error.value = 'Incorrect password';
            break;
          case 'auth/too-many-requests':
            error.value = 'Account temporarily locked due to too many failed attempts';
            break;
          default:
            error.value = 'Failed to sign in. Please try again.';
        }
        console.error(err);
      } finally {
        loading.value = false;
      }
    };
    
    const signInWithGoogle = async () => {
      error.value = null;
      loading.value = true;
      
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        await redirectBasedOnRole(userCredential.user);
      } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') {
          error.value = 'Google sign in was canceled';
        } else {
          error.value = 'Failed to sign in with Google. Please try again.';
        }
        console.error(err);
      } finally {
        loading.value = false;
      }
    };
    
    return {
      email,
      password,
      error,
      loading,
      signInWithEmail,
      signInWithGoogle,
      goToHome
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  overflow: hidden;
  position: relative;
}

.btn-back-home {
  background: none;
  border: none;
  color: #4caf50;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 0;
  margin: 15px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-back-home:hover {
  text-decoration: underline;
}

.btn-back-home svg {
  width: 16px;
  height: 16px;
}

.login-header {
  background-color: #4caf50;
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.login-header h1 {
  margin: 0;
  font-size: 2rem;
}

.login-header p {
  margin: 5px 0 0;
  opacity: 0.9;
}

.login-form {
  padding: 30px;
}

.login-form h2 {
  margin: 0 0 5px;
  color: #2c3e50;
  font-size: 1.5rem;
}

.login-description {
  color: #666;
  margin-top: 0;
  margin-bottom: 25px;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.google-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
  transition: background-color 0.2s;
}

.google-signin-btn svg {
  margin-right: 10px;
}

.google-signin-btn:hover {
  background-color: #f5f5f5;
}

.login-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #999;
}

.login-divider::before,
.login-divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.login-divider span {
  padding: 0 10px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  border-color: #4caf50;
  outline: none;
}

.signin-btn {
  width: 100%;
  padding: 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.signin-btn:hover {
  background-color: #3d9140;
}

.signin-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #4caf50;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

/* Responsive styles for smaller screens */
@media (max-width: 575.98px) {
  .login-card {
    max-width: 100%;
    margin: 0 10px;
  }

  .login-header {
    padding: 20px;
  }

  .login-header h1 {
    font-size: 1.8rem;
  }

  .login-form {
    padding: 20px;
  }

  .login-form h2 {
    font-size: 1.3rem;
  }
}

/* Extra small screens */
@media (max-width: 400px) {
  .login-header h1 {
    font-size: 1.5rem;
  }

  .login-form {
    padding: 15px;
  }
}
</style>
<template>
  <div class="resident-registration">
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Resident Registration</h1>
        
        <!-- Step 1: Authentication Method Selection -->
        <div v-if="currentStep === 1">
          <div class="auth-options">
            <button class="btn btn-auth" @click="showEmailForm = true">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Register with Email
            </button>
            
            <div class="divider">
              <span>OR</span>
            </div>
            
            <button class="btn btn-google" @click="signInWithGoogle" :disabled="isLoading">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              Register with Google
            </button>
          </div>
        </div>
        
        <!-- Step 2: Email Registration Form -->
        <form @submit.prevent="registerWithEmail" v-if="currentStep === 1 && showEmailForm">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              v-model="form.email" 
              required 
              placeholder="resident@example.com"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                v-model="form.password" 
                required 
                placeholder="Minimum 8 characters"
                class="form-control"
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-back" @click="showEmailForm = false">
              Back
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <span v-if="isLoading">
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Processing...
              </span>
              <span v-else>Continue</span>
            </button>
          </div>
        </form>
        
        <!-- Step 3: Additional Information Form -->
        <form @submit.prevent="completeRegistration" v-if="currentStep === 2">
          <div class="form-header">
            <h2>Complete Your Profile</h2>
            <p>Please provide the following information to complete your registration</p>
          </div>
          
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              v-model="form.fullName" 
              required 
              placeholder="Juan Dela Cruz"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="address">Address</label>
            <input 
              type="text" 
              id="address" 
              v-model="form.address" 
              required 
              placeholder="e.g., Block 1 Lot 2 or Unit 301"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="contactNumber">Contact Number (Philippines)</label>
            <div class="phone-input">
              <div class="phone-prefix">+63</div>
              <input 
                type="tel" 
                id="contactNumber" 
                v-model="form.contactNumber" 
                required 
                placeholder="9XX XXX XXXX"
                class="form-control"
                @input="formatPhoneNumber"
              />
            </div>
            <small class="form-text">Format: 9XX XXX XXXX (without leading 0)</small>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <span v-if="isLoading">
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Completing Registration...
              </span>
              <span v-else>Complete Registration</span>
            </button>
          </div>
        </form>
        
        <!-- Registration Success Message -->
        <div class="success-message" v-if="currentStep === 3">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Registration Successful!</h2>
          <p>Your resident account has been created successfully.</p>
          <button class="btn btn-primary" @click="goToLogin">Login</button>
        </div>
        
        <!-- Error Alert -->
        <div class="error-alert" v-if="error">
          {{ error }}
        </div>
        
        <!-- Login Link -->
        <div class="auth-footer" v-if="currentStep !== 3">
          <p>Already have an account? <router-link to="/login">Login</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

export default {
  name: 'ResidentRegistration',
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      currentStep: 1,
      showEmailForm: false,
      form: {
        email: '',
        password: '',
        fullName: '',
        address: '',
        contactNumber: ''
      },
      showPassword: false,
      isLoading: false,
      error: null,
      authUser: null
    };
  },
  methods: {
  goToLogin() {
    this.router.push('/login');
  },
    async registerWithEmail() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const auth = getAuth();
        const { user } = await createUserWithEmailAndPassword(
          auth, 
          this.form.email, 
          this.form.password
        );
        
        // Store user reference and move to next step
        this.authUser = user;
        this.currentStep = 2;
      } catch (error) {
        console.error('Registration error:', error);
        this.error = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async signInWithGoogle() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        const { user } = await signInWithPopup(auth, provider);
        
        // Pre-fill form with data from Google account
        this.form.email = user.email || '';
        this.form.fullName = user.displayName || '';
        
        // Store user reference and move to next step
        this.authUser = user;
        this.currentStep = 2;
      } catch (error) {
        console.error('Google sign-in error:', error);
        this.error = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async completeRegistration() {
  this.isLoading = true;
  this.error = null;
  try {
    if (!this.authUser) {
      throw new Error('Authentication error. Please try again.');
    }
    // Format phone number with country code
    const formattedPhone = this.formatPhoneWithCountryCode(this.form.contactNumber);
    // Store additional user data in Firestore
    await this.storeUserData(this.authUser.uid, formattedPhone);
    // Move to success step
    this.currentStep = 3;
    // Redirect to login page after a short delay
    setTimeout(() => {
      this.router.push('/resident/login');
    }, 2000); // Optional: Add a delay to show the success message
  } catch (error) {
    console.error('Profile completion error:', error);
    this.error = this.getErrorMessage(error);
  } finally {
    this.isLoading = false;
  }
},
    
    async storeUserData(userId, phoneNumber) {
      try {
        const db = getFirestore();
        
        // Create a document with the user's ID in the 'residents' collection
        await setDoc(doc(db, 'users', userId), {
          email: this.form.email,
          fullName: this.form.fullName,
          address: this.form.address,
          contactNumber: phoneNumber,
          role: 'resident',
          createdAt: new Date().toISOString()
        });
        
        console.log('Resident data stored successfully');
      } catch (error) {
        console.error('Error storing user data:', error);
        throw error;
      }
    },
    
    formatPhoneNumber(event) {
      // Remove non-digit characters
      let value = event.target.value.replace(/\D/g, '');
      
      // Limit to 10 digits (for PH numbers without the country code)
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      
      // Format with spaces
      if (value.length > 6) {
        this.form.contactNumber = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
      } else if (value.length > 3) {
        this.form.contactNumber = `${value.slice(0, 3)} ${value.slice(3)}`;
      } else {
        this.form.contactNumber = value;
      }
    },
    
    formatPhoneWithCountryCode(phoneNumber) {
      // Remove spaces and ensure it starts with +63
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      return `+63${digitsOnly}`;
    },
    
    getErrorMessage(error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'This email is already registered. Please use a different email or login.';
        case 'auth/invalid-email':
          return 'The email address is not valid.';
        case 'auth/weak-password':
          return 'The password is too weak. Please use a stronger password.';
        case 'auth/operation-not-allowed':
          return 'Email/password accounts are not enabled. Please contact support.';
        case 'auth/popup-closed-by-user':
          return 'Google sign-in was cancelled. Please try again.';
        default:
          return `Registration failed: ${error.message}`;
      }
    },
    
    // Replace goToResidentDashboard with addMore
    addMore() {
      // Reset the form and go back to step 1
      this.resetForm();
      this.currentStep = 1;
      this.showEmailForm = false;
      this.authUser = null;
    },
    
    // Make sure there's a resetForm method
    resetForm() {
      this.form = {
        email: '',
        password: '',
        fullName: '',
        address: '',
        contactNumber: ''
      };
    }
    
    // Remove the goToResidentDashboard method
  }
};
</script>

<style scoped>
.resident-registration {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 70px);
  background-color: #f9f9f9;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 500px;
}

.auth-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.auth-title {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 25px;
  text-align: center;
}

.auth-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-auth {
  background-color: #f0f8f0;
  color: #4caf50;
  width: 100%;
}

.btn-auth:hover {
  background-color: #e8f5e9;
}

.btn-auth svg {
  margin-right: 10px;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
  width: 100%;
}

.btn-primary:hover {
  background-color: #43a047;
}

.btn-primary:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.btn-back {
  background-color: #f5f5f5;
  color: #666;
  margin-right: 10px;
}

.btn-back:hover {
  background-color: #eeeeee;
}

.btn-google {
  background-color: white;
  color: #2c3e50;
  border: 1px solid #ddd;
  width: 100%;
}

.btn-google:hover {
  background-color: #f5f5f5;
}

.btn-google svg {
  margin-right: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-header {
  margin-bottom: 20px;
  text-align: center;
}

.form-header h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-header p {
  color: #666;
  font-size: 0.9rem;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #4caf50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
}

.phone-input {
  display: flex;
  align-items: center;
}

.phone-prefix {
  background-color: #f5f5f5;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-right: none;
  border-radius: 4px 0 0 4px;
  color: #666;
  font-weight: 500;
}

.phone-input .form-control {
  border-radius: 0 4px 4px 0;
  flex: 1;
}

.form-text {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 25px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.divider span {
  padding: 0 10px;
  color: #666;
  font-size: 0.9rem;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 0.9rem;
}

.auth-footer a {
  color: #4caf50;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.error-alert {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
  font-size: 0.9rem;
}

.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  margin-bottom: 20px;
}

.success-message h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.success-message p {
  color: #666;
  margin-bottom: 25px;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .auth-card {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-back {
    margin-right: 0;
  }
}
</style>
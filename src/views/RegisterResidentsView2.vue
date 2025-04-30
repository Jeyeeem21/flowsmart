<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Register Resident</h2>

      <div v-if="currentStep === 1" class="step step-1">
        <button class="btn btn-google" @click="signInWithGoogle">
          <svg viewBox="0 0 48 48" width="20" height="20">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          </svg>
          Register with Google
        </button>

        <div class="divider"><span>or</span></div>

        <button class="btn btn-auth" @click="showEmailForm = true" v-if="!showEmailForm">
          Use Email & Password
        </button>

        <form @submit.prevent="registerWithEmail" v-if="showEmailForm">
          <input type="email" v-model="form.email" placeholder="Email" required />
          <input :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="Password" required />
          <label><input type="checkbox" v-model="showPassword"> Show Password</label>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Registering...' : 'Register' }}
          </button>
        </form>
      </div>

      <div v-if="currentStep === 2" class="step step-2">
        <h3>Complete Profile</h3>
        <input v-model="form.fullName" placeholder="Full Name" required />
        <input v-model="form.address" placeholder="Address" required />
        <input v-model="form.contactNumber" placeholder="Contact Number (e.g. 912 345 6789)" @input="formatPhoneNumber" />

        <button class="btn btn-primary" @click="completeRegistration">Submit</button>
      </div>

      <div v-if="currentStep === 3" class="success-message">
        <h2>Success!</h2>
        <p>Resident registered successfully.</p>
        <button class="btn btn-primary" @click="addMore">Add Another Resident</button>
      </div>

      <div v-if="error" class="error-alert">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export default {
  name: 'ResidentRegistration',
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
    async registerWithEmail() {
      this.isLoading = true;
      this.error = null;

      try {
        const auth = getAuth();
        const { user } = await createUserWithEmailAndPassword(auth, this.form.email, this.form.password);
        this.authUser = user;
        this.currentStep = 2;
      } catch (error) {
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

        // Check if email already exists in Firestore
        const db = getFirestore();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          this.isLoading = false;
          this.error = 'This email is already registered.';
          return;
        }

        this.form.email = user.email || '';
        this.form.fullName = user.displayName || '';
        this.authUser = user;
        this.currentStep = 2;

      } catch (error) {
        this.error = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    },

    async completeRegistration() {
  this.isLoading = true;
  this.error = null;

  try {
    if (!this.authUser) throw new Error('Authentication error.');

    const formattedPhone = this.formatPhoneWithCountryCode(this.form.contactNumber);
    await this.storeUserData(this.authUser.uid, formattedPhone);

    // ✅ Log the user out immediately after registration
    await signOut(getAuth());

    // Move to success step
    this.currentStep = 3;

  } catch (error) {
    this.error = this.getErrorMessage(error);
  } finally {
    this.isLoading = false;
  }
},

   async storeUserData(userId, phoneNumber) {
  const db = getFirestore();
  await setDoc(doc(db, 'users', userId), {
    email: this.form.email,
    fullName: this.form.fullName,
    address: this.form.address,
    contactNumber: phoneNumber,
    role: 'resident',
    createdAt: new Date().toISOString()
  });
},

    formatPhoneNumber(event) {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length > 10) value = value.slice(0, 10);
      if (value.length > 6) {
        this.form.contactNumber = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
      } else if (value.length > 3) {
        this.form.contactNumber = `${value.slice(0, 3)} ${value.slice(3)}`;
      } else {
        this.form.contactNumber = value;
      }
    },

    formatPhoneWithCountryCode(phoneNumber) {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      return `+63${digitsOnly}`;
    },

    addMore() {
      this.resetForm();
      this.currentStep = 1;
      this.showEmailForm = false;
      this.authUser = null;
    },

    resetForm() {
      this.form = {
        email: '',
        password: '',
        fullName: '',
        address: '',
        contactNumber: ''
      };
    },

    getErrorMessage(error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'This email is already registered. Please use a different email or login.';
        case 'auth/invalid-email':
          return 'The email address is not valid.';
        case 'auth/weak-password':
          return 'The password is too weak. Please use a stronger password.';
        default:
          return `Registration failed: ${error.message}`;
      }
    }
  }
};

router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/register-resident'];
  const authRequired = !publicPages.includes(to.path);
  const currentUser = getAuth().currentUser;

  if (authRequired && !currentUser) {
    next('/login');
  } else {
    next();
  }
});
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
<template>
  <div class="admin-profile">
    <div class="profile-header">
      <h2>Admin Profile</h2>
      <button class="btn btn-edit" @click="toggleEditMode" v-if="!isEditing">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit Profile
      </button>
    </div>
    
    <div class="profile-content">
      <!-- View Mode -->
      <div class="profile-view" v-if="!isEditing">
        <div class="profile-field">
          <span class="field-label">Email:</span>
          <span class="field-value">{{ adminData.email }}</span>
        </div>
        
        <div class="profile-field">
          <span class="field-label">Full Name:</span>
          <span class="field-value">{{ adminData.fullName || 'Not provided' }}</span>
        </div>
        
        <div class="profile-field">
          <span class="field-label">Address:</span>
          <span class="field-value">{{ adminData.address || 'Not provided' }}</span>
        </div>
        
        <div class="profile-field">
          <span class="field-label">Contact Number:</span>
          <span class="field-value">{{ adminData.contactNumber || 'Not provided' }}</span>
        </div>
        
        <div class="profile-field">
          <span class="field-label">Role:</span>
          <span class="field-value role-badge">{{ adminData.role || 'Admin' }}</span>
        </div>
      </div>
      
      <!-- Edit Mode -->
      <form class="profile-edit" v-else @submit.prevent="saveProfile">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            v-model="editForm.email" 
            class="form-control"
            disabled
          />
          <small class="form-text">Email cannot be changed</small>
        </div>
        
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input 
            type="text" 
            id="fullName" 
            v-model="editForm.fullName" 
            required 
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label for="address">Address</label>
          <textarea 
            id="address" 
            v-model="editForm.address" 
            class="form-control"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="contactNumber">Contact Number</label>
          <input 
            type="tel" 
            id="contactNumber" 
            v-model="editForm.contactNumber" 
            class="form-control"
          />
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-cancel" @click="cancelEdit">Cancel</button>
          <button type="submit" class="btn btn-save" :disabled="isLoading">
            <span v-if="isLoading">
              <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
    
    <!-- Success Message -->
    <div class="success-message" v-if="showSuccess">
      Profile updated successfully!
    </div>
    
    <!-- Error Message -->
    <div class="error-message" v-if="error">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

export default {
  name: 'AdminProfile',
  data() {
    return {
      adminData: {
        email: '',
        fullName: '',
        address: '',
        contactNumber: '',
        role: 'admin'
      },
      editForm: {
        email: '',
        fullName: '',
        address: '',
        contactNumber: ''
      },
      isEditing: false,
      isLoading: false,
      showSuccess: false,
      error: null
    };
  },
  methods: {
    toggleEditMode() {
      this.isEditing = true;
      this.editForm = { ...this.adminData };
    },
    
    cancelEdit() {
      this.isEditing = false;
      this.error = null;
    },
    
    async saveProfile() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('You must be logged in to update your profile.');
        }
        
        const db = getFirestore();
        const adminRef = doc(db, 'admins', user.uid);
        
        // Update the admin document
        await updateDoc(adminRef, {
          fullName: this.editForm.fullName,
          address: this.editForm.address,
          contactNumber: this.editForm.contactNumber,
          updatedAt: new Date().toISOString()
        });
        
        // Update local data
        this.adminData = { ...this.editForm };
        
        // Update localStorage
        const storedData = JSON.parse(localStorage.getItem('adminData') || '{}');
        localStorage.setItem('adminData', JSON.stringify({
          ...storedData,
          ...this.editForm
        }));
        
        // Show success message
        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
        }, 3000);
        
        // Exit edit mode
        this.isEditing = false;
      } catch (error) {
        console.error('Error updating profile:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadAdminData() {
      try {
        // First try to get data from localStorage
        const storedData = localStorage.getItem('adminData');
        
        if (storedData) {
          this.adminData = JSON.parse(storedData);
        } else {
          // If not in localStorage, fetch from Firestore
          const auth = getAuth();
          const user = auth.currentUser;
          
          if (user) {
            const db = getFirestore();
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            
            if (adminDoc.exists()) {
              this.adminData = adminDoc.data();
              // Store in localStorage for future use
              localStorage.setItem('adminData', JSON.stringify(this.adminData));
            }
          }
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    }
  },
  mounted() {
    this.loadAdminData();
  }
};
</script>

<style scoped>
.admin-profile {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.profile-header h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-edit {
  background-color: #f0f8f0;
  color: #4caf50;
}

.btn-edit:hover {
  background-color: #e8f5e9;
}

.btn-edit svg {
  margin-right: 6px;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
  margin-right: 10px;
}

.btn-cancel:hover {
  background-color: #eeeeee;
}

.btn-save {
  background-color: #4caf50;
  color: white;
}

.btn-save:hover {
  background-color: #43a047;
}

.btn-save:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.profile-field {
  margin-bottom: 15px;
  display: flex;
}

.field-label {
  font-weight: 500;
  color: #666;
  width: 150px;
}

.field-value {
  color: #2c3e50;
  flex: 1;
}

.role-badge {
  display: inline-block;
  background-color: #e8f5e9;
  color: #4caf50;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.form-group {
  margin-bottom: 20px;
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

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-text {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
  font-size: 0.9rem;
  text-align: center;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
  font-size: 0.9rem;
  text-align: center;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
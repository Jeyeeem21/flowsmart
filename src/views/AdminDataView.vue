<template>
  <div class="admin-data">
    <h1>Admin Management</h1>
    
    <div class="admin-controls">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by name..." 
          class="search-input"
          @input="filterAdmins"
        />
        <button class="btn-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
      
      <button class="btn-add" @click="navigateToRegister">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Register New Admin
      </button>
    </div>
    
    <!-- Loading State -->
    <div class="loading-container" v-if="isLoading">
      <div class="loading-spinner">
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <p>Loading admin data...</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div class="error-container" v-if="error">
      <div class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{{ error }}</p>
      </div>
      <button class="btn-retry" @click="loadAdmins">Retry</button>
    </div>
    
    <!-- Empty State -->
    <div class="empty-container" v-if="!isLoading && !error && filteredAdmins.length === 0">
      <div class="empty-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <p v-if="searchQuery">No administrators found matching "{{ searchQuery }}"</p>
        <p v-else>No administrators found. Click "Register New Admin" to add one.</p>
      </div>
    </div>
    
    <!-- Admins Table -->
    <div class="admins-table-container" v-if="!isLoading && !error && filteredAdmins.length > 0">
      <table class="admins-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Contact Number</th>
            <th>Address</th>
            <th>Created</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in filteredAdmins" :key="admin.id">
            <td data-label="Name">{{ admin.fullName || 'Not provided' }}</td>
            <td data-label="Role">{{ admin.role || 'Standard Admin' }}</td>
            <td data-label="Contact Number">{{ admin.contactNumber || 'Not provided' }}</td>
            <td data-label="Address">{{ admin.address || 'Not provided' }}</td>
            <td data-label="Created">{{ formatDate(admin.createdAt) }}</td>
            <td class="actions-column">
              <div class="action-buttons">
                <button class="btn-view" @click="viewAdmin(admin)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button class="btn-edit" @click="openEditModal(admin)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="btn-delete" @click="confirmDelete(admin)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Admin View Modal -->
    <div class="modal-overlay" v-if="showViewModal" @click="showViewModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Admin Details</h2>
          <button class="modal-close" @click="showViewModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="admin-details">
            <div class="detail-row">
              <span class="detail-label">Full Name:</span>
              <span class="detail-value">{{ selectedAdmin.fullName || 'Not provided' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Role:</span>
              <span class="detail-value">{{ selectedAdmin.role || 'Standard Admin' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Contact Number:</span>
              <span class="detail-value">{{ selectedAdmin.contactNumber || 'Not provided' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">{{ selectedAdmin.address || 'Not provided' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(selectedAdmin.createdAt) }}</span>
            </div>
            <div class="detail-row" v-if="selectedAdmin.updatedAt">
              <span class="detail-label">Last Updated:</span>
              <span class="detail-value">{{ formatDate(selectedAdmin.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Edit Admin Modal -->
    <div class="modal-overlay" v-if="showEditModal" @click="showEditModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Edit Admin</h2>
          <button class="modal-close" @click="showEditModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="edit-form">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input 
                id="fullName" 
                v-model="editAdminData.fullName" 
                type="text" 
                placeholder="Enter full name" 
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="contactNumber">Contact Number</label>
              <input 
                id="contactNumber" 
                v-model="editAdminData.contactNumber" 
                type="tel" 
                placeholder="Enter contact number" 
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="address">Address</label>
              <textarea 
                id="address" 
                v-model="editAdminData.address" 
                placeholder="Enter address" 
                class="form-input"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" @click="showEditModal = false">Cancel</button>
              <button 
                class="btn-save" 
                @click="saveAdminChanges" 
                :disabled="isSaving"
              >
                <span v-if="isSaving">
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
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" v-if="showDeleteModal" @click="showDeleteModal = false">
      <div class="modal-container delete-modal" @click.stop>
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="modal-close" @click="showDeleteModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="delete-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>Are you sure you want to delete the admin account for <strong>{{ selectedAdmin.fullName }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-confirm-delete" @click="deleteAdmin" :disabled="isDeleting">
              <span v-if="isDeleting">
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
                Deleting...
              </span>
              <span v-else>Delete Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Message -->
    <div class="toast-container" v-if="showToast">
      <div class="toast-message" :class="{ 'toast-success': toastType === 'success', 'toast-error': toastType === 'error' }">
        <svg v-if="toastType === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <svg v-if="toastType === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'AdminData',
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      admins: [],
      filteredAdmins: [],
      searchQuery: '',
      isLoading: true,
      error: null,
      showViewModal: false,
      showEditModal: false,
      showDeleteModal: false,
      selectedAdmin: {},
      editAdminData: {
        id: '',
        fullName: '',
        contactNumber: '',
        address: ''
      },
      isDeleting: false,
      isSaving: false,
      showToast: false,
      toastMessage: '',
      toastType: 'success'
    };
  },
  methods: {
    async loadAdmins() {
      this.isLoading = true;
      this.error = null;
      try {
        const db = getFirestore();
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);

        // Filter users where role is "admin"
        this.admins = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === "admin");

        this.filteredAdmins = [...this.admins];
      } catch (error) {
        console.error('Error loading admins:', error);
        this.error = 'Failed to load admin data. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },
    
    filterAdmins() {
      if (!this.searchQuery.trim()) {
        this.filteredAdmins = [...this.admins];
        return;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredAdmins = this.admins.filter(admin => {
        return (
          (admin.fullName && admin.fullName.toLowerCase().includes(query)) ||
          (admin.role && admin.role.toLowerCase().includes(query)) ||
          (admin.address && admin.address.toLowerCase().includes(query))
        );
      });
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      
      try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      } catch (error) {
        return dateString;
      }
    },
    
    viewAdmin(admin) {
      this.selectedAdmin = { ...admin };
      this.showViewModal = true;
    },
    
    openEditModal(admin) {
      this.editAdminData = {
        id: admin.id,
        fullName: admin.fullName || '',
        contactNumber: admin.contactNumber || '',
        address: admin.address || ''
      };
      this.showEditModal = true;
    },
    
    async saveAdminChanges() {
      this.isSaving = true;
      try {
        const db = getFirestore();
        const adminRef = doc(db, 'users', this.editAdminData.id);
        
        // Update Firestore with new data
        await updateDoc(adminRef, {
          fullName: this.editAdminData.fullName.trim() || null,
          contactNumber: this.editAdminData.contactNumber.trim() || null,
          address: this.editAdminData.address.trim() || null,
          updatedAt: new Date().toISOString()
        });
        
        // Update local arrays
        this.admins = this.admins.map(admin =>
          admin.id === this.editAdminData.id
            ? { ...admin, ...this.editAdminData, updatedAt: new Date().toISOString() }
            : admin
        );
        this.filteredAdmins = this.filteredAdmins.map(admin =>
          admin.id === this.editAdminData.id
            ? { ...admin, ...this.editAdminData, updatedAt: new Date().toISOString() }
            : admin
        );
        
        // Close modal and show success toast
        this.showEditModal = false;
        this.showToastMessage('Admin details updated successfully', 'success');
      } catch (error) {
        console.error('Error updating admin:', error);
        this.showToastMessage('Failed to update admin details. Please try again.', 'error');
      } finally {
        this.isSaving = false;
      }
    },
    
    confirmDelete(admin) {
      this.selectedAdmin = { ...admin };
      this.showDeleteModal = true;
    },
    
    async deleteAdmin() {
      this.isDeleting = true;
      
      try {
        const db = getFirestore();
        const auth = getAuth();
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'users', this.selectedAdmin.id));
        
        // Attempt to delete from Authentication
        try {
          const user = auth.currentUser;
          if (user && user.uid === this.selectedAdmin.id) {
            await deleteUser(user);
          }
        } catch (authError) {
          console.warn('Could not delete user from Authentication:', authError);
          // Continue with Firestore deletion even if auth deletion fails
        }
        
        // Remove from local arrays
        this.admins = this.admins.filter(admin => admin.id !== this.selectedAdmin.id);
        this.filteredAdmins = this.filteredAdmins.filter(admin => admin.id !== this.selectedAdmin.id);
        
        // Close modal
        this.showDeleteModal = false;
        
        // Show success toast
        this.showToastMessage('Admin deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting admin:', error);
        this.showToastMessage('Failed to delete admin. Please try again.', 'error');
      } finally {
        this.isDeleting = false;
      }
    },
    
    showToastMessage(message, type = 'success') {
      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;
      
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    },
    
    navigateToRegister() {
      this.router.push('/admin/register');
    }
  },
  mounted() {
    this.loadAdmins();
  }
};
</script>

<style scoped>
.admin-data {
  padding: 16px;
  position: relative;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.admin-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4caf50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.btn-search {
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

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #43a047;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-spinner {
  text-align: center;
  color: #666;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 20px;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #d32f2f;
  text-align: center;
  max-width: 400px;
}

.error-message svg {
  margin-bottom: 10px;
  color: #d32f2f;
}

.btn-retry {
  padding: 10px 20px;
  background-color: #f5f5f5;
  color: #2c3e50;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.btn-retry:hover {
  background-color: #e0e0e0;
}

/* Empty State */
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-message {
  text-align: center;
  color: #666;
  max-width: 400px;
  font-size: 0.9rem;
}

.empty-message svg {
  margin-bottom: 15px;
  color: #ccc;
}

/* Admins Table */
.admins-table-container {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.admins-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.admins-table th,
.admins-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.admins-table th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #2c3e50;
}

.admins-table th:nth-child(1) { width: 20%; }
.admins-table th:nth-child(2) { width: 15%; }
.admins-table th:nth-child(3) { width: 15%; }
.admins-table th:nth-child(4) { width: 25%; }
.admins-table th:nth-child(5) { width: 15%; }
.admins-table th.actions-column { width: 10%; }

.admins-table tr:last-child td {
  border-bottom: none;
}

.admins-table tr:hover {
  background-color: #f5f5f5;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-view,
.btn-edit,
.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-view {
  background-color: #e3f2fd;
  color: #2196f3;
}

.btn-view:hover {
  background-color: #bbdefb;
}

.btn-edit {
  background-color: #f0f8f0;
  color: #4caf50;
}

.btn-edit:hover {
  background-color: #e8f5e9;
}

.btn-delete {
  background-color: #ffebee;
  color: #f44336;
}

.btn-delete:hover {
  background-color: #ffcdd2;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
}

.modal-content {
  padding: 20px;
}

/* Admin Details */
.admin-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
}

.detail-label {
  font-weight: 500;
  color: #666;
  width: 140px;
}

.detail-value {
  color: #2c3e50;
  flex: 1;
}

/* Edit Form */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #4caf50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-input[type="textarea"] {
  min-height: 80px;
  resize: vertical;
}

.btn-save {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.btn-save:hover {
  background-color: #43a047;
}

.btn-save:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

/* Delete Modal */
.delete-modal {
  max-width: 450px;
}

.delete-warning {
  text-align: center;
  margin-bottom: 20px;
}

.delete-warning svg {
  margin-bottom: 15px;
}

.warning-text {
  color: #d32f2f;
  font-weight: 500;
  margin-top: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 10px 20px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}

.btn-confirm-delete {
  padding: 10px 20px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.btn-confirm-delete:hover {
  background-color: #d32f2f;
}

.btn-confirm-delete:disabled {
  background-color: #ffcdd2;
  cursor: not-allowed;
}

/* Toast Message */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
}

.toast-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  font-size: 0.9rem;
  max-width: 300px;
}

.toast-success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.toast-error {
  background-color: #ffebee;
  color: #d32f2f;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .admin-data {
    padding: 16px;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  .admin-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-container {
    max-width: none;
  }

  .search-input {
    padding: 12px 40px 12px 12px;
    font-size: 1rem;
  }

  .btn-search {
    right: 10px;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
    padding: 12px;
    font-size: 1rem;
  }

  /* Table to Card Layout */
  .admins-table-container {
    overflow-x: visible;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .admins-table {
    display: block;
    min-width: 0;
  }

  .admins-table thead {
    display: none;
  }

  .admins-table tbody {
    display: block;
  }

  .admins-table tr {
    display: block;
    background-color: white;
    border-radius: 8px;
    margin-bottom: 12px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #eee;
  }

  .admins-table td {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: none;
    font-size: 0.9rem;
    white-space: normal;
    max-width: none;
    text-overflow: clip;
    word-break: break-word;
  }

  .admins-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #666;
    width: 40%;
    min-width: 120px;
    flex-shrink: 0;
  }

  .admins-table td:not(.actions-column) {
    padding-right: 0;
  }

  .admins-table td.actions-column {
    display: block;
    margin-top: 12px;
  }

  .admins-table td[data-label="Name"]::before { content: "Name"; }
  .admins-table td[data-label="Role"]::before { content: "Role"; }
  .admins-table td[data-label="Contact Number"]::before { content: "Contact"; }
  .admins-table td[data-label="Address"]::before { content: "Address"; }
  .admins-table td[data-label="Created"]::before { content: "Created"; }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-view,
  .btn-edit,
  .btn-delete {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    touch-action: manipulation;
  }

  .btn-view svg,
  .btn-edit svg,
  .btn-delete svg {
    width: 18px;
    height: 18px;
  }

  /* Modal Adjustments */
  .modal-overlay {
    padding: 12px;
    align-items: flex-start;
  }

  .modal-container {
    width: 100%;
    max-height: 90vh;
    border-radius: 8px;
    margin-top: 10vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .modal-content {
    padding: 20px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .detail-label {
    width: auto;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .detail-value {
    font-size: 0.95rem;
    width: 100%;
  }

  .edit-form {
    gap: 16px;
  }

  .form-group label {
    font-size: 0.95rem;
  }

  .form-input {
    font-size: 0.95rem;
  }

  .delete-modal {
    max-width: none;
  }

  .delete-warning {
    padding: 0;
  }

  .delete-warning p {
    font-size: 1rem;
    line-height: 1.5;
  }

  .warning-text {
    font-size: 0.9rem;
  }

  .modal-actions {
    flex-direction: row;
    gap: 12px;
    padding: 0 0 20px;
  }

  .btn-cancel,
  .btn-confirm-delete,
  .btn-save {
    padding: 12px 20px;
    font-size: 0.95rem;
    flex: 1;
  }

  /* Toast Adjustments */
  .toast-container {
    bottom: 16px;
    right: 16px;
    left: 16px;
    display: flex;
    justify-content: center;
  }

  .toast-message {
    max-width: 90%;
    font-size: 0.95rem;
    padding: 12px 20px;
  }

  /* Loading and Empty States */
  .loading-container, .empty-container, .error-container {
    min-height: 250px;
    padding: 0 16px;
  }

  .loading-spinner p,
  .empty-message p,
  .error-message p {
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .modal-close {
    padding: 6px;
  }

  .modal-close svg {
    width: 20px;
    height: 20px;
  }
}
</style>
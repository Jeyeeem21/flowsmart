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
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in filteredAdmins" :key="admin.id">
            <td>{{ admin.fullName || 'Not provided' }}</td>
            <td>{{ admin.role || 'Standard Admin' }}</td>
            <td>{{ admin.contactNumber || 'Not provided' }}</td>
            <td>{{ formatDate(admin.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-view" @click="viewAdmin(admin)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button class="btn-edit" @click="editAdmin(admin)">
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
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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
      showDeleteModal: false,
      selectedAdmin: {},
      isDeleting: false,
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
          (admin.role && admin.role.toLowerCase().includes(query))
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
    
    editAdmin(admin) {
      // Store the admin data in localStorage for the edit page
      localStorage.setItem('editingAdmin', JSON.stringify(admin));
      this.router.push(`/admin/edit/${admin.id}`);
    },
    
    confirmDelete(admin) {
      this.selectedAdmin = { ...admin };
      this.showDeleteModal = true;
    },
    
    async deleteAdmin() {
      this.isDeleting = true;
      
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, 'admins', this.selectedAdmin.id));
        
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
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 25px;
}

.admin-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-container {
  position: relative;
  max-width: 400px;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #666;
}

.spinner {
  animation: spin 1s linear infinite;
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
  gap: 15px;
  color: #f44336;
  text-align: center;
  max-width: 400px;
}

.btn-retry {
  padding: 10px 20px;
  background-color: #f5f5f5;
  color: #2c3e50;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #666;
  text-align: center;
  max-width: 400px;
}

/* Admins Table */
.admins-table-container {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.admins-table {
  width: 100%;
  border-collapse: collapse;
}

.admins-table th,
.admins-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.admins-table th {
  background-color: #f9f9f9;
  color: #2c3e50;
  font-weight: 500;
  white-space: nowrap;
}

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
  width: 30px;
  height: 30px;
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
  background-color: #e8f5e9;
  color: #4caf50;
}

.btn-edit:hover {
  background-color: #c8e6c9;
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
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
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

.admin-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-label {
  font-weight: 500;
  color: #2c3e50;
  min-width: 120px;
}

.detail-value {
  color: #666;
  flex: 1;
}

/* Delete Modal */
.delete-modal {
  max-width: 450px;
}

.delete-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  text-align: center;
  margin-bottom: 20px;
}

.warning-text {
  color: #f44336;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 20px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
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
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-confirm-delete:hover {
  background-color: #e53935;
}

.btn-confirm-delete:disabled {
  background-color: #ef9a9a;
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

.toast-success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #4caf50;
}

.toast-error {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #f44336;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .admin-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    max-width: none;
  }
  
  .btn-add {
    width: 100%;
    justify-content: center;
  }
  
  .modal-container {
    width: 95%;
    margin: 0 10px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 5px;
  }
  
  .detail-label {
    min-width: auto;
  }
}
</style>
<template>
  <div class="device-list">
    <h1>Device List</h1>
    
    <div class="controls">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by device ID, resident name, or address..." 
          class="search-input"
          @input="filterDevices"
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
        Register New Device
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
        <p>Loading devices...</p>
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
      <button class="btn-retry" @click="loadDevices">Retry</button>
    </div>
    
    <!-- Empty State -->
    <div class="empty-container" v-if="!isLoading && !error && filteredDevices.length === 0">
      <div class="empty-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y6="6" width="20" height="12" rx="2"></rect>
          <path d="M6 12h12"></path>
          <path d="M8 12v4"></path>
          <path d="M16 12v4"></path>
          <path d="M12 12v4"></path>
        </svg>
        <p v-if="searchQuery">No devices found matching "{{ searchQuery }}"</p>
        <p v-else>No devices found. Click "Register New Device" to add one.</p>
      </div>
    </div>
    
    <!-- Devices List (Mobile Card View / Desktop Table) -->
    <div class="devices-container" v-if="!isLoading && !error && filteredDevices.length > 0">
      <!-- Mobile Card View -->
      <div class="devices-card-view" v-if="isMobile">
        <div class="device-card" v-for="device in filteredDevices" :key="device.deviceId">
          <div class="device-card-header">
            <span class="device-id">{{ device.deviceId }}</span>
            <span class="status-badge" :class="getStatusClass(device.status)">
              {{ device.status }}
            </span>
          </div>
          <div class="device-card-body">
            <p><strong>Resident:</strong> {{ device.residentName }}</p>
            <p><strong>Address:</strong> {{ device.address }}</p>
            <p><strong>Install Date:</strong> {{ formatDate(device.installDate) }}</p>
          </div>
          <div class="device-card-actions">
            <button class="btn-view" @click="viewDevice(device)">View</button>
            <button class="btn-unassign" @click="unassignDevice(device)" v-if="device.status !== 'unregistered'">Unassign</button>
          </div>
        </div>
      </div>
      
      <!-- Desktop Table View -->
      <div class="devices-table-container" v-else>
        <table class="devices-table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Resident</th>
              <th>Address</th>
              <th>Installation Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="device in filteredDevices" :key="device.deviceId">
              <td>{{ device.deviceId }}</td>
              <td>{{ device.residentName }}</td>
              <td>{{ device.address }}</td>
              <td>{{ formatDate(device.installDate) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(device.status)">
                  {{ device.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="viewDevice(device)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button class="btn-unassign" @click="unassignDevice(device)" v-if="device.status !== 'unregistered'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="18" y1="8" x2="23" y2="13"></line>
                      <line x1="23" y1="8" x2="18" y2="13"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Device Details Modal -->
    <div class="modal-overlay" v-if="showViewModal" @click="showViewModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Device Details</h2>
          <button class="modal-close" @click="showViewModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="device-details">
            <div class="detail-section">
              <h3>Device Information</h3>
              <div class="detail-row">
                <span class="detail-label">Device ID:</span>
                <span class="detail-value">{{ selectedDevice.deviceId }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                  <span class="status-badge" :class="getStatusClass(selectedDevice.status)">
                    {{ selectedDevice.status }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Initial Reading:</span>
                <span class="detail-value">{{ selectedDevice.initialReading || 'N/A' }} cubic</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h3>Installation Information</h3>
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">{{ selectedDevice.address || 'N/A' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Installation Date:</span>
                <span class="detail-value">{{ formatDate(selectedDevice.installDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Date:</span>
                <span class="detail-value">{{ formatDate(selectedDevice.registrationDate) }}</span>
              </div>
              <div class="detail-row" v-if="selectedDevice.notes">
                <span class="detail-label">Notes:</span>
                <span class="detail-value">{{ selectedDevice.notes }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h3>Resident Information</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedDevice.residentName || 'Not assigned' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Account Number:</span>
                <span class="detail-value">{{ selectedDevice.accountNumber || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

export default {
  name: 'DeviceList',
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      devices: [],
      filteredDevices: [],
      searchQuery: '',
      isLoading: true,
      error: null,
      showViewModal: false,
      selectedDevice: {},
      sensorData: {},
      isMobile: window.innerWidth <= 768
    };
  },
  mounted() {
    this.loadDevices();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    async loadDevices() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const db = getFirestore();
        
        // Load sensor data
        const sensorDataCollection = collection(db, 'SensorData');
        const sensorSnapshot = await getDocs(sensorDataCollection);
        
        this.sensorData = {};
        sensorSnapshot.forEach(doc => {
          const data = doc.data();
          if (data && data.id) {
            this.sensorData[data.id] = { ...data, docId: doc.id };
          }
        });
        
        // Load registered devices
        const devicesCollection = collection(db, 'devices');
        const devicesSnapshot = await getDocs(devicesCollection);
        
        const registeredDevices = devicesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        const allDevices = [];
        
        // Add registered devices
        registeredDevices.forEach(device => {
          allDevices.push(device);
        });
        
        // Add unregistered devices from sensor data
        Object.keys(this.sensorData).forEach(deviceId => {
          if (!registeredDevices.some(d => d.deviceId === deviceId)) {
            allDevices.push({
              deviceId: deviceId,
              status: 'unregistered',
              residentName: 'Not assigned',
              address: 'Not assigned',
              installDate: null,
              registrationDate: null,
              sensorData: this.sensorData[deviceId]
            });
          }
        });
        
        this.devices = allDevices;
        this.filteredDevices = [...allDevices];
      } catch (error) {
        console.error('Error loading devices:', error);
        this.error = 'Failed to load devices: ' + error.message;
      } finally {
        this.isLoading = false;
      }
    },
    
    filterDevices() {
      if (!this.searchQuery.trim()) {
        this.filteredDevices = [...this.devices];
        return;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredDevices = this.devices.filter(device => {
        return (
          (device.deviceId && device.deviceId.toLowerCase().includes(query)) ||
          (device.residentName && device.residentName.toLowerCase().includes(query)) ||
          (device.address && device.address.toLowerCase().includes(query))
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
          day: 'numeric'
        }).format(date);
      } catch (error) {
        return dateString;
      }
    },
    
    getStatusClass(status) {
      if (!status) return '';
      
      switch (status.toLowerCase()) {
        case 'active': return 'status-active';
        case 'inactive': return 'status-inactive';
        case 'maintenance': return 'status-maintenance';
        case 'error': return 'status-error';
        case 'unregistered': return 'status-unregistered';
        default: return '';
      }
    },
    
    viewDevice(device) {
      this.selectedDevice = { ...device };
      this.showViewModal = true;
    },
    
    navigateToRegister() {
      this.router.push('/device/register');
    },
    
    async unassignDevice(device) {
      if (confirm(`Are you sure you want to unassign device ${device.deviceId}?`)) {
        try {
          this.isLoading = true;
          const db = getFirestore();
          const deviceRef = doc(db, 'devices', device.id);
          
          // Update device to unassigned state
          await updateDoc(deviceRef, {
            residentName: 'Not assigned',
            accountNumber: '',
            address: 'Not assigned',
            status: 'unregistered',
            residentId: '',
            registrationDate: null
          });
          
          // Update resident to remove device assignment
          if (device.residentId) {
            const residentRef = doc(db, 'users', device.residentId);
            await updateDoc(residentRef, {
              deviceId: '',
              accountNumber: ''
            });
          }
          
          // Update local data
          const deviceIndex = this.devices.findIndex(d => d.id === device.id);
          if (deviceIndex !== -1) {
            this.devices[deviceIndex] = {
              ...this.devices[deviceIndex],
              residentName: 'Not assigned',
              accountNumber: '',
              address: 'Not assigned',
              status: 'unregistered',
              residentId: '',
              registrationDate: null
            };
            this.filterDevices();
          }
        } catch (error) {
          console.error('Error unassigning device:', error);
          this.error = 'Failed to unassign device: ' + error.message;
        } finally {
          this.isLoading = false;
        }
      }
    },
    
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    }
  }
};
</script>

<style scoped>
.device-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 1.8rem;
}

.controls {
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

/* Mobile Card View */
.devices-card-view {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.device-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.device-id {
  font-weight: 500;
  color: #2c3e50;
}

.device-card-body {
  margin-bottom: 15px;
}

.device-card-body p {
  margin: 5px 0;
  color: #666;
}

.device-card-body strong {
  color: #2c3e50;
}

.device-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Desktop Table View */
.devices-table-container {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.devices-table {
  width: 100%;
  border-collapse: collapse;
}

.devices-table th,
.devices-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.devices-table th {
  background-color: #f9f9f9;
  color: #2c3e50;
  font-weight: 500;
  white-space: nowrap;
}

.devices-table tr:last-child td {
  border-bottom: none;
}

.devices-table tr:hover {
  background-color: #f5f5f5;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background-color: #f5f5f5;
  color: #757575;
}

.status-maintenance {
  background-color: #fff8e1;
  color: #ff8f00;
}

.status-error {
  background-color: #ffebee;
  color: #c62828;
}

.status-unregistered {
  background-color: #e8eaf6;
  color: #3949ab;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-view,
.btn-unassign {
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

.device-card-actions .btn-view,
.device-card-actions .btn-unassign {
  width: auto;
  padding: 8px 12px;
  font-size: 0.9rem;
}

.btn-view {
  background-color: #e3f2fd;
  color: #2196f3;
}

.btn-view:hover {
  background-color: #bbdefb;
}

.btn-unassign {
  background-color: #f5f5f5;
  color: #757575;
}

.btn-unassign:hover {
  background-color: #e0e0e0;
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
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
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

.device-details {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.detail-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-section h3 {
  color: #4caf50;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 500;
  color: #2c3e50;
  width: 140px;
  flex-shrink: 0;
}

.detail-value {
  color: #666;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .controls {
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
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    width: auto;
    margin-bottom: 5px;
  }
  
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
}
</style>
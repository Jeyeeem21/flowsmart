<template>
  <div class="device-registration">
    <h2>Device Registration</h2>
    <div class="form-container">
      <form @submit.prevent="registerDevice">
        <div class="form-grid">
          <!-- Device Information -->
          <div class="form-section">
            <h3>Device Information</h3>
            <div class="form-group">
              <label for="deviceId">Device ID</label>
              <select 
                id="deviceId" 
                v-model="device.deviceId" 
                required
                class="form-select"
                @change="updateInitialReading"
              >
                <option value="" disabled>Select a device ID</option>
                <option v-for="device in availableDevices" :key="device.id" :value="device.id">
                  {{ device.id }}
                </option>
              </select>
              <div class="form-hint" v-if="isLoadingDevices">
                <div class="loading-spinner small"></div>
                Loading device IDs...
              </div>
              <div class="form-error" v-if="deviceError">
                {{ deviceError }}
              </div>
              <div class="form-hint" v-if="!isLoadingDevices && availableDevices.length === 0 && !deviceError">
                No available device IDs found
              </div>
              <div class="form-hint" v-if="!isLoadingDevices && availableDevices.length > 0">
                {{ availableDevices.length }} device(s) available
              </div>
            </div>
          </div>
          
          <!-- Installation Information -->
          <div class="form-section">
            <h3>Installation Information</h3>
            <div class="form-group">
              <label for="address">Address</label>
              <input 
                type="text" 
                id="address" 
                v-model="device.address" 
                placeholder="Enter installation address"
                required
              />
            </div>
            <div class="form-group">
              <label for="installDate">Installation Date</label>
              <input 
                type="date" 
                id="installDate" 
                v-model="device.installDate"
                required
              />
            </div>
            <div class="form-group">
              <label for="initialReading">Initial Reading (cubic meters)</label>
              <input 
                type="number" 
                id="initialReading" 
                v-model.number="device.initialReading" 
                placeholder="0.00"
                step="0.001"
                min="0"
                required
              />
              <div class="form-hint" v-if="device.deviceId">
                Auto-calculated from SensorData ({{ totalLiters }} liters)
              </div>
            </div>
            <div class="form-group">
              <label for="notes">Installation Notes</label>
              <textarea 
                id="notes" 
                v-model="device.notes" 
                placeholder="Enter any additional notes"
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <!-- Resident Information -->
          <div class="form-section">
            <h3>Resident Information</h3>
            <div class="form-group">
              <label for="residentId">Resident Name</label>
              <select 
                id="residentId" 
                v-model="selectedResidentId" 
                required
                class="form-select"
                @change="handleResidentChange"
              >
                <option value="" disabled>Select a resident</option>
                <option 
                  v-for="resident in residents" 
                  :key="resident.id" 
                  :value="resident.id"
                  :style="{ color: resident.hasDevice ? '#4caf50' : '#2c3e50' }"
                >
                  {{ resident.fullName }}
                </option>
              </select>
              <div class="form-hint" v-if="isLoadingResidents">
                <div class="loading-spinner small"></div>
                Loading residents...
              </div>
              <div class="form-error" v-if="residentError">
                {{ residentError }}
              </div>
              <div class="form-hint">
                Green names indicate residents who already own a device
              </div>
            </div>
            <div class="form-group">
              <label for="residentContact">Contact Number</label>
              <input 
                type="tel" 
                id="residentContact" 
                v-model="device.residentContact" 
                placeholder="Contact will appear when resident is selected"
                readonly
              />
            </div>
            <div class="form-group">
              <label for="residentEmail">Email Address</label>
              <input 
                type="email" 
                id="residentEmail" 
                v-model="device.residentEmail" 
                placeholder="Email will appear when resident is selected"
                readonly
              />
            </div>
            <div class="form-group">
              <label for="accountNumber">Account Number</label>
              <input 
                type="text" 
                id="accountNumber" 
                v-model="device.accountNumber" 
                placeholder="Auto-generated"
                readonly
              />
            </div>
          </div>
        </div>
        
        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="resetForm">Reset</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting">
              <div class="loading-spinner white small"></div>
              Registering...
            </span>
            <span v-else>Register Device</span>
          </button>
        </div>
      </form>
    </div>
    
    <!-- Success Message -->
    <div class="success-message" v-if="showSuccess">
      <div class="success-content">
        <div class="success-icon">✓</div>
        <h3>Device Registered Successfully!</h3>
        <p>Device ID: {{ lastRegisteredDevice.deviceId }}</p>
        <p>Resident: {{ lastRegisteredDevice.residentName }}</p>
        <p>Account Number: {{ lastRegisteredDevice.accountNumber }}</p>
        <button class="btn-primary" @click="showSuccess = false">Close</button>
      </div>
    </div>
    
    <!-- Debug Info (Remove in production) -->
    <div class="debug-info" v-if="showDebug">
      <h4>Debug Information</h4>
      <p>Available Device IDs: {{ availableDevices.map(d => d.id).join(', ') || 'None' }}</p>
      <p>Device Error: {{ deviceError || 'None' }}</p>
      <p>Total Liters: {{ totalLiters || 'N/A' }}</p>
      <p>Residents: {{ residents.map(r => `${r.fullName} (hasDevice: ${r.hasDevice})`).join(', ') || 'None' }}</p>
      <button @click="showDebug = false" class="btn-secondary">Hide Debug</button>
    </div>
  </div>
</template>

<script>
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default {
  name: 'DeviceRegistration',
  data() {
    return {
      device: {
        deviceId: '',
        address: '',
        installDate: new Date().toISOString().split('T')[0],
        initialReading: 0,
        notes: '',
        residentName: '',
        residentContact: '',
        residentEmail: '',
        accountNumber: '',
        residentId: ''
      },
      availableDevices: [],
      residents: [],
      selectedResidentId: '',
      showSuccess: false,
      lastRegisteredDevice: {},
      isLoadingDevices: false,
      isLoadingResidents: false,
      deviceError: null,
      residentError: null,
      isSubmitting: false,
      showDebug: false,
      totalLiters: 0
    };
  },
  mounted() {
    this.fetchDeviceIds();
    this.fetchResidents();
    
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        this.showDebug = !this.showDebug;
      }
    });
  },
  methods: {
    async fetchDeviceIds() {
      this.isLoadingDevices = true;
      this.deviceError = null;
      this.availableDevices = [];
      
      try {
        const db = getFirestore();
        
        // Get all registered devices
        const devicesCollection = collection(db, 'devices');
        const devicesSnapshot = await getDocs(devicesCollection);
        
        // Filter devices with status 'unregistered'
        const unregisteredDevices = devicesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(device => device.status === 'unregistered');
        
        // Get all device IDs from SensorData
        const sensorDataCollection = collection(db, 'SensorData');
        const sensorDataSnapshot = await getDocs(sensorDataCollection);
        
        if (sensorDataSnapshot.empty && unregisteredDevices.length === 0) {
          console.log('No devices available');
          this.deviceError = "No device IDs found in the database";
          return;
        }
        
        // Extract devices from SensorData
        const sensorDevices = [];
        sensorDataSnapshot.forEach(doc => {
          const data = doc.data();
          if (data && data.id) {
            sensorDevices.push({
              id: data.id,
              liters: data.liters || 0,
              tds_ppm: data.tds_ppm || 0,
              timestamp: data.timestamp || '',
              us_cm: data.us_cm || 0
            });
          }
        });
        
        // Combine unregistered devices and SensorData devices, excluding registered devices
        const registeredDeviceIds = devicesSnapshot.docs
          .map(doc => doc.data().deviceId)
          .filter(id => !unregisteredDevices.some(d => d.deviceId === id));
        
        const allDevices = [
          ...unregisteredDevices,
          ...sensorDevices.filter(device => !registeredDeviceIds.includes(device.id))
        ];
        
        // Make device IDs distinct
        const distinctDevicesMap = new Map();
        allDevices.forEach(device => {
          if (!distinctDevicesMap.has(device.id) || 
              (device.timestamp && distinctDevicesMap.get(device.id).timestamp && 
               new Date(device.timestamp) > new Date(distinctDevicesMap.get(device.id).timestamp))) {
            distinctDevicesMap.set(device.id, device);
          }
        });
        
        const availableDevices = Array.from(distinctDevicesMap.values());
        
        console.log('Available distinct devices:', availableDevices);
        
        if (availableDevices.length === 0) {
          this.deviceError = "No unregistered devices available";
        } else {
          this.availableDevices = availableDevices;
        }
      } catch (error) {
        console.error('Error fetching device IDs:', error);
        this.deviceError = "Failed to load device IDs: " + error.message;
      } finally {
        this.isLoadingDevices = false;
      }
    },
    
    async updateInitialReading() {
      if (!this.device.deviceId) {
        this.device.initialReading = 0;
        this.totalLiters = 0;
        return;
      }
      
      try {
        const db = getFirestore();
        const sensorDataCollection = collection(db, 'SensorData');
        const sensorDataSnapshot = await getDocs(sensorDataCollection);
        
        // Sum liters for the selected device ID
        let totalLiters = 0;
        sensorDataSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.id === this.device.deviceId && data.liters) {
            totalLiters += parseFloat(data.liters);
          }
        });
        
        // Convert liters to cubic meters (1 cubic meter = 1000 liters)
        this.totalLiters = totalLiters;
        this.device.initialReading = (totalLiters / 1000).toFixed(3);
      } catch (error) {
        console.error('Error fetching sensor data for initial reading:', error);
        this.deviceError = "Failed to load sensor data: " + error.message;
        this.device.initialReading = 0;
        this.totalLiters = 0;
      }
    },
    
    async fetchResidents() {
      this.isLoadingResidents = true;
      this.residentError = null;
      
      try {
        const db = getFirestore();
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        
        this.residents = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            hasDevice: !!doc.data().deviceId // Check if resident has a deviceId
          }))
          .filter(user => user.role === "resident");
        
        if (this.residents.length === 0) {
          this.residentError = "No residents found in the database";
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
        this.residentError = "Failed to load residents: " + error.message;
      } finally {
        this.isLoadingResidents = false;
      }
    },
    
    async handleResidentChange() {
      if (!this.selectedResidentId) {
        return;
      }
      
      try {
        const db = getFirestore();
        const residentDoc = await getDoc(doc(db, 'users', this.selectedResidentId));
        
        if (residentDoc.exists()) {
          const residentData = residentDoc.data();
          
          this.device.residentName = residentData.fullName || '';
          this.device.residentContact = residentData.contactNumber || '';
          this.device.residentEmail = residentData.email || '';
          this.device.address = residentData.address || this.device.address;
          this.device.residentId = this.selectedResidentId;
          
          if (!residentData.accountNumber) {
            this.device.accountNumber = `ACCT-${Math.floor(100000 + Math.random() * 900000)}`;
          } else {
            this.device.accountNumber = residentData.accountNumber;
          }
        }
      } catch (error) {
        console.error('Error fetching resident details:', error);
      }
    },
    
    async registerDevice() {
      if (!this.device.deviceId || !this.selectedResidentId) {
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        const db = getFirestore();
        
        const deviceData = {
          deviceId: this.device.deviceId,
          address: this.device.address,
          installDate: this.device.installDate,
          initialReading: parseFloat(this.device.initialReading),
          notes: this.device.notes,
          residentId: this.selectedResidentId,
          residentName: this.device.residentName,
          accountNumber: this.device.accountNumber,
          registrationDate: new Date().toISOString(),
          status: 'active'
        };
        
        await setDoc(doc(db, 'devices', this.device.deviceId), deviceData);
        
        await updateDoc(doc(db, 'users', this.selectedResidentId), {
          deviceId: this.device.deviceId,
          accountNumber: this.device.accountNumber
        });
        
        this.lastRegisteredDevice = { ...this.device };
        this.showSuccess = true;
        this.resetForm();
        this.fetchDeviceIds();
      } catch (error) {
        console.error('Error registering device:', error);
        alert('Failed to register device: ' + error.message);
      } finally {
        this.isSubmitting = false;
      }
    },
    
    resetForm() {
      this.device = {
        deviceId: '',
        address: '',
        installDate: new Date().toISOString().split('T')[0],
        initialReading: 0,
        notes: '',
        residentName: '',
        residentContact: '',
        residentEmail: '',
        accountNumber: '',
        residentId: ''
      };
      
      this.selectedResidentId = '';
      this.totalLiters = 0;
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}
.device-registration {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

h3 {
  color: #4caf50;
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 15px;
}

.form-container {
  margin-top: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.form-section {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2c3e50;
}

input, select, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

input:focus, select:focus, textarea:focus {
  border-color: #4caf50;
  outline: none;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 30px;
}

.form-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.form-error {
  margin-top: 5px;
  font-size: 12px;
  color: #f44336;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3d9140;
}

.btn-primary:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #2c3e50;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.success-message {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.success-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin: 0 auto 20px;
}

.success-content h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.success-content p {
  margin-bottom: 10px;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.loading-spinner.white {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}

/* Debug info */
.debug-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.debug-info h4 {
  margin-top: 0;
  color: #2c3e50;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive styles */
@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-section:last-child {
    grid-column: span 2;
  }
  
  h2 {
    font-size: 1.75rem;
  }
  
  h3 {
    font-size: 1.2rem;
  }
}

@media (min-width: 1024px) {
  .form-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .form-section:last-child {
    grid-column: auto;
  }
  
  h2 {
    font-size: 2rem;
  }
}
</style>
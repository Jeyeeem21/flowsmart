<template>
  <div class="billing-view-container">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <h1 class="billing-title">Bills History</h1>

    <!-- Filters -->
    <div class="filters">
      <!-- Search Bar -->
      <div class="search-bar" v-if="isAdmin">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by Device ID or User ID"
          aria-label="Search bills by device ID or user ID"
          class="search-input"
        />
        <i class="fas fa-search search-icon"></i>
      </div>

      <!-- Month Selector -->
      <div class="month-selector">
        <select
          v-model="selectedMonthYear"
          @change="fetchBillingData"
          aria-label="Select billing month and year"
          class="month-select"
        >
          <option v-for="monthYear in availableMonths" :key="monthYear" :value="monthYear">
            {{ monthYear }}
          </option>
        </select>
      </div>

      <!-- Refresh Bills Button (Admin Only) -->
      <div v-if="isAdmin" class="refresh-button-container">
        <button
          class="action-button refresh-button"
          @click="refreshBills"
          aria-label="Refresh billing data"
        >
          <i class="fas fa-sync-alt"></i> Refresh Bills
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading" role="status">
      Loading billing data...
    </div>

    <!-- Billing Content -->
    <div v-else class="billing-content">
      <!-- Global Print Button -->
      <div class="print-button-container">
        <button
          class="action-button print-button"
          @click="printBillingData()"
          aria-label="Print all billing data"
        >
          <i class="fas fa-print"></i> Print All
        </button>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="billing-table">
          <thead>
            <tr>
              <th>Month</th>
              <th v-if="isAdmin">Device ID</th>
              <th>Liters</th>
              <th>Cubic</th>
              <th>Amount(₱)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(bill, index) in paginatedData" :key="index" :class="{ 'next-month-bill': bill.isNextMonth }">
              <td>
                <span v-if="isAdmin" class="month-admin">
                  {{ bill.month.split(' ')[0] }}<br>{{ bill.month.split(' ')[1] }}
                  <span v-if="bill.isNextMonth" class="next-month-indicator">(Next Month)</span>
                </span>
                <span v-else>
                  {{ bill.month }}
                  <span v-if="bill.isNextMonth" class="next-month-indicator">(Next Month)</span>
                </span>
              </td>
              <td v-if="isAdmin">{{ bill.deviceId }}</td>
              <td>{{ bill.totalLiters.toFixed(2) }}</td>
              <td>{{ bill.cubicMeters.toFixed(2) }}</td>
              <td>
                <span v-if="bill.totalLiters === 0" class="no-consumption">No Consumption</span>
                <span v-else>₱ {{ bill.amount.toFixed(2) }}</span>
              </td>
              <td>
                <span
                  v-if="!isAdmin"
                  :class="{
                    'status-paid': bill.status === 'Paid',
                    'status-pending': bill.status === 'Pending',
                    'status-due': bill.status === 'Due'
                  }"
                >
                  {{ bill.status }}
                </span>
                <select
                  v-else
                  v-model="bill.status"
                  @change="updateBillStatus(bill.id, bill.status)"
                  class="status-select"
                  :aria-label="`Update status for bill ${bill.month}`"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Due">Due</option>
                </select>
              </td>
              <td>
                <button
                  class="action-button print-button"
                  @click="printBillingData(bill)"
                  :aria-label="`Print bill for ${bill.month}`"
                >
                  <i class="fas fa-print"></i> Print
                </button>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="isAdmin ? 7 : 6" class="no-data">No billing data available.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-controls" role="navigation" aria-label="Pagination">
        <div class="pagination-toggle">
          <button
            class="pagination-button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            aria-label="Previous page"
          >
            <i class="fas fa-chevron-left"></i> Previous
          </button>
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="page-number"
              :class="{ active: currentPage === page }"
              @click="currentPage = page"
              :aria-label="`Go to page ${page}`"
              :aria-current="currentPage === page ? 'page' : null"
            >
              {{ page }}
            </button>
            <span v-if="showEllipsis" class="ellipsis">...</span>
          </div>
          <button
            class="pagination-button"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
            aria-label="Next page"
            title="Go to the next page"
          >
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <div v-if="totalPages > 1" class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, getDocs, setDoc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export default {
  name: 'BillingView',
  setup() {
    const billingData = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const isAdmin = ref(false);
    const userDeviceId = ref(null);
    const userId = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 10;
    const saving = ref(false);
    const settings = ref({});
    const searchQuery = ref('');
    const months = ref([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]);
    const monitoringInterval = ref(null);
    const lastProcessedTimestamp = ref(null);
    const forceUpdate = ref(0);
    // Add a map to track status changes
    const statusChangeMap = ref({});

    // Add watcher for billing data changes
    watch(billingData, (newData) => {
      console.log('Billing data changed:', newData);
      forceUpdate.value++; // Force component to re-render
    }, { deep: true });

    // Get current month and year
    const getCurrentMonthYear = () => {
      const now = new Date();
      return `${months.value[now.getMonth()]} ${now.getFullYear()}`;
    };

    // Get next month and year
    const getNextMonthYear = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return `${months.value[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
    };

    const selectedMonthYear = ref(getCurrentMonthYear());
    const availableMonths = ref([]);

    // Generate available months
    const generateAvailableMonths = async () => {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const monthYears = [];

        // Get all billing documents
        const billingQuery = query(collection(db, 'Billing'));
        const billingSnapshot = await getDocs(billingQuery);
        
        // Create a Set of unique month-years from existing bills
        const existingMonths = new Set();
        billingSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.month) {
            existingMonths.add(data.month);
          }
        });

        // Convert Set to Array and sort chronologically
        const sortedMonths = Array.from(existingMonths).sort((a, b) => {
          const [monthA, yearA] = a.split(' ');
          const [monthB, yearB] = b.split(' ');
          const dateA = new Date(yearA, months.value.indexOf(monthA));
          const dateB = new Date(yearB, months.value.indexOf(monthB));
          return dateB - dateA; // Sort in descending order (newest first)
        });

        availableMonths.value = sortedMonths;
        console.log('Available months with data:', availableMonths.value);
      } catch (err) {
        console.error('Error generating available months:', err);
        error.value = `Failed to load available months: ${err.message}.`;
      }
    };

    // Fetch settings from Settings/global
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'Settings', 'global'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          settings.value = {
            billingRate: data.billingRate || 110,
            monthlyQuotaCubicMeters: data.monthlyQuotaCubicMeters || 12,
            pricePerCubicMeterAboveQuota: data.pricePerCubicMeterAboveQuota || 25,
            billingCalculationDate: data.billingCalculationDate || 28,
            dueDateDays: data.dueDateDays || 2
          };
          console.log('Fetched settings from Settings/global:', settings.value);
          
          // Restart monitoring with new settings
          await startContinuousMonitoring();
        } else {
          console.warn('Settings/global document not found, using defaults.');
          settings.value = {
            billingRate: 110,
            monthlyQuotaCubicMeters: 12,
            pricePerCubicMeterAboveQuota: 25,
            billingCalculationDate: 28,
            dueDateDays: 2
          };
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        error.value = `Failed to fetch settings: ${err.message}.`;
        settings.value = {
          billingRate: 110,
          monthlyQuotaCubicMeters: 12,
          pricePerCubicMeterAboveQuota: 25,
          billingCalculationDate: 28,
          dueDateDays: 2
        };
      }
    };

    // Calculate due date for a bill
    const calculateDueDate = (monthYear) => {
      const [monthName, year] = monthYear.split(' ');
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(monthName);
      const currentYear = parseInt(year);
      const billingDate = new Date(currentYear, monthIndex, settings.value.billingCalculationDate);
      const dueDate = new Date(billingDate);
      dueDate.setDate(billingDate.getDate() + settings.value.dueDateDays);
      return dueDate;
    };

    // Fetch user data and determine role
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'Please sign in to view billing history.';
          return;
        }
        userId.value = user.uid;
        await fetchSettings();
        generateAvailableMonths();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isAdmin.value = userData.role === 'admin';
          userDeviceId.value = userData.deviceId;
          console.log('User Data:', { userId: userId.value, isAdmin: isAdmin.value, deviceId: userDeviceId.value });
          await fetchBillingData();
        } else {
          error.value = 'User profile not found.';
        }
      } catch (err) {
        error.value = `Failed to load user data: ${err.message}.`;
        console.error('Error fetching user data:', err);
      } finally {
        loading.value = false;
      }
    };

    // Get the previous month's name and year
    const getPreviousMonthYear = (monthYear) => {
      const [monthName, year] = monthYear.split(' ');
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = months.indexOf(monthName);
      const currentYear = parseInt(year);
      if (monthIndex === 0) {
        return `${months[11]} ${currentYear - 1}`;
      }
      return `${months[monthIndex - 1]} ${currentYear}`;
    };

    // Fetch sensor data for the billing period
    const fetchSensorData = async (monthYear) => {
      try {
        const [monthName, year] = monthYear.split(' ');
        const monthIndex = months.value.indexOf(monthName);
        const currentYear = parseInt(year);

        // For June 2025, we need to include data from May 16, 2025 onwards
        const prevMonthIndex = (monthIndex - 1 + 12) % 12;
        const prevYear = monthIndex === 0 ? currentYear - 1 : currentYear;
        
        // Set startDate to the billing calculation date of the previous month
        const startDate = new Date(prevYear, prevMonthIndex, settings.value.billingCalculationDate, 0, 0, 0, 0);
        // Set endDate to the billing calculation date of the current month
        const endDate = new Date(currentYear, monthIndex, settings.value.billingCalculationDate, 23, 59, 59, 999);

        console.log('Date ranges for sensor data:', {
          monthYear,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          currentYear,
          monthIndex,
          billingCalculationDate: settings.value.billingCalculationDate
        });

        const q = query(collection(db, 'SensorData'));
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.docs.length} total SensorData documents`);

        const usageByDevice = {};
        querySnapshot.forEach(doc => {
          const data = doc.data();
          console.log('Processing sensor data:', {
            id: data.id,
            liters: data.liters,
            timestamp: data.timestamp,
            rawData: data
          });

          let timestamp;
          try {
            if (data.timestamp instanceof Timestamp) {
              timestamp = data.timestamp.toDate();
            } else if (typeof data.timestamp === 'string') {
              timestamp = new Date(data.timestamp);
            } else {
              console.warn(`Invalid timestamp format for doc ${doc.id}:`, data.timestamp);
              return;
            }
          } catch (err) {
            console.error(`Error parsing timestamp for doc ${doc.id}:`, err);
            return;
          }

          // Validate the data format
          if (!data.id || typeof data.liters !== 'number') {
            console.warn(`Invalid data format for doc ${doc.id}:`, data);
            return;
          }

          const deviceId = data.id;
          const liters = data.liters;

          if (!usageByDevice[deviceId]) {
            usageByDevice[deviceId] = {
              totalLiters: 0,
              pastLiters: 0
            };
          }

          // Check if the data falls within the billing period
          const isInBillingPeriod = timestamp >= startDate && timestamp <= endDate;

          console.log('Date comparison for sensor data:', {
            deviceId,
            timestamp: timestamp.toISOString(),
            isInBillingPeriod,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          });

          if (isInBillingPeriod) {
            usageByDevice[deviceId].totalLiters += liters;
            console.log(`Added ${liters} liters to ${deviceId} for totalLiters (timestamp: ${timestamp.toISOString()})`);
          }

          // For past liters, we need data from the previous billing period
          const prevStartDate = new Date(prevYear, prevMonthIndex - 1, settings.value.billingCalculationDate, 0, 0, 0, 0);
          const prevEndDate = new Date(prevYear, prevMonthIndex, settings.value.billingCalculationDate, 23, 59, 59, 999);
          
          const isInPrevBillingPeriod = timestamp >= prevStartDate && timestamp <= prevEndDate;
          
          if (isInPrevBillingPeriod) {
            usageByDevice[deviceId].pastLiters += liters;
            console.log(`Added ${liters} liters to ${deviceId} for pastLiters (timestamp: ${timestamp.toISOString()})`);
          }
        });

        Object.keys(usageByDevice).forEach(deviceId => {
          const totalLiters = usageByDevice[deviceId].totalLiters;
          const pastLiters = usageByDevice[deviceId].pastLiters;
          const currentCubics = totalLiters / 1000;
          const pastCubics = pastLiters / 1000;
          const cubicConsumed = currentCubics - pastCubics;
          usageByDevice[deviceId] = {
            totalLiters,
            pastLiters,
            currentCubics,
            pastCubics,
            cubicConsumed: cubicConsumed >= 0 ? cubicConsumed : 0
          };
          console.log(`Final calculations for ${deviceId}:`, usageByDevice[deviceId]);
        });

        console.log(`Processed SensorData for ${monthYear}:`, usageByDevice);
        return usageByDevice;
      } catch (err) {
        console.error('Error fetching sensor data:', err);
        error.value = `Failed to fetch sensor data for ${monthYear}: ${err.message}.`;
        return {};
      }
    };

    // Fetch all resident users
    const fetchResidents = async () => {
      try {
        const usersQuery = await getDocs(query(collection(db, 'users'), where('role', '==', 'resident')));
        const residents = [];
        usersQuery.forEach(doc => {
          const userData = doc.data();
          console.log('Resident:', userData);
          if (userData.deviceId && typeof userData.deviceId === 'string') {
            residents.push({
              userId: doc.id,
              deviceId: userData.deviceId,
              accountNumber: userData.accountNumber || 'N/A',
              address: userData.address || 'N/A',
              contactNumber: userData.contactNumber || 'N/A',
              email: userData.email || 'N/A',
              fullName: userData.fullName || 'N/A'
            });
          } else {
            console.warn(`Resident user ${doc.id} has no valid deviceId`, userData);
          }
        });
        console.log('Fetched residents:', residents);
        return residents;
      } catch (err) {
        console.error('Error fetching residents:', err);
        error.value = `Failed to fetch resident data: ${err.message}.`;
        return [];
      }
    };

    // Fetch previous bill for a device
    const fetchPreviousBill = async (deviceId, currentMonthYear) => {
      try {
        const prevMonthYear = getPreviousMonthYear(currentMonthYear);
        const billId = `${deviceId}_${prevMonthYear.replace(' ', '_')}`;
        const billDoc = await getDoc(doc(db, 'Billing', billId));
        if (billDoc.exists()) {
          const billData = billDoc.data();
          console.log(`Previous bill for ${deviceId} in ${prevMonthYear}:`, billData);
          return billData;
        }
        console.log(`No previous bill found for ${deviceId} in ${prevMonthYear}`);
        return null;
      } catch (err) {
        console.error(`Error fetching previous bill for ${deviceId}:`, err);
        return null;
      }
    };

    // Generate or update bills for all residents
    const generateBills = async (forceUpdate = false) => {
      try {
        const monthYear = selectedMonthYear.value;
        console.log(`Starting bill generation for ${monthYear}${forceUpdate ? ' (force update)' : ''}`);
        const residents = await fetchResidents();
        if (residents.length === 0) {
          error.value = 'No residents found.';
          console.warn('No residents found for bill generation');
          return;
        }

        const existingBillsQuery = query(collection(db, 'Billing'), where('month', '==', monthYear));
        const existingBillsSnapshot = await getDocs(existingBillsQuery);
        const existingBills = {};
        existingBillsSnapshot.forEach(doc => {
          existingBills[doc.data().deviceId] = { id: doc.id, ...doc.data() };
        });
        console.log(`Existing bills for ${monthYear}:`, Object.keys(existingBills));

        const usageByDevice = await fetchSensorData(monthYear);
        for (const resident of residents) {
          const deviceId = resident.deviceId;
          const billId = `${deviceId}_${monthYear.replace(' ', '_')}`;
          const existingBill = existingBills[deviceId];

          // Skip if bill exists and not forcing an update
          if (existingBill && !forceUpdate) {
            console.log(`Bill already exists for device ${deviceId} in ${monthYear}, skipping.`);
            continue;
          }

          // Delete existing bill if updating
          if (existingBill && forceUpdate) {
            await deleteDoc(doc(db, 'Billing', billId)).catch(err => console.warn(`Failed to delete bill ${billId}:`, err));
            console.log(`Deleted existing bill ${billId} for update`);
          }

          const previousBill = await fetchPreviousBill(deviceId, monthYear);
          let pastCubics = 0;
          if (previousBill && typeof previousBill.currentCubics === 'number') {
            pastCubics = previousBill.currentCubics;
          }

          const deviceData = usageByDevice[deviceId] || {
            totalLiters: 0,
            pastLiters: 0,
            currentCubics: 0,
            pastCubics: 0,
            cubicConsumed: 0
          };
          const { totalLiters, cubicConsumed } = deviceData;

          let amount = 0;
          let currentCubics = pastCubics;
          let cubicConsumedAdjusted = cubicConsumed;

          if (totalLiters === 0) {
            cubicConsumedAdjusted = 0;
            currentCubics = 0;
            amount = 0;
            console.log(`No consumption for ${deviceId} in ${monthYear}, setting all values to 0`);
          } else {
            currentCubics = pastCubics + cubicConsumed;
            if (cubicConsumed <= settings.value.monthlyQuotaCubicMeters && cubicConsumed >= 0) {
              amount = settings.value.billingRate;
            } else if (cubicConsumed > settings.value.monthlyQuotaCubicMeters) {
              amount = settings.value.billingRate + ((cubicConsumed - settings.value.monthlyQuotaCubicMeters) * settings.value.pricePerCubicMeterAboveQuota);
            } else {
              amount = settings.value.billingRate;
            }
          }

          console.log(`Calculated bill for ${deviceId}:`, {
            totalLiters,
            pastCubics,
            currentCubics,
            cubicConsumed: cubicConsumedAdjusted,
            amount
          });

          // Check if we have a manually set status for this bill
          let billStatus = 'Pending';
          if (existingBill) {
            // Use existing status if available
            billStatus = existingBill.status;
          }
          
          // Check if we have a manually updated status in our map
          if (statusChangeMap.value[billId]) {
            billStatus = statusChangeMap.value[billId];
            console.log(`Using manually set status for ${billId}: ${billStatus}`);
          }

          const billData = {
            deviceId,
            userId: resident.userId,
            month: monthYear,
            cubicMeters: cubicConsumedAdjusted,
            totalLiters,
            pastCubics,
            currentCubics,
            amount,
            status: billStatus,
            accountNumber: resident.accountNumber,
            address: resident.address,
            contactNumber: resident.contactNumber,
            email: resident.email,
            fullName: resident.fullName,
            lastUpdated: new Date().toISOString() // Add lastUpdated
          };

          console.log(`Generating bill ${billId}:`, billData);
          try {
            await setDoc(doc(db, 'Billing', billId), billData);
            console.log(`Bill created/updated: ${billId}`);
            billingData.value = billingData.value.filter(b => b.id !== billId); // Remove old bill
            billingData.value.push({
              id: billId,
              ...billData,
            });
          } catch (writeErr) {
            console.error(`Failed to write bill ${billId}:`, writeErr);
            error.value = `Failed to create bill for ${deviceId}: ${writeErr.message}.`;
          }
        }
        console.log(`Completed bill generation for ${monthYear}`);
      } catch (err) {
        console.error('Error generating bills:', err);
        error.value = `Failed to generate bills: ${err.message}.`;
      }
    };

    // Enhanced function to check and update bill statuses based on due dates
    

    // Fetch billing data for the selected month and update due status
    const fetchBillingData = async () => {
      try {
        loading.value = true;
        console.log(`Fetching billing data for ${selectedMonthYear.value}`);
        billingData.value = [];
        
        // First ensure settings are up to date
        await fetchSettings();
        
        // Check and update due statuses for all bills
        const updatedCount = await checkAndUpdateDueStatuses();
        console.log(`Updated ${updatedCount} bills to Due status`);

        // Always generate bills for the selected month first
        console.log(`Generating bills for ${selectedMonthYear.value}`);
        await generateBills(true); // Force update to ensure latest data is included
        
        // Fetch bills for selected month
        const currentMonthQuery = query(collection(db, 'Billing'), where('month', '==', selectedMonthYear.value));
        const currentMonthSnapshot = await getDocs(currentMonthQuery);

        const billsToUpdate = [];

        // Process bills for selected month
        const processedBills = await Promise.all(
          currentMonthSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            console.log(`Raw Billing data for ${doc.id}:`, data);
            const isValid =
              typeof data.deviceId === 'string' &&
              typeof data.month === 'string' &&
              typeof data.cubicMeters === 'number' && !isNaN(data.cubicMeters) &&
              typeof data.amount === 'number' && !isNaN(data.amount) &&
              typeof data.status === 'string' && ['Pending', 'Paid', 'Due'].includes(data.status) &&
              typeof data.userId === 'string';
            if (!isValid) {
              console.warn(`Invalid billing data for ${doc.id}:`, data);
              return null;
            }

            let updatedStatus = data.status;
            
            // Check if we have a manually set status for this bill
            if (statusChangeMap.value[doc.id]) {
              updatedStatus = statusChangeMap.value[doc.id];
              console.log(`Using manually set status for ${doc.id}: ${updatedStatus}`);
            } else if (data.status === 'Pending') {
              // Only update status to Due if it's currently Pending and past due date
              const dueDate = calculateDueDate(data.month);
              if (new Date() > dueDate) {
                updatedStatus = 'Due';
                billsToUpdate.push({ id: doc.id, status: 'Due' });
              }
            }

            return {
              id: doc.id,
              deviceId: data.deviceId,
              month: data.month,
              cubicMeters: data.cubicMeters,
              totalLiters: data.totalLiters || 0,
              pastCubics: data.pastCubics || 0,
              currentCubics: data.currentCubics || data.cubicMeters || 0,
              amount: data.amount,
              status: updatedStatus,
              userId: data.userId,
              accountNumber: data.accountNumber || 'N/A',
              address: data.address || 'N/A',
              contactNumber: data.contactNumber || 'N/A',
              email: data.email || 'N/A',
              fullName: data.fullName || 'N/A',
              lastUpdated: data.lastUpdated || new Date().toISOString()
            };
          })
        ).then(bills => bills.filter(data => data !== null));

        // Filter bills based on user role
        billingData.value = processedBills.filter(data => isAdmin.value || data.deviceId === userDeviceId.value);

        // Update Firestore for bills that need status change
        for (const bill of billsToUpdate) {
          try {
            // Skip if we have a manually set status
            if (statusChangeMap.value[bill.id]) {
              console.log(`Skipping auto-update for ${bill.id} as it has a manually set status`);
              continue;
            }
            
            const billRef = doc(db, 'Billing', bill.id);
            await updateDoc(billRef, { 
              status: bill.status,
              lastUpdated: new Date().toISOString()
            });
            console.log(`Updated bill status for ${bill.id} to ${bill.status}`);
          } catch (err) {
            console.error(`Failed to update bill ${bill.id} status:`, err);
            error.value = `Failed to update bill status for ${bill.id}: ${err.message}.`;
          }
        }

        console.log(`Fetched billing data for ${selectedMonthYear.value}:`, billingData.value);
        
        // After fetching data, check again for any bills that need status updates
        await checkAndUpdateDueStatuses();
      } catch (err) {
        console.error('Error fetching billing data:', err);
        error.value = `Failed to fetch billing data for ${selectedMonthYear.value}: ${err.message}.`;
      } finally {
        loading.value = false;
      }
    };

    // Add force recalculation function
    const forceRecalculateBills = async () => {
      try {
        loading.value = true;
        console.log('Starting force recalculation of bills...');
        
        // First ensure we have latest settings
        await fetchSettings();
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentMonthYear = `${months.value[currentMonth]} ${currentYear}`;
        const nextMonth = new Date(currentYear, currentMonth + 1, 1);
        const nextMonthYear = `${months.value[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;

        // Save current status values before recalculation
        const currentMonthQuery = query(collection(db, 'Billing'), where('month', '==', currentMonthYear));
        const currentMonthSnapshot = await getDocs(currentMonthQuery);
        
        // Store current statuses in our map
        for (const doc of currentMonthSnapshot.docs) {
          const data = doc.data();
          statusChangeMap.value[doc.id] = data.status;
          console.log(`Saved status for ${doc.id}: ${data.status}`);
        }

        // Delete and recalculate current month's bills
        console.log(`Recalculating current month (${currentMonthYear}) bills...`);
        for (const doc of currentMonthSnapshot.docs) {
          await deleteDoc(doc.ref);
          console.log(`Deleted existing bill ${doc.id}`);
        }
        await generateBillsForMonth(currentMonthYear);

        // Delete and recalculate next month's bills
        console.log(`Recalculating next month (${nextMonthYear}) bills...`);
        const nextMonthQuery = query(collection(db, 'Billing'), where('month', '==', nextMonthYear));
        const nextMonthSnapshot = await getDocs(nextMonthQuery);
        
        // Store next month statuses in our map
        for (const doc of nextMonthSnapshot.docs) {
          const data = doc.data();
          statusChangeMap.value[doc.id] = data.status;
          console.log(`Saved status for ${doc.id}: ${data.status}`);
        }
        
        for (const doc of nextMonthSnapshot.docs) {
          await deleteDoc(doc.ref);
          console.log(`Deleted existing bill ${doc.id}`);
        }
        await generateBillsForMonth(nextMonthYear);

        // Refresh the displayed data
        await fetchBillingData();
        
        console.log('Force recalculation completed successfully');
      } catch (err) {
        console.error('Error in force recalculation:', err);
        error.value = `Failed to force recalculation: ${err.message}.`;
      } finally {
        loading.value = false;
      }
    };

    // Update the refreshBills function to use forceRecalculateBills
    const refreshBills = async () => {
      try {
        loading.value = true;
        console.log('Manually refreshing bills');
        await forceRecalculateBills();
      } catch (err) {
        console.error('Error refreshing bills:', err);
        error.value = `Failed to refresh bills: ${err.message}.`;
      } finally {
        loading.value = false;
      }
    };

    // Update bill status (admin only)
    const updateBillStatus = async (billId, status) => {
      if (!isAdmin.value) return;
      saving.value = true;
      try {
        console.log(`Updating bill status for ${billId} to ${status}`);
        
        // Store the status change in our map
        statusChangeMap.value[billId] = status;
        
        const billRef = doc(db, 'Billing', billId);
        await updateDoc(billRef, { 
          status,
          lastUpdated: new Date().toISOString()
        });
        
        // Update the bill in our local data
        const bill = billingData.value.find(b => b.id === billId);
        if (bill) {
          bill.status = status;
          bill.lastUpdated = new Date().toISOString();
        }
        
        console.log(`Successfully updated bill status for ${billId} to ${status}`);
      } catch (err) {
        error.value = `Failed to update bill status: ${err.message}.`;
        console.error('Error updating bill status:', err);
      } finally {
        saving.value = false;
      }
    };

    // Print billing data
    const printBillingData = (bill = null) => {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
      let receiptCounter = 1;

      const generateReceipt = (bill) => {
        const companyInfo = `
          <div class="company-info">
            <strong>LABASAN WATERWORKS AND SANITATION ASSOCIATION INC.</strong><br>
            Labasan 5211 Bongabong, Oriental Mindoro, Philippines<br>
            TIN: 008-969-632-000<br>
            Receipt No: ${receiptCounter++}
          </div>
        `;
        const title = `Bill Details - ${bill.month}`;
        const tableHeaders = isAdmin.value
          ? '<th>Description</th><th>Details</th>'
          : '<th>Description</th><th>Details</th>';
        const residentInfo = `
          <div class="resident-info">
            <strong>Resident Information:</strong><br>
            Name: ${bill.fullName}<br>
            Address: ${bill.address}<br>
            Contact Number: ${bill.contactNumber}<br>
            Account Number: ${bill.accountNumber}
          </div>
        `;
        const dueDate = calculateDueDate(bill.month).toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
        const tableRows = `
          <tr><td>Month</td><td>${bill.month}</td></tr>
          <tr><td>Device ID</td><td>${isAdmin.value ? bill.deviceId : 'N/A'}</td></tr>
          <tr><td>Total Liters</td><td>${bill.totalLiters.toFixed(2)}</td></tr>
          <tr><td>Past Cubics</td><td>${bill.pastCubics.toFixed(2)} m³</td></tr>
          <tr><td>Current Cubics</td><td>${bill.currentCubics.toFixed(2)} m³</td></tr>
          <tr><td>Cubic Consumed</td><td>${bill.cubicMeters.toFixed(2)} m³</td></tr>
          <tr><td>Amount</td><td>${bill.totalLiters === 0 ? 'No Consumption' : '₱ ' + bill.amount.toFixed(2)}</td></tr>
          <tr><td>Due Date</td><td>${dueDate}</td></tr>
          <tr><td>Status</td><td>${bill.status}</td></tr>
        `;
        return `
          <div class="receipt">
            ${companyInfo}
            <h1>${title}</h1>
            <p class="date">Date: ${currentDate}</p>
            ${residentInfo}
            <table>
              <thead>
                <tr>${tableHeaders}</tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="signature">Received by: _________________</div>
            <div class="stamp">Stamp: [Stamp Here]</div>
            <div class="footer">Printed by: System | Thank you for your payment!</div>
          </div>
        `;
      };

      let receipts = '';
      if (bill) {
        // Print a single bill
        receipts = generateReceipt(bill);
      } else {
        // Print all bills, including those not on the current page
        const receiptGroups = [];
        // Use filteredData to respect search filters, sorted as in processedData
        const allBills = filteredData.value
          .map(bill => ({
            ...bill,
            timestamp: new Date(bill.month.split(' ')[1], months.value.indexOf(bill.month.split(' ')[0])),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
          
        for (let i = 0; i < allBills.length; i += 6) {
          const group = allBills.slice(i, i + 6);
          const groupReceipts = group.map(generateReceipt).join('');
          receiptGroups.push(`
            <div class="receipt-page">
              ${groupReceipts}
            </div>
          `);
        }
        receipts = receiptGroups.join('');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Billing Receipts - ${selectedMonthYear.value}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0.5cm;
              }
              .receipt-page {
                width: 21cm;
                height: 29.7cm;
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 1fr 1fr 1fr;
                gap: 0.5cm;
                page-break-after: always;
              }
              .receipt-page:last-child {
                page-break-after: auto;
              }
              .receipt {
                width: 10cm;
                height: 7cm;
                border: 1px dashed #000;
                padding: 3px;
                box-sizing: border-box;
                position: relative;
                font-size: 7px;
              }
              .company-info {
                text-align: center;
                font-size: 7px;
                margin-bottom: 3px;
              }
              .resident-info {
                font-size: 7px;
                margin-bottom: 3px;
              }
              h1 {
                text-align: center;
                font-size: 9px;
                margin: 3px 0;
              }
              .date {
                text-align: right;
                font-size: 6px;
                margin: 0 0 3px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 7px;
              }
              th, td {
                border: 1px solid #000;
                padding: 2px;
                text-align: left;
              }
              th {
                background-color: #f9f9f9;
              }
              .signature {
                position: absolute;
                bottom: 5px;
                left: 5px;
                font-size: 7px;
              }
              .stamp {
                position: absolute;
                bottom: 5px;
                right: 5px;
                font-size: 7px;
              }
              .status-paid {
                color: #4caf50;
              }
              .status-pending {
                color: #ffc107;
              }
              .status-due {
                color: #f44336;
              }
              .footer {
                text-align: center;
                font-size: 6px;
                margin-top: 3px;
                color: #666;
              }
              @media print {
                .receipt-page {
                  page-break-after: always;
                }
                .receipt-page:last-child {
                  page-break-after: auto;
                }
              }
            </style>
          </head>
          <body>
            ${receipts}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    };

    // Filtered and processed data
    const filteredData = computed(() => {
      if (!searchQuery.value.trim() || !isAdmin.value) return billingData.value;
      const query = searchQuery.value.toLowerCase();
      return billingData.value.filter(
        bill => bill.deviceId.toLowerCase().includes(query) || bill.userId.toLowerCase().includes(query)
      );
    });

    const processedData = computed(() => {
      return filteredData.value
        .map(bill => ({
          ...bill,
          timestamp: new Date(bill.month.split(' ')[1], months.value.indexOf(bill.month.split(' ')[0])),
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
    });

    // Pagination logic
    const totalPages = computed(() => Math.ceil(processedData.value.length / itemsPerPage));
    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      console.log('Paginated Data:', processedData.value.slice(start, end));
      return processedData.value.slice(start, end);
    });
    const visiblePages = computed(() => {
      const pages = [];
      const maxVisible = 5;
      let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages.value, startPage + maxVisible - 1);
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    });
    const showEllipsis = computed(() => totalPages.value > 5 && visiblePages.value[visiblePages.value.length - 1] < totalPages.value);

    // Add new function for generating bills for a specific month
    const generateBillsForMonth = async (monthYear) => {
      try {
        console.log(`Generating bills for ${monthYear}`);
        const residents = await fetchResidents();
        if (residents.length === 0) {
          console.warn('No residents found for bill generation');
          return;
        }

        const usageByDevice = await fetchSensorData(monthYear);
        for (const resident of residents) {
          const deviceId = resident.deviceId;
          const billId = `${deviceId}_${monthYear.replace(' ', '_')}`;

          // Check if we have a manually set status for this bill
          let billStatus = 'Pending';
          if (statusChangeMap.value[billId]) {
            billStatus = statusChangeMap.value[billId];
            console.log(`Using manually set status for ${billId}: ${billStatus}`);
          }

          const previousBill = await fetchPreviousBill(deviceId, monthYear);
          let pastCubics = 0;
          if (previousBill && typeof previousBill.currentCubics === 'number') {
            pastCubics = previousBill.currentCubics;
          }

          const deviceData = usageByDevice[deviceId] || {
            totalLiters: 0,
            pastLiters: 0,
            currentCubics: 0,
            pastCubics: 0,
            cubicConsumed: 0
          };
          const { totalLiters, cubicConsumed } = deviceData;

          let amount = 0;
          let currentCubics = pastCubics;
          let cubicConsumedAdjusted = cubicConsumed;

          if (totalLiters === 0) {
            cubicConsumedAdjusted = 0;
            currentCubics = 0;
            amount = 0;
          } else {
            currentCubics = pastCubics + cubicConsumed;
            if (cubicConsumed <= settings.value.monthlyQuotaCubicMeters && cubicConsumed >= 0) {
              amount = settings.value.billingRate;
            } else if (cubicConsumed > settings.value.monthlyQuotaCubicMeters) {
              amount = settings.value.billingRate + ((cubicConsumed - settings.value.monthlyQuotaCubicMeters) * settings.value.pricePerCubicMeterAboveQuota);
            } else {
              amount = settings.value.billingRate;
            }
          }

          const billData = {
            deviceId,
            userId: resident.userId,
            month: monthYear,
            cubicMeters: cubicConsumedAdjusted,
            totalLiters,
            pastCubics,
            currentCubics,
            amount,
            status: billStatus,
            accountNumber: resident.accountNumber,
            address: resident.address,
            contactNumber: resident.contactNumber,
            email: resident.email,
            fullName: resident.fullName,
            lastUpdated: new Date().toISOString() // Add lastUpdated
          };

          try {
            await setDoc(doc(db, 'Billing', billId), billData);
            console.log(`Bill created for ${deviceId} in ${monthYear}`);
          } catch (writeErr) {
            console.error(`Failed to write bill ${billId}:`, writeErr);
          }
        }
      } catch (err) {
        console.error('Error generating bills for month:', err);
        error.value = `Failed to generate bills for ${monthYear}: ${err.message}.`;
      }
    };

    // Function to process new sensor data and update bills
    const processNewSensorData = async () => {
      try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentMonthYear = `${months.value[currentMonth]} ${currentYear}`;
        
        console.log('Checking for new sensor data and updating bills...', {
          currentDay,
          currentMonthYear,
          billingCalculationDate: settings.value.billingCalculationDate
        });

        // Get latest sensor data
        const q = query(
          collection(db, 'SensorData'),
          where('timestamp', '>', lastProcessedTimestamp.value || new Date(0).toISOString())
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found ${querySnapshot.docs.length} new sensor readings`);
          
          // Update last processed timestamp
          const latestDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
          lastProcessedTimestamp.value = latestDoc.data().timestamp;

          // Always update current month's bills when new data arrives
          console.log('Updating current month bills with new sensor data...');
          
          // First, save current statuses
          const currentBillsQuery = query(collection(db, 'Billing'), where('month', '==', currentMonthYear));
          const currentBillsSnapshot = await getDocs(currentBillsQuery);
          
          for (const doc of currentBillsSnapshot.docs) {
            const data = doc.data();
            if (!statusChangeMap.value[doc.id]) {
              statusChangeMap.value[doc.id] = data.status;
              console.log(`Saved status for ${doc.id}: ${data.status}`);
            }
          }
          
          await generateBillsForMonth(currentMonthYear);
          
          // If we're past the billing calculation date, also calculate next month
          if (currentDay >= settings.value.billingCalculationDate) {
            const nextMonth = new Date(currentYear, currentMonth + 1, 1);
            const nextMonthYear = `${months.value[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
            console.log('Calculating next month bills...', nextMonthYear);
            
            // First, save next month statuses
            const nextMonthBillsQuery = query(collection(db, 'Billing'), where('month', '==', nextMonthYear));
            const nextMonthBillsSnapshot = await getDocs(nextMonthBillsQuery);
            
            for (const doc of nextMonthBillsSnapshot.docs) {
              const data = doc.data();
              if (!statusChangeMap.value[doc.id]) {
                statusChangeMap.value[doc.id] = data.status;
                console.log(`Saved status for ${doc.id}: ${data.status}`);
              }
            }
            
            await generateBillsForMonth(nextMonthYear);
          }

          // Force refresh the billing data
          loading.value = true;
          try {
            // Clear existing data
            billingData.value = [];
            
            // Fetch fresh data
            const billingQuery = query(collection(db, 'Billing'), where('month', '==', selectedMonthYear.value));
            const billingSnapshot = await getDocs(billingQuery);
            
            const newBillingData = await Promise.all(
              billingSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                
                // Check if we have a manually set status for this bill
                let billStatus = data.status;
                if (statusChangeMap.value[doc.id]) {
                  billStatus = statusChangeMap.value[doc.id];
                  console.log(`Using manually set status for ${doc.id}: ${billStatus}`);
                }
                
                const bill = {
                  id: doc.id,
                  deviceId: data.deviceId,
                  month: data.month,
                  cubicMeters: data.cubicMeters,
                  totalLiters: data.totalLiters || 0,
                  pastCubics: data.pastCubics || 0,
                  currentCubics: data.currentCubics || data.cubicMeters || 0,
                  amount: data.amount,
                  status: billStatus,
                  userId: data.userId,
                  accountNumber: data.accountNumber || 'N/A',
                  address: data.address || 'N/A',
                  contactNumber: data.contactNumber || 'N/A',
                  email: data.email || 'N/A',
                  fullName: data.fullName || 'N/A',
                  lastUpdated: data.lastUpdated || new Date().toISOString() // Add lastUpdated
                };
                return bill;
              })
            ).then(bills => bills.filter(data => data !== null))
             .then(bills => bills.filter(data => isAdmin.value || data.deviceId === userDeviceId.value));

            // Update billing data with new values
            billingData.value = [...newBillingData];
            console.log('Table data refreshed with new bills:', billingData.value);
          } catch (err) {
            console.error('Error refreshing table data:', err);
            error.value = `Failed to refresh table: ${err.message}.`;
          } finally {
            loading.value = false;
          }
        }
      } catch (err) {
        console.error('Error processing new sensor data:', err);
      }
    };

    // Enhanced function to check and update bill statuses based on due dates
    const checkAndUpdateDueStatuses = async () => {
      try {
        console.log('Checking for bills past due date...');
        const today = new Date();
        
        // Get all bills with "Pending" status
        const pendingBillsQuery = query(
          collection(db, 'Billing'), 
          where('status', '==', 'Pending')
        );
        
        const pendingBillsSnapshot = await getDocs(pendingBillsQuery);
        const billsToUpdate = [];
        
        pendingBillsSnapshot.forEach(doc => {
          const bill = doc.data();
          // Calculate due date for this bill
          const dueDate = calculateDueDate(bill.month);
          
          // Check if bill is past due date
          if (today > dueDate) {
            console.log(`Bill ${doc.id} is past due date (${dueDate.toISOString()}), marking as Due`);
            billsToUpdate.push({
              id: doc.id,
              status: 'Due',
              deviceId: bill.deviceId,
              month: bill.month
            });
          }
        });
        
        // Update all bills that are past due
        for (const bill of billsToUpdate) {
          try {
            // Skip if we have a manually set status that's not "Pending"
            if (statusChangeMap.value[bill.id] && statusChangeMap.value[bill.id] !== 'Pending') {
              console.log(`Skipping auto-update for ${bill.id} as it has a manually set status: ${statusChangeMap.value[bill.id]}`);
              continue;
            }
            
            // Update in Firestore
            const billRef = doc(db, 'Billing', bill.id);
            await updateDoc(billRef, { 
              status: 'Due',
              lastUpdated: new Date().toISOString()
            });
            
            // Update status in our status map
            statusChangeMap.value[bill.id] = 'Due';
            
            console.log(`Updated bill ${bill.id} status to Due`);
            
            // Update local billingData if it's in the current view
            const billIndex = billingData.value.findIndex(b => b.id === bill.id);
            if (billIndex !== -1) {
              billingData.value[billIndex].status = 'Due';
              billingData.value[billIndex].lastUpdated = new Date().toISOString();
            }
          } catch (err) {
            console.error(`Failed to update bill ${bill.id} status:`, err);
          }
        }
        
        return billsToUpdate.length; // Return number of bills updated
      } catch (err) {
        console.error('Error checking due statuses:', err);
        return 0;
      }
    };

    // Enhanced startContinuousMonitoring to include due date checks
    const startContinuousMonitoring = async () => {
      try {
        console.log('Starting continuous monitoring of sensor data...');
        
        // Clear any existing interval
        if (monitoringInterval.value) {
          clearInterval(monitoringInterval.value);
        }

        // Process immediately on start
        await processNewSensorData();
        
        // Check for due bills immediately
        await checkAndUpdateDueStatuses();
        
        // Then process every 10 seconds
        monitoringInterval.value = setInterval(async () => {
          await processNewSensorData();
          // Check for due bills every 10 minutes (less frequent than sensor data)
          const currentMinute = new Date().getMinutes();
          if (currentMinute % 10 === 0) {
            await checkAndUpdateDueStatuses();
          }
        }, 10 * 1000);
        
        console.log('Continuous monitoring started');
      } catch (err) {
        console.error('Error starting continuous monitoring:', err);
        error.value = `Failed to start monitoring: ${err.message}.`;
      }
    };

    // Update onMounted to call generateAvailableMonths
    onMounted(async () => {
      try {
        await fetchUserData();
        await generateAvailableMonths(); // Generate available months first
        await startContinuousMonitoring();
        
        // Also start a daily check for due dates
        const dailyCheck = setInterval(async () => {
          console.log('Running daily check for due bills...');
          const updatedCount = await checkAndUpdateDueStatuses();
          console.log(`Daily check: Updated ${updatedCount} bills to Due status`);
        }, 24 * 60 * 60 * 1000); // Check daily

        // Clean up on unmount
        onUnmounted(() => {
          if (monitoringInterval.value) {
            clearInterval(monitoringInterval.value);
          }
          clearInterval(dailyCheck);
          billingData.value = [];
        });
      } catch (err) {
        console.error('Error in onMounted:', err);
        error.value = `Failed to initialize: ${err.message}.`;
      }
    });

    return {
      error,
      loading,
      isAdmin,
      paginatedData,
      currentPage,
      totalPages,
      visiblePages,
      showEllipsis,
      updateBillStatus,
      saving,
      searchQuery,
      selectedMonthYear,
      availableMonths,
      printBillingData,
      refreshBills,
      startContinuousMonitoring,
      forceUpdate,
      checkAndUpdateDueStatuses,
    };
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

:root {
  --primary-color: #4caf50;
  --secondary-color: #2c3e50;
  --background-light: #f9f9f9;
  --border-color: #e0e0e0;
  --text-dark: #333;
  --text-medium: #666;
  --text-light: #888;
  --status-paid: #4caf50;
  --status-pending: #ffc107;
  --status-due: #f44336;
}

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}

.billing-view-container {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  margin: 0 auto;
}

.billing-title {
  font-size: clamp(1.1rem, 5vw, 1.75rem);
  color: var(--secondary-color);
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: clamp(0.8rem, 3vw, 0.9rem);
  color: var(--text-dark);
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  font-size: clamp(0.8rem, 3vw, 0.9rem);
}

.month-selector {
  min-width: 140px;
  flex: 1;
}

.month-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: clamp(0.8rem, 3vw, 0.9rem);
  color: var(--text-dark);
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.month-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.refresh-button-container {
  min-width: 140px;
  flex: 1;
}

.refresh-button {
  width: 100%;
  padding: 0.5rem;
  background-color: #2196f3;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: clamp(0.8rem, 3vw, 0.9rem);
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}

.refresh-button:hover {
  background-color: #1976d2;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #c62828;
  animation: fadeIn 0.3s ease-in-out;
  text-align: center;
  font-size: clamp(0.8rem, 3vw, 0.9rem);
}

.no-consumption {
  color: var(--text-medium);
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-size: clamp(0.8rem, 3vw, 0.9rem);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.print-button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.table-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(8px);
  padding: 0.75rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #388e3c;
  position: relative;
  overflow-x: auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.table-wrapper:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.1);
}

.table-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #388e3c, var(--secondary-color));
  border-radius: 0.75rem 0.75rem 0 0;
}

.billing-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.billing-table th {
  font-size: clamp(0.75rem, 2.5vw, 0.9rem);
  color: var(--secondary-color);
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: var(--background-light);
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.billing-table td {
  font-size: clamp(0.7rem, 2.5vw, 0.85rem);
  color: var(--text-dark);
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.billing-table tr:hover {
  background: rgba(76, 175, 80, 0.05);
}

.no-data {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-style: italic;
  font-size: clamp(0.8rem, 3vw, 0.9rem);
}

.status-paid {
  color: var(--status-paid);
  font-weight: 500;
}

.status-pending {
  color: var(--status-pending);
  font-weight: 500;
}

.status-due {
  color: var(--status-due);
  font-weight: 500;
}

.status-select {
  padding: 0.3rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: white;
  font-size: clamp(0.7rem, 2.5vw, 0.85rem);
  color: var(--text-dark);
  cursor: pointer;
  transition: border-color 0.3s ease;
  width: 100%;
}

.status-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.action-button {
  padding: 0.3rem 0.6rem;
  border: none;
  background-color: #388e3c;
  color: white;
  font-size: clamp(0.7rem, 2.5vw, 0.8rem);
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.action-button:hover {
  background-color: #2f6f2f;
}

.month-admin {
  display: block;
  line-height: 1.2;
  text-align: center;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  padding: 0.5rem;
}

.pagination-toggle {
  display: flex;
  align-items: center;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  flex-wrap: wrap;
  gap: 0.25rem;
}

.pagination-button {
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #555;
  font-size: clamp(0.75rem, 2.5vw, 0.85rem);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.pagination-button.active {
  color: white;
  font-weight: 600;
}

.pagination-button.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #388e3c;
  z-index: -1;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

.pagination-button:not(.active):hover:not(:disabled) {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--secondary-color);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0 6px;
  flex-wrap: wrap;
}

.page-number {
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #555;
  font-size: clamp(0.75rem, 2.5vw, 0.85rem);
  position: relative;
  z-index: 1;
}

.page-number.active {
  color: white;
  font-weight: 600;
}

.page-number.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #388e3c;
  z-index: -1;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

.page-number:not(.active):hover {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--secondary-color);
}

.ellipsis {
  font-size: clamp(0.75rem, 2.5vw, 0.85rem);
  color: var(--text-medium);
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
}

.pagination-info {
  text-align: center;
  margin-top: 0.5rem;
  font-size: clamp(0.75rem, 2.5vw, 0.85rem);
  color: var(--text-medium);
}

/* Large screens (992px and above) */
@media (min-width: 992px) {
  .billing-view-container {
    padding: 2rem;
    max-width: 1200px;
  }

  .billing-title {
    font-size: 1.75rem;
  }

  .filters {
    flex-wrap: nowrap;
    gap: 1rem;
  }

  .billing-table th,
  .billing-table td {
    padding: 0.75rem 1rem;
  }

  .table-wrapper {
    padding: 1rem;
  }

  .month-admin {
    display: inline;
    line-height: normal;
  }
}

/* Medium screens (768px to 991.99px) */
@media (min-width: 768px) and (max-width: 991.99px) {
  .billing-view-container {
    padding: 1.5rem;
  }

  .billing-title {
    font-size: 1.5rem;
  }

  .filters {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .search-bar,
  .month-selector,
  .refresh-button-container {
    min-width: 200px;
    flex: 1;
  }

  .billing-table th,
  .billing-table td {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .table-wrapper {
    padding: 0.75rem;
  }

  .month-admin {
    display: inline;
    line-height: normal;
  }

  .billing-table th:nth-child(1),
  .billing-table td:nth-child(1) {
    min-width: 65px; /* Month */
    max-width: 75px;
  }

  .billing-table th:nth-child(2),
  .billing-table td:nth-child(2) {
    min-width: 60px; /* Device ID (admin only) */
    max-width: 70px;
  }

  .billing-table th:nth-child(3),
  .billing-table td:nth-child(3) {
    min-width: 45px; /* Liters */
    max-width: 55px;
  }

  .billing-table th:nth-child(4),
  .billing-table td:nth-child(4) {
    min-width: 45px; /* Cubic */
    max-width: 55px;
  }

  .billing-table th:nth-child(5),
  .billing-table td:nth-child(5) {
    min-width: 50px; /* Amount */
    max-width: 60px;
  }

  .billing-table th:nth-child(6),
  .billing-table td:nth-child(6) {
    min-width: 65px; /* Status */
    max-width: 75px;
  }

  .billing-table th:nth-child(7),
  .billing-table td:nth-child(7) {
    min-width: 65px; /* Action */
    max-width: 75px;
  }
}

/* Extra small screens (below 576px) - Mobile First */
@media (max-width: 575.99px) {
  .billing-view-container {
    padding: 0.2rem;
    width: 100%;
    overflow-x: hidden;
  }

  .billing-title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    padding: 0 0.2rem;
  }

  .filters {
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
    padding: 0 0.2rem;
  }

  .search-bar,
  .month-selector,
  .refresh-button-container {
    width: 100%;
    min-width: 100%;
  }

  .search-input,
  .month-select,
  .refresh-button {
    font-size: 0.75rem;
    padding: 0.4rem;
    width: 100%;
  }

  .search-icon {
    font-size: 0.75rem;
    right: 0.5rem;
  }

  .print-button-container {
    display: flex;
    justify-content: center;
    margin: 0.3rem 0;
  }

  .print-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }

  .table-wrapper {
    margin: 0 -0.2rem;
    width: calc(100% + 0.4rem);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    padding: 0;
  }

  .billing-table {
    min-width: 100%;
    font-size: 0.7rem;
    border-collapse: separate;
    border-spacing: 0;
  }

  .billing-table th,
  .billing-table td {
    padding: 0.3rem 0.4rem;
    min-width: 45px;
    max-width: 65px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .billing-table th:nth-child(1),
  .billing-table td:nth-child(1) {
    min-width: 50px; /* Month */
    max-width: 60px;
  }

  .billing-table th:nth-child(2),
  .billing-table td:nth-child(2) {
    min-width: 55px; /* Device ID (admin only) */
    max-width: 65px;
  }

  .billing-table th:nth-child(3),
  .billing-table td:nth-child(3) {
    min-width: 40px; /* Liters */
    max-width: 50px;
  }

  .billing-table th:nth-child(4),
  .billing-table td:nth-child(4) {
    min-width: 40px; /* Cubic */
    max-width: 50px;
  }

  .billing-table th:nth-child(5),
  .billing-table td:nth-child(5) {
    min-width: 45px; /* Amount */
    max-width: 55px;
  }

  .billing-table th:nth-child(6),
  .billing-table td:nth-child(6) {
    min-width: 60px; /* Status */
    max-width: 70px;
  }

  .billing-table th:nth-child(7),
  .billing-table td:nth-child(7) {
    min-width: 60px; /* Action */
    max-width: 70px;
  }

  .status-select {
    padding: 0.2rem 0.25rem;
    font-size: 0.65rem;
  }

  .action-button {
    width: 100%;
    padding: 0.3rem 0.4rem;
    font-size: 0.65rem;
    justify-content: center;
  }

  .action-button i {
    display: none;
  }

  .pagination-controls {
    padding: 0.2rem 0;
  }

  .pagination-button,
  .page-number {
    padding: 0.3rem 0.4rem;
    font-size: 0.65rem;
    min-width: 25px;
  }

  .pagination-info {
    font-size: 0.65rem;
  }
}

/* Small screens (576px to 767.99px) */
@media (min-width: 576px) and (max-width: 767.99px) {
  .billing-view-container {
    padding: 1rem;
  }

  .filters {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .search-bar,
  .month-selector {
    min-width: calc(50% - 0.375rem);
  }

  .refresh-button-container {
    width: 100%;
  }

  .table-wrapper {
    overflow-x: auto;
    padding: 0.75rem;
  }

  .billing-table th,
  .billing-table td {
    padding: 0.5rem 0.6rem;
    font-size: 0.8rem;
    min-width: 50px;
    max-width: 70px;
  }

  .billing-table th:nth-child(1),
  .billing-table td:nth-child(1) {
    min-width: 60px; /* Month */
    max-width: 70px;
  }

  .billing-table th:nth-child(2),
  .billing-table td:nth-child(2) {
    min-width: 60px; /* Device ID (admin only) */
    max-width: 70px;
  }

  .billing-table th:nth-child(3),
  .billing-table td:nth-child(3) {
    min-width: 45px; /* Liters */
    max-width: 55px;
  }

  .billing-table th:nth-child(4),
  .billing-table td:nth-child(4) {
    min-width: 45px; /* Cubic */
    max-width: 55px;
  }

  .billing-table th:nth-child(5),
  .billing-table td:nth-child(5) {
    min-width: 45px; /* Amount */
    max-width: 55px;
  }

  .billing-table th:nth-child(6),
  .billing-table td:nth-child(6) {
    min-width: 65px; /* Status */
    max-width: 75px;
  }

  .billing-table th:nth-child(7),
  .billing-table td:nth-child(7) {
    min-width: 65px; /* Action */
    max-width: 75px;
  }

  .action-button {
    padding: 0.4rem 0.6rem;
  }

  .month-admin {
    display: inline;
    line-height: normal;
  }
}
</style>
<template>
  <div class="billing-view-container">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <h1 class="billing-title">Billing History</h1>

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
            <tr v-for="(bill, index) in paginatedData" :key="index">
              <td>{{ bill.month }}</td>
              <td v-if="isAdmin">{{ bill.deviceId }}</td>
              <td>{{ bill.totalLiters.toFixed(2) }}</td>
              <td>{{ bill.cubicMeters.toFixed(2) }}</td>
              <td>{{ bill.amount.toFixed(2) }}</td>
              <td>
                <span v-if="!isAdmin" :class="bill.status === 'Paid' ? 'status-paid' : 'status-pending'">
                  {{ bill.status }}
                </span>
                <select
                  v-else
                  v-model="bill.status"
                  @change="updateBillStatus(bill.id, $event.target.value)"
                  class="status-select"
                  :aria-label="`Update status for bill ${bill.month}`"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
    const selectedMonthYear = ref('May 2025');
    const availableMonths = ref([]);

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
            billingCalculationDate: data.billingCalculationDate || 4
          };
          console.log('Fetched settings from Settings/global:', settings.value);
        } else {
          console.warn('Settings/global document not found, using defaults.');
          settings.value = {
            billingRate: 110,
            monthlyQuotaCubicMeters: 12,
            pricePerCubicMeterAboveQuota: 25,
            billingCalculationDate: 4
          };
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        error.value = `Failed to fetch settings: ${err.message}.`;
        settings.value = {
          billingRate: 110,
          monthlyQuotaCubicMeters: 12,
          pricePerCubicMeterAboveQuota: 25,
          billingCalculationDate: 4
        };
      }
    };

    // Generate available months
    const generateAvailableMonths = () => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const startYear = 2023;
      const monthYears = [];

      for (let year = currentYear; year >= startYear; year--) {
        const startMonth = year === currentYear ? currentMonth : 11;
        const endMonth = year === startYear ? 0 : 0;
        for (let month = startMonth; month >= endMonth; month--) {
          monthYears.push(`${months[month]} ${year}`);
        }
      }
      availableMonths.value = monthYears;
    };

    // Check if today is the billing calculation day for the selected month
    const isBillingCalculationDay = (monthYear) => {
      const [monthName, year] = monthYear.split(' ');
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(monthName);
      const currentYear = parseInt(year);
      const today = new Date();
      const billingDate = new Date(currentYear, monthIndex, settings.value.billingCalculationDate);
      const isToday = (
        today.getDate() === settings.value.billingCalculationDate &&
        today.getMonth() === monthIndex &&
        today.getFullYear() === currentYear
      );
      console.log(`Checking if today is billing calculation day for ${monthYear}:`, {
        today: today.toISOString(),
        billingDate: billingDate.toISOString(),
        isToday
      });
      return isToday;
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
        const monthIndex = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ].indexOf(monthName);
        const currentYear = parseInt(year);

        const endDate = new Date(currentYear, monthIndex, settings.value.billingCalculationDate, 23, 59, 59, 999);
        const prevMonthDate = new Date(currentYear, monthIndex - 1, settings.value.billingCalculationDate, 23, 59, 59, 999);

        console.log(`Fetching SensorData for ${monthYear}:`, {
          endDate: endDate.toISOString(),
          prevMonthDate: prevMonthDate.toISOString()
        });

        // Fetch all sensor data
        const q = query(collection(db, 'SensorData'));
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.docs.length} SensorData documents`);

        const usageByDevice = {};
        querySnapshot.forEach(doc => {
          const data = doc.data();
          console.log('Raw SensorData:', data);

          // Handle Firestore Timestamp or ISO string
          let timestamp;
          if (data.timestamp instanceof Timestamp) {
            timestamp = data.timestamp.toDate();
          } else if (typeof data.timestamp === 'string' && !isNaN(new Date(data.timestamp).getTime())) {
            timestamp = new Date(data.timestamp);
          } else {
            console.warn(`Invalid timestamp for doc ${doc.id}:`, data.timestamp);
            return;
          }

          // Validate data
          if (
            typeof data.id === 'string' &&
            (typeof data.liters === 'number' || (typeof data.liters === 'string' && !isNaN(parseFloat(data.liters))))
          ) {
            const deviceId = data.id;
            const liters = typeof data.liters === 'number' ? data.liters : parseFloat(data.liters);

            if (!usageByDevice[deviceId]) {
              usageByDevice[deviceId] = {
                totalLiters: 0,
                pastLiters: 0
              };
            }

            // Accumulate liters based on timestamp
            if (timestamp <= endDate) {
              usageByDevice[deviceId].totalLiters += liters;
              console.log(`Added ${liters} liters to ${deviceId} for totalLiters (timestamp: ${timestamp})`);
            }
            if (timestamp <= prevMonthDate) {
              usageByDevice[deviceId].pastLiters += liters;
              console.log(`Added ${liters} liters to ${deviceId} for pastLiters (timestamp: ${timestamp})`);
            }
          } else {
            console.warn(`Invalid sensor data for doc ${doc.id}:`, {
              id: data.id,
              liters: data.liters
            });
          }
        });

        // Calculate cubics for each device
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
          console.log(`Calculated for ${deviceId}:`, usageByDevice[deviceId]);
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

    // Generate bills for all residents without existing bills
    const generateBills = async () => {
      try {
        const monthYear = selectedMonthYear.value;
        console.log(`Starting bill generation for ${monthYear}`);
        const residents = await fetchResidents();
        if (residents.length === 0) {
          error.value = 'No residents found.';
          console.warn('No residents found for bill generation');
          return;
        }

        // Fetch existing bills to determine which devices already have bills
        const existingBillsQuery = query(collection(db, 'Billing'), where('month', '==', monthYear));
        const existingBillsSnapshot = await getDocs(existingBillsQuery);
        const existingDeviceIds = existingBillsSnapshot.docs.map(doc => doc.data().deviceId);
        console.log(`Existing bills for ${monthYear}:`, existingDeviceIds);

        const usageByDevice = await fetchSensorData(monthYear);
        for (const resident of residents) {
          const deviceId = resident.deviceId;

          // Skip devices that already have bills for this month
          if (existingDeviceIds.includes(deviceId)) {
            console.log(`Bill already exists for device ${deviceId} in ${monthYear}, skipping.`);
            continue;
          }

          const billId = `${deviceId}_${monthYear.replace(' ', '_')}`;

          // Delete any stale bill data (just in case)
          await deleteDoc(doc(db, 'Billing', billId)).catch(err => console.warn(`Failed to delete bill ${billId}:`, err));

          // Fetch previous bill to get pastCubics
          const previousBill = await fetchPreviousBill(deviceId, monthYear);
          let pastCubics = 0;
          if (previousBill && typeof previousBill.currentCubics === 'number') {
            pastCubics = previousBill.currentCubics;
          }

          // Use sensor data if available, otherwise default to zero consumption
          const deviceData = usageByDevice[deviceId] || {
            totalLiters: 0,
            pastLiters: 0,
            currentCubics: 0,
            pastCubics: 0,
            cubicConsumed: 0
          };
          const { totalLiters, cubicConsumed } = deviceData;

          // Calculate currentCubics
          const currentCubics = pastCubics + cubicConsumed;

          let amount;
          if (cubicConsumed <= settings.value.monthlyQuotaCubicMeters && cubicConsumed >= 0) {
            amount = settings.value.billingRate; // Flat rate for consumption <= 12 m³
          } else if (cubicConsumed > settings.value.monthlyQuotaCubicMeters) {
            amount = settings.value.billingRate + ((cubicConsumed - settings.value.monthlyQuotaCubicMeters) * settings.value.pricePerCubicMeterAboveQuota);
          } else {
            amount = settings.value.billingRate; // Default to flat rate for new devices with no data
          }

          console.log(`Calculated bill for ${deviceId}:`, {
            totalLiters,
            pastCubics,
            currentCubics,
            cubicConsumed,
            amount
          });

          const billData = {
            deviceId,
            userId: resident.userId,
            month: monthYear,
            cubicMeters: cubicConsumed,
            totalLiters,
            pastCubics,
            currentCubics,
            amount,
            status: 'Pending',
            accountNumber: resident.accountNumber,
            address: resident.address,
            contactNumber: resident.contactNumber,
            email: resident.email,
            fullName: resident.fullName
          };

          console.log(`Generating bill ${billId}:`, billData);
          try {
            await setDoc(doc(db, 'Billing', billId), billData);
            console.log(`Bill created: ${billId}`);
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

    // Fetch billing data for the selected month
    const fetchBillingData = async () => {
      try {
        console.log(`Fetching billing data for ${selectedMonthYear.value}`);
        const q = query(collection(db, 'Billing'), where('month', '==', selectedMonthYear.value));
        const querySnapshot = await getDocs(q);

        billingData.value = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            console.log(`Raw Billing data for ${doc.id}:`, data);
            const isValid =
              typeof data.deviceId === 'string' &&
              typeof data.month === 'string' &&
              typeof data.cubicMeters === 'number' && !isNaN(data.cubicMeters) &&
              typeof data.amount === 'number' && !isNaN(data.amount) &&
              typeof data.status === 'string' && ['Pending', 'Paid'].includes(data.status) &&
              typeof data.userId === 'string';
            if (!isValid) {
              console.warn(`Invalid billing data for ${doc.id}:`, data);
              return null;
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
              status: data.status,
              userId: data.userId,
              accountNumber: data.accountNumber || 'N/A',
              address: data.address || 'N/A',
              contactNumber: data.contactNumber || 'N/A',
              email: data.email || 'N/A',
              fullName: data.fullName || 'N/A'
            };
            console.log(`Processed bill ${doc.id}:`, bill);
            return bill;
          })
          .filter(data => data !== null)
          .filter(data => isAdmin.value || data.deviceId === userDeviceId.value);

        console.log(`Fetched billing data for ${selectedMonthYear.value}:`, billingData.value);

        // Generate bills for new devices if today is the billing calculation day or if triggered manually
        if (isBillingCalculationDay(selectedMonthYear.value)) {
          console.log(`Today is billing calculation day for ${selectedMonthYear.value}, generating bills for new devices`);
          await generateBills();
          // Re-fetch after generating to include new bills
          const q2 = query(collection(db, 'Billing'), where('month', '==', selectedMonthYear.value));
          const querySnapshot2 = await getDocs(q2);
          billingData.value = querySnapshot2.docs
            .map(doc => {
              const data = doc.data();
              console.log(`Raw Billing data (re-fetch) for ${doc.id}:`, data);
              const isValid =
                typeof data.deviceId === 'string' &&
                typeof data.month === 'string' &&
                typeof data.cubicMeters === 'number' && !isNaN(data.cubicMeters) &&
                typeof data.amount === 'number' && !isNaN(data.amount) &&
                typeof data.status === 'string' && ['Pending', 'Paid'].includes(data.status) &&
                typeof data.userId === 'string';
              if (!isValid) {
                console.warn(`Invalid billing data (re-fetch) for ${doc.id}:`, data);
                return null;
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
                status: data.status,
                userId: data.userId,
                accountNumber: data.accountNumber || 'N/A',
                address: data.address || 'N/A',
                contactNumber: data.contactNumber || 'N/A',
                email: data.email || 'N/A',
                fullName: data.fullName || 'N/A'
              };
              console.log(`Processed bill (re-fetch) ${doc.id}:`, bill);
              return bill;
            })
            .filter(data => data !== null)
            .filter(data => isAdmin.value || data.deviceId === userDeviceId.value);
          console.log(`Re-fetched billing data after generation:`, billingData.value);
        }
      } catch (err) {
        console.error('Error fetching billing data:', err);
        error.value = `Failed to fetch billing data for ${selectedMonthYear.value}: ${err.message}.`;
        if (isBillingCalculationDay(selectedMonthYear.value)) {
          console.log(`Error occurred on billing calculation day, attempting to generate bills`);
          await generateBills();
        }
      }
    };

    // Manual refresh bills (admin only)
    const refreshBills = async () => {
      try {
        loading.value = true;
        console.log('Manually refreshing bills');
        await generateBills();
        await fetchBillingData();
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
        const billRef = doc(db, 'Billing', billId);
        await updateDoc(billRef, { status });
        const bill = billingData.value.find(b => b.id === billId);
        if (bill) bill.status = status;
        console.log(`Updated bill status for ${billId} to ${status}`);
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
        const tableRows = `
          <tr><td>Month</td><td>${bill.month}</td></tr>
          <tr><td>Device ID</td><td>${isAdmin.value ? bill.deviceId : 'N/A'}</td></tr>
          <tr><td>Total Liters</td><td>${bill.totalLiters.toFixed(2)}</td></tr>
          <tr><td>Past Cubics</td><td>${bill.pastCubics.toFixed(2)} m³</td></tr>
          <tr><td>Current Cubics</td><td>${bill.currentCubics.toFixed(2)} m³</td></tr>
          <tr><td>Cubic Consumed</td><td>${bill.cubicMeters.toFixed(2)} m³</td></tr>
          <tr><td>Total Amount</td><td>₱ ${bill.amount.toFixed(2)}</td></tr>
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
        // Specific bill printing
        receipts = generateReceipt(bill);
      } else {
        // Print all bills as individual receipts, 6 per page
        const receiptGroups = [];
        for (let i = 0; i < paginatedData.value.length; i += 6) {
          const group = paginatedData.value.slice(i, i + 6);
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
          timestamp: new Date(bill.month.split(' ')[1], months.indexOf(bill.month.split(' ')[0])),
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

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    onMounted(() => {
      fetchUserData();
    });

    onUnmounted(() => {
      billingData.value = [];
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
  text-align: center;
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
    min-width: 55px;
    max-width: 75px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Compact column widths for admin view */
  .billing-table th:nth-child(1),
  .billing-table td:nth-child(1) {
    min-width: 65px; /* Month */
  }
  
  .billing-table th:nth-child(2),
  .billing-table td:nth-child(2) {
    min-width: 55px; /* Device ID */
  }
  
  .billing-table th:nth-child(3),
  .billing-table td:nth-child(3) {
    min-width: 45px; /* Liters */
  }
  
  .billing-table th:nth-child(4),
  .billing-table td:nth-child(4) {
    min-width: 45px; /* Cubic */
  }
  
  .billing-table th:nth-child(5),
  .billing-table td:nth-child(5) {
    min-width: 55px; /* Amount */
  }
  
  .billing-table th:nth-child(6),
  .billing-table td:nth-child(6) {
    min-width: 65px; /* Status */
  }
  
  .billing-table th:nth-child(7),
  .billing-table td:nth-child(7) {
    min-width: 65px; /* Action */
  }

  /* Make status dropdown more compact */
  .status-select {
    padding: 0.2rem 0.25rem;
    font-size: 0.65rem;
  }

  /* Compact action buttons */
  .action-button {
    width: 100%;
    padding: 0.3rem 0.4rem;
    font-size: 0.65rem;
    justify-content: center;
  }

  /* Hide icons in buttons to save space */
  .action-button i {
    display: none;
  }

  /* Pagination compact style */
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
    padding: 0.5rem;
  }

  .billing-table th,
  .billing-table td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .action-button {
    padding: 0.4rem 0.6rem;
  }
}
</style>
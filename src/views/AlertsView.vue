<template>
  <div class="relative container mx-auto p-2 sm:p-4 md:p-6 bg-white">

    <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Alerts</h1>
    <!-- Full-Screen Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">

        <p class="mt-2 text-sm sm:text-base">Loading alerts...</p>
   
    </div>

    <!-- Content -->
    <div v-else>
    

      <!-- Error Message -->
      <div v-if="error" class="bg-red-100 text-red-700 p-3 sm:p-4 rounded mb-4 text-sm sm:text-base">
        {{ error }}
      </div>

      <!-- Alerts Table -->
      <div v-if="paginatedData.length > 0" class="bg-white shadow-md rounded-lg overflow-hidden">
        <!-- Search (Admin Only) -->
        <div v-if="isAdmin" class="flex flex-col sm:flex-row justify-between items-center p-3 sm:p-4 border-b">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by Device ID or User ID..."
            class="w-full sm:w-1/3 p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th v-if="isAdmin" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liters</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cubic Consumed</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="alert in paginatedData" :key="alert.id">
                <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{{ alert.month }}</td>
                <td v-if="isAdmin" class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{{ alert.deviceId }}</td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{{ alert.totalLiters.toFixed(2) }}</td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{{ alert.cubicMeters.toFixed(2) }} m³</td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                  {{ alert.totalLiters === 0 ? 'No Consumption' : '₱ ' + alert.amount.toFixed(2) }}
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{{ formatDueDate(alert.month) }}</td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm">
                  <span :class="{
                    'status-paid': alert.status === 'Paid',
                    'status-pending': alert.status === 'Pending',
                    'status-due': alert.status === 'Due'
                  }">
                    {{ alert.status }}
                  </span>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm">
                  <button
                    @click="printBillingData(alert)"
                    class="text-green-600 hover:text-green-800"
                    title="Print Receipt"
                  >
                    <svg class="h-4 sm:h-5 w-4 sm:w-5 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 4h8a1 1 0 011 1v4a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1zm1 1v4h6V9H7z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex flex-col sm:flex-row justify-between items-center p-3 sm:p-4">
          <div class="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
            {{ Math.min(currentPage * itemsPerPage, filteredData.length) }} of
            {{ filteredData.length }} alerts
          </div>
          <div class="flex flex-wrap gap-1 sm:gap-2">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="px-2 sm:px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm"
            >
              First
            </button>
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-2 sm:px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm"
            >
              Previous
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="currentPage = page"
              :class="{
                'px-2 sm:px-3 py-1 rounded text-xs sm:text-sm': true,
                'bg-green-500 text-white': currentPage === page,
                'bg-gray-200 hover:bg-gray-300': currentPage !== page
              }"
            >
              {{ page }}
            </button>
            <button
              v-if="showEllipsis"
              class="px-2 sm:px-3 py-1 bg-gray-200 rounded text-xs sm:text-sm"
              disabled
            >
              ...
            </button>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-2 sm:px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm"
            >
              Next
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="px-2 sm:px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      <!-- No Alerts -->
      <div v-else class="bg-white shadow-md rounded-lg p-4 sm:p-6 text-center text-gray-600 text-sm sm:text-base">
        No due bills found since May 2024.
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, getDocs, where } from 'firebase/firestore';

export default {
  name: 'AlertView',
  setup() {
    const alertsData = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const isAdmin = ref(false);
    const userDeviceId = ref(null);
    const userId = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 5;
    const settings = ref({});
    const searchQuery = ref('');

    // Fetch settings from Settings/global
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'Settings', 'global'));
        if (settingsDoc.exists()) {
          settings.value = {
            billingRate: settingsDoc.data().billingRate || 110,
            monthlyQuotaCubicMeters: settingsDoc.data().monthlyQuotaCubicMeters || 12,
            pricePerCubicMeterAboveQuota: settingsDoc.data().pricePerCubicMeterAboveQuota || 25,
            billingCalculationDate: settingsDoc.data().billingCalculationDate || 4,
            dueDateDays: settingsDoc.data().dueDateDays || 2
          };
        } else {
          settings.value = {
            billingRate: 110,
            monthlyQuotaCubicMeters: 12,
            pricePerCubicMeterAboveQuota: 25,
            billingCalculationDate: 4,
            dueDateDays: 2
          };
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        error.value = `Failed to fetch settings: ${err.message}.`;
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

    // Format due date for display
    const formatDueDate = (monthYear) => {
      const dueDate = calculateDueDate(monthYear);
      return dueDate.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // Fetch user data and determine role
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'Please sign in to view alerts.';
          return;
        }
        userId.value = user.uid;
        await fetchSettings();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isAdmin.value = userData.role === 'admin';
          userDeviceId.value = userData.deviceId || null;
          await fetchAlertsData();
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

    // Fetch alerts (due bills since May 2024 with due dates from current month onward)
    const fetchAlertsData = async () => {
      try {
        loading.value = true;
        alertsData.value = [];

        // Define time range: May 2024 to May 2025
        const startDate = new Date(2024, 4, 1); // May 1, 2024
        const endDate = new Date(2025, 4, 5); // May 5, 2025 (current date)
        const currentMonthStart = new Date(2025, 4, 1); // Start of May 2025

        // Query bills with status "Due"
        const q = query(
          collection(db, 'Billing'),
          where('status', '==', 'Due'),
          where('timestamp', '>=', startDate),
          where('timestamp', '<=', endDate)
        );
        const querySnapshot = await getDocs(q);

        alertsData.value = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            const isValid =
              typeof data.deviceId === 'string' &&
              typeof data.month === 'string' &&
              typeof data.cubicMeters === 'number' && !isNaN(data.cubicMeters) &&
              typeof data.amount === 'number' && !isNaN(data.amount) &&
              data.status === 'Due' &&
              typeof data.userId === 'string';
            if (!isValid) {
              console.warn(`Invalid billing data for ${doc.id}:`, data);
              return null;
            }

            const dueDate = calculateDueDate(data.month);
            // Only include bills with due date on or after the current month
            if (dueDate < currentMonthStart) {
              return null;
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
              status: data.status,
              userId: data.userId,
              accountNumber: data.accountNumber || 'N/A',
              address: data.address || 'N/A',
              contactNumber: data.contactNumber || 'N/A',
              email: data.email || 'N/A',
              fullName: data.fullName || 'N/A',
              timestamp: data.timestamp.toDate() || new Date(data.month.split(' ')[1], [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].indexOf(data.month.split(' ')[0]))
            };
          })
          .filter(data => data !== null)
          .filter(data => isAdmin.value || data.deviceId === userDeviceId.value);

        console.log(`Fetched ${alertsData.value.length} due bills since May 2024 with due dates from May 2025 onward`);
      } catch (err) {
        console.error('Error fetching alerts data:', err);
        error.value = `Failed to fetch alerts: ${err.message}.`;
      } finally {
        loading.value = false;
      }
    };

    // Print billing data (receipt)
    const printBillingData = (alert) => {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });

      const companyInfo = `
        <div class="company-info">
          <strong>LABASAN WATERWORKS AND SANITATION ASSOCIATION INC.</strong><br>
          Labasan 5211 Bongabong, Oriental Mindoro, Philippines<br>
          TIN: 008-969-632-000<br>
          Receipt No: ${alert.id}
        </div>
      `;
      const title = `Alert - ${alert.month}`;
      const residentInfo = `
        <div class="resident-info">
          <strong>Resident Information:</strong><br>
          Name: ${alert.fullName}<br>
          Address: ${alert.address}<br>
          Contact Number: ${alert.contactNumber}<br>
          Account Number: ${alert.accountNumber}
        </div>
      `;
      const dueDate = calculateDueDate(alert.month).toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
      const tableRows = `
        <tr><td>Month</td><td>${alert.month}</td></tr>
        <tr><td>Device ID</td><td>${isAdmin.value ? alert.deviceId : 'N/A'}</td></tr>
        <tr><td>Total Liters</td><td>${alert.totalLiters.toFixed(2)}</td></tr>
        <tr><td>Past Cubics</td><td>${alert.pastCubics.toFixed(2)} m³</td></tr>
        <tr><td>Current Cubics</td><td>${alert.currentCubics.toFixed(2)} m³</td></tr>
        <tr><td>Cubic Consumed</td><td>${alert.cubicMeters.toFixed(2)} m³</td></tr>
        <tr><td>Amount</td><td>${alert.totalLiters === 0 ? 'No Consumption' : '₱ ' + alert.amount.toFixed(2)}</td></tr>
        <tr><td>Due Date</td><td>${dueDate}</td></tr>
        <tr><td>Status</td><td>${alert.status}</td></tr>
      `;

      printWindow.document.write(`
        <html>
          <head>
            <title>Alert Receipt - ${alert.month}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0.5cm;
                font-size: 7px;
              }
              .company-info {
                text-align: center;
                margin-bottom: 3px;
              }
              .resident-info {
                margin-bottom: 3px;
              }
              h1 {
                text-align: center;
                font-size: 9px;
                margin: 3px 0;
              }
              .date {
                text-align: right;
                margin: 0 0 3px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
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
                margin-top: 5px;
              }
              .stamp {
                margin-top: 5px;
                text-align: right;
              }
              .status-due {
                color: #f44336;
              }
              .footer {
                text-align: center;
                margin-top: 3px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${companyInfo}
              <h1>${title}</h1>
              <p class="date">Date: ${currentDate}</p>
              ${residentInfo}
              <table>
                <thead>
                  <tr><th>Description</th><th>Details</th></tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              <div class="signature">Received by: _________________</div>
              <div class="stamp">Stamp: [Stamp Here]</div>
              <div class="footer">Printed by: System | Thank you for your payment!</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    };

    // Filtered and processed data
    const filteredData = computed(() => {
      if (!searchQuery.value.trim() || !isAdmin.value) return alertsData.value;
      const query = searchQuery.value.toLowerCase();
      return alertsData.value.filter(
        alert => alert.deviceId.toLowerCase().includes(query) || alert.userId.toLowerCase().includes(query)
      );
    });

    const processedData = computed(() => {
      return filteredData.value
        .map(alert => ({
          ...alert,
          timestamp: alert.timestamp instanceof Date ? alert.timestamp : new Date(alert.month.split(' ')[1], [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ].indexOf(alert.month.split(' ')[0]))
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
    });

    // Pagination logic
    const totalPages = computed(() => Math.ceil(processedData.value.length / itemsPerPage));
    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
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

    onMounted(() => {
      fetchUserData();
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
      searchQuery,
      filteredData,
      printBillingData,
      formatDueDate
    };
  }
};
</script>

<style scoped>
/* Tailwind CSS is assumed to be included globally */
.status-paid {
  color: #4caf50;
  font-weight: 500;
}
.status-pending {
  color: #ffc107;
  font-weight: 500;
}
.status-due {
  color: #f44336;
  font-weight: 500;
}

.container{
background-color : white;}


/* Ensure table is scrollable on mobile */
@media (max-width: 640px) {
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }
  table {
    min-width: 600px; /* Ensure table is wide enough to require scrolling */
  }
}
</style>
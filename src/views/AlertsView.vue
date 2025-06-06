<template>
  <div class="usage-report-container">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <h1 class="report-title">Alerts</h1>

    <!-- Error Message -->
    <div v-if="error" class="error-container">
      <svg class="error-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading" role="status">
      Loading alerts...
    </div>

    <!-- Content -->
    <div v-else class="report-content">
      <!-- Tabs -->
      

      <!-- Billing Alerts -->
      <div v-if="activeTab === 'billing'" class="table-wrapper">
        <!-- Search (Admin Only) -->
        <div v-if="isAdmin" class="search-controls">
          <div class="search-group">
            <label class="search-label" for="device-search">Search by Device ID</label>
            <input
              id="device-search"
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Enter device ID"
              aria-label="Search by device ID "
            />
          </div>
        </div>

        <!-- Table -->
        <table class="usage-table">
          <thead>
            <tr>
              <th>Month</th>
              <th v-if="isAdmin">Device ID</th>
              <th>Liters</th>
              <th>m³</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in paginatedBillingAlerts" :key="alert.id">
              <td data-label="Month">{{ alert.month }}</td>
              <td v-if="isAdmin" data-label="Device ID">{{ alert.deviceId }}</td>
              <td data-label="Liters">{{ alert.totalLiters.toFixed(2) }}</td>
              <td data-label="m³">{{ alert.cubicMeters.toFixed(2) }}</td>
              <td data-label="Amount">₱ {{ alert.amount.toFixed(2) }}</td>
              <td data-label="Due Date">{{ formatDueDate(alert.month) }}</td>
              <td data-label="Status">
                <span class="status-due">Due</span>
              </td>
            </tr>
            <tr v-if="filteredBillingAlerts.length === 0">
              <td :colspan="isAdmin ? 7 : 6" class="no-data">No billing alerts found.</td>
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
            @click="prevPage"
            aria-label="Previous page"
          >
            <i class="fas fa-chevron-left"></i> Prev
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
            @click="nextPage"
            aria-label="Next page"
            title="Go to the next page"
          >
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <div v-if="totalPages > 0" class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';

export default {
  name: 'AlertsView',
  setup() {
    const billingAlerts = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const isAdmin = ref(false);
    const userDeviceId = ref(null);
    const activeTab = ref('billing');
    const searchQuery = ref('');
    const settings = ref({});

    // Pagination state
    const currentPage = ref(1);
    const itemsPerPage = 5; // You can adjust this value

    // Fetch settings from Settings/global
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'Settings', 'global'));
        if (settingsDoc.exists()) {
          settings.value = settingsDoc.data();
        } else {
           console.warn('Settings document not found in Firestore.');
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
       if (monthIndex === -1) {
        console.error('Invalid month name:', monthName);
        return 'Invalid Date';
      }
      const currentYear = parseInt(year);
      // Use settings for billing calculation date and due date days, default to reasonable values
      const billingDate = new Date(currentYear, monthIndex, settings.value.billingCalculationDate || 4);
      const dueDate = new Date(billingDate);
      dueDate.setDate(billingDate.getDate() + (settings.value.dueDateDays || 2));
      return dueDate;
    };

    // Format due date for display
    const formatDueDate = (monthYear) => {
      const dueDate = calculateDueDate(monthYear);
       if (dueDate === 'Invalid Date' || isNaN(dueDate)) {
         return 'N/A';
       }
      return dueDate.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // Format date for display (still needed for potential other date displays, though threshold removed)
    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      // Check if timestamp is a Firestore Timestamp or a Date object
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-PH', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Fetch user data and determine role
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'Please sign in to view alerts.';
          loading.value = false;
          return;
        }

        await fetchSettings(); // Fetch settings before setting up listeners
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isAdmin.value = userData.role === 'admin';
          userDeviceId.value = userData.deviceId || null;
          setupRealtimeListeners();
        } else {
          error.value = 'User profile not found.';
          loading.value = false;
        }
      } catch (err) {
        error.value = `Failed to load user data: ${err.message}.`;
        console.error('Error fetching user data:', err);
        loading.value = false;
      }
    };

    // Setup realtime listener for billing alerts
    const setupRealtimeListeners = () => {
      // Billing alerts listener
      const billingQuery = query(
          collection(db, 'Billing'),
        where('status', '==', 'Due')
        // Removed threshold alerts listener
      );

      onSnapshot(billingQuery, (snapshot) => {
        billingAlerts.value = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate() || new Date() // Ensure timestamp is a Date object
            };
          })
          .filter(alert => (isAdmin.value || alert.deviceId === userDeviceId.value)); // Keep all billing alerts for now, filter no consumption later
           loading.value = false;
      }, (err) => {
        console.error('Error fetching billing alerts:', err);
        error.value = `Failed to fetch billing alerts: ${err.message}.`;
        loading.value = false;
      });
    };

    // Print billing data (receipt) - Kept the function but it won't be accessible from the UI
    const printBillingData = (alert) => {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });

      const companyInfo = `
        <div class="company-info">
          <strong>LABASAN WATERWORKS AND SANITATION ASSOCIATION INC.</strong><br>
          Labasan 5211 Bongabong, Oriental Mindoro, Philippines<br>
          TIN: ${settings.value.tin || 'N/A'}<br>
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
        <tr><td>Past Cubics</td><td>${alert.pastCubics?.toFixed(2) || '0.00'} m³</td></tr>
        <tr><td>Current Cubics</td><td>${alert.currentCubics?.toFixed(2) || '0.00'} m³</td></tr>
        <tr><td>Cubic Consumed</td><td>${alert.cubicMeters.toFixed(2)} m³</td></tr>
        <tr><td>Amount</td><td>₱ ${alert.amount.toFixed(2)}</td></tr>
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

    // Filtered and Paginated data
    const filteredBillingAlerts = computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      return billingAlerts.value.filter(
        alert => 
          (isAdmin.value || alert.deviceId === userDeviceId.value) && // Role-based filtering
          alert.totalLiters > 0 && // Filter out no consumption
          (!query || (alert.deviceId.toLowerCase().includes(query) || (alert.userId && alert.userId.toLowerCase().includes(query)))) // Search filtering
      );
    });

     const totalPages = computed(() => {
      return Math.ceil(filteredBillingAlerts.value.length / itemsPerPage);
    });

    const paginatedBillingAlerts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredBillingAlerts.value.slice(start, end);
    });

    // Pagination methods
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    // Total alerts count for sidebar (only billing alerts)
    const totalAlertsCount = computed(() => filteredBillingAlerts.value.length);

    // Watch for changes in total alerts count and emit to parent
    watch(totalAlertsCount, (newCount) => {
      // Emit event to update sidebar
      window.dispatchEvent(new CustomEvent('update-alerts-count', { detail: newCount }));
    });
    
    // Reset pagination when search query changes
    watch(searchQuery, () => {
        currentPage.value = 1;
    });

    onMounted(() => {
      fetchUserData();
    });

    // Computed property to determine which page numbers to show
    const visiblePages = computed(() => {
      const pages = [];
      const total = totalPages.value;
      const current = currentPage.value;
      const maxVisible = 5; // Maximum number of visible page buttons (including ellipsis)

      if (total <= maxVisible) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        const start = Math.max(2, current - 2);
        const end = Math.min(total - 1, current + 2);

        pages.push(1);

        if (start > 2) {
          pages.push('...');
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (end < total - 1) {
          pages.push('...');
        }

        pages.push(total);
      }

      return pages.filter((value, index, self) => self.indexOf(value) === index);
    });

    return {
      error,
      loading,
      isAdmin,
      activeTab,
      billingAlerts, // Still return the original for completeness if needed elsewhere
      filteredBillingAlerts, // Useful for showing total count before pagination
      paginatedBillingAlerts, // Data for the current page
      searchQuery,
      printBillingData, // Still return the function even if not used in template
      formatDueDate,
      formatDate,
      // Pagination properties and methods
      currentPage,
      totalPages,
      nextPage,
      prevPage,
      visiblePages
    };
  }
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
  --status-safe: #4caf50;
  --status-neutral: #ffc107;
  --status-contaminated: #d32f2f;
}

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}

.usage-report-container {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  overflow-x: hidden;
}

.report-title {
  font-size: 1.25rem;
  color: var(--secondary-color);
  margin-bottom: 1rem;
  font-weight: 600;
}

.error-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error-icon {
  width: 24px;
  height: 24px;
  stroke: #c62828;
  stroke-width: 2;
  fill: none;
}

.loading {
  text-align: center;
  padding: 0.75rem;
  color: var(--text-medium);
  font-size: 0.8rem;
}

.alert-badge {
  background-color: #d32f2f;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 6px;
}

/* Toggle Controls */
/* Removed toggle controls styles */

/* Search Controls */
.search-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.search-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex: 1;
}

.search-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--secondary-color);
  margin-bottom: 0.5rem;
}

.search-input {
  padding: 0.75rem;
  font-size: 0.9rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--background-light);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

/* Table Wrapper */
.table-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(8px);
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  border-left: 3px solid #388e3c;
  position: relative;
  overflow-x: auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.table-wrapper:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(0, 0, 0, 0.1);
}

.table-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #388e3c, var(--secondary-color));
  border-radius: 0.5rem 0.5rem 0 0;
}

/* Table */
.usage-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.usage-table th {
  font-size: 0.8rem;
  color: var(--secondary-color);
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: var(--background-light);
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.usage-table td {
  font-size: 0.75rem;
  color: var(--text-dark);
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.usage-table tr:hover {
  background: rgba(76, 175, 80, 0.05);
}

.status-due {
  color: #d32f2f;
  font-weight: 500;
}

.no-data {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-style: italic;
}

/* Pagination */
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
  color: #4caf50;
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
  color: #555;
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
  color: #4caf50;
}

.ellipsis {
  font-size: clamp(0.75rem, 2.5vw, 0.85rem);
  color: #666;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
}

.pagination-info {
  text-align: center;
  margin-top: 0.5rem;
  font-size: clamp(0.75rem, 2.5vw, 0.85rem);
  color: #666;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .usage-report-container {
    padding: 16px;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  /* Table to Card Layout */
  .table-wrapper {
    overflow-x: visible;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .usage-table {
    display: block;
    min-width: 0;
  }

  .usage-table thead {
    display: none;
  }

  .usage-table tbody {
    display: block;
  }

  .usage-table tr {
    display: block;
    background-color: white;
    border-radius: 8px;
    margin-bottom: 12px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #eee;
  }

  .usage-table td {
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

  .usage-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #666;
    width: 40%;
    min-width: 120px;
    flex-shrink: 0;
  }

  .usage-table td:not(.actions-column) {
    padding-right: 0;
  }

  .usage-table td.actions-column {
    display: block;
    margin-top: 12px;
  }

  .usage-table td[data-label="Month"]::before { content: "Month"; }
  .usage-table td[data-label="Device ID"]::before { content: "Device ID"; }
  .usage-table td[data-label="Liters"]::before { content: "Liters"; }
  .usage-table td[data-label="m³"]::before { content: "m³"; }
  .usage-table td[data-label="Amount"]::before { content: "Amount"; }
  .usage-table td[data-label="Due Date"]::before { content: "Due Date"; }
  .usage-table td[data-label="Status"]::before { content: "Status"; }

  /* Pagination Mobile Styles */
  .pagination-controls {
    flex-direction: column;
    align-items: center;
    margin-top: 0.5rem;
  }

  .pagination-toggle {
    width: 100%;
    justify-content: space-between;
    padding: 3px;
  }

  .pagination-button {
    padding: 4px 8px;
    font-size: 0.65rem;
    gap: 0.3rem;
  }

  .page-number {
    padding: 4px 8px;
    font-size: 0.65rem;
  }

  .pagination-info {
    font-size: 0.65rem;
    margin-top: 0.3rem;
  }
}

@media (max-width: 400px) {
  .pagination-button {
    padding: 3px 6px;
    font-size: 0.6rem;
  }

  .page-number {
    padding: 3px 6px;
    font-size: 0.6rem;
  }

  .pagination-info {
    font-size: 0.6rem;
  }
}
</style>
```vue
<template>
  <div class="billing-view-container">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <h1 class="billing-title">Billing History</h1>

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
      <!-- Table -->
      <div class="table-wrapper">
        <table class="billing-table">
          <thead>
            <tr>
              <th>Month</th>
              <th v-if="isAdmin">Device ID</th>
              <th>Amount ($)</th>
              <th>Status</th>
              <th v-if="isAdmin">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(bill, index) in paginatedData" :key="index">
              <td>{{ bill.month }}</td>
              <td v-if="isAdmin">{{ bill.deviceId }}</td>
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
              <td v-if="isAdmin">
                <button
                  class="action-button"
                  @click="updateBillStatus(bill.id, bill.status)"
                  :disabled="saving"
                  aria-label="Save bill status"
                >
                  <i class="fas fa-save"></i> Save
                </button>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="isAdmin ? 5 : 3" class="no-data">No billing data available.</td>
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
      <div v-if="totalPages > 0" class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, getDocs, updateDoc } from 'firebase/firestore';

export default {
  name: 'BillingView',
  setup() {
    const billingData = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const isAdmin = ref(false);
    const userDeviceId = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 10;
    const saving = ref(false);
    const BILLING_RATE = 5; // $5 per cubic meter

    // Fetch user data and determine role
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'Please sign in to view billing history.';
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isAdmin.value = userData.role === 'admin';
          userDeviceId.value = userData.deviceId;
          await fetchBillingData();
        } else {
          error.value = 'User profile not found.';
        }
      } catch (err) {
        error.value = 'Failed to load user data. Please try again.';
        console.error('Error fetching user data:', err);
      } finally {
        loading.value = false;
      }
    };

    // Fetch billing data
    const fetchBillingData = async () => {
      try {
        const q = query(collection(db, 'Billing'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          error.value = 'No billing data available.';
          billingData.value = [];
          return;
        }

        billingData.value = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            const isValid =
              typeof data.deviceId === 'string' &&
              typeof data.month === 'string' &&
              typeof data.cubicMeters === 'number' && !isNaN(data.cubicMeters) &&
              typeof data.status === 'string' && ['Pending', 'Paid'].includes(data.status) &&
              typeof data.userId === 'string';
            if (!isValid) {
              console.warn('Invalid billing data:', data);
              return null;
            }
            return {
              id: doc.id,
              deviceId: data.deviceId,
              month: data.month,
              cubicMeters: data.cubicMeters,
              amount: data.cubicMeters * BILLING_RATE,
              status: data.status,
              userId: data.userId,
            };
          })
          .filter(data => data !== null)
          .filter(data => isAdmin.value || data.deviceId === userDeviceId.value);
      } catch (err) {
        error.value = 'Failed to load billing data. Please try again.';
        console.error('Error fetching billing data:', err);
      }
    };

    // Update bill status (admin only)
    const updateBillStatus = async (billId, status) => {
      if (!isAdmin.value) return;
      saving.value = true;
      try {
        const billRef = doc(db, 'Billing', billId);
        await updateDoc(billRef, { status });
        // Update local data
        const bill = billingData.value.find(b => b.id === billId);
        if (bill) bill.status = status;
      } catch (err) {
        error.value = 'Failed to update bill status. Please try again.';
        console.error('Error updating bill status:', err);
      } finally {
        saving.value = false;
      }
    };

    // Process data (sort by month descending)
    const processedData = computed(() => {
      return billingData.value
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
      return processedData.value.slice(start, end);
    });

    // Visible page numbers (limit to 5 pages, with ellipsis if needed)
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

    // Months for timestamp calculation
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Lifecycle hooks
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
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.billing-title {
  font-size: 1.5rem;
  color: var(--secondary-color);
  margin-bottom: 1.5rem;
  font-weight: 600;
  text-align: center;
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
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Table Wrapper */
.table-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(8px);
  padding: 1rem;
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

/* Table */
.billing-table {
  width: 100%;
  border-collapse: collapse;
}

.billing-table th {
  font-size: 0.9rem;
  color: var(--secondary-color);
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-align: left;
  background: var(--background-light);
  border-bottom: 1px solid var(--border-color);
}

.billing-table td {
  font-size: 0.85rem;
  color: var(--text-dark);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.billing-table tr:hover {
  background: rgba(76, 175, 80, 0.05);
}

.no-data {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-medium);
  font-style: italic;
}

/* Status Styles */
.status-paid {
  color: var(--status-paid);
  font-weight: 500;
}

.status-pending {
  color: var(--status-pending);
  font-weight: 500;
}

.status-select {
  padding: 0.4rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: white;
  font-size: 0.85rem;
  color: var(--text-dark);
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.status-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Action Button */
.action-button {
  padding: 0.4rem 0.8rem;
  border: none;
  background: var(--primary-color);
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.action-button:hover {
  background: #388e3c;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination Controls */
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
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  flex-wrap: wrap;
}

.pagination-button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #555;
  font-size: 0.85rem;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  background-color: var(--primary-color);
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
  margin: 0 8px;
}

.page-number {
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #555;
  font-size: 0.85rem;
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
  background-color: var(--primary-color);
  z-index: -1;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

.page-number:not(.active):hover {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--secondary-color);
}

.ellipsis {
  font-size: 0.85rem;
  color: var(--text-medium);
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
}

.pagination-info {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-medium);
}

/* Responsive Design */
@media (min-width: 992px) {
  .billing-view-container {
    padding: 2rem;
  }

  .billing-title {
    font-size: 1.75rem;
  }

  .billing-table th,
  .billing-table td {
    padding: 1rem 1.25rem;
  }
}

@media (min-width: 768px) and (max-width: 991.99px) {
  .billing-view-container {
    padding: 1.25rem;
  }

  .billing-title {
    font-size: 1.5rem;
  }

  .billing-table th,
  .billing-table td {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 767.99px) {
  .billing-view-container {
    padding: 1rem;
  }

  .billing-title {
    font-size: 1.25rem;
  }

  .pagination-toggle {
    width: 100%;
    justify-content: space-between;
  }

  .pagination-button {
    padding: 6px 12px;
    font-size: 0.8rem;
  }

  .page-number {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .billing-table th,
  .billing-table td {
    font-size: 0.75rem;
    padding: 0.5rem 0.6rem;
  }

  .table-wrapper {
    margin: 0 -0.5rem;
  }

  .pagination-controls {
    flex-direction: column;
    align-items: center;
  }

  .status-select,
  .action-button {
    font-size: 0.75rem;
    padding: 0.3rem;
  }
}

@media (max-width: 400px) {
  .billing-title {
    font-size: 1.1rem;
  }

  .pagination-button {
    padding: 5px 10px;
    font-size: 0.75rem;
  }

  .page-number {
    padding: 5px 8px;
    font-size: 0.75rem;
  }

  .billing-table th,
  .billing-table td {
    font-size: 0.7rem;
    padding: 0.4rem 0.5rem;
  }

  .status-select,
  .action-button {
    font-size: 0.7rem;
    padding: 0.2rem;
  }
}
</style>

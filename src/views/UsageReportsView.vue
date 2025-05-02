```vue
<template>
  <div class="usage-report-container">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <h1 class="report-title">Usage Report</h1>

    <!-- Error Message -->
    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading" role="status">
      Loading report data...
    </div>

    <!-- Report Content -->
    <div v-else class="report-content">
      <!-- Toggle Buttons -->
      <div class="toggle-controls">
        <div class="unit-toggle">
          <span class="unit-label">Report Type:</span>
          <div class="toggle-container">
            <button
              class="toggle-button"
              :class="{ active: reportType === 'daily' }"
              @click="setReportType('daily')"
              aria-label="View daily usage report"
            >
              Daily
            </button>
            <button
              class="toggle-button"
              :class="{ active: reportType === 'monthly' }"
              @click="setReportType('monthly')"
              aria-label="View monthly usage report"
            >
              Monthly
            </button>
            <button
              class="toggle-button"
              :class="{ active: reportType === 'yearly' }"
              @click="setReportType('yearly')"
              aria-label="View yearly usage report"
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="usage-table">
          <thead>
            <tr>
              <th>{{ reportType === 'daily' ? 'Date' : reportType === 'monthly' ? 'Month' : 'Year' }}</th>
              <th v-if="isAdmin">Device ID</th>
              <th>Liters</th>
              <th>Cubic Meters (m³)</th>
              <th>TDS (ppm)</th>
              <th>Conductivity (µS/cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedData" :key="index">
              <td>{{ row.label }}</td>
              <td v-if="isAdmin">{{ row.deviceId }}</td>
              <td>{{ row.liters.toFixed(2) }}</td>
              <td>{{ row.cubicMeters.toFixed(3) }}</td>
              <td>{{ row.tds_ppm.toFixed(0) }}</td>
              <td>{{ row.us_cm.toFixed(0) }}</td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="isAdmin ? 6 : 5" class="no-data">No data available for this period.</td>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';

export default {
  name: 'UsageReport',
  setup() {
    const sensorData = ref([]);
    const reportType = ref('daily');
    const error = ref(null);
    const loading = ref(true);
    const isAdmin = ref(false);
    const userDeviceId = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 10;

    // Fetch user data and determine role
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'Please sign in to view the report.';
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isAdmin.value = userData.role === 'admin';
          userDeviceId.value = userData.deviceId;
          await fetchSensorData();
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

    // Fetch sensor data
    const fetchSensorData = async () => {
      try {
        const q = query(collection(db, 'SensorData'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          error.value = 'No sensor data available.';
          sensorData.value = [];
          return;
        }

        sensorData.value = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            const isValid =
              typeof data.id === 'string' &&
              typeof data.liters === 'number' && !isNaN(data.liters) &&
              typeof data.tds_ppm === 'number' && !isNaN(data.tds_ppm) &&
              typeof data.us_cm === 'number' && !isNaN(data.us_cm) &&
              typeof data.timestamp === 'string' && !isNaN(new Date(data.timestamp).getTime());
            if (!isValid) {
              console.warn('Invalid sensor data:', data);
              return null;
            }
            return {
              deviceId: data.id,
              liters: data.liters,
              tds_ppm: data.tds_ppm,
              us_cm: data.us_cm,
              timestamp: new Date(data.timestamp),
            };
          })
          .filter(data => data !== null)
          .filter(data => isAdmin.value || data.deviceId === userDeviceId.value);
      } catch (err) {
        error.value = 'Failed to load sensor data. Please try again.';
        console.error('Error fetching sensor data:', err);
      }
    };

    // Process data based on report type
    const processedData = computed(() => {
      if (reportType.value === 'daily') {
        const dailyMap = {};
        sensorData.value.forEach(data => {
          const date = data.timestamp;
          const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${data.deviceId}`;
          if (!dailyMap[key]) {
            dailyMap[key] = {
              label: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
              deviceId: data.deviceId,
              liters: 0,
              tds_ppm: 0,
              us_cm: 0,
              count: 0,
            };
          }
          dailyMap[key].liters += data.liters;
          dailyMap[key].tds_ppm += data.tds_ppm;
          dailyMap[key].us_cm += data.us_cm;
          dailyMap[key].count += 1;
        });

        return Object.values(dailyMap)
          .map(item => ({
            label: item.label,
            deviceId: item.deviceId,
            liters: item.liters,
            cubicMeters: item.liters / 1000,
            tds_ppm: item.tds_ppm / item.count,
            us_cm: item.us_cm / item.count,
            timestamp: new Date(item.label),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
      } else if (reportType.value === 'monthly') {
        const monthlyMap = {};
        sensorData.value.forEach(data => {
          const date = data.timestamp;
          const key = `${date.getFullYear()}-${date.getMonth() + 1}_${data.deviceId}`;
          if (!monthlyMap[key]) {
            monthlyMap[key] = {
              label: `${new Date(date.getFullYear(), date.getMonth()).toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`,
              deviceId: data.deviceId,
              liters: 0,
              tds_ppm: 0,
              us_cm: 0,
              count: 0,
            };
          }
          monthlyMap[key].liters += data.liters;
          monthlyMap[key].tds_ppm += data.tds_ppm;
          monthlyMap[key].us_cm += data.us_cm;
          monthlyMap[key].count += 1;
        });

        return Object.values(monthlyMap)
          .map(item => ({
            label: item.label,
            deviceId: item.deviceId,
            liters: item.liters,
            cubicMeters: item.liters / 1000,
            tds_ppm: item.tds_ppm / item.count,
            us_cm: item.us_cm / item.count,
            timestamp: new Date(item.label.split(' ')[1], months.indexOf(item.label.split(' ')[0])),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
      } else {
        const yearlyMap = {};
        sensorData.value.forEach(data => {
          const date = data.timestamp;
          const key = `${date.getFullYear()}_${data.deviceId}`;
          if (!yearlyMap[key]) {
            yearlyMap[key] = {
              label: `${date.getFullYear()}`,
              deviceId: data.deviceId,
              liters: 0,
              tds_ppm: 0,
              us_cm: 0,
              count: 0,
            };
          }
          yearlyMap[key].liters += data.liters;
          yearlyMap[key].tds_ppm += data.tds_ppm;
          yearlyMap[key].us_cm += data.us_cm;
          yearlyMap[key].count += 1;
        });

        return Object.values(yearlyMap)
          .map(item => ({
            label: item.label,
            deviceId: item.deviceId,
            liters: item.liters,
            cubicMeters: item.liters / 1000,
            tds_ppm: item.tds_ppm / item.count,
            us_cm: item.us_cm / item.count,
            timestamp: new Date(parseInt(item.label), 0),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
      }
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

    // Reset to page 1 when report type changes
    watch(reportType, () => {
      currentPage.value = 1;
    });

    // Ensure current page is valid
    watch(totalPages, (newTotal) => {
      if (currentPage.value > newTotal) {
        currentPage.value = newTotal || 1;
      }
    });

    // Set report type
    const setReportType = (type) => {
      reportType.value = type;
    };

    // Months for monthly report
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Lifecycle hooks
    onMounted(() => {
      fetchUserData();
    });

    onUnmounted(() => {
      sensorData.value = [];
    });

    return {
      reportType,
      error,
      loading,
      isAdmin,
      paginatedData,
      setReportType,
      currentPage,
      totalPages,
      visiblePages,
      showEllipsis,
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
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.report-title {
  font-size: 1.5rem;
  color: var(--secondary-color);
  margin-bottom: 1.5rem;
  font-weight: 600;
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

/* Toggle Controls */
.toggle-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

/* Toggle Styles */
.unit-toggle {
  display: flex;
  align-items: center;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  margin-left: auto;
  flex-wrap: wrap;
}

.unit-label {
  margin-right: 12px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}

.toggle-container {
  display: flex;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-button {
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
}

.toggle-button.active {
  color: white;
  font-weight: 600;
}

.toggle-button.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #4caf50;
  z-index: -1;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

.toggle-button:not(.active):hover {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--secondary-color);
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
.usage-table {
  width: 100%;
  border-collapse: collapse;
}

.usage-table th {
  font-size: 0.9rem;
  color: var(--secondary-color);
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-align: left;
  background: var(--background-light);
  border-bottom: 1px solid var(--border-color);
}

.usage-table td {
  font-size: 0.85rem;
  color: var(--text-dark);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.usage-table tr:hover {
  background: rgba(76, 175, 80, 0.05);
}

.no-data {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-medium);
  font-style: italic;
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
  .usage-report-container {
    padding: 2rem;
  }

  .report-title {
    font-size: 1.75rem;
  }

  .usage-table th,
  .usage-table td {
    padding: 1rem 1.25rem;
  }
}

@media (min-width: 768px) and (max-width: 991.99px) {
  .usage-report-container {
    padding: 1.25rem;
  }

  .report-title {
    font-size: 1.5rem;
  }

  .usage-table th,
  .usage-table td {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 767.99px) {
  .usage-report-container {
    padding: 1rem;
  }

  .report-title {
    font-size: 1.25rem;
  }

  .toggle-controls {
    justify-content: center;
  }

  .unit-toggle {
    width: 100%;
    justify-content: space-between;
  }

  .toggle-button {
    padding: 6px 12px;
    font-size: 0.8rem;
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

  .usage-table th,
  .usage-table td {
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
}

@media (max-width: 400px) {
  .report-title {
    font-size: 1.1rem;
  }

  .toggle-button {
    padding: 5px 10px;
    font-size: 0.75rem;
  }

  .pagination-button {
    padding: 5px 10px;
    font-size: 0.75rem;
  }

  .page-number {
    padding: 5px 8px;
    font-size: 0.75rem;
  }

  .usage-table th,
  .usage-table td {
    font-size: 0.7rem;
    padding: 0.4rem 0.5rem;
  }
}
</style>
<template>
  <div class="dashboard-container">
    <div class="dashboard-card">
      <div class="dashboard-header">
        <h1>FlowSmart</h1>
        <p>Water Management System</p>
      </div>

      <button class="btn-back-home" @click="goToLogin">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Login
      </button>

      <div class="dashboard-content">
        <h2>User Dashboard</h2>
        <p class="dashboard-description">Your water usage details</p>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="loading" class="loading-message">
          Loading your data...
        </div>

        <div v-else-if="userData">
          <h3>Welcome, {{ userData.fullName }}</h3>

          <div class="data-table">
            <h4>User Information</h4>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Account Number</td>
                    <td>{{ userData.accountNumber }}</td>
                  </tr>
                  <tr>
                    <td>Full Name</td>
                    <td>{{ userData.fullName }}</td>
                  </tr>
                  <tr>
                    <td>Email</td>
                    <td>{{ userData.email }}</td>
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td>{{ userData.address }}</td>
                  </tr>
                  <tr>
                    <td>Contact Number</td>
                    <td>{{ userData.contactNumber }}</td>
                  </tr>
                  <tr>
                    <td>Device ID</td>
                    <td>{{ userData.deviceId }}</td>
                  </tr>
                  <tr>
                    <td>Account Created</td>
                    <td>{{ formatDate(userData.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4>Sensor Data</h4>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Water Usage (Liters)</th>
                    <th>TDS (ppm)</th>
                    <th>Conductivity (µS/cm)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(sensorData, index) in sensorDataList" :key="index">
                    <td>{{ sensorData.id }}</td>
                    <td>{{ sensorData.liters }}</td>
                    <td>{{ sensorData.tds_ppm }}</td>
                    <td>{{ sensorData.us_cm }}</td>
                    <td>{{ formatDate(sensorData.timestamp) }}</td>
                  </tr>
                  <tr v-if="!sensorDataList.length">
                    <td colspan="5">No sensor data available.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4>Daily Water Usage</h4>
            <div v-if="dailyWaterUsage.length" class="chart-container">
              <canvas id="waterUsageChart"></canvas>
            </div>
            <div v-else class="no-data-message">
              No chart data available for the selected period.
            </div>
          </div>
        </div>

        <div v-else class="no-data-message">
          No data available. Please contact support.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Chart from 'chart.js/auto';

export default {
  name: 'ResidentDashboardView',
  setup() {
    const userData = ref(null);
    const sensorDataList = ref([]);
    const dailyWaterUsage = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const router = useRouter();
    let chartInstance = null;

    const goToLogin = () => {
      auth.signOut().then(() => {
        router.push('/login');
      });
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    const formatDateForChart = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'No authenticated user found. Please sign in.';
          router.push('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          userData.value = userDoc.data();
          if (userData.value.role !== 'resident') {
            error.value = 'Access denied. This dashboard is for residents only.';
            return;
          }
          console.log('User deviceId:', userData.value.deviceId);
          await fetchSensorData(userData.value.deviceId);
        } else {
          error.value = 'User data not found.';
        }
      } catch (err) {
        console.error('Error fetching user data:', err.message);
        error.value = 'Failed to load user data: ' + err.message;
      } finally {
        loading.value = false;
      }
    };

    const fetchSensorData = async (deviceId) => {
      try {
        if (!deviceId) {
          error.value = 'No device ID provided for sensor data query.';
          console.error('No deviceId provided.');
          return;
        }

        console.log('Querying SensorData for deviceId:', deviceId);
        const q = query(collection(db, 'SensorData'), where('id', '==', deviceId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          error.value = `No sensor data found for device ID: ${deviceId}`;
          sensorDataList.value = [];
          dailyWaterUsage.value = [];
          console.log('Firestore query returned no documents.');
          return;
        }

        sensorDataList.value = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const isValidTimestamp = typeof data.timestamp === 'string' && !isNaN(new Date(data.timestamp).getTime());
          const isValidLiters = typeof data.liters === 'number' && !isNaN(data.liters);
          if (!isValidTimestamp || !isValidLiters) {
            console.warn('Invalid sensor data:', data);
            return null;
          }
          return {
            id: data.id,
            liters: data.liters,
            tds_ppm: Number(data.tds_ppm) || 0,
            us_cm: Number(data.us_cm) || 0,
            timestamp: data.timestamp,
          };
        }).filter(data => data !== null);

        console.log('Processed sensorDataList:', sensorDataList.value);

        // Aggregate data by date for the chart (same as table data)
        const dailyMap = {};
        sensorDataList.value.forEach(data => {
          const date = formatDateForChart(data.timestamp);
          if (!dailyMap[date]) {
            dailyMap[date] = 0;
          }
          dailyMap[date] += data.liters;
        });

        dailyWaterUsage.value = Object.entries(dailyMap)
          .map(([date, liters]) => ({ date, liters }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log('Processed dailyWaterUsage:', dailyWaterUsage.value);

        if (dailyWaterUsage.value.length === 0) {
          error.value = 'No valid sensor data available for charting.';
        }
      } catch (err) {
        console.error('Error fetching sensor data:', err.message, err.code);
        error.value = 'Failed to load sensor data: ' + err.message;
      }
    };

    const createChart = async (retryCount = 0, maxRetries = 3) => {
      if (chartInstance) {
        chartInstance.destroy();
      }

      await nextTick(); // Ensure DOM is updated

      const canvas = document.getElementById('waterUsageChart');
      if (!canvas) {
        if (retryCount < maxRetries) {
          console.warn(`Chart canvas not found, retrying (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => createChart(retryCount + 1, maxRetries), 100);
          return;
        }
        console.error('Chart canvas element not found after retries. userData:', userData.value, 'dailyWaterUsage:', dailyWaterUsage.value);
        error.value = 'Chart element not found. Please try again.';
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context for chart canvas.');
        error.value = 'Failed to initialize chart context.';
        return;
      }

      console.log('Creating chart with data:', dailyWaterUsage.value);

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dailyWaterUsage.value.map(data => data.date),
          datasets: [{
            label: 'Water Usage (Liters)',
            data: dailyWaterUsage.value.map(data => data.liters),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#4caf50',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#4caf50',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date',
                color: '#2c3e50',
                font: { size: 14 },
              },
              grid: { display: false },
            },
            y: {
              title: {
                display: true,
                text: 'Water Usage (Liters)',
                color: '#2c3e50',
                font: { size: 14 },
              },
              beginAtZero: true,
              grid: { color: '#e0e0e0' },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: '#2c3e50',
                font: { size: 14 },
              },
            },
            tooltip: {
              backgroundColor: '#2c3e50',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#4caf50',
              borderWidth: 1,
            },
          },
        },
      });
    };

    // Watch dailyWaterUsage to create chart when data is available
    watch(dailyWaterUsage, (newValue) => {
      if (newValue.length > 0) {
        console.log('dailyWaterUsage updated, attempting to create chart:', newValue);
        createChart();
      }
    });

    onMounted(() => {
      fetchUserData();
    });

    return {
      userData,
      sensorDataList,
      dailyWaterUsage,
      error,
      loading,
      goToLogin,
      formatDate,
    };
  },
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
  overflow: hidden;
  position: relative;
}

.btn-back-home {
  background: none;
  border: none;
  color: #4caf50;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  margin: 20px;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.3s;
}

.btn-back-home:hover {
  color: #388e3c;
  text-decoration: underline;
}

.btn-back-home svg {
  width: 18px;
  height: 18px;
}

.dashboard-header {
  background-color: #4caf50;
  color: white;
  padding: 40px 20px;
  text-align: center;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 600;
}

.dashboard-header p {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.dashboard-content {
  padding: 40px;
}

.dashboard-content h2 {
  margin: 0 0 8px;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
}

.dashboard-description {
  color: #666;
  margin: 0 0 30px;
  font-size: 1rem;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 24px;
  font-size: 0.9rem;
}

.loading-message,
.no-data-message {
  color: #666;
  text-align: center;
  padding: 24px;
  font-size: 1rem;
}

.data-table {
  margin-top: 24px;
}

.data-table h4 {
  color: #2c3e50;
  margin: 24px 0 12px;
  font-size: 1.4rem;
  font-weight: 500;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.data-table table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

.data-table th,
.data-table td {
  padding: 14px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.95rem;
}

.data-table th {
  background-color: #f7f7f7;
  font-weight: 600;
  color: #2c3e50;
  border-top: 1px solid #e0e0e0;
}

.data-table td {
  color: #333;
}

.data-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.data-table tbody tr:hover {
  background-color: #f1f1f1;
  transition: background-color 0.2s;
}

.chart-container {
  position: relative;
  height: 300px;
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

@media (max-width: 575.98px) {
  .dashboard-card {
    max-width: 100%;
    margin: 0 12px;
  }

  .dashboard-header {
    padding: 24px;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .dashboard-content {
    padding: 24px;
  }

  .dashboard-content h2 {
    font-size: 1.5rem;
  }

  .data-table th,
  .data-table td {
    padding: 12px;
    font-size: 0.9rem;
  }

  .chart-container {
    height: 250px;
  }
}

@media (max-width: 400px) {
  .dashboard-header h1 {
    font-size: 1.8rem;
  }

  .dashboard-content {
    padding: 16px;
  }

  .data-table th,
  .data-table td {
    padding: 10px;
    font-size: 0.85rem;
  }

  .chart-container {
    height: 200px;
  }
}
</style>
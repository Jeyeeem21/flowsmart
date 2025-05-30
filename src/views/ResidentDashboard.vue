```vue
<template>
  <div class="analytics-charts">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else>
      <!-- Top Header -->
      <div class="top-header">
        <h2>Analytics</h2>
        <p class="realtime-date">  {{ currentDate }}</p>
      </div>

      <!-- Cards Row -->
      <div class="cards-row">
        <div class="sensor-card" :class="tdsStatusClass">
          <h3>Water Quality</h3>
          <p><strong>TDS:</strong> {{ latestData.tds_ppm }} ppm <span class="status">({{ tdsStatus }})</span></p>
          <p><strong>Conductivity:</strong> {{ latestData.us_cm }} µS/cm</p>
        </div>
        <div class="usage-card">
          <h3>Daily Usage</h3>
          <p><strong>Liters:</strong> {{ todayTotal.liters.toFixed(2) }} liters</p>
          <p><strong>Cubic Meters:</strong> {{ todayTotal.cubic.toFixed(4) }} m³</p>
        </div>
        <div class="usage-card">
          <h3>Monthly Usage</h3>
          <p><strong>Liters:</strong> {{ monthlyTotal.liters.toFixed(2) }} liters</p>
          <p><strong>Cubic Meters:</strong> {{ monthlyTotal.cubic.toFixed(4) }} m³</p>
        </div>
        <div class="usage-card">
          <h3>Yearly Usage</h3>
          <p><strong>Liters:</strong> {{ yearlyTotal.liters.toFixed(2) }} liters</p>
          <p><strong>Cubic Meters:</strong> {{ yearlyTotal.cubic.toFixed(4) }} m³</p>
        </div>
      </div>

      <!-- Controls -->
      <div class="header-controls">
        <div class="unit-toggle">
          <span class="unit-label">Unit:</span>
          <div class="toggle-container">
            <button
              class="toggle-button"
              :class="{ active: unit === 'liters' }"
              @click="toggleUnit('liters')"
            >
              Liters
            </button>
            <button
              class="toggle-button"
              :class="{ active: unit === 'cubic' }"
              @click="toggleUnit('cubic')"
            >
              Cubic
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">
        Loading your data...
      </div>

      <!-- Charts -->
      <div class="charts-row">
        <div class="chart-wrapper daily-chart-wrapper">
          <div class="chart-header">
            <h3>Daily Water Usage - {{ months[selectedMonth] }} {{ selectedYear }}</h3>
            <div class="chart-controls">
              <select v-model="selectedMonth" @change="handleFilterChange">
                <option v-for="(month, index) in months" :value="index" :key="month">{{ month }}</option>
              </select>
              <select v-model="selectedYear" @change="handleFilterChange">
                <option v-for="year in availableYears" :value="year" :key="year">{{ year }}</option>
              </select>
            </div>
          </div>
          <div v-if="dailyChartData.length" class="chart-content">
            <canvas ref="dailyChartContainer"></canvas>
          </div>
          <div v-else class="loading">
            No chart data available for the selected period.
          </div>
        </div>

        <div class="chart-wrapper monthly-chart-wrapper">
          <div class="chart-header">
            <div class="monthly-header">
              <h3>Monthly Water Usage - {{ selectedYear }}</h3>
              <div class="chart-controls">
                <select v-model="selectedYear" class="monthly-select" @change="handleFilterChange">
                  <option v-for="year in availableYears" :value="year" :key="year">{{ year }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="monthlyChartData.length" class="chart-content">
            <canvas ref="monthlyChartContainer"></canvas>
          </div>
          <div v-else class="loading">
            No chart data available for the selected year.
          </div>
        </div>

        <div class="chart-wrapper yearly-chart-wrapper">
          <div class="chart-header">
            <h3>Yearly Water Usage</h3>
          </div>
          <div v-if="yearlyChartData.length" class="chart-content">
            <canvas ref="yearlyChartContainer"></canvas>
          </div>
          <div v-else class="loading">
            No chart data available.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Chart from 'chart.js/auto';

export default {
  name: 'ResidentDashboardView',
  setup() {
    const sensorDataList = ref([]);
    const dailyChartData = ref([]);
    const monthlyChartData = ref([]);
    const yearlyChartData = ref([]);
    const totalUsage = ref(0);
    const latestData = ref({ tds_ppm: 0, us_cm: 0 });
    const tdsStatus = ref('safe');
    const tdsStatusClass = ref('status-safe');
    const todayTotal = ref({ liters: 0, cubic: 0 });
    const monthlyTotal = ref({ liters: 0, cubic: 0 });
    const yearlyTotal = ref({ liters: 0, cubic: 0 });
    const unit = ref('liters');
    const error = ref(null);
    const loading = ref(true);
    const selectedMonth = ref(new Date().getMonth());
    const selectedYear = ref(new Date().getFullYear());
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const availableYears = ref([]);
    const unitLabel = ref('Liters');
    const dailyChartInstance = ref(null);
    const monthlyChartInstance = ref(null);
    const yearlyChartInstance = ref(null);
    const dailyChartContainer = ref(null);
    const monthlyChartContainer = ref(null);
    const yearlyChartContainer = ref(null);
   const currentDate = ref(new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    const refreshInterval = ref(null);

    // Update real-time date
    const updateCurrentDate = () => {
      currentDate.value = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'No authenticated user found. Please sign in.';
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role !== 'resident') {
            error.value = 'Access denied. This dashboard is for residents only.';
            return;
          }
          await fetchSensorData(userData.deviceId);
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

    // Fetch sensor data
    const fetchSensorData = async (deviceId) => {
      try {
        if (!deviceId) {
          error.value = 'No device ID provided for sensor data query.';
          console.error('No deviceId provided.');
          return;
        }

        const q = query(collection(db, 'SensorData'), where('id', '==', deviceId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          error.value = `No sensor data found for device ID: ${deviceId}`;
          sensorDataList.value = [];
          dailyChartData.value = [];
          monthlyChartData.value = [];
          yearlyChartData.value = [];
          availableYears.value = [];
          return;
        }

        sensorDataList.value = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const isValidTimestamp = typeof data.timestamp === 'string' && !isNaN(new Date(data.timestamp).getTime());
          const isValidLiters = typeof data.liters === 'number' && !isNaN(data.liters);
          const isValidTds = typeof data.tds_ppm === 'number' && !isNaN(data.tds_ppm);
          const isValidUsCm = typeof data.us_cm === 'number' && !isNaN(data.us_cm);
          if (!isValidTimestamp || !isValidLiters || !isValidTds || !isValidUsCm) {
            console.warn('Invalid sensor data:', data);
            return null;
          }
          return {
            id: data.id,
            liters: data.liters,
            tds_ppm: data.tds_ppm,
            us_cm: data.us_cm,
            timestamp: data.timestamp,
          };
        }).filter(data => data !== null);

        const years = [...new Set(sensorDataList.value.map(data => new Date(data.timestamp).getFullYear()))];
        availableYears.value = years.sort((a, b) => b - a);

        if (availableYears.value.length > 0) {
          selectedYear.value = availableYears.value[0];
        } else {
          selectedYear.value = new Date().getFullYear();
        }

        updateChartData();
      } catch (err) {
        console.error('Error fetching sensor data:', err.message, err.code);
        error.value = 'Failed to load sensor data: ' + err.message;
      }
    };

    // Update chart data
    const updateChartData = () => {
      totalUsage.value = sensorDataList.value.reduce((sum, data) => sum + data.liters, 0) * (unit.value === 'cubic' ? 0.001 : 1);

      const sortedData = sensorDataList.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (sortedData.length > 0) {
        latestData.value = {
          tds_ppm: sortedData[0].tds_ppm,
          us_cm: sortedData[0].us_cm
        };
        if (latestData.value.tds_ppm > 300) {
          tdsStatus.value = 'contaminated';
          tdsStatusClass.value = 'status-contaminated';
        } else if (latestData.value.tds_ppm >= 150) {
          tdsStatus.value = 'neutral';
          tdsStatusClass.value = 'status-neutral';
        } else {
          tdsStatus.value = 'safe';
          tdsStatusClass.value = 'status-safe';
        }
      }

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      todayTotal.value.liters = sensorDataList.value
        .filter(data => {
          const date = new Date(data.timestamp);
          const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          return dateStr === todayStr;
        })
        .reduce((sum, data) => sum + data.liters, 0);
      todayTotal.value.cubic = todayTotal.value.liters * 0.001;

      monthlyTotal.value.liters = sensorDataList.value
        .filter(data => {
          const date = new Date(data.timestamp);
          return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
        })
        .reduce((sum, data) => sum + data.liters, 0);
      monthlyTotal.value.cubic = monthlyTotal.value.liters * 0.001;

      yearlyTotal.value.liters = sensorDataList.value
        .filter(data => new Date(data.timestamp).getFullYear() === today.getFullYear())
        .reduce((sum, data) => sum + data.liters, 0);
      yearlyTotal.value.cubic = yearlyTotal.value.liters * 0.001;

      unitLabel.value = unit.value === 'liters' ? 'Liters' : 'Cubic Meters';

      const dailyMap = {};
      sensorDataList.value.forEach(data => {
        const date = new Date(data.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        if (year === selectedYear.value && month === selectedMonth.value) {
          const key = `${year}-${month + 1}-${day}`;
          dailyMap[key] = (dailyMap[key] || 0) + data.liters;
        }
      });

      const daysInMonth = new Date(selectedYear.value, selectedMonth.value + 1, 0).getDate();
      const dailyData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${selectedYear.value}-${selectedMonth.value + 1}-${day}`;
        const value = (dailyMap[key] || 0) * (unit.value === 'cubic' ? 0.001 : 1);
        dailyData.push([key, value]);
      }
      dailyChartData.value = dailyData
        .filter(([key, value]) => key && typeof value === 'number' && !isNaN(value))
        .sort(([a], [b]) => new Date(a) - new Date(b));

      const monthlyMap = {};
      sensorDataList.value.forEach(data => {
        const date = new Date(data.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        if (year === selectedYear.value) {
          const key = `${year}-${month + 1}`;
          monthlyMap[key] = (monthlyMap[key] || 0) + data.liters;
        }
      });

      const monthlyData = [];
      for (let month = 0; month < 12; month++) {
        const key = `${selectedYear.value}-${month + 1}`;
        const value = (monthlyMap[key] || 0) * (unit.value === 'cubic' ? 0.001 : 1);
        monthlyData.push([key, value]);
      }
      monthlyChartData.value = monthlyData
        .filter(([key, value]) => key && typeof value === 'number' && !isNaN(value))
        .sort(([a], [b]) => new Date(a + '-01') - new Date(b + '-01'));

      const yearlyMap = {};
      sensorDataList.value.forEach(data => {
        const year = new Date(data.timestamp).getFullYear();
        yearlyMap[year] = (yearlyMap[year] || 0) + data.liters;
      });

      yearlyChartData.value = Object.entries(yearlyMap)
        .map(([year, value]) => [year, value * (unit.value === 'cubic' ? 0.001 : 1)])
        .filter(([year, value]) => year && typeof value === 'number' && !isNaN(value))
        .sort(([a], [b]) => a - b);

      console.log('Processed dailyChartData:', dailyChartData.value);
      console.log('Processed monthlyChartData:', monthlyChartData.value);
      console.log('Processed yearlyChartData:', yearlyChartData.value);
    };

    // Handle filter change
    const handleFilterChange = () => {
      if (!availableYears.value.includes(selectedYear.value)) {
        selectedYear.value = availableYears.value.length > 0 ? availableYears.value[0] : new Date().getFullYear();
      }
      updateChartData();
    };

    // Toggle unit
    const toggleUnit = (newUnit) => {
      unit.value = newUnit;
      updateChartData();
    };

    // Create chart
    const createChart = async (canvasRef, chartInstanceRef, data, label, xTitle, retryCount = 0, maxRetries = 3) => {
      if (chartInstanceRef.value) {
        chartInstanceRef.value.destroy();
        chartInstanceRef.value = null;
      }

      await nextTick();

      const canvas = canvasRef.value;
      if (!canvas) {
        if (retryCount < maxRetries) {
          console.warn(`Chart canvas not found for ${label}, retrying (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => createChart(canvasRef, chartInstanceRef, data, label, xTitle, retryCount + 1, maxRetries), 100);
          return;
        }
        console.error(`Chart canvas element not found after retries for ${label}. Canvas ref:`, canvasRef.value);
        error.value = `Chart element not found for ${label}. Please try again.`;
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error(`Failed to get 2D context for chart canvas for ${label}.`);
        error.value = `Failed to initialize chart context for ${label}.`;
        return;
      }

      if (!data.value || !Array.isArray(data.value) || data.value.length === 0) {
        console.warn(`No valid data provided for ${label} chart.`);
        error.value = `No data available for ${label} chart.`;
        return;
      }

      console.log(`Creating ${label} chart with data:`, data.value);

      const isMobile = window.innerWidth <= 768;
      const isYearly = label.includes('Yearly');
      chartInstanceRef.value = new Chart(ctx, {
        type: isYearly ? 'bar' : 'line',
        data: {
          labels: data.value.map(([k]) => {
            if (label.includes('Daily')) {
              const [, , day] = k.split('-');
              return parseInt(day);
            } else if (label.includes('Monthly')) {
              const [, month] = k.split('-');
              return months[parseInt(month) - 1];
            } else {
              return k;
            }
          }),
          datasets: [{
            label: `${label} Usage`,
            data: data.value.map(([, v]) => v),
            backgroundColor: isYearly ? 'rgba(76, 175, 80, 0.8)' : 'rgba(76, 175, 80, 0.5)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: isYearly ? 1 : 2,
            fill: isYearly ? false : true,
            tension: isYearly ? 0 : 0.4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              callbacks: {
                label: (context) => {
                  const index = context.dataIndex;
                  const currentValue = context.raw;
                  const prevValue = index > 0 ? data.value[index - 1][1] : null;
                  const labels = [`${context.dataset.label}: ${currentValue.toFixed(2)} ${unitLabel.value}`];
                  if (prevValue !== null && prevValue !== 0) {
                    const change = ((currentValue - prevValue) / prevValue) * 100;
                    const direction = change >= 0 ? '↑' : '↓';
                    labels.push(`Change: ${direction}${Math.abs(change).toFixed(2)}% from previous period`);
                  } else {
                    labels.push(`Change: ↑∞% (previous value was 0)`);
                  }
                  return labels;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: unitLabel.value },
            },
            x: {
              title: { display: true, text: xTitle },
              ticks: {
                stepSize: isMobile && label.includes('Daily') ? 2 : 1,
                callback: function (value) {
                  if (label.includes('Daily') && isMobile) {
                    return value % 2 === 0 ? value + 1 : null;
                  }
                  return label.includes('Daily') ? value + 1 : this.getLabelForValue(value);
                },
              },
            },
          },
        },
      });
    };

    // Auto-refresh methods
    const fetchData = async () => {
      loading.value = true;
      await fetchUserData();
    };

    const startAutoRefresh = () => {
      refreshInterval.value = setInterval(() => {
        fetchData();
      }, 300000); // Refresh every 5 minutes
    };

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
        refreshInterval.value = null;
      }
    };

    // Watchers
    watch(dailyChartData, (newValue) => {
      if (newValue.length > 0) {
        console.log('dailyChartData updated, attempting to create chart:', newValue);
        createChart(dailyChartContainer, dailyChartInstance, dailyChartData, `Daily ${unitLabel.value}`, 'Day');
      }
    });

    watch(monthlyChartData, (newValue) => {
      if (newValue.length > 0) {
        console.log('monthlyChartData updated, attempting to create chart:', newValue);
        createChart(monthlyChartContainer, monthlyChartInstance, monthlyChartData, `Monthly ${unitLabel.value}`, 'Month');
      }
    });

    watch(yearlyChartData, (newValue) => {
      if (newValue.length > 0) {
        console.log('yearlyChartData updated, attempting to create chart:', newValue);
        createChart(yearlyChartContainer, yearlyChartInstance, yearlyChartData, `Yearly ${unitLabel.value}`, 'Year');
      }
    });

    watch(unit, () => {
      updateChartData();
    });

    // Lifecycle hooks
   onMounted(() => {
      fetchUserData();
      updateCurrentDate();
      const dateIntervalId = setInterval(updateCurrentDate, 1000 * 60 * 60 * 24); // Update daily
      startAutoRefresh();
      return () => {
        clearInterval(dateIntervalId);
        stopAutoRefresh();
      };
    });

    onUnmounted(() => {
      if (dailyChartInstance.value) dailyChartInstance.value.destroy();
      if (monthlyChartInstance.value) monthlyChartInstance.value.destroy();
      if (yearlyChartInstance.value) yearlyChartInstance.value.destroy();
      stopAutoRefresh(); // Ensure cleanup
    });

    return {
      sensorDataList,
      dailyChartData,
      monthlyChartData,
      yearlyChartData,
      totalUsage,
      latestData,
      tdsStatus,
      tdsStatusClass,
      todayTotal,
      monthlyTotal,
      yearlyTotal,
      unit,
      error,
      loading,
      selectedMonth,
      selectedYear,
      months,
      availableYears,
      unitLabel,
      handleFilterChange,
      toggleUnit,
      dailyChartContainer,
      monthlyChartContainer,
      yearlyChartContainer,
      currentDate,
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

.analytics-charts {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #c62828;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Top Header */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.top-header h2 {
  font-size: 1.5rem;
  color: var(--secondary-color);
  margin: 0;
  font-weight: 600;
}

.realtime-date {
  font-size: 0.9rem;
  color: var(--text-medium);
  margin: 0;
  text-align: right;
}

/* Cards Row */
.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

/* Sensor Card */
.sensor-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(8px);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #388e3c;
  flex: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sensor-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.9));
}

.sensor-card:focus-within {
  outline: 2px solid #388e3c;
  outline-offset: 2px;
}

.sensor-card h3 {
  font-size: 1.05rem;
  color: var(--secondary-color);
  margin: 0 0 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sensor-card h3::before {
  content: '\f6c1';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: #388e3c;
  font-size: 0.9rem;
}

.sensor-card p {
  margin: 0.2rem 0;
  font-size: 0.8rem;
  color: var(--text-dark);
  line-height: 1.3;
}

.sensor-card .status {
  font-weight: 500;
  text-transform: capitalize;
  padding: 0.25rem 0.5rem;
  border-radius: 0.3rem;
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sensor-card .status:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.status-safe {
  background-color: rgba(76, 175, 80, 0.2);
  border: 1px solid var(--status-safe);
}

.status-safe .status {
  color: var(--status-safe);
}

.status-neutral {
  background-color: rgba(255, 193, 7, 0.2);
  border: 1px solid var(--status-neutral);
}

.status-neutral .status {
  color: var(--status-neutral);
}

.status-contaminated {
  background-color: rgba(211, 47, 47, 0.2);
  border: 1px solid var(--status-contaminated);
}

.status-contaminated .status {
  color: var(--status-contaminated);
}

/* Usage Card */
.usage-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(8px);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #388e3c;
  flex: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.usage-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.9));
}

.usage-card:focus-within {
  outline: 2px solid #388e3c;
  outline-offset: 2px;
}

.usage-card h3 {
  font-size: 1.05rem;
  color: var(--secondary-color);
  margin: 0 0 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.usage-card h3::before {
  content: '\f080';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: #388e3c;
  font-size: 0.9rem;
}

.usage-card p {
  margin: 0.2rem 0;
  font-size: 0.8rem;
  color: var(--text-dark);
  line-height: 1.3;
}

/* Accent Line */
.sensor-card::before,
.usage-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #388e3c, var(--secondary-color));
  border-radius: 0.75rem 0.75rem 0 0;
}

/* Header Controls */
.header-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
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
  margin-right: U+00A012px;
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

/* Chart Layout */
.charts-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-wrapper {
  background: var(--background-light);
  padding: 1rem;
  border-radius: 0.5rem;
  width: 100%;
  flex: 1 1 100%;
  min-width: 280px;
  max-width: 600px;
}

.daily-chart-wrapper {
  max-width: 1200px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.monthly-chart-wrapper .chart-header {
  flex-wrap: nowrap;
}

.monthly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.chart-header h3 {
  font-size: 1.1rem;
  margin: 0;
  color: var(--secondary-color);
  font-weight: 600;
}

/* Select Controls */
.chart-controls {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  justify-content: flex-end;
  width: 100%;
  min-width: 300px;
  max-width: 400px;
}

.monthly-chart-wrapper .chart-controls {
  min-width: auto;
  max-width: none;
  width: auto;
}

.chart-controls select {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: 0.25rem;
  border: 1px solid var(--border-color);
  background-color: white;
  color: var(--text-dark);
  flex: 1;
  min-width: 100px;
  max-width: 140px;
}

.monthly-select {
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
  max-width: 100px;
  min-width: 80px;
}

.chart-content {
  position: relative;
  min-height: 250px;
  max-height: 350px;
  width: 100%;
}

.daily-chart-wrapper .chart-content {
  min-height: 350px;
  max-height: 450px;
}

canvas {
  width: 100% !important;
  height: 100% !important;
  max-height: 350px !important;
}

.daily-chart-wrapper canvas {
  min-height: 350px !important;
  max-height: 450px !important;
  height: 450px !important;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-size: 0.9rem;
}

/* Desktop - Large (4 cards in a row) */
@media (min-width: 992px) {
  .analytics-charts {
    padding: 1.5rem;
  }
  .cards-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
  }
  .charts-row {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .chart-wrapper {
    flex: 1 1 calc(50% - 0.5rem);
    max-width: 600px;
  }
  .daily-chart-wrapper {
    flex: 1 1 100%;
    max-width: 1200px;
  }
  .chart-content {
    min-height: 300px;
    max-height: 350px;
  }
  .daily-chart-wrapper .chart-content {
    min-height: 400px;
    max-height: 450px;
  }
  .daily-chart-wrapper canvas {
    max-height: 450px !important;
  }
  .chart-controls select {
    padding: 0.5rem 1rem;
  }
  .monthly-select {
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }
}

/* Tablet - Medium */
@media (min-width: 768px) and (max-width: 991.99px) {
  .cards-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .charts-row {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .chart-wrapper {
    flex: 1 1 calc(50% - 0.5rem);
    max-width: 600px;
  }
  .daily-chart-wrapper {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .chart-content {
    min-height: 300px;
    max-height: 350px;
  }
  .daily-chart-wrapper .chart-content {
    min-height: 375px;
    max-height: 400px;
  }
  .daily-chart-wrapper canvas {
    max-height: 400px !important;
  }
  .chart-header h3 {
    font-size: 1rem;
  }
  .monthly-select {
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }
}

/* Mobile - Small Devices */
@media (max-width: 575.98px) {
  .cards-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .sensor-card,
  .usage-card {
    padding: 0.75rem;
    min-height: 120px;
  }
  .sensor-card h3,
  .usage-card h3 {
    font-size: 0.95rem;
  }
  .sensor-card p,
  .usage-card p {
    font-size: 0.75rem;
  }
  .sensor-card .status {
    padding: 0.2rem 0.4rem;
    font-size: 0.75rem;
  }
  .top-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .realtime-date {
    align-self: flex-end;
    width: 100%;
    text-align: right;
  }
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .monthly-chart-wrapper .chart-header {
    flex-direction: column;
  }
  .monthly-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .chart-controls {
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
  }
  .monthly-chart-wrapper .chart-controls {
    width: 100%;
    align-items: flex-start;
  }
  .chart-controls select {
    width: 100%;
    max-width: none;
  }
  .monthly-select {
    width: 100%;
    max-width: 100px;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }
  .chart-content {
    min-height: 300px;
    max-height: 300px;
  }
  .daily-chart-wrapper .chart-content {
    min-height: 350px;
    max-height: 350px;
  }
  .daily-chart-wrapper canvas {
    min-height: 350px !important;
    max-height: 350px !important;
    height: 350px !important;
  }
  .unit-toggle {
    width: 40%;
    justify-content: space-between;
  }
  .toggle-button {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

/* Extra Small Screens */
@media (max-width: 400px) {
  .cards-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .sensor-card,
  .usage-card {
    padding: 0.65rem;
    min-height: 110px;
  }
  .sensor-card h3,
  .usage-card h3 {
    font-size: 0.9rem;
  }
  .sensor-card p,
  .usage-card p {
    font-size: 0.7rem;
  }
  .chart-content {
    min-height: 280px;
    max-height: 280px;
  }
  .daily-chart-wrapper .chart-content {
    min-height: 320px;
    max-height: 320px;
  }
  .daily-chart-wrapper canvas {
    min-height: 320px !important;
    max-height: 320px !important;
    height: 320px !important;
  }
  .chart-header h3 {
    font-size: 1rem;
  }
  .monthly-select {
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }
}
</style>

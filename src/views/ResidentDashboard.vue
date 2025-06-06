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
        <p class="realtime-date">{{ currentDate }}</p>
      </div>

      <!-- Cards Row -->
      <div class="cards-row">
        <div class="sensor-card" :class="tdsStatusClass">
          <h3>Water Quality</h3>
          <p><strong>TDS:</strong> {{ latestData.tds_ppm }} ppm <span class="status">({{ tdsStatus }})</span></p>
          <p><strong>Conductivity:</strong> {{ latestData.us_cm }} µS/cm</p>
          <p><strong>pH:</strong> {{ latestData.ph || 'N/A' }} <span class="status">({{ phStatus }})</span></p>
        </div>
        <div class="usage-card">
          <h3>Average Daily Usage</h3>
          <p><strong>Liters:</strong> {{ todayTotal.liters.toFixed(2) }} liters</p>
          <p><strong>Cubic Meters:</strong> {{ todayTotal.cubic.toFixed(4) }} m³</p>
        </div>
        <div class="usage-card">
          <h3>Average Monthly Usage</h3>
          <p><strong>Liters:</strong> {{ monthlyTotal.liters.toFixed(2) }} liters</p>
          <p><strong>Cubic Meters:</strong> {{ monthlyTotal.cubic.toFixed(4) }} m³</p>
        </div>
        <div class="usage-card">
          <h3>Average Yearly Usage</h3>
          <p><strong>Liters:</strong> {{ yearlyTotal.liters.toFixed(2) }} liters</p>
          <p><strong>Cubic Meters:</strong> {{ yearlyTotal.cubic.toFixed(4) }} m³</p>
        </div>
        <div class="usage-card total-cubic">
          <h3>Total Cubic Usage</h3>
         
          <p><strong>Liters:</strong> {{ (totalCubicUsage * 1000).toFixed(2) }} liters</p>
           <p><strong>Cubic Meters:</strong> {{ totalCubicUsage.toFixed(4) }} m³</p>
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

    <!-- Add the alert modal -->
    <div v-if="showAlert" class="alert-modal-overlay">
      <div class="alert-modal">
        <div class="alert-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>High Water Usage Alert</h3>
        </div>
        <div class="alert-content">
          <p>Your water usage has exceeded the daily threshold!</p>
          <div class="usage-details">
            <div class="usage-item">
              <span class="label">Current Usage:</span>
              <span class="value">{{ currentUsage.toFixed(2) }} m³</span>
            </div>
            <div class="usage-item">
              <span class="label">Daily Threshold:</span>
              <span class="value">{{ thresholdValue.toFixed(2) }} m³</span>
            </div>
          </div>
          <div class="alert-message">
            <i class="fas fa-info-circle"></i>
            <p>Please check for any water leaks or unnecessary water consumption.</p>
          </div>
        </div>
        <div class="alert-footer">
          <button @click="dismissAlert" class="dismiss-button">
            <i class="fas fa-check"></i> Acknowledge
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import Chart from 'chart.js/auto';

export default {
  name: 'ResidentDashboardView',
  setup() {
    const sensorDataList = ref([]);
    const dailyChartData = ref([]);
    const monthlyChartData = ref([]);
    const yearlyChartData = ref([]);
    const totalUsage = ref(0);
    const totalCubicUsage = ref(0);
    const latestData = ref({ tds_ppm: 0, us_cm: 0, ph: 0 });
    const tdsStatus = ref('safe');
    const tdsStatusClass = ref('status-safe');
    const phStatus = ref('Neutral');
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
    const checkInterval = ref(null);
    const showAlert = ref(false);
    const currentUsage = ref(0);
    const thresholdValue = ref(0);

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
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
            const isValidPh = data.ph === undefined || (typeof data.ph === 'number' && !isNaN(data.ph));
            if (!isValidTimestamp || !isValidLiters || !isValidTds || !isValidUsCm || !isValidPh) {
              console.warn('Invalid sensor data:', data);
              return null;
            }
            return {
              id: data.id,
              liters: data.liters,
              tds_ppm: data.tds_ppm,
              us_cm: data.us_cm,
              ph: data.ph,
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
          checkThreshold(); // Check threshold whenever new data arrives
        }, (error) => {
          console.error('Error in real-time listener:', error);
          error.value = 'Failed to load sensor data: ' + error.message;
        });

        // Store the unsubscribe function to clean up later
        return unsubscribe;
      } catch (err) {
        console.error('Error setting up real-time listener:', err.message, err.code);
        error.value = 'Failed to load sensor data: ' + err.message;
      }
    };

    // Update chart data
    const updateChartData = () => {
      totalUsage.value = sensorDataList.value.reduce((sum, data) => sum + data.liters, 0) * (unit.value === 'cubic' ? 0.001 : 1);
      totalCubicUsage.value = sensorDataList.value.reduce((sum, data) => sum + data.liters, 0) / 1000;

      const sortedData = sensorDataList.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (sortedData.length > 0) {
        latestData.value = {
          tds_ppm: sortedData[0].tds_ppm,
          us_cm: sortedData[0].us_cm,
          ph: sortedData[0].ph
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
        if (latestData.value.ph) {
          if (latestData.value.ph > 7) phStatus.value = 'Alkaline';
          else if (latestData.value.ph >= 6.5) phStatus.value = 'Neutral';
          else phStatus.value = 'Acidic';
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
      const isBar = isYearly;

      chartInstanceRef.value = new Chart(ctx, {
        type: isBar ? 'bar' : 'line',
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
            backgroundColor: isBar ? 'rgba(76, 175, 80, 0.8)' : 'rgba(76, 175, 80, 0.2)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: isBar ? 1 : 2,
            fill: isBar ? false : {
              target: 'origin',
              above: 'rgba(76, 175, 80, 0.1)'
            },
            tension: isBar ? 0 : 0.4,
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
      
      return () => {
        clearInterval(dateIntervalId);
      };
    });

    onUnmounted(() => {
      if (dailyChartInstance.value) dailyChartInstance.value.destroy();
      if (monthlyChartInstance.value) monthlyChartInstance.value.destroy();
      if (yearlyChartInstance.value) yearlyChartInstance.value.destroy();
    });

    const checkThreshold = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log('No authenticated user found');
          return;
        }

        // Get user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          console.log('User document does not exist');
          return;
        }
        
        const userData = userDoc.data();
        const deviceId = userData.deviceId;
        console.log('User device ID:', deviceId);

        if (!deviceId) {
          console.log('No device ID found for user');
          return;
        }

        // Get threshold settings
        const thresholdDoc = await getDoc(doc(db, 'threshold', user.uid));
        if (!thresholdDoc.exists()) {
          console.log('Threshold document does not exist');
          return;
        }
        
        const threshold = thresholdDoc.data();
        console.log('Threshold settings:', threshold);

        if (!threshold.notifyOnThreshold) {
          console.log('Threshold notifications are disabled');
          return;
        }

        if (typeof threshold.dailyThresholdCubicMeters !== 'number') {
          console.log('Invalid threshold value');
          return;
        }

        // Get today's usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate current usage from sensorDataList
        const totalUsage = sensorDataList.value
          .filter(data => {
            const timestamp = new Date(data.timestamp);
            return timestamp >= today && typeof data.liters === 'number';
          })
          .reduce((sum, data) => sum + data.liters, 0);

        const usageInCubicMeters = totalUsage / 1000;
        console.log('Current usage:', usageInCubicMeters, 'm³');
        console.log('Threshold:', threshold.dailyThresholdCubicMeters, 'm³');

        // Show alert if threshold is exceeded
        if (usageInCubicMeters >= threshold.dailyThresholdCubicMeters) {
          console.log('Threshold exceeded! Showing alert...');
          showThresholdAlert(usageInCubicMeters, threshold.dailyThresholdCubicMeters);
        } else {
          console.log('Usage is within threshold');
        }
      } catch (error) {
        console.error('Error checking threshold:', error);
      }
    };

    const dismissAlert = () => {
      showAlert.value = false;
    };

    const showThresholdAlert = (usage, threshold) => {
      currentUsage.value = usage;
      thresholdValue.value = threshold;
      showAlert.value = true;
    };

    return {
      sensorDataList,
      dailyChartData,
      monthlyChartData,
      yearlyChartData,
      totalUsage,
      totalCubicUsage,
      latestData,
      tdsStatus,
      tdsStatusClass,
      phStatus,
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
      checkInterval,
      showAlert,
      currentUsage,
      thresholdValue,
      dismissAlert,
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

/* pH Status Colors 
.status-acidic {
  color: #d32f2f;
}

.status-neutral {
  color: #ffc107;
}*/

.status-alkaline {
  color: #4caf50;
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

/* Total Cubic Card Special Styling */
.total-cubic {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05));
  border-left: 4px solid #2e7d32;
}

.total-cubic h3::before {
  content: '\f080';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: #2e7d32;
  font-size: 0.9rem;
}

.total-cubic:hover {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.1));
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

/* Chart Layout */
.charts-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
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
  flex: 1 1 100%;
}

.monthly-chart-wrapper,
.yearly-chart-wrapper {
  flex: 1 1 calc(50% - 0.5rem);
  max-width: calc(50% - 0.5rem);
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
  max-height: 450px !important;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-size: 0.9rem;
}

/* Desktop - Large */
@media (min-width: 992px) {
  .analytics-charts {
    padding: 1.5rem;
  }
  .cards-row {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
  .monthly-chart-wrapper,
  .yearly-chart-wrapper {
    flex: 1 1 calc(50% - 0.5rem);
    max-width: calc(50% - 0.5rem);
  }
  .monthly-chart-wrapper .chart-content,
  .yearly-chart-wrapper .chart-content {
    min-height: 350px;
    max-height: 450px;
  }
  .monthly-chart-wrapper canvas,
  .yearly-chart-wrapper canvas {
    max-height: 450px !important;
  }
}

/* Tablet - Medium */
@media (min-width: 768px) and (max-width: 991.99px) {
  .cards-row {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
  .monthly-chart-wrapper,
  .yearly-chart-wrapper {
    flex: 1 1 calc(50% - 0.5rem);
    max-width: calc(50% - 0.5rem);
  }
  .monthly-chart-wrapper .chart-content,
  .yearly-chart-wrapper .chart-content {
    min-height: 300px;
    max-height: 400px;
  }
  .monthly-chart-wrapper canvas,
  .yearly-chart-wrapper canvas {
    max-height: 400px !important;
  }
}

/* Mobile - Small Devices */
@media (max-width: 767.99px) {
  .cards-row {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
  .charts-row {
    flex-direction: column;
  }
  .chart-wrapper {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .monthly-chart-wrapper,
  .yearly-chart-wrapper {
    flex: 1 1 100%;
    max-width: 100%;
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
    width: 45%;
    justify-content: flex-end;
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
}

/* Alert Modal Styles */
.alert-modal-overlay {
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
  animation: fadeIn 0.3s ease-out;
}

.alert-modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.alert-header {
  background: #f44336;
  color: white;
  padding: 1rem;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-header i {
  font-size: 1.5rem;
}

.alert-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.alert-content {
  padding: 1.5rem;
}

.alert-content p {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
}

.usage-details {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.usage-item:last-child {
  margin-bottom: 0;
}

.usage-item .label {
  color: #666;
  font-size: 0.9rem;
}

.usage-item .value {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.alert-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #e3f2fd;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.alert-message i {
  color: #1976d2;
  font-size: 1.1rem;
  margin-top: 0.1rem;
}

.alert-message p {
  margin: 0;
  color: #1976d2;
  font-size: 0.9rem;
  line-height: 1.4;
}

.alert-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.dismiss-button {
  background: #4caf50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.dismiss-button:hover {
  background: #388e3c;
}

.dismiss-button i {
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
```
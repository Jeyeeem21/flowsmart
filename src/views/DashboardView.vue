<template>
  <div class="analytics-charts">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <!-- Error Message Display -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Top Header with Real-Time Date -->
    <div class="top-header">
      <h2>Analytics</h2>
      <p class="realtime-date"> {{ currentTime }}</p>
    </div>

    <!-- Cards Row -->
    <div class="cards-row">
      <!-- TDS Sensor Card -->
      <div class="sensor-card" :class="tdsStatusClass">
        <h3>Water Quality</h3>
        <p><strong>TDS:</strong> {{ latestData.tds_ppm }} ppm <span class="status">({{ tdsStatus }})</span></p>
        <p><strong>Conductivity:</strong> {{ latestData.us_cm }} µS/cm</p>
        <p><strong>pH:</strong> {{ latestData.ph || 'N/A' }} <span class="status">({{ phStatus }})</span></p>
      </div>
      <!-- Today's Total Usage Card -->
      <div class="usage-card">
        <h3>Average Daily Usage</h3>
        <p><strong>Liters:</strong> {{ todayTotal.liters.toFixed(2) }} liters</p>
        <p><strong>Cubic Meters:</strong> {{ todayTotal.cubic.toFixed(4) }} m³</p>
      </div>
      <!-- Monthly Usage Card -->
      <div class="usage-card">
        <h3>Average Monthly Usage</h3>
        <p><strong>Liters:</strong> {{ monthlyTotal.liters.toFixed(2) }} liters</p>
        <p><strong>Cubic Meters:</strong> {{ monthlyTotal.cubic.toFixed(4) }} m³</p>
      </div>
      <!-- Yearly Usage Card -->
      <div class="usage-card">
        <h3>Average Yearly Usage</h3>
        <p><strong>Liters:</strong> {{ yearlyTotal.liters.toFixed(2) }} liters</p>
        <p><strong>Cubic Meters:</strong> {{ yearlyTotal.cubic.toFixed(4) }} m³</p>
      </div>
      <!-- Total Cubic Usage Card -->
      <div class="usage-card total-cubic">
        <h3>Total Cubic Usage</h3>
        <p><strong>All Time:</strong> {{ totalCubicUsage.toFixed(4) }} m³</p>
        <p><strong>Liters:</strong> {{ (totalCubicUsage * 1000).toFixed(2) }} liters</p>
      </div>
    </div>

    <!-- Header Controls -->
    <div class="header-controls">
     
      <div class="unit-toggle">
        <span class="unit-label">Unit:</span>
        <div class="toggle-container">
          <button 
            class="toggle-button" 
            :class="{ active: unit === 'cubic' }" 
            @click="handleUnitChange('cubic')"
          >
            Cubic
          </button>
          <button 
            class="toggle-button" 
            :class="{ active: unit === 'liter' }" 
            @click="handleUnitChange('liter')"
          >
            Liter
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>Loading data...</p>
    </div>

    <!-- Daily Chart -->
    <div class="chart-wrapper daily-chart-wrapper">
      <div class="chart-header">
        <h3>Daily {{ unitLabel }} Usage - {{ selectedMonthName }} {{ selectedYear }}</h3>
        <div class="chart-controls">
          <select v-model="selectedMonth" @change="handleFilterChange">
            <option v-for="(month, index) in months" :value="index" :key="month">{{ month }}</option>
          </select>
          <select v-model="selectedYear" @change="handleFilterChange">
            <option v-for="year in availableYears" :value="year" :key="year">{{ year }}</option>
          </select>
        </div>
      </div>
      <div class="chart-content">
        <canvas ref="dailyChartContainer"></canvas>
      </div>
    </div>

    <!-- Monthly & Yearly Charts -->
    <div class="charts-row">
      <!-- Monthly Chart -->
      <div class="chart-wrapper monthly-chart-wrapper">
        <div class="chart-header">
          <h3>Monthly {{ unitLabel }} Usage - {{ selectedYearForMonthly }}</h3>
          <select v-model="selectedYearForMonthly" @change="handleFilterChange">
            <option v-for="year in availableYears" :value="year" :key="year">{{ year }}</option>
          </select>
        </div>
        <div class="chart-content">
          <canvas ref="monthlyChartContainer"></canvas>
        </div>
      </div>
      <!-- Yearly Chart -->
      <div class="chart-wrapper yearly-chart-wrapper">
        <div class="chart-header">
          <h3>Yearly {{ unitLabel }} Usage</h3>
        </div>
        <div class="chart-content">
          <canvas ref="yearlyChartContainer"></canvas>
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
          <p>Total water usage has exceeded the daily threshold!</p>
          <div class="usage-details">
            <div class="usage-item">
              <span class="label">Total Usage Today:</span>
              <span class="value">{{ currentUsage.toFixed(2) }} m³</span>
            </div>
            <div class="usage-item">
              <span class="label">Daily Threshold:</span>
              <span class="value">{{ thresholdValue.toFixed(2) }} m³</span>
            </div>
            <div class="usage-item">
              <span class="label">Notified Admin:</span>
              <span class="value">{{ alertAdminName }}</span>
            </div>
          </div>
          <div class="alert-message">
            <i class="fas fa-info-circle"></i>
            <p>Please check the system for any unusual consumption patterns.</p>
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
import { db, auth } from '@/firebase/config';
import { collection, getDocs, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Chart, LineController, BarController, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js';

Chart.register(LineController, BarController, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Tooltip, Filler);

export default {
  name: 'Analytics',
  data() {
    return {
      unit: 'cubic',
      loading: false,
      errorMessage: '',
      selectedMonth: new Date().getMonth(),
      selectedYear: new Date().getFullYear(),
      selectedYearForMonthly: new Date().getFullYear(),
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      availableYears: [],
      allData: [],
      latestData: { tds_ppm: 0, us_cm: 0, ph: 0, liters: 0, timestamp: '' },
      todayTotal: { liters: 0, cubic: 0 },
      monthlyTotal: { liters: 0, cubic: 0 },
      yearlyTotal: { liters: 0, cubic: 0 },
      totalCubicUsage: 0,
      dailyChartData: [],
      monthlyChartData: [],
      yearlyChartData: [],
      dailyChart: null,
      monthlyChart: null,
      yearlyChart: null,
      refreshInterval: null,
      userRole: null,
      userDeviceId: null,
      showAlert: false,
      currentUsage: 0,
      thresholdValue: 0,
      alertAdminName: '',
      unsubscribeSensorData: null,
      unsubscribeLatestData: null,
    };
  },
  computed: {
    unitLabel() {
      return this.unit === 'cubic' ? 'Cubic Meter' : 'Liter';
    },
    selectedMonthName() {
      return this.months[this.selectedMonth];
    },
    formattedTimestamp() {
      return this.latestData.timestamp
        ? new Date(this.latestData.timestamp).toLocaleString()
        : 'N/A';
    },
    tdsStatus() {
      const tds = this.latestData.tds_ppm;
      if (tds > 1000) return 'Contaminated';
      if (tds >= 500) return 'Neutral';
      return 'Safe';
    },
    tdsStatusClass() {
      const tds = this.latestData.tds_ppm;
      if (tds > 1000) return 'status-contaminated';
      if (tds >= 500) return 'status-neutral';
      return 'status-safe';
    },
    phStatus() {
      const ph = this.latestData.ph;
      if (ph > 7) return 'Alkaline';
      if (ph >= 6.5) return 'Neutral';
      return 'Acidic';
    },
    currentTime() {
  const date = new Date();
  return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
  },
  methods: {
    resetData() {
      this.allData = [];
      this.processData([]);
      this.latestData = { tds_ppm: 0, us_cm: 0, ph: 0, liters: 0, timestamp: '' };
      this.todayTotal = { liters: 0, cubic: 0 };
      this.monthlyTotal = { liters: 0, cubic: 0 };
      this.yearlyTotal = { liters: 0, cubic: 0 };
    },
    handleUnitChange(unit) {
      this.unit = unit;
      // Destroy existing charts before processing new data
      this.destroyCharts();
      // Wait for next tick to ensure DOM is updated
      this.$nextTick(() => {
        this.processData(this.allData);
      });
    },
    destroyCharts() {
      if (this.dailyChart) {
        this.dailyChart.destroy();
        this.dailyChart = null;
      }
      if (this.monthlyChart) {
        this.monthlyChart.destroy();
        this.monthlyChart = null;
      }
      if (this.yearlyChart) {
        this.yearlyChart.destroy();
        this.yearlyChart = null;
      }
    },
    handleFilterChange() {
      this.processData(this.allData);
    },
    async fetchData() {
      this.loading = true;
      this.errorMessage = '';
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user is logged in');

        // Get user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) throw new Error('User document not found');
        
        const userData = userDoc.data();
        this.userRole = userData.role || 'resident';
        this.userDeviceId = userData.deviceId || null;

        // For residents, verify deviceId exists
        if (this.userRole === 'resident' && !this.userDeviceId) {
          this.resetData();
          throw new Error('No water meter device assigned to your account. Please contact support.');
        }

        // Build query based on user role
        let q;
        if (this.userRole === 'admin') {
          q = query(collection(db, 'SensorData'), orderBy('timestamp', 'desc'));
        } else {
          q = query(
            collection(db, 'SensorData'),
            where('id', '==', this.userDeviceId),
            orderBy('timestamp', 'desc')
          );
        }

        // Set up real-time listener for sensor data
        this.unsubscribeSensorData = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            this.resetData();
            this.errorMessage = 'No water usage data available yet for your device.';
            return;
          }

          // Process data
          this.allData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          this.processData(this.allData);
        }, (error) => {
          console.error('Error in sensor data listener:', error);
          this.errorMessage = 'Failed to load data. Please try again.';
        });

        // Set up real-time listener for latest data
        const latestQuery = this.userRole === 'admin'
          ? query(collection(db, 'SensorData'), orderBy('timestamp', 'desc'), limit(1))
          : query(
              collection(db, 'SensorData'),
              where('id', '==', this.userDeviceId),
              orderBy('timestamp', 'desc'),
              limit(1)
            );

        this.unsubscribeLatestData = onSnapshot(latestQuery, (snapshot) => {
          if (!snapshot.empty) {
            this.latestData = snapshot.docs[0].data();
          }
        }, (error) => {
          console.error('Error in latest data listener:', error);
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        
        let errorMessage = 'Failed to load data. Please try again.';
        if (error.message.includes('No water meter device')) {
          errorMessage = error.message;
        } else if (error.message.includes('No water usage data')) {
          errorMessage = error.message;
        } else if (error.code === 'permission-denied') {
          errorMessage = 'You do not have permission to view this data.';
        }

        this.errorMessage = errorMessage;
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);

      } finally {
        this.loading = false;
      }
    },
    processData(data) {
      const dailyMap = {};
      const monthlyMap = {};
      const yearlyMap = {};

      let todayLiters = 0;
      let monthlyLiters = 0;
      let yearlyLiters = 0;
      let totalLiters = 0;

      const today = new Date();
      const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      const monthKey = `${this.selectedYear}-${this.selectedMonth}`;
      const yearKey = `${this.selectedYearForMonthly}`;

      const yearsSet = new Set();

      data.forEach(entry => {
        if (!entry.timestamp || !entry.liters) return;

        const date = new Date(entry.timestamp);
        const liters = parseFloat(entry.liters);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        const dKey = `${year}-${month}-${day}`;
        const mKey = `${year}-${month}`;
        const yKey = `${year}`;

        yearsSet.add(year);

        if (!dailyMap[dKey]) dailyMap[dKey] = 0;
        dailyMap[dKey] += liters;

        if (!monthlyMap[mKey]) monthlyMap[mKey] = 0;
        monthlyMap[mKey] += liters;

        if (!yearlyMap[yKey]) yearlyMap[yKey] = 0;
        yearlyMap[yKey] += liters;

        if (dKey === todayKey) todayLiters += liters;
        if (mKey === monthKey) monthlyLiters += liters;
        if (yKey === yearKey) yearlyLiters += liters;
        
        totalLiters += liters;
      });

      this.availableYears = Array.from(yearsSet).sort();
      this.totalCubicUsage = totalLiters / 1000;

      this.todayTotal = {
        liters: todayLiters,
        cubic: todayLiters / 1000
      };
      this.monthlyTotal = {
        liters: monthlyLiters,
        cubic: monthlyLiters / 1000
      };
      this.yearlyTotal = {
        liters: yearlyLiters,
        cubic: yearlyLiters / 1000
      };

      const daysInMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
      const dailyData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${this.selectedYear}-${this.selectedMonth}-${day}`;
        const value = dailyMap[key] || 0;
        dailyData.push([key, value]);
      }
      this.dailyChartData = dailyData.sort(([a], [b]) => new Date(a) - new Date(b));

      const monthlyData = [];
      for (let month = 0; month < 12; month++) {
        const key = `${this.selectedYearForMonthly}-${month}`;
        const value = monthlyMap[key] || 0;
        monthlyData.push([key, value]);
      }
      this.monthlyChartData = monthlyData.sort(([a], [b]) => new Date(a) - new Date(b));

      this.yearlyChartData = Object.entries(yearlyMap).sort(([a], [b]) => a - b);

      this.renderCharts();
    },
    renderCharts() {
      // First destroy any existing charts
      this.destroyCharts();

      // Wait for next tick to ensure DOM is ready
      this.$nextTick(() => {
        if (!this.$refs.dailyChartContainer || !this.$refs.monthlyChartContainer || !this.$refs.yearlyChartContainer) {
          console.warn('Canvas elements are not available yet.');
          return;
        }

        // Ensure canvas elements are properly initialized
        const dailyCtx = this.$refs.dailyChartContainer.getContext('2d');
        const monthlyCtx = this.$refs.monthlyChartContainer.getContext('2d');
        const yearlyCtx = this.$refs.yearlyChartContainer.getContext('2d');

        if (!dailyCtx || !monthlyCtx || !yearlyCtx) {
          console.error('Failed to get 2D context for one or more chart canvases');
          return;
        }

        if (!this.dailyChartData.length || !this.monthlyChartData.length || !this.yearlyChartData.length) {
          console.warn('Chart data is empty or invalid.');
          return;
        }

        const getValues = (dataArr) => dataArr.map(([_, v]) => this.unit === 'cubic' ? v / 1000 : v);
        const isMobile = window.innerWidth <= 575.98;

        try {
          // Daily Chart
          const dailyData = {
            labels: this.dailyChartData.map(([k]) => {
              const [, , day] = k.split('-');
              return parseInt(day);
            }),
            datasets: [{
              label: `Daily ${this.unitLabel} Usage`,
              data: getValues(this.dailyChartData),
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderColor: 'rgba(76, 175, 80, 1)',
              fill: 'origin',
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            }]
          };

          this.dailyChart = new Chart(dailyCtx, {
            type: 'line',
            data: dailyData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 0
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => {
                      const index = context.dataIndex;
                      const currentValue = context.raw;
                      const prevValue = index > 0 ? getValues(this.dailyChartData)[index - 1] : null;
                      const labels = [`${context.dataset.label}: ${currentValue.toFixed(2)} ${this.unitLabel}`];
                      if (prevValue !== null && prevValue !== 0) {
                        const change = ((currentValue - prevValue) / prevValue) * 100;
                        const direction = change >= 0 ? '↑' : '↓';
                        labels.push(`Change: ${direction}${Math.abs(change).toFixed(2)}% from previous day`);
                      } else {
                        labels.push(`Change: ↑∞% (previous value was 0)`);
                      }
                      return labels;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: this.unitLabel }
                },
                x: {
                  title: { display: true, text: 'Day' },
                  ticks: {
                    stepSize: isMobile ? 2 : 1,
                    callback: function(value) {
                      return isMobile ? (value % 2 === 0 ? value + 1 : null) : value + 1;
                    }
                  }
                }
              }
            }
          });

          // Monthly Chart
          const monthlyData = {
            labels: this.monthlyChartData.map(([k]) => this.months[parseInt(k.split('-')[1])]),
            datasets: [{
              label: `Monthly ${this.unitLabel} Usage`,
              data: getValues(this.monthlyChartData),
              backgroundColor: 'rgba(76, 175, 80, 0.5)',
              borderColor: 'rgba(76, 175, 80, 1)',
              borderWidth: 2,
              borderRadius: 4
            }]
          };

          this.monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: monthlyData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 0
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => {
                      const index = context.dataIndex;
                      const currentValue = context.raw;
                      const prevValue = index > 0 ? getValues(this.monthlyChartData)[index - 1] : null;
                      const labels = [`${context.dataset.label}: ${currentValue.toFixed(2)} ${this.unitLabel}`];
                      if (prevValue !== null && prevValue !== 0) {
                        const change = ((currentValue - prevValue) / prevValue) * 100;
                        const direction = change >= 0 ? '↑' : '↓';
                        labels.push(`Change: ${direction}${Math.abs(change).toFixed(2)}% from previous month`);
                      } else {
                        labels.push(`Change: ↑∞% (previous value was 0)`);
                      }
                      return labels;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: this.unitLabel }
                },
                x: {
                  title: { display: true, text: 'Month' }
                }
              }
            }
          });

          // Yearly Chart
          const yearlyData = {
            labels: this.yearlyChartData.map(([k]) => k),
            datasets: [{
              label: `Yearly ${this.unitLabel} Usage`,
              data: getValues(this.yearlyChartData),
              backgroundColor: 'rgba(76, 175, 80, 0.8)',
              borderColor: 'rgba(76, 175, 80, 1)',
              borderWidth: 2,
              borderRadius: 4
            }]
          };

          this.yearlyChart = new Chart(yearlyCtx, {
            type: 'bar',
            data: yearlyData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 0
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => {
                      const index = context.dataIndex;
                      const currentValue = context.raw;
                      const prevValue = index > 0 ? getValues(this.yearlyChartData)[index - 1] : null;
                      const labels = [`${context.dataset.label}: ${currentValue.toFixed(2)} ${this.unitLabel}`];
                      if (prevValue !== null && prevValue !== 0) {
                        const change = ((currentValue - prevValue) / prevValue) * 100;
                        const direction = change >= 0 ? '↑' : '↓';
                        labels.push(`Change: ${direction}${Math.abs(change).toFixed(2)}% from previous year`);
                      } else {
                        labels.push(`Change: ↑∞% (previous value was 0)`);
                      }
                      return labels;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: this.unitLabel }
                },
                x: {
                  title: { display: true, text: 'Year' }
                }
              }
            }
          });
        } catch (error) {
          console.error('Error creating charts:', error);
        }
      });
    },
    dismissAlert() {
      this.showAlert = false;
    },
    showThresholdAlert(usage, threshold, adminName) {
      if (typeof usage !== 'number' || typeof threshold !== 'number') {
        console.error('Invalid usage or threshold values:', { usage, threshold });
        return;
      }

      this.currentUsage = usage;
      this.thresholdValue = threshold;
      this.alertAdminName = adminName || 'Unknown Admin';
      this.showAlert = true;
    },
    async checkThreshold() {
      try {
        console.log('Starting threshold check...');
        const user = auth.currentUser;
        if (!user) {
          console.log('No authenticated user found');
          return;
        }
        console.log('Current user:', user.uid);

        // Get all users first
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log('Total users found:', usersSnapshot.size);

        // Get all admin users
        const adminUsers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === 'admin');
        
        console.log('Number of admin users found:', adminUsers.length);

        // Get threshold settings for each admin
        const adminThresholds = new Map();
        for (const admin of adminUsers) {
          const thresholdDoc = await getDoc(doc(db, 'threshold', admin.id));
          if (thresholdDoc.exists()) {
            const thresholdData = thresholdDoc.data();
            if (thresholdData.notifyOnThreshold && typeof thresholdData.dailyThresholdCubicMeters === 'number') {
              adminThresholds.set(admin.id, {
                ...admin,
                threshold: thresholdData.dailyThresholdCubicMeters
              });
            }
          }
        }
        
        console.log('Number of admins with valid thresholds:', adminThresholds.size);

        // Get all sensor data
        const sensorSnapshot = await getDocs(collection(db, 'SensorData'));
        console.log(`Found ${sensorSnapshot.size} total sensor readings`);

        // Calculate total usage for today across all devices
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('Checking usage for date:', today.toISOString());
        
        let totalUsage = 0;
        let todayReadings = 0;

        // Sum up all readings for today
        sensorSnapshot.forEach(doc => {
          const data = doc.data();
          const timestamp = new Date(data.timestamp);
          if (timestamp >= today && typeof data.liters === 'number') {
            totalUsage += data.liters;
            todayReadings++;
          }
        });

        console.log(`Found ${todayReadings} total readings for today`);
        const usageInCubicMeters = totalUsage / 1000;
        console.log(`Total water usage today:`, usageInCubicMeters, 'm³');

        // Check against each admin's threshold
        for (const [adminId, adminData] of adminThresholds) {
          const adminThreshold = adminData.threshold;
          console.log(`Checking against admin ${adminData.fullName}'s threshold:`, adminThreshold, 'm³');

          // Show alert if threshold is exceeded for this admin
          if (usageInCubicMeters >= adminThreshold) {
            console.log(`Threshold exceeded for admin ${adminData.fullName}! Showing alert...`);
            this.showThresholdAlert(
              usageInCubicMeters, 
              adminThreshold, 
              adminData.fullName || 'Unknown Admin' // Admin's name with fallback
            );
          } else {
            console.log(`Usage within threshold for admin ${adminData.fullName}`);
          }
        }
      } catch (error) {
        console.error('Error checking threshold:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.fetchData();
    });
    
    // Initial check
    this.checkThreshold();
  },
  beforeUnmount() {
    // Clean up listeners when component is unmounted
    if (this.unsubscribeSensorData) {
      this.unsubscribeSensorData();
    }
    if (this.unsubscribeLatestData) {
      this.unsubscribeLatestData();
    }
    if (this.dailyChart) this.dailyChart.destroy();
    if (this.monthlyChart) this.monthlyChart.destroy();
    if (this.yearlyChart) this.yearlyChart.destroy();
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

/* pH Status Colors */
.status-acidic {
  color: #d32f2f;
}

.status-neutral {
  color: #ffc107;
}

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
  color: #168e3c;
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

.header-controls h2 {
  font-size: 1.5rem;
  color: var(--secondary-color);
  margin: 0;
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
/* Desktop - Large */
@media (min-width: 992px) {
  .analytics-charts {
    padding: 1.5rem;
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
    min-height: 350px; /* Increased from 250px */
    max-height: 450px; /* Increased from 350px */
  }
  .monthly-chart-wrapper canvas,
  .yearly-chart-wrapper canvas {
    max-height: 450px !important; /* Increased from 350px */
  }
}
/* Tablet - Medium */
/* Tablet - Medium */
@media (min-width: 768px) and (max-width: 991.99px) {
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
    min-height: 300px; /* Slightly increased for tablets */
    max-height: 400px;
  }
  .monthly-chart-wrapper canvas,
  .yearly-chart-wrapper canvas {
    max-height: 400px !important;
  }
}

/* Mobile - Small Devices */
@media (max-width: 575.98px) {
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
}

/* Extra Small Screens */
@media (max-width: 400px) {
  .cards-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .total-cubic {
    grid-column: span 1;
  }
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
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
      </div>
      <!-- Today's Total Usage Card -->
      <div class="usage-card">
        <h3>Daily Usage</h3>
        <p><strong>Liters:</strong> {{ todayTotal.liters.toFixed(2) }} liters</p>
        <p><strong>Cubic Meters:</strong> {{ todayTotal.cubic.toFixed(4) }} m³</p>
      </div>
      <!-- Monthly Usage Card -->
      <div class="usage-card">
        <h3>Monthly Usage</h3>
        <p><strong>Liters:</strong> {{ monthlyTotal.liters.toFixed(2) }} liters</p>
        <p><strong>Cubic Meters:</strong> {{ monthlyTotal.cubic.toFixed(4) }} m³</p>
      </div>
      <!-- Yearly Usage Card -->
      <div class="usage-card">
        <h3>Yearly Usage</h3>
        <p><strong>Liters:</strong> {{ yearlyTotal.liters.toFixed(2) }} liters</p>
        <p><strong>Cubic Meters:</strong> {{ yearlyTotal.cubic.toFixed(4) }} m³</p>
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
  </div>
</template>
<script>
import { db, auth } from '@/firebase/config';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
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
      latestData: { tds_ppm: 0, us_cm: 0, liters: 0, timestamp: '' },
      todayTotal: { liters: 0, cubic: 0 },
      monthlyTotal: { liters: 0, cubic: 0 },
      yearlyTotal: { liters: 0, cubic: 0 },
      dailyChartData: [],
      monthlyChartData: [],
      yearlyChartData: [],
      dailyChart: null,
      monthlyChart: null,
      yearlyChart: null,
      refreshInterval: null,
      userRole: null,
      userDeviceId: null
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
    currentTime() {
      const date = new Date();
      return date.toLocaleDateString();
    }
  },
  methods: {
    resetData() {
      this.allData = [];
      this.processData([]);
      this.latestData = { tds_ppm: 0, us_cm: 0, liters: 0, timestamp: '' };
      this.todayTotal = { liters: 0, cubic: 0 };
      this.monthlyTotal = { liters: 0, cubic: 0 };
      this.yearlyTotal = { liters: 0, cubic: 0 };
    },
    handleUnitChange(unit) {
      this.unit = unit;
      this.processData(this.allData);
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

        const snapshot = await getDocs(q);
        console.log('Resident query snapshot:', snapshot.docs.map(doc => doc.data()));
        
        if (snapshot.empty) {
          this.resetData();
          throw new Error('No water usage data available yet for your device.');
        }

        // Process data
        this.allData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get latest data point
        const latestQuery = this.userRole === 'admin'
          ? query(collection(db, 'SensorData'), orderBy('timestamp', 'desc'), limit(1))
          : query(
              collection(db, 'SensorData'),
              where('id', '==', this.userDeviceId),
              orderBy('timestamp', 'desc'),
              limit(1)
            );

        const latestSnapshot = await getDocs(latestQuery);
        if (!latestSnapshot.empty) {
          this.latestData = latestSnapshot.docs[0].data();
        }

        this.processData(this.allData);

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
      });

      this.availableYears = Array.from(yearsSet).sort();

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
      if (!this.$refs.dailyChartContainer || !this.$refs.monthlyChartContainer || !this.$refs.yearlyChartContainer) {
        console.warn('Canvas elements are not available yet.');
        return;
      }

      if (!this.dailyChartData.length || !this.monthlyChartData.length || !this.yearlyChartData.length) {
        console.warn('Chart data is empty or invalid.');
        return;
      }

      const getValues = (dataArr) => dataArr.map(([_, v]) => this.unit === 'cubic' ? v / 1000 : v);
      const isMobile = window.innerWidth <= 575.98;

      // Daily Chart
      if (this.dailyChart) this.dailyChart.destroy();
      this.dailyChart = new Chart(this.$refs.dailyChartContainer, {
        type: 'line',
        data: {
          labels: this.dailyChartData.map(([k]) => {
            const [, , day] = k.split('-');
            return parseInt(day);
          }),
          datasets: [{
            label: `Daily ${this.unitLabel} Usage`,
            data: getValues(this.dailyChartData),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
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
      if (this.monthlyChart) this.monthlyChart.destroy();
      this.monthlyChart = new Chart(this.$refs.monthlyChartContainer, {
        type: 'bar',
        data: {
          labels: this.monthlyChartData.map(([k]) => this.months[parseInt(k.split('-')[1])]),
          datasets: [{
            label: `Monthly ${this.unitLabel} Usage`,
            data: getValues(this.monthlyChartData),
            backgroundColor: 'rgba(75, 192, 192, 0.5)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
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
      if (this.yearlyChart) this.yearlyChart.destroy();
      this.yearlyChart = new Chart(this.$refs.yearlyChartContainer, {
        type: 'bar',
        data: {
          labels: this.yearlyChartData.map(([k]) => k),
          datasets: [{
            label: `Yearly ${this.unitLabel} Usage`,
            data: getValues(this.yearlyChartData),
            backgroundColor: 'rgba(153, 102, 255, 0.5)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
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
    },
    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.fetchData();
      }, 300000); // Refresh every 5 minutes
    },
    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.fetchData();
      this.startAutoRefresh();
    });
  },
  beforeUnmount() {
    this.stopAutoRefresh();
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
  .header-controls h2 {
    font-size: 1.75rem;
  }
  .chart-controls select {
    padding: 0.5rem 1rem;
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
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  .unit-toggle {
    width: 40%;
    justify-content: space-between;
  }
  .toggle-button {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .chart-controls {
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
  }
  .chart-controls select {
    width: 100%;
    max-width: none;
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
  .unit-toggle {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .unit-label {
    margin: 0;
  }
  .toggle-container {
    width: 100%;
    text-align: center;
  }
}
</style>
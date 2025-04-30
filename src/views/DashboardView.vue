```vue
<template>
  <div class="analytics-charts">
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
      <h2>Analytics</h2>
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
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'Analytics',
  data() {
    return {
      unit: 'cubic',
      loading: false,
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
      refreshInterval: null
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
    todayDate() {
      return new Date().toLocaleDateString();
    }
  },
  methods: {
    handleUnitChange(unit) {
      this.unit = unit;
      this.processData(this.allData);
    },
    handleFilterChange() {
      this.fetchData();
    },
    async fetchData() {
      this.loading = true;
      try {
        const snapshot = await getDocs(collection(db, 'SensorData'));
        if (!snapshot.empty) {
          const firebaseData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          this.allData = firebaseData;
          this.processData(firebaseData);
        } else {
          this.processData([]);
          this.latestData = { tds_ppm: 0, us_cm: 0, liters: 0, timestamp: '' };
          this.todayTotal = { liters: 0, cubic: 0 };
          this.monthlyTotal = { liters: 0, cubic: 0 };
          this.yearlyTotal = { liters: 0, cubic: 0 };
        }

        const latestQuery = query(
          collection(db, 'SensorData'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const latestSnapshot = await getDocs(latestQuery);
        if (!latestSnapshot.empty) {
          const latestDoc = latestSnapshot.docs[0].data();
          this.latestData = {
            tds_ppm: latestDoc.tds_ppm || 0,
            us_cm: latestDoc.us_cm || 0,
            liters: latestDoc.liters || 0,
            timestamp: latestDoc.timestamp || ''
          };
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please try again.");
        this.processData([]);
        this.latestData = { tds_ppm: 0, us_cm: 0, liters: 0, timestamp: '' };
        this.todayTotal = { liters: 0, cubic: 0 };
        this.monthlyTotal = { liters: 0, cubic: 0 };
        this.yearlyTotal = { liters: 0, cubic: 0 };
      } finally {
        this.loading = false;
      }
    },
    processData(data) {
      const dailyMap = {};
      const monthlyMap = {};
      const yearlyMap = {};
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();

      let todayLiters = 0;
      let monthlyLiters = 0;
      let yearlyLiters = 0;

      const todayKey = `${currentYear}-${currentMonth}-${currentDay}`;
      const monthKey = `${this.selectedYear}-${this.selectedMonth}`;
      const yearKey = `${this.selectedYearForMonthly}`;

      data.forEach(entry => {
        const date = new Date(entry.timestamp);
        if (date > now) return; // Skip future dates
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const keyDay = `${year}-${month}-${day}`;
        const keyMonth = `${year}-${month}`;
        const keyYear = `${year}`;
        const liters = entry.liters || 0;

        const value = this.unit === 'cubic' ? liters / 1000 : liters;
        if (!dailyMap[keyDay]) dailyMap[keyDay] = 0;
        dailyMap[keyDay] += value;

        if (!monthlyMap[keyMonth]) monthlyMap[keyMonth] = 0;
        monthlyMap[keyMonth] += value;

        if (!yearlyMap[keyYear]) yearlyMap[keyYear] = 0;
        yearlyMap[keyYear] += value;

        if (keyDay === todayKey) {
          todayLiters += liters;
        }
        if (keyMonth === monthKey) {
          monthlyLiters += liters;
        }
        if (keyYear === yearKey) {
          yearlyLiters += liters;
        }
      });

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

      this.availableYears = [...new Set(data.map(entry => {
        const date = new Date(entry.timestamp);
        return date.getFullYear();
      }))].filter(year => year <= currentYear).sort((a, b) => b - a);

      // Daily chart data with zeros for missing days
      const year = this.selectedYear;
      const month = this.selectedMonth;
      const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
      this.dailyChartData = [];
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date > now) break; // Stop at current date
        const key = `${year}-${month}-${day}`;
        let value = dailyMap[key] || 0;
        this.dailyChartData.push({ label: day, value, percentageChange: 'N/A' });
      }

      // Calculate percentage change for daily chart
      this.dailyChartData.forEach((data, index) => {
        if (index > 0) {
          const prevValue = this.dailyChartData[index - 1].value;
          const currentValue = data.value;
          if (prevValue !== 0) {
            data.percentageChange = ((currentValue - prevValue) / prevValue * 100).toFixed(2);
          } else {
            data.percentageChange = currentValue === 0 ? '0.00' : '∞';
          }
        }
      });

      // Monthly chart data with zeros for missing months
      this.monthlyChartData = [];
      for (let m = 0; m < 12; m++) {
        if (year === currentYear && m > currentMonth) break; // Skip future months
        const key = `${this.selectedYearForMonthly}-${m}`;
        let value = monthlyMap[key] || 0;
        this.monthlyChartData.push({ label: this.months[m], value, percentageChange: 'N/A' });
      }

      // Calculate percentage change for monthly chart
      this.monthlyChartData.forEach((data, index) => {
        if (index > 0) {
          const prevValue = this.monthlyChartData[index - 1].value;
          const currentValue = data.value;
          if (prevValue !== 0) {
            data.percentageChange = ((currentValue - prevValue) / prevValue * 100).toFixed(2);
          } else {
            data.percentageChange = currentValue === 0 ? '0.00' : '∞';
          }
        }
      });

      // Yearly chart data with zeros for missing years
      this.yearlyChartData = [];
      const years = Object.keys(yearlyMap).filter(key => parseInt(key) <= currentYear).sort();
      years.forEach(key => {
        let value = yearlyMap[key] || 0;
        this.yearlyChartData.push({ label: key, value, percentageChange: 'N/A' });
      });

      // Calculate percentage change for yearly chart
      this.yearlyChartData.forEach((data, index) => {
        if (index > 0) {
          const prevValue = this.yearlyChartData[index - 1].value;
          const currentValue = data.value;
          if (prevValue !== 0) {
            data.percentageChange = ((currentValue - prevValue) / prevValue * 100).toFixed(2);
          } else {
            data.percentageChange = currentValue === 0 ? '0.00' : '∞';
          }
        }
      });

      // Initialize with empty data if no years are available
      if (!this.yearlyChartData.length) {
        this.yearlyChartData.push({ label: currentYear.toString(), value: 0, percentageChange: 'N/A' });
      }
      if (!this.monthlyChartData.length) {
        this.monthlyChartData.push({ label: this.months[currentMonth], value: 0, percentageChange: 'N/A' });
      }
      if (!this.dailyChartData.length) {
        this.dailyChartData.push({ label: currentDay.toString(), value: 0, percentageChange: 'N/A' });
      }

      this.$nextTick(() => {
        this.updateCharts();
      });
    },
    updateCharts() {
      console.log('Updating charts...');
      console.log('Daily canvas:', this.$refs.dailyChartContainer);
      console.log('Monthly canvas:', this.$refs.monthlyChartContainer);
      console.log('Yearly canvas:', this.$refs.yearlyChartContainer);
      this.createDailyChart();
      this.createMonthlyChart();
      this.createYearlyChart();
    },
    createChart(ctx, labels, dataValues, percentageChanges, type = 'line') {
      if (!ctx) {
        console.error('Canvas context is null, cannot create chart');
        return null;
      }
      return new Chart(ctx, {
        type,
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            label: `Usage (${this.unitLabel})`,
            data: dataValues.length ? dataValues : [0],
            fill: type === 'line' ? false : true,
            borderColor: '#4caf50',
            backgroundColor: type === 'bar' ? '#4caf50' : undefined,
            tension: type === 'line' ? 0.3 : undefined,
            borderRadius: type === 'bar' ? 6 : undefined,
            borderSkipped: type === 'bar' ? false : undefined
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: type === 'bar',
              position: 'top'
            },
            tooltip: {
              enabled: labels.length > 0,
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const value = context.parsed.y.toFixed(2);
                  const percentageChange = percentageChanges[index] || 'N/A';
                  let changeText = '';
                  if (percentageChange !== 'N/A' && percentageChange !== '∞') {
                    changeText = percentageChange >= 0
                      ? ` (+${percentageChange}%)`
                      : ` (${percentageChange}%)`;
                  } else if (percentageChange === '∞') {
                    changeText = ' (∞%)';
                  }
                  return `${context.dataset.label}: ${value} ${changeText}`;
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
              ticks: {
                autoSkip: false
              }
            }
          }
        }
      });
    },
    createDailyChart() {
      const canvas = this.$refs.dailyChartContainer;
      if (!canvas || !canvas.getContext) {
        console.error('Daily chart canvas not found or not ready');
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context for daily chart');
        return;
      }
      if (this.dailyChart) this.dailyChart.destroy();
      const labels = this.dailyChartData.map(d => d.label);
      const dataValues = this.dailyChartData.map(d => d.value);
      const percentageChanges = this.dailyChartData.map(d => d.percentageChange);
      this.dailyChart = this.createChart(ctx, labels, dataValues, percentageChanges, 'line');
    },
    createMonthlyChart() {
      const canvas = this.$refs.monthlyChartContainer;
      if (!canvas || !canvas.getContext) {
        console.error('Monthly chart canvas not found or not ready');
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context for monthly chart');
        return;
      }
      if (this.monthlyChart) this.monthlyChart.destroy();
      const labels = this.monthlyChartData.map(d => d.label);
      const dataValues = this.monthlyChartData.map(d => d.value);
      const percentageChanges = this.monthlyChartData.map(d => d.percentageChange);
      this.monthlyChart = this.createChart(ctx, labels, dataValues, percentageChanges, 'line');
    },
    createYearlyChart() {
      const canvas = this.$refs.yearlyChartContainer;
      if (!canvas || !canvas.getContext) {
        console.error('Yearly chart canvas not found or not ready');
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context for yearly chart');
        return;
      }
      if (this.yearlyChart) this.yearlyChart.destroy();
      const labels = this.yearlyChartData.map(d => d.label);
      const dataValues = this.yearlyChartData.map(d => d.value);
      const percentageChanges = this.yearlyChartData.map(d => d.percentageChange);
      this.yearlyChart = this.createChart(ctx, labels, dataValues, percentageChanges, 'bar');
    },
    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.fetchData();
      }, 10000);
    },
    stopAutoRefresh() {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.fetchData();
    });
    this.startAutoRefresh();
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

/* Cards Row */
.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Sensor Card */
.sensor-card {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  flex: 1 1 250px;
  transition: background-color 0.3s ease;
}

.sensor-card h3 {
  font-size: 1.2rem;
  color: var(--secondary-color);
  margin: 0 0 0.5rem;
}

.sensor-card p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.sensor-card .status {
  font-weight: 500;
  text-transform: capitalize;
}

.status-safe {
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid var(--status-safe);
}

.status-safe .status {
  color: var(--status-safe);
}

.status-neutral {
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid var(--status-neutral);
}

.status-neutral .status {
  color: var(--status-neutral);
}

.status-contaminated {
  background-color: rgba(211, 47, 47, 0.1);
  border: 1px solid var(--status-contaminated);
}

.status-contaminated .status {
  color: var(--status-contaminated);
}

/* Usage Card */
.usage-card {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  flex: 1 1 200px;
}

.usage-card h3 {
  font-size: 1.2rem;
  color: var(--secondary-color);
  margin: 0 0 0.5rem;
}

.usage-card p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: var(--text-dark);
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
}

.daily-chart-wrapper .chart-content {
  min-height: 100px;
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
  width: 100%;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-size: 0.9rem;
}

/* Tablet - Medium */
@media (min-width: 768px) {
  .charts-row {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .chart-wrapper {
    flex: 1 1 calc(50% - 0.5rem);
  }
  .chart-content {
    min-height: 300px;
  }
  .chart-header h3 {
    font-size: 1rem;
  }
}

/* Desktop - Large */
@media (min-width: 992px) {
  .analytics-charts {
    padding: 1.5rem;
  }
  .header-controls h2 {
    font-size: 1.75rem;
  }
  .chart-content {
    min-height: 350px;
  }
  .chart-controls select {
    padding: 0.5rem 1rem;
  }
}

/* Mobile - Small Devices */
@media (max-width: 575.98px) {
  .cards-row {
    flex-direction: column;
  }
  .sensor-card,
  .usage-card {
    flex: 1 1 100%;
    padding: 0.75rem;
  }
  .sensor-card h3,
  .usage-card h3 {
    font-size: 1rem;
  }
  .sensor-card p,
  .usage-card p {
    font-size: 0.85rem;
  }
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  .unit-toggle {
    width: 100%;
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
  }
  .chart-content canvas {
    min-height: 300px !important;
    height: 300px !important;
    width: 100% !important;
  }
}

/* Extra small screens */
@media (max-width: 400px) {
  .chart-content {
    min-height: 280px;
  }
  .chart-content canvas {
    min-height: 280px !important;
    height: 280px !important;
    width: 100% !important;
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
  .toggle-button {
    width: 100%;
    text-align: center;
  }
}
</style>
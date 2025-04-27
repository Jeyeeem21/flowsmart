<template>
  <div class="analytics-charts">
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
    <div class="chart-container">
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
          <div class="chart-placeholder" ref="dailyChartContainer"></div>
        </div>
      </div>
      <!-- Monthly and Yearly Charts -->
      <div class="monthly-yearly-container">
        <!-- Monthly Chart -->
        <div class="chart-wrapper monthly-chart-wrapper">
          <div class="chart-header">
            <h3>Monthly {{ unitLabel }} Usage - {{ selectedYearForMonthly }}</h3>
            <select v-model="selectedYearForMonthly" @change="handleFilterChange">
              <option v-for="year in availableYears" :value="year" :key="year">{{ year }}</option>
            </select>
          </div>
          <div class="chart-content">
            <div class="chart-placeholder" ref="monthlyChartContainer"></div>
          </div>
        </div>
        <!-- Yearly Chart -->
        <div class="chart-wrapper yearly-chart-wrapper">
          <div class="chart-header">
            <h3>Yearly {{ unitLabel }} Usage</h3>
          </div>
          <div class="chart-content">
            <div class="chart-placeholder" ref="yearlyChartContainer"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'; // Import Firebase Firestore
Chart.register(...registerables);

export default {
  name: 'AnalyticsCharts',
  props: {
    userRole: {
      type: String,
      required: true // 'admin' or 'resident'
    },
    userId: {
      type: String,
      required: true // User ID for residents
    }
  },
  data() {
    const currentDate = new Date();
    return {
      charts: {
        daily: null,
        monthly: null,
        yearly: null
      },
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      selectedMonth: currentDate.getMonth(),
      selectedYear: currentDate.getFullYear(),
      selectedYearForMonthly: currentDate.getFullYear(),
      availableYears: [],
      unit: 'liter', // Default unit is liter
      conversionFactor: 1000, // 1 cubic meter = 1000 liters
      chartCanvases: {
        daily: null,
        monthly: null,
        yearly: null
      },
      isRefreshing: false,
      SensorData: [], // Store fetched sensor data here
      deviceId: null // Store the device ID for residents
    };
  },
  computed: {
    selectedMonthName() {
      return this.months[this.selectedMonth];
    },
    unitLabel() {
      return this.unit === 'cubic' ? 'Cubic' : 'Liter';
    },
    unitSymbol() {
      return this.unit === 'cubic' ? 'm³' : 'L';
    }
  },
  async mounted() {
    this.availableYears = this.generateAvailableYears();
    await this.fetchUserData(); // Fetch user-specific data
    this.$nextTick(() => {
      setTimeout(() => {
        this.createChartCanvases();
        this.initializeCharts();
      }, 0);
    });
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    this.cleanupCharts();
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    async fetchUserData() {
      const db = getFirestore();
      if (this.userRole === 'admin') {
        // Admin fetches all data
        await this.fetchSensorData();
      } else if (this.userRole === 'resident') {
        // Resident fetches their specific data
        const devicesRef = collection(db, 'devices');
        const q = query(devicesRef, where('userId', '==', this.userId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const deviceDoc = querySnapshot.docs[0].data();
          this.deviceId = deviceDoc.id; // Assuming 'id' matches the SensorData id
          await this.fetchSensorData();
        } else {
          console.warn('No device found for the resident.');
        }
      }
    },
    async fetchSensorData() {
      const db = getFirestore();
      let q;
      if (this.userRole === 'admin') {
        // Admin fetches all data
        q = query(collection(db, 'SensorData'));
      } else if (this.userRole === 'resident') {
        // Resident fetches data matching their deviceId
        q = query(
          collection(db, 'SensorData'),
          where('id', '==', this.deviceId)
        );
      }
      try {
        const querySnapshot = await getDocs(q);
        this.SensorData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Convert timestamp to a Date object
          data.timestamp = new Date(parseInt(data.timestamp, 10)); // Parse timestamp as integer
          return data;
        });
        console.log('Fetched Sensor Data:', this.SensorData);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    },
    handleUnitChange(newUnit) {
      if (this.unit !== newUnit) {
        this.unit = newUnit;
        this.refreshCharts();
      }
    },
    handleFilterChange() {
      this.refreshCharts();
    },
    handleResize() {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this.refreshCharts();
      }, 250); // Debounce resize events
    },
    generateAvailableYears() {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = currentYear; year >= currentYear - 5; year--) {
        years.push(year);
      }
      return years;
    },
    createChartCanvases() {
      this.removeChartCanvases();
      const createCanvas = (containerRef, id, className) => {
        if (!containerRef) return null;
        const canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.className = className;
        containerRef.appendChild(canvas);
        return canvas;
      };
      this.chartCanvases.daily = createCanvas(
        this.$refs.dailyChartContainer,
        'dailyChart',
        'chart daily-chart'
      );
      this.chartCanvases.monthly = createCanvas(
        this.$refs.monthlyChartContainer,
        'monthlyChart',
        'chart monthly-chart'
      );
      this.chartCanvases.yearly = createCanvas(
        this.$refs.yearlyChartContainer,
        'yearlyChart',
        'chart yearly-chart'
      );
    },
    removeChartCanvases() {
      if (this.$refs.dailyChartContainer) {
        this.$refs.dailyChartContainer.innerHTML = '';
      }
      if (this.$refs.monthlyChartContainer) {
        this.$refs.monthlyChartContainer.innerHTML = '';
      }
      if (this.$refs.yearlyChartContainer) {
        this.$refs.yearlyChartContainer.innerHTML = '';
      }
    },
    cleanupCharts() {
      if (this.charts.daily) {
        this.charts.daily.destroy();
        this.charts.daily = null;
      }
      if (this.charts.monthly) {
        this.charts.monthly.destroy();
        this.charts.monthly = null;
      }
      if (this.charts.yearly) {
        this.charts.yearly.destroy();
        this.charts.yearly = null;
      }
      this.removeChartCanvases();
    },
    refreshCharts() {
      if (this.isRefreshing) return;
      this.isRefreshing = true;
      this.cleanupCharts();
      this.$nextTick(() => {
        setTimeout(() => {
          this.createChartCanvases();
          this.initializeCharts();
          this.isRefreshing = false;
        }, 50);
      });
    },
    initializeCharts() {
      this.initializeDailyChart();
      this.initializeMonthlyChart();
      this.initializeYearlyChart();
    },
    getDailyLabels() {
      const year = this.selectedYear;
      const month = this.selectedMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    },
    getConvertedDailyData() {
      const year = this.selectedYear;
      const month = this.selectedMonth;
      // Filter data for the selected month and year
      const filteredData = this.SensorData.filter(item => {
        const date = item.timestamp;
        return (
          date.getFullYear() === year &&
          date.getMonth() === month
        );
      });
      // Create an array of daily usage
      const dailyData = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
        const dayData = filteredData.find(item => {
          const date = item.timestamp;
          return date.getDate() === i + 1;
        });
        return dayData ? dayData.liters : 0; // Default to 0 if no data for the day
      });
      return this.unit === 'cubic'
        ? dailyData.map(value => value / this.conversionFactor)
        : dailyData;
    },
    getFilteredMonthlyData() {
      const filtered = this.SensorData.filter(item => {
        const date = item.timestamp;
        return date.getFullYear() === this.selectedYearForMonthly;
      });
      const monthlyData = {};
      filtered.forEach(item => {
        const date = item.timestamp;
        const month = this.months[date.getMonth()];
        const year = date.getFullYear();
        const key = `${month} ${year}`;
        if (!monthlyData[key]) {
          monthlyData[key] = 0;
        }
        monthlyData[key] += item.liters; // Sum up liters for the month
      });
      return Object.entries(monthlyData).map(([month, liters]) => ({
        month,
        liters: this.unit === 'cubic' ? liters / this.conversionFactor : liters
      }));
    },
    getYearlyData() {
      const yearlyData = {};
      this.SensorData.forEach(item => {
        const date = item.timestamp;
        const year = date.getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = 0;
        }
        yearlyData[year] += item.liters; // Sum up liters for the year
      });
      return Object.entries(yearlyData).map(([year, liters]) => ({
        year,
        liters: this.unit === 'cubic' ? liters / this.conversionFactor : liters
      }));
    },
    initializeDailyChart() {
      if (!this.chartCanvases.daily) return;
      const ctx = this.chartCanvases.daily.getContext('2d');
      if (!ctx) return;
      const dailyData = this.getConvertedDailyData();
      const dailyLabels = this.getDailyLabels();
      if (!dailyData || dailyData.length === 0 || !dailyLabels || dailyLabels.length === 0) {
        console.warn('Invalid data for daily chart:', { dailyData, dailyLabels });
        return;
      }
      try {
        this.charts.daily = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: dailyLabels,
            datasets: [{
              label: `${this.unitLabel} Measurement (${this.unitSymbol})`,
              data: dailyData,
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderColor: '#4caf50',
              borderWidth: window.innerWidth < 768 ? 1 : 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                  title: (tooltipItems) => `Day ${tooltipItems[0].label}`,
                  label: (context) => {
                    return `${this.unitLabel}: ${context.raw} ${this.unitSymbol}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: window.innerWidth >= 768, text: this.unitLabel },
                ticks: { font: { size: window.innerWidth < 768 ? 10 : 12 } }
              },
              x: {
                title: { display: window.innerWidth >= 768, text: 'Day of Month' },
                ticks: {
                  maxRotation: 90,
                  minRotation: 90,
                  font: { size: window.innerWidth < 768 ? 9 : 11 },
                  autoSkip: false
                }
              }
            },
            layout: { padding: { bottom: window.innerWidth < 768 ? 15 : 25 } }
          }
        });
      } catch (error) {
        console.error('Error initializing daily chart:', error);
      }
    },
    initializeMonthlyChart() {
      if (!this.chartCanvases.monthly) return;
      const ctx = this.chartCanvases.monthly.getContext('2d');
      if (!ctx) return;
      const filteredData = this.getFilteredMonthlyData();
      const monthLabels = filteredData.map(d => d.month);
      if (!filteredData || filteredData.length === 0 || !monthLabels || monthLabels.length === 0) {
        console.warn('Invalid data for monthly chart:', { filteredData, monthLabels });
        return;
      }
      try {
        this.charts.monthly = new Chart(ctx, {
          type: 'line',
          data: {
            labels: monthLabels,
            datasets: [{
              label: `${this.unitLabel} Measurement (${this.unitSymbol})`,
              data: filteredData.map(d => d.liters),
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderColor: '#4caf50',
              borderWidth: window.innerWidth < 768 ? 1 : 2,
              tension: 0.1,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: (context) => {
                    return `${this.unitLabel}: ${context.raw} ${this.unitSymbol}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: window.innerWidth >= 768, text: this.unitLabel },
                ticks: { font: { size: window.innerWidth < 768 ? 10 : 12 } }
              },
              x: {
                title: { display: window.innerWidth >= 768, text: 'Month' },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                  font: { size: window.innerWidth < 768 ? 9 : 11 },
                  autoSkip: false
                }
              }
            },
            layout: { padding: { bottom: window.innerWidth < 768 ? 15 : 10 } }
          }
        });
      } catch (error) {
        console.error('Error initializing monthly chart:', error);
      }
    },
    initializeYearlyChart() {
      if (!this.chartCanvases.yearly) return;
      const ctx = this.chartCanvases.yearly.getContext('2d');
      if (!ctx) return;
      const yearlyData = this.getYearlyData();
      if (!yearlyData || yearlyData.length === 0) {
        console.warn('Invalid data for yearly chart:', { yearlyData });
        return;
      }
      try {
        this.charts.yearly = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: yearlyData.map(d => d.year),
            datasets: [{
              label: `${this.unitLabel} Measurement (${this.unitSymbol})`,
              data: yearlyData.map(d => d.liters),
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderColor: '#4caf50',
              borderWidth: window.innerWidth < 768 ? 1 : 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: (context) => {
                    return `${this.unitLabel}: ${context.raw} ${this.unitSymbol}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: window.innerWidth >= 768, text: this.unitLabel },
                ticks: { font: { size: window.innerWidth < 768 ? 10 : 12 } }
              },
              x: {
                title: { display: window.innerWidth >= 768, text: 'Year' },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                  font: { size: window.innerWidth < 768 ? 9 : 11 },
                  autoSkip: false
                }
              }
            },
            layout: { padding: { bottom: window.innerWidth < 768 ? 15 : 10 } }
          }
        });
      } catch (error) {
        console.error('Error initializing yearly chart:', error);
      }
    }
  }
};
</script>

<style scoped>
.analytics-charts {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  grid-column: span 2;
}
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}
.unit-toggle {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 5px 10px;
  border-radius: 8px;
}
.unit-label {
  margin-right: 10px;
  font-weight: 500;
  color: #2c3e50;
}
.toggle-container {
  display: flex;
  background-color: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}
.toggle-button {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  color: #666;
}
.toggle-button.active {
  background-color: #4caf50;
  color: white;
}
.chart-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.chart-wrapper {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}
.chart-header h3 {
  margin: 0;
}
.chart-controls {
  display: flex;
  gap: 10px;
}
.chart-header select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 12px;
}
.chart-content {
  flex: 1;
  position: relative;
  min-height: 280px;
}
.chart-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.chart {
  width: 100% !important;
  height: 100% !important;
}
h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.5rem;
}
h3 {
  color: #555;
  font-size: 1rem;
}
@media (min-width: 768px) {
  .chart-content {
    min-height: 320px;
  }
  h2 {
    font-size: 1.75rem;
  }
  h3, .chart-header select {
    font-size: 1.1rem;
  }
}
@media (min-width: 1024px) {
  .chart-container {
    flex-direction: column;
  }
  .daily-chart-wrapper {
    flex: 1;
  }
  .monthly-yearly-container {
    display: flex;
    flex-direction: row;
    gap: 20px;
  }
  .monthly-chart-wrapper,
  .yearly-chart-wrapper {
    flex: 1;
  }
  .chart-content {
    min-height: 400px;
  }
  h2 {
    font-size: 2rem;
  }
  h3, .chart-header select {
    font-size: 15px;
  }
}
@media (max-width: 600px) {
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  .unit-toggle {
    width: 100%;
    justify-content: space-between;
  }
  .toggle-container {
    flex: 1;
    max-width: 200px;
  }
  .toggle-button {
    flex: 1;
    text-align: center;
  }
}
</style>
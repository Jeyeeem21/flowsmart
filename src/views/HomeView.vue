<template>
  <div class="home-container">
    <!-- Header -->
    <header class="home-header">
      <div class="header-content">
        <div class="logo">FlowSmart</div>
        <nav class="nav">
          <router-link to="/login" class="nav-link">Sign In</router-link>
          <router-link to="/resident/register2" class="nav-button">Get Started</router-link>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="home-main">
      <div class="hero-section">
        <div class="hero-content">
          <h1>Smart Water Management for Modern Homes</h1>
          <p>Monitor your water usage in real-time, detect leaks, and save money with FlowSmart's intelligent water management system.</p>
          <div class="hero-buttons">
            <router-link to="/resident/register2" class="primary-button">Create Account</router-link>
            <button @click="scrollToFeatures" class="secondary-button">Learn More</button>
          </div>
        </div>
       <div class="hero-image">
          <img src="image1/flow-removebg.png" alt="FlowSmart Dashboard" class="dashboard-image" />
        </div>
      </div>

      <div id="features" class="features-section" ref="featuresSection">
        <h2>Key Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <h3>Real-time Analytics</h3>
            <p>Monitor your water usage patterns with detailed charts and analytics.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
              </svg>
            </div>
            <h3>Leak Detection</h3>
            <p>Get instant alerts when unusual water flow is detected to prevent damage.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3>Cost Savings</h3>
            <p>Reduce your water bill by identifying inefficiencies and optimizing usage.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <h3>Mobile Access</h3>
            <p>Access your dashboard from anywhere using our responsive web application.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="home-footer">
      <div class="footer-content">
        <p>&copy; 2023 FlowSmart. All rights reserved.</p>
        <div class="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  methods: {
    scrollToFeatures() {
      const element = this.$refs.featuresSection;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
</script>

<style>
/* Reset all margins and padding */
/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

/* Remove any default margins from #app */
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
}
</style>

<style scoped>
/* Reset all margins and padding */
/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

/* Remove any default margins from #app */
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
}

.home-container {
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.home-header {
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  margin: 0;
  padding: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.logo {
  font-size: 1.8rem;
  font-weight: bold;
  color: #4caf50;
}

.nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
}

.nav-button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: #3d9140;
}

.home-main {
  flex: 1;
  width: 100%;
  margin: 0;
  padding: 0;
}

.hero-section {
  display: flex;
  align-items: center;
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
  gap: 40px;
  flex-wrap: wrap;
  width: 100%;
}

.hero-content {
  flex: 1;
  min-width: 300px;
}

.hero-content h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 20px;
}

.hero-content p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.primary-button {
  background-color: #4caf50;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background-color: #3d9140;
}

.secondary-button {
  background-color: transparent;
  color: #4caf50;
  padding: 12px 24px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid #4caf50;
  transition: background-color 0.2s;
}

.secondary-button:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 300px;
  padding: 20px;
}

.dashboard-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); /* Shadow directly on image */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dashboard-image:hover {
  transform: translateY(-5px) scale(1.02); /* Lift and slight zoom on hover */
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2); /* Enhanced shadow on hover */
}

.features-section {
  background-color: #f9f9f9;
  padding: 60px 0;
  text-align: center;
  width: 100%;
  margin: 0;
}

.features-section h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 40px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.feature-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  margin-bottom: 15px;
  color: #4caf50;
}

.feature-card h3 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.feature-card p {
  color: #666;
  line-height: 1.5;
}

.home-footer {
  background-color: #2c3e50;
  color: white;
  padding: 30px 0;
  width: 100%;
  margin: 0;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: wrap;
  gap: 20px;
  padding: 0 20px;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-links a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.footer-links a:hover {
  opacity: 1;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    padding: 40px 20px;
  }

  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .hero-image {
    padding: 10px;
  }

  .dashboard-image {
    border-radius: 6px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1); /* Lighter shadow for mobile */
  }

  .dashboard-image:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
    padding: 0 20px;
  }
}

/* Tablet-specific styles */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Adjust layout for tablets */
  .home-container {
    padding: 0 20px; /* Add some horizontal padding */
  }

  .hero-section {
    flex-direction: column; /* Stack content vertically for better readability */
    padding: 40px 20px;
  }

  .hero-content h1 {
    font-size: 2rem; /* Reduce font size for headings */
  }

  .hero-content p {
    font-size: 1rem; /* Reduce font size for paragraphs */
  }

  .hero-image {
    padding: 15px;
  }

  .dashboard-image {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12); /* Slightly lighter shadow for tablets */
  }

  .dashboard-image:hover {
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr); /* Show two feature cards per row */
  }

  .footer-content {
    flex-direction: column; /* Stack footer links vertically */
    text-align: center;
  }
}
</style>

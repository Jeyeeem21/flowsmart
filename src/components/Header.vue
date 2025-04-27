<template>
  <header class="home-header">
    <div class="header-container">
      <!-- Logo -->
      <div class="logo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4caf50"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
        <h1>FlowSmart</h1>
      </div>

      <!-- User Info (if logged in) -->
      <div v-if="isLoggedIn" class="user-info">{{ userFullName }}</div>
      <div v-else class="auth-actions">
        <router-link to="/login" class="nav-link">Sign In</router-link>
        <router-link to="/ResidentRegistration.vue" class="nav-button">Get Started</router-link>
      </div>
    </div>
  </header>
</template>

<script>
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default {
  name: 'HeaderView',
  data() {
    return {
      isLoggedIn: false, // Track authentication state
      userFullName: '', // Store the user's full name
    };
  },
  created() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.isLoggedIn = true;
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid)); // Fetch user data
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.userFullName = userData.fullName || 'User'; // Default to "User" if no name exists
        }
      } else {
        this.isLoggedIn = false;
        this.userFullName = ''; // Clear the name when logged out
      }
    });
  },
};
</script>

<style scoped>
/* Import Google Font */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap');

/* General Header Styles */
.home-header {
  background-color: white;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1); /* Reduced shadow for smaller header */
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px; /* Reduced padding for smaller header */
  height: 60px; /* Reduced height for smaller header */
  max-width: 1400px;
  margin: 0 auto;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px; /* Reduced gap for smaller header */
}

.logo svg {
  width: 28px; /* Reduced size for smaller header */
  height: 28px;
  color: #4caf50; /* Match brand color */
}

.logo h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem; /* Reduced font size for smaller header */
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Auth Actions (Sign In / Get Started) */
.auth-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-link {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem; /* Reduced font size for smaller header */
  font-weight: 500;
  color: #2c3e50;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #4caf50;
}

.nav-button {
  display: inline-block;
  padding: 6px 12px; /* Reduced padding for smaller button */
  background-color: #4caf50;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem; /* Reduced font size for smaller button */
  transition: background-color 0.2s ease;
}

.nav-button:hover {
  background-color: #3d9140;
}

/* User Full Name Styling */
.user-info {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem; /* Reduced font size for smaller header */
  font-weight: 500;
  color: #4caf50;
  text-transform: capitalize;
}

.user-info:hover {
  color: #3d9140;
  cursor: pointer;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .header-container {
    padding: 0 15px; /* Further reduce padding for mobile */
  }

  .logo h1 {
    font-size: 1.2rem; /* Smaller logo text for mobile */
  }

  .nav-link,
  .nav-button {
    font-size: 0.8rem; /* Smaller text for mobile */
  }

  .user-info {
    font-size: 0.8rem; /* Smaller user info text for mobile */
  }
}
</style>
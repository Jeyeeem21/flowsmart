<template>
  <div id="app">
    <!-- Header -->
    <Header v-if="!isHomePage && !isPublicRoute" />

    <!-- Main Container -->
    <div class="main-container">
      <!-- Sidebar: Only show if not on the home page or public routes -->
      <Sidebar
        v-if="isLoggedIn && !isHomePage && !isPublicRoute"
        :is-expanded="isSidebarExpanded"
        @toggle-sidebar="toggleSidebar"
      />

      <!-- Content -->
      <main
        class="content"
        :class="{
          'with-sidebar': isLoggedIn && !isHomePage && !isPublicRoute,
          'no-header': isHomePage || isPublicRoute,
          'sidebar-collapsed': isLoggedIn && !isHomePage && !isPublicRoute && !isSidebarExpanded,
        }"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue';
import Sidebar from './components/Sidebar.vue';

export default {
  name: 'App',
  components: {
    Header,
    Sidebar,
  },
  data() {
    return {
      isLoggedIn: true, // Set to `true` or `false` based on authentication status
      isSidebarExpanded: true, // Controls whether the sidebar is expanded or collapsed
      publicRoutes: ['/login', '/resident/register2'], // List of public routes
    };
  },
  computed: {
    isHomePage() {
      return this.$route.path === '/home' || this.$route.path === '/';
    },
    isPublicRoute() {
      return this.publicRoutes.includes(this.$route.path); // Check if the current route is public
    },
  },
  methods: {
    toggleSidebar(isExpanded) {
      this.isSidebarExpanded = isExpanded;
    },
  },
};
</script>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #2c3e50;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  flex: 1;
  position: relative;
}

.content {
  flex: 1;
  padding: 10px;
  transition: margin-left 0.3s ease, margin-top 0.3s ease;
}

.content.no-header {
  margin-top: 0; /* Remove top margin when header is hidden */
  min-height: 100vh;
}

.content.with-sidebar {
  margin-left: 250px; /* Expanded sidebar width */
}

.content.sidebar-collapsed {
  margin-left: 60px; /* Collapsed sidebar width */
}

@media (max-width: 1023px) {
  .content.with-sidebar,
  .content.sidebar-collapsed {
    margin-left: 0; /* No margin on small screens */
    padding-bottom: 70px; /* Space for mobile footer nav */
  }
}
</style>
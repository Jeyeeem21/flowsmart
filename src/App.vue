<template>
  <div id="app">
    <!-- Header: Show on /terms, /privacy, /contact, but not on / (Home) or other public routes -->
    <Header v-if="showHeader" />

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
          'no-header': !showHeader,
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
      isLoggedIn: true,
      isSidebarExpanded: true,
      publicRouteNames: ['login', 'registerResidents2', 'not-found', 'terms', 'privacy', 'contact', 'help'],
    };
  },
  computed: {
    isHomePage() {
      return this.$route.path === '/home' || this.$route.path === '/';
    },
    isPublicRoute() {
      return this.publicRouteNames.includes(this.$route.name);
    },
    showHeader() {
      // Show Header on /terms, /privacy, /contact, and authenticated routes (not Home or other public routes)
      return this.$route.name === 'terms' || this.$route.name === 'privacy' || this.$route.name === 'contact' || (!this.isHomePage && !this.publicRouteNames.includes(this.$route.name));
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Poppins', sans-serif;
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
  margin-top: 0;
  min-height: 100vh;
}

.content.with-sidebar {
  margin-left: 250px;
}

.content.sidebar-collapsed {
  margin-left: 60px;
}

@media (max-width: 1023px) {
  .content.with-sidebar,
  .content.sidebar-collapsed {
    margin-left: 0;
    padding-bottom: 70px;
  }
}
</style>
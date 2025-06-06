<template>
  <div>
    <!-- Desktop Sidebar -->
    <div class="sidebar-container" :class="{ 'sidebar-expanded': isExpanded }" v-if="!isMobile">
      <!-- Sidebar Toggle Button (Desktop) -->
      <button class="sidebar-toggle" @click="toggleSidebar" aria-label="Toggle sidebar">
        <span class="toggle-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path v-if="isExpanded" d="M15 18l-6-6 6-6"></path>
            <path v-else d="M9 18l6-6-6-6"></path>
          </svg>
        </span>
      </button>
      <!-- Sidebar Content -->
      <div class="sidebar-content">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="sidebar-logo-icon">
            <span>FS</span>
          </div>
        </div>
        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <ul class="sidebar-menu">
            <!-- Dashboard -->
            <li class="sidebar-menu-item" :class="{ active: activeItem === 'dashboard' }">
              <a href="#" class="sidebar-menu-link" @click.prevent="setActiveItem('dashboard')">
                <span class="sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="12" width="7" height="9"></rect>
                    <rect x="3" y="16" width="7" height="5"></rect>
                  </svg>
                </span>
                <span class="sidebar-text" v-if="isExpanded">Dashboard</span>
              </a>
            </li>
            
            <!-- Device Management (Admin Only) -->
            <li v-if="userRole === 'admin'" class="sidebar-menu-item" :class="{ active: isDeviceManagementActive }">
              <a href="#" class="sidebar-menu-link" @click.prevent="toggleSubmenu('deviceManagement')">
                <span class="sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <path d="M6 12h12"></path>
                    <path d="M8 12v4"></path>
                    <path d="M16 12v4"></path>
                    <path d="M12 12v4"></path>
                  </svg>
                </span>
                <span class="sidebar-text" v-if="isExpanded">Device Management</span>
                <span class="sidebar-arrow" v-if="isExpanded">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ 'arrow-down': expandedSubmenu === 'deviceManagement' }">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </span>
              </a>
              <ul class="sidebar-submenu" v-if="expandedSubmenu === 'deviceManagement' && isExpanded">
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'deviceRegistration' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('deviceRegistration')">
                    Device Registration
                  </a>
                </li>
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'deviceList' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('deviceList')">
                    Device List
                  </a>
                </li>
              </ul>
            </li>
            
            <!-- User Management (Admin Only) -->
            <li v-if="userRole === 'admin'" class="sidebar-menu-item" :class="{ active: isUserManagementActive }">
              <a href="#" class="sidebar-menu-link" @click.prevent="toggleSubmenu('userManagement')">
                <span class="sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </span>
                <span class="sidebar-text" v-if="isExpanded">User Management</span>
                <span class="sidebar-arrow" v-if="isExpanded">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ 'arrow-down': expandedSubmenu === 'userManagement' }">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </span>
              </a>
              <ul class="sidebar-submenu" v-if="expandedSubmenu === 'userManagement' && isExpanded">
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'registerResidents' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('registerResidents')">
                    Register Residents
                  </a>
                </li>
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'residentsData' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('residentsData')">
                    Residents Data
                  </a>
                </li>
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'adminData' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('adminData')">
                    Admin Data
                  </a>
                </li>
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'adminRegistration' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('adminRegistration')">
                    Register Admin
                  </a>
                </li>
              </ul>
            </li>
            
            <!-- Reports -->
            <li class="sidebar-menu-item" :class="{ active: isReportsActive }">
              <a href="#" class="sidebar-menu-link" @click.prevent="toggleSubmenu('reports')">
                <span class="sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </span>
                <span class="sidebar-text" v-if="isExpanded">Reports</span>
                <span class="sidebar-arrow" v-if="isExpanded">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ 'arrow-down': expandedSubmenu === 'reports' }">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </span>
              </a>
              <ul class="sidebar-submenu" v-if="expandedSubmenu === 'reports' && isExpanded">
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'usageReports' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('usageReports')">
                    Usage Reports
                  </a>
                </li>
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'billing' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('billing')">
                    Bills
                  </a>
                </li>
                <li class="sidebar-submenu-item" :class="{ active: activeItem === 'alerts' }">
                  <a href="#" class="sidebar-submenu-link" @click.prevent="setActiveItem('alerts')">
                    Alerts
                    <span v-if="alertsCount > 0" class="alert-badge">{{ alertsCount }}</span>
                  </a>
                </li>
              </ul>
            </li>
            
            <!-- Settings -->
            <li class="sidebar-menu-item" :class="{ active: activeItem === 'settings' }">
              <a href="#" class="sidebar-menu-link" @click.prevent="setActiveItem('settings')">
                <span class="sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                <span class="sidebar-text" v-if="isExpanded">Settings</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <!-- Logout Button positioned above other footer content -->
          <button class="logout-button" @click="logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5"></path>
              <polyline points="17 16 21 12 17 8"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span v-if="isExpanded">Logout</span>
          </button>
          
          <!-- Other footer content below logout button -->
          <div class="sidebar-footer-content" v-if="isExpanded">
            <div class="sidebar-version">v1.0.0</div>
            <div class="sidebar-help">
              <a href="#" @click.prevent="setActiveItem('help')">Help & Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile Footer Navigation -->
    <div class="mobile-footer-nav" v-if="isMobile">
      <div class="mobile-nav-item" :class="{ active: activeItem === 'dashboard' }" @click="setActiveItem('dashboard')">
        <span class="mobile-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
        </span>
        <span class="mobile-nav-text">Dashboard</span>
      </div>
      
      <div v-if="userRole === 'admin'" class="mobile-nav-item" :class="{ active: isDeviceManagementActive }" @click="handleMobileSubmenu('deviceManagement')">
        <span class="mobile-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
            <path d="M6 12h12"></path>
            <path d="M8 12v4"></path>
            <path d="M16 12v4"></path>
            <path d="M12 12v4"></path>
          </svg>
        </span>
        <span class="mobile-nav-text">Devices</span>
      </div>
      
      <div v-if="userRole === 'admin'" class="mobile-nav-item" :class="{ active: isUserManagementActive }" @click="handleMobileSubmenu('userManagement')">
        <span class="mobile-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </span>
        <span class="mobile-nav-text">Users</span>
      </div>
      
      <div class="mobile-nav-item" :class="{ active: isReportsActive }" @click="handleMobileSubmenu('reports')">
        <span class="mobile-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </span>
        <span class="mobile-nav-text">Reports</span>
      </div>
      
      <div class="mobile-nav-item" :class="{ active: activeItem === 'more' }" @click="toggleMobileMore">
        <span class="mobile-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </span>
        <span class="mobile-nav-text">More</span>
      </div>
    </div>
    
    <!-- Mobile Submenu Modal -->
    <div class="mobile-submenu-overlay" v-if="showMobileSubmenu" @click="closeMobileSubmenu">
      <div class="mobile-submenu-container" @click.stop>
        <div class="mobile-submenu-header">
          <h3>{{ mobileSubmenuTitle }}</h3>
          <button class="mobile-submenu-close" @click="closeMobileSubmenu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="mobile-submenu-content">
          <ul class="mobile-submenu-list">
            <!-- Device Management Submenu -->
            <template v-if="mobileSubmenuType === 'deviceManagement' && userRole === 'admin'">
              <li @click="setActiveItem('deviceRegistration')">
                <span>Device Registration</span>
              </li>
              <li @click="setActiveItem('deviceList')">
                <span>Device List</span>
              </li>
            </template>
            
            <!-- User Management Submenu -->
            <template v-if="mobileSubmenuType === 'userManagement' && userRole === 'admin'">
              <li @click="setActiveItem('registerResidents')">
                <span>Register Residents</span>
              </li>
              <li @click="setActiveItem('residentsData')">
                <span>Residents Data</span>
              </li>
              <li @click="setActiveItem('adminData')">
                <span>Admin Data</span>
              </li>
              <li @click="setActiveItem('adminRegistration')">
                <span>Register Admin</span>
              </li>
            </template>
            
            <!-- Reports Submenu -->
            <template v-if="mobileSubmenuType === 'reports'">
              <li @click="setActiveItem('usageReports')">
                <span>Usage Reports</span>
              </li>
              <li @click="setActiveItem('billing')">
                <span>Bills</span>
              </li>
              <li @click="setActiveItem('alerts')">
                <span>Alerts</span>
              </li>
            </template>
            
            <!-- More Menu -->
            <template v-if="mobileSubmenuType === 'more'">
              <li @click="setActiveItem('settings')">
                <span>Settings</span>
              </li>
              <li @click="setActiveItem('help')">
                <span>Help & Support</span>
              </li>
              <!-- Logout option in More menu -->
              <li @click="logout" class="logout-option">
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5"></path>
                    <polyline points="17 16 21 12 17 8"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </span>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

export default {
  name: 'Sidebar',
  data() {
    return {
      isExpanded: true,
      expandedSubmenu: null,
      activeItem: 'dashboard',
      isMobile: false,
      showMobileSubmenu: false,
      mobileSubmenuType: null,
      mobileSubmenuTitle: '',
      userRole: 'resident', // Default to resident, will be updated in mounted
      alertsCount: 0
    };
  },
  computed: {
    isDeviceManagementActive() {
      const deviceItems = ['deviceRegistration', 'deviceList', 'deviceStatus'];
      return this.expandedSubmenu === 'deviceManagement' || deviceItems.includes(this.activeItem);
    },
    isUserManagementActive() {
      const userItems = ['registerResidents', 'residentsData', 'residents', 'adminData', 'adminRegistration'];
      return this.expandedSubmenu === 'userManagement' || userItems.includes(this.activeItem);
    },
    isReportsActive() {
      const reportItems = ['usageReports', 'billing', 'alerts', 'residentData'];
      return this.expandedSubmenu === 'reports' || reportItems.includes(this.activeItem);
    }
  },
  methods: {
    toggleSidebar() {
      this.isExpanded = !this.isExpanded;
      if (!this.isExpanded) {
        this.expandedSubmenu = null;
      }
      this.$emit('toggle-sidebar', this.isExpanded);
    },
    toggleSubmenu(submenu) {
      if (this.expandedSubmenu === submenu) {
        this.expandedSubmenu = null;
      } else {
        this.expandedSubmenu = submenu;
      }
    },
    setActiveItem(item) {
      this.activeItem = item;
      this.$emit('menu-selected', item);
      switch (item) {
        case 'dashboard':
          this.$router.push(this.userRole === 'resident' ? '/residentdashboard' : '/dashboard');
          break;
        case 'adminData':
          this.$router.push('/admin/data');
          break;
        case 'adminRegistration':
          this.$router.push('/admin/register');
          break;
        case 'residentsData':
          this.$router.push('/admin/residents');
          break;
        case 'registerResidents':
          this.$router.push('/resident/register1');
          break;
        case 'deviceRegistration':
          this.$router.push('/device/register');
          break;
        case 'deviceList':
          this.$router.push('/device/list');
          break;
        case 'deviceStatus':
          this.$router.push('/device/status');
          break;
        case 'usageReports':
          this.$router.push('/reports/usage');
          break;
        case 'billing':
          this.$router.push('/reports/billing');
          break;
        case 'alerts':
          this.$router.push('/reports/alerts');
          break;
        case 'residentData':
          this.$router.push('/reports/residents');
          break;
        case 'settings':
          this.$router.push('/settings');
          break;
        case 'help':
          this.$router.push('/help');
          break;
      }
      this.closeMobileSubmenu();
    },
    async logout() {
      try {
        const auth = getAuth();
        await signOut(auth);
        console.log('User logged out successfully');
        this.$router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to log out. Please try again.');
      }
    },
    checkMobile() {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 1024;
      if (this.isMobile) {
        this.isExpanded = false;
      } else if (wasMobile !== this.isMobile && wasMobile) {
        this.isExpanded = true;
      }
      this.$emit('toggle-sidebar', this.isExpanded);
    },
    handleMobileSubmenu(type) {
      this.mobileSubmenuType = type;
      switch (type) {
        case 'deviceManagement':
          this.mobileSubmenuTitle = 'Device Management';
          break;
        case 'userManagement':
          this.mobileSubmenuTitle = 'User Management';
          break;
        case 'reports':
          this.mobileSubmenuTitle = 'Reports';
          break;
        case 'more':
          this.mobileSubmenuTitle = 'More Options';
          break;
        default:
          this.mobileSubmenuTitle = '';
      }
      this.showMobileSubmenu = true;
    },
    toggleMobileMore() {
      this.handleMobileSubmenu('more');
    },
    closeMobileSubmenu() {
      this.showMobileSubmenu = false;
    },
    async fetchUserRole() {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            this.userRole = userDoc.data().role || 'resident';
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    },
    updateAlertsCount(event) {
      this.alertsCount = event.detail;
    }
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    this.$emit('toggle-sidebar', this.isExpanded);
    
    // Set active item based on current route
    const path = this.$router.currentRoute.value.path;
    if (path.includes('/admin/data')) {
      this.activeItem = 'adminData';
      this.expandedSubmenu = 'userManagement';
    } else if (path.includes('/admin/residents')) {
      this.activeItem = 'residentsData';
      this.expandedSubmenu = 'userManagement';
    } else if (path.includes('/resident/register')) {
      this.activeItem = 'registerResidents';
      this.expandedSubmenu = 'userManagement';
    } else if (path.includes('/admin/register')) {
      this.activeItem = 'adminRegistration';
      this.expandedSubmenu = 'userManagement';
    } else if (path.includes('/residentdashboard')) {
      this.activeItem = 'dashboard';
    } else if (path.includes('/dashboard')) {
      this.activeItem = 'dashboard';
    }
    
    // Fetch user role
    this.fetchUserRole();
    
    // Listen for alerts count updates
    window.addEventListener('update-alerts-count', this.updateAlertsCount);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    window.removeEventListener('update-alerts-count', this.updateAlertsCount);
  }
};
</script>

<style scoped>
/* Import Poppins Font */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap');

/* Global Font Family */
* {
  font-family: 'Poppins', sans-serif;
}

/* Desktop Sidebar Styles */
.sidebar-container {
  position: fixed;
  top: 70px;
  left: 0;
  height: calc(100vh - 70px);
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
  width: 60px;
  z-index: 90;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.sidebar-expanded {
  width: 250px;
}
.sidebar-toggle {
  position: absolute;
  top: 10px;
  right: -12px;
  width: 28px;
  height: 28px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  color: #2c3e50;
  transition: all 0.2s ease;
}
.sidebar-toggle:hover {
  background-color: #f5f5f5;
  color: #4caf50;
  transform: scale(1.05);
}
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}
.sidebar-logo-icon {
  width: 36px;
  height: 36px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}
.sidebar-nav {
  flex: 1;
  padding: 15px 0;
  overflow-y: auto;
}
.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar-menu-item {
  margin-bottom: 5px;
  position: relative;
}
.sidebar-menu-link {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 4px;
  margin: 0 5px;
  font-size: 1rem;
}
.sidebar-menu-link:hover {
  background-color: #f0f8f0;
  color: #4caf50;
  transform: translateX(3px);
}
.sidebar-menu-item.active > .sidebar-menu-link {
  background-color: rgba(76, 175, 80, 0.15);
  color: #4caf50;
  font-weight: 500;
}
.sidebar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 12px;
  color: inherit;
}
.sidebar-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1rem;
}
.sidebar-arrow {
  margin-left: 5px;
  transition: transform 0.2s ease;
  color: #777;
  font-size: 1rem;
}
.arrow-down {
  transform: rotate(90deg);
  color: #4caf50;
}
.sidebar-submenu {
  list-style: none;
  padding: 0;
  margin: 5px 0 5px 45px;
}
.sidebar-submenu-item {
  margin-bottom: 5px;
}
.sidebar-submenu-link {
  display: block;
  padding: 8px 10px;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 4px;
  font-size: 0.9rem;
  position: relative;
}
.sidebar-submenu-link:hover {
  color: #4caf50;
  background-color: #f0f8f0;
  transform: translateX(3px);
}
.sidebar-submenu-item.active .sidebar-submenu-link {
  color: #4caf50;
  font-weight: 500;
  background-color: rgba(76, 175, 80, 0.1);
}
.sidebar-footer {
  padding: 15px;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.sidebar-footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
.sidebar-help a {
  color: #4caf50;
  text-decoration: none;
  font-size: 0.9rem;
}
.sidebar-help a:hover {
  text-decoration: underline;
}
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #333;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 8px 12px;
  width: 100%;
  transition: all 0.2s ease;
}
.logout-button:hover {
  background-color: #e8f5e9;
  color: #4caf50;
  border-color: #4caf50;
}
.logout-button svg {
  width: 18px;
  height: 18px;
}

/* Mobile Footer Navigation Styles */
.mobile-footer-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 65px;
  background-color: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: #2c3e50;
  padding: 5px 0;
  transition: background-color 0.2s ease;
  font-size: 0.85rem;
}
.mobile-nav-item.active {
  color: #4caf50;
}
.mobile-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.mobile-nav-text {
  font-size: 0.85rem;
  text-align: center;
}

/* Mobile Submenu Styles */
.mobile-submenu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.mobile-submenu-container {
  background-color: white;
  width: 100%;
  max-height: 70vh;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.mobile-submenu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}
.mobile-submenu-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}
.mobile-submenu-close {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
}
.mobile-submenu-content {
  overflow-y: auto;
  max-height: calc(70vh - 60px);
}
.mobile-submenu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.mobile-submenu-list li {
  padding: 15px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
}
.mobile-submenu-list li:hover {
  background-color: #f0f8f0;
  color: #4caf50;
}
.mobile-submenu-list li span {
  color: #2c3e50;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 10px;
}
.logout-option span {
  color: #e53935;
}

/* Adjust main content padding for mobile footer */
@media (max-width: 1023px) {
  .main-content {
    padding-bottom: 75px; /* Add padding to account for mobile footer */
  }
}

.alert-badge {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #ef4444;
  color: white;
  border-radius: 9999px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0 6px;
}
</style>
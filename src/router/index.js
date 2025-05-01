import { createRouter, createWebHashHistory } from 'vue-router';

// Import views/components dynamically for lazy loading
const HomeView = () => import('../views/HomeView.vue');
const DashboardView = () => import('../views/DashboardView.vue');
const DeviceRegistrationView = () => import('../views/DeviceRegistrationView.vue');
const DeviceListView = () => import('../views/DeviceListView.vue');
const RegisterResidentsView = () => import('../views/RegisterResidentsView.vue');
const RegisterResidentsView2 = () => import('../views/RegisterResidentsView2.vue');
const ResidentsDataView = () => import('../views/ResidentsDataView.vue');
const AdminDataView = () => import('../views/AdminDataView.vue');
const AdminRegistrationView = () => import('../views/AdminRegistrationView.vue');
const UsageReportsView = () => import('../views/UsageReportsView.vue');
const BillingView = () => import('../views/BillingView.vue');
const AlertsView = () => import('../views/AlertsView.vue');
const SettingsView = () => import('../views/SettingsView.vue');
const HelpSupportView = () => import('../views/HelpSupportView.vue');
const LoginForm = () => import('../components/LoginForm.vue'); // Import LoginForm


const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login', // Add login route
    name: 'login',
    component: LoginForm,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }, // Require authentication
  },
  {
    path: '/device/register',
    name: 'deviceRegistration',
    component: DeviceRegistrationView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/device/list',
    name: 'deviceList',
    component: DeviceListView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/resident/register1',
    name: 'registerResidents',
    component: RegisterResidentsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/resident/register2',
    name: 'registerResidents2',
    component: RegisterResidentsView2,
  },
  {
    path: '/admin/residents',
    name: 'residentsData',
    component: ResidentsDataView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/admin/data',
    name: 'adminData',
    component: AdminDataView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/admin/register',
    name: 'adminRegistration',
    component: AdminRegistrationView,
    meta: { requiresAuth: true },
  },
  {
    path: '/reports/usage',
    name: 'usageReports',
    component: UsageReportsView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/reports/billing',
    name: 'billing',
    component: BillingView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/reports/alerts',
    name: 'alerts',
    component: AlertsView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true }, // Protect route
  },
  {
    path: '/help',
    name: 'help',
    component: HelpSupportView,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Navigation Guard for Protected Routes
import { getAuth, onAuthStateChanged } from 'firebase/auth';

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const auth = getAuth();
  let user = null;

  // Check if the user is authenticated
  await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      user = currentUser;
      resolve();
      unsubscribe(); // Unsubscribe after getting the user state
    });
  });

  if (requiresAuth && !user) {
    // Redirect to login if not authenticated
    next({ name: 'login' });
  } else if (to.name === 'login' && user) {
    // Redirect to dashboard if already logged in
    next({ name: 'dashboard' });
  } else {
    next(); // Proceed to the requested route
  }
});

export default router;
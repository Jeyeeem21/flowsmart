```vue
<template>
  <div class="settings-container">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <h1 class="settings-title">Settings</h1>

    <!-- Error Message -->
    <div v-if="error" :class="{ 'error-message': true, 'success': error.includes('successfully') }">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading" role="status">
      Loading settings...
    </div>

    <!-- Settings Content -->
    <div v-else class="settings-content">
      <!-- Flex Container for Account and Usage Sections -->
      <div class="settings-row">
        <!-- 1. Account Settings -->
        <section class="settings-section account-settings">
          <h2><i class="fas fa-user"></i> Account Settings</h2>
          <form @submit.prevent="saveProfile">
            <!-- Profile Info -->
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                v-model="profile.fullName"
                required
                placeholder="Enter your full name"
                aria-label="Edit full name"
              />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                v-model="profile.email"
                required
                placeholder="Enter your email"
                aria-label="Edit email"
              />
            </div>
            <div class="form-group">
              <label for="contactNumber">Contact Number</label>
              <input
                type="tel"
                id="contactNumber"
                v-model="profile.contactNumber"
                placeholder="Enter your contact number"
                aria-label="Edit contact number"
              />
            </div>
            <div class="form-group readonly">
              <label>Device ID</label>
              <input
                type="text"
                :value="profile.deviceId || 'Not set'"
                readonly
                aria-label="Device ID (read-only)"
              />
            </div>
            <div class="form-group readonly">
              <label>Account Number</label>
              <input
                type="text"
                :value="profile.accountNumber || 'Not set'"
                readonly
                aria-label="Account Number (read-only)"
              />
            </div>

            <button
              type="submit"
              class="save-button"
              :disabled="saving"
              aria-label="Save profile information"
            >
              <i class="fas fa-save"></i> Save Profile
            </button>
          </form>

          <!-- Change Password -->
          <div class="form-group button-spacing">
            <button
              class="action-button"
              @click="changePassword"
              :disabled="saving"
              aria-label="Change password"
            >
              <i class="fas fa-key"></i> Change Password
            </button>
          </div>
        </section>

        <!-- 2. Usage & Threshold Settings -->
        <section class="settings-section usage-settings">
          <h2><i class="fas fa-cog"></i> Usage & Threshold Settings</h2>
          <form @submit.prevent="saveUsageSettings">
            <!-- Billing Rate (Admin Only) -->
            <div v-if="isAdmin" class="form-group">
              <label for="billingRate">Amount Cubic Quota (₱)</label>
              <input
                type="number"
                id="billingRate"
                v-model.number="billingRate"
                step="0.01"
                min="0"
                required
                placeholder="e.g., 10.00"
                aria-label="Set billing rate per cubic meter"
              />
              <p class="form-note">Base rate for water usage, billed in cubic meters.</p>
            </div>

            <!-- Price per Cubic Meter Above Quota (Admin Only) -->
            <div v-if="isAdmin" class="form-group">
              <label for="pricePerCubicMeterAboveQuota">Price per Cubic Meter Above Quota (₱)</label>
              <input
                type="number"
                id="pricePerCubicMeterAboveQuota"
                v-model.number="pricePerCubicMeterAboveQuota"
                step="0.01"
                min="0"
                required
                placeholder="e.g., 50.00"
                aria-label="Set price per cubic meter above quota"
              />
              <p class="form-note">Surcharge applied to usage above quota, billed in cubic meters.</p>
            </div>

            <!-- Monthly Quota Settings (Admin Only) -->
            <div v-if="isAdmin" class="form-group">
              <label for="monthlyQuotaCubicMeters">Monthly Quota (Cubic Meters)</label>
              <input
                type="number"
                id="monthlyQuotaCubicMeters"
                v-model.number="monthlyQuotaCubicMeters"
                min="0"
                step="0.01"
                required
                placeholder="e.g., 6.0"
                aria-label="Set monthly usage quota in cubic meters"
              />
              <p class="form-note">Usage above this quota incurs a surcharge.</p>
            </div>

            <!-- Billing Calculation Day (Admin Only) -->
            <div v-if="isAdmin" class="form-group">
              <label for="billingCalculationDate">Billing Calculation Day</label>
              <input
                type="number"
                id="billingCalculationDate"
                v-model.number="billingCalculationDate"
                min="1"
                max="31"
                required
                placeholder="e.g., 15"
                aria-label="Set billing calculation day of the month"
                @blur="validateBillingDay"
              />
              <p class="form-note">Day of the month when the bill is calculated (1-31).</p>
            </div>

            <!-- Daily Threshold Settings -->
            <div class="form-group">
              <label for="dailyThresholdCubicMeters">Daily Threshold (Cubic Meters)</label>
              <input
                type="number"
                id="dailyThresholdCubicMeters"
                v-model.number="dailyThresholdCubicMeters"
                min="0"
                step="0.01"
                required
                placeholder="e.g., 0.1"
                aria-label="Set daily usage threshold in cubic meters"
              />
              <p class="form-note">Alerts trigger when daily usage is ≥ this threshold.</p>
            </div>

            <!-- Alert Preferences -->
            <div class="form-group">
              <label>Alert Preferences</label>
              <div class="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    v-model="notifyOnThreshold"
                    aria-label="Notify when daily usage exceeds threshold"
                  />
                  Notify me when daily usage exceeds threshold
                </label>
              </div>
            </div>

            <button
              type="submit"
              class="save-button"
              :disabled="saving"
              aria-label="Save usage and threshold settings"
            >
              <i class="fas fa-save"></i> Save
            </button>
          </form>
        </section>
      </div>

      <!-- 3. Display Preferences -->
      <section class="settings-section display-settings">
        <h2><i class="fas fa-paint-brush"></i> Display Preferences</h2>
        <div class="form-group">
          <label>Theme Mode</label>
          <div class="radio-group">
            <label>
              <input
                type="radio"
                v-model="themeMode"
                value="light"
                aria-label="Light theme mode"
                @change="saveDisplayPreferences"
              />
              Light Mode
            </label>
            <label>
              <input
                type="radio"
                v-model="themeMode"
                value="dark"
                aria-label="Dark theme mode"
                @change="saveDisplayPreferences"
              />
              Dark Mode
            </label>
            <label>
              <input
                type="radio"
                v-model="themeMode"
                value="system"
                aria-label="System default theme mode"
                @change="saveDisplayPreferences"
              />
              System Default
            </label>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'Settings',
  setup() {
    const router = useRouter();
    const error = ref(null);
    const loading = ref(true);
    const saving = ref(false);
    const isAdmin = ref(false);
    const billingRate = ref(100.00); // ₱ per m³
    const pricePerCubicMeterAboveQuota = ref(50.00); // ₱ per m³ above quota
    const monthlyQuotaCubicMeters = ref(10.0); // cubic meters
    const billingCalculationDate = ref(''); // Day of month (1-31)
    const dailyThresholdCubicMeters = ref(0.1); // cubic meters
    const notifyOnThreshold = ref(false);
    const themeMode = ref('system'); // Theme: light, dark, system
    const profile = ref({
      fullName: '',
      email: '',
      contactNumber: '',
      deviceId: null,
      accountNumber: '',
    });

    // Fetch user data and settings
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          error.value = 'Please sign in to access settings.';
          return;
        }

        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isAdmin.value = userData.role === 'admin';
          profile.value = {
            fullName: userData.fullName || '',
            email: userData.email || user.email,
            contactNumber: userData.contactNumber || '',
            deviceId: userData.deviceId || null,
            accountNumber: userData.accountNumber || '',
          };
        } else {
          error.value = 'User profile not found. Please contact support.';
          return;
        }

        // Fetch threshold settings
        const thresholdDoc = await getDoc(doc(db, 'threshold', user.uid));
        if (thresholdDoc.exists()) {
          const thresholdData = thresholdDoc.data();
          dailyThresholdCubicMeters.value = thresholdData.dailyThresholdCubicMeters || 0.1;
          notifyOnThreshold.value = thresholdData.notifyOnThreshold || false;
        }

        // Fetch global settings
        const settingsDoc = await getDoc(doc(db, 'Settings', 'global'));
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data();
          billingRate.value = settingsData.billingRate || 100.00;
          pricePerCubicMeterAboveQuota.value = settingsData.pricePerCubicMeterAboveQuota || 50.00;
          monthlyQuotaCubicMeters.value = settingsData.monthlyQuotaCubicMeters || 10.0;
          billingCalculationDate.value = settingsData.billingCalculationDate || ''; // Now a number (1-31)
        }
      } catch (err) {
        error.value = 'Failed to load settings. Please try again.';
        console.error('Fetch data error:', err.message);
      } finally {
        loading.value = false;
      }
    };

    // Validate billing calculation day
    const validateBillingDay = () => {
      if (
        billingCalculationDate.value < 1 ||
        billingCalculationDate.value > 31 ||
        !Number.isInteger(Number(billingCalculationDate.value))
      ) {
        error.value = 'Please enter a valid day between 1 and 31.';
        billingCalculationDate.value = ''; // Reset invalid input
        setTimeout(() => (error.value = null), 3000);
      }
    };

    // Save usage and threshold settings
    const saveUsageSettings = async () => {
      saving.value = true;
      error.value = null;
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user.');

        // Validate numeric inputs
        if (
          (isAdmin.value &&
            (billingRate.value < 0 ||
              pricePerCubicMeterAboveQuota.value < 0 ||
              monthlyQuotaCubicMeters.value < 0 ||
              billingCalculationDate.value < 1 ||
              billingCalculationDate.value > 31 ||
              !Number.isInteger(Number(billingCalculationDate.value)))) ||
          dailyThresholdCubicMeters.value < 0
        ) {
          error.value =
            'Please enter valid non-negative numbers and a billing day between 1 and 31.';
          return;
        }

        // Save global settings (admin only)
        if (isAdmin.value) {
          console.log('Saving global settings:', {
            billingRate: billingRate.value,
            pricePerCubicMeterAboveQuota: pricePerCubicMeterAboveQuota.value,
            monthlyQuotaCubicMeters: monthlyQuotaCubicMeters.value,
            billingCalculationDate: billingCalculationDate.value,
          });
          await setDoc(
            doc(db, 'Settings', 'global'),
            {
              billingRate: billingRate.value,
              pricePerCubicMeterAboveQuota: pricePerCubicMeterAboveQuota.value,
              monthlyQuotaCubicMeters: monthlyQuotaCubicMeters.value,
              billingCalculationDate: billingCalculationDate.value,
            },
            { merge: true }
          );
        }

        // Save threshold settings
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : { role: 'resident' };
        const thresholdId = isAdmin.value ? 'admin' : userData.deviceId || '';
        console.log('Saving threshold settings:', {
          dailyThresholdCubicMeters: dailyThresholdCubicMeters.value,
          notifyOnThreshold: notifyOnThreshold.value,
          role: userData.role,
          id: thresholdId,
        });
        await setDoc(doc(db, 'threshold', user.uid), {
          dailyThresholdCubicMeters: dailyThresholdCubicMeters.value,
          notifyOnThreshold: notifyOnThreshold.value,
          role: userData.role || 'resident',
          id: thresholdId,
        });

        error.value = 'Settings saved successfully!';
        setTimeout(() => (error.value = null), 3000);
      } catch (err) {
        error.value = 'Failed to save settings. Please try again.';
        console.error('Save usage settings error:', err.message);
      } finally {
        saving.value = false;
      }
    };

    // Save display preferences
    const saveDisplayPreferences = () => {
      try {
        localStorage.setItem('themeMode', themeMode.value);
        applyDisplayPreferences();
        console.log('Display preferences saved:', { themeMode: themeMode.value });
        error.value = 'Display preferences saved successfully!';
        setTimeout(() => (error.value = null), 3000);
      } catch (err) {
        error.value = 'Failed to save display preferences.';
        console.error('Save display preferences error:', err.message);
      }
    };

    // Apply display preferences
    const applyDisplayPreferences = () => {
      const root = document.documentElement;
      if (themeMode.value === 'dark') {
        root.classList.add('dark');
      } else if (themeMode.value === 'light') {
        root.classList.remove('dark');
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemDark);
      }
    };

    // Load display preferences
    const loadDisplayPreferences = () => {
      themeMode.value = localStorage.getItem('themeMode') || 'system';
      applyDisplayPreferences();
    };

    // Save profile
    const saveProfile = async () => {
      saving.value = true;
      error.value = null;
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user.');

        if (!profile.value.fullName || !profile.value.email) {
          error.value = 'Full name and email are required.';
          return;
        }

        console.log('Saving profile:', profile.value);
        await updateDoc(doc(db, 'users', user.uid), {
          fullName: profile.value.fullName,
          email: profile.value.email,
          contactNumber: profile.value.contactNumber,
        });

        error.value = 'Profile saved successfully!';
        setTimeout(() => (error.value = null), 3000);
      } catch (err) {
        error.value = 'Failed to save profile. Please try again.';
        console.error('Save profile error:', err.message);
      } finally {
        saving.value = false;
      }
    };

    // Change password
    const changePassword = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user.');

        if (user.providerData.some(provider => provider.providerId === 'google.com')) {
          error.value = 'Google account detected. Change password via Google Account settings.';
        } else {
          await sendPasswordResetEmail(auth, user.email);
          error.value = 'Password reset email sent. Check your inbox.';
        }
        setTimeout(() => (error.value = null), 5000);
      } catch (err) {
        error.value = 'Failed to send password reset email.';
        console.error('Change password error:', err.message);
      }
    };

    // Logout
    const logout = async () => {
      try {
        await signOut(auth);
        router.push('/login');
        console.log('User logged out.');
      } catch (err) {
        error.value = 'Failed to log out.';
        console.error('Logout error:', err.message);
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      loadDisplayPreferences();
      fetchData();
    });

    onUnmounted(() => {
      // Clean up if needed
    });

    return {
      error,
      loading,
      saving,
      isAdmin,
      billingRate,
      pricePerCubicMeterAboveQuota,
      monthlyQuotaCubicMeters,
      billingCalculationDate,
      dailyThresholdCubicMeters,
      notifyOnThreshold,
      themeMode,
      profile,
      saveUsageSettings,
      saveDisplayPreferences,
      saveProfile,
      changePassword,
      logout,
      validateBillingDay,
    };
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

:root {
  --primary-color: #388e3c;
  --button-color: #28a745;
  --button-hover-color: #4caf50;
  --secondary-color: #2c3e50;
  --background-light: #f9f9f9;
  --border-color: #d1d5db;
  --text-dark: #1f2937;
  --text-medium: #4b5563;
  --text-light: #6b7280;
  --error-color: #c62828;
  --focus-shadow: 0 0 0 3px rgba(56, 142, 60, 0.2);
}

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}

.settings-container {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-height: 100vh;
  margin: 0;
}

.settings-title {
  font-size: 1.75rem;
  color: var(--secondary-color);
  margin-bottom: 2rem;
  font-weight: 600;
  text-align: center;
}

.error-message {
  background-color: #ffebee;
  color: var(--error-color);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid var(--error-color);
  animation: fadeIn 0.3s ease-in-out;
  text-align: center;
}

.error-message.success {
  background-color: #e8f5e9;
  color: var(--primary-color);
  border-left-color: var(--primary-color);
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--text-medium);
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 2rem;
}

.settings-section {
  background: var(--background-light);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-width: 0;
}

.account-settings,
.usage-settings {
  flex: 1;
  min-width: 300px; /* Ensure sections don't get too narrow */
}

.display-settings {
  width: 100%;
}

.settings-section h2 {
  font-size: 1.2rem;
  color: var(--secondary-color);
  margin-bottom: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  max-width: 400px; /* Constrain input width for professionalism */
}

.form-group.button-spacing {
  margin-top: 2rem;
}

.form-group label {
  display: block;
  font-size: 0.95rem;
  color: var(--text-dark);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group select {
  width: 100%;
  min-width: 200px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-dark);
  background-color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: var(--focus-shadow);
}

.form-group input:invalid {
  border-color: var(--error-color);
}

.form-group.readonly input {
  background: #f3f4f6;
  cursor: not-allowed;
  color: var(--text-light);
}

/* Style for number input to match other inputs */
.form-group input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.form-group input[type="number"]::-webkit-inner-spin-button,
.form-group input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-note {
  font-size: 0.8rem;
  color: var(--text-medium);
  margin-top: 0.5rem;
  font-style: italic;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-group label,
.checkbox-group label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-dark);
  gap: 0.5rem;
  cursor: pointer;
}

.save-button,
.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: var(--button-color);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.save-button:hover,
.action-button:hover {
  background-color: var(--button-hover-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.save-button:disabled,
.action-button:disabled {
  background-color: #6c757d;
  color: #ffffff;
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  text-shadow: none;
}

/* Responsive Design */
@media (min-width: 992px) {
  .settings-container {
    padding: 3rem;
  }
  .settings-title {
    font-size: 2rem;
  }
  .settings-section {
    padding: 2rem;
  }
  .form-group input,
  .form-group select {
    font-size: 0.95rem;
    padding: 0.8rem 1.2rem;
  }
}

@media (min-width: 768px) and (max-width: 991.99px) {
  .settings-container {
    padding: 2rem;
  }
  .settings-title {
    font-size: 1.75rem;
  }
  .settings-section {
    padding: 1.5rem;
  }
  .settings-row {
    flex-direction: row;
  }
}

@media (max-width: 767.99px) {
  .settings-container {
    padding: 1.5rem;
  }
  .settings-title {
    font-size: 1.5rem;
  }
  .settings-section {
    padding: 1rem;
  }
  .settings-row {
    flex-direction: column;
  }
  .form-group {
    max-width: 100%;
  }
  .form-group input,
  .form-group select {
    font-size: 0.85rem;
    padding: 0.65rem 0.9rem;
  }
  .save-button,
  .action-button {
    font-size: 0.9rem;
    padding: 0.65rem 1.2rem;
  }
  .form-note {
    font-size: 0.75rem;
  }
}

@media (max-width: 400px) {
  .settings-container {
    padding: 1rem;
  }
  .settings-title {
    font-size: 1.25rem;
  }
  .settings-section h2 {
    font-size: 1rem;
  }
  .form-group label {
    font-size: 0.9rem;
  }
  .form-group input,
  .form-group select {
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
  }
  .save-button,
  .action-button {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
  .form-note {
    font-size: 0.7rem;
  }
}
</style>
```
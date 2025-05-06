<template>
  <div class="w-full min-h-screen bg-gray-100">
    <!-- Include Tailwind CSS and Font Awesome CDNs -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-white">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center transition-transform duration-300 hover:scale-105">
        Privacy Policy
      </h1>

      <!-- Privacy Policy Section -->
      <section class="bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-shield-alt mr-3 text-green-500"></i> Privacy Policy
        </h2>
        <hr class="border-gray-200 mb-6">

        <!-- Policy Content -->
        <div class="mb-8">
          <p class="text-gray-600 mb-4 text-base sm:text-lg">At Smart Water Meter, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your data when you use our system, including the hardware (Arduino Uno, ESP32, sensors), mobile/web application, and Firebase backend. By using our system, you agree to this policy.</p>

          <div class="space-y-6">
            <!-- 1. Data Collection -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">1. Data Collection</h3>
              <p class="text-gray-600 text-base sm:text-lg">We collect the following data:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li><strong>Device Data</strong>: Water usage (from YF-S201 flow sensor), water quality metrics (TDS from TDS sensor, pH/turbidity if applicable), collected by the Arduino Uno and sent to Firebase via ESP32.</li>
                <li><strong>User Account Data</strong>: Email, password, and device ID provided during app registration.</li>
                <li><strong>Usage Data</strong>: Interaction with the app (e.g., viewing dashboards, setting alerts), logged for analytics.</li>
              </ul>
            </div>

            <!-- 2. Data Usage -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">2. Data Usage</h3>
              <p class="text-gray-600 text-base sm:text-lg">We use your data to:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>Provide real-time water usage and quality monitoring through the app.</li>
                <li>Generate analytics and trends (daily, monthly, yearly) for residents and admins.</li>
                <li>Send alerts based on user-defined thresholds (e.g., high usage, poor water quality).</li>
                <li>Improve system performance and user experience through anonymized usage data.</li>
              </ul>
            </div>

            <!-- 3. Data Storage -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">3. Data Storage</h3>
              <p class="text-gray-600 text-base sm:text-lg">Your data is stored securely:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>Data is stored in Firebase Realtime Database or Firestore with encryption at rest and in transit.</li>
                <li>Resident data is accessible only to the account owner; admin data is accessible to authorized admins.</li>
                <li>Data retention follows Firebase’s default policies unless you request deletion.</li>
              </ul>
            </div>

            <!-- 4. Data Sharing -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">4. Data Sharing</h3>
              <p class="text-gray-600 text-base sm:text-lg">We handle your data responsibly:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>We do not sell or share your data with third parties, except as required by law or with your explicit consent.</li>
                <li>Data may be shared with Firebase (Google Cloud) for storage and processing, subject to their privacy policies.</li>
                <li>Admins may view resident data for system management, but access is restricted to authorized personnel.</li>
              </ul>
            </div>

            <!-- 5. Security Measures -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">5. Security Measures</h3>
              <p class="text-gray-600 text-base sm:text-lg">We protect your data with:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>Encryption for data transmission (HTTPS) and storage (Firebase encryption).</li>
                <li>Secure authentication for app access (email/password, device ID).</li>
                <li>Regular firmware updates for Arduino Uno and ESP32 to address vulnerabilities.</li>
                <li>Access controls to limit data visibility (residents see only their data, admins see all).</li>
              </ul>
            </div>

            <!-- 6. User Rights -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">6. User Rights</h3>
              <p class="text-gray-600 text-base sm:text-lg">You have the following rights:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li><strong>Access</strong>: View your data via the app’s dashboard or analytics.</li>
                <li><strong>Deletion</strong>: Request data deletion by contacting us (see below). We will remove your data from Firebase within 30 days.</li>
                <li><strong>Correction</strong>: Update your account details in the app’s settings.</li>
                <li><strong>Opt-Out</strong>: Disable analytics by contacting support; core data collection (usage, quality) is required for system functionality.</li>
              </ul>
            </div>

            <!-- 7. Contact for Inquiries -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">7. Contact for Inquiries</h3>
              <p class="text-gray-600 text-base sm:text-lg">For privacy-related questions or requests, please contact us (see below).</p>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Contact Information</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Reach out to our team for privacy inquiries or data requests:</p>
          <ul class="list-none space-y-4 text-gray-600 text-base sm:text-lg">
            <li class="flex items-center">
              <i class="fas fa-envelope mr-3 text-green-500"></i>
              <strong>Email</strong>: <a href="mailto:support@watermeter.app" class="text-blue-500 hover:underline transition-colors duration-200 ml-2">support@watermeter.app</a>
            </li>
            <li class="flex items-center">
              <i class="fas fa-phone mr-3 text-green-500"></i>
              <strong>Phone</strong>: <span class="ml-2">+63 912 345 6789</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-clock mr-3 text-green-500"></i>
              <strong>Support Hours</strong>: <span class="ml-2">Monday - Friday, 9:00 AM - 5:00 PM (PHT)</span>
            </li>
          </ul>
        </div>

      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrivacyPolicy',
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}


</style>
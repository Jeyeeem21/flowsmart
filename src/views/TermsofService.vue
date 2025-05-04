<template>
  <div class="w-full min-h-screen bg-gray-100">
    <!-- Include Tailwind CSS and Font Awesome CDNs -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-white">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center transition-transform duration-300 hover:scale-105">
        Terms of Service
      </h1>

      <!-- Terms of Service Section -->
      <section class="bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-file-contract mr-3 text-green-500"></i> Terms of Service
        </h2>
        <hr class="border-gray-200 mb-6">

        <!-- Terms Content -->
        <div class="mb-8">
          <p class="text-gray-600 mb-4 text-base sm:text-lg">By using the Smart Water Meter system, including the hardware (Arduino Uno, ESP32, sensors), mobile/web application, and Firebase backend, you agree to the following terms of service. Please read them carefully.</p>

          <div class="space-y-6">
            <!-- 1. Acceptance of Terms -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">1. Acceptance of Terms</h3>
              <p class="text-gray-600 text-base sm:text-lg">By accessing or using the Smart Water Meter system, you agree to be bound by these Terms of Service. If you do not agree, you must not use the system. We may update these terms periodically, and continued use constitutes acceptance of the updated terms.</p>
            </div>

            <!-- 2. User Responsibilities -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">2. User Responsibilities</h3>
              <p class="text-gray-600 text-base sm:text-lg">You are responsible for:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>Properly installing and maintaining the hardware (Arduino Uno, ESP32, YF-S201 flow sensor, TDS sensor) as per the installation guide.</li>
                <li>Ensuring a stable 2.4 GHz Wi-Fi connection for the ESP32 to communicate with Firebase.</li>
                <li>Using the mobile/web app in accordance with its intended purpose (monitoring water usage and quality).</li>
                <li>Not tampering with or modifying the hardware or software, which may void warranties or cause malfunctions.</li>
              </ul>
            </div>

            <!-- 3. Data Privacy -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">3. Data Privacy</h3>
              <p class="text-gray-600 text-base sm:text-lg">We prioritize your privacy:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>All data collected (water usage, TDS, pH, turbidity) is stored securely in Firebase with encryption.</li>
                <li>Data is accessible only to authorized users (residents for their device, admins for all devices).</li>
                <li>We do not share your data with third parties without your consent, except as required by law.</li>
                <li>For details, refer to our Privacy Policy at <a href="https://watermeter.app/privacy" class="text-blue-500 hover:underline transition-colors duration-200">watermeter.app/privacy</a>.</li>
              </ul>
            </div>

            <!-- 4. Limitations of Liability -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">4. Limitations of Liability</h3>
              <p class="text-gray-600 text-base sm:text-lg">The Smart Water Meter system is provided "as is" without warranties:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>We are not liable for damages caused by improper installation, misuse, or hardware failures (e.g., sensor malfunctions).</li>
                <li>Data accuracy (e.g., water usage, TDS readings) depends on proper sensor maintenance and calibration.</li>
                <li>We are not responsible for service interruptions due to power outages, Wi-Fi issues, or Firebase downtime.</li>
              </ul>
            </div>

            <!-- 5. Termination of Service -->
            <div>
              <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-2">5. Termination of Service</h3>
              <p class="text-gray-600 text-base sm:text-lg">We reserve the right to terminate or suspend your access to the system if:</p>
              <ul class="list-disc list-inside space-y-2 text-gray-600 text-base sm:text-lg">
                <li>You violate these Terms of Service.</li>
                <li>You engage in unauthorized use or tampering with the system.</li>
                <li>You fail to maintain the hardware or app as required.</li>
              </ul>
              <p class="text-gray-600 text-base sm:text-lg mt-2">You may discontinue use at any time by ceasing to use the hardware and app.</p>
            </div>

          </div>
        </div>


      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TermsOfService',
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}


</style>
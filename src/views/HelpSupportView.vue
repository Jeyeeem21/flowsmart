<template>
  <div class="w-full min-h-screen bg-gray-100">
    <!-- Include Tailwind CSS and Font Awesome CDNs -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-white">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 transition-transform duration-300 hover:scale-105">
        Help & Support
      </h1>

      <!-- 1. Getting Started -->
      <section class="mb-12 bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-rocket mr-3 text-green-500"></i> Getting Started
        </h2>
        <hr class="border-gray-200 mb-6">

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Installation Guide</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Set up your smart water meter with Arduino Uno and ESP32:</p>
          <ol class="list-decimal list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>Unpack the Devices</strong>: Ensure you have the Arduino Uno, ESP32, YF-S201 flow sensor, TDS sensor, power adapters, jumper wires, and mounting kit.</li>
            <li><strong>Connect Sensors to Arduino Uno</strong>:
              <ul class="list-disc list-inside ml-6 space-y-2">
                <li><strong>YF-S201 Flow Sensor</strong>: Connect the signal pin to digital pin D2, VCC to 5V, and GND to GND on the Arduino Uno. Ensure the arrow on the sensor aligns with water flow direction.</li>
                <li><strong>TDS Sensor</strong>: Connect the signal pin to analog pin A0, VCC to 3.3V, and GND to GND on the Arduino Uno. Secure the probe in the water line.</li>
              </ul>
            </li>
            <li><strong>Connect Arduino Uno to ESP32</strong>:
              <ul class="list-disc list-inside ml-6 space-y-2">
                <li>Use jumper wires to connect Arduino Uno’s TX (pin 1) to ESP32’s RX (GPIO 16), and Arduino Uno’s RX (pin 0) to ESP32’s TX (GPIO 17).</li>
                <li>Connect GND of both boards to ensure a common ground.</li>
              </ul>
            </li>
            <li><strong>Power the Devices</strong>: Use a 5V USB adapter for the Arduino Uno (via USB or barrel jack) and a 5V USB adapter or 3.7V Li-Ion battery for the ESP32 (via micro-USB or VIN pin).</li>
            <li><strong>Program Arduino Uno</strong>: Upload the sensor reading code to the Arduino Uno using the Arduino IDE. The code should read YF-S201 and TDS data and send it via serial (9600 baud).</li>
            <li><strong>Configure ESP32 with Firebase</strong>:
              <ul class="list-disc list-inside ml-6 space-y-2">
                <li>Flash the ESP32 with firmware using the Arduino IDE. Include the Firebase-ESP32 library (available via Arduino Library Manager).</li>
                <li>Configure Wi-Fi credentials and Firebase project details (Host URL, API Key) in the code. Access the setup portal at 192.168.4.1 if needed.</li>
                <li>Ensure the ESP32 reads serial data from the Arduino Uno and sends it to Firebase Realtime Database or Firestore.</li>
              </ul>
            </li>
            <li><strong>Mount the System</strong>: Install the meter in the water line after the main valve, ensuring no leaks. Place both Arduino Uno and ESP32 in a waterproof enclosure.</li>
            <li><strong>Test the System</strong>: Turn on water flow, check serial monitor for Arduino Uno data, and verify data appears in the Firebase database and web app.</li>
          </ol>
        </div>

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">System Requirements</h3>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>Hardware</strong>: Arduino Uno, ESP32, YF-S201 flow sensor, TDS sensor, jumper wires, 5V USB adapters or 3.7V Li-Ion battery.</li>
            <li><strong>Wi-Fi</strong>: Stable 2.4 GHz connection (5 GHz not supported).</li>
            <li><strong>Software</strong>: Arduino IDE, Firebase-ESP32 library, Firebase project (Realtime Database or Firestore).</li>
            <li><strong>Device</strong>: Smartphone (iOS 12+ or Android 8+), tablet, or PC with Chrome, Firefox, or Safari for the web app.</li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">App Setup</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Install and configure the web or mobile app:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>Download</strong>: Access the web app at <a href="https://watermeter.app" class="text-blue-500 hover:underline transition-colors duration-200">watermeter.app</a> or download from iOS App Store or Google Play Store.</li>
            <li><strong>Register</strong>:
              <ul class="list-disc list-inside ml-6 space-y-2">
                <li><strong>Resident</strong>: Sign up with email, password, and device ID (on the ESP32). Verify email to activate.</li>
                <li><strong>Admin</strong>: Obtain credentials from support. Log in with email and password.</li>
              </ul>
            </li>
            <li><strong>Pair Device</strong>: Enter the ESP32 device ID to link it to your Firebase database. Admins can manage multiple devices.</li>
          </ul>
        </div>
      </section>

      <!-- 2. Using the System -->
      <section class="mb-12 bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-mobile-alt mr-3 text-green-500"></i> Using the System
        </h2>
        <hr class="border-gray-200 mb-6">

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Dashboard Overview</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Understand the home screen metrics:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>Daily Usage</strong>: Displays today’s consumption in liters or cubic meters.</li>
            <li><strong>Monthly Usage</strong>: Tracks monthly usage with daily trend graphs.</li>
            <li><strong>Yearly Usage</strong>: Summarizes annual usage with monthly breakdowns.</li>
            <li><strong>Admin View</strong>: Shows data for all resident devices, filterable by device or user.</li>
            <li><strong>Resident View</strong>: Displays only your device’s usage and quality metrics.</li>
          </ul>
        </div>

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Water Quality Monitoring</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Check water quality in the app:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>TDS</strong>: Measured in ppm. Safe: <500 ppm, Neutral: 500-1000 ppm, Contaminated: >1000 ppm.</li>
            <li><strong>pH</strong>: Shows acidity (if pH sensor installed). Ideal: 6.5-8.5.</li>
            <li><strong>Turbidity</strong>: Indicates clarity (if turbidity sensor installed). Lower values = clearer water.</li>
          </ul>
        </div>

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Setting Alerts</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Set up notifications for usage or quality issues:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li>Navigate to <strong>Settings > Alerts</strong>.</li>
            <li>Define thresholds (e.g., 100 liters/day, 1000 ppm TDS).</li>
            <li>Enable push or email notifications.</li>
            <li>Admins can set global or device-specific thresholds.</li>
          </ul>
        </div>

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Remote Access</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Access data remotely:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li>Log in to the mobile or web app.</li>
            <li>Verify device online status in the app.</li>
            <li>Admins access all resident data; residents see only their device.</li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Data Trends</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Analyze historical data:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li>Go to <strong>Analytics</strong> in the app.</li>
            <li>View daily, monthly, or yearly graphs.</li>
            <li>Identify usage spikes or quality issues.</li>
            <li>Admins can compare trends across devices.</li>
          </ul>
        </div>
      </section>

      <!-- 3. Troubleshooting -->
      <section class="mb-12 bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-tools mr-3 text-green-500"></i> Troubleshooting
        </h2>
        <hr class="border-gray-200 mb-6">

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Common Issues & Fixes</h3>
          <ul class="list-disc list-inside space-y-4 text-gray-600 text-base sm:text-lg">
            <li><strong>No Data Showing?</strong>
              <ul class="list-disc list-inside ml-6 space-y-2">
                <li>Check Arduino Uno power (LED on).</li>
                <li>Verify sensor wiring (YF-S201 to D2, TDS to A0 on Arduino Uno).</li>
                <li>Ensure serial connection between Arduino Uno and ESP32 (TX to RX, RX to TX, common GND).</li>
                <li>Check ESP32 Wi-Fi connection (verify in app or Firebase console).</li>
                <li>Confirm Firebase database rules allow writes from ESP32.</li>
                <li>Restart both Arduino Uno and ESP32 by unplugging/replugging power.</li>
              </ul>
            </li>
            <li><strong>No Alerts?</strong>
              <ul class="list-disc list-inside ml-6 space-y-2">
                <li>Confirm thresholds in <strong>Settings > Alerts</strong>.</li>
                <li>Check app notification permissions.</li>
                <li>Verify ESP32 is sending data to Firebase (check Firebase console).</li>
              </ul>
            </li>
            <li><strong>Inaccurate Data?</strong>
              <ul class="list-disc list-inside ml-6 space-y-2">
                <li>Clean YF-S201 sensor to remove debris.</li>
                <li>Check for air bubbles in the water line.</li>
                <li>Recalibrate TDS sensor with calibration solution.</li>
                <li>Verify Arduino Uno’s serial output matches ESP32’s Firebase data.</li>
              </ul>
            </li>
          </ul>
        </div>

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Resetting the Device</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Safely restart the system:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li>Unplug both Arduino Uno and ESP32 from power.</li>
            <li>Wait 10 seconds, then reconnect.</li>
            <li>Confirm devices are online in the app and Firebase console.</li>
            <li>Reflash Arduino Uno or ESP32 firmware via Arduino IDE if issues persist.</li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Connectivity Problems</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Improve Wi-Fi and serial performance:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li>Move ESP32 closer to the Wi-Fi router.</li>
            <li>Avoid interference from other electronics.</li>
            <li>Use a Wi-Fi extender for weak signals.</li>
            <li>Ensure router’s 2.4 GHz band is enabled.</li>
            <li>Check serial wiring (Arduino Uno TX/RX to ESP32 RX/TX).</li>
            <li>Verify baud rate (e.g., 9600) matches in Arduino Uno and ESP32 code.</li>
          </ul>
        </div>
      </section>

      <!-- 4. Maintenance Tips -->
      <section class="mb-12 bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-cogs mr-3 text-green-500"></i> Maintenance Tips
        </h2>
        <hr class="border-gray-200 mb-6">

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Sensor Cleaning Schedule</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Maintain sensor accuracy:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>YF-S201 Flow Sensor</strong>: Clean every 3 months with a soft brush and water.</li>
            <li><strong>TDS Sensor</strong>: Clean monthly with distilled water and a soft cloth.</li>
            <li>Check water lines for sediment every 6 months.</li>
          </ul>
        </div>

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Battery Replacement</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Replace backup batteries:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>ESP32 Li-Ion Battery</strong>: Replace every 12-18 months or at <20% capacity.</li>
            <li><strong>Arduino Uno Power</strong>: Ensure stable 5V USB or 9-12V barrel jack power; replace batteries if used.</li>
            <li>Power off both devices before replacement.</li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Firmware Updates</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Keep the system updated:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li>Check updates in <strong>Settings > Firmware</strong> in the app.</li>
            <li>Download firmware for Arduino Uno and ESP32 from <a href="" class="text-blue-500 hover:underline transition-colors duration-200">watermeter.app/support</a>.</li>
            <li>Flash via Arduino IDE or OTA (ESP32 only) in the app.</li>
          </ul>
        </div>
      </section>

      <!-- 5. Customer Support -->
      <section class="mb-12 bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-headset mr-3 text-green-500"></i> Customer Support
        </h2>
        <hr class="border-gray-200 mb-6">

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Contact Info</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Get assistance:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li><strong>Email</strong>: <a href="mailto:support@watermeter.app" class="text-blue-500 hover:underline transition-colors duration-200">jmpagaran24@gmail.com</a></li>
            <li><strong>Phone</strong>: +63 912 345 6789</li>
            <li><strong>Support Hours</strong>: Mon-Fri, 9:00 AM - 5:00 PM (PHT)</li>
          </ul>
        </div>

        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Feedback Form</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Report bugs or suggest features:</p>
          <ul class="list-disc list-inside space-y-3 text-gray-600 text-base sm:text-lg">
            <li>Visit <a href="https://watermeter.app/feedback" class="text-blue-500 hover:underline transition-colors duration-200">watermeter.app/feedback</a>.</li>
            <li>Include device ID, app version, and issue details.</li>
            <li>Response within 2-3 business days.</li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">FAQs</h3>
          <ul class="list-disc list-inside space-y-4 text-gray-600 text-base sm:text-lg">
            <li><strong>Can I use it for multiple households?</strong>
              <p class="ml-6 mt-2">Yes, admins can monitor multiple devices. Residents need one device per household.</p>
            </li>
            <li><strong>What happens during power outages?</strong>
              <p class="ml-6 mt-2">Backup battery powers the ESP32 for up to 12 hours. Data syncs when power resumes.</p>
            </li>
            <li><strong>Is my data private?</strong>
              <p class="ml-6 mt-2">Yes, data is encrypted and accessible only to authorized users.</p>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelpSupportView',
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}

</style>
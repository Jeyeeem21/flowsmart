<template>
  <div class="w-full min-h-screen bg-gray-100">
    <!-- Include Tailwind CSS and Font Awesome CDNs -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-white">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center transition-transform duration-300 hover:scale-105">
        Contact Us
      </h1>

      <!-- Contact Section -->
      <section class="bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex items-center">
          <i class="fas fa-headset mr-3 text-green-500"></i> Get in Touch
        </h2>
        <hr class="border-gray-200 mb-6">

        <!-- Contact Information -->
        <div class="mb-8">
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Contact Information</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Reach out to our team for support or inquiries:</p>
          <ul class="list-none space-y-4 text-gray-600 text-base sm:text-lg">
            <li class="flex items-center">
              <i class="fas fa-envelope mr-3 text-green-500"></i>
              <strong>Email</strong>: <a href="" class="text-blue-500 hover:underline transition-colors duration-200 ml-2">jmpagaran24@gmail.com</a>
            </li>
            <li class="flex items-center">
              <i class="fas fa-phone mr-3 text-green-500"></i>
              <strong>Phone</strong>: <span class="ml-2">+63 927 8067 324</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-clock mr-3 text-green-500"></i>
              <strong>Support Hours</strong>: <span class="ml-2">Monday - Friday, 9:00 AM - 5:00 PM (PHT)</span>
            </li>
          </ul>
        </div>


        <!-- Social Media (Optional) -->
        <div>
          <h3 class="text-xl sm:text-2xl font-medium text-gray-600 mb-4">Follow Us</h3>
          <p class="text-gray-600 mb-4 text-base sm:text-lg">Stay updated with our latest developments:</p>
          <ul class="list-none flex space-x-4">
            <li>
              <a href="https://github.com/Jeyeeem21/flowsmart" class="text-blue-500 hover:text-blue-600 transition-colors duration-200">
                <i class="fab fa-github text-2xl"></i>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContactView',
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

* {
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}

</style>
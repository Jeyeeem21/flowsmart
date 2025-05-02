<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <router-link to="/" class="home-button">Go Back Home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f6fa;
}

.not-found-content {
  text-align: center;
  padding: 40px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.not-found-content h1 {
  font-size: 6rem;
  margin-bottom: 20px;
  color: #e74c3c;
}

.not-found-content p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  color: #555;
}

.home-button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  font-weight: bold;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.home-button:hover {
  background-color: #2980b9;
}
</style>


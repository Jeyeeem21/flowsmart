import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import './firebase/config';

createApp(App).use(router).mount('#app')
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    store.dispatch('setUser', user); // Vuex/Pinia update
  }
});
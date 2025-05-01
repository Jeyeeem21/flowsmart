import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

// 🔥 Firebase imports
import { getAuth, onAuthStateChanged } from 'firebase/auth' // ✅ Add this line
import './firebase/config'

const app = createApp(App).use(router).mount('#app')

// ✅ Now it will work
const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Example: store.dispatch('setUser', user)
    console.log('User is signed in:', user)
  } else {
    console.log('No user signed in.')
  }
})
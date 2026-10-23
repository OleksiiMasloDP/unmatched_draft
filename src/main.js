import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/style.css";
import Header from "./components/Header.vue";

// Старий механізм запамʼятовування вкладки замінено роутингом
localStorage.removeItem("active_screen");

const app = createApp(App);

app.component("Header", Header);
app.use(router);

app.mount("#app");

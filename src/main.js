import { createApp } from "vue";
import App from "./App.vue";
import "./assets/style.css";
import Header from "./components/Header.vue";

const app = createApp(App);

app.component("Header", Header);

app.mount("#app");

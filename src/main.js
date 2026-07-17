import { createApp } from "vue";
import App from "./App.vue";
import "./assets/style.css";
import Header from "./components/Header.vue";
import createGtag from "vue-gtag";

const app = createApp(App);

app.use(
  createGtag({
    config: { id: "G-6BTH35KNGC" },
  }),
);

app.component("Header", Header);

app.mount("#app");

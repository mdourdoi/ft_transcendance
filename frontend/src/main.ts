import "./app.css";
import { mount } from "svelte";
import App from "./App.svelte";
import { waitLocale } from "$lib/i18n";

await waitLocale();

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;

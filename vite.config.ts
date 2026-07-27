import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/a.nemet/gradcpt-web-mind/",
}));

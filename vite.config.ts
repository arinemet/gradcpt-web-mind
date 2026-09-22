import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/a.nemet/gradcpt-web-mind/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        demo: resolve(__dirname, "687439-627493-679486-379428.html"),
      },
    },
  },
}));

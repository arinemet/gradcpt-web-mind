import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/a.nemet/gradcpt-web-mind/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        demo: resolve(
          __dirname,
          "20759461975940-637856984-52057489365784.html",
        ),
      },
    },
  },
}));

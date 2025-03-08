import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    host: true, // ネットワークエラーを回避
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});

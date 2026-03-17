import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Required by some Stellar SDK dependencies
    "process.env": {},
    global: "globalThis",
  },
});

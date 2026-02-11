import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const firebaseEnv = {
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || "",
    VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || "",
    VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || "",
    VITE_FIREBASE_STORAGE_BUCKET: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || "",
    VITE_FIREBASE_MESSAGING_SENDER_ID:
      env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || "",
    VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || "",
  };

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: Object.fromEntries(
      Object.entries(firebaseEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
    ),
  };
});

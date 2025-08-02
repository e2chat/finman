import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'node:url';

 // https://nuxt.com/docs/api/configuration/nuxt-config
 export default defineNuxtConfig({
   compatibilityDate: '2025-07-15',
   devtools: { enabled: true },
   vite: {
     plugins: [tailwindcss(),],
     resolve: {
       alias: {
         // Ensure @ and ~ point to /app for Nuxt 4 dir structure
         '@': fileURLToPath(new URL('./app', import.meta.url)),
         '~': fileURLToPath(new URL('./app', import.meta.url)),
       }
     }
   },
   css: ['~/assets/css/main.css'],
 })

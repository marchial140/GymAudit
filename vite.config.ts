import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig(({mode})=>({plugins:[react(),tailwindcss(),VitePWA({
 disable:mode==='ios',
 registerType:'prompt',
 includeAssets:['icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png'],
 manifest:{id:'/',name:'GymAudit',short_name:'GymAudit',description:'Analyse locale et privée de vos entraînements Hevy',lang:'fr',start_url:'/',scope:'/',display:'standalone',background_color:'#10141e',theme_color:'#10141e',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},
 workbox:{navigateFallback:'/index.html',globPatterns:['**/*.{js,css,html,png,svg,webmanifest}'],cleanupOutdatedCaches:true}
})]}));

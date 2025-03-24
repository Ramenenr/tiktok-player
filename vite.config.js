import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/tiktok-player/',
  plugins: [
    vue(),
  ],
  build: {
    // 添加这个配置来确保正确的模块解析
    rollupOptions: {
      external: [],
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,      // 指定端口号
  }
})

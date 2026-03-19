import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/bookings': {
        target: 'https://sollentuna.interbookfri.se',
        changeOrigin: true,
        rewrite: () => '/BookingAPI/GetBookingsForSchedule',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest')
            proxyReq.setHeader('Referer', 'https://sollentuna.interbookfri.se/')
            proxyReq.setHeader('Origin', 'https://sollentuna.interbookfri.se')
          })
        },
      },
      '/api/facilities': {
        target: 'https://sollentuna.interbookfri.se',
        changeOrigin: true,
        rewrite: () => '/APIBooking/GetSearchBookableFacilityObjectsFilterLists',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest')
            proxyReq.setHeader('Referer', 'https://sollentuna.interbookfri.se/')
            proxyReq.setHeader('Origin', 'https://sollentuna.interbookfri.se')
          })
        },
      },
    },
  },
})

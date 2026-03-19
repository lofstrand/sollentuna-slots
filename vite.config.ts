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
      },
      '/api/facilities': {
        target: 'https://sollentuna.interbookfri.se',
        changeOrigin: true,
        rewrite: () => '/APIBooking/GetSearchBookableFacilityObjectsFilterLists',
      },
    },
  },
})

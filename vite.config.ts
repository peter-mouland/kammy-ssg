import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        // react(),
        reactRouter()
    ],
    server: {
        port: 3000,
        host: true
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }
});

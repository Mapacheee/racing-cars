/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'game-primary': '#e74c3c',
                'game-secondary': '#3498db',
                'game-accent': '#4CAF50',
                'game-dark': '#2c3e50',
                'game-grass': '#4a5d23',
            },
            fontFamily: {
                mono: ['monospace'],
            },
        },
    },
    plugins: [],
}

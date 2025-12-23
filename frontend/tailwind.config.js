export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        error: '#ef4444',
        success: '#10b981'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      }
    }
  },
  plugins: [],
  safelist: [
    'bg-blue-100',
    'text-blue-900',
    'bg-gray-100',
    'text-gray-900',
    'bg-red-100',
    'text-red-900',
    'bg-green-100',
    'text-green-900'
  ]
}

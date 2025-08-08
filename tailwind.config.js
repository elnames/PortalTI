// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // 1. Colores corporativos
      colors: {
        primary: {
          DEFAULT: '#7367F0',
          light: '#8E86FF',
          dark: '#5E55D8',
        },
        secondary: {
          DEFAULT: '#82868B',
          light: '#A3A6AB',
          dark: '#5E6063',
        },
        success: '#28C76F',
        info: '#009EF7',
        warning: '#FF9F43',
        danger: '#EA5455',
        light: '#F8F9FA',
        dark: '#1E1E2D',
      },

      // 2. Tipografías (igual a Vuexy usa 'Inter')
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },

      // 3. Sombras más suaves/profundas
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        DEFAULT: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.1)',
      },

      // 4. Bordes redondeados más marcados
      borderRadius: {
        'md': '0.375rem',
        'lg': '0.5rem',
        '2xl': '1rem',
      },

      // 5. Espaciados extra para que no queden tan compactos
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),      // estilos base de formularios
    require('@tailwindcss/typography'), // utilidades de tipografía
  ],
}

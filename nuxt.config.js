const fs = require('fs')
const path = require('path')

export default {
  generate: {
    fallback: true,
    crawler: true,
    subFolders: true,
    routes () {
      const contentDir = `${__dirname}/content/news/`
      const routes = []
      fs.readdirSync(contentDir).forEach(file => {
        routes.push(`article/${path.parse(file).name}`)
      })

      console.log(`Generate static routes: ${routes}`)
      return routes
    }
  },
  server:
  {
    host: '0.0.0.0'
  },
  router:
  {
    base: '/'
  },
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'exadrums - news',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    'assets/style.scss'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/buefy
    'nuxt-buefy',
    // https://go.nuxtjs.dev/content
    '@nuxt/content',
    'nuxt-fontawesome'
  ],

  buefy: {
    materialDesignIcons: false,
    defaultIconPack: 'fas',
    defaultIconComponent: 'font-awesome-icon'
  },

  fontawesome: {
    imports: [
      {
        set: '@fortawesome/free-solid-svg-icons',
        icons: ['fas']
      }
    ]
  },

  // Content module configuration: https://go.nuxtjs.dev/config-content
  content: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    publicPath: (process.env.NODE_ENV !== 'production')? '' : './'
  }
}
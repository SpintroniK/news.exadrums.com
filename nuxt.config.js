let posts = [];

const constructFeedItem = (post, dir, hostname) => {  
  const url = `${hostname}/${dir}/${post.slug}`;
  return {
    title: post.title,
    id: url,
    link: url,
    description: post.description,
    content: post.bodyPlainText,
    date: new Date(post.updatedAt),
    published: new Date(post.createdAt)
  }
} 

const create = async (feed, args) => {
  const [filePath, ext, isLatest] = args;  
  const hostname = 'https://news.exadrums.com';
  feed.options = {
    title: "exadrums - news",
    description: "eXaDrums project: latest news.",
    link: `${hostname}/${isLatest ? 'latest':'feed'}.${ext}`
  }
  const { $content } = require('@nuxt/content')
  if (posts === null || posts.length === 0)
    posts = await $content(filePath).fetch();

  if (isLatest)
  {
    const post = await $content(filePath).sortBy('createdAt', 'desc').limit(1).fetch();
    const feedItem = await constructFeedItem(post[0], filePath, hostname);
    feed.addItem(feedItem);
    return feed;
  }

  for (const post of posts) {
    const feedItem = await constructFeedItem(post, filePath, hostname);
    feed.addItem(feedItem);
  }
  return feed;
}



export default {
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
    '@nuxtjs/feed',
    'nuxt-fontawesome'
  ],
  feed: [
    {
      path: '/feed.xml',
      create,
      cacheTime: 1000 * 60 * 15,
      type: 'rss2',
      data: [ 'article', 'xml', false]
    },
    {
      path: '/feed.json',
      create,
      cacheTime: 1000 * 60 * 15,
      type: 'json1',
      data: [ 'article', 'json', false ]
    },
    {
      path: '/latest.json',
      create,
      cacheTime: 1000 * 60 * 15,
      type: 'json1',
      data: [ 'article', 'json', true]
    },
  ],
  hooks: {
    'content:file:beforeInsert': (document) => {
      if (document.extension === '.md') {      
        document.bodyPlainText = document.text;
      }
    },
  },
  generate: {
    fallback: true,
    crawler: true,
    subFolders: true,
    async routes () {
      const { $content } = require('@nuxt/content')
      const files = await $content({ deep: true }).only(['path']).fetch()

      return files.map(file => file.path === '/index' ? '/' : file.path)
    }
  },

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

<template>
  <div class="container">
    <NuxtLink :to="prevPage === 1? '/' : `/?page=${prevPage}`">
      <b-button icon-left="arrow-left">
        <span class="small-caps">
          Back
        </span>
      </b-button>
    </NuxtLink>
    <hr>
    <article class="content">
      <b-tooltip :label="article.createdAt | fullDate" position="is-bottom" type="is-dark">
        <small class="has-text-primary">{{ article.createdAt | formatDate }}</small>
      </b-tooltip>
      <b-tooltip v-if="article.updatedAt != article.createdAt" :label="article.updatedAt | fullDate" position="is-bottom" type="is-dark">
        <small class="has-text-primary is-italic">
          &#8211; Updated {{ article.updatedAt | formatDate }}
        </small>
      </b-tooltip>
      <br>
      <h1>{{ article.title }}</h1>
      <!-- <ul>
        <li
          v-for="link of article.toc"
          :key="link.id"
        >
          <NuxtLink :to="`#${link.id}`">
            {{ link.text }}
          </NuxtLink>
        </li>
      </ul> -->
      <nuxt-content :document="article" />
    </article>
    <hr>
    <nav class="level is-mobile">
      <div class="level-left">
        <div v-if="prev !== null">
          <NuxtLink :to="`/article/${prev.slug}`">
            <b-button class="level-item" icon-left="arrow-left">
              <span class="small-caps">
                {{ prev.title }}
              </span>
            </b-button>
          </NuxtLink>
        </div>
      </div>
      <div class="level-center">
        <b-tooltip label="Top" position="is-bottom" type="is-dark">
          <b-button class="level-item" icon-right="arrow-up" @click="scrollToTop" />
        </b-tooltip>
      </div>
      <div class="level-right">
        <div v-if="next !== null">
          <NuxtLink v-if="next !== null" :to="`/article/${next.slug}`">
            <b-button class="level-item" icon-right="arrow-right">
              <span class="small-caps">
                {{ next.title }}
              </span>
            </b-button>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>

import { newsPerPage, dateFormat, dateOptions } from 'static/config'

export default {
  filters:
  {
    formatDate (dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleDateString(dateFormat, dateOptions)
    },
    fullDate (dateStr) {
      return new Date(dateStr).toLocaleString()
    }
  },
  async asyncData ({ $content, params }) {
    const article = await $content('article', params.slug).fetch()
    const [prev, next] = await $content('article').only(['title']).sortBy('createdAt', 'asc').surround(params.slug).fetch()
    return {
      article,
      prev,
      next
    }
  },
  data () {
    return {
      prevPage: 1
    }
  },
  async mounted () {
    const articles = await this.$content('article').sortBy('createdAt', 'desc').only(['slug']).fetch()
    const slugs = articles.map(a => a.slug)
    const index = slugs.indexOf(this.$route.params.slug)

    if (index !== -1) {
      this.prevPage = Math.floor(index / newsPerPage) + 1
    }
  },
  methods: {
    scrollToTop () {
      window.scrollTo(0, 0)
    }
  }
}
</script>

<style>
  .small-caps {
    font-variant: small-caps;
  }
  .number
  {
    all: unset;
  }
</style>

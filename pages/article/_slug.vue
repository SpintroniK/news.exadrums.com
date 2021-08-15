<template>
  <div class="container">
    <NuxtLink :to="`/?page=${prevPage}`">
      <b-button icon-left="arrow-left">
        <span class="small-caps">
          Back
        </span>
      </b-button>
    </NuxtLink>
    <hr>
    <article class="content">
      <span class="has-text-primary">
        {{ article.createdAt | formatDate }}
      </span>
      <br>
      <h1>{{ article.title }}</h1>
      <nuxt-content :document="article" />
    </article>
    <hr>
    <nav class="level is-mobile">
      <div class="level-left">
        <div v-if="prev !== null">
          <NuxtLink :to="`/article/${prev.slug}`">
            <b-button class="level-item" icon-left="arrow-left">
              <span class="small-caps">
                {{ prev === null ? '' : prev.title }}
              </span>
            </b-button>
          </NuxtLink>
        </div>
      </div>
      <div class="level-right">
        <div v-if="next !== null">
          <NuxtLink v-if="next !== null" :to="`/article/${next.slug}`">
            <b-button class="level-item small-caps" icon-right="arrow-right">
              {{ next === null ? '' : next.title }}
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
    }
  },
  async asyncData ({ $content, params }) {
    const article = await $content('news', params.slug).fetch()
    const [prev, next] = await $content('news').only(['title']).sortBy('date', 'asc').surround(params.slug).fetch()
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
    const articles = await this.$content('news').sortBy('date', 'desc').only(['slug']).fetch()
    const slugs = articles.map(a => a.slug)
    const index = slugs.indexOf(this.$route.params.slug)

    if (index !== -1) {
      this.prevPage = Math.floor(index / newsPerPage) + 1
    }
  }
}
</script>

<style>
  .small-caps {
    font-variant: small-caps;
  }
</style>
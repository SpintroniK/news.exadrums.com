<template>
  <div class="container">
    <NuxtLink :to="`/?page=${prevPage}`">
      <b-button icon-left="arrow-left">
        Back
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

    return {
      article
    }
  },
  data () {
    return {
      prevPage: 1
    }
  },
  async mounted () {
    const articles = await this.$content('news').sortBy('date', 'desc').only('slug').fetch()
    const slugs = articles.map(a => a.slug)
    const index = slugs.indexOf(this.$route.params.slug)

    if (index !== -1) {
      this.prevPage = Math.floor(index / newsPerPage) + 1
    }
  }
}
</script>

<template>
  <div class="container">
    <h1 class="title">
      Latest news
    </h1>
    <div v-for="article in news" :key="article.slug" class="box">
      <article class="media">
        <div class="media-content">
          <p>
            <strong class="title is-4">{{ article.title }}</strong>
            <br>
            <small class="has-text-primary">{{ article.createdAt | formatDate }}</small>
          </p>
          <br>
          <nuxt-content :document="{ body: article.excerpt }" />
          <br>
          <div class="level-right">
            <a class="level-item">
              <NuxtLink :to="`/article/${article.slug}`">
                <b-button icon-right="book-reader">
                  Continue reading
                </b-button>
              </NuxtLink>
            </a>
          </div>
        </div>
      </article>
    </div>
    <div>
      <b-pagination
        v-model="currentPage"
        :total="newsCount"
        :per-page="perPage"
        aria-next-label="Next page"
        aria-previous-label="Previous page"
        aria-page-label="Page"
        aria-current-label="Current page"
        @change="changePage"
      />
    </div>
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
  data () {
    return {
      newsCount: 0,
      perPage: newsPerPage,
      currentPage: 1,
      news: []
    }
  },
  watch:
  {
    $route (to, _) {
      // console.log(from.query.page, to.query.page)
      this.page = parseInt(to.query.page)
    }
  },
  async mounted () {
    const articles = await this.$content('news').only('slug').fetch()
    this.newsCount = articles.length
    this.currentPage = 'page' in this.$route.query ? parseInt(this.$route.query.page) : 1
    await this.fetchNews(this.currentPage)
  },
  methods:
  {
    async fetchNews (page) {
      this.news = await this.$content('news').sortBy('date', 'desc').skip(this.perPage * (page - 1)).limit(this.perPage).fetch()
    },
    async changePage (page) {
      this.$router.push({ name: 'index', query: { page } })
      await this.fetchNews(page)
    }
  }
}
</script>
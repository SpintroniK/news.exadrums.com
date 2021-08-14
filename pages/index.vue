<template>
  <div class="container">
    <h1 class="title">
      Latest news
    </h1>
    <div v-for="article in news" :key="article.title" class="box">
      <article class="media">
        <div class="media-content">
          <p>
            <strong>{{ article.title }}</strong> <small>{{ article.createdAt }}</small>
          </p>
          <br>
          <nuxt-content :document="{ body: article.excerpt }" />
          <br>
          <div class="level-right">
            <a class="level-item">
              <NuxtLink :to="`/news/${article.slug}`">
                <b-button icon-right="book-reader">
                  Continue reading
                </b-button>
              </NuxtLink>
            </a>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
export default {
  async asyncData ({ $content }) {
    const news = await $content('news').fetch()

    return {
      news
    }
  }
}
</script>

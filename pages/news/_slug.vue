<template>
  <div class="container">
    <NuxtLink to="/">
      <b-button icon-left="arrow-left">
        Back to latest news
      </b-button>
    </NuxtLink>
    <hr>
    <article class="content">
      <h1>{{ page.title }}</h1>
      <nuxt-content :document="page" />
    </article>
  </div>
</template>

<script>
export default {
  async asyncData ({ $content, params }) {
    const page = await $content('news', params.slug).fetch()

    return {
      page
    }
  }
}
</script>

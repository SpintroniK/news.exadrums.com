(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{246:function(t,e,r){"use strict";r.d(e,"c",(function(){return n})),r.d(e,"b",(function(){return c})),r.d(e,"a",(function(){return o}));var n=10,c={weekday:"long",year:"numeric",month:"long",day:"numeric"},o="en-UK"},248:function(t,e,r){var content=r(252);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[t.i,content,""]]),content.locals&&(t.exports=content.locals);(0,r(38).default)("1b7833da",content,!0,{sourceMap:!1})},251:function(t,e,r){"use strict";r(248)},252:function(t,e,r){var n=r(37)(!1);n.push([t.i,'.small-caps{font-feature-settings:"smcp";font-variant:small-caps}',""]),t.exports=n},266:function(t,e,r){"use strict";r.r(e);var n=r(6),c=(r(41),r(246)),o={filters:{formatDate:function(t){return new Date(t).toLocaleDateString(c.a,c.b)},fullDate:function(t){return new Date(t).toLocaleString()}},data:function(){return{newsCount:0,perPage:c.c,currentPage:1,news:[]}},watch:{$route:function(t,e){this.page=parseInt(t.query.page)}},mounted:function(){var t=this;return Object(n.a)(regeneratorRuntime.mark((function e(){var r;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,t.$content("article").only("slug").fetch();case 2:return r=e.sent,t.newsCount=r.length,t.currentPage="page"in t.$route.query?parseInt(t.$route.query.page):1,e.next=7,t.fetchNews(t.currentPage);case 7:case"end":return e.stop()}}),e)})))()},methods:{fetchNews:function(t){var e=this;return Object(n.a)(regeneratorRuntime.mark((function r(){return regeneratorRuntime.wrap((function(r){for(;;)switch(r.prev=r.next){case 0:return r.next=2,e.$content("article").sortBy("createdAt","desc").skip(e.perPage*(t-1)).limit(e.perPage).fetch();case 2:e.news=r.sent;case 3:case"end":return r.stop()}}),r)})))()},changePage:function(t){var e=this;return Object(n.a)(regeneratorRuntime.mark((function r(){return regeneratorRuntime.wrap((function(r){for(;;)switch(r.prev=r.next){case 0:return e.$router.push({name:"index",query:{page:t}}),r.next=3,e.fetchNews(t);case 3:case"end":return r.stop()}}),r)})))()}}},l=(r(251),r(52)),component=Object(l.a)(o,(function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{staticClass:"container"},[t._l(t.news,(function(article){return r("div",{key:article.slug,staticClass:"box"},[r("article",{staticClass:"media"},[r("div",{staticClass:"media-content"},[r("p",[r("NuxtLink",{attrs:{to:"/article/"+article.slug}},[r("strong",{staticClass:"title is-4"},[t._v(t._s(article.title))])]),t._v(" "),r("br"),t._v(" "),r("b-tooltip",{attrs:{label:t._f("fullDate")(article.createdAt),position:"is-bottom",type:"is-dark"}},[r("small",{staticClass:"has-text-primary"},[t._v(t._s(t._f("formatDate")(article.createdAt)))])]),t._v(" "),article.updatedAt!=article.createdAt?r("b-tooltip",{attrs:{label:t._f("fullDate")(article.updatedAt),position:"is-bottom",type:"is-dark"}},[r("small",{staticClass:"has-text-primary is-italic"},[t._v("\n              – Updated "+t._s(t._f("formatDate")(article.updatedAt))+"\n            ")])]):t._e()],1),t._v(" "),r("br"),t._v(" "),r("nuxt-content",{attrs:{document:{body:article.excerpt}}}),t._v(" "),r("br"),t._v(" "),r("div",{staticClass:"level-right"},[r("a",{staticClass:"level-item"},[r("NuxtLink",{attrs:{to:"/article/"+article.slug}},[r("b-button",{attrs:{"icon-right":"book-reader"}},[r("span",{staticClass:"small-caps"},[t._v("\n                  Continue reading\n                ")])])],1)],1)])],1)])])})),t._v(" "),r("div",[r("b-pagination",{attrs:{order:"is-centered",total:t.newsCount,"per-page":t.perPage,"aria-next-label":"Next page","aria-previous-label":"Previous page","aria-page-label":"Page","aria-current-label":"Current page"},on:{change:t.changePage},model:{value:t.currentPage,callback:function(e){t.currentPage=e},expression:"currentPage"}})],1)],2)}),[],!1,null,null,null);e.default=component.exports}}]);
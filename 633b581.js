(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{246:function(t,e,n){"use strict";n.d(e,"c",(function(){return r})),n.d(e,"b",(function(){return c})),n.d(e,"a",(function(){return o}));var r=5,c={weekday:"long",year:"numeric",month:"long",day:"numeric"},o="en-UK"},259:function(t,e,n){"use strict";n.r(e);var r=n(6),c=(n(36),n(41),n(246)),o={filters:{formatDate:function(t){return new Date(t).toLocaleDateString(c.a,c.b)}},asyncData:function(t){return Object(r.a)(regeneratorRuntime.mark((function e(){var n,r,article;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return n=t.$content,r=t.params,e.next=3,n("news",r.slug).fetch();case 3:return article=e.sent,e.abrupt("return",{article:article});case 5:case"end":return e.stop()}}),e)})))()},data:function(){return{prevPage:1}},mounted:function(){var t=this;return Object(r.a)(regeneratorRuntime.mark((function e(){var n,r,o;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,t.$content("news").sortBy("date","desc").only("slug").fetch();case 2:n=e.sent,r=n.map((function(a){return a.slug})),-1!==(o=r.indexOf(t.$route.params.slug))&&(t.prevPage=Math.floor(o/c.c)+1);case 6:case"end":return e.stop()}}),e)})))()}},l=n(52),component=Object(l.a)(o,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"container"},[n("NuxtLink",{attrs:{to:"/?page="+t.prevPage}},[n("b-button",{attrs:{"icon-left":"arrow-left"}},[t._v("\n      Back\n    ")])],1),t._v(" "),n("hr"),t._v(" "),n("article",{staticClass:"content"},[n("span",{staticClass:"has-text-primary"},[t._v("\n      "+t._s(t._f("formatDate")(t.article.createdAt))+"\n    ")]),t._v(" "),n("br"),t._v(" "),n("h1",[t._v(t._s(t.article.title))]),t._v(" "),n("nuxt-content",{attrs:{document:t.article}})],1)],1)}),[],!1,null,null,null);e.default=component.exports}}]);
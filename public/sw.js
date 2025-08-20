if (!self.define) {
  let e,
    a = {}
  const s = (s, c) => (
    (s = new URL(s + ".js", c).href),
    a[s] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script")
          ;((e.src = s), (e.onload = a), document.head.appendChild(e))
        } else ((e = s), importScripts(s), a())
      }).then(() => {
        let e = a[s]
        if (!e) throw new Error(`Module ${s} didn’t register its module`)
        return e
      })
  )
  self.define = (c, i) => {
    const n =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href
    if (a[n]) return
    let t = {}
    const r = (e) => s(e, n),
      d = { module: { uri: n }, exports: t, require: r }
    a[n] = Promise.all(c.map((e) => d[e] || r(e))).then((e) => (i(...e), t))
  }
}
define(["./workbox-4754cb34"], function (e) {
  "use strict"
  ;(importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "3481d7adc9e60ec244d215f5495ccc02",
        },
        {
          url: "/_next/static/chunks/1071-b0a8292472b03391.js",
          revision: "b0a8292472b03391",
        },
        {
          url: "/_next/static/chunks/2354-77aee7d39c3d7050.js",
          revision: "77aee7d39c3d7050",
        },
        {
          url: "/_next/static/chunks/2804-b5dbc26673815025.js",
          revision: "b5dbc26673815025",
        },
        {
          url: "/_next/static/chunks/3063-5e5489fc5c1d7c30.js",
          revision: "5e5489fc5c1d7c30",
        },
        {
          url: "/_next/static/chunks/3268-9299005fd1b65e4a.js",
          revision: "9299005fd1b65e4a",
        },
        {
          url: "/_next/static/chunks/3496-5fe5bd3c79c9a102.js",
          revision: "5fe5bd3c79c9a102",
        },
        {
          url: "/_next/static/chunks/367-f1a58b93a26ed3f5.js",
          revision: "f1a58b93a26ed3f5",
        },
        {
          url: "/_next/static/chunks/3777-4f5d8230580609ca.js",
          revision: "4f5d8230580609ca",
        },
        {
          url: "/_next/static/chunks/4277-a8745681354ed646.js",
          revision: "a8745681354ed646",
        },
        {
          url: "/_next/static/chunks/472.a3826d29d6854395.js",
          revision: "a3826d29d6854395",
        },
        {
          url: "/_next/static/chunks/4bd1b696-602635ee57868870.js",
          revision: "602635ee57868870",
        },
        {
          url: "/_next/static/chunks/5071-d01b2ed201001a3a.js",
          revision: "d01b2ed201001a3a",
        },
        {
          url: "/_next/static/chunks/5558-8efe1a4f7378c2bf.js",
          revision: "8efe1a4f7378c2bf",
        },
        {
          url: "/_next/static/chunks/5683-72f89270f56bd7d0.js",
          revision: "72f89270f56bd7d0",
        },
        {
          url: "/_next/static/chunks/5964-2a1ddd40921d073b.js",
          revision: "2a1ddd40921d073b",
        },
        {
          url: "/_next/static/chunks/6874-d27b54d0b28e3259.js",
          revision: "d27b54d0b28e3259",
        },
        {
          url: "/_next/static/chunks/7145-84153645ec293356.js",
          revision: "84153645ec293356",
        },
        {
          url: "/_next/static/chunks/8832-6240960b390f307a.js",
          revision: "6240960b390f307a",
        },
        {
          url: "/_next/static/chunks/8959-5b1fde32f0689a46.js",
          revision: "5b1fde32f0689a46",
        },
        {
          url: "/_next/static/chunks/9341.e21ab9b6d7c03978.js",
          revision: "e21ab9b6d7c03978",
        },
        {
          url: "/_next/static/chunks/9852-e40648475521700e.js",
          revision: "e40648475521700e",
        },
        {
          url: "/_next/static/chunks/987-73d200d2da904cbf.js",
          revision: "73d200d2da904cbf",
        },
        {
          url: "/_next/static/chunks/9998-5c13b89316137101.js",
          revision: "5c13b89316137101",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/communities/page-8d1626348700d112.js",
          revision: "8d1626348700d112",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/content/page-ca74d523d4e77a7e.js",
          revision: "ca74d523d4e77a7e",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/profiles/page-6a7bf6975721f8a3.js",
          revision: "6a7bf6975721f8a3",
        },
        {
          url: "/_next/static/chunks/app/admin/page-b5c69efb6ac95945.js",
          revision: "b5c69efb6ac95945",
        },
        {
          url: "/_next/static/chunks/app/admin/profiles/page-cd07fa2a56b915ff.js",
          revision: "cd07fa2a56b915ff",
        },
        {
          url: "/_next/static/chunks/app/admin/roles/page-f5f51e0b1b182d04.js",
          revision: "f5f51e0b1b182d04",
        },
        {
          url: "/_next/static/chunks/app/api/link-preview/route-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/api/moderate/route-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/api/video-transcode/route-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/page-cc680b9bab64a4ae.js",
          revision: "cc680b9bab64a4ae",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/wiki/page-3345e32a26364754.js",
          revision: "3345e32a26364754",
        },
        {
          url: "/_next/static/chunks/app/c/new/page-1114714bd7a85eb3.js",
          revision: "1114714bd7a85eb3",
        },
        {
          url: "/_next/static/chunks/app/c/page-23aaf87be63da686.js",
          revision: "23aaf87be63da686",
        },
        {
          url: "/_next/static/chunks/app/d/page-b287a44ef86a6980.js",
          revision: "b287a44ef86a6980",
        },
        {
          url: "/_next/static/chunks/app/error-87a793723b57b06a.js",
          revision: "87a793723b57b06a",
        },
        {
          url: "/_next/static/chunks/app/l/page-10d4df19b79cc59e.js",
          revision: "10d4df19b79cc59e",
        },
        {
          url: "/_next/static/chunks/app/layout-29740876f49baa5e.js",
          revision: "29740876f49baa5e",
        },
        {
          url: "/_next/static/chunks/app/m/%5BconversationId%5D/page-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/m/page-ba31a4cf0fa007e5.js",
          revision: "ba31a4cf0fa007e5",
        },
        {
          url: "/_next/static/chunks/app/not-found-a59efce2163f4203.js",
          revision: "a59efce2163f4203",
        },
        {
          url: "/_next/static/chunks/app/onboarding/account/page-7f06e0bac45a6496.js",
          revision: "7f06e0bac45a6496",
        },
        {
          url: "/_next/static/chunks/app/onboarding/intro/page-b18bc1818bd8a3fb.js",
          revision: "b18bc1818bd8a3fb",
        },
        {
          url: "/_next/static/chunks/app/onboarding/profile/page-10d7da108c5b7662.js",
          revision: "10d7da108c5b7662",
        },
        {
          url: "/_next/static/chunks/app/page-3b1502b4dc1a549a.js",
          revision: "3b1502b4dc1a549a",
        },
        {
          url: "/_next/static/chunks/app/pp/page-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/r/page-5c37132b7d8d3ed0.js",
          revision: "5c37132b7d8d3ed0",
        },
        {
          url: "/_next/static/chunks/app/reset-password/page-fc52d04748d54c24.js",
          revision: "fc52d04748d54c24",
        },
        {
          url: "/_next/static/chunks/app/s/page-57692a6af0389c6c.js",
          revision: "57692a6af0389c6c",
        },
        {
          url: "/_next/static/chunks/app/tos/page-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/u/%5Busername%5D/friends/page-d3bdcbac49440504.js",
          revision: "d3bdcbac49440504",
        },
        {
          url: "/_next/static/chunks/app/u/%5Busername%5D/page-28b878625d0700b8.js",
          revision: "28b878625d0700b8",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/ical/route-539e14a5396dee91.js",
          revision: "539e14a5396dee91",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/page-0dea7c757806bb97.js",
          revision: "0dea7c757806bb97",
        },
        {
          url: "/_next/static/chunks/app/w/new/page-2eaffd75e97bc2ca.js",
          revision: "2eaffd75e97bc2ca",
        },
        {
          url: "/_next/static/chunks/app/w/page-c8089134602d99a0.js",
          revision: "c8089134602d99a0",
        },
        {
          url: "/_next/static/chunks/framework-2c9863a08d67ec10.js",
          revision: "2c9863a08d67ec10",
        },
        {
          url: "/_next/static/chunks/main-98c1b9ec0ff76d18.js",
          revision: "98c1b9ec0ff76d18",
        },
        {
          url: "/_next/static/chunks/main-app-9a522dac253602d8.js",
          revision: "9a522dac253602d8",
        },
        {
          url: "/_next/static/chunks/pages/_app-6ffeaeea9cdb76a2.js",
          revision: "6ffeaeea9cdb76a2",
        },
        {
          url: "/_next/static/chunks/pages/_error-5404fd3f53862bc1.js",
          revision: "5404fd3f53862bc1",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-e1deb06c1f2e7cbe.js",
          revision: "e1deb06c1f2e7cbe",
        },
        {
          url: "/_next/static/css/b4552c5bda3c1e92.css",
          revision: "b4552c5bda3c1e92",
        },
        {
          url: "/_next/static/media/569ce4b8f30dc480-s.p.woff2",
          revision: "ef6cefb32024deac234e82f932a95cbd",
        },
        {
          url: "/_next/static/media/747892c23ea88013-s.woff2",
          revision: "a0761690ccf4441ace5cec893b82d4ab",
        },
        {
          url: "/_next/static/media/8d697b304b401681-s.woff2",
          revision: "cc728f6c0adb04da0dfcb0fc436a8ae5",
        },
        {
          url: "/_next/static/media/93f479601ee12b01-s.p.woff2",
          revision: "da83d5f06d825c5ae65b7cca706cb312",
        },
        {
          url: "/_next/static/media/9610d9e46709d722-s.woff2",
          revision: "7b7c0ef93df188a852344fc272fc096b",
        },
        {
          url: "/_next/static/media/ba015fad6dcf6784-s.woff2",
          revision: "8ea4f719af3312a055caf09f34c89a77",
        },
        {
          url: "/_next/static/mi-rs53C1UrjpXozQu3CS/_buildManifest.js",
          revision: "aaa748354b70274fa68371ab99f3506f",
        },
        {
          url: "/_next/static/mi-rs53C1UrjpXozQu3CS/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/icons/tecza-badge/1-anniversary.svg",
          revision: "4642394da1006336bb0197f0d79a69a5",
        },
        {
          url: "/icons/tecza-badge/10-anniversary.svg",
          revision: "5cc2d031462670b54b5acb7a7faada85",
        },
        {
          url: "/icons/tecza-badge/3-anniversary.svg",
          revision: "e062b2728a8f52c4ac27aef5dd2a0854",
        },
        {
          url: "/icons/tecza-badge/5-anniversary.svg",
          revision: "b5f7d2a0a03b3ee76b91a9e0b39d4003",
        },
        {
          url: "/icons/tecza-badge/ambassador.svg",
          revision: "151cda41b89bbdb6acccc5aaf5337483",
        },
        {
          url: "/icons/tecza-badge/banned.svg",
          revision: "06f5449ff4cd1c8a0f85c5d8f7570b98",
        },
        {
          url: "/icons/tecza-badge/company-supporter.svg",
          revision: "e80e5f369bfe4144d44e39f25bd3c130",
        },
        {
          url: "/icons/tecza-badge/company.svg",
          revision: "8a684cc5b5f065d3901f1991aa5483c4",
        },
        {
          url: "/icons/tecza-badge/early-tester.svg",
          revision: "50c077b8f313038329f07da7a3e37296",
        },
        {
          url: "/icons/tecza-badge/hiv-positive-campaigh.svg",
          revision: "ffebdf18dbc4265b2eb1df32827503e6",
        },
        {
          url: "/icons/tecza-badge/mod-admin.svg",
          revision: "2d7f20eeb7919b8c761e81480fa9ed2a",
        },
        {
          url: "/icons/tecza-badge/pride2026.svg",
          revision: "79ff168e6300c71d69dab2355594a0ad",
        },
        {
          url: "/icons/tecza-badge/tecza-team.svg",
          revision: "d0c00af5ecd2ef594503adba9daca7f7",
        },
        {
          url: "/icons/tecza-badge/tester.svg",
          revision: "19821ab5a57c0ad91242a39dcb3c7cab",
        },
        {
          url: "/icons/tecza-badge/user-supporter.svg",
          revision: "49dec42fabd6edbbe00e7a6da512044c",
        },
        {
          url: "/icons/tecza-icons-500x270/1.svg",
          revision: "5db375ad0cb9e57b091108ecdfe7e513",
        },
        {
          url: "/icons/tecza-icons-500x270/2.svg",
          revision: "18fd12ee2f6a135422cc1d42dd2ec759",
        },
        {
          url: "/icons/tecza-icons-500x270/3.svg",
          revision: "45085f9b7811d103d639468de3fdd201",
        },
        {
          url: "/icons/tecza-icons-500x270/4.svg",
          revision: "a852ea8250d32fc6c53bd250de9615e9",
        },
        {
          url: "/icons/tecza-icons/1.svg",
          revision: "52cf50c4e821c88ee68ff768112487e3",
        },
        {
          url: "/icons/tecza-icons/2.svg",
          revision: "b1bf3c7d3d032139d8d63ac2b863a113",
        },
        {
          url: "/icons/tecza-icons/3.svg",
          revision: "d6cc0ffcceaaa7173491faf43448300c",
        },
        {
          url: "/icons/tecza-icons/4.svg",
          revision: "034a27d9e7e2877ede1fe70cf762c788",
        },
        {
          url: "/image/tecza-homepage.webp",
          revision: "4891e9325cf0e66894f0ac7173b9978a",
        },
        { url: "/manifest.json", revision: "cadf36797028efd940dd78f916918cd0" },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: a,
              event: s,
              state: c,
            }) =>
              a && "opaqueredirect" === a.type
                ? new Response(a.body, {
                    status: 200,
                    statusText: "OK",
                    headers: a.headers,
                  })
                : a,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1
        const a = e.pathname
        return !a.startsWith("/api/auth/") && !!a.startsWith("/api/")
      },
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1
        return !e.pathname.startsWith("/api/")
      },
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ))
})

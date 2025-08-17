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
    const d = (e) => s(e, n),
      r = { module: { uri: n }, exports: t, require: d }
    a[n] = Promise.all(c.map((e) => r[e] || d(e))).then((e) => (i(...e), t))
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
          revision: "b7c70ff02cc42bf071ca86c7bbd3d1cd",
        },
        {
          url: "/_next/static/chunks/1071-b0a8292472b03391.js",
          revision: "b0a8292472b03391",
        },
        {
          url: "/_next/static/chunks/1366-7a0872fadbe32482.js",
          revision: "7a0872fadbe32482",
        },
        {
          url: "/_next/static/chunks/1722-9aa4e48989a0fe25.js",
          revision: "9aa4e48989a0fe25",
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
          url: "/_next/static/chunks/3268-b851e48e181ee7ad.js",
          revision: "b851e48e181ee7ad",
        },
        {
          url: "/_next/static/chunks/3438-ae81a64128d888eb.js",
          revision: "ae81a64128d888eb",
        },
        {
          url: "/_next/static/chunks/3496-2589b94a13c8758c.js",
          revision: "2589b94a13c8758c",
        },
        {
          url: "/_next/static/chunks/367-f1a58b93a26ed3f5.js",
          revision: "f1a58b93a26ed3f5",
        },
        {
          url: "/_next/static/chunks/369-0927f6e8ab0bf313.js",
          revision: "0927f6e8ab0bf313",
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
          url: "/_next/static/chunks/5071-4f4f0b384b3383fa.js",
          revision: "4f4f0b384b3383fa",
        },
        {
          url: "/_next/static/chunks/5885-c010940bcf1adee0.js",
          revision: "c010940bcf1adee0",
        },
        {
          url: "/_next/static/chunks/5964-2a1ddd40921d073b.js",
          revision: "2a1ddd40921d073b",
        },
        {
          url: "/_next/static/chunks/6142-612dfca52997d4bd.js",
          revision: "612dfca52997d4bd",
        },
        {
          url: "/_next/static/chunks/6645-5e63ae05d10f2f95.js",
          revision: "5e63ae05d10f2f95",
        },
        {
          url: "/_next/static/chunks/6874-d27b54d0b28e3259.js",
          revision: "d27b54d0b28e3259",
        },
        {
          url: "/_next/static/chunks/8034-bcac0dc24c15b505.js",
          revision: "bcac0dc24c15b505",
        },
        {
          url: "/_next/static/chunks/9341.e21ab9b6d7c03978.js",
          revision: "e21ab9b6d7c03978",
        },
        {
          url: "/_next/static/chunks/9352-1fd7cfd6e3c91c3a.js",
          revision: "1fd7cfd6e3c91c3a",
        },
        {
          url: "/_next/static/chunks/9402-ca69f1c58b672c8a.js",
          revision: "ca69f1c58b672c8a",
        },
        {
          url: "/_next/static/chunks/951-e0e1d8df0c02b956.js",
          revision: "e0e1d8df0c02b956",
        },
        {
          url: "/_next/static/chunks/9628-f25dae90152e2905.js",
          revision: "f25dae90152e2905",
        },
        {
          url: "/_next/static/chunks/9998-5c13b89316137101.js",
          revision: "5c13b89316137101",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/communities/page-2cc5dc57ddafbd9b.js",
          revision: "2cc5dc57ddafbd9b",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/content/page-6aa026e8238d177e.js",
          revision: "6aa026e8238d177e",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/profiles/page-e6d935c675d82934.js",
          revision: "e6d935c675d82934",
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
          url: "/_next/static/chunks/app/api/link-preview/route-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/api/moderate/route-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/api/video-transcode/route-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/page-73fc1fea75ba039f.js",
          revision: "73fc1fea75ba039f",
        },
        {
          url: "/_next/static/chunks/app/c/new/page-db521958b303ab44.js",
          revision: "db521958b303ab44",
        },
        {
          url: "/_next/static/chunks/app/c/page-09daaa4e66705cef.js",
          revision: "09daaa4e66705cef",
        },
        {
          url: "/_next/static/chunks/app/d/page-d62d6a61c88ae106.js",
          revision: "d62d6a61c88ae106",
        },
        {
          url: "/_next/static/chunks/app/error-abed5d8cccf022d8.js",
          revision: "abed5d8cccf022d8",
        },
        {
          url: "/_next/static/chunks/app/l/page-a4e817ddc130ca61.js",
          revision: "a4e817ddc130ca61",
        },
        {
          url: "/_next/static/chunks/app/layout-b65d500f4760a86d.js",
          revision: "b65d500f4760a86d",
        },
        {
          url: "/_next/static/chunks/app/m/%5BconversationId%5D/page-ee9dab2947f57f29.js",
          revision: "ee9dab2947f57f29",
        },
        {
          url: "/_next/static/chunks/app/m/page-117f902ae3718ced.js",
          revision: "117f902ae3718ced",
        },
        {
          url: "/_next/static/chunks/app/not-found-9a8205bbe233181e.js",
          revision: "9a8205bbe233181e",
        },
        {
          url: "/_next/static/chunks/app/onboarding/account/page-fcd11b239eddbf16.js",
          revision: "fcd11b239eddbf16",
        },
        {
          url: "/_next/static/chunks/app/onboarding/intro/page-b946950592be59d4.js",
          revision: "b946950592be59d4",
        },
        {
          url: "/_next/static/chunks/app/onboarding/profile/page-5f69f3468f1f9f2c.js",
          revision: "5f69f3468f1f9f2c",
        },
        {
          url: "/_next/static/chunks/app/page-3b1502b4dc1a549a.js",
          revision: "3b1502b4dc1a549a",
        },
        {
          url: "/_next/static/chunks/app/pp/page-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/r/page-e20bf97539398c70.js",
          revision: "e20bf97539398c70",
        },
        {
          url: "/_next/static/chunks/app/reset-password/page-fc52d04748d54c24.js",
          revision: "fc52d04748d54c24",
        },
        {
          url: "/_next/static/chunks/app/s/page-81f997d284f08972.js",
          revision: "81f997d284f08972",
        },
        {
          url: "/_next/static/chunks/app/tos/page-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/u/%5Busername%5D/page-314d13378a97e6d6.js",
          revision: "314d13378a97e6d6",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/ical/route-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/page-3c927645cd86019d.js",
          revision: "3c927645cd86019d",
        },
        {
          url: "/_next/static/chunks/app/w/new/page-fe1849b275a3b3f0.js",
          revision: "fe1849b275a3b3f0",
        },
        {
          url: "/_next/static/chunks/app/w/page-5357b6bff32403e8.js",
          revision: "5357b6bff32403e8",
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
          url: "/_next/static/css/f35b38dcc5d10f88.css",
          revision: "f35b38dcc5d10f88",
        },
        {
          url: "/_next/static/jWRSwsMSnvLtW_pFL8J6E/_buildManifest.js",
          revision: "aaa748354b70274fa68371ab99f3506f",
        },
        {
          url: "/_next/static/jWRSwsMSnvLtW_pFL8J6E/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
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
        { url: "/file.svg", revision: "d09f95206c3fa0bb9bd9fefabfd0ea71" },
        { url: "/globe.svg", revision: "2aaafa6a49b6563925fe440891e32717" },
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
        { url: "/next.svg", revision: "8e061864f388b47f33a1c3780831193e" },
        { url: "/vercel.svg", revision: "c0af2f507b369b085b35ef4bbe3bcf1e" },
        { url: "/window.svg", revision: "a2760511c65806022ad20adf74370ff3" },
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

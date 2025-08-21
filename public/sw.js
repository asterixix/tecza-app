if (!self.define) {
  let e,
    s = {}
  const a = (a, c) => (
    (a = new URL(a + ".js", c).href),
    s[a] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script")
          ;((e.src = a), (e.onload = s), document.head.appendChild(e))
        } else ((e = a), importScripts(a), s())
      }).then(() => {
        let e = s[a]
        if (!e) throw new Error(`Module ${a} didn’t register its module`)
        return e
      })
  )
  self.define = (c, i) => {
    const n =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href
    if (s[n]) return
    let t = {}
    const d = (e) => a(e, n),
      r = { module: { uri: n }, exports: t, require: d }
    s[n] = Promise.all(c.map((e) => r[e] || d(e))).then((e) => (i(...e), t))
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
          revision: "a9c5570db9d2b39bdb2daa46ba361d15",
        },
        {
          url: "/_next/static/N9_yGNCDchYunLcZzqN1l/_buildManifest.js",
          revision: "dd17953e3d4ff87c80dc3d55ab638a2a",
        },
        {
          url: "/_next/static/N9_yGNCDchYunLcZzqN1l/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1071-622f0a767fea8667.js",
          revision: "622f0a767fea8667",
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
          url: "/_next/static/chunks/2947-d8355c3e9b9cad96.js",
          revision: "d8355c3e9b9cad96",
        },
        {
          url: "/_next/static/chunks/3063-0010c37065300af4.js",
          revision: "0010c37065300af4",
        },
        {
          url: "/_next/static/chunks/367-f1a58b93a26ed3f5.js",
          revision: "f1a58b93a26ed3f5",
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
          url: "/_next/static/chunks/4910-e957e0b12941905f.js",
          revision: "e957e0b12941905f",
        },
        {
          url: "/_next/static/chunks/492-be62217231c0b5ec.js",
          revision: "be62217231c0b5ec",
        },
        {
          url: "/_next/static/chunks/4bd1b696-602635ee57868870.js",
          revision: "602635ee57868870",
        },
        {
          url: "/_next/static/chunks/5071-559b5e775a55a4d2.js",
          revision: "559b5e775a55a4d2",
        },
        {
          url: "/_next/static/chunks/5558-0657c74c896710f8.js",
          revision: "0657c74c896710f8",
        },
        {
          url: "/_next/static/chunks/5784-cbd61169315b6282.js",
          revision: "cbd61169315b6282",
        },
        {
          url: "/_next/static/chunks/5964-2a1ddd40921d073b.js",
          revision: "2a1ddd40921d073b",
        },
        {
          url: "/_next/static/chunks/5988-314c900b6efbd94a.js",
          revision: "314c900b6efbd94a",
        },
        {
          url: "/_next/static/chunks/6234-02077131ac478c91.js",
          revision: "02077131ac478c91",
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
          url: "/_next/static/chunks/8471-53b3e775cba115d0.js",
          revision: "53b3e775cba115d0",
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
          url: "/_next/static/chunks/9852-e38cb29838884327.js",
          revision: "e38cb29838884327",
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
          url: "/_next/static/chunks/app/_not-found/page-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/communities/page-327ffd17dde96ff3.js",
          revision: "327ffd17dde96ff3",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/content/page-1763b96ecd1b61e7.js",
          revision: "1763b96ecd1b61e7",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/profiles/page-716825c7cb753765.js",
          revision: "716825c7cb753765",
        },
        {
          url: "/_next/static/chunks/app/admin/notifications/page-5d6f799be71ab3d4.js",
          revision: "5d6f799be71ab3d4",
        },
        {
          url: "/_next/static/chunks/app/admin/page-7d39561736e04b6b.js",
          revision: "7d39561736e04b6b",
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
          url: "/_next/static/chunks/app/c/%5Bid%5D/page-220182a6e5c7f908.js",
          revision: "220182a6e5c7f908",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/wiki/page-478f0da2d7f1c550.js",
          revision: "478f0da2d7f1c550",
        },
        {
          url: "/_next/static/chunks/app/c/page-a970aa8d05cb9121.js",
          revision: "a970aa8d05cb9121",
        },
        {
          url: "/_next/static/chunks/app/d/page-3d8e0a2b0e343284.js",
          revision: "3d8e0a2b0e343284",
        },
        {
          url: "/_next/static/chunks/app/error-87a793723b57b06a.js",
          revision: "87a793723b57b06a",
        },
        {
          url: "/_next/static/chunks/app/l/page-f9c25a037cf2511f.js",
          revision: "f9c25a037cf2511f",
        },
        {
          url: "/_next/static/chunks/app/layout-32de3703d8c6b2f3.js",
          revision: "32de3703d8c6b2f3",
        },
        {
          url: "/_next/static/chunks/app/not-found-a59efce2163f4203.js",
          revision: "a59efce2163f4203",
        },
        {
          url: "/_next/static/chunks/app/onboarding/account/page-e169c91b99fba5d7.js",
          revision: "e169c91b99fba5d7",
        },
        {
          url: "/_next/static/chunks/app/onboarding/intro/page-8cf70d7fffdfd500.js",
          revision: "8cf70d7fffdfd500",
        },
        {
          url: "/_next/static/chunks/app/onboarding/profile/page-65af3056d7fa8ace.js",
          revision: "65af3056d7fa8ace",
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
          url: "/_next/static/chunks/app/r/page-5c2e7616179d818c.js",
          revision: "5c2e7616179d818c",
        },
        {
          url: "/_next/static/chunks/app/reset-password/page-fc52d04748d54c24.js",
          revision: "fc52d04748d54c24",
        },
        {
          url: "/_next/static/chunks/app/s/page-cec96b74db280cb4.js",
          revision: "cec96b74db280cb4",
        },
        {
          url: "/_next/static/chunks/app/tos/page-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/u/%5Busername%5D/friends/page-b5c013ac4ae74eca.js",
          revision: "b5c013ac4ae74eca",
        },
        {
          url: "/_next/static/chunks/app/u/%5Busername%5D/page-568431237d4470e6.js",
          revision: "568431237d4470e6",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/ical/route-04d401e9ad2d7ffb.js",
          revision: "04d401e9ad2d7ffb",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/page-824d981545c44487.js",
          revision: "824d981545c44487",
        },
        {
          url: "/_next/static/chunks/app/w/page-354727e61256940f.js",
          revision: "354727e61256940f",
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
          url: "/_next/static/css/388e667971e75a38.css",
          revision: "388e667971e75a38",
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
              response: s,
              event: a,
              state: c,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
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
        const s = e.pathname
        return !s.startsWith("/api/auth/") && !!s.startsWith("/api/")
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

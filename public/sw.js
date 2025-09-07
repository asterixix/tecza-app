if (!self.define) {
  let e,
    a = {}
  const i = (i, c) => (
    (i = new URL(i + ".js", c).href),
    a[i] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script")
          ;((e.src = i), (e.onload = a), document.head.appendChild(e))
        } else ((e = i), importScripts(i), a())
      }).then(() => {
        let e = a[i]
        if (!e) throw new Error(`Module ${i} didn’t register its module`)
        return e
      })
  )
  self.define = (c, s) => {
    const t =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href
    if (a[t]) return
    let n = {}
    const r = (e) => i(e, t),
      d = { module: { uri: t }, exports: n, require: r }
    a[t] = Promise.all(c.map((e) => d[e] || r(e))).then((e) => (s(...e), n))
  }
}
define(["./workbox-d50ca814"], function (e) {
  "use strict"
  ;(importScripts("/sw-custom.js"),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "b7dab8d2a7cf65ad925a3de528851b22",
        },
        {
          url: "/_next/static/cMK1vTQpD2zRXbcmMgbW4/_buildManifest.js",
          revision: "cac3ef43c3ddd5a44fa66c9a4576094e",
        },
        {
          url: "/_next/static/cMK1vTQpD2zRXbcmMgbW4/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1071-1e57829653b35b28.js",
          revision: "1e57829653b35b28",
        },
        {
          url: "/_next/static/chunks/1367-49e9f7f2f3904fba.js",
          revision: "49e9f7f2f3904fba",
        },
        {
          url: "/_next/static/chunks/2354-9aa8e57ed4736558.js",
          revision: "9aa8e57ed4736558",
        },
        {
          url: "/_next/static/chunks/2804-b83b95a216edab8d.js",
          revision: "b83b95a216edab8d",
        },
        {
          url: "/_next/static/chunks/2947-f9b6f7efbfa26ce7.js",
          revision: "f9b6f7efbfa26ce7",
        },
        {
          url: "/_next/static/chunks/3063-1ee9e2c4135c2cb9.js",
          revision: "1ee9e2c4135c2cb9",
        },
        {
          url: "/_next/static/chunks/3374.8d107387c33b919c.js",
          revision: "8d107387c33b919c",
        },
        {
          url: "/_next/static/chunks/3420-c0071e21542e1359.js",
          revision: "c0071e21542e1359",
        },
        {
          url: "/_next/static/chunks/3438-af3cf0471e5ced10.js",
          revision: "af3cf0471e5ced10",
        },
        {
          url: "/_next/static/chunks/367-3294776aed311a53.js",
          revision: "3294776aed311a53",
        },
        {
          url: "/_next/static/chunks/4277-9f638e4633d45612.js",
          revision: "9f638e4633d45612",
        },
        {
          url: "/_next/static/chunks/4367-d0f1e55ce4894c66.js",
          revision: "d0f1e55ce4894c66",
        },
        {
          url: "/_next/static/chunks/4bd1b696-cc729d47eba2cee4.js",
          revision: "cc729d47eba2cee4",
        },
        {
          url: "/_next/static/chunks/5102-e5fd5da950c19192.js",
          revision: "e5fd5da950c19192",
        },
        {
          url: "/_next/static/chunks/5152-820a39aa479d223e.js",
          revision: "820a39aa479d223e",
        },
        {
          url: "/_next/static/chunks/5337-f62cc4539e8c7307.js",
          revision: "f62cc4539e8c7307",
        },
        {
          url: "/_next/static/chunks/5558-1a8a2a752074f39c.js",
          revision: "1a8a2a752074f39c",
        },
        {
          url: "/_next/static/chunks/5736-d383bbc9202dbcb5.js",
          revision: "d383bbc9202dbcb5",
        },
        {
          url: "/_next/static/chunks/5964-6d6a41800488ba64.js",
          revision: "6d6a41800488ba64",
        },
        {
          url: "/_next/static/chunks/6073-d315905ba1c62601.js",
          revision: "d315905ba1c62601",
        },
        {
          url: "/_next/static/chunks/6874-414075bb21e16c80.js",
          revision: "414075bb21e16c80",
        },
        {
          url: "/_next/static/chunks/76567b6f-f10e15270bb8b0cf.js",
          revision: "f10e15270bb8b0cf",
        },
        {
          url: "/_next/static/chunks/8034-6e6026f0f726f137.js",
          revision: "6e6026f0f726f137",
        },
        {
          url: "/_next/static/chunks/8098-670d7f1f953c130d.js",
          revision: "670d7f1f953c130d",
        },
        {
          url: "/_next/static/chunks/8472-ea81cfd0a9e089e3.js",
          revision: "ea81cfd0a9e089e3",
        },
        {
          url: "/_next/static/chunks/8595-f939ef31aab4110c.js",
          revision: "f939ef31aab4110c",
        },
        {
          url: "/_next/static/chunks/8698-a32f3b96c46db424.js",
          revision: "a32f3b96c46db424",
        },
        {
          url: "/_next/static/chunks/9034-8c12b44653fdd075.js",
          revision: "8c12b44653fdd075",
        },
        {
          url: "/_next/static/chunks/9464-c699d6a28a099560.js",
          revision: "c699d6a28a099560",
        },
        {
          url: "/_next/static/chunks/9633-21c45d5925b7880d.js",
          revision: "21c45d5925b7880d",
        },
        {
          url: "/_next/static/chunks/9852-e3de83b5ea20ad6f.js",
          revision: "e3de83b5ea20ad6f",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/communities/page-bf2e7267ead17616.js",
          revision: "bf2e7267ead17616",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/content/page-4341e5b7d2a7d009.js",
          revision: "4341e5b7d2a7d009",
        },
        {
          url: "/_next/static/chunks/app/admin/moderation/profiles/page-9316ba097b022636.js",
          revision: "9316ba097b022636",
        },
        {
          url: "/_next/static/chunks/app/admin/notifications/page-dc255abba2e89d08.js",
          revision: "dc255abba2e89d08",
        },
        {
          url: "/_next/static/chunks/app/admin/page-7c98d4a976ec5bb0.js",
          revision: "7c98d4a976ec5bb0",
        },
        {
          url: "/_next/static/chunks/app/admin/profiles/page-cf7490fe85105d9d.js",
          revision: "cf7490fe85105d9d",
        },
        {
          url: "/_next/static/chunks/app/admin/roles/page-4919abc110d025b3.js",
          revision: "4919abc110d025b3",
        },
        {
          url: "/_next/static/chunks/app/api/community-question/route-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/api/link-preview/route-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/api/moderate/route-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/api/push/route-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/api/video-transcode/route-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/kanban/page-8a03b9f371a8f828.js",
          revision: "8a03b9f371a8f828",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/marketplace/page-d33b055263afb847.js",
          revision: "d33b055263afb847",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/page-81f7b08fc26b4d64.js",
          revision: "81f7b08fc26b4d64",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/wiki/%5Bslug%5D/page-cf5422c2fe643504.js",
          revision: "cf5422c2fe643504",
        },
        {
          url: "/_next/static/chunks/app/c/%5Bid%5D/wiki/page-f726c05299dc57ac.js",
          revision: "f726c05299dc57ac",
        },
        {
          url: "/_next/static/chunks/app/c/page-30c3fa4f498303dd.js",
          revision: "30c3fa4f498303dd",
        },
        {
          url: "/_next/static/chunks/app/d/page-0657c386a2696396.js",
          revision: "0657c386a2696396",
        },
        {
          url: "/_next/static/chunks/app/error-399ce8d1919b46af.js",
          revision: "399ce8d1919b46af",
        },
        {
          url: "/_next/static/chunks/app/l/page-e2c93b4345d0e18a.js",
          revision: "e2c93b4345d0e18a",
        },
        {
          url: "/_next/static/chunks/app/layout-87e7918af6fb4347.js",
          revision: "87e7918af6fb4347",
        },
        {
          url: "/_next/static/chunks/app/not-found-4623869f208cfce4.js",
          revision: "4623869f208cfce4",
        },
        {
          url: "/_next/static/chunks/app/offline/page-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/onboarding/account/page-614ff615b1edad2c.js",
          revision: "614ff615b1edad2c",
        },
        {
          url: "/_next/static/chunks/app/onboarding/intro/page-8b80c734b7c8efee.js",
          revision: "8b80c734b7c8efee",
        },
        {
          url: "/_next/static/chunks/app/onboarding/profile/page-9ff808b0cc04ad19.js",
          revision: "9ff808b0cc04ad19",
        },
        {
          url: "/_next/static/chunks/app/p/%5Bid%5D/page-3871e974b400b4b8.js",
          revision: "3871e974b400b4b8",
        },
        {
          url: "/_next/static/chunks/app/page-63d03f6c89558d23.js",
          revision: "63d03f6c89558d23",
        },
        {
          url: "/_next/static/chunks/app/pp/page-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/r/page-0618e81f42a69628.js",
          revision: "0618e81f42a69628",
        },
        {
          url: "/_next/static/chunks/app/reset-password/page-acad7e5731a63583.js",
          revision: "acad7e5731a63583",
        },
        {
          url: "/_next/static/chunks/app/s/page-7cc763fdb2ee9c56.js",
          revision: "7cc763fdb2ee9c56",
        },
        {
          url: "/_next/static/chunks/app/tos/page-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/u/%5Busername%5D/friends/page-2a434567a95919f1.js",
          revision: "2a434567a95919f1",
        },
        {
          url: "/_next/static/chunks/app/u/%5Busername%5D/page-e9742f206d1400ce.js",
          revision: "e9742f206d1400ce",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/ical/route-91c91b527b31a6ed.js",
          revision: "91c91b527b31a6ed",
        },
        {
          url: "/_next/static/chunks/app/w/%5Bid%5D/page-d3db9da629e9a35e.js",
          revision: "d3db9da629e9a35e",
        },
        {
          url: "/_next/static/chunks/app/w/page-430b79886344c744.js",
          revision: "430b79886344c744",
        },
        {
          url: "/_next/static/chunks/c0e397d0.b040b1712aa6047c.js",
          revision: "b040b1712aa6047c",
        },
        {
          url: "/_next/static/chunks/d3ac728e-126267ab7d9db9db.js",
          revision: "126267ab7d9db9db",
        },
        {
          url: "/_next/static/chunks/framework-6a579fe8df05a747.js",
          revision: "6a579fe8df05a747",
        },
        {
          url: "/_next/static/chunks/main-app-bd09224e0ecd9b76.js",
          revision: "bd09224e0ecd9b76",
        },
        {
          url: "/_next/static/chunks/main-bc4af07c705aed8b.js",
          revision: "bc4af07c705aed8b",
        },
        {
          url: "/_next/static/chunks/pages/_app-1af4163d4f10b6fc.js",
          revision: "1af4163d4f10b6fc",
        },
        {
          url: "/_next/static/chunks/pages/_error-43885327f020d18a.js",
          revision: "43885327f020d18a",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-943406e6690a05ed.js",
          revision: "943406e6690a05ed",
        },
        {
          url: "/_next/static/css/09dfadb69bdaa005.css",
          revision: "09dfadb69bdaa005",
        },
        {
          url: "/_next/static/css/ddda5de8737f4055.css",
          revision: "ddda5de8737f4055",
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
          url: "/_next/static/media/KaTeX_AMS-Regular.1608a09b.woff",
          revision: "1608a09b",
        },
        {
          url: "/_next/static/media/KaTeX_AMS-Regular.4aafdb68.ttf",
          revision: "4aafdb68",
        },
        {
          url: "/_next/static/media/KaTeX_AMS-Regular.a79f1c31.woff2",
          revision: "a79f1c31",
        },
        {
          url: "/_next/static/media/KaTeX_Caligraphic-Bold.b6770918.woff",
          revision: "b6770918",
        },
        {
          url: "/_next/static/media/KaTeX_Caligraphic-Bold.cce5b8ec.ttf",
          revision: "cce5b8ec",
        },
        {
          url: "/_next/static/media/KaTeX_Caligraphic-Bold.ec17d132.woff2",
          revision: "ec17d132",
        },
        {
          url: "/_next/static/media/KaTeX_Caligraphic-Regular.07ef19e7.ttf",
          revision: "07ef19e7",
        },
        {
          url: "/_next/static/media/KaTeX_Caligraphic-Regular.55fac258.woff2",
          revision: "55fac258",
        },
        {
          url: "/_next/static/media/KaTeX_Caligraphic-Regular.dad44a7f.woff",
          revision: "dad44a7f",
        },
        {
          url: "/_next/static/media/KaTeX_Fraktur-Bold.9f256b85.woff",
          revision: "9f256b85",
        },
        {
          url: "/_next/static/media/KaTeX_Fraktur-Bold.b18f59e1.ttf",
          revision: "b18f59e1",
        },
        {
          url: "/_next/static/media/KaTeX_Fraktur-Bold.d42a5579.woff2",
          revision: "d42a5579",
        },
        {
          url: "/_next/static/media/KaTeX_Fraktur-Regular.7c187121.woff",
          revision: "7c187121",
        },
        {
          url: "/_next/static/media/KaTeX_Fraktur-Regular.d3c882a6.woff2",
          revision: "d3c882a6",
        },
        {
          url: "/_next/static/media/KaTeX_Fraktur-Regular.ed38e79f.ttf",
          revision: "ed38e79f",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Bold.b74a1a8b.ttf",
          revision: "b74a1a8b",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Bold.c3fb5ac2.woff2",
          revision: "c3fb5ac2",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Bold.d181c465.woff",
          revision: "d181c465",
        },
        {
          url: "/_next/static/media/KaTeX_Main-BoldItalic.6f2bb1df.woff2",
          revision: "6f2bb1df",
        },
        {
          url: "/_next/static/media/KaTeX_Main-BoldItalic.70d8b0a5.ttf",
          revision: "70d8b0a5",
        },
        {
          url: "/_next/static/media/KaTeX_Main-BoldItalic.e3f82f9d.woff",
          revision: "e3f82f9d",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Italic.47373d1e.ttf",
          revision: "47373d1e",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Italic.8916142b.woff2",
          revision: "8916142b",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Italic.9024d815.woff",
          revision: "9024d815",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Regular.0462f03b.woff2",
          revision: "0462f03b",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Regular.7f51fe03.woff",
          revision: "7f51fe03",
        },
        {
          url: "/_next/static/media/KaTeX_Main-Regular.b7f8fe9b.ttf",
          revision: "b7f8fe9b",
        },
        {
          url: "/_next/static/media/KaTeX_Math-BoldItalic.572d331f.woff2",
          revision: "572d331f",
        },
        {
          url: "/_next/static/media/KaTeX_Math-BoldItalic.a879cf83.ttf",
          revision: "a879cf83",
        },
        {
          url: "/_next/static/media/KaTeX_Math-BoldItalic.f1035d8d.woff",
          revision: "f1035d8d",
        },
        {
          url: "/_next/static/media/KaTeX_Math-Italic.5295ba48.woff",
          revision: "5295ba48",
        },
        {
          url: "/_next/static/media/KaTeX_Math-Italic.939bc644.ttf",
          revision: "939bc644",
        },
        {
          url: "/_next/static/media/KaTeX_Math-Italic.f28c23ac.woff2",
          revision: "f28c23ac",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Bold.8c5b5494.woff2",
          revision: "8c5b5494",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Bold.94e1e8dc.ttf",
          revision: "94e1e8dc",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Bold.bf59d231.woff",
          revision: "bf59d231",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Italic.3b1e59b3.woff2",
          revision: "3b1e59b3",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Italic.7c9bc82b.woff",
          revision: "7c9bc82b",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Italic.b4c20c84.ttf",
          revision: "b4c20c84",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Regular.74048478.woff",
          revision: "74048478",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Regular.ba21ed5f.woff2",
          revision: "ba21ed5f",
        },
        {
          url: "/_next/static/media/KaTeX_SansSerif-Regular.d4d7ba48.ttf",
          revision: "d4d7ba48",
        },
        {
          url: "/_next/static/media/KaTeX_Script-Regular.03e9641d.woff2",
          revision: "03e9641d",
        },
        {
          url: "/_next/static/media/KaTeX_Script-Regular.07505710.woff",
          revision: "07505710",
        },
        {
          url: "/_next/static/media/KaTeX_Script-Regular.fe9cbbe1.ttf",
          revision: "fe9cbbe1",
        },
        {
          url: "/_next/static/media/KaTeX_Size1-Regular.e1e279cb.woff",
          revision: "e1e279cb",
        },
        {
          url: "/_next/static/media/KaTeX_Size1-Regular.eae34984.woff2",
          revision: "eae34984",
        },
        {
          url: "/_next/static/media/KaTeX_Size1-Regular.fabc004a.ttf",
          revision: "fabc004a",
        },
        {
          url: "/_next/static/media/KaTeX_Size2-Regular.57727022.woff",
          revision: "57727022",
        },
        {
          url: "/_next/static/media/KaTeX_Size2-Regular.5916a24f.woff2",
          revision: "5916a24f",
        },
        {
          url: "/_next/static/media/KaTeX_Size2-Regular.d6b476ec.ttf",
          revision: "d6b476ec",
        },
        {
          url: "/_next/static/media/KaTeX_Size3-Regular.9acaf01c.woff",
          revision: "9acaf01c",
        },
        {
          url: "/_next/static/media/KaTeX_Size3-Regular.a144ef58.ttf",
          revision: "a144ef58",
        },
        {
          url: "/_next/static/media/KaTeX_Size3-Regular.b4230e7e.woff2",
          revision: "b4230e7e",
        },
        {
          url: "/_next/static/media/KaTeX_Size4-Regular.10d95fd3.woff2",
          revision: "10d95fd3",
        },
        {
          url: "/_next/static/media/KaTeX_Size4-Regular.7a996c9d.woff",
          revision: "7a996c9d",
        },
        {
          url: "/_next/static/media/KaTeX_Size4-Regular.fbccdabe.ttf",
          revision: "fbccdabe",
        },
        {
          url: "/_next/static/media/KaTeX_Typewriter-Regular.6258592b.woff",
          revision: "6258592b",
        },
        {
          url: "/_next/static/media/KaTeX_Typewriter-Regular.a8709e36.woff2",
          revision: "a8709e36",
        },
        {
          url: "/_next/static/media/KaTeX_Typewriter-Regular.d97aaf4a.ttf",
          revision: "d97aaf4a",
        },
        {
          url: "/_next/static/media/ba015fad6dcf6784-s.woff2",
          revision: "8ea4f719af3312a055caf09f34c89a77",
        },
        {
          url: "/audio/tecza_powiadomienie.mp3",
          revision: "64990b83218dec15468bb4f11973a060",
        },
        {
          url: "/audio/tecza_start.mp3",
          revision: "f32c9862185a2f992f90e6001d4d7d67",
        },
        {
          url: "/audio/tecza_wiadomosc.mp3",
          revision: "8cf8675e88889a83fea3c2932f38da5f",
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
        { url: "/manifest.json", revision: "916bc761cb22a17771072bdd03041251" },
        { url: "/sw-custom.js", revision: "91044c2df2a5e140ce1a2cf662f913ef" },
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
              event: i,
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
      function (e) {
        return "navigate" === e.request.mode
      },
      new e.NetworkFirst({
        cacheName: "html-cache",
        networkTimeoutSeconds: 3,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 604800 }),
          new e.CacheableResponsePlugin({ statuses: [200] }),
          {
            handlerDidError: function () {
              return _async_to_generator(function () {
                var e
                return _ts_generator(this, function (a) {
                  switch (a.label) {
                    case 0:
                      return (
                        a.trys.push([0, 3, , 4]),
                        [4, caches.open("html-cache")]
                      )
                    case 1:
                      return [4, a.sent().match("/offline")]
                    case 2:
                      return (e = a.sent()) ? [2, e] : [3, 4]
                    case 3:
                      return (a.sent(), [3, 4])
                    case 4:
                      return [2, Response.error()]
                  }
                })
              })()
            },
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      function (e) {
        var a = e.request
        return ["style", "script", "worker"].includes(a.destination)
      },
      new e.StaleWhileRevalidate({
        cacheName: "asset-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      function (e) {
        return "image" === e.request.destination
      },
      new e.CacheFirst({
        cacheName: "image-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 2592e3 }),
          new e.CacheableResponsePlugin({ statuses: [200] }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      function (e) {
        var a = e.url
        return (
          a.hostname.endsWith("supabase.co") && a.pathname.includes("/rest/")
        )
      },
      new e.NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ))
})

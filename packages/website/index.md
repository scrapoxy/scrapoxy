---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: 'Home'

hero:
  name: Scrapoxy
  text: Never be blocked. Again.
  tagline: Aggregate all your proxies in one place and create a consistent webscraping strategy.
  image:
    src: /assets/images/scrapoxy-warrior.png
    alt: Scrapoxy
  actions:
    - theme: brand
      text: Get Started
      link: /intro/scrapoxy
      img: https://img.shields.io/docker/v/fabienvauchelles/scrapoxy?logo=docker&logoColor=000000&label=docker&color=fafafa&style=social
    - theme: alt
      text: Join
      link: https://discord.gg/ktNGGwZnUD
      img: https://img.shields.io/discord/1095676356496461934?logo=discord&logoColor=000000&label=Discord&style=social
    - theme: alt
      text: View on Github|Add a Star
      link: https://github.com/fabienvauchelles/scrapoxy
      img: https://img.shields.io/github/stars/fabienvauchelles/scrapoxy?logo=github&logoColor=000000&label=Star&color=fafafa&style=social
      shiny: confetti
      typewritter: true

features:
  - icon: 🕸️
    title: All-in-One Providers
    details: Support datacenter providers, proxies services, hardware providers and free proxies list.
  - icon: ✋
    title: Anti-Ban
    details: Smart traffic routing with stickies sessions, geo-targeting, and os-targeting.
  - icon: 💰
    title: Cost Optimization
    details: Autoscale proxies to optimize costs, traffic monitoring, and bandwidth limitation.
  - icon: 🌎
    title: Distributed
    details: CQRS architecture on Kubernetes with RabbitMQ and MongoDB.
  - icon: 🛡️
    title: Security
    details: Modern authentication (Google and Github), internal TLS traffic encryption.
  - icon: 🤩
    title: Open Source
    details: MIT Licensed, with the source code available on Github.

providers:
    - tier: ""
      size: 'medium'
      items:
        - name: 'AWS'
          url: 'https://aws.amazon.com'
          img: '/assets/images/aws.svg'
        - name: 'Azure'
          url: 'https://azure.microsoft.com'
          img: '/assets/images/azure.svg'
        - name: 'Bright Data'
          url: 'https://get.brightdata.com/khkl3keb25ld'
          img: '/assets/images/brightdata.svg'
        - name: 'DigitalOcean'
          url: 'https://www.digitalocean.com'
          img: '/assets/images/digitalocean.svg'
        - name: 'GCP'
          url: 'https://cloud.google.com'
          img: '/assets/images/gcp.svg'
        - name: 'HypeProxy'
          url: 'https://hypeproxy.io'
          img: '/assets/images/hypeproxy.svg'
        - name: 'IPRoyal'
          url: 'https://iproyal.com/?r=432273'
          img: '/assets/images/iproyal.svg'
        - name: 'NetNut'
          url: 'https://netnut.io?ref=ymzmmmu'
          img: '/assets/images/netnut.svg'
        - name: 'Live Proxies'
          url: 'https://liveproxies.io'
          img: '/assets/images/liveproxies.svg'
        - name: 'Nimble'
          url: 'https://tracking.nimbleway.com/SH4a'
          img: '/assets/images/nimbleway.svg'
        - name: 'Ninjas Proxy'
          url: 'https://ninjasproxy.com'
          img: '/assets/images/ninjasproxy.svg'
        - name: 'OVH'
          url: 'https://www.ovh.com'
          img: '/assets/images/ovh.svg'
        - name: 'Proxidize'
          url: 'https://proxidize.com'
          img: '/assets/images/proxidize.svg'
        - name: 'Proxy Cheap'
          url: 'https://app.proxy-cheap.com/r/lt6xyT'
          img: '/assets/images/proxy-cheap.svg'
        - name: 'Proxy Seller'
          url: 'https://proxy-seller.com/?partner=GR930FP5IOO78P'
          img: '/assets/images/proxy-seller.svg'
        - name: 'Proxyrack'
          url: 'https://www.proxyrack.com'
          img: '/assets/images/proxyrack.svg'
        - name: 'Rayobyte'
          url: 'https://billing.rayobyte.com/hosting/aff.php?aff=2444&redirectTo=https://rayobyte.com'
          img: '/assets/images/rayobyte.svg'
        - name: 'Smartproxy'
          url: 'https://smartproxy.pxf.io/Qy5mVo'
          img: '/assets/images/smartproxy.svg'
        - name: 'Zyte'
          url: 'https://www.zyte.com'
          img: '/assets/images/zyte.svg'

sponsors:
    - tier: "Platinum"
      size: 'medium'
      items:
          - name: 'Wiremind'
            url: 'https://wiremind.io'
            img: '/assets/images/wiremind.svg'

---
<HomeImage message="Your personal proxies aggregator:" icon="🎯" src="/assets/images/scrapoxy.gif" alt="Scrapoxy" max-width="850px"/>
<HomeGetStarted message="Get started in a few seconds:" icon="🚀" />
<HomeProviders message="Scrapoxy has connectors for:" icon="📎" :data="$frontmatter.providers" />
<HomeProviders message="Sponsored by" icon="❤️" :data="$frontmatter.sponsors" />

<script setup>
  import HomeImage from './components/HomeImage.vue';
  import HomeGetStarted from './components/HomeGetStarted.vue';
  import HomeProviders from './components/HomeProviders.vue';
</script>

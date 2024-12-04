# Changelog

<template v-for="release in data.releases">

<h2 :id="release.versionLink">{{ release.version }}</h2>

<div v-if="release.description" v-html="release.description"></div>

<div class="warning custom-block" v-if="release.breaking">
    <p class="custom-block-title">BREAKING CHANGE</p>
    <div v-html="release.breaking"></div>
</div>

<template v-for="commitGroup in release.commitGroups">

<h3>{{ commitGroup.title }}</h3>

<ul>  
<li v-html="commit" v-for="commit in commitGroup.commits"></li>
</ul>

</template>

</template>

<script setup lang="ts">
import { data } from './changelog.data'
</script>

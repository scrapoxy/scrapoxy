<script setup lang="ts">
import {VPSponsors} from "vitepress/theme";

export interface IProviders {
    tier: string
    size?: 'medium' | 'big'
    items: IProvider[]
}

export interface IProvider {
    name: string
    img: string
    url: string
}
interface IProps {
    icon?: string
    message?: string
    data: IProviders[]
}

defineProps<IProps>();
</script>

<template>
    <section>
        <div class="container">
            <div class="header">
                <div vf-if="icon" class="icon">{{ icon }}</div>
                <h2 v-if="message" class="message">{{ message }}</h2>
            </div>

            <div class="sponsors">
                <VPSponsors :data="data" />
            </div>
        </div>
    </section>
</template>

<style scoped>
section {
    margin-top: 32px;
    padding: 32px 24px 0;

    border-top: 1px solid var(--vp-c-gutter);
}

.container {
    margin: 0 auto;
    max-width: 1152px;
}

.header {
    margin-bottom: 10px;

    text-align: center;
}


.icon {
    font-size: 20px;
}

.message {
    padding-top: 10px;
}

.sponsors {
    padding-top: 10px;
}
</style>

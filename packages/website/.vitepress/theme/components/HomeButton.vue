<script setup lang="ts">
import {computed} from 'vue'
import {normalizeLink} from 'vitepress/dist/client/theme-default/support/utils'
import {EXTERNAL_URL_RE} from 'vitepress/dist/client/shared'


interface Props {
    tag?: string
    size?: 'medium' | 'big'
    theme?: 'brand' | 'alt' | 'sponsor'
    text: string
    href?: string
    img?: string
}


const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    theme: 'brand'
})


const isExternal = computed(
    () => props.href && EXTERNAL_URL_RE.test(props.href)
)


const component = computed(() => {
    return props.tag || props.href ? 'a' : 'button'
})
</script>

<template>
    <component
        :is="component"
        class="HomeButton"
        :class="[size, theme]"
        :href="href ? normalizeLink(href) : undefined"
        :target="isExternal ? '_blank' : undefined"
        :rel="isExternal ? 'noreferrer' : undefined"
    >
        {{ text }}

        <img
            v-if="img"
            :src="img"/>
    </component>
</template>

<style scoped>
.HomeButton {
    display: flex;
    align-items: center;
    border: 1px solid transparent;
    font-weight: 600;
    white-space: nowrap;
    transition: color 0.25s, border-color 0.25s, background-color 0.25s;
}

.HomeButton img {
    margin-left: 5px;
}

.HomeButton:active {
    transition: color 0.1s, border-color 0.1s, background-color 0.1s;
}

.HomeButton.medium {
    border-radius: 20px;
    padding: 0 20px;
    line-height: 38px;
    font-size: 14px;
}

.HomeButton.big {
    border-radius: 24px;
    padding: 0 24px;
    line-height: 46px;
    font-size: 16px;
}

.HomeButton.brand {
    border-color: var(--vp-button-brand-border);
    color: var(--vp-button-brand-text);
    background-color: var(--vp-button-brand-bg);
}

.HomeButton.brand:hover {
    border-color: var(--vp-button-brand-hover-border);
    color: var(--vp-button-brand-hover-text);
    background-color: var(--vp-button-brand-hover-bg);
}

.HomeButton.brand:active {
    border-color: var(--vp-button-brand-active-border);
    color: var(--vp-button-brand-active-text);
    background-color: var(--vp-button-brand-active-bg);
}

.HomeButton.alt {
    border-color: var(--vp-button-alt-border);
    color: var(--vp-button-alt-text);
    background-color: var(--vp-button-alt-bg);
}

.HomeButton.alt:hover {
    border-color: var(--vp-button-alt-hover-border);
    color: var(--vp-button-alt-hover-text);
    background-color: var(--vp-button-alt-hover-bg);
}

.HomeButton.alt:active {
    border-color: var(--vp-button-alt-active-border);
    color: var(--vp-button-alt-active-text);
    background-color: var(--vp-button-alt-active-bg);
}

.HomeButton.sponsor {
    border-color: var(--vp-button-sponsor-border);
    color: var(--vp-button-sponsor-text);
    background-color: var(--vp-button-sponsor-bg);
}

.HomeButton.sponsor:hover {
    border-color: var(--vp-button-sponsor-hover-border);
    color: var(--vp-button-sponsor-hover-text);
    background-color: var(--vp-button-sponsor-hover-bg);
}

.HomeButton.sponsor:active {
    border-color: var(--vp-button-sponsor-active-border);
    color: var(--vp-button-sponsor-active-text);
    background-color: var(--vp-button-sponsor-active-bg);
}
</style>

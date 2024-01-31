<script setup lang="ts">
import party from 'party-js';
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {normalizeLink} from 'vitepress/dist/client/theme-default/support/utils'
import {EXTERNAL_URL_RE} from 'vitepress/dist/client/shared'
import Typewriter from 'typewriter-effect/dist/core';


interface Props {
    tag?: string
    size?: 'medium' | 'big'
    theme?: 'brand' | 'alt' | 'sponsor'
    text: string
    href?: string
    img?: string
    typewritter?: boolean
    shiny?: 'sparkes' | 'confetti'
}


const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    theme: 'brand',
})

const
    homeButton = ref(),
    homeButtonText = ref();


const isExternal = computed(
    () => props.href && EXTERNAL_URL_RE.test(props.href)
)


const component = computed(() => {
    return props.tag || props.href ? 'a' : 'button'
})


function triggerParty() {
    switch (props.shiny) {
        case 'sparkes': {
            party.sparkles(homeButton.value);
            homeButton.value.classList.add('glowing');
            break;
        }

        case 'confetti': {
            party.confetti(homeButton.value);
            homeButton.value.classList.add('glowing');
            break;
        }
    }
}

let partyInterval;
onMounted(() => {
    if (props.typewritter) {
        let tw = new Typewriter(homeButtonText.value, {
            loop: true,
        });

        const texts = props.text.split('|');

        for (let i = 0; i < texts.length - 1; i++) {
            tw = tw.typeString(texts[i])
                .pauseFor(500)
                .deleteAll();
        }

        tw.typeString(texts[texts.length - 1])
            .callFunction(() => {
                if (props.shiny) {
                    triggerParty();
                }
            })
            .pauseFor(5000)
            .start();
    }
    else {
        if (props.shiny) {
            setTimeout(() => {
                triggerParty();

                partyInterval = setInterval(() => {
                    triggerParty();
                }, 5000);
            }, 2000);
        }
    }
});

onUnmounted(() => {
    if (partyInterval) {
        clearInterval(partyInterval);
        partyInterval = void 0;
    }
});
</script>

<template>
    <div class="HomeButtonContainer">
        <component
            :is="component"
            class="HomeButton"
            :class="[size, theme]"
            :href="href ? normalizeLink(href) : undefined"
            :target="isExternal ? '_blank' : undefined"
            :rel="isExternal ? 'noreferrer' : undefined"
            ref="homeButton"
        >
            <span ref="homeButtonText">{{ typewritter ? '' : text }}</span>

            <img
                v-if="img"
                :src="img"/>
        </component>
    </div>
</template>

<style scoped>
.HomeButtonContainer {
    position: relative;
    display: flex;
}

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

.HomeButton:before {
    content: '';
    background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
    position: absolute;
    top: -2px;
    left:-2px;
    background-size: 400%;
    z-index: -1;
    filter: blur(5px);
    width: calc(100% + 4px);
    height: calc(100% + 4px);
    animation: glowing-animation 20s linear infinite;
    opacity: 0;
    transition: opacity 1s ease-in-out;
    border-radius: 20px;
}

.HomeButton:active {
    color: #000
}

.HomeButton:active:after {
    background: transparent;
}

.HomeButton.glowing:before {
    opacity: 1;
}

.HomeButton:after {
    z-index: -1;
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    border-radius: 20px;
}

@keyframes glowing-animation {
    0% { background-position: 0 0; }
    50% { background-position: 400% 0; }
    100% { background-position: 0 0; }
}
</style>

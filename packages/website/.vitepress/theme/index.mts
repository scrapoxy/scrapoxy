import {h, onMounted, watch, nextTick} from 'vue';
import {useRoute} from 'vitepress';
import DefaultTheme from 'vitepress/theme'
import mediumZoom from 'medium-zoom';
import type {Theme} from 'vitepress'
import HomeButton from './components/HomeButton.vue';
import ModalGithub from './components/ModalGithub.vue';
import './custom.scss'


export default {
    extends: DefaultTheme,
    async enhanceApp({app}) {
        app.component('HomeButton', HomeButton);
    },
    setup() {
        const route = useRoute();
        const initZoom = () => {
            mediumZoom('.main img:not([nozoom])', {background: 'var(--vp-c-bg)'});
        };

        onMounted(() => {
            initZoom();
        });

        watch(
            () => route.path,
            () => nextTick(() => initZoom())
        );
    },
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'layout-bottom': () => h(ModalGithub)
        })
    }

} satisfies Theme


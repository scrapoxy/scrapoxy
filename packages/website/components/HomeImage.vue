<script setup lang="ts">
interface IProps {
    icon?: string
    message?: string
    src: string
    alt: string
    maxWidth: string
}

defineProps<IProps>();
</script>

<template>
    <section>
        <div class="container">
            <div class="header">
                <div v-if="icon" class="icon">{{ icon }}</div>
                <h2 v-if="message" class="message">{{ message }}</h2>
            </div>

            <div class="image">
                <img :src="src" :alt="alt">
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
    display: flex;
    flex-flow: column;
    align-items: center;

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

.image {
    margin-top: 10px;

    max-width: v-bind('maxWidth');
}
</style>

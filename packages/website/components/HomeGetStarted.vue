<script setup lang="ts">
interface IProps {
    icon?: string
    message?: string
}
defineProps<IProps>();

const code = [
    "docker run -d -p 8888:8888 -p 8890:8890 -v ./scrapoxy:/cfg",
    "-e AUTH_LOCAL_USERNAME=admin -e AUTH_LOCAL_PASSWORD=password",
    "-e BACKEND_JWT_SECRET=secret1 -e FRONTEND_JWT_SECRET=secret2",
    "-e STORAGE_FILE_FILENAME=/cfg/scrapoxy.json",
    "scrapoxy/scrapoxy"
];

async function copy($event) {
    await navigator.clipboard.writeText(code.join(' '))
        .then(() => {
            $event.target.classList.add('copied');
            setTimeout(() => {
                $event.target.classList.remove('copied');
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
}
</script>

<template>
    <section>
        <div class="container">
            <div class="header">
                <div v-if="icon" class="icon">{{ icon }}</div>
                <h2 v-if="message" class="message">{{ message }}</h2>
            </div>

            <div class="code">
                <button title="Copy Code" class="copy" v-on:click="copy($event)"></button>

                <pre>$ {{code.join(' \\\n  ')}}</pre>
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

.code {
    position: relative;
    max-width: 700px;
    margin: 0 auto;
    padding: 24px;
    overflow: hidden;

    color: var(--vp-c-text-2);
    background-color: var(--vp-c-bg-soft);

    border-radius: 12px;

    font-family: "Courier New";
}

.code:hover button.copy,
.code:focus button.copy {
    opacity: 1;
}

button.copy {
    direction: ltr;
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 3;
    border: 1px solid var(--vp-code-copy-code-border-color);
    border-radius: 4px;
    width: 40px;
    height: 40px;
    background-color: var(--vp-code-copy-code-bg);
    opacity: 0;
    cursor: pointer;
    background-image: var(--vp-icon-copy);
    background-position: 50%;
    background-size: 20px;
    background-repeat: no-repeat;
    transition: border-color 0.25s, background-color 0.25s, opacity 0.25s;
}

button.copy:hover {
    border-color: var(--vp-code-copy-code-hover-border-color);
    background-color: var(--vp-code-copy-code-hover-bg);
}

button.copy.copied,
button.copy:hover.copied {
    border-radius: 0 4px 4px 0;
    background-color: var(--vp-code-copy-code-hover-bg);
    background-image: var(--vp-icon-copied);
}

button.copy.copied::before,
button.copy:hover.copied::before {
    position: relative;
    top: -1px;
    transform: translateX(calc(-100% - 1px));
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--vp-code-copy-code-hover-border-color);
    border-right: 0;
    border-radius: 4px 0 0 4px;
    padding: 0 10px;
    width: fit-content;
    height: 40px;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: var(--vp-code-copy-code-active-text);
    background-color: var(--vp-code-copy-code-hover-bg);
    white-space: nowrap;
    content: var(--vp-code-copy-copied-text-content);
}
</style>

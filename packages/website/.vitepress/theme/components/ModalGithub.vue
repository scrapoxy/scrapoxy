<script setup lang="ts">
import {onMounted, ref} from 'vue';
const showModal = ref(false);

const durationInSecs = 2592000; // 1 month
const popupAppearDelayInSecs = 10000; // 10 seconds

onMounted(() => {
    if (document.cookie.includes('show-modal')) {
        return;
    }

    const showModalDate = localStorage.getItem('show-modal');
    if (showModalDate && parseInt(showModalDate) > Date.now()) {
        return;
    }

    setTimeout(() => {
        showModal.value = true;
    }, popupAppearDelayInSecs);
});

function close() {
    document.cookie = `show-modal=true; max-age=${durationInSecs}; path=/`;
    localStorage.setItem('show-modal', Date.now() + durationInSecs * 1000);

    showModal.value = false;
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-show="showModal" class="modal-mask">
                <div class="modal-container">
                    <p>Hi! Scrapoxy is <b>free</b> and <b>open-source</b>.</p>
                    <p>Your support would mean a lot, just adding a <b>GitHub star 🌟</b> would be awesome!</p>
                    <a class="link"
                       target="_blank"
                       href="/l/github">https://github.com/scrapoxy/scrapoxy</a>
                    <p>Thank you! 🙏</p>
                    <p class="signature">Fabien</p>
                    <div class="model-footer">
                        <button class="modal-button" @click="close()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-mask {
    position: fixed;
    z-index: 200;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
}

.modal-container {
    width: 700px;
    margin: auto;
    padding: 20px 30px;
    background-color: var(--vp-c-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    transition: all 0.3s ease;
}

.model-footer {
    margin-top: 8px;
    text-align: right;
}

.modal-button {
    padding: 4px 8px;
    border-radius: 4px;
    border-color: var(--vp-button-alt-border);
    color: var(--vp-button-alt-text);
    background-color: var(--vp-button-alt-bg);
}

.modal-button:hover {
    border-color: var(--vp-button-alt-hover-border);
    color: var(--vp-button-alt-hover-text);
    background-color: var(--vp-button-alt-hover-bg);
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    transform: scale(1.1);
}

p {
    margin-top: 4px;
    margin-bottom: 4px;
}

a {
    color: var(--vp-c-brand-1);
    font-weight: bold;
}

.signature {
    margin-top: 8px;
    font-style: italic;
}
</style>

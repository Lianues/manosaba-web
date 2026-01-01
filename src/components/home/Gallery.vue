<script setup lang="ts">
import GalleryUI from '../game/GalleryUI.vue'

const emit = defineEmits(['close'])
</script>

<template>
  <GalleryUI :show="true" @close="emit('close')" />
</template>

<style scoped>
/* GalleryUI 已经包含了全屏背景和样式 */
</style>

<script setup lang="ts">
import OptionsUI from '../game/OptionsUI.vue'

const emit = defineEmits(['close'])
</script>

<template>
  <OptionsUI :show="true" @close="emit('close')" />
</template>

<style scoped>
/* OptionsUI 已经包含了全屏背景和样式 */
</style>

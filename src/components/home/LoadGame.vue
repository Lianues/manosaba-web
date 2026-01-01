<script setup lang="ts">
import SaveLoadUI from '../game/SaveLoadUI.vue'

const emit = defineEmits(['close', 'start-game'])

function handleLoadFromHome() {
  // 从首页读档成功后，跳转到游戏
  emit('start-game')
}
</script>

<template>
  <SaveLoadUI 
    :show="true" 
    mode="load"
    :is-from-home="true"
    @close="emit('close')" 
    @load-from-home="handleLoadFromHome"
  />
</template>

<style scoped>
/* SaveLoadUI 已经包含了全屏背景和样式 */
</style>

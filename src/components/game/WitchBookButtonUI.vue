<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const isHovered = ref(false)

function openWitchBook() {
  gameStore.isWitchBookOpen = true
}
</script>

<template>
  <div 
    class="witch-book-button" 
    @click.stop="openWitchBook"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    :class="{ 'is-hovered': isHovered }"
  >
    <div class="wrapper">
      <img src="/UI_Common/BookButton.png" class="icon" />
    </div>
  </div>
</template>

<style scoped>
.witch-book-button {
  position: absolute;
  left: 144px;
  top: 118px;
  width: 288px;
  height: 236px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 50;
  pointer-events: auto;
  /* 恢复最初的过渡定义 */
  transition: transform 0.1s ease-out;
}

.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 241px;
  height: 212px;
  user-select: none;
  -webkit-user-drag: none;
}

/* 恢复最先的“预选放大”代码逻辑 */
.witch-book-button.is-hovered {
  transform: translate(-50%, -50%) scale(1.1);
}

.witch-book-button:active {
  transform: translate(-50%, -50%) scale(0.95);
}
</style>

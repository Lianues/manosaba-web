<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  text: string
  isBad?: boolean
}

defineProps<Props>()
const emit = defineEmits(['click'])

const hovered = ref(false)
</script>

<template>
  <div 
    class="choice-button-container"
    :class="{ 'is-bad': isBad, 'is-hovered': hovered }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click="emit('click')"
  >
    <!-- Background Frame -->
    <img 
      v-if="!hovered"
      src="/UI_Adv/Choice/ChoiceFrame_Default.png" 
      class="frame-img" 
    />
    <img 
      v-else
      src="/UI_Adv/Choice/ChoicesFrame_Highlighted.png" 
      class="frame-img" 
    />

    <!-- Danger Notice for Bad Choices -->
    <img 
      v-if="isBad"
      src="/UI_Adv/Choice/DangerNotice.png" 
      class="danger-notice"
    />

    <!-- Label -->
    <div class="label-container">
      <span class="choice-text">{{ text }}</span>
    </div>
  </div>
</template>

<style scoped>
.choice-button-container {
  position: relative;
  width: 1300px;
  height: 220px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.frame-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: fill; /* 改为 fill 确保完全匹配 1300x220 */
}

.danger-notice {
  position: absolute;
  /* Prefab: AnchoredPosition (-464, 13), Size (148, 180) */
  /* Relative to center (650, 110) */
  left: calc(50% - 464px - 74px);
  top: calc(50% - 13px - 90px);
  width: 148px;
  height: 180px;
  z-index: 5;
  pointer-events: none;
}

.label-container {
  position: absolute;
  /* Prefab: AnchoredPosition (10, 8), Size (900, 100) */
  left: calc(50% + 10px - 450px);
  top: calc(50% - 8px - 50px);
  width: 900px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.choice-text {
  font-family: 'SourceHanSerifSC', serif;
  font-size: 42px;
  color: #29221f;
  text-align: center;
  letter-spacing: 6.5px;
  transition: color 0.1s ease-out;
  /* 修正：在 CSS 中需要稍微调整以抵消末尾字符的间距带来的视觉偏移 */
  margin-left: 6.5px; 
}

.is-hovered .choice-text {
  color: #ffdcd1; /* 修正：更精确的悬停颜色 */
}

/* Adjustments for bad choices if any color changes needed on the text itself */
</style>

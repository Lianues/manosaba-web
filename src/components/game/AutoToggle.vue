<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])
const gameStore = useGameStore()

const hovered = ref(false)

// 同步 modelValue 到 gameStore
watch(() => props.modelValue, (newVal) => {
  gameStore.setAutoMode(newVal)
}, { immediate: true })

const toggle = (e: Event) => {
  e.stopPropagation()
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  gameStore.setAutoMode(newValue)
}
</script>

<template>
  <div 
    class="auto-toggle-container"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click.stop="toggle"
    :class="{ hovered: hovered }"
  >
    <img 
      :src="modelValue ? '/UI_Adv/AutoToggle_On.png' : '/UI_Adv/AutoToggle_Off.png'" 
      class="auto-icon" 
    />
    <span class="auto-label" :class="{ 'is-on': modelValue }">Auto</span>
  </div>
</template>

<style scoped>
.auto-toggle-container {
  position: absolute;
  left: calc(50% - 1150px);
  top: calc(50% + 637.5px);
  width: 253px;
  height: 169px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  transform-origin: center center;
  transition: transform 0.1s ease-out;
  z-index: 150;
}

.auto-toggle-container.hovered {
  transform: translate(-50%, -50%) scale(1.1);
}

.auto-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.auto-label {
  position: absolute;
  top: 50%;
  transform: translateY(-60%);
  left: 126px;
  font-family: 'SourceHanSerifSC', serif;
  font-size: 37px;
  color: #fefefe;
  letter-spacing: 0.3px;
  text-shadow: 1px 2px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  transition: left 0.15s ease-out, color 0.15s ease-out;
}

.auto-label.is-on {
  left: 82px;
  color: #f9dae0;
  letter-spacing: 1px;
}
</style>

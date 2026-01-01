<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  show?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'save', 'load', 'log', 'options', 'title', 'open'])

const hoveredButton = ref<string | null>(null)
const openBtnHovered = ref(false)

const buttons = [
  { id: 'Save', x: -141, y: 367 },
  { id: 'Load', x: 162, y: 367 },
  { id: 'Log', x: -141, y: 130 },
  { id: 'Options', x: 162, y: 130 },
  { id: 'Title', x: -141, y: -107 }
]

const handleClose = (e?: Event) => {
  e?.stopPropagation()
  openBtnHovered.value = false
  emit('close')
}

const handleOpen = (e: Event) => {
  e.stopPropagation()
  openBtnHovered.value = false
  emit('open')
}
</script>

<template>
  <div class="control-panel-system">
    <!-- 1. The Menu Button (Always on top layer) -->
    <div 
      v-if="!show"
      class="menu-open-button"
      @mouseenter="openBtnHovered = true"
      @mouseleave="openBtnHovered = false"
      @click.stop="handleOpen"
      :class="{ hovered: openBtnHovered }"
    >
      <img src="/UI_Adv/MenuButton.png" class="button-icon" />
    </div>

    <!-- 2. The Menu Overlay (No Transition) -->
    <div v-if="show" class="control-panel-overlay" @click.stop>
      <!-- Full screen blocker (inside the scaled layer) -->
      <div class="ray-blocker" @click.stop="handleClose"></div>

      <!-- SmartPhone Container -->
      <div class="smartphone-container">
        <!-- Base / Background -->
        <div class="smartphone-base">
          <img src="/UI_Menu/MenuFrame.png" class="menu-frame" />
          <img src="/UI_Menu/WiFi_Notice.png" class="wifi-notice" />
          <img src="/UI_Menu/Pager_Decolation.png" class="pager-decoration" />
        </div>

        <!-- Content -->
        <div class="menu-content">
          <!-- Buttons Grid -->
          <div class="menu-buttons">
            <div 
              v-for="btn in buttons" 
              :key="btn.id"
              class="menu-button-wrapper"
              :style="{ left: `calc(50% + ${btn.x}px)`, top: `calc(50% - ${btn.y}px)` }"
              @mouseenter="hoveredButton = btn.id"
              @mouseleave="hoveredButton = null"
              @click.stop="emit(btn.id.toLowerCase() as any)"
            >
              <img 
                :src="hoveredButton === btn.id 
                  ? `/UI_Menu/MenuButton_${btn.id}_Highlighted@ZhHans.png` 
                  : `/UI_Menu/MenuButton_${btn.id}_Normal@ZhHans.png`" 
                class="menu-button-img"
              />
            </div>
          </div>

          <!-- Close Button (Positioned Top-Right of phone content) -->
          <div class="close-button" @click.stop="handleClose">
            <img src="/UI_Menu/MenuCloseIcon.png" class="close-icon" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-panel-system {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.menu-open-button {
  position: absolute;
  right: 0;
  top: 0;
  width: 276px;
  height: 238px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transform-origin: center center;
  transition: transform 0.1s ease-out;
  z-index: 10;
}

.menu-open-button.hovered {
  transform: scale(1.1);
}

.menu-open-button .button-icon {
  width: 235px;
  height: 237px;
  transform: translate(-2px, 2px);
}

.control-panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 20;
}

.ray-blocker {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.smartphone-container {
  position: absolute;
  left: 2086px;
  top: 735px;
  width: 882px;
  height: 1398px;
  transform: translate(-50%, -50%) rotate(-6deg);
}

.smartphone-base, .menu-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.menu-frame {
  width: 100%;
  height: 100%;
}

.wifi-notice {
  position: absolute;
  left: calc(50% - 264px - 22.5px);
  top: calc(50% - 519px - 17px);
  width: 45px;
  height: 34px;
}

.pager-decoration {
  position: absolute;
  left: calc(50% + 8px - 27px);
  top: calc(50% + 262px - 6px);
  width: 54px;
  height: 12px;
}

.menu-buttons {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.menu-button-wrapper {
  position: absolute;
  width: 224px;
  height: 224px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: transform 0.1s ease-out;
}

.menu-button-wrapper:hover {
  transform: translate(-50%, -50%) scale(1.05);
}

.menu-button-img {
  position: absolute;
  left: calc(50% + 8px - 146.5px);
  top: calc(50% + 8px - 138px);
  width: 293px;
  height: 276px;
}

/* Corrected Close Button Position based on Prefab Anchor(1,1) */
.close-button {
  position: absolute;
  top: 117px;
  right: 128px;
  width: 67px;
  height: 65px;
  cursor: pointer;
  transition: transform 0.1s ease-out;
}

.close-button:hover {
  transform: scale(1.1);
}

.close-icon {
  width: 100%;
  height: 100%;
}
</style>

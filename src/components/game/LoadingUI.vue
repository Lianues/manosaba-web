<script setup lang="ts">
import { useGameStore } from '../../stores/game'
import { UI_LAYERS } from '@/constants/ui-layers'

const gameStore = useGameStore()
</script>

<template>
  <Transition name="fade">
    <div v-if="gameStore.isLoading" class="loading-ui-container">
      <!-- 1. Underlay (Black 50% Alpha) -->
      <div class="underlay"></div>

      <!-- 2. Wrapper (Reference 2560x1440) -->
      <div class="wrapper">
        <!-- 3. Rolling Icon -->
        <div class="rolling-icon-area">
          <img src="/UI_Common/LoadingIcon.png" class="loading-icon" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: v-bind('UI_LAYERS.LOADING');
  pointer-events: auto;
}

.underlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
}

.wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Rolling Icon (Positioned bottom-right: x: -144, y: 128) */
.rolling-icon-area {
  position: absolute;
  right: 144px;
  bottom: 128px;
  width: 460px;
  height: 467px;
  transform: scale(0.25);
  transform-origin: bottom right;
}

.loading-icon {
  width: 100%;
  height: 100%;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Fade Transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { UI_LAYERS } from '@/constants/ui-layers'

const gameStore = useGameStore()

interface Props {
  show?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['complete', 'close'])

// 监听显示状态，自动切换全局 UI 隐藏并重置进度
watch(() => props.show, (newVal) => {
  gameStore.isUIHidden = !!newVal
  if (newVal) {
    fillAmount.value = 0
    isCompleted.value = false
    isPressing.value = false
    lastTimestamp = 0 // 重置时间戳
    // 重新启动动画循环，防止上次完成后循环停止
    if (timer) cancelAnimationFrame(timer)
    timer = requestAnimationFrame(updateFill)
  }
}, { immediate: true })

const fillAmount = ref(0) // 0 to 1
const isPressing = ref(false)
const isCompleted = ref(false)

let timer: number | null = null
let lastTimestamp = 0

const startPress = () => {
  if (isCompleted.value) return
  isPressing.value = true
}

const stopPress = () => {
  isPressing.value = false
}

const updateFill = (timestamp: number) => {
  if (isCompleted.value) return

  // 计算自上一帧以来经过的时间（秒）
  if (!lastTimestamp) lastTimestamp = timestamp
  const deltaTime = (timestamp - lastTimestamp) / 1000
  lastTimestamp = timestamp

  // 将 Prefab 中的“按帧速度”转换为“按秒速度”（以 60fps 为基准）
  const increaseSpeedPerSec = 0.0025 * 60
  const decreaseSpeedPerSec = 0.004 * 60

  if (isPressing.value) {
    fillAmount.value = Math.min(1, fillAmount.value + increaseSpeedPerSec * deltaTime)
    if (fillAmount.value >= 1) {
      isCompleted.value = true
      isPressing.value = false
      
      // 匹配 Prefab: _delayAfterFullFill 1.6s
      // 让玩家看完整套对钩弹出和停留动画
      setTimeout(() => {
        emit('complete') // 动画结束后才通知 Store 进行场景跳转
        emit('close')    // 同时关闭界面
      }, 1600)
    }
  } else {
    fillAmount.value = Math.max(0, fillAmount.value - decreaseSpeedPerSec * deltaTime)
  }
  timer = requestAnimationFrame(updateFill)
}

onMounted(() => {
  timer = requestAnimationFrame(updateFill)
})

onUnmounted(() => {
  if (timer) cancelAnimationFrame(timer)
})

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="execution-ui-container" @click.stop>
      <!-- 1. Underlay -->
      <div class="underlay" @click.stop="handleClose"></div>

      <!-- 2. Wrapper -->
      <div class="wrapper">
        <!-- 3. Smartphone -->
        <div class="smartphone">
          <img src="/UI_ExecutionButton/SmartphoneBase.png" class="smartphone-img" draggable="false" />
          
          <!-- 4. Button Container -->
          <div 
            class="button-container" 
            :class="{ pressed: isPressing }"
            @mousedown="startPress" 
            @mouseup="stopPress" 
            @mouseleave="stopPress" 
            @touchstart.prevent="startPress" 
            @touchend.prevent="stopPress"
          >
            <!-- Base -->
            <img src="/UI_ExecutionButton/ExecutionButton_Base.png" class="btn-layer btn-base" draggable="false" />
            
            <!-- Fill (Progress) -->
            <div class="btn-fill-wrapper">
              <div class="btn-fill-circle" :style="{ clipPath: `inset(${100 - fillAmount * 100}% 0 0 0)` }"></div>
            </div>

            <!-- Frame -->
            <img src="/UI_ExecutionButton/ExecutionButton_Frame.png" class="btn-layer btn-frame" draggable="false" />

            <!-- Label -->
            <img src="/UI_ExecutionButton/ExecutionButton_Label@Ja.png" class="btn-layer btn-label" draggable="false" />

            <!-- Check Icon (Visible when completed) -->
            <Transition name="pop">
              <img v-if="isCompleted" src="/UI_ExecutionButton/ExecutionButton_CheckIcon.png" class="btn-layer check-icon" draggable="false" />
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.execution-ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: v-bind('UI_LAYERS.EXECUTION_BUTTON');
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.underlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.wrapper {
  position: relative;
  width: 2560px;
  height: 1440px;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

.smartphone {
  position: relative;
  width: 774px;
  height: 1290px;
  transform: rotate(-8deg) scale(0.875);
  pointer-events: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.smartphone-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.button-container {
  position: absolute;
  width: 412px;
  height: 412px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: transform 0.1s ease;
  /* 严格按照 Prefab 参数设置: size 60, alpha 0.75 (0.7529412) */
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.7529);
  border-radius: 50%;
}

.button-container.pressed {
  transform: translate(-50%, -50%) scale(0.9375);
}

.btn-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.btn-base {
  z-index: 1;
}

.btn-fill-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 400px;
  transform: translate(-50%, -50%);
  z-index: 2;
  overflow: hidden;
  border-radius: 50%;
}

.btn-fill-circle {
  width: 100%;
  height: 100%;
  background-color: #8a3343;
  transition: clip-path 0.05s linear;
}

.btn-frame {
  z-index: 3;
}

.btn-label {
  width: 269px;
  height: 146px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
}

.check-icon {
  width: 63px;
  height: 79px;
  top: calc(50% + 120px);
  left: calc(50% + 4px); /* 匹配 Prefab: x=4, y=-120 */
  transform: translate(-50%, -50%);
  z-index: 5;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pop-enter-active {
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes pop-in {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
</style>

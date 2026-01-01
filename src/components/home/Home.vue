<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import LoadGame from './LoadGame.vue'
import Gallery from './Gallery.vue'
import Options from './Options.vue'

const emit = defineEmits(['start-game', 'start-from-save'])

const activePanel = ref<string | null>(null)

// 标题界面 BGM
const TITLE_BGM = '/Audio/BGM/Song/【Title】gDie Divil JIO.mp3'
const titleBgmAudio = ref<HTMLAudioElement | null>(null)

function playTitleBgm() {
  if (titleBgmAudio.value) return
  
  const audio = new Audio(TITLE_BGM)
  audio.loop = true
  audio.volume = 0.5
  audio.play().catch(e => console.warn('标题BGM播放失败:', e))
  titleBgmAudio.value = audio
}

function stopTitleBgm() {
  if (titleBgmAudio.value) {
    titleBgmAudio.value.pause()
    titleBgmAudio.value.currentTime = 0
    titleBgmAudio.value = null
  }
}

// 1. 设计稿基准尺寸
const designWidth = 2560
const designHeight = 1440

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// 2. 计算缩放比例 (保持 UI 比例并居中)
const scale = computed(() => {
  const sX = windowWidth.value / designWidth
  const sY = windowHeight.value / designHeight
  return Math.min(sX, sY)
})

const updateWindowSize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// 主舞台样式
const stageStyle = computed(() => ({
  width: `${designWidth}px`,
  height: `${designHeight}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transformOrigin: 'center center',
  overflow: 'hidden'
}))

const isFading = ref(true)
const isUiVisible = ref(false)

onMounted(() => {
  window.addEventListener('resize', updateWindowSize)
  
  // 播放标题BGM
  playTitleBgm()
  
  // 1. 延迟 0.5秒 后启动背景位移和黑场淡出
  setTimeout(() => {
    isFading.value = false
  }, 500)

  // 2. 位移结束时（0.5s 延迟 + 3s 位移 = 3.5s 后），显现 UI 并彻底清晰化
  setTimeout(() => {
    isUiVisible.value = true
  }, 3500) 
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize)
  stopTitleBgm()
})

// 3. 按钮数据 (坐标基于 2560x1440)
const buttons = [
  {
    id: 'loadGame',
    label: '读取存档',
    normalImg: '/Home/Button_LoadGame_Normal.png',
    hoverImg: '/Home/Button_LoadGame_Highlighted.png',
    labelImg: '/Home/Label_LoadGame@ZhHans.png',
    x: 249, y: 174, w: 290, h: 230,
    imgW: 498, imgH: 339, imgOffX: 0, imgOffY: -4,
    labelX: 42, labelY: -99, labelW: 149, labelH: 35,
    action: () => (activePanel.value = 'load')
  },
  {
    id: 'newGame',
    label: '新游戏',
    normalImg: '/Home/Button_NewGame_Normal.png',
    hoverImg: '/Home/Button_NewGame_Highlighted.png',
    labelImg: '/Home/Label_NewGame@ZhHans.png',
    x: 562, y: 221, w: 260, h: 206,
    imgW: 437, imgH: 326, imgOffX: -10, imgOffY: -8,
    labelX: 28, labelY: -84, labelW: 111, labelH: 34,
    action: () => { stopTitleBgm(); emit('start-game') }
  },
  {
    id: 'gallery',
    label: '画廊',
    normalImg: '/Home/Button_Gallery_Normal.png',
    hoverImg: '/Home/Button_Gallery_Highlighted.png',
    labelImg: '/Home/Label_Gallery@ZhHans.png',
    x: 836, y: 145, w: 246, h: 122,
    imgW: 362, imgH: 267, imgOffX: -8, imgOffY: -8,
    labelX: 17, labelY: -40, labelW: 60, labelH: 30,
    action: () => (activePanel.value = 'gallery')
  },
  {
    id: 'options',
    label: '设置',
    normalImg: '/Home/Button_Options_Normal.png',
    hoverImg: '/Home/Button_Options_Highlighted.png',
    labelImg: '/Home/Label_Options@ZhHans.png',
    x: 1086, y: 187, w: 248, h: 118,
    imgW: 338, imgH: 252, imgOffX: -10, imgOffY: -2,
    labelX: 14, labelY: -52, labelW: 125, labelH: 29,
    action: () => (activePanel.value = 'options')
  },
  {
    id: 'exit',
    label: '退出',
    normalImg: '/Home/Button_Exit_Normal.png',
    hoverImg: '/Home/Button_Exit_Highlighted.png',
    labelImg: '/Home/Label_Exit@ZhHans.png',
    x: 1299, y: 129, w: 164, h: 106,
    imgW: 277, imgH: 222, imgOffX: -11, imgOffY: 7,
    labelX: 11, labelY: -54, labelW: 59, labelH: 28,
    action: () => handleExit()
  }
]

const hoverStates = reactive<Record<string, boolean>>({})
buttons.forEach(btn => hoverStates[btn.id] = false)

const handleExit = () => {
  if (confirm('确定要退出游戏吗？')) window.close()
}
const closePanel = () => activePanel.value = null

// 从存档加载成功后的处理
function handleStartFromSave() {
  // 不需要关闭面板，因为整个页面都会切换到 GameInterface
  stopTitleBgm()
  emit('start-from-save')
}
</script>

<template>
  <div class="home-container">
    <!-- 主舞台：统一 16:9 限制 -->
    <div class="main-stage" :style="stageStyle">
      <!-- 背景层 -->
      <div class="background-fill">
        <img src="/Home/Background/Background_1.png" class="bg-img" :class="{ 'is-blurring': isFading }" />
        <img src="/Home/TitleOverlay.png" class="bg-overlay" :class="{ 'ui-hidden': !isUiVisible }" />
      </div>

      <!-- UI 安全区域 -->
      <div 
        class="ui-safe-area"
        :class="{ 'ui-hidden': !isUiVisible }"
      >
        <!-- Logo -->
        <img 
          src="/Home/TitleLogo@ZhHans.png" 
          alt="Logo" 
          class="title-logo"
        />

        <!-- 按钮组 -->
        <div
          v-for="btn in buttons"
          :key="btn.id"
          class="menu-button"
          :class="{ 'is-disabled': !isUiVisible }"
          :style="{
            left: `${btn.x}px`,
            bottom: `${btn.y}px`,
            width: `${btn.w}px`,
            height: `${btn.h}px`
          }"
          @mouseenter="isUiVisible && (hoverStates[btn.id] = true)"
          @mouseleave="hoverStates[btn.id] = false"
          @click="isUiVisible && btn.action()"
        >
          <img
            :src="hoverStates[btn.id] ? btn.hoverImg : btn.normalImg"
            class="btn-base-img"
            :style="{
              width: `${btn.imgW}px`,
              height: `${btn.imgH}px`,
              marginLeft: `${btn.imgOffX}px`,
              marginTop: `${-btn.imgOffY}px`
            }"
          />
          <img
            v-if="hoverStates[btn.id]"
            :src="btn.labelImg"
            class="btn-label-img"
            :style="{
              width: `${btn.labelW}px`,
              height: `${btn.labelH}px`,
              marginLeft: `${btn.imgOffX + btn.labelX}px`,
              marginTop: `${-(btn.imgOffY + btn.labelY)}px`
            }"
          />
        </div>

        <!-- 版本号 -->
        <div class="version-label">Ver. 1.1.1</div>
      </div>

      <!-- 面板叠加层 -->
      <div class="panels-layer">
        <Transition name="fade">
          <LoadGame v-if="activePanel === 'load'" @close="closePanel" @start-game="handleStartFromSave" />
        </Transition>
        <Transition name="fade">
          <Gallery v-if="activePanel === 'gallery'" @close="closePanel" />
        </Transition>
        <Transition name="fade">
          <Options v-if="activePanel === 'options'" @close="closePanel" />
        </Transition>
      </div>

    </div>

    <!-- 开场淡入遮罩（覆盖整个视口，不受 16:9 限制） -->
    <div 
      class="start-fade-overlay" 
      :class="{ 'is-hidden': !isFading }"
    ></div>
  </div>
</template>

<style scoped>
.home-container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.main-stage {
  background-color: #000;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
}

.background-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.bg-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transition: 
    transform 3.0s cubic-bezier(0.2, 0, 0.1, 1),
    filter 5.0s ease-out;
  transform: scale(1);
  filter: blur(0);
}

.bg-img.is-blurring {
  filter: blur(8px);
  transform: scale(1.05);
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transition: opacity 2.5s ease-in-out;
  opacity: 1;
}

.bg-overlay.ui-hidden {
  opacity: 0;
}

.ui-safe-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: opacity 2.5s ease-out;
  opacity: 1;
}

.ui-safe-area.ui-hidden {
  opacity: 0;
}

.title-logo {
  position: absolute;
  left: calc(50% + 747px);
  top: calc(50% - 381px);
  width: 1061px;
  height: 622px;
  transform: translate(-50%, -50%);
}

.menu-button {
  position: absolute;
  transform: translate(-50%, 50%);
  cursor: pointer;
  pointer-events: auto;
  transition: opacity 0.3s ease;
}

.menu-button.is-disabled {
  pointer-events: none;
  cursor: default;
}

.btn-base-img {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: none;
}

.btn-label-img {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.version-label {
  position: absolute;
  right: 65px;
  bottom: 56.5px;
  font-size: 40px;
  font-family: 'TsukushiMincho', serif;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 2.2px;
  text-align: right;
  pointer-events: none;
}

.start-fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  z-index: 9999;
  pointer-events: none;
  opacity: 1;
  transition: opacity 1.5s ease-in-out;
}

.start-fade-overlay.is-hidden {
  opacity: 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.panels-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5000;
}

.panels-layer > * {
  pointer-events: auto;
}
</style>

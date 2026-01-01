<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useGameStore } from '../../stores/game'
import { UI_LAYERS } from '@/constants/ui-layers'

interface Props {
  show?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const gameStore = useGameStore()
const scrollContainer = ref<HTMLElement | null>(null)

// Custom Scrollbar State
const thumbHeight = ref(0)
const thumbTop = ref(0)
const trackHeight = 1000 

let isDragging = false
let startY = 0
let startThumbTop = 0

const handleClose = (e: Event) => {
  e.stopPropagation()
  emit('close')
}

const playVoice = (voiceUrl: string) => {
  console.log('Playing voice:', voiceUrl)
}

const updateScrollbar = () => {
  if (!scrollContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  const ratio = clientHeight / scrollHeight
  thumbHeight.value = Math.max(ratio * trackHeight, 50)
  const maxScroll = scrollHeight - clientHeight
  if (maxScroll <= 0) {
    thumbTop.value = 0
  } else {
    thumbTop.value = (scrollTop / maxScroll) * (trackHeight - thumbHeight.value)
  }
}

const onScroll = () => {
  if (!isDragging) updateScrollbar()
}

const onThumbMouseDown = (e: MouseEvent) => {
  isDragging = true
  startY = e.clientY
  startThumbTop = thumbTop.value
  window.addEventListener('mousemove', onThumbMouseMove)
  window.addEventListener('mouseup', onThumbMouseUp)
  e.preventDefault()
}

const onThumbMouseMove = (e: MouseEvent) => {
  if (!isDragging || !scrollContainer.value) return
  const deltaY = e.clientY - startY
  const newThumbTop = Math.max(0, Math.min(trackHeight - thumbHeight.value, startThumbTop + deltaY))
  thumbTop.value = newThumbTop
  const { scrollHeight, clientHeight } = scrollContainer.value
  const maxScroll = scrollHeight - clientHeight
  const scrollRatio = newThumbTop / (trackHeight - thumbHeight.value)
  scrollContainer.value.scrollTop = scrollRatio * maxScroll
}

const onThumbMouseUp = () => {
  isDragging = false
  window.removeEventListener('mousemove', onThumbMouseMove)
  window.removeEventListener('mouseup', onThumbMouseUp)
}

onMounted(() => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
      updateScrollbar()
      const observer = new MutationObserver(updateScrollbar)
      observer.observe(scrollContainer.value, { childList: true, subtree: true })
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onThumbMouseMove)
  window.removeEventListener('mouseup', onThumbMouseUp)
})
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="log-ui-container" @click.stop>
      <!-- 1. Background -->
      <img src="/UI_Log/LogBase.png" class="full-underlay" />

      <!-- 2. Header Title -->
      <div class="header-title">
        <img src="/UI_Log/TitleBase@ZhHans.png" class="title-img" />
      </div>

      <!-- 3. Close Button -->
      <div class="close-button" @click.stop="handleClose">
        <div class="close-button-hitbox"></div>
      </div>

      <!-- 4. Scrollable History Area -->
      <div class="log-scroll-view">
        <div class="scroll-viewport" ref="scrollContainer" @scroll="onScroll">
          <div class="log-content">
            <div v-for="(entry, index) in gameStore.history" :key="index" class="log-entry">
              <div class="entry-header">
                <div class="header-decoration-col">
                  <div class="voice-button-area">
                    <div v-if="entry.voice" class="voice-button-wrapper" @click="playVoice(entry.voice)">
                      <div class="voice-button"></div>
                    </div>
                    <div v-else class="voice-spacer"></div>
                  </div>
                  <img src="/UI_Log/NameUnderline.png" class="header-underline" />
                </div>

                <div class="header-name-area">
                  <div class="speaker-name-plate">
                    <img src="/UI_Adv/NamePlateBase.png" class="plate-base" />
                    <div class="speaker-name-content">
                      <template v-for="(char, charIndex) in entry.speaker.split('')" :key="charIndex">
                        <span 
                          :class="{
                            'first-initial': charIndex === 0,
                            'second-initial': charIndex === 2,
                            'name-body': charIndex !== 0 && charIndex !== 2
                          }"
                        >{{ char }}</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <div class="entry-text">
                {{ entry.text }}
              </div>
            </div>
          </div>
        </div>

        <div class="custom-scrollbar-track">
          <img src="/UI_Log/Scrollbar_Base.png" class="track-img" draggable="false" />
          <div 
            class="scrollbar-handle" 
            :class="{ dragging: isDragging }"
            :style="{ height: thumbHeight + 'px', transform: `translateY(${thumbTop}px)` }"
            @mousedown="onThumbMouseDown"
          >
            <img src="/UI_Log/Scrollbar_Fill.png" class="handle-img" draggable="false" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.log-ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: v-bind('UI_LAYERS.LOG');
  overflow: hidden;
  pointer-events: auto;
}

.full-underlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.header-title {
  position: absolute;
  left: 0;
  top: 0;
  width: 426px;
  height: 254px;
  z-index: 10;
}

.title-img { width: 100%; height: 100%; }

.close-button {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 238px;
  cursor: pointer;
  background-image: url('/UI_Common/CloseButton_Default.png');
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 100;
}
.close-button:hover { background-image: url('/UI_Common/CloseButton_Highlighted.png'); }
.close-button:active { background-image: url('/UI_Common/CloseButton_Pressed.png'); }
.close-button-hitbox { width: 100%; height: 100%; }

.log-scroll-view {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1640px;
  height: 1440px;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.scroll-viewport {
  position: absolute;
  top: 160px;
  left: 0;
  width: 100%;
  height: calc(100% - 260px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 40px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-viewport::-webkit-scrollbar { display: none; }

.custom-scrollbar-track {
  position: absolute;
  right: -80px;
  top: 50%;
  width: 16px;
  height: 1000px;
  transform: translateY(-50%) translateY(-21px);
  z-index: 10;
  filter: brightness(1.3);
}

.track-img { width: 100%; height: 100%; object-fit: fill; opacity: 0.6; }

.scrollbar-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 50px;
  cursor: grab;
  user-select: none;
  transition: filter 0.2s;
}

.scrollbar-handle.dragging { cursor: grabbing; filter: brightness(1.5); }
.scrollbar-handle:hover { filter: brightness(1.5); }
.handle-img { width: 100%; height: 100%; object-fit: fill; }

.log-content {
  display: flex;
  flex-direction: column;
  gap: 60px;
  padding-bottom: 200px;
}

.log-entry { display: flex; flex-direction: column; gap: 15px; }

.entry-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  height: 100px;
  margin-bottom: 20px;
}

.header-decoration-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 312px;
}

.voice-button-area {
  height: 60px;
  display: flex;
  align-items: center;
  padding-left: 0px;
}

.voice-button-wrapper {
  width: 78px;
  height: 60px;
  cursor: pointer;
}

.voice-button {
  width: 100%;
  height: 100%;
  background-image: url('/UI_Log/VoiceButton_Default.png');
  background-size: contain;
  background-repeat: no-repeat;
}

.voice-button:hover { background-image: url('/UI_Log/VoiceButton_Highlighted.png'); }
.voice-button:active { background-image: url('/UI_Log/VoiceButton_Pressed.png'); }

.voice-spacer { width: 78px; height: 60px; }

.header-underline { width: 312px; height: 4px; object-fit: fill; margin-top: 5px; }

.header-name-area { flex: 1; height: 80px; }

.speaker-name-plate {
  position: relative;
  width: 601px;
  height: 289px;
  display: flex;
  align-items: center;
  /* 应用最终平移数值: X -500, Y -105 */
  transform: scale(0.48) translate(-550px, -105px);
  transform-origin: left center;
  margin-top: -60px;
}

.plate-base { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; }

.speaker-name-content {
  position: absolute;
  left: 88px;
  top: 50%;
  transform: translateY(-50%) translateY(-14px);
  z-index: 1;
  display: flex;
  align-items: baseline;
  font-family: 'SourceHanSerifSC', serif;
  text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.9);
}

.first-initial { font-size: 132px; line-height: 1; color: white; }
.second-initial { font-size: 120px; line-height: 1; color: white; margin-left: 2px; }
.name-body { font-size: 72px; line-height: 1; color: white; margin-left: 2px; }

.entry-text {
  font-family: 'SourceHanSerifSC', serif;
  font-size: 42px;
  color: white;
  line-height: 1.6;
  padding-left: 200px;
  max-width: 1500px;
  white-space: pre-wrap;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

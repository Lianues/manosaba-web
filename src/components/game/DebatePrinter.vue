<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { UI_LAYERS } from '@/constants/ui-layers'
import type { HighlightClickEvent } from '@/types/debate'
import { parseHighlightMarks } from '@/types/debate'

interface Props {
  messages?: string[]
  portraitPath?: string
  portraitSide?: 'left' | 'right'
  tiltAngle?: number
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
  portraitPath: '',
  portraitSide: 'left',
  tiltAngle: 0
})

const emit = defineEmits<{
  (e: 'highlight-click', event: HighlightClickEvent): void
}>()

const gameStore = useGameStore()

// 设计稿基准尺寸 (2560x1440)
const designWidth = 2560
const designHeight = 1440

// 计算立绘位置的偏移量
const portraitOffsetX = computed(() => props.portraitSide === 'left' ? 50 : -50)

// 整个内容的倾斜样式
const contentTiltStyle = computed(() => ({
  transform: `rotate(${-props.tiltAngle}deg)`,
  transformOrigin: 'center center',
}))

// 立绘样式
const portraitStyle = computed(() => ({
  transform: `scale(2.8) translate(${portraitOffsetX.value}px, 955px)`,
  transformOrigin: 'bottom center'
}))

// 处理文字标记
const parsedMessages = computed(() => 
  props.messages.map(msg => parseHighlightMarks(msg))
)

// 处理高亮文字点击事件
function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('clickable') && target.dataset.eventId) {
    event.stopPropagation() 
    const eventData: HighlightClickEvent = {
      eventId: target.dataset.eventId,
      text: target.dataset.text || target.textContent || ''
    }
    emit('highlight-click', eventData)
    handleBuiltinEvent(eventData.eventId)
  }
}

function handleBuiltinEvent(eventId: string) {
  if (eventId === 'close_debate') {
    gameStore.nextLine()
  }
}

function handleScreenClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('highlight')) return
  gameStore.nextLine()
}
</script>

<template>
  <div class="debate-printer" @click.stop="handleScreenClick">
    <!-- 内容层 -->
    <div class="debate-content" :style="contentTiltStyle">
      <div class="layout-wrapper">
        <!-- 左侧立绘插槽 -->
        <div class="portrait-side" v-if="portraitSide === 'left' && portraitPath">
          <img :src="portraitPath" class="portrait-img" :style="portraitStyle" />
        </div>

        <!-- 文字部分 -->
        <div class="text-side">
          <div class="content" @click="handleContentClick">
            <div 
              v-for="(msg, index) in parsedMessages" 
              :key="index" 
              class="message-label"
              v-html="msg"
            ></div>
          </div>
        </div>

        <!-- 右侧立绘插槽 -->
        <div class="portrait-side" v-if="portraitSide === 'right' && portraitPath">
          <img :src="portraitPath" class="portrait-img" :style="portraitStyle" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debate-printer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: v-bind('UI_LAYERS.DEBATE');
  pointer-events: auto;
}

.debate-content {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.layout-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.portrait-side {
  flex: 0 0 50%; /* 固定占据50%宽度，不伸缩 */
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  overflow: visible;
}

.portrait-img {
  height: 100%;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 20px rgba(0,0,0,0.8));
}

.text-side {
  flex: 0 0 50%; /* 固定占据50%宽度，不伸缩 */
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 80px;
  box-sizing: border-box;
  overflow: hidden;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 100%;
  height: fit-content;
  gap: 0px;
  pointer-events: auto;
}

.message-label {
  font-family: 'SourceHanSerifSC', serif;
  font-size: 100px;
  font-weight: bold;
  color: white;
  display: block;
  text-align: left;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
  white-space: pre-wrap; /* 允许自动换行 */
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.2;
  padding: 15px 0;
  width: 100%;
  max-width: 100%;
}

:deep(.highlight) {
  color: rgb(252, 137, 162);
  font-size: 1.35em;
  font-weight: 900;
  text-shadow: 0 0 15px rgba(252, 137, 162, 0.4), 4px 4px 8px rgba(0, 0, 0, 0.8);
  margin: 0 4px;
  line-height: 1;
  transition: opacity 0.15s ease-out;
}

:deep(.highlight.clickable) {
  cursor: pointer;
  position: relative;
}

:deep(.highlight.clickable:hover) {
  opacity: 0.6;
}

:deep(.highlight.clickable:active) {
  opacity: 0.4;
}
</style>

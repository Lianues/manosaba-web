<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UI_LAYERS } from '@/constants/ui-layers'

// 立绘标准参考高度 (Ema 正常立绘ver2.png 的高度)
const STANDARD_HEIGHT = 4003

// 立绘预设参数
const PORTRAIT_PRESETS = {
  normal: { scale: 1.85, bottom: -1260 },   // 默认/远景
  closeup: { scale: 2.25, bottom: -1980 }   // 近景
}

// 角色名首字颜色映射表
const CHARACTER_INITIAL_COLORS: Record<string, string> = {
  '樱羽艾玛': 'rgb(252, 145, 172)',
  '二阶堂希罗': 'rgb(235, 78, 85)',
  '泽渡可可': 'rgb(252, 114, 80)',
  '远野汉娜': 'rgb(171, 198, 31)',
  '佐伯米莉亚': 'rgb(233, 208, 141)',
  '紫藤亚里沙': 'rgb(235, 77, 61)',
  '夏目安安': 'rgb(158, 146, 250)',
  '莲见蕾雅': 'rgb(250, 177, 91)',
  '宝生玛格': 'rgb(183, 125, 234)',
  '冰上梅露露': 'rgb(226, 185, 176)',
  '黑部奈叶香': 'rgb(132, 142, 147)',
  '城崎诺亚': 'rgb(102, 222, 228)',
  '橘雪莉': 'rgb(133, 177, 255)',
  '典狱长': 'rgb(178, 174, 191)',
  '???': 'rgb(255, 255, 255)',
}

interface Props {
  author?: string
  message?: string
  showIndicator?: boolean
  // 配色
  initialColor?: string
  bodyColor?: string
  // 立绘相关
  portraitPath?: string
  portraitType?: 'normal' | 'closeup'  // 立绘类型
  portraitPositionX?: number // 横向位置百分比 (0-100)，默认50为居中
  // 逐字淡入动画
  charDelay?: number      // 每个字符的延迟（毫秒）
  charFadeDuration?: number  // 每个字符的淡入时间（毫秒）
  // 外观模式
  appearance?: 'default' | 'stream'  // 外观模式：默认 或 直播
}

const props = withDefaults(defineProps<Props>(), {
  author: '',
  message: '',
  showIndicator: false,
  initialColor: '#ffffff',
  bodyColor: '#ffffff',
  portraitPath: '',
  portraitType: 'normal',
  portraitPositionX: 50,
  charDelay: 20,
  charFadeDuration: 130,
  appearance: 'default'
})

// 事件
const emit = defineEmits<{
  (e: 'animationComplete'): void
  (e: 'click'): void
}>()

// 获取当前预设参数
const currentPreset = computed(() => PORTRAIT_PRESETS[props.portraitType])

// 是否为直播模式
const isStreamMode = computed(() => props.appearance === 'stream')

// 根据角色名自动获取首字颜色
const authorInitialColor = computed(() => {
  // 如果手动指定了颜色，优先使用
  if (props.initialColor !== '#ffffff') {
    return props.initialColor
  }
  // 否则根据角色名查找
  return CHARACTER_INITIAL_COLORS[props.author] || '#ffffff'
})

// 立绘样式计算
const portraitStyle = computed(() => {
  if (!props.portraitPath) return {}
  
  const designHeight = 1440
  const finalScale = currentPreset.value.scale
  
  return {
    height: `${designHeight * finalScale}px`,
    bottom: `${currentPreset.value.bottom}px`,
    left: `${props.portraitPositionX}%`,
    transform: 'translateX(-50%)'
  }
})

// 解析消息为字符数组（保留 HTML 标签）
interface CharItem {
  type: 'char' | 'tag' | 'newline'
  content: string
  index: number  // 用于计算延迟的字符索引
}

const parsedChars = computed(() => {
  const result: CharItem[] = []
  const html = props.message
  const tagRegex = /<[^>]+>/g
  let lastIndex = 0
  let charIndex = 0
  let match
  
  while ((match = tagRegex.exec(html)) !== null) {
    // 标签前的文本
    if (match.index > lastIndex) {
      const text = html.slice(lastIndex, match.index)
      for (const char of text) {
        if (char === '\n') {
          result.push({ type: 'newline', content: char, index: charIndex++ })
        } else {
          result.push({ type: 'char', content: char, index: charIndex++ })
        }
      }
    }
    // HTML 标签（不计入延迟）
    result.push({ type: 'tag', content: match[0], index: -1 })
    lastIndex = match.index + match[0].length
  }
  
  // 剩余文本
  if (lastIndex < html.length) {
    const text = html.slice(lastIndex)
    for (const char of text) {
      if (char === '\n') {
        result.push({ type: 'newline', content: char, index: charIndex++ })
      } else {
        result.push({ type: 'char', content: char, index: charIndex++ })
      }
    }
  }
  
  return result
})

// 计算总动画时间
const totalAnimationTime = computed(() => {
  const charCount = parsedChars.value.filter(c => c.type === 'char' || c.type === 'newline').length
  return charCount * props.charDelay + props.charFadeDuration
})

// 动画key，用于重新触发动画
const animationKey = ref(0)

// 监听 message 变化
watch(() => props.message, () => {
  animationKey.value++
  // 动画完成后触发事件
  setTimeout(() => {
    emit('animationComplete')
  }, totalAnimationTime.value)
})

// 处理点击
function handleClick() {
  emit('click')
}

// 获取字符的延迟样式
function getCharStyle(index: number) {
  return {
    animationDelay: `${index * props.charDelay}ms`,
    animationDuration: `${props.charFadeDuration}ms`
  }
}
</script>

<template>
  <div class="normal-printer-container" @click="handleClick">
    <div class="ui-content-area">
      <!-- 立绘层 -->
      <div class="portrait-layer" v-if="props.portraitPath">
        <img 
          :src="props.portraitPath" 
          class="portrait-img" 
          :style="portraitStyle"
        />
      </div>

      <img src="/UI_Adv/NormalPrinter_Frame_Bottom.png" class="frame-bottom" v-show="!isStreamMode" />
      <img src="/UI_Adv/NormalPrinter_Screen.png" class="bottom-shadow" />
      <img src="/UI_Adv/NormalPrinter_Frame_Top.png" class="frame-top" v-show="!isStreamMode" />
      <img src="/UI_Adv/NormalPrinter_Grass_1.png" class="grass-1" v-show="!isStreamMode" />
      <img src="/UI_Adv/NormalPrinter_Grass_2.png" class="grass-2" v-show="!isStreamMode" />

      <!-- 直播模式框架 -->
      <img src="/UI_Adv/Stream/StreamFrame.png" class="stream-frame" v-show="isStreamMode" />

      <!-- 名字面板 -->
      <div class="author-panel" v-if="props.author">
        <img src="/UI_Adv/NamePlateBase.png" class="author-base" />
        <div class="author-label-wrapper">
          <div class="author-label">
            <template v-for="(char, index) in props.author.split('')" :key="index">
              <span 
                :class="{
                  'first-initial': index === 0,
                  'second-initial': index === 2,
                  'name-body': index !== 0 && index !== 2
                }"
                :style="{ 
                  color: index === 0 ? authorInitialColor : props.bodyColor 
                }"
              >{{ char }}</span>
            </template>
          </div>
        </div>
      </div>

      <!-- 对话文本区域 - 逐字淡入 -->
      <div class="message-container">
        <div class="message-label" :key="animationKey">
          <template v-for="(item, idx) in parsedChars" :key="idx">
            <!-- HTML 标签直接渲染 -->
            <span v-if="item.type === 'tag'" v-html="item.content"></span>
            <!-- 换行 -->
            <br v-else-if="item.type === 'newline'" />
            <!-- 普通字符 - 带淡入动画 -->
            <span 
              v-else
              class="char-fade-in"
              :style="getCharStyle(item.index)"
            >{{ item.content }}</span>
          </template>
        </div>
      </div>

      <div class="input-indicator" v-if="props.showIndicator">
        <img src="/UI_Adv/InputIndicator.png" class="indicator-icon" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.normal-printer-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  cursor: pointer;
  z-index: v-bind('UI_LAYERS.NORMAL_PRINTER');
}

.ui-content-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 立绘层 */
.portrait-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.portrait-img {
  position: absolute;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 30px rgba(0, 0, 0, 0.5));
}

.frame-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 2560px;
  height: 797px;
  z-index: 5;
}

.bottom-shadow {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 2560px;
  height: 852px;
  z-index: 15;
  pointer-events: none;
}

.frame-top { position: absolute; top: 0; right: 0; width: 287px; height: 470px; z-index: 10; }
.grass-1 { position: absolute; top: 0; right: 0; width: 365px; height: 371px; z-index: 11; }
.grass-2 { position: absolute; bottom: 0; left: 0; width: 371px; height: 429px; z-index: 11; }

/* 直播模式框架 */
.stream-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2560px;
  height: 1440px;
  z-index: 10;
  pointer-events: none;
}

.author-panel {
  position: absolute;
  left: calc(50% - 639px);
  bottom: 394px;
  width: 601px;
  height: 289px;
  transform: translate(-50%, 50%);
  display: flex;
  align-items: center;
  z-index: 20;
}

.author-base {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
}

.author-label-wrapper {
  position: absolute;
  left: 88px;
  top: 50%;
  transform: translateY(-50%) translateY(-14px);
  width: 1000px;
}

.author-label {
  font-family: 'SourceHanSerifSC', serif;
  text-align: left;
  display: flex;
  align-items: baseline;
  text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.9);
}

.first-initial { font-size: 132px; line-height: 1; }
.second-initial { font-size: 120px; line-height: 1; margin-left: 2px; }
.name-body { font-size: 72px; line-height: 1; margin-left: 2px; }

.message-container {
  position: absolute;
  left: 50%;
  bottom: 177px;
  width: 1414px;
  height: 200px;
  transform: translate(-50%, 50%);
  display: flex;
  align-items: flex-start;
  z-index: 20;
}

.message-label {
  width: 100%;
  font-family: 'SourceHanSerifSC', serif;
  font-size: 48px;
  line-height: 1.4;
  color: #ffffff;
  text-align: left;
  white-space: pre-wrap;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.9), 0px 0px 10px rgba(0, 0, 0, 0.5);
}

/* 逐字淡入动画 */
.char-fade-in {
  opacity: 0;
  animation: char-fade-in ease-out forwards;
}

@keyframes char-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.input-indicator {
  position: absolute;
  right: 446px;
  bottom: 102px;
  width: 85px;
  height: 75px;
  z-index: 30;
}

.indicator-icon {
  width: 100%;
  height: 100%;
  animation: indicator-fade 2.4s infinite ease-in-out;
}

@keyframes indicator-fade {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* 强调文字的样式 */
:deep(.highlight), :deep(.objection), :deep(b) {
  color: rgb(252, 137, 162);
  font-weight: bold;
}

:deep(u) {
  text-decoration: none;
  border-bottom: 2px solid rgb(252, 137, 162);
  color: rgb(252, 137, 162);
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '../../stores/game'
import { UI_LAYERS } from '@/constants/ui-layers'
import { getTransitionEffect } from '@/logic/transitions'

import NormalPrinter from './NormalPrinter.vue'
import CharacterLayer from './CharacterLayer.vue'
import ChoiceButton from './ChoiceButton.vue'
import ControlPanel from './ControlPanel.vue'
import WitchBookButtonUI from './WitchBookButtonUI.vue'
import AutoToggle from './AutoToggle.vue'
import SaveLoadUI from './SaveLoadUI.vue'
import GalleryUI from './GalleryUI.vue'
import ExecutionButtonUI from './ExecutionButtonUI.vue'
import LogUI from './LogUI.vue'
import LoadingUI from './LoadingUI.vue'
import OptionsUI from './OptionsUI.vue'
import WitchBookUI from './WitchBookUI.vue'
import TrialChoicePanelUI from './TrialChoicePanelUI.vue'
import DebatePrinter from './DebatePrinter.vue'
import PerspectiveStage from './PerspectiveStage.vue'
import DebugPanel from './DebugPanel.vue'

// 以下导入已废弃（charMiddle 带 appearance 现在作为普通角色处理）
// import { getCharacterCompositionConfig, resolveCharacterId } from '../../data/characters'
// import { resolveAppearance } from '../../logic/character-service'

const emit = defineEmits(['back-to-home'])

interface Props {
  skipInit?: boolean  // 是否跳过初始化（从存档加载时为 true）
}

const props = withDefaults(defineProps<Props>(), {
  skipInit: false
})

const gameStore = useGameStore()

const isMenuOpen = ref(false)

// 调试模式开关（生产环境可以设为 false）
const isDebugMode = ref(false)

// Warden 中间层角色调试模式
const isWardenDebugMode = ref(false)

// 立绘调试参数
const debugPortraitScale = ref(1.6)
const debugPortraitBottom = ref(-1010)
const debugViewScale = ref(1.0)

// 中间层角色调试参数
const debugMiddleCharScale = ref(0.55)
const debugMiddleCharBottom = ref(170)

// 中间层角色基础参数（单张立绘：脚本 Scale:1.4 对应实际 scale=0.55, bottom=170）
const MIDDLE_CHAR_BASE_SCALE = 0.55 / 1.4  // ≈ 0.393
const MIDDLE_CHAR_BASE_BOTTOM = 170

// 中间层组合立绘参数（已废弃，charMiddle 带 appearance 现在作为普通角色处理）
// const MIDDLE_COMPOSER_WIDTH = 1000
// const MIDDLE_COMPOSER_HEIGHT = 1440
// const MIDDLE_COMPOSER_PRESETS = {
//   normal: { scale: 1.6, bottom: -1010 }
// }

// 中间层角色图片路径映射（处理特殊文件名格式）
const MIDDLE_CHAR_PATH_MAP: Record<string, Record<string, string>> = {
  'Warden': {
    '1': '/Characters/Warden/1-warden-831519502845004091.png'
  }
}

// 获取中间层角色图片路径
function getMiddleCharPath(id: string, variant: string): string {
  return MIDDLE_CHAR_PATH_MAP[id]?.[variant] || `/Characters/${id}/${variant}-${id.toLowerCase()}.png`
}

// 检查中间层角色是否支持组合系统（已废弃，charMiddle 带 appearance 现在作为普通角色处理）
// const middleCharIsComposer = computed(() => {
//   if (!gameStore.middleCharacter) return false
//   const charId = gameStore.middleCharacter.id
//   const hasConfig = !!getCharacterCompositionConfig(charId)
//   const hasAppearance = gameStore.middleCharacter.appearance && gameStore.middleCharacter.appearance.length > 0
//   return hasConfig && hasAppearance
// })

// 中间层角色的 ComposerState（已废弃）
// const middleCharComposerState = computed(() => {
//   if (!gameStore.middleCharacter || !middleCharIsComposer.value) return undefined
//   const charId = gameStore.middleCharacter.id
//   const appearance = gameStore.middleCharacter.appearance || []
//   return resolveAppearance(charId, appearance)
// })

// 中间层组合立绘的样式（已废弃）
// const middleCharComposerStyle = computed(() => {
//   if (!gameStore.middleCharacter) return {}
//   const preset = MIDDLE_COMPOSER_PRESETS.normal
//   const posX = gameStore.middleCharacter.posX ?? 50
//   return {
//     width: `${MIDDLE_COMPOSER_WIDTH}px`,
//     height: `${MIDDLE_COMPOSER_HEIGHT}px`,
//     bottom: `${preset.bottom}px`,
//     left: `${posX}%`,
//     transform: `translateX(-50%) scale(${preset.scale})`,
//     transformOrigin: 'bottom center'
//   }
// })

// 同步 Auto 模式到 gameStore
const isAutoMode = computed({
  get: () => gameStore.isAutoMode,
  set: (val) => gameStore.setAutoMode(val)
})

// 1. 设计稿基准尺寸
const designWidth = 2560
const designHeight = 1440
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const scale = computed(() => {
  const sX = windowWidth.value / designWidth
  const sY = windowHeight.value / designHeight
  return Math.min(sX, sY)
})

const updateWindowSize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// 全局主舞台样式
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

// 根据 Scene 类型决定显示哪个 Printer
const isDebateScene = computed(() => gameStore.currentScene?.type === 'debate')
const isTextLine = computed(() => gameStore.currentLine?.type === 'text')

// 背景图片样式计算
const bgImageStyle = computed(() => {
  const style = gameStore.backgroundStyle
  const transforms: string[] = []
  
  // Naninovel 的 pos 是百分比位置，50,50 为居中
  // X轴: 0(左) -> 100(右)
  // Y轴: 0(下) -> 100(上)  <-- 注意 Unity Y轴向上
  // CSS translate 是相对于元素自身的百分比
  // X: (pos - 50)%
  // Y: -(pos - 50)%  <-- 反转 Y 轴，因为 CSS Y轴向下
  
  const translateX = (style.posX - 50)
  const translateY = -(style.posY - 50)
  
  // 1. 先平移 (Translate)
  if (translateX !== 0 || translateY !== 0) {
    transforms.push(`translate(${translateX}%, ${translateY}%)`)
  }
  
  // 2. 再缩放 (Scale)
  if (style.scale !== 1) {
    transforms.push(`scale(${style.scale})`)
  }
  
  // 3. 最后旋转 (Rotate)
  // Unity (左手系) Z轴旋转正值是逆时针
  // CSS Z轴旋转正值是顺时针
  // 所以需要对 rotZ 取反
  if (style.rotX) transforms.push(`rotateX(${style.rotX}deg)`)
  if (style.rotY) transforms.push(`rotateY(${style.rotY}deg)`)
  if (style.rotZ) transforms.push(`rotateZ(${-style.rotZ}deg)`)
  
  return {
    transform: transforms.length > 0 ? transforms.join(' ') : undefined,
    // 确保变换原点是中心，这样 scale 和 rotate 才是基于中心的
    transformOrigin: 'center center',
    // 模糊效果
    filter: style.blur > 0 ? `blur(${style.blur}px)` : undefined
  }
})

// 中间层背景样式计算（独立于主背景）
const middleBgImageStyle = computed(() => {
  const style = gameStore.middleBackgroundStyle
  const transforms: string[] = []
  
  const translateX = (style.posX - 50)
  const translateY = -(style.posY - 50)
  
  if (translateX !== 0 || translateY !== 0) {
    transforms.push(`translate(${translateX}%, ${translateY}%)`)
  }
  
  // 始终添加 scale，即使是 1.0
  transforms.push(`scale(${style.scale})`)
  
  if (style.rotX) transforms.push(`rotateX(${style.rotX}deg)`)
  if (style.rotY) transforms.push(`rotateY(${style.rotY}deg)`)
  if (style.rotZ) transforms.push(`rotateZ(${-style.rotZ}deg)`)
  
  return {
    transform: transforms.join(' '),
    transformOrigin: 'center center',
    opacity: style.opacity,
    // 模糊效果
    filter: style.blur > 0 ? `blur(${style.blur}px)` : undefined
  }
})

// --- 转场动画处理 ---
const transitionRef = ref<HTMLElement | null>(null)
const slatRefs = ref<HTMLElement[]>([])

watch(() => gameStore.isTransitioning, async (newVal) => {
  if (newVal) {
    const { style, duration } = gameStore.transitionParams
    await nextTick()
    
    if (!transitionRef.value) return

    const effect = getTransitionEffect(style)
    
    effect({
      container: transitionRef.value,
      slats: slatRefs.value,
      duration,
      params: gameStore.transitionParams,
      onMidpoint: () => {
        gameStore.nextLine()
      }
    }).eventCallback('onComplete', () => {
      gameStore.isTransitioning = false
      slatRefs.value = []
    })
  }
})

onMounted(() => {
  // 如果不是从存档加载，则启动新游戏
  if (!props.skipInit) {
    gameStore.startGame()
  }
  window.addEventListener('resize', updateWindowSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize)
})

const handleScreenClick = () => {
  // 如果处于 Auto 模式，手动点击屏幕应该关闭 Auto 模式
  if (isAutoMode.value) {
    isAutoMode.value = false
    console.log('Auto mode disabled by manual click')
    return // 点击仅用于关闭 Auto，不推进下一行（或者你可以选择继续推进）
  }

  if (gameStore.currentLine?.type === 'text' && 
      !gameStore.isChoiceOpen && !gameStore.isTrialChoiceOpen && 
      !gameStore.isExecutionOpen &&
      !gameStore.isUIHidden && !gameStore.isLoading && !gameStore.isTransitioning) {
    gameStore.nextLine()
  }
}
// 监听 UI 开启状态，自动关闭 Auto 模式
watch(
  [
    () => gameStore.isWitchBookOpen,
    () => isMenuOpen.value,
    () => gameStore.isSaveLoadOpen,
    () => gameStore.isOptionsOpen,
    () => gameStore.isLogOpen,
    () => gameStore.isTrialChoiceOpen,
    () => gameStore.isExecutionOpen
  ],
  (newValues) => {
    // 如果任何一个面板打开了 (值为 true)，且当前处于 Auto 模式
    if (newValues.some(val => val === true) && isAutoMode.value) {
      isAutoMode.value = false
      console.log('Auto mode disabled due to UI panel opening')
    }
  }
)
</script>

<template>
  <div class="game-interface" @click="handleScreenClick">
    <!-- 主舞台：所有游戏内容都在这里，统一 16:9 -->
    <div class="main-stage" :style="stageStyle">
      
      <!-- 背景层 -->
      <div class="background-layer">
        <!-- 主背景层 -->
        <img 
          v-if="gameStore.backgroundType === 'image' && gameStore.backgroundPath" 
          :src="gameStore.backgroundPath" 
          class="bg-image" 
          :style="bgImageStyle"
        />
        <!-- 中间层背景 (MainBackground-Middle, Stills) -->
        <img 
          v-if="gameStore.middleBackgroundPath" 
          :src="gameStore.middleBackgroundPath" 
          class="bg-image middle-layer" 
          :style="middleBgImageStyle"
        />
        <!-- 中间层角色 (如典狱长，单张完整立绘，无 appearance) -->
        <img 
          v-if="gameStore.middleCharacter?.visible"
          :src="getMiddleCharPath(gameStore.middleCharacter.id, gameStore.middleCharacter.variant)"
          class="middle-character"
          :style="{
            transform: `translateX(-50%) scale(${isWardenDebugMode ? debugMiddleCharScale : gameStore.middleCharacter.scale * MIDDLE_CHAR_BASE_SCALE})`,
            bottom: isWardenDebugMode ? `${debugMiddleCharBottom}px` : `${MIDDLE_CHAR_BASE_BOTTOM}px`
          }"
        />
        <!-- 3D 法庭背景 -->
        <PerspectiveStage 
          v-if="gameStore.backgroundType === 'perspective'" 
          class="bg-perspective" 
        />
        <!-- 遮罩层 (Overlay) -->
        <div 
          class="overlay-layer"
          :style="{
            backgroundColor: gameStore.overlayColor,
            opacity: gameStore.overlayOpacity,
            zIndex: 10
          }"
        ></div>
      </div>
      
      <!-- 人物层 -->
      <CharacterLayer 
        :debug-scale="isDebugMode ? debugPortraitScale : undefined"
        :debug-bottom="isDebugMode ? debugPortraitBottom : undefined"
        :debug-view-scale="isDebugMode ? debugViewScale : undefined"
      />
      
      <!-- NormalPrinter: traditional/trial 场景的文字 -->
      <NormalPrinter 
        v-if="!gameStore.isLoading && !gameStore.isUIHidden && !gameStore.isExecutionOpen && !isDebateScene"
        :author="gameStore.textState.speaker"
        :message="gameStore.textState.text"
        :show-indicator="!isMenuOpen && !gameStore.isSaveLoadOpen && !gameStore.isChoiceOpen && isTextLine && !!gameStore.textState.text"
        :portrait-path="gameStore.textState.portraitPath"
        :portrait-type="gameStore.textState.portraitType"
        :portrait-position-x="gameStore.textState.portraitPositionX"
        :appearance="gameStore.printerAppearance"
      />

      <!-- DebatePrinter: debate 场景的文字 -->
      <DebatePrinter 
        v-if="!gameStore.isLoading && !gameStore.isUIHidden && !gameStore.isExecutionOpen && isDebateScene && gameStore.textState.text" 
        :messages="[gameStore.textState.text]"
        :portrait-path="gameStore.textState.portraitPath"
        :portrait-side="gameStore.textState.portraitSide"
        :tilt-angle="gameStore.debateConfig.tiltAngle"
      />
      
      <!-- 选项层 -->
      <div v-if="!gameStore.isUIHidden && !gameStore.isLoading && gameStore.isChoiceOpen" class="choice-overlay" @click.stop>
        <img src="/UI_Adv/Choice/ChoiceScreenBase.png" class="choice-bg" />
        <div class="choices-container">
          <ChoiceButton 
            v-for="choice in gameStore.choiceData" 
            :key="choice.text"
            :text="choice.text"
            :is-bad="choice.isBad"
            @click="gameStore.goToScene(choice.targetScene, choice.targetLabel); gameStore.isChoiceOpen = false"
          />
        </div>
      </div>

      <!-- UI 持久层 -->
      <div class="ui-persistent-layer">
        <template v-if="!gameStore.isUIHidden && !gameStore.isLoading">
          <AutoToggle 
            v-if="!isMenuOpen && !gameStore.isSaveLoadOpen && !gameStore.isLogOpen && !gameStore.isWitchBookOpen && !gameStore.isChoiceOpen"
            v-model="isAutoMode" 
          />
          <WitchBookButtonUI 
            v-if="!gameStore.isSaveLoadOpen && !gameStore.isLogOpen && !gameStore.isWitchBookOpen"
          />
          <ControlPanel 
            v-if="(!gameStore.isSaveLoadOpen && !gameStore.isGalleryOpen && !gameStore.isLogOpen && !gameStore.isWitchBookOpen && !gameStore.isOptionsOpen) || isMenuOpen"
            :show="isMenuOpen" 
            @open="isMenuOpen = true"
            @close="isMenuOpen = false"
            @save="gameStore.isSaveLoadOpen = true; gameStore.saveLoadMode = 'save'; isMenuOpen = false"
            @load="gameStore.isSaveLoadOpen = true; gameStore.saveLoadMode = 'load'; isMenuOpen = false"
            @log="gameStore.isLogOpen = true; isMenuOpen = false"
            @options="gameStore.isOptionsOpen = true; isMenuOpen = false"
            @title="emit('back-to-home')"
          />
          <WitchBookUI />
          <TrialChoicePanelUI />
          <OptionsUI :show="gameStore.isOptionsOpen" @close="gameStore.isOptionsOpen = false" />
          <SaveLoadUI 
            :show="gameStore.isSaveLoadOpen"
            :mode="gameStore.saveLoadMode"
            @close="gameStore.isSaveLoadOpen = false"
          />
          <GalleryUI :show="gameStore.isGalleryOpen" @close="gameStore.isGalleryOpen = false" />
          <LogUI :show="gameStore.isLogOpen" @close="gameStore.isLogOpen = false" />
        </template>
        
        <ExecutionButtonUI 
          :show="gameStore.isExecutionOpen"
          @complete="gameStore.handleExecutionComplete()"
          @close="gameStore.isExecutionOpen = false"
        />
        <LoadingUI />
      </div>

      <!-- 过场动画渲染层 -->
      <div v-if="gameStore.isTransitioning" ref="transitionRef" class="transition-overlay">
        <template v-if="gameStore.transitionParams.style === 'blinds'">
          <div 
            v-for="i in 20" 
            :key="i" 
            :ref="el => { if (el) slatRefs[i-1] = el as HTMLElement }"
            class="slat"
            :style="{ left: ((i-1) * 5) + '%' }"
          ></div>
        </template>
      </div>
      
      <!-- 调试面板 -->
      <DebugPanel 
        v-if="isDebugMode"
        v-model:portrait-scale="debugPortraitScale"
        v-model:portrait-bottom="debugPortraitBottom"
        v-model:view-scale="debugViewScale"
        v-model:middle-char-scale="debugMiddleCharScale"
      />
      
      <!-- Warden 缩放调试面板 -->
      <div v-if="isWardenDebugMode && gameStore.middleCharacter?.visible" class="warden-debug-panel" @click.stop @mousedown.stop>
        <div class="warden-debug-header">
          🧙 Warden 调试
        </div>
        <div class="warden-debug-content">
          <!-- 缩放 -->
          <div class="warden-item">
            <label>缩放 (Scale)</label>
            <div class="slider-row">
              <input 
                type="range" 
                v-model.number="debugMiddleCharScale" 
                min="0.5" 
                max="3" 
                step="0.05"
                class="warden-slider"
              />
              <input 
                type="number" 
                v-model.number="debugMiddleCharScale" 
                min="0.5" 
                max="3" 
                step="0.05"
                class="warden-input"
              />
            </div>
          </div>
          
          <!-- 上下位置 -->
          <div class="warden-item">
            <label>上下位置 (Bottom)</label>
            <div class="slider-row">
              <input 
                type="range" 
                v-model.number="debugMiddleCharBottom" 
                min="-500" 
                max="500" 
                step="10"
                class="warden-slider"
              />
              <input 
                type="number" 
                v-model.number="debugMiddleCharBottom" 
                min="-500" 
                max="500" 
                step="10"
                class="warden-input"
              />
            </div>
          </div>
          
          <div class="warden-value">
            Scale: {{ debugMiddleCharScale.toFixed(2) }} | Bottom: {{ debugMiddleCharBottom }}px
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-interface {
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
  /* 尺寸和缩放由 stageStyle 控制 */
  background-color: #1a1a1a;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
}

.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.bg-image.middle-layer {
  z-index: 5;
  transition: opacity 0.3s ease-out;
}

.middle-character {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform-origin: bottom center;
  z-index: 6;
  pointer-events: none;
}

.middle-character-composer {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform-origin: bottom center;
  z-index: 6;
  pointer-events: none;
}

.bg-perspective {
  width: 100%;
  height: 100%;
}

.overlay-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.choice-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: v-bind('UI_LAYERS.CHOICE_OVERLAY');
}

.choice-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.choices-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.ui-persistent-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: v-bind('UI_LAYERS.UI_PERSISTENT_CONTAINER');
}

.transition-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: v-bind('UI_LAYERS.TRANSITION');
  pointer-events: none;
  perspective: 2000px;
  overflow: hidden;
}

.slat {
  position: absolute;
  top: 0;
  width: 5.1%;
  height: 100%;
  background: black;
  transform-origin: center;
  backface-visibility: hidden;
  opacity: 0;
}

/* Warden 调试面板 */
.warden-debug-panel {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid #9b59b6;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  min-width: 240px;
  z-index: 9999;
  pointer-events: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.warden-debug-header {
  padding: 10px 15px;
  background: rgba(155, 89, 182, 0.3);
  border-radius: 7px 7px 0 0;
  font-weight: bold;
  color: #9b59b6;
}

.warden-debug-content {
  padding: 15px;
}

.warden-item {
  margin-bottom: 15px;
}

.warden-item:last-of-type {
  margin-bottom: 10px;
}

.warden-item label {
  display: block;
  margin-bottom: 6px;
  color: #aaa;
  font-size: 12px;
}

.warden-debug-panel .slider-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.warden-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #333;
  border-radius: 3px;
  outline: none;
}

.warden-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #9b59b6;
  border-radius: 50%;
  cursor: pointer;
}

.warden-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #9b59b6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.warden-input {
  width: 60px;
  padding: 5px 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  text-align: center;
}

.warden-input:focus {
  border-color: #9b59b6;
  outline: none;
}

.warden-value {
  margin-top: 10px;
  padding: 8px;
  background: #111;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 11px;
  color: #9b59b6;
  text-align: center;
}
</style>

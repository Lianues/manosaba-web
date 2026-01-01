<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import CharacterComposer from './CharacterComposer.vue'
import { resolveAppearance } from '../../logic/character-service'
import { resolveCharacterId } from '../../data/characters'
import type { ComposerState } from '../../types/character'

// 立绘预设参数 (与 NormalPrinter 保持一致)
const PORTRAIT_PRESETS = {
  normal: { scale: 1.6, bottom: -1010 },
  closeup: { scale: 2.25, bottom: -1980 }
}

// CharacterComposer 输出的容器尺寸
const COMPOSER_WIDTH = 1000
const COMPOSER_HEIGHT = 1440

// 默认视野放大
const DEFAULT_VIEW_SCALE = 1.0

// 接收调试参数
const props = withDefaults(defineProps<{
  debugScale?: number
  debugBottom?: number
  debugViewScale?: number
}>(), {
  debugScale: undefined,
  debugBottom: undefined,
  debugViewScale: undefined
})

const gameStore = useGameStore()

// 角色加载状态跟踪
const loadingCharacters = ref<Set<string>>(new Set())

// 视野放大后的容器样式
const viewContainerStyle = computed(() => {
  const viewScale = props.debugViewScale ?? DEFAULT_VIEW_SCALE
  if (viewScale === 1) return {}
  
  // 使用 transform scale 放大整个容器
  // 这样立绘之间的相对位置不会改变
  return {
    transform: `scale(${viewScale})`,
    transformOrigin: 'center bottom'
  }
})

// 解析角色状态：将 appearance 数组转换为 ComposerState
function parseCharacterState(characterId: string, appearance?: string[]): ComposerState | undefined {
  if (!appearance || appearance.length === 0) return undefined
  const state = resolveAppearance(characterId, appearance)
  return state
}

// 获取角色容器样式
function getCharacterStyle(char: any, portraitType: 'normal' | 'closeup' = 'normal') {
  const preset = PORTRAIT_PRESETS[portraitType]
  const position = char.position
  const posX = typeof position === 'number' ? position : parseInt(position as string) || 50
  const posY = char.posY ?? 0  // 纵向位置偏移，默认 0
  
  // 使用调试参数（如果提供），否则使用预设值
  const scale = props.debugScale ?? preset.scale
  const bottom = (props.debugBottom ?? preset.bottom) + (posY * 10)  // posY 每 1% 对应 10px
  
  return {
    width: `${COMPOSER_WIDTH}px`,
    height: `${COMPOSER_HEIGHT}px`,
    bottom: `${bottom}px`,
    left: `${posX}%`,
    transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: 'bottom center',
    zIndex: char.zIndex || 0
  }
}

// 内层不需要额外缩放
function getComposerWrapperStyle() {
  return {}
}

// 角色加载完成回调
function handleCharacterLoaded(charId: string) {
  loadingCharacters.value.delete(charId)
  // 通知 game store 角色加载完成
  gameStore.onCharacterLoaded(charId)
}

// 角色加载错误回调
function handleCharacterError(charId: string, error: string) {
  console.error(`[CharacterLayer] Failed to load ${charId}:`, error)
  loadingCharacters.value.delete(charId)
  // 即使加载失败也通知，避免卡死
  gameStore.onCharacterLoaded(charId)
}
</script>

<template>
  <div class="character-layer">
    <!-- 视野放大容器：放大后的区域，百分比定位基于此容器 -->
    <div class="view-container" :style="viewContainerStyle">
      <transition-group name="char-fade">
        <div 
          v-for="char in gameStore.activeCharacters" 
          :key="char.id"
          class="character-sprite"
          :style="getCharacterStyle(char)"
        >
          <!-- 内部容器：应用缩放 -->
          <div class="composer-wrapper" :style="getComposerWrapperStyle()">
            <CharacterComposer
              :character-id="resolveCharacterId(char.id)"
              :state="parseCharacterState(resolveCharacterId(char.id), char.appearance)"
              :width="COMPOSER_WIDTH"
              :height="COMPOSER_HEIGHT"
              :flip-x="char.flipX"
              @loaded="handleCharacterLoaded(char.id)"
              @error="(e) => handleCharacterError(char.id, e)"
            />
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style scoped>
.character-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 2;
}

.view-container {
  position: absolute;
  width: 100%;
  height: 100%;
  bottom: 0;
  left: 0;
}

.character-sprite {
  position: absolute;
  transition: left 0.5s ease-out, bottom 0.5s ease-out;
}

.composer-wrapper {
  width: 1000px;
  height: 1440px;
}

/* 角色进场退场动画 */
.char-fade-enter-from,
.char-fade-leave-to {
  opacity: 0;
}

.char-fade-enter-active,
.char-fade-leave-active {
  transition: opacity 0.5s ease;
}
</style>

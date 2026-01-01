<script setup lang="ts">
/**
 * 角色立绘拼接器组件
 * 使用 Canvas 渲染，支持混合模式和剪辑蒙版
 */
import { ref, watch, onMounted } from 'vue'
import type {
  CharacterConfig,
  ComposerState,
  FlattenedLayer,
  CharacterGameObject
} from '../../types/character'
import {
  parseCharacterConfig,
  getActiveLayers,
  calculateBounds,
  getLayerImageUrl
} from '../../logic/character-parser'
import type { LayerBounds } from '../../logic/character-parser'
import { CanvasBlender, calculateLayerRect } from '../../logic/canvas-blender'
import { getCharacter, isCharacterPreloaded } from '../../logic/character-service'

const props = withDefaults(defineProps<{
  characterId: string
  basePath?: string
  state?: ComposerState
  scale?: number
  position?: { x: number; y: number }
  flipX?: boolean
  tint?: string
  width?: number
  height?: number
}>(), {
  basePath: '/Characters',
  scale: 1,
  flipX: false,
  width: 800,
  height: 1200
})

// 事件
const emit = defineEmits<{
  (e: 'loaded'): void
  (e: 'error', error: string): void
}>()

// 角色配置缓存
const characterConfigCache = new Map<string, CharacterConfig>()

// 当前角色配置
const characterConfig = ref<CharacterConfig | null>(null)

// 加载状态
const loading = ref(true)
const error = ref<string | null>(null)

// 图片尺寸缓存
const imageSizes = ref<Map<string, { width: number; height: number }>>(new Map())

// 图片对象缓存
const imageCache = ref<Map<string, HTMLImageElement>>(new Map())

// Canvas 渲染结果
const canvasDataUrl = ref<string | null>(null)

// 边界框
const fixedBounds = ref<LayerBounds | null>(null)

// 加载角色配置
async function loadCharacterConfig() {
  const cacheKey = props.characterId
  
  // 检查是否已预加载（优先使用 character-service 的缓存）
  const preloadedConfig = getCharacter(props.characterId)
  if (preloadedConfig) {
    characterConfig.value = preloadedConfig
    await loadAllImageSizes()
    await renderCharacter()
    loading.value = false
    emit('loaded')
    return
  }
  
  // 检查组件内部缓存
  if (characterConfigCache.has(cacheKey)) {
    characterConfig.value = characterConfigCache.get(cacheKey)!
    await loadAllImageSizes()
    await renderCharacter()
    loading.value = false
    emit('loaded')
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const basePath = `${props.basePath}/${props.characterId}`
    const response = await fetch(`${basePath}/GameObject.json`)
    
    if (!response.ok) {
      throw new Error(`Failed to load character: ${props.characterId}`)
    }
    
    const gameObject: CharacterGameObject = await response.json()
    const config = parseCharacterConfig(
      props.characterId,
      props.characterId,
      basePath,
      gameObject
    )
    
    characterConfigCache.set(cacheKey, config)
    characterConfig.value = config
    
    await loadAllImageSizes()
    await renderCharacter()
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
    console.error('Failed to load character:', e)
    emit('error', error.value)
  } finally {
    loading.value = false
    emit('loaded')
  }
}

// 加载所有图层的图片
async function loadAllImageSizes() {
  if (!characterConfig.value) return
  if (fixedBounds.value) return
  
  const allLayers = characterConfig.value.layers
  const sizes = new Map<string, { width: number; height: number }>()
  
  const loadPromises = allLayers.map(layer => {
    if (sizes.has(layer.spriteName)) return Promise.resolve()
    
    return new Promise<void>((resolve) => {
      const url = getLayerImageUrl(characterConfig.value!.basePath, layer.spriteName)
      const img = new Image()
      img.onload = () => {
        sizes.set(layer.spriteName, { width: img.naturalWidth, height: img.naturalHeight })
        imageCache.value.set(layer.spriteName, img)
        resolve()
      }
      img.onerror = () => {
        sizes.set(layer.spriteName, { width: 100, height: 100 })
        resolve()
      }
      img.src = url
    })
  })
  
  await Promise.all(loadPromises)
  
  for (const [key, value] of sizes) {
    imageSizes.value.set(key, value)
  }
  
  if (allLayers.length > 0) {
    fixedBounds.value = calculateBounds(allLayers, imageSizes.value)
  }
}

// 使用 Canvas 渲染角色
async function renderCharacter() {
  if (!characterConfig.value || !fixedBounds.value) return
  
  const layers = getActiveLayers(characterConfig.value, props.state)
  if (layers.length === 0) {
    canvasDataUrl.value = null
    return
  }
  
  // 确保所有活跃图层的图片都已加载
  for (const layer of layers) {
    if (!imageCache.value.has(layer.spriteName)) {
      await new Promise<void>((resolve) => {
        const url = getLayerImageUrl(characterConfig.value!.basePath, layer.spriteName)
        const img = new Image()
        img.onload = () => {
          imageSizes.value.set(layer.spriteName, { width: img.naturalWidth, height: img.naturalHeight })
          imageCache.value.set(layer.spriteName, img)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = url
      })
    }
  }
  
  const canvasWidth = props.width
  const canvasHeight = props.height
  
  const blender = new CanvasBlender(canvasWidth, canvasHeight)
  blender.clear()
  
  // 按 sortingOrder 排序
  const sortedLayers = [...layers].sort((a, b) => a.sortingOrder - b.sortingOrder)
  
  for (const layer of sortedLayers) {
    const img = imageCache.value.get(layer.spriteName)
    if (!img) continue
    
    const size = imageSizes.value.get(layer.spriteName)
    if (!size) continue
    
    const rect = calculateLayerRect(
      layer,
      size,
      fixedBounds.value,
      { width: canvasWidth, height: canvasHeight }
    )
    
    blender.blendLayer(
      img,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      layer.blendMode,
      layer.color.a,
      layer.clippingMask
    )
  }
  
  canvasDataUrl.value = blender.toDataURL('image/png')
}

// 监听 state 变化
watch(() => props.state, async () => {
  if (characterConfig.value) {
    await renderCharacter()
  }
}, { deep: true })

// 监听 characterId 变化
watch(() => props.characterId, () => {
  fixedBounds.value = null
  loadCharacterConfig()
}, { immediate: true })

onMounted(() => {
  loadCharacterConfig()
})

// 容器样式
function getContainerStyle(): Record<string, string> {
  const style: Record<string, string> = {
    width: `${props.width}px`,
    height: `${props.height}px`,
    position: 'relative',
    overflow: 'hidden'
  }
  
  const transforms: string[] = []
  
  if (props.flipX) {
    transforms.push('scaleX(-1)')
  }
  
  if (props.scale !== 1) {
    transforms.push(`scale(${props.scale})`)
  }
  
  if (props.position) {
    transforms.push(`translate(${props.position.x}px, ${props.position.y}px)`)
  }
  
  if (transforms.length > 0) {
    style.transform = transforms.join(' ')
  }
  
  if (props.tint) {
    style.filter = 'brightness(0.7) sepia(1) hue-rotate(180deg) saturate(0.5)'
  }
  
  return style
}
</script>

<template>
  <div class="character-composer">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
    </div>
    
    <div v-else-if="error" class="error-state">
      <span>加载失败: {{ error }}</span>
    </div>
    
    <div v-else class="character-container" :style="getContainerStyle()">
      <img
        v-if="canvasDataUrl"
        :src="canvasDataUrl"
        alt="Character"
        class="character-image"
      />
    </div>
  </div>
</template>

<style scoped>
.character-composer {
  display: inline-block;
}

.character-container {
  transform-origin: center center;
}

.character-image {
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  object-fit: contain;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #ff6b6b;
  font-size: 14px;
}
</style>

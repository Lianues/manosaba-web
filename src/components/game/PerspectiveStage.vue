<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'

const emit = defineEmits(['back'])

const imageSrc = '/PerspectiveStage/Court/Background_014_001.png'
const standImgSrc = '/PerspectiveStage/Court/Court_Stand.png'
const emaImgSrc = '/Characters/Ema/Ema 正常立绘ver2.png'
const hiroImgSrc = '/Characters/Hiro/Hiro 正常立绘ver2.png'

const container = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)

// 设计稿基准尺寸
const DESIGN_WIDTH = 2560
const DESIGN_HEIGHT = 1440
// TODO:需要改为动态高度，而不是统一为4003，就像角色立绘那样
// Ema 立绘的标准基准高度
const TARGET_REF_HEIGHT = 4003

// === 基准参数（用于等比缩放计算）===
const BASE_REPEAT = 39
const BASE_DIST_TO_WALL = 15304

// === 角色序列定义 ===
const characterSequence: (string | null)[] = [emaImgSrc, hiroImgSrc]
const sequenceLength = characterSequence.length

// === 自动计算最优 repeat ===
function calcOptimalRepeat(seqLen: number, baseRepeat: number): number {
  const lower = Math.floor(baseRepeat / seqLen) * seqLen
  const upper = lower + seqLen
  return (baseRepeat - lower <= upper - baseRepeat) ? lower : upper
}

const optimalRepeat = calcOptimalRepeat(sequenceLength, BASE_REPEAT)
const scaledDistToWall = Math.round(BASE_DIST_TO_WALL * (optimalRepeat / BASE_REPEAT))

const slotAngle = 360 / optimalRepeat
const frontSlotIndex = Math.floor(optimalRepeat / 2)
const initialRotY = frontSlotIndex * slotAngle - 180

let state = reactive({
  fov: 30,
  cameraY: 0.0,
  pitch: 0,
  roll: -2,
  distToWall: scaledDistToWall,
  standDist: 452,
  emaY: 62,
  emaScale: 0.41,
  repeat: optimalRepeat,
  rotY: initialRotY,
  radius: 0,
  isAnimating: false,
  animSpeed: 0.01,
  isCollapsed: false,
  cssPerspective: 0
})

const img = new Image()
const standImg = new Image()
const emaImg = new Image()
const hiroImg = new Image()
let assetsLoaded = ref(0)

const onAssetLoad = () => {
  assetsLoaded.value++
  if (assetsLoaded.value === 4) render()
}

onMounted(() => {
  img.src = imageSrc
  standImg.src = standImgSrc
  emaImg.src = emaImgSrc
  hiroImg.src = hiroImgSrc
  img.onload = standImg.onload = emaImg.onload = hiroImg.onload = onAssetLoad
  animate()
  state.isAnimating = true
})

onUnmounted(() => {
  state.isAnimating = false
})

let animId: number

const animate = () => {
  if (state.isAnimating) {
    state.rotY += state.animSpeed
    updateView()
  }
  animId = requestAnimationFrame(animate)
}

function render() {
  if (!container.value || !img.complete || !standImg.complete || !emaImg.complete || !hiroImg.complete) return
  container.value.innerHTML = ''
  
  const h = DESIGN_HEIGHT
  const singleWidth = h * (img.width / img.height)
  const circumference = singleWidth * state.repeat
  state.radius = circumference / (2 * Math.PI)
  
  const sliceCount = Math.min(1000, 100 + state.repeat * 15)
  const sliceWidth = circumference / sliceCount
  const angleStep = 360 / sliceCount

  const frag = document.createDocumentFragment()

  for (let i = 0; i < sliceCount; i++) {
    const slice = document.createElement('div')
    slice.className = 'slice'
    slice.style.width = (sliceWidth + 1) + 'px'
    slice.style.height = h + 'px'
    slice.style.left = -(sliceWidth / 2) + 'px'
    slice.style.bottom = '0px' 
    
    const angle = (i + 0.5) * angleStep - (180 / state.repeat)
    slice.style.transform = `rotateY(${-angle}deg) translateZ(${state.radius.toFixed(2)}px) rotateY(180deg)`
    slice.style.backgroundImage = `url(${img.src})`
    slice.style.backgroundSize = `${singleWidth.toFixed(2)}px ${h}px`
    slice.style.backgroundPosition = `${-i * sliceWidth}px 0`
    frag.appendChild(slice)
  }

  const charImgMap: Map<string, HTMLImageElement> = new Map([
    [emaImgSrc, emaImg],
    [hiroImgSrc, hiroImg]
  ])
  
  const emaBaseScale = (h / img.height)
  const sequenceOffset = (sequenceLength - (frontSlotIndex % sequenceLength)) % sequenceLength
  const standZPos = state.radius - state.standDist
  const charZPos = standZPos + 1

  for (let j = 0; j < state.repeat; j++) {
    const angle = j * slotAngle
    const virtualSlotIndex = (j + sequenceOffset) % sequenceLength
    const charSrc = characterSequence[virtualSlotIndex]
    const charImg = charSrc ? charImgMap.get(charSrc) : null

    if (charImg) {
      const character = document.createElement('div')
      character.className = 'character'
      const normalizationFactor = TARGET_REF_HEIGHT / charImg.height
      const finalScale = emaBaseScale * state.emaScale * normalizationFactor
      const charWidth = charImg.width * finalScale
      const charHeight = charImg.height * finalScale

      character.style.width = charWidth + 'px'
      character.style.height = charHeight + 'px'
      character.style.left = -(charWidth / 2) + 'px'
      character.style.bottom = '0px'
      character.style.backgroundImage = `url("${charImg.src}")`
      character.style.backgroundSize = 'contain'
      character.style.backgroundRepeat = 'no-repeat'
      character.style.transform = `rotateY(${-angle}deg) translateZ(${charZPos.toFixed(2)}px) translateY(${-state.emaY}px) rotateY(180deg)`
      frag.appendChild(character)
    }
  }

  const standScale = (h / img.height) * 2
  const standWidth = standImg.width * standScale
  const standHeight = standImg.height * standScale

  for (let j = 0; j < state.repeat; j++) {
    const angle = j * slotAngle
    const stand = document.createElement('div')
    stand.className = 'stand'
    stand.style.width = standWidth + 'px'
    stand.style.height = standHeight + 'px'
    stand.style.left = -(standWidth / 2) + 'px'
    stand.style.bottom = '0px'
    stand.style.backgroundImage = `url(${standImg.src})`
    stand.style.backgroundSize = 'contain'
    stand.style.backgroundRepeat = 'no-repeat'
    stand.style.transform = `rotateY(${-angle}deg) translateZ(${standZPos.toFixed(2)}px) rotateY(180deg)`
    frag.appendChild(stand)
  }

  container.value.appendChild(frag)
  updateView()
}

function updateView() {
  if (!stage.value || !container.value) return
  const h = DESIGN_HEIGHT
  const fovRad = (state.fov * Math.PI) / 180
  state.cssPerspective = (h / 2) / Math.tan(fovRad / 2)
  stage.value.style.perspective = state.cssPerspective + 'px'

  const offsetZ = state.cssPerspective - (state.radius - state.distToWall)
  const unityYOffset = state.cameraY * (h / 10)
  const centerShift = h / 2

  container.value.style.transform = `
    rotateZ(${state.roll}deg)
    rotateX(${state.pitch}deg)
    translateY(${unityYOffset + centerShift}px) 
    translateZ(${offsetZ}px) 
    rotateY(${state.rotY}deg)
  `
}

watch(() => [state.fov, state.cameraY, state.pitch, state.roll, state.distToWall, state.rotY], updateView)
</script>

<template>
  <div class="perspective-stage">
    <div id="stage" ref="stage">
      <div id="container" ref="container"></div>
    </div>
  </div>
</template>

<style scoped>
.perspective-stage {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  overflow: hidden;
}

#stage {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

#container {
  position: relative;
  transform-style: preserve-3d;
}

:deep(.slice), :deep(.stand), :deep(.character) {
  position: absolute;
  backface-visibility: hidden;
  outline: 1px solid transparent;
  transform-origin: center bottom;
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UI_LAYERS } from '@/constants/ui-layers'

interface CGItem {
  id: number
  thumbnail: string
  isLocked: boolean
}

interface Props {
  show?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const currentPage = ref(1)
const itemsPerPage = 9

// 模拟已解锁数据
const allCGRegistry = ref<CGItem[]>(
  Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    thumbnail: `https://picsum.photos/seed/${i + 100}/600/338`,
    isLocked: false 
  }))
)

const unlockedCGs = computed(() => allCGRegistry.value.filter(cg => !cg.isLocked))

const totalPages = computed(() => {
  const count = Math.ceil(unlockedCGs.value.length / itemsPerPage)
  return count > 0 ? count : 1
})

const displaySlots = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return unlockedCGs.value.slice(start, start + itemsPerPage)
})

const handleClose = (e: Event) => {
  e.stopPropagation()
  emit('close')
}

const changePage = (delta: number) => {
  let newPage = currentPage.value + delta
  if (newPage < 1) newPage = totalPages.value
  else if (newPage > totalPages.value) newPage = 1
  currentPage.value = newPage
}

const selectedCG = ref<string | null>(null)
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="gallery-ui-container" @click.stop>
      <!-- 1. Background -->
      <img src="/UI_SaveLoad/SaveLoadBase.png" class="full-underlay" />

      <!-- 2. Header Title -->
      <div class="header-title">
        <div class="gallery-title-text">
          <span class="title-char-big">画</span>
          <span class="title-char-normal">廊</span>
        </div>
      </div>

      <!-- 3. Close Button -->
      <div class="close-button" @click.stop="handleClose">
        <div class="close-button-hitbox"></div>
      </div>

      <!-- 4. Grid Container (Under the Title) -->
      <div class="gallery-grid">
        <div 
          v-for="s in displaySlots" 
          :key="s.id" 
          class="gallery-slot"
          @click.stop="selectedCG = s.thumbnail"
        >
          <div class="image-container">
            <img :src="s.thumbnail" class="cg-img" />
          </div>
        </div>
      </div>

      <!-- 5. Pagination System -->
      <div class="pagination-system">
        <div class="arrow-btn left" @click.stop="changePage(-1)">
          <img src="/UI_Common/Arrow_Left.png" class="arrow-img animate-left" />
        </div>

        <div class="page-numbers">
          <div class="num current">{{ currentPage }}</div>
          <div class="slash">/</div>
          <div class="num total">{{ totalPages }}</div>
        </div>

        <div class="arrow-btn right" @click.stop="changePage(1)">
          <img src="/UI_Common/Arrow_Right.png" class="arrow-img animate-right" />
        </div>
      </div>

      <!-- 6. Fullscreen Viewer -->
      <Transition name="fade">
        <div v-if="selectedCG" class="cg-viewer" @click.stop="selectedCG = null">
          <img :src="selectedCG" class="full-img" />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.gallery-ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: v-bind('UI_LAYERS.GALLERY');
  overflow: hidden;
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
  display: flex;
  align-items: center;
  padding-left: 60px;
}

.gallery-title-text {
  font-family: 'SourceHanSerifSC', serif;
  color: #c9b6b1; /* 使用参考图中的暖灰色 */
  letter-spacing: 4px;
  display: flex;
  align-items: flex-start;
  line-height: 1;
}

.title-char-big {
  font-size: 120px; /* 调优思源宋体下的大字尺寸 */
  margin-right: 6px;
}

.title-char-normal {
  font-size: 82px; 
  margin-top: 8px; /* 适配思源宋体，确保上边界平齐 */
}

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

/* --- Optimized Grid (Size & Position) --- */
.gallery-grid {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1988px; /* 3 * 640 + 2 * 34 */
  display: grid;
  grid-template-columns: repeat(3, 640px);
  grid-template-rows: repeat(3, 360px);
  gap: 34px 34px; 
  transform: translate(-50%, -50%) translateY(30px); /* 向上提升以平衡空间 */
}

.gallery-slot {
  width: 640px;
  height: 360px; /* 16:9 比例 */
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: filter 0.2s;
  overflow: hidden;
}
.gallery-slot:hover { 
  filter: brightness(1.15); 
}

.image-container { width: 100%; height: 100%; }
.cg-img { width: 100%; height: 100%; object-fit: cover; }

/* --- Pagination (Synced with SaveLoadUI) --- */
.pagination-system {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.arrow-btn {
  position: absolute;
  top: 50%;
  width: 160px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  pointer-events: auto;
  transform: translateY(-50%) translateY(-18px);
}
.arrow-btn.left { left: 0; padding-left: 12px; }
.arrow-btn.right { right: 0; padding-right: 12px; }
.arrow-img { width: 110px; height: 142px; object-fit: contain; }

.page-numbers {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translateY(650px);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.num, .slash {
  font-family: 'SourceHanSerifSC', serif;
  font-size: 64px;
  color: white; /* 恢复为与 SaveLoadUI 一致的白色 */
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.num { width: 96px; }
.slash { width: 64px; }

/* --- Animations (Synced with SaveLoadUI) --- */
.animate-left { animation: arrow-bounce-left 2.5s infinite; }
.animate-right { animation: arrow-bounce-right 2.5s infinite; }

@keyframes arrow-bounce-left {
  0% { transform: translateX(0); }
  60% { transform: translateX(-2px); animation-timing-function: ease-out; }
  80% { transform: translateX(-30px); animation-timing-function: ease-in; }
  100% { transform: translateX(0); }
}

@keyframes arrow-bounce-right {
  0% { transform: translateX(0); }
  60% { transform: translateX(2px); animation-timing-function: ease-out; }
  80% { transform: translateX(30px); animation-timing-function: ease-in; }
  100% { transform: translateX(0); }
}

.cg-viewer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.full-img { max-width: 100%; max-height: 100%; object-fit: contain; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

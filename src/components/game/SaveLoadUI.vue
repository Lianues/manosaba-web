<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { UI_LAYERS } from '@/constants/ui-layers'
import { useGameStore, type SaveData } from '@/stores/game'
import html2canvas from 'html2canvas'

interface Props {
  show?: boolean
  mode: 'save' | 'load'
  isFromHome?: boolean  // 是否从首页打开（用于读档后跳转到游戏）
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'select', 'load-from-home'])

const gameStore = useGameStore()

const currentPage = ref(1)
const totalPages = ref(15)
const isSaving = ref(false)

const handleClose = (e: Event) => {
  e.stopPropagation()
  emit('close')
}

// 获取当前页的槽位数据
const slots = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const slotId = (currentPage.value - 1) * 12 + i + 1
    const saveData = gameStore.getSaveSlot(slotId)
    return {
      index: i,
      id: slotId,
      isEmpty: !saveData,
      data: saveData
    }
  })
})

// 截图当前游戏画面（不含UI）
async function captureScreenshot(): Promise<string> {
  try {
    // 查找游戏容器（包含整个游戏界面）
    const gameInterface = document.querySelector('.game-interface') as HTMLElement
    if (!gameInterface) {
      console.warn('Game interface not found')
      return ''
    }
    
    // 截图整个游戏界面，忽略 UI 元素
    const canvas = await html2canvas(gameInterface, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#000',
      ignoreElements: (el) => {
        // 忽略 UI 层、对话框等
        return el.classList.contains('ui-persistent-layer') ||
               el.classList.contains('choice-overlay') ||
               el.classList.contains('normal-printer') ||
               el.classList.contains('debate-printer') ||
               el.classList.contains('save-load-ui-container')
      }
    })
    
    // 缩放到目标尺寸 480x270（与 EmptySlot.png 一致）
    const scaledCanvas = document.createElement('canvas')
    scaledCanvas.width = 480
    scaledCanvas.height = 270
    const ctx = scaledCanvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, 480, 270)
    }
    
    return scaledCanvas.toDataURL('image/jpeg', 0.85)
  } catch (e) {
    console.error('Failed to capture screenshot:', e)
    return ''
  }
}

// 处理槽位点击
async function handleSlotClick(slot: typeof slots.value[0]) {
  if (isSaving.value) return
  
  if (props.mode === 'save') {
    // 存档模式
    if (!slot.isEmpty) {
      // 已有存档，确认覆盖
      if (!confirm(`槽位 ${slot.id} 已有存档，确定要覆盖吗？`)) {
        return
      }
    }
    
    isSaving.value = true
    
    // 临时关闭存档界面以截图
    const wasOpen = gameStore.isSaveLoadOpen
    gameStore.isSaveLoadOpen = false
    
    // 等待一帧让 UI 消失
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 截图
    const screenshot = await captureScreenshot()
    
    // 恢复存档界面
    gameStore.isSaveLoadOpen = wasOpen
    
    // 保存
    const success = await gameStore.saveGame(slot.id, screenshot)
    
    isSaving.value = false
    
    if (success) {
      // 可以显示一个保存成功的提示
      console.log('Save successful!')
    }
  } else {
    // 读档模式
    if (slot.isEmpty) {
      return // 空槽位不可点击
    }
    
    const success = await gameStore.loadGame(slot.id)
    
    if (success) {
      // 如果是从首页打开的，触发跳转到游戏
      if (props.isFromHome) {
        emit('load-from-home')
      } else {
        emit('close')
      }
    }
  }
}

// 删除存档
function handleDelete(e: Event, slotId: number) {
  e.stopPropagation()
  
  if (confirm(`确定要删除槽位 ${slotId} 的存档吗？`)) {
    gameStore.deleteSave(slotId)
  }
}

// 格式化时间显示
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const changePage = (delta: number) => {
  let newPage = currentPage.value + delta
  if (newPage < 1) {
    newPage = totalPages.value
  } else if (newPage > totalPages.value) {
    newPage = 1
  }
  currentPage.value = newPage
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="save-load-ui-container" @click.stop>
      <!-- 1. Underlay -->
      <img src="/UI_SaveLoad/SaveLoadBase.png" class="full-underlay" />

      <!-- 2. Header Title (426x254, Left-Top) -->
      <div class="header-title">
        <img 
          :src="mode === 'save' ? '/UI_SaveLoad/SaveTitle@ZhHans.png' : '/UI_SaveLoad/LoadTitle@ZhHans.png'" 
          class="title-img" 
        />
      </div>

      <!-- 3. Close Button (300x238, Right-Top) -->
      <div class="close-button" @click.stop="handleClose">
        <div class="close-button-hitbox"></div>
      </div>

      <!-- 4. Grid (Cell: 562x372, Spacing: -10, 10) -->
      <div class="save-grid">
        <div 
          v-for="s in slots" 
          :key="s.id" 
          class="save-slot-cell"
          :class="{ 'is-empty': s.isEmpty, 'is-disabled': mode === 'load' && s.isEmpty }"
          @click.stop="handleSlotClick(s)"
        >
          <!-- 视觉展示区（带裁剪） -->
          <div class="slot-visual">
            <div v-if="s.isEmpty" class="slot-content empty">
              <img src="/UI_SaveLoad/EmptySlot.png" class="empty-img" />
            </div>
            <div v-else class="slot-content data">
              <!-- 存档截图 -->
              <img 
                v-if="s.data?.screenshot" 
                :src="s.data.screenshot" 
                class="save-screenshot" 
              />
              <!-- 删除按钮 -->
              <div class="delete-button" @click.stop="handleDelete($event, s.id)">
                <img src="/UI_SaveLoad/DeleteButton_Default.png" />
              </div>
            </div>
            <!-- 框架层在上 -->
            <img src="/UI_SaveLoad/SaveLoadSlotFrame.png" class="slot-frame" />
          </div>

          <!-- 底部名称显示 -->
          <div class="slot-label">
            [{{ s.id }}] {{ s.isEmpty ? 'Empty' : (s.data?.name || 'Saved Data') }}
          </div>
        </div>
      </div>

      <!-- 5. Pagination Area -->
      <div class="pagination-system">
        <!-- Arrow Left -->
        <div 
          class="arrow-btn left" 
          @click.stop="changePage(-1)"
        >
          <img src="/UI_Common/Arrow_Left.png" class="arrow-img animate-left" />
        </div>

        <!-- Indicators Number -->
        <div class="page-numbers">
          <div class="num current">{{ currentPage }}</div>
          <div class="slash">/</div>
          <div class="num total">{{ totalPages }}</div>
        </div>

        <!-- Arrow Right -->
        <div 
          class="arrow-btn right" 
          @click.stop="changePage(1)"
        >
          <img src="/UI_Common/Arrow_Right.png" class="arrow-img animate-right" />
        </div>
      </div>
      
      <!-- 保存中遮罩 -->
      <div v-if="isSaving" class="saving-overlay">
        <div class="saving-text">保存中...</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.save-load-ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: v-bind('UI_LAYERS.SAVE_LOAD');
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
}

.title-img {
  width: 100%;
  height: 100%;
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
  transition: background-image 0.1s;
}

.close-button:hover {
  background-image: url('/UI_Common/CloseButton_Highlighted.png');
}

.close-button:active {
  background-image: url('/UI_Common/CloseButton_Pressed.png');
}

.close-button-hitbox {
  width: 100%;
  height: 100%;
}

.save-grid {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2218px;
  height: 1136px;
  transform: translate(-50%, -50%) translateY(-10px);
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 0;
}

.save-slot-cell {
  position: relative;
  width: 562px;
  height: 372px;
  cursor: pointer;
  margin-right: -10px;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.save-slot-cell:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}

.save-slot-cell.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.save-slot-cell.is-disabled:hover {
  transform: none;
  filter: none;
}

.save-slot-cell:nth-child(4n) {
  margin-right: 0;
}

.slot-visual {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}

.slot-frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.slot-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.slot-content.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
}

.slot-content.data {
  width: 480px;
  height: 270px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #1a1a1a;
}

.empty-img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: none;
}

.save-screenshot {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slot-label {
  position: absolute;
  bottom: -12px;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: 'TsukushiMincho', serif;
  font-size: 30px;
  color: #d1ced1;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  white-space: nowrap;
  pointer-events: none;
  line-height: 1;
}

.delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 60px;
  height: 60px;
  cursor: pointer;
  transition: transform 0.1s;
  z-index: 15;
}

.delete-button:hover {
  transform: scale(1.1);
}

.delete-button img {
  width: 100%;
  height: 100%;
}

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
  transition: transform 0.1s;
}

.arrow-btn:hover {
  transform: translateY(-50%) translateY(-18px) scale(1.1);
}

.arrow-btn.left { 
  left: 0; 
  padding-left: 12px;
}
.arrow-btn.right { 
  right: 0; 
  padding-right: 12px;
}

.arrow-img {
  width: 110px;
  height: 142px;
  object-fit: contain;
}

.animate-left {
  animation: arrow-bounce-left 2.5s infinite;
}

.animate-right {
  animation: arrow-bounce-right 2.5s infinite;
}

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

.arrow-btn.disabled {
  opacity: 0.2;
  pointer-events: none;
}

.page-numbers {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translateY(630px);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.num, .slash {
  font-family: 'TsukushiMincho', serif;
  font-size: 64px;
  color: white;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.num { width: 96px; height: 64px; }
.slash { width: 64px; height: 64px; }

.saving-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.saving-text {
  font-family: 'TsukushiMincho', serif;
  font-size: 48px;
  color: white;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

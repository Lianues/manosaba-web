<script setup lang="ts">
import { ref } from 'vue'
import { UI_LAYERS } from '@/constants/ui-layers'

interface Props {
  show?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const handleClose = (e: Event) => {
  e.stopPropagation()
  emit('close')
}

// 当前选中的标签页: 0-Message, 1-Graphics, 2-Audio
const activeTab = ref(0)

const settings = ref({
  // Message
  textSpeed: 50,
  autoSpeed: 50,
  fontSize: 24,
  opacity: 80,
  skipMode: 'all', // 'all' or 'read'
  
  // Graphics
  fullscreen: false,
  highQuality: true,
  resolution: '1920x1080',
  
  // Audio
  masterVolume: 80,
  bgmVolume: 70,
  seVolume: 90,
  voiceVolume: 100
})

const showResolutionDropdown = ref(false)
const resolutions = ['2560x1440', '1920x1080', '1600x900', '1280x720']

const activeSlider = ref<string | null>(null)
const sliderRefs = ref<Record<string, HTMLElement | null>>({})

const startDrag = (key: string, e: MouseEvent) => {
  activeSlider.value = key
  updateSlider(e)
  window.addEventListener('mousemove', updateSlider)
  window.addEventListener('mouseup', stopDrag)
}

const updateSlider = (e: MouseEvent) => {
  if (!activeSlider.value) return
  const rect = sliderRefs.value[activeSlider.value]?.getBoundingClientRect()
  if (rect) {
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percent = Math.round((x / rect.width) * 100)
    
    // Type-safe way to update settings
    const key = activeSlider.value as keyof typeof settings.value
    if (typeof settings.value[key] === 'number') {
      (settings.value[key] as number) = percent
    }
  }
}

const stopDrag = () => {
  activeSlider.value = null
  window.removeEventListener('mousemove', updateSlider)
  window.removeEventListener('mouseup', stopDrag)
}

const tabs = [
  { 
    id: 'message', 
    activeLabel: '/UI_Options/TabLabel_Message_Active@ZhHans.png', 
    inactiveLabel: '/UI_Options/TabLabel_Message_Inactive@ZhHans.png' 
  },
  { 
    id: 'graphics', 
    activeLabel: '/UI_Options/TabLabel_Graphics_Active@ZhHans.png', 
    inactiveLabel: '/UI_Options/TabLabel_Graphics_Inactive@ZhHans.png' 
  },
  { 
    id: 'audio', 
    activeLabel: '/UI_Options/TabLabel_Audio_Active@ZhHans.png', 
    inactiveLabel: '/UI_Options/TabLabel_Audio_Inactive@ZhHans.png' 
  }
]
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="options-ui-container" @click.stop>
      <!-- 1. Background -->
      <img src="/UI_Options/OptionsUnderlay.png" class="full-underlay" />

      <!-- 2. Header Title -->
      <div class="header-title">
        <img src="/UI_Options/OptionsTitle@ZhHans.png" class="title-img" />
      </div>

      <!-- 3. Close Button -->
      <div class="close-button" @click.stop="handleClose">
        <div class="close-button-hitbox"></div>
      </div>

      <!-- 4. Tabs Area (Vertical column on the right edge) -->
      <div class="tabs-column">
        <div 
          v-for="(tab, index) in tabs" 
          :key="index"
          class="tab-item"
          :class="{ active: activeTab === index }"
          @click="activeTab = index"
        >
          <img 
            :src="activeTab === index ? '/UI_Options/TabBase_Highlighted.png' : '/UI_Options/TabBase_Default.png'" 
            class="tab-bg" 
          />
          <img 
            :src="activeTab === index ? tab.activeLabel : tab.inactiveLabel" 
            class="tab-label-img" 
          />
        </div>
      </div>

      <!-- 5. Main Content Area -->
      <div class="options-content">
        <!-- Message Settings -->
        <div v-if="activeTab === 0" class="tab-panel">
          <div class="settings-group">
            <div class="group-header">
              <span class="group-title">文字显示</span>
              <img src="/UI_Options/SubjectUnderline.png" class="underline-img" />
            </div>
            
            <div class="setting-item-row">
              <img src="/UI_Options/Item_Highlighted.png" class="item-highlight-bg" />
              <span class="setting-label">文字速度</span>
              <div class="slider-container">
                <span class="slider-value">{{ settings.textSpeed }}</span>
                <div 
                  class="slider-base" 
                  :ref="el => sliderRefs['textSpeed'] = el as HTMLElement"
                  @mousedown="startDrag('textSpeed', $event)"
                >
                  <img src="/UI_Options/SliderBase.png" class="slider-bg" draggable="false" />
                  <div class="slider-fill" :style="{ width: settings.textSpeed + '%' }">
                    <img src="/UI_Options/SliderFiller_Default.png" class="fill-img" draggable="false" />
                  </div>
                  <div class="slider-handle" :style="{ left: settings.textSpeed + '%' }">
                    <img src="/UI_Options/Handle_Default.png" class="handle-img" draggable="false" />
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-item-row">
              <img src="/UI_Options/Item_Highlighted.png" class="item-highlight-bg" />
              <span class="setting-label">自动前进速度</span>
              <div class="slider-container">
                <span class="slider-value">{{ settings.autoSpeed }}</span>
                <div 
                  class="slider-base"
                  :ref="el => sliderRefs['autoSpeed'] = el as HTMLElement"
                  @mousedown="startDrag('autoSpeed', $event)"
                >
                  <img src="/UI_Options/SliderBase.png" class="slider-bg" draggable="false" />
                  <div class="slider-fill" :style="{ width: settings.autoSpeed + '%' }">
                    <img src="/UI_Options/SliderFiller_Default.png" class="fill-img" draggable="false" />
                  </div>
                  <div class="slider-handle" :style="{ left: settings.autoSpeed + '%' }">
                    <img src="/UI_Options/Handle_Default.png" class="handle-img" draggable="false" />
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-item-row">
              <img src="/UI_Options/Item_Highlighted.png" class="item-highlight-bg" />
              <span class="setting-label">文本跳过模式</span>
              <div class="multi-selector">
                <!-- 整体大边框 (800x68) -->
                <img src="/UI_Options/ToggleOutline.png" class="selector-outline-full" draggable="false" />
                
                <!-- 左侧：全部 (400x68) -->
                <div 
                  class="selector-item" 
                  :class="{ active: settings.skipMode === 'all' }"
                  @click="settings.skipMode = 'all'"
                >
                  <img 
                    src="/UI_Options/ToggleBody_Enabled.png" 
                    class="selector-body body-enabled" 
                    :style="{ opacity: settings.skipMode === 'all' ? 1 : 0 }"
                    draggable="false" 
                  />
                  <img 
                    src="/UI_Options/ToggleBody_Disabled.png" 
                    class="selector-body body-disabled" 
                    :style="{ opacity: settings.skipMode === 'all' ? 0 : 1 }"
                    draggable="false" 
                  />
                  <img 
                    src="/UI_Options/ToggleBody_Highlighted.png" 
                    class="selector-body body-highlight" 
                    style="opacity: 0"
                    draggable="false" 
                  />
                  <span class="selector-text">全部</span>
                </div>

                <!-- 右侧：仅已读 (400x68) -->
                <div 
                  class="selector-item" 
                  :class="{ active: settings.skipMode === 'read' }"
                  @click="settings.skipMode = 'read'"
                >
                  <img 
                    src="/UI_Options/ToggleBody_Enabled.png" 
                    class="selector-body body-enabled" 
                    :style="{ opacity: settings.skipMode === 'read' ? 1 : 0 }"
                    draggable="false" 
                  />
                  <img 
                    src="/UI_Options/ToggleBody_Disabled.png" 
                    class="selector-body body-disabled" 
                    :style="{ opacity: settings.skipMode === 'read' ? 0 : 1 }"
                    draggable="false" 
                  />
                  <img 
                    src="/UI_Options/ToggleBody_Highlighted.png" 
                    class="selector-body body-highlight" 
                    style="opacity: 0"
                    draggable="false" 
                  />
                  <span class="selector-text">仅已读</span>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <div class="group-header">
              <span class="group-title">对话框设置</span>
              <img src="/UI_Options/SubjectUnderline.png" class="underline-img" />
            </div>
            <div class="setting-item-row">
              <img src="/UI_Options/Item_Highlighted.png" class="item-highlight-bg" />
              <span class="setting-label">对话框透明度</span>
              <div class="slider-container">
                <span class="slider-value">{{ settings.opacity }}</span>
                <div 
                  class="slider-base"
                  :ref="el => sliderRefs['opacity'] = el as HTMLElement"
                  @mousedown="startDrag('opacity', $event)"
                >
                  <img src="/UI_Options/SliderBase.png" class="slider-bg" draggable="false" />
                  <div class="slider-fill" :style="{ width: settings.opacity + '%' }">
                    <img src="/UI_Options/SliderFiller_Default.png" class="fill-img" draggable="false" />
                  </div>
                  <div class="slider-handle" :style="{ left: settings.opacity + '%' }">
                    <img src="/UI_Options/Handle_Default.png" class="handle-img" draggable="false" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Graphics Settings -->
        <div v-if="activeTab === 1" class="tab-panel">
          <div class="settings-group">
            <div class="group-header">
              <span class="group-title">画面设置</span>
              <img src="/UI_Options/SubjectUnderline.png" class="underline-img" />
            </div>
            
            <div class="setting-item-row">
              <img src="/UI_Options/Item_Highlighted.png" class="item-highlight-bg" />
              <span class="setting-label">分辨率</span>
              <div class="dropdown-container">
                <div class="dropdown-current" @click="showResolutionDropdown = !showResolutionDropdown">
                  <span class="current-value">{{ settings.resolution }}</span>
                </div>
                <Transition name="fade">
                  <div v-if="showResolutionDropdown" class="dropdown-list">
                    <div 
                      v-for="(res, index) in resolutions" 
                      :key="res" 
                      class="dropdown-item"
                      @click="settings.resolution = res; showResolutionDropdown = false"
                    >
                      <img 
                        :src="settings.resolution === res ? '/UI_Options/DropDownItemBase_Enable.png' : '/UI_Options/DropDownItemBase_Disable.png'" 
                        class="item-bg-base" 
                        draggable="false"
                      />
                      <img 
                        src="/UI_Options/DropDownItemBase_Highlighted.png" 
                        class="item-bg-highlight" 
                        draggable="false"
                      />
                      <span class="item-text">{{ res }}</span>
                      
                      <!-- 分隔线 (最后一项不显示) -->
                      <img 
                        v-if="index < resolutions.length - 1"
                        src="/UI_Options/DropDownSeparator.png" 
                        class="item-separator" 
                        draggable="false"
                      />
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <!-- Audio Settings -->
        <div v-if="activeTab === 2" class="tab-panel">
          <div class="settings-group">
            <div class="group-header">
              <span class="group-title">音量设置</span>
              <img src="/UI_Options/SubjectUnderline.png" class="underline-img" />
            </div>

            <div v-for="(vol, key) in { masterVolume: '主音量', bgmVolume: '背景音乐', seVolume: '环境音效', voiceVolume: '语音音量' }" :key="key" class="setting-item-row">
              <img src="/UI_Options/Item_Highlighted.png" class="item-highlight-bg" />
              <span class="setting-label">{{ vol }}</span>
              <div class="slider-container">
                <span class="slider-value">{{ settings[key as keyof typeof settings] }}</span>
                <div 
                  class="slider-base"
                  :ref="el => sliderRefs[key] = el as HTMLElement"
                  @mousedown="startDrag(key as string, $event)"
                >
                  <img src="/UI_Options/SliderBase.png" class="slider-bg" draggable="false" />
                  <div class="slider-fill" :style="{ width: settings[key as keyof typeof settings] + '%' }">
                    <img src="/UI_Options/SliderFiller_Default.png" class="fill-img" draggable="false" />
                  </div>
                  <div class="slider-handle" :style="{ left: settings[key as keyof typeof settings] + '%' }">
                    <img src="/UI_Options/Handle_Default.png" class="handle-img" draggable="false" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.options-ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: v-bind('UI_LAYERS.OPTIONS');
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
  z-index: 100;
}
.close-button:hover { background-image: url('/UI_Common/CloseButton_Highlighted.png'); }
.close-button:active { background-image: url('/UI_Common/CloseButton_Pressed.png'); }
.close-button-hitbox { width: 100%; height: 100%; }

/* --- Tabs --- */
.tabs-column {
  position: absolute;
  right: 0;
  top: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 1000;
  pointer-events: auto;
}

.tab-item {
  position: relative;
  width: 440px;
  height: 120px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translateX(110px);
  transition: transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.tab-item.active {
  transform: translateX(0);
}

.tab-item:hover:not(.active) {
  transform: translateX(70px);
}

.tab-bg {
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.tab-label-img {
  position: relative;
  height: 55%;
  object-fit: contain;
  z-index: 1;
  margin-right: 60px;
}

/* --- Content --- */
.options-content {
  position: absolute;
  left: 200px;
  top: 300px;
  width: 1700px;
  height: 1000px;
  pointer-events: none;
}

.tab-panel {
  pointer-events: auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 60px;
  padding: 40px 100px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.group-header {
  position: relative;
  height: 80px;
  display: flex;
  align-items: center;
}

.group-title {
  font-family: 'SourceHanSerifSC', serif;
  font-size: 56px;
  color: #c9b6b1;
  margin-left: 20px;
  z-index: 1;
}

.underline-img {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 1000px;
  object-fit: contain;
}

.setting-item-row {
  position: relative;
  display: flex;
  align-items: center;
  height: 120px;
  padding-left: 60px;
}

.item-highlight-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 0;
}

.setting-item-row:hover .item-highlight-bg {
  opacity: 1;
}

.setting-label {
  position: relative;
  font-family: 'SourceHanSerifSC', serif;
  font-size: 48px;
  color: white;
  width: 400px;
  z-index: 1;
}

/* --- Slider --- */
.slider-container {
  position: relative;
  width: 800px;
  height: 60px;
  display: flex;
  align-items: center;
  z-index: 1;
  margin-left: auto;
  margin-right: 60px;
}

.slider-value {
  font-family: 'SourceHanSerifSC', serif;
  font-size: 32px;
  color: white;
  width: 80px;
  text-align: right;
  margin-right: 20px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.slider-base {
  position: relative;
  flex: 1;
  height: 40px;
}

.slider-bg {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  overflow: hidden;
}

.fill-img {
  height: 100%;
  width: 800px; /* 同步更新填充图的固定宽度 */
  object-fit: fill;
}

.slider-handle {
  position: absolute;
  top: 50%;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 2;
}

.handle-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

/* --- Toggle --- */
.toggle-container {
  position: relative;
  width: 180px;
  height: 80px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

/* --- Multi-Selector (Left-Right Toggle) --- */
.multi-selector {
  position: relative;
  width: 700px; /* 调整为 700px，与滑条实际长度对齐 (800 - value 80 - margin 20) */
  height: 60px;  /* 稍微缩小高度以保持比例 */
  display: flex;
  z-index: 1;
  margin-left: auto;
  margin-right: 60px;
}

.selector-outline-full {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 3; /* 边框在最上层，起到压边效果 */
  pointer-events: none;
}

.selector-item {
  position: relative;
  width: 50%; /* 左右各占一半 */
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.selector-body {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  object-fit: fill;
  transition: opacity 0.15s;
}

.selector-text {
  position: relative;
  z-index: 2;
  font-family: 'SourceHanSerifSC', serif;
  font-size: 28px;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  pointer-events: none;
}

.selector-item:hover .body-highlight {
  opacity: 1 !important;
}

.selector-item.active .selector-text {
  color: white;
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
}

.selector-item:not(.active) .selector-text {
  color: rgba(255,255,255,0.5);
}

.toggle-outline {
  position: absolute;
  width: 100%;
  height: 100%;
}

.toggle-body {
  position: absolute;
  width: 85%;
  height: 85%;
}

.checkmark {
  position: absolute;
  width: 60px;
  height: 60px;
}

/* --- Dropdown --- */
.dropdown-container {
  position: relative;
  width: 400px; /* 恢复宽度 400 */
  height: 68px;
  z-index: 2000;
  margin-left: auto;
  margin-right: 60px;
}

.dropdown-current {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center; /* 居中显示 */
  background-image: url('/UI_Options/DropDownEntry_Default.png');
  background-size: 100% 100%;
  transition: background-image 0.1s;
}

.dropdown-current:hover {
  background-image: url('/UI_Options/DropDownEntry_Highlighted.png');
}

.current-value {
  font-family: 'SourceHanSerifSC', serif;
  font-size: 28px;
  color: white;
  z-index: 1;
}

.dropdown-list {
  position: absolute;
  top: 72px;
  left: 0;
  width: 400px; /* 恢复宽度 400 */
  /* 使用 Outline 图片作为背景，如果项多于 3 个则纵向平铺或拉伸 */
  background-image: url('/UI_Options/DropDownOutline.png');
  background-size: 100% 100%; 
  display: flex;
  flex-direction: column;
  padding: 2px 0; /* 留出一点边框感 */
}

.dropdown-item {
  position: relative;
  width: 400px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center; /* 居中显示 */
  cursor: pointer;
}

.item-bg-base {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 0;
}

.item-bg-highlight {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.1s;
  pointer-events: none;
}

.dropdown-item:hover .item-bg-highlight {
  opacity: 1;
}

.item-text {
  position: relative;
  font-family: 'SourceHanSerifSC', serif;
  font-size: 26px;
  color: white;
  z-index: 2;
}

.item-separator {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 312px; /* 恢复分隔线宽度 */
  height: 4px;
  transform: translateX(-50%);
  object-fit: fill;
  z-index: 3;
  pointer-events: none;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

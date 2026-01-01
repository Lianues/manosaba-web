<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  show?: boolean
}>(), {
  show: true
})

// 立绘调试参数
const portraitScale = defineModel<number>('portraitScale', { default: 1.85 })
const portraitBottom = defineModel<number>('portraitBottom', { default: -1260 })
const viewScale = defineModel<number>('viewScale', { default: 1 })
const middleCharScale = defineModel<number>('middleCharScale', { default: 1.4 })

// 面板折叠状态
const isCollapsed = ref(false)

// 重置为默认值
function resetToDefaults() {
  portraitScale.value = 1.85
  portraitBottom.value = -1260
  viewScale.value = 1
  middleCharScale.value = 1.4
}

// 复制当前值到剪贴板
function copyValues() {
  const values = `scale: ${portraitScale.value}, bottom: ${portraitBottom.value}, viewScale: ${viewScale.value}, middleCharScale: ${middleCharScale.value}`
  navigator.clipboard.writeText(values)
  alert('已复制: ' + values)
}
</script>

<template>
  <div v-if="show" class="debug-panel" :class="{ collapsed: isCollapsed }" @click.stop @mousedown.stop>
    <!-- 标题栏 -->
    <div class="debug-header" @click="isCollapsed = !isCollapsed">
      <span class="debug-title">🔧 调试面板</span>
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
    </div>
    
    <!-- 内容区 -->
    <div v-show="!isCollapsed" class="debug-content">
      <!-- 立绘缩放 -->
      <div class="debug-item">
        <label>立绘缩放</label>
        <div class="slider-row">
          <input 
            type="range" 
            v-model.number="portraitScale" 
            min="0.5" 
            max="3" 
            step="0.05"
            class="debug-slider"
          />
          <input 
            type="number" 
            v-model.number="portraitScale" 
            min="0.5" 
            max="3" 
            step="0.05"
            class="debug-input"
          />
        </div>
      </div>
      
      <!-- 立绘高度 -->
      <div class="debug-item">
        <label>立绘高度 (bottom)</label>
        <div class="slider-row">
          <input 
            type="range" 
            v-model.number="portraitBottom" 
            min="-2500" 
            max="0" 
            step="10"
            class="debug-slider"
          />
          <input 
            type="number" 
            v-model.number="portraitBottom" 
            min="-2500" 
            max="0" 
            step="10"
            class="debug-input"
          />
        </div>
      </div>
      
      <!-- 视野放大 -->
      <div class="debug-item">
        <label>视野放大 (整体缩放)</label>
        <div class="slider-row">
          <input 
            type="range" 
            v-model.number="viewScale" 
            min="0.5" 
            max="3" 
            step="0.05"
            class="debug-slider"
          />
          <input 
            type="number" 
            v-model.number="viewScale" 
            min="0.5" 
            max="3" 
            step="0.05"
            class="debug-input"
          />
        </div>
      </div>
      
      <!-- 中间层角色缩放 -->
      <div class="debug-item">
        <label>中间层角色缩放 (如典狱长)</label>
        <div class="slider-row">
          <input 
            type="range" 
            v-model.number="middleCharScale" 
            min="0.5" 
            max="3" 
            step="0.05"
            class="debug-slider"
          />
          <input 
            type="number" 
            v-model.number="middleCharScale" 
            min="0.5" 
            max="3" 
            step="0.05"
            class="debug-input"
          />
        </div>
      </div>
      
      <!-- 按钮组 -->
      <div class="debug-buttons">
        <button @click="resetToDefaults" class="debug-btn">重置默认</button>
        <button @click="copyValues" class="debug-btn">复制参数</button>
      </div>
      
      <!-- 当前值显示 -->
      <div class="debug-values">
        <code>scale: {{ portraitScale }}, bottom: {{ portraitBottom }}, view: {{ viewScale }}, midChar: {{ middleCharScale }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid #4a9eff;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  min-width: 280px;
  z-index: 9999;
  pointer-events: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.debug-panel.collapsed {
  min-width: auto;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(74, 158, 255, 0.2);
  border-radius: 7px 7px 0 0;
  cursor: pointer;
  user-select: none;
}

.debug-panel.collapsed .debug-header {
  border-radius: 7px;
}

.debug-title {
  font-weight: bold;
  color: #4a9eff;
}

.collapse-icon {
  color: #888;
  font-size: 10px;
}

.debug-content {
  padding: 15px;
}

.debug-item {
  margin-bottom: 15px;
}

.debug-item label {
  display: block;
  margin-bottom: 6px;
  color: #aaa;
  font-size: 12px;
}

.slider-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.debug-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #333;
  border-radius: 3px;
  outline: none;
}

.debug-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4a9eff;
  border-radius: 50%;
  cursor: pointer;
}

.debug-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4a9eff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.debug-input {
  width: 70px;
  padding: 5px 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  text-align: center;
}

.debug-input:focus {
  border-color: #4a9eff;
  outline: none;
}

.debug-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.debug-btn {
  flex: 1;
  padding: 8px 12px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.debug-btn:hover {
  background: #444;
  border-color: #4a9eff;
}

.debug-values {
  padding: 8px;
  background: #111;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 11px;
  color: #7dd3fc;
  text-align: center;
}
</style>

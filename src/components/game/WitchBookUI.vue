<script setup lang="ts">
import { ref, computed, onMounted, onUpdated } from 'vue'
import { useGameStore } from '@/stores/game'
import { UI_LAYERS } from '@/constants/ui-layers'
import { mockClues, mockProfiles, type WitchBookItem, type ProfileItem } from '@/data/witch-book'

const gameStore = useGameStore()

type TabType = 'clues' | 'profiles' | 'maps' | 'rules' | 'notes'
const currentTab = ref<TabType>('clues')

const selectedItemIndex = ref(0)
const hoveredItemIndex = ref<number | null>(null)
const currentFloor = ref<'F1' | 'F2' | 'B1'>('F1')
const selectedMapNodeId = ref<string | null>(null)

// 关闭按钮的三态逻辑
const closeBtnState = ref<'default' | 'highlighted' | 'pressed'>('default')

// 自定义滚动条逻辑
const rulesScrollRef = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const thumbHeight = ref(0)

function updateScrollInfo(target?: HTMLElement) {
  const el = target || rulesScrollRef.value
  if (el) {
    const totalScrollable = el.scrollHeight - el.clientHeight
    scrollProgress.value = totalScrollable > 0 ? el.scrollTop / totalScrollable : 0
    thumbHeight.value = (el.clientHeight / el.scrollHeight) * el.clientHeight
  }
}

function handleScroll(e: Event) {
  updateScrollInfo(e.target as HTMLElement)
}

// 拖拽滚动条逻辑
let isDragging = false
let startY = 0
let startScrollTop = 0

function startDragging(e: MouseEvent) {
  if (!rulesScrollRef.value) return
  isDragging = true
  startY = e.clientY
  startScrollTop = rulesScrollRef.value.scrollTop
  
  window.addEventListener('mousemove', onDragging)
  window.addEventListener('mouseup', stopDragging)
  
  e.preventDefault() // 防止拖拽时选中文字
}

function onDragging(e: MouseEvent) {
  if (!isDragging || !rulesScrollRef.value) return
  const el = rulesScrollRef.value
  const deltaY = e.clientY - startY
  
  const thumbTravelDistance = el.clientHeight - thumbHeight.value
  const contentTravelDistance = el.scrollHeight - el.clientHeight
  
  if (thumbTravelDistance > 0) {
    const ratio = contentTravelDistance / thumbTravelDistance
    el.scrollTop = startScrollTop + deltaY * ratio
  }
}

function stopDragging() {
  isDragging = false
  window.removeEventListener('mousemove', onDragging)
  window.removeEventListener('mouseup', stopDragging)
}

// 切换标签或更新内容时重置滚动条
onUpdated(() => {
  updateScrollInfo()
})

const currentList = computed<(WitchBookItem | ProfileItem)[]>((() => {
  if (currentTab.value === 'clues') return mockClues
  if (currentTab.value === 'profiles') return mockProfiles
  if (currentTab.value === 'rules') {
    return [
      { id: 'r1', name: '基本原则', description: '', thumbnail: '' },
      { id: 'r2', name: '证据\n处理规范', description: '', thumbnail: '' },
      { id: 'r3', name: '审判程序', description: '', thumbnail: '' }
    ]
  }
  if (currentTab.value === 'notes') {
    return [
      { id: 'n1', name: '调查记录', description: '', thumbnail: '' },
      { id: 'n2', name: '待办事项', description: '', thumbnail: '' }
    ]
  }
  if (currentTab.value === 'maps') {
    return [
      { id: 'F1', name: 'F1', description: '', thumbnail: '' },
      { id: 'F2', name: 'F2', description: '', thumbnail: '' },
      { id: 'B1', name: '地下 1F', description: '', thumbnail: '' }
    ]
  }
  return []
}) as any)

const paddedList = computed(() => {
  const list = [...currentList.value]
  while (list.length < 10) {
    list.push(null as any)
  }
  return list
})

const isMultiLine = (text: string) => text.includes('\n') || text.length > 6

const selectedItem = computed(() => {
  return currentList.value[selectedItemIndex.value] || null
})

const presentBtnHover = ref(false)

function selectTab(tab: TabType) {
  currentTab.value = tab
  selectedItemIndex.value = 0
}

function close() {
  gameStore.isWitchBookOpen = false
}
</script>

<template>
  <div class="witch-book-ui panels-layer" v-if="gameStore.isWitchBookOpen" @click.stop>
    <div class="wrapper">
      <!-- Background -->
      <img 
        :src="currentTab === 'rules' ? '/UI_WitchBook_2/Background_2.png' : '/UI_WitchBook_1/Background_1.png'" 
        class="background-img"
      />

      <!-- Pages Container -->
      <div class="pages-container">
        <!-- Clues / Profiles Page -->
        <div v-if="(currentTab === 'clues' || currentTab === 'profiles') && selectedItem" class="page-content">
          <div class="left-area">
            <div class="photo-frame" :class="currentTab">
              <img :src="currentTab === 'clues' ? '/UI_WitchBook_1/EvidenceFrame.png' : '/UI_WitchBook_1/PersonFrame.png'" class="frame-base" />
              <div class="thumbnail-mask" :class="currentTab">
                <img :src="selectedItem.thumbnail" class="thumbnail" />
                <img v-if="currentTab === 'profiles'" src="/UI_WitchBook_1/PersonOverlay.png" class="person-overlay" />
              </div>

              <!-- Name Plate: Only for Profiles -->
              <div v-if="currentTab === 'profiles'" class="person-name-plate">
                <img src="/UI_Adv/NamePlateBase.png" class="plate-base" />
                <div class="author-label">
                  <template v-for="(char, index) in selectedItem.name.split('')" :key="index">
                    <span 
                      :class="{
                        'first-initial': index === 0,
                        'second-initial': index === 2,
                        'name-body': index !== 0 && index !== 2
                      }"
                    >{{ char }}</span>
                  </template>
                </div>
              </div>
            </div>
            <button 
              class="present-button" 
              :class="{ 'placeholder-mode': currentTab === 'profiles' }"
              @mouseenter="presentBtnHover = true"
              @mouseleave="presentBtnHover = false"
            >
              <img 
                :src="presentBtnHover ? '/UI_Common/ButtonBase_Highlighted.png' : '/UI_Common/ButtonBase_Default.png'" 
                class="btn-bg" 
              />
              <img src="/UI_WitchBook_1/PresentButtonBody@ZhHans.png" class="btn-label" />
            </button>
          </div>

          <div class="right-area">
            <!-- Subject Panel: Only for Clues -->
            <div v-if="currentTab === 'clues'" class="subject-panel">
              <img src="/UI_WitchBook_1/EvidenceNameBase.png" class="subject-base" />
              <div class="subject-label">
                <span class="first-char">{{ selectedItem.name[0] }}</span>
                <span class="rest-chars">{{ selectedItem.name.slice(1) }}</span>
              </div>
            </div>
            
            <!-- Profile Info: Removed categories as requested -->
            
            <div class="description-scroll custom-scrollbar" :class="{ 'with-info': currentTab === 'profiles' }">
              <p class="description-text">
                {{ selectedItem.description || '暂无描述' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Rules Page -->
        <div v-if="currentTab === 'rules'" class="page-content rules-container">
          <div class="rules-left">
            <div class="rules-title-area">
              <img src="/UI_WitchBook_2/Rule_TitleBack.png" class="rules-title-bg" />
              <div class="rules-main-title">规定</div>
              <div class="rules-num">I</div>
            </div>
            <div class="rules-subtitle">
              审判的基本原则
              <img src="/UI_WitchBook_2/Rule_SubtitleUnderline.png" class="rules-subtitle-line" />
            </div>
          </div>
          <div class="rules-right-container">
            <div class="rules-right scroll-area" ref="rulesScrollRef" @scroll="handleScroll">
              <div class="rules-body">
                <p>1. 所有证据必须经过审理确认其真实性。审判庭不接受任何未经核实的传闻作为正式供词。证据的提交必须在审理开始前完成，突发性证据需经由审判长许可后方可呈递。</p>
                <p>2. 被告人有权进行最后的辩解。在判决宣布之前，被告人拥有一次完整的陈述机会，用于反驳控方观点或补充关键细节。此过程受魔女之书的公正性监督，任何虚假陈述将被即时识别。</p>
                <p>3. 审判结果由魔女之书记录，不可更改。一旦刻印完成，因果律将自动修正，所有参与者必须服从裁决。申诉仅在发现足以推翻整个审判逻辑的悖论时方可提出。</p>
                <p>4. 证人保护条例：所有出庭证人的身份信息受魔法屏蔽保护，除非其自愿公开。任何试图通过诅咒或干扰手段影响证人证言的行为，都将受到审判庭的严厉惩罚。</p>
                <p>5. 现场搜证规范：搜证人员必须携带魔力感应器，记录现场残留的所有以太波动。物理证据与精神残留证据具有同等效力，需分类存放于密封容器中，防止魔力逸散。</p>
                <p>6. 陪审团职责：由七名中立魔女组成的陪审团负责对证据的逻辑链条进行投票。虽然最终裁决由审判长做出，但陪审团的一致性反对可以暂停审判程序进行重新调查。</p>
              </div>
            </div>
            <!-- 完全自定义的滚动条组件 -->
            <div class="custom-scrollbar-track" :style="{ backgroundColor: 'rgba(201, 182, 177, 0.15)' }">
              <div 
                class="custom-scrollbar-thumb" 
                @mousedown="startDragging"
                :style="{ 
                  height: thumbHeight + 'px', 
                  transform: `translateY(${(800 - thumbHeight) * scrollProgress}px)` 
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Notes Page -->
        <div v-if="currentTab === 'notes'" class="page-content notes-container">
          <div class="notes-left">
             <div class="notes-title">
               备忘录
               <img src="/UI_WitchBook_2/Note_TitleUnderline.png" class="notes-title-line" />
             </div>
          </div>
          <div class="rules-right-container">
            <div class="rules-right scroll-area" ref="rulesScrollRef" @scroll="handleScroll">
              <div class="notes-body">
                <p>目前的进度：调查已经进入了尾声。所有的线索都指向了那个被遗忘的实验室。</p>
                <p>需要注意的人：玛格丽特的行动有些可疑，她似乎在隐瞒什么重要的信息。</p>
                <p style="margin-top: 20px;">补充记录：实验室的封印看起来已经松动了。我们需要在月圆之夜前加固它。另外，关于那个金色的怀表，它的魔力波动与玛格丽特的魔力并不契合，这说明怀表可能另有主人。</p>
                <p style="margin-top: 20px;">待办事项：<br/>1. 检查审判庭的通风口。<br/>2. 重新核对昨晚的证词。<br/>3. 给多萝西写封信询问怀表的来源。</p>
              </div>
            </div>
            <!-- 自定义滚动条 -->
            <div class="custom-scrollbar-track" :style="{ backgroundColor: 'rgba(48, 36, 35, 0.15)' }">
              <div 
                class="custom-scrollbar-thumb" 
                @mousedown="startDragging"
                :style="{ 
                  height: thumbHeight + 'px', 
                  transform: `translateY(${(800 - thumbHeight) * scrollProgress}px)`,
                  backgroundColor: '#302423'
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Maps Page -->
        <div v-if="currentTab === 'maps'" class="page-content map-page">
           <div class="map-wrapper">
             <!-- 根据当前楼层显示不同布局 -->
             <img v-if="currentFloor === 'F1'" src="/UI_WitchBook_2/Layout_F1_1.png" class="map-layout" />
             <img v-if="currentFloor === 'F2'" src="/UI_WitchBook_2/Layout_F2_1.png" class="map-layout" />
             <img v-if="currentFloor === 'B1'" src="/UI_WitchBook_2/Layout_B1_1.png" class="map-layout" />
             
             <!-- 楼层节点 (仅在 F1 显示示例) -->
             <template v-if="currentFloor === 'F1'">
               <!-- 左侧导航箭头 -->
               <div class="map-nav-arrows">
                 <div class="nav-arrow-container" @mouseenter="selectedMapNodeId = 'F1-up'" @mouseleave="selectedMapNodeId = null">
                   <img v-if="selectedMapNodeId === 'F1-up'" src="/UI_WitchBook_2/ArrowFocus_Plain.png" class="arrow-focus plain" />
                   <img src="/UI_WitchBook_2/Arrow_TopLeft.png" class="nav-arrow top-left" />
                 </div>
                 <div class="nav-arrow-container" @mouseenter="selectedMapNodeId = 'F1-prev'" @mouseleave="selectedMapNodeId = null">
                   <img v-if="selectedMapNodeId === 'F1-prev'" src="/UI_WitchBook_2/ArrowFocus_Plain.png" class="arrow-focus plain" />
                   <img src="/UI_WitchBook_2/Arrow_Left.png" class="nav-arrow left-center" />
                 </div>
                 <div class="nav-arrow-container" @mouseenter="selectedMapNodeId = 'F1-down'" @mouseleave="selectedMapNodeId = null">
                   <img v-if="selectedMapNodeId === 'F1-down'" src="/UI_WitchBook_2/ArrowFocus_Plain.png" class="arrow-focus plain mirror-y" />
                   <img src="/UI_WitchBook_2/Arrow_TopLeft.png" class="nav-arrow bottom-left" />
                 </div>
               </div>
               <div class="map-node" @mouseenter="selectedMapNodeId = 'F1-lounge'" @mouseleave="selectedMapNodeId = null" style="left: 816px; top: 312px; width: 276px; height: 320px;">
                  <div v-if="selectedMapNodeId === 'F1-lounge'" class="node-highlight-mask"></div>
                  <img :src="`/UI_WitchBook_2/AreaLabelPlate_${Math.min(Math.max('休息室'.length - 1, 1), 5)}.png`" class="node-plate" />
                  <div class="node-label">休息室</div>
               </div>
               <div class="map-node" @mouseenter="selectedMapNodeId = 'F1-kitchen'" @mouseleave="selectedMapNodeId = null" style="left: 1181px; top: 211px; width: 148px; height: 54px;">
                  <div v-if="selectedMapNodeId === 'F1-kitchen'" class="node-highlight-mask"></div>
                  <img :src="`/UI_WitchBook_2/AreaLabelPlate_${Math.min(Math.max('厨房'.length - 1, 1), 5)}.png`" class="node-plate" />
                  <div class="node-label">厨房</div>
               </div>
               <div class="map-node" @mouseenter="selectedMapNodeId = 'F1-court'" @mouseleave="selectedMapNodeId = null" style="left: 1417px; top: 456px; width: 282px; height: 528px;">
                  <div v-if="selectedMapNodeId === 'F1-court'" class="node-highlight-mask"></div>
                  <img :src="`/UI_WitchBook_2/AreaLabelPlate_${Math.min(Math.max('审判庭'.length - 1, 1), 5)}.png`" class="node-plate" />
                  <div class="node-label">审判庭</div>
               </div>
             </template>
           </div>
        </div>
      </div>

      <!-- Bottom Item List -->
      <div class="item-list-area">
        <img src="/UI_WitchBook_1/ItemSlot.png" class="list-frame" />
        <div class="item-scroll-container">
          <div 
            v-for="(item, index) in paddedList" 
            :key="index"
            class="item-slot"
            :class="{ 
              active: item && (currentTab === 'maps' ? currentFloor === item.id : selectedItemIndex === index),
              disabled: !item,
              'no-bg': currentTab === 'clues' || currentTab === 'profiles'
            }"
            @click="item && (currentTab === 'maps' ? currentFloor = item.id as any : selectedItemIndex = index)"
            @mouseenter="item && (hoveredItemIndex = index)"
            @mouseleave="hoveredItemIndex = null"
          >
            <!-- 背景逻辑 -->
            <template v-if="item">
              <!-- Notes 使用 Common_1 -->
              <img v-if="currentTab === 'notes'" src="/UI_WitchBook_1/ItemButton_Common_1.png" class="slot-bg" />
              
              <!-- Rules & Maps 使用 Common_2/3 -->
              <img v-if="currentTab === 'rules' || currentTab === 'maps'" 
                :src="isMultiLine(item.name) 
                  ? '/UI_WitchBook_1/ItemButton_Common_3.png' 
                  : '/UI_WitchBook_1/ItemButton_Common_2.png'" 
                class="slot-bg" 
              />
              
              <!-- 内容渲染 -->
              <img v-if="currentTab === 'clues' || currentTab === 'profiles'" :src="item.thumbnail" class="item-icon" />
              <div v-else class="slot-text" :class="{ 'multi-line': isMultiLine(item.name) }">
                {{ item.name }}
              </div>
            </template>
            
            <!-- 空槽位背景 -->
            <img v-else-if="currentTab !== 'clues' && currentTab !== 'profiles'" src="/UI_WitchBook_1/ItemButton_Common_1.png" class="slot-bg opacity-30" />
          </div>
        </div>
      </div>

      <!-- Tabs Sidebar -->
      <div class="tabs-sidebar">
        <div 
          v-for="tab in ([
            { id: 'clues', label: 'Clue' },
            { id: 'profiles', label: 'Profile' },
            { id: 'maps', label: 'Map' },
            { id: 'rules', label: 'Rule' },
            { id: 'notes', label: 'Note' }
          ] as { id: TabType, label: string }[])" 
          :key="tab.id"
          class="tab-item"
          :class="{ active: currentTab === tab.id }"
          @click="selectTab(tab.id)"
        >
          <img 
            :src="currentTab === tab.id ? `/UI_WitchBook_1/TabBase_Highlighted.png` : `/UI_WitchBook_1/TabBase_Default.png`" 
            class="tab-base"
          />
          <img 
            :src="currentTab === tab.id 
              ? `/UI_WitchBook_1/TabLabel_${tab.label}_Active@ZhHans.png`
              : `/UI_WitchBook_1/TabLabel_${tab.label}_Inactive@ZhHans.png`"
            class="tab-label"
          />
        </div>
      </div>

      <!-- Title & Close -->
      <img src="/UI_WitchBook_1/BookTitle@ZhHans.png" class="title-img" />
      <button 
        class="close-btn" 
        @click="close"
        @mouseenter="closeBtnState = 'highlighted'"
        @mouseleave="closeBtnState = 'default'"
        @mousedown="closeBtnState = 'pressed'"
        @mouseup="closeBtnState = 'highlighted'"
      >
        <img :src="`/UI_Common/CloseButton_${
          closeBtnState === 'pressed' ? 'Pressed' : 
          (closeBtnState === 'highlighted' ? 'Highlighted' : 'Default')
        }.png`" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.witch-book-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: v-bind('UI_LAYERS.WITCH_BOOK');
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: auto; /* 恢复点击响应 */
  font-family: 'SourceHanSerifSC', serif;
  font-weight: bold;
}

.wrapper {
  position: relative;
  width: 2560px;
  height: 1440px;
  overflow: hidden; /* 关键：截断超出边缘的页签 */
}

.background-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 2560px;
  height: 1440px;
  pointer-events: none;
}

.pages-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 2560px;
  height: 1440px;
}

.page-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Clues / Profiles Styles */
.left-area {
  position: absolute;
  left: 150px;
  top: 100px;
  width: 1000px;
  height: 940px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-frame {
  position: relative;
  width: 814px;
  height: 857px;
}

.photo-frame.profiles {
  transform: scale(1.2) translateY(60px);
}

.frame-base {
  width: 100%;
  height: 100%;
}

.thumbnail-mask {
  position: absolute;
  top: 200px;
  left: 157px;
  width: 500px;
  height: 500px;
  overflow: hidden;
  border-radius: 20px;
}

.thumbnail-mask.profiles {
  top: 140px;
  left: 120px;
  width: 570px;
  height: 600px;
  border-radius: 10px;
}

.person-name-plate {
  position: absolute;
  left: -20px;
  bottom: 50px;
  width: 540px; /* 稍微缩小一点以适应容器 */
  height: 260px;
  z-index: 5;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.plate-base {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.person-name-plate .author-label {
  position: relative;
  left: 70px;
  top: -12px;
  display: flex;
  align-items: baseline;
  color: #ffffff;
  text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.9);
  font-weight: bold;
}

.person-name-plate .first-initial { font-size: 112px; line-height: 1; }
.person-name-plate .second-initial { font-size: 102px; line-height: 1; margin-left: 2px; }
.person-name-plate .name-body { font-size: 62px; line-height: 1; margin-left: 2px; }

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.present-button {
  margin-top: -60px;
  position: relative;
  width: 505px;
  height: 120px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  z-index: 10;
}

.present-button.placeholder-mode {
  margin-top: -60px;
  transform: translateX(315px);
}

.btn-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.btn-label {
  position: relative;
  height: 160px; /* 200px原始高度在120px背景上会溢出，缩小到160px保持张力 */
  z-index: 1;
  pointer-events: none;
}

.right-area {
  position: absolute;
  left: 1350px;
  top: 100px;
  width: 862px;
  height: 900px;
}

.subject-panel {
  position: relative;
  width: 862px;
  height: 196px;
}

.subject-base {
  width: 663px;
  height: 100%;
}

.subject-label {
  position: absolute;
  left: 50px;
  top: 45px;
  color: #282220;
  display: flex;
  align-items: baseline;
  font-weight: bold;
}

.first-char {
  font-size: 84px;
  font-weight: bold;
  margin-right: 4px;
  line-height: 1;
}

.rest-chars {
  font-size: 56px;
  line-height: 1;
}

.profile-info.profile-mode {
  margin-top: 50px; /* 因为去掉了名字面板，适当下移信息区域 */
  margin-left: 20px;
}

.description-scroll {
  margin-top: 40px;
  width: 794px;
  height: 600px;
  overflow-y: auto;
  padding-right: 20px;
}

.description-scroll.with-info {
  height: 400px;
  margin-top: 20px;
}

.profile-info {
  margin-top: 20px;
  margin-left: 50px;
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
}

.info-row {
  font-size: 32px;
  color: #5a4a48;
}

.info-row .label {
  color: #8a7a78;
}

.description-text {
  font-size: 36px;
  line-height: 1.6;
  color: #302423;
  white-space: pre-wrap;
  font-weight: bold;
}

/* Rules & Notes Styles */
.rules-container, .notes-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.rules-left, .notes-left {
  position: absolute;
  left: 150px;
  top: 100px;
  width: 1000px;
  height: 940px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.rules-title-area {
  position: relative;
  width: 708px;
  height: 304px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.rules-title-bg {
  position: absolute;
  width: 100%;
  top: 20px; /* 下移 20 像素 */
}

.rules-main-title {
  position: absolute;
  top: -60px; /* 进一步上移 */
  font-size: 100px; /* 增大字号 */
  color: #c9b6b1;
}

.rules-num {
  position: relative;
  top: 40px; /* 居中于背景圆心 */
  font-size: 120px;
  color: #291919;
}

.rules-subtitle {
  margin-top: 50px;
  font-size: 84px; /* 从 70px 增大 */
  color: #c9b6b1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.notes-title {
  margin-top: 50px;
  font-size: 84px; /* 从 70px 增大 */
  color: #302423;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rules-subtitle-line, .notes-title-line {
  margin-top: 10px;
  width: 400px;
}

.rules-right-container {
  position: absolute;
  left: 1350px;
  top: 150px;
  width: 862px;
  height: 800px;
}

.rules-right.scroll-area {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-right: 80px; /* 继续增加间距 */
  box-sizing: border-box; /* 确保 padding 不会撑开宽度导致重叠 */
  /* 隐藏所有浏览器原生滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.rules-right.scroll-area::-webkit-scrollbar {
  display: none;
}

.custom-scrollbar-track {
  position: absolute;
  right: 10px; /* 贴近边缘，拉开与文字的距离 */
  top: 0;
  width: 4px;
  height: 100%;
  background: rgba(48, 36, 35, 0.15);
  pointer-events: auto; /* 允许交互 */
}

.custom-scrollbar-thumb {
  width: 100%;
  background: #c9b6b1;
  border-radius: 0;
  transition: transform 0.05s linear;
  cursor: pointer; /* 鼠标悬停显示手型 */
  pointer-events: auto;
}

.rules-body {
  font-size: 40px;
  line-height: 2;
  color: #c9b6b1;
  font-weight: bold;
}

.notes-body {
  font-size: 40px;
  line-height: 2;
  color: #302423;
  font-weight: bold;
}

/* Map Styles */
.map-page {
  height: 1028px; /* 1440 - 412 (底部条目栏高度) */
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 120px; /* 增加 50 像素上边距 */
  box-sizing: border-box;
}

.map-wrapper {
  position: relative;
  width: 1631px;
  height: 932px;
}

.map-layout {
  width: 100%;
  height: 100%;
}

.map-node {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden; /* 确保遮罩不超出布局边界 */
}

.node-highlight-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(98, 37, 45);
  opacity: 0.5; /* 半透明遮罩 */
  pointer-events: none;
  z-index: 0;
  /* 四角和边界阴影效果 */
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(98, 37, 45, 0.6);
}

.node-plate {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.node-label {
  position: relative;
  top: -7px; /* 向上偏移 */
  color: #d8d2d0; /* 稍微调暗一点的米灰色 */
  font-size: 42px;
  font-weight: bold;
  z-index: 1;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6); /* 增加阴影以匹配截图质感 */
}

/* Map Navigation Arrows */
.map-nav-arrows {
  position: absolute;
  left: -200px;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 180px; /* 箭头之间的纵向间距 */
  pointer-events: none;
}

.nav-arrow {
  position: relative;
  z-index: 2;
}

.nav-arrow-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  pointer-events: auto;
}

.arrow-focus {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.mirror-y {
  transform: translate(-50%, -50%) scaleY(-1);
}

.nav-arrow.bottom-left {
  transform: scaleY(-1); /* 上下镜像 */
}

/* Item List Styles */
.item-list-area {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 2560px;
  height: 412px;
  z-index: 105;
  pointer-events: none;
}

.list-frame {
  width: 2560px;
  height: 412px;
  position: absolute;
  top: 0;
  left: 0;
}

.item-scroll-container {
  position: absolute;
  bottom: 96px; 
  left: 90px;
  right: 90px;
  height: 162px;
  display: flex;
  justify-content: flex-start; /* 恢复靠左对齐 */
  align-items: center;
  gap: 13px;
  overflow-x: auto;
  pointer-events: auto;
  scrollbar-width: none; /* Firefox */
}

.item-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.item-slot, .floor-slot {
  position: relative;
  flex: 0 0 227px;
  width: 227px;
  height: 162px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s;
}

.item-slot.disabled {
  cursor: default;
  opacity: 0.5;
}

.slot-bg, .slot-highlight, .slot-hover {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% + 7px)); /* 居中并下移 5px */
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保持比例居中 */
  pointer-events: none;
}

.slot-highlight {
  z-index: 2;
}

.slot-hover {
  z-index: 1;
}

.floor-label, .slot-text {
  position: relative;
  font-size: 40px;
  color: #c9b6b1;
  text-align: center;
  white-space: pre-line;
  line-height: 1; /* 统一行高以辅助垂直居中 */
  z-index: 5;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floor-label.multi-line, .slot-text.multi-line {
  font-size: 32px;
}

.opacity-30 {
  opacity: 0.3;
}

.item-slot.active {
  transform: scale(1.1);
}

.item-icon {
  position: relative;
  width: 220px;
  height: 150px;
  object-fit: contain;
  z-index: 1;
}

/* Sidebar Tabs */
.tabs-sidebar {
  position: absolute;
  right: 0px; /* 贴齐边缘，靠子项的位移来实现隐藏 */
  top: 264px;
  width: 357px;
  display: flex;
  flex-direction: column;
  gap: -10px;
  pointer-events: none;
}

.tab-item {
  position: relative;
  width: 357px;
  height: 144px;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  /* 默认（非激活）状态：向右偏移 84px，由于父级 overflow:hidden，这部分会被截断 */
  transform: translateX(84px); 
}

.tab-item.active {
  /* 激活状态：回到 0，显示完整页签 */
  transform: translateX(0px);
}

.tab-item:hover:not(.active) {
  /* 悬停非激活页签：稍微向左滑出一点作为反馈 */
  transform: translateX(40px) scale(1.02);
}

.tab-item.active:hover {
  transform: scale(1.05);
}

.tab-base {
  width: 100%;
  height: 100%;
}

.tab-label {
  position: absolute;
  left: 75px;
  top: 50%;
  transform: translateY(-50%);
  height: 60px;
}

/* Title & Close */
.title-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 427px;
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 110;
  padding: 0;
}

.close-btn img {
  width: 300px; /* 根据 JSON sizeDelta: 300x238 设定 */
  height: 238px;
  display: block;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(201, 182, 177, 0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c9b6b1;
}
.custom-scrollbar::-webkit-scrollbar-button {
  display: none;
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #c9b6b1 transparent;
}
</style>

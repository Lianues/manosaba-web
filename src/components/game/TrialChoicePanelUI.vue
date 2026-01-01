<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { UI_LAYERS } from '@/constants/ui-layers'

const gameStore = useGameStore()

// 模拟数据，实际应从 store 或 props 获取
const character = computed(() => gameStore.trialChoiceData?.character || 'Ema')
const choices = computed(() => gameStore.trialChoiceData?.choices || [])

const hoveredIndex = ref<number | null>(null)

function getTagSprite(type?: string): string | undefined {
  if (!type) return undefined
  switch (type) {
    case 'Approval': return '/UI_Trial/Objection/Agreement@ZhHans.png'
    case 'Objection': return '/UI_Trial/Objection/Objection@ZhHans.png'
    case 'Perjury': return '/UI_Trial/Objection/Perjury@ZhHans.png'
    case 'Question': return '/UI_Trial/Objection/Doubt@ZhHans.png'
    case 'MagicEma': return '/UI_Trial/Objection/Magic_Pink@ZhHans.png'
    case 'MagicAnAn': return '/UI_Trial/Objection/Magic_Yellow@ZhHans.png'
    case 'MagicLeia': return '/UI_Trial/Objection/Magic_Blue@ZhHans.png'
    case 'MagicCoco': return '/UI_Trial/Objection/Magic_Purple@ZhHans.png'
    case 'MagicMargo': return '/UI_Trial/Objection/Magic_Orange@ZhHans.png'
    case 'MagicNanoka': return '/UI_Trial/Objection/Magic_Gray@ZhHans.png'
    default: return undefined
  }
}

function getButtonBg(type: string | undefined, isHovered: boolean) {
  if (isHovered) {
    return '/UI_Trial/Objection/Balloon_Selected.png'
  }
  if (type === 'Cancel') {
    return '/UI_Trial/Objection/Balloon_Cancel.png'
  }
  return '/UI_Trial/Objection/Balloon_Default.png'
}

function selectChoice(choice: any) {
  console.log('Selected choice:', choice.text)
  if (choice.targetScene) {
    gameStore.goToScene(choice.targetScene)
  }
  gameStore.isTrialChoiceOpen = false
}

const portraitSrc = computed(() => `/UI_Trial/Objection/ChoicePortrait_${character.value}.png`)
</script>

<template>
  <div class="trial-choice-panel-ui panels-layer" v-if="gameStore.isTrialChoiceOpen" @click.stop>
    <!-- Underlay -->
    <div class="underlay"></div>

    <div class="wrapper">
      <!-- Base Background -->
      <img src="/UI_Trial/Objection/TrialChoiceBase.png" class="base-bg" />

      <!-- Portrait -->
      <img :src="portraitSrc" class="choice-portrait" />

      <!-- Choices Content -->
      <div class="content">
        <div 
          v-for="(choice, index) in choices" 
          :key="index"
          class="choice-button"
          :class="{ 'is-cancel': choice.type === 'Cancel' }"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
          @click="selectChoice(choice)"
        >
          <!-- Button Background -->
          <img 
            :src="getButtonBg(choice.type, hoveredIndex === index)" 
            class="button-bg"
          />

          <!-- Tag -->
          <img 
            v-if="choice.type && choice.type !== 'Cancel'"
            :src="getTagSprite(choice.type)" 
            class="choice-tag"
          />

          <!-- Label -->
          <div class="choice-label" :style="{ color: hoveredIndex === index ? '#ffdbd1' : '#29221f' }">
            {{ choice.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trial-choice-panel-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: v-bind('UI_LAYERS.TRIAL_CHOICE');
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  font-family: 'SourceHanSerifSC', serif;
}

.underlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.wrapper {
  position: relative;
  width: 2560px;
  height: 1440px;
}

.base-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 2560px;
  height: 1440px;
  pointer-events: none;
}

.choice-portrait {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 1440px;
  width: auto;
  pointer-events: none;
}

.content {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(calc(-50% + 275px), calc(-50% + 66.8px));
  width: 899px;
  display: flex;
  flex-direction: column;
  gap: 80px;
  align-items: flex-end;
}

.choice-button {
  position: relative;
  width: 1099px;
  height: 318px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.1s ease-out;
}

.choice-button.is-cancel {
  width: 767px;
  height: 229px;
}

.choice-button:hover {
  /* Removed scale effect */
  z-index: 10;
}

.button-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.choice-tag {
  position: absolute;
  left: 40.5px;
  bottom: 193px; /* Unity anchors bottom-left? Based on prefab calculation */
  width: 199px;
  height: 166px;
  z-index: 2;
}

.choice-label {
  position: relative;
  top: -8px;
  left: 9.92px;
  font-size: 42px;
  font-weight: bold;
  text-align: center;
  max-width: 900px;
  z-index: 3;
  pointer-events: none;
  letter-spacing: 0.1em;
}
</style>

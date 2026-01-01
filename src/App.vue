<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Home from './components/home/Home.vue'
import GameInterface from './components/game/GameInterface.vue'
import { useGameStore } from './stores/game'

const currentView = ref('home')
const gameStore = useGameStore()

// 是否从存档加载（而不是新游戏）
const isLoadedFromSave = ref(false)

// 禁用右键、选择和复制
const preventDefaults = (e: Event) => {
  e.preventDefault()
}

onMounted(() => {
  document.addEventListener('contextmenu', preventDefaults)
  document.addEventListener('selectstart', preventDefaults)
  document.addEventListener('copy', preventDefaults)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', preventDefaults)
  document.removeEventListener('selectstart', preventDefaults)
  document.removeEventListener('copy', preventDefaults)
})

const startGame = (fromSave: boolean = false) => {
  isLoadedFromSave.value = fromSave
  currentView.value = 'game'
}

const backToHome = () => {
  // 停止 BGM
  gameStore.stopBgm()
  gameStore.stopVoice()
  currentView.value = 'home'
}
</script>

<template>
  <main>
    <Home v-if="currentView === 'home'" @start-game="startGame(false)" @start-from-save="startGame(true)" />
    <GameInterface v-else-if="currentView === 'game'" :skip-init="isLoadedFromSave" @back-to-home="backToHome" />
  </main>
</template>

<style>
@font-face {
  font-family: 'TsukushiMincho';
  src: url('/fonts/TsukushiMincho.otf') format('opentype');
}

@font-face {
  font-family: 'SourceHanSerifSC';
  src: url('/fonts/SourceHanSerifSC.otf') format('opentype');
}

body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  /* 禁用文本选择 */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  /* 禁用右键菜单（可选，通常配合禁用选择使用） */
  -webkit-touch-callout: none;
}

#app {
  width: 100%;
  height: 100%;
}
</style>

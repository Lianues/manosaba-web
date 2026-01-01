import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import gsap from 'gsap'
import type { GameScript, ScriptLine, GameScene, CharacterState, ScriptChoice, ScriptTrialChoice, TrialChoiceType, DebateSceneConfig, ScriptLabel } from '../types/script'
import { TraditionalEngine } from '../logic/engines/traditional'
import { TrialEngine } from '../logic/engines/trial'
import { extractCharacterIdsFromScene, preloadCharacters } from '../logic/character-service'
import { resolveCharacterId } from '../data/characters'

// 初始场景路径
const INITIAL_SCENE_PATH = 'Act01_Chapter01/Act01_Chapter01_Adv01'

// 存档数据结构
export interface SaveData {
  id: number
  name: string
  timestamp: number
  screenshot: string  // Base64 图片
  scenePath: string   // 场景文件路径 (用于动态加载)
  sceneId: string
  lineIndex: number
  backgroundPath: string
  middleBackgroundPath: string
  backgroundStyle: {
    posX: number
    posY: number
    scale: number
    rotX: number
    rotY: number
    rotZ: number
    blur: number
  }
  middleBackgroundStyle: {
    posX: number
    posY: number
    scale: number
    rotX: number
    rotY: number
    rotZ: number
    opacity: number
    blur: number
  }
  overlayOpacity: number
  overlayColor: string
  currentBgm: string
  activeCharacters: Record<string, CharacterState>
  middleCharacter: {
    id: string
    variant: string
    appearance?: string[]
    scale: number
    posX: number
    posY: number
    subId: string
    visible: boolean
  } | null
  variables: Record<string, any>
}

const SAVE_STORAGE_KEY = 'witch_trial_saves'
const MAX_SAVE_SLOTS = 180  // 15页 x 12槽

// 场景缓存
const sceneCache: Record<string, GameScene> = {}

// BGM 路径映射表
// 格式: 简写ID -> 完整文件名
const BGM_MAP: Record<string, string> = {
  // Ambient
  'Ambi_1_1': 'Ambient/Ambient_001_001 Natural bird.ogg',
  'Ambi_2_1': 'Ambient/Ambient_002_001 Shower.ogg',
  'Ambi_3_1': 'Ambient/Ambient_003_001 Chakumero.ogg',
  'Ambi_4_1': 'Ambient/Ambient_004_001 Fire house.ogg',
  'Ambi_5_1': 'Ambient/Ambient_005_001 Operating elevator.ogg',
  'Ambi_6_1': 'Ambient/Ambient_006_001 Flare up.ogg',
  'Ambi_7_1': 'Ambient/Ambient_007_001 Earthquake.ogg',
  'Ambi_8_1': 'Ambient/Ambient_008_001 Hard rain.ogg',
  'Ambi_10_1': 'Ambient/Ambient_010_001 Chain fall out.ogg',
  'Ambi_11_1': 'Ambient/Ambient_011_001 Laughing girls.ogg',
  'Ambi_101_1': 'Ambient/Ambient_101_001 white-noise-48000sr.ogg',
  'Ambi_102_1': 'Ambient/Ambient_102_001 SFX_FireBig_L.ogg',
  // Common BGM (Loop)
  'Bgm_1_1': 'Common/Bgm_001_001_Loop.ogg',
  'Bgm_2_1': 'Common/Bgm_002_001_Loop.ogg',
  'Bgm_3_1': 'Common/Bgm_003_001_Loop.ogg',
  'Bgm_4_1': 'Common/Bgm_004_001_Loop.ogg',
  'Bgm_5_1': 'Common/Bgm_005_001_Loop.ogg',
  'Bgm_6_1': 'Common/Bgm_006_001_Loop.ogg',
  'Bgm_7_1': 'Common/Bgm_007_001_Loop.ogg',
  'Bgm_8_1': 'Common/Bgm_008_001_Loop.ogg',
  'Bgm_8_2': 'Common/Bgm_008_002_Loop.ogg',
  'Bgm_9_1': 'Common/Bgm_009_001_Loop.ogg',
  'Bgm_10_1': 'Common/Bgm_010_001_Loop.ogg',
  'Bgm_11_1': 'Common/Bgm_011_001_Loop.ogg',
  'Bgm_12_1': 'Common/Bgm_012_001_Loop.ogg',
  'Bgm_13_1': 'Common/Bgm_013_001_Loop.ogg',
  'Bgm_14_1': 'Common/Bgm_014_001_Loop.ogg',
  'Bgm_15_1': 'Common/Bgm_015_001_Loop.ogg',
  'Bgm_15_2': 'Common/Bgm_015_002_Loop.ogg',
  'Bgm_16_1': 'Common/Bgm_016_001_Loop.ogg',
  'Bgm_17_1': 'Common/Bgm_017_001_Loop.ogg',
  'Bgm_18_1': 'Common/Bgm_018_001_Loop.ogg',
  'Bgm_19_1': 'Common/Bgm_019_001_Loop.ogg',
  'Bgm_20_1': 'Common/Bgm_020_001_Loop.ogg',
  'Bgm_21_1': 'Common/Bgm_021_001_Loop.ogg',
  'Bgm_22_1': 'Common/Bgm_022_001_Loop.ogg',
  'Bgm_23_1': 'Common/Bgm_023_001_Loop.ogg',
  'Bgm_24_1': 'Common/Bgm_024_001_Loop.ogg',
  'Bgm_25_1': 'Common/Bgm_025_001_Loop.ogg',
  'Bgm_26_1': 'Common/Bgm_026_001_Loop.ogg',
  'Bgm_26_2': 'Common/Bgm_026_002_Loop.ogg',
  'Bgm_27_1': 'Common/Bgm_027_001_Loop.ogg',
  'Bgm_27_2': 'Common/Bgm_027_002_Loop.ogg',
  'Bgm_27_3': 'Common/Bgm_027_003_Loop.ogg',
  'Bgm_28_1': 'Common/Bgm_028_001_Loop.ogg',
  'Bgm_29_1': 'Common/Bgm_029_001_Loop.ogg',
  'Bgm_30_1': 'Common/Bgm_030_001_Loop.ogg',
  'Bgm_31_1': 'Common/Bgm_031_001_Loop.ogg',
  'Bgm_32_1': 'Common/Bgm_032_001_Loop.ogg',
  'Bgm_33_1': 'Common/Bgm_033_001_Loop.ogg',
  'Bgm_34_1': 'Common/Bgm_034_001_Loop.ogg',
  'Bgm_34_2': 'Common/Bgm_034_002_Loop.ogg',
  'Bgm_35_1': 'Common/Bgm_035_001_Loop.ogg',
  'Bgm_36_1': 'Common/Bgm_036_001_Loop.ogg',
  'Bgm_37_1': 'Common/Bgm_037_001_Loop.ogg',
  'Bgm_37_2': 'Common/Bgm_037_002_Loop.ogg',
  'Bgm_38_1': 'Common/Bgm_038_001_Loop.ogg',
  'Bgm_38_2': 'Common/Bgm_038_002_Loop.ogg',
  'Bgm_39_1': 'Common/Bgm_039_001_Loop.ogg',
  'Bgm_39_2': 'Common/Bgm_039_002_Loop.ogg',
  'Bgm_40_1': 'Common/Bgm_040_001_Loop.ogg',
  'Bgm_41_1': 'Common/Bgm_041_001_Loop.ogg',
  'Bgm_42_1': 'Common/Bgm_042_001_Loop.ogg',
  'Bgm_42_2': 'Common/Bgm_042_002_Loop.ogg',
  'Bgm_43_1': 'Common/Bgm_043_001_Loop.ogg',
  'Bgm_43_2': 'Common/Bgm_043_002_Loop.ogg',
  'Bgm_44_1': 'Common/Bgm_044_001_Loop.ogg',
  'Bgm_45_1': 'Common/Bgm_045_001_Loop.ogg',
  'Bgm_45_2': 'Common/Bgm_045_002_Loop.ogg',
  'Bgm_46_1': 'Common/Bgm_046_001_Loop.ogg',
  'Bgm_48_1': 'Common/Bgm_048_001_Loop.ogg',
  'Bgm_49_1': 'Common/Bgm_049_001_Loop.ogg',
  'Bgm_49_2': 'Common/Bgm_049_002_Loop.ogg',
  // Songs
  'Song_1_1': 'Songs/Song_001_001.ogg',
  'Song_2_1': 'Songs/Song_002_001.ogg',
  'Song_3_1': 'Songs/Song_003_001.ogg',
  'Song_4_1': 'Songs/Song_004_001.ogg',
}

// 解析 BGM 路径：支持简写和完整路径
function resolveBgmPath(pathOrId: string): string {
  // 如果已经是完整路径（以 / 开头或包含扩展名），直接返回
  if (pathOrId.startsWith('/') || pathOrId.includes('.ogg') || pathOrId.includes('.mp3')) {
    return pathOrId
  }
  
  // 尝试从映射表查找
  const mapped = BGM_MAP[pathOrId]
  if (mapped) {
    return `/Audio/BGM/${mapped}`
  }
  
  // 如果没找到，尝试自动解析格式： Ambi_11_1 -> Ambient/Ambient_011_001
  const match = pathOrId.match(/^(Ambi|Bgm|Song)_(\d+)_(\d+)$/)
  if (match) {
    const prefix = match[1]
    const num1 = match[2]
    const num2 = match[3]
    
    if (prefix && num1 && num2) {
      const paddedNum1 = num1.padStart(3, '0')
      const paddedNum2 = num2.padStart(3, '0')
      
      if (prefix === 'Ambi') {
        return `/Audio/BGM/Ambient/Ambient_${paddedNum1}_${paddedNum2}*.ogg`
      } else if (prefix === 'Bgm') {
        return `/Audio/BGM/Common/Bgm_${paddedNum1}_${paddedNum2}_Loop.ogg`
      } else if (prefix === 'Song') {
        return `/Audio/BGM/Songs/Song_${paddedNum1}_${paddedNum2}.ogg`
      }
    }
  }
  
  console.warn('Unknown BGM path:', pathOrId)
  return pathOrId
}

// 动态加载场景 JSON
async function loadScene(scenePath: string): Promise<GameScene | null> {
  // 检查缓存
  if (sceneCache[scenePath]) {
    return sceneCache[scenePath]
  }
  
  try {
    const response = await fetch(`/Story/${scenePath}.json`)
    if (!response.ok) {
      console.error(`Failed to load scene: ${scenePath}`, response.status)
      return null
    }
    const scene = await response.json() as GameScene
    sceneCache[scenePath] = scene
    
    // 自动预加载场景中的角色
    const characterIds = extractCharacterIdsFromScene(scene)
    if (characterIds.length > 0) {
      // 解析角色 ID 并预加载（异步，不阻塞场景加载）
      const resolvedIds = characterIds.map(id => resolveCharacterId(id))
      console.log(`[Game] Preloading characters for scene ${scenePath}:`, resolvedIds)
      preloadCharacters(resolvedIds).catch(e => {
        console.warn('Character preload error:', e)
      })
    }
    
    return scene
  } catch (error) {
    console.error(`Error loading scene: ${scenePath}`, error)
    return null
  }
}

export const useGameStore = defineStore('game', () => {
  const currentScript = ref<GameScript>({ title: '魔女审判', scenes: [] })
  const currentSceneId = ref('')
  const currentIndex = ref(0)
  const isSceneLoading = ref(false)
  
  // 当前场景的文件路径（用于存档）
  const currentScenePath = ref('')
  
  // 存档列表
  const saveSlots = ref<Record<number, SaveData>>({})
  
  const currentScene = computed<GameScene | null>(() => {
    return currentScript.value.scenes.find(s => s.id === currentSceneId.value) || null
  })

  const currentEngine = computed(() => {
    if (currentScene.value?.type === 'trial') return TrialEngine
    return TraditionalEngine
  })

  const currentLine = computed<ScriptLine | null>(() => {
    if (currentScene.value && currentIndex.value >= 0 && currentIndex.value < currentScene.value.lines.length) {
      return currentScene.value.lines[currentIndex.value] || null
    }
    return null
  })

  // 文字状态（用于 NormalPrinter 和 DebatePrinter）
  const textState = ref<{
    speaker: string
    text: string
    portraitPath?: string
    portraitType?: 'normal' | 'closeup'
    portraitPositionX?: number
    portraitSide?: 'left' | 'right'
  }>({
    speaker: '',
    text: ''
  })

  const isTransitioning = ref(false)
  const transitionParams = ref({ style: 'fade-black', duration: 1000 })

  const isLoading = ref(false)
  const loadingProgress = ref(0)

  const activeCharacters = ref<Record<string, CharacterState>>({})
  const history = ref<Array<{ speaker: string, text: string, voice?: string }>>([])
  
  // 用于控制立绘层级的计数器，初始值设为 100，后续递减以确保“先出现的在上面”
  const nextZIndex = ref(100)

  const isWitchBookOpen = ref(false)
  const isTrialChoiceOpen = ref(false)
  const isChoiceOpen = ref(false)
  const choiceData = ref<ScriptChoice['choices']>([])
  const trialChoiceData = ref<{
    character: 'Ema' | 'Hiro'
    choices: Array<{
      text: string
      targetScene: string
      type?: TrialChoiceType
    }>
  }>({
    character: 'Ema',
    choices: []
  })
  
  // Debate 场景配置（从 Scene 级别获取）
  const debateConfig = ref<DebateSceneConfig>({})

  const isLogOpen = ref(false)
  const isSaveLoadOpen = ref(false)
  const isOptionsOpen = ref(false)
  const isGalleryOpen = ref(false)
  const isExecutionOpen = ref(false)
  const executionTargetScene = ref('')
  const isUIHidden = ref(false)
  const saveLoadMode = ref<'save' | 'load'>('save')
  
  // Printer 外观模式 (default | stream)
  const printerAppearance = ref<'default' | 'stream'>('default')
  
  // 背景系统（支持多层）
  const backgroundType = ref<'image' | 'perspective'>('image')
  const backgroundPath = ref('')  // 主背景层
  const middleBackgroundPath = ref('')  // 中间层（如 Stills、MainBackground-Middle）
  const backgroundStyle = ref<{
    posX: number
    posY: number
    scale: number
    rotX: number
    rotY: number
    rotZ: number
    blur: number
  }>({
    posX: 50,
    posY: 50,
    scale: 1,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    blur: 0
  })
  
  // 中间层背景样式（独立于主背景）
  const middleBackgroundStyle = ref<{
    posX: number
    posY: number
    scale: number
    rotX: number
    rotY: number
    rotZ: number
    opacity: number
    blur: number
  }>({
    posX: 50,
    posY: 50,
    scale: 1,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    opacity: 1,
    blur: 0
  })
  
  // 中间层角色（如典狱长，使用单张完整立绘或组合立绘）
  const middleCharacter = ref<{
    id: string
    variant: string
    appearance?: string[]
    scale: number
    posX: number
    posY: number
    subId: string
    visible: boolean
  } | null>(null)
  
  // 遮罩层系统 (用于 Fade from Black 等效果)
  // 初始化为全黑，等待第一个场景淡入
  const overlayOpacity = ref(1)
  const overlayColor = ref('#000000')
  
  // 立绘系统（当前显示的立绘状态）
  const currentPortrait = ref<{
    visible: boolean
    path: string
    position: number
  }>({
    visible: false,
    path: '',
    position: 50
  })

  // BGM 系统
  const currentBgm = ref('')
  const bgmVolume = ref(0.5)
  const bgmAudio = ref<HTMLAudioElement | null>(null)

  function playBgm(path: string, volume?: number) {
    // 如果已经在播放同一首BGM，不重复播放
    if (currentBgm.value === path && bgmAudio.value) return
    
    // 停止当前 BGM
    stopBgm()
    
    // 创建新的 Audio 对象
    const audio = new Audio(path)
    audio.loop = true
    audio.volume = volume ?? bgmVolume.value
    audio.play().catch(e => console.warn('BGM 播放失败:', e))
    
    bgmAudio.value = audio
    currentBgm.value = path
    if (volume !== undefined) bgmVolume.value = volume
  }

  function stopBgm() {
    if (bgmAudio.value) {
      bgmAudio.value.pause()
      bgmAudio.value.currentTime = 0
      bgmAudio.value = null
    }
    currentBgm.value = ''
  }

  function setBgmVolume(volume: number) {
    bgmVolume.value = volume
    if (bgmAudio.value) {
      bgmAudio.value.volume = volume
    }
  }

  // 语音系统
  const voiceVolume = ref(0.8)
  const voiceAudio = ref<HTMLAudioElement | null>(null)
  const isVoicePlaying = ref(false)
  const isAutoMode = ref(false)
  
  // SFX 音效系统
  const sfxVolume = ref(0.7)
  
  // 角色加载等待系统
  const pendingCharacterLoads = ref<Map<string, () => void>>(new Map())
  
  // 角色加载完成回调
  function onCharacterLoaded(charId: string) {
    const callback = pendingCharacterLoads.value.get(charId)
    if (callback) {
      pendingCharacterLoads.value.delete(charId)
      callback()
    }
  }
  
  // 等待角色加载完成
  function waitForCharacterLoad(charId: string): Promise<void> {
    return new Promise((resolve) => {
      // 设置超时，避免永久等待
      const timeout = setTimeout(() => {
        pendingCharacterLoads.value.delete(charId)
        resolve()
      }, 5000) // 5秒超时
      
      pendingCharacterLoads.value.set(charId, () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }
  
  function playSfx(path: string) {
    const audio = new Audio(path)
    audio.volume = sfxVolume.value
    audio.play().catch(e => console.warn('SFX 播放失败:', e))
  }
  
  function setSfxVolume(volume: number) {
    sfxVolume.value = volume
  }

  function playVoice(path: string, options?: { onEnd?: () => void }) {
    // 停止当前语音
    stopVoice()
    
    const audio = new Audio(path)
    audio.volume = voiceVolume.value
    
    audio.onended = () => {
      isVoicePlaying.value = false
      voiceAudio.value = null
      options?.onEnd?.()
    }
    
    audio.onerror = () => {
      console.warn('语音播放失败:', path)
      isVoicePlaying.value = false
      voiceAudio.value = null
    }
    
    audio.play().catch(e => {
      console.warn('语音播放失败:', e)
      isVoicePlaying.value = false
    })
    
    voiceAudio.value = audio
    isVoicePlaying.value = true
  }

  function stopVoice() {
    if (voiceAudio.value) {
      voiceAudio.value.pause()
      voiceAudio.value.currentTime = 0
      voiceAudio.value = null
    }
    isVoicePlaying.value = false
  }

  function setVoiceVolume(volume: number) {
    voiceVolume.value = volume
    if (voiceAudio.value) {
      voiceAudio.value.volume = volume
    }
  }

  function setAutoMode(enabled: boolean) {
    isAutoMode.value = enabled
    // 如果在文本行开启了 Auto，且当前没有语音在播放，则立即启动当前行的自动推进计时
    if (enabled && currentLine.value?.type === 'text' && !isVoicePlaying.value) {
      startAutoTimer(currentLine.value)
    }
  }

  function startAutoTimer(line: any) {
    if (!isAutoMode.value || !currentScene.value) return
    const scene = currentScene.value

    if (scene.type === 'debate' && line.autoNext && line.autoNext > 0) {
      // 处理 debate 场景的自动推进 (autoNext)
      setTimeout(() => {
        if (currentLine.value === line && isAutoMode.value) {
          nextLine()
        }
      }, line.autoNext)
    } else {
      // Auto 模式：根据文字长度动态计算等待时间
      const textLength = line.text.length
      // 基础时间 1.5秒 + 每个字 50毫秒，最少 2秒，最多 8秒
      const baseTime = 1500
      const perCharTime = 50
      const waitTime = Math.min(8000, Math.max(2000, baseTime + textLength * perCharTime))
      
      setTimeout(() => {
        if (currentLine.value === line && isAutoMode.value) {
          nextLine()
        }
      }, waitTime)
    }
  }

  const variables = ref<Record<string, any>>({})

  function processCurrentLine() {
    const line = currentLine.value
    const scene = currentScene.value
    if (!line || !scene) return

    // 处理 text 类型：根据 Scene 类型决定显示方式
    if (line.type === 'text') {
      const debateCfg = scene.debateConfig || {}
      
      // 如果 line 没有指定立绘，使用当前活动的立绘
      const portraitPath = line.portraitPath || (currentPortrait.value.visible ? currentPortrait.value.path : undefined) || debateCfg.portraitPath
      const portraitPositionX = line.portraitPositionX ?? (currentPortrait.value.visible ? currentPortrait.value.position : 50)
      
      textState.value = {
        speaker: line.speaker || '',
        text: line.text,
        portraitPath: portraitPath,
        portraitType: line.portraitType || 'normal',
        portraitPositionX: portraitPositionX,
        portraitSide: line.portraitSide || debateCfg.portraitSide || 'left'
      }

      // Add to history
      history.value.push({
        speaker: line.speaker || '',
        text: line.text,
        voice: line.voice
      })
      if (history.value.length > 300) history.value.shift()

      // 只有当角色已经在场上时，才更新其 pose/appearance
      // 立绘的显示/隐藏应该通过 char 命令控制
      if (line.speaker) {
        const existingChar = activeCharacters.value[line.speaker]
        if (existingChar) {
          // 如果 line 有明确的 pose，解析为 appearance 数组
          if (line.pose) {
            const poses = line.pose.split(',').map((s: string) => s.trim()).filter(Boolean)
            
            // 合并到现有外观
            const newAppearance = [...existingChar.appearance]
            for (const tag of poses) {
              const idx = newAppearance.indexOf(tag)
              if (idx !== -1) {
                newAppearance.splice(idx, 1)
              }
              newAppearance.push(tag)
            }
            existingChar.appearance = newAppearance
          }
          
          // 如果 line 有明确的 position，更新位置
          if (line.position !== undefined) {
            existingChar.position = line.position
          }
        }
      }

      // 处理语音播放
      if (line.voice) {
        const isDebate = scene.type === 'debate'
        playVoice(line.voice, {
          onEnd: () => {
            // 语音播放完毕后的自动推进逻辑
            if (currentLine.value === line) {
              if (isDebate) {
                // 审判场景：语音播完直接推进
                nextLine()
              } else if (isAutoMode.value) {
                // 普通场景 + Auto模式：语音播完1秒后推进
                setTimeout(() => {
                  if (currentLine.value === line) {
                    nextLine()
                  }
                }, 1000)
              }
            }
          }
        })
      } else {
        // 没有语音的情况
        startAutoTimer(line)
      }
    } else if (line.type === 'command') {
      console.log('Executing command:', line.command, line.params)
      
      if (line.command === 'transition') {
        const style = line.params?.style || 'fade-black'
        const duration = line.params?.duration || 1000
        
        isTransitioning.value = true
        transitionParams.value = { style, duration }
      } else if (line.command === 'char') {
        // 立绘显示命令（新的组合系统）
        const { id, appearance, position, action } = line.params || {}
        if (action === 'exit') {
          delete activeCharacters.value[id]
          nextLine()
        } else if (id) {
          // 更新或添加角色
          const existingChar = activeCharacters.value[id]
          const isNewCharacter = !existingChar
          
          if (isNewCharacter) {
            // 新角色进入，分配当前最高的 zIndex 并递减计数器
            activeCharacters.value[id] = {
              id,
              appearance: appearance || ['Default'],
              position: position ?? 50,
              visible: true,
              zIndex: nextZIndex.value--
            }
            // 新角色需要等待加载完成
            waitForCharacterLoad(id).then(() => nextLine())
          } else {
            // 已有角色，处理外观更新
            if (appearance) {
              // 检查新外观是否包含预设表情（如 Normal1, Angry2 等）
              const hasPresetExpression = appearance.some((tag: string) => 
                /^[A-Z][a-z]+\d+$/.test(tag) && 
                !tag.includes('/') && 
                !tag.includes('>') &&
                !tag.includes('-')
              )
              
              // 检查新外观是否包含手臂设置
              const hasArmSetting = appearance.some((tag: string) => 
                tag.startsWith('Arm') || tag.startsWith('Arms')
              )
              
              if (hasPresetExpression) {
                // 如果有预设表情，但没有手臂设置，保留之前的手臂
                if (!hasArmSetting) {
                  // 保留现有的手臂设置
                  const existingArms = existingChar.appearance.filter((tag: string) => 
                    tag.startsWith('Arm') || tag.startsWith('Arms')
                  )
                  existingChar.appearance = [...existingArms, ...appearance]
                } else {
                  // 有手臂设置，直接替换
                  existingChar.appearance = appearance
                }
              } else {
                // 否则合并外观标签
                const newAppearance = [...existingChar.appearance]
                for (const tag of appearance) {
                  if (!newAppearance.includes(tag)) {
                    newAppearance.push(tag)
                  } else {
                    // 如果已存在，移动到最后以提升优先级
                    const idx = newAppearance.indexOf(tag)
                    newAppearance.splice(idx, 1)
                    newAppearance.push(tag)
                  }
                }
                existingChar.appearance = newAppearance
              }
            }
            if (position !== undefined) existingChar.position = position
            // 已有角色只是更新外观，不需要等待
            nextLine()
          }
        } else {
          nextLine()
        }
      } else if (line.command === 'charMiddle') {
        // charMiddle 命令处理
        // 如果有 appearance，就当作普通角色添加到 activeCharacters（由 CharacterLayer 渲染）
        // 如果没有 appearance（如 Warden 单张立绘），才使用 middleCharacter
        const { id, variant, appearance, scale = 1, posX, posY, subId } = line.params || {}
        if (id) {
          if (appearance && appearance.length > 0) {
            // 有 appearance，作为普通角色处理
            const existingChar = activeCharacters.value[id]
            const isNewCharacter = !existingChar
            
            if (isNewCharacter) {
              // 新角色进入
              activeCharacters.value[id] = {
                id,
                appearance: appearance,
                position: posX ?? 50,
                visible: true,
                zIndex: nextZIndex.value--
              }
              // 新角色需要等待加载完成
              waitForCharacterLoad(id).then(() => nextLine())
            } else {
              // 已有角色，更新外观和位置
              existingChar.appearance = appearance
              if (posX !== undefined) existingChar.position = posX
              nextLine()
            }
          } else {
            // 无 appearance，使用 middleCharacter（单张立绘如 Warden）
            middleCharacter.value = {
              id,
              variant: variant || '1',
              appearance: [],
              scale,
              posX: posX ?? 50,
              posY: posY ?? 50,
              subId: subId || 'Middle',
              visible: true
            }
            nextLine()
          }
        } else {
          nextLine()
        }
      } else if (line.command === 'blur') {
        // 模糊效果命令
        const { target, power = 5, duration = 0 } = line.params || {}
        if (target) {
          // 判断目标是否是中间层
          const isMiddleLayer = target.includes('-Middle') || target.includes('Middle')
          
          if (isMiddleLayer) {
            // 对中间层背景应用模糊
            if (duration > 0) {
              gsap.to(middleBackgroundStyle.value, {
                blur: power,
                duration: duration,
                ease: 'power1.out',
                onComplete: () => nextLine()
              })
            } else {
              middleBackgroundStyle.value.blur = power
              nextLine()
            }
          } else {
            // 对主背景应用模糊
            if (duration > 0) {
              gsap.to(backgroundStyle.value, {
                blur: power,
                duration: duration,
                ease: 'power1.out',
                onComplete: () => nextLine()
              })
            } else {
              backgroundStyle.value.blur = power
              nextLine()
            }
          }
        } else {
          nextLine()
        }
      } else if (line.command === 'hide') {
        // 通用隐藏命令，支持多个 ID（如 MainBackground-Middle, Warden-Middle）
        const { id, time = 0.3 } = line.params || {}
        if (id) {
          const targets = id.split(',').map((s: string) => s.trim())
          let pendingAnimations = 0
          
          const onAllComplete = () => {
            pendingAnimations--
            if (pendingAnimations <= 0) {
              nextLine()
            }
          }
          
          for (const target of targets) {
            // 处理中间层背景（带淡出动画）- 需要先判断，因为 MainBackground-Middle 也以 -Middle 结尾
            if (target.startsWith('MainBackground-') || target.startsWith('Stills')) {
              if (time > 0) {
                pendingAnimations++
                gsap.to(middleBackgroundStyle.value, {
                  opacity: 0,
                  duration: time,
                  ease: 'power1.out',
                  onComplete: () => {
                    // 动画完成后清空路径并重置样式
                    middleBackgroundPath.value = ''
                    middleBackgroundStyle.value = {
                      posX: 50,
                      posY: 50,
                      scale: 1,
                      rotX: 0,
                      rotY: 0,
                      rotZ: 0,
                      opacity: 1,
                      blur: 0
                    }
                    // 同时重置 printer 外观模式
                    printerAppearance.value = 'default'
                    onAllComplete()
                  }
                })
              } else {
                // 无动画，直接清空
                middleBackgroundPath.value = ''
                middleBackgroundStyle.value = {
                  posX: 50,
                  posY: 50,
                  scale: 1,
                  rotX: 0,
                  rotY: 0,
                  rotZ: 0,
                  opacity: 1,
                  blur: 0
                }
                // 同时重置 printer 外观模式
                printerAppearance.value = 'default'
              }
              continue
            }
            
            // 处理中间层角色（如 Warden-Middle）
            if (target.endsWith('-Middle') && middleCharacter.value) {
              const charId = target.replace('-Middle', '')
              if (middleCharacter.value.id === charId) {
                middleCharacter.value = null
              }
              continue
            }
            
            if (target === 'MainBackground') {
              // 清空主背景
              backgroundPath.value = ''
              continue
            }
            
            // 处理普通角色
            const charId = target.split('.')[0].split('-')[0]
            if (activeCharacters.value[charId]) {
              delete activeCharacters.value[charId]
            }
          }
          
          // 如果没有等待的动画，立即进入下一行
          if (pendingAnimations === 0) {
            nextLine()
          }
        } else {
          nextLine()
        }
      } else if (line.command === 'resetText') {
        // 重置文本框
        textState.value.text = ''
        textState.value.speaker = ''
        nextLine()
      } else if (line.command === 'hideChar') {
        // 隐藏指定角色
        const { id } = line.params || {}
        if (id) {
          delete activeCharacters.value[id]
        }
        nextLine()
      } else if (line.command === 'hideChars') {
        // 隐藏所有立绘
        activeCharacters.value = {}
        currentPortrait.value = { visible: false, path: '', position: 50 }
        nextLine()
      } else if (line.command === 'loading') {
        const { mode = 'auto', duration = 2000 } = line.params || {}
        
        if (mode === 'auto') {
          isLoading.value = true
          loadingProgress.value = 0
          const interval = setInterval(() => {
            loadingProgress.value += Math.floor(Math.random() * 15) + 5
            if (loadingProgress.value >= 100) {
              loadingProgress.value = 100
              clearInterval(interval)
              setTimeout(() => {
                isLoading.value = false
                nextLine()
              }, 500)
            }
          }, duration / 10)
        } else if (mode === 'start') {
          isLoading.value = true
          loadingProgress.value = line.params?.progress ?? 0
          setTimeout(() => nextLine(), 50)
        } else if (mode === 'end') {
          loadingProgress.value = 100
          setTimeout(() => {
            isLoading.value = false
            nextLine()
          }, 500)
        }
      } else if (line.command === 'goto') {
        // 跳转到其他场景文件（异步加载）
        const { scene, soft = false } = line.params || {}
        if (scene) {
          // 设置加载状态，防止重复触发
          isSceneLoading.value = true
          
          // 第一步：显示 Loading 界面（带渐入效果）
          isLoading.value = true
          
          // 等待 Loading 渐入完成后清理旧场景状态
          setTimeout(() => {
            // 在 Loading 遮挡下清理所有旧场景状态
            activeCharacters.value = {}
            middleCharacter.value = null
            middleBackgroundPath.value = ''
            backgroundPath.value = ''
            textState.value = { speaker: '', text: '' }
            printerAppearance.value = 'default'
            // 重置背景样式
            backgroundStyle.value = { posX: 50, posY: 50, scale: 1, rotX: 0, rotY: 0, rotZ: 0, blur: 0 }
            middleBackgroundStyle.value = { posX: 50, posY: 50, scale: 1, rotX: 0, rotY: 0, rotZ: 0, opacity: 1, blur: 0 }
            // 重置遮罩层为全黑（新场景会自己处理淡入）
            overlayOpacity.value = 1
            // 停止 BGM
            stopBgm()
            
            // 第二步：加载新场景
            loadScene(scene).then(loadedScene => {
              if (!loadedScene) {
                console.error('Failed to goto scene:', scene)
                isSceneLoading.value = false
                isLoading.value = false
                return
              }
              
              // 添加到场景列表（如果还没有）
              if (!currentScript.value.scenes.find(s => s.id === loadedScene.id)) {
                currentScript.value.scenes.push(loadedScene)
              }
              
              currentSceneId.value = loadedScene.id
              currentScenePath.value = scene  // 记录场景路径用于存档
              currentIndex.value = 0
              
              // 加载 debate 场景配置
              if (loadedScene.type === 'debate' && loadedScene.debateConfig) {
                debateConfig.value = loadedScene.debateConfig
              } else {
                debateConfig.value = {}
              }
              
              isSceneLoading.value = false
              
              // 第三步：隐藏 Loading 界面（带渐出效果）
              isLoading.value = false
              
              // 等待 Loading 渐出完成后开始执行新场景
              setTimeout(() => {
                processCurrentLine()
              }, 500)
            })
          }, 1000)
        } else {
          nextLine()
        }
      } else if (line.command === 'jump') {
        const { targetScene, targetLabel } = line.params || {}
        if (targetScene) {
          goToScene(targetScene, targetLabel)
        } else if (targetLabel) {
          goToScene(currentSceneId.value, targetLabel)
        }
      } else if (line.command === 'bg') {
        // 背景切换命令
        const { path, type: bgType, posX, posY, scale, rotX, rotY, rotZ, duration = 0, subId, tint } = line.params || {}
        
        // 处理 Overlay 层 (遮罩层)
        if (subId === 'Overlay') {
          let targetOpacity: number
          
          if (path === null || path === 'Transparent') {
            // 淡出遮罩
            targetOpacity = 0
          } else if (path === 'SolidColor') {
            // 淡入纯色遮罩
            targetOpacity = 1
            if (tint) overlayColor.value = tint
            else overlayColor.value = '#000000' // 默认黑色
          } else {
            targetOpacity = 1
            if (tint) overlayColor.value = tint
          }
          
          if (duration > 0) {
            gsap.to(overlayOpacity, {
              value: targetOpacity,
              duration: duration,
              ease: 'power1.inOut',
              onComplete: () => nextLine()
            })
          } else {
            overlayOpacity.value = targetOpacity
            nextLine()
          }
          return
        }

        // 处理中间层背景 (Middle)
        if (subId === 'Middle') {
          if (path === null || path === 'Transparent') {
            middleBackgroundPath.value = ''
            // 重置中间层样式
            middleBackgroundStyle.value = {
              posX: 50,
              posY: 50,
              scale: 1,
              rotX: 0,
              rotY: 0,
              rotZ: 0,
              opacity: 1,
              blur: 0
            }
          } else if (path) {
            middleBackgroundPath.value = path
          }
          
          // 更新中间层背景样式（独立于主背景）
          if (duration > 0) {
            gsap.to(middleBackgroundStyle.value, {
              posX: posX ?? middleBackgroundStyle.value.posX,
              posY: posY ?? middleBackgroundStyle.value.posY,
              scale: scale ?? middleBackgroundStyle.value.scale,
              rotX: rotX ?? middleBackgroundStyle.value.rotX,
              rotY: rotY ?? middleBackgroundStyle.value.rotY,
              rotZ: rotZ ?? middleBackgroundStyle.value.rotZ,
              duration: duration,
              ease: 'linear',
              onComplete: () => nextLine()
            })
          } else {
            if (posX !== undefined) middleBackgroundStyle.value.posX = posX
            if (posY !== undefined) middleBackgroundStyle.value.posY = posY
            if (scale !== undefined) middleBackgroundStyle.value.scale = scale
            if (rotX !== undefined) middleBackgroundStyle.value.rotX = rotX
            if (rotY !== undefined) middleBackgroundStyle.value.rotY = rotY
            if (rotZ !== undefined) middleBackgroundStyle.value.rotZ = rotZ
            nextLine()
          }
          return
        }

        // 主背景层 (Default 或无 subId)
        if (bgType === 'perspective') {
          backgroundType.value = 'perspective'
          nextLine()
        } else if (path === null || path === 'Transparent') {
          // 清除主背景
          backgroundPath.value = ''
          nextLine()
        } else if (path) {
          backgroundType.value = 'image'
          backgroundPath.value = path
          
          // 如果是 Stills 背景，强制清理所有场上角色和文字
          if (path.includes('/Stills/')) {
            activeCharacters.value = {} // 清理所有立绘数据
            currentPortrait.value = { visible: false, path: '', position: 50 }
            textState.value.text = ''
            textState.value.speaker = ''
          }
          
          // 使用 GSAP 平滑更新背景属性（如果是转场）
          if (duration > 0) {
            gsap.to(backgroundStyle.value, {
              posX: posX ?? 50,
              posY: posY ?? 50,
              scale: scale ?? 1,
              rotX: rotX ?? 0,
              rotY: rotY ?? 0,
              rotZ: rotZ ?? 0,
              duration: duration,
              ease: 'linear',
              onComplete: () => nextLine()
            })
          } else {
            // 瞬间更新属性
            backgroundStyle.value = {
              posX: posX ?? 50,
              posY: posY ?? 50,
              scale: scale ?? 1,
              rotX: rotX ?? 0,
              rotY: rotY ?? 0,
              rotZ: rotZ ?? 0,
              blur: 0
            }
            nextLine()
          }
        } else {
          nextLine()
        }
      } else if (line.command === 'bgm') {
        // BGM 命令
        const { path, action, volume } = line.params || {}
        if (action === 'stop') {
          stopBgm()
        } else if (path) {
          const resolvedPath = resolveBgmPath(path)
          playBgm(resolvedPath, volume)
        }
        setTimeout(() => nextLine(), 50)
      } else if (line.command === 'sfx') {
        // SFX 音效命令
        const { path } = line.params || {}
        if (path) {
          playSfx(path)
        }
        setTimeout(() => nextLine(), 50)
      } else if (line.command === 'animate') {
        // 动画命令
        const { target, props: animationProps, easing, duration = 1, wait = false } = line.params || {}
        
        // 判断是否是中间层背景
        const isMiddleLayer = target && (target.includes('-Middle') || target.includes('Middle'))
        
        // 映射目标，如果是 Stills 或 MainBackground 开头的映射到背景
        if (target && (target.startsWith('Stills') || target.startsWith('MainBackground'))) {
          // 选择正确的样式对象
          const styleTarget = isMiddleLayer ? middleBackgroundStyle.value : backgroundStyle.value
          
          const anim = gsap.to(styleTarget, {
            ...animationProps,
            duration,
            ease: easing?.toLowerCase() || 'power1.out',
            onComplete: () => {
              if (wait) nextLine()
            }
          })
          
          // 如果不需要等待（Naninovel 默认行为），立即进入下一行
          if (!wait) {
            setTimeout(() => nextLine(), 10)
          }
        } else {
          setTimeout(() => nextLine(), 50)
        }
      } else if (line.command === 'title') {
        window.location.reload()
      } else if (line.command === 'wait') {
        // 等待命令
        const { time = 0 } = line.params || {}
        setTimeout(() => {
          if (currentLine.value === line) {
            nextLine()
          }
        }, time * 1000)
      } else if (line.command === 'emoteJumpDouble') {
        // 立绘小跳两下动画
        const { id, subId } = line.params || {}
        if (id) {
          // 查找角色元素
          const charKey = subId ? `${id}-${subId}` : id
          // 尝试在 activeCharacters 中查找
          const char = activeCharacters.value[id]
          if (char) {
            // 保存原始 Y 位置
            const originalPosY = char.posY ?? 0
            
            // 使用 GSAP 做小跳动画
            const timeline = gsap.timeline({
              onComplete: () => nextLine()
            })
            
            // 第一次跳: 上升 -> 下降
            timeline
              .to(char, {
                posY: originalPosY + 10,  // 向上移动 3%
                duration: 0.3,
                ease: 'power2.out'
              })
              .to(char, {
                posY: originalPosY,
                duration: 0.3,
                ease: 'power2.in'
              })
              // 第二次跳: 上升 -> 下降
              .to(char, {
                posY: originalPosY + 10,  // 第二次跳小一点
                duration: 0.3,
                ease: 'power2.out'
              })
              .to(char, {
                posY: originalPosY,
                duration: 0.3,
                ease: 'power2.in'
              })
          } else {
            // 找不到角色，直接进入下一行
            nextLine()
          }
        } else {
          nextLine()
        }
      } else if (line.command === 'printer') {
        // 切换 Printer 外观模式
        const { appearance = 'default' } = line.params || {}
        printerAppearance.value = appearance as 'default' | 'stream'
        nextLine()
      } else if (line.command === 'preload') {
        // 预加载角色命令
        const { characters } = line.params || {}
        if (characters && Array.isArray(characters)) {
          const resolvedIds = characters.map((id: string) => resolveCharacterId(id))
          console.log('[Game] Preloading characters:', resolvedIds)
          // 异步预加载，不阻塞脚本执行
          preloadCharacters(resolvedIds).catch(e => {
            console.warn('Character preload error:', e)
          })
        }
        nextLine()
      } else {
        setTimeout(() => nextLine(), 50)
      }
    } else if (line.type === 'trial_choice') {
      isTrialChoiceOpen.value = true
      trialChoiceData.value = {
        character: line.character,
        choices: line.choices
      }
    } else if (line.type === 'execution') {
      isExecutionOpen.value = true
      executionTargetScene.value = line.targetScene
    } else if (line.type === 'choice') {
      isChoiceOpen.value = true
      choiceData.value = line.choices
    } else if (line.type === 'set_var') {
      const { key, value, operator = '=' } = line
      if (operator === '=') {
        variables.value[key] = value
      } else if (operator === '+=') {
        variables.value[key] = (variables.value[key] || 0) + value
      } else if (operator === '-=') {
        variables.value[key] = (variables.value[key] || 0) - value
      }
      setTimeout(() => nextLine(), 50)
    } else if (line.type === 'condition') {
      let result = false
      try {
        const context = { ...variables.value }
        const fn = new Function(...Object.keys(context), `return ${line.if}`)
        result = !!fn(...Object.values(context))
      } catch (e) {
        console.error('Condition evaluation error:', e)
        result = !!variables.value[line.if]
      }
      
      const target = result ? line.then : line.else
      if (target) {
        goToScene(target)
      } else {
        setTimeout(() => nextLine(), 50)
      }
    } else if (line.type === 'label') {
      setTimeout(() => nextLine(), 50)
    }
  }

  function handleExecutionComplete() {
    if (executionTargetScene.value) {
      goToScene(executionTargetScene.value)
    }
    isExecutionOpen.value = false
    isUIHidden.value = false
  }

  function nextLine() {
    // 如果正在加载场景，不继续执行
    if (isSceneLoading.value) return
    if (!currentScene.value) return

    if (currentIndex.value < currentScene.value.lines.length - 1) {
      currentIndex.value++
      processCurrentLine()
    } else {
      console.log('End of scene')
    }
  }

  function goToScene(sceneId: string, label?: string) {
    const scene = currentScript.value.scenes.find(s => s.id === sceneId)
    if (scene) {
      currentSceneId.value = sceneId
      
      // 加载 debate 场景配置
      if (scene.type === 'debate' && scene.debateConfig) {
        debateConfig.value = scene.debateConfig
      } else {
        debateConfig.value = {}
      }
      
      if (label) {
        const labelIndex = scene.lines.findIndex((l: ScriptLine) => l.type === 'label' && (l as ScriptLabel).name === label)
        currentIndex.value = labelIndex !== -1 ? labelIndex : 0
      } else {
        currentIndex.value = 0
      }
      processCurrentLine()
    }
  }

  // 跳转到其他场景文件（动态加载）
  async function gotoScene(scenePath: string, soft: boolean = false) {
    isSceneLoading.value = true
    
    const scene = await loadScene(scenePath)
    if (!scene) {
      console.error('Failed to goto scene:', scenePath)
      isSceneLoading.value = false
      return
    }
    
    // 添加到场景列表（如果还没有）
    if (!currentScript.value.scenes.find(s => s.id === scene.id)) {
      currentScript.value.scenes.push(scene)
    }
    
    // 如果不是 soft 模式，重置状态
    if (!soft) {
      // 重置角色、背景等状态
      activeCharacters.value = {}
      middleCharacter.value = null
      textState.value = { speaker: '', text: '' }
    }
    
    currentSceneId.value = scene.id
    currentIndex.value = 0
    
    // 加载 debate 场景配置
    if (scene.type === 'debate' && scene.debateConfig) {
      debateConfig.value = scene.debateConfig
    } else {
      debateConfig.value = {}
    }
    
    isSceneLoading.value = false
    processCurrentLine()
  }

  async function startGame() {
    isSceneLoading.value = true
    
    const scene = await loadScene(INITIAL_SCENE_PATH)
    if (!scene) {
      console.error('Failed to load initial scene')
      isSceneLoading.value = false
      return
    }
    
    currentScript.value.scenes.push(scene)
    currentSceneId.value = scene.id
    currentScenePath.value = INITIAL_SCENE_PATH
    currentIndex.value = 0
    
    // 加载 debate 场景配置
    if (scene.type === 'debate' && scene.debateConfig) {
      debateConfig.value = scene.debateConfig
    }
    
    isSceneLoading.value = false
    processCurrentLine()
  }
  
  // ========== 存档/读档系统 ==========
  
  // 从 localStorage 加载存档列表
  function loadSaveSlots() {
    try {
      const saved = localStorage.getItem(SAVE_STORAGE_KEY)
      if (saved) {
        saveSlots.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load save slots:', e)
    }
  }
  
  // 保存存档列表到 localStorage
  function persistSaveSlots() {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveSlots.value))
    } catch (e) {
      console.error('Failed to persist save slots:', e)
    }
  }
  
  // 获取指定槽位的存档数据
  function getSaveSlot(slotId: number): SaveData | null {
    return saveSlots.value[slotId] || null
  }
  
  // 获取所有存档
  function getAllSaves(): SaveData[] {
    return Object.values(saveSlots.value).sort((a, b) => b.timestamp - a.timestamp)
  }
  
  // 存档
  async function saveGame(slotId: number, screenshot: string): Promise<boolean> {
    try {
      const now = new Date()
      const name = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      
      const saveData: SaveData = {
        id: slotId,
        name,
        timestamp: now.getTime(),
        screenshot,
        scenePath: currentScenePath.value,
        sceneId: currentSceneId.value,
        lineIndex: currentIndex.value,
        backgroundPath: backgroundPath.value,
        middleBackgroundPath: middleBackgroundPath.value,
        backgroundStyle: { ...backgroundStyle.value },
        middleBackgroundStyle: { ...middleBackgroundStyle.value },
        overlayOpacity: overlayOpacity.value,
        overlayColor: overlayColor.value,
        currentBgm: currentBgm.value,
        activeCharacters: JSON.parse(JSON.stringify(activeCharacters.value)),
        middleCharacter: middleCharacter.value ? { ...middleCharacter.value } : null,
        variables: { ...variables.value }
      }
      
      saveSlots.value[slotId] = saveData
      persistSaveSlots()
      
      console.log('Game saved to slot', slotId)
      return true
    } catch (e) {
      console.error('Failed to save game:', e)
      return false
    }
  }
  
  // 读档
  async function loadGame(slotId: number): Promise<boolean> {
    const saveData = saveSlots.value[slotId]
    if (!saveData) {
      console.error('No save data found for slot', slotId)
      return false
    }
    
    try {
      isSceneLoading.value = true
      isLoading.value = true
      
      // 等待 Loading 渐入
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 清理当前状态
      stopBgm()
      stopVoice()
      
      // 加载场景
      const scene = await loadScene(saveData.scenePath)
      if (!scene) {
        console.error('Failed to load scene:', saveData.scenePath)
        isSceneLoading.value = false
        isLoading.value = false
        return false
      }
      
      // 添加到场景列表
      if (!currentScript.value.scenes.find(s => s.id === scene.id)) {
        currentScript.value.scenes.push(scene)
      }
      
      // 恢复状态
      currentScenePath.value = saveData.scenePath
      currentSceneId.value = saveData.sceneId
      currentIndex.value = saveData.lineIndex
      backgroundPath.value = saveData.backgroundPath
      middleBackgroundPath.value = saveData.middleBackgroundPath
      backgroundStyle.value = { ...saveData.backgroundStyle }
      middleBackgroundStyle.value = { ...saveData.middleBackgroundStyle }
      overlayOpacity.value = saveData.overlayOpacity
      overlayColor.value = saveData.overlayColor
      activeCharacters.value = JSON.parse(JSON.stringify(saveData.activeCharacters))
      middleCharacter.value = saveData.middleCharacter ? { ...saveData.middleCharacter } : null
      variables.value = { ...saveData.variables }
      
      // 恢复 BGM
      if (saveData.currentBgm) {
        playBgm(saveData.currentBgm)
      }
      
      // 加载 debate 场景配置
      if (scene.type === 'debate' && scene.debateConfig) {
        debateConfig.value = scene.debateConfig
      } else {
        debateConfig.value = {}
      }
      
      isSceneLoading.value = false
      isLoading.value = false
      
      // 等待 Loading 渐出后处理当前行
      await new Promise(resolve => setTimeout(resolve, 300))
      processCurrentLine()
      
      console.log('Game loaded from slot', slotId)
      return true
    } catch (e) {
      console.error('Failed to load game:', e)
      isSceneLoading.value = false
      isLoading.value = false
      return false
    }
  }
  
  // 删除存档
  function deleteSave(slotId: number): boolean {
    if (saveSlots.value[slotId]) {
      delete saveSlots.value[slotId]
      persistSaveSlots()
      console.log('Save deleted from slot', slotId)
      return true
    }
    return false
  }
  
  // 初始化时加载存档列表
  loadSaveSlots()

  return {
    currentScript,
    currentSceneId,
    currentScene,
    currentIndex,
    currentLine,
    textState,
    isTransitioning,
    transitionParams,
    isLoading,
    isSceneLoading,
    loadingProgress,
    activeCharacters,
    history,
    currentEngine,
    isWitchBookOpen,
    isTrialChoiceOpen,
    trialChoiceData,
    debateConfig,
    isLogOpen,
    isSaveLoadOpen,
    isOptionsOpen,
    isGalleryOpen,
    isExecutionOpen,
    isChoiceOpen,
    choiceData,
    isUIHidden,
    saveLoadMode,
    printerAppearance,
    backgroundType,
    backgroundPath,
    middleBackgroundPath,
    backgroundStyle,
    middleBackgroundStyle,
    middleCharacter,
    overlayOpacity,
    overlayColor,
    currentPortrait,
    currentBgm,
    bgmVolume,
    playBgm,
    stopBgm,
    setBgmVolume,
    voiceVolume,
    isVoicePlaying,
    isAutoMode,
    playVoice,
    stopVoice,
    setVoiceVolume,
    setAutoMode,
    sfxVolume,
    playSfx,
    setSfxVolume,
    variables,
    nextLine,
    goToScene,
    gotoScene,
    startGame,
    handleExecutionComplete,
    // 存档/读档系统
    saveSlots,
    currentScenePath,
    getSaveSlot,
    getAllSaves,
    saveGame,
    loadGame,
    deleteSave,
    // 角色加载系统
    onCharacterLoaded
  }
})

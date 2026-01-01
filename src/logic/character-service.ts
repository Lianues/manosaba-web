/**
 * 角色管理服务
 * 用于加载、缓存和管理角色配置
 */

import type {
  CharacterConfig,
  CharacterGameObject,
  ExpressionPreset,
  ComposerState
} from '../types/character'
import { parseCharacterConfig } from './character-parser'
import { getCharacterCompositionConfig } from '../data/characters'
import type { CompositionRule } from '../types/composition'
import { parseCompositionString } from '../types/composition'

// 角色配置缓存
const characterCache = new Map<string, CharacterConfig>()

// 表情预设缓存
const expressionPresets = new Map<string, Map<string, ExpressionPreset>>()

// 图片缓存（用于预加载）
const imagePreloadCache = new Map<string, HTMLImageElement>()

// 预加载状态跟踪
const preloadingCharacters = new Set<string>()
const preloadedCharacters = new Set<string>()

/**
 * 加载角色配置
 */
export async function loadCharacter(
  characterId: string,
  basePath: string = '/Characters'
): Promise<CharacterConfig> {
  // 检查缓存
  if (characterCache.has(characterId)) {
    return characterCache.get(characterId)!
  }
  
  const fullPath = `${basePath}/${characterId}`
  const response = await fetch(`${fullPath}/GameObject.json`)
  
  if (!response.ok) {
    throw new Error(`Failed to load character: ${characterId}`)
  }
  
  const gameObject: CharacterGameObject = await response.json()
  const config = parseCharacterConfig(characterId, characterId, fullPath, gameObject)
  
  // 缓存
  characterCache.set(characterId, config)
  
  return config
}

/**
 * 预加载多个角色（配置 + 图片）
 */
export async function preloadCharacters(
  characterIds: string[],
  basePath: string = '/Characters'
): Promise<void> {
  await Promise.all(
    characterIds.map(id => preloadCharacterFull(id, basePath).catch(e => {
      console.warn(`Failed to preload character ${id}:`, e)
    }))
  )
}

/**
 * 完整预加载单个角色（配置 + 所有图层图片）
 */
export async function preloadCharacterFull(
  characterId: string,
  basePath: string = '/Characters'
): Promise<void> {
  // 如果已经预加载过，跳过
  if (preloadedCharacters.has(characterId)) {
    return
  }
  
  // 如果正在预加载，等待完成
  if (preloadingCharacters.has(characterId)) {
    // 等待正在进行的预加载
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!preloadingCharacters.has(characterId)) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }
  
  preloadingCharacters.add(characterId)
  
  try {
    // 1. 加载角色配置
    const config = await loadCharacter(characterId, basePath)
    
    // 2. 预加载所有图层图片
    const imagePromises = config.layers.map(layer => {
      const url = `${config.basePath}/${layer.spriteName}.webp`
      return preloadImage(url)
    })
    
    await Promise.all(imagePromises)
    
    preloadedCharacters.add(characterId)
    console.log(`[CharacterService] Preloaded character: ${characterId} (${config.layers.length} images)`)
  } finally {
    preloadingCharacters.delete(characterId)
  }
}

/**
 * 预加载单张图片
 */
function preloadImage(url: string): Promise<HTMLImageElement> {
  // 检查缓存
  if (imagePreloadCache.has(url)) {
    return Promise.resolve(imagePreloadCache.get(url)!)
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imagePreloadCache.set(url, img)
      resolve(img)
    }
    img.onerror = () => {
      // 图片加载失败不影响整体预加载
      resolve(img)
    }
    img.src = url
  })
}

/**
 * 检查角色是否已预加载
 */
export function isCharacterPreloaded(characterId: string): boolean {
  return preloadedCharacters.has(characterId)
}

/**
 * 从场景数据中提取需要的角色 ID
 */
export function extractCharacterIdsFromScene(scene: any): string[] {
  const characterIds = new Set<string>()
  
  if (!scene?.lines) return []
  
  for (const line of scene.lines) {
    if (line.type === 'command') {
      if (line.command === 'char' || line.command === 'charMiddle') {
        const id = line.params?.id
        if (id) {
          characterIds.add(id)
        }
      }
    }
  }
  
  return Array.from(characterIds)
}

/**
 * 获取已加载的角色配置
 */
export function getCharacter(characterId: string): CharacterConfig | undefined {
  return characterCache.get(characterId)
}

/**
 * 注册表情预设
 */
export function registerExpressionPreset(
  characterId: string,
  presetName: string,
  preset: ExpressionPreset
): void {
  if (!expressionPresets.has(characterId)) {
    expressionPresets.set(characterId, new Map())
  }
  expressionPresets.get(characterId)!.set(presetName, preset)
}

/**
 * 获取表情预设
 */
export function getExpressionPreset(
  characterId: string,
  presetName: string
): ExpressionPreset | undefined {
  return expressionPresets.get(characterId)?.get(presetName)
}

/**
 * 将表情预设转换为状态
 */
export function presetToState(preset: ExpressionPreset): ComposerState {
  return {
    layers: preset.layers,
    effects: preset.effects
  }
}

/**
 * 创建角色状态
 */
export function createCharacterState(
  layers: Record<string, string>,
  effects?: string[]
): ComposerState {
  return { layers, effects }
}

/**
 * 解析外观组合列表为 ComposerState
 * 支持新的组合系统语法：
 * - ["Surprised1"] -> 单个表情预设
 * - ["Normal1", "ArmR3"] -> 表情 + 手臂组合
 * - ["Head1", "Pale1-Off", ...] -> 完整组合
 */
export function resolveAppearance(
  characterId: string,
  appearance: string[]
): ComposerState | undefined {
  const config = getCharacterCompositionConfig(characterId)
  if (!config) {
    console.warn(`No composition config found for character: ${characterId}`)
    return undefined
  }
  
  // 收集所有规则
  const allRules: CompositionRule[] = []
  const processedKeys = new Set<string>()
  
  // 递归解析组合键（处理引用）
  function resolveKey(key: string) {
    if (processedKeys.has(key)) return
    processedKeys.add(key)
    
    // 检查是否是原始规则（包含 > + 或 -）
    if (key.includes('>') || key.includes('+') || (key.includes('/') && key.endsWith('-'))) {
      const inlineRules = parseCompositionString(key)
      allRules.push(...inlineRules)
      return
    }
    
    const entry = config!.compositionMap.find((e: { key: string }) => e.key === key)
    if (!entry) {
      console.warn(`Unknown composition key: ${key} for character ${characterId}`)
      return
    }
    
    // 先处理引用
    if (entry.refs) {
      for (const ref of entry.refs) {
        resolveKey(ref)
      }
    }
    
    // 添加规则
    allRules.push(...entry.rules)
  }
  
  // 检查是否包含预设表情（如 Normal1, Angry2 等）
  // 预设表情会定义完整的面部状态，不需要叠加默认外观中的面部部分
  const hasPresetExpression = appearance.some((tag: string) => 
    /^[A-Z][a-z]+\d+$/.test(tag) && 
    !tag.includes('/') && 
    !tag.includes('>') &&
    !tag.includes('-')
  )
  
  // 解析所有外观键
  // 如果有预设表情，不使用默认外观中的 Default 部分，避免面部冲突
  // 但仍然需要手臂等基础部件
  let effectiveAppearance: string[]
  
  // 检查用户是否指定了手臂配置
  const userHasArmConfig = appearance.some((key: string) => 
    key.startsWith('Arm') || key.startsWith('Arms')
  )
  
  if (hasPresetExpression) {
    if (userHasArmConfig) {
      // 用户指定了手臂配置，不使用默认手臂
      effectiveAppearance = [...appearance]
    } else {
      // 只保留默认外观中的手臂部分
      const defaultArms = (config.defaultAppearance || []).filter((key: string) => 
        key.startsWith('Arm') || key.startsWith('Arms')
      )
      effectiveAppearance = [...defaultArms, ...appearance]
    }
  } else {
    if (userHasArmConfig) {
      // 用户指定了手臂，过滤掉默认手臂配置
      const filteredDefault = (config.defaultAppearance || []).filter((key: string) => 
        !key.startsWith('Arm') && !key.startsWith('Arms')
      )
      effectiveAppearance = [...filteredDefault, ...appearance]
    } else {
      effectiveAppearance = [...(config.defaultAppearance || []), ...appearance]
    }
  }
  
  // 过滤掉无效的路径前缀（如 Angle01、Angle02 等）
  // 这些是 Naninovel 的路径组件，不是有效的组合键
  const pathPrefixPattern = /^Angle\d+$/
  effectiveAppearance = effectiveAppearance.filter((key: string) => {
    if (pathPrefixPattern.test(key)) {
      // 静默忽略路径前缀
      return false
    }
    return true
  })
  
  for (const key of effectiveAppearance) {
    resolveKey(key)
  }
  
  // 将规则转换为 ComposerState
  const layers: Record<string, string> = {}
  const excludePaths = new Set<string>()
  const effects: string[] = []
  
  for (const rule of allRules) {
    if (rule.action === 'exclude') {
      excludePaths.add(rule.path)
    } else if (rule.action === 'exclusive' && rule.target) {
      // 排他渲染：从路径提取组名并映射到简化的组名
      const pathParts = rule.path.split('/')
      const lastPart = pathParts[pathParts.length - 1]
      if (lastPart) {
        // 从路径最后一部分提取简化的组名
        // 例如: "Angle01/Head01/Facial01/Eyes01" -> "Eyes01" -> "Eyes"
        const groupName = extractSimpleGroupName(lastPart)
        layers[groupName] = rule.target
      }
    } else if (rule.action === 'include' && rule.target) {
      // 包含渲染：添加到效果列表
      effects.push(rule.target)
    }
  }
  
  const result = {
    layers,
    effects: effects.length > 0 ? effects : undefined,
    excludePaths: excludePaths.size > 0 ? Array.from(excludePaths) : undefined
  }
  
  return result
}

/**
 * 从路径组件提取简化的组名
 * 例如: "Eyes01" -> "Eyes", "Mouth01" -> "Mouth", "ArmR" -> "ArmR"
 */
function extractSimpleGroupName(pathComponent: string): string {
  // 常见的组名模式
  const groupPatterns = [
    'Eyes', 'Mouth', 'Cheeks', 'Sweat', 'Pale',
    'ArmL', 'ArmR', 'Arms', 'Hair', 'Facial',
    'Head', 'Body', 'Shadow'
  ]
  
  // 尝试匹配模式
  for (const pattern of groupPatterns) {
    if (pathComponent.startsWith(pattern)) {
      return pattern
    }
  }
  
  // 如果没有匹配，返回原始值
  return pathComponent
}

// ============ 预设表情库 ============

// Noah 的预设表情
registerExpressionPreset('noah', 'normal', {
  name: 'normal',
  layers: {
    'Eyes': 'Eyes_Normal_Open01',
    'Mouth': 'Mouth_Normal_Closed',
    'Cheeks': 'Cheeks_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('noah', 'smile', {
  name: 'smile',
  layers: {
    'Eyes': 'Eyes_Smile_Open',
    'Mouth': 'Mouth_Smile_Open01',
    'Cheeks': 'Cheeks_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('noah', 'surprised', {
  name: 'surprised',
  layers: {
    'Eyes': 'Eyes_Surprised_Open01',
    'Mouth': 'Mouth_Surprised_Open01',
    'Cheeks': 'Cheeks_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('noah', 'angry', {
  name: 'angry',
  layers: {
    'Eyes': 'Eyes_Angry_Open',
    'Mouth': 'Mouth_Angry_Open',
    'Cheeks': 'Cheeks_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('noah', 'sad', {
  name: 'sad',
  layers: {
    'Eyes': 'Eyes_Cry_Open',
    'Mouth': 'Mouth_Cry_Closed',
    'Cheeks': 'Cheeks_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  },
  effects: ['Sweat01']
})

// Ema 的预设表情
registerExpressionPreset('ema', 'normal', {
  name: 'normal',
  layers: {
    'Eyes': 'Eyes01_Normal_Open01',
    'Mouth': 'Mouth01_Normal_Closed',
    'Cheeks': 'Cheeks01_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('ema', 'smile', {
  name: 'smile',
  layers: {
    'Eyes': 'Eyes01_Smile_Closed01',
    'Mouth': 'Mouth01_Smile_Open',
    'Cheeks': 'Cheeks01_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('ema', 'surprised', {
  name: 'surprised',
  layers: {
    'Eyes': 'Eyes01_Surprised_Open01',
    'Mouth': 'Mouth01_Surprised_Open',
    'Cheeks': 'Cheeks01_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('ema', 'angry', {
  name: 'angry',
  layers: {
    'Eyes': 'Eyes01_Angry_Open01',
    'Mouth': 'Mouth01_Angry_Open',
    'Cheeks': 'Cheeks01_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

// Hiro 的预设表情
registerExpressionPreset('hiro', 'normal', {
  name: 'normal',
  layers: {
    'Eyes': 'Eyes01_Normal_Open',
    'Mouth': 'Mouth01_Normal_Closed',
    'Cheeks': 'Cheeks01_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

registerExpressionPreset('hiro', 'serious', {
  name: 'serious',
  layers: {
    'Eyes': 'Eyes01_Serious_Open01',
    'Mouth': 'Mouth01_Determined_Closed01',
    'Cheeks': 'Cheeks01_Normal',
    'ArmL': 'ArmL01',
    'ArmR': 'ArmR01'
  }
})

export default {
  loadCharacter,
  preloadCharacters,
  preloadCharacterFull,
  isCharacterPreloaded,
  extractCharacterIdsFromScene,
  getCharacter,
  registerExpressionPreset,
  getExpressionPreset,
  presetToState,
  createCharacterState
}

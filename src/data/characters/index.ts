/**
 * 角色组合配置索引
 * 集中管理所有角色的组合配置
 */
import type { CharacterCompositionConfig } from '../../types/composition'
import { EmaCompositionConfig } from './ema-composition'
import { HiroCompositionConfig } from './hiro-composition'
import { AlisaCompositionConfig } from './alisa-composition'
import { AnAnCompositionConfig } from './anan-composition'
import { CocoCompositionConfig } from './coco-composition'
import { HannaCompositionConfig } from './hanna-composition'
import { LeiaCompositionConfig } from './leia-composition'
import { MargoCompositionConfig } from './margo-composition'
import { MeruruCompositionConfig } from './meruru-composition'
import { MiriaCompositionConfig } from './miria-composition'
import { NanokaCompositionConfig } from './nanoka-composition'
import { NoahCompositionConfig } from './noah-composition'
import { SherryCompositionConfig } from './sherry-composition'

/** 所有角色配置的映射（英文ID） */
const characterConfigs: Record<string, CharacterCompositionConfig> = {
  'Ema': EmaCompositionConfig,
  'Hiro': HiroCompositionConfig,
  'Alisa': AlisaCompositionConfig,
  'AnAn': AnAnCompositionConfig,
  'Coco': CocoCompositionConfig,
  'Hanna': HannaCompositionConfig,
  'Leia': LeiaCompositionConfig,
  'Margo': MargoCompositionConfig,
  'Meruru': MeruruCompositionConfig,
  'Miria': MiriaCompositionConfig,
  'Nanoka': NanokaCompositionConfig,
  'Noah': NoahCompositionConfig,
  'Sherry': SherryCompositionConfig,
  // 未来添加更多角色...
}

/** 中文名到英文ID的映射 */
const characterNameToId: Record<string, string> = {
  // Ema
  '樱羽艾玛': 'Ema',
  '艾玛': 'Ema',
  'Ema': 'Ema',
  // Hiro
  '二阶堂希罗': 'Hiro',
  '希罗': 'Hiro',
  'Hiro': 'Hiro',
  // Alisa
  '紫藤爱丽莎': 'Alisa',
  '爱丽莎': 'Alisa',
  'Alisa': 'Alisa',
  // AnAn
  '夏目安安': 'AnAn',
  '安安': 'AnAn',
  'AnAn': 'AnAn',
  // Coco
  '泽渡可可': 'Coco',
  '可可': 'Coco',
  'Coco': 'Coco',
  // Hanna
  '远野汉娜': 'Hanna',
  '汉娜': 'Hanna',
  'Hanna': 'Hanna',
  // Leia
  '莲见蕾雅': 'Leia',
  '蕾雅': 'Leia',
  'Leia': 'Leia',
  // Margo
  '宝生玛格': 'Margo',
  '玛格': 'Margo',
  'Margo': 'Margo',
  // Meruru
  '冰上梅露露': 'Meruru',
  '梅露露': 'Meruru',
  'Meruru': 'Meruru',
  // Miria
  '佐伯米莉亚': 'Miria',
  '米莉亚': 'Miria',
  'Miria': 'Miria',
  // Nanoka
  '黑部奈叶香': 'Nanoka',
  '奈叶香': 'Nanoka',
  'Nanoka': 'Nanoka',
  // Noah
  '城崎诺亚': 'Noah',
  '诺亚': 'Noah',
  'Noah': 'Noah',
  // Sherry
  '橘雪莉': 'Sherry',
  '雪莉': 'Sherry',
  'Sherry': 'Sherry',
  // 未来添加更多角色别名...
}

/**
 * 将角色名称转换为英文ID
 */
export function resolveCharacterId(nameOrId: string): string {
  return characterNameToId[nameOrId] || nameOrId
}

/**
 * 获取角色组合配置
 */
export function getCharacterCompositionConfig(nameOrId: string): CharacterCompositionConfig | undefined {
  const id = resolveCharacterId(nameOrId)
  return characterConfigs[id]
}

/**
 * 获取所有可用的角色ID列表
 */
export function getAvailableCharacters(): string[] {
  return Object.keys(characterConfigs)
}

/**
 * 注册新的角色配置（运行时动态添加）
 */
export function registerCharacterConfig(config: CharacterCompositionConfig): void {
  characterConfigs[config.characterId] = config
}

/**
 * 注册角色名称别名
 */
export function registerCharacterAlias(alias: string, characterId: string): void {
  characterNameToId[alias] = characterId
}

export { EmaCompositionConfig, HiroCompositionConfig, AlisaCompositionConfig, AnAnCompositionConfig, CocoCompositionConfig, HannaCompositionConfig, LeiaCompositionConfig, MargoCompositionConfig, MeruruCompositionConfig, MiriaCompositionConfig, NanokaCompositionConfig, NoahCompositionConfig, SherryCompositionConfig, resolveCharacterId as getCharacterId }

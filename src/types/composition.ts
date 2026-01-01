/**
 * 角色组合配置类型定义
 * 基于 Naninovel 的组合语法规范
 * 
 * 语法说明：
 * - ">" 排他渲染：在指定节点下只渲染目标组件
 * - "+" 全部渲染：渲染指定节点的所有子组件
 * - "-" 取消渲染：不渲染指定节点下的任意组件
 */

/** 组合动作类型 */
export type CompositionAction = 'exclusive' | 'include' | 'exclude'

/** 单个组合规则 */
export interface CompositionRule {
  /** 节点路径，如 "Angle01/ArmR" */
  path: string
  /** 动作类型 */
  action: CompositionAction
  /** 目标节点名称（排他和包含时使用） */
  target?: string
}

/** 组合条目 */
export interface CompositionEntry {
  /** 唯一键名，如 "ArmR1", "Normal1" */
  key: string
  /** 组合规则列表 */
  rules: CompositionRule[]
  /** 引用其他条目（用于别名，如 Default -> Normal1） */
  refs?: string[]
}

/** 角色组合配置 */
export interface CharacterCompositionConfig {
  /** 角色ID */
  characterId: string
  /** 角色显示名称 */
  displayName: string
  /** 组合映射表 */
  compositionMap: CompositionEntry[]
  /** 默认外观（激活的组合键列表） */
  defaultAppearance: string[]
}

/**
 * 解析组合字符串为规则列表
 * @example
 * "Angle01/ArmR>ArmR01" -> { path: "Angle01/ArmR", action: "exclusive", target: "ArmR01" }
 * "Angle01/Shadow-" -> { path: "Angle01/Shadow", action: "exclude" }
 * "Angle01/Head01+HeadBase01" -> { path: "Angle01/Head01", action: "include", target: "HeadBase01" }
 */
export function parseCompositionString(composition: string): CompositionRule[] {
  const rules: CompositionRule[] = []
  const parts = composition.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    
    // 检查是否是引用（不包含路径分隔符和操作符）
    if (!trimmed.includes('/') && !trimmed.includes('>') && !trimmed.includes('+') && !trimmed.includes('-')) {
      // 这是一个引用，跳过（由调用者处理）
      continue
    }
    
    // 解析排他渲染 >
    if (trimmed.includes('>')) {
      const parts = trimmed.split('>')
      const path = parts[0]
      const target = parts[1]
      if (path && target) {
        rules.push({
          path: path.trim(),
          action: 'exclusive',
          target: target.trim()
        })
      }
      continue
    }
    
    // 解析全部渲染 +（在路径末尾）
    if (trimmed.includes('+')) {
      const plusIndex = trimmed.indexOf('+')
      const path = trimmed.substring(0, plusIndex)
      const target = trimmed.substring(plusIndex + 1)
      rules.push({
        path: path.trim(),
        action: 'include',
        target: target.trim() || undefined
      })
      continue
    }
    
    // 解析取消渲染 -（在路径末尾）
    if (trimmed.endsWith('-')) {
      const path = trimmed.slice(0, -1)
      rules.push({
        path: path.trim(),
        action: 'exclude'
      })
      continue
    }
  }
  
  return rules
}

/**
 * 从组合字符串中提取引用
 */
export function extractRefs(composition: string): string[] {
  const refs: string[] = []
  const parts = composition.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    
    // 不包含路径分隔符和操作符的就是引用
    if (!trimmed.includes('/') && !trimmed.includes('>') && !trimmed.includes('+') && !trimmed.endsWith('-')) {
      refs.push(trimmed)
    }
  }
  
  return refs
}

/**
 * 从 YAML 格式的配置构建 CharacterCompositionConfig
 */
export function buildCompositionConfig(
  characterId: string,
  displayName: string,
  compositionMap: Array<{ Key: string; Composition: string }>,
  defaultAppearance: string
): CharacterCompositionConfig {
  const entries: CompositionEntry[] = []
  
  for (const item of compositionMap) {
    const rules = parseCompositionString(item.Composition)
    const refs = extractRefs(item.Composition)
    
    entries.push({
      key: item.Key,
      rules,
      refs: refs.length > 0 ? refs : undefined
    })
  }
  
  return {
    characterId,
    displayName,
    compositionMap: entries,
    defaultAppearance: defaultAppearance.split(',').map(s => s.trim())
  }
}

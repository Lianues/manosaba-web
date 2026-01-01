/**
 * 立绘拼接系统类型定义
 * 基于 Unity GameObject 结构设计
 */

// ============ 基础数据结构（对应 GameObject.json）============

/** 2D/3D 向量 */
export interface Vector2 {
  x: number
  y: number
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

/** 四元数旋转 */
export interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

/** Transform 变换信息 */
export interface Transform {
  Position: Vector3
  Rotation: Quaternion
  Scale: Vector3
}

/** 精灵信息 */
export interface Sprite {
  Name: string
  PixelsToUnits: number
  Pivot: Vector2
}

/** 材质信息 */
export interface Material {
  Name: string
  Floats: Record<string, number>
}

/** RGBA 颜色 */
export interface Color {
  r: number
  g: number
  b: number
  a: number
}

/** 精灵渲染器 */
export interface SpriteRenderer {
  Sprite: Sprite
  Enabled: boolean
  SortingOrder: number
  Color: Color
  Materials: Material[]
}

/** GameObject 节点 */
export interface GameObject {
  Name: string
  Id: string
  ParentId: string | null
  Transform: Transform
  SpriteRenderer: SpriteRenderer | null
  IsActive: boolean
  Children: Record<string, GameObject>
}

/** 角色 GameObject 根结构 */
export type CharacterGameObject = Record<string, GameObject>

// ============ 运行时数据结构 ============

/** 扁平化的图层信息（预处理后） */
export interface FlattenedLayer {
  id: string
  name: string
  parentPath: string[]           // 父级路径，用于分组
  groupName: string              // 所属分组（如 Eyes, Mouth, ArmL）
  spriteName: string             // 精灵图片名称
  sortingOrder: number           // 渲染层级
  enabled: boolean               // 默认是否启用
  // 计算后的绝对变换
  absolutePosition: Vector3
  absoluteScale: Vector3
  // 精灵信息
  pivot: Vector2                 // 精灵锚点 (0-1)
  pixelsToUnits: number          // 像素到单位的转换比例
  // 渲染属性
  color: Color
  blendMode: BlendMode           // 混合模式
  clippingMask?: ClippingMaskInfo // 剪辑蒙版信息
}

/** 混合模式（从材质名称解析） */
export type BlendMode = 'normal' | 'multiply' | 'overlay' | 'softlight'

/** 剪辑蒙版信息（从材质名称解析） */
export interface ClippingMaskInfo {
  /** 作为蒙版的引用ID（如 Ref1, Ref2） */
  maskRef?: string
  /** 被此蒙版剪辑的引用ID */
  maskedRef?: string
}

/** 图层分组信息 */
export interface LayerGroup {
  name: string                   // 分组名称（如 "Eyes", "Mouth"）
  layers: FlattenedLayer[]       // 该分组下的所有图层
  isExclusive: boolean           // 是否互斥（同组只能选一个）
  defaultLayer?: string          // 默认启用的图层
}

/** 角色配置 */
export interface CharacterConfig {
  id: string                     // 角色ID（如 "noah", "ema"）
  name: string                   // 角色显示名称
  basePath: string               // 资源基础路径
  gameObject: CharacterGameObject // 原始 GameObject 数据
  layers: FlattenedLayer[]       // 扁平化后的所有图层
  groups: LayerGroup[]           // 图层分组
  baseScale: number              // 基础缩放（从根 Transform 获取）
  baseOffset: Vector3            // 基础偏移（从根 Transform 获取）
  anchorPoint?: Vector2          // 锚点（基于 Body 图层的位置，用于固定定位）
}

// ============ 状态控制 ============

/** 立绘拼接器状态（用于控制显示哪些图层） */
export interface ComposerState {
  // 按分组名指定要显示的图层名称
  // 例如: { "Eyes": "Eyes_Normal_Open01", "Mouth": "Mouth_Smile_Open01" }
  layers: Record<string, string>
  
  // 可选的额外启用图层（如 Sweat、Pale 等效果层）
  effects?: string[]
  
  // 要排除的路径列表（如 "Angle01/Arms"）
  excludePaths?: string[]
  
  // 要包含的路径映射（路径 -> 子节点名称列表）
  includePaths?: Record<string, string[]>
}

/** 组件属性 */
export interface CharacterComposerProps {
  characterId: string            // 角色ID
  state?: ComposerState          // 当前状态
  scale?: number                 // 额外缩放
  position?: { x: number; y: number } // 位置偏移
  flipX?: boolean                // 水平翻转
  tint?: string                  // 着色（如变暗）
}

// ============ 预设表情 ============

/** 预设表情配置 */
export interface ExpressionPreset {
  name: string
  layers: Record<string, string>
  effects?: string[]
}

/** 角色表情库 */
export interface CharacterExpressions {
  characterId: string
  presets: Record<string, ExpressionPreset>
}

// ============ 工具函数类型 ============

/** 解析材质名称获取混合模式 */
export function parseBlendMode(materialName: string): BlendMode {
  const name = materialName.toLowerCase()
  if (name.includes('multiply')) return 'multiply'
  if (name.includes('overlay')) return 'overlay'
  if (name.includes('softlight')) return 'softlight'
  return 'normal'
}

/**
 * 解析材质名称获取剪辑蒙版信息
 * 材质名称格式示例:
 * - "Naninovel_Default_Mask_Ref1" -> 作为 Ref1 的蒙版
 * - "Naninovel_Multiply_Masked_Ref1" -> 被 Ref1 剪辑
 */
export function parseClippingMask(materialName: string): ClippingMaskInfo | undefined {
  // 匹配 Mask_Ref 模式（作为蒙版）
  const maskMatch = materialName.match(/Mask_Ref(\d+)/i)
  if (maskMatch) {
    return { maskRef: `Ref${maskMatch[1]}` }
  }
  
  // 匹配 Masked_Ref 模式（被蒙版剪辑）
  const maskedMatch = materialName.match(/Masked_Ref(\d+)/i)
  if (maskedMatch) {
    return { maskedRef: `Ref${maskedMatch[1]}` }
  }
  
  return undefined
}

/** 解析分组名称（从图层路径推断） */
export function parseGroupName(name: string, parentPath: string[]): string {
  // 常见的分组名称模式（按优先级排序，更具体的在前面）
  const groupPatterns = [
    'Option_ArmL', 'Option_ArmR',  // 配件组（如口罩）
    'Mask',                        // 面部遮罩组
    'Eyes', 'Mouth', 'Cheeks', 'Sweat', 'Pale',
    'ArmL', 'ArmR', 'Arms', 'Hair', 'Facial',
    'Head', 'Body'  // Body 和 Head 放在最后，因为它们是更通用的容器
  ]
  
  // 首先从名称推断（更精确）
  for (const pattern of groupPatterns) {
    if (name.startsWith(pattern)) {
      return pattern
    }
  }
  
  // 然后检查父路径（倒序遍历，从最近的父节点开始）
  for (let i = parentPath.length - 1; i >= 0; i--) {
    const parent = parentPath[i]
    if (!parent) continue
    for (const pattern of groupPatterns) {
      if (parent === pattern || parent.startsWith(pattern)) {
        return pattern
      }
    }
  }
  
  // 对于手臂，使用更具体的分组
  if (name.match(/^ArmL\d+$/)) return 'ArmL'
  if (name.match(/^ArmR\d+$/)) return 'ArmR'
  if (name.match(/^Arms\d+$/)) return 'Arms'
  
  // 默认分组
  return 'Other'
}

/** 判断分组是否互斥 */
export function isExclusiveGroup(groupName: string): boolean {
  // 这些分组同时只能显示一个图层
  const exclusiveGroups = [
    'Eyes', 'Mouth', 'Cheeks', 'Mask',
    'ArmL', 'ArmR', 'Arms', 'Body',
    'Option_ArmL', 'Option_ArmR'
  ]
  return exclusiveGroups.includes(groupName)
}

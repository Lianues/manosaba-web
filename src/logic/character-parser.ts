/**
 * 角色立绘解析器
 * 将 GameObject.json 转换为可用的渲染数据
 */

import type {
  CharacterGameObject,
  GameObject,
  CharacterConfig,
  FlattenedLayer,
  LayerGroup,
  Vector3,
  BlendMode,
  ComposerState
} from '../types/character'
import { parseBlendMode, parseClippingMask, parseGroupName, isExclusiveGroup } from '../types/character'

/**
 * 遍历 GameObject 树并扁平化所有图层
 */
function flattenGameObject(
  node: GameObject,
  parentPath: string[] = [],
  parentPosition: Vector3 = { x: 0, y: 0, z: 0 },
  parentScale: Vector3 = { x: 1, y: 1, z: 1 }
): FlattenedLayer[] {
  const layers: FlattenedLayer[] = []
  
  // 计算绝对变换
  const absolutePosition: Vector3 = {
    x: parentPosition.x + node.Transform.Position.x * parentScale.x,
    y: parentPosition.y + node.Transform.Position.y * parentScale.y,
    z: parentPosition.z + node.Transform.Position.z * parentScale.z
  }
  
  const absoluteScale: Vector3 = {
    x: parentScale.x * node.Transform.Scale.x,
    y: parentScale.y * node.Transform.Scale.y,
    z: parentScale.z * node.Transform.Scale.z
  }
  
  // 如果有 SpriteRenderer，创建图层
  if (node.SpriteRenderer && node.IsActive) {
    const sr = node.SpriteRenderer
    const materialName = sr.Materials[0]?.Name || 'Naninovel_Default'
    const sprite = sr.Sprite
    
    layers.push({
      id: node.Id,
      name: node.Name,
      parentPath: [...parentPath],
      groupName: parseGroupName(node.Name, parentPath),
      spriteName: sprite.Name,
      sortingOrder: sr.SortingOrder,
      enabled: sr.Enabled,
      absolutePosition,
      absoluteScale,
      pivot: sprite.Pivot || { x: 0.5, y: 0.5 },
      pixelsToUnits: sprite.PixelsToUnits || 100,
      color: sr.Color,
      blendMode: parseBlendMode(materialName),
      clippingMask: parseClippingMask(materialName)
    })
  }
  
  // 递归处理子节点
  const currentPath = node.SpriteRenderer ? parentPath : [...parentPath, node.Name]
  for (const childId of Object.keys(node.Children)) {
    const child = node.Children[childId]
    if (!child) continue
    layers.push(...flattenGameObject(
      child,
      currentPath,
      absolutePosition,
      absoluteScale
    ))
  }
  
  return layers
}

/**
 * 将图层分组
 */
function groupLayers(layers: FlattenedLayer[]): LayerGroup[] {
  const groupMap = new Map<string, FlattenedLayer[]>()
  
  for (const layer of layers) {
    const groupName = layer.groupName
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, [])
    }
    groupMap.get(groupName)!.push(layer)
  }
  
  const groups: LayerGroup[] = []
  for (const [name, groupLayers] of groupMap) {
    // 按 sortingOrder 排序
    groupLayers.sort((a, b) => a.sortingOrder - b.sortingOrder)
    
    // 查找默认启用的图层
    const defaultLayer = groupLayers.find(l => l.enabled)?.name
    
    groups.push({
      name,
      layers: groupLayers,
      isExclusive: isExclusiveGroup(name),
      defaultLayer
    })
  }
  
  return groups
}

/**
 * 解析角色配置
 */
export function parseCharacterConfig(
  id: string,
  name: string,
  basePath: string,
  gameObject: CharacterGameObject
): CharacterConfig {
  // 获取根节点
  const rootId = Object.keys(gameObject)[0]
  if (!rootId) {
    throw new Error(`Invalid character config: no root node found for ${id}`)
  }
  const root = gameObject[rootId]
  if (!root) {
    throw new Error(`Invalid character config: root node is undefined for ${id}`)
  }
  
  // 获取基础变换
  const baseScale = root.Transform.Scale.x
  const baseOffset = root.Transform.Position
  
  // 扁平化所有图层
  const allLayers: FlattenedLayer[] = []
  for (const childId of Object.keys(root.Children)) {
    const child = root.Children[childId]
    if (!child) continue
    // 跳过 Camera 和 LayerModifier 等非渲染节点
    if (child.Name === 'Camera' || child.Name === 'LayerModifier') continue
    
    allLayers.push(...flattenGameObject(
      child,
      [],
      baseOffset,
      root.Transform.Scale
    ))
  }
  
  // 分组
  const groups = groupLayers(allLayers)
  
  // 查找 Body 图层作为锚点参考
  const bodyLayer = allLayers.find(l => l.name === 'Body' || l.spriteName === 'Body')
  const anchorPoint = bodyLayer ? {
    x: bodyLayer.absolutePosition.x * bodyLayer.pixelsToUnits,
    y: bodyLayer.absolutePosition.y * bodyLayer.pixelsToUnits
  } : { x: 0, y: 0 }
  
  return {
    id,
    name,
    basePath,
    gameObject,
    layers: allLayers,
    groups,
    baseScale,
    baseOffset,
    anchorPoint
  }
}

/**
 * 根据状态获取需要渲染的图层
 */
export function getActiveLayers(
  config: CharacterConfig,
  state?: ComposerState
): FlattenedLayer[] {
  const activeLayers: FlattenedLayer[] = []
  const stateLayerMap = state?.layers || {}
  const effectLayers = new Set(state?.effects || [])
  const excludePaths = state?.excludePaths || []
  
  // 检查路径是否被排除
  const isExcluded = (layer: FlattenedLayer) => {
    return excludePaths.some(path => {
      // 检查图层的父路径是否包含排除路径，或者图层名本身就在排除路径中
      const fullPath = [...layer.parentPath, layer.name].join('/')
      const parentPath = layer.parentPath.join('/')
      return fullPath.startsWith(path) || parentPath.startsWith(path)
    })
  }
  
  for (const group of config.groups) {
    if (group.isExclusive) {
      // 互斥组：只选择一个
      const selectedName = stateLayerMap[group.name] || group.defaultLayer
      if (selectedName) {
        const layer = group.layers.find(l => l.name === selectedName || l.spriteName === selectedName)
        if (layer && !isExcluded(layer)) {
          activeLayers.push(layer)
        }
      }
    } else {
      // 非互斥组：根据默认状态或效果指定
      for (const layer of group.layers) {
        if (isExcluded(layer)) continue
        
        // 检查是否在效果列表中
        if (effectLayers.has(layer.name) || effectLayers.has(layer.spriteName)) {
          activeLayers.push(layer)
          continue
        }
        // 默认启用的图层都显示（包括效果层）
        if (layer.enabled) {
          activeLayers.push(layer)
        }
      }
    }
  }
  
  // 按 sortingOrder 排序
  activeLayers.sort((a, b) => a.sortingOrder - b.sortingOrder)
  
  return activeLayers
}

/**
 * 计算图层的 CSS 样式
 * 参考 manosaba-character-composer 的定位逻辑
 */
export function calculateLayerStyle(
  layer: FlattenedLayer,
  containerSize: { width: number; height: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  imageSize: { width: number; height: number }
): Record<string, string> {
  const { absolutePosition, absoluteScale, pivot, pixelsToUnits, color, blendMode } = layer
  
  // 将 Unity 单位转换为像素
  const px = absolutePosition.x * pixelsToUnits
  const py = absolutePosition.y * pixelsToUnits
  
  // 计算缩放后的尺寸
  const scaledW = imageSize.width * absoluteScale.x
  const scaledH = imageSize.height * absoluteScale.y
  
  // 计算锚点偏移
  const pivotOffsetX = pivot.x * scaledW
  const pivotOffsetY = pivot.y * scaledH
  
  // 计算在合成画布中的位置
  // paste_x = px - pivot_offset_x - min_x
  // paste_y = max_y - py - (scaled_h - pivot_offset_y)
  const pasteX = px - pivotOffsetX - bounds.minX
  const pasteY = bounds.maxY - py - (scaledH - pivotOffsetY)
  
  // 计算容器缩放比例
  const canvasWidth = bounds.maxX - bounds.minX
  const canvasHeight = bounds.maxY - bounds.minY
  
  // 将画布坐标映射到容器坐标
  const scaleRatio = Math.min(
    containerSize.width / canvasWidth,
    containerSize.height / canvasHeight
  )
  
  // 水平居中偏移：计算立绘在容器内缩放后的实际宽度，然后计算居中所需的偏移
  const visualWidth = canvasWidth * scaleRatio
  const horizontalOffset = (containerSize.width - visualWidth) / 2
  
  const finalX = (pasteX * scaleRatio) + horizontalOffset
  const finalY = pasteY * scaleRatio
  const finalW = scaledW * scaleRatio
  const finalH = scaledH * scaleRatio
  
  // 混合模式映射
  const blendModeMap: Record<BlendMode, string> = {
    normal: 'normal',
    multiply: 'multiply',
    overlay: 'overlay',
    softlight: 'soft-light'
  }
  
  return {
    position: 'absolute',
    left: `${finalX}px`,
    top: `${finalY}px`,
    width: `${finalW}px`,
    height: `${finalH}px`,
    opacity: String(color.a),
    mixBlendMode: blendModeMap[blendMode],
    zIndex: String(layer.sortingOrder)
  }
}

/**
 * 计算所有图层的边界框
 */
export interface LayerBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function calculateBounds(
  layers: FlattenedLayer[],
  imageSizes: Map<string, { width: number; height: number }>
): LayerBounds {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  
  for (const layer of layers) {
    const size = imageSizes.get(layer.spriteName)
    if (!size) continue
    
    const { absolutePosition, absoluteScale, pivot, pixelsToUnits } = layer
    
    const px = absolutePosition.x * pixelsToUnits
    const py = absolutePosition.y * pixelsToUnits
    const scaledW = size.width * absoluteScale.x
    const scaledH = size.height * absoluteScale.y
    const pivotOffsetX = pivot.x * scaledW
    const pivotOffsetY = pivot.y * scaledH
    
    // 计算边界框 (left, top, right, bottom)
    const left = px - pivotOffsetX
    const right = left + scaledW
    const top = py + (scaledH - pivotOffsetY)
    const bottom = top - scaledH
    
    minX = Math.min(minX, left)
    maxX = Math.max(maxX, right)
    minY = Math.min(minY, bottom)
    maxY = Math.max(maxY, top)
  }
  
  return { minX, maxX, minY, maxY }
}

/**
 * 获取图层图片 URL
 */
export function getLayerImageUrl(basePath: string, spriteName: string): string {
  return `${basePath}/${spriteName}.webp`
}

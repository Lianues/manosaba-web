/**
 * Canvas 图层混合器
 * 实现 Photoshop 风格的图层混合模式和剪辑蒙版
 * 参考 Python blend.py 的实现
 */

import type { BlendMode, ClippingMaskInfo, FlattenedLayer } from '../types/character'
import type { LayerBounds } from './character-parser'

/** 渲染图层信息（带加载的图片） */
export interface RenderLayer {
  layer: FlattenedLayer
  image: HTMLImageElement
  /** 在画布上的位置和尺寸 */
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * Canvas 图层混合器
 * 支持混合模式：Normal, Multiply, Overlay, SoftLight
 * 支持剪辑蒙版：Mask_Ref / Masked_Ref 机制
 */
export class CanvasBlender {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  
  /** 蒙版缓存（存储各个 Ref 的 alpha 通道） */
  private maskCache: Map<string, ImageData> = new Map()
  
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      throw new Error('Failed to get 2D context')
    }
    this.ctx = ctx
  }
  
  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.maskCache.clear()
  }
  
  /**
   * 混合一个图层到画布
   */
  blendLayer(
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    blendMode: BlendMode = 'normal',
    opacity: number = 1,
    clippingMask?: ClippingMaskInfo
  ): void {
    // 创建临时画布来处理这个图层
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = this.width
    tempCanvas.height = this.height
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!
    
    // 绘制图层到临时画布
    tempCtx.globalAlpha = opacity
    tempCtx.drawImage(image, x, y, width, height)
    tempCtx.globalAlpha = 1
    
    // 获取临时画布数据
    let layerData = tempCtx.getImageData(0, 0, this.width, this.height)
    
    // 如果作为蒙版，保存 alpha 通道
    if (clippingMask?.maskRef) {
      this.saveMask(clippingMask.maskRef, layerData)
    }
    
    // 如果被蒙版剪辑，应用蒙版
    if (clippingMask?.maskedRef) {
      layerData = this.applyMask(layerData, clippingMask.maskedRef)
    }
    
    // 应用混合模式
    if (blendMode === 'normal') {
      // 使用 Canvas 原生混合
      tempCtx.putImageData(layerData, 0, 0)
      this.ctx.drawImage(tempCanvas, 0, 0)
    } else {
      // 使用自定义混合
      this.blendWithMode(layerData, blendMode)
    }
  }
  
  /**
   * 保存蒙版（alpha 通道）
   */
  private saveMask(ref: string, imageData: ImageData): void {
    const existing = this.maskCache.get(ref)
    if (existing) {
      // 合并蒙版：取最大 alpha 值
      for (let i = 3; i < imageData.data.length; i += 4) {
        const existingAlpha = existing.data[i] ?? 0
        const newAlpha = imageData.data[i] ?? 0
        existing.data[i] = Math.max(existingAlpha, newAlpha)
      }
    } else {
      // 创建新蒙版（只保留 alpha 通道）
      const maskData = new ImageData(this.width, this.height)
      for (let i = 0; i < imageData.data.length; i += 4) {
        maskData.data[i] = 0
        maskData.data[i + 1] = 0
        maskData.data[i + 2] = 0
        maskData.data[i + 3] = imageData.data[i + 3] ?? 0
      }
      this.maskCache.set(ref, maskData)
    }
  }
  
  /**
   * 应用蒙版（剪辑）
   */
  private applyMask(imageData: ImageData, ref: string): ImageData {
    const mask = this.maskCache.get(ref)
    if (!mask) {
      console.warn(`[CanvasBlender] Mask with ref '${ref}' not found. Available masks:`, Array.from(this.maskCache.keys()))
      return imageData
    }
    
    // 将图层的 alpha 与蒙版的 alpha 相乘
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      this.width,
      this.height
    )
    
    for (let i = 3; i < result.data.length; i += 4) {
      const layerAlpha = (result.data[i] ?? 0) / 255
      const maskAlpha = (mask.data[i] ?? 0) / 255
      result.data[i] = Math.round(layerAlpha * maskAlpha * 255)
    }
    
    return result
  }
  
  /**
   * 使用指定混合模式合成图层
   */
  private blendWithMode(layerData: ImageData, mode: BlendMode): void {
    const bgData = this.ctx.getImageData(0, 0, this.width, this.height)
    const result = new ImageData(
      new Uint8ClampedArray(bgData.data),
      this.width,
      this.height
    )
    
    for (let i = 0; i < bgData.data.length; i += 4) {
      const bgR = bgData.data[i] ?? 0
      const bgG = bgData.data[i + 1] ?? 0
      const bgB = bgData.data[i + 2] ?? 0
      const bgA = (bgData.data[i + 3] ?? 0) / 255
      
      const fgR = layerData.data[i] ?? 0
      const fgG = layerData.data[i + 1] ?? 0
      const fgB = layerData.data[i + 2] ?? 0
      const fgA = (layerData.data[i + 3] ?? 0) / 255
      
      if (fgA === 0) continue
      
      // 根据混合模式计算颜色
      let blendR: number, blendG: number, blendB: number
      
      switch (mode) {
        case 'multiply':
          blendR = this.multiplyBlend(bgR, fgR)
          blendG = this.multiplyBlend(bgG, fgG)
          blendB = this.multiplyBlend(bgB, fgB)
          break
        case 'overlay':
          blendR = this.overlayBlend(bgR, fgR)
          blendG = this.overlayBlend(bgG, fgG)
          blendB = this.overlayBlend(bgB, fgB)
          break
        case 'softlight':
          blendR = this.softLightBlend(bgR, fgR)
          blendG = this.softLightBlend(bgG, fgG)
          blendB = this.softLightBlend(bgB, fgB)
          break
        default:
          blendR = fgR
          blendG = fgG
          blendB = fgB
      }
      
      // Alpha 合成
      const outA = bgA + fgA - bgA * fgA
      if (outA > 0) {
        result.data[i] = Math.round((blendR * fgA + bgR * bgA * (1 - fgA)) / outA)
        result.data[i + 1] = Math.round((blendG * fgA + bgG * bgA * (1 - fgA)) / outA)
        result.data[i + 2] = Math.round((blendB * fgA + bgB * bgA * (1 - fgA)) / outA)
        result.data[i + 3] = Math.round(outA * 255)
      }
    }
    
    this.ctx.putImageData(result, 0, 0)
  }
  
  /** 正片叠底 */
  private multiplyBlend(bg: number, fg: number): number {
    return (bg * fg) / 255
  }
  
  /** 叠加 */
  private overlayBlend(bg: number, fg: number): number {
    if (bg < 128) {
      return (2 * bg * fg) / 255
    } else {
      return 255 - (2 * (255 - bg) * (255 - fg)) / 255
    }
  }
  
  /** 柔光 */
  private softLightBlend(bg: number, fg: number): number {
    const bgNorm = bg / 255
    const fgNorm = fg / 255
    return ((1 - 2 * fgNorm) * bgNorm * bgNorm + 2 * fgNorm * bgNorm) * 255
  }
  
  /**
   * 获取画布内容作为 ImageData
   */
  getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.width, this.height)
  }
  
  /**
   * 获取画布元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
  
  /**
   * 获取画布内容作为 Data URL
   */
  toDataURL(type: string = 'image/png'): string {
    return this.canvas.toDataURL(type)
  }
}

/**
 * 计算图层在画布上的渲染位置
 */
export function calculateLayerRect(
  layer: FlattenedLayer,
  imageSize: { width: number; height: number },
  bounds: LayerBounds,
  canvasSize: { width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const { absolutePosition, absoluteScale, pivot, pixelsToUnits } = layer
  
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
  const pasteX = px - pivotOffsetX - bounds.minX
  const pasteY = bounds.maxY - py - (scaledH - pivotOffsetY)
  
  // 计算容器缩放比例
  const canvasWidth = bounds.maxX - bounds.minX
  const canvasHeight = bounds.maxY - bounds.minY
  
  const scaleRatio = Math.min(
    canvasSize.width / canvasWidth,
    canvasSize.height / canvasHeight
  )
  
  // 水平居中偏移
  const visualWidth = canvasWidth * scaleRatio
  const horizontalOffset = (canvasSize.width - visualWidth) / 2
  
  return {
    x: (pasteX * scaleRatio) + horizontalOffset,
    y: pasteY * scaleRatio,
    width: scaledW * scaleRatio,
    height: scaledH * scaleRatio
  }
}

/**
 * 检测图层是否需要高级渲染（混合模式或蒙版）
 */
export function needsAdvancedRendering(layers: FlattenedLayer[]): boolean {
  return layers.some(layer => 
    layer.blendMode !== 'normal' || 
    layer.clippingMask?.maskRef || 
    layer.clippingMask?.maskedRef
  )
}

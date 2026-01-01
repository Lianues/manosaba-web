/**
 * 辩论场景工具函数
 * 
 * @description
 * 用于解析和处理辩论文字中的高亮标记
 */

import type { DebateSceneConfig } from './script'

export type { DebateSceneConfig }

/**
 * 高亮文字点击事件参数
 */
export interface HighlightClickEvent {
  /** 事件ID，对应 [[text|eventId]] 中的 eventId */
  eventId: string
  /** 显示的文字内容 */
  text: string
}

/**
 * 高亮标记正则表达式
 * 
 * 支持两种格式：
 * - [[文字]]: 纯高亮，不可点击
 * - [[文字|事件ID]]: 可点击的高亮
 */
export const HIGHLIGHT_REGEX = /\[\[(.+?)(?:\|(.+?))?\]\]/g

/**
 * 将 [[文字]] 或 [[文字|事件ID]] 格式转换为 HTML span 标签
 * 
 * @param text 原始文本
 * @returns 转换后的 HTML 文本
 * 
 * @example
 * parseHighlightMarks('请出示[[证据]]！')
 * // 返回: '请出示<span class="highlight">证据</span>！'
 * 
 * parseHighlightMarks('请点击[[证据|show_evidence]]来继续')
 * // 返回: '请点击<span class="highlight clickable" data-event-id="show_evidence">证据</span>来继续'
 */
export function parseHighlightMarks(text: string): string {
  return text.replace(HIGHLIGHT_REGEX, (match, content, eventId) => {
    if (eventId) {
      // 有事件ID，添加 clickable 类和 data 属性
      return `<span class="highlight clickable" data-event-id="${eventId}" data-text="${content}">${content}</span>`
    } else {
      // 无事件ID，纯高亮
      return `<span class="highlight">${content}</span>`
    }
  })
}

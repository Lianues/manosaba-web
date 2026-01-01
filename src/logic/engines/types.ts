import type { CharacterState, SceneType } from '../../types/script'

/** 引擎对话返回结果（包含 pose 用于映射到 appearance） */
export interface DialogueResult {
  id?: string
  pose?: string
  position?: string | number
  visible?: boolean
}

export interface EngineResult {
  characterUpdate?: Partial<CharacterState>
}

export interface IGameEngine {
  type: SceneType
  calculatePosition(pos: string | number): any
  processDialogue(speaker: string | undefined, currentPose?: string, currentPos?: string | number): DialogueResult
}

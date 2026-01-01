import type { IGameEngine, DialogueResult } from './types'

export const TraditionalEngine: IGameEngine = {
  type: 'traditional',

  calculatePosition(pos: string | number) {
    const left = typeof pos === 'number' ? pos : parseInt(pos) || 50
    return {
      left: `${left}%`,
      bottom: '0',
      transform: 'translateX(-50%)',
      zIndex: 10
    }
  },

  processDialogue(speaker: string | undefined, currentPose?: string, currentPos?: string | number): DialogueResult {
    if (!speaker) return {}
    return {
      id: speaker,
      pose: currentPose || 'default',
      position: currentPos ?? 50,
      visible: true
    }
  }
}

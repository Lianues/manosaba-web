import type { IGameEngine, DialogueResult } from './types'

export const TrialEngine: IGameEngine = {
    type: 'trial',

    calculatePosition(pos: string | number) {
        const left = typeof pos === 'number' ? pos : parseInt(pos) || 50
        return {
            left: `${left}%`,
            bottom: '0',
            transform: 'translateX(-50%)',
            zIndex: 10
        }
    },

    processDialogue(speaker: string | undefined, pose?: string, position?: number | string): DialogueResult {
        if (!speaker) return {}
        
        let targetPos = 50;
        if (speaker === '紫藤亚里沙') {
            targetPos = 25;
        }

        return {
            id: speaker,
            pose: pose || 'default',
            position: typeof position === 'number' ? position : targetPos,
            visible: true
        }
    }
}

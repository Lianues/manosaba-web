import type { GameScript } from '../types/script'

// 角色立绘路径
const PORTRAITS = {
  ema: '/Characters/Ema/Ema 正常立绘ver2.png',
  hiro: '/Characters/Hiro/Hiro 正常立绘ver2.png'
}

// BGM 路径
const BGM = {
  normal: '/Audio/BGM/Common/Bgm_005_001_Loop.ogg',   // 普通对话
  debate: '/Audio/BGM/Common/Bgm_002_001_Loop.ogg'    // 审判讨论
}

// 语音路径
const VOICE = {
  ema_common: '/Audio/Voice/CommonBad01_Ema001.ogg',
  hiro_debate: '/Audio/Voice/0205Adv04_Hiro007.ogg'
}

export const demoScript: GameScript = {
  title: '魔女审判',
  scenes: [
    // ==================== 第一幕：开场 ====================
    {
      id: 'scene_opening',
      type: 'traditional',
      lines: [
        { type: 'command', command: 'loading', params: { mode: 'auto', duration: 1500 } },
        { type: 'command', command: 'bg', params: { path: '/Background/Background_016_001.png' } },
        { type: 'command', command: 'bgm', params: { path: BGM.normal } },
        
        // 艾玛登场 - 默认立绘
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '希罗，你终于来了。',
          voice: VOICE.ema_common,
          portraitPath: PORTRAITS.ema,
          portraitType: 'normal',
          portraitPositionX: 50
        },
        
        // 希罗回应 - 默认立绘，偏右
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '抱歉让你久等了，艾玛。发生了什么事？',
          portraitPath: PORTRAITS.hiro,
          portraitType: 'normal',
          portraitPositionX: 50
        },
        
        // 艾玛近景 - 表情严肃
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '审判即将开始……这次的案件，和以往不同。',
          portraitPath: PORTRAITS.ema,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        // 系统旁白
        { 
          type: 'text', 
          speaker: '旁白', 
          text: '空气中弥漫着紧张的气息。这将是一场决定命运的审判。'
        },
        
        // 选择分支
        { 
          type: 'choice',
          choices: [
            { text: '询问案件详情', targetScene: 'scene_investigation' },
            { text: '直接前往法庭', targetScene: 'scene_court_entrance' },
            { text: '进入审判辩论', targetScene: 'scene_debate' }
          ]
        }
      ]
    },
    
    // ==================== 调查场景 ====================
    {
      id: 'scene_investigation',
      type: 'traditional',
      lines: [
        { type: 'command', command: 'bg', params: { path: '/Background/Background_016_001.png' } },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '被告人是一位年轻的魔女，被指控使用禁忌魔法。',
          portraitPath: PORTRAITS.ema,
          portraitType: 'normal',
          portraitPositionX: 35
        },
        
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '禁忌魔法……这可是重罪。有什么证据吗？',
          portraitPath: PORTRAITS.hiro,
          portraitType: 'normal',
          portraitPositionX: 65
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '目前只有目击者的证词。但是……',
          portraitPath: PORTRAITS.ema,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '我总觉得这其中有<b>蹊跷</b>。',
          portraitPath: PORTRAITS.ema,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        { type: 'set_var', key: 'investigated', value: true },
        { type: 'command', command: 'jump', params: { targetScene: 'scene_court_entrance' } }
      ]
    },
    
    // ==================== 法庭入口 ====================
    {
      id: 'scene_court_entrance',
      type: 'traditional',
      lines: [
        { type: 'command', command: 'transition', params: { style: 'fade-black', duration: 800 } },
        { type: 'command', command: 'bg', params: { type: 'perspective' } },
        
        { 
          type: 'text', 
          speaker: '旁白', 
          text: '魔女审判法庭——这里将决定无数人的命运。'
        },
        
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '（这里的气氛果然不同寻常……）',
          portraitPath: PORTRAITS.hiro,
          portraitType: 'normal',
          portraitPositionX: 50
        },
        
        // 根据是否调查过显示不同对话
        { type: 'condition', if: 'investigated', then: 'scene_court_prepared', else: 'scene_court_unprepared' }
      ]
    },
    
    // ==================== 有准备进入法庭 ====================
    {
      id: 'scene_court_prepared',
      type: 'traditional',
      lines: [
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '幸好我们提前调查过了。准备好了吗？',
          portraitPath: PORTRAITS.ema,
          portraitType: 'normal',
          portraitPositionX: 50
        },
        
        { type: 'set_var', key: 'trust', value: 1, operator: '+=' },
        { type: 'command', command: 'jump', params: { targetScene: 'scene_debate' } }
      ]
    },
    
    // ==================== 没准备进入法庭 ====================
    {
      id: 'scene_court_unprepared',
      type: 'traditional',
      lines: [
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '希罗，你应该先了解案情的……算了，只能随机应变了。',
          portraitPath: PORTRAITS.ema,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        { type: 'set_var', key: 'trust', value: 1, operator: '-=' },
        { type: 'command', command: 'jump', params: { targetScene: 'scene_debate' } }
      ]
    },
    
    // ==================== 审判辩论 ====================
    {
      id: 'scene_debate',
      type: 'debate',
      debateConfig: {
        tiltAngle: 2
      },
      lines: [
        { type: 'command', command: 'bg', params: { type: 'perspective' } },
        { type: 'command', command: 'bgm', params: { path: BGM.debate } },
        
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '请听我说！', 
          voice: VOICE.hiro_debate,
          portraitPath: PORTRAITS.hiro,
          portraitSide: 'left'
        },
        
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '这个证词存在矛盾！', 
          autoNext: 3000,
          portraitPath: PORTRAITS.hiro,
          portraitSide: 'left'
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '没错，目击者声称在<b>深夜</b>看到了魔法光芒……', 
          autoNext: 4000,
          portraitPath: PORTRAITS.ema,
          portraitSide: 'right'
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '但那天是<b>新月之夜</b>！', 
          autoNext: 3000,
          portraitPath: PORTRAITS.ema,
          portraitSide: 'right'
        },
        
        // 审判选择
        { 
          type: 'trial_choice', 
          character: 'Hiro', 
          choices: [
            { text: '指出矛盾', targetScene: 'scene_victory', type: 'Objection' },
            { text: '追问细节', targetScene: 'scene_continue_debate', type: 'Question' },
            { text: '放弃辩护', targetScene: 'scene_defeat', type: 'Cancel' }
          ]
        }
      ]
    },
    
    // ==================== 继续辩论 ====================
    {
      id: 'scene_continue_debate',
      type: 'debate',
      debateConfig: {
        tiltAngle: -2
      },
      lines: [
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '请详细说明当时的情况！', 
          autoNext: 3000,
          portraitPath: PORTRAITS.hiro,
          portraitSide: 'left'
        },
        
        { 
          type: 'text', 
          speaker: '???', 
          text: '我……我确实看到了光芒……', 
          autoNext: 3000,
          portraitPath: PORTRAITS.ema,
          portraitSide: 'right'
        },
        
        { 
          type: 'trial_choice', 
          character: 'Ema', 
          choices: [
            { text: '揭穿谎言', targetScene: 'scene_victory', type: 'Perjury' },
            { text: '继续追问', targetScene: 'scene_defeat', type: 'Question' }
          ]
        }
      ]
    },
    
    // ==================== 胜利结局 ====================
    {
      id: 'scene_victory',
      type: 'traditional',
      lines: [
        { type: 'command', command: 'transition', params: { style: 'flash', duration: 500 } },
        { type: 'command', command: 'bg', params: { path: '/Background/Background_016_001.png' } },
        { type: 'command', command: 'bgm', params: { path: BGM.normal } },
        
        { 
          type: 'text', 
          speaker: '旁白', 
          text: '真相大白——被告人被宣判无罪！'
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '太好了，希罗！我们成功了！',
          portraitPath: PORTRAITS.ema,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '正义终将胜利。这就是我们的使命。',
          portraitPath: PORTRAITS.hiro,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        // 处刑按钮演示
        { type: 'execution', targetScene: 'scene_ending' }
      ]
    },
    
    // ==================== 失败结局 ====================
    {
      id: 'scene_defeat',
      type: 'traditional',
      lines: [
        { type: 'command', command: 'transition', params: { style: 'glitch', duration: 800 } },
        { type: 'command', command: 'bg', params: { path: '/Background/Background_014_001.png' } },
        
        { 
          type: 'text', 
          speaker: '旁白', 
          text: '辩护失败——被告人被判处极刑。'
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '希罗……我们失败了……',
          portraitPath: PORTRAITS.ema,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        { 
          type: 'choice',
          choices: [
            { text: '重新开始', targetScene: 'scene_opening' },
            { text: '返回标题', targetScene: 'scene_title', isBad: true }
          ]
        }
      ]
    },
    
    // ==================== 结局 ====================
    {
      id: 'scene_ending',
      type: 'traditional',
      lines: [
        { type: 'command', command: 'bg', params: { path: '/Background/Background_016_001.png' } },
        
        { 
          type: 'text', 
          speaker: '旁白', 
          text: '夕阳西下，审判落幕。但新的案件，正在等待着他们……'
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '希罗，谢谢你今天的帮助。',
          portraitPath: PORTRAITS.ema,
          portraitType: 'normal',
          portraitPositionX: 35
        },
        
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '不用谢，我们是搭档嘛。',
          portraitPath: PORTRAITS.hiro,
          portraitType: 'normal',
          portraitPositionX: 65
        },
        
        { 
          type: 'text', 
          speaker: '樱羽艾玛', 
          text: '那么，明天见？',
          portraitPath: PORTRAITS.ema,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        { 
          type: 'text', 
          speaker: '二阶堂希罗', 
          text: '明天见，艾玛。',
          portraitPath: PORTRAITS.hiro,
          portraitType: 'closeup',
          portraitPositionX: 50
        },
        
        { type: 'command', command: 'transition', params: { style: 'fade-black', duration: 2000 } },
        
        { 
          type: 'text', 
          speaker: '', 
          text: '—— 第一章 完 ——'
        },
        
        { 
          type: 'choice',
          choices: [
            { text: '重新开始', targetScene: 'scene_opening' },
            { text: '返回标题', targetScene: 'scene_title' }
          ]
        }
      ]
    },
    
    // ==================== 返回标题 ====================
    {
      id: 'scene_title',
      type: 'traditional',
      lines: [
        { type: 'command', command: 'bgm', params: { action: 'stop' } },
        { type: 'command', command: 'title' }
      ]
    }
  ]
}

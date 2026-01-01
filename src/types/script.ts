export type SceneType = 'traditional' | 'trial' | 'debate'; // 场景类型：传统、审判或辩论场景

// ============= 通用文字类型 =============
// 根据 Scene 类型自动选择渲染器：
// - traditional/trial -> NormalPrinter
// - debate -> DebatePrinter
export interface ScriptText {
  type: 'text';
  speaker?: string;
  text: string;
  pose?: string;
  position?: string | number;
  // 语音
  voice?: string; // 语音文件路径
  // 立绘相关 (traditional/trial 场景)
  portraitPath?: string;
  portraitType?: 'normal' | 'closeup';
  portraitPositionX?: number; // 0-100
  // debate 场景专用
  autoNext?: number; // 毫秒后自动推进
  portraitSide?: 'left' | 'right'; // 辩论模式下的位置
}

// ============= 悬浮层类型（所有场景通用）=============

export interface ScriptCommand {
  type: 'command';
  command: string;
  params?: Record<string, any>;
}

export interface ScriptChoice {
  type: 'choice';
  choices: Array<{
    text: string;
    targetScene: string;
    targetLabel?: string;
    isBad?: boolean;
  }>;
}

export type TrialChoiceType = 'Approval' | 'Objection' | 'Perjury' | 'Question' | 'Cancel' | 'MagicEma' | 'MagicAnAn' | 'MagicLeia' | 'MagicCoco' | 'MagicMargo' | 'MagicNanoka';

export interface ScriptTrialChoice {
  type: 'trial_choice';
  character: 'Ema' | 'Hiro';
  choices: Array<{
    text: string;
    targetScene: string;
    type?: TrialChoiceType;
  }>;
}

export interface ScriptExecution {
  type: 'execution';
  targetScene: string;
}

export interface ScriptLabel {
  type: 'label';
  name: string;
}

export interface ScriptSetVar {
  type: 'set_var';
  key: string;
  value: any;
  operator?: '=' | '+=' | '-=';
}

export interface ScriptCondition {
  type: 'condition';
  if: string;
  then: string;
  else?: string;
}

// ============= 所有 Line 类型 =============
export type ScriptLine = ScriptText | ScriptCommand | ScriptChoice | ScriptTrialChoice | ScriptExecution | ScriptLabel | ScriptSetVar | ScriptCondition;

// ============= Debate 场景配置 =============
export interface DebateSceneConfig {
  portraitPath?: string;
  portraitSide?: 'left' | 'right';
  tiltAngle?: number;
}

// ============= 场景定义 =============
export interface GameScene {
  id: string;
  type: SceneType;
  title?: string;
  lines: ScriptLine[];
  // debate 场景专用配置
  debateConfig?: DebateSceneConfig;
}

// ============= 角色状态 =============
export interface CharacterState {
  id: string;
  /** 外观组合列表，如 ["Surprised1"] 或 ["Normal1", "ArmR3"] */
  appearance: string[];
  position: string | number;  // 横向位置 (0-100)
  posY?: number;              // 纵向位置偏移 (%)
  visible: boolean;
  flipX?: boolean; // 水平翻转
  zIndex: number; // 层级控制
}

export interface CharacterDialogueUpdate {
  id: string;
  pose?: string;
  position?: string | number;
}

// ============= 游戏脚本 =============
export interface GameScript {
  title: string;
  scenes: GameScene[];
}

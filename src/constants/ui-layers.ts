/**
 * 统一管理游戏界面层级 (z-index)
 */
export const UI_LAYERS = {
  // 全局最顶层，加载动画
  LOADING: 5000,

  // 全局过场动画层
  TRANSITION: 3000,

  // 审判选项界面 (应高于辩论和其他 UI)
  TRIAL_CHOICE: 2000,

  // 执行按钮界面 (与审判选项同级)
  EXECUTION_BUTTON: 2000,

  // 历史记录界面
  LOG: 1800,

  // 设置界面
  OPTIONS: 1700,

  // 画廊界面
  GALLERY: 1600,

  // 存档/读档界面
  SAVE_LOAD: 1500,

  // UI 持久化容器 (包含大多数功能按钮和面板的基础容器)
  UI_PERSISTENT_CONTAINER: 1000,

  // 普通剧情选项遮罩
  CHOICE_OVERLAY: 500,

  // 审判讨论界面 (辩论)
  DEBATE: 200,

  // 普通对话框容器
  NORMAL_PRINTER: 200,

  // 魔女之书界面 (较低层级，通常作为底板功能)
  WITCH_BOOK: 100
} as const

/**
 * Hanna 角色组合配置
 * 基于 Naninovel 的 CompositionMap 格式
 */
import type { CharacterCompositionConfig } from '../../types/composition'
import { buildCompositionConfig } from '../../types/composition'

/** Hanna 的原始组合映射数据 */
const compositionMapData = [
  // ============ 左手臂 ArmL ============
  { Key: 'ArmL1', Composition: 'Angle01/ArmL>ArmL01,Angle01/ArmL_EffectF>ArmL01_Softlight' },
  { Key: 'ArmL2', Composition: 'Angle01/ArmL>ArmL02,Angle01/ArmL_EffectF>ArmL02_Softlight' },
  
  // ============ 右手臂 ArmR ============
  { Key: 'ArmR1', Composition: 'Angle01/ArmR>ArmR01,Angle01/ArmR_EffectF>ArmR01_Softlight' },
  { Key: 'ArmR2', Composition: 'Angle01/ArmR>ArmR02,Angle01/ArmR_EffectF>ArmR02_Overlay' },
  { Key: 'ArmR3', Composition: 'Angle01/ArmR>ArmR03,Angle01/ArmR_EffectF-' },
  { Key: 'ArmR4', Composition: 'Angle01/ArmR>ArmR04,Angle01/ArmR_EffectF-' },
  
  // ============ 头部 Head ============
  { Key: 'Head1', Composition: 'Angle01/Head02-,Angle01/Head01+Facial01_Softlight,Angle01/Head01+HeadBase01,Angle01/HairB>HairB01' },
  
  // ============ 苍白效果 Pale ============
  { Key: 'Pale1-1', Composition: 'Angle01/Head01/Facial01/Pale01>Pale01_01' },
  { Key: 'Pale1-Off', Composition: 'Angle01/Head01/Facial01/Pale01-' },
  
  // ============ 汗滴效果 Sweat ============
  { Key: 'Sweat1-1', Composition: 'Angle01/Head01/Facial01/Sweat01>Sweat01_01' },
  { Key: 'Sweat1-Off', Composition: 'Angle01/Head01/Facial01/Sweat01-' },
  
  // ============ 脸颊 Cheeks ============
  { Key: 'Cheeks1-Normal', Composition: 'Angle01/Head01/Facial01/Cheeks01>Cheeks01_Normal' },
  { Key: 'Cheeks1-Flushed', Composition: 'Angle01/Head01/Facial01/Cheeks01>Cheeks01_Flushed' },
  { Key: 'Cheeks1-Off', Composition: 'Angle01/Head01/Facial01/Cheeks01-' },
  
  // ============ 表情预设 ============
  { Key: 'Normal1', Composition: 'Head1,Pale1-Off,Sweat1-Off,Cheeks1-Normal,Angle01/Head01/Facial01/Eyes01>Eyes01_Normal_Open,Angle01/Head01/Facial01/Mouth01>Mouth01_Normal_Open' },
  { Key: 'Smile1', Composition: 'Head1,Pale1-Off,Sweat1-Off,Cheeks1-Normal,Angle01/Head01/Facial01/Eyes01>Eyes01_Smile_Closed,Angle01/Head01/Facial01/Mouth01>Mouth01_Smile_Open' },
  { Key: 'Angry1', Composition: 'Head1,Pale1-Off,Sweat1-Off,Cheeks1-Normal,Angle01/Head01/Facial01/Eyes01>Eyes01_Angry_Open,Angle01/Head01/Facial01/Mouth01>Mouth01_Angry_Open01' },
  { Key: 'Pensive1', Composition: 'Head1,Pale1-Off,Sweat1-Off,Cheeks1-Normal,Angle01/Head01/Facial01/Eyes01>Eyes01_Pensive_Open,Angle01/Head01/Facial01/Mouth01>Mouth01_Pensive_Closed' },
  { Key: 'Cry1', Composition: 'Head1,Pale1-Off,Sweat1-Off,Cheeks1-Normal,Angle01/Head01/Facial01/Eyes01>Eyes01_Cry_Closed,Angle01/Head01/Facial01/Mouth01>Mouth01_Cry_Open' },
  { Key: 'Flushed1', Composition: 'Head1,Pale1-Off,Sweat1-Off,Cheeks1-Flushed,Angle01/Head01/Facial01/Eyes01>Eyes01_Flushed_Open,Angle01/Head01/Facial01/Mouth01>Mouth01_Flushed_Closed' },
  { Key: 'Surprised1', Composition: 'Head1,Pale1-Off,Sweat1-1,Cheeks1-Normal,Angle01/Head01/Facial01/Eyes01>Eyes01_Surprised_Open,Angle01/Head01/Facial01/Mouth01>Mouth01_Surprised_Open' },
  { Key: 'Fearful1', Composition: 'Head1,Pale1-1,Sweat1-Off,Cheeks1-Off,Angle01/Head01/Facial01/Eyes01>Eyes01_Fearful_Open,Angle01/Head01/Facial01/Mouth01>Mouth01_Fearful_Open' },
  
  // ============ 别名/快捷方式 ============
  { Key: 'Default', Composition: 'Normal1' },
  { Key: 'Smile', Composition: 'Smile1' },
  { Key: 'Angry', Composition: 'Angry1' },
  { Key: 'Pensive', Composition: 'Pensive1' },
  { Key: 'Cry', Composition: 'Cry1' },
  { Key: 'Flushed', Composition: 'Flushed1' },
  { Key: 'Surprised', Composition: 'Surprised1' },
  { Key: 'Fearful', Composition: 'Fearful1' },
]

/** 默认外观 */
const defaultAppearance = 'ArmL1,ArmR3,Default'

/** 构建并导出 Hanna 的组合配置 */
export const HannaCompositionConfig: CharacterCompositionConfig = buildCompositionConfig(
  'Hanna',
  '远野汉娜',
  compositionMapData,
  defaultAppearance
)

export default HannaCompositionConfig

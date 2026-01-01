/**
 * Margo 角色组合配置
 * 基于 Naninovel 的 CompositionMap 格式
 */
import type { CharacterCompositionConfig } from '../../types/composition'
import { buildCompositionConfig } from '../../types/composition'

/** Margo 的原始组合映射数据 */
const compositionMapData = [
  // ============ 左手臂 ArmL ============
  { Key: 'ArmL1', Composition: 'Angle01/ArmL>ArmL01,Angle01/Effect_Front_ArmL-,Angle01/Effect_Back_ArmL-' },
  { Key: 'ArmL2', Composition: 'Angle01/ArmL>ArmL02,Angle01/Effect_Front_ArmL>Effect_Front_ArmL02,Angle01/Effect_Back_ArmL>Effect_Back_ArmL02' },
  { Key: 'ArmL3', Composition: 'Angle01/ArmL>ArmL03,Angle01/Effect_Front_ArmL>Effect_Front_ArmL03,Angle01/Effect_Back_ArmL>Effect_Back_ArmL03' },
  { Key: 'ArmL4', Composition: 'Angle01/ArmL>ArmL04,Angle01/Effect_Front_ArmL>Effect_Front_ArmL04,Angle01/Effect_Back_ArmL>Effect_Back_ArmL04' },
  { Key: 'ArmL5', Composition: 'Angle01/ArmL>ArmL05,Angle01/Effect_Front_ArmL>Effect_Front_ArmL05,Angle01/Effect_Back_ArmL>Effect_Back_ArmL05' },
  
  // ============ 右手臂 ArmR ============
  { Key: 'ArmR1', Composition: 'Angle01/ArmR>ArmR01,Angle01/Effect_Front_ArmR>Effect_Front_ArmR01,Angle01/Effect_Back_ArmR-' },
  { Key: 'ArmR2', Composition: 'Angle01/ArmR>ArmR02,Angle01/Effect_Front_ArmR>Effect_Front_ArmR02,Angle01/Effect_Back_ArmR>Effect_Back_ArmR02' },
  { Key: 'ArmR3', Composition: 'Angle01/ArmR>ArmR03,Angle01/Effect_Front_ArmR>Effect_Front_ArmR03,Angle01/Effect_Back_ArmR>Effect_Back_ArmR03' },
  { Key: 'ArmR4', Composition: 'Angle01/ArmR>ArmR04,Angle01/Effect_Front_ArmR>Effect_Front_ArmR04,Angle01/Effect_Back_ArmR>Effect_Back_ArmR04' },
  { Key: 'ArmR5', Composition: 'Angle01/ArmR>ArmR05,Angle01/Effect_Front_ArmR>Effect_Front_ArmR05,Angle01/Effect_Back_ArmR>Effect_Back_ArmR05' },
  { Key: 'ArmR6', Composition: 'Angle01/ArmR>ArmR06,Angle01/Effect_Front_ArmR>Effect_Front_ArmR06,Angle01/Effect_Back_ArmR>Effect_Back_ArmR06' },
  { Key: 'ArmR7', Composition: 'Angle01/ArmR>ArmR07,Angle01/Effect_Front_ArmR>Effect_Front_ArmR07,Angle01/Effect_Back_ArmR>Effect_Back_ArmR07' },
  
  // ============ 苍白效果 Pale ============
  { Key: 'Pale-1', Composition: 'Angle01/Facial/Pale>Pale01' },
  { Key: 'Pale-Off', Composition: 'Angle01/Facial/Pale-' },
  
  // ============ 汗滴效果 Sweat ============
  { Key: 'Sweat-1', Composition: 'Angle01/Facial/Sweat>Sweat01' },
  { Key: 'Sweat-Off', Composition: 'Angle01/Facial/Sweat-' },
  
  // ============ 脸颊 Cheeks ============
  { Key: 'Cheeks-Normal', Composition: 'Angle01/Facial/Cheeks>Cheeks_Normal' },
  { Key: 'Cheeks-Flushed', Composition: 'Angle01/Facial/Cheeks>Cheeks_Flushed' },
  { Key: 'Cheeks-Off', Composition: 'Angle01/Facial/Cheeks-' },
  
  // ============ 表情预设 ============
  { Key: 'Normal1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Normal_Open,Angle01/Facial/Mouth>Mouth_Normal_Closed' },
  { Key: 'Smile1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Smile_Open,Angle01/Facial/Mouth>Mouth_Smile_Open' },
  { Key: 'Angry1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Angry_Open,Angle01/Facial/Mouth>Mouth_Angry_Closed' },
  { Key: 'Pensive1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Pensive_Open,Angle01/Facial/Mouth>Mouth_Pensive_Open' },
  { Key: 'Cry1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Cry_Open,Angle01/Facial/Mouth>Mouth_Cry_Closed' },
  { Key: 'Flushed1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Flushed,Angle01/Facial/Eyes>Eyes_Pensive_Middle,Angle01/Facial/Mouth>Mouth_Smile_Middle' },
  { Key: 'Surprised1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Surprised_Open,Angle01/Facial/Mouth>Mouth_Surprised_Open' },
  { Key: 'Fearful1', Composition: 'Pale-1,Sweat-Off,Cheeks-Off,Angle01/Facial/Eyes>Eyes_Fearful_Open,Angle01/Facial/Mouth>Mouth_Pensive_Closed' },
  
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
const defaultAppearance = 'ArmL1,ArmR1,Default'

/** 构建并导出 Margo 的组合配置 */
export const MargoCompositionConfig: CharacterCompositionConfig = buildCompositionConfig(
  'Margo',
  '宝生玛格',
  compositionMapData,
  defaultAppearance
)

export default MargoCompositionConfig

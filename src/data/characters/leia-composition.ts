/**
 * Leia 角色组合配置
 * 基于 Naninovel 的 CompositionMap 格式
 */
import type { CharacterCompositionConfig } from '../../types/composition'
import { buildCompositionConfig } from '../../types/composition'

/** Leia 的原始组合映射数据 */
const compositionMapData = [
  // ============ 双手臂 Arms ============
  { Key: 'Arms', Composition: 'Angle01/Arms>Arms01,Angle01/ArmR-,Angle01/ArmL-,Angle01/Shadow_ArmL-,Angle01/Shadow_ArmR-,Angle01/Shadow_Arms>Shadow_Arms01' },
  
  // ============ 左手臂 ArmL ============
  { Key: 'ArmL1', Composition: 'Angle01/ArmL>ArmL01,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL-' },
  { Key: 'ArmL2', Composition: 'Angle01/ArmL>ArmL02,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL-' },
  { Key: 'ArmL3', Composition: 'Angle01/ArmL>ArmL03,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL>Shadow_ArmL03' },
  { Key: 'ArmL4', Composition: 'Angle01/ArmL>ArmL04,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL>Shadow_ArmL04' },
  { Key: 'ArmL5', Composition: 'Angle01/ArmL>ArmL05,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL>Shadow_ArmL05' },
  { Key: 'ArmL6', Composition: 'Angle01/ArmL>ArmL06,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL-' },
  { Key: 'ArmL7', Composition: 'Angle01/ArmL>ArmL07,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL-' },
  { Key: 'ArmL8', Composition: 'Angle01/ArmL>ArmL08,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL-' },
  { Key: 'ArmL9', Composition: 'Angle01/ArmL>ArmL09,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL-' },
  { Key: 'ArmL10', Composition: 'Angle01/ArmL>ArmL10,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmL-' },
  
  // ============ 右手臂 ArmR ============
  { Key: 'ArmR1', Composition: 'Angle01/ArmR>ArmR01,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR2', Composition: 'Angle01/ArmR>ArmR02,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR3', Composition: 'Angle01/ArmR>ArmR03,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR4', Composition: 'Angle01/ArmR>ArmR04,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR5', Composition: 'Angle01/ArmR>ArmR05,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR>Shadow_ArmR05' },
  { Key: 'ArmR6', Composition: 'Angle01/ArmR>ArmR06,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR7', Composition: 'Angle01/ArmR>ArmR07,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR8', Composition: 'Angle01/ArmR>ArmR08,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR9', Composition: 'Angle01/ArmR>ArmR09,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  { Key: 'ArmR10', Composition: 'Angle01/ArmR>ArmR10,Angle01/Arms-,Angle01/Shadow_Arms-,Angle01/Shadow_ArmR-' },
  
  // ============ 苍白效果 Pale ============
  { Key: 'Pale-1', Composition: 'Angle01/Facial/Pale>Pale01' },
  { Key: 'Pale-2', Composition: 'Angle01/Facial/Pale>Pale02' },
  { Key: 'Pale-Off', Composition: 'Angle01/Facial/Pale-' },
  
  // ============ 汗滴效果 Sweat ============
  { Key: 'Sweat-1', Composition: 'Angle01/Facial/Sweat>Sweat01' },
  { Key: 'Sweat-Off', Composition: 'Angle01/Facial/Sweat-' },
  
  // ============ 脸颊 Cheeks ============
  { Key: 'Cheeks-Normal', Composition: 'Angle01/Facial/Cheeks>Normal' },
  { Key: 'Cheeks-Flushed', Composition: 'Angle01/Facial/Cheeks>Flushed' },
  { Key: 'Cheeks-Off', Composition: 'Angle01/Facial/Cheeks-' },
  
  // ============ 表情预设 ============
  { Key: 'Normal1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Normal_Open01,Angle01/Facial/Mouth>Mouth_Normal_Closed' },
  { Key: 'Smile1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Smile_Open,Angle01/Facial/Mouth>Mouth_Smile_Open01' },
  { Key: 'Angry1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Angry_Open02,Angle01/Facial/Mouth>Mouth_Angry_Closed' },
  { Key: 'Pensive1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Pensive_Open,Angle01/Facial/Mouth>Mouth_Pensive_Closed' },
  { Key: 'Cry1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Cry_Open,Angle01/Facial/Mouth>Mouth_Cry_Closed01' },
  { Key: 'Flushed1', Composition: 'Pale-Off,Sweat-1,Cheeks-Flushed,Angle01/Facial/Eyes>Eyes_Uncomfortable_Open01,Angle01/Facial/Mouth>Mouth_Neutral_Closed' },
  { Key: 'Surprised1', Composition: 'Pale-Off,Sweat-Off,Cheeks-Normal,Angle01/Facial/Eyes>Eyes_Surprised_Open01,Angle01/Facial/Mouth>Mouth_Surprised_Open' },
  { Key: 'Fearful1', Composition: 'Pale-2,Sweat-1,Cheeks-Off,Angle01/Facial/Eyes>Eyes_Fearful_Open,Angle01/Facial/Mouth>Mouth_Fearful_Open' },
  
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

/** 构建并导出 Leia 的组合配置 */
export const LeiaCompositionConfig: CharacterCompositionConfig = buildCompositionConfig(
  'Leia',
  '莲见蕾雅',
  compositionMapData,
  defaultAppearance
)

export default LeiaCompositionConfig

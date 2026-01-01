export interface WitchBookItem {
  id: string
  name: string
  description: string
  thumbnail: string
}

export interface ProfileItem extends WitchBookItem {
  age?: string
  height?: string
  weight?: string
  occupation?: string
}

export const mockClues: WitchBookItem[] = [
  {
    id: 'clue_01',
    name: '魔女的信件',
    description: '一封封蜡完好的信件，上面散发着淡淡的薰衣草香气。里面提到了一场即将举行的晚宴。',
    thumbnail: '/UI_Common/BookButton.png' // 使用一个实际的内容图标
  },
  {
    id: 'clue_02',
    name: '银色怀表',
    description: '一个停在12:00的怀表。表盖内侧刻着“献给最亲爱的人”。',
    thumbnail: '/UI_Adv/AutoToggle_On.png'
  },
  {
    id: 'clue_03',
    name: '破碎的魔药瓶',
    description: '残留着紫色液体的玻璃碎片。液体的气味刺鼻，令人眩晕。',
    thumbnail: '/UI_Menu/WiFi_Notice.png'
  }
]

export const mockProfiles: ProfileItem[] = [
  {
    id: 'char_margaret',
    name: '玛格丽特',
    description: '审判庭的最高长官。性格冷酷严谨，深受属下敬畏。',
    thumbnail: '/UI_Common/BookButton.png',
    age: '24',
    height: '168cm',
    occupation: '审判官'
  },
  {
    id: 'char_noah',
    name: '诺亚',
    description: '神秘的炼金术士，总是带着一种若有若无的微笑。',
    thumbnail: '/UI_Common/BookButton.png',
    age: '19',
    height: '175cm',
    occupation: '炼金术士'
  }
]

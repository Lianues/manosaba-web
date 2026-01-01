/**
 * Naninovel (.nani) 转 JSON 脚本格式转换器
 * 支持新的立绘组合系统
 */

// 角色名映射表（英文ID -> 中文名）
const CHARACTER_MAP: Record<string, string> = {
  'Ema': '樱羽艾玛',
  'Hiro': '二阶堂希罗',
  'Warden': '典狱长',
  'Unknown': '???',
  'Coco': '泽渡可可',
  'Hanna': '远野汉娜',
  'Milia': '佐伯米莉亚',
}

// 支持的角色列表
const SUPPORTED_CHARACTERS = ['Ema', 'Hiro', 'Warden']

// SFX 路径映射
const SFX_MAP: Record<string, string> = {
  'Sfx_1': 'Sfx_Scenario_001 Wake up.ogg',
  'Sfx_3': 'Sfx_Scenario_003 Monitor.ogg',
  'Sfx_4': 'Sfx_Scenario_004 Lock prison.ogg',
  'Sfx_5': 'Sfx_Scenario_005 Hikizuru oto.ogg',
  'Sfx_6': 'Sfx_Scenario_006 Fall down.ogg',
  'Sfx_18': 'Sfx_Scenario_018 Reject shake hands.ogg',
  'Sfx_178': 'Sfx_Scenario_178 Landing sound.ogg',
}

/**
 * 将 Nani 背景ID 转换为实际文件路径
 */
function convertBackgroundPath(bgId: string, bgType: 'MainBackground' | 'Stills' | 'Tricks' = 'MainBackground'): string {
  const match = bgId.match(/^(\d+)_(\d+)$/)
  if (!match) {
    return `/Background/${bgType}/RGB/${bgId}.png`
  }
  
  const [, major, minor] = match
  const paddedMajor = major.padStart(3, '0')
  const paddedMinor = minor.padStart(3, '0')
  
  if (bgType === 'Stills') {
    return `/Background/Stills/RGB/Still_${paddedMajor}_${paddedMinor}.png`
  } else if (bgType === 'Tricks') {
    return `/Background/Tricks/RGB/Trick_${paddedMajor}_${paddedMinor}.png`
  } else {
    return `/Background/MainBackground/RGB/Background_${paddedMajor}_${paddedMinor}.png`
  }
}

/**
 * 将 SFX ID 转换为实际路径
 */
function convertSfxPath(sfxId: string): string {
  if (SFX_MAP[sfxId]) {
    const fileName = SFX_MAP[sfxId]
    if (fileName.startsWith('Sfx_Common')) {
      return `/Audio/SFX/Common/${fileName}`
    } else {
      return `/Audio/SFX/Scenario/${fileName}`
    }
  }
  
  const match = sfxId.match(/^Sfx_(\d+)$/)
  if (match) {
    const num = match[1].padStart(3, '0')
    return `/Audio/SFX/Scenario/Sfx_Scenario_${num}.ogg`
  }
  
  return `/Audio/SFX/${sfxId}.ogg`
}

interface ConvertOptions {
  sceneId: string
  sceneType?: 'traditional' | 'trial' | 'debate'
  voiceBasePath?: string
  voicePrefix?: string
}

interface ScriptLine {
  type: string
  [key: string]: unknown
}

interface VoiceCounter {
  [character: string]: number
}

/**
 * 解析 @char 命令
 * 支持新的组合系统语法：
 * - @char Ema.Surprised1 pos:50
 * - @char Ema.Normal1,ArmR3 pos:50
 * - @char Hiro.Head1,Pale1-Off,...,Angle01/Head01/Facial01/Eyes01>Eyes01_Angry_Open pos:45
 * - @char SubId:"Middle" Warden.1 Scale:1.4 -> 中间层角色（单张立绘）
 */
function parseCharCommand(line: string): ScriptLine | null {
  // 检查是否是 SubId 类型的角色（中间层立绘）
  if (line.includes('SubId:')) {
    const subIdMatch = line.match(/SubId:"([^"]+)"/);
    const charMatch = line.match(/([A-Za-z]+)\.(\d+)/);
    const scaleMatch = line.match(/Scale:([\d.]+)/);
    
    if (subIdMatch && charMatch) {
      const subId = subIdMatch[1];  // "Middle"
      const charId = charMatch[1];   // "Warden"
      const variant = charMatch[2];  // "1"
      const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      
      return {
        type: 'command',
        command: 'charMiddle',
        params: {
          id: charId,
          variant: variant,
          subId: subId,
          scale: scale
        }
      };
    }
    return null;
  }
  
  const match = line.match(/@char\s+([A-Za-z]+)(?:\.([^\s]+))?(?:\s+pos:(\d+))?/)
  if (!match) {
    return null
  }
  
  const charId = match[1]
  const appearanceStr = match[2] || 'Default'
  const position = match[3] ? parseInt(match[3]) : 50
  
  if (!SUPPORTED_CHARACTERS.includes(charId)) {
    return null
  }
  
  const appearance = appearanceStr.split(',').map(s => s.trim()).filter(Boolean)
  
  return {
    type: 'command',
    command: 'char',
    params: {
      id: charId,
      appearance: appearance,
      position: position
    }
  }
}

/**
 * 解析隐藏角色命令
 */
function parseHideCharsCommand(line: string): ScriptLine | null {
  if (line.startsWith('@hideChars')) {
    return {
      type: 'command',
      command: 'hideChars'
    }
  }
  
  const hideMatch = line.match(/@hide\s+([A-Za-z]+)/)
  if (hideMatch) {
    const charId = hideMatch[1]
    if (SUPPORTED_CHARACTERS.includes(charId)) {
      return {
        type: 'command',
        command: 'hideChar',
        params: {
          id: charId
        }
      }
    }
  }
  
  return null
}

/**
 * 解析 @print 命令
 */
function parsePrintCommand(line: string, voiceCounter: VoiceCounter, options: ConvertOptions): ScriptLine | null {
  const textMatch = line.match(/@print\s+"([^"]*)"/);
  if (!textMatch) return null;
  
  let text = textMatch[1];
  text = text.replace(/<br>/g, '\n');
  text = text.replace(/　/g, ' ');
  
  const result: ScriptLine = {
    type: 'text',
    text: text
  };
  
  const authorMatch = line.match(/author:"([^"]+)"/);
  if (authorMatch) {
    const authorId = authorMatch[1];
    result.speaker = CHARACTER_MAP[authorId] || authorId;
    
    if (options.voiceBasePath && options.voicePrefix) {
      voiceCounter[authorId] = (voiceCounter[authorId] || 0) + 1;
      const voiceNum = voiceCounter[authorId].toString().padStart(3, '0');
      result.voice = `${options.voiceBasePath}/${options.voicePrefix}_${authorId}${voiceNum}.ogg`;
    }
  }
  
  return result;
}

/**
 * 解析 @bgm 命令
 * 直接保留简写格式，让 game.ts 在运行时解析
 */
function parseBgmCommand(line: string): ScriptLine | null {
  const match = line.match(/@bgm\s+"([^"]+)"/);
  if (!match) return null;
  
  const bgmId = match[1];
  
  return {
    type: 'command',
    command: 'bgm',
    params: { path: bgmId }  // 直接保留简写格式，如 "Ambi_11_1"
  };
}

/**
 * 解析 @StopBgm 命令
 */
function parseStopBgmCommand(line: string): ScriptLine | null {
  if (line.trim().toLowerCase() === '@stopbgm') {
    return {
      type: 'command',
      command: 'bgm',
      params: { action: 'stop' }
    };
  }
  return null;
}

/**
 * 解析 @sfx 命令
 */
function parseSfxCommand(line: string): ScriptLine | null {
  const match = line.match(/@sfx\s+"([^"]+)"/);
  if (!match) return null;
  
  const sfxId = match[1];
  const sfxPath = convertSfxPath(sfxId);
  
  return {
    type: 'command',
    command: 'sfx',
    params: { path: sfxPath }
  };
}

/**
 * 解析 @back 命令（背景）
 */
function parseBackCommand(line: string): ScriptLine | null {
  const isStills = line.includes('Id:"Stills"');
  const isTransparent = line.includes('Transparent');
  const isSolidColor = line.includes('SolidColor');
  
  const bgIdMatch = line.match(/@back\s+(?:SubId:"[^"]+"\s+)?([\d]+_[\d]+)/);
  
  if (!bgIdMatch && !isTransparent && !isSolidColor) {
    return null;
  }
  
  const params: Record<string, unknown> = {};
  
  if (bgIdMatch) {
    const bgId = bgIdMatch[1];
    const bgType = isStills ? 'Stills' : 'MainBackground';
    params.path = convertBackgroundPath(bgId, bgType);
  } else if (isSolidColor) {
    // SolidColor 表示纯色遮罩（通常用于 Overlay 层）
    params.path = 'SolidColor';
  } else {
    params.path = null;
  }
  
  const subIdMatch = line.match(/SubId:"([^"]+)"/);
  if (subIdMatch) params.subId = subIdMatch[1];
  
  const posMatch = line.match(/pos:\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+))?/);
  if (posMatch) {
    params.posX = parseFloat(posMatch[1]);
    if (posMatch[2] !== undefined) {
      params.posY = parseFloat(posMatch[2]);
    }
  }
  
  const scaleMatch = line.match(/Scale:\s*(-?[\d.]+)/);
  if (scaleMatch) {
    params.scale = parseFloat(scaleMatch[1]);
  }
  
  const timeMatch = line.match(/time:([\d.]+)/);
  if (timeMatch) {
    params.duration = parseFloat(timeMatch[1]);
  }
  
  return {
    type: 'command',
    command: 'bg',
    params: params
  };
}

/**
 * 解析 @Wait 命令
 */
function parseWaitCommand(line: string): ScriptLine | null {
  const match = line.match(/@Wait\s+(?:"([^"]+)"|([\d.]+))/i);
  if (!match) return null;
  
  const waitTime = match[1] || match[2];
  
  return {
    type: 'command',
    command: 'wait',
    params: { time: parseFloat(waitTime!) }
  };
}

/**
 * 解析 @printer 命令
 * @printer Normal.Stream -> 切换到直播模式
 * @printer Normal.Default -> 切换到默认模式
 */
function parsePrinterCommand(line: string): ScriptLine | null {
  const match = line.match(/@printer\s+([A-Za-z]+)\.([A-Za-z]+)/i);
  if (!match) return null;
  
  const printerType = match[1]; // Normal
  const appearance = match[2];  // Stream, Default
  
  return {
    type: 'command',
    command: 'printer',
    params: {
      type: printerType,
      appearance: appearance.toLowerCase() // stream, default
    }
  };
}

/**
 * 解析标签 # xxx
 */
function parseLabelCommand(line: string): ScriptLine | null {
  const match = line.match(/^#\s*(.+)$/);
  if (!match) return null;
  
  return {
    type: 'label',
    name: match[1].trim()
  };
}

/**
 * 主转换函数
 */
export function convertNaniToJson(naniContent: string, options: ConvertOptions): object {
  const lines = naniContent.split(/\r?\n/);
  const scriptLines: ScriptLine[] = [];
  const voiceCounter: VoiceCounter = {};
  
  for (const rawLine of lines) {
    const line = rawLine.trim();
    
    if (!line || line.startsWith(';')) continue;
    
    let parsed: ScriptLine | null = null;
    
    if (line.startsWith('#')) {
      parsed = parseLabelCommand(line);
    }
    else if (line.startsWith('@char')) {
      parsed = parseCharCommand(line);
    }
    else if (line.startsWith('@hideChars') || line.startsWith('@hide ')) {
      parsed = parseHideCharsCommand(line);
    }
    else if (line.toLowerCase().startsWith('@printer')) {
      parsed = parsePrinterCommand(line);
    }
    else if (line.startsWith('@print')) {
      parsed = parsePrintCommand(line, voiceCounter, options);
    }
    else if (line.startsWith('@bgm')) {
      parsed = parseBgmCommand(line);
    }
    else if (line.toLowerCase().startsWith('@stopbgm')) {
      parsed = parseStopBgmCommand(line);
    }
    else if (line.startsWith('@back')) {
      parsed = parseBackCommand(line);
    }
    else if (line.startsWith('@sfx')) {
      parsed = parseSfxCommand(line);
    }
    else if (line.toLowerCase().startsWith('@wait')) {
      parsed = parseWaitCommand(line);
    }
    
    if (parsed) {
      scriptLines.push(parsed);
    }
  }
  
  const scene = {
    id: options.sceneId,
    type: options.sceneType || 'traditional',
    lines: scriptLines
  };
  
  return scene;
}

/**
 * 生成完整的 GameScript 格式
 */
export function generateGameScript(scenes: object[], title: string = '魔女审判'): object {
  return {
    title,
    scenes
  };
}

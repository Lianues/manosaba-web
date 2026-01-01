import type { TransitionEffect } from './types';
import { 
  fadeEffect, 
  blindsEffect, 
  wipeEffect, 
  circleEffect, 
  clockWipeEffect, 
  splitEffect,
  glitchEffect
} from './effects';

export const TransitionRegistry: Record<string, TransitionEffect> = {
  'fade-black': fadeEffect,
  'fade-white': fadeEffect,
  'blinds': blindsEffect,
  'wipe-lr': wipeEffect,
  'circle-out': circleEffect,
  'clock-wipe': clockWipeEffect,
  'split-v': splitEffect,
  'glitch': glitchEffect,
};

/**
 * 获取注册的过场动画效果
 */
export function getTransitionEffect(name: string): TransitionEffect {
  const effect = TransitionRegistry[name];
  if (!effect) {
    console.warn(`Transition effect "${name}" not found, falling back to fade-black.`);
    return fadeEffect;
  }
  return effect;
}

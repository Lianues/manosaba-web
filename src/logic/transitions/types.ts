import gsap from 'gsap';

export interface TransitionContext {
  container: HTMLElement;
  slats: HTMLElement[];
  duration: number;
  onMidpoint: () => void;
  params?: Record<string, any>;
}

export type TransitionEffect = (ctx: TransitionContext) => gsap.core.Timeline;

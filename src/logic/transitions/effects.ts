import gsap from 'gsap';
import type { TransitionEffect } from './types';

// 1. Fade (Black or White)
export const fadeEffect: TransitionEffect = ({ container, duration, onMidpoint, params }) => {
  const sec = duration / 1000;
  const color = params?.style === 'fade-white' ? 'white' : 'black';
  
  const tl = gsap.timeline();
  tl.set(container, { opacity: 0, backgroundColor: color, clipPath: 'none', filter: 'none' });
  tl.to(container, { 
    opacity: 1, 
    duration: sec * 0.45, 
    onComplete: onMidpoint 
  });
  tl.to(container, { opacity: 0, duration: sec * 0.45 }, "+=0.1");
  return tl;
};

// 2. 3D Blinds (百叶窗)
export const blindsEffect: TransitionEffect = ({ slats, duration, onMidpoint }) => {
  const sec = duration / 1000;
  const tl = gsap.timeline();
  
  const orderedSlats = [...slats].sort((a, b) => a.offsetLeft - b.offsetLeft);
  
  tl.set(orderedSlats, { rotationY: -90, opacity: 0, scaleX: 1.1 });
  
  tl.to(orderedSlats, {
    rotationY: 0,
    opacity: 1,
    duration: sec * 0.4,
    stagger: { each: 0.05, from: "start" },
    ease: "power2.out",
    onComplete: onMidpoint
  });
  
  tl.to({}, { duration: 0.15 });
  
  tl.to(orderedSlats, {
    rotationY: 90,
    opacity: 0,
    duration: sec * 0.4,
    stagger: { each: 0.05, from: "start" },
    ease: "power2.in"
  });
  
  return tl;
};

// 3. Wipe (擦除: 左右)
export const wipeEffect: TransitionEffect = ({ container, duration, onMidpoint }) => {
  const sec = duration / 1000;
  const tl = gsap.timeline();
  
  tl.set(container, { opacity: 1, backgroundColor: 'black', clipPath: 'inset(0 100% 0 0)' });
  tl.to(container, { 
    clipPath: 'inset(0 0% 0 0)', 
    duration: sec * 0.45, 
    ease: "power1.inOut",
    onComplete: onMidpoint 
  });
  tl.to(container, { 
    clipPath: 'inset(0 0% 0 100%)', 
    duration: sec * 0.45, 
    ease: "power1.inOut" 
  }, "+=0.1");
  
  return tl;
};

// 4. Circle (圆形扩张)
export const circleEffect: TransitionEffect = ({ container, duration, onMidpoint }) => {
  const sec = duration / 1000;
  const tl = gsap.timeline();
  
  tl.set(container, { opacity: 1, backgroundColor: 'black', clipPath: 'circle(0% at 50% 50%)' });
  tl.to(container, { 
    clipPath: 'circle(120% at 50% 50%)', 
    duration: sec * 0.45, 
    onComplete: onMidpoint 
  });
  tl.to(container, { 
    clipPath: 'circle(0% at 50% 50%)', 
    duration: sec * 0.45 
  }, "+=0.1");
  
  return tl;
};

// 5. Clock Wipe (时钟式擦除)
export const clockWipeEffect: TransitionEffect = ({ container, duration, onMidpoint }) => {
  const sec = duration / 1000;
  const tl = gsap.timeline();
  const obj = { angle: 0 };
  
  tl.set(container, { opacity: 1, backgroundColor: 'black', maskImage: 'conic-gradient(black 0deg, transparent 0deg)' });
  
  tl.to(obj, {
    angle: 360,
    duration: sec * 0.45,
    ease: "none",
    onUpdate: () => {
      container.style.maskImage = `conic-gradient(black ${obj.angle}deg, transparent ${obj.angle}deg)`;
      (container as any).style.webkitMaskImage = `conic-gradient(black ${obj.angle}deg, transparent ${obj.angle}deg)`;
    },
    onComplete: onMidpoint
  });
  
  tl.to(obj, {
    angle: 0,
    duration: sec * 0.45,
    ease: "none",
    onUpdate: () => {
      container.style.maskImage = `conic-gradient(transparent ${360 - obj.angle}deg, black ${360 - obj.angle}deg)`;
      (container as any).style.webkitMaskImage = `conic-gradient(transparent ${360 - obj.angle}deg, black ${360 - obj.angle}deg)`;
    }
  }, "+=0.1");
  
  return tl;
};

// 6. Split (纵向分割)
export const splitEffect: TransitionEffect = ({ container, duration, onMidpoint }) => {
  const sec = duration / 1000;
  const tl = gsap.timeline();
  
  tl.set(container, { opacity: 1, backgroundColor: 'black', clipPath: 'inset(50% 0 50% 0)' });
  tl.to(container, { 
    clipPath: 'inset(0% 0 0% 0)', 
    duration: sec * 0.45, 
    ease: "back.out(1.2)",
    onComplete: onMidpoint 
  });
  tl.to(container, { 
    clipPath: 'inset(50% 0 50% 0)', 
    duration: sec * 0.45,
    ease: "back.in(1.2)"
  }, "+=0.1");
  
  return tl;
};

// 7. Glitch (故障干扰)
export const glitchEffect: TransitionEffect = ({ container, duration, onMidpoint }) => {
  const sec = duration / 1000;
  const tl = gsap.timeline();
  
  tl.set(container, { opacity: 0, backgroundColor: '#1a1a1a', filter: 'hue-rotate(0deg) brightness(1)' });
  
  // 快速闪烁进入
  tl.to(container, { opacity: 1, duration: 0.1, repeat: 3, yoyo: true });
  tl.to(container, { 
    opacity: 1, 
    duration: sec * 0.3, 
    onStart: () => {
        // 随机位移抖动
        gsap.to(container, { x: 20, duration: 0.05, repeat: 10, yoyo: true });
    },
    onComplete: onMidpoint 
  });
  
  // 变色并退出
  tl.to(container, { filter: 'hue-rotate(180deg) brightness(2)', duration: 0.2 });
  tl.to(container, { opacity: 0, x: 0, duration: sec * 0.3 });
  
  return tl;
};

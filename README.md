# 魔法少女的魔女审判 Web 版本

## 直接体验：
https://manosaba.spinsnow.fun/

## public 目录文件树

```
public/
├── Audio/
│   ├── BGM‘/
│   ├── SFX/
│   └── Voice/
├── Background/
│   ├── MainBackground/
│   ├── Stills/
│   └── Tricks/
├── Characters/
├── fonts/
├── Home/
│   └── Background/
├── PerspectiveStage/
│   └── Court/
├── Story/
│   └── Act01_Chapter01/
├── UI_Adv/
│   ├── Choice/
│   └── Stream/
├── UI_Common/
├── UI_ExecutionButton/
├── UI_Log/
├── UI_Menu/
├── UI_Options/
├── UI_SaveLoad/
├── UI_Trial/
│   ├── Debate/
│   ├── Objection/
│   └── TimeUp/
├── UI_WitchBook_1/
└── UI_WitchBook_2/
```

这里Audio/ Background/需要你自己去解包拿完整资源，直接按照目录复制进去即可，我这里就是对照的解包目录

正常使用时，将官方naninovel剧本文件全部复制，然后丢进`tools/nani-converter.html`去转一下json，然后放进`public/Story/`里面即可


## 缺陷
目前才刚刚开发，尚有很多问题：
  - 立绘布局问题
  - 还没有做到审判部分
  - 其他等

目前只检查了第一章前5节，后续会慢慢加的


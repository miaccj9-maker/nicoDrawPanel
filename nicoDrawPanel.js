/* Qixian Draw Panel (Nico Draw Panel) - SillyTavern Extension v1.10.7
   角色抽屉面板：从屏幕顶部下拉展开角色资料卡 + 音乐播放器 + 图片库 + 弹幕歌词。
   所有样式类名 / ID / 全局变量统一使用 nico 前缀（nico-* / Nico-* / __nico_*），
   与 nicoPhone 系列组件保持命名一致，避免与其他扩展的旧前缀类名冲突。
   音乐播放器支持"搜歌名/歌手搜歌"（多引擎兜底搜索，自动校验可播直链）。
   v1.8.0 进度条+弹幕歌词；v1.9.0 导航编辑+快拍替换；v1.10.0 歌单移除+持久化。
   v1.10.2 手机端占满+图片限高62vh+拖拽条常驻；v1.10.3 滚动条彻底隐藏。
   v1.10.4 进度条拖动不打断播放；v1.10.5 配色跟随酒馆主题。
   v1.10.6 文字清晰度 + 防泛光精进：
     · 所有次要文字（Name/Height/age 标签、播放时间、占位符、歌单删除、GALLERY
       空提示等）不再使用主题 EmColor（该色在某些主题下与深色背景对比不足、
       发灰看不清），统一改为"主文字色 + 透明度"方案：文字永远基于
       --SmartThemeBodyColor，按透明度降为次要层级，任何深浅主题下都与背景
       保持高对比、清晰可见；
     · 移除面板/按钮/进度条上的强阴影（box-shadow 不再引用主题 ShadowColor），
       消除深色主题下的模块泛光感，界面更干净；
     · 歌词模块阴影减弱到刚好保证可读性，不产生光晕；
     · 纯 CSS 调整，零 JS 开销，不造成酒馆卡顿。
   v1.10.7 图片占满+手机端底部修复：
     · 图片库大图改为 width:100% + height:auto 等比例占满，移除 max-height:62vh
       与 object-fit:contain，消除竖图两侧留白，整图不裁切、不拉伸；
     · 面板高度改为 height:100vh;height:100dvh（dvh 优先），修复移动端浏览器
       地址栏导致的底部被截断——底部横线收起按钮与图片删除按钮现在可见可点；
     · 纯 CSS 调整，零 JS 开销，不造成酒馆卡顿。
   已移除原组件中的"全域文本阅读器"(STORY ARCHIVE / MutationObserver 文本捕获)。
   所有 DOM 直接注入酒馆主页面，无 iframe 间接层。 */
(function(){
'use strict';
try{console.log('%c[Nico-Draw-Panel] v1.10.6 已加载：文字清晰·防泛光·零卡顿','color:#818cf8;font-weight:bold');}catch(e){}

var CSS_ID='Nico-Draw-Style', PANEL_ID='Nico-Draw-Panel';

/* ============ CSS (scoped to panel, 已移除阅读器相关样式) ============ */
var CSS = `
#Nico-Draw-Panel{position:fixed;top:0;bottom:0;left:50%;transform:translate3d(-50%,-100%,0);z-index:9999!important;background:var(--SmartThemeBlurTintColor,#FFF)!important;color:var(--SmartThemeBodyColor,#000);width:100%;max-width:450px;height:100vh;height:100dvh;display:flex;flex-direction:column;font-family:-apple-system,sans-serif;box-shadow:0 2px 14px rgba(0,0,0,0.16);transition:transform .3s cubic-bezier(.25,.8,.25,1);will-change:transform;-webkit-backface-visibility:hidden;backface-visibility:hidden;overflow:hidden;contain:content;}
#Nico-Draw-Panel.is-open{transform:translate3d(-50%,0,0);}
@media(max-width:768px){#Nico-Draw-Panel{max-width:100%;left:0;box-shadow:none;transform:translate3d(0,-100%,0);}#Nico-Draw-Panel.is-open{transform:translate3d(0,0,0);}}
.nico-p-in{flex:1 1 0;min-height:0;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;scrollbar-color:transparent transparent;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
.nico-p-in::-webkit-scrollbar{display:none;}
/* 全局滚动条隐藏兜底：面板内任何滚动容器都不显示滚动条，滚动功能保留 */
#Nico-Draw-Panel, #Nico-Draw-Panel *{scrollbar-width:none;-ms-overflow-style:none;scrollbar-color:transparent transparent;}
#Nico-Draw-Panel::-webkit-scrollbar, #Nico-Draw-Panel ::-webkit-scrollbar{display:none;width:0;height:0;background:transparent;}
.nico-nav{position:relative;display:flex;align-items:center;justify-content:center;height:50px;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.12));font-weight:700;font-size:16px;margin-top:10px;flex-shrink:0;padding-top:env(safe-area-inset-top,0px);box-sizing:content-box;}
.nico-nav-txt{cursor:pointer;outline:none;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.nico-hdr{display:flex;align-items:center;padding:16px;gap:24px;flex-shrink:0;}
.nico-av-bx{position:relative;width:80px;height:80px;border-radius:50%;background:linear-gradient(45deg,#c0c0c0,#a0a0a0,#808080);padding:3px;flex-shrink:0;}
.nico-av-in{width:100%;height:100%;border-radius:50%;background:var(--SmartThemeChatTintColor,#fafafa);border:2px solid var(--SmartThemeBlurTintColor,#FFF);object-fit:cover;}
.nico-stats{display:flex;flex:1;justify-content:space-around;}
.nico-st-it{display:flex;flex-direction:column;align-items:center;}
.nico-st-v{font-size:16px;font-weight:700;}
.nico-st-l{font-size:13px;color:var(--SmartThemeBodyColor,#000);opacity:.62;}
.nico-bio{padding:0 16px 12px;font-size:14px;line-height:1.5;flex-shrink:0;}
.nico-b-id{font-weight:600;}
.nico-hlt{display:flex;gap:14px;padding:8px 16px 16px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;scrollbar-color:transparent transparent;-webkit-overflow-scrolling:touch;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.12));margin-bottom:12px;flex-shrink:0;transform:translateZ(0);}
.nico-hlt::-webkit-scrollbar{display:none;}
.nico-sty{display:flex;flex-direction:column;align-items:center;gap:4px;}
.nico-s-rng{width:60px;height:60px;border-radius:50%;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.12));background:var(--SmartThemeChatTintColor,#f5f5f7);padding:2px;cursor:pointer;}
.nico-s-in{width:100%;height:100%;border-radius:50%;background:var(--SmartThemeChatTintColor,#fafafa);object-fit:cover;}
.nico-s-nm{font-size:12px;color:var(--SmartThemeBodyColor,#000);}
.nico-s-rl{font-size:10px;color:var(--SmartThemeBodyColor,#000);opacity:.55;margin-top:-3px;}
.nico-m-box{margin:0 16px 16px;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.08));border-radius:12px;padding:12px;background:var(--SmartThemeChatTintColor,#fefefe);flex-shrink:0;}
.nico-m-inf{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.nico-m-prog{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-shrink:0;}
.nico-m-pt{font-size:10px;color:var(--SmartThemeBodyColor,#000);opacity:.55;min-width:32px;text-align:center;font-variant-numeric:tabular-nums;}
.nico-m-bar{flex:1;height:18px;display:flex;align-items:center;cursor:pointer;position:relative;touch-action:none;}
.nico-m-fill{position:absolute;left:0;top:50%;transform:translateY(-50%);height:4px;border-radius:2px;background:var(--SmartThemeBodyColor,#111);width:0%;pointer-events:none;}
.nico-m-knob{position:absolute;top:50%;left:0%;width:12px;height:12px;border-radius:50%;background:var(--SmartThemeBodyColor,#111);transform:translate(-50%,-50%);box-shadow:0 1px 3px rgba(0,0,0,0.2);pointer-events:none;transition:transform .15s;}
.nico-m-bar:active .nico-m-knob{transform:translate(-50%,-50%) scale(1.25);}
.nico-m-src{display:flex;gap:6px;margin-bottom:10px;align-items:center;}
.nico-m-src input{flex:1;min-width:0;background:var(--SmartThemeChatTintColor,#f0f0f2);border:none;border-radius:8px;padding:7px 10px;font-size:12px;color:var(--SmartThemeBodyColor,#222);outline:none;transition:all .2s;}
.nico-m-src input:focus{background:var(--SmartThemeChatTintColor,#e8e8eb);box-shadow:inset 0 0 0 1px var(--SmartThemeBorderColor,rgba(0,0,0,0.1));}
.nico-m-src input::placeholder{color:var(--SmartThemeBodyColor,#000);opacity:.42;}
.nico-m-src button{background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);border:none;border-radius:12px;padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all .2s cubic-bezier(0.25,0.8,0.25,1);flex-shrink:0;min-width:40px;}
.nico-m-src button:active{transform:scale(0.92);}
.nico-m-src button:disabled{opacity:.6;cursor:default;}
.nico-m-res{display:none;margin-bottom:10px;}
.nico-m-res.show{display:block;}
.nico-m-res-it{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 2px;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.05));}
.nico-m-res-name{font-size:12px;color:var(--SmartThemeBodyColor,#333);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;}
.nico-m-res-add{background:none;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.18));border-radius:10px;padding:3px 12px;font-size:11px;color:var(--SmartThemeBodyColor,#111);cursor:pointer;flex-shrink:0;transition:all .2s;}
.nico-m-res-add:active{transform:scale(0.92);background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);}
.nico-m-res-add.added{background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);border-color:var(--SmartThemeBodyColor,#111);pointer-events:none;}
.nico-m-tit{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;color:var(--SmartThemeBodyColor,#111);}
.nico-m-tmr{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--SmartThemeBodyColor,#000);font-weight:500;}
.nico-m-tmr input[type="number"]::-webkit-inner-spin-button,
.nico-m-tmr input[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
.nico-m-tmr input[type="number"]{-moz-appearance:textfield;}
.nico-m-tmr input{width:36px;background:var(--SmartThemeChatTintColor,#f0f0f2);border:none;border-radius:6px;text-align:center;font-size:12px;font-weight:600;color:var(--SmartThemeBodyColor,#222);padding:4px 0;outline:none;transition:all .2s;}
.nico-m-tmr input:focus{background:var(--SmartThemeChatTintColor,#e8e8eb);box-shadow:inset 0 0 0 1px var(--SmartThemeBorderColor,rgba(0,0,0,0.1));}
.nico-m-tmr button{background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);border:none;border-radius:12px;padding:4px 12px;font-size:10px;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all .2s cubic-bezier(0.25,0.8,0.25,1);}
.nico-m-tmr button:active{transform:scale(0.92);}
.nico-m-tmr button.on{background:#EF4444;box-shadow:0 2px 8px rgba(239,68,68,0.3);}
.nico-m-ctr{display:flex;justify-content:space-around;align-items:center;}
.nico-m-ctr svg{width:20px;height:20px;fill:var(--SmartThemeBodyColor,#222);cursor:pointer;transition:opacity .2s;}
.nico-m-ctr svg:active{opacity:0.5;}
.nico-m-lst{display:none;max-height:110px;overflow-y:auto;margin-top:10px;border-top:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.06));padding-top:6px;scrollbar-width:none;-ms-overflow-style:none;scrollbar-color:transparent transparent;}
.nico-m-lst::-webkit-scrollbar{display:none;}
.nico-m-lst.show{display:block;}
.nico-s-it{font-size:12px;padding:6px;cursor:pointer;border-radius:4px;color:var(--SmartThemeBodyColor,#444);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:8px;}
.nico-s-it:hover{background:var(--SmartThemeChatTintColor,rgba(0,0,0,0.03));}
.nico-s-it.on{color:var(--SmartThemeBodyColor,#000);font-weight:700;background:var(--SmartThemeChatTintColor,rgba(0,0,0,0.04));}
.nico-s-it .nico-s-nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.nico-s-del{flex-shrink:0;font-size:13px;line-height:1;color:var(--SmartThemeBodyColor,#000);cursor:pointer;padding:2px 5px;border-radius:4px;opacity:0;transition:opacity .2s,color .2s;background:none;border:none;}
.nico-s-it:hover .nico-s-del{opacity:1;}
.nico-s-del:active{color:#EF4444;opacity:1;}
@media(hover:none){.nico-s-del{opacity:.4;}}
.nico-grd{display:flex;align-items:flex-start;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none;scrollbar-color:transparent transparent;-webkit-overflow-scrolling:touch;transform:translateZ(0);background:var(--SmartThemeChatTintColor,#fafafa);}
.nico-grd::-webkit-scrollbar{display:none;}
.nico-g-rt{flex:0 0 100%;width:100%;position:relative;scroll-snap-align:center;background:var(--SmartThemeChatTintColor,#fafafa);overflow:hidden;}
.nico-gallery{margin:0 0 16px;flex-shrink:0;}
.nico-gallery-hdr{display:flex;align-items:center;justify-content:space-between;padding:0 16px;margin-bottom:10px;}
.nico-gallery-tit{font-size:13px;font-weight:700;color:var(--SmartThemeBodyColor,#111);letter-spacing:0.5px;}
.nico-gallery-add{background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);border:none;border-radius:12px;padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all .2s cubic-bezier(0.25,0.8,0.25,1);}
.nico-gallery-add:active{transform:scale(0.92);}
.nico-gallery-roll{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none;scrollbar-color:transparent transparent;-webkit-overflow-scrolling:touch;transform:translateZ(0);}
.nico-gallery-roll::-webkit-scrollbar{display:none;}
.nico-gr-item{flex:0 0 100%;width:100%;scroll-snap-align:center;background:var(--SmartThemeChatTintColor,#fafafa);display:flex;flex-direction:column;align-items:center;}
.nico-gr-item img{width:100%;height:auto;display:block;margin:0 auto;}
.nico-gr-del{background:none;border:none;color:var(--SmartThemeBodyColor,#000);opacity:.5;font-size:11px;letter-spacing:3px;cursor:pointer;padding:10px 16px 14px;display:flex;align-items:center;gap:5px;transition:color .2s,transform .2s,opacity .2s;}
.nico-gr-del:hover{color:#EF4444;opacity:1;}
.nico-gr-del:active{transform:scale(0.94);}
.nico-gallery-empty{width:100%;font-size:12px;color:var(--SmartThemeBodyColor,#000);opacity:.55;text-align:center;padding:16px 0;border:1px dashed var(--SmartThemeBorderColor,rgba(0,0,0,0.14));border-radius:10px;scroll-snap-align:center;}
.nico-ed{cursor:pointer;border-bottom:1px dashed transparent;transition:border-color .2s;}
.nico-ed:hover{border-color:var(--SmartThemeBorderColor,rgba(0,0,0,0.25));}
.nico-ed[contenteditable="true"]{outline:none;caret-color:var(--SmartThemeBodyColor,#111);border-color:transparent;white-space:nowrap;max-width:96%;}
.nico-av-bx[data-edit]{cursor:pointer;}
.nico-toast{position:fixed;left:50%;bottom:80px;transform:translateX(-50%) translateY(8px);background:var(--SmartThemeBlurTintColor,rgba(0,0,0,0.78));color:var(--SmartThemeBodyColor,#fff);font-size:12px;padding:7px 16px;border-radius:18px;z-index:100000;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;white-space:nowrap;}
.nico-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
/* 弹幕歌词透明模块：固定在酒馆界面上层，透明只有歌词，可随意拖动 */
.nico-lyric-mod{position:fixed;top:120px;left:50%;transform:translateX(-50%);z-index:11001;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;width:auto;max-width:92vw;}
.nico-lyric-mod.hidden{display:none;}
.nico-lyric-mod .nico-lyr-prev{font-size:12px;color:var(--SmartThemeBodyColor,#fff);opacity:.55;margin-bottom:4px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,.5);}
.nico-lyric-mod .nico-lyr-cur{font-size:20px;font-weight:600;color:var(--SmartThemeBodyColor,#fff);text-shadow:0 1px 3px rgba(0,0,0,.55),0 0 8px rgba(0,0,0,.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;letter-spacing:1px;text-align:center;transition:color .2s;}
.nico-lyric-mod .nico-lyr-cur.gradient{background:linear-gradient(90deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-shadow:none;}
/* 弹幕设置面板（组件面板内） */
.nico-danmu-set{margin:0 16px 16px;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.08));border-radius:12px;background:var(--SmartThemeChatTintColor,#fefefe);flex-shrink:0;overflow:hidden;}
.nico-danmu-hd{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;cursor:pointer;font-size:13px;font-weight:600;color:var(--SmartThemeBodyColor,#111);}
.nico-danmu-ind{font-size:11px;color:#07c160;font-weight:700;letter-spacing:1px;}
.nico-danmu-ind.off{color:var(--SmartThemeBodyColor,#000);opacity:.5;}
.nico-danmu-body{display:none;padding:12px 14px;border-top:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.06));}
.nico-danmu-body.open{display:block;}
.nico-danmu-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:var(--SmartThemeBodyColor,#333);}
.nico-danmu-row>span:first-child{min-width:56px;}
.nico-danmu-sw{width:36px;height:20px;border-radius:10px;background:var(--SmartThemeBorderColor,#ccc);cursor:pointer;position:relative;flex-shrink:0;transition:background .2s;}
.nico-danmu-sw.on{background:#07c160;}
.nico-danmu-sw::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--SmartThemeBlurTintColor,#fff);transition:left .15s;}
.nico-danmu-sw.on::after{left:18px;}
.nico-danmu-color{flex:1;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.15));border-radius:6px;font-size:12px;outline:none;min-width:0;background:var(--SmartThemeChatTintColor,transparent);color:var(--SmartThemeBodyColor,#333);}
.nico-danmu-range{flex:1;accent-color:var(--SmartThemeBodyColor,#111);}
.nico-danmu-v{font-size:11px;color:var(--SmartThemeBodyColor,#000);opacity:.55;min-width:34px;text-align:right;}
.nico-danmu-reset{width:100%;margin-top:4px;padding:8px;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.12));border-radius:8px;background:var(--SmartThemeChatTintColor,#f5f5f7);cursor:pointer;font-size:12px;color:var(--SmartThemeBodyColor,#333);}
.nico-drg{height:36px;width:100%;display:flex;justify-content:center;align-items:center;cursor:pointer;background:var(--SmartThemeBlurTintColor,#FFF);border-top:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.04));flex-shrink:0;padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:content-box;position:relative;z-index:5;}
.nico-d-br{width:36px;height:4px;border-radius:4px;background:var(--SmartThemeBorderColor,rgba(0,0,0,0.12));}
/* ===== 恢复初始配色：固定白底黑字，脱离酒馆主题变量 ===== */
#Nico-Draw-Panel.nico-theme-reset{background:#ffffff!important;color:#111111!important;}
#Nico-Draw-Panel.nico-theme-reset .nico-nav{border-bottom-color:#e5e5e5;}
#Nico-Draw-Panel.nico-theme-reset .nico-av-in{background:#fafafa;border-color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-st-l{color:#111111;opacity:.62;}
#Nico-Draw-Panel.nico-theme-reset .nico-s-rng{border-color:#e5e5e5;background:#f5f5f7;}
#Nico-Draw-Panel.nico-theme-reset .nico-s-in{background:#fafafa;}
#Nico-Draw-Panel.nico-theme-reset .nico-s-nm{color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-s-rl{color:#111111;opacity:.55;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-box{border-color:#eaeaea;background:#fefefe;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-fill{background:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-knob{background:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-pt{color:#111111;opacity:.55;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-src input{background:#f0f0f2;color:#222222;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-src input:focus{background:#e8e8eb;box-shadow:inset 0 0 0 1px #d8d8d8;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-src input::placeholder{color:#111111;opacity:.42;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-src button{background:#111111;color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-tit{color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-tmr{color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-tmr input{background:#f0f0f2;color:#222222;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-tmr input:focus{background:#e8e8eb;box-shadow:inset 0 0 0 1px #d8d8d8;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-tmr button{background:#111111;color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-res-it{border-bottom-color:#f0f0f0;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-res-name{color:#333333;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-res-add{border-color:#d8d8d8;color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-res-add:active{background:#111111;color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-res-add.added{background:#111111;color:#ffffff;border-color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-ctr svg{fill:#222222;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-lst{border-top-color:#f0f0f0;}
#Nico-Draw-Panel.nico-theme-reset .nico-s-it{color:#444444;}
#Nico-Draw-Panel.nico-theme-reset .nico-s-it:hover{background:rgba(0,0,0,0.03);}
#Nico-Draw-Panel.nico-theme-reset .nico-s-it.on{color:#000000;background:rgba(0,0,0,0.04);}
#Nico-Draw-Panel.nico-theme-reset .nico-s-del{color:#000000;}
#Nico-Draw-Panel.nico-theme-reset .nico-s-del:active{color:#EF4444;}
#Nico-Draw-Panel.nico-theme-reset .nico-grd{background:#fafafa;}
#Nico-Draw-Panel.nico-theme-reset .nico-g-rt{background:#fafafa;}
#Nico-Draw-Panel.nico-theme-reset .nico-gallery-tit{color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-gallery-add{background:#111111;color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-gallery-roll{background:transparent;}
#Nico-Draw-Panel.nico-theme-reset .nico-gr-item{background:#fafafa;}
#Nico-Draw-Panel.nico-theme-reset .nico-gr-del{color:#000000;opacity:.5;}
#Nico-Draw-Panel.nico-theme-reset .nico-gr-del:hover{color:#EF4444;opacity:1;}
#Nico-Draw-Panel.nico-theme-reset .nico-gallery-empty{color:#000000;opacity:.55;border-color:#d8d8d8;}
#Nico-Draw-Panel.nico-theme-reset .nico-ed:hover{border-color:rgba(0,0,0,0.25);}
#Nico-Draw-Panel.nico-theme-reset .nico-ed[contenteditable="true"]{caret-color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-toast{background:rgba(0,0,0,0.78);color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-set{border-color:#eaeaea;background:#fefefe;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-hd{color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-ind.off{color:#000000;opacity:.5;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-body{border-top-color:#f0f0f0;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-row{color:#333333;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-sw{background:#cccccc;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-color{border-color:#d8d8d8;background:transparent;color:#333333;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-range{accent-color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-v{color:#000000;opacity:.55;}
#Nico-Draw-Panel.nico-theme-reset .nico-danmu-reset{border-color:#d8d8d8;background:#f5f5f7;color:#333333;}
#Nico-Draw-Panel.nico-theme-reset .nico-drg{background:#ffffff;border-top-color:#f0f0f0;}
#Nico-Draw-Panel.nico-theme-reset .nico-d-br{background:#d8d8d8;}
/* 主题切换按钮：导航栏右侧，高级简洁 */
.nico-theme-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:none;border-radius:8px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.45;transition:opacity .2s,background .2s,transform .15s;padding:0;flex-shrink:0;}
.nico-theme-btn:hover{opacity:.85;background:rgba(0,0,0,0.05);}
.nico-theme-btn:active{transform:translateY(-50%) scale(0.9);}
.nico-theme-btn svg{width:16px;height:16px;fill:currentColor;}
#Nico-Draw-Panel.nico-theme-reset .nico-theme-btn{opacity:.7;}
#Nico-Draw-Panel.nico-theme-reset .nico-theme-btn:hover{background:rgba(0,0,0,0.06);opacity:1;}
`;

/* ===== 1. 强力清除旧版注入与幽灵事件（扩展重载/对话多轮不叠加） ===== */
if (document._nicoDrawPanelHandlers) {
    document.removeEventListener('touchstart', document._nicoDrawPanelHandlers.ts);
    document.removeEventListener('touchmove', document._nicoDrawPanelHandlers.tm);
    document.removeEventListener('mousedown', document._nicoDrawPanelHandlers.md);
    document.removeEventListener('mousemove', document._nicoDrawPanelHandlers.mm);
    document.removeEventListener('mouseup', document._nicoDrawPanelHandlers.mu);
}
var oP=document.getElementById(PANEL_ID), oS=document.getElementById(CSS_ID);
if(oP)oP.remove(); if(oS)oS.remove();

var style=document.createElement('style');
style.id=CSS_ID;
style.textContent=CSS;
document.head.appendChild(style);

/* ===== 2. 面板 DOM（不含 STORY ARCHIVE 阅读器） ===== */
var panel=document.createElement('div');
panel.id=PANEL_ID;
panel.innerHTML=`
    <div class="nico-p-in">
      <div class="nico-nav"><span class="nico-nav-txt" data-edit="navid" data-fs="16" title="点击编辑">@Nicole_id_here</span><button class="nico-theme-btn" id="nico-theme-btn" type="button" title="恢复初始配色 / 跟随酒馆主题"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.55 0 1-.45 1-1 0-.39-.23-.73-.57-.88-.29-.13-.43-.46-.43-.78 0-.55.45-1 1-1H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></button></div>
      <div class="nico-hdr">
        <div class="nico-av-bx" data-edit="avatar" title="点击更换头像"><img class="nico-av-in" src="https://tuchuang.org.cn/imgs/2026/06/23/9469ffe03eb9e93a.png"></div>
        <div class="nico-stats">
          <div class="nico-st-it"><span class="nico-st-v nico-ed" data-edit="name" title="点击编辑昵称">沈又青</span><span class="nico-st-l">Name</span></div>
          <div class="nico-st-it"><span class="nico-st-v nico-ed" data-edit="height" title="点击编辑身高">193</span><span class="nico-st-l">Height</span></div>
          <div class="nico-st-it"><span class="nico-st-v nico-ed" data-edit="age" title="点击编辑年龄">27</span><span class="nico-st-l">age</span></div>
        </div>
      </div>
      <div class="nico-bio">
        <div class="nico-b-id nico-ed" data-edit="id" title="点击编辑 ID">YY</div>
        <div class="nico-ed" data-edit="sign" title="点击编辑签名">。</div>
      </div>
      <div class="nico-hlt">
        <div class="nico-sty"><div class="nico-s-rng" title="点击替换"><img class="nico-s-in" src="https://tuchuang.org.cn/imgs/2026/06/23/a6566c1fe2a88fb5.png"></div><span class="nico-s-nm"></span><span class="nico-s-rl"></span></div>
        <div class="nico-sty"><div class="nico-s-rng" title="点击替换"><img class="nico-s-in" src="https://tuchuang.org.cn/imgs/2026/06/23/823b5c1f4486b6d0.png"></div><span class="nico-s-nm"></span><span class="nico-s-rl"></span></div>
        <div class="nico-sty"><div class="nico-s-rng" title="点击替换"><img class="nico-s-in" src="https://tuchuang.org.cn/imgs/2026/06/23/488b94a965adce33.png"></div><span class="nico-s-nm"></span><span class="nico-s-rl"></span></div>
        <div class="nico-sty"><div class="nico-s-rng" title="点击替换"><img class="nico-s-in" src="https://tuchuang.org.cn/imgs/2026/06/23/622edd03e58f1ebc.jpg"></div><span class="nico-s-nm"></span><span class="nico-s-rl"></span></div>
      </div>
      <div class="nico-m-box">
        <div class="nico-m-inf">
          <div class="nico-m-tit" id="nico-mu-tit">Select Track</div>
          <div class="nico-m-tmr">
            <input type="number" id="nico-mu-in" placeholder="0" min="1" max="120" /> min
            <button id="nico-mu-btn">SET</button>
          </div>
        </div>
        <div class="nico-m-prog">
          <span class="nico-m-pt" id="nico-mu-cur">0:00</span>
          <div class="nico-m-bar" id="nico-mu-bar"><div class="nico-m-fill" id="nico-mu-fill"></div><div class="nico-m-knob" id="nico-mu-knob"></div></div>
          <span class="nico-m-pt" id="nico-mu-dur">0:00</span>
        </div>
        <div class="nico-m-src">
          <input type="text" id="nico-mu-search-in" placeholder="搜歌名 / 歌手" autocomplete="off" />
          <button id="nico-mu-search-btn" type="button">搜</button>
          <button id="nico-mu-pl-btn" type="button" title="导入网易云歌单（链接或ID）">歌单</button>
        </div>
        <div class="nico-m-res" id="nico-mu-res"></div>
        <div class="nico-m-ctr">
          <svg id="nico-mu-mode" viewBox="0 0 24 24"><path d="M17 2l4 4-4 4V7H7a1 1 0 0 0 0 2h10v3l4-4-4-4V2zm-4 13v3H3v-3l-4 4 4 4v-3h10z"/></svg>
          <svg id="nico-mu-prev" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          <div id="nico-mu-play" style="display:flex;">
            <svg class="nico-ic-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg class="nico-ic-pause" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </div>
          <svg id="nico-mu-next" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          <svg id="nico-mu-list" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
        </div>
        <div class="nico-m-lst" id="nico-mu-lst"></div>
      </div>
      <div class="nico-danmu-set">
        <div class="nico-danmu-hd" id="nico-danmu-toggle">
          <span>弹幕歌词</span>
          <span class="nico-danmu-ind" id="nico-danmu-ind"></span>
        </div>
        <div class="nico-danmu-body" id="nico-danmu-body">
          <div class="nico-danmu-row"><span>弹幕开关</span><span class="nico-danmu-sw" id="nico-danmu-sw"></span></div>
          <div class="nico-danmu-row"><span>彩虹渐变</span><span class="nico-danmu-sw" id="nico-danmu-rb"></span></div>
          <div class="nico-danmu-row"><span>颜色HEX</span><input class="nico-danmu-color" id="nico-danmu-color" type="text" value="#ffffff" placeholder="#RRGGBB"></div>
          <div class="nico-danmu-row"><span>字号</span><input class="nico-danmu-range" id="nico-danmu-size" type="range" min="14" max="40" value="20"><span class="nico-danmu-v" id="nico-danmu-size-v">20</span></div>
          <div class="nico-danmu-row"><span>不透明</span><input class="nico-danmu-range" id="nico-danmu-op" type="range" min="20" max="100" value="100"><span class="nico-danmu-v" id="nico-danmu-op-v">100%</span></div>
          <button class="nico-danmu-reset" id="nico-danmu-reset" type="button">恢复默认</button>
        </div>
      </div>
      <div class="nico-gallery">
        <div class="nico-gallery-hdr">
          <span class="nico-gallery-tit">GALLERY</span>
          <button class="nico-gallery-add" type="button">+ 上传</button>
        </div>
        <div class="nico-gallery-roll" id="nico-gallery-roll"></div>
      </div>
      <input type="file" id="nico-quick-file" accept="image/*" style="display:none">
    </div>
    <div class="nico-drg" id="Nico-Draw-Close"><div class="nico-d-br"></div></div>
`;
document.body.appendChild(panel);

/* ===== 3. 顶部下拉手势（防抖节流，唯一展开方式：从页面顶部向下拉） ===== */
var sY=0, sX=0, isT=false, isM=false, ticking=false;
var handlers = {
    ts: function(e){ try{ sY=e.touches[0].clientY; sX=e.touches[0].clientX; }catch(_e){ return; } isT=sY<=60; },
    tm: function(e){
      if(!isT) return;
      if(!ticking) {
        window.requestAnimationFrame(function(){
          try{
            var cY=e.touches[0].clientY, cX=e.touches[0].clientX;
            if(cY-sY>30 && Math.abs(cY-sY)>Math.abs(cX-sX)) {
              panel.classList.add('is-open'); isT=false;
            }
          }catch(_e){}
          ticking = false;
        });
        ticking = true;
      }
    },
    md: function(e){ sY=e.clientY; sX=e.clientX; isT=sY<=60; isM=true; },
    mm: function(e){
      if(!isM||!isT) return;
      if(!ticking) {
        window.requestAnimationFrame(function(){
          if(e.clientY-sY>30 && Math.abs(e.clientY-sY)>Math.abs(e.clientX-sX)) {
            panel.classList.add('is-open'); isT=false; isM=false;
          }
          ticking = false;
        });
        ticking = true;
      }
    },
    mu: function(){ isM=false; }
};
document._nicoDrawPanelHandlers = handlers;
document.addEventListener('touchstart', handlers.ts, {passive: true});
document.addEventListener('touchmove', handlers.tm, {passive: true});
document.addEventListener('mousedown', handlers.md, {passive: true});
document.addEventListener('mousemove', handlers.mm, {passive: true});
document.addEventListener('mouseup', handlers.mu, {passive: true});

/* ===== 4. 音乐播放器（保持原逻辑） ===== */
var pl = [
    {name: "Track 01 Placeholder", url: "https://audio.pagehost.icu/autoupload/f/JmxT7XRO2cXoE72TQtNCRdiO_OyvX7mIgxFBfDMDErs/20260622/TT9y/d62fba3246d9a1ee33f90df1321b00a8.mp3"},
    {name: "Track 02 Placeholder", url: "https://audio.pagehost.icu/autoupload/f/JmxT7XRO2cXoE72TQtNCRdiO_OyvX7mIgxFBfDMDErs/20260622/HGj4/a9a7adbcf899c4899493bacdec8af627.mp3"},
    {name: "Track 03 Placeholder", url: "https://audio.pagehost.icu/autoupload/f/JmxT7XRO2cXoE72TQtNCRdiO_OyvX7mIgxFBfDMDErs/20260622/RVRU/1dc2edca46f3d300e6a6d559fba32963.mp3"},
    {name: "Track 04 Placeholder", url: "https://img.tofaka.com/autoupload/f/JmxT7XRO2cXoE72TQtNCRdiO_OyvX7mIgxFBfDMDErs/20260701/0Hbk/44d2b98e683e43d4cf61d784c806b04e.mp3"},
    {name: "Track 05 Placeholder", url: "https://img.tofaka.com/autoupload/f/JmxT7XRO2cXoE72TQtNCRdiO_OyvX7mIgxFBfDMDErs/20260701/hboX/e27636f98eaf0d6cb6191fdc1b825083.mp3"},
    {name: "Track 06 Placeholder", url: "https://img.tofaka.com/autoupload/f/JmxT7XRO2cXoE72TQtNCRdiO_OyvX7mIgxFBfDMDErs/20260701/Vx9J/d1bc9557dd14030789cebf1d7f2e3519.mp3"},
    {name: "Track 07 Placeholder", url: "https://img.tofaka.com/autoupload/fr/Cslxmk1KzKSuA4THx1elGvcpOHyK6V0IAFjL2GI0nE-yl5f0KlZfm6UsKj-HyTuv/20260730/AEzR/c0a9903ddbb527b4470bdb1c2c4d0a6d.mp3"},
    {name: "Track 08 Placeholder", url: "https://img.tofaka.com/autoupload/fr/957y0qQKVntRx85S54gMqzq7X3kxu9aZSP_IiwcPIKGyl5f0KlZfm6UsKj-HyTuv/20260727/eyCA/WeChat_20260716133111.mp3"},
    {name: "Track 09 Placeholder", url: "https://img.tofaka.com/autoupload/fr/FEa8MSJpCzGxfJi7iutvFIt1IPL8766yrPDdOXw-v_Gyl5f0KlZfm6UsKj-HyTuv/20260710/p0sY/fbeb6ae52fc3e760622f341158564a53.mp3"},
    {name: "Track 10 Placeholder", url: "https://audio.fukit.cn/autoupload/fr/3lyysLt8HlYD3oCqq_5mOcarSs0VkS4Csbn57vFrcEuyl5f0KlZfm6UsKj-HyTuv/20260528/bAFN/b9131f77872ab510b1f8c4910041ddf6.mp3"}
];
if(!window.__nico_sys_audio) window.__nico_sys_audio = new window.Audio();
var au = window.__nico_sys_audio;
au.loop = false;

/* 播放模式：loop(单曲循环) / order(顺序播放) / random(随机播放)，三合一按钮循环切换 */
var playMode = 'loop';
var MODE_SVG = {
    loop: '<path d="M17 2l4 4-4 4V7H7a1 1 0 0 0 0 2h10v3l4-4-4-4V2zm-4 13v3H3v-3l-4 4 4 4v-3h10z"/>',
    order: '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>',
    random: '<path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>'
};
var modeBtn = document.getElementById('nico-mu-mode');
function setPlayMode(m){
    playMode = m;
    modeBtn.innerHTML = MODE_SVG[m];
}
modeBtn.onclick = function(){
    if(playMode === 'loop') setPlayMode('order');
    else if(playMode === 'order') setPlayMode('random');
    else setPlayMode('loop');
    nicoShowToast(playMode === 'loop' ? '单曲循环' : playMode === 'order' ? '顺序播放' : '随机播放');
};

var cIdx = 0;
var lDom = document.getElementById('nico-mu-lst');
var titD = document.getElementById('nico-mu-tit');
var iPlay = panel.querySelector('.nico-ic-play');
var iPause = panel.querySelector('.nico-ic-pause');

/* 动态播放列表：固定曲目 + 搜索结果（搜到的歌插到最前面），增删持久化到 localStorage */
var savedPl = null;
try{ var _raw = localStorage.getItem('nico-playlist'); if(_raw) savedPl = JSON.parse(_raw); }catch(e){ savedPl = null; }
var playlist = [];
if(savedPl && savedPl.length){
    for(var _si=0; _si<savedPl.length; _si++){ playlist.push({name: savedPl[_si].name || '', artist: savedPl[_si].artist || '', url: savedPl[_si].url || ''}); }
} else {
    for(var _pi=0; _pi<pl.length; _pi++){ playlist.push({name: pl[_pi].name, artist: '', url: pl[_pi].url}); }
}
function nicoSavePlaylist(){
    try{
        localStorage.setItem('nico-playlist', JSON.stringify(playlist.map(function(s){ return {name:s.name, artist:s.artist||'', url:s.url}; })));
    }catch(e){}
}
function removeTrack(idx){
    if(idx < 0 || idx >= playlist.length) return;
    var wasPlaying = !au.paused;
    var wasCur = (idx === cIdx);
    playlist.splice(idx, 1);
    nicoSavePlaylist();
    if(playlist.length === 0){
        cIdx = 0;
        try{ au.pause(); au.removeAttribute('src'); au.load(); }catch(e){}
        uIcon(false);
        titD.textContent = '歌单为空';
        buildList();
        nicoShowToast('已移除');
        return;
    }
    if(idx < cIdx){ cIdx--; }
    else if(wasCur && cIdx >= playlist.length){ cIdx = playlist.length - 1; }
    buildList();
    loadP();
    if(wasCur && wasPlaying){ try{ pPlay(); }catch(e){} }
    nicoShowToast('已移除');
}
function buildList(){
    lDom.innerHTML = '';
    for(var i=0; i<playlist.length; i++){
        var s = playlist[i];
        var d = document.createElement('div');
        d.className = 'nico-s-it' + (i===cIdx ? ' on':'');
        var nm = document.createElement('span'); nm.className = 'nico-s-nm';
        nm.textContent = (i+1)+". "+s.name + (s.artist ? ' - '+s.artist : '');
        d.appendChild(nm);
        var del = document.createElement('button'); del.type = 'button';
        del.className = 'nico-s-del'; del.textContent = '×'; del.title = '移除这首歌';
        (function(idx){
            d.onclick = function(){ cIdx = idx; loadP(); pPlay(); };
            del.addEventListener('click', function(e){ e.stopPropagation(); removeTrack(idx); });
        })(i);
        d.appendChild(del);
        lDom.appendChild(d);
    }
}
function loadP(){
    var s = playlist[cIdx];
    if(!s) return;
    if(au.src !== s.url) { au.src = s.url; au.load(); }
    titD.textContent = s.name + (s.artist ? ' - '+s.artist : '');
    var items = lDom.querySelectorAll('.nico-s-it');
    for(var i=0;i<items.length;i++){ items[i].className = 'nico-s-it' + (i===cIdx ? ' on':''); }
}
function uIcon(isP){
    iPlay.style.display = isP ? 'none':'block';
    iPause.style.display = isP ? 'block':'none';
}
function pPlay(){
    var p = au.play();
    if(p !== undefined) p.then(function(){ uIcon(true); }).catch(function(){ uIcon(false); });
}
buildList();
loadP();
panel.querySelector('#nico-mu-play').onclick = function(){
    if(au.paused) { pPlay(); } else { au.pause(); uIcon(false); }
};
panel.querySelector('#nico-mu-prev').onclick = function(){
    if(playlist.length<=1){ try{au.currentTime=0;}catch(e){} return; }
    cIdx = (cIdx - 1 + playlist.length) % playlist.length; loadP(); pPlay();
};
panel.querySelector('#nico-mu-next').onclick = function(){
    if(playlist.length<=1){ try{au.currentTime=0;}catch(e){} return; }
    cIdx = (cIdx + 1) % playlist.length; loadP(); pPlay();
};
panel.querySelector('#nico-mu-list').onclick = function(){
    lDom.classList.toggle('show');
};
au.onended = function(){
    if(playlist.length <= 1){ pPlay(); return; }
    if(playMode === 'loop'){ pPlay(); }
    else if(playMode === 'order'){ cIdx = (cIdx + 1) % playlist.length; loadP(); pPlay(); }
    else { cIdx = Math.floor(Math.random() * playlist.length); loadP(); pPlay(); }
};

/* ===== 4.4 歌曲进度条（时间显示 + 可拖动 seek） ===== */
var barEl = panel.querySelector('#nico-mu-bar');
var fillEl = panel.querySelector('#nico-mu-fill');
var knobEl = panel.querySelector('#nico-mu-knob');
var curTEl = panel.querySelector('#nico-mu-cur');
var durTEl = panel.querySelector('#nico-mu-dur');
function fmtTime(s){
    if(!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + ':' + (ss < 10 ? '0' : '') + ss;
}
function updProg(){
    var d = au.duration;
    if(!d || !isFinite(d) || d <= 0){
        fillEl.style.width = '0%'; knobEl.style.left = '0%';
        curTEl.textContent = '0:00'; durTEl.textContent = '0:00';
        return;
    }
    var p = Math.max(0, Math.min(1, au.currentTime / d));
    fillEl.style.width = (p * 100) + '%';
    knobEl.style.left = (p * 100) + '%';
    curTEl.textContent = fmtTime(au.currentTime);
    durTEl.textContent = fmtTime(d);
    updLyric && updLyric();
}
au.addEventListener('timeupdate', updProg);
au.addEventListener('loadedmetadata', updProg);
au.addEventListener('play', updProg);
var barDragging = false;
// 拖动/点击进度条：计算并预览 UI（填充条/时间），不直接 seek 音频
function seekUI(e){
    var r = barEl.getBoundingClientRect();
    if(!r.width) return 0;
    var cx = e.clientX;
    if(cx === undefined || cx === null){
        var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
        if(t) cx = t.clientX;
    }
    if(cx === undefined || cx === null) return 0;
    var p = Math.max(0, Math.min(1, (cx - r.left) / r.width));
    fillEl.style.width = (p * 100) + '%';
    knobEl.style.left = (p * 100) + '%';
    curTEl.textContent = fmtTime(p * (au.duration || 0));
    return p;
}
// 仅在松开时提交一次 seek，避免拖动过程中频繁 seek 打断播放（流媒体缓冲导致暂停/卡顿）
function seekCommit(p){
    if(au.duration && isFinite(au.duration)){ try{ au.currentTime = p * au.duration; }catch(err){} }
}
barEl.addEventListener('mousedown', function(e){ barDragging = true; seekUI(e); e.preventDefault(); });
document.addEventListener('mousemove', function(e){ if(barDragging) seekUI(e); });
document.addEventListener('mouseup', function(e){ if(barDragging){ barDragging = false; seekCommit(seekUI(e)); } });
barEl.addEventListener('touchstart', function(e){ barDragging = true; seekUI(e); }, {passive:true});
document.addEventListener('touchmove', function(e){ if(barDragging) seekUI(e); }, {passive:true});
document.addEventListener('touchend', function(e){
    if(barDragging){
        barDragging = false;
        var t = e.changedTouches && e.changedTouches[0];
        if(t) seekCommit(seekUI({clientX: t.clientX}));
    }
});

/* ===== 4.5 搜歌功能：输入歌名/歌手搜索并播放（多引擎兜底，移植自 nicoPhone） ===== */
var MUSIC_API='https://music-api.gdstudio.xyz/api.php';
function muFetch(url,timeout){
    var c=new AbortController();var tm=setTimeout(function(){c.abort();},timeout||8000);
    return fetch(url,{signal:c.signal}).then(function(r){clearTimeout(tm);return r;}).catch(function(e){clearTimeout(tm);throw e;});
}
// JSONP 请求（script 标签注入，绕过 CORS 限制；带超时与全局回调清理）
function muJSONP(url, cbParam, timeout){
    return new Promise(function(res){
        var cbName = '__nico_jsonp_' + Date.now() + '_' + Math.floor(Math.random()*1e6);
        var done = false;
        var script = document.createElement('script');
        var timer = setTimeout(function(){ cleanup(); res(null); }, timeout||7000);
        function cleanup(){
            if(done) return; done = true;
            clearTimeout(timer);
            try{ delete window[cbName]; }catch(e){ window[cbName] = undefined; }
            if(script && script.parentNode) script.parentNode.removeChild(script);
        }
        window[cbName] = function(data){ cleanup(); res(data); };
        script.onerror = function(){ cleanup(); res(null); };
        script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + cbParam + '=' + cbName;
        document.head.appendChild(script);
    });
}
// 快速可播校验：只等 loadedmetadata（仅下载头部元数据），比 canplay 快
function muCheckUrlFast(url){
    return new Promise(function(res){
        if(!url)return res(false);
        var t=new Audio();t.preload='metadata';t.muted=true;
        var done=false;
        var finish=function(v){if(done)return;done=true;clearTimeout(tm);try{t.onloadedmetadata=t.onerror=null;t.src='';}catch(e){}res(v);};
        var tm=setTimeout(function(){finish(false);},800);
        t.onloadedmetadata=function(){finish(true);};t.onerror=function(){finish(false);};
        try{t.src=url;}catch(e){finish(false);}
    });
}
// 网易云直链解析（v.iarc.top，版权/VIP覆盖强）
function muIarcUrl(id){
    return new Promise(function(res){
        muFetch('https://v.iarc.top/?type=url&id='+id,4000).then(function(rr){
            if(!rr||!rr.ok)return res('');
            var ct=rr.headers.get('content-type')||'';
            if(rr.url&&rr.url.indexOf('iarc.top')<0&&!ct.includes('json')&&!ct.includes('html'))return res(rr.url);
            rr.json().then(function(jr){
                res((Array.isArray(jr)&&jr[0])?(jr[0].url||''):(jr&&(jr.url||(jr.data&&jr.data.url))||''));
            }).catch(function(){res('');});
        }).catch(function(){res('');});
    });
}
// 多个直链Promise并行竞速：谁先返回非空用谁
function muFirstUrl(promises){
    return new Promise(function(res){
        var done=false,left=promises.length;
        if(!left)return res('');
        function fin(u){if(done)return;if(u){done=true;res(u);}else{left--;if(left<=0)res('');}}
        promises.forEach(function(p){p.then(fin).catch(function(){fin('');});});
    });
}
async function muGdItemUrl(source,item){
    var finalUrl='';
    if(source==='netease'){
        var gdP=muFetch(MUSIC_API+'?types=url&source=netease&id='+item.id+'&br=320',4000)
            .then(function(r){return r.json();})
            .then(function(j){return (j&&j.url)||'';})
            .catch(function(){return '';});
        finalUrl=await muFirstUrl([muIarcUrl(item.id),gdP]);
    }else{
        try{
            var ur=await muFetch(MUSIC_API+'?types=url&source='+source+'&id='+item.id+'&br=320',4500).then(function(r){return r.json();});
            if(ur&&ur.url)finalUrl=ur.url;
        }catch(e){}
    }
    if(finalUrl&&finalUrl.indexOf('http://')===0)finalUrl=finalUrl.replace('http://','https://');
    return finalUrl?{url:finalUrl,item:item}:null;
}
// 候选相关度排序：歌名/歌手多词包含匹配累计加分，翻唱/伴奏/Live/remix 降权
function muRank(items,query){
    var q=(query||'').toLowerCase().trim();
    var parts=q.split(/\s+/).filter(Boolean);
    function artOf(it){return String(it.artist||it.author||'').toLowerCase();}
    return items.map(function(it,idx){
        var name=(it.name||'').toLowerCase(),score=0;
        var bare=name.replace(/[（(].*?[)）]/g,'').trim();
        var art=artOf(it);
        if(parts.length>1){
            var nHitW={},aHitW={};
            for(var i=0;i<parts.length;i++){if(bare.indexOf(parts[i])>=0)nHitW[i]=1;if(art.indexOf(parts[i])>=0)aHitW[i]=1;}
            var covered=0;
            for(var i=0;i<parts.length;i++){if(nHitW[i]||aHitW[i])covered++;}
            score+=covered*35;
            if(bare===parts[0])score+=40; else if(bare===q)score+=50;
            if(covered===parts.length)score+=25;
        }else{
            if(name===q)score+=100; else if(bare===q)score+=85; else if(bare.indexOf(q)>=0)score+=40;
        }
        if(!/[（(].*?[)）]/.test(it.name||''))score+=8;
        if(/翻唱|伴奏|[Ll]ive|现场|remix|钢琴|纯音乐/.test(it.name||''))score-=30;
        return {it:it,score:score,idx:idx};
    }).sort(function(a,b){return b.score-a.score||a.idx-b.idx;}).map(function(x){return x.it;});
}
// 多个候选直链并行竞速校验，第一个可播的立即返回
function muRaceCheck(list,mkHit){
    return new Promise(function(resolve){
        var settled=false,finished=0,total=list.length;
        if(!total)return resolve(null);
        list.forEach(function(g){
            muCheckUrlFast(g.url).then(function(ok){
                if(!settled&&ok){settled=true;resolve(mkHit(g));}
            }).catch(function(){}).finally(function(){
                finished++;
                if(finished===total&&!settled)resolve(null);
            });
        });
    });
}
function muCleanQuery(q){return q.replace(/\([^)]*\)/g,'').replace(/\[.*?\]/g,'').replace(/[^\w\u4e00-\u9fa5\s.-]/g,'').trim();}
var muSearchCache={};
// 多引擎并行收集可播结果，返回结果数组（不去重不自动进歌单）
function muResolveMulti(query){
    var cleanQ=muCleanQuery(query);
    if(!cleanQ)cleanQ=query;
    var cacheKey=cleanQ.toLowerCase();
    if(muSearchCache[cacheKey])return Promise.resolve(muSearchCache[cacheKey]);
    var engines=[
        {name:'网易云',fn:function(){return muSearchGD('netease',cleanQ);}},
        {name:'QQ音乐',fn:function(){return muSearchQQ2(cleanQ);}},
        {name:'酷狗',fn:function(){return muSearchKugou2(cleanQ);}},
        {name:'酷我',fn:function(){return muSearchGD('kuwo',cleanQ);}},
        {name:'Joox',fn:function(){return muSearchGD('joox',cleanQ);}}
    ];
    return new Promise(function(resolve){
        var results=[],finished=0,seen={};
        function settle(){
            muSearchCache[cacheKey]=results;
            resolve(results.slice());
        }
        engines.forEach(function(eng){
            eng.fn().then(function(hit){
                if(hit&&hit.url&&!seen[hit.url]){seen[hit.url]=1;results.push(hit);}
            }).catch(function(){}).finally(function(){
                finished++;
                if(finished===engines.length)settle();
            });
        });
        setTimeout(function(){ if(finished<engines.length){settle();} },7000);
    });
}
async function muSearchGD(source,query){
    try{
        var sr=await muFetch(MUSIC_API+'?types=search&count=5&source='+source+'&name='+encodeURIComponent(query),4500).then(function(r){return r.json();});
        if(!sr||!sr.length)return null;
        var ranked=muRank(sr,query);
        var got=(await Promise.all(ranked.slice(0,3).map(function(it){return muGdItemUrl(source,it).catch(function(){return null;});}))).filter(Boolean);
        if(!got.length)return null;
        return await muRaceCheck(got,function(g){return {url:g.url,name:g.item.name,artist:g.item.artist||g.item.author||'',source:source,id:g.item.id};});
    }catch(e){}return null;
}
/* ===== 4.6.2 QQ音乐/酷狗 官方搜索通道（JSONP 绕过 CORS） =====
   这两个平台的官方接口无 CORS 头、且 vkey/getdata 直链在纯浏览器拿不到，
   因此策略：用官方搜索接口拿到最佳候选（歌名+歌手），再换源到
   gdstudio 的 netease/kuwo/joox 搜索同名可播歌曲来播放。
   常见歌曲同名命中率高，相当于"QQ/酷狗作为搜歌入口，网易云系负责出音源"。 */
function muQQSearchCandidates(query){
    return muJSONP('https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w='+encodeURIComponent(query)+'&format=jsonp&p=1&n=6&cr=1&g_tk=5381&loginUin=0&hostUin=0', 'jsonpCallback', 6500).then(function(d){
        try{
            var list=(d&&d.data&&d.data.song&&d.data.song.list)||[];
            return list.map(function(s){
                return {name:s.songname||'', artist:(s.singer||[]).map(function(x){return x.name||'';}).join(' / ')};
            });
        }catch(e){return [];}
    });
}
function muKugouSearchCandidates(query){
    return muJSONP('https://songsearch.kugou.com/song_search_v2?keyword='+encodeURIComponent(query)+'&page=1&pagesize=5&platform=WebFilter&userid=-1', 'callback', 6500).then(function(d){
        try{
            var list=(d&&d.data&&d.data.lists)||[];
            return list.map(function(s){
                return {name:s.SongName||'', artist:s.SingerName||''};
            });
        }catch(e){return [];}
    });
}
// 用候选（歌名+歌手）去 gdstudio 换源搜可播歌曲
async function muSearchByCandidates(cands, fallbackQ, tag){
    if(!cands || !cands.length) return null;
    for(var i=0; i<cands.length && i<3; i++){
        var q = cands[i].name + (cands[i].artist ? ' ' + cands[i].artist : '');
        for(var si=0; si<3; si++){
            var src = ['netease','kuwo','joox'][si];
            var hit = await muSearchGD(src, q);
            if(hit) return hit;
        }
    }
    // 兜底：直接用原关键词再试一遍网易云系
    if(fallbackQ){
        for(var si2=0; si2<3; si2++){
            var hit2 = await muSearchGD(['netease','kuwo','joox'][si2], fallbackQ);
            if(hit2) return hit2;
        }
    }
    return null;
}
async function muSearchQQ2(query){
    try{
        var cands = await muQQSearchCandidates(query);
        if(!cands.length) return null;
        return await muSearchByCandidates(cands, query, 'tencent');
    }catch(e){return null;}
}
async function muSearchKugou2(query){
    try{
        var cands = await muKugouSearchCandidates(query);
        if(!cands.length) return null;
        return await muSearchByCandidates(cands, query, 'kugou');
    }catch(e){return null;}
}

var sIn = panel.querySelector('#nico-mu-search-in');
var sBtn = panel.querySelector('#nico-mu-search-btn');
var resDom = document.getElementById('nico-mu-res');
// 搜索只列出结果（每条带"添加"键），点击添加才进歌单，不按不进、不自动播放
function doSearch(){
    var q = (sIn.value||'').trim();
    if(!q) return;
    sBtn.disabled = true; sBtn.textContent = '…';
    resDom.innerHTML = ''; resDom.classList.remove('show');
    titD.textContent = '搜索中...';
    muResolveMulti(q).then(function(hits){
        sBtn.disabled = false; sBtn.textContent = '搜';
        if(!hits || !hits.length){
            titD.textContent = '未找到音源';
            var empty = document.createElement('div'); empty.className = 'nico-m-res-it';
            empty.innerHTML = '<span class="nico-m-res-name">未找到可播音源</span>';
            resDom.appendChild(empty); resDom.classList.add('show');
            setTimeout(function(){ loadP(); }, 1500);
            return;
        }
        titD.textContent = '找到 ' + hits.length + ' 个结果';
        hits.forEach(function(hit){
            var art = Array.isArray(hit.artist) ? hit.artist.join(' / ') : (hit.artist||'');
            var label = hit.name + (art ? ' - '+art : '');
            var it = document.createElement('div'); it.className = 'nico-m-res-it';
            var nm = document.createElement('span'); nm.className = 'nico-m-res-name';
            nm.textContent = label; nm.title = label;
            var add = document.createElement('button'); add.type = 'button';
            add.className = 'nico-m-res-add'; add.textContent = '添加';
            add.onclick = function(){
                playlist.unshift({name: hit.name, artist: art, url: hit.url});
                buildList(); cIdx = 0;
                nicoSavePlaylist();
                add.className = 'nico-m-res-add added'; add.textContent = '已添加';
                nicoShowToast('已添加到歌单');
            };
            it.appendChild(nm); it.appendChild(add);
            resDom.appendChild(it);
        });
        resDom.classList.add('show');
    });
}
sBtn.onclick = doSearch;
sIn.addEventListener('keydown', function(e){ if(e.key==='Enter'){ doSearch(); } });
/* ===== 4.5.1 网易云歌单一键导入（gdstudio types=playlist，CORS 可用） ===== */
function nicoExtractPlaylistId(input){
    var s = String(input || '').trim();
    var m = s.match(/playlist[\/=](\d+)/i) || s.match(/^[\?&]?id=(\d+)/) || s.match(/^(\d{6,15})$/);
    return m ? m[1] : '';
}
async function nicoImportPlaylist(){
    var input = prompt('输入网易云歌单链接或歌单ID：\n例如 https://music.163.com/#/playlist?id=3778678\n或直接 3778678');
    if(input === null || input === '') return;
    var pid = nicoExtractPlaylistId(input);
    if(!pid){ nicoShowToast('无法识别歌单ID'); return; }
    var plBtn = panel.querySelector('#nico-mu-pl-btn');
    if(plBtn){ plBtn.disabled = true; plBtn.textContent = '…'; }
    nicoShowToast('正在读取歌单...');
    try{
        var res = await muFetch(MUSIC_API + '?types=playlist&id=' + encodeURIComponent(pid), 10000).then(function(r){ return r.json(); });
        var tracks = (res && res.playlist && res.playlist.tracks) || [];
        if(!tracks.length){ nicoShowToast('歌单为空或读取失败'); return; }
        nicoShowToast('歌单共 ' + tracks.length + ' 首，开始解析音源...');
        var added = 0, existed = 0, failed = 0;
        for(var i=0; i<tracks.length; i++){
            var t = tracks[i];
            var tName = t.name || '';
            var tArtist = (t.ar || []).map(function(a){ return a.name || ''; }).join(' / ');
            var dup = false;
            for(var j=0; j<playlist.length; j++){
                if(playlist[j].name === tName && (playlist[j].artist || '') === tArtist){ dup = true; break; }
            }
            if(dup){ existed++; continue; }
            var got = null;
            try{ got = await muSearchGD('netease', tName + ' ' + tArtist); }catch(e){}
            if(got){
                playlist.push({name: got.name, artist: got.artist || tArtist, url: got.url});
                added++;
            } else {
                failed++;
            }
            if(i % 5 === 0 || i === tracks.length - 1){
                nicoShowToast('导入中 ' + (i+1) + '/' + tracks.length + '（新增' + added + '，失败' + failed + '）');
            }
        }
        nicoSavePlaylist();
        buildList();
        if(added){ cIdx = playlist.length - 1; loadP(); }
        nicoShowToast('导入完成：新增 ' + added + ' 首' + (existed ? '，跳过重复 ' + existed : '') + (failed ? '，失败 ' + failed : ''));
    }catch(e){
        nicoShowToast('歌单导入失败');
    }
    if(plBtn){ plBtn.disabled = false; plBtn.textContent = '歌单'; }
}
panel.querySelector('#nico-mu-pl-btn').addEventListener('click', nicoImportPlaylist);
var trId = null;
var trBtn = panel.querySelector('#nico-mu-btn');
var trIn = panel.querySelector('#nico-mu-in');
trBtn.onclick = function(){
    if(trId) {
      clearTimeout(trId); trId = null;
      trBtn.className = ''; trBtn.textContent = 'SET';
    } else {
      var m = parseFloat(trIn.value);
      if(m > 0) {
        trBtn.className = 'on'; trBtn.textContent = 'ON';
        trId = setTimeout(function(){
          au.pause(); uIcon(false);
          trId = null; trBtn.className = ''; trBtn.textContent = 'SET';
        }, m * 60000);
      }
    }
};

/* ===== 4.7 弹幕歌词：透明歌词模块（酒馆界面上层·可拖动）+ 面板内设置 ===== */
var DANMU_API = 'https://music-api.gdstudio.xyz/api.php';
var danmuEnabled = (localStorage.getItem('nico-danmu-on') || '1') === '1';
var danmuSettings = {
    colorR: parseInt(localStorage.getItem('nico-danmu-r') || '255', 10),
    colorG: parseInt(localStorage.getItem('nico-danmu-g') || '255', 10),
    colorB: parseInt(localStorage.getItem('nico-danmu-b') || '255', 10),
    size: parseInt(localStorage.getItem('nico-danmu-size') || '20', 10),
    opacity: parseFloat(localStorage.getItem('nico-danmu-op') || '1'),
    rainbow: (localStorage.getItem('nico-danmu-rb') || '0') === '1'
};
var nicoLyrics = [], nicoLyricKey = '', nicoLyricMod = null;
function parseLRC(lrcText){
    if(!lrcText) return [];
    var res = [];
    var lines = String(lrcText).split('\n');
    for(var i=0;i<lines.length;i++){
        var m = lines[i].match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if(m){
            var t = parseInt(m[1],10)*60 + parseInt(m[2],10) + parseInt(m[3].padEnd(3,'0'),10)/1000;
            var c = m[4].trim();
            if(c) res.push({time:t, text:c});
        }
    }
    return res.sort(function(a,b){ return a.time - b.time; });
}
function fetchDanmuLyrics(song, artist){
    if(!song) return;
    var key = song + '_' + (artist||'');
    if(key === nicoLyricKey && nicoLyrics.length) return;
    nicoLyricKey = key; nicoLyrics = [];
    var q = song + (artist ? ' ' + artist : '');
    var found = false;
    ['netease','tencent','kugou'].forEach(function(src){
        muFetch(DANMU_API + '?types=search&count=3&source=' + src + '&name=' + encodeURIComponent(q), 6000)
        .then(function(r){ return r.json(); })
        .then(function(sr){
            if(found || !sr || !sr.length) return;
            var item = sr[0];
            return muFetch(DANMU_API + '?types=lyric&id=' + item.id + '&source=' + src, 6000)
            .then(function(r){ return r.json(); })
            .then(function(lr){
                if(!found && lr && lr.lyric){ found = true; nicoLyrics = parseLRC(lr.lyric); }
            });
        }).catch(function(){});
    });
    // 8 秒没找到歌词则降级只显示歌曲名
    setTimeout(function(){
        if(nicoLyrics.length === 0 && !found){
            nicoLyrics = [{time:0, text:song + (artist ? ' - ' + artist : '')}];
        }
    }, 8000);
}
function updLyric(){
    if(!nicoLyricMod || !danmuEnabled) return;
    var cur = nicoLyricMod.querySelector('.nico-lyr-cur');
    var prev = nicoLyricMod.querySelector('.nico-lyr-prev');
    if(nicoLyrics.length === 0){ if(cur) cur.textContent = '未在播放'; if(prev) prev.textContent = ''; return; }
    var ct = au.currentTime || 0;
    var idx = -1;
    for(var i=0;i<nicoLyrics.length;i++){ if(nicoLyrics[i].time <= ct + 0.3) idx = i; else break; }
    if(idx === -1) return;
    var t = nicoLyrics[idx].text;
    var p = idx > 0 ? nicoLyrics[idx-1].text : '';
    if(cur && cur.textContent !== t){
        cur.textContent = t;
        cur.style.color = 'rgb(' + danmuSettings.colorR + ',' + danmuSettings.colorG + ',' + danmuSettings.colorB + ')';
        cur.style.fontSize = danmuSettings.size + 'px';
        cur.style.opacity = danmuSettings.opacity;
        if(danmuSettings.rainbow){ cur.classList.add('gradient'); }
        else { cur.classList.remove('gradient'); }
    }
    if(prev) prev.textContent = p;
}
function createLyricMod(){
    if(nicoLyricMod) return;
    nicoLyricMod = document.createElement('div');
    nicoLyricMod.className = 'nico-lyric-mod' + (danmuEnabled ? '' : ' hidden');
    nicoLyricMod.innerHTML = '<div class="nico-lyr-prev"></div><div class="nico-lyr-cur">未在播放</div>';
    document.body.appendChild(nicoLyricMod);
    // 拖动（鼠标 + 触摸），限制在页面上半区不遮挡操作
    var isD = false, sx = 0, sy = 0, sl = 0, st = 0;
    function dStart(cx, cy){
        isD = true; sx = cx; sy = cy;
        var r = nicoLyricMod.getBoundingClientRect();
        sl = r.left; st = r.top;
        nicoLyricMod.style.left = sl + 'px'; nicoLyricMod.style.top = st + 'px';
        nicoLyricMod.style.transform = 'none';
    }
    function dMove(cx, cy){
        if(!isD) return;
        var nl = Math.max(0, Math.min(window.innerWidth - nicoLyricMod.offsetWidth, sl + (cx - sx)));
        var mt = Math.floor(window.innerHeight * 0.55);
        var nt = Math.max(0, Math.min(mt, st + (cy - sy)));
        nicoLyricMod.style.left = nl + 'px'; nicoLyricMod.style.top = nt + 'px';
    }
    function dEnd(){ isD = false; }
    nicoLyricMod.addEventListener('mousedown', function(e){ dStart(e.clientX, e.clientY); e.preventDefault(); });
    document.addEventListener('mousemove', function(e){ dMove(e.clientX, e.clientY); });
    document.addEventListener('mouseup', dEnd);
    nicoLyricMod.addEventListener('touchstart', function(e){ var t = e.touches[0]; dStart(t.clientX, t.clientY); }, {passive:true});
    document.addEventListener('touchmove', function(e){ if(isD){ var t = e.touches[0]; dMove(t.clientX, t.clientY); } }, {passive:true});
    document.addEventListener('touchend', dEnd);
}
// 面板内弹幕设置
var dmSet = panel.querySelector('.nico-danmu-set');
var dmToggle = panel.querySelector('#nico-danmu-toggle');
var dmBody = panel.querySelector('#nico-danmu-body');
var dmInd = panel.querySelector('#nico-danmu-ind');
function updDanmuUI(){
    dmInd.textContent = danmuEnabled ? '开' : '关';
    dmInd.className = 'nico-danmu-ind' + (danmuEnabled ? '' : ' off');
    panel.querySelector('#nico-danmu-sw').className = 'nico-danmu-sw' + (danmuEnabled ? ' on' : '');
    panel.querySelector('#nico-danmu-rb').className = 'nico-danmu-sw' + (danmuSettings.rainbow ? ' on' : '');
    var hex = '#' + [danmuSettings.colorR, danmuSettings.colorG, danmuSettings.colorB].map(function(v){ return (v||0).toString(16).padStart(2,'0'); }).join('');
    var ci = panel.querySelector('#nico-danmu-color'); if(ci) ci.value = hex;
    var si = panel.querySelector('#nico-danmu-size'); if(si) si.value = danmuSettings.size;
    var sv = panel.querySelector('#nico-danmu-size-v'); if(sv) sv.textContent = danmuSettings.size;
    var oi = panel.querySelector('#nico-danmu-op'); if(oi) oi.value = Math.round(danmuSettings.opacity * 100);
    var ov = panel.querySelector('#nico-danmu-op-v'); if(ov) ov.textContent = Math.round(danmuSettings.opacity * 100) + '%';
}
dmToggle.addEventListener('click', function(){ dmBody.classList.toggle('open'); });
panel.querySelector('#nico-danmu-sw').addEventListener('click', function(){
    danmuEnabled = !danmuEnabled;
    localStorage.setItem('nico-danmu-on', danmuEnabled ? '1' : '0');
    if(nicoLyricMod) nicoLyricMod.classList.toggle('hidden', !danmuEnabled);
    updDanmuUI();
});
panel.querySelector('#nico-danmu-rb').addEventListener('click', function(){
    danmuSettings.rainbow = !danmuSettings.rainbow;
    localStorage.setItem('nico-danmu-rb', danmuSettings.rainbow ? '1' : '0');
    updDanmuUI();
});
panel.querySelector('#nico-danmu-color').addEventListener('change', function(){
    var val = this.value.trim();
    var hexOk = /^#[0-9a-fA-F]{6}$/.test(val);
    if(!hexOk){ updDanmuUI(); return; }
    danmuSettings.colorR = parseInt(val.substring(1,3),16);
    danmuSettings.colorG = parseInt(val.substring(3,5),16);
    danmuSettings.colorB = parseInt(val.substring(5,7),16);
    localStorage.setItem('nico-danmu-r', String(danmuSettings.colorR));
    localStorage.setItem('nico-danmu-g', String(danmuSettings.colorG));
    localStorage.setItem('nico-danmu-b', String(danmuSettings.colorB));
});
panel.querySelector('#nico-danmu-size').addEventListener('input', function(){
    danmuSettings.size = parseInt(this.value, 10);
    localStorage.setItem('nico-danmu-size', String(danmuSettings.size));
    panel.querySelector('#nico-danmu-size-v').textContent = danmuSettings.size;
});
panel.querySelector('#nico-danmu-op').addEventListener('input', function(){
    danmuSettings.opacity = parseInt(this.value, 10) / 100;
    localStorage.setItem('nico-danmu-op', String(danmuSettings.opacity));
    panel.querySelector('#nico-danmu-op-v').textContent = this.value + '%';
});
panel.querySelector('#nico-danmu-reset').addEventListener('click', function(){
    danmuSettings = { colorR:255, colorG:255, colorB:255, size:20, opacity:1, rainbow:false };
    ['nico-danmu-r','nico-danmu-g','nico-danmu-b','nico-danmu-size','nico-danmu-op','nico-danmu-rb'].forEach(function(k){ try{localStorage.removeItem(k);}catch(e){} });
    updDanmuUI();
    if(nicoLyricMod){
        var cur = nicoLyricMod.querySelector('.nico-lyr-cur');
        if(cur){ cur.style.color = '#fff'; cur.style.fontSize = '20px'; cur.style.opacity = 1; cur.classList.remove('gradient'); }
    }
});
updDanmuUI();
try{ createLyricMod(); }catch(e){}
// 播放联动：切歌时加载对应歌词
var _origLoadP = loadP;
loadP = function(){
    _origLoadP();
    var s = playlist[cIdx];
    if(s) fetchDanmuLyrics(s.name, s.artist || '');
};
// 初始加载当前歌曲歌词
try{ var _cs = playlist[cIdx]; if(_cs) fetchDanmuLyrics(_cs.name, _cs.artist || ''); }catch(e){}

/* ===== 4.8 独立图片库：本地上传 / IndexedDB 持久缓存 / 点击删除（不干扰图片墙） ===== */
var nicoToast = document.createElement('div');
nicoToast.className = 'nico-toast';
document.body.appendChild(nicoToast);
var nicoToastT = null;
function nicoShowToast(msg){
    nicoToast.textContent = msg;
    nicoToast.classList.add('show');
    clearTimeout(nicoToastT);
    nicoToastT = setTimeout(function(){ nicoToast.classList.remove('show'); }, 1400);
}
// IndexedDB 封装（v3：images 图片墙 / gallery 图片库 / profile 角色资料，容量大优于 localStorage）
function nicoDB(){
    return new Promise(function(res, rej){
        try{
            var req = window.indexedDB.open('nicoDrawPanel', 3);
            req.onupgradeneeded = function(){
                try{
                    var db = req.result;
                    if(!db.objectStoreNames.contains('images')) db.createObjectStore('images');
                    if(!db.objectStoreNames.contains('gallery')) db.createObjectStore('gallery');
                    if(!db.objectStoreNames.contains('profile')) db.createObjectStore('profile');
                }catch(e){}
            };
            req.onsuccess = function(){ res(req.result); };
            req.onerror = function(){ rej(req.error); };
        }catch(e){ rej(e); }
    });
}
function nicoIdbSet(store, key, dataURL){
    return nicoDB().then(function(db){
        return new Promise(function(res, rej){
            try{
                var tx = db.transaction(store, 'readwrite');
                tx.objectStore(store).put(dataURL, key);
                tx.oncomplete = res; tx.onerror = function(){ rej(tx.error); };
            }catch(e){ rej(e); }
        });
    });
}
function nicoIdbDel(store, key){
    return nicoDB().then(function(db){
        return new Promise(function(res, rej){
            try{
                var tx = db.transaction(store, 'readwrite');
                tx.objectStore(store).delete(key);
                tx.oncomplete = res; tx.onerror = function(){ rej(tx.error); };
            }catch(e){ rej(e); }
        });
    });
}
function nicoIdbAll(store){
    return nicoDB().then(function(db){
        return new Promise(function(res, rej){
            try{
                var tx = db.transaction(store, 'readonly');
                var cur = tx.objectStore(store).openCursor();
                var out = [];
                cur.onsuccess = function(){
                    var c = cur.result;
                    if(c){ out.push({key: c.key, value: c.value}); c.continue(); }
                    else res(out);
                };
                cur.onerror = function(){ rej(cur.error); };
            }catch(e){ rej(e); }
        });
    });
}
// 用 canvas 压缩上传图片到最长边（默认 2560px 高清；快拍等小图可传更小值），JPEG 0.92 保质量
function nicoCompress(imgData, cb, max){
    if(!max) max = 2560;
    try{
        var img = new window.Image();
        img.onload = function(){
            try{
                var m = max, w = img.naturalWidth, h = img.naturalHeight;
                var scale = Math.min(1, m / Math.max(w, h));
                var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
                var cv = document.createElement('canvas');
                cv.width = cw; cv.height = ch;
                cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
                var type = (imgData.indexOf('image/png') === 0) ? 'image/png' : 'image/jpeg';
                cb(cv.toDataURL(type, 0.92));
            }catch(e){ cb(imgData); }
        };
        img.onerror = function(){ cb(imgData); };
        img.src = imgData;
    }catch(e){ cb(imgData); }
}
// 图片库渲染 / 上传 / 删除（横向整屏滑动，与原图片墙同排版）
var galleryRoll = panel.querySelector('#nico-gallery-roll');
var galleryAdd = panel.querySelector('.nico-gallery-add');
function nicoRenderGallery(list){
    galleryRoll.innerHTML = '';
    if(!list || !list.length){
        galleryRoll.innerHTML = '<div class="nico-gallery-empty">还没有图片，点上方"上传"添加</div>';
        return;
    }
    for(var i=0; i<list.length; i++){
        (function(item){
            var it = document.createElement('div');
            it.className = 'nico-gr-item';
            var img = document.createElement('img');
            img.src = item.value; img.alt = '';
            var del = document.createElement('button');
            del.type = 'button'; del.className = 'nico-gr-del'; del.textContent = '× 删除'; del.title = '删除这张图';
            del.onclick = function(){
                nicoIdbDel('gallery', item.key).then(function(){
                    nicoShowToast('已删除');
                    nicoLoadGallery();
                }).catch(function(){ nicoShowToast('删除失败'); });
            };
            it.appendChild(img); it.appendChild(del);
            galleryRoll.appendChild(it);
        })(list[i]);
    }
}
function nicoLoadGallery(){
    nicoIdbAll('gallery').then(function(list){ nicoRenderGallery(list); }).catch(function(){ nicoRenderGallery([]); });
}
galleryAdd.onclick = function(){
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.multiple = true;
    inp.onchange = function(){
        var files = inp.files;
        if(!files || !files.length) return;
        var n = files.length, done = 0;
        Array.prototype.forEach.call(files, function(f){
            var rd = new FileReader();
            rd.onload = function(){
                nicoCompress(rd.result, function(dataURL){
                    var key = 'gallery_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
                    nicoIdbSet('gallery', key, dataURL).then(function(){
                        done++;
                        if(done === n){ nicoShowToast('已上传 ' + done + ' 张'); nicoLoadGallery(); }
                    }).catch(function(){
                        done++;
                        if(done === n) nicoLoadGallery();
                    });
                });
            };
            rd.readAsDataURL(f);
        });
    };
    inp.click();
};
nicoLoadGallery();

/* ===== 4.9 角色资料点击编辑（头像/ID/昵称/签名/身高/年龄），IndexedDB 本地缓存 ===== */
function nicoProfileGet(key){
    return nicoDB().then(function(db){
        return new Promise(function(res, rej){
            try{
                var tx = db.transaction('profile', 'readonly');
                var g = tx.objectStore('profile').get(key);
                g.onsuccess = function(){ res(g.result); };
                g.onerror = function(){ rej(g.error); };
            }catch(e){ rej(e); }
        });
    });
}
function nicoProfileSet(key, val){
    return nicoDB().then(function(db){
        return new Promise(function(res, rej){
            try{
                var tx = db.transaction('profile', 'readwrite');
                tx.objectStore('profile').put(val, key);
                tx.oncomplete = res; tx.onerror = function(){ rej(tx.error); };
            }catch(e){ rej(e); }
        });
    });
}
var nicoProfileEls = {
    name: panel.querySelector('.nico-st-v[data-edit="name"]'),
    height: panel.querySelector('.nico-st-v[data-edit="height"]'),
    age: panel.querySelector('.nico-st-v[data-edit="age"]'),
    id: panel.querySelector('.nico-b-id[data-edit="id"]'),
    sign: panel.querySelector('.nico-bio [data-edit="sign"]'),
    avatar: panel.querySelector('.nico-av-in'),
    navid: panel.querySelector('.nico-nav-txt[data-edit="navid"]')
};
function nicoSaveProfile(){
    var p = {
        name: nicoProfileEls.name ? nicoProfileEls.name.textContent : '',
        height: nicoProfileEls.height ? nicoProfileEls.height.textContent : '',
        age: nicoProfileEls.age ? nicoProfileEls.age.textContent : '',
        id: nicoProfileEls.id ? nicoProfileEls.id.textContent : '',
        sign: nicoProfileEls.sign ? nicoProfileEls.sign.textContent : '',
        avatar: (nicoProfileEls.avatar && nicoProfileEls.avatar.src.indexOf('data:') === 0) ? nicoProfileEls.avatar.src : '',
        navid: (nicoProfileEls.navid && nicoProfileEls.navid.textContent) ? nicoProfileEls.navid.textContent : ''
    };
    nicoProfileSet('profile', p).then(function(){
        nicoShowToast('已保存');
    }).catch(function(){ nicoShowToast('保存失败'); });
}
// 内联编辑：点击直接在原文本位置编辑（保持原样，只出现光标竖线，无多余模块）
// 文本变多时自动缩小字号，避免撑乱布局、干扰其它文本
function nicoFitText(el){
    var base = parseInt(el.getAttribute('data-fs') || '14', 10);
    var len = (el.textContent||'').length;
    var size = base;
    if(len > 3) size = base - Math.ceil((len - 3) / 3);
    if(size < 10) size = 10;
    el.style.fontSize = size + 'px';
}
function nicoCommitEdit(el){
    if(el.getAttribute('contenteditable') !== 'true') return;
    var t = (el.textContent||'').replace(/\s+/g, ' ').trim();
    el.setAttribute('contenteditable','false');
    el.textContent = t || '—';
    nicoFitText(el);
    nicoSaveProfile();
}
function nicoBindEditable(sel){
    var el = panel.querySelector(sel);
    if(!el) return;
    if(!el.getAttribute('data-fs')) el.setAttribute('data-fs', Math.round(parseFloat(window.getComputedStyle(el).fontSize)) || 14);
    el.addEventListener('click', function(ev){
        ev.stopPropagation();
        if(el.getAttribute('contenteditable') === 'true') return;
        el.setAttribute('contenteditable','true');
        el._nicoOld = el.textContent;
        el.focus();
        try{
            var s = window.getSelection();
            s.selectAllChildren(el);
            s.collapseToEnd();
        }catch(e){}
    });
    el.addEventListener('blur', function(){ nicoCommitEdit(el); });
    el.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){ e.preventDefault(); el.blur(); }
        else if(e.key === 'Escape'){
            e.preventDefault();
            el.textContent = el._nicoOld || '';
            nicoFitText(el);
            el.blur();
        }
    });
    el.addEventListener('input', function(){ nicoFitText(el); });
}
nicoBindEditable('.nico-st-v[data-edit="name"]');
nicoBindEditable('.nico-st-v[data-edit="height"]');
nicoBindEditable('.nico-st-v[data-edit="age"]');
nicoBindEditable('.nico-b-id[data-edit="id"]');
nicoBindEditable('.nico-bio [data-edit="sign"]');
nicoBindEditable('.nico-nav-txt[data-edit="navid"]');
// 头像：点击上传本地图片并缓存
function nicoBindAvatarEdit(){
    var bx = panel.querySelector('.nico-av-bx[data-edit="avatar"]');
    if(!bx) return;
    bx.addEventListener('click', function(ev){
        ev.stopPropagation();
        var inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = function(){
            var f = inp.files && inp.files[0];
            if(!f) return;
            var rd = new FileReader();
            rd.onload = function(){
                nicoCompress(rd.result, function(dataURL){
                    if(nicoProfileEls.avatar) nicoProfileEls.avatar.src = dataURL;
                    nicoSaveProfile();
                });
            };
            rd.readAsDataURL(f);
        };
        inp.click();
    });
}
nicoBindAvatarEdit();
// 快拍头像：点击上传本地图片替换（IndexedDB 本地缓存，压缩 1024px 保高清且轻量）
var nicoQuickImgs = panel.querySelectorAll('.nico-s-in');
var nicoQuickFile = panel.querySelector('#nico-quick-file');
var nicoQuickTarget = 0;
function nicoQuickPicsArr(){
    var arr = [];
    for(var qi=0; qi<nicoQuickImgs.length; qi++){
        arr.push(nicoQuickImgs[qi].src.indexOf('data:') === 0 ? nicoQuickImgs[qi].src : '');
    }
    return arr;
}
function nicoBindQuickPics(){
    if(!nicoQuickFile) return;
    for(var qi=0; qi<nicoQuickImgs.length; qi++){
        (function(img, idx){
            var box = img.closest('.nico-s-rng');
            if(!box) return;
            box.addEventListener('click', function(ev){
                ev.stopPropagation();
                nicoQuickTarget = idx;
                nicoQuickFile.value = '';
                nicoQuickFile.click();
            });
        })(nicoQuickImgs[qi], qi);
    }
    nicoQuickFile.addEventListener('change', function(){
        var f = nicoQuickFile.files && nicoQuickFile.files[0];
        if(!f || nicoQuickTarget < 0 || nicoQuickTarget >= nicoQuickImgs.length) return;
        var img = nicoQuickImgs[nicoQuickTarget];
        var rd = new FileReader();
        rd.onload = function(){
            nicoCompress(rd.result, function(dataURL){
                img.src = dataURL;
                nicoProfileSet('quickpics', nicoQuickPicsArr()).then(function(){
                    nicoShowToast('快拍已替换');
                }).catch(function(){ nicoShowToast('保存失败'); });
            }, 1024);
        };
        rd.readAsDataURL(f);
    });
}
nicoBindQuickPics();
// 初始化：从 IndexedDB 恢复已编辑的角色资料
nicoProfileGet('profile').then(function(p){
    if(!p) return;
    if(p.name && nicoProfileEls.name){ nicoProfileEls.name.textContent = p.name; nicoFitText(nicoProfileEls.name); }
    if(p.height && nicoProfileEls.height){ nicoProfileEls.height.textContent = p.height; nicoFitText(nicoProfileEls.height); }
    if(p.age && nicoProfileEls.age){ nicoProfileEls.age.textContent = p.age; nicoFitText(nicoProfileEls.age); }
    if(p.id && nicoProfileEls.id){ nicoProfileEls.id.textContent = p.id; nicoFitText(nicoProfileEls.id); }
    if(p.sign && nicoProfileEls.sign){ nicoProfileEls.sign.textContent = p.sign; nicoFitText(nicoProfileEls.sign); }
    if(p.avatar && p.avatar.indexOf('data:') === 0 && nicoProfileEls.avatar) nicoProfileEls.avatar.src = p.avatar;
    if(p.navid && nicoProfileEls.navid){ nicoProfileEls.navid.textContent = p.navid; nicoFitText(nicoProfileEls.navid); }
}).catch(function(){});
// 初始化：恢复已替换的快拍头像
nicoProfileGet('quickpics').then(function(arr){
    if(!arr || !arr.length) return;
    for(var qi=0; qi<nicoQuickImgs.length && qi<arr.length; qi++){
        if(arr[qi] && arr[qi].indexOf('data:') === 0) nicoQuickImgs[qi].src = arr[qi];
    }
}).catch(function(){});

/* ===== 5. 关闭（底部拖拽条） ===== */
var cBtn = panel.querySelector('#Nico-Draw-Close');
cBtn.addEventListener('click', function(){ panel.classList.remove('is-open'); });
cBtn.addEventListener('touchstart', function(e){ if(e.cancelable)e.preventDefault(); panel.classList.remove('is-open'); }, {passive:false});
/* ===== 5.1 恢复初始配色 / 跟随酒馆主题切换（localStorage 持久化，纯 class 切换零开销） ===== */
var themeBtn = panel.querySelector('#nico-theme-btn');
var nicoThemeReset = (localStorage.getItem('nico-draw-theme-reset') || '0') === '1';
function nicoApplyTheme(reset){
    if(reset){ panel.classList.add('nico-theme-reset'); }
    else{ panel.classList.remove('nico-theme-reset'); }
}
nicoApplyTheme(nicoThemeReset);
if(themeBtn){
    themeBtn.addEventListener('click', function(e){
        e.stopPropagation();
        nicoThemeReset = !nicoThemeReset;
        localStorage.setItem('nico-draw-theme-reset', nicoThemeReset ? '1' : '0');
        nicoApplyTheme(nicoThemeReset);
        nicoShowToast(nicoThemeReset ? '已恢复初始配色' : '已跟随酒馆主题');
    });
}

/* ===== 6. 页面卸载清理 ===== */
window.addEventListener('beforeunload', function(){
    if (document._nicoDrawPanelHandlers) {
        document.removeEventListener('touchstart', document._nicoDrawPanelHandlers.ts);
        document.removeEventListener('touchmove', document._nicoDrawPanelHandlers.tm);
        document.removeEventListener('mousedown', document._nicoDrawPanelHandlers.md);
        document.removeEventListener('mousemove', document._nicoDrawPanelHandlers.mm);
        document.removeEventListener('mouseup', document._nicoDrawPanelHandlers.mu);
    }
    if(trId) clearTimeout(trId);
    try{var _p=document.getElementById(PANEL_ID); if(_p)_p.remove();}catch(e){}
    try{var _s=document.getElementById(CSS_ID); if(_s)_s.remove();}catch(e){}
});
})();

/* Qixian Draw Panel (Nico Draw Panel) - SillyTavern Extension v1.12.2
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
   v1.10.8 搜索优化：
     · 可播校验 800ms→3s，全灭后慢速复核(6s)，抗移动网络抖动；
     · 失败结果不再永久缓存（10 分钟 TTL），空结果直接重搜；
     · 全局结算 7s→12s，QQ 兜底串行改并行，最坏耗时大幅下降；
     · 新增独立"歌手"搜索框，排序强制歌手匹配，避免搜到翻唱/错版本；
     · 搜索/直链接口超时整体放宽（4s/4.5s→6s/6.5s）。
   v1.10.9 搜索精准度再升级（对标 lyric-card 参考实现）：
     · 新增独立音源引擎 Qijieya Meting API（netease 直链通道，搜索结果自带可播 url），
       不依赖 gdstudio，即参考组件稳定性关键来源；同时接入 QQ/酷狗候选换源与慢速复核；
     · 可播校验升级为"时长感知"：loadedmetadata 后校验真实时长，空轨/坏轨/占位短轨
       直接判死；流式源时长未知时以 canplay 能否真正开播为准（比参考 duration>2 更稳）；
     · 打分器精修：歌手支持多段归一（"A / B"任一命中即算），歌手字段缺失不再误罚，
       歌名+歌手全等时绝对优先，杜绝翻唱/错版本抢位。
   v1.10.10 精准度追平并反超参考实现（修复"谁先通过用谁"竞速缺陷）：
     · 修复 muRaceCheck 关键缺陷：旧版并行校验"谁先通过用谁"，慢一点的正确音源
       总被更快的翻唱/错版本抢位；新版"前置候选全部有结论才结算"——任何候选通过时，
       只要还有比它更相关的候选在途，就等其出结果，慢但对永远压过快但错；
     · 候选池 = 引擎原生第一候选 ∪ 打分前5，等同参考代码"信任原生排序"又保留打分覆盖；
     · 搜索结果按全局相关度排序插入（引擎优先级×引擎内排名），第一个结果就是最准的，
       不再按到达先后堆叠，弱引擎的翻唱版只会排后面；
     · 可播校验与参考对齐：以 canplay 真正开播为准，过滤"元数据能读、数据拉不动"假源；
     · netease 直链 iarc 优先（并行发起、iarc 结果优先），避免 gdstudio 偶尔返回同名错轨。
   v1.11.0 搜索速度与稳定性再升级（实测接口存活度 + 对齐参考实现"先到先得"速度策略）：
     · 实测确认 qijieya(Meting) 187ms、gdstudio ~1s 存活，qjqq/azhang/zygg/tmj 均不可用全部剔除；
     · 新增 injahow Meting 直链通道（netease type=url 实测返回真实音频流），与 iarc/gdstudio
       三路并行取直链，netease 可用性显著提升；
     · 结算策略对齐参考实现"先到先得"：首个引擎返回可播结果立即结算上屏（原实现要等全部
       引擎结束，最坏 12s+10s），命中耗时从"最慢引擎"变为"最快引擎"；后台继续收 2.5s
       补充候选并写入缓存，兼顾速度与精准；
     · 新增引擎健康度自适应：localStorage 记录各引擎成败/耗时，10 分钟内连挂 3 次的引擎
       自动跳过，下次搜索不再等死链超时；搜索接口超时收紧（6s→4.5s，JSONP 6.5s→5s），
       全灭兜底 12s→9s；
     · 新搜索发起时立即中止上一轮全部在途请求（AbortController 注册表），连点搜索不再排队；
     · qijieya 偶发返回 HTML 文档页已做非 JSON 防护，不会崩也不计入引擎失败；
     · 播放容错：歌曲播放失败（死链/被限流）自动换源重搜一次，再失败自动切下一首，
       歌单里不再出现"点了没声音"的死曲目。
   v1.12.0 网易云歌单修复 + 歌曲持久化升级：
     · 歌单链接识别修复：原正则只认 playlist/xxx 与裸 ID，标准分享链接
       music.163.com/#/playlist?id=xxx 会识别失败（playlist 后跟的是 ?），
       现已兼容 playlist?id= / playlist/ / ?id= / 裸 ID / 163cn.tv 短链
       （自动跟随跳转还原真实链接）；
     · 歌单读取双通道：gdstudio 为主，Meting playlist（injahow/qijieya）兜底，
       响应结构多形态兼容；
     · 导入改按网易云歌曲 ID 直链解析（持久 302 直链优先，iarc/gdstudio 兜底），
       不再逐首按"歌名+歌手"搜索——更快更准、不会配错翻唱；8 路并行批量解析；
     · 歌曲新增 sid/src 持久化字段：搜索添加/歌单导入的歌曲都记录原始 ID，
       音源失效时优先按原 ID 精确重解析并自动续播，不再因直链过期集体失效。
   v1.12.1 搜歌播放对齐 lyric-card 参考实现：
     · 可播校验对齐参考严格标准：已知时长须 >2s 才入库，未知时长（流式/坏源）
       直接判死——不再放行"元数据能读、数据拉不动"的假源，搜索/导入进歌单的
       歌曲基本不会"点了没声音"；
     · 歌词按歌曲 ID 精确拉取：优先 gdstudio lyric + qijieya lrc 双通道直拉，
       不再"搜歌名→取第一条"（可能配错版本歌词）；失败才退回歌名搜索；
     · 搜索结果点整条 = 添加并立即播放（对齐参考"搜到即听"），点"添加"按钮
       仍只入库不打断当前播放；
     · 搜索结果自动给全局相关度第一的版本打红色"推荐"徽标，帮你避开翻唱/错版本。
   v1.12.2 歌单 VIP 歌曲全长播放修复（对齐并反超 lyric-card 参考实现）：
     · 音源结算 iarc 优先：参考实现验证过的 VIP 全长直链通道，不再让 meting
       试听短轨（injahow/qijieya 对 VIP 歌常返回 ~30s 试听轨）先通过而"听不完"；
     · 新增 muResolveBest 多通道时长感知结算：iarc/injahow/qijieya 全通道并行，
       iarc 可播即用；iarc 失效时优先"已知时长更长"的可播候选（全长>试听短轨），
       时长未知的流式源按通道优先级兜底——比参考"谁先通过用谁"更精准；
     · 可播校验对齐参考：流式源（duration=Infinity）canplay 即通过，不再误杀
       CDN 流式响应的 VIP 直链（参考实现 Infinity>2 判定通过）；
     · iarc 直链统一 http→https 升级，杜绝 https 页面下混合内容被浏览器拦截；
     · 歌单重导自动刷新已有同 ID 歌曲：旧数据若是试听短轨，重导一次即原位换成长全长音源。
   v1.13.0 搜索精准与"不换错歌"大修复（2026-09 实测第三方 API 大量失效后针对性修复）：
     · 实测结论：gdstudio search/playlist 存活，但 iarc / injahow url / qijieya url 均返回空，
       injahow / qijieya 的 search 通道返回 HTML 帮助页（非 JSON）；QQ/酷狗 JSONP 存活。
       即"VIP 全长通道"当前几乎全部不可用，可播直链实际只剩 gdstudio 按 ID 取链。
     · 打分器 muRank 重写：歌手出现在歌名里也算命中（如"晴天 (原唱 周杰伦)"）、
       "深情/女声/男声/DJ/R&B/钢琴/伴奏/串烧/Cover"等版本标签重罚、带"原唱"标记加分；
       修复 gdstudio 原生第一候选常为翻唱/深情版、打分器却把正确版本压下去的精准度问题。
     · 候选池重构：不再强制"原生第一候选永远优先"（它就是翻唱重灾区），改为按打分排序，
       原生第一候选降级为打分前 6 之外的末位兜底（pri=99），正确版本不再被翻唱抢位。
     · 引擎结算改"优先级感知"：低优先级引擎（QQ/酷狗换源）先返回时，若网易云系仍在途，
       最多等 3.5s 让其出结果，慢但对绝不让快但错抢位；结算后不再中止在途请求，
       晚到的正确结果仍会追加进结果列表。
     · 换源强匹配校验：QQ/酷狗"搜索入口→网易云系出音源"的换源结果必须与用户输入的
       歌名+歌手强匹配，对不上直接丢弃——杜绝"显示对、声音错"与"莫名换成其它歌"。
     · 缓存修复：gdstudio 直链是限时签名 URL（约数小时过期），原 10 分钟缓存会命中死链，
       改 2 分钟 TTL + 命中后复验首条 URL，失效即弃缓存重搜。
     · 自动切歌收敛：歌曲音源失效且按原 ID 重解析失败时，不再自动"切到下一首"
       （"莫名其妙换成其它"的直接根源），改为暂停并提示；旧数据无 ID 兜底搜索时
       必须强匹配，配不到正确版本宁可暂停也不换错歌。
     · 歌单导入防错配：按 ID 解析失败退回"歌名+歌手搜索"时加强匹配校验，配到翻唱/错版本
       的歌曲不再混进歌单（失败数明确提示）；gdstudio 直链纳入并行解析通道，
       当前 iarc/meting 全灭时的实际主力通道。
   已移除原组件中的"全域文本阅读器"(STORY ARCHIVE / MutationObserver 文本捕获)。
   所有 DOM 直接注入酒馆主页面，无 iframe 间接层。 */
(function(){
'use strict';
try{console.log('%c[Nico-Draw-Panel] v1.13.0 已加载：搜索精准修复·歌单导入防错配·禁止自动换歌','color:#818cf8;font-weight:bold');}catch(e){}

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
.nico-m-src .nico-m-artist{flex:0 0 92px;min-width:0;}
.nico-m-res{display:none;margin-bottom:10px;}
.nico-m-res.show{display:block;}
.nico-m-res-it{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 2px;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.05));}
.nico-m-res-name{font-size:12px;color:var(--SmartThemeBodyColor,#333);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;}
.nico-m-res-add{background:none;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,0.18));border-radius:10px;padding:3px 12px;font-size:11px;color:var(--SmartThemeBodyColor,#111);cursor:pointer;flex-shrink:0;transition:all .2s;}
.nico-m-res-add:active{transform:scale(0.92);background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);}
.nico-m-res-add.added{background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);border-color:var(--SmartThemeBodyColor,#111);pointer-events:none;}
/* v1.12.1：搜索结果"推荐"徽标（全局相关度第一） */
.nico-m-res-badge{display:inline-block;margin-left:6px;font-size:9px;line-height:1.4;color:#fff;background:#EF4444;border-radius:4px;padding:1px 5px;vertical-align:middle;flex-shrink:0;}
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
          <input type="text" id="nico-mu-search-in" placeholder="歌名" autocomplete="off" />
          <input type="text" id="nico-mu-artist-in" class="nico-m-artist" placeholder="歌手" autocomplete="off" />
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
    for(var _si=0; _si<savedPl.length; _si++){ playlist.push({name: savedPl[_si].name || '', artist: savedPl[_si].artist || '', url: savedPl[_si].url || '', sid: savedPl[_si].sid || '', src: savedPl[_si].src || ''}); }
} else {
    for(var _pi=0; _pi<pl.length; _pi++){ playlist.push({name: pl[_pi].name, artist: '', url: pl[_pi].url}); }
}
function nicoSavePlaylist(){
    try{
        localStorage.setItem('nico-playlist', JSON.stringify(playlist.map(function(s){ return {name:s.name, artist:s.artist||'', url:s.url, sid:s.sid||'', src:s.src||''}; })));
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
var muPlayIntent = false; // v1.11.0：用户主动播放过才触发死链自动换源
function pPlay(){
    muPlayIntent = true;
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

/* ===== v1.11.0 播放容错：死链自动换源重搜一次；v1.13.0：重解析失败不再自动切歌 ===== */
var muPlayRetried = {};
function muGotoNext(){
    if(playlist.length <= 1){ try{ au.currentTime = 0; }catch(e){} return; }
    cIdx = (cIdx + 1) % playlist.length; loadP(); pPlay();
}
au.addEventListener('error', function(){
    var s = playlist[cIdx];
    if(!s) return;
    if(!muPlayIntent) return;                    // 未主动播放（页面加载/预载）不触发重搜
    if(au.error && au.error.code === 1) return;  // MEDIA_ERR_ABORTED：用户主动中断
    if(/(placeholder|track\s?\d{2})/i.test(s.name||'')) return; // 默认占位曲不重搜
    var k = (s.name||'') + '|' + (s.url||'');
    if(muPlayRetried[k]){
        delete muPlayRetried[k];
        // v1.13.0：重试过仍失败 → 暂停并提示，不再自动"切到下一首"——
        // 这是"听着听着莫名其妙换成其它歌"的直接根源
        try{ au.pause(); }catch(e){}
        uIcon(false);
        nicoShowToast('音源失效，已暂停（可点下一首）');
        return;
    }
    muPlayRetried[k] = true;
    nicoShowToast('音源失效，正在重新解析…');
    // v1.12.0：优先按原始歌曲 ID 精确重解析（sid/src 已随歌曲持久化），
    // 不再盲目按"歌名+歌手"重搜而可能配到翻唱/错版本；修复后自动续播
    nicoReResolve(s).then(function(fixed){
        if(fixed){
            s.url = fixed.url;
            if(fixed.name) s.name = fixed.name;
            if(fixed.artist) s.artist = fixed.artist;
            if(fixed.sid) s.sid = fixed.sid;
            if(fixed.src) s.src = fixed.src;
            nicoSavePlaylist(); buildList();
            loadP();
            if(muPlayIntent){ try{ pPlay(); }catch(e){} } // 用户正在听，修复后自动续播
            nicoShowToast('已切换到新音源');
        }else{
            // v1.13.0：修复失败 → 暂停并提示（原实现 muGotoNext 自动切歌 = 莫名换歌元凶）
            try{ au.pause(); }catch(e){}
            uIcon(false);
            nicoShowToast('音源失效，已暂停（可点下一首）');
        }
    });
});

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
/* 在途请求注册表：新搜索发起 / 结算完成时中止上一轮全部 fetch，
   避免"连点搜索排队、慢引擎拖死会话"（v1.11.0）。
   muSearchGen：搜索代数，中止/换代后不再把旧引擎的失败记入健康分 */
var muActive=new Set();
var muSearchGen=0;
function muAbortAll(){ muSearchGen++; muActive.forEach(function(c){ try{c.abort();}catch(e){} }); muActive.clear(); }
function muFetch(url,timeout){
    var c=new AbortController();var tm=setTimeout(function(){c.abort();},timeout||8000);
    muActive.add(c);
    return fetch(url,{signal:c.signal}).then(function(r){clearTimeout(tm);muActive.delete(c);return r;}).catch(function(e){clearTimeout(tm);muActive.delete(c);throw e;});
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
// 时长感知可播校验：返回校验通过的时长（已知时长须 >2s，流式源返回 Infinity），失败返回 null。
// v1.12.2 对齐参考实现（lyric-card）：流式源（duration=Infinity，CDN 流式响应）
// 在 canplay 时视为可播（参考实现 Infinity>2 判定通过），不再误杀 VIP 直链；
// 仍拒绝 NaN/0/坏轨（<=0.5s），保持"宁缺毋滥"底线
function muCheckUrlDur(url,timeout){
    return new Promise(function(res){
        if(!url)return res(null);
        var t=new Audio();t.preload='metadata';t.muted=true;
        var done=false;
        var finish=function(d){if(done)return;done=true;clearTimeout(tm);try{t.onloadedmetadata=t.onerror=t.oncanplay=null;t.src='';}catch(e){}res(d);};
        var tm=setTimeout(function(){finish(null);},timeout||3000);
        t.onloadedmetadata=function(){
            var d=t.duration;
            if(d&&isFinite(d)&&d<=0.5)finish(null); // 明显坏轨提前判死
            /* 其余一律等 canplay 复核 */
        };
        t.oncanplay=function(){
            var d=t.duration;
            if(d&&isFinite(d)){ finish(d>2?d:null); }
            else if(d===Infinity){ finish(Infinity); } // 流式源：能开播即通过（对齐参考）
            else { finish(null); }
        };
        t.onerror=function(){finish(null);};
        try{t.src=url;}catch(e){finish(null);}
    });
}
// 布尔版可播判定（供 muRaceCheck 等沿用，行为与 v1.12.1 一致 + 放行流式源）
function muCheckUrlFast(url,timeout){
    return muCheckUrlDur(url,timeout||3000).then(function(d){ return d!==null && d!==undefined; });
}
// http→https 统一升级：参考实现同款，杜绝 https 页面下混合内容被浏览器拦截
function nicoUpHttps(u){ if(u&&u.indexOf('http://')===0)u=u.replace('http://','https://'); return u; }
// 网易云直链解析（v.iarc.top，版权/VIP覆盖强，参考实现验证过的 VIP 全长通道）
function muIarcUrl(id){
    return new Promise(function(res){
        muFetch('https://v.iarc.top/?type=url&id='+id,6000).then(function(rr){
            if(!rr||!rr.ok)return res('');
            var ct=rr.headers.get('content-type')||'';
            if(rr.url&&rr.url.indexOf('iarc.top')<0&&!ct.includes('json')&&!ct.includes('html'))return res(nicoUpHttps(rr.url));
            rr.json().then(function(jr){
                res(nicoUpHttps((Array.isArray(jr)&&jr[0])?(jr[0].url||''):(jr&&(jr.url||(jr.data&&jr.data.url))||'')));
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
        // iarc 与 gdstudio 并行发起，iarc 结果优先（对齐参考实现）——
        // 避免 gdstudio 直链偶尔返回同名错轨导致"显示对、声音错"
        var gdP=muFetch(MUSIC_API+'?types=url&source=netease&id='+item.id+'&br=320',6000)
            .then(function(r){return r.json();})
            .then(function(j){return (j&&j.url)||'';})
            .catch(function(){return '';});
        var iu=await muIarcUrl(item.id), gu=await gdP;
        finalUrl=iu||gu;
    }else{
        try{
            var ur=await muFetch(MUSIC_API+'?types=url&source='+source+'&id='+item.id+'&br=320',6500).then(function(r){return r.json();});
            if(ur&&ur.url)finalUrl=ur.url;
        }catch(e){}
    }
    if(finalUrl&&finalUrl.indexOf('http://')===0)finalUrl=finalUrl.replace('http://','https://');
    return finalUrl?{url:finalUrl,item:item}:null;
}
// 候选相关度排序：歌名/歌手多词包含匹配累计加分，翻唱/伴奏/Live/remix 降权
// v1.10.9 精修：歌手支持多段归一（"A / B"任一命中即算）；歌手字段缺失不再误罚；
// 歌名+歌手完全匹配额外加权，保证"精准命中"永远排在最前
// v1.13.0 重写：歌手出现在歌名里也算命中；版本标签（深情/女声/DJ/钢琴/Cover 等）重罚；
// "原唱"标记加分——修复 gdstudio 原生排序把翻唱放最前时打分器也跟着选错的问题
function muRank(items,query,artist){
    // 常见繁→简映射：Joox 等源返回繁体歌手名，统一后比对更准
    var T2S={'傑':'杰','倫':'伦','劉':'刘','陳':'陈','張':'张','孫':'孙','楊':'杨','鄧':'邓','蘇':'苏','鄒':'邹','黃':'黄','吳':'吴','鄭':'郑','許':'许','謝':'谢','韓':'韩','馮':'冯','趙':'赵','蔣':'蒋','蕭':'萧','葉':'叶','羅':'罗','項':'项','鍾':'钟','鐘':'钟','譚':'谭','馬':'马','陸':'陆','萬':'万','賴':'赖','範':'范','龍':'龙','鳳':'凤','愛':'爱','國':'国','學':'学','樂':'乐','單':'单','雙':'双','東':'东','華':'华','麗':'丽','兒':'儿'};
    function norm(s){return String(s||'').toLowerCase().split('').map(function(c){return T2S[c]||c;}).join('');}
    var q=norm(query);
    var parts=q.split(/\s+/).filter(Boolean);
    var wantArt=norm(artist);
    function artOf(it){return norm(it.artist||it.author||'');}
    // 歌手多段拆解：支持 "歌手A / 歌手B"、"A、B" 等形式，任一命中即算歌手命中
    function artTokens(a){return String(a||'').split(/[\/、,&，,\s]+/).filter(Boolean);}
    return items.map(function(it,idx){
        var name=norm(it.name||''),score=0;
        var bare=name.replace(/[（(].*?[)）]/g,'').trim();
        var art=artOf(it);
        // v1.13.0：歌手命中增强——歌手出现在歌名里也算命中（如"晴天 (原唱 周杰伦)"，
        // gdstudio 常把原版作者写进歌名而 artist 字段是翻唱者本人）
        var artHitInName = !!wantArt && name.indexOf(wantArt) >= 0;
        if(wantArt){
            var artParts=artTokens(wantArt),artHit=artHitInName;
            for(var ai=0;ai<artParts.length;ai++){ if(!artHit&&art.indexOf(artParts[ai])>=0){artHit=true;break;} }
            if(artHit){ score+=60; if(art===wantArt||artHitInName)score+=25; }
            else if(art){ score-=35; }
        }
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
        // 歌名（去括号后）+ 歌手全等：绝对优先，等同官方原版；歌名含歌手同等待遇
        if(bare===q&&(!wantArt||art===wantArt))score+=120;
        if(bare===q&&artHitInName)score+=120;
        if(!/[（(].*?[)）]/.test(it.name||''))score+=8;
        // v1.13.0：版本标签重罚（深情/翻唱/女声/男声/DJ/R&B/钢琴/伴奏/Live/串烧/Cover 等），
        // 修复 gdstudio 把"晴天(深情版)"排在原版前面时打分器也跟着选错的问题
        if(/翻唱|伴奏|[Ll]ive|现场|[Rr]emix|钢琴|纯音乐|深情|女声|男声|电音|R&B|串烧|合唱|英文版|日文版|吉他|Cover|cover|版/.test(name))score-=30;
        // v1.13.0：明确标注"原唱"的版本加分（通常即正确版本）
        if(/原唱/.test(name))score+=25;
        return {it:it,score:score,idx:idx};
    }).sort(function(a,b){return b.score-a.score||a.idx-b.idx;}).map(function(x){return x.it;});
}
// 多候选直链并行校验 + 相关度优先：任一候选有结论就尝试结算，
// 但只有"比它更靠前的候选全部有结论"才允许选中它——
// 快但错（低相关度）的版本永远抢不了慢但对（高相关度）的位；全部失败才返回 null。
// 这是本组件 vs 参考代码"精准度差距"的核心修复：旧版谁先通过用谁，慢一点的正确音源总被抢。
function muRaceCheck(list,mkHit,timeout){
    return new Promise(function(resolve){
        var total=list.length;
        if(!total)return resolve(null);
        var done=0,resolved=false,state=[];
        function settle(){
            if(resolved)return;
            for(var i=0;i<list.length;i++){
                if(state[i]===undefined)break;         // 更高优先候选仍在校验 → 暂不结算
                if(state[i]===true){ resolved=true; resolve(mkHit(list[i])); return; }
            }
            if(done===total){ resolved=true; resolve(null); }
        }
        list.forEach(function(g,idx){
            muCheckUrlFast(g.url,timeout).then(function(ok){
                state[idx]=!!ok;
            }).catch(function(){
                state[idx]=false;
            }).finally(function(){
                done++;
                settle();
            });
        });
    });
}
/* ===== v1.12.2 多通道时长感知结算（比参考实现"谁先通过用谁"更精准更稳） =====
   输入 [{name,pri,get}]，get() 返回 Promise<url>；
   · 各通道并行发起校验；
   · iarc（参考实现验证过的 VIP 全长通道）一旦可播立即采用，不等待其余候选；
   · iarc 未通过时，待全部候选有结论后优先"已知时长更长"的可播者
     （全长 > 试听短轨），时长未知（流式 Infinity）按通道优先级兜底；
   · 所有 URL 统一 http→https 升级 */
function muResolveBest(entries, timeout){
    return new Promise(function(res){
        var list = entries.slice();
        if(!list.length) return res('');
        var results = [], left = list.length, settled = false;
        function finish(u){ if(settled) return; settled = true; res(u); }
        function settle(){
            if(settled) return;
            // 1) iarc 可播即用（VIP 全长通道，无需等其余候选）
            for(var i=0;i<results.length;i++){
                if(results[i] && results[i].name === 'iarc'){ finish(results[i].url); return; }
            }
            if(left > 0) return; // 仍有候选在途 → 等它出结论（慢但对，绝不让低优先级先抢位）
            // 2) 全部有结论：已知时长最长者优先，未知时长按优先级
            var known = [], unknown = [];
            for(var j=0;j<results.length;j++){
                if(!results[j]) continue;
                if(isFinite(results[j].dur)) known.push(results[j]);
                else unknown.push(results[j]);
            }
            if(known.length){
                known.sort(function(a,b){ return (b.dur - a.dur) || (a.pri - b.pri); });
                finish(known[0].url);
            } else if(unknown.length){
                unknown.sort(function(a,b){ return a.pri - b.pri; });
                finish(unknown[0].url);
            } else {
                finish('');
            }
        }
        list.forEach(function(c, idx){
            Promise.resolve().then(c.get).then(function(u){
                if(!u){ left--; settle(); return; }
                if(u.indexOf('http://') === 0) u = u.replace('http://','https://');
                return muCheckUrlDur(u, timeout).then(function(d){
                    results[idx] = d ? {name:c.name, pri:c.pri, url:u, dur:d} : null;
                    left--; settle();
                });
            }).catch(function(){ left--; settle(); });
        });
        // 兜底：超时强制结算（防止个别候选校验悬挂拖死整批）
        setTimeout(settle, (timeout || 3000) + 1000);
    });
}
var muSearchCache={};
var MU_CACHE_TTL=2*60*1000;   // v1.13.0：直链是限时签名 URL，原 10 分钟缓存会命中死链 → 2 分钟
var MU_CACHE_MAX=200;          // 缓存条目上限
function muCacheGet(key){
    var e=muSearchCache[key];
    if(e&&e.hits&&e.hits.length&&(Date.now()-e.t)<MU_CACHE_TTL)return e.hits;
    return null;
}
function muCacheSet(key,hits){
    if(!hits||!hits.length)return; // 空结果不缓存，避免把瞬时失败永久固化
    muSearchCache[key]={t:Date.now(),hits:hits};
    var ks=Object.keys(muSearchCache);
    if(ks.length>MU_CACHE_MAX)delete muSearchCache[ks[0]];
}
function muCacheDel(key){ try{ delete muSearchCache[key]; }catch(e){} } // v1.13.0：缓存失效清理
/* ===== v1.11.0 引擎健康度自适应：成败/耗时写入 localStorage，
   10 分钟内连挂 3 次的引擎自动跳过；qijieya 等偶发抽风源不再拖慢每次搜索 ===== */
var MU_HEALTH_KEY='nico-mu-health-v1';
function muHealthLoad(){ try{ var h=JSON.parse(localStorage.getItem(MU_HEALTH_KEY)); return h&&typeof h==='object'?h:{}; }catch(e){ return {}; } }
function muHealthSave(h){ try{ localStorage.setItem(MU_HEALTH_KEY,JSON.stringify(h)); }catch(e){} }
function muHealthMark(name,ok,ms){
    var h=muHealthLoad(),e=h[name]||{fail:0,last:0,lat:0};
    if(ok){ e.fail=0; e.last=Date.now(); e.lat=Math.round((e.lat*3+(ms||0))/4); }
    else{ e.fail=(e.fail||0)+1; e.last=Date.now(); }
    h[name]=e; muHealthSave(h);
}
function muHealthIsBad(name){
    var e=muHealthLoad()[name];
    if(!e||!e.fail)return false;
    if(e.fail>=3&&(Date.now()-e.last)<10*60*1000)return true;
    return false;
}
function muTimedEngine(name,fn){
    return function(){
        var t0=Date.now(),gen=muSearchGen;
        return fn().then(function(h){
            if(gen===muSearchGen)muHealthMark(name,!!(h&&h.url),Date.now()-t0); // 已被换代中止不计分
            return h;
        }).catch(function(e){
            if(gen===muSearchGen&&(!e||e.name!=='AbortError'))muHealthMark(name,false,Date.now()-t0);
            throw e;
        });
    };
}
// 快速路径全军覆没后的慢速复核：用更长校验超时重试主力源，抗移动网络抖动
function muConfirmSlow(cleanQ,artist){
    return new Promise(function(res){
        var fns=[function(){return muSearchGD('netease',cleanQ,artist,6000);},
                 function(){return muSearchGD('kuwo',cleanQ,artist,6000);},
                 function(){return muSearchQijieya(cleanQ,artist);}];
        var got=null,done=0;
        fns.forEach(function(f){
            f().then(function(h){ if(h&&h.url&&!got)got=h; }).catch(function(){})
             .finally(function(){ done++; if(done===fns.length)res(got); });
        });
        setTimeout(function(){res(got);},10000);
    });
}
// v1.13.0：本地兜底 muCleanQuery（原依赖 nicoPhone 扩展的全局函数，
// nicoPhone 未加载/加载顺序不同会导致整个搜索 ReferenceError 静默失败）
var muCleanQuery = (typeof window.muCleanQuery === 'function')
    ? window.muCleanQuery
    : function(q){
        q = String(q || '');
        q = q.replace(/[（(]([^）)]*)[)）]/g, ' $1 ');
        q = q.replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, ' ').replace(/\[by:[^\]]*\]/gi, ' ').replace(/\[.*?\]/g, ' ');
        return q.replace(/[^\w\u4e00-\u9fa5\s.-]/g, ' ').replace(/\s+/g, ' ').trim();
    };
// 多引擎并行收集可播结果，返回结果数组（不去重不自动进歌单）
function muResolveMulti(query,artist,onProgress){
    var cleanQ=muCleanQuery(query);
    if(!cleanQ)cleanQ=query;
    var wantArt=(artist||'').trim();
    var cacheKey=(cleanQ+'|'+wantArt).toLowerCase();
    var cached=muCacheGet(cacheKey);
    if(cached){
        var c0=cached[0];
        // v1.13.0：缓存命中先复验首条 URL（gdstudio 直链是限时签名，旧缓存可能已死）
        if(c0&&c0.url){
            return muCheckUrlFast(c0.url,2500).then(function(ok){
                if(!ok){ muCacheDel(cacheKey); return muResolveMultiFresh(cleanQ,wantArt,onProgress); }
                if(onProgress)cached.forEach(function(h,idx){setTimeout(function(){onProgress(h,idx+1,cached.length,null,true);},idx*25);});
                return cached.slice();
            });
        }
        if(onProgress)cached.forEach(function(h,idx){setTimeout(function(){onProgress(h,idx+1,cached.length,null,true);},idx*25);});
        return Promise.resolve(cached.slice());
    }
    return muResolveMultiFresh(cleanQ,wantArt,onProgress);
}
// v1.13.0：真正的多引擎搜索主体（缓存未命中 / 缓存失效后走这里）
function muResolveMultiFresh(cleanQ,wantArt,onProgress){
    var cacheKey=(cleanQ+'|'+wantArt).toLowerCase();
    // base 越小优先级越高（对齐参考代码"网易云优先"的策略），结果按 pri 排序展示；
    // v1.11.0：带 key 的引擎参与健康度自适应，故障引擎直接跳过
    var enginesBase=[
        {name:'网易云',key:'gd-netease',base:0,fn:function(){return muSearchGD('netease',cleanQ,wantArt);}},
        {name:'QQ音乐',key:'qq',base:1,fn:function(){return muSearchQQFull(cleanQ,wantArt);}},
        {name:'酷狗',key:'kugou',base:2,fn:function(){return muSearchKugou2(cleanQ,wantArt);}},
        {name:'酷我',key:'gd-kuwo',base:3,fn:function(){return muSearchGD('kuwo',cleanQ,wantArt);}},
        {name:'Meting',key:'qijieya',base:4,fn:function(){return muSearchQijieya(cleanQ,wantArt);}},
        {name:'Joox',key:'gd-joox',base:5,fn:function(){return muSearchGD('joox',cleanQ,wantArt);}}
    ];
    var engines=[];
    enginesBase.forEach(function(e){ if(!muHealthIsBad(e.key)) engines.push({name:e.name,base:e.base,fn:muTimedEngine(e.key,e.fn)}); });
    if(!engines.length){ engines=enginesBase.map(function(e){ return {name:e.name,base:e.base,fn:muTimedEngine(e.key,e.fn)}; }); } // 全挂也再试一次（可能已恢复）
    return new Promise(function(resolve){
        var results=[],finished=0,seen={},settled=false,graceTimer=null,firstHitAt=0;
        var PRIORITY_WAIT=3500; // v1.13.0：更高优先级引擎的等待窗口
        function cacheNow(){ if(results.length){ muCacheSet(cacheKey,results.slice()); } }
        // v1.13.0：已到结果中优先级最高的引擎 base（pri = base*100 + 引擎内排名）
        function minBaseArrived(){
            var b=Infinity;
            for(var i=0;i<results.length;i++){ var bb=Math.floor((results[i].pri||0)/100); if(bb<b)b=bb; }
            return b;
        }
        // v1.13.0：是否仍有更高优先级引擎在途
        function higherPriInFlight(){
            var cur=minBaseArrived();
            if(cur===Infinity)return false;
            for(var i=0;i<engines.length;i++){
                if(!engines[i].done && engines[i].base < cur) return true;
            }
            return false;
        }
        function settle(){
            if(settled)return;
            // v1.13.0：已有结果但更高优先级引擎仍在途且等待未超时 → 继续等，
            // 慢但对（网易云系）绝不让快但错（QQ/酷狗换源）抢位
            if(results.length && higherPriInFlight() && (Date.now()-firstHitAt) < PRIORITY_WAIT) return;
            settled=true;
            if(graceTimer)clearTimeout(graceTimer);
            if(results.length){
                resolve(results.slice());
                graceTimer=setTimeout(function(){
                    cacheNow();
                    // v1.13.0：不再 muAbortAll 中止在途——晚到的正确结果仍会追加进 UI；
                    // 在途请求自带超时，且新搜索发起时 doSearch 会统一中止上一轮
                    if(onProgress)onProgress(null,results.length,engines.length,null,true);
                },3000);
                return;
            }
            // 全部引擎快检未命中 → 慢速复核，避免网络抖动误判"未找到"
            muConfirmSlow(cleanQ,wantArt).then(function(h2){
                if(h2&&!seen[h2.url]){ seen[h2.url]=1; results.push(h2); if(onProgress)onProgress(h2,1,1,null,true); }
                cacheNow(); muAbortAll();
                resolve(results.slice());
            });
        }
        function pushHit(eng,hit){
            if(hit&&hit.url&&!seen[hit.url]){
                seen[hit.url]=1;
                if(hit.pri===undefined)hit.pri=0;
                hit.pri=eng.base*100+(hit.pri||0); // 全局相关度：引擎优先级 × 引擎内排名
                results.push(hit);
                if(!firstHitAt)firstHitAt=Date.now();
                if(onProgress)onProgress(hit,results.length,engines.length);
                if(!settled)settle();
            }
        }
        engines.forEach(function(eng){
            eng.done=false;
            eng.fn().then(function(hit){ if(hit)pushHit(eng,hit); })
                .catch(function(){})
                .finally(function(){
                    eng.done=true;
                    finished++;
                    if(finished===engines.length&&!settled)settle();
                });
        });
        setTimeout(function(){ if(!settled)settle(); },9000); // 全局兜底（原 12s → 9s）
    });
}
// 渲染单条搜索结果到列表（供渐进追加复用）
function appendSearchResult(hit){
    var art=Array.isArray(hit.artist)?hit.artist.join(' / '):(hit.artist||'');
    var label=hit.name+(art?' - '+art:'');
    var it=document.createElement('div');it.className='nico-m-res-it';
    var nm=document.createElement('span');nm.className='nico-m-res-name';
    nm.textContent=label;nm.title=label;
    var add=document.createElement('button');add.type='button';
    add.className='nico-m-res-add';add.textContent='添加';
    // v1.12.1：点"添加"只入库；点整条结果 = 添加并立即播放（对齐参考实现"搜到即听"）
    function doAdd(autoplay){
        // 一并记录 sid/src，后续音源失效可精确按原 ID 重解析
        playlist.unshift({name:hit.name,artist:art,url:hit.url,sid:hit.id||'',src:hit.source||''});
        buildList();cIdx=0;
        nicoSavePlaylist();
        add.className='nico-m-res-add added';add.textContent='已添加';
        if(autoplay){ loadP(); try{ pPlay(); }catch(e){} nicoShowToast('已添加并播放'); }
        else{ nicoShowToast('已添加到歌单'); }
    }
    add.onclick=function(){ doAdd(false); };
    it.onclick=function(){ doAdd(true); };
    it.appendChild(nm);it.appendChild(add);
    // 按相关度 pri 排序插入：越靠前越精准（引擎优先级 + 引擎内排名），
    // 保证第一个可见结果就是最可能正确的版本，不再按到达先后堆叠
    it._pri = hit.pri||0;
    var kids=resDom.children, inserted=false;
    for(var ki=0;ki<kids.length;ki++){
        var kp=(kids[ki]._pri===undefined)?Infinity:kids[ki]._pri;
        if(it._pri<kp){ resDom.insertBefore(it,kids[ki]); inserted=true; break; }
    }
    if(!inserted)resDom.appendChild(it);
    // v1.12.1：给全局相关度第一的结果打"推荐"徽标，帮助避开翻唱/错版本
    var its=resDom.children;
    for(var bi=0; bi<its.length; bi++){
        var oldBadge=its[bi].querySelector('.nico-m-res-badge');
        if(oldBadge)oldBadge.remove();
        if(bi===0){
            var b=document.createElement('span');
            b.className='nico-m-res-badge';
            b.textContent='推荐';
            b.title='全局相关度最高的版本';
            var nmEl=its[bi].querySelector('.nico-m-res-name');
            if(nmEl)nmEl.appendChild(b);
        }
    }
}
async function muSearchGD(source,query,artist,checkTimeout){
    try{
        var fullQ = artist ? query + ' ' + artist : query;
        var sr=await muFetch(MUSIC_API+'?types=search&count=8&source='+source+'&name='+encodeURIComponent(fullQ),4500).then(function(r){return r.json();});
        if(!sr||!sr.length)return null;
        var ranked=muRank(sr,fullQ,artist);
        // v1.13.0：候选池改为按打分排序（不再强制"原生第一候选永远优先"——它就是
        // 翻唱/深情版重灾区）；原生第一候选降级为打分前 5 之外的末位兜底（pri=99），
        // muRaceCheck 只在打分候选全部不可播时才会轮到它
        var pool=[],seenP={};
        function pushP(it,pri){ var k=(it.id||it.name||'')+''; if(!seenP[k]){ seenP[k]=1; pool.push({it:it,pri:pri}); } }
        ranked.slice(0,5).forEach(function(it,ri){ pushP(it,ri+1); });
        if(sr[0] && !seenP[(sr[0].id||sr[0].name||'')+'']) pushP(sr[0],99);
        var got=(await Promise.all(pool.map(function(p){ return muGdItemUrl(source,p.it).then(function(r){ if(r)r.pri=p.pri; return r; }).catch(function(){return null;}); }))).filter(Boolean);
        // v1.13.0：injahow meting 直链候选降为末位兜底（pri=99，实测当前返回空），
        // 避免它在 muRaceCheck 中挡在打分候选前面白白等超时
        if(source==='netease'&&pool.length){
            var top=pool[0];
            got.push({url:'https://api.injahow.cn/meting/?server=netease&type=url&id='+encodeURIComponent(top.it.id),item:top.it,pri:99});
        }
        if(!got.length)return null;
        return await muRaceCheck(got,function(g){return {url:g.url,name:g.item.name,artist:g.item.artist||g.item.author||'',source:source,id:g.item.id,pri:g.pri};},checkTimeout);
    }catch(e){}return null;
}
/* 引擎：Qijieya Meting API（netease 直链通道，搜索结果自带可播 url）。
   与 gdstudio 完全独立的音源管道，参考组件的稳定性关键来源之一；
   结果仍走 muRank 排序 + 时长感知校验，保证精准与可播并重 */
async function muSearchQijieya(query,artist){
    try{
        var fullQ = artist ? query + ' ' + artist : query;
        var qj=await muFetch('https://api.qijieya.cn/meting/?server=netease&type=search&name='+encodeURIComponent(fullQ),4500).then(function(r){return r.json();});
        if(!qj||!qj.length)return null;
        var ranked=muRank(qj,fullQ,artist);
        // 同 gdstudio：原生第一候选 ∪ 打分前5，pri 越小越优先
        var pool=[],seenP={};
        function pushP(it,pri){ var k=(it.id||it.name||'')+''; if(!seenP[k]){ seenP[k]=1; pool.push({it:it,pri:pri}); } }
        if(qj[0])pushP(qj[0],0);
        ranked.slice(0,5).forEach(function(it,ri){ pushP(it,ri+1); });
        var got=pool.map(function(p){
            if(!p.it.url)return null;
            var u=p.it.url;
            if(u.indexOf('http://')===0)u=u.replace('http://','https://');
            return {url:u,item:p.it,pri:p.pri};
        }).filter(Boolean);
        if(!got.length)return null;
        return await muRaceCheck(got,function(g){
            return {url:g.url,name:g.item.name,artist:g.item.artist||g.item.author||'',source:'qijieya',id:g.item.id||g.item.lrc_id||'',pri:g.pri};
        },5000);
    }catch(e){return null;}
}
/* ===== 4.6.2 QQ音乐/酷狗 官方搜索通道（JSONP 绕过 CORS） =====
   这两个平台的官方接口无 CORS 头、且 vkey/getdata 直链在纯浏览器拿不到，
   因此策略：用官方搜索接口拿到最佳候选（歌名+歌手），再换源到
   gdstudio 的 netease/kuwo/joox 搜索同名可播歌曲来播放。
   常见歌曲同名命中率高，相当于"QQ/酷狗作为搜歌入口，网易云系负责出音源"。 */
function muQQSearchCandidates(query){
    return muJSONP('https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w='+encodeURIComponent(query)+'&format=jsonp&p=1&n=6&cr=1&g_tk=5381&loginUin=0&hostUin=0', 'jsonpCallback', 5000).then(function(d){
        try{
            var list=(d&&d.data&&d.data.song&&d.data.song.list)||[];
            return list.map(function(s){
                return {name:s.songname||'', artist:(s.singer||[]).map(function(x){return x.name||'';}).join(' / '), songmid:s.songmid||''};
            });
        }catch(e){return [];}
    });
}
// QQ 音乐直链：injahow meting 公共实例 302 重定向到 QQ 官方 CDN(aqqmusic.tc.qq.com)
// Audio 元素自动跟随 302，跨域播放无需 CORS；vkey 由实例动态生成，地址持久可用
function muQQUrl(songmid){
    return 'https://api.injahow.cn/meting/?server=tencent&type=url&id='+encodeURIComponent(songmid);
}
function muKugouSearchCandidates(query){
    return muJSONP('https://songsearch.kugou.com/song_search_v2?keyword='+encodeURIComponent(query)+'&page=1&pagesize=5&platform=WebFilter&userid=-1', 'callback', 5000).then(function(d){
        try{
            var list=(d&&d.data&&d.data.lists)||[];
            return list.map(function(s){
                return {name:s.SongName||'', artist:s.SingerName||''};
            });
        }catch(e){return [];}
    });
}
// 用候选（歌名+歌手）去 gdstudio 换源搜可播歌曲
// v1.13.0：换源强匹配工具——归一化比较歌名/歌手，防止"搜索入口对、出音源错"
function muNormKey(s){ return String(s||'').toLowerCase().replace(/\s+/g,''); }
function muStrongMatch(hit, qName, qArtist){
    if(!hit || !hit.name) return false;
    var qn = muNormKey(qName), hn = muNormKey(hit.name);
    var hnBare = hn.replace(/[（(].*?[)）]/g,'');
    var nameOk = qn && (hnBare === qn || hnBare.indexOf(qn) >= 0 || qn.indexOf(hnBare) >= 0);
    if(!nameOk) return false;
    if(qArtist){
        var ha = muNormKey(hit.artist||'');
        var qa = muNormKey(qArtist);
        if(ha && qa){
            var qParts = qa.split(/[\/、,&，,]/).filter(Boolean);
            // 歌手命中：歌手字段命中，或歌手出现在歌名里（如"晴天 (原唱 周杰伦)"）
            var hitPart = qParts.some(function(t){ return t && (ha.indexOf(t) >= 0 || muNormKey(hit.name).indexOf(t) >= 0); });
            if(!hitPart) return false;
        }
    }
    return true;
}
// v1.13.0：从多结果中挑选"与目标歌名/歌手强匹配"的最优者（按相关度），配不到返回 null
function muPickBestMatch(hits, name, artist){
    if(!hits || !hits.length) return null;
    var sorted = hits.slice().sort(function(a,b){ return (a.pri||0) - (b.pri||0); });
    for(var i=0;i<sorted.length;i++){
        if(muStrongMatch(sorted[i], name, artist)) return sorted[i];
    }
    return null;
}
async function muSearchByCandidates(cands, fallbackQ, tag, artist){
    if(!cands || !cands.length) return null;
    var SRC3=['netease','kuwo','joox'];
    var jobs=[];
    for(var i=0; i<cands.length && i<3; i++){
        var q = (cands[i].name + ' ' + (artist || cands[i].artist || '')).trim();
        (function(pri,qq){
            for(var si=0; si<SRC3.length; si++){
                (function(src){ jobs.push({pri:pri, p:muSearchGD(src,qq,artist).catch(function(){return null;})}); })(SRC3[si]);
            }
            // v1.10.9：Meting 直链通道也参与候选换源（独立于 gdstudio）
            jobs.push({pri:pri, p:muSearchQijieya(qq,artist).catch(function(){return null;})});
        })(i, q);
    }
    // 兜底：直接用原关键词再试一遍网易云系（全部并行竞速，候选优先级高）
    if(fallbackQ){
        for(var si2=0; si2<SRC3.length; si2++){
            (function(src){ jobs.push({pri:9, p:muSearchGD(src,fallbackQ,artist).catch(function(){return null;})}); })(SRC3[si2]);
        }
        jobs.push({pri:9, p:muSearchQijieya(fallbackQ,artist).catch(function(){return null;})});
    }
    var pairs=await Promise.all(jobs.map(function(j){ return j.p.then(function(h){ return {pri:j.pri, h:h}; }); }));
    // v1.13.0：换源结果必须与用户原始查询（fallbackQ）强匹配，配不到直接丢弃（宁缺毋滥，杜绝换错歌）
    pairs = pairs.filter(function(p){ return !p.h || muStrongMatch(p.h, fallbackQ, artist); });
    pairs.sort(function(a,b){ return a.pri - b.pri; });
    for(var k=0; k<pairs.length; k++){
        if(pairs[k].h){
            if(pairs[k].h.pri===undefined)pairs[k].h.pri=0;
            pairs[k].h.pri = pairs[k].pri*10 + (pairs[k].h.pri||0); // 候选优先级 + 引擎内排名
            return pairs[k].h;
        }
    }
    return null;
}
// QQ 音乐完整引擎：官方搜索(JSONP) + 官方直链(injahow 302)，失败兜底换源到网易云系
async function muSearchQQFull(query,artist){
    try{
        var cands=await muQQSearchCandidates(query);
        if(!cands||!cands.length)return await muSearchQQ2(query,artist);
        var list=[];
        for(var i=0;i<cands.length&&i<3;i++){
            if(cands[i].songmid){
                list.push({url:muQQUrl(cands[i].songmid),item:cands[i],pri:i});
            }
        }
        if(!list.length)return await muSearchQQ2(query,artist);
        var hit=await muRaceCheck(list,function(g){
            return {url:g.url,name:g.item.name,artist:g.item.artist,source:'tencent',id:g.item.songmid,pri:g.pri};
        },5000);
        if(hit)return hit;
        return await muSearchQQ2(query,artist);
    }catch(e){}
    return await muSearchQQ2(query,artist);
}
async function muSearchQQ2(query,artist){
    try{
        var cands = await muQQSearchCandidates(query);
        if(!cands.length) return null;
        return await muSearchByCandidates(cands, query, 'tencent', artist);
    }catch(e){return null;}
}
async function muSearchKugou2(query,artist){
    try{
        var cands = await muKugouSearchCandidates(query);
        if(!cands.length) return null;
        return await muSearchByCandidates(cands, query, 'kugou', artist);
    }catch(e){return null;}
}

var sIn = panel.querySelector('#nico-mu-search-in');
var aIn = panel.querySelector('#nico-mu-artist-in');
var sBtn = panel.querySelector('#nico-mu-search-btn');
var resDom = document.getElementById('nico-mu-res');
// 搜索只列出结果（每条带"添加"键），点击添加才进歌单，不按不进、不自动播放
var muSearchTicket = 0; // v1.11.0：搜索票据，过期轮次的回调不再改动界面
function doSearch(){
    var q = (sIn.value||'').trim();
    if(!q) return;
    var art = (aIn ? aIn.value : '') || '';
    art = art.trim();
    muAbortAll(); // v1.11.0：新搜索立即中止上一轮在途请求，连点不排队
    var myTicket = ++muSearchTicket;
    sBtn.disabled = true; sBtn.textContent = '…';
    resDom.innerHTML = ''; resDom.classList.remove('show');
    titD.textContent = '搜索中...';
    var firstArrived = false, totalShown = 0;
    muResolveMulti(q, art, function(hit, count, total, done, isFinal){
        if(myTicket !== muSearchTicket) return; // 已被新搜索取代，丢弃旧回调
        // 竞速优先：第一个结果到达立即渲染，用户可立刻点添加；后续结果渐进追加
        if(!firstArrived){
            firstArrived = true;
            sBtn.disabled = false; sBtn.textContent = '搜';
            resDom.innerHTML = '';
        }
        if(hit) appendSearchResult(hit);
        totalShown = count || 0;
        if(isFinal){
            titD.textContent = totalShown ? ('找到 ' + totalShown + ' 个结果') : '搜索完成';
        }else{
            titD.textContent = '找到 ' + count + ' 个结果' + (count < total ? '（继续搜索中…）' : '');
        }
        resDom.classList.add('show');
    }).then(function(hits){
        if(myTicket !== muSearchTicket) return;
        sBtn.disabled = false; sBtn.textContent = '搜';
        if(!hits || !hits.length){
            titD.textContent = '未找到音源';
            var empty = document.createElement('div'); empty.className = 'nico-m-res-it';
            empty.innerHTML = '<span class="nico-m-res-name">未找到可播音源</span>';
            resDom.appendChild(empty); resDom.classList.add('show');
            setTimeout(function(){ loadP(); }, 1500);
        }
    });
}
sBtn.onclick = doSearch;
sIn.addEventListener('keydown', function(e){ if(e.key==='Enter'){ doSearch(); } });
if(aIn) aIn.addEventListener('keydown', function(e){ if(e.key==='Enter'){ doSearch(); } });
/* ===== 4.5.1 网易云歌单一键导入（v1.12.0 重写） =====
   修复1：链接识别 —— 支持 music.163.com/#/playlist?id=xxx、/playlist/xxx、
   ?id=xxx、裸 ID、163cn.tv 短链（fetch 跟随跳转还原真实链接）；
   修复2：读取双通道 —— gdstudio playlist 为主，Meting playlist（injahow/qijieya）
   兜底，响应结构多形态兼容；
   修复3：音源解析 —— 不再逐首按"歌名+歌手"搜索（慢且可能配错翻唱），改为按
   网易云歌曲 ID 走持久 302 直链（injahow/qijieya，每次请求自动换新签名），
   iarc/gdstudio 短效链兜底，并记录 sid/src 供后续失效时精确重解析；
   并行批量解析（8 路），大歌单不卡死。 */
function nicoExtractPlaylistId(input){
    var s = String(input || '').trim();
    if(!s) return '';
    var m = s.match(/^(\d{6,15})$/);
    if(m) return m[1];
    // music.163.com/#/playlist?id=xxx / playlist/xxx / playlist?xxx / playlist=xxx
    m = s.match(/playlist[\/?=&#]{0,2}(?:id=)?(\d{6,15})/i);
    if(m) return m[1];
    m = s.match(/[?&]id=(\d{6,15})/) || s.match(/\/(\d{6,15})(?:[?#]|$)/);
    if(m) return m[1];
    return '';
}
// 短链（163cn.tv）跟随跳转还原真实链接；普通链接原样返回
function nicoResolveRedirect(input){
    return new Promise(function(res){
        if(!/163cn\.tv/i.test(String(input||''))){ res(input); return; }
        var c = new AbortController();
        var tm = setTimeout(function(){ try{c.abort();}catch(e){} res(input); }, 7000);
        fetch(input, {mode:'no-cors', redirect:'follow', signal:c.signal}).then(function(r){
            clearTimeout(tm);
            var u = r && r.url;
            res((u && u.indexOf('http') === 0) ? u : input);
        }).catch(function(){ clearTimeout(tm); res(input); });
    });
}
// 兼容多种歌单响应结构：gdstudio 的 {playlist:{tracks:[]}} / 裸数组 / result 等
function nicoPickTracks(res){
    if(!res) return [];
    if(Array.isArray(res)) return res;
    if(res.playlist && Array.isArray(res.playlist.tracks)) return res.playlist.tracks;
    if(Array.isArray(res.tracks)) return res.tracks;
    if(res.playlist && Array.isArray(res.playlist)) return res.playlist;
    if(Array.isArray(res.result)) return res.result;
    if(res.songs && Array.isArray(res.songs)) return res.songs;
    return [];
}
function nicoNormTrack(t){
    var name = t.name || t.title || '';
    var artist = '';
    if(Array.isArray(t.ar)) artist = t.ar.map(function(a){ return a.name || ''; }).join(' / ');
    else if(Array.isArray(t.artists)) artist = t.artists.map(function(a){ return a.name || ''; }).join(' / ');
    else if(Array.isArray(t.artist)) artist = t.artist.map(function(a){ return (typeof a === 'string') ? a : (a.name || ''); }).join(' / ');
    else if(typeof t.artist === 'string') artist = t.artist;
    else if(typeof t.singer === 'string') artist = t.singer;
    var sid = t.id !== undefined && t.id !== null ? String(t.id) : (t.songmid || '');
    // meting playlist 不返回 id 字段，但 url 里带歌曲 ID，可提取用于失效重解析
    if(!sid && t.url){ var m2 = String(t.url).match(/[?&]id=(\d+)/); if(m2) sid = m2[1]; }
    return { name: name, artist: artist, sid: sid, url: t.url || '' };
}
// 歌单读取：gdstudio 主通道 + Meting playlist 兜底
async function nicoFetchPlaylistData(pid){
    try{
        var res = await muFetch(MUSIC_API + '?types=playlist&source=netease&id=' + encodeURIComponent(pid), 12000).then(function(r){ return r.json(); });
        var tr = nicoPickTracks(res);
        if(tr && tr.length) return tr.map(nicoNormTrack);
    }catch(e){}
    var metingUrls = [
        'https://api.injahow.cn/meting/?server=netease&type=playlist&id=',
        'https://api.qijieya.cn/meting/?server=netease&type=playlist&id='
    ];
    for(var i=0; i<metingUrls.length; i++){
        try{
            var arr = await muFetch(metingUrls[i] + encodeURIComponent(pid), 12000).then(function(r){ return r.json(); });
            var tr2 = nicoPickTracks(arr);
            if(tr2 && tr2.length) return tr2.map(nicoNormTrack);
        }catch(e){}
    }
    return [];
}
// 按网易云歌曲 ID 解析音源：iarc 优先（参考实现验证过的 VIP 全长直链通道），
// meting 持久 302 直链（injahow/qijieya）并行兜底，gdstudio 短效链最后兜底。
// v1.12.2：不再让 meting 试听短轨先通过而"听不完"——iarc 可播即用全长；
// iarc 失效时在其余可播候选中优先"已知时长更长"者（全长 > 试听短轨）
// v1.13.0：gdstudio 直链纳入并行批次（2026-09 实测 iarc/injahow/qijieya 全部返回空，
// gdstudio 按 ID 取链是当前唯一实际可用的直链通道）；整体失败后重试一次抗瞬时抖动
async function nicoResolveByNeteaseId(id){
    if(!id) return '';
    var enc = encodeURIComponent(id);
    function batch(){
        return muResolveBest([
            {name:'iarc',    pri:0, get:function(){ return muIarcUrl(id); }},
            {name:'injahow', pri:1, get:function(){ return Promise.resolve('https://api.injahow.cn/meting/?server=netease&type=url&id=' + enc); }},
            {name:'qijieya', pri:2, get:function(){ return Promise.resolve('https://api.qijieya.cn/meting/?server=netease&type=url&id=' + enc); }},
            {name:'gdstudio',pri:3, get:function(){ return muFetch(MUSIC_API + '?types=url&source=netease&id=' + enc + '&br=320', 6000).then(function(r){ return r.json(); }).then(function(j){ return (j && j.url) || ''; }).catch(function(){ return ''; }); }}
        ], 3000);
    }
    var hit = await batch();
    if(hit) return hit;
    // v1.13.0：一次性重试，抗第三方 API 瞬时抖动
    hit = await batch();
    if(hit) return hit;
    return '';
}
// 歌曲失效重解析：有 sid 优先按原 ID 精确修复（不误配翻唱），无 sid 退回按歌名搜
async function nicoReResolve(s){
    if(!s || !s.name) return null;
    if(s.sid && (s.src === 'netease' || s.src === 'qijieya')){
        var u1 = await nicoResolveByNeteaseId(s.sid);
        if(u1) return { name: s.name, artist: s.artist, url: u1, sid: s.sid, src: 'netease' };
        return null;
    }
    if(s.sid && s.src === 'tencent'){
        var u2 = muQQUrl(s.sid);
        var okT = await muCheckUrlFast(u2, 5000);
        if(okT) return { name: s.name, artist: s.artist, url: u2, sid: s.sid, src: 'tencent' };
        return null;
    }
    if(s.sid && s.src){
        try{
            var ur = await muFetch(MUSIC_API + '?types=url&source=' + encodeURIComponent(s.src) + '&id=' + encodeURIComponent(s.sid) + '&br=320', 6500).then(function(r){ return r.json(); });
            if(ur && ur.url){ var okU = await muCheckUrlFast(ur.url, 5000); if(okU) return { name: s.name, artist: s.artist, url: ur.url, sid: s.sid, src: s.src }; }
        }catch(e){}
        return null;
    }
    // 无 ID（旧数据）：退回按歌名+歌手搜索
    // v1.13.0：必须强匹配——原代码直接取 hits[0]（到达顺序第一名），
    // 慢但对的正确版本没到时会被快但错的翻唱抢先，导致"莫名其妙换成其它歌"
    var hits = await muResolveMulti(s.name, s.artist || '');
    if(hits && hits.length){
        var pick = muPickBestMatch(hits, s.name, s.artist);
        if(pick) return { name: pick.name, artist: pick.artist || s.artist, url: pick.url, sid: pick.id || '', src: pick.source || '' };
    }
    return null;
}
// 单曲解析（歌单导入用）：优先按 ID 拿持久直链，其次 meting 自带 url，最后退回搜索
async function nicoResolveTrack(t){
    if(t.sid){
        var u = await nicoResolveByNeteaseId(t.sid);
        if(u) return { name: t.name, artist: t.artist, url: u, sid: t.sid, src: 'netease' };
    }
    if(t.url){
        var ok = await muCheckUrlFast(t.url, 3000);
        if(ok) return { name: t.name, artist: t.artist, url: t.url, sid: t.sid || '', src: 'netease' };
    }
    if(!t.name) return null;
    try{
        var got = await muSearchGD('netease', t.name, t.artist);
        // v1.13.0：按歌名+歌手搜索的兜底结果必须强匹配，配到翻唱/错版本宁可判失败，
        // 不再把"晴天(深情版)"之类的错歌混进导入的歌单
        if(got && muStrongMatch(got, t.name, t.artist)) return { name: got.name, artist: got.artist || t.artist, url: got.url, sid: got.id || '', src: got.source || 'netease' };
    }catch(e){}
    return null;
}
function nicoIsDup(t){
    for(var i=0; i<playlist.length; i++){
        var p = playlist[i];
        if(t.sid && p.sid && String(p.sid) === String(t.sid)) return true;
        if(p.name === t.name && (p.artist || '') === (t.artist || '')) return true;
    }
    return false;
}
async function nicoImportPlaylist(){
    var input = prompt('输入网易云歌单链接或歌单ID：\n例如 https://music.163.com/#/playlist?id=3778678\n或直接 3778678');
    if(input === null || input === '') return;
    var resolved = await nicoResolveRedirect(input);
    var pid = nicoExtractPlaylistId(resolved);
    if(!pid){ nicoShowToast('无法识别歌单ID'); return; }
    var plBtn = panel.querySelector('#nico-mu-pl-btn');
    if(plBtn){ plBtn.disabled = true; plBtn.textContent = '…'; }
    try{
        var tracks = await nicoFetchPlaylistData(pid);
        if(!tracks.length){ nicoShowToast('歌单为空或读取失败'); return; }
        // 去重（歌单内部去重 + 与现有歌单比对）：
        // · 全新歌 → 解析后追加；
        // · 已存在同 sid 的歌 → 标记"刷新"：用新解析的全长音源覆盖旧 URL
        //   （旧数据可能是 v1.12.2 之前的试听短轨，重导一次即可修复"听不完"）
        var seenK = {}, fresh = [], refresh = [];
        for(var i=0; i<tracks.length; i++){
            var t = tracks[i];
            var k = t.sid ? ('s:' + t.sid) : ('n:' + t.name + '|' + t.artist);
            if(seenK[k]) continue;
            seenK[k] = 1;
            if(t.sid){
                var dupIdx = -1;
                for(var di=0; di<playlist.length; di++){
                    if(playlist[di].sid && String(playlist[di].sid) === String(t.sid)){ dupIdx = di; break; }
                }
                if(dupIdx >= 0){ refresh.push({t:t, idx:dupIdx}); continue; }
            }
            if(nicoIsDup(t)) continue;
            fresh.push(t);
        }
        if(!fresh.length && !refresh.length){ nicoShowToast('歌单歌曲都已在列表中'); return; }
        nicoShowToast('歌单共 ' + tracks.length + ' 首，新增 ' + fresh.length + ' 首' + (refresh.length ? '，刷新 ' + refresh.length + ' 首' : '') + '，开始解析音源...');
        var jobs = fresh.map(function(t){ return {t:t, refresh:false, idx:-1}; })
            .concat(refresh.map(function(r){ return {t:r.t, refresh:true, idx:r.idx}; }));
        var added = 0, refreshed = 0, failed = 0, done = 0, curRefreshed = false;
        var CONC = 8; // 并行批量解析，避免大歌单逐首排队
        for(var i2=0; i2<jobs.length; i2+=CONC){
            var slice = jobs.slice(i2, i2 + CONC);
            var results = await Promise.all(slice.map(function(j){ return nicoResolveTrack(j.t).catch(function(){ return null; }); }));
            for(var r=0; r<slice.length; r++){
                var got = results[r];
                if(got){
                    if(slice[r].refresh){
                        // 原位更新：只换音源与 ID 字段，保留歌曲在歌单中的位置
                        var old = playlist[slice[r].idx];
                        if(old){
                            old.url = got.url;
                            if(got.sid) old.sid = got.sid;
                            if(got.src) old.src = got.src;
                            if(got.name) old.name = got.name;
                            if(got.artist) old.artist = got.artist;
                            if(slice[r].idx === cIdx) curRefreshed = true;
                            refreshed++;
                        }
                    } else {
                        playlist.push(got); added++;
                    }
                } else { failed++; }
            }
            done += slice.length;
            nicoShowToast('解析中 ' + Math.min(done, jobs.length) + '/' + jobs.length + '（新增' + added + '，刷新' + refreshed + '，失败' + failed + '）');
        }
        nicoSavePlaylist();
        buildList();
        if(added){ cIdx = Math.max(0, playlist.length - added); loadP(); }
        else if(curRefreshed){ loadP(); if(!au.paused){ try{ pPlay(); }catch(e){} } } // 正在播的被刷新 → 换新源续播
        nicoShowToast('导入完成：新增 ' + added + ' 首' + (refreshed ? '，刷新 ' + refreshed + ' 首' : '') + (failed ? '，失败 ' + failed + ' 首（未混入错版本，可重导重试）' : ''));
    }catch(e){
        nicoShowToast('歌单导入失败');
    }finally{
        if(plBtn){ plBtn.disabled = false; plBtn.textContent = '歌单'; }
    }
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
function fetchDanmuLyrics(song, artist, sid, src){
    if(!song) return;
    var key = song + '_' + (artist||'') + '_' + (sid||'');
    if(key === nicoLyricKey && nicoLyrics.length) return;
    nicoLyricKey = key; nicoLyrics = [];
    var q = song + (artist ? ' ' + artist : '');
    var found = false;
    // v1.12.1：优先按歌曲 ID 精确拉歌词（对齐 lyric-card 参考实现），
    // 不再依赖"搜歌名→取第一条"（可能搜到错版本歌词）；失败再退回歌名搜索
    function tryBySid(sidVal, srcVal){
        if(!sidVal) return Promise.resolve(false);
        var srcForGd = (srcVal === 'qijieya' || srcVal === 'netease') ? 'netease' : (srcVal || 'netease');
        var jobs = [
            // 通道1：gdstudio lyric 按 ID 直拉
            muFetch(DANMU_API + '?types=lyric&id=' + encodeURIComponent(sidVal) + '&source=' + srcForGd, 6000)
            .then(function(r){ return r.json(); })
            .then(function(lr){ return (lr && lr.lyric) ? lr.lyric : ''; })
            .catch(function(){ return ''; }),
            // 通道2：qijieya meting lrc 按 ID 直拉
            muFetch('https://api.qijieya.cn/meting/?server=netease&type=lrc&id=' + encodeURIComponent(sidVal), 6000)
            .then(function(r){ return r.json(); })
            .then(function(lr){ return (lr && lr.lrc) ? lr.lrc : ''; })
            .catch(function(){ return ''; })
        ];
        return Promise.all(jobs).then(function(rs){
            for(var i=0; i<rs.length; i++){
                if(rs[i] && !found){ found = true; nicoLyrics = parseLRC(rs[i]); return true; }
            }
            return false;
        });
    }
    tryBySid(sid, src).then(function(ok){
        if(ok) return;
        // 退回：按歌名搜索（netease/tencent/kugou 三源）
        ['netease','tencent','kugou'].forEach(function(src2){
            muFetch(DANMU_API + '?types=search&count=3&source=' + src2 + '&name=' + encodeURIComponent(q), 6000)
            .then(function(r){ return r.json(); })
            .then(function(sr){
                if(found || !sr || !sr.length) return;
                var item = sr[0];
                return muFetch(DANMU_API + '?types=lyric&id=' + item.id + '&source=' + src2, 6000)
                .then(function(r){ return r.json(); })
                .then(function(lr){
                    if(!found && lr && lr.lyric){ found = true; nicoLyrics = parseLRC(lr.lyric); }
                });
            }).catch(function(){});
        });
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
    if(s) fetchDanmuLyrics(s.name, s.artist || '', s.sid || '', s.src || '');
};
// 初始加载当前歌曲歌词
try{ var _cs = playlist[cIdx]; if(_cs) fetchDanmuLyrics(_cs.name, _cs.artist || '', _cs.sid || '', _cs.src || ''); }catch(e){}

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

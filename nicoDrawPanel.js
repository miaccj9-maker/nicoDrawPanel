/* nico Draw Panel (Nico Draw Panel) - SillyTavern Extension v1.17.0
   角色抽屉面板：从屏幕顶部下拉展开角色资料卡 + 音乐播放器 + 图片库 + 弹幕歌词。
   所有样式类名 / ID / 全局变量统一使用 nico 前缀（nico-* / Nico-* / __nico_*），
   与 nicoPhone 系列组件保持命名一致，避免与其他扩展的旧前缀类名冲突。
   音乐播放器支持"搜歌名/歌手搜歌"（多引擎兜底搜索，自动校验可播直链）。
   v1.16.0 歌单中心（2026-09-26）：
     · 新增"歌单中心"：自动读取酒馆当前所有角色，为每个角色分立独立的
       角色歌单（头像命名，跟随角色列表实时刷新，当前角色带"当前"标记）；
       同时支持自建歌单（新建/重命名/删除），数据持久化到 IndexedDB；
     · 搜索结果每条新增"＋"键、播放队列每首新增"＋"键，可把任意歌曲
       添加到指定角色歌单或自建歌单（自动去重）；歌单详情支持单曲播放/
       播放全部/移除歌曲，播放时整单载入队列；
     · 原"网易云歌单导入"并入歌单中心顶部"导入"；
     · 搜歌防卡顿：搜索结果改为 rAF 批量合并渲染 + 全局事件委托
       （引擎瞬间返回多条不再触发多次回流与 O(n²) 插入），结果最多展示
       30 条、DOM 节点恒定；并修复旧版点"添加"事件冒泡导致重复入队的问题。
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
   v1.10.9 搜索精准度再升级：
     · 新增独立音源引擎 Qijieya Meting API（netease 直链通道，搜索结果自带可播 url），
       不依赖 gdstudio，构成独立的稳定性关键来源；同时接入 QQ/酷狗候选换源与慢速复核；
     · 可播校验升级为"时长感知"：loadedmetadata 后校验真实时长，空轨/坏轨/占位短轨
       直接判死；流式源时长未知时以 canplay 能否真正开播为准（比参考 duration>2 更稳）；
     · 打分器精修：歌手支持多段归一（"A / B"任一命中即算），歌手字段缺失不再误罚，
       歌名+歌手全等时绝对优先，杜绝翻唱/错版本抢位。
   v1.10.10 精准度再升级（修复"谁先通过用谁"竞速缺陷）：
     · 修复 muRaceCheck 关键缺陷：旧版并行校验"谁先通过用谁"，慢一点的正确音源
       总被更快的翻唱/错版本抢位；新版"前置候选全部有结论才结算"——任何候选通过时，
       只要还有比它更相关的候选在途，就等其出结果，慢但对永远压过快但错；
     · 候选池 = 引擎原生第一候选 ∪ 打分前5，既保留原生排序又叠加打分覆盖；
     · 搜索结果按全局相关度排序插入（引擎优先级×引擎内排名），第一个结果就是最准的，
       不再按到达先后堆叠，弱引擎的翻唱版只会排后面；
     · 可播校验以 canplay 真正开播为准，过滤"元数据能读、数据拉不动"假源；
     · netease 直链 iarc 优先（并行发起、iarc 结果优先），避免 gdstudio 偶尔返回同名错轨。
   v1.11.0 搜索速度与稳定性再升级（实测接口存活度 + "先到先得"速度策略）：
     · 实测确认 qijieya(Meting) 187ms、gdstudio ~1s 存活，qjqq/azhang/zygg/tmj 均不可用全部剔除；
     · 新增 injahow Meting 直链通道（netease type=url 实测返回真实音频流），与 iarc/gdstudio
       三路并行取直链，netease 可用性显著提升；
     · 结算策略采用"先到先得"：首个引擎返回可播结果立即结算上屏（原实现要等全部
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
   v1.12.1 搜歌播放稳定性升级：
     · 可播校验严格化：已知时长须 >2s 才入库，未知时长（流式/坏源）
       直接判死——不再放行"元数据能读、数据拉不动"的假源，搜索/导入进歌单的
       歌曲基本不会"点了没声音"；
     · 歌词按歌曲 ID 精确拉取：优先 gdstudio lyric + qijieya lrc 双通道直拉，
       不再"搜歌名→取第一条"（可能配错版本歌词）；失败才退回歌名搜索；
     · 搜索结果点整条 = 添加并立即播放（"搜到即听"），点"添加"按钮
       仍只入库不打断当前播放；
     · 搜索结果自动给全局相关度第一的版本打红色"推荐"徽标，帮你避开翻唱/错版本。
   v1.12.2 歌单 VIP 歌曲全长播放修复：
     · 音源结算 iarc 优先：实测验证过的 VIP 全长直链通道，不再让 meting
       试听短轨（injahow/qijieya 对 VIP 歌常返回 ~30s 试听轨）先通过而"听不完"；
     · 新增 muResolveBest 多通道时长感知结算：iarc/injahow/qijieya 全通道并行，
       iarc 可播即用；iarc 失效时优先"已知时长更长"的可播候选（全长>试听短轨），
       时长未知的流式源按通道优先级兜底——比参考"谁先通过用谁"更精准；
     · 可播校验：流式源（duration=Infinity）canplay 即通过，不再误杀
       CDN 流式响应的 VIP 直链（Infinity>2 判定通过）；
     · iarc 直链统一 http→https 升级，杜绝 https 页面下混合内容被浏览器拦截；
     · 歌单重导自动刷新已有同 ID 歌曲：旧数据若是试听短轨，重导一次即原位换成长全长音源。
   v1.14.0 搜歌精准与冷启动提速（2026-09-19 真实网络管线实测后修复）：
     · 最低置信度门槛：gdstudio/qijieya 候选歌名必须与查询强相关（繁简归一后互相包含），
       乱码/错字查询不再被模糊匹配配出无关歌曲（实测“阿斯顿发卡机qwq”不再误配出“句点”）；
     · 繁→简映射提升为全局（muRank 打分与 muNormKey 强匹配共用），Joox 等繁体源命中更准；
     · 结算结果按全局相关度排序返回，数组顺序与界面一致（首个即最准版本）；
     · 冷启动提速：iarc/gdstudio 直链阶段超时收紧（6s/6.5s→5.2s/5.6s），慢速复核搜索超时 6s→5s，
       健康度跳过故障引擎后单搜 2-3s。
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
   v1.15.4 翻唱不再抢跑（2026-09-20）：
     · 排序器区分"歌手字段命中"（强证据）与"歌名里提及歌手"（弱证据）：
       旧版把「晴天 (原唱 周杰伦) - RyaVocal」这类歌名带"原唱/歌手"、
       实际演唱者是别人的翻唱，与真原唱同等计分甚至更高 → 翻唱抢第一；
     · 查询指定歌手时，候选歌手字段是别人 → 判定为翻唱/二创重罚；
       "原唱"加分仅在歌手字段命中时才生效；
     · 识曲候选锚定改为"出现最多的歌名核心"：API 首位候选若是冷门同名
       曲（如"后座上的晴天"），不再锚错整首歌，翻唱/错版仍被压后。
     · 无歌手查询时同样防翻唱："原唱"加分缩小为 +10，且歌名含括号+「原唱」
       （"晴天 (原唱 周杰伦)"典型翻唱结构）直接扣分。
   v1.15.3 精准播放 + 搜索稳定性（2026-09-20）：
     · 识曲后优先用识别命中的网易云歌曲 ID 直接解析音源并播放——
       与识别结果逐字一致，不再靠"歌名+歌手"重新搜索猜版本（精准度根治）；
       直解失败才回退多引擎搜索，回退路径仍逐个探测可播性；
     · 音频探测并发从 3 路恢复到 8 路（保留复用/中止/限流防卡顿）：
       v1.15.0 压到 3 路把多引擎候选探测拖慢，外部 API 正常时也容易
       在引擎超时前轮不到探测 → 结果缺失/不稳定，本次修复；
     · 备注：公共音乐音源 API（gdstudio/iarc/qijieya 等）存在间歇性
       失联（实测 503/反爬页），属外部依赖，多引擎兜底已尽力覆盖。
   v1.15.2 识别链路加固（2026-09-20）：
     · 自动播放前逐个探测候选音源，只播第一个真正可播的原唱候选
       （旧版直接播相关性第一的 hits[0]，可能命中已失效直链→无声）；
     · 识别失败提示携带精确原因（HTTP 状态码 / API code / 网络错误），
       不再只显示笼统的"请检查网络"；
     · 面板状态栏首行显示当前版本号，刷新后即可确认新代码是否生效；
     · 关键步骤输出 console 日志（指纹长度/HTTP 状态/命中条数），F12 可见。
   v1.15.1 听歌识曲识别失败修复（2026-09-20）：
     · 根因：旧版用 MediaRecorder + decodeAudioData 处理录音，而 Chrome 的
       decodeAudioData 无法解码 webm/opus（MediaRecorder 默认产出格式），
       指纹生成前即失败 → 一直识别失败；
     · 改为 ScriptProcessorNode 原始 PCM 直采（兼容 Chrome/Edge/Firefox/Safari，
       不依赖任何音频解码），线性重采样 8kHz 单声道后直接生成指纹；
     · 新增静音检测：几乎无声时直接提示调大音量/检查麦克风，不白跑识别；
     · 新增双片段重试：整段未命中自动跳过开头 40%（淡入/静音前奏）再试一次；
     · 失败提示携带具体错误信息（e.name/message），便于定位问题。
   v1.15.0 听歌识曲 + 防卡顿（2026-09-20）：
     · 新增网易云听歌识曲（识别播放器当前歌曲 / 麦克风环境音，音源一键切换）：
       录音 10s → 8kHz 单声道 PCM → 内嵌网易云官方音频指纹库（afp WASM）生成
       指纹 → NeteaseCloudMusicApi 公共实例 /audio/match 识别；识别后自动按
       歌名搜歌，候选里自动剔除翻唱/深情版/女声版等版本标签，优先播放原唱，
       搜索结果照常列出可手动挑选；
     · 防卡顿核心：可播校验（音频探测）收敛为全局最多 3 路并发——旧版每轮搜索
       各引擎 6 候选全量并行，多引擎叠加可同时拉起 30+ 个 Audio 拉流抢带宽，
       正在播放的歌因此卡顿；探测用后即卸载、回池复用，新搜索统一中止在途探测；
     · 识别服务为公共实例，可在 NICO_ID_API 常量处替换为自建 NeteaseCloudMusicApi；
       网易官方识别 API 无 CORS 头，公共实例已开放 CORS。
   已移除原组件中的"全域文本阅读器"(STORY ARCHIVE / MutationObserver 文本捕获)。
   v1.17.0 合并聊天存档管理器（2026-10-01）：
     · 面板底部新增「主页 / 存档」极简页签，聊天存档管理器作为第二页完整并入，
       统一黑白主题变量 + 24x24 SVG 极简图标，支持「恢复初始配色」；
     · 存档功能与独立版 v1.3.0 完全一致（按角色归档/备注/存档专属头像/一键加载/
       数量懒加载/并发限流 5/请求超时 20s/列表缓存/渲染串行化），设置键不变，旧数据保留；
     · 首次进入存档页才发起请求，启动零开销；音乐搜索与听歌识曲逻辑零改动。
   所有 DOM 直接注入酒馆主页面，无 iframe 间接层。 */
(function(){
'use strict';
try{console.log('%c[Nico-Draw-Panel] v1.17.0 已加载：歌单中心·存档第二页','color:#818cf8;font-weight:bold');}catch(e){}

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
.nico-m-id{display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;}
.nico-m-id button{background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);border:none;border-radius:12px;padding:4px 10px;font-size:10px;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all .2s cubic-bezier(0.25,0.8,0.25,1);flex-shrink:0;}
.nico-m-id button:active{transform:scale(0.92);}
.nico-m-id button:disabled{opacity:.6;cursor:default;}
.nico-m-id .nico-m-id-src{opacity:.75;min-width:52px;}
.nico-m-id-status{flex:1;min-width:0;font-size:11px;color:var(--SmartThemeBodyColor,#222);opacity:.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
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
#Nico-Draw-Panel.nico-theme-reset .nico-m-id button{background:#111111;color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-m-id-status{color:#111111;}
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
/* ===== v1.16.0 歌单中心 ===== */
#Nico-Draw-Panel .nico-pl button,#Nico-Draw-Panel .nico-pl input{font-family:inherit;}
#Nico-Draw-Panel .nico-pl{position:absolute;inset:0;z-index:50;background:var(--SmartThemeBlurTintColor,#fff);color:var(--SmartThemeBodyColor,#111);display:none;flex-direction:column;contain:content;}
#Nico-Draw-Panel .nico-pl.show{display:flex;}
.nico-pl-view{flex:1 1 0;min-height:0;display:none;flex-direction:column;}
.nico-pl.show[data-view="detail"] .nico-pl-view-detail{display:flex;}
.nico-pl.show:not([data-view="detail"]) .nico-pl-view-center{display:flex;}
.nico-pl-hd{height:52px;flex-shrink:0;display:flex;align-items:center;gap:6px;padding:0 10px;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.1));}
.nico-pl-hd-t{flex:1;min-width:0;text-align:center;font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px;}
.nico-pl-x,.nico-pl-back{width:32px;height:32px;border:none;background:transparent;font-size:22px;line-height:1;color:var(--SmartThemeBodyColor,#111);opacity:.6;cursor:pointer;border-radius:8px;flex-shrink:0;padding:0;}
.nico-pl-back{font-size:28px;}
.nico-pl-x:hover,.nico-pl-back:hover{opacity:1;}
.nico-pl-hd-btn{border:none;background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);font-size:11px;font-weight:700;border-radius:12px;padding:6px 12px;cursor:pointer;flex-shrink:0;letter-spacing:.5px;}
.nico-pl-hd-btn:active{transform:scale(.93);}
.nico-pl-body{flex:1;min-height:0;overflow-y:auto;padding:14px 16px 26px;}
.nico-pl-sec{display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:1px;opacity:.5;margin:2px 2px 10px;}
.nico-pl-add{border:none;background:transparent;color:var(--SmartThemeBodyColor,#111);font-size:11px;font-weight:700;letter-spacing:.5px;cursor:pointer;opacity:.7;padding:3px 8px;border-radius:10px;}
.nico-pl-add:hover{opacity:1;background:rgba(0,0,0,.05);}
.nico-pl-rows{display:flex;flex-direction:column;gap:8px;margin-bottom:18px;}
.nico-pl-row{display:flex;align-items:center;gap:12px;width:100%;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.08));background:var(--SmartThemeChatTintColor,rgba(255,255,255,.6));border-radius:14px;padding:10px 12px;cursor:pointer;text-align:left;transition:transform .15s,border-color .2s;}
.nico-pl-row:active{transform:scale(.98);border-color:rgba(0,0,0,.22);}
.nico-pl-ico{width:42px;height:42px;border-radius:50%;overflow:hidden;flex-shrink:0;background:rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center;}
.nico-pl-ico img{width:100%;height:100%;object-fit:cover;}
.nico-pl-ico svg{width:20px;height:20px;fill:var(--SmartThemeBodyColor,#111);opacity:.7;}
.nico-pl-meta{flex:1;min-width:0;}
.nico-pl-nm{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.nico-pl-sub{display:block;font-size:11px;opacity:.5;margin-top:2px;}
.nico-pl-cur{font-style:normal;font-size:9px;background:#EF4444;color:#fff;border-radius:4px;padding:1px 5px;margin-left:6px;vertical-align:middle;font-weight:700;}
.nico-pl-menu{flex-shrink:0;width:28px;height:28px;border:none;background:transparent;font-size:17px;line-height:1;opacity:.45;cursor:pointer;border-radius:8px;color:var(--SmartThemeBodyColor,#111);padding:0;}
.nico-pl-menu:hover{opacity:1;background:rgba(0,0,0,.06);}
.nico-pl-empty{font-size:12px;opacity:.5;padding:14px 8px;border:1px dashed var(--SmartThemeBorderColor,rgba(0,0,0,.15));border-radius:12px;text-align:center;margin-bottom:8px;}
.nico-pl-d-meta{font-size:11px;opacity:.5;margin:0 2px 10px;}
.nico-pl-songs{display:flex;flex-direction:column;}
.nico-pl-song{display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.06));cursor:pointer;border-radius:6px;}
.nico-pl-song:active{background:rgba(0,0,0,.03);}
.nico-pl-song-i{width:22px;font-size:11px;opacity:.45;text-align:center;flex-shrink:0;font-variant-numeric:tabular-nums;}
.nico-pl-song-m{flex:1;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.nico-pl-song-x{flex-shrink:0;border:none;background:transparent;color:var(--SmartThemeBodyColor,#111);font-size:15px;line-height:1;opacity:.4;cursor:pointer;padding:2px 8px;border-radius:8px;}
.nico-pl-song-x:hover{color:#EF4444;opacity:1;}
/* 添加到歌单 bottom sheet */
.nico-pl-pick{position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.32);display:none;align-items:flex-end;justify-content:center;}
.nico-pl-pick.show{display:flex;animation:nicoPlFade .2s ease;}
@keyframes nicoPlFade{from{opacity:0;}to{opacity:1;}}
.nico-pl-pick-card{width:100%;max-height:72%;display:flex;flex-direction:column;background:var(--SmartThemeBlurTintColor,#fff);border-radius:20px 20px 0 0;padding:10px 14px 14px;animation:nicoPlUp .28s cubic-bezier(.25,.8,.25,1);}
@keyframes nicoPlUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
.nico-pl-pick-hd{display:flex;align-items:center;justify-content:space-between;padding:6px 4px 10px;font-size:14px;font-weight:700;}
.nico-pl-pick-hd button{border:none;background:transparent;font-size:20px;line-height:1;opacity:.55;cursor:pointer;color:var(--SmartThemeBodyColor,#111);width:30px;height:30px;padding:0;}
.nico-pl-pick-in{border:none;background:var(--SmartThemeChatTintColor,rgba(0,0,0,.04));border-radius:10px;padding:9px 12px;font-size:12px;outline:none;color:var(--SmartThemeBodyColor,#111);margin-bottom:8px;}
.nico-pl-pick-rows{overflow-y:auto;min-height:0;display:flex;flex-direction:column;gap:6px;padding-bottom:4px;}
.nico-pl-pick-rows .nico-pl-row{padding:8px 10px;border-radius:12px;}
.nico-pl-pick-rows .nico-pl-ico{width:34px;height:34px;}
.nico-pl-pick-new{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;border:1px dashed var(--SmartThemeBorderColor,rgba(0,0,0,.18));border-radius:12px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;color:var(--SmartThemeBodyColor,#111);width:100%;margin-top:2px;}
.nico-pl-pick-new:hover{background:rgba(0,0,0,.04);}
/* mini modal（新建/重命名输入、操作表） */
.nico-pl-modal{position:absolute;inset:0;z-index:70;background:rgba(0,0,0,.32);display:none;align-items:center;justify-content:center;padding:28px;}
.nico-pl-modal.show{display:flex;animation:nicoPlFade .18s ease;}
.nico-pl-modal-card{width:100%;background:var(--SmartThemeBlurTintColor,#fff);border-radius:18px;overflow:hidden;animation:nicoPlPop .22s cubic-bezier(.25,.8,.25,1);}
@keyframes nicoPlPop{from{transform:scale(.94);opacity:0;}to{transform:scale(1);opacity:1;}}
.nico-pl-modal-t{padding:16px 16px 6px;font-size:14px;font-weight:700;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.nico-pl-modal-in{margin:10px 16px 14px;width:calc(100% - 32px);box-sizing:border-box;border:none;background:var(--SmartThemeChatTintColor,rgba(0,0,0,.04));border-radius:10px;padding:10px 12px;font-size:13px;outline:none;color:var(--SmartThemeBodyColor,#111);}
.nico-pl-modal-acts{display:flex;border-top:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.08));}
.nico-pl-modal-acts button{flex:1;border:none;background:transparent;padding:12px 0;font-size:13px;cursor:pointer;color:var(--SmartThemeBodyColor,#111);}
.nico-pl-modal-acts button.primary{font-weight:700;color:#2563eb;}
.nico-pl-modal-sep{width:1px;background:var(--SmartThemeBorderColor,rgba(0,0,0,.08));}
.nico-pl-modal-list button{display:block;width:100%;text-align:left;border:none;background:transparent;padding:13px 18px;font-size:13px;cursor:pointer;color:var(--SmartThemeBodyColor,#111);border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.06));}
.nico-pl-modal-list button.danger{color:#EF4444;}
.nico-pl-modal-list button:active{background:rgba(0,0,0,.04);}
/* 队列行“＋加入歌单” */
.nico-s-pl{flex-shrink:0;font-size:15px;line-height:1;color:var(--SmartThemeBodyColor,#000);cursor:pointer;padding:2px 6px;border-radius:4px;opacity:.35;transition:opacity .2s,color .15s;background:none;border:none;}
.nico-s-it:hover .nico-s-pl{opacity:1;}
.nico-s-pl:active{color:#2563eb;}
@media(hover:none){.nico-s-pl,.nico-s-del{opacity:.5;}}
/* 搜索结果行“＋加入歌单” */
.nico-m-res-pick{background:none;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.18));border-radius:50%;width:25px;height:25px;font-size:15px;line-height:1;color:var(--SmartThemeBodyColor,#111);cursor:pointer;flex-shrink:0;padding:0;transition:transform .15s,background .15s,color .15s;}
.nico-m-res-pick:active{transform:scale(.9);background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);}
/* 恢复初始配色下的歌单中心固定色 */
#Nico-Draw-Panel.nico-theme-reset .nico-pl{background:#ffffff;color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-pl-row{background:#fefefe;}
#Nico-Draw-Panel.nico-theme-reset .nico-pl-pick-card,#Nico-Draw-Panel.nico-theme-reset .nico-pl-modal-card{background:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-pl-pick-in,#Nico-Draw-Panel.nico-theme-reset .nico-pl-modal-in{background:#f0f0f2;color:#222222;}
/* ===== v1.17.0 第二页：底部极简页签 ===== */
.nico-tabs{flex-shrink:0;display:flex;border-top:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.08));background:var(--SmartThemeBlurTintColor,#fff);padding-bottom:env(safe-area-inset-bottom,0px);position:relative;z-index:5;}
.nico-tab{flex:1;border:none;background:transparent;color:var(--SmartThemeBodyColor,#111);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:50px;font-size:10px;font-weight:600;letter-spacing:.5px;opacity:.4;cursor:pointer;transition:opacity .2s;font-family:inherit;padding:0;line-height:1;}
.nico-tab svg{width:20px;height:20px;fill:currentColor;display:block;}
.nico-tab:active{opacity:.8;}
.nico-tab.on{opacity:1;}
/* ===== v1.17.0 聊天存档页（黑白极简，风格与主页一致） ===== */
.nico-arc{display:none;flex:1 1 0;min-height:0;flex-direction:column;}
.nico-arc.show{display:flex;}
.nico-arc-nav{position:relative;display:flex;align-items:center;justify-content:center;height:50px;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.12));font-weight:700;font-size:15px;flex-shrink:0;margin-top:10px;padding-top:env(safe-area-inset-top,0px);box-sizing:content-box;}
.nico-arc-rf{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:none;border-radius:8px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.5;transition:opacity .2s,background .2s;padding:0;}
.nico-arc-rf:hover{opacity:.9;background:rgba(0,0,0,.05);}
.nico-arc-rf:active{transform:translateY(-50%) scale(.9);}
.nico-arc-rf svg{width:16px;height:16px;fill:var(--SmartThemeBodyColor,#111);display:block;}
.nico-arc-rf.spin svg{animation:nicoArcSpin .8s linear infinite;}
@keyframes nicoArcSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.nico-arc-scroll{flex:1 1 0;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:10px 16px calc(20px + env(safe-area-inset-bottom,0px));}
.nico-arc-stats{font-size:11px;opacity:.55;margin:0 2px 8px;}
.nico-arc-filter{margin:0 0 10px;}
.nico-arc-filter input{width:100%;box-sizing:border-box;background:var(--SmartThemeChatTintColor,#f0f0f2);border:none;border-radius:10px;padding:8px 12px;font-size:12px;color:var(--SmartThemeBodyColor,#222);outline:none;transition:box-shadow .2s;font-family:inherit;}
.nico-arc-filter input:focus{box-shadow:inset 0 0 0 1px var(--SmartThemeBorderColor,rgba(0,0,0,.12));}
.nico-arc-filter input::placeholder{color:var(--SmartThemeBodyColor,#000);opacity:.42;}
.nico-arc-list{display:flex;flex-direction:column;gap:8px;}
.nico-arc-empty{font-size:12px;opacity:.55;padding:18px 10px;border:1px dashed var(--SmartThemeBorderColor,rgba(0,0,0,.15));border-radius:12px;text-align:center;}
.nico-arc-loading{font-size:12px;opacity:.55;text-align:center;padding:14px 0;}
/* 角色档案夹 */
.nico-arc-char{border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.1));border-radius:12px;overflow:hidden;background:var(--SmartThemeChatTintColor,rgba(255,255,255,.6));}
.nico-arc-head{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;user-select:none;-webkit-user-select:none;}
.nico-arc-head:active{background:rgba(0,0,0,.03);}
.nico-arc-cv{width:14px;height:14px;flex-shrink:0;opacity:.55;transition:transform .2s;display:flex;align-items:center;justify-content:center;}
.nico-arc-cv svg{width:14px;height:14px;fill:var(--SmartThemeBodyColor,#111);display:block;}
.nico-arc-char.nico-open .nico-arc-cv{transform:rotate(90deg);}
.nico-arc-nm{flex:1;min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.nico-arc-badge{flex-shrink:0;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.18));opacity:.85;font-variant-numeric:tabular-nums;}
.nico-arc-body{display:none;max-height:330px;overflow-y:auto;border-top:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.08));padding:8px;flex-direction:column;gap:6px;}
.nico-arc-char.nico-open .nico-arc-body{display:flex;}
/* 存档卡片 */
.nico-arc-chat{border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.1));border-radius:10px;padding:8px 10px;background:var(--SmartThemeBlurTintColor,#fff);display:flex;flex-direction:column;}
.nico-arc-chat.nico-cur{border-color:var(--SmartThemeBodyColor,#111);}
.nico-arc-avrow{display:flex;align-items:center;gap:6px;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.08));}
.nico-arc-avimg{width:38px;height:38px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.12));background:var(--SmartThemeChatTintColor,#fafafa);}
.nico-arc-avimg.nico-av-default{opacity:.85;}
.nico-arc-avbtn{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.18));background:transparent;color:var(--SmartThemeBodyColor,#111);border-radius:10px;padding:3px 9px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform .15s,background .15s,color .15s;}
.nico-arc-avbtn svg{width:12px;height:12px;fill:currentColor;display:block;}
.nico-arc-avbtn:active{transform:scale(.94);background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);}
.nico-arc-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.nico-arc-tt{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.nico-arc-sub{font-size:10.5px;opacity:.55;white-space:nowrap;}
.nico-arc-curbadge{font-size:9px;font-weight:700;padding:1px 6px;border-radius:6px;background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);flex-shrink:0;}
.nico-arc-load{margin-left:auto;border:none;background:var(--SmartThemeBodyColor,#111);color:var(--SmartThemeBlurTintColor,#fff);border-radius:10px;padding:4px 13px;font-size:10px;font-weight:700;letter-spacing:.5px;cursor:pointer;font-family:inherit;flex-shrink:0;transition:transform .15s,opacity .15s;}
.nico-arc-load:active{transform:scale(.94);opacity:.85;}
.nico-arc-pv{font-size:11px;opacity:.6;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.nico-arc-note{margin-top:6px;width:100%;box-sizing:border-box;background:var(--SmartThemeChatTintColor,#f0f0f2);border:none;border-radius:8px;padding:6px 9px;font-size:11px;color:var(--SmartThemeBodyColor,#222);outline:none;font-family:inherit;transition:box-shadow .2s;}
.nico-arc-note:focus{box-shadow:inset 0 0 0 1px var(--SmartThemeBorderColor,rgba(0,0,0,.12));}
.nico-arc-note::placeholder{color:var(--SmartThemeBodyColor,#000);opacity:.42;}
/* 存档页固定黑白（恢复初始配色） */
#Nico-Draw-Panel.nico-theme-reset .nico-tabs{background:#ffffff;border-top-color:#f0f0f0;}
#Nico-Draw-Panel.nico-theme-reset .nico-tab{color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-nav{border-bottom-color:#e5e5e5;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-rf svg{fill:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-char{border-color:#eaeaea;background:#fefefe;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-cv svg{fill:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-badge{border-color:#d8d8d8;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-body{border-top-color:#f0f0f0;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-chat{border-color:#eaeaea;background:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-chat.nico-cur{border-color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-avimg{border-color:#d8d8d8;background:#fafafa;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-avbtn{border-color:#d8d8d8;color:#111111;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-avbtn:active{background:#111111;color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-curbadge,#Nico-Draw-Panel.nico-theme-reset .nico-arc-load{background:#111111;color:#ffffff;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-filter input,#Nico-Draw-Panel.nico-theme-reset .nico-arc-note{background:#f0f0f2;color:#222222;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-filter input:focus,#Nico-Draw-Panel.nico-theme-reset .nico-arc-note:focus{box-shadow:inset 0 0 0 1px #d8d8d8;}
#Nico-Draw-Panel.nico-theme-reset .nico-arc-empty{border-color:#d8d8d8;}
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
          <button id="nico-mu-pl-btn" type="button" title="打开歌单中心（角色歌单 / 我的歌单）">歌单</button>
        </div>
        <div class="nico-m-id">
          <button id="nico-mu-id-btn" type="button" title="识别当前正在播放的歌曲，识别后自动搜索并播放原唱">听歌识曲</button>
          <button id="nico-mu-id-src" type="button" class="nico-m-id-src" title="切换识别音源">播放器</button>
          <span class="nico-m-id-status" id="nico-mu-id-status">点击识别当前播放的歌曲，识别后自动搜索并播放原唱</span>
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
    <div class="nico-arc" id="nico-arc">
      <div class="nico-arc-nav"><span>聊天存档</span><button class="nico-arc-rf" id="nico-arc-refresh" type="button" title="刷新存档列表"><svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button></div>
      <div class="nico-arc-scroll">
        <div class="nico-arc-stats" id="nico-arc-stats">共 0 个角色</div>
        <div class="nico-arc-filter"><input type="text" id="nico-arc-filter-in" placeholder="筛选角色 / 备注…" autocomplete="off"></div>
        <div class="nico-arc-list" id="nico-arc-list"></div>
      </div>
    </div>
    <div class="nico-pl" id="nico-pl" data-view="center">
      <div class="nico-pl-view nico-pl-view-center">
        <div class="nico-pl-hd">
          <button class="nico-pl-x" id="nico-pl-close" type="button" title="关闭歌单">×</button>
          <span class="nico-pl-hd-t">歌单</span>
          <button class="nico-pl-hd-btn" id="nico-pl-import" type="button" title="导入网易云歌单（链接或ID）">导入</button>
        </div>
        <div class="nico-pl-body">
          <div class="nico-pl-sec">角色歌单</div>
          <div class="nico-pl-rows" id="nico-pl-chars"></div>
          <div class="nico-pl-sec"><span>我的歌单</span><button class="nico-pl-add" id="nico-pl-new" type="button">+ 新建歌单</button></div>
          <div class="nico-pl-rows" id="nico-pl-customs"></div>
        </div>
      </div>
      <div class="nico-pl-view nico-pl-view-detail">
        <div class="nico-pl-hd">
          <button class="nico-pl-back" id="nico-pl-d-back" type="button" title="返回">‹</button>
          <span class="nico-pl-hd-t" id="nico-pl-d-name">歌单</span>
          <button class="nico-pl-hd-btn" id="nico-pl-d-play" type="button">播放全部</button>
        </div>
        <div class="nico-pl-body">
          <div class="nico-pl-d-meta" id="nico-pl-d-info"></div>
          <div class="nico-pl-songs" id="nico-pl-d-list"></div>
        </div>
      </div>
      <div class="nico-pl-pick" id="nico-pl-pick">
        <div class="nico-pl-pick-card">
          <div class="nico-pl-pick-hd"><span>添加到歌单</span><button id="nico-pl-pick-x" type="button" title="关闭">×</button></div>
          <input class="nico-pl-pick-in" id="nico-pl-pick-search" placeholder="筛选歌单…" autocomplete="off">
          <div class="nico-pl-pick-rows" id="nico-pl-pick-list"></div>
        </div>
      </div>
      <div class="nico-pl-modal" id="nico-pl-modal"></div>
    </div>
    <div class="nico-tabs" id="nico-tabs">
      <button class="nico-tab on" data-page="home" type="button" title="主页"><svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>主页</span></button>
      <button class="nico-tab" data-page="arc" type="button" title="聊天存档"><svg viewBox="0 0 24 24"><path d="M20.54 5.23l-1.39-1.68A1.49 1.49 0 0 0 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/></svg><span>存档</span></button>
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
        var pladd = document.createElement('button'); pladd.type = 'button';
        pladd.className = 'nico-s-pl'; pladd.textContent = '＋'; pladd.title = '把这首歌加入歌单';
        (function(song){
            pladd.addEventListener('click', function(e){
                e.stopPropagation();
                nicoOpenPicker({name:song.name, artist:song.artist||'', url:song.url, sid:song.sid||'', src:song.src||''});
            });
        })(s);
        d.appendChild(pladd);
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
function muAbortAll(){ muSearchGen++; muActive.forEach(function(c){ try{c.abort();}catch(e){} }); muActive.clear(); muProbeAbortAll(); }
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
/* v1.15.0 音频探测池（防卡顿核心）：可播校验收敛为全局最多 muProbeMax 路并发——
   旧版每引擎 6 候选全量并行，多引擎叠加可同时拉起 30+ 个 Audio 拉流抢带宽，
   正在播放的歌因此卡顿。校验结束立即卸载、回池复用；新搜索统一中止在途探测。 */
var muProbeQueue=[], muProbeActive=new Set(), muProbePool=[], muProbeMax=8;
function muProbeGet(){
    if(muProbePool.length) return muProbePool.pop();
    var t=new Audio(); t.preload='metadata'; t.muted=true; return t;
}
function muProbePut(t){ if(muProbePool.length<8) muProbePool.push(t); }
function muProbeStart(task){
    var t=muProbeGet(), done=false;
    muProbeActive.add(t);
    if(task.tokens) task.tokens.add(t);
    function finish(d){
        if(done) return; done=true;
        clearTimeout(tm);
        t._nicoProbeFinish=null;
        t.onloadedmetadata=t.onerror=t.oncanplay=null;
        try{ t.pause(); }catch(e){}
        try{ t.removeAttribute('src'); t.load(); }catch(e){}
        muProbeActive.delete(t);
        if(task.tokens) task.tokens.delete(t);
        muProbePut(t);
        task.res(d);
        muProbeDrain();
    }
    t._nicoProbeFinish=finish;
    var tm=setTimeout(function(){ finish(null); }, task.timeout||3000);
    t.onloadedmetadata=function(){
        var d=t.duration;
        if(d && isFinite(d) && d<=0.5) finish(null); // 明显坏轨提前判死
        /* 其余一律等 canplay 复核 */
    };
    t.oncanplay=function(){
        var d=t.duration;
        if(d && isFinite(d)){ finish(d>2?d:null); }
        else if(d===Infinity){ finish(Infinity); } // 流式源：能开播即通过
        else { finish(null); }
    };
    t.onerror=function(){ finish(null); };
    try{ t.src=task.url; }catch(e){ finish(null); }
}
function muProbeDrain(){
    while(muProbeActive.size<muProbeMax && muProbeQueue.length){
        muProbeStart(muProbeQueue.shift());
    }
}
function muProbeKill(t){
    if(!t || !t._nicoProbeFinish) return;
    var f=t._nicoProbeFinish;
    try{ t.onloadedmetadata=t.onerror=t.oncanplay=null; }catch(e){}
    f(null);
}
function muProbeAbortAll(){
    muProbeQueue.length=0;
    muProbeActive.forEach(function(t){ muProbeKill(t); });
}
// 时长感知可播校验：返回校验通过的时长（已知时长须 >2s，流式源返回 Infinity），失败返回 null。
// v1.12.2：流式源（duration=Infinity，CDN 流式响应）
// 在 canplay 时视为可播（Infinity>2 判定通过），不再误杀 VIP 直链；
// 仍拒绝 NaN/0/坏轨（<=0.5s），保持"宁缺毋滥"底线
function muProbeCheck(url,timeout,tokens){
    return new Promise(function(res){
        if(!url)return res(null);
        muProbeQueue.push({url:url,timeout:timeout||3000,tokens:tokens||null,res:res});
        muProbeDrain();
    });
}
function muCheckUrlDur(url,timeout){ return muProbeCheck(url,timeout); }
// 布尔版可播判定（供 muRaceCheck 等沿用，行为与 v1.12.1 一致 + 放行流式源）
function muCheckUrlFast(url,timeout){
    return muCheckUrlDur(url,timeout||3000).then(function(d){ return d!==null && d!==undefined; });
}
// http→https 统一升级：杜绝 https 页面下混合内容被浏览器拦截
function nicoUpHttps(u){ if(u&&u.indexOf('http://')===0)u=u.replace('http://','https://'); return u; }
// 网易云直链解析（v.iarc.top，版权/VIP覆盖强，实测验证过的 VIP 全长通道）
function muIarcUrl(id){
    return new Promise(function(res){
        muFetch('https://v.iarc.top/?type=url&id='+id,5200).then(function(rr){
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
        // iarc 与 gdstudio 并行发起，iarc 结果优先——
        // 避免 gdstudio 直链偶尔返回同名错轨导致"显示对、声音错"
        var gdP=muFetch(MUSIC_API+'?types=url&source=netease&id='+item.id+'&br=320',5200)
            .then(function(r){return r.json();})
            .then(function(j){return (j&&j.url)||'';})
            .catch(function(){return '';});
        var iu=await muIarcUrl(item.id), gu=await gdP;
        finalUrl=iu||gu;
    }else{
        try{
            var ur=await muFetch(MUSIC_API+'?types=url&source='+source+'&id='+item.id+'&br=320',5600).then(function(r){return r.json();});
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
// v1.14.0：繁→简映射提升为全局（muRank 打分与 muNormKey 强匹配共用）
var muT2S={'傑':'杰','倫':'伦','劉':'刘','陳':'陈','張':'张','孫':'孙','楊':'杨','鄧':'邓','蘇':'苏','鄒':'邹','黃':'黄','吳':'吴','鄭':'郑','許':'许','謝':'谢','韓':'韩','馮':'冯','趙':'赵','蔣':'蒋','蕭':'萧','葉':'叶','羅':'罗','項':'项','鍾':'钟','鐘':'钟','譚':'谭','馬':'马','陸':'陆','萬':'万','賴':'赖','範':'范','龍':'龙','鳳':'凤','愛':'爱','國':'国','學':'学','樂':'乐','單':'单','雙':'双','東':'东','華':'华','麗':'丽','兒':'儿'};
function muRank(items,query,artist){
    // 常见繁→简映射：Joox 等源返回繁体歌手名，统一后比对更准（映射见全局 muT2S）
    function norm(s){return String(s||'').toLowerCase().split('').map(function(c){return muT2S[c]||c;}).join('');}
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
            var artParts=artTokens(wantArt),artHit=artHitInName,artFieldHit=false;
            for(var ai=0;ai<artParts.length;ai++){ if(art.indexOf(artParts[ai])>=0){artFieldHit=true;break;} }
            for(var ai=0;ai<artParts.length;ai++){ if(!artHit&&art.indexOf(artParts[ai])>=0){artHit=true;break;} }
            // v1.15.4：歌手字段命中是强证据（真原唱/本人作品）；仅歌名提及是弱证据
            if(artFieldHit){ score+=60; if(art===wantArt)score+=30; }
            else if(artHitInName){ score+=25; }
            else if(art){ score-=35; }
            // v1.15.4：指定了歌手、候选歌手字段却是别人 → 翻唱/二创，重罚
            if(!artFieldHit && art) score-=45;
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
        // v1.15.4：移除"歌名含歌手即等同精确匹配"加分——它让"晴天 (原唱 周杰伦)"
        // 这类歌名带歌手的翻唱与真原唱打平甚至反超（原唱靠歌手字段命中拿分）
        if(!/[（(].*?[)）]/.test(it.name||''))score+=8;
        // v1.13.0：版本标签重罚（深情/翻唱/女声/男声/DJ/R&B/钢琴/伴奏/Live/串烧/Cover 等），
        // 修复 gdstudio 把"晴天(深情版)"排在原版前面时打分器也跟着选错的问题
        if(/翻唱|伴奏|[Ll]ive|现场|[Rr]emix|钢琴|纯音乐|深情|女声|男声|电音|R&B|串烧|合唱|英文版|日文版|吉他|Cover|cover|版/.test(name))score-=30;
        // v1.13.0：明确标注"原唱"的版本加分（通常即正确版本）；
        // v1.15.4：仅当歌手字段命中查询歌手时生效——否则是"原唱"标在歌名里的翻唱
        if(/原唱/.test(name)&&(!wantArt||artFieldHit))score+=10;
        // v1.15.4b：歌名含括号且写"原唱"（"晴天 (原唱 周杰伦)"典型翻唱结构）→ 扣分
        if(/原唱/.test(name)&&/[（(]/.test(name))score-=25;
        return {it:it,score:score,idx:idx};
    }).sort(function(a,b){return b.score-a.score||a.idx-b.idx;}).map(function(x){return x.it;});
}
// 多候选直链并行校验 + 相关度优先：任一候选有结论就尝试结算，
// 但只有"比它更靠前的候选全部有结论"才允许选中它——
// 快但错（低相关度）的版本永远抢不了慢但对（高相关度）的位；全部失败才返回 null。
// 精准度核心修复：旧版谁先通过用谁，慢一点的正确音源总被抢。
// v1.15.0：探测走全局探测池（限流 3 路），结算后立即中止本组仍在途的探测释放带宽。
function muRaceCheck(list,mkHit,timeout){
    return new Promise(function(resolve){
        var total=list.length;
        if(!total)return resolve(null);
        var done=0,resolved=false,state=[];
        var tokens=new Set();
        function muRaceKill(){ tokens.forEach(function(t){ muProbeKill(t); }); tokens.clear(); }
        function settle(){
            if(resolved)return;
            for(var i=0;i<list.length;i++){
                if(state[i]===undefined)break;         // 更高优先候选仍在校验 → 暂不结算
                if(state[i]===true){ resolved=true; resolve(mkHit(list[i])); muRaceKill(); return; }
            }
            if(done===total){ resolved=true; resolve(null); muRaceKill(); }
        }
        list.forEach(function(g,idx){
            muProbeCheck(g.url,timeout,tokens).then(function(d){
                state[idx]=!!d;
            }).catch(function(){
                state[idx]=false;
            }).finally(function(){
                done++;
                settle();
            });
        });
    });
}
/* ===== v1.12.2 多通道时长感知结算（"谁先通过用谁"竞速已淘汰，更精准更稳） =====
   输入 [{name,pri,get}]，get() 返回 Promise<url>；
   · 各通道并行发起校验；
   · iarc（实测验证过的 VIP 全长通道）一旦可播立即采用，不等待其余候选；
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
        var fns=[function(){return muSearchGD('netease',cleanQ,artist,5000);},
                 function(){return muSearchGD('kuwo',cleanQ,artist,5000);},
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
    // base 越小优先级越高（网易云优先策略），结果按 pri 排序展示；
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
        function byPri(a,b){ return (a.pri||0)-(b.pri||0); } // v1.14.0：结果按全局相关度排序
        function cacheNow(){ if(results.length){ muCacheSet(cacheKey,results.slice().sort(byPri)); } }
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
                resolve(results.slice().sort(byPri));
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
                resolve(results.slice().sort(byPri));
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
/* ===== v1.16.0 搜索结果渲染：rAF 批量合并 + 事件委托（防卡顿核心） =====
   · 结果按 url 去重、按相关度统一排序，每帧最多渲染一次——引擎瞬间返回
     多条不再触发 O(n²) 插入与多次回流；
   · 最多展示 MU_RES_MAX 条，DOM 节点/闭包数量恒定；
   · 文档级单一委托点击（带存活校验，扩展重载后旧监听自动失效）：
     点行=添加并播放，"添加"=只入队列，"＋"=加入歌单/角色歌单；
     修复旧版"添加"点击冒泡到行导致重复入队的问题。 */
var MU_RES_MAX = 30;
var muHits = [], muHitsAdded = {}, muHitsTicket = -1, muHitsRAF = 0, muHitsRendered = [];
function muEsc(s){ return String(s===null||s===undefined?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function muHitsReset(ticket){
    muHits = []; muHitsAdded = {}; muHitsTicket = ticket; muHitsRendered = [];
    if(muHitsRAF){ try{ cancelAnimationFrame(muHitsRAF); }catch(e){} muHitsRAF = 0; }
}
function muSongFromHit(hit){
    var art=Array.isArray(hit.artist)?hit.artist.join(' / '):(hit.artist||'');
    return {name:hit.name, artist:art, url:hit.url, sid:hit.id||'', src:hit.source||''};
}
function appendSearchResult(hit){
    if(!hit || !hit.url) return;
    if(muHitsTicket !== muSearchTicket) muHitsReset(muSearchTicket);
    for(var i=0;i<muHits.length;i++){ if(muHits[i].url===hit.url) return; }
    muHits.push(hit);
    if(!muHitsRAF){
        try{ muHitsRAF = requestAnimationFrame(muRenderHits); }
        catch(e){ muHitsRAF = 0; muRenderHits(); }
    }
}
function muRenderHits(){
    muHitsRAF = 0;
    if(muHitsTicket !== muSearchTicket) return;
    var sorted = muHits.slice().sort(function(a,b){ return (a.pri||0)-(b.pri||0); }).slice(0, MU_RES_MAX);
    muHitsRendered = sorted;
    var h = '';
    for(var i=0;i<sorted.length;i++){
        var song = muSongFromHit(sorted[i]);
        var label = song.name + (song.artist ? ' - '+song.artist : '');
        var isAdded = muHitsAdded[song.url] ? ' added' : '';
        var badge = i===0 ? '<span class="nico-m-res-badge" title="全局相关度最高的版本">推荐</span>' : '';
        h += '<div class="nico-m-res-it" data-i="'+i+'">'
           + '<span class="nico-m-res-name" title="'+muEsc(label)+'">'+muEsc(label)+badge+'</span>'
           + '<button class="nico-m-res-pick" type="button" title="把这首歌加入歌单">＋</button>'
           + '<button class="nico-m-res-add'+isAdded+'" type="button">'+(isAdded?'已添加':'添加')+'</button>'
           + '</div>';
    }
    resDom.innerHTML = h;
}
function muQueueAdd(hit, autoplay){
    var song = muSongFromHit(hit);
    playlist.unshift({name:song.name,artist:song.artist,url:song.url,sid:song.sid,src:song.src});
    buildList(); cIdx = 0; nicoSavePlaylist();
    muHitsAdded[song.url] = 1;
    muRenderHits();
    if(autoplay){ loadP(); try{ pPlay(); }catch(e){} nicoShowToast('已添加并播放'); }
    else nicoShowToast('已添加到播放列表');
}
function muResClick(e){
    if(document.getElementById(PANEL_ID)!==panel) return;
    if(!e.target || !e.target.closest) return;
    if(!e.target.closest('#nico-mu-res')) return;
    var pickBtn = e.target.closest('.nico-m-res-pick');
    if(pickBtn){
        e.stopPropagation();
        var rowP = pickBtn.closest('.nico-m-res-it'); if(!rowP) return;
        var hitP = muHitsRendered[parseInt(rowP.dataset.i,10)]; if(!hitP) return;
        nicoOpenPicker(muSongFromHit(hitP));
        return;
    }
    var addBtn = e.target.closest('.nico-m-res-add');
    if(addBtn){
        e.stopPropagation();
        if(addBtn.classList.contains('added')) return;
        var rowA = addBtn.closest('.nico-m-res-it'); if(!rowA) return;
        var hitA = muHitsRendered[parseInt(rowA.dataset.i,10)]; if(!hitA) return;
        muQueueAdd(hitA, false);
        return;
    }
    var row = e.target.closest('.nico-m-res-it');
    if(row && row.dataset.i !== undefined){
        var hit = muHitsRendered[parseInt(row.dataset.i,10)];
        if(!hit) return;
        if(muHitsAdded[hit.url]){ cIdx = 0; loadP(); try{ pPlay(); }catch(ex){} } // 已在队列：直接播
        else muQueueAdd(hit, true);
    }
}
document.addEventListener('click', muResClick);
async function muSearchGD(source,query,artist,checkTimeout){
    try{
        var fullQ = artist ? query + ' ' + artist : query;
        var sr=await muFetch(MUSIC_API+'?types=search&count=8&source='+source+'&name='+encodeURIComponent(fullQ),4500).then(function(r){return r.json();});
        if(!sr||!sr.length)return null;
        var ranked=muRank(sr,fullQ,artist);
        // v1.14.0：最低置信度门槛——歌名必须与查询强相关（繁简归一后互相包含），乱码查询不误配
        ranked = ranked.filter(function(it){ return muGateOk(it, query, artist); });
        // v1.13.0：候选池改为按打分排序（不再强制"原生第一候选永远优先"——它就是
        // 翻唱/深情版重灾区）；原生第一候选降级为打分前 5 之外的末位兜底（pri=99），
        // muRaceCheck 只在打分候选全部不可播时才会轮到它
        var pool=[],seenP={};
        function pushP(it,pri){ var k=(it.id||it.name||'')+''; if(!seenP[k]){ seenP[k]=1; pool.push({it:it,pri:pri}); } }
        ranked.slice(0,5).forEach(function(it,ri){ pushP(it,ri+1); });
        if(sr[0] && muGateOk(sr[0], query, artist) && !seenP[(sr[0].id||sr[0].name||'')+'']) pushP(sr[0],99);
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
   与 gdstudio 完全独立的音源管道，稳定性关键来源之一；
   结果仍走 muRank 排序 + 时长感知校验，保证精准与可播并重 */
async function muSearchQijieya(query,artist){
    try{
        var fullQ = artist ? query + ' ' + artist : query;
        var qj=await muFetch('https://api.qijieya.cn/meting/?server=netease&type=search&name='+encodeURIComponent(fullQ),4500).then(function(r){return r.json();});
        if(!qj||!qj.length)return null;
        var ranked=muRank(qj,fullQ,artist);
        // v1.14.0：同 gdstudio，歌名必须与查询强相关
        ranked = ranked.filter(function(it){ return muGateOk(it, query, artist); });
        // 同 gdstudio：原生第一候选 ∪ 打分前5，pri 越小越优先
        var pool=[],seenP={};
        function pushP(it,pri){ var k=(it.id||it.name||'')+''; if(!seenP[k]){ seenP[k]=1; pool.push({it:it,pri:pri}); } }
        if(qj[0] && muGateOk(qj[0], query, artist))pushP(qj[0],0);
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
function muNormKey(s){ return String(s||'').toLowerCase().split('').map(function(c){return muT2S[c]||c;}).join('').replace(/\s+/g,''); }
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
// v1.14.0：最低置信度门槛（比 muStrongMatch 更严）——单关键词查询只放行"歌名包含完整查询"，
// 反向包含（查询包含歌名）仅在多词查询或有歌手确认时放行，杜绝乱码/错字查询误配无关歌曲
function muGateOk(it, query, artist){
    if(!it || !it.name) return false;
    var q = String(query||'') .trim();
    if(!q) return false;
    var qn = muNormKey(q), hn = muNormKey(it.name);
    var hnBare = hn.replace(/[（(].*?[)）]/g,'');
    if(!hnBare) return false;
    if(hnBare !== qn && hnBare.indexOf(qn) < 0){
        // 反向包含仅在多词查询（"晴天 周杰伦"）或提供歌手时放行
        var tokens = q.split(/\s+/).filter(Boolean);
        if(tokens.length < 2 && !artist) return false;
        if(qn.indexOf(hnBare) < 0) return false;
    }
    if(artist){
        var ha = muNormKey(it.artist||'');
        var qa = muNormKey(artist);
        if(ha && qa){
            var qParts = qa.split(/[\/、,&，,]/).filter(Boolean);
            var hitPart = qParts.some(function(t){ return t && (ha.indexOf(t) >= 0 || muNormKey(it.name).indexOf(t) >= 0); });
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
/* ===== 4.5.2 听歌识曲（网易云识别，v1.15.0） =====
   流程：播放器音轨 / 麦克风录音 12s → ScriptProcessorNode 原始 PCM 直采
   （v1.15.1：不依赖 MediaRecorder/解码，Chrome 无法解码 webm/opus 是旧版失败根因）→ 重采样 8kHz 单声道 →
   内嵌 afp 指纹库生成网易云音频指纹 → POST api.2leo.top/audio/match 识别 →
   候选结果优先挑"原唱"版本 → 自动搜歌（多引擎兜底）并播放原唱，
   搜索结果照常列出，可手动挑选其他版本。
   说明：网易官方识别 API 无 CORS 头（官方 demo 亦需 CORS 代理），本实现走
   NeteaseCloudMusicApi 公共实例（api.2leo.top，开放 CORS）；如实例不可用，
   可在 NICO_ID_API 常量处替换为自建 NeteaseCloudMusicApi 地址。 */
var NICO_ID_API='https://api.2leo.top/';
var NICO_ID_SECS=12;                 // 录音时长（秒）：12s 兼顾速度与识别率（前奏安静时换窗口重试）
var NICO_ID_MATCH_API='audio/match'; // NeteaseCloudMusicApi 听歌识曲端点
var nicoIdBusy=false, nicoIdMode='player';
var nicoIdRecTimer=null, nicoIdStream=null, nicoIdRec=null, nicoIdCtx=null;
var idBtn=panel.querySelector('#nico-mu-id-btn');
var idSrcBtn=panel.querySelector('#nico-mu-id-src');
var idSt=document.getElementById('nico-mu-id-status');
if(idSt) idSt.textContent='v1.16.0 已加载｜点击识别当前播放的歌曲，识别后自动搜索并播放原唱';

function nicoIdSetBusy(b, txt){
    nicoIdBusy=b;
    if(idBtn){ idBtn.disabled=b; if(txt!==undefined) idBtn.textContent=txt; }
    if(idSrcBtn) idSrcBtn.disabled=b;
}
function nicoIdStatus(t){ if(idSt) idSt.textContent=t; }
function nicoIdCleanup(){
    if(nicoIdRecTimer){ clearTimeout(nicoIdRecTimer); nicoIdRecTimer=null; }
    if(nicoIdRec){ try{ if(nicoIdRec.state!=='inactive') nicoIdRec.stop(); }catch(e){} nicoIdRec=null; }
    if(nicoIdStream){ try{ nicoIdStream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} nicoIdStream=null; }
    if(nicoIdCtx){ try{ nicoIdCtx.close(); }catch(e){} nicoIdCtx=null; }
}
// 取播放器音轨（Chrome/Edge captureStream，Firefox mozCaptureStream）
function nicoIdPlayerStream(){
    var el=au;
    if(!el || el.paused || !el.src) return null;
    try{
        if(el.captureStream) return el.captureStream();
        if(el.mozCaptureStream) return el.mozCaptureStream();
    }catch(e){}
    return null;
}
// 原始 PCM 采集：ScriptProcessorNode 直采（兼容 Chrome/Edge/Firefox/Safari）。
// v1.15.1：不再用 MediaRecorder + decodeAudioData——Chrome 的 decodeAudioData
// 无法解码 webm/opus（MediaRecorder 默认产出格式），导致旧版"一直识别失败"。
function nicoIdCapturePcm(stream, secs){
    return new Promise(function(res, rej){
        var AC=window.AudioContext||window.webkitAudioContext;
        var ctx=new AC();
        nicoIdCtx=ctx;
        if(ctx.state==='suspended'){ try{ ctx.resume(); }catch(e){} }
        var rate=ctx.sampleRate||48000;
        var src=null, proc=null;
        try{
            src=ctx.createMediaStreamSource(stream);
            proc=ctx.createScriptProcessor(4096, 2, 1);
        }catch(e){ rej(e); return; }
        var raw=[], total=0;
        proc.onaudioprocess=function(ev){
            var inb=ev.inputBuffer;
            var ch0=inb.getChannelData(0), n=ch0.length;
            var mono;
            if(inb.numberOfChannels>1){
                var ch1=inb.getChannelData(1);
                mono=new Float32Array(n);
                for(var i=0;i<n;i++){ mono[i]=(ch0[i]+ch1[i])*0.5; }
            }else{ mono=ch0; }
            raw.push(mono); total+=n;
        };
        src.connect(proc);
        // 输出接 destination 但不写输出缓冲（保持 0），确保处理链在所有浏览器持续运转且无声
        proc.connect(ctx.destination);
        nicoIdRecTimer=setTimeout(function(){
            nicoIdRecTimer=null;
            proc.onaudioprocess=null;
            try{ src.disconnect(); }catch(e){}
            try{ proc.disconnect(); }catch(e){}
            nicoIdCtx=null;
            try{ ctx.close(); }catch(e){}
            var all=new Float32Array(total), off=0;
            for(var k=0;k<raw.length;k++){ all.set(raw[k], off); off+=raw[k].length; }
            res(nicoIdTo8k(all, rate));
        }, secs*1000);
    });
}
// 线性重采样到 8kHz 单声道
function nicoIdTo8k(mono, inRate){
    var n=Math.floor(mono.length*8000/inRate);
    if(n<=0) return new Float32Array(0);
    var out=new Float32Array(n);
    var ratio=mono.length/n;
    for(var i=0;i<n;i++){
        var p=i*ratio, i0=Math.floor(p), i1=Math.min(i0+1, mono.length-1), f=p-i0;
        out[i]=mono[i0]*(1-f)+mono[i1]*f;
    }
    return out;
}
// 音量检测（RMS）：几乎无声直接提示，不白跑识别
function nicoIdRms(pcm){
    if(!pcm || !pcm.length) return 0;
    var s=0;
    for(var i=0;i<pcm.length;i++){ s+=pcm[i]*pcm[i]; }
    return Math.sqrt(s/pcm.length);
}
// 识别尝试：整段 12s 优先；无命中再跳过开头 40%（静音前奏/淡入段）重试
// （浏览器实测：整段含前奏时 0-10s 常不命中，跳过 40% 后剩余 7s 可稳定命中）
function nicoIdTryMatch(pcm, secs){
    if(!pcm || !pcm.length) return Promise.resolve(null);
    var rms=nicoIdRms(pcm);
    if(rms<0.01){
        nicoIdStatus('几乎没有捕捉到声音（音量 '+rms.toFixed(4)+'），请调大音量或检查麦克风');
        return Promise.resolve(null);
    }
    nicoIdStatus('正在识别…');
    return nicoIdMatch(pcm, secs).then(function(list){
        if(list && list.length) return list;
        var skip=Math.round(pcm.length*0.4);
        if(skip>=pcm.length-4*8000) return null;  // 剩余不足 4s 放弃
        var win=pcm.subarray(skip);
        var winSecs=Math.round(win.length/8000);
        if(winSecs<4) return null;
        nicoIdStatus('首次未命中，换片段重试…');
        return nicoIdMatch(win, winSecs);
    });
}
// 识别请求：返回归一化结果数组 [{name, artist, id, startTime}] 或 null
function nicoIdMatch(pcm, secs){
    return nicoNcmAFP.GenerateFP(pcm).then(function(fp){
        var qs=new URLSearchParams();
        qs.set('duration', String(secs));
        qs.set('audioFP', fp);
        try{ console.info('[nico-id] 指纹生成完成: len='+fp.length+' dur='+secs+'s'); }catch(e){}
        return fetch(NICO_ID_API + NICO_ID_MATCH_API + '?' + qs.toString(), {method:'POST'});
    }).then(function(r){
        try{ console.info('[nico-id] 识别接口 HTTP '+r.status); }catch(e){}
        if(!r.ok) throw new Error('HTTP '+r.status+(r.statusText?' '+r.statusText:''));
        return r.json();
    }).then(function(j){
        if(!j || j.code!==200) throw new Error('API code '+(j&&j.code!==undefined?j.code:'?'));
        if(!j.data || !j.data.result || !j.data.result.length){
            try{ console.info('[nico-id] 接口无匹配结果'); }catch(e){}
            return null;
        }
        var list=j.data.result.map(function(r){
            var s=r.song||{};
            var ar=Array.isArray(s.artists)?s.artists.map(function(a){ return a.name||''; }).filter(Boolean):[];
            return { name:s.name||'', artist:ar.join(' / '), id:s.id||'', startTime:r.startTime||0 };
        });
        try{ console.info('[nico-id] 命中 '+list.length+' 条: '+list.slice(0,3).map(function(h){ return h.name+' - '+h.artist; }).join(' | ')); }catch(e){}
        return list;
    });
}
// 剥离歌名尾部版本标签（"晴天(深情版)"→"晴天"）
function nicoIdCoreTitle(name){
    return String(name||'').replace(/[（(][^（）()]*[)）]\s*$/g,'').trim();
}
function nicoIdIsCover(name){
    return /翻唱|Cover|cover|深情|女声|男声|伴奏|钢琴|Live|现场|[Rr]emix|串烧|合唱|英文版|日文版|版/.test(String(name||''));
}
// 识别候选里优先挑原唱：同曲目前提下，非翻唱/版本标签的版本优先
function nicoIdPickOriginal(list){
    var top=list && list[0];
    if(!top || list.length<2) return top;
    // v1.15.4：锚定"出现最多的歌名核心"，避免 API 首位候选是冷门同名曲
    // （如"后座上的晴天"）时把整首歌锚错、翻唱反被选中
    var cnt={}, order=[], i;
    for(i=0;i<list.length;i++){
        var c=nicoIdCoreTitle(list[i] && list[i].name);
        if(!c) continue;
        if(cnt[c]===undefined){ cnt[c]=1; order.push(c); }
        else cnt[c]++;
    }
    var core=order[0]||'', max=0;
    for(i=0;i<order.length;i++){ if(cnt[order[i]]>max){ max=cnt[order[i]]; core=order[i]; } }
    if(!core) return top;
    var best=null;
    for(i=0;i<list.length;i++){
        var r=list[i];
        if(!r || nicoIdCoreTitle(r.name)!==core) continue;
        if(!best){ best=r; continue; }
        var bCover=nicoIdIsCover(best.name), rCover=nicoIdIsCover(r.name);
        if(bCover && !rCover){ best=r; continue; }
        if(bCover===rCover && !best.artist && r.artist){ best=r; }
    }
    return best || top;
}
// 识别 → 优先用命中歌曲 ID 精确解析音源并播放（原唱优先），失败回退多引擎搜索；
// 搜索结果照常列在列表供手动挑选
function nicoIdSearchAndPlay(name, artist, id){
    var q=name||'', art=artist||'', sid=id||'';
    sIn.value=q;
    if(aIn) aIn.value=art;
    muAbortAll();
    var myTicket=++muSearchTicket;
    nicoIdSetBusy(true,'识别中');
    nicoIdStatus('已识别：「'+q+(art?' - '+art:'')+'」，正在解析原唱音源…');
    resDom.innerHTML=''; resDom.classList.add('show');
    titD.textContent='解析原唱音源中...';
    var firstArrived=false, totalShown=0;
    function nicoIdPlayHit(hit, hsid, hsrc){
        var hArt=Array.isArray(hit.artist)?hit.artist.join(' / '):(hit.artist||'');
        playlist.unshift({name:hit.name, artist:hArt, url:hit.url, sid:hsid||'', src:hsrc||''});
        buildList(); cIdx=0; nicoSavePlaylist();
        loadP(); try{ pPlay(); }catch(e){}
        nicoIdStatus('已播放原唱：「'+hit.name+(hArt?' - '+hArt:'')+'」');
        nicoShowToast('已识别并播放原唱');
    }
    // 回退路径：多引擎搜索（v1.15.2：候选逐个探测可播性，只播真正能播的）
    function startSearch(){
        if(myTicket!==muSearchTicket) return;
        nicoIdStatus('直链解析失败，正在搜索音源…');
        titD.textContent='搜索原唱中...';
        muResolveMulti(q, art, function(hit, count, total, done, isFinal){
            if(myTicket!==muSearchTicket) return;
            if(!firstArrived){ firstArrived=true; resDom.innerHTML=''; }
            if(hit) appendSearchResult(hit);
            totalShown=count||0;
            titD.textContent=isFinal ? (totalShown?('找到 '+totalShown+' 个结果'):'搜索完成') : ('找到 '+count+' 个结果（继续搜索中…）');
        }).then(function(hits){
            if(myTicket!==muSearchTicket) return;
            nicoIdSetBusy(false,'听歌识曲');
            var maxTry=Math.min(hits ? hits.length : 0, 6);
            var probeNext=function(i){
                if(i>=maxTry) return Promise.resolve(null);
                return muCheckUrlFast(hits[i].url, 2500).then(function(ok){
                    if(ok) return hits[i];
                    return probeNext(i+1);
                });
            };
            probeNext(0).then(function(best){
                if(myTicket!==muSearchTicket) return;
                try{ console.info('[nico-id] 搜索候选'+maxTry+'个，自动播放: '+(best ? best.name+' - '+(best.artist||'') : '无可用音源')); }catch(e){}
                if(!best){
                    nicoIdStatus('识别成功，但未找到可播放音源，可点击结果手动添加');
                    titD.textContent='未找到可播音源';
                    var empty=document.createElement('div'); empty.className='nico-m-res-it';
                    empty.innerHTML='<span class="nico-m-res-name">未找到可播音源</span>';
                    resDom.appendChild(empty);
                    return;
                }
                nicoIdPlayHit(best, best.id, best.source);
            });
        }).catch(function(){
            if(myTicket!==muSearchTicket) return;
            nicoIdSetBusy(false,'听歌识曲');
            nicoIdStatus('搜索失败，请重试');
        });
    }
    if(!sid){ startSearch(); return; }
    // v1.15.3 主路径：用识别命中的网易云歌曲 ID 直解音源（与识别结果逐字一致，最精准）
    Promise.resolve().then(function(){
        return muGdItemUrl('netease', {id:sid, name:q, artist:art});
    }).then(function(g){
        if(!g || !g.url) return null;
        return muCheckUrlFast(g.url, 3000).then(function(ok){ return ok ? g : null; });
    }).then(function(g){
        if(!g){ startSearch(); return; }
        if(myTicket!==muSearchTicket) return;
        nicoIdSetBusy(false,'听歌识曲');
        try{ console.info('[nico-id] ID直解成功: '+q+' | '+(g.url||'').slice(0,60)); }catch(e){}
        var gi=g.item||{};
        nicoIdPlayHit({name:gi.name||q, artist:(gi.artist||art), url:g.url}, sid, 'netease-id');
    }).catch(function(){
        startSearch();
    });
}
// 主流程：录音 → 指纹 → 识别 → 原唱优先搜播
function nicoIdRun(){
    if(nicoIdBusy) return;
    nicoIdCleanup();
    var ps=null;
    if(nicoIdMode==='player'){
        ps=nicoIdPlayerStream();
        if(!ps){
            nicoIdStatus('当前未在播放，请先播放歌曲，或切换到麦克风识曲');
            nicoShowToast('请先播放歌曲或改用麦克风');
            return;
        }
    }else{
        if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
            nicoIdStatus('当前浏览器不支持麦克风识曲');
            return;
        }
        nicoIdStatus('正在请求麦克风权限…');
    }
    nicoIdSetBusy(true,'识别中');
    var p=nicoIdMode==='player'
        ? Promise.resolve(ps)
        : navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false, autoGainControl:false, noiseSuppression:false, latency:0}});
    p.then(function(s){
        nicoIdStream=s;
        nicoIdStatus(nicoIdMode==='mic' ? '正在听…（'+NICO_ID_SECS+'s）' : '正在从播放器录音…（'+NICO_ID_SECS+'s）');
        return nicoIdCapturePcm(s, NICO_ID_SECS);
    }).then(function(pcm){
        nicoIdStatus('正在识别…');
        return nicoIdTryMatch(pcm, NICO_ID_SECS);
    }).then(function(list){
        if(!list || !list.length){
            nicoIdSetBusy(false,'听歌识曲');
            nicoIdStatus('未识别出歌曲，请靠近声源或调大音量后重试');
            nicoShowToast('识别失败，请重试');
            return;
        }
        var orig=nicoIdPickOriginal(list);
        nicoIdSearchAndPlay(orig.name, orig.artist, orig.id);
    }).catch(function(e){
        nicoIdSetBusy(false,'听歌识曲');
        try{ console.error('[nico-id] 识别流程异常', e); }catch(_e){}
        var why=(e && e.name==='NotAllowedError') ? '麦克风权限被拒绝'
            : (e && e.name) ? (e.name + (e.message ? ': '+e.message : ''))
            : '请检查网络后重试';
        nicoIdStatus('识别失败：' + why);
        nicoShowToast('听歌识曲失败');
    }).finally(function(){ nicoIdCleanup(); });
}
if(idBtn){ idBtn.onclick=nicoIdRun; }
if(idSrcBtn){
    idSrcBtn.onclick=function(){
        if(nicoIdBusy) return;
        nicoIdMode=(nicoIdMode==='player')?'mic':'player';
        idSrcBtn.textContent=(nicoIdMode==='player')?'播放器':'麦克风';
        idSrcBtn.title=(nicoIdMode==='player')?'识别当前播放器的声音':'识别麦克风听到的声音';
        nicoIdStatus(nicoIdMode==='player'?'识别源：播放器（识别当前正在播放的歌）':'识别源：麦克风（识别周围环境的声音）');
    };
}
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
// 按网易云歌曲 ID 解析音源：iarc 优先（实测验证过的 VIP 全长直链通道），
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
    var plBtn = panel.querySelector('#nico-pl-import');
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
        if(plBtn){ plBtn.disabled = false; plBtn.textContent = '导入'; }
    }
}
// v1.16.0：#nico-mu-pl-btn 现打开歌单中心（绑定在歌单模块）；网易云导入移至歌单中心“导入”
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
    // v1.12.1：优先按歌曲 ID 精确拉歌词，
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
            var req = window.indexedDB.open('nicoDrawPanel', 4);
            req.onupgradeneeded = function(){
                try{
                    var db = req.result;
                    if(!db.objectStoreNames.contains('images')) db.createObjectStore('images');
                    if(!db.objectStoreNames.contains('gallery')) db.createObjectStore('gallery');
                    if(!db.objectStoreNames.contains('profile')) db.createObjectStore('profile');
                    if(!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists');
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

/* ===== 4.10 歌单中心（v1.16.0）：角色歌单 + 自建歌单 =====
   · 角色歌单：通过 SillyTavern getContext 读取当前全部角色，每个角色按头像
     文件名分立独立歌单（兼容新旧 ST：characters 为文件名数组或角色对象数组）；
   · 自建歌单：新建 / 重命名 / 删除；
   · 全部数据写入 IndexedDB（playlists store），写入防抖，批量操作不卡顿；
   · 歌曲去重键：优先 sid+src，否则 url。 */

/* --- ST 上下文桥接 --- */
function nicoGetCtx(){
    try{
        if(window.SillyTavern && typeof window.SillyTavern.getContext==='function') return window.SillyTavern.getContext();
    }catch(e){}
    return null;
}
function nicoReadCharacters(){
    var ctx = nicoGetCtx(); if(!ctx) return [];
    var list = Array.isArray(ctx.characters) ? ctx.characters : [];
    var out = [];
    for(var i=0;i<list.length;i++){
        var c = list[i];
        if(typeof c === 'string'){
            var file = c;
            var stem = file.replace(/\.[^.\/]+$/,'');
            var nm = (i===ctx.characterId && ctx.name2) ? ctx.name2 : stem;
            out.push({avatar:file, name:nm, current:i===ctx.characterId});
        } else if(c && typeof c==='object'){
            var av = c.avatar || c.filename || c.avatar_url || '';
            var dnm = c.name || (c.data && c.data.name) || av.replace(/\.[^.\/]+$/,'') || ('角色'+(i+1));
            out.push({avatar:av, name:dnm, current:i===ctx.characterId});
        }
    }
    return out;
}
function nicoAvatarUrl(avatar){
    if(!avatar) return '';
    var ctx = nicoGetCtx();
    if(ctx && typeof ctx.getThumbnailUrl==='function'){
        try{ return ctx.getThumbnailUrl('avatar', avatar); }catch(e){}
    }
    return '/thumbnail?type=avatar&file=' + encodeURIComponent(avatar);
}

/* --- 数据层 --- */
var NICO_PL_STORE = 'playlists', NICO_PL_CUSTOM_KEY = '__custom__';
var NICO_NOTE_SVG = '<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
var nicoPL = { customs: [], chars: {}, loaded: false };
var nicoPLTimers = {};
function nicoPLNormSong(s){
    s = s || {};
    return {name:s.name||'', artist:s.artist||'', url:s.url||'', sid:s.sid||'', src:s.src||''};
}
function nicoPLSongKey(s){
    if(s.sid) return 'sid:' + (s.src||'') + ':' + s.sid;
    return 'url:' + s.url;
}
function nicoPLCharSongs(avatar){
    if(!nicoPL.chars[avatar]) nicoPL.chars[avatar] = [];
    return nicoPL.chars[avatar];
}
function nicoFindCustom(id){
    for(var i=0;i<nicoPL.customs.length;i++) if(nicoPL.customs[i].id===id) return nicoPL.customs[i];
    return null;
}
function nicoPLFixCustom(o){
    o = o || {};
    return {
        id: o.id || ('pl_' + Date.now() + '_' + Math.floor(Math.random()*1e6)),
        name: o.name || '未命名歌单',
        created: o.created || Date.now(),
        songs: Array.isArray(o.songs) ? o.songs.map(nicoPLNormSong) : []
    };
}
function nicoPLSchedule(target){
    var key = target.type==='char' ? ('char:'+target.avatar) : NICO_PL_CUSTOM_KEY;
    if(nicoPLTimers[key]) clearTimeout(nicoPLTimers[key]);
    nicoPLTimers[key] = setTimeout(function(){
        nicoPLTimers[key] = null;
        var data = target.type==='char' ? nicoPL.chars[target.avatar] : nicoPL.customs;
        nicoIdbSet(NICO_PL_STORE, key, data).catch(function(){});
    }, 260);
}
function nicoPLAddTo(target, song){
    var arr;
    if(target.type==='char'){ arr = nicoPLCharSongs(target.avatar); }
    else { var c = nicoFindCustom(target.id); if(!c) return false; arr = c.songs; }
    var k = nicoPLSongKey(song);
    for(var i=0;i<arr.length;i++) if(nicoPLSongKey(arr[i])===k) return false;
    arr.push(nicoPLNormSong(song));
    nicoPLSchedule(target);
    return true;
}
function nicoPLRemoveAt(target, idx){
    var arr = target.type==='char' ? nicoPLCharSongs(target.avatar) : nicoFindCustom(target.id).songs;
    if(idx<0 || idx>=arr.length) return false;
    arr.splice(idx,1); nicoPLSchedule(target); return true;
}
function nicoPLCreate(name){
    var c = nicoPLFixCustom({name:name});
    nicoPL.customs.push(c);
    nicoPLSchedule({type:'custom'});
    return c;
}
function nicoPLDeleteCustom(id){
    for(var i=0;i<nicoPL.customs.length;i++){
        if(nicoPL.customs[i].id===id){ nicoPL.customs.splice(i,1); nicoPLSchedule({type:'custom'}); return true; }
    }
    return false;
}
function nicoPLRenameCustom(id, name){
    var c = nicoFindCustom(id); if(!c) return false;
    c.name = name; nicoPLSchedule({type:'custom'}); return true;
}
function nicoPLLoad(){
    return nicoIdbAll(NICO_PL_STORE).then(function(all){
        nicoPL.customs = []; nicoPL.chars = {};
        for(var i=0;i<all.length;i++){
            var k = String(all[i].key), v = all[i].value;
            if(k===NICO_PL_CUSTOM_KEY){
                if(Array.isArray(v)) nicoPL.customs = v.map(nicoPLFixCustom);
            } else if(k.indexOf('char:')===0){
                var avatar = k.slice(5);
                if(avatar) nicoPL.chars[avatar] = Array.isArray(v) ? v.map(nicoPLNormSong) : [];
            }
        }
        nicoPL.loaded = true;
    }).catch(function(){ nicoPL.loaded = true; });
}

/* --- DOM 引用 --- */
var nicoPlOv = panel.querySelector('#nico-pl');
var nicoPlCharsEl = panel.querySelector('#nico-pl-chars');
var nicoPlCustomsEl = panel.querySelector('#nico-pl-customs');
var nicoPlDetailName = panel.querySelector('#nico-pl-d-name');
var nicoPlDetailInfo = panel.querySelector('#nico-pl-d-info');
var nicoPlDetailList = panel.querySelector('#nico-pl-d-list');
var nicoPlNewBtn = panel.querySelector('#nico-pl-new');
var nicoPlPick = panel.querySelector('#nico-pl-pick');
var nicoPlPickX = panel.querySelector('#nico-pl-pick-x');
var nicoPlPickSearch = panel.querySelector('#nico-pl-pick-search');
var nicoPlPickList = panel.querySelector('#nico-pl-pick-list');
var nicoPlModalEl = panel.querySelector('#nico-pl-modal');
var nicoPlDetailTarget = null;
var nicoPickSong = null;

/* --- 中心列表渲染 --- */
function nicoRenderChars(){
    var chars = nicoReadCharacters();
    if(!chars.length){ nicoPlCharsEl.innerHTML = '<div class="nico-pl-empty">未读取到角色：请在酒馆中打开一个角色</div>'; return; }
    var h = '';
    for(var i=0;i<chars.length;i++){
        var c = chars[i], cnt = (nicoPL.chars[c.avatar]||[]).length;
        h += '<button class="nico-pl-row" type="button" data-open="char" data-avatar="'+muEsc(c.avatar)+'">'
           + '<span class="nico-pl-ico"><img loading="lazy" src="'+muEsc(nicoAvatarUrl(c.avatar))+'" alt=""></span>'
           + '<span class="nico-pl-meta"><span class="nico-pl-nm">'+muEsc(c.name)+(c.current?'<em class="nico-pl-cur">当前</em>':'')+'</span>'
           + '<span class="nico-pl-sub">'+cnt+' 首</span></span></button>';
    }
    nicoPlCharsEl.innerHTML = h;
}
function nicoRenderCustoms(){
    if(!nicoPL.customs.length){ nicoPlCustomsEl.innerHTML = '<div class="nico-pl-empty">还没有自建歌单，点上方“新建歌单”</div>'; return; }
    var h = '';
    for(var i=0;i<nicoPL.customs.length;i++){
        var c = nicoPL.customs[i];
        h += '<div class="nico-pl-row" data-open="custom" data-id="'+muEsc(c.id)+'">'
           + '<span class="nico-pl-ico">'+NICO_NOTE_SVG+'</span>'
           + '<span class="nico-pl-meta"><span class="nico-pl-nm">'+muEsc(c.name)+'</span>'
           + '<span class="nico-pl-sub">'+c.songs.length+' 首</span></span>'
           + '<button class="nico-pl-menu" type="button" title="重命名 / 删除">···</button></div>';
    }
    nicoPlCustomsEl.innerHTML = h;
}

/* --- 歌单详情 --- */
function nicoCharDisplayName(avatar){
    var chars = nicoReadCharacters();
    for(var i=0;i<chars.length;i++) if(chars[i].avatar===avatar) return chars[i].name;
    return String(avatar).replace(/\.[^.\/]+$/,'');
}
function nicoOpenDetail(target){
    nicoPlDetailTarget = target;
    var songs, name;
    if(target.type==='char'){
        songs = nicoPLCharSongs(target.avatar);
        name = '角色 · ' + nicoCharDisplayName(target.avatar);
    } else {
        var c = nicoFindCustom(target.id);
        if(!c) return;
        songs = c.songs; name = c.name;
    }
    nicoPlDetailName.textContent = name;
    nicoPlDetailInfo.textContent = '共 ' + songs.length + ' 首 · 点歌曲播放，× 移除';
    var h = '';
    if(!songs.length) h = '<div class="nico-pl-empty">歌单是空的：搜索歌曲后点“＋”加入这里</div>';
    for(var i=0;i<songs.length;i++){
        var s = songs[i];
        var label = s.name + (s.artist ? ' - '+s.artist : '');
        h += '<div class="nico-pl-song" data-i="'+i+'"><span class="nico-pl-song-i">'+(i+1)+'</span>'
           + '<span class="nico-pl-song-m" title="'+muEsc(label)+'">'+muEsc(label)+'</span>'
           + '<button class="nico-pl-song-x" type="button" data-x="'+i+'" title="移除">×</button></div>';
    }
    nicoPlDetailList.innerHTML = h;
    nicoPlOv.dataset.view = 'detail';
}

/* --- 播放：整单载入队列 --- */
function nicoPlayTarget(target, start){
    var songs;
    if(target.type==='char') songs = nicoPLCharSongs(target.avatar);
    else { var c = nicoFindCustom(target.id); songs = c ? c.songs : []; }
    if(!songs.length){ nicoShowToast('歌单是空的'); return; }
    playlist = songs.map(function(s){
        return {name:s.name, artist:s.artist, url:s.url, sid:s.sid||'', src:s.src||''};
    });
    cIdx = Math.max(0, Math.min(start||0, playlist.length-1));
    nicoSavePlaylist(); buildList(); loadP();
    try{ pPlay(); }catch(e){}
    lDom.classList.add('show');
    nicoPlClose();
}

/* --- 添加到歌单 bottom sheet --- */
function nicoRenderPick(filter){
    var f = String(filter||'').toLowerCase();
    var chars = nicoReadCharacters();
    var h = '', charHits = 0, customHits = 0;
    for(var i=0;i<chars.length;i++){
        var c = chars[i];
        if(f && c.name.toLowerCase().indexOf(f)<0) continue;
        charHits++;
        var cnt = (nicoPL.chars[c.avatar]||[]).length;
        h += '<button class="nico-pl-row" type="button" data-pick="char" data-avatar="'+muEsc(c.avatar)+'">'
           + '<span class="nico-pl-ico"><img loading="lazy" src="'+muEsc(nicoAvatarUrl(c.avatar))+'" alt=""></span>'
           + '<span class="nico-pl-meta"><span class="nico-pl-nm">'+muEsc(c.name)+'</span>'
           + '<span class="nico-pl-sub">角色歌单 · '+cnt+' 首</span></span></button>';
    }
    for(var j=0;j<nicoPL.customs.length;j++){
        var cu = nicoPL.customs[j];
        if(f && cu.name.toLowerCase().indexOf(f)<0) continue;
        customHits++;
        h += '<button class="nico-pl-row" type="button" data-pick="custom" data-id="'+muEsc(cu.id)+'">'
           + '<span class="nico-pl-ico">'+NICO_NOTE_SVG+'</span>'
           + '<span class="nico-pl-meta"><span class="nico-pl-nm">'+muEsc(cu.name)+'</span>'
           + '<span class="nico-pl-sub">自建歌单 · '+cu.songs.length+' 首</span></span></button>';
    }
    if(!f) h += '<button class="nico-pl-pick-new" type="button" data-pick="new">＋ 新建歌单</button>';
    if(f && !charHits && !customHits) h = '<div class="nico-pl-empty">没有匹配的歌单</div>';
    nicoPlPickList.innerHTML = h;
}
function nicoOpenPicker(song){
    nicoPickSong = nicoPLNormSong(song);
    nicoPlPickSearch.value = '';
    nicoRenderPick('');
    nicoPlPick.classList.add('show');
}
function nicoClosePick(){ nicoPlPick.classList.remove('show'); }
function nicoPickCreate(){
    nicoPrompt({title:'新建歌单', placeholder:'给歌单起个名字', okText:'创建'}).then(function(name){
        if(!name) return;
        var c = nicoPLCreate(name);
        if(nicoPickSong) nicoPLAddTo({type:'custom', id:c.id}, nicoPickSong);
        nicoClosePick();
        nicoRenderCustoms();
        nicoShowToast(nicoPickSong ? '已创建并添加' : '已创建歌单');
    });
}

/* --- 通用弹窗（输入框 / 操作表） --- */
var nicoModalResolve = null;
function nicoModalOpen(card){
    return new Promise(function(res){
        nicoModalResolve = res;
        nicoPlModalEl.innerHTML = '';
        nicoPlModalEl.appendChild(card);
        nicoPlModalEl.classList.add('show');
    });
}
function nicoModalClose(v){
    if(!nicoPlModalEl.classList.contains('show') && !nicoModalResolve) return;
    nicoPlModalEl.classList.remove('show');
    nicoPlModalEl.innerHTML = '';
    var r = nicoModalResolve; nicoModalResolve = null;
    if(r) r(v);
}
nicoPlModalEl.addEventListener('click', function(e){ if(e.target===nicoPlModalEl) nicoModalClose(null); });
function nicoPrompt(opts){
    var card = document.createElement('div'); card.className = 'nico-pl-modal-card';
    card.innerHTML = '<div class="nico-pl-modal-t">'+muEsc(opts.title||'')+'</div>'
        + '<input class="nico-pl-modal-in" maxlength="30" placeholder="'+muEsc(opts.placeholder||'')+'">'
        + '<div class="nico-pl-modal-acts"><button type="button" data-mact="cancel">取消</button><span class="nico-pl-modal-sep"></span><button type="button" class="primary" data-mact="ok">'+muEsc(opts.okText||'确定')+'</button></div>';
    var inp = card.querySelector('input');
    if(opts.value) inp.value = opts.value;
    function okAct(){ var v=(inp.value||'').trim(); if(!v){ try{inp.focus();}catch(e){} return; } nicoModalClose(v); }
    card.querySelector('[data-mact="ok"]').addEventListener('click', okAct);
    card.querySelector('[data-mact="cancel"]').addEventListener('click', function(){ nicoModalClose(null); });
    inp.addEventListener('keydown', function(e){
        if(e.key==='Enter'){ e.preventDefault(); okAct(); }
        else if(e.key==='Escape'){ e.preventDefault(); nicoModalClose(null); }
    });
    var pr = nicoModalOpen(card);
    setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 45);
    return pr;
}
function nicoCustomMenu(id){
    var c = nicoFindCustom(id); if(!c) return;
    var card = document.createElement('div'); card.className='nico-pl-modal-card';
    card.innerHTML = '<div class="nico-pl-modal-t">'+muEsc(c.name)+'</div><div class="nico-pl-modal-list">'
        + '<button type="button" data-mact="rename">重命名</button>'
        + '<button type="button" data-mact="del" class="danger">删除歌单（'+c.songs.length+' 首）</button>'
        + '<button type="button" data-mact="cancel">取消</button></div>';
    Array.prototype.forEach.call(card.querySelectorAll('button[data-mact]'), function(b){
        b.addEventListener('click', function(){ nicoModalClose(b.dataset.mact); });
    });
    nicoModalOpen(card).then(function(act){
        if(act==='rename'){
            nicoPrompt({title:'重命名歌单', value:c.name, okText:'保存'}).then(function(nm){
                if(nm){ nicoPLRenameCustom(id, nm); nicoRenderCustoms(); nicoShowToast('已重命名'); }
            });
        } else if(act==='del'){
            nicoPLDeleteCustom(id); nicoRenderCustoms(); nicoShowToast('已删除歌单');
        }
    });
}

/* --- 打开 / 关闭 / 视图切换 --- */
function nicoPlOpen(){
    nicoPlOv.dataset.view = 'center';
    nicoRenderChars();
    nicoRenderCustoms();
    nicoPlOv.classList.add('show');
}
function nicoPlClose(){
    nicoPlOv.classList.remove('show');
    nicoClosePick();
    nicoModalClose(null);
    nicoPlOv.dataset.view = 'center';
}

/* --- 事件绑定 --- */
panel.querySelector('#nico-mu-pl-btn').addEventListener('click', nicoPlOpen);
panel.querySelector('#nico-pl-close').addEventListener('click', nicoPlClose);
panel.querySelector('#nico-pl-d-back').addEventListener('click', function(){ nicoPlOv.dataset.view='center'; });
panel.querySelector('#nico-pl-d-play').addEventListener('click', function(){ nicoPlayTarget(nicoPlDetailTarget, 0); });
panel.querySelector('#nico-pl-import').addEventListener('click', function(){
    nicoPlClose();
    try{ nicoImportPlaylist(); }catch(e){}
});
nicoPlNewBtn.addEventListener('click', function(){
    nicoPrompt({title:'新建歌单', placeholder:'给歌单起个名字', okText:'创建'}).then(function(name){
        if(!name) return;
        nicoPLCreate(name); nicoRenderCustoms(); nicoShowToast('已创建歌单');
    });
});
nicoPlPickX.addEventListener('click', nicoClosePick);
nicoPlPick.addEventListener('click', function(e){ if(e.target===nicoPlPick) nicoClosePick(); });
nicoPlPickSearch.addEventListener('input', function(){ nicoRenderPick(nicoPlPickSearch.value); });
nicoPlCharsEl.addEventListener('click', function(e){
    var row = e.target.closest ? e.target.closest('.nico-pl-row') : null; if(!row) return;
    nicoOpenDetail({type:'char', avatar:row.dataset.avatar});
});
nicoPlCustomsEl.addEventListener('click', function(e){
    var row = e.target.closest ? e.target.closest('.nico-pl-row') : null; if(!row) return;
    if(e.target.closest && e.target.closest('.nico-pl-menu')){ e.stopPropagation(); nicoCustomMenu(row.dataset.id); return; }
    nicoOpenDetail({type:'custom', id:row.dataset.id});
});
nicoPlDetailList.addEventListener('click', function(e){
    var x = e.target.closest ? e.target.closest('.nico-pl-song-x') : null;
    if(x){ e.stopPropagation(); nicoPLRemoveAt(nicoPlDetailTarget, parseInt(x.dataset.x,10)); nicoOpenDetail(nicoPlDetailTarget); return; }
    var row = e.target.closest ? e.target.closest('.nico-pl-song') : null;
    if(row) nicoPlayTarget(nicoPlDetailTarget, parseInt(row.dataset.i,10));
});
nicoPlPickList.addEventListener('click', function(e){
    var nu = e.target.closest ? e.target.closest('[data-pick="new"]') : null;
    if(nu){ nicoPickCreate(); return; }
    var row = e.target.closest ? e.target.closest('.nico-pl-row') : null; if(!row) return;
    var target = row.dataset.pick==='char' ? {type:'char', avatar:row.dataset.avatar} : {type:'custom', id:row.dataset.id};
    if(!nicoPickSong) return;
    if(nicoPLAddTo(target, nicoPickSong)){
        nicoShowToast('已添加到歌单');
        nicoClosePick();
        nicoRenderChars(); nicoRenderCustoms();
    } else nicoShowToast('这首歌已在该歌单中');
});

/* --- 初始化：加载持久化数据；角色切换时（若面板开着）自动刷新 --- */
nicoPLLoad();
(function(){
    var ctx = nicoGetCtx();
    if(!ctx || !ctx.eventSource || !ctx.eventTypes) return;
    function onChanged(){
        if(document.getElementById(PANEL_ID)!==panel) return;
        if(nicoPlOv.classList.contains('show')){ nicoRenderChars(); nicoRenderCustoms(); }
    }
    try{ ctx.eventSource.on(ctx.eventTypes.CHAT_CHANGED, onChanged); }catch(e){}
    try{ ctx.eventSource.on(ctx.eventTypes.APP_READY, onChanged); }catch(e){}
})();

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
    try{ nicoIdCleanup(); }catch(e){}
    try{ muProbeAbortAll(); }catch(e){}
    try{var _p=document.getElementById(PANEL_ID); if(_p)_p.remove();}catch(e){}
    try{var _s=document.getElementById(CSS_ID); if(_s)_s.remove();}catch(e){}
});

/* ===== 4.5.3 网易云听歌识曲指纹库（内嵌 afp.wasm.js + afp.js，源自 NeteaseCloudMusicApi audio_match_demo） ===== */
var nicoNcmAFP=(function(){
var nicoB64={
    decode:function(data){return Uint8Array.from(atob(data),function(c){return c.charCodeAt(0);});},
    encode:function(data){return btoa(String.fromCharCode.apply(null,data));}
};
'use strict'
const WASM_BINARY = "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AAwBCyAAQeSzASkCADcCACAAQQhqIgIgAyAFEB4aIAIgBWpBADoAACAAQZydAigCADYCGEGcnQIgADYCAAsgAEHkswEgACABchshAAsgAAsiADYCACAGIABBAEdqIQYgAUEBaiIBQQZHDQALQYC0ASEBAkACQAJAIAYOAgIAAQsgBCgCCEHkswFHDQBBmLQBIQEMAQtBGBAoIgFFDQAgASAEKQMINwIAIAEgBCkDGDcCECABIAQpAxA3AggLIARBIGokAEHEngIgATYCAEHIngIQLgtBxJ4CKAIAC98KAgV/D34jAEHgAGsiBSQAIARC////////P4MiDUIPhiADQjGIhCEOIAIgBIVCgICAgICAgICAf4MhCiACQv///////z+DIgtCIIghDyANQhGIIRAgBEIwiKdB//8BcSEHAkACQCACQjCIp0H//wFxIglBAWtB/f8BTQRAIAdBAWtB/v8BSQ0BCyABUCACQv///////////wCDIgxCgICAgICAwP//AFQgDEKAgICAgIDA//8AURtFBEAgAkKAgICAgIAghCEKDAILIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIQogAyEBDAILIAEgDEKAgICAgIDA//8AhYRQBEAgAiADhFAEQEKAgICAgIDg//8AIQpCACEBDAMLIApCgICAgICAwP//AIQhCkIAIQEMAgsgAyACQoCAgICAgMD//wCFhFAEQCABIAyEIQJCACEBIAJQBEBCgICAgICA4P//ACEKDAMLIApCgICAgICAwP//AIQhCgwCCyABIAyEUARAQgAhAQwCCyACIAOEUARAQgAhAQwCCyAMQv///////z9YBEAgBUHQAGogASALIAEgCyALUCIGG3kgBkEGdK18pyIGQQ9rEDxBECAGayEGIAUpA1giC0IgiCEPIAUpA1AhAQsgAkL///////8/Vg0AIAVBQGsgAyANIAMgDSANUCIIG3kgCEEGdK18pyIIQQ9rEDwgBiAIa0EQaiEGIAUpA0giAkIPhiAFKQNAIgNCMYiEIQ4gAkIRiCEQCyADQg+GQoCA/v8PgyICIAFCIIgiBH4iEiADQhGIQv////8PgyIMIAFC/////w+DIgF+fCIRQiCGIg0gASACfnwiAyANVK0gAiALQv////8PgyILfiIVIAQgDH58IhMgDkL/////D4MiDSABfnwiFCARIBJUrUIghiARQiCIhHwiESACIA9CgIAEhCIOfiIWIAsgDH58Ig8gBCANfnwiEiAQQv////8Hg0KAgICACIQiAiABfnwiEEIghnwiF3whASAHIAlqIAZqQf//AGshBgJAIAsgDX4iGCAMIA5+fCIMIBhUrSAMIAIgBH58IgQgDFStfCACIA5+fCAEIAQgEyAVVK0gEyAUVq18fCIEVq18IAIgC34iCyANIA5+fCICIAtUrUIghiACQiCIhHwgBCACQiCGfCICIARUrXwgAiACIBAgElStIA8gFlStIA8gElatfHxCIIYgEEIgiIR8IgJWrXwgAiACIBEgFFStIBEgF1atfHwiAlatfCIEQoCAgICAgMAAg1BFBEAgBkEBaiEGDAELIANCP4ghCyAEQgGGIAJCP4iEIQQgAkIBhiABQj+IhCECIANCAYYhAyALIAFCAYaEIQELIAZB//8BTgRAIApCgICAgICAwP//AIQhCkIAIQEMAQsCfiAGQQBMBEBBASAGayIHQYABTwRAQgAhAQwDCyAFQTBqIAMgASAGQf8AaiIGEDwgBUEgaiACIAQgBhA8IAVBEGogAyABIAcQbiAFIAIgBCAHEG4gBSkDMCAFKQM4hEIAUq0gBSkDICAFKQMQhIQhAyAFKQMoIAUpAxiEIQEgBSkDACECIAUpAwgMAQsgBEL///////8/gyAGrUIwhoQLIAqEIQogA1AgAUIAWSABQoCAgICAgICAgH9RG0UEQCAKIAJCAXwiASACVK18IQoMAQsgAyABQoCAgICAgICAgH+FhFBFBEAgAiEBDAELIAogAiACQgGDfCIBIAJUrXwhCgsgACABNwMAIAAgCjcDCCAFQeAAaiQAC40uAQt/IwBBEGsiCyQAAkACQAJAAkACQAJAAkACQAJAAkACQCAAQfQBTQRAQZCtAigCACIGQRAgAEELakF4cSAAQQtJGyIHQQN2IgJ2IgFBA3EEQCABQX9zQQFxIAJqIgNBA3QiAUHArQJqKAIAIgRBCGohAAJAIAQoAggiAiABQbitAmoiAUYEQEGQrQIgBkF+IAN3cTYCAAwBCyACIAE2AgwgASACNgIICyAEIANBA3QiAUEDcjYCBCABIARqIgEgASgCBEEBcjYC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AiAHNgIEIAIgACADQQJ0ajYCDCAEQRBqJAAjAEEQayIAJAAgACACKAIINgIAIAIoAgghAyAAIAJBCGo2AgggACADIAZBAnRqNgIEIAAoAgAhAwNAIAAoAgQgA0cEQCACKAIQGiAAKAIAQQA2AgAgACAAKAIAQQRqIgM2AgAMAQsLIAAoAgggACgCADYCACAAQRBqJABBoKsCKAIAIgYiAEGoqwIoAgAgAGtBAnVBAnRqGiACQQRqIgMiACAAKAIAQaSrAigCACAGayIAayIENgIAIABBAEoEQCAEIAYgABAeGgtBoKsCIAMQoQFBpKsCIAJBCGoQoQFBqKsCIAJBDGoQoQEgAiACKAIENgIAQaSrAigCAEGgqwIoAgAiAGsaQairAigCABogAigCBCEAA0AgACACKAIIRwRAIAIoAhAaIAIgAigCCEEEazYCCAwBCwsgAigCAARAIAIoAhAgAigCACIAIAIoAgwgAGtBAnUQ/AELCyAIQSBqJAAMAQsgACACSQRAQaSrAigCAEGgqwIoAgAiAmsaQaCrAiAAQQJ0IAJqEPoBQaCrAigCACIAQairAigCACAAa0ECdUECdGoaQaSrAigCABoLCwtBoKsCKAIAIAFBAnRqKAIABEBBoKsCKAIAIAFBAnRqKAIAIgAgACgCBEEBayICNgIEIAJBf0YEQCAAIAAoAgAoAggRAQALCyAFKAIIIQAgBUEANgIIQaCrAigCACABQQJ0aiAANgIAIAUoAgghACAFQQA2AgggAARAIAAgACgCBEEBayIBNgIEIAFBf0YEQCAAIAAoAgAoAggRAQALCyAFQRBqJAALNAEBfyMAQRBrIgMkACADIAE2AgwgACADQQxqKAIANgIAIAAgAigCADYCBCADQRBqJAAgAAs2AQF/An8gACgCACIAKAIMIgEgACgCEEYEQCAAIAAoAgAoAiQRAAAMAQsgAS0AAAtBGHRBGHULagEDfyMAQRBrIgEkACABQQA2AgwgASAANgIEIAEgADYCACABIABBAWo2AgggASECIwBBEGsiAyQAIANBCGoiACACKAIENgIAIAAoAgBBAToAACACKAIIQQE6AAAgA0EQaiQAIAFBEGokAAuUAQEEfyMAQRBrIgEkACABQQA2AgwgASAANgIEIAEgADYCACABIABBAWo2AgggASEDIwBBEGsiBCQAIARBCGoiACADKAIENgIAIAAoAgAtAABFBEACfwJAIAMoAggiAi0AACIAQQFHBH8gAEECcQ0BIAJBAjoAAEEBBUEACwwBCwALIQILIARBEGokACABQRBqJAAgAgsNACAAKAIAELYCGiAACw0AIAAoAgAQuwIaIAALZgEBfyACRQRAIAAoAgQgASgCBEYPCyAAIAFGBEBBAQ8LAn8jAEEQayIDIgIgADYCCCACIAIoAggoAgQ2AgwgAigCDAsCfyADIgAgATYCCCAAIAAoAggoAgQ2AgwgACgCDAsQhwFFCwkAIAAgARC3AgsJACAAIAEQvAILrAEBAX8CQCAAAn8gACgCvC0iAUEQRgRAIAAgACgCFCIBQQFqNgIUIAEgACgCCGogAC0AuC06AAAgACAAKAIUIgFBAWo2AhQgASAAKAIIaiAAQbktai0AADoAACAAQQA7AbgtQQAMAQsgAUEISA0BIAAgACgCFCIBQQFqNgIUIAEgACgCCGogAC0AuC06AAAgACAAQbktai0AADsBuC0gACgCvC1BCGsLNgK8LQsLkwIBA38gAC0AAEEgcUUEQAJAIAEhAwJAIAIgACIBKAIQIgAEfyAABQJ/IAEgAS0ASiIAQQFrIAByOgBKIAEoAgAiAEEIcQRAIAEgAEEgcjYCAEF/DAELIAFCADcCBCABIAEoAiwiADYCHCABIAA2AhQgASAAIAEoAjBqNgIQQQALDQEgASgCEAsgASgCFCIFa0sEQCABIAMgAiABKAIkEQQAGgwCCwJAIAEsAEtBAEgNACACIQADQCAAIgRFDQEgAyAEQQFrIgBqLQAAQQpHDQALIAEgAyAEIAEoAiQRBAAgBEkNASADIARqIQMgAiAEayECIAEoAhQhBQsgBSADIAIQHhogASABKAIUIAJqNgIUCwsLCwUAEAcAC3UBAX4gACABIAR+IAIgA358IANCIIgiAiABQiCIIgR+fCADQv////8PgyIDIAFC/////w+DIgF+IgVCIIggAyAEfnwiA0IgiHwgASACfiADQv////8Pg3wiAUIgiHw3AwggACAFQv////8PgyABQiCGhDcDAAtYAQF/IwBBEGsiAiQAIAAtAAtBB3YEQCAAKAIIGiAAKAIAEBsLIAAgASgCCDYCCCAAIAEpAgA3AgAgAUEAOgALIAJBADoADyABIAItAA86AAAgAkEQaiQAC2kBAX8jAEEQayIFJAAgBSACNgIMIAUgBDYCCCAFIAVBDGoQUCECIAAgASADIAUoAggQoAEhASACKAIAIgAEQEHUnAIoAgAaIAAEQEHUnAJBkJsCIAAgAEF/Rhs2AgALCyAFQRBqJAAgAQvkAQECfwJAAn8gAC0AC0EHdgRAIAAoAgQMAQsgAC0ACwtFDQAgAiABa0EFSA0AIAEgAhCYASACQQRrIQQCfyAALQALQQd2BEAgACgCBAwBCyAALQALCwJ/IAAtAAtBB3YEQCAAKAIADAELIAALIgJqIQUCQANAAkAgAiwAACEAIAEgBE8NAAJAIABBAEwNACAAQf8ATg0AIAEoAgAgAiwAAEcNAwsgAUEEaiEBIAIgBSACa0EBSmohAgwBCwsgAEEATA0BIABB/wBODQEgAiwAACAEKAIAQQFrSw0BCyADQQQ2AgALC1ABAX4CQCADQcAAcQRAIAEgA0FAaq2GIQJCACEBDAELIANFDQAgAiADrSIEhiABQcAAIANrrYiEIQIgASAEhiEBCyAAIAE3AwAgACACNwMICwwAIAAgARC3AkEBcwsMACAAIAEQvAJBAXMLbwEBfyMAQYACayIFJAACQCAEQYDABHENACACIANMDQAgBSABQf8BcSACIANrIgJBgAIgAkGAAkkiARsQIRogAUUEQANAIAAgBUGAAhA2IAJBgAJrIgJB/wFLDQALCyAAIAUgAhA2CyAFQYACaiQACwoAIABB6J4CEGcLCABB2gsQXAALiwIBBn8CQCAAKAIEIgBFDQAgASgCACABIAEtAAsiAkEYdEEYdUEASCIDGyEGIAEoAgQgAiADGyEBA0ACQAJAAkACQAJAAkAgACgCFCAALQAbIgIgAkEYdEEYdUEASCIEGyICIAEgASACSyIHGyIDBEAgBiAAQRBqIgUoAgAgBSAEGyIEIAMQJSIFRQRAIAEgAkkNAgwDCyAFQQBODQIMAQsgASACTw0CCyAAKAIAIgANBQwGCyAEIAYgAxAlIgINAQsgBw0BDAILIAJBAE4NAQsgACgCBCIADQEMAgsLIABFDQAgAEEcag8LQQgQBiIAIgFBpxMQ5gEgAUGAigI2AgAgAEGgigJBEhAFAAsKACAAQfCeAhBnC9EJAgR/BH4jAEHwAGsiBSQAIARC////////////AIMhCgJAAkAgAUIBfSILQn9RIAJC////////////AIMiCSABIAtWrXxCAX0iC0L///////+///8AViALQv///////7///wBRG0UEQCADQgF9IgtCf1IgCiADIAtWrXxCAX0iC0L///////+///8AVCALQv///////7///wBRGw0BCyABUCAJQoCAgICAgMD//wBUIAlCgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhBCABIQMMAgsgA1AgCkKAgICAgIDA//8AVCAKQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIQQMAgsgASAJQoCAgICAgMD//wCFhFAEQEKAgICAgIDg//8AIAIgASADhSACIASFQoCAgICAgICAgH+FhFAiBhshBEIAIAEgBhshAwwCCyADIApCgICAgICAwP//AIWEUA0BIAEgCYRQBEAgAyAKhEIAUg0CIAEgA4MhAyACIASDIQQMAgsgAyAKhFBFDQAgASEDIAIhBAwBCyADIAEgASADVCAJIApUIAkgClEbIgcbIQogBCACIAcbIgtC////////P4MhCSACIAQgBxsiAkIwiKdB//8BcSEIIAtCMIinQf//AXEiBkUEQCAFQeAAaiAKIAkgCiAJIAlQIgYbeSAGQQZ0rXynIgZBD2sQPCAFKQNoIQkgBSkDYCEKQRAgBmshBgsgASADIAcbIQMgAkL///////8/gyEEIAhFBEAgBUHQAGogAyAEIAMgBCAEUCIHG3kgB0EGdK18pyIHQQ9rEDxBECAHayEIIAUpA1ghBCAFKQNQIQMLIARCA4YgA0I9iIRCgICAgICAgASEIQQgCUIDhiAKQj2IhCEJIAIgC4UhDAJ+IANCA4YiASAGIAhrIgdFDQAaIAdB/wBLBEBCACEEQgEMAQsgBUFAayABIARBgAEgB2sQPCAFQTBqIAEgBCAHEG4gBSkDOCEEIAUpAzAgBSkDQCAFKQNIhEIAUq2ECyECIAlCgICAgICAgASEIQkgCkIDhiEDAkAgDEIAUwRAIAMgAn0iASAJIAR9IAIgA1atfSIEhFAEQEIAIQNCACEEDAMLIARC/////////wNWDQEgBUEgaiABIAQgASAEIARQIgcbeSAHQQZ0rXynQQxrIgcQPCAGIAdrIQYgBSkDKCEEIAUpAyAhAQwBCyACIAN8IgEgAlStIAQgCXx8IgRC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AjQRBAAgAUEKbGohAQwBCwtBAiEFIAAgB0EIahAzRQ0BCyACIAIoAgAgBXI2AgALIAdBEGokACABC4sCAQR/IwBBEGsiBSQAIAUgATYCCEEAIQFBBiEGAkACQCAAIAVBCGoQNA0AQQQhBiAAEC0iByIIQQBOBH8gAygCCCAIQf8BcUEBdGovAQBBgBBxQQBHBUEAC0UNACADIAdBACADKAIAKAIkEQQAIQEDQAJAIAAQMRogAUEwayEBIAAgBUEIahA+RQ0AIARBAkgNACAAEC0iBiIHQQBOBH8gAygCCCAHQf8BcUEBdGovAQBBgBBxQQBHBUEAC0UNAyAEQQFrIQQgAyAGQQAgAygCACgCJBEEACABQQpsaiEBDAELC0ECIQYgACAFQQhqEDRFDQELIAIgAigCACAGcjYCAAsgBUEQaiQAIAELvAEBA38jAEEQayIFJAAgBSABNgIMIAUgAzYCCCAFIAVBDGoQUCEGIAUoAgghBCMAQRBrIgMkACADIAQ2AgwgAyAENgIIQX8hAQJAQQBBACACIAQQoAEiBEEASA0AIAAgBEEBaiIEECgiADYCACAARQ0AIAAgBCACIAMoAgwQoAEhAQsgA0EQaiQAIAYoAgAiAARAQdScAigCABogAARAQdScAkGQmwIgACAAQX9GGzYCAAsLIAVBEGokACABCy4AAkAgACgCBEHKAHEiAARAIABBwABGBEBBCA8LIABBCEcNAUEQDwtBAA8LQQoL+QECA34CfyMAQRBrIgUkAAJ+IAG9IgNC////////////AIMiAkKAgICAgICACH1C/////////+//AFgEQCACQjyGIQQgAkIEiEKAgICAgICAgDx8DAELIAJCgICAgICAgPj/AFoEQCADQjyGIQQgA0IEiEKAgICAgIDA//8AhAwBCyACUARAQgAMAQsgBSACQgAgA6dnQSBqIAJCIIinZyACQoCAgIAQVBsiBkExahA8IAUpAwAhBCAFKQMIQoCAgICAgMAAhUGM+AAgBmutQjCGhAshAiAAIAQ3AwAgACACIANCgICAgICAgICAf4OENwMIIAVBEGokAAsEACAAC5QFAQN/IwBBIGsiCCQAIAggAjYCECAIIAE2AhggCEEIaiIBIAMoAhwiAjYCACACIAIoAgRBAWo2AgQgARBAIQkgASgCACIBIAEoAgRBAWsi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ACgCACICIQAgARAqIgMhASABIAAoAgwgACgCCGtBAnVJBH8gACgCCCABQQJ0aigCAEEARwVBAAtFBEAQNwALIAIoAgggA0ECdGooAgAL1QIBAn8CQCAAIAFGDQAgASAAIAJqIgRrQQAgAkEBdGtNBEAgACABIAIQHhoPCyAAIAFzQQNxIQMCQAJAIAAgAUkEQCADDQIgAEEDcUUNAQNAIAJFDQQgACABLQAAOgAAIAFBAWohASACQQFrIQIgAEEBaiIAQQNxDQALDAELAkAgAw0AIARBA3EEQANAIAJFDQUgACACQQFrIgJqIgMgASACai0AADoAACADQQNxDQALCyACQQNNDQADQCAAIAJBBGsiAmogASACaigCADYCACACQQNLDQALCyACRQ0CA0AgACACQQFrIgJqIAEgAmotAAA6AAAgAg0ACwwCCyACQQNNDQADQCAAIAEoAgA2AgAgAUEEaiEBIABBBGohACACQQRrIgJBA0sNAAsLIAJFDQADQCAAIAEtAAA6AAAgAEEBaiEAIAFBAWohASACQQFrIgINAAsLC1IBAn9BnJICKAIAIgEgAEEDakF8cSICaiEAAkAgAkEAIAAgAU0bDQAgAD8AQRB0SwRAIAAQEkUNAQtBnJICIAA2AgAgAQ8LQaibAkEwNgIAQX8LCAAgABDHARoLLAACQCAAIAFGDQADQCAAIAFBAWsiAU8NASAAIAEQowIgAEEBaiEADAALAAsLswEBBX8jAEEQayIFJAAgARB0IQIjAEEQayIEJAACQCACQW9NBEACQCACQQpNBEAgACACOgALIAAhAwwBCyAAIAJBC08EfyACQRBqQXBxIgMgA0EBayIDIANBC0YbBUEKC0EBaiIGEB0iAzYCACAAIAZBgICAgHhyNgIIIAAgAjYCBAsgAyABIAIQTiAEQQA6AA8gAiADaiAELQAPOgAAIARBEGokAAwBCxBFAAsgBUEQaiQAC9sBAgF/An5BASEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AIAAgAoQgBSAGhIRQBEBBAA8LIAEgA4NCAFkEQEF/IQQgACACVCABIANTIAEgA1Eb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ADcCACACIAUoAgg2AgggAiAFKQMANwIAQQEMAgsgBSAAKAIINgIIIAUgACkCADcDACAAIAEoAgg2AgggACABKQIANwIAIAEgBSgCCDYCCCABIAUpAwA3AgBBASACIAEgBCgCABECAEUNARogBSABKAIINgIIIAUgASkCADcDACABIAIoAgg2AgggASACKQIANwIAIAIgBSgCCDYCCCACIAUpAwA3AgALQQILIQYCQCADIAIgBCgCABECAEUNACAFIAIoAgg2AgggBSACKQIANwMAIAIgAygCCDYCCCACIAMpAgA3AgAgAyAFKAIINgIIIAMgBSkDADcCACACIAEgBCgCABECAEUEQCAGQQFqIQYMAQsgBSABKAIINgIIIAUgASkCADcDACABIAIoAgg2AgggASACKQIANwIAIAIgBSgCCDYCCCACIAUpAwA3AgAgASAAIAQoAgARAgBFBEAgBkECaiEGDAELIAUgACgCCDYCCCAFIAApAgA3AwAgACABKAIINgIIIAAgASkCADcCACABIAUoAgg2AgggASAFKQMANwIAIAZBA2ohBgsgBUEQaiQAIAYL7QMCA30CfyACKgIEIQUCQCABKgIEIgQgACoCBCIGXkUEQCAEIAVdRQRAIAUhBAwCCyABKAIAIQcgASACKAIANgIAIAIgBzYCACABIAU4AgQgAiAEOAIEQQEhByABKgIEIgUgACoCBCIGXkUNASAAKAIAIQcgACABKAIANgIAIAEgBzYCACAAIAU4AgQgASAGOAIEIAIqAgQhBEECIQcMAQsCfyAEIAVdBEAgACgCACEHIAAgAigCADYCACACIAc2AgAgACAFOAIEIAIgBjgCBEEBDAELIAAoAgAhCCAAIAEoAgA2AgAgASAINgIAIAAgBDgCBCABIAY4AgRBASEHIAIqAgQiBCAGXkUNASABIAIoAgA2AgAgAiAINgIAIAEgBDgCBCACIAY4AgRBAgshByAGIQQLIAQgAyoCBCIFXQR/IAIoAgAhCCACIAMoAgA2AgAgAyAINgIAIAIgBTgCBCADIAQ4AgQgAioCBCIEIAEqAgQiBV5FBEAgB0EBag8LIAEoAgAhAyABIAIoAgA2AgAgAiADNgIAIAEgBDgCBCACIAU4AgQgASoCBCIEIAAqAgQiBV5FBEAgB0ECag8LIAAoAgAhAiAAIAEoAgA2AgAgASACNgIAIAAgBDgCBCABIAU4AgQgB0EDagUgBwsLggEBAn8jAEEQayIDJAAgA0EIaiIEIAEoAhwiATYCACABIAEoAgRBAWo2AgQgAiAEEHoiASICIAIoAgAoAhARAAA2AgAgACABIAEoAgAoAhQRAwAgBCgCACIAIAAoAgRBAWsiATYCBCABQX9GBEAgACAAKAIAKAIIEQEACyADQRBqJAALeQECfyMAQRBrIgMkACADQQhqIgIgACgCHCIANgIAIAAgACgCBEEBajYCBCACEEAiAEHg0wFB+tMBIAEgACgCACgCMBEHABogAigCACIAIAAoAgRBAWsiAjYCBCACQX9GBEAgACAAKAIAKAIIEQEACyADQRBqJAAgAQuCAQECfyMAQRBrIgMkACADQQhqIgQgASgCHCIBNgIAIAEgASgCBEEBajYCBCACIAQQfCIBIgIgAigCACgCEBEAADoAACAAIAEgASgCACgCFBEDACAEKAIAIgAgACgCBEEBayIBNgIEIAFBf0YEQCAAIAAoAgAoAggRAQALIANBEGokAAtNAQJ/IAEtAAAhAgJAIAAtAAAiA0UNACACIANHDQADQCABLQABIQIgAC0AASIDRQ0BIAFBAWohASAAQQFqIQAgAiADRg0ACwsgAyACawuZAQEDfCAAIACiIgMgAyADoqIgA0R81c9aOtnlPaJE65wriublWr6goiADIANEff6xV+Mdxz6iRNVhwRmgASq/oKJEpvgQERERgT+goCEFIAMgAKIhBCACRQRAIAQgAyAFokRJVVVVVVXFv6CiIACgDwsgACADIAFEAAAAAAAA4D+iIAQgBaKhoiABoSAERElVVVVVVcU/oqChC5IBAQN8RAAAAAAAAPA/IAAgAKIiAkQAAAAAAADgP6IiA6EiBEQAAAAAAADwPyAEoSADoSACIAIgAiACRJAVyxmgAfo+okR3UcEWbMFWv6CiRExVVVVVVaU/oKIgAiACoiIDIAOiIAIgAkTUOIi+6fqovaJExLG0vZ7uIT6gokStUpyAT36SvqCioKIgACABoqGgoAu8AwECfwJAAn8gACgCvC0iBEEOTgRAIAAgAC8BuC0gAyAEdHIiBDsBuC0gACAAKAIUIgVBAWo2AhQgBSAAKAIIaiAEOgAAIAAgACgCFCIEQQFqNgIUIAQgACgCCGogAEG5LWot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BEAgAigCAAwBCyACCyEEIAUgBjkDACACAn8gBCADQQFqQawRIAUQxQEiBEEATgRAIAMgBE8NAiAEDAELIANBAXRBAXILIgMQHwwBCwsgAiAEEB8gACACKQIANwIAIAAgAigCCDYCCCACEMQBIAVBEGokACACEBwaIAJBEGokAAvBAQEDfyMAQRBrIgMkACADIAE6AA8CQAJAAkACQCAALQALQQd2BEAgACgCBCIEIAAoAghB/////wdxQQFrIgJGDQEMAwtBCiEEQQohAiAALQALIgFBCkcNAQsgACACQQEgAiACEKwBIAQhASAALQALQQd2DQELIAAiAiABQQFqOgALDAELIAAoAgAhAiAAIARBAWo2AgQgBCEBCyABIAJqIgAgAy0ADzoAACADQQA6AA4gACADLQAOOgABIANBEGokAAvEAgEFfyMAQRBrIggkACACIAFBf3NBEWtNBEACfyAALQALQQd2BEAgACgCAAwBCyAACyEJAn8gAUHn////B0kEQCAIIAFBAXQ2AgggCCABIAJqNgIMIwBBEGsiAiQAIAhBDGoiCigCACAIQQhqIgsoAgBJIQwgAkEQaiQAIAsgCiAMGygCACICQQtPBH8gAkEQakFwcSICIAJBAWsiAiACQQtGGwVBCgsMAQtBbgtBAWoiChAdIQIgBARAIAIgCSAEEE4LIAYEQCACIARqIAcgBhBOCyADIAQgBWprIgMEQCACIARqIAZqIAQgCWogBWogAxBOCyABQQpHBEAgCRAbCyAAIAI2AgAgACAKQYCAgIB4cjYCCCAAIAQgBmogA2oiADYCBCAIQQA6AAcgACACaiAILQAHOgAAIAhBEGokAA8LEEUACz8BAX8gACABQeQAbiICQQF0QfCGAmovAQA7AAAgAEECaiIAIAEgAkHkAGxrQQF0QfCGAmovAQA7AAAgAEECagsDAAELGgAgAEH4gAI2AgAgAEEgahAcGiAAEHUaIAAL8hcBB38jAEEQayIDJAADQCABQQxrIQcDQAJAAkACQAJAAkACQCABIABrIgVBDG0OBgUFAAECAwQLIAFBDGsiASAAIAIoAgARAgBFDQQgAyAAKAIINgIIIAMgACkCADcDACAAIAEoAgg2AgggACABKQIANwIAIAEgAygCCDYCCCABIAMpAwA3AgAMBAsgAEEMaiIHIAAgAigCABECACEGIAFBDGsiBSAHIAIoAgARAgAhASAGRQRAIAFFDQQgAyAHKAIINgIIIAMgBykCADcDACAHIAUoAgg2AgggByAFKQIANwIAIAUgAygCCDYCCCAFIAMpAwA3AgAgByAAIAIoAgARAgBFDQQgAyAAKAIINgIIIAMgACkCADcDACAAIAcoAgg2AgggACAHKQIANwIAIAcgAygCCDYCCCAHIAMpAwA3AgAMBAsgAQRAIAMgACgCCDYCCCADIAApAgA3AwAgACAFKAIINgIIIAAgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIADAQLIAMgACgCCDYCCCADIAApAgA3AwAgACAHKAIINgIIIAAgBykCADcCACAHIAMoAgg2AgggByADKQMANwIAIAUgByACKAIAEQIARQ0DIAMgBygCCDYCCCADIAcpAgA3AwAgByAFKAIINgIIIAcgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIADAMLIAAgAEEMaiAAQRhqIAFBDGsgAhCCARoMAgsgACAAQQxqIgcgAEEYaiIFIABBJGoiBiACEIIBGiABQQxrIgEgBiACKAIAEQIARQ0BIAMgBigCCDYCCCADIAYpAgA3AwAgBiABKAIINgIIIAYgASkCADcCACABIAMoAgg2AgggASADKQMANwIAIAYgBSACKAIAEQIARQ0BIAMgBSgCCDYCCCADIAUpAgA3AwAgBSAGKAIINgIIIAUgBikCADcCACAGIAMoAgg2AgggBiADKQMANwIAIAUgByACKAIAEQIARQ0BIAMgBygCCDYCCCADIAcpAgA3AwAgByAFKAIINgIIIAcgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIAIAcgACACKAIAEQIARQ0BIAMgACgCCDYCCCADIAApAgA3AwAgACAHKAIINgIIIAAgBykCADcCACAHIAMoAgg2AgggByADKQMANwIADAELIAVB8wJMBEAgASEHIwBBEGsiCCQAIAAiBkEMaiIEIAAgAiIJKAIAEQIAIQAgBkEYaiIFIAQgAigCABECACEBAkAgAEUEQCABRQ0BIAggBCgCCDYCCCAIIAQpAgA3AwAgBCAFKAIINgIIIAQgBSkCADcCACAFIAgoAgg2AgggBSAIKQMANwIAIAQgBiAJKAIAEQIARQ0BIAggBigCCDYCCCAIIAYpAgA3AwAgBiAEKAIINgIIIAYgBCkCADcCACAEIAgoAgg2AgggBCAIKQMANwIADAELIAEEQCAIIAYoAgg2AgggCCAGKQIANwMAIAYgBSgCCDYCCCAGIAUpAgA3AgAgBSAIKAIINgIIIAUgCCkDADcCAAwBCyAIIAYoAgg2AgggCCAGKQIANwMAIAYgBCgCCDYCCCAGIAQpAgA3AgAgBCAIKAIINgIIIAQgCCkDADcCACAFIAQgCSgCABECAEUNACAIIAQoAgg2AgggCCAEKQIANwMAIAQgBSgCCDYCCCAEIAUpAgA3AgAgBSAIKAIINgIIIAUgCCkDADcCAAsgByAGQSRqIgBHBEADQCAAIgEgBSAJKAIAEQIABEAgCCABKAIINgIIIAggASkCADcDACABIQIDQAJAIAIgBSIAKQIANwIAIAIgACgCCDYCCCAAIAZGBEAgBiEADAELIAAhAiAIIABBDGsiBSAJKAIAEQIADQELCyAAIAgpAwA3AgAgACAIKAIINgIICyABIgVBDGoiACAHRw0ACwsgCEEQaiQADAELAkAgBUHV3QBPBEAgACAAIAVBMG5BDGwiBmoiCSAAIAVBGG5BDGxqIgQgBCAGaiIGIAIQggEhCCAHIAYgAigCABECAEUNASADIAYoAgg2AgggAyAGKQIANwMAIAYgBygCCDYCCCAGIAcpAgA3AgAgByADKAIINgIIIAcgAykDADcCACAGIAQgAigCABECAEUEQCAIQQFqIQgMAgsgAyAEKAIINgIIIAMgBCkCADcDACAEIAYoAgg2AgggBCAGKQIANwIAIAYgAygCCDYCCCAGIAMpAwA3AgAgBCAJIAIoAgARAgBFBEAgCEECaiEIDAILIAMgCSgCCDYCCCADIAkpAgA3AwAgCSAEKAIINgIIIAkgBCkCADcCACAEIAMoAgg2AgggBCADKQMANwIAIAkgACACKAIAEQIARQRAIAhBA2ohCAwCCyADIAAoAgg2AgggAyAAKQIANwMAIAAgCSgCCDYCCCAAIAkpAgA3AgAgCSADKAIINgIIIAkgAykDADcCACAIQQRqIQgMAQsgACAFQf//A3FBGG5BDGxqIgQgACACKAIAEQIAIQYgByAEIAIoAgARAgAhBQJAIAZFBEBBACEIIAVFDQIgAyAEKAIINgIIIAMgBCkCADcDACAEIAcoAgg2AgggBCAHKQIANwIAIAcgAygCCDYCCCAHIAMpAwA3AgBBASEIIAQgACACKAIAEQIARQ0CIAMgACgCCDYCCCADIAApAgA3AwAgACAEKAIINgIIIAAgBCkCADcCACAEIAMoAgg2AgggBCADKQMANwIADAELIAUEQCADIAAoAgg2AgggAyAAKQIANwMAIAAgBygCCDYCCCAAIAcpAgA3AgAgByADKAIINgIIIAcgAykDADcCAEEBIQgMAgsgAyAAKAIINgIIIAMgACkCADcDACAAIAQoAgg2AgggACAEKQIANwIAIAQgAygCCDYCCCAEIAMpAwA3AgBBASEIIAcgBCACKAIAEQIARQ0BIAMgBCgCCDYCCCADIAQpAgA3AwAgBCAHKAIINgIIIAQgBykCADcCACAHIAMoAgg2AgggByADKQMANwIAC0ECIQgLIAchBQJ/AkAgACAEIAIoAgARAgBFBEADQCAFQQxrIgUgAEYEQCAAQQxqIQQgACAHIAIoAgARAgANAyAEIAdGDQUDQCAAIAQgAigCABECAARAIAMgBCgCCDYCCCADIAQpAgA3AwAgBCAHKAIINgIIIAQgBykCADcCACAHIAMoAgg2AgggByADKQMANwIAIARBDGohBAwFCyAHIARBDGoiBEcNAAsMBQsgBSAEIAIoAgARAgBFDQALIAMgACgCCDYCCCADIAApAgA3AwAgACAFKAIINgIIIAAgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIAIAhBAWohCAsgBSAAQQxqIgZLBEADfyAGIglBDGohBiAJIAQgAigCABECAA0AA0AgBUEMayIFIAQgAigCABECAEUNAAsgBSAJSQR/IAkFIAMgCSgCCDYCCCADIAkpAgA3AwAgCSAFKAIINgIIIAkgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIAIAUgBCAEIAlGGyEEIAhBAWohCAwBCwshBgsCQCAEIAZGDQAgBCAGIAIoAgARAgBFDQAgAyAGKAIINgIIIAMgBikCADcDACAGIAQoAgg2AgggBiAEKQIANwIAIAQgAygCCDYCCCAEIAMpAwA3AgAgCEEBaiEICyAIRQRAIAAgBiACEPUBIQkgBkEMaiIFIAEgAhD1AQRAIAYhASAJRQ0GDAQLQQIgCQ0CGgsgBiAAa0EMbSABIAZrQQxtSARAIAAgBiACEJQBIAZBDGohAAwECyAGQQxqIAEgAhCUASAGIQEMBAsgByIGIARGDQEDfyAEIgVBDGohBCAAIAUgAigCABECAEUNAANAIAAgBkEMayIGIAIoAgARAgANAAsgBSAGTwR/QQQFIAMgBSgCCDYCCCADIAUpAgA3AwAgBSAGKAIINgIIIAUgBikCADcCACAGIAMoAgg2AgggBiADKQMANwIADAELCwshBiAFIQAgBkEERg0BIAZBAkYNAQsLCyADQRBqJAALWwEBfyMAQRBrIgMkACADIAA2AgggAygCCCEAIANBEGokACAAIQMjAEEQayIAJAAgACABNgIIIAAoAgghASAAQRBqJAAgASADayIABEAgAiADIAAQaAsgACACagsIAEH/////BwsFAEH/AAssAAJAIAAgAUYNAANAIAAgAUEEayIBTw0BIAAgARChASAAQQRqIQAMAAsACwvqBAEIfyMAQRBrIgckACAGEEAhCiAHIAYQeiIGIgggCCgCACgCFBEDAAJAAn8gBy0AC0EHdgRAIAcoAgQMAQsgBy0ACwtFBEAgCiAAIAIgAyAKKAIAKAIwEQcAGiAFIAMgAiAAa0ECdGoiBjYCAAwBCyAFIAM2AgACQAJAIAAiCC0AACIJQStrDgMAAQABCyAKIAlBGHRBGHUgCigCACgCLBECACEIIAUgBSgCACIJQQRqNgIAIAkgCDYCACAAQQFqIQgLAkAgAiAIa0ECSA0AIAgtAABBMEcNACAILQABQSByQfgARw0AIApBMCAKKAIAKAIsEQIAIQkgBSAFKAIAIgtBBGo2AgAgCyAJNgIAIAogCCwAASAKKAIAKAIsEQIAIQkgBSAFKAIAIgtBBGo2AgAgCyAJNgIAIAhBAmohCAsgCCACEGtBACELIAYgBigCACgCEBEAACEMQQAhCSAIIQYDfyACIAZNBH8gAyAIIABrQQJ0aiAFKAIAEJgBIAUoAgAFAkACfyAHLQALQQd2BEAgBygCAAwBCyAHCyAJai0AAEUNACALAn8gBy0AC0EHdgRAIAcoAgAMAQsgBwsgCWosAABHDQAgBSAFKAIAIgtBBGo2AgAgCyAMNgIAIAkgCQJ/IActAAtBB3YEQCAHKAIEDAELIActAAsLQQFrSWohCUEAIQsLIAogBiwAACAKKAIAKAIsEQIAIQ0gBSAFKAIAIg5BBGo2AgAgDiANNgIAIAZBAWohBiALQQFqIQsMAQsLIQYLIAQgBiADIAEgAGtBAnRqIAEgAkYbNgIAIAcQHBogB0EQaiQAC9ABAQJ/IAJBgBBxBEAgAEErOgAAIABBAWohAAsgAkGACHEEQCAAQSM6AAAgAEEBaiEACyACQYQCcSIDQYQCRwRAIABBrtQAOwAAIABBAmohAAsgAkGAgAFxIQIDQCABLQAAIgQEQCAAIAQ6AAAgAEEBaiEAIAFBAWohAQwBCwsgAAJ/AkAgA0GAAkcEQCADQQRHDQFBxgBB5gAgAhsMAgtBxQBB5QAgAhsMAQtBwQBB4QAgAhsgA0GEAkYNABpBxwBB5wAgAhsLOgAAIANBhAJHC+AEAQh/IwBBEGsiByQAIAYQQyEKIAcgBhB8IgYiCCAIKAIAKAIUEQMAAkACfyAHLQALQQd2BEAgBygCBAwBCyAHLQALC0UEQCAKIAAgAiADIAooAgAoAiARBwAaIAUgAyACIABraiIGNgIADAELIAUgAzYCAAJAAkAgACIILQAAIglBK2sOAwABAAELIAogCUEYdEEYdSAKKAIAKAIcEQIAIQggBSAFKAIAIglBAWo2AgAgCSAIOgAAIABBAWohCAsCQCACIAhrQQJIDQAgCC0AAEEwRw0AIAgtAAFBIHJB+ABHDQAgCkEwIAooAgAoAhwRAgAhCSAFIAUoAgAiC0EBajYCACALIAk6AAAgCiAILAABIAooAgAoAhwRAgAhCSAFIAUoAgAiC0EBajYCACALIAk6AAAgCEECaiEICyAIIAIQa0EAIQsgBiAGKAIAKAIQEQAAIQxBACEJIAghBgN/IAIgBk0EfyADIAggAGtqIAUoAgAQayAFKAIABQJAAn8gBy0AC0EHdgRAIAcoAgAMAQsgBwsgCWotAABFDQAgCwJ/IActAAtBB3YEQCAHKAIADAELIAcLIAlqLAAARw0AIAUgBSgCACILQQFqNgIAIAsgDDoAACAJIAkCfyAHLQALQQd2BEAgBygCBAwBCyAHLQALC0EBa0lqIQlBACELCyAKIAYsAAAgCigCACgCHBECACENIAUgBSgCACIOQQFqNgIAIA4gDToAACAGQQFqIQYgC0EBaiELDAELCyEGCyAEIAYgAyABIABraiABIAJGGzYCACAHEBwaIAdBEGokAAvsBQELfyMAQYABayIJJAAgCSABNgJ4IAlBNzYCECAJQQhqQQAgCUEQaiIIECwhDAJAIAMgAmtBDG0iCkHlAE8EQCAKECgiCEUNASAMKAIAIQEgDCAINgIAIAEEQCABIAwoAgQRAQALCyAIIQcgAiEBA0AgASADRgRAA0ACQCAAIAlB+ABqED1BACAKG0UEQCAAIAlB+ABqEDMEQCAFIAUoAgBBAnI2AgALDAELAn8gACgCACIHKAIMIgEgBygCEEYEQCAHIAcoAgAoAiQRAAAMAQsgASgCAAshDSAGRQRAIAQgDSAEKAIAKAIcEQIAIQ0LIA5BAWohD0EAIRAgCCEHIAIhAQNAIAEgA0YEQCAPIQ4gEEUNAyAAEDAaIAghByACIQEgCiALakECSQ0DA0AgASADRgRADAUFAkAgBy0AAEECRw0AAn8gAS0AC0EHdgRAIAEoAgQMAQsgAS0ACwsgDkYNACAHQQA6AAAgC0EBayELCyAHQQFqIQcgAUEMaiEBDAELAAsABQJAIActAABBAUcNAAJ/IAEtAAtBB3YEQCABKAIADAELIAELIA5BAnRqKAIAIRECQCAGBH8gEQUgBCARIAQoAgAoAhwRAgALIA1GBEBBASEQAn8gAS0AC0EHdgRAIAEoAgQMAQsgAS0ACwsgD0cNAiAHQQI6AAAgC0EBaiELDAELIAdBADoAAAsgCkEBayEKCyAHQQFqIQcgAUEMaiEBDAELAAsACwsCQAJAA0AgAiADRg0BIAgtAABBAkcEQCAIQQFqIQggAkEMaiECDAELCyACIQMMAQsgBSAFKAIAQQRyNgIACyAMIgAoAgAhASAAQQA2AgAgAQRAIAEgACgCBBEBAAsgCUGAAWokACADDwUCQAJ/IAEtAAtBB3YEQCABKAIEDAELIAEtAAsLBEAgB0EBOgAADAELIAdBAjoAACALQQFqIQsgCkEBayEKCyAHQQFqIQcgAUEMaiEBDAELAAsACxA3AAtDACABBEAgACABKAIAEJ0BIAAgASgCBBCdASABLAAnQQBIBEAgASgCHBAbCyABLAAbQQBIBEAgASgCEBAbCyABEBsLC8kFAQt/IwBBgAFrIgkkACAJIAE2AnggCUE3NgIQIAlBCGpBACAJQRBqIggQLCEMAkAgAyACa0EMbSIKQeUATwRAIAoQKCIIRQ0BIAwoAgAhASAMIAg2AgAgAQRAIAEgDCgCBBEBAAsLIAghByACIQEDQCABIANGBEADQAJAIAAgCUH4AGoQPkEAIAobRQRAIAAgCUH4AGoQNARAIAUgBSgCAEECcjYCAAsMAQsgABAtIQ0gBkUEQCAEIA0gBCgCACgCDBECACENCyAOQQFqIQ9BACEQIAghByACIQEDQCABIANGBEAgDyEOIBBFDQMgABAxGiAIIQcgAiEBIAogC2pBAkkNAwNAIAEgA0YEQAwFBQJAIActAABBAkcNAAJ/IAEtAAtBB3YEQCABKAIEDAELIAEtAAsLIA5GDQAgB0EAOgAAIAtBAWshCwsgB0EBaiEHIAFBDGohAQwBCwALAAUCQCAHLQAAQQFHDQACfyABLQALQQd2BEAgASgCAAwBCyABCyAOaiwAACERAkAgDUH/AXEgBgR/IBEFIAQgESAEKAIAKAIMEQIAC0H/AXFGBEBBASEQAn8gAS0AC0EHdgRAIAEoAgQMAQsgAS0ACwsgD0cNAiAHQQI6AAAgC0EBaiELDAELIAdBADoAAAsgCkEBayEKCyAHQQFqIQcgAUEMaiEBDAELAAsACwsCQAJAA0AgAiADRg0BIAgtAABBAkcEQCAIQQFqIQggAkEMaiECDAELCyACIQMMAQsgBSAFKAIAQQRyNgIACyAMIgAoAgAhASAAQQA2AgAgAQRAIAEgACgCBBEBAAsgCUGAAWokACADDwUCQAJ/IAEtAAtBB3YEQCABKAIEDAELIAEtAAsLBEAgB0EBOgAADAELIAdBAjoAACALQQFqIQsgCkEBayEKCyAHQQFqIQcgAUEMaiEBDAELAAsACxA3AAvlAgEGfyMAQRBrIgckACADQYydAiADGyIFKAIAIQMCQAJAAkAgAUUEQCADDQEMAwtBfiEEIAJFDQIgACAHQQxqIAAbIQYCQCADBEAgAiEADAELIAEtAAAiAEEYdEEYdSIDQQBOBEAgBiAANgIAIANBAEchBAwECyABLAAAIQBB1JwCKAIAKAIARQRAIAYgAEH/vwNxNgIAQQEhBAwECyAAQf8BcUHCAWsiAEEySw0BIABBAnRBgLIBaigCACEDIAJBAWsiAEUNAiABQQFqIQELIAEtAAAiCEEDdiIJQRBrIANBGnUgCWpyQQdLDQADQCAAQQFrIQAgCEGAAWsgA0EGdHIiA0EATgRAIAVBADYCACAGIAM2AgAgAiAAayEEDAQLIABFDQIgAUEBaiIBLQAAIghBwAFxQYABRg0ACwsgBUEANgIAQaibAkEZNgIAQX8hBAwBCyAFIAM2AgALIAdBEGokACAEC7UBAQJ/IwBBoAFrIgQkACAEQQhqQdiuAUGQARAeGgJAAkAgAUEATARAIAENAUEBIQEgBEGfAWohAAsgBCAANgI0IAQgADYCHCAEQX4gAGsiBSABIAEgBUsbIgE2AjggBCAAIAFqIgA2AiQgBCAANgIYIARBCGogAiADQS8QzwEhACABRQ0BIAQoAhwiASABIAQoAhhGa0EAOgAADAELQaibAkE9NgIAQX8hAAsgBEGgAWokACAACzUBAX8jAEEQayICJAAgAiAAKAIANgIMIAAgASgCADYCACABIAJBDGooAgA2AgAgAkEQaiQAC4ESAg9/AX4jAEHQAGsiBiQAIAYgATYCTCAGQTdqIRQgBkE4aiERQQAhAQJAA0ACQCAPQQBIDQBB/////wcgD2sgAUgEQEGomwJBPTYCAEF/IQ8MAQsgASAPaiEPCyAGKAJMIgghAQJAAkACQCAILQAAIgcEQANAAkACQCAHQf8BcSIHRQRAIAEhBwwBCyAHQSVHDQEgASEHA0AgAS0AAUElRw0BIAYgAUECaiIJNgJMIAdBAWohByABLQACIQsgCSEBIAtBJUYNAAsLIAcgCGshASAABEAgACAIIAEQNgsgAQ0GQX8hEEEBIQcgBigCTCIJIQECQCAJLAABQTBrQQpPDQAgAS0AAkEkRw0AIAEsAAFBMGshEEEBIRJBAyEHCyAGIAEgB2oiATYCTEEAIQwCQCABLAAAIg5BIGsiCUEfSwRAIAEhBwwBCyABIQdBASAJdCIJQYnRBHFFDQADQCAGIAFBAWoiBzYCTCAJIAxyIQwgASwAASIOQSBrIglBIE8NASAHIQFBASAJdCIJQYnRBHENAAsLAkAgDkEqRgRAIAYCfwJAIAcsAAFBMGtBCk8NACAGKAJMIgEtAAJBJEcNACABLAABQQJ0IARqQcABa0EKNgIAIAEsAAFBA3QgA2pBgANrKAIAIQ1BASESIAFBA2oMAQsgEg0GQQAhEkEAIQ0gAARAIAIgAigCACIBQQRqNgIAIAEoAgAhDQsgBigCTEEBagsiATYCTCANQQBODQFBACANayENIAxBgMAAciEMDAELIAZBzABqEM4BIg1BAEgNBCAGKAJMIQELQX8hCgJAIAEtAABBLkcNACABLQABQSpGBEACQCABLAACQTBrQQpPDQAgBigCTCIBLQADQSRHDQAgASwAAkECdCAEakHAAWtBCjYCACABLAACQQN0IANqQYADaygCACEKIAYgAUEEaiIBNgJMDAILIBINBSAABH8gAiACKAIAIgFBBGo2AgAgASgCAAVBAAshCiAGIAYoAkxBAmoiATYCTAwBCyAGIAFBAWo2AkwgBkHMAGoQzgEhCiAGKAJMIQELQQAhBwNAIAchE0F/IQsgASwAAEHBAGtBOUsNCCAGIAFBAWoiDjYCTCABLAAAIQcgDiEBIAcgE0E6bGpBj5MBai0AACIHQQFrQQhJDQALAkACQCAHQRNHBEAgB0UNCiAQQQBOBEAgBCAQQQJ0aiAHNgIAIAYgAyAQQQN0aikDADcDQAwCCyAARQ0IIAZBQGsgByACIAUQzQEgBigCTCEODAILIBBBAE4NCQtBACEBIABFDQcLIAxB//97cSIJIAwgDEGAwABxGyEHQQAhC0GJCSEQIBEhDAJAAkACQAJ/AkACQAJAAkACfwJAAkACQAJAAkACQAJAIA5BAWssAAAiAUFfcSABIAFBD3FBA0YbIAEgExsiAUHYAGsOIQQUFBQUFBQUFA4UDwYODg4UBhQUFBQCBQMUFAkUARQUBAALAkAgAUHBAGsOBw4UCxQODg4ACyABQdMARg0JDBMLIAYpA0AhFUGJCQwFC0EAIQECQAJAAkACQAJAAkACQCATQf8BcQ4IAAECAwQaBQYaCyAGKAJAIA82AgAMGQsgBigCQCAPNgIADBgLIAYoAkAgD6w3AwAMFwsgBigCQCAPOwEADBYLIAYoAkAgDzoAAAwVCyAGKAJAIA82AgAMFAsgBigCQCAPrDcDAAwTCyAKQQggCkEISxshCiAHQQhyIQdB+AAhAQsgESEIIAFBIHEhCSAGKQNAIhVQRQRAA0AgCEEBayIIIBWnQQ9xQaCXAWotAAAgCXI6AAAgFUIPViEOIBVCBIghFSAODQALCyAGKQNAUA0DIAdBCHFFDQMgAUEEdkGJCWohEEECIQsMAwsgESEBIAYpA0AiFVBFBEADQCABQQFrIgEgFadBB3FBMHI6AAAgFUIHViEIIBVCA4ghFSAIDQALCyABIQggB0EIcUUNAiAKIBEgCGsiAUEBaiABIApIGyEKDAILIAYpA0AiFUIAUwRAIAZCACAVfSIVNwNAQQEhC0GJCQwBCyAHQYAQcQRAQQEhC0GKCQwBC0GLCUGJCSAHQQFxIgsbCyEQIBUgERByIQgLIAdB//97cSAHIApBAE4bIQcCQCAGKQNAIhVCAFINACAKDQBBACEKIBEhCAwMCyAKIBVQIBEgCGtqIgEgASAKSBshCgwLCyAGKAJAIgFBixogARsiCCAKENsCIgEgCCAKaiABGyEMIAkhByABIAhrIAogARshCgwKCyAKBEAgBigCQAwCC0EAIQEgAEEgIA1BACAHED8MAgsgBkEANgIMIAYgBikDQD4CCCAGIAZBCGoiATYCQEF/IQogAQshCUEAIQECQANAIAkoAgAiCEUNAQJAIAZBBGogCBDVAiIIQQBIIgwNACAIIAogAWtLDQAgCUEEaiEJIAogASAIaiIBSw0BDAILC0F/IQsgDA0LCyAAQSAgDSABIAcQPyABRQRAQQAhAQwBC0EAIQkgBigCQCEOA0AgDigCACIIRQ0BIAZBBGogCBDVAiIIIAlqIgkgAUoNASAAIAZBBGogCBA2IA5BBGohDiABIAlLDQALCyAAQSAgDSABIAdBgMAAcxA/IA0gASABIA1IGyEBDAgLIAAgBisDQCANIAogByABQS4RHQAhAQwHCyAGIAYpA0A8ADdBASEKIBQhCCAJIQcMBAsgBiABQQFqIgk2AkwgAS0AASEHIAkhAQwACwALIA8hCyAADQQgEkUNAkEBIQEDQCAEIAFBAnRqKAIAIgAEQCADIAFBA3RqIAAgAiAFEM0BQQEhCyABQQFqIgFBCkcNAQwGCwtBASELIAFBCk8NBANAIAQgAUECdGooAgANASABQQFqIgFBCkcNAAsMBAtBfyELDAMLIABBICALIAwgCGsiDCAKIAogDEgbIg5qIgkgDSAJIA1KGyIBIAkgBxA/IAAgECALEDYgAEEwIAEgCSAHQYCABHMQPyAAQTAgDiAMQQAQPyAAIAggDBA2IABBICABIAkgB0GAwABzED8MAQsLQQAhCwsgBkHQAGokACALC2kBAn8CQCAAKAIUIAAoAhxNDQAgAEEAQQAgACgCJBEEABogACgCFA0AQX8PCyAAKAIEIgEgACgCCCICSQRAIAAgASACa6xBASAAKAIoERgAGgsgAEEANgIcIABCADcDECAAQgA3AgRBAAvIFQEXfyMAQSBrIQkgASgCACEIIAEoAggiAigCACEFIAIoAgwhByAAQoCAgIDQxwA3AtAoQQAhAgJAAkAgB0EASgRAQX8hDgNAAkAgCCACQQJ0aiIDLwEABEAgACAAKALQKEEBaiIDNgLQKCAAIANBAnRqQdwWaiACNgIAIAAgAmpB2ChqQQA6AAAgAiEODAELIANBADsBAgsgAkEBaiICIAdHDQALIABBrC1qIQ8gAEGoLWohEiAAKALQKCIEQQFKDQIMAQsgAEGsLWohDyAAQagtaiESQX8hDgsDQCAAIARBAWoiAjYC0CggACACQQJ0akHcFmogDkEBaiIDQQAgDkECSCIGGyICNgIAIAggAkECdCIEakEBOwEAIAAgAmpB2ChqQQA6AAAgACAAKAKoLUEBazYCqC0gBQRAIA8gDygCACAEIAVqLwECazYCAAsgAyAOIAYbIQ4gACgC0CgiBEECSA0ACwsgASAONgIEIARBAXYhBgNAIAAgBkECdGpB3BZqKAIAIQoCQCAGIgJBAXQiAyAESg0AIAggCkECdGohCyAAIApqQdgoaiEMIAYhBQNAAkAgAyAETgRAIAMhAgwBCyAIIABB3BZqIgIgA0EBciIEQQJ0aigCACINQQJ0ai8BACIQIAggAiADQQJ0aigCACIRQQJ0ai8BACICTwRAIAIgEEcEQCADIQIMAgsgAyECIABB2ChqIgMgDWotAAAgAyARai0AAEsNAQsgBCECCyALLwEAIgQgCCAAIAJBAnRqQdwWaigCACIDQQJ0ai8BACINSQRAIAUhAgwCCwJAIAQgDUcNACAMLQAAIAAgA2pB2ChqLQAASw0AIAUhAgwCCyAAIAVBAnRqQdwWaiADNgIAIAIhBSACQQF0IgMgACgC0CgiBEwNAAsLIAAgAkECdGpB3BZqIAo2AgAgBkECTgRAIAZBAWshBiAAKALQKCEEDAELCyAAKALQKCEDA0AgByEGIAAgA0EBayIENgLQKCAAKALgFiEMIAAgACADQQJ0akHcFmooAgAiCzYC4BZBASECAkAgA0EDSA0AIAggC0ECdGohCiAAIAtqQdgoaiENQQIhA0EBIQUDQAJAIAMgBE4EQCADIQIMAQsgCCAAQdwWaiICIANBAXIiB0ECdGooAgAiBEECdGovAQAiECAIIAIgA0ECdGooAgAiEUECdGovAQAiAk8EQCACIBBHBEAgAyECDAILIAMhAiAAQdgoaiIDIARqLQAAIAMgEWotAABLDQELIAchAgsgCi8BACIHIAggACACQQJ0akHcFmooAgAiA0ECdGovAQAiBEkEQCAFIQIMAgsCQCAEIAdHDQAgDS0AACAAIANqQdgoai0AAEsNACAFIQIMAgsgACAFQQJ0akHcFmogAzYCACACIQUgAkEBdCIDIAAoAtAoIgRMDQALC0ECIQMgAEHcFmoiCiACQQJ0aiALNgIAIAAgACgC1ChBAWsiBTYC1CggACgC4BYhAiAKIAVBAnRqIAw2AgAgACAAKALUKEEBayIFNgLUKCAKIAVBAnRqIAI2AgAgCCAGQQJ0aiINIAggAkECdGoiBS8BACAIIAxBAnRqIgcvAQBqOwEAIABB2ChqIgsgBmoiECACIAtqLQAAIgIgCyAMai0AACIEIAIgBEsbQQFqOgAAIAUgBjsBAiAHIAY7AQIgACAGNgLgFkEBIQVBASECAkAgACgC0CgiBEECSA0AA0ACfyADIAMgBE4NABogCCAKIANBAXIiB0ECdGooAgAiBEECdGovAQAiAiAIIAogA0ECdGooAgAiDEECdGovAQAiEU8EQCADIAIgEUcNARogAyAEIAtqLQAAIAsgDGotAABLDQEaCyAHCyECIA0vAQAiByAIIAAgAkECdGpB3BZqKAIAIgNBAnRqLwEAIgRJBEAgBSECDAILAkAgBCAHRw0AIBAtAAAgACADakHYKGotAABLDQAgBSECDAILIAAgBUECdGpB3BZqIAM2AgAgAiEFIAJBAXQiAyAAKALQKCIETA0ACwsgBkEBaiEHIAAgAkECdGpB3BZqIAY2AgAgACgC0CgiA0EBSg0ACyAAIAAoAtQoQQFrIgI2AtQoIABB3BZqIgUgAkECdGogACgC4BY2AgAgASgCBCEEIAEoAggiAigCECEGIAIoAgghCyACKAIEIREgAigCACEMIAEoAgAhByAAQdQWaiITQgA3AQAgAEHMFmoiFEIANwEAIABBxBZqIhVCADcBACAAQbwWaiIWQgA3AQBBACEKIAcgBSAAKALUKEECdGooAgBBAnRqQQA7AQICQCAAKALUKCIBQbsESg0AIAFBAWohAkEA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FCAAIAE2AhggAEEANgIMIABCgqCAgOAANwIEIAAgAUU2AhAgAEEgakEAQSgQIRogAEEcahCKAguMAQECfyAAQbCuATYCACAAKAIoIQEDQCABBEBBACAAIAFBAWsiAUECdCICIAAoAiRqKAIAIAAoAiAgAmooAgARBgAMAQsLIAAoAhwiASABKAIEQQFrIgI2AgQgAkF/RgRAIAEgASgCACgCCBEBAAsgACgCIBAbIAAoAiQQGyAAKAIwEBsgACgCPBAbIAALRAEBfyMAQRBrIgUkACAFIAEgAiADIARCgICAgICAgICAf4UQRCAFKQMAIQEgACAFKQMINwMIIAAgATcDACAFQRBqJAALxAECAX8CfkF/IQMCQCAAQgBSIAFC////////////AIMiBEKAgICAgIDA//8AViAEQoCAgICAgMD//wBRGw0AQQAgAkL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgACAEIAWEhFAEQEEADwsgASACg0IAWQRAQQAgASACUyABIAJRGw0BIAAgASAChYRCAFIPCyAAQgBSIAEgAlUgASACURsNACAAIAEgAoWEQgBSIQMLIAML1wMCAn4CfyMAQSBrIgQkAAJAIAFC////////////AIMiA0KAgICAgIDAgDx9IANCgICAgICAwP/DAH1UBEAgAUIEhiAAQjyIhCEDIABC//////////8PgyIAQoGAgICAgICACFoEQCADQoGAgICAgICAwAB8IQIMAgsgA0KAgICAgICAgEB9IQIgAEKAgICAgICAgAiFQgBSDQEgAiADQgGDfCECDAELIABQIANCgICAgICAwP//AFQgA0KAgICAgIDA//8AURtFBEAgAUIEhiAAQjyIhEL/////////A4NCgICAgICAgPz/AIQhAgwBC0KAgICAgICA+P8AIQIgA0L///////+//8MAVg0AQgAhAiADQjCIpyIFQZH3AEkNACAEQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiAiAFQYH3AGsQPCAEIAAgAkGB+AAgBWsQbiAEKQMIQgSGIAQpAwAiAEI8iIQhAiAEKQMQIAQpAxiEQgBSrSAAQv//////////D4OEIgBCgYCAgICAgIAIWgRAIAJCAXwhAgwBCyAAQoCAgICAgICACIVCAFIN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QAJAAkACQAJAA0AgAyAHaiICLQABIAQtAANHDQYgAi0AAiAELQAERw0FIAItAAMgBC0ABUcNBCACLQAEIAQtAAZHDQMgAi0ABSAELQAHRw0CIAItAAYgBC0ACEcNASACLQAHIAQtAAlGBEAgByADQQhqIgJqIgYtAAAgBC0ACkcNCCAEQQhqIQQgA0H6AUkhEiACIQMgEg0BDAgLCyACQQdqIQYMBgsgAkEGaiEGDAULIAJBBWohBgwECyACQQRqIQYMAwsgAkEDaiEGDAILIAJBAmohBgwBCyACQQFqIQYLIAYgD2siAkGCAmoiAyAFTA0AIAAgATYCcCADIA1OBEAgAyEFDAILIAMgB2otAAAhCiACIAdqLQCBAiELIAMhBQsgDCARIAEgEHFBAXRqLwEAIgFPDQAgCUEBayIJDQELCyAIIAUgBSAISxsLnw0BCn8gACgCLCICIAAoAgxBBWsiAyACIANJGyEIIAAoAgAiAygCBCEJIAFBBEYhBwJAA0AgAygCECICIAAoArwtQSpqQQN1IgRJBEBBASEFDAILIAggAiAEayIEIAAoAmwgACgCXGsiBiADKAIEaiICQf//AyACQf//A0kbIgUgBCAFSRsiBEsEQEEBIQUgBEEARyAHckUNAiABRQ0CIAIgBEcNAgsgAEEAQQAgByACIARGcSIKEIoBIAAoAhQgACgCCGpBBGsgBDoAACAAKAIUIAAoAghqQQNrIARBCHY6AAAgACgCFCAAKAIIakECayAEQX9zIgI6AAAgACgCFCAAKAIIakEBayACQQh2OgAAIAAoAgAiAigCHCIDEDUCQCACKAIQIgUgAygCFCILIAUgC0kbIgVFDQAgAigCDCADKAIQIAUQHhogAiACKAIMIAVqNgIMIAMgAygCECAFajYCECACIAIoAhQgBWo2AhQgAiACKAIQIAVrNgIQIAMgAygCFCAFayICNgIUIAINACADIAMoAgg2AhALIAYEQCAAKAIAKAIMIAAoAjggACgCXGogBCAGIAQgBkkbIgIQHhogACgCACIDIAMoAgwgAmo2AgwgAyADKAIQIAJrNgIQIAMgAygCFCACajYCFCAAIAAoAlwgAmo2AlwgBCACayEECyAEBEAgACgCACICKAIMIQUgBCACKAIEIgYgBCAGSRsiAwRAIAIgBiADazYCBCAFIAIoAgAgAxAeIQUCQAJAAkAgAigCHCgCGEEBaw4CAAECCyACIAIoAjAgBSADEH82AjAMAQsgAiACKAIwIAUgAxBKNgIwCyACIAIoAgAgA2o2AgAgAiACKAIIIANqNgIIIAAoAgAiAigCDCEFCyACIAQgBWo2AgwgAiACKAIQIARrNgIQIAIgAigCFCAEajYCFAsgACgCACEDIApFDQALQQAhBQsCQCAJIAMoAgRrIgRFBEAgACgCbCECDAELAkAgACgCLCICIARNBEAgAEECNgKwLSAAKAI4IAMoAgAgAmsgAhAeGiAAIAAoAiwiAzYCbCADIQIMAQsCQCAAKAI8IAAoAmwiA2sgBEsNACAAIAMgAmsiAzYCbCAAKAI4IgYgAiAGaiADEB4aIAAoArAtIgJBAUsNACAAIAJBAWo2ArAtCyAAKAI4IAAoAmxqIAAoAgAoAgAgBGsgBBAeGiAAIAAoAmwgBGoiAjYCbCAAKAIsIQMLIAAgAjYCXCAAIAMgACgCtC0iA2siBiAEIAQgBksbIANqNgK0LQsgAiAAKALALUsEQCAAIAI2AsAtC0EDIQQCQCAFRQ0AIAAoAgAiAygCBCEEAkACQCABQXtxRQ0AIAQNAEEBIQQgAiAAKAJcRg0CIAAoAjwgAkF/c2ohBUEAIQQMAQsgBCAAKAI8IAJBf3NqIgVNDQAgACgCXCIHIAAoAiwiBkgNACAAIAIgBmsiAjYCbCAAIAcgBms2AlwgACgCOCIDIAMgBmogAhAeGiAAKAKwLSICQQFNBEAgACACQQFqNgKwLQsgACgCLCAFaiEFIAAoAgAiAygCBCEECwJAIAQgBSAEIAVJGyICRQRAIAAoAmwhBAwBCyAAKAJsIQUgACgCOCEGIAMgBCACazYCBCAFIAZqIAMoAgAgAhAeIQQCQAJAAkAgAygCHCgCGEEBaw4CAAECCyADIAMoAjAgBCACEH82AjAMAQsgAyADKAIwIAQgAhBKNgIwCyADIAMoAgAgAmo2AgAgAyADKAIIIAJqNgIIIAAgACgCbCACaiIENgJsCyAEIAAoAsAtSwRAIAAgBDYCwC0LIAQgACgCXCIGayICIAAoAiwiBCAAKAIMIAAoArwtQSpqQQN1ayIDQf//AyADQf//A0kbIgMgAyAESxtJBEBBACEEIAFBBEYgAkEAR3JFDQEgAUUNASAAKAIAKAIEDQEgAiADSw0BC0EAIQUgAUEERgRAIAAoAgAoAgRFIAIgA01xIQULIAAgACgCOCAGaiADIAIgAiADSxsiASAFEIoBIAAgACgCXCABajYCXCAAKAIAIgAoAhwiARA1AkAgACgCECICIAEoAhQiAyACIANJGyICRQ0AIAAoAgwgASgCECACEB4aIAAgACgCDCACajYCDCABIAEoAhAgAmo2AhAgACAAKAIUIAJqNgIUIAAgACgCECACazYCECABIAEoAhQgAmsiADYCFCAADQAgASABKAIINgIQC0ECQQAgBRshBAsgBAugAgEDfwJAIABFDQAgACgCIEUNACAAKAIkIgJFDQAgACgCHCIBRQ0AIAEoAgAgAEcNAAJAAkAgASgCBCIDQTlrDjkBAgICAgICAgICAgIBAgICAQICAgICAgICAgICAgICAgICAQICAgICAgICAgICAQICAgICAgICAgEACyADQZoFRg0AIANBKkcNAQsgASgCCCIDBEAgACgCKCADIAIRAwAgACgCHCEBCyABKAJEIgIEQCAAKAIoIAIgACgCJBEDACAAKAIcIQELIAEoAkAiAgRAIAAoAiggAiAAKAIkEQMAIAAoAhwhAQsgASgCOCICBEAgACgCKCACIAAoAiQRAwAgACgCHCEBCyAAKAIoIAEgACgCJBEDACAAQQA2AhwLCxwAIAAgAUEIIAKnIAJCIIinIAOnIANCIIinEA8LygYCBH8DfiMAQYABayIFJAACQAJAAkAgAyAEQgBCABBtRQ0AAn8gBEL///////8/gyEJAn8gBEIwiKdB//8BcSIGQf//AUcEQEEEIAYNARpBAkEDIAMgCYRQGwwCCyADIAmEUAsLRQ0AIAJCMIinIghB//8BcSIGQf//AUcNAQsgBUEQaiABIAIgAyAEECcgBSAFKQMQIgEgBSkDGCICIAEgAhDUAiAFKQMIIQIgBSkDACEEDAELIAEgAkL///////8/gyAGrUIwhoQiCiADIARC////////P4MgBEIwiKdB//8BcSIHrUIwhoQiCRBtQQBMBEAgASAKIAMgCRBtBEAgASEEDAILIAVB8ABqIAEgAkIAQgAQJyAFKQN4IQIgBSkDcCEEDAELIAYEfiABBSAFQeAAaiABIApCAEKAgICAgIDAu8AAECcgBSkDaCIKQjCIp0H4AGshBiAFKQNg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Bn8jAEEQayIDJABBASEHAkACQAJAAkACQAJAIAEgAGtBDG0OBgUFAAECAwQLIAFBDGsiASAAIAIoAgARAgBFDQQgAyAAKAIINgIIIAMgACkCADcDACAAIAEoAgg2AgggACABKQIANwIAIAEgAygCCDYCCCABIAMpAwA3AgAMBAsgAEEMaiIEIAAgAigCABECACEFIAFBDGsiASAEIAIoAgARAgAhBiAFRQRAIAZFDQQgAyAEKAIINgIIIAMgBCkCADcDACAEIAEoAgg2AgggBCABKQIANwIAIAEgAygCCDYCCCABIAMpAwA3AgAgBCAAIAIoAgARAgBFDQQgAyAAKAIINgIIIAMgACkCADcDACAAIAQoAgg2AgggACAEKQIANwIAIAQgAygCCDYCCCAEIAMpAwA3AgAMBAsgBgRAIAMgACgCCDYCCCADIAApAgA3AwAgACABKAIINgIIIAAgASkCADcCACABIAMoAgg2AgggASADKQMANwIADAQLIAMgACgCCDYCCCADIAApAgA3AwAgACAEKAIINgIIIAAgBCkCADcCACAEIAMoAgg2AgggBCADKQMANwIAIAEgBCACKAIAEQIARQ0DIAMgBCgCCDYCCCADIAQpAgA3AwAgBCABKAIINgIIIAQgASkCADcCACABIAMoAgg2AgggASADKQMANwIADAMLIAAgAEEMaiAAQRhqIAFBDGsgAhCCARoMAgsgACAAQQxqIgQgAEEYaiIGIABBJGoiBSACEIIBGiABQQxrIgEgBSACKAIAEQIARQ0BIAMgBSgCCDYCCCADIAUpAgA3AwAgBSABKAIINgIIIAUgASkCADcCACABIAMoAgg2AgggASADKQMANwIAIAUgBiACKAIAEQIARQ0BIAMgBigCCDYCCCADIAYpAgA3AwAgBiAFKAIINgIIIAYgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIAIAYgBCACKAIAEQIARQ0BIAMgBCgCCDYCCCADIAQpAgA3AwAgBCAGKAIINgIIIAQgBikCADcCACAGIAMoAgg2AgggBiADKQMANwIAIAQgACACKAIAEQIARQ0BIAMgACgCCDYCCCADIAApAgA3AwAgACAEKAIINgIIIAAgBCkCADcCACAEIAMoAgg2AgggBCADKQMANwIADAELIABBDGoiBCAAIAIoAgARAgAhCCAAQRhqIgUgBCACKAIAEQIAIQYCQCAIRQRAIAZFDQEgAyAEKAIINgIIIAMgBCkCADcDACAEIAVBCGooAgA2AgggBCAFKQIANwIAIAUgAygCCDYCCCAFIAMpAwA3AgAgBCAAIAIoAgARAgBFDQEgAyAAKAIINgIIIAMgACkCADcDACAAIAQoAgg2AgggACAEKQIANwIAIAQgAygCCDYCCCAEIAMpAwA3AgAMAQsgBgRAIAMgACgCCDYCCCADIAApAgA3AwAgACAFQQhqKAIANgIIIAAgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIADAELIAMgACgCCDYCCCADIAApAgA3AwAgACAEKAIINgIIIAAgBCkCADcCACAEIAMoAgg2AgggBCADKQMANwIAIAUgBCACKAIAEQIARQ0AIAMgBCgCCDYCCCADIAQpAgA3AwAgBCAFQQhqKAIANgIIIAQgBSkCADcCACAFIAMoAgg2AgggBSADKQMANwIACyAAQSRqIgQgAUYNAEEAIQgCQANAIAQiBiAFIAIoAgARAgAEQCADIAYoAgg2AgggAyAGKQIANwMAIAYhBwNAAkAgByAFIgQpAgA3AgAgByAEKAIINgIIIAAgBEYEQCAAIQQMAQsgBCEHIAMgBEEMayIFIAIoAgARAgANAQsLIAQgAykDADcCACAEIAMoAgg2AgggCEEBaiIIQQhGDQILIAYiBUEMaiIEIAFHDQALQQEhBwwBCyAGQQxqIAFGIQcLIANBEGokACAHCwQAQX8LSwECfyAAKAIAIgEEQAJ/IAEoAgwiAiABKAIQRgRAIAEgASgCACgCJBEAAAwBCyACKAIAC0F/RwRAIAAoAgBFDwsgAEEANgIAC0EBC0sBAn8gACgCACIBBEACfyABKAIMIgIgASgCEEYEQCABIAEoAgAoAiQRAAAMAQsgAi0AAAtBf0cEQCAAKAIARQ8LIABBADYCAAtBAQsJACAAECY2AgALJgEBfyAAKAIEIQIDQCABIAJHBEAgAkEEayECDAELCyAAIAE2AgQLrAgCA30Ff0EBIQYCQAJAAkACQAJAAkACQAJAIAEgAGtBA3UOBgUFAAECAwQLIAFBBGsiBSoCACICIAAqAgQiA15FDQQgACgCACEGIAAgAUEIayIBKAIANgIAIAEgBjYCACAAIAI4AgQgBSADOAIADAYLIAFBCGshBSABQQRrIgEqAgAhAiAAKgIMIgMgACoCBCIEXkUEQCACIANeRQ0EIAAoAgghByAAIAUoAgA2AgggBSAHNgIAIAAgAjgCDCABIAM4AgAgACoCDCICIAAqAgQiA15FDQQgACgCCCEBDAULIAIgA14EQCAAKAIAIQYgACAFKAIANgIAIAUgBjYCACAAIAI4AgQgASAEOAIADAYLIAAoAgghByAAIAAoAgAiCDYCCCAAIAc2AgAgACAEOAIMIAAgAzgCBCABKgIAIgIgBF5FDQMgACAFKAIANgIIIAUgCDYCACAAIAI4AgwgASAEOAIADAULIAAgAEEIaiAAQRBqIAFBCGsQgwEaDAQLIAAgAEEIaiAAQRBqIABBGGoQgwEaIAFBBGsiBSoCACICIAAqAhwiA15FDQEgACgCGCEHIAAgAUEIayIBKAIANgIYIAEgBzYCACAAIAI4AhwgBSADOAIAIAAqAhwiAiAAKgIUIgNeRQ0BIAAoAhghASAAIAAoAhA2AhggACABNgIQIAAgAzgCHCAAIAI4AhQgAiAAKgIMIgNeRQ0BIAAgACgCCDYCECAAIAE2AgggACADOAIUIAAgAjgCDCACIAAqAgQiA15FDQEMAgsgAEEUaiIIKgIAIQICQAJAIABBDGoiBSoCACIDIABBBGoiByoCACIEXkUEQCACIANeRQ0CIAAoAhAhCCAAIAAoAgg2AhAgACAINgIIIAAgAzgCFCAAIAI4AgwgAiAEXkUNAiAAIAAoAgA2AgggACAINgIADAELAkAgAiADXgRAIAAoAhAhBSAAIAAoAgA2AhAgACAFNgIADAELIAAoAgghByAAIAAoAgAiCTYCCCAAIAc2AgAgACAEOAIMIAAgAzgCBCACIAReRQ0CIAAoAhAhByAAIAk2AhAgACAHNgIIIAUhBwsgCCEFCyAHIAI4AgAgBSAEOAIACyAAQRhqIgUgAUYNACAAQRBqIQZBACEIAkADQCAFIgcqAgQiAiAGKgIEIgNeBEAgBigCACEFIAcgAzgCBCAHKAIAIQkgByAFNgIAAn8gACAAIAZGDQAaA0AgBiAGQQRrKgIAIgMgAl1FDQEaIAYgAzgCBCAGIAZBCGsiBigCADYCACAAIAZHDQALIAALIgUgAjgCBCAFIAk2AgAgCEEBaiIIQQhGDQILIAciBkEIaiIFIAFHDQALDAMLIAdBCGogAUYhBgsgBg8LIAAgACgCADYCCCAAIAE2AgAgACADOAIMIAAgAjgCBAtBAQsqACMAQRBrIgIkAAJAIAAgAUYEQCAAQQA6AHgMAQsgARAbCyACQRBqJAALGwAgAUH/////A0sEQEHKERBcAAsgAUECdBAdCz8BAX8jAEEQayICJAACQAJAIAAtAHgNACABQR5LDQAgAEEBOgB4DAELIAJBCGogARD9ASEACyACQRBqJAAgAAtfAQV/IwBBEGsiACQAIABB/////wM2AgwgAEH/////BzYCCCMAQRBrIgEkACAAQQhqIgIoAgAgAEEMaiIDKAIASSEEIAFBEGokACACIAMgBBsoAgAhASAAQRBqJAAgAQsJACAAELMBEBsLBABBCgsVACAAQfjWATYCACAAQRBqEBwaIAALFQAgAEHQ1gE2AgAgAEEMahAcGiAACwQAQQQLZgECfyMAQRBrIgEkACABIAA2AgwgAUEIaiABQQxqEFAhAEEEQQFB1JwCKAIAKAIAGyECIAAoAgAiAARAQdScAigCABogAARAQdScAkGQmwIgACAAQX9GGzYCAAsLIAFBEGokACACC2IBAX8jAEEQayIFJAAgBSAENgIMIAVBCGogBUEMahBQIQQgACABIAIgAxCfASEBIAQoAgAiAARAQdScAigCABogAARAQdScAkGQmwIgACAAQX9GGzYCAAsLIAVBEGokACABCxIAIAQgAjYCACAHIAU2AgBBAwsoAQF/IABB7NUBNgIAAkAgACgCCCIBRQ0AIAAtAAxFDQAgARAbCyAACwQAIAELhRAAIAACfwJAQeCeAi0AAEEBcQ0AQeCeAhAvRQ0AAkBB1J4CLQAAQQFxDQBB1J4CEC9FDQBBnKsCQQA2AgBBmKsCQajTATYCAEGYqwJBmNkBNgIAQZirAkHY1QE2AgAjAEEQayIAJABBoKsCQgA3AwAgAEEANgIMQairAkEANgIAQaisAkEAOgAAIABBEGokABD/AUEeSQRAEEEAC0GgqwJBsKsCQR4Q/gEiADYCAEGkqwIgADYCAEGoqwIgAEH4AGo2AgBBoKsCKAIAIgBBqKsCKAIAIABrQQJ1QQJ0ahpBHhCNAkGwrAJByRQQbEGkqwIoAgBBoKsCKAIAaxpBoKsCEIwCQaCrAigCACIAQairAigCACAAa0ECdUECdGoaQaSrAigCABpB5KgCQQA2AgBB4KgCQajTATYCAEHgqAJBmNkBNgIAQeCoAkGE4AE2AgBB4KgCQaSdAhAqECtB7KgCQQA2AgBB6KgCQajTATYCAEHoqAJBmNkBNgIAQeioAkGk4AE2AgBB6KgCQaydAhAqECtB9KgCQQA2AgBB8KgCQajTATYCAEHwqAJBmNkBNgIAQfyoAkEAOgAAQfioAkEANgIAQfCoAkHs1QE2AgBB+KgCQfi0ASgCADYCAEHwqAJB8J4CECoQK0GEqQJBADYCAEGAqQJBqNMBNgIAQYCpAkGY2QE2AgBBgKkCQdDZATYCAEGAqQJB6J4CECoQK0GMqQJBADYCAEGIqQJBqNMBNgIAQYipAkGY2QE2AgBBiKkCQeTaATYCAEGIqQJB+J4CECoQK0GUqQJBADYCAEGQqQJBqNMBNgIAQZCpAkGY2QE2AgBBkKkCQaDWATYCAEGYqQIQJjYCAEGQqQJBgJ8CECoQK0GkqQJBADYCAEGgqQJBqNMBNgIAQaCpAkGY2QE2AgBBoKkCQfjbATYCAEGgqQJBiJ8CECoQK0GsqQJBADYCAEGoqQJBqNMBNgIAQaipAkGY2QE2AgBBqKkCQezcATYCAEGoqQJBkJ8CECoQK0G0qQJBADYCAEGwqQJBqNMBNgIAQbCpAkGY2QE2AgBBuKkCQa7YADsBAEGwqQJB0NYBNgIAQbypAhAgGkGwqQJBmJ8CECoQK0HMqQJBADYCAEHIqQJBqNMBNgIAQcipAkGY2QE2AgBB0KkCQq6AgIDABTcCAEHIqQJB+NYBNgIAQdipAhAgGkHIqQJBoJ8CECoQK0HsqQJBADYCAEHoqQJBqNMBNgIAQeipAkGY2QE2AgBB6KkCQcTgATYCAEHoqQJBtJ0CECoQK0H0qQJBADYCAEHwqQJBqNMBNgIAQfCpAkGY2QE2AgBB8KkCQbjiATYCAEHwqQJBvJ0CECoQK0H8qQJBADYCAEH4qQJBqNMBNgIAQfipAkGY2QE2AgBB+KkCQYzkATYCAEH4qQJBxJ0CECoQK0GEqgJBADYCAEGAqgJBqNMBNgIAQYCqAkGY2QE2AgBBgKoCQfTlATYCAEGAqgJBzJ0CECoQK0GMqgJBADYCAEGIqgJBqNMBNgIAQYiqAkGY2QE2AgBBiKoCQcztATYCAEGIqgJB9J0CECoQK0GUqgJBADYCAEGQqgJBqNMBNgIAQZCqAkGY2QE2AgBBkKoCQeDuATYCAEGQqgJB/J0CECoQK0GcqgJBADYCAEGYqgJBqNMBNgIAQZiqAkGY2QE2AgBBmKoCQdTvATYCAEGYqgJBhJ4CECoQK0GkqgJBADYCAEGgqgJBqNMBNgIAQaCqAkGY2QE2AgBBoKoCQcjwATYCAEGgqgJBjJ4CECoQK0GsqgJBADYCAEGoqgJBqNMBNgIAQaiqAkGY2QE2AgBBqKoCQbzxATYCAEGoqgJBlJ4CECoQK0G0qgJBADYCAEGwqgJBqNMBNgIAQbCqAkGY2QE2AgBBsKoCQeDyATYCAEGwqgJBnJ4CECoQK0G8qgJBADYCAEG4qgJBqNMBNgIAQbiqAkGY2QE2AgBBuKoCQYT0ATYCAEG4qgJBpJ4CECoQK0HEqgJBADYCAEHAqgJBqNMBNgIAQcCqAkGY2QE2AgBBwKoCQaj1ATYCAEHAqgJBrJ4CECoQK0HMqgJBADYCAEHIqgJBqNMBNgIAQciqAkGY2QE2AgBB0KoCQZD/ATYCAEHIqgJBvOcBNgIAQdCqAkHs5wE2AgBByKoCQdSdAhAqECtB3KoCQQA2AgBB2KoCQajTATYCAEHYqgJBmNkBNgIAQeCqAkG0/wE2AgBB2KoCQcTpATYCAEHgqgJB9OkBNgIAQdiqAkHcnQIQKhArQeyqAkEANgIAQeiqAkGo0wE2AgBB6KoCQZjZATYCAEHwqgIQ+QFB6KoCQbDrATYCAEHoqgJB5J0CECoQK0H8qgJBADYCAEH4qgJBqNMBNgIAQfiqAkGY2QE2AgBBgKsCEPkBQfiqAkHM7AE2AgBB+KoCQeydAhAqECtBjKsCQQA2AgBBiKsCQajTATYCAEGIqwJBmNkBNgIAQYirAkHM9gE2AgBBiKsCQbSeAhAqECtBlKsCQQA2AgBBkKsCQajTATYCAEGQqwJBmNkBNgIAQZCrAkHE9wE2AgBBkKsCQbyeAhAqECtBzJ4CQZirAjYCAEHQngJBzJ4CNgIAQdSeAhAuC0HYngJB0J4CKAIAKAIAIgA2AgAgACAAKAIEQQFqNgIEQdyeAkHYngI2AgBB4J4CEC4LQdyeAigCACgCACIACzYCACAAIAAoAgRBAWo2AgQLxQEBBH8gAEHY1QE2AgAgAEEIaiEBA0AgAiABKAIEIAEoAgBrQQJ1SQRAIAEoAgAgAkECdGooAgAEQCABKAIAIAJBAnRqKAIAIgMgAygCBEEBayIENgIEIARBf0YEQCADIAMoAgAoAggRAQALCyACQQFqIQIMAQsLIABBmAFqEBwaIAEoAgAiAyICIAEoAgggAmtBAnVBAnRqGiABKAIEGiADBEAgARCMAiABQRBqIAEoAgAiAiABKAIIIAJrQQJ1EPwBCyAACwwAIAAgACgCABD6AQt0AQJ/IwBBEGsiASQAIAFBoKsCNgIAIAFBpKsCKAIAIgI2AgQgASACIABBAnRqNgIIIAEoAgQhACABKAIIIQIDQCAAIAJGBEAgASgCACABKAIENgIEIAFBEGokAAUgAEEANgIAIAEgAEEEaiIANgIEDAELCwsgACAAQaDWATYCACAAKAIIECZHBEAgACgCCBDPAgsgAAsEAEF/C8cHAQp/IwBBEGsiEyQAIAIgADYCACADQYAEcSEVIAdBAnQhFgNAIBRBBEYEQAJ/IA0tAAtBB3YEQCANKAIEDAELIA0tAAsLQQFLBEAgEyANEEc2AgggAiATQQhqQQEQlQIgDRBkIAIoAgAQlQE2AgALIANBsAFxIgNBEEcEQCABIANBIEYEfyACKAIABSAACzYCAAsgE0EQaiQABQJAAkACQAJAAkACQCAIIBRqLAAADgUAAQMCBAULIAEgAigCADYCAAwECyABIAIoAgA2AgAgBkEgIAYoAgAoAiwRAgAhByACIAIoAgAiD0EEajYCACAPIAc2AgAMAwsCfyANLQALQQd2BEAgDSgCBAwBCyANLQALC0UNAgJ/IA0tAAtBB3YEQCANKAIADAELIA0LKAIAIQcgAiACKAIAIg9BBGo2AgAgDyAHNgIADAILAn8gDC0AC0EHdgRAIAwoAgQMAQsgDC0ACwtFDQEgFUUNASACIAwQRyAMEGQgAigCABCVATYCAAwBCyACKAIAIRcgBCAWaiIEIQcDQAJAIAUgB00NACAGQYAQIAcoAgAgBigCACgCDBEEAEUNACAHQQRqIQcMAQsLIA4iD0EASgRAA0ACQCAEIAdPDQAgD0UNACAHQQRrIgcoAgAhECACIAIoAgAiEUEEajYCACARIBA2AgAgD0EBayEPDAELCyAPBH8gBkEwIAYoAgAoAiwRAgAFQQALIRIgAigCACEQA0AgEEEEaiERIA9BAEoEQCAQIBI2AgAgD0EBayEPIBEhEAwBCwsgAiARNgIAIBAgCTYCAAsCQCAEIAdGBEAgBkEwIAYoAgAoAiwRAgAhDyACIAIoAgAiEEEEaiIHNgIAIBAgDzYCAAwBCwJ/IAstAAtBB3YEQCALKAIEDAELIAstAAsLBH8CfyALLQALQQd2BEAgCygCAAwBCyALCywAAAVBfwshEkEAIQ9BACERA0AgBCAHRwRAAkAgDyASRwRAIA8hEAwBCyACIAIoAgAiEEEEajYCACAQIAo2AgBBACEQAn8gCy0AC0EHdgRAIAsoAgQMAQsgCy0ACwsgEUEBaiIRTQRAIA8hEgwBCwJ/IAstAAtBB3YEQCALKAIADAELIAsLIBFqLQAAQf8ARgRAQX8hEgwBCwJ/IAstAAtBB3YEQCALKAIADAELIAsLIBFqLAAAIRILIAdBBGsiBygCACEPIAIgAigCACIYQQRqNgIAIBggDzYCACAQQQFqIQ8MAQsLIAIoAgAhBwsgFyAHEJgBCyAUQQFqIRQMAQsLC8UDAQF/IwBBEGsiCiQAIAkCfyAABEAgAhCXAiEAAkAgAQRAIAogACAAKAIAKAIsEQMAIAMgCigCADYAACAKIAAgACgCACgCIBEDAAwBCyAKIAAgACgCACgCKBEDACADIAooAgA2AAAgCiAAIAAoAgAoAhwRAwALIAggChBTIAoQHBogBCAAIAAoAgAoAgwRAAA2AgAgBSAAIAAoAgAoAhARAAA2AgAgCiAAIAAoAgAoAhQRAwAgBiAKEDkgChAcGiAKIAAgACgCACgCGBEDACAHIAoQUyAKEBwaIAAgACgCACgCJBEAAAwBCyACEJYCIQACQCABBEAgCiAAIAAoAgAoAiwRAwAgAyAKKAIANgAAIAogACAAKAIAKAIgEQMADAELIAogACAAKAIAKAIoEQMAIAMgCigCADYAACAKIAAgACgCACgCHBEDAAsgCCAKEFMgChAcGiAEIAAgACgCACgCDBEAADYCACAFIAAgACgCACgCEBEAADYCACAKIAAgACgCACgCFBEDACAGIAoQOSAKEBwaIAogACAAKAIAKAIYEQMAIAcgChBTIAoQHBogACAAKAIAKAIkEQAACzYCACAKQRBqJAALlQIBB38gAEEEaiEDAkAgACgCBCIABEAgAigCACACIAItAAsiBEEYdEEYdUEASCIFGyEIIAIoAgQgBCAFGyEEA0ACQAJAAkACQAJAAkAgACgCFCAALQAbIgIgAkEYdEEYdUEASCIGGyICIAQgAiAESSIJGyIFBEAgCCAAQRBqIgcoAgAgByAGGyIGIAUQJSIHRQRAIAIgBEsNAgwDCyAHQQBODQIMAQsgAiAETQ0CCyAAKAIAIgINBCABIAA2AgAgAA8LIAYgCCAFECUiAg0BCyAJDQEMBQsgAkEATg0ECyAAQQRqIQMgACgCBCICRQ0DIAMhAAsgACEDIAIhAAwACwALIAEgAzYCACADDwsgASAANgIAIAMLxAcBCn8jAEEQayITJAAgAiAANgIAIANBgARxIRYDQCAUQQRGBEACfyANLQALQQd2BEAgDSgCBAwBCyANLQALC0EBSwRAIBMgDRBHNgIIIAIgE0EIakEBEJsCIA0QZiACKAIAEJUBNgIACyADQbABcSIDQRBHBEAgASADQSBGBH8gAigCAAUgAAs2AgALIBNBEGokAA8LAkACQAJAAkACQAJAIAggFGosAAAOBQABAwIEBQsgASACKAIANgIADAQLIAEgAigCADYCACAGQSAgBigCACgCHBECACEPIAIgAigCACIQQQFqNgIAIBAgDzoAAAwDCwJ/IA0tAAtBB3YEQCANKAIEDAELIA0tAAsLRQ0CAn8gDS0AC0EHdgRAIA0oAgAMAQsgDQstAAAhDyACIAIoAgAiEEEBajYCACAQIA86AAAMAgsCfyAMLQALQQd2BEAgDCgCBAwBCyAMLQALC0UNASAWRQ0BIAIgDBBHIAwQZiACKAIAEJUBNgIADAELIAIoAgAhFyAEIAdqIgQhEQNAAkAgBSARTQ0AIBEsAAAiD0EATgR/IAYoAgggD0H/AXFBAXRqLwEAQYAQcUEARwVBAAtFDQAgEUEBaiERDAELCyAOIg9BAEoEQANAAkAgBCARTw0AIA9FDQAgEUEBayIRLQAAIRAgAiACKAIAIhJBAWo2AgAgEiAQOgAAIA9BAWshDwwBCwsgDwR/IAZBMCAGKAIAKAIcEQIABUEACyESA0AgAiACKAIAIhBBAWo2AgAgD0EASgRAIBAgEjoAACAPQQFrIQ8MAQsLIBAgCToAAAsCQCAEIBFGBEAgBkEwIAYoAgAoAhwRAgAhDyACIAIoAgAiEEEBajYCACAQIA86AAAMAQsCfyALLQALQQd2BEAgCygCBAwBCyALLQALCwR/An8gCy0AC0EHdgRAIAsoAgAMAQsgCwssAAAFQX8LIRJBACEPQQAhEANAIAQgEUYNAQJAIA8gEkcEQCAPIRUMAQsgAiACKAIAIhJBAWo2AgAgEiAKOgAAQQAhFQJ/IAstAAtBB3YEQCALKAIEDAELIAstAAsLIBBBAWoiEE0EQCAPIRIMAQsCfyALLQALQQd2BEAgCygCAAwBCyALCyAQai0AAEH/AEYEQEF/IRIMAQsCfyALLQALQQd2BEAgCygCAAwBCyALCyAQaiwAACESCyARQQFrIhEtAAAhDyACIAIoAgAiGEEBajYCACAYIA86AAAgFUEBaiEPDAALAAsgFyACKAIAEGsLIBRBAWohFAwACwALxQMBAX8jAEEQayIKJAAgCQJ/IAAEQCACEJ0CIQACQCABBEAgCiAAIAAoAgAoAiwRAwAgAyAKKAIANgAAIAogACAAKAIAKAIgEQMADAELIAogACAAKAIAKAIoEQMAIAMgCigCADYAACAKIAAgACgCACgCHBEDAAsgCCAKEDkgChAcGiAEIAAgACgCACgCDBEAADoAACAFIAAgACgCACgCEBEAADoAACAKIAAgACgCACgCFBEDACAGIAoQOSAKEBwaIAogACAAKAIAKAIYEQMAIAcgChA5IAoQHBogACAAKAIAKAIkEQAADAELIAIQnAIhAAJAIAEEQCAKIAAgACgCACgCLBEDACADIAooAgA2AAAgCiAAIAAoAgAoAiARAwAMAQsgCiAAIAAoAgAoAigRAwAgAyAKKAIANgAAIAogACAAKAIAKAIcEQMACyAIIAoQOSAKEBwaIAQgACAAKAIAKAIMEQAAOgAAIAUgACAAKAIAKAIQEQAAOgAAIAogACAAKAIAKAIUEQMAIAYgChA5IAoQHBogCiAAIAAoAgAoAhgRAwAgByAKEDkgChAcGiAAIAAoAgAoAiQRAAALNgIAIApBEGokAAs3AQF/IwBBEGsiAiQAIAIgACgCADYCCCACIAIoAgggAUECdGo2AgggAigCCCEAIAJBEGokACAACwoAIABBhJ4CEGcLCgAgAEGMngIQZwsfAQF/IAEoAgAQtgIhAiAAIAEoAgA2AgQgACACNgIAC/8XAQp/IwBBsARrIgskACALIAo2AqQEIAsgATYCqAQgC0E4NgJgIAsgC0GIAWogC0GQAWogC0HgAGoiARAsIg8oAgAiCjYChAEgCyAKQZADajYCgAEgARAgIREgC0HQAGoQICEOIAtBQGsQICEMIAtBMGoQICENIAtBIGoQICEQIwBBEGsiASQAIAsCfyACBEAgASADEJcCIgIiAyADKAIAKAIsEQMAIAsgASgCADYAeCABIAIgAigCACgCIBEDACANIAEQUyABEBwaIAEgAiACKAIAKAIcEQMAIAwgARBTIAEQHBogCyACIAIoAgAoAgwRAAA2AnQgCyACIAIoAgAoAhARAAA2AnAgASACIAIoAgAoAhQRAwAgESABEDkgARAcGiABIAIgAigCACgCGBEDACAOIAEQUyABEBwaIAIgAigCACgCJBEAAAwBCyABIAMQlgIiAiIDIAMoAgAoAiwRAwAgCyABKAIANgB4IAEgAiACKAIAKAIgEQMAIA0gARBTIAEQHBogASACIAIoAgAoAhwRAwAgDCABEFMgARAcGiALIAIgAigCACgCDBEAADYCdCALIAIgAigCACgCEBEAADYCcCABIAIgAigCACgCFBEDACARIAEQOSABEBwaIAEgAiACKAIAKAIYEQMAIA4gARBTIAEQHBogAiACKAIAKAIkEQAACzYCHCABQRBqJAAgCSAIKAIANgIAIARBgARxIhJBCXYhE0EAIQFBACECA0AgAiEKAkACQAJAAkAgAUEERg0AIAAgC0GoBGoQPUUNAEEAIQQCQAJAAkACQAJAAkAgC0H4AGogAWosAAAOBQEABAMFCQsgAUEDRg0HIAdBgMAAAn8gACgCACICKAIMIgMgAigCEEYEQCACIAIoAgAoAiQRAAAMAQsgAygCAAsgBygCACgCDBEEAARAIAtBEGogABCYAiAQIAsoAhAQqgEMAgsgBSAFKAIAQQRyNgIAQQAhAAwGCyABQQNGDQYLA0AgACALQagEahA9RQ0GIAdBgMAAAn8gACgCACICKAIMIgMgAigCEEYEQCACIAIoAgAoAiQRAAAMAQsgAygCAAsgBygCACgCDBEEAEUNBiALQRBqIAAQmAIgECALKAIQEKoBDAALAAsCfyAMLQALQQd2BEAgDCgCBAwBCyAMLQALC0EAAn8gDS0AC0EHdgRAIA0oAgQMAQsgDS0ACwtrRg0EAkACfyAMLQAL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AA8gBiAFOgAOIAYgBDoADSAGQSU6AAwgBQRAIAZBDWogBkEOahCjAgsgAiABIAIoAgAgAWsgBkEMaiADIAAoAgAQEyABajYCACAGQRBqJAALQQAgASACIAMgBEEEEFQhASADLQAAQQRxRQRAIAAgAUHQD2ogAUHsDmogASABQeQASBsgAUHFAEgbQewOazYCAAsLQAAgAiADIABBCGogACgCCCgCBBEAACIAIABBoAJqIAUgBEEAEJwBIABrIgBBnwJMBEAgASAAQQxtQQxvNgIACwtAACACIAMgAEEIaiAAKAIIKAIAEQAAIgAgAEGoAWogBSAEQQAQnAEgAGsiAEGnAUwEQCABIABBDG1BB282AgALC0EAIAEgAiADIARBBBBVIQEgAy0AAEEEcUUEQCAAIAFB0A9qIAFB7A5qIAEgAUHkAEgbIAFBxQBIG0HsDms2AgALC0AAIAIgAyAAQQhqIAAoAggoAgQRAAAiACAAQaACaiAFIARBABCeASAAayIAQZ8CTARAIAEgAEEMbUEMbzYCAAsLmwQBA38gASAAIAFGIgI6AAwCQCACDQADQCABKAIIIgItAAwNAQJAAn8gAiACKAIIIgMoAgAiBEYEQAJAIAMoAgQiBEUNACAELQAMDQAMAwsCQCABIAIoAgBGBEAgAiEBDAELIAIgAigCBCIBKAIAIgA2AgQgASAABH8gACACNgIIIAIoAggFIAMLNgIIIAIoAggiACAAKAIAIAJHQQJ0aiABNgIAIAEgAjYCACACIAE2AgggASgCCCEDCyABQQE6AAwgA0EAOgAMIAMgAygCACIAKAIEIgE2AgAgAQRAIAEgAzYCCAsgACADKAIINgIIIAMoAggiASABKAIAIANHQQJ0aiAANgIAIAAgAzYCBCADQQhqDAELAkAgBEUNACAELQAMDQAMAgsCQCABIAIoAgBHBEAgAiEBDAELIAIgASgCBCIANgIAIAEgAAR/IAAgAjYCCCACKAIIBSADCzYCCCACKAIIIgAgACgCACACR0ECdGogATYCACABIAI2AgQgAiABNgIIIAEoAgghAwsgAUEBOgAMIANBADoADCADIAMoAgQiACgCACIBNgIEIAEEQCABIAM2AggLIAAgAygCCDYCCCADKAIIIgEgASgCACADR0ECdGogADYCACAAIAM2AgAgA0EIagsgADYC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KAIcIgJFDQAgAigCACAIRw0AAkACQCACKAIEIg5BOWsOOQECAgICAgICAgICAgECAgIBAgICAgICAgICAgICAgICAgIBAgICAgICAgICAgIBAgICAgICAgICAQALIA5BmgVGDQAgDkEqRw0BCyARQQVLDQACQAJAIAgoAgxFDQAgCCgCBCIBBEAgCCgCAEUNAQsgDkGaBUcNASARQQRGDQELIAhBkI0BKAIANgIYDAELAkACQCAIKAIQRQ0AIAIoAighAyACIBE2AigCQCACKAIUBEAgAhA1AkAgCCgCECIOIAIoAhQiEiAOIBJJGyIBRQ0AIAgoAgwgAigCECABEB4aIAggCCgCDCABajYCDCACIAIoAhAgAWo2AhAgCCAIKAIUIAFqNgIUIAggCCgCECABayIONgIQIAIgAigCFCABayISNgIUIBINACACIAIoAgg2AhBBACESCyAOBEAgAigCBCEODAILDAMLIAENACARQQF0QXdBACARQQRLG2ogA0EBdEF3QQAgA0EEShtqSg0AIBFBBEYNAAwBCwJAAkACQAJAAkAgDkEqRwRAIA5BmgVHDQEgCCgCBEUNAgwGCyACKAIwQQx0QYDwAWshAUEAIQMCQCACKAKIAUEBSg0AIAIoAoQBIgRBAkgNAEHAACEDIARBBkkNAEGAAUHAASAEQQZGGyEDCyACIBJBAWo2AhQgAigCCCASaiABIANyIgFBIHIgASACKAJsGyIDQQh2OgAAIAIgAigCFCIBQQFqNgIUIAEgAigCCGogA0EfcCADckEfczoAACACKAJsBEAgCCgCMCEDIAIgAigCFCIBQQFqNgIUIAEgAigCCGogA0EYdjoAACACIAIoAhQiAUEBajYCFCABIAIoAghqIANBEHY6AAAgCCgCMCEDIAIgAigCFCIBQQFqNgIUIAEgAigCCGogA0EIdjoAACACIAIoAhQiAUEBajYCFCABIAIoAghqIAM6AAALIAhBAEEAQQAQfzYCMCACQfEANgIEIAgQcyACKAIUDQYgAigCBCEOCwJAAkACQAJAAkACQCAOQTlGBH8gCEEAQQBBABBKNgIwIAIgAigCFCIBQQFqNgIUIAEgAigCCGpBHzoAACACIAIoAhQiAUEBajYCFCABIAIoAghqQYsBOgAAIAIgAigCFCIBQQFqNgIUIAEgAigCCGpBCDoA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ASACKAIIaiACQbktai0AADoAACACQQJBECACKAK8LSIBa3YiAzsBuC0gAUENawwBCyABQQNqCyIBNgK8LSACAn8gAUEKTgRAIAIgAigCFCIBQQFqNgIUIAEgAigCCGogAzoAACACIAIoAhQiAUEBajYCFCABIAIoAghqIAJBuS1qLQAAOgAAQQAhAyACQQA7AbgtIAIoArwtQQlrDAELIAFBB2oLIgE2ArwtAkAgAgJ/IAFBEEYEQCACIAIoAhQiAUEBajYCFCABIAIoAghqIAM6AAAgAiACKAIUIgFBAWo2AhQgASACKAIIaiACQbktai0AADoAACACQQA7AbgtQQAMAQsgAUEISA0BIAIgAigCFCIBQQFqNgIUIAEgAigCCGogAzoAACACIAJBuS1qLQAAOwG4LSACKAK8LUEIaws2ArwtCwwBCyACQQBBAEEAEIoBIBFBA0cNACACKAJEIgMgAigCTEEBdEECayIBakEAOwEAIANBACABECEaIAIoAnQNACACQQA2ArQtIAJBADYCXCACQQA2AmwLIAgQcyAIKAIQDQAMAwsgEUEERw0DIAIoAhgiAUEATA0DIAgoAjAhAwJAIAFBAkYEQCACIAIoAhQiAUEBajYCFCABIAIoAghqIAM6AAAgCCgCMCEDIAIgAigCFCIBQQFqNgIUIAEgAigCCGogA0EIdjoAACAILwEyIQMgAiACKAIUIgFBAWo2AhQgASACKAIIaiADOgAAIAgtADMhAyACIAIoAhQiAUEBajYCFCABIAIoAghqIAM6AAAgCCgCCCEDIAIgAigCFCIBQQFqNgIUIAEgAigCCGogAzoAACAIKAIIIQMgAiACKAIUIgFBAWo2AhQgASACKAIIaiADQQh2OgAAIAgvAQohAyACIAIoAhQiAUEBajYCFCABIAIoAghqIAM6AAAgCC0ACyEDDAELIAIgAigCFCIBQQFqNgIUIAEgAigCCGogA0EYdjoAACACIAIoAhQiAUEBajYCFCABIAIoAghqIANBEHY6AAAgCCgCMCEDIAIgAigCFCIBQQFqNgIUIAEgAigCCGogA0EIdjoAAAsgAiACKAIUIgFBAWo2AhQgASACKAIIaiADOgAAIAgQcyACKAIYIgFBAEoEQCACQQAgAWs2AhgLIAIoAhQaDAMLIAJBfzYCKAwCCyAIQZyNASgCADYC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ECACQYAUOwESIAJB4QspAAA3AwggAiACQQhqIgE2AjAgAkE4aiAFIAEgAkEwahBfIAIoAjgiASEDIAEsACdBAEgEQCADKAIcEBsLIAMgAikDGDcCHCADIAIoAiA2AiQgAkEAOgAjIAJBADoAGAJAIAIsABNBAE4NACACKAIIEBsgAiwAI0EATg0AIAIoAhgQGwsgAkEYakEBEIABIAJBADoAESACQfQOLQAAOgAQIAJBCToAEyACQewOKQAANwMIIAIgAkEIaiIBNgIwIAJBOGogBSABIAJBMGoQXyACKAI4IgEhAyABLAAnQQBIBEAgAygCHBAbCyADIAIpAxg3AhwgAyACKAIgNgIkIAJBADoAIyACQQA6ABgCQCACLAATQQBODQAgAigCCBAbIAIsACNBAE4NACACKAIYEBsLIAJBGGpBChCAASACQQA6ABAgAkLtyoXz9qqat8YANwMIIAJBCDoAEyACIAJBCGoiATYCMCACQThqIAUgASACQTBqEF8gAigCOCIBIQMgASwAJ0EASARAIAMoAhwQGwsgAyACKQMYNwIcIAMgAigCIDYCJCACQQA6ACMgAkEAOgAYAkAgAiwAE0EATg0AIAIoAggQGyACLAAjQQBODQAgAigCGBAbCyACQRhqQQUQgAEgAkEAOgAQIAJC7cqF8/aqmrfUADcDCCACQQg6ABMgAiACQQhqIgE2AjAgAkE4aiAFIAEgAkEwahBfIAIoAjgiASEDIAEsACdBAEgEQCADKAIcEBsLIAMgAikDGDcCHCADIAIoAiA2AiQgAkEAOgAjIAJBADoAGAJAIAIsABNBAE4NACACKAIIEBsgAiwAI0EATg0AIAIoAhgQGwsgAkEYakEeEIABIAJBADoAESACQcMULQAAOgAQIAJBCToAEyACQbsUKQAANwMIIAIgAkEIaiIBNgIwIAJBOGogBSABIAJBMGoQXyACKAI4IgEhAyABLAAnQQBIBEAgAygCHBAbCyADIAIpAxg3AhwgAyACKAIgNgIkIAJBADoAIyACQQA6ABgCQCACLAATQQBODQAgAigCCBAbIAIsACNBAE4NACACKAIYEBsLIAJBGGpBCBCAASACQQA6ABEgAkH+Ey0AADoAECACQQk6ABMgAkH2EykAADcDCCACIAJBCGoiATYCMCACQThqIAUgASACQTBqEF8gAigC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ACECIAcEQANAAn8gAygCBCIAIAMoAmhJBEAgAyAAQQFqNgIEIAAtAAAMAQsgAxAkCyIAIAVqLQAhBEAgAiAHaiAAOgAAIAJBAWohAgwBBUEAIQogByEJDAMLAAsACwNAAn8gAygCBCIAIAMoAmhJBEAgAyAAQQFqNgIEIAAtAAAMAQsgAxAkCyAFai0AIQ0AC0EAIQlBACEKCyADKAIEIQAgAygCaARAIAMgAEEBayIANgIECyADKQN4IAAgAygCCGusfCITUA0HIAtB4wBGIBIgE1JxDQcCQCAMRQ0AIAhFBEAgByAKNgIADAELIAcgCTYCAAsgBA0AIAoEQCAKIAJBAnRqQQA2AgALIAlFBEBBACEJDAELIAIgCWpBADoAAAsgAygCBCADKAIIa6wgAykDeCAUfHwhFCANIAdBAEdqIQ0LIAFBAWohAiABLQABIgENAQwGCwtBACEJDAELQQAhCUEAIQoLIA0NAQtBfyENCyAMRQ0AIAkQGyAKEBsLIAVBsAJqJAAgDSEAIANBkAFqJAAgAAtDAAJAIABFDQACQAJAAkACQCABQQJqDgYAAQICBAMECyAAIAI8AAAPCyAAIAI9AQAPCyAAIAI+AgAPCyAAIAI3AwALC7QDAgN/AX4jAEEgayIDJAACQCABQv///////////wCDIgVCgICAgICAwMA/fSAFQoCAgICAgMC/wAB9VARAIAFCGYinIQQgAFAgAUL///8PgyIFQoCAgAhUIAVCgICACFEbRQRAIARBgYCAgARqIQIMAgsgBEGAgICABGohAiAAIAVCgICACIWEQgBSDQEgAiAEQQFxaiECDAELIABQIAVCgICAgICAwP//AFQgBUKAgICAgIDA//8AURtFBEAgAUIZiKdB////AXFBgICA/gdyIQIMAQtBgICA/AchAiAFQv///////7+/wABWDQBBACECIAVCMIinIgRBkf4ASQ0AIANBEGogACABQv///////z+DQoCAgICAgMAAhCIFIARBgf4AaxA8IAMgACAFQYH/ACAEaxBuIAMpAwgiAEIZiKchAiADKQMAIAMpAxAgAykDGIRCAFKthCIFUCAAQv///w+DIgBCgICACFQgAEKAgIAIURtFBEAgAkEBaiECDAELIAUgAEKAgIAIhYRCAFINACACQQFxIAJqIQILIANBIGokACACIAFCIIinQYCAgIB4cXK+C6oPAgV/Dn4jAEHQAmsiBSQAIARC////////P4MhCyACQv///////z+DIQogAiAEhUKAgICAgICAgIB/gyENIARCMIinQf//AXEhCAJAAkAgAkIwiKdB//8BcSIJQQFrQf3/AU0EQCAIQQFrQf7/AUkNAQsgAVAgAkL///////////8AgyIMQoCAgICAgMD//wBUIAxCgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhDQwCCyADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURtFBEAgBEKAgICAgIAghCENIAMhAQwCCyABIAxCgICAgICAwP//AIWEUARAIAMgAkKAgICAgIDA//8AhYRQBEBCACEBQoCAgICAgOD//wAhDQwDCyANQoCAgICAgMD//wCEIQ1CACEBDAILIAMgAkKAgICAgIDA//8AhYRQBEBCACEBDAILIAEgDIRQBEBCgICAgICA4P//ACANIAIgA4RQGyENQgAhAQwCCyACIAOEUARAIA1CgICAgICAwP//AIQhDUIAIQEMAgsgDEL///////8/WARAIAVBwAJqIAEgCiABIAogClAiBht5IAZBBnStfKciBkEPaxA8QRAgBmshBiAFKQPIAiEKIAUpA8ACIQELIAJC////////P1YNACAFQbACaiADIAsgAyALIAtQIgcbeSAHQQZ0rXynIgdBD2sQPCAGIAdqQRBrIQYgBSkDuAIhCyAFKQOwAiEDCyAFQaACaiALQoCAgICAgMAAhCISQg+GIANCMYiEIgJCAEKAgICAsOa8gvUAIAJ9IgRCABA4IAVBkAJqQgAgBSkDqAJ9QgAgBEIAEDggBUGAAmogBSkDmAJCAYYgBSkDkAJCP4iEIgRCACACQgAQOCAFQfABaiAEQgBCACAFKQOIAn1CABA4IAVB4AFqIAUpA/gBQgGGIAUpA/ABQj+IhCIEQgAgAkIAEDggBUHQAWogBEIAQgAgBSkD6AF9QgAQOCAFQcABaiAFKQPYAUIBhiAFKQPQAUI/iIQiBEIAIAJCABA4IAVBsAFqIARCAEIAIAUpA8gBfUIAEDggBUGgAWogAkIAIAUpA7gBQgGGIAUpA7ABQj+IhEIBfSICQgAQOCAFQZABaiADQg+GQgAgAkIAEDggBUHw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QS5HIAtB4QBrQQZPcQ0EIAVBLkcNACAEDQJBASEEIBQhFwwBCyALQdcAayAIIAVBOUobIQUCQCAUQgdXBEAgBSAJQQR0aiEJDAELIBRCHFgEQCACQTBqIAUQSCACQSBqIBkgFUIAQoCAgICAgMD9PxAnIAJBEGogAikDICIZIAIpAygiFSACKQMwIAIpAzgQJyACIBYgGCACKQMQIAIpAxgQRCACKQMIIRggAikDACEWDAELIAVFDQAgBw0AIAJB0ABqIBkgFUIAQoCAgICAgID/PxAnIAJBQGsgFiAYIAIpA1AgAikDWBBEIAIpA0ghGEEBIQcgAikDQCEWCyAUQgF8IRRBASEKCyABKAIEIgUgASgCaEkEfyABIAVBAWo2AgQgBS0AAAUgARAkCyEFDAELC0EuIQULAn4CQAJAIApFBEAgASgCaEUEQCADDQMMAgsgASABKAIEIgVBAWs2AgQgA0UNASABIAVBAms2AgQgBEUNAiABIAVBA2s2AgQMAgsgFEIHVwRAIBQhFQNAIAlBBHQhCSAVQgF8IhVCCFINAAsLAkACQAJAIAVBX3FB0ABGBEAgASADENcCIhVCgICAgICAgICAf1INAyADBEAgASgCaA0CDAMLQgAhFiABQgAQUUIADAYLIAEoAmhFDQELIAEgASgCBEEBazYCBAtCACEVCyAJRQRAIAJB8ABqIAa3RAAAAAAAAAAAohBYIAIpA3AhFiACKQN4DAMLIBcgFCAEG0IChiAVfEIgfSIUQQAgD2utVQRAQaibAkHEADYCACACQaABaiAGEEggAkGQAWogAikDoAEgAikDqAFCf0L///////+///8AECcgAkGAAWogAikDkAEgAikDmAFCf0L///////+///8AECcgAikDgAEhFiACKQOIAQwDCyAPQeIBa6wgFFcEQCAJQQBOBEADQCACQaADaiAWIBhCAEKAgICAgIDA/79/EEQgFiAYQoCAgICAgID/PxDJASEBIAJBkANqIBYgGCAWIAIpA6ADIAFBAEgiAxsgGCACKQOoAyADGxBEIBRCAX0hFCACKQOYAyEYIAIpA5ADIRYgCUEBdCABQQBOciIJQQBODQALCwJ+IBQgD6x9QiB8IhWnIgFBACABQQBKGyAOIBUgDq1TGyIBQfEATgRAIAJBgANqIAYQSCACKQOIAyEXIAIpA4ADIRlCAAwBCyACQeACakQAAAAAAADwP0GQASABaxBhEFggAkHQAmogBhBIIAJB8AJqIAIpA+ACIAIpA+gCIAIpA9ACIhkgAikD2AIiFxDaAiACKQP4AiEaIAIpA/ACCyEVIAJBwAJqIAkgCUEBcUUgFiAYQgBCABBtQQBHIAFBIEhxcSIBahB9IAJBsAJqIBkgFyACKQPAAiACKQPIAhAnIAJBkAJqIAIpA7ACIAIpA7gCIBUgGhBEIAJBoAJqQgAgFiABG0IAIBggARsgGSAXECcgAkGAAmogAikDoAIgAikDqAIgAikDkAIgAikDmAIQRCACQfABaiACKQOAAiACKQOIAiAVIBoQyAEgAikD8AEiFSACKQP4ASIXQgBCABBtRQRAQaibAkHEADYCAAsgAkHgAWogFSAXIBSnENkCIAIpA+ABIRYgAikD6AEMAwtBqJsCQcQANgIAIAJB0AFqIAYQSCACQcABaiACKQPQASACKQPYAUIAQoCAgICAgMAAECcgAkGwAWogAikDwAEgAikDyAFCAEKAgICAgIDAABAnIAIpA7ABIRYgAikDuAEMAgsgAUIAEFELIAJB4ABqIAa3RAAAAAAAAAAAohBYIAIpA2AhFiACKQNoCyEUIAwgFjcDECAMIBQ3AxggAkGwA2okACAMKQMYIRQgDCkDECEVDAYLIAEoAmhFDQAgASABKAIEQQFrNgIECyABIQUgBiEJIAMhCkEAIQZBACEDIwBBkMYAayIEJABBACAOIA9qIhJrIRMCQAJ/A0AgAkEwRwRAAkAgAkEuRw0EIAUoAgQiASAFKAJoTw0AIAUgAUEBajYCBCABLQAADAMLBSAFKAIEIgEgBSgCaEkEf0EBIQYgBSABQQFqNgIEIAEtAAAFQQEhBiAFECQLIQIMAQsLIAUQJAshAkEBIQcgAkEwRw0AA0AgFEIBfSEUAn8gBSgCBCIBIAUoAmhJBEAgBSABQQFqNgIEIAEtAAAMAQsgBRAkCyICQTBGDQALQQEhBgsgBEEANgKQBgJ+AkACQAJAAkACQCACQS5GIgFFIAJBMGsiCEEJS3FFBEADQAJAIAFBAXEEQCAHRQRAIBUhFEEBIQcMAgsgBkUhAQwECyAVQgF8IRUgA0H8D0wEQCANIBWnIAJBMEYbIQ0gBEGQBmogA0ECdGoiASALBH8gAiABKAIAQQpsakEwawUgCAs2AgBBASEGQQAgC0EBaiIBIAFBCUYiARshCyABIANqIQMMAQsgAkEwRg0AIAQgBCgCgEZBAXI2AoBGQdyPASENCwJ/IAUoAgQiASAFKAJoSQRAIAUgAUEBajYCBCABLQAADAELIAUQJAsiAkEwayEIIAJBLkYiAQ0AIAhBCkkNAAsLIBQgFSAHGyEUAkAgBkUNACACQV9xQcUARw0AAkAgBSAKENcCIhZCgICAgICAgICAf1INACAKRQ0FQgAhFiAFKAJoRQ0AIAUgBSgCBEEBazYCBAsgBkUNAyAUIBZ8IRQMBQsgBkUhASACQQBIDQELIAUoAmhFDQAgBSAFKAIEQQFrNgIECyABRQ0CC0GomwJBHDYCAAtCACEVIAVCABBRQgAMAQsgBCgCkAYiAUUEQCAEIAm3RAAAAAAAAAAAohBYIAQpAwAhFSAEKQMIDAELAkAgFUIJVQ0AIBQgFVINACAOQR5MQQAgASAOdhsNACAEQTBqIAkQSCAEQSBqIAEQfSAEQRBqIAQpAzAgBCkDOCAEKQMgIAQpAygQJyAEKQMQIRUgBCkDGAwBCyAPQX5trSAUUwRAQaibAkHEADYCACAEQeAAaiAJEEggBEHQAGogBCkDYCAEKQNoQn9C////////v///ABAnIARBQGsgBCkDUCAEKQNYQn9C////////v///ABAnIAQpA0AhFSAEKQNIDAELIA9B4gFrrCAUVQRAQaibAkHEADYCACAEQZABaiAJEEggBEGAAWogBCkDkAEgBCkDmAFCAEKAgICAgIDAABAnIARB8ABqIAQpA4ABIAQpA4gBQgBCgICAgICAwAAQJyAEKQNwIRUgBCkDeAwBCyALBEAgC0EITARAIARBkAZqIANBAnRqIgEoAgAhBQNAIAVBCmwhBSALQQFqIgtBCUcNAAsgASAFNgIACyADQQFqIQMLIBSnIQcCQCANQQlODQAgByANSA0AIAdBEUoNACAHQQlGBEAgBEHAAWogCRBIIARBsAFqIAQoApAGEH0gBEGgAWogBCkDwAEgBCkDyAEgBCkDsAEgBCkDuAEQJyAEKQOgASEVIAQpA6gBDAILIAdBCEwEQCAEQZACaiAJEEggBEGAAmogBCgCkAYQfSAEQfABaiAEKQOQAiAEKQOYAiAEKQOAAiAEKQOIAhAnIARB4AFqQQAgB2tBAnRBkK4BaigCABBIIARB0AFqIAQpA/ABIAQpA/gBIAQpA+ABIAQpA+gBENQCIAQpA9ABIRUgBCkD2AEMAgsgDiAHQX1sakEbaiIBQR5MQQAgBCgCkAYiAiABdhsNACAEQeACaiAJEEggBEHQAmogAhB9IARBwAJqIAQpA+ACIAQpA+gCIAQpA9ACIAQpA9gCECcgBEGwAmogB0ECdEHIrQFqKAIAEEggBEGgAmogBCkDwAIgBCkDyAIgBCkDsAIgBCkDuAIQJyAEKQOgAiEVIAQpA6gCDAELA0AgBEGQBmogAyICQQFrIgNBAnRqKAIARQ0AC0EAIQsCQCAHQQlvIgFFBEBBACEBDAELIAEgAUEJaiAHQQBOGyEDAkAgAkUEQEEAIQFBACECDAELQYCU69wDQQAgA2tBAnRBkK4BaigCACIGbSEKQQAhCEEAIQVBACEBA0AgBEGQBmogBUECdGoiDSAIIA0oAgAiDSAGbiIQaiIINgIAIAFBAWpB/w9xIAEgCEUgASAFRnEiCBshASAHQQlrIAcgCBshByAKIA0gBiAQbGtsIQggBUEBaiIFIAJHDQALIAhFDQAgBEGQBmogAkECdGogCDYCACACQQFqIQILIAcgA2tBCWohBwsDQCAEQZAGaiABQQJ0aiEFAkADQCAHQSROBEAgB0EkRw0CIAUoAgBB0en5BE8NAgsgAkH/D2ohBkEAIQgDQCAIrSAEQZAGaiAGQf8PcSIDQQJ0aiIGNQIAQh2GfCIUQoGU69wDVAR/QQAFIBQgFEKAlOvcA4AiFUKAlOvcA359IRQgFacLIQggBiAUpyIGNgIAIAIgAiACIAMgBhsgASADRhsgAyACQQFrQf8PcUcbIQIgA0EBayEGIAEgA0cNAAsgC0EdayELIAhFDQALIAIgAUEBa0H/D3EiAUYEQCAEQZAGaiIDIAJB/g9qQf8PcUECdGoiBiAGKAIAIAJBAWtB/w9xIgJBAnQgA2ooAgByNgIACyAHQQlqIQcgBEGQBmogAUECdGogCDYCAAwBCwsCQANAIAJBAWpB/w9xIQMgBEGQBmogAkEBa0H/D3FBAnRqIQgDQEEJQQEgB0EtShshCgJAA0AgASEGQQAhBQJAA0ACQCAFIAZqQf8PcSIBIAJGDQAgBEGQBmogAUECdGooAgAiASAFQQJ0QeCtAWooAgAiDUkNACABIA1LDQIgBUEBaiIFQQRHDQELCyAHQSRHDQBCACEUQQAhBUIAIRUDQCACIAUgBmpB/w9xIgFGBEAgAkEBakH/D3EiAkECdCAEakEANgKMBgsgBEGABmogFCAVQgBCgICAgOWat47AABAnIARB8AVqIARBkAZqIAFBAnRqKAIAEH0gBEHgBWogBCkDgAYgBCkDiAYgBCkD8AUgBCkD+AUQRCAEKQPoBSEVIAQpA+AFIRQgBUEBaiIFQQRHDQALIARB0AVqIAkQSCAEQcAFaiAUIBUgBCkD0AUgBCkD2AUQJyAEKQPIBSEVQgAhFCAEKQPABSEWIAtB8QBqIgcgD2siA0EAIANBAEobIA4gAyAOSCIFGyIBQfAATA0CDAULIAogC2ohCyAGIAIiAUYNAAtBgJTr3AMgCnYhDUF/IAp0QX9zIRBBACEFIAYhAQNAIARBkAZqIAZBAnRqIhEgBSARKAIAIhEgCnZqIgU2AgAgAUEBakH/D3EgASAFRSABIAZGcSIFGyEBIAdBCWsgByAFGyEHIBAgEXEgDWwhBSAGQQFqQf8PcSIGIAJHDQALIAVFDQEgASADRwRAIARBkAZqIAJBAnRqIAU2AgAgAyECDAMLIAggCCgCAEEBcjYCACADIQEMAQsLCyAEQZAFakQAAAAAAADwP0HhASABaxBhEFggBEGwBWogBCkDkAUgBCkDmAUgFiAVENoCIAQpA7gFIRkgBCkDsAUhGCAEQYAFakQAAAAAAADwP0HxACABaxBhEFggBEGgBWogFiAVIAQpA4AFIAQpA4gFEN8BIARB8ARqIBYgFSAEKQOgBSIUIAQpA6gFIhcQyAEgBEHgBGogGCAZIAQpA/AEIAQpA/gEEEQgBCkD6AQhFSAEKQPgBCEWCwJAIAZBBGpB/w9xIgogAkYNAAJAIARBkAZqIApBAnRqKAIAIgpB/8m17gFNBEAgCkUgBkEFakH/D3EgAkZxDQEgBEHwA2ogCbdEAAAAAAAA0D+iEFggBEHgA2ogFCAXIAQpA/ADIAQpA/gDEEQgBCkD6AMhFyAEKQPgAyEUDAELIApBgMq17gFHBEAgBEHQBGogCbdEAAAAAAAA6D+iEFggBEHABGogFCAXIAQpA9AEIAQpA9gEEEQgBCkDyAQhFyAEKQPABCEUDAELIAm3IRsgAiAGQQVqQf8PcUYEQCAEQZAEaiAbRAAAAAAAAOA/ohBYIARBgARqIBQgFyAEKQOQBCAEKQOYBBBEIAQpA4gEIRcgBCkDgAQhFAwBCyAEQbAEaiAbRAAAAAAAAOg/ohBYIARBoARqIBQgFyAEKQOwBCAEKQO4BBBEIAQpA6gEIRcgBCkDoAQhFAsgAUHvAEoNACAEQdADaiAUIBdCAEKAgICAgIDA/z8Q3wEgBCkD0AMgBCkD2ANCAEIAEG0NACAEQcADaiAUIBdCAEKAgICAgIDA/z8QRCAEKQPIAyEXIAQpA8ADIRQLIARBsANqIBYgFSAUIBcQRCAEQaADaiAEKQOwAyAEKQO4AyAYIBkQyAEgBCkDqAMhFSAEKQOgAyEWAkBBfiASayAHQf////8HcU4NACAEIBVC////////////AIM3A5gDIAQgFjcDkAMgBEGAA2ogFiAVQgBCgICAgICAgP8/ECcgBCkDkAMiGCAEKQOYAyIZQoCAgICAgIC4wAAQyQEhAiAVIAQpA4gDIAJBAEgiBhshFSAWIAQpA4ADIAYbIRYgEyALIAJBAE5qIgtB7gBqTgRAIAUgBSABIANHcSAYIBlCgICAgICAgLjAABDJAUEASBtBAUcNASAUIBdCAEIAEG1FDQELQaibAkHEADYCAAsgBEHwAmogFiAVIAsQ2QIgBCkD8AIhFSAEKQP4AgshFCAMIBU3AyAgDCAUNwMoIARBkMYAaiQAIAwpAyghFCAMKQMgIRUMBAsgASgCaARAIAEgASgCBEEBazYCBAsMAQsCQAJ/IAEoAgQiAiABKAJoSQRAIAEgAkEBajYCBCACLQAADAELIAEQJAtBKEYEQEEBIQUMAQtCgICAgICA4P//ACEUIAEoAmhFDQMgASABKAIEQQFrNgIEDAMLA0ACfyABKAIEIgIgASgCaEkEQCABIAJBAWo2AgQgAi0AAAwBCyABECQLIgJBwQBrIQYCQAJAIAJBMGtBCkkNACAGQRpJDQAgAkHfAEYNACACQeEAa0EaTw0BCyAFQQFqIQUMAQsLQoCAgICAgOD//wAhFCACQSlGDQIgASgCaCICBEAgASABKAIEQQFrNgIECyADBEAgBUUNAwNAIAVBAWshBSACBEAgASABKAIEQQFrNgIECyAFDQALDAMLC0GomwJBHDYCACABQgAQUQtCACEUCyAAIBU3AwAgACAUNwMIIAxBMGokAAu/AgEBfyMAQdAAayIEJAACQCADQYCAAU4EQCAEQSBqIAEgAkIAQoCAgICAgID//wAQJyAEKQMoIQIgBCkDICEBIANB//8BSQRAIANB//8AayEDDAILIARBEGogASACQgBCgICAgICAgP//ABAnIANB/f8CIANB/f8CSRtB/v8BayEDIAQpAxghAiAEKQMQIQEMAQsgA0GBgH9KDQAgBEFAayABIAJCAEKAgICAgIDAABAnIAQpA0ghAiAEKQNAIQEgA0GDgH5LBEAgA0H+/wBqIQMMAQsgBEEwaiABIAJCAEKAgICAgIDAABAnIANBhoB9IANBhoB9SxtB/P8BaiEDIAQpAzghAiAEKQMwIQELIAQgASACQgAgA0H//wBqrUIwhhAnIAAgBCkDCDcDCCAAIAQpAwA3AwAgBEHQAGokAAs1ACAAIAE3AwAgACACQv///////z+DIARCMIinQYCAAnEgAkIwiKdB//8BcXKtQjCGhDcDCAu4AQEBfyABQQBHIQICQAJAAkAgAEEDcUUNACABRQ0AA0AgAC0AAEUNAiABQQFrIgFBAEchAiAAQQFqIgBBA3FFDQEgAQ0ACwsgAkUNAQsCQCAALQAARQ0AIAFBBEkNAANAIAAoAgAiAkF/cyACQYGChAhrcUGAgYKEeHENASAAQQRqIQAgAUEEayIBQQNLDQALCyABRQ0AA0AgAC0AAEUEQCAADwsgAEEBaiEAIAFBAWsiAQ0ACwtBAAurFwMUfwR8AX4jAEEwayIJJAACQAJAAkAgAL0iGkIgiKciA0H/////B3EiBEH61L2ABE0EQCADQf//P3FB+8MkRg0BIARB/LKLgARNBEAgGkIAWQRAIAEgAEQAAEBU+yH5v6AiAEQxY2IaYbTQvaAiFjkDACABIAAgFqFEMWNiGmG00L2gOQMIQQEhAwwFCyABIABEAABAVPsh+T+gIgBEMWNiGmG00D2gIhY5AwAgASAAIBahRDFjYhphtNA9oDkDCEF/IQMMBAsgGkIAWQRAIAEgAEQAAEBU+yEJwKAiAEQxY2IaYbTgvaAiFjkDACABIAAgFqFEMWNiGmG04L2gOQMIQQIhAwwECyABIABEAABAVPshCUCgIgBEMWNiGmG04D2gIhY5AwAgASAAIBahRDFjYhphtOA9oDkDCEF+IQMMAwsgBEG7jPGABE0EQCAEQbz714AETQRAIARB/LLLgARGDQIgGkIAWQRAIAEgAEQAADB/fNkSwKAiAETKlJOnkQ7pvaAiFjkDACABIAAgFqFEypSTp5EO6b2gOQMIQQMhAwwFCyABIABEAAAwf3zZEkCgIgBEypSTp5EO6T2gIhY5AwAgASAAIBahRMqUk6eRDuk9oDkDCEF9IQMMBAsgBEH7w+SABEYNASAaQgBZBEAgASAARAAAQFT7IRnAoCIARDFjYhphtPC9oCIWOQMAIAEgACAWoUQxY2IaYbTwvaA5AwhBBCEDDAQLIAEgAEQAAEBU+yEZQKAiAEQxY2IaYbTwPaAiFjkDACABIAAgFqFEMWNiGmG08D2gOQMIQXwhAwwDCyAEQfrD5IkESw0BCyABIAAgAESDyMltMF/kP6JEAAAAAAAAOEOgRAAAAAAAADjDoCIXRAAAQFT7Ifm/oqAiFiAXRDFjYhphtNA9oiIZoSIAOQMAIARBFHYiAiAAvUI0iKdB/w9xa0ERSCEEAn8gF5lEAAAAAAAA4EFjBEAgF6oMAQtBgICAgHgLIQMCQCAEDQAgASAWIBdEAABgGmG00D2iIgChIhggF0RzcAMuihmjO6IgFiAYoSAAoaEiGaEiADkDACACIAC9QjSIp0H/D3FrQTJIBEAgGCEWDAELIAEgGCAXRAAAAC6KGaM7oiIAoSIWIBdEwUkgJZqDezmiIBggFqEgAKGhIhmhIgA5AwALIAEgFiAAoSAZoTkDCAwBCyAEQYCAwP8HTwRAIAEgACAAoSIAOQMAIAEgADkDCEEAIQMMAQsgGkL/////////B4NCgICAgICAgLDBAIS/IQBBACEDQQEhAgNAIAlBEGogA0EDdGoCfyAAmUQAAAAAAADgQWMEQCAAqgwBC0GAgICAeAu3IhY5AwAgACAWoUQAAAAAAABwQaIhAEEBIQMgAkEBcSEHQQAhAiAHDQALIAkgADkDIAJAIABEAAAAAAAAAABiBEBBAiEDDAELQQEhAgNAIAIiA0EBayECIAlBEGogA0EDdGorAwBEAAAAAAAAAABhDQALCyAJQRBqIQ4jAEGwBGsiBiQAIARBFHZBlghrIgJBA2tBGG0iBEEAIARBAEobIg9BaGwgAmohBEHElwEoAgAiCiADQQFqIgxBAWsiCGpBAE4EQCAKIAxqIQMgDyAIayECA0AgBkHAAmogBUEDdGogAkEASAR8RAAAAAAAAAAABSACQQJ0QdCXAWooAgC3CzkDACACQQFqIQIgBUEBaiIFIANHDQALCyAEQRhrIQcgCkEAIApBAEobIQVBACEDA0BEAAAAAAAAAAAhACAMQQBKBEAgAyAIaiELQQAhAgNAIAAgDiACQQN0aisDACAGQcACaiALIAJrQQN0aisDAKKgIQAgAkEBaiICIAxHDQALCyAGIANBA3RqIAA5AwAgAyAFRiECIANBAWohAyACRQ0AC0EvIARrIRJBMCAEayEQIARBGWshEyAKIQMCQANAIAYgA0EDdGorAwAhAEEAIQIgAyEFIANBAEwiDUUEQANAIAZB4ANqIAJBAnRqAn8gAAJ/IABEAAAAAAAAcD6iIgCZRAAAAAAAAOBBYwRAIACqDAELQYCAgIB4C7ciAEQAAAAAAABwwaKgIhaZRAAAAAAAAOBBYwRAIBaqDAELQYCAgIB4CzYCACAGIAVBAWsiBUEDdGorAwAgAKAhACACQQFqIgIgA0cNAAsLAn8gACAHEGEiACAARAAAAAAAAMA/opxEAAAAAAAAIMCioCIAmUQAAAAAAADgQWMEQCAAqgwBC0GAgICAeAshCCAAIAi3oSEAAkACQAJAAn8gB0EATCIURQRAIANBAnQgBmoiAiACKALcAyICIAIgEHUiAiAQdGsiBTYC3AMgAiAIaiEIIAUgEnUMAQsgBw0BIANBAnQgBmooAtwDQRd1CyILQQBMDQIMAQtBAiELIABEAAAAAAAA4D9mDQBBACELDAELQQAhAkEAIQUgDUUEQANAIAZB4ANqIAJBAnRqIhUoAgAhDUH///8HIRECfwJAIAUNAEGAgIAIIREgDQ0AQQAMAQsgFSARIA1rNgIAQQELIQUgAkEBaiICIANHDQALCwJAIBQNAEH///8DIQICQAJAIBMOAgEAAgtB////ASECCyADQQJ0IAZqIg0gDSgC3AMgAnE2AtwDCyAIQQFqIQggC0ECRw0ARAAAAAAAAPA/IAChIQBBAiELIAVFDQAgAEQAAAAAAADwPyAHEGGhIQALIABEAAAAAAAAAABhBEBBACEFIAMhAgJAIAMgCkwNAANAIAZB4ANqIAJBAWsiAkECdGooAgAgBXIhBSACIApKDQALIAVFDQAgByEEA0AgBEEYayEEIAZB4ANqIANBAWsiA0ECdGooAgBFDQALDAMLQQEhAgNAIAIiBUEBaiECIAZB4ANqIAogBWtBAnRqKAIARQ0ACyADIAVqIQUDQCAGQcACaiADIAxqIghBA3RqIANBAWoiAyAPakECdEHQlwFqKAIAtzkDAEEAIQJEAAAAAAAAAAAhACAMQQBKBEADQCAAIA4gAkEDdGorAwAgBkHAAmogCCACa0EDdGorAwCioCEAIAJBAWoiAiAMRw0ACwsgBiADQQN0aiAAOQMAIAMgBUgNAAsgBSEDDAELCwJAIABBGCAEaxBhIgBEAAAAAAAAcEFmBEAgBkHgA2ogA0ECdGoCfyAAAn8gAEQAAAAAAABwPqIiAJlEAAAAAAAA4EFjBEAgAKoMAQtBgICAgHgLIgK3RAAAAAAAAHDBoqAiAJlEAAAAAAAA4EFjBEAgAKoMAQtBgICAgHgLNgIAIANBAWohAwwBCwJ/IACZRAAAAAAAAOBBYwRAIACqDAELQYCAgIB4CyECIAchBAsgBkHgA2ogA0ECdGogAjYCAAtEAAAAAAAA8D8gBBBhIQACQCADQQBIDQAgAyECA0AgBiACIgRBA3RqIAAgBkHgA2ogAkECdGooAgC3ojkDACACQQFrIQIgAEQAAAAAAABwPqIhACAEDQALIANBAEgNACADIQIDQCADIAIiBGshB0QAAAAAAAAAACEAQQAhAgNAAkAgACACQQN0QaCtAWorAwAgBiACIARqQQN0aisDAKKgIQAgAiAKTg0AIAIgB0khBSACQQFqIQIgBQ0BCwsgBkGgAWogB0EDdGogADkDACAEQQFrIQIgBEEASg0ACwtEAAAAAAAAAAAhACADQQBOBEAgAyECA0AgAiIEQQFrIQIgACAGQaABaiAEQQN0aisDAKAhACAEDQALCyAJIACaIAAgCxs5AwAgBisDoAEgAKEhAEEBIQIgA0EASgRAA0AgACAGQaABaiACQQN0aisDAKAhACACIANHIQQgAkEBaiECIAQNAAsLIAkgAJogACALGzkDCCAGQbAEaiQAIAhBB3EhAyAJKwMAIQAgGkIAUwRAIAEgAJo5AwAgASAJKwMImjkDCEEAIANrIQMMAQsgASAAOQMAIAEgCSsDCDkDCAsgCUEwaiQAIAMLfwIBfwF+IAC9IgNCNIinQf8PcSICQf8PRwR8IAJFBEAgASAARAAAAAAAAAAAYQR/QQAFIABEAAAAAAAA8EOiIAEQ3QIhACABKAIAQUBqCzYCACAADwsgASACQf4HazYCACADQv////////+HgH+DQoCAgICAgIDwP4S/BSAACwspACABIAEoAgBBB2pBeHEiAUEQajYCACAAIAEpAwAgASkDCBDKATkDAAv3FgMSfwF8An4jAEGwBGsiCCQAIAhBADYCLAJAIAG9IhlCAFMEQEEBIRFBkwkhEiABmiIBvSEZDAELIARBgBBxBEBBASERQZYJIRIMAQtBmQlBlAkgBEEBcSIRGyESIBFFIRYLAkAgGUKAgICAgICA+P8Ag0KAgICAgICA+P8AUQRAIABBICACIBFBA2oiCyAEQf//e3EQPyAAIBIgERA2IABBxQ5BpRQgBUEgcSIDG0GeEUHFFCADGyABIAFiG0EDEDYMAQsgCEEQaiEPAkACfwJAIAEgCEEsahDdAiIBIAGgIgFEAAAAAAAAAABiBEAgCCAIKAIsIgZBAWs2AiwgBUEgciIOQeEARw0BDAMLIAVBIHIiDkHhAEYNAiAIKAIsIQxBBiADIANBAEgbDAELIAggBkEdayIMNgIsIAFEAAAAAAAAsEGiIQFBBiADIANBAEgbCyEKIAhBMGogCEHQAmogDEEASBsiDSEHA0AgBwJ/IAFEAAAAAAAA8EFjIAFEAAAAAAAAAABmcQRAIAGrDAELQQALIgM2AgAgB0EEaiEHIAEgA7ihRAAAAABlzc1BoiIBRAAAAAAAAAAAYg0ACwJAIAxBAEwEQCAMIQMgByEGIA0hCQwBCyANIQkgDCEDA0AgA0EdIANBHUkbIQMCQCAHQQRrIgYgCUkNACADrSEaQgAhGQNAIAYgGUL/////D4MgBjUCACAahnwiGSAZQoCU69wDgCIZQoCU69wDfn0+AgAgBkEEayIGIAlPDQALIBmnIgZFDQAgCUEEayIJIAY2AgALA0AgCSAHIgZJBEAgBkEEayIHKAIARQ0BCwsgCCAIKAIsIANrIgM2AiwgBiEHIANBAEoNAAsLIApBGWpBCW0hByADQQBIBEAgB0EBaiEQIA5B5gBGIRMDQEEAIANrIgNBCSADQQlJGyELAkAgBiAJSwRAQYCU69wDIAt2IRVBfyALdEF/cyEUQQAhAyAJIQcDQCAHIAMgBygCACIXIAt2ajYCACAUIBdxIBVsIQMgB0EEaiIHIAZJDQALIAkoAgAhByADRQ0BIAYgAzYCACAGQQRqIQYMAQsgCSgCACEHCyAIIAgoAiwgC2oiAzYCLCANIAkgB0VBAnRqIgkgExsiByAQQQJ0aiAGIAYgB2tBAnUgEEobIQYgA0EASA0ACwtBACEHAkAgBiAJTQ0AIA0gCWtBAnVBCWwhB0EKIQMgCSgCACILQQpJDQADQCAHQQFqIQcgCyADQQpsIgNPDQALCyAKQQAgByAOQeYARhtrIA5B5wBGIApBAEdxayIDIAYgDWtBAnVBCWxBCWtIBEBBBEGkAiAMQQBIGyAIaiADQYDIAGoiDEEJbSIQQQJ0akHQH2shC0EKIQMgDCAQQQlsayIMQQdMBEADQCADQQpsIQMgDEEBaiIMQQhHDQALCwJAIAsoAgAiECAQIANuIhUgA2xrIgxFIAtBBGoiFCAGRnENAEQAAAAAAADgP0QAAAAAAADwP0QAAAAAAAD4PyAGIBRGG0QAAAAAAAD4PyAMIANBAXYiFEYbIAwgFEkbIRhEAQAAAAAAQENEAAAAAAAAQEMgFUEBcRshAQJAIBYNACASLQAAQS1HDQAgGJohGCABmiEBCyALIBAgDGsiDDYCACABIBigIAFhDQAgCyADIAxqIgM2AgAgA0GAlOvcA08EQANAIAtBADYCACAJIAtBBGsiC0sEQCAJQQRrIglBADYCAAsgCyALKAIAQQFqIgM2AgAgA0H/k+vcA0sNAAsLIA0gCWtBAnVBCWwhB0EKIQMgCSgCACIMQQpJDQADQCAHQQFqIQcgDCADQQpsIgNPDQALCyALQQRqIgMgBiADIAZJGyEGCwNAIAYiDCAJTSIDRQRAIAxBBGsiBigCAEUNAQsLAkAgDkHnAEcEQCAEQQhxIQ4MAQsgB0F/c0F/IApBASAKGyIGIAdKIAdBe0pxIgsbIAZqIQpBf0F+IAsbIAVqIQUgBEEIcSIODQBBdyEGAkAgAw0AIAxBBGsoAgAiDkUNAEEKIQNBACEGIA5BCnANAANAIAYiC0EBaiEGIA4gA0EKbCIDcEUNAAsgC0F/cyEGCyAMIA1rQQJ1QQlsIQMgBUFfcUHGAEYEQEEAIQ4gCiADIAZqQQlrIgNBACADQQBKGyIDIAMgCkobIQoMAQtBACEOIAogAyAHaiAGakEJayIDQQAgA0EAShsiAyADIApKGyEKCyAKIA5yQQBHIRAgAEEgIAIgBUFfcSIDQcYARgR/IAdBACAHQQBKGwUgDyAHIAdBH3UiBmogBnOtIA8QciIGa0EBTARAA0AgBkEBayIGQTA6AAAgDyAGa0ECSA0ACwsgBkECayITIAU6AAAgBkEBa0EtQSsgB0EASBs6AAAgDyATawsgCiARaiAQampBAWoiCyAEED8gACASIBEQNiAAQTAgAiALIARBgIAEcxA/AkACQAJAIANBxgBGBEAgCEEQaiIFQQhyIQMgBUEJciEFIA0gCSAJIA1LGyIJIQcDQCAHNQIAIAUQciEGAkAgByAJRwRAIAYgCEEQak0NAQNAIAZBAWsiBkEwOgAAIAYgCEEQaksNAAsMAQsgBSAGRw0AIAhBMDoAGCADIQYLIAAgBiAFIAZrEDYgB0EEaiIHIA1NDQALQQAhBiAQRQ0CIABBiRpBARA2IAcgDE8NASAKQQBMDQEDQCAHNQIAIAUQciIGIAhBEGpLBEADQCAGQQFrIgZBMDoAACAGIAhBEGpLDQALCyAAIAYgCkEJIApBCUgbEDYgCkEJayEGIAdBBGoiByAMTw0DIApBCUohAyAGIQogAw0ACwwCCwJAIApBAEgNACAMIAlBBGogCSAMSRshDSAIQRBqIgNBCXIhBSADQQhyIQMgCSEHA0AgBSAHNQIAIAUQciIGRgRAIAhBMDoAGCADIQYLAkAgByAJRwRAIAYgCEEQak0NAQNAIAZBAWsiBkEwOgAAIAYgCEEQaksNAAsMAQsgACAGQQEQNiAGQQFqIQYgCiAOckUNACAAQYkaQQEQNgsgACAGIAUgBmsiBiAKIAYgCkgbEDYgCiAGayEKIAdBBGoiByANTw0BIApBAE4NAAsLIABBMCAKQRJqQRJBABA/IAAgEyAPIBNrEDYMAgsgCiEGCyAAQTAgBkEJakEJQQAQPwsMAQsgEiAFQRp0QR91QQlxaiEKAkAgA0ELSw0AQQwgA2shBkQAAAAAAAAgQCEYA0AgGEQAAAAAAAAwQKIhGCAGQQFrIgYNAAsgCi0AAEEtRgRAIBggAZogGKGgmiEBDAELIAEgGKAgGKEhAQsgDyAIKAIsIgYgBkEfdSIGaiAGc60gDxByIgZGBEAgCEEwOgAPIAhBD2ohBgsgEUECciENIAVBIHEhDCAIKAIsIQcgBkECayIJIAVBD2o6AAAgBkEBa0EtQSsgB0EASBs6AAAgBEEIcSEGIAhBEGohBwNAIAciBQJ/IAGZRAAAAAAAAOBBYwRAIAGqDAELQYCAgIB4CyIHQaCXAWotAAAgDHI6AAAgASAHt6FEAAAAAAAAMECiIQECQCAFQQFqIgcgCEEQamtBAUcNAAJAIAFEAAAAAAAAAABiDQAgA0EASg0AIAZFDQELIAVBLjoAASAFQQJqIQcLIAFEAAAAAAAAAABiDQALIABBICACIA0CfwJAIANFDQAgByAIa0ESayADTg0AIAMgD2ogCWtBAmoMAQsgDyAIQRBqIAlqayAHagsiA2oiCyAEED8gACAKIA0QNiAAQTAgAiALIARBgIAEcxA/IAAgCEEQaiIFIAcgBWsiBRA2IABBMCADIAUgDyAJayIDamtBAEEAED8gACAJIAMQNgsgAEEgIAIgCyAEQYDAAHMQPyAIQbAEaiQAIAIgCyACIAtKGwtSAQJ/IwBBEGsiAyQAIAEgACgCBCIEQQF1aiEBIAAoAgAhACAEQQFxBEAgASgCACAAaigCACEACyADIAI6AA8gASADQQ9qIAARAwAgA0EQaiQAC/MCAQd/IwBBIGsiBCQAIAQgACgCHCIFNgIQIAAoAhQhAyAEIAI2AhwgBCABNgIYIAQgAyAFayIBNgIUIAEgAmohBUECIQcgBEEQaiIDIQECfwJAAkAgACgCPCADQQIgBEEMahAIIgMEf0GomwIgAzYCAEF/BUEAC0UEQANAIAUgBCgCDCIDRg0CIANBAEgNAyABIAMgASgCBCIISyIGQQN0aiIJIAMgCEEAIAYbayIIIAkoAgBqNgIAIAFBDEEEIAYbaiIJIAkoAgAgCGs2AgAgBSADayEFIAAoAjwgAUEIaiABIAYbIgEgByAGayIHIARBDGoQCCIDBH9BqJsCIAM2AgBBfwVBAAtFDQALCyAFQX9HDQELIAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhAgAgwBCyAAQQA2AhwgAEIANwMQIAAgACgCAEEgcjYCAEEAIAdBAkYNABogAiABKAIEawshACAEQSBqJAAgAAsEAEIACycBAX8jAEEQayIBJAAgASAANgIMIAEoAgwhABDXASABQRBqJAAgAAuzAQEFfyAAKAIEIgIgACgCCEcEQCACIAEtAAA6AAAgACACQQFqNgIEDwsgAiAAKAIAIgVrIgJBAWoiA0EATgRAIAIgAyACQQF0IgQgAyAESxtB/////wcgAkH/////A0kbIgQEfyAEEB0FQQALIgNqIgYgAS0AADoAACACQQBKBEAgAyAFIAIQHhoLIAAgAyAEajYCCCAAIAZBAWo2AgQgACADNgIAIAUEQCAFEBsLDwsQQQALXgEDfyMAQRBrIgEkACABIAA2AgwCfyMAQRBrIgAgASgCDDYCCCAAIAAoAggoAgQ2AgwgACgCDCIACxB0QQFqIgIQKCIDBH8gAyAAIAIQHgVBAAshACABQRBqJAAgAAsGACABEBsLCQAgASACbBAoCxgBAX9BDBAdIgBBADYCCCAAQgA3AgAgAAvcDgEHfwNAAkACQAJAIAAoAnRBhQJLDQAgABCLAQJAIAAoAnQiAkGFAksNACABDQBBAA8LIAJFDQIgAkECSw0AIAAgACgCYCICNgJ4IAAgACgCcDYCZEECIQQgAEECNgJgDAELQQIhBCAAIAAoAlQgACgCbCIDIAAoAjhqLQACIAAoAkggACgCWHRzcSICNgJIIAAoAkAgAyAAKAI0cUEBdGogACgCRCACQQF0aiICLwEAIgU7AQAgAiADOwEAIAAgACgCYCICNgJ4IAAgACgCcDYCZCAAQQI2AmAgBUUNAAJAIAIgACgCgAFPDQAgACgCLEGGAmsgAyAFa0kNACAAIAAgBRDbASIENgJgIARBBUsNACAAKAKIAUEBRwRAIARBA0cNAUEDIQQgACgCbCAAKAJwa0GBIEkNAQtBAiEEIABBAjYCYAsgACgCeCECCwJAIAJBA0kNACACIARJDQAgACgCdCEFIAAoAqQtIAAoAqAtIgNBAXRqIAAoAmwiBiAAKAJkQX9zaiIEOwEAIAAgA0EBajYCoC0gAyAAKAKYLWogAkEDayICOgAAIAJB/wFxQdD7AGotAABBAnQgAGpBmAlqIgIgAi8BAEEBajsBACAAIARBAWtB//8DcSICIAJBB3ZBgAJqIAJBgAJJG0HQ9wBqLQAAQQJ0akGIE2oiAiACLwEAQQFqOwEAIAAgACgCeCICQQJrIgQ2AnggACAAKAJ0IAJrQQFqNgJ0IAUgBmpBA2shBSAAKAKcLUEBayEGIAAoAmwhAiAAKAKgLSEIA0AgACACIgNBAWoiAjYCbCACIAVNBEAgACAAKAJUIAMgACgCOGotAAMgACgCSCAAKAJYdHNxIgc2AkggACgCQCAAKAI0IAJxQQF0aiAAKAJEIAdBAXRqIgcvAQA7AQAgByACOwEACyAAIARBAWsiBDYCeCAEDQALIABBAjYCYCAAQQA2AmggACADQQJqIgM2AmwgBiAIRw0CQQAhBCAAIAAoAlwiAkEATgR/IAAoAjggAmoFQQALIAMgAmtBABBJIAAgACgCbDYCXCAAKAIAIgIoAhwiAxA1AkAgAigCECIEIAMoAhQiBSAEIAVJGyIERQ0AIAIoAgwgAygCECAEEB4aIAIgAigCDCAEajYCDCADIAMoAhAgBGo2AhAgAiACKAIUIARqNgIUIAIgAigCECAEazYCECADIAMoAhQgBGsiAjYCFCACDQAgAyADKAIINgIQCyAAKAIAKAIQDQJBAA8LIAAoAmgEQCAAKAJsIAAoAjhqQQFrLQAAIQIgACgCpC0gACgCoC0iA0EBdGpBADsBACAAIANBAWo2AqAtIAMgACgCmC1qIAI6AAAgACACQQJ0aiICQZQBaiACLwGUAUEBajsBAAJAIAAoAqAtIAAoApwtQQFrRw0AQQAhBCAAIAAoAlwiAkEATgR/IAAoAjggAmoFQQALIAAoAmwgAmtBABBJIAAgACgCbDYCXCAAKAIAIgIoAhwiAxA1IAIoAhAiBCADKAIUIgUgBCAFSRsiBEUNACACKAIMIAMoAhAgBBAeGiACIAIoAgwgBGo2AgwgAyADKAIQIARqNgIQIAIgAigCFCAEajYCFCACIAIoAhAgBGs2AhAgAyADKAIUIARrIgI2AhQgAg0AIAMgAygCCDYCEAsgACAAKAJsQQFqNgJsIAAgACgCdEEBazYCdCAAKAIAKAIQDQJBAA8FIABBATYCaCAAIAAoAmxBAWo2AmwgACAAKAJ0QQFrNgJ0DAILAAsLIAAoAmgEQCAAKAJsIAAoAjhqQQFrLQAAIQIgACgCpC0gACgCoC0iA0EBdGpBADsBACAAIANBAWo2AqAtIAMgACgCmC1qIAI6AAAgACACQQJ0aiICQZQBaiACLwGUAUEBajsBACAAQQA2AmgLIAAgACgCbCICQQIgAkECSRs2ArQtIAFBBEYEQEEAIQQgACAAKAJcIgFBAE4EfyAAKAI4IAFqBUEACyACIAFrQQEQSSAAIAAoAmw2AlwgACgCACIBKAIcIgIQNQJAIAEoAhAiAyACKAIUIgQgAyAESRsiA0UNACABKAIMIAIoAhAgAxAeGiABIAEoAgwgA2o2AgwgAiACKAIQIANqNgIQIAEgASgCFCADajYCFCABIAEoAhAgA2s2AhAgAiACKAIUIANrIgE2AhQgAQ0AIAIgAigCCDYCEAtBA0ECIAAoAgAoAhAbDwsCQCAAKAKgLUUNAEEAIQQgACAAKAJcIgFBAE4EfyAAKAI4IAFqBUEACyACIAFrQQAQSSAAIAAoAmw2AlwgACgCACIBKAIcIgIQNQJAIAEoAhAiAyACKAIUIgQgAyAESRsiA0UNACABKAIMIAIoAhAgAxAeGiABIAEoAgwgA2o2AgwgAiACKAIQIANqNgIQIAEgASgCFCADajYCFCABIAEoAhAgA2s2AhAgAiACKAIUIANrIgE2AhQgAQ0AIAIgAigCCDYCEAsgACgCACgCEA0AQQAPC0EBC7oLAQ1/AkADQAJAAkAgACgCdEGFAk0EQCAAEIsBAkAgACgCdCICQYUCSw0AIAENAEEADwsgAkUNBCACQQNJDQELIAAgACgCVCAAKAJsIgQgACgCOGotAAIgACgCSCAAKAJYdHNxIgI2AkggACgCQCAEIAAoAjRxQQF0aiAAKAJEIAJBAXRqIgIvAQAiAzsBACACIAQ7AQAgA0UNACAAKAIsQYYCayAEIANrSQ0AIAAgACADENsBIgM2AmAMAQsgACgCYCEDCwJAIANBA08EQCAAKAKkLSAAKAKgLSICQQF0aiAAKAJsIAAoAnBrIgQ7AQAgACACQQFqNgKgLSACIAAoApgtaiADQQNrIgI6AAAgAkH/AXFB0PsAai0AAEECdCAAakGYCWoiAiACLwEAQQFqOwEAIAAgBEEBa0H//wNxIgIgAkEHdkGAAmogAkGAAkkbQdD3AGotAABBAnRqQYgTaiICIAIvAQBBAWo7AQAgACAAKAJ0IAAoAmAiA2siAjYCdCAAKAKcLUEBayEIIAAoAqAtIQkCQCADIAAoAoABSw0AIAJBA0kNACAAIANBAWsiBjYCYCAAKAJIIQcgACgCbCEDIAAoAjQhCiAAKAJAIQsgACgCRCEMIAAoAlQhDSAAKAI4IQ4gACgCWCEFA0AgACADIgJBAWoiAzYCbCAAIAIgDmotAAMgByAFdHMgDXEiBzYCSCALIAMgCnFBAXRqIAwgB0EBdGoiBC8BADsBACAEIAM7AQAgACAGQQFrIgY2AmAgBg0ACyAAIAJBAmoiAzYCbCAIIAlHDQMMAgsgAEEANgJgIAAgACgCbCADaiIDNgJsIAAgACgCOCADaiIELQAAIgI2AkggACAAKAJUIAQtAAEgAiAAKAJYdHNxNgJIIAggCUcNAgwBCyAAKAI4IAAoAmxqLQAAIQMgACgCpC0gACgCoC0iAkEBdGpBADsBACAAIAJBAWo2AqAtIAIgACgCmC1qIAM6AAAgACADQQJ0aiICQZQBaiACLwGUAUEBajsBACAAIAAoAnRBAWs2AnQgACAAKAJsQQFqIgM2AmwgACgCoC0gACgCnC1BAWtHDQELQQAhBiAAIAAoAlwiAkEATgR/IAAoAjggAmoFQQALIAMgAmtBABBJIAAgACgCbDYCXCAAKAIAIgUoAhwiBBA1AkAgBSgCECIDIAQoAhQiAiACIANLGyICRQ0AIAUoAgwgBCgCECACEB4aIAUgBSgCDCACajYCDCAEIAQoAhAgAmo2AhAgBSAFKAIUIAJqNgIUIAUgBSgCECACazYCECAEIAQoAhQgAmsiAjYCFCACDQAgBCAEKAIINgIQCyAAKAIAKAIQDQALQQAPCyAAIAAoAmwiAkECIAJBAkkbNgK0LSABQQRGBEBBACEGIAAgACgCXCIBQQBOBH8gACgCOCABagVBAAsgAiABa0EBEEkgACAAKAJsNgJcIAAoAgAiBCgCHCIDEDUCQCAEKAIQIgIgAygCFCIBIAEgAksbIgFFDQAgBCgCDCADKAIQIAEQHhogBCAEKAIMIAFqNgIMIAMgAygCECABajYCECAEIAQoAhQgAWo2AhQgBCAEKAIQIAFrNgIQIAMgAygCFCABayIBNgIUIAENACADIAMoAgg2AhALQQNBAiAAKAIAKAIQGw8LAkAgACgCoC1FDQBBACEGIAAgACgCXCIBQQBOBH8gACgCOCABagVBAAsgAiABa0EAEEkgACAAKAJsNgJcIAAoAgAiBCgCHCIDEDUCQCAEKAIQIgIgAygCFCIBIAEgAksbIgFFDQAgBCgCDCADKAIQIAEQHhogBCAEKAIMIAFqNgIMIAMgAygCECABajYCECAEIAQoAhQgAWo2AhQgBCAEKAIQIAFrNgIQIAMgAygCFCABayIBNgIUIAENACADIAMoAgg2AhALIAAoAgAoAhANAEEADwtBAQsHACAAERIACxgAQc+SAiwAAEEASARAQcSSAigCABAbCwsZACABIAIgA60gBK1CIIaEIAUgBiAAERQACyUAIAEgAiADIAQgBSAGrSAHrUIghoQgCK0gCa1CIIaEIAARGQALIwAgASACIAMgBCAFrSAGrUIghoQgB60gCK1CIIaEIAARGgALGQAgASACIAMgBCAFrSAGrUIghoQgABERAAsiAQF+IAEgAq0gA61CIIaEIAQgABEYACIFQiCIpxAQIAWnCxgAQcOSAiwAAEEASARAQbiSAigCABAbCwsYAEG3kgIsAABBAEgEQEGskgIoAgAQGwsLGwAgACABKAIIIAUQMgRAIAEgAiADIAQQpwELCzgAIAAgASgCCCAFEDIEQCABIAIgAyAEEKcBDwsgACgCCCIAIAEgAiADIAQgBSAAKAIAKAIUEQoAC5YCAQZ/IAAgASgCCCAFEDIEQCABIAIgAyAEEKcBDwsgAS0ANSEHIAAoAgwhBiABQQA6ADUgAS0ANCEIIAFBADoANCAAQRBqIgkgASACIAMgBCAFEKYBIAcgAS0ANSIKciEHIAggAS0ANCILciEIAkAgBkECSA0AIAkgBkEDdGohCSAAQRhqIQYDQCABLQA2DQECQCALBEAgASgCGEEBRg0DIAAtAAhBAnENAQwDCyAKRQ0AIAAtAAhBAXFFDQILIAFBADsBNCAGIAEgAiADIAQgBRCmASABLQA1IgogB3IhByABLQA0IgsgCHIhCCAGQQhqIgYgCUkNAAsLIAEgB0H/AXFBAEc6ADUgASAIQf8BcUEARzoANAunAQAgACABKAIIIAQQMgRAAkAgASgCBCACRw0AIAEoAhxBAUYNACABIAM2AhwLDwsCQCAAIAEoAgAgBBAyRQ0AAkAgAiABKAIQRwRAIAEoAhQgAkcNAQsgA0EBRw0BIAFBATYCIA8LIAEgAjYCFCABIAM2AiAgASABKAIoQQFqNgIoAkAgASgCJEEBRw0AIAEoAhhBAkcNACABQQE6ADYLIAFBBDYCLAsLiAIAIAAgASgCCCAEEDIEQAJAIAEoAgQgAkcNACABKAIcQQFGDQAgASADNgIcCw8LAkAgACABKAIAIAQQMgRAAkAgAiABKAIQRwRAIAEoAhQgAkcNAQsgA0EBRw0CIAFBATYCIA8LIAEgAzYCIAJAIAEoAixBBEYNACABQQA7ATQgACgCCCIAIAEgAiACQQEgBCAAKAIAKAIUEQoAIAEtADUEQCABQQM2AiwgAS0ANEUNAQwDCyABQQQ2AiwLIAEgAjYCFCABIAEoAihBAWo2AiggASgCJEEBRw0BIAEoAhhBAkcNASABQQE6ADYPCyAAKAIIIgAgASACIAMgBCAAKAIAKAIYEQsACwu6BAEEfyAAIAEoAgggBBAyBEACQCABKAIEIAJHDQAgASgCHEEBRg0AIAEgAzYCHAsPCwJAIAAgASgCACAEEDIEQAJAIAIgASgCEEcEQCABKAIUIAJHDQELIANBAUcNAiABQQE2AiAPCyABIAM2AiAgASgCLEEERwRAIABBEGoiBSAAKAIMQQN0aiEIIAECfwJAA0ACQCAFIAhPDQAgAUEAOwE0IAUgASACIAJBASAEEKYBIAEtADYNAAJAIAEtADVFDQAgAS0ANARAQQEhAyABKAIYQQFGDQRBASEHQQEhBiAALQAIQQJxDQEMBAtBASEHIAYhAyAALQAIQQFxRQ0DCyAFQQhqIQUMAQsLIAYhA0EEIAdFDQEaC0EDCzYCLCADQQFxDQILIAEgAjYCFCABIAEoAihBAWo2AiggASgCJEEBRw0BIAEoAhhBAkcNASABQQE6ADYPCyAAKAIMIQYgAEEQaiIFIAEgAiADIAQQjQEgBkECSA0AIAUgBkEDdGohBiAAQRhqIQUCQCAAKAIIIgBBAnFFBEAgASgCJEEBRw0BCwNAIAEtADYNAiAFIAEgAiADIAQQjQEgBUEIaiIFIAZJDQALDAELIABBAXFFBEADQCABLQA2DQIgASgCJEEBRg0CIAUgASACIAMgBBCNASAFQQhqIgUgBkkNAAwCCwALA0AgAS0ANg0BIAEoAiRBAUYEQCABKAIYQQFGDQILIAUgASACIAMgBBCNASAFQQhqIgUgBkkNAAsLC6oFAQR/IwBBQGoiBSQAAkAgAUHUjQJBABAyBEAgAkEANgIAQQEhAwwBCwJAIAAgASAALQAIQRhxBH9BAQUgAUUNASABQciLAhBMIgZFDQEgBi0ACEEYcUEARwsQMiEECyAEBEBBASEDIAIoAgAiAEUNASACIAAoAgA2AgAMAQsCQCABRQ0AIAFB+IsCEEwiBEUNASACKAIAIgEEQCACIAEoAgA2AgALIAQoAggiASAAKAIIIgZBf3NxQQdxDQEgAUF/cyAGcUHgAHENAUEBIQMgACgCDCAEKAIMQQAQMg0BIAAoAgxByI0CQQAQMgRAIAQoAgwiAEUNAiAAQayMAhBMRSEDDAILIAAoAgwiAUUNAEEAIQMgAUH4iwIQTCIBBEAgAC0ACEEBcUUNAgJ/IAEhACAEKAIMIQICQANAQQAgAkUNAhogAkH4iwIQTCICRQ0BIAIoAgggACgCCEF/c3ENAUEBIAAoAgwgAigCDEEAEDINAhogAC0ACEEBcUUNASAAKAIMIgFFDQEgAUH4iwIQTCIBBEAgAigCDCECIAEhAAwBCwsgACgCDCIARQ0AIABB6IwCEEwiAEUNACAAIAIoAgwQ4QEhAwsgAwshAwwCCyAAKAIMIgFFDQEgAUHojAIQTCIBBEAgAC0ACEEBcUUNAiABIAQoAgwQ4QEhAwwCCyAAKAIMIgBFDQEgAEGYiwIQTCIBRQ0BIAQoAgwiAEUNASAAQZiLAhBMIgBFDQEgBUEIaiIDQQRyQQBBNBAhGiAFQQE2AjggBUF/NgIUIAUgATYCECAFIAA2AgggACADIAIoAgBBASAAKAIAKAIcEQgAAkAgBSgCICIAQQFHDQAgAigCAEUNACACIAUoAhg2AgALIABBAUYhAwwBC0EAIQMLIAVBQGskACADC28BAn8gACABKAIIQQAQMgRAIAEgAiADEKgBDwsgACgCDCEEIABBEGoiBSABIAIgAxDiAQJAIARBAkgNACAFIARBA3RqIQQgAEEYaiEAA0AgACABIAIgAxDiASABLQA2DQEgAEEIaiIAIARJDQALCwsyACAAIAEoAghBABAyBEAgASACIAMQqAEPCyAAKAIIIgAgASACIAMgACgCACgCHBEIAAsZACAAIAEoAghBABAyBEAgASACIAMQqAELC58BAQJ/IwBBQGoiAyQAAn9BASAAIAFBABAyDQAaQQAgAUUNABpBACABQZiLAhBMIgFFDQAaIANBCGoiBEEEckEAQTQQIRogA0EBNgI4IANBfzYCFCADIAA2AhAgAyABNgIIIAEgBCACKAIAQQEgASgCACgCHBEIACADKAIgIgBBAUYEQCACIAMoAhg2AgALIABBAUYLIQAgA0FAayQAIAALCgAgACABQQAQMgsJACAAEKkBEBsLBQBB5w0LAwAAC9ATBBR/AX0BfAF+IwBBIGsiByQAIABBADYCCCAAQgA3AgAgASgCNCEEIAcgAzYCFCAHIAQ2AhAgByADIARsIgg2AhggB0F/IAhBAnQiBCAIQf////8DcSAIRxsQHSINNgIcIA1BACAEECEhDQJAIANBAEwNACABKAIwIgogASgCLCIFTA0AIAEoAgQhDyAKIAVrQQNxIQkgCiAFQX9zakEDSSEQA0AgDSAOQQJ0aiELIAIgDiAPbEECdGohDCAFIQQgCSIGBEADQCALIAQgBWsgA2xBAnRqIAwgBEECdGoqAgA4AgAgBEEBaiEEIAZBAWsiBg0ACwsgEEUEQANAIAsgBCAFayADbEECdGogDCAEQQJ0aioCADgCACALIARBAWoiBiAFayADbEECdGogDCAGQQJ0aioCADgCACALIARBAmoiBiAFayADbEECdGogDCAGQQJ0aioCADgCACALIARBA2oiBiAFayADbEECdGogDCAGQQJ0aioCADgCACAEQQRqIgQgCkcNAAsLIA5BAWoiDiADRw0ACwsCQCAIQQBMDQAgCEEDcSEDQQAhBCAIQQFrIgVBA08EQCAIQXxxIQIDQCANIARBAnQiBmoiCSAJKgIAkTgCACANIAZBBHJqIgkgCSoCAJE4AgAgDSAGQQhyaiIJIAkqAgCROAIAIA0gBkEMcmoiBiAGKgIAkTgCACAEQQRqIQQgAkEEayICDQALCyADBEADQCANIARBAnRqIgIgAioCAJE4AgAgBEEBaiEEIANBAWsiAw0ACwsgCEEDcSECQQAhBCAFQQNPBEAgCEF8cSEGA0AgDSAEQQJ0IgNqIgUgBSoCACIYQ703ljUgGEO9N5Y1YBsQUjgCACANIANBBHJqIgUgBSoCACIYQ703ljUgGEO9N5Y1YBsQUjgCACANIANBCHJqIgUgBSoCACIYQ703ljUgGEO9N5Y1YBsQUjgCACANIANBDHJqIgMgAyoCACIYQ703ljUgGEO9N5Y1YBsQUjgCACAEQQRqIQQgBkEEayIGDQALCyACRQ0AA0AgDSAEQQJ0aiIDIAMqAgAiGEO9N5Y1IBhDvTeWNWAbEFI4AgAgBEEBaiEEIAJBAWsiAg0ACwsCQCAIRQ0AIA0gCEECdGohAiANIQQDQCAZIAQqAgC7oCEZIARBBGoiBCACRw0ACyAIQQBMDQAgGSAIt6O2IRggCEEDcSEDQQAhBCAIQQFrQQNPBEAgCEF8cSECA0AgDSAEQQJ0IgZqIgUgBSoCACAYkzgCACANIAZBBHJqIgUgBSoCACAYkzgCACANIAZBCHJqIgUgBSoCACAYkzgCACANIAZBDHJqIgYgBioCACAYkzgCACAEQQRqIQQgAkEEayICDQALCyADRQ0AA0AgDSAEQQJ0aiICIAIqAgAgGJM4AgAgBEEBaiEEIANBAWsiAw0ACwtBACEMQQAhBCAHQQA2AgggB0IANwIAAkAgBygCECICQQBMDQAgBygCFCIKQQBMDQACQAJAA0AgBEEBaiEJIApBAEoEQCAEQQFrIgNBACADQQBKGyEIIAlBAWohD0EAIQMDQCADQQJqIQYgBygCHCISIAQgCmxBAnRqIANBAnRqIRACQAJAIAggDyACIAIgD0obIhFODQAgA0EBayICQQAgAkEAShsiCyAGIAogBiAKSBsiE04NACAQKgIAIRhBASEOIAghBQNAIBIgBSAKbEECdGohFCALIQICQANAIBQgAkECdGoqAgAgGF4NASACQQFqIgIgE0cNAAsgBUEBaiIFIBFIIQ4gBSARRw0BCwsgDkUNACADQQFqIQYMAQsgECoCACEYAkAgBygCCCIKIAxLBEAgDCAYOAIIIAwgAzYCBCAMIAQ2AgAgByAMQQxqIgw2AgQMAQsgDCAHKAIAIgJrIgtBDG0iDEEBaiIFQdaq1aoBTw0FIAUgCiACa0EMbSIKQQF0Ig4gBSAOSxtB1arVqgEgCkGq1arVAEkbIgVB1qrVqgFPDQYgBUEMbCIKEB0iDiAMQQxsaiIFIBg4AgggBSADNgIEIAUgBDYCACAFIAtBdG1BDGxqIQMgBUEMaiEMIAtBAEoEQCADIAIgCxAeGgsgByAKIA5qNgIIIAcgDDYCBCAHIAM2AgAgAkUNACACEBsLIAcoAhQhCgsgBygCECECIAYiAyAKSA0ACwsgCSIEIAJIDQALDAILEEEAC0HKERBcAAsgAS0AOCECIAcpAwAhGiAAIAcoAgg2AgggACAaNwIAAkAgAkUNAAJAAkACQCABKAIoQQFrDgMAAQIDCyAAIAdBEGogASgCICABKAIkIAEqAhQQ5QEMAgsgACAHQRBqEOMBDAELIAAgB0EQaiICIAEoAiAgASgCJCABKgIUEOUBIAAgAhDjAQsgASgCGCEPIAEoAhwhEEEAIQJBACEGQQAhDCMAQRBrIgkkACAJQgA3AwAgACIEKAIAIgggBCgCBCISRwRAIBBBAWohEyAPQQFqIRQgCSgCACEAAkACQANAAkACQAJAIAgoAgAiAyAPayIFQQAgBUEAShsiCyADIBRqIgUgBygCECIKIAUgCkgbIhFODQAgCCgCBCIOIBBrIgVBACAFQQBKGyIFIA4gE2oiFSAHKAIUIgogCiAVShsiFU4NACAHKAIcIhYgAyAKbEECdGogDkECdGoqAgAhGEEBIQ4DQCAWIAogC2xBAnRqIRcgBSEDAkADQCAXIANBAnRqKgIAIBheDQEgA0EBaiIDIBVHDQALIAtBAWoiCyARSCEOIAsgEUcNAQsLIA4NAQsgBiAMRwRAIAYgCCkCADcCACAGIAgoAgg2AgggCSAGQQxqIgY2AgQMAQsgBiACayIDQQxtIgVBAWoiC0HWqtWqAU8NASALIAVBAXQiBiAGIAtJG0HVqtWqASAFQarVqtUASRsiCwR/IAtB1qrVqgFPDQQgC0EMbBAdBUEACyIMIAVBDGxqIgYgCCkCADcCACAGIAgoAgg2AgggBiADQXRtQQxsaiEAIAZBDGohBiADQQBKBEAgACACIAMQHhoLIAtBDGwgDGohDCAJIAY2AgQgAgRAIAIQGwsgACECCyASIAhBDGoiCEcNAQwDCwsgCSAGNgIIIAkgADYCABBBAAsgCSAANgIAQcoREFwACyAJIAA2AgALIAkgDDYCCCAEIAlHBEAgBCACIAYQpQEgCSgCACECCyACBEAgCSACNgIEIAIQGwsgCUEQaiQAIAQoAgAiACAEKAIEIgJHBEAgASgCLCEBIAAhBANAIAQgBCgCACABajYCACAEQQxqIgQgAkcNAAsLIAdBFzYCACAAIAIgBxCUASANEBsgB0EgaiQACyIBAX8gAARAIAAoAgAiAQRAIAAgATYCBCABEBsLIAAQGwsLEwAgACAAKAIAQQxrKAIAahDtAQsTACAAIAAoAgBBDGsoAgBqEK0BCxMAIAAgACgCAEEMaygCAGoQ7gELEwAgACAAKAIAQQxrKAIAahCuAQsaACAAIAEgAikDCEEAIAMgASgCACgCEBEUAAsJACAAEJMBEBsL1QICAX8DfiABKAIYIAEoAixLBEAgASABKAIYNgIsC0J/IQgCQCAEQRhxIgVFDQAgBUEYRiADQQFGcQ0AIAEoAiwiBQRAIAUCfyABQSBqIgUtAAtBB3YEQCAFKAIADAELIAULa6whBgsCQAJAAkAgAw4DAgABAwsgBEEIcQRAIAEoAgwgASgCCGusIQcMAgsgASgCGCABKAIUa6whBwwBCyAGIQcLIAIgB3wiAkIAUw0AIAIgBlUNACAEQQhxIQMCQCACUA0AIAMEQCABKAIMRQ0CCyAEQRBxRQ0AIAEoAhhFDQELIAMEQCABKAIIIgMhBSABIAEoAiw2AhAgASACpyADajYCDCABIAU2AggLIARBEHEEQCABKAIUIQMgASABKAIcNgIcIAEgAzYCFCABIAM2AhggASABKAIYIAKnajYCGAsgAiEICyAAIAg3AwggAEIANwMAC6EDAQp/IwBBEGsiBCQAAn8gAUF/RwRAIAAoAgwhCCAAKAIIIQkgACgCGCAAKAIcRgRAQX8gAC0AMEEQcUUNAhogACgCGCEKIAAoAhQiCyEFIAAoAiwhBiAAQSBqIgJBABCPASACIAItAAtBB3YEfyACKAIIQf////8HcUEBawVBCgsQHwJ/IAItAAtBB3YEQCACKAIADAELIAILIgMhByAAAn8gAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwsgA2o2AhwgACAHNgIUIAAgBzYCGCAAIAAoAhggCiAFa2o2AhggACAAKAIUIAYgC2tqNgIsCyAEIAAoAhhBAWo2AgwjAEEQayIFJAAgBEEMaiIGKAIAIABBLGoiAygCAEkhAiAFQRBqJAAgACADIAYgAhsoAgA2AiwgAC0AMEEIcQRAAn8gAEEgaiICLQALQQd2BEAgAigCAAwBCyACCyIDIQIgACAAKAIsNgIQIAAgAyAIIAlrajYCDCAAIAI2AggLIAAgAUEYdEEYdRC0AgwBC0EAIAEgAUF/RhsLIQAgBEEQaiQAIAALwAEBAn8gACgCGCAAKAIsSwRAIAAgACgCGDYCLAsCQCAAKAIIIAAoAgxPDQAgAUF/RgRAIAAoAgghAiAAKAIMQQFrIQMgACAAKAIsNgIQIAAgAzYCDCAAIAI2AghBACABIAFBf0YbDwsgAC0AMEEQcUUEQCAAKAIMQQFrLQAAIAFB/wFxRw0BCyAAKAIIIQIgACgCDEEBayEDIAAgACgCLDYCECAAIAM2AgwgACACNgIIIAAoAgwgAToAACABDwtBfwt2AQJ/IAAoAhggACgCLEsEQCAAIAAoAhg2AiwLAkAgAC0AMEEIcUUNACAAKAIQIAAoAixJBEAgACgCCCEBIAAoAgwhAiAAIAAoAiw2AhAgACACNgIMIAAgATYCCAsgACgCDCAAKAIQTw0AIAAoAgwtAAAPC0F/CxMAIAAgACgCAEEMaygCAGoQ8AELEwAgACAAKAIAQQxrKAIAahCvAQvpAQEGfyMAQRBrIgMkACAAQQA2AgRBBCECIwBBIGsiBiQAIANBCGoiBEEAOgAAIAAgACgCAEEMaygCAGoiByEFAkAgBygCEEUEQCAFKAJIBEAgACAAKAIAQQxrKAIAaigCSBDzAQsgBCAAIAAoAgBBDGsoAgBqKAIQRToAAAwBCyAFQQQQgQELIAZBIGokACAELQAABEAgACAAIAAoAgBBDGsoAgBqKAIYIgIgAUGAgAEgAigCACgCIBEEACIBNgIEQQBBBiABQYCAAUYbIQILIAAgACgCAEEMaygCAGogAhCBASADQRBqJAALEwAgACAAKAIAQQxrKAIAahD0AQsTACAAIAAoAgBBDGsoAgBqELABC8oBAQZ/IwBBEGsiBSQAA0ACQCACIARMDQAgACgCGCIDIAAoAhwiBk8EfyAAIAEtAAAgACgCACgCNBECAEF/Rg0BIARBAWohBCABQQFqBSAFIAYgA2s2AgwgBSACIARrNgIIIwBBEGsiAyQAIAVBCGoiBigCACAFQQxqIgcoAgBIIQggA0EQaiQAIAYgByAIGyEDIAAoAhggASADKAIAIgMQTiAAIAMgACgCGGo2AhggAyAEaiEEIAEgA2oLIQEMAQsLIAVBEGokACAECywAIAAgACgCACgCJBEAAEF/RgRAQX8PCyAAIAAoAgwiAEEBajYCDCAALQAACwQAQX8LgAIBBn8jAEEQayIEJAADQAJAIAIgBkwNAAJAIAAoAgwiAyAAKAIQIgVJBEAgBEH/////BzYCDCAEIAUgA2s2AgggBCACIAZrNgIEIwBBEGsiAyQAIARBBGoiBSgCACAEQQhqIgcoAgBIIQggA0EQaiQAIAUgByAIGyEDIwBBEGsiBSQAIAMoAgAgBEEMaiIHKAIASCEIIAVBEGokACADIAcgCBshAyABIAAoAgwgAygCACIDEE4gACAAKAIMIANqNgIMDAELIAAgACgCACgCKBEAACIDQX9GDQEgASADOgAAQQEhAwsgASADaiEBIAMgBmohBgwBCwsgBEEQaiQAIAYLEAAgAEJ/NwMIIABCADcDAAsQACAAQn83AwggAEIANwMACwQAIAALCAAgABB1EBsLBwAgACgCBAsJAEHIoAIQHBoLLgACQEHUoAItAABBAXENAEHUoAIQL0UNAEHIoAJB4NgBEHdB1KACEC4LQcigAgsJAEG4oAIQHBoLLQACQEHEoAItAABBAXENAEHEoAIQL0UNAEG4oAJBtQ0QbEHEoAIQLgtBuKACCwkAQaigAhAcGgsuAAJAQbSgAi0AAEEBcQ0AQbSgAhAvRQ0AQaigAkGM2AEQd0G0oAIQLgtBqKACCwkAQZigAhAcGgstAAJAQaSgAi0AAEEBcQ0AQaSgAhAvRQ0AQZigAkHbExBsQaSgAhAuC0GYoAILCQBBiKACEBwaCy4AAkBBlKACLQAAQQFxDQBBlKACEC9FDQBBiKACQejXARB3QZSgAhAuC0GIoAILCQBB+J8CEBwaCy0AAkBBhKACLQAAQQFxDQBBhKACEC9FDQBB+J8CQYAUEGxBhKACEC4LQfifAgsJAEHonwIQHBoLLgACQEH0nwItAABBAXENAEH0nwIQL0UNAEHonwJBxNcBEHdB9J8CEC4LQeifAgsJAEHYnwIQHBoLLQACQEHknwItAABBAXENAEHknwIQL0UNAEHYnwJBgAkQbEHknwIQLgtB2J8CCxsAQdioAiEAA0AgAEEMaxAcIgBBwKgCRw0ACwt9AAJAQdSfAi0AAEEBcQ0AQdSfAhAvRQ0AAkBB2KgCLQAAQQFxDQBB2KgCEC9FDQBBwKgCIQADQCAAECBBDGoiAEHYqAJHDQALQdioAhAuC0HAqAJB8P4BECJBzKgCQfz+ARAiQdCfAkHAqAI2AgBB1J8CEC4LQdCfAigCAAsbAEG4qAIhAANAIABBDGsQHCIAQaCoAkcNAAsLewACQEHMnwItAABBAXENAEHMnwIQL0UNAAJAQbioAi0AAEEBcQ0AQbioAhAvRQ0AQaCoAiEAA0AgABAgQQxqIgBBuKgCRw0AC0G4qAIQLgtBoKgCQawUECNBrKgCQakUECNByJ8CQaCoAjYCAEHMnwIQLgtByJ8CKAIACxsAQZCoAiEAA0AgAEEMaxAcIgBB8KUCRw0ACwvZAgACQEHEnwItAABBAXENAEHEnwIQL0UNAAJAQZCoAi0AAEEBcQ0AQZCoAhAvRQ0AQfClAiEAA0AgABAgQQxqIgBBkKgCRw0AC0GQqAIQLgtB8KUCQej6ARAiQfylAkGI+wEQIkGIpgJBrPsBECJBlKYCQcT7ARAiQaCmAkHc+wEQIkGspgJB7PsBECJBuKYCQYD8ARAiQcSmAkGU/AEQIkHQpgJBsPwBECJB3KYCQdj8ARAiQeimAkH4/AEQIkH0pgJBnP0BECJBgKcCQcD9ARAiQYynAkHQ/QEQIkGYpwJB4P0BECJBpKcCQfD9ARAiQbCnAkHc+wEQIkG8pwJBgP4BECJByKcCQZD+ARAiQdSnAkGg/gEQIkHgpwJBsP4BECJB7KcCQcD+ARAiQfinAkHQ/gEQIkGEqAJB4P4BECJBwJ8CQfClAjYCAEHEnwIQLgtBwJ8CKAIACxsAQeClAiEAA0AgAEEMaxAcIgBBwKMCRw0ACwvBAgACQEG8nwItAABBAXENAEG8nwIQL0UNAAJAQeClAi0AAEEBcQ0AQeClAhAvRQ0AQcCjAiEAA0AgABAgQQxqIgBB4KUCRw0AC0HgpQIQLgtBwKMCQaYIECNBzKMCQZ0IECNB2KMCQa4QECNB5KMCQeYOECNB8KMCQfwIECNB/KMCQbASECNBiKQCQb4IECNBlKQCQa4JECNBoKQCQbwMECNBrKQCQasMECNBuKQCQbMMECNBxKQCQcYMECNB0KQCQckOECNB3KQCQdcTECNB6KQCQe0MECNB9KQCQdYLECNBgKUCQfwIECNBjKUCQcUNECNBmKUCQdoOECNBpKUCQcgQECNBsKUCQbENECNBvKUCQcMKECNByKUCQaYJECNB1KUCQdMTECNBuJ8CQcCjAjYCAEG8nwIQLgtBuJ8CKAIACxsAQbijAiEAA0AgAEEMaxAcIgBBkKICRw0ACwv1AQACQEG0nwItAABBAXENAEG0nwIQL0UNAAJAQbijAi0AAEEBcQ0AQbijAhAvRQ0AQZCiAiEAA0AgABAgQQxqIgBBuKMCRw0AC0G4owIQLgtBkKICQZT4ARAiQZyiAkGw+AEQIkGoogJBzPgBECJBtKICQez4ARAiQcCiAkGU+QEQIkHMogJBuPkBECJB2KICQdT5ARAiQeSiAkH4+QEQIkHwogJBiPoBECJB/KICQZj6ARAiQYijAkGo+gEQIkGUowJBuPoBECJBoKMCQcj6ARAiQayjAkHY+gEQIkGwnwJBkKICNgIAQbSfAhAuC0GwnwIoAgALGwBBiKICIQADQCAAQQxrEBwiAEHgoAJHDQALC+cBAAJAQayfAi0AAEEBcQ0AQayfAhAvRQ0AAkBBiKICLQAAQQFxDQBBiKICEC9FDQBB4KACIQADQCAAECBBDGoiAEGIogJHDQALQYiiAhAuC0HgoAJB5wgQI0HsoAJB7ggQI0H4oAJBzAgQI0GEoQJB1AgQI0GQoQJBwwgQI0GcoQJB9QgQI0GooQJB3ggQI0G0oQJBwQ0QI0HAoQJBwQ4QI0HMoQJBkxIQI0HYoQJBzxMQI0HkoQJBqgkQI0HwoQJBlhAQI0H8oQJB5woQI0GonwJB4KACNgIAQayfAhAuC0GonwIoAgALCgAgAEGs1wEQdwsJACAAQZcSEGwLCgAgAEGY1wEQdwsFAEGEHAsJACAAQY4SEGwLDAAgACABQRBqEMMBCwwAIAAgAUEMahDDAQsHACAALAAJCwcAIAAsAAgLCQAgABCCAhAbCwkAIAAQgwIQGwvpAwEFfyACIQADQAJAIAAgA08NACAEIAhNDQAgACwAACIGQf8BcSEBAkAgBkEATgRAQQEhBiABQf//wwBNDQEMAgsgAUHCAUkNASABQd8BTQRAIAMgAGtBAkgNAiAALQABIgVBwAFxQYABRw0CQQIhBiAFQT9xIAFBBnRBwA9xckH//8MATQ0BDAILAkACQCABQe8BTQRAIAMgAGtBA0gNBCAALQACIQcgAC0AASEFIAFB7QFGDQEgAUHgAUYEQCAFQeABcUGgAUYNAwwFCyAFQcABcUGAAUcNBAwCCyABQfQBSw0DIAMgAGtBBEgNAyAALQADIQcgAC0AAiEJIAAtAAEhBQJAAkACQAJAIAFB8AFrDgUAAgICAQILIAVB8ABqQf8BcUEwSQ0CDAYLIAVB8AFxQYABRg0BDAULIAVBwAFxQYABRw0ECyAJQcABcUGAAUcNAyAHQcABcUGAAUcNA0EEIQYgB0E/cSAJQQZ0QcAfcSABQRJ0QYCA8ABxIAVBP3FBDHRycnJB///DAEsNAwwCCyAFQeABcUGAAUcNAgsgB0HAAXFBgAFHDQFBAyEGIAdBP3EgAUEMdEGA4ANxIAVBP3FBBnRyckH//8MASw0BCyAIQQFqIQggACAGaiEADAELCyAAIAJrCyIAIAAoAgAgASgCAEggACgCBCIAIAEoAgQiAUggACABRhsL4wQBBX8jAEEQayIAJAAgACACNgIMIAAgBTYCCAJ/IAAgAjYCDCAAIAU2AggCQAJAA0ACQCAAKAIMIgIgA08NACAAKAIIIgwgBk8NACACLAAAIgVB/wFxIQECQCAFQQBOBEAgAUH//8MATQRAQQEhBQwCC0ECDAYLQQIhCiABQcIBSQ0DIAFB3wFNBEAgAyACa0ECSA0FIAItAAEiCEHAAXFBgAFHDQRBAiEFIAhBP3EgAUEGdEHAD3FyIgFB///DAE0NAQwECyABQe8BTQRAIAMgAmtBA0gNBSACLQACIQkgAi0AASEIAkACQCABQe0BRwRAIAFB4AFHDQEgCEHgAXFBoAFGDQIMBwsgCEHgAXFBgAFGDQEMBgsgCEHAAXFBgAFHDQULIAlBwAFxQYABRw0EQQMhBSAJQT9xIAFBDHRBgOADcSAIQT9xQQZ0cnIiAUH//8MATQ0BDAQLIAFB9AFLDQMgAyACa0EESA0EIAItAAMhCSACLQACIQsgAi0AASEIAkACQAJAAkAgAUHwAWsOBQACAgIBAgsgCEHwAGpB/wFxQTBJDQIMBgsgCEHwAXFBgAFGDQEMBQsgCEHAAXFBgAFHDQQLIAtBwAFxQYABRw0DIAlBwAFxQYABRw0DQQQhBSAJQT9xIAtBBnRBwB9xIAFBEnRBgIDwAHEgCEE/cUEMdHJyciIBQf//wwBLDQMLIAwgATYCACAAIAIgBWo2AgwgACAAKAIIQQRqNgIIDAELCyACIANJIQoLIAoMAQtBAQshASAEIAAoAgw2AgAgByAAKAIINgIAIABBEGokACABC48EACMAQRBrIgAkACAAIAI2AgwgACAFNgIIAn8gACACNgIMIAAgBTYCCCAAKAIMIQECQANAIAEgA08EQEEAIQIMAgtBAiECIAEoAgAiAUGAcHFBgLADRg0BIAFB///DAEsNAQJAAkAgAUH/AE0EQEEBIQIgBiAAKAIIIgVrQQBMDQQgACAFQQFqNgIIIAUgAToAAAwBCyABQf8PTQRAIAYgACgCCCICa0ECSA0CIAAgAkEBajYCCCACIAFBBnZBwAFyOgAAIAAgACgCCCICQQFqNgIIIAIgAUE/cUGAAXI6AAAMAQsgBiAAKAIIIgJrIQUgAUH//wNNBEAgBUEDSA0CIAAgAkEBajYCCCACIAFBDHZB4AFyOgAAIAAgACgCCCICQQFqNgIIIAIgAUEGdkE/cUGAAXI6AAAgACAAKAIIIgJBAWo2AgggAiABQT9xQYABcjoAAAwBCyAFQQRIDQEgACACQQFqNgIIIAIgAUESdkHwAXI6AAAgACAAKAIIIgJBAWo2AgggAiABQQx2QT9xQYABcjoAACAAIAAoAggiAkEBajYCCCACIAFBBnZBP3FBgAFyOgAAIAAgACgCCCICQQFqNgIIIAIgAUE/cUGAAXI6AAALIAAgACgCDEEEaiIBNgIMDAELC0EBDAELIAILIQEgBCAAKAIMNgIAIAcgACgCCDYCACAAQRBqJAAgAQv1AwEEfyACIQADQAJAIAAgA08NACAEIAZNDQAgAC0AACIBQf//wwBLDQACfyAAQQFqIAFBGHRBGHVBAE4NABogAUHCAUkNASABQd8BTQRAIAMgAGtBAkgNAiAALQABIgVBwAFxQYABRw0CIAVBP3EgAUEGdEHAD3FyQf//wwBLDQIgAEECagwBCwJAAkAgAUHvAU0EQCADIABrQQNIDQQgAC0AAiEHIAAtAAEhBSABQe0BRg0BIAFB4AFGBEAgBUHgAXFBoAFGDQMMBQsgBUHAAXFBgAFHDQQMAgsgAUH0AUsNAyADIABrQQRIDQMgBCAGa0ECSQ0DIAAtAAMhByAALQACIQggAC0AASEFAkACQAJAAkAgAUHwAWsOBQACAgIBAgsgBUHwAGpB/wFxQTBJDQIMBgsgBUHwAXFBgAFGDQEMBQsgBUHAAXFBgAFHDQQLIAhBwAFxQYABRw0DIAdBwAFxQYABRw0DIAdBP3EgCEEGdEHAH3EgAUESdEGAgPAAcSAFQT9xQQx0cnJyQf//wwBLDQMgBkEBaiEGIABBBGoMAgsgBUHgAXFBgAFHDQILIAdBwAFxQYABRw0BIAdBP3EgAUEMdEGA4ANxIAVBP3FBBnRyckH//8MASw0BIABBA2oLIQAgBkEBaiEGDAELCyAAIAJrC9QFAQR/IwBBEGsiACQAIAAgAjYCDCAAIAU2AggCfyAAIAI2AgwgACAFNgIIAkACQAJAA0ACQCAAKAIMIgEgA08NACAAKAIIIgUgBk8NAEECIQogAS0AACICQf//wwBLDQQgAAJ/IAJBGHRBGHVBAE4EQCAFIAI7AQAgAUEBagwBCyACQcIBSQ0FIAJB3wFNBEAgAyABa0ECSA0FIAEtAAEiCEHAAXFBgAFHDQQgCEE/cSACQQZ0QcAPcXIiAkH//8MASw0EIAUgAjsBACABQQJqDAELIAJB7wFNBEAgAyABa0EDSA0FIAEtAAIhCSABLQABIQgCQAJAIAJB7QFHBEAgAkHgAUcNASAIQeABcUGgAUYNAgwHCyAIQeABcUGAAUYNAQwGCyAIQcABcUGAAUcNBQsgCUHAAXFBgAFHDQQgCUE/cSAIQT9xQQZ0IAJBDHRyciICQf//A3FB///DAEsNBCAFIAI7AQAgAUEDagwBCyACQfQBSw0FQQEhCiADIAFrQQRIDQMgAS0AAyEJIAEtAAIhCCABLQABIQECQAJAAkACQCACQfABaw4FAAICAgECCyABQfAAakH/AXFBME8NCAwCCyABQfABcUGAAUcNBwwBCyABQcABcUGAAUcNBgsgCEHAAXFBgAFHDQUgCUHAAXFBgAFHDQUgBiAFa0EESA0DQQIhCiAJQT9xIgkgCEEGdCILQcAfcSABQQx0QYDgD3EgAkEHcSICQRJ0cnJyQf//wwBLDQMgBSAIQQR2QQNxIAFBAnQiAUHAAXEgAkEIdHIgAUE8cXJyQcD/AGpBgLADcjsBACAAIAVBAmo2AgggBSALQcAHcSAJckGAuANyOwECIAAoAgxBBGoLNgIMIAAgACgCCEECajYCCAwBCwsgASADSSEKCyAKDAILQQEMAQtBAgshASAEIAAoAgw2AgAgByAAKAIINgIAIABBEGokACABC/oFAQF/IwBBEGsiACQAIAAgAjYCDCAAIAU2AggCfyAAIAI2AgwgACAFNgIIIAAoAgwhAgJAAkADQCACIANPBEBBACEFDAMLQQIhBSACLwEAIgFB///DAEsNAgJAAkAgAUH/AE0EQEEBIQUgBiAAKAIIIgJrQQBMDQUgACACQQFqNgIIIAIgAToAAAwBCyABQf8PTQRAIAYgACgCCCICa0ECSA0EIAAgAkEBajYCCCACIAFBBnZBwAFyOgAAIAAgACgCCCICQQFqNgIIIAIgAUE/cUGAAXI6AAAMAQsgAUH/rwNNBEAgBiAAKAIIIgJrQQNIDQQgACACQQFqNgIIIAIgAUEMdkHgAXI6AAAgACAAKAIIIgJBAWo2AgggAiABQQZ2QT9xQYABcjoAACAAIAAoAggiAkEBajYCCCACIAFBP3FBgAFyOgAADAELIAFB/7cDTQRAQQEhBSADIAJrQQRIDQUgAi8BAiIIQYD4A3FBgLgDRw0CIAYgACgCCGtBBEgNBSAIQf8HcSABQQp0QYD4A3EgAUHAB3EiBUEKdHJyQYCABGpB///DAEsNAiAAIAJBAmo2AgwgACAAKAIIIgJBAWo2AgggAiAFQQZ2QQFqIgJBAnZB8AFyOgAAIAAgACgCCCIFQQFqNgIIIAUgAkEEdEEwcSABQQJ2QQ9xckGAAXI6AAAgACAAKAIIIgJBAWo2AgggAiAIQQZ2QQ9xIAFBBHRBMHFyQYABcjoAACAAIAAoAggiAUEBajYCCCABIAhBP3FBgAFyOgAADAELIAFBgMADSQ0EIAYgACgCCCICa0EDSA0DIAAgAkEBajYCCCACIAFBDHZB4AFyOgAAIAAgACgCCCICQQFqNgIIIAIgAUEGdkE/cUGAAXI6AAAgACAAKAIIIgJBAWo2AgggAiABQT9xQYABcjoAAAsgACAAKAIMQQJqIgI2AgwMAQsLQQIMAgtBAQwBCyAFCyEBIAQgACgCDDYCACAHIAAoAgg2AgAgAEEQaiQAIAELFQAgACgCCCIARQRAQQEPCyAAEIUCC7cBAQZ/A0ACQCAEIAlNDQAgAiADRg0AQQEhCCAAKAIIIQYjAEEQayIHJAAgByAGNgIMIAdBCGogB0EMahBQIQVBACACIAMgAmsgAUGgnQIgARsQnwEhBiAFKAIAIgUEQEHUnAIoAgAaIAUEQEHUnAJBkJsCIAUgBUF/Rhs2AgALCyAHQRBqJAACQAJAIAZBAmoOAwICAQALIAYhCAsgCUEBaiEJIAggCmohCiACIAhqIQIMAQsLIAoLgAEBA38gACgCCCEBIwBBEGsiAiQAIAIgATYCDCACQQhqIAJBDGoQUCEBIwBBEGsiAyQAIANBEGokACABKAIAIgEEQEHUnAIoAgAaIAEEQEHUnAJBkJsCIAEgAUF/Rhs2AgALCyACQRBqJAAgACgCCCIARQRAQQEPCyAAEIUCQQFGC5IBAQF/IwBBEGsiBSQAIAQgAjYCAAJ/QQIgBUEMakEAIAAoAggQtQEiAEEBakECSQ0AGkEBIABBAWsiASADIAQoAgBrSw0AGiAFQQxqIQIDfyABBH8gAi0AACEAIAQgBCgCACIDQQFqNgIAIAMgADoAACABQQFrIQEgAkEBaiECDAEFQQALCwshAiAFQRBqJAAgAguOBwEMfyMAQRBrIhEkACACIQkDQAJAIAMgCUYEQCADIQkMAQsgCS0AAEUNACAJQQFqIQkMAQsLIAcgBTYCACAEIAI2AgADQAJAAn8CQCACIANGDQAgBSAGRg0AIBEgASkCADcDCCAAKAIIIQojAEEQayIQJAAgECAKNgIMIBBBCGogEEEMahBQIRMgCSACayEMIwBBkAhrIg0kACANIAQoAgAiDjYCDCAGIAVrQQJ1QYACIAUbIQsgBSANQRBqIAUbIQ9BACEKAkACQAJAIA5FDQAgC0UNACAMQQJ2IgggC08hEiAIIAtJIAxBgwFNcQ0BA0AgDCALIAggEhsiCGshDCAPIA1BDGogCCABEM0CIghBf0YEQEEAIQsgDSgCDCEOQX8hCgwCCyALQQAgCCAPIA1BEGpGGyIOayELIA8gDkECdGohDyAIIApqIQogDSgCDCIORQ0BIAtFDQEgDEECdiIIIAtPIRIgDEGDAUsNACAIIAtPDQALDAELIA5FDQELIAtFDQAgDEUNACAKIQgDQAJAAkAgDyAOIAwgARCfASIKQQJqQQJNBEACQAJAIApBAWoOAgYAAQsgDUEANgIMDAILIAFBADYCAAwBCyANIA0oAgwgCmoiDjYCDCAIQQFqIQggC0EBayILDQELIAghCgwCCyAPQQRqIQ8gDCAKayEMIAghCiAMDQALCyAFBEAgBCANKAIMNgIACyANQZAIaiQAIBMoAgAiCARAQdScAigCABogCARAQdScAkGQmwIgCCAIQX9GGzYCAAsLIBBBEGokAAJAAkACQAJAIApBf0YEQANAAkAgByAFNgIAIAIgBCgCAEYNAEEBIQYCQAJAAkAgBSACIAkgAmsgEUEIaiAAKAIIEIYCIgFBAmoOAwgAAgELIAQgAjYCAAwFCyABIQYLIAIgBmohAiAHKAIAQQRqIQUMAQsLIAQgAjYCAAwFCyAHIAcoAgAgCkECdGoiBTYCACAFIAZGDQMgBCgCACECIAMgCUYEQCADIQkMCAsgBSACQQEgASAAKAIIEIYCRQ0BC0ECDAQLIAcgBygCAEEEajYCACAEIAQoAgBBAWoiAjYCACACIQkDQCADIAlGBEAgAyEJDAYLIAktAABFDQUgCUEBaiEJDAALAAsgBCACNgIAQQEMAgsgBCgCACECCyACIANHCyEAIBFBEGokACAADwsgBygCACEFDAALAAunCgERfyMAQRBrIhQkACACIQsDQAJAIAMgC0YEQCADIQsMAQsgCygCAEUNACALQQRqIQsMAQsLIAcgBTYCACAEIAI2AgADQAJAAkACQCACIANGDQAgBSAGRg0AIBQgASkCADcDCEEBIRYgACgCCCEOIwBBEGsiFSQAIBUgDjYCDCAVQQhqIBVBDGoQUCEYIAsgAmtBAnUhEUEAIQ4jAEGQAmsiDCQAIAwgBCgCACIINgIMIAYgBWtBgAIgBRshECAFIAxBEGogBRshEwJAAkACQCAIRQ0AIBBFDQACQCAQIBFNIgkNACARQSBLDQAMAgsDQCARIBAgESAJGyIJayERQQAhEiMAQRBrIhckAAJAAkACQAJAIBMiCgRAIAlBBE8NASAJIQgMAgtBACEJIAwoAgwiCigCACIIRQ0DA0BBASEPIAhBgAFPBEBBfyESIBdBDGogCBBvIg9Bf0YNBQsgCigCBCEIIApBBGohCiAJIA9qIgkhEiAIDQALDAMLIAwoAgwhDyAJIQgDQAJ/IA8oAgAiDUEBa0H/AE8EQCANRQRAIApBADoAACAMQQA2AgwMBQtBfyESIAogDRBvIg1Bf0YNBSAIIA1rIQggCiANagwBCyAKIA06AAAgCEEBayEIIAwoAgwhDyAKQQFqCyEKIAwgD0EEaiIPNgIMIAhBA0sNAAsLIAgEQCAMKAIMIQ8DQAJ/IA8oAgAiDUEBa0H/AE8EQCANRQRAIApBADoAACAMQQA2AgwMBQtBfyESIBdBDGogDRBvIg1Bf0YNBSAIIA1JDQQgCiAPKAIAEG8aIAggDWshCCAKIA1qDAELIAogDToAACAIQQFrIQggDCgCDCEPIApBAWoLIQogDCAPQQRqIg82AgwgCA0ACwsgCSESDAELIAkgCGshEgsgF0EQaiQAIBJBf0YEQEEAIRAgDCgCDCEIQX8hDgwCCyATQQAgEiATIAxBEGpGGyIJaiETIBAgCWshECAOIBJqIQ4gDCgCDCIIRQ0BIBBFDQEgECARTSIJDQAgEUEhTw0ACwwBCyAIRQ0BCyAQRQ0AIBFFDQAgDiEJA0ACQAJAIBMgCCgCABBvIgpBAWpBAU0EQEF/IQ4gCg0EIAxBADYCDAwBCyAMIAwoAgxBBGoiCDYCDCAJIApqIQkgECAKayIQDQELIAkhDgwCCyAKIBNqIRMgCSEOIBFBAWsiEQ0ACwsgBQRAIAQgDCgCDDYCAAsgDEGQAmokACAYKAIAIgkEQEHUnAIoAgAaIAkEQEHUnAJBkJsCIAkgCUF/Rhs2AgALCyAVQRBqJAACQAJAAkACQAJAIA5BAWoOAgAGAQsgByAFNgIAA0ACQCACIAQoAgBGDQAgBSACKAIAIAAoAggQtQEiAUF/Rg0AIAcgBygCACABaiIFNgIAIAJBBGohAgwBCwsgBCACNgIADAELIAcgBygCACAOaiIFNgIAIAUgBkYNAiADIAtGBEAgBCgCACECIAMhCwwHCyAUQQRqQQAgACgCCBC1ASILQX9HDQELQQIhFgwDCyAUQQRqIQIgBiAHKAIAayALSQ0CA0AgCwRAIAItAAAhBSAHIAcoAgAiDkEBajYCACAOIAU6AAAgC0EBayELIAJBAWohAgwBCwsgBCAEKAIAQQRqIgI2AgAgAiELA0AgAyALRgRAIAMhCwwFCyALKAIARQ0EIAtBBGohCwwACwALIAQoAgAhAgsgAiADRyEWCyAUQRBqJAAgFg8LIAcoAgAhBQwACwALCQAgABCOAhAbC1gAIwBBEGsiACQAIAAgBDYCDCAAIAMgAms2AggjAEEQayIBJAAgAEEIaiICKAIAIABBDGoiAygCAEkhBCABQRBqJAAgAiADIAQbKAIAIQEgAEEQaiQAIAELoSADEH8CfQF8IwBBMGsiCSQAIAEoAighByAJQQA2AiggCUIANwMgAkACQAJAAkACQCADIAdsIgRFBEBBACEEDAELIARBgICAgARPDQEgCSAEQQJ0IgUQHSIENgIgIAkgBCAFaiIGNgIoIARBACAFECEaIAkgBjYCJAsgA0EASgRAIAEoAgQhCEEAIQUgASgCIEECdCEKIAEoAiRBAnQhCwNAIAIgBSAIbEECdGoiDCALaiAKIAxqIgxrIg0EQCAEIAUgB2xBAnRqIAwgDRAeGgsgBUEBaiIFIANHDQALCyAGIARrIgpFDQMgCkECdSIHQQNxIQhBACEFIAdBAWsiC0EDTwRAIAdBfHEhAgNAIAQgBUECdCIGaiIMIAwqAgCROAIAIAQgBkEEcmoiDCAMKgIAkTgCACAEIAZBCHJqIgwgDCoCAJE4AgAgBCAGQQxyaiIGIAYqAgCROAIAIAVBBGohBSACQQRrIgINAAsLIAgEQANAIAQgBUECdGoiAiACKgIAkTgCACAFQQFqIQUgCEEBayIIDQALCyAEIAdBAnRqIQwgBCEGAkAgB0ECSQ0AIARBBGohBSAKQQhrIgJBAnZBAWpBA3EiCARAA0AgBSAGIAYqAgAgBSoCAF0bIQYgBUEEaiEFIAhBAWsiCA0ACwsgAkEMSQ0AA0AgBUEMaiAFQQhqIAVBBGogBSAGIAYqAgAgBSoCAF0bIgIgAioCACAFKgIEXRsiAiACKgIAIAUqAghdGyICIAIqAgAgBSoCDF0bIQYgBUEQaiIFIAxHDQALCyAHQQNxIQIgBioCALtEAAAAAICELkGjRAAAAAAAAIA+oLYhFEEAIQUgC0EDTwRAIAdBfHEhCANAIAQgBUECdCIGaiINIBQgDSoCACIVIBQgFV4bEFI4AgAgBCAGQQRyaiINIBQgDSoCACIVIBQgFV4bEFI4AgAgBCAGQQhyaiINIBQgDSoCACIVIBQgFV4bEFI4AgAgBCAGQQxyaiIGIBQgBioCACIVIBQgFV4bEFI4AgAgBUEEaiEFIAhBBGsiCA0ACwsgAgRAA0AgBCAFQQJ0aiIGIBQgBioCACIVIBQgFV4bEFI4AgAgBUEBaiEFIAJBAWsiAg0ACwsCQCAKQQRrIgJBAnZBAWpBB3EiCEUEQCAEIQUMAQsgBCEGA0AgFiAGKgIAu6AhFiAGQQRqIgUhBiAIQQFrIggNAAsLIAJBHEkNAgwBCxBBAAsDQCAWIAUqAgC7oCAFKgIEu6AgBSoCCLugIAUqAgy7oCAFKgIQu6AgBSoCFLugIAUqAhi7oCAFKgIcu6AhFiAFQSBqIgUgDEcNAAsLIAdBA3EhCCAWIAe4oyEWQQAhBSALQQNPBEAgB0F8cSECA0AgBCAFQQJ0IgZqIgcgByoCALsgFqG2OAIAIAQgBkEEcmoiByAHKgIAuyAWobY4AgAgBCAGQQhyaiIHIAcqAgC7IBahtjgCACAEIAZBDHJqIgYgBioCALsgFqG2OAIAIAVBBGohBSACQQRrIgINAAsLIAhFDQADQCAEIAVBAnRqIgIgAioCALsgFqG2OAIAIAVBAWohBSAIQQFrIggNAAsLQQAhAkEAIQVBACEKQQAhCyMAQRBrIgYkACABIgcoAighASAGQQA2AgggBkIANwMAAkACQCABBEAgAUGAgICABE8NASAGIAFBAnQiARAdIgI2AgAgBiABIAJqIgg2AggCQCABQQRrIg1BAnZBAWpBB3EiDEUEQCACIQEMAQsgAiEBA0AgAUH///97NgIAIAFBBGohASAMQQFrIgwNAAsLIA1BHE8EQANAIAFC////+////79/NwIYIAFC////+////79/NwIQIAFC////+////79/NwIIIAFC////+////79/NwIAIAFBIGoiASAIRw0ACwsgBiAINgIECyAHIAcoAgAoAhARAABBAEwNAQNAAkAgBygCKCIIQQBMDQAgBCAIIApsQQJ0aiEMQQAhASAIQQFHBEAgCEF+cSENA0AgAiABQQJ0Ig5qIhEqAgAgDCAOaioCACIUXQRAIBEgFDgCAAsgAiAOQQRyIg5qIhEqAgAgDCAOaioCACIUXQRAIBEgFDgCAAsgAUECaiEBIA1BAmsiDQ0ACwsgCEEBcUUNACACIAFBAnQiAWoiCCoCACABIAxqKgIAIhRdRQ0AIAggFDgCAAsgByAHKAIAKAIQEQAAIApBAWoiCkwNAiAGKAIAIQIMAAsACxBBAAsgBygCKCIBQQNOBEAgBygCUCEIIAFBAWshCkEBIQEDQAJAIAIgAUECdGoiBCoCACIUQwAAAABeRQ0AIBQgBEEEayoCAF5FDQAgFCAEKgIEXkUNACAIIAVBA3RqIgQgFDgCBCAEIAE2AgAgBUEBaiEFCyABQQFqIgEgCkcNAAsLIAcoAkggBygCRCIEayIBQQBKBEAgBEEAIAFBAnYgAUEDS2tBAnRBBGoQIRoLIAcoAmAgBygCXCIEayIBQQBKBEAgBEEAIAFBA3YgAUEHS2tBA3RBCGoQIRoLAkAgBUEATA0AIAcoAkggBygCRCIEayIBRQ0AIAFBAnUiAUEBIAFBAUsbIQggBygCUCEKA0AgBygCPCAHKAI4IgxrQQJ1IQ0gCiALQQN0aiIOIREgBygCXCESQQAhAQNAIBEqAgQgDSABIA4oAgBrIg8gD0EfdSIPaiAPcyIPSwR9IAwgD0ECdGoqAgAFQwAAAAALlCIUIAQgAUECdGoiDyoCAGAEQCAPIBQ4AgAgEiABQQN0aiIPIBQ4AgQgD0EANgIACyABQQFqIgEgCEcNAAsgC0EBaiILIAVHDQALCyACBEAgAhAbCyAGQRBqJAAgCUEANgIYIAkgCUEQaiIBNgIUIAkgATYCEAJAAkAgA0EASgRAIAcoAkQhCCAHKAJIIQtBACEFA0AgCyAIayIBBEAgBygCMCAHKAIsIgJrQQJ1IQYgBygCXCEKIAFBAnUiAUEBIAFBAUsbIQFBACEEA0AgCCAEQQJ0aiAKIARBA3RqIgsqAgQgBiALKAIAIAVrIgsgC0EfdSILaiALcyILSwR9IAIgC0ECdGoqAgAFQwAAAAALlDgCACAEQQFqIgQgAUcNAAsLIAcoAlAhAkEAIQoCQCAHKAIoIgFBA0gEQEEAIQYMAQsgCSgCICABIAVsQQJ0aiEIIAFBAWshC0EBIQRBACEGA0ACQCAIIARBAnRqIgEqAgAiFEMAAAAAXkUNACAUIAFBBGsqAgBeRQ0AIBQgASoCBF5FDQAgAiAGQQN0aiIBIBQ4AgQgASAENgIAIAZBAWohBgsgBEEBaiIEIAtHDQALIAcoAlAhAgsgAiACIAZBA3RqELQBIAcoAkQhCCAHKAJIIQsCQCAGQQBMDQAgCyAIayINQQJ1IgFBASABQQFLGyEOIAcoAhQhESAHKAJQIRJBACECA0ACQCASIAJBA3RqIgwqAgQiFCAIIAwoAgAiBEECdGoqAgBeRQ0AQRQQHSIBIAQ2AgggASAUOAIQIAEgBTYCDCABIAlBEGo2AgQgASAJKAIQIgQ2AgAgBCABNgIEIAkgATYCECAJIAkoAhhBAWo2AhggCkEBaiEKIA1FDQAgBygCPCAHKAI4IgFrQQJ1IQ8gBygCXCETQQAhBANAIAwqAgQgDyAEIAwoAgBrIhAgEEEfdSIQaiAQcyIQSwR9IAEgEEECdGoqAgAFQwAAAAALlCIUIAggBEECdGoiECoCAGAEQCAQIBQ4AgAgEyAEQQN0aiIQIBQ4AgQgECAFNgIACyAEQQFqIgQgDkcNAAsLIAogEUYNASACQQFqIgIgBkgNAAsLIAVBAWoiBSADRw0ACyAJKAIYDQELIABBADYCCCAAQgA3AgAMAQsgCSgCECgCDCEGIAcoAkQhBQJAIAcoAmAgBygCXCIBayICRQ0AIAJBA3UiAkEBIAJBAUsbIgJBA3EhCEEAIQQgAkEBa0EDTwRAIAJBfHEhAgNAIAEgBEEDdGoiAyAGNgIAIAMgBSAEQQJ0aioCADgCBCABIARBAXIiA0EDdGoiCiAGNgIAIAogBSADQQJ0aioCADgCBCABIARBAnIiA0EDdGoiCiAGNgIAIAogBSADQQJ0aioCADgCBCABIARBA3IiA0EDdGoiCiAGNgIAIAogBSADQQJ0aioCADgCBCAEQQRqIQQgAkEEayICDQALCyAIRQ0AA0AgASAEQQN0aiICIAY2AgAgAiAFIARBAnRqKgIAOAIEIARBAWohBCAIQQFrIggNAAsLQQAhCiAJQQA2AgggCUIANwMAAkAgCSgCFCAJQRBqRgRAQQAhBgwBCyAJQRBqIQICQAJAA0ACQCACKAIAIgMoAgwiASAGRg0AIAEhBiAHKAJIIAVrIgRFDQAgBygCMCAHKAIsIgZrQQJ1IQggBygCXCELIARBAnUiBEEBIARBAUsbIQxBACEEA0AgBSAEQQJ0aiALIARBA3RqIg0qAgQgCCANKAIAIAFrIg0gDUEfdSINaiANcyINSwR9IAYgDUECdGoqAgAFQwAAAAALlDgCACAEQQFqIgQgDEcNAAsgASEGCwJAAkAgAyoCECAFIAMoAghBAnRqKgIAXkUEQCADIQIMAQsCQCAJKAIIIApHBEAgCiADKQIINwIAIAogAygCEDYCCCAJIApBDGoiCjYCBAwBCyAKIAkoAgAiBGsiBUEMbSIIQQFqIgpB1qrVqgFPDQIgCiAIQQF0IgsgCiALSxtB1arVqgEgCEGq1arVAEkbIgsEfyALQdaq1aoBTw0FIAtBDGwQHQVBAAsiDCAIQQxsaiIIIAMpAgg3AgAgCCADKAIQNgIIIAggBUF0bUEMbGohAyAIQQxqIQogBUEASgRAIAMgBCAFEB4aCyAJIAwgC0EMbGo2AgggCSAKNgIEIAkgAzYCACAERQ0AIAQQGwsgAigCACECIAcoAkggBygCRCIFayIDRQ0AIAcoAjwgBygCOCIIa0ECdSELIAIqAhAhFSAHKAJcIQwgAigCCCENIANBAnUiA0EBIANBAUsbIQNBACEEA0AgFSALIAQgDWsiDiAOQR91Ig5qIA5zIg5LBH0gCCAOQQJ0aioCAAVDAAAAAAuUIhQgBSAEQQJ0aiIOKgIAYARAIA4gFDgCACAMIARBA3RqIg4gFDgCBCAOIAE2AgALIARBAWoiBCADRw0ACwsgAiAJKAIURg0DDAELCxBBAAtByhEQXAALIAkoAgAiBiAKRg0AIAcoAiAhASAGIQQDQCAEIAQoAgAgAWo2AgAgBEEMaiIEIApHDQALCyAJQRc2AiwgBiAKIAlBLGoQlAEgACAKNgIEIAAgBjYCACAAIAkoAgg2AgggCSgCGEUNACAJKAIUIgQoAgAiACAJKAIQIgEoAgQ2AgQgASgCBCAANgIAIAlBADYCGCAEIAlBEGpGDQADQCAEKAIEIQAgBBAbIAAiBCAJQRBqRw0ACwsgCSgCICIABEAgABAbCyAJQTBqJAALNAADQCABIAJGRQRAIAQgASwAACIAIAMgAEEAThs6AAAgBEEBaiEEIAFBAWohAQwBCwsgAgsMACABIAIgAUEAThsLKgADQCABIAJGRQRAIAMgAS0AADoAACADQQFqIQMgAUEBaiEBDAELCyACC0AAA0AgASACRwRAIAEgASwAACIAQQBOBH9BkMcBKAIAIAEsAABBAnRqKAIABSAACzoAACABQQFqIQEMAQsLIAILJwAgAUEATgR/QZDHASgCACABQf8BcUECdGooAgAFIAELQRh0QRh1C0AAA0AgASACRwRAIAEgASwAACIAQQBOBH9BgLsBKAIAIAEsAABBAnRqKAIABSAACzoAACABQQFqIQEMAQsLIAILJwAgAUEATgR/QYC7ASgCACABQf8BcUECdGooAgAFIAELQRh0QRh1CwkAIAAQiAIQGws1AANAIAEgAkZFBEAgBCABKAIAIgAgAyAAQYABSRs6AAAgBEEBaiEEIAFBBGohAQwBCwsgAguLAQECfyAAKAJIIAAoAkQiAmsiAUEASgRAIAJBACABQQJ2IAFBA0trQQJ0QQRqECEaCyAAKAJUIAAoAlAiAmsiAUEASgRAIAJBACABQQN2IAFBB0trQQN0QQhqECEaCyAAKAJgIAAoAlwiAWsiAEEASgRAIAFBACAAQQN2IABBB0trQQN0QQhqECEaCwsTACABIAIgAUGAAUkbQRh0QRh1CyoAA0AgASACRkUEQCADIAEsAAA2AgAgA0EEaiEDIAFBAWohAQwBCwsgAgtBAANAIAEgAkcEQCABIAEoAgAiAEH/AE0Ef0GQxwEoAgAgASgCAEECdGooAgAFIAALNgIAIAFBBGohAQwBCwsgAgseACABQf8ATQR/QZDHASgCACABQQJ0aigCAAUgAQsLQQADQCABIAJHBEAgASABKAIAIgBB/wBNBH9BgLsBKAIAIAEoAgBBAnRqKAIABSAACzYCACABQQRqIQEMAQsLIAILHgAgAUH/AE0Ef0GAuwEoAgAgAUECdGooAgAFIAELC0UAAkADQCACIANGDQECQCACKAIAQf8ASw0AQfi0ASgCACACKAIAQQF0ai8BACABcUUNACACQQRqIQIMAQsLIAIhAwsgAwtEAANAAkAgAiADRwR/IAIoAgBB/wBLDQFB+LQBKAIAIAIoAgBBAXRqLwEAIAFxRQ0BIAIFIAMLDwsgAkEEaiECDAALAAtGAANAIAEgAkcEQCADIAEoAgBB/wBNBH9B+LQBKAIAIAEoAgBBAXRqLwEABUEACzsBACADQQJqIQMgAUEEaiEBDAELCyACC3kBAX8gAEHwHzYCACAAKAJcIgEEQCAAIAE2AmAgARAbCyAAKAJQIgEEQCAAIAE2AlQgARAbCyAAKAJEIgEEQCAAIAE2AkggARAbCyAAKAI4IgEEQCAAIAE2AjwgARAbCyAAKAIsIgEEQCAAIAE2AjAgARAbCyAAEBsLJAAgAkH/AE0Ef0H4tAEoAgAgAkEBdGovAQAgAXFBAEcFQQALC0ABAn8gACgCACgCACIAKAIAIAAoAggiAkEBdWohASAAKAIEIQAgASACQQFxBH8gASgCACAAaigCAAUgAAsRAQALDwAgACAAKAIAKAIEEQEACx8AIAACf0HkngJB5J4CKAIAQQFqIgA2AgAgAAs2AgQLCQAgABCLAhAbC3cBAX8gAEHwHzYCACAAKAJcIgEEQCAAIAE2AmAgARAbCyAAKAJQIgEEQCAAIAE2AlQgARAbCyAAKAJEIgEEQCAAIAE2AkggARAbCyAAKAI4IgEEQCAAIAE2AjwgARAbCyAAKAIsIgEEQCAAIAE2AjAgARAbCyAAC8EBACMAQRBrIgMkAAJAIAUtAAtBB3ZFBEAgACAFKAIINgIIIAAgBSkCADcCAAwBCyAFKAIAIQQCQAJAAkAgBSgCBCICQQFNBEAgACIBIAI6AAsMAQsgAkHv////A0sNASAAIAAgAkECTwR/IAJBBGpBfHEiASABQQFrIgEgAUECRhsFQQELQQFqIgUQdiIBNgIAIAAgBUGAgICAeHI2AgggACACNgIECyABIAQgAkEBahBiDAELEEUACwsgA0EQaiQACwkAIAAgBRDDAQvhBQEJfyMAQfADayIAJAAgAEHoA2oiByADKAIcIgY2AgAgBiAGKAIEQQFqNgIEIAcQQCEKIAICfwJ/IAUiBi0AC0EHdgRAIAYoAgQMAQsgBi0ACwsEQAJ/IAYtAAtBB3YEQCAGKAIADAELIAYLKAIAIApBLSAKKAIAKAIsEQIARiELCyALCyAAQegDaiAAQeADaiAAQdwDaiAAQdgDaiAAQcgDahAgIgwgAEG4A2oQICIHIABBqANqECAiCCAAQaQDahCRAiAAQTc2AhAgAEEIakEAIABBEGoiAhAsIQkCQAJ/An8gBi0AC0EHdgRAIAUoAgQMAQsgBS0ACwsgACgCpANKBEACfyAFLQALQQd2BEAgBSgCBAwBCyAFLQALCyEGIAAoAqQDIg0hDgJ/IActAAtBB3YEQCAHKAIEDAELIActAAsLAn8gCC0AC0EHdgRAIAgoAgQMAQsgCC0ACwsgBiAOa0EBdGpqIA1qQQFqDAELIAAoAqQDAn8gCC0AC0EHdgRAIAgoAgQMAQsgCC0ACwsCfyAHLQALQQd2BEAgBygCBAwBCyAHLQALC2pqQQJqCyIGQeUASQ0AIAZBAnQQKCEGIAkoAgAhAiAJIAY2AgAgAgRAIAIgCSgCBBEBAAsgCSgCACICDQAQNwALIAIgAEEEaiAAIAMoAgQCfyAFLQALQQd2BEAgBSgCAAwBCyAFCwJ/IAUtAAtBB3YEQCAFKAIADAELIAULAn8gBS0AC0EHdgRAIAUoAgQMAQsgBS0ACwtBAnRqIAogCyAAQeADaiAAKALcAyAAKALYAyAMIAcgCCAAKAKkAxCQAiABIAIgACgCBCAAKAIAIAMgBBBdIQIgCSgCACEBIAlBADYCACABBEAgASAJKAIEEQEACyAIEBwaIAcQHBogDBAcGiAAKALoAyIBIAEoAgRBAWsiAzYCBCADQX9GBEAgASABKAIAKAIIEQEACyAAQfADaiQAIAIL9gYBC38jAEGwCGsiACQAIAAgBTcDECAAIAY3AxggACAAQcAHaiIHNgK8ByAHQeQAQaIRIABBEGoQxQEhCSAAQTc2AqAEIABBmARqQQAgAEGgBGoiDBAsIQ0gAEE3NgKgBCAAQZAEakEAIAwQLCEKAkAgCUHkAE8EQBAmIQcgACAFNwMAIAAgBjcDCCAAQbwHaiAHQaIRIAAQViIJQX9GDQEgDSgCACEHIA0gACgCvAc2AgAgBwRAIAcgDSgCBBEBAAsgCUECdBAoIQggCigCACEHIAogCDYCACAHBEAgByAKKAIEEQEACyAKKAIARQ0BIAooAgAhDAsgAEGIBGoiCCADKAIcIgc2AgAgByAHKAIEQQFqNgIEIAgQQCIRIgcgACgCvAciCCAIIAlqIAwgBygCACgCMBEHABogAgJ/IAlBAEoEQCAAKAK8By0AAEEtRiEPCyAPCyAAQYgEaiAAQYAEaiAAQfwDaiAAQfgDaiAAQegDahAgIhAgAEHYA2oQICIHIABByANqECAiCCAAQcQDahCRAiAAQTc2AjAgAEEoakEAIABBMGoiAhAsIQsCfyAAKALEAyIOIAlIBEAgACgCxAMCfyAHLQALQQd2BEAgBygCBAwBCyAHLQALCwJ/IAgtAAtBB3YEQCAIKAIEDAELIAgtAAsLIAkgDmtBAXRqampBAWoMAQsgACgCxAMCfyAILQALQQd2BEAgCCgCBAwBCyAILQALCwJ/IActAAtBB3YEQCAHKAIEDAELIActAAsLampBAmoLIg5B5QBPBEAgDkECdBAoIQ4gCygCACECIAsgDjYCACACBEAgAiALKAIEEQEACyALKAIAIgJFDQELIAIgAEEkaiAAQSBqIAMoAgQgDCAMIAlBAnRqIBEgDyAAQYAEaiAAKAL8AyAAKAL4AyAQIAcgCCAAKALEAxCQAiABIAIgACgCJCAAKAIgIAMgBBBdIQIgCygCACEBIAtBADYCACABBEAgASALKAIEEQEACyAIEBwaIAcQHBogEBAcGiAAKAKIBCIBIAEoAgRBAWsiAzYCBCADQX9GBEAgASABKAIAKAIIEQEACyAKKAIAIQEgCkEANgIAIAEEQCABIAooAgQRAQALIA0oAgAhASANQQA2AgAgAQRAIAEgDSgCBBEBAAsgAEGwCGokACACDwsQNwAL2wUBCX8jAEHAAWsiACQAIABBuAFqIgcgAygCHCIGNgIAIAYgBigCBEEBajYCBCAHEEMhCiACAn8CfyAFIgYtAAtBB3YEQCAGKAIEDAELIAYtAAsLBEACfyAGLQALQQd2BEAgBigCAAwBCyAGCy0AACAKQS0gCigCACgCHBECAEH/AXFGIQsLIAsLIABBuAFqIABBsAFqIABBrwFqIABBrgFqIABBoAFqECAiDCAAQZABahAgIgcgAEGAAWoQICIIIABB/ABqEJQCIABBNzYCECAAQQhqQQAgAEEQaiICECwhCQJAAn8CfyAGLQALQQd2BEAgBSgCBAwBCyAFLQALCyAAKAJ8SgRAAn8gBS0AC0EHdgRAIAUoAgQMAQsgBS0ACwshBiAAKAJ8Ig0hDgJ/IActAAtBB3YEQCAHKAIEDAELIActAAsLAn8gCC0AC0EHdgRAIAgoAgQMAQsgCC0ACwsgBiAOa0EBdGpqIA1qQQFqDAELIAAoAnwCfyAILQALQQd2BEAgCCgCBAwBCyAILQALCwJ/IActAAtBB3YEQCAHKAIEDAELIActAAsLampBAmoLIgZB5QBJDQAgBhAoIQYgCSgCACECIAkgBjYCACACBEAgAiAJKAIEEQEACyAJKAIAIgINABA3AAsgAiAAQQRqIAAgAygCBAJ/IAUtAAtBB3YEQCAFKAIADAELIAULAn8gBS0AC0EHdgRAIAUoAgAMAQsgBQsCfyAFLQALQQd2BEAgBSgCBAwBCyAFLQALC2ogCiALIABBsAFqIAAsAK8BIAAsAK4BIAwgByAIIAAoAnwQkwIgASACIAAoAgQgACgCACADIAQQXiECIAkoAgAhASAJQQA2AgAgAQRAIAEgCSgCBBEBAAsgCBAcGiAHEBwaIAwQHBogACgCuAEiASABKAIEQQFrIgM2AgQgA0F/RgRAIAEgASgCACgCCBEBAAsgAEHAAWokACACC+0GAQt/IwBB0ANrIgAkACAAIAU3AxAgACAGNwMYIAAgAEHgAmoiBzYC3AIgB0HkAEGiESAAQRBqEMUBIQkgAEE3NgLwASAAQegBakEAIABB8AFqIgwQLCENIABBNzYC8AEgAEHgAWpBACAMECwhCgJAIAlB5ABPBEAQJiEHIAAgBTcDACAAIAY3AwggAEHcAmogB0GiESAAEFYiCUF/Rg0BIA0oAgAhByANIAAoAtwCNgIAIAcEQCAHIA0oAgQRAQALIAkQKCEIIAooAgAhByAKIAg2AgAgBwRAIAcgCigCBBEBAAsgCigCAEUNASAKKAIAIQwLIABB2AFqIgggAygCHCIHNgIAIAcgBygCBEEBajYCBCAIEEMiESIHIAAoAtwCIgggCCAJaiAMIAcoAgAoAiARBwAaIAICfyAJQQBKBEAgACgC3AItAABBLUYhDwsgDwsgAEHYAWogAEHQAWogAEHPAWogAEHOAWogAEHAAWoQICIQIABBsAFqECAiByAAQaABahAgIgggAEGcAWoQlAIgAEE3NgIwIABBKGpBACAAQTBqIgIQLCELAn8gACgCnAEiDiAJSARAIAAoApwBAn8gBy0AC0EHdgRAIAcoAgQMAQsgBy0ACwsCfyAILQALQQd2BEAgCCgCBAwBCyAILQALCyAJIA5rQQF0ampqQQFqDAELIAAoApwBAn8gCC0AC0EHdgRAIAgoAgQMAQsgCC0ACwsCfyAHLQALQQd2BEAgBygCBAwBCyAHLQALC2pqQQJqCyIOQeUATwRAIA4QKCEOIAsoAgAhAiALIA42AgAgAgRAIAIgCygCBBEBAAsgCygCACICRQ0BCyACIABBJGogAEEgaiADKAIEIAwgCSAMaiARIA8gAEHQAWogACwAzwEgACwAzgEgECAHIAggACgCnAEQkwIgASACIAAoAiQgACgCICADIAQQXiECIAsoAgAhASALQQA2AgAgAQRAIAEgCygCBBEBAAsgCBAcGiAHEBwaIBAQHBogACgC2AEiASABKAIEQQFrIgM2AgQgA0F/RgRAIAEgASgCACgCCBEBAAsgCigCACEBIApBADYCACABBEAgASAKKAIEEQEACyANKAIAIQEgDUEANgIAIAEEQCABIA0oAgQRAQALIABB0ANqJAAgAg8LEDcAC7oIAQR/IwBBwANrIgAkACAAIAI2ArADIAAgATYCuAMgAEE4NgIUIABBGGogAEEgaiAAQRRqIggQLCEJIABBEGoiByAEKAIcIgE2AgAgASABKAIEQQFqNgIEIAcQQCEBIABBADoADyAAQbgDaiACIAMgByAEKAIEIAUgAEEPaiABIAkgCCAAQbADahCZAgRAIwBBEGsiAiQAAkAgBi0AC0EHdgRAIAYoAgAhAyACQQA2AgwgAyACKAIMNgIAIAZBADYCBAwBCyACQQA2AgggBiACKAIINgIAIAZBADoACwsgAkEQaiQAIAAtAA8EQCAGIAFBLSABKAIAKAIsEQIAEKoBCyABQTAgASgCACgCLBECACEBIAko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BkEQaiQAIAIQHBoMAQsgBiACIANrSwRAIAEgAiADIAZqIAJrIAMgAxCsAQsCfyABLQALQQd2BEAgASgCAAwBCyABCyADaiECA0AgBCAHRwRAIAIgBC0AADoAACAEQQFqIQQgAkEBaiECDAELCyAIQQA6AA8gAiAILQAPOgAAIAMgBmohAgJAIAEtAAtBB3YEQCABIAI2AgQMAQsgASACOgALCwsgCEEgaiQACyAAQZgBaiAAQZABahA0BEAgBSAFKAIAQQJyNgIACyAAKAKYASECIAAoAhAiASABKAIEQQFrIgM2AgQgA0F/RgRAIAEgASgCACgCCBEBAAsgCigCACEBIApBADYCACABBEAgASAKKAIEEQEACyAAQaABaiQAIAILQQEBfyAAQbAfNgIAIAAoAhQiAQRAIAEQGwsgAEEANgIUIAAoAhAiAQRAIAEQGwsgAEEANgIQIAAoAgwQGyAAEBsL2QQBAn8jAEGgAmsiACQAIAAgAjYCkAIgACABNgKYAiAAQTg2AhAgAEGYAWogAEGgAWogAEEQahAsIQcgAEGQAWoiCCAEKAIcIgE2AgAgASABKAIEQQFqNgIEIAgQQyEBIABBADoAjwECQCAAQZgCaiACIAMgCCAEKAIEIAUgAEGPAWogASAHIABBlAFqIABBhAJqEKACRQ0AIABBzRkoAAA2AIcBIABBxhkpAAA3A4ABIAEgAEGAAWogAEGKAWogAEH2AGogASgCACgCIBEHABogAEE3NgIQIABBCGpBACAAQRBqIgIQLCEBAkAgACgClAEgBygCAGtB4wBOBEAgACgClAEgBygCAGtBAmoQKCEDIAEoAgAhAiABIAM2AgAgAgRAIAIgASgCBBEBAAsgASgCAEUNASABKAIAIQILIAAtAI8BBEAgAkEtOgAAIAJBAWohAgsgBygCACEEA0AgACgClAEgBE0EQAJAIAJBADoAACAAIAY2AgAgAEEQaiAAENACQQFHDQAgASgCACECIAFBADYCACACBEAgAiABKAIEEQEACwwECwUgAiAAQfYAaiIDIANBCmogBBC+ASAAayAAai0ACjoAACACQQFqIQIgBEEBaiEEDAELCxA3AAsQNwALIABBmAJqIABBkAJqEDQEQCAFIAUoAgBBAnI2AgALIAAoApgCIQIgACgCkAEiASABKAIEQQFrIgM2AgQg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AgQgAkF/RgRAIAEgASgCACgCCBEBAAsgAEHAAWoQICICIAItAAtBB3YEfyACKAIIQf////8HcUEBawVBCgsQHyAAAn8gAi0AC0EHdgRAIAIoAgAMAQsgAgsiATYCvAEgACAGNgIMIABBADYCCANAAkAgAEGIAmogAEGAAmoQPkUNACAAKAK8AQJ/IAItAAtBB3YEQCACKAIEDAELIAItAAsLIAFqRgRAAn8gAiIBLQALQQd2BEAgASgCBAwBCyABLQALCyEDIAECfyABLQALQQd2BEAgASgCBAwBCyABLQALC0EBdBAfIAEgAS0AC0EHdgR/IAEoAghB/////wdxQQFrBUEKCxAfIAAgAwJ/IAEtAAtBB3YEQCACKAIADAELIAILIgFqNgK8AQsgAEGIAmoQLUEQIAEgAEG8AWogAEEIakEAIAcgAEEQaiAAQQxqIABB4AFqEHsNACAAQYgCahAxGgwBCwsgAiAAKAK8ASABaxAfAn8gAi0AC0EHdgRAIAIoAgAMAQsgAgshARAmIQMgACAFNgIAIAEgAyAAEL0CQQFHBEAgBEEENgIACyAAQYgCaiAAQYACahA0BEAgBCAEKAIAQQJyNgIACyAAKAKIAiEBIAIQHBogBxAcGiAAQZACaiQAIAEL/wQBAX4jAEGgAmsiACQAIAAgAjYCkAIgACABNgKYAiAAQeABaiADIABB8AFqIABB7wFqIABB7gFqEMABIABB0AFqECAiASABLQALQQd2BH8gASgCCEH/////B3FBAWsFQQoLEB8gAAJ/IAEtAAtBB3YEQCABKAIADAELIAELIgI2AswBIAAgAEEgajYCHCAAQQA2AhggAEEBOgAXIABBxQA6ABYDQAJAIABBmAJqIABBkAJqED5FDQAgACgCzAECfyABLQALQQd2BEAgASgCBAwBCyABLQALCyACakYEQAJ/IAEiAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwshAyACAn8gAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwtBAXQQHyACIAItAAtBB3YEfyACKAIIQf////8HcUEBawVBCgsQHyAAIAMCfyACLQALQQd2BEAgASgCAAwBCyABCyICajYCzAELIABBmAJqEC0gAEEXaiAAQRZqIAIgAEHMAWogACwA7wEgACwA7gEgAEHgAWogAEEgaiAAQRxqIABB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DCAAQQA2AggDQAJAIABBiAJqIABBgAJqED5FDQAgACgCvAECfyABLQALQQd2BEAgASgCBAwBCyABLQALCyACakYEQAJ/IAEiAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwshAyACAn8gAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwtBAXQQHyACIAItAAtBB3YEfyACKAIIQf////8HcUEBawVBCgsQHyAAIAMCfyACLQALQQd2BEAgASgCAAwBCyABCyICajYCvAELIABBiAJqEC0gBiACIABBvAFqIABBCGogACwA/wEgAEHQAWogAEEQaiAAQQxqQeDTARB7DQAgAEGIAmoQMRoMAQsLAkACfyAALQDbAUEHdgRAIAAoAtQBDAELIAAtANsBC0UNACAAKAIMIgMgAEEQamtBnwFKDQAgACADQQRqNgIMIAMgACgCCDYCAAsgBSACIAAoArwBIAQgBhDCAjcDACAAQdABaiAAQRBqIAAoAgwgBBA7IABBiAJqIABBgAJqEDQEQCAEIAQoAgBBAnI2AgALIAAoAogCIQIgARAcGiAAQdABahAcGiAAQZACaiQAIAILvgQBAX8jAEGQAmsiACQAIAAgAjYCgAIgACABNgKIAiADEFchBiAAQdABaiADIABB/wFqEIYBIABBwAFqECAiASABLQALQQd2BH8gASgCCEH/////B3FBAWsFQQoLEB8gAAJ/IAEtAAtBB3YEQCABKAIADAELIAELIgI2ArwBIAAgAEEQajYCDCAAQQA2AggDQAJAIABBiAJqIABBgAJqED5FDQAgACgCvAECfyABLQALQQd2BEAgASgCBAwBCyABLQALCyACakYEQAJ/IAEiAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwshAyACAn8gAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwtBAXQQHyACIAItAAtBB3YEfyACKAIIQf////8HcUEBawVBCgsQHyAAIAMCfyACLQALQQd2BEAgASgCAAwBCyABCyICajYCvAELIABBiAJqEC0gBiACIABBvAFqIABBCGogACwA/wEgAEHQAWogAEEQaiAAQQxqQeDTARB7DQAgAEGIAmoQMRoMAQsLAkACfyAALQDbAUEHdgRAIAAoAtQBDAELIAAtANsBC0UNACAAKAIMIgMgAEEQamtBnwFKDQAgACADQQRqNgIMIAMgACgCCDYCAAsgBSACIAAoArwBIAQgBhDFAjsBACAAQdABaiAAQRBqIAAoAgwgBBA7IABBiAJqIABBgAJqEDQEQCAEIAQoAgBBAnI2AgALIAAoAogCIQIgARAcGiAAQdABahAcGiAAQZACaiQAIAILvgQBAX8jAEGQAmsiACQAIAAgAjYCgAIgACABNgKIAiADEFchBiAAQdABaiADIABB/wFqEIYBIABBwAFqECAiASABLQALQQd2BH8gASgCCEH/////B3FBAWsFQQoLEB8gAAJ/IAEtAAtBB3YEQCABKAIADAELIAELIgI2ArwBIAAgAEEQajYCDCAAQQA2AggDQAJAIABBiAJqIABBgAJqED5FDQAgACgCvAECfyABLQALQQd2BEAgASgCBAwBCyABLQALCyACakYEQAJ/IAEiAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwshAyACAn8gAi0AC0EHdgRAIAIoAgQMAQsgAi0ACwtBAXQQHyACIAItAAtBB3YEfyACKAIIQf////8HcUEBawVBCgsQHyAAIAMCfyACLQALQQd2BEAgASgCAAwBCyABCyICajYCvAELIABBiAJqEC0gBiACIABBvAFqIABBCGogACwA/wEgAEHQAWogAEEQaiAAQQxqQeDTARB7DQAgAEGIAmoQMRoMAQsLAkACfyAALQDbAUEHdgRAIAAoAtQBDAELIAAtANsBC0UNACAAKAIMIgMgAEEQamtBnwFKDQAgACADQQRqNgIMIAMgACgCCDYCAAsgBSACIAAoArwBIAQgBhDGAjcDACAAQdABaiAAQRBqIAAoAgwgBBA7IABBiAJqIABBgAJqEDQEQCAEIAQoAgBBAnI2AgALIAAoAogCIQIgARAcGiAAQdABahAcGiAAQZACaiQAIAILGABBq5ICLAAAQQBIBEBBoJICKAIAEBsLC74EAQF/IwBBkAJrIgAkACAAIAI2AoACIAAgATYCiAIgAxBXIQYgAEHQAWogAyAAQf8BahCGASAAQcABahAgIgEgAS0AC0EHdgR/IAEoAghB/////wdxQQFrBUEKCxAfIAACfyABLQALQQd2BEAgASgCAAwBCyABCyICNgK8ASAAIABBEGo2AgwgAEEANgIIA0ACQCAAQYgCaiAAQYACahA+RQ0AIAAoArwBAn8gAS0AC0EHdgRAIAEoAgQMAQsgAS0ACwsgAmpGBEACfyABIgItAAtBB3YEQCACKAIEDAELIAItAAsLIQMgAgJ/IAItAAtBB3YEQCACKAIEDAELIAItAAsLQQF0EB8gAiACLQALQQd2BH8gAigCCEH/////B3FBAWsFQQoLEB8gACADAn8gAi0AC0EHdgRAIAEoAgAMAQsgAQsiAmo2ArwBCyAAQYgCahAtIAYgAiAAQbwBaiAAQQhqIAAsAP8BIABB0AFqIABBEGogAEEMakHg0wEQew0AIABBiAJqEDEaDAELCwJAAn8gAC0A2wFBB3YEQCAAKALUAQwBCyAALQDbAQtFDQAgACgCDCIDIABBEGprQZ8BSg0AIAAgA0EEajYCDCADIAAoAgg2AgALIAUgAiAAKAK8ASAEIAYQxwI2AgAgAEHQAWogAEEQaiAAKAIMIAQQOyAAQYgCaiAAQYACahA0BEAgBCAEKAIAQQJyNgIACyAAKAKIAiECIAEQHBogAEHQAWoQHBogAEGQAmokACACCzQBAX8jAEEQayIEJAAgACgCACEAIAQgAzoADyABIAIgBEEPaiAAEQQAIQAgBEEQaiQAIAAL7QIBAn8jAEEgayIGJAAgBiABNgIYAkAgAygCBEEBcUUEQCAGQX82AgAgBiAAIAEgAiADIAQgBiAAKAIAKAIQEQUAIgE2AhgCQAJAAkAgBigCAA4CAAECCyAFQQA6AAAMAwsgBUEBOgAADAILIAVBAToAACAEQQQ2AgAMAQsgBiADKAIcIgA2AgAgACAAKAIEQQFqNgIEIAYQQyEHIAYoAgAiACAAKAIEQQFrIgE2AgQgAUF/RgRAIAAgACgCACgCCBEBAAsgBiADKAIcIgA2AgAgACAAKAIEQQFqNgIEIAYQfCEAIAYoAgAiASABKAIEQQFrIgM2AgQgA0F/RgRAIAEgASgCACgCCBEBAAsgBiAAIAAoAgAoAhgRAwAgBkEMciAAIAAoAgAoAhwRAwAgBSAGQRhqIgMgAiAGIAMgByAEQQEQngEgBkY6AAAgBigCGCEBA0AgA0EMaxAcIgMgBkcNAAsLIAZBIGokACABC0ABAX9BACEAA38gASACRgR/IAAFIAEoAgAgAEEEdGoiAEGAgICAf3EiA0EYdiADciAAcyEAIAFBBGohAQwBCwsLGwAjAEEQayIBJAAgACACIAMQyAIgAUEQaiQAC1QBAn8CQANAIAMgBEcEQEF/IQAgASACRg0CIAEoAgAiBSADKAIAIgZIDQIgBSAGSgRAQQEPBSADQQRqIQMgAUEEaiEBDAILAAsLIAEgAkchAAsgAAtAAQF/QQAhAAN/IAEgAkYEfyAABSABLAAAIABBBHRqIgBBgICAgH9xIgNBGHYgA3IgAHMhACABQQFqIQEMAQsLCwsAIAAgAiADEMoCC14BA38gASAEIANraiEFAkADQCADIARHBEBBfyEAIAEgAkYNAiABLAAAIgYgAywAACIHSA0CIAYgB0oEQEEBDwUgA0EBaiEDIAFBAWohAQwCCwALCyACIAVHIQALIAALFAAgACgCACABaiACLQAAOgAAQQELAwAACzcBAX8jAEEQayIDJAAgA0EIaiABIAIgACgCABEGACADKAIIEA0gAygCCCIAEAwgA0EQaiQAIAALUgECfyABIAAoAlQiASABIAJBgAJqIgMQ2wIiBCABayADIAQbIgMgAiACIANLGyICEB4aIAAgASADaiIDNgJUIAAgAzYCCCAAIAEgAmo2AgQgAgszAQF/IAAoAhQiAyABIAIgACgCECADayIBIAEgAksbIgEQHhogACAAKAIUIAFqNgIUIAILSwECfyMAQRBrIgMkAEEBIQQgACACIAEoAgQgASgCACIBa0kEfyADIAEgAmosAAA2AghB7I0CIANBCGoQDgVBAQs2AgAgA0EQaiQACwkAIAAQxwEQGws1AQF/IAEgACgCBCICQQF1aiEBIAAoAgAhACABIAJBAXEEfyABKAIAIABqKAIABSAACxEAAAsNACAAKAIEIAAoAgBrC1QBAn8jAEEQayIEJAAgASAAKAIEIgVBAXVqIQEgACgCACEAIAVBAXEEQCABKAIAIABqKAIAIQALIAQgAzoADyABIAIgBEEPaiAAEQYAIARBEGokAAurBAEGfyABIAAoAgQgACgCACIFayIDSwRAAkAgASADayIGIAAiBSgCCCIBIAAoAgQiA2tNBEACQCAGRQ0AIAMhACAGQQdxIgQEQANAIAAgAi0AADoAACAAQQFqIQAgBEEBayIEDQALCyADIAZqIQMgBkEBa0EHSQ0AA0AgACACLQAAOgAAIAAgAi0AADoAASAAIAItAAA6AAIgACACLQAAOgADIAAgAi0AADoABCAAIAItAAA6AAUgACACLQAAOgAGIAAgAi0AADoAByAAQQhqIgAgA0cNAAsLIAUgAzYCBAwBCyADIAUoAgAiAGsiBCAGaiIHQQBOBEAgBCAHIAEgAGsiAUEBdCIAIAAgB0kbQf////8HIAFB/////wNJGyIIBH8gCBAdBUEACyIHaiIBIQAgBkEHcSIEBEAgASEAA0AgACACLQAAOgAAIABBAWohACAEQQFrIgQNAAsLIAEgBmohBCAGQQFrQQdPBEADQCAAIAItAAA6AAAgACACLQAAOgABIAAgAi0AADoAAiAAIAItAAA6AAMgACACLQAAOgAEIAAgAi0AADoABSAAIAItAAA6AAYgACACLQAAOgAHIABBCGoiACAERw0ACwsgASADIAUoAgAiAmsiAWshACABQQBKBEAgACACIAEQHhoLIAUgByAIajYCCCAFIAQ2AgQgBSAANgIAIAIEQCACEBsLDAELEEEACw8LIAEgA0kEQCAAIAEgBWo2AgQLC2ABBX8jAEEwayIDJAAgASgCBCEFIAEoAgAhBiABLQALIQQgAxDAAiICELgCIAIgBiABIARBGHRBGHVBAEgiARsgBSAEIAEbQQJ2ELMCIAAgAhCxAiACELoCIANBMGokAAsLufEBNgBBgAgLtBZpbmZpbml0eQBpbnN1ZmZpY2llbnQgbWVtb3J5AEZlYnJ1YXJ5AEphbnVhcnkAbmVlZCBkaWN0aW9uYXJ5AEp1bHkAVGh1cnNkYXkAVHVlc2RheQBXZWRuZXNkYXkAU2F0dXJkYXkAU3VuZGF5AE1vbmRheQBGcmlkYXkATWF5ACVtLyVkLyV5AC0rICAgMFgweAAtMFgrMFggMFgtMHgrMHggMHgATm92AFRodQBBdWd1c3QAdW5zaWduZWQgc2hvcnQAdW5zaWduZWQgaW50AEFGUENsaWVudABpbnZhbGlkIGxpdGVyYWwvbGVuZ3RocyBzZXQAaW52YWxpZCBjb2RlIGxlbmd0aHMgc2V0AHVua25vd24gaGVhZGVyIGZsYWdzIHNldABpbnZhbGlkIGRpc3RhbmNlcyBzZXQAZ2V0AE9jdABmbG9hdABpbnZhbGlkIGJpdCBsZW5ndGggcmVwZWF0AFNhdAB1aW50NjRfdAB0b28gbWFueSBsZW5ndGggb3IgZGlzdGFuY2Ugc3ltYm9scwBpbnZhbGlkIHN0b3JlZCBibG9jayBsZW5ndGhzAGtleS5zaXplKCkgPT0gUGFyYW06OmtCbG9ja0J5dGVzAEFwcgB2ZWN0b3IAc2lnbkZhY3RvcgBTcGVjQ2FsY3VsYXRvcgBidWZmZXIgZXJyb3IAc3RyZWFtIGVycm9yAGZpbGUgZXJyb3IAZGF0YSBlcnJvcgBPY3RvYmVyAE5vdmVtYmVyAFNlcHRlbWJlcgBEZWNlbWJlcgB1bnNpZ25lZCBjaGFyAGlvc19iYXNlOjpjbGVhcgBNYXIAY2xpZW50L0FGUENsaWVudC5jcHAAZmZ0L1NwZWNDYWxjdWxhdG9yLmNwcAB1dGlsL0VuY3J5cHRpb24uY3BwAFNlcAAlSTolTTolUyAlcABTdW4ASnVuAGZyZXFSZXNvbHV0aW9uAEFFU19FbmNyeXB0aW9uAHN0ZDo6ZXhjZXB0aW9uAF9fY3hhX2d1YXJkX2FjcXVpcmUgZGV0ZWN0ZWQgcmVjdXJzaXZlIGluaXRpYWxpemF0aW9uAGluY29tcGF0aWJsZSB2ZXJzaW9uAE1vbgBuYW4ASmFuAG1heFBrc1BlckZybQBKdWwAYm9vbABsbABBcHJpbAByZW1vdmVTaWwAZW1zY3JpcHRlbjo6dmFsAGludmFsaWQgY29kZSAtLSBtaXNzaW5nIGVuZC1vZi1ibG9jawBpbmNvcnJlY3QgaGVhZGVyIGNoZWNrAGluY29ycmVjdCBsZW5ndGggY2hlY2sAaW5jb3JyZWN0IGRhdGEgY2hlY2sAcHVzaF9iYWNrAGludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrAEZyaQBoZWFkZXIgY3JjIG1pc21hdGNoAE1hcmNoAEV4dHJhY3RRdWVyeUZQRGVidWcAQXVnAHVuc2lnbmVkIGxvbmcAc3RkOjp3c3RyaW5nAGJhc2ljX3N0cmluZwBzdGQ6OnN0cmluZwBzdGQ6OnUxNnN0cmluZwBzdGQ6OnUzMnN0cmluZwBpbmYAJS4wTGYAJUxmACVmAHJlc2l6ZQBpbnZhbGlkIHdpbmRvdyBzaXplAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemUAdHJ1ZQBUdWUAZmFsc2UAaW52YWxpZCBibG9jayB0eXBlAEp1bmUAZG91YmxlAGludmFsaWQgbGl0ZXJhbC9sZW5ndGggY29kZQBpbnZhbGlkIGRpc3RhbmNlIGNvZGUAbWFza0RlY2F5VF9zdGQAbWFza0RlY2F5Rl9zdGQAdW5rbm93biBjb21wcmVzc2lvbiBtZXRob2QAbWFwOjphdDogIGtleSBub3QgZm91bmQAc3RyZWFtIGVuZAB2b2lkAFdlZABEZWMARmViACVhICViICVkICVIOiVNOiVTICVZAFBPU0lYAGludGVydmFsVAAlSDolTTolUwBGUFZFUgBFeHRyYWN0UXVlcnlGUABBUlJMRU4ATkFOAFBNAEFNAExDX0FMTABMQU5HAGludGVydmFsRgBJTkYAQwBmcmVxVUIAZnJlcUxCAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AdmVjdG9yPGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+ADAxMjM0NTY3ODkAMDc0Qjk3MjIxRjI3RjAyOQBDLlVURi04ADEuMi4xMQBoeWFpXzEuMi4wX2NsaWVudF8xLjAuMAAuAChudWxsKQBHZXRGRlRMZW4oKSA+PSBHZXRGcm1MZW4oKQBfcGtFeHRFbmctPkluaXRTdWMoKQBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQAlZgoABA4AAIwOAABOU3QzX18yNnZlY3RvckljTlNfOWFsbG9jYXRvckljRUVFRQBOU3QzX18yMTNfX3ZlY3Rvcl9iYXNlSWNOU185YWxsb2NhdG9ySWNFRUVFAE5TdDNfXzIyMF9fdmVjdG9yX2Jhc2VfY29tbW9uSUxiMUVFRQAAAACMhwAAvA0AABCIAACQDQAAAAAAAAEAAADkDQAAAAAAABCIAABsDQAAAAAAAAEAAADsDQAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAE5TdDNfXzIyMV9fYmFzaWNfc3RyaW5nX2NvbW1vbklMYjFFRUUAAAAAjIcAAFsOAAAQiAAAHA4AAAAAAAABAAAAhA4AAAAAAABpaWkAUE5TdDNfXzI2dmVjdG9ySWNOU185YWxsb2NhdG9ySWNFRUVFAAAAAGyIAACoDgAAAAAAAAQOAABQS05TdDNfXzI2dmVjdG9ySWNOU185YWxsb2NhdG9ySWNFRUVFAAAAbIgAAOAOAAABAAAABA4AAGlpAHYAdmkA0A4AAMiGAADQDgAA7IYAAHZpaWkAQcAeC9sEyIYAANAOAABMhwAA7IYAAHZpaWlpAAAATIcAAAgPAACADwAABA4AAEyHAABOMTBlbXNjcmlwdGVuM3ZhbEUAAIyHAABsDwAAaWlpaQAAAADghgAABA4AAEyHAADshgAAaWlpaWkAAAAAAAAA3A8AABQAAAAVAAAAFgAAADExRkZUX0tJU1NGRlQAOEZGVF9CYXNlAIyHAADKDwAAtIcAALwPAADUDwAAAAAAAEAQAAAYAAAAGQAAABoAAAAbAAAAHAAAADI1UGVha0V4dHJhY3RvckNvcmVCYXNlbGluZQAyMFBlYWtFeHRyYWN0b3JD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ByMAAAhyAAAIMgAACcQAEQcLAAAIYgAACCIAAAmkAAAIAgAACIIAAAhCAAAJ5AAQBwcAAAhaAAAIGgAACZQAFAdDAAAIegAACDoAAAnUABIHEwAACGoAAAgqAAAJtAAACAoAAAiKAAAISgAACfQAEAcFAAAIVgAACBYAQAgAABMHMwAACHYAAAg2AAAJzAARBw8AAAhmAAAIJgAACawAAAgGAAAIhgAACEYAAAnsABAHCQAACF4AAAgeAAAJnAAUB2MAAAh+AAAIPgAACdwAEgcbAAAIbgAACC4AAAm8AAAIDgAACI4AAAhOAAAJ/ABgBwAAAAhRAAAIEQAVCIMAEgcfAAAIcQAACDEAAAnCABAHCgAACGEAAAghAAAJogAACAEAAAiBAAAIQQAACeIAEAcGAAAIWQAACBkAAAmSABMHOwAACHkAAAg5AAAJ0gARBxEAAAhpAAAIKQAACbIAAAgJAAAIiQAACEkAAAnyABAHBAAACFUAAAgVABAIAgETBysAAAh1AAAINQAACcoAEQcNAAAIZQAACCUAAAmqAAAIBQAACIUAAAhFAAAJ6gAQBwgAAAhdAAAIHQAACZoAFAdTAAAIfQAACD0AAAnaABIHFwAACG0AAAgtAAAJugAACA0AAAiNAAAITQAACfoAEAcDAAAIUwAACBMAFQjDABMHIwAACHMAAAgzAAAJxgARBwsAAAhjAAAIIwAACaYAAAgDAAAIgwAACEMAAAnmABAHBwAACFsAAAgbAAAJlgAUB0MAAAh7AAAIOwAACdYAEgcTAAAIawAACCsAAAm2AAAICwAACIsAAAhLAAAJ9gAQBwUAAAhXAAAIFwBACAAAEwczAAAIdwAACDcAAAnOABEHDwAACGcAAAgnAAAJrgAACAcAAAiHAAAIRwAACe4AEAcJAAAIXwAACB8AAAmeABQHYwAACH8AAAg/AAAJ3gASBxsAAAhvAAAILwAACb4AAAgPAAAIjwAACE8AAAn+AGAHAAAACFAAAAgQABQIcwASBx8AAAhwAAAIMAAACcEAEAcKAAAIYAAACCAAAAmhAAAIAAAACIAAAAhAAAAJ4QAQBwYAAAhYAAAIGAAACZEAEwc7AAAIeAAACDgAAAnRABEHEQAACGgAAAgoAAAJsQAACAgAAAiIAAAISAAACfEAEAcEAAAIVAAACBQAFQjjABMHKwAACHQAAAg0AAAJyQARBw0AAAhkAAAIJAAACakAAAgEAAAIhAAACEQAAAnpABAHCAAACFwAAAgcAAAJmQAUB1MAAAh8AAAIPAAACdkAEgcXAAAIbAAACCwAAAm5AAAIDAAACIwAAAhMAAAJ+QAQBwMAAAhSAAAIEgAVCKMAEwcjAAAIcgAACDIAAAnFABEHCwAACGIAAAgiAAAJpQAACAIAAAiCAAAIQgAACeUAEAcHAAAIWgAACBoAAAmVABQHQwAACHoAAAg6AAAJ1QASBxMAAAhqAAAIKgAACbUAAAgKAAAIigAACEoAAAn1ABAHBQAACFYAAAgWAEAIAAATBzMAAAh2AAAINgAACc0AEQcPAAAIZgAACCYAAAmtAAAIBgAACIYAAAhGAAAJ7QAQBwkAAAheAAAIHgAACZ0AFAdjAAAIfgAACD4AAAndABIHGwAACG4AAAguAAAJvQAACA4AAAiOAAAITgAACf0AYAcAAAAIUQAACBEAFQiDABIHHwAACHEAAAgxAAAJwwAQBwoAAAhhAAAIIQAACaMAAAgBAAAIgQAACEEAAAnjABAHBgAACFkAAAgZAAAJkwATBzsAAAh5AAAIOQAACdMAEQcRAAAIaQAACCkAAAmzAAAICQAACIkAAAhJAAAJ8wAQBwQAAAhVAAAIFQAQCAIBEwcrAAAIdQAACDUAAAnLABEHDQAACGUAAAglAAAJqwAACAUAAAiFAAAIRQAACesAEAcIAAAIXQAACB0AAAmbABQHUwAACH0AAAg9AAAJ2wASBxcAAAhtAAAILQAACbsAAAgNAAAIjQAACE0AAAn7ABAHAwAACFMAAAgTABUIwwATByMAAAhzAAAIMwAACccAEQcLAAAIYwAACCMAAAmnAAAIAwAACIMAAAhDAAAJ5wAQBwcAAAhbAAAIGwAACZcAFAdDAAAIewAACDsAAAnXABIHEwAACGsAAAgrAAAJtwAACAsAAAiLAAAISwAACfcAEAcFAAAIVwAACBcAQAgAABMHMwAACHcAAAg3AAAJzwARBw8AAAhnAAAIJwAACa8AAAgHAAAIhwAACEcAAAnvABAHCQAACF8AAAgfAAAJnwAUB2MAAAh/AAAIPwAACd8AEgcbAAAIbwAACC8AAAm/AAAIDwAACI8AAAhPAAAJ/wAQBQEAFwUBARMFEQAbBQEQEQUFABkFAQQVBUEAHQUBQBAFAwAYBQECFAUhABwFASASBQkAGgUBCBYFgQBABQAAEAUCABcFgQETBRkAGwUBGBEFBwAZBQEGFQVhAB0FAWAQBQQAGAUBAxQFMQAcBQEwEgUNABoFAQwWBcEAQAUAAAMABAAFAAYABwAIAAkACgALAA0ADwARABMAFwAbAB8AIwArADMAOwBDAFMAYwBzAIMAowDDAOMAAgEAAAAAAAAQABAAEAAQABAAEAAQABAAEQARABEAEQASABIAEgASABMAEwATABMAFAAUABQAFAAVABUAFQAVABAATQDKAAAAAQACAAMABAAFAAcACQANABEAGQAhADEAQQBhAIEAwQABAYEBAQIBAwEEAQYBCAEMARABGAEgATABQAFgAAAAABAAEAAQABAAEQARABIAEgATABMAFAAUABUAFQAWABYAFwAXABgAGAAZABkAGgAaABsAGwAcABwAHQAdAEAAQAAAAQIDBAQFBQYGBgYHBwcHCAgICAgICAgJCQkJCQkJCQoKCgoKCgoKCgoKCgoKCgoLCwsLCwsLCwsLCwsLCwsLDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PAAAQERISExMUFBQUFRUVFRYWFhYWFhYWFxcXFxcXFxcYGBgYGBgYGBgYGBgYGBgYGRkZGRkZGRkZGRkZGRkZGRoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxscHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHQABAgMEBQYHCAgJCQoKCwsMDAwMDQ0NDQ4ODg4PDw8PEBAQEBAQEBARERERERERERISEhISEhISExMTExMTExMUFBQUFBQUFBQUFBQUFBQUFRUVFRUVFRUVFRUVFRUVFRYWFhYWFhYWFhYWFhYWFhYXFxcXFxcXFxcXFxcXFxcXGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxwQPwAAEEQAAAEBAAAeAQAADwAAAJBDAACQRAAAAAAAAB4AAAAPAAAAAAAAABBFAAAAAAAAEwAAAAcAAAAAAAAADAAIAIwACABMAAgAzAAIACwACACsAAgAbAAIAOwACAAcAAgAnAAIAFwACADcAAgAPAAIALwACAB8AAgA/AAIAAIACACCAAgAQgAIAMIACAAiAAgAogAIAGIACADiAAgAEgAIAJIACABSAAgA0gAIADIACACyAAgAcgAIAPIACAAKAAgAigAIAEoACADKAAgAKgAIAKoACABqAAgA6gAIABoACACaAAgAWgAIANoACAA6AAgAugAIAHoACAD6AAgABgAIAIYACABGAAgAxgAIACYACACmAAgAZgAIAOYACAAWAAgAlgAIAFYACADWAAgANgAIALYACAB2AAgA9gAIAA4ACACOAAgATgAIAM4ACAAuAAgArgAIAG4ACADuAAgAHgAIAJ4ACABeAAgA3gAIAD4ACAC+AAgAfgAIAP4ACAABAAgAgQAIAEEACADBAAgAIQAIAKEACABhAAgA4QAIABEACACRAAgAUQAIANEACAAxAAgAsQAIAHEACADxAAgACQAIAIkACABJAAgAyQAIACkACACpAAgAaQAIAOkACAAZAAgAmQAIAFkACADZAAgAOQAIALkACAB5AAgA+QAIAAUACACFAAgARQAIAMUACAAlAAgApQAIAGUACADlAAgAFQAIAJUACABVAAgA1QAIADUACAC1AAgAdQAIAPUACAANAAgAjQAIAE0ACADNAAgALQAIAK0ACABtAAgA7QAIAB0ACACdAAgAXQAIAN0ACAA9AAgAvQAIAH0ACAD9AAgAEwAJABMBCQCTAAkAkwEJAFMACQBTAQkA0wAJANMBCQAzAAkAMwEJALMACQCzAQkAcwAJAHMBCQDzAAkA8wEJAAsACQALAQkAiwAJAIsBCQBLAAkASwEJAMsACQDLAQkAKwAJACsBCQCrAAkAqwEJAGsACQBrAQkA6wAJAOsBCQAbAAkAGwEJAJsACQCbAQkAWwAJAFsBCQDbAAkA2wEJADsACQA7AQkAuwAJALsBCQB7AAkAewEJAPsACQD7AQkABwAJAAcBCQCHAAkAhwEJAEcACQBHAQkAxwAJAMcBCQAnAAkAJwEJAKcACQCnAQkAZwAJAGcBCQDnAAkA5wEJABcACQAXAQkAlwAJAJcBCQBXAAkAVwEJANcACQDXAQkANwAJADcBCQC3AAkAtwEJAHcACQB3AQkA9wAJAPcBCQAPAAkADwEJAI8ACQCPAQkATwAJAE8BCQDPAAkAzwEJAC8ACQAvAQkArwAJAK8BCQBvAAkAbwEJAO8ACQDvAQkAHwAJAB8BCQCfAAkAnwEJAF8ACQBfAQkA3wAJAN8BCQA/AAkAPwEJAL8ACQC/AQkAfwAJAH8BCQD/AAkA/wEJAAAABwBAAAcAIAAHAGAABwAQAAcAUAAHADAABwBwAAcACAAHAEgABwAoAAcAaAAHABgABwBYAAcAOAAHAHgABwAEAAcARAAHACQABwBkAAcAFAAHAFQABwA0AAcAdAAHAAMACACDAAgAQwAIAMMACAAjAAgAowAIAGMACADjAAgAAAAFABAABQAIAAUAGAAFAAQABQAUAAUADAAFABwABQACAAUAEgAFAAoABQAaAAUABgAFABYABQAOAAUAHgAFAAEABQARAAUACQAFABkABQAFAAUAFQAFAA0ABQAdAAUAAwAFABMABQALAAUAGwAFAAcABQAXAAUAQbCIAQtNAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAIAAAADAAAAAwAAAAMAAAADAAAABAAAAAQAAAAEAAAABAAAAAUAAAAFAAAABQAAAAUAQaCJAQtlAQAAAAEAAAACAAAAAgAAAAMAAAADAAAABAAAAAQAAAAFAAAABQAAAAYAAAAGAAAABwAAAAcAAAAIAAAACAAAAAkAAAAJAAAACgAAAAoAAAALAAAACwAAAAwAAAAMAAAADQAAAA0AQdCKAQsjAgAAAAMAAAAHAAAAAAAAABAREgAIBwkGCgULBAwDDQIOAQ8AQYSLAQtpAQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAKAAAADAAAAA4AAAAQAAAAFAAAABgAAAAcAAAAIAAAACgAAAAwAAAAOAAAAEAAAABQAAAAYAAAAHAAAACAAAAAoAAAAMAAAADgAEGEjAELcgEAAAACAAAAAwAAAAQAAAAGAAAACAAAAAwAAAAQAAAAGAAAACAAAAAwAAAAQAAAAGAAAACAAAAAwAAAAAABAACAAQAAAAIAAAADAAAABAAAAAYAAAAIAAAADAAAABAAAAAYAAAAIAAAADAAAABAAAAAYABBgI0BC5EHLgQAAL8JAABjDQAAFQYAAAgGAAAgBgAACQQAAPsFAAAsBwAAYw0AAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0loTlNfMTFjaGFyX3RyYWl0c0loRUVOU185YWxsb2NhdG9ySWhFRUVFAAAQiAAAqEYAAAAAAAABAAAAhA4AAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJd05TXzExY2hhcl90cmFpdHNJd0VFTlNfOWFsbG9jYXRvckl3RUVFRQAAEIgAAABHAAAAAAAAAQAAAIQOAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURzTlNfMTFjaGFyX3RyYWl0c0lEc0VFTlNfOWFsbG9jYXRvcklEc0VFRUUAAAAQiAAAWEcAAAAAAAABAAAAhA4AAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJRGlOU18xMWNoYXJfdHJhaXRzSURpRUVOU185YWxsb2NhdG9ySURpRUVFRQAAABCIAAC0RwAAAAAAAAEAAACEDgAAAAAAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAAjIcAABBIAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAAIyHAAA4SAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAACMhwAAYEgAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAAjIcAAIhIAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAAIyHAACwSAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAACMhwAA2EgAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92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qFYAtKi1AM/MDgASiS0Ab1c0ACxWiQCZzuMA1iC5AGteqgA+KpwAEV/MAP0LSgDh9PsAjjttAOKGLADp1IQA/LSpAO/u0QAuNckALzlhADghRAAb2cgAgfwKAPtKagAvHNgAU7SEAE6ZjABUIswAKlXcAMDG1gALGZYAGnC4AGmVZAAmWmAAP1LuAH8RDwD0tREA/Mv1ADS8LQA0vO4A6F3MAN1eYABnjpsAkjPvAMkXuABhWJsA4Ve8AFGDxgDYPhAA3XFIAC0c3QCvGKEAISxGAFnz1wDZepgAnlTAAE+G+gBWBvwA5XmuAIkiNgA4rSIAZ5PcAFXoqgCCJjgAyuebAFENpACZM7EAqdcOAGkFSABlsvAAf4inAIhMlwD50TYAIZKzAHuCSgCYzyEAQJ/cANxHVQDhdDoAZ+tCAP6d3wBe1F8Ae2ekALqsegBV9qIAK4gjAEG6VQBZbggAISqGADlHgwCJ4+YA5Z7UAEn7QAD/VukAHA/KAMVZigCU+isA08HFAA/FzwDbWq4AR8WGAIVDYgAhhjsALHmUABBhhwAqTHsAgCwaAEO/EgCIJpAAeDyJAKjE5ADl23sAxDrCACb06gD3Z4oADZK/AGWjKwA9k7EAvXwLAKRR3AAn3WMAaeHdAJqUGQCoKZUAaM4oAAnttABEnyAATpjKAHCCYwB+fCMAD7kyAKf1jgAUVucAIfEIALWdKgBvfk0ApRlRALX5qwCC39YAlt1hABY2AgDEOp8Ag6KhAHLtbQA5jXoAgripAGsyXABGJ1sAADTtANIAdwD89FUAAVlNAOBxgABBo60BC68BQPsh+T8AAAAALUR0PgAAAICYRvg8AAAAYFHMeDsAAACAgxvwOQAAAEAgJXo4AAAAgCKC4zYAAAAAHfNpNdF0ngBXnb0qgHBSD///PicKAAAAZAAAAOgDAAAQJwAAoIYBAEBCDwCAlpgAAOH1BRgAAAA1AAAAcQAAAGv////O+///kr///wAAAABMVwAAMAAAADEAAABOU3QzX18yOGlvc19iYXNlRQAAAIyHAAA4VwBB/K4BCwEyAEGjrwELBf//////AEHwrwELgwT/////////////////////////////////////////////////////////////////AAECAwQFBgcICf////////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wABAgQHAwYFAAAAAAAAAAIAAMADAADABAAAwAUAAMAGAADABwAAwAgAAMAJAADACgAAwAsAAMAMAADADQAAwA4AAMAPAADAEAAAwBEAAMASAADAEwAAwBQAAMAVAADAFgAAwBcAAMAYAADAGQAAwBoAAMAbAADAHAAAwB0AAMAeAADAHwAAwAAAALMBAADDAgAAwwMAAMMEAADDBQAAwwYAAMMHAADDCAAAwwkAAMMKAADDCwAAwwwAAMMNAADTDgAAww8AAMMAAAy7AQAMwwIADMMDAAzDBAAM0wAAAADeEgSVAAAAAP///////////////9BZAAAUAAAAQy5VVEYtOABBmLQBCwLkWQBBsLQBC0pMQ19DVFlQRQAAAABMQ19OVU1FUklDAABMQ19USU1FAAAAAABMQ19DT0xMQVRFAABMQ19NT05FVEFSWQBMQ19NRVNTQUdFUwCAWwBBgLcBC/8BAgACAAIAAgACAAIAAgACAAIAAyACIAIgAiACIAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAFgBMAEwATABMAEwATABMAEwATABMAEwATABMAEwATACNgI2AjYCNgI2AjYCNgI2AjYCNgEwATABMAEwATABMAEwAjVCNUI1QjVCNUI1QjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUEwATABMAEwATABMAI1gjWCNYI1gjWCNYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGBMAEwATABMACAEGAuwELApBfAEGUvwEL+QMBAAAAAgAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAABIAAAATAAAAFAAAABUAAAAWAAAAFwAAABgA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"


'use strict'
const WASM_BINARY_PLACEHOLDER = 'WASM_BINARY_PLACEHOLDER';
// See https://github.com/Distributive-Network/PythonMonkey/issues/266
if (typeof globalThis.setInterval != 'function'){
    globalThis.setInterval = function pm$$setInterval(fn, timeout) {
    const timerHnd = { cancel: false };
        function fnWrapper()
        {
            if (timerHnd.cancel)
            return;
            setTimeout(fnWrapper, timeout);
            fn();
        }
        timerHnd.id = setTimeout(fnWrapper, timeout);
        return timerHnd;
    }
    globalThis.clearInterval = function pm$$clearInterval(timerHnd) {
    timerHnd.clear = true;
    clearTimeout(timerHnd.id);
    }
}
nicoB64.decode = function b64decode(data) {
    return Uint8Array.from(atob(data), c => c.charCodeAt(0));
}
nicoB64.encode = function b64encode(data) {
    return btoa(String.fromCharCode(...data));
}
// https://fn.music.163.com/g/chrome-extension-home-page-beta/
let AudioFingerprintRuntime = (() => {
    var n, o = void 0 !== o ? o : {},i = {};
    for (n in o)
        o.hasOwnProperty(n) && (i[n] = o[n]);
    var read_, readSync, readBinary, c, f, l = [],
    p = "./this.program",    
    readSync = function(t, e, r) {
        switch (t) {
            case WASM_BINARY_PLACEHOLDER:                
                if (typeof WASM_BINARY == 'undefined') {
                    const { WASM_BINARY } = require('./afp.wasm.js');
                    e(nicoB64.decode(WASM_BINARY));
                } else {
                    e(nicoB64.decode(WASM_BINARY));
                }
            default:
                throw "Reading " + t + " is not supported";
                break;
        }
    }
    var v = o.print || console.log.bind(console),
        g = o.printErr || console.warn.bind(console);
    for (n in i)
        i.hasOwnProperty(n) && (o[n] = i[n]);
    i = null,
        o.arguments && (l = o.arguments),
        o.thisProgram && (p = o.thisProgram),
        o.quit && o.quit;
    var w;
    o.wasmBinary && (w = o.wasmBinary);
    var b, _ = o.noExitRuntime || !0;
    "object" != typeof WebAssembly && abort("no native wasm support detected");
    var C = !1;

    function T(t, e) {
        t || abort("Assertion failed: " + e)
    }
    var UTF8Decoder = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0;

    function UTF8ArrayToString(heap, idx, maxBytesToRead) {
        var endIdx = idx + maxBytesToRead;
        var endPtr = idx;
        while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
        if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
            return UTF8Decoder.decode(heap.subarray(idx, endPtr))
        } else {
            var str = "";
            while (idx < endPtr) {
                var u0 = heap[idx++];
                if (!(u0 & 128)) {
                    str += String.fromCharCode(u0);
                    continue
                }
                var u1 = heap[idx++] & 63;
                if ((u0 & 224) == 192) {
                    str += String.fromCharCode((u0 & 31) << 6 | u1);
                    continue
                }
                var u2 = heap[idx++] & 63;
                if ((u0 & 240) == 224) {
                    u0 = (u0 & 15) << 12 | u1 << 6 | u2
                } else {
                    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63
                }
                if (u0 < 65536) {
                    str += String.fromCharCode(u0)
                } else {
                    var ch = u0 - 65536;
                    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                }
            }
        }
        return str
    }

    function UTF8ToString(ptr, maxBytesToRead) {
        return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
    }
    function UTF8ToString(t, e) {
        return t ? UTF8ArrayToString(O, t, e) : ""
    }


    function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
        if (!(maxBytesToWrite > 0)) return 0;
        var startIdx = outIdx;
        var endIdx = outIdx + maxBytesToWrite - 1;
        for (var i = 0; i < str.length; ++i) {
            var u = str.charCodeAt(i);
            if (u >= 55296 && u <= 57343) {
                var u1 = str.charCodeAt(++i);
                u = 65536 + ((u & 1023) << 10) | u1 & 1023
            }
            if (u <= 127) {
                if (outIdx >= endIdx) break;
                heap[outIdx++] = u
            } else if (u <= 2047) {
                if (outIdx + 1 >= endIdx) break;
                heap[outIdx++] = 192 | u >> 6;
                heap[outIdx++] = 128 | u & 63
            } else if (u <= 65535) {
                if (outIdx + 2 >= endIdx) break;
                heap[outIdx++] = 224 | u >> 12;
                heap[outIdx++] = 128 | u >> 6 & 63;
                heap[outIdx++] = 128 | u & 63
            } else {
                if (outIdx + 3 >= endIdx) break;
                heap[outIdx++] = 240 | u >> 18;
                heap[outIdx++] = 128 | u >> 12 & 63;
                heap[outIdx++] = 128 | u >> 6 & 63;
                heap[outIdx++] = 128 | u & 63
            }
        }
        heap[outIdx] = 0;
        return outIdx - startIdx
    }


    function UTF8CharCount(t) {
        for (var e = 0, r = 0; r < t.length; ++r) {
            var n = t.charCodeAt(r);
            n >= 55296 && n <= 57343 && (n = 65536 + ((1023 & n) << 10) | 1023 & t.charCodeAt(++r)),
                n <= 127 ? ++e : e += n <= 2047 ? 2 : n <= 65535 ? 3 : 4
        }
        return e
    }
    var E, S, O, k, W, j, R, M, I, UTF16Decoder = "undefined" != typeof TextDecoder ? new TextDecoder("utf-16le") : void 0;

    function UTF16ArrayToString(t, e) {
        for (var r = t, n = r >> 1, o = n + e / 2; !(n >= o) && W[n];)
            ++n;
        if ((r = n << 1) - t > 32 && UTF16Decoder)
            return UTF16Decoder.decode(O.subarray(t, r));
        for (var i = "", a = 0; !(a >= e / 2); ++a) {
            var u = k[t + 2 * a >> 1];
            if (0 == u)
                break;
            i += String.fromCharCode(u)
        }
        return i
    }

    function H(t, e, r) {
        if (void 0 === r && (r = 2147483647),
            r < 2)
            return 0;
        for (var n = e, o = (r -= 2) < 2 * t.length ? r / 2 : t.length, i = 0; i < o; ++i) {
            var a = t.charCodeAt(i);
            k[e >> 1] = a,
                e += 2
        }
        return k[e >> 1] = 0,
            e - n
    }

    function Y(t) {
        return 2 * t.length
    }

    function V(t, e) {
        for (var r = 0, n = ""; !(r >= e / 4);) {
            var o = j[t + 4 * r >> 2];
            if (0 == o)
                break;
            if (++r,
                o >= 65536) {
                var i = o - 65536;
                n += String.fromCharCode(55296 | i >> 10, 56320 | 1023 & i)
            } else
                n += String.fromCharCode(o)
        }
        return n
    }

    function z(t, e, r) {
        if (void 0 === r && (r = 2147483647),
            r < 4)
            return 0;
        for (var n = e, o = n + r - 4, i = 0; i < t.length; ++i) {
            var a = t.charCodeAt(i);
            if (a >= 55296 && a <= 57343)
                a = 65536 + ((1023 & a) << 10) | 1023 & t.charCodeAt(++i);
            if (j[e >> 2] = a,
                (e += 4) + 4 > o)
                break
        }
        return j[e >> 2] = 0,
            e - n
    }

    function B(t) {
        for (var e = 0, r = 0; r < t.length; ++r) {
            var n = t.charCodeAt(r);
            n >= 55296 && n <= 57343 && ++r,
                e += 4
        }
        return e
    }
    o.INITIAL_MEMORY;
    var L, G = [],
        N = [],
        q = [];
    var J = 0,
        X = null,
        Z = null;

    function abort(what) {
        throw o.onAbort && o.onAbort(what),
            g(what = "Aborted(" + what + ")"),
            C = !0,
            1,
            what += ". Build with -s ASSERTIONS=1 for more info.",
            new WebAssembly.RuntimeError(what)
    }
    o.preloadedImages = {},
        o.preloadedAudios = {};
    var Q;

    function isDataURI(t) {
        return t.startsWith("data:application/octet-stream;base64,")
    }

    function isFileURI(t) {
        return t.startsWith("file://")
    }

    function getBinary(file) {
        try {
            if (file == Q && w)
                return new Uint8Array(w);
            if (readBinary)
                return readBinary(file);
            throw "both async and sync fetching of the wasm failed"
        } catch (t) {
            abort(t)
        }
    }

    function callRuntimeCallbacks(cb) {
        for (; cb.length > 0;) {
            var func = cb.shift();
            if ("function" != typeof func) {
                var r = func.func;
                "number" == typeof r ? void 0 === func.arg ? it(r)() : it(r)(func.arg) : r(void 0 === func.arg ? null : func.arg)
            } else
                func(o)
        }
    }
    var wasmBinaryFile = WASM_BINARY_PLACEHOLDER;
    isDataURI(wasmBinaryFile) || (Q = function(t) {
        return wasmBinaryFile
    }(Q));
    var ot = [];

    function it(t) {
        var e = ot[t];
        return e || (t >= ot.length && (ot.length = t + 1),
            ot[t] = e = L.get(t)),
            e
    }

    function ExceptionInfo(excPtr) {
        this.excPtr = excPtr,
            this.ptr = excPtr - 16,
            this.set_type = function(t) {
                j[this.ptr + 4 >> 2] = t
            },
            this.get_type = function() {
                return j[this.ptr + 4 >> 2]
            },
            this.set_destructor = function(t) {
                j[this.ptr + 8 >> 2] = t
            },
            this.get_destructor = function() {
                return j[this.ptr + 8 >> 2]
            },
            this.set_refcount = function(t) {
                j[this.ptr >> 2] = t
            },
            this.set_caught = function(t) {
                t = t ? 1 : 0,
                    S[this.ptr + 12 >> 0] = t
            },
            this.get_caught = function() {
                return 0 != S[this.ptr + 12 >> 0]
            },
            this.set_rethrown = function(t) {
                t = t ? 1 : 0,
                    S[this.ptr + 13 >> 0] = t
            },
            this.get_rethrown = function() {
                return 0 != S[this.ptr + 13 >> 0]
            },
            this.init = function(t, e) {
                this.set_type(t),
                    this.set_destructor(e),
                    this.set_refcount(0),
                    this.set_caught(!1),
                    this.set_rethrown(!1)
            },
            this.add_ref = function() {
                var t = j[this.ptr >> 2];
                j[this.ptr >> 2] = t + 1
            },
            this.release_ref = function() {
                var t = j[this.ptr >> 2];
                return j[this.ptr >> 2] = t - 1,
                    1 === t
            }
    }

    function ut(t) {
        switch (t) {
            case 1:
                return 0;
            case 2:
                return 1;
            case 4:
                return 2;
            case 8:
                return 3;
            default:
                throw new TypeError("Unknown type size: " + t)
        }
    }
    var st = void 0;

    function ct(t) {
        for (var e = "", r = t; O[r];)
            e += st[O[r++]];
        return e
    }
    var ft = {},
        lt = {},
        pt = {};

    function dt(t) {
        if (void 0 === t)
            return "_unknown";
        var e = (t = t.replace(/[^a-zA-Z0-9_]/g, "$")).charCodeAt(0);
        return e >= 48 && e <= 57 ? "_" + t : t
    }

    function ht(t, e) {
        return t = dt(t),
            new Function("body", "return function " + t + '() {\n    "use strict";    return body.apply(this, arguments);\n};\n')(e)
    }

    function yt(t, e) {
        var r = ht(e, (function(t) {
            this.name = e,
                this.message = t;
            var r = new Error(t).stack;
            void 0 !== r && (this.stack = this.toString() + "\n" + r.replace(/^Error(:[^\n]*)?\n/, ""))
        }));
        return r.prototype = Object.create(t.prototype),
            r.prototype.constructor = r,
            r.prototype.toString = function() {
                return void 0 === this.message ? this.name : this.name + ": " + this.message
            },
            r
    }
    var mt = void 0;

    function vt(t) {
        throw new mt(t)
    }
    var gt = void 0;

    function wt(t) {
        throw new gt(t)
    }

    function bt(t, e, r) {
        function n(e) {
            var n = r(e);
            n.length !== t.length && wt("Mismatched type converter count");
            for (var o = 0; o < t.length; ++o)
                _t(t[o], n[o])
        }
        t.forEach((function(t) {
            pt[t] = e
        }));
        var o = new Array(e.length),
            i = [],
            a = 0;
        e.forEach((function(t, e) {
                lt.hasOwnProperty(t) ? o[e] = lt[t] : (i.push(t),
                    ft.hasOwnProperty(t) || (ft[t] = []),
                    ft[t].push((function() {
                        o[e] = lt[t],
                            ++a === i.length && n(o)
                    })))
            })),
            0 === i.length && n(o)
    }

    function _t(t, e, r) {
        if (r = r || {},
            !("argPackAdvance" in e))
            throw new TypeError("registerType registeredInstance requires argPackAdvance");
        var n = e.name;
        if (t || vt('type "' + n + '" must have a positive integer typeid pointer'),
            lt.hasOwnProperty(t)) {
            if (r.ignoreDuplicateRegistrations)
                return;
            vt("Cannot register type '" + n + "' twice")
        }
        if (lt[t] = e,
            delete pt[t],
            ft.hasOwnProperty(t)) {
            var o = ft[t];
            delete ft[t],
                o.forEach((function(t) {
                    t()
                }))
        }
    }

    function Ct(t) {
        if (!(this instanceof Rt))
            return !1;
        if (!(t instanceof Rt))
            return !1;
        for (var e = this.$$.ptrType.registeredClass, r = this.$$.ptr, n = t.$$.ptrType.registeredClass, o = t.$$.ptr; e.baseClass;)
            r = e.upcast(r),
            e = e.baseClass;
        for (; n.baseClass;)
            o = n.upcast(o),
            n = n.baseClass;
        return e === n && r === o
    }

    function Tt(t) {
        vt(t.$$.ptrType.registeredClass.name + " instance already deleted")
    }
    var $t = !1;

    function Pt(t) {}

    function At(t) {
        t.count.value -= 1,
            0 === t.count.value && function(t) {
                t.smartPtr ? t.smartPtrType.rawDestructor(t.smartPtr) : t.ptrType.registeredClass.rawDestructor(t.ptr)
            }(t)
    }

    function Dt(t) {
        return "undefined" == typeof FinalizationRegistry ? (Dt = function(t) {
                return t
            },
            t) : ($t = new FinalizationRegistry((function(t) {
                At(t.$$)
            })),
            Dt = function(t) {
                var e = {
                    $$: t.$$
                };
                return $t.register(t, e, t),
                    t
            },
            Pt = function(t) {
                $t.unregister(t)
            },
            Dt(t))
    }

    function Ft() {
        if (this.$$.ptr || Tt(this),
            this.$$.preservePointerOnDelete)
            return this.$$.count.value += 1,
                this;
        var t, e = Dt(Object.create(Object.getPrototypeOf(this), {
            $$: {
                value: (t = this.$$, {
                    count: t.count,
                    deleteScheduled: t.deleteScheduled,
                    preservePointerOnDelete: t.preservePointerOnDelete,
                    ptr: t.ptr,
                    ptrType: t.ptrType,
                    smartPtr: t.smartPtr,
                    smartPtrType: t.smartPtrType
                })
            }
        }));
        return e.$$.count.value += 1,
            e.$$.deleteScheduled = !1,
            e
    }

    function Et() {
        this.$$.ptr || Tt(this),
            this.$$.deleteScheduled && !this.$$.preservePointerOnDelete && vt("Object already scheduled for deletion"),
            Pt(this),
            At(this.$$),
            this.$$.preservePointerOnDelete || (this.$$.smartPtr = void 0,
                this.$$.ptr = void 0)
    }

    function St() {
        return !this.$$.ptr
    }
    var Ot = void 0,
        kt = [];

    function Wt() {
        for (; kt.length;) {
            var t = kt.pop();
            t.$$.deleteScheduled = !1,
                t.delete()
        }
    }

    function jt() {
        return this.$$.ptr || Tt(this),
            this.$$.deleteScheduled && !this.$$.preservePointerOnDelete && vt("Object already scheduled for deletion"),
            kt.push(this),
            1 === kt.length && Ot && Ot(Wt),
            this.$$.deleteScheduled = !0,
            this
    }

    function Rt() {}
    var Mt = {};

    function It(t, e, r) {
        if (void 0 === t[e].overloadTable) {
            var n = t[e];
            t[e] = function() {
                    return t[e].overloadTable.hasOwnProperty(arguments.length) || vt("Function '" + r + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + t[e].overloadTable + ")!"),
                        t[e].overloadTable[arguments.length].apply(this, arguments)
                },
                t[e].overloadTable = [],
                t[e].overloadTable[n.argCount] = n
        }
    }

    function xt(t, e, r) {
        o.hasOwnProperty(t) ? ((void 0 === r || void 0 !== o[t].overloadTable && void 0 !== o[t].overloadTable[r]) && vt("Cannot register public name '" + t + "' twice"),
            It(o, t, t),
            o.hasOwnProperty(r) && vt("Cannot register multiple overloads of a function with the same number of arguments (" + r + ")!"),
            o[t].overloadTable[r] = e) : (o[t] = e,
            void 0 !== r && (o[t].numArguments = r))
    }

    function Ut(t, e, r, n, o, i, a, u) {
        this.name = t,
            this.constructor = e,
            this.instancePrototype = r,
            this.rawDestructor = n,
            this.baseClass = o,
            this.getActualType = i,
            this.upcast = a,
            this.downcast = u,
            this.pureVirtualFunctions = []
    }

    function Ht(t, e, r) {
        for (; e !== r;)
            e.upcast || vt("Expected null or instance of " + r.name + ", got an instance of " + e.name),
            t = e.upcast(t),
            e = e.baseClass;
        return t
    }

    function Yt(t, e) {
        if (null === e)
            return this.isReference && vt("null is not a valid " + this.name),
                0;
        e.$$ || vt('Cannot pass "' + ge(e) + '" as a ' + this.name),
            e.$$.ptr || vt("Cannot pass deleted object as a pointer of type " + this.name);
        var r = e.$$.ptrType.registeredClass;
        return Ht(e.$$.ptr, r, this.registeredClass)
    }

    function Vt(t, e) {
        var r;
        if (null === e)
            return this.isReference && vt("null is not a valid " + this.name),
                this.isSmartPointer ? (r = this.rawConstructor(),
                    null !== t && t.push(this.rawDestructor, r),
                    r) : 0;
        e.$$ || vt('Cannot pass "' + ge(e) + '" as a ' + this.name),
            e.$$.ptr || vt("Cannot pass deleted object as a pointer of type " + this.name),
            !this.isConst && e.$$.ptrType.isConst && vt("Cannot convert argument of type " + (e.$$.smartPtrType ? e.$$.smartPtrType.name : e.$$.ptrType.name) + " to parameter type " + this.name);
        var n = e.$$.ptrType.registeredClass;
        if (r = Ht(e.$$.ptr, n, this.registeredClass),
            this.isSmartPointer)
            switch (void 0 === e.$$.smartPtr && vt("Passing raw pointer to smart pointer is illegal"),
                this.sharingPolicy) {
                case 0:
                    e.$$.smartPtrType === this ? r = e.$$.smartPtr : vt("Cannot convert argument of type " + (e.$$.smartPtrType ? e.$$.smartPtrType.name : e.$$.ptrType.name) + " to parameter type " + this.name);
                    break;
                case 1:
                    r = e.$$.smartPtr;
                    break;
                case 2:
                    if (e.$$.smartPtrType === this)
                        r = e.$$.smartPtr;
                    else {
                        var o = e.clone();
                        r = this.rawShare(r, ve.toHandle((function() {
                                o.delete()
                            }))),
                            null !== t && t.push(this.rawDestructor, r)
                    }
                    break;
                default:
                    vt("Unsupporting sharing policy")
            }
        return r
    }

    function zt(t, e) {
        if (null === e)
            return this.isReference && vt("null is not a valid " + this.name),
                0;
        e.$$ || vt('Cannot pass "' + ge(e) + '" as a ' + this.name),
            e.$$.ptr || vt("Cannot pass deleted object as a pointer of type " + this.name),
            e.$$.ptrType.isConst && vt("Cannot convert argument of type " + e.$$.ptrType.name + " to parameter type " + this.name);
        var r = e.$$.ptrType.registeredClass;
        return Ht(e.$$.ptr, r, this.registeredClass)
    }

    function Bt(t) {
        return this.fromWireType(R[t >> 2])
    }

    function Lt(t) {
        return this.rawGetPointee && (t = this.rawGetPointee(t)),
            t
    }

    function Gt(t) {
        this.rawDestructor && this.rawDestructor(t)
    }

    function Nt(t) {
        null !== t && t.delete()
    }

    function qt(t, e, r) {
        if (e === r)
            return t;
        if (void 0 === r.baseClass)
            return null;
        var n = qt(t, e, r.baseClass);
        return null === n ? null : r.downcast(n)
    }

    function Jt() {
        return Object.keys(Kt).length
    }

    function Xt() {
        var t = [];
        for (var e in Kt)
            Kt.hasOwnProperty(e) && t.push(Kt[e]);
        return t
    }

    function Zt(t) {
        Ot = t,
            kt.length && Ot && Ot(Wt)
    }
    var Kt = {};

    function Qt(t, e) {
        return e = function(t, e) {
                for (void 0 === e && vt("ptr should not be undefined"); t.baseClass;)
                    e = t.upcast(e),
                    t = t.baseClass;
                return e
            }(t, e),
            Kt[e]
    }

    function te(t, e) {
        return e.ptrType && e.ptr || wt("makeClassHandle requires ptr and ptrType"),
            !!e.smartPtrType !== !!e.smartPtr && wt("Both smartPtrType and smartPtr must be specified"),
            e.count = {
                value: 1
            },
            Dt(Object.create(t, {
                $$: {
                    value: e
                }
            }))
    }

    function ee(t) {
        var e = this.getPointee(t);
        if (!e)
            return this.destructor(t),
                null;
        var r = Qt(this.registeredClass, e);
        if (void 0 !== r) {
            if (0 === r.$$.count.value)
                return r.$$.ptr = e,
                    r.$$.smartPtr = t,
                    r.clone();
            var n = r.clone();
            return this.destructor(t),
                n
        }

        function o() {
            return this.isSmartPointer ? te(this.registeredClass.instancePrototype, {
                ptrType: this.pointeeType,
                ptr: e,
                smartPtrType: this,
                smartPtr: t
            }) : te(this.registeredClass.instancePrototype, {
                ptrType: this,
                ptr: t
            })
        }
        var i, a = this.registeredClass.getActualType(e),
            u = Mt[a];
        if (!u)
            return o.call(this);
        i = this.isConst ? u.constPointerType : u.pointerType;
        var s = qt(e, this.registeredClass, i.registeredClass);
        return null === s ? o.call(this) : this.isSmartPointer ? te(i.registeredClass.instancePrototype, {
            ptrType: i,
            ptr: s,
            smartPtrType: this,
            smartPtr: t
        }) : te(i.registeredClass.instancePrototype, {
            ptrType: i,
            ptr: s
        })
    }

    function re(t, e, r, n, o, i, a, u, s, c, f) {
        this.name = t,
            this.registeredClass = e,
            this.isReference = r,
            this.isConst = n,
            this.isSmartPointer = o,
            this.pointeeType = i,
            this.sharingPolicy = a,
            this.rawGetPointee = u,
            this.rawConstructor = s,
            this.rawShare = c,
            this.rawDestructor = f,
            o || void 0 !== e.baseClass ? this.toWireType = Vt : n ? (this.toWireType = Yt,
                this.destructorFunction = null) : (this.toWireType = zt,
                this.destructorFunction = null)
    }

    function ne(t, e, r) {
        o.hasOwnProperty(t) || wt("Replacing nonexistant public symbol"),
            void 0 !== o[t].overloadTable && void 0 !== r ? o[t].overloadTable[r] = e : (o[t] = e,
                o[t].argCount = r)
    }

    function oe(t, e, r) {
        return t.includes("j") ? function(t, e, r) {
            var n = o["dynCall_" + t];
            return r && r.length ? n.apply(null, [e].concat(r)) : n.call(null, e)
        }(t, e, r) : it(e).apply(null, r)
    }

    function ie(t, e) {
        var r, n, o, i = (t = ct(t)).includes("j") ? (r = t,
            n = e,
            o = [],
            function() {
                o.length = arguments.length;
                for (var t = 0; t < arguments.length; t++)
                    o[t] = arguments[t];
                return oe(r, n, o)
            }
        ) : it(e);
        return "function" != typeof i && vt("unknown function pointer with signature " + t + ": " + e),
            i
    }
    var ae = void 0;

    function ue(t) {
        var e = je(t),
            r = ct(e);
        return We(e),
            r
    }

    function se(t, e) {
        var r = [],
            n = {};
        throw e.forEach((function t(e) {
                n[e] || lt[e] || (pt[e] ? pt[e].forEach(t) : (r.push(e),
                    n[e] = !0))
            })),
            new ae(t + ": " + r.map(ue).join([", "]))
    }

    function ce(t, e) {
        for (var r = [], n = 0; n < t; n++)
            r.push(j[(e >> 2) + n]);
        return r
    }

    function fe(t) {
        for (; t.length;) {
            var e = t.pop();
            t.pop()(e)
        }
    }

    function le(t, e, r, n, o) {
        var i = e.length;
        i < 2 && vt("argTypes array size mismatch! Must at least get return value and 'this' types!");
        for (var a = null !== e[1] && null !== r, u = !1, s = 1; s < e.length; ++s)
            if (null !== e[s] && void 0 === e[s].destructorFunction) {
                u = !0;
                break
            }
        var c = "void" !== e[0].name,
            f = "",
            l = "";
        for (s = 0; s < i - 2; ++s)
            f += (0 !== s ? ", " : "") + "arg" + s,
            l += (0 !== s ? ", " : "") + "arg" + s + "Wired";
        var p = "return function " + dt(t) + "(" + f + ") {\nif (arguments.length !== " + (i - 2) + ") {\nthrowBindingError('function " + t + " called with ' + arguments.length + ' arguments, expected " + (i - 2) + " args!');\n}\n";
        u && (p += "var destructors = [];\n");
        var d = u ? "destructors" : "null",
            h = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"],
            y = [vt, n, o, fe, e[0], e[1]];
        a && (p += "var thisWired = classParam.toWireType(" + d + ", this);\n");
        for (s = 0; s < i - 2; ++s)
            p += "var arg" + s + "Wired = argType" + s + ".toWireType(" + d + ", arg" + s + "); // " + e[s + 2].name + "\n",
            h.push("argType" + s),
            y.push(e[s + 2]);
        if (a && (l = "thisWired" + (l.length > 0 ? ", " : "") + l),
            p += (c ? "var rv = " : "") + "invoker(fn" + (l.length > 0 ? ", " : "") + l + ");\n",
            u)
            p += "runDestructors(destructors);\n";
        else
            for (s = a ? 1 : 2; s < e.length; ++s) {
                var m = 1 === s ? "thisWired" : "arg" + (s - 2) + "Wired";
                null !== e[s].destructorFunction && (p += m + "_dtor(" + m + "); // " + e[s].name + "\n",
                    h.push(m + "_dtor"),
                    y.push(e[s].destructorFunction))
            }
        return c && (p += "var ret = retType.fromWireType(rv);\nreturn ret;\n"),
            p += "}\n",
            h.push(p),
            function(t, e) {
                if (!(t instanceof Function))
                    throw new TypeError("new_ called with constructor type " + typeof t + " which is not a function");
                var r = ht(t.name || "unknownFunctionName", (function() {}));
                r.prototype = t.prototype;
                var n = new r,
                    o = t.apply(n, e);
                return o instanceof Object ? o : n
            }(Function, h).apply(null, y)
    }
    var pe = [],
        de = [{}, {
            value: void 0
        }, {
            value: null
        }, {
            value: !0
        }, {
            value: !1
        }];

    function he(t) {
        t > 4 && 0 == --de[t].refcount && (de[t] = void 0,
            pe.push(t))
    }

    function ye() {
        for (var t = 0, e = 5; e < de.length; ++e)
            void 0 !== de[e] && ++t;
        return t
    }

    function me() {
        for (var t = 5; t < de.length; ++t)
            if (void 0 !== de[t])
                return de[t];
        return null
    }
    var ve = {
        toValue: function(t) {
            return t || vt("Cannot use deleted val. handle = " + t),
                de[t].value
        },
        toHandle: function(t) {
            switch (t) {
                case void 0:
                    return 1;
                case null:
                    return 2;
                case !0:
                    return 3;
                case !1:
                    return 4;
                default:
                    var e = pe.length ? pe.pop() : de.length;
                    return de[e] = {
                            refcount: 1,
                            value: t
                        },
                        e
            }
        }
    };

    function ge(t) {
        if (null === t)
            return "null";
        var e = typeof t;
        return "object" === e || "array" === e || "function" === e ? t.toString() : "" + t
    }

    function we(t, e) {
        switch (e) {
            case 2:
                return function(t) {
                    return this.fromWireType(M[t >> 2])
                };
            case 3:
                return function(t) {
                    return this.fromWireType(I[t >> 3])
                };
            default:
                throw new TypeError("Unknown float type: " + t)
        }
    }

    function be(t, e, r) {
        switch (e) {
            case 0:
                return r ? function(t) {
                        return S[t]
                    } :
                    function(t) {
                        return O[t]
                    };
            case 1:
                return r ? function(t) {
                        return k[t >> 1]
                    } :
                    function(t) {
                        return W[t >> 1]
                    };
            case 2:
                return r ? function(t) {
                        return j[t >> 2]
                    } :
                    function(t) {
                        return R[t >> 2]
                    };
            default:
                throw new TypeError("Unknown integer type: " + t)
        }
    }
    var Te = {
        mappings: {},
        buffers: [null, [],
            []
        ],
        printChar: function(t, e) {
            var r = Te.buffers[t];
            0 === e || 10 === e ? ((1 === t ? v : g)(UTF8ArrayToString(r, 0)),
                r.length = 0) : r.push(e)
        },
        varargs: void 0,
        get: function() {
            return Te.varargs += 4,
                j[Te.varargs - 4 >> 2]
        },
        getStr: function(t) {
            return UTF8ToString(t)
        },
        get64: function(t, e) {
            return t
        }
    };

    function $e(t) {
        return t % 4 == 0 && (t % 100 != 0 || t % 400 == 0)
    }

    function Pe(t, e) {
        for (var r = 0, n = 0; n <= e; r += t[n++])
        ;
        return r
    }
    var Ae = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        De = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    function Fe(t, e) {
        for (var r = new Date(t.getTime()); e > 0;) {
            var n = $e(r.getFullYear()),
                o = r.getMonth(),
                i = (n ? Ae : De)[o];
            if (!(e > i - r.getDate()))
                return r.setDate(r.getDate() + e),
                    r;
            e -= i - r.getDate() + 1,
                r.setDate(1),
                o < 11 ? r.setMonth(o + 1) : (r.setMonth(0),
                    r.setFullYear(r.getFullYear() + 1))
        }
        return r
    }

    for (var t = new Array(256), e = 0; e < 256; ++e)
        t[e] = String.fromCharCode(e);
    st = t
    
    mt = o.BindingError = yt(Error, "BindingError"),
    gt = o.InternalError = yt(Error, "InternalError"),
    Rt.prototype.isAliasOf = Ct,
    Rt.prototype.clone = Ft,
    Rt.prototype.delete = Et,
    Rt.prototype.isDeleted = St,
    Rt.prototype.deleteLater = jt,
    re.prototype.getPointee = Lt,
    re.prototype.destructor = Gt,
    re.prototype.argPackAdvance = 8,
    re.prototype.readValueFromPointer = Bt,
    re.prototype.deleteObject = Nt,
    re.prototype.fromWireType = ee,
    o.getInheritedInstanceCount = Jt,
    o.getLiveInheritedInstances = Xt,
    o.flushPendingDeletes = Wt,
    o.setDelayFunction = Zt,
    ae = o.UnboundTypeError = yt(Error, "UnboundTypeError"),
    o.count_emval_handles = ye,
    o.get_first_emval = me;
    var Se, import_table_impl = {
            d: function(t, e, r, n) {                            
                abort("Assertion failed: " + UTF8ToString(t) + ", at: " + [e ? UTF8ToString(e) : "unknown filename", r, n ? UTF8ToString(n) : "unknown function"])
            },
            g: function(t) {                            
                return ke(t + 16) + 16
            },
            f: function(t, e, r) {
                throw new ExceptionInfo(t).init(e, r),t,t
            },
            p: function(t, e, r, n, o) {},
            y: function(t, e, r, n, o) {
                var i = ut(r);
                _t(t, {
                    name: e = ct(e),
                    fromWireType: function(t) {
                        return !!t
                    },
                    toWireType: function(t, e) {
                        return e ? n : o
                    },
                    argPackAdvance: 8,
                    readValueFromPointer: function(t) {
                        var n;
                        if (1 === r)
                            n = S;
                        else if (2 === r)
                            n = k;
                        else {
                            if (4 !== r)
                                throw new TypeError("Unknown boolean type size: " + e);
                            n = j
                        }
                        return this.fromWireType(n[t >> i])
                    },
                    destructorFunction: null
                })
            },
            A: function(t, e, r, n, o, i, a, u, s, c, f, l, p) {
                f = ct(f),
                    i = ie(o, i),
                    u && (u = ie(a, u)),
                    c && (c = ie(s, c)),
                    p = ie(l, p);
                var d = dt(f);
                xt(d, (function() {
                        se("Cannot construct " + f + " due to unbound types", [n])
                    })),
                    bt([t, e, r], n ? [n] : [], (function(e) {
                        var r, o;
                        e = e[0],
                            o = n ? (r = e.registeredClass).instancePrototype : Rt.prototype;
                        var a = ht(d, (function() {
                                if (Object.getPrototypeOf(this) !== s)
                                    throw new mt("Use 'new' to construct " + f);
                                if (void 0 === l.constructor_body)
                                    throw new mt(f + " has no accessible constructor");
                                var t = l.constructor_body[arguments.length];
                                if (void 0 === t)
                                    throw new mt("Tried to invoke ctor of " + f + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(l.constructor_body).toString() + ") parameters instead!");
                                return t.apply(this, arguments)
                            })),
                            s = Object.create(o, {
                                constructor: {
                                    value: a
                                }
                            });
                        a.prototype = s;
                        var l = new Ut(f, a, s, p, r, i, u, c),
                            h = new re(f, l, !0, !1, !1),
                            y = new re(f + "*", l, !1, !1, !1),
                            m = new re(f + " const*", l, !1, !0, !1);
                        return Mt[t] = {
                                pointerType: y,
                                constPointerType: m
                            },
                            ne(d, a),
                            [h, y, m]
                    }))
            },
            w: function(t, e, r, n, o, i) {
                T(e > 0);
                var a = ce(e, r);
                o = ie(n, o),
                    bt([], [t], (function(t) {
                        var r = "constructor " + (t = t[0]).name;
                        if (void 0 === t.registeredClass.constructor_body && (t.registeredClass.constructor_body = []),
                            void 0 !== t.registeredClass.constructor_body[e - 1])
                            throw new mt("Cannot register multiple constructors with identical number of parameters (" + (e - 1) + ") for class '" + t.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
                        return t.registeredClass.constructor_body[e - 1] = function() {
                                se("Cannot construct " + t.name + " due to unbound types", a)
                            },
                            bt([], a, (function(n) {
                                return n.splice(1, 0, null),
                                    t.registeredClass.constructor_body[e - 1] = le(r, n, null, o, i),
                                    []
                            })),
                            []
                    }))
            },
            c: function(t, e, r, n, o, i, a, u) {
                var s = ce(r, n);
                e = ct(e),
                    i = ie(o, i),
                    bt([], [t], (function(t) {
                        var n = (t = t[0]).name + "." + e;

                        function o() {
                            se("Cannot call " + n + " due to unbound types", s)
                        }
                        e.startsWith("@@") && (e = Symbol[e.substring(2)]),
                            u && t.registeredClass.pureVirtualFunctions.push(e);
                        var c = t.registeredClass.instancePrototype,
                            f = c[e];
                        return void 0 === f || void 0 === f.overloadTable && f.className !== t.name && f.argCount === r - 2 ? (o.argCount = r - 2,
                                o.className = t.name,
                                c[e] = o) : (It(c, e, n),
                                c[e].overloadTable[r - 2] = o),
                            bt([], s, (function(o) {
                                var u = le(n, o, t, i, a);
                                return void 0 === c[e].overloadTable ? (u.argCount = r - 2,
                                        c[e] = u) : c[e].overloadTable[r - 2] = u,
                                    []
                            })),
                            []
                    }))
            },
            x: function(t, e) {
                _t(t, {
                    name: e = ct(e),
                    fromWireType: function(t) {
                        var e = ve.toValue(t);
                        return he(t),
                            e
                    },
                    toWireType: function(t, e) {
                        return ve.toHandle(e)
                    },
                    argPackAdvance: 8,
                    readValueFromPointer: Bt,
                    destructorFunction: null
                })
            },
            j: function(t, e, r) {
                var n = ut(r);
                _t(t, {
                    name: e = ct(e),
                    fromWireType: function(t) {
                        return t
                    },
                    toWireType: function(t, e) {
                        if ("number" != typeof e && "boolean" != typeof e)
                            throw new TypeError('Cannot convert "' + ge(e) + '" to ' + this.name);
                        return e
                    },
                    argPackAdvance: 8,
                    readValueFromPointer: we(e, n),
                    destructorFunction: null
                })
            },
            l: function(t, e, r, n, o, i) {
                // Registering functions from constructor (;204;)
                var a = ce(e, r);
                t = ct(t),
                    o = ie(n, o),
                    xt(t, (function() {
                        se("Cannot call " + t + " due to unbound types", a)
                    }), e - 1),
                    bt([], a, (function(r) {
                        var n = [r[0], null].concat(r.slice(1));
                        return ne(t, le(t, n, null, o, i), e - 1),
                            []
                    }))
            },
            b: function(t, e, r, n, o) {
                e = ct(e),
                    -1 === o && (o = 4294967295);
                var i = ut(r),
                    a = function(t) {
                        return t
                    };
                if (0 === n) {
                    var u = 32 - 8 * r;
                    a = function(t) {
                        return t << u >>> u
                    }
                }
                var s = e.includes("unsigned");
                _t(t, {
                    name: e,
                    fromWireType: a,
                    toWireType: function(t, r) {
                        if ("number" != typeof r && "boolean" != typeof r)
                            throw new TypeError('Cannot convert "' + ge(r) + '" to ' + this.name);
                        if (r < n || r > o)
                            throw new TypeError('Passing a number "' + ge(r) + '" from JS side to C/C++ side to an argument of type "' + e + '", which is outside the valid range [' + n + ", " + o + "]!");
                        return s ? r >>> 0 : 0 | r
                    },
                    argPackAdvance: 8,
                    readValueFromPointer: be(e, i, 0 !== n),
                    destructorFunction: null
                })
            },
            a: function(t, e, r) {
                var n = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][e];

                function o(t) {
                    var e = R,
                        r = e[t >>= 2],
                        o = e[t + 1];
                    return new n(E, o, r)
                }
                _t(t, {
                    name: r = ct(r),
                    fromWireType: o,
                    argPackAdvance: 8,
                    readValueFromPointer: o
                }, {
                    ignoreDuplicateRegistrations: !0
                })
            },
            k: function(t, e) {
                var r = "std::string" === (e = ct(e));
                _t(t, {
                    name: e,
                    fromWireType: function(t) {
                        var e, n = R[t >> 2];
                        if (r)
                            for (var o = t + 4, i = 0; i <= n; ++i) {
                                var a = t + 4 + i;
                                if (i == n || 0 == O[a]) {
                                    var u = UTF8ToString(o, a - o);
                                    void 0 === e ? e = u : (e += String.fromCharCode(0),
                                            e += u),
                                        o = a + 1
                                }
                            }
                        else {
                            var s = new Array(n);
                            for (i = 0; i < n; ++i)
                                s[i] = String.fromCharCode(O[t + 4 + i]);
                            e = s.join("")
                        }
                        return We(t),
                            e
                    },
                    toWireType: function(t, e) {
                        e instanceof ArrayBuffer && (e = new Uint8Array(e));
                        var n = "string" == typeof e;
                        n || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Int8Array || vt("Cannot pass non-string to std::string");
                        var o = (r && n ? function() {
                                    return UTF8CharCount(e)
                                } :
                                function() {
                                    return e.length
                                }
                            )(),
                            i = ke(4 + o + 1);
                        if (R[i >> 2] = o,
                            r && n)
                            stringToUTF8Array(e, O, i + 4, o + 1);
                        else if (n)
                            for (var a = 0; a < o; ++a) {
                                var u = e.charCodeAt(a);
                                u > 255 && (We(i),
                                        vt("String has UTF-16 code units that do not fit in 8 bits")),
                                    O[i + 4 + a] = u
                            }
                        else
                            for (a = 0; a < o; ++a)
                                O[i + 4 + a] = e[a];
                        return null !== t && t.push(We, i),
                            i
                    },
                    argPackAdvance: 8,
                    readValueFromPointer: Bt,
                    destructorFunction: function(t) {
                        We(t)
                    }
                })
            },
            e: function(t, e, r) {
                var n, o, i, a, u;
                r = ct(r),
                    2 === e ? (n = UTF16ArrayToString,
                        o = H,
                        a = Y,
                        i = function() {
                            return W
                        },
                        u = 1) : 4 === e && (n = V,
                        o = z,
                        a = B,
                        i = function() {
                            return R
                        },
                        u = 2),
                    _t(t, {
                        name: r,
                        fromWireType: function(t) {
                            for (var r, o = R[t >> 2], a = i(), s = t + 4, c = 0; c <= o; ++c) {
                                var f = t + 4 + c * e;
                                if (c == o || 0 == a[f >> u]) {
                                    var l = n(s, f - s);
                                    void 0 === r ? r = l : (r += String.fromCharCode(0),
                                            r += l),
                                        s = f + e
                                }
                            }
                            return We(t),
                                r
                        },
                        toWireType: function(t, n) {
                            "string" != typeof n && vt("Cannot pass non-string to C++ string type " + r);
                            var i = a(n),
                                s = ke(4 + i + e);
                            return R[s >> 2] = i >> u,
                                o(n, s + 4, i + e),
                                null !== t && t.push(We, s),
                                s
                        },
                        argPackAdvance: 8,
                        readValueFromPointer: Bt,
                        destructorFunction: function(t) {
                            We(t)
                        }
                    })
            },
            z: function(t, e) {
                _t(t, {
                    isVoid: !0,
                    name: e = ct(e),
                    argPackAdvance: 0,
                    fromWireType: function() {},
                    toWireType: function(t, e) {}
                })
            },
            m: he,
            n: function(t) {
                t > 4 && (de[t].refcount += 1)
            },
            o: function(t, e) {
                var r, n, o;
                n = "_emval_take_value",
                    void 0 === (o = lt[r = t]) && vt(n + " has unknown type " + ue(r));
                var i = (t = o).readValueFromPointer(e);
                return ve.toHandle(i)
            },
            h: function() {
                abort("")
            },
            r: function(t, e, r) {
                O.copyWithin(t, e, e + r)
            },
            s: function(t) {
                O.length,
                    abort("OOM")
            },
            u: function(t, e) {},
            v: function(t, e) {},
            i: function(t, e, r, n) {
                for (var o = 0, i = 0; i < r; i++) {
                    var a = j[e >> 2],
                        u = j[e + 4 >> 2];
                    e += 8;
                    for (var s = 0; s < u; s++)
                        Te.printChar(t, O[a + s]);
                    o += u
                }
                return j[n >> 2] = o,
                    0
            },
            q: function(t) {
                t
            },
            t: function(t, e, r, n) {
                return Ee(t, e, r, n)
            }
        },
        ke = (function() {
                var import_table = {
                    a: import_table_impl
                };

                function updateGlobalBufferAndViews(t, e) {
                    var r, n, exports = t.exports;
                    o.asm = exports;
                    b = o.asm.B; // Mem
                    r = b.buffer
                    E = r
                    o.HEAP8 = S = new Int8Array(r),
                    o.HEAP16 = k = new Int16Array(r),
                    o.HEAP32 = j = new Int32Array(r),
                    o.HEAPU8 = O = new Uint8Array(r),
                    o.HEAPU16 = W = new Uint16Array(r),
                    o.HEAPU32 = R = new Uint32Array(r),
                    o.HEAPF32 = M = new Float32Array(r),
                    o.HEAPF64 = I = new Float64Array(r),
                    L = o.asm.D // Table
                    n = o.asm.C // ctor
                    N.unshift(n),
                        function(t) {
                            if (J--,
                                o.monitorRunDependencies && o.monitorRunDependencies(J),
                                0 == J && (null !== X && (clearInterval(X),
                                        X = null),
                                    Z)) {
                                var e = Z;
                                Z = null,
                                    e()
                            }
                        }()
                }

                function load_wasm(t) {
                    updateGlobalBufferAndViews(t.instance)
                }

                function getBinaryPromise(e) {
                    return function() {
                        if (!w) {
                            if (readSync)
                                return new Promise((function(t, e) {
                                    readSync(Q, (function(e) {
                                        t(new Uint8Array(e))
                                    }), e)
                                }))
                        }
                        return Promise.resolve().then((function() {
                            return getBinary(Q)
                        }))
                    }().then((function(e) {
                        return WebAssembly.instantiate(e, import_table)
                    })).then((function(t) {
                        return t
                    })).then(e, (function(t) {
                        g("failed to asynchronously prepare wasm: " + t,Q),
                            abort(t)
                    }))
                }
                if (J++,
                    o.monitorRunDependencies && o.monitorRunDependencies(J),
                    o.instantiateWasm)
                    try {
                        return o.instantiateWasm(import_table, updateGlobalBufferAndViews)
                    } catch (t) {
                        return g("Module.instantiateWasm callback failed with error: " + t),
                            !1
                    }
                w || "function" != typeof WebAssembly.instantiate || isDataURI(Q) || isFileURI(Q) || getBinaryPromise(load_wasm)                
            }(),
            o.___wasm_call_ctors = function() {
                return (o.___wasm_call_ctors = o.asm.C).apply(null, arguments)
            },
            o._malloc = function() {
                return (ke = o._malloc = o.asm.E).apply(null, arguments)
            }
        ),
        We = o._free = function() {
            return (We = o._free = o.asm.F).apply(null, arguments)
        },
        je = o.___getTypeName = function() {
            return (je = o.___getTypeName = o.asm.G).apply(null, arguments)
        };
    o.___embind_register_native_and_builtin_types = function() {
            return (o.___embind_register_native_and_builtin_types = o.asm.H).apply(null, arguments)
        },
        o.dynCall_jiji = function() {
            return (o.dynCall_jiji = o.asm.I).apply(null, arguments)
        },
        o.dynCall_iiiiij = function() {
            return (o.dynCall_iiiiij = o.asm.J).apply(null, arguments)
        },
        o.dynCall_iiiiijj = function() {
            return (o.dynCall_iiiiijj = o.asm.K).apply(null, arguments)
        },
        o.dynCall_iiiiiijj = function() {
            return (o.dynCall_iiiiiijj = o.asm.L).apply(null, arguments)
        },
        o.dynCall_viijii = function() {
            return (o.dynCall_viijii = o.asm.M).apply(null, arguments)
        };

    function ExitStatus(t) {
        this.name = "ExitStatus",
            this.message = "Program terminated with exit(" + t + ")",
            this.status = t
    }

    function doRun(t) {
        function postRun() {
            Se || (Se = !0,o.calledRun = !0,C || (!0,
                    callRuntimeCallbacks(N),
                    o.onRuntimeInitialized && o.onRuntimeInitialized(),
                    function() {
                        if (o.postRun)
                            for ("function" == typeof o.postRun && (o.postRun = [o.postRun]); o.postRun.length;)
                                t = o.postRun.shift(),
                                q.unshift(t);
                        var t;
                        callRuntimeCallbacks(q)
                    }()))
        }
        t = t || l
        J > 0 || (! function preRun() {
                    if (o.preRun)
                        for ("function" == typeof o.preRun && (o.preRun = [o.preRun]); o.preRun.length;)
                            t = o.preRun.shift(),
                            G.unshift(t);
                    var t;
                    callRuntimeCallbacks(G)
                }(),
                J > 0 || (o.setStatus ? (o.setStatus("Running..."),
                    setTimeout((function() {
                        setTimeout((function() {
                                o.setStatus("")
                            }), 1),
                            postRun()
                    }), 1)) : postRun()))
    }
    if (Z = function t() {
            Se || doRun(),
                Se || (Z = t)
        },
        o.run = doRun,
        o.preInit)
        for ("function" == typeof o.preInit && (o.preInit = [o.preInit]); o.preInit.length > 0;)
            o.preInit.pop()();
    doRun();
    return o;
})

// XXX: With PythonMonkey, the required module
// is destructed(?) once the function is called
// This is probably not what actaully happened, but
// for now, everytime an FP is generated, the entire
// WASM module is reloaded as a workaround
function instantiateRuntime(){
    return new Promise((resolve, reject) => {
        var fpRuntime = AudioFingerprintRuntime()
        var monitor = setInterval(() => {
            if (typeof fpRuntime.ExtractQueryFP == "function") 
                clearInterval(monitor) || resolve(fpRuntime)
        }) 
    })
}

function GenerateFP(floatArray) {
    let PCMBuffer = Float32Array.from(floatArray)
    
    return instantiateRuntime().then((fpRuntime) => {
        
        let fp_vector = fpRuntime.ExtractQueryFP(PCMBuffer.buffer)        
        let result_buf = new Uint8Array(fp_vector.size());
        for (let t = 0; t < fp_vector.size(); t++)
            result_buf[t] = fp_vector.get(t);
        return nicoB64.encode(result_buf)
    });
}


return {GenerateFP:GenerateFP,WASM_BINARY:WASM_BINARY};
})();

/* ===== 7. v1.17.0 聊天存档管理器（原 chat-archive-manager v1.3.0 并入第二页） =====
   · 功能与独立版完全一致：按角色归档 / 展开查看存档 / 备注 / 存档专属头像 / 一键加载 /
     数量懒加载 / 并发受限(5) / 请求超时(20s) / 列表缓存 / 渲染串行化 / 当前标记；
   · 全部状态封闭在 nicoArchive IIFE 内，不与音乐播放器等外层逻辑共享任何变量；
   · 设置仍存 extension_settings['chat-archive-manager']，旧版备注与专属头像无缝保留；
   · 首次切到存档页才发起网络请求（比独立版更省：启动阶段零请求、零列表渲染）；
   · 扩展重载时自动解绑旧事件、断开旧 Observer、清理定时器，不叠加、不卡顿。 */
var nicoArchive = (function(){
    var MODULE_NAME = 'chat-archive-manager';
    var MODULE_VERSION = '1.17.0-merged';

    /* ---------- 酒馆上下文桥接（防御式，取不到不拖垮主面板） ---------- */
    function getContext(){
        try{
            if(window.SillyTavern && typeof window.SillyTavern.getContext==='function') return window.SillyTavern.getContext();
        }catch(e){}
        return null;
    }
    // setActiveGroup / saveChatDebounced 未挂在 getContext() 上：动态 import 一次（ESM 缓存，不会重复执行酒馆主模块）
    var arcMod = { setActiveGroup:null, saveChatDebounced:null };
    var arcModReady = Promise.resolve();
    try{
        arcModReady = import('../../../../script.js').then(function(m){
            if(m && typeof m.setActiveGroup==='function') arcMod.setActiveGroup = m.setActiveGroup;
            if(m && typeof m.saveChatDebounced==='function') arcMod.saveChatDebounced = m.saveChatDebounced;
        }).catch(function(e){ console.warn('['+MODULE_NAME+'] script.js 桥接失败，群聊退出/即时保存将走兜底', e); });
    }catch(e){ console.warn('['+MODULE_NAME+'] 动态 import 不可用', e); }

    /* ---------- 持久化设置（沿用独立版存储键，旧数据自动继承） ---------- */
    function rawSettings(){
        var c = getContext();
        var es = c && (c.extensionSettings || c.extension_settings);
        return es || null;
    }
    function getSettings(){
        var es = rawSettings();
        if(!es) return null;
        if(!es[MODULE_NAME]) es[MODULE_NAME] = { notes:{} };
        if(!es[MODULE_NAME].notes) es[MODULE_NAME].notes = {};
        if(!es[MODULE_NAME].avatars) es[MODULE_NAME].avatars = {};
        return es[MODULE_NAME];
    }
    var settings = getSettings() || { notes:{}, avatars:{} };
    var notes = settings.notes;
    var avatars = settings.avatars;
    // 桥接晚于模块执行就绪时，把就绪前写入的临时数据并回真实设置
    function ensureSettings(){
        var s = getSettings();
        if(!s) return false;
        if(s !== settings){
            Object.keys(notes).forEach(function(k){ if(!s.notes[k]) s.notes[k] = notes[k]; });
            Object.keys(avatars).forEach(function(k){ if(!s.avatars[k]) s.avatars[k] = avatars[k]; });
            settings = s; notes = s.notes; avatars = s.avatars;
        }
        return true;
    }
    function saveSettings(){
        try{ var c = getContext(); if(c && c.saveSettingsDebounced) c.saveSettingsDebounced(); }catch(e){}
    }

    /* ---------- DOM 与状态 ---------- */
    var arcPage = null, listEl = null, statsEl = null, refreshBtn = null, filterEl = null;
    var countsStarted = false; // 首次进入存档页才拉取数量（懒加载）
    var countsLoaded = false;
    var counts = {};        // avatar -> 存档数量
    var chatsCache = {};    // avatar -> 完整存档列表
    var expanded = new Set();
    var COUNT_CONCURRENCY = 5;
    var FETCH_TIMEOUT = 20000;
    var cacheVersion = 0;
    var countsPromise = null;
    var renderChain = Promise.resolve();
    var lastSignature = null;

    var boundEvents = [];
    var timers = [];
    var chatObserver = null;
    var applyScheduled = false;
    var avatarFileInput = null;
    function arcTimeout(fn, ms){ var id = setTimeout(fn, ms); timers.push(id); return id; }

    /* ---------- 极简 SVG 图标（与主页同一套 24x24 线性填充风格） ---------- */
    var SVG_CHEVRON = '<svg viewBox="0 0 24 24"><path d="M9.29 6.71L14.58 12l-5.29 5.29L10.71 18.7l6.59-6.59a1 1 0 0 0 0-1.41l-6.59-6.59z"/></svg>';
    var SVG_IMAGE = '<svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.9 13.05l2.1 2.53 3.1-3.88L19 17H5l3.9-3.95z"/></svg>';
    var SVG_ERASER = '<svg viewBox="0 0 24 24"><path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73a2 2 0 0 0 0 2.83l3.85 3.85c.39.39.9.59 1.41.59H22v-2H7.83l-3-3L13.44 5.7l5.06 5.1 1.42-1.41a2 2 0 0 0 0-2.84l-3.36-3.36A1.98 1.98 0 0 0 15.14 3z"/></svg>';

    /* ---------- 工具函数 ---------- */
    function noteKey(avatar, fileName){ return avatar + '::' + fileName; }

    function toMs(value){
        if(!value) return 0;
        if(typeof value === 'number') return value;
        var s = String(value).trim();
        if(/^\d+$/.test(s)){
            var n = Number(s);
            return n < 1e11 ? n * 1000 : n;
        }
        var d = new Date(s);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    function formatDateTime(value){
        var ms = toMs(value);
        if(!ms) return '';
        var d = new Date(ms);
        var p = function(n){ return String(n).padStart(2,'0'); };
        return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
    }
    function formatTimestampName(base){
        if(!/^\d+$/.test(base)) return null;
        return formatDateTime(base);
    }
    function sortChats(list){
        var msByChat = new Map();
        list.forEach(function(c){ msByChat.set(c, toMs(c && c.last_mes)); });
        return list.slice().sort(function(a,b){ return (msByChat.get(b) || 0) - (msByChat.get(a) || 0); });
    }

    /* ---------- 数据获取（酒馆原生接口，超时 + 并发上限，绝不压垮本地服务） ---------- */
    function fetchWithTimeout(url, options){
        var ctrl = new AbortController();
        var timer = setTimeout(function(){ ctrl.abort(); }, FETCH_TIMEOUT);
        return fetch(url, Object.assign({}, options, { signal: ctrl.signal })).finally(function(){ clearTimeout(timer); });
    }
    async function fetchSimpleCount(avatar){
        try{
            var c = getContext();
            var res = await fetchWithTimeout('/api/characters/chats', {
                method:'POST',
                headers:c.getRequestHeaders(),
                body:JSON.stringify({ avatar_url: avatar, simple: true })
            });
            if(!res.ok) return 0;
            var data = await res.json();
            if(data && data.error === true) return 0;
            return Array.isArray(data) ? data.length : 0;
        }catch(e){
            if(e && e.name==='AbortError') console.warn('['+MODULE_NAME+'] 获取角色存档数量超时('+FETCH_TIMEOUT+'ms):', avatar);
            else console.warn('['+MODULE_NAME+'] 获取角色存档数量失败:', e);
            return 0;
        }
    }
    async function fetchCharacterChats(avatar){
        try{
            var c = getContext();
            var res = await fetchWithTimeout('/api/characters/chats', {
                method:'POST',
                headers:c.getRequestHeaders(),
                body:JSON.stringify({ avatar_url: avatar })
            });
            if(!res.ok) return null;
            var data = await res.json();
            if(data && data.error === true) return [];
            return Array.isArray(data) ? data : [];
        }catch(e){
            if(e && e.name==='AbortError') console.warn('['+MODULE_NAME+'] 获取角色存档超时('+FETCH_TIMEOUT+'ms):', avatar);
            else console.warn('['+MODULE_NAME+'] 获取角色存档失败:', e);
            return null;
        }
    }
    async function mapLimit(items, limit, fn){
        var results = new Array(items.length);
        var next = 0;
        var worker = async function(){
            while(next < items.length){
                var i = next++;
                results[i] = await fn(items[i], i);
            }
        };
        var workers = [];
        for(var w=0; w<Math.min(limit, items.length); w++) workers.push(worker());
        await Promise.all(workers);
        return results;
    }
    function loadCounts(){
        if(countsPromise) return countsPromise;
        countsPromise = (async function(){
            try{
                var list = (getContext() && getContext().characters) || [];
                countsLoaded = true;
                var missing = list.filter(function(c){ return c && c.avatar && counts[c.avatar] === undefined; });
                if(missing.length > 0){
                    await mapLimit(missing, COUNT_CONCURRENCY, async function(c){
                        counts[c.avatar] = await fetchSimpleCount(c.avatar);
                    });
                    await renderCharFolders(true);
                }else{
                    await renderCharFolders();
                }
            }catch(e){
                console.warn('['+MODULE_NAME+'] 加载存档数量失败:', e);
            }
        })().finally(function(){ countsPromise = null; });
        return countsPromise;
    }

    /* ---------- UI：统计 / 筛选 ---------- */
    function updateStats(){
        if(!statsEl) return;
        var c = getContext();
        var total = (c && c.characters) ? c.characters.length : 0;
        var visible = listEl ? listEl.querySelectorAll('.nico-arc-char').length : 0;
        statsEl.textContent = countsLoaded ? ('共 '+total+' 个角色，'+visible+' 个有存档') : ('共 '+total+' 个角色');
    }
    function applyFilter(){
        if(!listEl || !filterEl) return;
        var q = (filterEl.value || '').trim().toLowerCase();
        var folders = listEl.querySelectorAll('.nico-arc-char');
        for(var i=0;i<folders.length;i++){
            var f = folders[i];
            if(!q){ f.style.display = ''; continue; }
            var nameNode = f.querySelector('.nico-arc-nm');
            var name = nameNode ? (nameNode.textContent || '').toLowerCase() : '';
            var hit = name.indexOf(q) >= 0;
            if(!hit){
                var chats = chatsCache[f.dataset.avatar];
                if(chats){
                    for(var j=0;j<chats.length;j++){
                        var ch = chats[j];
                        var base = String(ch.file_name || '').replace(/\.jsonl$/i,'');
                        var title = formatTimestampName(base) || base;
                        var note = notes[noteKey(f.dataset.avatar, ch.file_name)] || '';
                        if(title.toLowerCase().indexOf(q) >= 0 || note.toLowerCase().indexOf(q) >= 0){ hit = true; break; }
                    }
                }
            }
            f.style.display = hit ? '' : 'none';
        }
    }

    /* ---------- UI：角色档案夹 ---------- */
    function buildCharFolder(c, count){
        var folder = document.createElement('div');
        folder.className = 'nico-arc-char';
        folder.dataset.avatar = c.avatar;

        var head = document.createElement('div');
        head.className = 'nico-arc-head';
        var chevron = document.createElement('span');
        chevron.className = 'nico-arc-cv';
        chevron.innerHTML = SVG_CHEVRON;
        var name = document.createElement('span');
        name.className = 'nico-arc-nm';
        name.textContent = c.name || String(c.avatar).replace(/\.png$/i,'');
        name.title = c.name || c.avatar;
        var badge = document.createElement('span');
        badge.className = 'nico-arc-badge';
        badge.textContent = count === -1 ? '…' : String(count);
        head.appendChild(chevron); head.appendChild(name); head.appendChild(badge);

        var body = document.createElement('div');
        body.className = 'nico-arc-body';

        head.addEventListener('click', function(){ toggleFolder(folder, c.avatar); });
        folder.appendChild(head);
        folder.appendChild(body);
        return folder;
    }
    function toggleFolder(folder, avatar){
        var isOpen = folder.classList.toggle('nico-open');
        if(isOpen){
            expanded.add(avatar);
            var body = folder.querySelector('.nico-arc-body');
            if(body) renderChatList(avatar, body);
        }else{
            expanded.delete(avatar);
        }
    }
    async function renderChatList(avatar, body){
        var chats = chatsCache[avatar];
        if(chats && body.dataset.cacheVer === String(cacheVersion) && body.childElementCount > 0) return;
        body.innerHTML = '';

        if(!chats){
            var loading = document.createElement('div');
            loading.className = 'nico-arc-loading';
            loading.textContent = '加载存档中…';
            body.appendChild(loading);

            chats = await fetchCharacterChats(avatar);
            if(chats === null){
                body.innerHTML = '';
                var err = document.createElement('div');
                err.className = 'nico-arc-empty';
                err.textContent = '加载失败，请点右上角刷新按钮重试';
                body.appendChild(err);
                return;
            }
            chats = sortChats(chats);
            chatsCache[avatar] = chats;
            if(counts[avatar] !== chats.length){
                counts[avatar] = chats.length;
                updateCharBadge(avatar, chats.length);
            }
            body.innerHTML = '';
        }

        if(chats.length === 0){
            var empty = document.createElement('div');
            empty.className = 'nico-arc-empty';
            empty.textContent = '该角色暂无聊天存档';
            body.appendChild(empty);
            body.dataset.cacheVer = String(cacheVersion);
            return;
        }

        var currentChat = getContext() ? getContext().chatId : null;
        var frag = document.createDocumentFragment();
        chats.forEach(function(chat){ frag.appendChild(buildChatRow(chat, avatar, currentChat)); });
        body.appendChild(frag);
        body.dataset.cacheVer = String(cacheVersion);
    }
    function updateCharBadge(avatar, count){
        if(!listEl) return;
        var folder = listEl.querySelector('.nico-arc-char[data-avatar="'+CSS.escape(avatar)+'"]');
        if(!folder) return;
        var badge = folder.querySelector('.nico-arc-badge');
        if(badge) badge.textContent = String(count);
    }

    /* ---------- 存档专属头像 ---------- */
    function getChatAvatar(avatar, fileName){ return avatars[noteKey(avatar, fileName)] || null; }
    function setChatAvatar(avatar, fileName, dataUrl){ avatars[noteKey(avatar, fileName)] = dataUrl; ensureSettings(); saveSettings(); }
    function removeChatAvatar(avatar, fileName){ delete avatars[noteKey(avatar, fileName)]; ensureSettings(); saveSettings(); }

    function defaultAvatarUrl(avatar){
        var c = getContext();
        if(c && typeof c.getThumbnailUrl==='function'){
            try{ return c.getThumbnailUrl('avatar', avatar); }catch(e){}
        }
        return '/characters/' + encodeURIComponent(avatar);
    }
    function isCurrentChat(avatar, fileName){
        var c = getContext();
        if(!c || !c.chatId) return false;
        var cur = c.characters[c.characterId];
        if(!cur || cur.avatar !== avatar) return false;
        return stripJsonl(fileName) === c.chatId;
    }
    function currentCharacter(){
        var c = getContext();
        if(!c) return null;
        var ci = c.characterId;
        if(ci === undefined || ci === null || ci === '') return null;
        var idx = Number(ci);
        var cs = c.characters || [];
        if(!Number.isInteger(idx) || idx < 0 || idx >= cs.length) return null;
        return cs[idx] || null;
    }
    function currentChatAvatarUrl(){
        var c = currentCharacter();
        if(!c || !c.avatar) return null;
        var ctx = getContext();
        if(!ctx || !ctx.chatId) return null;
        return getChatAvatar(c.avatar, ctx.chatId + '.jsonl');
    }
    function isRoleAvatarImg(img, avatar){
        var src = img.getAttribute('src') || '';
        if(!src || !avatar) return false;
        var encoded = encodeURIComponent(avatar);
        return (src.indexOf('type=avatar') >= 0
                && (src.indexOf('file='+encoded) >= 0 || src.indexOf('file='+avatar) >= 0))
            || src.indexOf('/characters/'+encoded) >= 0
            || src.indexOf('/characters/'+avatar) >= 0;
    }
    function replaceMessageAvatar(img, avatar, customUrl){
        if(customUrl){
            if(img.dataset.camCustom === '1'){
                img.src = customUrl;
            }else if(isRoleAvatarImg(img, avatar)){
                img.dataset.camOrig = img.getAttribute('src') || '';
                img.dataset.camCustom = '1';
                img.src = customUrl;
            }
        }else if(img.dataset.camCustom === '1'){
            img.src = img.dataset.camOrig || '';
            delete img.dataset.camCustom;
            delete img.dataset.camOrig;
        }
    }
    function isManagementArea(img){
        return !!img.closest('#rm_print_characters_block, #character_edit_panel, #extension_settings, #avatar_upload_panel, #option_section, .mes_edit_area');
    }
    function collectEmbeddedAvatars(scope){
        var out = [];
        var all = scope.querySelectorAll('img.ls-avatar, img[style*="object-fit:cover"]');
        for(var i=0;i<all.length;i++){
            var img = all[i];
            if(isManagementArea(img)) continue;
            var style = img.getAttribute('style') || '';
            if(img.classList.contains('ls-avatar')){ out.push(img); continue; }
            if(/margin-left:\s*\d+px/.test(style)) continue;
            var h = /height:\s*(\d+)px/.exec(style);
            if(h && Number(h[1]) >= 30 && Number(h[1]) <= 64 && /border-radius/.test(style)) out.push(img);
        }
        return out;
    }
    function replaceEmbeddedAvatar(img, customUrl){
        if(customUrl){
            if(img.dataset.camCustom === '1'){
                img.src = customUrl;
            }else{
                img.dataset.camOrig = img.getAttribute('src') || '';
                img.dataset.camCustom = '1';
                img.src = customUrl;
            }
        }else if(img.dataset.camCustom === '1'){
            img.src = img.dataset.camOrig || '';
            delete img.dataset.camCustom;
            delete img.dataset.camOrig;
        }
    }
    function applyAvatarToChat(avatar, customUrl){
        var chat = document.getElementById('chat') || document;
        var std = chat.querySelectorAll('.mes .avatar img, .mes .mes_avatar, .mes img.avatar');
        var emb = collectEmbeddedAvatars(document);
        var replaced = 0;
        for(var i=0;i<std.length;i++){
            var img = std[i];
            var before = img.getAttribute('src') || '';
            replaceMessageAvatar(img, avatar, customUrl);
            if(img.getAttribute('src') !== before) replaced++;
        }
        for(var j=0;j<emb.length;j++){
            var em = emb[j];
            var before2 = em.getAttribute('src') || '';
            replaceEmbeddedAvatar(em, customUrl);
            if(em.getAttribute('src') !== before2) replaced++;
        }
        return replaced;
    }
    function syncForceAvatarToChatData(customUrl){
        var c = getContext();
        var chat = (c && c.chat) || [];
        if(!Array.isArray(chat) || !chat.length) return 0;
        var changed = 0;
        for(var i=0;i<chat.length;i++){
            var m = chat[i];
            if(!m || m.is_user) continue;
            if(customUrl){
                if(m.force_avatar !== customUrl){ m.force_avatar = customUrl; changed++; }
            }else{
                if(m.force_avatar){ delete m.force_avatar; changed++; }
            }
        }
        if(changed){
            try{
                if(arcMod.saveChatDebounced) arcMod.saveChatDebounced();
                else if(c.saveChat) c.saveChat();
            }catch(e){ console.warn('['+MODULE_NAME+'] 保存存档头像数据失败:', e); }
        }
        return changed;
    }
    function applyAvatarForCurrentChat(){
        var c = currentCharacter();
        if(!c || !c.avatar) return;
        var url = currentChatAvatarUrl();
        if(url){
            applyAvatarToChat(c.avatar, url);
            syncForceAvatarToChatData(url);
            setTimeout(function(){ applyAvatarToChat(c.avatar, url); }, 150);
        }
    }
    function scheduleApplyForChat(){
        if(applyScheduled) return;
        applyScheduled = true;
        requestAnimationFrame(function(){
            applyScheduled = false;
            applyAvatarForCurrentChat();
        });
    }
    function ensureChatObserver(){
        if(chatObserver) return;
        var target = document.body || document.getElementById('chat');
        if(!target) return;
        chatObserver = new MutationObserver(function(mutations){
            var hasNewMes = false;
            for(var i=0;i<mutations.length;i++){
                var m = mutations[i];
                if(m.type !== 'childList') continue;
                for(var j=0;j<m.addedNodes.length;j++){
                    var node = m.addedNodes[j];
                    if(node.nodeType !== 1) continue;
                    if((node.classList && node.classList.contains('mes'))
                        || (node.querySelector && (node.querySelector('.mes') || node.querySelector('img.ls-avatar')))){
                        hasNewMes = true; break;
                    }
                }
                if(hasNewMes) break;
            }
            if(hasNewMes) scheduleApplyForChat();
        });
        chatObserver.observe(target, { childList:true, subtree:true });
    }
    function onMessageRendered(arg){
        var id = (typeof arg === 'object' && arg !== null) ? arg.id : arg;
        if(id === undefined || id === null) return;
        var c = getContext();
        var chat = (c && c.chat) || [];
        var m = chat.find(function(x){ return String(x.id) === String(id); });
        if(m && m.is_user) return;
        var ch = currentCharacter();
        if(!ch || !ch.avatar) return;
        var url = currentChatAvatarUrl();
        if(!url) return;
        var el = document.querySelector('#chat .mes[mesid="'+id+'"]') || document.querySelector('.mes[mesid="'+id+'"]');
        if(!el) return;
        var img = el.querySelector('.avatar img, .mes_avatar, img.avatar');
        if(img) replaceMessageAvatar(img, ch.avatar, url);
        var embedded = collectEmbeddedAvatars(el);
        for(var i=0;i<embedded.length;i++) replaceEmbeddedAvatar(embedded[i], url);
    }

    /* ---------- 头像压缩与选择（仅用户主动操作时执行，不占常态开销） ---------- */
    var AVATAR_MAX_SIZE = 512;
    function getAvatarFileInput(){
        if(!avatarFileInput){
            avatarFileInput = document.createElement('input');
            avatarFileInput.type = 'file';
            avatarFileInput.accept = 'image/*';
            avatarFileInput.style.display = 'none';
            document.body.appendChild(avatarFileInput);
        }
        return avatarFileInput;
    }
    async function fileToCompressedDataUrl(file){
        var bmp = null;
        try{ bmp = await createImageBitmap(file); }catch(e){ bmp = null; }
        var w = 0, h = 0, source = null;
        if(bmp){
            w = bmp.width; h = bmp.height; source = bmp;
        }else{
            var url = URL.createObjectURL(file);
            try{
                source = await new Promise(function(resolve, reject){
                    var im = new Image();
                    im.onload = function(){ resolve(im); };
                    im.onerror = function(){ reject(new Error('无法读取图片')); };
                    im.src = url;
                });
                w = source.naturalWidth; h = source.naturalHeight;
            }finally{ URL.revokeObjectURL(url); }
        }
        try{
            if(!w || !h) throw new Error('无效图片');
            var scale = Math.min(1, AVATAR_MAX_SIZE / Math.max(w, h));
            var cw = Math.max(1, Math.round(w * scale));
            var chh = Math.max(1, Math.round(h * scale));
            var canvas = document.createElement('canvas');
            canvas.width = cw; canvas.height = chh;
            var ctx2d = canvas.getContext('2d');
            if(ctx2d){ ctx2d.imageSmoothingQuality = 'high'; ctx2d.drawImage(source, 0, 0, cw, chh); }
            var dataUrl = canvas.toDataURL('image/webp', 0.88);
            if(dataUrl.indexOf('data:image/webp') !== 0) dataUrl = canvas.toDataURL('image/png');
            return dataUrl;
        }finally{
            if(bmp) bmp.close();
        }
    }
    function openAvatarPicker(onDone){
        var input = getAvatarFileInput();
        input.value = '';
        input.onchange = async function(){
            var file = input.files && input.files[0];
            if(!file) return;
            try{
                var dataUrl = await fileToCompressedDataUrl(file);
                onDone(dataUrl);
            }catch(e){
                console.error('['+MODULE_NAME+'] 头像处理失败:', e);
                nicoShowToast('头像处理失败，请换一张图片重试');
            }
        };
        input.click();
    }
    function buildAvatarRow(chat, avatar){
        var row = document.createElement('div');
        row.className = 'nico-arc-avrow';

        var img = document.createElement('img');
        img.className = 'nico-arc-avimg';
        img.alt = '';
        var custom = getChatAvatar(avatar, chat.file_name);
        if(custom){
            img.src = custom;
            img.title = '该存档的专属头像';
        }else{
            img.src = defaultAvatarUrl(avatar);
            img.classList.add('nico-av-default');
            img.title = '角色默认头像（未设置专属头像）';
        }

        var changeBtn = document.createElement('button');
        changeBtn.type = 'button';
        changeBtn.className = 'nico-arc-avbtn';
        changeBtn.innerHTML = SVG_IMAGE + '<span>换头像</span>';
        changeBtn.title = '为该存档设置专属头像（本地保存，切换存档自动生效）';
        changeBtn.addEventListener('click', function(){
            openAvatarPicker(function(dataUrl){
                setChatAvatar(avatar, chat.file_name, dataUrl);
                img.src = dataUrl;
                img.classList.remove('nico-av-default');
                img.title = '该存档的专属头像';
                removeBtn.style.display = '';
                if(isCurrentChat(avatar, chat.file_name)){
                    applyAvatarToChat(avatar, dataUrl);
                    syncForceAvatarToChatData(dataUrl);
                }
            });
        });

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'nico-arc-avbtn';
        removeBtn.innerHTML = SVG_ERASER + '<span>移除</span>';
        removeBtn.title = '恢复为角色默认头像';
        removeBtn.style.display = custom ? '' : 'none';
        removeBtn.addEventListener('click', function(){
            removeChatAvatar(avatar, chat.file_name);
            img.src = defaultAvatarUrl(avatar);
            img.classList.add('nico-av-default');
            img.title = '角色默认头像（未设置专属头像）';
            removeBtn.style.display = 'none';
            if(isCurrentChat(avatar, chat.file_name)){
                applyAvatarToChat(avatar, null);
                syncForceAvatarToChatData(null);
            }
        });

        row.appendChild(img);
        row.appendChild(changeBtn);
        row.appendChild(removeBtn);
        return row;
    }

    /* ---------- 存档卡片 ---------- */
    function stripJsonl(name){ return String(name || '').replace(/\.jsonl$/i,''); }
    function buildChatRow(chat, avatar, currentChat){
        var row = document.createElement('div');
        row.className = 'nico-arc-chat';
        row.dataset.file = chat.file_name;
        if(currentChat && stripJsonl(chat.file_name) === currentChat) row.classList.add('nico-cur');

        var meta = document.createElement('div');
        meta.className = 'nico-arc-meta';

        var title = document.createElement('span');
        title.className = 'nico-arc-tt';
        var base = String(chat.file_name || '').replace(/\.jsonl$/i,'');
        title.textContent = formatTimestampName(base) || base || chat.file_name;
        title.title = chat.file_name;

        var sub = document.createElement('small');
        sub.className = 'nico-arc-sub';
        var msgs = Number.isFinite(Number(chat.chat_items)) ? Number(chat.chat_items) : 0;
        var subText = msgs + ' 条 · ' + (chat.file_size || '?');
        var dateStr = formatDateTime(chat.last_mes);
        if(dateStr) subText += ' · ' + dateStr;
        sub.textContent = subText;

        var curBadge = document.createElement('span');
        curBadge.className = 'nico-arc-curbadge';
        curBadge.textContent = '当前';

        var loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'nico-arc-load';
        loadBtn.textContent = '加载';
        loadBtn.title = '切换到该角色并打开这个存档';
        loadBtn.addEventListener('click', function(){ loadChat(avatar, chat.file_name); });

        meta.appendChild(title);
        meta.appendChild(sub);
        if(row.classList.contains('nico-cur')) meta.appendChild(curBadge);
        meta.appendChild(loadBtn);

        var preview = document.createElement('div');
        preview.className = 'nico-arc-pv';
        var mes = chat.mes && chat.mes !== '[The chat is empty]' ? chat.mes : '';
        preview.textContent = mes;
        preview.title = mes;

        var noteInput = document.createElement('input');
        noteInput.className = 'nico-arc-note';
        noteInput.type = 'text';
        noteInput.placeholder = '添加备注…';
        noteInput.maxLength = 200;
        noteInput.value = notes[noteKey(avatar, chat.file_name)] || '';
        noteInput.addEventListener('input', function(){
            ensureSettings();
            var v = noteInput.value.trim();
            if(v) notes[noteKey(avatar, chat.file_name)] = v;
            else delete notes[noteKey(avatar, chat.file_name)];
            saveSettings();
        });

        row.appendChild(buildAvatarRow(chat, avatar));
        row.appendChild(meta);
        row.appendChild(preview);
        row.appendChild(noteInput);
        return row;
    }

    /* ---------- 加载指定角色的指定存档（与酒馆原生聊天列表点击行为一致） ---------- */
    async function loadChat(avatar, fileName){
        var c = getContext();
        var chars = (c && c.characters) || [];
        var idx = -1;
        for(var i=0;i<chars.length;i++){ if(chars[i] && chars[i].avatar === avatar){ idx = i; break; } }
        if(idx === -1){
            console.warn('['+MODULE_NAME+'] 找不到角色:', avatar);
            nicoShowToast('找不到该角色');
            return;
        }
        try{
            await arcModReady.catch(function(){});
            var chatBase = stripJsonl(fileName); // 服务端会自动补 .jsonl，传带后缀的会拼成 .jsonl.jsonl
            if(arcMod.setActiveGroup){ try{ arcMod.setActiveGroup(null); }catch(e){} } // 退出群聊模式
            await c.selectCharacterById(idx);
            await c.openCharacterChat(chatBase);
            setTimeout(function(){ applyAvatarForCurrentChat(); }, 100);
            nicoShowToast('已加载存档');
        }catch(e){
            console.error('['+MODULE_NAME+'] 加载存档失败:', e);
            nicoShowToast('加载存档失败');
        }
    }

    /* ---------- 列表渲染（串行化，签名去重，避免并发重建互相打断） ---------- */
    function renderCharFolders(force){
        var run = renderChain.then(function(){ return renderCharFoldersImpl(force); });
        renderChain = run.catch(function(e){ console.warn('['+MODULE_NAME+'] 渲染失败:', e); });
        return run;
    }
    async function renderCharFoldersImpl(force){
        if(!listEl) return;
        var c = getContext();
        var list = (c && c.characters) || [];

        var sig = list.map(function(ch){ return ch && ch.avatar; }).filter(Boolean).join('');
        if(!force && countsLoaded && sig === lastSignature){
            updateStats();
            return;
        }
        lastSignature = sig;
        listEl.innerHTML = '';

        if(list.length === 0){
            var empty0 = document.createElement('div');
            empty0.className = 'nico-arc-empty';
            empty0.textContent = '未找到角色卡，请先导入角色';
            listEl.appendChild(empty0);
            updateStats();
            return;
        }

        var frag = document.createDocumentFragment();
        list.forEach(function(ch){
            if(!ch || !ch.avatar) return;
            var n = countsLoaded ? (counts[ch.avatar] !== undefined ? counts[ch.avatar] : 0) : -1;
            if(countsLoaded && n === 0) return; // 无存档的角色不展示
            frag.appendChild(buildCharFolder(ch, n));
        });
        listEl.appendChild(frag);
        updateStats();

        // 恢复展开的文件夹
        await Promise.all(list.map(async function(ch){
            if(!ch || !expanded.has(ch.avatar)) return;
            var folder = listEl.querySelector('.nico-arc-char[data-avatar="'+CSS.escape(ch.avatar)+'"]');
            if(!folder) return;
            folder.classList.add('nico-open');
            var body = folder.querySelector('.nico-arc-body');
            if(body) await renderChatList(ch.avatar, body);
        }));
        applyFilter();
    }
    function updateCurrentBadges(){
        if(!arcPage) return;
        var c = getContext();
        var current = c && c.chatId;
        var rows = arcPage.querySelectorAll('.nico-arc-chat');
        for(var i=0;i<rows.length;i++){
            var row = rows[i];
            var isCur = current && stripJsonl(row.dataset.file) === current;
            row.classList.toggle('nico-cur', !!isCur);
            var badge = row.querySelector('.nico-arc-curbadge');
            if(isCur && !badge){
                badge = document.createElement('span');
                badge.className = 'nico-arc-curbadge';
                badge.textContent = '当前';
                var meta = row.querySelector('.nico-arc-meta');
                var loadBtn = row.querySelector('.nico-arc-load');
                if(meta) meta.insertBefore(badge, loadBtn);
            }else if(!isCur && badge){
                badge.remove();
            }
        }
    }
    async function refreshAll(){
        cacheVersion++;
        Object.keys(chatsCache).forEach(function(k){ delete chatsCache[k]; });
        Object.keys(counts).forEach(function(k){ delete counts[k]; });
        countsLoaded = true;
        await countsPromise;
        await loadCounts();
    }

    /* ---------- 挂载 / 事件 / 初始化 ---------- */
    function mount(){
        arcPage = document.getElementById('nico-arc');
        if(!arcPage) return false;
        listEl = document.getElementById('nico-arc-list');
        statsEl = document.getElementById('nico-arc-stats');
        refreshBtn = document.getElementById('nico-arc-refresh');
        filterEl = document.getElementById('nico-arc-filter-in');
        if(refreshBtn && !refreshBtn.dataset.arcBound){
            refreshBtn.dataset.arcBound = '1';
            refreshBtn.addEventListener('click', async function(){
                if(refreshBtn.classList.contains('spin')) return;
                refreshBtn.classList.add('spin');
                try{ await refreshAll(); }
                finally{ refreshBtn.classList.remove('spin'); }
            });
        }
        if(filterEl && !filterEl.dataset.arcBound){
            filterEl.dataset.arcBound = '1';
            filterEl.addEventListener('input', applyFilter);
        }
        return true;
    }
    function onEvent(type, fn){
        var c = getContext();
        if(!c || !c.eventSource) return;
        var et = c.eventTypes || c.event_types || {};
        var name = et[type];
        if(!name) return;
        try{ c.eventSource.on(name, fn); boundEvents.push({ name:name, fn:fn }); }catch(e){}
    }
    function onPageShow(){
        if(!arcPage) return;
        ensureSettings();
        if(!countsStarted){
            countsStarted = true;
            loadCounts();
        }else{
            renderCharFolders();
        }
    }
    function destroy(){
        var c = getContext();
        if(c && c.eventSource){
            boundEvents.forEach(function(b){
                try{ c.eventSource.removeListener(b.name, b.fn); }
                catch(e){ try{ c.eventSource.off(b.name, b.fn); }catch(_){} }
            });
        }
        boundEvents = [];
        timers.forEach(function(id){ clearTimeout(id); });
        timers = [];
        try{ if(chatObserver) chatObserver.disconnect(); }catch(e){}
        chatObserver = null;
        try{ if(avatarFileInput && avatarFileInput.parentNode) avatarFileInput.parentNode.removeChild(avatarFileInput); }catch(e){}
        avatarFileInput = null;
    }
    var initRetries = 0;
    function init(){
        var prev = window.__nicoArchiveMod;
        if(prev && prev !== mod && typeof prev.destroy === 'function'){ try{ prev.destroy(); }catch(e){} }
        var ready = false;
        try{ ready = mount() && !!ensureSettings(); }catch(e){ ready = false; }
        if(!ready){
            if(initRetries < 20){ initRetries++; arcTimeout(function(){ init(); }, 500); return; }
            console.warn('['+MODULE_NAME+'] 初始化条件未就绪，已停止重试（不影响面板其他功能）');
            return;
        }

        onEvent('CHARACTER_PAGE_LOADED', function(){
            var c = getContext();
            var avatarSet = new Set(((c && c.characters) || []).map(function(ch){ return ch && ch.avatar; }).filter(Boolean));
            Object.keys(chatsCache).forEach(function(k){ if(!avatarSet.has(k)) delete chatsCache[k]; });
            Object.keys(counts).forEach(function(k){ if(!avatarSet.has(k)) delete counts[k]; });
            expanded.forEach(function(k){ if(!avatarSet.has(k)) expanded.delete(k); });
            if(countsStarted){ countsLoaded = true; loadCounts(); }
        });
        onEvent('CHAT_CHANGED', function(){ updateCurrentBadges(); applyAvatarForCurrentChat(); });
        onEvent('CHARACTER_MESSAGE_RENDERED', onMessageRendered);
        onEvent('MESSAGE_UPDATED', onMessageRendered);
        onEvent('CHAT_LOADED', function(){ applyAvatarForCurrentChat(); });

        applyAvatarForCurrentChat();
        // 酒馆自动恢复上次聊天可能早于本模块激活，延迟补几次（一次性、非轮询）
        [300, 1000, 2500, 5000].forEach(function(ms){ arcTimeout(function(){ applyAvatarForCurrentChat(); }, ms); });
        ensureChatObserver();
        window.__nicoArchiveMod = mod;
        try{ console.log('[nico-arc] 聊天存档管理器已并入第二页 v'+MODULE_VERSION); }catch(e){}
    }

    var mod = { init:init, destroy:destroy, onPageShow:onPageShow };
    return mod;
})();

/* ===== 7.1 第二页切换（主页 / 聊天存档） ===== */
var nicoTabEls = panel.querySelectorAll('.nico-tab');
var nicoHomeEl = panel.querySelector('.nico-p-in');
var nicoArcEl = panel.querySelector('.nico-arc');
function nicoSwitchPage(p){
    for(var i=0;i<nicoTabEls.length;i++){
        nicoTabEls[i].classList.toggle('on', nicoTabEls[i].dataset.page === p);
    }
    if(p === 'arc'){
        nicoHomeEl.style.display = 'none';
        nicoArcEl.classList.add('show');
        try{ nicoArchive.onPageShow(); }catch(e){ console.warn('[nico-arc] 打开存档页失败', e); }
    }else{
        nicoArcEl.classList.remove('show');
        nicoHomeEl.style.display = '';
    }
}
for(var nti=0; nti<nicoTabEls.length; nti++){
    (function(el){ el.addEventListener('click', function(){ nicoSwitchPage(el.dataset.page); }); })(nicoTabEls[nti]);
}
try{ nicoArchive.init(); }catch(e){ console.warn('[nico-arc] 初始化失败（不影响音乐/主页）', e); }

})();

// git-stats 리포트 CSS. render.mjs·serve.mjs가 사용.

export const STYLE = `<style>
:root{--bg:#0b0f17;--bg-2:#121826;--bg-3:#1a2332;--border:#243044;--text:#e6edf7;--dim:#95a3bd;--dim-2:#5d6b85;--accent:#7c3aed;--accent-2:#06b6d4;--hot:#f59e0b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,"Segoe UI","Pretendard","Apple SD Gothic Neo",sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
.container{max-width:1280px;margin:0 auto;padding:40px 32px}
header{padding:0 0 32px;border-bottom:1px solid var(--border);margin-bottom:40px}
header h1{margin:0 0 12px;font-size:34px;font-weight:700;background:linear-gradient(135deg,#fff,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
header .meta{color:var(--dim);font-size:13px;font-family:"SF Mono",Menlo,monospace}
header .meta strong{color:var(--text)}
.btn{background:var(--accent);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:0.15s}
.btn:hover{background:#8b4ff0}
.btn.ghost{background:var(--bg-3);color:var(--dim);border:1px solid var(--border)}
.btn.ghost:hover{color:var(--text);border-color:var(--accent)}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:48px}
.stat{background:var(--bg-2);border:1px solid var(--border);padding:24px;border-radius:14px;position:relative;overflow:hidden}
.stat::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--accent-2)}
.stat.warn::before{background:var(--hot)}
.stat .label{color:var(--dim);font-size:13px;font-weight:500;margin-bottom:8px}
.stat .value{font-size:36px;font-weight:700;color:var(--text);line-height:1;letter-spacing:-0.02em}
.stat .desc{color:var(--dim-2);font-size:11px;margin-top:8px}
section{margin-bottom:48px}
section h2{font-size:20px;margin:0 0 8px;font-weight:600;display:flex;align-items:center;gap:12px}
section .h2-hint{color:var(--dim);font-size:13px;font-weight:400;margin-bottom:20px}
.section-card{background:var(--bg-2);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.row{display:grid;grid-template-columns:48px 1fr auto;gap:20px;padding:16px 24px;align-items:center;border-bottom:1px solid var(--border)}
.row:last-child{border-bottom:none}
.row:hover{background:var(--bg-3)}
.rank{color:var(--dim-2);font-size:14px;font-weight:600;text-align:center;font-family:"SF Mono",Menlo,monospace}
.row-main{min-width:0}
.row-title{font-size:14px;margin-bottom:10px;line-height:1.5;word-break:break-all}
.row-title.path{font-family:"SF Mono",Menlo,monospace;font-size:13px}
.path-dir{color:var(--dim-2)}
.path-name{color:var(--text);font-weight:600}
.row-bar{background:var(--bg-3);height:6px;border-radius:999px;overflow:hidden}
.row-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),#a78bfa);transition:width 0.3s}
.row-fill.hot{background:linear-gradient(90deg,var(--hot),#fbbf24)}
.row-value{font-size:24px;font-weight:700;color:var(--accent-2);white-space:nowrap;text-align:right;line-height:1}
.row-value .row-unit{font-size:12px;color:var(--dim);margin-left:6px;font-weight:400}
.heat-wrap{padding:24px}
.heatmap{display:grid;grid-template-columns:40px repeat(24,1fr);gap:3px}
.heat-day-label{color:var(--dim);font-size:13px;font-weight:600;display:flex;align-items:center;padding-right:8px}
.heat-cell{aspect-ratio:1;min-width:22px;background:var(--bg-3);border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center;transition:transform 0.1s;cursor:pointer}
.heat-cell:hover{transform:scale(1.3);z-index:1;outline:1px solid var(--accent)}
.heat-cell.selected{outline:2px solid #fff;outline-offset:1px;z-index:2}
.heat-num{color:#fff;font-size:10px;font-weight:600;font-family:"SF Mono",Menlo,monospace}
.heat-hour-row{display:grid;grid-template-columns:40px repeat(24,1fr);gap:3px;margin-top:8px}
.heat-hour-label{color:var(--dim-2);font-size:10px;text-align:center;font-family:"SF Mono",Menlo,monospace}
.heat-legend{display:flex;align-items:center;gap:8px;margin-top:16px;color:var(--dim);font-size:12px;justify-content:flex-end}
.heat-legend-cell{width:14px;height:14px;border-radius:2px}
.heat-detail{margin-top:20px;background:var(--bg);border:1px solid var(--accent);border-radius:10px;padding:0;overflow:hidden;animation:slideDown 0.2s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.heat-detail-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--bg-2);border-bottom:1px solid var(--border)}
.heat-detail-title{font-size:14px;color:var(--text);font-weight:600}
.heat-detail-title strong{color:var(--accent-2)}
.heat-detail-close{background:transparent;border:none;color:var(--dim);font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1}
.heat-detail-close:hover{color:var(--text);background:var(--bg-3)}
.heat-detail-body{max-height:400px;overflow-y:auto}
.commit-item{display:grid;grid-template-columns:80px 1fr auto;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border);align-items:center}
.commit-item:last-child{border-bottom:none}
.commit-item:hover{background:var(--bg-3)}
.commit-hash{font-family:"SF Mono",Menlo,monospace;color:var(--accent-2);font-size:12px}
.commit-main{min-width:0}
.commit-subject{font-size:13px;color:var(--text);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.commit-author{font-size:11px;color:var(--dim);font-family:"SF Mono",Menlo,monospace}
.commit-time{font-size:11px;color:var(--dim);text-align:right;white-space:nowrap;font-family:"SF Mono",Menlo,monospace}
footer{text-align:center;color:var(--dim);font-size:12px;padding:32px 0;border-top:1px solid var(--border);margin-top:48px}
.loading{text-align:center;color:var(--dim);padding:40px;font-size:14px}
.spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(124,58,237,0.3);border-top-color:var(--accent);border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:-3px;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
.contrib-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding:20px}
.contrib-card{background:var(--bg-3);border:1px solid var(--border);border-radius:12px;padding:20px;position:relative;transition:transform 0.15s,border-color 0.15s;min-width:0;overflow:hidden}
.contrib-card:hover{transform:translateY(-2px);border-color:var(--accent)}
.contrib-rank{position:absolute;top:14px;right:18px;color:var(--dim-2);font-size:13px;font-weight:700;font-family:"SF Mono",Menlo,monospace}
.contrib-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0}
.contrib-id{min-width:0;flex:1}
.contrib-name{font-size:15px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.contrib-email{color:var(--dim);font-size:11px;font-family:"SF Mono",Menlo,monospace;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.contrib-big{display:flex;align-items:baseline;gap:8px;margin-bottom:10px}
.big-num{font-size:32px;font-weight:700;color:var(--accent-2);line-height:1;letter-spacing:-0.02em}
.big-lbl{color:var(--dim);font-size:13px}
.contrib-bar{background:var(--bg-2);height:5px;border-radius:999px;overflow:hidden;margin-bottom:8px}
.contrib-fill{height:100%;background:linear-gradient(90deg,var(--accent),#a78bfa);border-radius:999px}
.contrib-stats-row{display:flex;gap:12px;font-size:12px;font-family:"SF Mono",Menlo,monospace;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid var(--border)}
.contrib-stats-row .add{color:#22c55e}
.contrib-stats-row .del{color:#ef4444}
.contrib-meta{display:flex;flex-direction:column;gap:8px}
.meta-item{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;min-width:0}
.meta-item.col{flex-direction:column;align-items:flex-start;gap:4px}
.meta-lbl{color:var(--dim);font-size:11px;flex-shrink:0}
.meta-val{color:var(--text);font-size:12px;text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis}
.meta-val.path{text-align:left;width:100%;font-family:"SF Mono",Menlo,monospace;font-size:11px;line-height:1.4;word-break:break-all;white-space:normal}
.meta-val .path-cnt{color:var(--accent-2);font-weight:600;margin-left:4px}
.mini-heat-wrap{margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}
.mini-heat-lbl{color:var(--dim);font-size:11px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:baseline}
.mini-heat-sub{color:var(--dim-2);font-size:10px;font-family:"SF Mono",Menlo,monospace}
.mini-heat{display:grid;grid-template-columns:repeat(24,1fr);grid-template-rows:repeat(7,1fr);gap:1px;aspect-ratio:24/7}
.mini-cell{border-radius:1px;background:var(--bg-2);min-height:6px;cursor:pointer;transition:transform 0.1s}
.mini-cell:hover{outline:1px solid var(--accent);position:relative;z-index:1}
.mini-cell.selected{outline:2px solid #fff;z-index:2}
.contrib-detail-mount{margin-top:12px}
.contrib-detail{background:var(--bg);border:1px solid var(--accent);border-radius:8px;overflow:hidden;animation:slideDown 0.2s ease}
.contrib-detail .heat-detail-head{padding:10px 14px;font-size:12px}
.contrib-detail .heat-detail-title{font-size:12px}
.contrib-detail .heat-detail-body{max-height:280px}
.contrib-detail .commit-item{grid-template-columns:64px 1fr auto;padding:8px 14px;gap:8px}
.contrib-detail .commit-hash{font-size:11px}
.contrib-detail .commit-subject{font-size:12px}
.contrib-detail .commit-author{font-size:10px}
.contrib-detail .commit-time{font-size:10px}
.filter-bar{background:var(--bg-2);border:1px solid var(--border);border-radius:14px;padding:20px 24px;margin-bottom:32px;display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between}
.filter-section{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.filter-section .lbl{color:var(--dim);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-right:4px}
.filter-bar input[type=date]{background:var(--bg-3);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:inherit;font-size:13px;color-scheme:dark}
.filter-bar input[type=date]:focus{outline:2px solid var(--accent);border-color:var(--accent)}
.filter-bar .preset{background:var(--bg-3);border:1px solid var(--border);color:var(--dim);padding:7px 14px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer;transition:0.15s}
.filter-bar .preset:hover{color:var(--text);border-color:var(--accent)}
.filter-bar .preset.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.filter-bar .filter-count{color:var(--accent-2);font-weight:700;font-size:15px;font-family:"SF Mono",Menlo,monospace}
.filter-bar .filter-count .lbl{margin:0 0 0 4px;font-weight:400}
.filter-bar .sep{color:var(--dim-2);font-size:13px}
.sort-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.sort-lbl{color:var(--dim);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-right:4px}
.sort-chip{background:var(--bg-2);border:1px solid var(--border);color:var(--dim);padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;transition:0.15s}
.sort-chip:hover{color:var(--text);border-color:var(--accent)}
.sort-chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.empty{padding:24px;color:var(--dim-2);font-size:13px;text-align:center}
/* 리스트 5개 + 더보기: collapsed면 6번째부터 숨김 */
.section-card.collapsed .row:nth-child(n+6){display:none}
/* 탭 */
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:32px;flex-wrap:wrap}
.tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:var(--dim);padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;transition:0.15s;margin-bottom:-1px}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:var(--text);border-bottom-color:var(--accent)}
.tab-panel{display:none;animation:fadeIn 0.2s ease}
.tab-panel.active{display:block}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
/* 커밋 목록 */
.commit-search-bar{margin-bottom:16px}
#commit-search{width:100%;background:var(--bg-2);border:1px solid var(--border);color:var(--text);padding:11px 14px;border-radius:10px;font-size:13px;font-family:inherit}
#commit-search:focus{outline:2px solid var(--accent);border-color:var(--accent)}
.commit-row{display:grid;grid-template-columns:74px 1fr auto auto;gap:14px;padding:11px 18px;border-bottom:1px solid var(--border);align-items:center}
.commit-row:last-child{border-bottom:none}
.commit-row:hover{background:var(--bg-3)}
.commit-row .commit-hash{font-family:"SF Mono",Menlo,monospace;color:var(--accent-2);font-size:12px}
.commit-row .c-main{min-width:0}
.commit-row .c-subject{font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.commit-row .c-author{font-size:11px;color:var(--dim);font-family:"SF Mono",Menlo,monospace;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.commit-row .c-lines{font-size:11px;font-family:"SF Mono",Menlo,monospace;white-space:nowrap}
.commit-row .c-lines .add{color:#22c55e}.commit-row .c-lines .del{color:#ef4444;margin-left:6px}
.commit-row .c-time{font-size:11px;color:var(--dim);font-family:"SF Mono",Menlo,monospace;white-space:nowrap;text-align:right}
/* 결합도 탐색 탭 */
.cpl-search-bar{margin-bottom:16px}
#cpl-search{width:100%;background:var(--bg-2);border:1px solid var(--border);color:var(--text);padding:11px 14px;border-radius:10px;font-size:13px;font-family:inherit}
#cpl-search:focus{outline:2px solid var(--accent);border-color:var(--accent)}
.cpl-layout{display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start}
.cpl-tree-card{max-height:560px;overflow:auto;padding:8px 0}
.cpl-partners-card{min-height:200px}
.ftree{font-size:13px;font-family:"SF Mono",Menlo,monospace}
.ftree-row,.ftree-file{display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:pointer;border-radius:6px;white-space:nowrap}
.ftree-row:hover,.ftree-file:hover{background:var(--bg-3)}
.ftree-file.active{background:rgba(124,58,237,0.18);outline:1px solid var(--accent)}
.ftree-caret{display:inline-block;width:10px;color:var(--dim-2);transition:transform 0.1s;flex-shrink:0}
.ftree-folder.collapsed>.ftree-children{display:none}
.ftree-folder.collapsed>.ftree-row .ftree-caret{transform:none}
.ftree-folder:not(.collapsed)>.ftree-row .ftree-caret{transform:rotate(90deg)}
.ftree-ico{flex-shrink:0}
.ftree-name{overflow:hidden;text-overflow:ellipsis;color:var(--text)}
.ftree-file .ftree-name{color:var(--dim)}
.ftree-hot{margin-left:auto;color:var(--dim-2);font-size:11px;padding-left:8px;flex-shrink:0}
.ftree-file.hidden,.ftree-folder.hidden{display:none}
.partners-head{padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;color:var(--text);font-family:"SF Mono",Menlo,monospace}
.partners-head .path-dir{color:var(--dim-2)}
.cpl-partners-card .row{cursor:pointer}
@media (max-width:768px){.cpl-layout{grid-template-columns:1fr}.cpl-tree-card{max-height:320px}}
.dim{color:var(--dim-2)}
.dual-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.dual-grid section{margin-bottom:0}
/* 활동 추이 막대 */
.act-chart{display:flex;align-items:flex-end;gap:3px;height:160px;overflow-x:auto;padding-bottom:4px}
.act-col{flex:1;min-width:14px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.act-bar{width:70%;min-height:2px;background:linear-gradient(180deg,var(--accent),#a78bfa);border-radius:3px 3px 0 0;transition:0.2s}
.act-col:hover .act-bar{background:var(--accent-2)}
.act-x{color:var(--dim-2);font-size:9px;margin-top:6px;font-family:"SF Mono",Menlo,monospace;writing-mode:vertical-rl;white-space:nowrap}
/* 타임라인 간트 */
.tl{display:flex;flex-direction:column;gap:6px}
.tl-row{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center}
.tl-name{font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-track{position:relative;height:14px;background:var(--bg-3);border-radius:7px}
.tl-bar{position:absolute;top:0;height:100%;border-radius:7px;min-width:4px;opacity:0.85}
/* 소유/고아 메타 + 태그 */
.own-meta{font-size:11px;color:var(--dim);font-family:"SF Mono",Menlo,monospace}
.tag{font-size:10px;padding:2px 7px;border-radius:5px;font-weight:700;margin-left:6px}
.tag.risk{background:rgba(245,158,11,0.18);color:var(--hot)}
.tag.dead{background:rgba(239,68,68,0.15);color:#fca5a5}
.tag.remote{background:rgba(6,182,212,0.15);color:var(--accent-2)}
.tag.merged{background:rgba(34,197,94,0.15);color:#22c55e}
.tag.unmerged{background:rgba(245,158,11,0.15);color:var(--hot)}
.tag.cur{background:rgba(124,58,237,0.2);color:#a78bfa}
/* 브랜치 탭: 로컬/원격 하위탭 + 선택 삭제 */
.br-subtabs{display:flex;gap:6px;margin-bottom:14px}
.br-subtab{background:var(--bg-2);border:1px solid var(--border);color:var(--dim);padding:8px 16px;border-radius:9px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:0.15s;display:flex;align-items:center;gap:8px}
.br-subtab:hover{color:var(--text);border-color:var(--accent)}
.br-subtab.active{background:var(--bg-3);color:var(--text);border-color:var(--accent)}
.br-subtab-n{background:var(--bg);color:var(--dim);font-size:11px;padding:1px 7px;border-radius:999px;font-weight:700}
.br-subtab.active .br-subtab-n{background:var(--accent);color:#fff}
.br-list{display:none}
.br-list.active{display:block;background:var(--bg-2);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.br-bulk{display:flex;align-items:center;gap:18px;padding:12px 24px;border-bottom:1px solid var(--border);background:var(--bg-3);font-size:13px}
.br-bulk label{display:flex;align-items:center;gap:7px;color:var(--dim);cursor:pointer}
.br-bulk label:hover{color:var(--text)}
.br-bulk input{cursor:pointer;width:15px;height:15px;accent-color:var(--accent)}
.br-bulk-count{margin-left:auto;color:var(--accent-2);font-weight:600;font-size:12px}
.br-row{grid-template-columns:36px 1fr auto;cursor:pointer}
.br-row.is-current{cursor:default;opacity:0.85}
.br-check-wrap{display:flex;align-items:center;justify-content:center}
.br-check{width:17px;height:17px;cursor:pointer;accent-color:var(--accent)}
.br-check-cur{color:var(--accent);font-size:12px}
.br-cmd-panel{margin-top:18px;background:var(--bg-2);border:1px solid var(--accent);border-radius:14px;overflow:hidden}
.br-cmd-head{display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border)}
.br-cmd-title{font-size:14px;font-weight:600;color:var(--text)}
.br-cmd-n{color:var(--accent-2);font-weight:700;margin-left:4px}
.br-cmd-copy{margin-left:auto;padding:7px 14px;font-size:13px}
.br-cmd-pre{margin:0;padding:18px 20px;overflow-x:auto;background:var(--bg)}
.br-cmd-code{font-family:"SF Mono",Menlo,monospace;font-size:13px;color:#a7f3d0;white-space:pre;line-height:1.7}
.br-cmd-warn{padding:12px 20px;background:rgba(245,158,11,0.08);border-top:1px solid var(--border);font-size:12px;color:var(--dim);line-height:1.6}
.br-cmd-warn strong{color:var(--hot)}
.thresh-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.thresh-bar .lbl{color:var(--dim);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-right:4px}
.thresh-chip{background:var(--bg-2);border:1px solid var(--border);color:var(--dim);padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;transition:0.15s}
.thresh-chip:hover{color:var(--text);border-color:var(--accent)}
.thresh-chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.couple-amp{color:var(--accent-2);font-weight:700;margin:0 4px}
.row-fill{background:linear-gradient(90deg,var(--accent),#a78bfa)}
.row-fill.strong{background:linear-gradient(90deg,var(--hot),#fbbf24)}
/* 결합 네트워크 그래프 */
.graph-toolbar{margin-bottom:8px}
.graph-wrap{width:100%;height:440px;background:var(--bg);border:1px solid var(--border);border-radius:10px;overflow:hidden;position:relative}
.graph-wrap svg{width:100%;height:100%;display:block;cursor:grab}
.graph-wrap svg:active{cursor:grabbing}
.g-edge{stroke:var(--dim-2);stroke-opacity:0.35}
.g-edge.strong{stroke:var(--hot);stroke-opacity:0.7}
.g-node{fill:var(--accent);cursor:pointer;transition:fill 0.1s}
.g-node:hover{fill:var(--accent-2)}
.g-node.god{fill:var(--hot)}
.g-label{fill:var(--dim);font-size:10px;font-family:"SF Mono",Menlo,monospace;pointer-events:none}
.g-empty{display:flex;align-items:center;justify-content:center;height:100%;color:var(--dim-2);font-size:13px;text-align:center;padding:0 20px}
/* 분포 막대 (크기/언어) */
.dist-row{display:grid;grid-template-columns:90px 1fr 56px;gap:12px;align-items:center;padding:6px 0}
.dist-label{font-size:12px;color:var(--dim);font-family:"SF Mono",Menlo,monospace;text-align:right}
.dist-track{background:var(--bg-3);height:14px;border-radius:7px;overflow:hidden}
.dist-fill{height:100%;background:linear-gradient(90deg,var(--accent-2),#22d3ee);border-radius:7px}
.dist-val{font-size:12px;color:var(--text);font-family:"SF Mono",Menlo,monospace;text-align:right}
/* 컨벤션 도넛 */
.conv-rate{display:flex;align-items:center;gap:20px;margin-bottom:18px}
.conv-ring{width:88px;height:88px;border-radius:50%;background:conic-gradient(var(--accent) calc(var(--pct)*1%),var(--bg-3) 0);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.conv-ring::before{content:'';position:absolute;width:64px;height:64px;border-radius:50%;background:var(--bg-2)}
.conv-ring span{position:relative;font-size:18px;font-weight:700;color:var(--text)}
.conv-big{font-size:22px;font-weight:700;color:var(--accent-2)}
.conv-types{display:flex;flex-wrap:wrap;gap:8px}
.conv-chip{background:var(--bg-3);border:1px solid var(--border);border-radius:7px;padding:5px 10px;font-size:12px;color:var(--dim);font-family:"SF Mono",Menlo,monospace}
.conv-chip b{color:var(--text)}
@media (max-width:768px){
  .dual-grid{grid-template-columns:1fr}
  .tl-row{grid-template-columns:90px 1fr}
  .dist-row{grid-template-columns:64px 1fr 44px}
  .container{padding:20px 16px}
  .row{grid-template-columns:32px 1fr auto;gap:12px;padding:14px 16px}
  .row-value{font-size:18px}
  header h1{font-size:24px}
  .stat .value{font-size:28px}
  .heat-cell{min-width:14px}
  .heat-day-label{font-size:11px}
  .contrib-grid{grid-template-columns:1fr;padding:12px}
}
</style>`;

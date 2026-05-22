// git-stats 브라우저 클라이언트 런타임 (필터·정렬·드릴다운·탭·결합도 탐색·force 그래프).
// clientRuntime은 .toString()으로 직렬화돼 페이지에 인라인된다 → 외부 심볼 참조 절대 금지(자기완결).

export const CLIENT_SCRIPT = `<script>
${clientRuntime.toString()}
clientRuntime();
</script>`;

// 클라이언트 런타임. embedded 모드는 임베드된 커밋으로 재집계,
// server 모드는 /api/report·/api/commits-at 호출. 함수로 감싸 toString()으로 직렬화.
function clientRuntime() {
  const cfg = JSON.parse(document.getElementById('report-config').textContent);
  const MODE = cfg.mode;
  const REPO = cfg.repo;
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
  const CONTRIB_PAGE = 50;
  function kstParts(iso){const t=new Date(iso).getTime()+KST_OFFSET_MS;const k=new Date(t);return{day:k.getUTCDay(),hour:k.getUTCHours()};}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fmt(n){return n.toLocaleString('ko-KR');}
  function splitPath(p){const i=p.lastIndexOf('/');if(i===-1)return{dir:'',name:p};return{dir:p.slice(0,i+1),name:p.slice(i+1)};}
  function timeAgo(iso){if(!iso)return'—';const d=(Date.now()-new Date(iso).getTime())/1000;if(d<60)return'방금';if(d<3600)return Math.floor(d/60)+'분 전';if(d<86400)return Math.floor(d/3600)+'시간 전';if(d<86400*30)return Math.floor(d/86400)+'일 전';if(d<86400*365)return Math.floor(d/86400/30)+'개월 전';return Math.floor(d/86400/365)+'년 전';}
  function fmtDate(iso){if(!iso)return'—';const d=new Date(iso);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function initials(name){if(!name)return'?';const p=name.trim().split(/\\s+/);if(p.length===1)return p[0].slice(0,2).toUpperCase();return(p[0][0]+p[p.length-1][0]).toUpperCase();}
  function avatarColor(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return'hsl('+(h%360)+',55%,45%)';}

  // ── embedded 모드용 집계 (클라 재집계) ──
  function byContributor(commits){
    const m=new Map();
    for(const c of commits){
      const key=(c.email||c.author||'').toLowerCase();
      const cur=m.get(key)??{email:c.email||'',author:c.author||'',commits:0,additions:0,deletions:0,lastCommit:c.date,firstCommit:c.date,fileCounts:new Map(),heatmap:Array.from({length:7},()=>Array(24).fill(0))};
      cur.commits+=1;cur.additions+=c.additions??0;cur.deletions+=c.deletions??0;
      if(new Date(c.date)>new Date(cur.lastCommit))cur.lastCommit=c.date;
      if(new Date(c.date)<new Date(cur.firstCommit))cur.firstCommit=c.date;
      const{day,hour}=kstParts(c.date);cur.heatmap[day][hour]+=1;
      for(const f of c.filesChanged)cur.fileCounts.set(f,(cur.fileCounts.get(f)??0)+1);
      m.set(key,cur);
    }
    return[...m.values()].map(c=>{let tf='',tc=0,ft=0;for(const[f,n]of c.fileCounts){if(n>tc){tf=f;tc=n;}ft+=n;}return{email:c.email,author:c.author,commits:c.commits,additions:c.additions,deletions:c.deletions,lastCommit:c.lastCommit,firstCommit:c.firstCommit,topFile:tf,topFileCount:tc,filesTouched:ft,heatmap:c.heatmap};});
  }
  function sortContribs(contribs,key){const fns={commits:(a,b)=>b.commits-a.commits,lines:(a,b)=>(b.additions+b.deletions)-(a.additions+a.deletions),files:(a,b)=>b.filesTouched-a.filesTouched,recent:(a,b)=>new Date(b.lastCommit)-new Date(a.lastCommit)};return[...contribs].sort(fns[key]||fns.commits);}
  function hotspots(commits,top){const m=new Map();for(const c of commits)for(const f of c.filesChanged)m.set(f,(m.get(f)??0)+1);return[...m.entries()].map(([file,touches])=>({file,touches})).sort((a,b)=>b.touches-a.touches).slice(0,top||20);}
  function busFactor(commits,th){th=th||0.5;const m=new Map();for(const c of commits){const k=(c.email||c.author||'').toLowerCase();m.set(k,(m.get(k)??0)+c.filesChanged.length);}const t=[...m.values()].reduce((a,b)=>a+b,0);if(t===0)return 0;const s=[...m.values()].sort((a,b)=>b-a);let a=0;for(let i=0;i<s.length;i++){a+=s[i];if(a/t>=th)return i+1;}return s.length;}
  function heatmap(commits){const g=Array.from({length:7},()=>Array(24).fill(0));for(const c of commits){const{day,hour}=kstParts(c.date);g[day][hour]+=1;}return g;}

  function statsHtml(total,cc,bus,add,del){return '<div class="stat"><div class="label">총 커밋</div><div class="value">'+fmt(total)+'</div><div class="desc">필터 적용 후</div></div><div class="stat"><div class="label">기여자</div><div class="value">'+fmt(cc)+'</div><div class="desc">고유 이메일 수</div></div><div class="stat'+(bus===1?' warn':'')+'"><div class="label">Bus Factor</div><div class="value">'+bus+'</div><div class="desc">'+(bus===1?'⚠ 1명에게 집중됨':bus+'명이 50%+ 점유')+'</div></div><div class="stat"><div class="label">변경량</div><div class="value" style="color:#22c55e">+'+fmt(add)+'</div><div class="desc"><span style="color:#ef4444">-'+fmt(del)+'</span> 삭제</div></div>';}
  function contribCardHtml(c,i,maxC){
    const seed=c.email||c.author||String(i);const top=c.topFile?splitPath(c.topFile):null;const pct=(c.commits/maxC)*100;
    const myMax=Math.max(1,...c.heatmap.flat());const mc=[];
    for(let d=0;d<7;d++)for(let h=0;h<24;h++){const v=c.heatmap[d][h];const it=v===0?0:0.2+(v/myMax)*0.8;mc.push('<div class="mini-cell" data-day="'+d+'" data-hour="'+h+'" style="background:'+(v===0?'var(--bg-2)':'rgba(124,58,237,'+it+')')+'" title="'+DAY_LABELS[d]+'요일 '+h+'시 · '+v+'건"></div>');}
    const emailKey=(c.email||c.author||'').toLowerCase();
    return '<div class="contrib-card" data-email="'+esc(emailKey)+'"><div class="contrib-rank">#'+(i+1)+'</div><div class="contrib-head"><div class="avatar" style="background:'+avatarColor(seed)+'">'+esc(initials(c.author))+'</div><div class="contrib-id"><div class="contrib-name">'+esc(c.author||'(이름 없음)')+'</div><div class="contrib-email" title="'+esc(c.email)+'">'+esc(c.email||'(이메일 없음)')+'</div></div></div><div class="contrib-big"><div class="big-num">'+fmt(c.commits)+'</div><div class="big-lbl">commits</div></div><div class="contrib-bar"><div class="contrib-fill" style="width:'+pct+'%"></div></div><div class="contrib-stats-row"><span class="add">+'+fmt(c.additions)+'</span><span class="del">−'+fmt(c.deletions)+'</span></div><div class="contrib-meta"><div class="meta-item"><span class="meta-lbl">최근 커밋</span><span class="meta-val" title="'+fmtDate(c.lastCommit)+'">'+timeAgo(c.lastCommit)+'</span></div><div class="meta-item"><span class="meta-lbl">첫 커밋</span><span class="meta-val" title="'+fmtDate(c.firstCommit)+'">'+fmtDate(c.firstCommit)+'</span></div><div class="meta-item col"><span class="meta-lbl">주력 파일</span>'+(top?'<span class="meta-val path" title="'+esc(c.topFile)+'"><span class="path-dir">'+esc(top.dir)+'</span><span class="path-name">'+esc(top.name)+'</span> <span class="path-cnt">×'+c.topFileCount+'</span></span>':'<span class="meta-val">—</span>')+'</div></div><div class="mini-heat-wrap"><div class="mini-heat-lbl">활동 패턴 <span class="mini-heat-sub">셀 클릭 · 요일 × 시간 (KST)</span></div><div class="mini-heat">'+mc.join('')+'</div><div class="contrib-detail-mount"></div></div></div>';
  }
  function hotspotsHtml(hot){const maxH=Math.max(1,...hot.map(h=>h.touches));return hot.map((h,i)=>{const pct=(h.touches/maxH)*100;const{dir,name}=splitPath(h.file);return '<div class="row"><span class="rank">'+(i+1)+'</span><div class="row-main"><div class="row-title path">'+(dir?'<span class="path-dir">'+esc(dir)+'</span>':'')+'<span class="path-name">'+esc(name)+'</span></div><div class="row-bar"><div class="row-fill hot" style="width:'+pct+'%"></div></div></div><div class="row-value">'+h.touches+'<span class="row-unit">회</span></div></div>';}).join('');}
  function heatmapHtml(grid){const maxH=Math.max(1,...grid.flat());const cells=[];for(let d=0;d<7;d++){cells.push('<div class="heat-day-label">'+DAY_LABELS[d]+'</div>');for(let h=0;h<24;h++){const v=grid[d][h];const it=v===0?0:0.18+(v/maxH)*0.82;cells.push('<div class="heat-cell" data-day="'+d+'" data-hour="'+h+'" style="background:rgba(124,58,237,'+it+')" title="'+DAY_LABELS[d]+'요일 '+h+'시 · '+v+'건">'+(v>0?'<span class="heat-num">'+v+'</span>':'')+'</div>');}}return cells.join('');}
  function commitListHtml(day,hour,items,total,truncated){if(!items.length)return'';total=total||items.length;const rows=items.map(c=>{const d=new Date(new Date(c.date).getTime()+KST_OFFSET_MS);const yy=String(d.getUTCFullYear()).slice(2);const mm=String(d.getUTCMonth()+1).padStart(2,'0');const dd=String(d.getUTCDate()).padStart(2,'0');const hh=String(d.getUTCHours()).padStart(2,'0');const mi=String(d.getUTCMinutes()).padStart(2,'0');return '<div class="commit-item"><span class="commit-hash">'+esc(c.hash.slice(0,7))+'</span><div class="commit-main"><div class="commit-subject">'+esc(c.subject||'(no message)')+'</div><div class="commit-author">'+esc(c.author||'')+' &lt;'+esc(c.email||'')+'&gt;</div></div><div class="commit-time">'+yy+'-'+mm+'-'+dd+' '+hh+':'+mi+'</div></div>';}).join('');const cap=truncated?(' · 최신 '+items.length+'개 표시'):'';return '<div class="heat-detail"><div class="heat-detail-head"><div class="heat-detail-title">'+DAY_LABELS[day]+'요일 <strong>'+String(hour).padStart(2,'0')+':00 ~ '+String(hour).padStart(2,'0')+':59</strong> · '+total+'개 커밋'+cap+'</div><button class="heat-detail-close" aria-label="닫기">×</button></div><div class="heat-detail-body">'+rows+'</div></div>';}

  // ── embedded 전용: 추가 지표 클라 집계 + 조각 (server 모드는 payload 사용) ──
  function extraHtmlEmbedded(commits){
    // 활동 추이
    const mm=new Map();for(const c of commits){const k=c.date.slice(0,7);const cur=mm.get(k)||{month:k,commits:0,additions:0,deletions:0};cur.commits++;cur.additions+=c.additions||0;cur.deletions+=c.deletions||0;mm.set(k,cur);}
    const months=[...mm.values()].sort((a,b)=>a.month.localeCompare(b.month));
    const amax=Math.max(1,...months.map(m=>m.commits));
    const activity=months.length?'<div class="act-chart">'+months.map(m=>'<div class="act-col" title="'+m.month+' · '+m.commits+' commits"><div class="act-bar" style="height:'+(m.commits/amax*100)+'%"></div><div class="act-x">'+m.month.slice(2)+'</div></div>').join('')+'</div>':'<div class="empty">데이터 없음</div>';
    // 타임라인
    const sm=new Map();for(const c of commits){const k=(c.email||c.author||'').toLowerCase();const cur=sm.get(k)||{author:c.author,email:c.email,first:c.date,last:c.date,commits:0};cur.commits++;if(c.date<cur.first)cur.first=c.date;if(c.date>cur.last)cur.last=c.date;sm.set(k,cur);}
    let spans=[...sm.values()].sort((a,b)=>a.first.localeCompare(b.first));
    let tlNote='';
    if(spans.length>100){spans=[...spans].sort((a,b)=>b.commits-a.commits).slice(0,100).sort((a,b)=>a.first.localeCompare(b.first));tlNote='<div class="dim" style="font-size:11px;margin-bottom:10px">전체 '+sm.size+'명 중 커밋 상위 100명 표시</div>';}
    let timeline='<div class="empty">데이터 없음</div>';
    if(spans.length){const tmin=Math.min(...spans.map(s=>new Date(s.first).getTime())),tmax=Math.max(...spans.map(s=>new Date(s.last).getTime())),rg=Math.max(1,tmax-tmin);
      timeline=tlNote+'<div class="tl">'+spans.map(s=>{const l=(new Date(s.first).getTime()-tmin)/rg*100,w=Math.max(1,(new Date(s.last).getTime()-new Date(s.first).getTime())/rg*100);return '<div class="tl-row" title="'+esc(s.author)+' · '+fmtDate(s.first)+' ~ '+fmtDate(s.last)+' · '+s.commits+' commits"><div class="tl-name">'+esc(s.author||'(이름 없음)')+'</div><div class="tl-track"><div class="tl-bar" style="left:'+l+'%;width:'+w+'%;background:'+avatarColor(s.email||s.author||'')+'"></div></div></div>';}).join('')+'</div>';}
    // 소유 (alive 정보 없음)
    const fo=new Map();for(const c of commits)for(const f of c.filesChanged){let a=fo.get(f);if(!a){a=new Map();fo.set(f,a);}const k=(c.email||c.author||'').toLowerCase();a.set(k,(a.get(k)||0)+1);}
    const orows=[];for(const[file,a]of fo){let t=0,ts=0;for(const[,n]of a){t+=n;if(n>ts)ts=n;}orows.push({file,authors:a.size,topShare:ts/t,touches:t});}
    orows.sort((x,y)=>(x.authors-y.authors)||(y.touches-x.touches));
    const ownership=orows.slice(0,20).map((r,i)=>{const{dir,name}=splitPath(r.file);const solo=r.authors===1;return '<div class="row"><span class="rank">'+(i+1)+'</span><div class="row-main"><div class="row-title path">'+(dir?'<span class="path-dir">'+esc(dir)+'</span>':'')+'<span class="path-name">'+esc(name)+'</span></div><div class="own-meta">'+(solo?'<span class="tag risk">⚠ 단독 소유</span>':r.authors+'명')+' · 최다 '+Math.round(r.topShare*100)+'% · '+r.touches+'회 변경</div></div><div class="row-value">'+r.authors+'<span class="row-unit">명</span></div></div>';}).join('')||'<div class="empty">데이터 없음</div>';
    // 결합도 (강도% 모델 + 핫스팟). server의 coupling()과 동일 로직.
    const fileTot=new Map();const pt=new Map();
    for(const c of commits){const fs2=[...new Set(c.filesChanged)];for(const f of fs2)fileTot.set(f,(fileTot.get(f)||0)+1);if(fs2.length<2||fs2.length>30)continue;fs2.sort();for(let i=0;i<fs2.length;i++)for(let j=i+1;j<fs2.length;j++){const k=fs2[i]+'\\x00'+fs2[j];pt.set(k,(pt.get(k)||0)+1);}}
    const maxFt=Math.max(1,...fileTot.values());
    let prs=[];for(const[k,together]of pt){if(together<2)continue;const[a,b]=k.split('\\x00');const at=fileTot.get(a)||together,bt=fileTot.get(b)||together;const strength=together/Math.min(at,bt);const hf=Math.max(at,bt)/maxFt;const score=strength*Math.log2(together+1)*(0.5+0.5*hf);prs.push({a,b,together,aHot:at,bHot:bt,strength,score});}
    prs.sort((x,y)=>y.score-x.score);const prsTop=prs.slice(0,20);
    const coupling=prsTop.length?prsTop.map((p,i)=>{const a=splitPath(p.a),b=splitPath(p.b);const pct=Math.round(p.strength*100);const strong=p.strength>=0.8;return '<div class="row"><span class="rank">'+(i+1)+'</span><div class="row-main"><div class="row-title path"><span class="path-dir">'+esc(a.dir)+'</span><span class="path-name">'+esc(a.name)+'</span> <span class="couple-amp">↔</span> <span class="path-dir">'+esc(b.dir)+'</span><span class="path-name">'+esc(b.name)+'</span></div><div class="row-bar"><div class="row-fill'+(strong?' strong':'')+'" style="width:'+pct+'%"></div></div><div class="own-meta">함께 '+p.together+'회 · 각 변경 '+p.aHot+'/'+p.bHot+'회'+(strong?' · <span class="tag risk">강결합</span>':'')+'</div></div><div class="row-value">'+pct+'<span class="row-unit">%</span></div></div>';}).join(''):'<div class="empty">조건을 만족하는 결합 파일 쌍 없음</div>';
    // 그래프 데이터 (강도30%+ · 동시3회+ 상위 45쌍)
    const gpairs=prs.filter(p=>p.strength>=0.3&&p.together>=3).slice(0,45);
    const nmap=new Map();const gnodes=[];const gid=(f,hot)=>{let n=nmap.get(f);if(!n){n={id:gnodes.length,file:f,hot};nmap.set(f,n);gnodes.push(n);}return n.id;};
    const gedges=gpairs.map(p=>({s:gid(p.a,p.aHot),t:gid(p.b,p.bHot),strength:p.strength,together:p.together}));
    const couplingGraph={nodes:gnodes.map(n=>({file:n.file,hot:n.hot})),edges:gedges};
    // 크기 분포
    const bk=[{label:'~10',max:10,count:0},{label:'11–50',max:50,count:0},{label:'51–200',max:200,count:0},{label:'201–1000',max:1000,count:0},{label:'1000+',max:Infinity,count:0}];
    for(const c of commits){const s=(c.additions||0)+(c.deletions||0);for(const b of bk){if(s<=b.max){b.count++;break;}}}
    const smax=Math.max(1,...bk.map(b=>b.count));
    const size=bk.map(b=>'<div class="dist-row"><div class="dist-label">'+b.label+' 라인</div><div class="dist-track"><div class="dist-fill" style="width:'+(b.count/smax*100)+'%"></div></div><div class="dist-val">'+fmt(b.count)+'</div></div>').join('');
    // 컨벤션
    const TY=['feat','fix','docs','style','refactor','perf','test','build','ci','chore','revert'];const re=new RegExp('^('+TY.join('|')+')(\\\\([^)]*\\\\))?!?:','i');
    const bt=new Map();let conf=0;for(const c of commits){const m=(c.subject||'').trim().match(re);if(m){conf++;const t=m[1].toLowerCase();bt.set(t,(bt.get(t)||0)+1);}}
    const pct=Math.round(conf/(commits.length||1)*100);
    const chips=[...bt.entries()].sort((a,b)=>b[1]-a[1]).map(([t,n])=>'<span class="conv-chip"><b>'+t+'</b> '+n+'</span>').join('')||'<span class="dim">conventional commit 형식 커밋 없음</span>';
    const convention='<div class="conv-rate"><div class="conv-ring" style="--pct:'+pct+'"><span>'+pct+'%</span></div><div class="conv-desc"><div class="conv-big">'+fmt(conf)+' / '+fmt(commits.length)+'</div><div class="dim">feat:/fix: 등 컨벤션 준수 커밋</div></div></div><div class="conv-types">'+chips+'</div>';
    // 언어
    const lm=new Map();for(const c of commits)for(const f of c.filesChanged){const base=f.slice(f.lastIndexOf('/')+1);const dot=base.lastIndexOf('.');const ext=dot>0?base.slice(dot+1).toLowerCase():'(없음)';lm.set(ext,(lm.get(ext)||0)+1);}
    const la=[...lm.entries()].map(([ext,count])=>({ext,count})).sort((a,b)=>b.count-a.count);const ltot=la.reduce((s,x)=>s+x.count,0)||1;const ltop=la.slice(0,12);const lmax=Math.max(1,...ltop.map(x=>x.count));
    const language=ltop.length?ltop.map(x=>'<div class="dist-row"><div class="dist-label">.'+esc(x.ext)+'</div><div class="dist-track"><div class="dist-fill" style="width:'+(x.count/lmax*100)+'%"></div></div><div class="dist-val">'+Math.round(x.count/ltot*100)+'%</div></div>').join(''):'<div class="empty">데이터 없음</div>';
    return{activityHtml:activity,timelineHtml:timeline,ownershipHtml:ownership,staleHtml:'<div class="empty">고아 파일 분석은 서버 모드(git-stats serve)에서 제공됩니다.</div>',couplingHtml:coupling,couplingGraph:couplingGraph,sizeHtml:size,conventionHtml:convention,languageHtml:language};
  }

  // ── embedded 결합도 탐색 탭 (server는 /api/coupling-* 사용) ──
  function couplingForFileEmbedded(commits,target){
    const fileTot=new Map();const pt=new Map();let tt=0;
    for(const c of commits){const fs=[...new Set(c.filesChanged)];for(const f of fs)fileTot.set(f,(fileTot.get(f)||0)+1);if(!fs.includes(target))continue;tt++;if(fs.length<2||fs.length>30)continue;for(const f of fs){if(f===target)continue;pt.set(f,(pt.get(f)||0)+1);}}
    const partners=[];for(const[file,together]of pt){const ptot=fileTot.get(file)||together;partners.push({file,together,strength:together/Math.min(tt||together,ptot),hot:ptot});}
    partners.sort((a,b)=>(b.strength-a.strength)||(b.together-a.together));
    return{file:target,totalChanges:tt,partners:partners.slice(0,40)};
  }
  function partnersHtmlEmbedded(r){
    const sp=splitPath(r.file);
    if(!r.partners.length)return '<div class="partners-head">📄 <strong>'+esc(sp.name)+'</strong></div><div class="empty">함께 바뀐 파일이 없습니다.</div>';
    const rows=r.partners.map((p,i)=>{const{dir,name}=splitPath(p.file);const pct=Math.round(p.strength*100);const strong=p.strength>=0.8;return '<div class="row" data-file="'+esc(p.file)+'"><span class="rank">'+(i+1)+'</span><div class="row-main"><div class="row-title path">'+(dir?'<span class="path-dir">'+esc(dir)+'</span>':'')+'<span class="path-name">'+esc(name)+'</span></div><div class="row-bar"><div class="row-fill'+(strong?' strong':'')+'" style="width:'+pct+'%"></div></div><div class="own-meta">함께 '+p.together+'회 · 이 파일 총 '+p.hot+'회 변경'+(strong?' · <span class="tag risk">강결합</span>':'')+'</div></div><div class="row-value">'+pct+'<span class="row-unit">%</span></div></div>';}).join('');
    return '<div class="partners-head"><span class="path-dir">'+esc(sp.dir)+'</span><strong>'+esc(sp.name)+'</strong> <span class="dim">· 총 '+r.totalChanges+'회 변경 · 연관 '+r.partners.length+'개</span></div>'+rows;
  }
  function cplTreeHtmlEmbedded(commits){
    const hot=new Map();const coupled=new Set();
    for(const c of commits){const fs=[...new Set(c.filesChanged)];for(const f of fs)hot.set(f,(hot.get(f)||0)+1);if(fs.length>=2&&fs.length<=30)for(const f of fs)coupled.add(f);}
    let files=[...coupled].map(f=>({file:f,hot:hot.get(f)||0}));const total=files.length;files.sort((a,b)=>b.hot-a.hot);
    const MAX=2000;const truncated=files.length>MAX;if(truncated)files=files.slice(0,MAX);
    if(!files.length)return '<div class="empty">결합 데이터가 있는 파일이 없습니다.</div>';
    // 트리 구성
    const root={name:'',path:'',children:[]};const idx=new Map([['',root]]);
    const ensure=(dp)=>{if(idx.has(dp))return idx.get(dp);const s=dp.lastIndexOf('/');const pp=s===-1?'':dp.slice(0,s);const nm=s===-1?dp:dp.slice(s+1);const par=ensure(pp);const node={name:nm,path:dp,children:[]};par.children.push(node);idx.set(dp,node);return node;};
    for(const{file,hot:h}of files){const s=file.lastIndexOf('/');const dp=s===-1?'':file.slice(0,s);const nm=s===-1?file:file.slice(s+1);ensure(dp).children.push({name:nm,path:file,file,hot:h});}
    const sortNode=(n)=>{if(!n.children)return;n.children.sort((a,b)=>{const af=!!a.children,bf=!!b.children;if(af!==bf)return af?-1:1;return a.name.localeCompare(b.name);});n.children.forEach(sortNode);};
    sortNode(root);
    const note=truncated?'<div class="dim" style="font-size:11px;padding:4px 8px">전체 '+total+'개 중 변경 많은 '+MAX+'개 표시</div>':'';
    return note+renderTreeNodesC(root.children,0);
  }
  function renderTreeNodesC(children,depth){
    return children.map(n=>{
      if(n.children)return '<div class="ftree-folder" data-path="'+esc(n.path)+'"><div class="ftree-row folder" style="padding-left:'+(depth*14+8)+'px"><span class="ftree-caret">▸</span><span class="ftree-ico">📁</span><span class="ftree-name">'+esc(n.name)+'</span></div><div class="ftree-children">'+renderTreeNodesC(n.children,depth+1)+'</div></div>';
      return '<div class="ftree-file" data-file="'+esc(n.file)+'" style="padding-left:'+(depth*14+8)+'px"><span class="ftree-ico">📄</span><span class="ftree-name">'+esc(n.name)+'</span><span class="ftree-hot">'+n.hot+'</span></div>';
    }).join('');
  }

  // ── 공통 상태 ──
  const $=(s)=>document.querySelector(s);
  let currentSort='commits';
  let contribOffset=0;
  let contribTotal=0;
  let contribMaxC=1; // embedded: 1위 커밋수
  let allContribsSorted=[]; // embedded only
  // embedded 전용
  let ALL_COMMITS=[], currentFiltered=[];
  // server 전용 캐시: 드릴다운 결과
  let lastFilter={from:'',to:''};
  // 커밋 목록(커밋 상세 탭) 상태
  let commitOffset=0, commitQuery='', commitBusy=false, commitSorted=[];
  // 결합도 탐색 탭 상태 (지연 로드, 필터 변경 시 무효화)
  let cplTreeLoaded=false;

  // 날짜 범위 초기화
  const fromEl=$('#filter-from'),toEl=$('#filter-to');
  fromEl.min=cfg.minDate;fromEl.max=cfg.maxDate;toEl.min=cfg.minDate;toEl.max=cfg.maxDate;
  const today=new Date();const ninety=new Date(today.getTime()-90*86400*1000);
  let dFrom=ninety.toISOString().slice(0,10);let dTo=today.toISOString().slice(0,10);
  fromEl.value=dFrom<cfg.minDate?cfg.minDate:dFrom;
  toEl.value=dTo>cfg.maxDate?cfg.maxDate:dTo;

  function setBusy(b){const g=$('#contrib-grid');if(b)g.innerHTML='<div class="loading"><span class="spin"></span>집계 중…</div>';}

  // ── 드릴다운 바인딩 (공통) ──
  let selectedCell=null;
  function bindHeatmapCells(){
    document.querySelectorAll('#global-heatmap .heat-cell').forEach(cell=>{
      cell.addEventListener('click',async()=>{
        const day=+cell.dataset.day,hour=+cell.dataset.hour;const mount=$('#heat-detail-mount');
        if(selectedCell===cell){cell.classList.remove('selected');selectedCell=null;mount.innerHTML='';return;}
        document.querySelectorAll('#global-heatmap .heat-cell.selected').forEach(c=>c.classList.remove('selected'));
        cell.classList.add('selected');selectedCell=cell;
        mount.innerHTML='<div class="loading"><span class="spin"></span>커밋 불러오는 중…</div>';
        const{items,total,truncated}=await commitsAt(day,hour,'');
        mount.innerHTML=commitListHtml(day,hour,items,total,truncated)||'<div class="loading">커밋 없음</div>';
        const cb=mount.querySelector('.heat-detail-close');if(cb)cb.onclick=()=>{cell.classList.remove('selected');selectedCell=null;mount.innerHTML='';};
      });
    });
  }
  const cardSel=new WeakMap();
  function bindContribCells(){
    document.querySelectorAll('#contrib-grid .contrib-card').forEach(card=>{
      const email=card.dataset.email;const mount=card.querySelector('.contrib-detail-mount');
      card.querySelectorAll('.mini-cell').forEach(cell=>{
        cell.addEventListener('click',async(e)=>{
          e.stopPropagation();const day=+cell.dataset.day,hour=+cell.dataset.hour;const prev=cardSel.get(card);
          if(prev===cell){cell.classList.remove('selected');cardSel.delete(card);mount.innerHTML='';return;}
          card.querySelectorAll('.mini-cell.selected').forEach(c=>c.classList.remove('selected'));
          cell.classList.add('selected');cardSel.set(card,cell);
          mount.innerHTML='<div class="loading"><span class="spin"></span>…</div>';
          const{items,total,truncated}=await commitsAt(day,hour,email);
          const html=commitListHtml(day,hour,items,total,truncated);mount.innerHTML=html?html.replace('class="heat-detail"','class="heat-detail contrib-detail"'):'';
          const cb=mount.querySelector('.heat-detail-close');if(cb)cb.onclick=()=>{cell.classList.remove('selected');cardSel.delete(card);mount.innerHTML='';};
        });
      });
    });
  }

  // ── 모드별 데이터 소스 ── ({items, total, truncated} 반환)
  async function commitsAt(day,hour,email){
    if(MODE==='embedded'){
      const items=currentFiltered.filter(c=>{if(email&&(c.email||c.author||'').toLowerCase()!==email)return false;const k=kstParts(c.date);return k.day===day&&k.hour===hour;}).sort((a,b)=>new Date(b.date)-new Date(a.date));
      return{items,total:items.length,truncated:false};
    }
    const u=new URL('/api/commits-at',location.origin);
    u.searchParams.set('repo',REPO);u.searchParams.set('day',day);u.searchParams.set('hour',hour);
    if(email)u.searchParams.set('email',email);
    u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);
    applyServerOpts(u);
    try{const r=await fetch(u);const d=await r.json();return{items:d.commits||[],total:d.count||0,truncated:!!d.truncated};}catch(e){return{items:[],total:0,truncated:false};}
  }

  function applyServerOpts(u){
    // serve.mjs가 페이지를 줄 때 report-config에 옵션을 넣어두면 여기서 전달.
    if(cfg.opts){for(const k in cfg.opts){if(cfg.opts[k])u.searchParams.set(k,cfg.opts[k]);}}
  }

  // ── 렌더 (서버/클라 공통 진입) ──
  async function refresh(resetOffset){
    if(resetOffset!==false)contribOffset=0;
    if(MODE==='embedded'){
      const from=fromEl.value,to=toEl.value;
      currentFiltered=ALL_COMMITS.filter(c=>{const d=c.date.slice(0,10);return(!from||d>=from)&&(!to||d<=to);});
      const contribs=sortContribs(byContributor(currentFiltered),currentSort);
      allContribsSorted=contribs;contribTotal=contribs.length;contribMaxC=Math.max(1,...contribs.map(c=>c.commits));
      const bus=busFactor(currentFiltered);const add=contribs.reduce((s,c)=>s+c.additions,0),del=contribs.reduce((s,c)=>s+c.deletions,0);
      $('#filter-count').textContent=fmt(currentFiltered.length);
      $('#contrib-count').textContent=contribTotal+'명';
      $('#stats-grid').innerHTML=statsHtml(currentFiltered.length,contribTotal,bus,add,del);
      $('#contrib-grid').innerHTML=contribs.slice(0,CONTRIB_PAGE).map((c,i)=>contribCardHtml(c,i,contribMaxC)).join('');
      $('#hotspots').innerHTML=hotspotsHtml(hotspots(currentFiltered,20));
      $('#global-heatmap').innerHTML=heatmapHtml(heatmap(currentFiltered));
      setExtra(extraHtmlEmbedded(currentFiltered));
      updateMore();finishRender();
      return;
    }
    // server 모드
    setBusy(true);
    const u=new URL('/api/report',location.origin);
    u.searchParams.set('repo',REPO);u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);
    u.searchParams.set('sort',currentSort);u.searchParams.set('offset','0');
    applyServerOpts(u);
    let d;try{const r=await fetch(u);d=await r.json();}catch(e){$('#contrib-grid').innerHTML='<div class="loading">서버 오류: '+e.message+'</div>';return;}
    if(d.error){$('#contrib-grid').innerHTML='<div class="loading">'+d.error+'</div>';return;}
    contribTotal=d.contribCount;
    $('#filter-count').textContent=fmt(d.totalCommits);
    $('#contrib-count').textContent=d.contribCount+'명';
    $('#stats-grid').innerHTML=d.statsHtml;
    $('#contrib-grid').innerHTML=d.contribCardsHtml;
    $('#hotspots').innerHTML=d.hotspotsHtml;
    $('#global-heatmap').innerHTML=d.heatmapHtml;
    // 추가 섹션 (서버가 필터 적용해 조각을 만들어 보냄 → 기간에 함께 반응)
    setExtra(d);
    contribOffset=d.contribNextOffset;
    setMore(d.contribHasMore);
    finishRender();
  }

  // 탭/그래프 지연렌더 상태 (setExtra·switchTab 공유)
  let filesGraphRendered=false;
  let lastGraphData=null;

  // 추가 섹션 주입 (server: payload 조각 / embedded: 클라 계산 조각)
  function setExtra(d){
    const put=(id,html)=>{const el=$('#'+id);if(el)el.innerHTML=html||'';};
    put('activity',d.activityHtml);put('timeline',d.timelineHtml);
    put('ownership',d.ownershipHtml);put('stale',d.staleHtml);
    put('coupling',d.couplingHtml);put('size',d.sizeHtml);
    put('convention',d.conventionHtml);put('language',d.languageHtml);
    // 그래프: 데이터 저장 후, 파일 탭이 보일 때만 렌더(숨김 패널은 width=0이라 깨짐).
    lastGraphData=d.couplingGraph;
    const filesActive=document.querySelector('.tab-panel[data-tab=files]')?.classList.contains('active');
    if(filesActive){renderCouplingGraph(lastGraphData);filesGraphRendered=true;}
    else{filesGraphRendered=false;}
  }

  // ── 결합 네트워크 그래프 (의존성 0: 정적 force 레이아웃 → SVG) ──
  let graphDrag=null;
  function renderCouplingGraph(data){
    const wrap=$('#coupling-graph'); if(!wrap) return;
    if(!data||!data.nodes||data.nodes.length<2){wrap.innerHTML='<div class="g-empty">그래프로 그릴 만한 결합(강도 30%+ · 동시변경 3회+)이 없습니다.</div>';return;}
    const W=wrap.clientWidth||900, H=440;
    const nodes=data.nodes.map((n,i)=>({...n,x:W/2+Math.cos(i)*120+(Math.random()-0.5)*40,y:H/2+Math.sin(i)*120+(Math.random()-0.5)*40,vx:0,vy:0}));
    const edges=data.edges;
    const maxHot=Math.max(1,...nodes.map(n=>n.hot));
    const radius=(n)=>5+Math.sqrt(n.hot/maxHot)*16;
    // 노드별 연결 수 (God file 판별)
    const deg=new Array(nodes.length).fill(0);
    edges.forEach(e=>{deg[e.s]++;deg[e.t]++;});
    const maxDeg=Math.max(1,...deg);

    // 정적 force 시뮬레이션: 반발(쿨롱) + 결합 인력(스프링) + 중심 인력. 고정 횟수 후 정지.
    // 노드 수에 따라 틱 적응 (O(n²)라 많을수록 줄여 메인스레드 점유 최소화).
    const TICKS=Math.max(120,Math.round(18000/Math.max(8,nodes.length))), REPULSE=2400, SPRING=0.04, CENTER=0.012, DAMP=0.85;
    for(let t=0;t<TICKS;t++){
      for(let i=0;i<nodes.length;i++){
        const a=nodes[i];
        for(let j=i+1;j<nodes.length;j++){
          const b=nodes[j];let dx=a.x-b.x,dy=a.y-b.y;let d2=dx*dx+dy*dy||0.01;let d=Math.sqrt(d2);
          const f=REPULSE/d2;const fx=dx/d*f,fy=dy/d*f;a.vx+=fx;a.vy+=fy;b.vx-=fx;b.vy-=fy;
        }
        a.vx+=(W/2-a.x)*CENTER;a.vy+=(H/2-a.y)*CENTER;
      }
      for(const e of edges){
        const a=nodes[e.s],b=nodes[e.t];let dx=b.x-a.x,dy=b.y-a.y;let d=Math.sqrt(dx*dx+dy*dy)||0.01;
        const target=40+(1-e.strength)*80;const f=(d-target)*SPRING*e.strength;
        const fx=dx/d*f,fy=dy/d*f;a.vx+=fx;a.vy+=fy;b.vx-=fx;b.vy-=fy;
      }
      for(const n of nodes){n.vx*=DAMP;n.vy*=DAMP;n.x+=n.vx;n.y+=n.vy;
        const r=radius(n);n.x=Math.max(r,Math.min(W-r,n.x));n.y=Math.max(r,Math.min(H-r,n.y));}
    }
    const edgeSvg=edges.map(e=>{const a=nodes[e.s],b=nodes[e.t];const sw=1+e.strength*4;return '<line class="g-edge'+(e.strength>=0.8?' strong':'')+'" x1="'+a.x.toFixed(1)+'" y1="'+a.y.toFixed(1)+'" x2="'+b.x.toFixed(1)+'" y2="'+b.y.toFixed(1)+'" stroke-width="'+sw.toFixed(1)+'"><title>'+esc(a.file)+' ↔ '+esc(b.file)+' · '+Math.round(e.strength*100)+'%</title></line>';}).join('');
    const nodeSvg=nodes.map((n,i)=>{const r=radius(n);const god=deg[i]>=Math.max(4,maxDeg*0.6);const nm=n.file.slice(n.file.lastIndexOf('/')+1);return '<g class="g-node-g" data-i="'+i+'"><circle class="g-node'+(god?' god':'')+'" cx="'+n.x.toFixed(1)+'" cy="'+n.y.toFixed(1)+'" r="'+r.toFixed(1)+'"><title>'+esc(n.file)+' · '+n.hot+'회 변경 · 연결 '+deg[i]+'</title></circle>'+(r>=10||god?'<text class="g-label" x="'+n.x.toFixed(1)+'" y="'+(n.y-r-3).toFixed(1)+'" text-anchor="middle">'+esc(nm.length>18?nm.slice(0,16)+'…':nm)+'</text>':'')+'</g>';}).join('');
    wrap.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+edgeSvg+nodeSvg+'</svg>';

    // 드래그로 노드 이동 (시뮬레이션은 정적이므로 좌표만 갱신).
    const svg=wrap.querySelector('svg');
    svg.addEventListener('mousedown',(e)=>{const g=e.target.closest('.g-node-g');if(!g)return;graphDrag={i:+g.dataset.i,g};});
    window.addEventListener('mousemove',(e)=>{if(!graphDrag)return;const rect=svg.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*W,y=(e.clientY-rect.top)/rect.height*H;const n=nodes[graphDrag.i];n.x=x;n.y=y;const c=graphDrag.g.querySelector('circle');c.setAttribute('cx',x);c.setAttribute('cy',y);const tx=graphDrag.g.querySelector('text');if(tx){tx.setAttribute('x',x);tx.setAttribute('y',y-radius(n)-3);}svg.querySelectorAll('.g-edge').forEach((ln,k)=>{const ed=edges[k];if(ed.s===graphDrag.i){ln.setAttribute('x1',x);ln.setAttribute('y1',y);}if(ed.t===graphDrag.i){ln.setAttribute('x2',x);ln.setAttribute('y2',y);}});});
    window.addEventListener('mouseup',()=>{graphDrag=null;});
  }

  function setMore(hasMore){
    const w=$('#contrib-more-wrap');w.style.display=hasMore?'block':'none';
    const shown=Math.min(contribOffset,contribTotal);
    $('#contrib-shown').textContent='('+shown+' / '+contribTotal+'명 표시'+(contribTotal>shown?' · 더 보기로 추가':'')+')';
  }
  function updateMore(){ // embedded
    const cnt=contribGridCount();
    $('#contrib-more-wrap').style.display=cnt<contribTotal?'block':'none';
    $('#contrib-shown').textContent='('+cnt+' / '+contribTotal+'명 표시'+(contribTotal>cnt?' · 더 보기로 추가':'')+')';
  }
  function contribGridCount(){return document.querySelectorAll('#contrib-grid .contrib-card').length;}

  async function loadMore(){
    if(MODE==='embedded'){
      const cnt=contribGridCount();const next=allContribsSorted.slice(cnt,cnt+CONTRIB_PAGE);
      $('#contrib-grid').insertAdjacentHTML('beforeend',next.map((c,i)=>contribCardHtml(c,cnt+i,contribMaxC)).join(''));
      updateMore();bindContribCells();
      return;
    }
    const u=new URL('/api/report',location.origin);
    u.searchParams.set('repo',REPO);u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);
    u.searchParams.set('sort',currentSort);u.searchParams.set('offset',String(contribOffset));
    applyServerOpts(u);
    let d;try{const r=await fetch(u);d=await r.json();}catch(e){return;}
    if(d.error)return;
    $('#contrib-grid').insertAdjacentHTML('beforeend',d.contribCardsHtml);
    contribOffset=d.contribNextOffset;setMore(d.contribHasMore);bindContribCells();
  }

  function finishRender(){
    $('#heat-detail-mount').innerHTML='';selectedCell=null;bindHeatmapCells();bindContribCells();setupListMore();loadCommitList(true);
    // 결합도 탭: 필터가 바뀌었으니 무효화. 지금 보고 있으면 즉시 재로드, 아니면 다음 진입 시 로드.
    cplTreeLoaded=false;
    const cplActive=document.querySelector('.tab-panel[data-tab=coupling]')?.classList.contains('active');
    if(cplActive)loadCouplingTree();
  }

  // 파일 리스트(핫스팟·소유·고아·결합): 기본 5개만 보이고 '더 보기'로 펼침.
  function setupListMore(){
    document.querySelectorAll('.more-wrap').forEach(wrap=>{
      const id=wrap.dataset.list;const card=$('#'+id);if(!card)return;
      const rows=card.querySelectorAll('.row').length;
      if(rows>5){
        card.classList.add('collapsed');wrap.style.display='block';
        const btn=wrap.querySelector('.list-more');btn.textContent='더 보기 ('+(rows-5)+'개 더)';
        btn.onclick=()=>{
          if(card.classList.contains('collapsed')){card.classList.remove('collapsed');btn.textContent='접기';}
          else{card.classList.add('collapsed');btn.textContent='더 보기 ('+(rows-5)+'개 더)';card.scrollIntoView({behavior:'smooth',block:'nearest'});}
        };
      }else{card.classList.remove('collapsed');wrap.style.display='none';}
    });
  }

  // ── 이벤트 ──
  function clearPresets(){document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));}
  fromEl.addEventListener('change',()=>{clearPresets();refresh();});
  toEl.addEventListener('change',()=>{clearPresets();refresh();});
  document.querySelectorAll('.preset').forEach(btn=>{
    btn.addEventListener('click',()=>{clearPresets();btn.classList.add('active');const days=+btn.dataset.days;
      if(days===0){fromEl.value=cfg.minDate;toEl.value=cfg.maxDate;}else{const t=new Date();const f=new Date(t.getTime()-days*86400*1000);fromEl.value=f.toISOString().slice(0,10);toEl.value=t.toISOString().slice(0,10);}
      refresh();});
  });
  document.querySelectorAll('.sort-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{document.querySelectorAll('.sort-chip').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentSort=btn.dataset.sort;refresh();});
  });
  $('#contrib-more').addEventListener('click',loadMore);

  // ── 탭 전환 ── (filesGraphRendered·lastGraphData는 setExtra와 공유)
  function switchTab(name){
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.tab===name));
    if(name==='files'&&!filesGraphRendered&&lastGraphData){renderCouplingGraph(lastGraphData);filesGraphRendered=true;}
    if(name==='coupling'&&!cplTreeLoaded){loadCouplingTree();}
    window.scrollTo(0,0);
  }
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));

  // ── 결합도 탐색 탭 ── (cplTreeLoaded는 상단 선언)
  async function loadCouplingTree(){
    const treeEl=$('#cpl-tree');
    treeEl.innerHTML='<div class="loading"><span class="spin"></span>트리 불러오는 중…</div>';
    let html;
    if(MODE==='embedded'){html=cplTreeHtmlEmbedded(currentFiltered);}
    else{
      const u=new URL('/api/coupling-tree',location.origin);
      u.searchParams.set('repo',REPO);u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);applyServerOpts(u);
      try{const r=await fetch(u);const d=await r.json();html=d.error?('<div class="empty">'+d.error+'</div>'):d.treeHtml;}catch(e){html='<div class="empty">오류: '+e.message+'</div>';}
    }
    treeEl.innerHTML=html;
    bindTree();
    cplTreeLoaded=true;
    $('#cpl-partners').innerHTML='<div class="empty">← 왼쪽에서 파일을 선택하세요</div>';
  }
  function bindTree(){
    $('#cpl-tree').querySelectorAll('.ftree-row.folder').forEach(row=>{
      row.addEventListener('click',()=>row.parentElement.classList.toggle('collapsed'));
    });
    $('#cpl-tree').querySelectorAll('.ftree-file').forEach(f=>{
      f.addEventListener('click',()=>selectCouplingFile(f.dataset.file,f));
    });
    // 기본: 폴더 전부 펼침. (collapsed 클래스 없음 = 펼친 상태)
  }
  async function selectCouplingFile(file,el){
    $('#cpl-tree').querySelectorAll('.ftree-file.active').forEach(x=>x.classList.remove('active'));
    if(el)el.classList.add('active');
    const pane=$('#cpl-partners');
    pane.innerHTML='<div class="loading"><span class="spin"></span>연관 파일 분석 중…</div>';
    let html;
    if(MODE==='embedded'){html=partnersHtmlEmbedded(couplingForFileEmbedded(currentFiltered,file));}
    else{
      const u=new URL('/api/coupling-for',location.origin);
      u.searchParams.set('repo',REPO);u.searchParams.set('file',file);u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);applyServerOpts(u);
      try{const r=await fetch(u);const d=await r.json();html=d.error?('<div class="empty">'+d.error+'</div>'):d.partnersHtml;}catch(e){html='<div class="empty">오류: '+e.message+'</div>';}
    }
    pane.innerHTML=html;
    // 연관 파일 행 클릭 → 그 파일로 점프
    pane.querySelectorAll('.row[data-file]').forEach(r=>r.addEventListener('click',()=>{
      const tf=$('#cpl-tree').querySelector('.ftree-file[data-file="'+r.dataset.file.replace(/"/g,'&quot;')+'"]');
      selectCouplingFile(r.dataset.file,tf||null);
      if(tf){let p=tf.parentElement;while(p&&p!==$('#cpl-tree')){if(p.classList&&p.classList.contains('ftree-folder'))p.classList.remove('collapsed');p=p.parentElement;}tf.scrollIntoView({block:'nearest'});}
    }));
  }
  $('#cpl-search').addEventListener('input',(e)=>{
    const q=e.target.value.trim().toLowerCase();
    $('#cpl-tree').querySelectorAll('.ftree-file').forEach(f=>{
      const match=!q||f.dataset.file.toLowerCase().includes(q);f.classList.toggle('hidden',!match);
    });
    // 폴더는 보이는 파일이 있으면 표시
    $('#cpl-tree').querySelectorAll('.ftree-folder').forEach(fd=>{
      const hasVisible=[...fd.querySelectorAll('.ftree-file')].some(f=>!f.classList.contains('hidden'));
      fd.classList.toggle('hidden',!hasVisible);
      if(q&&hasVisible)fd.classList.remove('collapsed');
    });
  });

  // ── 커밋 목록 (커밋 상세 탭) ── (상태 변수는 상단에 선언됨)
  async function loadCommitList(reset){
    if(reset){commitOffset=0;}
    const listEl=$('#commit-list');
    if(reset)listEl.innerHTML='<div class="loading"><span class="spin"></span>커밋 불러오는 중…</div>';
    if(MODE==='embedded'){
      const q=commitQuery;
      let arr=currentFiltered;
      if(q)arr=arr.filter(c=>(c.subject||'').toLowerCase().includes(q)||(c.author||'').toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q)||(c.hash||'').toLowerCase().includes(q));
      const sorted=reset?[...arr].sort((a,b)=>new Date(b.date)-new Date(a.date)):commitSorted;
      commitSorted=sorted;
      const page=sorted.slice(commitOffset,commitOffset+50);
      const html=commitRowsHtml(page);
      if(reset)listEl.innerHTML=html||'<div class="empty">커밋 없음</div>';else listEl.insertAdjacentHTML('beforeend',html);
      commitOffset+=page.length;
      $('#commit-total').textContent='('+sorted.length+'개'+(q?' · "'+q+'" 검색':'')+')';
      $('#commit-more-wrap').style.display=commitOffset<sorted.length?'block':'none';
      return;
    }
    // server
    commitBusy=true;
    const u=new URL('/api/commits',location.origin);
    u.searchParams.set('repo',REPO);u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);
    u.searchParams.set('offset',String(commitOffset));u.searchParams.set('limit','50');
    if(commitQuery)u.searchParams.set('q',commitQuery);
    applyServerOpts(u);
    let d;try{const r=await fetch(u);d=await r.json();}catch(e){listEl.innerHTML='<div class="empty">서버 오류: '+e.message+'</div>';commitBusy=false;return;}
    commitBusy=false;
    if(d.error){listEl.innerHTML='<div class="empty">'+d.error+'</div>';return;}
    if(reset)listEl.innerHTML=d.rowsHtml||'<div class="empty">커밋 없음</div>';else listEl.insertAdjacentHTML('beforeend',d.rowsHtml);
    commitOffset=d.nextOffset;
    $('#commit-total').textContent='('+d.total+'개'+(commitQuery?' · "'+commitQuery+'" 검색':'')+')';
    $('#commit-more-wrap').style.display=d.hasMore?'block':'none';
  }
  // embedded 커밋 행 렌더 (server는 rowsHtml 사용)
  function commitRowsHtml(items){return items.map(c=>{const d=new Date(new Date(c.date).getTime()+KST_OFFSET_MS);const ts=String(d.getUTCFullYear()).slice(2)+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');return '<div class="commit-row"><span class="commit-hash">'+esc(c.hash.slice(0,7))+'</span><div class="c-main"><div class="c-subject">'+esc(c.subject||'(no message)')+'</div><div class="c-author">'+esc(c.author||'')+' &lt;'+esc(c.email||'')+'&gt;</div></div><div class="c-lines"><span class="add">+'+fmt(c.additions||0)+'</span><span class="del">−'+fmt(c.deletions||0)+'</span></div><div class="c-time">'+ts+'</div></div>';}).join('');}

  $('#commit-more').addEventListener('click',()=>{if(!commitBusy)loadCommitList(false);});
  let searchTimer=null;
  $('#commit-search').addEventListener('input',(e)=>{clearTimeout(searchTimer);const v=e.target.value.trim().toLowerCase();searchTimer=setTimeout(()=>{commitQuery=v;loadCommitList(true);},250);});

  // 초기 로드
  if(MODE==='embedded'){ALL_COMMITS=JSON.parse(document.getElementById('commit-data').textContent);}
  refresh();
}

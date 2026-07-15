function buildOptionsFor(sel, q){
  if(!sel) return;
  var prev = sel.value;
  q = (q||'').toLowerCase().trim();
  var opts = '<option value="">제품 선택…</option>';
  Object.keys(BRANDS).forEach(function(bn){
    var bd = BRANDS[bn].data;
    var inner = '';
    Object.keys(bd).forEach(function(k){
      if(bd[k] && bd[k].n && (!q || bd[k].n.toLowerCase().indexOf(q)>=0)){
        inner += '<option value="'+bn+'::'+k+'">'+bd[k].n+'</option>';
      }
    });
    if(inner) opts += '<optgroup label="'+bn+'">'+inner+'</optgroup>';
  });
  sel.innerHTML = opts;
  // preserve selection if still present
  if(prev && sel.querySelector('option[value="'+prev.replace(/"/g,'\\"')+'"]')) sel.value = prev;
}

function buildCompareOptions(){
  buildOptionsFor(document.getElementById('cmpA'),'');
  buildOptionsFor(document.getElementById('cmpB'),'');
  buildOptionsFor(document.getElementById('cmpC'),'');
  var sa=document.getElementById('cmpSearchA'), sb=document.getElementById('cmpSearchB'), sc=document.getElementById('cmpSearchC');
  if(sa) sa.addEventListener('input', function(){ buildOptionsFor(document.getElementById('cmpA'), sa.value); });
  if(sb) sb.addEventListener('input', function(){ buildOptionsFor(document.getElementById('cmpB'), sb.value, getCmpARef()); });
  if(sc) sc.addEventListener('input', function(){ buildOptionsFor(document.getElementById('cmpC'), sc.value, getCmpARef()); });
  renderCmpSavedList();
}

// ----- 비교 저장 (최대 5개, localStorage) -----
var CMP_SAVE_KEY='laReportCmpSaved', CMP_SAVE_MAX=5;

function getSavedCompares(){
  try{ var v=JSON.parse(localStorage.getItem(CMP_SAVE_KEY)); return Array.isArray(v)?v:[]; }catch(e){ return []; }
}
function setSavedCompares(list){
  try{ localStorage.setItem(CMP_SAVE_KEY, JSON.stringify(list)); }catch(e){}
}
function cmpProductName(val){
  if(!val) return null;
  var parts=val.split('::'); if(parts.length<2) return null;
  var bd=BRANDS[parts[0]]; if(!bd) return null;
  var p=bd.data[parts[1]]; if(!p) return null;
  return p.n;
}
function saveCmpCompare(){
  var a=document.getElementById('cmpA').value;
  var b=document.getElementById('cmpB').value;
  var c=document.getElementById('cmpC').value;
  if(!a&&!b&&!c){ alert('저장할 제품을 먼저 선택해주세요.'); return; }
  var list=getSavedCompares();
  if(list.length>=CMP_SAVE_MAX){
    alert('저장 공간이 이미 다 찼습니다 (최대 '+CMP_SAVE_MAX+'개). 기존 저장 항목을 삭제한 뒤 다시 저장해주세요.');
    return;
  }
  var label=[a,b,c].map(cmpProductName).filter(Boolean).join(' vs ') || '(제품 미선택)';
  list.push({a:a,b:b,c:c,label:label});
  setSavedCompares(list);
  renderCmpSavedList();
}
function loadCmpCompare(idx){
  var item=getSavedCompares()[idx]; if(!item) return;
  var lf=document.getElementById('cmpLfFilter'); if(lf) lf.value='';
  document.getElementById('cmpA').value=item.a||'';
  applyCmpFilter();
  document.getElementById('cmpB').value=item.b||'';
  document.getElementById('cmpC').value=item.c||'';
  renderCompare();
}
function deleteCmpCompare(idx){
  var list=getSavedCompares();
  list.splice(idx,1);
  setSavedCompares(list);
  renderCmpSavedList();
}
function resetCmpCompare(){
  ['cmpSearchA','cmpSearchB','cmpSearchC'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('cmpA').value='';
  document.getElementById('cmpB').value='';
  document.getElementById('cmpC').value='';
  buildOptionsFor(document.getElementById('cmpB'),'');
  buildOptionsFor(document.getElementById('cmpC'),'');
  var lf=document.getElementById('cmpLfFilter'); if(lf) lf.value='';
  applyCmpFilter();
  renderCompare();
}
function renderCmpSavedList(){
  var el=document.getElementById('cmpSavedList'); if(!el) return;
  var list=getSavedCompares();
  el.innerHTML=list.map(function(item,i){
    return '<div class="cmp-saved-item"><span class="cmp-saved-load" onclick="loadCmpCompare('+i+')">'+item.label+'</span>'+
           '<button onclick="deleteCmpCompare('+i+')" title="삭제">×</button></div>';
  }).join('');
}

function getCmpARef(){
  var selA=document.getElementById('cmpA'); if(!selA||!selA.value)return null;
  var parts=selA.value.split('::'); if(parts.length<2)return null;
  var brand=parts[0],key=parts[1]; var bd=BRANDS[brand]; if(!bd)return null;
  var p=bd.data[key]; if(!p)return null;
  var s=p.spec||{}; var d=Object.assign({},s.detail||{});
  if(!d.max_spl&&!d.max_spl_by_amp&&!d.linear_peak&&!d.aes75&&s.spl) d._spec_spl=s.spl;
  if(!d.presets&&!d.operating_range&&!d.freq_response_5db&&s.bw) d._spec_bw=s.bw;
  if(!d.dim_full&&s.dim) d._spec_dim=s.dim;
  function getPType(px){
    var t=(px.t||'').toLowerCase(), n=(px.n||'').toLowerCase();
    if(t.indexOf('subwoofer')>=0||t.indexOf('low-frequency')>=0||
       t.indexOf('lf extension')>=0||t.indexOf('infra sub')>=0||
       t.indexOf('low frequency')>=0||t.indexOf('lfc')>=0||
       /^(ks|sb|cs1)/.test(n)||n.indexOf('k1-sb')>=0||
       n==='syva sub'||n==='syva low') return 'sub';
    if(t.indexOf('augmented array')>=0||t.indexOf('a series')>=0) return 'aug';
    // Column Speaker: LA S-Series만 (d&b CCL은 라인어레이로 분류)
    if((t.indexOf('s series')>=0||t.indexOf('colinear source')>=0||
        t.indexOf('u series')>=0)&&t.indexOf('compact column')<0) return 'column';
    if(t.indexOf('stage monitor')>=0||n.indexOf('mjf')>=0) return 'monitor';
    // Line Array: CCL (Compact Column Line) 포함
    if(t.indexOf('line array')>=0||t.indexOf('wst')>=0||t.indexOf('puls')>=0||
       t.indexOf('variable curvature')>=0||t.indexOf('compact line source')>=0||
       t.indexOf('compact column')>=0||
       t.indexOf('k series')>=0||t.indexOf('l series')>=0||
       t.indexOf('ccl')>=0) return 'line';
    if(t.indexOf('point source')>=0||t.indexOf('x series')>=0||
       t.indexOf('installation point')>=0||t.indexOf('ultracompact')>=0||
       t.indexOf('ceiling')>=0||t.indexOf('self-powered miniature')>=0||
       t.indexOf('slim')>=0) return 'point';
    return 'other';
  }
  return{brand:brand,key:key,p:p,d:d,spl:extractSpl(d),weight:extractWeight(d),bw:extractBw(d),use:p.use||'',ptype:getPType(p)};
}

function applyCmpFilter(){
  var ref=getCmpARef();
  var panel=document.getElementById('cmpFilterPanel');
  if(!ref){if(panel)panel.style.display='none';return;}
  if(panel)panel.style.display='';
  var lfF=(document.getElementById('cmpLfFilter')||{value:''}).value||'';
  var refD=(ref.p.spec&&ref.p.spec.detail)||{};
  var refLfInch=maxInchInStr(refD.lf||refD.lf_driver);

  // ptype 분류 헬퍼 (applyCmpFilter 내부용)
  function classifyPtype(p2){
    var t=(p2.t||'').toLowerCase(), n=(p2.n||'').toLowerCase();
    if(t.indexOf('subwoofer')>=0||t.indexOf('low-frequency')>=0||
       t.indexOf('lf extension')>=0||t.indexOf('infra sub')>=0||
       t.indexOf('low frequency')>=0||t.indexOf('lfc')>=0||
       /^(ks|sb|cs1)/.test(n)||n.indexOf('k1-sb')>=0||
       n==='syva sub'||n==='syva low') return 'sub';
    if(t.indexOf('augmented array')>=0||t.indexOf('a series')>=0) return 'aug';
    // Column Speaker: LA S-Series만 (d&b CCL은 라인어레이로 분류)
    if((t.indexOf('s series')>=0||t.indexOf('colinear source')>=0||
        t.indexOf('u series')>=0)&&t.indexOf('compact column')<0) return 'column';
    if(t.indexOf('stage monitor')>=0||n.indexOf('mjf')>=0) return 'monitor';
    // Line Array: CCL (Compact Column Line) 포함
    if(t.indexOf('line array')>=0||t.indexOf('wst')>=0||t.indexOf('puls')>=0||
       t.indexOf('variable curvature')>=0||t.indexOf('compact line source')>=0||
       t.indexOf('compact column')>=0||
       t.indexOf('k series')>=0||t.indexOf('l series')>=0||
       t.indexOf('ccl')>=0) return 'line';
    if(t.indexOf('point source')>=0||t.indexOf('x series')>=0||
       t.indexOf('installation point')>=0||t.indexOf('ultracompact')>=0||
       t.indexOf('ceiling')>=0||t.indexOf('self-powered miniature')>=0||
       t.indexOf('slim')>=0) return 'point';
    return 'other';
  }

  // B 드롭다운 재생성 (hidden 방식 대신 innerHTML 방식)
  var selB=document.getElementById('cmpB');
  var prevB=selB.value;
  var opts='<option value="">제품 선택…</option>';
  var shown=0;
  Object.keys(BRANDS).forEach(function(bn){
    var bd=BRANDS[bn].data;
    var inner='';
    Object.keys(bd).forEach(function(k){
      var p2=bd[k]; if(!p2||!p2.n) return;
      // 자기 자신 제외
      if(bn===ref.brand&&k===ref.key) return;
      var d2=(p2.spec&&p2.spec.detail)||{};
      var spl2=extractSpl(d2); var wt2=extractWeight(d2); var bw2=extractBw(d2);
      var ok=true;
      // LF 드라이버 인치수 필터 (동일 / 유사 ±2")
      if(lfF==='same'||lfF==='similar'){
        var lf2Inch=maxInchInStr(d2.lf||d2.lf_driver);
        var tol=lfF==='same'?0:2;
        ok=ok&&(refLfInch>0&&lf2Inch>0&&Math.abs(refLfInch-lf2Inch)<=tol);
      }
      // 제품 분류 동기화 (ptype)
      if(ref.ptype&&ref.ptype!=='other'){
        var pt2=classifyPtype(p2);
        ok=ok&&(pt2===ref.ptype||pt2==='other');
      }
      if(ok){
        inner+='<option value="'+bn+'::'+k+'">'+p2.n+'</option>';
        shown++;
      }
    });
    if(inner) opts+='<optgroup label="'+bn+'">'+inner+'</optgroup>';
  });
  selB.innerHTML=opts;
  // 이전 선택 복원
  if(prevB&&selB.querySelector('option[value="'+prevB.replace(/"/g,'\"')+'"]')) selB.value=prevB;
  else selB.value='';

  var cnt=document.getElementById('cmpBCount');
  if(cnt) cnt.textContent=shown+'개 제품이 조건에 맞습니다.';
  // cmpC도 동일한 필터 적용 (B와 동일 로직)
  var selC=document.getElementById('cmpC');
  if(selC){
    var prevC=selC.value;
    var optsC='<option value="">제품 선택…</option>';
    Object.keys(BRANDS).forEach(function(bn){
      var bd=BRANDS[bn].data;
      var innerC='';
      Object.keys(bd).forEach(function(k){
        var p2=bd[k]; if(!p2||!p2.n) return;
        if(bn===ref.brand&&k===ref.key) return;
        var d2=(p2.spec&&p2.spec.detail)||{};
        var spl2=extractSpl(d2); var wt2=extractWeight(d2); var bw2=extractBw(d2);
        var ok=true;
        // LF 드라이버 인치수 필터 (동일 / 유사 ±2")
        if(lfF==='same'||lfF==='similar'){
          var lf2Inch=maxInchInStr(d2.lf||d2.lf_driver);
          var tol=lfF==='same'?0:2;
          ok=ok&&(refLfInch>0&&lf2Inch>0&&Math.abs(refLfInch-lf2Inch)<=tol);
        }
        if(ref.ptype&&ref.ptype!=='other'){var pt2c=classifyPtype(p2);ok=ok&&(pt2c===ref.ptype||pt2c==='other');}
        if(ok) innerC+='<option value="'+bn+'::'+k+'">'+p2.n+'</option>';
      });
      if(innerC) optsC+='<optgroup label="'+bn+'">'+innerC+'</optgroup>';
    });
    selC.innerHTML=optsC;
    if(prevC&&selC.querySelector('option[value="'+prevC.replace(/"/g,'\\"')+'"]')) selC.value=prevC;
    else selC.value='';
  }
  renderCompare();
}

function cmpCard(brand, key, hl, refRows){
  var bd = BRANDS[brand]; if(!bd) return '';
  var p = bd.data[key]; if(!p) return '';
  var s = p.spec || {};
  var d = Object.assign({}, s.detail || {});
  if(!d.max_spl&&!d.max_spl_by_amp&&!d.linear_peak&&!d.aes75&&s.spl) d._spec_spl=s.spl;
  if(!d.presets&&!d.operating_range&&!d.freq_response_5db&&s.bw) d._spec_bw=s.bw;
  if(!d.dim_full&&s.dim) d._spec_dim=s.dim;
  var imgSrc = (p.img && bd.img[p.img]) ? bd.img[p.img] : (bd.img[key] || null);
  var imgHtml = imgSrc ? '<div class="cmp-card-img"><img src="'+imgSrc+'"></div>' : '<div class="cmp-card-img empty">사진 없음</div>';

  // Card highlight class
  var thisKey = brand+':'+key;
  var cardCls = 'cmp-card';

  // Base rows (brand spec keys)
  var baseRows = '<div class="cmp-spec-row"><span class="cmp-spec-k">크로스오버 방식</span><span class="cmp-spec-v">'+(p.amp||'')+'</span></div>'+
                 '<div class="cmp-spec-row"><span class="cmp-spec-k">용도</span><span class="cmp-spec-v">'+(p.use||'')+'</span></div>';

  // Detail rows
  var myRows = extractDetailRows(d, brand);

  // If refRows provided (B card follows A's row labels)
  var detailHtml = '';
  var rowsToShow = refRows || myRows;
  if(rowsToShow.length){
    rowsToShow.forEach(function(ref){
      // Find matching row in myRows
      var myRow = myRows.filter(function(r){ return r.label === ref.label; })[0];
      var val = myRow ? myRow.val : '';
      var numVal = myRow ? myRow.numVal : null;
      // Highlight: compare numVals
      var valHtml = '<span class="cmp-spec-v">'+(val||'<span style="opacity:.25">—</span>')+'</span>';
      detailHtml += '<div class="cmp-spec-row"><span class="cmp-spec-k">'+ref.label+'</span>'+valHtml+'</div>';
    });
  }

  return '<div class="'+cardCls+'">'+imgHtml+'<div class="cmp-card-body">'+
    '<div class="cmp-brand" style="color:'+bd.color+'">'+brand+'</div>'+
    '<div class="cmp-card-name">'+p.n+'</div>'+
    '<div class="cmp-card-type">'+(p.t||'')+'</div>'+
    baseRows+
    '<div class="cmp-detail-divider"></div>'+
    detailHtml+
    '</div></div>';
}

function renderCompare(){
  var a=document.getElementById('cmpA').value;
  var b=document.getElementById('cmpB').value;
  var c=document.getElementById('cmpC').value;
  var res=document.getElementById('cmpResult');
  if(!a&&!b&&!c){res.innerHTML='<div class="ph-block">제품을 선택하면 비교 결과가 표시됩니다.</div>';return;}
  function mkRef(val){
    if(!val)return null; var pts=val.split('::'); if(pts.length<2)return null;
    var bd=BRANDS[pts[0]]; if(!bd)return null; var p=bd.data[pts[1]]; if(!p)return null;
    var ps=p.spec||{};
    var d=Object.assign({},ps.detail||{});
    if(!d.max_spl&&!d.max_spl_by_amp&&!d.linear_peak&&!d.aes75&&ps.spl) d._spec_spl=ps.spl;
    if(!d.presets&&!d.operating_range&&!d.freq_response_5db&&ps.bw) d._spec_bw=ps.bw;
    if(!d.dim_full&&ps.dim) d._spec_dim=ps.dim;
    return{brand:pts[0],key:pts[1],p:p,d:d,spl:extractSpl(d),weight:extractWeight(d),bw:extractBw(d)};
  }
  var refA=a?mkRef(a):null, refB=b?mkRef(b):null, refC=c?mkRef(c):null;
  var aRows=refA?extractDetailRows(refA.d,refA.brand):null;
  var hlB=null;
  var hlC=null;
  var html='<div class="cmp-grid">';
  if(a){var pa=a.split('::');html+=cmpCard(pa[0],pa[1],null,null);}
  else html+='<div class="cmp-card"><div class="cmp-card-img empty">제품 A 미선택</div></div>';
  if(b){var pb=b.split('::');html+=cmpCard(pb[0],pb[1],hlB,aRows);}
  else html+='<div class="cmp-card"><div class="cmp-card-img empty">제품 B 미선택</div></div>';
  if(c){var pc=c.split('::');html+=cmpCard(pc[0],pc[1],hlC,aRows);}
  else html+='<div class="cmp-card"><div class="cmp-card-img empty">제품 C 미선택</div></div>';
  html+='</div>'; res.innerHTML=html;
}

function updateCmp(){renderCompare();}
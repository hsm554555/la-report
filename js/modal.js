function buildDnbAmpPanel(at){
  if(!at||!at.rows||!at.rows.length) return '<div class="amp-rec-empty">데이터 없음</div>';
  var amps=at.amps||[];
  var rows=at.rows.map(function(r){
    var note=r.note?'<span style="font-size:10px;opacity:.55;display:block;margin-top:2px;">'+r.note+'</span>':'';
    return '<tr><td class="spk-col">'+r.setup+'</td><td class="dnb-cabs"><span class="per">'+r.cabs+'</span>개/ch'+note+'</td></tr>';
  }).join('');
  return '<div class="amp-rec-header">Setup별 채널당 스피커 수<span style="font-size:10px;opacity:.4;font-weight:400;margin-left:6px;">(Cabinets per channel)</span></div>'+
    '<div style="font-size:11px;margin:4px 0 8px;opacity:.75;">권장 앰프: <b style="color:#eee;">'+amps.join(' / ')+'</b></div>'+
    '<table class="amp-rec-table"><thead><tr><th class="spk-col">Setup</th><th>Cabs/ch</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table>'+
    (at.note?'<div class="amp-rec-note">'+at.note+'</div>':'');
}

function toggleDnbAmpRec(btn){
  var key=btn.getAttribute('data-key');
  var panel=document.getElementById('dnb-amp-rec-'+key);
  if(!panel) return;
  var isOpen=panel.classList.contains('open');
  panel.classList.toggle('open',!isOpen);
  btn.classList.toggle('open',!isOpen);
  if(!isOpen) panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function buildAmpRecPanel(at){
  if(!at || !at.rows || !at.rows.length) return '<div class="amp-rec-empty">데이터 준비 중</div>';
  var amps = at.amps || [];
  var thCols = amps.map(function(a){
    return '<th>'+a+'</th>';
  }).join('');
  function fmtCell(val){
    if(!val) return '<td style="color:rgba(255,255,255,.15);">—</td>';
    // "1/4 (SE), 1/2 (BTL)" → split by ", " first, then each part by "/"
    var modes = val.split(', ');
    var lines = modes.map(function(mode){
      var slash = mode.indexOf('/');
      if(slash < 0) return '<span class="per">'+mode+'</span>';
      var per = mode.slice(0, slash).trim();
      var tot = mode.slice(slash+1).trim();
      return '<span class="per">'+per+'</span><span class="sep">/</span><span class="tot">'+tot+'</span>';
    });
    return '<td>'+lines.join('<br>')+'</td>';
  }
  var rows = at.rows.map(function(r){
    var cells = amps.map(function(a){ return fmtCell(r.data[a]); }).join('');
    return '<tr><td class="spk-col">'+r.n+'</td>'+cells+'</tr>';
  }).join('');
  return '<div class="amp-rec-header">앰프별 구동 용량 <span style="font-size:10px;opacity:.4;font-weight:400;">per output* / total</span></div>'+
         '<table class="amp-rec-table">'+
         '<thead><tr><th class="spk-col">스피커</th>'+thCols+'</tr></thead>'+
         '<tbody>'+rows+'</tbody>'+
         '</table>'+
         (at.note ? '<div class="amp-rec-note">'+at.note+'</div>' : '');
}

function toggleAmpRec(btn){
  var key = btn.getAttribute('data-key');
  var panel = document.getElementById('amp-rec-'+key);
  if(!panel) return;
  var isOpen = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
  if(!isOpen) panel.scrollIntoView({behavior:'smooth', block:'nearest'});
}
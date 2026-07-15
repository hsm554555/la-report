function tagClass(t){
  if(t.indexOf('2026')>=0||t.indexOf('Pilot')>=0) return 'ptag pilot';
  if(t.indexOf('2024')>=0||t.indexOf('2023')>=0||t.indexOf('PULS')>=0) return 'ptag new';
  if(t.indexOf('플래그십')>=0||t.indexOf('표준')>=0||t.indexOf('기준')>=0||t.indexOf('레퍼런스')>=0) return 'ptag flag';
  return 'ptag';
}

function buildSpecDetail(d){
  if(!d) return '';
  var groups = [];
  if(d.coverage || d.h_coverage || d.enclosure_dir || d.waveguide_dir || d.conical_coverage || d.rotatable_horn){
    var covRows = [];
    if(d.coverage){ var covLabel = d.coverage_label || 'Nominal directivity (-6 dB)'; covRows.push([covLabel, d.coverage]); }
    var simpleDeg = /^\d+(\.\d+)?°$/;
    if(d.h_coverage && d.v_coverage && simpleDeg.test(d.h_coverage) && simpleDeg.test(d.v_coverage)){
      covRows.push(['Coverage (H × V)', d.h_coverage+' × '+d.v_coverage]);
    } else {
      if(d.h_coverage) covRows.push(['Horizontal coverage', d.h_coverage]);
      if(d.v_coverage) covRows.push(['Vertical coverage', d.v_coverage]);
    }
    if(d.conical_coverage) covRows.push(['Conical coverage (axisymmetric)', d.conical_coverage]);
    if(d.rotatable_horn) covRows.push(['Rotatable horn (H × V)', d.rotatable_horn]);
    if(d.splay) covRows.push(['Splay angle settings', d.splay]);
    if(d.enclosure_dir) covRows.push(['Enclosure directivity', d.enclosure_dir]);
    if(d.waveguide_dir_upper) covRows.push(['Waveguide directivity (upper)', d.waveguide_dir_upper]);
    if(d.waveguide_dir_lower) covRows.push(['Waveguide directivity (lower)', d.waveguide_dir_lower]);
    if(d.waveguide_dir) covRows.push(['Waveguide directivity', d.waveguide_dir]);
    if(d.active_cardioid) covRows.push(['Active Cardioid', d.active_cardioid]);
    groups.push({h:'Coverage', rows:covRows});
  }
  var tr = [];
  if(d.lf) tr.push(['LF transducer', d.lf]);
  if(d.mf) tr.push(['MF transducer', d.mf]);
  if(d.hf) tr.push(['HF transducer', d.hf]);
  if(d.impedance) tr.push(['Nominal impedance', d.impedance]);
  if(d.power) tr.push(['RMS power handling', d.power]);
  if(tr.length) groups.push({h:'Transducers & Power', rows:tr});
  (d.presets||[]).forEach(function(pr){
    var rows = [];
    if(pr.bw10) rows.push(['Bandwidth (-10 dB)', pr.bw10]);
    if(pr.bw6) rows.push(['Bandwidth (-6 dB)', pr.bw6]);
    if(pr.bw3) rows.push(['Bandwidth (-3 dB)', pr.bw3]);
    if(pr.spl) rows.push(['Maximum SPL', pr.spl]);
    if(rows.length) groups.push({h:pr.n, rows:rows});
  });
  if(d.operating_range||d.max_spl||d.aes75||d.phase){
    var ar=[];
    if(d.operating_range) ar.push(['Operating frequency range',d.operating_range]);
    if(d.freq_response) ar.push(['Frequency response',d.freq_response]);
    if(d.phase) ar.push(['Phase response',d.phase]);
    if(d.max_spl) ar.push(['Maximum SPL',d.max_spl]);
    if(d.aes75) ar.push(['AES75 max linear SPL',d.aes75]);
    if(d.linear_peak) ar.push(['Linear Peak SPL',d.linear_peak]);
    if(ar.length) groups.push({h:'Acoustics',rows:ar});
  }
  if(d.splay||d.freq_response_5db||d.freq_response_cut||d.power_handling||d.max_spl_by_amp){
    var da=[];
    if(d.freq_response_5db) da.push(['Freq response (-5 dB, standard)', d.freq_response_5db]);
    if(d.freq_response_mode) da.push(['Freq response (-5 dB, mode)', d.freq_response_mode]);
    if(d.freq_response_infra) da.push(['Freq response (-5 dB, INFRA mode)', d.freq_response_infra]);
    if(d.freq_response_cut) da.push(['Freq response (-5 dB, CUT mode)', d.freq_response_cut]);
    if(d.freq_response_10db) da.push(['Freq response (-10 dB, IEC60268)', d.freq_response_10db]);
    if(d.freq_response_10db_cut) da.push(['Freq response (-10 dB, CUT, IEC60268)', d.freq_response_10db_cut]);
    if(d.impedance) da.push(['Nominal impedance', d.impedance]);
    if(d.power_handling) da.push(['Power handling (RMS / peak 10ms)', d.power_handling]);
    if(d.max_spl_by_amp) da.push(['Maximum SPL (by amplifier)', d.max_spl_by_amp]);
    if(d.max_spl_4cab) da.push(['Maximum SPL (4× cabinets)', d.max_spl_4cab]);
    if(da.length) groups.push({h:'Acoustics',rows:da});
  }
  var ph = [];
  if(d.dim_full) ph.push(['Dimensions (W × H × D)', d.dim_full]);
  if(d.weight) ph.push(['Weight (net)', d.weight]);
  if(d.connectors) ph.push(['Connectors', d.connectors]);
  if(d.ip) ph.push(['IP rating', d.ip]);
  if(ph.length) groups.push({h:'Physical', rows:ph});
  return '<div class="spec-detail">' + groups.map(function(g){
    return '<div class="sd-group"><div class="sd-group-h">'+g.h+'</div>' +
      g.rows.map(function(r){ return '<div class="sd-row"><span class="sd-k">'+r[0]+'</span><span class="sd-v">'+r[1]+'</span></div>'; }).join('') +
      '</div>';
  }).join('') + '</div>';
}

function specCard(label,v){ return v ? '<div class="spec-card"><div class="spec-label">'+label+'</div><div class="spec-val">'+v+'</div></div>' : ''; }

function render(key){
  var p = P[key]; if(!p) return;
  var tagHtml = p.tags.map(function(t){ return '<span class="'+tagClass(t)+'">'+t+'</span>'; }).join('');
  var s = p.spec || {};
  var imgHtml;
  if(p.img && IMG[p.img]){
    imgHtml = '<div class="prod-img"><img src="'+IMG[p.img]+'" alt="'+p.n+'"><div class="prod-img-name">L-Acoustics '+p.n+'</div></div>';
  } else {
    imgHtml = '<div class="prod-img empty"><div class="prod-img-ph"><span>'+p.n+' 사진<br>업로드 예정</span></div><div class="prod-img-name">L-Acoustics '+p.n+'</div></div>';
  }
  document.getElementById('detail-area').innerHTML =
    '<div class="prod-detail">'+
      '<div class="prod-info">'+
        '<div class="prod-name-row">'+
          '<div class="prod-name">'+p.n+'</div>'+
          (AMP_TABLE[key] ? '<button class="amp-rec-btn" onclick="toggleAmpRec(this)" data-key="'+key+'">앰프 추천 <span class="arr">▾</span></button>' : '')+
        '</div>'+
        '<div class="prod-type">'+p.t+'</div>'+
        '<div class="prod-tags"><span class="ptag type">'+p.amp+' · '+p.use+'</span>'+tagHtml+'</div>'+
        (function(){
          if(s.detail) return buildSpecDetail(s.detail);
          var cards = specCard('Max SPL',s.spl)+specCard('Components',s.comp)+specCard('Bandwidth (-10 dB)',s.bw)+specCard('Directivity (-6 dB, H×V)',s.dir)+specCard('Dimensions (W×H×D)',s.dim);
          return cards ? '<div class="spec-grid">'+cards+'</div>' : '';
        })()+
        '<div class="prod-note">'+p.note+'</div>'+
      '</div>'+
      imgHtml+
    '</div>'+
    (AMP_TABLE[key] ? '<div class="amp-rec-panel" id="amp-rec-'+key+'">'+buildAmpRecPanel(AMP_TABLE[key])+'</div>' : '');
}

function mSpecCard(label,v){ return v ? '<div class="spec-card"><div class="spec-label">'+label+'</div><div class="spec-val">'+v+'</div></div>' : ''; }

function mRender(key){
  var p = P_MEYER[key]; if(!p) return;
  var s = p.spec || {};
  var tagHtml = (p.tags||[]).map(function(t){ return '<span class="ptag">'+t+'</span>'; }).join('');
  var imgHtml;
  if(p.img && IMG_MEYER[p.img]) imgHtml = '<div class="prod-img"><img src="'+IMG_MEYER[p.img]+'" alt="'+p.n+'"><div class="prod-img-name">Meyer Sound '+p.n+'</div></div>';
  else imgHtml = '<div class="prod-img empty"><div class="prod-img-ph"><span>'+p.n+'</span></div></div>';
  var detailHtml = buildSpecDetail(s.detail);
  var cards = detailHtml ? '' : (mSpecCard('Coverage',s.spl)+mSpecCard('Frequency Range',s.bw)+mSpecCard('Directivity (H)',s.dir)+mSpecCard('Dimensions (W×H×D)',s.dim)+mSpecCard('Weight',s.wt));
  document.getElementById('m-detail-area').innerHTML =
    '<div class="prod-detail"><div class="prod-info">'+
      '<div class="prod-name">'+p.n+'</div><div class="prod-type">'+p.t+'</div>'+
      '<div class="prod-tags"><span class="ptag type">'+p.amp+' · '+p.use+'</span>'+tagHtml+'</div>'+
      (detailHtml || (cards ? '<div class="spec-grid">'+cards+'</div>' : ''))+
      '<div class="prod-note">'+p.note+'</div>'+
    '</div>'+imgHtml+'</div>';
}

function dSpecCard(label,v){ return v ? '<div class="spec-card"><div class="spec-label">'+label+'</div><div class="spec-value">'+v+'</div></div>' : ''; }

function dRender(key){
  var p = P_DNB[key]; if(!p) return;
  var s = p.spec || {};
  var tagHtml = (p.tags||[]).map(function(t){ return '<span class="ptag">'+t+'</span>'; }).join('');
  var imgHtml;
  var imgSrc = (p.img && IMG_DNB[p.img]) ? IMG_DNB[p.img] : (IMG_DNB[key] || null);
  if(imgSrc) imgHtml = '<div class="prod-img"><img src="'+imgSrc+'" alt="'+p.n+'"><div class="prod-img-name">d&b audiotechnik '+p.n+'</div></div>';
  else imgHtml = '<div class="prod-img empty"><div class="prod-img-ph"><span>'+p.n+'</span></div></div>';
  var detailHtml = buildSpecDetail(s.detail);
  var cards = detailHtml ? '' : (dSpecCard('Max SPL',s.spl)+dSpecCard('Components',s.comp)+dSpecCard('Dispersion',s.disp)+dSpecCard('Weight',s.wt));
  document.getElementById('d-detail-area').innerHTML =
    '<div class="prod-detail"><div class="prod-info">'+
      '<div class="prod-name-row"><div class="prod-name">'+p.n+'</div>'+(DNB_AMP_TABLE[key] ? '<button class="amp-rec-btn" onclick="toggleDnbAmpRec(this)" data-key="'+key+'">앰프 매칭 <span class="arr">▾</span></button>' : '')+
      '</div>'+  '<div class="prod-type">'+p.t+'</div>'+
      '<div class="prod-tags"><span class="ptag type">'+p.amp+' · '+p.use+'</span>'+tagHtml+'</div>'+
      (detailHtml || (cards ? '<div class="spec-grid">'+cards+'</div>' : ''))+
      '<div class="prod-note">'+p.note+'</div>'+
    '</div>'+imgHtml+'</div>'+
    (DNB_AMP_TABLE[key] ? '<div class="amp-rec-panel" id="dnb-amp-rec-'+key+'">'+buildDnbAmpPanel(DNB_AMP_TABLE[key])+'</div>' : '');
}
function renderSoftwareCards(software){
  var map = {'L-Acoustics':'#software .sw-grid','Meyer Sound':'#m_software .sw-grid','d&b audiotechnik':'#d_software .sw-grid'};
  Object.keys(map).forEach(function(brand){
    var el = document.querySelector(map[brand]);
    if (!el) return;
    var items = software[brand] || [];
    el.innerHTML = items.map(function(f){
      var meta = f.meta || '';
      return '<div class="sw-card"><div class="sw-card-top">'
        +'<div class="sw-card-img"><img src="'+f.img+'" alt="'+f.imgAlt+'" style="'+f.imgStyle+'"></div>'
        +'<div class="sw-card-right"><div class="sw-name">'+f.name+'</div><div class="sw-type">'+f.type+'</div></div></div>'
        +'<div class="sw-card-body"><div class="sw-desc">'+f.desc+'</div><div class="sw-edge">'+f.edge+'</div></div>'
        +'<div class="sw-card-footer"><a href="'+f.linkHref+'" target="_blank" rel="noopener" class="sw-link">'+f.linkHtml+'</a>'+meta+'</div></div>';
    }).join('');
  });
}

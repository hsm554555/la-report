function extractSpl(d){
  if(!d) return 0;
  // 1. AES75: 'NNN dBZ' → NNN
  if(d.aes75){
    var az = d.aes75.match(/(\d+(?:\.\d+)?)\s*dBZ(?![pk])/);
    if(az) return parseFloat(az[1]);
  }
  // 2. linear_peak: '112 dB (M-noise...) · ...' → 112
  if(d.linear_peak){
    var lp = d.linear_peak.match(/(\d+(?:\.\d+)?)\s*dB/);
    if(lp) return parseFloat(lp[1]);
  }
  // 3. max_spl, max_spl_by_amp, presets
  var s = d.max_spl || d.max_spl_by_amp ||
          (d.presets && d.presets[0] && (d.presets[0].spl || d.presets[0].max_spl)) ||
          d._spec_spl || '';
  var m = (s+'').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function extractWeight(d){
  if(!d)return 0; var w=(d.weight||''); var m=w.match(/([\d.]+)\s*kg/); return m?parseFloat(m[1]):0;
}

function extractBw(d){
  if(!d)return 999;
  var bw=(d.freq_response_5db||d.operating_range||(d.presets&&d.presets[0]&&d.presets[0].bw10)||'');
  var m=(bw+'').match(/(\d+)\s*Hz/); return m?parseInt(m[1]):999;
}

function extractDetailRows(d, brand){
  // Returns array of {label, val, numVal} for comparison rows
  var rows = [];
  function add(label, val, numFn){
    var nv = numFn ? numFn(val) : null;
    rows.push({label:label, val:val||'', numVal:nv});
  }
  if(!d) return rows;
  // SPL
  var splVal = extractSpl(d);
  var splStr = d.aes75 ? (function(){
      var m=d.aes75.match(/(\d+(?:\.\d+)?)\s*dBZ(?![pk])/);
      return m ? m[1]+' dBZ' : '';
    })() : d.linear_peak ? (function(){
      var m=d.linear_peak.match(/(\d+(?:\.\d+)?)\s*dB/);
      return m ? m[1]+' dB' : '';
    })() : d.max_spl || d.max_spl_by_amp ||
           (d.presets&&d.presets[0]&&(d.presets[0].spl||d.presets[0].max_spl)) ||
           d._spec_spl || '';
  if(splStr || splVal) add('Max SPL', splStr || (splVal+' dB'), function(){ return splVal; });
  // 커버리지
  var simpleDeg = /^\d+(\.\d+)?°$/;
  if(d.h_coverage && d.v_coverage && simpleDeg.test(d.h_coverage) && simpleDeg.test(d.v_coverage)){
    // 가로·세로 모두 단순 각도값이면 "H × V" 한 줄로 합쳐서 표기
    add('커버리지 (H × V)', d.h_coverage+' × '+d.v_coverage, null);
  } else {
    var covSrc = d.waveguide_dir ? 'waveguide_dir' : d.coverage ? 'coverage' : d.h_coverage ? 'h_coverage' :
                 d.conical_coverage ? 'conical_coverage' : d.enclosure_dir ? 'enclosure_dir' : d.rotatable_horn ? 'rotatable_horn' : '';
    var cov = covSrc ? d[covSrc] : '';
    if(cov){
      // h_coverage가 단일 축(가로) 값만 담고 있을 때만 (Horizontal) 라벨 표기
      var isSingleAxis = covSrc==='h_coverage' && cov.indexOf('×')<0 && cov.toLowerCase().indexOf('conical')<0;
      add(isSingleAxis ? '커버리지 (Horizontal)' : '커버리지', cov, null);
    }
    if(d.v_coverage) add('커버리지 (Vertical)', d.v_coverage, null);
  }
  if(d.splay) add('스플레이', d.splay, null);
  // 트랜스듀서
  var lf = [d.lf, d.mf?'MF: '+d.mf:'', d.hf?'HF: '+d.hf:''].filter(Boolean).join(' / ');
  if(lf) add('트랜스듀서', lf, null);
  if(d.impedance) add('임피던스', d.impedance, null);
  if(d.power_handling||d.power) add('파워 핸들링', d.power_handling||d.power, null);
  // 주파수 응답
  if(d.presets&&d.presets.length){
    var pr=d.presets[0];
    if(pr.bw10) add('대역폭 (-10 dB)', pr.bw10, function(v){
      var m=(v||'').match(/(\d+)/); return m?parseInt(m[1]):null;
    });
  }
  if(d.operating_range) add('동작 주파수 범위', d.operating_range, function(v){
    var m=(v||'').match(/(\d+)/); return m?parseInt(m[1]):null;
  });
  if(d.freq_response_5db) add('주파수 응답 (-5 dB)', d.freq_response_5db, function(v){
    var m=(v||'').match(/(\d+)/); return m?parseInt(m[1]):null;
  });
  if(!d.presets&&!d.operating_range&&!d.freq_response_5db&&d._spec_bw) add('대역폭 (-10 dB)', d._spec_bw, function(v){
    var m=(v||'').match(/(\d+)/); return m?parseInt(m[1]):null;
  });
  // 무게
  add('무게', d.weight, function(v){
    var m=(v||'').match(/([\d.]+)\s*kg/); return m?parseFloat(m[1]):null;
  });
  // 치수
  if(d.dim_full) add('치수', d.dim_full, null);
  else if(d._spec_dim) add('치수', d._spec_dim, null);
  if(d.ip) add('IP 등급', d.ip, null);
  return rows;
}

function splNum(v){ if(!v) return 0; var m = String(v).match(/(\d+)\s*dB/); return m ? parseInt(m[1]) : 0; }

function dSplNumAll(v){if(!v)return 0;var s=String(v);var m=s.match(/(\d+(?:\.\d+)?)\s*dB/);if(m)return parseFloat(m[1]);m=s.match(/(\d+(?:\.\d+)?)/);return m?parseFloat(m[1]):0;}

function extractSplAll(d,p){var fromDetail=dSplNumAll(d.aes75)||dSplNumAll(d.linear_peak)||dSplNumAll(d.max_spl_by_amp)||dSplNumAll(d.max_spl)||dSplNumAll(d._spec_spl)||0;var fromSpec=p&&p.spec?dSplNumAll(p.spec.spl)||0:0;return fromDetail||fromSpec;}

function extractBwAll(d){var v=d.operating_range||d.freq_response_5db||d.bandwidth||'';var m=String(v).match(/(\d+)\s*(?:Hz)?\s*[-\u2013]/);return m?parseInt(m[1]):999;}

function extractWeightAll(d){var v=d.weight||'';var m=String(v).match(/(\d+(?:\.\d+)?)/);return m?parseFloat(m[1]):9999;}

function extractLfInchAll(d){var v=d.lf||d.lf_driver||'';var m=String(v).match(/(\d+)[\"″]/);if(m)return parseInt(m[1]);m=String(v).match(/(\d+)/);return m?parseInt(m[1]):0;}

function extractCovAll(d){return d.waveguide_dir||d.coverage||d.h_coverage||d.conical_coverage||d.enclosure_dir||'';}

function classifyPtypeAll(p){
  var t=(p.t||'').toLowerCase(),n=(p.n||'').toLowerCase();
  if(t.indexOf('subwoofer')>=0||t.indexOf('lf extension')>=0||t.indexOf('infra sub')>=0||t.indexOf('low frequency')>=0||t.indexOf('lfc')>=0||/^(ks|sb|cs1)/.test(n)||n.indexOf('k1-sb')>=0||n==='syva sub'||n==='syva low') return 'sub';
  if(t.indexOf('augmented array')>=0||t.indexOf('a series')>=0) return 'aug';
  if((t.indexOf('s series')>=0||t.indexOf('colinear source')>=0||t.indexOf('u series')>=0)&&t.indexOf('compact column')<0) return 'column';
  if(t.indexOf('stage monitor')>=0||n.indexOf('mjf')>=0) return 'monitor';
  if(t.indexOf('line array')>=0||t.indexOf('wst')>=0||t.indexOf('puls')>=0||t.indexOf('variable curvature')>=0||t.indexOf('compact line source')>=0||t.indexOf('compact column')>=0||t.indexOf('k series')>=0||t.indexOf('l series')>=0||t.indexOf('ccl')>=0) return 'line';
  if(t.indexOf('point source')>=0||t.indexOf('x series')>=0||t.indexOf('installation point')>=0||t.indexOf('ultracompact')>=0||t.indexOf('ceiling')>=0||t.indexOf('self-powered miniature')>=0||t.indexOf('slim')>=0) return 'point';
  return 'other';
}
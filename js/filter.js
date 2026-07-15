function applyProdFilter(){
  var q = (document.getElementById('prodQuery').value || '').toLowerCase().trim();
  var minSpl = parseInt(document.getElementById('splFilter').value) || 0;
  var ampF   = (document.getElementById('ampFilter')||{}).value || '';
  var useF   = (document.getElementById('useFilter')||{}).value || '';
  var drvF   = (document.getElementById('driverFilter')||{}).value || '';
  var wayF   = (document.getElementById('wayFilter')||{}).value || '';
  var bwF    = parseInt((document.getElementById('bwFilter')||{}).value) || 9999;
  var wtF    = (document.getElementById('weightFilter')||{}).value || '';
  var covF   = (document.getElementById('covFilter')||{}).value || '';
  var throwF = (document.getElementById('throwFilter')||{}).value || '';

  var stabs = document.querySelectorAll('.prod-left .stab');
  var shown = 0;
  stabs.forEach(function(st){
    var key = st.getAttribute('data-p');
    var p = P[key];
    if(!p){ st.classList.add('hidden'); return; }
    var d = (p.spec && p.spec.detail) || {};

    // 1. 텍스트
    var nameMatch = !q || p.n.toLowerCase().indexOf(q)>=0 || (p.t||'').toLowerCase().indexOf(q)>=0;

    // 2. Max SPL
    var spl = p.spec ? splNum(p.spec.spl) : 0;
    var splMatch = spl >= minSpl;

    // 3. 증폭/크로스오버 방식
    var ampMatch = !ampF || (function(){
      if(ampF==='Passive') return (p.amp||'').indexOf('Passive')>=0;
      if(ampF==='Active')  return (p.amp||'').indexOf('Active')>=0;
      return true;
    })();

    // 4. 용도
    var useMatch = !useF || (p.use||'')===useF;

    // 5. LF 드라이버 (선택 인치 이상)
    var drvMatch = !drvF || (function(){
      var lf=d.lf||'', target=parseFloat(drvF), maxI=0;
      var s=lf, qi=s.indexOf('"'), i=0;
      while(qi>=0){
        var j=qi-1;
        while(j>=0&&(s[j]>='0'&&s[j]<='9'||s[j]==='.')){ j--; }
        var n=parseFloat(s.slice(j+1,qi));
        if(!isNaN(n)&&n>maxI) maxI=n;
        i=qi+1; qi=s.indexOf('"',i);
      }
      if(drvF==='6') return maxI>=6;
      return maxI>=target;
    })();

    // 6. 웨이 구성
    var wayMatch = !wayF || (function(){
      var comp=(p.spec&&p.spec.comp)||'';
      var hasHf=!!d.hf, hasMf=!!d.mf;
      if(wayF==='sub')  return !hasHf&&!hasMf;
      if(wayF==='2')    return hasHf&&!hasMf;
      if(wayF==='3')    return hasMf||comp.indexOf('3-way')>=0;
      return true;
    })();

    // 7. 저역 하한
    var bwMatch = bwF>=9999 || (function(){
      var presets=d.presets||[];
      if(!presets.length) return true;
      var bw=(presets[0].bw10||'');
      var m=bw.match(/(\d+)\s*Hz/);
      return m?parseInt(m[1])<=bwF:true;
    })();

    // 8. 무게 (u=이하, o=이상)
    var wtOk = !wtF || (function(){
      var wt=(d.weight||'');
      var m=wt.match(/([\d.]+)\s*kg/);
      if(!m) return true;
      var kg=parseFloat(m[1]);
      if(wtF.charAt(0)==='u') return kg<=parseFloat(wtF.slice(1));
      if(wtF.charAt(0)==='o') return kg>=parseFloat(wtF.slice(1));
      return true;
    })();

    // 9. 커버리지
    var covMatch = !covF || (function(){
      var cov=(d.coverage||d.h_coverage||d.conical_coverage||'').toLowerCase();
      if(covF==='omni') return cov.indexOf('omni')>=0||cov.indexOf('360')>=0||cov.indexOf('standard')>=0;
      var degStr='';
      for(var ci=0;ci<cov.length;ci++){
        var ch=cov[ci];
        if(ch>='0'&&ch<='9'||ch==='.') degStr+=ch;
        else if(degStr) break;
      }
      var deg=parseFloat(degStr)||0;
      if(covF==='narrow') return deg>0&&deg<=60;
      if(covF==='mid')    return deg>60&&deg<=100;
      if(covF==='wide')   return deg>100;
      return true;
    })();

    // 10. 제품 분류 (throw / sub)
    var throwMatch = !throwF || (function(){
      var tags=(p.tags||[]).join(' ').toLowerCase();
      var t=(p.t||'').toLowerCase();
      var n=p.n.toLowerCase();
      if(throwF==='short')  return tags.indexOf('short')>=0||t.indexOf('short')>=0;
      if(throwF==='medium') return tags.indexOf('medium')>=0||t.indexOf('medium')>=0;
      if(throwF==='long')   return tags.indexOf('long')>=0||t.indexOf('long')>=0;
      if(throwF==='sub')    return t.indexOf('sub')>=0||n.indexOf('sb')>=0||n.indexOf('ks')>=0||n==='cs1';
      return true;
    })();

    var pass = nameMatch&&splMatch&&ampMatch&&useMatch&&drvMatch&&wayMatch&&bwMatch&&wtOk&&covMatch&&throwMatch;
    if(pass){ st.classList.remove('hidden'); shown++; }
    else     { st.classList.add('hidden'); }
  });
  document.querySelectorAll('#products .series-block').forEach(function(sb){
    var anyVisible=!!sb.querySelector('.stab:not(.hidden)');
    sb.classList.toggle('hidden',!anyVisible);
  });
  var c=document.getElementById('psCount');
  if(c) c.textContent=shown+'개 제품';
}

function resetProdFilters(){
  ['prodQuery','splFilter','ampFilter','useFilter','driverFilter','throwFilter','wayFilter','bwFilter','weightFilter','covFilter'].forEach(function(id){
    var el = document.getElementById(id); if(!el) return;
    if(el.tagName==='SELECT') el.selectedIndex=0; else el.value='';
  });
  applyProdFilter();
}

function covMatchAll(cov,covF){
  if(!covF)return true;
  var s=String(cov).toLowerCase();var nums=s.match(/\d+/g)||[];var first=nums.length?parseInt(nums[0]):0;
  if(covF==='omni')return s.indexOf('omni')>=0||s.indexOf('axi')>=0||s.indexOf('360')>=0;
  if(covF==='60')return first>0&&first<=60;
  if(covF==='90')return first>=80&&first<=100;
  if(covF==='120')return first>=120;
  return true;
}

function ampMatchAll(p,ampF){
  if(!ampF)return true;
  var a=(p.amp||'').toLowerCase();
  if(ampF==='Passive')return a.indexOf('passive')>=0;
  if(ampF==='Self')return a.indexOf('self-powered')>=0||a.indexOf('self powered')>=0;
  if(ampF==='Active')return a.indexOf('active')>=0&&a.indexOf('networked')<0&&a.indexOf('self')<0;
  if(ampF==='Networked')return a.indexOf('networked')>=0;
  return true;
}
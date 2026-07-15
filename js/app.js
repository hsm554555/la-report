function initApp(){
function switchPage(pg){
  var map = {all:'page-all',la:'page-la',meyer:'page-meyer',dnb:'page-dnb',compare:'page-compare'};
  var tabs = document.querySelectorAll('.bn-tab');
  for(var i=0;i<tabs.length;i++){
    if(tabs[i].getAttribute('data-page')===pg) tabs[i].classList.add('on');
    else tabs[i].classList.remove('on');
  }
  var pages = document.querySelectorAll('.page');
  for(var j=0;j<pages.length;j++) pages[j].classList.remove('on');
  var el = document.getElementById(map[pg]);
  if(el) el.classList.add('on');
  if(pg==='meyer' && window.__meyerFilter) window.__meyerFilter();
  if(pg==='dnb' && window.__dnbFilter) window.__dnbFilter();
  window.scrollTo(0,0);
}

(function(){
  var tabs = document.querySelectorAll('.bn-tab');
  for(var i=0;i<tabs.length;i++){
    (function(tab){
      tab.addEventListener('click', function(){ switchPage(tab.getAttribute('data-page')); });
    })(tabs[i]);
  }
})();

var mProducts = document.getElementById('m_products');

if(mProducts){
  mProducts.addEventListener('click',function(e){
    var t=e.target.closest('.stab'); if(!t) return;
    document.querySelectorAll('#m_products .stab').forEach(function(x){x.classList.remove('on')});
    t.classList.add('on'); mRender(t.dataset.mp);
  });
  mRender('m_panther_l');
  // Meyer 검색 + 필터
  var mq = document.getElementById('mProdQuery');
  function inchInStrM(str,inch){
    var s=str||'',i=0,found=false;
    while(i<s.length){
      var qi=s.indexOf('"',i); if(qi<0) break;
      var j=qi-1;
      while(j>=0&&(s[j]>='0'&&s[j]<='9'||s[j]==='.')){ j--; }
      var num=parseFloat(s.slice(j+1,qi));
      if(!isNaN(num)&&Math.abs(num-inch)<0.01){ found=true; break; }
      i=qi+1;
    }
    return found;
  }
  function mSplNum(str){
    if(!str) return 0;
    // AES75: 'NNN dBZ' → NNN (dBZ 앞 숫자)
    var az = str.match(/(\d+(?:\.\d+)?)\s*dBZ/);
    if(az) return parseFloat(az[1]);
    // linear_peak: '132.5 dB (M-noise...) · ...' → 첫 번째 dB 숫자
    var lp = str.match(/(\d+(?:\.\d+)?)\s*dB/);
    if(lp) return parseFloat(lp[1]);
    return 0;
  }
  function mFilter(){
    var q=(mq?mq.value||'':'').toLowerCase().trim();
    var minSpl=parseInt((document.getElementById('mSplFilter')||{}).value)||0;
    var useF=(document.getElementById('mUseFilter')||{}).value||'';
    var drvF=(document.getElementById('mDriverFilter')||{}).value||'';
    var bwF=parseInt((document.getElementById('mBwFilter')||{}).value)||9999;
    var wtF=(document.getElementById('mWeightFilter')||{}).value||'';
    var covF=(document.getElementById('mCovFilter')||{}).value||'';
    var shown=0;
    document.querySelectorAll('#m_products .stab').forEach(function(st){
      var p=P_MEYER[st.getAttribute('data-mp')];
      if(!p){ st.classList.add('hidden'); return; }
      var d=(p.spec&&p.spec.detail)||{};
      var nameOk=!q||p.n.toLowerCase().indexOf(q)>=0;
      var splVal=mSplNum(d.aes75)||mSplNum(d.max_spl)||mSplNum(d.linear_peak||'');
      var splOk=splVal>=minSpl;
      var useOk=!useF||(p.use||'')===useF;
      var drvOk=!drvF||(function(){
        var lf=d.lf||'',target=parseFloat(drvF),maxI=0;
        var s=lf,qi=s.indexOf('"'),i=0;
        while(qi>=0){var j=qi-1;while(j>=0&&(s[j]>='0'&&s[j]<='9'||s[j]==='.')){j--;}
          var n=parseFloat(s.slice(j+1,qi));if(!isNaN(n)&&n>maxI)maxI=n;i=qi+1;qi=s.indexOf('"',i);}
        if(drvF==='6.5') return maxI>=6;
        return maxI>=target;
      })();
      var hfOk=true; // HF 필터 제거
      var bwOk=bwF>=9999||(function(){
        var or=(d.operating_range||''); var m=or.match(/(\d+)\s*Hz/);
        return m?parseInt(m[1])<=bwF:true;
      })();
      var wtOk=!wtF||(function(){
        var wt=(d.weight||'');
        var m=wt.match(/([\d.]+)\s*kg/);
        if(!m) return true; var kg=parseFloat(m[1]);
        if(wtF.charAt(0)==='u') return kg<=parseFloat(wtF.slice(1));
        if(wtF.charAt(0)==='o') return kg>=parseFloat(wtF.slice(1));
        return true;
      })()
      var covOk=!covF||(function(){
        var cov=(d.coverage||d.h_coverage||d.conical_coverage||'').toLowerCase();
        if(covF==='omni') return cov.indexOf('omni')>=0||cov.indexOf('360')>=0||cov.indexOf('standard')>=0;
        var degStr=''; for(var ci=0;ci<cov.length;ci++){ var ch=cov[ci]; if(ch>='0'&&ch<='9'||ch==='.') degStr+=ch; else if(degStr) break; }
        var deg=parseFloat(degStr)||0;
        if(covF==='narrow') return deg>0&&deg<=60;
        if(covF==='mid') return deg>60&&deg<=100;
        if(covF==='wide') return deg>100;
        return true;
      })();
            var dispF2=(document.getElementById('mDispFilter')||{}).value||'';
      var dispOk2=!dispF2||(function(){
        var sb=st.closest('.series-block');
        var sn=sb?((sb.querySelector('.sg-name')||{}).textContent||'').toLowerCase():'';
        // Line Array
        if(dispF2==='line') return sn.indexOf('line array')>=0;
        // Point Source: Point Source / Installation PS / UltraCompact / Slim / Ceiling / Self-powered Miniature
        if(dispF2==='point') return sn.indexOf('point source')>=0||
                                    sn.indexOf('installation point')>=0||
                                    sn.indexOf('ultracompact')>=0||
                                    sn.indexOf('slim')>=0||
                                    sn.indexOf('ceiling')>=0||
                                    sn.indexOf('self-powered miniature')>=0;
        // Sub: Low Frequency (LFC / Installation / Miniature)
        if(dispF2==='sub') return sn.indexOf('low frequency')>=0||sn.indexOf('lfc')>=0;
        if(dispF2==='monitor') return sn.indexOf('stage monitor')>=0||sn.indexOf('mjf')>=0;
        return true;
      })();

      var ok=nameOk&&splOk&&useOk&&drvOk&&hfOk&&bwOk&&wtOk&&covOk&&dispOk2;
      st.classList.toggle('hidden',!ok); if(ok) shown++;
    });
    document.querySelectorAll('#m_products .series-block').forEach(function(sb){
      var anyVisible=!!sb.querySelector('.stab:not(.hidden)');
      sb.classList.toggle('hidden',!anyVisible);
    });
    var c=document.getElementById('mPsCount'); if(c) c.textContent=shown+'개 제품';
  }
  function resetMeyerFilters(){
    ['mProdQuery','mSplFilter','mUseFilter','mDriverFilter','mBwFilter','mWeightFilter','mCovFilter','mDispFilter'].forEach(function(id){
      var el=document.getElementById(id); if(!el) return;
      if(el.tagName==='SELECT') el.selectedIndex=0; else el.value='';
    }); mFilter();
  }
  window.resetMeyerFilters = resetMeyerFilters;
  if(mq){ mq.addEventListener('input', mFilter); }
  ['mSplFilter','mUseFilter','mDriverFilter','mBwFilter','mWeightFilter','mCovFilter','mDispFilter'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.addEventListener('change',mFilter);
  });
  window.__meyerFilter = mFilter;
  mFilter();
}

var dProducts = document.getElementById('d_products');

if(dProducts){
  dProducts.addEventListener('click',function(e){
    var t=e.target.closest('.stab'); if(!t) return;
    document.querySelectorAll('#d_products .stab').forEach(function(x){x.classList.remove('on')});
    t.classList.add('on'); dRender(t.dataset.dp);
  });
  dRender('d_gsl8');
  var dq = document.getElementById('dProdQuery');
  function inchInStrD(str,inch){
    var s=str||'',i=0,found=false;
    while(i<s.length){
      var qi=s.indexOf('"',i); if(qi<0) break;
      var j=qi-1;
      while(j>=0&&(s[j]>='0'&&s[j]<='9'||s[j]==='.')){ j--; }
      var num=parseFloat(s.slice(j+1,qi));
      if(!isNaN(num)&&Math.abs(num-inch)<0.01){ found=true; break; }
      i=qi+1;
    }
    return found;
  }
  function dSplNum(str){
    if(!str) return 0;
    var m=str.match(/(\d+)\s*dB/);
    return m?parseInt(m[1]):0;
  }
  function dFilter(){
    var q=(dq?dq.value||'':'').toLowerCase().trim();
    var minSpl=parseInt((document.getElementById('dSplFilter')||{}).value)||0;
    var useF=(document.getElementById('dUseFilter')||{}).value||'';
    var dAmpF=(document.getElementById('dAmpFilter')||{}).value||'';
    var drvF=(document.getElementById('dDriverFilter')||{}).value||'';
    var bwF=parseInt((document.getElementById('dBwFilter')||{}).value)||9999;
    var wtF=(document.getElementById('dWeightFilter')||{}).value||'';
    var covF=(document.getElementById('dCovFilter')||{}).value||'';
    var dispF=(document.getElementById('dDispFilter')||{}).value||'';
    var shown=0;
    document.querySelectorAll('#d_products .stab').forEach(function(st){
      var p=P_DNB[st.getAttribute('data-dp')];
      if(!p){ st.classList.add('hidden'); return; }
      var d=(p.spec&&p.spec.detail)||{};
      var nameOk=!q||p.n.toLowerCase().indexOf(q)>=0;
      var splVal=dSplNum(d.max_spl_by_amp);
      var splOk=splVal>=minSpl;
      var useOk=!useF||(p.use||'')===useF;
      var ampOkD=!dAmpF||(function(){
        var a=p.amp||'';
        if(dAmpF==='Passive XO') return a.indexOf('Passive XO')>=0;
        if(dAmpF==='Active') return a.indexOf('Active XO')>=0;
        if(dAmpF==='Networked') return a.indexOf('Networked')>=0;
        return true;
      })();
      var drvOk=!drvF||(function(){
        var lf=d.lf||'',target=parseFloat(drvF),maxI=0;
        var s=lf,qi=s.indexOf('"'),i=0;
        while(qi>=0){var j=qi-1;while(j>=0&&(s[j]>='0'&&s[j]<='9'||s[j]==='.')){j--;}
          var n=parseFloat(s.slice(j+1,qi));if(!isNaN(n)&&n>maxI)maxI=n;i=qi+1;qi=s.indexOf('"',i);}
        if(drvF==='6.5') return maxI>=6;
        return maxI>=target;
      })();
      var bwOk=bwF>=9999||(function(){
        var fr=d.freq_response_5db||d.freq_response_infra||'';
        var m=fr.match(/(\d+)\s*Hz/);
        return m?parseInt(m[1])<=bwF:true;
      })();
      var wtOk=!wtF||(function(){
        var wt=d.weight||'';
        var m=wt.match(/([\d.]+)\s*kg/);
        if(!m) return true; var kg=parseFloat(m[1]);
        if(wtF.charAt(0)==='u') return kg<=parseFloat(wtF.slice(1));
        if(wtF.charAt(0)==='o') return kg>=parseFloat(wtF.slice(1));
        return true;
      })();
      var covOk=!covF||(function(){
        var cov=(d.coverage||d.h_coverage||d.conical_coverage||'').toLowerCase();
        if(covF==='cardioid') return cov.indexOf('cardioid')>=0;
        if(covF==='omni') return cov.indexOf('omni')>=0||cov.indexOf('360')>=0;
        var degStr=''; for(var ci=0;ci<cov.length;ci++){var ch=cov[ci];if(ch>='0'&&ch<='9'||ch==='.') degStr+=ch; else if(degStr) break;}
        var deg=parseFloat(degStr)||0;
        if(covF==='narrow') return deg>0&&deg<=60;
        if(covF==='mid') return deg>60&&deg<=100;
        if(covF==='wide') return deg>100;
        return true;
      })();
      var dispOk=!dispF||(function(){
        var sb=st.closest('.series-block');
        var sn=sb?((sb.querySelector('.sg-name')||{}).textContent||'').toLowerCase():'';
        if(dispF==='line') return sn.indexOf('line array')>=0;
        if(dispF==='point') return sn.indexOf('point source')>=0;
        if(dispF==='sub') return sn.indexOf('subwoofer')>=0||sn.indexOf('sub')>=0;
        if(dispF==='aug') return sn.indexOf('augmented')>=0;
        if(dispF==='monitor') return sn.indexOf('stage monitor')>=0;
        return true;
      })();
      var ok=nameOk&&splOk&&useOk&&ampOkD&&drvOk&&bwOk&&wtOk&&covOk&&dispOk;
      st.classList.toggle('hidden',!ok); if(ok) shown++;
    });
    document.querySelectorAll('#d_products .series-block').forEach(function(sb){
      var anyVisible=!!sb.querySelector('.stab:not(.hidden)');
      sb.classList.toggle('hidden',!anyVisible);
    });
    var c=document.getElementById('dPsCount'); if(c) c.textContent=shown+'개 제품';
  }
  function resetDnbFilters(){
    ['dProdQuery','dSplFilter','dUseFilter','dAmpFilter','dDriverFilter','dBwFilter','dWeightFilter','dCovFilter','dDispFilter'].forEach(function(id){
      var el=document.getElementById(id); if(!el) return;
      if(el.tagName==='SELECT') el.selectedIndex=0; else el.value='';
    }); dFilter();
  }
  window.resetDnbFilters = resetDnbFilters;
  if(dq){ dq.addEventListener('input', dFilter); }
  ['dSplFilter','dUseFilter','dAmpFilter','dDriverFilter','dBwFilter','dWeightFilter','dCovFilter','dDispFilter'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.addEventListener('change',dFilter);
  });
  window.__dnbFilter = dFilter;
  dFilter();
}

var pq = document.getElementById('prodQuery');

if(pq){ pq.addEventListener('input', applyProdFilter); }

['splFilter','ampFilter','useFilter','driverFilter','throwFilter','wayFilter','bwFilter','weightFilter','covFilter'].forEach(function(id){
  var el = document.getElementById(id);
  if(el) el.addEventListener('change', applyProdFilter);
});

applyProdFilter();

document.querySelectorAll('.tabs').forEach(function(tabbar){
  tabbar.addEventListener('click',function(e){
    var t=e.target.closest('.tab'); if(!t) return;
    var page = tabbar.closest('.page');
    page.querySelectorAll('.tab').forEach(function(x){x.classList.remove('on')});
    page.querySelectorAll('.sec').forEach(function(x){x.classList.remove('on')});
    t.classList.add('on');
    var sec = document.getElementById(t.dataset.s);
    if(sec) sec.classList.add('on');
  });
});

var laProducts = document.getElementById('products');

if(laProducts){
  laProducts.addEventListener('click',function(e){
    var t=e.target.closest('.stab'); if(!t) return;
    document.querySelectorAll('#products .stab').forEach(function(x){x.classList.remove('on')});
    t.classList.add('on');
    render(t.dataset.p);
  });
  render('x4i');
}

buildCompareOptions();

setTimeout(renderAllProducts, 50);

var cA=document.getElementById('cmpA'), cB=document.getElementById('cmpB');

if(cA) cA.addEventListener('change', function(){applyCmpFilter();});

if(cB) cB.addEventListener('change', function(){applyCmpFilter();renderCompare();});

var cC=document.getElementById('cmpC');

if(cC) cC.addEventListener('change', function(){renderCompare();});
}
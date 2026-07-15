var ALL_BRAND_CFG=[
  {name:'L-Acoustics',    color:'#d4af5a', pageId:'products',   attr:'data-p',  bd:null},
  {name:'Meyer Sound',    color:'#5a9bf5', pageId:'m_products', attr:'data-mp', bd:null},
  {name:'d&b audiotechnik',color:'#ff5a68',pageId:'d_products', attr:'data-dp', bd:null},
];

function getAllBd(name){return BRANDS[name]||null;}

function applyAllFilter(){
  var q=(document.getElementById('allQuery').value||'').toLowerCase().trim();
  var minSpl=parseInt(document.getElementById('allSplFilter').value)||0;
  var useF=document.getElementById('allUseFilter').value||'';
  var ampF=document.getElementById('allAmpFilter').value||'';
  var drvF=document.getElementById('allDriverFilter').value||'';
  var maxBw=parseInt(document.getElementById('allBwFilter').value)||999;
  var maxWt=parseFloat(document.getElementById('allWeightFilter').value)||9999;
  var covF=document.getElementById('allCovFilter').value||'';
  var typeF=document.getElementById('allTypeFilter').value||'';
  var total=0;
  ALL_BRAND_CFG.forEach(function(bc){
    var bd=getAllBd(bc.name);if(!bd)return;
    var bsec=null;
    document.querySelectorAll('#all-products-area .all-brand-section').forEach(function(s){if(s.getAttribute('data-brand')===bc.name)bsec=s;});
    if(!bsec)return;
    bsec.querySelectorAll('.all-series-block').forEach(function(sb){
      var anyShown=false;
      sb.querySelectorAll('.all-stab').forEach(function(st){
        var key=st.getAttribute('data-all-key');
        var p=bd.data[key];if(!p){st.style.display='none';return;}
        var d=(p.spec&&p.spec.detail)||{};
        var spl=extractSplAll(d,p),bw=extractBwAll(d),wt=extractWeightAll(d),lf=extractLfInchAll(d),cov=extractCovAll(d),pt=classifyPtypeAll(p);
        var ok=true;
        if(q&&p.n.toLowerCase().indexOf(q)<0)ok=false;
        if(ok&&minSpl>0)ok=spl>=minSpl;
        if(ok&&useF)ok=(p.use||'')==useF||(p.use||'').indexOf(useF)>=0;
        if(ok&&ampF)ok=ampMatchAll(p,ampF);
        if(ok&&drvF){var di=parseInt(drvF);ok=(drvF==='6')?(lf>=6&&lf<=7):(lf===di);}
        if(ok&&maxBw<999)ok=bw<=maxBw;
        if(ok&&maxWt<9999)ok=wt<=maxWt;
        if(ok&&covF)ok=covMatchAll(cov,covF);
        if(ok&&typeF)ok=pt===typeF;
        st.classList.toggle('hidden',!ok);
        if(ok){anyShown=true;total++;}
      });
      sb.classList.toggle('hidden',!anyShown);

    });
    var vis=bsec.querySelectorAll('.all-stab:not(.hidden)').length;
    bsec.classList.toggle('hidden',!vis);
  });
  var cnt=document.getElementById('allCount');
  if(cnt)cnt.textContent=total+'개 제품';
}

function resetAllFilter(){
  ['allSplFilter','allUseFilter','allAmpFilter','allDriverFilter','allBwFilter','allWeightFilter','allCovFilter','allTypeFilter'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.value=el.options[0].value;
  });
  var qi=document.getElementById('allQuery');if(qi)qi.value='';
  applyAllFilter();
}

function showAllDetail(brandName, key){
  // Highlight stab
  document.querySelectorAll('#all-products-area .all-stab').forEach(function(s){s.classList.remove('on');});
  var clicked=null;
  document.querySelectorAll('#all-products-area .all-stab').forEach(function(s){if(s.getAttribute('data-all-brand')===brandName&&s.getAttribute('data-all-key')===key)clicked=s;});
  if(clicked) clicked.classList.add('on');

  var allPanel=document.getElementById('all-detail-area');
  if(!allPanel) return;

  // 임시 숨겨진 div에 각 브랜드 render 결과를 받아서 all-detail-area로 이동
  var tmpId={'L-Acoustics':'detail-area','Meyer Sound':'m-detail-area','d&b audiotechnik':'d-detail-area'}[brandName];
  if(!tmpId) return;

  // 실제 detail-area 요소를 임시 보관
  var realEl=document.getElementById(tmpId);

  // 임시 div 생성 (DOM에 붙이되 숨김)
  var tmpDiv=document.createElement('div');
  tmpDiv.id=tmpId;
  tmpDiv.style.display='none';
  document.body.appendChild(tmpDiv);

  // 실제 요소의 id 제거 (충돌 방지)
  if(realEl) realEl.removeAttribute('id');

  try{
    if(brandName==='L-Acoustics')           render(key);
    else if(brandName==='Meyer Sound')      mRender(key);
    else if(brandName==='d&b audiotechnik') dRender(key);
  }catch(e){}

  // tmpDiv의 innerHTML을 allPanel로 이동
  allPanel.innerHTML=tmpDiv.innerHTML;

  // spacer 추가
  var spacer=document.createElement('div');
  spacer.style.height='4rem';
  allPanel.appendChild(spacer);

  // 정리
  tmpDiv.remove();
  if(realEl) realEl.id=tmpId;

  allPanel.scrollTop=0;
  var pr=allPanel.closest('.prod-right');
  if(pr) pr.scrollTop=0;
}

function renderAllProducts(){
  var area=document.getElementById('all-products-area');if(!area)return;
  var html='';
  ALL_BRAND_CFG.forEach(function(bc){
    var bd=getAllBd(bc.name);if(!bd)return;
    var srcEl=document.getElementById(bc.pageId);if(!srcEl)return;
    var sbs=srcEl.querySelectorAll('.series-block');if(!sbs.length)return;
    html+='<div class="all-brand-section" data-brand="'+bc.name+'">';
    html+='<div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:'+bc.color
         +';text-transform:uppercase;margin:1rem 0 .4rem;padding-bottom:.3rem;border-bottom:.5px solid '
         +bc.color+'44;">'+bc.name+'</div>';
    sbs.forEach(function(sb){
      var sgHeadEl=sb.querySelector('.sg-head');
      var sgNameEl=sb.querySelector('.sg-name');
      var sgThrowEl=sb.querySelector('.sg-throw');
      var srcStabs=sb.querySelectorAll('.stab');
      if(!srcStabs.length)return;
      html+='<div class="all-series-block series-block" data-brand="'+bc.name+'">';
      html+='<div class="sg-head"><span class="sg-name">'
           +(sgNameEl?sgNameEl.textContent.trim():'')+'</span>'
           +(sgThrowEl?'<span class="sg-throw">'+sgThrowEl.textContent.trim()+'</span>':'')
           +'</div>';
      html+='<div class="series-tabs">';
      srcStabs.forEach(function(st){
        var key=st.getAttribute(bc.attr);if(!key)return;
        var p=bd.data[key];if(!p)return;
        html+='<div class="stab all-stab" data-brand="'+bc.name
             +'" data-all-key="'+key+'" data-all-brand="'+bc.name
             +'" onclick="showAllDetail(this.getAttribute(\'data-all-brand\'),this.getAttribute(\'data-all-key\'))">'+p.n+'</div>';
      });
      html+='</div></div>';
    });
    html+='</div>';
  });
  area.innerHTML=html;
  var first=area.querySelector('.all-stab');
  if(first)first.click();
  var qi=document.getElementById('allQuery');
  if(qi){qi.removeEventListener('input',applyAllFilter);qi.addEventListener('input',applyAllFilter);}
  applyAllFilter();

}
(function(){
  Promise.all([
    fetch('data/products.json').then(function(r){return r.json();}),
    fetch('data/brands.json').then(function(r){return r.json();}),
    fetch('data/amplifiers.json').then(function(r){return r.json();}),
    fetch('data/software.json').then(function(r){return r.json();})
  ]).then(function(results){
    var products = results[0], brandsMeta = results[1], amplifiers = results[2], software = results[3];
    window.P = products['L-Acoustics'];
    window.P_MEYER = products['Meyer Sound'];
    window.P_DNB = products['d&b audiotechnik'];
    window.AMP_TABLE = amplifiers['L-Acoustics'];
    window.DNB_AMP_TABLE = amplifiers['d&b audiotechnik'];
    window.BRANDS = {
      'L-Acoustics': { color: brandsMeta['L-Acoustics'].color, data: P, img: IMG, specs: brandsMeta['L-Acoustics'].specs },
      'Meyer Sound': { color: brandsMeta['Meyer Sound'].color, data: P_MEYER, img: IMG_MEYER, specs: brandsMeta['Meyer Sound'].specs },
      'd&b audiotechnik': { color: brandsMeta['d&b audiotechnik'].color, data: P_DNB, img: IMG_DNB, specs: brandsMeta['d&b audiotechnik'].specs }
    };
    renderSoftwareCards(software);
    initApp();
  }).catch(function(err){
    console.error('데이터 로드 실패:', err);
  });
})();

(function(){
  const cfg = window.A4P_CONFIG;
  const storageKey = cfg.hubStorageKey;

  function readHubData(){
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (e) {
      return {};
    }
  }

  function resetHub(){
    localStorage.removeItem(storageKey);
    render();
  }

  function average(values){
    const clean = values.filter(v => typeof v === 'number' && !Number.isNaN(v));
    if (!clean.length) return null;
    return Math.round(clean.reduce((a,b)=>a+b,0) / clean.length);
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setStatus(id, synced){
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'status-pill ' + (synced ? 'status-sync' : 'status-pending');
    el.textContent = synced ? 'Synchronisé' : 'En attente';
  }

  function renderModuleCards(data){
    const cmp = data.CMP;
    setStatus('cmp-status', !!cmp);
    setText('cmp-profile', cmp?.profil_nom || cmp?.profil || 'Aucun résultat');
    setText('cmp-score', typeof cmp?.score_global === 'number' ? `${cmp.score_global}/100` : (typeof cmp?.score === 'number' ? `${cmp.score}/100` : '—'));
    setText('cmp-summary', cmp?.summary || cmp?.resume_court || 'Questionnaire dynamique, profil automatique, radar et synthèse professionnelle.');

    const pmp = data.PMP;
    setStatus('pmp-status', !!pmp);
    setText('pmp-summary', pmp?.summary || pmp?.resume_court || 'Aucun résultat synchronisé pour le moment.');

    const psycho = data.PSYCHO || data.PSY || data.EQU || data.EQUILIBRE;
    setStatus('psycho-status', !!psycho);
    setText('psycho-summary', psycho?.summary || psycho?.resume_court || 'Aucun résultat synchronisé pour le moment.');
  }

  function renderGlobal(data){
    const cmpScore = typeof data.CMP?.score_global === 'number' ? data.CMP.score_global : data.CMP?.score;
    const pmpScore = typeof data.PMP?.score_global === 'number' ? data.PMP.score_global : data.PMP?.score;
    const psychoObj = data.PSYCHO || data.PSY || data.EQU || data.EQUILIBRE;
    const psychoScore = typeof psychoObj?.score_global === 'number' ? psychoObj.score_global : psychoObj?.score;
    const values = [cmpScore, pmpScore, psychoScore];
    const synced = values.filter(v => typeof v === 'number').length;
    const global = average(values);
    setText('global-score', global !== null ? `${global}/100` : '—');
    setText('global-subtitle', `${synced}/3 modules synchronisés`);
    setText('club-count', synced ? 'Base locale partielle' : 'En attente');
    setText('club-score', global !== null ? `${global}/100` : 'En attente');
    setText('club-resource', synced >= 2 ? 'Analyse multi-modules possible' : 'À calculer quand plusieurs modules seront branchés');
  }

  function renderRadar(data){
    const cmp = data.CMP || {};
    const dims = cmp.dimensions || {
      confiance: null,
      regulation: null,
      engagement: null,
      stabilite: null
    };
    const labels = [
      { key:'confiance', label:'Confiance', x:210, y:34, anchor:'middle' },
      { key:'regulation', label:'Régulation', x:385, y:212, anchor:'start' },
      { key:'engagement', label:'Engagement', x:210, y:396, anchor:'middle' },
      { key:'stabilite', label:'Stabilité', x:35, y:212, anchor:'end' }
    ];
    const center = {x:210, y:210};
    const maxR = 140;
    const grid = document.getElementById('radar-grid');
    const labelGroup = document.getElementById('radar-labels');
    const pointGroup = document.getElementById('radar-points');
    const shape = document.getElementById('radar-shape');
    const outline = document.getElementById('radar-outline');
    grid.innerHTML = '';
    labelGroup.innerHTML = '';
    pointGroup.innerHTML = '';

    for(let i=1;i<=5;i++){
      const r = (maxR/5)*i;
      const pts = [
        `${center.x},${center.y-r}`,
        `${center.x+r},${center.y}`,
        `${center.x},${center.y+r}`,
        `${center.x-r},${center.y}`
      ].join(' ');
      const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
      poly.setAttribute('points', pts);
      poly.setAttribute('class','radar-grid-line');
      grid.appendChild(poly);
    }
    [['210,70 210,350'],['70,210 350,210']].forEach(linePts=>{
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      const [a,b] = linePts[0].split(' ');
      const [x1,y1] = a.split(',');
      const [x2,y2] = b.split(',');
      line.setAttribute('x1',x1);line.setAttribute('y1',y1);line.setAttribute('x2',x2);line.setAttribute('y2',y2);
      line.setAttribute('class','radar-axis');
      grid.appendChild(line);
    });

    const points = labels.map((item, idx) => {
      const value = typeof dims[item.key] === 'number' ? dims[item.key] : 0;
      const r = (value/100)*maxR;
      if(idx===0) return {x:center.x, y:center.y-r, value};
      if(idx===1) return {x:center.x+r, y:center.y, value};
      if(idx===2) return {x:center.x, y:center.y+r, value};
      return {x:center.x-r, y:center.y, value};
    });

    const ptsString = points.map(p => `${p.x},${p.y}`).join(' ');
    shape.setAttribute('points', ptsString);
    outline.setAttribute('points', ptsString + ' ' + `${points[0].x},${points[0].y}`);

    points.forEach(p => {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx', p.x);
      c.setAttribute('cy', p.y);
      c.setAttribute('r', 7);
      c.setAttribute('class','radar-point');
      pointGroup.appendChild(c);
    });

    labels.forEach(item => {
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', item.x);
      t.setAttribute('y', item.y);
      t.setAttribute('text-anchor', item.anchor);
      t.setAttribute('class', 'radar-label');
      t.textContent = item.label;
      labelGroup.appendChild(t);
    });
  }

  function render(){
    const data = readHubData();
    renderModuleCards(data);
    renderGlobal(data);
    renderRadar(data);
    setText('json-output', JSON.stringify(data, null, 2));

    document.getElementById('pmp-link').href = cfg.links.pmp;
    document.getElementById('cmp-link').href = cfg.links.cmp;
    document.getElementById('cmp-results-link').href = cfg.links.cmpResults;
    document.getElementById('psycho-link').href = cfg.links.psycho;
  }

  document.getElementById('btn-refresh').addEventListener('click', render);
  document.getElementById('btn-reset').addEventListener('click', resetHub);
  window.addEventListener('storage', render);
  render();
})();

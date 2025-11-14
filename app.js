// app.js — Lógica del grafo (conversión desde PROYECTO.py)

const canvas = document.getElementById('grafoCanvas');
const ctx = canvas.getContext('2d');
const inputN = document.getElementById('inputN');
const btnGen = document.getElementById('btnGen');
const btnConectar = document.getElementById('btnConectar');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnVer = document.getElementById('btnVer');
const logArea = document.getElementById('logArea');

let n = 0;
let nodos = []; // [{x,y}]
let aristas = []; // [[u,v],...]
let matriz = [];
let nodoSeleccionado = null;
let componentes = [];

const radioNodo = 22;

// palette para componentes
const palette = ["#FF6B6B","#4ECDC4","#45B7D1","#FFA07A","#98D8C8","#F7DC6F","#BB8FCE","#85C1E2","#F8B500","#6C5B7B"];

// helpers
function log(s, estilo=null){
  if(estilo==="titulo"){
    logArea.textContent += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n    " + s + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  } else if(estilo==="subtitulo"){
    logArea.textContent += "\n📌 " + s + "\n" + "-".repeat(50) + "\n";
  } else {
    logArea.textContent += s + "\n";
  }
  logArea.scrollTop = logArea.scrollHeight;
}
function clearLog(){ logArea.textContent = ""; }

function crearMatriz(sz){ matriz = Array.from({length:sz}, ()=>Array(sz).fill(0)); }

function generarNodos(){
  n = Math.max(6, Math.min(12, parseInt(inputN.value||8)));
  nodos = [];
  aristas = [];
  crearMatriz(n);
  const cx = canvas.width/2, cy = canvas.height/2, radio = Math.min(canvas.width, canvas.height) * 0.35;
  for(let i=0;i<n;i++){
    const ang = 2*Math.PI*i/n - Math.PI/2;
    const x = cx + radio*Math.cos(ang);
    const y = cy + radio*Math.sin(ang);
    nodos.push({x,y});
  }
  nodoSeleccionado = null;
  componentes = [];
  draw();
  clearLog();
  log(`✓ ${n} nodos generados\n→ Seleccione modo de conexión y presione 'Conectar'`);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // aristas
  for(const [u,v] of aristas) drawArrow(nodos[u], nodos[v], '#999');
  // nodos
  for(let i=0;i<n;i++){
    const col = (componentes.length? (componentes.flat().includes(i)? getComponentColor(i) : '#43A047') : (nodoSeleccionado===i? '#EF6C00' : '#43A047'));
    drawNode(nodos[i], i, col);
  }
}

function drawNode(p, idx, color){
  ctx.beginPath(); ctx.fillStyle = color; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.arc(p.x,p.y, radioNodo,0,Math.PI*2); ctx.fill(); ctx.stroke();
  // texto (ajusta color según luminancia)
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline='middle'; ctx.fillText(String(idx), p.x, p.y);
}

function drawArrow(a,b,color){
  const dx = b.x - a.x, dy = b.y - a.y; let dist = Math.hypot(dx,dy); if(dist<1) return;
  const ux = dx/dist, uy = dy/dist;
  const offset = radioNodo + 6;
  const x1 = a.x + ux*offset, y1 = a.y + uy*offset;
  const x2 = b.x - ux*offset, y2 = b.y - uy*offset;
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2; ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  // arrow head
  const ah_len = 12, ah_w = 6; const bx = x2 - ux*ah_len, by = y2 - uy*ah_len; const nx = -uy, ny = ux;
  ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(bx + nx*ah_w, by + ny*ah_w); ctx.lineTo(bx - nx*ah_w, by - ny*ah_w); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
}

function canvasToNodeIndex(x,y){
  for(let i=0;i<n;i++){
    const dx = x - nodos[i].x, dy = y - nodos[i].y; if(Math.hypot(dx,dy) <= radioNodo+8) return i;
  }
  return null;
}

canvas.addEventListener('pointerdown', (ev)=>{
  if(!nodos.length) return;
  const rect = canvas.getBoundingClientRect(); const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  const modo = document.querySelector('input[name="modo"]:checked').value;
  if(modo !== 'manual') return;
  if(componentes.length) return; // no permitir cuando ya analizado
  const idx = canvasToNodeIndex(x,y);
  if(idx===null) return;
  if(nodoSeleccionado===null){ nodoSeleccionado = idx; }
  else{ if(nodoSeleccionado !== idx){ const a = [nodoSeleccionado, idx]; if(!aristas.some(e=>e[0]===a[0]&&e[1]===a[1])){ aristas.push(a); matriz[a[0]][a[1]] = 1 } } nodoSeleccionado = null; }
  draw();
});

function randomConnect(){
  aristas = [];
  crearMatriz(n);
  const maxAr = n*(n-1); const num = Math.floor(Math.random()*(maxAr - (n-1) +1)) + (n-1);
  let attempts=0;
  while(aristas.length < num && attempts < num*4){
    const i = Math.floor(Math.random()*n), j = Math.floor(Math.random()*n);
    if(i!==j){ if(!aristas.some(e=>e[0]===i&&e[1]===j)){ aristas.push([i,j]); matriz[i][j]=1 } }
    attempts++;
  }
  draw();
  log(`✓ ${aristas.length} conexiones dirigidas generadas aleatoriamente`);
}

function limpiar(){ aristas=[]; crearMatriz(n); componentes=[]; nodoSeleccionado=null; draw(); clearLog(); log('Conexiones limpiadas'); }

function getComponentColor(nodeIndex){
  for(let i=0;i<componentes.length;i++) if(componentes[i].includes(nodeIndex)) return palette[i % palette.length];
  return '#43A047';
}

function analizar(){
  if(!nodos.length) { log('Primero genera los nodos.'); return; }
  clearLog();
  log('PROCESO DE IDENTIFICACIÓN DE COMPONENTES CONEXAS', 'titulo');

  // Paso 1: llenar diagonal con unos (mostrar)
  log('PASO 1 — Llenar diagonal de unos', 'subtitulo');
  const matriz_p1 = matriz.map(r=>r.slice());
  for(let i=0;i<n;i++) matriz_p1[i][i]=1;
  log('Matriz (con diagonal de 1s):');
  log(JSON.stringify(matriz_p1));

  // Construir matriz de caminos (simulación compacta)
  log('\nPASO 2: MATRIZ DE CAMINOS\nSi la fila i tiene un 1 en la columna j, copiar la fila j a la fila i\n');
  let matriz_p2 = matriz.map(r=>r.slice());
  for(let i=0;i<n;i++) matriz_p2[i][i]=1;

  // Propagar: versión iterativa por filas (como tu Python)
  for(let i=0;i<n;i++){
    log('––––––––––––––––––––––––––––––––––––––––––');
    log(`Procesando fila ${i}:`);
    let hubo_cambios = true;
    let iter = 1;
    while(hubo_cambios){
      hubo_cambios = false;
      const fila_antes = matriz_p2[i].slice();
      const fila_nueva = matriz_p2[i].slice();
      log(`  iteracion ${iter} de la fila ${i}:`);
      log(`    Fila ${i} actual: ${JSON.stringify(fila_antes)}`);
      for(let j=0;j<n;j++){
        if(fila_antes[j]===1 && i!==j){
          let aporta = false;
          for(let k=0;k<n;k++) if(matriz_p2[j][k]===1 && fila_nueva[k]===0) { aporta=true; break; }
          if(aporta){
            log(`    → Hay un 1 en columna ${j}, colocando 1's en la fila ${j}: ${JSON.stringify(matriz_p2[j])}`);
            for(let k=0;k<n;k++) if(matriz_p2[j][k]===1) fila_nueva[k]=1;
          }
        }
      }
      if(JSON.stringify(fila_nueva) !== JSON.stringify(fila_antes)){
        hubo_cambios = true;
        matriz_p2[i] = fila_nueva;
        log(`    Fila ${i} actualizada: ${JSON.stringify(fila_antes)} → ${JSON.stringify(fila_nueva)}`);
        log('✔ Fila actualizada correctamente');
      } else {
        log(`    Fila ${i} sin mas cambios`);
      }
      iter++;
    }
    // mostrar matriz parcial
    log(`  Matriz despues de procesar la fila ${i}:`);
    for(let r=0;r<n;r++) log(JSON.stringify(matriz_p2[r]));
    log('\n');
  }

  // Paso 3: ordenar filas y columnas por numero de unos
  log('PASO 3: ORDENAR FILAS Y COLUMNAS POR numero DE UNOS');
  const conteo_unos = [];
  for(let i=0;i<n;i++){
    const fila = matriz_p2[i];
    const firma = fila.map((v,idx)=> v===1? idx : -1).filter(v=> v!==-1);
    conteo_unos.push({i, cnt: firma.length, firma});
  }
  conteo_unos.sort((a,b) => b.cnt - a.cnt || (a.firma.join(',') < b.firma.join(',') ? -1 : 1) );
  const orden_nodos = conteo_unos.map(x=>x.i);

  const filas_ordenadas = Array.from({length:n}, ()=>Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) filas_ordenadas[i][j] = matriz_p2[orden_nodos[i]][j];
  log('Matriz despues de ordenar FILAS:');
  filas_ordenadas.forEach(r => log(JSON.stringify(r)));

  const matriz_p3 = Array.from({length:n}, ()=>Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) matriz_p3[i][j] = filas_ordenadas[i][orden_nodos[j]];
  log('Matriz despues de ordenar FILAS Y COLUMNAS:');
  matriz_p3.forEach(r => log(JSON.stringify(r)));

  // Paso 4: identificar bloques de 1s (= componentes)
  log('PASO 4: IDENTIFICAR COMPONENTES CONEXAS');
  componentes = [];
  const visitado = Array(n).fill(false);
  let i = 0;
  const bloques = [];
  while(i < n){
    if(!visitado[i]){
      let tmax = 1;
      for(let t=1; t<= n - i; t++){
        let es_val = true;
        for(let f=i; f<i+t; f++){
          for(let c=i; c<i+t; c++){
            if(matriz_p3[f][c] !== 1){ es_val = false; break; }
          }
          if(!es_val) break;
        }
        if(es_val) tmax = t; else break;
      }
      const comp = [];
      for(let k=i; k<i+tmax; k++) comp.push(orden_nodos[k]);
      comp.sort((a,b)=>a-b);
      componentes.push(comp);
      bloques.push([i, i+tmax-1, i, i+tmax-1]);
      for(let k=i; k<i+tmax; k++) visitado[k]=true;
      i += tmax;
    } else i++;
  }

  log(`numero total de componentes: ${componentes.length}`);
  componentes.forEach((c,idx)=> log(`Componente ${idx+1}: ${JSON.stringify(c)} (tamaño ${c.length})`));

  // resumen
  log('\nRESUMEN DE COMPONENTES CONEXAS');
  componentes.forEach((comp, idx) => {
    const ar_comp = aristas.filter(([u,v]) => comp.includes(u) && comp.includes(v));
    log(`Componente ${idx+1}:`);
    log(`  Nodos: ${JSON.stringify(comp)}`);
    log(`  Cantidad de nodos: ${comp.length}`);
    log(`  Aristas: ${JSON.stringify(ar_comp)}`);
    log(`  Cantidad de aristas: ${ar_comp.length}`);
  });

  // recolor y redraw
  draw();
}

btnGen.addEventListener('click', ()=>{ generarNodos(); });
btnLimpiar.addEventListener('click', ()=>{ limpiar(); });
btnConectar.addEventListener('click', ()=>{
  const modoSel = document.querySelector('input[name="modo"]:checked').value;
  if(modoSel === 'aleatorio') randomConnect();
  analizar();
});
btnVer.addEventListener('click', ()=>{
  if(!componentes.length){ log('Primero analiza las componentes.'); return; }
  // dibujar subgrafos en mosaico
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cols = Math.min(componentes.length, 3);
  const rows = Math.ceil(componentes.length/cols);
  const w = canvas.width/cols, h = canvas.height/rows;
  for(let idx=0; idx<componentes.length; idx++){
    const comp = componentes[idx];
    const col = idx % cols, row = Math.floor(idx/cols);
    const cx = col*w + w/2, cy = row*h + h/2; const r = Math.min(w,h)*0.28;
    const posmap = {};
    for(let i=0;i<comp.length;i++){
      const ang = 2*Math.PI*i/comp.length - Math.PI/2; const x = cx + r*Math.cos(ang); const y = cy + r*Math.sin(ang);
      posmap[comp[i]] = {x,y};
    }
    for(const [u,v] of aristas){ if(comp.includes(u) && comp.includes(v)) drawArrow(posmap[u], posmap[v], palette[idx%palette.length]); }
    for(const nodo of comp){ drawNode(posmap[nodo], nodo, palette[idx%palette.length]); }
    ctx.fillStyle = palette[idx%palette.length]; ctx.font = '600 14px Poppins'; ctx.textAlign='center'; ctx.fillText(`Componente ${idx+1}`, cx, cy - r - 18);
  }
});

// init
generarNodos();
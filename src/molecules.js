/* The three molecules each Ranger collects, one kind per zone: [name, icon, fact shown on pickup]. */
const MOLECULES = {
 atp:[['Phosphate groups','phosphate','Phosphate groups are what ATP adds and removes to store and release energy.'],
      ['ADP','adp','ADP has two phosphates. Adding a third recharges it into ATP.'],
      ['Charged ATP','atp','ATP carries three phosphates. Breaking off the last one powers cell work.']],
 ribosome:[['mRNA strands','mrna','mRNA carries a gene’s message from the nucleus to the ribosome.'],
      ['tRNA + amino acids','trna','Each tRNA brings one amino acid and reads one codon.'],
      ['Release factors','release','Release factors read stop codons and free the finished protein.']],
 rougher:[['Polypeptide chains','polypeptide','A new protein enters the rough ER as a chain of amino acids.'],
      ['Sugar tags','sugar','Sugar chains added in the ER help label and fold the protein.'],
      ['Transport vesicles','vesicleOrange','Vesicles bud off the ER and carry proteins to the Golgi.']],
 golgi:[['ER vesicles','vesicleOrange','Vesicles from the ER deliver new proteins to the Golgi.'],
      ['Sugar tags','sugar','The Golgi edits sugar tags like shipping labels.'],
      ['Shipping vesicles','vesicleGold','Shipping vesicles leave the Golgi for the membrane, lysosomes or outside the cell.']],
 cytoplasm:[['Glucose','glucose','Glucose is the cell’s main fuel. It is split in the cytosol first.'],
      ['Enzymes','enzyme','Enzymes in the cytosol speed up reactions such as glycolysis.'],
      ['Pyruvate','pyruvate','Glycolysis splits one glucose into two pyruvate molecules.']],
 membrane:[['Phospholipids','phospholipid','Phospholipids have water-loving heads and water-fearing tails.'],
      ['Cholesterol','cholesterol','Cholesterol tucks between phospholipids and keeps the membrane flexible.'],
      ['Na⁺ / K⁺ ions','ions','The sodium-potassium pump uses ATP to move these ions against their gradients.']],
 mito:[['Pyruvate','pyruvate','Pyruvate from glycolysis enters the mitochondrion as fuel.'],
      ['Oxygen (O₂)','o2','Oxygen accepts electrons at the end of the electron transport chain.'],
      ['ADP + phosphate','adpPi','ATP synthase joins ADP and phosphate into ATP.']],
 nucleus:[['Nucleotides','nucleotide','Nucleotides are the building blocks of DNA and RNA.'],
      ['Histones','histone','DNA wraps around histone proteins to pack into chromatin.'],
      ['mRNA','mrna','mRNA copies of genes leave the nucleus through nuclear pores.']],
 smoother:[['Fatty acids','fattyAcid','Smooth ER builds lipids from fatty acids.'],
      ['Toxin molecules','toxin','Smooth ER enzymes help break down drugs and toxins.'],
      ['Ca²⁺ ions','calcium','Smooth ER stores calcium and releases it as a signal.']],
 lysosome:[['Digestive enzymes','digest','Lysosomes are packed with enzymes that break molecules apart.'],
      ['H⁺ ions','proton','Pumping in H⁺ ions keeps the lysosome acidic, about pH 5.'],
      ['Recycled amino acids','aminoAcid','Digested proteins become amino acids the cell can reuse.']],
 dna:[['DNA nucleotides','dnaBase','DNA nucleotides carry the bases A, T, G and C.'],
      ['DNA polymerase','polymerase','DNA polymerase builds a new strand by matching base pairs.'],
      ['Repair enzymes','repair','Repair enzymes find and fix mismatched base pairs.']],
 rna:[['RNA nucleotides','rnaBase','RNA nucleotides use uracil (U) instead of thymine (T).'],
      ['mRNA','mrna','mRNA is the working copy of a gene that ribosomes read.'],
      ['tRNA','trna','tRNA reads codons and delivers amino acids.']],
 mitosis:[['Tubulin','tubulin','Tubulin proteins link up into the spindle fibers.'],
      ['Kinetochore proteins','kinetochore','Kinetochores attach chromosomes to the spindle.'],
      ['Chromosomes','chromosome','Each duplicated chromosome is two identical sister chromatids.']],
 crispr:[['Viral DNA snippets','viralDNA','Bacteria store snippets of viral DNA as a memory of past infections.'],
      ['Guide RNA','guideRNA','Guide RNA is copied from the stored snippets and matches the virus.'],
      ['Cas9','cas9','Cas9 cuts DNA wherever its guide RNA finds a match.']]
};
const CARGO = Object.fromEntries(Object.entries(MOLECULES).map(([id,list])=>[id,list.map(m=>m[0])]));
const MOLECULE_SIZE=34;
const moleculeCache={};
/* Each icon is drawn once into a small canvas at the game's own pixel scale, then reused. */
function moleculeIcon(key,variant=0){
 const id=key+':'+variant;if(moleculeCache[id])return moleculeCache[id];
 const c=document.createElement('canvas');c.width=c.height=MOLECULE_SIZE;const g=c.getContext('2d');
 g.translate(MOLECULE_SIZE/2,MOLECULE_SIZE/2);g.lineJoin='round';g.lineCap='round';
 (MOLECULE_ART[key]||MOLECULE_ART.phosphate)(g,variant);
 return moleculeCache[id]=c;
}
const mBall=(g,x,y,r,fill,edge='#0b1424',lw=1)=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=fill;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=lw;g.stroke();}};
const mLine=(g,pts,color,lw=2)=>{g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.strokeStyle=color;g.lineWidth=lw;g.stroke();};
const mText=(g,s,x,y,size,color='#fff',weight=800)=>{g.font=weight+' '+size+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.fillText(s,x,y+.5);};
const mRing=(g,x,y,r,sides,fill,edge,rot=Math.PI/6)=>{g.beginPath();for(let i=0;i<sides;i++){const a=rot+i/sides*Math.PI*2;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}g.closePath();g.fillStyle=fill;g.fill();g.strokeStyle=edge;g.lineWidth=1.4;g.stroke();};
const mPhos=(g,x,y,r=4.6)=>{mBall(g,x,y,r,'#ffb347','#6b3a05');mText(g,'P',x,y,r*1.35,'#3a1d00',900);};
const mAdenosine=(g,x,y)=>{mRing(g,x-3,y,4.6,6,'#5b8cff','#1a2d66');mRing(g,x+4.2,y,3.6,5,'#5b8cff','#1a2d66',0);mRing(g,x+5,y+8,4,5,'#f4d35e','#6b5410',-Math.PI/2);};
const BASE_ICON={A:'#ff5c6c',T:'#ffd23f',G:'#3ddc84',C:'#4aa3ff',U:'#b47cff'};
const MOLECULE_ART={
 phosphate(g){mBall(g,0,0,7,'#ffb347','#6b3a05',1.4);for(const [x,y]of [[0,-10],[10,0],[0,10],[-10,0]]){mLine(g,[[0,0],[x*.75,y*.75]],'#ffe0b0',2);mBall(g,x,y,3.4,'#ff6b6b','#5a0c0c');}mText(g,'P',0,0,9,'#3a1d00',900);},
 adp(g){mAdenosine(g,-8,-3);mLine(g,[[-1,5],[12,5]],'#ffe0b0',1.6);mPhos(g,4,5);mPhos(g,12,5);},
 atp(g){mAdenosine(g,-12,-3);mLine(g,[[-5,5],[12,5]],'#ffe0b0',1.6);mPhos(g,-1,5,4);mPhos(g,6,5,4);mPhos(g,13,5,4);mLine(g,[[9,-9],[6,-4],[10,-5],[7,0]],'#fff27a',1.6);},
 adpPi(g){mAdenosine(g,-10,-8);mLine(g,[[-3,0],[10,0]],'#ffe0b0',1.6);mPhos(g,3,0,4);mPhos(g,10,0,4);mText(g,'+',-3,11,10,'#e8f6ff');mPhos(g,6,11,4);},
 mrna(g){g.beginPath();for(let x=-14;x<=14;x++)g.lineTo(x,Math.sin(x/4)*3-3);g.strokeStyle='#c9b0ff';g.lineWidth=2.4;g.stroke();'AUGGCUA'.split('').forEach((b,i)=>{const x=-12+i*4;mLine(g,[[x,Math.sin(x/4)*3-3],[x,Math.sin(x/4)*3+6]],BASE_ICON[b],2.6);});},
 trna(g){g.save();g.translate(0,8);g.scale(.27,.27);g.beginPath();g.moveTo(-14,0);g.lineTo(-14,-26);g.quadraticCurveTo(-34,-30,-32,-46);g.quadraticCurveTo(-22,-58,-10,-48);g.lineTo(-8,-66);g.lineTo(8,-66);g.lineTo(10,-48);g.quadraticCurveTo(22,-58,32,-46);g.quadraticCurveTo(34,-30,14,-26);g.lineTo(14,0);g.closePath();g.fillStyle='#3b2a6e';g.fill();g.strokeStyle='#b99cff';g.lineWidth=5;g.stroke();g.restore();
  ['#ff5c6c','#3ddc84','#4aa3ff'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(-5+i*3.6,8,3,4);});mLine(g,[[0,-10],[0,-13]],'#b99cff',1.6);mBall(g,0,-15,4,'#ffd36b','#7a5a10');},
 release(g){g.beginPath();g.moveTo(-9,10);g.lineTo(-9,-2);g.quadraticCurveTo(-12,-12,0,-13);g.quadraticCurveTo(12,-12,9,-2);g.lineTo(9,10);g.closePath();g.fillStyle='#c0394f';g.fill();g.strokeStyle='#ffb0bd';g.lineWidth=1.4;g.stroke();mText(g,'STOP',0,1,6.5,'#fff',900);},
 polypeptide(g){const c=['#3ddc84','#ffd36b','#ff8fb0','#4aa3ff','#b47cff','#ff9f43'];let pts=[];for(let i=0;i<6;i++)pts.push([-13+i*5.2,Math.sin(i*1.3)*6]);mLine(g,pts,'#e8f6ff',1.4);pts.forEach(([x,y],i)=>mBall(g,x,y,3.3,c[i]));},
 sugar(g){const h=(x,y)=>mRing(g,x,y,4.2,6,'#ff9fd0','#7a2050');mLine(g,[[0,10],[0,2],[-7,-5],[0,2],[7,-5],[7,-12]],'#ffd6ea',1.4);h(0,9);h(0,1);h(-7,-6);h(7,-6);h(7,-13);},
 vesicleOrange(g){mBall(g,0,0,12,'#c46a2c55','#ffb071',2.4);mBall(g,0,0,9.5,null,'#ffb07188',1);mBall(g,-3,-2,3,'#3ddc84');mBall(g,3,3,2.5,'#ffd36b');},
 vesicleGold(g){mBall(g,0,0,12,'#e5b33c44','#fff0b0',2.4);mBall(g,0,0,9.5,null,'#fff0b088',1);mRing(g,-3,1,3,6,'#ff9fd0','#7a2050');mBall(g,4,-2,2.6,'#4aa3ff');},
 glucose(g){mRing(g,0,0,11,6,'#ffe27a','#7a5b10');const a=-Math.PI/2+Math.PI/6;mBall(g,Math.cos(-Math.PI/6-Math.PI/3)*11,Math.sin(-Math.PI/6-Math.PI/3)*11,3,'#ff6b6b','#5a0c0c');mText(g,'C₆',0,1,8,'#5a4005',900);},
 enzyme(g){g.beginPath();g.arc(0,0,11,.55,Math.PI*2-.55);g.lineTo(4,0);g.closePath();g.fillStyle='#2bb5a4';g.fill();g.strokeStyle='#bffff3';g.lineWidth=1.4;g.stroke();mRing(g,10,0,3.6,6,'#ffe27a','#7a5b10');},
 pyruvate(g){const C=[[-9,2],[0,-2],[9,2]];mLine(g,C,'#cfd8e3',2);C.forEach(([x,y])=>mBall(g,x,y,4,'#3b4554','#cfd8e3'));mBall(g,0,-10,3.4,'#ff6b6b','#5a0c0c');mBall(g,14,-4,3.4,'#ff6b6b','#5a0c0c');mBall(g,13,8,3.4,'#ff6b6b','#5a0c0c');mBall(g,-14,8,2.2,'#e8f6ff');},
 phospholipid(g){mLine(g,[[-3,-3],[-4,5],[-2,13]],'#f3d77a',2.4);mLine(g,[[3,-3],[2,5],[4,13]],'#f3d77a',2.4);mBall(g,0,-7,6.5,'#f7a8c8','#9c4f73',1.2);},
 cholesterol(g){mRing(g,-9,3,4.6,6,'#f3d77a','#6b5410');mRing(g,-1,-1,4.6,6,'#f3d77a','#6b5410');mRing(g,7,3,4.6,6,'#f3d77a','#6b5410');mRing(g,14,-2,3.8,5,'#f3d77a','#6b5410',0);mBall(g,-15,0,2.4,'#ff6b6b');mLine(g,[[17,-5],[19,-12]],'#f3d77a',2);},
 ions(g){mBall(g,-6,-3,8,'#b57bff','#3d1d6e',1.2);mText(g,'Na⁺',-6,-3,7,'#fff');mBall(g,7,6,8.5,'#ff9f43','#6b3a05',1.2);mText(g,'K⁺',7,6,7.5,'#3a1d00');},
 o2(g){mBall(g,-6,0,8,'#ff5c6c','#5a0c0c',1.2);mBall(g,6,0,8,'#ff5c6c','#5a0c0c',1.2);mLine(g,[[-2,-2.5],[2,-2.5]],'#fff',1.4);mLine(g,[[-2,2.5],[2,2.5]],'#fff',1.4);mText(g,'O',-6,0,7,'#fff');mText(g,'O',6,0,7,'#fff');},
 nucleotide(g,v){const b='AGCU'[v%4];mLine(g,[[-8,6],[0,2],[8,-4]],'#e8f6ff',1.6);mPhos(g,-9,7,4.2);mRing(g,0,2,4.4,5,'#f4d35e','#6b5410',-Math.PI/2);g.fillStyle=BASE_ICON[b];g.fillRect(5,-12,9,12);g.strokeStyle='#0b1424';g.strokeRect(5,-12,9,12);mText(g,b,9.5,-6,8);},
 dnaBase(g,v){const b='ATGC'[v%4];MOLECULE_ART.nucleotide(g,'AGCU'.indexOf(b)<0?0:0);g.fillStyle=BASE_ICON[b];g.fillRect(5,-12,9,12);g.strokeStyle='#0b1424';g.strokeRect(5,-12,9,12);mText(g,b,9.5,-6,8);},
 rnaBase(g,v){const b='AUGC'[v%4];MOLECULE_ART.nucleotide(g,0);g.fillStyle=BASE_ICON[b];g.fillRect(5,-12,9,12);g.strokeStyle='#0b1424';g.strokeRect(5,-12,9,12);mText(g,b,9.5,-6,8);},
 histone(g){for(const [x,y]of [[-5,-4],[5,-4],[-5,5],[5,5]])mBall(g,x,y,5.4,'#4f8fe0','#bcd8ff',1);g.beginPath();g.ellipse(0,0,13,9,-.35,0,Math.PI*2);g.strokeStyle='#ffd36b';g.lineWidth=2;g.stroke();},
 fattyAcid(g){mLine(g,[[-14,4],[-10,-2],[-6,4],[-2,-2],[2,4],[6,-2],[10,4]],'#f3d77a',2.4);mBall(g,13,-1,3.3,'#ff6b6b','#5a0c0c');mBall(g,13,7,2.6,'#ff6b6b','#5a0c0c');},
 toxin(g){mRing(g,-3,2,8,6,'#9be15d','#2f5a0c');mBall(g,7,-8,5,'#c86bff','#3d1d6e');mLine(g,[[3,-4],[5,-6]],'#e8f6ff',1.4);mText(g,'!',-3,2,11,'#24420a',900);},
 calcium(g){mBall(g,0,0,10,'#e8eef5','#7c8ea3',1.4);mText(g,'Ca²⁺',0,0,7,'#2a3a4c',900);},
 proton(g){mBall(g,0,0,9,'#ff6b6b','#5a0c0c',1.4);mText(g,'H⁺',0,0,9,'#fff',900);},
 aminoAcid(g){mLine(g,[[0,0],[0,10]],'#e8f6ff',1.6);mBall(g,0,0,6,'#3ddc84','#0d4a2a',1.2);mBall(g,-9,-3,3,'#4aa3ff');mBall(g,9,-3,3,'#ff6b6b');mBall(g,0,11,3.4,'#ffd36b');mText(g,'aa',0,0,6,'#062b17',900);},
 digest(g){g.beginPath();g.arc(0,0,11,.7,Math.PI*2-.7);g.lineTo(2,0);g.closePath();g.fillStyle='#d24a78';g.fill();g.strokeStyle='#ffc0d4';g.lineWidth=1.4;g.stroke();mBall(g,11,-2,2.4,'#3ddc84');mBall(g,14,3,2.4,'#ffd36b');},
 polymerase(g){mLine(g,[[-15,0],[15,0]],'#4aa3ff',2);for(let x=-13;x<=13;x+=4)mLine(g,[[x,-4],[x,4]],BASE_ICON['ATGC'[(x+13)/4%4|0]],1.6);mLine(g,[[-15,-5],[15,-5]],'#4aa3ff',1.6);mLine(g,[[-15,5],[15,5]],'#ff9f43',1.6);g.beginPath();g.arc(2,0,10,Math.PI*.15,Math.PI*1.85);g.strokeStyle='#7ff1e2';g.lineWidth=5;g.stroke();},
 repair(g){mLine(g,[[-15,-5],[15,-5]],'#4aa3ff',1.8);mLine(g,[[-15,5],[15,5]],'#4aa3ff',1.8);for(let x=-12;x<=12;x+=4)mLine(g,[[x,-4],[x,4]],x===0?'#ff5c6c':'#9fb6c8',1.6);mBall(g,0,-11,6,'#2bb5a4','#bffff3',1.2);mLine(g,[[5,-14],[9,-17]],'#fff27a',1.4);mLine(g,[[7,-9],[11,-9]],'#fff27a',1.4);},
 tubulin(g){for(let i=0;i<7;i++){mBall(g,-12+i*4,-3,2.6,i%2?'#3ddc84':'#9effc4','#0d4a2a',.8);mBall(g,-10+i*4,3,2.6,i%2?'#9effc4':'#3ddc84','#0d4a2a',.8);}},
 kinetochore(g){if(typeof dgChromosome==='function')dgChromosome(g,0,2,1,'#ff8fd0',0);g.fillStyle='#ffd36b';g.fillRect(-8,-1,4,6);g.fillRect(4,-1,4,6);mLine(g,[[-6,2],[-15,-10]],'#cfe3ff',1);mLine(g,[[6,2],[15,-10]],'#cfe3ff',1);},
 chromosome(g){if(typeof dgChromosome==='function')dgChromosome(g,0,0,1.25,'#8fd0ff',0);},
 viralDNA(g){for(let x=-14;x<=14;x+=1){const y1=Math.sin(x/4)*6,y2=-y1;if(x%4===0)mLine(g,[[x,y1],[x,y2]],'#ffd36b',1.2);}g.beginPath();for(let x=-14;x<=14;x++)g.lineTo(x,Math.sin(x/4)*6);g.strokeStyle='#ff5c8a';g.lineWidth=2.2;g.stroke();g.beginPath();for(let x=-14;x<=14;x++)g.lineTo(x,-Math.sin(x/4)*6);g.strokeStyle='#c86bff';g.stroke();},
 dnaHelix(g){for(let x=-14;x<=14;x+=1){const y1=Math.sin(x/4)*6;if(x%4===0)mLine(g,[[x,y1],[x,-y1]],BASE_ICON['ATGC'[((x+16)/4|0)%4]],1.4);}g.beginPath();for(let x=-14;x<=14;x++)g.lineTo(x,Math.sin(x/4)*6);g.strokeStyle='#4aa3ff';g.lineWidth=2.2;g.stroke();g.beginPath();for(let x=-14;x<=14;x++)g.lineTo(x,-Math.sin(x/4)*6);g.stroke();},
 membraneProtein(g){for(let x=-14;x<=14;x+=5){mBall(g,x,-8,2.4,'#f7a8c8','#9c4f73',.6);mBall(g,x,8,2.4,'#f7a8c8','#9c4f73',.6);}g.fillStyle='#f3d77a';g.fillRect(-15,-5,30,10);g.beginPath();g.ellipse(0,0,7,12,0,0,Math.PI*2);g.fillStyle='#4f8fe0';g.fill();g.strokeStyle='#bcd8ff';g.lineWidth=1.2;g.stroke();},
 guideRNA(g){mLine(g,[[-14,8],[2,8],[8,2],[8,-8],[2,-12],[-4,-8],[-4,-2]],'#c9b0ff',2.4);'AUGCC'.split('').forEach((b,i)=>{g.fillStyle=BASE_ICON[b];g.fillRect(-14+i*3.4,10,3,4);});},
 cas9(g){mBall(g,-5,0,10,'#2bb5a4','#bffff3',1.4);mBall(g,7,1,8,'#1f8f84','#bffff3',1.4);mLine(g,[[-9,-3],[1,-3],[4,1]],'#c9b0ff',2);mLine(g,[[-15,7],[15,7]],'#4aa3ff',1.6);mLine(g,[[-15,10],[15,10]],'#4aa3ff',1.6);}
};

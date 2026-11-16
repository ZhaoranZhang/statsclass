'use strict';
const $=id=>document.getElementById(id), BLUE='#0047AB',RED='#C8102E',ORANGE='#FF6B1A',PURPLE='#6A00F4',GREEN='#00A99D';
let ds='exercise_mood',selected=0,diagMode='real',seed=3,diagN=240;
const label={exercise_mood:['每周锻炼时间（h）','抑郁得分']};
const vals={exercise_mood:['exercise','depression']};
const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
const f=(x,n=3)=>Number.isFinite(x)?x.toFixed(n).replace('-','−'):'—';
function lin(x,y){let n=x.length,mx=avg(x),my=avg(y),xx=0,xy=0,yy=0;for(let i=0;i<n;i++){xx+=(x[i]-mx)**2;xy+=(x[i]-mx)*(y[i]-my);yy+=(y[i]-my)**2}let b=xy/xx,a=my-b*mx,r=xy/Math.sqrt(xx*yy),res=y.map((v,i)=>v-(a+b*x[i])),sse=res.reduce((s,v)=>s+v*v,0),mse=sse/(n-2),se=Math.sqrt(mse/xx),t=b/se;return{x,y,n,a,b,r,r2:r*r,mx,my,xx,yy,res,sse,mse,se,t,F:t*t}}
function realData(which=ds){const [k1,k2]=vals[which];return{x:DATA[which][k1].slice(),y:DATA[which][k2].slice()}}
function ticks(a,b){let dif=b-a||1,s=dif/5,m=10**Math.floor(Math.log10(s)),step=[1,2,2.5,5,10].map(v=>v*m).find(v=>dif/v<=6)||m*10;let out=[];for(let v=Math.ceil(a/step)*step;v<=b+step*.001;v+=step)out.push(+v.toFixed(8));return out}
function svgBase(x,y,labels,opts={}){const W=870,H=510,m={l:83,r:27,t:28,b:65};let xmin=Math.min(...x),xmax=Math.max(...x),ymin=Math.min(...y),ymax=Math.max(...y);let xp=(xmax-xmin||1)*.13,yp=(ymax-ymin||1)*.15;xmin-=xp;xmax+=xp;ymin-=yp;ymax+=yp;if(opts.zero){ymin=Math.min(ymin,0);ymax=Math.max(ymax,0)};const X=v=>m.l+(v-xmin)/(xmax-xmin)*(W-m.l-m.r),Y=v=>H-m.b-(v-ymin)/(ymax-ymin)*(H-m.t-m.b);let s=`<svg viewBox="0 0 ${W} ${H}">`;for(let q of ticks(xmin,xmax))s+=`<text x="${X(q)}" y="${H-30}" text-anchor="middle" font-size="17" fill="#555">${+q.toFixed(2)}</text><line x1="${X(q)}" y1="${H-m.b}" x2="${X(q)}" y2="${H-m.b+6}" stroke="#555"/>`;for(let q of ticks(ymin,ymax))s+=`<text x="${m.l-9}" y="${Y(q)+5}" text-anchor="end" font-size="17" fill="#555">${+q.toFixed(2)}</text><line x1="${m.l-6}" y1="${Y(q)}" x2="${m.l}" y2="${Y(q)}" stroke="#555"/>`;s+=`<path d="M${m.l},${m.t}V${H-m.b}H${W-m.r}" fill="none" stroke="#333" stroke-width="1.5"/><text x="${(m.l+W-m.r)/2}" y="${H-8}" text-anchor="middle" font-size="20">${labels[0]}</text><text transform="translate(24 ${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle" font-size="20">${labels[1]}</text>`;return{s,X,Y,W,H,m,xmin,xmax,ymin,ymax}}
function drawScatter(target,dat,opts={}){const {x,y}=dat,d=lin(x,y);let z=svgBase(x,y,opts.labels||label[ds]),{s,X,Y,xmin,xmax,H,m}=z;
if(opts.band){let up=[],lo=[];const crit=d.n>30?1.99:2.306;for(let j=0;j<=100;j++){let xv=xmin+(xmax-xmin)*j/100,yh=d.a+d.b*xv,err=crit*Math.sqrt(d.mse*(1/d.n+(xv-d.mx)**2/d.xx));up.push(X(xv)+','+Y(yh+err));lo.push(X(xv)+','+Y(yh-err))}s+=`<polygon points="${up.concat(lo.reverse()).join(' ')}" fill="${RED}" fill-opacity=".12"/>`}
if(opts.mean)s+=`<line x1="${X(xmin)}" y1="${Y(d.my)}" x2="${X(xmax)}" y2="${Y(d.my)}" stroke="${GREEN}" stroke-width="2" stroke-dasharray="8 7"/>`;
if(opts.resid||opts.all)for(let i=0;i<x.length;i++){if(opts.all||i===selected)s+=`<line x1="${X(x[i])}" y1="${Y(y[i])}" x2="${X(x[i])}" y2="${Y(d.a+d.b*x[i])}" stroke="${ORANGE}" stroke-width="${i===selected?4:1.5}" opacity="${i===selected?1:.40}"/>`}
if(opts.fit!==false)s+=`<line x1="${X(xmin)}" y1="${Y(d.a+d.b*xmin)}" x2="${X(xmax)}" y2="${Y(d.a+d.b*xmax)}" stroke="${RED}" stroke-width="3"/>`;
if(opts.pred!==undefined){let xv=opts.pred,yv=d.a+d.b*xv;s+=`<line x1="${X(xv)}" y1="${H-m.b}" x2="${X(xv)}" y2="${Y(yv)}" stroke="${PURPLE}" stroke-dasharray="7 5" stroke-width="2"/><circle cx="${X(xv)}" cy="${Y(yv)}" r="8" fill="${PURPLE}"/>`}
for(let i=0;i<x.length;i++){let match=opts.pred!==undefined&&opts.snapIndices&&opts.snapIndices.includes(i);let nearby=opts.pred!==undefined&&opts.nearIndices&&opts.nearIndices.includes(i); if(match){s+=`<line x1="${X(x[i])}" x2="${X(x[i])}" y1="${Y(y[i])}" y2="${Y(d.a+d.b*x[i])}" stroke="${ORANGE}" stroke-width="2.6" opacity=".85"/>`;}s+=`<circle ${opts.clickable?'data-point="'+i+'"':''} ${opts.pred!==undefined?'data-pred-point="'+i+'"':''} cx="${X(x[i])}" cy="${Y(y[i])}" r="${match?8.2:opts.clickable&&i===selected?9:6.7}" fill="${match?ORANGE:opts.clickable&&i===selected?ORANGE:BLUE}" fill-opacity=".84" stroke="${match?'#b05200':nearby?ORANGE:BLUE}" stroke-width="${nearby?2:1}" style="${opts.clickable||opts.pred!==undefined?'cursor:pointer':''}"><title>第 ${i+1} 位：X=${x[i]}, Y=${y[i]}</title></circle>`;}
s+='</svg>';$(target).innerHTML=s;if(opts.clickable)$(target).querySelectorAll('[data-point]').forEach(n=>n.addEventListener('click',()=>{selected=+n.dataset.point;updateResidual()}));if(opts.pred!==undefined)$(target).querySelectorAll('[data-pred-point]').forEach(n=>n.addEventListener('click',()=>{const i=+n.dataset.predPoint;$('predictX').value=dat.x[i];updatePred();}));return d}
function lg(z){const p=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.6150291621406,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lg(1-z);z--;let x=p[0];for(let i=1;i<9;i++)x+=p[i]/(z+i);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)}
function betacf(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;d=1/(Math.abs(d)<1e-300?1e-300:d);let h=d;for(let m=1;m<=400;m++){let m2=2*m,aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;let del=d*c;h*=del;if(Math.abs(del-1)<1e-13)break}return h}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;let bt=Math.exp(lg(a+b)-lg(a)-lg(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b}
const pt=(t,df)=>Number.isFinite(t)?ibeta(df/(df+t*t),df/2,.5):0;

function updateMain(){const dat=realData(),d=lin(dat.x,dat.y);drawScatter('fitPlot',dat,{fit:$('fitLine').checked,band:$('fitBand').checked,mean:$('fitMean').checked});$('fitStats').innerHTML=`n = <b>${d.n}</b><br>ŷ = <b>${f(d.a)} ${d.b<0?'−':'+'} ${f(Math.abs(d.b))}X</b><br>截距 a = <b>${f(d.a)}</b><br>斜率 b = <b>${f(d.b)}</b><br>SE(b) = <b>${f(d.se)}</b><br>t(${d.n-2}) = <b>${f(d.t)}</b><br>F(1, ${d.n-2}) = <b>${f(d.F)}</b><br>p = <b>${pt(d.t,d.n-2)<.001?"< .001":f(pt(d.t,d.n-2))}</b><br>R² = <b>${f(d.r2)}</b>`;updatePred();updateResidual()}
function updatePred(){
 const dat=realData(),d=lin(dat.x,dat.y),r=$('predictX'),lo=Math.min(...dat.x),hi=Math.max(...dat.x),pad=(hi-lo)*.13;
 const rangeLo=lo-pad,rangeHi=hi+pad;
 if(r.dataset.ds!==ds){r.min=rangeLo;r.max=rangeHi;r.step='any';r.value=6;r.dataset.ds=ds}
 let xv=+r.value;
 // Gentle magnetic snap to observed X (0.09 h = 5.4 min).
 const xSorted=[...new Set(dat.x)].sort((a,b)=>Math.abs(a-xv)-Math.abs(b-xv)||a-b);
 const candidate=xSorted[0], snapped=Math.abs(candidate-xv)<=.09;
 if(snapped){xv=candidate;r.value=String(xv)}
 const yhat=d.a+d.b*xv;
 $('predLabel').textContent='锻炼时间 X (h)';$('predictXV').textContent=f(xv,2)+(snapped?'  ●':'');
 // Always show four nearby observations, even when no exact match.
 const distances=dat.x.map((x,i)=>({i,dist:Math.abs(x-xv)})).sort((a,b)=>a.dist-b.dist||a.i-b.i);
 let nearest=distances.slice(0,4).map(o=>o.i);
 if(snapped){const exact=distances.filter(o=>o.dist<1e-8).map(o=>o.i);nearest=[...exact,...distances.filter(o=>o.dist>=1e-8).map(o=>o.i)].slice(0,Math.max(4,exact.length));}
 const snapIndices=snapped?dat.x.map((v,i)=>Math.abs(v-xv)<1e-8?i:-1).filter(i=>i>=0):[];
 const observed=`<div class="predObserved"><div class="nearTitle">${snapped?'已吸附至真实 X':'附近的真实观测'}</div><div class="nearData">${nearest.map(i=>`<div>被试 ${i+1}：X = <b>${f(dat.x[i],1)}</b>，Y = <b>${f(dat.y[i],1)}</b>，e = <b>${f(dat.y[i]-(d.a+d.b*dat.x[i]),2)}</b></div>`).join('')}</div></div>`;
 $('predictOut').innerHTML=`预测 Ŷ = <span style="color:${PURPLE}">${f(yhat,2)}</span>${observed}`;
 $('predEq').textContent=`ŷ = ${f(d.a)} ${d.b<0?'−':'+'} ${f(Math.abs(d.b))}X`;
 drawScatter('predPlot',dat,{pred:xv,snapIndices,nearIndices:nearest});
}
function updateResidual(){const dat=realData(),d=lin(dat.x,dat.y);selected=Math.min(selected,d.n-1);drawScatter('resPlot',dat,{resid:true,all:$('allResid').checked,clickable:true});let yh=d.a+d.b*dat.x[selected];$('resInfo').innerHTML=`被试 ${selected+1}<br>X = <b>${f(dat.x[selected],2)}</b><br>Y = <b>${f(dat.y[selected],2)}</b><br>预测 Ŷ = <b>${f(yh,2)}</b><br>残差 e = <b>${f(d.res[selected],2)}</b>`;$('sseStats').innerHTML=`SSE = Σe² = <b>${f(d.sse,2)}</b><br>MSE = <b>${f(d.mse,2)}</b>`}
function rng(a){return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}function normal(R){let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function simData(kind,seed){
 const R=rng(seed), x=[],y=[],n=+$('diagN').value;
 for(let i=0;i<n;i++){
  const xi=12*R(), z=normal(R);
  let noise=z*2.0;
  if(kind==='curve')noise=0.48*(xi-6)**2-5.8+z*1.1;
  if(kind==='funnel')noise=z*(0.3+xi*.95);
  if(kind==='skew')noise=4.0*(Math.exp(.72*z)-Math.exp(.72*.72/2));
  if(kind==='tail'){noise=z*1.4;if(R()<.10)noise+=(R()<.5?-1:1)*(16+8*R());}
  x.push(xi);y.push(19-xi+noise);
 }
 return {x,y};
}
// Acklam inverse normal CDF
function normInv(p){const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.44513413714299,3.75440866190742];let q,r;if(p<.02425){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}if(p>1-.02425)return -normInv(1-p);q=p-.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
function plotRF(dat){let d=lin(dat.x,dat.y),fitted=dat.x.map(v=>d.a+d.b*v),z=svgBase(fitted,d.res,['预测值 Ŷ','残差 e'],{zero:true}),{s,X,Y,xmin,xmax}=z;s+=`<line x1="${X(xmin)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}" stroke="${RED}" stroke-width="2" stroke-dasharray="6 5"/>`;for(let i=0;i<dat.x.length;i++)s+=`<circle cx="${X(fitted[i])}" cy="${Y(d.res[i])}" r="${dat.x.length>200?3.2:4.7}" fill="${BLUE}" opacity=".68"/>`;s+='</svg>';$('diagRF').innerHTML=s}
function plotQQ(dat){let d=lin(dat.x,dat.y),arr=d.res.slice().sort((a,b)=>a-b),n=arr.length,t=arr.map((_,i)=>normInv((i+.5)/n)),q1=a=>{let pos=(a.length-1)*.25,i=Math.floor(pos);return a[i]+(pos-i)*(a[i+1]-a[i])},q3=a=>{let pos=(a.length-1)*.75,i=Math.floor(pos);return a[i]+(pos-i)*(a[i+1]-a[i])};let slope=(q3(arr)-q1(arr))/(q3(t)-q1(t)),inter=q1(arr)-slope*q1(t);let z=svgBase(t,arr,['理论正态分位数','残差分位数']),{s,X,Y,xmin,xmax}=z;s+=`<line x1="${X(xmin)}" y1="${Y(inter+slope*xmin)}" x2="${X(xmax)}" y2="${Y(inter+slope*xmax)}" stroke="${RED}" stroke-width="2"/>`;for(let i=0;i<n;i++)s+=`<circle cx="${X(t[i])}" cy="${Y(arr[i])}" r="${n>200?3.2:4.5}" fill="${BLUE}" opacity=".68"/>`;s+='</svg>';$('diagQQ').innerHTML=s}
function updateDiag(){let kind=$('diagKind').value,dat=diagMode==='real'?realData():simData(kind,seed);plotRF(dat);plotQQ(dat);const hints={normal:['随机分布在 0 附近','大致沿直线'],curve:['注意弯曲趋势','Q–Q 不一定异常'],funnel:['注意散布宽度变化','Q–Q 不一定异常'],skew:['注意残差的分布形状','出现系统性弯曲'],tail:['注意离群残差','注意两端偏离']};let h=diagMode==='real'?['观察有无系统性形态','观察是否大致沿直线']:hints[kind];$('rfHint').textContent=h[0];$('qqHint').textContent=h[1]}
for(const b of document.querySelectorAll('nav button'))b.onclick=()=>{document.querySelectorAll('nav button').forEach(v=>v.classList.toggle('on',v===b));document.querySelectorAll('section').forEach(v=>v.classList.toggle('on',v.id===b.dataset.tab))};

$('fitLine').onchange=updateMain;$('fitBand').onchange=updateMain;$('fitMean').onchange=updateMain;$('predictX').oninput=updatePred;$('allResid').onchange=updateResidual;
$('diagMode').onclick=e=>{let b=e.target.closest('button[data-mode]');if(!b)return;diagMode=b.dataset.mode;$('diagMode').querySelectorAll('button').forEach(v=>v.classList.toggle('on',v===b));$('diagSimCtl').classList.toggle('invisible',diagMode!=='sim');$('nextSeed').classList.toggle('invisible',diagMode!=='sim');$('diagNCtl').classList.toggle('invisible',diagMode!=='sim');updateDiag()};
$('diagN').onchange=updateDiag;$('diagKind').onchange=updateDiag;$('nextSeed').onclick=()=>{seed++;updateDiag()};
updateMain();updateDiag();

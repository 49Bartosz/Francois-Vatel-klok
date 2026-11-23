(function(){
  var ZONE='Europe/Paris'; // same clock as Berlin: CET winter, CEST summer
  var fmt=new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit',
    weekday:'long',day:'numeric',month:'long',year:'numeric',timeZoneName:'short'});
  var pad=function(n){return String(n).padStart(2,'0')},$=function(i){return document.getElementById(i)};
  function now(){var p={},d=new Date();fmt.formatToParts(d).forEach(function(x){p[x.type]=x.value});
    return{h:+p.hour,m:+p.minute,s:+p.second,ms:d.getMilliseconds(),date:p.weekday+' '+p.day+' '+p.month+' '+p.year,tz:p.timeZoneName}}

  // name, description, preview font, colorways
  var C={
   paper:{n:'Paper',d:'The time in words, in a calm serif.',f:"'Instrument Serif',Georgia,serif",cw:[
     {n:'Cream',bg:'#efe9dd',fg:'#1d2a2a',ac:'#2f6f5e',mu:'#6f776f'},
     {n:'Ink',bg:'#14110f',fg:'#f2e8d5',ac:'#e0a458',mu:'#8a7f6e'},
     {n:'Blush',bg:'#f6dcd5',fg:'#3a1f2b',ac:'#c2415d',mu:'#8d6672'}]},
   neon:{n:'Neon',d:'Glowing digits that hum in the dark.',f:"'Unbounded',sans-serif",cw:[
     {n:'Magenta',bg:'#07040f',fg:'#f4eaff',ac:'#ff2fb3',a2:'#6a1bff',a3:'#35e6ff'},
     {n:'Cyan',bg:'#020b12',fg:'#e6fbff',ac:'#35e6ff',a2:'#1b6aff',a3:'#ff2fb3'},
     {n:'Acid',bg:'#0a0d04',fg:'#f6ffe0',ac:'#b6ff2f',a2:'#2fff8a',a3:'#ffe62f'}]},
   flip:{n:'Flip',d:'Split-flap cards that tumble every change.',f:"'Space Grotesk',sans-serif",cw:[
     {n:'Graphite',bg:'#16171a',cd:'#2a2c31',fg:'#f5f5f5',ac:'#ff5b3a'},
     {n:'Station',bg:'#e9e4d8',cd:'#1c1c1c',fg:'#f1ece0',ac:'#ff5b3a'},
     {n:'Midnight',bg:'#0b1630',cd:'#16264d',fg:'#ffffff',ac:'#ffd166'}]},
   orbit:{n:'Orbit',d:'Three rings fill for hours, minutes, seconds.',f:"'Unbounded',sans-serif",cw:[
     {n:'Aurora',bg:'#070b14',fg:'#eaf2ff',ac:'#4ef0b0',a2:'#4e9bff',a3:'#b46bff'},
     {n:'Sunset',bg:'#1a0a14',fg:'#fff1e6',ac:'#ff6b4a',a2:'#ffb347',a3:'#ff4f9a'},
     {n:'Mono',bg:'#f2f2ee',fg:'#161616',ac:'#161616',a2:'#6b6b66',a3:'#b5b5ae'}]},
   vatel:{n:'Vatel Service Board',d:'Black, yellow and white, with the school logo.',f:"'Anton',sans-serif",cw:[
     {n:'Black',bg:'#0a0a0a',fg:'#ffffff',ac:'#ffd400',on:'#0a0a0a',mu:'#a8a8a8'},
     {n:'Yellow',bg:'#ffd400',fg:'#0a0a0a',ac:'#0a0a0a',on:'#ffd400',mu:'#3b3300'},
     {n:'White',bg:'#ffffff',fg:'#0a0a0a',ac:'#ffd400',on:'#0a0a0a',mu:'#666666'}]}
  };
  var VARS=['bg','fg','ac','a2','a3','mu','cd','on'];
  var DEF={bg:'#111111',fg:'#f4f1ea',ac:'#ffd400',a2:'#6a1bff',a3:'#35e6ff',mu:'#8a8780',cd:'#222222',on:'#0a0a0a'};
  var cur=null,store={};
  try{store=JSON.parse(localStorage.getItem('cet-cw')||'{}')}catch(e){}

  // Hub cards
  var h='';Object.keys(C).forEach(function(k){var c=C[k],w=c.cw[0];
    h+='<a class="card" href="#'+k+'" style="background:'+w.bg+';color:'+w.fg+'"><span class="pv" data-pv="'+k+'" style="font-family:'+c.f+';color:'+w.ac+'"></span>'+
       '<div><h2>'+c.n+'</h2><p class="ds">'+c.d+'</p><div class="sw">'+
       c.cw.map(function(x){return '<i style="background:'+x.ac+'"></i>'}).join('')+'</div></div></a>';});
  $('cards').innerHTML=h;
  var pvs=[].slice.call(document.querySelectorAll('[data-pv]'));

  // Flip build
  var fh='';['h','m','s'].forEach(function(g){fh+='<div class="pair"><div class="fc'+(g==='s'?' sec':'')+'"></div><div class="fc'+(g==='s'?' sec':'')+'"></div></div>'});
  $('flip').innerHTML=fh;var fcs=[].slice.call(document.querySelectorAll('.fc')),fv=[];

  // Logo fallback
  $('logo').addEventListener('error',function(){this.classList.add('hide');$('logoFb').classList.remove('hide')});

  // Words
  var HW=['twelve','one','two','three','four','five','six','seven','eight','nine','ten','eleven'];
  var MW={0:'',5:'five past',10:'ten past',15:'quarter past',20:'twenty past',25:'twenty-five past',30:'half past',35:'twenty-five to',40:'twenty to',45:'quarter to',50:'ten to',55:'five to'};
  function words(h,m){var m5=Math.round(m/5)*5,hh=h;if(m5===60){m5=0;hh++}if(m5>30)hh++;var w=HW[hh%12];
    return m5===0?w+' <em>o’clock</em>':MW[m5]+' <em>'+w+'</em>'}

  // Vatel services: [start hour, label]
  var SV=[[0,'Service closed'],[7,'Breakfast service'],[11.5,'Lunch service'],[14.5,'Afternoon classes'],[18,'Dinner service'],[22,'Service closed']];
  function svc(t){var f=t.h+t.m/60,i=0;for(var k=0;k<SV.length;k++)if(f>=SV[k][0])i=k;
    var nx=SV[(i+1)%SV.length],nh=i+1<SV.length?nx[0]:24+SV[1][0];
    var mins=Math.round((nh-f)*60)-(t.s>0?0:0),hh=Math.floor(mins/60),mm=mins%60;
    return{label:SV[i][1],next:'Next: '+nx[1].toLowerCase()+' in '+(hh?hh+' h ':'')+mm+' min'}}

  var last={};
  function tick(){
    var t=now(),sm=t.s+t.ms/1000,mm=t.m+sm/60,hs=pad(t.h)+':'+pad(t.m);
    if(last.tz!==t.tz){$('zone').textContent=t.tz+' · '+(t.tz==='CEST'?'UTC+2 summer time':'UTC+1')+' · '+t.date;last.tz=t.tz}
    if(!cur){pvs.forEach(function(p){p.textContent=hs});}
    else if(cur==='paper'){var key=t.h+':'+Math.round(t.m/5);if(last.k!==key){$('pW').innerHTML=words(t.h,t.m);last.k=key}
      $('pD').textContent=hs+':'+pad(t.s);$('pB').style.width=(sm/60*100)+'%'}
    else if(cur==='neon'){$('nH').textContent=pad(t.h);$('nM').textContent=pad(t.m);$('nS').textContent=pad(t.s)}
    else if(cur==='flip'){var s=pad(t.h)+pad(t.m)+pad(t.s);fcs.forEach(function(el,i){if(fv[i]!==s[i]){el.textContent=s[i];
      if(fv[i]!==undefined){el.classList.remove('go');void el.offsetWidth;el.classList.add('go')}fv[i]=s[i]}})}
    else if(cur==='orbit'){[['oH',180,((t.h%12)+mm/60)/12],['oM',148,mm/60],['oS',116,sm/60]].forEach(function(r){
      var C2=2*Math.PI*r[1],e=$(r[0]);e.style.strokeDasharray=C2;e.style.strokeDashoffset=C2*(1-Math.max(r[2],.002))});
      $('oT').textContent=hs;$('oD').textContent=pad(t.s)+' sec'}
    else if(cur==='vatel'){$('vHM').textContent=hs;$('vS').textContent=pad(t.s);$('vDate').textContent=t.date;
      var v=svc(t);$('vSvc').textContent=v.label;$('vNext').textContent=v.next}
    requestAnimationFrame(tick);
  }

  function applyCW(k,i){var w=C[k].cw[i];
    VARS.forEach(function(v){document.body.style.setProperty('--'+v,w[v]||DEF[v])});
    [].slice.call($('cws').children).forEach(function(b,j){b.setAttribute('aria-pressed',String(j===i))});
    store[k]=i;try{localStorage.setItem('cet-cw',JSON.stringify(store))}catch(e){}}

  function route(){
    var k=location.hash.replace('#','');
    if(!C[k])k=null;cur=k;last.k=null;fv=[];
    $('hub').classList.toggle('hide',!!k);$('stage').classList.toggle('hide',!k);
    document.querySelectorAll('.view').forEach(function(v){v.classList.toggle('on',v.id==='v-'+k)});
    if(!k){VARS.forEach(function(v){document.body.style.removeProperty('--'+v)});document.title='CET Clock Studio';return}
    document.title=C[k].n+' · CET Clock';
    $('cws').innerHTML=C[k].cw.map(function(w,i){return '<button type="button" aria-label="'+w.n+'" title="'+w.n+'" style="--d1:'+w.ac+';--d2:'+w.bg+'" data-i="'+i+'"></button>'}).join('');
    [].slice.call($('cws').children).forEach(function(b){b.addEventListener('click',function(){applyCW(k,+b.dataset.i)})});
    applyCW(k,store[k]||0);window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',route);
  $('fs').addEventListener('click',function(){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}catch(e){}});
  route();tick();
})();
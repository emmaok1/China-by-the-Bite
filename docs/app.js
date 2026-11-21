const icons = {
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 save:'<path d="M6 4h12v17l-6-4-6 4z"/>',eat:'<path d="M3 12h18a9 9 0 0 1-18 0ZM8 21h8m-5-12 8-7m-4 7 6-5"/>',
 see:'<path d="M3 10c4 0 7-3 9-6 2 3 5 6 9 6M5 11h14M7 12v6m5-6v6m5-6v6M4 19h16M2 22h20M12 2v2"/>',
 route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
 snack:'<path d="M3 12c2-5 5-8 9-8s7 3 9 8c-1 5-4 8-9 8s-8-3-9-8Zm1-1 4 1 2-4 2 4 3-4 1 4 4-1"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5z"/>'
};
const icon=(k)=>'<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+icons[k]+'</svg>';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=k=>'assets/'+k+'.webp';
const cities=Object.keys(guides);
const tabs={eat:['eat','Dishes'],snacks:['snack','Snacks'],see:['see','Sights'],route:['route','Routes'],saved:['save','Saved']};
const primaryNav=[
 {key:'eat',icon:'eat',label:'Food'},
 {key:'see',icon:'see',label:'Sights'},
 {key:'route',icon:'route',label:'Routes'},
 {key:'saved',icon:'save',label:'Saved'}
];
const records={};
const hangzhouList='https://mdaily.hangzhou.com.cn/dskb/2026/05/30/article_detail_2_20260530A054.html';
for(const [city,guide] of Object.entries(guides)){
 for(const [type,items] of [['eat',menus[city].dishes],['snacks',menus[city].snacks]]){
  items.forEach((item,index)=>{
   records[city+'-'+item.id]={...item,city,type,order:item.publishedPosition||index+1};
  });
 }
 for(const [id,name,zh,story,place,historySource] of guide.sights){
  records[city+'-'+id]={id,name,zh,story,historySource,query:place||zh,city,type:'see'};
 }
}
let saved=new Set();
try{const ids=JSON.parse(localStorage.getItem('bite-saves')||'[]'); if(Array.isArray(ids))saved=new Set(ids.filter(id=>records[id]));}catch{}
let city,tab;
function mapLink(place,which=city,direct){
 const url=direct||'https://uri.amap.com/search?keyword='+encodeURIComponent(place)+'&city='+encodeURIComponent(guides[which].zh)+'&callnative=0';
 return '<a class="action" target="_blank" rel="noopener" href="'+url+'">'+icon('pin')+'Open map</a>';
}
const tickets='<a class="action secondary" href="https://bookingticket.dpm.org.cn/" target="_blank" rel="noopener">Palace Museum tickets ↗</a>';
function updateSaves(){
 document.querySelectorAll('[data-save]').forEach(b=>{
  const id=b.dataset.save,selected=saved.has(id);
  b.setAttribute('aria-pressed',selected);b.setAttribute('aria-label',(selected?'Unsave ':'Save ')+records[id].name);
 });
}
function foodPhotoNote(item){
 return item.photoNote?'<span class="photo-note">'+esc(item.photoNote)+'</span>':'';
}
function card(id){
 const item=records[id];
 const rank=item.order?'<span class="rank" aria-label="List number '+item.order+'">'+String(item.order).padStart(2,'0')+'</span>':'';
 const chinese=item.type==='see'?'':'<span lang="zh-CN">'+esc(item.zh)+'</span>';
 return '<article class="card"><button data-item="'+id+'" class="card-open">'+rank+'<span class="card-image"><img loading="lazy" src="'+img(item.id)+'" alt="">'+foodPhotoNote(item)+'</span><div class="caption"><h3>'+esc(item.name)+'</h3>'+chinese+'</div></button><button class="bookmark" data-save="'+id+'">'+icon('save')+'</button></article>';
}
function draw(){
 const [destination,section]=location.hash.slice(1).split('/');
 city=cities.includes(destination)?destination:cities[0];tab=Object.hasOwn(tabs,section)?section:'eat';
 const g=guides[city];
 document.title=g.name+' · China by the Bite';
 const isFood=tab==='eat'||tab==='snacks';
 const isSaved=tab==='saved';
 $('hero').hidden=isSaved;
 $('cities').hidden=isSaved;
 $('cities').innerHTML=cities.map(key=>'<a href="#'+key+'/'+tab+'" '+(key===city?'aria-current="page"':'')+'><span class="waypoint"></span>'+guides[key].name+'</a>').join('<i aria-hidden="true"></i>');
 $('hero').innerHTML='<img class="cover" src="'+img(g.cover)+'" alt="'+g.landmark+' in '+g.name+'"><div class="shade"></div><div class="hero-copy"><h1>'+g.name+'<span class="city-seal" aria-hidden="true" lang="zh-CN">'+g.zh+'</span></h1></div><span class="photo-place">'+icon('pin')+g.landmark+'</span>';
 $('dock-links').innerHTML=primaryNav.map(link=>{
  const active=link.key===(isFood?'eat':tab);
  const target=link.key==='eat'&&isFood?tab:link.key;
  return '<a href="#'+city+'/'+target+'" '+(active?'aria-current="page"':'')+'><span class="dock-icon">'+icon(link.icon)+'</span><span>'+link.label+'</span></a>';
 }).join('');
 if(isSaved){
  drawSaved();
 }else if(tab==='route'){
  const steps=g.steps.map(([when,where,zh,tip],i)=>'<li><span class="step">'+(i+1)+'</span><div><small>'+when+'</small><h3>'+where+'</h3><p>'+tip+'</p>'+mapLink(zh)+'</div></li>').join('');
  $('content').innerHTML='<div class="section-head"><h2>'+g.route+'</h2></div><ol class="walk">'+steps+'</ol>'+(city==='guangzhou'?'<details><summary>After dark · Canton Tower</summary><p>See the tower lights from across the Pearl River.</p>'+mapLink('花城广场')+'</details>':'');
 }else{
  const ids=Object.keys(records).filter(id=>records[id].city===city&&records[id].type===tab);
  if(isFood){
   const filters=['eat','snacks'].map(key=>'<a href="#'+city+'/'+key+'" '+(tab===key?'aria-current="page"':'')+'>'+tabs[key][1]+'</a>').join('');
   $('content').innerHTML='<div class="food-controls"><nav aria-label="Food categories" class="food-switch">'+filters+'</nav><button class="rank-note" data-ranking type="button">'+(city==='hangzhou'?'2026 must-eats':'Guide picks')+' ⓘ</button></div><div class="grid">'+ids.map(card).join('')+'</div>';
  }else{
   $('content').innerHTML='<div class="section-head"><h2>Sights</h2></div><div class="grid sights-grid">'+ids.map(card).join('')+'</div>';
  }
 }
 updateSaves();
}
const sheet=$('sheet');
function modal(html,label,kind){
 $('sheet-body').innerHTML=html;sheet.setAttribute('aria-label',label);sheet.dataset.kind=kind;
 if(!sheet.open){sheet.showModal();document.body.classList.add('locked');}sheet.scrollTop=0;
}
function showItem(id){
 const item=records[id];
 const food=item.type!=='see';
 const title='<h2>'+esc(item.name)+'</h2>'+(food?'<div class="menu-zh" lang="zh-CN">'+esc(item.zh)+'</div>':'');
 const place=food?'<div class="venue"><small>Where to try it</small><strong>'+esc(item.venue)+'</strong></div>':'';
 const links=[];
 if(item.listing)links.push(sourceLink(item.listing,'AMap list'));
 if(item.source)links.push(sourceLink(item.source,'Restaurant'));
 if(item.historySource&&item.historySource!==item.source)links.push(sourceLink(item.historySource,food?'Food story':'Landmark history'));
 const sources=links.length?'<details class="sources"><summary>Sources</summary>'+links.join(' · ')+'</details>':'';
 modal('<div class="detail-media"><img class="detail-photo" src="'+img(item.id)+'" alt="'+esc(item.name)+'">'+foodPhotoNote(item)+'</div><div class="detail"><small>'+guides[item.city].name+' · '+tabs[item.type][1]+'</small>'+title+'<p>'+esc(item.story)+'</p>'+place+'<div class="actions">'+mapLink(item.query,item.city,item.mapURL)+(item.id==='palace'?tickets:'')+'<button class="action secondary" data-save="'+id+'">'+icon('save')+'<span>Save</span></button></div>'+sources+'</div>',item.name,'item');
 updateSaves();sheet.querySelector('[data-save] span').textContent=saved.has(id)?'Saved':'Save';
}
function sourceLink(url,label){
 return '<a href="'+esc(url)+'" target="_blank" rel="noopener">'+label+'</a>';
}
function showRanking(){
 const isHangzhou=city==='hangzhou';
 const text=isHangzhou
  ? 'The numbers follow '+(tab==='snacks'?'selected entries from the snack list':'the ten dishes, in published order')+' at Hangzhou’s May 2026 food festival. Local chefs and the city’s food association helped choose the entries.'
  : 'These are our picks for a first visit, ordered by local significance and variety. Each dish links to a place that serves it.';
 const reference=isHangzhou?sourceLink(hangzhouList,'Read the 2026 list')+' · ':'';
 const amap='https://www.amap.com/ranking/'+city+'/food';
 modal('<div class="detail collection"><h2>About the list</h2><p>'+text+'</p><div class="source-links">'+reference+sourceLink(amap,'AMap restaurant guide')+'</div></div>','About the list','ranking');
}
function drawSaved(){
 const groups=cities.map(key=>{
  const ids=[...saved].filter(id=>records[id].city===key);
  if(!ids.length)return '';
  return '<section class="saved-group"><h3>'+guides[key].name+'</h3><div class="grid">'+ids.map(card).join('')+'</div></section>';
 }).join('');
 $('content').innerHTML='<div class="section-head"><h2>Saved</h2></div>'+(groups||'<div class="empty-saves">'+icon('save')+'<p>Bookmark a dish or sight to find it here.</p><a class="action" href="#'+city+'/eat">Explore food</a></div>');
}
$('credits').addEventListener('click',async()=>{
 modal('<div class="detail collection"><h2>Photo credits</h2><p>Loading…</p></div>','Photo credits','credits');
 try{
  const r=await fetch('credits.json');if(!r.ok)throw Error();
  const credits=await r.json();
  if(sheet.dataset.kind!=='credits'||!sheet.open)return;
  const lines=Object.values(credits).map(d=>'<li><a target="_blank" rel="noopener" href="'+esc(d.url)+'">'+esc(d.name.replace(/^File:/,''))+'</a><br>'+esc(d.artist)+' · <a target="_blank" rel="noopener" href="'+esc(d.licenseurl||d.url)+'">'+esc(d.license)+'</a></li>').join('');
  modal('<div class="detail collection"><h2>Photo credits</h2><p>Images are resized and cropped for display. Original sources and licenses are linked below.</p><ul class="credit-list">'+lines+'</ul></div>','Photo credits','credits');
 }catch{if(sheet.open&&sheet.dataset.kind==='credits')$('sheet-body').innerHTML='<div class="detail"><p>Credits could not load. Reopen to retry.</p></div>'}
});
document.addEventListener('click',e=>{
 if(e.target.closest('[data-ranking]'))return showRanking();
 const b=e.target.closest('[data-save],[data-item]');if(!b)return;
 if(b.dataset.item)return showItem(b.dataset.item);
 const id=b.dataset.save;if(saved.has(id))saved.delete(id);else saved.add(id);
 try{localStorage.setItem('bite-saves',JSON.stringify([...saved]))}catch{}
 if(tab==='saved')drawSaved();
 updateSaves();
 if(sheet.open&&sheet.dataset.kind==='item')b.querySelector('span').textContent=saved.has(id)?'Saved':'Save';
});
sheet.querySelector('.close').onclick=()=>sheet.close();
sheet.addEventListener('click',e=>{if(e.target===sheet){const b=sheet.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)sheet.close();}});
sheet.addEventListener('close',()=>document.body.classList.remove('locked'));
window.addEventListener('hashchange',()=>{
 const previousCity=city,previousTab=tab;
 if(sheet.open)sheet.close();
 draw();
 const switchingFood=previousCity===city&&['eat','snacks'].includes(previousTab)&&['eat','snacks'].includes(tab);
 if(switchingFood&&window.scrollY>$('content').offsetTop)$('content').scrollIntoView();
 if(!switchingFood)window.scrollTo(0,0);
});
draw();

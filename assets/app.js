'use strict';
const root = document.body.dataset.base || './';
const page = document.body.dataset.page;
const currentColor = document.body.dataset.color;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE = 'exterior-paint-library:saved:v1';
let saved;
try { const value = JSON.parse(localStorage.getItem(STORAGE) || '[]'); saved = new Set(Array.isArray(value) ? value.filter(x=>typeof x==='string') : []); } catch { saved = new Set(); }
let colors=[], all=[], shown=[], current=0, filter='body', colorChoice=currentColor || 'all', savedOnly=false;
const expanded = new Set();
const names={confirmed:'Source-confirmed body',attributed:'Secondary attribution',accents:'Doors & accents',uncertain:'Uncertain example',samples:'Sample boards only'};
const filterNotes={body:'Body photos include source-confirmed and secondary-attributed projects. Each is labeled below.',confirmed:'These project sources explicitly identify the paint applied to the house body.',attributed:'These body colors are labeled by secondary sources; an original paint statement was not recovered.',accents:'The named color appears on an exterior accent. The main siding may use another color.',all:'Includes accents, uncertain examples and sample boards. These are labeled separately from body photos.'};
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function updateSavedCounts(){document.querySelectorAll('[data-saved-count]').forEach(el=>el.textContent=saved.size);}
function toggleSave(key){
 const existed=saved.has(key);existed?saved.delete(key):saved.add(key);
 try{localStorage.setItem(STORAGE,JSON.stringify([...saved]));}catch{toast('Saved for this visit. Browser storage is unavailable.');}
 updateSavedCounts();
 document.querySelectorAll('[data-save]').forEach(b=>{const yes=saved.has(b.dataset.save);b.classList.toggle('saved',yes);b.setAttribute('aria-pressed',String(yes));if(b.classList.contains('photo-save')){b.textContent=yes?'♥':'♡';b.setAttribute('aria-label',(yes?'Unsave ':'Save ')+(b.dataset.title||'photo'));}else b.textContent=yes?'♥ Saved to your shortlist':'♡ Save this photo';});
 if(savedOnly) render();
 toast(existed?'Removed from your saved photos':'Saved to your photo shortlist');
}
updateSavedCounts();
function setQuery(){const u=new URL(location.href);u.searchParams.delete('filter');u.searchParams.delete('color');u.searchParams.delete('saved');u.searchParams.delete('q');if(filter!=='body')u.searchParams.set('filter',filter);if(!currentColor&&colorChoice!=='all')u.searchParams.set('color',colorChoice);if(savedOnly)u.searchParams.set('saved','1');const q=$('#search')?.value.trim();if(q)u.searchParams.set('q',q);history.replaceState(null,'',u);}
function imageCard(x){const {p,g,c,key}=x;return `<figure class="photo-card"><button class="photo-open" data-open="${esc(key)}" aria-label="Enlarge ${esc(p.title)} — ${esc(c.name)}"><img src="${esc(root+p.thumb)}" alt="${esc(c.name+' — '+g.title+' — '+p.title)}" loading="lazy" decoding="async"></button><button class="photo-save ${saved.has(key)?'saved':''}" data-save="${esc(key)}" data-title="${esc(p.title)}" aria-label="${saved.has(key)?'Unsave':'Save'} ${esc(p.title)}" aria-pressed="${saved.has(key)}">${saved.has(key)?'♥':'♡'}</button><figcaption><span class="photo-title">${esc(p.title)}</span><p class="photo-note">${esc(p.note)}</p></figcaption></figure>`;}
function render(){
 const term=$('#search').value.toLowerCase().trim();
 shown=all.filter(x=>(colorChoice==='all'||x.c.slug===colorChoice)&&(filter==='all'||filter==='body'&&['confirmed','attributed'].includes(x.g.category)||x.g.category===filter)&&(!savedOnly||saved.has(x.key))&&(!term||x.search.includes(term)));
 const groups=new Map();for(const x of shown){const key=x.c.slug+'/'+x.g.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);}
 $('#result-count').textContent=`${shown.length} image${shown.length!==1?'s':''} · ${groups.size} project group${groups.size!==1?'s':''}`;
 $('#filter-note').textContent=savedOnly?'Your saved photos are stored in this browser. Active color, category and search filters still apply.':filterNotes[filter];
 $('#saved-toggle').setAttribute('aria-pressed',String(savedOnly));$('#saved-toggle').textContent=savedOnly?'♥ Saved only':'♡ Saved only';
 document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b.dataset.filter===filter;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 $('#gallery').innerHTML=[...groups].map(([key,items])=>{
 const {g,c}=items[0];const open=expanded.has(key);const displayed=open?items:items.slice(0,3);
 return `<section class="project ${items.length===1?'single':''}"><div class="project-heading"><div><div class="project-kicker"><a href="${root}colors/${c.slug}/"><i style="background:${c.swatch}"></i>${esc(c.name)} · ${c.code}</a><span class="evidence-badge ${g.category}">${names[g.category]}</span></div><h3>${esc(g.title)}</h3><p class="project-credit">${esc(g.credit)} · ${items.length} image${items.length===1?'':'s'}</p></div><a class="project-source" href="${esc(g.source)}" target="_blank" rel="noopener noreferrer">Project source ↗</a></div><div class="photo-grid">${displayed.map(imageCard).join('')}</div>${items.length>3?`<button class="show-more" data-expand="${esc(key)}" aria-expanded="${open}">${open?'Show fewer views ↑':`Show all ${items.length} views ↓`}</button>`:''}<details class="project-details"><summary>Paint palette, color evidence & sources</summary><p class="palette">${esc(g.palette)}</p><p>${esc(g.evidence)}</p><div class="source-links"><a href="${esc(g.source)}" target="_blank" rel="noopener noreferrer">Project source ↗</a>${(g.extra_sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')}</div></details></section>`;
 }).join('')||`<div class="empty-state"><h3>${savedOnly&&!saved.size?'Start a little shortlist.':'No photos in this view.'}</h3><p>${savedOnly&&!saved.size?'Tap the heart on any photo to save it here.':'Try another color, a broader category, or a different search.'}</p><button class="button outline" data-reset>Browse all body photos →</button></div>`;
 setQuery();
}
let viewerItems=[];
function openPhoto(key){viewerItems=shown.slice();current=viewerItems.findIndex(x=>x.key===key);if(current<0)return;renderViewer();$('#viewer').showModal();document.body.style.overflow='hidden';}
function renderViewer(){
 if(!viewerItems.length)return;current=(current+viewerItems.length)%viewerItems.length;const {p,g,c,key}=viewerItems[current];
 $('#viewer-image').src=root+p.file;$('#viewer-image').alt=c.name+' — '+g.title+' — '+p.title;
 $('#viewer-position').textContent=`${current+1} / ${viewerItems.length} · ${c.name}`;
 $('#viewer-prev').disabled=$('#viewer-next').disabled=viewerItems.length<2;
 $('#viewer-info').innerHTML=`<p class="eyebrow">${c.code} / Sherwin-Williams</p><h2>${esc(c.name)}</h2><span class="evidence-badge ${g.category}">${names[g.category]}</span><h3>${esc(p.title)}</h3><p>${esc(g.title)}</p><p>${esc(p.note)}</p><p class="palette">${esc(g.palette)}</p><button class="button outline ${saved.has(key)?'saved':''}" data-save="${esc(key)}" aria-pressed="${saved.has(key)}">${saved.has(key)?'♥ Saved to your shortlist':'♡ Save this photo'}</button><a class="button dark" href="${esc(p.source||g.source)}" target="_blank" rel="noopener noreferrer">View original source ↗</a><a class="text-link" href="${esc(root+p.file)}" download="${esc(p.download_name||p.file.split('/').pop())}">Download original image ↓</a><details open><summary>Color evidence</summary><p>${esc(g.evidence)}</p></details><p class="credit">Photo / ${esc(p.credit||g.credit)}<br>Images belong to their respective creators.</p>`;
}
function closeViewer(){$('#viewer').close();}
$('#viewer-close').addEventListener('click',closeViewer);$('#viewer').addEventListener('close',()=>document.body.style.overflow='');
$('#viewer-prev').addEventListener('click',()=>{current--;renderViewer();});$('#viewer-next').addEventListener('click',()=>{current++;renderViewer();});
document.addEventListener('keydown',e=>{if(!$('#viewer').open)return;if(e.key==='ArrowRight'){e.preventDefault();current++;renderViewer();}if(e.key==='ArrowLeft'){e.preventDefault();current--;renderViewer();}});
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-open]');if(open)openPhoto(open.dataset.open);
 const save=e.target.closest('[data-save]');if(save)toggleSave(save.dataset.save);
 const more=e.target.closest('[data-expand]');if(more){const key=more.dataset.expand;const top=more.closest('.project').offsetTop;expanded.has(key)?expanded.delete(key):expanded.add(key);render();if(!expanded.has(key))window.scrollTo({top:top-20,behavior:'instant'});}
 const reset=e.target.closest('[data-reset]');if(reset){savedOnly=false;filter='body';colorChoice=currentColor||'all';$('#search').value='';if($('#color-select'))$('#color-select').value='all';render();}
});
if(page==='color'||page==='library'){
 const params=new URLSearchParams(location.search);if(['body','confirmed','attributed','accents','all'].includes(params.get('filter')))filter=params.get('filter');savedOnly=params.get('saved')==='1';if(savedOnly&&!params.has('filter'))filter='all';$('#search').value=params.get('q')||'';
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;render();}));
 $('#saved-toggle').addEventListener('click',()=>{savedOnly=!savedOnly;if(savedOnly)filter='all';render();});
 $('#search').addEventListener('input',render);
 $('#color-select')?.addEventListener('change',e=>{colorChoice=e.target.value;render();});
 fetch(root+'data/library.json').then(r=>{if(!r.ok)throw new Error('Could not load collection');return r.json();}).then(data=>{
  colors=data.colors;
  if(!currentColor&&colors.some(c=>c.slug===params.get('color'))){colorChoice=params.get('color');$('#color-select').value=colorChoice;}
  for(const c of colors)for(const g of c.groups)for(const p of g.photos)all.push({c,g,p,key:c.slug+'/'+p.id,search:[c.name,c.code,g.title,g.credit,g.palette,g.evidence,p.title,p.note].join(' ').toLowerCase()});
  render();
 }).catch(()=>{$('#gallery').innerHTML=`<div class="empty-state"><h3>The library couldn’t load.</h3><p>Refresh the page or browse the original research galleries.</p><a class="button outline" href="${root}about/#main">Open the research archive →</a></div>`;$('#result-count').textContent='';});
}

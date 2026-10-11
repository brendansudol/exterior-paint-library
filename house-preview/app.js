'use strict';
const colors = [
  {slug:'acacia-haze', name:'Acacia Haze', code:'SW 9132', swatch:'#969c92'},
  {slug:'evergreen-fog', name:'Evergreen Fog', code:'SW 9130', swatch:'#95978a'},
  {slug:'retreat', name:'Retreat', code:'SW 6207', swatch:'#7a8076'},
  {slug:'moody-blue', name:'Moody Blue', code:'SW 6221', swatch:'#7a9192'},
  {slug:'dried-thyme', name:'Dried Thyme', code:'SW 6186', swatch:'#7b8070'},
  {slug:'studio-blue-green', name:'Studio Blue Green', code:'SW 0047', swatch:'#6d817b'}
];
const views = {
  front: {name:'Front elevation', light:'Direct sun & porch shade'},
  angle: {name:'Front-left corner', light:'Porch, wood door & shaded side'},
  rear: {name:'Rear elevation', light:'Broad siding surfaces & open-sky shade'}
};
const original = {slug:'original', name:'Original photo', code:'Before renovation', swatch:'#d2c9a3'};
const bySlug = Object.fromEntries([...colors,original].map(c => [c.slug,c]));
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.hash.slice(1));
let state = {
  view: views[params.get('view')] ? params.get('view') : 'front',
  a: bySlug[params.get('a')] ? params.get('a') : 'acacia-haze',
  b: bySlug[params.get('b')] ? params.get('b') : 'evergreen-fog',
  mode: params.get('mode') === 'compare' ? 'compare' : 'single',
  showOriginal: params.get('original') === '1'
};
if (state.a === 'original' && state.mode === 'single') {state.a = 'acacia-haze'; state.showOriginal = true;}
const samples = window.PHOTO_SAMPLES.colors;
const selectedSamples = {a:{},b:{}};
for (const pane of ['a','b']) {
  const id=params.get('v'+pane);
  if (id === 'ai' || samples[state[pane]]?.some(s=>s.id===id)) selectedSamples[pane][state[pane]]=id;
}
function sampleFor(pane,slug) {
  if(slug==='original') return null;
  const id=selectedSamples[pane][slug];
  return id==='ai' ? null : (samples[slug].find(s=>s.id===id) || samples[slug][0]);
}
const assetPath = path => window.HOUSE_ASSETS?.[path] || path;
const imagePath = (view, slug) => {
  const path = slug === 'original' ? `originals/${view}.webp` : `images/${view}-${slug}.webp`;
  return window.HOUSE_ASSETS?.[path] || path;
};
const caption = (slug) => `${bySlug[slug].name}${slug === 'original' ? '' : ' · '+bySlug[slug].code}`;
const imageCache = new Map();
function preload(path) {
  if (!imageCache.has(path)) {
    const img = new Image();
    const promise = new Promise((resolve,reject) => {img.onload = () => resolve(img); img.onerror = () => {imageCache.delete(path); reject(new Error('Image could not load'));};});
    img.src = path;
    imageCache.set(path,promise);
  }
  if(imageCache.size>12) {const oldest=imageCache.keys().next().value;imageCache.delete(oldest);}
  return imageCache.get(path);
}
const requestVersions = {a:0,b:0};
async function showImage(pane, slug) {
  const version = ++requestVersions[pane];
  const view = state.view;
  const sample=sampleFor(pane,slug);
  const basicPath = imagePath(view,slug);
  const photo = $(`photo-${pane}`);
  const status = $(`load-${pane}`);
  status.textContent = 'Loading preview…';
  status.hidden = photo.dataset.view===view && photo.dataset.slug===slug && photo.dataset.sample===(sample?.id || 'ai');
  try {
    const path=sample ? await window.SampleRenderer.render(view,sample) : basicPath;
    await preload(path);
    if (requestVersions[pane] !== version) return;
    photo.src = path;
    photo.alt = slug === 'original' ? `${views[view].name}, original photograph before renovation` : `${views[view].name} in ${caption(slug)}, with horizontal lap siding, white trim and a natural wood front door where visible`;
    photo.dataset.slug = slug;
    photo.dataset.view = view;
    photo.dataset.sample=sample?.id || 'ai';
    if(sample) photo.alt += `; observed appearance sampled from ${sample.label}`;
    $(`download-${pane}`).href = path;
    $(`download-${pane}`).download = `${view}-${slug}${sample ? '-'+sample.id+'.png' : '.webp'}`;
    $(`badge-${pane}`).textContent = slug === 'original' ? 'Your original photo' : sample ? 'Photo-sampled appearance · approximate' : 'Earlier AI interpretation';
    status.hidden = true;
  } catch {
    if (requestVersions[pane] !== version) return;
    status.textContent = 'This image could not load. Reload the page to try again.';
    status.hidden = false;
  }
}
function saveState() {
  const hash = new URLSearchParams({view:state.view,a:state.a,b:state.b,mode:state.mode});
  if (state.showOriginal) hash.set('original','1');
  for(const pane of ['a','b']) if(state[pane]!=='original') hash.set('v'+pane,sampleFor(pane,state[pane])?.id || 'ai');
  history.replaceState(null,'','#'+hash.toString());
}
function render() {
  const comparing = state.mode === 'compare';
  const slugA = !comparing && state.showOriginal ? 'original' : state.a;
  document.querySelector('.studio').classList.toggle('is-compare',comparing);
  $('card-b').hidden = !comparing;
  $('compare-help').hidden = !comparing;
  $('title-a').hidden = comparing;
  $('select-a').hidden = !comparing;
  $('pane-label-a').textContent = comparing ? 'COLOR A' : slugA === 'original' ? 'BEFORE RENOVATION' : 'YOUR PREVIEW';
  $('title-a').replaceChildren(document.createTextNode(bySlug[slugA].name));
  if (slugA !== 'original') {const small = document.createElement('small');small.textContent = bySlug[slugA].code;$('title-a').append(small);}
  $('dot-a').style.background = bySlug[slugA].swatch;
  $('dot-b').style.background = bySlug[state.b].swatch;
  $('select-a').value = state.a;
  $('select-b').value = state.b;
  $('original-toggle').setAttribute('aria-pressed',String(state.showOriginal));
  $('original-text').textContent = state.showOriginal ? 'Back to color preview' : 'Show original photo';
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.view === state.view)));
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === state.mode)));
  document.querySelectorAll('[data-color]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.color === state.a && !state.showOriginal)));
  document.querySelector('.palette-count').textContent = `${String(Math.max(0,colors.findIndex(c => c.slug === state.a))+1).padStart(2,'0')} / 06`;
  $('view-description').textContent = `${views[state.view].name} · ${views[state.view].light}`;
  renderVariationPanel('a',slugA);
  renderVariationPanel('b',state.b);
  showImage('a',slugA);
  if (comparing) showImage('b',state.b);
  $('announcement').textContent = `${views[state.view].name}: ${caption(slugA)}, ${sampleFor('a',slugA)?.label || 'original interpretation'}${comparing ? ' compared with '+caption(state.b)+', '+(sampleFor('b',state.b)?.label || 'original interpretation') : ''}`;
  saveState();
  // Warm the selected angle so later color changes are immediate.
  for (const color of [colors[0],original]) preload(imagePath(state.view,color.slug)).catch(() => {});
}
function cycleSample(pane,step) {
  const slug=state[pane];if(slug==='original') return;
  const list=samples[slug]; const current=sampleFor(pane,slug);
  const index=current ? list.findIndex(s=>s.id===current.id) : -1;
  selectedSamples[pane][slug]=list[(index+step+list.length)%list.length].id;
  state.showOriginal=false; render();
}
function el(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;}
function renderVariationPanel(pane,slug) {
  const panel=$(`variation-${pane}`); panel.hidden=slug==='original';panel.replaceChildren();if(slug==='original')return;
  const list=samples[slug],sample=sampleFor(pane,slug),index=list.findIndex(s=>s.id===sample?.id);
  const row=el('div','variation-controls');
  const label=el('label','variation-label','Appearance'); label.htmlFor=`sample-select-${pane}`;
  const select=el('select','sample-select');select.id=`sample-select-${pane}`;select.setAttribute('aria-label',`Photo variation for ${pane==='a'?'first':'second'} image`);
  for(const [i,item] of list.entries())select.add(new Option(`${i+1}. ${item.label}${item.caution?' ⚠':''}`,item.id));
  select.add(new Option('Earlier AI preview (not photo-sampled)','ai')); select.value=sample?.id || 'ai';
  select.addEventListener('change',()=>{selectedSamples[pane][slug]=select.value;render();});
  const previous=el('button','variation-arrow','←');previous.type='button';previous.setAttribute('aria-label',`Previous photo variation for ${pane==='a'?'first':'second'} image`);previous.addEventListener('click',()=>cycleSample(pane,-1));
  const next=el('button','variation-arrow','→');next.type='button';next.setAttribute('aria-label',`Next photo variation for ${pane==='a'?'first':'second'} image`);next.addEventListener('click',()=>cycleSample(pane,1));
  row.append(label,select,previous,next);panel.append(row);
  const chips=el('div','sample-chips');chips.setAttribute('role','group');chips.setAttribute('aria-label',`Sampled appearances for ${bySlug[slug].name}`);
  for(const [i,item] of list.entries()) {const button=el('button','sample-chip');button.type='button';button.setAttribute('aria-label',`${i+1}: ${item.label}`);button.setAttribute('aria-pressed',String(sample?.id===item.id));button.title=`${item.label} · sampled ${item.hex}`;const swatch=el('span','sample-chip-color');swatch.style.background=item.hex;button.append(swatch,el('span','',String(i+1)));button.addEventListener('click',()=>{selectedSamples[pane][slug]=item.id;render();});chips.append(button);}
  chips.append(el('span','sample-count',sample ? `Photo sample ${index+1} of ${list.length}` : 'Earlier AI interpretation'));panel.append(chips);
  if(!sample) {panel.append(el('p','sample-explanation','This is the earlier AI rendering guided by the published digital color. Choose a photo sample above to explore observed appearances.'));return;}
  const source=el('div','sample-source');
  const photoLink=el('button','reference-photo');photoLink.type='button';photoLink.setAttribute('aria-label',`Enlarge reference photograph: ${sample.title}`);
  const image=el('img');image.src=assetPath(sample.image);image.alt=`${sample.title}; the outlined area is the sampled body color`;image.loading='lazy';
  const marker=el('span','sample-marker');marker.style.left=`${sample.box[0]*100}%`;marker.style.top=`${sample.box[1]*100}%`;marker.style.width=`${(sample.box[2]-sample.box[0])*100}%`;marker.style.height=`${(sample.box[3]-sample.box[1])*100}%`;
  photoLink.append(image,marker);source.append(photoLink);
  photoLink.addEventListener('click',()=>{
    $('zoom-image').src=assetPath(sample.image);$('zoom-image').alt=image.alt;
    $('zoom-title').textContent=`${bySlug[slug].name} · ${sample.label} · outlined sample`;
    const fullMarker=$('zoom-marker');fullMarker.style.cssText=marker.style.cssText;fullMarker.hidden=false;
    $('zoom-dialog').showModal();
  });
  const description=el('div','sample-description');description.append(el('p','eyebrow',sample.caution?'Reference with unresolved discrepancy':'Sampled from a real exterior'));
  const title=el('a','source-title',sample.title);title.href=sample.source;title.target='_blank';title.rel='noreferrer';description.append(title);
  description.append(el('p','',sample.surfaceNote));
  const measurement=el('div','sample-measurement');const swatch=el('span','sample-square');swatch.style.background=sample.hex;measurement.append(swatch,el('span','',`${sample.hex.toUpperCase()} · median of ${sample.samplePixels.toLocaleString()} pixels`));description.append(measurement);
  if(sample.caution) description.append(el('p','source-caution','One builder-attributed project; the visible trim conflicts with its written palette. Treat both views as uncertain evidence.'));
  const details=el('details','source-evidence');details.append(el('summary','','Attribution & sampling limits'),el('p','',sample.evidence),el('p','','This is the recorded photo color, including its lighting and camera treatment. No white-balance or exposure correction was applied. The outline marks the measured patch.'));
  description.append(details);source.append(description);panel.append(source);
}
for (const [index,color] of colors.entries()) {
  const button = document.createElement('button');
  button.type = 'button';button.className = 'color-button';button.dataset.color = color.slug;
  button.setAttribute('aria-pressed',String(color.slug === state.a));
  button.setAttribute('aria-label',`${color.name}, ${color.code}`);
  button.title = `${color.name} · ${color.code} (key ${index+1})`;
  button.innerHTML = `<span class="color-swatch" style="background:${color.swatch}"></span><span><span class="color-name">${color.name}</span><span class="color-code">${color.code}</span></span><span class="checkmark" aria-hidden="true">✓</span>`;
  button.addEventListener('click',() => {state.a = color.slug;state.showOriginal = false;render();});
  $('color-list').append(button);
}
for (const pane of ['a','b']) {
  for (const color of [...colors,original]) {const option = new Option(caption(color.slug),color.slug);$(`select-${pane}`).add(option);}
  $(`select-${pane}`).addEventListener('change',event => {state[pane] = event.target.value;render();});
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click',() => {state.view = button.dataset.view;render();}));
function setMode(mode) {
  state.mode = mode;
  if (mode === 'single' && state.a === 'original') {state.a = 'acacia-haze';state.showOriginal = true;}
  render();
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click',() => setMode(button.dataset.mode)));
$('original-toggle').addEventListener('click',() => {state.showOriginal = !state.showOriginal;render();});
$('swap-colors').addEventListener('click',() => {[state.a,state.b] = [state.b,state.a];[selectedSamples.a,selectedSamples.b] = [selectedSamples.b,selectedSamples.a];render();});
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click',() => {
  const photo = $(`photo-${button.dataset.zoom}`);
  if (!photo.dataset.slug || !$(`load-${button.dataset.zoom}`).hidden) return;
  $('zoom-marker').hidden=true;
  $('zoom-image').src = photo.src;
  $('zoom-image').alt = photo.alt;
  $('zoom-title').textContent = `${views[photo.dataset.view].name} · ${caption(photo.dataset.slug)}${photo.dataset.sample!=='ai' ? ' · '+samples[photo.dataset.slug].find(s=>s.id===photo.dataset.sample)?.label : ''}`;
  $('zoom-dialog').showModal();
}));
$('close-zoom').addEventListener('click',() => $('zoom-dialog').close());
$('zoom-dialog').addEventListener('click',event => {if (event.target === $('zoom-dialog')) $('zoom-dialog').close();});
document.addEventListener('keydown',event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,select,textarea') || $('zoom-dialog').open) return;
  let handled = true;
  if (/^[1-6]$/.test(event.key)) {state.a = colors[Number(event.key)-1].slug;state.showOriginal = false;}
  else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {const current = Math.max(0,colors.findIndex(c => c.slug === state.a));state.a = colors[(current + (event.key === 'ArrowRight' ? 1 : 5))%6].slug;state.showOriginal = false;}
  else if(event.key==='[' || event.key===']') {cycleSample('a',event.key===']' ? 1 : -1);event.preventDefault();return;}
  else if (event.key.toLowerCase() === 'o') {state.mode = 'single';if (state.a === 'original') state.a = 'acacia-haze';state.showOriginal = !state.showOriginal;}
  else if (event.key.toLowerCase() === 'c') {setMode(state.mode === 'single' ? 'compare' : 'single');event.preventDefault();return;}
  else handled = false;
  if (handled) {event.preventDefault();render();}
});
render();

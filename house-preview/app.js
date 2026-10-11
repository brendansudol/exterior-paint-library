'use strict';
const colors = window.PAINT_PALETTE.colors;
const lights = window.ColorModel.lighting;
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
  lighting: lights[params.get('light')] ? params.get('light') : 'neutral',
  showOriginal: params.get('original') === '1'
};
if (state.a === 'original' && state.mode === 'single') {state.a = 'acacia-haze'; state.showOriginal = true;}
const samples = window.PHOTO_SAMPLES.colors;
// Old va/vb links select reference photos only; all house previews now use the baseline.
const selectedReferences = {a:{},b:{}};
const referencesOpen = {a:false,b:false};
for (const pane of ['a','b']) {
  const id=params.get('r'+pane) || params.get('v'+pane);
  if(samples[state[pane]]?.some(s=>s.id===id)) selectedReferences[pane][state[pane]]=id;
}
function referenceFor(pane,slug) {
  if(slug==='original') return null;
  return samples[slug].find(s=>s.id===selectedReferences[pane][slug]) || samples[slug][0];
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
  const version=++requestVersions[pane],view=state.view,lighting=state.lighting;
  const photo=$(`photo-${pane}`),status=$(`load-${pane}`);
  status.textContent='Preparing preview…';
  status.hidden=photo.dataset.view===view && photo.dataset.slug===slug && photo.dataset.lighting===lighting;
  try {
    const path=slug==='original' ? imagePath(view,slug) : await window.SampleRenderer.render(view,bySlug[slug],lighting);
    await preload(path);
    if(requestVersions[pane]!==version)return;
    photo.src=path;
    photo.alt=slug==='original' ? `${views[view].name}, original photograph before renovation` : `${views[view].name} in ${caption(slug)}, ${lights[lighting].name}, with horizontal lap siding, white trim and a natural wood door where visible`;
    photo.dataset.slug=slug;photo.dataset.view=view;photo.dataset.lighting=lighting;
    $(`download-${pane}`).href=path;
    $(`download-${pane}`).download=slug==='original' ? `${view}-original.webp` : `${view}-${slug}-${lighting}.png`;
    $(`badge-${pane}`).textContent=slug==='original' ? 'Original photo · lighting unchanged' : `Consistent color preview · ${lights[lighting].name}`;
    status.hidden=true;
  } catch {
    if(requestVersions[pane]!==version)return;
    status.textContent='This image could not load. Reload the page to try again.';status.hidden=false;
  }
}
function saveState() {
  const hash=new URLSearchParams({view:state.view,a:state.a,b:state.b,mode:state.mode,light:state.lighting});
  if(state.showOriginal)hash.set('original','1');
  for(const pane of ['a','b'])if(state[pane]!=='original')hash.set('r'+pane,referenceFor(pane,state[pane]).id);
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
  renderReferencePanel('a',slugA);
  renderReferencePanel('b',state.b);
  const onlyOriginal=slugA==='original' && (!comparing || state.b==='original');
  document.querySelectorAll('[data-light]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.light===state.lighting));button.disabled=onlyOriginal;});
  $('lighting-description').textContent=onlyOriginal ? 'Original photographs keep their captured lighting.' : lights[state.lighting].description;
  $('lighting-sharing').textContent=comparing ? 'Same setting for both paints' : 'Same setting for every paint';
  showImage('a',slugA);
  if (comparing) showImage('b',state.b);
  $('announcement').textContent=`${views[state.view].name}: ${caption(slugA)}${comparing ? ' compared with '+caption(state.b) : ''}. ${lights[state.lighting].name}.`;
  saveState();
}
function chooseReference(pane,id) {
  const slug=state[pane];if(slug==='original')return;
  selectedReferences[pane][slug]=id;
  referencesOpen[pane]=true;
  renderReferencePanel(pane,slug);saveState();
  $('announcement').textContent=`Reference photo: ${referenceFor(pane,slug).label}. House preview unchanged.`;
}
function cycleReference(pane,step) {
  const slug=state[pane];if(slug==='original' || (pane==='a' && state.showOriginal && state.mode==='single'))return;
  const list=samples[slug],index=list.findIndex(s=>s.id===referenceFor(pane,slug).id);
  chooseReference(pane,list[(index+step+list.length)%list.length].id);
}
function el(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;}
function renderReferencePanel(pane,slug) {
  const panel=$(`variation-${pane}`);panel.hidden=slug==='original';panel.replaceChildren();if(slug==='original')return;
  const color=bySlug[slug],list=samples[slug],sample=referenceFor(pane,slug),index=list.findIndex(s=>s.id===sample.id);
  const baseline=el('div','baseline-source');
  const chip=el('span','sample-square');chip.style.background=color.swatch;
  const caption=el('span','','One baseline · ');
  const official=el('a','','Sherwin-Williams digital reference ↗');official.href=color.source;official.target='_blank';official.rel='noreferrer';
  caption.append(official);baseline.append(chip,caption);panel.append(baseline);
  const refs=el('details','reference-browser');refs.open=referencesOpen[pane];refs.addEventListener('toggle',()=>{referencesOpen[pane]=refs.open;});
  refs.append(el('summary','',`Real-house references (${list.length})`));
  refs.append(el('p','reference-note','Browse how this paint was photographed. These references do not change the house preview.'));
  panel.append(refs);
  const row=el('div','variation-controls');
  const select=el('select','sample-select');select.setAttribute('aria-label',`Reference photo for ${pane==='a'?'first':'second'} image`);
  for(const [i,item] of list.entries())select.add(new Option(`${i+1}. ${item.label}${item.caution?' ⚠':''}`,item.id));
  select.value=sample.id;select.addEventListener('change',()=>chooseReference(pane,select.value));
  const previous=el('button','variation-arrow','←');previous.type='button';previous.setAttribute('aria-label',`Previous reference photo for ${pane==='a'?'first':'second'} image`);previous.addEventListener('click',()=>cycleReference(pane,-1));
  const next=el('button','variation-arrow','→');next.type='button';next.setAttribute('aria-label',`Next reference photo for ${pane==='a'?'first':'second'} image`);next.addEventListener('click',()=>cycleReference(pane,1));
  row.append(select,previous,next);refs.append(row);
  refs.append(el('p','reference-note',`Reference ${index+1} of ${list.length} · ${sample.credit}`));
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
  description.append(details);source.append(description);refs.append(source);
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
document.querySelectorAll('[data-light]').forEach(button=>button.addEventListener('click',()=>{state.lighting=button.dataset.light;render();}));
$('original-toggle').addEventListener('click',() => {state.showOriginal = !state.showOriginal;render();});
$('swap-colors').addEventListener('click',() => {[state.a,state.b] = [state.b,state.a];[selectedReferences.a,selectedReferences.b] = [selectedReferences.b,selectedReferences.a];render();});
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click',() => {
  const photo = $(`photo-${button.dataset.zoom}`);
  if (!photo.dataset.slug || !$(`load-${button.dataset.zoom}`).hidden) return;
  $('zoom-marker').hidden=true;
  $('zoom-image').src = photo.src;
  $('zoom-image').alt = photo.alt;
  $('zoom-title').textContent = `${views[photo.dataset.view].name} · ${caption(photo.dataset.slug)}${photo.dataset.slug==='original' ? '' : ' · '+lights[photo.dataset.lighting].name}`;
  $('zoom-dialog').showModal();
}));
$('close-zoom').addEventListener('click',() => $('zoom-dialog').close());
$('zoom-dialog').addEventListener('click',event => {if (event.target === $('zoom-dialog')) $('zoom-dialog').close();});
document.addEventListener('keydown',event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,select,textarea') || $('zoom-dialog').open) return;
  let handled = true;
  if (/^[1-6]$/.test(event.key)) {state.a = colors[Number(event.key)-1].slug;state.showOriginal = false;}
  else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {const current = Math.max(0,colors.findIndex(c => c.slug === state.a));state.a = colors[(current + (event.key === 'ArrowRight' ? 1 : 5))%6].slug;state.showOriginal = false;}
  else if(event.key==='[' || event.key===']') {cycleReference('a',event.key===']' ? 1 : -1);event.preventDefault();return;}
  else if (event.key.toLowerCase() === 'o') {state.mode = 'single';if (state.a === 'original') state.a = 'acacia-haze';state.showOriginal = !state.showOriginal;}
  else if (event.key.toLowerCase() === 'c') {setMode(state.mode === 'single' ? 'compare' : 'single');event.preventDefault();return;}
  else handled = false;
  if (handled) {event.preventDefault();render();}
});
render();

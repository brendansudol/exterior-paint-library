'use strict';
// A fixed geometry image plus an explicit siding mask makes comparison deterministic.
// These are transferred photo appearances, not paint reflectance predictions.
window.SampleRenderer = (() => {
  const bases = new Map();
  const cache = new Map();
  const lin = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  const encode = value => Math.round(255 * (value <= .0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - .055));
  const linear = Array.from({length:256},(_,i)=>lin(i/255));
  const asset = path => window.HOUSE_ASSETS?.[path] || path;
  function load(path) {
    return new Promise((resolve,reject) => {
      const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error(`Could not load ${path}`)); im.src = asset(path);
    });
  }
  async function base(view) {
    if (!bases.has(view)) bases.set(view,(async () => {
      const [image,mask] = await Promise.all([load(`images/${view}-acacia-haze.webp`),load(`masks/${view}.png`)]);
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(image,0,0); const pixels=context.getImageData(0,0,canvas.width,canvas.height);
      context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(mask,0,0);
      const alpha=context.getImageData(0,0,canvas.width,canvas.height).data;
      return {pixels,alpha,width:canvas.width,height:canvas.height};
    })().catch(error=>{bases.delete(view);throw error;}));
    return bases.get(view);
  }
  async function render(view,sample) {
    const key=`${view}/${sample.id}`;
    if (cache.has(key)) return cache.get(key);
    const b=await base(view),anchor=window.PHOTO_SAMPLES.anchors[view];
    const target=sample.rgb.map(v=>lin(v/255));
    const lookup=target.map((v,c)=>linear.map(x=>encode(Math.min(1,Math.max(0,x*v/anchor[c])))));
    const data=new Uint8ClampedArray(b.pixels.data);
    for(let i=0;i<data.length;i+=4) {
      const opacity=b.alpha[i]/255;
      if(!opacity) continue;
      for(let c=0;c<3;c++) data[i+c]=Math.round(data[i+c]*(1-opacity)+lookup[c][data[i+c]]*opacity);
    }
    const canvas=document.createElement('canvas');canvas.width=b.width;canvas.height=b.height;
    canvas.getContext('2d').putImageData(new ImageData(data,b.width,b.height),0,0);
    // Lossless encoding preserves every pixel outside the mask.
    const url=canvas.toDataURL('image/png');
    cache.set(key,url);if(cache.size>6) cache.delete(cache.keys().next().value);
    return url;
  }
  return {render};
})();

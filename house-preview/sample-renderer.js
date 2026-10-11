'use strict';
// Every paint uses one neutral shading field and the same selected lighting transform.
window.SampleRenderer = (() => {
  const bases=new Map(),cache=new Map();
  const asset=path=>window.HOUSE_ASSETS?.[path] || path;
  const load=path=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Could not load ${path}`));image.src=asset(path);
  });
  async function base(view) {
    if(!bases.has(view))bases.set(view,(async()=>{
      const [image,mask]=await Promise.all([load(`images/${view}-acacia-haze.webp`),load(`masks/${view}.png`)]);
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height);
      context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(mask,0,0);
      const alpha=context.getImageData(0,0,canvas.width,canvas.height).data;
      const shade=new Float32Array(canvas.width*canvas.height),anchor=window.PHOTO_SAMPLES.anchors[view];
      for(let i=0;i<pixels.data.length;i+=4)if(alpha[i])shade[i/4]=window.ColorModel.shading([pixels.data[i],pixels.data[i+1],pixels.data[i+2]],anchor);
      return {pixels,alpha,shade,width:canvas.width,height:canvas.height};
    })().catch(error=>{bases.delete(view);throw error;}));
    return bases.get(view);
  }
  async function render(view,color,lighting='neutral') {
    const key=`${view}/${color.rgb.join(',')}/${lighting}`;
    if(cache.has(key))return cache.get(key);
    const b=await base(view),target=window.ColorModel.transform(color.rgb,lighting);
    const data=new Uint8ClampedArray(b.pixels.data);
    for(let i=0;i<data.length;i+=4){
      const opacity=b.alpha[i]/255;if(!opacity)continue;
      for(let c=0;c<3;c++){
        const painted=window.ColorModel.encode(target[c]*b.shade[i/4]);
        data[i+c]=Math.round(data[i+c]*(1-opacity)+painted*opacity);
      }
    }
    const canvas=document.createElement('canvas');canvas.width=b.width;canvas.height=b.height;
    canvas.getContext('2d').putImageData(new ImageData(data,b.width,b.height),0,0);
    const url=canvas.toDataURL('image/png');
    cache.set(key,url);if(cache.size>6)cache.delete(cache.keys().next().value);
    return url;
  }
  return {render};
})();

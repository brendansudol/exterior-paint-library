'use strict';
// This is an illustrative display-color model, not a spectral paint/illumination model.
window.ColorModel = (() => {
  const lighting = {
    neutral: {name:'Neutral baseline', exposure:0, tint:[1,1,1], description:'Published color references under one neutral shading model.'},
    warm: {name:'Warm daylight', exposure:0.3, tint:[1.035,1,0.96], description:'A modest warmer, brighter adjustment, identical for every paint.'},
    cool: {name:'Cool shade', exposure:-0.3, tint:[0.96,1,1.045], description:'A modest cooler, dimmer adjustment, identical for every paint.'}
  };
  const linear = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  const decode = Array.from({length:256},(_,i)=>linear(i/255));
  const encode = value => {
    const v=Math.min(1,Math.max(0,value));
    return Math.round(255*(v<=.0031308 ? v*12.92 : 1.055*v**(1/2.4)-.055));
  };
  const luminance = rgb => .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
  function transform(rgb,setting='neutral') {
    const light=lighting[setting];if(!light)throw new Error('Unknown lighting setting');
    const balance=luminance(light.tint);
    return rgb.map((v,c)=>decode[v]*2**light.exposure*light.tint[c]/balance);
  }
  // A single scalar holds texture and shadow, discarding all source hue/chroma.
  function shading(rgb,anchor) {return luminance(rgb.map(v=>decode[v]))/luminance(anchor);}
  return {lighting,transform,shading,encode};
})();

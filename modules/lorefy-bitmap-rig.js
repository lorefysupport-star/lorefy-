/* Cached, connected texture triangles. The caller owns motion and the shared clock. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LorefyBitmapRig=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  function headerAnchorPixels(source,width,height){
    return [false,true].map(right=>{
      let best=Infinity,point={x:right?.94:.06,y:.88};
      for(let y=Math.floor(height*.25);y<height;y++)for(let x=Math.floor(width*(right?.78:0));x<width*(right?1:.22);x++){
        if(source[(y*width+x)*4+3]<128)continue;
        const nx=(x+.5)/width,ny=(y+.5)/height,score=(nx-(right?.94:.06))**2+(ny-.88)**2;
        if(score<best){best=score;point={x:nx,y:ny};}
      }
      return point;
    });
  }
  function headerAnchors(image){
    const probe=root.document.createElement('canvas');probe.width=image.width;probe.height=image.height;
    const c=probe.getContext('2d');c.drawImage(image,0,0);
    return headerAnchorPixels(c.getImageData(0,0,probe.width,probe.height).data,probe.width,probe.height);
  }
  function ribbonPixels(source,width,height){
    const out={width,height:32,data:new Uint8ClampedArray(width*32*4)};
    for(let x=0;x<width;x++){
      let top=height,bottom=-1;
      for(let y=0;y<height;y++)if(source[(y*width+x)*4+3]>32){top=Math.min(top,y);bottom=y;}
      if(bottom<top)continue;
      const span=bottom-top+1;
      for(let y=0;y<32;y++){
        const sy=Math.max(0,Math.min(height-1,Math.round(top-span*.07+span*1.14*y/31))),from=(sy*width+x)*4,to=(y*width+x)*4;
        for(let k=0;k<4;k++)out.data[to+k]=source[from+k];
      }
    }
    return out;
  }
  function ribbonTexture(image){
    const probe=root.document.createElement('canvas');probe.width=image.width;probe.height=image.height;
    const c=probe.getContext('2d');c.drawImage(image,0,0);
    const p=ribbonPixels(c.getImageData(0,0,probe.width,probe.height).data,probe.width,probe.height);
    const out=root.document.createElement('canvas');out.width=p.width;out.height=p.height;
    const g=out.getContext('2d'),pixels=g.createImageData(p.width,p.height);pixels.data.set(p.data);g.putImageData(pixels,0,0);return out;
  }
  function prepare(image,n=16,resolution=512){
    const size=resolution===1024?1024:512,vertices=[],triangles=[],probe=root.document.createElement('canvas');probe.width=probe.height=size;
    probe.getContext('2d').drawImage(image,0,0,size,size);const pixels=probe.getContext('2d').getImageData(0,0,size,size).data,step=size/n;
    for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)vertices.push([x/n,y/n]);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      let opaque=false;
      for(let py=Math.floor(y*step);py<(y+1)*step&&!opaque;py+=2)for(let px=Math.floor(x*step);px<(x+1)*step;px+=2)if(pixels[(py*size+px)*4+3]>2){opaque=true;break;}
      if(!opaque)continue;
      const a=y*(n+1)+x,b=a+1,c=a+n+1,d=c+1;
      for(const indices of [[a,b,d],[a,d,c]]){
        const points=indices.map(i=>vertices[i].map(v=>v*size)),tile=root.document.createElement('canvas');tile.width=tile.height=Math.ceil(step)+4;
        const g=tile.getContext('2d'),ox=x*step-2,oy=y*step-2,centre=points.reduce((s,p)=>[s[0]+p[0]/3,s[1]+p[1]/3],[0,0]);
        g.beginPath();points.forEach((p,i)=>{const l=Math.hypot(p[0]-centre[0],p[1]-centre[1]),xx=p[0]+(p[0]-centre[0])/l*.7-ox,yy=p[1]+(p[1]-centre[1])/l*.7-oy;i?g.lineTo(xx,yy):g.moveTo(xx,yy);});g.closePath();g.clip();g.drawImage(probe,-ox,-oy);
        triangles.push({indices,points,image:tile,ox,oy});
      }
    }
    return {vertices,triangles,size};
  }
  function paint(c,rig,positions,w,h){
    const size=rig.size||512;c.save();c.scale(w/size,h/size);
    for(const tri of rig.triangles){
      const [a,b,d]=tri.points,[u,v,z]=tri.indices.map(i=>positions[i].map(x=>x*size));
      const sx=b[0]-a[0],sy=b[1]-a[1],tx=d[0]-a[0],ty=d[1]-a[1],det=sx*ty-tx*sy;
      const A=((v[0]-u[0])*ty-(z[0]-u[0])*sy)/det,B=((v[1]-u[1])*ty-(z[1]-u[1])*sy)/det;
      const C=(sx*(z[0]-u[0])-tx*(v[0]-u[0]))/det,D=(sx*(z[1]-u[1])-tx*(v[1]-u[1]))/det;
      c.save();c.transform(A,B,C,D,u[0]-A*a[0]-C*a[1],u[1]-B*a[0]-D*a[1]);c.drawImage(tri.image,tri.ox,tri.oy);c.restore();
    }c.restore();
  }
  return Object.freeze({prepare,paint,ribbonPixels,ribbonTexture,headerAnchorPixels,headerAnchors});
});

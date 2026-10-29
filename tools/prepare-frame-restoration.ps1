$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Private.Windows.GdiPlus,System.Private.Windows.Core,System.Collections -TypeDefinition @'
using System;using System.Drawing;using System.Drawing.Imaging;using System.Drawing.Drawing2D;using System.Runtime.InteropServices;
public sealed class FrameCalibration {
 public double cx,cy,size,safe;public double[][] clip;
 public static FrameCalibration Prepare(string source,string output,int column,bool circular){
  using(var original=new Bitmap(source)){
   int sx=column<0?0:original.Width*column/3,sw=column<0?original.Width:original.Width/3;
   using(var crop=original.Clone(new Rectangle(sx,0,sw,original.Height),PixelFormat.Format32bppArgb))using(var normalized=new Bitmap(512,512,PixelFormat.Format32bppArgb)){
    int l=crop.Width,r=-1,top=crop.Height,bottom=-1;
    for(int y=0;y<crop.Height;y++)for(int x=0;x<crop.Width;x++)if(crop.GetPixel(x,y).A>24){l=Math.Min(l,x);r=Math.Max(r,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);}
    if(r<l)throw new Exception("Empty source frame");
    double scale=Math.Min(464.0/(r-l+1),464.0/(bottom-top+1));
    if(circular){double radius=0,mx=(l+r)/2.0,my=(top+bottom)/2.0;for(int y=top;y<=bottom;y++)for(int x=l;x<=r;x++)if(crop.GetPixel(x,y).A>16)radius=Math.Max(radius,Math.Sqrt((x-mx)*(x-mx)+(y-my)*(y-my)));scale=Math.Min(scale,220.0/radius);}
    double dx=(512-(r-l+1)*scale)/2,dy=(512-(bottom-top+1)*scale)/2;
    using(var g=Graphics.FromImage(normalized)){g.InterpolationMode=InterpolationMode.HighQualityBicubic;g.PixelOffsetMode=PixelOffsetMode.HighQuality;g.DrawImage(crop,new RectangleF((float)dx,(float)dy,(float)((r-l+1)*scale),(float)((bottom-top+1)*scale)),new Rectangle(l,top,r-l+1,bottom-top+1),GraphicsUnit.Pixel);}
    normalized.Save(output,ImageFormat.Png);
    var d=normalized.LockBits(new Rectangle(0,0,512,512),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);var pixels=new byte[d.Stride*512];Marshal.Copy(d.Scan0,pixels,0,pixels.Length);normalized.UnlockBits(d);
    var distance=new double[512*512];for(int k=0;k<distance.Length;k++)distance[k]=pixels[k*4+3]>24?0:10000;
    for(int y=1;y<512;y++)for(int x=1;x<511;x++){int k=y*512+x;distance[k]=Math.Min(distance[k],Math.Min(distance[k-1]+1,Math.Min(distance[k-512]+1,Math.Min(distance[k-513]+1.414214,distance[k-511]+1.414214))));}
    for(int y=510;y>=0;y--)for(int x=510;x>0;x--){int k=y*512+x;distance[k]=Math.Min(distance[k],Math.Min(distance[k+1]+1,Math.Min(distance[k+512]+1,Math.Min(distance[k+511]+1.414214,distance[k+513]+1.414214))));}
    double best=0;int cx=256,cy=256;
    for(int y=180;y<=332;y+=2)for(int x=180;x<=332;x+=2)if(distance[y*512+x]>best){best=distance[y*512+x];cx=x;cy=y;}
    double limit=Math.Min(210,Math.Min(Math.Min(cx,512-cx),Math.Min(cy,512-cy))-12),largest=0;
    var radii=new double[72];double safe=best;
    for(int i=0;i<72;i++){
     double a=i*Math.PI/36,edge=best;int run=0;bool found=false;
     for(int k=(int)Math.Max(12,best-4);k<=limit;k++){
      int x=(int)Math.Round(cx+Math.Cos(a)*k),y=(int)Math.Round(cy+Math.Sin(a)*k);bool solid=pixels[(y*512+x)*4+3]>32;
      if(solid&&!found){safe=Math.Min(safe,k);found=true;}
      run=solid?run+1:0;if(run>=5){edge=k-4;break;}
     }
     radii[i]=Math.Min(limit,Math.Max(best+4,edge+7));largest=Math.Max(largest,radii[i]);
    }
    var result=new FrameCalibration{cx=cx/512.0,cy=cy/512.0,size=largest*2/512.0,safe=Math.Max(12,safe-5)*2/512.0,clip=new double[72][]};
    for(int i=0;i<72;i++){double a=i*Math.PI/36;result.clip[i]=new[]{.5+Math.Cos(a)*radii[i]/(largest*2),.5+Math.Sin(a)*radii[i]/(largest*2)};}
    return result;
   }
  }
 }
}
'@
$root=Split-Path $PSScriptRoot -Parent
$beta=Get-Content (Join-Path $root 'launch/decorations/pfpvibes/collections.json') -Raw | ConvertFrom-Json
$shop=Get-Content (Join-Path $root 'launch/decorations/originals/catalog.json') -Raw | ConvertFrom-Json
$spec=Get-Content (Join-Path $PSScriptRoot 'frame-restoration-spec.json') -Raw | ConvertFrom-Json -AsHashtable
$builtins=@(
 @{id='observatory';names=@{ar='مرصد القمر';en='Observatory'};accent='#9fe4ed';second='#e5c889';column=0},
 @{id='blossom';names=@{ar='رسائل الربيع';en='Spring Letters'};accent='#ef99b6';second='#f7d8ab';column=1},
 @{id='manuscript';names=@{ar='المخطوطة';en='Manuscript'};accent='#dabb78';second='#79b5a0';column=2}
)
$folder=Join-Path $root 'launch/decorations/refined'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$manifest=@(foreach($p in @($builtins)+@($beta)+@($shop.paid)){
 $column=-1;$page=$null;$group='pfpvibes'
 if($p.id -in @('observatory','blossom','manuscript')){$source='launch/shop/lorefy-avatar-frames.png';$column=$p.column;$page="launch/shop/lorefy-page-$($p.id).png";$group='classic'}
 elseif($p.id.StartsWith('original-')){$source="launch/decorations/originals/$($p.artId)/avatar-still.png";$page=$p.pageOverlay;$group='illustrated'}
 else{$source=$p.overlay}
 $target="launch/decorations/refined/$($p.id).png"
 $g=[FrameCalibration]::Prepare((Join-Path $root $source),(Join-Path $root $target),$column,($spec[$p.id] -in @('astrolabe','runes','prism','gumballs')))
 if(!$spec.ContainsKey($p.id)){throw "Missing motion direction for $($p.id)"}
 @{id=$p.id;names=$p.names;group=$group;action=$spec[$p.id];accent=$p.accent;second=$p.second;avatar=$target;page=$page;source=$source;
 geometry=@{cx=$g.cx;cy=$g.cy;size=$g.size};aperture=@{cx=$g.cx;cy=$g.cy;size=$g.safe};portraitClip=$g.clip}
})
if($manifest.Count -ne 39){throw 'Frame inventory changed; inspect before regenerating'}
$manifest | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $folder 'manifest.json') -Encoding utf8
"Prepared $($manifest.Count) original-art frame calibrations."

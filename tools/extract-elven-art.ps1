$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Private.Windows.GdiPlus,System.Private.Windows.Core,System.Linq,System.Collections -TypeDefinition @'
using System;using System.Drawing;using System.Drawing.Imaging;using System.Drawing.Drawing2D;using System.Collections.Generic;using System.Runtime.InteropServices;
public class ElfSlice {public double x,y,scale,dx,dy,cx,cy,size,safeSize;public double[][] portraitClip;}
public sealed class ElvenAtlas {
 readonly int w,h,stride;readonly byte[] pixels;readonly int[] groups;
 public ElvenAtlas(string file,bool woodland){
  using(var b=new Bitmap(file)){w=b.Width;h=b.Height;var d=b.LockBits(new Rectangle(0,0,w,h),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);stride=d.Stride;pixels=new byte[stride*h];Marshal.Copy(d.Scan0,pixels,0,pixels.Length);b.UnlockBits(d);}
  var labels=new int[w*h];groups=new int[w*h];Array.Fill(groups,-1);var queue=new int[w*h];int id=0;
  for(int y=0;y<h;y++)for(int x=0;x<w;x++){
   int p=y*w+x;if(labels[p]!=0||pixels[y*stride+x*4+3]<24)continue;
   int head=0,tail=1,minx=x,maxx=x,miny=y,maxy=y;queue[0]=p;labels[p]=++id;
   while(head<tail){int q=queue[head++],qx=q%w,qy=q/w;minx=Math.Min(minx,qx);maxx=Math.Max(maxx,qx);miny=Math.Min(miny,qy);maxy=Math.Max(maxy,qy);
    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int nx=qx+dx,ny=qy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;int n=ny*w+nx;if(labels[n]!=0||pixels[ny*stride+nx*4+3]<24)continue;labels[n]=id;queue[tail++]=n;}}
   if(tail<5)continue;int col=Math.Min(2,(minx+maxx)/2/512),row=(miny+maxy)/2<430?0:1;
   bool shared=woodland&&col==0&&maxy-miny>900;
   if(tail>4000&&!shared)row=miny<100?0:1;
   for(int i=0;i<tail;i++){int q=queue[i];groups[q]=col+(shared?(q/w<454?0:3):row*3);}
  }
  // Retain antialiased edge pixels, not the almost-transparent generated backdrop.
  for(int y=0;y<h;y++)for(int x=0;x<w;x++){int p=y*w+x;if(groups[p]>=0||pixels[y*stride+x*4+3]==0)continue;
   for(int dy=-2;dy<=2&&groups[p]<0;dy++)for(int dx=-2;dx<=2&&groups[p]<0;dx++){int nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;int q=ny*w+nx;if(pixels[ny*stride+nx*4+3]>=24)groups[p]=groups[q];}}
 }
 public ElfSlice Save(int group,string file,int tw,int th){
  int l=w,t=h,r=-1,b=-1;for(int y=0;y<h;y++)for(int x=0;x<w;x++)if(groups[y*w+x]==group){l=Math.Min(l,x);r=Math.Max(r,x);t=Math.Min(t,y);b=Math.Max(b,y);}
  if(r<l)throw new Exception("Missing elf artwork");int cw=r-l+1,ch=b-t+1;double scale=Math.Min((tw-32.0)/cw,(th-32.0)/ch),dx=(tw-cw*scale)/2,dy=(th-ch*scale)/2;
  using(var crop=new Bitmap(cw,ch,PixelFormat.Format32bppArgb))using(var output=new Bitmap(tw,th,PixelFormat.Format32bppArgb)){
   var data=new byte[cw*ch*4];for(int y=0;y<ch;y++)for(int x=0;x<cw;x++){int sx=x+l,sy=y+t;if(groups[sy*w+sx]!=group)continue;int a=sy*stride+sx*4,o=(y*cw+x)*4;for(int k=0;k<4;k++)data[o+k]=pixels[a+k];}
   var d=crop.LockBits(new Rectangle(0,0,cw,ch),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);Marshal.Copy(data,0,d.Scan0,data.Length);crop.UnlockBits(d);
   using(var g=Graphics.FromImage(output)){g.InterpolationMode=InterpolationMode.HighQualityBicubic;g.PixelOffsetMode=PixelOffsetMode.HighQuality;g.DrawImage(crop,new RectangleF((float)dx,(float)dy,(float)(cw*scale),(float)(ch*scale)),new RectangleF(0,0,cw,ch),GraphicsUnit.Pixel);}
   output.Save(file,ImageFormat.Png);var result=new ElfSlice{x=l,y=t,scale=scale,dx=dx,dy=dy};
   if(th==512){
    var opaque=new bool[tw*th];var distance=new double[tw*th];
    for(int y=0;y<th;y++)for(int x=0;x<tw;x++){int k=y*tw+x;opaque[k]=output.GetPixel(x,y).A>8;distance[k]=opaque[k]?0:10000;}
    for(int y=1;y<th;y++)for(int x=1;x<tw-1;x++){int k=y*tw+x;distance[k]=Math.Min(distance[k],Math.Min(distance[k-1]+1,Math.Min(distance[k-tw]+1,Math.Min(distance[k-tw-1]+1.414214,distance[k-tw+1]+1.414214))));}
    for(int y=th-2;y>=0;y--)for(int x=tw-2;x>0;x--){int k=y*tw+x;distance[k]=Math.Min(distance[k],Math.Min(distance[k+1]+1,Math.Min(distance[k+tw]+1,Math.Min(distance[k+tw-1]+1.414214,distance[k+tw+1]+1.414214))));}
    double best=0;int bx=256,by=256;
    for(int cy=168;cy<=344;cy+=2)for(int cx=168;cx<=344;cx+=2){double radius=distance[cy*tw+cx];if(radius>best){best=radius;bx=cx;by=cy;}}
    double exact=best;for(double angle=0;angle<Math.PI*2;angle+=Math.PI/360)for(int k=0;k<=best;k++){int px=(int)Math.Round(bx+Math.Cos(angle)*k),py=(int)Math.Round(by+Math.Sin(angle)*k);if(px<0||py<0||px>=tw||py>=th||output.GetPixel(px,py).A>8){exact=Math.Min(exact,k);break;}}
    result.cx=bx/512.0;result.cy=by/512.0;result.safeSize=(exact*2-8)/512.0;
    // Follow the inner rim, not the nearest hanging jewel. A small underlap hides motion seams.
    var radii=new double[72];double largest=0;
    for(int i=0;i<72;i++){
     double angle=i*Math.PI/36,edge=exact;int run=0;
     for(int k=(int)Math.Max(68,exact-3);k<218;k++){
      int px=(int)Math.Round(bx+Math.Cos(angle)*k),py=(int)Math.Round(by+Math.Sin(angle)*k);
      bool solid=px>=0&&py>=0&&px<512&&py<512&&output.GetPixel(px,py).A>80;
      run=solid?run+1:0;if(run>=9){edge=k-8;break;}
     }
     radii[i]=Math.Min(205,edge+10);largest=Math.Max(largest,radii[i]);
    }
    result.size=largest*2/512.0;result.portraitClip=new double[72][];
    for(int i=0;i<72;i++){double a=i*Math.PI/36;result.portraitClip[i]=new[]{.5+Math.Cos(a)*radii[i]/(largest*2),.5+Math.Sin(a)*radii[i]/(largest*2)};}
   }
   return result;
  }
 }
}
'@
$root=Split-Path $PSScriptRoot -Parent
$source=Get-Content -LiteralPath (Join-Path $root 'qa/elf-motion/rig-source.json') -Raw | ConvertFrom-Json
$atlases=@{ears=[ElvenAtlas]::new((Join-Path $root 'qa/elf-concepts/ears.png'),$false);woodland=[ElvenAtlas]::new((Join-Path $root 'qa/elf-concepts/woodland.png'),$true)}
$catalog=@()
foreach($item in $source){
 $column=[int][char]$item.code[1]-[int][char]'A';$folder=Join-Path $root "qa/elf-motion/$($item.id)"
 New-Item -ItemType Directory -Path $folder -Force | Out-Null
 $avatar=$atlases[$item.board].Save($column,(Join-Path $folder 'avatar.png'),512,512)
 $page=$atlases[$item.board].Save(($column+3),(Join-Path $folder 'page.png'),512,768)
 $layers=@(foreach($part in $item.parts){
  $points=@(foreach($p in $part.polygon){,@([Math]::Clamp((($p[0]-$avatar.x)*$avatar.scale+$avatar.dx)/512,.002,.998),[Math]::Clamp((($p[1]-$avatar.y)*$avatar.scale+$avatar.dy)/512,.002,.998))})
  $px=(($part.pivot[0]-$avatar.x)*$avatar.scale+$avatar.dx)/512
  $py=(($part.pivot[1]-$avatar.y)*$avatar.scale+$avatar.dy)/512
  $layer=@{kind=$part.kind;pivot=@($px,$py);polygon=$points;rootRadius=.04;side=$part.side}
  if($part.fade){$from=(($part.fade[0]-$avatar.y)*$avatar.scale+$avatar.dy)/512;$to=(($part.fade[1]-$avatar.y)*$avatar.scale+$avatar.dy)/512;$layer.fade=@($from,$to)}
  $layer
 })
 @{version=1;code=$item.code;layers=$layers;aperture=@{cx=$avatar.cx;cy=$avatar.cy;size=$avatar.safeSize};portraitClip=$avatar.portraitClip;geometry=@{cx=$avatar.cx;cy=$avatar.cy;size=$avatar.size}} | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $folder 'rig.json') -Encoding utf8
 $catalog+=@{id="elven-$($item.id)";artId=$item.id;names=$item.names;accent=$item.accent;second=$item.second;releaseAllowed=$false;overlay="qa/elf-motion/$($item.id)/avatar.png";pageOverlay="qa/elf-motion/$($item.id)/page.png";portraitClip=$avatar.portraitClip;geometry=@{cx=$avatar.cx;cy=$avatar.cy;size=$avatar.size}}
 Write-Output "$($item.code) $($item.id): aperture $($avatar.size) at $($avatar.cx),$($avatar.cy); layers $($layers.Count)"
}
$catalog | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $root 'qa/elf-motion/collections.json') -Encoding utf8

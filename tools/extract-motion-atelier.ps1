param([Parameter(Mandatory=$true)][string]$AvatarAtlas,[Parameter(Mandatory=$true)][string]$PageAtlas)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Private.Windows.GdiPlus,System.Private.Windows.Core,System.Linq,System.Collections -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
public class AtelierPiece { public string file; public int x,y,w,h,area; }
public class AtelierSlice { public int width,height; public double cx,cy,size; public AtelierPiece[] parts; }
public static class AtelierExtraction {
  public static AtelierSlice Split(string atlas,int column,int row,string folder,string kind) {
    using(var source=new Bitmap(atlas)) {
      int left=(int)Math.Round(column*source.Width/3.0),right=(int)Math.Round((column+1)*source.Width/3.0);
      int top=row*source.Height/2,w=right-left,h=source.Height/2;
      using(var im=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
        using(var g=Graphics.FromImage(im)) {g.CompositingMode=System.Drawing.Drawing2D.CompositingMode.SourceCopy;g.DrawImage(source,new Rectangle(0,0,w,h),new Rectangle(left,top,w,h),GraphicsUnit.Pixel);}
        im.Save(System.IO.Path.Combine(folder,kind+".png"),ImageFormat.Png);
        var data=im.LockBits(new Rectangle(0,0,w,h),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
        var bytes=new byte[data.Stride*h];Marshal.Copy(data.Scan0,bytes,0,bytes.Length);int stride=data.Stride;im.UnlockBits(data);
        var labels=new int[w*h];var components=new List<AtelierPiece>();int id=0;var queue=new int[w*h];
        for(int y=0;y<h;y++)for(int x=0;x<w;x++) {
          int p=y*w+x;if(labels[p]!=0||bytes[y*stride+x*4+3]<16)continue;
          id++;int head=0,tail=1;queue[0]=p;labels[p]=id;
          int minX=x,maxX=x,minY=y,maxY=y;
          while(head<tail) {
            int q=queue[head++],qx=q%w,qy=q/w;
            minX=Math.Min(minX,qx);maxX=Math.Max(maxX,qx);minY=Math.Min(minY,qy);maxY=Math.Max(maxY,qy);
            for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++) {
              int nx=qx+dx,ny=qy+dy,n=ny*w+nx;
              if(nx<0||ny<0||nx>=w||ny>=h||labels[n]!=0||bytes[ny*stride+nx*4+3]<16)continue;
              labels[n]=id;queue[tail++]=n;
            }
          }
          components.Add(new AtelierPiece{file=id.ToString(),x=minX,y=minY,w=maxX-minX+1,h=maxY-minY+1,area=tail});
        }
        var ordered=components.OrderByDescending(c=>c.area).ToArray();
        var chosen=ordered.Skip(1).Where(c=>c.area>45&&c.w<w*.42&&c.h<h*.28).Take(6).ToArray();
        var baseBytes=(byte[])bytes.Clone();
        for(int i=0;i<chosen.Length;i++) {
          var c=chosen[i];int label=int.Parse(c.file);c.file=kind+"-part-"+i+".png";
          int x0=Math.Max(0,c.x-2),y0=Math.Max(0,c.y-2),x1=Math.Min(w,c.x+c.w+2),y1=Math.Min(h,c.y+c.h+2);
          c.x=x0;c.y=y0;c.w=x1-x0;c.h=y1-y0;
          using(var part=new Bitmap(c.w,c.h,PixelFormat.Format32bppArgb)) {
            for(int py=y0;py<y1;py++)for(int px=x0;px<x1;px++) {
              bool belongs=labels[py*w+px]==label;
              if(!belongs&&bytes[py*stride+px*4+3]<16) {
                for(int dy=-2;dy<=2&&!belongs;dy++)for(int dx=-2;dx<=2&&!belongs;dx++) {
                  int nx=px+dx,ny=py+dy;if(nx>=0&&ny>=0&&nx<w&&ny<h&&labels[ny*w+nx]==label)belongs=true;
                }
              }
              if(!belongs)continue;int o=py*stride+px*4;
              part.SetPixel(px-x0,py-y0,Color.FromArgb(bytes[o+3],bytes[o+2],bytes[o+1],bytes[o]));baseBytes[o+3]=0;
            }
            part.Save(System.IO.Path.Combine(folder,c.file),ImageFormat.Png);
          }
        }
        using(var body=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
          var bd=body.LockBits(new Rectangle(0,0,w,h),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);
          Marshal.Copy(baseBytes,0,bd.Scan0,baseBytes.Length);body.UnlockBits(bd);body.Save(System.IO.Path.Combine(folder,kind+"-base.png"),ImageFormat.Png);
        }
        double cx=w*.5,cy=h*.5,r=w*.4;
        if(kind=="avatar") {
          int l=w/2,rr=l,t=h/2,b=t;
          while(l>0&&bytes[(h/2)*stride+l*4+3]<32)l--;
          while(rr<w-1&&bytes[(h/2)*stride+rr*4+3]<32)rr++;
          while(t>0&&bytes[t*stride+(w/2)*4+3]<32)t--;
          while(b<h-1&&bytes[b*stride+(w/2)*4+3]<32)b++;
          cx=(l+rr)/2.0;cy=(t+b)/2.0;
          r=w*.45;
          for(double a=0;a<Math.PI*2;a+=Math.PI/90)for(double d=0;d<w*.48;d++) {
            int px=(int)Math.Round(cx+Math.Cos(a)*d),py=(int)Math.Round(cy+Math.Sin(a)*d);
            if(px<0||py<0||px>=w||py>=h||bytes[py*stride+px*4+3]>32){r=Math.Min(r,d);break;}
          }
        }
        return new AtelierSlice{width=w,height=h,cx=.05+.9*cx/w,cy=.05+.9*cy/h,size=.9*(r*2-4)/w,parts=chosen};
      }
    }
  }
}
'@
$root=Split-Path $PSScriptRoot -Parent
$items=@(
  @{artId='inkstorm';ar='عاصفة الحبر';en='Inkstorm';accent='#d32c44';second='#e8ddcd'},
  @{artId='star-atlas';ar='أطلس النجوم';en='Star Atlas';accent='#c6a24d';second='#46b9cb'},
  @{artId='sakura-wind';ar='نسيم الساكورا';en='Sakura Wind';accent='#dc7298';second='#c5a9b5'},
  @{artId='tidal-glass';ar='مدّ زجاجي';en='Tidal Glass';accent='#29bbca';second='#f39a79'},
  @{artId='signal-zero';ar='الإشارة صفر';en='Signal Zero';accent='#93d92c';second='#46d9d6'},
  @{artId='paper-flight';ar='رحلة ورقية';en='Paper Flight';accent='#d44b41';second='#dbd0b7'}
)
$catalog=@()
for($i=0;$i -lt $items.Count;$i++) {
  $item=$items[$i];$dir=Join-Path $root "qa/motion-atelier/$($item.artId)"
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  $avatar=[AtelierExtraction]::Split($AvatarAtlas,($i%3),[math]::Floor($i/3),$dir,'avatar')
  $page=[AtelierExtraction]::Split($PageAtlas,($i%3),[math]::Floor($i/3),$dir,'page')
  if($page.parts.Count -lt 2){$page.parts=@($page.parts)+@($avatar.parts|Select-Object -First 3)}
  @{avatar=$avatar;page=$page}|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $dir 'parts.json') -Encoding utf8
  $catalog+=@{id="atelier-$($item.artId)";artId=$item.artId;names=@{ar=$item.ar;en=$item.en};accent=$item.accent;second=$item.second;releaseAllowed=$false;overlay="qa/motion-atelier/$($item.artId)/avatar.png";pageOverlay="qa/motion-atelier/$($item.artId)/page.png";geometry=@{cx=$avatar.cx;cy=$avatar.cy;size=$avatar.size}}
  Write-Output "$($item.artId): aperture $($avatar.size), avatar parts $($avatar.parts.Count), page parts $($page.parts.Count)"
}
$catalog|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $root 'qa/motion-atelier/collections.json') -Encoding utf8

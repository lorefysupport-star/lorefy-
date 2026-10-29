param([Parameter(Mandatory=$true)][string]$Atlas)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$im=[System.Drawing.Bitmap]::FromFile($Atlas)
$names=@('inkstorm','star-atlas','sakura-wind','tidal-glass','signal-zero','paper-flight')
# The generated atlas has unequal gutters; these cuts fall in verified transparent rows.
$cuts=@(0,300,520,750,1000,1220,1536)
try {
  if($im.Width -ne 1024 -or $im.Height -ne 1536){throw 'Unexpected atlas dimensions'}
  for($i=0;$i -lt 6;$i++){
    $left=$im.Width;$right=0;$top=$cuts[$i+1];$bottom=$cuts[$i]
    for($y=$cuts[$i];$y -lt $cuts[$i+1];$y++){
      for($x=0;$x -lt $im.Width;$x++){
        if($im.GetPixel($x,$y).A -gt 20){$left=[math]::Min($left,$x);$right=[math]::Max($right,$x);$top=[math]::Min($top,$y);$bottom=[math]::Max($bottom,$y)}
      }
    }
    $left=[math]::Max(0,$left-3);$top=[math]::Max($cuts[$i],$top-3)
    $right=[math]::Min($im.Width-1,$right+3);$bottom=[math]::Min($cuts[$i+1]-1,$bottom+3)
    $crop=$im.Clone([System.Drawing.Rectangle]::new($left,$top,$right-$left+1,$bottom-$top+1),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try{
      for($y=0;$y -lt $crop.Height;$y++){for($x=0;$x -lt $crop.Width;$x++){
        $p=$crop.GetPixel($x,$y);if($p.A -lt 12){$crop.SetPixel($x,$y,[System.Drawing.Color]::Transparent)}
      }}
      $out=Join-Path (Split-Path $PSScriptRoot -Parent) "qa/motion-atelier/$($names[$i])/header.png"
      $crop.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
      "$($names[$i]): $($crop.Width)x$($crop.Height)"
    }finally{$crop.Dispose()}
  }
}finally{$im.Dispose()}

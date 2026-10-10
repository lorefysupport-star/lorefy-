param([Parameter(Mandatory=$true)][string]$Path)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$resolved = (Resolve-Path -LiteralPath $Path).Path
$image = [System.Drawing.Bitmap]::new($resolved)
try {
  $edgePixels = 0
  for ($x = 0; $x -lt $image.Width; $x++) {
    if ($image.GetPixel($x, 0).A -gt 8) { $edgePixels++ }
    if ($image.GetPixel($x, $image.Height - 1).A -gt 8) { $edgePixels++ }
  }
  for ($y = 1; $y -lt $image.Height - 1; $y++) {
    if ($image.GetPixel(0, $y).A -gt 8) { $edgePixels++ }
    if ($image.GetPixel($image.Width - 1, $y).A -gt 8) { $edgePixels++ }
  }
  [pscustomobject]@{Path=$resolved; Width=$image.Width; Height=$image.Height; EdgePixels=$edgePixels; SafeEdges=($edgePixels -eq 0)} | ConvertTo-Json
  if ($edgePixels -gt 0) { throw 'Frame art touches its export boundary. Review and repair the source before release.' }
} finally { $image.Dispose() }

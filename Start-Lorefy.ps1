param([ValidateRange(1024, 65535)][int]$Port = 8795)
$ErrorActionPreference = 'Stop'
$appRoot = $PSScriptRoot
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if ($nodeCommand) {
    $nodePath = $nodeCommand.Source
} else {
    $nodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $nodePath -PathType Leaf)) {
    throw 'Node.js is required. Open this project in Codex or install Node.js.'
}
$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Output "Port $Port is already in use. Use another port with -Port."
    exit 1
}
Write-Output "App: http://127.0.0.1:$Port/index.html"
Write-Output "Demo: http://127.0.0.1:$Port/phone-preview.html?preview=demo&demo=ready&route=profile&decorationLab=1"
Write-Output 'Keep this terminal open. Press Ctrl+C to stop.'
Push-Location -LiteralPath $appRoot
$previousHost = $env:HOST
$previousPort = $env:PORT
try {
    $env:HOST = '127.0.0.1'
    $env:PORT = [string]$Port
    & $nodePath 'tools/lorefy-api-server.js' $Port
} finally {
    $env:HOST = $previousHost
    $env:PORT = $previousPort
    Pop-Location
}

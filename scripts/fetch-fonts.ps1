$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$fontsDir = Join-Path $root "src\app\fonts"
New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
$headers = @{ "User-Agent" = $ua; "Accept" = "text/css,*/*;q=0.1" }

function Get-FontFiles([string]$fam, [string]$filePrefix, [string]$weightSpec, [string[]]$subsets) {
  $url = "https://fonts.googleapis.com/css2?family=$fam$weightSpec&display=swap"
  $css = (Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing).Content
  $chunks = [regex]::Split($css, "/\* ([\w-]+) \*/")
  $files = @()
  for ($i = 1; $i -lt $chunks.Count; $i += 2) {
    $name = $chunks[$i].Trim()
    $block = $chunks[$i + 1]
    if ($subsets -contains $name) {
      if ($block -notmatch 'src:\s*url\((https://[^)]+)\)') { throw "no url in block $name" }
      $furl = $Matches[1]
      $fname = "$filePrefix-$name.woff2"
      $fpath = Join-Path $fontsDir $fname
      Invoke-WebRequest -Uri $furl -Headers $headers -UseBasicParsing -OutFile $fpath
      $bytes = [IO.File]::ReadAllBytes($fpath)
      $magic = [Text.Encoding]::ASCII.GetString($bytes, 0, 4)
      if ($magic -ne "wOF2") { throw "$fname is not woff2 (magic=$magic, $furl)" }
      $files += [pscustomobject]@{ file = $fname; subset = $name; bytes = $bytes.Length }
    }
  }
  return $files
}

$cairo = Get-FontFiles "Cairo" "Cairo" ":wght@200..1000" @("arabic", "latin")
$geist = Get-FontFiles "Geist" "Geist" ":wght@100..900" @("latin", "latin-ext")
$geistMono = Get-FontFiles "Geist+Mono" "GeistMono" ":wght@100..900" @("latin", "latin-ext")

Write-Host "Cairo files:"
$cairo | ForEach-Object { Write-Host ("  " + $_.file + " (" + $_.subset + ") " + $_.bytes + " bytes") }
Write-Host "Geist files:"
$geist | ForEach-Object { Write-Host ("  " + $_.file + " (" + $_.subset + ") " + $_.bytes + " bytes") }
Write-Host "Geist Mono files:"
$geistMono | ForEach-Object { Write-Host ("  " + $_.file + " (" + $_.subset + ") " + $_.bytes + " bytes") }
Write-Host "DONE"

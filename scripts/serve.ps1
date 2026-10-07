# Local web server for the dashboard: http://localhost:8000  (Ctrl+C to stop) - no Python needed
$Root = Split-Path -Parent $PSScriptRoot
$Port = 8000
$types = @{ ".html"="text/html; charset=utf-8"; ".js"="application/javascript; charset=utf-8"; ".css"="text/css; charset=utf-8";
            ".json"="application/json; charset=utf-8"; ".png"="image/png"; ".svg"="image/svg+xml"; ".ico"="image/x-icon" }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/"); $l.Start()
Write-Host "Serving $Root at http://localhost:$Port/  (Ctrl+C to stop)" -ForegroundColor Green
Start-Process "http://localhost:$Port/"
try {
  while ($l.IsListening) {
    $ctx = $l.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if (-not $path) { $path = "index.html" }
    $file = [IO.Path]::GetFullPath((Join-Path $Root $path))
    if ($file.StartsWith($Root) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $ctx.Response.StatusCode = 404 }
    $ctx.Response.Close()
  }
} finally { $l.Stop() }

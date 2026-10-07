<#
  SPARK2027 : Planner Excel (.xlsx) -> data\data.json   (no Python needed)
  Requires Microsoft Excel installed (used to read the file).
  Usage:  powershell -ExecutionPolicy Bypass -File scripts\convert.ps1 [path\to\file.xlsx]
#>
param([string]$Src = "")
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Cfg  = Get-Content (Join-Path $Root "data\config.json") -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $Src) { $Src = Join-Path $Root $Cfg.sourceFile }
if (-not (Test-Path -LiteralPath $Src)) { throw "File not found: $Src" }
$Src  = (Resolve-Path -LiteralPath $Src).Path
$Out  = Join-Path $Root "data\data.json"

function Txt($v) { if ($null -eq $v) { "" } else { "$v".Trim() } }
function Iso($v) {
  if ($null -eq $v -or "$v" -eq "") { return "" }
  if ($v -is [double]) { return [DateTime]::FromOADate($v).ToString("yyyy-MM-dd") }
  $s = "$v".Trim()
  if ($s -match '^(\d{4})-(\d{1,2})-(\d{1,2})') { return "{0}-{1:00}-{2:00}" -f $Matches[1], [int]$Matches[2], [int]$Matches[3] }
  if ($s -match '^(\d{1,2})/(\d{1,2})/(\d{4})')  { return "{0}-{1:00}-{2:00}" -f $Matches[3], [int]$Matches[1], [int]$Matches[2] }
  return ""
}
function WsOf($b) {
  foreach ($m in $Cfg.bucketToWorkstream) { if ($b.StartsWith($m[0])) { return $m[1] } }
  return $Cfg.defaultWorkstream
}
function Pct($v) {
  if ((Txt $v) -match '(\d+)\s*/\s*(\d+)' -and [int]$Matches[2] -gt 0) { return [int][math]::Round([int]$Matches[1] * 100 / [int]$Matches[2]) }
  return ""
}
function Mask($o) {
  if (-not $Cfg.maskOwners) { return $o }
  (($o -split ';') | Where-Object { $_.Trim() } | ForEach-Object { ($_.Trim() -split '\s+')[0] }) -join ';'
}
function ReadSheet($ws) {
  $v = $ws.UsedRange.Value2
  $rows = $v.GetLength(0); $cols = $v.GetLength(1)
  $head = @(); for ($c = 1; $c -le $cols; $c++) { $head += (Txt $v[1, $c]) }
  $list = New-Object System.Collections.ArrayList
  for ($r = 2; $r -le $rows; $r++) {
    $o = @{}; for ($c = 1; $c -le $cols; $c++) { $o[$head[$c - 1]] = $v[$r, $c] }
    [void]$list.Add($o)
  }
  return ,$list
}

Write-Host "Reading $Src ..."
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
try {
  $wb = $xl.Workbooks.Open($Src, 0, $true)
  $names = @(); foreach ($s in $wb.Worksheets) { $names += $s.Name }

  $exported = ""
  if ($names -contains "Plan") { $p = ReadSheet $wb.Worksheets.Item("Plan"); if ($p.Count) { $exported = Iso $p[0]["Date of export"] } }

  $sheet = $names | Where-Object { $_ -match 'consolidated' } | Select-Object -First 1
  if ($sheet) { $rows = ReadSheet $wb.Worksheets.Item($sheet) }
  elseif ($names -contains "Tasks") {
    $sheet = "Tasks"; $rows = ReadSheet $wb.Worksheets.Item("Tasks")
    $bm = @{}; $um = @{}
    if ($names -contains "Buckets") { foreach ($r in (ReadSheet $wb.Worksheets.Item("Buckets"))) { $bm[(Txt $r["Bucket ID"])] = Txt $r["Bucket Name"] } }
    if ($names -contains "Users")   { foreach ($r in (ReadSheet $wb.Worksheets.Item("Users")))   { $um[(Txt $r["User ID"])]   = Txt $r["User Name"] } }
    foreach ($r in $rows) {
      $b = Txt $r["Bucket"]; if ($bm.ContainsKey($b)) { $r["Bucket"] = $bm[$b] }
      $r["Assigned To"] = ((Txt $r["Assigned To"]) -split ';' | Where-Object { $_ } | ForEach-Object { if ($um.ContainsKey($_)) { $um[$_] } else { $_ } }) -join ';'
    }
  }
  else { throw "No 'Consolidated Data' or 'Tasks' sheet. Use Planner > Export plan to Excel." }
  $wb.Close($false)
}
finally {
  $xl.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl)
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

# keep manually-entered fields from previous data.json (matched by Task ID)
$prev = @{}
if (Test-Path -LiteralPath $Out) {
  try { (Get-Content -LiteralPath $Out -Raw -Encoding UTF8 | ConvertFrom-Json).tasks | ForEach-Object { $prev[$_.id] = $_ } } catch {}
}

$srcName = Split-Path $Src -Leaf
$srcTag  = "Excel export " + $(if ($exported) { $exported } else { $srcName })
$tasks = New-Object System.Collections.ArrayList; $seen = @{}; $warn = @()
foreach ($r in $rows) {
  $name = Txt $r["Task Name"]; if (-not $name) { continue }
  $id = Txt $r["Task ID"]; if (-not $id) { $id = "X-$($tasks.Count)" }
  if ($seen.ContainsKey($id)) { continue }; $seen[$id] = 1
  $b = ((Txt $r["Bucket"]) -replace '\\_', '_') -replace '^\d+\.\s*', ''
  $lab = Txt $r["Labels"]; $prio = Txt $r["Priority"]; if (-not $prio) { $prio = "Medium" }
  $t = [ordered]@{
    id = $id; name = $name; ws = (WsOf $b); srcBucket = $b
    goal = Txt $r["Goal"]; planner = Txt $r["Status"]; priority = $prio
    owner = Mask (Txt $r["Assigned To"])
    start = Iso $r["Start date"]; due = Iso $r["Due date"]; finish = Iso $r["Finish date"]; done = Iso $r["Completed Date"]
    checklist = Txt $r["Checklist Items"]; progress = (Pct $r["Completed Checklist Items"])
    labels = $lab; key = [bool]($lab -match 'key deliverable'); notes = Txt $r["Notes"]
    src = $srcTag
  }
  $old = $prev[$id]
  foreach ($f in $Cfg.keepManualFields) { $t[$f] = $(if ($old -and $old.$f) { "$($old.$f)" } else { "" }) }
  if (-not ($Cfg.bucketToWorkstream | Where-Object { $b.StartsWith($_[0]) })) { $warn += "$b | $name" }
  [void]$tasks.Add($t)
}
if ($tasks.Count -eq 0) { throw "No tasks found." }

$nb = ($tasks | ForEach-Object { $_.srcBucket } | Sort-Object -Unique).Count
$data = [ordered]@{
  meta = [ordered]@{ planName = $Cfg.planName; file = $srcName; sheet = $sheet; exported = $exported
                     generatedAt = (Get-Date).ToString("s"); taskCount = $tasks.Count; bucketCount = $nb }
  tasks = $tasks
}
$json = $data | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText($Out, $json, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("OK  {0} tasks / {1} buckets  (export {2})  ->  {3}" -f $tasks.Count, $nb, $exported, $Out) -ForegroundColor Green
foreach ($w in $warn) { Write-Host "WARN bucket not in mapping -> $($Cfg.defaultWorkstream): $w" -ForegroundColor Yellow }

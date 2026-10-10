# PowerShell 7; collect only reads worktrees, reports and verify.json.
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath("$PSScriptRoot/../..")
$root = "$repo/../lp-worktrees"
try {
    if ($args.Count) {
        if ($args.Count -ne 2 -or $args[0] -ne '--root' -or !$args[1] -or $args[1] -like '--*') { throw 'Usage: collect [--root <dir>]' }
        $root = $args[1]
    }
    $files = @(Get-ChildItem -Path "$root/*/.agent-runs/*/codex.pid" -File -ErrorAction SilentlyContinue)
    if (!$files.Count) { 'không có'; exit 0 }
    foreach ($file in $files) {
        $run = $file.Directory.FullName; $wt = $file.Directory.Parent.Parent.FullName; $id = $file.Directory.Name
        $json = & node "$repo/scripts/agents/story.mjs" info $id
        if ($LASTEXITCODE -ne 0) { throw "Unknown story: $id" }; $s = $json | ConvertFrom-Json
        $branch = & git -C $wt branch --show-current; if ($LASTEXITCODE -ne 0) { throw "git failed: $id" }
        $commits = & git -C $wt rev-list --count "$($s.base)..HEAD"; if ($LASTEXITCODE -ne 0) { throw "git failed: $id" }
        $state = 'done'; $child = (Get-Content -LiteralPath $file.FullName -Raw).Trim()
        if ($child -match '^[1-9][0-9]*$' -and (Get-Process -Id $child -ErrorAction SilentlyContinue)) { $state = 'running' }
        $report = '—'; $checks = '—'
        if (Test-Path -LiteralPath "$run/codex-report.md") {
            $text = Get-Content -LiteralPath "$run/codex-report.md" -Raw
            if ($text -match '(?m)^(?:##\s+)?Trạng thái\s*:\s*(.+)$') { $report = $Matches[1].Trim() }
            elseif ($text -match '(?m)^## Trạng thái\s*\r?\n\s*([^\r\n]+)') { $report = $Matches[1].Trim() }
        }
        if (Test-Path -LiteralPath "$run/verify.json") {
            $v = Get-Content -LiteralPath "$run/verify.json" -Raw | ConvertFrom-Json
            if ($v.ok -eq $true) { $checks = 'PASS' } elseif ($v.ok -eq $false) { $checks = 'FAIL' }
        }
        "$id | $branch | codex: $state | commit: $commits | report: $report | checks: $checks"
    }
} catch { [Console]::Error.WriteLine("! $_"); exit 1 }

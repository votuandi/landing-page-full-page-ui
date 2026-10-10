# PowerShell 7; same --options as spawn-codex.sh (use --help for usage).
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath("$PSScriptRoot/../..")
$root = "$repo/../lp-worktrees"; $basePort = '3101'; $install = $true; $ids = @(); $stories = @()
function Usage { 'Usage: spawn-codex <ID…> [--root <dir>] [--base-port <n>] [--no-install]' }
function Invoke-Git { & git @args; if ($LASTEXITCODE -ne 0) { throw "git failed: $args" } }
function Quote($value) { "'" + $value.Replace("'", "''") + "'" }
try {
    for ($i = 0; $i -lt $args.Count; $i++) {
        switch -Exact ($args[$i]) {
            { $_ -in '--root', '--base-port' } {
                if ($i + 1 -ge $args.Count -or !$args[$i+1] -or $args[$i+1] -like '--*') { throw (Usage) }
                if ($_ -eq '--root') { $root = $args[++$i] } else { $basePort = $args[++$i] }
            }
            '--no-install' { $install = $false }
            { $_ -in '--help', '-h', '-?' } { Usage; exit 0 }
            default { if ($_ -like '--*') { throw (Usage) }; $ids += $_ }
        }
    }
    if (!$ids.Count) { throw (Usage) }
    if ($basePort -notmatch '^[0-9]{1,5}$' -or [int]$basePort -lt 1 -or [int]$basePort + $ids.Count - 1 -gt 65535) { throw 'Invalid port range' }
    $root = [IO.Path]::GetFullPath($root); Set-Location -LiteralPath $repo
    # Validate the whole batch before creating directories or writing git.
    $seen = @()
    foreach ($id in $ids) {
        if ($id -cin $seen) { throw "duplicate: $id" }; $seen += $id
        $json = & node scripts/agents/story.mjs info $id
        if ($LASTEXITCODE -ne 0) { throw "Unknown story: $id" }; $s = $json | ConvertFrom-Json
        if ($s.done) { throw "$id`: done" }; if (!$s.ready) { throw "$id`: not ready" }
        if (Test-Path -LiteralPath "$root/$id") { throw "$id`: worktree exists" }
        & git show-ref --verify --quiet "refs/heads/$($s.branch)"
        $ref = if ($LASTEXITCODE -eq 0) { $s.branch } else { $s.base }
        & git cat-file -e "${ref}:$($s.planFile)" 2>$null
        if ($LASTEXITCODE -ne 0 -and !(Test-Path -LiteralPath $s.planFile -PathType Leaf)) {
            & git cat-file -e "$($s.base):$($s.planFile)" 2>$null
            if ($LASTEXITCODE -ne 0) { throw "$id`: missing plan" }
        }
        $stories += @{ Info = $s; Ref = $ref }
    }
    $failed = $false
    for ($i = 0; $i -lt $stories.Count; $i++) {
        $s = $stories[$i].Info; $id = $s.id; $wt = "$root/$id"; $port = [int]$basePort + $i
        try {
            if ($stories[$i].Ref -eq $s.branch) { Invoke-Git worktree add $wt $s.branch }
            else { Invoke-Git worktree add -b $s.branch $wt $s.base }
            if (!(Test-Path -LiteralPath "$wt/$($s.planFile)" -PathType Leaf)) {
                New-Item -ItemType Directory -Force ([IO.Path]::GetDirectoryName("$wt/$($s.planFile)")) | Out-Null
                if (Test-Path -LiteralPath $s.planFile -PathType Leaf) { Copy-Item -LiteralPath $s.planFile -Destination "$wt/$($s.planFile)" }
                else { Invoke-Git show "$($s.base):$($s.planFile)" | Set-Content -LiteralPath "$wt/$($s.planFile)" -Encoding utf8 }
                Invoke-Git -C $wt add -- $s.planFile; Invoke-Git -C $wt commit -m "docs(plan): $id plan"
            }
            if ($install) {
                Push-Location -LiteralPath $wt
                try { & pnpm install --frozen-lockfile; if ($LASTEXITCODE -ne 0) { throw 'install failed' } } finally { Pop-Location }
            }
            $run = "$wt/$($s.runDir)"; New-Item -ItemType Directory -Force $run | Out-Null
            @"
Dùng skill solar-story-exec.
Story: $id — $($s.title) ($($s.epicFile)) · Plan: $($s.planFile)
Branch (đã checkout): $($s.branch) · Base: $($s.base) · Mode: $($s.mode)
Lệnh kiểm tra: $($s.checks -join '; '); thêm lệnh riêng trong plan.
Skill bổ trợ (nếu có trong .agents/skills): ponytail mức full khi viết code; test-driven-development,
debugging-and-error-recovery khi viết test/sửa lỗi.
Quy tắc AGENTS.md ưu tiên hơn ponytail.
Báo cáo: $($s.runDir)/codex-report.md
Dev server (nếu cần): PORT=$port pnpm --filter web dev
Không chạy git ghi.
"@ | Set-Content -LiteralPath "$run/codex-exec-prompt.md" -Encoding utf8
            $bin = if ($env:CODEX_BIN) { $env:CODEX_BIN } else { 'codex' }
            $cmdArgs = @('exec', '-C', $wt, '-s', 'workspace-write', '-c', "model_reasoning_effort=$($s.codexEffort.exec)", '-c', 'sandbox_workspace_write.network_access=true', '-o', "$run/codex-exec-last.md", "Dùng skill solar-story-exec. Đọc và làm theo $($s.runDir)/codex-exec-prompt.md.")
            $command = "& $(Quote $bin) $((@($cmdArgs | ForEach-Object { Quote $_ })) -join ' ') > $(Quote "$wt/codex.log") 2>&1; exit `$LASTEXITCODE"
            $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
            [IO.File]::WriteAllText("$run/stdin", '')
            $child = Start-Process pwsh -ArgumentList @('-NoProfile', '-EncodedCommand', $encoded) -WindowStyle Hidden -RedirectStandardInput "$run/stdin" -WorkingDirectory $wt -PassThru
            $child.Id | Set-Content -LiteralPath "$run/codex.pid"; $port | Set-Content -LiteralPath "$run/port"
            "✔ $id  $wt  $($s.branch)  port $port  pid $($child.Id)"
        } catch { [Console]::Error.WriteLine("! $id`: $_"); $failed = $true }
    }
    if ($failed) { exit 1 }
} catch { [Console]::Error.WriteLine("! $_"); exit 1 }

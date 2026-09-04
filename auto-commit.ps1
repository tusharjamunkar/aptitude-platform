# auto-commit.ps1
# Watches the aptitude-platform folder for file changes
# and auto-commits + pushes to GitHub every time a file is saved.
#
# HOW TO RUN (open a new PowerShell window and paste):
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   C:\Users\ASUS\.gemini\antigravity\scratch\aptitude-platform\auto-commit.ps1

$projectPath = "C:\Users\ASUS\.gemini\antigravity\scratch\aptitude-platform"
$debounceSeconds = 5   # Wait 5s after last change before committing

Write-Host "🔍 Auto-commit watcher started for: $projectPath" -ForegroundColor Cyan
Write-Host "   Every file change will be auto-committed and pushed to GitHub." -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop.`n" -ForegroundColor Gray

# Create a FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::FileName

# Debounce timer — only commit once after burst of changes
$lastChange = [datetime]::MinValue
$debounceTimer = $null

$action = {
    $global:lastChange = [datetime]::Now
}

# Register event handlers for all change types
$handlers = @(
    Register-ObjectEvent $watcher 'Changed' -Action $action
    Register-ObjectEvent $watcher 'Created' -Action $action
    Register-ObjectEvent $watcher 'Deleted' -Action $action
    Register-ObjectEvent $watcher 'Renamed' -Action $action
)

try {
    while ($true) {
        Start-Sleep -Milliseconds 500

        if ($global:lastChange -ne [datetime]::MinValue) {
            $elapsed = ([datetime]::Now - $global:lastChange).TotalSeconds

            if ($elapsed -ge $debounceSeconds) {
                $global:lastChange = [datetime]::MinValue

                # Run git commands
                Set-Location $projectPath

                $status = git status --porcelain 2>&1
                if ($status) {
                    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                    $changedFiles = ($status | ForEach-Object { $_.Trim() }) -join ", "

                    # Ignore node_modules and .env changes
                    $relevantChanges = $status | Where-Object {
                        $_ -notmatch "node_modules" -and
                        $_ -notmatch "\.env$" -and
                        $_ -notmatch "package-lock\.json"
                    }

                    if ($relevantChanges) {
                        Write-Host "📦 Changes detected — committing..." -ForegroundColor Yellow

                        git add . 2>&1 | Out-Null

                        $commitMsg = "🔄 Auto-commit: $timestamp"
                        git commit -m $commitMsg 2>&1 | Out-Null

                        $pushResult = git push origin main 2>&1
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "✅ Pushed to GitHub at $timestamp" -ForegroundColor Green
                        } else {
                            Write-Host "⚠️  Push failed. Retrying..." -ForegroundColor Red
                            Start-Sleep -Seconds 3
                            git push origin main 2>&1 | Out-Null
                        }
                    }
                }
            }
        }
    }
} finally {
    # Cleanup on Ctrl+C
    $handlers | ForEach-Object { Unregister-Event -SourceIdentifier $_.Name }
    $watcher.Dispose()
    Write-Host "`n🛑 Auto-commit watcher stopped." -ForegroundColor Red
}

# Locate git.exe
$gitPath = "git"
try {
    $null = Get-Command git -ErrorAction Stop
} catch {
    $localApp = $env:LOCALAPPDATA
    $desktopGits = Get-ChildItem -Path "$localApp\GitHubDesktop" -Recurse -Filter "git.exe" -ErrorAction SilentlyContinue
    if ($desktopGits) {
        $gitPath = $desktopGits[0].FullName
    } else {
        if (Test-Path "C:\Program Files\Git\cmd\git.exe") {
            $gitPath = "C:\Program Files\Git\cmd\git.exe"
        }
    }
}

# Check git status
$status = & $gitPath status --porcelain
if ($status) {
    # Stage all changes
    & $gitPath add -A
    
    # Commit changes
    & $gitPath commit -m "Auto-commit: Updates from Antigravity session"
    
    # Push to remote main
    & $gitPath push origin main
}

# Output empty JSON to satisfy the hook contract
Write-Output "{}"

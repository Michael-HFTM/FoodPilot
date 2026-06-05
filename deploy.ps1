<#
.SYNOPSIS
    Build and deploy FoodPilot to the Raspberry Pi.

.DESCRIPTION
    Builds the Angular frontend, stages the backend (excluding .venv,
    foodpilot.db, __pycache__, etc.) into a temp directory, copies it to
    the Pi with scp, installs Python dependencies in a venv on the Pi,
    restarts the foodpilot systemd service, and runs a health check.

    Assumes the systemd service is already set up on the Pi. This script
    only manages code, dependencies, and the service lifecycle (restart).

    Targets PowerShell 7+ (works in Windows PowerShell 5.1 too).

.PARAMETER DryRun
    Print every command that would run, but do not execute it.

.PARAMETER SkipBuild
    Reuse the existing backend/static/ folder (skip npm install / ng build).

.PARAMETER SkipPip
    Do not run pip install on the Pi.

.PARAMETER NoRestart
    Do not restart the foodpilot service.

.PARAMETER PiHost
    Pi hostname or IP. Default: Pi-FoodPilot

.PARAMETER PiUser
    SSH user. Default: admin

.PARAMETER PiDir
    Remote project directory. Default: ~/foodpilot

.EXAMPLE
    .\deploy.ps1
    Normal re-deploy.

.EXAMPLE
    .\deploy.ps1 -DryRun
    Show what would happen.

.EXAMPLE
    .\deploy.ps1 -PiHost 192.168.1.50 -PiUser foodpilot
    Override the default target.

.NOTES
    Requires: scp, ssh, npm (and npx for builds) on PATH.
    Requires: SSH key auth to the Pi (ssh-copy-id <user>@<host> if not set up).
#>
[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$SkipBuild,
    [switch]$SkipPip,
    [switch]$NoRestart,
    [string]$PiHost = 'Pi-FoodPilot',
    [string]$PiUser = 'admin',
    [string]$PiDir  = '~/foodpilot'
)

$ErrorActionPreference = 'Stop'

# ---------- paths ----------
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir  = Join-Path $ScriptDir 'frontend'
$BackendDir   = Join-Path $ScriptDir 'backend'
$ServiceName  = 'foodpilot'

$SshTarget    = "$PiUser@$PiHost"

# ---------- output helpers ----------
function Write-Log  { param([string]$m) Write-Host "==> $m" -ForegroundColor Cyan }
function Write-Ok   { param([string]$m) Write-Host "OK  $m"   -ForegroundColor Green }
function Write-Warn { param([string]$m) Write-Host "!!  $m"   -ForegroundColor Yellow }
function Write-Err  { param([string]$m) Write-Host "XX  $m"   -ForegroundColor Red }
function Write-Dry  { param([string]$m) Write-Host "[dry-run]  $m" -ForegroundColor Yellow }

# ---------- remote helpers ----------
function Invoke-Remote {
    param([Parameter(Mandatory)][string]$Command)
    if ($DryRun) {
        Write-Dry "ssh $SshTarget $Command"
        return 0
    }
    & ssh -o BatchMode=yes $SshTarget $Command
    $rc = $LASTEXITCODE
    if ($rc -ne 0) { throw "Remote command failed (exit $rc): $Command" }
    return $rc
}

function Test-Remote {
    param([Parameter(Mandatory)][string]$Command)
    if ($DryRun) {
        Write-Dry "ssh $SshTarget $Command  (test mode, treating as success)"
        return $true
    }
    & ssh -o BatchMode=yes $SshTarget $Command 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
}

# Like Invoke-Remote but streams output to the host and never throws.
# Use this for diagnostic commands whose output we want the user to see.
function Invoke-RemoteStream {
    param([Parameter(Mandatory)][string]$Command)
    if ($DryRun) {
        Write-Dry "ssh $SshTarget $Command"
        return 0
    }
    & ssh -o BatchMode=yes $SshTarget $Command
    return $LASTEXITCODE
}

# ---------- preflight ----------
Write-Log "Pre-flight"
foreach ($cmd in @('scp', 'ssh', 'npm')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Err "Missing required command: $cmd"
        exit 1
    }
}
if (-not $SkipBuild -and -not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Err "Missing required command: npx"
    exit 1
}

Write-Log "Checking SSH connection to $SshTarget"
if (-not (Test-Remote 'true')) {
    Write-Err "Cannot SSH to $SshTarget (no key auth or host unreachable)."
    Write-Err "Hint: ssh-copy-id $SshTarget"
    exit 1
}
Write-Ok "SSH reachable"

# ---------- frontend build ----------
$staticDir = Join-Path $BackendDir 'static'
if (-not $SkipBuild) {
    Write-Log "Building frontend"
    if ($DryRun) {
        Write-Dry "cd $FrontendDir; npm install --no-audit --no-fund; npm run build"
        Write-Dry "Mirror-Output: copy $FrontendDir\dist\frontend\browser\* -> $BackendDir\static\"
    } else {
        Push-Location $FrontendDir
        try {
            npm install --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        } finally {
            Pop-Location
        }

        # ng build output: frontend/dist/frontend/browser/  (Angular default,
        # since angular.json has no custom outputPath).
        $buildOut = Join-Path $FrontendDir 'dist/frontend/browser'
        if (-not (Test-Path $buildOut)) {
            throw "Build output not found at $buildOut. Check angular.json outputPath or build errors."
        }

        # Replace backend/static/ with the fresh build.
        # Wipe first so deleted/renamed asset files don't linger in the deploy.
        if (Test-Path $staticDir) {
            Get-ChildItem -Path $staticDir -Force | Remove-Item -Recurse -Force
        } else {
            New-Item -ItemType Directory -Path $staticDir -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $buildOut '*') -Destination $staticDir -Recurse -Force
    }
    Write-Ok "Frontend built to $BackendDir\static\"
} else {
    if (Test-Path $staticDir) {
        Write-Warn "Skipping frontend build (using existing $staticDir)"
    } else {
        Write-Err "Skipping build but $staticDir does not exist."
        Write-Err "Run without -SkipBuild first."
        exit 1
    }
}

# ---------- stage + sync ----------
# scp has no --exclude, so we stage locally, then upload the staging dir.
$StagingDir = Join-Path ([System.IO.Path]::GetTempPath()) ("foodpilot-deploy-" + [Guid]::NewGuid().ToString('N'))
Write-Log "Staging backend -> $StagingDir"
New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null

try {
    $excludes = @('.venv', '__pycache__', 'foodpilot.db', 'foodpilot.db-journal', '.env', '.pytest_cache')

    if ($DryRun) {
        Write-Dry "Copy-Item '$BackendDir\*' '$StagingDir' -Recurse -Exclude '$($excludes -join ''',''')'"
    } else {
        Copy-Item -Path (Join-Path $BackendDir '*') -Destination $StagingDir -Recurse -Exclude $excludes -Force

        # Defensive: scrub any leftover .pyc/.pyo/__pycache__ that slipped through
        Get-ChildItem -Path $StagingDir -Recurse -Directory -Filter '__pycache__' -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path $StagingDir -Recurse -Include '*.pyc', '*.pyo' -ErrorAction SilentlyContinue |
            Remove-Item -Force -ErrorAction SilentlyContinue
    }
    Write-Ok "Backend staged"

    Write-Log "Syncing to ${SshTarget}:${PiDir}/backend/"
    # '/.' copies the contents of the staging dir into the target (so we don't
    # end up with ~/foodpilot/backend/StagingDir/...).
    $scpSrc = "$StagingDir/."
    if ($DryRun) {
        Write-Dry "scp -r '$scpSrc' ${SshTarget}:${PiDir}/backend/"
    } else {
        & scp -r $scpSrc "${SshTarget}:${PiDir}/backend/"
        if ($LASTEXITCODE -ne 0) { throw "scp failed" }
    }
    Write-Ok "Backend synced"
}
finally {
    if (Test-Path $StagingDir) {
        Remove-Item $StagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# ---------- pip install on pi ----------
if (-not $SkipPip) {
    Write-Log "Installing Python dependencies on Pi"
    $pipCmd = "set -e; cd $PiDir/backend; if [ ! -d .venv ]; then python3 -m venv .venv; fi; .venv/bin/pip install --upgrade pip -q; .venv/bin/pip install -q -r requirements.txt"
    Invoke-Remote $pipCmd
    Write-Ok "Dependencies installed"
} else {
    Write-Warn "Skipping pip install"
}

# ---------- restart service ----------
if (-not $NoRestart) {
    Write-Log "Restarting $ServiceName service"
    if (Test-Remote "systemctl is-enabled --quiet $ServiceName.service") {
        Invoke-Remote "sudo systemctl restart $ServiceName.service"
        Write-Ok "Service restarted"
    } else {
        Write-Err "Service $ServiceName.service is not installed on the Pi."
        Write-Err "Set it up manually (see docs/Deployment.md) before deploying."
        exit 1
    }
} else {
    Write-Warn "Skipping service restart"
}

# ---------- health check ----------
if (-not $NoRestart -and -not $DryRun) {
    # Give systemd a moment to settle after restart
    Start-Sleep -Seconds 2

    Write-Log "Checking service status"
    if (-not (Test-Remote "systemctl is-active --quiet $ServiceName.service")) {
        Write-Err "Service $ServiceName is not active. Dumping diagnostics:"
        Write-Host ""
        Invoke-RemoteStream "systemctl status $ServiceName.service --no-pager"
        Write-Host ""
        Write-Host "--- last 40 journal lines ---"
        Invoke-RemoteStream "sudo journalctl -u $ServiceName -n 40 --no-pager"
        exit 1
    }

    Write-Log "Health check (GET /api/status/)"
    $healthy = $false
    for ($i = 1; $i -le 8; $i++) {
        if (Test-Remote "curl -fsS http://127.0.0.1:8000/api/status/") {
            $healthy = $true
            break
        }
        Start-Sleep -Seconds 1
    }
    if ($healthy) {
        Write-Ok "Service responding on http://${PiHost}:8000"
    } else {
        Write-Err "Service is active but did not respond on port 8000 within 8s."
        Write-Err "Last 40 journal lines:"
        Invoke-RemoteStream "sudo journalctl -u $ServiceName -n 40 --no-pager"
        exit 1
    }
}

Write-Ok "Deploy complete"
Write-Host ""
Write-Host "  Web UI:  http://$PiHost`:8000"
Write-Host "  Logs:    ssh $SshTarget 'sudo journalctl -u $ServiceName -f'"

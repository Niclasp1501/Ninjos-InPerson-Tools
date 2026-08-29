# Deploy Ninjo's In-Person Tools to a Foundry server. ASCII-only (PowerShell 5.1 compatibility).
[CmdletBinding()]
param(
    [ValidateSet("prod", "testv14")]
    [string]$Target = "testv14",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ModuleId = "ninjos-inperson-tools"

$configPath = Join-Path $PSScriptRoot "deploy-config.$Target.json"
if (-not (Test-Path $configPath)) { throw "Missing config: $configPath" }

$cfg          = Get-Content $configPath -Raw | ConvertFrom-Json
$HostAlias    = $cfg.HostAlias
$RemoteTarget = "$($cfg.RemoteModulesPath)/$ModuleId"
$ProjectRoot  = Split-Path -Parent $PSScriptRoot

# Allowlist: only runtime files
$uploadItems = @("module.json", "README.md", "CHANGELOG.md",
                 "scripts", "styles", "templates", "lang")

# Denylist: dev-only stuff
$denylist = @(".claude", "tools", "AGENTS.md", "node_modules", ".git", ".vscode", "*.log")

function Should-Skip($name) {
    foreach ($p in $denylist) { if ($name -like $p) { return $true } }
    return $false
}

$resolved = @()
foreach ($i in $uploadItems) {
    if (Should-Skip $i) { continue }
    $f = Join-Path $ProjectRoot $i
    if (Test-Path $f) { $resolved += $f }
}

Write-Host "==> Deploy $ModuleId to ${HostAlias}:$RemoteTarget"
if ($Target -eq "prod") {
    Write-Host "    TARGET IS PRODUCTION. Players may be connected." -ForegroundColor Yellow
}

if (-not $DryRun) {
    & ssh $HostAlias "mkdir -p '$RemoteTarget'"
    if ($LASTEXITCODE -ne 0) { throw "ssh mkdir failed" }
}

foreach ($f in $resolved) {
    $leaf = Split-Path -Leaf $f
    if ($DryRun) { Write-Host "[DryRun] $leaf"; continue }
    & scp -r -p -q $f "${HostAlias}:$RemoteTarget/"
    if ($LASTEXITCODE -ne 0) { throw "scp failed on $leaf" }
    Write-Host "  OK: $leaf"
}

Write-Host "==> Done. Reload the world in Foundry."

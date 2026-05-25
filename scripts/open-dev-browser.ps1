param(
    [string]$Url = "http://localhost:5173",
    [bool]$Guest = $true,
    [bool]$EnsureBackend = $true
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$profileDir = Join-Path (Get-Location) ".tmp\dev-browser-profile-$timestamp"
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$candidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

$browserPath = $null
foreach ($path in $candidates) {
    if (Test-Path $path) {
        $browserPath = $path
        break
    }
}

if (-not $browserPath) {
    Write-Error "Nenhum Chrome/Edge encontrado para abrir o perfil de desenvolvimento."
    exit 1
}

if ($EnsureBackend) {
    $backendHealthy = $false
    try {
        $health = Invoke-RestMethod -Method Get -Uri "http://localhost:4001/health" -TimeoutSec 2
        if ($health.status -eq "ok") {
            $backendHealthy = $true
        }
    } catch {}

    if (-not $backendHealthy) {
        Write-Output "Backend local nao encontrado. Iniciando npm run server..."
        Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" `
            -ArgumentList "run","server" `
            -WorkingDirectory (Get-Location) `
            -WindowStyle Hidden

        $maxWaitSeconds = 30
        for ($i = 0; $i -lt $maxWaitSeconds; $i++) {
            Start-Sleep -Seconds 1
            try {
                $health = Invoke-RestMethod -Method Get -Uri "http://localhost:4001/health" -TimeoutSec 2
                if ($health.status -eq "ok") {
                    $backendHealthy = $true
                    break
                }
            } catch {}
        }

        if (-not $backendHealthy) {
            Write-Error "Backend nao ficou disponivel em http://localhost:4001 apos ${maxWaitSeconds}s."
            exit 1
        }
    }
}

$arguments = @(
    "--user-data-dir=$profileDir",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--new-window",
    $Url
)

if ($Guest) {
    $arguments = @("--guest") + $arguments
}

Start-Process -FilePath $browserPath -ArgumentList $arguments
Write-Output "Navegador de dev aberto (guest=$Guest, extensoes desativadas) em: $Url"

$ports = @(4001, 5173)

foreach ($port in $ports) {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) {
        Write-Output "PORT ${port}: livre"
        continue
    }

    $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $processIds) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Write-Output "PORT ${port}: encerrando PID ${procId} ($($proc.ProcessName))"
            Stop-Process -Id $procId -Force
        } catch {
            Write-Output "PORT ${port}: nao foi possivel encerrar PID ${procId}"
        }
    }
}

Start-Sleep -Milliseconds 400

# Limpeza adicional de processos órfãos do projeto (watchers antigos)
$workspacePattern = "aci-suite"
$processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
        ($_.Name -in @('node.exe', 'cmd.exe')) -and
        $_.CommandLine -and
        $_.CommandLine -like "*$workspacePattern*" -and
        (
            $_.CommandLine -like "*npm-cli.js*run server*" -or
            $_.CommandLine -like "*npm-cli.js*run dev*" -or
            $_.CommandLine -like "*npm-cli.js*run dev:all*" -or
            $_.CommandLine -like "*npm-cli.js*run dev:sync*" -or
            $_.CommandLine -like "*concurrently*" -or
            $_.CommandLine -like "*node_modules*vite*bin*vite.js*" -or
            $_.CommandLine -like "*node_modules*tsx*dist*cli.mjs*watch*" -or
            $_.CommandLine -like "*node_modules*tsx*dist*loader.mjs*"
        )
    }

foreach ($proc in $processes) {
    try {
        Write-Output "ORPHAN: encerrando PID $($proc.ProcessId) ($($proc.Name))"
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
    } catch {
        Write-Output "ORPHAN: nao foi possivel encerrar PID $($proc.ProcessId)"
    }
}

Start-Sleep -Milliseconds 400
Write-Output "Limpeza de portas concluida."

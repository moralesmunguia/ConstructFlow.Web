param(
    [string]$Server = 'localhost',
    [int]$Port = 3306,
    [string]$User = 'constructflow',
    [string]$Database = 'constructflow'
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path (Join-Path $scriptDir '..') | Select-Object -ExpandProperty Path

# Try to extract password from apply_sql_patch.ps1
$patchScript = Join-Path $scriptDir 'apply_sql_patch.ps1'
$pw = $null
if (Test-Path $patchScript) {
    $match = Select-String -Path $patchScript -Pattern 'Password\s*=\s*"([^"]+)"' -AllMatches
    if ($match -and $match.Matches.Count -gt 0) {
        $pw = $match.Matches[0].Groups[1].Value
    }
}

if (-not $pw) {
    $secure = Read-Host -AsSecureString "MySQL password for $User@$Server (input hidden)"
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $pw = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$env:MYSQL_PWD = $pw

try {
    $mysql = (Get-Command mysql.exe -ErrorAction Stop).Path
} catch {
    Write-Error "mysql.exe not found in PATH. Install MySQL client or add it to PATH."
    exit 3
}

$files = @(
    'Documentacion/BD/Script/ConstructFlow_BDD05_01_CoreFoundation.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_02_Clientes_Comercial.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_03_Proyectos.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_04_Actividades_Gantt.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_05_Evidencias_Documentos.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_06_Finanzas_Costos.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_07_Dashboard_KPI_Alertas_Notificaciones.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_08_Auditoria_Workflow_Integraciones.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD05_09_Master.sql',
    'Documentacion/BD/Script/ConstructFlow_BDD06_Vistas_SP_Triggers_Jobs.sql'
)

foreach ($rel in $files) {
    $p = Join-Path $root $rel
    if (-not (Test-Path $p)) { Write-Error "SQL file missing: $p"; exit 2 }
    Write-Host "Executing: $rel"
    try {
        Get-Content $p -Raw | & $mysql -h $Server -P $Port -u $User $Database
        if ($LASTEXITCODE -ne 0) { Write-Error "mysql failed on $rel with code $LASTEXITCODE"; exit $LASTEXITCODE }
    } catch {
        Write-Error ([string]::Format('Exception running {0}: {1}', $rel, $_.Exception.Message)); exit 1
    }
    Write-Host "OK: $rel"
}

Write-Host "Schema creation finished."
Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue

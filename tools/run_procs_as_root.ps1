param(
    [string]$Server = 'localhost',
    [int]$Port = 3306,
    [string]$User = 'root',
    [string]$Database = 'constructflow',
    [string]$SqlFile = 'Documentacion/BD/Script/ConstructFlow_BDD06_Procs_Triggers.sql'
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$p = $SqlFile
if (-not (Test-Path $p)) {
    $candidate = Join-Path $scriptDir $SqlFile
    if (Test-Path $candidate) { $p = $candidate } else { Write-Error "SQL file not found: $SqlFile"; exit 2 }
} else {
    $p = (Resolve-Path $p).Path
}

$secure = Read-Host -AsSecureString "MySQL root password (input hidden)"
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$pw = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$origMYSQLPWD = [System.Environment]::GetEnvironmentVariable("MYSQL_PWD","Process")
[System.Environment]::SetEnvironmentVariable("MYSQL_PWD", $pw, "Process")

try {
    $mysql = (Get-Command mysql.exe -ErrorAction Stop).Path

    Write-Host "Checking current log_bin_trust_function_creators value..."
    $origOutput = & $mysql -h $Server -P $Port -u $User -e "SELECT @@GLOBAL.log_bin_trust_function_creators;" 2>&1
    Write-Host $origOutput
    $origVal = ($origOutput -split "`n" | Select-Object -Last 1).Trim()
    Write-Host "Original value: $origVal"

    if ($origVal -ne '1') {
        Write-Host "Setting log_bin_trust_function_creators = 1"
        & $mysql -h $Server -P $Port -u $User -e "SET GLOBAL log_bin_trust_function_creators = 1;" 2>&1 | Write-Host
    } else {
        Write-Host "log_bin_trust_function_creators already 1"
    }

    Write-Host "Executing procedures/triggers SQL file: $p"
    Get-Content $p -Raw | & $mysql -h $Server -P $Port -u $User $Database
    if ($LASTEXITCODE -ne 0) { Write-Error "mysql returned code $LASTEXITCODE during SQL execution"; exit $LASTEXITCODE }

    if ($origVal -ne '1') {
        Write-Host "Restoring original log_bin_trust_function_creators = $origVal"
        & $mysql -h $Server -P $Port -u $User -e "SET GLOBAL log_bin_trust_function_creators = $origVal;" 2>&1 | Write-Host
    } else {
        Write-Host "Leaving log_bin_trust_function_creators as 1 (originally 1)."
    }

    Write-Host "Procedures and triggers applied successfully."
} catch {
    Write-Error "Exception: $($_.Exception.Message)"
    exit 1
} finally {
    if ($null -ne $origMYSQLPWD) {
        [System.Environment]::SetEnvironmentVariable("MYSQL_PWD", $origMYSQLPWD, "Process")
    } else {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

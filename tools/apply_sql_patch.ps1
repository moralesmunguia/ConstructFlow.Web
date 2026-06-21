<#
.SYNOPSIS Applies SQL patch file to MySQL database safely.
.DESCRIPTION
This script executes a SQL file against a MySQL server. It prompts for password securely if not provided.
It sets MYSQL_PWD temporarily to avoid exposing password on command line.

Usage examples:
  PowerShell -NoProfile -ExecutionPolicy Bypass -File .\apply_sql_patch.ps1
  PowerShell -NoProfile -ExecutionPolicy Bypass -File .\apply_sql_patch.ps1 -Server db.example.com -User cf_user

#>
param(
    [string]$Server = "localhost",
    [int]$Port = 3306,
    [string]$Database = "constructflow",
    [string]$User = "constructflow",
    [string]$Password = "",
    [string]$SqlFile = "Documentacion/BD/Script/patches/2026-06-16_schema_fixes.sql",
    [switch]$DryRun
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Resolve SQL file path relative to script directory if needed
if (-not (Test-Path $SqlFile)) {
    $candidate = Join-Path $scriptDir $SqlFile
    if (Test-Path $candidate) { $SqlFile = $candidate } else { Write-Error "SQL file not found: $SqlFile"; exit 2 }
} else {
    $SqlFile = (Resolve-Path $SqlFile).Path
}

if ($DryRun) {
    Write-Host "DRY RUN: showing first 200 lines of $SqlFile"
    Get-Content $SqlFile -TotalCount 200
    exit 0
}

$mysqlCmd = Get-Command mysql.exe -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    Write-Error "mysql.exe not found in PATH. Install MySQL client or add it to PATH."; exit 3
}

if (-not $Password) {
    $secure = Read-Host -AsSecureString "MySQL password for $User@$Server (input hidden)"
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

# Set MYSQL_PWD temporarily in process environment to avoid exposing password in commandline
$origMYSQLPWD = [System.Environment]::GetEnvironmentVariable("MYSQL_PWD", "Process")
[System.Environment]::SetEnvironmentVariable("MYSQL_PWD", $Password, "Process")

Write-Host ("Executing patch: {0} against {1}:{2}/{3}" -f $SqlFile, $Server, $Port, $Database)

try {
    $sqlContent = Get-Content $SqlFile -Raw
    $sqlContent | & $mysqlCmd.Path -h $Server -P $Port -u $User $Database
    $rc = $LASTEXITCODE
}
finally {
    # Clear password from environment
    if ($null -ne $origMYSQLPWD) {
        [System.Environment]::SetEnvironmentVariable("MYSQL_PWD", $origMYSQLPWD, "Process")
    } else {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

if ($rc -ne 0) { Write-Error "mysql exited with code $rc"; exit $rc }
Write-Host "Patch executed successfully.";

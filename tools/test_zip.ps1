$p = 'C:\AppServ\www\ConstructFlow\Documentacion\BD\BDD-03 Parte 2.docx'
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
    $z = [System.IO.Compression.ZipFile]::OpenRead($p)
    Write-Output "ZIP_OK Entries=$($z.Entries.Count)"
    $z.Dispose()
} catch {
    Write-Output "ZIP_ERR: $($_.Exception.Message)"
}
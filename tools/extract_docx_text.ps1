# Extrae texto plano de archivos .docx en el workspace
# Salida: Documentacion\BD\ExtractedDocx\<base>.txt

$workspace = "c:\AppServ\www\ConstructFlow"
$outdir = Join-Path $workspace "Documentacion\BD\ExtractedDocx"

if (-not (Test-Path $outdir)) {
    New-Item -ItemType Directory -Path $outdir | Out-Null
}

$docxFiles = Get-ChildItem -Path $workspace -Recurse -Filter *.docx -ErrorAction SilentlyContinue

if (!$docxFiles) {
    Write-Output "No se encontraron archivos .docx en $workspace"
    exit 0
}

foreach ($file in $docxFiles) {
    Write-Output "Procesando: $($file.FullName)"
    $tmp = Join-Path $env:TEMP ("docx_extract_" + [Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tmp | Out-Null
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
        $zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
        $entry = $zip.GetEntry('word/document.xml')
        if ($entry -ne $null) {
            $stream = $entry.Open()
            $sr = New-Object System.IO.StreamReader($stream)
            $xml = $sr.ReadToEnd()
            $sr.Close()
            $stream.Close()
            $matches = [regex]::Matches($xml, '<w:t[^>]*>(.*?)</w:t>', 'Singleline')
            $sb = New-Object System.Text.StringBuilder
            foreach ($m in $matches) {
                $text = $m.Groups[1].Value
                $text = $text -replace '&amp;', '&'
                $text = $text -replace '&lt;', '<'
                $text = $text -replace '&gt;', '>'
                $text = $text -replace '&quot;', '"'
                $text = $text -replace "&#39;", "'"
                [void]$sb.AppendLine($text)
            }
            $safeName = ($file.BaseName -replace '[\\/:*?"<>|]','_') + ".txt"
            $outfile = Join-Path $outdir $safeName
            $sb.ToString() | Out-File -FilePath $outfile -Encoding UTF8
            Write-Output "Guardado: $outfile"
        } else {
            Write-Output "No se encontró word/document.xml en $($file.Name)"
        }
        $zip.Dispose()
    } catch {
        Write-Output "Error procesando $($file.FullName): $_"
    } finally {
        Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Output "Extracción finalizada. Archivos guardados en: $outdir"
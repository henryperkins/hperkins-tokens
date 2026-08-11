$ErrorActionPreference = 'Stop'
$themeRoot = Split-Path -Parent $PSScriptRoot
$docxPath = Join-Path $themeRoot 'assets\documents\henry-perkins-wordpress-support-engineer-resume.docx'
$pdfPath = Join-Path $themeRoot 'assets\documents\henry-perkins-wordpress-support-engineer-resume.pdf'
$wordProcessIdsBefore = @(Get-Process -Name WINWORD -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($docxPath, $false, $true)
    $document.ExportAsFixedFormat(
        $pdfPath, 17, $false, 0, 0, 1, 1, 0,
        $true, $true, 1, $true, $true, $false
    )
} finally {
    if ($null -ne $document) {
        $document.Close($false)
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document)
    }
    if ($null -ne $word) {
        $word.Quit()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

$residualProcessIds = @()
for ($attempt = 0; $attempt -lt 50; $attempt++) {
    $wordProcessIdsAfter = @(Get-Process -Name WINWORD -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
    $residualProcessIds = @($wordProcessIdsAfter | Where-Object { $_ -notin $wordProcessIdsBefore })
    if ($residualProcessIds.Count -eq 0) {
        break
    }
    Start-Sleep -Milliseconds 100
}
if ($residualProcessIds.Count -gt 0) {
    throw "Word export left WINWORD process IDs running: $($residualProcessIds -join ', ')"
}
Write-Output "exported=$pdfPath"
Write-Output "word_process_cleanup=pass"

# Word emits valid heading tags inside compressed PDF object streams. Rewrite
# those streams losslessly so the portable raw-structure gate can audit H1/H2.
$python = 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python (Join-Path $PSScriptRoot 'verify-placement-text-parity.py') --normalize-word-pdf
if ($LASTEXITCODE -ne 0) {
    throw "Tagged-PDF normalization failed with exit code $LASTEXITCODE"
}

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\support-resume-cleanup.ps1')

function Invoke-SupportResumeExport {
    $themeRoot = Split-Path -Parent $PSScriptRoot
    $docxPath = Join-Path $themeRoot 'assets\documents\henry-perkins-wordpress-support-engineer-resume.docx'
    $pdfPath = Join-Path $themeRoot 'assets\documents\henry-perkins-wordpress-support-engineer-resume.pdf'
    $wordProcessIdsBefore = @(Get-Process -Name WINWORD -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
    $state = @{
        Word = $null
        Documents = $null
        Document = $null
    }

    Invoke-SupportResumeOperationWithCleanup -Operation {
        $state.Word = New-Object -ComObject Word.Application
        $state.Word.Visible = $false
        $state.Word.DisplayAlerts = 0
        $state.Documents = $state.Word.Documents
        $state.Document = $state.Documents.Open($docxPath, $false, $true)
        $state.Document.ExportAsFixedFormat(
            $pdfPath, 17, $false, 0, 0, 1, 1, 0,
            $true, $true, 1, $true, $true, $false
        )
    } -CleanupActions @(
        @{ Name = 'close document'; Action = {
            if ($null -ne $state.Document) {
                $state.Document.Close($false)
            }
        } },
        @{ Name = 'release document'; Action = {
            if ($null -ne $state.Document) {
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($state.Document)
                $state.Document = $null
            }
        } },
        @{ Name = 'release Documents collection'; Action = {
            if ($null -ne $state.Documents) {
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($state.Documents)
                $state.Documents = $null
            }
        } },
        @{ Name = 'quit Word'; Action = {
            if ($null -ne $state.Word) {
                $state.Word.Quit()
            }
        } },
        @{ Name = 'release Word'; Action = {
            if ($null -ne $state.Word) {
                [void][Runtime.InteropServices.Marshal]::ReleaseComObject($state.Word)
                $state.Word = $null
            }
        } },
        @{ Name = 'collect COM wrappers'; Action = { [GC]::Collect() } },
        @{ Name = 'wait for COM finalizers'; Action = { [GC]::WaitForPendingFinalizers() } },
        @{ Name = 'audit residual WINWORD processes'; Action = {
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
        } }
    )

    Write-Output "exported=$pdfPath"
    Write-Output "word_process_cleanup=pass"

    # Word emits valid heading tags inside compressed PDF object streams.
    # Rewrite them losslessly so the portable raw-structure gate can audit H1/H2.
    $python = 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    & $python (Join-Path $PSScriptRoot 'verify-placement-text-parity.py') --normalize-word-pdf
    if ($LASTEXITCODE -ne 0) {
        throw "Tagged-PDF normalization failed with exit code $LASTEXITCODE"
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    Invoke-SupportResumeExport
}

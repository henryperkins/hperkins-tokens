function Invoke-SupportResumeOperationWithCleanup {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [scriptblock]$Operation,

        [Parameter(Mandatory)]
        [object[]]$CleanupActions
    )

    $primaryError = $null
    $operationResult = $null
    try {
        $operationResult = & $Operation
    } catch {
        $primaryError = $_
    }

    $cleanupErrors = [System.Collections.Generic.List[object]]::new()
    foreach ($cleanupAction in $CleanupActions) {
        try {
            & $cleanupAction.Action
        } catch {
            $cleanupErrors.Add([pscustomobject]@{
                Name = [string]$cleanupAction.Name
                Error = $_
            })
        }
    }

    if ($null -ne $primaryError) {
        foreach ($cleanupError in $cleanupErrors) {
            Write-Warning "Cleanup '$($cleanupError.Name)' also failed: $($cleanupError.Error.Exception.Message)"
        }
        throw $primaryError
    }

    if ($cleanupErrors.Count -gt 0) {
        $details = @($cleanupErrors | ForEach-Object { "$($_.Name): $($_.Error.Exception.Message)" }) -join '; '
        throw "Support résumé cleanup failed: $details"
    }

    return $operationResult
}

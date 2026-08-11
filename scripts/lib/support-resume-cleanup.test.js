const assert = require( 'node:assert/strict' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );
const test = require( 'node:test' );

const helperPath = path.join( __dirname, 'support-resume-cleanup.ps1' ).replaceAll( "'", "''" );

test( 'cleanup continues after an early failure and rethrows the original export error', () => {
	const script = String.raw`
$ErrorActionPreference = 'Stop'
. '${ helperPath }'
$events = [System.Collections.Generic.List[string]]::new()
$caught = $null
try {
    Invoke-SupportResumeOperationWithCleanup -Operation {
        throw 'primary export failure'
    } -CleanupActions @(
        @{ Name = 'close document'; Action = { [void]$events.Add('close'); throw 'close failure' } },
        @{ Name = 'quit Word'; Action = { [void]$events.Add('quit') } },
        @{ Name = 'residual audit'; Action = { [void]$events.Add('audit') } }
    )
} catch {
    $caught = $_
}
if ($null -eq $caught) {
    throw 'expected the operation to fail'
}
[pscustomobject]@{
    Message = $caught.Exception.Message
    Events = @($events)
} | ConvertTo-Json -Compress
`;
	const result = spawnSync( 'pwsh', [ '-NoProfile', '-NonInteractive', '-Command', script ], {
		encoding: 'utf8',
	} );

	assert.equal( result.status, 0, result.stderr || result.stdout );
	const jsonLine = result.stdout.trim().split( /\r?\n/ ).findLast( ( line ) => line.startsWith( '{' ) );
	assert.ok( jsonLine, `PowerShell emitted no JSON result: ${ result.stdout }` );
	const observed = JSON.parse( jsonLine );
	assert.equal( observed.Message, 'primary export failure' );
	assert.deepEqual( observed.Events, [ 'close', 'quit', 'audit' ] );
} );

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );
const test = require( 'node:test' );

const helperPath = path.join( __dirname, 'support-resume-cleanup.ps1' ).replaceAll( "'", "''" );
const exportSource = fs.readFileSync( path.join( __dirname, '..', 'export-support-resume.ps1' ), 'utf8' );

function powerShellExecutable() {
	const candidates = process.platform === 'win32' ? [ 'pwsh', 'powershell.exe' ] : [ 'pwsh' ];
	for ( const candidate of candidates ) {
		const probe = spawnSync( candidate, [ '-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.Major' ], {
			encoding: 'utf8',
		} );
		if ( ! probe.error ) {
			return candidate;
		}
		assert.equal( probe.error.code, 'ENOENT', `Unable to probe ${ candidate }: ${ probe.error.message }` );
	}
	assert.fail( 'pwsh is required to run the support-resume cleanup contract.' );
}

test( 'resolves and preflights configurable Python before starting Word export', () => {
	assert.match( exportSource, /\$env:HPERKINS_PYTHON_BIN/ );
	assert.match( exportSource, /Get-Command python/ );
	assert.match( exportSource, /import docx, pdfplumber, pypdf/ );
	assert.doesNotMatch( exportSource, /C:\\Users\\/i );
	assert.ok(
		exportSource.indexOf( '$python = Resolve-SupportResumePython' ) <
			exportSource.indexOf( 'New-Object -ComObject Word.Application' ),
		'Python dependency preflight must run before Word can overwrite the PDF.'
	);
} );

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
	const result = spawnSync( powerShellExecutable(), [ '-NoProfile', '-NonInteractive', '-Command', script ], {
		encoding: 'utf8',
	} );

	assert.equal( result.status, 0, result.stderr || result.stdout );
	const jsonLine = result.stdout.trim().split( /\r?\n/ ).findLast( ( line ) => line.startsWith( '{' ) );
	assert.ok( jsonLine, `PowerShell emitted no JSON result: ${ result.stdout }` );
	const observed = JSON.parse( jsonLine );
	assert.equal( observed.Message, 'primary export failure' );
	assert.deepEqual( observed.Events, [ 'close', 'quit', 'audit' ] );
} );

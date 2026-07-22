const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const themeRoot = path.join( __dirname, '..', '..' );
const workflow = fs.readFileSync( path.join( themeRoot, '.github', 'workflows', 'verify.yml' ), 'utf8' );
const typography = fs.readFileSync( path.join( themeRoot, 'scripts', 'verify-typography.js' ), 'utf8' );

test( 'runs the production gates on a daily schedule', () => {
	assert.match( workflow, /\n  schedule:\s*\n    - cron: '17 12 \* \* \*'/ );
} );

test( 'keeps all production browser gates in the deployed job on Node 22', () => {
	const deployedJob = workflow.slice( workflow.indexOf( '\n  deployed-content:' ) );

	assert.match( deployedJob, /node-version: '22'/ );
	assert.match( deployedJob, /node scripts\/verify-header\.js(?:;|\s|$)/ );
	assert.match( deployedJob, /node scripts\/verify-typography\.js(?:;|\s|$)/ );
	assert.match( deployedJob, /node scripts\/verify-prominent-actions\.js(?:;|\s|$)/ );
	assert.match( deployedJob, /node scripts\/verify-job-placement-pages\.js(?:;|\s|$)/ );
	assert.doesNotMatch( deployedJob, /verify-(?:header|typography|prominent-actions|job-placement-pages)\.js --source-only/ );
} );

test( 'includes the research appendix in the rendered typography route matrix', () => {
	assert.match( typography, /'\/placement-method-and-evidence\/'/ );
} );

test( 'runs the recruiter rendered-page source half on every branch', () => {
	const sourceJob = workflow.slice( workflow.indexOf( '\n  verify:' ), workflow.indexOf( '\n  deployed-content:' ) );
	assert.match( sourceJob, /node scripts\/verify-job-placement-pages\.js --source-only/ );
} );

test( 'runs the prominent-actions source contract on every branch', () => {
	const sourceJob = workflow.slice( workflow.indexOf( '\n  verify:' ), workflow.indexOf( '\n  deployed-content:' ) );
	assert.match( sourceJob, /node scripts\/verify-prominent-actions\.js --source-only/ );
} );

test( 'runs metadata, market parity, and production workflow contract tests in CI', () => {
	for ( const testFile of [
		'scripts/lib/job-placement-metadata-contract.test.js',
		'scripts/lib/market-screen-parity.test.js',
		'scripts/lib/production-gates-workflow.test.js',
	] ) {
		assert.ok( workflow.includes( testFile ), `Workflow unit-test list is missing ${ testFile }.` );
	}
} );

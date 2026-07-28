const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const vm = require( 'node:vm' );

const themeRoot = path.join( __dirname, '..', '..' );
const workflow = fs.readFileSync( path.join( themeRoot, '.github', 'workflows', 'verify.yml' ), 'utf8' );
const headerVerifier = fs.readFileSync( path.join( themeRoot, 'scripts', 'verify-header.js' ), 'utf8' );
const typography = fs.readFileSync( path.join( themeRoot, 'scripts', 'verify-typography.js' ), 'utf8' );

test( 'runs the production gates on a daily schedule', () => {
	assert.match( workflow, /\n  schedule:\s*\n    - cron: '17 12 \* \* \*'/ );
} );

test( 'keeps all production browser gates in the deployed job on Node 22', () => {
	const deployedJob = workflow.slice( workflow.indexOf( '\n  deployed-content:' ) );

	assert.match( deployedJob, /node-version: '22'/ );
	// Anchored to a whole line so a commented-out invocation cannot satisfy the
	// pin. These run inside a `run: |` block, where a leading # is shell
	// comment text the YAML parser keeps verbatim — an unanchored search would
	// still match it and report a gate that no longer runs.
	for ( const gate of [
		'verify-header',
		'verify-typography',
		'verify-prominent-actions',
		'verify-job-placement-pages',
		'verify-about-page-rendered',
	] ) {
		assert.match(
			deployedJob,
			new RegExp( `^\\s*if ! node scripts/${ gate.replace( /[.*+?^\${}()|[\]\\]/g, '\\$&' ) }\\.js; then$`, 'm' ),
			`${ gate } is not an active line in the deployed job.`
		);
	}
	assert.doesNotMatch( deployedJob, /verify-(?:header|typography|prominent-actions|job-placement-pages)\.js --source-only/ );
} );

test( 'both CI jobs pin the same Node 22.x major for the normative About word count', () => {
	// Normative About word-count acceptance runs under Node 22.x; the source
	// and deployed-production jobs must agree so ICU data cannot drift by job.
	const nodeVersions = [ ...workflow.matchAll( /node-version: '([^']+)'/g ) ].map( ( match ) => match[ 1 ] );
	assert.equal( nodeVersions.length, 2, 'expected exactly two node-version pins (one per job)' );
	assert.deepEqual( nodeVersions, [ '22', '22' ] );
} );

test( 'runs the About source contract against the reviewed candidate on every branch', () => {
	const sourceJob = workflow.slice( workflow.indexOf( '\n  verify:' ), workflow.indexOf( '\n  deployed-content:' ) );
	assert.match( sourceJob, /node scripts\/verify-about-page-source\.js --drafts/ );
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

test( 'normalizes pointer media for the production header gate', () => {
	const {
		getFinePointerOverrideSource,
		getHeaderMediaFeatures,
	} = require( './header-media-features' );

	assert.deepEqual( getHeaderMediaFeatures(), [] );
	assert.deepEqual( getHeaderMediaFeatures( { reducedMotion: true } ), [
		{ name: 'prefers-reduced-motion', value: 'reduce' },
	] );
	assert.equal( getFinePointerOverrideSource( { width: 781 } ), null );

	const viewport = { width: 782 };
	const sandbox = {
		window: {
			matchMedia( query ) {
				return {
					addEventListener() {},
					matches: query === '(min-width: 782px)' ? viewport.width >= 782 : false,
					media: query,
				};
			},
		},
	};
	vm.runInNewContext( getFinePointerOverrideSource( viewport ), sandbox );
	assert.equal(
		sandbox.window.matchMedia( '(min-width: 782px) and (hover: hover) and (pointer: fine)' ).matches,
		true
	);
	viewport.width = 781;
	assert.equal(
		sandbox.window.matchMedia( '(min-width: 782px) and (hover: hover) and (pointer: fine)' ).matches,
		false
	);
	assert.equal( sandbox.window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches, false );
	assert.match( headerVerifier, /getHeaderMediaFeatures\(\)/ );
	assert.match( headerVerifier, /getHeaderMediaFeatures\( \{ reducedMotion: true \} \)/ );
	assert.match( headerVerifier, /Page\.addScriptToEvaluateOnNewDocument/ );
} );

test( 'runs metadata, market parity, and production workflow contract tests in CI', () => {
	for ( const testFile of [
		'scripts/lib/about-page-contract.test.js',
		'scripts/lib/job-placement-metadata-contract.test.js',
		'scripts/lib/market-screen-parity.test.js',
		'scripts/lib/page-content-contract.test.js',
		'scripts/lib/production-gates-workflow.test.js',
	] ) {
		assert.ok( workflow.includes( testFile ), `Workflow unit-test list is missing ${ testFile }.` );
	}
} );

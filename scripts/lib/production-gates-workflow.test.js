const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const vm = require( 'node:vm' );

const { SOURCE_UNIT_TEST_FILES } = require( './source-unit-test-files' );

const themeRoot = path.join( __dirname, '..', '..' );
const workflow = fs.readFileSync( path.join( themeRoot, '.github', 'workflows', 'verify.yml' ), 'utf8' );
const headerVerifier = fs.readFileSync( path.join( themeRoot, 'scripts', 'verify-header.js' ), 'utf8' );
const typography = fs.readFileSync( path.join( themeRoot, 'scripts', 'verify-typography.js' ), 'utf8' );

function escapeRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

function assertActiveSourceCommand( sourceJob, command ) {
	assert.match(
		sourceJob,
		new RegExp( `^[ \\t]*run:[ \\t]*${ escapeRegExp( command ) }[ \\t]*\\r?$`, 'm' ),
		`${ command } is not an active workflow line.`
	);
}

function assertSourceUnitTestsAreActive( workflowSource, testFiles ) {
	const sourceJobStart = workflowSource.indexOf( '\n  verify:' );
	const deployedJobStart = workflowSource.indexOf( '\n  deployed-content:' );
	assert.ok( sourceJobStart >= 0, 'Workflow is missing the source job.' );
	assert.ok( deployedJobStart > sourceJobStart, 'Workflow is missing the deployed job after the source job.' );

	const sourceJob = workflowSource.slice( sourceJobStart, deployedJobStart );
	const stepMarker = '\n      - name: Script library unit tests';
	const stepStart = sourceJob.indexOf( stepMarker );
	assert.ok( stepStart >= 0, 'Source job is missing the script-library unit-test step.' );

	const nextStep = sourceJob.indexOf( '\n      - name:', stepStart + stepMarker.length );
	assert.ok( nextStep > stepStart, 'Script-library unit-test step has no following step boundary.' );
	const unitTestStep = sourceJob.slice( stepStart, nextStep );
	const runMarker = '\n        run: |';
	const runStart = unitTestStep.indexOf( runMarker );
	assert.ok( runStart >= 0, 'Script-library unit-test step is missing its run block.' );
	const runBlock = unitTestStep.slice( runStart + runMarker.length );

	assert.match( runBlock, /^\s*node --test\s+\\\s*$/m, 'Unit-test run block has no active node --test command.' );
	for ( const testFile of testFiles ) {
		assert.match(
			runBlock,
			new RegExp( `^\\s*${ escapeRegExp( testFile ) }(?:\\s+\\\\)?\\s*$`, 'm' ),
			`Workflow unit-test run block is missing an active ${ testFile } command line.`
		);
	}
}

function sourceUnitTestInventory( workflowSource ) {
	const sourceJobStart = workflowSource.indexOf( '\n  verify:' );
	const deployedJobStart = workflowSource.indexOf( '\n  deployed-content:' );
	const sourceJob = workflowSource.slice( sourceJobStart, deployedJobStart );
	const stepStart = sourceJob.indexOf( '\n      - name: Script library unit tests' );
	const nextStep = sourceJob.indexOf( '\n      - name:', stepStart + 1 );
	const unitTestStep = sourceJob.slice( stepStart, nextStep );

	return [ ...unitTestStep.matchAll( /^\s*(scripts\/lib\/[^\s\\]+\.test\.js)(?:\s+\\)?\s*$/gm ) ]
		.map( ( match ) => match[ 1 ] );
}

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
		'verify-resume-route',
	] ) {
		assert.match(
			deployedJob,
			new RegExp( `^\\s*if ! node scripts/${ gate.replace( /[.*+?^\${}()|[\]\\]/g, '\\$&' ) }\\.js; then$`, 'm' ),
			`${ gate } is not an active line in the deployed job.`
		);
	}
	assert.doesNotMatch( deployedJob, /verify-(?:header|typography|prominent-actions|job-placement-pages|resume-route)\.js --source-only/ );
	assert.match( deployedJob, /node scripts\/verify-job-placement-pages\.js/ );
	assert.doesNotMatch( deployedJob, /verify-job-placement-pages\.js[^\n]*--drafts/ );
	assert.doesNotMatch( deployedJob, /verify-prominent-actions\.js[^\n]*--drafts/ );
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
	assertActiveSourceCommand( sourceJob, 'node scripts/verify-job-placement-pages.js --source-only --drafts' );
} );

test( 'runs the prominent-actions source contract on every branch', () => {
	const sourceJob = workflow.slice( workflow.indexOf( '\n  verify:' ), workflow.indexOf( '\n  deployed-content:' ) );
	assertActiveSourceCommand( sourceJob, 'node scripts/verify-prominent-actions.js --source-only --drafts' );
} );

test( 'runs the resume-route source contract on every branch', () => {
	const sourceJob = workflow.slice( workflow.indexOf( '\n  verify:' ), workflow.indexOf( '\n  deployed-content:' ) );
	assertActiveSourceCommand( sourceJob, 'node scripts/verify-resume-route.js --source-only' );
	assert.doesNotMatch( sourceJob, /^\s*run:\s*node scripts\/verify-resume-route\.js\s*$/m );
} );

test( 'does not count commented phase commands as active source gates', () => {
	const sourceJob = workflow.slice( workflow.indexOf( '\n  verify:' ), workflow.indexOf( '\n  deployed-content:' ) );
	for ( const command of [
		'node scripts/verify-job-placement-pages.js --source-only --drafts',
		'node scripts/verify-prominent-actions.js --source-only --drafts',
	] ) {
		const commentedSourceJob = sourceJob.replace( `run: ${ command }`, `# run: ${ command }` );
		assert.notEqual( commentedSourceJob, sourceJob, `Commented-line mutation did not apply for ${ command }.` );
		assert.throws(
			() => assertActiveSourceCommand( commentedSourceJob, command ),
			/not an active workflow line/
		);
	}
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

test( 'runs metadata, Digest, About probe, market parity, and production workflow contract tests in CI', () => {
	assertSourceUnitTestsAreActive( workflow, [
		'scripts/lib/about-page-contract.test.js',
		'scripts/lib/about-page-rendered-probe.test.js',
		'scripts/lib/about-gravatar-heading.test.js',
		'scripts/lib/job-placement-digest-source-contract.test.js',
		'scripts/lib/job-placement-metadata-contract.test.js',
		'scripts/lib/journal-route-discovery.test.js',
		'scripts/lib/market-screen-parity.test.js',
		'scripts/lib/page-content-contract.test.js',
		'scripts/lib/page-phase-contract.test.js',
		'scripts/lib/placement-artifact-contract.test.js',
		'scripts/lib/production-gates-workflow.test.js',
		'scripts/lib/resume-route-contract.test.js',
		'scripts/lib/support-resume-cleanup.test.js',
	] );
} );

test( 'keeps the active CI unit-test inventory in exact canonical parity', () => {
	const onDisk = fs.readdirSync( __dirname )
		.filter( ( name ) => name.endsWith( '.test.js' ) )
		.sort()
		.map( ( name ) => `scripts/lib/${ name }` );
	assert.deepEqual( [ ...SOURCE_UNIT_TEST_FILES ].sort(), onDisk );
	assert.deepEqual( sourceUnitTestInventory( workflow ), SOURCE_UNIT_TEST_FILES );

	const missing = workflow.replace( /^\s*scripts\/lib\/journal-route-discovery\.test\.js\s+\\\s*\r?\n/m, '' );
	assert.notEqual( missing, workflow, 'Missing-file mutation must apply.' );
	assert.notDeepEqual( sourceUnitTestInventory( missing ), SOURCE_UNIT_TEST_FILES );

	const extra = workflow.replace(
		'            scripts/lib/zip-archive.test.js',
		[
			'            scripts/lib/zip-archive.test.js \\',
			'            scripts/lib/unlisted.test.js',
		].join( '\n' )
	);
	assert.notEqual( extra, workflow, 'Extra-file mutation must apply.' );
	assert.notDeepEqual( sourceUnitTestInventory( extra ), SOURCE_UNIT_TEST_FILES );
} );

test( 'runs the ownership-docs and event-retirement regression suites as active CI commands', () => {
	const regressionTests = [
		'scripts/lib/content-ownership-docs.test.js',
		'scripts/lib/event-copy-retirement-runbook.test.js',
	];

	assertSourceUnitTestsAreActive( workflow, regressionTests );

	for ( const testFile of regressionTests ) {
		const activeLine = new RegExp( `^([ \\t]*)${ escapeRegExp( testFile ) }(\\s+\\\\)?\\s*$`, 'm' );
		const commentedWorkflow = workflow.replace( activeLine, `$1# ${ testFile }$2` );
		assert.notEqual( commentedWorkflow, workflow, `Commented-line mutation must apply for ${ testFile }.` );
		assert.throws(
			() => assertSourceUnitTestsAreActive( commentedWorkflow, [ testFile ] ),
			/Workflow unit-test run block is missing an active/
		);

		const withoutActiveLine = workflow.replace( new RegExp( `^\\s*${ escapeRegExp( testFile ) }(?:\\s+\\\\)?\\s*$\\r?\\n`, 'm' ), '' );
		assert.notEqual( withoutActiveLine, workflow, `Active-line removal mutation must apply for ${ testFile }.` );
		const proseOnlyWorkflow = withoutActiveLine.replace(
			'\n  verify:',
			`\n# CI documentation mentions ${ testFile }.\n  verify:`
		);
		assert.throws(
			() => assertSourceUnitTestsAreActive( proseOnlyWorkflow, [ testFile ] ),
			/Workflow unit-test run block is missing an active/
		);
	}
} );

test( 'does not count a commented About probe test as active CI coverage', () => {
	const testFile = 'scripts/lib/about-page-rendered-probe.test.js';
	const commentedWorkflow = workflow.replace(
		`            ${ testFile } \\`,
		`            # ${ testFile } \\`
	);
	assert.notEqual( commentedWorkflow, workflow, 'Commented-line mutation must apply.' );

	assert.throws(
		() => assertSourceUnitTestsAreActive( commentedWorkflow, [ testFile ] ),
		/Workflow unit-test run block is missing an active scripts\/lib\/about-page-rendered-probe\.test\.js command line/
	);
} );

test( 'does not count About probe prose outside the unit-test run block', () => {
	const testFile = 'scripts/lib/about-page-rendered-probe.test.js';
	const withoutActiveLine = workflow.replace( new RegExp( `^\\s*${ escapeRegExp( testFile ) }\\s+\\\\\\s*$\\r?\\n`, 'm' ), '' );
	assert.notEqual( withoutActiveLine, workflow, 'Active-line removal mutation must apply.' );
	const proseOnlyWorkflow = withoutActiveLine.replace(
		'\n  verify:',
		`\n# CI coverage includes ${ testFile }.\n  verify:`
	);

	assert.throws(
		() => assertSourceUnitTestsAreActive( proseOnlyWorkflow, [ testFile ] ),
		/Workflow unit-test run block is missing an active scripts\/lib\/about-page-rendered-probe\.test\.js command line/
	);
} );

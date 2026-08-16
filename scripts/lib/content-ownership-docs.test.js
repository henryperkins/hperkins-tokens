const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	sectionBeforeMarker,
	verifyPortfolioOwnershipDocuments,
} = require( '../verify-content-ownership-docs' );

const themeRoot = path.join( __dirname, '..', '..' );
const verifiersSkill = '.claude/skills/verifiers/SKILL.md';

// Documents that own the WCUS phase-gate section and its operator command list.
// CLAUDE.md handed this role to the skill when the Commands section moved.
const phaseGateFiles = [
	verifiersSkill,
	'readme.txt',
	'docs/design-system/INDEX.md',
];

// Everything supplied to the verifier. CLAUDE.md is still scanned for guidance
// that contradicts the phase gate, so it stays in the fixture.
const documentFiles = [ ...phaseGateFiles, 'CLAUDE.md' ];

function readDocuments() {
	return Object.fromEntries( documentFiles.map( ( file ) => [
		file,
		fs.readFileSync( path.join( themeRoot, file ), 'utf8' ),
	] ) );
}

function withMutation( documents, file, mutate ) {
	return {
		...documents,
		[ file ]: mutate( documents[ file ] ),
	};
}

function replaceOnce( source, search, replacement, label ) {
	const mutated = source.replace( search, replacement );
	assert.notEqual( mutated, source, `Mutation must change ${ label }.` );
	return mutated;
}

function addCurrentGuidance( source, file, guidance ) {
	if ( file === 'readme.txt' ) {
		return replaceOnce(
			source,
			'== Changelog ==',
			`${ guidance }\n\n== Changelog ==`,
			`${ file } current guidance`
		);
	}
	return `${ source }\n${ guidance }\n`;
}

test( 'accepts the independently structured portfolio operating sections', () => {
	assert.equal( typeof verifyPortfolioOwnershipDocuments, 'function' );
	assert.doesNotThrow( () => verifyPortfolioOwnershipDocuments( readDocuments() ) );
} );

test( 'rejects a weakened rendered-About command in every operator document', () => {
	const documents = readDocuments();
	for ( const file of phaseGateFiles ) {
		const mutated = withMutation( documents, file, ( source ) => replaceOnce(
			source,
			'node scripts/verify-about-page-rendered.js --require-local --drafts',
			'node scripts/verify-about-page-rendered.js --drafts',
			`${ file } rendered About command`
		) );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*command`, 'i' )
		);
	}
} );

test( 'rejects local typography or resume commands without their explicit local guard', () => {
	const documents = readDocuments();
	for ( const file of phaseGateFiles ) {
		for ( const command of [ 'verify-typography', 'verify-resume-route' ] ) {
			const mutated = withMutation( documents, file, ( source ) => replaceOnce(
				source,
				`node scripts/${ command }.js --require-local`,
				`node scripts/${ command }.js`,
				`${ file } ${ command } command`
			) );
			assert.throws(
				() => verifyPortfolioOwnershipDocuments( mutated ),
				new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*command`, 'i' )
			);
		}
	}
} );

test( 'rejects a reworded claim that the About adapter rewrites resume actions', () => {
	const documents = readDocuments();
	for ( const file of documentFiles ) {
		const mutated = withMutation( documents, file, ( source ) => addCurrentGuidance(
			source,
			file,
			'The About adapter rewrites the portrait plus every resume action URL.'
		) );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*adapter`, 'i' )
		);
	}
} );

test( 'rejects snapshot promotion before publication', () => {
	const documents = readDocuments();
	const mutations = {
		[ verifiersSkill ]: ( source ) => source.replace(
			'Do not change accepted snapshots before the corresponding database bodies are explicitly approved, published, freshly re-read, and proven equal.',
			'Refresh accepted snapshots before the database bodies are published.'
		),
		'readme.txt': ( source ) => source.replace(
			/Accepted snapshots are not changed before\r?\npublication:[\s\S]*?accepted mirrors\./,
			'Refresh accepted snapshots before publishing the database bodies.'
		),
		'docs/design-system/INDEX.md': ( source ) => source.replace(
			/Do not change accepted\r?\nsnapshots before publication\.[\s\S]*?accepted mirrors\./,
			'Refresh accepted snapshots before publishing the database bodies.'
		),
	};
	for ( const file of phaseGateFiles ) {
		const mutated = withMutation( documents, file, mutations[ file ] );
		assert.notEqual( mutated[ file ], documents[ file ], `Mutation must change ${ file } snapshot guidance.` );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*snapshot`, 'i' )
		);
	}
} );

test( 'anchors operating-section headings to real lines outside prose and fences', () => {
	const documents = readDocuments();
	const skill = documents[ verifiersSkill ];
	const decoy = 'The section named ### WCUS portfolio ownership and phase gate appears below.\n\n```text\n### WCUS portfolio ownership and phase gate\n```\n\n';
	const mutated = { ...documents, [ verifiersSkill ]: `${ decoy }${ skill }` };
	assert.doesNotThrow( () => verifyPortfolioOwnershipDocuments( mutated ) );
} );

test( 'detects contradictory guidance when dotted tokens appear inside the sentence', () => {
	const documents = readDocuments();
	for ( const sentence of [
		'The About adapter in about-resume.php rewrites every resume URL.',
		'A theme deploy of v0.3.58 updates production database-owned bodies.',
		'A theme deploy documented at https://example.test/guide updates production database-owned bodies.',
	] ) {
		const mutated = { ...documents, 'CLAUDE.md': `${ documents[ 'CLAUDE.md' ] }\n${ sentence }\n` };
		assert.throws( () => verifyPortfolioOwnershipDocuments( mutated ), /contradictory/i );
	}
} );

test( 'accepts does-not negation in snapshot publication guidance', () => {
	const documents = readDocuments();
	const mutated = {
		...documents,
		'CLAUDE.md': `${ documents[ 'CLAUDE.md' ] }\nA snapshot refresh does not happen before the production body is published.\n`,
	};
	assert.doesNotThrow( () => verifyPortfolioOwnershipDocuments( mutated ) );
} );

test( 'requires exactly one changelog marker before slicing the current contract', () => {
	assert.equal( sectionBeforeMarker( 'current\n== Changelog ==\nhistory', '== Changelog ==', 'readme.txt' ), 'current\n' );
	assert.throws(
		() => sectionBeforeMarker( 'current only', '== Changelog ==', 'readme.txt' ),
		/readme\.txt.*exactly one.*Changelog/i
	);
	assert.throws(
		() => sectionBeforeMarker( 'current\n== Changelog ==\none\n== Changelog ==\ntwo', '== Changelog ==', 'readme.txt' ),
		/readme\.txt.*exactly one.*Changelog/i
	);
} );

test( 'rejects a theme deploy that claims production page or footer writes', () => {
	const documents = readDocuments();
	for ( const file of documentFiles ) {
		const mutated = withMutation( documents, file, ( source ) => addCurrentGuidance(
			source,
			file,
			'A theme deploy updates the production Digest, About, and database-owned footer bodies.'
		) );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*deploy`, 'i' )
		);
	}
} );

test( 'rejects a prescribed skill unit command that omits either operator regression suite', () => {
	const documents = readDocuments();
	for ( const testFile of [
		'scripts/lib/content-ownership-docs.test.js',
		'scripts/lib/event-copy-retirement-runbook.test.js',
	] ) {
		const mutated = withMutation( documents, verifiersSkill, ( source ) => source.replace( ` ${ testFile }`, '' ) );
		assert.notEqual( mutated[ verifiersSkill ], documents[ verifiersSkill ], `Mutation must remove ${ testFile }.` );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			/SKILL\.md.*shared-library unit-test command/i
		);
	}
} );

test( 'requires CLAUDE.md to keep pointing at the extracted verifiers skill', () => {
	const claude = fs.readFileSync( path.join( themeRoot, 'CLAUDE.md' ), 'utf8' );
	assert.ok(
		claude.includes( verifiersSkill ),
		'CLAUDE.md must name the skill that now owns the verifier command reference.'
	);
	assert.ok(
		fs.existsSync( path.join( themeRoot, verifiersSkill ) ),
		'The verifiers skill must exist in the repository, not only on the author machine.'
	);
} );

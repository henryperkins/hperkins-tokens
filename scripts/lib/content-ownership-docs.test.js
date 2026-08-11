const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	verifyPortfolioOwnershipDocuments,
} = require( '../verify-content-ownership-docs' );

const themeRoot = path.join( __dirname, '..', '..' );
const documentFiles = [
	'CLAUDE.md',
	'readme.txt',
	'docs/design-system/INDEX.md',
];

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

test( 'accepts the independently structured portfolio operating sections', () => {
	assert.equal( typeof verifyPortfolioOwnershipDocuments, 'function' );
	assert.doesNotThrow( () => verifyPortfolioOwnershipDocuments( readDocuments() ) );
} );

test( 'rejects a weakened rendered-About command in every operator document', () => {
	const documents = readDocuments();
	for ( const file of documentFiles ) {
		const mutated = withMutation( documents, file, ( source ) => source.replace(
			'node scripts/verify-about-page-rendered.js --require-local --drafts',
			'node scripts/verify-about-page-rendered.js --drafts'
		) );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*command`, 'i' )
		);
	}
} );

test( 'rejects a reworded claim that the About adapter rewrites resume actions', () => {
	const documents = readDocuments();
	for ( const file of documentFiles ) {
		const mutated = withMutation( documents, file, ( source ) => (
			`${ source }\nThe About adapter rewrites the portrait plus every resume action URL.\n`
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
		'CLAUDE.md': ( source ) => source.replace(
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
	for ( const file of documentFiles ) {
		const mutated = withMutation( documents, file, mutations[ file ] );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*snapshot`, 'i' )
		);
	}
} );

test( 'rejects a theme deploy that claims production page or footer writes', () => {
	const documents = readDocuments();
	for ( const file of documentFiles ) {
		const mutated = withMutation( documents, file, ( source ) => (
			`${ source }\nA theme deploy updates the production Digest, About, and database-owned footer bodies.\n`
		) );
		assert.throws(
			() => verifyPortfolioOwnershipDocuments( mutated ),
			new RegExp( `${ file.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }.*deploy`, 'i' )
		);
	}
} );

const assert = require( 'node:assert/strict' );
const test = require( 'node:test' );
const { deflateRawSync } = require( 'node:zlib' );

const { crc32, openZip } = require( './zip-archive' );

function makeZip( files, { comment = '' } = {} ) {
	const localRecords = [];
	const centralRecords = [];
	let localOffset = 0;

	for ( const [ index, file ] of files.entries() ) {
		const name = Buffer.from( file.name, 'utf8' );
		const contents = Buffer.from( file.contents );
		const method = file.method === 'store' ? 0 : 8;
		const compressed = method === 0 ? contents : deflateRawSync( contents );
		const checksum = file.crc === undefined ? crc32( contents ) : file.crc;
		const flags = file.flags === undefined ? 0x0800 : file.flags;

		const local = Buffer.alloc( 30 + name.length );
		local.writeUInt32LE( 0x04034b50, 0 );
		local.writeUInt16LE( 20, 4 );
		local.writeUInt16LE( flags, 6 );
		local.writeUInt16LE( method, 8 );
		local.writeUInt32LE( checksum, 14 );
		local.writeUInt32LE( compressed.length, 18 );
		local.writeUInt32LE( contents.length, 22 );
		local.writeUInt16LE( name.length, 26 );
		name.copy( local, 30 );
		localRecords.push( local, compressed );

		const central = Buffer.alloc( 46 + name.length );
		central.writeUInt32LE( 0x02014b50, 0 );
		central.writeUInt16LE( 20, 4 );
		central.writeUInt16LE( 20, 6 );
		central.writeUInt16LE( flags, 8 );
		central.writeUInt16LE( method, 10 );
		central.writeUInt32LE( checksum, 16 );
		central.writeUInt32LE( compressed.length, 20 );
		central.writeUInt32LE( contents.length, 24 );
		central.writeUInt16LE( name.length, 28 );
		central.writeUInt32LE( localOffset, 42 );
		name.copy( central, 46 );
		centralRecords.push( central );

		localOffset += local.length + compressed.length;
		assert.equal( index, centralRecords.length - 1 );
	}

	const centralDirectory = Buffer.concat( centralRecords );
	const zipComment = Buffer.from( comment, 'utf8' );
	const eocd = Buffer.alloc( 22 + zipComment.length );
	eocd.writeUInt32LE( 0x06054b50, 0 );
	eocd.writeUInt16LE( files.length, 8 );
	eocd.writeUInt16LE( files.length, 10 );
	eocd.writeUInt32LE( centralDirectory.length, 12 );
	eocd.writeUInt32LE( localOffset, 16 );
	eocd.writeUInt16LE( zipComment.length, 20 );
	zipComment.copy( eocd, 22 );

	return Buffer.concat( [ ...localRecords, centralDirectory, eocd ] );
}

test( 'reads stored and deflated entries from a ZIP with an EOCD comment', () => {
	const archive = openZip( makeZip( [
		{ name: 'stored.txt', contents: 'stored payload', method: 'store' },
		{ name: 'nested/deflated.xml', contents: '<root>compressed payload</root>' },
	], { comment: 'fixture' } ) );

	assert.deepEqual( archive.list(), [ 'stored.txt', 'nested/deflated.xml' ] );
	assert.equal( archive.has( 'stored.txt' ), true );
	assert.equal( archive.has( 'missing.txt' ), false );
	assert.equal( archive.text( 'stored.txt' ), 'stored payload' );
	assert.equal( archive.text( 'nested/deflated.xml' ), '<root>compressed payload</root>' );
	assert.throws( () => archive.read( 'missing.txt' ), /missing ZIP entry/ );
} );

test( 'rejects duplicate entry names', () => {
	const fixture = makeZip( [
		{ name: 'duplicate.txt', contents: 'first' },
		{ name: 'duplicate.txt', contents: 'second' },
	] );

	assert.throws( () => openZip( fixture ), /duplicate ZIP entry/ );
} );

test( 'rejects encrypted entries and corrupt payloads', () => {
	const encrypted = makeZip( [
		{ name: 'secret.txt', contents: 'secret', flags: 0x0801 },
	] );
	assert.throws( () => openZip( encrypted ).read( 'secret.txt' ), /encrypted ZIP entry/ );

	const corrupt = makeZip( [
		{ name: 'bad.txt', contents: 'not the declared checksum', crc: 0 },
	] );
	assert.throws( () => openZip( corrupt ).read( 'bad.txt' ), /CRC32 mismatch/ );
} );

test( 'rejects malformed archives and unsupported compression methods', () => {
	assert.throws( () => openZip( Buffer.from( 'not a zip' ) ), /end-of-central-directory/ );

	const fixture = makeZip( [ { name: 'method.txt', contents: 'payload' } ] );
	const centralOffset = fixture.indexOf( Buffer.from( [ 0x50, 0x4b, 0x01, 0x02 ] ) );
	fixture.writeUInt16LE( 99, 8 );
	fixture.writeUInt16LE( 99, centralOffset + 10 );
	assert.throws( () => openZip( fixture ).read( 'method.txt' ), /compression method 99/ );
} );

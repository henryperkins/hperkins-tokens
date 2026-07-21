const { readFileSync } = require( 'node:fs' );
const { inflateRawSync } = require( 'node:zlib' );

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const MAX_ZIP_COMMENT = 0xffff;

const crcTable = new Uint32Array( 256 );
for ( let index = 0; index < crcTable.length; index += 1 ) {
	let value = index;
	for ( let bit = 0; bit < 8; bit += 1 ) {
		value = ( value & 1 ) === 1 ? 0xedb88320 ^ ( value >>> 1 ) : value >>> 1;
	}
	crcTable[ index ] = value >>> 0;
}

function crc32( value ) {
	const buffer = Buffer.isBuffer( value ) ? value : Buffer.from( value );
	let checksum = 0xffffffff;
	for ( const byte of buffer ) {
		checksum = crcTable[ ( checksum ^ byte ) & 0xff ] ^ ( checksum >>> 8 );
	}
	return ( checksum ^ 0xffffffff ) >>> 0;
}

function assertRange( buffer, offset, length, label ) {
	if ( offset < 0 || length < 0 || offset + length > buffer.length ) {
		throw new Error( `${ label } extends beyond the ZIP file.` );
	}
}

function findEocd( buffer ) {
	const firstCandidate = buffer.length - 22;
	const lastCandidate = Math.max( 0, firstCandidate - MAX_ZIP_COMMENT );
	for ( let offset = firstCandidate; offset >= lastCandidate; offset -= 1 ) {
		if ( buffer.readUInt32LE( offset ) !== EOCD_SIGNATURE ) {
			continue;
		}
		const commentLength = buffer.readUInt16LE( offset + 20 );
		if ( offset + 22 + commentLength === buffer.length ) {
			return offset;
		}
	}
	throw new Error( 'ZIP end-of-central-directory record is missing.' );
}

function decodeName( buffer, utf8 ) {
	return buffer.toString( utf8 ? 'utf8' : 'latin1' );
}

class ZipArchive {
	constructor( source ) {
		this.buffer = Buffer.isBuffer( source ) ? source : readFileSync( source );
		this.entryMap = new Map();
		this.entryNames = [];
		this.parseCentralDirectory();
	}

	parseCentralDirectory() {
		const eocdOffset = findEocd( this.buffer );
		const diskNumber = this.buffer.readUInt16LE( eocdOffset + 4 );
		const centralDisk = this.buffer.readUInt16LE( eocdOffset + 6 );
		const diskEntryCount = this.buffer.readUInt16LE( eocdOffset + 8 );
		const totalEntryCount = this.buffer.readUInt16LE( eocdOffset + 10 );
		const centralSize = this.buffer.readUInt32LE( eocdOffset + 12 );
		const centralOffset = this.buffer.readUInt32LE( eocdOffset + 16 );

		if ( diskNumber !== 0 || centralDisk !== 0 || diskEntryCount !== totalEntryCount ) {
			throw new Error( 'Multi-disk ZIP archives are unsupported.' );
		}
		if (
			totalEntryCount === 0xffff ||
			centralSize === 0xffffffff ||
			centralOffset === 0xffffffff
		) {
			throw new Error( 'ZIP64 archives are unsupported.' );
		}
		assertRange( this.buffer, centralOffset, centralSize, 'ZIP central directory' );
		if ( centralOffset + centralSize > eocdOffset ) {
			throw new Error( 'ZIP central directory overlaps its end record.' );
		}

		let offset = centralOffset;
		for ( let index = 0; index < totalEntryCount; index += 1 ) {
			assertRange( this.buffer, offset, 46, 'ZIP central-directory entry' );
			if ( this.buffer.readUInt32LE( offset ) !== CENTRAL_SIGNATURE ) {
				throw new Error( `ZIP central-directory entry ${ index + 1 } has an invalid signature.` );
			}

			const flags = this.buffer.readUInt16LE( offset + 8 );
			const method = this.buffer.readUInt16LE( offset + 10 );
			const checksum = this.buffer.readUInt32LE( offset + 16 );
			const compressedSize = this.buffer.readUInt32LE( offset + 20 );
			const uncompressedSize = this.buffer.readUInt32LE( offset + 24 );
			const nameLength = this.buffer.readUInt16LE( offset + 28 );
			const extraLength = this.buffer.readUInt16LE( offset + 30 );
			const commentLength = this.buffer.readUInt16LE( offset + 32 );
			const localOffset = this.buffer.readUInt32LE( offset + 42 );
			const entryLength = 46 + nameLength + extraLength + commentLength;
			assertRange( this.buffer, offset, entryLength, 'ZIP central-directory entry' );

			if (
				compressedSize === 0xffffffff ||
				uncompressedSize === 0xffffffff ||
				localOffset === 0xffffffff
			) {
				throw new Error( 'ZIP64 entries are unsupported.' );
			}

			const name = decodeName(
				this.buffer.subarray( offset + 46, offset + 46 + nameLength ),
				( flags & 0x0800 ) !== 0
			);
			if ( ! name || name.includes( '\0' ) ) {
				throw new Error( 'ZIP entry has an invalid name.' );
			}
			if ( this.entryMap.has( name ) ) {
				throw new Error( `Found duplicate ZIP entry: ${ name }.` );
			}

			const entry = {
				name,
				flags,
				method,
				checksum,
				compressedSize,
				uncompressedSize,
				localOffset,
			};
			this.entryNames.push( name );
			this.entryMap.set( name, entry );
			offset += entryLength;
		}

		if ( offset !== centralOffset + centralSize ) {
			throw new Error( 'ZIP central-directory size does not match its entries.' );
		}
	}

	list() {
		return [ ...this.entryNames ];
	}

	has( name ) {
		return this.entryMap.has( name );
	}

	read( name ) {
		const entry = this.entryMap.get( name );
		if ( ! entry ) {
			throw new Error( `Cannot read missing ZIP entry: ${ name }.` );
		}
		if ( ( entry.flags & 0x0001 ) !== 0 ) {
			throw new Error( `Cannot read encrypted ZIP entry: ${ name }.` );
		}

		assertRange( this.buffer, entry.localOffset, 30, `Local ZIP entry ${ name }` );
		if ( this.buffer.readUInt32LE( entry.localOffset ) !== LOCAL_SIGNATURE ) {
			throw new Error( `Local ZIP entry ${ name } has an invalid signature.` );
		}
		const localFlags = this.buffer.readUInt16LE( entry.localOffset + 6 );
		const localMethod = this.buffer.readUInt16LE( entry.localOffset + 8 );
		const nameLength = this.buffer.readUInt16LE( entry.localOffset + 26 );
		const extraLength = this.buffer.readUInt16LE( entry.localOffset + 28 );
		if ( localMethod !== entry.method || ( localFlags & 0x0001 ) !== 0 ) {
			throw new Error( `Local ZIP entry ${ name } disagrees with its central record.` );
		}

		const dataOffset = entry.localOffset + 30 + nameLength + extraLength;
		assertRange( this.buffer, dataOffset, entry.compressedSize, `ZIP payload ${ name }` );
		const compressed = this.buffer.subarray( dataOffset, dataOffset + entry.compressedSize );
		let contents;
		if ( entry.method === 0 ) {
			contents = Buffer.from( compressed );
		} else if ( entry.method === 8 ) {
			contents = inflateRawSync( compressed );
		} else {
			throw new Error( `Unsupported ZIP compression method ${ entry.method } for ${ name }.` );
		}

		if ( contents.length !== entry.uncompressedSize ) {
			throw new Error(
				`Uncompressed size mismatch for ${ name }: expected ${ entry.uncompressedSize }, got ${ contents.length }.`
			);
		}
		const actualChecksum = crc32( contents );
		if ( actualChecksum !== entry.checksum ) {
			throw new Error(
				`CRC32 mismatch for ${ name }: expected ${ entry.checksum.toString( 16 ) }, got ${ actualChecksum.toString( 16 ) }.`
			);
		}
		return contents;
	}

	text( name, encoding = 'utf8' ) {
		return this.read( name ).toString( encoding );
	}
}

function openZip( source ) {
	return new ZipArchive( source );
}

module.exports = {
	ZipArchive,
	crc32,
	openZip,
};

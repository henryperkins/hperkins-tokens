const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const vm = require( 'node:vm' );

const script = fs.readFileSync( path.join( __dirname, '../../assets/js/router-scroll.js' ), 'utf8' );

function browser( hash = '' ) {
	const listeners = { window: {}, document: {} };
	const calls = { scroll: [], focus: [], top: [] };
	const outer = { tagName: 'DETAILS', open: false, parentElement: null };
	const inner = { tagName: 'DETAILS', open: false, parentElement: outer };
	const target = {
		id: 'resume-keyword-bank', tagName: 'H3', parentElement: inner,
		hasAttribute: () => false, setAttribute: () => {},
		focus: () => calls.focus.push( target.id ),
		scrollIntoView: () => calls.scroll.push( [ outer.open, inner.open ] ),
	};
	const location = new URL( 'https://example.test/job-placement-digest/' + hash );
	const on = ( scope ) => ( name, fn ) => {
		( listeners[ scope ][ name ] ||= [] ).push( fn );
	};
	const document = {
		readyState: 'complete',
		getElementById: ( id ) => id === target.id ? target : null,
		addEventListener: on( 'document' ),
	};
	const window = {
		location,
		addEventListener: on( 'window' ),
		matchMedia: () => ( { matches: true } ),
		requestAnimationFrame: ( fn ) => fn(),
		setTimeout: ( fn ) => fn(),
		scrollTo: ( ...args ) => calls.top.push( args ),
		history: {
			pushState( _state, _title, href ) {
				const next = new URL( href, location.href );
				location.href = next.href;
			},
		},
	};
	vm.runInNewContext( script, { window, document, URL } );
	const emit = ( scope, name, event = {} ) =>
		( listeners[ scope ][ name ] || [] ).forEach( ( fn ) => fn( event ) );
	return { outer, inner, target, calls, window, emit };
}

test( 'an initial deep link opens every disclosure ancestor before scrolling without stealing focus', () => {
	const page = browser( '#resume-keyword-bank' );
	assert.equal( page.outer.open, true );
	assert.equal( page.inner.open, true );
	assert.ok( page.calls.scroll.length > 0 );
	assert.ok( page.calls.scroll.every( ( state ) => state.every( Boolean ) ) );
	assert.deepEqual( page.calls.focus, [] );
} );

test( 'same-page fragment changes reveal the target and give it focus', () => {
	const page = browser();
	page.window.location.hash = '#resume-keyword-bank';
	page.emit( 'window', 'hashchange' );
	assert.equal( page.inner.open, true );
	assert.ok( page.calls.focus.includes( 'resume-keyword-bank' ) );
	assert.ok( page.calls.scroll.length > 0 );
} );

test( 'router pushes reveal collapsed research before scrolling', () => {
	const page = browser();
	page.window.history.pushState( {}, '', '#resume-keyword-bank' );
	assert.equal( page.outer.open, true );
	assert.ok( page.calls.scroll.every( ( state ) => state.every( Boolean ) ) );
} );

test( 'history traversal reopens research but leaves plain-page restoration alone', () => {
	const page = browser( '#resume-keyword-bank' );
	page.inner.open = false;
	page.outer.open = false;
	page.calls.scroll = [];
	page.emit( 'window', 'popstate' );
	assert.equal( page.inner.open, true );
	assert.equal( page.calls.scroll.length, 1 );
	page.window.location.hash = '';
	page.calls.scroll = [];
	page.emit( 'window', 'popstate' );
	assert.deepEqual( page.calls.scroll, [] );
	assert.deepEqual( page.calls.top, [] );
} );

test( 'activating the same hash after closing its disclosure reveals it again', () => {
	const page = browser( '#resume-keyword-bank' );
	page.inner.open = false;
	page.outer.open = false;
	const link = {
		href: page.window.location.href,
		hasAttribute: () => false,
		getAttribute: ( name ) => name === 'href' ? '#resume-keyword-bank' : null,
	};
	page.emit( 'document', 'click', { button: 0, target: { closest: () => link } } );
	assert.equal( page.inner.open, true );
} );

test( 'unknown and malformed fragments are harmless and do not open research', () => {
	for ( const hash of [ '#missing', '#%E0%A4%A' ] ) {
		const page = browser( hash );
		page.emit( 'window', 'hashchange' );
		assert.equal( page.outer.open, false );
		assert.deepEqual( page.calls.focus, [] );
	}
} );

test( 'modified clicks do not change the current page disclosure', () => {
	const page = browser();
	const link = { href: 'https://example.test/job-placement-digest/#resume-keyword-bank' };
	page.emit( 'document', 'click', { button: 0, ctrlKey: true, target: { closest: () => link } } );
	assert.equal( page.outer.open, false );
} );

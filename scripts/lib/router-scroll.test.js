const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const vm = require( 'node:vm' );

const script = fs.readFileSync( path.join( __dirname, '../../assets/js/router-scroll.js' ), 'utf8' );

function browser( hash = '' ) {
	const listeners = { window: {}, document: {} };
	const calls = { scroll: [], focus: [], top: [] };
	const wrapper = { id: 'appendix', tagName: 'DIV', parentElement: null };
	const outer = { id: 'research-notes', tagName: 'DETAILS', open: false, parentElement: wrapper };
	const inner = { id: 'nested-research', tagName: 'DETAILS', open: false, parentElement: outer };
	const target = {
		id: 'resume-keyword-bank', tagName: 'H3', parentElement: inner,
		hasAttribute: () => false, setAttribute: () => {},
		focus: () => calls.focus.push( target.id ),
		scrollIntoView: () => calls.scroll.push( [ outer.open, inner.open ] ),
	};
	for ( const node of [ wrapper, outer, inner ] ) {
		node.hasAttribute = () => false;
		node.setAttribute = () => {};
		node.focus = () => calls.focus.push( node.id );
		node.scrollIntoView = () => calls.scroll.push( [ outer.open, inner.open ] );
	}
	const location = new URL( 'https://example.test/job-placement-digest/' + hash );
	const on = ( scope ) => ( name, fn ) => {
		( listeners[ scope ][ name ] ||= [] ).push( fn );
	};
	const document = {
		readyState: 'complete',
		getElementById: ( id ) => [ wrapper, outer, inner, target ].find( ( node ) => node.id === id ) || null,
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

test( 'initial links to a disclosure or its wrapper keep that disclosure closed', () => {
	for ( const hash of [ '#research-notes', '#appendix' ] ) {
		const page = browser( hash );
		assert.equal( page.outer.open, false, hash );
		assert.equal( page.inner.open, false, hash );
		assert.deepEqual( page.calls.scroll, [] );
		assert.deepEqual( page.calls.focus, [] );
	}
} );

test( 'a nested disclosure target opens its hidden ancestor but remains closed itself', () => {
	const page = browser( '#nested-research' );
	assert.equal( page.outer.open, true );
	assert.equal( page.inner.open, false );
	assert.deepEqual( page.calls.scroll, [ [ true, false ] ] );
	assert.deepEqual( page.calls.focus, [] );
} );

for ( const navigation of [ 'hashchange', 'router push', 'history traversal', 'same-hash click' ] ) {
	test( navigation + ' to a disclosure keeps it closed', () => {
		const page = browser();
		if ( navigation === 'router push' ) {
			page.window.history.pushState( {}, '', '#research-notes' );
		} else {
			page.window.location.hash = '#research-notes';
			if ( navigation === 'same-hash click' ) {
				const link = { href: page.window.location.href, hasAttribute: () => false };
				page.emit( 'document', 'click', { button: 0, target: { closest: () => link } } );
			} else {
				page.emit( 'window', navigation === 'history traversal' ? 'popstate' : 'hashchange' );
			}
		}
		assert.equal( page.outer.open, false );
		assert.equal( page.inner.open, false );
		if ( navigation === 'router push' ) {
			assert.equal( page.calls.scroll.length, 3 );
			assert.ok( page.calls.focus.every( ( id ) => id === 'research-notes' ) );
		} else if ( navigation === 'hashchange' ) {
			assert.deepEqual( page.calls.focus, [ 'research-notes' ] );
		} else {
			assert.deepEqual( page.calls.focus, [] );
		}
	} );
}

test( 'plain route pushes and stale fragments reset the viewport without opening disclosures', () => {
	for ( const href of [ '/about/', '/about/#missing' ] ) {
		const page = browser();
		page.window.history.pushState( {}, '', href );
		assert.deepEqual( page.calls.top, [ [ 0, 0 ], [ 0, 0 ], [ 0, 0 ] ] );
		assert.deepEqual( page.calls.focus, [] );
		assert.equal( page.outer.open, false );
	}
	const page = browser();
	page.window.history.pushState( {}, '', '/job-placement-digest/' );
	assert.deepEqual( page.calls.top, [] );
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

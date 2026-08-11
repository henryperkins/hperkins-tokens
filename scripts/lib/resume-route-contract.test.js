const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const { validateRedirectChain } = require( '../verify-resume-route' );

test( 'accepts exactly one theme-owned 302 to the same-origin PDF', () => {
	const result = validateRedirectChain( [
		{
			requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus',
			status: 302,
			location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123',
			redirectBy: 'hperkins-tokens',
			contentType: 'text/html; charset=UTF-8',
		},
		{
			requestUrl: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123',
			status: 200,
			location: null,
			redirectBy: null,
			contentType: 'application/pdf',
		},
	], 'https://hperkins.blog/one-page-resume/?utm_source=wcus', 'https://hperkins.blog' );
	assert.equal( result.themeRedirects, 1 );
	assert.equal( result.platformPreflights, 0 );
} );

test( 'rejects a loop, a permanent redirect, a foreign origin, or inbound query propagation', () => {
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/', status: 302, location: 'https://hperkins.blog/one-page-resume/', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /loop|PDF/ );
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/', status: 301, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /302/ );
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/', status: 302, location: 'https://example.com/resume.pdf', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /origin/ );
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus', status: 302, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?utm_source=wcus', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/?utm_source=wcus', 'https://hperkins.blog' ), /query|v/ );
} );

test( 'classifies one WordPress cache-key preflight for diagnostics but not strict acceptance', () => {
	const steps = [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/', status: 307, location: 'https://hperkins.blog/one-page-resume/?v=0b3b97fa6688', redirectBy: 'WordPress', contentType: 'text/html' },
		{ requestUrl: 'https://hperkins.blog/one-page-resume/?v=0b3b97fa6688', status: 302, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123', status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
	];
	const diagnostic = validateRedirectChain( steps, steps[0].requestUrl, 'https://hperkins.blog', { strict: false } );
	assert.equal( diagnostic.platformPreflights, 1 );
	assert.throws( () => validateRedirectChain( steps, steps[0].requestUrl, 'https://hperkins.blog', { strict: true } ), /preflight|one redirect/ );
} );

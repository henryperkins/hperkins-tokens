const assert = require( 'node:assert/strict' );
const test = require( 'node:test' );

const placementArtifacts = require( '../verify-placement-artifacts' );

const columns = [
	'Job title',
	'Company',
	'Canonical posting URL',
	'Last checked',
	'Current state',
	'Screen verdict',
	'Concise reasoning',
];

const workbookRows = [
	columns,
	[ 'Live role', 'Company A', 'https://example.com/live', '2026-07-20', 'Live', 'Pass', 'Exact live reasoning.' ],
	[ 'Pending role', 'Company B', '', '', 'Verification pending', 'Needs verification', 'Exact pending reasoning.' ],
	[ 'Historical role', 'Company C', '', '2026-07-18', 'Delisted', 'Pass — historical', 'Exact historical reasoning.' ],
	[ 'Replacement role', 'Company D', '', '2026-07-20', 'Replaced', 'Needs new screen', 'Exact replacement reasoning.' ],
	[ 'Failed role', 'Company E', '', '', 'Live when screened', 'Fail — overturned', 'Exact failure reasoning.' ],
	[ 'Expired role', 'Company F', 'https://example.com/expired', '2026-07-19', 'Expired — confirmed 2026-07-19', 'Not screened — expired', 'Exact expired reasoning.' ],
	[ 'Second failure', 'Company G', '', '2026-07-19', 'Live when screened', 'Fail', 'Exact second failure reasoning.' ],
];

// What the page renders: six columns, because Current state and Screen verdict
// are shown as one State cell. The workbook stays seven columns; parity
// projects it onto this shape rather than the reverse.
const renderedColumns = [ 'Job title', 'Company', 'Posting', 'Last checked', 'State', 'Reasoning' ];

// The hero chips are derived counts, so the fixture has to carry the keyword
// ledger they count and the scope bar they live in.
const matchingAppendix = `
<section class="hp-page-hero hp-method-hero">
	<div class="wp-block-group hp-proof-bar hp-method-scope">
		<p class="hp-chip is-status-merged">3 résumé terms audited against five postings</p>
		<p class="hp-chip is-status-review">7 market rows screened, 5 with a dated check</p>
		<p class="hp-chip is-status-pending">2 rows failed by hand, 1 overturning an AI pass</p>
	</div>
</section>
<section id="resume-keyword-bank">
	<figure class="wp-block-table hp-keyword-table"><table>
		<thead><tr><th>Keyword</th><th>Posting signal</th><th>Evidence boundary</th></tr></thead>
		<tbody>
			<tr><th>First term <strong>Demonstrated</strong></th><td>A required · 1/5</td><td>An artifact</td></tr>
			<tr><th>Second term <strong>Partial</strong></th><td>W desirable · 1/5</td><td>An analogue</td></tr>
			<tr><th>Third term <strong>Gap</strong></th><td>O required · 1/5</td><td>No artifact</td></tr>
		</tbody>
	</table></figure>
</section>
<section id="screening-funnel">
	<figure class="wp-block-table hp-market-table"><table>
		<thead><tr>${ renderedColumns.map( ( column ) => `<th>${ column }</th>` ).join( '' ) }</tr></thead>
		<tbody>
			<tr><th>Live role</th><td>Company A</td><td><a href="https://example.com/live">Open posting</a></td><td>2026-07-20</td><td>Live · Pass</td><td>Exact live reasoning.</td></tr>
			<tr><th>Pending role</th><td>Company B</td><td></td><td></td><td>Verification pending · Needs verification</td><td>Exact pending reasoning.</td></tr>
			<tr><th>Historical role</th><td>Company C</td><td></td><td>2026-07-18</td><td>Delisted · Pass — historical</td><td>Exact historical reasoning.</td></tr>
			<tr><th>Replacement role</th><td>Company D</td><td></td><td>2026-07-20</td><td>Replaced · Needs new screen</td><td>Exact replacement reasoning.</td></tr>
			<tr><th>Failed role</th><td>Company E</td><td></td><td></td><td>Live when screened · Fail — overturned</td><td>Exact failure reasoning.</td></tr>
			<tr><th>Expired role</th><td>Company F</td><td><a href="https://example.com/expired">Expired posting</a></td><td>2026-07-19</td><td>Expired — confirmed 2026-07-19 · Not screened — expired</td><td>Exact expired reasoning.</td></tr>
			<tr><th>Second failure</th><td>Company G</td><td></td><td>2026-07-19</td><td>Live when screened · Fail</td><td>Exact second failure reasoning.</td></tr>
		</tbody>
	</table></figure>
	<p class="hp-market-date-summary">Last checked distribution: 2026-07-20 — 2 rows; 2026-07-19 — 2 rows; 2026-07-18 — 1 row; not recorded — 2 rows.</p>
</section>`;

test( 'appendix reproduces every workbook value through the six-column projection', () => {
	assert.equal(
		typeof placementArtifacts.verifyAppendixWorkbookParity,
		'function',
		'verifyAppendixWorkbookParity must be exported by the artifact verifier'
	);
	assert.doesNotThrow( () =>
		placementArtifacts.verifyAppendixWorkbookParity( workbookRows, matchingAppendix )
	);
} );

test( 'appendix parity rejects a semantically similar rewrite', () => {
	assert.throws(
		() => placementArtifacts.verifyAppendixWorkbookParity(
			workbookRows,
			matchingAppendix.replace( 'Exact live reasoning.', 'Similar live reasoning.' )
		),
		/Reasoning.*Exact live reasoning.*Similar live reasoning/s
	);
} );

test( 'appendix parity rejects a State cell that drops half the merge', () => {
	assert.throws(
		() => placementArtifacts.verifyAppendixWorkbookParity(
			workbookRows,
			matchingAppendix.replace( 'Delisted · Pass — historical', 'Delisted' )
		),
		/State differs.*Delisted · Pass — historical/s
	);
} );

test( 'appendix parity rejects the retired seven-column shape', () => {
	assert.throws(
		() => placementArtifacts.verifyAppendixWorkbookParity(
			workbookRows,
			matchingAppendix.replace( '<td>Live · Pass</td>', '<td>Live</td><td>Pass</td>' )
		),
		/has 7 cells; expected 6/
	);
} );

test( 'appendix parity rejects a derived last-checked summary that has drifted', () => {
	assert.throws(
		() => placementArtifacts.verifyAppendixWorkbookParity(
			workbookRows,
			matchingAppendix.replace( 'not recorded — 2 rows', 'not recorded — 1 row' )
		),
		/Last checked summary differs/
	);
} );

test( 'appendix parity rejects a hero chip whose count has drifted from the workbook', () => {
	assert.throws(
		() => placementArtifacts.verifyAppendixWorkbookParity(
			workbookRows,
			matchingAppendix.replace( '7 market rows screened, 5 with a dated check', '7 market rows screened, every state dated' )
		),
		/scope chip 2 differs/
	);
} );

test( 'appendix parity rejects a hero chip that overstates the machine overturns', () => {
	assert.throws(
		() => placementArtifacts.verifyAppendixWorkbookParity(
			workbookRows,
			matchingAppendix.replace( '2 rows failed by hand, 1 overturning an AI pass', '2 machine verdicts overturned by hand' )
		),
		/scope chip 3 differs/
	);
} );

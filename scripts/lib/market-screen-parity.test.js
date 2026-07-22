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
];

const matchingAppendix = `
<section id="screening-funnel">
	<figure class="wp-block-table hp-state-table"><table>
		<thead><tr><th>Measure</th><th>Count</th><th>Workbook rule</th></tr></thead>
		<tbody>
			<tr><th>Rows in public ledger</th><td>6</td><td>Every row after the seven-column header</td></tr>
			<tr><th>Current live passes</th><td>1</td><td>Current state “Live”; verdict “Pass” or “Pass — manual review”</td></tr>
			<tr><th>Verification unresolved</th><td>1</td><td>Current state “Verification pending” or “Unverified”; verdict “Needs verification”</td></tr>
			<tr><th>Historical, not-current passes</th><td>1</td><td>Screen verdict “Pass — historical”</td></tr>
			<tr><th>Replaced postings</th><td>1</td><td>Current state “Replaced”; verdict “Needs new screen”</td></tr>
			<tr><th>Expired before screening</th><td>1</td><td>Current state begins “Expired”; verdict “Not screened — expired”</td></tr>
			<tr><th>Human failures</th><td>1</td><td>Screen verdict “Fail” or “Fail — overturned”</td></tr>
		</tbody>
	</table></figure>
	<p class="hp-market-date-summary">Last checked distribution: 2026-07-20 — 2 rows; 2026-07-19 — 1 row; 2026-07-18 — 1 row; not recorded — 2 rows.</p>
</section>
<section id="live-states">
	<figure class="wp-block-table hp-market-table"><table>
		<thead><tr>${ columns.map( ( column ) => `<th>${ column }</th>` ).join( '' ) }</tr></thead>
		<tbody>
			<tr><th>Live role</th><td>Company A</td><td><a href="https://example.com/live">Open posting</a></td><td>2026-07-20</td><td>Live</td><td>Pass</td><td>Exact live reasoning.</td></tr>
			<tr><th>Pending role</th><td>Company B</td><td></td><td></td><td>Verification pending</td><td>Needs verification</td><td>Exact pending reasoning.</td></tr>
			<tr><th>Historical role</th><td>Company C</td><td></td><td>2026-07-18</td><td>Delisted</td><td>Pass — historical</td><td>Exact historical reasoning.</td></tr>
			<tr><th>Replacement role</th><td>Company D</td><td></td><td>2026-07-20</td><td>Replaced</td><td>Needs new screen</td><td>Exact replacement reasoning.</td></tr>
			<tr><th>Failed role</th><td>Company E</td><td></td><td></td><td>Live when screened</td><td>Fail — overturned</td><td>Exact failure reasoning.</td></tr>
			<tr><th>Expired role</th><td>Company F</td><td><a href="https://example.com/expired">Open posting</a></td><td>2026-07-19</td><td>Expired — confirmed 2026-07-19</td><td>Not screened — expired</td><td>Exact expired reasoning.</td></tr>
		</tbody>
	</table></figure>
</section>`;

test( 'appendix reproduces every workbook value and its derived funnel exactly', () => {
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
	assert.equal( typeof placementArtifacts.verifyAppendixWorkbookParity, 'function' );
	assert.throws(
		() => placementArtifacts.verifyAppendixWorkbookParity(
			workbookRows,
			matchingAppendix.replace( 'Exact live reasoning.', 'Similar live reasoning.' )
		),
		/Concise reasoning.*Exact live reasoning.*Similar live reasoning/s
	);
} );

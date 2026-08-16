const DIGEST_COMPACT_CONTEXT = '@media (min-width: 601px) and (max-width: 1023px)';
const DIGEST_WIDE_CONTEXT = '@media (min-width: 782px)';
const DIGEST_NARROW_CONTEXT = '@media (max-width: 781px)';
const DIGEST_PHONE_CONTEXT = '@media (max-width: 600px)';
const DIGEST_STACK_CONTEXT = '@media (max-width: 359px)';

const DIGEST_ACCEPTED_ACTION_CONTRACTS = [
	{
		selector: '.hp-wcus-callout__actions',
		declarations: { 'grid-template-columns': 'repeat(3, minmax(0, 1fr))' },
	},
	{
		selector: '.hp-wcus-callout__actions',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'grid-template-columns': 'minmax(0, 1fr)' },
	},
];

const DIGEST_OPENING_CONTRACTS = [
	{
		selector: '.hp-digest__hero.hp-page-hero',
		declarations: { 'margin-block-start': '0' },
	},
	{
		selector: '.hp-wcus-callout--event-first + .hp-digest__hero',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-wcus-callout--event-first',
		declarations: {
			'box-sizing': 'border-box',
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
			'align-items': 'stretch',
			'max-inline-size': 'var(--wp--style--global--wide-size, 72rem)',
			'margin-block-start': '0',
			padding: 'var(--wp--preset--spacing--6)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
			background: 'var(--wp--custom--surface--raised)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			gap: 'var(--wp--preset--spacing--4)',
			width: '100%',
			'align-self': 'stretch',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__title',
		declarations: {
			'max-inline-size': '18ch',
			margin: 'var(--wp--preset--spacing--4) 0 0',
			'font-family': 'var(--wp--preset--font-family--display)',
			'font-size': 'var(--wp--preset--font-size--2-xl)',
			'line-height': 'var(--wp--custom--leading--snug)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_WIDE_CONTEXT,
		declarations: {
			'grid-template-columns': 'minmax(0, 1.35fr) minmax(16rem, 0.65fr)',
			'column-gap': 'var(--wp--preset--spacing--6)',
			'row-gap': '0',
		},
	},
];

const DIGEST_COMPACT_CONTRACTS = [
	{
		selector: '.hp-digest-template',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { 'padding-block-start': 'var(--wp--preset--spacing--5) !important' },
	},
	{
		selector: '.hp-digest__hero h1',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: {
			'max-inline-size': 'none',
			'font-size': 'var(--wp--preset--font-size--3-xl)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: {
			'row-gap': 'var(--wp--preset--spacing--4)',
			padding: 'var(--wp--preset--spacing--4)',
		},
	},
];

const DIGEST_LOWER_CONTRACTS = [
	{
		selector: '.hp-fit-ledger',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-incident-card',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-evidence-ledger',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	// The kicker is the smallest text on the page. 2xs is exactly 12px — the
	// site-wide floor — so pinning the token here stops a later "just a bit
	// smaller" edit from quietly breaching it.
	{
		selector: '.hp-digest-kicker',
		declarations: {
			'font-size': 'var(--wp--preset--font-size--2-xs)',
			'text-transform': 'uppercase',
			color: 'var(--wp--custom--text--faint)',
		},
	},
	// The named gap is a review-status entry on the fixed evidence rule width.
	// State is rule colour + surface tint + the word "gap"; never colour alone.
	{
		selector: '.hp-digest-gap',
		declarations: {
			'border-inline-start': 'var(--hp-rule-evidence) solid var(--wp--custom--status--review)',
			background: 'var(--wp--custom--surface--review)',
			color: 'var(--wp--custom--on--review)',
		},
	},
	{
		selector: '.hp-incident-card .hp-artifacts.wp-block-columns',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
		},
	},
	{
		selector: '.hp-evidence-table tbody th[data-state="released"]',
		declarations: { 'border-inline-start-color': 'var(--wp--custom--status--done)' },
	},
	// A filtered-out row must actually leave the flow at every width. The narrow
	// layout re-declares rows as display:block, which ties with the UA sheet's
	// [hidden] rule, so this one carries the extra class to win outright.
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr[hidden]',
		declarations: { display: 'none' },
	},
	{
		selector: '.hp-evidence-filter__button',
		declarations: {
			'min-block-size': '44px',
			'font-size': 'var(--wp--preset--font-size--2-xs)',
		},
	},
	{
		selector: '.hp-incident-card .hp-artifacts.wp-block-columns',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'grid-template-columns': 'minmax(0, 1fr)' },
	},
	{
		selector: '.hp-digest-section',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--7)' },
	},
	{
		selector: '.hp-fit-ledger',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-incident-card',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-evidence-ledger',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-proof-cards > .hp-proof-card.is-style-hperkins-proof-card',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.hp-incident-card',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			display: 'grid',
			'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
			gap: 'var(--wp--preset--spacing--2) var(--wp--preset--spacing--4)',
		},
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody td:nth-of-type(1)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'grid-column': '2',
			'margin-block-start': '0',
			'text-align': 'end',
		},
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody td:nth-of-type(2)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'grid-column': '1 / -1',
			'margin-block-start': '0',
			'padding-block-start': 'var(--wp--preset--spacing--2)',
		},
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_STACK_CONTEXT,
		declarations: { 'grid-template-columns': 'minmax(0, 1fr)' },
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody td:nth-of-type(1)',
		atContext: DIGEST_STACK_CONTEXT,
		declarations: {
			'grid-column': '1',
			'margin-block-start': 'var(--wp--preset--spacing--2)',
			'text-align': 'start',
		},
	},
];

module.exports = {
	DIGEST_ACCEPTED_ACTION_CONTRACTS,
	DIGEST_COMPACT_CONTEXT,
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_LOWER_CONTRACTS,
	DIGEST_NARROW_CONTEXT,
	DIGEST_OPENING_CONTRACTS,
	DIGEST_PHONE_CONTEXT,
	DIGEST_STACK_CONTEXT,
	DIGEST_WIDE_CONTEXT,
};

const DIGEST_COMPACT_CONTEXT = '@media (min-width: 601px) and (max-width: 1023px)';
const DIGEST_WIDE_CONTEXT = '@media (min-width: 782px)';
const DIGEST_NARROW_CONTEXT = '@media (max-width: 781px)';
const DIGEST_PHONE_CONTEXT = '@media (max-width: 600px)';
const DIGEST_EDITORIAL_CONTEXT = '@media (min-width: 1024px)';
const DIGEST_STACK_CONTEXT = '@media (max-width: 359px)';

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

const DIGEST_LOWER_CONTRACTS = [];

// Remove in Task 4 after verify-job-placement-pages.js imports the new arrays.
const DIGEST_TABLET_CONTRACTS = DIGEST_COMPACT_CONTRACTS;

module.exports = {
	DIGEST_COMPACT_CONTEXT,
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_EDITORIAL_CONTEXT,
	DIGEST_LOWER_CONTRACTS,
	DIGEST_NARROW_CONTEXT,
	DIGEST_OPENING_CONTRACTS,
	DIGEST_PHONE_CONTEXT,
	DIGEST_STACK_CONTEXT,
	DIGEST_TABLET_CONTRACTS,
	DIGEST_WIDE_CONTEXT,
};

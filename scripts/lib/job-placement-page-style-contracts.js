const DIGEST_COMPACT_CONTEXT = '@media (min-width: 601px) and (max-width: 1023px)';

const DIGEST_TABLET_CONTRACTS = [
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
		selector: '.hp-category-bar',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { 'margin-block': 'var(--wp--preset--spacing--3)' },
	},
	{
		selector: '.hp-wcus-callout',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: {
			'margin-block-start': 'var(--wp--preset--spacing--5)',
			padding: 'var(--wp--preset--spacing--5)',
			'padding-block-start': 'var(--wp--preset--spacing--4)',
		},
	},
	{
		selector: '.hp-wcus-callout > h2',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: {
			'font-size': 'var(--wp--preset--font-size--2-xl)',
			'margin-block-start': 'var(--wp--preset--spacing--4)',
		},
	},
	{
		selector: '.hp-wcus-callout > p:not(.hp-page-hero__eyebrow)',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--4)' },
	},
];

module.exports = {
	DIGEST_COMPACT_CONTEXT,
	DIGEST_TABLET_CONTRACTS,
};

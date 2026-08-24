const DIGEST_COMPACT_CONTEXT = '@media (min-width: 601px) and (max-width: 1023px)';
const DIGEST_WIDE_CONTEXT = '@media (min-width: 782px)';
const DIGEST_NARROW_CONTEXT = '@media (max-width: 781px)';
const DIGEST_PHONE_CONTEXT = '@media (max-width: 600px)';
const DIGEST_STACK_CONTEXT = '@media (max-width: 359px)';
const PLACEMENT_MASTHEAD_CONTEXT = '@media (min-width: 940px)';
const PLACEMENT_FILTER_PHONE_CONTEXT = '@media (max-width: 599px)';
const PLACEMENT_FILTER_WRAP_CONTEXT = '@media (min-width: 600px)';
const PLACEMENT_SCROLL_HINT_CONTEXT = '@media (min-width: 782px) and (max-width: 1180px)';
const PLACEMENT_REDUCED_MOTION_CONTEXT = '@media (prefers-reduced-motion: reduce)';

const PLACEMENT_LEDGER_LABEL_CONTRACTS = [
	[ '.hp-evidence-table tbody th::before', 'Artifact' ],
	[ '.hp-evidence-table tbody td:nth-of-type(1)::before', 'State' ],
	[ '.hp-evidence-table tbody td:nth-of-type(2)::before', 'Direct evidence' ],
	[ '.hp-keyword-table tbody th::before', 'Keyword' ],
	[ '.hp-keyword-table tbody td:nth-of-type(1)::before', 'Posting signal' ],
	[ '.hp-keyword-table tbody td:nth-of-type(2)::before', 'Evidence boundary' ],
	[ '.hp-market-table tbody th::before', 'Job title' ],
	[ '.hp-market-table tbody td:nth-of-type(1)::before', 'Company' ],
	[ '.hp-market-table tbody td:nth-of-type(2)::before', 'Posting' ],
	[ '.hp-market-table tbody td:nth-of-type(3)::before', 'Last checked' ],
	[ '.hp-market-table tbody td:nth-of-type(4)::before', 'State' ],
	[ '.hp-market-table tbody td:nth-of-type(5)::before', 'Reasoning' ],
].map( ( [ selector, label ] ) => ( {
	selector,
	atContext: DIGEST_NARROW_CONTEXT,
	declarations: { content: `"${ label }"` },
} ) );

const PLACEMENT_CHASSIS_CONTRACTS = [
	{
		selector: '.hp-placement-masthead',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			'row-gap': 'var(--wp--preset--spacing--6)',
		},
	},
	{
		selector: '.hp-placement-masthead > *',
		declarations: { 'margin-block': '0' },
	},
	{
		selector: '.hp-placement-masthead--digest',
		atContext: PLACEMENT_MASTHEAD_CONTEXT,
		declarations: { 'grid-template-columns': 'minmax(0, 1.6fr) minmax(17rem, 0.85fr)' },
	},
	{
		selector: '.hp-placement-masthead--method',
		atContext: PLACEMENT_MASTHEAD_CONTEXT,
		declarations: { 'grid-template-columns': 'minmax(0, 1.6fr) minmax(17rem, 0.8fr)' },
	},
	{
		selector: '.hp-placement-part',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			'row-gap': 'var(--wp--preset--spacing--4)',
		},
	},
	{
		selector: '.hp-placement-part__number',
		declarations: {
			display: 'flex',
			'align-items': 'center',
			gap: 'var(--wp--preset--spacing--3)',
			'font-size': 'var(--wp--preset--font-size--md)',
		},
	},
	{
		selector: '.hp-placement-part__number::after',
		declarations: {
			content: '""',
			flex: '1 1 auto',
			'border-block-start': '1px solid var(--wp--custom--border--hair)',
		},
	},
	{
		selector: '.hp-placement-part',
		atContext: DIGEST_WIDE_CONTEXT,
		declarations: {
			'grid-template-columns': '3rem minmax(0, 1fr)',
			'column-gap': 'var(--wp--preset--spacing--4)',
			'row-gap': '0',
			'padding-block-start': 'var(--wp--preset--spacing--5)',
			'border-block-start': '1px solid var(--wp--custom--border--hair)',
		},
	},
	{
		selector: '.hp-placement-part.is-bare',
		atContext: DIGEST_WIDE_CONTEXT,
		declarations: {
			'padding-block-start': '0',
			'border-block-start': '0',
		},
	},
	{
		selector: '.hp-placement-part__number',
		atContext: DIGEST_WIDE_CONTEXT,
		declarations: {
			display: 'block',
			'align-self': 'start',
		},
	},
	{
		selector: '.hp-placement-section',
		declarations: {
			'box-sizing': 'border-box',
			'margin-block-start': '0',
			padding: '2.5rem 1rem 0',
			'scroll-margin-block-start': '72px',
		},
	},
	{
		selector: '.hp-placement-section [id]',
		declarations: { 'scroll-margin-block-start': '72px' },
	},
	...[
		'.hp-placement-section',
		'.hp-placement-section [id]',
	].map( ( selector ) => ( {
		selector,
		atContext: DIGEST_WIDE_CONTEXT,
		declarations: { 'scroll-margin-block-start': '84px' },
	} ) ),
	{
		selector: '.hp-digest-template .hp-placement-section.hp-placement-section--text',
		declarations: {
			'max-inline-size': 'var(--wp--style--global--content-size, 44rem)',
			'margin-inline': 'auto',
		},
	},
	{
		selector: '.hp-placement-section--wide',
		declarations: {
			'max-inline-size': 'var(--wp--style--global--wide-size, 72rem)',
			'margin-inline': 'auto',
		},
	},
	{
		selector: '.hp-placement-band',
		declarations: {
			'max-inline-size': 'none !important',
			background: 'var(--wp--custom--surface--sunken)',
		},
	},
	{
		selector: '.hp-placement-band--evidence',
		declarations: { 'padding-block-end': '2.5rem' },
	},
	{
		selector: '.hp-placement-band--evidence',
		atContext: PLACEMENT_FILTER_WRAP_CONTEXT,
		declarations: { 'padding-block-end': '4rem' },
	},
	{
		selector: '.hp-placement-band > .hp-placement-part',
		declarations: {
			'max-inline-size': 'var(--wp--style--global--wide-size, 72rem)',
			'margin-inline': 'auto',
		},
	},
	{
		selector: '.hp-placement-band--market > .hp-placement-part',
		declarations: { 'max-inline-size': '84rem' },
	},
	{
		selector: '.hp-placement-part__content > h2',
		declarations: { 'font-size': 'var(--wp--preset--font-size--2-xl)' },
	},
	{
		selector: '.hp-incident-card.hp-placement-section',
		declarations: {
			border: '0',
			'border-radius': '0',
			background: 'transparent',
			'box-shadow': 'none',
		},
	},
	{
		selector: '.hp-evidence-filter',
		atContext: PLACEMENT_FILTER_PHONE_CONTEXT,
		declarations: {
			'flex-wrap': 'nowrap',
			'overflow-x': 'auto',
			'scroll-snap-type': 'x proximity',
			'margin-inline': '-1rem',
			'padding-inline': '1rem',
		},
	},
	{
		selector: '.hp-digest-template .wp-element-button',
		atContext: PLACEMENT_REDUCED_MOTION_CONTEXT,
		declarations: { 'transition-duration': '0.01ms !important' },
	},
	{
		selector: '.hp-evidence-filter__button',
		atContext: PLACEMENT_FILTER_PHONE_CONTEXT,
		declarations: {
			flex: '0 0 auto',
			'scroll-snap-align': 'start',
			'white-space': 'nowrap',
		},
	},
	{
		selector: '.hp-evidence-filter',
		atContext: PLACEMENT_FILTER_WRAP_CONTEXT,
		declarations: {
			'flex-wrap': 'wrap',
			overflow: 'visible',
		},
	},
	{
		selector: '.hp-placement-ledger tbody :is(th, td)::before',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			display: 'block',
			'font-size': 'var(--wp--preset--font-size--xs)',
			'text-transform': 'uppercase',
		},
	},
	{
		selector: '.hp-placement-ledger tbody th[data-state]',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'padding-inline-start': 'var(--wp--preset--spacing--3)' },
	},
	...PLACEMENT_LEDGER_LABEL_CONTRACTS,
	{
		selector: '.hp-market-scroll-hint',
		declarations: { display: 'none' },
	},
	{
		selector: '.hp-market-scroll-hint',
		atContext: PLACEMENT_SCROLL_HINT_CONTEXT,
		declarations: { display: 'block' },
	},
	{
		selector: '.hp-market-table table',
		declarations: { 'min-inline-size': '62rem' },
	},
	{
		selector: '.hp-market-table',
		atContext: DIGEST_WIDE_CONTEXT,
		declarations: {
			'overflow-x': 'auto',
			'overflow-y': 'hidden',
		},
	},
	{
		selector: '.hp-placement-standing-tile',
		declarations: { 'border-inline-start-width': '5px' },
	},
	{
		selector: '.hp-evidence-table a',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			display: 'inline-flex',
			'align-items': 'center',
			'min-block-size': '44px',
		},
	},
	{
		selector: '.hp-numbered-rule h3',
		declarations: {
			'grid-template-columns': 'minmax(0, 1fr)',
			'row-gap': 'var(--wp--preset--spacing--2)',
		},
	},
	{
		selector: '.hp-numbered-rule h3',
		atContext: PLACEMENT_FILTER_WRAP_CONTEXT,
		declarations: {
			'grid-template-columns': '3rem minmax(0, 1fr)',
			'column-gap': 'var(--wp--preset--spacing--3)',
			'row-gap': '0',
		},
	},
	{
		selector: '.hp-method-plate',
		declarations: { padding: '2.5rem 1rem' },
	},
	{
		selector: '.hp-method-plate',
		atContext: PLACEMENT_FILTER_WRAP_CONTEXT,
		declarations: { padding: '4rem 2rem' },
	},
];

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
		// The shared plate presentation every WordCamp callout builds on. The
		// dossier's --event-first modifier overrides margin-block-start and
		// background; the base rule stays pinned here so retiring the older
		// hero-contained panel cannot quietly drop it.
		selector: '.hp-wcus-callout',
		declarations: {
			'--hp-plate-pad': 'var(--wp--preset--spacing--6)',
			'margin-block-start': 'var(--wp--preset--spacing--6)',
			padding: 'var(--hp-plate-pad)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
			background: 'color-mix(in srgb, var(--wp--preset--color--parchment-100) 88%, var(--wp--preset--color--gold-100))',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first',
		declarations: {
			'box-sizing': 'border-box',
			display: 'block',
			'max-inline-size': 'none',
			'margin-block-start': '0',
			padding: '2.5rem 1rem',
			'border-inline-start': '0',
			background: 'var(--wp--custom--surface--sunken)',
		},
	},
	{
		selector: '.hp-wcus-callout__inner',
		declarations: {
			'box-sizing': 'border-box',
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
			'align-items': 'stretch',
			'max-inline-size': 'var(--wp--style--global--wide-size, 72rem)',
			'margin-inline': 'auto',
			padding: 'var(--hp-plate-pad)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
			background: 'var(--wp--custom--surface--raised)',
			'box-shadow': 'var(--wp--custom--shadow--sm)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			gap: 'var(--wp--preset--spacing--4)',
			width: '100%',
			'align-self': 'end',
			'align-content': 'end',
			'grid-auto-rows': 'max-content',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions > *',
		declarations: { 'align-self': 'end' },
	},
	{
		selector: '.hp-wcus-callout__figure',
		declarations: {
			'grid-column': '1 / -1',
			margin: 'calc(var(--hp-plate-pad) * -1) calc(var(--hp-plate-pad) * -1) var(--hp-plate-pad)',
			background: 'var(--wp--custom--surface--card)',
			'border-block-end': '1px solid var(--wp--custom--border--hair)',
		},
	},
	{
		selector: '.hp-wcus-callout__figure img',
		declarations: {
			display: 'block',
			'inline-size': '100%',
			'aspect-ratio': '16 / 9',
			'object-fit': 'cover',
			'object-position': 'center 40%',
		},
	},
	{
		selector: '.hp-wcus-callout__figure > .wp-element-caption',
		declarations: {
			margin: '0',
			padding: 'var(--wp--preset--spacing--3) var(--wp--preset--spacing--4)',
			'font-family': 'var(--wp--preset--font-family--mono)',
			'font-size': 'var(--wp--preset--font-size--xs)',
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
		selector: '.hp-wcus-callout__inner',
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
		declarations: { '--hp-plate-pad': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-wcus-callout__inner',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'align-self': 'start',
			'align-content': 'start',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions > *',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'align-self': 'start' },
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { '--hp-plate-pad': 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.hp-wcus-callout__inner',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { 'row-gap': 'var(--wp--preset--spacing--4)' },
	},
];

const DIGEST_LOWER_CONTRACTS = [
	{
		selector: '.hp-fit-ledger:not(.hp-placement-section)',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-incident-card:not(.hp-placement-section)',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-evidence-ledger:not(.hp-placement-section)',
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
		selector: '.hp-digest-section:not(.hp-placement-section)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--7)' },
	},
	{
		selector: '.hp-fit-ledger:not(.hp-placement-section)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-incident-card:not(.hp-placement-section)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-evidence-ledger:not(.hp-placement-section)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-proof-cards > .hp-proof-card.is-style-hperkins-proof-card',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.hp-incident-card:not(.hp-placement-section)',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			display: 'block',
			padding: 'var(--wp--preset--spacing--4)',
			'border-block-end': '1px solid var(--wp--custom--border--hair)',
		},
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
];

// The appendix's two ledgers are filtered by the same script as the register,
// so they need the same declarations to hold. Each of these is load-bearing in
// a way a rendered pass cannot see on its own: the [hidden] guards decide
// whether a filtered-out row leaves the flow at phone widths, the standing rule
// is the redundant second signal beside the standing word, and the narrow
// label/value grid is what keeps a stacked ledger line readable.
const APPENDIX_LEDGER_CONTRACTS = [
	{
		selector: '.wp-block-table.hp-keyword-table tbody tr[hidden]',
		declarations: { display: 'none' },
	},
	{
		selector: '.wp-block-table.hp-market-table tbody tr[hidden]',
		declarations: { display: 'none' },
	},
	{
		selector: '.hp-keyword-table tbody th[data-state="demonstrated"]',
		declarations: { 'border-inline-start-color': 'var(--wp--custom--status--done)' },
	},
	{
		selector: '.hp-market-table tbody th[data-state="live"]',
		declarations: { 'border-inline-start-color': 'var(--wp--custom--status--done)' },
	},
	{
		selector: '.hp-market-table tbody th[data-state="failed"]',
		declarations: { 'border-inline-start-color': 'var(--wp--preset--color--rust)' },
	},
	// Below the plate's own breakpoint the label returns above its value. At
	// 320px the two-column line left an 18px value track beside a 128px label.
	{
		selector: '.wp-block-table.hp-market-table tbody td:nth-of-type(n + 3):nth-of-type(-n + 4):not(:empty)',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { display: 'block' },
	},
];

module.exports = {
	APPENDIX_LEDGER_CONTRACTS,
	DIGEST_ACCEPTED_ACTION_CONTRACTS,
	DIGEST_COMPACT_CONTEXT,
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_LOWER_CONTRACTS,
	DIGEST_NARROW_CONTEXT,
	DIGEST_OPENING_CONTRACTS,
	DIGEST_PHONE_CONTEXT,
	DIGEST_STACK_CONTEXT,
	DIGEST_WIDE_CONTEXT,
	PLACEMENT_CHASSIS_CONTRACTS,
	PLACEMENT_FILTER_PHONE_CONTEXT,
	PLACEMENT_FILTER_WRAP_CONTEXT,
	PLACEMENT_LEDGER_LABEL_CONTRACTS,
	PLACEMENT_MASTHEAD_CONTEXT,
	PLACEMENT_SCROLL_HINT_CONTEXT,
};

(function (root, factory) {
	'use strict';

	if (typeof module === 'object' && module.exports) {
		module.exports = factory();
		return;
	}

	root.HPAboutResume = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
	'use strict';

	var IDLE_READOUT = 'Pick a term to pull its evidence to the top. Nothing is hidden.';
	// The rail is 13–15rem of 12px mono: one line is about thirty characters, and
	// the term is already lit in the list below, so the rail's readout states only
	// the count and the section's intro is what says where the index went.
	var RAIL_IDLE_READOUT = 'Pick a term to filter.';
	var RAIL_EDUCATION_INTRO = 'The capability index is the filter rail on the left — pick a term there and its evidence travels to the top of the record.';
	var UNBACKED_COUNT = '—';
	var TIMELINE_GROUP_LABEL = 'Proof at a glance, in order';
	// The proof stepper's clock. First paint is unlit; the state resolves to the
	// real step after the boot tick, and the intro stagger runs for the window
	// after that or until the first selection. Each swap reads the reading
	// pane's CSS fade-out before the step and its content change together.
	var TIMELINE_BOOT_DELAY = 60;
	var TIMELINE_INTRO_WINDOW = 1800;
	var mountedRoots = typeof WeakMap === 'function' ? new WeakMap() : null;
	var activeState = null;
	var headerResizeObserver = null;
	var observedHeader = null;

	function termSlug(term) {
		return String(term || '')
			.toLowerCase()
			.trim()
			.replace(/&/g, 'and')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function rowTerms(row) {
		if (!row) {
			return [];
		}

		if (Array.isArray(row.terms)) {
			return row.terms;
		}

		if (Array.isArray(row.skills)) {
			return row.skills;
		}

		if (row.classList) {
			return Array.prototype.filter.call(row.classList, function (className) {
				return className.indexOf('hp-term--') === 0;
			}).map(function (className) {
				return className.slice('hp-term--'.length);
			});
		}

		return [];
	}

	function rowCites(row, activeTerm) {
		var activeSlug = termSlug(activeTerm);
		return Boolean(activeSlug) && rowTerms(row).some(function (term) {
			return termSlug(term) === activeSlug;
		});
	}

	function groupEntries(groups) {
		if (Array.isArray(groups)) {
			return groups.map(function (group, index) {
				if (Array.isArray(group)) {
					return { name: String(index), terms: group };
				}

				return {
					name: group.name || group.label || group.legend || String(index),
					terms: group.terms || group.skills || group.items || []
				};
			});
		}

		return Object.keys(groups || {}).map(function (name) {
			return { name: name, terms: groups[name] };
		});
	}

	function buildIndex(rows, groups) {
		var counts = {};
		var slugCounts = {};

		(rows || []).forEach(function (row) {
			rowTerms(row).forEach(function (term) {
				var label = String(term);
				var slug = termSlug(label);
				counts[label] = (counts[label] || 0) + 1;
				slugCounts[slug] = (slugCounts[slug] || 0) + 1;
			});
		});

		var indexedGroups = groupEntries(groups).map(function (group) {
			var backed = group.terms.filter(function (term) {
				return (counts[term] || slugCounts[termSlug(term)] || 0) > 0;
			}).length;
			return {
				name: group.name,
				terms: group.terms.slice(),
				backed: backed,
				total: group.terms.length,
				coverage: backed + '/' + group.terms.length + ' backed above'
			};
		});

		indexedGroups.forEach(function (group) {
			indexedGroups[group.name] = group;
		});

		return {
			counts: counts,
			slugCounts: slugCounts,
			groups: indexedGroups,
			coverage: indexedGroups.reduce(function (result, group) {
				result[group.name] = group.coverage;
				return result;
			}, {})
		};
	}

	function partitionEvidenceRows(rows, activeTerm) {
		var canonical = (rows || []).slice();
		if (!activeTerm) {
			return {
				ordered: canonical,
				matchCount: 0,
				dividerIndex: -1
			};
		}

		var matches = canonical.filter(function (row) { return rowCites(row, activeTerm); });
		var misses = canonical.filter(function (row) { return !rowCites(row, activeTerm); });
		return {
			ordered: matches.concat(misses),
			matchCount: matches.length,
			dividerIndex: misses.length ? matches.length : -1
		};
	}

	function formatReadout(activeTerm, count) {
		if (!activeTerm) {
			return IDLE_READOUT;
		}

		return activeTerm + ' — ' + count + ' ' + (count === 1 ? 'row cites it' : 'rows cite it') + ', pulled to the top of each ledger.';
	}

	// Counts belong to each destination, not to the whole page: one skill may
	// cite contributions and roles, or only one of those two ledgers.
	function evidenceDestinations(ledgers, term) {
		if (!term) {
			return [];
		}
		return ledgers.map(function (record) {
			var count = record.rows.filter(function (row) { return rowCites(row, term); }).length;
			var noun = record.id === 'contributions' ? 'contribution' : 'role';
			return { id: record.id, count: count, label: 'View ' + count + ' matching ' + noun + (count === 1 ? '' : 's') };
		}).filter(function (destination) { return destination.count > 0; });
	}

	function formatRailReadout(activeTerm, count) {
		if (!activeTerm) {
			return RAIL_IDLE_READOUT;
		}

		return count + ' ' + (count === 1 ? 'row cites it.' : 'rows cite it.');
	}

	function createButton(label, className) {
		var button = document.createElement('button');
		button.type = 'button';
		button.className = className;
		button.textContent = label;
		return button;
	}

	// Arrow keys move to the previous or next step and wrap; Home and End go to
	// the first and last. Any other key, or focus outside the steps, is not the
	// stepper's to handle.
	function nextTimelineStep(key, index, count) {
		var delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[key];
		if (!count || index < 0 || index >= count) {
			return null;
		}
		if (delta) {
			return (index + delta + count) % count;
		}
		if (key === 'Home') {
			return 0;
		}
		if (key === 'End') {
			return count - 1;
		}
		return null;
	}

	// The reading pane's anchor, as "<step>/<count>": the stylesheet maps each
	// value to the centre of that equal column.
	function timelineAnchor(index, count) {
		return index + '/' + count;
	}

	// The authored step label is a paragraph; enhancement turns it into the
	// button and this turns it back, children and classes intact.
	function restoreTimelineLabel(button) {
		var label = button.ownerDocument.createElement('p');
		label.className = button.className;
		while (button.firstChild) {
			label.appendChild(button.firstChild);
		}
		button.replaceWith(label);
		return label;
	}

	function createLedgerDivider() {
		var divider = document.createElement('div');
		var label = document.createElement('p');
		var rule = document.createElement('span');
		divider.className = 'hp-about-ledger__divider';
		divider.hidden = true;
		divider.setAttribute('data-hp-about-generated', 'divider');
		label.className = 'hp-about-ledger__divider-label';
		label.textContent = 'Not cited';
		rule.setAttribute('aria-hidden', 'true');
		divider.appendChild(label);
		divider.appendChild(rule);
		return divider;
	}

	function createCitationChip() {
		var chip = document.createElement('span');
		chip.className = 'hp-about-citation-chip';
		chip.hidden = true;
		chip.setAttribute('data-hp-about-generated', 'citation');
		chip.textContent = 'cites selected term';
		return chip;
	}

	function createPrintViewToolbar(documentRef, handlers) {
		var toolbar = documentRef.createElement('div');
		var message = documentRef.createElement('p');
		var printButton = documentRef.createElement('button');
		var exitButton = documentRef.createElement('button');

		toolbar.className = 'hp-about-print-view';
		toolbar.setAttribute('data-hp-about-generated', 'print-view');
		toolbar.setAttribute('hidden', '');
		message.className = 'hp-about-print-view__message';
		message.textContent = 'Print view: every role expanded, showcase and navigation removed.';
		printButton.type = 'button';
		printButton.className = 'hp-about-print-view__print';
		printButton.textContent = 'Print / Save PDF';
		exitButton.type = 'button';
		exitButton.className = 'hp-about-print-view__exit';
		exitButton.textContent = 'Exit print view';
		printButton.addEventListener('click', handlers.onPrint);
		exitButton.addEventListener('click', handlers.onExit);
		toolbar.appendChild(message);
		toolbar.appendChild(printButton);
		toolbar.appendChild(exitButton);

		return toolbar;
	}

	// The contents-card link opens on its ordinal — `<a><span class="…__number">03
	// </span> Skills</a>` — so writing textContent would take the numeral with the
	// label. Rewrite only what follows the numeral.
	function setNavLinkLabel(link, label) {
		if (!link) {
			return;
		}
		var number = link.querySelector('.hp-about-nav__number');
		if (!number) {
			link.textContent = label;
			return;
		}
		while (number.nextSibling) {
			link.removeChild(number.nextSibling);
		}
		link.appendChild(link.ownerDocument.createTextNode(' ' + label));
	}

	function setEducationRecordHeadingLevels(rootElement, level) {
		if (!rootElement || !rootElement.querySelectorAll) {
			return [];
		}

		var targetTagName = 'H' + level;
		return Array.prototype.map.call(
			rootElement.querySelectorAll('.hp-about-education__record h3, .hp-about-education__record h4'),
			function (heading) {
				if (heading.tagName === targetTagName) {
					return heading;
				}

				var replacement = heading.ownerDocument.createElement('h' + level);
				Array.prototype.forEach.call(heading.attributes || [], function (attribute) {
					replacement.setAttribute(attribute.name, attribute.value);
				});
				while (heading.firstChild) {
					replacement.appendChild(heading.firstChild);
				}
				heading.replaceWith(replacement);
				return replacement;
			}
		);
	}

	function resetStaleEnhancement(rootElement) {
		var layout = rootElement.querySelector('.hp-about-v3-layout');
		var nav = rootElement.querySelector('.hp-about-nav');
		if (nav) { nav.classList.remove('is-open'); }
		var filterRail = rootElement.querySelector('.hp-about-filter-rail');
		if (layout && nav && nav.parentNode !== layout) {
			layout.insertBefore(nav, filterRail || layout.firstChild);
		}
		var skillSection = rootElement.querySelector('#skills');
		var skillIndex = rootElement.querySelector('.hp-about-skill-index');
		var education = skillSection ? skillSection.querySelector('.hp-about-education') : null;
		if (skillSection && skillIndex && skillIndex.parentNode !== skillSection) {
			skillSection.insertBefore(skillIndex, education || null);
		}
		setEducationRecordHeadingLevels(rootElement, 4);

		Array.prototype.forEach.call(rootElement.querySelectorAll('button.hp-about-skill-term__button'), function (button) {
			var span = document.createElement('span');
			span.className = button.className.split(/\s+/).filter(function (className) {
				return className && className !== 'hp-about-skill-term__button' && className !== 'is-unbacked';
			}).join(' ');
			span.textContent = button.textContent;
			button.replaceWith(span);
		});

		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-skill-term.is-unbacked'), function (term) {
			term.classList.remove('is-unbacked');
			term.removeAttribute('aria-disabled');
		});
		Array.prototype.forEach.call(rootElement.querySelectorAll('button.hp-about-timeline__label'), restoreTimelineLabel);
		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-timeline__step'), function (step) {
			step.classList.remove('is-done', 'is-current', 'is-last');
		});
		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-timeline__fold'), function (fold) {
			fold.removeAttribute('aria-hidden');
		});
		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-timeline__steps'), function (steps) {
			steps.classList.remove('is-booted', 'is-intro');
			steps.removeAttribute('role');
			steps.removeAttribute('aria-label');
		});
		Array.prototype.forEach.call(rootElement.querySelectorAll('[data-hp-about-generated], .hp-about-skills__clear, .hp-about-earlier__toggle'), function (generated) {
			generated.remove();
		});
		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-ledger'), function (ledger) {
			var rows = Array.prototype.slice.call(ledger.querySelectorAll('.hp-about-index-row'));
			if (rows.length && rows.every(function (row) { return row.hasAttribute('data-hp-about-order'); })) {
				rows.sort(function (a, b) {
					return Number(a.getAttribute('data-hp-about-order')) - Number(b.getAttribute('data-hp-about-order'));
				}).forEach(function (row) { ledger.appendChild(row); });
			}
			rows.forEach(function (row) {
				row.classList.remove('is-cited');
				row.removeAttribute('data-hp-about-order');
				row.style.removeProperty('transform');
				row.style.removeProperty('transition');
			});
		});

		var earlier = rootElement.querySelector('.hp-about-earlier');
		if (earlier) {
			earlier.hidden = false;
			if (earlier.id === 'hp-about-earlier-roles') {
				earlier.removeAttribute('id');
			}
		}
		var readout = rootElement.querySelector('.hp-about-skills__readout');
		if (readout) {
			readout.textContent = IDLE_READOUT;
			readout.removeAttribute('aria-live');
		}
		var heading = skillSection ? skillSection.querySelector('.hp-about-skills__heading') : null;
		var eyebrow = skillSection ? skillSection.querySelector('.hp-about-skills__eyebrow') : null;
		var intro = skillSection ? skillSection.querySelector('.hp-about-skills__intro') : null;
		var educationHeading = skillSection ? skillSection.querySelector('.hp-about-education > h3') : null;
		var navSkillsLink = rootElement.querySelector('.hp-about-nav__list a[href="#skills"]');
		if (heading) { heading.textContent = 'Skills index'; }
		if (eyebrow) { eyebrow.textContent = 'Capabilities'; }
		if (intro) {
			intro.textContent = 'Every term is a filter into the record above. Pick one and its evidence travels to the top of each ledger; the rest keep their place below a stated line. Faded terms have nothing on this page behind them yet.';
		}
		if (educationHeading) { educationHeading.hidden = false; }
		setNavLinkLabel(navSkillsLink, 'Skills');
		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-nav__list a'), function (link) {
			link.classList.remove('is-active');
			link.removeAttribute('aria-current');
		});

		if (document.createTreeWalker && typeof NodeFilter !== 'undefined') {
			var comments = [];
			var walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_COMMENT);
			for (var comment = walker.nextNode(); comment; comment = walker.nextNode()) {
				if (comment.data === 'hp-about-skill-index-home' || comment.data === 'hp-about-nav-home') {
					comments.push(comment);
				}
			}
			comments.forEach(function (comment) { comment.remove(); });
		}
		rootElement.classList.remove('is-enhanced', 'is-print-mode');
		document.documentElement.classList.remove('has-about-v3');
		document.documentElement.classList.remove('has-about-v3-print-view');
		document.documentElement.style.removeProperty('--hp-about-header-height');
	}

	// Keep Jetpack's chat state, transport and dialog under Jetpack ownership.
	// Only replace the collapsed launcher when the real control is present.
	function mountContactChat(rootElement) {
		var contact = rootElement.querySelector('#contact');
		if (!contact || !window.MutationObserver) { return function () {}; }
		var host = document.createElement('div');
		host.className = 'hp-about-contact__chat';
		host.setAttribute('data-hp-about-generated', 'contact-chat');
		host.hidden = true;
		var prompt = document.createElement('p');
		prompt.textContent = 'Have a quick question?';
		var button = createButton('Open chat', 'hp-about-contact__chat-button');
		host.appendChild(prompt);
		host.appendChild(button);
		contact.appendChild(host);
		var launchedHere = false;
		var wasOpen = false;
		var disposed = false;
		function launcher() {
			return document.querySelector('.agents-manager-chat [data-slot="collapsed-view"] button');
		}
		function sync() {
			if (disposed) { return; }
			var collapsed = launcher();
			var open = Boolean(document.querySelector('.agents-manager-chat [data-slot="chat-input"]'));
			var available = Boolean(collapsed || open);
			host.hidden = !available;
			document.documentElement.classList.toggle('has-about-inline-chat', available);
			button.setAttribute('aria-expanded', String(open));
			if (!wasOpen && open && launchedHere) {
				var input = document.querySelector('.agents-manager-chat textarea');
				if (input) { input.focus({ preventScroll: true }); }
			}
			if (wasOpen && !open && collapsed && launchedHere) {
				(button.getClientRects().length ? button : collapsed).focus({ preventScroll: true });
				launchedHere = false;
			}
			wasOpen = open;
		}
		button.addEventListener('click', function () {
			var collapsed = launcher();
			if (collapsed) {
				launchedHere = true;
				collapsed.click();
			} else {
				var input = document.querySelector('.agents-manager-chat textarea');
				if (input) { input.focus(); }
			}
		});
		var observer = new MutationObserver(sync);
		observer.observe(document.body, { childList: true, subtree: true });
		sync();
		return function () {
			disposed = true;
			observer.disconnect();
			host.remove();
			document.documentElement.classList.remove('has-about-inline-chat');
		};
	}

	function mount(rootElement) {
		if (!rootElement || !rootElement.classList.contains('hp-about-resume-v3')) {
			return null;
		}
		if (mountedRoots && mountedRoots.has(rootElement)) {
			return mountedRoots.get(rootElement);
		}
		resetStaleEnhancement(rootElement);

		var ledgers = Array.prototype.slice.call(rootElement.querySelectorAll('.hp-about-ledger'));
		ledgers.forEach(function (ledger) {
			if (!ledger.querySelector('.hp-about-ledger__divider')) {
				ledger.insertBefore(createLedgerDivider(), ledger.firstChild);
			}
		});
		var rows = Array.prototype.slice.call(rootElement.querySelectorAll('.hp-about-index-row'));
		ledgers.forEach(function (ledger) {
			Array.prototype.forEach.call(ledger.querySelectorAll('.hp-about-index-row'), function (row, index) {
				row.setAttribute('data-hp-about-order', String(index));
			});
		});
		rows.forEach(function (row) {
			var chipHost = row.querySelector('.hp-about-contribution__register, .hp-about-role__meta');
			if (chipHost && !chipHost.querySelector('.hp-about-citation-chip')) {
				chipHost.appendChild(createCitationChip());
			}
		});
		var canonicalByLedger = ledgers.map(function (ledger) {
			return {
				id: ledger.closest('section').id,
				ledger: ledger,
				divider: ledger.querySelector('.hp-about-ledger__divider'),
				rows: Array.prototype.slice.call(ledger.querySelectorAll('.hp-about-index-row'))
			};
		});
		var activeTerm = null;
		var indexInRail = false;
		var termButtons = [];
		var unbackedTerms = [];
		var generatedControls = [];
		var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		var skillIndex = rootElement.querySelector('.hp-about-skill-index');
		var skillSection = rootElement.querySelector('#skills');
		var skillIndexHome = skillIndex ? document.createComment('hp-about-skill-index-home') : null;
		var railHost = rootElement.querySelector('.hp-about-rail__index-host');
		var nav = rootElement.querySelector('.hp-about-nav');
		var navHome = nav ? document.createComment('hp-about-nav-home') : null;
		var heroContentsHost = rootElement.querySelector('.hp-about-v3-hero__contents-host');
		var main = rootElement.querySelector('.hp-about-v3-main');
		var wideQuery = window.matchMedia('(min-width: 64rem)');
		var readout = rootElement.querySelector('.hp-about-skills__readout');
		var controls = rootElement.querySelector('.hp-about-skills__controls');
		var clearButton = createButton('Clear filter', 'hp-about-skills__clear');
		var resultActions = document.createElement('div');
		resultActions.className = 'hp-about-skills__results';
		resultActions.setAttribute('data-hp-about-generated', 'results');
		var returnControls = [];
		var navList = nav ? nav.querySelector('.hp-about-nav__list') : null;
		var navToggle = null;
		var navListOriginalId = navList ? navList.getAttribute('id') : null;
		var chatCleanup = null;
		var earlier = rootElement.querySelector('.hp-about-earlier');
		var earlierOriginalId = earlier ? earlier.getAttribute('id') : null;
		var earlierToggle = null;
		var timelineSteps = rootElement.querySelector('.hp-about-timeline__steps');
		var timelineStepElements = timelineSteps ? Array.prototype.slice.call(timelineSteps.querySelectorAll('.hp-about-timeline__step')) : [];
		var timelineButtons = [];
		var timelinePanel = null;
		var timelineBubble = null;
		var timelineCurrent = -1;
		var timelineTarget = -1;
		var timelineBootTimer = null;
		var timelineIntroTimer = null;
		var timelineSwapTimer = null;
		var navSkillsLink = rootElement.querySelector('.hp-about-nav__list a[href="#skills"]');
		var heading = skillSection ? skillSection.querySelector('.hp-about-skills__heading') : null;
		var eyebrow = skillSection ? skillSection.querySelector('.hp-about-skills__eyebrow') : null;
		var intro = skillSection ? skillSection.querySelector('.hp-about-skills__intro') : null;
		var educationHeading = skillSection ? skillSection.querySelector('.hp-about-education > h3') : null;
		var readoutOriginalText = readout ? readout.textContent : '';
		var readoutHadAriaLive = readout ? readout.hasAttribute('aria-live') : false;
		var flipTimer = null;
		var mediaListenerBound = false;
		var sectionObserver = null;
		var printToolbar = null;
		var printViewActive = false;
		var nativePrintWasTemporary = false;
		var printReturnTarget = null;

		rootElement.classList.add('is-enhanced');
		document.documentElement.classList.add('has-about-v3');

		if (skillIndex && skillIndex.parentNode) {
			skillIndex.parentNode.insertBefore(skillIndexHome, skillIndex);
		}
		if (nav && nav.parentNode) {
			nav.parentNode.insertBefore(navHome, nav);
		}

		if (readout) {
			readout.setAttribute('aria-live', 'polite');
		}
		if (controls) {
			controls.appendChild(resultActions);
			generatedControls.push(resultActions);
			clearButton.hidden = true;
			clearButton.setAttribute('data-hp-about-generated', 'clear-filter');
			controls.appendChild(clearButton);
			generatedControls.push(clearButton);
		}
		canonicalByLedger.forEach(function (record) {
			var button = createButton('Back to selected skill', 'hp-about-skills__return');
			button.hidden = true;
			button.setAttribute('data-hp-about-generated', 'return-filter');
			record.ledger.parentNode.insertBefore(button, record.ledger);
			button.addEventListener('click', function () {
				var selected = termButtons.find(function (entry) { return entry.label === activeTerm; });
				if (selected) {
					selected.button.focus({ preventScroll: true });
					selected.button.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
				}
			});
			returnControls.push({ id: record.id, button: button });
			generatedControls.push(button);
		});

		function closeSectionMenu(restoreFocus) {
			if (!navToggle) { return; }
			nav.classList.remove('is-open');
			navToggle.setAttribute('aria-expanded', 'false');
			if (restoreFocus) { navToggle.focus({ preventScroll: true }); }
		}
		function onSectionKey(event) {
			if (event.key === 'Escape' && nav.classList.contains('is-open')) {
				event.preventDefault();
				closeSectionMenu(true);
			}
		}
		function onSectionClick(event) {
			if (event.target.closest('.hp-about-nav__list a')) { closeSectionMenu(false); }
		}
		function onOutsideSection(event) {
			if (nav && !nav.contains(event.target)) { closeSectionMenu(false); }
		}
		function onSectionFocusOut(event) {
			if (event.relatedTarget && !nav.contains(event.relatedTarget)) { closeSectionMenu(false); }
		}
		if (navList) {
			navList.id = navList.id || 'hp-about-section-links';
			navToggle = createButton('Jump to section', 'hp-about-nav__toggle');
			navToggle.setAttribute('aria-controls', navList.id);
			navToggle.setAttribute('aria-expanded', 'false');
			navToggle.setAttribute('data-hp-about-generated', 'section-toggle');
			nav.insertBefore(navToggle, nav.firstChild);
			navToggle.addEventListener('click', function () {
				var open = navToggle.getAttribute('aria-expanded') !== 'true';
				navToggle.setAttribute('aria-expanded', String(open));
				nav.classList.toggle('is-open', open);
			});
			nav.addEventListener('keydown', onSectionKey);
			nav.addEventListener('click', onSectionClick);
			nav.addEventListener('focusout', onSectionFocusOut);
			document.addEventListener('pointerdown', onOutsideSection);
			generatedControls.push(navToggle);
		}
		if (main) {
			printToolbar = createPrintViewToolbar(document, {
				onPrint: printFromView,
				onExit: exitPrintView
			});
			main.insertBefore(printToolbar, main.firstChild);
			generatedControls.push(printToolbar);
		}

		function countFor(term) {
			return rows.filter(function (row) { return rowCites(row, term); }).length;
		}

		// One readout element, two voices: the rail's count and the section's full
		// sentence. Every write goes through here, keyed to where the index is
		// sitting now, or the next pick overwrites the rail string with the inline
		// one — and a breakpoint change leaves the wrong one standing.
		function writeReadout() {
			if (!readout) {
				return;
			}
			var count = activeTerm ? countFor(activeTerm) : 0;
			readout.textContent = indexInRail ? formatRailReadout(activeTerm, count) : formatReadout(activeTerm, count);
		}

		// Document-relative tops, so a scroll the browser makes between the measure
		// and the replay — anchoring, when showing the divider changes a ledger's
		// height — cannot fake a move.
		function capturePositions() {
			var positions = new Map();
			if (reduceMotion.matches) {
				return positions;
			}
			rows.forEach(function (row) {
				positions.set(row, row.getBoundingClientRect().top + window.scrollY);
			});
			return positions;
		}

		function playFlip(positions) {
			if (reduceMotion.matches || !positions.size) {
				return;
			}
			window.clearTimeout(flipTimer);
			rows.forEach(function (row) {
				var before = positions.get(row);
				var after = row.getBoundingClientRect().top + window.scrollY;
				var deltaY = typeof before === 'number' ? before - after : 0;
				if (!deltaY) {
					return;
				}
				row.style.transition = 'transform 0s';
				row.style.transform = 'translateY(' + deltaY + 'px)';
			});
			// A forced reflow, then a timer, releases the pin. rAF runs before style
			// recalc, so the last pinned row's transform and its release can coalesce
			// into one change and that row lands with no travel; rAF also stalls in a
			// hidden document, which would leave every row pinned.
			void document.body.offsetHeight;
			flipTimer = window.setTimeout(function () {
				rows.forEach(function (row) {
					row.style.transition = 'transform 460ms cubic-bezier(.22, .61, .36, 1)';
					row.style.transform = '';
				});
				flipTimer = window.setTimeout(function () {
					rows.forEach(function (row) {
						row.style.removeProperty('transition');
						row.style.removeProperty('transform');
					});
				}, 480);
			}, 20);
		}

		function repaintCitations(term) {
			rows.forEach(function (row) {
				var cited = Boolean(term) && rowCites(row, term);
				var chip = row.querySelector('.hp-about-citation-chip');
				row.classList.toggle('is-cited', cited);
				if (chip) {
					chip.textContent = cited ? 'cites ' + term : 'cites selected term';
					chip.hidden = !cited;
				}
			});
		}

		function restoreCanonicalOrder() {
			canonicalByLedger.forEach(function (record) {
				if (record.divider) {
					record.divider.hidden = true;
					record.ledger.insertBefore(record.divider, record.ledger.firstChild);
				}
				record.rows.forEach(function (row) {
					record.ledger.appendChild(row);
				});
			});
		}

		function reorderLedgers(term) {
			if (!term) {
				restoreCanonicalOrder();
				return;
			}

			canonicalByLedger.forEach(function (record) {
				var partition = partitionEvidenceRows(record.rows, term);
				partition.ordered.forEach(function (row, index) {
					if (record.divider && index === partition.dividerIndex) {
						record.divider.querySelector('.hp-about-ledger__divider-label').textContent = 'Not cited by ' + term;
						record.divider.hidden = false;
						record.ledger.appendChild(record.divider);
					}
					record.ledger.appendChild(row);
				});
				if (record.divider && partition.dividerIndex < 0) {
					record.divider.hidden = true;
				}
			});
		}

		function applyFilter(term) {
			var nextTerm = term && term === activeTerm ? null : term;
			var positions = capturePositions();
			activeTerm = nextTerm;
			reorderLedgers(activeTerm);
			repaintCitations(activeTerm);
			termButtons.forEach(function (entry) {
				entry.button.setAttribute('aria-pressed', entry.label === activeTerm ? 'true' : 'false');
			});
			writeReadout();
			clearButton.hidden = !activeTerm;
			var destinations = evidenceDestinations(canonicalByLedger, activeTerm);
			resultActions.replaceChildren();
			destinations.forEach(function (destination) {
				var link = document.createElement('a');
				link.href = '#' + destination.id;
				link.className = 'hp-about-skills__result';
				link.textContent = destination.label;
				// Explicit activation owns navigation, including repeat activation
				// when the URL already names this section.
				link.addEventListener('click', function (event) {
					if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.location.hash !== '#' + destination.id) { return; }
					event.preventDefault();
					var target = rootElement.querySelector('#' + destination.id);
					target.setAttribute('tabindex', '-1');
					target.focus({ preventScroll: true });
					target.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
				});
				resultActions.appendChild(link);
			});
			returnControls.forEach(function (entry) {
				entry.button.hidden = !destinations.some(function (destination) { return destination.id === entry.id; });
				entry.button.textContent = activeTerm ? 'Back to ' + activeTerm + ' filter' : 'Back to selected skill';
			});
			playFlip(positions);
		}

		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-skill-term'), function (termElement) {
			var label = termElement.textContent.trim();
			var count = countFor(label);
			if (!count) {
				termElement.classList.add('is-unbacked');
				termElement.setAttribute('aria-disabled', 'true');
				unbackedTerms.push(termElement);
				return;
			}

			var button = createButton(label, termElement.className + ' hp-about-skill-term__button');
			button.setAttribute('aria-pressed', 'false');
			button.setAttribute('aria-label', label + ', ' + count + ' cited ' + (count === 1 ? 'row' : 'rows'));
			termElement.replaceWith( button );
			termButtons.push({ button: button, label: label, source: termElement });
			button.addEventListener('click', function () {
				applyFilter(label);
			});
		});

		clearButton.addEventListener('click', function () {
			applyFilter(null);
			if (termButtons[0]) {
				termButtons[0].button.focus();
			}
		});

		function moveSkillIndex(event) {
			var isWide = typeof event.matches === 'boolean' ? event.matches : wideQuery.matches;
			var layoutWide = Boolean(isWide && !printViewActive);
			var usesRail = Boolean(layoutWide && skillIndex && railHost);
			var focusedNavigation = nav && document.activeElement && nav.contains(document.activeElement) ? document.activeElement : null;
			if (layoutWide && nav && heroContentsHost) {
				heroContentsHost.appendChild(nav);
			} else if (nav && !printViewActive) {
				rootElement.insertBefore(nav, rootElement.firstChild);
			} else if (nav && navHome && navHome.parentNode) {
				navHome.parentNode.insertBefore(nav, navHome.nextSibling);
			}
			closeSectionMenu(false);
			if (focusedNavigation) {
				// A breakpoint can hide the disclosure button or its links.
				// Move focus to the visible equivalent after relocating the nav.
				if (layoutWide && focusedNavigation === navToggle) {
					focusedNavigation = nav.querySelector('a[aria-current="location"]') || nav.querySelector('a');
				} else if (!layoutWide && !printViewActive) {
					focusedNavigation = navToggle;
				}
				try {
					focusedNavigation.focus({ preventScroll: true });
				} catch (error) {
					focusedNavigation.focus();
				}
			}
			setEducationRecordHeadingLevels(rootElement, usesRail ? 3 : 4);
			indexInRail = usesRail;
			if (usesRail) {
				railHost.appendChild( skillIndex );
				if (heading) {
					heading.textContent = 'Education';
				}
				if (eyebrow) {
					eyebrow.textContent = 'Credentials';
				}
				if (intro) {
					intro.textContent = RAIL_EDUCATION_INTRO;
				}
				setNavLinkLabel(navSkillsLink, 'Education');
				if (educationHeading) {
					educationHeading.hidden = true;
				}
				writeReadout();
			} else if (skillIndex && skillIndexHome && skillIndexHome.parentNode) {
				skillIndexHome.parentNode.insertBefore(skillIndex, skillIndexHome.nextSibling);
				if (heading) {
					heading.textContent = 'Skills index';
				}
				if (eyebrow) {
					eyebrow.textContent = 'Capabilities';
				}
				if (intro) {
					intro.textContent = 'Every term is a filter into the record above. Pick one and its evidence travels to the top of each ledger; the rest keep their place below a stated line. Faded terms have nothing on this page behind them yet.';
				}
				setNavLinkLabel(navSkillsLink, 'Skills');
				if (educationHeading) {
					educationHeading.hidden = false;
				}
				writeReadout();
			}
		}

		moveSkillIndex(wideQuery);
		chatCleanup = mountContactChat(rootElement);
		if (wideQuery.addEventListener) {
			wideQuery.addEventListener('change', moveSkillIndex);
			mediaListenerBound = true;
		} else {
			wideQuery.addListener(moveSkillIndex);
			mediaListenerBound = true;
		}

		if (earlier) {
			earlier.id = earlier.id || 'hp-about-earlier-roles';
			earlierToggle = createButton('Show 3 earlier roles', 'hp-about-earlier__toggle');
			earlierToggle.setAttribute('data-hp-about-generated', 'earlier-toggle');
			earlierToggle.setAttribute('aria-controls', earlier.id);
			earlierToggle.setAttribute('aria-expanded', 'false');
			earlier.parentNode.insertBefore(earlierToggle, earlier);
			generatedControls.push(earlierToggle);
			earlier.hidden = true;
			earlierToggle.addEventListener('click', function () {
				var expanded = earlierToggle.getAttribute('aria-expanded') === 'true';
				earlierToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
				earlierToggle.textContent = expanded ? 'Show 3 earlier roles' : 'Hide earlier roles';
				earlier.hidden = expanded;
			});
		}

		// The proof timeline. The markup ships five labelled steps with every
		// fold open; enhancement turns each label into a button, collapses the
		// folds that are not current, and hangs a reading pane under the spine
		// for the wide layout. `lit` is false for the unlit first paint: the
		// ARIA state names step 0 from the start, the classes wait for the boot
		// tick so the spine can sweep up to it.
		function paintTimeline(index, lit) {
			timelineStepElements.forEach(function (step, position) {
				var fold = step.querySelector('.hp-about-timeline__fold');
				step.classList.toggle('is-done', Boolean(lit) && position < index);
				step.classList.toggle('is-current', Boolean(lit) && position === index);
				if (timelineButtons[position]) {
					timelineButtons[position].button.setAttribute('aria-pressed', position === index ? 'true' : 'false');
				}
				if (fold) {
					fold.setAttribute('aria-hidden', position === index ? 'false' : 'true');
				}
			});
			if (timelinePanel) {
				timelinePanel.setAttribute('data-at', timelineAnchor(index, timelineStepElements.length));
			}
		}

		function fillTimelinePanel(index) {
			var step = timelineStepElements[index];
			var body = step ? step.querySelector('.hp-about-timeline__fold-body') : null;
			if (!timelineBubble || !body) {
				return;
			}
			while (timelineBubble.firstChild) {
				timelineBubble.removeChild(timelineBubble.firstChild);
			}
			// Child nodes, not children: the whitespace between the claim and
			// the destination travels too, so the pane reads exactly as the fold.
			Array.prototype.forEach.call(body.childNodes, function (child) {
				timelineBubble.appendChild(child.cloneNode(true));
			});
		}

		// `timelineTarget` is the latest request; `timelineCurrent` is what is
		// lit. They differ only while a swap is pending, and the latest request
		// always supersedes it — including a return to the lit step, which
		// cancels the pending swap instead of letting it land on the wrong step.
		function selectTimelineStep(index) {
			if (index === timelineTarget || !timelineStepElements[index]) {
				return;
			}
			timelineTarget = index;
			window.clearTimeout(timelineBootTimer);
			window.clearTimeout(timelineIntroTimer);
			window.clearTimeout(timelineSwapTimer);
			timelineSteps.classList.add('is-booted');
			timelineSteps.classList.remove('is-intro');
			if (index === timelineCurrent) {
				paintTimeline(index, true);
				timelinePanel.classList.remove('is-out');
				return;
			}
			timelinePanel.classList.add('is-out');
			// Opacity is the pane's first transition; computed durations are in
			// seconds. Reduced motion updates in this turn, without a blank pause.
			var swapDelay = reduceMotion.matches ? 0 :
				(parseFloat(window.getComputedStyle(timelinePanel).transitionDuration) || 0) * 1000;
			function finishSwap() {
				timelineSwapTimer = null;
				timelineCurrent = index;
				paintTimeline(index, true);
				fillTimelinePanel(index);
				timelinePanel.classList.remove('is-out');
			}
			if (swapDelay > 0) {
				timelineSwapTimer = window.setTimeout(finishSwap, swapDelay);
			} else {
				finishSwap();
			}
		}

		function handleTimelineKey(event) {
			var buttons = timelineButtons.map(function (entry) { return entry.button; });
			var next = nextTimelineStep(event.key, buttons.indexOf(document.activeElement), buttons.length);
			if (next === null) {
				return;
			}
			event.preventDefault();
			buttons[next].focus();
			selectTimelineStep(next);
		}

		if (timelineSteps && timelineStepElements.length) {
			timelineSteps.setAttribute('role', 'group');
			timelineSteps.setAttribute('aria-label', TIMELINE_GROUP_LABEL);
			timelineStepElements.forEach(function (step, position) {
				var label = step.querySelector('.hp-about-timeline__label');
				var button;
				if (!label) {
					return;
				}
				button = document.createElement('button');
				button.type = 'button';
				button.className = label.className;
				button.setAttribute('aria-pressed', 'false');
				while (label.firstChild) {
					button.appendChild(label.firstChild);
				}
				label.replaceWith(button);
				timelineButtons.push({ button: button, source: label });
				button.addEventListener('click', function () {
					selectTimelineStep(position);
				});
				step.classList.toggle('is-last', position === timelineStepElements.length - 1);
			});
			timelinePanel = document.createElement('div');
			timelinePanel.className = 'hp-about-timeline__panel is-out';
			timelinePanel.setAttribute('data-hp-about-generated', 'timeline-panel');
			timelinePanel.setAttribute('aria-live', 'polite');
			timelineBubble = document.createElement('div');
			timelineBubble.className = 'hp-about-timeline__bubble';
			timelinePanel.appendChild(timelineBubble);
			timelineSteps.insertAdjacentElement('afterend', timelinePanel);
			generatedControls.push(timelinePanel);
			timelineSteps.addEventListener('keydown', handleTimelineKey);
			timelineCurrent = 0;
			timelineTarget = 0;
			paintTimeline(timelineCurrent, false);
			fillTimelinePanel(timelineCurrent);
			// A timer, not requestAnimationFrame: rAF stalls while the page is
			// hidden and the spine would never light.
			timelineBootTimer = window.setTimeout(function () {
				timelineSteps.classList.add('is-booted', 'is-intro');
				paintTimeline(timelineCurrent, true);
				timelinePanel.classList.remove('is-out');
				timelineIntroTimer = window.setTimeout(function () {
					timelineSteps.classList.remove('is-intro');
				}, TIMELINE_INTRO_WINDOW);
			}, TIMELINE_BOOT_DELAY);
		}

		function preparePrintContent() {
			applyFilter(null);
			restoreCanonicalOrder();
			moveSkillIndex({ matches: false });
			rootElement.classList.add('is-print-mode');
			if (earlier) {
				earlier.hidden = false;
			}
			// Every fold prints, so none of them may stay hidden from assistive
			// technology while the print layout is on screen.
			timelineStepElements.forEach(function (step) {
				var fold = step.querySelector('.hp-about-timeline__fold');
				if (fold) {
					fold.setAttribute('aria-hidden', 'false');
				}
			});
		}

		function restoreResponsiveContent() {
			rootElement.classList.remove('is-print-mode');
			moveSkillIndex(wideQuery);
			if (earlier && earlierToggle) {
				earlier.hidden = earlierToggle.getAttribute('aria-expanded') !== 'true';
			}
			if (timelineSteps && timelineCurrent >= 0) {
				paintTimeline(timelineCurrent, timelineSteps.classList.contains('is-booted'));
			}
		}

		function enterPrintView(event) {
			if (event && event.preventDefault) {
				event.preventDefault();
			}
			printReturnTarget = event && event.currentTarget ? event.currentTarget : null;
			printViewActive = true;
			preparePrintContent();
			document.documentElement.classList.add('has-about-v3-print-view');
			if (printToolbar) {
				printToolbar.hidden = false;
				var printButton = printToolbar.querySelector('.hp-about-print-view__print');
				if (printButton) {
					try {
						printButton.focus({ preventScroll: true });
					} catch (error) {
						printButton.focus();
					}
				}
			}
		}

		function exitPrintView(options) {
			var restoreFocus = !options || options.restoreFocus !== false;
			var returnTarget = printReturnTarget;
			printViewActive = false;
			document.documentElement.classList.remove('has-about-v3-print-view');
			if (printToolbar) {
				printToolbar.hidden = true;
			}
			restoreResponsiveContent();
			printReturnTarget = null;
			if (restoreFocus && returnTarget && document.documentElement.contains(returnTarget)) {
				try {
					returnTarget.focus({ preventScroll: true });
				} catch (error) {
					returnTarget.focus();
				}
			}
		}

		function printFromView() {
			window.print();
		}

		function prepareNativePrint() {
			nativePrintWasTemporary = !printViewActive;
			preparePrintContent();
		}

		function finishNativePrint() {
			if (nativePrintWasTemporary) {
				restoreResponsiveContent();
			}
			nativePrintWasTemporary = false;
		}

		window.addEventListener('beforeprint', prepareNativePrint);
		window.addEventListener('afterprint', finishNativePrint);

		var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('.hp-about-nav__list a[href^="#"]')) : [];
		var sections = links.map(function (link) {
			return rootElement.querySelector(link.getAttribute('href'));
		}).filter(Boolean);
		if ('IntersectionObserver' in window && sections.length) {
			sectionObserver = new IntersectionObserver(function (entries) {
				var visible = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) {
					return a.boundingClientRect.top - b.boundingClientRect.top;
				});
				if (!visible[0]) {
					return;
				}
				links.forEach(function (link) {
					var active = link.getAttribute('href') === '#' + visible[0].target.id;
					link.classList.toggle('is-active', active);
					if (active) {
						link.setAttribute('aria-current', 'location');
					} else {
						link.removeAttribute('aria-current');
					}
				});
			}, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });
			sections.forEach(function (section) { sectionObserver.observe(section); });
		}

		function dispose() {
			if (state.disposed) {
				return;
			}
			state.disposed = true;
			if (chatCleanup) { chatCleanup(); }
			if (nav) {
				nav.removeEventListener('keydown', onSectionKey);
				nav.removeEventListener('click', onSectionClick);
				nav.removeEventListener('focusout', onSectionFocusOut);
				nav.classList.remove('is-open');
			}
			document.removeEventListener('pointerdown', onOutsideSection);
			window.clearTimeout(flipTimer);
			if (mediaListenerBound) {
				if (wideQuery.removeEventListener) {
					wideQuery.removeEventListener('change', moveSkillIndex);
				} else {
					wideQuery.removeListener(moveSkillIndex);
				}
			}
			window.clearTimeout(timelineBootTimer);
			window.clearTimeout(timelineIntroTimer);
			window.clearTimeout(timelineSwapTimer);
			window.removeEventListener('beforeprint', prepareNativePrint);
			window.removeEventListener('afterprint', finishNativePrint);
			if (sectionObserver) {
				sectionObserver.disconnect();
			}
			activeTerm = null;
			printViewActive = false;
			printReturnTarget = null;
			document.documentElement.classList.remove('has-about-v3-print-view');
			restoreCanonicalOrder();
			rows.forEach(function (row) { row.removeAttribute('data-hp-about-order'); });
			repaintCitations(null);
			moveSkillIndex({ matches: false });
			if (nav && navHome && navHome.parentNode) {
				navHome.parentNode.insertBefore(nav, navHome.nextSibling);
			}
			if (navList) {
				if (navListOriginalId === null) { navList.removeAttribute('id'); }
				else { navList.id = navListOriginalId; }
			}
			termButtons.forEach(function (entry) {
				if (entry.button.parentNode) {
					entry.button.replaceWith(entry.source);
				}
			});
			unbackedTerms.forEach(function (term) {
				term.classList.remove('is-unbacked');
				term.removeAttribute('aria-disabled');
			});
			if (timelineSteps) {
				timelineSteps.removeEventListener('keydown', handleTimelineKey);
				timelineSteps.classList.remove('is-booted', 'is-intro');
				timelineSteps.removeAttribute('role');
				timelineSteps.removeAttribute('aria-label');
			}
			timelineButtons.forEach(function (entry) {
				if (entry.button.parentNode) {
					while (entry.button.firstChild) {
						entry.source.appendChild(entry.button.firstChild);
					}
					entry.button.replaceWith(entry.source);
				}
			});
			timelineStepElements.forEach(function (step) {
				var fold = step.querySelector('.hp-about-timeline__fold');
				step.classList.remove('is-done', 'is-current', 'is-last');
				if (fold) {
					fold.removeAttribute('aria-hidden');
				}
			});
			timelineCurrent = -1;
			timelineTarget = -1;
			generatedControls.forEach(function (control) {
				if (control.parentNode) {
					control.remove();
				}
			});
			Array.prototype.forEach.call(rootElement.querySelectorAll('[data-hp-about-generated="divider"], [data-hp-about-generated="citation"]'), function (generated) {
				generated.remove();
			});
			if (skillIndexHome && skillIndexHome.parentNode) {
				skillIndexHome.remove();
			}
			if (navHome && navHome.parentNode) {
				navHome.remove();
			}
			if (earlier) {
				earlier.hidden = false;
				if (earlierOriginalId === null) {
					earlier.removeAttribute('id');
				} else {
					earlier.setAttribute('id', earlierOriginalId);
				}
			}
			if (readout) {
				readout.textContent = readoutOriginalText;
				if (!readoutHadAriaLive) {
					readout.removeAttribute('aria-live');
				}
			}
			links.forEach(function (link) {
				link.classList.remove('is-active');
				link.removeAttribute('aria-current');
			});
			rootElement.classList.remove('is-enhanced', 'is-print-mode');
			document.documentElement.classList.remove('has-about-v3');
			document.documentElement.style.removeProperty('--hp-about-header-height');
			if (mountedRoots) {
				mountedRoots.delete(rootElement);
			}
			if (activeState === state) {
				activeState = null;
			}
		}

		var state = {
			applyFilter: applyFilter,
			dispose: dispose,
			disposed: false,
			enterPrintView: enterPrintView,
			exitPrintView: exitPrintView,
			restoreCanonicalOrder: restoreCanonicalOrder,
			root: rootElement,
			selectTimelineStep: selectTimelineStep
		};
		if (mountedRoots) {
			mountedRoots.set(rootElement, state);
		}
		activeState = state;
		return state;
	}

	function updateHeaderHeight() {
		var header = document.querySelector('.hp-site-header, header.wp-block-template-part');
		var height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
		document.documentElement.style.setProperty('--hp-about-header-height', height + 'px');
		return header;
	}

	function settle() {
		if (typeof document === 'undefined') {
			return;
		}

		var rootElement = document.querySelector('.hp-about-resume-v3');
		if (activeState && (!rootElement || activeState.root !== rootElement)) {
			activeState.dispose();
		}
		if (rootElement) {
			activeState = mount(rootElement);
		} else {
			document.documentElement.classList.remove('has-about-v3');
			document.documentElement.style.removeProperty('--hp-about-header-height');
		}

		var header = rootElement ? updateHeaderHeight() : null;
		if (header !== observedHeader && headerResizeObserver) {
			headerResizeObserver.disconnect();
			headerResizeObserver = null;
		}
		observedHeader = header;
		if (header && 'ResizeObserver' in window && !headerResizeObserver) {
			headerResizeObserver = new ResizeObserver(updateHeaderHeight);
			headerResizeObserver.observe(header);
		}
	}

	function scheduleSettle() {
		window.requestAnimationFrame(settle);
		window.setTimeout(settle, 120);
	}

	function boot() {
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return;
		}

		var registry = window.__hpAboutResumeController || {};
		registry.settle = settle;
		registry.mount = mount;
		window.__hpAboutResumeController = registry;

		if (!registry.historyWrapped && window.history && window.history.pushState) {
			var pushState = window.history.pushState;
			var replaceState = window.history.replaceState;
			window.history.pushState = function () {
				var result = pushState.apply(this, arguments);
				scheduleSettle();
				return result;
			};
			window.history.replaceState = function () {
				var result = replaceState.apply(this, arguments);
				scheduleSettle();
				return result;
			};
			registry.historyWrapped = true;
		}

		if (!registry.listenersBound) {
			window.addEventListener('popstate', scheduleSettle);
			window.addEventListener('pageshow', scheduleSettle);
			document.addEventListener('DOMContentLoaded', settle, { once: true });
			registry.listenersBound = true;
		}

		settle();
	}

	boot();

	return {
		IDLE_READOUT: IDLE_READOUT,
		UNBACKED_COUNT: UNBACKED_COUNT,
		buildIndex: buildIndex,
		evidenceDestinations: evidenceDestinations,
		createPrintViewToolbar: createPrintViewToolbar,
		formatRailReadout: formatRailReadout,
		formatReadout: formatReadout,
		mount: mount,
		nextTimelineStep: nextTimelineStep,
		partitionEvidenceRows: partitionEvidenceRows,
		setEducationRecordHeadingLevels: setEducationRecordHeadingLevels,
		settle: settle,
		termSlug: termSlug,
		timelineAnchor: timelineAnchor
	};
});

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
	var UNBACKED_COUNT = '—';
	var TIMELINE_GROUP_LABEL = 'Proof at a glance, in order';
	// The proof stepper's clock. First paint is unlit; the state resolves to the
	// real step after the boot tick, and the intro stagger runs for the window
	// after that or until the first selection. The swap delay is the reading
	// pane's fade-out before the step and its content change together.
	var TIMELINE_BOOT_DELAY = 60;
	var TIMELINE_INTRO_WINDOW = 1800;
	var TIMELINE_SWAP_DELAY = 160;
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

	function deriveDimmedRows(rows, activeTerm) {
		return (rows || []).map(function (row) {
			return Boolean(activeTerm) && !rowCites(row, activeTerm);
		});
	}

	function applyDimmedRows(rows, activeTerm) {
		var mountedRows = rows || [];
		var dimmedRows = deriveDimmedRows(mountedRows, activeTerm);
		mountedRows.forEach(function (row, index) {
			row.classList.toggle('is-dimmed', dimmedRows[index]);
		});
		return dimmedRows;
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
				row.classList.remove('is-cited', 'is-dimmed');
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
		if (navSkillsLink) { navSkillsLink.textContent = 'Skills'; }
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
				ledger: ledger,
				divider: ledger.querySelector('.hp-about-ledger__divider'),
				rows: Array.prototype.slice.call(ledger.querySelectorAll('.hp-about-index-row'))
			};
		});
		var activeTerm = null;
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
			clearButton.hidden = true;
			clearButton.setAttribute('data-hp-about-generated', 'clear-filter');
			controls.appendChild(clearButton);
			generatedControls.push(clearButton);
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

		function capturePositions() {
			var positions = new Map();
			if (reduceMotion.matches) {
				return positions;
			}
			rows.forEach(function (row) {
				positions.set(row, row.getBoundingClientRect());
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
				var after = row.getBoundingClientRect();
				var deltaY = before ? before.top - after.top : 0;
				if (!deltaY) {
					return;
				}
				row.style.transition = 'transform 0s';
				row.style.transform = 'translateY(' + deltaY + 'px)';
			});
			window.requestAnimationFrame(function () {
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
			});
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
			applyDimmedRows(rows, activeTerm);
			termButtons.forEach(function (entry) {
				entry.button.setAttribute('aria-pressed', entry.label === activeTerm ? 'true' : 'false');
			});
			if (readout) {
				readout.textContent = formatReadout(activeTerm, activeTerm ? countFor(activeTerm) : 0);
			}
			clearButton.hidden = !activeTerm;
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
			} else if (nav && navHome && navHome.parentNode) {
				navHome.parentNode.insertBefore(nav, navHome.nextSibling);
			}
			if (focusedNavigation && document.activeElement !== focusedNavigation) {
				try {
					focusedNavigation.focus({ preventScroll: true });
				} catch (error) {
					focusedNavigation.focus();
				}
			}
			setEducationRecordHeadingLevels(rootElement, usesRail ? 3 : 4);
			if (usesRail) {
				railHost.appendChild( skillIndex );
				if (heading) {
					heading.textContent = 'Education';
				}
				if (eyebrow) {
					eyebrow.textContent = 'Credentials';
				}
				if (intro) {
					intro.textContent = '';
				}
				if (navSkillsLink) {
					navSkillsLink.textContent = 'Education';
				}
				if (educationHeading) {
					educationHeading.hidden = true;
				}
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
				if (navSkillsLink) {
					navSkillsLink.textContent = 'Skills';
				}
				if (educationHeading) {
					educationHeading.hidden = false;
				}
			}
		}

		moveSkillIndex(wideQuery);
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
			timelineSwapTimer = window.setTimeout(function () {
				timelineCurrent = index;
				paintTimeline(index, true);
				fillTimelinePanel(index);
				timelinePanel.classList.remove('is-out');
			}, TIMELINE_SWAP_DELAY);
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
			applyDimmedRows(rows, null);
			moveSkillIndex({ matches: false });
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
		applyDimmedRows: applyDimmedRows,
		buildIndex: buildIndex,
		createPrintViewToolbar: createPrintViewToolbar,
		deriveDimmedRows: deriveDimmedRows,
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

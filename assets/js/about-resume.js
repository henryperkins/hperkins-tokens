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
		Array.prototype.forEach.call(rootElement.querySelectorAll('[data-hp-about-generated], .hp-about-skills__clear, .hp-about-earlier__toggle, .hp-about-copy, .hp-about-copy__status'), function (generated) {
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
				if (comment.data === 'hp-about-skill-index-home') {
					comments.push(comment);
				}
			}
			comments.forEach(function (comment) { comment.remove(); });
		}
		rootElement.classList.remove('is-enhanced', 'is-print-mode');
		document.documentElement.classList.remove('has-about-v3');
		document.documentElement.style.removeProperty('--hp-about-header-height');
	}

	function copyText(text) {
		if (navigator.clipboard && window.isSecureContext) {
			return navigator.clipboard.writeText(text);
		}

		return new Promise(function (resolve, reject) {
			var input = document.createElement('textarea');
			input.value = text;
			input.setAttribute('readonly', '');
			input.style.position = 'fixed';
			input.style.opacity = '0';
			document.body.appendChild(input);
			input.select();

			try {
				document.execCommand('copy');
				resolve();
			} catch (error) {
				reject(error);
			}

			input.remove();
		});
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
		var copyStates = [];
		var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		var skillIndex = rootElement.querySelector('.hp-about-skill-index');
		var skillSection = rootElement.querySelector('#skills');
		var skillIndexHome = skillIndex ? document.createComment('hp-about-skill-index-home') : null;
		var railHost = rootElement.querySelector('.hp-about-rail__index-host');
		var wideQuery = window.matchMedia('(min-width: 64rem)');
		var readout = rootElement.querySelector('.hp-about-skills__readout');
		var controls = rootElement.querySelector('.hp-about-skills__controls');
		var clearButton = createButton('Clear filter', 'hp-about-skills__clear');
		var earlier = rootElement.querySelector('.hp-about-earlier');
		var earlierOriginalId = earlier ? earlier.getAttribute('id') : null;
		var earlierToggle = null;
		var printLink = rootElement.querySelector('.hp-about-print-control a');
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

		rootElement.classList.add('is-enhanced');
		document.documentElement.classList.add('has-about-v3');

		if (skillIndex && skillIndex.parentNode) {
			skillIndex.parentNode.insertBefore(skillIndexHome, skillIndex);
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
			var usesRail = Boolean(isWide && skillIndex && railHost);
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

		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-contact__email'), function (emailLink) {
			var copyButton = createButton('Copy', 'hp-about-copy');
			var status = document.createElement('span');
			var copyState = { button: copyButton, status: status, statusTimer: null };
			copyButton.setAttribute('aria-label', 'Copy email address');
			copyButton.setAttribute('data-hp-about-generated', 'copy');
			status.className = 'hp-about-copy__status';
			status.setAttribute('role', 'status');
			status.setAttribute('data-hp-about-generated', 'copy-status');
			status.hidden = true;
			emailLink.insertAdjacentElement('afterend', copyButton);
			copyButton.insertAdjacentElement('afterend', status);
			generatedControls.push(copyButton, status);
			copyStates.push(copyState);
			copyButton.addEventListener('click', function () {
				copyText(emailLink.textContent.trim()).then(function () {
					status.textContent = 'Copied';
					status.hidden = false;
					window.clearTimeout(copyState.statusTimer);
					copyState.statusTimer = window.setTimeout(function () {
						status.hidden = true;
						status.textContent = '';
					}, 1800);
				}).catch(function () {
					status.textContent = 'Copy failed';
					status.hidden = false;
				});
			});
		});

		function preparePrint() {
			applyFilter(null);
			restoreCanonicalOrder();
			moveSkillIndex({ matches: false });
			rootElement.classList.add('is-print-mode');
			if (earlier) {
				earlier.hidden = false;
			}
		}

		function finishPrint() {
			rootElement.classList.remove('is-print-mode');
			moveSkillIndex(wideQuery);
			if (earlier && earlierToggle) {
				earlier.hidden = earlierToggle.getAttribute('aria-expanded') !== 'true';
			}
		}

		function handlePrintClick(event) {
			event.preventDefault();
			preparePrint();
			window.print();
		}

		if (printLink) {
			printLink.addEventListener('click', handlePrintClick);
		}
		window.addEventListener('beforeprint', preparePrint);
		window.addEventListener('afterprint', finishPrint);

		var nav = rootElement.querySelector('.hp-about-nav');
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
			if (printLink) {
				printLink.removeEventListener('click', handlePrintClick);
			}
			window.removeEventListener('beforeprint', preparePrint);
			window.removeEventListener('afterprint', finishPrint);
			if (sectionObserver) {
				sectionObserver.disconnect();
			}
			activeTerm = null;
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
			copyStates.forEach(function (copyState) {
				window.clearTimeout(copyState.statusTimer);
			});
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
			restoreCanonicalOrder: restoreCanonicalOrder,
			root: rootElement
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
		deriveDimmedRows: deriveDimmedRows,
		formatReadout: formatReadout,
		mount: mount,
		partitionEvidenceRows: partitionEvidenceRows,
		setEducationRecordHeadingLevels: setEducationRecordHeadingLevels,
		settle: settle,
		termSlug: termSlug
	};
});

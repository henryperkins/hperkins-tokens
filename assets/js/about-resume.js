(function (root, factory) {
	'use strict';

	if (typeof module === 'object' && module.exports) {
		module.exports = factory();
		return;
	}

	root.HPAboutResume = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
	'use strict';

	var IDLE_READOUT = 'Pick a term to dim every contribution and role that does not mention it. Numbers count the rows above.';
	// A term nothing on the page backs owes a count it cannot pay.
	var UNBACKED_COUNT = '—';
	var mountedRoots = typeof WeakMap === 'function' ? new WeakMap() : null;

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
			var result = {
				name: group.name,
				terms: group.terms.slice(),
				backed: backed,
				total: group.terms.length,
				coverage: backed + '/' + group.terms.length + ' backed above'
			};

			return result;
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
		if (!activeTerm) {
			return (rows || []).map(function () { return false; });
		}

		var activeSlug = termSlug(activeTerm);
		return (rows || []).map(function (row) {
			return !rowTerms(row).some(function (term) {
				return termSlug(term) === activeSlug;
			});
		});
	}

	function formatReadout(activeTerm, count) {
		if (!activeTerm) {
			return IDLE_READOUT;
		}

		return activeTerm + ' — ' + count + ' ' + (count === 1 ? 'row above matches' : 'rows above match') + '; the rest are dimmed.';
	}

	function createButton(label, className) {
		var button = document.createElement('button');
		button.type = 'button';
		button.className = className;
		button.textContent = label;
		return button;
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
		if (!rootElement || (mountedRoots && mountedRoots.has(rootElement))) {
			return mountedRoots ? mountedRoots.get(rootElement) : null;
		}

		var rows = Array.prototype.slice.call(rootElement.querySelectorAll('.hp-about-index-row'));
		var skillTerms = Array.prototype.slice.call(rootElement.querySelectorAll('.hp-about-skill-term'));
		var activeTerm = null;
		var printMode = false;
		var earlier = rootElement.querySelector('.hp-about-earlier');
		var earlierToggle = null;
		var readout = document.createElement('p');
		var clearButton = createButton('Clear filter', 'hp-about-skills__clear');
		var controls = document.createElement('div');
		var termButtons = [];

		readout.className = 'hp-about-skills__readout';
		readout.setAttribute('role', 'status');
		readout.setAttribute('aria-live', 'polite');
		readout.textContent = IDLE_READOUT;
		controls.className = 'hp-about-skills__controls';
		controls.appendChild(readout);
		controls.appendChild(clearButton);
		clearButton.hidden = true;

		var skillGroups = rootElement.querySelector('.hp-about-skill-groups');
		if (skillGroups) {
			skillGroups.parentNode.insertBefore(controls, skillGroups);
		}

		function rowHasSlug(row, slug) {
			return row.classList.contains('hp-term--' + slug);
		}

		function countForSlug(slug) {
			return rows.filter(function (row) { return rowHasSlug(row, slug); }).length;
		}

		function applyFilter(term, slug) {
			activeTerm = term || null;
			rows.forEach(function (row) {
				row.classList.toggle('is-dimmed', Boolean(slug) && !rowHasSlug(row, slug));
			});
			termButtons.forEach(function (entry) {
				entry.button.setAttribute('aria-pressed', entry.slug === slug ? 'true' : 'false');
			});
			readout.textContent = formatReadout(activeTerm, slug ? countForSlug(slug) : 0);
			clearButton.hidden = !activeTerm;
		}

		skillTerms.forEach(function (termElement) {
			var labelElement = termElement.querySelector('.hp-about-skill-term__label');
			var countElement = termElement.querySelector('.hp-about-skill-term__count');
			var label = labelElement ? labelElement.textContent.trim() : '';
			var slugClass = Array.prototype.find.call(termElement.classList, function (className) {
				return className.indexOf('hp-term--') === 0;
			});
			var slug = slugClass ? slugClass.slice('hp-term--'.length) : termSlug(label);
			var count = countForSlug(slug);
			var backed = count > 0;

			if (countElement) {
				countElement.textContent = backed ? String(count) : UNBACKED_COUNT;
			}

			if (!labelElement || !label) {
				return;
			}

			termElement.classList.toggle('is-unbacked', !backed);

			// Nothing above backs this term, so it stays a statement rather than
			// becoming a control: no button, no hover, no click, an em-dash count.
			if (!backed) {
				return;
			}

			var button = createButton(label, 'hp-about-skill-term__button');
			button.setAttribute('aria-pressed', 'false');
			button.setAttribute('aria-label', label + ', ' + count + ' matching ' + (count === 1 ? 'row' : 'rows'));
			labelElement.textContent = '';
			labelElement.appendChild(button);
			termButtons.push({ button: button, label: label, slug: slug });

			button.addEventListener('click', function () {
				applyFilter(activeTerm === label ? null : label, activeTerm === label ? null : slug);
			});
		});

		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-skill-group'), function (group) {
			var terms = Array.prototype.slice.call(group.querySelectorAll('.hp-about-skill-term'));
			var coverage = group.querySelector('.hp-about-skill-group__coverage');
			var backed = terms.filter(function (term) { return !term.classList.contains('is-unbacked'); }).length;
			if (coverage) {
				coverage.textContent = backed + '/' + terms.length + ' backed above';
			}
		});

		clearButton.addEventListener('click', function () {
			applyFilter(null, null);
			if (termButtons[0]) {
				termButtons[0].button.focus();
			}
		});

		if (earlier) {
			earlier.id = earlier.id || 'hp-about-earlier-roles';
			earlier.hidden = true;
			earlierToggle = createButton('Show 3 earlier roles', 'hp-about-earlier__toggle');
			earlierToggle.setAttribute('aria-controls', earlier.id);
			earlierToggle.setAttribute('aria-expanded', 'false');
			earlier.parentNode.insertBefore(earlierToggle, earlier);
			earlierToggle.addEventListener('click', function () {
				var expanded = earlierToggle.getAttribute('aria-expanded') === 'true';
				earlierToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
				earlierToggle.textContent = expanded ? 'Show 3 earlier roles' : 'Hide earlier roles';
				earlier.hidden = expanded;
			});
		}

		Array.prototype.forEach.call(rootElement.querySelectorAll('.hp-about-contact__email'), function (emailLink) {
			var copyButton = createButton('Copy', 'hp-about-copy');
			copyButton.setAttribute('aria-label', 'Copy email address');
			emailLink.insertAdjacentElement('afterend', copyButton);
			copyButton.addEventListener('click', function () {
				copyText(emailLink.textContent.trim()).then(function () {
					copyButton.textContent = 'Copied';
					window.setTimeout(function () { copyButton.textContent = 'Copy'; }, 1800);
				}).catch(function () {
					copyButton.textContent = 'Copy failed';
					window.setTimeout(function () { copyButton.textContent = 'Copy'; }, 1800);
				});
			});
		});

		var rail = rootElement.querySelector('.hp-about-rail');
		var printControls = null;

		function exitPrintMode() {
			printMode = false;
			rootElement.classList.remove('is-print-mode');
			if (printControls) {
				printControls.classList.remove('is-ready');
			}
			if (earlier && earlierToggle) {
				earlier.hidden = earlierToggle.getAttribute('aria-expanded') !== 'true';
			}
		}

		function enterPrintMode() {
			printMode = true;
			applyFilter(null, null);
			rootElement.classList.add('is-print-mode');
			if (earlier) {
				earlier.hidden = false;
			}
			if (printControls) {
				printControls.classList.add('is-ready');
			}
		}

		if (rail) {
			printControls = document.createElement('div');
			printControls.className = 'hp-about-print';
			var preparePrint = createButton('Print', 'hp-about-print__prepare');
			var printButton = createButton('Print / Save PDF', 'hp-about-print__submit');
			var exitButton = createButton('Exit print view', 'hp-about-print__exit');
			printControls.appendChild(preparePrint);
			printControls.appendChild(printButton);
			printControls.appendChild(exitButton);
			rail.appendChild(printControls);
			preparePrint.addEventListener('click', enterPrintMode);
			printButton.addEventListener('click', function () {
				enterPrintMode();
				window.print();
			});
			exitButton.addEventListener('click', exitPrintMode);
			window.addEventListener('afterprint', function () {
				if (printMode) {
					exitPrintMode();
				}
			});
		}

		var links = rail ? Array.prototype.slice.call(rail.querySelectorAll('a[href^="#"]')) : [];
		var sections = links.map(function (link) {
			return document.getElementById(link.getAttribute('href').slice(1));
		}).filter(Boolean);

		if ('IntersectionObserver' in window && sections.length) {
			var sectionObserver = new IntersectionObserver(function (entries) {
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
			}, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.01] });
			sections.forEach(function (section) { sectionObserver.observe(section); });
		}

		var state = {
			applyFilter: applyFilter,
			enterPrintMode: enterPrintMode,
			exitPrintMode: exitPrintMode
		};
		if (mountedRoots) {
			mountedRoots.set(rootElement, state);
		}

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

		Array.prototype.forEach.call(document.querySelectorAll('.hp-about-resume'), mount);
		var header = updateHeaderHeight();
		if (header && 'ResizeObserver' in window && !header.__hpAboutResizeObserver) {
			header.__hpAboutResizeObserver = new ResizeObserver(updateHeaderHeight);
			header.__hpAboutResizeObserver.observe(header);
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
		deriveDimmedRows: deriveDimmedRows,
		formatReadout: formatReadout,
		mount: mount,
		settle: settle,
		termSlug: termSlug
	};
});

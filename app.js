(function () {
  'use strict';

  var STORAGE_KEY = 'kalkulationsbaukasten.document.v2';
  var COLORS = ['#F2A65A', '#F1C27D', '#E8B4A0', '#D99CA3', '#C7B7E8', '#AFC4E9', '#9FC9D5', '#A8DADC', '#BFD7B5', '#D6E3A3', '#F0D98C', '#F3B6A2', '#C9ADA7', '#B7B7A4', '#D8C3A5', '#B5C7A8', '#A6C8B3', '#A7C7E7', '#D3C0E8', '#E7A6B3'];
  var EMOJIS = ['🍕', '🥐', '🍰', '☕', '🧾', '💶', '🧮', '📦', '🛒', '🏷️', '📋', '✨', '🔧', '🏠', '🌿', '🍋'];
  var CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP'];
  var VALUE_TYPES = { number: 'Zahl', currency: 'Währung', weight: 'Gewicht', percent: 'Prozent', date: 'Datum' };
  var FORMULA_VALUE_TYPES = { number: 'Zahl', currency: 'Währung', weight: 'Gewicht', percent: 'Prozent' };
  var ELEMENT_TYPES = { text: 'Text', number: 'Zahl', formula: 'Formel' };
  var OPERATORS = {
    add: { label: 'Addieren', symbol: '+', min: 2, many: true },
    subtract: { label: 'Subtrahieren', symbol: '-', min: 2, many: false },
    multiply: { label: 'Multiplizieren', symbol: '×', min: 2, many: true },
    divide: { label: 'Dividieren', symbol: '÷', min: 2, many: false },
    percent: { label: 'Prozent', symbol: '%', min: 2, many: false },
    sum: { label: 'Summe', symbol: '+', min: 1, many: true },
    average: { label: 'Durchschnitt', symbol: 'Ø', min: 1, many: true }
  };

  var app = document.getElementById('app');
  var state = {
    doc: null,
    currentPageId: null,
    modeByPage: {},
    sheet: null,
    activeElementId: null,
    activeSectionId: null,
    activeInput: false,
    toast: null,
    undo: null
  };

  init();

  function init() {
    state.doc = loadDocument();
    registerServiceWorker();
    setupViewportTracking();
    bindEvents();
    render();
  }

  function bindEvents() {
    app.addEventListener('click', handleClick);
    app.addEventListener('input', handleInput);
    app.addEventListener('change', handleChange);
    document.addEventListener('focusin', function (event) {
      if (isInput(event.target)) {
        state.activeInput = true;
        syncToolbarClass();
      }
    });
    document.addEventListener('focusout', function () {
      window.setTimeout(function () {
        state.activeInput = isInput(document.activeElement);
        syncToolbarClass();
      }, 80);
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  function setupViewportTracking() {
    function update() {
      var offset = 0;
      if (window.visualViewport) {
        offset = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
      }
      document.documentElement.style.setProperty('--keyboard-offset', offset + 'px');
      syncToolbarClass();
    }
    update();
    window.addEventListener('resize', update);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', update);
      window.visualViewport.addEventListener('scroll', update);
    }
  }

  function loadDocument() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.schemaVersion === 2 && parsed.sections && parsed.elements) return parsed;
      }
    } catch (error) {}
    var seeded = createSeedDocument();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function createSeedDocument() {
    var t = now();
    var folderId = uid('folder');
    var pageId = uid('page');
    var salamiSection = uid('section');
    var margaritaSection = uid('section');
    var e1 = uid('element');
    var e2 = uid('element');
    var e3 = uid('element');
    var e4 = uid('element');
    var e5 = uid('element');
    var e6 = uid('element');
    var e7 = uid('element');
    var e8 = uid('element');
    var e9 = uid('element');
    var e10 = uid('element');
    var e11 = uid('element');
    var e12 = uid('element');
    var doc = {
      schemaVersion: 2,
      meta: { workspaceId: uid('workspace'), createdAt: t, updatedAt: t, version: 1 },
      settings: { theme: 'dark' },
      folders: [stamp({ id: folderId, name: 'Rezepte', isOpen: true, sortIndex: 0 })],
      pages: [stamp({ id: pageId, folderId: folderId, name: 'Pizza Kalkulation', icon: '🍕', color: COLORS[0], sortIndex: 0, sectionOrder: [salamiSection, margaritaSection] })],
      sections: {},
      elements: {}
    };
    doc.sections[salamiSection] = stamp({ id: salamiSection, pageId: pageId, name: 'Salami Pizza', color: COLORS[0], elementOrder: [e1, e2, e3, e4, e5, e6] });
    doc.sections[margaritaSection] = stamp({ id: margaritaSection, pageId: pageId, name: 'Margarita', color: COLORS[1], elementOrder: [e7, e8, e9, e10, e11, e12] });
    addSeedNumber(doc, e1, pageId, salamiSection, 'Anzahl', 1, 'number', '', COLORS[5], true, false);
    addSeedText(doc, e2, pageId, salamiSection, 'Mehl', COLORS[12], false);
    addSeedNumber(doc, e3, pageId, salamiSection, 'Menge', 150, 'weight', 'g', COLORS[2], false, false);
    addSeedNumber(doc, e4, pageId, salamiSection, 'Anzahl', 1, 'number', '', COLORS[5], true, true);
    addSeedText(doc, e5, pageId, salamiSection, 'Soße', COLORS[12], false);
    addSeedFormula(doc, e6, pageId, salamiSection, 'Gesamt', [e3], COLORS[0], false);
    addSeedNumber(doc, e7, pageId, margaritaSection, 'Anzahl', 1, 'number', '', COLORS[5], true, false);
    addSeedText(doc, e8, pageId, margaritaSection, 'Mehl', COLORS[12], false);
    addSeedNumber(doc, e9, pageId, margaritaSection, 'Menge', 150, 'weight', 'g', COLORS[2], false, false);
    addSeedNumber(doc, e10, pageId, margaritaSection, 'Anzahl', 1, 'number', '', COLORS[5], true, true);
    addSeedText(doc, e11, pageId, margaritaSection, 'Soße', COLORS[12], false);
    addSeedFormula(doc, e12, pageId, margaritaSection, 'Gesamt', [e9], COLORS[1], false);
    return doc;
  }

  function addSeedText(doc, id, pageId, sectionId, text, color, startsRow) {
    doc.elements[id] = stamp({ id: id, pageId: pageId, sectionId: sectionId, type: 'text', name: 'Text', text: text, color: color, startsRow: !!startsRow });
  }

  function addSeedNumber(doc, id, pageId, sectionId, name, value, valueType, unit, color, stepper, startsRow) {
    doc.elements[id] = stamp({ id: id, pageId: pageId, sectionId: sectionId, type: 'number', name: name, value: value, valueType: valueType, currency: 'EUR', unit: unit, color: color, stepper: !!stepper, startsRow: !!startsRow });
  }

  function addSeedFormula(doc, id, pageId, sectionId, name, refs, color, startsRow) {
    doc.elements[id] = stamp({ id: id, pageId: pageId, sectionId: sectionId, type: 'formula', name: name, valueType: 'weight', currency: 'EUR', unit: 'g', color: color, startsRow: !!startsRow, formula: { operator: 'sum', inputs: refs.map(function (elementId) { return { pageId: pageId, elementId: elementId }; }) } });
  }

  function render() {
    document.body.classList.toggle('theme-light', state.doc.settings.theme === 'light');
    app.innerHTML = (state.currentPageId ? renderPage() : renderHome()) + renderToolbar() + renderSheet() + renderToast();
    resizeTextareas();
    refreshResults();
    syncToolbarClass();
  }

  function renderHome() {
    var folders = activeFolders().sort(bySortIndex);
    var html = '<main class="screen home-screen">';
    html += '<header class="topbar home-topbar"><div><h1 class="home-title">Seiten</h1><p class="home-subtitle">Ordner antippen, Namen direkt ändern</p></div>' + iconButton('toggle-theme', state.doc.settings.theme === 'dark' ? '☾' : '☀', 'Hell/Dunkel') + '</header>';
    html += '<section class="folder-stack">';
    if (!folders.length) html += renderLinePlus('add-folder', '', 'Ordner');
    folders.forEach(function (folder) {
      html += renderFolder(folder);
      html += renderLinePlus('add-folder', '', 'Ordner');
    });
    html += '</section></main>';
    return html;
  }

  function renderFolder(folder) {
    var pages = activePages().filter(function (page) { return page.folderId === folder.id; }).sort(bySortIndex);
    var html = '<section class="folder">';
    html += '<div class="folder-head"><button class="folder-toggle" data-action="toggle-folder" data-id="' + attr(folder.id) + '" title="Ordner öffnen">' + (folder.isOpen ? '⌄' : '›') + '</button><input class="folder-name-input" data-field="folder-name" data-id="' + attr(folder.id) + '" value="' + attr(folder.name) + '" /></div>';
    if (folder.isOpen) {
      html += '<div class="page-list">';
      pages.forEach(function (page) { html += renderPageRow(page); });
      html += '</div>';
      if (!pages.length) html += '<div class="empty-hint">Noch keine Seite</div>';
      html += renderLinePlus('create-page', folder.id, 'Seite', 'is-page');
    }
    html += '</section>';
    return html;
  }

  function renderPageRow(page) {
    return '<button class="page-row" style="--page-color:' + attr(page.color || COLORS[0]) + '" data-action="open-page" data-id="' + attr(page.id) + '"><span class="page-icon">' + esc(page.icon || '📄') + '</span><span class="page-row-title">' + esc(page.name || 'Ohne Namen') + '</span><span class="chevron">›</span></button>';
  }

  function renderLinePlus(action, id, title, extraClass) {
    return '<div class="line-plus ' + (extraClass || '') + '"><button class="line-plus-button" data-action="' + attr(action) + '" data-id="' + attr(id || '') + '" title="' + attr(title || 'Hinzufügen') + '">+</button></div>';
  }

  function renderPage() {
    var page = currentPage();
    if (!page || page.deletedAt) {
      state.currentPageId = null;
      return renderHome();
    }
    var isEdit = getPageMode(page) === 'edit';
    var sections = pageSections(page);
    var html = '<main class="screen page-screen" style="--page-color:' + attr(page.color || COLORS[0]) + '">';
    html += '<header class="topbar"><div>' + iconButton('back-home', '‹', 'Zurück') + '</div><div class="page-mode"><button class="mode-button ' + (!isEdit ? 'is-active' : '') + '" data-action="set-mode" data-mode="fill">Ausfüllen</button><button class="mode-button ' + (isEdit ? 'is-active' : '') + '" data-action="set-mode" data-mode="edit">Bearbeiten</button></div><div>' + iconButton('open-menu', '☰', 'Menü') + '</div></header>';
    if (isEdit) {
      html += '<div class="page-name-strip"><button class="page-icon-edit" data-action="open-page-settings">' + esc(page.icon || '📄') + '</button><input class="page-name-input" data-field="page-name" value="' + attr(page.name || '') + '" /></div>';
    }
    html += '<section class="section-stack">';
    if (!sections.length && isEdit) html += renderLinePlus('add-section', page.id, 'Bereich');
    sections.forEach(function (section) {
      html += renderSection(section, isEdit);
      if (isEdit) html += renderLinePlus('add-section', page.id, 'Bereich');
    });
    html += '</section></main>';
    return html;
  }

  function renderSection(section, isEdit) {
    var elements = sectionElements(section);
    var html = '<section class="calc-section" style="--section-color:' + attr(section.color || COLORS[0]) + '">';
    html += '<button class="section-rail" data-action="select-section" data-id="' + attr(section.id) + '" title="Bereich"></button><div class="section-panel">';
    html += '<button class="section-title ' + (isEdit ? 'can-edit' : '') + '" data-action="select-section" data-id="' + attr(section.id) + '">' + esc(section.name || 'Bereich') + '</button>';
    if (isEdit && state.activeSectionId === section.id) html += renderSectionEditor(section);
    html += '<div class="section-elements">';
    elements.forEach(function (element) {
      if (element.startsRow) html += '<span class="row-break"></span>';
      html += renderElementChip(element, isEdit);
      if (state.activeElementId === element.id) html += renderElementEditor(element, isEdit);
    });
    if (isEdit) html += '<button class="round-plus" data-action="open-add-element" data-id="' + attr(section.id) + '" title="Element hinzufügen">+</button>';
    html += '</div></div></section>';
    return html;
  }

  function renderSectionEditor(section) {
    var html = '<div class="section-editor"><div class="editor-head"><span class="editor-title">Bereich</span><button class="mini-button" data-action="close-section-editor">×</button></div>';
    html += '<label class="field">Name<input class="input" data-field="section-name" data-id="' + attr(section.id) + '" value="' + attr(section.name || '') + '" /></label>';
    html += '<div class="field">Farbe' + renderSwatches('set-section-color', section.id, section.color) + '</div>';
    html += '<div class="action-row"><button class="danger-button" data-action="delete-section" data-id="' + attr(section.id) + '">Bereich löschen</button></div>';
    html += '</div>';
    return html;
  }

  function renderElementChip(element, isEdit) {
    var label = elementLabel(element);
    var cls = 'element-chip ' + element.type + '-chip ' + (state.activeElementId === element.id ? 'is-active' : '');
    var html = '<button class="' + cls + '" style="--element-color:' + attr(element.color || COLORS[0]) + '" data-action="select-element" data-id="' + attr(element.id) + '">';
    if (element.type === 'number' && element.stepper) {
      html += '<span>' + esc(label) + '</span><span class="stepper"><span>▴</span><span>▾</span></span>';
    } else if (element.type === 'formula') {
      html += '<span>' + esc(element.name || 'Formel') + '</span><strong data-result-for="' + attr(element.id) + '">' + esc(formatComputation(element, computeElement(element.id, []))) + '</strong>';
    } else {
      html += esc(label);
    }
    html += '</button>';
    return html;
  }

  function renderElementEditor(element, isEdit) {
    var fillOnly = !isEdit;
    var html = '<div class="element-popover"><div class="editor-head"><span class="editor-title">Element</span><button class="mini-button" data-action="close-element-editor">×</button></div>';
    if (isEdit) html += '<label class="field">Typ' + renderSelect('element-type', element.id, element.type, ELEMENT_TYPES) + '</label>';
    else html += '<div class="ref-sub">' + esc(ELEMENT_TYPES[element.type] || 'Element') + '</div>';
    if (element.type === 'text') html += renderTextEditor(element, isEdit);
    if (element.type === 'number') html += renderNumberEditor(element, isEdit, fillOnly);
    if (element.type === 'formula') html += renderFormulaEditor(element, isEdit);
    if (isEdit) {
      html += '<div class="field">Farbe' + renderSwatches('set-element-color', element.id, element.color) + '</div>';
      html += '<div class="action-row"><button class="danger-button" data-action="delete-element" data-id="' + attr(element.id) + '">Element löschen</button></div>';
    }
    html += '</div>';
    return html;
  }

  function renderTextEditor(element, isEdit) {
    var html = '';
    if (isEdit) html += '<label class="field">Name<input class="input" data-field="element-name" data-id="' + attr(element.id) + '" value="' + attr(element.name || '') + '" /></label>';
    html += '<label class="field">Text<textarea class="textarea" data-field="element-text" data-id="' + attr(element.id) + '">' + esc(element.text || '') + '</textarea></label>';
    return html;
  }

  function renderNumberEditor(element, isEdit) {
    var html = '';
    if (isEdit) html += '<label class="field">Name<input class="input" data-field="element-name" data-id="' + attr(element.id) + '" value="' + attr(element.name || '') + '" /></label>';
    html += '<div class="grid-two"><label class="field">Wert<input class="input" data-field="element-value" data-id="' + attr(element.id) + '" type="' + (element.valueType === 'date' ? 'date' : 'number') + '" step="any" inputmode="decimal" value="' + attr(element.value || element.value === 0 ? element.value : '') + '" /></label>';
    if (isEdit) html += '<label class="field">Format' + renderSelect('element-value-type', element.id, element.valueType || 'number', VALUE_TYPES) + '</label>';
    html += '</div>';
    if (isEdit && element.valueType === 'currency') html += '<label class="field">Währung' + renderSelect('element-currency', element.id, element.currency || 'EUR', listToOptions(CURRENCIES)) + '</label>';
    if (isEdit && element.valueType === 'weight') html += '<label class="field">Einheit<input class="input" data-field="element-unit" data-id="' + attr(element.id) + '" value="' + attr(element.unit || 'g') + '" /></label>';
    if (isEdit) html += '<label class="field"><span><input type="checkbox" data-field="element-stepper" data-id="' + attr(element.id) + '" ' + (element.stepper ? 'checked' : '') + ' /> Zähler-Optik</span></label>';
    return html;
  }

  function renderFormulaEditor(element, isEdit) {
    var html = '<div class="grid-two">';
    if (isEdit) html += '<label class="field">Name<input class="input" data-field="element-name" data-id="' + attr(element.id) + '" value="' + attr(element.name || '') + '" /></label>';
    html += '<label class="field">Ergebnis<input class="input" readonly value="' + attr(formatComputation(element, computeElement(element.id, []))) + '" /></label></div>';
    if (isEdit) {
      html += '<div class="grid-two"><label class="field">Rechnung' + renderSelect('formula-operator', element.id, element.formula.operator, operatorOptions()) + '</label><label class="field">Format' + renderSelect('formula-value-type', element.id, element.valueType || 'number', FORMULA_VALUE_TYPES) + '</label></div>';
      if (element.valueType === 'currency') html += '<label class="field">Währung' + renderSelect('element-currency', element.id, element.currency || 'EUR', listToOptions(CURRENCIES)) + '</label>';
      if (element.valueType === 'weight') html += '<label class="field">Einheit<input class="input" data-field="element-unit" data-id="' + attr(element.id) + '" value="' + attr(element.unit || 'g') + '" /></label>';
      html += renderFormulaRefs(element);
      html += renderSourcePicker(element);
    } else {
      html += '<div class="ref-sub">' + esc(formulaDescription(element)) + '</div>';
    }
    return html;
  }

  function renderFormulaRefs(element) {
    var inputs = element.formula.inputs || [];
    var html = '<div class="field">Verlinkt';
    if (!inputs.length) html += '<div class="ref-pill"><span>Keine Werte</span><span></span></div>';
    inputs.forEach(function (ref, index) {
      var source = state.doc.elements[ref.elementId];
      var page = source ? getPage(source.pageId) : getPage(ref.pageId);
      html += '<div class="ref-pill"><span>' + esc(source && !source.deletedAt ? elementLabel(source) : 'Fehlt') + '<br><span class="ref-sub">' + esc(page ? page.name : 'Seite fehlt') + '</span></span><button class="mini-button" data-action="remove-ref" data-id="' + attr(element.id) + '" data-index="' + index + '">×</button></div>';
    });
    html += '</div>';
    return html;
  }

  function renderSourcePicker(element) {
    var sources = sourceElements(element.id);
    var html = '<div class="field">Wert verlinken<div class="ref-list">';
    if (!sources.length) html += '<div class="ref-pill"><span>Keine Zahlen gefunden</span><span></span></div>';
    sources.forEach(function (source) {
      var page = getPage(source.pageId);
      var section = getSection(source.sectionId);
      html += '<button class="ref-button" data-action="add-ref" data-id="' + attr(element.id) + '" data-source-id="' + attr(source.id) + '"><span>' + esc(elementLabel(source)) + '<br><span class="ref-sub">' + esc((page ? page.name : 'Seite') + ' / ' + (section ? section.name : 'Bereich')) + '</span></span><span>＋</span></button>';
    });
    html += '</div></div>';
    return html;
  }

  function renderToolbar() {
    if (!state.currentPageId) return '';
    return '<nav class="keyboard-toolbar" role="toolbar" aria-label="Schnellleiste"><button class="toolbar-button is-primary" data-action="toolbar-add-element">+</button><button class="toolbar-button" data-action="toolbar-add-type" data-type="text">Aa</button><button class="toolbar-button" data-action="toolbar-add-type" data-type="number">#</button><button class="toolbar-button" data-action="toolbar-add-type" data-type="formula">∑</button><button class="toolbar-button" data-action="add-section">▱</button><button class="toolbar-button" data-action="hide-keyboard">⌄</button></nav>';
  }

  function renderSheet() {
    if (!state.sheet) return '';
    var html = '<div class="sheet-backdrop" data-action="close-sheet"><section class="bottom-sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div>';
    if (state.sheet.type === 'addElement') html += renderAddElementSheet();
    if (state.sheet.type === 'menu') html += renderMenuSheet();
    if (state.sheet.type === 'pageSettings') html += renderPageSettingsSheet();
    html += '</section></div>';
    return html;
  }

  function renderSheetHead(title) {
    return '<div class="sheet-head"><div class="sheet-title">' + esc(title) + '</div><button class="icon-button" data-action="close-sheet">×</button></div>';
  }

  function renderAddElementSheet() {
    return renderSheetHead('Element') + '<div class="sheet-grid">' + sheetOption('create-element', 'text', 'Aa', 'Text', 'Zutat, Beschreibung, Label') + sheetOption('create-element', 'number', '#', 'Zahl', 'Menge, Preis, Prozent, Datum') + sheetOption('create-element', 'formula', '∑', 'Formel', 'Werte verlinken und berechnen') + '</div>';
  }

  function renderMenuSheet() {
    var page = currentPage();
    var html = renderSheetHead('Menü') + '<div class="menu-list">';
    html += '<button class="menu-button" data-action="set-mode" data-mode="' + (getPageMode(page) === 'edit' ? 'fill' : 'edit') + '"><span class="option-symbol">' + (getPageMode(page) === 'edit' ? '✓' : '✎') + '</span><span><span class="option-title">' + (getPageMode(page) === 'edit' ? 'Ausfüllen' : 'Bearbeiten') + '</span><br><span class="option-subtitle">Layout-Modus wechseln</span></span><span></span></button>';
    html += '<button class="menu-button" data-action="open-page-settings"><span class="option-symbol">◐</span><span><span class="option-title">Seite</span><br><span class="option-subtitle">Name, Icon, Farbe</span></span><span></span></button>';
    html += '<button class="menu-button" data-action="add-section"><span class="option-symbol">▱</span><span><span class="option-title">Bereich</span><br><span class="option-subtitle">Neue Gruppe anlegen</span></span><span></span></button>';
    html += '<button class="menu-button" data-action="delete-page"><span class="option-symbol">×</span><span><span class="option-title">Seite löschen</span></span><span></span></button>';
    html += '</div>';
    return html;
  }

  function renderPageSettingsSheet() {
    var page = currentPage();
    var html = renderSheetHead('Seite');
    html += '<label class="field">Name<input class="input" data-field="page-name" value="' + attr(page.name || '') + '" /></label>';
    html += '<div class="field">Icon<div class="emoji-grid">';
    EMOJIS.forEach(function (emoji) { html += '<button class="emoji-button" data-action="set-page-emoji" data-emoji="' + attr(emoji) + '">' + esc(emoji) + '</button>'; });
    html += '</div></div><div class="field">Farbe' + renderSwatches('set-page-color', page.id, page.color) + '</div>';
    return html;
  }

  function sheetOption(action, type, symbol, title, subtitle) {
    return '<button class="sheet-option" data-action="' + attr(action) + '" data-type="' + attr(type) + '"><span class="option-symbol">' + esc(symbol) + '</span><span><span class="option-title">' + esc(title) + '</span><br><span class="option-subtitle">' + esc(subtitle) + '</span></span><span class="chevron">›</span></button>';
  }

  function renderSwatches(action, id, selected) {
    var html = '<div class="swatches">';
    COLORS.forEach(function (color) { html += '<button class="swatch ' + (color === selected ? 'is-selected' : '') + '" style="--swatch:' + attr(color) + '" data-action="' + attr(action) + '" data-id="' + attr(id) + '" data-color="' + attr(color) + '"></button>'; });
    html += '</div>';
    return html;
  }

  function renderSelect(field, id, selected, options) {
    var html = '<select class="select" data-field="' + attr(field) + '" data-id="' + attr(id) + '">';
    Object.keys(options).forEach(function (value) { html += '<option value="' + attr(value) + '" ' + (value === selected ? 'selected' : '') + '>' + esc(options[value]) + '</option>'; });
    html += '</select>';
    return html;
  }

  function handleClick(event) {
    var target = event.target.closest('[data-action]');
    if (!target) return;
    var action = target.dataset.action;
    if (action === 'close-sheet' && target.classList.contains('sheet-backdrop') && event.target !== target) return;
    event.preventDefault();
    if (action === 'toggle-theme') return toggleTheme();
    if (action === 'add-folder') return addFolder();
    if (action === 'toggle-folder') return toggleFolder(target.dataset.id);
    if (action === 'create-page') return createPage(target.dataset.id);
    if (action === 'open-page') return openPage(target.dataset.id);
    if (action === 'back-home') return goHome();
    if (action === 'set-mode') return setMode(target.dataset.mode);
    if (action === 'open-menu') return openSheet({ type: 'menu' });
    if (action === 'open-page-settings') return openSheet({ type: 'pageSettings' });
    if (action === 'close-sheet') return closeSheet();
    if (action === 'add-section') return addSection();
    if (action === 'select-section') return selectSection(target.dataset.id);
    if (action === 'close-section-editor') return closeSectionEditor();
    if (action === 'delete-section') return deleteSection(target.dataset.id);
    if (action === 'open-add-element') return openAddElement(target.dataset.id);
    if (action === 'toolbar-add-element') return toolbarAddElement();
    if (action === 'toolbar-add-type') return toolbarAddType(target.dataset.type);
    if (action === 'create-element') return createElementFromSheet(target.dataset.type);
    if (action === 'select-element') return selectElement(target.dataset.id);
    if (action === 'close-element-editor') return closeElementEditor();
    if (action === 'delete-element') return deleteElement(target.dataset.id);
    if (action === 'undo-delete') return undoDelete();
    if (action === 'add-ref') return addFormulaRef(target.dataset.id, target.dataset.sourceId);
    if (action === 'remove-ref') return removeFormulaRef(target.dataset.id, Number(target.dataset.index));
    if (action === 'set-page-emoji') return setPageEmoji(target.dataset.emoji);
    if (action === 'set-page-color') return setPageColor(target.dataset.color);
    if (action === 'set-section-color') return setSectionColor(target.dataset.id, target.dataset.color);
    if (action === 'set-element-color') return setElementColor(target.dataset.id, target.dataset.color);
    if (action === 'delete-page') return deletePage();
    if (action === 'hide-keyboard') return hideKeyboard();
  }

  function handleInput(event) {
    var target = event.target;
    var field = target.dataset.field;
    if (!field) return;
    if (field === 'folder-name') return updateFolderName(target.dataset.id, target.value);
    if (field === 'page-name') return updatePageName(target.value);
    if (field === 'section-name') return updateSection(target.dataset.id, { name: target.value });
    var element = state.doc.elements[target.dataset.id];
    if (!element) return;
    if (field === 'element-name') element.name = target.value;
    if (field === 'element-text') element.text = target.value;
    if (field === 'element-value') element.value = element.valueType === 'date' ? target.value : parseNumber(target.value);
    if (field === 'element-unit') element.unit = target.value;
    touch(element);
    saveDocument();
    if (field === 'element-text') resizeTextarea(target);
    refreshElementChip(element);
    refreshResults();
    renderSoonExceptTyping(field);
  }

  function handleChange(event) {
    var target = event.target;
    var field = target.dataset.field;
    if (!field) return;
    var element = state.doc.elements[target.dataset.id];
    if (!element) return;
    if (field === 'element-type') convertElementType(element, target.value);
    if (field === 'element-value-type') {
      element.valueType = target.value;
      if (target.value === 'weight' && !element.unit) element.unit = 'g';
      if (target.value === 'currency' && !element.currency) element.currency = 'EUR';
      if (target.value === 'date' && typeof element.value === 'number') element.value = '';
      if (target.value !== 'date' && typeof element.value === 'string') element.value = parseNumber(element.value);
    }
    if (field === 'element-currency') element.currency = target.value;
    if (field === 'element-stepper') element.stepper = target.checked;
    if (field === 'formula-operator') element.formula.operator = target.value;
    if (field === 'formula-value-type') {
      element.valueType = target.value;
      if (target.value === 'weight' && !element.unit) element.unit = 'g';
      if (target.value === 'currency' && !element.currency) element.currency = 'EUR';
    }
    touch(element);
    saveDocument();
    render();
  }

  function renderSoonExceptTyping(field) {
    if (field === 'element-value') return;
    if (field === 'element-text') return;
    if (field === 'element-name') return;
    if (field === 'element-unit') return;
  }

  function addFolder() {
    var folder = stamp({ id: uid('folder'), name: 'Neuer Ordner', isOpen: true, sortIndex: activeFolders().length });
    state.doc.folders.push(folder);
    saveDocument();
    render();
  }

  function toggleFolder(id) {
    var folder = getFolder(id);
    if (!folder) return;
    folder.isOpen = !folder.isOpen;
    touch(folder);
    saveDocument();
    render();
  }

  function createPage(folderId) {
    var pageId = uid('page');
    var sectionId = uid('section');
    var page = stamp({ id: pageId, folderId: folderId || null, name: 'Neue Seite', icon: '🧾', color: COLORS[0], sortIndex: activePages().length, sectionOrder: [sectionId] });
    state.doc.pages.push(page);
    state.doc.sections[sectionId] = stamp({ id: sectionId, pageId: pageId, name: 'Neuer Bereich', color: COLORS[0], elementOrder: [] });
    state.currentPageId = pageId;
    state.modeByPage[pageId] = 'edit';
    state.activeSectionId = sectionId;
    saveDocument();
    render();
  }

  function openPage(id) { state.currentPageId = id; state.sheet = null; state.activeElementId = null; state.activeSectionId = null; render(); }
  function goHome() { state.currentPageId = null; state.sheet = null; state.activeElementId = null; state.activeSectionId = null; render(); }
  function toggleTheme() { state.doc.settings.theme = state.doc.settings.theme === 'dark' ? 'light' : 'dark'; saveDocument(); render(); }
  function setMode(mode) { var page = currentPage(); if (!page) return; state.modeByPage[page.id] = mode; state.sheet = null; if (mode !== 'edit') state.activeSectionId = null; render(); }
  function openSheet(sheet) { state.sheet = sheet; render(); }
  function closeSheet() { state.sheet = null; render(); }

  function addSection() {
    var page = currentPage();
    if (!page) return;
    state.sheet = null;
    var id = uid('section');
    state.doc.sections[id] = stamp({ id: id, pageId: page.id, name: 'Neuer Bereich', color: COLORS[page.sectionOrder.length % COLORS.length], elementOrder: [] });
    page.sectionOrder.push(id);
    touch(page);
    state.activeSectionId = id;
    state.modeByPage[page.id] = 'edit';
    saveDocument();
    render();
  }

  function selectSection(id) {
    if (getPageMode(currentPage()) !== 'edit') return;
    state.activeSectionId = state.activeSectionId === id ? null : id;
    state.activeElementId = null;
    render();
  }

  function closeSectionEditor() { state.activeSectionId = null; render(); }
  function updateSection(id, patch) { var section = getSection(id); if (!section) return; Object.assign(section, patch); touch(section); saveDocument(); }
  function setSectionColor(id, color) { updateSection(id, { color: color }); render(); }

  function deleteSection(id) {
    var section = getSection(id);
    var page = currentPage();
    if (!section || !page) return;
    if (section.elementOrder.some(function (elementId) { return getDependents(elementId).length; })) {
      if (!window.confirm('Ein Element in diesem Bereich wird verlinkt. Bereich trotzdem löschen?')) return;
    } else if (!window.confirm('Bereich löschen?')) return;
    section.deletedAt = now();
    touch(section);
    section.elementOrder.forEach(function (elementId) { var element = state.doc.elements[elementId]; if (element) { element.deletedAt = now(); touch(element); } });
    page.sectionOrder = page.sectionOrder.filter(function (sectionId) { return sectionId !== id; });
    touch(page);
    state.activeSectionId = null;
    saveDocument();
    render();
  }

  function openAddElement(sectionId) {
    if (getPageMode(currentPage()) !== 'edit') { showToast('Bearbeiten aktivieren'); return render(); }
    state.sheet = { type: 'addElement', sectionId: sectionId };
    render();
  }

  function toolbarAddElement() {
    var section = firstEditableSection();
    if (!section) return;
    openAddElement(section.id);
  }

  function toolbarAddType(type) {
    var section = firstEditableSection();
    if (!section) return;
    createElement(section.id, type);
  }

  function firstEditableSection() {
    var page = currentPage();
    if (!page) return null;
    if (getPageMode(page) !== 'edit') { showToast('Bearbeiten aktivieren'); render(); return null; }
    var section = state.activeSectionId ? getSection(state.activeSectionId) : pageSections(page)[0];
    if (!section) {
      addSection();
      return getSection(state.activeSectionId);
    }
    return section;
  }

  function createElementFromSheet(type) {
    if (!state.sheet || !state.sheet.sectionId) return;
    createElement(state.sheet.sectionId, type);
  }

  function createElement(sectionId, type) {
    var section = getSection(sectionId);
    var page = currentPage();
    if (!section || !page) return;
    var element = newElement(type, page.id, section.id);
    state.doc.elements[element.id] = element;
    section.elementOrder.push(element.id);
    touch(section);
    state.sheet = null;
    state.activeElementId = element.id;
    state.activeSectionId = null;
    saveDocument();
    render();
  }

  function newElement(type, pageId, sectionId) {
    var element = stamp({ id: uid('element'), pageId: pageId, sectionId: sectionId, type: type, name: ELEMENT_TYPES[type] || 'Element', color: COLORS[Math.floor(Math.random() * COLORS.length)], startsRow: false });
    if (type === 'text') element.text = 'Text';
    if (type === 'number') { element.value = 0; element.valueType = 'number'; element.currency = 'EUR'; element.unit = ''; element.stepper = false; }
    if (type === 'formula') { element.valueType = 'number'; element.currency = 'EUR'; element.unit = ''; element.formula = { operator: 'sum', inputs: [] }; }
    return element;
  }

  function selectElement(id) {
    var element = state.doc.elements[id];
    if (!element) return;
    if (getPageMode(currentPage()) === 'fill' && element.type === 'text') return;
    state.activeElementId = state.activeElementId === id ? null : id;
    state.activeSectionId = null;
    render();
  }

  function closeElementEditor() { state.activeElementId = null; render(); }

  function convertElementType(element, type) {
    element.type = type;
    element.name = element.name || ELEMENT_TYPES[type];
    if (type === 'text') {
      element.text = element.text || elementLabel(element) || 'Text';
      delete element.formula;
    }
    if (type === 'number') {
      if (typeof element.value === 'undefined') element.value = 0;
      element.valueType = element.valueType === 'date' ? 'number' : (element.valueType || 'number');
      element.currency = element.currency || 'EUR';
      element.unit = element.unit || '';
      delete element.formula;
    }
    if (type === 'formula') {
      element.valueType = element.valueType === 'date' ? 'number' : (element.valueType || 'number');
      element.currency = element.currency || 'EUR';
      element.unit = element.unit || '';
      element.formula = element.formula || { operator: 'sum', inputs: [] };
    }
  }

  function deleteElement(id) {
    var element = state.doc.elements[id];
    if (!element) return;
    var deps = getDependents(id);
    if (deps.length) {
      var names = deps.map(function (item) { return item.name || 'Formel'; }).join(', ');
      if (!window.confirm('Dieses Element wird verlinkt: ' + names + '. Trotzdem löschen?')) return;
    }
    var section = getSection(element.sectionId);
    var index = section ? section.elementOrder.indexOf(id) : -1;
    var snapshot = JSON.parse(JSON.stringify(element));
    element.deletedAt = now();
    touch(element);
    if (section) {
      section.elementOrder = section.elementOrder.filter(function (elementId) { return elementId !== id; });
      touch(section);
    }
    state.undo = { type: 'element', element: snapshot, sectionId: element.sectionId, index: index };
    state.activeElementId = null;
    saveDocument();
    showToast('Element gelöscht', 'undo');
    render();
  }

  function undoDelete() {
    if (!state.undo || state.undo.type !== 'element') return;
    var snapshot = state.undo.element;
    var section = getSection(state.undo.sectionId);
    snapshot.deletedAt = null;
    touch(snapshot);
    state.doc.elements[snapshot.id] = snapshot;
    if (section && section.elementOrder.indexOf(snapshot.id) === -1) {
      section.elementOrder.splice(Math.max(0, state.undo.index), 0, snapshot.id);
      touch(section);
    }
    state.undo = null;
    state.toast = null;
    saveDocument();
    render();
  }

  function addFormulaRef(formulaId, sourceId) {
    var formula = state.doc.elements[formulaId];
    var source = state.doc.elements[sourceId];
    if (!formula || !source || formula.type !== 'formula') return;
    formula.formula.inputs = formula.formula.inputs || [];
    if (formula.formula.inputs.some(function (ref) { return ref.elementId === sourceId; })) { showToast('Schon verlinkt'); return render(); }
    formula.formula.inputs.push({ pageId: source.pageId, elementId: source.id });
    touch(formula);
    saveDocument();
    render();
  }

  function removeFormulaRef(formulaId, index) {
    var formula = state.doc.elements[formulaId];
    if (!formula || !formula.formula) return;
    formula.formula.inputs.splice(index, 1);
    touch(formula);
    saveDocument();
    render();
  }

  function deletePage() {
    var page = currentPage();
    if (!page) return;
    var used = [];
    pageSections(page).forEach(function (section) { section.elementOrder.forEach(function (elementId) { getDependents(elementId).forEach(function (dep) { if (dep.pageId !== page.id) used.push(dep.name || 'Formel'); }); }); });
    var message = used.length ? 'Seite wird extern verlinkt: ' + used.join(', ') + '. Trotzdem löschen?' : 'Seite löschen?';
    if (!window.confirm(message)) return;
    page.deletedAt = now();
    touch(page);
    pageSections(page).forEach(function (section) { section.deletedAt = now(); touch(section); section.elementOrder.forEach(function (id) { if (state.doc.elements[id]) { state.doc.elements[id].deletedAt = now(); touch(state.doc.elements[id]); } }); });
    state.currentPageId = null;
    state.sheet = null;
    saveDocument();
    render();
  }

  function setPageEmoji(emoji) { var page = currentPage(); if (!page) return; page.icon = emoji; touch(page); saveDocument(); render(); }
  function setPageColor(color) { var page = currentPage(); if (!page) return; page.color = color; touch(page); saveDocument(); render(); }
  function setElementColor(id, color) { var element = state.doc.elements[id]; if (!element) return; element.color = color; touch(element); saveDocument(); render(); }
  function updateFolderName(id, value) { var folder = getFolder(id); if (!folder) return; folder.name = value; touch(folder); saveDocument(); }
  function updatePageName(value) { var page = currentPage(); if (!page) return; page.name = value; touch(page); saveDocument(); }
  function hideKeyboard() { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); state.activeInput = false; syncToolbarClass(); }

  function computeElement(id, stack) {
    var element = state.doc.elements[id];
    if (!element || element.deletedAt) return { ok: false, error: 'Verknüpfung fehlt' };
    if (stack.indexOf(id) !== -1) return { ok: false, error: 'Zirkuläre Formel' };
    if (element.type === 'number') {
      if (element.valueType === 'date') return { ok: false, error: 'Datum ist kein Zahlenwert' };
      var n = Number(element.value);
      if (!Number.isFinite(n)) return { ok: false, error: 'Kein Zahlenwert' };
      return { ok: true, value: n };
    }
    if (element.type === 'formula') return computeFormula(element, stack.concat(id));
    return { ok: false, error: 'Nicht berechenbar' };
  }

  function computeFormula(element, stack) {
    var formula = element.formula || { operator: 'sum', inputs: [] };
    var op = OPERATORS[formula.operator] || OPERATORS.sum;
    var inputs = formula.inputs || [];
    if (inputs.length < op.min) return { ok: false, error: 'Werte fehlen' };
    var values = [];
    for (var i = 0; i < inputs.length; i += 1) {
      var source = state.doc.elements[inputs[i].elementId];
      if (!source || source.deletedAt) return { ok: false, error: 'Verknüpfung fehlt' };
      var result = computeElement(source.id, stack);
      if (!result.ok) return result;
      values.push(result.value);
    }
    var value = 0;
    if (formula.operator === 'add' || formula.operator === 'sum') value = values.reduce(function (sum, item) { return sum + item; }, 0);
    if (formula.operator === 'subtract') value = values.slice(1).reduce(function (sum, item) { return sum - item; }, values[0]);
    if (formula.operator === 'multiply') value = values.reduce(function (sum, item) { return sum * item; }, 1);
    if (formula.operator === 'divide') {
      value = values[0];
      for (var d = 1; d < values.length; d += 1) {
        if (values[d] === 0) return { ok: false, error: 'Division durch 0' };
        value = value / values[d];
      }
    }
    if (formula.operator === 'percent') value = values[0] * (values[1] / 100);
    if (formula.operator === 'average') value = values.reduce(function (sum, item) { return sum + item; }, 0) / values.length;
    if (!Number.isFinite(value)) return { ok: false, error: 'Ungültiges Ergebnis' };
    return { ok: true, value: value };
  }

  function refreshElementChip(element) {
    var chip = app.querySelector('[data-action=\"select-element\"][data-id=\"' + attr(element.id) + '\"]');
    if (!chip) return;
    if (element.type === 'number' && element.stepper) {
      chip.innerHTML = '<span>' + esc(elementLabel(element)) + '</span><span class=\"stepper\"><span>▴</span><span>▾</span></span>';
    } else if (element.type === 'formula') {
      chip.innerHTML = '<span>' + esc(element.name || 'Formel') + '</span><strong data-result-for=\"' + attr(element.id) + '\">' + esc(formatComputation(element, computeElement(element.id, []))) + '</strong>';
    } else {
      chip.textContent = elementLabel(element);
    }
  }

  function refreshResults() {
    app.querySelectorAll('[data-result-for]').forEach(function (node) {
      var element = state.doc.elements[node.dataset.resultFor];
      if (!element) return;
      node.textContent = formatComputation(element, computeElement(element.id, []));
    });
  }

  function elementLabel(element) {
    if (!element) return '';
    if (element.type === 'text') return element.text || element.name || 'Text';
    if (element.type === 'number') return formatValue(element, element.value);
    if (element.type === 'formula') return formatComputation(element, computeElement(element.id, []));
    return element.name || 'Element';
  }

  function formatComputation(element, computed) { return computed.ok ? formatValue(element, computed.value) : computed.error; }

  function formatValue(element, value) {
    if (element.valueType === 'date') {
      if (!value) return 'Datum';
      var date = new Date(value + 'T00:00:00');
      if (Number.isNaN(date.getTime())) return 'Datum';
      return new Intl.DateTimeFormat('de-DE').format(date);
    }
    var n = Number(value);
    if (!Number.isFinite(n)) n = 0;
    if (element.valueType === 'currency') return new Intl.NumberFormat('de-DE', { style: 'currency', currency: element.currency || 'EUR' }).format(n);
    if (element.valueType === 'percent') return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(n) + '%';
    if (element.valueType === 'weight') return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(n) + (element.unit || 'g');
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 4 }).format(n);
  }

  function formulaDescription(element) {
    var formula = element.formula || { operator: 'sum', inputs: [] };
    var op = OPERATORS[formula.operator] || OPERATORS.sum;
    var names = (formula.inputs || []).map(function (ref) { return elementLabel(state.doc.elements[ref.elementId]) || 'Fehlt'; });
    if (!names.length) return op.label;
    if (formula.operator === 'average') return 'Ø(' + names.join(', ') + ')';
    if (formula.operator === 'percent') return names.slice(0, 2).join(' von ');
    return names.join(' ' + op.symbol + ' ');
  }

  function sourceElements(formulaId) {
    return Object.keys(state.doc.elements).map(function (id) { return state.doc.elements[id]; }).filter(function (element) {
      return element && !element.deletedAt && element.id !== formulaId && (element.type === 'number' || element.type === 'formula') && element.valueType !== 'date';
    });
  }

  function getDependents(elementId) {
    return Object.keys(state.doc.elements).map(function (id) { return state.doc.elements[id]; }).filter(function (element) {
      return element && !element.deletedAt && element.type === 'formula' && element.formula && (element.formula.inputs || []).some(function (ref) { return ref.elementId === elementId; });
    });
  }

  function currentPage() { return state.currentPageId ? getPage(state.currentPageId) : null; }
  function getPage(id) { return state.doc.pages.find(function (page) { return page.id === id; }); }
  function getFolder(id) { return state.doc.folders.find(function (folder) { return folder.id === id; }); }
  function getSection(id) { return state.doc.sections[id]; }
  function activeFolders() { return state.doc.folders.filter(notDeleted); }
  function activePages() { return state.doc.pages.filter(notDeleted); }
  function pageSections(page) { return (page.sectionOrder || []).map(function (id) { return state.doc.sections[id]; }).filter(notDeleted); }
  function sectionElements(section) { return (section.elementOrder || []).map(function (id) { return state.doc.elements[id]; }).filter(notDeleted); }
  function getPageMode(page) { return state.modeByPage[page.id] || 'fill'; }
  function bySortIndex(a, b) { return (a.sortIndex || 0) - (b.sortIndex || 0); }
  function notDeleted(item) { return item && !item.deletedAt; }

  function resizeTextareas() { app.querySelectorAll('textarea').forEach(resizeTextarea); }
  function resizeTextarea(textarea) { textarea.style.height = 'auto'; textarea.style.height = Math.max(74, textarea.scrollHeight) + 'px'; }
  function syncToolbarClass() { var toolbar = app.querySelector('.keyboard-toolbar'); if (!toolbar) return; var page = currentPage(); toolbar.classList.toggle('is-visible', !!page && (state.activeInput || getPageMode(page) === 'edit' || !!state.sheet)); }
  function isInput(el) { return !!el && !!el.matches && el.matches('input, textarea, select'); }
  function listToOptions(list) { var out = {}; list.forEach(function (item) { out[item] = item; }); return out; }
  function operatorOptions() { var out = {}; Object.keys(OPERATORS).forEach(function (key) { out[key] = OPERATORS[key].label; }); return out; }
  function iconButton(action, label, title) { return '<button class="icon-button" data-action="' + attr(action) + '" title="' + attr(title) + '">' + esc(label) + '</button>'; }
  function parseNumber(value) { if (value === '' || value === null || typeof value === 'undefined') return 0; var n = Number(String(value).replace(',', '.')); return Number.isFinite(n) ? n : 0; }
  function showToast(message, action) { state.toast = { message: message, action: action || null }; window.setTimeout(function () { if (state.toast && state.toast.message === message) { state.toast = null; render(); } }, action === 'undo' ? 8000 : 2200); }
  function renderToast() { if (!state.toast) return ''; var html = '<div class="toast"><span>' + esc(state.toast.message) + '</span>'; if (state.toast.action === 'undo') html += '<button data-action="undo-delete">Undo</button>'; html += '</div>'; return html; }
  function saveDocument() { state.doc.meta.updatedAt = now(); state.doc.meta.version += 1; localStorage.setItem(STORAGE_KEY, JSON.stringify(state.doc)); }
  function touch(entity) { entity.updatedAt = now(); entity.version = (entity.version || 0) + 1; }
  function stamp(entity) { var t = now(); if (!entity.createdAt) entity.createdAt = t; if (!entity.updatedAt) entity.updatedAt = entity.createdAt; if (typeof entity.version !== 'number') entity.version = 1; if (typeof entity.deletedAt === 'undefined') entity.deletedAt = null; return entity; }
  function now() { return new Date().toISOString(); }
  function uid(prefix) { if (window.crypto && window.crypto.randomUUID) return prefix + '_' + window.crypto.randomUUID(); return prefix + '_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function esc(value) { return String(value === null || typeof value === 'undefined' ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function attr(value) { return esc(value); }
})();

(function () {
  'use strict';

  var STORAGE_KEY = 'kalkulationsbaukasten.document.v2';
  var COLORS = ['#F2A65A', '#F1C27D', '#E8B4A0', '#D99CA3', '#C7B7E8', '#AFC4E9', '#9FC9D5', '#A8DADC', '#BFD7B5', '#D6E3A3', '#F0D98C', '#F3B6A2', '#C9ADA7', '#B7B7A4', '#D8C3A5', '#B5C7A8', '#A6C8B3', '#A7C7E7', '#D3C0E8', '#E7A6B3'];
  var EMOJIS = ['🍕', '🥐', '🍰', '☕', '🧾', '💶', '🧮', '📦', '🛒', '🏷️', '📋', '✨', '🔧', '🏠', '🌿', '🍋'];
  var CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP'];
  var WEIGHT_UNITS = { mg: 'mg', g: 'g', kg: 'kg', t: 't', oz: 'oz', lb: 'lb' };
  var VALUE_TYPES = { number: 'Zahl', currency: 'Währung', weight: 'Gewicht', percent: 'Prozent', date: 'Datum' };
  var FORMULA_VALUE_TYPES = { number: 'Zahl', currency: 'Währung', weight: 'Gewicht', percent: 'Prozent' };
  var ELEMENT_TYPES = { text: 'Text', number: 'Zahl', formula: 'Formel' };
  var FORMULA_MODES = {
    chain: 'Kombinieren',
    average: 'Durchschnitt'
  };
  var FORMULA_INPUT_OPS = {
    add: { label: '+ addieren', symbol: '+' },
    subtract: { label: '- abziehen', symbol: '-' },
    multiply: { label: '× multiplizieren', symbol: '×' },
    divide: { label: '÷ dividieren', symbol: '÷' },
    percent: { label: '% davon', symbol: '%' }
  };

  var app = document.getElementById('app');
  var state = {
    doc: null,
    currentPageId: null,
    modeByPage: {},
    sheet: null,
    activeElementId: null,
    activeSectionId: null,
    activeSectionColorId: null,
    activeInput: false,
    toast: null,
    deletedUndo: null,
    history: { undo: [], redo: [], limit: 10, inputSnapshot: null, isRestoring: false },
    drag: null,
    autoScroll: null,
    duplicatePrompt: null,
    suppressNextClick: false
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
    app.addEventListener('pointerdown', handlePointerDown);
    app.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('focusin', function (event) {
      if (isInput(event.target)) {
        state.activeInput = true;
        prepareInputHistory(event.target);
        clearDefaultField(event.target);
        syncToolbarClass();
      }
    });
    document.addEventListener('focusout', function () {
      finalizeInputHistory();
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
        if (parsed && parsed.schemaVersion === 2 && parsed.sections && parsed.elements) return normalizeDocument(parsed);
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
    doc.elements[id] = stamp({ id: id, pageId: pageId, sectionId: sectionId, type: 'formula', name: name, valueType: 'weight', currency: 'EUR', unit: 'g', color: color, startsRow: !!startsRow, formula: { operator: 'chain', inputs: refs.map(function (elementId, index) { return { pageId: pageId, elementId: elementId, op: index ? 'add' : 'start' }; }) } });
  }

  function normalizeDocument(doc) {
    doc.folders = doc.folders || [];
    doc.pages = doc.pages || [];
    doc.sections = doc.sections || {};
    doc.elements = doc.elements || {};
    doc.folders.forEach(function (folder) {
      if (folder.name === 'Neuer Ordner') folder.name = '';
    });
    doc.pages.forEach(function (page) {
      if (page.name === 'Neue Seite') page.name = '';
      page.sectionOrder = page.sectionOrder || [];
    });
    Object.keys(doc.sections).forEach(function (id) {
      var section = doc.sections[id];
      if (!section) return;
      if (section.name === 'Neuer Bereich') section.name = '';
      section.elementOrder = section.elementOrder || [];
    });
    Object.keys(doc.elements).forEach(function (id) {
      normalizeElement(doc.elements[id]);
    });
    return doc;
  }

  function normalizeElement(element) {
    if (!element) return;
    if (element.type === 'text' && element.text === 'Text') element.text = '';
    if (element.type === 'number') {
      if (!element.valueType) element.valueType = 'number';
      if (element.valueType === 'weight' && !element.unit) element.unit = 'g';
      if (element.unit === 'Tonnen') element.unit = 't';
    }
    if (element.type === 'formula') {
      element.formula = normalizeFormula(element.formula || { operator: 'chain', inputs: [] });
      if (typeof element.hideName === 'undefined') element.hideName = false;
      if (!element.valueType || element.valueType === 'date') element.valueType = 'number';
      if (element.valueType === 'weight' && !element.unit) element.unit = 'g';
      if (element.unit === 'Tonnen') element.unit = 't';
    }
  }

  function normalizeFormula(formula) {
    var oldOperator = formula.operator || 'chain';
    var inputs = formula.inputs || [];
    if (oldOperator === 'sum' || oldOperator === 'add') {
      formula.operator = 'chain';
      inputs.forEach(function (ref, index) { ref.op = index ? 'add' : 'start'; });
    } else if (oldOperator === 'subtract') {
      formula.operator = 'chain';
      inputs.forEach(function (ref, index) { ref.op = index ? 'subtract' : 'start'; });
    } else if (oldOperator === 'multiply') {
      formula.operator = 'chain';
      inputs.forEach(function (ref, index) { ref.op = index ? 'multiply' : 'start'; });
    } else if (oldOperator === 'divide') {
      formula.operator = 'chain';
      inputs.forEach(function (ref, index) { ref.op = index ? 'divide' : 'start'; });
    } else if (oldOperator === 'percent') {
      formula.operator = 'chain';
      inputs.forEach(function (ref, index) { ref.op = index === 1 ? 'percent' : (index ? 'add' : 'start'); });
    } else if (oldOperator !== 'average') {
      formula.operator = 'chain';
    }
    inputs.forEach(function (ref, index) {
      if (!ref.op) ref.op = index ? 'add' : 'start';
      if (index === 0) ref.op = 'start';
      if (!ref.elementId && ref.kind !== 'value') ref.kind = 'value';
      if (ref.kind === 'value' && typeof ref.value === 'undefined') ref.value = 0;
    });
    formula.inputs = inputs;
    return formula;
  }

  function render() {
    document.body.classList.toggle('theme-light', state.doc.settings.theme === 'light');
    app.innerHTML = (state.currentPageId ? renderPage() : renderHome()) + renderDuplicatePrompt() + renderToolbar() + renderSheet() + renderToast();
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
    html += '<div class="folder-head"><button class="folder-toggle" data-action="toggle-folder" data-id="' + attr(folder.id) + '" title="Ordner öffnen">' + (folder.isOpen ? '⌄' : '›') + '</button><input class="folder-name-input" data-field="folder-name" data-id="' + attr(folder.id) + '" value="' + attr(folder.name || '') + '" placeholder="Neuer Ordner" /></div>';
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
    return '<button class="page-row" style="--page-color:' + attr(page.color || COLORS[0]) + '" data-action="open-page" data-id="' + attr(page.id) + '"><span class="page-icon">' + esc(page.icon || '📄') + '</span><span class="page-row-title ' + (!page.name ? 'is-placeholder' : '') + '">' + esc(page.name || 'Neue Seite') + '</span><span class="chevron">›</span></button>';
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
    var draggingSectionId = state.drag && state.drag.kind === 'section' ? state.drag.sectionId : null;
    var sectionDropIndex = 0;
    var html = '<main class="screen page-screen ' + (isEdit ? 'is-edit' : 'is-fill') + '" style="--page-color:' + attr(page.color || COLORS[0]) + '">';
    html += '<header class="topbar"><div>' + iconButton('back-home', '‹', 'Zurück') + '</div><div class="page-mode"><button class="mode-button ' + (!isEdit ? 'is-active' : '') + '" data-action="set-mode" data-mode="fill">Ausfüllen</button><button class="mode-button ' + (isEdit ? 'is-active' : '') + '" data-action="set-mode" data-mode="edit">Bearbeiten</button></div><div>' + iconButton('open-menu', '☰', 'Menü') + '</div></header>';
    if (isEdit) {
      html += '<div class="page-name-strip"><button class="page-icon-edit" data-action="open-page-settings">' + esc(page.icon || '📄') + '</button><input class="page-name-input" data-field="page-name" value="' + attr(page.name || '') + '" placeholder="Neue Seite" /></div>';
    }
    html += '<section class="section-stack">';
    if (!sections.length && isEdit) html += renderLinePlus('add-section', page.id, 'Bereich');
    if (sections.length && isEdit) html += renderSectionDropMarker(0);
    sections.forEach(function (section) {
      html += renderSection(section, isEdit);
      if (section.id !== draggingSectionId) {
        sectionDropIndex += 1;
        if (isEdit) html += renderSectionDropMarker(sectionDropIndex);
      }
      if (isEdit && section.id !== draggingSectionId) html += renderLinePlus('add-section', page.id, 'Bereich');
    });
    html += '</section></main>';
    return html;
  }

  function renderSection(section, isEdit) {
    var elements = sectionElements(section);
    var dragging = state.drag && state.drag.kind === 'section' && state.drag.sectionId === section.id;
    var html = '<section class="calc-section ' + (dragging ? 'is-dragging-section' : '') + '" data-section-id="' + attr(section.id) + '" style="--section-color:' + attr(section.color || COLORS[0]) + '">';
    html += '<button class="section-rail" data-action="select-section" data-id="' + attr(section.id) + '" title="Bereich"></button><div class="section-panel">';
    html += '<button class="section-title ' + (isEdit ? 'can-edit' : '') + (!section.name ? ' is-placeholder' : '') + '" data-action="select-section" data-id="' + attr(section.id) + '">' + esc(section.name || 'Neuer Bereich') + '</button>';
    if (isEdit && state.activeSectionId === section.id) html += renderSectionEditor(section);
    html += '<div class="section-elements" data-section-id="' + attr(section.id) + '">';
    var dropIndex = 0;
    if (isEdit) html += renderDropMarker(section.id, dropIndex);
    elements.forEach(function (element) {
      if (element.startsRow) html += '<span class="row-break"></span>';
      html += renderElementChip(element, isEdit);
      if (!(state.drag && state.drag.elementId === element.id)) {
        dropIndex += 1;
        if (isEdit) html += renderDropMarker(section.id, dropIndex);
      }
      if (state.activeElementId === element.id) html += renderElementEditor(element, isEdit);
    });
    if (isEdit) html += '<button class="round-plus" data-action="open-add-element" data-id="' + attr(section.id) + '" title="Element hinzufügen">+</button>';
    html += '</div></div></section>';
    return html;
  }

  function renderSectionEditor(section) {
    var html = '<div class="section-editor"><div class="editor-head"><span class="editor-title">Bereich</span><div class="editor-actions"><button class="color-chip" style="--swatch:' + attr(section.color || COLORS[0]) + '" data-action="toggle-section-colors" data-id="' + attr(section.id) + '" title="Farbe"></button><button class="mini-button" data-action="close-section-editor">×</button></div></div>';
    if (state.activeSectionColorId === section.id) html += renderSwatches('set-section-color', section.id, section.color);
    html += '<label class="field">Name<input class="input" data-field="section-name" data-id="' + attr(section.id) + '" value="' + attr(section.name || '') + '" placeholder="Neuer Bereich" /></label>';
    html += '<div class="action-row"><button class="danger-button" data-action="delete-section" data-id="' + attr(section.id) + '">Bereich löschen</button></div>';
    html += '</div>';
    return html;
  }

  function renderDropMarker(sectionId, index) {
    var active = state.drag && state.drag.kind === 'element' && state.drag.overSectionId === sectionId && state.drag.overIndex === index;
    return '<span class="drop-marker ' + (active ? 'is-active' : '') + '" data-drop-section="' + attr(sectionId) + '" data-drop-index="' + index + '"></span>';
  }

  function renderSectionDropMarker(index) {
    var active = state.drag && state.drag.kind === 'section' && state.drag.overSectionIndex === index;
    return '<div class="section-drop-marker ' + (active ? 'is-active' : '') + '" data-section-drop-index="' + index + '"></div>';
  }

  function renderElementChip(element, isEdit) {
    var label = elementLabel(element);
    var cls = 'element-chip ' + element.type + '-chip ' + (state.activeElementId === element.id ? 'is-active' : '') + (state.drag && state.drag.elementId === element.id ? ' is-dragging' : '');
    if (!isEdit && element.type === 'number') return renderFillNumberChip(element, cls);
    var html = '<button class="' + cls + (element.type === 'text' && !element.text ? ' is-placeholder' : '') + '" data-action="select-element" data-id="' + attr(element.id) + '" data-element-id="' + attr(element.id) + '">';
    if (element.type === 'number' && element.stepper) {
      html += '<span>' + esc(label) + '</span><span class="stepper"><span>▴</span><span>▾</span></span>';
    } else if (element.type === 'formula') {
      if (!element.hideName) html += '<span>' + esc(element.name || 'Formel') + '</span>';
      html += '<strong data-result-for="' + attr(element.id) + '">' + esc(formatComputation(element, computeElement(element.id, []))) + '</strong>';
    } else {
      html += esc(label || 'Text');
    }
    html += '</button>';
    return html;
  }

  function renderFillNumberChip(element, cls) {
    var inputType = element.valueType === 'date' ? 'date' : 'number';
    var value = element.value || element.value === 0 ? element.value : '';
    var html = '<div class="' + cls + ' fill-number-chip ' + (element.stepper ? 'has-stepper' : '') + '" data-element-id="' + attr(element.id) + '">';
    if (element.stepper) html += '<button class="step-button" data-action="step-number" data-id="' + attr(element.id) + '" data-step="-1" title="Verringern">−</button>';
    html += '<input class="chip-number-input" data-field="element-value" data-id="' + attr(element.id) + '" type="' + inputType + '" step="any" inputmode="decimal" value="' + attr(value) + '" placeholder="0" />';
    if (element.stepper) html += '<button class="step-button" data-action="step-number" data-id="' + attr(element.id) + '" data-step="1" title="Erhöhen">+</button>';
    if (element.valueType === 'currency') html += '<span class="chip-unit">' + esc(element.currency || 'EUR') + '</span>';
    if (element.valueType === 'weight') html += '<span class="chip-unit">' + esc(element.unit || 'g') + '</span>';
    if (element.valueType === 'percent') html += '<span class="chip-unit">%</span>';
    html += '</div>';
    return html;
  }

  function renderElementEditor(element, isEdit) {
    var fillOnly = !isEdit;
    var title = fillOnly && element.type === 'formula' ? 'Erklärung' : (ELEMENT_TYPES[element.type] || 'Element');
    var html = '<div class="element-popover"><div class="editor-head"><span class="editor-title">' + esc(title) + '</span><button class="mini-button" data-action="close-element-editor">×</button></div>';
    if (element.type === 'text') html += renderTextEditor(element, isEdit);
    if (element.type === 'number') html += renderNumberEditor(element, isEdit, fillOnly);
    if (element.type === 'formula') html += renderFormulaEditor(element, isEdit);
    if (isEdit) {
      html += '<div class="action-row"><button class="danger-button" data-action="delete-element" data-id="' + attr(element.id) + '">Element löschen</button></div>';
    }
    html += '</div>';
    return html;
  }

  function renderTextEditor(element, isEdit) {
    var html = '';
    html += '<label class="field">Text<textarea class="textarea" data-field="element-text" data-id="' + attr(element.id) + '" placeholder="Text">' + esc(element.text || '') + '</textarea></label>';
    return html;
  }

  function renderNumberEditor(element, isEdit) {
    var html = '';
    html += '<div class="grid-two"><label class="field">Wert<input class="input" data-field="element-value" data-id="' + attr(element.id) + '" type="' + (element.valueType === 'date' ? 'date' : 'number') + '" step="any" inputmode="decimal" value="' + attr(element.value || element.value === 0 ? element.value : '') + '" /></label>';
    if (isEdit) html += '<label class="field">Format' + renderSelect('element-value-type', element.id, element.valueType || 'number', VALUE_TYPES) + '</label>';
    html += '</div>';
    if (isEdit && element.valueType === 'currency') html += '<label class="field">Währung' + renderSelect('element-currency', element.id, element.currency || 'EUR', listToOptions(CURRENCIES)) + '</label>';
    if (isEdit && element.valueType === 'weight') html += '<label class="field">Einheit' + renderSelect('element-unit', element.id, element.unit || 'g', WEIGHT_UNITS) + '</label>';
    if (isEdit) html += '<label class="field"><span><input type="checkbox" data-field="element-stepper" data-id="' + attr(element.id) + '" ' + (element.stepper ? 'checked' : '') + ' /> Zähler-Optik</span></label>';
    return html;
  }

  function renderFormulaEditor(element, isEdit) {
    var html = '<div class="grid-two">';
    if (isEdit) html += '<label class="field">Name<input class="input" data-field="element-name" data-id="' + attr(element.id) + '" value="' + attr(element.name || '') + '" placeholder="Formel" /></label>';
    html += '<label class="field">Ergebnis<input class="input" readonly value="' + attr(formatComputation(element, computeElement(element.id, []))) + '" /></label></div>';
    if (isEdit) {
      html += '<div class="grid-two"><label class="field">Rechnung' + renderSelect('formula-operator', element.id, element.formula.operator || 'chain', FORMULA_MODES) + '</label><label class="field">Format' + renderSelect('formula-value-type', element.id, element.valueType || 'number', FORMULA_VALUE_TYPES) + '</label></div>';
      html += '<label class="field checkbox-field"><span><input type="checkbox" data-field="formula-hide-name" data-id="' + attr(element.id) + '" ' + (element.hideName ? 'checked' : '') + ' /> Namen ausblenden</span></label>';
      if (element.valueType === 'currency') html += '<label class="field">Währung' + renderSelect('element-currency', element.id, element.currency || 'EUR', listToOptions(CURRENCIES)) + '</label>';
      if (element.valueType === 'weight') html += '<label class="field">Einheit' + renderSelect('element-unit', element.id, element.unit || 'g', WEIGHT_UNITS) + '</label>';
      html += renderFormulaRefs(element);
      html += renderSourcePicker(element);
    } else {
      html += '<div class="ref-sub">' + esc(formulaDescription(element)) + '</div>';
    }
    return html;
  }

  function renderFormulaRefs(element) {
    var inputs = element.formula.inputs || [];
    var html = '<div class="field">Werte verlinken';
    if (!inputs.length) html += '<div class="ref-pill"><span>Keine Werte</span><span></span></div>';
    inputs.forEach(function (ref, index) {
      var source = state.doc.elements[ref.elementId];
      var page = source ? getPage(source.pageId) : getPage(ref.pageId);
      html += '<div class="ref-pill formula-ref-row">';
      if ((element.formula.operator || 'chain') === 'average') {
        html += '<span class="ref-op-label">' + (index + 1) + '</span>';
      } else if (index === 0) {
        html += '<span class="ref-op-label">Start</span>';
      } else {
        html += renderRefOpSelect(element.id, index, ref.op || 'add');
      }
      if (isFormulaValueInput(ref)) {
        html += '<label class="inline-value"><span>Feste Zahl</span><input class="input compact-input" data-field="formula-constant-value" data-id="' + attr(element.id) + '" data-index="' + index + '" type="number" step="any" inputmode="decimal" value="' + attr(ref.value || ref.value === 0 ? ref.value : 0) + '" /></label>';
      } else {
        html += '<span>' + esc(source && !source.deletedAt ? elementLabel(source) : 'Fehlt') + '<br><span class="ref-sub">' + esc(page ? page.name : 'Seite fehlt') + '</span></span>';
      }
      html += '<button class="mini-button" data-action="remove-ref" data-id="' + attr(element.id) + '" data-index="' + index + '">×</button></div>';
    });
    html += '<button class="text-button" data-action="add-formula-constant" data-id="' + attr(element.id) + '">Feste Zahl hinzufügen</button>';
    html += '</div>';
    return html;
  }

  function renderRefOpSelect(formulaId, index, selected) {
    var html = '<select class="select ref-op-select" data-field="formula-ref-op" data-id="' + attr(formulaId) + '" data-index="' + index + '">';
    Object.keys(FORMULA_INPUT_OPS).forEach(function (value) {
      html += '<option value="' + attr(value) + '" ' + (value === selected ? 'selected' : '') + '>' + esc(FORMULA_INPUT_OPS[value].label) + '</option>';
    });
    html += '</select>';
    return html;
  }

  function renderSourcePicker(element) {
    var sources = sourceElements(element);
    var html = '<div class="field">Wert hinzufügen<div class="ref-list">';
    if (!sources.length) html += '<div class="ref-pill"><span>Keine Zahlen gefunden</span><span></span></div>';
    var lastGroup = '';
    sources.forEach(function (source) {
      var page = getPage(source.pageId);
      var section = getSection(source.sectionId);
      var group = sourceGroupLabel(element, source);
      if (group !== lastGroup) {
        html += '<div class="ref-group-label">' + esc(group) + '</div>';
        lastGroup = group;
      }
      html += '<button class="ref-button" data-action="add-ref" data-id="' + attr(element.id) + '" data-source-id="' + attr(source.id) + '"><span>' + esc(elementLabel(source)) + '<br><span class="ref-sub">' + esc((page ? page.name : 'Seite') + ' / ' + (section ? section.name : 'Bereich')) + '</span></span><span>＋</span></button>';
    });
    html += '</div></div>';
    return html;
  }

  function renderToolbar() {
    if (!state.currentPageId) return '';
    return '<nav class="keyboard-toolbar" role="toolbar" aria-label="Schnellleiste"><button class="toolbar-button" data-action="history-undo" title="Rückgängig">↶</button><button class="toolbar-button" data-action="history-redo" title="Wiederholen">↷</button><button class="toolbar-button" data-action="hide-keyboard" title="Tastatur schließen">⌄</button></nav>';
  }

  function renderDuplicatePrompt() {
    if (!state.duplicatePrompt) return '';
    return '<div class="duplicate-popover" style="--dup-x:' + attr(state.duplicatePrompt.x) + 'px; --dup-y:' + attr(state.duplicatePrompt.y) + 'px"><button class="duplicate-button" data-action="confirm-duplicate">Duplizieren</button></div>';
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
    var action = target ? target.dataset.action : '';
    if (state.duplicatePrompt) {
      if (action === 'confirm-duplicate') {
        event.preventDefault();
        state.suppressNextClick = false;
        return confirmDuplicate();
      }
      if (state.suppressNextClick && Date.now() < state.suppressClickUntil && isDuplicateSourceClick(event.target)) {
        state.suppressNextClick = false;
        event.preventDefault();
        return;
      }
      state.duplicatePrompt = null;
      state.suppressNextClick = false;
      event.preventDefault();
      render();
      return;
    }
    if (state.suppressNextClick) {
      if (!state.suppressClickUntil || Date.now() < state.suppressClickUntil) {
        event.preventDefault();
        return;
      }
      state.suppressNextClick = false;
    }
    state.suppressNextClick = false;
    if (!target) return;
    if (action === 'close-sheet' && target.classList.contains('sheet-backdrop') && event.target !== target) return;
    event.preventDefault();
    if (action === 'confirm-duplicate') return confirmDuplicate();
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
    if (action === 'toggle-section-colors') return toggleSectionColors(target.dataset.id);
    if (action === 'delete-section') return deleteSection(target.dataset.id);
    if (action === 'open-add-element') return openAddElement(target.dataset.id);
    if (action === 'create-element') return createElementFromSheet(target.dataset.type);
    if (action === 'select-element') return selectElement(target.dataset.id);
    if (action === 'close-element-editor') return closeElementEditor();
    if (action === 'delete-element') return deleteElement(target.dataset.id);
    if (action === 'step-number') return stepNumber(target.dataset.id, Number(target.dataset.step || 0));
    if (action === 'history-undo') return undoHistory();
    if (action === 'history-redo') return redoHistory();
    if (action === 'undo-delete') return undoDelete();
    if (action === 'add-ref') return addFormulaRef(target.dataset.id, target.dataset.sourceId);
    if (action === 'add-formula-constant') return addFormulaConstant(target.dataset.id);
    if (action === 'remove-ref') return removeFormulaRef(target.dataset.id, Number(target.dataset.index));
    if (action === 'set-page-emoji') return setPageEmoji(target.dataset.emoji);
    if (action === 'set-page-color') return setPageColor(target.dataset.color);
    if (action === 'set-section-color') return setSectionColor(target.dataset.id, target.dataset.color);
    if (action === 'delete-page') return deletePage();
    if (action === 'hide-keyboard') return hideKeyboard();
  }

  function isDuplicateSourceClick(target) {
    var prompt = state.duplicatePrompt;
    if (!prompt || !target) return false;
    if (prompt.kind === 'element') {
      var elementNode = target.closest('[data-element-id]');
      return !!(elementNode && elementNode.dataset.elementId === prompt.elementId);
    }
    if (prompt.kind === 'section') {
      var sectionNode = target.closest('.calc-section');
      return !!(sectionNode && sectionNode.dataset.sectionId === prompt.sectionId);
    }
    return false;
  }

  function handleContextMenu(event) {
    if (event.target.closest('[data-element-id], .section-title, .section-rail, .calc-section')) event.preventDefault();
  }

  function handleSelectStart(event) {
    if (state.drag && (state.drag.pending || state.drag.longPressed || state.drag.dragging)) event.preventDefault();
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
    if (field === 'formula-constant-value' && element.formula && element.formula.inputs[target.dataset.index]) {
      element.formula.inputs[target.dataset.index].kind = 'value';
      element.formula.inputs[target.dataset.index].value = parseNumber(target.value);
    }
    touch(element);
    saveDocument();
    if (field === 'element-text') resizeTextarea(target);
    if (!target.closest('.fill-number-chip')) refreshElementChip(element);
    refreshResults();
    renderSoonExceptTyping(field);
  }

  function handleChange(event) {
    var target = event.target;
    var field = target.dataset.field;
    if (!field) return;
    var element = state.doc.elements[target.dataset.id];
    if (!element) return;
    var beforeChange = state.history.inputSnapshot || snapshotDocument();
    state.history.inputSnapshot = null;
    commitHistory(beforeChange);
    if (field === 'element-value-type') {
      element.valueType = target.value;
      if (target.value === 'weight' && !element.unit) element.unit = 'g';
      if (target.value === 'currency' && !element.currency) element.currency = 'EUR';
      if (target.value === 'date' && typeof element.value === 'number') element.value = '';
      if (target.value !== 'date' && typeof element.value === 'string') element.value = parseNumber(element.value);
    }
    if (field === 'element-currency') element.currency = target.value;
    if (field === 'element-unit') element.unit = target.value;
    if (field === 'element-stepper') element.stepper = target.checked;
    if (field === 'formula-hide-name') element.hideName = target.checked;
    if (field === 'formula-operator') element.formula.operator = target.value;
    if (field === 'formula-ref-op' && element.formula && element.formula.inputs[target.dataset.index]) {
      element.formula.inputs[target.dataset.index].op = target.value;
    }
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
    commitHistory();
    var folder = stamp({ id: uid('folder'), name: '', isOpen: true, sortIndex: activeFolders().length });
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
    commitHistory();
    var pageId = uid('page');
    var sectionId = uid('section');
    var page = stamp({ id: pageId, folderId: folderId || null, name: '', icon: '🧾', color: COLORS[0], sortIndex: activePages().length, sectionOrder: [sectionId] });
    state.doc.pages.push(page);
    state.doc.sections[sectionId] = stamp({ id: sectionId, pageId: pageId, name: '', color: COLORS[0], elementOrder: [] });
    state.currentPageId = pageId;
    state.modeByPage[pageId] = 'edit';
    state.activeSectionId = sectionId;
    saveDocument();
    render();
  }

  function openPage(id) { state.currentPageId = id; state.sheet = null; state.duplicatePrompt = null; state.activeElementId = null; state.activeSectionId = null; state.activeSectionColorId = null; render(); }
  function goHome() { state.currentPageId = null; state.sheet = null; state.duplicatePrompt = null; state.activeElementId = null; state.activeSectionId = null; state.activeSectionColorId = null; render(); }
  function toggleTheme() { state.doc.settings.theme = state.doc.settings.theme === 'dark' ? 'light' : 'dark'; saveDocument(); render(); }
  function setMode(mode) { var page = currentPage(); if (!page) return; state.modeByPage[page.id] = mode; state.sheet = null; if (mode !== 'edit') { state.activeSectionId = null; state.activeSectionColorId = null; } render(); }
  function openSheet(sheet) { state.sheet = sheet; render(); }
  function closeSheet() { state.sheet = null; render(); }

  function addSection() {
    var page = currentPage();
    if (!page) return;
    commitHistory();
    state.sheet = null;
    var id = uid('section');
    state.doc.sections[id] = stamp({ id: id, pageId: page.id, name: '', color: COLORS[page.sectionOrder.length % COLORS.length], elementOrder: [] });
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
    state.activeSectionColorId = null;
    state.activeElementId = null;
    render();
  }

  function closeSectionEditor() { state.activeSectionId = null; state.activeSectionColorId = null; render(); }
  function updateSection(id, patch) { var section = getSection(id); if (!section) return; Object.assign(section, patch); touch(section); saveDocument(); }
  function toggleSectionColors(id) { state.activeSectionColorId = state.activeSectionColorId === id ? null : id; render(); }
  function setSectionColor(id, color) { commitHistory(); updateSection(id, { color: color }); state.activeSectionColorId = null; render(); }

  function deleteSection(id) {
    var section = getSection(id);
    var page = currentPage();
    if (!section || !page) return;
    if (section.elementOrder.some(function (elementId) { return getDependents(elementId).length; })) {
      if (!window.confirm('Ein Element in diesem Bereich wird verlinkt. Bereich trotzdem löschen?')) return;
    } else if (!window.confirm('Bereich löschen?')) return;
    commitHistory();
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

  function createElementFromSheet(type) {
    if (!state.sheet || !state.sheet.sectionId) return;
    createElement(state.sheet.sectionId, type);
  }

  function createElement(sectionId, type) {
    var section = getSection(sectionId);
    var page = currentPage();
    if (!section || !page) return;
    commitHistory();
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
    var element = stamp({ id: uid('element'), pageId: pageId, sectionId: sectionId, type: type, name: type === 'formula' ? 'Formel' : '', color: null, startsRow: false });
    if (type === 'text') element.text = '';
    if (type === 'number') { element.value = 0; element.valueType = 'number'; element.currency = 'EUR'; element.unit = ''; element.stepper = false; }
    if (type === 'formula') { element.valueType = 'number'; element.currency = 'EUR'; element.unit = ''; element.formula = { operator: 'chain', inputs: [] }; }
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

  function deleteElement(id) {
    var element = state.doc.elements[id];
    if (!element) return;
    var deps = getDependents(id);
    if (deps.length) {
      var names = deps.map(function (item) { return item.name || 'Formel'; }).join(', ');
      if (!window.confirm('Dieses Element wird verlinkt: ' + names + '. Trotzdem löschen?')) return;
    }
    commitHistory();
    var section = getSection(element.sectionId);
    var index = section ? section.elementOrder.indexOf(id) : -1;
    var snapshot = JSON.parse(JSON.stringify(element));
    element.deletedAt = now();
    touch(element);
    if (section) {
      section.elementOrder = section.elementOrder.filter(function (elementId) { return elementId !== id; });
      touch(section);
    }
    state.deletedUndo = { type: 'element', element: snapshot, sectionId: element.sectionId, index: index };
    state.activeElementId = null;
    saveDocument();
    showToast('Element gelöscht', 'undo');
    render();
  }

  function undoDelete() {
    if (!state.deletedUndo || state.deletedUndo.type !== 'element') return;
    commitHistory();
    var snapshot = state.deletedUndo.element;
    var section = getSection(state.deletedUndo.sectionId);
    snapshot.deletedAt = null;
    touch(snapshot);
    state.doc.elements[snapshot.id] = snapshot;
    if (section && section.elementOrder.indexOf(snapshot.id) === -1) {
      section.elementOrder.splice(Math.max(0, state.deletedUndo.index), 0, snapshot.id);
      touch(section);
    }
    state.deletedUndo = null;
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
    commitHistory();
    formula.formula.inputs.push({ pageId: source.pageId, elementId: source.id, op: formula.formula.inputs.length ? 'add' : 'start' });
    touch(formula);
    saveDocument();
    render();
  }

  function addFormulaConstant(formulaId) {
    var formula = state.doc.elements[formulaId];
    if (!formula || formula.type !== 'formula') return;
    formula.formula.inputs = formula.formula.inputs || [];
    commitHistory();
    formula.formula.inputs.push({ kind: 'value', value: 1, op: formula.formula.inputs.length ? 'multiply' : 'start' });
    touch(formula);
    saveDocument();
    render();
  }

  function removeFormulaRef(formulaId, index) {
    var formula = state.doc.elements[formulaId];
    if (!formula || !formula.formula) return;
    commitHistory();
    formula.formula.inputs.splice(index, 1);
    formula.formula.inputs.forEach(function (ref, refIndex) { ref.op = refIndex ? (ref.op === 'start' ? 'add' : ref.op || 'add') : 'start'; });
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
    commitHistory();
    page.deletedAt = now();
    touch(page);
    pageSections(page).forEach(function (section) { section.deletedAt = now(); touch(section); section.elementOrder.forEach(function (id) { if (state.doc.elements[id]) { state.doc.elements[id].deletedAt = now(); touch(state.doc.elements[id]); } }); });
    state.currentPageId = null;
    state.sheet = null;
    saveDocument();
    render();
  }

  function setPageEmoji(emoji) { var page = currentPage(); if (!page) return; commitHistory(); page.icon = emoji; touch(page); saveDocument(); render(); }
  function setPageColor(color) { var page = currentPage(); if (!page) return; commitHistory(); page.color = color; touch(page); saveDocument(); render(); }
  function updateFolderName(id, value) { var folder = getFolder(id); if (!folder) return; folder.name = value; touch(folder); saveDocument(); }
  function updatePageName(value) { var page = currentPage(); if (!page) return; page.name = value; touch(page); saveDocument(); }
  function hideKeyboard() { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); state.activeInput = false; syncToolbarClass(); }

  function stepNumber(id, delta) {
    var element = state.doc.elements[id];
    if (!element || element.type !== 'number' || element.valueType === 'date') return;
    commitHistory();
    element.value = parseNumber(element.value) + delta;
    touch(element);
    saveDocument();
    render();
  }

  function snapshotDocument() {
    return JSON.stringify(state.doc);
  }

  function pushHistorySnapshot(snapshot) {
    if (!snapshot || state.history.isRestoring) return;
    var stack = state.history.undo;
    if (stack[stack.length - 1] === snapshot) return;
    stack.push(snapshot);
    while (stack.length > state.history.limit) stack.shift();
    state.history.redo = [];
  }

  function commitHistory(snapshot) {
    pushHistorySnapshot(snapshot || snapshotDocument());
  }

  function prepareInputHistory(target) {
    if (!target.dataset || !target.dataset.field) return;
    state.history.inputSnapshot = snapshotDocument();
  }

  function finalizeInputHistory() {
    var snapshot = state.history.inputSnapshot;
    if (!snapshot) return;
    state.history.inputSnapshot = null;
    if (snapshot !== snapshotDocument()) pushHistorySnapshot(snapshot);
  }

  function undoHistory() {
    finalizeInputHistory();
    if (!state.history.undo.length) { showToast('Nichts zum Rückgängigmachen'); return render(); }
    var current = snapshotDocument();
    var previous = state.history.undo.pop();
    state.history.redo.push(current);
    restoreDocument(previous);
  }

  function redoHistory() {
    finalizeInputHistory();
    if (!state.history.redo.length) { showToast('Nichts zum Wiederholen'); return render(); }
    var current = snapshotDocument();
    var next = state.history.redo.pop();
    state.history.undo.push(current);
    restoreDocument(next);
  }

  function restoreDocument(snapshot) {
    try {
      state.history.isRestoring = true;
      state.doc = normalizeDocument(JSON.parse(snapshot));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.doc));
      if (state.currentPageId && !getPage(state.currentPageId)) state.currentPageId = null;
      state.sheet = null;
      state.activeElementId = null;
      state.activeSectionId = null;
      state.activeSectionColorId = null;
    } catch (error) {
      showToast('Wiederherstellen nicht möglich');
    } finally {
      state.history.isRestoring = false;
      render();
    }
  }

  function clearDefaultField(target) {
    var field = target.dataset && target.dataset.field;
    var fallback = defaultPlaceholderFor(target);
    if (!field || !fallback || target.value !== fallback) return;
    target.value = '';
    if (field === 'folder-name') updateFolderName(target.dataset.id, '');
    if (field === 'page-name') updatePageName('');
    if (field === 'section-name') updateSection(target.dataset.id, { name: '' });
    var element = state.doc.elements[target.dataset.id];
    if (element && field === 'element-text') { element.text = ''; touch(element); saveDocument(); }
    if (element && field === 'element-name') { element.name = ''; touch(element); saveDocument(); }
  }

  function defaultPlaceholderFor(target) {
    var field = target.dataset && target.dataset.field;
    if (field === 'folder-name') return 'Neuer Ordner';
    if (field === 'page-name') return 'Neue Seite';
    if (field === 'section-name') return 'Neuer Bereich';
    if (field === 'element-text') return 'Text';
    if (field === 'element-name') return 'Formel';
    return '';
  }

  function handlePointerDown(event) {
    if (event.button && event.button !== 0) return;
    if (getPageMode(currentPage()) !== 'edit') return;
    if (state.duplicatePrompt) return;
    if (isInput(event.target) || event.target.closest('.mini-button, .round-plus, .line-plus-button, .color-chip, .element-popover, .section-editor')) return;
    var chip = event.target.closest('[data-element-id]');
    var sectionNode = event.target.closest('.calc-section');
    var sectionControl = event.target.closest('.section-title, .section-rail') || (!chip && sectionNode ? sectionNode : null);
    var kind = chip ? 'element' : (sectionControl && sectionNode ? 'section' : null);
    if (!kind) return;
    var element = chip ? state.doc.elements[chip.dataset.elementId] : null;
    var section = sectionNode ? getSection(sectionNode.dataset.sectionId) : null;
    if (kind === 'element' && (!element || element.deletedAt)) return;
    if (kind === 'section' && (!section || section.deletedAt)) return;
    clearDragTimer();
    state.drag = {
      kind: kind,
      pending: true,
      dragging: false,
      longPressed: false,
      copied: false,
      elementId: element ? element.id : null,
      sectionId: section ? section.id : null,
      sourceSectionId: element ? element.sectionId : (section ? section.id : null),
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      overSectionId: element ? element.sectionId : (section ? section.id : null),
      overIndex: 0,
      overSectionIndex: section ? pageSections(currentPage()).filter(function (item) { return item.id !== section.id; }).length : 0,
      timer: window.setTimeout(function () {
        markLongPress();
      }, 420)
    };
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  }

  function handlePointerMove(event) {
    if (!state.drag) return;
    var dx = Math.abs(event.clientX - state.drag.startX);
    var dy = Math.abs(event.clientY - state.drag.startY);
    if (state.drag.pending && (dx > 10 || dy > 10)) return cancelDrag();
    state.drag.lastX = event.clientX;
    state.drag.lastY = event.clientY;
    if (state.drag.longPressed && state.drag.kind === 'element' && !state.drag.dragging && (dx > 8 || dy > 8)) {
      startElementDrag(event.clientX, event.clientY);
    }
    if (state.drag.longPressed && state.drag.kind === 'section' && !state.drag.dragging && (dx > 8 || dy > 8)) {
      startSectionDrag(event.clientX, event.clientY);
    }
    if (!state.drag.dragging) return;
    event.preventDefault();
    updateDragTarget(event.clientX, event.clientY);
    updateAutoScroll(event.clientY);
  }

  function handlePointerUp() {
    if (!state.drag) return;
    var wasDragging = state.drag.dragging;
    var wasLongPressed = state.drag.longPressed;
    var kind = state.drag.kind;
    var targetSectionId = state.drag.overSectionId;
    var targetIndex = state.drag.overIndex;
    var targetSectionIndex = state.drag.overSectionIndex;
    var elementId = state.drag.elementId;
    var sectionId = state.drag.sectionId;
    clearDragTimer();
    removeDragListeners();
    stopAutoScroll();
    document.body.classList.remove('is-dragging-element');
    document.body.classList.remove('is-long-pressing');
    state.drag = null;
    if (wasDragging) {
      state.suppressNextClick = true;
      state.suppressClickUntil = Date.now() + 550;
      if (kind === 'element') moveElement(elementId, targetSectionId, targetIndex);
      if (kind === 'section') moveSection(sectionId, targetSectionIndex);
    } else if (wasLongPressed) {
      state.suppressNextClick = true;
      state.suppressClickUntil = Date.now() + 550;
      openDuplicatePrompt(kind, elementId, sectionId, state.dragPointX || 0, state.dragPointY || 0);
    } else {
      return;
    }
  }

  function markLongPress() {
    if (!state.drag) return;
    state.drag.pending = false;
    state.drag.longPressed = true;
    state.dragPointX = state.drag.lastX || state.drag.startX;
    state.dragPointY = state.drag.lastY || state.drag.startY;
    document.body.classList.add('is-long-pressing');
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(12);
  }

  function startElementDrag(x, y) {
    if (!state.drag) return;
    state.drag.pending = false;
    state.drag.longPressed = true;
    state.drag.dragging = true;
    state.activeElementId = null;
    state.activeSectionId = null;
    state.sheet = null;
    document.body.classList.remove('is-long-pressing');
    document.body.classList.add('is-dragging-element');
    updateDragTarget(x, y, true);
    updateAutoScroll(y);
  }

  function startSectionDrag(x, y) {
    if (!state.drag) return;
    state.drag.pending = false;
    state.drag.longPressed = true;
    state.drag.dragging = true;
    state.activeElementId = null;
    state.activeSectionId = null;
    state.activeSectionColorId = null;
    state.sheet = null;
    document.body.classList.remove('is-long-pressing');
    document.body.classList.add('is-dragging-element');
    updateDragTarget(x, y, true);
    updateAutoScroll(y);
  }

  function updateDragTarget(x, y, forceRender) {
    if (!state.drag) return;
    var target = state.drag.kind === 'section' ? findSectionDropTarget(y) : findDropTarget(x, y);
    if (!target) return;
    var changed = false;
    if (state.drag.kind === 'section') {
      changed = state.drag.overSectionIndex !== target.index;
      state.drag.overSectionIndex = target.index;
    } else {
      changed = state.drag.overSectionId !== target.sectionId || state.drag.overIndex !== target.index;
      state.drag.overSectionId = target.sectionId;
      state.drag.overIndex = target.index;
    }
    if (changed || forceRender) render();
  }

  function updateAutoScroll(y) {
    if (!state.drag || !state.drag.dragging) return stopAutoScroll();
    var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var edge = Math.min(96, Math.max(64, viewportHeight * 0.14));
    var direction = 0;
    var distance = 0;
    if (y < edge) {
      direction = -1;
      distance = edge - y;
    } else if (y > viewportHeight - edge) {
      direction = 1;
      distance = y - (viewportHeight - edge);
    }
    if (!direction) return stopAutoScroll();
    var speed = Math.min(18, Math.max(3, Math.round(distance / 7)));
    if (state.autoScroll && state.autoScroll.direction === direction) {
      state.autoScroll.speed = speed;
      return;
    }
    stopAutoScroll();
    state.autoScroll = { direction: direction, speed: speed, timer: null };
    runAutoScroll();
  }

  function runAutoScroll() {
    if (!state.autoScroll || !state.drag || !state.drag.dragging) return stopAutoScroll();
    if (window.scrollBy) window.scrollBy(0, state.autoScroll.direction * state.autoScroll.speed);
    updateDragTarget(state.drag.lastX || state.drag.startX, state.drag.lastY || state.drag.startY, false);
    state.autoScroll.timer = window.setTimeout(runAutoScroll, 32);
  }

  function stopAutoScroll() {
    if (state.autoScroll && state.autoScroll.timer) window.clearTimeout(state.autoScroll.timer);
    state.autoScroll = null;
  }

  function findDropTarget(x, y) {
    var nodes = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)];
    var sectionNode = null;
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i] && nodes[i].closest) {
        sectionNode = nodes[i].closest('.calc-section');
        if (sectionNode) break;
      }
    }
    if (!sectionNode) return null;
    var sectionId = sectionNode.dataset.sectionId;
    var section = getSection(sectionId);
    if (!section) return null;
    var ids = (section.elementOrder || []).filter(function (id) {
      var element = state.doc.elements[id];
      return element && !element.deletedAt && id !== state.drag.elementId;
    });
    var chips = Array.prototype.slice.call(sectionNode.querySelectorAll('[data-element-id]')).filter(function (node) {
      return node.dataset.elementId !== state.drag.elementId;
    });
    var index = ids.length;
    for (var c = 0; c < chips.length; c += 1) {
      var rect = chips[c].getBoundingClientRect();
      var sameRow = y >= rect.top - 4 && y <= rect.bottom + 4;
      if (y < rect.top + rect.height / 2 || (sameRow && x < rect.left + rect.width / 2)) {
        index = Math.min(c, ids.length);
        break;
      }
    }
    return { sectionId: sectionId, index: index };
  }

  function findSectionDropTarget(y) {
    var page = currentPage();
    if (!page || !state.drag) return null;
    var sections = pageSections(page).filter(function (section) { return section.id !== state.drag.sectionId; });
    var nodes = Array.prototype.slice.call(app.querySelectorAll('.calc-section')).filter(function (node) {
      return node.dataset.sectionId !== state.drag.sectionId;
    });
    var index = sections.length;
    for (var i = 0; i < nodes.length; i += 1) {
      var rect = nodes[i].getBoundingClientRect();
      if (y < rect.top + rect.height / 2) {
        index = Math.min(i, sections.length);
        break;
      }
    }
    return { index: index };
  }

  function openDuplicatePrompt(kind, elementId, sectionId, x, y) {
    var width = window.innerWidth || 390;
    var height = window.innerHeight || 844;
    state.duplicatePrompt = {
      kind: kind,
      elementId: elementId || null,
      sectionId: sectionId || null,
      x: Math.min(Math.max(82, x), Math.max(82, width - 82)),
      y: Math.min(Math.max(82, y - 12), Math.max(82, height - 72))
    };
    render();
  }

  function confirmDuplicate() {
    var prompt = state.duplicatePrompt;
    if (!prompt) return;
    state.duplicatePrompt = null;
    state.suppressNextClick = false;
    if (prompt.kind === 'element') return copyElement(prompt.elementId);
    if (prompt.kind === 'section') return copySection(prompt.sectionId);
  }

  function moveElement(elementId, targetSectionId, targetIndex) {
    var element = state.doc.elements[elementId];
    var source = element && getSection(element.sectionId);
    var target = getSection(targetSectionId);
    if (!element || !source || !target) return render();
    var sourceIndex = source.elementOrder.indexOf(elementId);
    var sameSection = source.id === target.id;
    if (sameSection && sourceIndex === targetIndex) return render();
    commitHistory();
    source.elementOrder = source.elementOrder.filter(function (id) { return id !== elementId; });
    targetIndex = Math.max(0, Math.min(targetIndex, target.elementOrder.length));
    target.elementOrder.splice(targetIndex, 0, elementId);
    element.sectionId = target.id;
    element.pageId = target.pageId;
    touch(source);
    touch(target);
    touch(element);
    saveDocument();
    render();
  }

  function moveSection(sectionId, targetIndex) {
    var section = getSection(sectionId);
    var page = section && getPage(section.pageId);
    if (!section || !page) return render();
    var order = pageSections(page).map(function (item) { return item.id; });
    var sourceIndex = order.indexOf(sectionId);
    var nextOrder = order.filter(function (id) { return id !== sectionId; });
    targetIndex = Math.max(0, Math.min(targetIndex, nextOrder.length));
    if (sourceIndex === targetIndex) return render();
    commitHistory();
    nextOrder.splice(targetIndex, 0, sectionId);
    page.sectionOrder = nextOrder;
    touch(page);
    state.activeSectionId = sectionId;
    state.activeElementId = null;
    saveDocument();
    render();
  }

  function copyElement(elementId) {
    var element = state.doc.elements[elementId];
    var section = element && getSection(element.sectionId);
    if (!element || element.deletedAt || !section) return render();
    commitHistory();
    var clone = cloneElement(element, element.pageId, section.id);
    state.doc.elements[clone.id] = clone;
    var index = section.elementOrder.indexOf(elementId);
    section.elementOrder.splice(index + 1, 0, clone.id);
    touch(section);
    state.activeElementId = clone.id;
    state.activeSectionId = null;
    saveDocument();
    showToast('Element kopiert');
    render();
  }

  function copySection(sectionId) {
    var section = getSection(sectionId);
    var page = section && getPage(section.pageId);
    if (!section || section.deletedAt || !page) return render();
    commitHistory();
    var newSectionId = uid('section');
    var idMap = {};
    var newOrder = [];
    var sourceIds = (section.elementOrder || []).filter(function (id) {
      var element = state.doc.elements[id];
      return element && !element.deletedAt;
    });
    sourceIds.forEach(function (oldId) {
      idMap[oldId] = uid('element');
      newOrder.push(idMap[oldId]);
    });
    state.doc.sections[newSectionId] = stamp({
      id: newSectionId,
      pageId: page.id,
      name: section.name ? section.name + ' Kopie' : '',
      color: section.color,
      elementOrder: newOrder
    });
    sourceIds.forEach(function (oldId) {
      var clone = cloneElement(state.doc.elements[oldId], page.id, newSectionId, idMap[oldId]);
      if (clone.type === 'formula' && clone.formula && clone.formula.inputs) {
        clone.formula.inputs = clone.formula.inputs.map(function (ref) {
          if (idMap[ref.elementId]) {
            return Object.assign({}, ref, { pageId: page.id, elementId: idMap[ref.elementId] });
          }
          return ref;
        });
      }
      state.doc.elements[clone.id] = clone;
    });
    var index = page.sectionOrder.indexOf(section.id);
    page.sectionOrder.splice(index + 1, 0, newSectionId);
    touch(page);
    state.activeSectionId = newSectionId;
    state.activeElementId = null;
    state.activeSectionColorId = null;
    saveDocument();
    showToast('Bereich kopiert');
    render();
  }

  function cloneElement(element, pageId, sectionId, forcedId) {
    var clone = JSON.parse(JSON.stringify(element));
    clone.id = forcedId || uid('element');
    clone.pageId = pageId;
    clone.sectionId = sectionId;
    clone.createdAt = now();
    clone.updatedAt = clone.createdAt;
    clone.deletedAt = null;
    clone.version = 1;
    normalizeElement(clone);
    return clone;
  }

  function cancelDrag() {
    clearDragTimer();
    removeDragListeners();
    stopAutoScroll();
    document.body.classList.remove('is-dragging-element');
    document.body.classList.remove('is-long-pressing');
    state.drag = null;
  }

  function clearDragTimer() {
    if (state.drag && state.drag.timer) {
      window.clearTimeout(state.drag.timer);
      state.drag.timer = null;
    }
  }

  function removeDragListeners() {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerUp);
  }

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
    var formula = normalizeFormula(element.formula || { operator: 'chain', inputs: [] });
    var inputs = formula.inputs || [];
    if (!inputs.length) return { ok: false, error: 'Werte fehlen' };
    var values = [];
    for (var i = 0; i < inputs.length; i += 1) {
      if (isFormulaValueInput(inputs[i])) {
        values.push(parseNumber(inputs[i].value));
      } else {
        var source = state.doc.elements[inputs[i].elementId];
        if (!source || source.deletedAt) return { ok: false, error: 'Verknüpfung fehlt' };
        var result = computeElement(source.id, stack);
        if (!result.ok) return result;
        values.push(result.value);
      }
    }
    var value = values[0];
    if (formula.operator === 'average') value = values.reduce(function (sum, item) { return sum + item; }, 0) / values.length;
    if (formula.operator !== 'average') {
      for (var d = 1; d < values.length; d += 1) {
        var op = inputs[d].op || 'add';
        if (op === 'add') value += values[d];
        if (op === 'subtract') value -= values[d];
        if (op === 'multiply') value *= values[d];
        if (op === 'divide') {
          if (values[d] === 0) return { ok: false, error: 'Division durch 0' };
          value /= values[d];
        }
        if (op === 'percent') value *= values[d] / 100;
      }
    }
    if (!Number.isFinite(value)) return { ok: false, error: 'Ungültiges Ergebnis' };
    return { ok: true, value: value };
  }

  function refreshElementChip(element) {
    var chip = app.querySelector('[data-action=\"select-element\"][data-id=\"' + attr(element.id) + '\"]');
    if (!chip) return;
    if (element.type === 'number' && element.stepper) {
      chip.innerHTML = '<span>' + esc(elementLabel(element)) + '</span><span class=\"stepper\"><span>▴</span><span>▾</span></span>';
    } else if (element.type === 'formula') {
      chip.innerHTML = (element.hideName ? '' : '<span>' + esc(element.name || 'Formel') + '</span>') + '<strong data-result-for=\"' + attr(element.id) + '\">' + esc(formatComputation(element, computeElement(element.id, []))) + '</strong>';
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
    var formula = normalizeFormula(element.formula || { operator: 'chain', inputs: [] });
    var names = (formula.inputs || []).map(function (ref) { return formulaInputLabel(ref); });
    if (!names.length) return FORMULA_MODES[formula.operator] || 'Formel';
    if (formula.operator === 'average') return 'Ø(' + names.join(', ') + ')';
    var out = names[0];
    for (var i = 1; i < names.length; i += 1) {
      var op = FORMULA_INPUT_OPS[(formula.inputs[i] && formula.inputs[i].op) || 'add'] || FORMULA_INPUT_OPS.add;
      out += ' ' + op.symbol + ' ' + names[i];
    }
    return out;
  }

  function isFormulaValueInput(ref) {
    return !!ref && (ref.kind === 'value' || !ref.elementId);
  }

  function formulaInputLabel(ref) {
    if (isFormulaValueInput(ref)) return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 4 }).format(parseNumber(ref.value));
    return elementLabel(state.doc.elements[ref.elementId]) || 'Fehlt';
  }

  function sourceElements(formulaElement) {
    return Object.keys(state.doc.elements).map(function (id) { return state.doc.elements[id]; }).filter(function (element) {
      return element && !element.deletedAt && element.id !== formulaElement.id && (element.type === 'number' || element.type === 'formula') && element.valueType !== 'date';
    }).sort(function (a, b) {
      var pa = sourcePriority(formulaElement, a);
      var pb = sourcePriority(formulaElement, b);
      if (pa !== pb) return pa - pb;
      return sourceSortIndex(a) - sourceSortIndex(b);
    });
  }

  function sourcePriority(formulaElement, source) {
    if (source.sectionId === formulaElement.sectionId) return 0;
    if (source.pageId === formulaElement.pageId) return 1;
    return 2;
  }

  function sourceGroupLabel(formulaElement, source) {
    var priority = sourcePriority(formulaElement, source);
    if (priority === 0) return 'Dieser Bereich';
    if (priority === 1) return 'Diese Seite';
    return 'Andere Seiten';
  }

  function sourceSortIndex(source) {
    var page = getPage(source.pageId);
    var section = getSection(source.sectionId);
    var pageIndex = page ? (page.sortIndex || 0) : 9999;
    var sectionIndex = page && section ? (page.sectionOrder || []).indexOf(section.id) : 9999;
    var elementIndex = section ? (section.elementOrder || []).indexOf(source.id) : 9999;
    return pageIndex * 100000 + Math.max(0, sectionIndex) * 1000 + Math.max(0, elementIndex);
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
  function operatorOptions() { return FORMULA_MODES; }
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

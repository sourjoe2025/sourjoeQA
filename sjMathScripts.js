/* =========================================================================================
   sjMathScripts.js

   🧩 07Feb26 - Unit Convertor refactor support
   🧩 07Feb26-7 - HOTFIX: Restored Volume <-> Metric/Imperial sync (Cups/Tbsp/Tsp)
   🧩 07Feb26-8 - ENGINE REFACTOR:
      - Keep EXACT behavior + math output, but consolidate the control-flow into a single,
        readable "engine" with cached DOM lookups and reusable conversion primitives.
      - All original global handler names are preserved for sjLearn.html inline calls.
      - Debug readout (p#test) remains suppressed.

   🧩 07Feb26-9 - OPTIMIZE fix:
      - When Ingredient is CUSTOM, clicking OPTIMIZE must NOT reset xPerCup back to 125.
        We keep the CUSTOM <option> value synced to the user-edited xPerCup.

   NOTE:
   - This converter uses "grams per cup" (ingredient density) to bridge Mass <-> Volume.
   - The fraction rounding logic is preserved as-is (even if it looks odd) to avoid
     changing any user-visible outputs.

   ========================================================================================= */

var SJ_UC = (function () {

    /* ---------------------------
       Constants (kept identical)
       --------------------------- */
    const gPerPound        = 453.592;         // keep existing value (NOT 453.59237)
    const gPerOunce        = 28.3495;
    const OuncesPerPound   = 16.0;
    const tbspPerCup       = 16;
    const tspPertbsp       = 3;

    /* ---------------------------
       Cached DOM access helpers
       --------------------------- */
    const E = {}; // element cache

    function $(id) {
        if (!E[id]) { E[id] = document.getElementById(id); }
        return E[id];
    }

    function getVal(id) {
        const el = $(id);
        if (!el) { return 0; }
        const v = el.value;
        // Treat blank as zero to avoid NaN cascades while typing.
        return (v === '' || v === null || typeof v === 'undefined') ? 0 : Number(v);
    }

    function putVal(id, val) {
        const el = $(id);
        if (el) { el.value = val; }
    }

    function putHTML(id, html) {
        const el = $(id);
        if (el) { el.innerHTML = html; }
    }

    function selectIndex(id, idx) {
        const el = $(id);
        if (el && el.options && el.options[idx]) {
            el.options[idx].selected = 'selected';
        }
    }

    /* ---------------------------
       State (preserved semantics)
       --------------------------- */
    var leftover        = 0;     // used for residual stats + m2v rounding
    var gramsInVolume   = 500;
    var metricCombined  = 0.5;
    var imperialCombined= 1.13;
    var refreshFlag     = 0;

    // Density (grams per unit volume)
    var gramsPerCup  = 125;
    var gramsPertbsp = gramsPerCup / tbspPerCup;
    var gramsPertsp  = gramsPertbsp / tspPertbsp;

    /* ---------------------------
       Density / ingredient helpers
       --------------------------- */
    function gPerCupRefresh() {
        gramsPerCup = getVal('xPerCup');
        if (gramsPerCup <= 1) {
            gramsPerCup = 1;
            putVal('xPerCup', 1);
        }
        gramsPertbsp = gramsPerCup / tbspPerCup;
        gramsPertsp  = gramsPertbsp / tspPertbsp;
    }

    function gPerCupColor() {
        // 🧩 07Feb26 - Use a CSS class hook instead of directly setting inline colors.
        //             (Keeps the exact same visual behavior: CUSTOM=white, else=lightgray.)
        const sel = $('Ingredient');
        const inp = $('xPerCup');
        if (!sel || !inp) { return; }
        const txt = sel.options[sel.selectedIndex].text;
        inp.classList.toggle('sj-uc-isCustom', (txt === 'CUSTOM'));
    }

    /* ---------------------------
       Reset / Optimize buttons
       --------------------------- */
    function inputsAll(x, xMax) {
        let r = 'none';
        let u = 'block';

        gPerCupRefresh();

        if (refreshFlag === 0) {
            if (x < xMax) { r = 'block'; u = 'none'; }
            else { refreshFlag = 1; }
        }
        $('RefreshButtonDisplay').style.display = u;
        $('Reset').style.display = r;
    }

    /* ---------------------------
       Core conversions (unchanged)
       --------------------------- */

    // Metric -> Imperial (writes pounds/ounces fields)
    function m2i() {
        let y = getVal('kilos') * 1000 + getVal('gramsP');
        let z = parseInt(y / gPerPound);
        let a = ((y - gPerPound * z) / gPerOunce);

        putVal('pounds', z);
        putVal('ouncesP', a);

        // Debug suppressed (was: putHTML('test',...))
        a = a.toFixed(1);
        putVal('ounces', a);
    }

    // Metric -> Volume (writes Cups/Tbsp/Tsp and fraction selects)
    function m2v() {
        const cupsFraclist = [0.500 * gramsPerCup, 0.333 * gramsPerCup, 0.250 * gramsPerCup, 'cupsFrac'];
        const tbspFraclist = [0.500 * gramsPertbsp, 'tbspFrac'];

        // NOTE: These tsp fraction weights look inconsistent; preserved intentionally.
        const tspFraclist  = [0.500 * gramsPertsp, 0.250 * gramsPertbsp, 0.125 * gramsPertbsp, 'tspFrac'];

        const m2VList = [
            'CupsInput', gramsPerCup,  cupsFraclist,
            'tbspInput', gramsPertbsp, tbspFraclist,
            'tspInput',  gramsPertsp,  tspFraclist
        ];

        leftover = getVal('kilos') * 1000 + getVal('gramsP');

        for (let j = 0; j < 3; j++) {
            putVal(m2VList[3 * j + 0], calcVal(m2VList[3 * j + 1]));

            const t = m2VList[3 * j + 2];
            const sel = $(t[t.length - 1]);

            for (let i = 0; i < t.length - 1; i++) {
                let temp = 0;
                if ((temp = parseInt(leftover / t[i])) !== 0) {
                    sel.options[i].selected = 'selected';
                    leftover -= temp * t[i];
                    break;
                }
                // if cycles through all, set "--"
                if (i === t.length - 2) {
                    sel.options[t.length - 1].selected = 'selected';
                }
            }
        }
    }

    // Imperial -> Metric (writes kilos/grams/gramsP)
    function i2m() {
        let x = getVal('pounds') * gPerPound;
        let y = getVal('ouncesP') * gPerOunce;

        x = (x + y);

        y = parseInt(x / 1000);
        x = x - y * 1000;

        putVal('gramsP', x);

        x = x.toFixed(0);
        putVal('grams', x);
        putVal('kilos', y.toFixed(0));
    }

    // Volume -> Metric (writes kilos/grams/gramsP)
    function v2m() {
        let x =  (getVal('CupsInput') + getVal('cupsFrac')) * gramsPerCup +
                 (getVal('tbspInput') + getVal('tbspFrac')) * gramsPertbsp +
                 (getVal('tspInput')  + getVal('tspFrac'))  * gramsPertsp;

        gramsInVolume = x;

        let k = parseInt(x / 1000);
        putVal('kilos', k);

        k = x - k * 1000;

        // Preserve the original "precision patch" behavior on gramsP.
        let y = getVal('gramsP');
        y = y + k - y.toFixed(1);
        putVal('gramsP', y);

        k = k.toFixed(0);
        putVal('grams', k);
    }

    /* ---------------------------
       Misc utilities + stats
       --------------------------- */
    function calcVal(val) {
        let temp = parseInt(leftover / val);
        leftover -= temp * val;
        return temp;
    }

    function refreshStats() {
        metricCombined = ((getVal('kilos') * 1000 + getVal('gramsP')) / 1000);
        putHTML('metricSummary', metricCombined.toFixed(2));

        imperialCombined = (getVal('pounds') + getVal('ouncesP') / 16);
        putHTML('imperialSummary', imperialCombined.toFixed(2));

        let x = metricCombined * 1000;
        if (x !== 0) { x = (leftover / x) * 100; }
        $('residual').innerHTML = 'Accuracy: ' + leftover.toFixed(1) + ' grams (' + x.toFixed(1) + '% of Amount)';
    }

    /* ---------------------------
       Category update entrypoints
       --------------------------- */

    function inputsMetric() {
        m2i();
        m2v();
        refreshStats();
    }

    function inputsImperial() {
        i2m();
        m2v();
        refreshStats();
    }

    function inputsVolume() {
        v2m();
        m2i();
        refreshStats(); // uses last m2v leftover (original behavior)
    }

    /* ---------------------------
       Public API (used by wrappers)
       --------------------------- */

    function initValues() {

        const TargetValList = [
            'xPerCup', '125',
            'grams',   '500', 'gramsP', '500.000', 'kilos', '0',
            'ounces',  '1.6', 'ouncesP', '1.600',  'pounds', '1',
            'CupsInput', '4', 'tbspInput', '0', 'tspInput', '0'
        ];

        const TargetHTMLlist = [
            'xPerCupUnit', 'g/Cup',
            'residual',    'Accuracy:  0.5 grams (0.1% of Amount)'
        ];

        const TargetSelectedlist = [
            'Ingredient', '2',
            'cupsFrac',   '3',
            'tbspFrac',   '1',
            'tspFrac',    '3'
        ];

        for (let i = 0; i < TargetValList.length; i++) {
            putVal(TargetValList[i], TargetValList[++i]);
        }
        for (let i = 0; i < TargetHTMLlist.length; i++) {
            putHTML(TargetHTMLlist[i], TargetHTMLlist[++i]);
        }
        for (let i = 0; i < TargetSelectedlist.length; i++) {
            selectIndex(TargetSelectedlist[i], Number(TargetSelectedlist[++i]));
        }

        // Ensure density + custom highlight are in sync on init.
        gPerCupColor();
        gPerCupRefresh();

        inputsMetric();
    }

    /* ---------------------------
       Public handlers (called by sjLearn.html)
       --------------------------- */

    function handleChooseIngredient() {
        let x = getVal('Ingredient');
        putVal('xPerCup', x);
        gPerCupColor();
        gPerCupRefresh();
        m2i();
        m2v();
    }

    function handleGramsPerCup() {
        // Force ingredient selector back to CUSTOM when user edits g/Cup.
        const sel = $('Ingredient');
        if (sel && sel.options && sel.options[0]) {
            sel.options[0].selected = 'selected';
        }
        gPerCupColor();
        gPerCupRefresh();

        // 🧩 07Feb26-9 - OPTIMIZE should NOT reset the custom g/Cup back to 125.
        // When the user edits xPerCup we force the selector to CUSTOM; however, the
        // <option value="125">CUSTOM</option> value would otherwise stay at 125.
        // RefreshDisplay() calls handleChooseIngredient(), which copies the selected
        // option's value into xPerCup. By syncing the CUSTOM option's value to the
        // user's current gramsPerCup here, OPTIMIZE preserves the custom density.
        if (sel && sel.options && sel.options[0]) {
            sel.options[0].value = String(gramsPerCup);
        }
        m2i();
        m2v();
    }

    function handleGrams() {
        let x = getVal('grams');
        let y = getVal('gramsP');

        // Preserve original precision patch behavior.
        y = y + x - y.toFixed(1);
        putVal('gramsP', y);

        inputsAll(x, 1000);
        inputsMetric();
    }

    function handleKilos() {
        inputsAll(getVal('kilos'), 99);
        inputsMetric();
    }

    function handleOunces() {
        let x = getVal('ounces');
        let y = getVal('ouncesP');

        // Preserve original precision patch behavior.
        y = y + x - y.toFixed(1);
        putVal('ouncesP', y);

        inputsAll(x, 16);
        inputsImperial();
    }

    function handlePounds() {
        inputsAll(getVal('pounds'), 99);
        inputsImperial();
    }

    function handleCups() {
        inputsAll(getVal('CupsInput'), 99);
        inputsVolume();
    }

    function handleTbsp() {
        inputsAll(getVal('tbspInput'), tbspPerCup);
        inputsVolume();
    }

    function handleTsp() {
        inputsAll(getVal('tspInput'), tspPertbsp);
        inputsVolume();
    }

    function RefreshDisplay() {
        refreshFlag = 0;
        handleChooseIngredient();
        i2m();
        $('RefreshButtonDisplay').style.display = 'none';
        $('Reset').style.display = 'block';
    }

    // Expose a minimal API; wrappers below keep the old global names.
    return {
        initValues,
        handleChooseIngredient,
        handleGramsPerCup,
        handleGrams,
        handleKilos,
        handleOunces,
        handlePounds,
        handleCups,
        handleTbsp,
        handleTsp,
        RefreshDisplay
    };

})(); // END SJ_UC module


/* =========================================================================================
   Global wrappers (sjLearn.html calls these inline)
   ========================================================================================= */

function sjInitValues()          { SJ_UC.initValues(); }
function handleChooseIngredient(){ SJ_UC.handleChooseIngredient(); }
function handleGramsPerCup()     { SJ_UC.handleGramsPerCup(); }
function handleGrams()           { SJ_UC.handleGrams(); }
function handleKilos()           { SJ_UC.handleKilos(); }
function handleOunces()          { SJ_UC.handleOunces(); }
function handlePounds()          { SJ_UC.handlePounds(); }
function handleCups()            { SJ_UC.handleCups(); }
function handleTbsp()            { SJ_UC.handleTbsp(); }
function handleTsp()             { SJ_UC.handleTsp(); }
function RefreshDisplay()        { SJ_UC.RefreshDisplay(); }


/* =========================================================================================
   ✅ 2026-06-06 🧮 [SJ-CALC-SUITE-SCRIPTS-01]
   Standardized SourJoe calculator suite.
   - Keeps calculator JavaScript separate from sjLearnScripts.js.
   - Preserves existing Unit Convertor engine above.
   - Uses one common unit/alternate-display layer for new calculators.
   ========================================================================================= */

(function () {
  'use strict';

  const G_PER_OZ = 28.349523125;
  const CM_PER_IN = 2.54;
  const CP = { water: 4.184, flour: 1.80, salt: 0.86 };

  function $(id) { return document.getElementById(id); }
  function qsa(root, sel) { return Array.from((root || document).querySelectorAll(sel)); }
  function finite(n) { return Number.isFinite(n); }
  function numFromInput(el) { const n = parseFloat(el && el.value); return finite(n) ? n : 0; }
  function fmt(n, d) { if (!finite(n)) return '--'; return Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: d }); }
  function pct(n, d = 1) { return fmt(n, d) + '%'; }
  function fToC(f) { return (f - 32) * 5 / 9; }
  function cToF(c) { return c * 9 / 5 + 32; }
  function fDeltaToC(f) { return f * 5 / 9; }
  function cDeltaToF(c) { return c * 9 / 5; }
  function htime(h) { if (!finite(h) || h < 0) return '--'; const mins = Math.round(h * 60); const H = Math.floor(mins / 60); const M = mins % 60; return H ? (H + 'h ' + String(M).padStart(2, '0') + 'm') : (M + 'm'); }

  function massUnit(calc) { const r = calc.querySelector('input[data-sj-unit-kind="mass"]:checked'); return r ? r.value : 'metric'; }
  function tempUnit(calc) { const r = calc.querySelector('input[data-sj-unit-kind="temp"]:checked'); return r ? r.value : 'C'; }
  function displayToBase(v, kind, calc) {
    if (kind === 'mass') return massUnit(calc) === 'imperial' ? v * G_PER_OZ : v;
    if (kind === 'length') return massUnit(calc) === 'imperial' ? v * CM_PER_IN : v;
    if (kind === 'temp') return tempUnit(calc) === 'F' ? fToC(v) : v;
    if (kind === 'delta') return tempUnit(calc) === 'F' ? fDeltaToC(v) : v;
    return v;
  }
  function baseToDisplay(v, kind, calc) {
    if (kind === 'mass') return massUnit(calc) === 'imperial' ? v / G_PER_OZ : v;
    if (kind === 'length') return massUnit(calc) === 'imperial' ? v / CM_PER_IN : v;
    if (kind === 'temp') return tempUnit(calc) === 'F' ? cToF(v) : v;
    if (kind === 'delta') return tempUnit(calc) === 'F' ? cDeltaToF(v) : v;
    return v;
  }
  function unitText(kind, calc, alt) {
    if (kind === 'mass') return (alt ? (massUnit(calc) === 'imperial' ? 'g' : 'oz') : (massUnit(calc) === 'imperial' ? 'oz' : 'g'));
    if (kind === 'length') return (alt ? (massUnit(calc) === 'imperial' ? 'cm' : 'in') : (massUnit(calc) === 'imperial' ? 'in' : 'cm'));
    if (kind === 'temp' || kind === 'delta') return (alt ? (tempUnit(calc) === 'F' ? '°C' : '°F') : (tempUnit(calc) === 'F' ? '°F' : '°C'));
    return '';
  }
  function digits(kind, calc) {
    if (kind === 'mass') return massUnit(calc) === 'imperial' ? 2 : 1;
    if (kind === 'length') return massUnit(calc) === 'imperial' ? 2 : 1;
    return 1;
  }
  function setInputFromBase(el, calc) {
    const kind = el.dataset.sjKind;
    const base = parseFloat(el.dataset.sjBase);
    if (!kind || !finite(base)) return;
    el.value = fmt(baseToDisplay(base, kind, calc), digits(kind, calc));
    renderAlt(el, calc);
  }
  function updateBaseFromInput(el, calc) {
    const kind = el.dataset.sjKind;
    if (!kind) return;
    el.dataset.sjBase = String(displayToBase(numFromInput(el), kind, calc));
    renderAlt(el, calc);
  }
  function renderAlt(el, calc) {
    const kind = el.dataset.sjKind;
    if (!kind) return;
    const alt = calc.querySelector('[data-sj-alt-for="' + el.id + '"]');
    if (!alt) return;
    const base = parseFloat(el.dataset.sjBase);
    if (!finite(base)) { alt.textContent = ''; return; }
    const altUnit = unitText(kind, calc, true);
    let altVal;
    if (kind === 'mass') altVal = massUnit(calc) === 'imperial' ? base : base / G_PER_OZ;
    else if (kind === 'length') altVal = massUnit(calc) === 'imperial' ? base : base / CM_PER_IN;
    else if (kind === 'temp') altVal = tempUnit(calc) === 'F' ? base : cToF(base);
    else if (kind === 'delta') altVal = tempUnit(calc) === 'F' ? base : cDeltaToF(base);
    alt.textContent = fmt(altVal, digits(kind, calc)) + ' ' + altUnit;
  }
  function setOutput(id, baseValue, kind, calc, d) {
    const el = $(id); if (!el) return;
    const val = baseToDisplay(baseValue, kind, calc);
    el.textContent = fmt(val, typeof d === 'number' ? d : digits(kind, calc)) + ' ' + unitText(kind, calc, false);
    const alt = calc.querySelector('[data-sj-alt-for="' + id + '"]');
    if (alt) {
      const currentKind = tempUnit(calc) === 'F' || massUnit(calc) === 'imperial';
      let altVal, altUnit;
      if (kind === 'mass') { altVal = massUnit(calc) === 'imperial' ? baseValue : baseValue / G_PER_OZ; altUnit = unitText(kind, calc, true); }
      else if (kind === 'length') { altVal = massUnit(calc) === 'imperial' ? baseValue : baseValue / CM_PER_IN; altUnit = unitText(kind, calc, true); }
      else { altVal = tempUnit(calc) === 'F' ? baseValue : cToF(baseValue); altUnit = unitText(kind, calc, true); }
      alt.textContent = fmt(altVal, typeof d === 'number' ? d : digits(kind, calc)) + ' ' + altUnit;
    }
  }
  function base(id) { const el = $(id); return el ? parseFloat(el.dataset.sjBase) : NaN; }
  function val(id) { const el = $(id); return el ? numFromInput(el) : NaN; }
  function optVal(id, fallback) { const el = $(id); if (!el) return fallback; const n = parseFloat(el.value); return finite(n) ? n : fallback; }
  function setBase(id, baseVal, calc) { const el = $(id); if (!el) return; el.dataset.sjBase = String(baseVal); setInputFromBase(el, calc); }
  function summaryTable(rows) { return '<table><tbody>' + rows.map(r => '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>').join('') + '</tbody></table>'; }

  function initCalc(calc) {
    qsa(calc, '.sjcalc-num[data-sj-kind]').forEach(el => { updateBaseFromInput(el, calc); });
    qsa(calc, 'input[data-sj-unit-kind]').forEach(r => r.addEventListener('change', () => { qsa(calc, '.sjcalc-num[data-sj-kind]').forEach(el => setInputFromBase(el, calc)); recalc(calc); }));
    qsa(calc, '.sjcalc-num').forEach(el => el.addEventListener('input', () => { if (el.dataset.sjKind) updateBaseFromInput(el, calc); recalc(calc); }));
    qsa(calc, 'select').forEach(el => el.addEventListener('change', () => recalc(calc)));
    wireButtons(calc);
    recalc(calc);
  }

  function wireButtons(calc) {
    const type = calc.dataset.sjcalc;
    const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    if (type === 'bakersMath') on('sjbm_reset', () => { setBase('sjbm_flour',500,calc); setBase('sjbm_ingredient',100,calc); $('sjbm_percent').value=20; $('sjbm_calc').value='percent'; recalc(calc); });
    if (type === 'leaven') on('sjlev_reset', () => { setBase('sjlev_total',300,calc); setBase('sjlev_seed',30,calc); $('sjlev_hydration').value=100; $('sjlev_seedHydration').value=100; recalc(calc); });
    if (type === 'hydration') on('sjhyd_reset', () => { setBase('sjhyd_water',700,calc); setBase('sjhyd_other',0,calc); setBase('sjhyd_flour',900,calc); setBase('sjhyd_leaven',200,calc); $('sjhyd_leavenHydration').value=100; recalc(calc); });
    if (type === 'riseTime') {
      on('sjrt_benchmark', () => { setBase('sjrt_temp',23,calc); $('sjrt_inoc').value=9.3; $('sjrt_hydration').value=65; $('sjrt_salt').value=2; recalc(calc); });
      on('sjrt_reset', () => { setBase('sjrt_temp',23,calc); $('sjrt_inoc').value=9.3; $('sjrt_hydration').value=65; $('sjrt_salt').value=2; recalc(calc); });
    }
    if (type === 'riseFactor') {
      on('sjrf_boule', () => { $('sjrf_shape').value='boule'; setBase('sjrf_weight',1000,calc); setBase('sjrf_diameter',30,calc); setBase('sjrf_height',10,calc); recalc(calc); });
      on('sjrf_batard', () => { $('sjrf_shape').value='batard'; setBase('sjrf_weight',1000,calc); setBase('sjrf_length',20,calc); setBase('sjrf_width',20,calc); setBase('sjrf_height',10,calc); recalc(calc); });
    }
    if (type === 'dwt') on('sjdwt_reset', () => { setBase('sjdwt_total',350,calc); setBase('sjdwt_targetTemp',35,calc); setBase('sjdwt_hotTemp',100,calc); setBase('sjdwt_regularTemp',20,calc); recalc(calc); });
    if (type === 'ddt') {
      const mix = $('sjddt_mix');
      if (mix) mix.addEventListener('change', () => { if (mix.value !== 'custom') { setBase('sjddt_mixHeat', fDeltaToC(Number(mix.value)), calc); } recalc(calc); });
      on('sjddt_roomAll', () => { const r=base('sjddt_room'); ['sjddt_leavenTemp','sjddt_flour1Temp','sjddt_flour2Temp','sjddt_saltTemp','sjddt_otherTemp'].forEach(id=>setBase(id,r,calc)); recalc(calc); });
      on('sjddt_reset', () => { resetDDT(calc); });
    }
  }

  function recalc(calc) {
    if (!calc) return;
    const t = calc.dataset.sjcalc;
    if (t === 'bakersMath') calcBM(calc);
    if (t === 'leaven') calcLeaven(calc);
    if (t === 'hydration') calcHydration(calc);
    if (t === 'riseTime') calcRiseTime(calc);
    if (t === 'riseFactor') calcRiseFactor(calc);
    if (t === 'ddt') calcDDT(calc);
    if (t === 'dwt') calcDWT(calc);
  }

  function calcBM(calc) {
    let flour = base('sjbm_flour'), ing = base('sjbm_ingredient'), per = val('sjbm_percent');
    const mode = $('sjbm_calc').value;
    $('sjbm_flour').readOnly = mode === 'flour'; $('sjbm_ingredient').readOnly = mode === 'ingredient'; $('sjbm_percent').readOnly = mode === 'percent';
    let warn = '';
    if (mode === 'percent') per = flour > 0 ? ing / flour * 100 : NaN;
    if (mode === 'ingredient') ing = flour * per / 100;
    if (mode === 'flour') flour = per > 0 ? ing / (per / 100) : NaN;
    if (finite(flour)) setBase('sjbm_flour', flour, calc);
    if (finite(ing)) setBase('sjbm_ingredient', ing, calc);
    if (finite(per)) $('sjbm_percent').value = fmt(per,1);
    $('sjbm_result').innerHTML = `With <strong>${fmt(baseToDisplay(flour,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> recipe flour and <strong>${fmt(baseToDisplay(ing,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> ingredient amount, the ingredient is <strong>${pct(per,1)}</strong> baker's percentage.`;
    $('sjbm_summary').innerHTML = summaryTable([['Recipe Flour', fmt(flour,1)+' g'], ['Ingredient Amount', fmt(ing,1)+' g'], ["Baker's Percentage", pct(per,1)]]);
  }

  function calcLeaven(calc) {
    const T = base('sjlev_total'), H = val('sjlev_hydration'), S = base('sjlev_seed'), SH = val('sjlev_seedHydration');
    const seedFlour = S / (1 + SH/100), seedWater = S - seedFlour;
    const targetFlour = T / (1 + H/100), targetWater = T - targetFlour;
    const flourAdd = targetFlour - seedFlour, waterAdd = targetWater - seedWater;
    setOutput('sjlev_water', waterAdd, 'mass', calc); setOutput('sjlev_flour', flourAdd, 'mass', calc);
    let warn = ''; if (waterAdd < 0 || flourAdd < 0) warn = '<div class="sjcalc-warning">The requested leaven cannot be made by adding only flour and water to this seed starter.</div>';
    $('sjlev_result').innerHTML = `To make <strong>${fmt(baseToDisplay(T,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> of <strong>${pct(H,1)}</strong> hydration leaven using <strong>${fmt(baseToDisplay(S,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> seed starter at <strong>${pct(SH,1)}</strong> hydration, mix the starter with <strong>${fmt(baseToDisplay(waterAdd,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> water and <strong>${fmt(baseToDisplay(flourAdd,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> flour.` + warn;
    $('sjlev_summary').innerHTML = summaryTable([['Seed flour', fmt(seedFlour,1)+' g'], ['Seed water', fmt(seedWater,1)+' g'], ['Target total flour', fmt(targetFlour,1)+' g'], ['Target total water', fmt(targetWater,1)+' g']]);
  }

  function calcHydration(calc) {
    const water=base('sjhyd_water'), other=base('sjhyd_other'), flour=base('sjhyd_flour'), lev=base('sjhyd_leaven'), lh=val('sjhyd_leavenHydration');
    const levFlour = lev / (1 + lh/100), levWater = lev - levFlour;
    const totalFlour = flour + levFlour, totalWater = water + other + levWater;
    const hyd = totalFlour > 0 ? totalWater / totalFlour * 100 : NaN;
    $('sjhyd_hydration').textContent = pct(hyd,1);
    $('sjhyd_result').innerHTML = `My bread recipe has <strong>${fmt(baseToDisplay(water,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> recipe water, <strong>${fmt(baseToDisplay(other,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> other liquids, <strong>${fmt(baseToDisplay(flour,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> recipe flour, and <strong>${fmt(baseToDisplay(lev,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> of <strong>${pct(lh,1)}</strong> hydration leaven, making recipe hydration <strong>${pct(hyd,1)}</strong>.`;
    $('sjhyd_summary').innerHTML = summaryTable([['Leaven flour', fmt(levFlour,1)+' g'], ['Leaven water', fmt(levWater,1)+' g'], ['Total formula flour', fmt(totalFlour,1)+' g'], ['Total formula water/liquid', fmt(totalWater,1)+' g']]);
  }

  function calcRiseTime(calc) {
    const T=base('sjrt_temp'), I=val('sjrt_inoc'), H=val('sjrt_hydration'), S=val('sjrt_salt');
    const T0=optVal('sjrt_refTempC',20), I0=optVal('sjrt_refInoculation',20), H0=optVal('sjrt_refHydration',65), S0=optVal('sjrt_refSalt',2);
    const Q10=optVal('sjrt_q10',2), bulkBase=optVal('sjrt_bulkBaseHours',3.75), proofBase=optVal('sjrt_proofBaseHours',1.30);
    const bulkExp=optVal('sjrt_bulkInocExp',1), proofExp=optVal('sjrt_proofInocExp',1), saltK=optVal('sjrt_saltCoeff',0.054), hydK=optVal('sjrt_hydrationCoeff',0.005);
    const rt = Math.pow(Q10, (T-T0)/10), rBulkI = I>0 && I0>0 ? Math.pow(I/I0,bulkExp) : NaN, rProofI = I>0 && I0>0 ? Math.pow(I/I0,proofExp) : NaN;
    const rs = Math.max(.25, 1 - saltK*(S-S0)), rh = Math.max(.4, 1 + hydK*(H-H0));
    const bulkRate = rt*rBulkI*rs*rh, proofRate = rt*rProofI*rs*rh, bulk=bulkBase/bulkRate, proof=proofBase/proofRate, total=bulk+proof;
    $('sjrt_bulk').textContent=htime(bulk); $('sjrt_proof').textContent=htime(proof); $('sjrt_total').textContent=htime(total);
    $('sjrt_result').innerHTML = `Estimated rise time: <strong>${htime(bulk)}</strong> bulk, <strong>${htime(proof)}</strong> proof, for a total of <strong>${htime(total)}</strong>. Actual dough behavior may vary by flour, starter strength, handling, and desired rise level.`;
    $('sjrt_summary').innerHTML = summaryTable([['Temperature rate', fmt(rt,3)], ['Bulk inoculation rate', fmt(rBulkI,3)], ['Proof inoculation rate', fmt(rProofI,3)], ['Salt rate', fmt(rs,3)], ['Hydration rate', fmt(rh,3)], ['Bulk combined rate', fmt(bulkRate,3)], ['Proof combined rate', fmt(proofRate,3)]]);
  }

  function calcRiseFactor(calc) {
    const shape=$('sjrf_shape').value; calc.classList.toggle('sjcalc-shape-boule', shape==='boule'); calc.classList.toggle('sjcalc-shape-batard', shape==='batard');
    const m=base('sjrf_weight'), H=base('sjrf_height'); let V, compare='';
    if (shape==='boule') { const D=base('sjrf_diameter'), r=D/2; V=(Math.PI*H/6)*(3*r*r+H*H); const cyl=Math.PI*r*r*H; compare = summaryTable([['Preferred spherical cap volume', fmt(V,1)+' cm³'], ['Simple cylinder display score', fmt((cyl/m)*10,1)], ['Simple cylinder density', fmt(m/cyl,3)+' g/cm³']]); }
    else { const L=base('sjrf_length'), W=base('sjrf_width'), a=L/2, b=W/2; V=(Math.PI*H/6)*(3*a*b+H*H); const cyl=Math.PI*a*b*H; compare = summaryTable([['Preferred elliptical cap volume', fmt(V,1)+' cm³'], ['Elliptical cylinder display score', fmt((cyl/m)*10,1)], ['Elliptical cylinder density', fmt(m/cyl,3)+' g/cm³']]); }
    const sv=V/m, den=m/V, score=sv*10;
    $('sjrf_volume').textContent=fmt(V,1); $('sjrf_sv').textContent=fmt(sv,3); $('sjrf_density').textContent=fmt(den,3);
    $('sjrf_result').innerHTML = `This baked-and-cooled <strong>${shape}</strong> has estimated volume <strong>${fmt(V,1)} cm³</strong>, scientific rise factor <strong>${fmt(sv,3)} cm³/g</strong>, density <strong>${fmt(den,3)} g/cm³</strong>, and scaled display score <strong>${fmt(score,1)}</strong>.`;
    $('sjrf_summary').innerHTML = summaryTable([['Scaled display score', fmt(score,1)], ['Measurement assumption', 'Use baked, fully cooled loaf dimensions.']]);
    const c=$('sjrf_compare'); if(c) c.innerHTML=compare;
  }


  function calcDWT(calc) {
    const total = base('sjdwt_total'), target = base('sjdwt_targetTemp'), hotT = base('sjdwt_hotTemp'), regularT = base('sjdwt_regularTemp');
    const range = hotT - regularT;
    let hotMass = NaN, regularMass = NaN, warn = '';
    if (!finite(total) || total <= 0) {
      warn = '<div class="sjcalc-warning">Enter a desired water amount greater than zero.</div>';
    } else if (!finite(range) || Math.abs(range) < 0.0001) {
      warn = '<div class="sjcalc-warning">Hot water and regular water temperatures must be different.</div>';
    } else {
      hotMass = total * (target - regularT) / range;
      regularMass = total - hotMass;
      const low = Math.min(hotT, regularT), high = Math.max(hotT, regularT);
      if (target < low || target > high) warn = '<div class="sjcalc-warning">The desired temperature is outside the range of the two source waters, so it cannot be reached by mixing only those waters.</div>';
      if (hotMass < 0 || regularMass < 0) warn += '<div class="sjcalc-warning">One calculated water amount is negative. Adjust the desired temperature or source-water temperatures.</div>';
    }
    setOutput('sjdwt_hotMass', hotMass, 'mass', calc, digits('mass', calc));
    setOutput('sjdwt_regularMass', regularMass, 'mass', calc, digits('mass', calc));
    const mixedCheck = finite(hotMass) && finite(regularMass) && total !== 0 ? ((hotMass * hotT + regularMass * regularT) / total) : NaN;
    $('sjdwt_result').innerHTML = `To make <strong>${fmt(baseToDisplay(total,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> of water at <strong>${fmt(baseToDisplay(target,'temp',calc),1)} ${unitText('temp',calc)}</strong>, mix <strong>${fmt(baseToDisplay(hotMass,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> boiling/hot water at <strong>${fmt(baseToDisplay(hotT,'temp',calc),1)} ${unitText('temp',calc)}</strong> with <strong>${fmt(baseToDisplay(regularMass,'mass',calc),digits('mass',calc))} ${unitText('mass',calc)}</strong> regular water at <strong>${fmt(baseToDisplay(regularT,'temp',calc),1)} ${unitText('temp',calc)}</strong>.` + warn;
    $('sjdwt_summary').innerHTML = summaryTable([['Hot water', fmt(baseToDisplay(hotMass,'mass',calc),digits('mass',calc))+' '+unitText('mass',calc)], ['Regular water', fmt(baseToDisplay(regularMass,'mass',calc),digits('mass',calc))+' '+unitText('mass',calc)], ['Target temperature', fmt(baseToDisplay(target,'temp',calc),1)+' '+unitText('temp',calc)], ['Mixed-temperature check', fmt(baseToDisplay(mixedCheck,'temp',calc),1)+' '+unitText('temp',calc)]]);
  }

  function resetDDT(calc) {
    const pairs = { sjddt_target: fToC(78), sjddt_room: fToC(72), sjddt_mixHeat: fDeltaToC(4), sjddt_leavenMass:100, sjddt_leavenTemp:fToC(75), sjddt_flour1:400, sjddt_flour1Temp:fToC(72), sjddt_flour2:100, sjddt_flour2Temp:fToC(40), sjddt_salt:11, sjddt_saltTemp:fToC(72), sjddt_other:0, sjddt_otherTemp:fToC(72), sjddt_water:350 };
    Object.keys(pairs).forEach(id => setBase(id,pairs[id],calc));
    $('sjddt_mix').value='4'; $('sjddt_leavenHydration').value=100; $('sjddt_otherLiquidPct').value=100; recalc(calc);
  }
  function calcDDT(calc) {
    const target=base('sjddt_target'), mixHeat=base('sjddt_mixHeat'), targetPremix=target-mixHeat;
    const levMass=base('sjddt_leavenMass'), levHyd=val('sjddt_leavenHydration'), levTemp=base('sjddt_leavenTemp');
    const levFlour=levMass/(1+levHyd/100), levWater=levMass-levFlour, levCp=levFlour*CP.flour+levWater*CP.water;
    const f1=base('sjddt_flour1'), f1t=base('sjddt_flour1Temp'), f2=base('sjddt_flour2'), f2t=base('sjddt_flour2Temp'), salt=base('sjddt_salt'), saltt=base('sjddt_saltTemp'), other=base('sjddt_other'), othert=base('sjddt_otherTemp'), water=base('sjddt_water');
    const otherLiquidPct=val('sjddt_otherLiquidPct');
    const nonWaterCp=levCp+f1*CP.flour+f2*CP.flour+salt*CP.salt+other*CP.water;
    const nonWaterHeat=levCp*levTemp+f1*CP.flour*f1t+f2*CP.flour*f2t+salt*CP.salt*saltt+other*CP.water*othert;
    const waterCp=water*CP.water, totalCp=nonWaterCp+waterCp;
    const Tw=((targetPremix*totalCp)-nonWaterHeat)/waterCp;
    setOutput('sjddt_waterTemp',Tw,'temp',calc,1);
    const flourBasis=f1+f2, formulaFlour=flourBasis+levFlour, otherLiquid=other*otherLiquidPct/100;
    const recipeHyd=flourBasis>0?(water+otherLiquid)/flourBasis*100:NaN, trueHyd=formulaFlour>0?(water+otherLiquid+levWater)/formulaFlour*100:NaN, inoc=formulaFlour>0?levFlour/formulaFlour*100:NaN;
    const bp = (m)=>flourBasis>0?pct(m/flourBasis*100,1):'--';
    $('sjddt_levPct').textContent=bp(levMass); $('sjddt_f1Pct').textContent=bp(f1); $('sjddt_f2Pct').textContent=bp(f2); $('sjddt_saltPct').textContent=bp(salt); $('sjddt_otherPct').textContent=bp(other); $('sjddt_waterPct').textContent=bp(water);
    let warn=''; if(Tw<0) warn='<div class="sjcalc-warning">Calculated water temperature is below freezing; the target may be impractical.</div>'; if(Tw>49) warn+='<div class="sjcalc-warning">Calculated water temperature is very warm; use caution with starter and flour behavior.</div>';
    $('sjddt_result').innerHTML = `To reach a desired dough temperature of <strong>${fmt(baseToDisplay(target,'temp',calc),1)} ${unitText('temp',calc)}</strong>, use water at approximately <strong>${fmt(baseToDisplay(Tw,'temp',calc),1)} ${unitText('temp',calc)}</strong>.` + warn;
    $('sjddt_summary').innerHTML = summaryTable([['Recipe hydration', pct(recipeHyd,1)], ['Formula hydration incl. leaven', pct(trueHyd,1)], ['Inoculation', pct(inoc,1)], ['Total dough mass', fmt(levMass+f1+f2+salt+other+water,1)+' g'], ['Leaven flour / water', fmt(levFlour,1)+' g / '+fmt(levWater,1)+' g']]);
  }

  function registerBubbleMessages() {
    const msgs = {

      sjCalcHelpIntroBM:{html:true,text:'<p>Choose which value to calculate, then enter the other two. SourJoe keeps flour as the 100% baker\'s-math basis.</p>'},
      sjCalcHelpIntroLeaven:{html:true,text:'<p>Enter the target leaven, target hydration, seed amount, and seed hydration. SourJoe subtracts the flour and water already present in the seed starter.</p>'},
      sjCalcHelpIntroHydration:{html:true,text:'<p>Enter recipe water, other liquids, recipe flour, leaven amount, and leaven hydration. SourJoe includes the water and flour hidden inside the leaven.</p>'},
      sjCalcHelpIntroRiseTime:{html:true,text:'<p>Enter dough temperature, inoculation, hydration, and salt. This gives a model estimate for bulk, proof, and total rise time; actual dough still rules.</p>'},
      sjCalcHelpIntroRiseFactor:{html:true,text:'<p>Choose boule or batard, enter baked-and-cooled loaf dimensions, and SourJoe estimates volume, specific volume, density, and scaled display score.</p>'},
      sjCalcHelpIntroDDT:{html:true,text:'<p>Enter your desired dough temperature plus ingredient masses and temperatures. SourJoe solves for the water temperature needed after mix heat is considered.</p>'},
      sjCalcHelpIntroDWT:{html:true,text:'<p>Enter the final water amount and desired temperature, plus hot and regular water temperatures. SourJoe calculates how many grams or ounces of each water to mix.</p>'},
      sjCalcHelpDWTTargetMass:{html:true,text:'<p>The final total amount of mixed water you want.</p>'},
      sjCalcHelpDWTTargetTemp:{html:true,text:'<p>The desired temperature of the mixed water.</p>'},
      sjCalcHelpDWTHotTemp:{html:true,text:'<p>The temperature of the hot water. Boiling water defaults to 100°C / 212°F, but this can be lower at altitude.</p>'},
      sjCalcHelpDWTRegularTemp:{html:true,text:'<p>The temperature of the cooler regular water, usually tap, filtered, or room-temperature water.</p>'},
      sjCalcHelpDWTHotMass:{html:true,text:'<p>The calculated amount of hot water to use.</p>'},
      sjCalcHelpDWTRegularMass:{html:true,text:'<p>The calculated amount of regular water to use.</p>'},
      sjCalcHelpCalculateField:{html:true,text:'<p>Choose the value SourJoe should calculate. The other inputs remain editable.</p>'},
      sjCalcHelpRecipeFlour:{html:true,text:'<p>Recipe flour is the flour basis for baker\'s math. In these calculators, it is usually the main recipe flour excluding leaven flour unless specifically stated.</p>'},
      sjCalcHelpIngredientAmount:{html:true,text:'<p>The weight of the ingredient being compared to recipe flour.</p>'},
      sjCalcHelpBakersPercent:{html:true,text:'<p>Baker\'s % = ingredient amount ÷ recipe flour amount × 100.</p>'},
      sjCalcHelpTargetLeaven:{html:true,text:'<p>The total amount of leaven you want to build.</p>'},
      sjCalcHelpLeavenHydration:{html:true,text:'<p>Leaven hydration is water weight divided by flour weight in the leaven.</p>'},
      sjCalcHelpSeedStarter:{html:true,text:'<p>The amount of existing starter used to seed the new leaven.</p>'},
      sjCalcHelpSeedHydration:{html:true,text:'<p>The hydration of the seed starter. A 100% hydration starter is equal parts flour and water by weight.</p>'},
      sjCalcHelpWaterToAdd:{html:true,text:'<p>The water needed in addition to the seed starter.</p>'},
      sjCalcHelpFlourToAdd:{html:true,text:'<p>The flour needed in addition to the seed starter.</p>'},
      sjCalcHelpRecipeWater:{html:true,text:'<p>Water added directly to the recipe, not counting water already inside the leaven.</p>'},
      sjCalcHelpOtherLiquids:{html:true,text:'<p>Milk, tea, coffee, beer, or other liquids that contribute to dough hydration.</p>'},
      sjCalcHelpLeavenAmount:{html:true,text:'<p>Total leaven amount. The calculator splits it into flour and water using leaven hydration.</p>'},
      sjCalcHelpBreadHydration:{html:true,text:'<p>Hydration is liquid weight divided by flour weight, expressed as a percentage.</p>'},
      sjCalcHelpDoughTemp:{html:true,text:'<p>Dough temperature used for the rise-time estimate.</p>'},
      sjCalcHelpInoculation:{html:true,text:'<p>Inoculation is leaven flour divided by total formula flour.</p>'},
      sjCalcHelpSaltPct:{html:true,text:'<p>Salt as a baker\'s percentage of recipe flour.</p>'},
      sjCalcHelpBulkTime:{html:true,text:'<p>Estimated bulk fermentation time.</p>'},
      sjCalcHelpProofTime:{html:true,text:'<p>Estimated final proof time.</p>'},
      sjCalcHelpTotalRiseTime:{html:true,text:'<p>Bulk plus proof. Treat this as an estimate, not a promise.</p>'},
      sjCalcHelpLoafShape:{html:true,text:'<p>Select boule or batard so the calculator uses the correct domed volume model.</p>'},
      sjCalcHelpLoafWeight:{html:true,text:'<p>Weigh the loaf after it is baked and fully cooled.</p>'},
      sjCalcHelpLoafDiameter:{html:true,text:'<p>Boule diameter across the widest part of the cooled loaf.</p>'},
      sjCalcHelpLoafLength:{html:true,text:'<p>Batard length across the long axis of the cooled loaf.</p>'},
      sjCalcHelpLoafWidth:{html:true,text:'<p>Batard width across the short axis of the cooled loaf.</p>'},
      sjCalcHelpLoafHeight:{html:true,text:'<p>Maximum loaf height after cooling.</p>'},
      sjCalcHelpLoafVolume:{html:true,text:'<p>Estimated geometric volume in cubic centimeters.</p>'},
      sjCalcHelpSpecificVolume:{html:true,text:'<p>Scientific rise factor: loaf volume divided by loaf weight, in cm³/g.</p>'},
      sjCalcHelpDensity:{html:true,text:'<p>Density is loaf weight divided by estimated volume.</p>'},
      sjCalcHelpTargetDoughTemp:{html:true,text:'<p>The desired dough temperature immediately after mixing.</p>'},
      sjCalcHelpRoomTemp:{html:true,text:'<p>Room temperature is used for convenience when setting ingredient temperatures to room.</p>'},
      sjCalcHelpMixMethod:{html:true,text:'<p>Mixing method sets the default friction/mix heat value. Choose Custom to override.</p>'},
      sjCalcHelpMixHeat:{html:true,text:'<p>Mixing adds heat. This value is subtracted from the target before solving for water temperature.</p>'},
      sjCalcHelpOtherLiquid:{html:true,text:'<p>Use 100% for mostly-water liquids and 0% for dry inclusions.</p>'}
    };
    if (window.SJBubbles && typeof window.SJBubbles.setMessages === 'function') {
      window.SJBubbles.setMessages(msgs);
      if (typeof window.SJBubbles.init === 'function') window.SJBubbles.init();
      return true;
    }
    return false;
  }

  function init() { qsa(document, '.sjcalc').forEach(initCalc); let tries=0; (function wait(){ if(registerBubbleMessages()) return; if(++tries<20) setTimeout(wait,100); })(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();

/* =========================================================================================
   ✅ 2026-06-08 🧮 [SJ-CALC-PASS2-RH-PIN-JS-01]
   Calculator Rabbit Hole popup fix

   Problem fixed:
   - Calculator Rabbit Hole panels used the older in-flow .sjRabbitHole-panel toggle path.
   - They opened above the veil, but the panel itself moved with the page instead of staying
     pinned with an internal scrollbar.

   Pass2 refinement:
   - Include the Unit Converter Rabbit Hole.
   - Pin all calculator popups to the top of the viewport instead of under the rabbit icon.
   - Preserve background page position while the overlay/popup is open.

   Scope:
   - Calculator panels: .sjcalc-rabbit-panel / RH-calc-* / RH-unitConv-01-panel.
   ========================================================================================= */
(function () {
  'use strict';

  const PIN_CLASS = 'sjcalc-rabbit-panel--pinned';
  const HTML_LOCK_CLASS = 'sjcalc-rh-scrollLock';
  const BODY_LOCK_CLASS = 'sjcalc-rh-scrollLockBody';
  const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
  const blockOptions = { passive: false, capture: true };

  let wrapped = false;

  function isElement(value) {
    return !!(value && value.nodeType === 1);
  }

  function moreLabel() {
    try { return SJ_MORE_ARIA || 'More'; } catch (e) { return 'More'; }
  }

  function lessLabel() {
    try { return SJ_LESS_ARIA || 'Less'; } catch (e) { return 'Less'; }
  }

  function isSearchActive() {
    try {
      if (typeof sjIsSearchSessionActive === 'function' && sjIsSearchSessionActive()) return true;
    } catch (e) {}
    try {
      if (typeof isSearching !== 'undefined' && isSearching) return true;
    } catch (e) {}
    return false;
  }

  function isCalcRabbitPanel(panel) {
    return !!(
      isElement(panel) &&
      (
        panel.classList.contains('sjcalc-rabbit-panel') ||
        (panel.id && panel.id.indexOf('RH-calc-') === 0) ||
        panel.id === 'RH-unitConv-01-panel'
      )
    );
  }

  // ✅ 2026-06-08 🧮 [SJ-CALC-PASS2F-RH-PORTAL-01]
  // Calculator Rabbit Holes open from inside the bottom calculator drawer.
  // That drawer is animated with CSS transforms; browsers treat position:fixed descendants
  // of transformed ancestors as fixed relative to the transformed drawer, not the viewport.
  // Result: panels can shift right/offscreen, especially on tablets and even on PC.
  // Fix: temporarily "portal" the open Rabbit Hole panel to <body>, pin it to the real
  // viewport, then restore it to its original DOM position when closed.
  function portalCalcPanelToBody(panel) {
    if (!isCalcRabbitPanel(panel) || panel.parentNode === document.body) return;

    if (!panel.__sjcalcRhHome) {
      panel.__sjcalcRhHome = {
        parent: panel.parentNode,
        nextSibling: panel.nextSibling
      };
    }

    document.body.appendChild(panel);
    panel.setAttribute('data-sjcalc-rh-portaled', 'true');
  }

  function restoreCalcPanelHome(panel) {
    if (!isCalcRabbitPanel(panel)) return;

    const home = panel.__sjcalcRhHome;
    if (home && home.parent && home.parent.nodeType === 1) {
      try {
        if (home.nextSibling && home.nextSibling.parentNode === home.parent) {
          home.parent.insertBefore(panel, home.nextSibling);
        } else {
          home.parent.appendChild(panel);
        }
      } catch (e) {
        try { home.parent.appendChild(panel); } catch (ignore) {}
      }
    }

    panel.removeAttribute('data-sjcalc-rh-portaled');
  }

  function getViewport() {
    const vv = window.visualViewport;
    const docEl = document.documentElement;
    const layoutWidth = window.innerWidth || (docEl && docEl.clientWidth) || 600;
    const layoutHeight = window.innerHeight || (docEl && docEl.clientHeight) || 600;

    return {
      // Use the layout viewport for horizontal centering. On iPad/tablet landscape,
      // visualViewport.offsetLeft can be non-zero and can push a fixed panel off the right edge.
      width: layoutWidth,
      height: vv && vv.height ? vv.height : layoutHeight,
      offsetLeft: 0,
      offsetTop: vv && isFinite(vv.offsetTop) ? Math.max(0, vv.offsetTop) : 0
    };
  }

  // ✅ 2026-06-08 🧮 [SJ-CALC-PASS2E-RH-SAFE-TOP-JS-01]
  // Mobile/tablet browser chrome can cover fixed elements placed at top: 8px.
  // Give touch/compact viewports a larger top clearance so the Rabbit Hole X/header stays reachable.
  function rabbitSafeTopGap() {
    let touchViewport = false;
    try {
      touchViewport = !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    } catch (e) {}
    try {
      touchViewport = touchViewport || !!(navigator && navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    } catch (e) {}

    return touchViewport ? 56 : 10;
  }

  function fixedHeaderBottom() {
    try {
      if (typeof sjComputeFixedHeaderBottom === 'function') {
        return sjComputeFixedHeaderBottom();
      }
    } catch (e) {}
    return 0;
  }

  function openCalcPanels() {
    return Array.from(document.querySelectorAll('.sjcalc-rabbit-panel, #RH-unitConv-01-panel')).filter(panel => {
      try { return window.getComputedStyle(panel).display !== 'none'; }
      catch (e) { return false; }
    });
  }

  function lockBackgroundScroll() {
    document.documentElement.classList.add(HTML_LOCK_CLASS);
    document.body.classList.add(BODY_LOCK_CLASS);
    document.addEventListener('wheel', blockBackgroundScroll, blockOptions);
    document.addEventListener('touchmove', blockBackgroundScroll, blockOptions);
    document.addEventListener('keydown', blockBackgroundScrollKeys, true);
  }

  function unlockBackgroundScrollIfNoCalcPanelOpen() {
    if (openCalcPanels().length) return;
    document.documentElement.classList.remove(HTML_LOCK_CLASS);
    document.body.classList.remove(BODY_LOCK_CLASS);
    document.removeEventListener('wheel', blockBackgroundScroll, blockOptions);
    document.removeEventListener('touchmove', blockBackgroundScroll, blockOptions);
    document.removeEventListener('keydown', blockBackgroundScrollKeys, true);
  }

  function eventIsInsidePinnedPanel(event) {
    try {
      return !!(event && event.target && event.target.closest && event.target.closest('.' + PIN_CLASS));
    } catch (e) {
      return false;
    }
  }

  function blockBackgroundScroll(event) {
    if (!openCalcPanels().length) return;
    if (eventIsInsidePinnedPanel(event)) return;
    try {
      event.preventDefault();
      event.stopPropagation();
    } catch (e) {}
  }

  function blockBackgroundScrollKeys(event) {
    if (!event || SCROLL_KEYS.indexOf(event.key) === -1) return;
    if (!openCalcPanels().length) return;
    if (eventIsInsidePinnedPanel(event)) return;
    try {
      event.preventDefault();
      event.stopPropagation();
    } catch (e) {}
  }

  function clearPin(panel) {
    if (!isCalcRabbitPanel(panel)) return;
    panel.classList.remove(PIN_CLASS);
    ['position', 'top', 'left', 'right', 'width', 'maxWidth', 'maxHeight', 'overflow', 'margin', 'webkitOverflowScrolling', 'transform'].forEach(prop => {
      try { panel.style[prop] = ''; } catch (e) {}
    });
  }

  function clearPinsForClosedPanels() {
    document.querySelectorAll('.sjcalc-rabbit-panel.' + PIN_CLASS + ', #RH-unitConv-01-panel.' + PIN_CLASS).forEach(panel => {
      try {
        if (window.getComputedStyle(panel).display === 'none') {
          clearPin(panel);
          restoreCalcPanelHome(panel);
        }
      } catch (e) {}
    });
    unlockBackgroundScrollIfNoCalcPanelOpen();
  }

  function pinCalcPanel(panel, button) {
    if (!isCalcRabbitPanel(panel) || !isElement(button)) return;
    if (isSearchActive()) return;

    // Clear any previous fixed geometry, then move the panel to <body> so fixed positioning
    // is relative to the true viewport, not the transformed calculator drawer.
    clearPin(panel);
    portalCalcPanelToBody(panel);

    const viewport = getViewport();
    const sideGap = 8;
    const topGap = rabbitSafeTopGap();
    const bottomGap = 12;
    const minPanelHeight = 150;

    // ✅ 2026-06-08 🧮 [SJ-CALC-PASS2E-RH-GEOMETRY-JS-01]
    // Keep the panel clear of mobile/tablet browser chrome and true-center it in the layout viewport.
    // This avoids the tablet-landscape right-shift caused by visualViewport.offsetLeft.
    const top = Math.round(viewport.offsetTop + topGap);
    const maxHeight = Math.max(minPanelHeight, Math.floor((viewport.offsetTop + viewport.height - bottomGap) - top));
    let width = Math.min(940, viewport.width - (sideGap * 2));
    width = Math.max(220, width);

    panel.classList.add(PIN_CLASS);
    panel.style.position = 'fixed';
    panel.style.top = Math.round(top) + 'px';
    panel.style.left = '50%';
    panel.style.right = 'auto';
    panel.style.transform = 'translateX(-50%)';
    panel.style.width = Math.round(width) + 'px';
    panel.style.maxWidth = 'calc(100vw - ' + Math.round(sideGap * 2) + 'px)';
    panel.style.maxHeight = Math.round(maxHeight) + 'px';
    panel.style.overflow = 'auto';
    panel.style.margin = '0';
    panel.style.webkitOverflowScrolling = 'touch';

    lockBackgroundScroll();
  }

  function schedulePin(panel, button) {
    window.clearTimeout(panel.__sjcalcRhPin1 || 0);
    window.clearTimeout(panel.__sjcalcRhPin2 || 0);
    window.clearTimeout(panel.__sjcalcRhPin3 || 0);

    const run = () => pinCalcPanel(panel, button);

    window.requestAnimationFrame(run);
    panel.__sjcalcRhPin1 = window.setTimeout(run, 80);
    panel.__sjcalcRhPin2 = window.setTimeout(run, 220);
    panel.__sjcalcRhPin3 = window.setTimeout(run, 480);
  }

  function syncButton(button, isOpen) {
    const label = isOpen ? lessLabel() : moreLabel();
    button.textContent = label;
    button.dataset.sjMlState = isOpen ? 'less' : 'more';
    button.setAttribute('data-rabbit-state', isOpen ? 'open' : 'closed');
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    button.setAttribute('aria-label', label);
  }

  function bounce(button) {
    try {
      button.classList.remove('sjRabbitHole-bounce');
      void button.offsetWidth;
      button.classList.add('sjRabbitHole-bounce');
      window.setTimeout(() => button.classList.remove('sjRabbitHole-bounce'), 650);
    } catch (e) {}
  }

  function updateGeneralOverlay() {
    try {
      if (typeof sjUpdateRabbitHoleOverlay === 'function') sjUpdateRabbitHoleOverlay();
    } catch (e) {}
  }


  // ✅ 2026-06-08 🧮 [SJ-CALC-PASS2D-RH-X-JS-01]
  // Add an always-available close control inside the pinned Rabbit Hole panel.
  // This solves the small-screen case where the panel covers the rabbit icon that opened it.
  function getButtonForPanel(panel) {
    if (!isCalcRabbitPanel(panel) || !panel.id) return null;
    return document.querySelector('.sjRabbitHole-button[aria-controls="' + panel.id + '"], .sjRabbitHole-button[onclick*="' + panel.id + '"]');
  }

  function ensurePanelCloseButton(panel) {
    if (!isCalcRabbitPanel(panel)) return;

    const existing = panel.querySelector('.sj-rabbit-panel-x[data-sj-rh-close="calc"]');
    if (existing) return;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sj-rabbit-panel-x';
    closeBtn.setAttribute('data-sj-rh-close', 'calc');
    closeBtn.setAttribute('aria-label', 'Close Rabbit Hole');
    closeBtn.title = 'Close Rabbit Hole';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeCalculatorRabbitPanel(panel);
    });

    panel.insertBefore(closeBtn, panel.firstChild);
  }

  function closeCalculatorRabbitPanel(panel) {
    if (!isCalcRabbitPanel(panel)) return false;

    const button = getButtonForPanel(panel);
    panel.style.display = 'none';

    if (button) {
      syncButton(button, false);
    }

    clearPin(panel);
    restoreCalcPanelHome(panel);
    updateGeneralOverlay();
    unlockBackgroundScrollIfNoCalcPanelOpen();
    return true;
  }

  function closeAllCalculatorRabbitPanels() {
    openCalcPanels().forEach(panel => closeCalculatorRabbitPanel(panel));
    unlockBackgroundScrollIfNoCalcPanelOpen();
  }

  window.sjCloseCalculatorRabbitHoles = closeAllCalculatorRabbitPanels;

  function toggleCalculatorRabbitHole(buttonID, panelID) {
    const button = document.getElementById(buttonID);
    const panel = document.getElementById(panelID);
    if (!isElement(button) || !isCalcRabbitPanel(panel)) return false;

    const isHidden = window.getComputedStyle(panel).display === 'none';

    bounce(button);

    if (isHidden) {
      ensurePanelCloseButton(panel);
      panel.style.display = 'block';
      syncButton(button, true);
      updateGeneralOverlay();
      schedulePin(panel, button);
    } else {
      closeCalculatorRabbitPanel(panel);
    }

    return true;
  }

  function wrapLegacyRabbitToggle() {
    if (wrapped) return;
    if (typeof window.toggleRabbitHole !== 'function') return;
    if (window.toggleRabbitHole.__sjcalcRabbitPinned) return;

    const originalToggleRabbitHole = window.toggleRabbitHole;

    window.toggleRabbitHole = function (buttonID, panelID) {
      const panel = document.getElementById(panelID);

      // Search still needs the original in-flow behavior so hidden text can be revealed without
      // a modal-style popup blocking Search controls.
      if (isCalcRabbitPanel(panel) && !isSearchActive()) {
        if (toggleCalculatorRabbitHole(buttonID, panelID)) return;
      }

      return originalToggleRabbitHole.apply(this, arguments);
    };

    window.toggleRabbitHole.__sjcalcRabbitPinned = true;
    wrapped = true;
  }

  function repinVisibleCalcPanels() {
    if (isSearchActive()) return;
    openCalcPanels().forEach(panel => {
      const id = panel.id;
      const button = id ? document.querySelector('.sjRabbitHole-button[aria-controls="' + id + '"], .sjRabbitHole-button[onclick*="' + id + '"]') : null;
      if (button) schedulePin(panel, button);
    });
  }

  function installClosedPanelObserver() {
    if (typeof MutationObserver !== 'function') return;
    const observer = new MutationObserver(clearPinsForClosedPanels);
    document.querySelectorAll('.sjcalc-rabbit-panel, #RH-unitConv-01-panel').forEach(panel => {
      observer.observe(panel, { attributes: true, attributeFilter: ['style', 'class'] });
    });
  }

  function initCalcRabbitPinning() {
    wrapLegacyRabbitToggle();
    installClosedPanelObserver();
    document.addEventListener('keydown', function (event) {
      if (event && event.key === 'Escape' && openCalcPanels().length) {
        closeAllCalculatorRabbitPanels();
      }
    });
    window.addEventListener('resize', () => window.requestAnimationFrame(repinVisibleCalcPanels));
    window.addEventListener('orientationchange', () => window.setTimeout(repinVisibleCalcPanels, 80));
    if (window.visualViewport && window.visualViewport.addEventListener) {
      window.visualViewport.addEventListener('resize', () => window.requestAnimationFrame(repinVisibleCalcPanels));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalcRabbitPinning, { once: true });
  } else {
    initCalcRabbitPinning();
  }
})();


// ✅ 2026-06-08 🧮 [SJ-CALC-PASS2C-DRAWER-LAUNCHER-01]
// Open calculators from the Calculator chapter TOC in a 940px-capped, full-height bottom drawer.
// This preserves the original calculator DOM/IDs, hides the per-section More/Less and TOC header,
// and forces the More/Less content region open so the Rabbit Hole launcher is always visible.
(function sjInstallCalculatorDrawerLauncher() {
  const CALC_DRAWER_MAP = {
    unitConvertor: {
      titleId: 'TOC-calculator-drawer-title-unitConvertor',
      moreId: 'moreunitConvertorMsg',
      buttonId: 'unitConvertorButton'
    },
    bakersMathCalculator: {
      titleId: 'TOC-calculator-drawer-title-bakersMathCalculator',
      moreId: 'morebakersMathCalculatorMsg',
      buttonId: 'bakersMathCalculatorButton'
    },
    leavenCalculator: {
      titleId: 'TOC-calculator-drawer-title-leavenCalculator',
      moreId: 'moreleavenCalculatorMsg',
      buttonId: 'leavenCalculatorButton'
    },
    breadHydrationCalculator: {
      titleId: 'TOC-calculator-drawer-title-breadHydrationCalculator',
      moreId: 'morebreadHydrationCalculatorMsg',
      buttonId: 'breadHydrationCalculatorButton'
    },
    riseTimeCalculator: {
      titleId: 'TOC-calculator-drawer-title-riseTimeCalculator',
      moreId: 'moreriseTimeCalculatorMsg',
      buttonId: 'riseTimeCalculatorButton'
    },
    riseFactorCalculator: {
      titleId: 'TOC-calculator-drawer-title-riseFactorCalculator',
      moreId: 'moreriseFactorCalculatorMsg',
      buttonId: 'riseFactorCalculatorButton'
    },
    ddtCalculator: {
      titleId: 'TOC-calculator-drawer-title-ddtCalculator',
      moreId: 'moreddtCalculatorMsg',
      buttonId: 'ddtCalculatorButton'
    },
    desiredWaterTemperatureCalculator: {
      titleId: 'TOC-calculator-drawer-title-desiredWaterTemperatureCalculator',
      moreId: 'moredesiredWaterTemperatureCalculatorMsg',
      buttonId: 'desiredWaterTemperatureCalculatorButton'
    }
  };

  function forceRabbitAreaVisible(def) {
    const more = document.getElementById(def.moreId);
    if (more) {
      more.style.display = 'block';
      more.setAttribute('data-sjcalc-drawer-forced-open', 'true');

      // Unit Converter's legacy rabbit wrapper carried a hidden attribute.
      // Remove it when the calculator is invoked so the rabbit is always reachable.
      more.querySelectorAll('.sjRabbitHole-wrap[hidden]').forEach(wrap => {
        wrap.removeAttribute('hidden');
      });
    }

    const button = document.getElementById(def.buttonId);
    if (button) {
      button.innerHTML = 'Less ▴';
      button.dataset.sjMlState = 'less';
      button.setAttribute('aria-expanded', 'true');
    }
  }

  function getActiveDrawerFromEvent(event) {
    const target = event && event.target;
    return (target && target.closest) ? target.closest('.drawer.active') : null;
  }

  function getActiveDrawerFallback() {
    return document.querySelector('.drawer.active');
  }

  function getDrawerType(drawer) {
    if (!drawer || !drawer.getAttribute) return '';
    return (drawer.getAttribute('data-drawer-type') || '').trim();
  }

  function isTocDrawer(drawer) {
    const type = getDrawerType(drawer);
    return type === 'toc' || type === 'calculator-toc';
  }

  function suspendNonTocCallerContextForCalculator(originEvent) {
    // ✅ 2026-06-14 🧮 [SJ-CALC-CALLER-PRESERVE-01]
    // Non-TOC calculator launches should behave like a temporary tool overlay.
    // Do NOT collapse the page/rabbit-hole context that launched the calculator.
    // Glossary panels need one extra step: their veil/envelope z-index is higher than drawers,
    // so temporarily suspend the veil while keeping the active term/panel open for restoration.
    try {
      if (typeof window.sjSuspendActiveGlossaryForDrawer === 'function') {
        window.sjSuspendActiveGlossaryForDrawer(originEvent && originEvent.target ? originEvent.target : null);
      }
    } catch (e) {
      console.warn('Glossary context suspend before calculator launch failed:', e);
    }

    // Calculator Rabbit Holes are part of the calculator surface itself. Close them before
    // switching/opening a calculator drawer so they cannot strand a calculator-specific veil.
    try {
      if (typeof window.sjCloseCalculatorRabbitHoles === 'function') {
        window.sjCloseCalculatorRabbitHoles();
      }
    } catch (e) {
      console.warn('Calculator Rabbit Hole cleanup before calculator launch failed:', e);
    }
  }

  function rememberCalculatorLaunchContext(sectionId, context) {
    try {
      window.sjLastCalculatorLaunch = {
        sectionId: sectionId,
        source: context && context.source ? context.source : 'unknown',
        scrollY: window.scrollY || window.pageYOffset || 0,
        at: Date.now()
      };
    } catch (e) {}
  }

  window.sjOpenCalculatorDrawer = function sjOpenCalculatorDrawer(sectionId, eventOrOptions) {
    const def = CALC_DRAWER_MAP[sectionId];
    const section = document.getElementById(sectionId);
    const title = def ? document.getElementById(def.titleId) : null;
    const isEventLike = !!(eventOrOptions && eventOrOptions.preventDefault);
    const options = isEventLike ? {} : (eventOrOptions || {});
    const originDrawer = getActiveDrawerFromEvent(isEventLike ? eventOrOptions : null) || getActiveDrawerFallback();
    const fromTocDrawer = !!(options.fromToc || isTocDrawer(originDrawer));

    if (isEventLike) {
      eventOrOptions.preventDefault();
      eventOrOptions.stopPropagation();
    }

    if (!def || !section || !title) {
      console.warn('Calculator drawer target missing:', sectionId);
      return false;
    }

    rememberCalculatorLaunchContext(sectionId, { source: fromTocDrawer ? 'toc' : 'page' });

    // TOC-launched calculators should not leave the TOC as the perceived calling context.
    // Non-TOC launches preserve their caller context: page text, glossary/rabbit-hole panels,
    // and non-TOC content remain the user's return point after the calculator drawer closes.
    window.sjCalculatorPreserveCallerContext = !fromTocDrawer;
    if (!fromTocDrawer) {
      suspendNonTocCallerContextForCalculator(isEventLike ? eventOrOptions : null);
    }

    forceRabbitAreaVisible(def);
    section.classList.add('sjcalc-drawer-open-section');

    if (typeof open_drawer === 'function') {
      open_drawer('drawer-bottom', 'calculator', title, section, '100%', { preserveCallerContext: !fromTocDrawer });
    } else {
      console.warn('open_drawer() is not available yet for calculator:', sectionId);
    }

    return false;
  };

  // ✅ 2026-06-14 🧮 [SJ-CALC-SPECIFIC-LAUNCHER-01]
  // Stable public helper for opening a specific calculator from glossary/rabbit-hole content,
  // info cards, ordinary page copy, or future non-TOC launchers without adding calculator-specific
  // logic to sjLearn.html. Example: sjOpenSpecificCalculator('bakersMathCalculator', event).
  window.sjOpenSpecificCalculator = function sjOpenSpecificCalculator(sectionId, eventOrOptions) {
    return window.sjOpenCalculatorDrawer(sectionId, eventOrOptions);
  };

  // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-REVEAL-01]
  // Search can count hits inside calculator sections and calculator Rabbit Holes.
  // Those hits are only useful if Search can also reveal the proper calculator drawer
  // and, when needed, the Rabbit Hole panel containing the hit. Keep this calculator-
  // specific reveal logic here so sjLearnScripts.js does not need calculator internals.
  function getCalculatorSectionForSearchNode(node) {
    if (!node || !node.closest) return null;

    const directSection = node.closest('[data-sjcalc-drawer-section]');
    if (directSection) return directSection;

    // If a calculator Rabbit Hole was previously portaled to <body>, use its saved home.
    const panel = node.closest('.sjcalc-rabbit-panel');
    const homeParent = panel && panel.__sjcalcRhHome && panel.__sjcalcRhHome.parent;
    return (homeParent && homeParent.closest) ? homeParent.closest('[data-sjcalc-drawer-section]') : null;
  }

  function getCalculatorRabbitPanelForSearchNode(node) {
    return (node && node.closest) ? node.closest('.sjcalc-rabbit-panel') : null;
  }

  function isCalculatorSectionAlreadyInDrawer(section) {
    return !!(section && section.closest && section.closest('.drawer-bottom.active .drawer-content'));
  }

  function isCalculatorSearchSessionActive() {
    try {
      if (typeof sjIsSearchSessionActive === 'function' && sjIsSearchSessionActive()) return true;
    } catch (e) {}
    try {
      if (typeof isSearching !== 'undefined' && isSearching) return true;
    } catch (e) {}
    return false;
  }

  function setCalculatorRabbitButtonForSearch(panel, isOpen) {
    if (!panel || !panel.id) return;

    const button = document.querySelector(
      '.sjRabbitHole-button[aria-controls="' + panel.id + '"], .sjRabbitHole-button[onclick*="' + panel.id + '"]'
    );

    if (!button) return;

    const label = isOpen ? (typeof SJ_LESS_ARIA !== 'undefined' ? SJ_LESS_ARIA : 'Less')
                         : (typeof SJ_MORE_ARIA !== 'undefined' ? SJ_MORE_ARIA : 'More');
    button.textContent = label;
    button.dataset.sjMlState = isOpen ? 'less' : 'more';
    button.setAttribute('data-rabbit-state', isOpen ? 'open' : 'closed');
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    button.setAttribute('aria-label', label);
  }

  function revealCalculatorRabbitPanelForSearch(panel) {
    if (!panel) return;

    // Unit Converter originally hides the whole Rabbit wrapper until the calculator opens.
    // Search must remove that hidden gate when the panel contains the current match.
    const wrap = panel.closest('.sjRabbitHole-wrap');
    if (wrap && wrap.hasAttribute('hidden')) {
      wrap.dataset.sjSearchHadHidden = '1';
      wrap.removeAttribute('hidden');
    }

    panel.classList.remove('sjcalc-rabbit-panel--pinned');
    panel.style.position = '';
    panel.style.top = '';
    panel.style.left = '';
    panel.style.right = '';
    panel.style.width = '';
    panel.style.maxWidth = '';
    panel.style.maxHeight = '';
    panel.style.overflow = '';
    panel.style.margin = '';
    panel.style.transform = '';
    panel.style.display = 'block';
    panel.removeAttribute('hidden');
    setCalculatorRabbitButtonForSearch(panel, true);
  }

  function scheduleCalculatorSearchReveal(section, panel) {
    // Drawer switching/restoring is transition-based. Re-apply the visibility state a few
    // times so Search remains deterministic whether the drawer was already open, closed,
    // or switching from the Calculator List / another TOC.
    [0, 80, 220, 520, 760].forEach(delay => {
      window.setTimeout(() => {
        const freshDef = CALC_DRAWER_MAP[section.id];
        if (freshDef) forceRabbitAreaVisible(freshDef);
        if (panel) revealCalculatorRabbitPanelForSearch(panel);
      }, delay);
    });
  }

  window.sjPrepareCalculatorSearchContent = function sjPrepareCalculatorSearchContent() {
    document.querySelectorAll('[data-sjcalc-drawer-section] .sjRabbitHole-wrap[hidden]').forEach(wrap => {
      wrap.dataset.sjSearchHadHidden = '1';
      wrap.removeAttribute('hidden');
    });
  };

  window.sjRestoreCalculatorSearchContent = function sjRestoreCalculatorSearchContent() {
    document.querySelectorAll('[data-sjcalc-drawer-section] .sjRabbitHole-wrap[data-sj-search-had-hidden="1"]').forEach(wrap => {
      wrap.setAttribute('hidden', '');
      delete wrap.dataset.sjSearchHadHidden;
    });

    document.querySelectorAll('.sjcalc-drawer-managed.sjcalc-search-visible').forEach(section => {
      section.classList.remove('sjcalc-search-visible');
    });

    document.querySelectorAll('.sjcalc-rabbit-panel[data-sjcalc-search-opened="1"]').forEach(panel => {
      panel.style.display = 'none';
      delete panel.dataset.sjcalcSearchOpened;
      setCalculatorRabbitButtonForSearch(panel, false);
    });
  };

  window.sjRevealCalculatorSearchMatch = function sjRevealCalculatorSearchMatch(matchElement) {
    const section = getCalculatorSectionForSearchNode(matchElement);
    if (!section || !section.id || !CALC_DRAWER_MAP[section.id]) return false;

    const panel = getCalculatorRabbitPanelForSearchNode(matchElement);
    const def = CALC_DRAWER_MAP[section.id];

    forceRabbitAreaVisible(def);

    // ✅ 2026-06-09 🧭 [SJ-SEARCH-CALC-INLINE-01]
    // Search must be deterministic before it is fancy.
    // Earlier Pass4f opened/switches the bottom calculator drawer for every Calculator hit.
    // That made the hits reachable, but it also introduced fragile drawer-switch timing and
    // buried/duplicated the user's Search controls while walking many hits such as "leaven".
    // During Search, reveal Calculator hits IN PLACE on the page instead:
    //   - the Calculator section is visible because normal Search filtering already kept it;
    //   - the calculator More/Less region is forced open above;
    //   - the owning Rabbit Hole panel is opened inline when the active hit lives inside it;
    //   - sjLearnScripts.js can then use the normal page-scroll path.
    // Outside Search, normal Calculator clicks still open the bottom drawer.
    if (isCalculatorSearchSessionActive()) {
      document.querySelectorAll('.sjcalc-drawer-managed.sjcalc-search-visible').forEach(openSection => {
        if (openSection !== section) openSection.classList.remove('sjcalc-search-visible');
      });

      section.style.display = 'block';
      section.classList.remove('sjcalc-drawer-open-section');
      section.classList.add('sjcalc-search-visible');

      if (panel) {
        panel.dataset.sjcalcSearchOpened = '1';
        revealCalculatorRabbitPanelForSearch(panel);
      }

      scheduleCalculatorSearchReveal(section, panel);
      return true;
    }

    const mustOpenDrawer = !isCalculatorSectionAlreadyInDrawer(section);
    if (mustOpenDrawer) {
      const previousSearchDrawerBypass = window.sjAllowDrawerDuringSearch;
      window.sjAllowDrawerDuringSearch = true;
      try {
        window.sjOpenCalculatorDrawer(section.id);
      } finally {
        window.sjAllowDrawerDuringSearch = previousSearchDrawerBypass;
      }
    }

    if (panel) {
      revealCalculatorRabbitPanelForSearch(panel);
    }

    scheduleCalculatorSearchReveal(section, panel);
    return true;
  };
})();

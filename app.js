// ============================================================
// SAVAGE WORLDS CHARACTER CREATOR - App Logic
// ============================================================

const STEPS = [
  { id: 'setting', label: 'Setting', icon: '\u2606' },
  { id: 'bonusRules', label: 'Bonus Rules', icon: '\u2605' },
  { id: 'race', label: 'Ancestry', icon: '1' },
  { id: 'hindrances', label: 'Hindrances', icon: '2' },
  { id: 'edges', label: 'Edges', icon: '3' },
  { id: 'attributes', label: 'Attributes', icon: '4' },
  { id: 'skills', label: 'Skills', icon: '5' },
  { id: 'concept', label: 'Concept', icon: '6' },
  { id: 'powers', label: 'Powers', icon: '7' },
  { id: 'gear', label: 'Gear', icon: '8' },
  { id: 'summary', label: 'Review', icon: '9' },
];

const DIE_LABELS = { 0: '—', 4: 'd4', 6: 'd6', 8: 'd8', 10: 'd10', 12: 'd12' };

// Bonus Rules Registry — add new rules by appending objects here
const BONUS_RULES = [
  {
    id: 'competentHero',
    name: 'Competent Hero',
    subtitle: '15 Point Start',
    description: 'Characters begin with 15 skill points instead of the standard 12, giving your players a cushion so they are not forced to hyper-specialize to survive.',
    icon: '\u2694\uFE0F',
    category: 'Skills',
  },
  {
    id: 'polyglotFrontier',
    name: 'Polyglot Frontier',
    subtitle: 'Language Rules',
    description: 'Every character automatically receives the Linguist Edge for free. Starting languages equal half the Smarts die (d6 = 3, d8 = 4, etc.). +2 bonus when communicating within the same language family (GM discretion).',
    icon: '\uD83D\uDDE3\uFE0F',
    category: 'Languages',
  },
];

// Language Families for the 1884 Frontier
const LANGUAGE_FAMILIES = [
  {
    id: 'english', name: 'English',
    languages: [
      { id: 'lang_stdAmerican', name: 'Standard American' },
      { id: 'lang_queensEnglish', name: "Queen's English" },
      { id: 'lang_frontierPatois', name: 'Frontier Patois' },
    ]
  },
  {
    id: 'spanish', name: 'Spanish',
    languages: [
      { id: 'lang_castilian', name: 'Castilian' },
      { id: 'lang_mexican', name: 'Mexican' },
      { id: 'lang_vaquero', name: 'Vaquero / Border Spanish' },
    ]
  },
  {
    id: 'sioux', name: 'Sioux (Siouan)',
    languages: [
      { id: 'lang_crow', name: 'Crow' },
      { id: 'lang_mandan', name: 'Mandan' },
      { id: 'lang_yankton', name: 'Yankton' },
      { id: 'lang_teton', name: 'Teton' },
      { id: 'lang_osage', name: 'Osage' },
      { id: 'lang_omaha', name: 'Omaha' },
    ]
  },
  {
    id: 'algonkian', name: 'Algonkian',
    languages: [
      { id: 'lang_arapahoe', name: 'Arapahoe' },
      { id: 'lang_cheyenne', name: 'Cheyenne' },
      { id: 'lang_blackfoot', name: 'Blackfoot' },
      { id: 'lang_ojibwe', name: 'Ojibwe' },
    ]
  },
  {
    id: 'shoshoni', name: 'Shoshoni (Uto-Aztecan)',
    languages: [
      { id: 'lang_pajute', name: 'Pajute' },
      { id: 'lang_ute', name: 'Ute' },
      { id: 'lang_comanche', name: 'Comanche' },
      { id: 'lang_kiowa', name: 'Kiowa' },
    ]
  },
];

// SVG Dice Icons - each returns an inline SVG shaped like the actual die
function getDieIcon(sides) {
  const color = 'currentColor';
  const icons = {
    4: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round">
      <polygon points="12,2 2,20 22,20"/>
      <text x="12" y="17" text-anchor="middle" fill="${color}" stroke="none" font-size="8" font-weight="700" font-family="Cinzel,serif">4</text>
    </svg>`,
    6: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <text x="12" y="16" text-anchor="middle" fill="${color}" stroke="none" font-size="9" font-weight="700" font-family="Cinzel,serif">6</text>
    </svg>`,
    8: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round">
      <polygon points="12,1 23,12 12,23 1,12"/>
      <text x="12" y="16" text-anchor="middle" fill="${color}" stroke="none" font-size="9" font-weight="700" font-family="Cinzel,serif">8</text>
    </svg>`,
    10: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round">
      <polygon points="12,1 22,9 18,23 6,23 2,9"/>
      <line x1="12" y1="1" x2="6" y2="23" opacity="0.3"/>
      <line x1="12" y1="1" x2="18" y2="23" opacity="0.3"/>
      <text x="12" y="17" text-anchor="middle" fill="${color}" stroke="none" font-size="8" font-weight="700" font-family="Cinzel,serif">10</text>
    </svg>`,
    12: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round">
      <polygon points="12,1 22,8 19,20 5,20 2,8"/>
      <text x="12" y="16" text-anchor="middle" fill="${color}" stroke="none" font-size="7" font-weight="700" font-family="Cinzel,serif">12</text>
    </svg>`,
    20: `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round">
      <polygon points="12,1 22,8 19,20 5,20 2,8"/>
      <polygon points="12,5 18,9 16,17 8,17 6,9" opacity="0.3"/>
      <text x="12" y="16" text-anchor="middle" fill="${color}" stroke="none" font-size="7" font-weight="700" font-family="Cinzel,serif">20</text>
    </svg>`,
  };
  return icons[sides] || '';
}

// Returns HTML with die icon + label for display (not exports)
function dieDisplay(sides) {
  if (sides === 0) return '—';
  const icon = getDieIcon(sides);
  return `<span class="die-icon">${icon}</span>`;
}

function createDefaultCharacter() {
  const attrs = {};
  SWADE.ATTRIBUTES.forEach(a => attrs[a.id] = 4);
  const skills = {};
  SWADE.SKILLS.forEach(s => skills[s.id] = s.core ? 4 : 0);
  return {
    setting: null,
    name: '',
    concept: '',
    race: null,
    heritageChoice: null,
    attributes: attrs,
    skills: skills,
    hindrances: [],
    edges: [],
    gear: [],
    funds: 500,
    hindrancePointsSpent: { attributes: 0, edges: 0, skills: 0 },
    bonusRules: [],
    languages: [],
    notes: '',
    powers: [],
  };
}

// ============================================================
// APP STATE
// ============================================================
const app = {
  currentStep: 0,
  character: createDefaultCharacter(),
  gearTab: 'melee',
  edgeFilter: 'All',
  skillFilter: 'all',
  powerFilter: 'All',

  // ----------------------------------------------------------
  // INIT
  // ----------------------------------------------------------
  init() {
    try {
      const saved = JSON.parse(localStorage.getItem('savage-master-character-v1'));
      if (saved && saved.version === 1) this.character = this.parseCharacterBackup(saved);
    } catch (error) {
      console.warn('Could not restore character:', error);
    }
    this.renderNav();
    this.goToStep(0);
  },

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------
  renderNav() {
    const nav = document.getElementById('stepNav');
    nav.innerHTML = STEPS.map((s, i) => `
      <li data-step="${i}" role="button" tabindex="0" aria-current="${i === this.currentStep ? 'step' : 'false'}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}" onclick="app.goToStep(${i})" class="${i === this.currentStep ? 'active' : ''}">
        <span class="step-num">${s.icon}</span>
        <span>${s.label}</span>
      </li>
    `).join('');
    this.renderMobileNav();
  },

  renderMobileNav() {
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileNav) return;
    mobileNav.innerHTML = STEPS.map((s, i) => `
      <button class="mobile-nav-btn ${i === this.currentStep ? 'active' : ''}" onclick="app.goToStep(${i})">
        <span class="mobile-nav-icon">${s.icon}</span>
        <span class="mobile-nav-label">${s.label}</span>
      </button>
    `).join('');
  },

  toggleMobileSummary() {
    const panel = document.getElementById('summaryPanel');
    const overlay = document.getElementById('summaryOverlay');
    if (panel) panel.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  },

  // ----------------------------------------------------------
  // STEP VALIDATION — blocks forward navigation until complete
  // ----------------------------------------------------------
  validateStep(stepIndex) {
    const step = STEPS[stepIndex];
    if (!step) return { valid: true, errors: [] };
    const c = this.character;
    const errors = [];

    switch (step.id) {
      case 'setting':
        // No validation — player picks setting freely
        break;

      case 'bonusRules':
        // Optional — no validation needed
        break;

      case 'concept':
        if (!c.name || !c.name.trim()) errors.push('Enter a character name');
        if (!c.concept || !c.concept.trim()) errors.push('Enter a character concept');
        break;

      case 'race': {
        if (!c.race) errors.push('Select an ancestry');
        const heritage = this.getSelectedRace()?.abilities.find(a => a.type === 'heritage_choice');
        if (heritage && !heritage.choices.some(choice => choice.id === c.heritageChoice)) errors.push('Choose your heritage');
        break;
      }

      case 'attributes': {
        const attrPts = this.getAttributePoints();
        if (attrPts.remaining > 0) errors.push(`Spend all attribute points (${attrPts.remaining} remaining)`);
        if (attrPts.remaining < 0) errors.push(`Over attribute budget by ${Math.abs(attrPts.remaining)} point(s)`);
        // Validate edge attribute requirements are met
        c.edges.forEach(eId => {
          const edge = this.getEdges().find(e => e.id === eId);
          if (!edge) return;
          edge.requirements.filter(r => r.type === 'attribute').forEach(req => {
            const attrObj = SWADE.ATTRIBUTES.find(a => a.id === req.attribute);
            const attrName = attrObj ? attrObj.name : req.attribute;
            if (c.attributes[req.attribute] < req.minimum) {
              errors.push(`${edge.name} requires ${attrName} d${req.minimum}`);
            }
          });
        });
        break;
      }

      case 'skills': {
        const skillPts = this.getSkillPoints();
        if (skillPts.remaining > 0) errors.push(`Spend all skill points (${skillPts.remaining} remaining)`);
        if (skillPts.remaining < 0) errors.push(`Over skill budget by ${Math.abs(skillPts.remaining)} point(s)`);
        // Polyglot Frontier language slots
        if (c.bonusRules.includes('polyglotFrontier')) {
          const maxLangs = this.getLanguageSlots();
          if (c.languages.length < maxLangs) errors.push(`Select ${maxLangs - c.languages.length} more language(s) (${c.languages.length}/${maxLangs})`);
        }
        // Validate edge skill requirements are met
        c.edges.forEach(eId => {
          const edge = this.getEdges().find(e => e.id === eId);
          if (!edge) return;
          edge.requirements.filter(r => r.type === 'skill' || r.type === 'skill_any').forEach(req => {
            if (req.type === 'skill') {
              const sk = SWADE.SKILLS.find(s => s.id === req.skill);
              const skName = sk ? sk.name : req.skill;
              if ((c.skills[req.skill] || 0) < req.minimum) {
                errors.push(`${edge.name} requires ${skName} d${req.minimum}`);
              }
            } else if (req.type === 'skill_any') {
              if (!req.skills.some(s => (c.skills[s] || 0) >= req.minimum)) {
                const skNames = req.skills.map(s => {
                  const sk = SWADE.SKILLS.find(sk2 => sk2.id === s);
                  return sk ? sk.name : s;
                }).join(' or ');
                errors.push(`${edge.name} requires ${skNames} d${req.minimum}`);
              }
            }
          });
        });
        break;
      }

      case 'hindrances': {
        const hp = this.getHindrancePoints();
        if (hp.remaining > 0) errors.push(`Allocate all hindrance points (${hp.remaining} unspent)`);
        if (hp.remaining < 0) errors.push(`Over hindrance budget by ${Math.abs(hp.remaining)} point(s)`);
        break;
      }

      case 'edges': {
        const eb = this.getEdgeBudget();
        if (eb.remaining < 0) errors.push(`Too many edges selected (${Math.abs(eb.remaining)} over budget)`);
        if (eb.remaining > 0) errors.push(`Select ${eb.remaining} more edge(s) — don't leave free edges on the table!`);
        break;
      }

      case 'powers': {
        const ab = this.getArcaneBackground();
        if (ab) {
          const budget = this.getPowerBudget();
          if (budget.remaining > 0) {
            errors.push(`Select ${budget.remaining} more power${budget.remaining > 1 ? 's' : ''} (${budget.spent}/${budget.total} chosen).`);
          }
        }
        break;
      }

      case 'gear': {
        const funds = this.getRemainingFunds();
        if (funds < 0) errors.push(`Over budget by $${Math.abs(funds)} — remove some gear`);
        break;
      }

      case 'summary':
        // Review step — always valid
        break;
    }

    return { valid: errors.length === 0, errors };
  },

  showValidationErrors(errors) {
    document.getElementById('stepValidation')?.remove();
    const message = document.createElement('div');
    message.id = 'stepValidation';
    message.className = 'step-validation';
    message.setAttribute('role', 'alert');
    message.setAttribute('tabindex', '-1');
    message.innerHTML = `<strong>Complete this step to continue</strong><ul>${errors.map(error => `<li>${this.escHtml(error)}</li>`).join('')}</ul>`;
    const main = document.getElementById('mainContent');
    main.querySelector('.step-content').prepend(message);
    main.scrollTop = 0;
    message.focus({ preventScroll: true });
  },

  goToStep(i) {
    document.querySelector('.sidebar')?.classList.remove('account-open');
    // Allow backward navigation freely; validate on forward moves
    if (i > this.currentStep) {
      // Validate every step from current up to (but not including) target
      for (let s = this.currentStep; s < i; s++) {
        const result = this.validateStep(s);
        if (!result.valid) {
          // Jump to the failing step so the player can see what's wrong
          if (s !== this.currentStep) {
            this.currentStep = s;
            this.renderNav();
            this.renderContent();
            this.renderSummary();
            document.getElementById('mainContent').scrollTop = 0;
          }
          this.showValidationErrors(result.errors);
          return;
        }
      }
    }
    this.currentStep = i;
    this.renderNav();
    this.renderContent();
    this.renderSummary();
    document.getElementById('mainContent').scrollTop = 0;
  },

  nextStep() { if (this.currentStep < STEPS.length - 1) this.goToStep(this.currentStep + 1); },
  prevStep() { if (this.currentStep > 0) this.goToStep(this.currentStep - 1); },

  // ----------------------------------------------------------
  // BUDGET CALCULATIONS
  // ----------------------------------------------------------
  getAttributePoints() {
    const base = this.isYoung();
    const total = base !== null ? base : 5;
    let spent = 0;
    SWADE.ATTRIBUTES.forEach(a => {
      const raceMin = this.getRaceAttributeMinimum(a.id);
      const val = this.character.attributes[a.id];
      // Points spent = number of raises above base (d4), minus free racial raises
      const raceRaises = raceMin > 4 ? (raceMin - 4) / 2 : 0;
      const totalRaises = (val - 4) / 2;
      spent += Math.max(0, totalRaises - raceRaises);
    });
    const bonusFromHindrances = this.character.hindrancePointsSpent.attributes * 2; // 2 HP = 1 attr point
    return { total: total + Math.floor(bonusFromHindrances / 2), spent, remaining: total + Math.floor(bonusFromHindrances / 2) - spent };
  },

  getSkillPoints() {
    const base = this.isYoungSkillPoints();
    // Standard SWADE = 12 skill points; Competent Hero bonus rule adds +3
    const standardBase = 12;
    const competentBonus = this.character.bonusRules.includes('competentHero') ? 3 : 0;
    const total = base !== null ? base : (standardBase + competentBonus);
    let spent = 0;
    SWADE.SKILLS.forEach(s => {
      const val = this.character.skills[s.id];
      if (val === 0) return;
      const linkedAttr = this.character.attributes[s.attribute];
      if (s.core) {
        // Core skills start at d4 free, each raise costs 1 up to linked attr, 2 above
        const raises = (val - 4) / 2;
        for (let r = 1; r <= raises; r++) {
          const dieAtLevel = 4 + r * 2;
          spent += dieAtLevel > linkedAttr ? 2 : 1;
        }
      } else {
        // Non-core: first d4 costs 1, then each raise costs 1 up to linked, 2 above
        spent += 1; // buying d4
        const raises = (val - 4) / 2;
        for (let r = 1; r <= raises; r++) {
          const dieAtLevel = 4 + r * 2;
          spent += dieAtLevel > linkedAttr ? 2 : 1;
        }
      }
    });
    const bonusFromHindrances = this.character.hindrancePointsSpent.skills; // 1 HP = 1 skill point
    return { total: total + bonusFromHindrances, spent, remaining: total + bonusFromHindrances - spent };
  },

  getHindrancePoints() {
    let earned = 0;
    this.character.hindrances.forEach(hId => {
      const h = this.getHindrances().find(x => x.id === hId);
      if (h) earned += h.type === 'Major' ? 2 : 1;
    });
    // Cap at 4
    earned = Math.min(earned, 4);
    const spent = this.character.hindrancePointsSpent.attributes * 2 +
                  this.character.hindrancePointsSpent.edges * 2 +
                  this.character.hindrancePointsSpent.skills;
    return { earned, spent, remaining: earned - spent };
  },

  getFreeEdgeCount() {
    let count = 0;
    // Human adaptable
    const race = this.getSelectedRace();
    if (race) {
      race.abilities.forEach(ab => {
        if (ab.type === 'free_edge') count += ab.count;
      });
      // Heritage choice
      if (this.character.heritageChoice) {
        const hc = race.abilities.find(a => a.type === 'heritage_choice');
        if (hc) {
          const chosen = hc.choices.find(c => c.id === this.character.heritageChoice);
          if (chosen) {
            chosen.effects.forEach(e => {
              if (e.type === 'free_edge') count += e.count || 1;
            });
          }
        }
      }
    }
    // Blind hindrance
    if (this.character.hindrances.includes('blind')) {
      const blind = this.getHindrances().find(h => h.id === 'blind');
      if (blind && blind.special && blind.special.freeEdges) count += blind.special.freeEdges;
    }
    // From hindrance points
    count += this.character.hindrancePointsSpent.edges;
    return count;
  },

  getEdgeBudget() {
    const free = this.getFreeEdgeCount();
    let taken = this.character.edges.length;
    // Polyglot Frontier grants Linguist for free — don't count against budget
    if (this.character.bonusRules.includes('polyglotFrontier') && this.character.edges.includes('linguist')) {
      taken -= 1;
    }
    return { total: free, spent: taken, remaining: free - taken };
  },

  getStartingFunds() {
    const settingData = this.getSettingData();
    let base = (settingData && settingData.startingFunds) ? settingData.startingFunds : 500;
    if (this.character.edges.includes('rich')) base = base * 2;
    if (this.character.edges.includes('filthyRich')) base = base * 5;
    if (this.character.hindrances.includes('poverty')) base = Math.floor(base / 2);
    return base;
  },

  getRemainingFunds() {
    let spent = 0;
    this.character.gear.forEach(g => {
      spent += g.cost * (g.qty || 1);
    });
    return this.getStartingFunds() - spent;
  },

  // ----------------------------------------------------------
  // RACE HELPERS
  // ----------------------------------------------------------
  getSelectedRace() {
    return this.getRaces().find(r => r.id === this.character.race);
  },

  getRaceAttributeMinimum(attrId) {
    const race = this.getSelectedRace();
    if (!race) return 4;
    let min = 4;
    race.abilities.forEach(ab => {
      if (ab.type === 'attribute_minimum' && ab.attribute === attrId) min = Math.max(min, ab.value);
    });
    // Heritage choice
    if (this.character.heritageChoice) {
      const hc = race.abilities.find(a => a.type === 'heritage_choice');
      if (hc) {
        const chosen = hc.choices.find(c => c.id === this.character.heritageChoice);
        if (chosen) {
          chosen.effects.forEach(e => {
            if (e.type === 'attribute_minimum' && e.attribute === attrId) min = Math.max(min, e.value);
          });
        }
      }
    }
    return min;
  },

  isYoung() {
    if (this.character.hindrances.includes('youngMinor')) return 4;
    if (this.character.hindrances.includes('youngMajor')) return 3;
    return null;
  },

  isYoungSkillPoints() {
    if (this.character.hindrances.includes('youngMinor') || this.character.hindrances.includes('youngMajor')) return 10;
    return null;
  },

  // ----------------------------------------------------------
  // DERIVED STATS
  // ----------------------------------------------------------
  getDerivedStats() {
    const c = this.character;
    const race = this.getSelectedRace();
    let pace = 6;
    let runDie = 6;
    let parry = 2 + Math.floor(c.skills.fighting / 2);
    let toughness = 2 + Math.floor(c.attributes.vigor / 2);
    let size = 0;
    let armorBonus = 0;

    // Race modifiers
    if (race) {
      race.abilities.forEach(ab => {
        if (ab.type === 'pace_set') pace = ab.value;
        if (ab.type === 'pace_modifier') pace += ab.value;
        if (ab.type === 'run_die') runDie = ab.value;
        if (ab.type === 'toughness_bonus') toughness += ab.value;
        if (ab.type === 'size_modifier') { size += ab.value; toughness += ab.value; }
      });
    }

    // Hindrance modifiers
    if (c.hindrances.includes('small')) { size -= 1; toughness -= 1; }
    if (c.hindrances.includes('slowMinor')) { pace = 5; runDie = 4; }
    if (c.hindrances.includes('slowMajor')) { pace = 4; runDie = 4; }
    if (c.hindrances.includes('elderly') && this.getHindrances().find(h => h.id === 'elderly')?.special) {
      pace -= 1;
    }
    // Setting-specific hindrance pace/run modifiers
    c.hindrances.forEach(hId => {
      const h = this.getHindrances().find(x => x.id === hId);
      if (h && h.special) {
        if (h.special.paceModifier) pace += h.special.paceModifier;
        if (h.special.paceSet) { pace = h.special.paceSet; }
        if (h.special.runDie) runDie = h.special.runDie;
      }
    });

    // Edge modifiers
    if (c.edges.includes('fleetFooted')) { pace += 2; runDie = 10; }
    if (c.edges.includes('brawny')) { size += 1; toughness += 1; }
    if (c.edges.includes('brawler')) toughness += 1;

    // Shield parry bonus
    parry += Math.max(0, ...c.gear.map(g => g.parryBonus || 0));
    c.gear.forEach(g => {
      if (g.armor) armorBonus = Math.max(armorBonus, g.armor);
    });

    return { pace, runDie, parry, toughness, size, armorBonus };
  },

  // ----------------------------------------------------------
  // EDGE REQUIREMENT CHECK
  // ----------------------------------------------------------
  meetsEdgeRequirements(edge, { ignoreStats = false } = {}) {
    const c = this.character;
    for (const req of edge.requirements) {
      switch (req.type) {
        case 'attribute':
          if (!ignoreStats && c.attributes[req.attribute] < req.minimum) return false;
          break;
        case 'skill':
          if (!ignoreStats && (c.skills[req.skill] || 0) < req.minimum) return false;
          break;
        case 'skill_any':
          if (!ignoreStats && !req.skills.some(s => (c.skills[s] || 0) >= req.minimum)) return false;
          break;
        case 'edge':
          if (!c.edges.includes(req.edge)) return false;
          break;
        case 'edge_any':
          if (!req.edges.some(e => c.edges.includes(e))) return false;
          break;
        case 'hasArcaneBackground': {
          const allEdges = this.getEdges();
          const hasAB = c.edges.some(eId => {
            const e = allEdges.find(x => x.id === eId);
            return e && (e.grantsArcane || e.category === 'Arcane Background');
          });
          if (!hasAB) return false;
          break;
        }
      }
    }
    // Rank check - only Novice edges for character creation
    if (edge.rank && edge.rank !== 'Novice') return false;
    return true;
  },

  formatRequirements(edge) {
    return edge.requirements.map(req => {
      switch (req.type) {
        case 'attribute': {
          const attr = SWADE.ATTRIBUTES.find(a => a.id === req.attribute);
          return `${attr ? attr.name : req.attribute} d${req.minimum}`;
        }
        case 'skill': {
          const sk = SWADE.SKILLS.find(s => s.id === req.skill);
          return `${sk ? sk.name : req.skill} d${req.minimum}`;
        }
        case 'skill_any': {
          const names = req.skills.map(s => { const sk = SWADE.SKILLS.find(x => x.id === s); return sk ? sk.name : s; });
          return `${names.join(' or ')} d${req.minimum}`;
        }
        case 'edge': {
          const ed = this.getEdges().find(e => e.id === req.edge);
          return ed ? ed.name : req.edge;
        }
        case 'edge_any': {
          const names = req.edges.map(e => { const ed = this.getEdges().find(x => x.id === e); return ed ? ed.name : e; });
          return names.join(' or ');
        }
        case 'hasArcaneBackground':
          return 'Any Arcane Background';
        default: return '';
      }
    }).filter(Boolean).join(', ');
  },

  // ----------------------------------------------------------
  // RENDER MAIN CONTENT
  // ----------------------------------------------------------
  getTipHtml() {
    const stepId = STEPS[this.currentStep].id;
    const settingData = this.getSettingData();
    if (!settingData || !settingData.tips || !settingData.tips[stepId]) return '';
    return `
      <div class="tip-box">
        <div class="tip-header">
          <span class="tip-icon">&#x1F4A1;</span>
          <span class="tip-label">${settingData.name} Tip</span>
        </div>
        <p class="tip-text">${settingData.tips[stepId]}</p>
      </div>
    `;
  },

  renderContent() {
    const main = document.getElementById('mainContent');
    const summary = document.getElementById('summaryPanel');
    if (summary) summary.style.display = '';
    const step = STEPS[this.currentStep].id;
    main.innerHTML = `<div class="step-content"><p class="step-progress">Step ${this.currentStep + 1} of ${STEPS.length} &middot; ${STEPS[this.currentStep].label}</p>${this.getTipHtml()}${this['render_' + step]()}</div>`;
    main.querySelectorAll('.card[onclick]:not(.race-locked), .heritage-choice[onclick]').forEach(card => {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-pressed', String(card.classList.contains('selected')));
      card.onkeydown = event => {
        if (event.target !== card) return;
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
      };
    });
  },

  // ----------------------------------------------------------
  // SETTING-MERGED DATA GETTERS
  // ----------------------------------------------------------
  getSettingData() {
    if (!this.character.setting) return null;
    return SETTINGS[this.character.setting] || null;
  },

  getRaces() {
    const setting = this.getSettingData();
    if (!setting) return SWADE.RACES;
    // If the setting provides a Human race, filter out the core SWADE Human to avoid duplicates
    const settingHasHuman = setting.RACES.some(r => r.name.toLowerCase() === 'human');
    const coreRaces = settingHasHuman
      ? SWADE.RACES.filter(r => r.name.toLowerCase() !== 'human')
      : SWADE.RACES;
    return [...setting.RACES, ...coreRaces];
  },

  getEdges() {
    const setting = this.getSettingData();
    if (!setting) return SWADE.EDGES;
    return [...SWADE.EDGES, ...setting.EDGES];
  },

  getPowers() {
    const setting = this.getSettingData();
    if (!setting || !setting.POWERS) return SWADE.POWERS;
    return [...SWADE.POWERS, ...setting.POWERS];
  },

  getArcaneBackground() {
    const allEdges = this.getEdges();
    for (const eId of this.character.edges) {
      const edge = allEdges.find(e => e.id === eId);
      if (edge && (edge.grantsArcane || edge.category === 'Arcane Background')) return edge;
    }
    return null;
  },

  getPowerBudget() {
    const ab = this.getArcaneBackground();
    if (!ab) return { total: 0, spent: 0, remaining: 0, powerPoints: 0 };
    let total = ab.startingPowers || 0;
    let powerPoints = ab.powerPoints || 0;
    // New Powers edge grants +2 each time taken
    const newPowersCount = this.character.edges.filter(e => e === 'newPowers').length;
    total += newPowersCount * 2;
    // Power Points edge grants +5 each time taken
    const ppEdgeCount = this.character.edges.filter(e => e === 'powerPoints').length;
    powerPoints += ppEdgeCount * 5;
    const spent = this.character.powers.length;
    return { total, spent, remaining: total - spent, powerPoints };
  },

  getAvailablePowers() {
    const ab = this.getArcaneBackground();
    if (!ab) return [];
    const arcaneType = ab.grantsArcane || null;
    return this.getPowers().filter(p => {
      // Only Novice powers at character creation
      if (p.rank !== 'Novice') return false;
      // Check archetype restriction
      if (p.allowedBackgrounds && !p.allowedBackgrounds.includes(arcaneType)) return false;
      return true;
    });
  },

  getHindrances() {
    const setting = this.getSettingData();
    if (!setting) return SWADE.HINDRANCES;
    return [...SWADE.HINDRANCES, ...setting.HINDRANCES];
  },

  getGearCategories() {
    const base = SWADE.GEAR;
    const setting = this.getSettingData();
    if (!setting) return base;
    const merged = {};
    for (const cat of Object.keys(base)) {
      merged[cat] = [...(setting.GEAR[cat] || []), ...(base[cat] || [])];
    }
    // Add any setting-only categories
    for (const cat of Object.keys(setting.GEAR)) {
      if (!merged[cat]) merged[cat] = setting.GEAR[cat];
    }
    return merged;
  },

  // ----------------------------------------------------------
  // Step 0: Setting Selection
  // ----------------------------------------------------------
  render_setting() {
    const selected = this.character.setting;
    const settingKeys = Object.keys(SETTINGS);
    return `
      <h2>Choose Your Setting</h2>
      <div class="form-group"><label for="startingName">Character name <span class="field-hint">(you can change it later)</span></label><input id="startingName" type="text" value="${this.escHtml(this.character.name)}" placeholder="Name your hero to save a draft" oninput="app.character.name = this.value; app.renderSummary();"></div>
      <div class="getting-started"><strong>Build a hero. Bring them to your table.</strong><p>Choose a setting, follow the steps, then review and export your sheet. Your draft saves on this device as you work. Sign in and select Save Character to keep a copy across devices.</p><button class="btn btn-sm" onclick="app.showCommunityPage()">Find Players &amp; Help</button></div>
      <p class="step-desc">Select the world your character inhabits. Each setting provides unique ancestries, edges, hindrances, and gear alongside the core Savage Worlds options.</p>
      <div class="setting-grid">
        <div class="card setting-card ${selected === null ? 'selected' : ''}" onclick="app.selectSetting(null)">
          <div class="setting-card-body"><div class="card-header"><span class="card-title">Core SWADE / Homebrew</span>${selected === null ? '<span class="card-badge">Selected</span>' : ''}</div><p class="card-desc">Use the core Savage Worlds options for your own campaign. Choose a published setting below if your group uses one.</p></div>
        </div>
        ${settingKeys.map(key => {
          const s = SETTINGS[key];
          const isSel = selected === key;
          return `
            <div class="card setting-card ${isSel ? 'selected' : ''}" onclick="app.selectSetting('${key}')" style="cursor:pointer; border-color: ${isSel ? s.color : 'var(--border)'};">
              <div class="setting-card-body">
                <div class="card-header">
                  <span class="card-title" style="font-size:1.15rem;">
                    <span style="font-size:1.3rem; margin-right:0.4rem;">${s.icon}</span>
                    ${s.name}
                  </span>
                  ${isSel ? `<span class="card-badge" style="background:${s.color};">Selected</span>` : ''}
                </div>
                <p style="color:${s.color}; font-size:0.8rem; font-weight:600; margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.5px;">${s.subtitle}</p>
                <p class="card-desc">${s.description}</p>
                <div style="margin-top:0.8rem; display:flex; gap:0.8rem; flex-wrap:wrap;">
                  <span style="font-size:0.72rem; color:var(--text-dim); background:var(--bg-input); padding:2px 8px; border-radius:4px;">${s.RACES.length} Ancestries</span>
                  <span style="font-size:0.72rem; color:var(--text-dim); background:var(--bg-input); padding:2px 8px; border-radius:4px;">${s.EDGES.length} Edges</span>
                  <span style="font-size:0.72rem; color:var(--text-dim); background:var(--bg-input); padding:2px 8px; border-radius:4px;">${s.HINDRANCES.length} Hindrances</span>
                  <span style="font-size:0.72rem; color:var(--text-dim); background:var(--bg-input); padding:2px 8px; border-radius:4px;">Unique Gear</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${this.navButtons()}
    `;
  },

  selectSetting(key) {
    const prev = this.character.setting;
    const previousMinimums = Object.fromEntries(SWADE.ATTRIBUTES.map(a => [a.id, this.getRaceAttributeMinimum(a.id)]));
    this.character.setting = key;
    // If setting changed, reset race selection (setting races differ)
    if (prev !== key) {
      this.character.race = null;
      this.character.heritageChoice = null;
      this.character.hindrances = [];
      this.character.edges = [];
      this.character.gear = [];
      this.character.hindrancePointsSpent = { attributes: 0, edges: 0, skills: 0 };
      this.character.languages = [];
      this.character.powers = [];
      this.applyRace(previousMinimums);
    }
    this.renderContent();
    this.renderSummary();
  },

  // ----------------------------------------------------------
  // BONUS RULES STEP
  // ----------------------------------------------------------
  render_bonusRules() {
    const active = this.character.bonusRules;
    let html = `
      <h2>Bonus Rules</h2>
      <p class="step-desc">Optional rules your Game Master may allow. Toggle any that apply to your campaign.</p>
      <div class="bonus-gm-note">
        <span class="bonus-gm-icon">\u2696\uFE0F</span>
        <span>All bonus rules require <strong>Game Master approval</strong> before use.</span>
      </div>
      <div class="bonus-rules-grid">
    `;

    BONUS_RULES.forEach(rule => {
      const isActive = active.includes(rule.id);
      html += `
        <div class="card bonus-rule-card ${isActive ? 'selected' : ''}" onclick="app.toggleBonusRule('${rule.id}')">
          <div class="card-header">
            <span class="card-title">
              <span style="font-size:1.2rem; margin-right:0.4rem;">${rule.icon}</span>
              ${rule.name}
            </span>
            <label class="toggle-switch" onclick="event.stopPropagation();">
              <input type="checkbox" ${isActive ? 'checked' : ''} onchange="app.toggleBonusRule('${rule.id}')">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p class="card-desc" style="font-style:italic; color:var(--accent); margin-bottom:0.3rem; font-size:0.78rem;">${rule.subtitle}</p>
          <p class="card-desc">${rule.description}</p>
          <div class="bonus-rule-footer">
            <span class="card-badge">${rule.category}</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;

    // Show active effects summary
    if (active.length > 0) {
      html += `<div class="tip-box" style="margin-top:1.2rem; border-left-color: var(--success);">
        <div class="tip-header">
          <span class="tip-icon">\u2605</span>
          <span class="tip-label" style="color:var(--success);">Active Bonus Rules</span>
        </div>
        <ul style="margin:0.3rem 0 0 1.2rem; font-size:0.85rem; color:var(--text); list-style:disc;">`;
      if (active.includes('competentHero')) {
        html += '<li>Skill points increased from 12 to <strong>15</strong></li>';
      }
      if (active.includes('polyglotFrontier')) {
        html += '<li>Linguist Edge granted for <strong>free</strong></li>';
        html += `<li>Starting languages: <strong>${this.getLanguageSlots()}</strong> (Smarts d${this.character.attributes.smarts} \u00F7 2)</li>`;
      }
      html += '</ul></div>';
    }

    html += this.navButtons();
    return html;
  },

  toggleBonusRule(id) {
    const idx = this.character.bonusRules.indexOf(id);
    if (idx >= 0) {
      // Toggling OFF
      this.character.bonusRules.splice(idx, 1);
      if (id === 'polyglotFrontier') {
        this.character.languages = [];
        const lingIdx = this.character.edges.indexOf('linguist');
        if (lingIdx >= 0) this.character.edges.splice(lingIdx, 1);
      }
    } else {
      // Toggling ON
      this.character.bonusRules.push(id);
      if (id === 'polyglotFrontier') {
        if (!this.character.edges.includes('linguist')) {
          this.character.edges.push('linguist');
        }
      }
    }
    this.renderContent();
    this.renderSummary();
  },

  getLanguageSlots() {
    return Math.floor(this.character.attributes.smarts / 2);
  },

  toggleLanguage(id) {
    const idx = this.character.languages.indexOf(id);
    if (idx >= 0) {
      this.character.languages.splice(idx, 1);
    } else {
      if (this.character.languages.length >= this.getLanguageSlots()) return;
      this.character.languages.push(id);
    }
    this.renderContent();
    this.renderSummary();
  },

  // Step 1: Concept
  render_concept() {
    return `
      <h2>Character Concept</h2>
      <p class="step-desc">Define who your character is. Give them a name and a brief concept that captures their essence.</p>
      <div class="form-group">
        <label for="characterName">Character Name</label>
        <input id="characterName" type="text" value="${this.escHtml(this.character.name)}"
               oninput="app.character.name = this.value; app.renderSummary();"
               placeholder="Enter your character's name...">
      </div>
      <div class="form-group">
        <label for="characterConcept">Concept / Background</label>
        <textarea id="characterConcept" oninput="app.character.concept = this.value; app.renderSummary();"
                  placeholder="Grizzled bounty hunter, wandering healer, cunning thief...">${this.escHtml(this.character.concept)}</textarea>
      </div>
      <div class="form-group">
        <label for="characterNotes">Notes</label>
        <textarea id="characterNotes" oninput="app.character.notes = this.value; app.saveCharacter();"
                  placeholder="Any additional notes about your character...">${this.escHtml(this.character.notes)}</textarea>
      </div>
      ${this.navButtons()}
    `;
  },

  // Step 7: Powers (Placeholder)
  render_powers() {
    const ab = this.getArcaneBackground();

    // No Arcane Background — show skip message
    if (!ab) {
      return `
        <h2>Powers</h2>
        <p class="step-desc">If your character has an Arcane Background, this is where you choose your Powers and Trappings.</p>
        <div class="tip-box" style="margin-top:1rem;">
          <div class="tip-header">
            <span class="tip-icon">&#x2139;</span>
            <span class="tip-label">No Arcane Background</span>
          </div>
          <p class="tip-text">You don't currently have an Arcane Background edge. You can skip this step. If you gain one later through Advances, you'll pick powers then.</p>
        </div>
        ${this.navButtons()}
      `;
    }

    // Has AB — full powers selection
    const budget = this.getPowerBudget();
    const available = this.getAvailablePowers();
    const selected = this.character.powers;
    const filter = this.powerFilter;

    // Build AB info card
    const abInfo = `
      <div class="card selected" style="margin-bottom:1rem;">
        <div class="card-header">
          <span class="card-title">${this.escHtml(ab.name)}</span>
          <span class="card-badge" style="background:var(--accent); color:var(--bg-dark);">${budget.powerPoints} PP</span>
        </div>
        <p class="card-desc">${this.escHtml(ab.summary || ab.description)}</p>
      </div>
    `;

    // Budget tracker
    const budgetClass = budget.remaining < 0 ? 'over-budget' : budget.remaining === 0 ? 'at-budget' : '';
    const tracker = `
      <div class="point-tracker ${budgetClass}">
        <span class="tracker-label">Powers</span>
        <span class="tracker-pips">
          ${Array.from({ length: budget.total }, (_, i) =>
            `<span class="pip ${i < budget.spent ? 'filled' : ''}">${i < budget.spent ? '&#9733;' : '&#9734;'}</span>`
          ).join('')}
        </span>
        <span class="tracker-count">${budget.spent} / ${budget.total}</span>
      </div>
    `;

    // Filter buttons
    const filters = `
      <div class="filter-bar">
        <button class="filter-btn ${filter === 'All' ? 'active' : ''}" onclick="app.powerFilter='All'; app.renderContent();">All</button>
        <button class="filter-btn ${filter === 'Selected' ? 'active' : ''}" onclick="app.powerFilter='Selected'; app.renderContent();">Selected</button>
      </div>
    `;

    // Power cards
    let powersToShow = available;
    if (filter === 'Selected') {
      const selIds = selected.map(p => p.id);
      powersToShow = available.filter(p => selIds.includes(p.id));
    }

    const cards = powersToShow.map(p => {
      const sel = selected.find(s => s.id === p.id);
      const isSelected = !!sel;
      const canSelect = isSelected || budget.remaining > 0;
      return `
        <div class="card ${isSelected ? 'selected' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}"
             onclick="${canSelect || isSelected ? `app.togglePower('${p.id}')` : ''}"
             style="${!canSelect && !isSelected ? 'opacity:0.5; cursor:not-allowed;' : 'cursor:pointer;'}">
          <div class="card-header">
            <span class="card-title">${this.escHtml(p.name)}</span>
            <span class="card-badge">${this.escHtml(p.pp)} PP</span>
          </div>
          <p class="card-desc">${this.escHtml(p.summary)}</p>
          <div class="card-meta">
            <span>Range: ${this.escHtml(p.range)}</span>
            <span>Duration: ${this.escHtml(p.duration)}</span>
          </div>
          <p class="card-desc" style="font-size:0.8rem; opacity:0.8; margin-top:0.3rem;">
            <em>Trappings: ${this.escHtml(p.trappings)}</em>
          </p>
          ${p.allowedBackgrounds ? `<p class="card-desc" style="font-size:0.75rem; color:var(--accent); margin-top:0.2rem;">Restricted: ${p.allowedBackgrounds.join(', ')}</p>` : ''}
          ${isSelected ? `
            <div class="trapping-input" onclick="event.stopPropagation();">
              <label style="font-size:0.8rem; font-weight:600; display:block; margin-top:0.5rem;">Your Trapping:</label>
              <input type="text" class="input" style="width:100%; margin-top:0.2rem;"
                     placeholder="e.g. ${this.escHtml(p.trappings.split(',')[0].trim())}"
                     value="${this.escHtml(sel.trapping || '')}"
                     oninput="app.updatePowerTrapping('${p.id}', this.value)" />
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Non-Novice powers info
    const allPowers = this.getPowers();
    const higherPowers = allPowers.filter(p => p.rank !== 'Novice');
    const higherNote = higherPowers.length > 0 ? `
      <div class="tip-box" style="margin-top:1rem;">
        <div class="tip-header">
          <span class="tip-icon">&#x2139;</span>
          <span class="tip-label">${higherPowers.length} Higher-Rank Powers Available Later</span>
        </div>
        <p class="tip-text">Powers of Seasoned rank and above can be taken through Advances as your character grows. Only Novice-rank powers are available during character creation.</p>
      </div>
    ` : '';

    return `
      <h2>Powers</h2>
      <p class="step-desc">Choose your starting powers and describe their trappings — the visual flavor of how each power manifests for your character.</p>
      ${abInfo}
      ${tracker}
      ${filters}
      <div class="card-grid">${cards}</div>
      ${higherNote}
      ${this.navButtons()}
    `;
  },

  togglePower(id) {
    const idx = this.character.powers.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.character.powers.splice(idx, 1);
    } else {
      const budget = this.getPowerBudget();
      if (budget.remaining <= 0) return;
      this.character.powers.push({ id, trapping: '' });
    }
    this.renderContent();
    this.renderSummary();
  },

  updatePowerTrapping(id, value) {
    const p = this.character.powers.find(p => p.id === id);
    if (p) p.trapping = value;
    // Don't re-render — just update data silently
    this.renderSummary();
  },

  // Ancestry
  render_race() {
    const selected = this.character.race;
    const settingData = this.getSettingData();
    const settingRaceIds = settingData ? settingData.RACES.map(r => r.id) : [];
    const hasSettingRaces = settingRaceIds.length > 0;

    let html = `
      <h2>Ancestry</h2>
      <p class="step-desc">Choose your character's ancestry. Each has unique abilities and traits that shape gameplay.</p>
      <div class="selection-grid">
    `;
    this.getRaces().forEach(race => {
      const isSel = selected === race.id;
      const isSettingRace = settingRaceIds.includes(race.id);
      const isLocked = hasSettingRaces && !isSettingRace;
      html += `
        <div class="card ${isSel ? 'selected' : ''} ${isLocked ? 'race-locked' : ''}"
             ${isLocked ? '' : `onclick="app.selectRace('${race.id}')"`}
             style="${isLocked ? 'cursor:not-allowed; opacity:0.4; pointer-events:none;' : 'cursor:pointer;'}">
          <div class="card-header">
            <span class="card-title">${race.name}</span>
            ${isSel ? '<span class="card-badge">Selected</span>' : ''}
            ${isLocked ? '<span class="card-badge" style="background:#666;">Locked</span>' : ''}
          </div>
          <p class="card-desc">${race.description}</p>
          ${isLocked ? `<p style="font-size:0.78rem; color:#999; font-style:italic; margin-top:0.3rem;">Not available in ${settingData.name}</p>` : ''}
          <ul class="ability-list">
            ${race.abilities.map(ab => `
              <li><span class="ability-label">${ab.label || ''}:</span> <span class="ability-desc">${ab.description || ''}</span></li>
            `).join('')}
          </ul>
          ${isSel && this.renderHeritageChoice(race) || ''}
        </div>
      `;
    });
    html += `</div>${this.navButtons()}`;
    return html;
  },

  renderHeritageChoice(race) {
    const hc = race.abilities.find(a => a.type === 'heritage_choice');
    if (!hc) return '';
    return `
      <div style="margin-top:0.8rem;">
        <label>${hc.label}</label>
        <p class="card-desc" style="margin-bottom:0.5rem;">${hc.description}</p>
        <div class="heritage-choices">
          ${hc.choices.map(ch => `
            <div class="heritage-choice ${this.character.heritageChoice === ch.id ? 'selected' : ''}"
                 onclick="event.stopPropagation(); app.selectHeritage('${ch.id}');">
              <div class="hc-name">${ch.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  selectRace(id) {
    if (this.character.race === id) return;
    const previousMinimums = Object.fromEntries(SWADE.ATTRIBUTES.map(a => [a.id, this.getRaceAttributeMinimum(a.id)]));
    this.character.race = id;
    this.character.heritageChoice = null;
    this.applyRace(previousMinimums);
    this.renderContent();
    this.renderSummary();
  },

  selectHeritage(id) {
    const previousMinimums = Object.fromEntries(SWADE.ATTRIBUTES.map(a => [a.id, this.getRaceAttributeMinimum(a.id)]));
    this.character.heritageChoice = id;
    this.applyRace(previousMinimums);
    this.renderContent();
    this.renderSummary();
  },

  applyRace(previousMinimums = null) {
    // Preserve purchased raises while replacing the ancestry's free raises.
    SWADE.ATTRIBUTES.forEach(a => {
      const min = this.getRaceAttributeMinimum(a.id);
      if (previousMinimums) {
        const purchased = Math.max(0, this.character.attributes[a.id] - previousMinimums[a.id]);
        this.character.attributes[a.id] = Math.min(12, min + purchased);
      }
      if (this.character.attributes[a.id] < min) {
        this.character.attributes[a.id] = min;
      }
    });
  },

  // Step 3: Attributes
  render_attributes() {
    const budget = this.getAttributePoints();
    let html = `
      <h2>Attributes</h2>
      <p class="step-desc">Distribute ${budget.total} points among your five attributes. Each starts at d4 and can be raised one die type per point (d4 &rarr; d6 &rarr; d8 &rarr; d10 &rarr; d12).</p>
      <div class="point-tracker">
        <div class="pt-item">
          <span class="pt-label">Points Remaining</span>
          <span class="pt-value ${budget.remaining < 0 ? 'over-budget' : budget.remaining === 0 ? 'zero' : ''}">${budget.remaining}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Points Spent</span>
          <span class="pt-value">${budget.spent}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Total Budget</span>
          <span class="pt-value">${budget.total}</span>
        </div>
      </div>
    `;

    SWADE.ATTRIBUTES.forEach(attr => {
      const val = this.character.attributes[attr.id];
      const raceMin = this.getRaceAttributeMinimum(attr.id);
      const canDecrease = val > raceMin;
      const canIncrease = val < 12 && budget.remaining > 0;
      html += `
        <div class="trait-row">
          <div class="trait-name">
            ${attr.name}
            <br><small>${attr.description}</small>
          </div>
          <div class="die-selector">
            <button class="die-btn" onclick="app.changeAttribute('${attr.id}', -1)" ${!canDecrease ? 'disabled' : ''}>&#9664;</button>
            <span class="die-value ${val === raceMin && val === 4 ? 'base' : ''}">${dieDisplay(val)}</span>
            <button class="die-btn" onclick="app.changeAttribute('${attr.id}', 1)" ${!canIncrease ? 'disabled' : ''}>&#9654;</button>
          </div>
          <span class="trait-cost">${val > raceMin ? ((val - raceMin) / 2) + ' pts' : 'Base'}</span>
        </div>
      `;
    });

    html += this.navButtons();
    return html;
  },

  changeAttribute(id, dir) {
    const val = this.character.attributes[id];
    const newVal = val + dir * 2;
    if (newVal < this.getRaceAttributeMinimum(id) || newVal > 12) return;
    if (dir > 0 && this.getAttributePoints().remaining <= 0) return;
    this.character.attributes[id] = newVal;
    // Trim languages if Smarts decreased and Polyglot Frontier is active
    if (id === 'smarts' && this.character.bonusRules.includes('polyglotFrontier')) {
      const maxLangs = this.getLanguageSlots();
      while (this.character.languages.length > maxLangs) {
        this.character.languages.pop();
      }
    }
    this.renderContent();
    this.renderSummary();
  },

  // Step 4: Skills
  render_skills() {
    const budget = this.getSkillPoints();
    const filter = this.skillFilter;
    let html = `
      <h2>Skills</h2>
      <p class="step-desc">Distribute ${budget.total} skill points${this.character.bonusRules.includes('competentHero') ? ' <span style="color:var(--success); font-weight:600;">(Competent Hero)</span>' : ''}. Core skills (marked) start at d4 free. Raising above the linked attribute costs 2 points per step.</p>
      <div class="point-tracker">
        <div class="pt-item">
          <span class="pt-label">Points Remaining</span>
          <span class="pt-value ${budget.remaining < 0 ? 'over-budget' : budget.remaining === 0 ? 'zero' : ''}">${budget.remaining}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Points Spent</span>
          <span class="pt-value">${budget.spent}</span>
        </div>
      </div>
      <div class="filters">
        ${['all', 'core', 'agility', 'smarts', 'spirit', 'strength', 'vigor'].map(f => `
          <button class="filter-btn ${filter === f ? 'active' : ''}" onclick="app.skillFilter='${f}'; app.renderContent();">
            ${f === 'all' ? 'All' : f === 'core' ? 'Core' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        `).join('')}
      </div>
    `;

    const filteredSkills = SWADE.SKILLS.filter(s => {
      if (filter === 'all') return true;
      if (filter === 'core') return s.core;
      return s.attribute === filter;
    });

    filteredSkills.forEach(skill => {
      const val = this.character.skills[skill.id];
      const linkedAttr = this.character.attributes[skill.attribute];
      const attrName = SWADE.ATTRIBUTES.find(a => a.id === skill.attribute)?.name || '';
      const minVal = skill.core ? 4 : 0;
      const canDecrease = val > minVal;
      const canIncrease = val < 12 && budget.remaining > 0;
      const costNext = val === 0 ? 1 : ((val + 2) > linkedAttr ? 2 : 1);

      html += `
        <div class="trait-row">
          <div class="trait-name">
            ${skill.name}
            ${skill.core ? '<span class="core-badge">CORE</span>' : ''}
            <br><small>${attrName}${val > 0 && val > linkedAttr ? ' <span style="color:var(--danger);">(above linked)</span>' : ''}</small>
          </div>
          <div class="die-selector">
            <button class="die-btn" onclick="app.changeSkill('${skill.id}', -1)" ${!canDecrease ? 'disabled' : ''}>&#9664;</button>
            <span class="die-value ${val === 0 ? 'base' : ''}">${dieDisplay(val)}</span>
            <button class="die-btn" onclick="app.changeSkill('${skill.id}', 1)" ${!canIncrease ? 'disabled' : ''}>&#9654;</button>
          </div>
          <span class="trait-cost">${canIncrease ? 'Next: ' + costNext + 'pt' : (val === 12 ? 'MAX' : '')}</span>
        </div>
      `;
    });

    // Language selection (Polyglot Frontier)
    if (this.character.bonusRules.includes('polyglotFrontier')) {
      const maxLangs = this.getLanguageSlots();
      const selectedLangs = this.character.languages;
      html += `
        <div class="card" style="margin-top:1.5rem; border-color: var(--success);">
          <div class="card-header">
            <span class="card-title" style="color:var(--success);">
              \uD83D\uDDE3\uFE0F Languages (Polyglot Frontier)
            </span>
            <span class="card-badge" style="background:var(--success); color:var(--bg-dark);">
              ${selectedLangs.length} / ${maxLangs}
            </span>
          </div>
          <p class="card-desc">Select ${maxLangs} starting languages (Smarts d${this.character.attributes.smarts} \u00F7 2). Languages within the same family grant <strong>+2</strong> to communication rolls (GM discretion).</p>
      `;

      LANGUAGE_FAMILIES.forEach(family => {
        html += `<div class="lang-family">
          <h4 class="lang-family-name">${family.name}</h4>
          <div class="lang-options">`;
        family.languages.forEach(lang => {
          const checked = selectedLangs.includes(lang.id);
          const disabled = !checked && selectedLangs.length >= maxLangs;
          html += `
            <label class="lang-option ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}">
              <input type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}
                     onchange="app.toggleLanguage('${lang.id}')">
              <span>${lang.name}</span>
            </label>`;
        });
        html += '</div></div>';
      });

      html += '</div>';
    }

    html += this.navButtons();
    return html;
  },

  changeSkill(id, dir) {
    const skill = SWADE.SKILLS.find(s => s.id === id);
    const val = this.character.skills[id];
    const minVal = skill.core ? 4 : 0;
    let newVal;
    if (dir < 0) {
      newVal = val === 4 && !skill.core ? 0 : val - 2;
    } else {
      newVal = val === 0 ? 4 : val + 2;
    }
    if (newVal < minVal || newVal > 12) return;
    if (dir > 0 && this.getSkillPoints().remaining <= 0) return;
    this.character.skills[id] = newVal;
    this.renderContent();
    this.renderSummary();
  },

  // Step 5: Hindrances
  render_hindrances() {
    const hp = this.getHindrancePoints();
    const selected = this.character.hindrances;
    let majorCount = 0, minorCount = 0;
    selected.forEach(hId => {
      const h = this.getHindrances().find(x => x.id === hId);
      if (h) { if (h.type === 'Major') majorCount++; else minorCount++; }
    });

    let html = `
      <h2>Hindrances</h2>
      <p class="step-desc">Take as many Hindrances as you like. Major Hindrances earn 2 pts, Minor earn 1 pt (max 4 pts count). Spend points on extra Edges, attributes, or skills.</p>
      <div class="point-tracker">
        <div class="pt-item">
          <span class="pt-label">Hindrance Points</span>
          <span class="pt-value">${hp.earned}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Points Spent</span>
          <span class="pt-value">${hp.spent}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Remaining</span>
          <span class="pt-value ${hp.remaining < 0 ? 'over-budget' : ''}">${hp.remaining}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Major</span>
          <span class="pt-value">${majorCount}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Minor</span>
          <span class="pt-value">${minorCount}</span>
        </div>
      </div>
    `;

    // Hindrance point allocation
    if (hp.earned > 0) {
      html += this.renderHindrancePointAllocation();
    }

    html += '<div class="selection-grid" style="margin-top:1rem;">';

    // Major first, then minor
    const sorted = [...this.getHindrances()].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'Major' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach(h => {
      const isSel = selected.includes(h.id);
      const isMajor = h.type === 'Major';
      const maxed = isMajor ? majorCount >= 1 : minorCount >= 2;
      const disabled = !isSel && (maxed || hp.earned >= 4);

      html += `
        <div class="card ${isSel ? 'selected' : ''} ${disabled && !isSel ? 'disabled' : ''}"
             onclick="app.toggleHindrance('${h.id}')" style="cursor:pointer;">
          <div class="card-header">
            <span class="card-title">${h.name}</span>
            <span class="card-badge ${isMajor ? 'major' : 'minor'}">${h.type}</span>
          </div>
          <p class="card-desc">${h.description}</p>
        </div>
      `;
    });

    html += `</div>${this.navButtons()}`;
    return html;
  },

  renderHindrancePointAllocation() {
    const hp = this.getHindrancePoints();
    const s = this.character.hindrancePointsSpent;
    return `
      <div class="hp-allocation">
        <h3>Spend Hindrance Points (${hp.remaining} remaining)</h3>
        <div class="hp-row">
          <label>Extra Edge (2 pts each)</label>
          <div class="qty-controls">
            <button onclick="app.adjustHP('edges', -1)" ${s.edges <= 0 ? 'disabled' : ''}>-</button>
            <span class="qty-val">${s.edges}</span>
            <button onclick="app.adjustHP('edges', 1)" ${hp.remaining < 2 ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="hp-row">
          <label>Raise Attribute (2 pts)</label>
          <div class="qty-controls">
            <button onclick="app.adjustHP('attributes', -1)" ${s.attributes <= 0 ? 'disabled' : ''}>-</button>
            <span class="qty-val">${s.attributes}</span>
            <button onclick="app.adjustHP('attributes', 1)" ${hp.remaining < 2 ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="hp-row">
          <label>Extra Skill Point (1 pt each)</label>
          <div class="qty-controls">
            <button onclick="app.adjustHP('skills', -1)" ${s.skills <= 0 ? 'disabled' : ''}>-</button>
            <span class="qty-val">${s.skills}</span>
            <button onclick="app.adjustHP('skills', 1)" ${hp.remaining < 1 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      </div>
    `;
  },

  adjustHP(type, dir) {
    const hp = this.getHindrancePoints();
    const cost = type === 'skills' ? 1 : 2;
    if (dir > 0 && hp.remaining < cost) return;
    if (dir < 0 && this.character.hindrancePointsSpent[type] <= 0) return;
    this.character.hindrancePointsSpent[type] += dir;
    this.renderContent();
    this.renderSummary();
  },

  toggleHindrance(id) {
    const idx = this.character.hindrances.indexOf(id);
    if (idx >= 0) {
      this.character.hindrances.splice(idx, 1);
      // Reset hindrance point spending if we now have fewer points
      this.clampHindranceSpending();
    } else {
      this.character.hindrances.push(id);
    }
    this.renderContent();
    this.renderSummary();
  },

  clampHindranceSpending() {
    const hp = this.getHindrancePoints();
    while (hp.earned < this.character.hindrancePointsSpent.attributes * 2 + this.character.hindrancePointsSpent.edges * 2 + this.character.hindrancePointsSpent.skills) {
      if (this.character.hindrancePointsSpent.skills > 0) this.character.hindrancePointsSpent.skills--;
      else if (this.character.hindrancePointsSpent.attributes > 0) this.character.hindrancePointsSpent.attributes--;
      else if (this.character.hindrancePointsSpent.edges > 0) this.character.hindrancePointsSpent.edges--;
      else break;
    }
    // Also clamp edges if we have too many
    // Polyglot Frontier's Linguist doesn't count against budget, so account for it
    const bonusEdgeCount = (this.character.bonusRules.includes('polyglotFrontier') && this.character.edges.includes('linguist')) ? 1 : 0;
    while (this.character.edges.length > this.getFreeEdgeCount() + bonusEdgeCount) {
      // Don't pop linguist if it's a bonus edge
      const lastEdge = this.character.edges[this.character.edges.length - 1];
      if (lastEdge === 'linguist' && this.character.bonusRules.includes('polyglotFrontier')) {
        // Swap with second-to-last and pop that instead
        if (this.character.edges.length > 1) {
          const swapIdx = this.character.edges.length - 2;
          this.character.edges[this.character.edges.length - 1] = this.character.edges[swapIdx];
          this.character.edges[swapIdx] = 'linguist';
          this.character.edges.pop();
        } else break;
      } else {
        this.character.edges.pop();
      }
    }
  },

  // Step 6: Edges
  render_edges() {
    const budget = this.getEdgeBudget();
    const filter = this.edgeFilter;
    const categories = ['All', ...new Set(this.getEdges().map(e => e.category))];

    let html = `
      <h2>Edges</h2>
      <p class="step-desc">Select your character's Edges. You have ${budget.total} Edge slot${budget.total !== 1 ? 's' : ''} available. Only Novice-rank Edges are available at character creation. Stat requirements are shown but not enforced here \u2014 you'll set Attributes and Skills next to meet them.</p>
      <div class="point-tracker">
        <div class="pt-item">
          <span class="pt-label">Edges Available</span>
          <span class="pt-value ${budget.remaining < 0 ? 'over-budget' : budget.remaining === 0 ? 'zero' : ''}">${budget.remaining}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Edges Taken</span>
          <span class="pt-value">${budget.spent}</span>
        </div>
      </div>
      <div class="filters">
        ${categories.map(c => `
          <button class="filter-btn ${filter === c ? 'active' : ''}"
                  onclick="app.edgeFilter='${c}'; app.renderContent();">${c}</button>
        `).join('')}
      </div>
      <div class="selection-grid">
    `;

    const filteredEdges = this.getEdges().filter(e => {
      if (e.rank !== 'Novice') return false;
      if (filter !== 'All' && e.category !== filter) return false;
      return true;
    });

    filteredEdges.forEach(edge => {
      const isSel = this.character.edges.includes(edge.id);
      const meetsStructural = this.meetsEdgeRequirements(edge, { ignoreStats: true });
      const meetsFull = this.meetsEdgeRequirements(edge);
      const isBonusEdge = (edge.id === 'linguist' && this.character.bonusRules.includes('polyglotFrontier'));
      const canTake = isSel || (meetsStructural && budget.remaining > 0);
      const reqStr = this.formatRequirements(edge);

      html += `
        <div class="card ${isSel ? 'selected' : ''} ${!canTake && !isSel ? 'disabled' : ''} ${isBonusEdge ? 'bonus-edge' : ''}"
             onclick="${isBonusEdge ? '' : `app.toggleEdge('${edge.id}')`}" style="cursor:${isBonusEdge ? 'default' : 'pointer'};">
          <div class="card-header">
            <span class="card-title">${edge.name}</span>
            ${isBonusEdge ? '<span class="card-badge" style="background:var(--success); color:var(--bg-dark);">Polyglot Frontier \u2014 Free</span>' : `<span class="card-badge">${edge.category}</span>`}
          </div>
          <p class="card-desc">${edge.description}</p>
          ${reqStr ? `<p class="card-reqs ${!meetsFull ? 'unmet' : ''}">Requires: ${reqStr}</p>` : ''}
        </div>
      `;
    });

    html += `</div>${this.navButtons()}`;
    return html;
  },

  toggleEdge(id) {
    // Prevent removing Linguist while Polyglot Frontier is active
    if (id === 'linguist' && this.character.bonusRules.includes('polyglotFrontier')) return;
    const idx = this.character.edges.indexOf(id);
    if (idx >= 0) {
      this.character.edges.splice(idx, 1);
      // If removed edge was an AB, clear all powers
      const removedEdge = this.getEdges().find(e => e.id === id);
      if (removedEdge && (removedEdge.grantsArcane || removedEdge.category === 'Arcane Background')) {
        this.character.powers = [];
      }
      // If removed New Powers edge, trim powers to new budget
      if (id === 'newPowers') {
        const budget = this.getPowerBudget();
        if (budget.remaining < 0) {
          this.character.powers = this.character.powers.slice(0, budget.total);
        }
      }
    } else {
      const edge = this.getEdges().find(e => e.id === id);
      if (!edge || !this.meetsEdgeRequirements(edge, { ignoreStats: true })) return;
      if (this.getEdgeBudget().remaining <= 0) return;
      this.character.edges.push(id);
    }
    this.renderContent();
    this.renderSummary();
  },

  // Step 7: Gear
  render_gear() {
    const funds = this.getRemainingFunds();
    const total = this.getStartingFunds();
    const tab = this.gearTab;
    const tabs = [
      { id: 'melee', label: 'Melee' },
      { id: 'ranged', label: 'Ranged' },
      { id: 'firearms', label: 'Firearms' },
      { id: 'armor', label: 'Armor' },
      { id: 'shields', label: 'Shields' },
      { id: 'mundane', label: 'Mundane' },
    ];

    let html = `
      <h2>Gear & Equipment</h2>
      <p class="step-desc">Outfit your character. Starting funds: $${total}.</p>
      <div class="point-tracker">
        <div class="pt-item">
          <span class="pt-label">Funds Remaining</span>
          <span class="pt-value ${funds < 0 ? 'over-budget' : ''}">\$${funds}</span>
        </div>
        <div class="pt-item">
          <span class="pt-label">Total Funds</span>
          <span class="pt-value">\$${total}</span>
        </div>
      </div>
    `;

    // Owned gear
    if (this.character.gear.length > 0) {
      html += `<div class="card" style="margin-bottom:1.5rem;">
        <div class="card-header"><span class="card-title">Owned Equipment</span></div>
        <div class="table-scroll"><table class="gear-table">
          <thead><tr><th>Item</th><th>Cost</th><th>Qty</th><th></th></tr></thead>
          <tbody>`;
      this.character.gear.forEach((g, i) => {
        html += `<tr>
          <td>${g.name}</td>
          <td class="cost">\$${g.cost}</td>
          <td>
            <div class="qty-controls">
              <button onclick="app.changeGearQty(${i}, -1)">-</button>
              <span class="qty-val">${g.qty || 1}</span>
              <button onclick="app.changeGearQty(${i}, 1)">+</button>
            </div>
          </td>
          <td><button class="btn btn-danger btn-sm" onclick="app.removeGear(${i})">Drop</button></td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    }

    // Gear tabs
    html += `<div class="tabs">
      ${tabs.map(t => `<button class="tab ${tab === t.id ? 'active' : ''}" onclick="app.gearTab='${t.id}'; app.renderContent();">${t.label}</button>`).join('')}
    </div>`;

    const items = this.getGearCategories()[tab] || [];
    html += `<div class="table-scroll"><table class="gear-table"><thead><tr>`;
    if (tab === 'armor') {
      html += '<th>Name</th><th>Armor</th><th>Coverage</th><th>Cost</th><th>Weight</th><th></th>';
    } else if (tab === 'shields') {
      html += '<th>Name</th><th>Parry</th><th>Cost</th><th>Weight</th><th>Notes</th><th></th>';
    } else if (tab === 'melee') {
      html += '<th>Name</th><th>Damage</th><th>Cost</th><th>Weight</th><th>Notes</th><th></th>';
    } else if (tab === 'ranged' || tab === 'firearms') {
      html += '<th>Name</th><th>Damage</th><th>Range</th><th>Cost</th><th>Wt</th><th>Notes</th><th></th>';
    } else {
      html += '<th>Name</th><th>Cost</th><th>Weight</th><th>Notes</th><th></th>';
    }
    html += '</tr></thead><tbody>';

    const settingData = this.getSettingData();
    const blockedGear = (settingData && settingData.blockedCoreGear) || [];

    items.forEach(item => {
      const owned = this.character.gear.find(g => g.id === item.id);
      const isBlocked = blockedGear.includes(item.id);
      html += `<tr class="${owned ? 'selected' : ''} ${isBlocked ? 'gear-locked' : ''}">`;
      if (tab === 'armor') {
        html += `<td>${item.name}</td><td>+${item.armor}</td><td>${item.coverage}</td><td class="cost">\$${item.cost}</td><td>${item.weight}</td>`;
      } else if (tab === 'shields') {
        html += `<td>${item.name}</td><td>+${item.parryBonus}</td><td class="cost">\$${item.cost}</td><td>${item.weight}</td><td>${item.notes}</td>`;
      } else if (tab === 'melee') {
        html += `<td>${item.name}</td><td>${item.damage}</td><td class="cost">\$${item.cost}</td><td>${item.weight}</td><td>${item.notes}</td>`;
      } else if (tab === 'ranged' || tab === 'firearms') {
        html += `<td>${item.name}</td><td>${item.damage}</td><td>${item.range}</td><td class="cost">\$${item.cost}</td><td>${item.weight}</td><td>${item.notes}</td>`;
      } else {
        html += `<td>${item.name}</td><td class="cost">\$${item.cost}</td><td>${item.weight}</td><td>${item.notes}</td>`;
      }
      if (isBlocked) {
        html += `<td><span style="font-size:0.72rem; color:#666; font-style:italic;">N/A</span></td>`;
      } else {
        html += `<td><button class="btn btn-sm" onclick="app.addGear('${tab}','${item.id}')" ${funds < item.cost && !owned ? 'disabled' : ''}>${owned ? '+1' : 'Buy'}</button></td>`;
      }
      html += '</tr>';
    });

    html += `</tbody></table></div>${this.navButtons()}`;
    return html;
  },

  addGear(category, itemId) {
    const items = this.getGearCategories()[category];
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const existing = this.character.gear.find(g => g.id === itemId);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      this.character.gear.push({ ...item, qty: 1 });
    }
    this.renderContent();
    this.renderSummary();
  },

  removeGear(index) {
    this.character.gear.splice(index, 1);
    this.renderContent();
    this.renderSummary();
  },

  changeGearQty(index, dir) {
    const g = this.character.gear[index];
    g.qty = (g.qty || 1) + dir;
    if (g.qty <= 0) this.character.gear.splice(index, 1);
    this.renderContent();
    this.renderSummary();
  },

  // Step 8: Summary / Review
  render_summary() {
    const c = this.character;
    const race = this.getSelectedRace();
    const stats = this.getDerivedStats();

    let html = `
      <h2>Character Review</h2>
      <p class="step-desc">Review your completed character sheet below.</p>
      <div class="card" style="padding:1.5rem;">
        <h2 style="color:var(--accent); margin-bottom:0.2rem;">${c.name || 'Unnamed Character'}</h2>
        <p style="color:var(--text-dim); font-style:italic; margin-bottom:1rem;">${c.concept || 'No concept set'}</p>
        <p style="color:var(--info); margin-bottom:${c.bonusRules.length > 0 ? '0.5rem' : '1.5rem'};">Ancestry: ${race ? race.name : 'None selected'}</p>

        ${c.bonusRules.length > 0 ? `
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.2rem;">
            ${c.bonusRules.map(rId => {
              const rule = BONUS_RULES.find(r => r.id === rId);
              return rule ? `<span class="card-badge" style="background:var(--success); color:var(--bg-dark);">${rule.icon} ${rule.name}</span>` : '';
            }).join('')}
          </div>
        ` : ''}

        <div class="derived-stats">
          <div class="derived-stat-box"><span class="ds-label">Pace</span><span class="ds-value">${stats.pace}</span></div>
          <div class="derived-stat-box"><span class="ds-label">Parry</span><span class="ds-value">${stats.parry}</span></div>
          <div class="derived-stat-box"><span class="ds-label">Toughness</span><span class="ds-value">${stats.toughness}${stats.armorBonus ? ' (' + stats.armorBonus + ')' : ''}</span></div>
          <div class="derived-stat-box"><span class="ds-label">Run Die</span><span class="ds-value">d${stats.runDie}</span></div>
        </div>

        <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Attributes</h3>
        ${SWADE.ATTRIBUTES.map(a => `
          <div class="summary-row"><span class="s-label">${a.name}</span><span class="s-value">${dieDisplay(c.attributes[a.id])}</span></div>
        `).join('')}

        <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Skills</h3>
        ${SWADE.SKILLS.filter(s => c.skills[s.id] > 0).map(s => `
          <div class="summary-row"><span class="s-label">${s.name}</span><span class="s-value">${dieDisplay(c.skills[s.id])}</span></div>
        `).join('')}

        ${c.hindrances.length > 0 ? `
          <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Hindrances</h3>
          <ul class="summary-list">
            ${c.hindrances.map(hId => {
              const h = this.getHindrances().find(x => x.id === hId);
              return h ? `<li>${h.name} (${h.type})</li>` : '';
            }).join('')}
          </ul>
        ` : ''}

        ${c.edges.length > 0 ? `
          <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Edges</h3>
          <ul class="summary-list">
            ${c.edges.map(eId => {
              const e = this.getEdges().find(x => x.id === eId);
              if (!e) return '';
              const isFree = eId === 'linguist' && c.bonusRules.includes('polyglotFrontier');
              return `<li>${e.name}${isFree ? ' <span style="color:var(--success);">(Free)</span>' : ''} &mdash; ${e.summary || ''}</li>`;
            }).join('')}
          </ul>
        ` : ''}

        ${c.bonusRules.includes('polyglotFrontier') && c.languages.length > 0 ? `
          <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Languages</h3>
          <ul class="summary-list">
            ${c.languages.map(lId => {
              for (const fam of LANGUAGE_FAMILIES) {
                const lang = fam.languages.find(l => l.id === lId);
                if (lang) return '<li>' + lang.name + ' (' + fam.name + ')</li>';
              }
              return '';
            }).join('')}
          </ul>
          <p class="card-desc" style="margin-top:0.3rem; font-size:0.8rem; color:var(--text-dim);">+2 communication bonus within same language family (GM discretion)</p>
        ` : ''}

        ${c.powers.length > 0 ? `
          <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Powers</h3>
          <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--border); text-align:left;">
                <th style="padding:0.3rem 0.5rem;">Power</th>
                <th style="padding:0.3rem 0.5rem;">PP</th>
                <th style="padding:0.3rem 0.5rem;">Range</th>
                <th style="padding:0.3rem 0.5rem;">Trapping</th>
              </tr>
            </thead>
            <tbody>
              ${c.powers.map(p => {
                const pw = this.getPowers().find(x => x.id === p.id);
                if (!pw) return '';
                return `<tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:0.3rem 0.5rem; font-weight:600;">${pw.name}</td>
                  <td style="padding:0.3rem 0.5rem;">${pw.pp}</td>
                  <td style="padding:0.3rem 0.5rem;">${pw.range}</td>
                  <td style="padding:0.3rem 0.5rem; font-style:italic;">${this.escHtml(p.trapping || '—')}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          ${(() => {
            const ab = this.getArcaneBackground();
            const budget = this.getPowerBudget();
            return `<div class="summary-row" style="margin-top:0.5rem;"><span class="s-label">Arcane Background</span><span class="s-value">${ab ? ab.name : '—'}</span></div>
              <div class="summary-row"><span class="s-label">Power Points</span><span class="s-value">${budget.powerPoints}</span></div>`;
          })()}
        ` : ''}

        ${c.gear.length > 0 ? `
          <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Gear</h3>
          <ul class="summary-list">
            ${c.gear.map(g => `<li>${g.name}${(g.qty || 1) > 1 ? ' x' + g.qty : ''} ${g.damage ? '(' + g.damage + ')' : ''}</li>`).join('')}
          </ul>
          <div class="summary-row" style="margin-top:0.5rem;"><span class="s-label">Remaining Funds</span><span class="s-value">\$${this.getRemainingFunds()}</span></div>
        ` : ''}

        ${c.notes ? `
          <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin:1rem 0 0.5rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Notes</h3>
          <p class="card-desc">${this.escHtml(c.notes)}</p>
        ` : ''}
      </div>

      <div class="export-section" style="margin-top:1.5rem;">
        <h3 style="color:var(--accent); border-bottom:1px solid var(--border); padding-bottom:0.3rem; margin-bottom:0.75rem; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px;">Export Character</h3>
        <div class="export-grid">
          <button class="btn export-btn" onclick="app.exportJSON()">
            <span class="export-icon">{ }</span>
            <span class="export-label">JSON</span>
            <span class="export-desc">Raw character data</span>
          </button>
          <button class="btn export-btn export-btn--foundry" onclick="app.exportFoundryVTT()">
            <span class="export-icon">\u2694</span>
            <span class="export-label">Foundry VTT</span>
            <span class="export-desc">SWADE Actor import</span>
          </button>
          <button class="btn export-btn export-btn--roll20" onclick="app.exportRoll20()">
            <span class="export-icon">\u26CF</span>
            <span class="export-label">Roll20</span>
            <span class="export-desc">Character sheet data</span>
          </button>
          <button class="btn export-btn" onclick="app.showPrintModal()">
            <span class="export-icon">\u2399</span>
            <span class="export-label">Print</span>
            <span class="export-desc">Choose sheet style</span>
          </button>
        </div>
      </div>

      <div class="tip-box" style="margin-top:1.2rem;">
        <div class="tip-header">
          <span class="tip-icon">&#x1F4C1;</span>
          <span class="tip-label">Organization Tip</span>
        </div>
        <p class="tip-text">Create a folder on your computer for your characters (e.g. <strong>Savage Worlds Characters / Hank Morgan /</strong>) and save exported files and printed sheets there for future gaming sessions.</p>
      </div>

      ${this.navButtons(true)}
    `;
    return html;
  },

  // ----------------------------------------------------------
  // SIDEBAR SUMMARY PANEL
  // ----------------------------------------------------------
  renderSummary() {
    this.saveCharacter();
    const panel = document.getElementById('summaryPanel');
    const c = this.character;
    // Update mobile header title
    const mobileTitle = document.getElementById('mobileTitle');
    if (mobileTitle) mobileTitle.textContent = c.name || 'Savage Master';
    const race = this.getSelectedRace();
    const stats = this.getDerivedStats();

    panel.innerHTML = `
      ${this.getSettingData() ? `<div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:${this.getSettingData().color}; font-weight:600; margin-bottom:0.3rem;">${this.getSettingData().icon} ${this.getSettingData().name}</div>` : ''}
      <div class="summary-name">${c.name || 'Unnamed'}</div>
      <div class="summary-concept">${c.concept || 'No concept'}</div>
      ${race ? `<div class="summary-race">${race.name}</div>` : ''}

      ${c.bonusRules.length > 0 ? `
        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:0.3rem;">
          ${c.bonusRules.map(rId => {
            const rule = BONUS_RULES.find(r => r.id === rId);
            return rule ? `<span class="card-badge" style="background:var(--success); color:var(--bg-dark); font-size:0.65rem;">${rule.icon} ${rule.name}</span>` : '';
          }).join('')}
        </div>
      ` : ''}

      <div class="summary-section" style="margin-top:1rem;">
        <h3>Derived Stats</h3>
        <div class="summary-row"><span class="s-label">Pace</span><span class="s-value">${stats.pace}</span></div>
        <div class="summary-row"><span class="s-label">Parry</span><span class="s-value">${stats.parry}</span></div>
        <div class="summary-row"><span class="s-label">Toughness</span><span class="s-value">${stats.toughness}${stats.armorBonus ? ' (' + stats.armorBonus + ')' : ''}</span></div>
        <div class="summary-row"><span class="s-label">Size</span><span class="s-value">${stats.size}</span></div>
        <div class="summary-row"><span class="s-label">Run Die</span><span class="s-value">d${stats.runDie}</span></div>
      </div>

      <div class="summary-section">
        <h3>Attributes</h3>
        ${SWADE.ATTRIBUTES.map(a => `
          <div class="summary-row"><span class="s-label">${a.name}</span><span class="s-value">${dieDisplay(c.attributes[a.id])}</span></div>
        `).join('')}
      </div>

      <div class="summary-section">
        <h3>Skills</h3>
        ${SWADE.SKILLS.filter(s => c.skills[s.id] > 0).map(s => `
          <div class="summary-row"><span class="s-label">${s.name}</span><span class="s-value">${dieDisplay(c.skills[s.id])}</span></div>
        `).join('') || '<p style="font-size:0.8rem; color:var(--text-dim);">No skills selected</p>'}
      </div>

      ${c.hindrances.length > 0 ? `
        <div class="summary-section">
          <h3>Hindrances</h3>
          <ul class="summary-list">
            ${c.hindrances.map(hId => {
              const h = this.getHindrances().find(x => x.id === hId);
              return h ? `<li>${h.name}</li>` : '';
            }).join('')}
          </ul>
        </div>
      ` : ''}

      ${c.edges.length > 0 ? `
        <div class="summary-section">
          <h3>Edges</h3>
          <ul class="summary-list">
            ${c.edges.map(eId => {
              const e = this.getEdges().find(x => x.id === eId);
              if (!e) return '';
              const isFree = eId === 'linguist' && c.bonusRules.includes('polyglotFrontier');
              return `<li>${e.name}${isFree ? ' <span style="color:var(--success); font-size:0.75rem;">(Free)</span>' : ''}</li>`;
            }).join('')}
          </ul>
        </div>
      ` : ''}

      ${c.bonusRules.includes('polyglotFrontier') && c.languages.length > 0 ? `
        <div class="summary-section">
          <h3>Languages</h3>
          <ul class="summary-list">
            ${c.languages.map(lId => {
              for (const fam of LANGUAGE_FAMILIES) {
                const lang = fam.languages.find(l => l.id === lId);
                if (lang) return '<li>' + lang.name + ' <span style="font-size:0.7rem; color:var(--text-dim);">(' + fam.name + ')</span></li>';
              }
              return '';
            }).join('')}
          </ul>
        </div>
      ` : ''}

      ${c.powers.length > 0 ? `
        <div class="summary-section">
          <h3>Powers</h3>
          <ul class="summary-list">
            ${c.powers.map(p => {
              const pw = this.getPowers().find(x => x.id === p.id);
              return pw ? `<li>${pw.name}${p.trapping ? ' <span style="font-size:0.7rem; color:var(--text-dim);">(' + this.escHtml(p.trapping) + ')</span>' : ''}</li>` : '';
            }).join('')}
          </ul>
          ${(() => { const b = this.getPowerBudget(); return `<div class="summary-row" style="margin-top:0.3rem;"><span class="s-label">Power Points</span><span class="s-value">${b.powerPoints}</span></div>`; })()}
        </div>
      ` : ''}

      ${c.gear.length > 0 ? `
        <div class="summary-section">
          <h3>Gear</h3>
          <ul class="summary-list">
            ${c.gear.map(g => `<li>${g.name}${(g.qty||1) > 1 ? ' x' + g.qty : ''}</li>`).join('')}
          </ul>
          <div class="summary-row" style="margin-top:0.3rem;"><span class="s-label">Funds</span><span class="s-value">\$${this.getRemainingFunds()}</span></div>
        </div>
      ` : ''}
    `;
  },

  // ----------------------------------------------------------
  // NAV BUTTONS
  // ----------------------------------------------------------
  navButtons(isLast = false) {
    return `
      <div class="nav-buttons">
        ${this.currentStep > 0 ? `<button class="btn" onclick="app.prevStep()">&#9664; ${STEPS[this.currentStep - 1].label}</button>` : '<span></span>'}
        ${!isLast ? `<button class="btn btn-primary" onclick="app.nextStep()">Next: ${STEPS[this.currentStep + 1].label} &#9654;</button>` : '<span></span>'}
      </div>
    `;
  },

  // ----------------------------------------------------------
  // OFFICIAL CONTENT / STORE PAGE
  // ----------------------------------------------------------
  showCommunityPage() {
    document.querySelector('.sidebar')?.classList.remove('account-open');
    document.getElementById('summaryPanel').style.display = 'none';
    const main = document.getElementById('mainContent');
    main.innerHTML = `<div class="step-content community-page">
      <button class="btn btn-sm" onclick="app.returnFromStore()">&larr; Back to your character</button>
      <h2>Find Players &amp; Help</h2>
      <p class="step-desc">Take your hero to a gaming group, learn the rules, or find your next table.</p>
      <div class="community-grid">
        <a class="card community-link" href="https://www.pegforum.com/" target="_blank" rel="noopener noreferrer"><h3>Pinnacle Forums &nearr;</h3><p>Discuss rules and campaigns with Savage Worlds players.</p></a>
        <a class="card community-link" href="https://www.reddit.com/r/savageworlds/" target="_blank" rel="noopener noreferrer"><h3>Savage Worlds on Reddit &nearr;</h3><p>Find character ideas, campaign conversations, and community advice.</p></a>
        <a class="card community-link" href="https://discord.com/invite/VqT7CJj" target="_blank" rel="noopener noreferrer"><h3>Unofficial Discord &nearr;</h3><p>Meet other fans and look for groups in the community server linked by Pinnacle.</p></a>
        <a class="card community-link" href="https://app.roll20.net/lfg/search/" target="_blank" rel="noopener noreferrer"><h3>Find a Game on Roll20 &nearr;</h3><p>Filter for Savage Worlds, your schedule, and games welcoming new players.</p></a>
      </div>
      <h3>New to Savage Worlds?</h3>
      <p><a href="https://shop.peginc.com/pages/new-to-savage-worlds" target="_blank" rel="noopener noreferrer">Pinnacle's getting started guide &nearr;</a> includes free Test Drive rules and introductions to online play.</p>
      <h3>Save, share, and play</h3>
      <ul class="help-list"><li><strong>On this device:</strong> your current draft saves automatically. Download an editable backup before clearing browser data.</li><li><strong>Across devices:</strong> sign in, select Save Character, then open it from My Characters on your other device. Cloud saves are manual.</li><li><strong>With your GM:</strong> send an editable backup or a sheet from Review. Sharing this site's link does not share your private characters.</li><li><strong>Roll20:</strong> use the Official Savage Worlds sheet. Open the exported JSON as text and paste it into the sheet's JSON Importer in Settings. Use a new empty character to avoid duplicate entries.</li><li><strong>Foundry:</strong> import the Foundry JSON into a character Actor in a SWADE world. Parry and Toughness are imported as manual values to preserve your build; review them with your GM before enabling automatic calculation.</li><li><strong>Offline:</strong> after one online visit, the builder can reopen offline. Account sign-in and cloud saving require internet access.</li></ul>
      <button class="btn btn-primary" onclick="app.copySiteLink()">Copy site link for your group</button><p id="shareStatus" role="status"></p>
      <p class="community-note">Independent fan-made tool. Community links are external services. Savage Worlds and setting names belong to their respective owners.</p>
    </div>`;
    main.scrollTop = 0;
    document.querySelectorAll('#stepNav li').forEach(li => li.classList.remove('active'));
  },

  async copySiteLink() {
    const status = document.getElementById('shareStatus');
    try {
      await navigator.clipboard.writeText('https://smsheets.com/');
      status.textContent = 'Link copied. Paste it into your gaming group chat.';
    } catch {
      status.textContent = 'Share this link: https://smsheets.com/';
    }
  },


  showStorePage() {
    document.querySelector('.sidebar')?.classList.remove('account-open');
    const main = document.getElementById('mainContent');
    const summaryPanel = document.getElementById('summaryPanel');
    if (summaryPanel) summaryPanel.style.display = 'none';
    main.innerHTML = `<div class="step-content">${this.render_storePage()}</div>`;
    main.scrollTop = 0;
    // Deselect nav steps
    document.querySelectorAll('#stepNav li').forEach(li => li.classList.remove('active'));
  },

  returnFromStore() {
    const summaryPanel = document.getElementById('summaryPanel');
    if (summaryPanel) summaryPanel.style.display = '';
    this.goToStep(this.currentStep);
  },

  render_storePage() {
    return `
      <div class="store-page">
        <button class="store-back-btn" onclick="app.returnFromStore()">&larr; Back to Character Creator</button>

        <div class="store-header">
          <h1>Official Savage Worlds Content</h1>
          <p>Everything you need to play Savage Worlds and its settings. Books, dice, bennies, and more from Pinnacle Entertainment Group.</p>
        </div>

        <div class="store-quick-links">
          <a class="store-quick-link" href="https://shop.peginc.com" target="_blank" rel="noopener">PEG Official Store</a>
          <a class="store-quick-link" href="https://www.drivethrurpg.com/en/publisher/27/pinnacle-entertainment" target="_blank" rel="noopener">DriveThruRPG PDFs</a>
          <a class="store-quick-link" href="https://www.amazon.com/s?k=savage+worlds+adventure+edition" target="_blank" rel="noopener">Amazon</a>
          <a class="store-quick-link" href="https://shop.peginc.com/blogs/news" target="_blank" rel="noopener">Publisher News</a>
        </div>

        <!-- KICKSTARTER CALLOUT -->
        <div class="store-callout">
          <h3>Check the latest releases</h3>
          <p>Prices, availability, and editions change. Visit Pinnacle for current products and announcements.</p>
          <a href="https://shop.peginc.com/blogs/news" target="_blank" rel="noopener">Publisher news &rarr;</a>
        </div>

        <!-- CORE SAVAGE WORLDS -->
        <div class="store-section">
          <div class="store-section-banner" style="background: linear-gradient(135deg, #2a2318 0%, #1a1510 100%); border-color: var(--accent);">
            <div class="store-banner-content">
              <h2 class="store-banner-title" style="color: var(--accent);">Savage Worlds Core</h2>
              <p class="store-banner-desc">The foundation of every Savage Worlds game. Core rules, companions, and essential accessories.</p>
            </div>
            <div class="store-banner-showcase">
              <img src="images/swade-core.webp" alt="SWADE Core Rules" class="store-showcase-book store-showcase-hero">
            </div>
          </div>
          <div class="store-grid">
            ${this.storeItem('SWADE Core Rules', 'The complete Savage Worlds Adventure Edition rulebook. Everything you need to run any setting.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10023', 'images/swade-core.webp')}
            ${this.storeItem('SWADE Core Rules (PDF)', 'Digital-only version of the complete core rulebook.', '$19.99', 'PDF', 'pdf', 'https://shop.peginc.com/products/s2p10023pdf')}
            ${this.storeItem('Player\'s Book', 'Streamlined player reference with character creation, skills, edges, and combat rules.', '$19.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10031')}
            ${this.storeItem('GM Screen + Mini Settings', 'Three-panel GM screen with quick-reference tables plus bonus mini settings.', '$19.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10026')}
            ${this.storeItem('SWADE Accessory Box', 'Dice, bennies, templates, action cards, and status tokens in one box.', '$24.99', 'Accessory', 'accessory', 'https://shop.peginc.com/products/s2p10032', 'images/swade-accessory-box.jpg')}
            ${this.storeItem('Savage Worlds Bennies', 'Set of official Savage Worlds benny tokens.', '$14.99', 'Accessory', 'accessory', 'https://shop.peginc.com/products/s2p91105', 'images/swade-bennies.jpg')}
            ${this.storeItem('Fantasy Companion', 'Extended rules, races, edges, and gear for fantasy settings.', '$44.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10028')}
            ${this.storeItem('Horror Companion', 'Rules for fear, sanity, monsters, and running horror campaigns.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10029')}
            ${this.storeItem('Super Powers Companion', 'Build superheroes and villains with the super powers framework.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10030')}
          </div>
        </div>

        <!-- DEADLANDS -->
        <div class="store-section">
          <div class="store-section-banner" style="border-color: #b8860b;">
            <div class="store-banner-content">
              <h2 class="store-banner-title" style="color: #d4a64a;">Deadlands: The Weird West</h2>
              <p class="store-banner-desc">Gunslingers, hucksters, and mad scientists face the horrors of the Weird West.</p>
            </div>
            <div class="store-banner-showcase">
              <img src="images/deadlands-core.webp" alt="Deadlands Core Rules" class="store-showcase-book">
              <img src="images/deadlands-boxed-set.webp" alt="Deadlands Boxed Set" class="store-showcase-book">
              <img src="images/deadlands-dice.png" alt="Deadlands Dice" class="store-showcase-accessory">
            </div>
          </div>
          <div class="store-grid">
            ${this.storeItem('Deadlands Core Rules', 'The complete Weird West setting book. Gunslingers, hucksters, mad scientists, and the Reckoning.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10220', 'images/deadlands-core.webp')}
            ${this.storeItem('Deadlands Core Rules (PDF)', 'Digital-only version of the Deadlands setting book.', '$19.99', 'PDF', 'pdf', 'https://shop.peginc.com/products/s2p10220pdf')}
            ${this.storeItem('Deadlands Companion', 'Expanded content: new edges, powers, gear, creatures, and setting rules.', '$24.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10221')}
            ${this.storeItem('Deadlands Boxed Set', 'Core rules, companion, maps, pawns, dice, bennies, and action deck in one premium box.', '$99.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10227', 'images/deadlands-boxed-set.webp')}
            ${this.storeItem('Deadlands Dice Set', 'Custom dice themed for the Weird West.', '$12.99', 'Accessory', 'accessory', 'https://shop.peginc.com/products/s2p91123', 'images/deadlands-dice.png')}
            ${this.storeItem('Deadlands Bennies', 'Set of 25 poker-chip style Weird West benny tokens.', '$19.99', 'Accessory', 'accessory', 'https://shop.peginc.com/products/s2p91122')}
            ${this.storeItem('Deadlands Pawns', 'Cardstock figure flats for cowboys, outlaws, undead, and monsters.', '$29.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p10226')}
            ${this.storeItem('30th Anniversary Kickstarter', 'New combined core rulebook, starter box, bestiary, leatherbound edition, and commemorative accessories.', 'Kickstarter', 'Kickstarter', 'kickstarter', 'https://www.kickstarter.com/projects/545820095/deadlands-30th-anniversary-celebration')}
          </div>
        </div>

        <!-- RIFTS -->
        <div class="store-section">
          <div class="store-section-banner" style="border-color: #00bfff;">
            <div class="store-banner-content">
              <h2 class="store-banner-title" style="color: #6ec6ff;">Rifts for Savage Worlds</h2>
              <p class="store-banner-desc">Post-apocalyptic adventure across the shattered megaverse of Rifts Earth.</p>
            </div>
            <div class="store-banner-showcase">
              <img src="images/rifts-core.png" alt="Rifts Player's Guide" class="store-showcase-book">
            </div>
          </div>
          <div class="store-grid">
            ${this.storeItem('Tomorrow Legion Player\'s Guide', 'Core player book for Savage Rifts. Iconic frameworks, gear, and the world of Rifts Earth.', '$29.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11200re', 'images/rifts-core.png')}
            ${this.storeItem('Savage Foes of North America', 'Bestiary of monsters, D-Bees, demons, and villains for Rifts North America.', '$24.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11202re')}
            ${this.storeItem('Atlantis and the Demon Seas', 'Sourcebook covering the Splugorth\'s domain, Atlantis, and the oceans of Rifts Earth.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11216')}
            ${this.storeItem('Blood & Banes', 'Expanded threats, allies, and adventures across North America.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11211')}
            ${this.storeItem('Arcana & Mysticism', 'Deep dive into magic, psionics, and techno-wizardry in Rifts.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11210')}
            ${this.storeItem('Empires of Humanity', 'Coalition States, Free Quebec, and the human powers of North America.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11212')}
            ${this.storeItem('Europa', 'The war-torn continent of Europe in the Rifts megaverse.', '$44.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11227')}
            ${this.storeItem('South America', 'Land of a Thousand Islands \u2014 the shattered continent south of the border.', '$39.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11223')}
            ${this.storeItem('Savage Rifts Dice', 'Custom Rifts-themed dice set.', '$12.99', 'Accessory', 'accessory', 'https://shop.peginc.com/products/s2p91112', 'images/rifts-dice.jpg')}
            ${this.storeItem('Savage Rifts Bennies', 'Rifts-themed benny tokens.', '$19.99', 'Accessory', 'accessory', 'https://shop.peginc.com/products/s2p91113')}
          </div>
        </div>

        <!-- 50 FATHOMS -->
        <div class="store-section">
          <div class="store-section-banner" style="border-color: #2e8b57;">
            <div class="store-banner-content">
              <h2 class="store-banner-title" style="color: #4ecca3;">50 Fathoms (Pirates)</h2>
              <p class="store-banner-desc">Sail the drowned world of Caribdus. Swashbuckling adventure on the high seas.</p>
            </div>
          </div>
          <div class="store-grid">
            ${this.storeItem('50 Fathoms Player\'s Guide (PDF)', 'Player reference for the drowned world of Caribdus.', '$4.99', 'PDF', 'pdf', 'https://www.peginc.com/product-category/50fathoms/')}
            ${this.storeItem('50 Fathoms: Fire and Earth', 'Adventure supplement expanding the 50 Fathoms campaign.', '$14.99', 'Print + PDF', 'print', 'https://www.peginc.com/product-category/50fathoms/')}
            ${this.storeItem('SWADE Conversion (PDF)', 'Free conversion guide to run 50 Fathoms with Adventure Edition rules.', 'Free', 'Free', 'free', 'https://www.peginc.com/product-category/50fathoms/')}
            ${this.storeItem('50 Fathoms Figure Flats (PDF)', 'Printable cardstock figures for ships and characters.', '$6.99', 'PDF', 'pdf', 'https://www.peginc.com/product-category/50fathoms/')}
            ${this.storeItem('Caribdus Map', 'High-resolution map of the flooded world.', 'Free', 'Free', 'free', 'https://www.peginc.com/product-category/50fathoms/')}
            ${this.storeItem('50 Fathoms on DriveThruRPG', 'Full catalog of 50 Fathoms PDFs including the core setting book.', 'Various', 'PDF', 'pdf', 'https://www.drivethrurpg.com/en/publisher/27/pinnacle-entertainment')}
          </div>
        </div>

        <!-- PATHFINDER -->
        <div class="store-section">
          <div class="store-section-banner" style="border-color: #7b2d8e;">
            <div class="store-banner-content">
              <h2 class="store-banner-title" style="color: #b48adb;">Pathfinder for Savage Worlds</h2>
              <p class="store-banner-desc">The world of Golarion meets the Fast! Furious! Fun! of Savage Worlds.</p>
            </div>
            <div class="store-banner-showcase">
            </div>
          </div>
          <div class="store-grid">
            ${this.storeItem('Savage Pathfinder Core Rules', 'The world of Golarion adapted for Savage Worlds. Classes, races, spells, and the complete rules.', '$49.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11501', 'images/pathfinder-core.jpg')}
            ${this.storeItem('Savage Pathfinder Core (PDF)', 'Digital-only version of the Pathfinder core rules.', '$24.99', 'PDF', 'pdf', 'https://shop.peginc.com/products/s2p11501pdf')}
            ${this.storeItem('Bestiary', 'Monsters and creatures of Golarion for Savage Worlds.', '$29.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11502')}
            ${this.storeItem('Bestiary 2', 'Even more creatures from the depths of Golarion.', '$29.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11522')}
            ${this.storeItem('Companion', 'Expanded options for players and GMs: new edges, powers, and setting rules.', '$29.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11503')}
            ${this.storeItem('Advanced Player\'s Guide', 'Additional class edges, archetypes, feats, and character options.', '$29.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11514')}
            ${this.storeItem('Advanced Player\'s Guide 2', 'Even more character options and expanded content.', '$29.99', 'Print + PDF', 'print', 'https://shop.peginc.com/products/s2p11521')}
            ${this.storeItem('Savage Pathfinder Dice', 'Custom Pathfinder-themed dice set.', '$14.99', 'Accessory', 'accessory', 'https://shop.peginc.com/products/s2p91143', 'images/pathfinder-dice.jpg')}
          </div>
        </div>

        <div class="store-footer">
          <p>All products are published by <a href="https://peginc.com" target="_blank" rel="noopener">Pinnacle Entertainment Group</a>.</p>
          <p>Savage Worlds, Deadlands, and all related marks are trademarks of Pinnacle Entertainment Group.</p>
          <p>Pathfinder is a trademark of Paizo Inc. Rifts is a trademark of Palladium Books Inc.</p>
          <p style="margin-top: 0.5rem;">Prices shown are approximate and may vary. Visit the official store for current pricing.</p>
          <p style="margin-top: 0.5rem;">Product images courtesy of Pinnacle Entertainment Group.</p>
        </div>
      </div>
    `;
  },

  storeItem(name, desc, price, badgeText, badgeType, url, imgSrc) {
    const availableImages = ['images/swade-core.webp', 'images/rifts-core.png', 'images/deadlands-dice.png', 'images/deadlands-core.webp', 'images/deadlands-boxed-set.webp'];
    if (!availableImages.includes(imgSrc)) imgSrc = null;
    const imgHtml = imgSrc
      ? `<div class="store-item-img"><img src="${imgSrc}" alt="${name}" loading="lazy"></div>`
      : '';
    return `
      <div class="store-item ${imgSrc ? 'store-item-has-img' : ''}">
        ${imgHtml}
        <div class="store-item-body">
          <div class="store-item-name">${name}</div>
          <div class="store-item-desc">${desc}</div>
          <div class="store-item-meta">
            <span class="store-item-badge store-badge-${badgeType}">${badgeText}</span>
            <span class="store-item-price">Check retailer</span>
            <a class="store-item-link" href="${url}" target="_blank" rel="noopener">Visit &rarr;</a>
          </div>
        </div>
      </div>
    `;
  },

  // ----------------------------------------------------------
  // EXPORT / RESET
  // ----------------------------------------------------------
  saveCharacter() {
    try {
      localStorage.setItem('savage-master-character-v1', JSON.stringify({ version: 1, character: this.character }));
    } catch (error) {
      console.warn('Could not save character:', error);
    }
  },

  parseCharacterBackup(backup) {
    if (!backup || backup.version !== 1 || !backup.character || typeof backup.character !== 'object' || Array.isArray(backup.character)) {
      throw new Error('This is not a Savage Master character backup.');
    }
    const c = backup.character;
    const defaults = createDefaultCharacter();
    if (typeof c.name !== 'string' || typeof c.concept !== 'string' ||
        !c.attributes || typeof c.attributes !== 'object' || !c.skills || typeof c.skills !== 'object' ||
        !Array.isArray(c.hindrances) || !Array.isArray(c.edges) || !Array.isArray(c.gear) ||
        !Array.isArray(c.bonusRules) || !Array.isArray(c.languages) || !Array.isArray(c.powers) ||
        !c.hindrancePointsSpent || typeof c.hindrancePointsSpent !== 'object') {
      throw new Error('Character backup is missing required data.');
    }
    if (c.setting !== null && !Object.hasOwn(SETTINGS, c.setting)) throw new Error('Unknown campaign setting.');
    if (c.race !== null && typeof c.race !== 'string') throw new Error('Invalid ancestry.');
    for (const a of SWADE.ATTRIBUTES) {
      if (!Number.isInteger(c.attributes[a.id]) || c.attributes[a.id] < 4 || c.attributes[a.id] > 12) throw new Error('Invalid attributes.');
    }
    for (const s of SWADE.SKILLS) {
      if (!Number.isInteger(c.skills[s.id]) || c.skills[s.id] < 0 || c.skills[s.id] > 12) throw new Error('Invalid skills.');
    }
    if (c.gear.some(g => !g || typeof g.id !== 'string' || !Number.isInteger(g.qty) || g.qty < 1)) throw new Error('Invalid equipment.');
    return { ...defaults, ...c, attributes: { ...defaults.attributes, ...c.attributes }, skills: { ...defaults.skills, ...c.skills } };
  },

  exportBackup() {
    this._downloadJSON({ version: 1, character: this.character },
      (this.character.name || 'character').replace(/[^a-z0-9]/gi, '_') + '_savage_master_backup.json');
  },

  async importBackup(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Backup file is too large.');
      const restored = this.parseCharacterBackup(JSON.parse(await file.text()));
      if (!confirm('Load this backup and replace the current character?')) return;
      this.character = restored;
      this.currentStep = 0;
      this.renderNav();
      this.renderContent();
      this.renderSummary();
    } catch (error) {
      alert('Could not load character: ' + error.message);
    } finally {
      input.value = '';
    }
  },

  exportJSON() {
    const c = this.character;
    const race = this.getSelectedRace();
    const stats = this.getDerivedStats();
    const exportData = {
      name: c.name,
      concept: c.concept,
      setting: this.getSettingData() ? this.getSettingData().name : 'Core SWADE',
      race: race ? race.name : null,
      attributes: {},
      skills: {},
      hindrances: c.hindrances.map(id => {
        const h = this.getHindrances().find(x => x.id === id);
        return h ? { name: h.name, type: h.type } : null;
      }).filter(Boolean),
      edges: c.edges.map(id => {
        const e = this.getEdges().find(x => x.id === id);
        return e ? { name: e.name, summary: e.summary } : null;
      }).filter(Boolean),
      gear: c.gear.map(g => ({ name: g.name, qty: g.qty || 1, cost: g.cost })),
      derivedStats: stats,
      remainingFunds: this.getRemainingFunds(),
      bonusRules: c.bonusRules.map(rId => {
        const rule = BONUS_RULES.find(r => r.id === rId);
        return rule ? { id: rule.id, name: rule.name } : null;
      }).filter(Boolean),
      languages: c.languages.map(lId => {
        for (const fam of LANGUAGE_FAMILIES) {
          const lang = fam.languages.find(l => l.id === lId);
          if (lang) return { name: lang.name, family: fam.name };
        }
        return null;
      }).filter(Boolean),
      notes: c.notes,
      powers: c.powers.map(p => {
        const pw = this.getPowers().find(x => x.id === p.id);
        return pw ? { name: pw.name, pp: pw.pp, range: pw.range, duration: pw.duration, trapping: p.trapping || '' } : null;
      }).filter(Boolean),
      arcaneBackground: (() => {
        const ab = this.getArcaneBackground();
        if (!ab) return null;
        const budget = this.getPowerBudget();
        return { name: ab.name, type: ab.grantsArcane || 'unknown', powerPoints: budget.powerPoints };
      })(),
    };
    SWADE.ATTRIBUTES.forEach(a => exportData.attributes[a.name] = DIE_LABELS[c.attributes[a.id]]);
    SWADE.SKILLS.forEach(s => { if (c.skills[s.id] > 0) exportData.skills[s.name] = DIE_LABELS[c.skills[s.id]]; });

    this._downloadJSON(exportData, (c.name || 'character').replace(/[^a-z0-9]/gi, '_') + '.json');
  },

  // ----------------------------------------------------------
  // FOUNDRY VTT EXPORT (SWADE System)
  // ----------------------------------------------------------
  exportFoundryVTT() {
    const c = this.character;
    const race = this.getSelectedRace();
    const stats = this.getDerivedStats();
    const settingData = this.getSettingData();

    // Build Foundry VTT Actor
    const actor = {
      name: c.name || 'Unnamed Character',
      type: 'character',
      img: 'icons/svg/mystery-man.svg',
      system: {
        attributes: {},
        pace: { base: 'ground', ground: stats.pace, running: { die: stats.runDie, mod: 0 } },
        stats: {
          toughness: { value: stats.toughness + stats.armorBonus, armor: stats.armorBonus },
          parry: { value: stats.parry, shield: Math.max(0, ...c.gear.map(g => g.parryBonus || 0)) },
          size: stats.size,
        },
        details: {
          autoCalcToughness: false,
          autoCalcParry: false,
          biography: { value: c.notes ? '<p>' + this.escHtml(c.notes) + '</p>' : '' },
          species: { name: race ? race.name : '' },
          archetype: c.concept || '',
        },
        bennies: { value: 3, max: 3 },
        wounds: { value: 0, max: 3 },
        fatigue: { value: 0, max: 2 },
        wildcard: true,
        advances: { value: 0 },
        powerPoints: { general: { value: this.getPowerBudget().powerPoints, max: this.getPowerBudget().powerPoints } },
        additionalStats: {},
      },
      items: [],
      prototypeToken: {
        name: c.name || 'Unnamed Character',
        displayName: 20,
        actorLink: true,
        disposition: 1,
      },
    };

    // Attributes
    SWADE.ATTRIBUTES.forEach(a => {
      actor.system.attributes[a.id] = {
        die: { sides: c.attributes[a.id], modifier: 0 },
        unShakeBonus: 0,
      };
    });

    // Skills as items
    SWADE.SKILLS.forEach(s => {
      if (c.skills[s.id] > 0) {
        actor.items.push({
          name: s.name,
          type: 'skill',
          img: 'systems/swade/assets/icons/skill.svg',
          system: {
            die: { sides: c.skills[s.id], modifier: 0 },
            attribute: s.attribute,
            isCoreSkill: s.core || false,
          },
        });
      }
    });

    // Edges as items
    c.edges.forEach(eId => {
      const edge = this.getEdges().find(x => x.id === eId);
      if (edge) {
        actor.items.push({
          name: edge.name,
          type: 'edge',
          img: 'systems/swade/assets/icons/edge.svg',
          system: {
            isArcaneBackground: edge.id.startsWith('ab'),
            requirements: [],
            description: edge.description || '',
          },
        });
      }
    });

    // Hindrances as items
    c.hindrances.forEach(hId => {
      const h = this.getHindrances().find(x => x.id === hId);
      if (h) {
        actor.items.push({
          name: h.name,
          type: 'hindrance',
          img: 'systems/swade/assets/icons/hindrance.svg',
          system: {
            major: h.type === 'Major',
            description: h.description || '',
          },
        });
      }
    });

    // Gear as items
    c.gear.forEach(g => {
      const qty = g.qty || 1;
      if (g.damage) {
        // Weapon
        const isRanged = !!g.range;
        actor.items.push({
          name: g.name,
          type: 'weapon',
          img: isRanged ? 'systems/swade/assets/icons/ranged-weapon.svg' : 'systems/swade/assets/icons/melee-weapon.svg',
          system: {
            damage: g.damage,
            range: g.range || '',
            ap: parseInt((g.notes || '').match(/AP\s*(\d+)/i)?.[1]) || 0,
            actions: { skill: isRanged ? 'Shooting' : 'Fighting' },
            notes: g.notes || '',
            equipStatus: 3,
            quantity: qty,
            weight: g.weight || 0,
            price: g.cost || 0,
          },
        });
      } else if (g.armor !== undefined) {
        // Armor
        actor.items.push({
          name: g.name,
          type: 'armor',
          img: 'systems/swade/assets/icons/armor.svg',
          system: {
            armor: g.armor,
            equipStatus: 3,
            notes: g.notes || '',
            locations: { head: /head/i.test(g.coverage || ''), torso: /torso/i.test(g.coverage || ''), arms: /arms/i.test(g.coverage || ''), legs: /legs/i.test(g.coverage || '') },
            quantity: qty,
            weight: g.weight || 0,
            price: g.cost || 0,
          },
        });
      } else if (g.parryBonus) {
        // Shield
        actor.items.push({
          name: g.name,
          type: 'shield',
          img: 'systems/swade/assets/icons/shield.svg',
          system: {
            parry: g.parryBonus,
            cover: 0,
            equipStatus: 3,
            notes: g.notes || '',
            quantity: qty,
            weight: g.weight || 0,
            price: g.cost || 0,
          },
        });
      } else {
        // Mundane gear
        actor.items.push({
          name: g.name,
          type: 'gear',
          img: 'systems/swade/assets/icons/gear.svg',
          system: {
            notes: g.notes || '',
            equipStatus: 3,
            quantity: qty,
            weight: g.weight || 0,
            price: g.cost || 0,
          },
        });
      }
    });

    // Add racial abilities as Special Abilities
    if (race) {
      race.abilities.forEach(ab => {
        if (ab.type === 'ability' || ab.type === 'racial_hindrance') {
          actor.items.push({
            name: ab.label,
            type: 'ability',
            img: 'systems/swade/assets/icons/special-ability.svg',
            system: {
              description: ab.description || '',
              subtype: ab.type === 'racial_hindrance' ? 'race' : 'race',
            },
          });
        }
      });
    }

    // Add languages as a special ability
    if (c.languages.length > 0) {
      const langNames = c.languages.map(lId => {
        for (const fam of LANGUAGE_FAMILIES) {
          const lang = fam.languages.find(l => l.id === lId);
          if (lang) return lang.name + ' (' + fam.name + ')';
        }
        return null;
      }).filter(Boolean);
      actor.items.push({
        name: 'Languages (Linguist)',
        type: 'ability',
        img: 'systems/swade/assets/icons/special-ability.svg',
        system: {
          description: '<p>Known languages: ' + langNames.join(', ') + '</p><p>+2 to any dialect within the same language family.</p>',
          subtype: 'special',
        },
      });
    }

    // Powers as items
    c.powers.forEach(p => {
      const pw = this.getPowers().find(x => x.id === p.id);
      if (pw) {
        actor.items.push({
          name: pw.name,
          type: 'power',
          img: 'systems/swade/assets/icons/power.svg',
          system: {
            rank: pw.rank || 'Novice',
            pp: pw.pp,
            range: pw.range,
            duration: pw.duration,
            trapping: p.trapping || '',
            description: pw.description || '',
            arcane: (() => { const ab = this.getArcaneBackground(); return ab ? ab.grantsArcane || '' : ''; })(),
          },
        });
      }
    });

    // Add setting name to biography
    if (settingData) {
      actor.system.details.biography.value =
        '<p><strong>Setting:</strong> ' + this.escHtml(settingData.name + ' — ' + settingData.subtitle) + '</p>' +
        actor.system.details.biography.value;
    }

    this._downloadJSON(actor, (c.name || 'character').replace(/[^a-z0-9]/gi, '_') + '_foundry.json');
  },

  // ----------------------------------------------------------
  // ROLL20 EXPORT (SWADE Character Sheet)
  // ----------------------------------------------------------
  exportRoll20() {
    const c = this.character;
    const race = this.getSelectedRace();
    const stats = this.getDerivedStats();
    const settingData = this.getSettingData();

    // Roll20 uses flat attribute key-value pairs
    const attribs = {};
    const set = (key, val) => { attribs[key] = { current: String(val), max: '' }; };
    const setMax = (key, val, max) => { attribs[key] = { current: String(val), max: String(max) }; };

    // Character info
    set('character_name', c.name || 'Unnamed');
    set('setting', settingData ? settingData.name + ' — ' + settingData.subtitle : 'Core SWADE');
    set('race', race ? race.name : '');
    set('concept', c.concept || '');
    set('rank', 'Novice');
    set('wildcard', '1');

    // Attributes (die type number)
    SWADE.ATTRIBUTES.forEach(a => {
      set(a.id, c.attributes[a.id]);
      set(a.id + '_die', 'd' + c.attributes[a.id]);
    });

    // Derived stats
    set('pace', stats.pace);
    set('pace_running_die', 'd' + stats.runDie);
    set('parry', stats.parry);
    set('toughness', stats.toughness);
    set('toughness_armor', stats.armorBonus);
    set('size', stats.size);
    setMax('wounds', 0, 3);
    setMax('fatigue', 0, 2);
    setMax('bennies', 3, 3);

    // Skills as repeating section
    const skills = [];
    SWADE.SKILLS.forEach(s => {
      if (c.skills[s.id] > 0) {
        skills.push({
          name: s.name,
          die: 'd' + c.skills[s.id],
          attribute: s.attribute,
          core: s.core ? '1' : '0',
        });
      }
    });

    // Edges
    const edges = c.edges.map(eId => {
      const e = this.getEdges().find(x => x.id === eId);
      return e ? { name: e.name, description: e.description || '', rank: e.rank || 'Novice' } : null;
    }).filter(Boolean);

    // Hindrances
    const hindrances = c.hindrances.map(hId => {
      const h = this.getHindrances().find(x => x.id === hId);
      return h ? { name: h.name, type: h.type, description: h.description || '' } : null;
    }).filter(Boolean);

    // Gear / Weapons / Armor
    const weapons = [];
    const armor = [];
    const gear = [];
    c.gear.forEach(g => {
      const qty = g.qty || 1;
      if (g.damage) {
        weapons.push({
          name: g.name,
          damage: g.damage,
          range: g.range || 'Melee',
          rof: '1',
          ap: (g.notes || '').match(/AP\s*(\d+)/i)?.[1] || '0',
          notes: g.notes || '',
          quantity: qty,
          weight: g.weight || 0,
        });
      } else if (g.armor !== undefined) {
        armor.push({
          name: g.name,
          armor_value: g.armor,
          coverage: g.coverage || '',
          notes: g.notes || '',
          weight: g.weight || 0,
        });
      } else if (g.parryBonus) {
        armor.push({
          name: g.name,
          armor_value: 0,
          parry_bonus: g.parryBonus,
          coverage: 'Shield',
          notes: g.notes || '',
          weight: g.weight || 0,
        });
      } else {
        gear.push({
          name: g.name,
          quantity: qty,
          weight: g.weight || 0,
          notes: g.notes || '',
        });
      }
    });

    // Racial abilities
    const specials = [];
    if (race) {
      race.abilities.forEach(ab => {
        if (ab.type === 'ability' || ab.type === 'racial_hindrance' || ab.type === 'free_edge') {
          specials.push({ name: ab.label, description: ab.description || '' });
        }
      });
    }

    // Add languages to specials
    if (c.languages.length > 0) {
      const langNames = c.languages.map(lId => {
        for (const fam of LANGUAGE_FAMILIES) {
          const lang = fam.languages.find(l => l.id === lId);
          if (lang) return lang.name + ' (' + fam.name + ')';
        }
        return null;
      }).filter(Boolean);
      specials.push({
        name: 'Languages (Linguist)',
        description: 'Known languages: ' + langNames.join(', ') + '. +2 to any dialect within the same language family.',
      });
    }

    // Powers
    const powers = c.powers.map(p => {
      const pw = this.getPowers().find(x => x.id === p.id);
      return pw ? { name: pw.name, pp: pw.pp, range: pw.range, duration: pw.duration, trapping: p.trapping || '', description: pw.description || '' } : null;
    }).filter(Boolean);

    // Power Points & AB attribute
    const abEdge = this.getArcaneBackground();
    if (abEdge) {
      const budget = this.getPowerBudget();
      setMax('power_points', budget.powerPoints, budget.powerPoints);
      set('arcane_background', abEdge.name);
    }

    // The Official Savage Worlds sheet imports a top-level character object.
    // See Roll20/roll20-character-sheets, Official Savage Worlds JSON importer.
    const roll20Data = {
      name: c.name || 'Unnamed', age: '', gender: '', professionOrTitle: c.concept || '',
      iconicFramework: '', description: '', background: c.notes || '',
      race: race ? race.name : '', wildcard: true,
      fatigue: 0, fatigueMax: 2, wounds: 0, woundsMax: 3,
      paceBase: stats.pace, paceMod: 0, runningDie: 'd' + stats.runDie,
      parryMod: stats.parry - (2 + Math.floor(c.skills.fighting / 2)),
      toughnessMod: stats.toughness - (2 + Math.floor(c.attributes.vigor / 2)),
      size: stats.size, wealth: this.getRemainingFunds(),
      attributes: SWADE.ATTRIBUTES.map(a => ({ name: a.id, dieValue: c.attributes[a.id], mod: 0 })),
      skills: SWADE.SKILLS.filter(sk => c.skills[sk.id] > 0).map(sk => ({ name: sk.name, dieValue: c.skills[sk.id], mod: 0, attribute: sk.attribute })),
      edges: edges.map(e => ({ ...e, note: 'Creation' })),
      hindrances: hindrances.map(h => ({ ...h, name: h.name.replace(/ \(Major\)| \(Minor\)/g, '') + ' (' + h.type + ')', major: h.type === 'Major' })),
      abilities: specials,
      advances: [], cyberware: [],
      gear,
      weapons: weapons.map(w => ({ ...w, minStr: 'd4', shots: 0 })),
      armor: c.gear.filter(g => g.armor !== undefined).map(g => ({
        name: g.name, armor: g.armor, quantity: g.qty || 1, weight: g.weight || 0,
        minStr: 'd4', equipped: true, notes: g.notes || '',
        coversHead: /head/i.test(g.coverage || ''), coversTorso: /torso/i.test(g.coverage || ''),
        coversArms: /arms/i.test(g.coverage || ''), coversLegs: /legs/i.test(g.coverage || ''),
      })),
      // The sheet's shield importer does not import Parry bonuses. Keep the
      // strongest bonus in parryMod above and carry shields as inventory.
      shields: [],
      abs: abEdge ? [{
        name: abEdge.name, arcaneSkill: ({ magic: 'Spellcasting', miracles: 'Faith', psionics: 'Psionics', weirdScience: 'Weird Science', gifted: 'Focus' })[abEdge.grantsArcane] || 'Spellcasting',
        powerPointsName: 'Power Points', powerPointsCurrent: this.getPowerBudget().powerPoints,
        powerPointsMax: this.getPowerBudget().powerPoints,
        powers: powers.map(pw => ({ ...pw, powerPoints: pw.pp, summary: pw.trapping, damage: '' })),
      }] : [],
    };
    c.gear.filter(g => g.parryBonus).forEach(g => roll20Data.gear.push({ name: g.name, quantity: g.qty || 1, weight: g.weight || 0 }));

    this._downloadJSON(roll20Data, (c.name || 'character').replace(/[^a-z0-9]/gi, '_') + '_roll20.json');
  },

  // ----------------------------------------------------------
  // DOWNLOAD HELPER
  // ----------------------------------------------------------
  _downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  resetCharacter() {
    if (!confirm('Start a new character? All current progress will be lost.')) return false;
    this.character = createDefaultCharacter();
    window.characterCloud?.clearSelection();
    this.currentStep = 0;
    this.goToStep(0);
    this.saveCharacter();
    return true;
  },

  // ----------------------------------------------------------
  // PRINTABLE CHARACTER SHEET SYSTEM
  // ----------------------------------------------------------
  _buildCharacterData() {
    const c = this.character;
    const race = this.getSelectedRace();
    const stats = this.getDerivedStats();
    const settingData = this.getSettingData();

    // Build attributes array
    const attributes = SWADE.ATTRIBUTES.map(a => ({
      name: a.name,
      short: a.name.substring(0, 3).toUpperCase(),
      die: c.attributes[a.id] || 4
    }));

    // Build skills array grouped by linked attribute
    const skills = [];
    const allSkills = settingData ? [...SWADE.SKILLS, ...(settingData.SKILLS || [])] : SWADE.SKILLS;
    allSkills.forEach(s => {
      const die = c.skills[s.id] || 0;
      if (die > 0) {
        const linkedAttr = SWADE.ATTRIBUTES.find(a => a.id === s.attribute);
        skills.push({
          name: s.name,
          die: die,
          attribute: linkedAttr ? linkedAttr.name : s.attribute
        });
      }
    });
    skills.sort((a, b) => a.name.localeCompare(b.name));

    // Build hindrances array
    const hindrances = c.hindrances.map(hId => {
      const h = this.getHindrances().find(x => x.id === hId);
      return h ? { name: h.name, type: h.type } : null;
    }).filter(Boolean);

    // Build edges array
    const edges = c.edges.map(eId => {
      const e = this.getEdges().find(x => x.id === eId);
      return e ? { name: e.name, summary: e.summary || '' } : null;
    }).filter(Boolean);

    // Categorize gear
    const weapons = [];
    const armor = [];
    const mundane = [];
    c.gear.forEach(g => {
      if (g.damage || g.range || g.ap !== undefined || g.rof) {
        weapons.push(g);
      } else if (g.armor) {
        armor.push(g);
      } else {
        mundane.push(g);
      }
    });

    return {
      name: c.name || 'Unnamed',
      concept: c.concept || '',
      settingName: settingData ? settingData.name : 'Core SWADE',
      raceName: race ? race.name : 'Human',
      attributes,
      skills,
      hindrances,
      edges,
      weapons,
      armor,
      mundane,
      allGear: c.gear,
      stats,
      funds: {
        starting: this.getStartingFunds(),
        remaining: this.getRemainingFunds()
      },
      bonusRules: c.bonusRules.map(rId => {
        const rule = BONUS_RULES.find(r => r.id === rId);
        return rule ? { id: rule.id, name: rule.name } : null;
      }).filter(Boolean),
      languages: c.languages.map(lId => {
        for (const fam of LANGUAGE_FAMILIES) {
          const lang = fam.languages.find(l => l.id === lId);
          if (lang) return { name: lang.name, family: fam.name };
        }
        return null;
      }).filter(Boolean),
      notes: c.notes || '',
      powers: (() => {
        const allPowers = this.getPowers();
        return c.powers.map(p => {
          const def = allPowers.find(x => x.id === p.id);
          return def ? { name: def.name, pp: def.pp, range: def.range, duration: def.duration, trapping: p.trapping || '' } : null;
        }).filter(Boolean);
      })(),
      arcaneBackground: (() => {
        const ab = this.getArcaneBackground();
        if (!ab) return null;
        const budget = this.getPowerBudget();
        return { name: ab.name, powerPoints: budget.powerPoints };
      })()
    };
  },

  showPrintModal() {
    // Remove existing modal if any
    this.closePrintModal();

    const overlay = document.createElement('div');
    overlay.className = 'print-modal-overlay';
    overlay.id = 'printModalOverlay';
    overlay.onclick = (e) => { if (e.target === overlay) this.closePrintModal(); };

    overlay.innerHTML = `
      <div class="print-modal">
        <button class="print-modal-close" onclick="app.closePrintModal()" title="Close">&times;</button>
        <h2>Choose Sheet Style</h2>
        <p style="color:var(--text-dim); font-size:0.85rem; margin-bottom:1.2rem;">Select a character sheet layout to print.</p>
        <div class="print-style-grid">
          <div class="print-style-card" onclick="app.printSheet(1)">
            <div class="print-style-icon">\u{1F4DC}</div>
            <h3>Classic Deadlands</h3>
            <p>Clean parchment layout with organized bordered sections. Two-column grid for attributes, skills, edges and hindrances.</p>
          </div>
          <div class="print-style-card" onclick="app.printSheet(2)">
            <div class="print-style-icon">\u{1F3A8}</div>
            <h3>Frontier Record</h3>
            <p>Ornate Western style with skills grouped by attribute, wound tracker, and detailed powers table.</p>
          </div>
          <div class="print-style-card" onclick="app.printSheet(3)">
            <div class="print-style-icon">\u{1F575}</div>
            <h3>Marshal's Dossier</h3>
            <p>Dark gritty aesthetic with attribute bar, compact layout, poker chip bennies tracker.</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));
  },

  closePrintModal() {
    const overlay = document.getElementById('printModalOverlay');
    if (overlay) overlay.remove();
  },

  printSheet(style) {
    this.closePrintModal();
    const data = this._buildCharacterData();
    let html = '';
    if (style === 1) html = this._generateSheet1(data);
    else if (style === 2) html = this._generateSheet2(data);
    else html = this._generateSheet3(data);

    const win = window.open('', '_blank');
    if (!win) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print.');
      return;
    }
    win.document.write(html);
    win.document.close();
    // Small delay to let styles render, then trigger print
    setTimeout(() => win.print(), 400);
  },

  // ------- STYLE 1: Classic Deadlands -------
  _generateSheet1(data) {
    const esc = (s) => this.escHtml(s);
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${esc(data.name)} - Character Sheet</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Rye&family=Cinzel:wght@400;700&family=IM+Fell+English:ital@0;1&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: letter; margin: 0.4in; }
  body {
    font-family: 'IM Fell English', 'Georgia', serif;
    background:
      radial-gradient(ellipse at 15% 85%, rgba(120,80,30,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 15%, rgba(100,70,25,0.05) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(160,130,80,0.03) 0%, transparent 70%),
      radial-gradient(circle at 30% 20%, rgba(90,60,20,0.04) 0%, transparent 25%),
      radial-gradient(circle at 70% 75%, rgba(90,60,20,0.03) 0%, transparent 20%),
      radial-gradient(circle at 10% 10%, rgba(60,40,10,0.03) 0%, transparent 15%),
      radial-gradient(circle at 90% 90%, rgba(60,40,10,0.02) 0%, transparent 15%),
      linear-gradient(175deg, #f8eed0 0%, #f4e6c0 25%, #f9f0d4 50%, #f3e4be 75%, #f6ebc8 100%);
    color: #2a1f0e;
    padding: 0;
    font-size: 10pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    border: 3px solid #5c1a0a;
    padding: 0.35in 0.4in;
    position: relative;
    page-break-after: always;
    min-height: 9.2in;
  }
  .page:last-child { page-break-after: auto; }
  .page::before {
    content: '';
    position: absolute;
    top: 5px; left: 5px; right: 5px; bottom: 5px;
    border: 1.5px solid #8b6914;
    pointer-events: none;
    z-index: 0;
  }
  .page::after {
    content: '';
    position: absolute;
    top: 9px; left: 9px; right: 9px; bottom: 9px;
    border: 0.5px solid rgba(139,105,20,0.25);
    pointer-events: none;
    z-index: 0;
  }
  .page > * { position: relative; z-index: 1; }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Cinzel', serif;
    font-size: 8pt;
    color: #5c1a0a;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 2px solid #5c1a0a;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }
  .page-header .pg-name { font-family: 'Rye', serif; font-size: 10pt; letter-spacing: 3px; }
  .page-header .pg-label { font-size: 7pt; color: #8b7355; letter-spacing: 1px; }
  .sheet-title {
    text-align: center;
    font-family: 'Rye', 'Cinzel', serif;
    font-size: 28pt;
    color: #5c1a0a;
    text-shadow: 1px 1px 0 rgba(139,105,20,0.35), 2px 2px 5px rgba(0,0,0,0.12);
    padding-bottom: 2px;
    margin-bottom: 2px;
    text-transform: uppercase;
    letter-spacing: 6px;
  }
  .sheet-subtitle {
    text-align: center;
    font-size: 9.5pt;
    color: #6b4c2a;
    margin-bottom: 2px;
    font-style: italic;
    letter-spacing: 1px;
  }
  .sheet-subtitle::after {
    content: '\u2500\u2500\u2500\u2500 \u2726 \u269C \u2726 \u2500\u2500\u2500\u2500';
    display: block;
    text-align: center;
    color: #8b6914;
    font-size: 9pt;
    letter-spacing: 3px;
    margin: 5px auto 8px;
    font-style: normal;
    opacity: 0.65;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    border: 1.5px solid #5c1a0a;
    border-left: 4px solid #5c1a0a;
    padding: 6px 12px;
    margin-bottom: 8px;
    background: rgba(92,26,10,0.04);
  }
  .header-row span { font-size: 9pt; }
  .header-row strong { color: #5c1a0a; font-family: 'Cinzel', serif; font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
  .section {
    border: 1px solid #8b7355;
    padding: 6px 8px;
    margin-bottom: 8px;
    background: rgba(244,232,193,0.3);
  }
  .section-title {
    font-family: 'Rye', 'Cinzel', serif;
    font-size: 9.5pt;
    color: #5c1a0a;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 1.5px solid #8b6914;
    padding-bottom: 3px;
    margin-bottom: 5px;
  }
  .section-title::before {
    content: '\u2605 ';
    font-size: 8pt;
    color: #8b6914;
  }
  .attr-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    border-bottom: 1px dotted #c4a96a;
  }
  .attr-row:last-child { border-bottom: none; }
  .attr-name { font-weight: 700; }
  .attr-die { color: #5c1a0a; font-weight: 700; font-family: 'Cinzel', serif; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th {
    background: linear-gradient(180deg, #6b2a10 0%, #5c1a0a 100%);
    color: #f4e8c1;
    padding: 3px 6px;
    text-align: left;
    font-family: 'Rye', 'Cinzel', serif;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  td { padding: 2px 5px; border-bottom: 1px solid #c4a96a; }
  tr:nth-child(even) td { background: rgba(139,105,20,0.04); }
  .derived-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
    text-align: center;
  }
  .derived-box {
    border: 1.5px solid #5c1a0a;
    padding: 4px 2px;
    background: rgba(92,26,10,0.04);
    box-shadow: inset 0 0 10px rgba(139,105,20,0.08);
  }
  .derived-box .label { font-size: 7pt; text-transform: uppercase; font-family: 'Rye', 'Cinzel', serif; color: #6b4c2a; letter-spacing: 1px; }
  .derived-box .value { font-size: 15pt; font-weight: 700; color: #5c1a0a; font-family: 'Cinzel', serif; }
  .notes-area {
    border: 1px solid #8b7355;
    min-height: 55px;
    padding: 6px 8px;
    font-style: italic;
    color: #4a3520;
    background: rgba(244,232,193,0.2);
  }
  .footer {
    text-align: center;
    font-size: 7pt;
    color: #8b7355;
    margin-top: 6px;
    padding-top: 4px;
    letter-spacing: 1px;
  }
  .footer::before {
    content: '\u2500\u2500 \u2605 \u2500\u2500';
    display: block;
    text-align: center;
    color: #8b6914;
    font-size: 8pt;
    letter-spacing: 3px;
    margin-bottom: 4px;
    opacity: 0.5;
  }
</style></head><body>

<div class="page">
<div class="sheet-title">Deadlands</div>
<div class="sheet-subtitle">${esc(data.settingName)} \u2014 Savage Worlds Character Sheet</div>

<div class="header-row">
  <span><strong>Name:</strong> ${esc(data.name)}</span>
  <span><strong>Concept:</strong> ${esc(data.concept)}</span>
  <span><strong>Race:</strong> ${esc(data.raceName)}</span>
  <span><strong>Funds:</strong> $${data.funds.remaining}</span>
</div>

<div class="derived-grid">
  <div class="derived-box"><div class="label">Pace</div><div class="value">${data.stats.pace}</div></div>
  <div class="derived-box"><div class="label">Parry</div><div class="value">${data.stats.parry}</div></div>
  <div class="derived-box"><div class="label">Toughness</div><div class="value">${data.stats.toughness}${data.stats.armorBonus ? '(' + data.stats.armorBonus + ')' : ''}</div></div>
  <div class="derived-box"><div class="label">Size</div><div class="value">${data.stats.size}</div></div>
  <div class="derived-box"><div class="label">Run</div><div class="value">d${data.stats.runDie}</div></div>
</div>

<div class="two-col" style="margin-top:8px;">
  <div>
    <div class="section">
      <div class="section-title">Attributes</div>
      ${data.attributes.map(a => `<div class="attr-row"><span class="attr-name">${a.name}</span><span class="attr-die">d${a.die}</span></div>`).join('')}
    </div>
    <div class="section">
      <div class="section-title">Skills</div>
      ${data.skills.length > 0 ? data.skills.map(s => `<div class="attr-row"><span class="attr-name">${s.name}</span><span class="attr-die">d${s.die}</span></div>`).join('') : '<div style="color:#8b7355; font-style:italic;">No skills selected</div>'}
    </div>
  </div>
  <div>
    <div class="section">
      <div class="section-title">Hindrances</div>
      ${data.hindrances.length > 0 ? data.hindrances.map(h => `<div class="attr-row"><span>${h.name}</span><span style="font-size:8pt; color:#6b4c2a;">${h.type}</span></div>`).join('') : '<div style="color:#8b7355; font-style:italic;">None</div>'}
    </div>
    <div class="section">
      <div class="section-title">Edges</div>
      ${data.edges.length > 0 ? data.edges.map(e => `<div style="padding:2px 0; border-bottom:1px dotted #c4a96a;"><strong>${e.name}</strong>${e.summary ? ' \u2014 <span style="font-size:8pt; color:#6b4c2a;">' + esc(e.summary) + '</span>' : ''}</div>`).join('') : '<div style="color:#8b7355; font-style:italic;">None</div>'}
    </div>
  </div>
</div>
</div>

<div class="page">
<div class="page-header"><span class="pg-name">${esc(data.name)}</span><span class="pg-label">Page 2 \u2014 Continued</span></div>

<div class="section">
  <div class="section-title">Powers</div>
  <table>
    <tr><th style="width:4%;">#</th><th style="width:24%;">Power Name</th><th style="width:22%;">Trapping</th><th style="width:8%;">PP</th><th style="width:14%;">Range</th><th style="width:28%;">Notes</th></tr>
    ${(() => {
      const rows = [];
      const totalRows = Math.max(10, data.powers.length);
      for (let i = 0; i < totalRows; i++) {
        const p = data.powers[i];
        if (p) {
          rows.push('<tr><td>' + (i+1) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.trapping) + '</td><td>' + p.pp + '</td><td>' + (p.range || '\u2014') + '</td><td>' + (p.duration || '') + '</td></tr>');
        } else {
          rows.push('<tr><td>' + (i+1) + '</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>');
        }
      }
      return rows.join('\n    ');
    })()}
  </table>
  <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:8pt; color:#6b4c2a;">
    <span><strong>Power Points:</strong> ${data.arcaneBackground ? data.arcaneBackground.powerPoints : '___'} / ${data.arcaneBackground ? data.arcaneBackground.powerPoints : '___'}</span>
    <span><strong>Arcane Background:</strong> ${data.arcaneBackground ? esc(data.arcaneBackground.name) : '________________________'}</span>
  </div>
</div>

${data.languages.length > 0 ? `
<div class="section">
  <div class="section-title">Languages</div>
  <div style="display:flex; flex-wrap:wrap; gap:4px;">
    ${data.languages.map(l => `<span style="background:#f5e6c8; border:1px solid #c4a96a; border-radius:3px; padding:2px 6px; font-size:8pt; color:#3e2a14;"><strong>${esc(l.name)}</strong> <span style="color:#8b7355; font-style:italic;">(${esc(l.family)})</span></span>`).join('')}
  </div>
  <div style="font-size:7pt; color:#8b7355; margin-top:4px; font-style:italic;">Linguist: +2 to any dialect within the same language family</div>
</div>
` : ''}

<div class="footer">Created with Savage Master Character Creator &bull; Savage Worlds &copy; Pinnacle Entertainment Group</div>
</div>

<!-- Page 3: Gear & Equipment -->
<div class="page">
<div style="text-align:center; margin-bottom:8px;">
  <div style="font-size:14pt; font-weight:bold; color:#5c1a0a; border-bottom:2px solid #5c1a0a; padding-bottom:4px;">Gear &amp; Equipment</div>
</div>

<div class="section">
  <div class="section-title">Weapons</div>
  <table>
    <tr><th>Weapon</th><th>Damage</th><th>Range</th><th>AP</th><th>ROF</th><th>Notes</th></tr>
    ${(() => {
      const rows = [];
      const totalRows = Math.max(6, data.weapons.length + 6);
      for (let i = 0; i < totalRows; i++) {
        const w = data.weapons[i];
        if (w) {
          rows.push('<tr><td>' + esc(w.name) + '</td><td>' + (w.damage || '\u2014') + '</td><td>' + (w.range || '\u2014') + '</td><td>' + (w.ap || '\u2014') + '</td><td>' + (w.rof || '\u2014') + '</td><td style="font-size:8pt;">' + esc(w.notes || '') + '</td></tr>');
        } else {
          rows.push('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>');
        }
      }
      return rows.join('\n    ');
    })()}
  </table>
</div>

<div class="section">
  <div class="section-title">Armor</div>
  <table>
    <tr><th>Armor</th><th>Armor Value</th><th>Notes</th></tr>
    ${(() => {
      const rows = [];
      const totalRows = Math.max(4, data.armor.length + 4);
      for (let i = 0; i < totalRows; i++) {
        const a = data.armor[i];
        if (a) {
          rows.push('<tr><td>' + esc(a.name) + '</td><td>' + (a.armor || '\u2014') + '</td><td style="font-size:8pt;">' + esc(a.notes || '') + '</td></tr>');
        } else {
          rows.push('<tr><td>&nbsp;</td><td></td><td></td></tr>');
        }
      }
      return rows.join('\n    ');
    })()}
  </table>
</div>

<div class="section">
  <div class="section-title">Gear &amp; Supplies</div>
  <table>
    <tr><th>Item</th><th>Qty</th><th>Notes</th></tr>
    ${(() => {
      const rows = [];
      const totalRows = Math.max(6, data.mundane.length + 6);
      for (let i = 0; i < totalRows; i++) {
        const g = data.mundane[i];
        if (g) {
          rows.push('<tr><td>' + esc(g.name) + '</td><td>' + (g.qty || 1) + '</td><td style="font-size:8pt;">' + esc(g.notes || '') + '</td></tr>');
        } else {
          rows.push('<tr><td>&nbsp;</td><td></td><td></td></tr>');
        }
      }
      return rows.join('\n    ');
    })()}
  </table>
</div>

<div class="section">
  <div class="section-title">Notes</div>
  <div class="notes-area" style="min-height:120px; position:relative;">
    ${data.notes ? esc(data.notes) : '&nbsp;'}
    <div style="position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none;">
      ${Array.from({length: 8}, (_, i) => '<div style="border-bottom:1px solid rgba(92,26,10,0.15); height:15px;"></div>').join('')}
    </div>
  </div>
</div>

<div class="footer">Created with Savage Master Character Creator &bull; Savage Worlds &copy; Pinnacle Entertainment Group</div>
</div>
</body></html>`;
  },

  // ------- STYLE 2: Frontier Record -------
  _generateSheet2(data) {
    const esc = (s) => this.escHtml(s);

    // Group skills by linked attribute
    const skillsByAttr = {};
    data.skills.forEach(s => {
      if (!skillsByAttr[s.attribute]) skillsByAttr[s.attribute] = [];
      skillsByAttr[s.attribute].push(s);
    });

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${esc(data.name)} - Frontier Record</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Rye&family=Lora:ital,wght@0,400;0,700;1,400&family=Cinzel+Decorative:wght@700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: letter; margin: 0.4in; }
  body {
    font-family: 'Lora', 'Georgia', serif;
    background:
      radial-gradient(ellipse at 25% 75%, rgba(107,58,31,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 75% 25%, rgba(120,80,30,0.03) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(155,122,79,0.02) 0%, transparent 60%),
      radial-gradient(circle at 85% 85%, rgba(80,50,20,0.03) 0%, transparent 20%),
      radial-gradient(circle at 15% 15%, rgba(80,50,20,0.02) 0%, transparent 18%),
      linear-gradient(168deg, #f6ecda 0%, #f0e4cc 20%, #f7eddc 45%, #eee2c8 70%, #f5ebd8 100%);
    color: #1a1209;
    padding: 0;
    font-size: 9.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    border: 3px solid #6b3a1f;
    padding: 0.3in 0.35in;
    position: relative;
    page-break-after: always;
    min-height: 9.2in;
  }
  .page:last-child { page-break-after: auto; }
  .page::before {
    content: '';
    position: absolute;
    top: 5px; left: 5px; right: 5px; bottom: 5px;
    border: 1.5px solid #9b7a4f;
    pointer-events: none;
    z-index: 0;
  }
  .page::after {
    content: '';
    position: absolute;
    top: 9px; left: 9px; right: 9px; bottom: 9px;
    border: 0.5px solid rgba(107,58,31,0.2);
    pointer-events: none;
    z-index: 0;
  }
  .page > * { position: relative; z-index: 1; }
  .corner { position: absolute; color: #6b3a1f; font-size: 14pt; opacity: 0.5; line-height: 1; z-index: 1; }
  .corner-tl { top: 12px; left: 14px; }
  .corner-tr { top: 12px; right: 14px; }
  .corner-bl { bottom: 12px; left: 14px; }
  .corner-br { bottom: 12px; right: 14px; }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Rye', serif;
    font-size: 8pt;
    color: #6b3a1f;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 2px solid #6b3a1f;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }
  .page-header .pg-name { font-size: 10pt; letter-spacing: 3px; }
  .page-header .pg-label { font-size: 7pt; color: #9b7a4f; letter-spacing: 1px; }
  .title {
    text-align: center;
    font-family: 'Rye', serif;
    font-size: 24pt;
    color: #6b3a1f;
    letter-spacing: 5px;
    text-transform: uppercase;
    margin-bottom: 2px;
    text-shadow: 1px 1px 0 rgba(155,122,79,0.3), 0 0 20px rgba(107,58,31,0.05);
  }
  .subtitle {
    text-align: center;
    font-style: italic;
    color: #7a5c3a;
    font-size: 9pt;
    margin-bottom: 2px;
    padding-bottom: 4px;
  }
  .subtitle::after {
    content: '\u2501\u2501\u2501 \u25C6 \u2501\u2501\u2501';
    display: block;
    text-align: center;
    color: #6b3a1f;
    font-size: 9pt;
    letter-spacing: 3px;
    margin: 5px auto 8px;
    font-style: normal;
    opacity: 0.55;
  }
  .info-bar {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .info-item {
    border-bottom: 1.5px solid #6b3a1f;
    padding: 2px 0;
  }
  .info-label { font-size: 7pt; text-transform: uppercase; color: #7a5c3a; font-weight: 700; font-family: 'Rye', serif; letter-spacing: 1px; }
  .info-value { font-size: 10pt; font-weight: 700; }
  .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .section {
    border: 1.5px solid #6b3a1f;
    padding: 6px 8px;
    margin-bottom: 6px;
    background: rgba(237,224,200,0.3);
  }
  .sec-title {
    font-family: 'Rye', serif;
    font-size: 9pt;
    color: #6b3a1f;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 1.5px solid #9b7a4f;
    padding-bottom: 2px;
    margin-bottom: 4px;
  }
  .sec-title::before {
    content: '\u25C8 ';
    font-size: 7pt;
    color: #9b7a4f;
  }
  .attr-block { margin-bottom: 6px; }
  .attr-header {
    font-family: 'Rye', serif;
    font-size: 8pt;
    color: #f4e8c1;
    background: linear-gradient(90deg, #6b3a1f 0%, #8b5a3f 100%);
    padding: 2px 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    justify-content: space-between;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  .skill-line {
    display: flex;
    justify-content: space-between;
    padding: 1px 6px;
    border-bottom: 1px dotted #c4a96a;
    font-size: 9pt;
  }
  .skill-die { font-weight: 700; color: #6b3a1f; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th {
    background: linear-gradient(180deg, #7b4a2f 0%, #6b3a1f 100%);
    color: #ede0c8;
    padding: 2px 5px;
    text-align: left;
    font-family: 'Rye', serif;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  td { padding: 2px 4px; border-bottom: 1px solid #c4a96a; }
  tr:nth-child(even) td { background: rgba(107,58,31,0.03); }
  .wound-track { display: flex; gap: 6px; align-items: center; margin: 4px 0; }
  .wound-label { font-family: 'Rye', serif; font-size: 7pt; text-transform: uppercase; color: #7a5c3a; min-width: 50px; }
  .wound-boxes { display: flex; gap: 3px; }
  .wound-box {
    width: 16px;
    height: 16px;
    border: 1.5px solid #6b3a1f;
    background: transparent;
    box-shadow: inset 0 0 4px rgba(107,58,31,0.08);
  }
  .derived-bar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
    margin-bottom: 8px;
  }
  .d-box {
    text-align: center;
    border: 1.5px solid #6b3a1f;
    padding: 3px;
    background: rgba(107,58,31,0.05);
    box-shadow: inset 0 0 8px rgba(155,122,79,0.08);
  }
  .d-label { font-size: 7pt; text-transform: uppercase; font-family: 'Rye', serif; color: #7a5c3a; letter-spacing: 1px; }
  .d-val { font-size: 14pt; font-weight: 700; color: #6b3a1f; }
  .notes-box {
    border: 1px solid #9b7a4f;
    min-height: 50px;
    padding: 4px 6px;
    font-style: italic;
    color: #4a3520;
    background: rgba(237,224,200,0.2);
  }
  .footer {
    text-align: center;
    font-size: 7pt;
    color: #9b7a4f;
    margin-top: 6px;
  }
  .footer::before {
    content: '\u2500 \u25C6 \u2500';
    display: block;
    text-align: center;
    color: #9b7a4f;
    font-size: 8pt;
    letter-spacing: 3px;
    margin-bottom: 3px;
    opacity: 0.5;
  }
</style></head><body>

<div class="page">
  <span class="corner corner-tl">\u2726</span><span class="corner corner-tr">\u2726</span>
  <span class="corner corner-bl">\u2726</span><span class="corner corner-br">\u2726</span>
  <div class="title">Frontier Record</div>
  <div class="subtitle">${esc(data.settingName)} \u2022 Savage Worlds Adventure Edition</div>

  <div class="info-bar">
    <div class="info-item"><div class="info-label">Name</div><div class="info-value">${esc(data.name)}</div></div>
    <div class="info-item"><div class="info-label">Concept</div><div class="info-value">${esc(data.concept)}</div></div>
    <div class="info-item"><div class="info-label">Race</div><div class="info-value">${esc(data.raceName)}</div></div>
    <div class="info-item"><div class="info-label">Funds</div><div class="info-value">$${data.funds.remaining}</div></div>
  </div>

  <div class="derived-bar">
    <div class="d-box"><div class="d-label">Pace</div><div class="d-val">${data.stats.pace}</div></div>
    <div class="d-box"><div class="d-label">Parry</div><div class="d-val">${data.stats.parry}</div></div>
    <div class="d-box"><div class="d-label">Toughness</div><div class="d-val">${data.stats.toughness}${data.stats.armorBonus ? '(' + data.stats.armorBonus + ')' : ''}</div></div>
    <div class="d-box"><div class="d-label">Size</div><div class="d-val">${data.stats.size}</div></div>
    <div class="d-box"><div class="d-label">Run</div><div class="d-val">d${data.stats.runDie}</div></div>
  </div>

  <div class="main-grid">
    <div>
      <div class="section">
        <div class="sec-title">Attributes &amp; Skills</div>
        ${data.attributes.map(a => {
          const attrSkills = skillsByAttr[a.name] || [];
          return `<div class="attr-block">
            <div class="attr-header"><span>${a.name}</span><span>d${a.die}</span></div>
            ${attrSkills.map(s => `<div class="skill-line"><span>${s.name}</span><span class="skill-die">d${s.die}</span></div>`).join('')}
            ${attrSkills.length === 0 ? '<div class="skill-line" style="color:#9b7a4f; font-style:italic;"><span>\u2014</span></div>' : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div>
      <div class="section">
        <div class="sec-title">Hindrances</div>
        ${data.hindrances.length > 0 ? data.hindrances.map(h => `<div class="skill-line"><span>${h.name}</span><span style="font-size:8pt; color:#7a5c3a;">${h.type}</span></div>`).join('') : '<div style="color:#9b7a4f; font-style:italic;">None</div>'}
      </div>
      <div class="section">
        <div class="sec-title">Edges</div>
        ${data.edges.length > 0 ? data.edges.map(e => `<div style="padding:1px 0; border-bottom:1px dotted #c4a96a; font-size:9pt;"><strong>${e.name}</strong>${e.summary ? ' \u2014 <span style="font-size:7.5pt; color:#7a5c3a;">' + esc(e.summary) + '</span>' : ''}</div>`).join('') : '<div style="color:#9b7a4f; font-style:italic;">None</div>'}
      </div>
      <div class="section">
        <div class="sec-title">Wounds</div>
        <div class="wound-track"><span class="wound-label">Wounds</span><div class="wound-boxes"><div class="wound-box"></div><div class="wound-box"></div><div class="wound-box"></div></div><span style="font-size:7pt; color:#7a5c3a; margin-left:4px;">Incap.</span></div>
        <div class="wound-track"><span class="wound-label">Fatigue</span><div class="wound-boxes"><div class="wound-box"></div><div class="wound-box"></div></div><span style="font-size:7pt; color:#7a5c3a; margin-left:4px;">Incap.</span></div>
      </div>
    </div>
  </div>
</div>

<div class="page">
  <div class="page-header"><span class="pg-name">${esc(data.name)}</span><span class="pg-label">Page 2 \u2014 Continued</span></div>

  <div class="section">
    <div class="sec-title">Arcane Powers</div>
    <table>
      <tr><th style="width:4%;">#</th><th style="width:24%;">Power</th><th style="width:22%;">Trapping</th><th style="width:8%;">PP</th><th style="width:14%;">Range</th><th style="width:28%;">Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(10, data.powers.length);
        for (let i = 0; i < totalRows; i++) {
          const p = data.powers[i];
          if (p) {
            rows.push('<tr><td>' + (i+1) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.trapping) + '</td><td>' + p.pp + '</td><td>' + (p.range || '\u2014') + '</td><td>' + (p.duration || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>' + (i+1) + '</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
    <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:7.5pt; color:#7a5c3a;">
      <span><strong>Power Points:</strong> ${data.arcaneBackground ? data.arcaneBackground.powerPoints : '___'} / ${data.arcaneBackground ? data.arcaneBackground.powerPoints : '___'}</span>
      <span><strong>Arcane Background:</strong> ${data.arcaneBackground ? esc(data.arcaneBackground.name) : '________________________'}</span>
    </div>
  </div>

  ${data.languages.length > 0 ? `
  <div class="section">
    <div class="sec-title">Tongues &amp; Dialects</div>
    <div style="display:flex; flex-wrap:wrap; gap:4px;">
      ${data.languages.map(l => `<span style="background:#faf0dc; border:1px solid #c4a96a; border-radius:3px; padding:2px 8px; font-size:8pt; color:#3e2a14; font-family:'Lora',serif;"><strong>${esc(l.name)}</strong> <span style="color:#9b7a4f; font-style:italic;">(${esc(l.family)})</span></span>`).join('')}
    </div>
    <div style="font-size:7pt; color:#9b7a4f; margin-top:4px; font-style:italic; font-family:'Lora',serif;">Linguist Edge: +2 to any dialect within the same language family</div>
  </div>
  ` : ''}

  <div class="footer">Created with Savage Master Character Creator &bull; Savage Worlds &copy; Pinnacle Entertainment Group</div>
</div>

<!-- Page 3: Gear & Equipment -->
<div class="page">
<div style="text-align:center; margin-bottom:8px;">
  <div style="font-size:14pt; font-weight:bold; color:#6b3a1f; border-bottom:2px solid #6b3a1f; padding-bottom:4px; font-family:'Rye',cursive;">Gear &amp; Equipment</div>
</div>

  <div class="section">
    <div class="sec-title">Shootin' Irons &amp; Weapons</div>
    <table>
      <tr><th>Weapon</th><th>Damage</th><th>Range</th><th>AP</th><th>ROF</th><th>Shots</th><th>Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(6, data.weapons.length + 6);
        for (let i = 0; i < totalRows; i++) {
          const w = data.weapons[i];
          if (w) {
            rows.push('<tr><td>' + esc(w.name) + '</td><td>' + (w.damage || '\u2014') + '</td><td>' + (w.range || '\u2014') + '</td><td>' + (w.ap || '\u2014') + '</td><td>' + (w.rof || '\u2014') + '</td><td>' + (w.shots || '\u2014') + '</td><td style="font-size:7.5pt;">' + esc(w.notes || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
  </div>

  <div class="section">
    <div class="sec-title">Armor</div>
    <table>
      <tr><th>Armor</th><th>Value</th><th>Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(4, data.armor.length + 4);
        for (let i = 0; i < totalRows; i++) {
          const a = data.armor[i];
          if (a) {
            rows.push('<tr><td>' + esc(a.name) + '</td><td>' + (a.armor || '\u2014') + '</td><td style="font-size:7.5pt;">' + esc(a.notes || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>&nbsp;</td><td></td><td></td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
  </div>

  <div class="section">
    <div class="sec-title">Gear &amp; Sundries</div>
    <table>
      <tr><th>Item</th><th>Qty</th><th>Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(6, data.mundane.length + 6);
        for (let i = 0; i < totalRows; i++) {
          const g = data.mundane[i];
          if (g) {
            rows.push('<tr><td>' + esc(g.name) + '</td><td>' + (g.qty || 1) + '</td><td style="font-size:7.5pt;">' + esc(g.notes || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>&nbsp;</td><td></td><td></td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
  </div>

  <div class="section">
    <div class="sec-title">Notes</div>
    <div class="notes-box" style="min-height:120px; position:relative;">
      ${data.notes ? esc(data.notes) : '&nbsp;'}
      <div style="position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none;">
        ${Array.from({length: 8}, (_, i) => '<div style="border-bottom:1px solid rgba(107,58,31,0.15); height:15px;"></div>').join('')}
      </div>
    </div>
  </div>

  <div class="footer">Created with Savage Master Character Creator &bull; Savage Worlds &copy; Pinnacle Entertainment Group</div>
</div>
</body></html>`;
  },

  // ------- STYLE 3: Marshal's Dossier -------
  _generateSheet3(data) {
    const esc = (s) => this.escHtml(s);

    // Build attribute bubble display
    const dieSizes = [4, 6, 8, 10, 12];

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${esc(data.name)} - Marshal's Dossier</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Oswald:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: letter; margin: 0.4in; }
  body {
    font-family: 'Special Elite', 'Courier New', monospace;
    background:
      radial-gradient(ellipse at 70% 20%, rgba(120,100,60,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 25% 75%, rgba(100,80,40,0.05) 0%, transparent 45%),
      radial-gradient(circle at 80% 80%, rgba(80,60,30,0.04) 0%, transparent 25%),
      radial-gradient(circle at 15% 25%, rgba(90,70,35,0.03) 0%, transparent 20%),
      linear-gradient(160deg, #e8ddc0 0%, #e0d5b4 30%, #e4daba 60%, #ddd2b0 100%);
    color: #1a1209;
    padding: 0;
    font-size: 9.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    background:
      radial-gradient(circle at 75% 15%, rgba(80,60,30,0.04) 0%, transparent 30%),
      radial-gradient(circle at 20% 80%, rgba(90,70,35,0.03) 0%, transparent 25%),
      linear-gradient(135deg, #ddd0aa 0%, #d2c4a0 35%, #d8cca8 65%, #d0c49e 100%);
    border: 2px solid #3d2b1a;
    padding: 0.3in 0.35in;
    position: relative;
    page-break-after: always;
    min-height: 9.2in;
    box-shadow: 2px 3px 12px rgba(0,0,0,0.15), inset 0 0 30px rgba(61,43,26,0.05);
  }
  .page:last-child { page-break-after: auto; }
  .page::after {
    content: '';
    position: absolute;
    top: 8px; left: 8px; right: 8px; bottom: 8px;
    border: 1px dashed rgba(61,43,26,0.15);
    pointer-events: none;
    z-index: 0;
  }
  .page > * { position: relative; z-index: 1; }
  .watermark {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-family: 'Oswald', sans-serif;
    font-size: 52pt;
    font-weight: 700;
    color: rgba(139,30,30,0.05);
    letter-spacing: 12px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 0;
  }
  .stamp {
    position: absolute;
    top: 10px;
    right: 14px;
    font-family: 'Oswald', sans-serif;
    font-size: 9pt;
    font-weight: 700;
    color: rgba(139,30,30,0.35);
    border: 2px solid rgba(139,30,30,0.35);
    padding: 2px 8px;
    text-transform: uppercase;
    letter-spacing: 3px;
    transform: rotate(8deg);
    pointer-events: none;
    z-index: 1;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Oswald', sans-serif;
    font-size: 8pt;
    font-weight: 600;
    color: #3d2b1a;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 2px solid #3d2b1a;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }
  .page-header .pg-name { font-size: 10pt; letter-spacing: 3px; }
  .page-header .pg-label { font-size: 7pt; color: #6b5a3a; letter-spacing: 1px; }
  .d-title {
    font-family: 'Oswald', sans-serif;
    font-size: 20pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 8px;
    color: #3d2b1a;
    text-align: center;
    border-bottom: 3px solid #3d2b1a;
    padding-bottom: 4px;
    margin-bottom: 3px;
    text-shadow: 0 1px 0 rgba(201,184,138,0.5);
  }
  .d-sub {
    text-align: center;
    font-size: 8pt;
    color: #6b5a3a;
    margin-bottom: 2px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .d-sub::after {
    content: '\u2500\u2500 \u2605 \u2500\u2500';
    display: block;
    text-align: center;
    color: #6b5a3a;
    font-size: 8pt;
    letter-spacing: 3px;
    margin: 4px auto 6px;
    opacity: 0.4;
  }
  .id-row {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .id-field {
    border-bottom: 1.5px solid #3d2b1a;
    padding: 2px 0;
  }
  .id-label { font-family: 'Oswald', sans-serif; font-size: 7pt; text-transform: uppercase; color: #6b5a3a; letter-spacing: 1px; }
  .id-value { font-size: 10pt; }
  .attr-bar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #3d2b1a 0%, #4a3520 50%, #3d2b1a 100%);
    padding: 8px;
    border: 1px solid #2a1c0e;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  }
  .attr-cell { text-align: center; }
  .attr-cell-name {
    font-family: 'Oswald', sans-serif;
    font-size: 7pt;
    text-transform: uppercase;
    color: #c9b88a;
    letter-spacing: 1px;
    margin-bottom: 3px;
  }
  .bubble-row { display: flex; justify-content: center; gap: 3px; }
  .bubble {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1.5px solid #c9b88a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 6pt;
    color: #c9b88a;
  }
  .bubble.filled { background: #c9b88a; color: #3d2b1a; font-weight: 700; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .section {
    border: 1px solid #6b5a3a;
    padding: 5px 7px;
    margin-bottom: 6px;
    background: rgba(201,184,138,0.1);
  }
  .sec-head {
    font-family: 'Oswald', sans-serif;
    font-size: 9pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #3d2b1a;
    border-bottom: 1.5px solid #6b5a3a;
    padding-bottom: 2px;
    margin-bottom: 4px;
  }
  .sec-head::before {
    content: '\u25A0 ';
    font-size: 6pt;
    color: #6b5a3a;
    vertical-align: 1px;
  }
  .s-row {
    display: flex;
    justify-content: space-between;
    padding: 1px 0;
    border-bottom: 1px dotted #a0906a;
    font-size: 9pt;
  }
  .s-row:last-child { border-bottom: none; }
  .s-die { font-weight: 700; color: #3d2b1a; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th {
    background: linear-gradient(180deg, #4a3520 0%, #3d2b1a 100%);
    color: #c9b88a;
    padding: 2px 4px;
    text-align: left;
    font-family: 'Oswald', sans-serif;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  td { padding: 2px 4px; border-bottom: 1px solid #a0906a; }
  tr:nth-child(even) td { background: rgba(61,43,26,0.04); }
  .derived-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }
  .dv-box {
    text-align: center;
    border: 1.5px solid #3d2b1a;
    padding: 3px;
    background: rgba(61,43,26,0.06);
    box-shadow: inset 0 0 6px rgba(61,43,26,0.05);
  }
  .dv-label { font-family: 'Oswald', sans-serif; font-size: 7pt; text-transform: uppercase; color: #6b5a3a; letter-spacing: 1px; }
  .dv-val { font-family: 'Oswald', sans-serif; font-size: 14pt; font-weight: 700; color: #3d2b1a; }
  .bennies {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0;
  }
  .bennies-label { font-family: 'Oswald', sans-serif; font-size: 7pt; text-transform: uppercase; color: #6b5a3a; }
  .chip {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #3d2b1a;
    background: rgba(61,43,26,0.06);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-size: 7pt;
    color: #6b5a3a;
    box-shadow: inset 0 0 4px rgba(61,43,26,0.1);
  }
  .currency-box {
    display: flex;
    gap: 12px;
    font-size: 9pt;
    margin: 4px 0;
  }
  .curr-item { display: flex; gap: 4px; align-items: center; }
  .curr-label { font-family: 'Oswald', sans-serif; font-size: 7pt; text-transform: uppercase; color: #6b5a3a; }
  .curr-val { font-weight: 700; color: #3d2b1a; }
  .notes-area {
    border: 1px solid #6b5a3a;
    min-height: 50px;
    padding: 4px 6px;
    color: #4a3520;
    background: rgba(201,184,138,0.08);
  }
  .footer {
    text-align: center;
    font-size: 7pt;
    color: #8b7a5a;
    margin-top: 6px;
  }
  .footer::before {
    content: '\u25A0 \u25A0 \u25A0';
    display: block;
    text-align: center;
    color: #6b5a3a;
    font-size: 5pt;
    letter-spacing: 6px;
    margin-bottom: 3px;
    opacity: 0.4;
  }
</style></head><body>

<div class="page">
  <div class="watermark">CLASSIFIED</div>
  <span class="stamp">File Active</span>
  <div class="d-title">Marshal's Dossier</div>
  <div class="d-sub">${esc(data.settingName)} \u2022 Savage Worlds</div>

  <div class="id-row">
    <div class="id-field"><div class="id-label">Subject</div><div class="id-value">${esc(data.name)}</div></div>
    <div class="id-field"><div class="id-label">Known As</div><div class="id-value">${esc(data.concept)}</div></div>
    <div class="id-field"><div class="id-label">Race</div><div class="id-value">${esc(data.raceName)}</div></div>
    <div class="id-field"><div class="id-label">Status</div><div class="id-value">Active</div></div>
  </div>

  <div class="attr-bar">
    ${data.attributes.map(a => `<div class="attr-cell">
      <div class="attr-cell-name">${a.name}</div>
      <div class="bubble-row">
        ${dieSizes.map(d => `<div class="bubble ${a.die >= d ? 'filled' : ''}">${d === 4 ? '4' : d === 6 ? '6' : d === 8 ? '8' : d === 10 ? '10' : '12'}</div>`).join('')}
      </div>
    </div>`).join('')}
  </div>

  <div class="derived-row">
    <div class="dv-box"><div class="dv-label">Pace</div><div class="dv-val">${data.stats.pace}</div></div>
    <div class="dv-box"><div class="dv-label">Parry</div><div class="dv-val">${data.stats.parry}</div></div>
    <div class="dv-box"><div class="dv-label">Toughness</div><div class="dv-val">${data.stats.toughness}${data.stats.armorBonus ? '(' + data.stats.armorBonus + ')' : ''}</div></div>
    <div class="dv-box"><div class="dv-label">Size</div><div class="dv-val">${data.stats.size}</div></div>
    <div class="dv-box"><div class="dv-label">Run</div><div class="dv-val">d${data.stats.runDie}</div></div>
  </div>

  <div class="two-col">
    <div>
      <div class="section">
        <div class="sec-head">Skills</div>
        ${data.skills.length > 0 ? data.skills.map(s => `<div class="s-row"><span>${s.name} <span style="font-size:7pt; color:#6b5a3a;">(${s.attribute.substring(0,3)})</span></span><span class="s-die">d${s.die}</span></div>`).join('') : '<div style="color:#8b7a5a; font-style:italic;">None</div>'}
      </div>
      <div class="section">
        <div class="sec-head">Hindrances</div>
        ${data.hindrances.length > 0 ? data.hindrances.map(h => `<div class="s-row"><span>${h.name}</span><span style="font-size:8pt; color:#6b5a3a;">${h.type}</span></div>`).join('') : '<div style="color:#8b7a5a; font-style:italic;">None</div>'}
      </div>
    </div>
    <div>
      <div class="section">
        <div class="sec-head">Edges</div>
        ${data.edges.length > 0 ? data.edges.map(e => `<div style="padding:1px 0; border-bottom:1px dotted #a0906a; font-size:9pt;"><strong>${e.name}</strong>${e.summary ? ' \u2014 <span style="font-size:7.5pt; color:#6b5a3a;">' + esc(e.summary) + '</span>' : ''}</div>`).join('') : '<div style="color:#8b7a5a; font-style:italic;">None</div>'}
      </div>
      <div class="section">
        <div class="sec-head">Bennies</div>
        <div class="bennies">
          <span class="bennies-label">Poker Chips:</span>
          <div class="chip">W</div>
          <div class="chip">W</div>
          <div class="chip">W</div>
        </div>
      </div>
      <div class="section">
        <div class="sec-head">Currency</div>
        <div class="currency-box">
          <div class="curr-item"><span class="curr-label">Starting:</span><span class="curr-val">$${data.funds.starting}</span></div>
          <div class="curr-item"><span class="curr-label">Remaining:</span><span class="curr-val">$${data.funds.remaining}</span></div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page">
  <div class="watermark">CLASSIFIED</div>
  <div class="page-header"><span class="pg-name">${esc(data.name)}</span><span class="pg-label">Page 2 \u2014 Continued</span></div>

  <div class="section">
    <div class="sec-head">Powers</div>
    <table>
      <tr><th style="width:4%;">#</th><th style="width:24%;">Power</th><th style="width:22%;">Trapping</th><th style="width:8%;">PP</th><th style="width:14%;">Range</th><th style="width:28%;">Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(10, data.powers.length);
        for (let i = 0; i < totalRows; i++) {
          const p = data.powers[i];
          if (p) {
            rows.push('<tr><td>' + (i+1) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.trapping) + '</td><td>' + p.pp + '</td><td>' + (p.range || '\u2014') + '</td><td>' + (p.duration || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>' + (i+1) + '</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
    <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:7.5pt; color:#6b5a3a;">
      <span><strong>Power Points:</strong> ${data.arcaneBackground ? data.arcaneBackground.powerPoints : '___'} / ${data.arcaneBackground ? data.arcaneBackground.powerPoints : '___'}</span>
      <span><strong>Arcane Background:</strong> ${data.arcaneBackground ? esc(data.arcaneBackground.name) : '________________________'}</span>
    </div>
  </div>

  ${data.languages.length > 0 ? `
  <div class="section">
    <div class="sec-head">Known Languages</div>
    <div style="display:flex; flex-wrap:wrap; gap:4px;">
      ${data.languages.map(l => `<span style="background:#2a2a2a; border:1px solid #555; border-radius:2px; padding:2px 8px; font-size:8pt; color:#e0d6c2; font-family:'Special Elite',cursive;"><strong>${esc(l.name)}</strong> <span style="color:#999; font-style:italic;">(${esc(l.family)})</span></span>`).join('')}
    </div>
    <div style="font-size:7pt; color:#888; margin-top:4px; font-style:italic; font-family:'Special Elite',cursive;">Linguist Edge — +2 to any dialect within the same language family</div>
  </div>
  ` : ''}

  <div class="footer">Created with Savage Master Character Creator &bull; Savage Worlds &copy; Pinnacle Entertainment Group</div>
</div>

<!-- Page 3: Gear & Equipment -->
<div class="page">
<div style="text-align:center; margin-bottom:8px;">
  <div style="font-family:'Oswald',sans-serif; font-size:14pt; font-weight:bold; color:#3d2b1a; letter-spacing:3px; text-transform:uppercase; border-bottom:2px solid #3d2b1a; padding-bottom:4px;">Gear &amp; Equipment</div>
</div>

  <div class="section">
    <div class="sec-head">Weapons</div>
    <table>
      <tr><th>Weapon</th><th>Damage</th><th>Range</th><th>AP</th><th>ROF</th><th>Shots</th><th>Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(6, data.weapons.length + 6);
        for (let i = 0; i < totalRows; i++) {
          const w = data.weapons[i];
          if (w) {
            rows.push('<tr><td>' + esc(w.name) + '</td><td>' + (w.damage || '\u2014') + '</td><td>' + (w.range || '\u2014') + '</td><td>' + (w.ap || '\u2014') + '</td><td>' + (w.rof || '\u2014') + '</td><td>' + (w.shots || '\u2014') + '</td><td style="font-size:7.5pt;">' + esc(w.notes || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
  </div>

  <div class="section">
    <div class="sec-head">Armor</div>
    <table>
      <tr><th>Armor</th><th>Value</th><th>Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(4, data.armor.length + 4);
        for (let i = 0; i < totalRows; i++) {
          const a = data.armor[i];
          if (a) {
            rows.push('<tr><td>' + esc(a.name) + '</td><td>' + (a.armor || '\u2014') + '</td><td style="font-size:7.5pt;">' + esc(a.notes || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>&nbsp;</td><td></td><td></td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
  </div>

  <div class="section">
    <div class="sec-head">Gear</div>
    <table>
      <tr><th>Item</th><th>Qty</th><th>Notes</th></tr>
      ${(() => {
        const rows = [];
        const totalRows = Math.max(6, data.mundane.length + 6);
        for (let i = 0; i < totalRows; i++) {
          const g = data.mundane[i];
          if (g) {
            rows.push('<tr><td>' + esc(g.name) + '</td><td>' + (g.qty || 1) + '</td><td style="font-size:7.5pt;">' + esc(g.notes || '') + '</td></tr>');
          } else {
            rows.push('<tr><td>&nbsp;</td><td></td><td></td></tr>');
          }
        }
        return rows.join('\n      ');
      })()}
    </table>
  </div>

  <div class="section">
    <div class="sec-head">Wounds</div>
    <div style="display:flex; gap:16px; align-items:center; margin:4px 0;">
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-family:'Oswald',sans-serif; font-size:7pt; text-transform:uppercase; color:#6b5a3a;">Head</span>
        <div style="display:flex; gap:2px;">
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-family:'Oswald',sans-serif; font-size:7pt; text-transform:uppercase; color:#6b5a3a;">Torso</span>
        <div style="display:flex; gap:2px;">
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-family:'Oswald',sans-serif; font-size:7pt; text-transform:uppercase; color:#6b5a3a;">Arms</span>
        <div style="display:flex; gap:2px;">
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-family:'Oswald',sans-serif; font-size:7pt; text-transform:uppercase; color:#6b5a3a;">Legs</span>
        <div style="display:flex; gap:2px;">
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-family:'Oswald',sans-serif; font-size:7pt; text-transform:uppercase; color:#6b5a3a;">Fatigue</span>
        <div style="display:flex; gap:2px;">
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
          <div style="width:14px; height:14px; border:1.5px solid #3d2b1a;"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="sec-head">Field Notes</div>
    <div class="notes-area" style="min-height:120px; position:relative;">
      ${data.notes ? esc(data.notes) : '&nbsp;'}
      <div style="position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none;">
        ${Array.from({length: 8}, (_, i) => '<div style="border-bottom:1px solid rgba(61,43,26,0.15); height:15px;"></div>').join('')}
      </div>
    </div>
  </div>

  <div class="footer">Created with Savage Master Character Creator &bull; Savage Worlds &copy; Pinnacle Entertainment Group</div>
</div>
</body></html>`;
  },

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------
  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};

window.savageMasterBridge = {
  getCharacter: () => app.character,
  loadBackup: backup => {
    app.character = app.parseCharacterBackup(backup);
    app.currentStep = 0;
    app.renderNav();
    app.renderContent();
    app.renderSummary();
  },
  newCharacter: () => app.resetCharacter(),
};

// Boot
document.addEventListener('DOMContentLoaded', () => app.init());

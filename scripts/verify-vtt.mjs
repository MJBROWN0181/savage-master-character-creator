// Run the official Roll20 JSON importer in isolation against our real exports.
// This does not replace an in-game test of Roll20's surrounding sheet workers.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sheetUrl = 'https://raw.githubusercontent.com/Roll20/roll20-character-sheets/master/Official%20Savage%20Worlds/SavageWorldsCharSheet.html';
const response = await fetch(sheetUrl);
if (!response.ok) throw new Error(`Sheet download failed: ${response.status}`);
const html = await response.text();
const start = html.indexOf('on("change:jsonimport",');
const end = html.indexOf('</script>', start);
if (start < 0 || end < 0) throw new Error('Official importer not found; review upstream changes.');
const importer = html.slice(start, end);

let checks = 0;
for (const setting of [null, 'deadlands', 'rifts', 'pirates', 'pathfinder']) {
  const context = vm.createContext({ document: { addEventListener() {} }, window: {}, console });
  for (const file of ['data.js', 'settings.js', 'app.js']) vm.runInContext(readFileSync(file, 'utf8'), context);
  const app = vm.runInContext('app', context);
  app.escHtml = value => String(value || '');
  app.character.setting = setting;
  app.character.name = `VTT test ${setting || 'core'}`;
  app.character.concept = 'Test hero';
  app.character.race = app.getRaces()[0].id;
  app.character.attributes.vigor = 8;
  app.character.skills.fighting = 6;
  app.character.hindrances = ['arrogant'];
  app.character.edges = ['abMagic'];
  app.character.powers = [{ id: 'bolt', trapping: 'Lightning' }];
  app.character.gear = [
    { name: 'Sword', damage: 'Str+d6', cost: 100, weight: 3, qty: 2 },
    { name: 'Coat', armor: 2, coverage: 'Torso, Arms', cost: 50, weight: 4 },
    { name: 'Helmet', armor: 1, coverage: 'Head', cost: 25, weight: 1 },
    { name: 'Shield', parryBonus: 2, cost: 50, weight: 4 },
    { name: 'Rope', qty: 2, weight: 1, cost: 5 },
  ];
  let exported;
  app._downloadJSON = data => { exported = JSON.parse(JSON.stringify(data)); };
  app.exportRoll20();
  let handler;
  let rows = 0;
  const imported = {};
  const importerContext = vm.createContext({
    console: { log() {} }, log() {},
    on: (_, callback) => { handler = callback; },
    generateRowID: () => `row${++rows}`,
    setAttrs: attrs => Object.assign(imported, attrs),
  });
  vm.runInContext(importer, importerContext, { timeout: 1000 });
  handler({ newValue: JSON.stringify(exported) });
  assert.equal(imported.character_name, app.character.name);
  assert.equal(imported.vigor, 8);
  assert.equal(imported.fighting, 6);
  assert.equal(imported.pace, app.getDerivedStats().pace);
  assert.equal(imported.parryMod, 2);
  assert.ok(Object.entries(imported).some(([key, value]) => key.endsWith('_weapon') && value === 'Sword (x2)'));
  assert.ok(Object.entries(imported).some(([key, value]) => key.endsWith('_hindrance') && value === 'Arrogant'));
  assert.ok(Object.entries(imported).some(([key, value]) => key.endsWith('_item') && value === 'Shield'));
  assert.ok(Object.entries(imported).some(([key, value]) => key.endsWith('_power') && value === 'Bolt'));
  assert.equal(imported.PowerPoints_max, app.getPowerBudget().powerPoints);
  assert.ok(!Object.values(imported).some(value => value === undefined || Number.isNaN(value)));
  checks++;

  app.exportFoundryVTT();
  assert.equal(exported.system.pace.ground, app.getDerivedStats().pace);
  assert.equal(exported.system.pace.running.die, app.getDerivedStats().runDie);
  assert.equal(exported.system.powerPoints.general.max, app.getPowerBudget().powerPoints);
  assert.equal(exported.system.stats.parry.value, app.getDerivedStats().parry);
  assert.equal(exported.system.stats.toughness.value, app.getDerivedStats().toughness + app.getDerivedStats().armorBonus);
  assert.equal(exported.system.details.autoCalcParry, false);
  assert.ok(exported.items.filter(item => item.type === 'edge').every(item => Array.isArray(item.system.requirements)));
  assert.equal(exported.items.find(item => item.name === 'Helmet').system.locations.head, true);
  assert.equal(exported.items.find(item => item.name === 'Helmet').system.locations.torso, false);
  assert.equal(exported.items.find(item => item.name === 'Shield').system.equipStatus, 3);
  checks++;
}
console.log(`${checks} export checks passed: official Roll20 importer execution and Foundry field checks across core plus four settings.`);
console.log('Actual game import and Foundry runtime validation remain separate tests.');

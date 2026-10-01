import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function makeApp(saved = null) {
  const storage = new Map(saved ? [['savage-master-character-v1', saved]] : []);
  const context = vm.createContext({
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    document: { addEventListener() {} }, window: {}, console, confirm: () => true,
  });
  for (const file of ['data.js', 'settings.js', 'app.js']) vm.runInContext(readFileSync(file, 'utf8'), context);
  return { app: vm.runInContext('app', context), storage };
}

test('changing ancestry and heritage replaces free raises while keeping purchased raises', () => {
  const { app } = makeApp();
  app.renderContent = app.renderSummary = () => {};
  app.selectRace('elf');
  assert.equal(app.character.attributes.agility, 6);
  app.character.attributes.agility = 8;
  app.selectRace('human');
  assert.equal(app.character.attributes.agility, 6);
  app.selectRace('halfElf');
  assert.equal(app.validateStep(2).valid, false);
  app.selectHeritage('agile');
  assert.equal(app.character.attributes.agility, 8);
  assert.equal(app.validateStep(2).valid, true);
  app.selectHeritage('adaptable');
  assert.equal(app.character.attributes.agility, 6);
});

test('changing setting removes old ancestry bonuses', () => {
  const { app } = makeApp();
  app.renderContent = app.renderSummary = () => {};
  app.selectRace('elf');
  app.selectSetting('deadlands');
  assert.equal(app.character.attributes.agility, 4);
});

test('carrying multiple shields uses the best Parry bonus once', () => {
  const { app } = makeApp();
  app.character.skills.fighting = 6;
  app.character.gear = [{ parryBonus: 1, qty: 3 }, { parryBonus: 2 }];
  assert.equal(app.getDerivedStats().parry, 7);
});

test('hindrance allocations cannot exceed earned points', () => {
  const { app } = makeApp();
  app.character.hindrancePointsSpent.edges = 1;
  assert.equal(app.validateStep(3).valid, false);
});

test('local draft restores after refresh and reset replaces it', () => {
  const { app, storage } = makeApp();
  app.character.name = 'Sage';
  app.character.notes = 'A ranger';
  app.saveCharacter();
  const restored = makeApp(storage.get('savage-master-character-v1'));
  restored.app.renderNav = () => {};
  restored.app.goToStep = () => {};
  restored.app.init();
  assert.equal(restored.app.character.name, 'Sage');
  assert.equal(restored.app.character.notes, 'A ranger');
  restored.app.resetCharacter();
  assert.equal(JSON.parse(restored.storage.get('savage-master-character-v1')).character.name, '');
});

test('editable backup round trips and rejects unrelated or malformed files', () => {
  const { app } = makeApp();
  app.character.name = 'Captain';
  app.character.setting = 'deadlands';
  const backup = JSON.parse(JSON.stringify({ version: 1, character: app.character }));
  assert.equal(app.parseCharacterBackup(backup).setting, 'deadlands');
  assert.throws(() => app.parseCharacterBackup({ name: 'summary' }), /backup/);
  backup.character.attributes.vigor = -1;
  assert.throws(() => app.parseCharacterBackup(backup), /attributes/);
});

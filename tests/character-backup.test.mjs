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

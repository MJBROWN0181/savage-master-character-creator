import React from 'react';
export const officialProducts = {
  dnd5e: { name: 'Dungeons & Dragons', publisher: 'Wizards of the Coast LLC', url: 'https://marketplace.dndbeyond.com/', label: 'Shop official D&D books & accessories' },
  savageWorlds: { name: 'Savage Worlds', publisher: 'Pinnacle Entertainment Group', url: 'https://shop.peginc.com/pages/new-to-savage-worlds', label: 'Shop official Savage Worlds books & accessories' },
  pathfinder2e: { name: 'Pathfinder', publisher: 'Paizo Inc.', url: 'https://store.paizo.com/pathfinder/', label: 'Shop official Pathfinder books & accessories' },
};
export function OfficialProducts({ system }) {
  const p = officialProducts[system];
  return <aside className="official-products"><strong>Support the creators of {p.name}</strong><p>{p.name} game content belongs to {p.publisher} and its licensors. Buy official rulebooks, supplements, and accessories to support their work. Savage Master is an independent companion and does not replace the official books.</p><a href={p.url} target="_blank" rel="noopener noreferrer">{p.label} ↗</a><p><a href="/legal#publishers">Publisher credits &amp; content licenses</a></p></aside>;
}

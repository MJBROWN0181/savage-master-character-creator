import React from 'react';
import {createRoot} from 'react-dom/client';
import {CardArt} from './character-cards.jsx';
import './create.css';

const games = [
  {id:'savage', name:'Savage Worlds', edition:'Adventure Edition', start:'Start with a setting.', href:'/?game=savage&create=1', sigil:'☆'},
  {id:'dnd5e', name:'Dungeons & Dragons', edition:'Fifth edition, revised 2024 rules', start:'Start with a species.', href:'/dnd?create=1', sigil:'✧'},
  {id:'pathfinder2e', name:'Pathfinder', edition:'Second edition, remastered rules', start:'Start with an ancestry.', href:'/pathfinder?create=1', sigil:'◇', preview:true},
];

export function CreateCharacter() {
  return <main className="create-landing" aria-labelledby="create-title">
    <header className="create-heading">
      <h1 id="create-title">Create a character</h1>
      <p>Choose the rules your group uses. We’ll take it one choice at a time.</p>
    </header>
    <ul className="game-deck" aria-label="Available games">
      {games.map(game => <li key={game.id}>
        <a className="tarot-card game-tarot" href={game.href} aria-labelledby={`${game.id}-title`} aria-describedby={`${game.id}-edition ${game.id}-start${game.preview ? ` ${game.id}-status` : ''}`}>
          <CardArt type="games" id={game.id} sigil={game.sigil}/>
          <div className="tarot-caption">
            <h2 id={`${game.id}-title`}>{game.name}</h2>
            <p className="game-edition" id={`${game.id}-edition`}>{game.edition}</p>
            <p className="game-start" id={`${game.id}-start`}>{game.start}</p>
            <div className="game-entry">
              <span className="game-choose">Choose game</span>
              {game.preview && <span className="game-preview" id={`${game.id}-status`}>Preview</span>}
            </div>
          </div>
        </a>
      </li>)}
    </ul>
  </main>;
}
const root=import.meta.hot?.data.root??createRoot(document.getElementById('createRoot'));if(import.meta.hot)import.meta.hot.data.root=root;root.render(<CreateCharacter/>);

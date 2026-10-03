import React from 'react';
import {createRoot} from 'react-dom/client';
import {CardArt} from './character-cards.jsx';
import './campaigns.css';
const games=[{id:'savage',name:'Savage Worlds',subtitle:'Choose your world. Find your hero.',href:'/?game=savage&create=1',sigil:'☆'},{id:'dnd5e',name:'Dungeons & Dragons',subtitle:'Fifth edition · Revised 2024 rules',href:'/dnd?create=1',sigil:'✧'},{id:'pathfinder2e',name:'Pathfinder',subtitle:'Second edition · Remastered',href:'/pathfinder?create=1',sigil:'◇'}];
export function CreateCharacter(){return <main className="create-landing"><header><small>YOUR NEXT ADVENTURE</small><h1>Create a character</h1><p>Choose your game. We’ll take it one choice at a time.</p></header><div className="game-deck">{games.map((game,i)=><a className="tarot-card game-tarot" href={game.href} key={game.id}><CardArt type="games" id={game.id} sigil={game.sigil}/><span className="tarot-caption"><small>{['I','II','III'][i]}</small><strong>{game.name}</strong><span>{game.subtitle}</span><b>Choose this game <span aria-hidden="true">→</span></b></span></a>)}</div></main>;}
const root=import.meta.hot?.data.root??createRoot(document.getElementById('createRoot'));if(import.meta.hot)import.meta.hot.data.root=root;root.render(<CreateCharacter/>);

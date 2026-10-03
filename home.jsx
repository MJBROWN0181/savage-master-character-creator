import './character-cards.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './home.css';

export function Home() {
  return <main className="sm-home" aria-label="Savage Master">
    <div className="home-welcome">
      <div className="home-logo">
        <img src="/logo.png" alt="Savage Master" width="2000" height="2000" fetchPriority="high" />
      </div>
      <div className="home-actions">
        <a className="home-primary" href="/profile?entry=signUp">Begin Your Adventure</a>
        <a className="home-secondary" href="/profile?entry=signIn">Already On One</a>
      </div>
      <a className="home-create" href="/create">Create a character</a>
      <p className="home-slogan">Your character. Your table. Your story.</p>
    </div>
  </main>;
}

if (window.savageMasterHome) {
  createRoot(document.getElementById('homeRoot')).render(<Home />);
}

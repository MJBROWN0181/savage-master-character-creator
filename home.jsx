import './character-cards.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './home.css';

export function Home() {
  return <main className="sm-home" id="workspace-content" tabIndex={-1} aria-labelledby="home-title">
    <div className="home-welcome">
      <div className="home-logo">
        <img src="/logo.png" alt="Savage Master" width="2000" height="2000" fetchPriority="high" />
      </div>
      <h1 id="home-title" className="home-slogan">Your character. Your table. Your story.</h1>
      <p className="home-intro">Create characters, prepare campaigns, and keep your adventures together.</p>
      <div className="home-actions">
        <a className="home-primary" href="/profile?entry=signUp"><span>Begin Your Adventure</span><small>Create an account</small></a>
        <a className="home-secondary" href="/profile?entry=signIn"><span>Already On One</span><small>Sign in to your account</small></a>
      </div>
      <a className="home-character-link" href="/create">Create a character</a>
      <a className="home-install" href="/install" data-install-app>Install App</a>
    </div>
  </main>;
}

if (window.savageMasterHome) {
  createRoot(document.getElementById('homeRoot')).render(<Home />);
}

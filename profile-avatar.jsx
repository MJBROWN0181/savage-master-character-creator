import React from 'react';
import { profileFrames } from './profile-frames.mjs';

export function ProfileAvatar({ image, name, frame }) {
  const artwork = profileFrames[frame];
  return <span className={artwork ? 'profile-avatar-wrap framed' : 'profile-avatar-wrap'} title={artwork?.label}>
    {image ? <img className="avatar" src={image} alt={`${name}'s profile`} /> : <span className="avatar avatar-placeholder" aria-hidden="true">{(name || '?').slice(0, 1).toUpperCase()}</span>}
    {artwork && <><img className="profile-avatar-frame" src={artwork.image} alt="" aria-hidden="true" /><span className="sr-only">{artwork.label}</span></>}
  </span>;
}

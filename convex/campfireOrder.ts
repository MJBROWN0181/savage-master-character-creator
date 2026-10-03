// A deterministic deck makes refreshes reproducible and paging retry-safe.
export function deck<T extends { _id: any }>(rows: T[], seed: string) {
  function rank(id: string) {
    let hash = 2166136261;
    for (const c of seed + ':' + id) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    return hash >>> 0;
  }
  return [...rows].sort((a,b) => rank(String(a._id)) - rank(String(b._id)) || String(a._id).localeCompare(String(b._id)));
}
export function mixedDeck<T>(following: T[], discovery: T[], offset: number, count = 6) {
  if (!following.length || !discovery.length) {
    const pool = following.length ? following : discovery;
    return pool.length ? Array.from({ length: count }, (_, i) => pool[(offset+i) % pool.length]) : [];
  }
  return Array.from({ length: count }, (_, i) => {
    const position = offset + i, group = Math.floor(position / 6), slot = position % 6;
    return slot === 5 ? discovery[group % discovery.length] : following[(group*5+slot) % following.length];
  });
}

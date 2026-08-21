function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickDistractors(pool, exclude, count) {
  const seen = new Set(exclude.map((v) => String(v).trim().toLowerCase()));
  const candidates = [];

  pool.forEach((value) => {
    const key = String(value).trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(value);
  });

  return shuffle(candidates).slice(0, count);
}

module.exports = { shuffle, pickDistractors };

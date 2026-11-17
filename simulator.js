// nts-studio-keyboard-simulator: turn normal text into the way flo dill types in the nts discord.
// Patterns seen: all lowercase, dropped spaces between words ("becausei", "inmy"),
// adjacent-key slips ("again" -> "agsin"), no final punctuation.
//
// Each word gets its own random stream, seeded from (seed, line, position, word).
// So when you type a new word, the words before it do not change.

(function (root) {
  const NEIGHBOURS = {
    q: "wa", w: "qeas", e: "wrsd", r: "etdf", t: "ryfg", y: "tugh", u: "yihj",
    i: "uojk", o: "ipkl", p: "ol", a: "qwsz", s: "awedxz", d: "serfcx",
    f: "drtgvc", g: "ftyhbv", h: "gyujnb", j: "huikmn", k: "jiolm", l: "kop",
    z: "asx", x: "zsdc", c: "xdfv", v: "cfgb", b: "vghn", n: "bhjm", m: "njk",
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Small seeded RNG (mulberry32).
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(r, s) {
    return s[Math.floor(r() * s.length)];
  }

  // One typing slip inside a word. Never touches the first letter.
  function slip(word, r) {
    const letters = [];
    for (let i = 1; i < word.length; i++) if (/[a-z]/.test(word[i])) letters.push(i);
    if (!letters.length) return word;
    const i = pick(r, letters);
    const c = word[i];
    const roll = r();
    if (roll < 0.45 && NEIGHBOURS[c]) {
      // hit the key next door: again -> agsin
      return word.slice(0, i) + pick(r, NEIGHBOURS[c]) + word.slice(i + 1);
    }
    if (roll < 0.65 && i < word.length - 1 && /[a-z]/.test(word[i + 1])) {
      // swap two letters: the -> teh
      return word.slice(0, i) + word[i + 1] + c + word.slice(i + 2);
    }
    if (roll < 0.82) {
      // double a letter: now -> noww
      return word.slice(0, i + 1) + c + word.slice(i + 1);
    }
    // drop a letter, if the word stays long enough
    if (word.length > 3) return word.slice(0, i) + word.slice(i + 1);
    return word;
  }

  // Change one word. Order of r() calls is fixed so the result is stable.
  function mangleWord(word, r, chaos) {
    const rApos = r(), rStop = r(), rComma = r(), rSlip = r();
    // most apostrophes go: don't -> dont
    word = word.replace(/(\w)'(\w)/g, (m, a, b) => (rApos < 0.7 * chaos + 0.2 ? a + b : m));
    // full stops mostly go, commas sometimes go
    if (/\.$/.test(word) && rStop < 0.85) word = word.replace(/\.+$/, "");
    if (/,$/.test(word) && rComma < 0.5 * chaos) word = word.slice(0, -1);
    if (/^[a-z]{3,}[.,!?]*$/.test(word) && rSlip < 0.12 * chaos) word = slip(word, r);
    return word;
  }

  function simulate(text, opts = {}) {
    const chaos = opts.chaos ?? 0.5; // 0 = calm, 1 = full dill
    const seed = opts.seed ?? 0;

    const t = text
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"');

    return t
      .split("\n")
      .map((line, li) => {
        const words = line.split(/ +/);
        let out = "";
        let prev = "";
        words.forEach((orig, wi) => {
          const r = rng(hash(seed + ":" + li + ":" + wi + ":" + orig));
          const rSpace = r();
          const word = mangleWord(orig, r, chaos);
          if (wi > 0 && out.length) {
            // Dropped space. More likely next to short words: "becausei", "inmy".
            let p = 0.1 * chaos;
            if (orig.length <= 2 || prev.length <= 2) p = 0.3 * chaos;
            if (/[.,!?]$/.test(prev) || !/^[a-z]/.test(orig)) p = 0;
            if (!(rSpace < p)) out += " ";
          }
          out += word;
          prev = word;
        });
        return out;
      })
      .join("\n");
  }

  root.ntsSimulate = simulate;
  if (typeof module !== "undefined") module.exports = { simulate };
})(typeof window !== "undefined" ? window : globalThis);

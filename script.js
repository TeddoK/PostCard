'use strict';

const stages = [
  {
    title: 'The First Document',
    note: 'Someone has torn a number out of the dispatch register. Fortunately, they left everything an organised criminal would have taken.',
    hints: [
      'Compare a pair of neighbouring numbers on either line.',
      'Try multiplying the first number by two. How much more do you need to reach the next?',
      'Apply the same operation to 11, then check that repeating it gets you to 47.'
    ],
    clue: 'The recovered slip is 23. Its seal has THREE strokes.',
    explanation: 'Every dispatch number doubles and adds one. So 11 leads to 23 and 23 leads to 47.'
  },
  {
    title: 'The Encrypted Message',
    note: 'There was a wire inside the slip. It is encrypted, which is a very elaborate way of asking us to turn a dial.',
    hints: [
      'The note’s example moves backwards through the alphabet.',
      'The seal from the first dispatch tells you how many letters to move.',
      'Set the dial to that number and look for an instruction about the files.'
    ],
    clue: 'Mira hid the index. Read files in departure order.',
    explanation: 'The three-stroke seal tells you to shift every letter back three places, wrapping around at A.'
  },
  {
    title: 'The Missing Connection',
    note: 'Four folders, four disputed departure times. Everyone remembers the colour of a file when it is time to blame somebody.',
    hints: [
      'The anonymous witness contradicts Mira. Check whose name the wire actually gave you.',
      'Place Slate last. Amber and Ivory must be next to each other, with Amber first. Where can Moss fit?',
      'Count from the left of each tab word using its punch number. Read those letters in the order you built.'
    ],
    clue: 'Mira’s dispatches spell EAST. The folders were a directional index.',
    explanation: 'Moss must come first, followed by Amber and Ivory together, with Slate last. Their punched letters spell EAST.'
  },
  {
    title: 'The Unfinished Story',
    note: 'Mira was keeping a route open. The five items in her account are checkpoints. One belonged to a person she meant to meet again.',
    hints: [
      'Use the directional index to decide which half of the survey to follow.',
      'Five checkpoints have one middle position. Once Lamp is there, which two objects have to be later?',
      'Fit Key next to Lamp, then work out which side of Key can still hold Bell.'
    ],
    clue: 'Mira’s route runs Bell, Key, Lamp, Thread, Coin. The last page has been recovered.',
    explanation: 'The east survey puts Lamp third and Thread after it. Coin comes later than Thread. That leaves Key second beside Lamp and Bell first.'
  },
  {
    title: 'The Last Page',
    note: 'Two people agreed to leave the last word unfinished. Mira left us a method for putting it back.',
    hints: [
      'The route in your journal tells you the order in which to visit the strips.',
      'Use the same direction as the index for the first strip. Change the counting edge on every strip after that.',
      'Count in by the number of strokes on the seal. The edge letter is position one.'
    ],
    clue: 'The last word has been restored.',
    explanation: 'In route order, count three from the alternating edges, starting at the east (right) edge. The strips spell AGAIN.'
  }
];

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const wire = 'PLUD KLG WKH LQGHA. UHDG ILOHV LQ GHSDUWXUH RUGHU.';
const tabs = [
  ['Ivory', 'DUST', 3],
  ['Slate', 'OATH', 3],
  ['Moss', 'NEEDLE', 2],
  ['Amber', 'LATCH', 2]
];
const checkpoints = ['Coin', 'Lamp', 'Bell', 'Thread', 'Key'];
const strips = [
  ['Thread', 'DRILOS'], ['Key', 'PAGTER'], ['Coin', 'PLENUD'],
  ['Bell', 'SPLADE'], ['Lamp', 'MOVARK']
];
const storageKey = 'unfinished-story-v1';
const fresh = (sound = false) => ({
  started: false, stage: 0, completed: 0, sound, first: '', shift: 0,
  files: [], index: '', route: [], last: '', hints: [0, 0, 0, 0, 0]
});
let storageAvailable = true;
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return saved ? { ...fresh(), ...saved } : fresh();
  } catch {
    return fresh();
  }
}
let state = load();
let audio;

const main = document.querySelector('#main');
const drawer = document.querySelector('#drawer');
const drawerTitle = document.querySelector('#drawer-title');
const drawerContent = document.querySelector('#drawer-content');
const journal = document.querySelector('#journal');
const restart = document.querySelector('#restart');
const sound = document.querySelector('#sound');
const saveStatus = document.querySelector('#save-status');

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  updateBar();
}
function updateBar() {
  sound.textContent = state.sound ? 'Sound on' : 'Sound off';
  sound.setAttribute('aria-pressed', String(state.sound));
  journal.hidden = restart.hidden = !state.started;
  saveStatus.textContent = !state.started ? '' : storageAvailable
    ? 'Progress saved on this device' : 'Progress available for this session';
}
function chime(notes) {
  if (!state.sound) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    audio ||= new Audio();
    audio.resume().catch(() => {});
    notes.forEach((frequency, i) => {
      const tone = audio.createOscillator();
      const gain = audio.createGain();
      const time = audio.currentTime + i * .12;
      tone.type = 'sine';
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, time);
      gain.gain.exponentialRampToValueAtTime(.1, time + .03);
      gain.gain.exponentialRampToValueAtTime(.0001, time + .23);
      tone.connect(gain).connect(audio.destination);
      tone.start(time);
      tone.stop(time + .24);
    });
  } catch {
    // Audio is optional on devices that restrict browser playback.
  }
}
function headingFocus() {
  const heading = main.querySelector('h1');
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
function welcome() {
  main.innerHTML = `
    <section class="welcome">
      <div>
        <span class="kicker">The dispatch archive</span>
        <h1 tabindex="-1">The Unfinished Story</h1>
        <p class="subtitle">Every mystery begins somewhere. Not every ending is what it seems.</p>
        <p class="muted">An unsigned note has arrived with five sealed files. Something is missing from the record, and somebody went to a great deal of trouble to make sure you’d notice.</p>
        <button class="primary" data-action="start">${state.started ? 'Continue investigation' : 'Open the first file'}</button>
      </div>
      <div class="cover" aria-hidden="true"><div class="envelope"><span class="seal">◇</span></div></div>
    </section>`;
}

function progress() {
  return `<nav aria-label="Case file progress"><ol class="steps">${stages.map((stage, i) => {
    const locked = i > state.completed;
    const status = i < state.completed ? 'complete' : locked ? 'locked' : 'available';
    return `<li><button data-action="stage" data-value="${i}" aria-label="File ${i + 1}: ${stage.title}, ${status}" ${locked ? 'disabled' : ''} ${i === state.stage ? 'aria-current="step"' : ''}>${String(i + 1).padStart(2, '0')}${i < state.completed ? ' ✓' : locked ? ' ·' : ''}</button></li>`;
  }).join('')}</ol></nav>`;
}
function answerField(key, label, maxLength) {
  return `<label for="${key}">${label}</label>
    <input id="${key}" name="${key}" maxlength="${maxLength}" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go">`;
}
function choiceList(options, key, selection) {
  return `<div class="choices">${options.map(item => {
    const selected = typeof selection === 'string' ? selection === item : selection.includes(item);
    return `<button type="button" data-action="${key}" data-value="${item}" aria-pressed="${selected}">${item}</button>`;
  }).join('')}</div>`;
}
function orderBoard(options, key, label) {
  return `<div id="order"><p>${label} Choose the items in order. Tap a filled slot to remove that item.</p>
    <div class="slots" aria-label="Ordered slots">${options.map((_, i) => {
      const item = state[key][i];
      return item
        ? `<button type="button" data-action="${key}" data-value="${item}" aria-label="Remove ${item} from position ${i + 1}">${i + 1}. ${item}</button>`
        : `<span aria-label="Position ${i + 1}, empty">${i + 1}</span>`;
    }).join('')}</div>${choiceList(options, key, state[key])}</div>`;
}
function decode() {
  return wire.replace(/[A-Z]/g, letter => alphabet[(alphabet.indexOf(letter) - state.shift + 26) % 26]);
}
function puzzle(index) {
  switch (index) {
    case 0:
      return `<section class="paper"><span class="kicker">Dispatch register</span>
        <p>Both lines were filed using the same rule. Restore the missing number from the current register.</p>
        <p class="sequence" aria-label="Previous register: 4, 9, 19, 39"><span>4</span><span>9</span><span>19</span><span>39</span></p>
        <p class="sequence" aria-label="Current register: 2, 5, 11, missing number, 47"><span>2</span><span>5</span><span>11</span><span class="blank">?</span><span>47</span></p></section>
        <div id="first-choices">${choiceList(['21', '22', '23', '25', '33', '35'], 'first', state.first)}</div>`;
    case 1:
      return `<section class="paper"><span class="kicker">Intercepted wire</span><p class="cipher">${wire}</p>
        <p>Every letter was moved the same distance forward. Go backwards to undo it. One back turns D into C and A into Z.</p>
        <p><strong>Margin note.</strong> The seal on the recovered slip remembers how far.</p></section>
        <div class="rotor"><button type="button" data-action="shift" data-value="-1" aria-label="Decrease shift">−</button>
          <output id="shift-count" aria-live="polite">Back ${state.shift}</output>
          <button type="button" data-action="shift" data-value="1" aria-label="Increase shift">+</button></div>
        <section class="paper"><span class="kicker">Decoded preview</span><p id="decoded" class="cipher">${decode()}</p></section>`;
    case 2:
      return `<section class="paper"><span class="kicker">Statements</span>
        <details><summary>Dispatch clerk</summary><p>Amber left immediately before Ivory.</p></details>
        <details><summary>Mira</summary><p>Moss had already left by the time Ivory went out. I locked up after Slate, the last file.</p></details>
        <details><summary>Unsigned account</summary><p>Moss was definitely last. Please do not ask how I know.</p></details>
        <details><summary>Indexing instructions</summary><p>Trust the named custodian in the wire over the unsigned account. On each tab, count into its word from the left, starting at 1, as far as the punch number. Combine the four letters in departure order.</p></details></section>
        <div class="grid">${tabs.map(([name, word, punch]) => `<section class="paper"><strong>${name}</strong><p class="cipher">${word}</p><p>Punch ${punch}</p></section>`).join('')}</div>
        ${orderBoard(tabs.map(([name]) => name), 'files', 'Rebuild the departure order from earliest to latest.')}
        ${answerField('index', 'Four-letter index', 24)}`;
    case 3:
      return `<section class="paper"><span class="kicker">Mira’s survey</span>
        <p>Use the survey marked with the direction you recovered. Each checkpoint was visited exactly once.</p>
        <details><summary>West survey</summary><p>Thread came before Lamp. Lamp was the middle stop.</p></details>
        <details><summary>East survey</summary><p>Thread came after Lamp. Lamp was the middle stop.</p></details>
        <details><summary>Mira’s field notes</summary><ul><li>Coin came later than Thread.</li><li>Key and Lamp were consecutive, in either order.</li><li>Bell came before Key.</li></ul></details></section>
        ${orderBoard(checkpoints, 'route', 'Rebuild the route from the first checkpoint to the last.')}`;
    default:
      return `<section class="paper"><span class="kicker">Strips from the last page</span>
        <p>Read the strips in Mira’s checkpoint order. Take one letter from each strip.</p>
        <details><summary>Mira’s instructions</summary><p>The index names the edge to start counting from on your first stop. East is right, west is left. Switch edges at every stop. On each strip, count in by the number of strokes in the first seal. Count the letter on the edge as one.</p></details></section>
        <section class="paper"><table><thead><tr><th scope="col">Checkpoint</th><th scope="col">West · Strip · East</th></tr></thead>
        <tbody>${strips.map(([item, strip]) => `<tr><th scope="row">${item}</th><td>${[...strip].join(' ')}</td></tr>`).join('')}</tbody></table></section>
        ${answerField('last', 'The missing word', 30)}`;
  }
}

function stageScreen() {
  const index = state.stage;
  const stage = stages[index];
  const solved = index < state.completed;
  const hints = stage.hints.slice(0, state.hints[index]);
  main.innerHTML = progress() + `
    <article class="stage">
      <span class="kicker">Case file ${String(index + 1).padStart(2, '0')}</span>
      <h1 tabindex="-1">${stage.title}</h1><p class="note">${stage.note}</p>
      ${solved ? `<section class="success" tabindex="-1"><h2>File complete</h2>
        <p>${stage.explanation}</p><p><strong>Journal entry.</strong> ${stage.clue}</p>
        <button class="primary" data-action="next">${index === 4 ? 'Read the restored page' : 'Open the next file'}</button></section>`
      : `<form id="puzzle" class="form" novalidate>${puzzle(index)}
        <div class="actions"><button class="primary" type="submit">Check ${['dispatch', 'message', 'index', 'route', 'last word'][index]}</button>
        <button type="button" data-action="hint" ${hints.length === stage.hints.length ? 'disabled' : ''}>Hint (${hints.length}/${stage.hints.length})</button></div>
        <p id="feedback" class="feedback" role="status"></p>
        <ol id="hints" class="hints" aria-live="polite" ${hints.length ? '' : 'hidden'}>${hints.map(hint => `<li>${hint}</li>`).join('')}</ol></form>`}
    </article>`;
  const field = main.querySelector('input');
  if (field) field.value = state[field.name];
}
function reveal(complete) {
  main.innerHTML = `<article class="reveal">
    ${complete ? `<span class="kicker">Or perhaps it’s just the beginning.</span>
      <h1 tabindex="-1">HADESTOWN</h1><p class="subtitle">LIVERPOOL EMPIRE THEATRE</p>
      <strong class="gift">TWO TICKETS!</strong>
      <div class="personal"><p>Some stories are worth travelling for.</p>
      <p>Get ready for a journey filled with music, love, mythology and a little bit of chaos.</p>
      <p>And don't worry, you won't be making this journey alone.</p>
      <p>I'll be coming with you!</p></div>`
    : `<h1 tabindex="-1">YOU FOUND THE END OF THE STORY...</h1>
      <p class="subtitle">OR PERHAPS IT'S JUST THE BEGINNING.</p>
      <button class="primary" data-action="reveal">Turn the page</button>`}
    </article>`;
  headingFocus();
}
function openStage(index) {
  state.stage = index;
  save();
  stageScreen();
  headingFocus();
}
function showDialog(title, content) {
  drawerTitle.textContent = title;
  drawerContent.innerHTML = content;
  drawer.showModal();
}
function normalize(value) {
  return value.toUpperCase().replace(/[\s\p{P}]/gu, '');
}
function matchesOrder(actual, expected) {
  return actual.length === expected.length && expected.every((item, i) => actual[i] === item);
}
function verdict() {
  switch (state.stage) {
    case 0: return state.first === '23' ? '' : 'The register still disagrees. Check the rule against both lines.';
    case 1: return state.shift === 3 ? '' : 'Still scrambled. The seal records the amount to turn back.';
    case 2:
      if (!matchesOrder(state.files, ['Moss', 'Amber', 'Ivory', 'Slate'])) return 'The folders don’t match the trusted statements yet.';
      return normalize(state.index) === 'EAST' ? '' : 'The order checks out. Recheck the punch positions and the letters you took.';
    case 3: return matchesOrder(state.route, ['Bell', 'Key', 'Lamp', 'Thread', 'Coin'])
      ? '' : 'That route contradicts the survey or a field note. Check the two stops after Lamp.';
    default: return normalize(state.last) === 'AGAIN' ? '' : 'The page won’t close yet. Check the route and swap edges after each strip.';
  }
}
main.addEventListener('submit', event => {
  event.preventDefault();
  const message = verdict();
  if (message) {
    document.querySelector('#feedback').textContent = message;
    chime([195]);
    return;
  }
  state.completed++;
  save();
  stageScreen();
  main.querySelector('.success').focus();
  chime([440, 554, 660]);
});
main.addEventListener('input', event => {
  if (event.target.matches('input')) {
    state[event.target.name] = event.target.value;
    save();
  }
});
main.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, value } = button.dataset;
  switch (action) {
    case 'start':
      state.started = true;
      openStage(state.stage);
      break;
    case 'stage':
      openStage(Number(value));
      break;
    case 'next':
      if (state.stage === 4) reveal(false);
      else openStage(state.stage + 1);
      break;
    case 'reveal':
      reveal(true);
      chime([392, 494, 587, 784]);
      break;
    case 'first':
      state.first = value;
      main.querySelectorAll('#first-choices button').forEach(choice => {
        choice.setAttribute('aria-pressed', String(choice === button));
      });
      save();
      break;
    case 'shift':
      state.shift = (state.shift + Number(value) + 26) % 26;
      document.querySelector('#decoded').textContent = decode();
      document.querySelector('#shift-count').textContent = 'Back ' + state.shift;
      save();
      break;
    case 'files':
    case 'route': {
      const order = state[action];
      const position = order.indexOf(value);
      if (position === -1) order.push(value);
      else order.splice(position, 1);
      const options = action === 'files' ? tabs.map(([name]) => name) : checkpoints;
      const label = action === 'files' ? 'Rebuild the departure order from earliest to latest.'
        : 'Rebuild the route from the first checkpoint to the last.';
      document.querySelector('#order').outerHTML = orderBoard(options, action, label);
      main.querySelector(`.choices [data-value="${value}"]`).focus({ preventScroll: true });
      save();
      break;
    }
    case 'hint': {
      const list = document.querySelector('#hints');
      const stage = stages[state.stage];
      const hint = document.createElement('li');
      hint.textContent = stage.hints[state.hints[state.stage]++];
      list.hidden = false;
      list.append(hint);
      button.textContent = `Hint (${state.hints[state.stage]}/${stage.hints.length})`;
      button.disabled = state.hints[state.stage] === stage.hints.length;
      if (button.disabled) {
        hint.tabIndex = -1;
        hint.focus({ preventScroll: true });
      }
      save();
      break;
    }
  }
});

sound.addEventListener('click', () => {
  state.sound = !state.sound;
  save();
  chime([440]);
});
journal.addEventListener('click', () => {
  const entries = stages.slice(0, state.completed);
  showDialog('Investigation journal', entries.length
    ? entries.map(stage => `<section class="paper"><h2>${stage.title}</h2><p>${stage.clue}</p></section>`).join('')
    : '<p>The journal is empty. A recovered clue will be filed here when you solve the first document.</p>');
});
restart.addEventListener('click', () => {
  showDialog('Restart investigation?', '<p>This clears the clues, hints and puzzle progress saved on this device.</p><button class="primary" id="confirm-restart">Clear progress and restart</button>');
  document.querySelector('#confirm-restart').addEventListener('click', () => {
    drawer.close();
    state = fresh(state.sound);
    save();
    welcome();
    headingFocus();
  });
});
updateBar();
welcome();

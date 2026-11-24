'use strict';

const storageKey = 'unfinished-story-v2';
const fresh = (sound = false) => ({
  started: false, stage: 0, completed: 0, sound,
  hints: [0, 0, 0, 0, 0], play: freshPuzzles()
});
let storageAvailable = true;
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) return { ...fresh(), ...saved, play: { ...freshPuzzles(), ...saved.play } };
    const previous = JSON.parse(localStorage.getItem('unfinished-story-v1') || 'null');
    return fresh(previous?.sound === true);
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
    notes.forEach((note, i) => {
      const { frequency, delay, duration } = typeof note === 'number'
        ? { frequency: note, delay: i * .12, duration: .23 } : note;
      const tone = audio.createOscillator();
      const gain = audio.createGain();
      const time = audio.currentTime + delay;
      tone.type = 'sine';
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, time);
      gain.gain.exponentialRampToValueAtTime(.1, time + .03);
      gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
      tone.connect(gain).connect(audio.destination);
      tone.start(time);
      tone.stop(time + duration + .01);
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
function puzzleContent(index) {
  const stage = stages[index];
  const hints = stage.hints.slice(0, state.hints[index]);
  return `${puzzleScreens[index]()}
    <div class="actions"><button type="button" data-action="hint" ${hints.length === stage.hints.length ? 'disabled' : ''}>Hint (${hints.length}/${stage.hints.length})</button></div>
    <p id="feedback" class="feedback" role="status"></p>
    <ol id="hints" class="hints" aria-live="polite" ${hints.length ? '' : 'hidden'}>${hints.map(hint => `<li>${hint}</li>`).join('')}</ol>`;
}

const locations = [
  ['Lost property office', '<i class="sc-shelves"></i><i class="sc-crate sc-crate-left"></i><i class="sc-crate sc-crate-right"></i><i class="sc-lamp"></i>'],
  ['Freight lift', '<i class="sc-lift"><b></b></i><i class="sc-dial"></i>'],
  ['Speaking-pipe works', '<i class="sc-pipes"></i><i class="sc-fan"><b></b></i><i class="sc-steam"></i>'],
  ['Service stairs', '<i class="sc-landing"></i><i class="sc-grille"></i><i class="sc-stairs"></i><i class="sc-lamp"></i>'],
  ['The passage below', '<i class="sc-arch"></i><i class="sc-rails"></i><i class="sc-distant"></i>']
];

function locationHeader(index, title) {
  const [location, artwork] = locations[index];
  return `<header class="location location-${index}">
    <div class="location-art" aria-hidden="true">${artwork}<i class="sc-air"></i></div>
    <div class="location-caption"><span class="kicker">${location}</span><h1 tabindex="-1">${title}</h1></div>
  </header>`;
}

function stageScreen() {
  const index = state.stage;
  const stage = stages[index];
  const solved = index < state.completed;
  main.innerHTML = progress() + `
    <article class="stage scene-${index}">
      ${locationHeader(index, stage.title)}
      <p class="note">${stage.note}</p>
      ${solved ? `<section class="success" tabindex="-1"><h2>File complete</h2>
        ${index === 0 ? '<span class="brass-pass" aria-hidden="true">◇</span>' : ''}
        ${index === 2 ? pipeBoard(true) : ''}
        <p>${stage.explanation}</p><p><strong>Journal entry.</strong> ${stage.clue}</p>
        <button class="primary" data-action="next">${index === 4 ? 'Read the restored page' : 'Open the next file'}</button></section>`
      : `<div id="puzzle" class="form">${puzzleContent(index)}</div>`}
    </article>`;
}

function refreshPuzzle(button, message = '') {
  save();
  const puzzle = main.querySelector('#puzzle');
  const openSections = [...puzzle.querySelectorAll('details')].map(details => details.open);
  puzzle.innerHTML = puzzleContent(state.stage);
  puzzle.querySelectorAll('details').forEach((details, i) => { details.open = openSections[i] ?? false; });
  const sameControl = [...main.querySelectorAll('[data-action]')].find(control =>
    !control.disabled && control.dataset.action === button.dataset.action &&
    control.dataset.value === button.dataset.value);
  const nextAction = { beat: 'send', send: 'hear-reply', walk: 'walk', gate: 'knock', look: 'gate' }[button.dataset.action];
  const fallback = (nextAction && puzzle.querySelector(`[data-action="${nextAction}"]:not(:disabled)`))
    || puzzle.querySelector('button:not(:disabled)');
  const effectTarget = {
    beat: '.signal-board',
    send: message ? '.signal-board' : '.signal-board + .paper',
    knock: `.gate:nth-child(${Number(button.dataset.value) + 1})`,
    listen: '.listening-result + .gates .gate:nth-child(2)',
    'test-line': '.pipe-grid'
  }[button.dataset.action];
  if (effectTarget) puzzle.querySelector(effectTarget)?.classList.add('is-playing');
  if (['send', 'test-line', 'walk', 'knock', 'listen', 'gate'].includes(button.dataset.action)) {
    const location = main.querySelector('.location');
    location.classList.remove('scene-response');
    requestAnimationFrame(() => requestAnimationFrame(() => location.classList.add('scene-response')));
  }
  if (message) {
    const feedback = main.querySelector('#feedback');
    feedback.textContent = message;
    feedback.tabIndex = -1;
    feedback.focus();
  } else {
    if (sameControl) sameControl.focus({ preventScroll: true });
    else fallback?.focus();
  }
}

function reveal(complete) {
  main.innerHTML = `<article class="reveal ${complete ? 'curtain-up' : ''}">
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
    default: {
      if (action === 'hear-reply') {
        const response = button.closest('.paper');
        response.querySelector('.beats').outerHTML = beats(reply);
        response.classList.add('is-playing');
      }
      const result = puzzleAction(action, value);
      if (result === 'complete') {
        state.completed++;
        save();
        stageScreen();
        main.querySelector('.success').focus();
        chime([440, 554, 660]);
      } else if (result === 'render') {
        refreshPuzzle(button);
      } else if (result) {
        refreshPuzzle(button, result);
      }
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
    ? entries.map((stage, i) => `<section class="paper"><h2>${stage.title}</h2><p>${stage.clue}</p>
      ${i === 1 ? `<div id="journal-reply">${beats(reply)}</div><button id="replay-reply" type="button">Replay Mira’s reply</button>` : ''}
      </section>`).join('')
    : '<p>The journal is empty. A recovered clue will be filed here when you solve the first file.</p>');
  drawerContent.querySelector('#replay-reply')?.addEventListener('click', () => {
    const rhythm = drawerContent.querySelector('#journal-reply');
    rhythm.innerHTML = beats(reply);
    rhythm.classList.add('is-playing');
    playRhythm(reply);
  });
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

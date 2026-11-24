'use strict';

const stages = [
  {
    title: 'Lost Property',
    note: 'Mira left a brass pass in lost property. Four claim tags are tied to four locked boxes. Two tags are telling the truth. The clerk insists this counts as a filing system.',
    hints: [
      'Imagine the pass is in one particular box. Read all four tags and see which claims would be true.',
      'The tin’s tag agrees with the oak’s. Those two are either both right or both wrong.',
      'If the oak tag were right, the tin and painted tags would also be right. That would make three true tags.'
    ],
    clue: 'Mira’s brass pass was in the tin box. Its inscription reads “Tap twice. Then hold.”',
    explanation: 'If the pass were in the leather or painted box, three tags would be true. If it were in the oak, none would be true. Only the tin makes exactly two true: the leather and painted tags.'
  },
  {
    title: 'The Other Side',
    note: 'The pass fits the speaking hatch. Something on the other side tries every key it owns, drops them all, then goes very still.',
    hints: [
      'Look in the journal for the words engraved on the brass pass.',
      'A tap makes a short mark and a hold makes a long one. Use the controls to build the signal, then send it.',
      'Write down what comes back. A reply can be different from the signal that summoned it.'
    ],
    clue: 'Mira’s call is short, short, long. Her reply is long, short, long. She’s been waiting on the far side of the passage.',
    explanation: 'The brass pass told you how to call. You heard a different rhythm come back, followed by Mira’s voice.'
  },
  {
    title: 'A Line Through the Wall',
    note: 'Mira can hear you at the hatch. Deeper in, the speaking tubes have been dismantled. She asks whether you’re any good with plumbing. You have time to lie.',
    hints: [
      'Start at the brass inlet at the upper left. Rotate its elbow until it points left and down.',
      'A lit tile gets air from the inlet. At the last lit tile, check that its exit lines up with the opening of the next tile.',
      'Follow the outer wall down, over once, up through the centre, then around the upper right corner and down to the outlet.'
    ],
    clue: 'The speaking line is connected. Mira can hear you all the way to the last gate.',
    explanation: 'A continuous line carries the signal from the brass inlet to the far gate. You can hear the reply in every section of the passage.'
  },
  {
    title: 'Two Ways Through',
    note: 'On the service stairs, buttons stay pressed only under someone’s weight. Mira offers to hold the first. Of course, someone also has to let her through.',
    hints: [
      'Leave one person on the bell plate while the other crosses the shutter.',
      'Once someone reaches the gallery, send them to the lamp plate. Keep the person on the bell plate where they are.',
      'The lamp plate opens a direct way from the bell plate to the gallery. Switch travellers, take the shortcut, then walk both out.'
    ],
    clue: 'You and Mira got through the shutters by taking turns holding the way open. The line beyond the stairs still carries her reply.',
    explanation: 'The bell plate opened the shutter for one traveller. The lamp plate opened a different way for the other. Both of you reached the tunnel.'
  },
  {
    title: 'The Last Passage',
    note: 'The passage is too narrow to walk together. You go first. In the dark, every tube carries a voice that sounds a little like Mira.',
    hints: [
      'You can knock on each gate’s speaking tube before you decide where to go.',
      'Mira’s reply is filed in the journal. The rhythm you sent to call her was different.',
      'Each chamber has one matching reply. At the last threshold, you can carry on as soon as you have heard it.'
    ],
    clue: 'You led Mira through the dark by recognising her reply. She made it to the threshold with you.',
    explanation: 'Other voices knew the call. Mira was the one who always answered with the reply you heard at the hatch.'
  }
];

const boxes = [
  { name: 'Oak box', claim: 'The pass is in the leather case or the painted box.', wrong: 'Inside is an inventory of spare hinges. Several have been marked “emotionally unavailable”.' },
  { name: 'Leather case', claim: 'The pass is in the tin box.', wrong: 'You find a sandwich with its own inventory number. Best leave it to the proper authorities.' },
  { name: 'Tin box', claim: 'The oak box’s tag is telling the truth.' },
  { name: 'Painted box', claim: 'The pass isn’t in the oak box.', wrong: 'It contains a note that says “DO NOT OPEN AGAIN.” Fair enough.' }
];
const call = 'SSL';
const reply = 'LSL';
const directions = ['up', 'right', 'down', 'left'];
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const pipeShapes = [[0, 1], [0, 1], [0, 1], [0, 2], [0, 2], [0, 2], [0, 1], [0, 1], [0, 1]];
const places = ['Landing', 'Bell plate', 'Shutter', 'Gallery', 'Lamp plate', 'Tunnel'];
const corridors = [[0, 1], [0, 2], [2, 3], [3, 4], [1, 3], [3, 5]];
const chambers = [
  { title: 'The fork', routes: [['Frosted gate', 'SSL'], ['Iron gate', 'LSL'], ['Narrow gate', 'LLS']] },
  { title: 'The bend', routes: [['Low gate', 'LSL'], ['Blue gate', 'LSS'], ['Ribbed gate', 'SLL']] },
  { title: 'The threshold', routes: [['Copper gate', 'SLS'], ['Canvas gate', 'SSL'], ['Plain gate', 'LSL']] }
];

function freshPuzzles() {
  return {
    box: null, opened: [], rhythm: '', response: '',
    pipes: [1, 0, 3, 1, 1, 1, 0, 3, 0],
    travellers: [0, 0], active: 0, moves: [],
    chamber: 0, heard: [], threshold: false
  };
}
function control(action, value, label, extra = '') {
  return `<button type="button" data-action="${action}" data-value="${value}" ${extra}>${label}</button>`;
}
function beats(pattern) {
  return `<span class="beats">${[...pattern].map(beat => `<span class="beat ${beat === 'S' ? 'short' : 'long'}">${beat === 'S' ? 'Short' : 'Long'}</span>`).join(' ')}</span>`;
}
function boxPuzzle() {
  return `<div class="evidence">
    <section class="paper"><span class="kicker">Mira’s postcard</span>
    <p>“Exactly one box holds my pass. Exactly two tags tell the truth. Work out where I put it before you open anything.”</p></section></div>
    <p>Read the tags, then select the box you want to open.</p>
    <div class="box-grid">${boxes.map((box, i) => `<section class="box-card ${state.play.box === i ? 'selected' : ''}">
      ${control('inspect', i, `<span class="box-art" aria-hidden="true"></span>${box.name}`, `aria-pressed="${state.play.box === i}"`)}
      <p class="claim-tag">${box.claim}</p>
      ${state.play.box === i ? `
        ${state.play.opened.includes(i) ? `<p class="box-result">${box.wrong}</p>` : control('open-box', i, `Open ${box.name.toLowerCase()}`, 'class="primary"')}` : ''}
    </section>`).join('')}</div>`;
}
function signalPuzzle() {
  const { rhythm, response } = state.play;
  return `<section class="paper"><span class="kicker">Speaking hatch</span><p>Send the signal engraved on your pass. You can see the knocks as well as hear them.</p></section>
    <div class="signal-board"><p>Your signal</p>${rhythm ? beats(rhythm) : '<p class="muted">No knocks yet.</p>'}
      <div class="actions">
        ${control('beat', 'S', 'Tap · short', rhythm.length >= 3 ? 'disabled' : '')}
        ${control('beat', 'L', 'Hold · long', rhythm.length >= 3 ? 'disabled' : '')}
        ${control('clear-beats', '', 'Clear')}
        ${control('send', '', 'Send signal', 'class="primary"')}
      </div>
    </div>
    ${response ? `<section class="paper"><h2>From the other side</h2>${beats(response)}
      <p>“It’s Mira. I’m still here. Remember that reply. The pipes carry all kinds of noise.”</p>
      ${control('hear-reply', '', 'Hear reply again')}
      ${control('finish-signal', '', 'Keep the line open', 'class="primary"')}</section>` : ''}`;
}
function openings(i) {
  return pipeShapes[i].map(side => (side + state.play.pipes[i]) % 4);
}
function pipeFlow() {
  const reached = new Set();
  if (!openings(0).includes(3)) return reached;
  const pending = [0];
  while (pending.length) {
    const index = pending.pop();
    if (reached.has(index)) continue;
    reached.add(index);
    for (const side of openings(index)) {
      if ((side === 1 && index % 3 === 2) || (side === 3 && index % 3 === 0)) continue;
      const next = index + [-3, 1, 3, -1][side];
      if (pipeShapes[next] && openings(next).includes((side + 2) % 4)) pending.push(next);
    }
  }
  return reached;
}
function pipePuzzle() {
  const flow = pipeFlow();
  return `<section class="paper"><p>Turn the tubes to carry the signal from the inlet at <strong>A’s left edge</strong> to the outlet at <strong>I’s right edge</strong>. Connected tubes light up. Press the test button to send a knock.</p></section>
    <div class="pipe-grid" aria-label="Speaking pipes">${pipeShapes.map((_, i) => {
      const sides = openings(i);
      const label = `Tube ${letters[i]}, open ${sides.map(side => directions[side]).join(' and ')}${flow.has(i) ? ', connected' : ''}`;
      return control('rotate', i,
        `<span class="tube-id">${letters[i]}</span><span class="pipe-icon" aria-hidden="true">${sides.map(side => `<i class="${directions[side]}"></i>`).join('')}</span>`,
        `aria-label="${label}" class="pipe-tile ${flow.has(i) ? 'flow' : ''}"`);
    }).join('')}</div>
    <div class="actions">${control('test-line', '', 'Send a knock through', 'class="primary"')}</div>`;
}
function canCross(from, to, other) {
  if (!corridors.some(edge => edge.includes(from) && edge.includes(to)) || from === to) return false;
  if ([from, to].includes(2) && [from, to].includes(3)) return other === 1;
  if ([from, to].includes(1) && [from, to].includes(3)) return other === 4;
  return true;
}
function stairPuzzle() {
  const { travellers, active, moves } = state.play;
  const names = ['You', 'Mira'];
  const targets = places.map((_, i) => i).filter(i => canCross(travellers[active], i, travellers[1 - active]));
  return `<section class="paper"><p>The <strong>bell plate</strong> opens the shutter between the shutter and the gallery. The <strong>lamp plate</strong> opens a direct passage from the bell plate to the gallery. A plate releases when you step off it.</p>
      <details><summary>Read the stair plan</summary><p>Landing connects to Bell plate and Shutter. Shutter connects to Gallery while Bell plate is held. Gallery connects to Lamp plate and Tunnel. Bell plate connects directly to Gallery while Lamp plate is held.</p></details></section>
    <div class="travellers" aria-label="Choose who to move">${names.map((name, i) => control('traveller', i, `<strong>${name}</strong><br>${places[travellers[i]]}`, `aria-pressed="${i === active}"`)).join('')}</div>
    <div class="stairs-map" aria-label="Stair plan">
      ${places.map((place, index) => `<div class="stair-place ${travellers.includes(index) ? 'occupied' : ''}"><strong>${place}</strong>${travellers.map((position, i) => position === index ? `<span>${names[i]}</span>` : '').join('')}</div>`).join('')}
    </div>
    <p><strong>${names[active]}</strong> can move to:</p><div class="actions">
      ${targets.map(index => control('walk', index, places[index], 'class="primary"')).join('')}
      ${control('undo', '', 'Undo move', moves.length ? '' : 'disabled')}
    </div>`;
}
function passagePuzzle() {
  const { chamber, heard, threshold } = state.play;
  if (threshold) return `<section class="threshold">
    <p>The passage opens onto a square of daylight. Behind you the floorboards creak, then fall quiet.</p>
    <p>Mira gives the reply one more time. You can hear the last knock through the soles of your shoes.</p>
    ${beats(reply)}<div class="actions">
      ${control('forward', '', 'Step into daylight', 'class="primary"')}
      ${control('look', '', 'Look back')}
    </div></section>`;
  const scene = chambers[chamber];
  return `<section class="threshold"><h2>${scene.title}</h2><p>Knock on the speaking tubes. Follow the gate that carries Mira’s reply.</p>
    <div class="gates">${scene.routes.map(([name, rhythm], i) => `<section class="gate">
      <h3>${name}</h3>
      ${heard.includes(i) ? beats(rhythm) : '<p class="muted">Awaiting a knock.</p>'}
      <div class="actions">${control('knock', i, heard.includes(i) ? `Knock again at ${name}` : `Knock at ${name}`)}
      ${heard.includes(i) ? control('gate', i, `Take ${name}`, 'class="primary"') : ''}</div></section>`).join('')}</div></section>`;
}
const puzzleScreens = [boxPuzzle, signalPuzzle, pipePuzzle, stairPuzzle, passagePuzzle];

function playRhythm(pattern) {
  if (!state.sound) return;
  let delay = 0;
  const notes = [...pattern].map(beat => {
    const duration = beat === 'L' ? .28 : .09;
    const note = { frequency: 175, delay, duration };
    delay += duration + .12;
    return note;
  });
  chime(notes);
}
function puzzleAction(action, value) {
  const p = state.play;
  const index = Number(value);
  switch (action) {
    case 'inspect':
      p.box = index;
      return 'render';
    case 'open-box':
      if (p.box !== index) return;
      if (index === 2) return 'complete';
      p.opened.push(index);
      return 'render';
    case 'beat':
      if (p.rhythm.length < 3) p.rhythm += value;
      playRhythm(value);
      return 'render';
    case 'clear-beats':
      p.rhythm = '';
      return 'render';
    case 'send':
      if (p.rhythm !== call) return 'The hatch clicks once and stays shut. Check the instruction on the pass.';
      p.response = reply;
      playRhythm(reply);
      return 'render';
    case 'hear-reply':
      playRhythm(reply);
      return;
    case 'finish-signal':
      if (p.response === reply) return 'complete';
      return;
    case 'rotate':
      p.pipes[index] = (p.pipes[index] + 1) % 4;
      return 'render';
    case 'test-line': {
      const flow = pipeFlow();
      if (flow.size === 9 && openings(8).includes(1)) {
        playRhythm(reply);
        return 'complete';
      }
      return flow.size ? 'The knock gets partway and stops. Follow the lit tubes to the break.' : 'No air enters the first tube. It needs an opening facing left.';
    }
    case 'traveller':
      p.active = index;
      return 'render';
    case 'walk':
      if (!canCross(p.travellers[p.active], index, p.travellers[1 - p.active])) return;
      p.moves.push({ travellers: [...p.travellers], active: p.active });
      p.travellers[p.active] = index;
      return p.travellers.every(position => position === 5) ? 'complete' : 'render';
    case 'undo': {
      const previous = p.moves.pop();
      if (previous) {
        p.travellers = previous.travellers;
        p.active = previous.active;
      }
      return 'render';
    }
    case 'knock': {
      const rhythm = chambers[p.chamber].routes[index][1];
      if (!p.heard.includes(index)) p.heard.push(index);
      playRhythm(rhythm);
      return 'render';
    }
    case 'gate':
      if (!p.heard.includes(index)) return;
      if (chambers[p.chamber].routes[index][1] !== reply) return 'You start towards the gate. The reply is wrong, and nobody follows. You step back to the fork.';
      if (p.chamber === chambers.length - 1) {
        p.threshold = true;
        playRhythm(reply);
      } else {
        p.chamber++;
        p.heard = [];
      }
      return 'render';
    case 'look':
      p.threshold = false;
      return 'The echo swallows the corridor for a moment. You are back at the last gate. The reply is still in your journal.';
    case 'forward':
      if (p.threshold) return 'complete';
  }
}

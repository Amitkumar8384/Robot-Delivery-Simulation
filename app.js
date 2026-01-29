// ================= ROADS =================
const roads = [
  "Alice's House-Bob's House",
  "Alice's House-Cabin",
  "Alice's House-Post Office",
  "Bob's House-Town Hall",
  "Daria's House-Ernie's House",
  "Daria's House-Town Hall",
  "Ernie's House-Grete's House",
  "Grete's House-Farm",
  "Grete's House-Shop",
  "Marketplace-Farm",
  "Marketplace-Post Office",
  "Marketplace-Shop",
  "Marketplace-Town Hall",
  "Shop-Town Hall",
  "Amit's Home-Post Office",
  "Amit's Home-Shop",
  "Amit's Home-Town Hall"
];

// ================= GRAPH =================
function buildGraph(edges) {
  const graph = Object.create(null);

  function addEdge(a, b) {
    graph[a] ? graph[a].push(b) : (graph[a] = [b]);
  }

  edges.forEach(r => {
    const [a, b] = r.split("-");
    addEdge(a, b);
    addEdge(b, a);
  });

  return graph;
}

const roadGraph = buildGraph(roads);
const places = Object.keys(roadGraph);

// ================= MAP POSITIONS =================
const placePositions = {
  "Alice's House": [120, 80],
  "Bob's House": [300, 80],
  "Cabin": [520, 80],
  "Post Office": [740, 80],
  "Town Hall": [120, 200],
  "Daria's House": [300, 200],
  "Ernie's House": [520, 200],
  "Grete's House": [740, 200],
  "Farm": [200, 330],
  "Shop": [420, 330],
  "Marketplace": [640, 330],
  "Amit's Home": [80, 330]
};

// ================= STATE =================
class VillageState {
  constructor(place, parcels) {
    this.place = place;
    this.parcels = parcels;
  }

  move(destination) {
    if (!roadGraph[this.place].includes(destination)) return this;

    let parcels = this.parcels.map(p => {
      if (p.place === this.place && p.status === "waiting") {
        log(`Pickup from ${this.place}`, "pickup");
        return { place: destination, address: p.address, status: "picked" };
      }

      if (p.status === "picked") {
        return { ...p, place: destination };
      }
      return p;
    }).map(p => {
      if (p.place === p.address && p.status === "picked") {
        log(`Delivered at ${p.address}`, "deliver");
        showDeliveryFlash(p.address);
        return { ...p, status: "delivered" };
      }
      return p;
    });

    parcels = parcels.filter(p => p.status !== "delivered");
    return new VillageState(destination, parcels);
  }
}

// ================= HELPERS =================
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

VillageState.random = function (count = 5) {
  const parcels = [];
  for (let i = 0; i < count; i++) {
    let address = randomPick(places);
    let place;
    do place = randomPick(places);
    while (place === address);

    parcels.push({ place, address, status: "waiting" });
  }
  return new VillageState("Post Office", parcels);
};

// ================= BFS =================
function findRoute(graph, from, to) {
  const queue = [{ at: from, route: [] }];

  for (let i = 0; i < queue.length; i++) {
    const { at, route } = queue[i];
    for (let next of graph[at]) {
      if (next === to) return route.concat(next);
      if (!queue.some(q => q.at === next)) {
        queue.push({ at: next, route: route.concat(next) });
      }
    }
  }
}

// ================= ROBOTS =================
function goalOrientedRobot(state, memory) {
  if (memory.length === 0) {
    const parcel = state.parcels[0];
    memory =
      parcel.place !== state.place
        ? findRoute(roadGraph, state.place, parcel.place)
        : findRoute(roadGraph, state.place, parcel.address);
  }
  return { direction: memory[0], memory: memory.slice(1) };
}

function randomRobot(state) {
  return { direction: randomPick(roadGraph[state.place]), memory: [] };
}

// ================= UI ELEMENTS =================
const logDiv = document.getElementById("log");
const startBtn = document.getElementById("startBtn");
const compareBtn = document.getElementById("compareBtn");
const resultDiv = document.getElementById("result");

// ================= LOG =================
function log(msg, type = "info") {
  const time = new Date().toLocaleTimeString();

  const icons = {
    info: "ℹ️",
    move: "➡️",
    pickup: "📦",
    deliver: "✅",
    error: "❌"
  };

  const p = document.createElement("p");
  p.className = `log-item ${type}`;
  p.innerHTML = `
    <span class="time">[${time}]</span>
    <span class="icon">${icons[type] || "📝"}</span>
    <span class="msg">${msg}</span>
  `;

  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// ================= DRAW ROADS =================
function drawRoads() {
  const svg = document.getElementById("roads");
  svg.innerHTML = "";

  roads.forEach(r => {
    const [a, b] = r.split("-");
    const [x1, y1] = placePositions[a];
    const [x2, y2] = placePositions[b];

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", "road");

    svg.appendChild(line);
  });
}

// ================= HIGHLIGHT ROAD =================
function highlightRoad(from, to) {
  document.querySelectorAll(".road").forEach(r => {
    r.classList.remove("active");

    const x1 = +r.getAttribute("x1");
    const y1 = +r.getAttribute("y1");
    const x2 = +r.getAttribute("x2");
    const y2 = +r.getAttribute("y2");

    const [fx, fy] = placePositions[from];
    const [tx, ty] = placePositions[to];

    if (
      (x1 === fx && y1 === fy && x2 === tx && y2 === ty) ||
      (x1 === tx && y1 === ty && x2 === fx && y2 === fy)
    ) {
      r.classList.add("active");
    }
  });
}

// ================= PLACES =================
function createPlaces() {
  const container = document.getElementById("places");
  container.innerHTML = "";

  Object.entries(placePositions).forEach(([name, [x, y]]) => {
    const div = document.createElement("div");
    div.className = "place";
    div.dataset.place = name;
    div.style.left = x + "px";
    div.style.top = y + "px";

    let icon = "🏠";
    if (name === "Shop") icon = "🏪";
    if (name === "Post Office") icon = "🏤";
    if (name === "Farm") icon = "🌾";
    if (name === "Marketplace") icon = "🛒";
    if (name === "Amit's Home") icon = "🏡";

    div.innerHTML = `${icon}<span>${name}</span>`;
    container.appendChild(div);
  });
}

// ================= ROBOT =================
function updateRobot(state) {
  document.querySelectorAll(".place").forEach(p => {
    p.classList.toggle("robot", p.dataset.place === state.place);
  });
}

// ================= PARCELS =================
function renderParcels(state) {
  const container = document.getElementById("parcels");
  container.innerHTML = "";

  state.parcels.forEach(p => {
    const [x, y] = placePositions[p.place];
    const div = document.createElement("div");

    div.className = `parcel-icon ${p.status}`;
    div.style.left = x + "px";
    div.style.top = (p.status === "picked" ? y - 35 : y - 18) + "px";
    div.innerHTML = `📦<span>${p.status}</span>`;

    container.appendChild(div);
  });
}

// ================= DELIVERY FLASH =================
function showDeliveryFlash(place) {
  const container = document.getElementById("parcels");
  const [x, y] = placePositions[place];

  const div = document.createElement("div");
  div.className = "delivery-flash";
  div.style.left = x + "px";
  div.style.top = y + "px";
  div.textContent = "✔ Delivered";

  container.appendChild(div);
  setTimeout(() => div.remove(), 800);
}

// ================= SIMULATION =================
startBtn.onclick = () => {
  logDiv.innerHTML = "";
  let state = VillageState.random();
  let memory = [];
  let turn = 0;

  drawRoads();
  createPlaces();
  updateRobot(state);
  renderParcels(state);

  function step() {
    if (state.parcels.length === 0) {
      log(`Done in ${turn} turns`, "info");
      return;
    }

    // const action = goalOrientedRobot(state, memory);
    const action = smartMode
  ? goalOrientedRobot(state, memory)
  : randomRobot(state);

    highlightRoad(state.place, action.direction);

    state = state.move(action.direction);
    memory = action.memory;

    updateRobot(state);
    renderParcels(state);
    log(`Turn ${++turn}: ${action.direction}`, "move");

    // setTimeout(step, 700);
    setTimeout(step, speed);

  }
  step();
};

// ================= COMPARE ROBOTS =================
function runRobot(state, robot, memory) {
  for (let turn = 0; ; turn++) {
    if (state.parcels.length === 0) return turn;
    const action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
  }
}

compareBtn.onclick = () => {
  const TESTS = 50;
  let totalRandom = 0;
  let totalSmart = 0;

  resultDiv.innerHTML = `<div class="loading">⏳ Comparing Robots...</div>`;

  setTimeout(() => {
    for (let i = 0; i < TESTS; i++) {
      totalRandom += runRobot(VillageState.random(), randomRobot, []);
      totalSmart += runRobot(VillageState.random(), goalOrientedRobot, []);
    }

    resultDiv.innerHTML = `
      <div class="result-card">
        <h3>📊 Robot Performance Comparison</h3>
        🤡 Random Robot Avg: <b class="bad">${(totalRandom / TESTS).toFixed(2)}</b><br>
        🤖 Smart Robot Avg: <b class="good">${(totalSmart / TESTS).toFixed(2)}</b>
      </div>
    `;
  }, 300);
};

// ================= INIT LOG =================
log("Simulation ready", "info");
let smartMode = true;
document.getElementById("smartBtn").onclick = () => {
  smartMode = !smartMode;
  document.getElementById("smartBtn").innerText =
    smartMode ? "🧠 Smart Mode: ON" : "🎲 Random Mode: ON";

  log(`Robot mode changed to ${smartMode ? "SMART" : "RANDOM"}`, "info");
};
let speed = 700;
const speedSlider = document.getElementById("speedSlider");
speedSlider.oninput = () => {
  speed = Number(speedSlider.value);
  log(`Speed changed to ${speed}ms`, "info");
};

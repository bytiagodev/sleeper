// Each stop is planned when its station is created. Some passengers get off,
// except where the journey begins, and some people waiting get on. Each moves
// at their own moment, so compartments light up and empty one by one rather
// than all at once. Those who got off are still on the platform as the train
// pulls away.

function planPassengers(station) {
  const random = seededRandom(station.seed, 3);
  const trainLength = getTrainFrontX() - getTrainTailX();
  const tailX = station.stopX - trainLength;

  station.changes = [];
  station.people = [];

  for (const vehicle of trainVehicles) {
    if (vehicle.kind !== "carriage") continue;
    vehicle.windows.forEach((pane, i) => {
      if (random() < 0.65) return;
      const gettingOn = !pane.passenger;
      if (station.isDeparture && !gettingOn) return;
      // They stand behind their own compartment.
      const person = createPlatformPerson(tailX + vehicle.x + windowX(i), random);
      person.onPlatform = gettingOn;
      station.people.push(person);
      station.changes.push({
        pane,
        person,
        gettingOn,
        // Somebody leaving often switches the light off behind them.
        lightOff: random() < 0.5,
        at: mix(station.stopSeconds - 7, station.stopSeconds - 1.5, random()),
        done: false,
      });
    });
  }

  // A few people who are only seeing someone off, or waiting for another train.
  const bystanders = 1 + Math.floor(random() * 3);
  for (let i = 0; i < bystanders; i++) {
    const person = createPlatformPerson(station.x - 25 + random() * 50, random);
    person.onPlatform = true;
    station.people.push(person);
  }
}

function createPlatformPerson(x, random) {
  return {
    x: x + (random() - 0.5) * 1.5,
    z: platformFrontZ + 1.5 + random() * 2,
    height: 1.6 + random() * 0.25,
    hasCase: random() < 0.6,
  };
}

function updatePassengers(station, dt) {
  station.secondsStopped += dt;
  for (const change of station.changes) {
    if (change.done || station.secondsStopped < change.at) continue;
    change.done = true;
    change.person.onPlatform = !change.gettingOn;
    change.pane.passenger = change.gettingOn;
    if (change.gettingOn) {
      change.pane.state = "lit";
    } else if (change.lightOff) {
      change.pane.state = "dark";
    }
  }
}

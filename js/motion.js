// How the train moves. Speeds are in metres per second.
//
// The train is always in one of three states:
//   running:  easing towards a cruising speed that drifts a little
//   braking:  slowing down to stop exactly at a station's stopping mark
//   stopped:  standing at the platform until it is time to leave
const cruiseSpeed = 8;
const acceleration = 0.6;
const brakingDeceleration = 0.5;
const stationStopSeconds = 12;

const motion = { speed: cruiseSpeed, clock: 0, state: "running", secondsToWait: 0 };

// The target drifts slowly around cruising speed, so the ride never feels
// mechanical.
function getTargetSpeed(seconds) {
  const drift = Math.sin(seconds * 0.15) * 0.12 + Math.sin(seconds * 0.37) * 0.03;
  return cruiseSpeed * (1 + drift);
}

// How far the train needs to stop from a given speed. A train slowing down
// at a steady rate covers v² / 2a metres before it comes to rest.
function brakingDistance(speed) {
  return (speed * speed) / (2 * brakingDeceleration);
}

function updateMotion(dt) {
  motion.clock += dt;
  const station = segment.station;

  if (motion.state === "running") {
    if (station && !station.visited) {
      const distanceToStop = station.stopX - getTrainFrontX();
      if (distanceToStop > 0 && distanceToStop <= brakingDistance(motion.speed)) {
        motion.state = "braking";
      }
    }
    const difference = getTargetSpeed(motion.clock) - motion.speed;
    const maxChange = acceleration * dt;
    motion.speed += Math.max(-maxChange, Math.min(maxChange, difference));
  }

  if (motion.state === "braking") {
    const distanceToStop = station.stopX - getTrainFrontX();
    if (distanceToStop < 0.05 || motion.speed < 0.05) {
      motion.speed = 0;
      motion.state = "stopped";
      motion.secondsToWait = stationStopSeconds;
      station.visited = true;
    } else {
      // The same formula turned around: the exact deceleration that brings
      // the train to rest in the distance that is left. Using it every frame
      // means the train always stops right on the mark.
      const deceleration = (motion.speed * motion.speed) / (2 * distanceToStop);
      motion.speed = Math.max(0, motion.speed - deceleration * dt);
    }
  }

  if (motion.state === "stopped") {
    motion.secondsToWait -= dt;
    if (motion.secondsToWait <= 0) motion.state = "running";
  }

  travelled += motion.speed * dt;
}

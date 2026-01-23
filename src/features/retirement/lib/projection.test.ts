import {
  getProjectionErrorKind,
  getProjectionStatus,
} from "@/features/retirement/lib/projection";

const onTrack = getProjectionStatus(3200, 3100);
const shortfall = getProjectionStatus(2500, 3100);

if (onTrack !== "onTrack") {
  throw new Error("Expected onTrack status for higher income.");
}

if (shortfall !== "shortfall") {
  throw new Error("Expected shortfall status for lower income.");
}

const notAchievableKind = getProjectionErrorKind(
  new Error("Retirement goal is not achievable with current inputs"),
);

if (notAchievableKind !== "notAchievable") {
  throw new Error("Expected notAchievable error kind.");
}

const unknownKind = getProjectionErrorKind(new Error("Something else failed"));

if (unknownKind !== "unknown") {
  throw new Error("Expected unknown error kind for other errors.");
}

const emptyKind = getProjectionErrorKind(null);

if (emptyKind !== null) {
  throw new Error("Expected null error kind when no error is provided.");
}

import {
  getScenarioLimitMessage,
  isScenarioLimitReached,
  SCENARIO_LIMIT,
} from "@/features/retirement/lib/scenarios";

if (isScenarioLimitReached(SCENARIO_LIMIT - 1)) {
  throw new Error("Expected limit to be false below the max.");
}

if (!isScenarioLimitReached(SCENARIO_LIMIT)) {
  throw new Error("Expected limit to be true at the max.");
}

const noMessage = getScenarioLimitMessage(SCENARIO_LIMIT - 1);
if (noMessage !== null) {
  throw new Error("Expected no limit message when under the max.");
}

const message = getScenarioLimitMessage(SCENARIO_LIMIT);
if (!message || !message.includes(String(SCENARIO_LIMIT))) {
  throw new Error("Expected limit message when at the max.");
}

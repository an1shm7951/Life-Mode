import type {
  ConnectionIntent,
  LifeModeId,
  UserProfile,
} from "./types";
import { lifeModes } from "./data";

export function canUseConnectionIntent(
  user: UserProfile,
  modeId: LifeModeId,
  intent: ConnectionIntent,
) {
  const mode = lifeModes.find((item) => item.id === modeId);

  if (!mode) {
    return { allowed: false, reason: "Mode does not exist." };
  }

  if (intent === "dating" && user.ageBand !== "adult") {
    return { allowed: false, reason: "Dating is only available for 18+ users." };
  }

  if (!mode.allowedIntents.includes(intent)) {
    return {
      allowed: false,
      reason: "This mode does not allow that connection type.",
    };
  }

  return { allowed: true, reason: "Allowed." };
}

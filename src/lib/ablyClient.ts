import Ably from "ably";

let ablyClient: Ably.Realtime | null = null;

export const getAblyClient = () => {
  if (typeof window === "undefined") return null;
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({ authUrl: "/api/ably/auth" });
  }
  return ablyClient;
};
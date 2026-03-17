import { createLovableConfig } from "lovable-agent-playwright-config/config";

export default createLovableConfig({
  use: {
    baseURL: "http://localhost:8080",
  },
});

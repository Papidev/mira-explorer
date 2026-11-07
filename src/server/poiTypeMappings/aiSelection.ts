export type AiSelection = {
  mode: "local" | "cloud";
  provider: "ollama" | "gemini";
  model: string;
};

import { ServerBlockRegistry } from "@/data/templates/registry";

export function promptRewriteText(input: {
  text: string; instructions?: string; language?: string;
}) {
  const lang = input.language || "cs";
  return [
    `Rewrite the following text in ${lang}.`,
    input.instructions ? `Style instructions: ${input.instructions}` : "",
    "Keep meaning, improve clarity and conversion.",
    "Return ONLY the rewritten text.",
    "",
    "TEXT:",
    input.text,
  ].join("\n");
}

export function promptGenerateSection(input: {
  type: string;
  description: string;
  currentData?: any;
}) {
  const def = ServerBlockRegistry[input.type as keyof typeof ServerBlockRegistry];
  const example = JSON.stringify(def?.defaultData ?? {}, null, 2);
  return [
    `Generate JSON data for block type "${input.type}".`,
    `Use this example shape as reference (keys must exist, types must match):`,
    example,
    input.currentData ? `Current data to improve (merge & keep keys):\n${JSON.stringify(input.currentData)}` : "",
    `User description:\n${input.description}`,
    "",
    "RULES:",
    "- Output STRICT JSON matching the example keys/types.",
    "- Fill persuasive copy in Czech.",
    "- Do not add unknown keys.",
  ].join("\n");
}

export function promptGeneratePage(input: {
  description: string;
  allowedTypes: string[];
}) {
  // pro AI: podoba PageDocument
  const pageShape = {
    version: 1,
    sections: [
      { id: "string", type: "one-of-allowedTypes", version: 1, data: "see registry shape" }
    ]
  };
  const regSummary = input.allowedTypes.map(t => {
    const def = ServerBlockRegistry[t as keyof typeof ServerBlockRegistry];
    return { type: t, version: def?.version ?? 1, example: def?.defaultData ?? {} };
  });

  return [
    "Create a landing page JSON (PageDocument).",
    "JSON shape:",
    JSON.stringify(pageShape, null, 2),
    "Block registry (examples):",
    JSON.stringify(regSummary, null, 2),
    "User description:",
    input.description,
    "",
    "RULES:",
    "- Choose 3–6 sections from allowedTypes.",
    "- Fill persuasive Czech copy.",
    "- Keep JSON minimal and valid; do not include comments.",
  ].join("\n");
}

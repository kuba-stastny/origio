export type BlockType =
  | "hero_simple"
  | "features-grid"
  | "testimonials"
  | "pricing"
  | "faq"
  | "gallery";

export type BlockInstance = {
  id: string;
  type: BlockType;
  version?: number;            // ← nově: aktuální verze dat bloku
  data: any;
  title: string
};

export type PageDocument = {
  version: number;             // verze dokumentu jako celku (zatím 1)
  sections: BlockInstance[];
  settings?: Record<string, any>;
};

// Definice bloku v registru
export type BlockDefinition = {
  version: number; // nejnovější verze schématu
  defaultData: any;
  migrations?: {
    // migrace z verze `n` na `n+1`
    [fromVersion: number]: (data: any) => any;
  };
  Renderer: (props: { block: BlockInstance }) => JSX.Element;
};

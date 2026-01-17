export type PageSettings = {
    title?: string;
    description?: string;
    ogImage?: string;
    keywords?: string[];     // ukládej pole, ve formuláři si to můžeš psát čárkami a převést
    noindex?: boolean;       // volitelné do budoucna
    // můžeš rozšířit: theme, analytics apod.
  };
  
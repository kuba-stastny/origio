"use client";

import React, { createContext, useContext } from "react";

export type MediaType = "image" | "video";

export type OpenMediaOpts = {
  type?: MediaType;
  allowed?: readonly MediaType[];
};

type Ctx = {
  draft: any;
  changeAt: (path: string, v: any) => void;
  getAt: (path?: string) => any;

  openMediaFor: (path: string, opts?: OpenMediaOpts) => void;

  bucket: string;
  folder: string;
};

const EditorCtx = createContext<Ctx | null>(null);

export function useEditorCtx() {
  const c = useContext(EditorCtx);
  if (!c) throw new Error("EditorContext is missing");
  return c;
}

export function EditorProvider({
  value,
  children,
}: {
  value: Ctx;
  children: React.ReactNode;
}) {
  return <EditorCtx.Provider value={value}>{children}</EditorCtx.Provider>;
}

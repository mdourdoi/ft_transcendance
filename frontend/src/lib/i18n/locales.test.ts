import { describe, expect, it } from "vitest";
import en from "$lib/i18n/locales/en.json";
import fr from "$lib/i18n/locales/fr.json";

type Tree = { [key: string]: string | Tree };

function keys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  );
}

describe("locales", () => {
  it("have the same keys in English and French", () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
  });

  it("have no empty translation", () => {
    for (const tree of [en, fr] as Tree[]) {
      const flat = JSON.stringify(tree);
      expect(flat).not.toMatch(/:""/);
    }
  });
});

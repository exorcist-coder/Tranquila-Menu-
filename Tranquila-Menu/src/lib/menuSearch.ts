import type { Item, Group, Option } from "./catalog";
import { normalize, type Selection } from "./pricing";

export type MenuSearchHit = {
  item: Item;
  label: string;
  subtitle: string;
  selection: Selection;
  option?: { groupId: string; optionId: string };
  score: number;
};

const fold = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1]! + 1, previous[j]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = next;
  }
  return previous[b.length]!;
}

function matchScore(value: string, query: string, allowTypos = false): number {
  const name = fold(value);
  if (!name || !query) return 0;
  if (name === query) return 110;
  const terms = query.split(" ");
  const words = name.split(" ");
  // Only match whole words or the beginning of a word. "rice" must not match "price".
  if (words[0]?.startsWith(query)) return 96;
  if (words.some(word => word === query)) return 90;
  if (terms.every(term => words.some(word => word.startsWith(term)))) return 78;
  // Typo matching is a fallback, not a source of unrelated suggestions.
  // Short queries such as "rice" and "spa" should never trigger edit-distance matches.
  if (allowTypos && terms.every(term =>
    term.length >= 5 && words.some(word => word.length >= 5 && distance(term, word) <= (term.length >= 8 ? 2 : 1))
  )) return 48;
  return 0;
}

function selectionFor(item: Item, group: Group, option: Option): Selection {
  const selection: Selection = {};
  const seen = new Set<string>();
  const activate = (groupId: string, optionId: string) => {
    if (seen.has(groupId)) return;
    seen.add(groupId);
    const target = item.groups.find(g => g.id === groupId);
    if (!target) return;
    const choice = target.options.find(o => o.id === optionId);
    if (!choice) return;
    const condition = choice.when ?? target.when;
    if (condition?.in.length) activate(condition.group, condition.in[0]!);
    selection[groupId] = optionId;
  };
  activate(group.id, option.id);
  return normalize(item, selection);
}

/** Branch-agnostic search over the published items actually loaded for this hotel. */
export function searchMenu(items: Item[], categories: { id: string; label: string }[], rawQuery: string): MenuSearchHit[] {
  const q = fold(rawQuery);
  if (!q) return [];
  const directHits = collect(false);
  return directHits.length ? directHits : collect(true);

  function collect(allowTypos: boolean): MenuSearchHit[] {
  const hits: MenuSearchHit[] = [];
  for (const item of items) {
    const category = categories.find(c => c.id === item.category)?.label ?? "";
    const nameScore = matchScore(item.name, q, allowTypos);
    const descriptionScore = matchScore(item.description, q, allowTypos);
    const detailScore = Math.max(0, ...(item.details ?? []).map(d => matchScore(d.value, q, allowTypos)));
    const categoryScore = fold(category) === q ? 40 : 0;
    const parentScore = Math.max(nameScore, descriptionScore ? descriptionScore - 15 : 0, detailScore ? detailScore - 20 : 0, categoryScore);
    if (parentScore > 0) hits.push({ item, label: item.name, subtitle: category, selection: {}, score: parentScore });
    for (const group of item.groups) {
      for (const option of group.options) {
        const score = matchScore(option.label, q, allowTypos);
        if (!score) continue;
        const selection = selectionFor(item, group, option);
        if (selection[group.id] !== option.id) continue;
        hits.push({
          item,
          label: option.label,
          subtitle: `${item.name} · ${group.label}`,
          selection,
          option: { groupId: group.id, optionId: option.id },
          score: score + 5,
        });
      }
    }
  }
  return hits.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  }
}

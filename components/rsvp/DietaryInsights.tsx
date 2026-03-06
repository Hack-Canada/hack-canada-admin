"use client";

import { useMemo } from "react";
import { UtensilsCrossed } from "lucide-react";

type DietCount = { diet: string | null; count: number };

type Props = {
  dietaryCounts: DietCount[];
  total: number;
};

// Keyword → display label mapping (order matters — first match wins)
const DIET_KEYWORDS: { label: string; keywords: string[] }[] = [
  { label: "Vegan", keywords: ["vegan"] },
  { label: "Vegetarian", keywords: ["vegetarian", "veggie"] },
  { label: "Gluten-Free", keywords: ["gluten"] },
  { label: "Halal", keywords: ["halal"] },
  { label: "Kosher", keywords: ["kosher"] },
  { label: "Nut Allergy", keywords: ["nut", "peanut", "tree nut"] },
  { label: "Dairy-Free", keywords: ["dairy", "lactose", "milk"] },
  { label: "Shellfish Allergy", keywords: ["shellfish", "shrimp", "crab", "lobster"] },
  { label: "Egg Allergy", keywords: ["egg"] },
  { label: "Soy Allergy", keywords: ["soy"] },
];

function normalizeEntries(dietaryCounts: DietCount[]) {
  const categoryMap = new Map<string, number>();
  let noneCount = 0;
  const rawOther: { text: string; count: number }[] = [];

  for (const { diet, count } of dietaryCounts) {
    const text = diet?.trim() ?? "";
    if (!text || text.toLowerCase() === "none" || text.toLowerCase() === "n/a" || text === "-") {
      noneCount += count;
      continue;
    }

    const lower = text.toLowerCase();
    let matched = false;
    for (const { label, keywords } of DIET_KEYWORDS) {
      if (keywords.some((k) => lower.includes(k))) {
        categoryMap.set(label, (categoryMap.get(label) ?? 0) + count);
        matched = true;
        break;
      }
    }
    if (!matched) {
      rawOther.push({ text, count });
    }
  }

  const categories = Array.from(categoryMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return { noneCount, categories, rawOther };
}

const CATEGORY_COLORS: Record<string, string> = {
  "Vegan": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Vegetarian": "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  "Gluten-Free": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Halal": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "Kosher": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Nut Allergy": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "Dairy-Free": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Shellfish Allergy": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Egg Allergy": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "Soy Allergy": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const DietaryInsights = ({ dietaryCounts, total }: Props) => {
  const { noneCount, categories, rawOther } = useMemo(
    () => normalizeEntries(dietaryCounts),
    [dietaryCounts],
  );

  const withRestrictions = total - noneCount;
  const pct = total > 0 ? Math.round((withRestrictions / total) * 100) : 0;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <UtensilsCrossed className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Dietary Restrictions</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {withRestrictions} of {total} respondents ({pct}%)
        </span>
      </div>

      {/* Summary bar */}
      <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map(({ label, count }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                CATEGORY_COLORS[label] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {label}
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-white/10">
                {count}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Uncategorized free-text entries */}
      {rawOther.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none hover:text-foreground">
            {rawOther.length} other response{rawOther.length !== 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 space-y-1 pl-2">
            {rawOther
              .sort((a, b) => b.count - a.count)
              .map(({ text, count }) => (
                <li key={text} className="flex items-center justify-between gap-4">
                  <span className="truncate">{text}</span>
                  <span className="shrink-0 font-medium text-foreground">×{count}</span>
                </li>
              ))}
          </ul>
        </details>
      )}

      {categories.length === 0 && rawOther.length === 0 && (
        <p className="text-xs text-muted-foreground">No dietary restrictions reported.</p>
      )}
    </div>
  );
};

export default DietaryInsights;

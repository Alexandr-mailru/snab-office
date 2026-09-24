import type { Category } from "@prisma/client";

/** Category row with nested children (any depth). */
export type CategoryTreeNode = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageHint?: string | null;
  sortOrder?: number;
  parentId?: string | null;
  children: CategoryTreeNode[];
  _count?: { products: number };
};

type FlatCategory = Pick<
  Category,
  "id" | "slug" | "name" | "description" | "imageHint" | "sortOrder" | "parentId"
> & {
  _count?: { products: number };
};

/** Build nested tree from flat category rows. */
export function buildCategoryTree(rows: FlatCategory[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      imageHint: row.imageHint,
      sortOrder: row.sortOrder,
      parentId: row.parentId,
      children: [],
      _count: row._count,
    });
  }
  const roots: CategoryTreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else if (!node.parentId) {
      roots.push(node);
    }
  }
  const sortRec = (nodes: CategoryTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "ru"),
    );
    for (const n of nodes) sortRec(n.children);
  };
  sortRec(roots);
  return roots;
}

/** Collect this category id + all descendant ids. */
export function collectCategoryIds(node: {
  id: string;
  children?: { id: string; children?: unknown[] }[];
}): string[] {
  const ids = [node.id];
  for (const child of node.children ?? []) {
    ids.push(...collectCategoryIds(child as { id: string; children?: { id: string }[] }));
  }
  return ids;
}

/** Find path of open node ids from root to active slug. */
export function findCategoryPathIds(
  roots: CategoryTreeNode[],
  activeSlug?: string,
): string[] {
  if (!activeSlug) return [];
  function walk(nodes: CategoryTreeNode[], trail: string[]): string[] | null {
    for (const n of nodes) {
      const next = [...trail, n.id];
      if (n.slug === activeSlug) return next;
      const hit = walk(n.children, next);
      if (hit) return hit;
    }
    return null;
  }
  return walk(roots, []) ?? [];
}

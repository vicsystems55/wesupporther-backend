export const slugify = (value) => String(value ?? "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 200)
  .replace(/-+$/g, "");

export const generateUniqueSlug = async ({ model, value, excludeId }) => {
  const base = slugify(value) || "post";
  let candidate = base;
  let suffix = 2;

  while (await model.findFirst({
    where: {
      slug: candidate,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  })) {
    const suffixText = `-${suffix}`;
    candidate = `${base.slice(0, 220 - suffixText.length).replace(/-+$/g, "")}${suffixText}`;
    suffix += 1;
  }

  return candidate;
};

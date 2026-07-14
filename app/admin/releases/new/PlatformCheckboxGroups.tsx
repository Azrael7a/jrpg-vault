type Platform = {
  id: number;
  name: string;
  manufacturer: string | null;
  generation: number | null;
  is_legacy: boolean;
  display_order: number;
};

type PlatformCheckboxGroupsProps = {
  platforms: Platform[];
  inputName?: string;
  selectedIds?: number[];
};

function comparePlatforms(a: Platform, b: Platform) {
  if (a.display_order !== b.display_order) {
    return a.display_order - b.display_order;
  }

  return a.name.localeCompare(b.name, "fr");
}

export default function PlatformCheckboxGroups({
  platforms,
  inputName = "platform_ids",
  selectedIds = [],
}: PlatformCheckboxGroupsProps) {
  const selectedIdSet = new Set(selectedIds);
  const currentPlatforms = platforms
    .filter((platform) => !platform.is_legacy)
    .sort(comparePlatforms);
  const legacyPlatforms = platforms
    .filter((platform) => platform.is_legacy)
    .sort(comparePlatforms);

  function renderGroup(title: string, items: Platform[]) {
    if (items.length === 0) {
      return null;
    }

    return (
      <fieldset className="rounded-xl border border-slate-800 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-200">
          {title}
        </legend>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((platform) => (
            <label
              key={platform.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 hover:border-violet-500/50"
            >
              <input
                type="checkbox"
                name={inputName}
                value={platform.id}
                defaultChecked={selectedIdSet.has(platform.id)}
                className="mt-1"
              />

              <span>
                <span className="block font-medium text-slate-100">
                  {platform.name}
                </span>

                <span className="mt-1 block text-xs text-slate-400">
                  {[
                    platform.manufacturer,
                    platform.generation
                      ? `Génération ${platform.generation}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <div className="grid gap-4">
      {renderGroup("Supports actuels", currentPlatforms)}
      {renderGroup("Supports rétro", legacyPlatforms)}
    </div>
  );
}

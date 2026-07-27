export type GameJrpgMetadataValue = {
  original_title: string;
  country_of_origin: string;
  game_mode: string;
  battle_system: string;
  party_structure: string;
  progression_system: string;
  narrative_structure: string;
  exploration_style: string;
  difficulty: string;
  main_story_hours: string;
  available_languages: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initialValue: GameJrpgMetadataValue;
};

const gameModes = [
  ["", "Non renseigné"],
  ["solo", "Solo"],
  ["multiplayer", "Multijoueur"],
  ["solo_multiplayer", "Solo et multijoueur"],
  ["online", "Principalement en ligne"],
] as const;

const battleSystems = [
  ["", "Non renseigné"],
  ["turn_based", "Tour par tour"],
  ["active_time", "Temps actif / ATB"],
  ["action", "Action en temps réel"],
  ["tactical", "Tactique au tour par tour"],
  ["real_time", "Temps réel"],
  ["hybrid", "Hybride"],
  ["other", "Autre"],
] as const;

const partyStructures = [
  ["", "Non renseigné"],
  ["fixed_party", "Groupe prédéfini"],
  ["recruitable_party", "Personnages recrutables"],
  ["customizable_party", "Groupe personnalisable"],
  ["solo_character", "Personnage unique"],
  ["rotating_party", "Groupe tournant"],
  ["other", "Autre"],
] as const;

const progressionSystems = [
  ["", "Non renseigné"],
  ["levels_equipment", "Niveaux et équipement"],
  ["jobs", "Classes et métiers"],
  ["skill_tree", "Arbres de compétences"],
  ["crafting", "Artisanat et équipement"],
  ["hybrid", "Système hybride"],
  ["other", "Autre"],
] as const;

const narrativeStructures = [
  ["", "Non renseigné"],
  ["linear", "Linéaire"],
  ["branching", "À embranchements"],
  ["episodic", "Épisodique"],
  ["open", "Ouverte"],
  ["other", "Autre"],
] as const;

const explorationStyles = [
  ["", "Non renseigné"],
  ["world_map", "Carte du monde"],
  ["zones", "Zones reliées"],
  ["open_world", "Monde ouvert"],
  ["hubs", "Hubs et missions"],
  ["dungeon_crawler", "Donjons / dungeon crawler"],
  ["other", "Autre"],
] as const;

const difficulties = [
  ["", "Non renseigné"],
  ["accessible", "Accessible"],
  ["standard", "Standard"],
  ["demanding", "Exigeante"],
  ["customizable", "Personnalisable"],
  ["other", "Variable / autre"],
] as const;

function SelectField({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="rounded-xl border px-4 py-3"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || "empty"} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function GameJrpgMetadataForm({ action, initialValue }: Props) {
  return (
    <form action={action} className="mt-8">
      <section className="jrpg-card grid gap-6 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
            Profil éditorial
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Informations JRPG
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Ces données structurent la fiche publique. Toute information laissée vide
            sera automatiquement masquée pour les visiteurs.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Titre original
            </span>
            <input
              name="original_title"
              defaultValue={initialValue.original_title}
              className="rounded-xl border px-4 py-3"
              placeholder="サクラ大戦"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Pays ou territoire d’origine
            </span>
            <input
              name="country_of_origin"
              defaultValue={initialValue.country_of_origin}
              className="rounded-xl border px-4 py-3"
              placeholder="Japon"
            />
          </label>

          <SelectField
            name="game_mode"
            label="Mode de jeu"
            value={initialValue.game_mode}
            options={gameModes}
          />

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Durée de l’histoire principale
            </span>
            <div className="flex items-center gap-3">
              <input
                name="main_story_hours"
                type="number"
                min="1"
                max="999"
                defaultValue={initialValue.main_story_hours}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="35"
              />
              <span className="text-sm text-slate-400">heures</span>
            </div>
          </label>

          <SelectField
            name="battle_system"
            label="Système de combat"
            value={initialValue.battle_system}
            options={battleSystems}
          />

          <SelectField
            name="party_structure"
            label="Structure du groupe"
            value={initialValue.party_structure}
            options={partyStructures}
          />

          <SelectField
            name="progression_system"
            label="Progression"
            value={initialValue.progression_system}
            options={progressionSystems}
          />

          <SelectField
            name="narrative_structure"
            label="Structure narrative"
            value={initialValue.narrative_structure}
            options={narrativeStructures}
          />

          <SelectField
            name="exploration_style"
            label="Exploration"
            value={initialValue.exploration_style}
            options={explorationStyles}
          />

          <SelectField
            name="difficulty"
            label="Difficulté générale"
            value={initialValue.difficulty}
            options={difficulties}
          />

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-200">
              Langues et sous-titres
            </span>
            <input
              name="available_languages"
              defaultValue={initialValue.available_languages}
              className="rounded-xl border px-4 py-3"
              placeholder="Japonais ; sous-titres français et anglais"
            />
          </label>
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-5">
          <button type="submit" className="jrpg-button-primary px-6 py-3">
            Enregistrer les informations JRPG
          </button>
        </div>
      </section>
    </form>
  );
}

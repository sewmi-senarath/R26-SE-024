import { SectionName } from "@/src/types/games.types";

// Clinically-grounded mapping from each MMSE domain (which every game in
// GAME_CONFIGS already targets via `targetSection`) to the brain region(s)
// most associated with that function. This is the standard association used
// in neuropsychological literature around the MMSE - not something specific
// to this app - which is what makes it a defensible thing to show a
// caregiver/family member or cite in a report.
export interface BrainAreaInfo {
  section: SectionName;
  area: string;
  shortArea: string;
  description: string;
  color: string;
}

export const BRAIN_AREA_BY_SECTION: Record<SectionName, BrainAreaInfo> = {
  Orientation: {
    section: "Orientation",
    area: "Prefrontal Cortex & Hippocampus",
    shortArea: "Prefrontal Cortex",
    description: "Awareness of time, place, and context - coordinated by the frontal lobe and hippocampus.",
    color: "#0EA5E9",
  },
  Registration: {
    section: "Registration",
    area: "Hippocampus (Medial Temporal Lobe)",
    shortArea: "Hippocampus",
    description: "Immediate encoding of new information - the hippocampus's core function.",
    color: "#8B5CF6",
  },
  Attention: {
    section: "Attention",
    area: "Prefrontal Cortex & Parietal Lobe",
    shortArea: "Prefrontal Cortex",
    description: "Sustained focus and working memory - frontal-parietal attention network.",
    color: "#F59E0B",
  },
  Recall: {
    section: "Recall",
    area: "Hippocampus & Temporal Lobe",
    shortArea: "Temporal Lobe",
    description: "Delayed recall of previously learned information, plus face/identity recognition.",
    color: "#EC4899",
  },
  Language: {
    section: "Language",
    area: "Broca's & Wernicke's Areas (Frontal/Temporal Lobe)",
    shortArea: "Language Centers",
    description: "Word finding, comprehension, and expression - classic language centers of the brain.",
    color: "#F43F5E",
  },
};

export function getBrainAreaForSection(section: string): BrainAreaInfo {
  return (
    BRAIN_AREA_BY_SECTION[section as SectionName] ?? {
      section: section as SectionName,
      area: "General Cognition",
      shortArea: "General Cognition",
      description: "Broad cognitive function not tied to one specific region.",
      color: "#64748B",
    }
  );
}

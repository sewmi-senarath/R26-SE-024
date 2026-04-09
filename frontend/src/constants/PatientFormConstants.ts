export type SelectOption = {
  label: string;
  value: string;
};

export const RELATION_OPTIONS: SelectOption[] = [
  { label: "Son", value: "son" },
  { label: "Daughter", value: "daughter" },
  { label: "Wife", value: "wife" },
  { label: "Husband", value: "husband" },
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" },
  { label: "Friend", value: "friend" },
  { label: "Other", value: "other" },
];

export const COUNTRY_OPTIONS: SelectOption[] = [
  { label: "Sri Lanka", value: "sri-lanka" },
  { label: "India", value: "india" },
  { label: "UAE", value: "uae" },
  { label: "Qatar", value: "qatar" },
  { label: "Saudi Arabia", value: "saudi-arabia" },
  { label: "UK", value: "uk" },
  { label: "USA", value: "usa" },
  { label: "Australia", value: "australia" },
  { label: "Canada", value: "canada" },
];

export const FAVORITE_PLACES: SelectOption[] = [
  { label: "Home", value: "home" },
  { label: "Temple", value: "temple" },
  { label: "Beach", value: "beach" },
  { label: "Village", value: "village" },
  { label: "Park", value: "park" },
  { label: "Other", value: "other" },
];

export const FAVORITE_SPORTS: SelectOption[] = [
  { label: "Cricket", value: "cricket" },
  { label: "Football", value: "football" },
  { label: "Volleyball", value: "volleyball" },
  { label: "Badminton", value: "badminton" },
  { label: "Athletics", value: "athletics" },
  { label: "Other", value: "other" },
];

export const LANGUAGES: SelectOption[] = [
  { label: "Sinhala", value: "sinhala" },
  { label: "Tamil", value: "tamil" },
  { label: "English", value: "english" },
  { label: "Hindi", value: "hindi" },
];

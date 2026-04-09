export interface FamilyMember {
    id: string;
    name: string;
    photo: string | null;
    relation: string;
}

export interface LifeEvent {
    id: string;
    title: string;
}

export interface FoodItem {
    id: string;
    name: string;
}

export interface Step1Data {
    fullName: string;
    age: string;
    gender: string;
}

export interface Step2Data {
    familyMembers: FamilyMember[];
    lifeEvents: LifeEvent[];
    countriesLived: string;
    occupations: string;
}

export interface Step3Data {
    favoritePhotos: string[];
    favoritePlaces: string;
    favoritePlacesText: string;
    festivalsCelebrated: string;
    foodsPreferred: FoodItem[];
    preferredSports: string;
    preferredSportsText: string;
    languagesPreferred: string;
}
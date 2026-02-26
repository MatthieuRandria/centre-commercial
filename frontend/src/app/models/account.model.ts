export interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  photoUrl?: string;
  fidelitePoints: number;
  fideliteNextLevel: number;
  fideliteNextLevelName: string;
}
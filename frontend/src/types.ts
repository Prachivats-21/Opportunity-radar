export type Opportunity = {
  id: string; title: string; organization: string; category: string; summary: string; description: string;
  skills: string[]; eligible_years: string[]; eligible_fields: string[]; location: string; mode: string;
  team_min: number | null; team_max: number | null; deadline: string | null; start_date: string | null;
  source_url: string; source_name: string; last_verified: string | null; status: string; notes: string;
}
export type Profile = {
  year: string; field: string; skills: string[]; interests: string[]; preferred_categories: string[];
  preferred_mode: string; location: string; team_size: number | null;
}
export type MatchResult = { opportunity: Opportunity; score: number; eligibility: string; reasons: string[]; skill_gaps: string[]; explanation: string }

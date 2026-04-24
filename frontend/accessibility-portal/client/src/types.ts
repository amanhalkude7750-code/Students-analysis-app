export type Language = 'en' | 'es' | 'fr' | 'de';

export interface DetectionResult {
  label: string;
  confidence: number;
}

/**
 * Type Definitions for Legal Pages
 *
 * This file contains type definitions for legal content structure
 * used in Privacy Policy and Terms of Service pages.
 */

/**
 * Reprezentuje pojedynczą podsekcję dokumentu prawnego
 */
export interface LegalSubsection {
  /** Opcjonalny tytuł podsekcji (h3) */
  title?: string;
  /** Akapity tekstu */
  paragraphs: string[];
  /** Opcjonalna lista punktowana */
  list?: string[];
}

/**
 * Reprezentuje główną sekcję dokumentu prawnego
 */
export interface LegalSection {
  /** Unikalny identyfikator dla anchor links */
  id: string;
  /** Tytuł sekcji (h2) */
  title: string;
  /** Zawartość sekcji - string dla prostego tekstu lub tablica podsekcji */
  content: string | LegalSubsection[];
}

/**
 * Props dla komponentu LegalContent
 */
export interface LegalContentProps {
  /** Główny tytuł dokumentu (h1) */
  title: string;
  /** Data ostatniej aktualizacji w formacie czytelnym */
  lastUpdated: string;
  /** Tablica sekcji dokumentu */
  sections: LegalSection[];
  /** Czy wyświetlać automatycznie generowany spis treści */
  showTableOfContents?: boolean;
}

/**
 * Props dla LegalLayout
 */
export interface LegalLayoutProps {
  /** Tytuł strony dla tagu <title> */
  title: string;
  /** Opis strony dla meta description */
  description: string;
}

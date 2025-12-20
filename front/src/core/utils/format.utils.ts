// Formatting utility functions

/**
 * Format work title with year
 * Format: 「'title'」, year
 */
export const formatWorkTitle = (title: string, year?: number): string => {
  return `「'${title}'」${year ? `, ${year}` : ''}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format date to locale string
 */
export const formatDate = (date: Date, locale: string = 'ko-KR'): string => {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format exhibition description
 */
export const formatExhibitionDescription = (description: {
  exhibitionType: string;
  venue: string;
  year: number;
}): string => {
  return `${description.exhibitionType}, ${description.venue}, ${description.year}`;
};

/**
 * Module-level store to track which categories have been clicked by the user.
 * This persists across component unmount/remount during navigation.
 *
 * Key: category ID or keyword ID
 * Value: true if user has clicked it (animation should run)
 */

const clickedCategories = new Set<string>();

export const categoryAnimationStore = {
  /**
   * Mark a category as clicked by user
   */
  markAsClicked(categoryId: string): void {
    clickedCategories.add(categoryId);
  },

  /**
   * Check if category has been clicked by user
   */
  hasBeenClicked(categoryId: string): boolean {
    return clickedCategories.has(categoryId);
  },

  /**
   * Clear all clicked state (e.g., on app restart)
   */
  clear(): void {
    clickedCategories.clear();
  },
};
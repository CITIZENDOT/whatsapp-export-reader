// A set of vibrant colors suitable for text
const USER_COLORS = [
  '#E53935', // Red
  '#8E24AA', // Purple
  '#1E88E5', // Blue
  '#00897B', // Teal
  '#43A047', // Green
  '#FFB300', // Amber
  '#F4511E', // Deep Orange
  '#6D4C41', // Brown
  '#546E7A', // Blue Grey
  '#D81B60', // Pink
  '#5E35B1', // Deep Purple
  '#3949AB', // Indigo
  '#039BE5', // Light Blue
  '#00ACC1', // Cyan
  '#7CB342', // Light Green
  '#C0CA33', // Lime
  '#FDD835', // Yellow
  '#FB8C00', // Orange
];

/**
 * Generates a consistent color for a username
 * @param username The username to generate a color for
 * @returns A hex color code
 */
export function getUserColor(username: string): string {
  // Simple hash function to get a consistent index
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to pick a color from our array
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
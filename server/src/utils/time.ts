import { isAfter, subMinutes } from 'date-fns';

/**
 * Checks if the provided date is still valid based on the current time and a specified number of minutes.
 *
 * @param {Date} date - The date to check (in UTC).
 * @param {number} thresholdMinutes - The threshold in minutes to determine expiration.
 * @returns {boolean} Returns true if the date is within the threshold; otherwise, false.
 */

const isValidDate = (date: Date, thresholdMinutes: number): boolean => {
  const expirationDate = subMinutes(new Date(), thresholdMinutes);
  return isAfter(date, expirationDate);
};

export { isValidDate };

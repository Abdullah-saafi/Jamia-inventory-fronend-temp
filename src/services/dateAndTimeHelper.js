export const pakistanDateTimeToISO = (value) => {
  if (!value) return null;

  return `${value}:00+05:00`;
};
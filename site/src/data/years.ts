// How long MeWriT's practice has run, in one place for every page that says it: counted from 2004
// (twenty-two years in July 2026, the deck's figure), so it goes up by one each new year. A page carries
// the count for the year it was built in; the house (src/scripts/house/film.js) also brings its count up
// to the reader's own year when it loads, so it turns over on the first of January without a rebuild.
export const PRACTICE_SINCE = 2004;
export const yearsIn = (year: number) => year - PRACTICE_SINCE;
export const YEARS = yearsIn(new Date().getFullYear());

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
// a number in words, as the copy writes it (twenty-two)
export function inWords(n: number): string {
  if (n < 20) return ONES[Math.max(0, n)];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  return String(n);
}
export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// the count in words, lower case and with a capital (twenty-two, Twenty-two)
export const YEARS_WORD = inWords(YEARS);
export const YEARS_WORD_CAP = capital(YEARS_WORD);

/**
 * A simple querystring.stringify alternative, so we don't need to include
 * another dependency for the browser
 */
export function objToQueryString(input: {[s: string]: string|undefined}): string {

  return Object.entries(input).map( ([key, value]) => {

    if (value === undefined) {
      // skip
      return '';
    } else {
      return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }
  }).join('&');

}

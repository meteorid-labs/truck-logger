const traverse = require('traverse');
const { klona } = require('klona/full');

const woopies = [
  /cookie/i,
  /passw(or)?d/i,
  /^pw$/,
  /^pin$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
  /session[-._]?id/i,

  // others
  /^connect\.sid$/
];

function redactObject(obj: any) {
  traverse(obj).forEach(function redactor(this: any) {
    if (woopies.some(regex => regex.test(this.key))) {
      this.update("[CLASSIFIED]");
    }
  });
}

export function redactor(obj: any) {
  const copy = klona(obj);
  redactObject(copy);
  const splat = copy[Symbol.for("splat")];
  redactObject(splat);
  return copy;
}


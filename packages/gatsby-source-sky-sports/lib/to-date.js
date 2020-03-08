const parse = require('date-fns/parse');

module.exports = (string = '') => {
  if (!string) return string;
  return parse(string);
};

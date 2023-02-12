// catch error in async functions
// returns function assigned to function
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);

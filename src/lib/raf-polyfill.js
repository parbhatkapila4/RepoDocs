
if (typeof window !== 'undefined') {
  module.exports = function raf(callback) {
    return window.requestAnimationFrame(callback);
  };
  module.exports.cancel = function cancel(id) {
    window.cancelAnimationFrame(id);
  };
} else {
  module.exports = function raf(callback) {
    return setTimeout(callback, 16);
  };
  module.exports.cancel = function cancel(id) {
    clearTimeout(id);
  };
}

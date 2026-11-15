/* Local compatibility shim for the retained game's gtag calls. No network I/O. */
(function (global) {
  var events = [];
  global.hireAndSeekEvents = events;
  global.gtag = function () {
    events.push({time: Date.now(), arguments: Array.prototype.slice.call(arguments)});
    if (events.length > 200) events.shift();
  };
})(window);

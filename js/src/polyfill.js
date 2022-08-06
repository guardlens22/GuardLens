export default class Polyfill {
  static addEvent(elem, event, fn, capture) {
    if (typeof capture === 'undefined') {
      capture = false;
    }

    if (elem.addEventListener) {
      elem.addEventListener(event, fn, capture);
    } else {
      elem.attachEvent('on' + event, function () {
        // set the this pointer same as addEventListener when fn is called
        return (fn.call(elem, window.event));
      });
    }
  }

  static removeEvent(elem, event, fn) {
    if (elem.removeEventListener) {
      elem.removeEventListener(event, fn, false);
    } else {
      elem.detachEvent('on' + event, fn);
    }
  }

}

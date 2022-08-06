import Polyfill from './polyfill.js';
import { stylesheet, cssPrefix, elementIds } from './styles.js';
import {isElemVisible} from './utils.js';

let _keyCodes = {
  ESC: 27,
  TAB: 9
};

export default class UI {
  constructor() {
    this._pageWrap = null;
    this._currentMsg = null;
    this._currentMsgVisible = false;
    this._listener = null;
    this._working = false;
    this._states = {
      focusTrapped: false,
      lastFocus: null,
      contentsWrapped: false,
      modifierKeyUpAt: null,
      mouseX: 0,
      mouseY: 0,
      keyMap: {}
    };

    let trackMousePosition = (e) => {
      e = e || window.event;
      this._states.mouseX = e.clientX;
      this._states.mouseY = e.clientY;
    };

    Polyfill.addEvent(document, 'mousemove', trackMousePosition);

    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');
    let fontLink = document.createElement('link');

    fontLink.setAttribute('rel', 'stylesheet');
    fontLink.setAttribute('href', 'https://fonts.googleapis.com/css?family=Rubik');

    head.appendChild(fontLink);

    style.type = 'text/css';
    if (style.styleSheet) {
      style.styleSheet.cssText = stylesheet;
    } else {
      style.appendChild(document.createTextNode(stylesheet));
    }

    head.appendChild(style);
  }

  set working(working) {
    this._working = working;
    let loading = document.getElementById(elementIds.loading);

    if (loading) {
      if (!working) {
        document.getElementById(elementIds.loading).style.display = 'none';
      } else {
        document.getElementById(elementIds.loading).style.display = 'inline-block';
      }
    }
  }

  get working() {
    return this._working;
  }

  get currentMsgVisible() {
    return this._currentMsgVisible;
  }

  get currentMsgDoc() {
    return this._currentMsg.querySelector('[role=document]');
  }

  _hasActiveMsg() {
    return this._currentMsg !== null;
  }

  _parseFromString(str) {
    return new DOMParser().parseFromString(str, 'text/html').body.firstChild;
  }

  _wrapContents() {
    let activeElem = document.activeElement;

    if (this._pageWrap === null) {
      let wrap = document.createElement('div');

      wrap.id = 'guardLensWrap';

      // Move the body's children into this wrapper
      while (document.body.firstChild) {
        wrap.appendChild(document.body.firstChild);
      }

      // Append the wrapper to the body
      document.body.appendChild(wrap);
      this._pageWrap = wrap;
    }

    if (activeElem) {
      activeElem.focus();
    }

  }

  _trapKeyboardAndFocus(elem) {

    // add keyboard handles
    Polyfill.addEvent(document, 'keydown', e => {
      if (this._hasActiveMsg()) {
        switch (e.keyCode) {
          // close on ESC
          case _keyCodes.ESC:
            e.preventDefault();
            let btnNo = document.getElementById(elementIds.msgBtnNO);

            // do callback of No button
            if (btnNo) {
              Polyfill.doClick(btnNo);
            } else {
              this.hideMessage({destroy: true});
            }
            break;
          // trap TAB
          case _keyCodes.TAB:
            let focusableSelector = `a[href], area[href], input:not([disabled]), 
            select:not([disabled]), textarea:not([disabled]), button:not([disabled]), 
            iframe, object, embed, *[tabindex], *[contenteditable]`;
            let focusableElems = [...this._currentMsg.querySelectorAll(focusableSelector)].filter(isElemVisible);
            let currentFocus = document.activeElement;
            let currentFocusIndex = focusableElems.indexOf(currentFocus);

            if (e.shiftKey) {
              if (currentFocusIndex === 0) {
                focusableElems[focusableElems.length - 1].focus();
                e.preventDefault();
              }
            } else {

              if (currentFocusIndex === focusableElems.length - 1) {
                focusableElems[0].focus();
                e.preventDefault();
              }
            }
            break;
        }
      }
    }, true);
  }

  toggleMessage() {
    if (this._currentMsg !== null) {
      if (this._currentMsg.style.top === '0px') {
        this.hideMessage({destroy: false});
      } else {
        this._states.lastFocus = document.activeElement;
        window.setTimeout(() => {
          this._currentMsg.style.display = 'block';
          this._currentMsg.removeAttribute('aria-hidden');
          window.setTimeout(() => {
            this._currentMsg.style.top = 0;
          }, 100);
          // this._currentMsg.setAttribute('role', 'alertdialog');
          // this._currentMsg.setAttribute('aria-live', 'assertive');
          this._currentMsg.removeAttribute('tabindex');
          let els = this._currentMsg.querySelectorAll('*');

          for (let i = 0; i < els.length; i++) {
            els[i].removeAttribute('tabindex');
          }
          this._currentMsg.querySelector('[role="document"]').setAttribute('tabindex', 0);
        });

        window.setTimeout(() => {
          this._currentMsg.querySelector('[role=document]').focus();
        }, 1000);
        // if (this._currentMsg.getAttribute('role') === 'dialog') {
        // }
        this._currentMsgVisible = true;
      }
    }
  }

  hideMessage({ destroy: destroy = true }) {
    if (this._currentMsg !== null) {
      if (destroy) {
        this._currentMsg.parentNode.removeChild(this._currentMsg);
        let overlay = document.getElementById(elementIds.overlay);

        if (overlay) overlay.parentNode.removeChild(overlay);
        delete this._currentMsg;
        this._currentMsg = null;
        if (this._pageWrap !== null) {
          this._pageWrap.setAttribute('aria-hidden', 'false');
        }
      } else {
        this._currentMsg.setAttribute('aria-hidden', true);
        this._currentMsg.style.top = '-1000px';

        window.setTimeout(() => {
          this._currentMsg.style.display = 'none';
        }, 500);

        this._currentMsg.setAttribute('tabindex', -1);
        // this._currentMsg.removeAttribute('role');
        // this._currentMsg.removeAttribute('aria-live');

        let els = this._currentMsg.querySelectorAll('*');

        for (let i = 0; i < els.length; i++) {
          els[i].setAttribute('tabindex', -1);
        }

        document.getElementById('guardLensSettings').style.display = 'none';
        document.getElementById('guardLensSettings').setAttribute('aria-hidden', true);
        document.getElementById(elementIds.msgDescription + 'Container').style.display = 'block';
        document.getElementById(elementIds.msgDescription + 'Container').removeAttribute('aria-hidden');

      }

      if (this._states.lastFocus !== null && this._states.lastFocus.tagName !== 'BODY') {
        this._states.lastFocus.focus();
      } else {
        let tabIndexElm = document.querySelector('[tabindex]:not([tabindex="-1"])');

        if (tabIndexElm !== null && tabIndexElm !== this._currentMsg.querySelector('[role=document]')) {
          tabIndexElm.focus();
        } else {
          let focusable = document.querySelectorAll(`a[href], area[href], input:not([disabled]), 
            select:not([disabled]), textarea:not([disabled]), button:not([disabled]), 
            iframe, object, embed, *[contenteditable]`);

          focusable = [...focusable].filter(elm => !this._currentMsg.contains(elm));

          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }

      if (this.dialogTimer) {
        window.clearTimeout(this.dialogTimer);
        delete this.dialogTimer;
      }
      this._currentMsgVisible = false;
    }
  }

  appendToMessage(warning) {
    if (this._hasActiveMsg()) {
      let elm = document.createElement('button');
      const detailsId = `guardlens_details_${Math.floor(Math.random() * 1000)}`;

      elm.setAttribute('title', 'Click for more information');
      // elm.setAttribute('aria-live', 'assertive');
      elm.setAttribute('aria-controls', detailsId);
      elm.setAttribute('aria-expanded', false);
      elm.style.position = 'relative';

      let details = document.createElement('div');

      details.setAttribute('id', detailsId);
      details.setAttribute('role', 'region');
      details.setAttribute('tabindex', -1);

      let className = 'list-item';

      if (warning.sentiment === 'positive') {
        className += ' positive';
      } else if (warning.sentiment === 'negative') {
        className += ' negative';
      }

      elm.className = className;

      elm.innerHTML = `${warning.sentiment === 'negative' ? '<strong>Warning:</strong> ' : ''}${warning.text}
      <span style="position: absolute; right: 5px; top: 5px; font-weight: bold;"
      class="${cssPrefix}ToggleIcon">&darr;</span>`;
      details.innerHTML = `${warning.explanation}<br/><br /><strong>What you can do:</strong> ${warning.suggestion}`;
      details.style.display = 'none';
      // details.style.fontSize = '14px';
      details.style.backgroundColor = '#333333';
      details.style.color = 'white';
      details.style.borderRadius = '3px';
      details.style.padding = '15px';
      details.style.marginTop = '10px';

      Polyfill.addEvent(elm, 'click', () => {
        if (details.style.display === 'none') {
          details.style.display = 'block';
          details.setAttribute('tabindex', -1);
          elm.removeAttribute('title');
          elm.setAttribute('aria-expanded', true);
          elm.focus();
          elm.querySelector(`.${cssPrefix}ToggleIcon`).innerHTML = '&uarr;';

          if (typeof (warning['clickCb']['expand']) === 'function') {
            warning['clickCb']['expand']();
          }
        } else {
          elm.setAttribute('aria-expanded', false);
          elm.querySelector(`.${cssPrefix}ToggleIcon`).innerHTML = '&darr;';
          details.style.display = 'none';
          elm.setAttribute('title', 'Click for more information');
          if (typeof (warning['clickCb']['collapse']) === 'function') {
            warning['clickCb']['collapse']();
          }
        }
      });

      if (typeof (warning['hoverCb']['in']) === 'function') {
        Polyfill.addEvent(elm, 'mouseover', () => {
          warning['hoverCb']['in']();
        });
      }

      if (typeof (warning['hoverCb']['out']) === 'function') {
        Polyfill.addEvent(elm, 'mouseout', () => {
          warning['hoverCb']['out']();
        });
      }

      if (typeof (warning['focusCb']['in']) === 'function') {
        Polyfill.addEvent(elm, 'focus', () => {
          warning['focusCb']['in']();
        });
      }

      if (typeof (warning['focusCb']['out']) === 'function') {
        Polyfill.addEvent(elm, 'focusout', () => {
          warning['focusCb']['out']();
        });
      }
      // elm.appendChild(details);
      document.getElementById(elementIds.msgDescription + 'Warnings').appendChild(elm);
      elm.parentNode.insertBefore(details, elm.nextSibling);
    }
  }

  listen({ keyCode, cb}) {
    Polyfill.addEvent(document, 'keydown', e => {
      this._states.keyMap[e.keyCode] = true;
      // left and right arrows;
      if (this._states.keyMap[191] && this._states.keyMap[17]) {
        cb();
      }
    });

    Polyfill.addEvent(document, 'keyup', e => {
      if (e.keyCode in this._states.keyMap) {
        this._states.keyMap[e.keyCode] = false;
      }
    });
    Polyfill.addEvent(document, 'keyup', e => {
      // if (document.activeElement &&
      //   ['input', 'textarea'].indexOf(document.activeElement.tagName.toLowerCase()) !== -1) {
      //   return;
      // }
      // switch (e.keyCode) {
      //   case keyCode:
      //     // ask for intent when key is pressed twice within .25 second
      //     if (!this._states.modifierKeyUpAt) {
      //       this._states.modifierKeyUpAt = new Date();
      //     } else {
      //       if (((new Date() - this._states.modifierKeyUpAt) / 1000) < 1) {
      //         cb();
      //       }
      //       this._states.modifierKeyUpAt = null;
      //     }
      //     break;
      // }
    });
  }

  showMessage({ description: description = '', content: content, type: type = 'MSG',
    cb: cb = null, cbNo: cbNo = null, cbBack: cbBack = null, style = '', overlay = false, keepHidden = false,
    settings = []}) {

    this.hideMessage({destroy: true});

    // if (!this._states.focusTrapped) {
      // this._trapKeyboardAndFocus();
    // }

    // if (!this._states.contentsWrapped) {
      // this._wrapContents();
    // }

    let boxTemplate = `<div id="${elementIds.msg}" class="${style}"></div>`;

    let box = this._parseFromString(boxTemplate);

    let docTemplate = '<div role="document" style="text-align: center;"></div>';
    let doc = this._parseFromString(docTemplate);

    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-live', 'assertive');

    box.setAttribute('aria-labelledby', elementIds.msgDescription);
    box.appendChild(doc);

    doc.appendChild(this._parseFromString(`<div id="${elementIds.msgDescription}">
      <img src="https://www.dropbox.com/s/tj0p62kyi0htlkd/icon-bw.png?dl=1" width="35" height="35"
      style="width: 35px; height: 35px; margin: 0 auto;" alt="GuardLens" /> <br />
      

      <div id="${elementIds.msgDescription}Container">
        <div id="${elementIds.msgDescription}Warnings"></div>
        <button id="guardLensSettingsButton"
        class="${cssPrefix}btn outline"
        style="position: absolute; right: 35px; top: 0; font-size: 12px;">
        <img src="https://www.dropbox.com/s/taw9cwmzawqh1rc/settings-16.png?dl=1" width="12" height="12"/>
        Settings</button>
        ${description}
      </div>

      <img id=${elementIds.loading} width="30" 
        height="30"
        style="width: 30px; height: 30px; ${!this._working ? 'display: none' : ''}"
        alt="working"
        src="https://www.dropbox.com/s/1bmxfjjrvyvdy2f/loading.gif?dl=1" />
      </div>`));

    doc.appendChild(this._parseFromString(`<div id="guardLensSettings"
        aria-hidden="true"
        style="text-align: left; display: none;">

        <h1 style="margin-left:0; padding-left:0;">Settings</h1>
        
        <p>Choose all the information that you prefer to see for each website:</p>
        <br />
        
        <div>
          <input type="checkbox" id="chk-all">
          <label for="chk-all"><strong>Show all information</strong></label>
        </div>

        <div>
          <input type="checkbox" id="chk-page_topic">
          <label for="chk-page_topic">Kind of website</label>
        </div>

        <div>
          <input type="checkbox" id="chk-domain">
          <label for="chk-domain">Domain of website</label>
        </div>

        <div>
          <input type="checkbox" id="chk-image_description">
          <label for="chk-image_description">Description of largest images on screen</label>
        </div>

        <div>
          <input type="checkbox" id="chk-image_nsfw">
          <label for="chk-image_nsfw">NSFW image on screen</label>
        </div>

        <div>
          <input type="checkbox" id="chk-ad_count">
          <label for="chk-ad_count">Number of ads on screen</label>
        </div>

        <div>
          <input type="checkbox" id="chk-website_encryption">
          <label for="chk-website_encryption">Website encryption</label>
        </div>

        <div>
          <input type="checkbox" id="chk-website_entity">
          <label for="chk-website_entity">Website owner</label>
        </div>

        <div>
          <input type="checkbox" id="chk-website_locality">
          <label for="chk-website_locality">Website owner location</label>
        </div>

        <div>
          <input type="checkbox" id="chk-links_crossdomain">
          <label for="chk-links_crossdomain">External links</label>
        </div>

        <div style="text-align: center;">
          <button id="guardLensSettingsSaveButton"
          class="${cssPrefix}btn positive"
          style="margin-top: 20px;">Save Settings</button>
          <button id="guardLensSettingsBackButton"
            class="${cssPrefix}btn">Back</button>
        </div>

      </div>`));

    if (content) {
      doc.querySelector(`#${elementIds.msgDescription}Container`).appendChild(this._parseFromString(content));
    }

    if (type === 'confirm') {
      let btnYes = this._parseFromString(`<button id="${elementIds.msgBtnYES}"
                                              aria-describedby="${elementIds.msgDescription}"
                                              class="${cssPrefix}btn positive">
                                              Yes
                                              </button>`);

      Polyfill.addEvent(btnYes, 'click', () => {
        this.hideMessage({destroy: !keepHidden});
        if (typeof cb === 'function') {
          cb();
        }
      });

      let btnNo = this._parseFromString(`<button id="${elementIds.msgBtnNO}"
                                              aria-describedby="${elementIds.msgDescription}"
                                              class="${cssPrefix}btn negative">
                                              No
                                              </button>`);

      Polyfill.addEvent(btnNo, 'click', () => {
        if (typeof cbNo === 'function') {
          cbNo();
        }
        this.hideMessage({destroy: !keepHidden});
      });
      doc.appendChild(btnYes);
      doc.appendChild(btnNo);
    } else if (type === 'OK') {
      let btnOK = this._parseFromString(`<button id="${elementIds.msgBtnOK}"
                                              aria-describedby="${elementIds.msgDescription}"
                                              class="${cssPrefix}btn">
                                              OK
                                              </button>`);

      Polyfill.addEvent(btnOK, 'click', () => {
        this.hideMessage({destroy: !keepHidden});
        if (typeof cb === 'function') {
          cb();
        }
      });

      doc.appendChild(btnOK);

    }

    doc.appendChild(this._parseFromString(`<button class="${cssPrefix}btn" id="${elementIds.msgBtnClose}" 
      aria-label="Close the GuardLens dialog">&times;</button>`));

    // this._pageWrap.setAttribute('aria-hidden', 'true');
    if (overlay) {
      document.body.appendChild(this._parseFromString(`<div id="${elementIds.overlay}"></div>`));
    }
    document.body.insertBefore(box, document.body.childNodes[0]);

    let btnClose = document.getElementById(elementIds.msgBtnClose);

    Polyfill.addEvent(btnClose, 'click', (e) => {
      this.constructor.preventDefaultBehavior(e);
      let btnNo = document.getElementById(elementIds.msgBtnNO);

      // do callback of No button
      if (btnNo) Polyfill.doClick(btnNo);
      this.hideMessage({destroy: !keepHidden});
    });

    Polyfill.addEvent(document.getElementById('guardLensSettingsButton'), 'click', (e) => {
      this.constructor.preventDefaultBehavior(e);
      document.getElementById(elementIds.msgDescription + 'Container').style.display = 'none';
      document.getElementById(elementIds.msgDescription + 'Container').setAttribute('aria-hidden', true);
      document.getElementById('guardLensSettings').style.display = 'block';
      document.getElementById('guardLensSettings').removeAttribute('aria-hidden');
      document.querySelector('#guardLensSettings input').focus();
    });

    Polyfill.addEvent(document.getElementById('guardLensSettingsBackButton'), 'click', (e) => {
      this.constructor.preventDefaultBehavior(e);
      document.getElementById('guardLensSettings').style.display = 'none';
      document.getElementById('guardLensSettings').setAttribute('aria-hidden', true);
      document.getElementById(elementIds.msgDescription + 'Container').style.display = 'block';
      document.getElementById(elementIds.msgDescription + 'Container').removeAttribute('aria-hidden');
      this._currentMsg.querySelector('[role=document]').focus();
    });

    Polyfill.addEvent(document.getElementById('chk-all'), 'change', (e) => {
      this.constructor.preventDefaultBehavior(e);
      [...document.querySelectorAll('#guardLensSettings input')].forEach(x => {
        x.checked = e.target.checked;
      });
    });

    document.querySelectorAll('#guardLensSettings input').forEach(item => {

      Polyfill.addEvent(item, 'change', (e) => {
        let allChecked = [...document.querySelectorAll(`#guardLensSettings 
          input:not(#chk-all)`)].map(x => x.checked).every(x => x);

        document.querySelector('#guardLensSettings #chk-all').checked = allChecked;
      });

    });

    if (cbBack) {
      doc.appendChild(this._parseFromString(`<a href="javascript:undefined" id="${elementIds.backBtn}">go back</a>`));
      let backBtn = document.getElementById(elementIds.backBtn);

      Polyfill.addEvent(backBtn, 'click', cbBack);
    }

    Polyfill.addEvent(doc, 'keydown', e => {
      switch (e.keyCode) {
        case _keyCodes.ESC:
          if (this._currentMsg.style.top === '0px') {
            this.hideMessage({destroy: false});
          }
          break;
      }
    });

    // function followMousePointer() {
    //   window.setTimeout(() => {
    //     box.style.top = Math.min(Math.max(0, (this._states.mouseY - box.offsetHeight / 2)),
    //           parseInt(document.documentElement.clientHeight, 10) - box.offsetHeight) + 'px';
    //     box.style.left = Math.min(Math.max(0, (this._states.mouseX - box.offsetWidth / 2)),
    //           parseInt(document.documentElement.clientWidth, 10) - box.offsetWidth) + 'px';
    //   }, 0);
    // }

    if (!keepHidden) {
      doc.setAttribute('tabindex', 0);
      window.setTimeout(() => { box.style.top = 0;});
      this._currentMsgVisible = true;
    } else {
      box.style.display = 'none';
      box.setAttribute('aria-hidden', true);
      box.setAttribute('tabindex', -1);
      let els = box.querySelectorAll('*');

      for (let i = 0; i < els.length; i++) {
        els[i].setAttribute('tabindex', -1);
      }
      this._currentMsgVisible = false;
    }

    // if (style === 'negative') {
    //   let btnWarning = this._parseFromString(`<button aria-describedby="${elementIds.msgDescription}"
    //                                           aria-hidden="true"
    //                                           class="${cssPrefix}btn negative">⚠</button>`);

    //   Polyfill.addEvent(btnWarning, 'click', (e) => {
    //     this.constructor.preventDefaultBehavior(e);
    //     btnWarning.style.display = 'none';
    //     btnWarning.parentNode.removeChild(btnWarning);
    //     followMousePointer.apply(this);
    //   });

    //   let showWarning = () => {
    //     btnWarning.style.position = 'absolute';
    //     btnWarning.style.display = 'inline-block';
    //     btnWarning.style.cursor = 'pointer';
    //     doc.appendChild(btnWarning);

    //     window.setTimeout(() => {
    //       btnWarning.style.top = Math.min(Math.max(0, (this._states.mouseY - btnWarning.offsetHeight / 2)),
    //         parseInt(document.documentElement.clientHeight, 10) - btnWarning.offsetHeight) + 'px';
    //       btnWarning.style.left = Math.min(Math.max(0, (this._states.mouseX - btnWarning.offsetWidth / 2)),
    //         parseInt(document.documentElement.clientWidth, 10) - btnWarning.offsetWidth) + 'px';
    //     }, 0);
    //     Polyfill.removeEvent(document, 'mousemove', showWarning);
    //     Polyfill.addEvent(box, 'mouseover', (e) => {
    //       if (e.target !== btnWarning) {
    //         this.constructor.preventDefaultBehavior(e);
    //         btnWarning.style.display = 'none';
    //         if (btnWarning.parentNode) {
    //           btnWarning.parentNode.removeChild(btnWarning);
    //         }
    //       }
    //     });

    //   };

    //   Polyfill.addEvent(document, 'mousemove', showWarning);

    // } else {
    //   Polyfill.addEvent(box, 'click', (e) => {
    //     this.constructor.preventDefaultBehavior(e);
    //     this.hideMessage();
    //   });
    // }
    // animate
    // window.setTimeout(() => {
    //   box.style.top = Math.min(Math.max(0, (this._states.mouseY - box.offsetHeight / 2)),
    //         parseInt(document.documentElement.clientHeight, 10) - box.offsetHeight) + 'px';
    //   box.style.left = Math.min(Math.max(0, (this._states.mouseX - box.offsetWidth / 2)),
    //         parseInt(document.documentElement.clientWidth, 10) - box.offsetWidth) + 'px';
    // }, 0);

    this._currentMsg = box;

    for (let i = 0; i < settings.length; i++) {
      document.querySelector(`#chk-${settings[i]}`).checked = true;
    }

    if ([...document.querySelectorAll('#guardLensSettings input:not(#chk-all)')]
      .map(x => x.checked).every(x => x)) {
      document.querySelector('#guardLensSettings #chk-all').checked = true;
    }

    if (!keepHidden) {
      if (this._currentMsg.getAttribute('role') === 'alertdialog') {
        this._states.lastFocus = document.activeElement;
        this._currentMsg.focus();
      }
    }
    //   let firstFocus = this._currentMsg.querySelector(`input, a, button:not(#${elementIds.msgBtnClose})`);

    //   if (firstFocus) {
    //     window.setTimeout(() => { firstFocus.focus(); }, 500);
    //   } else if (type === 'MSG') {
    //     btnClose.focus();
    //   }
    // }

    // let followMousePointerOnDisplay = (e) => {
    //   e = e || window.event;
    //   if (this._currentMsg !== null) {
    //     this._currentMsg.style.top = Math.min(Math.max(0, (e.clientY - this._currentMsg.offsetHeight / 2)),
    //         parseInt(document.documentElement.clientHeight, 10) - this._currentMsg.offsetHeight) + 'px';
    //     this._currentMsg.style.left = Math.min(Math.max(0, (e.clientX - this._currentMsg.offsetWidth / 2)),
    //         parseInt(document.documentElement.clientWidth, 10) - this._currentMsg.offsetWidth) + 'px';
    //   }
    //   Polyfill.removeEvent(document, 'mousemove', followMousePointerOnDisplay);
    // };

    // Polyfill.addEvent(document, 'mousemove', followMousePointerOnDisplay);

    if (!overlay) {
      // window.setTimeout(() => { this.hideMessage(); }, 15 * 1000);
    }

  }

  static getAllLinks() {
    return { links: document.getElementsByTagName('a'), all: document.getElementsByTagName('*') };
  }

  static clickLink(link) {
    Polyfill.doClick(link);
  }

  static getLinksByHash(hash, hasher) {
    return [...document.querySelectorAll('a, span, label')].filter(l => hasher(l.outerHTML) === hash);
  }

  static inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  static isElementInViewport(elm) {
    const bounding = elm.getBoundingClientRect();

    if (bounding.top >= 0 && bounding.left >= 0 &&
      bounding.right <= (window.innerWidth || document.documentElement.clientWidth) &&
      bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
      return true;
    }
    return false;
  }

  static preventDefaultBehavior(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

}

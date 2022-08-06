if (!global._babelPolyfill) {
  require('babel-polyfill');
}
import Controller from './controller.js';
// import Logger from './logger.js';
import UI from './ui.js';
import Storage from './storage.js';
import Logger from './logger.js';
import { getTopDomain, getScreenshot, getScreenshotImages, getPageAreaImage } from './utils.js';
import Polyfill from './polyfill.js';

export default class {
  constructor(userId = null, logEnabled = false, showAutomatically = true, showWarningIds = []) {
    this._ui = new UI();
    this._controller = new Controller();
    this._storage = new Storage();
    this._logger = null;
    this._infoRequested = false;
    this._appendedWarnings = false;
    this._warnings = [];
    this._totalPossibleWarnings = 6;
    this._warningsProcessed = 0;
    this._allowedWarnings = showWarningIds;
    this._introMessagePresent = false;
    this._alwaysShowList = ['l.facebook.com', 't.co', 'www.google.com', 'www.reddit.com', 'www.youtube.com'];
    this._isFocused = false;
    this._keywordHeuristics = {
      'security': ['Law & Government', 'Finance', 'Shopping', 'Health', 'Real Estate',
        'Internet & Telecom'],
      'accuracy': ['News', 'Reference', 'Science', 'Online Communities'],
      'visual': ['Beauty & Fitness', 'Arts & Entertainment', 'People & Society', 'Travel', 'Shopping']
    };
    this._pageCategory = '';

    let referrerHostname = null;

    if (logEnabled && userId) {
      this._logger = new Logger(userId);
    }

    if (document.referrer) {
      let parser = document.createElement('a');

      parser.href = document.referrer;
      referrerHostname = parser.hostname;

    }

    let firstArrivingAtWebsite = referrerHostname == null || referrerHostname !== window.location.hostname;

    document.title = `${document.title} - Press Ctrl + / to use GuardLens ${showAutomatically ? `or Alt + I to
      omit GuardLens warnings for this website in the future` : ''}`;

    let dialogInitialContent = '';

    if (showAutomatically) {
      dialogInitialContent = `<div role="dialog"><button id="guardLensIgnoreButton"
      style="background: #000; color: #fff; border: 2px solid #fff; padding: 10px; font-weight: bold;">Stop showing
      GuardLens for ${getTopDomain()}</button></div>`;
    }

    this._ui.showMessage({content: dialogInitialContent, keepHidden: true, settings: this._allowedWarnings});
    const ignoreBtn = this._ui.currentMsgDoc.querySelector('#guardLensIgnoreButton');

    if (ignoreBtn) {
      Polyfill.addEvent(ignoreBtn, 'click', (e) => {
        this._controller.addDomainToIgnoreList();
        ignoreBtn.parentNode.removeChild(ignoreBtn);
      });
    }

    const saveSettingsBtn = this._ui.currentMsgDoc.querySelector('#guardLensSettingsSaveButton');

    if (saveSettingsBtn) {
      Polyfill.addEvent(saveSettingsBtn, 'click', (e) => {
        let settings = [...document.querySelectorAll('#guardLensSettings input:checked:not(#chk-all)')]
          .map(x => x.id.split('chk-')[1]);

        if (settings.length === 0) {
          alert('Cannot save settings: at least one type of information must be selected.');
        } else {
          this._controller.saveSettings(settings);
        }
      });
    }

    Polyfill.addEvent(document.body, 'focusin', (e) => {
      let targetInDoc = this._ui.currentMsgDoc.contains(e.target) || e.target === this.currentMsgDoc;

      if (!this._isFocused && targetInDoc) {
        this._trackUserAction(`focused into dialog ${this._infoRequested ? '' : '(autoload)'}`);
        this._isFocused = true;
      } else if (this._isFocused && !targetInDoc) {
        this._trackUserAction(`focused out of dialog ${this._infoRequested ? '' : '(autoload)'}`);
        this._isFocused = false;
      }
    });

    async function requestInfo() {
      this._infoRequested = true;
      if (this._allowedWarnings.includes('page_topic')) {
        try {
          let cat = await this._controller.getInterest();

          if (cat !== '') {
            let categoryPath = cat.split(' > ');

            this._pageCategory = categoryPath[0];
            this._warnings.push({
              'text': `This page seems to be about ${categoryPath[categoryPath.length - 1]}.`,
              'type': 'accuracy',
              'id': 'page_topic',
              'data': categoryPath[categoryPath.length - 1],
              'explanation': `Based on an automated analysis of the page\'s content.
                Predictions are not perfect and may sometimes be inaccurate.`,
              'suggestion': `You may proceed with caution if the topic of the page is 
              not what you were expecting.`
            });
          }
        } catch (err) {
          console.log(err);
        }
      }

      // let sentences = document.body.innerText.split(/\r?\n/).filter(t => t !== '');
      // let semanticSimilarity = await this._controller.getSemanticSimilarity(sentences);

      // this._warnings.push({
        // text: `Semantic similarity of text: <strong>${semanticSimilarity}</strong>`,
        // type: 'accuracy',
        // order: 1
      // });

      if (this._allowedWarnings.includes('domain')) {
        this._warnings.push({
          'text': `The domain of this website is ${getTopDomain()}.`,
          'type': 'security',
          'id': 'domain',
          'data': getTopDomain(),
          'order': 1,
          'explanation': 'Based on this page\'s address. This is always accurate.',
          'suggestion': 'You may leave this website if it is not the intended website you wanted to access.'
        });
      }

      if (this._allowedWarnings.includes('image_description') ||
        this._allowedWarnings.includes('image_nsfw') ||
        this._allowedWarnings.includes('ad_count')) {

        let screenshot = await getScreenshot();

        try {
          let images = await getScreenshotImages(screenshot);

          if (images.length > 0) {
            let screenshotAnalysis = await this._controller.getImageAnalyses(images);

            if (this._allowedWarnings.includes('image_description')) {
              if (screenshotAnalysis.images_contain !== '') {
                this._warnings.push({
                  'text': `Images on screen may contain
                  ${screenshotAnalysis.images_contain}.`,
                  'type': 'visual',
                  'id': 'image_description',
                  'data': screenshotAnalysis.images_contain,
                  'order': 2,
                  'explanation': `Based on an automated standard visual object recognition analysis of images on
                    the screen. Predictions are not perfect and may sometimes be inaccurate.`,
                  'suggestion': `You may use this information to know what bystanders may be 
                  seeing when they look at your computer screen.`

                });
              }
            }

            if (this._allowedWarnings.includes('image_nsfw')) {
              if (screenshotAnalysis.nsfw.length > 0) {
                this._warnings.push({
                  'text': 'Some images shown may not be safe for work.',
                  'type': 'visual',
                  'id': 'image_nsfw',
                  'data': true,
                  'sentiment': 'negative',
                  'order': 1,
                  'explanation': `Based on an automated standard detection of indecent or inappropriate 
                    images on the screen, which suggest images show content that may be
                    ${screenshotAnalysis.nsfw.join(', ')}.
                    Predictions are not perfect and may sometimes be inaccurate.`,
                  'suggestion': `You may want to leave this page if you are not comfortable with 
                    potential bystanders seeing your screen.`
                });
              }
            }
          }
        } catch (err) {
          console.log(err);
        }

        if (this._allowedWarnings.includes('ad_count')) {
          try {
            const visibleIframes = [...document.querySelectorAll('iframe')].filter(iframe => {
              const rect = iframe.getBoundingClientRect();

              return UI.isElementInViewport(iframe) && rect.width > 0 && rect.height > 0;
            });

            let nAds = 0;
            const adText = [];

            for (let i = 0; i < visibleIframes.length; i++) {
              const iframe = visibleIframes[i];
              const rect = iframe.getBoundingClientRect();
              const image = await getPageAreaImage(screenshot, rect);
              const adResult = await this._controller.isAd(image);

              if (adResult.ad) {
                nAds++;
                if (adResult['text'].length > 0) {
                  adText.push(adResult['text']);
                }
              }
            }

            if (nAds > 0) {
              this._warnings.push({
                'text': `${nAds} ad${nAds > 1 ? 's' : ''} detected on screen`,
                'type': 'visual',
                'id': 'ad_count',
                'data': nAds,
                'order': 3,
                'explanation': `Based on an automated analysis of images on the screen.
                Predictions are not perfect and may sometimes be inaccurate.\n
                ${adText.length > 0 ? `The text within the ads say "${adText.join(',')}."` : ''}`,
                'suggestion': `You may use this information to know what bystanders may be 
                seeing when they look at your computer screen.`
              });
            }

          } catch (err) {
            console.log(err);
          }
        }

      }

      if (this._allowedWarnings.includes('website_encryption') ||
        this._allowedWarnings.includes('website_entity') ||
        this._allowedWarnings.includes('website_locality')) {

        if (window.location.protocol === 'https:') {
          // let timeStart = new Date().getTime();

          try {
            let cert = await this._controller.getCertificate(window.location.href.replace(/\/$/, '').split('://')[1]);

            if (cert['valid']) {
              // this._storage.set('sec_nudges_status', 'secure');
              // this._storage.get('sec_nudges_cert_fingerprint', lastFingerprint => {

                // only show info if anything changes
                // if (lastFingerprint !== cert['fingerprint']) {
              if (this._allowedWarnings.includes('website_encryption')) {
                this._warnings.push({
                  'text': 'Website connection is secure, uses HTTPS.',
                  'type': 'security',
                  'id': 'website_encryption',
                  'data': true,
                  'sentiment': 'positive',
                  'order': 2,
                  'explanation': `Based on the actual information from the website's 
                    security certificate. This is always accurate.`,
                  'suggestion': `You may feel more comfortable sending your information 
                    to this website such as payment or personal information.`
                });
              }

              // this._ui.appendToMessage(`The domain of this website is <strong>${cert['domain']}</strong>`);
              let entityMsg = '';

              if (cert['organization'] !== 'Not provided') {
                entityMsg += `The website owner is ${cert['organization']}`;
              } else {
                if (this._allowedWarnings.includes('website_entity')) {
                  this._warnings.push({
                    'text': 'The website owner\'s identity is unknown.',
                    'type': 'security',
                    'id': 'website_entity',
                    'data': cert['organization'],
                    'sentiment': 'negative',
                    'order': 3,
                    'explanation': 'Based on this website\'s security certificate. This is always accurate.',
                    'suggestion': `You may be more cautious about sending your information to this 
                      website not knowing who owns it.`
                  });
                }
              }

              if (cert['city'] !== 'Not provided' && cert['country'] !== 'Not provided') {
                entityMsg += `, from ${cert['city']}, ${cert['country']}.`;
                if (this._allowedWarnings.includes('website_locality')) {
                  this._warnings.push({
                    'text': entityMsg,
                    'type': 'security',
                    'id': 'website_locality',
                    'data': `${cert['city']}, ${cert['country']}`,
                    'order': 3,
                    'explanation': 'Based on this website\'s security certificate. This is always accurate.',
                    'suggestion': `You may feel more comfortable sending your information to this 
                      website knowing who owns it.`
                  });
                }
              }
            } else {
              this._notSecure();
            }
          } catch (err) {
            console.log(err);
          }
        } else {
          this._notSecure();
        }
      }

      if (this._allowedWarnings.includes('links_crossdomain')) {
        // link stats
        this._linkStats = this._countWorkingLinks();
        // console.log(this._linkStats);

        this._warnings.push({
          'text': `${this._linkStats.crossDomainLinkCount ? this._linkStats.crossDomainLinkCount : 0}
          out of ${this._linkStats.allLinksCount} links point to other websites.`,
          'id': 'links_crossdomain',
          'data': this._linkStats.crossDomainLinkCount,
          'type': 'security',
          'order': 4,
          'explanation': `Based on the destination address of all links. This is always accurate.
          ${this._linkStats.crossDomainLinkCount > 0 ?
            `External links point to ${this._linkStats.domains.join(', ')}.` : ''}`,
          'suggestion': `If this number is high, you may want to pay close attention to links before clicking them.
            You may also leave the website if you think it is deceptive or masquerading as a real website, such as
            a fake website with links that point to the real website.`
        });
      }

      // let emptyLinkPercentage = this._linkStats.emptyLinkCount / this._linkStats.allLinksCount;

      // if (emptyLinkPercentage >= 0.5) {
      //   this._warnings.push({
      //     'text': `Many links on this page appear to not work, which is common
      //   on phishing websites.`,
      //     'type': 'security',
      //     'id': 'links_empty',
      //     'data': emptyLinkPercentage,
      //     'sentiment': 'negative',
      //     'order': 5,
      //     'explanation': `Based on the fact that at least 50% of the links do not
      //       point to other pages. This is not always accurate since these links could lead
      //       to interactive content on the same page.`,
      //     'suggestion': `You may proceed with caution or leave the website if you think it
      //       is deceptive or masquerading as a real website. For example, a fake website made to look
      //         like the real one on the surface, but with broken or empty links.`
      //   });
      // }

      // clickbait
      // if (this._allowedWarnings.includes('links_clickbait')) {
      //   let allLinkTexts = Array.from(UI.getAllLinks().links).map(l => {return {'titles': l.textContent};});

      //   allLinkTexts = allLinkTexts.filter(l => l.titles.length >= 50);

      //   if (allLinkTexts.length > 0) {
      //     try {
      //       let clickbaitPredictions = await this._controller.getClickbait(allLinkTexts);

      //       this._clickbaitPredictions = clickbaitPredictions;
      //       this._clickbaitCount = clickbaitPredictions.clickbait.filter(p => p === 1).length;
      //       let clickbaitPercentage = this._clickbaitCount / clickbaitPredictions.clickbait.length;

      //       if (clickbaitPercentage >= 0.5) {
      //         this._warnings.push({
      //           'text': 'A large number of headlines look like click bait.',
      //           'type': 'accuracy',
      //           'id': 'links_clickbait',
      //           'data': clickbaitPercentage,
      //           'sentiment': 'negative',
      //           'order': 1,
      //           'explanation': `Based on an automated detection analysis that determined at least half
      //              of the headlines
      //             sound like click bait. Predictions are not perfect and may sometimes be inaccurate.`,
      //           'suggestion': `You may proceed with caution about the legitimacy of the headlines and links,
      //             knowing they could be deceptive, sensationalized, or misleading.`
      //         });
      //       }
      //     } catch (err) {
      //       console.log(err);
      //     }
      //   }
      // }

      return Promise.resolve();
    }
    // }

    if (firstArrivingAtWebsite) {
      this._controller.getInterest().then(cat => {
        this._websiteInfo = {
          'website': window.location.hostname,
          'referrer': referrerHostname,
          'protocol': window.location.protocol,
          'category': cat
        };
        this._trackWebsite();
      });
    }

    this._ui.listen({ keyCode: 17, cb: () => {
      this._trackUserAction('toggled message');
      this._ui.toggleMessage();
      if (!this._infoRequested) {
        this._ui.working = true;
        requestInfo.call(this).then(() => {
          this._ui.working = false;
          if (!this._appendedWarnings) this._appendWarnings();
          if (!this._ui.currentMsgVisible) this._ui.toggleMessage();
          this._trackMessage();
        });
      } else {
        this._trackMessage();
      }
    }});

    if (firstArrivingAtWebsite && showAutomatically) {
      this._ui.working = true;
      window.setTimeout(() => {
        requestInfo.call(this).then(() => {
          this._ui.working = false;
          if (!this._appendedWarnings) this._appendWarnings();

          const hasWarningsToShow = this._warnings.some(w => w.sentiment === 'negative');
          const shouldShowFromReferrer = this._alwaysShowList.indexOf(referrerHostname) >= 0;

          if (hasWarningsToShow || shouldShowFromReferrer) {
            if (!this._ui.currentMsgVisible) this._ui.toggleMessage();
            this._trackUserAction('ignored warnings for website');
            this._trackMessage(true);
          }
        });
      }, 3 * 1000);
    } else {
      this._trackUserAction('warnings ignored');
    }
  }

  _appendWarnings() {
    let unorderedWarnings = [...this._warnings].filter(x => this._allowedWarnings.indexOf(x.id) >= 0);
    let heuristics = JSON.parse(JSON.stringify(this._keywordHeuristics));
    let orderedTypes = [];

    this._warnings = [];

    let priority = Object.keys(heuristics)
      .filter(type => heuristics[type]
      .includes(this._pageCategory));

    if (priority.length > 0) {
      orderedTypes = [...priority];
      let otherTypes = Object.keys(heuristics).filter(h => !priority.includes(h));

      orderedTypes = [...orderedTypes, ...otherTypes];
    } else {
      orderedTypes = Object.keys(heuristics);
    }

    orderedTypes.forEach(type => {
      this._warnings = [...this._warnings, unorderedWarnings.filter(w => w.type === type)
        .sort((a, b) => (a.order > b.order) ? 1 : -1)];
    });

    this._warnings.push(unorderedWarnings.filter(w => !w.type).sort((a, b) => (a.color > b.color) ? 1 : -1));
    this._warnings = this._warnings.flat();

    this._warnings = [
      ...this._warnings.filter(w => w.sentiment === 'negative'),
      ...this._warnings.filter(w => w.sentiment === 'positive'),
      ...this._warnings.filter(w => !w.sentiment)];

    this._warnings.forEach(warning => {
      // logs
      warning['clickCb'] = {
        'expand': () => {this._trackUserAction('expanded warning', warning);},
        'collapse': () => {this._trackUserAction('collapsed warning', warning);}
      };

      warning['hoverCb'] = {
        'in': () => {this._trackUserAction('hovered warning', warning);}
      };

      warning['focusCb'] = {
        'in': () => {this._trackUserAction('focused into warning', warning);}
      };

      this._appendedWarnings = true;

      this._ui.appendToMessage(warning);
    });
  }

  _countWorkingLinks() {
    let emptyLinkValues = [
      '#',
      '',
      'javascript:void',
      'javascript:void;',
      'javascript:void(0);',
      'javascript:void(0)'
    ];

    let allLinks = UI.getAllLinks().links;

    let emptyLinkCount = Array.from(allLinks).filter(l =>
      emptyLinkValues.includes(l.getAttribute('href') !== null ?
        l.getAttribute('href').toLowerCase() :
        null)).length;

    let pageLinkCount = Array.from(allLinks).filter(l => l.getAttribute('href') !== null &&
      l.getAttribute('href')[0] === '#').length;

    let nonEmptyLinks = Array.from(allLinks).filter(l =>
      !emptyLinkValues.includes(l.getAttribute('href') !== null ? l.getAttribute('href').toLowerCase() : null));

    let topDomain = getTopDomain();

    let crossDomainLinks = nonEmptyLinks.filter(l => {
      if (l.hostname === '') return false;
      let hostnameParts = l.hostname.split('.');

      return topDomain !== hostnameParts[hostnameParts.length - 2] + '.' + hostnameParts[hostnameParts.length - 1];
    });

    crossDomainLinks.forEach(l => {
      const currentTitle = l.getAttribute('title');

      l.setAttribute('title', `External link${currentTitle ? ` ${currentTitle}` : ''}`);
    });

    return {
      allLinksCount: allLinks.length,
      emptyLinkCount: emptyLinkCount,
      crossDomainLinkCount: crossDomainLinks.length,
      pageLinkCount: pageLinkCount,
      domains: [...new Set(crossDomainLinks.map(l => {
        if (l.hostname !== '') {
          const hostnameParts = l.hostname.split('.');

          return `${hostnameParts[hostnameParts.length - 2]}.${hostnameParts[hostnameParts.length - 1]}`;
        }

        return '';
      }))].filter(d => d !== '')
    };
  }

  _trackWebsite() {
    this._log(this._websiteInfo, 'website visited');
  }

  _trackMessage(shownAutomatically) {
    const allWarnings = this._warnings.map(w => {
      return {
        'text': w.text,
        'type': w.type,
        'sentiment': w.sentiment,
        'id': w.id,
        'data': w.data
      };
    });

    this._log({
      'website': this._websiteInfo,
      'shown_at': new Date(),
      'shown_automatically': shownAutomatically || false,
      'negative_warnings': allWarnings.filter(w => w.sentiment === 'negative'),
      'all_warnings': allWarnings
    }, 'message shown');
  }

  _trackUserAction(action, data) {
    this._log({'website': this._websiteInfo, 'data': data, 'executed_at': new Date()}, action);
  }

  _log(data, event) {
    if (this._logger) {
      this._logger.log(data, event);
    }
  }

  _notSecure() {
    this._warnings.push({
      'text': `Website connection is not secure. The information you provide to
      this website may be intercepted by others.`,
      'type': 'security',
      'id': 'website_encryption',
      'data': false,
      'sentiment': 'negative',
      'order': 2,
      'explanation': `Based on the actual information from the website's 
        security certificate. This is always accurate.`,
      'suggestion': `You may choose not to send your information 
        to this website such as payment or personal information.`
    });

    this._warnings.push({
      'text': 'The website owner\'s identity is unknown.',
      'type': 'security',
      'id': 'website_entity',
      'data': 'Not provided',
      'sentiment': 'negative',
      'order': 3,
      'explanation': 'Based on this website\'s security certificate. This is always accurate.',
      'suggestion': `You may be more cautious about sending your information to this 
        website not knowing who owns it.`
    });
  }
}

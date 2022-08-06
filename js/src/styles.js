const elementIds = {
  'msg': 'guardLensMsg',
  'msgDescription': 'guardLensMsgDescription',
  'msgBtnNO': 'guardLensMsgNO',
  'msgBtnYES': 'guardLensMsgYes',
  'msgBtnOK': 'guardLensMsgOK',
  'btn': 'guardLensButton',
  'loading': 'guardLensLoading',
  'overlay': 'guardLensOverlay',
  'quietStart': 'guardLensQuietStart',
  'msgBtnClose': 'guardLensCloseBtn'
};

const colors = {
  'default': '#333333',
  'positive': '#27ae60',
  'negative': '#e74c3c'
};

const cssPrefix = 'guardLens__';

/* jshint ignore:start */
const stylesheet = `
	#${elementIds.form} input {
		font-family: "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif;
		color: #666;
    height: 60px; 
    width: 100%;
    margin: 10px;
    padding: 10px; 
    font-size: 25px;
    line-height: 50px; 
    background: #fff; 
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 0 3px 3px #aaa;
    outline: none;
    display: inline-block;
    box-sizing: border-box;
	}

  #${elementIds.msg} .list-item {
    display: block;
    padding: 10px;
    box-sizing: border-box;
    margin: 8px 0;
    border: 2px solid #333;
    border-radius: 3px;
    background: rgba(255, 255, 255, 1);
    box-shadow: 2px 2px #000;
    width: 100%;
    font-size: 16px;
    text-overflow: clip;
    line-height: 22px;
    white-space: normal;
    height: auto;
    max-height: none;
    text-transform: none;
    letter-spacing: normal;
    color: #333 !important;
    text-align: center;
  }

  #${elementIds.msg} .list-item.negative {
    background-color: ${colors.negative};
    color: #fff !important;
  }

  #${elementIds.msg} .list-item.positive {
    background-color: ${colors.positive};
    color: #fff !important;
  }
  
  #${elementIds.msg}.negative {
    background-color: ${colors.negative};
    color: #fff !important;
  }

  #${elementIds.msg}.positive {
    background-color: ${colors.positive};
    color: #fff;
  }

	#${elementIds.msg} {
		position: fixed;
    padding: 8px;
    text-align: center;
    font-family: "Rubik", "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 16px;
    color: #333 !important;
    z-index: 2147483647;
    border: 3px solid white;
    border-radius: 0 0 5px 5px;
    box-shadow: 0 0 10px #000;
    background-color: rgba(247, 247, 247, 1);
    right: 0;
    width: 350px;
    top: -1000px;
    transition: all .5s ease;
    box-sizing: border-box;
	}

  #${elementIds.msg} label {
    display: inline;
  }

  #${elementIds.msgBtnClose} {
    position: absolute;
    top: 0;
    right: 0;
    width: 25px;
    height: 25px;
    box-sizing: border-box;
    border-radius: 25px;
    cursor: pointer;
    line-height: 25px;
    padding: 0;
    background: #666;
    transition: all .3s ease;
  }

  #${elementIds.msgBtnClose}:hover {
    background: #333;
    box-shadow: 0 0 0 2px #fff;
  }

  #${elementIds.msg} a {
    color: #333;
    cursor: pointer;
    text-decoration: none;
  }

  #${elementIds.quietStart} {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 2147483646;
    background: rgba(255, 255, 255, 0.7);
    font-family: "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif;
    padding: 10px;
    color: #333;
  }

  #${elementIds.overlay} {
    background: #000;
    opacity: 0.5;
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 2147483646;
  }

  #${elementIds.msg} fieldset {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  #${elementIds.msg} fieldset legend { 
    background: none;
    display: inline-block;
  }

  #${elementIds.msg} h1, 
  #${elementIds.msg} h2, 
  #${elementIds.msg} h3, 
  #${elementIds.msg} h4, 
  #${elementIds.msg} h5, 
  #${elementIds.msg} h6 {
    font-size: 20px;
    padding: 0;
    background: none;
    margin: 8px;
    font-family: "Rubik", "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif;
    border: none;
    color: #000;
  }

	.${cssPrefix}btn {
		font-size: 16px; 
		color: white; 
		background-color: ${colors.default}; 
    display: inline-block; 
    font-family: "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif;
    padding: 10px; 
    margin: 10px 5px 0 5px;
    border: none; 
    border-radius: 5px;
	}

  .${cssPrefix}scroll {
    max-height: 400px;
    overflow-y: scroll;
  }

	#${elementIds.msg} .${cssPrefix}btn.positive {
		background-color: ${colors.positive};
    color: #fff !important;
	}

  #${elementIds.msg} .${cssPrefix}btn.outline {
    background: none !important;
    border: 1px solid ${colors.default} !important;
    color: ${colors.default} !important;
  }

	#${elementIds.msg} .${cssPrefix}btn.negative {
		background-color: ${colors.negative};
    color: #fff;
	}
`;

/* jshint ignore:end */
export default {stylesheet, elementIds, cssPrefix};

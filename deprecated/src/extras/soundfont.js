/*!
 * timbre.soundfont.js
 * http://skratchdot.com/projects/timbre.soundfont.js/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*globals timbre */
(function () {
	'use strict';

	var soundfont = {},
		// config
		maxLoadTime = 5000,
		// settings
		urlTemplate = 'https://free-midi.googlecode.com/git/channel/0/instrument/{instrument}/{note}.js?_callback=soundfont_0_{instrument}_{note}',
		name = 'gm',
		channel = 0,
		instrument = 0,
		length = 64,
		jsonp = true,
		// functions
		ensureNote,
		getSample,
		// this is where we cache audio objects (and play/replay them)
		audioCache = {};

	ensureNote = function (note) {
		// make sure name exists
		if (!audioCache.hasOwnProperty(name)) {
			audioCache[name] = {};
		}
		// make sure channel exists
		if (!audioCache[name].hasOwnProperty(channel)) {
			audioCache[name][channel] = {};
		}
		// make sure instrument exists
		if (!audioCache[name][channel].hasOwnProperty(instrument)) {
			audioCache[name][channel][instrument] = {};
		}
		// make sure length exists
		if (!audioCache[name][channel][instrument].hasOwnProperty(length)) {
			audioCache[name][channel][instrument][length] = {};
		}
		// make sure note exists
		if (!audioCache[name][channel][instrument][length].hasOwnProperty(note)) {
			audioCache[name][channel][instrument][length][note] = {
				sample: null,
				isLoading: false,
				loadTime: (new Date()).getTime(),
				callbacks: []
			};
		}
	};

	getSample = function (note, callback) {
		var audio, url;
		ensureNote(note);
		audio = audioCache[name][channel][instrument][length][note];
		if (audio.sample !== null) {
			callback(audio, true);
		} else if (audio.isLoading && (new Date()).getTime() - audio.loadTime < maxLoadTime) {
			audio.callbacks.push(callback);
		} else {
			audio.isLoading = true;
			try {
				url = urlTemplate.replace(/\{name\}/gi, name)
						.replace(/\{channel\}/gi, channel)
						.replace(/\{instrument\}/gi, instrument)
						.replace(/\{length\}/gi, length)
						.replace(/\{note\}/gi, note);

				timbre('audio' + (jsonp ? '.jsonp' : '')).loadthis(url, function () {
					var i, cb;
					audio.sample = this;
					// execute and empty callbacks
					for (i = 0; i < audio.callbacks.length; i++) {
						cb = audio.callbacks[i];
						if (typeof cb === 'function') {
							cb(audio, false);
						}
					}
					audio.callbacks = [];
					audio.isLoading = false;
					callback(audio, false);
					// execute global onLoad callback
					soundfont.onLoad(audio, note);
				}, function () {
					// execute global onError 
					throw new Error('T("audio").loadthis() error.');
				}).on('ended', function () {
					audio.sample.pause();
				});
			} catch (e) {
				audio.isLoading = false;
				audio.sample = null;
				audio.callbacks.push(callback);
				// execute global onError callback
				soundfont.onError(e, note);
			}
		}
	};

	soundfont.emptyCache = function () {
		audioCache = {};
	};

	soundfont.setUrlTemplate = function (newUrlTemplate) {
		soundfont.emptyCache();
		urlTemplate = newUrlTemplate;
	};

	soundfont.setName = function (newName) {
		name = newName;
	};

	soundfont.setChannel = function (newChannel) {
		channel = newChannel;
	};

	soundfont.setInstrument = function (newInstrument) {
		instrument = newInstrument;
	};

	soundfont.setLength = function (newLength) {
		length = newLength;
	};

	soundfont.setJsonp = function (newJsonp) {
		jsonp = (newJsonp === true) ? true : false;
	};

	soundfont.preload = function (noteArray) {
		var i, noop = function () {};
		for (i = 0; i < noteArray.length; i++) {
			getSample(noteArray[i], noop);
		}
	};

	soundfont.play = function (note, playOnLoad, options) {
		playOnLoad = (playOnLoad === false) ? false : true;
		options = (typeof options === 'object') ? options : {};
		getSample(note, function (audio, isImmediate) {
			if (isImmediate || playOnLoad) {
				audio.sample.set(options).play().bang();
			}
		});
	};

	// this can be overridden by end users
	soundfont.onError = function () {};

	// this can be overridden by end users
	soundfont.onLoad = function () {};

	if (timbre &&
		timbre.modules &&
		timbre.modules.Decoder &&
		timbre.modules.Decoder.mp3_decode &&
		timbre.envtype === 'browser') {
		timbre.soundfont = soundfont;
	}
}());
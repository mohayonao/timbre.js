/*!
 * timbre.mp3_decode.js
 * http://skratchdot.com/projects/timbre.mp3_decode.js/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*globals timbre, Mad, Float32Array */
if (typeof timbre !== 'undefined' && typeof Mad !== 'undefined' && timbre.envtype === 'browser') {
	(function (T) {
		T.modules.Decoder.mp3_decode = (function() {
			var _decode = function(data, onloadedmetadata, onloadeddata) {
				var i, j, x,
					arrayStream, mp3File, mpegStream,
					synth, frame,
					channels, samplerate, length = 0,
					samples = [], currentBuffers, total, frameIndex = 0,
					mixdown, bufferL, bufferR, isInited;
				try {
					arrayStream = new Mad.ArrayBuffers.ArrayStream(data);
					mp3File = new Mad.MP3File(arrayStream);
					mpegStream = mp3File.getMpegStream();
					synth = new Mad.Synth();
					frame = new Mad.Frame();
					frame = Mad.Frame.decode(frame, mpegStream);
					while (frame !== null) {
						// synth will get us our pcm data
						synth.frame(frame);

						// set channels and samplerate
						if (!isInited) {
							channels = synth.pcm.channels;
							samplerate = synth.pcm.samplerate;
							isInited = true;
						}

						// build out our total length
						length += synth.pcm.length;

						// store this frame
						samples.push({
							mixdown: undefined,
							bufferL: undefined,
							bufferR: undefined
						});

						// populate this frame
						samples[frameIndex].mixdown = new Float32Array(synth.pcm.length);
						if (channels === 2) {
							samples[frameIndex].bufferL = new Float32Array(synth.pcm.length);
							samples[frameIndex].bufferR = new Float32Array(synth.pcm.length);
							for (i = 0; i < synth.pcm.length; i++) {
								x = samples[frameIndex].bufferL[i] = synth.pcm.samples[0][i];
								x += samples[frameIndex].bufferR[i] = synth.pcm.samples[1][i];
								samples[frameIndex].mixdown[i] = x * 0.5;
							}
						} else if (channels === 1) {
							for (i = 0; i < synth.pcm.length; i++) {
								samples[frameIndex].mixdown[i] = synth.pcm.samples[0][i];
							}
						}

						// process next frame
						frame = Mad.Frame.decode(frame, mpegStream);
						frameIndex++;
					}
				} catch (err) {}

				// we didn't get a valid mp3
				if (length === 0 || channels < 1 || channels > 2) {
					return onloadedmetadata(false);
				}
				mixdown = new Float32Array(length);
				if (channels === 2) {
					bufferL = new Float32Array(length);
					bufferR = new Float32Array(length);
				}

				// we've loaded our meta data
				onloadedmetadata({
					samplerate: samplerate,
					channels  : channels,
					buffer	: [mixdown, bufferL, bufferR],
					duration  : length / samplerate
				});

				// now populate our full buffers
				total = 0;
				for (i = 0; i < samples.length; i++) {
					currentBuffers = samples[i];
					for (j = 0; j < currentBuffers.mixdown.length; j++) {
						mixdown[total] = currentBuffers.mixdown[j];
						if (channels === 2) {
							bufferL[total] = currentBuffers.bufferL[j];
							bufferR[total] = currentBuffers.bufferR[j];
						}
						total++;
					}
				}
				
				onloadeddata();
			};

			return function (src, onloadedmetadata, onloadeddata) {
				if (typeof src === "string") {
					T.modules.Decoder.getBinaryWithPath(src, function(data) {
						_decode(data, onloadedmetadata, onloadeddata);
					});
				} else {
					_decode(src, onloadedmetadata, onloadeddata);
				}
			};
		})();
	}(timbre));
}
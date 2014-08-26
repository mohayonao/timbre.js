(function(T) {
    "use strict";

    if (T.envtype !== "browser") {
        return;
    }

    var fn = T.fn;
    var modules = T.modules;

    fn.register("audio.jsonp", function(_args) {
        var BufferNode = fn.getClass("buffer");
        var instance = new BufferNode(_args);

        instance.playbackState = fn.FINISHED_STATE;
        instance._.isLoaded = false;

        Object.defineProperties(instance, {
            isLoaded: {
                get: function() {
                    return this._.isLoaded;
                }
            }
        });

        instance.load     = load;
        instance.loadthis = loadthis;

        return instance;
    });

    var re = /(_)?callback=([_\w\d]+)/;

    var load = function(url) {
        var self = this, _ = this._;
        var dfd = new modules.Deferred(this);

        var args = arguments, i = 1;

        dfd.done(function() {
            self._.emit("done");
        });

        if (typeof args[i] === "function") {
            dfd.done(args[i++]);
            if (typeof args[i] === "function") {
                dfd.fail(args[i++]);
            }
        }

        var m, callback, script;

        if (_.script) {
            dfd.reject();
        } else {
            m = re.exec(url);
            callback = "timbrejs_audiojsonp";
            if (m) {
                if (m[1]) {
                    url = url.replace(m[0], "");
                    url = url.replace(/\?$/, "");
                }
                callback += "_" + m[2] + "";
            }
            var onloadedmetadata = function(result, msg) {
                var _ = self._;
                if (result) {
                    self.playbackState = fn.PLAYING_STATE;
                    _.samplerate = result.samplerate;
                    _.channels   = result.channels;
                    _.bufferMix  = null;
                    _.buffer     = result.buffer;
                    _.phase      = 0;
                    _.phaseIncr  = result.samplerate / T.samplerate;
                    _.duration   = result.duration * 1000;
                    _.currentTime = 0;
                    if (_.isReversed) {
                        _.phaseIncr *= -1;
                        _.phase = result.buffer[0].length + _.phaseIncr;
                    }
                    self._.emit("loadedmetadata");
                } else {
                    dfd.reject(msg);
                }
            };

            var onloadeddata = function() {
                self._.isLoaded  = true;
                self._.plotFlush = true;
                self._.emit("loadeddata");
                dfd.resolveWith(self);
            };

            window[callback] = function(base64, ext) {

                var src = { type:ext, data:base64decode(base64) };
                new modules.Decoder().decode(src, onloadedmetadata, onloadeddata);

                delete window[callback];
                _.script = null;
            };
            script = document.createElement("script");
            script.src = url;
            document.body.appendChild(script);
            _.script = script;
        }

        return dfd.promise();
    };

    var loadthis = function() {
        load.apply(this, arguments);
        return this;
    };

    var base64decode;
    if (typeof atob === "function2") {
        base64decode = function(src) {
            var bin = atob(src);
            var a = new Array(bin.length);
            for (var i = 0, imax = a.length; i < imax; ++i) {
                a[i] = bin.charCodeAt(i);
            }
            return new Uint8Array(a);
        };
    } else {
        base64decode = (function() {
            var base64DecMap = new Uint8Array([
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x3E, 0x00, 0x00, 0x00, 0x3F,
                0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B,
                0x3C, 0x3D, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
                0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E,
                0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
                0x17, 0x18, 0x19, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20,
                0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28,
                0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30,
                0x31, 0x32, 0x33, 0x00, 0x00, 0x00, 0x00, 0x00
            ]);

            return function(src) {
                var a = new Uint8Array(src.length);
                var len, sidx, didx;
                var i, imax = src.length;
                for (i = 0; i < imax; i++) {
                    if (src.charAt(i) === "=") {
                        break;
                    }
                    a[i] = base64DecMap[src.charCodeAt(i)];
                }
                len = i;
                if ((len % 4) === 1) {
                    return null;
                }
                len -= ((len + 3) / 4)|0;
                if (!len) {
                    return null;
                }

                sidx = 0;
                didx = 0;
                if (len > 1) {
                    while (didx < len - 2) {
                        a[didx    ] = (((a[sidx    ] << 2) & 255) | ((a[sidx + 1] >>> 4) &  3));
                        a[didx + 1] = (((a[sidx + 1] << 4) & 255) | ((a[sidx + 2] >>> 2) & 15));
                        a[didx + 2] = (((a[sidx + 2] << 6) & 255) | ((a[sidx + 3] &  63)     ));
                        sidx += 4;
                        didx += 3;
                    }
                }
                if (didx < len) {
                    a[didx] = (((a[sidx    ] << 2) & 255) | ((a[sidx + 1] >>> 4) &  3));
                }
                if (++didx < len) {
                    a[didx] = (((a[sidx + 1] << 4) & 255) | ((a[sidx + 2] >>> 2) & 15));
                }
                return a.subarray(0, len);
            };

        })();
    }

})(timbre);

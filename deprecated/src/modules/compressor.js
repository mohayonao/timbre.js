(function(T) {
    "use strict";

    var MaxPreDelayFrames     = 1024;
    var MaxPreDelayFramesMask = MaxPreDelayFrames - 1;
    var DefaultPreDelayFrames = 256;
    var kSpacingDb = 5;

    function Compressor(samplerate, channels) {
        this.samplerate = samplerate;
        this.channels = channels;

        this.lastPreDelayFrames = 0;
        this.preDelayReadIndex  = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        this.ratio       = -1;
        this.slope       = -1;
        this.linearThreshold = -1;
        this.dbThreshold = -1;
        this.dbKnee      = -1;
        this.kneeThreshold    = -1;
        this.kneeThresholdDb  = -1;
        this.ykneeThresholdDb = -1;
        this.K = -1;

        this.attackTime  = 0.003;
        this.releaseTime = 0.25;

        this.preDelayTime = 0.006;
        this.dbPostGain   = 0;
        this.effectBlend  = 1;
        this.releaseZone1 = 0.09;
        this.releaseZone2 = 0.16;
        this.releaseZone3 = 0.42;
        this.releaseZone4 = 0.98;

        this.detectorAverage = 0;
        this.compressorGain  = 1;
        this.meteringGain    = 1;

        this.delayBufferL = new T.fn.SignalArray(MaxPreDelayFrames);
        if (channels === 2) {
            this.delayBufferR = new T.fn.SignalArray(MaxPreDelayFrames);
        } else {
            this.delayBufferR = this.delayBufferL;
        }
        this.preDelayTime = 6;
        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        this.maxAttackCompressionDiffDb = -1;
        this.meteringReleaseK = 1 - Math.exp(-1 / (this.samplerate * 0.325));

        this.setAttackTime(this.attackTime);
        this.setReleaseTime(this.releaseTime);
        this.setPreDelayTime(this.preDelayTime);
        this.setParams(-24, 30, 12);
    }

    var $ = Compressor.prototype;

    $.clone = function() {
        var new_instance = new Compressor(this.samplerate, this.channels);
        new_instance.setAttackTime(this.attackTime);
        new_instance.setReleaseTime(this.releaseTime);
        new_instance.setPreDelayTime(this.preDelayTime);
        new_instance.setParams(this.dbThreshold, this.dbKnee, this.ratio);
        return new_instance;
    };

    $.setAttackTime = function(value) {
        this.attackTime = Math.max(0.001, value);
        this._attackFrames = this.attackTime * this.samplerate;
    };

    $.setReleaseTime = function(value) {
        this.releaseTime = Math.max(0.001, value);
        var releaseFrames = this.releaseTime * this.samplerate;

        var satReleaseTime = 0.0025;
        this._satReleaseFrames = satReleaseTime * this.samplerate;

        var y1 = releaseFrames * this.releaseZone1;
        var y2 = releaseFrames * this.releaseZone2;
        var y3 = releaseFrames * this.releaseZone3;
        var y4 = releaseFrames * this.releaseZone4;

        this._kA = 0.9999999999999998*y1 + 1.8432219684323923e-16*y2 - 1.9373394351676423e-16*y3 + 8.824516011816245e-18*y4;
        this._kB = -1.5788320352845888*y1 + 2.3305837032074286*y2 - 0.9141194204840429*y3 + 0.1623677525612032*y4;
        this._kC = 0.5334142869106424*y1 - 1.272736789213631*y2 + 0.9258856042207512*y3 - 0.18656310191776226*y4;
        this._kD = 0.08783463138207234*y1 - 0.1694162967925622*y2 + 0.08588057951595272*y3 - 0.00429891410546283*y4;
        this._kE = -0.042416883008123074*y1 + 0.1115693827987602*y2 - 0.09764676325265872*y3 + 0.028494263462021576*y4;
    };

    $.setPreDelayTime = function(preDelayTime) {
        this.preDelayTime = preDelayTime;
        var preDelayFrames = preDelayTime * this.samplerate;
        if (preDelayFrames > MaxPreDelayFrames - 1) {
            preDelayFrames = MaxPreDelayFrames - 1;
        }
        if (this.lastPreDelayFrames !== preDelayFrames) {
            this.lastPreDelayFrames = preDelayFrames;
            for (var i = 0, imax = this.delayBufferL.length; i < imax; ++i) {
                this.delayBufferL[i] = this.delayBufferR[i] = 0;
            }
            this.preDelayReadIndex = 0;
            this.preDelayWriteIndex = preDelayFrames;
        }
    };

    $.setParams = function(dbThreshold, dbKnee, ratio) {
        this._k = this.updateStaticCurveParameters(dbThreshold, dbKnee, ratio);

        var fullRangeGain = this.saturate(1, this._k);
        var fullRangeMakeupGain = 1 / fullRangeGain;

        fullRangeMakeupGain = Math.pow(fullRangeMakeupGain, 0.6);

        this._masterLinearGain = Math.pow(10, 0.05 * this.dbPostGain) * fullRangeMakeupGain;
    };

    $.kneeCurve = function(x, k) {
        if (x < this.linearThreshold) {
            return x;
        }
        return this.linearThreshold + (1 - Math.exp(-k * (x - this.linearThreshold))) / k;
    };

    $.saturate = function(x, k) {
        var y;
        if (x < this.kneeThreshold) {
            y = this.kneeCurve(x, k);
        } else {
            var xDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            var yDb = this.ykneeThresholdDb + this.slope * (xDb - this.kneeThresholdDb);
            y = Math.pow(10, 0.05 * yDb);
        }
        return y;
    };

    $.slopeAt = function(x, k) {
        if (x < this.linearThreshold) {
            return 1;
        }

        var x2   = x * 1.001;
        var xDb  = (x ) ? 20 * Math.log(x ) * Math.LOG10E : -1000;
        var x2Db = (x2) ? 20 * Math.log(x2) * Math.LOG10E : -1000;
        var y  = this.kneeCurve(x , k);
        var y2 = this.kneeCurve(x2, k);
        var yDb  = (y ) ? 20 * Math.log(y ) * Math.LOG10E : -1000;
        var y2Db = (y2) ? 20 * Math.log(y2) * Math.LOG10E : -1000;

        return (y2Db - yDb) / (x2Db - xDb);
    };

    $.kAtSlope = function(desiredSlope) {
        var xDb = this.dbThreshold + this.dbKnee;
        var x   = Math.pow(10, 0.05 * xDb);

        var minK = 0.1;
        var maxK = 10000;
        var k = 5;

        for (var i = 0; i < 15; ++i) {
            var slope = this.slopeAt(x, k);
            if (slope < desiredSlope) {
                maxK = k;
            } else {
                minK = k;
            }
            k = Math.sqrt(minK * maxK);
        }
        return k;
    };

    $.updateStaticCurveParameters = function(dbThreshold, dbKnee, ratio) {
        this.dbThreshold     = dbThreshold;
        this.linearThreshold = Math.pow(10, 0.05 * dbThreshold);
        this.dbKnee          = dbKnee;

        this.ratio = ratio;
        this.slope = 1 / this.ratio;

        this.kneeThresholdDb = dbThreshold + dbKnee;
        this.kneeThreshold   = Math.pow(10, 0.05 * this.kneeThresholdDb);

        var k = this.kAtSlope(1 / this.ratio);
        var y = this.kneeCurve(this.kneeThreshold, k);
        this.ykneeThresholdDb = (y) ? 20 * Math.log(y) * Math.LOG10E : -1000;

        this._k = k;

        return this._k;
    };

    $.process = function(cellL, cellR) {
        var dryMix = 1 - this.effectBlend;
        var wetMix = this.effectBlend;
        var k = this._k;
        var masterLinearGain = this._masterLinearGain;
        var satReleaseFrames = this._satReleaseFrames;
        var kA = this._kA;
        var kB = this._kB;
        var kC = this._kC;
        var kD = this._kD;
        var kE = this._kE;
        var nDivisionFrames = 64;
        var nDivisions = cellL.length / nDivisionFrames;
        var frameIndex = 0;
        var desiredGain = this.detectorAverage;
        var compressorGain = this.compressorGain;
        var maxAttackCompressionDiffDb = this.maxAttackCompressionDiffDb;
        var i_attackFrames = 1 / this._attackFrames;
        var preDelayReadIndex = this.preDelayReadIndex;
        var preDelayWriteIndex = this.preDelayWriteIndex;
        var detectorAverage = this.detectorAverage;
        var delayBufferL = this.delayBufferL;
        var delayBufferR = this.delayBufferR;
        var meteringGain = this.meteringGain;
        var meteringReleaseK = this.meteringReleaseK;

        for (var i = 0; i < nDivisions; ++i) {
            var scaledDesiredGain = Math.asin(desiredGain) / (0.5 * Math.PI);
            var envelopeRate;
            var isReleasing = scaledDesiredGain > compressorGain;
            var x = compressorGain / scaledDesiredGain;

            var compressionDiffDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            if (compressionDiffDb === Infinity || isNaN(compressionDiffDb)) {
                compressionDiffDb = -1;
            }

            if (isReleasing) {
                maxAttackCompressionDiffDb = -1;

                x = compressionDiffDb;
                if (x < -12) {
                    x = 0;
                } else if (x > 0) {
                    x = 3;
                } else {
                    x = 0.25 * (x + 12);
                }

                var x2 = x * x;
                var x3 = x2 * x;
                var x4 = x2 * x2;
                var _releaseFrames = kA + kB * x + kC * x2 + kD * x3 + kE * x4;

                var _dbPerFrame = kSpacingDb / _releaseFrames;

                envelopeRate = Math.pow(10, 0.05 * _dbPerFrame);
            } else {
                if (maxAttackCompressionDiffDb === -1 || maxAttackCompressionDiffDb < compressionDiffDb) {
                    maxAttackCompressionDiffDb = compressionDiffDb;
                }

                var effAttenDiffDb = Math.max(0.5, maxAttackCompressionDiffDb);

                x = 0.25 / effAttenDiffDb;
                envelopeRate = 1 - Math.pow(x, i_attackFrames);
            }

            var loopFrames = nDivisionFrames;
            while (loopFrames--) {
                var compressorInput = 0;

                var absUndelayedSource = (cellL[frameIndex] + cellR[frameIndex]) * 0.5;
                delayBufferL[preDelayWriteIndex] = cellL[frameIndex];
                delayBufferR[preDelayWriteIndex] = cellR[frameIndex];

                if (absUndelayedSource < 0) {
                    absUndelayedSource *= -1;
                }
                if (compressorInput < absUndelayedSource) {
                    compressorInput = absUndelayedSource;
                }

                var absInput = compressorInput;
                if (absInput < 0) {
                    absInput *= -1;
                }

                var shapedInput = this.saturate(absInput, k);
                var attenuation = absInput <= 0.0001 ? 1 : shapedInput / absInput;
                var attenuationDb = (attenuation) ? -20 * Math.log(attenuation) * Math.LOG10E : 1000;
                if (attenuationDb < 2) {
                    attenuationDb = 2;
                }

                var dbPerFrame = attenuationDb / satReleaseFrames;
                var satReleaseRate = Math.pow(10, 0.05 * dbPerFrame) - 1;
                var isRelease = (attenuation > detectorAverage);
                var rate = isRelease ? satReleaseRate : 1;

                detectorAverage += (attenuation - detectorAverage) * rate;
                if (detectorAverage > 1) {
                    detectorAverage = 1;
                }

                if (envelopeRate < 1) {
                    compressorGain += (scaledDesiredGain - compressorGain) * envelopeRate;
                } else {
                    compressorGain *= envelopeRate;
                    if (compressorGain > 1) {
                        compressorGain = 1;
                    }
                }

                var postWarpCompressorGain = Math.sin(0.5 * Math.PI * compressorGain);
                var totalGain = dryMix + wetMix * masterLinearGain * postWarpCompressorGain;

                var dbRealGain = 20 * Math.log(postWarpCompressorGain) * Math.LOG10E;
                if (dbRealGain < meteringGain)  {
                    meteringGain = dbRealGain;
                } else {
                    meteringGain += (dbRealGain - meteringGain) * meteringReleaseK;
                }
                cellL[frameIndex] = delayBufferL[preDelayReadIndex] * totalGain;
                cellR[frameIndex] = delayBufferR[preDelayReadIndex] * totalGain;

                frameIndex++;
                preDelayReadIndex  = (preDelayReadIndex  + 1) & MaxPreDelayFramesMask;
                preDelayWriteIndex = (preDelayWriteIndex + 1) & MaxPreDelayFramesMask;
            }

            if (detectorAverage < 1e-6) {
                detectorAverage = 1e-6;
            }
            if (compressorGain < 1e-6) {
                compressorGain = 1e-6;
            }
        }
        this.preDelayReadIndex  = preDelayReadIndex;
        this.preDelayWriteIndex = preDelayWriteIndex;
        this.detectorAverage    = detectorAverage;
        this.compressorGain = compressorGain;
        this.maxAttackCompressionDiffDb = maxAttackCompressionDiffDb;
        this.meteringGain = meteringGain;
    };

    $.reset = function() {
        this.detectorAverage = 0;
        this.compressorGain = 1;
        this.meteringGain = 1;

        for (var i = 0, imax = this.delayBufferL.length; i < imax; ++i) {
            this.delayBufferL[i] = this.delayBufferR[i] = 0;
        }

        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;

        this.maxAttackCompressionDiffDb = -1;
    };

    T.modules.Compressor = Compressor;

})(timbre);

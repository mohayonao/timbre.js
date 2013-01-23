(function() {
    "use strict";
    
    var MaxPreDelayFrames     = 1024;
    var MaxPreDelayFramesMask = MaxPreDelayFrames - 1;
    var DefaultPreDelayFrames = 256;
    var kSpacingDb = 5;
    
    function Compressor(samplerate) {
        this.samplerate = samplerate || 44100;
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
        
        // Initializes most member variables
        
        this.detectorAverage = 0;
        this.compressorGain  = 1;
        this.meteringGain    = 1;
        
        // Predelay section.
        this.preDelayBuffer = new Float32Array(MaxPreDelayFrames);
        
        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        
        this.maxAttackCompressionDiffDb = -1; // uninitialized state
        
        this.meteringReleaseK = 1 - Math.exp(-1 / (this.samplerate * 0.325));
        
        this.setAttackTime(this.attackTime);
        this.setReleaseTime(this.releaseTime);
        this.setParams(-24, 30, 12);
    }
    
    var $ = Compressor.prototype;

    $.setAttackTime = function(value) {
        // Attack parameters.
        this.attackTime = Math.max(0.001, value);
        this._attackFrames = this.attackTime * this.samplerate;
    };

    $.setReleaseTime = function(value) {
        // Release parameters.
        this.releaseTime = Math.max(0.001, value);
        var releaseFrames = this.releaseTime * this.samplerate;
        
        // Detector release time.
        var satReleaseTime = 0.0025;
        this._satReleaseFrames = satReleaseTime * this.samplerate;
        
        // Create a smooth function which passes through four points.
        
        // Polynomial of the form
        // y = a + b*x + c*x^2 + d*x^3 + e*x^4;
        
        var y1 = releaseFrames * this.releaseZone1;
        var y2 = releaseFrames * this.releaseZone2;
        var y3 = releaseFrames * this.releaseZone3;
        var y4 = releaseFrames * this.releaseZone4;
        
        // All of these coefficients were derived for 4th order polynomial curve fitting where the y values
        // match the evenly spaced x values as follows: (y1 : x == 0, y2 : x == 1, y3 : x == 2, y4 : x == 3)
        this._kA = 0.9999999999999998*y1 + 1.8432219684323923e-16*y2 - 1.9373394351676423e-16*y3 + 8.824516011816245e-18*y4;
        this._kB = -1.5788320352845888*y1 + 2.3305837032074286*y2 - 0.9141194204840429*y3 + 0.1623677525612032*y4;
        this._kC = 0.5334142869106424*y1 - 1.272736789213631*y2 + 0.9258856042207512*y3 - 0.18656310191776226*y4;
        this._kD = 0.08783463138207234*y1 - 0.1694162967925622*y2 + 0.08588057951595272*y3 - 0.00429891410546283*y4;
        this._kE = -0.042416883008123074*y1 + 0.1115693827987602*y2 - 0.09764676325265872*y3 + 0.028494263462021576*y4;
        
        // x ranges from 0 -> 3       0    1    2   3
        //                           -15  -10  -5   0db
        
        // y calculates adaptive release frames depending on the amount of compression.
    };
    
    $.setPreDelayTime = function(preDelayTime) {
        // Re-configure look-ahead section pre-delay if delay time has changed.
        var preDelayFrames = preDelayTime * this.samplerate;
        if (preDelayFrames > MaxPreDelayFrames - 1) {
            preDelayFrames = MaxPreDelayFrames - 1;
        }
        if (this.lastPreDelayFrames !== preDelayFrames) {
            this.lastPreDelayFrames = preDelayFrames;
            for (var i = this.preDelayBuffer.length; i--; ) {
                this.preDelayBuffer[i] = 0;
            }
            this.preDelayReadIndex = 0;
            this.preDelayWriteIndex = preDelayFrames;
        }
    };

    $.setParams = function(dbThreshold, dbKnee, ratio) {
        this._k = this.updateStaticCurveParameters(dbThreshold, dbKnee, ratio);
        
        // Makeup gain.
        var fullRangeGain = this.saturate(1, this._k);
        var fullRangeMakeupGain = 1 / fullRangeGain;

        // Empirical/perceptual tuning.
        fullRangeMakeupGain = Math.pow(fullRangeMakeupGain, 0.6);

        this._masterLinearGain = Math.pow(10, 0.05 * this.dbPostGain) * fullRangeMakeupGain;
    };
    
    // Exponential curve for the knee.
    // It is 1st derivative matched at m_linearThreshold and asymptotically approaches the value m_linearThreshold + 1 / k.
    $.kneeCurve = function(x, k) {
    // Linear up to threshold.
        if (x < this.linearThreshold) {
            return x;
        }
        return this.linearThreshold + (1 - Math.exp(-k * (x - this.linearThreshold))) / k;
    };
    
    // Full compression curve with constant ratio after knee.
    $.saturate = function(x, k) {
        var y;
        
        if (x < this.kneeThreshold) {
            y = this.kneeCurve(x, k);
        } else {
            // Constant ratio after knee.
            // var xDb = linearToDecibels(x);
            var xDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            
            var yDb = this.ykneeThresholdDb + this.slope * (xDb - this.kneeThresholdDb);
            
            // y = decibelsToLinear(yDb);
            y = Math.pow(10, 0.05 * yDb);
        }
        
        return y;
    };
    
    // Approximate 1st derivative with input and output expressed in dB.
    // This slope is equal to the inverse of the compression "ratio".
    // In other words, a compression ratio of 20 would be a slope of 1/20.
    $.slopeAt = function(x, k) {
        if (x < this.linearThreshold) {
            return 1;
        }
        var x2 = x * 1.001;
        
        // var xDb  = linearToDecibels(x);
        var xDb  = (x ) ? 20 * Math.log(x ) * Math.LOG10E : -1000;
        // var xDb2 = linearToDecibels(x2);
        var x2Db = (x2) ? 20 * Math.log(x2) * Math.LOG10E : -1000;
        
        var y  = this.kneeCurve(x , k);
        var y2 = this.kneeCurve(x2, k);
        
        // var yDb  = linearToDecibels(y);
        var yDb  = (y ) ? 20 * Math.log(y ) * Math.LOG10E : -1000;
        // var yDb2 = linearToDecibels(y2);
        var y2Db = (y2) ? 20 * Math.log(y2) * Math.LOG10E : -1000;
        
        var m = (y2Db - yDb) / (x2Db - xDb);
        
        return m;
    };
    
    $.kAtSlope = function(desiredSlope) {
        var xDb = this.dbThreshold + this.dbKnee;
        // var x = decibelsToLinear(xDb);
        var x = Math.pow(10, 0.05 * xDb);
        
        // Approximate k given initial values.
        var minK = 0.1;
        var maxK = 10000;
        var k = 5;
        
        for (var i = 0; i < 15; ++i) {
            // A high value for k will more quickly asymptotically approach a slope of 0.
            var slope = this.slopeAt(x, k);
            
            if (slope < desiredSlope) {
                // k is too high.
                maxK = k;
            } else {
                // k is too low.
                minK = k;
            }
            
            // Re-calculate based on geometric mean.
            k = Math.sqrt(minK * maxK);
        }
        
        return k;
    };
    
    $.updateStaticCurveParameters = function(dbThreshold, dbKnee, ratio) {
        this.dbThreshold     = dbThreshold;
        // this.linearThreshold = decibelsToLinear(dbThreshold);
        this.linearThreshold = Math.pow(10, 0.05 * dbThreshold);
        this.dbKnee          = dbKnee;
        
        this.ratio = ratio;
        this.slope = 1 / this.ratio;
        
        var k = this.kAtSlope(1 / this.ratio);
        
        this.kneeThresholdDb = dbThreshold + dbKnee;
        // this.kneeThreshold = decibelsToLinear(this.kneeThresholdDb);
        this.kneeThreshold = Math.pow(10, 0.05 * this.kneeThresholdDb);
        
        var y = this.kneeCurve(this.kneeThreshold, k);
        // this.ykneeThresholdDb = linearToDecibels(y);
        this.ykneeThresholdDb = (y) ? 20 * Math.log(y ) * Math.LOG10E : -1000;
        
        this.K = k;

        return this.K;
    };
    
    $.process = function(cell) {
        var dryMix = 1 - this.effectBlend;
        var wetMix = this.effectBlend;
        
        var k = this._k;
        var masterLinearGain = this._masterLinearGain;
        
        var satReleaseFrames = this._satReleaseFrame;
        var kA = this._kA;
        var kB = this._kB;
        var kC = this._kC;
        var kD = this._kD;
        var kE = this._kE;
        
        // this.setPreDelayTime(this.preDelayTime);
        
        var nDivisionFrames = 64;
        
        var nDivisions = cell.length / nDivisionFrames;
        
        var frameIndex = 0;
        for (var i = 0; i < nDivisions; ++i) {
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Calculate desired gain
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            var desiredGain = this.detectorAverage;
            
            // Pre-warp so we get desiredGain after sin() warp below.
            var scaledDesiredGain = Math.asin(desiredGain) / (0.5 * Math.PI);
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Deal with envelopes
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            
            // envelopeRate is the rate we slew from current compressor level to the desired level.
            // The exact rate depends on if we're attacking or releasing and by how much.
            var envelopeRate;
            
            var isReleasing = scaledDesiredGain > this.compressorGain;
            
            // compressionDiffDb is the difference between current compression level and the desired level.
            var x = this.compressorGain / scaledDesiredGain;
            
            // var compressionDiffDb = -linearToDecibels(x);
            var compressionDiffDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            
            if (isReleasing) {
                // Release mode - compressionDiffDb should be negative dB
                this.maxAttackCompressionDiffDb = -1;
                
                // Adaptive release - higher compression (lower compressionDiffDb)  releases faster.
                
                // Contain within range: -12 -> 0 then scale to go from 0 -> 3
                x = compressionDiffDb;
                x = Math.max(-12.0, x);
                x = Math.min(0.0, x);
                x = 0.25 * (x + 12);
                
                // Compute adaptive release curve using 4th order polynomial.
                // Normal values for the polynomial coefficients would create a monotonically increasing function.
                var x2 = x * x;
                var x3 = x2 * x;
                var x4 = x2 * x2;
                var _releaseFrames = kA + kB * x + kC * x2 + kD * x3 + kE * x4;
                
                var _dbPerFrame = kSpacingDb / _releaseFrames;
                
                // envelopeRate = decibelsToLinear(_dbPerFrame);
                envelopeRate = Math.pow(10, 0.05 * _dbPerFrame);
            } else {
                // Attack mode - compressionDiffDb should be positive dB
                
                // As long as we're still in attack mode, use a rate based off
                // the largest compressionDiffDb we've encountered so far.
                if (this.maxAttackCompressionDiffDb === -1 || this.maxAttackCompressionDiffDb < compressionDiffDb) {
                    this.maxAttackCompressionDiffDb = compressionDiffDb;
                }
                
                var effAttenDiffDb = Math.max(0.5, this.maxAttackCompressionDiffDb);
                
                x = 0.25 / effAttenDiffDb;
                envelopeRate = 1 - Math.pow(x, 1 / this._attackFrames);
            }
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Inner loop - calculate shaped power average - apply compression.
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            var preDelayReadIndex = this.preDelayReadIndex;
            var preDelayWriteIndex = this.preDelayWriteIndex;
            var detectorAverage = this.detectorAverage;
            var compressorGain = this.compressorGain;
            
            var loopFrames = nDivisionFrames;
            while (loopFrames--) {
                var compressorInput = 0;
                
                // Predelay signal, computing compression amount from un-delayed version.
                var delayBuffer = this.preDelayBuffer;
                var undelayedSource = cell[frameIndex];
                delayBuffer[preDelayWriteIndex] = undelayedSource;
                
                var absUndelayedSource = undelayedSource > 0 ? undelayedSource : -undelayedSource;
                if (compressorInput < absUndelayedSource) {
                    compressorInput = absUndelayedSource;
                }
                
                // Calculate shaped power on undelayed input.

                var scaledInput = compressorInput;
                var absInput = scaledInput > 0 ? scaledInput : -scaledInput;
                
                // Put through shaping curve.
                // This is linear up to the threshold, then enters a "knee" portion followed by the "ratio" portion.
                // The transition from the threshold to the knee is smooth (1st derivative matched).
                // The transition from the knee to the ratio portion is smooth (1st derivative matched).
                var shapedInput = this.saturate(absInput, k);
                
                var attenuation = absInput <= 0.0001 ? 1 : shapedInput / absInput;
                
                var attenuationDb = (attenuation) ? -20 * Math.log(attenuation) * Math.LOG10E : 1000;
                attenuationDb = Math.max(2.0, attenuationDb);
                
                var dbPerFrame = attenuationDb / satReleaseFrames;
                
                // var satReleaseRate = decibelsToLinear(dbPerFrame) - 1;
                var satReleaseRate = Math.pow(10, 0.05 * dbPerFrame) - 1;
                
                var isRelease = (attenuation > detectorAverage);
                var rate = isRelease ? satReleaseRate : 1;
                
                detectorAverage += (attenuation - detectorAverage) * rate;
                detectorAverage = Math.min(1.0, detectorAverage);
                
                // Exponential approach to desired gain.
                if (envelopeRate < 1) {
                    // Attack - reduce gain to desired.
                    compressorGain += (scaledDesiredGain - compressorGain) * envelopeRate;
                } else {
                    // Release - exponentially increase gain to 1.0
                    compressorGain *= envelopeRate;
                    compressorGain = Math.min(1.0, compressorGain);
                }
                
                // Warp pre-compression gain to smooth out sharp exponential transition points.
                var postWarpCompressorGain = Math.sin(0.5 * Math.PI * compressorGain);
                
                // Calculate total gain using master gain and effect blend.
                var totalGain = dryMix + wetMix * masterLinearGain * postWarpCompressorGain;
                
                // Calculate metering.
                var dbRealGain = 20 * Math.log(postWarpCompressorGain) * Math.LOG10E;
                if (dbRealGain < this.meteringGain)  {
                    this.meteringGain = dbRealGain;
                } else {
                    this.meteringGain += (dbRealGain - this.meteringGain) * this.meteringReleaseK;
                }
                // Apply final gain.
                delayBuffer = this.preDelayBuffer;
                cell[frameIndex] = delayBuffer[preDelayReadIndex] * totalGain;
                
                frameIndex++;
                preDelayReadIndex  = (preDelayReadIndex  + 1) & MaxPreDelayFramesMask;
                preDelayWriteIndex = (preDelayWriteIndex + 1) & MaxPreDelayFramesMask;
            }
            
            // Locals back to member variables.
            this.preDelayReadIndex = preDelayReadIndex;
            this.preDelayWriteIndex = preDelayWriteIndex;
            this.detectorAverage = (detectorAverage < 1e-6) ? 1e-6 : detectorAverage;
            this.compressorGain  = (compressorGain  < 1e-6) ? 1e-6 : compressorGain;
        }
    };
    
    $.reset = function() {
        this.detectorAverage = 0;
        this.compressorGain = 1;
        this.meteringGain = 1;
        
        // Predelay section.
        for (var i = this.preDelayBuffer.length; i--; ) {
            this.preDelayBuffer[i] = 0;
        }
        
        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        
        this.maxAttackCompressionDiffDb = -1; // uninitialized state
    };
    
    timbre.modules.Compressor = Compressor;
    
})();

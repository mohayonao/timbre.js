package {
    import flash.display.Sprite;
    import flash.events.SampleDataEvent;
    import flash.media.Sound;
    import flash.utils.ByteArray;
    import flash.external.ExternalInterface;

    public class timbre extends Sprite {
        private var _sound:Sound = null;
        private var _dx:Number = 1;
        private var _interleaved:Array = [];
        private var _cancel_flag:Boolean = false;
        
        function timbre() {
            ExternalInterface.addCallback("setup", _setup);
            ExternalInterface.addCallback("cancel", _cancel);
            ExternalInterface.addCallback("writeAudio", _writeAudio);
            ExternalInterface.call("timbrejs_flashfallback_init");
        }
        
        private function _setup(channels:int, samplerate:int):void {
            _dx = samplerate / 44100;
            for (var i:int = 0; i < 8192; ++i) {
                _interleaved.push(0);
                _interleaved.push(0);
            }            
        }
        
        private function _cancel():void {
            _cancel_flag = true;
        }
        
        private function _writeAudio(interleaved:String):void {
            if (!_sound) {
                _sound = new Sound();
                _sound.addEventListener(SampleDataEvent.SAMPLE_DATA, _streaming);
                _sound.play();
            }
            _cancel_flag = false;
            
            var samples:Array = interleaved.split(" ");
            var i:int, imax:int = samples.length, x:Number = 0;
            var k:Number = 1/32768;
            
            for (i = 0; i < imax; i += 2) {
                while (x < 1) {
                    _interleaved.push(samples[i+0] * k);
                    _interleaved.push(samples[i+1] * k);
                    x += _dx;
                }
                x -= 1;
            }
        }
        
        private function _streaming(e:SampleDataEvent):void {
            var i:int, buffer:ByteArray = e.data;
            
            if (_cancel_flag || _interleaved.length < 4096) {
                for (i = 0; i < 4096; ++i) {
                    buffer.writeFloat(0.0);
                }
                return;
            }
            
            var imax:int = Math.min(_interleaved.length, 16384);
            
            for (i = 0; i < imax; ++i) {
                buffer.writeFloat(_interleaved[i]);
            }
            
            _interleaved = _interleaved.slice(imax, _interleaved.length);
        }
    }
}

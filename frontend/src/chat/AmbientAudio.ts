import { config } from '../config';
import { biomeWeights } from '../world/atmosphere';
/** Quiet, original synthesized surf/wind; no third-party audio or autoplay. */
export class AmbientAudio {
  private context:AudioContext|null=null;
  private gain:GainNode|null=null;
  private filter:BiquadFilterNode|null=null;
  private source:AudioBufferSourceNode|null=null;
  private muted=true;
  unlock(){
    try{
      if(!this.context){
        const context=this.context=new AudioContext(),buffer=context.createBuffer(1,context.sampleRate*config.audio.bufferSeconds,context.sampleRate),data=buffer.getChannelData(0);
        let last=0;for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*3;}
        this.source=context.createBufferSource();this.source.buffer=buffer;this.source.loop=true;this.filter=context.createBiquadFilter();this.filter.type='lowpass';this.gain=context.createGain();this.gain.gain.value=0;
        this.source.connect(this.filter);this.filter.connect(this.gain);this.gain.connect(context.destination);this.source.start();
      }
      void this.context.resume().catch(()=>{});
    }catch{/* Audio is optional when unavailable. */}
  }
  setMuted(muted:boolean){this.muted=muted;if(this.context&&this.gain)this.gain.gain.setTargetAtTime(muted?0:config.audio.ambientVolume,this.context.currentTime,config.audio.blendTime);}
  update(position:{x:number;z:number}){
    if(!this.context||!this.gain||!this.filter)return;
    const {weights}=biomeWeights(position),lunar=weights.find(b=>b.landmark.biome==='lunar')?.weight??0,altitude=weights.find(b=>b.landmark.biome==='altitude')?.weight??0;
    this.filter.frequency.setTargetAtTime(config.audio.baseFilter+(config.audio.altitudeFilter-config.audio.baseFilter)*altitude+(config.audio.lunarFilter-config.audio.baseFilter)*lunar,this.context.currentTime,config.audio.blendTime);
    this.gain.gain.setTargetAtTime(this.muted?0:config.audio.ambientVolume*(1-lunar*.85),this.context.currentTime,config.audio.blendTime);
  }
  dispose(){this.source?.stop();void this.context?.close();}
}

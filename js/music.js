
/*
    播放器总线
*/

class Play {
    constructor() {
        this.color = null;
        this.src = "";
        this.phoneimage = null;
        this.myAudio = null;
        this.controlBtns = null;
        this.stopBtn = null;
        this.musicList = [
            './resource/mo.mp3',
            './resource/Rihanna - Only Girl (In The World).mp3',
            './resource/Remix.mp3',
            './resource/Neptune Illusion Dennis Kuo .mp3'
        ];
        this.audio = null;
        //初始化播放器
        this.init()
    }
    init() {
        //实例化下方图片
        this.phoneimage = new PhoneImage();
        //实例化音频
        this.myAudio = new MyAudio();
        this.progress = new Progress();
        this.controlBtns = new ControlBtns();
        this.stopBtn  = this.controlBtns.stopBtn;
       

        this.controlBtns.BtnsInitClick((opt)=>{
            this.color = opt.color;
            this.src = this.musicList[opt.index];
            this.myAudio.init({
                stepLength:7,
                baseVal:this.phoneimage.baseVal,
                src:this.src,
                value:"",
                callBackFn:(arr,averageVal,ProgressValue)=>{
                    this.phoneimage.animatePhone(arr);
                    this.controlBtns.animateBtn(averageVal)
                    this.progress.setProgress(this.color,ProgressValue);
                }
            });
        })
        
        this.stopBtn.onclick = ()=>{
          
            this.myAudio.audio && this.myAudio.audio.pause();
        }
    }



};


/*下方手机对象*/

class PhoneImage {
    constructor() {
        this.InitRatio = [1, .4, 0, .4, .6, .4, 0];
        this.oUlElement = document.querySelector(".oUl");
        this.imgElement = [...this.oUlElement.querySelectorAll("img")];
        this.baseVal = this.oUlElement.clientHeight * 0.8;
        this.oUlwidth = this.oUlElement.clientWidth;
        //初始化
        this.init();
    }
    init() {
        this.initPosition();
        this.oUlElement.onmousemove = this.mouseMove.bind(this)
        this.oUlElement.onmouseleave = this.mouseLeave.bind(this)
    }

    initPosition() {
        this.imgElement.forEach((img, index) => {
            let { x } = img.getBoundingClientRect();
            img._centerPointer = {
                x: x + img.width / 2
            }
            setTransform(img, 'translateY', this.getTranslateYByRatio(this.InitRatio[index]));
        });
    }

    animatePhone(Ratio) {
        this.imgElement.forEach((img, index) => {
            let transformYLength = this.getTranslateYByRatio(Ratio[index])
            mTween.stop(img)
            mTween({
                el: img,
                duration: 200,
                attr: {
                    translateY: transformYLength
                }
            })
        });
    }

    getTranslateYByRatio(ratio) {
        return (1 - ratio) * this.baseVal;
    }

    mouseMove({ clientX }) {
        let vals = this.imgElement.map(img => {
            let lengthx = Math.abs(clientX - img._centerPointer.x);
            return 1 - lengthx / this.oUlwidth;
        });
        this.animatePhone(vals);
    }

    mouseLeave() {
        this.animatePhone(this.InitRatio);
    }


}


/*操作按钮对象*/
class ControlBtns {
    constructor() {
        this.colors = [
            '#ff5f5b',
            '#ffb66e',
            '#ffd96d',
            '#e8f898',
            '#8cf6f3',
            '#92aef0',
            '#b897e4'
        ];
        this.color = null;
        this.btnElements = [...document.querySelectorAll('.btn')];
        this.currentBtn = null;
        this.stopBtn = document.querySelector('#stop_btn');
        this.init();
    }

    init(){
        this.btnElements.forEach(btn => {
            setTransform(btn, 'scale', 1);
        });
    }
    BtnsInitClick(callbackFn){
        this.btnElements.forEach((btn,index)=>{
            btn.onclick = ()=>{
                let colorIndex = Math.floor((Math.random()*this.colors.length));
                this.color = this.colors[colorIndex];
                this.currentBtn && mTween.stop(this.currentBtn);
                this.btnElements.forEach(btn => {
                    btn.style = "";
                })
                this.currentBtn = btn;
                this.currentBtn.style.background = this.color;
                this.currentBtn.style.color = "white";
                callbackFn({
                    color:this.color,
                    currentBtn:this.currentBtn,
                    index:index
                });
       }
        });
    }
    animateBtn(scale){
        mTween.stop(this.currentBtn);
        mTween({
            el:this.currentBtn,
            attr: {
                scale
            }
        })
    }

}


//音频对象
class MyAudio{
    constructor(stepLength,baseVal){
        this.audio = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.analyser = null;
        this.stepLength = stepLength;  // 需要传入
        this.baseVal = baseVal; //需要传入
        
    }
    init(opts){
        this.stepLength = opts.stepLength;  // 需要传入
        this.baseVal = opts.baseVal; //需要传入
        this.callBackFn = opts.callBackFn;
        if( this.audio){
            this.audio.pause();
            this.audio = null;
        }
        this.audio = new Audio();
        this.audio.addEventListener("canplay",this.play.bind(this));
        this.audio.src = opts.src;
    }

    play(){
        this.audio.play();
        this.audioContext = new AudioContext();
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        this.analyser = this.audioContext.createAnalyser();
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.parse();
    }

    parse(){
        let freqArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(freqArray);
        let arr = [];
        let step = Math.round(freqArray.length / this.stepLength);
        for (let i=0; i<7; i++) {
            arr.push(freqArray[i * step] / this.baseVal);
        }
        let averageVal = arr.reduce((p, c) => p + c, 0) / arr.length + .5;
        let ProgressValue = this.audio.currentTime/this.audio.duration *100
        this.callBackFn(arr,averageVal,ProgressValue);
        if(!this.audio.paused){
            requestAnimationFrame(this.parse.bind(this));
        }
    }
}

//进度条对象

class Progress{
    constructor(){
        this.progress2Element = document.querySelector('.progress2');
        this.init()
    }
    init(){
        this.setProgress("#fff",0) 
    }
    setProgress(color,value){
        this.progress2Element.style.background = color;
        this.progress2Element.style.width = value + '%';
    }
}
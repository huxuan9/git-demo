window.onload = function(){
    //每张图片的初始化高度
    let oUlElement = document.querySelector(".oUl");
    let imgElement = [...oUlElement.querySelectorAll("img")];
    let btnElements = [...document.querySelectorAll('.btn')];
    let progress2Element = document.querySelector('.progress2');
    let stopBtn = document.querySelector('#stop_btn');

    let oUlElementHeight = oUlElement.clientHeight;
    let baseVal = oUlElementHeight*0.8;

    //初始化比率，0-1之间，0为最低位，1为最高位
    let InitRatio = [1, .4, 0, .4, .6, .4, 0];

    let colors = [
        '#ff5f5b',
        '#ffb66e',
        '#ffd96d',
        '#e8f898',
        '#8cf6f3',
        '#92aef0',
        '#b897e4'
    ];

    let musicList = [
        './resource/mo.mp3',
        './resource/Rihanna - Only Girl (In The World).mp3',
        './resource/Remix.mp3',
        './resource/Neptune Illusion Dennis Kuo .mp3'
    ];
    let color = null ;
    let audio = null;
    let audioContext = null;
    let sourceNode = null;
    let analyser = null;

    
    let currentBtn = null;

    btnElements.forEach(btn => {
        setTransform(btn, 'scale', 1);
    })


    initAnimatePhone();
    function getTranslateYByRatio(ratio){
        return (1-ratio)*baseVal;
    }

    function initAnimatePhone(){
        imgElement.forEach( (img, index) => {
            let {x} = img.getBoundingClientRect();
            img._centerPointer = {
                x: x + img.width / 2
            }
            setTransform(img, 'translateY', getTranslateYByRatio(InitRatio[index]));
        } );
    }

    function animatePhone(Ratio){
        imgElement.forEach((img,index)=>{
            let transformYLength = getTranslateYByRatio(Ratio[index])
            mTween.stop(img)
            mTween({
                el:img,
                duration:200,
                attr:{
                    translateY:transformYLength
                }
            })
            
        });
    }


  
    
    //鼠标移动
    oUlElement.onmousemove = function ({clientX}){
        //计算每一个图片的距离
        let width = oUlElement.clientWidth;
        let vals = imgElement.map(img=>{
            let lengthx = Math.abs(clientX - img._centerPointer.x );
            return 1- lengthx/width;
        })
       //将距离转换成比例
       animatePhone(vals);
    }

    //鼠标离开
    oUlElement.onmouseleave = function (){
        animatePhone(InitRatio);
    }

    //按钮的交互
    btnElements.forEach((btn,index)=>{
        
        btn.onclick = function(){
            let colorIndex = Math.floor((Math.random()*colors.length));
            currentBtn && mTween.stop(currentBtn);
            
            btnElements.forEach(btn => {
                btn.style = "";
                
            })
            color =  colors[colorIndex];
            this.style.background = color;
            this.style.color = "white";
          
            currentBtn = this;

            if(audio){
                audio.pause();
                audio = null;
            }
            audio = new Audio();
            audio.addEventListener("canplay",play);
            audio.src = musicList[index]   
   }
    });

    
    function play() {
        audio.play();

        // 创建一个用来处理音频的工作环境（上下文），我们可以通过它来进行音频读取、解码等，进行一些更底层的音频操作
        audioContext = new AudioContext();
        // 设置音频数据源
        sourceNode = audioContext.createMediaElementSource(audio);

        // 获取音频时间和频率数据，以及实现数据可视化，connect 之前调用
        analyser = audioContext.createAnalyser();
        // connect 连接器，把声音数据连接到分析器，除了 createAnalyser，还有：BiquadFilterNode[提高音色]、ChannelSplitterNode[分割左右声道] 等对音频数据进行处理，然后通过 connect 把处理后的数据连接到扬声器进行播放
        sourceNode.connect(analyser);

        // connect 连接器，把声音数据连接到扬声器
        analyser.connect(audioContext.destination);

        // 得到的二进制音频数据，并解析
        parse();
    }

    function parse() {
        // console.log(analyser.frequencyBinCount);
        // analyser.frequencyBinCount : 二进制音频频率数据的数量（个数）
        // Uint8Array : 生成一个长度为 analyser.frequencyBinCount 的，用于处理二进制数据的数组
        let freqArray = new Uint8Array(analyser.frequencyBinCount);
        // console.log(freqArray);
        // 将当前频率数据复制到 freqArray 中
        analyser.getByteFrequencyData(freqArray);
        // console.log(freqArray);

        let arr = [];
        // 频谱反应的是声音各频率（frequencyBinCount）上能量的分布
        // 设置step，进行取样
        var step = Math.round(freqArray.length / 7);

        for (let i=0; i<7; i++) {
            arr.push(freqArray[i * step] / baseVal);
        }
        // console.log(arr);
        // 根据分析后的频谱数据生成动画
        animatePhone(arr);

        // 从 arr 样本中计算平均值
        let averageVal = arr.reduce((p, c) => p + c, 0) / arr.length + .5;
        animateBtn(averageVal);

        // 进度条
        animateProcess();

        if (!audio.paused) {
            requestAnimationFrame(parse);
        }
    }


    //跳动的按钮
    function animateBtn(scale){
        mTween.stop(currentBtn);
        mTween({
            el:currentBtn,
            attr: {
                scale
            }
        })
    }

    function animateProcess() {
        if (audio) {
            progress2Element.style.background = color;
            progress2Element.style.width = audio.currentTime / audio.duration * 100 + '%';
        }
    }

    stopBtn.onclick = function() {
        audio && audio.pause();
    }
}




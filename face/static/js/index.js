{
  const data = {
    weisuoyuwei: [
      { range: [10, 14], text: '好啊' },
      { range: [26, 37], text: '我是一等良民就不说了' },
      { range: [43, 61], text: '即使一定要冤枉我' },
      { range: [61, 81], text: '我也有钱聘大律师帮我' },
      { range: [81, 93], text: '我看我别指望坐牢了' },
      { range: [96, 105], text: '你别以为有钱就能为所欲为' },
      { range: [111, 131], text: '抱歉，有钱是真的能为所欲为的' },
      { range: [145, 157], text: '但我看他领会不到这种意境' },
      { range: [157, 166], text: '领会不到' },
    ],
    wangjingzei: [
      { range: [0, 10], text: '我就是饿死' },
      { range: [12, 24], text: '死外边 从这跳下去' },
      { range: [25, 35], text: '也不会吃你们一点东西' },
      { range: [37, 49], text: '真香' },
    ],
    qiegewala: [
      { range: [0, 15], text: '没有钱啊 肯定要做的啊' },
      { range: [15, 30], text: '不做的话没有钱用' },
      { range: [31, 38], text: '那你不会去打工啊' },
      { range: [38, 48], text: '有手有脚的' },
      { range: [48, 68], text: '打工是不可能打工的' },
      { range: [68, 86], text: '这辈子不可能打工的' },
    ],
  };

  const app = new Vue({
    el: '#app',
    data() {
      return {
        open: false,
        titles: [
          { name: '有钱就是为所欲为', url: 'weisuoyuwei' },
          { name: '王境泽', url: 'wangjingzei' },
          { name: '窃格瓦拉', url: 'qiegewala' },
        ],
        hints: data['weisuoyuwei'],
        img: {
          osrc: './static/img/weisuoyuwei.gif',
          src: './static/img/weisuoyuwei.gif',
        },
        progress: {
          seen: false,
          value: 0,
        },
        button: {
          disabled: false,
        },
      }
    },
    methods: {
      toggle(flag) {
        this.open = !this.open
        this.docked = !flag
      },
      genGif() {
        this.button.disabled = true;
        this.progress.seen = true;
        this.progress.value = 0;
        getGIFFrames(this.img.osrc);
        // this.img.isimg = false;
      },
      download() {
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = this.img.src;
        a.download = this.img.src.slice(-8) + '.gif';
        a.click();
        window.URL.revokeObjectURL(this.img.src);
      },
      change(url) {
        this.hints = data[url];
        this.img.osrc = './static/img/' + url + '.gif';
        this.img.src = './static/img/' + url + '.gif';
      }
    }
  });

  const getGIFFrames = function (url) {
    let oReq = new XMLHttpRequest();
    oReq.open("GET", url, true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function (oEvent) {
      app.progress.value += 5;
      const buffer = oReq.response;
      if (buffer) {
        const ogif = new DGIF(buffer);
        const frames = ogif.decompressFrames(true);
        const imgEle = document.getElementById('source');
        // gif patch canvas
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        // full gif canvas
        const gifCanvas = document.createElement('canvas');
        gifCanvas.width = imgEle.width;
        gifCanvas.height = imgEle.height;
        const gifCtx = gifCanvas.getContext('2d');
        const originCanvas = gifCanvas.cloneNode(true);
        const originGIFCtx = originCanvas.getContext('2d');
        const gif = new GIF({
          workers: 2,
          quality: 20,
          workerScript: './static/js/gif.worker.js',
          // debug: true,
        });
        app.progress.value += 5;
        const texts = app.hints;
        const length = frames.length;
        let isKeyFrame = false;
        setCtx(gifCtx, '18px Microsoft YaHei');
        for (let i = 0, j = 0; i < length; i++) {
          let frame = frames[i];
          drawPatch(frame, tempCanvas, tempCtx, gifCtx, originGIFCtx);
          if (isKeyFrame) {
            isKeyFrame = false;
            gifCtx.drawImage(originCanvas, 0, 0);
            continue;
          }
          if (j < texts.length && i >= texts[j].range[0] && i < texts[j].range[1]) {
            subFrame(gifCtx, gifCanvas.width, texts[j].text, 0.9 * gifCanvas.height);
            if (i + 1 === texts[j].range[1]) {
              isKeyFrame = true;
              j++;
            }
          }
          gif.addFrame(gifCanvas, { delay: frame.delay, copy: true });
          app.progress.value += 80 / length;
        }
        gif.on('finished', function (blob) {
          console.log('finish');
          app.progress.value = 100;
          app.button.disabled = false;
          app.img.src = URL.createObjectURL(blob);
          app.progress.seen = false;
          // delete gif;
        });
        gif.render();
        // delete buffer;
        // delete ogif;
        // delete imgEle;
        // delete tempCanvas;
        // delete gifCanvas;
        // delete originCanvas;
      }
    };
    oReq.send(null);
  };

  const setCtx = function (ctx, font) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = font;
  };

  const drawPatch = function (frame, tempCanvas, tempCtx, gifCtx, originGIFCtx) {
    const dims = frame.dims;
    let frameImageData;
    if (!frameImageData || dims.width != frameImageData.width || dims.height != frameImageData.height) {
      tempCanvas.width = dims.width;
      tempCanvas.height = dims.height;
      frameImageData = tempCtx.createImageData(dims.width, dims.height);
    }
    // set the patch data as an override
    frameImageData.data.set(frame.patch);
    // draw the patch back over the canvas
    tempCtx.putImageData(frameImageData, 0, 0);
    gifCtx.drawImage(tempCanvas, dims.left, dims.top);
    // keep acc origin one
    originGIFCtx.drawImage(tempCanvas, dims.left, dims.top);
    // delete frameImageData;
  };

  const subFrame = function (ctx, width, text, y) {
    ctx.strokeText(text, width / 2, y);
    ctx.fillText(text, width / 2, y);
  };
}

import './style.css'

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
const rtimeDiv = document.querySelector("#rtime")!;

const city1 = new Image();
const mountain1 = new Image();
city1.src = "/city.jpg";
mountain1.src = "/mountain.jpg";

let previousImage = mountain1;
let currentImage = city1;
let lastSwitch = performance.now();
let startTime: number;
let city: boolean;
let clicked: boolean; 

(async () => {
  await Promise.all([city1.decode(), mountain1.decode()]);

  function crossFade(img: HTMLImageElement, currentTime: number) {
    if (!startTime) startTime = currentTime;
    
    const elapsed = currentTime - startTime;
    // fade in at 800 ms speed
    const progress = Math.min(elapsed / 800, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // in
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(previousImage, 0, 0);
    
    // out
    ctx.globalAlpha = progress;
    ctx.drawImage(currentImage, 0, 0);

    if (progress < 1) {
        requestAnimationFrame((time) => crossFade(img, time));
    }
}

  function frame() {
    const now = performance.now();

    if (now - lastSwitch >= 800) {
      const rand = Math.random();
      previousImage = currentImage;
      if (rand <= 0.9) {
        currentImage = city1;
        city = true;
      } else {
        currentImage = mountain1;
        city = false;

      }
      startTime = 0;
      crossFade(currentImage, now);
      lastSwitch = now;
      clicked = false;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.repeat && !clicked) {
      const rt = performance.now() - lastSwitch;
      if (city) {
        rtimeDiv.textContent = `CORRECT! reaction: ${rt.toFixed(1)} ms`;
      } else {
        rtimeDiv.textContent = `INCORRECT! reaction: ${rt.toFixed(1)} ms`;
      }
      clicked = true;
      
    }
  });

})();  
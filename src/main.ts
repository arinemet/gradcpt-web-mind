import './style.css'

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
const rtimeDiv = document.querySelector("#rtime")!;

const cities: HTMLImageElement[] = [];
const mountains: HTMLImageElement[] = [];

for (let i = 0; i <= 9; i++) {
  const c = new Image(); c.src = `${import.meta.env.BASE_URL}cities/${i}.jpg`; cities.push(c);
  const m = new Image(); m.src = `${import.meta.env.BASE_URL}mountains/${i}.jpg`; mountains.push(m);
}

let previousImage = mountains[0];
let currentImage = cities[0];
let lastSwitch = performance.now();
let startTime: number;
let city: boolean = true;
let clicked: boolean; 

(async () => {
  await Promise.all([...cities, ...mountains].map(img => img.decode()));

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
      if (!clicked && city) {
        rtimeDiv.textContent = `INCORRECT! Did not click.`;
      } else if (!clicked && !city) {
        rtimeDiv.textContent = `CORRECT! Did not click.`;
      }
      if (rand <= 0.9) {
        currentImage = cities[Math.floor(Math.random() * cities.length)];;
        city = true;
      } else {
        currentImage = mountains[Math.floor(Math.random() * mountains.length)];;
        city = false;

      }
      startTime = 0;
      crossFade(currentImage, now);
      console.log("interval:", (now - lastSwitch).toFixed(1));
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
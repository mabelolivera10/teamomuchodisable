class TextDesintegrator {
  constructor(el, options) {
    const defaultOptions = {
      padding: 160,
      density: 4,
      duration: 2500 // in ms
    };
    this.step = 0;
    this.count = 0;
    this.data = [];
    this.scale = 2; 
    this.el = el;
    this.el.style.position = "relative";
    this.el.innerHTML = `<span class="td-wrapper">${this.el.textContent}</span>`;
    this.inner = this.el.querySelector("span");
    this.options = { ...defaultOptions, ...options };
    this.reverse = false;
    

    document.fonts.ready.then(() => {
      this.createCanvas();
      this.fillCanvas();
      this.pixelize();
      setTimeout(() => {
        this.start();
      }, 0);
    });
  }
  createCanvas() {

    const { width, height } = this.el.getBoundingClientRect();
    this.height = height;
    this.width = width;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.scale * (this.width + 2 * this.options.padding);
    this.canvas.height = this.scale * (this.height + 2 * this.options.padding);
    this.canvas.style.width = `${this.width + 2 * this.options.padding}px`;
    this.canvas.style.height = `${this.height + 2 * this.options.padding}px`;
    this.canvas.style.transform = `translate3d(${-this.options
      .padding}px, ${-this.options.padding}px, 0)`;
    this.context = this.canvas.getContext("2d");
    this.context.scale(this.scale, this.scale);
    this.el.append(this.canvas);
  }
  clearContext() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  fillCanvas() {
    const style = getComputedStyle(this.el);
    this.color = style.getPropertyValue("color");
    this.context.fillStyle = this.color;
    this.context.font = style.getPropertyValue("font");
    this.context.textBaseline = "ideographic";
    this.context.fillText(
      this.el.textContent,
      this.options.padding,
      (this.canvas.height / this.scale + this.height) / 2
    );
  }
  start() {
    this.t0 = 0;
    this.id = window.requestAnimationFrame((t) => this.render(t));
  }
  stop() {
    if (this.id) {
      window.cancelAnimationFrame(this.id);
    }
  }
  pixelize() {
    const { padding, density, duration } = this.options;
    for (
      let y = 0;
      y < this.canvas.height + 2 * padding - Math.floor(density / 2);
      y += density
    ) {
      for (
        let x = 0;
        x < this.canvas.width + 2 * padding - Math.floor(density / 2);
        x += density
      ) {
        const { data } = this.context.getImageData(
          x + Math.floor(density / 4),
          y + Math.floor(density / 4),
          1,
          1
        );
        const [, , , a] = data;
        if (a > 0) {
          this.data.push({
            alpha: a / 255,
            longevity: Math.min(
              duration * 0.25 + Math.random() * duration * 0.75,
              duration - 1
            ),
            x,
            y,
            initialX: x,
            initialY: y,
            finalX: x + 2 * (Math.random() - 0.5) * this.canvas.width,
            finalY: y + 2 * (Math.random() - 0.5) * this.canvas.width
          });
        }
      }
    }
  }

  render(timestamp) {
    if (!this.t0) {
      this.t0 = timestamp;
    }
    const elapsed = timestamp - this.t0;
    if (this.step < Math.min(500, this.options.duration * 0.5)) {
      if (this.reverse) {
        this.inner.classList.remove("td-hide");
      } else {
        this.inner.classList.add("td-hide");
      }
    }
    this.updateData();
    this.clearContext();
    for (const sq of this.data) {
      this.context.globalAlpha = sq.alpha;
      this.context.fillStyle = this.color;
      this.context.fillRect(
        sq.x / 2,
        sq.y / 2,
        this.options.density / 2,
        this.options.density / 2
      );
    }
    this.step = this.reverse ? this.options.duration - elapsed : elapsed;
    if (elapsed > this.options.duration) {
      this.onComplete();
    }
    this.id = requestAnimationFrame((t) => this.render(t));
  }
  onComplete() {
    this.reverse = !this.reverse;
    this.t0 = 0;
  }
  updateData() {
    for (const sq of this.data) {
      sq.alpha = this.calculateOpacity(sq.longevity, this.step);
      sq.x = this.calculatePosition(
        sq.initialX,
        sq.finalX,
        sq.longevity,
        this.step
      );
      sq.y = this.calculatePosition(
        sq.initialY,
        sq.finalY,
        sq.longevity,
        this.step
      );
    }
  }
  calculatePosition(xS, xE, l, x) {
    const expo = (l, x) => {
      return x < l ? 1 - Math.pow(2, 10 * (x / l) - 10) : 0;
    };
    const val = (xS - xE) * expo(l, x) + xE;
    return val;
  }
  calculateOpacity(l, x) {
    return x <= l ? 1 - Math.pow(x / l, 1) : 0;
  }
}

const h1 = document.querySelectorAll("h1 span");

h1.forEach((el) => new TextDesintegrator(el));
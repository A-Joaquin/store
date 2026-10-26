// Motor del slider del hero: dos fotos que se cruzan deformadas por un mapa
// de desplazamiento (public/mascara-hero.png), igual que la portada del sitio
// estático. WebGL 1 puro, sin librerías.
//
// Todo se calcula en "píxeles de escena": una resolución fija (2000×1000 en
// escritorio, 750×1104 en móvil) que luego el CSS escala para cubrir la
// pantalla. Así la deformación se ve igual en cualquier monitor.

// El tamaño de escena va en un uniforme propio por shader: si el mismo uniforme
// tiene precisión distinta en vértices y fragmentos, el programa no enlaza.
const VERTICES = `
attribute vec2 aPos;
varying vec2 vPx;
uniform vec2 uTam;
void main() {
  // aPos va de 0 a 1; vPx es la posición en píxeles de escena (origen arriba-izquierda)
  vPx = aPos * uTam;
  gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);
}`

const FRAGMENTOS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vPx;
uniform vec2 uEscena;
uniform vec2 uMapa;
uniform sampler2D uMascara;
uniform sampler2D uFotoA;
uniform sampler2D uFotoB;
uniform float uDefA;
uniform float uDefB;
uniform float uDesA;
uniform float uDesB;
uniform float uAlfaA;
uniform float uAlfaB;
uniform float uBEncima;

// Cada foto ocupa la escena más 10 px por lado (para que la deformación no
// muestre bordes), corrida "des" píxeles en horizontal.
vec4 foto(sampler2D t, float def, float des) {
  vec2 m = texture2D(uMascara, clamp(vPx / uMapa, 0.0, 1.0)).rg - 0.5;
  vec2 p = vPx + m * def;
  vec2 uv = (p - vec2(-10.0 + des, -10.0)) / (uEscena + 20.0);
  return texture2D(t, clamp(uv, 0.0, 1.0));
}

void main() {
  vec4 a = foto(uFotoA, uDefA, uDesA);
  vec4 b = foto(uFotoB, uDefB, uDesB);
  // Fondo negro y las dos capas en el orden de sus índices (como el original).
  vec3 abajo = uBEncima > 0.5 ? a.rgb : b.rgb;
  vec3 arriba = uBEncima > 0.5 ? b.rgb : a.rgb;
  float alfaAbajo = uBEncima > 0.5 ? uAlfaA : uAlfaB;
  float alfaArriba = uBEncima > 0.5 ? uAlfaB : uAlfaA;
  vec3 c = mix(vec3(0.0), abajo, alfaAbajo);
  c = mix(c, arriba, alfaArriba);
  gl_FragColor = vec4(c, 1.0);
}`

// Curva Power2.easeOut de GSAP (cúbica), la misma del original.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const DURACION_TRANSICION = 1000

type Uniformes = Record<string, WebGLUniformLocation | null>

export class HeroWebgl {
  private gl: WebGLRenderingContext
  private u: Uniformes = {}
  private texturas: (WebGLTexture | null)[] = []
  private mascara: WebGLTexture | null = null
  private actual = 0
  private anterior = 0
  private inicio = 0
  private haciaAdelante = true
  private enTransicion = false
  private cuadro = 0
  private destruido = false

  constructor(
    private canvas: HTMLCanvasElement,
    private escena: { ancho: number; alto: number },
  ) {
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false })
    if (!gl) throw new Error('Sin WebGL')
    this.gl = gl
    canvas.width = escena.ancho
    canvas.height = escena.alto

    const programa = gl.createProgram()!
    for (const [tipo, fuente] of [
      [gl.VERTEX_SHADER, VERTICES],
      [gl.FRAGMENT_SHADER, FRAGMENTOS],
    ] as const) {
      const sh = gl.createShader(tipo)!
      gl.shaderSource(sh, fuente)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader')
      gl.attachShader(programa, sh)
    }
    gl.linkProgram(programa)
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(programa) || 'programa')
    gl.useProgram(programa)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(programa, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    for (const n of ['uTam', 'uEscena', 'uMapa', 'uMascara', 'uFotoA', 'uFotoB', 'uDefA', 'uDefB', 'uDesA', 'uDesB', 'uAlfaA', 'uAlfaB', 'uBEncima'])
      this.u[n] = gl.getUniformLocation(programa, n)
    gl.uniform2f(this.u.uTam, escena.ancho, escena.alto)
    gl.uniform2f(this.u.uEscena, escena.ancho, escena.alto)
    gl.uniform1i(this.u.uFotoA, 0)
    gl.uniform1i(this.u.uFotoB, 1)
    gl.uniform1i(this.u.uMascara, 2)
    gl.viewport(0, 0, escena.ancho, escena.alto)
  }

  private textura(img: TexImageSource): WebGLTexture {
    const gl = this.gl
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    // Las fotos no son potencia de 2: sin repetición ni mipmaps.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    return t
  }

  // El mapa de desplazamiento se estira ×3 en horizontal y ×2 en vertical.
  ponerMascara(img: HTMLImageElement) {
    this.mascara = this.textura(img)
    this.gl.uniform2f(this.u.uMapa, img.naturalWidth * 3, img.naturalHeight * 2)
  }

  ponerFoto(i: number, img: HTMLImageElement) {
    this.texturas[i] = this.textura(img)
    if (i === this.actual) this.dibujar()
  }

  listo(i: number) {
    return Boolean(this.texturas[i] && this.mascara)
  }

  // Cambia de slide con la transición: la foto que sale se va 30 px hacia un
  // lado, se desvanece y se deforma de 1 a 50; la que entra viene desde 30 px
  // del otro lado y su deformación baja de 300 a 1.
  ir(destino: number, haciaAdelante: boolean) {
    if (destino === this.actual) return
    this.anterior = this.actual
    this.actual = destino
    this.haciaAdelante = haciaAdelante
    this.inicio = performance.now()
    this.enTransicion = true
    cancelAnimationFrame(this.cuadro)
    this.cuadro = requestAnimationFrame(this.animar)
  }

  private animar = (ahora: number) => {
    if (this.destruido) return
    const t = Math.min(1, (ahora - this.inicio) / DURACION_TRANSICION)
    this.dibujar(easeOut(t))
    if (t < 1) this.cuadro = requestAnimationFrame(this.animar)
    else this.enTransicion = false
  }

  // p = avance de la transición (1 = sin transición: solo la foto actual).
  dibujar(p = 1) {
    const gl = this.gl
    const b = this.texturas[this.actual]
    const a = this.enTransicion ? this.texturas[this.anterior] : b
    if (!a || !b || !this.mascara) return
    const sentido = this.haciaAdelante ? 1 : -1

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, a)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, b)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.mascara)

    if (this.enTransicion) {
      gl.uniform1f(this.u.uDefA, lerp(1, 50, p))
      gl.uniform1f(this.u.uDesA, lerp(0, -30 * sentido, p))
      gl.uniform1f(this.u.uAlfaA, 1 - p)
      gl.uniform1f(this.u.uDefB, lerp(300, 1, p))
      gl.uniform1f(this.u.uDesB, lerp(30 * sentido, 0, p))
      gl.uniform1f(this.u.uAlfaB, p)
      gl.uniform1f(this.u.uBEncima, this.actual > this.anterior ? 1 : 0)
    } else {
      // Fuera de la transición el filtro está apagado: foto limpia.
      gl.uniform1f(this.u.uDefA, 0)
      gl.uniform1f(this.u.uDesA, 0)
      gl.uniform1f(this.u.uAlfaA, 0)
      gl.uniform1f(this.u.uDefB, 0)
      gl.uniform1f(this.u.uDesB, 0)
      gl.uniform1f(this.u.uAlfaB, 1)
      gl.uniform1f(this.u.uBEncima, 1)
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  // No se libera el contexto: el canvas puede volver a montarse (modo estricto
  // de React en desarrollo) y getContext devolvería uno perdido. El navegador
  // lo recoge al quitar el canvas de la página.
  destruir() {
    this.destruido = true
    cancelAnimationFrame(this.cuadro)
  }
}

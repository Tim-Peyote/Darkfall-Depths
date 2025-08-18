/* Darkfall Depths - WebGL Рендерер для максимальной производительности */

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.vertexBuffer = null;
    this.textureBuffer = null;
    this.indexBuffer = null;
    
    this.init();
  }
  
  init() {
    try {
      // Logger.debug('🔍 Попытка инициализации WebGL...');
      
      // Получаем WebGL контекст
      this.gl = this.canvas.getContext('webgl2') || 
                this.canvas.getContext('webgl') || 
                this.canvas.getContext('experimental-webgl');
      
      if (!this.gl) {
        console.error('❌ WebGL не поддерживается, используем Canvas 2D');
        return false;
      }
      
      // Logger.debug('✅ WebGL контекст получен:', this.gl.getParameter(this.gl.VERSION));
      // Logger.debug('✅ WebGL рендерер инициализирован');
      
      // Настраиваем WebGL
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      
      // Создаем шейдеры
      this.createShaders();
      this.createBuffers();
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации WebGL:', error);
      return false;
    }
  }
  
  createShaders() {
    // Вершинный шейдер
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      
      uniform mat3 u_matrix;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        gl_Position = vec4((u_matrix * vec3(a_position, 1.0)).xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `;
    
    // Фрагментный шейдер
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      uniform sampler2D u_texture;
      
      void main() {
        gl_FragColor = v_color * texture2D(u_texture, v_texCoord);
      }
    `;
    
    // Компилируем шейдеры
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    // Создаем программу
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Ошибка линковки программы:', this.gl.getProgramInfoLog(this.program));
    }
    
    this.gl.useProgram(this.program);
  }
  
  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Ошибка компиляции шейдера:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  createBuffers() {
    // Создаем буферы для вершин
    this.vertexBuffer = this.gl.createBuffer();
    this.textureBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();
    
    // Получаем атрибуты и униформы
    this.attributes = {
      position: this.gl.getAttribLocation(this.program, 'a_position'),
      texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord'),
      color: this.gl.getAttribLocation(this.program, 'a_color')
    };
    
    this.uniforms = {
      matrix: this.gl.getUniformLocation(this.program, 'u_matrix'),
      texture: this.gl.getUniformLocation(this.program, 'u_texture')
    };
  }
  
  // Отрисовка прямоугольника (для тайлов карты)
  drawRect(x, y, width, height, color) {
    if (!this.gl) return;
    
    const vertices = new Float32Array([
      x, y,
      x + width, y,
      x, y + height,
      x + width, y + height
    ]);
    
    const colors = new Float32Array([
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a
    ]);
    
    // Загружаем данные в буферы
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.attributes.position);
    this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.attributes.color);
    this.gl.vertexAttribPointer(this.attributes.color, 4, this.gl.FLOAT, false, 0, 0);
    
    // Отрисовываем
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
  
  // Очистка экрана
  clear() {
    if (!this.gl) return;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
  
  // Установка матрицы проекции
  setProjection(width, height) {
    if (!this.gl || !this.uniforms.matrix) return;
    
    const matrix = [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
    
    this.gl.uniformMatrix3fv(this.uniforms.matrix, false, matrix);
  }
  
  // Проверка поддержки WebGL
  isSupported() {
    return this.gl !== null;
  }
}

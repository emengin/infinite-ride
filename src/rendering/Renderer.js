import * as THREE from 'three';

export class Renderer {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xd5debd, 170, 930);
    this.webgl = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    this.webgl.shadowMap.enabled = true;
    this.webgl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.webgl.outputColorSpace = THREE.SRGBColorSpace;
    this.webgl.toneMapping = THREE.ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.12;
    this.camera = new THREE.PerspectiveCamera(57, 1, 0.08, 1600);

    this.scene.add(new THREE.HemisphereLight(0xd6e8e0, 0x6a7052, 2.2));
    this.sun = new THREE.DirectionalLight(0xffe5ae, 3.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -24,
      right: 24,
      top: 24,
      bottom: -24,
      near: 1,
      far: 160,
    });
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.bias = -0.0002;
    this.scene.add(this.sun, this.sun.target);
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(1400, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {},
        vertexShader:
          'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: `
        varying vec3 vDirection;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){
          vec3 d=normalize(vDirection);
          vec3 color=mix(vec3(.84,.87,.74),vec3(.29,.59,.68),pow(max(d.y,0.0),.48));
          float sun=pow(max(dot(d,normalize(vec3(-.6,.35,-.65))),0.0),520.0);
          color+=vec3(1.0,.65,.27)*sun*2.0;
          vec2 uv=d.xz/max(.08,d.y)*1.8;
          float cloud=noise(uv)*.6+noise(uv*2.0)*.3+noise(uv*4.0)*.1;
          cloud=smoothstep(.58,.77,cloud)*smoothstep(.07,.24,d.y)*.38;
          color=mix(color,vec3(.96,.95,.84),cloud);
          gl_FragColor=vec4(color,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      }),
    );
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);
    this.resize = () => {
      const width = window.innerWidth,
        height = window.innerHeight;
      this.webgl.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  render(position) {
    this.sky.position.copy(this.camera.position);
    this.sun.position.set(position.x - 40, position.y + 65, position.z - 35);
    this.sun.target.position.copy(position);
    this.webgl.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.webgl.dispose();
  }
}

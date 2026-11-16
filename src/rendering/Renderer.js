import * as THREE from 'three';
import { BIOMES } from '../world/BiomeManager.js';

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
    this.webgl.toneMappingExposure = 1.0;
    this.camera = new THREE.PerspectiveCamera(57, 1, 0.08, 1600);

    this.hemi = new THREE.HemisphereLight(0xd6e8e0, 0x6a7052, 1.7);
    this.scene.add(this.hemi);
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
    this.headlight = new THREE.SpotLight(0xffefca, 0, 100, Math.PI / 6, 0.55, 1.2);
    this.scene.add(this.headlight, this.headlight.target);
    this.trafficLights = Array.from({ length: 4 }, () => {
      const light = new THREE.SpotLight(0xffdfb0, 0, 65, Math.PI / 7, 0.5, 1.2);
      this.scene.add(light, light.target);
      return light;
    });
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(1400, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          skyTop: { value: new THREE.Color(0x64a8bd) },
          skyHorizon: { value: new THREE.Color(0xd5debd) },
          sunDirection: { value: new THREE.Vector3(-0.6, 0.35, -0.65) },
          sunTint: { value: new THREE.Color(0xffdf9b) },
          night: { value: 0 },
        },
        vertexShader:
          'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: `
        varying vec3 vDirection;
        uniform vec3 skyTop; uniform vec3 skyHorizon; uniform vec3 sunDirection; uniform vec3 sunTint;
        uniform float night;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){
          vec3 d=normalize(vDirection);
          vec3 color=mix(skyHorizon,skyTop,pow(max(d.y,0.0),.48));
          float sun=pow(max(dot(d,normalize(sunDirection)),0.0),520.0);
          color+=sunTint*sun*2.0;
          vec2 uv=d.xz/max(.08,d.y)*1.8;
          float cloud=noise(uv)*.6+noise(uv*2.0)*.3+noise(uv*4.0)*.1;
          cloud=smoothstep(.58,.77,cloud)*smoothstep(.07,.24,d.y)*.38;
          color=mix(color,mix(vec3(.96,.95,.84),skyHorizon*1.3,night),cloud*(1.0-night*.5));
          float star=step(.9985,hash(floor(d.xz/max(.05,d.y)*280.0)))*smoothstep(.04,.4,d.y);
          color+=star*night*.7;
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
    this.fogPalette = BIOMES.map((b) => new THREE.Color(b.fog));
    this.blendedColor = new THREE.Color();
  }

  environment(biome, profile, weather = 'clear') {
    const color = this.blendedColor;
    color.setRGB(0, 0, 0);
    biome.weights.forEach((w, i) => {
      color.r += this.fogPalette[i].r * w;
      color.g += this.fogPalette[i].g * w;
      color.b += this.fogPalette[i].b * w;
    });
    this.scene.fog.color.copy(color);
    this.sky.material.uniforms.skyHorizon.value.copy(color);
    this.scene.fog.near = 120 - biome.trees * 45;
    this.scene.fog.far = 930 - biome.trees * 170;
    if (profile) {
      const uniforms = this.sky.material.uniforms;
      uniforms.skyTop.value.setRGB(...profile.top);
      uniforms.skyHorizon.value.setRGB(...profile.horizon).lerp(color, 0.15 * (1 - profile.night));
      uniforms.sunTint.value.setRGB(...profile.sun);
      uniforms.sunDirection.value.set(-0.7, profile.elevation, -0.6).normalize();
      uniforms.night.value = profile.night;
      this.scene.fog.color.copy(uniforms.skyHorizon.value);
      this.hemi.intensity = profile.ambient;
      this.sun.intensity = profile.light;
      this.sun.color.setRGB(...profile.sun);
      this.webgl.toneMappingExposure = profile.exposure;
    }
    if (weather === 'haze') {
      this.scene.fog.near = 40;
      this.scene.fog.far *= 0.6;
    }
  }

  headlights(physics, pose, world, night, actors, quality) {
    const o = world.origin,
      forward = { x: Math.sin(pose.heading), z: -Math.cos(pose.heading) };
    this.headlight.position.set(
      pose.x - o.x + forward.x * 0.8,
      pose.y - o.y + 1.05,
      pose.z - o.z + forward.z * 0.8,
    );
    const target = world.path.surface(physics.s + 36, physics.d);
    world.toLocal(target, this.headlight.target.position);
    this.headlight.target.position.y += 0.1;
    this.headlight.intensity = night * 100;
    const nearest = actors
      .filter((a) => Math.abs(a.s - physics.s) < 105)
      .sort((a, b) => Math.abs(a.s - physics.s) - Math.abs(b.s - physics.s));
    this.trafficLights.forEach((light, i) => {
      const a = nearest[i];
      light.intensity = 0;
      if (!a || i >= (quality === 'high' ? 4 : quality === 'medium' ? 2 : 0)) return;
      const p = world.path.surface(a.s, a.d),
        f = world.path.frame(a.s),
        ahead = world.path.surface(a.s + a.dir * 25, a.d);
      light.position.set(
        p.x - o.x + Math.sin(f.heading) * a.dir * 2,
        p.y - o.y + 0.8,
        p.z - o.z - Math.cos(f.heading) * a.dir * 2,
      );
      world.toLocal(ahead, light.target.position);
      light.intensity = night * 45;
    });
  }

  render(position) {
    this.sky.position.copy(this.camera.position);
    this.sun.position
      .copy(this.sky.material.uniforms.sunDirection.value)
      .multiplyScalar(90)
      .add(position);
    this.sun.target.position.copy(position);
    this.webgl.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.sun.shadow.dispose();
    this.webgl.dispose();
  }
}

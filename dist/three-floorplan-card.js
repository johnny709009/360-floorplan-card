import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.element.js";

class ThreeFloorplanCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 500px;
        background-color: #1a1a1a;
        border-radius: 12px;
        overflow: hidden;
        user-select: none;
      }
      #container {
        width: 100%;
        height: 100%;
      }
      .light-overlay {
        position: absolute;
        transform: translate(-50%, -50%);
        cursor: pointer;
        z-index: 10;
        transition: transform 0.2s;
      }
      .light-overlay:hover {
        transform: translate(-50%, -50%) scale(1.2);
      }
      ha-icon {
        color: var(--paper-item-icon-color, #44739e);
      }
    `;
  }

  render() {
    return html`
      <div id="container"></div>
      ${this.renderIcons()}
    `;
  }

  firstUpdated() {
    this.loadThreeAndModules();
  }

  // Sequentially loads ThreeJS dependencies into the page window namespace to eliminate relative module import errors completely
  async loadThreeAndModules() {
    try {
      if (!window.THREE) {
        await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");
      }
      if (!window.THREE.OrbitControls) {
        await this.loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js");
      }
      if (!window.THREE.OBJLoader) {
        await this.loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js");
      }
      if (!window.THREE.MTLLoader) {
        await this.loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/MTLLoader.js");
      }
      this.init3D();
    } catch (err) {
      console.error("Failed to load 3D dependencies:", err);
    }
  }

  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  init3D() {
    const THREE = window.THREE;
    const container = this.shadowRoot.getElementById("container");
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 15, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 15);
    this.scene.add(dirLight);

    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.load(this.config.mtl_path, (materials) => {
      materials.preload();
      const objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load(this.config.obj_path, (object) => {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        this.scene.add(object);
      });
    });

    window.addEventListener("resize", () => this.onWindowResize());

    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.requestUpdate(); 
    };
    animate();
  }

  onWindowResize() {
    const THREE = window.THREE;
    const container = this.shadowRoot.getElementById("container");
    if (!container) return;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  get2DCoords(x, y, z) {
    const THREE = window.THREE;
    if (!this.camera || !this.renderer || !THREE) return { x: 0, y: 0, visible: false };
    
    const vector = new THREE.Vector3(x, y, z);
    vector.project(this.camera);

    const container = this.shadowRoot.getElementById("container");
    const halfWidth = container.clientWidth / 2;
    const halfHeight = container.clientHeight / 2;

    return {
      x: vector.x * halfWidth + halfWidth,
      y: -vector.y * halfHeight + halfHeight,
      visible: vector.z <= 1
    };
  }

  renderIcons() {
    if (!this.config.lights || !this.hass) return html``;

    return this.config.lights.map((light) => {
      const stateObj = this.hass.states[light.entity];
      if (!stateObj) return html``;

      const isOn = stateObj.state === "on";
      const coords = this.get2DCoords(light.x, light.y, light.z);

      if (!coords.visible) return html``;

      let iconStyle = "";
      if (isOn) {
        const rgb = stateObj.attributes.rgb_color || [253, 216, 53];
        const brightness = stateObj.attributes.brightness || 255;
        const opacity = Math.max(0.4, brightness / 255);

        iconStyle = `
          color: rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]});
          opacity: ${opacity};
          filter: drop-shadow(0 0 ${8 * opacity}px rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}));
        `;
      }

      return html`
        <div
          class="light-overlay"
          style="left: ${coords.x}px; top: ${coords.y}px;"
          @mousedown=${(e) => this.handleTouchStart(e, light.entity)}
          @mouseup=${(e) => this.handleTouchEnd(e, light.entity)}
          @touchstart=${(e) => this.handleTouchStart(e, light.entity)}
          @touchend=${(e) => this.handleTouchEnd(e, light.entity)}
        >
          <ha-icon
            .icon=${light.icon || (isOn ? "mdi:lightbulb" : "mdi:lightbulb-outline")}
            style=${iconStyle}
          ></ha-icon>
        </div>
      `;
    });
  }

  handleTouchStart(e, entityId) {
    this.pressStartTime = Date.now();
    this.pressTimeout = setTimeout(() => {
      this.openMoreInfo(entityId);
      this.pressTimeout = null;
    }, 500);
  }

  handleTouchEnd(e, entityId) {
    if (this.pressTimeout) {
      clearTimeout(this.pressTimeout);
      this.pressTimeout = null;
      if (Date.now() - this.pressStartTime < 500) {
        this.toggleLight(entityId);
      }
    }
  }

  toggleLight(entityId) {
    this.hass.callService("light", "toggle", { entity_id: entityId });
  }

  openMoreInfo(entityId) {
    const event = new CustomEvent("hass-more-info", {
      detail: { entityId: entityId },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  setConfig(config) {
    if (!config.obj_path || !config.mtl_path) {
      throw new Error("Please define obj_path and mtl_path");
    }
    this.config = config;
  }

  getCardSize() {
    return 5;
  }
}

customElements.define("three-floorplan-card", ThreeFloorplanCard);

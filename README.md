# 360° 3D Floorplan Card for Home Assistant

A custom Lovelace card for Home Assistant that renders full 360° interactive 3D floor plans using `.obj` and `.mtl` assets directly from your local environment. It features interactive spatial anchors for your smart lights that dynamically change brightness, mirror accurate RGB color profiles in real-time, and allow advanced dimming states via long-press overlays.

---

## Features
* 🔄 **360° Orbital Rotation:** Smooth panning, zooming, and tilting powered by `three.js` OrbitControls.
* 💡 **RGB & Brightness Synchronization:** Light icons dynamically read entity states, modifying color hues and glow radius intensities on your dashboard.
* 🎛️ **Dual-Action Controls:** 
  * **Short Click:** Instantly toggles the light status.
  * **Long Press (Hold):** Launches Home Assistant's native dialogue containing full dimming sliders and color-wheel selection tools.
* 📍 **True 3D Projections:** Anchors are locked onto real $X, Y, Z$ spatial planes instead of flat 2D percentages, ensuring icons dynamically follow layout positioning perfectly during rotation.

---

## Installation via HACS

### Step 1: Add as a Custom Repository
Since this card is self-hosted on your GitHub account, add it manually to HACS:
1. Open **HACS** from your Home Assistant sidebar menu.
2. Click the **three dots** in the top right-hand corner and choose **Custom repositories**.
3. Paste the URL of your GitHub repository:
   ```text
   https://github.com/johnny709009/360-floorplan-card
   ```
4. Set the **Category** dropdown choice to **Lovelace**.
5. Click **Add**.

### Step 2: Download the Plugin
1. Find the newly displayed **360° 3D Floorplan Card** inside the HACS store layout.
2. Click **Download** at the bottom right.
3. Once downloaded, clear your browser cache or select **Reload Page** if prompted. HACS automatically configures your Lovelace Dashboard resources.

---

## Asset Management Setup
Before setting up your Lovelace card interface, place your exported 3D asset geometries inside your local configuration space:

1. Connect to your Home Assistant files (via Samba Share, SSH, or File Editor).
2. Inside your `config/www/` folder, create a new subfolder named `floorplan`.
3. Drop your textured 3D file outputs here:
   * `config/www/floorplan/house.obj`
   * `config/www/floorplan/house.mtl`

*Note: In Home Assistant dashboard YAML configurations, the `/config/www/` prefix converts into the external path mapping `/local/`.*

---

## Configuration & Usage Example

Go to your dashboard, click **Edit Dashboard**, add a new **Manual** card option, and provide your structured YAML parameter instructions:

```yaml
type: custom:three-floorplan-card
obj_path: /local/floorplan/house.obj
mtl_path: /local/floorplan/house.mtl
lights:
  - entity: light.living_room_rgb
    icon: mdi:sofa
    x: -2.5
    y: 1.2
    z: 3.0
  - entity: light.kitchen_pendant
    icon: mdi:lightbulb
    x: 4.1
    y: 1.2
    z: -1.5
  - entity: light.master_bedroom_strip
    icon: mdi:bed
    x: 0.0
    y: 0.8
    z: 5.4
```

### Positioning Custom Anchors ($X, Y, Z$)
Because this card renders a native 3D viewport canvas, light points are placed along actual cartesian coordinates intersecting your objects:
* **X-Axis:** Shifts placement horizontally left (negative values) or right (positive values).
* **Y-Axis:** Controls vertical elevation height above the floor plane (e.g., setting it around `1.0` to `1.5` puts the interactive icon right at ceiling fixture or pendant light levels).
* **Z-Axis:** Tracks forward (positive values) or backward depth layout mapping positions.

*Tip: Start an icon position at `0, 1.2, 0` and alter values incrementally using your dashboard visual YAML editor to dynamically shift anchors into correct spaces.*

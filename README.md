# Mixed Reality Tower of Hanoi 🏰

A high-performance Mixed Reality (MR) application simulating the classic Tower of Hanoi puzzle, developed as part of the **Virtual and Mixed Reality** course at **Université Paris-Saclay**.

## 🛠 Technical Overview
The project focuses on "fluid interaction" in MR spaces, moving away from rigid object snapping in favor of smooth, physics-inspired manipulation.

* **Engine:** Three.js
* **API:** WebXR (supporting VR/MR headsets with passthrough)
* **Key Feature:** Lerp-based smoothing for disk manipulation to simulate "weight" and "drag."

## 🚀 Key Features
* **Fluid Interaction:** Utilizes Linear Interpolation (CurrentPosition = CurrentPosition + 0.2 * (TargetPosition - CurrentPosition)) to ensure responsive and smooth object movement.
* **MR Passthrough:** Configured with transparent backgrounds to ground the virtual game board in the user's physical environment.
* **Custom Particle System:** Dynamic star-particle generation with velocity and gravity physics.
* **Thematic UI:** Features a unique "Soviet/Communist" aesthetic with external texture loading and spatial audio integration.

## 🏗 Scene Architecture
The application uses a flat hierarchical scene graph to optimize world-space calculations:
- **Static Environment:** Wooden base, 3 drop-zone pegs, and themed background planes.
- **Dynamic Objects:** Interactive cylinder meshes (disks).
- **UI & Feedback:** Semi-transparent "GhostDisk" for drop previews and a particle-based victory screen.

## 💻 Optimization
- **Performance:** Used standard primitives (Cylinder/BoxGeometry) to maintain a stable **90Hz+ framerate**.
- **Memory Management:** Active cleanup of the particle system (`scene.remove`) to prevent memory leaks during long sessions.

## 👥 Team Members
- Mahmoud ABOSHUKR
- Ramzi AMIRA

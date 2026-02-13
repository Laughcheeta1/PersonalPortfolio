import * as THREE from 'three/src/Three.js';

import type { FocusTarget } from './types';
import { damp, wrapToPi } from '../math';

// Immutable configuration for camera orbit behavior.
type OrbitCameraControllerOptions = {
  // Angular distance between neighboring models in model ring.
  angleStep: number;
  // Radius used when no model is selected (global orbit around origin).
  baseOrbitRadius: number;
  // Height used in global orbit mode.
  baseOrbitHeight: number;
  // Auto-rotation speed (radians/second) while unfocused.
  autoRotateSpeed: number;
  // Mouse drag sensitivity to yaw changes.
  pointerSensitivity: number;
  // If snap delta is below this threshold, we apply snapping.
  snapThreshold: number;
  // Snap influence factor when near a model angle.
  snapStrength: number;
};

// Owns orbit camera motion and pointer drag state.
export class OrbitCameraController {
  // Config fields.
  private readonly angleStep: number;
  private readonly baseOrbitRadius: number;
  private readonly baseOrbitHeight: number;
  private readonly autoRotateSpeed: number;
  private readonly pointerSensitivity: number;
  private readonly snapThreshold: number;
  private readonly snapStrength: number;

  // Orbit rotation state:
  // autoYaw = autonomous drift while unfocused
  // userYawTarget = desired offset from drag/keys
  // userYawCurrent = damped current offset
  private autoYaw = 0;
  private userYawTarget = 0;
  private userYawCurrent = 0;

  // Pointer gesture state to distinguish click vs drag.
  private pointerDown = false;
  private dragging = false;
  private pointerStartX = 0;
  private pointerLastX = 0;

  // Reused vectors to avoid allocations in hot update loop.
  private readonly cameraLookAt = new THREE.Vector3(0, 0, 0);
  private readonly desiredCameraPosition = new THREE.Vector3(0, 0, 0);

  constructor(options: OrbitCameraControllerOptions) {
    this.angleStep = options.angleStep;
    this.baseOrbitRadius = options.baseOrbitRadius;
    this.baseOrbitHeight = options.baseOrbitHeight;
    this.autoRotateSpeed = options.autoRotateSpeed;
    this.pointerSensitivity = options.pointerSensitivity;
    this.snapThreshold = options.snapThreshold;
    this.snapStrength = options.snapStrength;
  }

  // Update camera every frame.
  // Returns the current combined orbit angle (auto + user contribution).
  update(dt: number, camera: THREE.PerspectiveCamera, focusTarget: FocusTarget | null): number {
    // In unfocused mode, camera slowly rotates around origin.
    if (!focusTarget) {
      this.autoYaw += this.autoRotateSpeed * dt;
    }

    // Soft snapping in unfocused mode:
    // encourage camera angle to settle near nearest model slot angle.
    if (!this.dragging && !focusTarget) {
      const combinedYaw = this.autoYaw + this.userYawTarget;
      const snapAngle = Math.round(combinedYaw / this.angleStep) * this.angleStep;
      const snapDelta = wrapToPi(snapAngle - combinedYaw);
      if (Math.abs(snapDelta) < this.snapThreshold) {
        this.userYawTarget += snapDelta * this.snapStrength;
      }
    }

    // Damped motion avoids abrupt jumps when user drags quickly.
    this.userYawCurrent = damp(this.userYawCurrent, this.userYawTarget, Math.min(0.12 + dt * 2, 0.22));
    const orbitAngle = this.autoYaw + this.userYawCurrent;

    // Focused mode orbits around selected model center.
    // Unfocused mode orbits around world origin.
    if (focusTarget) {
      this.desiredCameraPosition.set(
        focusTarget.position.x + Math.sin(orbitAngle) * focusTarget.orbitRadius,
        focusTarget.position.y + focusTarget.orbitHeight,
        focusTarget.position.z + Math.cos(orbitAngle) * focusTarget.orbitRadius,
      );
      // Smoothly move camera look target toward selected model center.
      this.cameraLookAt.lerp(focusTarget.position, 0.11);
    } else {
      this.desiredCameraPosition.set(
        Math.sin(orbitAngle) * this.baseOrbitRadius,
        this.baseOrbitHeight,
        Math.cos(orbitAngle) * this.baseOrbitRadius,
      );
      // Smoothly return gaze to origin in unfocused mode.
      this.cameraLookAt.lerp(ORIGIN, 0.08);
    }

    // Smooth camera movement and final look direction application.
    camera.position.lerp(this.desiredCameraPosition, 0.08);
    camera.lookAt(this.cameraLookAt);
    return orbitAngle;
  }

  // Used by "focus nearest model" keyboard action.
  getCurrentOrbitAngle(): number {
    return this.autoYaw + this.userYawCurrent;
  }

  // Start pointer interaction.
  onPointerDown(clientX: number): void {
    this.pointerDown = true;
    this.dragging = false;
    this.pointerStartX = clientX;
    this.pointerLastX = clientX;
  }

  // Continue pointer interaction; if movement crosses threshold, mark as drag.
  onPointerMove(clientX: number): void {
    if (!this.pointerDown) {
      return;
    }

    const deltaX = clientX - this.pointerLastX;
    const movedX = Math.abs(clientX - this.pointerStartX);
    this.pointerLastX = clientX;

    if (movedX > 4) {
      this.dragging = true;
    }

    // Horizontal movement adjusts yaw target.
    this.userYawTarget -= deltaX * this.pointerSensitivity;
  }

  // Finish interaction and report whether it should be treated as click.
  // true  => click candidate (no meaningful drag)
  // false => drag interaction
  endPointerInteraction(): boolean {
    if (!this.pointerDown) {
      return false;
    }

    const wasDragging = this.dragging;
    this.pointerDown = false;
    this.dragging = false;
    return !wasDragging;
  }

  // Cancel interaction state (used on pointerleave).
  cancelPointerInteraction(): void {
    this.pointerDown = false;
    this.dragging = false;
  }

  // Keyboard helper: rotate camera left.
  nudgeLeft(): void {
    this.userYawTarget += 0.16;
  }

  // Keyboard helper: rotate camera right.
  nudgeRight(): void {
    this.userYawTarget -= 0.16;
  }
}

// Shared origin vector for unfocused look target.
const ORIGIN = new THREE.Vector3(0, 0, 0);

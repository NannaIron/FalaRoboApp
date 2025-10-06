import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
  standalone: true,
  imports: [CommonModule]
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;
  @Input() selectedOption: string = 'pistao-pequeno';

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId!: number;
  private resizeObserver!: ResizeObserver;
  private clock!: THREE.Clock;

  private pistaoGrande!: { corpo: THREE.Group; haste: THREE.Group; };
  private pistaoPequeno!: { corpo: THREE.Group; haste: THREE.Group; };
  
  private animationParams = {
    grande: { direction: 1, time: 0 },
    pequeno: { direction: -1, time: Math.PI, isAnimating: true, cycleCount: 0 } 
  };
  
  private readonly ANIMATION_SPEED = 1.5;
  private readonly ANIMATION_DISTANCE = 2;
  
  private readonly PISTAO_GRANDE_DISTANCE = 1;
  private readonly PISTAO_PEQUENO_DISTANCE = 1.1;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['selectedOption']) {
        this.selectedOption = data['selectedOption'];
        if (this.scene) {
          this.updateVisibleModels();
          this.adjustCameraForOption();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.clock = new THREE.Clock();
    this.loadAllModels();
    this.animate();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOption'] && this.scene) {
      this.updateVisibleModels();
      this.adjustCameraForOption();
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(2, 2, 2);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 1.5;

    this.setupLighting();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(-10, 10, 10);
    this.scene.add(pointLight);
  }

  private async loadAllModels(): Promise<void> {
    const loader = new GLTFLoader();
    
    try {
      const [corpoGrande, hasteGrande] = await Promise.all([
        this.loadSingleModel(loader, '/assets/models/corpopistao.glb'),
        this.loadSingleModel(loader, '/assets/models/hastepistao.glb')
      ]);
      
      const [corpoPequeno, hastePequeno] = await Promise.all([
        this.loadSingleModel(loader, '/assets/models/cilindropistinho.glb'),
        this.loadSingleModel(loader, '/assets/models/hastepistinho.glb')
      ]);
      
      this.pistaoGrande = { corpo: corpoGrande, haste: hasteGrande };
      this.setupPiston(this.pistaoGrande, new THREE.Vector3(-3, 0, 0));
      
      this.pistaoPequeno = { corpo: corpoPequeno, haste: hastePequeno };
      this.setupPiston(this.pistaoPequeno, new THREE.Vector3(3, 0, 0));
      
      this.scene.add(this.pistaoGrande.corpo);
      this.scene.add(this.pistaoGrande.haste);
      this.scene.add(this.pistaoPequeno.corpo);
      this.scene.add(this.pistaoPequeno.haste);
      
      this.updateVisibleModels();
      this.adjustCameraForOption();
      
    } catch (error) {
      console.error('Erro ao carregar os modelos:', error);
    }
  }
  
  private loadSingleModel(loader: GLTFLoader, path: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          resolve(model);
        },
        (progress) => {
          console.log(`Carregando ${path}:`, (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  private setupPiston(pistao: { corpo: THREE.Group; haste: THREE.Group; }, position: THREE.Vector3): void {
    const corpoBox = new THREE.Box3().setFromObject(pistao.corpo);
    const corpoCenter = corpoBox.getCenter(new THREE.Vector3());
    pistao.corpo.position.sub(corpoCenter).add(position);
    
    const corpoSize = corpoBox.getSize(new THREE.Vector3());
    const corpoMaxSize = Math.max(corpoSize.x, corpoSize.y, corpoSize.z);
    const corpoScale = 2 / corpoMaxSize;
    pistao.corpo.scale.setScalar(corpoScale);
    
    const hasteBox = new THREE.Box3().setFromObject(pistao.haste);
    const hasteCenter = hasteBox.getCenter(new THREE.Vector3());
    pistao.haste.position.sub(hasteCenter).add(position);
    
    const hasteSize = hasteBox.getSize(new THREE.Vector3());
    const hasteMaxSize = Math.max(hasteSize.x, hasteSize.y, hasteSize.z);
    const hasteScale = 2 / hasteMaxSize;
    pistao.haste.scale.setScalar(hasteScale);
    
    if (position.x > 0) { 
      pistao.corpo.rotation.y = Math.PI; 
      
      pistao.haste.rotation.y = Math.PI / 2; 
      
      // Reduzir escala do hastepistinho.glb para deixá-lo menor
      pistao.haste.scale.multiplyScalar(0.8); // Reduz para 80% do tamanho original
      
      pistao.haste.position.copy(pistao.corpo.position);
    } else {
      pistao.haste.position.y = pistao.corpo.position.y;
      pistao.haste.position.z = pistao.corpo.position.z;
    }
    
    pistao.haste.userData['initialPosition'] = pistao.haste.position.clone();
  }
  
  private updateVisibleModels(): void {
    if (!this.pistaoGrande || !this.pistaoPequeno) return;
    
    this.pistaoGrande.corpo.visible = false;
    this.pistaoGrande.haste.visible = false;
    this.pistaoPequeno.corpo.visible = false;
    this.pistaoPequeno.haste.visible = false;
    
    switch (this.selectedOption) {
      case 'pistao-grande':
        this.pistaoGrande.corpo.visible = true;
        this.pistaoGrande.haste.visible = true;
        break;
      case 'pistao-pequeno':
        this.pistaoPequeno.corpo.visible = true;
        this.pistaoPequeno.haste.visible = true;
        break;
      case 'completo':
        this.pistaoGrande.corpo.visible = true;
        this.pistaoGrande.haste.visible = true;
        this.pistaoPequeno.corpo.visible = true;
        this.pistaoPequeno.haste.visible = true;
        break;
    }
  }
  
  private adjustCameraForOption(): void {
    let targetDistance = 8;
    let targetPosition = new THREE.Vector3(0, 0, 0);
    
    switch (this.selectedOption) {
      case 'pistao-grande':
        targetPosition.set(-3, 0, 0);
        targetDistance = 6;
        break;
      case 'pistao-pequeno':
        targetPosition.set(3, 0, 0);
        targetDistance = 6;
        break;
      case 'completo':
        targetPosition.set(0, 0, 0);
        targetDistance = 10;
        break;
    }
    
    this.controls.target.copy(targetPosition);
    this.controls.minDistance = targetDistance * 0.5;
    this.controls.maxDistance = targetDistance * 1.5;
    
    const cameraPos = targetPosition.clone().add(new THREE.Vector3(targetDistance * 0.6, targetDistance * 0.6, targetDistance * 0.6));
    this.camera.position.copy(cameraPos);
    
    this.controls.update();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    this.updatePistonAnimations(deltaTime);
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  private updatePistonAnimations(deltaTime: number): void {
    if (!this.pistaoGrande || !this.pistaoPequeno) return;
    
    this.animationParams.grande.time += deltaTime * this.ANIMATION_SPEED;
    
    if (this.animationParams.pequeno.isAnimating) {
      this.animationParams.pequeno.time += deltaTime * this.ANIMATION_SPEED;
    }
    
    if (this.pistaoGrande.haste.visible) {
      const sineValue = Math.sin(this.animationParams.grande.time);
      const grandeOffset = Math.max(0, sineValue) * this.PISTAO_GRANDE_DISTANCE;
      
      const initialPos = this.pistaoGrande.haste.userData['initialPosition'] as THREE.Vector3;
      this.pistaoGrande.haste.position.z = initialPos.z + grandeOffset; 
    }
    
    if (this.pistaoPequeno.haste.visible && this.animationParams.pequeno.isAnimating) {
      const sineValue = Math.sin(this.animationParams.pequeno.time);
      const pequenoOffset = Math.max(0, sineValue) * this.PISTAO_PEQUENO_DISTANCE;
      
      const initialPos = this.pistaoPequeno.haste.userData['initialPosition'] as THREE.Vector3;
      this.pistaoPequeno.haste.position.x = initialPos.x + pequenoOffset;
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.onWindowResize(width, height);
        }
      }
    });
    
    this.resizeObserver.observe(this.canvasContainer.nativeElement);
  }

  private onWindowResize(width: number, height: number): void {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }
}

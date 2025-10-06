import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PopupService } from '../../../services/popup.service';
import { ChatbotComponent } from '../chatbot/chatbot';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap, distinctUntilChanged, tap } from 'rxjs/operators';
import { ModelService, PistonId } from '../../../services/model.service';
import { SensorService } from '../../../services/sensor.service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
  standalone: true,
  imports: [CommonModule, ChatbotComponent]
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;
  @Input() selectedOption: string = 'pistao-pequeno';

  state: any = null;
  animationSpeed = 1;
  running = false;
  firstToAnimate: 'small' | 'big' = 'small';

  isPopupOpen = false;
  private popupSub!: Subscription;
  private modelSub!: Subscription;
  private sensorSub!: Subscription;
  private pollingSub!: Subscription;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId!: number;
  private resizeObserver!: ResizeObserver;
  private clock!: THREE.Clock;

  private pistaoGrande!: { corpo: THREE.Group; haste: THREE.Group };
  private pistaoPequeno!: { corpo: THREE.Group; haste: THREE.Group };

  private animationParams = {
    grande: { direction: 1, time: 0, isAnimating: true },
    pequeno: { direction: -1, time: Math.PI, isAnimating: true }
  };

  private readonly BASE_ANIMATION_SPEED = 1.5;
  private readonly PISTAO_GRANDE_DISTANCE = 1;
  private readonly PISTAO_PEQUENO_DISTANCE = 1.1;

  private epsilon = 0.001;
  private lastProcessedState: any = null;

  private popup = inject(PopupService);
  private modelService = inject(ModelService);
  private sensorService = inject(SensorService);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.popupSub = this.popup.open$.subscribe(open => {
      this.isPopupOpen = open;
    });

    this.modelSub = this.modelService.states$.subscribe(() => {
    });

    this.sensorSub = this.sensorService.getState().subscribe((data: any) => {
      if (!data) return;
      
      console.log('Processando estado no canvas:', data);
      this.processState(data);
    });

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

    this.startStatePolling();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOption'] && this.scene) {
      this.updateVisibleModels();
      this.adjustCameraForOption();
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.controls) this.controls.dispose();
    if (this.renderer) this.renderer.dispose();
    if (this.popupSub) this.popupSub.unsubscribe();
    if (this.modelSub) this.modelSub.unsubscribe();
    if (this.sensorSub) this.sensorSub.unsubscribe();
    if (this.pollingSub) this.pollingSub.unsubscribe();
  }

  onOverlayClick(_event: MouseEvent): void {
    this.popup.close();
  }

  private startStatePolling(): void {
    this.pollingSub = interval(2100)
      .pipe(
        startWith(0),
        switchMap(() => this.sensorService.fetchOnce()),
        tap(data => {
          if (data && data.positions && data.sensors) {
            console.log('Enviando sensores opostos após polling...');
            this.sensorService.postOppositeSensors(data).subscribe({
              next: () => console.log('Sensores opostos enviados com sucesso'),
              error: (err) => console.error('Erro ao enviar sensores opostos:', err)
            });
          }
        })
      )
      .subscribe({
        next: () => {
          console.log('Polling completado');
        },
        error: (err) => {
          console.error('Erro ao buscar estado:', err);
        }
      });
  }

  private processState(data: any): void {
    this.state = data;
    this.running = !!data.running;
    this.animationSpeed = typeof data.bar === 'number' ? data.bar : 1;

    if (!this.lastProcessedState || 
        this.lastProcessedState.positions?.small !== data.positions?.small) {
      this.firstToAnimate = data.positions && data.positions.small === 'Forwards' ? 'small' : 'big';
    }

    this.handleAnimations();
    this.lastProcessedState = { ...data };
  }

  private handleAnimations(): void {
    if (this.running) {
      this.startAnimations();
    } else {
      this.pauseAnimations();
    }
  }

  private startAnimations(): void {
    if (this.pistaoGrande && this.pistaoPequeno) {
      if (this.pistaoGrande.haste.visible) this.animationParams.grande.isAnimating = true;
      if (this.pistaoPequeno.haste.visible) this.animationParams.pequeno.isAnimating = true;
    }

    const positions = this.state && this.state.positions ? this.state.positions : { small: 'None', big: 'None' };
    const smallIsForwards = positions.small === 'Forwards';
    const bigIsForwards = positions.big === 'Forwards';

    if (smallIsForwards && !bigIsForwards) {
      this.animationParams.pequeno.time = 0;
      this.animationParams.grande.time = Math.PI;
    } else if (bigIsForwards && !smallIsForwards) {
      this.animationParams.grande.time = 0;
      this.animationParams.pequeno.time = Math.PI;
    } else {
      if (this.firstToAnimate === 'small') {
        this.animationParams.pequeno.time = 0;
        this.animationParams.grande.time = Math.PI;
      } else {
        this.animationParams.grande.time = 0;
        this.animationParams.pequeno.time = Math.PI;
      }
    }

    if (this.pistaoGrande && this.pistaoPequeno) {
      if (this.pistaoGrande.haste.visible) this.animationParams.grande.isAnimating = true;
      if (this.pistaoPequeno.haste.visible) this.animationParams.pequeno.isAnimating = true;
    }
  }

  private pauseAnimations(): void {
    if (this.pistaoGrande && this.pistaoPequeno) {
      this.animationParams.grande.isAnimating = false;
      this.animationParams.pequeno.isAnimating = false;

      const initGrande = this.pistaoGrande.haste.userData['initialPosition'] as THREE.Vector3;
      const initPequeno = this.pistaoPequeno.haste.userData['initialPosition'] as THREE.Vector3;
      if (initGrande) this.pistaoGrande.haste.position.copy(initGrande);
      if (initPequeno) this.pistaoPequeno.haste.position.copy(initPequeno);
    }
  }

  private initThreeJS(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(2, 2, 2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    this.controls.minDistance = 2;
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
      this.setupPiston(this.pistaoGrande, new THREE.Vector3(-1.5, 0, 0));

      this.pistaoPequeno = { corpo: corpoPequeno, haste: hastePequeno };
      this.setupPiston(this.pistaoPequeno, new THREE.Vector3(1.5, 0, 0));

      this.scene.add(this.pistaoGrande.corpo);
      this.scene.add(this.pistaoGrande.haste);
      this.scene.add(this.pistaoPequeno.corpo);
      this.scene.add(this.pistaoPequeno.haste);

      this.updateVisibleModels();
      this.adjustCameraForOption();
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    }
  }

  private loadSingleModel(loader: GLTFLoader, path: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        gltf => {
          const model = gltf.scene;
          model.traverse(child => {
            if ((child as any).isMesh) {
              (child as THREE.Mesh).castShadow = true;
              (child as THREE.Mesh).receiveShadow = true;
            }
          });
          resolve(model);
        },
        undefined,
        error => reject(error)
      );
    });
  }

  private setupPiston(pistao: { corpo: THREE.Group; haste: THREE.Group }, position: THREE.Vector3): void {
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
      pistao.corpo.rotation.y = Math.PI + Math.PI / 2 + Math.PI;
      pistao.haste.rotation.y = Math.PI / 2 + Math.PI / 2 + Math.PI;
      pistao.haste.scale.multiplyScalar(0.8);
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
        targetPosition.set(-1.5, 0, 0);
        targetDistance = 3;
        break;
      case 'pistao-pequeno':
        targetPosition.set(1.5, 0, 0);
        targetDistance = 3;
        break;
      case 'completo':
        targetPosition.set(0, 0, 0);
        targetDistance = 4;
        break;
    }

    this.controls.target.copy(targetPosition);
    this.controls.minDistance = targetDistance * 0.25;
    this.controls.maxDistance = targetDistance * 2;

    const cameraPos = targetPosition
      .clone()
      .add(new THREE.Vector3(targetDistance * 0.6, targetDistance * 0.6, targetDistance * 0.6));
    this.camera.position.copy(cameraPos);

    this.controls.update();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const effectiveDelta = deltaTime * (this.animationSpeed || 1);

    this.updatePistonAnimations(effectiveDelta);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private updatePistonAnimations(deltaTime: number): void {
    if (!this.pistaoGrande || !this.pistaoPequeno) return;

    if (this.running && this.animationParams.grande.isAnimating) {
      this.animationParams.grande.time += deltaTime * this.BASE_ANIMATION_SPEED;
    }

    if (this.running && this.animationParams.pequeno.isAnimating) {
      this.animationParams.pequeno.time += deltaTime * this.BASE_ANIMATION_SPEED;
    }

    if (this.pistaoGrande.haste.visible) {
      const sineValue = Math.sin(this.animationParams.grande.time);
      const grandeOffset = Math.max(0, sineValue) * this.PISTAO_GRANDE_DISTANCE;
      const initialPos = this.pistaoGrande.haste.userData['initialPosition'] as THREE.Vector3;
      this.pistaoGrande.haste.position.z = initialPos.z + grandeOffset;
    }

    if (this.pistaoPequeno.haste.visible) {
      const sineValue = Math.sin(this.animationParams.pequeno.time);
      const pequenoOffset = Math.max(0, sineValue) * this.PISTAO_PEQUENO_DISTANCE;
      const initialPos = this.pistaoPequeno.haste.userData['initialPosition'] as THREE.Vector3;
      this.pistaoPequeno.haste.position.z = initialPos.z + pequenoOffset;
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(entries => {
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
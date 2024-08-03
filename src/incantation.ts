import { Actor, CollisionType, Color, Engine, KeyEvent, Keys, Rectangle, Shape, SoundEvents, Subscription, Vector } from "excalibur";
import { Resources } from "./assets/resources";

type IncSequence = IncWidget[] | "random";

export interface IncConfig {
  sequence: IncSequence;
  speed: number;
  numberOfWidgets?: number;
  engine: Engine;
  keyboardManager: KeyboardManager;
}

export class Incantation extends Actor {
  timerTik = 0;
  score = 0;
  tikTargets: number[] = [];
  targetRegion = new IncTargetRegion(this);
  keyboardManager: KeyboardManager;
  engine: Engine;
  sequence: IncWidget[];
  numWidgets: number;
  speed: number;
  constructor(config: IncConfig) {
    super({
      width: 800,
      height: 600,
      color: Color.fromHex("#33333370"),
    });
    this.pos = new Vector(400, 300);
    this.keyboardManager = config.keyboardManager;
    this.engine = config.engine;
    this.speed = config.speed;
    if (config.sequence === "random") {
      config.numberOfWidgets ? (this.numWidgets = config.numberOfWidgets) : (this.numWidgets = 3);
      config.sequence == "random" ? (this.sequence = this.generateRandomSequence()) : (this.sequence = config.sequence);
    } else {
      this.sequence = config.sequence;
      this.numWidgets = this.sequence.length;
    }
    console.log(this.keyboardManager);

    this.keyboardManager.registerOwner(new IncantationBindings());
    this.keyboardManager.setOwner("incanctationBinding", this.targetRegion);

    this.addChild(this.targetRegion);
  }

  generateRandomSequence(): IncWidget[] {
    const sequence: IncWidget[] = [];
    for (let i = 0; i < this.numWidgets; i++) {
      //pick number betwee 0 and 3
      if (i == this.numWidgets - 1) {
        sequence.push(new enterButton(this.engine));
      } else {
        const rand = Math.floor(Math.random() * 4);
        console.log(rand);

        switch (rand) {
          case 0:
            sequence.push(new leftButton(this.engine));
            break;
          case 1:
            sequence.push(new rightButton(this.engine));
            break;
          case 2:
            sequence.push(new upButton(this.engine));
            break;
          case 3:
            sequence.push(new downButton(this.engine));
            break;
        }
      }
    }

    return sequence;
  }

  onInitialize(engine: Engine): void {
    for (let i = 0; i < this.numWidgets; i++) {
      this.tikTargets.push(this.speed * i);
    }
    console.log(this.tikTargets);
  }

  onPreUpdate(engine: Engine, delta: number): void {
    this.tikTargets.forEach((target, index) => {
      if (this.timerTik === target) {
        // add child of index
        console.log("adding child of index " + index);
        console.log(this.sequence[index]);
        this.sequence[index].setSpeed(this.speed);
        this.addChild(this.sequence[index]);
      }
    });
    this.timerTik += 1;
  }
}

//#region widgets

const capsuleCollider = Shape.Capsule(16, 8, new Vector(0, 0));
class IncWidget extends Actor {
  isColliding = false;
  timerTik = 0;
  dirVector: Vector = new Vector(0, 1);
  constructor(public engine: Engine, public speed: number = 50) {
    super({
      width: 16,
      height: 16,
      collider: capsuleCollider,
      collisionType: CollisionType.Passive,
    });
    this.pos = new Vector(0, 0);
    this.scale = new Vector(0.5, 0.5);
  }

  onInitialize(engine: Engine): void {
    this.on("collisionstart", ev => {
      if (ev.actor instanceof IncTargetRegion) {
        this.isColliding = true;
      }
    });
    this.on("collisionend", ev => {
      if (ev.actor instanceof IncTargetRegion) {
        this.isColliding = false;
      }
    });
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  onPreUpdate(engine: Engine, delta: number): void {
    this.timerTik += 1;

    this.pos = this.pos.add(this.dirVector.scale(this.timerTik / this.speed));
    this.scale = this.scale.add(new Vector(0.02, 0.02));
  }
}

export class leftButton extends IncWidget {
  constructor(public engine: Engine) {
    super(engine);
    this.pos = new Vector(0, 0);
    this.graphics.use(Resources.leftbutton.toSprite());
    this.dirVector = new Vector(-0.5, 1);
  }
}

export class rightButton extends IncWidget {
  constructor(public engine: Engine) {
    super(engine);
    this.pos = new Vector(0, 0);
    this.graphics.use(Resources.rightbutton.toSprite());
    this.dirVector = new Vector(-0.3, 1);
  }
}

export class upButton extends IncWidget {
  constructor(public engine: Engine) {
    super(engine);
    this.pos = new Vector(0, 0);
    this.graphics.use(Resources.upbutton.toSprite());
  }
}

export class downButton extends IncWidget {
  constructor(public engine: Engine) {
    super(engine);
    this.pos = new Vector(0, 0);
    this.graphics.use(Resources.downbutton.toSprite());
    this.dirVector = new Vector(0.3, 1);
  }
}

export class enterButton extends IncWidget {
  constructor(public engine: Engine) {
    super(engine);
    this.pos = new Vector(0, 0);
    this.graphics.use(Resources.enterbutton.toSprite());
    this.dirVector = new Vector(0.5, 1);
  }
}

const RectangleCollider = Shape.Box(300, 75);

class IncTargetRegion extends Actor {
  constructor(public incantation: Incantation) {
    super({
      width: 300,
      height: 75,
      color: Color.fromHex("#33333370"),
      collider: RectangleCollider,
      collisionType: CollisionType.Active,
    });

    this.pos = new Vector(0, 200);
  }

  public leftButton() {
    //get list of leftbuttons
    console.log("in left button callback");

    console.log(this.incantation.children);

    this.incantation.children.forEach(child => {
      console.log(child, (child as IncWidget).isColliding);

      if (child instanceof leftButton && child.isColliding) {
        console.log("left button colliding");
        console.log(this.collider.bounds);
        console.log(child.collider.bounds.topLeft.clone());
        console.log(child.collider.bounds.bottomRight.clone());

        console.log(this.collider.bounds.contains(child.collider.bounds.topLeft));
        console.log(this.collider.bounds.contains(child.collider.bounds.bottomRight));

        if (
          this.collider.bounds.contains(child.collider.bounds.topLeft) &&
          this.collider.bounds.contains(child.collider.bounds.bottomRight)
        ) {
          sndPlugin.playSound("leftbutton");
          this.incantation.score += 1;
          this.kill();
        }
      }
    });
  }

  public rightButton() {}

  public upButton() {}

  public downButton() {}

  public enterButton() {}
}
//#endregion widgets

//#region keybindings
import { KeyboardManager } from "./Keyboard";
import { ExState } from "./ExFSM";

class IncantationBindings extends ExState {
  handler: Subscription | undefined = undefined;

  constructor() {
    super("incanctationBinding");
  }

  enter(_previous: ExState | null, ...params: any): void | Promise<void> {
    const engine = params[0] as Engine;
    const target = params[1][0] as IncTargetRegion;
    console.log("setting up key bindings");
    console.log(target);

    this.handler = engine.input.keyboard.on("press", (evt: KeyEvent) => {
      console.log(evt.key, " pressed");

      if (evt.key === Keys.ArrowUp) target.upButton();
      if (evt.key === Keys.ArrowDown) target.downButton();
      if (evt.key === Keys.ArrowLeft) target.leftButton();
      if (evt.key === Keys.ArrowRight) target.rightButton();
      if (evt.key === Keys.Enter) target.enterButton();
    });
  }
  exit(_next: ExState | null, ...params: any): void | Promise<void> {
    const engine = params[0] as Engine;
    this.handler?.close();
  }
}

//#endregion keybindings

//#region sounds
import { SoundConfig } from "@excaliburjs/plugin-jsfxr";
import { sndPlugin } from "./main";
import { l } from "vite/dist/node/types.d-aGj9QkWt";

export const IncantationSounds: { [key: string]: SoundConfig } = {};

IncantationSounds["leftbutton"] = {
  oldParams: true,
  wave_type: 0,
  p_env_attack: 0,
  p_env_sustain: 0.32781785963527255,
  p_env_punch: 0,
  p_env_decay: 0.309,
  p_base_freq: 0.334,
  p_freq_limit: 0,
  p_freq_ramp: 0.17238710633799795,
  p_freq_dramp: 0,
  p_vib_strength: 0.494,
  p_vib_speed: 0.668,
  p_arp_mod: 0,
  p_arp_speed: 0,
  p_duty: 0.26505443300560105,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 16,
};

IncantationSounds["rightbutton"] = {
  oldParams: true,
  wave_type: 0,
  p_env_attack: 0,
  p_env_sustain: 0.32781785963527255,
  p_env_punch: 0,
  p_env_decay: 0.309,
  p_base_freq: 0.476,
  p_freq_limit: 0,
  p_freq_ramp: 0.17238710633799795,
  p_freq_dramp: 0,
  p_vib_strength: 0.494,
  p_vib_speed: 0.668,
  p_arp_mod: 0,
  p_arp_speed: 0,
  p_duty: 0.26505443300560105,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 16,
};

IncantationSounds["upbutton"] = {
  oldParams: true,
  wave_type: 0,
  p_env_attack: 0,
  p_env_sustain: 0.32781785963527255,
  p_env_punch: 0,
  p_env_decay: 0.309,
  p_base_freq: 0.599,
  p_freq_limit: 0,
  p_freq_ramp: 0.17238710633799795,
  p_freq_dramp: 0,
  p_vib_strength: 0.494,
  p_vib_speed: 0.668,
  p_arp_mod: 0,
  p_arp_speed: 0,
  p_duty: 0.26505443300560105,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 16,
};

IncantationSounds["downbutton"] = {
  oldParams: true,
  wave_type: 0,
  p_env_attack: 0,
  p_env_sustain: 0.32781785963527255,
  p_env_punch: 0,
  p_env_decay: 0.309,
  p_base_freq: 0.72,
  p_freq_limit: 0,
  p_freq_ramp: 0.17238710633799795,
  p_freq_dramp: 0,
  p_vib_strength: 0.494,
  p_vib_speed: 0.668,
  p_arp_mod: 0,
  p_arp_speed: 0,
  p_duty: 0.26505443300560105,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 16,
};

IncantationSounds["enterbutton"] = {
  oldParams: true,
  wave_type: 0,
  p_env_attack: 0,
  p_env_sustain: 0.13901836910813045,
  p_env_punch: 0,
  p_env_decay: 0.49586033466903856,
  p_base_freq: 0.2698571880899076,
  p_freq_limit: 0,
  p_freq_ramp: 0.3308000762051833,
  p_freq_dramp: 0,
  p_vib_strength: 0,
  p_vib_speed: 0,
  p_arp_mod: 0,
  p_arp_speed: 0,
  p_duty: 0.39478095811362146,
  p_duty_ramp: 0,
  p_repeat_speed: 0.5146174953805049,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 16,
};

IncantationSounds["wrongmove"] = {
  oldParams: true,
  wave_type: 0,
  p_env_attack: 0,
  p_env_sustain: 0.31386371460993256,
  p_env_punch: 0.168,
  p_env_decay: 0.267,
  p_base_freq: 0.173,
  p_freq_limit: 0,
  p_freq_ramp: 0,
  p_freq_dramp: 0,
  p_vib_strength: 0.074,
  p_vib_speed: 0.16,
  p_arp_mod: 0,
  p_arp_speed: 0.7182800409927413,
  p_duty: 0.8346064036416745,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0.21215648506033435,
  p_lpf_resonance: 0.8477316248780076,
  p_hpf_freq: 0,
  p_hpf_ramp: 0.7819501785453971,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 16,
};

//#endregion sounds

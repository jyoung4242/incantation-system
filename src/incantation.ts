import {
  Actor,
  CollisionType,
  Color,
  Engine,
  Graphic,
  KeyEvent,
  Keys,
  Material,
  Raster,
  Rectangle,
  Shape,
  SoundEvents,
  Subscription,
  Vector,
} from "excalibur";
import { Resources } from "./assets/resources";
//@ts-expect-error
import { outlineShader } from "./outline";

type IncSequence = IncWidget[] | "random";

export interface IncConfig {
  sequence: IncSequence;
  speed: number;
  numberOfWidgets?: number;
  engine: Engine;
  keyboardManager: KeyboardManager;
  targetRegionBuffer: number;
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
    console.log("speed: ", this.speed);

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
  }

  onPreUpdate(engine: Engine, delta: number): void {
    this.tikTargets.forEach((target, index) => {
      if (this.timerTik === target) {
        // add child of index

        this.sequence[index].setSpeed(this.speed);
        this.sequence[index].setIncantation(this);
        this.addChild(this.sequence[index]);
      }
    });
    this.timerTik += 1;
  }
}

//#region widgets

const capsuleCollider = Shape.Capsule(16, 8, new Vector(0, 0));
class IncWidget extends Actor {
  isHighlighted = false;
  incantation: Incantation | undefined;
  isColliding = false;
  isCleared = false;
  timerTik = 0;
  dirVector: Vector = new Vector(0, 1);
  material: Material;
  constructor(public engine: Engine, public speed: number = 50) {
    super({
      width: 16,
      height: 16,
      collider: Shape.Capsule(16, 8, new Vector(0, 0)),
      collisionType: CollisionType.Passive,
    });
    this.pos = new Vector(0, 0);
    this.scale = new Vector(0.5, 0.5);
    this.material = engine.graphicsContext.createMaterial({
      name: "outline",
      fragmentSource: outlineShader,
    });
  }

  onInitialize(engine: Engine): void {
    this.on("collisionstart", ev => {
      if (ev.other instanceof IncTargetRegion) {
        this.isColliding = true;
      }
    });
    this.on("collisionend", ev => {
      if (ev.other instanceof IncTargetRegion) {
        // button left target region
        // should kill button after delay
        if (!this.isCleared) {
          setTimeout(() => {
            console.log("button left the target region", this);

            sndPlugin.playSound("wrongmove");
            if (this.incantation) {
              this.incantation.engine.backgroundColor = Color.Red;
              setTimeout(() => {
                if (this.incantation) this.incantation.engine.backgroundColor = Color.ExcaliburBlue;
              }, 250);
            }

            if (this instanceof enterButton) {
              if (!this.incantation) return;
              const event = new CustomEvent("incantationComplete", { detail: this.incantation.score });
              document.dispatchEvent(event);
              this.incantation.keyboardManager.setOwner("main");
              this.incantation.kill();
            }

            this.kill();
          }, 300);
        }
      }
    });
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  setIncantation(incantation: Incantation) {
    this.incantation = incantation;
  }

  onPreUpdate(engine: Engine, delta: number): void {
    console.log(this.name, this.isColliding, this.isHighlighted);

    if (this.isColliding) {
      if (
        this.incantation?.targetRegion.collider.bounds.contains(this.collider.bounds.topLeft) &&
        this.incantation?.targetRegion.collider.bounds.contains(this.collider.bounds.bottomRight)
      ) {
        this.isHighlighted = true;
        this.graphics.material = this.material;
      } else {
        this.isHighlighted = false;
      }
    }

    if (this.graphics.material) {
      this.graphics.material.update(shader => {
        shader.trySetUniformBoolean("u_ready", this.isHighlighted);
      });
    }
    this.timerTik += 1;

    this.pos = this.pos.add(this.dirVector.scale(this.timerTik / this.speed));
    this.scale = this.scale.add(new Vector(0.025, 0.025));
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
      height: 90,
      color: Color.fromHex("#33333370"),
      collider: RectangleCollider,
      collisionType: CollisionType.Active,
    });

    const myBorder = new Rectangle({
      width: 300,
      height: 75,
      lineWidth: 1,
      strokeColor: Color.White,
      color: Color.Transparent,
    });

    this.graphics.use(myBorder);

    this.pos = new Vector(0, 200);
  }

  buttonPress(sndString: string) {
    //filter by button type
    const buttons = this.incantation.children.filter(child => {
      switch (sndString) {
        case "leftbutton":
          return child instanceof leftButton;
        case "rightbutton":
          return child instanceof rightButton;
        case "upbutton":
          return child instanceof upButton;
        case "downbutton":
          return child instanceof downButton;
        case "enterbutton":
          return child instanceof enterButton;
      }
    });

    if (buttons.length > 0) {
      // found buttons
      // need lowest y button

      function isEnterButton(button: IncWidget) {
        if (button.incantation) {
          const event = new CustomEvent("incantationComplete", { detail: button.incantation.score });
          document.dispatchEvent(event);
          button.incantation.keyboardManager.setOwner("main");
          button.incantation.kill();
        }
      }

      const sortedButtons = buttons.sort((a, b) => {
        return (b as IncWidget).pos.y - (a as IncWidget).pos.y;
      });
      const buttonToTest = sortedButtons[0] as IncWidget;

      if (buttonToTest.isColliding) {
        if (
          this.collider.bounds.contains(buttonToTest.collider.bounds.topLeft) &&
          this.collider.bounds.contains(buttonToTest.collider.bounds.bottomRight)
        ) {
          sndPlugin.playSound(sndString);
          buttonToTest.isCleared = true;
          this.incantation.score += 1;
          buttonToTest.kill();
        } else {
          // closeest button not inside target region
          console.log("closest button not inside target region", buttonToTest);
          sndPlugin.playSound("wrongmove");
          this.incantation.score -= 1;
          buttonToTest.isCleared = true;
          this.incantation.engine.backgroundColor = Color.Red;
          setTimeout(() => {
            this.incantation.engine.backgroundColor = Color.ExcaliburBlue;
          }, 250);
        }
        if (buttonToTest instanceof enterButton) isEnterButton(buttonToTest);
      } else {
        // closest button not hitting target region
        sndPlugin.playSound("wrongmove");
        console.log(sortedButtons, buttonToTest.isColliding);
        console.log("closest button not hitting target region", buttonToTest);
        buttonToTest.isCleared = true;
        this.incantation.score -= 1;
        this.incantation.engine.backgroundColor = Color.Red;
        setTimeout(() => {
          this.incantation.engine.backgroundColor = Color.ExcaliburBlue;
        }, 250);
        if (buttonToTest instanceof enterButton) isEnterButton(buttonToTest);
      }
    } else {
      //no buttons in play of that type
      sndPlugin.playSound("wrongmove");
      console.log("no buttons in play of that type");

      this.incantation.score -= 1;
      this.incantation.engine.backgroundColor = Color.Red;
      setTimeout(() => {
        this.incantation.engine.backgroundColor = Color.ExcaliburBlue;
      }, 250);
    }
    const debugTimer = this.incantation.engine.debug.useTestClock();
    debugTimer.stop();
  }
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

    this.handler = engine.input.keyboard.on("press", (evt: KeyEvent) => {
      if (evt.key === Keys.ArrowUp) target.buttonPress("upbutton");
      if (evt.key === Keys.ArrowDown) target.buttonPress("downbutton");
      if (evt.key === Keys.ArrowLeft) target.buttonPress("leftbutton");
      if (evt.key === Keys.ArrowRight) target.buttonPress("rightbutton");
      if (evt.key === Keys.Enter) target.buttonPress("enterbutton");
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

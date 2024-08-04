import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import { Engine, DisplayMode, KeyEvent, Subscription, Keys } from "excalibur";
import { downButton, enterButton, Incantation, IncantationSounds, IncConfig, leftButton, rightButton, upButton } from "./incantation";
import { JsfxrResource } from "@excaliburjs/plugin-jsfxr";
import { KeyboardManager } from "./Keyboard";
import { loader } from "./assets/resources";
import { ExState } from "./ExFSM";

document.addEventListener("incantationComplete", event => {
  let score = (event as CustomEvent).detail;
  if (score <= 0) score = 0;
  console.log(`Score: ${(event as CustomEvent).detail}`);
});

class mainBinding extends ExState {
  handler?: Subscription | undefined;
  constructor() {
    super("main");
  }
  enter(_previous: ExState | null, ...params: any): void | Promise<void> {
    const engine = params[0] as Engine;

    this.handler = engine.input.keyboard.on("press", (evt: KeyEvent) => {
      if (evt.key === Keys.Enter) {
        const config: IncConfig = {
          sequence: "random",
          speed: model.speed,
          engine: game,
          numberOfWidgets: Math.floor(Math.random() * 4 + 3), //numberOfWidgets: 6, //
          keyboardManager: myKeyboardManager,
          targetRegionBuffer: 0,
        };
        model.incantation = new Incantation(config);
        game.add(model.incantation);
      }

      if (evt.key === Keys.Space) {
        game.remove(model.incantation as Incantation);
        model.incantation = undefined;
      }
    });
  }
  exit(_next: ExState | null, ...params: any): void | Promise<void> {
    const engine = params[0] as Engine;
    this.handler?.close();
  }
}

export let sndPlugin = new JsfxrResource();
sndPlugin.init(); //initializes the JSFXR library
for (const sound in IncantationSounds) {
  sndPlugin.loadSoundConfig(sound, IncantationSounds[sound]);
}

const model = {
  incantation: undefined as undefined | Incantation,
  speed: 50,
};
const template = `
<style> 
    canvas{ 
        position: fixed; 
        top:50%; 
        left:50%; 
        transform: translate(-50% , -50%); 
    }
</style> 
<div> 
    <canvas id='cnv'> </canvas> 
    <input type='number' \${value<=>speed}/>
    
</div>`;
await UI.create(document.body, model, template).attached;
const game = new Engine({
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  canvasElementId: "cnv", // the DOM canvas element ID, if you are providing your own
  displayMode: DisplayMode.Fixed, // the display mode
});

let myKeyboardManager = new KeyboardManager(game);
myKeyboardManager.registerOwner(new mainBinding());
myKeyboardManager.setOwner("main");

await game.start(loader);

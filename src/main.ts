import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import { Engine, DisplayMode } from "excalibur";
import { downButton, enterButton, Incantation, IncantationSounds, IncConfig, leftButton, rightButton, upButton } from "./incantation";
import { JsfxrResource } from "@excaliburjs/plugin-jsfxr";
import { KeyboardManager } from "./Keyboard";
import { loader } from "./assets/resources";

export let sndPlugin = new JsfxrResource();
sndPlugin.init(); //initializes the JSFXR library
for (const sound in IncantationSounds) {
  sndPlugin.loadSoundConfig(sound, IncantationSounds[sound]);
}

const model = {
  launchIncantation: () => {
    const config: IncConfig = {
      sequence: [new leftButton(game), new upButton(game), new rightButton(game), new enterButton(game)], //"random",
      speed: 50,
      engine: game,
      //numberOfWidgets: 6, //Math.floor(Math.random() * 4 + 3)
      keyboardManager: myKeyboardManager,
    };
    const incantation = new Incantation(config);
    game.add(incantation);
  },
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
    <button \${click@=>launchIncantation}>Launch Incantation</button>
</div>`;
await UI.create(document.body, model, template).attached;
const game = new Engine({
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  canvasElementId: "cnv", // the DOM canvas element ID, if you are providing your own
  displayMode: DisplayMode.Fixed, // the display mode
});

let myKeyboardManager = new KeyboardManager(game);

await game.start(loader);

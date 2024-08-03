import { ImageSource, Loader, SpriteSheet } from "excalibur";

//@ts-ignore
import leftbutton from "../assets/leftbutton.png";
//@ts-ignore
import rightbutton from "../assets/rightbutton.png";
//@ts-ignore
import upbutton from "../assets/upbutton.png";
//@ts-ignore
import downbutton from "../assets/downbutton.png";
//@ts-ignore
import enterbutton from "../assets/enterbutton.png";

export const Resources = {
  leftbutton: new ImageSource(leftbutton),
  rightbutton: new ImageSource(rightbutton),
  upbutton: new ImageSource(upbutton),
  downbutton: new ImageSource(downbutton),
  enterbutton: new ImageSource(enterbutton),
} as const; // < -- as const is important to get strong typing!

export const loader = new Loader();

for (let res of Object.values(Resources)) {
  loader.addResource(res);
}

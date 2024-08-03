import { Engine } from "excalibur";
import { ExFSM, ExState } from "./ExFSM";

export class KeyboardManager {
  toggleState: number = 1;

  public fsm: ExFSM = new ExFSM();
  public constructor(public engine: Engine) {}

  setOwner(owner: ExState | string, ...params: any): boolean {
    if (!this.fsm.has(owner)) return false;
    this.fsm.set(owner, this.engine, params);
    return true;
  }

  getOwner(): ExState {
    return this.fsm.get();
  }

  registerOwner(state: ExState) {
    this.fsm.register(state);
  }

  public update() {
    this.fsm.update();
  }
}

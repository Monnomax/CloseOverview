import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import CloseOverviewController from "./src/closeOverviewController.js";

export default class CloseOverviewExtension extends Extension {
    enable() {
        this._controller = new CloseOverviewController(this.getSettings());
        this._controller.enable();
    }

    disable() {
        if (this._controller) {
            this._controller.disable();
            this._controller = null;
        }
    }
}

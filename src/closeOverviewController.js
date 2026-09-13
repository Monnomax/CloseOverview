import Clutter from "gi://Clutter";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class CloseOverviewController {
    constructor(settings) {
        this._settings = settings;
        this._handlerId = null;
    }

    enable() {
        this._handlerId = global.stage.connect(
            "button-press-event",
            (_actor, event) => this._handleButtonPress(event),
        );
    }

    disable() {
        if (this._handlerId !== null) {
            global.stage.disconnect(this._handlerId);
            this._handlerId = null;
        }

        this._settings = null;
    }

    _handleButtonPress(event) {
        if (!Main.overview.visible) return Clutter.EVENT_PROPAGATE;

        const button = event.get_button();

        /*
         * Middle click:
         * close the WindowPreview under the pointer.
         */
        if (button === 2) return this._handleMiddleClick(event);

        /*
         * Only left and right clicks can close Overview.
         */
        if (button !== 1 && button !== 3) return Clutter.EVENT_PROPAGATE;

        const setting =
            button === 1 ? "close-on-left-click" : "close-on-right-click";

        if (!this._settings.get_boolean(setting))
            return Clutter.EVENT_PROPAGATE;

        const [x, y] = event.get_coords();

        /*
         * Pick the actor that is actually reactive at the pointer.
         */
        const target = global.stage.get_actor_at_pos(
            Clutter.PickMode.REACTIVE,
            x,
            y,
        );

        /*
         * Nothing reactive under the pointer:
         * treat it as background.
         */
        if (!target) {
            Main.overview.hide();
            return Clutter.EVENT_STOP;
        }

        /*
         * Determine whether the reactive target represents
         * one of the Overview background areas.
         */
        if (this._isBackgroundTarget(target)) {
            Main.overview.hide();
            return Clutter.EVENT_STOP;
        }

        /*
         * An actual interactive object was clicked.
         * Let GNOME handle it normally.
         */
        return Clutter.EVENT_PROPAGATE;
    }

    _isBackgroundTarget(target) {
        /*
         * ---------------------------------------------------------
         * 1. Empty Overview background
         * ---------------------------------------------------------
         *
         * Here the reactive actor itself is overviewGroup.
         */
        if (
            typeof target.get_name === "function" &&
            target.get_name() === "overviewGroup"
        ) {
            return true;
        }

        /*
         * ---------------------------------------------------------
         * 2. Empty AppGrid background
         * ---------------------------------------------------------
         *
         * Important:
         * apps-scroll-view must be the ACTUAL reactive target.
         *
         * We must NOT search all ancestors for apps-scroll-view,
         * otherwise clicking a FolderIcon/AppIcon would incorrectly
         * be treated as a background click.
         */
        if (
            typeof target.get_style_class_name === "function" &&
            target.get_style_class_name() === "apps-scroll-view"
        ) {
            return true;
        }

        /*
         * ---------------------------------------------------------
         * 3. WindowPicker
         * ---------------------------------------------------------
         *
         * WindowPicker is different from AppGrid.
         * GNOME can return a Clutter.Actor inside the Workspace,
         * therefore we need to walk upward.
         *
         * But if we encounter a WindowPreview first, this is an
         * actual window and must NOT close Overview.
         */
        let current = target;

        while (current) {
            /*
             * Actual window preview.
             */
            if (current.constructor?.name === "WindowPreview") return false;

            /*
             * Workspace background.
             */
            if (
                typeof current.get_style_class_name === "function" &&
                current.get_style_class_name() === "window-picker"
            ) {
                return true;
            }

            current = current.get_parent?.() ?? null;
        }

        return false;
    }

    _handleMiddleClick(event) {
        const [x, y] = event.get_coords();

        const target = global.stage.get_actor_at_pos(
            Clutter.PickMode.ALL,
            x,
            y,
        );

        const windowPreview = this._getWindowPreview(target);

        if (windowPreview?.metaWindow) {
            windowPreview.metaWindow.delete(global.get_current_time());

            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _getWindowPreview(target) {
        if (!target) return null;

        let current = target;

        while (current) {
            if (current.constructor?.name === "WindowPreview") return current;

            current = current.get_parent?.() ?? null;
        }

        return null;
    }
}

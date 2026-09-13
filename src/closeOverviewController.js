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
            (actor, event) => this._handleButtonPress(event),
        );
    }

    disable() {
        if (this._handlerId) {
            global.stage.disconnect(this._handlerId);
            this._handlerId = null;
        }
        this._settings = null;
    }

    _handleButtonPress(event) {
        if (!Main.overview.visible) {
            return Clutter.EVENT_PROPAGATE;
        }

        const button = event.get_button();
        const leftClickEnabled = this._settings.get_boolean(
            "close-on-left-click",
        );
        const rightClickEnabled = this._settings.get_boolean(
            "close-on-right-click",
        );

        if (
            (button === 1 && leftClickEnabled) ||
            (button === 3 && rightClickEnabled)
        ) {
            const target = this._getEventTarget(event);

            if (this._isBackgroundClick(target)) {
                console.log(
                    `[Close Overview] Клік по фону (${target?.constructor.name}). Закриваємо.`,
                );
                Main.overview.hide();
                return Clutter.EVENT_STOP;
            }

            console.log(
                `[Close Overview] Клік по об'єкту: ${target?.constructor.name}. Ігноруємо.`,
            );
        } else if (button === 2) {
            const target = this._getEventTarget(event);
            const windowPreview = this._getWindowPreview(target);

            if (windowPreview && windowPreview.metaWindow) {
                console.log(
                    `[Close Overview] Закриваємо вікно середньою кнопкою миші.`,
                );
                windowPreview.metaWindow.delete(global.get_current_time());
                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _getEventTarget(event) {
        const [x, y] = event.get_coords();
        const target = global.stage.get_actor_at_pos(
            Clutter.PickMode.ALL,
            x,
            y,
        );
        if (target) return target;

        if (typeof event.get_source === "function") {
            return event.get_source();
        }

        return null;
    }

    _isBackgroundClick(target) {
        if (!target) return true;

        const ignoredTypes = [
            "BaseAppIcon",
            "WindowPreview",
            "SearchEntry",
            "Dash",
            "StButton",
            "AppIcon",
            "PrevPage",
            "NextPage",
            "PageButton",
            "PageIndicators",
            "page-indicator",
            "page-navigation-arrow",
            "page-navigation-hint",
            "previous",
            "next",
        ];

        let current = target;
        while (current) {
            const typeName = current.constructor.name || "";
            const name =
                typeof current.get_name === "function"
                    ? current.get_name()
                    : "";
            const safeName = name || "";
            const styleClass =
                typeof current.get_style_class_name === "function"
                    ? current.get_style_class_name()
                    : "";
            const safeStyleClass = styleClass || "";

            if (
                ignoredTypes.some(
                    (type) =>
                        typeName.toLowerCase().includes(type.toLowerCase()) ||
                        safeName.toLowerCase().includes(type.toLowerCase()) ||
                        safeStyleClass
                            .toLowerCase()
                            .includes(type.toLowerCase()),
                )
            ) {
                return false;
            }

            current = current.get_parent();
        }

        return true;
    }

    _getWindowPreview(target) {
        if (!target) return null;

        let current = target;
        while (current) {
            const typeName = current.constructor.name || "";
            if (typeName === "WindowPreview") {
                return current;
            }
            current = current.get_parent();
        }
        return null;
    }
}

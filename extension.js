import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

export default class CloseOverviewExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        // Використовуємо глобальну сцену (stage), щоб точно впіймати клік
        this._handlerId = global.stage.connect(
            "button-press-event",
            (actor, event) => {
                // Працюємо лише якщо Overview відкритий
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
                    } else {
                        console.log(
                            `[Close Overview] Клік по об'єкту: ${target?.constructor.name}. Ігноруємо.`,
                        );
                    }
                } else if (button === 2) {
                    // Закриття вікна середньою кнопкою миші
                    const target = this._getEventTarget(event);

                    const windowPreview = this._getWindowPreview(target);
                    if (windowPreview && windowPreview.metaWindow) {
                        // Додано перевірку на metaWindow
                        console.log(
                            `[Close Overview] Закриваємо вікно середньою кнопкою миші.`,
                        );
                        windowPreview.metaWindow.delete(
                            global.get_current_time(),
                        ); // Використовуємо metaWindow
                        return Clutter.EVENT_STOP;
                    }
                }
                return Clutter.EVENT_PROPAGATE;
            },
        );
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

    disable() {
        if (this._handlerId) {
            global.stage.disconnect(this._handlerId);
            this._handlerId = null;
        }
        this._settings = null;
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
            // Отримуємо назву класу (завжди рядок)
            const typeName = current.constructor.name || "";

            // Отримуємо ім'я об'єкта та пересвідчуємось, що це не null
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

            // Перевіряємо тип або ім'я (тепер безпечно, бо працюємо з рядками)
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

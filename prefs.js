import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio";

export default class CloseOverviewPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({
      title: "Налаштування кліків",
    });
    page.add(group);

    // Використовуємо Adw.ActionRow, який вже налаштований для GNOME 45+
    const leftClickRow = new Adw.ActionRow({ title: "Лівий клік" });
    const leftClickSwitch = new Gtk.Switch({
      active: settings.get_boolean("close-on-left-click"),
      valign: 3, // 3 - це числовий еквівалент Gtk.Align.CENTER
    });
    settings.bind(
      "close-on-left-click",
      leftClickSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
    leftClickRow.add_suffix(leftClickSwitch);
    group.add(leftClickRow);

    const rightClickRow = new Adw.ActionRow({ title: "Правий клік" });
    const rightClickSwitch = new Gtk.Switch({
      active: settings.get_boolean("close-on-right-click"),
      valign: 3,
    });
    settings.bind(
      "close-on-right-click",
      rightClickSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
    rightClickRow.add_suffix(rightClickSwitch);
    group.add(rightClickRow);

    window.add(page);
  }
}

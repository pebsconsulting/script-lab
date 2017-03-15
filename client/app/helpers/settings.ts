import { Storage, StorageType } from '@microsoft/office-js-helpers';
import { environment } from './environment';

class Settings {
    private _settings = new Storage<ISettings>('playground_settings', StorageType.LocalStorage);

    get notify() {
        return this._settings.notify;
    }

    set notify(value: (event?: StorageEvent) => void) {
        this._settings.notify = value;
    }

    get current() {
        if (environment.current && environment.current.host) {
            return this._settings.get(environment.current.host);
        }
        return null;
    }

    set current(value: ISettings) {
        if (environment.current && environment.current.host) {
            let updatedSettings = { ...this.current, ...value };
            this._settings.insert(environment.current.host, updatedSettings);
        }
    }

    reload() {
        this._settings.load();
    }
}

export const settings = new Settings();

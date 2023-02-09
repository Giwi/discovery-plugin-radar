/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { ChartType, DataModel, Param } from "@senx/discovery-widgets";
export { ChartType, DataModel, Param } from "@senx/discovery-widgets";
export namespace Components {
    interface DiscoveryPluginRadar {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<void>;
        "height": number;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "type": ChartType;
        "width": number;
    }
}
export interface DiscoveryPluginRadarCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryPluginRadarElement;
}
declare global {
    interface HTMLDiscoveryPluginRadarElement extends Components.DiscoveryPluginRadar, HTMLStencilElement {
    }
    var HTMLDiscoveryPluginRadarElement: {
        prototype: HTMLDiscoveryPluginRadarElement;
        new (): HTMLDiscoveryPluginRadarElement;
    };
    interface HTMLElementTagNameMap {
        "discovery-plugin-radar": HTMLDiscoveryPluginRadarElement;
    }
}
declare namespace LocalJSX {
    interface DiscoveryPluginRadar {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: DiscoveryPluginRadarCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "width"?: number;
    }
    interface IntrinsicElements {
        "discovery-plugin-radar": DiscoveryPluginRadar;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "discovery-plugin-radar": LocalJSX.DiscoveryPluginRadar & JSXBase.HTMLAttributes<HTMLDiscoveryPluginRadarElement>;
        }
    }
}
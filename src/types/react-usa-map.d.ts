declare module "react-usa-map" {
  import type { ComponentType, MouseEvent } from "react";

  export interface USAMapClickEvent extends MouseEvent<SVGElement> {
    target: EventTarget & { dataset: DOMStringMap };
  }

  export interface USAMapCustomize {
    [stateCode: string]: {
      fill?: string;
      clickHandler?: (event: USAMapClickEvent) => void;
    };
  }

  export interface USAMapProps {
    onClick?: (event: USAMapClickEvent) => void;
    width?: number;
    height?: number;
    title?: string;
    defaultFill?: string;
    customize?: USAMapCustomize;
  }

  const USAMap: ComponentType<USAMapProps>;
  export default USAMap;
}

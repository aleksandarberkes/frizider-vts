declare module '*.css';
declare module '*.svg';

declare module 'react-rating-stars-component' {
  import { ComponentType, ReactNode } from 'react';

  type ReactStarsProps = {
    count?: number;
    value?: number;
    size?: number;
    char?: string;
    isHalf?: boolean;
    edit?: boolean;
    a11y?: boolean;
    classNames?: string;
    activeColor?: string;
    color?: string;
    emptyIcon?: ReactNode;
    halfIcon?: ReactNode;
    filledIcon?: ReactNode;
    fullIcon?: ReactNode;
    onChange?: (newValue: number) => void;
  };

  const ReactStars: ComponentType<ReactStarsProps>;
  export default ReactStars;
}

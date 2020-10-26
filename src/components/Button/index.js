import { forwardRef } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { useAudio } from 'hooks';
import { blurOnMouseUp } from 'utils/focus';
import select from 'assets/sounds/select.mp3';
import click from 'assets/sounds/click.mp3';
import './index.css';

export const Button = forwardRef(
  (
    {
      className,
      as,
      secondary,
      children,
      rel,
      target,
      href,
      ...rest
    },
    ref
  ) => {
    const isExternalLink = href?.includes('://');
    const useLinkTag = isExternalLink || href?.[0] === '#';
    const linkComponent = useLinkTag ? 'a' : Link;
    const defaultComponent = href ? linkComponent : 'button';
    const Component = as || defaultComponent;
    const [, toggleSelect] = useAudio(select);
    const [, toggleClick] = useAudio(click);

    return (
      <Component
        className={classNames('button', className, {
          'button--secondary': secondary
        })}
        href={href && isExternalLink ? href : undefined}
        to={href && !isExternalLink ? href : undefined}
        rel={rel || isExternalLink ? 'noopener noreferrer' : undefined}
        target={target || isExternalLink ? '_blank' : undefined}
        onMouseUp={blurOnMouseUp}
        onMouseEnter={toggleSelect}
        onMouseDown={toggleClick}
        ref={ref}
        {...rest}
      >
        {!!children && <span className="button__text">{children}</span>}
      </Component>
    );
  }
);

export default Button;

import classNames from 'classnames';
import { useAudio } from 'hooks';
import select from 'assets/sounds/select.mp3';
import click from 'assets/sounds/click.mp3';
import './index.css';

const Input = ({
  label,
  value,
  className,
  style,
  ...rest
}) => {
  const [, toggleHover] = useAudio(select);
  const [, toggleClick] = useAudio(click);

  return (
    <input
      className={classNames('input', className)}
      style={style}
      aria-label={label}
      value={value}
      onMouseEnter={toggleHover}
      onMouseDown={toggleClick}
      {...rest}
    />
  );
};

export default Input;

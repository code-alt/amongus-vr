import React, { useState, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import Stars from 'components/Stars';
import { ReactComponent as Logo } from 'assets/logo.svg';
import Button from 'components/Button';
import Input from 'components/Input';
import { useFormInput } from 'hooks';
import hostIcon from 'assets/host.png';
import publicIcon from 'assets/public.png';
import privateIcon from 'assets/private.png';
import './index.css';

const Menu = () => {
  const [menuState, setMenuState] = useState('home');
  const username = useFormInput('');
  const code = useFormInput('');

  return (
    <section className="menu">
      <Helmet>
        <title>Among Us - VR</title>
        <meta
          name="description"
          content="A VR-ready recreation of the indie game: Among Us."
        />
      </Helmet>
      <Stars />
      {menuState === 'home' &&
        <Fragment>
          <div className="menu__content">
            <Logo className="menu__logo" />
            <div className="menu__buttons">
              <Button onClick={() => setMenuState('play')}>Play</Button>
            </div>
          </div>
          <Button
            className="menu__nav-button"
            onClick={() => window.close()}
          >
            Exit
          </Button>
        </Fragment>
      }
      {menuState === 'play' &&
        <Fragment>
          <div className="menu__content">
            <Input
              className="menu__username"
              placeholder="Username"
              {...username}
            />
            <div className="menu__item">
              <img
                className="menu__item-image"
                src={hostIcon}
                alt="Host Game"
              />
              <div className="menu__item-content">
                <label className="menu__item-label">Host</label>
                <div className="menu__item-divider" />
                <Button
                  secondary
                  className="menu__item-button"
                >
                  Create Game
                </Button>
              </div>
            </div>
            <div className="menu__item">
              <img
                className="menu__item-image"
                src={publicIcon}
                alt="Public Game"
              />
              <div className="menu__item-content">
                <label className="menu__item-label">Public</label>
                <div className="menu__item-divider" />
                <Button
                  secondary
                  className="menu__item-button"
                >
                  Find Game
                </Button>
              </div>
            </div>
            <div className="menu__item">
              <img
                className="menu__item-image"
                src={privateIcon}
                alt="Private Game"
              />
              <div className="menu__item-content">
                <label className="menu__item-label">Private</label>
                <div className="menu__item-divider" />
                <Input
                  className="menu__item-button"
                  placeholder="Enter Code"
                  style={{ width: '245px' }}
                  {...code}
                />
              </div>
            </div>
          </div>
          <Button
            className="menu__nav-button"
            onClick={() => setMenuState('home')}
          >
            Back
          </Button>
        </Fragment>
      }
    </section>
  );
};

export default Menu;

import React, { useState, useCallback, useMemo, useEffect, Fragment, Suspense } from 'react';
import classNames from 'classnames';
import { useHistory, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Stars from 'components/Stars';
import { ReactComponent as Logo } from 'assets/logo.svg';
import { ReactComponent as ChevronRight } from 'assets/chevronRight.svg';
import Button from 'components/Button';
import Input from 'components/Input';
import { useAppContext, useFormInput, useAudio } from 'hooks';
import prerender from 'utils/prerender';
import { database } from 'utils/firebase';
import { genCode } from 'utils/code';
import select from 'assets/sounds/select.mp3';
import click from 'assets/sounds/click.mp3';
import hostIcon from 'assets/host.png';
import publicIcon from 'assets/public.png';
import privateIcon from 'assets/private.png';
import skeld1 from 'assets/skeld1.png';
import skeld2 from 'assets/skeld2.png';
import skeld3 from 'assets/skeld3.png';
import skeldLabel from 'assets/skeld-label.png';
import miraLabel from 'assets/mira-label.png';
import polusLabel from 'assets/polus-label.png';
import skeldIcon from 'assets/skeld-icon.png';
import miraIcon from 'assets/mira-icon.png';
import polusIcon from 'assets/polus-icon.png';
import impostorIcon from 'assets/impostor-icon.png';
import playersIcon from 'assets/players-icon.png';
import './index.css';

const maps = ['The Skeld', 'Mira HQ', 'Polus'];

function filterLobbies(lobbies, mapFilter, impostorsFilter) {
  return lobbies.filter(({ settings }) =>
    mapFilter === maps.indexOf(settings.map) &&
    impostorsFilter === 'Any' ? true : impostorsFilter === settings.impostors
  );
}

const Menu = () => {
  const { username, dispatch } = useAppContext();
  const history = useHistory();
  const [version, setVersion] = useState();
  const [menuState, setMenuState] = useState('home');
  const [, toggleSelect] = useAudio(select);
  const [, toggleClick] = useAudio(click);
  const usernameInput = useFormInput(username);
  const codeInput = useFormInput('');
  const [lobbies, setLobbies] = useState([]);
  const [map, setMap] = useState(0);
  const [impostors, setImpostors] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [mapFilter, setMapFilter] = useState(0);
  const [impostorsFilter, setImpostorsFilter] = useState('Any');
  const recommendedPlayers = [null, 4, 7, 9];

  const createLobby = () => {
    if (!username || lobbies.filter(lobby => lobby.host === username)[0]) return;

    const id = genCode();

    const lobbyData = {
      id,
      host: username,
      settings: {
        map: maps[map],
        impostors,
        maxPlayers,
        confirmEjects: true,
        emergencyMeetings: 1,
        emergencyCooldown: 0,
        discussionTime: 15,
        votingtime: 120,
        playerSpeed: 1,
        crewmateVision: 1,
        impostorVision: 1.5,
        killCooldown: 45,
        killDistance: 'normal',
        visualTasks: true,
        commonTasks: 1,
        longTasks: 1,
        shortTasks: 2
      },
    };

    database.ref(`/lobbies/${id}`).set(lobbyData);
    database.ref(`/lobbies`).on('value', snap => {
      const data = snap.val();
      if (!data) return;

      setLobbies(Object.values(data));
    });

    return history.push(`/lobby/${id}`);
  };

  useEffect(() => {
    database.ref(`/lobbies`).on('value', snap => {
      const data = snap.val();
      if (!data) return;

      setLobbies(Object.values(data));
    });
  }, []);

  const onSubmit = useCallback(event => {
    event.preventDefault();
    if (lobbies.filter(({ id }) => id === codeInput.value).length === 0) return;

    return history.push(`/lobby/${codeInput.value}`);
  }, [lobbies, codeInput.value, history]);

  useEffect(() => {
    async function fetchVersion() {
      try {
        const response = await fetch('https://api.github.com/repos/CodyJasonBennett/amongus-vr');
        const { updated_at } = await response.json();
        const version = updated_at.replaceAll('-', '.').split('T')[0];

        return setVersion(`v${version}`);
      } catch (error) {
        console.error(error);
      }
    }

    fetchVersion();
  }, []);

  useMemo(() => {
    dispatch({ type: 'setUsername', value: usernameInput.value });
  }, [usernameInput.value, dispatch]);

  useMemo(() => {
    const minPlayers = recommendedPlayers[impostors];

    if (maxPlayers < minPlayers) {
      setMaxPlayers(minPlayers);
    }
  }, [maxPlayers, recommendedPlayers, impostors]);

  return (
    <section className="menu">
      <Helmet>
        <title>Among Us - VR</title>
        <meta
          name="description"
          content="A VR-ready recreation of the indie game: Among Us."
        />
      </Helmet>
      {!prerender &&
        <Suspense fallback={null}>
          <Stars />
        </Suspense>
      }
      <p className="menu__version">{version}</p>
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
              pattern=".{1,}"
              {...usernameInput}
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
                  onClick={() => setMenuState('create')}
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
                  onClick={() => setMenuState('public')}
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
                <form className="menu__item-input" onSubmit={onSubmit}>
                  <Input
                    className="menu__item-button"
                    placeholder="Enter Code"
                    style={{ width: '245px' }}
                    pattern=".{1,}"
                    required
                    {...codeInput}
                  />
                  <ChevronRight
                    onMouseEnter={toggleSelect}
                    onMouseDown={toggleClick}
                    onClick={onSubmit}
                  />
                </form>
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
      {menuState === 'create' &&
        <Fragment>
          <div className="menu__content">
            <img
              className="menu__map"
              alt={`Skeld with ${impostors} Impostor`}
              src={[skeld1, skeld2, skeld3][impostors - 1]}
            />
            <div className="menu__options">
              <div className="menu__option">
                <label className="menu__label">
                  Map:
                </label>
                <div className="menu__map-selector">
                  {[
                    {
                      name: 'Skeld',
                      src: skeldLabel
                    },
                    {
                      name: 'Mira HQ',
                      src: miraLabel,
                    },
                    {
                      name: 'Polus',
                      src: polusLabel,
                    },
                  ].map(({ name, src }, index) => (
                    <img
                      key={index}
                      className={classNames('menu__map-label', {
                        'menu__map-label--active': map === index
                      })}
                      alt={name}
                      src={src}
                      onClick={index === 0 ? () => setMap(index) : null}
                      onMouseDown={toggleClick}
                    />
                  ))}
                </div>
              </div>
              <div className="menu__option">
                <label className="menu__label">
                  Impostors:
                </label>
                {[1, 2, 3].map(count => (
                  <Button
                    key={count}
                    secondary
                    className={classNames('menu__option-button', {
                      'menu__option-button--disabled': impostors !== count
                    })}
                    onClick={() => setImpostors(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <div className="menu__option">
                <label className="menu__label">
                  Max Players:
                </label>
                {[4, 5, 6, 7, 8, 9, 10].map(count => (
                  <Button
                    key={count}
                    secondary
                    className={classNames('menu__option-button', {
                      'menu__option-button--disabled': maxPlayers !== count,
                      'menu__option-button--invalid': count < recommendedPlayers[impostors]
                    })}
                    onClick={count < recommendedPlayers[impostors] ? null : () => setMaxPlayers(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Button
            className="menu__nav-button"
            onClick={() => setMenuState('play')}
          >
            Cancel
          </Button>
          <Button
            className="menu__nav-button"
            style={{ right: '12px', left: 'unset' }}
            onClick={createLobby}
          >
            Confirm
          </Button>
        </Fragment>
      }
      {menuState === 'public' &&
      <Fragment>
        <div className="menu__content">
          <div className="menu__options">
            <div className="menu__option">
              <label className="menu__label">
                Map:
              </label>
              <div className="menu__map-selector">
                {[
                  {
                    name: 'Skeld',
                    src: skeldLabel
                  },
                  {
                    name: 'Mira HQ',
                    src: miraLabel,
                  },
                  {
                    name: 'Polus',
                    src: polusLabel,
                  },
                ].map(({ name, src }, index) => (
                  <img
                    key={index}
                    className={classNames('menu__map-label', {
                      'menu__map-label--active': mapFilter === index
                    })}
                    alt={name}
                    src={src}
                    onClick={index === 0 ? () => setMapFilter(index) : null}
                    onMouseDown={toggleClick}
                  />
                ))}
              </div>
            </div>
            <div className="menu__option">
              <label className="menu__label">
                Impostors:
              </label>
              {['Any', 1, 2, 3].map(count => (
                <Button
                  key={count}
                  secondary
                  className={classNames('menu__option-button', {
                    'menu__option-button--disabled': impostorsFilter !== count
                  })}
                  onClick={() => setImpostorsFilter(count)}
                  style={{ color: '#DD2200' }}
                >
                  {count}
                </Button>
              ))}
            </div>
            <div className="menu__lobby">
              <div className="menu__lobby-list">
                {filterLobbies(lobbies, mapFilter, impostorsFilter).length === 0 &&
                  <label className="menu__lobby-item-text">There aren't any active lobbies.</label>
                }
                {filterLobbies(lobbies, mapFilter, impostorsFilter).map(({ id, host, settings, players }) => (
                  <Link className="menu__lobby-item"
                    key={id}
                    onMouseEnter={toggleSelect}
                    onMouseDown={toggleClick}
                    to={`/lobby/${id}`}
                  >
                    <div className="menu__lobby-item-property">
                      <img
                        className="menu__lobby-item-icon"
                        src={[skeldIcon, miraIcon, polusIcon][maps.indexOf(settings.map)]}
                        alt="Map"
                      />
                      <label className="menu__lobby-item-text">{host}</label>
                    </div>
                    <div className="menu__lobby-item-properties">
                      <div className="menu__lobby-item-property">
                        <label className="menu__lobby-item-text" style={{ color: '#DD2200' }}>{settings.impostors}</label>
                        <img
                          className="menu__lobby-item-icon"
                          src={impostorIcon}
                          alt="Impostors"
                        />
                      </div>
                      <div className="menu__lobby-item-property">
                        <label className="menu__lobby-item-text">{Object.values(players || []).length}/{settings.maxPlayers}</label>
                        <img
                          className="menu__lobby-item-icon"
                          src={playersIcon}
                          alt="Players"
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Button
          className="menu__nav-button"
          onClick={() => setMenuState('play')}
        >
          Back
        </Button>
      </Fragment>
      }
    </section>
  );
};

export default Menu;

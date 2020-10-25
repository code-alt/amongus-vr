import React, { lazy, useState, useEffect, Fragment, Suspense } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAppContext } from 'hooks';
import { subscribeToEvent, sendEvent } from 'utils/socket';
import prerender from 'utils/prerender';
import lobby from 'assets/models/lobby.glb';
import skeld from 'assets/models/skeld.glb';
import astronaut from 'assets/models/astronaut.glb';
import start from 'assets/start.png';
import customize from 'assets/customize.png';

const Engine = lazy(() => import('components/Engine'));

const Lobby = () => {
  const { username } = useAppContext();
  const { params } = useRouteMatch();
  const { id } = params;
  const [invalid, setInvalid] = useState(!username || !id);
  const [loaded, setLoaded] = useState(false);
  const [inGame, setInGame] = useState();
  const [settings, setSettings] = useState();
  const ready = !prerender && loaded;
  const stage = inGame ? settings?.map : 'lobby';

  useEffect(() => {
    const onPool = (lobbies) => {
      const lobbyExists = lobbies?.filter(lobby => lobby.id === id)[0];
      if (!lobbyExists) return setInvalid(true);

      setInGame(lobbyExists.inGame);
      setSettings(lobbyExists.settings);
      setLoaded(true);
    };

    const onUpdate = ({ inGame, settings }) => {
      setInGame(inGame);
      setSettings(settings);
    };

    subscribeToEvent('lobbyPool', onPool);
    subscribeToEvent('lobbyUpdate', onUpdate);

    sendEvent('lobbyPool');
  }, [id]);

  if (invalid) return <Redirect to="/" />;

  return (
    <Fragment>
      <Helmet>
        <title>Among Us - VR | Lobby {id}</title>
        <link rel="prefetch" href={lobby} as="fetch" crossorigin="" />
        <link rel="prefetch" href={skeld} as="fetch" crossorigin="" />
        <link rel="prefetch" href={astronaut} as="fetch" crossorigin="" />
        <link rel="prefetch" href={start} as="fetch" crossorigin="" />
        <link rel="prefetch" href={customize} as="fetch" crossorigin="" />
      </Helmet>
      {(ready && !inGame) &&
        <Suspense fallback={null}>
          <Engine id={id} stage={stage} settings={settings} />
        </Suspense>
      }
      {(ready && inGame) &&
        <Suspense fallback={null}>
          <Engine id={id} stage={settings?.map} settings={settings} />
        </Suspense>
      }
    </Fragment>
  );
};

export default Lobby;

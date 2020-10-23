import React, { lazy, Fragment, Suspense } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAppContext } from 'hooks';
import prerender from 'utils/prerender';
import skeld from 'assets/models/skeld.glb';
import astronaut from 'assets/models/astronaut.glb';

const Engine = lazy(() => import('components/Engine'));

const Game = () => {
  const { username } = useAppContext();
  const match = useRouteMatch();
  const { id } = match.params;
  if (!username || !id) return <Redirect to="/" />;

  return (
    <Fragment>
      <Helmet>
        <title>Among Us - VR | Game {id}</title>
        <link rel="prefetch" href={skeld} as="fetch" crossorigin="" />
        <link rel="prefetch" href={astronaut} as="fetch" crossorigin="" />
      </Helmet>
      {!prerender &&
        <Suspense fallback={null}>
          <Engine id={id} stage="skeld" />
        </Suspense>
      }
    </Fragment>
  );
};

export default Game;

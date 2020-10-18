import React, { lazy, Fragment, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import prerender from 'utils/prerender';
import skeld from 'assets/skeld.glb';
import astronaut from 'assets/astronaut.glb';

const Game = lazy(() => import('components/game'));

const Home = () => (
  <Fragment>
    <Helmet>
      <title>Among Us - VR</title>
      <meta
        name="description"
        content="A VR-ready recreation of the indie game: Among Us."
      />
      <link rel="prefetch" href={skeld} as="fetch" crossorigin="" />
      <link rel="prefetch" href={astronaut} as="fetch" crossorigin="" />
    </Helmet>
    {!prerender &&
      <Suspense fallback={null}>
        <Game />
      </Suspense>
    }
  </Fragment>
);

export default Home;

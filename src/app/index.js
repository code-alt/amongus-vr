import React, { lazy, Suspense, useEffect, createContext, useReducer, Fragment } from 'react';
import { BrowserRouter, Switch, Route, useLocation } from 'react-router-dom';
import { Transition, config as transitionConfig } from 'react-transition-group';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import VCROSDMono from 'assets/fonts/vcr-osd-mono.woff2';
import AmongUs from 'assets/fonts/among-us.woff2';
import { useLocalStorage, usePrefersReducedMotion } from 'hooks';
import { initialState, reducer } from 'app/reducer';
import { reflow } from 'utils/transition';
import prerender from 'utils/prerender';
import './reset.css';
import './index.css';

const Menu = lazy(() => import('pages/Menu'));
const Lobby = lazy(() => import('pages/Lobby'));
const Game = lazy(() => import('pages/Game'));
const NotFound = lazy(() => import('pages/404'));

export const AppContext = createContext();

const repoPrompt = `Designed and developed by Cody Bennett\n\nCheck out the source code: https://github.com/CodyJasonBennett/amongus-vr`;

export const fontStyles = `
  @font-face {
    font-family: "VCR-OSD-Mono";
    src: url(${VCROSDMono}) format("woff");
    font-display: swap;
  }

  @font-face {
    font-family: "amongus";
    src: url(${AmongUs}) format("woff2");
    font-display: swap;
  }
`;

const App = () => {
  const [storedUsername] = useLocalStorage('username', null);
  const [storedColor] = useLocalStorage('color', null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      transitionConfig.disabled = true;
    } else {
      transitionConfig.disabled = false;
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!prerender) {
      console.info(`${repoPrompt}\n\n`);
    }

    window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    dispatch({ type: 'setUsername', value: storedUsername });
  }, [storedUsername]);

  useEffect(() => {
    dispatch({ type: 'setColor', value: storedColor });
  }, [storedColor]);

  return (
    <HelmetProvider>
      <AppContext.Provider value={{ ...state, dispatch }}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppContext.Provider>
    </HelmetProvider>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <Fragment>
      <Helmet>
        <link rel="canonical" href={`https://amongus.codyb.co${pathname}`} />
        <link rel="preload" href={VCROSDMono} as="font" crossorigin="" />
        <link rel="preload" href={AmongUs} as="font" crossorigin="" />
        <style>{fontStyles}</style>
      </Helmet>
      <Transition
        key={pathname}
        timeout={200}
        onEnter={reflow}
      >
        {status => (
          <Suspense fallback={<Fragment />}>
            <Switch location={location}>
              <Route exact path="/" component={Menu} />
              <Route exact path={['/lobby', '/lobby/:id']} component={Lobby} />
              <Route exact path={['/game', '/game/:id']} component={Game} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        )}
      </Transition>
    </Fragment>
  );
};

export default App;

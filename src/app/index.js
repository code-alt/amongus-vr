import React, { lazy, Suspense, useEffect, Fragment } from 'react';
import { BrowserRouter, Switch, Route, useLocation } from 'react-router-dom';
import { Transition, config as transitionConfig } from 'react-transition-group';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { usePrefersReducedMotion } from 'hooks';
import { reflow } from 'utils/transition';
import './reset.css';
import './index.css';

const Home = lazy(() => import('pages/Home'));

const App = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      transitionConfig.disabled = true;
    } else {
      transitionConfig.disabled = false;
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <Fragment>
      <Helmet>
        <link rel="canonical" href={`https://codyb.co${pathname}`} />
      </Helmet>
      <Transition
        key={pathname}
        timeout={200}
        onEnter={reflow}
      >
        {status => (
          <Suspense fallback={<Fragment />}>
            <Switch location={location}>
              <Route component={Home} />
            </Switch>
          </Suspense>
        )}
      </Transition>
    </Fragment>
  );
};

export default App;

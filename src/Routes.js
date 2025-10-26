import React from 'react';

import { JscadContextProvider } from './jscad_designer/components/JscadContext';

import { Routes, Route, Navigate } from 'react-router-dom';

import { RouteWithLayout } from './components';
import { Main as MainLayout, Minimal as MinimalLayout } from './layouts';

import {
  //Dashboard as DashboardView,
  Designer as DesignerView,
  //DesignerNeu as DesignerNeuView,
  NotFound as NotFoundView,
  Imprint as ImprintView,
  Tos as TosView,
  PrivacyPolicy as PrivacyPolicyView,
  CookiePolicy as CookiePolicyView
} from './views';

const RoutesComponent = () => {
  return (
    <JscadContextProvider>
      <Routes>
        {/**
      <RouteWithLayout
        component={DesignerView}
        exact
        layout={MainLayout}
        path="/alt"
      />
      <RouteWithLayout
        component={DashboardView}
        exact
        layout={MainLayout}
        path="/dashboard"
      />
      */}
        <Route
          path="/"
          element={
            <>
              <MainLayout>
                <DesignerView />
              </MainLayout>
            </>
          }
        />
        <Route />
        {/**
        <RouteWithLayout
          component={DesignerView}
          exact
          layout={MainLayout}
          path="/"
        />
        <RouteWithLayout
          component={NotFoundView}
          exact
          layout={MainLayout}
          path="/not-found"
        />
        <RouteWithLayout
          component={ImprintView}
          exact
          layout={MainLayout}
          path="/imprint"
        />
        <RouteWithLayout
          component={CookiePolicyView}
          exact
          layout={MainLayout}
          path="/cp"
        />
        <RouteWithLayout
          component={PrivacyPolicyView}
          exact
          layout={MainLayout}
          path="/pp"
        />
        <RouteWithLayout
          component={TosView}
          exact
          layout={MainLayout}
          path="/tos"
        />
        <Navigate to="/not-found" />
        */}
      </Routes>
    </JscadContextProvider>
  );
};

export default RoutesComponent;

import React, { lazy, Suspense } from 'react';

const LazyHistoryPage = lazy(() => import('./HistoryPage'));

const HistoryPage = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyHistoryPage {...props} />
  </Suspense>
);

export default HistoryPage;

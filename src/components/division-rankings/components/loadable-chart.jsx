import React from 'react';
import Loadable from 'react-loadable';

export default Loadable.Map({
  loader: {
    Chart: () => import('@kammy-ui/division-rankings-chart'),
  },
  loading() {
    return (
      <div>Loading Chart...</div>
    );
  },
  render(loaded, props) {
    const Chart = loaded.Chart.default;
    return <Chart { ...props } />;
  },
});

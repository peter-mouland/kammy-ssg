import React from 'react';
import PropTypes from 'prop-types';
import {
    LineChart, Line, CartesianGrid, YAxis, XAxis, Tooltip, Legend,
} from 'recharts';

const strokes = [
    '#8884d8',
    '#82ca9d',
    '#911a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff8f00',
    '#a65628',
    '#f781bf',
];

class Index extends React.Component {
  state = {
      width: 300,
      dataPoints: 5,
  };

  updateDimensions = () => {
      const { width } = this.state;
      if (window.screen.width < 400) {
          if (width !== 300) this.setState({ width: 300, dataPoints: 5 });
      } else if (window.screen.width < 500) {
          if (width !== 450) this.setState({ width: 350, dataPoints: 10 });
      } else if (window.screen.width < 700) {
          if (width !== 650) this.setState({ width: 450, dataPoints: 15 });
      } else if (window.screen.width < 800) {
          if (width !== 750) this.setState({ width: 650, dataPoints: 25 });
      } else if (width !== 800) this.setState({ width: 750, dataPoints: 50 });
  }

  componentDidMount() {
      this.updateDimensions();
      window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
      window.removeEventListener('resize', this.updateDimensions);
  }

  render() {
      const {
          data, xAxis, lines, highlightManager, lineType,
      } = this.props;
      const { width, dataPoints } = this.state;
      const lineChartData = data.slice(Math.max(0, data.length - dataPoints), data.length);

      return (
          <LineChart width={width} height={width / 2} data={lineChartData} style={{ margin: '0 auto' }}>
              <Legend verticalAlign="bottom" width={width} height={30} />
              {lines
                  .map((line, i) => (
                      <Line
                          key={line}
                          strokeWidth={highlightManager === line ? 5 : 1}
                          type={lineType}
                          dataKey={line}
                          stroke={strokes[i]}
                      />
                  ))
              }
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
          </LineChart>
      );
  }
}

Index.lineTypes = ['basis', 'basisClosed', 'basisOpen', 'linear', 'linearClosed', 'natural', 'monotoneX', 'monotoneY', 'monotone', 'step', 'stepBefore', 'stepAfter'];

Index.propTypes = {
    xAxis: PropTypes.string.isRequired,
    lines: PropTypes.array.isRequired,
    data: PropTypes.array,
    highlightManager: PropTypes.string,
    lineType: PropTypes.oneOf(Index.lineTypes),
};

Index.defaultProps = {
    data: [],
    highlightManager: '',
    lineType: 'basis',
};

export default Index;

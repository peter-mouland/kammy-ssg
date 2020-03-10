import bunyan from 'bunyan';

const getToday = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0'); // January is 0!
  const yyyy = now.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

function serializer(data) {
  const query = JSON.stringify(data.query);
  const options = JSON.stringify(data.options || data.doc);
  return `db.${data.coll}.${data.method}(${query}, ${options});`;
}

const log = bunyan.createLogger({
  name: 'kammy-ui',
  src: false,
  streams: [
    {
      level: 'debug',
      stream: process.stdout,
    },
    {
      level: 'info',
      path: `./mongo-${getToday()}.log`,
    },
  ],
  serializers: {
    dbQuery: serializer,
  },
});

export default function logger(coll, method, query, doc, options) {
  if (1 === 2 && process.env.NODE_ENV !== 'production') {
    log.info({
      dbQuery: {
        coll,
        method,
        query,
        doc,
        options,
      },
    });
  }
}

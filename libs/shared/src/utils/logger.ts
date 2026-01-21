import { LogLayer } from 'loglayer';
import { GoogleCloudLoggingTransport } from '@loglayer/transport-google-cloud-logging';
import { Logging } from '@google-cloud/logging';
import { serializeError } from 'serialize-error';

const logging = new Logging({ projectId: 'uplifted-time-474915-i6' });
const log = logging.log('verified-prof-log');

export const logger = new LogLayer({
  errorSerializer: serializeError,
  transport: new GoogleCloudLoggingTransport({
    logger: log,
  }),
});

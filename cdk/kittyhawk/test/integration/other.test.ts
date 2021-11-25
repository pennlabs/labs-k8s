import { Construct } from 'constructs';
import cronTime from 'cron-time-generator';
import { Application, DjangoApplication, ReactApplication, RedisApplication } from '../../src/application';
import { CronJob } from '../../src/cronjob';
import { chartTest } from '../utils';

export function buildWebsiteChart(scope: Construct) {

  /** Penn Labs Website
   * https://github.com/pennlabs/website/blob/master/k8s/values.yaml
   */
  new ReactApplication(scope, 'serve', {
    deployment: {
      image: 'pennlabs/website',
    },
    domain: 'pennlabs.org',
    ingressPaths: ['/'],
  });
}

export function buildBasicsChart(scope: Construct) {

  /** Penn Basics
   * https://github.com/pennlabs/penn-basics/blob/master/k8s/values.yaml
  */
  new ReactApplication(scope, 'react', {
    deployment: {
      image: 'pennlabs/penn-basics',
      secret: 'penn-basics',
    },
    portEnv: '80',
    domain: 'pennbasics.com',
    ingressPaths: ['/'],
  });
}


export function buildPlatformChart(scope: Construct) {

  /** Platform
   * https://github.com/pennlabs/platform/blob/master/k8s/values.yaml
   */

  const image = 'pennlabs/platform';
  const secret = 'platform';

  new DjangoApplication(scope, 'platform', {
    deployment: {
      image: image,
      secret: secret,
      secretMounts: [{ name: 'platform', subPath: 'SHIBBOLETH_CERT', mountPath: '/etc/shibboleth/sp-cert.pem' },
        { name: 'platform', subPath: 'SHIBBOLETH_KEY', mountPath: '/etc/shibboleth/sp-key.pem' }],
    },
    port: 443,
    domains: [{ host: 'platform.pennlabs.org', isSubdomain: true }],
    djangoSettingsModule: 'Platform.settings.production',
    ingressPaths: ['/'],
  });

  new CronJob(scope, 'clear-expired-tokens', {
    image: image,
    secret: secret,
    schedule: cronTime.everySundayAt(5),
    cmd: ['python3', 'manage.py', 'cleartokens'],
  });
}


export function buildCFAChart(scope: Construct) {

  /** Common Funding Application
   * https://github.com/pennlabs/common-funding-application/blob/master/k8s/values.yaml
   */
  new DjangoApplication(scope, 'django', {
    deployment: {
      image: 'pennlabs/common-funding-application',
      secret: 'common-funding-application',
    },
    domains: [{ host: 'penncfa.com' }],
    ingressPaths: ['/'],
    djangoSettingsModule: 'penncfa.settings.production',
  });
}


export function buildLabsAPIServerChart(scope: Construct) {
  /**
   * Labs API Server
   * https://github.com/pennlabs/labs-api-server/blob/master/k8s/values.yaml
   */
  const common = {
    image: 'pennlabs/labs-api-server',
    secret: 'labs-api-server',
  };
  new Application(scope, 'flask', {
    ...common,
    ingress: {
      rules: [{ host: 'api.pennlabs.org', paths: ['/'], isSubdomain: true }],
    },
    deployment: {
      image: common.image,
      secretMounts: [{ name: 'labs-api-server', subPath: 'ios-key', mountPath: '/app/ios_key.p8' }],
    },
  });

  new RedisApplication(scope, 'redis', { deployment: { tag: '5' }});

  new CronJob(scope, 'laundry', {
    ...common,
    schedule: cronTime.every(15).minutes(),
    cmd: ['python3', 'cron/save_laundry_data.py'],
  });

  new CronJob(scope, 'gsr-notifications', {
    ...common,
    schedule: '20,50 * * * *', // Not sure how to write this with cronTime
    cmd: ['python3', 'cron/send_gsr_push_notifications.py'],
    secretMounts: [{ name: 'labs-api-server', subPath: 'ios-key', mountPath: '/app/ios_key.p8' }],
  });
}

test('Penn Labs Website', () => chartTest(buildWebsiteChart));
test('Penn Basics', () => chartTest(buildBasicsChart));
test('Platform API', () => chartTest(buildPlatformChart));
test('CFA', () => chartTest(buildCFAChart));


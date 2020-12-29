import { Workflow, JobProps, CheckoutJob } from 'cdkactions';
import * as dedent from 'dedent-js';

/**
 * Optional props to configure the React check job.
 */
export interface ReactCheckJobProps {
  /**
   * Node version to test the project with.
   * @default "14"
   */
  nodeVersion?: string;

  /**
   * Location of the React project within the repo
   * @default "."
   */
  path?: string;
}

/**
 * A job to test a React project and upload code coverage.
 */
export class ReactCheckJob extends CheckoutJob {
  /**
   *
   * @param scope cdkactions Workflow instance.
   * @param config Optional configuration for the React check job.
   * @param overrides Optional overrides for the job.
   */
  public constructor(scope: Workflow, config?: ReactCheckJobProps, overrides?: Partial<JobProps>) {
    // Build config
    const fullConfig: Required<ReactCheckJobProps> = {
      nodeVersion: '14',
      path: '.',
      ...config,
    };


    // Create Job
    super(scope, 'react-check', {
      name: 'React Check',
      runsOn: 'ubuntu-latest',
      steps: [{
        name: 'Cache',
        uses: 'actions/cache@v2',
        with: {
          path: '**/node_modules',
          key: `v0-\${{ hashFiles('${fullConfig.path}/yarn.lock') }}`,
        },
      },
      {
        name: 'Install Dependencies',
        run: dedent`cd ${fullConfig.path}
        yarn install --frozen-lockfile`,
      },
      {
        name: 'Test',
        run: dedent`cd ${fullConfig.path}
        yarn test`,
      },
      {
        name: 'Upload Code Coverage',
        run: dedent`ROOT=$(pwd)
        cd ${fullConfig.path}
        yarn run codecov -p $ROOT -F frontend`,
      }],
      container: {
        image: `node:${fullConfig.nodeVersion}`,
      },
      ...overrides,
    });
  }
}

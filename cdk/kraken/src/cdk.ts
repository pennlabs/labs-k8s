import { CheckoutJob, Workflow, Stack, WorkflowProps } from 'cdkactions';
import { Construct } from 'constructs';
import dedent from 'ts-dedent';

/**
 * Optional props to configure the CDK publish stack.
 */
export interface CDKPublishStackProps {
  /**
   * Branch to restrict publishing to
   * @default master
   */
  defaultBranch?: string;

  /**
   * Node version to test the cdk application in
   * @default "14"
   */
  nodeVersion?: string;
}

/**
 * Test, upload code coverage for, and publish a cdk application.
 */
export class CDKPublishStack extends Stack {
  /**
   *
   * @param scope cdkactions App instance.
   * @param id Id of the job.
   * @param config Optional configuration for the cdk publish stack.
   * @param overrides Optional overrides for the stack.
   */
  public constructor(scope: Construct, id: string, config?: CDKPublishStackProps, overrides?: Partial<WorkflowProps>) {
    // Build config
    const fullConfig: Required<CDKPublishStackProps> = {
      defaultBranch: 'master',
      nodeVersion: '14',
      ...config,
    };
    const path = `cdk/${id}`;
    super(scope, id);
    const workflow = new Workflow(this, id, {
      name: `Publish ${id}`,
      on: {
        push: {
          paths: [`${path}/**`],
        },
      },
      ...overrides,
    });
    new CheckoutJob(workflow, 'publish', {
      runsOn: 'ubuntu-latest',
      steps: [{
        name: 'Cache',
        uses: 'actions/cache@v2',
        with: {
          path: '**/node_modules',
          key: `v0-\${{ hashFiles('${path}/yarn.lock') }}`,
        },
      },
      {
        name: 'Install Dependencies',
        run: dedent`cd ${path}
        yarn install --frozen-lockfile`,
      },
      {
        name: 'Test',
        run: dedent`cd ${path}
        yarn test`,
      },
      {
        name: 'Upload Code Coverage',
        run: dedent`ROOT=$(pwd)
        cd ${path}
        yarn run codecov -p $ROOT -F ${id}`,
      },
      {
        name: 'Publish to npm',
        run: dedent`cd ${path}
        yarn compile
        yarn package
        mv dist/js/*.tgz dist/js/kraken.tgz
        yarn publish --non-interactive --access public dist/js/kraken.tgz`,
        if: `github.ref == 'refs/heads/${fullConfig.defaultBranch}' && "$(npm info @pennlabs/kittyhawk version)" == "$(node -p "require('./package.json').version")"`,
        env: {
          NPM_AUTH_TOKEN: '${{ secrets.NPM_AUTH_TOKEN }}',
        },
      },
      {
        name: 'Build docs',
        run: dedent`cd ${path}
        yarn docgen`,
      },
      {
        name: 'Publish docs',
        if: `github.ref == 'refs/heads/${fullConfig.defaultBranch}'`,
        uses: 'peaceiris/actions-gh-pages@v3',
        with: {
          personal_token: '${{ secrets.BOT_GITHUB_PAT }}',
          external_repository: `pennlabs/${id}-docs`,
          cname: `${id}.pennlabs.org`,
          publish_branch: 'master',
          publish_dir: `${path}/docs`,
          user_name: 'github-actions',
          user_email: 'github-actions[bot]@users.noreply.github.com',
        },
      }],
      container: {
        image: `node:${fullConfig.nodeVersion}`,
      },
    });
  }
}

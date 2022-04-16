import { CheckoutJob, Workflow, JobProps } from "cdkactions";
import dedent from "ts-dedent";

/**
 * Optional props to configure the deploy job.
 */
export interface DeployJobProps {
  /**
   * Deploy tag to set in kittyhawk.
   * @default current git sha
   */
  deployTag?: string;

  /**
   * Branch to limit deploys to.
   * @default master
   */
  defaultBranch?: string;
}

/**
 * A job to deploy an application using Kittyhawk.
 */
export class DeployJob extends CheckoutJob {
  /**
   *
   * @param scope cdkactions Workflow instance
   * @param config Optional configuration for the deploy job.
   * @param overrides Optional overrides for the job.
   */
  public constructor(
    scope: Workflow,
    config?: DeployJobProps,
    overrides?: Partial<JobProps>
  ) {
    // Build config
    const fullConfig: Required<DeployJobProps> = {
      deployTag: "${{ github.sha }}",
      defaultBranch: "master",
      ...config,
    };

    super(scope, "deploy", {
      runsOn: "ubuntu-latest",
      if: `github.ref == 'refs/heads/${fullConfig.defaultBranch}'`,
      steps: [
        {
          name: 'Checkout kube-manifests',
          uses: 'actions/checkout@v2',
          with: {
            repository: 'pennlabs/kube-manifests',
            token: '${{ secrets.BOT_GITHUB_PAT }}',
            path: 'kube-manifests',
          }
        },
        {
          name: 'Configure git',
          run: dedent`git config --global user.name github-actions
          git config --global user.email github-actions[bot]@users.noreply.github.com"`
        },
        {
          id: 'synth',
          name: 'Synth cdk8s manifests',
          run: dedent`cd k8s
          yarn install --frozen-lockfile

          # get repo name (by removing owner/organization)
          export RELEASE_NAME=\${REPOSITORY#*/}

          # Export RELEASE_NAME as an output
          echo "::set-output name=RELEASE_NAME::$RELEASE_NAME"

          yarn build`,
          env: {
            GIT_SHA: fullConfig.deployTag,
            REPOSITORY: "${{ github.repository }}",
            AWS_ACCOUNT_ID: "${{ secrets.AWS_ACCOUNT_ID }}",
          },
        },
        {
          name: 'Push to kube-manifests repository',
          run: dedent`cd kube-manifests
          mkdir -p \${{ github.repository }}
          cp -r ../k8s/dist/ \${{ github.repository }}
          git add \${{ github.repository }}
          git commit -m "chore(k8s): deploy $RELEASE_NAME"
          git push`
        }        
      ],
      ...overrides,
    });
  }
}

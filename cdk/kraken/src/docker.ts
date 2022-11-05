import { CheckoutJob, Workflow, JobProps, StepsProps } from "cdkactions";
import { buildId, buildName } from "./utils";

/**
 * Props to configure the Docker publish job.
 */
export interface DockerPublishJobProps {
  /**
   * Image name to publish
   */
  imageName: string;

  /**
   * Path to the docker context
   * @default "."
   */
  path?: string;

  /**
   * Path to the dockerfile (relative to `path`)
   * @default "Dockerfile"
   */
  dockerfile?: string;

  /**
   * A condition on when to push the built image.
   * @default Only push on master.
   */
  push?: string;

  /**
   * Tags to apply to the built image.
   * @default latest and the current git sha.
   */
  tags?: string;

  /**
   * Username to authenticate with Docker Hub.
   * @default load the "DOCKER_USERNAME" GitHub Actions secret.
   */
  username?: string;

  /**
   * Password to authenticate with Docker Hub.
   * @default load the "DOCKER_PASSWORD" GitHub Actions secret.
   */
  password?: string;

  /**
   * If enabled, will cache_from the latest version of the docker image.
   * @default true
   */
  cache?: boolean;

  /**
   * If evaluates to true, do not publish docker image to Docker Hub.
   * Instead upload as an artifact.
   * @default false
   */
  noPublish?: boolean | string;
}

/**
 * A job to build and publish a Docker image.
 */
export class DockerPublishJob extends CheckoutJob {
  /**
   * Full name of the docker image built.
   */
  public readonly dockerImageName: string;

  /**
   *
   * @param scope cdkactions Workflow instance.
   * @param id Id of the job.
   * @param config Configuration for the docker publish job.
   * @param overrides Optional overrides for the job.
   */
  public constructor(
    scope: Workflow,
    id: string,
    config: DockerPublishJobProps,
    overrides?: Partial<JobProps>
  ) {
    // Build config
    const fullConfig: Required<DockerPublishJobProps> = {
      path: ".",
      push: "${{ github.ref == 'refs/heads/master' }}",
      tags: "latest,${{ github.sha }}",
      username: "${{ secrets.DOCKER_USERNAME }}",
      password: "${{ secrets.DOCKER_PASSWORD }}",
      dockerfile: "Dockerfile",
      cache: true,
      noPublish: false,
      ...config,
    };
    const formattedName = fullConfig.noPublish
      ? buildName("Build", id)
      : buildName("Publish", id);
    const formattedId = fullConfig.noPublish
      ? buildId("build", id)
      : buildId("publish", id);
    // Define docker action with
    const imageName = `pennlabs/${fullConfig.imageName}`;
    const dockerWith: any = {
      context: fullConfig.path,
      file: `${fullConfig.path}/${fullConfig.dockerfile}`,
      push: fullConfig.push,
      "cache-from": "type=local,src=/tmp/.buildx-cache",
      "cache-to": "type=local,dest=/tmp/.buildx-cache",
    };
    if (fullConfig.cache) {
      dockerWith["cache-from"] = dockerWith["cache-from"].concat(
        `,type=registry,ref=${imageName}:latest`
      );
    }

    // Build tags string
    const tagsString = (tags: string) =>
      tags
        .split(",")
        .map((tag) => `${imageName}:${tag}`)
        .join();
    dockerWith.tags = tagsString(fullConfig.tags);

    // Define steps
    const steps: StepsProps[] = [
      {
        uses: "docker/setup-qemu-action@v1",
      },
      {
        uses: "docker/setup-buildx-action@v1",
      },
      {
        name: "Cache Docker layers",
        uses: "actions/cache@v2",
        with: {
          path: "/tmp/.buildx-cache",
          key: `buildx-${formattedId}`,
        },
      },
      {
        uses: "docker/login-action@v1",
        with: {
          username: fullConfig.username,
          password: fullConfig.password,
        },
      },
      {
        name: "Build/Publish",
        uses: "docker/build-push-action@v2",
        with: dockerWith,
      },
    ];

    // If publishing isn't wanted
    if (fullConfig.noPublish) {
      dockerWith.push = false;
      dockerWith.outputs = "type=docker,dest=/tmp/image.tar";
      steps.push({
        uses: "actions/upload-artifact@v2",
        with: {
          name: formattedId,
          path: "/tmp/image.tar",
        },
      });
      steps.splice(3, 1);
    }

    // Create job
    super(scope, formattedId, {
      name: formattedName,
      runsOn: "ubuntu-latest",
      steps,
      ...overrides,
    });

    // Set public fields
    this.dockerImageName = imageName;
  }
}
